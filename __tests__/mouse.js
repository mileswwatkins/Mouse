const { getInvocationFromMessage } = require("../functions/mouse.protected.js");

const message = "Weather inreachlink.com/BSM3UMY  - Keesha Boles";

test("invocation is all lowercase", () => {
  const invocation = getInvocationFromMessage(message);
  expect(invocation).toBe(invocation.toLowerCase());
});

test("invocation doesn't have any name/signature", () => {
  const invocation = getInvocationFromMessage(message);
  const messageWithoutInvocation = message.replace(invocation, "");
  expect(messageWithoutInvocation).toMatch(/ {1,3}- [\w ]+/);
});
