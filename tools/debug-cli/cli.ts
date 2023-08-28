import { hafas, isStopover4Routes } from "../../src/lib/hafas.js";
import { rinfFindRailwayRoutesOfTripStops } from "../../src/lib/rinf-data-railway-routes.js";
import type { Line, Journey, Stop, StopOver } from 'fs-hafas-client/hafas-client.js';
import type { GraphNode, RInfGraph } from 'rinf-graph/rinfgraph.bundle.js';
import { dbPrices } from '../../src/lib/db-prices.js';
import moment from 'moment';
import { railwayLineInfos, railwayLineTokens, RailwayLine, RailwayLineToken } from '../../src/lib/line-numbers.js';

const myArgs = process.argv.slice(2);

const profile = myArgs.indexOf("--hafas") > 0 ? 'db' : 'db-fsharp';

const client = hafas(profile);

/*
const locationsOfRailwayLine = async (r: RailwayLine) => {
    const ids: string[] = [];

    ids.push(r.StartStation);
    ids.push(...r.ViaStations);
    ids.push(r.EndStation);

    console.log(ids);

    const stops = await client.stopsOfIds(ids, uicRefs);
    console.log('stops: ', stops.length);

    stops.forEach(s => {
        console.log(s.id, s.name);
    });
}
*/

function addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

const journeyForRailwayLine = async (line: string, train: string, from: string, to: string, departure: Date, via?: string): Promise<Journey | undefined> => {

    const journeyParams = {
        bahncardDiscount: 25, bahncardClass: 1, age: 65, results: 10, firstClass: false, transfers: 0, transferTime: 8, regional: false
    }

    for (let step = 0; step < 14; step++) {
        const maybeJourneys = await client.journeys(from, to, journeyParams, addDays(departure, step), via, ["train"]);
        if (maybeJourneys && maybeJourneys.length > 0) {
            const filtered = maybeJourneys.find(j => {
                console.log('found caniddate journey:', j.legs[0].line?.name, j.legs[0].line?.matchId);
                return j.legs.filter(l => l.line?.matchId === line || l.line?.name === train).length > 0;
            });
            if (filtered) return filtered;
        }
    }
    return undefined;
}

const journeyOfRailwayLine = async (r: RailwayLine): Promise<RailwayLineToken | undefined> => {
    const vias: string[] = [r.ViaStations[Math.floor((r.ViaStations.length / 2))], r.ViaStations[0]];
    for (let step = 0; step < vias.length; step++) {
        const journey = await journeyForRailwayLine(r.Line.toString(), r.Train, r.StartStation, r.EndStation, new Date(2022, 11, 12, 4, 0), vias[step]);
        const leg = journey?.legs[0];
        if (leg && journey?.refreshToken) {
            const result = { Line: r.Line, RefreshToken: journey?.refreshToken };
            console.log(JSON.stringify(result));
            return result;
        }
    }
}

const railwayLine = (line: number) => {
    railwayLineInfos
        .filter(r => r.Line === line)
        .forEach(r => journeyOfRailwayLine(r));
}

const infosOfrailwayLines = async () => {
    const infos: RailwayLineToken[] = [];
    for (let step = 0; step < railwayLineInfos.length; step++) {
        const railwayLine = railwayLineInfos[step];
        if (!railwayLineTokens.find(r => r.Line === railwayLine.Line)) {
            console.log('railwayLine.Line: ', railwayLine.Line);
            const info = await journeyOfRailwayLine(railwayLine);
            if (info) infos.push(info);
        }
    }
    console.log(JSON.stringify(infos));
}

const importGraph = () => {
    import('rinf-graph/data/Graph.json', { assert: { type: 'json' } })
        .then(g => {
            console.log('g:', g.default.length);
        })
        .catch(console.error);
}

const imports = () => {
    import('rinf-graph/rinfgraph.bundle.js')
        .then(module => {
            const rinfgraph: RInfGraph = module.default.rinfgraph;
            const path = rinfgraph.Graph_getCompactPath([{ Node: "x", Edges: [] }]);
            console.log('path:', path.length);
        })
        .catch(console.error);
}

const locations = (name?: string) => {
    name && client.locations(name, 5)
        .then(result => {
            result.forEach(s => {
                if (client.isStop(s)) {
                    console.log(s.id, s.name);
                }
                // console.log(s);
            });
        })
        .catch(console.error);
}

const filterLines = (lines?: readonly Line[]): string[] => {
    return lines
        ? lines?.filter(l => l.name && l.mode === 'train' && !l.name?.startsWith('Bus') && !l.name?.startsWith('S')).map(l => l.name ?? '')
        : [];
}

const defaultJourneyParams = {
    bahncardDiscount: 25, bahncardClass: 1, age: 65, results: 3, firstClass: false, transfers: -1, transferTime: 8, regional: false
}

const prices = async (from?: string, to?: string, date?: string, days?: string) => {
    if (from === undefined || to === undefined) return;

    const day = date ? moment(date) : moment();
    const ndays = days ? parseInt(days) : 0;

    const locationsFrom =
        client.isLocation(from) ? [from] :
            await client.locations(from, 1);

    const locationsTo =
        client.isLocation(to) ? [to]
            : await client.locations(to, 1);
    if (locationsFrom[0].id !== undefined && locationsTo[0].id !== undefined) {

        dbPrices(locationsFrom[0].id, locationsTo[0].id, day.toDate(), ndays, defaultJourneyParams)
            .then((journeys: Journey[]) => {
                if (journeys && journeys.length > 0) {
                    journeys.forEach(journey => {
                        const ji = client.journeyInfo(journey);
                        const dt = new Date(ji.originDeparture);
                        console.log(ji.originName, ji.destinationName, moment(dt).format('llll'), ji.price);
                    });
                }
            })
            .catch(err => {
                console.error(err)
            });
    }
}

const journeys = (from?: string, to?: string, via?: string) => {
    from && to && client.journeys(from, to, defaultJourneyParams, undefined, via)
        .then(result => {
            result.forEach(j => {
                console.log('price: ', j.price?.amount);
                j.legs.forEach(l => {
                    console.log('leg: ', l.tripId, l.origin?.name, l.destination?.name, l.line?.name, l.line?.product, l.line?.fahrtNr, l.plannedDeparture)

                    if (l.tripId) {
                        client.tripOfLeg(l.tripId, l.origin, l.destination, l.polyline)
                            .then(trip => {
                                console.log('leg: ', l.tripId, l.origin?.name, l.destination?.name, l.line?.name, l.line?.product, l.line?.fahrtNr, l.plannedDeparture)
                                trip.stopovers?.forEach((so: StopOver) => {
                                    console.log('stop: ', so.stop?.name, so.stop?.location?.latitude, so.stop?.location?.longitude, so.stop?.distance?.toFixed(3), ' lines:', filterLines(so.stop?.lines).length, so.cancelled ? 'cancelled' : '', so.additionalStop ? 'additionalStop' : '');
                                })
                            })
                            .catch((error) => {
                                console.log('There has been a problem with your tripOfLeg operation: ' + error.message, error.stack);
                            });
                    }

                });
            });
        })
        .catch(console.error);
}

const findRailwayRoutes = (stopsOfRoute: Stop[]): GraphNode[] => {
    try {
        return rinfFindRailwayRoutesOfTripStops(stopsOfRoute, true);
    } catch (ex) {
        console.error("findRailwayRoutesOfTrip", (ex as Error).message);
        return [];
    }
}

function reducer(previous: GraphNode[], current: GraphNode): GraphNode[] {
    let next = previous;
    if (previous.length === 0) {
        next = previous.concat(current);
    } else if (previous.length > 0 && previous[previous.length - 1].Edges[0].Line !== current.Edges[0].Line) {
        next = previous.concat(current);
    } else {
        previous[previous.length - 1].Edges[0].Node = current.Edges[0].Node;
    }
    return next;
}

const routes = (from?: string, to?: string) => {
    from && to && client.journeys(from, to, defaultJourneyParams)
        .then(result => {
            const j = result[0];
            const ji = client.journeyInfo(j);
            const stops = [] as Stop[];
            ji.legs.forEach(leg => {
                leg.stopovers?.forEach(stopover => {
                    if (client.isStop(stopover.stop) && isStopover4Routes(stopover)) {
                        stops.push(stopover.stop);
                    }
                })
            })
            findRailwayRoutes(stops).reduce(reducer, []).forEach(node =>
                console.log(node.Node, node.Edges[0].Node, node.Edges[0].Line));
        })
}

const nearby = (lat?: string, lon?: string) => {
    lat && lon && client.nearby(parseFloat(lat), parseFloat(lon), 20000, ["train"], { nationalExpress: true, national: true, regionalExp: true, regional: true })
        .then(result => {
            console.log('found:', result.length)
            result.forEach(s => {
                if (client.isStop(s)) {
                    console.log('stop: ', s.name, s.location?.latitude, s.location?.longitude);
                    filterLines(s.lines).forEach(name => console.log('  ', name));
                }
            });
        })
        .catch(console.error);
}

switch (myArgs[0]) {
    case 'imports':
        imports();
        break;
    case 'locations':
        locations(myArgs[1]);
        break;
    case 'railwayline':
        railwayLine(Number(myArgs[1]));
        break;
    case 'railwaylines':
        infosOfrailwayLines();
        break;
    case 'journeys':
        journeys(myArgs[1], myArgs[2], myArgs[3]);
        break;
    case 'routes':
        routes(myArgs[1], myArgs[2]);
        break;
    case 'nearby':
        nearby(myArgs[1], myArgs[2]);
        break;
    case 'prices':
        prices(myArgs[1], myArgs[2], myArgs[3], myArgs[4]);
        break;
    default:
        console.log('unkown argument: ', myArgs[0]);
}
