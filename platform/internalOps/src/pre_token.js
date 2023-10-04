/* eslint-disable-line */ const aws = require("aws-sdk");
/* eslint-disable-line */ const {
  EventBridgeClient,
  ActivateEventSourceCommand,
} = require("@aws-sdk/client-eventbridge");

const REGION = process.env.AWS_REGION;
//const userGroupTable = process.env.APPLICATION + "-" + process.env.ENVIRONMENT + "-" + "MerchantUserGroup";
const userTable =
  process.env.APPLICATION + "-" + process.env.ENVIRONMENT + "-" + "InternalOps";

exports.handler = async (event, context, callback) => {
  //Debug Statement
  //console.log(event);

  //  var ddb = new aws.DynamoDB({ apiVersion: '2012-08-10' });

  const ddb = new aws.DynamoDB.DocumentClient();

  // Get the Account Id for the User from the User Table

  var dbParms = {
    Key: {
      userId: event.userName,
    },
    TableName: userTable,
    ProjectionExpression: "userId, userGroup",
  };

  let resp;
  let userId;
  let userGroup;
  try {
    resp = await ddb.get(dbParms).promise();
    userId = resp.Item.userId;
    userGroup = resp.Item.userGroup;
  } catch (e) {
    console.log(e);
  }

  // Get Groups associated from the Groups table
  // var dbParms = {
  //   "TableName": userGroupTable,
  //   "IndexName": "byUser",
  //   "ReturnConsumedCapacity": "TOTAL",
  //   "Limit": 50,
  //   "KeyConditionExpression": "userId = :userId",
  //   "ExpressionAttributeValues": {
  //     ":userId": event.userName
  //   }
  // }

  resp;
  let claimsToOverride = { m_account: userId, m_group: userGroup };
  let groupsToOverride = [userGroup];

  // console.log(claimsToOverride);
  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: claimsToOverride,
      groupOverrideDetails: {
        groupsToOverride: [
          ...event.request.groupConfiguration.groupsToOverride,
          ...groupsToOverride,
        ],
      },
    },
  };

  console.log(event);
  // Return to Amazon Cognito
  callback(null, event);
};
