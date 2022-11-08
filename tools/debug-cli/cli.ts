import { hafas, isStopover4Routes } from "../../src/lib//hafas";
import { rinfFindRailwayRoutesOfTripIBNRs } from "../../src/lib//rinf-data-railway-routes";
import { Line, Journey, Stop } from 'hafas-client';
import type { GraphNode } from 'rinf-graph/rinfgraph.bundle';
import { dbPrices } from '../../src/lib/db-prices';
import moment from 'moment';

require('isomorphic-fetch');

const myArgs = process.argv.slice(2);

const profile = myArgs.indexOf("--fshafas") > 0 ? 'db-fsharp' : 'db';

const client = hafas(profile);

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
                console.log('price: ', j.price);
                j.legs.forEach(l => {
                    console.log('leg: ', l.tripId, l.origin?.name, l.destination?.name, l.line?.name, l.line?.product, l.line?.fahrtNr, l.plannedDeparture)

                    if (l.tripId) {
                        client.tripOfLeg(l.tripId, l.origin, l.destination, l.polyline)
                            .then(trip => {
                                console.log('leg: ', l.tripId, l.origin?.name, l.destination?.name, l.line?.name, l.line?.product, l.line?.fahrtNr, l.plannedDeparture)
                                trip.stopovers?.forEach(so => {
                                    console.log('stop: ', so.stop?.name, so.stop?.location?.latitude, so.stop?.location?.longitude, so.stop?.distance?.toFixed(3), ' lines:', filterLines(so.stop?.lines).length);
                                })
                            })
                            .catch((error) => {
                                console.log('There has been a problem with your tripsOfJourney operation: ' + error);
                            });
                    }

                });
            });
        })
        .catch(console.error);
}

const findRailwayRoutes = (stopsOfRoute: Stop[]): GraphNode[] => {
    try {
        const uics = stopsOfRoute.map(s => parseInt(s.id || "0", 10))
        return rinfFindRailwayRoutesOfTripIBNRs(uics, true);
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
    case 'locations':
        locations(myArgs[1]);
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
