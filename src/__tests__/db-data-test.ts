import { findRailwayRoutesOfTrip, findRailwayRoutePositionForRailwayRoutes } from '../lib/db-data'

test('test Frankfurt Köln witch cache', () => {
    FrankfurtKöln(true);
});

function ICE73HamburgFreiburg(useCache: boolean) {
    const stops = [8002549, 8000152, 8000128, 8003200, 8000105, 8000244, 8000191, 8000191, 8000774, 8000290, 8000107];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, useCache);
    expect(railwayRoutes.length.toString()).toMatch(/9|10/);
    if (railwayRoutes.length === 9) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(2200);
        expect(railwayRoutes[1].railwayRouteNr).toBe(1720);
        expect(railwayRoutes[2].railwayRouteNr).toBe(1710);
        expect(railwayRoutes[3].railwayRouteNr).toBe(1733);
        expect(railwayRoutes[4].railwayRouteNr).toBe(3900);
        expect(railwayRoutes[5].railwayRouteNr).toBe(3520);
        expect(railwayRoutes[6].railwayRouteNr).toBe(4010);
        expect(railwayRoutes[7].railwayRouteNr).toBe(4011);
        expect(railwayRoutes[8].railwayRouteNr).toBe(4000);
    }
    if (railwayRoutes.length === 10) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(2200);
        expect(railwayRoutes[1].railwayRouteNr).toBe(1720);
        expect(railwayRoutes[2].railwayRouteNr).toBe(1710);
        expect(railwayRoutes[3].railwayRouteNr).toBe(1733);
        expect(railwayRoutes[4].railwayRouteNr).toBe(3900);
        expect(railwayRoutes[5].railwayRouteNr).toBe(3520);
        expect(railwayRoutes[6].railwayRouteNr).toBe(3658);
        expect(railwayRoutes[7].railwayRouteNr).toBe(4010);
        expect(railwayRoutes[8].railwayRouteNr).toBe(4011);
        expect(railwayRoutes[9].railwayRouteNr).toBe(4000);
    }
};

test('test ICE 73 Hamburg Freiburg', () => {
    ICE73HamburgFreiburg(false);
});

test('test ICE 1581 Hamburg München without cache', () => {
    ICE1581HamburgMünchen(false);
});

test('test ICE 1581 Hamburg München with cache', () => {
    ICE1581HamburgMünchen(true);
});

function ICE1581HamburgMünchen(useCache: boolean) {
    const stops = [8002549, 8000147, 8000152, 8000128, 8003200, 8000115, 8000260, 8000284, 8000183, 8000261];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, useCache);
    expect(railwayRoutes.length.toString()).toMatch(/9|10/);
    if (railwayRoutes.length === 10) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(2200);
        expect(railwayRoutes[1].railwayRouteNr).toBe(1720);
        expect(railwayRoutes[2].railwayRouteNr).toBe(1710);
        expect(railwayRoutes[3].railwayRouteNr).toBe(1733);
        expect(railwayRoutes[4].railwayRouteNr).toBe(5910);
        expect(railwayRoutes[5].railwayRouteNr).toBe(5907);
        expect(railwayRoutes[6].railwayRouteNr).toBe(5850);
        expect(railwayRoutes[7].railwayRouteNr).toBe(5934);
        expect(railwayRoutes[8].railwayRouteNr).toBe(5851);
        expect(railwayRoutes[9].railwayRouteNr).toBe(5501);
    }
    if (railwayRoutes.length === 9) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(2200);
        expect(railwayRoutes[1].railwayRouteNr).toBe(1720);
        expect(railwayRoutes[2].railwayRouteNr).toBe(1710);
        expect(railwayRoutes[3].railwayRouteNr).toBe(1733);
        expect(railwayRoutes[4].railwayRouteNr).toBe(5910);
        expect(railwayRoutes[5].railwayRouteNr).toBe(5900);
        expect(railwayRoutes[6].railwayRouteNr).toBe(5850);
        expect(railwayRoutes[7].railwayRouteNr).toBe(5934);
        expect(railwayRoutes[8].railwayRouteNr).toBe(5501);
    }
};

test('test ICE 651 Köln Berlin', () => {
    ICE651KölnBerlin(false);
});

function ICE651KölnBerlin(useCache: boolean) {
    const stops = [8000207, 8000087, 8000266, 8000142, 8000149, 8000036, 8000152, 8006552, 8010404, 8098160];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, useCache);
    expect(railwayRoutes.length.toString()).toMatch(/10|11/);
    if (railwayRoutes.length === 10) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(2670);
        expect(railwayRoutes[1].railwayRouteNr).toBe(2652);
        expect(railwayRoutes[2].railwayRouteNr).toBe(2730);
        expect(railwayRoutes[3].railwayRouteNr).toBe(2731);
        expect(railwayRoutes[4].railwayRouteNr).toBe(2550);
        expect(railwayRoutes[5].railwayRouteNr).toBe(2852);
        expect(railwayRoutes[6].railwayRouteNr).toBe(2932);
        expect(railwayRoutes[7].railwayRouteNr).toBe(1700);
        expect(railwayRoutes[8].railwayRouteNr).toBe(1730);
        expect(railwayRoutes[9].railwayRouteNr).toBe(6107);
    }
    if (railwayRoutes.length === 11) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(2670);
        expect(railwayRoutes[1].railwayRouteNr).toBe(2652);
        expect(railwayRoutes[2].railwayRouteNr).toBe(2730);
        expect(railwayRoutes[3].railwayRouteNr).toBe(2731);
        expect(railwayRoutes[4].railwayRouteNr).toBe(2550);
        expect(railwayRoutes[5].railwayRouteNr).toBe(2840);
        expect(railwayRoutes[6].railwayRouteNr).toBe(2103);
        expect(railwayRoutes[7].railwayRouteNr).toBe(2932);
        expect(railwayRoutes[8].railwayRouteNr).toBe(1700);
        expect(railwayRoutes[9].railwayRouteNr).toBe(1730);
        expect(railwayRoutes[10].railwayRouteNr).toBe(6107);
    }
};

test('test Hagen Bielefeld', () => {
    const stops = [8000142, 8000036];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(5);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2550);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2840);
    expect(railwayRoutes[2].railwayRouteNr).toBe(2103);
    expect(railwayRoutes[3].railwayRouteNr).toBe(2932);
    expect(railwayRoutes[4].railwayRouteNr).toBe(1700);
});

test('test Hagen Hamm', () => {
    const stops = [8000142, 8000149];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(4);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2550);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2840);
    expect(railwayRoutes[2].railwayRouteNr).toBe(2103);
    expect(railwayRoutes[3].railwayRouteNr).toBe(2932);
});

test('test Hamm Berlin', () => {
    const stops = [8000149, 8000036, 8000152, 8006552, 8010404, 8098160];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(1700);
    expect(railwayRoutes[1].railwayRouteNr).toBe(1730);
    expect(railwayRoutes[2].railwayRouteNr).toBe(6107);
});

test('test Lübeck Fehmarn-Burg', () => {
    const stops = [8000237, 8001274];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(1100);
    expect(railwayRoutes[1].railwayRouteNr).toBe(1104)
    expect(railwayRoutes[2].railwayRouteNr).toBe(1103)

    const locations = findRailwayRoutePositionForRailwayRoutes(railwayRoutes, true);
    console.log('locations.length:', locations.length)
    expect(locations.length > 0).toBe(true)
});

test('test x', () => {
    const KM_I = 114350090;
    const x = KM_I - 100000000;
    const d1_meter = Math.trunc(x / 10000) * 100;
    const d2_meter = Math.trunc(x % 100);
    const d_meter = d1_meter + d2_meter;

    console.log(d_meter);
    expect(d_meter).toBe(143590);
});

test('test Osnabrück Hbf Bielefeld', () => {
    const stops = [8000294, 8003956, 8000059, 8003288, 8002824, 8000162, 8000036];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2992);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2981);
    expect(railwayRoutes[2].railwayRouteNr).toBe(1700);
});

test('test Osnabrück Bielefeld', () => {
    const stops = [8000294, 8000059, 8003288, 8002824, 8000162, 8000036];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2992);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2981);
    expect(railwayRoutes[2].railwayRouteNr).toBe(1700);
});

test('test Hamburg Hannover', () => {
    const stops = [8002549, 8000152];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2200);
    expect(railwayRoutes[1].railwayRouteNr).toBe(1720);
    expect(railwayRoutes[2].railwayRouteNr).toBe(1710);
});

test('test Frankurt Mannheim', () => {
    const stops = [8000105, 8000244];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length.toString()).toMatch(/3|4/);
    if (railwayRoutes.length === 3) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(3520);
        expect(railwayRoutes[1].railwayRouteNr).toBe(4010);
        expect(railwayRoutes[2].railwayRouteNr).toBe(4011);
    } else if (railwayRoutes.length === 4) {
        expect(railwayRoutes[0].railwayRouteNr).toBe(3520);
        expect(railwayRoutes[1].railwayRouteNr).toBe(3658);
        expect(railwayRoutes[2].railwayRouteNr).toBe(4010);
        expect(railwayRoutes[3].railwayRouteNr).toBe(4011);
    }
});

test('test Würzburg Nürnberg', () => {
    const stops = [8000260, 8000284];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(2);
    expect(railwayRoutes[0].railwayRouteNr).toBe(5910);
    expect(railwayRoutes[1].railwayRouteNr?.toString()).toMatch(/5900|5907/);
});

test('test Hannover Berlin', () => {
    const stops = [8000152, 8098160];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(2);
    expect(railwayRoutes[0].railwayRouteNr).toBe(1730);
    expect(railwayRoutes[1].railwayRouteNr).toBe(6107)
});

test('test Hannover Wolfsburg', () => {
    const stops = [8000152, 8006552];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(2);
    expect(railwayRoutes[0].railwayRouteNr).toBe(1730);
    expect(railwayRoutes[1].railwayRouteNr).toBe(6107)

    const locations = findRailwayRoutePositionForRailwayRoutes(railwayRoutes, true);
    console.log('locations.length:', locations.length)
    expect(locations.length > 0).toBe(true)
});

test('test Nürnberg Ingolstadt shortest path', () => {
    const stops = [8000284, 8000183];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(5850);
    expect(railwayRoutes[1].railwayRouteNr).toBe(5934);
    expect(railwayRoutes[2].railwayRouteNr?.toString()).toMatch(/5501|5851/);
});

test('test Würzburg Nürnberg shortest path', () => {
    const stops = [8000260, 8000284];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(2);
    expect(railwayRoutes[0].railwayRouteNr).toBe(5910);
    expect(railwayRoutes[1].railwayRouteNr?.toString()).toMatch(/5900|5907/);
});

test('test Hannover Wolfsburg shortest path', () => {
    const stops = [8000152, 8006552];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(2);
    expect(railwayRoutes[0].railwayRouteNr).toBe(1730);
    expect(railwayRoutes[1].railwayRouteNr).toBe(6107)

    const locations = findRailwayRoutePositionForRailwayRoutes(railwayRoutes, true);
    console.log('locations.length:', locations.length)
    expect(locations.length > 0).toBe(true)
});

function FrankfurtKöln(useCache: boolean) {
    const stops = [8000105, 8070003, 8000207];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, useCache);
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(3520);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2690);
    expect(railwayRoutes[2].railwayRouteNr?.toString()).toMatch(/2630|2616/);
};

test('test Frankfurt Köln', () => {
    FrankfurtKöln(false);
});

test('test Nürnberg München', () => {
    const stops = [8000284, 8000261];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(5850);
    expect(railwayRoutes[1].railwayRouteNr).toBe(5934);
    expect(railwayRoutes[2].railwayRouteNr).toBe(5501);
});

test('test ICE 651 Köln Berlin with cache', () => {
    ICE651KölnBerlin(true);
});

test('test ICE 73 Hamburg Freiburg with cache', () => {
    ICE73HamburgFreiburg(true);
});