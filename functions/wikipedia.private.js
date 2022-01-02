const axios = require("axios").default;
const startCase = require("lodash.startcase");

const handleWikipediaInvocation = async (invocation, callback) => {
  const twiml = new Twilio.twiml.MessagingResponse();

  // Use title casing on search terms, since sometimes Wikipedia's
  // API won't perform a redirect for a non-properly-cased
  // page (eg, searching for `northern california` or `joseph
  // gordon levitt` result in failures, but searching for title-
  // cased versions of these terms succeeds). Searching for
  // title-cased versions of terms with out capital letters
  // also succeeds (eg, `Pina Colada`).
  const searchTerm = startCase(invocation.replace(/^wikipedia +/i, ""));

  try {
    // https://stackoverflow.com/questions/8555320/is-there-a-wikipedia-api-just-for-retrieve-the-content-summary/18504997
    const response = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURI(
        searchTerm
      )}`
    );
    const introParagraph = response.data.extract;

    if (
      introParagraph.endsWith("may refer to:") ||
      response.data.description === "Topics referred to by the same term"
    ) {
      twiml.message(
        "Your search term is ambiguous or overly broad; please make a more specific search"
      );
      return callback(null, twiml);
    }

    twiml.message(introParagraph);
    return callback(null, twiml);
  } catch (e) {
    // Handle a `404` error, which is returned when Wikipedia
    // doesn't find an article even after a redirect
    twiml.message("No Wikipedia page was found for that search term");
    return callback(null, twiml);
  }
};

module.exports = handleWikipediaInvocation;
