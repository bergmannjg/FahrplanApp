#!/usr/bin/env bash

/usr/bin/tsc $*

sed -i "s/distance';/distance.js';/" ./dist/src/lib/hafas.js
sed -i "s/distance';/distance.js';/" ./dist/src/lib/rinf-data-railway-routes.js
