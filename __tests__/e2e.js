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

const createRequestPromise = (message) =>
  axios({
    method: "POST",
    url: "http://localhost:3000/mouse",
    data: { Body: message },
    headers: {
      "Content-Type": "application/json",
    },
  });

test("all closures invocation", (done) => {
  createRequestPromise("closures")
    .then((res) => {
      const messageXml = res.data;
      const messageXmlWithoutCounts = messageXml.replace(/ [0-9]+/g, " X");
      expect(messageXmlWithoutCounts).toBe(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Closures by region: Southern California X, Central California X, Northern California X, Oregon X, Washington X</Message><Message>To get a list of all closures in a region, include that region\'s name in your text (eg, text `closures central california`)</Message></Response>'
      );
      done();
    })
    .catch((err) => {
      done(err);
    });
});

test("region closures invocation", (done) => {
  createRequestPromise("closures northern california")
    .then((res) => {
      const messageXml = res.data;
      const messages = messageXml.match(/<Message>(.+?)<\/Message>/g);

      expect(messages.length).toBeGreaterThan(1);
      messages.slice(0, messages.length - 1).forEach((m) => {
        expect(m).toMatch(/\(\d+\) .+/);
      });
      done();
    })
    .catch((err) => {
      done(err);
    });
});

test("specific closure invocation", (done) => {
  createRequestPromise("closures northern california 1")
    .then((res) => {
      const messageXml = res.data;
      expect(messageXml).toMatch(
        /<\?xml version="1.0" encoding="UTF-8"\?><Response><Message>.+<\/Message><\/Response>/
      );
      done();
    })
    .catch((err) => {
      done(err);
    });
});

test("weather invocation", (done) => {
  createRequestPromise("weather inreachlink.com/JSLQXHR")
    .then((res) => {
      const messageXml = res.data;
      const messages = messageXml.match(/<Message>(.+?)<\/Message>/g);

      expect(messages[0]).toMatch(/\d-day forecast for .+/);
      messages.slice(1).forEach((m) => {
        expect(m).toMatch(/[\w ]+: .+/);
      });

      done();
    })
    .catch((err) => {
      done(err);
    });
});

test("wikipedia invocation", (done) => {
  createRequestPromise("wikipedia pokemon")
    .then((res) => {
      const messageXml = res.data;
      expect(messageXml).toMatch(
        /<\?xml version="1.0" encoding="UTF-8"\?><Response><Message>.+<\/Message><\/Response>/
      );
      done();
    })
    .catch((err) => {
      done(err);
    });
});
