#!/usr/bin/env bash
# restore files from Open-Data-Portal of Deutsche Bahn

if [ ! -d "./scripts" ]; then
    echo "please run from project directory"
    exit 1
fi

cd db-data/original

#
# Haltestellendaten
#

INFILE=D_Bahnhof_2020_alle.CSV
OUTFILE=D_Bahnhof_2020_alle.json

rm -f ${INFILE}
rm -f ${OUTFILE}

wget -q http://download-data.deutschebahn.com/static/datasets/haltestellen/D_Bahnhof_2020_alle.CSV
npx csv2json -d -s ";" ${INFILE} ${OUTFILE}
# cleanup
sed -i -e 's/\\t//' -e 's/\xC2\xA0/ /' ${OUTFILE}
rm -f ${INFILE}

#
# Betriebsstellenverzeichnis
#

INFILE=DBNetz-Betriebsstellenverzeichnis-Stand2018-04.csv
OUTFILE=DBNetz-Betriebsstellenverzeichnis-Stand2018-04.json

rm -f ${INFILE}
rm -f ${OUTFILE}

wget -q http://download-data.deutschebahn.com/static/datasets/betriebsstellen/DBNetz-Betriebsstellenverzeichnis-Stand2018-04.csv
npx csv2json -d -s ";" ${INFILE} ${OUTFILE}
rm -f ${INFILE}

#
# Geo-Streckennetz
#

INFILE=strecken.csv 
OUTFILE=strecken.json

rm -f ${INFILE}
rm -f ${OUTFILE}
rm -rf geo-strecke
rm -f strecken_nutzung.json

wget -q http://download-data.deutschebahn.com/static/datasets/geo-strecke/geo-strecke_2020.zip
unzip -q geo-strecke_2020.zip -d geo-strecke
iconv -f 852 geo-strecke/Strecken/CSV/${INFILE} | npx csv2json -d -s "," > ${OUTFILE}
sed -i -e 's/"  /"/' -e 's/" /"/' ${OUTFILE}

tempfile=$(mktemp)

echo mifcode,strecke_nr,richtung,laenge,von_km_i,bis_km_i,von_km_l,bis_km_l,elektrifizierung,bahnnutzung,geschwindigkeit,strecke_kurzn,gleisanzahl,bahnart,kmspru_typ_anf,kmspru_typ_end > ${tempfile}
iconv -f WINDOWS-1252 geo-strecke/Strecken/MapInfoRelationen/strecken.MID >> ${tempfile}
npx csv2json -d -s "," <  ${tempfile} > strecken_nutzung.json

rm -f ${INFILE}
rm -f geo-strecke_2020.zip
rm -f ${tempfile}
rm -rf geo-strecke

#
# Geo-Betriebsstelle
#

INFILE=betriebsstellen_open_data.csv 
OUTFILE=betriebsstellen_open_data.json

rm -f ${INFILE}
rm -f ${OUTFILE}
rm -f geo-betriebsstelle_2020.zip
rm -rf geo-betriebsstelle

wget -q http://download-data.deutschebahn.com/static/datasets/geo-betriebsstelle/geo-betriebsstelle_2020.zip
unzip -q geo-betriebsstelle_2020.zip -d geo-betriebsstelle
iconv -f 852 geo-betriebsstelle/Betriebsstellen/CSV/${INFILE} | npx csv2json -d -s "," > ${OUTFILE}

rm -f ${INFILE}
rm -f geo-betriebsstelle_2020.zip
rm -rf geo-betriebsstelle

cd ..
cd ..

#
# Expand data
#

./scripts/extend-geo-information.ts

./scripts/extract-pz-strecken.ts

./scripts/create-graph.ts

./scripts/create-cache.ts

