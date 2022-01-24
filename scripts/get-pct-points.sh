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
                SELECT CAST(name AS INTEGER) AS mileage,
                    ROUND(ST_X(geometry), 4) AS x,
                    ROUND(ST_Y(geometry), 4) AS y
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

csvsort \
    -c mileage \
    /tmp/pct-points.csv \
> /tmp/pct-points-sorted.csv

echo 'Writing JSON output to `../assets/pct-points.json`'
node format-pct-points.js
