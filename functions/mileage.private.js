const { point, featureCollection } = require("@turf/helpers");
const nearestPoint = require("@turf/nearest-point").default;
const distance = require("@turf/distance").default;
const pctPoints =
  typeof Runtime === "undefined"
    ? require("../assets/pct-points.private.json")
    : require(Runtime.getAssets()["/pct-points.json"].path);
const { getInReachSlug, getLatLngFromInReach, trailsInfo } =
  typeof Runtime === "undefined"
    ? require("./utils.private.js")
    : require(Runtime.getFunctions()["utils"].path);

const getNearestPctPoint = (latitude, longitude) => {
  const comparisonPoint = point([latitude, longitude]);
  const pctFeatures = featureCollection(
    Object.entries(pctPoints).map(([mileage, coordinates]) =>
      point(coordinates, { mileage })
    )
  );

  const nearest = nearestPoint(comparisonPoint, pctFeatures);
  nearest.properties.distance = distance(comparisonPoint, nearest, {
    units: "miles",
  });

  return nearest;
};

const handleInvocation = async (invocation, callback) => {
  const twiml = new Twilio.twiml.MessagingResponse();

  const trailMatch = invocation.match(/^mileage (\w+) /);
  console.error(trailsInfo);
  const availableTrails = trailsInfo.map((t) => t.abbreviation);
  if (!trailMatch) {
    twiml.message(
      "Error: You must provide a trail name in your text message, eg `mileage pct`"
    );
    return callback(null, twiml);
  } else if (!availableTrails.includes(trailMatch[1])) {
    twiml.message(`Error: Invalid trail name provided: \`${trailMatch}\``);
    return callback(null, twiml);
  }
  const trail = trailMatch[1];

  const inReachSlug = getInReachSlug(invocation);
  if (!inReachSlug) {
    twiml.message(
      "Error: You must include your InReach location link in your text message"
    );
    return callback(null, twiml);
  }

  const { latitude, longitude } = await getLatLngFromInReach(inReachSlug);
  if (typeof latitude === "undefined" || typeof longitude === "undefined") {
    twiml.message(
      "Error: Failed to load InReach location, please try again in a few minutes"
    );
    return callback(null, twiml);
  }

  let nearest;
  if (trail === "at") {
    // TO DO
  } else if (trail === "pct") {
    nearest = getNearestPctPoint(latitude, longitude);
  }

  const trailName = trailsInfo.find((t) => t.abbreviation === trail).name;
  const maxDistance = 20;
  if (nearest.properties.distance > maxDistance) {
    twiml.message(
      // prettier-ignore
      `Error: You are more than ${maxDistance} miles away from the ${trailName}`
    );
    return callback(null, twiml);
  }

  twiml.message(
    `The closest ${trailName} mile marker is ${nearest.properties.mileage}`
  );
  return callback(null, twiml);
};

module.exports = {
  handleInvocation,
  getNearestPctPoint,
};
