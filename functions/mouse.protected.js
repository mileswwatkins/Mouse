const Twilio = require("twilio");

const handler = async function (context, event, callback) {
  // Need to use this syntax to `require` these `private`
  // handler/helper functions
  const {
    handleInvocation: handleWeatherInvocation,
  } = require(Runtime.getFunctions()["weather"].path);
  const {
    handleInvocation: handleClosuresInvocation,
  } = require(Runtime.getFunctions()["closures"].path);
  const {
    handleInvocation: handleWikipediaInvocation,
  } = require(Runtime.getFunctions()["wikipedia"].path);

  const twiml = new Twilio.twiml.MessagingResponse();

  const message = event.Body;
  if (typeof message === "undefined") {
    twiml.message(
      "Error: No message found, make sure one is sent in the HTTP request"
    );
    return callback(null, twiml);
  }

  const invocation = getInvocationFromMessage(message);

  if (invocation.includes("weather")) {
    return await handleWeatherInvocation(invocation, callback);
  } else if (invocation.includes("closures")) {
    return await handleClosuresInvocation(invocation, callback);
  } else if (invocation.includes("wikipedia")) {
    return await handleWikipediaInvocation(invocation, callback);
  } else {
    twiml.message(
      "Error: Your text must include which information you want; options are: `weather`, `closures`, `wikipedia`"
    );
    return callback(null, twiml);
  }
};

const getInvocationFromMessage = (message) => {
  // All InReach messages include ` - ${user's name}` at the end,
  // so strip that off
  const invocation = message
    .split(/ {1,3}- /)[0]
    .trim()
    .toLowerCase();

  return invocation;
};

module.exports = {
  handler,
  getInvocationFromMessage,
};
