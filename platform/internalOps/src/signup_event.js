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

exports.handler = async (event, context, callback) => {
  console.log(" event :: ", event);
  const { email, phone_number, given_name, middle_name, family_name } =
    event.request.userAttributes;
  const idInternalOpsProfile = nanoid();
  const entries = {
    Entries: [
      {
        DetailType: "UserCreated",
        Source: "admin.users",
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
      if (err) console.log(err, err.stack); // an error occurred
      else console.log(data); // successful response
    });
    const sepNumber = new libphonenumber.AsYouType().input(phone_number);
    const newNumArr = sepNumber.split(" ");
    const countryCode = newNumArr.shift();
    const finalNumber = `${countryCode} ${newNumArr.join("")}`;
    console.log(finalNumber);

    const internalOpsProfileParamsInsert = {
      TableName: process.env.InternalOpsTable,
      Item: {
        userId: event.userName,
        email,
        firstName: given_name,
        middleName: middle_name,
        lastName: family_name,
        phoneNumber: finalNumber,
        id: idInternalOpsProfile,
      },
    };
    await ddb
      .put(internalOpsProfileParamsInsert)
      .promise()
      .catch((err) => console.log(err));
    callback(null, event);
    return {
      statusCode: 200,
      body: JSON.stringify(event),
    };
  } catch (e) {
    console.log(e);
    callback(null, event);
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
};
