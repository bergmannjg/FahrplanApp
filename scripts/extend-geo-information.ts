#!/usr/bin/env ts-node-script

// extends file betriebsstellen_open_data.json with missing information of railway route endpoints
// requires ts-node (https://github.com/TypeStrong/ts-node)

import type { BetriebsstelleRailwayRoutePosition, RailwayRoute, Stop, Betriebsstelle } from '../src/lib/db-data'
const fs = require('fs');
const betriebsstelleRailwayRoutePositionOrig = require('../db-data/original/betriebsstellen_open_data.json') as Array<BetriebsstelleRailwayRoutePositionOrig>;
const stops = require('../db-data/original/D_Bahnhof_2020_alle.json') as Array<Stop>
const railwayRoutes = require('../db-data/original/strecken.json') as Array<RailwayRoute>
const betriebsstellen = require('../db-data/original/DBNetz-Betriebsstellenverzeichnis-Stand2018-04.json') as Array<Betriebsstelle>
const streckennutzung = require('../db-data/original/strecken_nutzung.json') as Array<Streckenutzung>

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

interface BetriebsstelleRailwayRoutePositionOrig {
    "STRECKE_NR": number;
    "RICHTUNG": number;
    "KM_I": number;
    "KM_L": string;
    "BEZEICHNUNG": string;
    "STELLE_ART": string;
    "KUERZEL": string; // DS100
    "GK_R_DGN": number | string;
    "GK_H_DGN": number | string;
    "GEOGR_BREITE": number | string;
    "GEOGR_LAENGE": number;
}

interface RailwayRouteDS100Endpoint {
    strecke: RailwayRoute;
    from?: Betriebsstelle;
    to?: Betriebsstelle;
}

/** 
 * missing from dataset/geo-betriebsstelle,
 * route 6107: see https://de.wikipedia.org/wiki/Bahnstrecke_Berlin-Lehrte
 * route 1103: see https://trassenfinder.de
 */
const missing = JSON.parse(`[
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

function removeRest(name: string, pattern: string) {
    const index = name.indexOf(pattern);
    if (index > 0) return name.substr(0, index);
    else return name;
}

/** split streckekurzname like 'Bln-Spandau - Hamburg-Altona' */
function splitStreckekurzname(streckekurzname: string) {
    const split = streckekurzname.split(' - ');
    if (split.length === 2) {
        const from = removeRest(split[0], ', ');
        const to = removeRest(split[1], ', ');
        return [from, to];
    } else {
        return [];
    }
}

function findBetriebsstelleForStreckekurzname(streckekurzname: string) {
    const split = splitStreckekurzname(streckekurzname);
    if (split.length === 2) {
        const from = betriebsstellen.find(b => b.Name === split[0] || b.Kurzname === split[0]);
        const to = betriebsstellen.find(b => b.Name === split[1] || b.Kurzname === split[1]);
        return [from, to];
    } else {
        return [undefined, undefined];
    }
}

function findRailwayRouteDS100Endpoint(): RailwayRouteDS100Endpoint[] {
    const rrDS100Endpoints: RailwayRouteDS100Endpoint[] = [];
    railwayRoutes.forEach(s => {
        const x1 = findBetriebsstelleForStreckekurzname(s.STRKURZN);
        if (x1[0] && x1[1]) {
            rrDS100Endpoints.push({ strecke: s, from: x1[0], to: x1[1] });
        } else {
            const x2 = findBetriebsstelleForStreckekurzname(s.STRNAME);
            rrDS100Endpoints.push({ strecke: s, from: x1[0] || x2[0], to: x1[1] || x2[1] });
        }
    });
    return rrDS100Endpoints;
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

function getSpeed(geschwindigkeit: string): number {
    const regex = /ab (\d+) bis (\d+) km/;
    const match = regex.exec(geschwindigkeit);
    return match?.length === 3 ? parseInt(match[2], 10) : 0
}

function findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(railwayRouteNr: number, arrAllBs: Array<BetriebsstelleRailwayRoutePosition>) {
    return arrAllBs.filter(bs => bs.STRECKE_NR === railwayRouteNr) || []
}

function addMaxSpeed(arrAllBs: Array<BetriebsstelleRailwayRoutePosition>) {
    railwayRoutes.forEach(r => {
        const arrBs = findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(r.STRNR, arrAllBs);
        addMaxSpeedForRailwayRouteNr(r.STRNR, arrBs);
    })
}

function findStreckennutzungForRailwayRouteNr(railwayRouteNr: number) {
    return streckennutzung.filter(s => s.strecke_nr === railwayRouteNr) || [];
}

function addMaxSpeedForRailwayRouteNr(railwayRouteNr: number, arrBs: BetriebsstelleRailwayRoutePosition[]) {
    const arrStreckennutzung = findStreckennutzungForRailwayRouteNr(railwayRouteNr);
    if (arrStreckennutzung) {
        for (const curr of arrStreckennutzung) {
            const speed = getSpeed(curr.geschwindigkeit);
            arrBs
                .filter(b => curr.von_km_i <= b.KM_I && b.KM_I <= curr.bis_km_i)
                .forEach(bsCurr => {
                    if ((bsCurr.maxSpeed ?? 0) < speed) bsCurr.maxSpeed = speed;
                });
        }
    }
}

// fix typ errors
betriebsstelleRailwayRoutePositionOrig.forEach(bs => {
    const b: any = bs.GEOGR_BREITE;
    if (typeof b === "string") {
        console.log('type error', bs.STRECKE_NR, bs.KUERZEL, bs.GEOGR_BREITE);
        bs.GEOGR_BREITE = 0;
    }
})

const betriebsstelleRailwayRoutePosition = betriebsstelleRailwayRoutePositionOrig as BetriebsstelleRailwayRoutePosition[];

const rrEndpoints = findRailwayRouteDS100Endpoint();
console.log('rrEndpoints.length: ', rrEndpoints.length);
const rrUndef = rrEndpoints.filter(r => r.from === undefined || r.to === undefined);
console.log('incomplete rrEndpoints.length: ', rrUndef.length);
const missingMissingTripPositions = createMissingTripPositions(betriebsstelleRailwayRoutePosition, rrEndpoints);
console.log('missing.length: ', missingMissingTripPositions.length);
const betriebsstelleRailwayRoutePositionNeu = betriebsstelleRailwayRoutePositionOrig.concat(missingMissingTripPositions, missing);
addMaxSpeed(betriebsstelleRailwayRoutePosition);
fs.writeFile("./db-data/generated/betriebsstellen_streckennummer.json", JSON.stringify(betriebsstelleRailwayRoutePositionNeu), function (err: any) {
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
