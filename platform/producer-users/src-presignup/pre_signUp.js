const AWS = require("aws-sdk");
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
});

exports.handler = async (event, context, callback) => {
  console.log(event.request.userAttributes);
  const { phone_number, email } = event.request.userAttributes;

  const paramsPhoneNumber = {
    UserPoolId: event.userPoolId,
    AttributesToGet: ["phone_number"],
    Filter: `phone_number = "${phone_number}"`,
  };

  const paramsEmail = {
    UserPoolId: event.userPoolId,
    AttributesToGet: ["email"],
    Filter: `email = "${email}"`,
  };

  try {
    const dataPhoneNumber = await cognitoidentityserviceprovider
      .listUsers(paramsPhoneNumber)
      .promise();

    const dataEmail = await cognitoidentityserviceprovider
      .listUsers(paramsEmail)
      .promise();

    let error = null;

    if (dataPhoneNumber.Users.length > 0) {
      error = new Error("A user with this phone number already exists");
    }

    if (dataEmail.Users.length > 0) {
      error = new Error("A user with this email address already exists");
    }

    console.log(error);

    if (error) callback(error, event);
    else {
      console.log("Passed pre sign up");
      callback(null, event);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(event),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};
