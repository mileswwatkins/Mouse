const { getInReachSlug } = require("../functions/utils.private.js");

const invocationWithSlug = "weather inreachlink.com/bsm3umy";

test("slug is all uppercase", () => {
  const slug = getInReachSlug(invocationWithSlug);
  expect(slug).not.toBeNull();
  expect(slug).toBe(slug.toUpperCase());
});

test("slug is seven characters", () => {
  const slug = getInReachSlug(invocationWithSlug);
  expect(slug).not.toBeNull();
  expect(slug.length).toBe(7);
});
