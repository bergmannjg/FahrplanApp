import createClient, { Feature } from 'hafas-client';

import bvgProfile, { products } from 'hafas-client/p/bvg';
import cflProfile from 'hafas-client/p/cfl';
import cmtaProfile from 'hafas-client/p/cmta';
import dbProfile from 'hafas-client/p/db';
import dbbusradarnrwProfile from 'hafas-client/p/db-busradar-nrw';
import hvvProfile from 'hafas-client/p/hvv';
import insaProfile from 'hafas-client/p/insa';
import invgProfile from 'hafas-client/p/invg';
import nahshProfile from 'hafas-client/p/nahsh';
import nvvProfile from 'hafas-client/p/nvv';
import oebbProfile from 'hafas-client/p/oebb';
import pkpProfile from 'hafas-client/p/pkp';
import rmvProfile from 'hafas-client/p/rmv';
import rsagProfile from 'hafas-client/p/rsag';
import saarfahrplanProfile from 'hafas-client/p/saarfahrplan';
import sbahnmuenchenProfile from 'hafas-client/p/sbahn-muenchen';
// import sncbProfile from 'hafas-client/p/sncb';
import svvProfile from 'hafas-client/p/svv';
import vbbProfile from 'hafas-client/p/vbb';
import vbnProfile from 'hafas-client/p/vbn';
import vmtProfile from 'hafas-client/p/vmt';
import vsnProfile from 'hafas-client/p/vsn';

import { FeatureCollection, Journey, Leg, Line, Location, Station, Stop, StopOver, Trip, Alternative, Products, Status, Movement } from 'hafas-client';
import { fshafas } from "fs-hafas-client";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const geolib = require('geolib');

require('isomorphic-fetch');

const chooseClient = (p: string, profile: createClient.Profile) => {
    switch (p) {
        case 'bvg-fsharp': return fshafas.createClient('bvg');
        case 'db-fsharp': return fshafas.createClient('db');
        default: {
            return createClient(profile, 'agent');
        }
    }
}

const chooseProfile = (p: string): createClient.Profile => {
    switch (p) {
        case 'bvg': return bvgProfile;
        case 'cfl': return cflProfile;
        case 'cmta': return cmtaProfile;
        case 'db': return dbProfile;
        case 'dbbusradarnrw': return dbbusradarnrwProfile;
        case 'hvv': return hvvProfile;
        case 'insa': return insaProfile;
        case 'invg': return invgProfile;
        case 'nahsh': return nahshProfile;
        case 'nvv': return nvvProfile;
        case 'oebb': return oebbProfile;
        case 'pkp': return pkpProfile;
        case 'rmv': return rmvProfile;
        case 'rsag': return rsagProfile;
        case 'saarfahrplan': return saarfahrplanProfile;
        case 'sbahnmuenchen': return sbahnmuenchenProfile;
        case 'svv': return svvProfile;
        case 'vbb': return vbbProfile;
        case 'vbn': return vbnProfile;
        case 'vmt': return vmtProfile;
        case 'vsn': return vsnProfile;
        case 'bvg-fsharp': return fshafas.getProfile('bvg');
        case 'db-fsharp': return fshafas.getProfile('db');
        default: {
            console.log('choose default');
            return dbProfile;
        }
    }
};

export interface JourneyInfo {
    type: 'journeyinfo',
    id: string,
    legs: Leg[],
    origin: Station | Stop | Location | undefined,
    originName: string,
    originDeparture: string,
    originLocation?: Location,
    destination: Station | Stop | Location | undefined,
    destinationName: string,
    destinationArrival: string,
    destinationLocation?: Location,
    countLegs: number,
    plannedDeparture: string,
    plannedArrival: string,
    reachable?: boolean,
    cancelled?: boolean,
    informationAvailable: boolean,
    statusRemarks: Status[],
    changes: number,
    lineNames: string,
    distance: number
}

export interface Hafas {
    journeys: (from: string | Location, to: string | Location, results: number, departure?: Date | undefined, via?: string, transferTime?: number, modes?: string[]) => Promise<ReadonlyArray<Journey>>,
    locations: (from: string, results: number) => Promise<ReadonlyArray<Station | Stop | Location>>,
    nearby: (latitude: number, longitude: number, distance: number, modes?: string[], products?: Products) => Promise<ReadonlyArray<Station | Stop | Location>>,
    departures: (station: string, modes: ReadonlyArray<string>, when: Date, onlyLocalProducts: boolean) => Promise<ReadonlyArray<Alternative>>,
    trip: (tripId?: string) => Promise<Trip>,
    tripOfLeg: (tripId: string, origin: Station | Stop | Location | undefined, destination: Station | Stop | Location | undefined, fc?: FeatureCollection) => Promise<Trip>,
    stopssOfJourney: (journey: Journey | JourneyInfo, modes: ReadonlyArray<string>, useTransits?: boolean, nationalProductsOfStops?: boolean) => Promise<Stop[]>,
    radar: (loc: Location, duration?: number) => Promise<ReadonlyArray<Movement>>,
    journeyInfo: (journey: Journey) => JourneyInfo,
    isStop: (s: Station | Stop | Location | undefined) => s is Stop,
    isLocation: (s: string | Station | Stop | Location | undefined) => s is Location,
    getLocation: (s: Station | Stop | Location | undefined) => Location | undefined,
    distanceOfJourney: (j: Journey) => number,
    distanceOfLeg: (l: Leg) => number
}

function isStop(s: Station | Stop | Location | undefined): s is Stop {
    return 'object' === typeof s && s.type === 'stop';
}

function isLocation(s: string | Station | Stop | Location | undefined): s is Location {
    return 'object' === typeof s && s.type === 'location';
}

export function isStop4Routes(stop: Stop): boolean {
    return !!stop.products?.nationalExpress || !!stop.products?.national;
}

export function isStopover4Routes(stopover: StopOver): boolean {
    return isStop(stopover.stop)
        && (!!stopover.plannedDeparture || !!stopover.plannedArrival
            // conditions for transit stations
            || isStop4Routes(stopover.stop))
}

export function getLocation(s: Station | Stop | Location | undefined): Location | undefined {
    if (isStop(s)) return s.location
    else if (isLocation(s)) return s
    else return undefined;
}

export function hafas(profileName: string): Hafas {
    console.log('createClient, profile: ', profileName);
    const profile = chooseProfile(profileName);
    const client = chooseClient(profileName, profile)

    /*
    if (__DEV__ && profileName === 'db-fsharp') {
        fshafas.setDebug();
    }
    */

    const journeyInfo = (journey: Journey): JourneyInfo => {
        const defaultDate = new Date();
        const indexFrom = 0;
        const indexTo = journey.legs.length - 1;
        const origin = journey.legs[indexFrom].origin;
        const originLocation = (journey.legs[indexFrom].origin as Stop).location;
        const originDeparture = journey.legs[indexFrom].departure ?? defaultDate.toISOString();
        const destination = journey.legs[indexTo].destination;
        const destinationName = journey.legs[indexTo].destination?.name ?? "";
        const destinationLocation = (journey.legs[indexTo].destination as Stop).location;
        const destinationArrival = journey.legs[indexTo].arrival ?? defaultDate.toISOString();
        const legs = journey.legs.filter(leg => leg?.line || leg.walking);
        const plannedDeparture = journey.legs[indexFrom].plannedDeparture ?? "";
        const plannedArrival = journey.legs[indexTo].plannedArrival ?? "";
        const reachable = journey.legs.every(item => item.reachable || item.walking);
        const cancelled = journey.legs.some(item => item.cancelled);
        let changes = journey.legs.filter(leg => leg?.line).length;
        const lineNames = journey.legs.reduce((acc, leg) => {
            const name = leg.line?.name ?? '';
            console.log('name:', name);
            const found = name.match(/^[A-Z]+/i)
            if (found) return acc + (acc.length > 0 ? ', ' : '') + found[0];
            else return acc;
        }, '')
        changes = changes > 0 ? changes - 1 : 0;

        // guess missing name
        const guessName = (stop?: Station | Stop | Location) => {
            if (stop && !stop.name) {
                if (isLocation(stop)
                    && stop.address
                    && stop.address !== 'unused') stop.name = stop.address;
                else stop.name = 'aktuelle Position';
            }
        }

        if (legs.length > 0 && legs[indexFrom].walking) {
            guessName(legs[indexFrom].origin);
        }

        if (legs.length > 0 && legs[indexTo].walking) {
            guessName(legs[indexTo].destination);
        }

        const originName = journey.legs[indexFrom].origin?.name ?? "";

        const statusRemarks = legs[indexTo].remarks?.filter(r => r.type === 'status' && r.summary) as Status[] | undefined;

        return {
            type: 'journeyinfo', legs, id: originName + '+' + destinationName + '+' + originDeparture + '+' + destinationArrival,
            origin, originName, originDeparture, originLocation,
            destination, destinationName, destinationArrival, destinationLocation,
            countLegs: journey.legs.length,
            plannedDeparture, plannedArrival,
            reachable, cancelled,
            informationAvailable: statusRemarks && statusRemarks.length > 0 ? true : false, statusRemarks: statusRemarks ? statusRemarks : [],
            changes, lineNames, distance: distanceOfJourney(journey)
        };
    }

    const trip = async (tripId?: string): Promise<Trip> => {
        if (client.trip && tripId) {
            const t: Trip = await client.trip(tripId, "ignored", {});
            return t;
        } else {
            return Promise.reject();
        }
    }

    const tripOfLeg = async (tripId: string, origin: Station | Stop | Location | undefined, destination: Station | Stop | Location | undefined, fc?: FeatureCollection): Promise<Trip> => {
        if (client.trip && tripId) {
            const t: Trip = await client.trip(tripId, "ignored", {});

            const stopovers = stopoversOnLeg(t, origin, destination).filter(stopover => stopover.stop && isStop(stopover.stop));
            const stopsInLeg = stopovers.map<Stop>(stopover => stopover.stop as Stop);

            if (fc) {
                const productsOfStops = { nationalExpress: true, national: true, regionalExp: true, regional: true }; // todo: as param
                const stops = await stopsInFeatureCollection(fc, stopsInLeg, productsOfStops);

                const stopoversInFeatureCollection = stops.map(s => {
                    const stopoverOrig = stopovers.find(so => so.stop?.id === s.id);
                    const stopover: StopOver = {
                        stop: s,
                        plannedDeparture: stopoverOrig?.plannedDeparture,
                        plannedArrival: stopoverOrig?.plannedArrival
                    };
                    return stopover;
                });
                const plannedDeparture = stopoversInFeatureCollection[0].plannedDeparture;
                const plannedArrival = stopoversInFeatureCollection[stopoversInFeatureCollection.length - 1].plannedArrival;
                console.log('stopoversInFeatureCollection.length:', stopoversInFeatureCollection.length);
                return { id: t.id, origin: t.origin, destination: t.destination, line: t.line, plannedDeparture, plannedArrival, stopovers: stopoversInFeatureCollection };
            } else {
                const plannedDeparture = stopovers[0].plannedDeparture;
                const plannedArrival = stopovers[stopovers.length - 1].plannedArrival;
                console.log('stopovers.length:', stopovers.length);
                return { id: t.id, origin: t.origin, destination: t.destination, line: t.line, plannedDeparture, plannedArrival, stopovers };
            }
        } else {
            return Promise.reject();
        }
    }

    const stopoversOnLeg = (t: Trip, origin: Station | Stop | Location | undefined, destination: Station | Stop | Location | undefined): StopOver[] => {
        const from = t.stopovers?.findIndex(stopover => origin?.id === stopover.stop?.id);
        if (from === -1) return [];
        const to = t.stopovers?.findIndex(stopover => destination?.id === stopover.stop?.id, from);
        if (to === -1) return [];
        return t.stopovers && to ? t.stopovers.slice(from, to + 1) : [];
    }

    const stopssOfLeg = async (leg: Leg, modes: ReadonlyArray<string>) => {
        if (leg.walking) return [];
        const t = await trip(leg.tripId);
        if (t.line && modes.findIndex(m => m === t.line?.mode?.toString().toLowerCase()) >= 0) {
            return stopoversOnLeg(t, leg.origin, leg.destination)
                .filter(stopover => stopover.stop && isStop(stopover.stop))
                .map<Stop>(stopover => stopover.stop as Stop);
        } else {
            return [];
        }

    }

    const unionToString = (x?: string | unknown): string | undefined => {
        if (x && typeof x === "object") return x.toString().toLowerCase();
        else if (x && typeof x === "string") return x.toLowerCase();
        else return undefined;
    }

    const stopssOfJourney = async (journey: Journey | JourneyInfo, modes: ReadonlyArray<string>, useTransits?: boolean, nationalProductsOfStops?: boolean) => {
        let stops: Stop[] = [];
        const productsOfStops = nationalProductsOfStops ? { nationalExpress: true, national: true, regionalExp: false, regional: false } : { nationalExpress: true, national: true, regionalExp: true, regional: true };
        const productsOfLines = ["nationalExpress", "national"];
        for (const leg of journey.legs) {
            console.log('useTransits:', leg.line?.name, useTransits, leg.polyline ? true : false, productsOfLines.find(p => leg.line?.product === p))
            if (useTransits && leg.polyline && productsOfLines.find(p => leg.line?.product === p)) {
                const stopsInLeg = await stopssOfLeg(leg, ['train']);
                stops = stops.concat(await stopsInFeatureCollection(leg.polyline, stopsInLeg, productsOfStops));
            } else {
                stops = stops.concat(await stopssOfLeg(leg, modes));
            }
        }
        return stops;
    }

    function getLocation(s: Station | Stop | Location | undefined): Location | undefined {
        if (isStop(s)) return s.location
        else if (isLocation(s)) return s
        else return undefined;
    }

    function getProductsFromModes(modes: string[]): Products {
        const products: Products = {}
        profile.products.forEach(p => {
            products[p.id] = modes.length === 0 || modes.find(m => unionToString(p.mode) === m.toLowerCase()) !== undefined;
        })
        return products;
    }

    function getProductsFromProducts(productsGiven: Products): Products {
        const products: Products = {}
        profile.products.forEach(p => {
            products[p.id] = productsGiven[p.id];
        })
        return products;
    }

    const journeys = async (from: string | Location, to: string | Location, results: number, departure?: Date, via?: string, transferTime?: number, modes?: string[]): Promise<ReadonlyArray<Journey>> => {
        if (!transferTime) transferTime = 10;
        const locationsFrom =
            isLocation(from) ? [from] :
                await client.locations(from, { results: 1 });
        console.log('from:', locationsFrom[0].id, locationsFrom[0].name);
        const locationsTo =
            isLocation(to) ? [to]
                : await client.locations(to, { results: 1 });
        console.log('to:', locationsTo[0].id, locationsTo[0].name);
        if ((locationsFrom[0].id || isLocation(locationsFrom[0])) && (locationsTo[0].id || isLocation(locationsTo[0]))) {
            let viaId: string | undefined;
            if (via && via.length > 0) {
                const viaFrom = await client.locations(via, { results: 1 });
                console.log('via:', viaFrom[0].id, viaFrom[0].name);
                if (viaFrom[0].id) {
                    viaId = viaFrom[0].id;
                }
            }
            try {
                const products = getProductsFromModes(modes ?? []);
                const res = await client.journeys(locationsFrom[0], locationsTo[0], { products, results, departure, via: viaId, transferTime, polylines: true, stopovers: true });
                return res.journeys ?? [];
            } catch (e) {
                const error = e as Error;
                const isHafasError = e.isHafasError;
                if (isHafasError) {
                    console.log(error.message, ', hafasErrorCode: ', e.hafasErrorCode);
                    return [];
                }
                else {
                    console.log(error.message);
                    throw e;
                }
            }
        } else {
            return [];
        }
    }

    const locations = async (from: string, results: number): Promise<ReadonlyArray<Station | Stop | Location>> => {
        return await client.locations(from, { results });
    }

    const radar = async (loc: Location, duration?: number): Promise<ReadonlyArray<Movement>> => {
        if (client.radar && loc.latitude && loc.longitude) {
            const [southwest, northeast] = geolib.getBoundsOfDistance(
                { latitude: loc.latitude, longitude: loc.longitude },
                2000
            );
            console.log('southwest:', southwest, ', northeast:', northeast);
            return await client.radar({
                north: northeast.latitude,
                west: southwest.longitude,
                south: southwest.latitude,
                east: northeast.longitude
            }, { results: 20, duration: duration });
        } else {
            return Promise.reject();
        }
    }

    const nearby = async (latitude: number, longitude: number, distance: number, modes?: string[], products?: Products): Promise<ReadonlyArray<Station | Stop | Location>> => {
        const productsOfParams = products ? getProductsFromProducts(products) : getProductsFromModes(modes ?? []);
        return await client.nearby({
            type: 'location',
            latitude: latitude,
            longitude: longitude
        }, { results: 200, distance, products: productsOfParams, subStops: false, linesOfStops: true });
    }

    const isLocalProduct = (product?: string) => {
        return product === 'tram' || product === 'suburban' || product === 'subway';
    }

    const filterLine = (line: Line, modes: ReadonlyArray<string>, onlyLocalProducts: boolean) => {
        return modes.findIndex(m => m.toLocaleLowerCase() === line?.mode?.toString().toLocaleLowerCase()) >= 0
            && (isLocalProduct(line.product) ? onlyLocalProducts : !onlyLocalProducts);
    }

    const departures = async (station: string, modes: ReadonlyArray<string>, when: Date, onlyLocalProducts: boolean): Promise<ReadonlyArray<Alternative>> => {
        const locationsOfStation = await client.locations(station, { results: 1 });
        const duration = 120;
        const results = 20;
        console.log('station:', locationsOfStation[0].id, locationsOfStation[0].name);
        if (locationsOfStation[0].id) {
            let alternatives = await client.departures(locationsOfStation[0], { duration, when });
            alternatives = alternatives.filter(a => a.line && filterLine(a.line, modes, onlyLocalProducts));
            if (alternatives.length > results) {
                alternatives = alternatives.slice(0, results);
            }
            if (__DEV__) {
                for (const a of alternatives) {
                    console.log('alternative:', a);
                }
            }
            return alternatives;
        } else {
            return [];
        }
    }

    function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);  // deg2rad below
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg: number) {
        return deg * (Math.PI / 180)
    }

    function getDistanceFromFeaturesInKm(f0: Feature, f1: Feature): number {
        return getDistanceFromLatLonInKm(f0.geometry.coordinates[1], f0.geometry.coordinates[0], f1.geometry.coordinates[1], f1.geometry.coordinates[0]);
    }

    function distanceOfFeatureCollection(fc: createClient.FeatureCollection): number {
        return fc.features.map((v, i) => {
            if (i > 0) {
                return getDistanceFromFeaturesInKm(fc.features[i - 1], fc.features[i]);
            }
            else {
                return 0.0;
            }
        }).reduce((a, b) => a + b, 0);
    }

    function distanceOfFeatureCollectionSubset(from: number, to: number, fc: createClient.FeatureCollection): number {
        const latLonPoints =
            fc.features.slice(from, to + 1).map(f => { return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }; })

        return latLonPoints.map((v, i) => {
            if (i > 0) {
                const prev = latLonPoints[i - 1]
                const curr = latLonPoints[i]
                return getDistanceFromLatLonInKm(prev.lat, prev.lon, curr.lat, curr.lon);
            }
            else {
                return 0.0;
            }
        }).reduce((a, b) => a + b, 0);
    }

    function distanceOfLeg(l: Leg): number {
        const dist = l.polyline ? distanceOfFeatureCollection(l.polyline) : 0.0;
        return parseFloat(dist.toFixed(0));
    }

    function distanceOfJourney(j: Journey): number {
        const dist = j.legs.map(distanceOfLeg).reduce((a, b) => a + b, 0);
        return parseFloat(dist.toFixed(0));
    }

    const distance = (lat1: number, lon1: number, lat2: number, lon2: number, unit: string) => {
        if ((lat1 === lat2) && (lon1 === lon2)) {
            return 0;
        }
        else {
            const radlat1 = Math.PI * lat1 / 180;
            const radlat2 = Math.PI * lat2 / 180;
            const theta = lon1 - lon2;
            const radtheta = Math.PI * theta / 180;
            let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
            if (unit === "K") { dist = dist * 1.609344 }
            if (unit === "N") { dist = dist * 0.8684 }
            return dist;
        }
    }

    const coordinatesDistance = (lat: number, lon: number, coordinates: number[], maxDist: number): boolean => {

        if (coordinates.length === 2) {
            const dist = distance(lat, lon, coordinates[1], coordinates[0], 'K')
            return dist <= maxDist;
        } else {
            return false;
        }
    }

    interface IndexedStop {
        index: number;
        stop: Stop;
    }

    const findStops = (fc: FeatureCollection): IndexedStop[] => {
        return fc.features
            .map((f, i) => { return { index: i, maybeStop: f.properties && (<Stop>f.properties).type && (<Stop>f.properties).type.toLowerCase() === 'stop' ? <Stop>f.properties : undefined }; })
            .filter(c => c.maybeStop)
            .map(c => { return { index: c.index, stop: <Stop>c.maybeStop }; });
    }

    const findIndex = (lat: number, lon: number, fc: FeatureCollection, maxDist: number) => {
        const found = fc.features
            .map((f, i) => { return { index: i, found: coordinatesDistance(lat, lon, f.geometry.coordinates, maxDist) }; })
            .filter(c => c.found);
        return found.length > 0 ? found[0].index : undefined;
    }

    const stopsInFeatureCollectionSubset = async (fromI: number, toI: number, fc: FeatureCollection, stopsInFc: IndexedStop[], products?: Products): Promise<undefined> => {
        if (fc.features.length < toI + 1) return;

        const fromS = <Stop>(fc.features[fromI].properties);
        const toS = <Stop>(fc.features[toI].properties);
        if (fromS.name === toS.name) return;

        const from = fromS.location;
        const to = toS.location;

        if (from && to && from.latitude && from.longitude && to.latitude && to.longitude) {
            const coordinates = fc.features[Math.floor(fromI + (toI - fromI) / 2)].geometry.coordinates;
            const center = { type: 'location', latitude: coordinates[1], longitude: coordinates[0] };

            if (center.latitude && center.longitude) {
                const dist = distanceOfFeatureCollectionSubset(fromI, toI, fc);
                const result = await nearby(center.latitude, center.longitude, dist * 2 * 1000, ["train"], products)
                console.log('nearby.result.length:', result.length, fromS.name, toS.name)
                result.forEach(s => {
                    if (isStop(s)) {
                        const found = stopsInFc.find(sif => sif.stop.id === s.id)
                        if (found) {
                            found.stop.lines = s.lines;
                        } else {
                            const index = s.location && s.location?.latitude && s.location?.longitude ? findIndex(s.location?.latitude, s.location?.longitude, fc, 0.2) : undefined;
                            if (index && !(<Stop>fc.features[index].properties)["type"]) {
                                fc.features[index].properties = s;
                            }
                        }
                    }
                });
            }
        }
    }

    const filterLines = (lines?: readonly Line[]): string[] => {
        return lines
            ? lines?.filter(l => l.name && l.mode?.toString().toLowerCase() === 'train' && !l.name?.startsWith('Bus') && !l.name?.startsWith('S')).map(l => l.name ?? '')
            : [];
    }

    const stopsInFeatureCollection = async (fc0: FeatureCollection, stopsInLeg: Stop[], products?: Products): Promise<Stop[]> => {
        if (!fc0 || fc0.features.length < 2) return [];

        const fc: FeatureCollection = JSON.parse(JSON.stringify(fc0));

        const stopsInFcOrig = findStops(fc);
        stopsInLeg.forEach(s => {
            if (stopsInFcOrig.find(sFc => sFc.stop?.name === s.name) === undefined) {
                const index = s.location && s.location?.latitude && s.location?.longitude ? findIndex(s.location?.latitude, s.location?.longitude, fc, 0.1) : undefined;
                if (index && fc.features[index].properties !== undefined && fc.features[index].properties !== {}) {
                    fc.features[index].properties = s;
                }
            }
        })

        const stopsInFcOfLeg = findStops(fc);
        if (stopsInFcOfLeg.length > 1) {
            let from = stopsInFcOfLeg[0]
            for (const curr of stopsInFcOfLeg) {
                if (from.index < curr.index) {
                    await stopsInFeatureCollectionSubset(from.index, curr.index, fc, stopsInFcOfLeg, products);
                    from = curr;
                }
            }
            const foundStopsInFc = findStops(fc);

            let dist = 0;
            fc.features.forEach((v, i) => {
                if (i > 0) {
                    dist = dist + getDistanceFromFeaturesInKm(fc.features[i - 1], fc.features[i]);

                    const foundStopInFc = foundStopsInFc.find(f => f.index === i);
                    if (foundStopInFc) {
                        foundStopInFc.stop.distance = dist;
                    }
                }
            });

            return foundStopsInFc.filter(si => stopsInFcOfLeg.find(sif => sif.stop.id === si.stop.id) || (!si.stop.station && filterLines(si.stop.lines).length > 0)).map(s => s.stop);
        }
        return [];
    }

    return { journeys, locations, nearby, departures, trip, tripOfLeg, stopssOfJourney, radar, journeyInfo, isStop, isLocation, getLocation, distanceOfJourney, distanceOfLeg };
}