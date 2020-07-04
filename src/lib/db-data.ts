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

export interface StopWithRailwayRoutePosition {
    uic_ref: number;
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
    from?: StopWithRailwayRoutePosition;
    to?: StopWithRailwayRoutePosition;
}

// missing from dataset/geo-betriebsstelle, work in progress
export const missing = JSON.parse(`[{
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
    }]`) as Array<BetriebsstelleMitPositionAnStrecke>;

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

interface Crossing {
    streckennummerA: number;
    streckennummerB: number;
    hs?: Haltestelle;
    bsPosOfA: BetriebsstelleMitPositionAnStrecke;
    bsPosOfB: BetriebsstelleMitPositionAnStrecke;
}

export function findRailwayRoutesWithCrossing(arrA: Array<BetriebsstelleMitPositionAnStrecke>, arrB: Array<BetriebsstelleMitPositionAnStrecke>) {
    const crossings: Crossing[] = [];
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
                        crossings.push({ streckennummerA: a.STRECKE_NR, streckennummerB: b.STRECKE_NR, bsPosOfA: cOfA, bsPosOfB: cOfB, hs });
                    }
                });
            }
        })
    })
    return crossings;
}

function buildStopWithRailwayRoutePosition(streckennummer: number, hs_pos: StopWithRailwayRoutePositions): StopWithRailwayRoutePosition {
    const positionen = hs_pos.streckenpositionen.filter(s => s.STRECKE_NR === streckennummer);
    return {
        uic_ref: hs_pos.uic_ref, name: hs_pos.name,
        railwayRoutePosition: positionen.length > 0 ? positionen[0] : undefined
    }
}

export function findRailwayRouteText(railwayRouteNr: number) {
    const routes = strecken.filter(s => s.STRNR === railwayRouteNr);
    return routes.length > 0 ? routes[0].STRKURZN : '';
}

export function findRailwayRoutesOfTrip(uic_refs: number[]) {
    const hs_pos_list = findStopWithRailwayRoutePositions(removeDuplicates(uic_refs));
    const railwayRoutes: Array<RailwayRouteOfTrip> = [];
    let actualRailwayRoute: RailwayRouteOfTrip | undefined = undefined;
    for (var n = 0; n < hs_pos_list.length - 1; n++) {
        const hs_pos_von = hs_pos_list[n];
        const hs_pos_bis = hs_pos_list[n + 1];
        const intersection = findCommonRailwayRoutes(hs_pos_von.streckenpositionen, hs_pos_bis.streckenpositionen);
        if (intersection.length > 0) {
            if (actualRailwayRoute === undefined) {
                actualRailwayRoute = {
                    railwayRouteNr: intersection[0],
                    from: buildStopWithRailwayRoutePosition(intersection[0], hs_pos_von),
                    to: buildStopWithRailwayRoutePosition(intersection[0], hs_pos_bis)
                }
            } else {
                if (actualRailwayRoute.railwayRouteNr === intersection[0]) {
                    actualRailwayRoute.to = buildStopWithRailwayRoutePosition(intersection[0], hs_pos_bis);
                } else {
                    railwayRoutes.push(actualRailwayRoute);
                    actualRailwayRoute = {
                        railwayRouteNr: intersection[0],
                        from: buildStopWithRailwayRoutePosition(intersection[0], hs_pos_von),
                        to: buildStopWithRailwayRoutePosition(intersection[0], hs_pos_bis)
                    };
                }
            }
        } else {
            const crossings = findRailwayRoutesWithCrossing(hs_pos_von.streckenpositionen, hs_pos_bis.streckenpositionen);
            if (crossings.length > 0) {
                if (actualRailwayRoute === undefined) {
                    actualRailwayRoute = {
                        railwayRouteNr: crossings[0].streckennummerA,
                        from: buildStopWithRailwayRoutePosition(crossings[0].streckennummerA, hs_pos_von),
                        to: { uic_ref: crossings[0].hs?.EVA_NR ?? 0, name: crossings[0].bsPosOfA.BEZEICHNUNG, railwayRoutePosition: crossings[0].bsPosOfA }
                    }
                } else {
                    actualRailwayRoute.to = { uic_ref: crossings[0].hs?.EVA_NR ?? 0, name: crossings[0].bsPosOfA.BEZEICHNUNG, railwayRoutePosition: crossings[0].bsPosOfA }
                }
                railwayRoutes.push(actualRailwayRoute);
                actualRailwayRoute = {
                    railwayRouteNr: crossings[0].streckennummerB,
                    from: { uic_ref: crossings[0].hs?.EVA_NR ?? 0, name: crossings[0].bsPosOfB.BEZEICHNUNG, railwayRoutePosition: crossings[0].bsPosOfB }
                }
            } else {
                if (actualRailwayRoute === undefined) {
                    actualRailwayRoute = { // empty entry
                        railwayRouteNr: undefined,
                        from: { uic_ref: hs_pos_von.uic_ref, name: hs_pos_von.name, railwayRoutePosition: undefined },
                        to: { uic_ref: hs_pos_bis.uic_ref, name: hs_pos_von.name, railwayRoutePosition: undefined }
                    }
                }
                railwayRoutes.push(actualRailwayRoute);
                if (hs_pos_bis.streckenpositionen.length > 0) {
                    // adhoc: keine gemeinsame strecke 'von' nach 'bis' gefunden, also 'bis' streckennummer nehmen
                    actualRailwayRoute = {
                        railwayRouteNr: hs_pos_bis.streckenpositionen[0].STRECKE_NR,
                        from: buildStopWithRailwayRoutePosition(hs_pos_bis.streckenpositionen[0].STRECKE_NR, hs_pos_von),
                        to: buildStopWithRailwayRoutePosition(hs_pos_bis.streckenpositionen[0].STRECKE_NR, hs_pos_bis)
                    };
                } else {
                    actualRailwayRoute = undefined;
                }
            }
        }
    }
    if (actualRailwayRoute != undefined) {
        if (actualRailwayRoute.railwayRouteNr && hs_pos_list.length > 0) {
            actualRailwayRoute.to = buildStopWithRailwayRoutePosition(actualRailwayRoute.railwayRouteNr, hs_pos_list[hs_pos_list.length - 1])
        }
        railwayRoutes.push(actualRailwayRoute);
    }
    return railwayRoutes;
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
