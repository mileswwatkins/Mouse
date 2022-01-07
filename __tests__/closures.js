const {
  parseRegionAndClosureNumber,
  buildSingleClosureMessage,
  buildRegionClosuresMessages,
} = require("../functions/closures.private.js");

test("parse region and closure number", () => {
  expect(parseRegionAndClosureNumber("closures")).toEqual({
    region: undefined,
    closureNumber: undefined,
  });
  expect(parseRegionAndClosureNumber("closures southern california")).toEqual({
    region: "southern california",
    closureNumber: undefined,
  });
  expect(parseRegionAndClosureNumber("closures washington 10")).toEqual({
    region: "washington",
    closureNumber: 10,
  });
});

test("build single closure message if first paragrph long", () => {
  const paragraphs = [
    "The Deep Creek Area Closure includes Splinters Cabin Trailhead/Picnic Area, a portion of Deep Creek, and roads in the area. The closure includes Deep Creek and 50 feet out from both sides between Hook Creek and Devils Hole, Splinters Cabin Spur Trail (2W22), and Splinters Cabin Road (3N34C) amongst other areas.",
    "Hikers on the PCT may pass through the area, provided they enter and exit outside of the closure area, however hikers with a valid PCT Long-distance Permit may use Splinters Cabin Spur Trail and Splinters Cabin Road.",
  ];
  const message = buildSingleClosureMessage(paragraphs);
  expect(message).toBe(paragraphs[0]);
});

test("build single closure message if first paragrph short", () => {
  const paragraphs = [
    "Updated 12/10 9:20 AM",
    "The Deep Creek Area Closure includes Splinters Cabin Trailhead/Picnic Area, a portion of Deep Creek, and roads in the area. The closure includes Deep Creek and 50 feet out from both sides between Hook Creek and Devils Hole, Splinters Cabin Spur Trail (2W22), and Splinters Cabin Road (3N34C) amongst other areas.",
    "Hikers on the PCT may pass through the area, provided they enter and exit outside of the closure area, however hikers with a valid PCT Long-distance Permit may use Splinters Cabin Spur Trail and Splinters Cabin Road.",
  ];
  const message = buildSingleClosureMessage(paragraphs);
  expect(message).toBe(paragraphs[0] + " " + paragraphs[1]);
});

test("build region closure messages", () => {
  const titles = ["Foo", "Bar", "Baz"];
  const dates = ["December 20, 2021", "December 14, 2021", "June 23, 2021"];
  const classes = ["fa-ban", "fa-door-open", "fa-exclamation-triangle"];

  const messages = buildRegionClosuresMessages(titles, dates, classes);
  expect(messages.length).toBe(titles.length);
  expect(messages[0]).toBe("(1) Dec 20, 2021 closure: Foo");
  expect(messages[1]).toBe("(2) Dec 14, 2021 reopening: Bar");
  expect(messages[2]).toBe("(3) Jun 23, 2021 warning: Baz");
});
