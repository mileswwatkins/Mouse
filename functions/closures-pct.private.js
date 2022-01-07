const axios = require("axios").default;
const cheerio = require("cheerio");
const dateFns = require("date-fns");
const {
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

const makeAllClosuresMessage = async () => {
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

  return `Closures by region: Southern California ${southernCaliforniaClosures}, Central California ${centralCaliforniaClosures}, Northern California ${northernCaliforniaClosures}, Oregon ${oregonClosures}, Washington ${washingtonClosures}`;
};

const parsePctaClosureClass = (glyphClassName) =>
  glyphClassName.includes("fa-ban")
    ? "closure"
    : glyphClassName.includes("fa-door-open")
    ? "reopening"
    : glyphClassName.includes("fa-exclamation-triangle")
    ? "warning"
    : "";

const getRegionClosuresData = async (region) => {
  const regionSlug = pctaRegionUrlSlugs[region.toLowerCase()];

  const closuresResponse = await axios.get(
    convertUrlToGoogleCacheUrl(
      `https://www.pcta.org/discover-the-trail/closures/${regionSlug}`
    )
  );
  const $ = cheerio.load(closuresResponse.data);

  const titles = $("div.closure-wrap > a > div.closure-title > h2")
    .get()
    .map((el) => $(el).text());
  let dates = $("div.closure-wrap > a > div.closure-date")
    .get()
    .map((el) => $(el).text())
    .map((d) => dateFns.format(new Date(d), "MMM d, yyyy"));
  const types = $("div.closure-wrap > a > i.closure-type")
    .get()
    .map((el) => $(el).attr("class"))
    .map(parsePctaClosureClass);

  return { titles, dates, types };
};

const getSpecificClosureInfo = async (region, closureNumber) => {
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
    return new Error(
      `Error: Invalid closure number provided; valid numbers are 1 through ${closureUrls.length}`
    );
  }

  const closureResponse = await axios.get(
    convertUrlToGoogleCacheUrl(closureUrl)
  );
  $ = cheerio.load(closureResponse.data);
  const text = $("#content > div p")
    .get()
    .map((el) => $(el).text())
    .join("\n");

  return text;
};

module.exports = {
  makeAllClosuresMessage,
  getRegionClosuresData,
  getSpecificClosureInfo,
};
