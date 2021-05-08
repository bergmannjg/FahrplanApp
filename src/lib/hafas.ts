import createClient from 'hafas-client';

import bvgProfile from 'hafas-client/p/bvg';
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

import { Journey, Leg, Line, Location, Station, Stop, StopOver, Trip, Alternative, Products, Status, Movement } from 'hafas-client';
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
    nearby: (latitude: number, longitude: number, distance: number, modes?: string[]) => Promise<ReadonlyArray<Station | Stop | Location>>,
    departures: (station: string, modes: ReadonlyArray<string>, when: Date, onlyLocalProducts: boolean) => Promise<ReadonlyArray<Alternative>>,
    trip: (tripId: string) => Promise<Trip>,
    stopssOfJourney: (journey: Journey | JourneyInfo, modes: ReadonlyArray<string>) => Promise<Stop[]>,
    radar: (loc: Location) => Promise<ReadonlyArray<Movement>>,
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

export function getLocation(s: Station | Stop | Location | undefined): Location | undefined {
    if (isStop(s)) return s.location
    else if (isLocation(s)) return s
    else return undefined;
}

export function hafas(profileName: string): Hafas {
    console.log('createClient, profile: ', profileName);
    const profile = chooseProfile(profileName);
    const client = chooseClient(profileName, profile)

    if (__DEV__ && profileName === 'db-fsharp') {
        fshafas.setDebug();
    }

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

    const tripOfLeg = async (leg: Leg): Promise<Trip> => {
        if (leg.tripId && leg?.line && client.trip) {
            const t: Trip = await client.trip(leg.tripId, leg.line.name != null ? leg.line.name : "ignored", {});
            return t;
        } else {
            return Promise.reject();
        }
    }

    const trip = async (tripId: string): Promise<Trip> => {
        if (client.trip) {
            const t: Trip = await client.trip(tripId, "ignored", {});
            return t;
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
        const t = await tripOfLeg(leg);
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

    const stopssOfJourney = async (journey: Journey | JourneyInfo, modes: ReadonlyArray<string>) => {
        let stops: Stop[] = [];
        for (const leg of journey.legs) {
            stops = stops.concat(await stopssOfLeg(leg, modes));
        }
        return stops;
    }

    function getLocation(s: Station | Stop | Location | undefined): Location | undefined {
        if (isStop(s)) return s.location
        else if (isLocation(s)) return s
        else return undefined;
    }

    function getProducts(modes: string[]): Products {
        const products: Products = {}
        profile.products.forEach(p => {
            products[p.id] = modes.length === 0 || modes.find(m => unionToString(p.mode) === m.toLowerCase()) !== undefined;
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
                console.log('via:', viaFrom[0].id, locationsTo[0].name);
                if (viaFrom[0].id) {
                    viaId = viaFrom[0].id;
                }
            }
            try {
                const products = getProducts(modes ?? []);
                const res = await client.journeys(locationsFrom[0], locationsTo[0], { products, results, departure, via: viaId, transferTime, polylines: true });
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

    const radar = async (loc: Location): Promise<ReadonlyArray<Movement>> => {
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
            }, { results: 20, duration: 600 });
        } else {
            return Promise.reject();
        }
    }

    const nearby = async (latitude: number, longitude: number, distance: number, modes?: string[]): Promise<ReadonlyArray<Station | Stop | Location>> => {
        const products = getProducts(modes ?? []);
        return await client.nearby({
            type: 'location',
            latitude: latitude,
            longitude: longitude
        }, { results: 20, distance, products });
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
            let alternatives = await client.departures(locationsOfStation[0].id, { duration, when });
            alternatives = alternatives.filter(a => a.line && filterLine(a.line, modes, onlyLocalProducts));
            if (alternatives.length > results) {
                alternatives = alternatives.slice(0, results);
            }
            for (const a of alternatives) {
                console.log('alternative:', a);
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

    function distanceOfFeatureCollection(fc: createClient.FeatureCollection): number {
        const latLonPoints =
            fc.features.map(f => { return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }; })

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

    return { journeys, locations, nearby, departures, trip, stopssOfJourney, radar, journeyInfo, isStop, isLocation, getLocation, distanceOfJourney, distanceOfLeg };
}