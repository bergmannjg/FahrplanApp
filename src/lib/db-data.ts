/*
haltestellen, enthält Betriebsstelle(DS100) und UIC-Kennung der Haltestelle, Datei D_Bahnhof_2020_alle.csv
source: https://data.deutschebahn.com/dataset/data-haltestellen

betriebsstellen, enthält Betriebsstelle(DS100), Datei DBNetz-Betriebsstellenverzeichnis-Stand2018-04.csv
source: https://data.deutschebahn.com/dataset/data-betriebsstellen

strecken, enthält Streckennummer und Streckenname, Datei strecken.csv
source: https://data.deutschebahn.com/dataset/geo-strecke

betriebsstelleMitPositionAnStrecke, Zuordung Betriebsstelle(DS100) zu Streckennummer, Datei betriebsstellen_streckennummer.csv
erweitert um fehlende Betriebsstellen an den Endpunkten der Strecken (findRailwayRouteDS100Endpoint, createMissingTripPositions)
source: https://data.deutschebahn.com/dataset/geo-betriebsstelle
*/
export const haltestellen = require('./db-data/D_Bahnhof_2020_alle.json') as Array<Haltestelle>;
export const betriebsstellen = require('./db-data/DBNetz-Betriebsstellenverzeichnis-Stand2018-04.json') as Array<Betriebsstelle>;
export const strecken = require('./db-data/strecken.json') as Array<Strecke>;
export const betriebsstelleMitPositionAnStrecke = require('./db-data/betriebsstellen_streckennummer.json') as Array<BetriebsstelleMitPositionAnStrecke>;
export const railwayRouteCache = require('./db-data/RailwayRouteCache.json') as Array<RailwayRouteCache>;

export interface Haltestelle {
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
}

export interface Betriebsstelle {
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

export interface Strecke {
    "STRNR": number;
    "KMANF_E": number;
    "KMEND_E": number;
    "KMANF_V": string;
    "KMEND_V": string;
    "STRNAME": string;
    "STRKURZN": string;
}

export interface BetriebsstelleMitPositionAnStrecke {
    "STRECKE_NR": number;
    "RICHTUNG": number;
    "KM_I": number;
    "KM_L": string;
    "BEZEICHNUNG": string;
    "STELLE_ART": string;
    "KUERZEL": string; // DS100
    "GK_R_DGN": number;
    "GK_H_DGN": number;
    "GEOGR_BREITE": number;
    "GEOGR_LAENGE": number;
}

export interface StopWithRailwayRoutePositions {
    ds100_ref: string; // DS100 pattern
    uic_ref: number;
    name: string;
    streckenpositionen: Array<BetriebsstelleMitPositionAnStrecke>;
}

export interface BetriebsstelleWithRailwayRoutePosition {
    ds100_ref: string;
    name: string;
    railwayRoutePosition?: BetriebsstelleMitPositionAnStrecke;
}

export interface RailwayRouteDS100Endpoint {
    strecke: Strecke;
    from?: Betriebsstelle;
    to?: Betriebsstelle;
}

export interface RailwayRouteOfTrip {
    railwayRouteNr?: number;
    from?: BetriebsstelleWithRailwayRoutePosition;
    to?: BetriebsstelleWithRailwayRoutePosition;
}

export interface RailwayRouteCache {
    uicFrom: number;
    uicTo: number;
    railwayRoutes: Array<RailwayRouteOfTrip>;
}

// missing from dataset/geo-betriebsstelle, work in progress
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
    ]`) as Array<BetriebsstelleMitPositionAnStrecke>;

/*
 * examples for ds100 in haltestellen 'EBIL', 'EBIL,EBILP', 'KDN,KDN P', 'EHE P' 
 */
export function matchWithDS100(s: string, ds100: string) {
    if (ds100.indexOf(',') < 0 && ds100.indexOf(' ') < 0) return s === ds100;
    const splitCm = ds100.split(',');
    if (splitCm.length >= 2) {
        if (s === splitCm[0]) return true;
        if (s === splitCm[1].replace(' ', '')) return true;
        if (splitCm.length >= 3 && s === splitCm[2].replace(' ', '')) return true;
    }
    const splitBlk = ds100.split(' ');
    if (splitBlk.length == 2) {
        if (s === splitBlk[0]) return true;
        if (s === splitBlk[0] + splitBlk[1]) return true;
    }
    return false;
}

function getFirstPartOfDS100(ds100: string) {
    const index = ds100.indexOf(',');
    if (index > 0) return ds100.substr(0, index);
    else return ds100;
}

export function findStopWithRailwayRoutePositions(uic_refs: number[]) {
    const hsStrecken: Array<StopWithRailwayRoutePositions> = [];
    for (var n = 0; n < uic_refs.length; n++) {
        const uic_ref = uic_refs[n];
        const hs = haltestellen.filter(h => h.EVA_NR === uic_ref);
        if (hs.length > 0) {
            console.log('uic_ref: ', uic_ref, ', Ds100:', hs[0].DS100)
            const strecken = betriebsstelleMitPositionAnStrecke.filter(b => matchWithDS100(b.KUERZEL, hs[0].DS100));
            if (strecken.length > 0) {
                // strecken.forEach(s => console.log('Ds100: ', s.KUERZEL, ', strecke: ', s.STRECKE_NR));
                hsStrecken.push({ ds100_ref: hs[0].DS100, uic_ref: uic_ref, name: hs[0].NAME, streckenpositionen: strecken });
            } else {
                // console.log('Ds100: ', haltestellen[0].DS100, ', strecken not found')
                hsStrecken.push({ ds100_ref: hs[0].DS100, uic_ref: uic_ref, name: hs[0].NAME, streckenpositionen: [] });
            }
        } else {
            // console.log('Uic: ', uic_ref, ', Ds100 not found')
            hsStrecken.push({ ds100_ref: '', uic_ref: uic_ref, name: '', streckenpositionen: [] });
        }
    }
    return hsStrecken;
}

function removeDuplicates(arr: Array<number>) {
    const temp: Array<number> = [];
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] != arr[i + 1]) { temp.push(arr[i]); }
    }
    return temp;
}

function findCommonRailwayRoutes(arrA: Array<BetriebsstelleMitPositionAnStrecke>, arrB: Array<BetriebsstelleMitPositionAnStrecke>) {
    return arrA.filter(a => arrB.filter(b => a.STRECKE_NR === b.STRECKE_NR).length > 0).map(a => a.STRECKE_NR)
}

interface SingleCrossing {
    streckennummerA: number;
    streckennummerB: number;
    ds100_crossing_point: string;
    bsPosOfA: BetriebsstelleMitPositionAnStrecke;
    bsPosOfB: BetriebsstelleMitPositionAnStrecke;
}

export function findRailwayRoutesWithSingleCrossing(arrA: Array<BetriebsstelleMitPositionAnStrecke>, arrB: Array<BetriebsstelleMitPositionAnStrecke>) {
    const crossings: SingleCrossing[] = [];
    arrA.forEach(a => {
        const hsOfA = betriebsstelleMitPositionAnStrecke.filter(bs => bs.STRECKE_NR == a.STRECKE_NR);
        arrB.forEach(b => {
            if (a.STRECKE_NR != b.STRECKE_NR) {
                const hsOfB = betriebsstelleMitPositionAnStrecke.filter(bs => bs.STRECKE_NR == b.STRECKE_NR);
                const commonBetriebsstellen = hsOfA.filter(x => hsOfB.filter(y => x.KUERZEL === y.KUERZEL).length > 0)
                commonBetriebsstellen.forEach(cOfA => {
                    const hs = haltestellen.find(h => h.DS100 === cOfA.KUERZEL);
                    const cOfB = hsOfB.find(y => cOfA.KUERZEL === y.KUERZEL);
                    if (cOfB) {
                        crossings.push({ streckennummerA: a.STRECKE_NR, streckennummerB: b.STRECKE_NR, ds100_crossing_point: getFirstPartOfDS100(cOfA.KUERZEL), bsPosOfA: cOfA, bsPosOfB: cOfB });
                    }
                });
            }
        })
    })
    return crossings;
}

function findStreckenBetweenBetriebsstellen(ds100A: string, ds100B: string, exlcudes: number[]) {
    const strecken: number[] = [];
    const hsOfA = betriebsstelleMitPositionAnStrecke.filter(bs => bs.KUERZEL == ds100A && exlcudes.indexOf(bs.STRECKE_NR) < 0);
    const hsOfB = betriebsstelleMitPositionAnStrecke.filter(bs => bs.KUERZEL == ds100B && exlcudes.indexOf(bs.STRECKE_NR) < 0);
    hsOfA.forEach(a => {
        const match = hsOfB.find(b => b.STRECKE_NR === a.STRECKE_NR);
        if (match) {
            strecken.push(match.STRECKE_NR);
        }
    })
    return strecken;
}

interface DoubleCrossing {
    streckennummerA: number;
    streckennummerB: number;
    streckennummerAB: number;
    ds100_crossing_point_A: string;
    ds100_crossing_point_B: string;
    bsPosOfA: BetriebsstelleMitPositionAnStrecke;
    bsPosOfB: BetriebsstelleMitPositionAnStrecke;
}

function findRailwayRoutesWithDoubleCrossing(ds100A: string, arrA: Array<BetriebsstelleMitPositionAnStrecke>, ds100B: string, arrB: Array<BetriebsstelleMitPositionAnStrecke>) {
    const crossings: DoubleCrossing[] = [];
    arrA.forEach(a => {
        const hsOfA = betriebsstelleMitPositionAnStrecke.filter(bs => bs.STRECKE_NR == a.STRECKE_NR && bs.KUERZEL !== ds100A);
        arrB.forEach(b => {
            if (a.STRECKE_NR != b.STRECKE_NR) {
                const hsOfB = betriebsstelleMitPositionAnStrecke.filter(bs => bs.STRECKE_NR == b.STRECKE_NR && bs.KUERZEL !== ds100B);

                hsOfA.forEach(x => {
                    hsOfB.forEach(y => {
                        if (x.KUERZEL !== y.KUERZEL) {
                            const strecken = findStreckenBetweenBetriebsstellen(x.KUERZEL, y.KUERZEL, [a.STRECKE_NR, b.STRECKE_NR]);
                            if (strecken.length > 0) {
                                const cOfA = hsOfA.find(z => z.KUERZEL === x.KUERZEL);
                                const cOfB = hsOfB.find(z => z.KUERZEL === y.KUERZEL);
                                if (cOfA && cOfB) {
                                    crossings.push({
                                        streckennummerA: a.STRECKE_NR,
                                        streckennummerAB: strecken[0],
                                        streckennummerB: b.STRECKE_NR,
                                        ds100_crossing_point_A: getFirstPartOfDS100(x.KUERZEL),
                                        ds100_crossing_point_B: getFirstPartOfDS100(y.KUERZEL),
                                        bsPosOfA: cOfA,
                                        bsPosOfB: cOfB
                                    });
                                }
                            }
                        }
                    });
                });
            }
        })
    })
    return crossings;
}

function buildStopWithRailwayRoutePosition(streckennummer: number, hs_pos: StopWithRailwayRoutePositions): BetriebsstelleWithRailwayRoutePosition {
    const positionen = hs_pos.streckenpositionen.filter(s => s.STRECKE_NR === streckennummer);
    return {
        ds100_ref: getFirstPartOfDS100(hs_pos.ds100_ref), name: hs_pos.name,
        railwayRoutePosition: positionen.length > 0 ? positionen[0] : undefined
    }
}

export function findRailwayRouteText(railwayRouteNr: number) {
    const routes = strecken.filter(s => s.STRNR === railwayRouteNr);
    return routes.length > 0 ? routes[0].STRKURZN : '';
}

function computeDistanceOfBetriebsstellen(strecke: number, ds100A: string, ds100B: string, distanceOfUndef?: number) {
    const nodeA = betriebsstelleMitPositionAnStrecke.find(s => s.STRECKE_NR == strecke && s.KUERZEL === ds100A);
    const nodeB = betriebsstelleMitPositionAnStrecke.find(s => s.STRECKE_NR == strecke && s.KUERZEL === ds100B);
    if (nodeA && nodeB) {
        const kmA = (nodeA.KM_I - 100000000) / 100000;
        const kmB = (nodeB.KM_I - 100000000) / 100000;
        return kmA > kmB ? kmA - kmB : kmB - kmA;
    } else {
        return distanceOfUndef ?? 0;
    }
}

function computeDistanceOfSingleCrossing(c: SingleCrossing, ds100_ref_von: string, ds100_ref_bis: string) {
    return computeDistanceOfBetriebsstellen(c.streckennummerA, ds100_ref_von, c.ds100_crossing_point, 10000)
        + computeDistanceOfBetriebsstellen(c.streckennummerB, c.ds100_crossing_point, ds100_ref_bis, 10000)
}


function computeDistanceOfDoubleCrossing(c: DoubleCrossing, ds100_ref_von: string, ds100_ref_bis: string) {
    return computeDistanceOfBetriebsstellen(c.streckennummerA, ds100_ref_von, c.ds100_crossing_point_A, 10000)
        + computeDistanceOfBetriebsstellen(c.streckennummerAB, c.ds100_crossing_point_A, c.ds100_crossing_point_B, 10000)
        + computeDistanceOfBetriebsstellen(c.streckennummerB, c.ds100_crossing_point_B, ds100_ref_bis, 10000)
}

export function computeDistance(routes: Array<RailwayRouteOfTrip>) {
    let distance = 0;
    routes.forEach(r => {
        if (r.railwayRouteNr && r.from && r.to) {
            distance += computeDistanceOfBetriebsstellen(r.railwayRouteNr, r.from?.ds100_ref, r.to?.ds100_ref)
        }
    })

    return distance;
}

interface State {
    railwayRoutes: Array<RailwayRouteOfTrip>;
    actualRailwayRoute: RailwayRouteOfTrip | undefined;
    success: boolean;
}

function findRailwayRoutesFromCache(state: State, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions): State {
    const cache = railwayRouteCache.find(c => hs_pos_von.uic_ref === c.uicFrom && hs_pos_bis.uic_ref === c.uicTo);
    if (cache) {
        state.success = true;
        console.log('found cache: ', hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref)
        if (state.actualRailwayRoute) {
            if (state.actualRailwayRoute.railwayRouteNr === cache.railwayRoutes[0].railwayRouteNr) {
                cache.railwayRoutes[0].from = state.actualRailwayRoute.from;
            } else {
                if (state.actualRailwayRoute.to === undefined && state.actualRailwayRoute.railwayRouteNr) {
                    state.actualRailwayRoute.to = buildStopWithRailwayRoutePosition(state.actualRailwayRoute.railwayRouteNr, hs_pos_von);
                }
                state.railwayRoutes.push(state.actualRailwayRoute);
            }
        }

        if (cache.railwayRoutes.length > 1) {
            state.railwayRoutes = state.railwayRoutes.concat(cache.railwayRoutes.slice(0, cache.railwayRoutes.length - 1));
        }
        state.actualRailwayRoute = cache.railwayRoutes[cache.railwayRoutes.length - 1];
    }
    return state;
}

function findRailwayRoutesFromIntersections(state: State, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions): State {
    const intersections = findCommonRailwayRoutes(hs_pos_von.streckenpositionen, hs_pos_bis.streckenpositionen);
    if (intersections.length > 0) {
        state.success = true;
        console.log('found intersection: ', hs_pos_von.ds100_ref, intersections[0], hs_pos_bis.ds100_ref)
        if (state.actualRailwayRoute === undefined) {
            state.actualRailwayRoute = {
                railwayRouteNr: intersections[0],
                from: buildStopWithRailwayRoutePosition(intersections[0], hs_pos_von),
                to: buildStopWithRailwayRoutePosition(intersections[0], hs_pos_bis)
            }
        } else {
            if (state.actualRailwayRoute.railwayRouteNr === intersections[0]) {
                state.actualRailwayRoute.to = buildStopWithRailwayRoutePosition(intersections[0], hs_pos_bis);
            } else {
                if (state.actualRailwayRoute.to === undefined && state.actualRailwayRoute.railwayRouteNr) {
                    state.actualRailwayRoute.to = buildStopWithRailwayRoutePosition(state.actualRailwayRoute.railwayRouteNr, hs_pos_von);
                }
                state.railwayRoutes.push(state.actualRailwayRoute);
                state.actualRailwayRoute = {
                    railwayRouteNr: intersections[0],
                    from: buildStopWithRailwayRoutePosition(intersections[0], hs_pos_von),
                    to: buildStopWithRailwayRoutePosition(intersections[0], hs_pos_bis)
                };
            }
        }
    }

    return state;
}

function addSingleCrossingToRoute(state: State, c: SingleCrossing, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions): State {
    if (state.actualRailwayRoute === undefined) {
        state.actualRailwayRoute = {
            railwayRouteNr: c.streckennummerA,
            from: buildStopWithRailwayRoutePosition(c.streckennummerA, hs_pos_von),
            to: { ds100_ref: getFirstPartOfDS100(c.bsPosOfA.KUERZEL), name: c.bsPosOfA.BEZEICHNUNG, railwayRoutePosition: c.bsPosOfA }
        }
    } else {
        if (state.actualRailwayRoute.railwayRouteNr === c.streckennummerA) {
            state.actualRailwayRoute.to = { ds100_ref: getFirstPartOfDS100(c.bsPosOfA.KUERZEL), name: c.bsPosOfA.BEZEICHNUNG, railwayRoutePosition: c.bsPosOfA }
        } else {
            if (state.actualRailwayRoute.to === undefined && state.actualRailwayRoute.railwayRouteNr) {
                state.actualRailwayRoute.to = buildStopWithRailwayRoutePosition(state.actualRailwayRoute.railwayRouteNr, hs_pos_von);
            }
            state.railwayRoutes.push(state.actualRailwayRoute);
            state.actualRailwayRoute = {
                railwayRouteNr: c.streckennummerA,
                from: buildStopWithRailwayRoutePosition(c.streckennummerA, hs_pos_von),
                to: { ds100_ref: getFirstPartOfDS100(c.bsPosOfA.KUERZEL), name: c.bsPosOfA.BEZEICHNUNG, railwayRoutePosition: c.bsPosOfA }
            };
        }
    }
    state.railwayRoutes.push(state.actualRailwayRoute);
    state.actualRailwayRoute = {
        railwayRouteNr: c.streckennummerB,
        from: { ds100_ref: getFirstPartOfDS100(c.bsPosOfB.KUERZEL), name: c.bsPosOfB.BEZEICHNUNG, railwayRoutePosition: c.bsPosOfB },
        to: buildStopWithRailwayRoutePosition(c.streckennummerB, hs_pos_bis),
    }
    return state;
}

function addDoubleCrossingToRoute(state: State, c: DoubleCrossing, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions): State {
    if (state.actualRailwayRoute === undefined) {
        state.actualRailwayRoute = {
            railwayRouteNr: c.streckennummerA,
            from: buildStopWithRailwayRoutePosition(c.streckennummerA, hs_pos_von),
            to: { ds100_ref: getFirstPartOfDS100(c.bsPosOfA.KUERZEL), name: c.bsPosOfA.BEZEICHNUNG, railwayRoutePosition: c.bsPosOfA }
        }
    } else {
        if (state.actualRailwayRoute.railwayRouteNr === c.streckennummerA) {
            state.actualRailwayRoute.to = { ds100_ref: getFirstPartOfDS100(c.bsPosOfA.KUERZEL), name: c.bsPosOfA.BEZEICHNUNG, railwayRoutePosition: c.bsPosOfA }
        } else {
            if (state.actualRailwayRoute.to === undefined && state.actualRailwayRoute.railwayRouteNr) {
                state.actualRailwayRoute.to = buildStopWithRailwayRoutePosition(state.actualRailwayRoute.railwayRouteNr, hs_pos_von);
            }
            state.railwayRoutes.push(state.actualRailwayRoute);
            state.actualRailwayRoute = {
                railwayRouteNr: c.streckennummerA,
                from: buildStopWithRailwayRoutePosition(c.streckennummerA, hs_pos_von),
                to: { ds100_ref: getFirstPartOfDS100(c.bsPosOfA.KUERZEL), name: c.bsPosOfA.BEZEICHNUNG, railwayRoutePosition: c.bsPosOfA }
            };
        }

    }
    state.railwayRoutes.push(state.actualRailwayRoute);
    state.actualRailwayRoute = {
        railwayRouteNr: c.streckennummerAB,
        from: { ds100_ref: getFirstPartOfDS100(c.bsPosOfA.KUERZEL), name: c.bsPosOfA.BEZEICHNUNG, railwayRoutePosition: c.bsPosOfA },
        to: { ds100_ref: getFirstPartOfDS100(c.bsPosOfB.KUERZEL), name: c.bsPosOfB.BEZEICHNUNG, railwayRoutePosition: c.bsPosOfB }
    }
    state.railwayRoutes.push(state.actualRailwayRoute);
    state.actualRailwayRoute = {
        railwayRouteNr: c.streckennummerB,
        from: { ds100_ref: getFirstPartOfDS100(c.bsPosOfB.KUERZEL), name: c.bsPosOfB.BEZEICHNUNG, railwayRoutePosition: c.bsPosOfB },
        to: buildStopWithRailwayRoutePosition(c.streckennummerB, hs_pos_bis),
    }
    return state;
}

function findRailwayRoutesFromCrossings(state: State, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions): State {
    const verbose = false;

    const singleCrossings = findRailwayRoutesWithSingleCrossing(hs_pos_von.streckenpositionen, hs_pos_bis.streckenpositionen)
        .sort((a, b) =>
            computeDistanceOfSingleCrossing(a, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref) - computeDistanceOfSingleCrossing(b, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref)
        );
    console.log('singleCrossings: ', hs_pos_von.ds100_ref, '-', hs_pos_bis.ds100_ref, ', length: ', singleCrossings.length);
    if (verbose) {
        singleCrossings.forEach(c => {
            if (c.bsPosOfA.KUERZEL != c.bsPosOfB.KUERZEL) {
                console.error('expected equal: ', c.bsPosOfA.KUERZEL, ', ', c.bsPosOfB.KUERZEL);
            }
            const distA = computeDistanceOfBetriebsstellen(c.streckennummerA, hs_pos_von.ds100_ref, c.ds100_crossing_point).toFixed(1);
            const distB = computeDistanceOfBetriebsstellen(c.streckennummerB, c.ds100_crossing_point, hs_pos_bis.ds100_ref).toFixed(1);
            console.log('von ', hs_pos_von.name, ', Strecke ', c.streckennummerA, 'km ', distA, ', über ', c.bsPosOfA.BEZEICHNUNG, ', Strecke ', c.streckennummerB, 'km ', distB, ', nach ', hs_pos_bis.name)
        })
    }

    const doubleCrossings = findRailwayRoutesWithDoubleCrossing(hs_pos_von.ds100_ref, hs_pos_von.streckenpositionen, hs_pos_bis.ds100_ref, hs_pos_bis.streckenpositionen)
        .sort((a, b) => computeDistanceOfDoubleCrossing(a, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref)
            - computeDistanceOfDoubleCrossing(b, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref));
    console.log('doubleCrossings: ', hs_pos_von.ds100_ref, '-', hs_pos_bis.ds100_ref, ', length: ', doubleCrossings.length);
    if (verbose) {
        doubleCrossings.forEach(c => {
            console.log(hs_pos_von.ds100_ref, '-', c.streckennummerA, '-', c.ds100_crossing_point_A, '-', c.streckennummerAB, '-', c.ds100_crossing_point_B, '-', c.streckennummerB, '-', hs_pos_bis.ds100_ref, ',km:',
                computeDistanceOfDoubleCrossing(c, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref));
        })
    }

    if (singleCrossings.length > 0 && doubleCrossings.length > 0) {
        state.success = true;
        const distSingle = computeDistanceOfSingleCrossing(singleCrossings[0], hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref);
        const distDouble = computeDistanceOfDoubleCrossing(doubleCrossings[0], hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref);
        if (distSingle <= distDouble) {
            console.log('found singleCrossing: ', hs_pos_von.ds100_ref, singleCrossings[0].streckennummerA, singleCrossings[0].ds100_crossing_point, singleCrossings[0].streckennummerB, hs_pos_bis.ds100_ref)
            state = addSingleCrossingToRoute(state, singleCrossings[0], hs_pos_von, hs_pos_bis);
        } else {
            console.log('found doubleCrossing: ', hs_pos_von.ds100_ref, doubleCrossings[0].streckennummerA, doubleCrossings[0].streckennummerAB, doubleCrossings[0].streckennummerB, hs_pos_bis.ds100_ref)
            state = addDoubleCrossingToRoute(state, doubleCrossings[0], hs_pos_von, hs_pos_bis);
        }
    }
    else if (singleCrossings.length > 0) {
        state.success = true;
        console.log('found singleCrossing: ', hs_pos_von.ds100_ref, singleCrossings[0].streckennummerA, singleCrossings[0].ds100_crossing_point, singleCrossings[0].streckennummerB, hs_pos_bis.ds100_ref)
        state = addSingleCrossingToRoute(state, singleCrossings[0], hs_pos_von, hs_pos_bis);
    }
    else if (doubleCrossings.length > 0) {
        state.success = true;
        console.log('found doubleCrossing: ', hs_pos_von.ds100_ref, doubleCrossings[0].streckennummerA, doubleCrossings[0].streckennummerAB, doubleCrossings[0].streckennummerB, hs_pos_bis.ds100_ref)
        state = addDoubleCrossingToRoute(state, doubleCrossings[0], hs_pos_von, hs_pos_bis);
    }

    return state;
}

function buildUndefRailwayRoute(state: State, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions) {
    if (state.actualRailwayRoute === undefined) {
        state.actualRailwayRoute = { // empty entry
            railwayRouteNr: undefined,
            from: { ds100_ref: getFirstPartOfDS100(hs_pos_von.ds100_ref), name: hs_pos_von.name, railwayRoutePosition: undefined },
            to: { ds100_ref: getFirstPartOfDS100(hs_pos_von.ds100_ref), name: hs_pos_von.name, railwayRoutePosition: undefined }
        }
    }
    state.railwayRoutes.push(state.actualRailwayRoute);
    if (hs_pos_bis.streckenpositionen.length > 0) {
        // adhoc: keine gemeinsame strecke 'von' nach 'bis' gefunden, also 'bis' streckennummer nehmen
        state.actualRailwayRoute = {
            railwayRouteNr: hs_pos_bis.streckenpositionen[0].STRECKE_NR,
            from: buildStopWithRailwayRoutePosition(hs_pos_bis.streckenpositionen[0].STRECKE_NR, hs_pos_von),
            to: buildStopWithRailwayRoutePosition(hs_pos_bis.streckenpositionen[0].STRECKE_NR, hs_pos_bis)
        };
    } else {
        state.actualRailwayRoute = undefined;
    }
}

export function findRailwayRoutesOfTrip(uic_refs: number[], useCache: boolean) {
    const hs_pos_list = findStopWithRailwayRoutePositions(removeDuplicates(uic_refs));
    let state: State = { railwayRoutes: [], actualRailwayRoute: undefined, success: false }
    for (var n = 0; n < hs_pos_list.length - 1; n++) {
        const hs_pos_von = hs_pos_list[n];
        const hs_pos_bis = hs_pos_list[n + 1];
        state.success = false;
        if (!state.success && useCache) {
            state = findRailwayRoutesFromCache(state, hs_pos_von, hs_pos_bis);
        }
        if (!state.success) {
            state = findRailwayRoutesFromIntersections(state, hs_pos_von, hs_pos_bis);
        }
        if (!state.success) {
            state = findRailwayRoutesFromCrossings(state, hs_pos_von, hs_pos_bis);
        }
        if (!state.success) {
        }
    }
    if (state.actualRailwayRoute != undefined) {
        if (state.actualRailwayRoute.railwayRouteNr && hs_pos_list.length > 0) {
            const last = buildStopWithRailwayRoutePosition(state.actualRailwayRoute.railwayRouteNr, hs_pos_list[hs_pos_list.length - 1]);
            if (last) {
                state.actualRailwayRoute.to = last;
            }
        }
        state.railwayRoutes.push(state.actualRailwayRoute);
    }
    return state.railwayRoutes;
}

function removeRest(name: string, pattern: string) {
    const index = name.indexOf(pattern);
    if (index > 0) return name.substr(0, index);
    else return name;
}

function splitName(name: string) {
    const split = name.split(' - ');
    if (split.length == 2) {
        const from = removeRest(split[0], ', ');
        const to = removeRest(split[1], ', ');
        return [from, to];
    } else {
        return [];
    }
}

export function findBetriebsstelleDS100(name: string) {
    const split = splitName(name);
    if (split.length == 2) {
        const from = betriebsstellen.find(b => b.Name === split[0] || b.Kurzname === split[0]);
        const to = betriebsstellen.find(b => b.Name === split[1] || b.Kurzname === split[1]);
        return [from, to];
    } else {
        return [undefined, undefined];
    }
}

export function findRailwayRouteDS100Endpoint() {
    const rrDS100Endpoints: RailwayRouteDS100Endpoint[] = [];
    strecken.forEach(s => {
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

export function createMissingTripPositions(betriebsstelleMitPosition: Array<BetriebsstelleMitPositionAnStrecke>, rrEndpoints: RailwayRouteDS100Endpoint[]) {
    const rrValid = rrEndpoints.filter(r => r.from && r.to);
    const missing: BetriebsstelleMitPositionAnStrecke[] = [];
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