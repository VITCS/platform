/*
  this file will loop through all js modules which are uploaded to the lambda resource,
  provided that the file names (without extension) are included in the "MODULES" env variable.
  "MODULES" is a comma-delimmited string.
*/
const signup = require("./signup_event");
exports.handler = async (event, context, callback) => {
  let rtn = "";
try{
  rtn =  await signup.handler(event, context, callback);
    // Return to Amazon Cognito
  callback(null, event);
}catch(e){
  return {
    statusCode: 500,
    body: JSON.stringify(e)
  }
}

};
