const {
  parseClosureInvocation,
  buildSpecificClosureMessage,
  buildRegionClosuresMessages,
} = require("../functions/closures.private.js");

describe("parse closure invocation", () => {
  test("general closures", () => {
    expect(parseClosureInvocation("closures")).toEqual({
      trail: undefined,
      region: undefined,
      closureNumber: undefined,
    });
  });
  test("parse all closures for trail", () => {
    expect(parseClosureInvocation("closures at")).toEqual({
      trail: "at",
      region: undefined,
      closureNumber: undefined,
    });
  });
  test("parse closures for region of trail", () => {
    expect(parseClosureInvocation("closures pct southern california")).toEqual({
      trail: "pct",
      region: "southern california",
      closureNumber: undefined,
    });
  });
  test("parse specific closure", () => {
    expect(parseClosureInvocation("closures pct washington 10")).toEqual({
      trail: "pct",
      region: "washington",
      closureNumber: 10,
    });
  });
});

describe("build specific closure message", () => {
  test("if first paragrph long", () => {
    const paragraphs = [
      "The Deep Creek Area Closure includes Splinters Cabin Trailhead/Picnic Area, a portion of Deep Creek, and roads in the area. The closure includes Deep Creek and 50 feet out from both sides between Hook Creek and Devils Hole, Splinters Cabin Spur Trail (2W22), and Splinters Cabin Road (3N34C) amongst other areas.",
      "Hikers on the PCT may pass through the area, provided they enter and exit outside of the closure area, however hikers with a valid PCT Long-distance Permit may use Splinters Cabin Spur Trail and Splinters Cabin Road.",
    ];
    const message = buildSpecificClosureMessage(paragraphs.join("\n"));
    expect(message).toBe(paragraphs[0]);
  });

  test("if first paragrph short", () => {
    const paragraphs = [
      "Updated 12/10 9:20 AM",
      "The Deep Creek Area Closure includes Splinters Cabin Trailhead/Picnic Area, a portion of Deep Creek, and roads in the area. The closure includes Deep Creek and 50 feet out from both sides between Hook Creek and Devils Hole, Splinters Cabin Spur Trail (2W22), and Splinters Cabin Road (3N34C) amongst other areas.",
      "Hikers on the PCT may pass through the area, provided they enter and exit outside of the closure area, however hikers with a valid PCT Long-distance Permit may use Splinters Cabin Spur Trail and Splinters Cabin Road.",
    ];
    const message = buildSpecificClosureMessage(paragraphs.join("\n"));
    expect(message).toBe(paragraphs[0] + " " + paragraphs[1]);
  });
});

test("build region closure messages", () => {
  const titles = ["Foo", "Bar", "Baz", "Qux"];
  const dates = ["Dec 20, 2021", null, "Jun 23, 2021", null];
  const types = ["closure", "reopening", null, null];

  const messages = buildRegionClosuresMessages(titles, dates, types);
  expect(messages.length).toBe(titles.length);
  expect(messages[0]).toBe("(1) Dec 20, 2021 closure: Foo");
  expect(messages[1]).toBe("(2) reopening: Bar");
  expect(messages[2]).toBe("(3) Jun 23, 2021: Baz");
  expect(messages[3]).toBe("(4) Qux");
});
