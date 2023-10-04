/* eslint-disable-line */ const aws = require('aws-sdk');
/* eslint-disable-line */ const { EventBridgeClient, ActivateEventSourceCommand } = require("@aws-sdk/client-eventbridge");

const REGION = process.env.AWS_REGION;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;
const ddb = new aws.DynamoDB();
const eb = new aws.EventBridge();
const ebClient = new EventBridgeClient({ region: REGION });

exports.handler = async (event, context) => {

  const entries = {
    "Entries":[
    {
    "DetailType": "UserCreated",
    "Source": "admin.users",
    "Time": new Date().toISOString(),
    "Resources": [event.userPoolId + "/" + event.userName],
    "Detail": JSON.stringify({
      "userPoolId": event.userPoolId,
      "userId": event.userName,
        ...event.request.userAttributes
    }),
    "EventBusName": EVENT_BUS_NAME
  }]};

  try {
    console.log(entries);
    eb.putEvents(entries, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
    return {
      statusCode: 200,
      body: JSON.stringify(event)
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify(e)
    }
  }
 
};
