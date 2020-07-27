import { Lazy } from './Lazy'
import createTree from 'functional-red-black-tree'
import type { RedBlackTree } from 'functional-red-black-tree'
import { Dijkstra } from './dijkstra'
import type { Graph } from './dijkstra'

const railwayRoutesOrig = new Lazy<RailwayRoute[]>(() => require('../../db-data/strecken.json') as Array<RailwayRoute>, 'railwayRoutes')
const stops = new Lazy<Stop[]>(() => require('../../db-data/D_Bahnhof_2020_alle.json') as Array<Stop>, 'haltestellen')
const betriebsstellen = new Lazy<Betriebsstelle[]>(() => require('../../db-data/DBNetz-Betriebsstellenverzeichnis-Stand2018-04.json') as Array<Betriebsstelle>, 'betriebsstellen')
const railwayRoutes = new Lazy<RailwayRoute[]>(() => require('../../db-data/strecken_pz.json') as Array<RailwayRoute>, 'railwayRoutes')
const betriebsstellenWithRailwayRoutePositions = new Lazy<BetriebsstelleRailwayRoutePosition[]>(() => require('../../db-data/betriebsstellen_streckennummer_pz.json') as Array<BetriebsstelleRailwayRoutePosition>, 'betriebsstellenWithRailwayRoutePositions')
const railwayRouteCache = new Lazy<RailwayRouteCache[]>(() => require('../../db-data/RailwayRouteCache.json') as Array<RailwayRouteCache>, 'railwayRouteCache')
const streckennutzung = new Lazy<Streckenutzung[]>(() => require('../../db-data/strecken_nutzung.json') as Array<Streckenutzung>, 'streckennutzung');

const graph = new Lazy<Graph>(() => require('../../db-data/graph.json') as Graph)

const dijkstra = new Dijkstra();

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

interface RailwayRouteOfTrip {
    railwayRouteNr?: number;
    from?: BetriebsstelleWithRailwayRoutePosition;
    to?: BetriebsstelleWithRailwayRoutePosition;
}

interface RailwayRouteCache {
    uicFrom: number;
    uicTo: number;
    railwayRoutes: Array<RailwayRouteOfTrip>;
}

const btDS100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions = new Lazy<RedBlackTree<string, Array<BetriebsstelleRailwayRoutePosition>>>(() => createTreeDs100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions(), 'btDS100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions');

function createTreeDs100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions() {
    let tree = betriebsstellenWithRailwayRoutePositions.value
        .reduce((accu: RedBlackTree<string, Array<BetriebsstelleRailwayRoutePosition>>, bs) => {
            const entry = accu.get(bs.KUERZEL);
            if (entry) entry.push(bs);
            else accu = accu.insert(bs.KUERZEL, [bs]);
            return accu;
        }, createTree());

    // remove Ds100 items without crossings
    tree.forEach((k, v) => {
        if (v.length < 2) {
            tree = tree.remove(k);
        }
        return false; // continue
    })

    return tree;
}

const btStreckennutzung = new Lazy<RedBlackTree<number, Streckenutzung[]>>(() => createTreeStreckennutzung(), 'btStreckennutzung');

function createTreeStreckennutzung() {
    let tree = streckennutzung.value
        .reduce((accu: RedBlackTree<number, Streckenutzung[]>, s) => {
            const entry = accu.get(s.strecke_nr);
            if (entry) entry.push(s)
            else accu = accu.insert(s.strecke_nr, [s]);
            return accu;
        }, createTree());

    return tree;
}

function getSpeed(geschwindigkeit: string) {
    var regex = /ab (\d+) bis (\d+) km/;
    var match = regex.exec(geschwindigkeit);
    return match?.length === 3 ? parseInt(match[2]) : 0
}
const btStreckennutzungGeschwindigkeit = new Lazy<RedBlackTree<number, number>>(() => createTreeStreckennutzungGeschwindigkeit(), 'btStreckennutzung');

function createTreeStreckennutzungGeschwindigkeit() {
    let tree = streckennutzung.value
        .reduce((accu: RedBlackTree<number, number>, s) => {
            const speed = getSpeed(s.geschwindigkeit)
            const entry = accu.get(s.strecke_nr);
            if (entry) {
                if (entry < speed) {
                    accu = accu.remove(s.strecke_nr);
                    accu = accu.insert(s.strecke_nr, speed);
                }
            }
            else {
                accu = accu.insert(s.strecke_nr, speed);
            }
            return accu;
        }, createTree());

    return tree;
}

function insertOrdered(arr: Array<BetriebsstelleRailwayRoutePosition>, somevalue: BetriebsstelleRailwayRoutePosition) {
    let added = false;
    for (var i = 0, len = arr.length; i < len; i++) {
        if (somevalue.KM_I < arr[i].KM_I) {
            arr.splice(i, 0, somevalue);
            added = true;
            break;
        }
    }
    if (!added) arr.push(somevalue);
    return arr;
}

const btRailwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions = new Lazy<RedBlackTree<number, Array<BetriebsstelleRailwayRoutePosition>>>(() => createTreeRailwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions(), 'btRailwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions');

function createTreeRailwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions() {
    let newTree = createTree();
    btDS100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions.value
        .forEach((k: string, arrBs: Array<BetriebsstelleRailwayRoutePosition>) => {
            arrBs.forEach(bs => {
                const entry = newTree.get(bs.STRECKE_NR) as Array<BetriebsstelleRailwayRoutePosition> | undefined;
                if (entry) insertOrdered(entry, bs);
                else newTree = newTree.insert(bs.STRECKE_NR, [bs]);
            })
            return false; // continue
        })

    return newTree;
}

const btRailwayRouteNrOfBetriebsstellenWithRailwayRoutePositions = new Lazy<RedBlackTree<number, Array<BetriebsstelleRailwayRoutePosition>>>(() => createTreeRailwayRouteNrOfBetriebsstellenWithRailwayRoutePositions(), 'btRailwayRouteNrOfBetriebsstellenWithRailwayRoutePositions');

function createTreeRailwayRouteNrOfBetriebsstellenWithRailwayRoutePositions() {
    return betriebsstellenWithRailwayRoutePositions.value
        .reduce((accu: RedBlackTree<number, Array<BetriebsstelleRailwayRoutePosition>>, bs) => {
            const entry = accu.get(bs.STRECKE_NR);
            if (entry) entry.push(bs);
            else accu = accu.insert(bs.STRECKE_NR, [bs]);
            return accu;
        }, createTree())
}

/** assumes arr is ordered */
function findPrev(arr: Array<BetriebsstelleRailwayRoutePosition>, km_i: number) {
    let prev: BetriebsstelleRailwayRoutePosition | undefined = undefined
    for (let n = 0; n < arr.length; n++) {
        const curr = arr[n];
        if (km_i > curr.KM_I) prev = curr;
        if (km_i <= curr.KM_I) return prev;
    }
    return prev;
}

/** assumes arr is ordered */
function findNext(arr: Array<BetriebsstelleRailwayRoutePosition>, km_i: number) {
    for (let n = 0; n < arr.length; n++) {
        const curr = arr[n];
        if (km_i < curr.KM_I) return curr;
    }
    return undefined;
}

/** assumes km_i belongs to line of array */
function findPrevAndNext(arr: Array<BetriebsstelleRailwayRoutePosition>, km_i: number) {
    if (arr.length < 2) return [undefined, undefined];
    return [findPrev(arr, km_i), findNext(arr, km_i)];
}

function kmi_to_meter(km_i: number) {
    const x = km_i - 100000000;
    const d1_meter = Math.trunc(x / 10000) * 100;
    const d2_meter = Math.trunc(x % 100);
    return d1_meter + d2_meter;
}

function computeDistanceOfKmI(kmiFrom: number, kmiTo: number) {
    const mtFrom = kmi_to_meter(kmiFrom);
    const mtTo = kmi_to_meter(kmiTo);
    if (mtFrom >= mtTo) return mtFrom - mtTo;
    else return mtTo - mtFrom;
}

function computeDistanceOfBs(from: BetriebsstelleRailwayRoutePosition, to: BetriebsstelleRailwayRoutePosition) {
    return computeDistanceOfKmI(from.KM_I, to.KM_I)
}

function addToGraph(g: Graph, bsOfK: BetriebsstelleRailwayRoutePosition, positions: BetriebsstelleRailwayRoutePosition[], twoWay: boolean, speed?: number) {
    if (!speed) speed = 100;
    const kmPerMin = speed / 60;
    const indexes = findPrevAndNext(positions, bsOfK.KM_I);
    if (indexes[0]) {
        const d = computeDistanceOfBs(bsOfK, indexes[0]) / 100;
        const travelTimeInMinutes = parseInt((d / kmPerMin).toFixed(0)) ?? 1;
        g[bsOfK.KUERZEL][indexes[0].KUERZEL] = travelTimeInMinutes;
        if (twoWay) {
            if (!g[indexes[0].KUERZEL]) g[indexes[0].KUERZEL] = {}
            g[indexes[0].KUERZEL][bsOfK.KUERZEL] = travelTimeInMinutes;
        }
    }
    if (indexes[1]) {
        const d = computeDistanceOfBs(bsOfK, indexes[1]) / 100;
        const travelTimeInMinutes = parseInt((d / kmPerMin).toFixed(0)) ?? 1;
        g[bsOfK.KUERZEL][indexes[1].KUERZEL] = travelTimeInMinutes;
        if (twoWay) {
            if (!g[indexes[1].KUERZEL]) g[indexes[1].KUERZEL] = {}
            g[indexes[1].KUERZEL][bsOfK.KUERZEL] = travelTimeInMinutes;
        }
    }
}

function createGraph() {
    let g: Graph = {};
    btDS100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions.value
        .forEach((k: string, arrBs: Array<BetriebsstelleRailwayRoutePosition>) => {
            if (!g[k]) g[k] = {};
            arrBs.forEach(bs => {
                const speed = btStreckennutzungGeschwindigkeit.value.get(bs.STRECKE_NR) || 100;
                const positions = btRailwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions.value.get(bs.STRECKE_NR) as Array<BetriebsstelleRailwayRoutePosition> | undefined;
                if (positions) {
                    const bsOfK = positions.find(bs => bs.KUERZEL === k);
                    if (bsOfK) addToGraph(g, bsOfK, positions, true, speed);
                }
            })
            return false; // continue
        })

    const countNodes = Object.keys(g).length
    const countEdges = Object.keys(g).reduce((accu, k) => {
        accu += Object.keys(k).length;
        return accu
    }, 0);
    console.log('createGraph: nodes', countNodes, ', edges', countEdges)
    return g;
}

function addStopToGraph(g: Graph, bs: StopWithRailwayRoutePositions) {
    if (g[bs.ds100_ref]) return;

    if (bs.streckenpositionen.length !== 1) {
        console.log('error addStopToGraph, streckenpositionen anzahl ', bs.streckenpositionen.length);
        return;
    }

    const positions = btRailwayNrWithCrossingsOfBetriebsstellenWithRailwayRoutePositions.value.get(bs.streckenpositionen[0].STRECKE_NR);
    if (positions) {
        g[bs.ds100_ref] = {};
        addToGraph(g, bs.streckenpositionen[0], positions, true);
    } else {
        console.log('error addStopToGraph, strecke ', bs.streckenpositionen[0].STRECKE_NR);
    }
}

function findBetriebsstellenWithRailwayRoutePositionForDS100WithCrossings(KUERZEL: string) {
    return btDS100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions.value.get(KUERZEL) || [];
}

function findBetriebsstellenWithRailwayRoutePositionForRailwayRouteNr(RailwayRouteNr: number) {
    const arrBs = btRailwayRouteNrOfBetriebsstellenWithRailwayRoutePositions.value.get(RailwayRouteNr) || [];
    addMoreInfo(RailwayRouteNr, arrBs);
    return arrBs;
}

function addMoreInfo(railwayRouteNr: number, arrBs: BetriebsstelleRailwayRoutePosition[]) {
    const arrStreckennutzung = btStreckennutzung.value.get(railwayRouteNr);
    if (arrStreckennutzung) {
        for (let n = 0; n < arrStreckennutzung.length; n++) {
            const curr = arrStreckennutzung[n];
            const speed = getSpeed(curr.geschwindigkeit);
            arrBs
                .filter(b => curr.von_km_i <= b.KM_I && b.KM_I <= curr.bis_km_i)
                .forEach(bsCurr => {
                    const bsExCurr = bsCurr as BetriebsstelleRailwayRoutePositionEx;
                    if ((bsExCurr.maxSpeed ?? 0) < speed) bsExCurr.maxSpeed = speed;
                });
        };
    }
}

const btUicRefOfStops = new Lazy<RedBlackTree<number, Stop>>(() => createTreeUicRefOfStops(), 'btUicRefOfStops');

function createTreeUicRefOfStops() {
    return stops.value.reduce((accu: RedBlackTree<number, Stop>, s) => {
        return accu.insert(s.EVA_NR, s);
    }, createTree())
}

function findStopForUicRef(uicref: number) {
    return btUicRefOfStops.value.get(uicref);
}

function findRailwayRoutePositionForRailwayRoutes(routes: RailwayRouteOfTrip[], allPoints: boolean): RailwayRoutePosition[] {
    return routes.reduce((accu: RailwayRoutePosition[], r) => {
        if (r.railwayRouteNr) {
            const arrBs = findBetriebsstellenWithRailwayRoutePositionForRailwayRouteNr(r.railwayRouteNr)
                .filter(bs => allPoints || (bs.KUERZEL === r.from?.ds100_ref || bs.KUERZEL === r.to?.ds100_ref || bs.STELLE_ART.startsWith('Bf')));
            const from = arrBs.findIndex(s => s.KUERZEL === r.from?.ds100_ref)
            console.log('findIndex:', from, r.from?.ds100_ref)
            const to = arrBs.findIndex(s => s.KUERZEL === r.to?.ds100_ref)
            console.log('findIndex:', to, r.to?.ds100_ref)
            if (from !== -1 && from < to) {
                const slice = arrBs.slice(from, to + 1);
                accu = accu.concat(slice.map(s => { return { GEOGR_BREITE: s.GEOGR_BREITE, GEOGR_LAENGE: s.GEOGR_LAENGE } }))
            } else if (to !== -1 && to < from) {
                const slice = arrBs.slice(to, from + 1).reverse();
                accu = accu.concat(slice.map(s => { return { GEOGR_BREITE: s.GEOGR_BREITE, GEOGR_LAENGE: s.GEOGR_LAENGE } }))
            }
        }
        return accu;
    }, [])
}

function findRailwayRoute(strecke: number) {
    return railwayRoutes.value.find(s => s.STRNR === strecke);
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

function getFirstPartOfDS100(ds100: string) {
    const index = ds100.indexOf(',');
    if (index > 0) return ds100.substr(0, index);
    else return ds100;
}

function findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern(ds100Pattern: string) {
    const splitDs100 = ds100Pattern.indexOf(',') > 0 ? ds100Pattern.split(',') : [];
    return betriebsstellenWithRailwayRoutePositions.value.filter(b => matchWithDS100(b.KUERZEL, ds100Pattern, splitDs100));
}

function findStopWithRailwayRoutePositions(uicrefs: number[]) {
    return uicrefs.reduce((accu: StopWithRailwayRoutePositions[], uicref) => {
        const hs = findStopForUicRef(uicref);
        if (hs) {
            const streckenpositionen =
                hs.streckenpositionen ??
                findBetriebsstellenWithRailwayRoutePositionsForDS100Pattern(hs.DS100);
            console.log('uic_ref:', uicref, ', Ds100:', hs.DS100, ', name:', hs.NAME, ', streckenpositionen:', streckenpositionen.length, ', from cache:', hs.streckenpositionen !== undefined)
            if (!hs.streckenpositionen) {
                hs.streckenpositionen = streckenpositionen;
            }
            if (streckenpositionen.length > 0) {
                accu.push({ ds100_ref: hs.DS100, uic_ref: uicref, name: hs.NAME, streckenpositionen });
            } else {
                accu.push({ ds100_ref: hs.DS100, uic_ref: uicref, name: hs.NAME, streckenpositionen });
            }
        } else {
            accu.push({ ds100_ref: '', uic_ref: uicref, name: '', streckenpositionen: [] });
        }
        return accu;
    }, []);
}

function removeDuplicates(arr: Array<number>) {
    const temp: Array<number> = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== arr[i + 1]) { temp.push(arr[i]); }
    }
    return temp;
}

function buildStopWithRailwayRoutePosition(streckennummer: number, hspos: StopWithRailwayRoutePositions): BetriebsstelleWithRailwayRoutePosition {
    const position = hspos.streckenpositionen.find(s => s.STRECKE_NR === streckennummer);
    return {
        ds100_ref: getFirstPartOfDS100(hspos.ds100_ref),
        name: hspos.name,
        railwayRoutePosition: position
    }
}

function findRailwayRouteText(railwayRouteNr: number) {
    const route = railwayRoutes.value.find(s => s.STRNR === railwayRouteNr);
    return route ? route.STRKURZN : '';
}

function computeDistanceOfBetriebsstellen(strecke: number, ds100A: string, ds100B: string, distanceOfUndef?: number) {
    const bsAnStrecke = findBetriebsstellenWithRailwayRoutePositionForRailwayRouteNr(strecke);
    const nodeA = bsAnStrecke.find(s => s.KUERZEL === ds100A);
    const nodeB = bsAnStrecke.find(s => s.KUERZEL === ds100B);
    if (nodeA && nodeB) {
        return computeDistanceOfKmI(nodeA.KM_I, nodeB.KM_I) / 1000;
    } else {
        return distanceOfUndef ?? 0;
    }
}

function computeDistance(routes: Array<RailwayRouteOfTrip>) {
    return routes.reduce((accu: number, r) => {
        if (r.railwayRouteNr && r.from && r.to) {
            accu += computeDistanceOfBetriebsstellen(r.railwayRouteNr, r.from?.ds100_ref, r.to?.ds100_ref)
        }
        return accu;
    }, 0)
}

interface State {
    railwayRoutes: Array<RailwayRouteOfTrip>;
    actualRailwayRoute: RailwayRouteOfTrip | undefined;
    success: boolean;
}

function findRailwayRoutesFromCache(state: State, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions): State {
    const cache = railwayRouteCache.value.find(c => hs_pos_von.uic_ref === c.uicFrom && hs_pos_bis.uic_ref === c.uicTo);
    if (cache) {
        state.success = true;
        console.log('found cache: ', hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref)

        for (let n = 0; n < cache.railwayRoutes.length; n++) {
            const route = cache.railwayRoutes[n];
            if (route.railwayRouteNr && route.from && route.to) {
                addToState(state, route.railwayRouteNr, route.from, route.to, 'cache')
            }
        }
    }
    return state;
}

function findRailwayRoutesFromPath(state: State, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions): State {
    hs_pos_von.ds100_ref = getFirstPartOfDS100(hs_pos_von.ds100_ref)
    hs_pos_bis.ds100_ref = getFirstPartOfDS100(hs_pos_bis.ds100_ref)
    addStopToGraph(graph.value, hs_pos_von);
    addStopToGraph(graph.value, hs_pos_bis);

    var path = dijkstra.find_path(graph.value, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref);
    console.log('hs_pos_von', hs_pos_von.ds100_ref, ', hs_pos_bis', hs_pos_bis.ds100_ref, ', path', path)
    if (path.length === 2) {
        state.success = true;

        const intersection = hs_pos_von.streckenpositionen.find(a => hs_pos_bis.streckenpositionen.find(b => a.STRECKE_NR === b.STRECKE_NR));
        if (intersection) {
            const lastRailwayRoute = state.railwayRoutes.length > 0 ? state.railwayRoutes[state.railwayRoutes.length - 1] : undefined;
            if (lastRailwayRoute && lastRailwayRoute.railwayRouteNr === intersection.STRECKE_NR) {
                lastRailwayRoute.to = buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_bis)
            } else {
                state.actualRailwayRoute = {
                    railwayRouteNr: intersection.STRECKE_NR,
                    from: buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_von),
                    to: buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_bis)
                }
                state.railwayRoutes.push(state.actualRailwayRoute);
            }
            state.actualRailwayRoute = undefined;
        }
    } else if (path.length > 2) {
        state.success = true;

        const arrBs: BetriebsstelleRailwayRoutePosition[] = [];

        let prevPositions = hs_pos_von.streckenpositionen;
        path.forEach(p => {
            if (p !== hs_pos_von.ds100_ref) {
                let positions: Array<BetriebsstelleRailwayRoutePosition> | undefined = undefined;
                if (p === hs_pos_von.ds100_ref) {
                    positions = hs_pos_von.streckenpositionen;
                } else if (p === hs_pos_bis.ds100_ref) {
                    positions = hs_pos_bis.streckenpositionen;
                } else {
                    positions = btDS100WithCrossingsOfBetriebsstellenWithRailwayRoutePositions.value.get(p);
                }

                if (positions) {
                    // minimize number of railway routes
                    const intersections = prevPositions.filter(a => positions && positions.find(b => a.STRECKE_NR === b.STRECKE_NR));
                    let check = intersections.length > 0;
                    if (intersections.length > 1 && arrBs.length > 0) {
                        const lastStrecke = arrBs[arrBs.length - 1].STRECKE_NR;
                        check = undefined === intersections.find(a => a.STRECKE_NR === lastStrecke);
                    }
                    if (check) {
                        const intersection = intersections[0];
                        if (intersection) {
                            if (arrBs.length === 0 || arrBs[arrBs.length - 1].STRECKE_NR !== intersection.STRECKE_NR) arrBs.push(intersection);
                        }
                    }
                    prevPositions = positions;
                }
            }
        })
        const intersection = hs_pos_bis.streckenpositionen.find(a => prevPositions.find(b => a.STRECKE_NR === b.STRECKE_NR));
        if (intersection) {
            arrBs.push(intersection);
        }

        for (let n = 0; n < arrBs.length - 1; n++) {
            const bsPosOfA = arrBs[n];
            const bsPosOfB = arrBs[n + 1];
            addToState(state, bsPosOfA.STRECKE_NR, { ds100_ref: bsPosOfA.KUERZEL, name: bsPosOfA.BEZEICHNUNG, railwayRoutePosition: bsPosOfA }, { ds100_ref: bsPosOfB.KUERZEL, name: bsPosOfB.BEZEICHNUNG, railwayRoutePosition: bsPosOfB }, 'path')
        }
    }

    return state;
}

function findRailwayRoutesFromIntersections(state: State, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions): State {
    const intersection = hs_pos_von.streckenpositionen.find(a => hs_pos_bis.streckenpositionen.find(b => a.STRECKE_NR === b.STRECKE_NR));
    if (intersection) {
        state.success = true;
        console.log('found intersection: ', hs_pos_von.ds100_ref, intersection.STRECKE_NR, hs_pos_bis.ds100_ref)

        addToState(state, intersection.STRECKE_NR, buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_von), buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_bis), 'intersection')
    }
    return state;
}

function addToState(state: State, railwayRouteNr: number, from: BetriebsstelleWithRailwayRoutePosition, to: BetriebsstelleWithRailwayRoutePosition, rule: string) {
    if (state.actualRailwayRoute === undefined) {
        state.actualRailwayRoute = {
            railwayRouteNr,
            from,
            to
        }
    } else {
        if (state.actualRailwayRoute.railwayRouteNr === railwayRouteNr) {
            state.actualRailwayRoute.to = to;
        } else {
            if (state.actualRailwayRoute.to === undefined && state.actualRailwayRoute.railwayRouteNr) {
                state.actualRailwayRoute.to = from;
            }
            if (state.railwayRoutes.length === 0 || state.railwayRoutes[state.railwayRoutes.length - 1].railwayRouteNr !== state.actualRailwayRoute.railwayRouteNr) {
                console.log(rule, ' push to state.railwayRoutes', state.actualRailwayRoute.railwayRouteNr)
                state.railwayRoutes.push(state.actualRailwayRoute);
            }
            state.actualRailwayRoute = {
                railwayRouteNr: railwayRouteNr,
                from,
                to
            };
        }
    }
}

function removeRest(name: string, pattern: string) {
    const index = name.indexOf(pattern);
    if (index > 0) return name.substr(0, index);
    else return name;
}

function splitName(name: string) {
    const split = name.split(' - ');
    if (split.length === 2) {
        const from = removeRest(split[0], ', ');
        const to = removeRest(split[1], ', ');
        return [from, to];
    } else {
        return [];
    }
}

function findBetriebsstelleDS100(name: string) {
    const split = splitName(name);
    if (split.length === 2) {
        const from = betriebsstellen.value.find(b => b.Name === split[0] || b.Kurzname === split[0]);
        const to = betriebsstellen.value.find(b => b.Name === split[1] || b.Kurzname === split[1]);
        return [from, to];
    } else {
        return [undefined, undefined];
    }
}

function findRailwayRouteDS100Endpoint() {
    const rrDS100Endpoints: RailwayRouteDS100Endpoint[] = [];
    railwayRoutesOrig.value.forEach(s => {
        const x1 = findBetriebsstelleDS100(s.STRKURZN);
        if (x1[0] && x1[1]) {
            rrDS100Endpoints.push({ strecke: s, from: x1[0], to: x1[1] });
        } else {
            const x2 = findBetriebsstelleDS100(s.STRNAME);
            rrDS100Endpoints.push({ strecke: s, from: x1[0] || x2[0], to: x1[1] || x2[1] });
        }
    });
    return rrDS100Endpoints;
}

/**
 * find railway route numbers for the station codes of a trip,
 * the solution is not unique and there may be others with fewer railway routes.
 *
 * Search in the set of relations Betriebsstelle-RailwayRoute with the following steps:
 * 1) lookup cache (findRailwayRoutesFromCache)
 * 2) check if the stations have a common railway route (findRailwayRoutesFromIntersections)
 * 3) search using shortest path algorithm (Dijkstra) and minimize number of railway routes.
 *
 * @param uic_refs UIC station codes of trip
 * @param useCache use railwayRoute cache
 * @param routeSearchType search single or double crossings
 */
function findRailwayRoutesOfTrip(uic_refs: number[], useCache?: boolean, routeSearchType?: 'single' | 'double') {
    if (!routeSearchType) {
        routeSearchType = 'double';
    }

    const hs_pos_list = findStopWithRailwayRoutePositions(removeDuplicates(uic_refs));
    let state: State = { railwayRoutes: [], actualRailwayRoute: undefined, success: false }
    for (let n = 0; n < hs_pos_list.length - 1; n++) {
        const hs_pos_from = hs_pos_list[n];
        const hs_pos_to = hs_pos_list[n + 1];
        state.success = false;
        if (!state.success && useCache) {
            state = findRailwayRoutesFromCache(state, hs_pos_from, hs_pos_to);
        }
        if (!state.success) {
            state = findRailwayRoutesFromIntersections(state, hs_pos_from, hs_pos_to);
        }
        if (!state.success) {
            state = findRailwayRoutesFromPath(state, hs_pos_from, hs_pos_to);
        }
        if (!state.success) {
            console.log('found nothing: ', hs_pos_from.ds100_ref, hs_pos_to.ds100_ref)
        }
    }
    if (state.actualRailwayRoute !== undefined) {
        if (state.railwayRoutes.length > 0) {
            if (state.railwayRoutes[state.railwayRoutes.length - 1].railwayRouteNr !== state.actualRailwayRoute.railwayRouteNr) {
                state.railwayRoutes.push(state.actualRailwayRoute);
            }
        } else {
            state.railwayRoutes.push(state.actualRailwayRoute);
        }
    }
    return state.railwayRoutes;
}

export { createGraph, findRailwayRoutesOfTrip, findRailwayRouteDS100Endpoint, findRailwayRoutePositionForRailwayRoutes, findBetriebsstellenWithRailwayRoutePositionForRailwayRouteNr as findBetriebsstellenMitPositionAnStreckeForRailwayRouteNr, findRailwayRoute, findRailwayRouteText, computeDistance }

export type { Stop, BetriebsstelleRailwayRoutePositionEx, Streckenutzung, BetriebsstelleRailwayRoutePosition, RailwayRouteOfTrip, RailwayRouteCache, RailwayRoute, RailwayRouteDS100Endpoint }