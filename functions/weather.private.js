const axios = require("axios").default;

const inReachSlugToWeatherUrl = async (inReachSlug) => {
  const url = `http://inreachlink.com/${inReachSlug}`;
  const inReachData = await (await axios.get(url)).data;

  let latitude;
  let longitude;
  try {
    latitude = inReachData.match(/\s+lat : (-?\d+\.\d+),/)[1];
    longitude = inReachData.match(/\s+lon : (-?\d+\.\d+),/)[1];
  } catch {
    console.error(`Failed to find latitude and longitude from ${url}`);
    return null;
  }

  console.debug(
    `Determined InReach location to be: lat ${latitude}, lon ${longitude}`
  );

  return `https://forecast.weather.gov/MapClick.php?lat=${latitude}&lon=${longitude}&FcstType=json`;
};

const buildIntroMessage = (weatherData, days) => {
  const location = weatherData.location.areaDescription;
  const elevation = weatherData.location.elevation;
  const hazards = weatherData.data.hazard;

  let message = `${days}-day forecast for ${location}, elevation ${elevation} ft`;
  if (hazards.length) {
    message += `; current warnings: ${hazards.join(", ")}`;
  }
  // Keep consistency with the weather summaries, which all end
  // in a period
  message = message + '.'

  return message;
};

const shortenDayName = (name) => {
  const abbreviations = {
    Sunday: "Sun",
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
  };

  let shortenedName = name;
  Object.entries(abbreviations).forEach(([full, abbreviated]) => {
    shortenedName = shortenedName.replace(full, abbreviated);
  });

  return shortenedName;
};

const shortenWeather = (weather) => {
  let shortenedWeather = weather;

  directionAbbreviations = {
    "north northeast": "NNE",
    "east northeast": "ENE",
    "east southeast": "ESE",
    "south southeast": "SSE",
    "south southwest": "SSW",
    "west southwest": "WSW",
    "west northwest": "WNW",
    "north northwest": "NNW",
    northeast: "NE",
    southeast: "SE",
    southwest: "SW",
    northwest: "NW",
    north: "N",
    east: "E",
    south: "S",
    west: "W",
  };
  Object.entries(directionAbbreviations).forEach(([full, abbreviated]) => {
    shortenedWeather = shortenedWeather.replace(
      new RegExp(full, "gi"),
      abbreviated
    );
  });

  // Double spaces after a period appear in some of NWS's
  // weather descriptions
  shortenedWeather = shortenedWeather.replace(/\s+/g, " ");

  // Make various shortenings without losing information or
  // readability
  shortenedWeather = shortenedWeather.replace(
    /(high|low) (near|around) (\d+)/gi,
    "$1 of $3"
  );
  shortenedWeather = shortenedWeather.replace(
    / with a (high|low) of (\d+)/g,
    " $1 of $2"
  );
  shortenedWeather = shortenedWeather.replace(
    /, with gusts as high as (\d+ mph)/g,
    ", with $1 gusts"
  );
  shortenedWeather = shortenedWeather.replace(
    /Winds could gust as high as (\d+ mph)/g,
    "Gusts of $1"
  );
  shortenedWeather = shortenedWeather.replace(
    / (\d+) percent chance/g,
    " $1% chance"
  );
  shortenedWeather = shortenedWeather.replace(
    / (\d+) to (\d+) mph/g,
    " $1-$2 mph"
  );

  return shortenedWeather;
};

const buildWeatherMessages = (weatherData, days) => {
  const names = weatherData.time.startPeriodName;
  const weathers = weatherData.data.text;

  const messageCount = Math.min(days * 2, names.length);

  return names.slice(0, messageCount).map((name, index) => {
    const shortenedName = shortenDayName(name);
    const shortenedWeather = shortenWeather(weathers[index].trim());
    return `${shortenedName}: ${shortenedWeather}`;
  });
};

const handleWeatherInvocation = async (inReachSlug, days, callback) => {
  const twiml = new Twilio.twiml.MessagingResponse();

  const weatherUrl = await inReachSlugToWeatherUrl(inReachSlug);
  if (weatherUrl === null) {
    twiml.message(
      "Failed to load InReach location, please try again in a few minutes"
    );
    return callback(null, twiml);
  }
  const weatherData = await (await axios.get(weatherUrl)).data;

  twiml.message(buildIntroMessage(weatherData, days));
  buildWeatherMessages(weatherData, days).forEach((message) => {
    twiml.message(message);
  });

  return callback(null, twiml);
};

module.exports = handleWeatherInvocation;
