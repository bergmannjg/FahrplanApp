import { findRailwayRoutesOfTrip } from '../lib/db-data'

test('test Osnabrück Hbf Bielefeld', () => {
    const stops = [8000294, 8003956, 8000059, 8003288, 8002824, 8000162, 8000036];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(2992);
    expect(railwayRoutes[1].railwayRouteNr).toBe(2981);
    expect(railwayRoutes[2].railwayRouteNr).toBe(1700);
});

test('test Nürnberg Ingolstadt Nord', () => {
    const stops = [8000284, 8003076];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(2);
    expect(railwayRoutes[0].railwayRouteNr).toBe(5850);
    expect(railwayRoutes[1].railwayRouteNr).toBe(5934);
});

test('test Nürnberg Ingolstadt', () => {
    const stops = [8000284, 8000183];
    const railwayRoutes = findRailwayRoutesOfTrip(stops, false);
    expect(railwayRoutes.length).toBe(3);
    expect(railwayRoutes[0].railwayRouteNr).toBe(5850);
    expect(railwayRoutes[1].railwayRouteNr).toBe(5934);
    expect(railwayRoutes[2].railwayRouteNr).toBe(5851);
});
