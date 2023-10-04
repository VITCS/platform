/* eslint-disable-line */ const aws = require("aws-sdk");
/* eslint-disable-line */ const {
  EventBridgeClient,
  ActivateEventSourceCommand,
} = require("@aws-sdk/client-eventbridge");

const REGION = process.env.AWS_REGION;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;
const ddb = new aws.DynamoDB.DocumentClient();
const eb = new aws.EventBridge();
const ebClient = new EventBridgeClient({ region: REGION });
const { customAlphabet } = require("nanoid");
const alphabet = "0123456789";
const idSize = 16;
const nanoid = customAlphabet(alphabet, idSize);
const libphonenumber = require("libphonenumber-js");

exports.handler = async (event, context) => {
  console.log(event);

  const { email, phone_number, given_name, family_name, middle_name } =
    event.request.userAttributes;
  const idMerchantUser = nanoid();
  const idMerchantAccount = nanoid();

  const entries = {
    Entries: [
      {
        DetailType: "UserCreated",
        Source: "merchant.users",
        Time: new Date().toISOString(),
        Resources: [event.userPoolId + "/" + event.userName],
        Detail: JSON.stringify({
          userPoolId: event.userPoolId,
          userId: event.userName,
          ...event.request.userAttributes,
        }),
        EventBusName: EVENT_BUS_NAME,
      },
    ],
  };

  try {
    console.log(entries);
    eb.putEvents(entries, function (err, data) {
      if (err) console.log(err, err.stack);
      // an error occurred
      else console.log(data); // successful response
    });

    const sepNumber = new libphonenumber.AsYouType().input(phone_number);
    const newNumArr = sepNumber.split(" ");
    const countryCode = newNumArr.shift();
    const finalNumber = `${countryCode} ${newNumArr.join("")}`;
    console.log(finalNumber);

    const getUserParams = {
      TableName: process.env.MerchantUserTable,
      Key: {
        userId: event.userName,
      },
    };

    const user = await ddb.get(getUserParams).promise();

    if (JSON.stringify(user) === "{}") {
      const merchantUserParamsInsert = {
        TableName: process.env.MerchantUserTable,
        Item: {
          userId: event.userName,
          email,
          phoneNumber: finalNumber,
          firstName: given_name,
          middleName: middle_name,
          lastName: family_name,
          storeCount: 0,
          id: idMerchantUser,
          userRole: "Merchant_Super_user",
          merchantAccountId: idMerchantAccount,
        },
      };

      const merchantAccountParamsInsert = {
        TableName: process.env.MerchantAccountTable,
        Item: {
          id: idMerchantAccount,
          ownerId: event.userName,
          accountStatus: "NEW",
          companyName: "",
          contactEmail: email,
          contactName: "",
          contactPhoneNumber: "",
          feinNumber: "",
        },
      };

      await ddb
        .put(merchantUserParamsInsert)
        .promise()
        .catch((err) => console.log(err));

      await ddb
        .put(merchantAccountParamsInsert)
        .promise()
        .catch((err) => console.log(err));
    }

    return {
      statusCode: 200,
      body: JSON.stringify(event),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
};
