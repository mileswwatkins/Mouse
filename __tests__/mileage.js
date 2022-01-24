const { getNearestPctPoint } = require("../functions/mileage.private.js");

describe("get nearest PCT point", () => {
  test("for a point right on the trail", () => {
    const mileMarker1234Coordinates = [-120.8783, 39.7874];
    const nearest = getNearestPctPoint(...mileMarker1234Coordinates);
    expect(nearest.properties.mileage).toBe("1234");
    expect(nearest.properties.distance).toBeLessThan(0.01);
    expect(nearest.geometry.coordinates).toStrictEqual(
      mileMarker1234Coordinates
    );
  });

  test("for a point far off the trail", () => {
    const mexicoCityCoordinates = [-99.12766, 19.42847];
    const mileMarker0Coordinates = [-116.467, 32.5897];
    const nearest = getNearestPctPoint(...mexicoCityCoordinates);
    expect(nearest.properties.mileage).toBe("0");
    expect(nearest.properties.distance).toBeGreaterThan(700);
    expect(nearest.geometry.coordinates).toStrictEqual(mileMarker0Coordinates);
  });

  test("for a point between two mile markers", () => {
    const between2412And2413Coordinates = [-121.26, 47.46];
    const mileMarker2412Coordinates = [-121.2669, 47.4594];
    const nearest = getNearestPctPoint(...between2412And2413Coordinates);
    expect(nearest.properties.mileage).toBe("2412");
    expect(nearest.properties.distance).toBeLessThan(0.5);
    expect(nearest.geometry.coordinates).toStrictEqual(
      mileMarker2412Coordinates
    );
  });
});
