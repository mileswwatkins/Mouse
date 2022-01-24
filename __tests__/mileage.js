const { getNearestPctPoint } = require("../functions/mileage.private.js");

describe("get nearest PCT point", () => {
  test("for a point right on the trail", () => {
    const mileMarker1234LatLon = [39.7874, -120.8783];
    const nearest = getNearestPctPoint(...mileMarker1234LatLon);
    expect(nearest.properties.mileage).toBe("1234");
    expect(nearest.properties.distance).toBe(0);
    expect(nearest.geometry.coordinates).toStrictEqual(
      // Coordinates here are in lon,lat format
      mileMarker1234LatLon.reverse()
    );
  });

  test("for a point far off the trail", () => {
    const mexicoCityLatLon = [19.42847, -99.12766];
    const mileMarker0LatLon = [32.5897, -116.467];
    const nearest = getNearestPctPoint(...mexicoCityLatLon);
    expect(nearest.properties.mileage).toBe("0");
    expect(nearest.properties.distance).toBeGreaterThan(700);
    expect(nearest.geometry.coordinates).toStrictEqual(
      mileMarker0LatLon.reverse()
    );
  });

  test("for a point between two mile markers", () => {
    const between2412And2413LatLon = [47.46, -121.26];
    const mileMarker2412LatLon = [47.4594, -121.2669];
    const nearest = getNearestPctPoint(...between2412And2413LatLon);
    expect(nearest.properties.mileage).toBe("2412");
    expect(nearest.properties.distance).toBeLessThan(0.5);
    expect(nearest.geometry.coordinates).toStrictEqual(
      mileMarker2412LatLon.reverse()
    );
  });
});
