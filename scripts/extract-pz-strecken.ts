#!/usr/bin/env ts-node-script

// extract pz (Personenzug) strecken from file strecken.json
// requires ts-node (https://github.com/TypeStrong/ts-node)

import type { RailwayRoute, BetriebsstelleRailwayRoutePosition } from '../src/lib/db-data'
const fs = require('fs');
const strecken = require('../db-data/original/strecken.json') as Array<RailwayRoute>;
const betriebsstellen_streckennummer = require('../db-data/generated/betriebsstellen_streckennummer.json') as Array<BetriebsstelleRailwayRoutePosition>;
const streckennutzung = require('../db-data/original/strecken_nutzung.json') as Array<Streckenutzung>;

interface Streckenutzung {
    "mifcode": string;
    "strecke_nr": number;
    "richtung": number;
    "laenge": number;
    "von_km_i": number;
    "bis_km_i": number;
    "von_km_l": string;
    "bis_km_l": string;
    "elektrifizierung": string;
    "bahnnutzung": string;
    "geschwindigkeit": string;
    "strecke_kurzn": string;
    "gleisanzahl": string;
    "bahnart": string;
    "kmspru_typ_anf": string;
    "kmspru_typ_end": string;
}

const strecken_pz = strecken.filter(s => streckennutzung.find(sn => sn.strecke_nr === s.STRNR && sn.bahnnutzung.startsWith('Pz')))

fs.writeFile("./db-data/generated/strecken_pz.json", JSON.stringify(strecken_pz), function (err: any) {
    if (err) {
        console.log(err);
    }
});

const betriebsstellen_streckennummer_pz = betriebsstellen_streckennummer.filter(bs => streckennutzung.find(sn => sn.strecke_nr === bs.STRECKE_NR && sn.bahnnutzung.startsWith('Pz')))

fs.writeFile("./db-data/generated/betriebsstellen_streckennummer_pz.json", JSON.stringify(betriebsstellen_streckennummer_pz), function (err: any) {
    if (err) {
        console.log(err);
    }
});