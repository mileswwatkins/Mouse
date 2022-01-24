const fs = require("fs");
const Papa = require("papaparse");

const f = fs.readFileSync("/tmp/pct-points-sorted.csv");
const data = Papa.parse(f.toString(), {
  header: true,
  skipEmptyLines: true,
}).data;

const output = data.reduce((acc, el) => {
  acc[el.mileage] = [Number(el.x), Number(el.y)];
  return acc;
}, {});

fs.writeFileSync("../assets/pct-points.private.json", JSON.stringify(output));
