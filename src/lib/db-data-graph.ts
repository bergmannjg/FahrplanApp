import type { Graph } from './dijkstra'

import { computeDistanceOfKmI, getDs100ValuesForCrossingsOfBetriebsstellenWithRailwayRoutePositions, findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr, findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForDS100, findStreckennutzungGeschwindigkeitForRailwayRouteNr } from './db-data'
import type { StopWithRailwayRoutePositions, BetriebsstelleRailwayRoutePosition } from './db-data'

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

function computeDistanceOfBs(from: BetriebsstelleRailwayRoutePosition, to: BetriebsstelleRailwayRoutePosition) {
    return computeDistanceOfKmI(from.KM_I, to.KM_I)
}

function addToGraph(g: Graph, bsOfK: BetriebsstelleRailwayRoutePosition, positions: BetriebsstelleRailwayRoutePosition[], twoWay: boolean, speed?: number) {
    if (!speed) speed = 100;
    const kmPerMin = speed / 60;
    const indexes = findPrevAndNext(positions, bsOfK.KM_I);
    if (indexes[0]) {
        const d = computeDistanceOfBs(bsOfK, indexes[0]) / 100;
        const travelTimeInMinutes = parseInt((d / kmPerMin).toFixed(0));
        g[bsOfK.KUERZEL][indexes[0].KUERZEL] = travelTimeInMinutes > 0 ? travelTimeInMinutes : 1;
        if (twoWay) {
            if (!g[indexes[0].KUERZEL]) g[indexes[0].KUERZEL] = {}
            g[indexes[0].KUERZEL][bsOfK.KUERZEL] = travelTimeInMinutes > 0 ? travelTimeInMinutes : 1;
        }
    }
    if (indexes[1]) {
        const d = computeDistanceOfBs(bsOfK, indexes[1]) / 100;
        const travelTimeInMinutes = parseInt((d / kmPerMin).toFixed(0));
        g[bsOfK.KUERZEL][indexes[1].KUERZEL] = travelTimeInMinutes > 0 ? travelTimeInMinutes : 1;
        if (twoWay) {
            if (!g[indexes[1].KUERZEL]) g[indexes[1].KUERZEL] = {}
            g[indexes[1].KUERZEL][bsOfK.KUERZEL] = travelTimeInMinutes > 0 ? travelTimeInMinutes : 1;
        }
    }
}

function createGraph() {
    let g: Graph = {};
    getDs100ValuesForCrossingsOfBetriebsstellenWithRailwayRoutePositions()
        .forEach(k => {
            if (!g[k]) g[k] = {};
            findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForDS100(k).forEach(bs => {
                const speed = findStreckennutzungGeschwindigkeitForRailwayRouteNr(bs.STRECKE_NR);
                const positions = findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(bs.STRECKE_NR);
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

    const positions = findCrossingsOfBetriebsstellenWithRailwayRoutePositionsForRailwayRouteNr(bs.streckenpositionen[0].STRECKE_NR);
    if (positions) {
        g[bs.ds100_ref] = {};
        addToGraph(g, bs.streckenpositionen[0], positions, true);
    } else {
        console.log('error addStopToGraph, strecke ', bs.streckenpositionen[0].STRECKE_NR);
    }
}

export { createGraph, addStopToGraph, addToGraph }