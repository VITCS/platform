/* eslint-disable-line */ const aws = require("aws-sdk");
const cognitoIdentityServiceProvider = new aws.CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
});
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
  // console.log(event);
  // console.log(context);
console.log("getRemainingTimeInMillis() ",context.getRemainingTimeInMillis()," event.triggerSource :: ",event.triggerSource);
  if (event.triggerSource !== "PostConfirmation_ConfirmForgotPassword") {
    console.log(" inside if event trigger")
    try{
    const addlSignupData = JSON.parse(
      event.request.userAttributes["custom:addlSignupData"]
    );
    const addlPaymentDetails = JSON.parse(
      event.request.userAttributes["custom:addlPaymentDetails"]
    );
    const fullNameArr =
      event.request.userAttributes["custom:fullName"].split(" ");

    let firstName, middleName, lastName;

    if (fullNameArr.length === 3) {
      firstName = fullNameArr[0];
      middleName = fullNameArr[1];
      lastName = fullNameArr[2];
    } else {
      firstName = fullNameArr[0];
      lastName = fullNameArr[1];
      middleName = "";
    }
    
console.log(" after addlSignupData capture ")
    const { email, phone_number, given_name, middle_name, family_name } =
      event.request.userAttributes;
    const { cardHolderName, defaultCard, cardNumber, postalCode, expDate } =
      addlPaymentDetails.paymentSetup;
    const idCustomerProfile = nanoid();
    const idCustomerContact = nanoid();
    const idCustomerPaymentSetup = nanoid();
    const idCustomerAddress = nanoid();
    console.log(
      ":: addlSignupData ::" +
        addlSignupData +
        " :: addlPaymentDetails :: " +
        addlPaymentDetails
    );
    const entries = {
      Entries: [
        {
          DetailType: "UserCreated",
          Source: "customer.users", // to be disc
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

    
      //console.log(entries);
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

      const customerProfileParamsInsert = {
        TableName: process.env.CustomerProfileTable,
        Item: {
          userId: event.userName,
          email,
          firstName: given_name,
          middleName: middle_name,
          lastName: family_name,
          phoneNumber: finalNumber,
          id: idCustomerProfile,
          deliveryTo: true,
          notificationDefault: true,
          replacementDefault:true,
          deliveryToId: idCustomerAddress,
          createdAt: new Date().toISOString(),
        },
      };

      const customerContactParamsInsert = {
        TableName: process.env.CustomerContactTable,
        Item: {
          id: idCustomerContact,
          userId: event.userName,
          firstName: given_name,
          lastName: family_name,
          middleName: middle_name,
          email,
          addressType: addlSignupData.deliveryContact.addressType,
          customType: addlSignupData.deliveryContact.ContactCategory ? addlSignupData.deliveryContact.ContactCategory : '',
          deliveryAddress: addlSignupData.deliveryContact.address,
          phoneNumber: finalNumber,
          defaultAddressId: idCustomerAddress,
          contactCategory: "Self",
          createdAt: new Date().toISOString(),
        },
      };

      const customerPaymentSetupParamsInsert = {
        TableName: process.env.CustomerPaymentTable,
        Item: {
          id: idCustomerPaymentSetup,
          userId: event.userName,
          cardHolderName,
          cardNumber,
          expDate,
          postalCode,
          cardDefault: defaultCard,
          createdAt: new Date().toISOString(),
        },
      };

      const newAddress = { ...addlSignupData.deliveryContact.address };
      delete newAddress.addrState;

      const customerAddressParamsInsert = {
        TableName: process.env.CustomerAddressTable,
        Item: {
          id: idCustomerAddress,
          firstName,
          middleName,
          lastName,
          createdAt: new Date().toISOString(),
          addressType: addlSignupData.deliveryContact.addressType,
          customType: addlSignupData.deliveryContact.ContactCategory ? addlSignupData.deliveryContact.ContactCategory : '',
          customerContactId: idCustomerContact,
          state: addlSignupData.deliveryContact.address.addrState,
          ...newAddress,
        },
      };

      await ddb
        .put(customerProfileParamsInsert)
        .promise()
        .catch((err) => console.log(err));

      await ddb
        .put(customerContactParamsInsert)
        .promise()
        .catch((err) => console.log(err));

      if (cardHolderName && cardNumber && expDate && postalCode && defaultCard)
        await ddb
          .put(customerPaymentSetupParamsInsert)
          .promise()
          .catch((err) => console.log(err));

      await ddb
        .put(customerAddressParamsInsert)
        .promise()
        .catch((err) => console.log(err));

      // callback(null, event);
      const params = {
        UserPoolId: event.userPoolId,
        Username: event.userName,
        // this parameter needs to be an array
        UserAttributes: [
          {
            Name: "custom:addlSignupData",
            Value: "",
          },
          {
            Name: "custom:addlPaymentDetails",
            Value: "",
          },
        ],
      };
      await cognitoIdentityServiceProvider
        .adminUpdateUserAttributes(params)
        .promise();
        console.log(" calling the callback context.getRemainingTimeInMillis() : ", context.getRemainingTimeInMillis())
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
  } else {
    return {
      statusCode: 200,
      body: JSON.stringify(event),
    };
  }
};
