const axios = require("axios").default;
const cheerio = require("cheerio");
const { sleep } =
  typeof Runtime === "undefined"
    ? require("./utils.private.js")
    : require(Runtime.getFunctions()["utils"].path);

const regionsAndAbbreviations = {
  "a.t. trailwide updates": "trailwide",
  georgia: "GA",
  "north carolina": "NC",
  "great smoky mountains national park": "GSMNP",
  tennessee: "TN",
  virginia: "VA",
  "southwest virginia": "SW VA",
  "central virginia": "C VA",
  "shenandoah national park": "SNP",
  "northern virginia": "N VA",
  "west virginia": "WV",
  maryland: "MD",
  pennsylvania: "PA",
  "new jersey": "NJ",
  "new york": "NY",
  connecticut: "CT",
  massachusetts: "MA",
  vermont: "VT",
  "new hampshire": "NH",
  maine: "ME",
};

const getUrlSlug = (region) => {
  if (region === "great smoky mountains national park") {
    return "gsmnp";
  } else if (region === "trailwide") {
    return "trailwide";
  } else if (region !== "west virginia" && region.includes(" virginia")) {
    return region.replace(/ /g, "-");
  } else if (region === "shenandoah national park") {
    return region.replace(/ /g, "-");
  } else {
    return regionsAndAbbreviations[region].toLowerCase();
  }
};

const makeAllClosuresMessage = async () => {
  const closuresCounter = Object.keys(regionsAndAbbreviations).reduce(
    (acc, region) => {
      acc[region] = 0;
      return acc;
    },
    {}
  );

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

      if (!Object.keys(closuresCounter).includes(r)) {
        // Sometimes the state abbreviation is used here instead
        // of the state name
        let potentialMatch = false;
        Object.entries(regionsAndAbbreviations).forEach(([key, value]) => {
          if (r.toLowerCase() === value.toLowerCase()) {
            r = key;
            potentialMatch = true;
          }
        });

        // More special cases may come up in the future;
        // watch the debug log
        if (r === "central-virginia") {
          r = "central virginia";
          potentialMatch = true;
        } else if (r === "southwest-virginia") {
          r = "southwest virginia";
          potentialMatch = true;
        }

        if (!potentialMatch) {
          console.debug(`Found unexpected region name: ${r}`);
          r = "a.t. trailwide updates";
        }
      }

      closuresCounter[r] += 1;
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
    .map(([key, value]) => `${regionsAndAbbreviations[key]} ${value}`)
    .join(", ")}`;
};

const getRegionClosuresData = async (region) => {
  const regionSlug = getUrlSlug(region.toLowerCase());

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
  const regionSlug = getUrlSlug(region.toLowerCase());

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
