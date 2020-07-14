import { Lazy } from './Lazy'

const haltestellen = new Lazy<Stop[]>(() => require('../../db-data/D_Bahnhof_2020_alle.json') as Array<Stop>)
const betriebsstellen = new Lazy<Betriebsstelle[]>(() => require('../../db-data/DBNetz-Betriebsstellenverzeichnis-Stand2018-04.json') as Array<Betriebsstelle>)
const railwayRoutes = new Lazy<RailwayRoute[]>(() => require('../../db-data/strecken_pz.json') as Array<RailwayRoute>)
const betriebsstellenWithRailwayRoutePositions = new Lazy<BetriebsstelleRailwayRoutePosition[]>(() => require('../../db-data/betriebsstellen_streckennummer_pz.json') as Array<BetriebsstelleRailwayRoutePosition>)
const railwayRouteCache = new Lazy<RailwayRouteCache[]>(() => require('../../db-data/RailwayRouteCache.json') as Array<RailwayRouteCache>)

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
    "GEOGR_BREITE": number;
    "GEOGR_LAENGE": number;
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

interface Ds100AndBetriebsstellenWithRailwayRoutePosition {
    Ds100: string;
    betriebsstellenWithRailwayRoutePosition: Array<BetriebsstelleRailwayRoutePosition>
}

interface RailwayRouteNrAndBetriebsstellenWithRailwayRoutePosition {
    StreckeNr: number;
    betriebsstellenWithRailwayRoutePosition: Array<BetriebsstelleRailwayRoutePosition>
}

const arrDs100UndBetriebsstellenMitPositionAnStrecke = new Lazy<Ds100AndBetriebsstellenWithRailwayRoutePosition[]>(() =>
    betriebsstellenWithRailwayRoutePositions.value
        .reduce((accu: Array<Ds100AndBetriebsstellenWithRailwayRoutePosition>, bs) => {
            const entry = accu.find(s => s.Ds100 === bs.KUERZEL);
            if (entry) entry.betriebsstellenWithRailwayRoutePosition.push(bs);
            else accu.push({ Ds100: bs.KUERZEL, betriebsstellenWithRailwayRoutePosition: [bs] })
            return accu;
        }, [])
        .filter(ds => ds.betriebsstellenWithRailwayRoutePosition.length > 1))

const arrStreckeNrUndBetriebsstellenMitPositionAnStrecke = new Lazy<RailwayRouteNrAndBetriebsstellenWithRailwayRoutePosition[]>(() =>
    betriebsstellenWithRailwayRoutePositions.value
        .reduce((accu: Array<RailwayRouteNrAndBetriebsstellenWithRailwayRoutePosition>, bs) => {
            const entry = accu.find(s => s.StreckeNr === bs.STRECKE_NR);
            if (entry) entry.betriebsstellenWithRailwayRoutePosition.push(bs);
            else accu.push({ StreckeNr: bs.STRECKE_NR, betriebsstellenWithRailwayRoutePosition: [bs] })
            return accu;
        }, []));

function findBetriebsstellenMitPositionAnStreckeForDS100(KUERZEL: string) {
    return arrDs100UndBetriebsstellenMitPositionAnStrecke.value.find(s => s.Ds100 === KUERZEL)?.betriebsstellenWithRailwayRoutePosition || [];
}

function findBetriebsstellenMitPositionAnStreckeForRailwayRouteNr(STRECKE_NR: number) {
    return arrStreckeNrUndBetriebsstellenMitPositionAnStrecke.value.find(s => s.StreckeNr === STRECKE_NR)?.betriebsstellenWithRailwayRoutePosition || [];
}

function findRailwayRoutePositionForRailwayRoutes(routes: RailwayRouteOfTrip[], allPoints: boolean): RailwayRoutePosition[] {
    let positions: RailwayRoutePosition[] = []
    routes.forEach(r => {
        if (r.railwayRouteNr) {

            const arrBs = findBetriebsstellenMitPositionAnStreckeForRailwayRouteNr(r.railwayRouteNr)
                .filter(bs => allPoints || (bs.KUERZEL === r.from?.ds100_ref || bs.KUERZEL === r.to?.ds100_ref || bs.STELLE_ART.startsWith('Bf')));

            const from = arrBs.findIndex(s => s.KUERZEL === r.from?.ds100_ref)
            console.log('findIndex:', from, r.from?.ds100_ref)
            const to = arrBs.findIndex(s => s.KUERZEL === r.to?.ds100_ref)
            console.log('findIndex:', to, r.to?.ds100_ref)
            if (from != -1 && from < to) {
                const slice = arrBs.slice(from, to + 1);
                positions = positions.concat(slice.map(s => { return { GEOGR_BREITE: s.GEOGR_BREITE, GEOGR_LAENGE: s.GEOGR_LAENGE } }))
            } else if (to != -1 && to < from) {
                const slice = arrBs.slice(to, from + 1).reverse();
                positions = positions.concat(slice.map(s => { return { GEOGR_BREITE: s.GEOGR_BREITE, GEOGR_LAENGE: s.GEOGR_LAENGE } }))
            }
        }
    })
    return positions;
}

function findRailwayRoute(strecke: number) {
    return railwayRoutes.value.find(s => s.STRNR === strecke);
}

/*
 * examples for ds100 in haltestellen 'EBIL', 'EBIL,EBILP', 'KDN,KDN P', 'EHE P'
 */
function matchWithDS100(s: string, ds100: string) {
    if (s === ds100) return true;
    if (ds100.indexOf(',') < 0 && ds100.indexOf(' ') < 0) return false;
    const splitCm = ds100.split(',');
    if (splitCm.length >= 2) {
        if (s === splitCm[0]) return true;
        if (s === splitCm[1].replace(' ', '')) return true;
        if (splitCm.length >= 3 && s === splitCm[2].replace(' ', '')) return true;
    }
    const splitBlk = ds100.split(' ');
    if (splitBlk.length === 2) {
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

function findStopWithRailwayRoutePositions(uicrefs: number[]) {
    const hsStrecken: Array<StopWithRailwayRoutePositions> = [];
    uicrefs.forEach(uicref => {
        const hs = haltestellen.value.find(h => h.EVA_NR === uicref);
        if (hs) {
            console.log('uic_ref:', uicref, ', Ds100:', hs.DS100, ', name:', hs.NAME)
            const strecken = betriebsstellenWithRailwayRoutePositions.value.filter(b => matchWithDS100(b.KUERZEL, hs.DS100));
            if (strecken.length > 0) {
                // strecken.forEach(s => console.log('Ds100: ', s.KUERZEL, ', strecke: ', s.STRECKE_NR));
                hsStrecken.push({ ds100_ref: hs.DS100, uic_ref: uicref, name: hs.NAME, streckenpositionen: strecken });
            } else {
                // console.log('Ds100: ', haltestellen[0].DS100, ', strecken not found')
                hsStrecken.push({ ds100_ref: hs.DS100, uic_ref: uicref, name: hs.NAME, streckenpositionen: [] });
            }
        } else {
            // console.log('Uic: ', uic_ref, ', Ds100 not found')
            hsStrecken.push({ ds100_ref: '', uic_ref: uicref, name: '', streckenpositionen: [] });
        }
    });
    return hsStrecken;
}

function removeDuplicates(arr: Array<number>) {
    const temp: Array<number> = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== arr[i + 1]) { temp.push(arr[i]); }
    }
    return temp;
}

interface SingleCrossing {
    streckennummerA: number;
    streckennummerB: number;
    ds100_crossing_point: string;
    bsPosOfA: BetriebsstelleRailwayRoutePosition;
    bsPosOfB: BetriebsstelleRailwayRoutePosition;
}

function findRailwayRoutesWithSingleCrossing(arrStreckenA: Array<BetriebsstelleRailwayRoutePosition>, arrStreckenB: Array<BetriebsstelleRailwayRoutePosition>) {
    const crossings: SingleCrossing[] = [];
    arrStreckenA.forEach(a => {
        const arrBsOfStreckeA = findBetriebsstellenMitPositionAnStreckeForRailwayRouteNr(a.STRECKE_NR);
        arrStreckenB.forEach(b => {
            if (a.STRECKE_NR !== b.STRECKE_NR) {
                const arrBsOfStreckeB = findBetriebsstellenMitPositionAnStreckeForRailwayRouteNr(b.STRECKE_NR);
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

interface DoubleCrossing {
    streckennummerA: number;
    streckennummerB: number;
    streckennummerAB: number;
    ds100_crossing_point_A: string;
    ds100_crossing_point_B: string;
    bsPosOfA: BetriebsstelleRailwayRoutePosition;
    bsPosOfB: BetriebsstelleRailwayRoutePosition;
}

function findRailwayRoutesWithDoubleCrossing(ds100A: string, arrStreckenA: Array<BetriebsstelleRailwayRoutePosition>, ds100B: string, arrStreckenB: Array<BetriebsstelleRailwayRoutePosition>) {
    const crossings: DoubleCrossing[] = [];
    arrStreckenA.forEach(a => {
        const arrBsOfStreckeA = findBetriebsstellenMitPositionAnStreckeForRailwayRouteNr(a.STRECKE_NR).filter(bs => bs.KUERZEL !== ds100A);
        arrStreckenB.forEach(b => {
            if (a.STRECKE_NR !== b.STRECKE_NR) {
                const excludes = [a.STRECKE_NR, b.STRECKE_NR];
                const arrBsOfStreckeB = findBetriebsstellenMitPositionAnStreckeForRailwayRouteNr(b.STRECKE_NR).filter(bs => bs.KUERZEL !== ds100B);
                arrBsOfStreckeA.forEach(bsAnStreckeA => {
                    const arrBsOfAKuerzel = findBetriebsstellenMitPositionAnStreckeForDS100(bsAnStreckeA.KUERZEL).filter(bs => excludes.indexOf(bs.STRECKE_NR) < 0);
                    arrBsOfStreckeB.forEach(bsAnStreckeB => {
                        if (bsAnStreckeA.KUERZEL !== bsAnStreckeB.KUERZEL) {
                            const arrBsOfBKuerzel = findBetriebsstellenMitPositionAnStreckeForDS100(bsAnStreckeB.KUERZEL).filter(bs => excludes.indexOf(bs.STRECKE_NR) < 0);
                            const streckeFromAtoB = arrBsOfAKuerzel.find(bsOfA => arrBsOfBKuerzel.find(bsOfB => bsOfB.STRECKE_NR === bsOfA.STRECKE_NR));
                            if (streckeFromAtoB) {
                                crossings.push({
                                    streckennummerA: a.STRECKE_NR,
                                    streckennummerAB: streckeFromAtoB?.STRECKE_NR,
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
    const bsAnStrecke = findBetriebsstellenMitPositionAnStreckeForRailwayRouteNr(strecke);
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

function computeDistanceOfSingleCrossing(c: SingleCrossing, ds100refvon: string, ds100refbis: string) {
    return computeDistanceOfBetriebsstellen(c.streckennummerA, ds100refvon, c.ds100_crossing_point, 10000)
        + computeDistanceOfBetriebsstellen(c.streckennummerB, c.ds100_crossing_point, ds100refbis, 10000)
}


function computeDistanceOfDoubleCrossing(c: DoubleCrossing, ds100refvon: string, ds100refbis: string) {
    return computeDistanceOfBetriebsstellen(c.streckennummerA, ds100refvon, c.ds100_crossing_point_A, 10000)
        + computeDistanceOfBetriebsstellen(c.streckennummerAB, c.ds100_crossing_point_A, c.ds100_crossing_point_B, 10000)
        + computeDistanceOfBetriebsstellen(c.streckennummerB, c.ds100_crossing_point_B, ds100refbis, 10000)
}

function computeDistance(routes: Array<RailwayRouteOfTrip>) {
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
    const cache = railwayRouteCache.value.find(c => hs_pos_von.uic_ref === c.uicFrom && hs_pos_bis.uic_ref === c.uicTo);
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
    const intersection = hs_pos_von.streckenpositionen.find(a => hs_pos_bis.streckenpositionen.find(b => a.STRECKE_NR === b.STRECKE_NR));
    if (intersection) {
        state.success = true;
        console.log('found intersection: ', hs_pos_von.ds100_ref, intersection.STRECKE_NR, hs_pos_bis.ds100_ref)
        if (state.actualRailwayRoute === undefined) {
            state.actualRailwayRoute = {
                railwayRouteNr: intersection.STRECKE_NR,
                from: buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_von),
                to: buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_bis)
            }
        } else {
            if (state.actualRailwayRoute.railwayRouteNr === intersection.STRECKE_NR) {
                state.actualRailwayRoute.to = buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_bis);
            } else {
                if (state.actualRailwayRoute.to === undefined && state.actualRailwayRoute.railwayRouteNr) {
                    state.actualRailwayRoute.to = buildStopWithRailwayRoutePosition(state.actualRailwayRoute.railwayRouteNr, hs_pos_von);
                }
                state.railwayRoutes.push(state.actualRailwayRoute);
                state.actualRailwayRoute = {
                    railwayRouteNr: intersection.STRECKE_NR,
                    from: buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_von),
                    to: buildStopWithRailwayRoutePosition(intersection.STRECKE_NR, hs_pos_bis)
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

    const doubleCrossings = routeSearchType === "double"
        ? findRailwayRoutesWithDoubleCrossing(hs_pos_von.ds100_ref, hs_pos_von.streckenpositionen, hs_pos_bis.ds100_ref, hs_pos_bis.streckenpositionen)
            .sort((a, b) => computeDistanceOfDoubleCrossing(a, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref)
                - computeDistanceOfDoubleCrossing(b, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref))
        : [];
    if (verbose) {
        console.log('doubleCrossings: ', hs_pos_von.ds100_ref, '-', hs_pos_bis.ds100_ref, ', length: ', doubleCrossings.length);
        dumpDoubleCrossings(doubleCrossings, hs_pos_von, hs_pos_bis);
    }

    const singleCrossing = singleCrossings.length > 0 ? singleCrossings[0] : undefined;
    const doubleCrossing = doubleCrossings.length > 0 ? doubleCrossings[0] : undefined;

    if (singleCrossing && doubleCrossing) {
        state.success = true;
        const distSingle = computeDistanceOfSingleCrossing(singleCrossing, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref);
        const distDouble = computeDistanceOfDoubleCrossing(doubleCrossing, hs_pos_von.ds100_ref, hs_pos_bis.ds100_ref);
        if (distSingle <= distDouble) {
            console.log('found singleCrossing: ', hs_pos_von.ds100_ref, singleCrossing.streckennummerA, singleCrossing.ds100_crossing_point, singleCrossing.streckennummerB, hs_pos_bis.ds100_ref)
            state = addSingleCrossingToRoute(state, singleCrossing, hs_pos_von, hs_pos_bis);
        } else {
            logFounddoubleCrossing(hs_pos_von, doubleCrossing, hs_pos_bis);
            state = addDoubleCrossingToRoute(state, doubleCrossing, hs_pos_von, hs_pos_bis);
        }
    }
    else if (singleCrossing) {
        state.success = true;
        console.log('found singleCrossing: ', hs_pos_von.ds100_ref, singleCrossing.streckennummerA, singleCrossing.ds100_crossing_point, singleCrossing.streckennummerB, hs_pos_bis.ds100_ref)
        state = addSingleCrossingToRoute(state, singleCrossing, hs_pos_von, hs_pos_bis);
    }
    else if (doubleCrossing) {
        state.success = true;
        logFounddoubleCrossing(hs_pos_von, doubleCrossing, hs_pos_bis);
        state = addDoubleCrossingToRoute(state, doubleCrossing, hs_pos_von, hs_pos_bis);
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
        if (c.bsPosOfA.KUERZEL !== c.bsPosOfB.KUERZEL) {
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
    railwayRoutes.value.forEach(s => {
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
function findRailwayRoutesOfTrip(uic_refs: number[], useCache: boolean, routeSearchType?: 'single' | 'double') {
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
            state = findRailwayRoutesFromCrossings(state, hs_pos_from, hs_pos_to, routeSearchType);
        }
        if (!state.success) {
            console.log('found nothing: ', hs_pos_from.ds100_ref, hs_pos_to.ds100_ref)
        }
    }
    if (state.actualRailwayRoute !== undefined) {
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

export { findRailwayRoutesOfTrip, findRailwayRouteDS100Endpoint, findRailwayRoutePositionForRailwayRoutes, findBetriebsstellenMitPositionAnStreckeForRailwayRouteNr, findRailwayRoute, findRailwayRouteText, computeDistance }

export type { BetriebsstelleRailwayRoutePosition, RailwayRouteOfTrip, RailwayRouteCache, RailwayRoute, RailwayRouteDS100Endpoint }