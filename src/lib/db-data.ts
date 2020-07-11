
export const haltestellen = require('../../db-data/D_Bahnhof_2020_alle.json') as Array<Haltestelle>;
export const betriebsstellen = require('../../db-data/DBNetz-Betriebsstellenverzeichnis-Stand2018-04.json') as Array<Betriebsstelle>;
export const strecken = require('../../db-data/strecken_pz.json') as Array<Strecke>;
export const betriebsstellenMitPositionAnStrecke = require('../../db-data/betriebsstellen_streckennummer_pz.json') as Array<BetriebsstelleMitPositionAnStrecke>;
export const railwayRouteCache = require('../../db-data/RailwayRouteCache.json') as Array<RailwayRouteCache>;

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

export interface Streckenutzung {
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

interface Ds100UndBetriebsstellenMitPositionAnStrecke {
    Ds100: string;
    betriebsstellenMitPositionAnStrecke: Array<BetriebsstelleMitPositionAnStrecke>
}

interface StreckeNrUndBetriebsstellenMitPositionAnStrecke {
    StreckeNr: number;
    betriebsstellenMitPositionAnStrecke: Array<BetriebsstelleMitPositionAnStrecke>
}

const useIndexes = true;

console.log('betriebsstellenMitPositionAnStrecke..length:', betriebsstellenMitPositionAnStrecke.length);

const arrDs100UndBetriebsstellenMitPositionAnStrecke =
    betriebsstellenMitPositionAnStrecke
        .reduce((accu: Array<Ds100UndBetriebsstellenMitPositionAnStrecke>, bs) => {
            const entry = accu.find(s => s.Ds100 === bs.KUERZEL);
            if (entry) entry.betriebsstellenMitPositionAnStrecke.push(bs);
            else accu.push({ Ds100: bs.KUERZEL, betriebsstellenMitPositionAnStrecke: [bs] })
            return accu;
        }, [])
        .filter(ds => ds.betriebsstellenMitPositionAnStrecke.length > 1);

console.log('arrDs100UndBetriebsstellenMitPositionAnStrecke..length:', arrDs100UndBetriebsstellenMitPositionAnStrecke.length);

const arrStreckeNrUndBetriebsstellenMitPositionAnStrecke =
    betriebsstellenMitPositionAnStrecke
        .reduce((accu: Array<StreckeNrUndBetriebsstellenMitPositionAnStrecke>, bs) => {
            const entry = accu.find(s => s.StreckeNr === bs.STRECKE_NR);
            if (entry) entry.betriebsstellenMitPositionAnStrecke.push(bs);
            else accu.push({ StreckeNr: bs.STRECKE_NR, betriebsstellenMitPositionAnStrecke: [bs] })
            return accu;
        }, []);

console.log('arrStreckeNrUndBetriebsstellenMitPositionAnStrecke..length:', arrStreckeNrUndBetriebsstellenMitPositionAnStrecke.length);

function findBetriebsstellenMitPositionAnStreckeForKUERZEL(KUERZEL: string) {
    if (useIndexes) return arrDs100UndBetriebsstellenMitPositionAnStrecke.find(s => s.Ds100 === KUERZEL)?.betriebsstellenMitPositionAnStrecke || [];
    else return betriebsstellenMitPositionAnStrecke.filter(bs => bs.KUERZEL == KUERZEL);
}

function findBetriebsstellenMitPositionAnStreckeForSTRECKE_NR(STRECKE_NR: number) {
    if (useIndexes) return arrStreckeNrUndBetriebsstellenMitPositionAnStrecke.find(s => s.StreckeNr === STRECKE_NR)?.betriebsstellenMitPositionAnStrecke || [];
    else return betriebsstellenMitPositionAnStrecke.filter(bs => bs.STRECKE_NR == STRECKE_NR);
}

/*
 * examples for ds100 in haltestellen 'EBIL', 'EBIL,EBILP', 'KDN,KDN P', 'EHE P' 
 */
export function matchWithDS100(s: string, ds100: string) {
    if (s === ds100) return true;
    if (ds100.indexOf(',') < 0 && ds100.indexOf(' ') < 0) return false;
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
    uic_refs.forEach(uic_ref => {
        const hs = haltestellen.filter(h => h.EVA_NR === uic_ref);
        if (hs.length > 0) {
            console.log('uic_ref:', uic_ref, ', Ds100:', hs[0].DS100, ', name:', hs[0].NAME)
            const strecken = betriebsstellenMitPositionAnStrecke.filter(b => matchWithDS100(b.KUERZEL, hs[0].DS100));
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
    });
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
    return arrA.filter(a => arrB.find(b => a.STRECKE_NR === b.STRECKE_NR)).map(a => a.STRECKE_NR)
}

interface SingleCrossing {
    streckennummerA: number;
    streckennummerB: number;
    ds100_crossing_point: string;
    bsPosOfA: BetriebsstelleMitPositionAnStrecke;
    bsPosOfB: BetriebsstelleMitPositionAnStrecke;
}

export function findRailwayRoutesWithSingleCrossing(arrStreckenA: Array<BetriebsstelleMitPositionAnStrecke>, arrStreckenB: Array<BetriebsstelleMitPositionAnStrecke>) {
    const crossings: SingleCrossing[] = [];
    arrStreckenA.forEach(a => {
        const arrBsOfStreckeA = findBetriebsstellenMitPositionAnStreckeForSTRECKE_NR(a.STRECKE_NR);
        arrStreckenB.forEach(b => {
            if (a.STRECKE_NR != b.STRECKE_NR) {
                const arrBsOfStreckeB = findBetriebsstellenMitPositionAnStreckeForSTRECKE_NR(b.STRECKE_NR);
                const commonBetriebsstellen = arrBsOfStreckeA.filter(bsOfStreckeA => arrBsOfStreckeB.find(bsOfStreckeB => bsOfStreckeA.KUERZEL === bsOfStreckeB.KUERZEL));
                commonBetriebsstellen.forEach(bsOfStreckeA => {
                    const bsOfStreckeB = arrBsOfStreckeB.find(bs => bsOfStreckeA.KUERZEL === bs.KUERZEL);
                    if (bsOfStreckeB) {
                        crossings.push({ streckennummerA: a.STRECKE_NR, streckennummerB: b.STRECKE_NR, ds100_crossing_point: getFirstPartOfDS100(bsOfStreckeA.KUERZEL), bsPosOfA: bsOfStreckeA, bsPosOfB: bsOfStreckeB });
                    }
                });
            }
        })
    })
    return crossings;
}

function findStreckenBetweenBetriebsstellen(ds100A: string, ds100B: string, exlcudes: number[]) {
    const strecken: number[] = [];
    const hsOfA = findBetriebsstellenMitPositionAnStreckeForKUERZEL(ds100A).filter(bs => exlcudes.indexOf(bs.STRECKE_NR) < 0);
    const hsOfB = findBetriebsstellenMitPositionAnStreckeForKUERZEL(ds100B).filter(bs => exlcudes.indexOf(bs.STRECKE_NR) < 0);
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

function findRailwayRoutesWithDoubleCrossing(ds100A: string, arrStreckenA: Array<BetriebsstelleMitPositionAnStrecke>, ds100B: string, arrStreckenB: Array<BetriebsstelleMitPositionAnStrecke>) {
    const crossings: DoubleCrossing[] = [];
    arrStreckenA.forEach(a => {
        const arrBsOfStreckeA = findBetriebsstellenMitPositionAnStreckeForSTRECKE_NR(a.STRECKE_NR).filter(bs => bs.KUERZEL !== ds100A);
        arrStreckenB.forEach(b => {
            if (a.STRECKE_NR != b.STRECKE_NR) {
                const arrBsOfStreckeB = findBetriebsstellenMitPositionAnStreckeForSTRECKE_NR(b.STRECKE_NR).filter(bs => bs.KUERZEL !== ds100B);
                arrBsOfStreckeA.forEach(bsAnStreckeA => {
                    arrBsOfStreckeB.forEach(bsAnStreckeB => {
                        if (bsAnStreckeA.KUERZEL !== bsAnStreckeB.KUERZEL) {
                            const strecken = findStreckenBetweenBetriebsstellen(bsAnStreckeA.KUERZEL, bsAnStreckeB.KUERZEL, [a.STRECKE_NR, b.STRECKE_NR]);
                            if (strecken.length > 0) {
                                crossings.push({
                                    streckennummerA: a.STRECKE_NR,
                                    streckennummerAB: strecken[0],
                                    streckennummerB: b.STRECKE_NR,
                                    ds100_crossing_point_A: getFirstPartOfDS100(bsAnStreckeA.KUERZEL),
                                    ds100_crossing_point_B: getFirstPartOfDS100(bsAnStreckeB.KUERZEL),
                                    bsPosOfA: bsAnStreckeA,
                                    bsPosOfB: bsAnStreckeB
                                });
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
    const bsAnStrecke = findBetriebsstellenMitPositionAnStreckeForSTRECKE_NR(strecke);
    const nodeA = bsAnStrecke.find(s => s.KUERZEL === ds100A);
    const nodeB = bsAnStrecke.find(s => s.KUERZEL === ds100B);
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

function findRailwayRoutesFromCrossings(state: State, hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions, routeSearchType: 'single' | 'double'): State {
    const verbose = false;
    const singleCrossings = findRailwayRoutesWithSingleCrossing(hs_pos_von.streckenpositionen, hs_pos_bis.streckenpositionen)
        .sort((a, b) =>
            computeDistanceOfSingleCrossing(a, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref) - computeDistanceOfSingleCrossing(b, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref)
        );
    if (verbose) {
        console.log('singleCrossings: ', hs_pos_von.ds100_ref, '-', hs_pos_bis.ds100_ref, ', length: ', singleCrossings.length);
        dumpSingleCrossings(singleCrossings, hs_pos_von, hs_pos_bis);
    }

    const doubleCrossings = routeSearchType == "double"
        ? findRailwayRoutesWithDoubleCrossing(hs_pos_von.ds100_ref, hs_pos_von.streckenpositionen, hs_pos_bis.ds100_ref, hs_pos_bis.streckenpositionen)
            .sort((a, b) => computeDistanceOfDoubleCrossing(a, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref)
                - computeDistanceOfDoubleCrossing(b, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref))
        : [];
    if (verbose) {
        console.log('doubleCrossings: ', hs_pos_von.ds100_ref, '-', hs_pos_bis.ds100_ref, ', length: ', doubleCrossings.length);
        dumpDoubleCrossings(doubleCrossings, hs_pos_von, hs_pos_bis);
    }

    if (singleCrossings.length > 0 && doubleCrossings.length > 0) {
        state.success = true;
        const distSingle = computeDistanceOfSingleCrossing(singleCrossings[0], hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref);
        const distDouble = computeDistanceOfDoubleCrossing(doubleCrossings[0], hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref);
        if (distSingle <= distDouble) {
            console.log('found singleCrossing: ', hs_pos_von.ds100_ref, singleCrossings[0].streckennummerA, singleCrossings[0].ds100_crossing_point, singleCrossings[0].streckennummerB, hs_pos_bis.ds100_ref)
            state = addSingleCrossingToRoute(state, singleCrossings[0], hs_pos_von, hs_pos_bis);
        } else {
            logFounddoubleCrossing(hs_pos_von, doubleCrossings[0], hs_pos_bis);
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
        logFounddoubleCrossing(hs_pos_von, doubleCrossings[0], hs_pos_bis);
        state = addDoubleCrossingToRoute(state, doubleCrossings[0], hs_pos_von, hs_pos_bis);
    }

    return state;
}

function logFounddoubleCrossing(hs_pos_von: StopWithRailwayRoutePositions, dc: DoubleCrossing, hs_pos_bis: StopWithRailwayRoutePositions) {
    console.log('found doubleCrossing: ', hs_pos_von.ds100_ref, dc.streckennummerA, dc.ds100_crossing_point_A, dc.streckennummerAB, dc.ds100_crossing_point_B, dc.streckennummerB, hs_pos_bis.ds100_ref);
    console.log('add this line to cache script: [', hs_pos_von.uic_ref, ',', hs_pos_bis.uic_ref, '], //', hs_pos_von.name, hs_pos_bis.name);
}

function dumpDoubleCrossings(doubleCrossings: DoubleCrossing[], hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions) {
    doubleCrossings.forEach(c => {
        console.log(hs_pos_von.ds100_ref, '-', c.streckennummerA, '-', c.ds100_crossing_point_A, '-', c.streckennummerAB, '-', c.ds100_crossing_point_B, '-', c.streckennummerB, '-', hs_pos_bis.ds100_ref, ',km:',
            computeDistanceOfDoubleCrossing(c, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref));
    });
}

function dumpSingleCrossings(singleCrossings: SingleCrossing[], hs_pos_von: StopWithRailwayRoutePositions, hs_pos_bis: StopWithRailwayRoutePositions) {
    singleCrossings.forEach(c => {
        if (c.bsPosOfA.KUERZEL != c.bsPosOfB.KUERZEL) {
            console.error('expected equal: ', c.bsPosOfA.KUERZEL, ', ', c.bsPosOfB.KUERZEL);
        }
        const distA = computeDistanceOfBetriebsstellen(c.streckennummerA, hs_pos_von.ds100_ref, c.ds100_crossing_point).toFixed(1);
        const distB = computeDistanceOfBetriebsstellen(c.streckennummerB, c.ds100_crossing_point, hs_pos_bis.ds100_ref).toFixed(1);
        console.log('von ', hs_pos_von.name, ', Strecke ', c.streckennummerA, 'km ', distA, ', über ', c.bsPosOfA.BEZEICHNUNG, ', Strecke ', c.streckennummerB, 'km ', distB, ', nach ', hs_pos_bis.name);
    });
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

function findBetriebsstelleDS100(name: string) {
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

/**
 * find railway route numbers for the station codes of a trip, 
 * the solution is not unique and there may be others with smaller distances.
 * 
 * Depth-first search in the set of relations Betriebsstelle-RailwayRoute with the following steps:
 * 1) lookup cache (findRailwayRoutesFromCache)
 * 2) check if the stations have a common railway route (findRailwayRoutesFromIntersections)
 * 3) check if the railway routes of the stations have a common 'Betriebsstelle' (singleCrossing)
 *    or a common railway route (doubleCrossing) and pick the crossing with the smallest distance
 * 
 * @param uic_refs UIC station codes of trip
 * @param useCache use railwayRoute cache
 * @param routeSearchType search single or double crossings
 */
export function findRailwayRoutesOfTrip(uic_refs: number[], useCache: boolean, routeSearchType?: 'single' | 'double') {
    if (!routeSearchType) {
        routeSearchType = 'double';
    }
    const hs_pos_list = findStopWithRailwayRoutePositions(removeDuplicates(uic_refs));
    let state: State = { railwayRoutes: [], actualRailwayRoute: undefined, success: false }
    for (var n = 0; n < hs_pos_list.length - 1; n++) {
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
            state = findRailwayRoutesFromCrossings(state, hs_pos_from, hs_pos_to, routeSearchType);
        }
        if (!state.success) {
            console.log('found nothing: ', hs_pos_from.ds100_ref, hs_pos_to.ds100_ref)
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
