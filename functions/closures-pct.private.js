const axios = require("axios").default;
const cheerio = require("cheerio");
const dateFns = require("date-fns");
const {
  pctRegions,
  // For temporary use, while Cloudflare is blocking bot requests
  // on the actual PCTA website
  convertUrlToGoogleCacheUrl,
} =
  typeof Runtime === "undefined"
    ? require("./utils.private.js")
    : require(Runtime.getFunctions()["utils"].path);

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

  return `Closures by region: ${pctRegions
    .map((r) => `${r.name} ${closureCounts[regionNames.indexOf(r.name)]}`)
    .join(", ")}`;
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
  const regionSlug = pctRegions.find((r) => r.name === region).slug;

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
  const regionSlug = pctRegions.find((r) => r.name === region).slug;

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
