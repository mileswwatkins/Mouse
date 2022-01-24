const axios = require("axios").default;
const cheerio = require("cheerio");
const { sleep, atRegions } =
  typeof Runtime === "undefined"
    ? require("./utils.private.js")
    : require(Runtime.getFunctions()["utils"].path);

const makeAllClosuresMessage = async () => {
  const closuresCounter = atRegions.reduce((acc, r) => {
    acc[r.name] = 0;
    return acc;
  }, []);

  // Need to deal with pagination of the listings; this functionality
  // will also be fine if there's just one page
  let page = 1;
  while (true) {
    const closuresResponse = await axios.get(
      `https://appalachiantrail.org/trail-updates/page/${page}`
    );
    const $ = cheerio.load(closuresResponse.data);

    const regions = $("div.trail-update div.trail-details h5")
      .get()
      .map((el) => $(el).text().toLowerCase());
    regions.forEach((r) => {
      // These `div`s have a second, separate `h5` with the
      // actual location
      if (r === "high-priority-alerts") {
        return;
      }

      const regionMatch = atRegions.find(
        (regionMetadata) =>
          r === regionMetadata.name.toLowerCase() ||
          r.replace(/ /g, "-") === regionMetadata.slug
      );

      let key;
      if (regionMatch) {
        key = regionMatch.name;
      } else {
        console.debug(`Found unexpected region name: ${r}`);
        key = "A.T. Trailwide Updates";
      }
      closuresCounter[key] += 1;
    });

    const nextPageNumber = $("a.next.page-numbers")
      .get()
      .map((el) => $(el).text());
    if (nextPageNumber.length) {
      page += 1;
      await sleep(1000);
      console.debug(`Fetching page ${page} of AT closures`);
    } else {
      break;
    }
  }

  return `Closures by region: ${Object.entries(closuresCounter)
    .map(
      ([key, value]) =>
        `${atRegions.find((r) => r.name === key).abbreviation} ${value}`
    )
    .join(", ")}`;
};

const getRegionClosuresData = async (region) => {
  const regionSlug = atRegions.find((r) => r.name === region).slug;

  const titles = [];
  const types = [];

  let page = 1;
  while (true) {
    let closuresResponse;
    try {
      closuresResponse = await axios.get(
        `https://appalachiantrail.org/trail-updates/state/${regionSlug}/page/${page}/`
      );
    } catch (err) {
      // If there is an exact multiple of 10 items,
      // their server's pagination is broken and will
      // suggest that an other page exists, but it will
      // 404 instead
      if (page > 1) {
        break;
      } else {
        console.error(err);
        break;
      }
    }
    const $ = cheerio.load(closuresResponse.data);

    $("div.trail-update")
      .get()
      .forEach((el) => {
        titles.push(
          $("h3.update-title", el)
            .text()
            .replace(/^.+?– /, "")
        );
        types.push($("h5.trail-type", el).text().toLowerCase());
      });

    const nextPageNumber = $("a.next.page-numbers")
      .get()
      .map((el) => $(el).text());
    if (nextPageNumber.length) {
      page += 1;
      await sleep(1000);
      console.debug(`Fetching page ${page} of ${region} closures`);
    } else {
      break;
    }
  }

  return { titles, dates: Array(titles.length).fill(null), types };
};

const getSpecificClosureInfo = async (region, closureNumber) => {
  const regionSlug = atRegions.find((r) => r.name === region).slug;

  const urls = [];

  let page = 1;
  while (true) {
    let closuresResponse;
    try {
      closuresResponse = await axios.get(
        `https://appalachiantrail.org/trail-updates/state/${regionSlug}/page/${page}/`
      );
    } catch (err) {
      // If there is an exact multiple of 10 items,
      // their server's pagination is broken and will
      // suggest that an other page exists, but it will
      // 404 instead
      if (page > 1) {
        break;
      } else {
        console.error(err);
        break;
      }
    }
    const $ = cheerio.load(closuresResponse.data);

    $("a.trail-update-header")
      .get()
      .forEach((el) => {
        urls.push($(el).attr("href"));
      });

    const nextPageNumber = $("a.next.page-numbers")
      .get()
      .map((el) => $(el).text());
    if (nextPageNumber.length) {
      page += 1;
      await sleep(1000);
      console.debug(`Fetching page ${page} of ${region} closures`);
    } else {
      break;
    }
  }

  const closureUrl = urls[closureNumber - 1];
  if (!closureUrl) {
    return new Error(
      `Error: Invalid closure number provided; valid numbers are 1 through ${closureUrls.length}`
    );
  }

  const closureResponse = await axios.get(closureUrl);
  $ = cheerio.load(closureResponse.data);
  const text = $("div#single-trail-update-container > p")
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
