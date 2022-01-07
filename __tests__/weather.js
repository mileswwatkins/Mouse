const {
  shortenDayName,
  buildIntroMessage,
  shortenWeather,
  buildWeatherMessages,
} = require("../functions/weather.private.js");

describe("shorten day name", () => {
  test("just the day name", () => {
    expect(shortenDayName("Sunday")).toBe("Sun");
  });
  test("day name with additional content", () => {
    expect(shortenDayName("Monday night")).toBe("Mon night");
  });
});

describe("build intro message", () => {
  test("without hazards", () => {
    expect(buildIntroMessage("10 mi E of Eden", "420", [], 3)).toBe(
      "3-day forecast for 10 mi E of Eden, elevation 420 ft."
    );
  });

  test("with hazards", () => {
    expect(
      buildIntroMessage(
        "40 mi S of Pacific",
        "3",
        ["tsunami", "flash flood"],
        2
      )
    ).toBe(
      "2-day forecast for 40 mi S of Pacific, elevation 3 ft; warnings: tsunami, flash flood."
    );
  });
});

describe("shorten weather", () => {
  test("shorten cardinal directions", () => {
    expect(shortenWeather("Wind north northeast all day")).toBe(
      "Wind NNE all day"
    );
    expect(
      shortenWeather(
        "Wind north northeast in morning, then northeast in afternoon"
      )
    ).toBe("Wind NNE in morning, then NE in afternoon");
  });

  test("remove double spaces", () => {
    expect(shortenWeather("Icy conditions.  Windy conditions. Hazards.")).toBe(
      "Icy conditions. Windy conditions. Hazards."
    );
  });

  test("text abbreviations", () => {
    expect(
      shortenWeather("Windy with a high around 55, falling to a low near 20")
    ).toBe("Windy high of 55, falling to a low of 20");
    expect(shortenWeather("Windy, with gusts as high as 20 mph")).toBe(
      "Windy, with 20 mph gusts"
    );
  });
});

test("build weather messages", () => {
  expect(
    buildWeatherMessages(
      ["Tonight", "Mon"],
      ["Cloudy with a chance of meatballs", "Sunny all day"],
      1
    )
  ).toEqual([
    "Tonight: Cloudy with a chance of meatballs",
    "Mon: Sunny all day",
  ]);
});
