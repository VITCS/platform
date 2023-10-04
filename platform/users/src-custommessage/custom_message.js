exports.handler = async (event, context, callback) => {
  console.log(event);

  if (event.triggerSource === "CustomMessage_SignUp") {
    event.response.smsMessage = `Welcome to 1800 spirits. Your confirmation code is ${event.request.codeParameter}. Kindly, contact your head for further process`;
  }

  console.log("After modification :: ", event);

  context.done(null, event);
};
