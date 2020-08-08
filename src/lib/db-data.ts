import { Lazy } from './Lazy'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const railwayRoutesOrig = new Lazy<RailwayRoute[]>(() => require('../../db-data/original/strecken.json') as Array<RailwayRoute>, 'railwayRoutes')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const streckennutzung = new Lazy<Streckenutzung[]>(() => require('../../db-data/original/strecken_nutzung.json') as Array<Streckenutzung>, 'streckennutzung');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const betriebsstellen = new Lazy<Betriebsstelle[]>(() => require('../../db-data/original/DBNetz-Betriebsstellenverzeichnis-Stand2018-04.json') as Array<Betriebsstelle>, 'betriebsstellen')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const stops = new Lazy<Stop[]>(() => require('../../db-data/generated/stops.json') as Array<Stop>, 'haltestellen')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const railwayRoutesPz = new Lazy<RailwayRoute[]>(() => require('../../db-data/generated/strecken_pz.json') as Array<RailwayRoute>, 'railwayRoutes')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const betriebsstellenWithRailwayRoutePositions = new Lazy<BetriebsstelleRailwayRoutePosition[]>(() => require('../../db-data/generated/betriebsstellen_streckennummer_pz.json') as Array<BetriebsstelleRailwayRoutePosition>, 'betriebsstellenWithRailwayRoutePositions')

// a stop is identified by EVA_NR (uic_ref) and is a Betriebsstelle
interface Stop {
    "EVA_NR": number;
    "DS100": string; // DS100 pattern
    "IFOPT": string;
    "NAME": string;
    "Verkehr": string;
    "Laenge": string;
    "Breite": string;
    "Betreiber_Name": string;
    "Betreiber_Nr": string;
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
    "GK_R_DGN": number;
    "GK_H_DGN": number;
}

interface BetriebsstelleRailwayRoutePositionEx extends BetriebsstelleRailwayRoutePosition {
    maxSpeed?: number;
}

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

interface StopWithRailwayRoutePositions {
    ds100_ref: string; // DS100 pattern
    uic_ref: number;
    name: string;
    streckenpositionen: Array<BetriebsstelleRailwayRoutePosition>;
}

interface BetriebsstelleWithRailwayRoutePosition {
    ds100_ref: string;
    name: string;
    railwayRoutePosition?: BetriebsstelleRailwayRoutePosition;
}

interface RailwayRouteDS100Endpoint {
    strecke: RailwayRoute;
    from?: Betriebsstelle;
    to?: Betriebsstelle;
}

const ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions = new Lazy<{ [index: string]: Array<BetriebsstelleRailwayRoutePosition> }>(() => createIdxDs100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions(), 'ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions');

function createIdxDs100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions() {
    const obj = betriebsstellenWithRailwayRoutePositions.value
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

const streckeNrStreckennutzung = new Lazy<{ [index: number]: Streckenutzung[] }>(() => createIdxStreckennutzung(), 'streckeNrStreckennutzung');

function createIdxStreckennutzung() {
    const obj = streckennutzung.value
        .reduce((accu, s) => {
            const entry = accu[s.strecke_nr];
            if (entry) entry.push(s)
            else accu[s.strecke_nr] = [s];
            return accu;
        }, {} as { [index: number]: Streckenutzung[] });

    return obj;
}

function getSpeed(geschwindigkeit: string): number {
    const regex = /ab (\d+) bis (\d+) km/;
    const match = regex.exec(geschwindigkeit);
    return match?.length === 3 ? parseInt(match[2], 10) : 0
}
const streckeNrStreckennutzungGeschwindigkeit = new Lazy<{ [index: number]: number }>(() => createIdxStreckennutzungGeschwindigkeit(), 'streckeNrStreckennutzungGeschwindigkeit');

function createIdxStreckennutzungGeschwindigkeit() {
    const obj = streckennutzung.value
        .reduce((accu, s) => {
            const speed = getSpeed(s.geschwindigkeit)
            const entry = accu[s.strecke_nr];
            if (entry) {
                if (entry < speed) {
                    accu[s.strecke_nr] = speed;
                }
            }
            else {
                accu[s.strecke_nr] = speed;
            }
            return accu;
        }, {} as { [index: number]: number });

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

const railwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions = new Lazy<{ [index: number]: Array<BetriebsstelleRailwayRoutePosition> }>(() => createIdxRailwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions(), 'railwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions');

function createIdxRailwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions() {
    const obj = {} as { [index: number]: Array<BetriebsstelleRailwayRoutePosition> };
    Object.keys(ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions.value)
        .forEach((k: string) => {
            ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions.value[k].forEach(bs => {
                const entry = obj[bs.STRECKE_NR] as Array<BetriebsstelleRailwayRoutePosition> | undefined;
                if (entry) insertOrdered(entry, bs);
                else obj[bs.STRECKE_NR] = [bs];
            })
        })

    return obj;
}

const railwayRouteNrOfBetriebsstellenWithRailwayRoutePositions = new Lazy<{ [index: number]: Array<BetriebsstelleRailwayRoutePosition> }>(() => createIdxRailwayRouteNrOfBetriebsstellenWithRailwayRoutePositions(), 'railwayRouteNrOfBetriebsstellenWithRailwayRoutePositions');

function createIdxRailwayRouteNrOfBetriebsstellenWithRailwayRoutePositions() {
    return betriebsstellenWithRailwayRoutePositions.value
        .reduce((accu, bs) => {
            const entry = accu[bs.STRECKE_NR];
            if (entry) entry.push(bs);
            else accu[bs.STRECKE_NR] = [bs];
            return accu;
        }, {} as { [index: number]: Array<BetriebsstelleRailwayRoutePosition> })
}

const uicRefOfStops = new Lazy<{ [index: number]: Stop }>(() => createIdxUicRefOfStops(), 'uicRefOfStops');

function createIdxUicRefOfStops() {
    return stops.value.reduce((accu, s) => {
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
        const from = betriebsstellen.value.find(b => b.Name === split[0] || b.Kurzname === split[0]);
        const to = betriebsstellen.value.find(b => b.Name === split[1] || b.Kurzname === split[1]);
        return [from, to];
    } else {
        return [undefined, undefined];
    }
}

function findRailwayRouteDS100Endpoint(): RailwayRouteDS100Endpoint[] {
    const rrDS100Endpoints: RailwayRouteDS100Endpoint[] = [];
    railwayRoutesOrig.value.forEach(s => {
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
    return betriebsstellenWithRailwayRoutePositions.value.filter(b => matchWithDS100(b.KUERZEL, ds100Pattern, splitDs100));
}

function findStopForUicRef(uicref: number): Stop {
    return uicRefOfStops.value[uicref];
}

function findStreckennutzungForRailwayRouteNr(railwayRouteNr: number): Streckenutzung[] {
    return streckeNrStreckennutzung.value[railwayRouteNr]
}

function findStreckennutzungGeschwindigkeitForRailwayRouteNr(railwayRouteNr: number): number {
    return streckeNrStreckennutzungGeschwindigkeit.value[railwayRouteNr] || 100
}

function findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(railwayRouteNr: number): BetriebsstelleRailwayRoutePosition[] {
    return railwayRouteNrOfBetriebsstellenWithRailwayRoutePositions.value[railwayRouteNr] || []
}

function findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(railwayRouteNr: number): BetriebsstelleRailwayRoutePosition[] {
    return railwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions.value[railwayRouteNr] || []
}

function findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForDS100(ds100: string): BetriebsstelleRailwayRoutePosition[] {
    return ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions.value[ds100]
}

function getDs100ValuesForCrossingsOfBetriebsstellenWithRailwayRoutePositions(): string[] {
    return Object.keys(ds100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions.value)
}

function findRailwayRoute(strecke: number): RailwayRoute | undefined {
    return railwayRoutesPz.value.find(s => s.STRNR === strecke);
}

export { getSpeed, computeDistanceOfKmI, getDs100ValuesForCrossingsOfBetriebsstellenWithRailwayRoutePositions, findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern, findRailwayRoute, findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr, findBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr, findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForDS100, findStreckennutzungGeschwindigkeitForRailwayRouteNr, findStreckennutzungForRailwayRouteNr, findStopForUicRef, findRailwayRouteDS100Endpoint }

export type { RailwayRouteDS100Endpoint, BetriebsstelleWithRailwayRoutePosition, RailwayRoutePosition, StopWithRailwayRoutePositions, Stop, BetriebsstelleRailwayRoutePositionEx, Streckenutzung, BetriebsstelleRailwayRoutePosition, Betriebsstelle, RailwayRoute }