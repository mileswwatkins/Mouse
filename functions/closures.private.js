const { maxLengthIfGsm7Encoding } =
  typeof Runtime === "undefined"
    ? require("./utils.private.js")
    : require(Runtime.getFunctions()["utils"].path);
const {
  makeAllClosuresMessage: makePctAllClosuresMessage,
  getRegionClosuresData: getPctRegionClosuresData,
  getSpecificClosureInfo: getPctSpecificClosureInfo,
} = typeof Runtime === "undefined"
  ? require("./closures-pct.private.js")
  : require(Runtime.getFunctions()["closures-pct"].path);

const availableTrailsAndRegions = {
  at: [
    "maine",
    "new hampshire",
    "vermont",
    "massachusetts",
    "connecticut",
    "new york",
    "new jersey",
    "pennsylvania",
    "maryland",
    "west virginia",
    "virginia",
    "tennessee",
    "north carolina",
    "georgia",
  ],
  pct: [
    "southern california",
    "central california",
    "northern california",
    "oregon",
    "washington",
  ],
};

const parseClosureInvocation = (invocation) => {
  const availableTrails = Object.keys(availableTrailsAndRegions);
  const availableRegions = Object.values(availableTrailsAndRegions).reduce(
    (acc, one) => {
      return acc.concat(one);
    },
    []
  );

  const match = invocation.match(
    new RegExp(
      // prettier-ignore
      `^closures ?(${availableTrails.join("|")})? ?(${availableRegions.join("|")})? ?(\\d+)?$`,
      "i"
    )
  );

  if (!(match instanceof Array)) {
    return {};
  }
  let [_invocation, trail, region, closureNumber] = match;

  if (typeof closureNumber !== "undefined") {
    closureNumber = parseInt(closureNumber);
  }

  return { trail, region, closureNumber };
};

const handleInvocation = async (invocation, callback) => {
  const twiml = new Twilio.twiml.MessagingResponse();

  const { trail, region, closureNumber } = parseClosureInvocation(invocation);

  if (
    typeof trail !== "undefined" &&
    !Object.keys(availableTrailsAndRegions).includes(trail)
  ) {
    twiml.message(`Error: Unknown trail provided: \`${trail}\``);
    return callback(null, twiml);
  }

  if (
    typeof trail !== "undefined" &&
    typeof region !== "undefined" &&
    !availableTrailsAndRegions[trail].includes(region)
  ) {
    twiml.message(
      `Error: \`${region}\` is not a valid region for the ${trail.toUpperCase()}`
    );
    return callback(null, twiml);
  }

  if (
    typeof trail === "undefined" &&
    typeof region === "undefined" &&
    typeof closureNumber === "undefined"
  ) {
    twiml.message(
      "Please identify which trail you want closure information about: ie, `closures pct` or `closures at`"
    );
    return callback(null, twiml);
  } else if (
    typeof region === "undefined" &&
    typeof closureNumber === "undefined"
  ) {
    return await handleAllClosuresInvocation(trail, callback);
  } else if (typeof closureNumber === "undefined") {
    return await handleRegionClosuresInvocation(trail, region, callback);
  } else if (
    typeof trail !== "undefined" &&
    typeof region !== "undefined" &&
    typeof closureNumber !== "undefined"
  ) {
    return await handleSpecificClosureInvocation(
      trail,
      region,
      closureNumber,
      callback
    );
  } else {
    twiml.message(
      "Error: invalid syntax for closures; please try the format of `closures pct`, `closures at maine`, or `closures pct oregon 2`"
    );
    return callback(null, twiml);
  }
};

const handleAllClosuresInvocation = async (trail, callback) => {
  const twiml = new Twilio.twiml.MessagingResponse();

  const message = trail === "pct" ? await makePctAllClosuresMessage() : "";

  twiml.message(message);
  twiml.message(
    `To get a list of all ${trail.toUpperCase()} closures in a region, include that region's name in your text (eg, text \`closures pct oregon\`)`
  );

  return callback(null, twiml);
};

const handleRegionClosuresInvocation = async (trail, region, callback) => {
  const twiml = new Twilio.twiml.MessagingResponse();

  const { titles, dates, types } =
    trail === "pct" ? await getPctRegionClosuresData(region) : {};

  if (titles.length === 0) {
    twiml.message("No closures found for this region");
    return callback(null, twiml);
  }

  buildRegionClosuresMessages(titles, dates, types).forEach((m) => {
    twiml.message(m);
  });
  twiml.message(
    "To get more information for a closure, text the region and that closure's number (eg, `closures central california 3`)"
  );

  return callback(null, twiml);
};

const handleSpecificClosureInvocation = async (
  trail,
  region,
  closureNumber,
  callback
) => {
  const twiml = new Twilio.twiml.MessagingResponse();

  const info =
    trail === "pct"
      ? await getPctSpecificClosureInfo(region, closureNumber)
      : "";

  if (info instanceof Error) {
    twiml.message(info.message);
    return callback(null, twiml);
  }

  twiml.message(buildSpecificClosureMessage(paragraphs));

  return callback(null, twiml);
};

const buildRegionClosuresMessages = (titles, dates, types) => {
  const messages = [];

  titles.forEach((title, index) => {
    // Appalachian Trail closures do not have a date attached
    const date = typeof dates[index] === "string" ? dates[index] : "";
    const type = types[index];

    let message = `(${index + 1})${date ? ` ${date}` : ""} ${type}: ${title}`;
    if (message.length > maxLengthIfGsm7Encoding) {
      message = message.slice(0, maxLengthIfGsm7Encoding - 4) + "...";
    }
    messages.push(message);
  });
  return messages;
};

const buildSpecificClosureMessage = (paragraphs) => {
  // Build a message for all body text through the first _substantive_
  // paragraph (eg, don't stop at a first paragraph that's just
  // "Updated 9/23 10:00 AM")
  let message = "";
  paragraphs.forEach((text, index) => {
    if (index === 0) {
      message += text;
    } else if (message.length < maxLengthIfGsm7Encoding) {
      message = [message, text].join(" ");
    } else {
      return;
    }
  });
  return message;
};

module.exports = {
  handleInvocation,
  parseClosureInvocation,
  buildSpecificClosureMessage,
  buildRegionClosuresMessages,
};
