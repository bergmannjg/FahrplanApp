#!/usr/bin/env ts-node-script

// extract pz (Personenzug) strecken from file strecken.json
// requires ts-node (https://github.com/TypeStrong/ts-node)

import { RailwayRoute, BetriebsstelleRailwayRoutePosition, Streckenutzung } from '../src/lib/db-data'
const fs = require('fs');
const strecken = require('../db-data/strecken.json') as Array<RailwayRoute>;
const betriebsstellen_streckennummer = require('../db-data/betriebsstellen_streckennummer.json') as Array<BetriebsstelleRailwayRoutePosition>;
const streckennutzung = require('../db-data/strecken_nutzung.json') as Array<Streckenutzung>;

const strecken_pz = strecken.filter(s => streckennutzung.find(sn => sn.strecke_nr === s.STRNR && sn.bahnnutzung.startsWith('Pz')))

fs.writeFile("./db-data/strecken_pz.json", JSON.stringify(strecken_pz), function (err: any) {
    if (err) {
        console.log(err);
    }
});

const betriebsstellen_streckennummer_pz = betriebsstellen_streckennummer.filter(bs => streckennutzung.find(sn => sn.strecke_nr === bs.STRECKE_NR && sn.bahnnutzung.startsWith('Pz')))

fs.writeFile("./db-data/betriebsstellen_streckennummer_pz.json", JSON.stringify(betriebsstellen_streckennummer_pz), function (err: any) {
    if (err) {
        console.log(err);
    }
});