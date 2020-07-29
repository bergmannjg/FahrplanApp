#!/usr/bin/env ts-node-script

// extends file betriebsstellen_open_data.json with missing information of railway route endpoints
// requires ts-node (https://github.com/TypeStrong/ts-node)

import { findRailwayRouteDS100Endpoint, RailwayRouteDS100Endpoint, BetriebsstelleRailwayRoutePosition, Stop } from '../src/lib/db-data'
const fs = require('fs');
const BetriebsstelleRailwayRoutePositionOrig = require('../db-data/original/betriebsstellen_open_data.json') as Array<BetriebsstelleRailwayRoutePosition>;
const stops = require('../db-data/original/D_Bahnhof_2020_alle.json') as Array<Stop>

/** 
 * missing from dataset/geo-betriebsstelle,
 * route 6107: see https://de.wikipedia.org/wiki/Bahnstrecke_Berlin-Lehrte
 * route 1103: see https://trassenfinder.de
 */
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
    },
    {
        "STRECKE_NR": 1103,
        "KM_L": "8,8 + 55",
        "KM_I": 100880055,
        "BEZEICHNUNG": "Burg (Fehmarn) West",
        "KUERZEL": "ABUW",
        "GEOGR_BREITE": 54.45033292,
        "GEOGR_LAENGE": 11.18080135,
        "GK_H_DGN": 0,
        "GK_R_DGN": 0,
        "RICHTUNG": 0,
        "STELLE_ART": ""
    },
    {
        "STRECKE_NR": 1103,
        "KM_L": "8,0 + 31",
        "KM_I": 100800031,
        "BEZEICHNUNG": "Burg (Fehmarn) Abzw",
        "KUERZEL": "ABUA",
        "GEOGR_BREITE": 54.4472937,
        "GEOGR_LAENGE": 11.1856228,
        "GK_H_DGN": 0,
        "GK_R_DGN": 0,
        "RICHTUNG": 0,
        "STELLE_ART": ""
    }, 
    {
        "STRECKE_NR": 1103,
        "RICHTUNG": 0,
        "KM_I": 100740052,
        "KM_L": "7,4 + 52",
        "BEZEICHNUNG": "Fehmarn-Burg",
        "STELLE_ART": "Bf",
        "KUERZEL": "ABUF",
        "GK_R_DGN": 0,
        "GK_H_DGN": 0,
        "GEOGR_BREITE": 54.443591,
        "GEOGR_LAENGE": 11.18898
    }
]`) as Array<BetriebsstelleRailwayRoutePosition>;

/** see check-missing.ts, results are 'EBILP' and 'ABUF' */
function createMissingStopData(stops: Array<Stop>) {
    const stop = stops.find(s => s.EVA_NR === 8000036 && s.DS100 === "EBILP");
    if (stop) {
        stop.DS100 = "EBIL,EBILP";
    }
    return stops;
}

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
fs.writeFile("./db-data/generated/betriebsstellen_streckennummer.json", JSON.stringify(BetriebsstelleRailwayRoutePositionNeu), function (err: any) {
    if (err) {
        console.log(err);
    }
});

const newStops = createMissingStopData(stops)
fs.writeFile("./db-data/generated/stops.json", JSON.stringify(newStops), function (err: any) {
    if (err) {
        console.log(err);
    }
});
