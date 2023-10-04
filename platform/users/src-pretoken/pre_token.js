/* eslint-disable-line */ const aws = require('aws-sdk');
/* eslint-disable-line */ const { EventBridgeClient, ActivateEventSourceCommand } = require("@aws-sdk/client-eventbridge");

const REGION = process.env.AWS_REGION;
const userStoreTable = process.env.APPLICATION + "-" + process.env.ENVIRONMENT + "-" + "MerchantUserStore";
const userTable = process.env.APPLICATION + "-" + process.env.ENVIRONMENT + "-" + "MerchantUser";

exports.handler = async (event, context, callback) => {
  //Debug Statement
  //console.log(event);

  //  var ddb = new aws.DynamoDB({ apiVersion: '2012-08-10' });

  const ddb = new aws.DynamoDB.DocumentClient();


  // Get the Account Id for the User from the User Table

  var dbParms = {
    "Key": {
      "userId": event.userName
    },
    "TableName": userTable,
    ProjectionExpression: "userId, merchantAccountId, userRole"
  }

  let resp;
  let merchantAccountId;
  let userRole;
  try {
    resp = await ddb.get(dbParms).promise();
    merchantAccountId = resp.Item.merchantAccountId;
    userRole = resp.Item.userRole;
  } catch (e) {
    console.log(e);
  }


  // Get Stores associated from the Merchant User store table
  var dbParms = {
    "TableName": userStoreTable,
    "IndexName": "byUser",
    "ReturnConsumedCapacity": "TOTAL",
    "Limit": 50,
    "KeyConditionExpression": "userId = :userId",
    "ExpressionAttributeValues": {
      ":userId": event.userName
    }
  }

  resp;
  let claimsToOverride = { "m_account": merchantAccountId, "m_group": userRole };
  let rolesToOverride = [userRole];
  let stores = [];
  try {
    resp = await ddb.query(dbParms).promise();
    for (var i = 0; i < resp.Items.length; i++) {
      const item = resp.Items[i];
      if (item.storeId) {
        stores.push(item.storeId);
        rolesToOverride.push(item.storeId);
      }
    }
  } catch (e) {
    console.log(e);
  }
  // Add list of stores as comma separated values to the m_stores claim
  claimsToOverride["m_stores"] =  stores.join(",") ;

  // console.log(claimsToOverride);
  event.response = {
    "claimsOverrideDetails": {
      "claimsToAddOrOverride": claimsToOverride,
      "groupOverrideDetails": {
        "groupsToOverride": [
          ...event.request.groupConfiguration.groupsToOverride,
          ...rolesToOverride
        ]
      }
    }
  };

  console.log(event);
  // Return to Amazon Cognito
  callback(null, event);
};
