const axios = require("axios").default;
const cheerio = require("cheerio");
const dateFns = require("date-fns");
const {
  maxLengthIfGsm7Encoding,
  // For temporary use, while Cloudflare is blocking bot requests
  // on the actual PCTA website
  convertUrlToGoogleCacheUrl,
} =
  typeof Runtime === "undefined"
    ? require("./utils.private.js")
    : require(Runtime.getFunctions()["utils"].path);

const pctaRegionUrlSlugs = {
  "southern california": "southern-california",
  "central california": "central-california",
  "northern california": "northern-california",
  oregon: "oregon",
  washington: "washington",
};

const parseRegionAndClosureNumber = (invocation) => {
  let [_invocation, region, closureNumber] = invocation.match(
    /^closures ?(southern california|central california|northern california|oregon|washington)? ?(\d+)?/i
  );

  if (typeof closureNumber !== "undefined") {
    closureNumber = parseInt(closureNumber);
  }

  return { region, closureNumber };
};

const handleClosuresInvocation = async (invocation, callback) => {
  const twiml = new Twilio.twiml.MessagingResponse();

  const { region, closureNumber } = parseRegionAndClosureNumber(invocation);

  if (
    typeof region !== "undefined" &&
    !Object.keys(pctaRegionUrlSlugs).includes(region)
  ) {
    twiml.message(`Error: Unknown region provided: \`${region}\``);
    return callback(null, twiml);
  }

  if (typeof region === "undefined" && typeof closureNumber === "undefined") {
    return await handleAllClosuresInvocation(callback);
  } else if (region && typeof closureNumber === "undefined") {
    return await handleRegionClosuresInvocation(region, callback);
  } else {
    return await handleSpecificClosureInvocation(
      region,
      closureNumber,
      callback
    );
  }
};

const handleAllClosuresInvocation = async (callback) => {
  const twiml = new Twilio.twiml.MessagingResponse();

  const closuresResponse = await axios.get(
    convertUrlToGoogleCacheUrl(
      "https://www.pcta.org/discover-the-trail/closures/"
    )
  );
  const $ = cheerio.load(closuresResponse.data);

  const regionNames = $(".closure-region > div.text-overlay")
    .get()
    .map((el) => $(el).text());
  const closureCounts = $(".closure-region > div.region-count")
    .get()
    .map((el) => $(el).text());

  const southernCaliforniaClosures =
    closureCounts[regionNames.indexOf("Southern California")];
  const centralCaliforniaClosures =
    closureCounts[regionNames.indexOf("Central California")];
  const northernCaliforniaClosures =
    closureCounts[regionNames.indexOf("Northern California")];
  const oregonClosures = closureCounts[regionNames.indexOf("Oregon")];
  const washingtonClosures = closureCounts[regionNames.indexOf("Washington")];

  twiml.message(
    `Closures by region: Southern California ${southernCaliforniaClosures}, Central California ${centralCaliforniaClosures}, Northern California ${northernCaliforniaClosures}, Oregon ${oregonClosures}, Washington ${washingtonClosures}`
  );
  twiml.message(
    "To get a list of all closures in a region, include that region's name in your text (eg, text `closures central california`)"
  );

  return callback(null, twiml);
};

const handleRegionClosuresInvocation = async (region, callback) => {
  const twiml = new Twilio.twiml.MessagingResponse();

  const regionSlug = pctaRegionUrlSlugs[region.toLowerCase()];
  const closuresResponse = await axios.get(
    convertUrlToGoogleCacheUrl(
      `https://www.pcta.org/discover-the-trail/closures/${regionSlug}`
    )
  );
  const $ = cheerio.load(closuresResponse.data);

  const closureTitles = $("div.closure-wrap > a > div.closure-title > h2")
    .get()
    .map((el) => $(el).text());
  const closureDates = $("div.closure-wrap > a > div.closure-date")
    .get()
    .map((el) => $(el).text());
  const closureClasses = $("div.closure-wrap > a > i.closure-type")
    .get()
    .map((el) => $(el).attr("class"));

  if (closureTitles.length === 0) {
    twiml.message("No closures found in this region");
    return callback(null, twiml);
  }

  buildRegionClosuresMessages(
    closureTitles,
    closureDates,
    closureClasses
  ).forEach((m) => {
    twiml.message(m);
  });
  twiml.message(
    "To get more information for a closure, text the region and that closure's number (eg, `closures central california 3`)"
  );

  return callback(null, twiml);
};

const handleSpecificClosureInvocation = async (
  region,
  closureNumber,
  callback
) => {
  const twiml = new Twilio.twiml.MessagingResponse();

  const regionSlug = pctaRegionUrlSlugs[region.toLowerCase()];
  const regionResponse = await axios.get(
    convertUrlToGoogleCacheUrl(
      `https://www.pcta.org/discover-the-trail/closures/${regionSlug}`
    )
  );
  let $ = cheerio.load(regionResponse.data);
  const closureUrls = $("div.closure-wrap > a")
    .get()
    .map((el) => $(el).attr("href"));

  const closureUrl = closureUrls[closureNumber - 1];
  if (!closureUrl) {
    twiml.message(
      `Error: Invalid closure number provided; valid numbers are 1 through ${closureUrls.length}`
    );
    return callback(null, twiml);
  }

  const closureResponse = await axios.get(
    convertUrlToGoogleCacheUrl(closureUrl)
  );
  $ = cheerio.load(closureResponse.data);

  const paragraphs = $("#content > div p")
    .get()
    .map((el) => $(el).text());
  twiml.message(buildSingleClosureMessage(paragraphs));

  return callback(null, twiml);
};

const buildRegionClosuresMessages = (titles, dates, classes) => {
  const messages = [];

  const parsePctaClosureType = (glyphClassName) =>
    glyphClassName.includes("fa-ban")
      ? "closure"
      : glyphClassName.includes("fa-door-open")
      ? "reopening"
      : glyphClassName.includes("fa-exclamation-triangle")
      ? "warning"
      : "";

  titles.forEach((title, index) => {
    const date = dateFns.format(new Date(dates[index]), "MMM d, yyyy");
    const type = parsePctaClosureType(classes[index]);

    let message = `(${index + 1}) ${date} ${type}: ${title}`;
    if (message.length > maxLengthIfGsm7Encoding) {
      message = message.slice(0, maxLengthIfGsm7Encoding - 4) + "...";
    }
    messages.push(message);
  });
  return messages;
};

const buildSingleClosureMessage = (paragraphs) => {
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
  handleClosuresInvocation,
  parseRegionAndClosureNumber,
  buildSingleClosureMessage,
  buildRegionClosuresMessages,
};
