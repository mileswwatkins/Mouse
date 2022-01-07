const axios = require("axios");
const {
  setup: setupDevServer,
  teardown: teardownDevServer,
} = require("jest-dev-server");

beforeAll(
  async () =>
    await setupDevServer({
      command: "npm run start",
      launchTimeout: 5000,
      port: 3000,
      usedPortAction: "ignore",
    })
);

afterAll(async () => await teardownDevServer());

const getResponseBody = async (message) =>
  await (
    await axios({
      method: "POST",
      url: "http://localhost:3000/mouse",
      data: { Body: message },
      headers: {
        "Content-Type": "application/json",
      },
    })
  ).data;

const getMessages = (xml) => xml.match(/<Message>(.+?)<\/Message>/g);

test("all closures invocation", async () => {
  const messageXml = await getResponseBody("closures pct");
  const messageXmlWithoutCounts = messageXml.replace(/ [0-9]+/g, " X");

  expect(messageXmlWithoutCounts).toBe(
    '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Closures by region: Southern California X, Central California X, Northern California X, Oregon X, Washington X</Message><Message>To get a list of all PCT closures in a region, include that region\'s name in your text (eg, text `closures pct oregon`)</Message></Response>'
  );
});

test("region closures invocation", async () => {
  const messageXml = await getResponseBody("closures pct southern california");
  const messages = getMessages(messageXml);

  expect(messages.length).toBeGreaterThan(1);
  messages.slice(0, messages.length - 1).forEach((m) => {
    expect(m).toMatch(/\(\d+\) .+/);
  });
});

test("specific closure invocation", async () => {
  const messageXml = await getResponseBody("closures northern california 1");

  expect(messageXml).toMatch(
    /<\?xml version="1.0" encoding="UTF-8"\?><Response><Message>.+<\/Message><\/Response>/
  );
});

test("weather invocation", async () => {
  const messageXml = await getResponseBody("weather inreachlink.com/JSLQXHR");
  const messages = getMessages(messageXml);

  expect(messages[0]).toMatch(/\d-day forecast for .+/);
  messages.slice(1).forEach((m) => {
    expect(m).toMatch(/[\w ]+: .+/);
  });
});

test("wikipedia invocation", async () => {
  const messageXml = await getResponseBody("wikipedia pokemon");

  expect(messageXml).toMatch(
    /<\?xml version="1.0" encoding="UTF-8"\?><Response><Message>.+<\/Message><\/Response>/
  );
});
