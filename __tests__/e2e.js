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

const url = "http://localhost:3000/mouse";

test("closures request", (done) => {
  axios({
    method: "POST",
    url,
    data: { Body: "closures" },
    headers: {
      "Content-Type": "application/json",
    },
  })
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
