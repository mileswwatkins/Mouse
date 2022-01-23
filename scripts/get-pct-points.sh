#! /bin/sh

# Requirements:
# - wget
# - zip
# - gdal
# - csvkit
# - sed

set -e

rm -f /tmp/pct-points.csv
touch /tmp/pct-points.csv

for gpx_zip in \
    s_ca_halfmile_gpx \
    n_ca_halfmile_gpx \
    or_halfmile_gpx \
    wa_halfmile_gpx
do
    echo "Fetching ${gpx_zip}.zip"

    wget \
        --quiet \
        --timestamping \
        --directory-prefix /tmp \
        https://halfmilemedia.com/pct_content/${gpx_zip}.zip
    unzip \
        -oq \
        -d /tmp \
        /tmp/${gpx_zip}.zip

    for f in /tmp/"${gpx_zip}"/*_waypoints.gpx; do
        echo "Processing ${f}"

        rm -f /tmp/pct-points-to-append.csv
        # Could also fetch half-mile mileage by including
        # `GLOB [0-9][0-9][0-9][0-9]-5`
        ogr2ogr \
            -f CSV \
            -dialect SQLite \
            -sql "
                SELECT ROUND(ST_X(geometry), 5) AS x,
                    ROUND(ST_Y(geometry), 5) AS y,
                    ROUND(ele) AS e,
                    CAST(name AS INTEGER) AS m
                FROM waypoints
                WHERE sym = 'Triangle, Red' AND
                    name GLOB '[0-9][0-9][0-9][0-9]'
            " \
            /tmp/pct-points-to-append.csv \
            "$f"

        csvstack \
            /tmp/pct-points-to-append.csv\
            /tmp/pct-points.csv \
        > /tmp/pct-points-appended.csv
        mv /tmp/pct-points-appended.csv /tmp/pct-points.csv
    done
done

# Need to use `sed` because otherwise `csvjson` adds a `.0`
# after all of the elevation and mileage numbers from the CSV
csvsort \
    -c m \
    /tmp/pct-points.csv \
| csvjson \
| sed 's/.0,/,/g' \
| sed 's/.0}/}/g' \
> ../assets/pct-points.js

# Make the output function as a `require`-able JavaScript file
echo "module.exports = $(cat ../assets/pct-points.js)" \
> ../assets/pct-points.js
