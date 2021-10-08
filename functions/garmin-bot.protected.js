const handleWeatherInvocation = require('./garmin-bot/weather.private.js')
const handleClosuresInvocation = require('./garmin-bot/closures.private.js')

exports.handler = async function (context, event, callback) {
  // TO DO: Add a whitelist of phone numbers, and block all others,
  // to avoid Twilio expenses. Numbers cannot actually be blocked
  // in Twilio itself, unfortunately, but at least we can prevent
  // sending unauthorized outbound messages.

  const incomingMessage = event.Body;

  // All InReach messages include `  - ${user's name}` at the end,
  // so strip that off
  let invocation = incomingMessage.split("  - ")[0].trim();
  let inReachSlug = null;

  // The user may have location sharing turned on, in which case
  // there will also be an ` inreachlink.com/#######` before the
  // `  - ${user's name}`
  if (incomingMessage.includes("inreachlink.com")) {
    inReachSlug = incomingMessage.match(/inreachlink\.com\/([A-Z|\d]{7})/)[1];
    invocation = invocation.split(" inreachlink.com")[0].trim();
  }
  invocation = invocation.toLowerCase();

  // TO DO: Add invocations for air quality, sports scores, Wikipedia
  if (invocation.includes("weather")) {
    if (inReachSlug === null) {
      const twiml = new Twilio.twiml.MessagingResponse();
      twiml.message(
        "Error: You must include your InReach location link in your text message"
      );
      return callback(null, twiml);
    }

    const daysMatch = invocation.match(/\d+/);
    const days = Array.isArray(daysMatch) ? daysMatch[0] : 2;
    return await handleWeatherInvocation(inReachSlug, days, callback);
  } else if (invocation.includes("closures")) {
    return await handleClosuresInvocation(invocation, callback);
  } else {
    const twiml = new Twilio.twiml.MessagingResponse();
    twiml.message(
      "Error: Your text must include which information you want; available options: `weather`, `closures`"
    );
    return callback(null, twiml);
  }
};
