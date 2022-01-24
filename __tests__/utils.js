const { getInReachSlug, trailsInfo } = require("../functions/utils.private.js");

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

test("there are no duplicated region synonyms", () => {
  const synonyms = trailsInfo
    .map((t) => t.regions.map((r) => r.synonyms).flat())
    .flat();

  expect(synonyms.length).toBe(new Set(synonyms).size);
});
