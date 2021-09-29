#!/usr/bin/env bash
# get file from Open-Data-Portal of Deutsche Bahn to map UIC station codes to RInf OPIDs
# see https://de.wikipedia.org/wiki/Interne_Bahnhofsnummer
# https://rinf.era.europa.eu/API/Help/ResourceModel?modelName=OperationalPoint

if [ ! -d "./scripts" ]; then
    echo "please run from project directory"
    exit 1
fi

if [ ! -d "./db-data" ]; then
    mkdir db-data
fi

cd db-data

INFILE=D_Bahnhof_2020_alle.CSV
OUTFILE=D_Bahnhof_2020_alle.json

rm -f ${INFILE}
rm -f ${OUTFILE}

wget -q http://download-data.deutschebahn.com/static/datasets/haltestellen/D_Bahnhof_2020_alle.CSV
npx csv2json -d -s ";" ${INFILE} ${OUTFILE}
# cleanup
sed -i -e 's/\\t//' -e 's/\xC2\xA0/ /' ${OUTFILE}
rm -f ${INFILE}

npx json-property-filter --in "${OUTFILE}" --out "uic-to-opid.json" --filters "EVA_NR" --filters "DS100" --filters "Verkehr"