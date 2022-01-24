# Utility scripts

Note: all scripts must be run from a shell within this directory.

## Inventory

- `get-pct-points.sh` generates the `../assets/pct-points.json` file, containing the latitude and longitude of each mile marker on the PCT.
  - `format-pct-points.js` is run by `get-pct-points.sh` to convert its CSV into specific JSON structure.
