#!/usr/bin/env ts-node-script

// extends file betriebsstellen_open_data.json with missing information of railway route endpoints
// requires ts-node (https://github.com/TypeStrong/ts-node)

import { findRailwayRouteDS100Endpoint, RailwayRouteDS100Endpoint, BetriebsstelleRailwayRoutePosition } from '../src/lib/db-data'
const fs = require('fs');
const BetriebsstelleRailwayRoutePositionOrig = require('../db-data/betriebsstellen_open_data.json') as Array<BetriebsstelleRailwayRoutePosition>;

// missing from dataset/geo-betriebsstelle, see https://de.wikipedia.org/wiki/Bahnstrecke_Berlin-Lehrte
export const missing = JSON.parse(`[
    {
        "STRECKE_NR": 6107,
        "RICHTUNG": 0,
        "KM_I": 101270080,
        "KM_L": "12,7 + 80",
        "BEZEICHNUNG": "Berlin-Spandau",
        "STELLE_ART": "Bf",
        "KUERZEL": "BSPD",
        "GK_R_DGN": 3784891.889,
        "GK_H_DGN": 5830637.917,
        "GEOGR_BREITE": 52.53424057,
        "GEOGR_LAENGE": 13.19826406
    }
]`) as Array<BetriebsstelleRailwayRoutePosition>;

function createMissingTripPositions(betriebsstelleMitPosition: Array<BetriebsstelleRailwayRoutePosition>, rrEndpoints: RailwayRouteDS100Endpoint[]) {
    const rrValid = rrEndpoints.filter(r => r.from && r.to);
    const missing: BetriebsstelleRailwayRoutePosition[] = [];
    rrValid.forEach(rr => {
        const foundFrom = betriebsstelleMitPosition.find(bs => bs.KUERZEL === rr.from?.Abk && bs.STRECKE_NR === rr.strecke.STRNR);
        if (!foundFrom && rr.from) {
            const found = betriebsstelleMitPosition.find(bs => bs.KUERZEL === rr.from?.Abk);
            missing.push({ STRECKE_NR: rr.strecke.STRNR, KM_L: rr.strecke.KMANF_V, KM_I: rr.strecke.KMANF_E, BEZEICHNUNG: rr.from.Name, KUERZEL: rr.from.Abk, GEOGR_BREITE: found ? found.GEOGR_BREITE : 0, GEOGR_LAENGE: found ? found.GEOGR_LAENGE : 0, GK_H_DGN: 0, GK_R_DGN: 0, RICHTUNG: 0, STELLE_ART: '' });
        }
        const foundTo = betriebsstelleMitPosition.find(bs => bs.KUERZEL === rr.to?.Abk && bs.STRECKE_NR === rr.strecke.STRNR);
        if (!foundTo && rr.to) {
            const found = betriebsstelleMitPosition.find(bs => bs.KUERZEL === rr.to?.Abk);
            missing.push({ STRECKE_NR: rr.strecke.STRNR, KM_L: rr.strecke.KMEND_V, KM_I: rr.strecke.KMEND_E, BEZEICHNUNG: rr.to.Name, KUERZEL: rr.to.Abk, GEOGR_BREITE: found ? found.GEOGR_BREITE : 0, GEOGR_LAENGE: found ? found.GEOGR_LAENGE : 0, GK_H_DGN: 0, GK_R_DGN: 0, RICHTUNG: 0, STELLE_ART: '' });
        }
    })

    return missing;
}

const rrEndpoints = findRailwayRouteDS100Endpoint();
console.log('rrEndpoints.length: ', rrEndpoints.length);
const rrUndef = rrEndpoints.filter(r => r.from === undefined || r.to === undefined);
console.log('incomplete rrEndpoints.length: ', rrUndef.length);
const missingMissingTripPositions = createMissingTripPositions(BetriebsstelleRailwayRoutePositionOrig, rrEndpoints);
console.log('missing.length: ', missingMissingTripPositions.length);
const BetriebsstelleRailwayRoutePositionNeu = BetriebsstelleRailwayRoutePositionOrig.concat(missingMissingTripPositions, missing);
fs.writeFile("./db-data/betriebsstellen_streckennummer.json", JSON.stringify(BetriebsstelleRailwayRoutePositionNeu), function (err: any) {
    if (err) {
        console.log(err);
    }
});