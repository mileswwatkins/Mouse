// Source: `General Character Count Guide` section of
// https://support.garmin.com/en-US/?faq=SBFgu4brUwAS4NkL5tNQyA
// "All other symbols or letters will reduce the character
// limit of the message by approximately half due to SMS coding."
// Additionally, assuming the message is sent to just one contact,
// and that contact was pre-entered into the Garmin Explore
// website, then that contact consumes only one character of the
// text message length limit.
// See further explanations of GSM-7 and UCS-2 encodings, eg here:
// https://github.com/nahanil/jquery-smscharcount#why
// https://chadselph.github.io/smssplit/
const maxLengthIfGsm7Encoding = 160 - 1;
const maxLengthIfUcs2Encoding = 80 - 1;
// prettier-ignore
const oneByteGsmCharacters = [
    "!", "'", "#", "$", "%", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "_", "¡", "£", "¥", "§", "¿", "&", "¤",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "Ä", "Å", "Æ", "Ç", "É", "Ñ", "Ø", "ø", "Ü", "ß", "Ö", "à", "ä", "å", "æ", "è", "é", "ì", "ñ", "ò", "ö", "ù", "ü", "Δ", "Φ", "Γ", "Λ", "Ω", "Π", "Ψ", "Σ", "Θ", "Ξ",
    " ", "\n"
]
const twoByteGsmCharacters = ["^", "€", "{", "}", "[", "]", "~", "\\"];

/**
 * Determine the number of bytes in a string, which is
 * useful for some more complex unicode characters, eg 👩‍👩‍👦‍👦
 * https://stackoverflow.com/questions/25994001/how-to-calculate-byte-length-containing-utf8-characters-using-javascript
 */
const getByteLength = (text) => new Blob([str]).size;

const hasNonGsm7Characters = (text) =>
  text.some(
    (char) =>
      !oneByteGsmCharacters.includes(char) &&
      !twoByteGsmCharacters.includes(char)
  );

const getGsm7ByteLength = (text) =>
  text.reduce((runningLength, char) => {
    if (oneByteGsmCharacters.includes(char)) {
      return runningLength + 1;
    } else if (twoByteGsmCharacters.includes(char)) {
      return runningLength + 2;
    } else {
      // This message cannot be encoded using GSM-7
      return null;
    }
  });

const isMessageMultipart = (message) => {
  if (hasNonGsm7Characters(message)) {
    return message.length > maxLengthIfUcs2Encoding;
  } else {
    return getGsm7ByteLength(message) > maxLengthIfGsm7Encoding;
  }
};

const splitMessage = (message) => {
  if (message.length === 0) {
    return [];
  } else if (!isMessageMultipart) {
    return [message];
  }

  let messages = [];
  const words = message.split(/\s+/).filter((w) => w.length > 0);

  let currentMessage = "(1/XX)";
  words.forEach((word) => {
    const newCurrentMessage = `${currentMessage} ${word}`;
    if (
      (hasNonGsm7Characters(newCurrentMessage) &&
        newCurrentMessage.length > maxLengthIfUcs2Encoding) ||
      (!hasNonGsm7Characters(newCurrentMessage) &&
        getGsm7ByteLength(newCurrentMessage) > maxLengthIfGsm7Encoding)
    ) {
      messages.push(currentMessage);
      currentMessageNumber += 1;
      currentMessage = `(${messages.length + 1}/XX) ${word}`;
    } else {
      currentMessage = newCurrentMessage;
    }
  });
  messages.push(currentMessage);

  messages = messages.map((m) =>
    m.replace(
      /^\((\d+)\/XX\) /,
      (_match, messageNumber) => `(${messageNumber}/${messages.length}) `
    )
  );

  return messages;
};

const getInReachSlug = (message) => {
  // The user may have location sharing turned on, in which case
  // there will be an ` inreachlink.com/#######` before the
  // `  - ${user's name}`
  let inReachSlug = null;
  if (message.includes("inreachlink.com")) {
    inReachSlug = message.match(/inreachlink\.com\/([A-z|\d]{7})/)[1];
    message = message.replace(inReachSlug, "");
    inReachSlug = inReachSlug.toUpperCase();
  }
  return inReachSlug;
};

const convertUrlToGoogleCacheUrl = (url) =>
  `http://webcache.googleusercontent.com/search?q=cache:${url}&strip=1&vwsrc=0`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getLatLngFromInReach = async (inReachSlug) => {
  const url = `http://inreachlink.com/${inReachSlug}`;
  const inReachData = await (await axios.get(url)).data;

  let latitude;
  let longitude;
  try {
    latitude = inReachData.match(/\s+lat : (-?\d+\.\d+),/)[1];
    longitude = inReachData.match(/\s+lon : (-?\d+\.\d+),/)[1];

    console.debug(
      `Determined InReach location to be: lat ${latitude}, lon ${longitude}`
    );
  } catch {
    console.error(`Failed to find latitude and longitude from ${url}`);
  }

  return { latitude, longitude };
};

const trailsInfo = [
  {
    name: "Appalachian Trail",
    abbreviation: "at",
    regions: [
      {
        name: "A.T. Trailwide Updates",
        abbreviation: "trailwide",
        synonyms: ["trailwide"],
        slug: "trailwide",
      },
      { name: "Georgia", abbreviation: "GA", synonyms: ["ga"], slug: "ga" },
      {
        name: "North Carolina",
        abbreviation: "NC",
        synonyms: ["nc"],
        slug: "nc",
      },
      {
        name: "Great Smoky Mountains National Park",
        abbreviation: "GSMNP",
        synonyms: ["gsmnp", "gsm", "smokies", "smoky mountains"],
        slug: "gsmnp",
      },
      {
        name: "Tennessee",
        abbreviation: "TN",
        synonyms: ["tn", "tenn"],
        slug: "tn",
      },
      { name: "Virginia", abbreviation: "VA", synonyms: ["va"], slug: "va" },
      {
        name: "Southwest Virginia",
        abbreviation: "SW VA",
        synonyms: ["sw va", "swva"],
        slug: "southwest-virginia",
      },
      {
        name: "Central Virginia",
        abbreviation: "C VA",
        synonyms: ["c va", "cva"],
        slug: "central-virginia",
      },
      {
        name: "Shenandoah National Park",
        abbreviation: "SNP",
        synonyms: ["shenandoah", "snp"],
        slug: "shenandoah-national-park",
      },
      {
        name: "Northern Virginia",
        abbreviation: "N VA",
        synonyms: ["n va", "nva", "nova"],
        slug: "northern-virginia",
      },
      {
        name: "West Virginia",
        abbreviation: "WV",
        synonyms: ["wv", "wva", "w va"],
        slug: "wv",
      },
      { name: "Maryland", abbreviation: "MD", synonyms: ["md"], slug: "md" },
      {
        name: "Pennsylvania",
        abbreviation: "PA",
        synonyms: ["pa", "penn"],
        slug: "pa",
      },
      {
        name: "New Jersey",
        abbreviation: "NJ",
        synonyms: ["nj", "jersey"],
        slug: "nj",
      },
      { name: "New York", abbreviation: "NY", synonyms: ["ny"], slug: "ny" },
      {
        name: "Connecticut",
        abbreviation: "CT",
        synonyms: ["ct", "conn"],
        slug: "ct",
      },
      {
        name: "Massachusetts",
        abbreviation: "MA",
        synonyms: ["ma", "mass"],
        slug: "ma",
      },
      { name: "Vermont", abbreviation: "VT", synonyms: ["vt"], slug: "vt" },
      {
        name: "New Hampshire",
        abbreviation: "NH",
        synonyms: ["nh"],
        slug: "nh",
      },
      { name: "Maine", abbreviation: "ME", synonyms: ["me"], slug: "me" },
    ],
  },
  {
    name: "Pacific Crest Trail",
    abbreviation: "pct",
    regions: [
      {
        name: "Southern California",
        synonyms: ["socal", "so cal"],
        slug: "southern-california",
      },
      {
        name: "Central California",
        synonyms: [],
        slug: "central-california",
      },
      {
        name: "Northern California",
        synonyms: ["norcal", "nor cal"],
        slug: "northern-california",
      },
      {
        name: "Oregon",
        synonyms: ["or", "ore"],
        slug: "oregon",
      },
      {
        name: "Washington",
        synonyms: ["wa", "wash"],
        slug: "washington",
      },
    ],
  },
];
trailsInfo.forEach((t) => {
  t.regions.forEach((r) => {
    r.synonyms.push(r.name.toLowerCase());
  });
});

// Convenience subsets of the larger data
const atRegions = trailsInfo.find((t) => t.abbreviation === "at").regions;
const pctRegions = trailsInfo.find((t) => t.abbreviation === "pct").regions;

module.exports = {
  convertUrlToGoogleCacheUrl,
  getInReachSlug,
  maxLengthIfGsm7Encoding,
  sleep,
  getLatLngFromInReach,
  trailsInfo,
  atRegions,
  pctRegions,
};
