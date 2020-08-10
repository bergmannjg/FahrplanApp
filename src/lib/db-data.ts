import s from '../../db-data/generated/stops.json';
const stops: Stop[] = s;

import r from '../../db-data/generated/strecken_pz.json';
const railwayRoutes: RailwayRoute[] = r;

import b from '../../db-data/generated/betriebsstellen_streckennummer_pz.json';
const betriebsstellenWithRailwayRoutePositions: BetriebsstelleRailwayRoutePosition[] = b;

// a stop is identified by EVA_NR (uic_ref) and is a Betriebsstelle
interface Stop {
    "EVA_NR": number;
    "DS100": string; // DS100 pattern
    "IFOPT": string;
    "NAME": string;
    "Verkehr": number | string;
    "Laenge": string;
    "Breite": string;
    "Betreiber_Name": string;
    "Betreiber_Nr": number | string;
    "Status": string;
    streckenpositionen?: Array<BetriebsstelleRailwayRoutePosition>
}

// a Betriebsstelle is identified by Abk (DS100)
interface Betriebsstelle {
    "Abk": string;
    "Name": string;
    "Kurzname": string;
    "Typ": string;
    "Betr-Zust": string;
    "Primary location code": string;
    "UIC": string;
    "RB": number,
    "gültig von": number,
    "gültig bis": string;
    "Netz-Key": string;
    "Fpl-rel": string;
    "Fpl-Gr": string;
}

interface RailwayRoute {
    "STRNR": number;
    "KMANF_E": number;
    "KMEND_E": number;
    "KMANF_V": string;
    "KMEND_V": string;
    "STRNAME": string;
    "STRKURZN": string;
}

interface RailwayRoutePosition {
    "GEOGR_BREITE": number;
    "GEOGR_LAENGE": number;
}

interface BetriebsstelleRailwayRoutePosition extends RailwayRoutePosition {
    "STRECKE_NR": number;
    "RICHTUNG": number;
    "KM_I": number;
    "KM_L": string;
    "BEZEICHNUNG": string;
    "STELLE_ART": string;
    "KUERZEL": string; // DS100
    "GK_R_DGN": number | string;
    "GK_H_DGN": number | string;
    maxSpeed?: number;
}

interface StopWithRailwayRoutePositions {
    ds100_ref: string; // DS100 pattern
    uic_ref: number;
    name: string;
    streckenpositionen: Array<BetriebsstelleRailwayRoutePosition>;
}

const ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions: { [index: string]: Array<BetriebsstelleRailwayRoutePosition> } = createIdxDs100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions();

function createIdxDs100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions() {
    const obj = betriebsstellenWithRailwayRoutePositions
        .reduce((accu, bs) => {
            const entry = accu[bs.KUERZEL];
            if (entry) entry.push(bs);
            else accu[bs.KUERZEL] = [bs];
            return accu;
        }, {} as { [index: string]: Array<BetriebsstelleRailwayRoutePosition> });

    // remove Ds100 items without crossings
    Object.keys(obj).forEach(k => {
        if (obj[k].length < 2) {
            delete obj[k];
        }
    })

    return obj;
}

function insertOrdered(arr: Array<BetriebsstelleRailwayRoutePosition>, somevalue: BetriebsstelleRailwayRoutePosition) {
    let added = false;
    for (let i = 0, len = arr.length; i < len; i++) {
        if (somevalue.KM_I < arr[i].KM_I) {
            arr.splice(i, 0, somevalue);
            added = true;
            break;
        }
    }
    if (!added) arr.push(somevalue);
    return arr;
}

const railwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions: { [index: number]: Array<BetriebsstelleRailwayRoutePosition> } = createIdxRailwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions();

function createIdxRailwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions() {
    const obj = {} as { [index: number]: Array<BetriebsstelleRailwayRoutePosition> };
    Object.keys(ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions)
        .forEach((k: string) => {
            ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions[k].forEach(bs => {
                const entry = obj[bs.STRECKE_NR] as Array<BetriebsstelleRailwayRoutePosition> | undefined;
                if (entry) insertOrdered(entry, bs);
                else obj[bs.STRECKE_NR] = [bs];
            })
        })

    return obj;
}

const railwayRouteNrOfBetriebsstellenWithRailwayRoutePositions: { [index: number]: Array<BetriebsstelleRailwayRoutePosition> } = createIdxRailwayRouteNrOfBetriebsstellenWithRailwayRoutePositions();

function createIdxRailwayRouteNrOfBetriebsstellenWithRailwayRoutePositions() {
    return betriebsstellenWithRailwayRoutePositions
        .reduce((accu, bs) => {
            const entry = accu[bs.STRECKE_NR];
            if (entry) entry.push(bs);
            else accu[bs.STRECKE_NR] = [bs];
            return accu;
        }, {} as { [index: number]: Array<BetriebsstelleRailwayRoutePosition> })
}

const uicRefOfStops: { [index: number]: Stop } = createIdxUicRefOfStops();

function createIdxUicRefOfStops() {
    return stops.reduce((accu, s) => {
        accu[s.EVA_NR] = s;
        return accu;
    }, {} as { [index: number]: Stop })
}

function kmi_to_meter(km_i: number) {
    const x = km_i - 100000000;
    const d1_meter = Math.trunc(x / 10000) * 100;
    const d2_meter = Math.trunc(x % 100);
    return d1_meter + d2_meter;
}

function computeDistanceOfKmI(kmiFrom: number, kmiTo: number): number {
    const mtFrom = kmi_to_meter(kmiFrom);
    const mtTo = kmi_to_meter(kmiTo);
    if (mtFrom >= mtTo) return mtFrom - mtTo;
    else return mtTo - mtFrom;
}

/*
 * examples for ds100 in haltestellen 'EBIL', 'EBIL,EBILP', 'KDN,KDN P', 'EHE P'
 */
function matchWithDS100(s: string, ds100: string, splitDs100: string[]) {
    if (s === ds100) return true;
    if (splitDs100.length === 0) return false;
    if (splitDs100.length >= 2) {
        if (s === splitDs100[0]) return true;
        if (s === splitDs100[1]) return true;
        if (splitDs100.length >= 3 && s === splitDs100[2]) return true;
    }
    return false;
}

function findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern(ds100Pattern: string): BetriebsstelleRailwayRoutePosition[] {
    const splitDs100 = ds100Pattern.indexOf(',') > 0 ? ds100Pattern.split(',') : [];
    return betriebsstellenWithRailwayRoutePositions.filter(b => matchWithDS100(b.KUERZEL, ds100Pattern, splitDs100));
}

function findStopForUicRef(uicref: number): Stop {
    return uicRefOfStops[uicref];
}

function findStreckennutzungGeschwindigkeitForRailwayRouteNr(railwayRouteNr: number): number {
    const max = railwayRouteNrOfBetriebsstellenWithRailwayRoutePositions[railwayRouteNr]
        .reduce((accu, bs) => {
            if (bs.maxSpeed && accu < bs.maxSpeed) {
                accu = bs.maxSpeed;
            }
            return accu;
        }, 0)
    return max > 0 ? max : 100
}

function findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(railwayRouteNr: number): BetriebsstelleRailwayRoutePosition[] {
    return railwayRouteNrOfBetriebsstellenWithRailwayRoutePositions[railwayRouteNr] || []
}

function findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(railwayRouteNr: number): BetriebsstelleRailwayRoutePosition[] {
    return railwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions[railwayRouteNr] || []
}

function findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForDS100(ds100: string): BetriebsstelleRailwayRoutePosition[] {
    return ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions[ds100]
}

function getDs100ValuesForCrossingsOfBetriebsstellenWithRailwayRoutePositions(): string[] {
    return Object.keys(ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions)
}

function findRailwayRoute(strecke: number): RailwayRoute | undefined {
    return railwayRoutes.find(s => s.STRNR === strecke);
}

export { computeDistanceOfKmI, getDs100ValuesForCrossingsOfBetriebsstellenWithRailwayRoutePositions, findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern, findRailwayRoute, findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr, findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr, findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForDS100, findStreckennutzungGeschwindigkeitForRailwayRouteNr, findStopForUicRef }

export type { RailwayRoutePosition, StopWithRailwayRoutePositions, Stop, BetriebsstelleRailwayRoutePosition, Betriebsstelle, RailwayRoute }