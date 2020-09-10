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

import { HafasClient, Journey, Leg, Line, Location, Station, Stop, StopOver, Trip, Alternative, Products } from 'hafas-client';

const choose = (p: string): createClient.Profile => {
    p = p + 'Profile';
    switch (p) {
        case 'bvgProfile': return bvgProfile;
        case 'cflProfile': return cflProfile;
        case 'cmtaProfile': return cmtaProfile;
        case 'dbProfile': return dbProfile;
        case 'dbbusradarnrwProfile': return dbbusradarnrwProfile;
        case 'hvvProfile': return hvvProfile;
        case 'insaProfile': return insaProfile;
        case 'invgProfile': return invgProfile;
        case 'nahshProfile': return nahshProfile;
        case 'nvvProfile': return nvvProfile;
        case 'oebbProfile': return oebbProfile;
        case 'pkpProfile': return pkpProfile;
        case 'rmvProfile': return rmvProfile;
        case 'rsagProfile': return rsagProfile;
        case 'saarfahrplanProfile': return saarfahrplanProfile;
        case 'sbahnmuenchenProfile': return sbahnmuenchenProfile;
        // case 'sncbProfile': return sncbProfile;
        case 'svvProfile': return svvProfile;
        case 'vbbProfile': return vbbProfile;
        case 'vbnProfile': return vbnProfile;
        case 'vmtProfile': return vmtProfile;
        case 'vsnProfile': return vsnProfile;
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
    origin: Station | Stop,
    originName: string,
    originDeparture: string,
    originLocation?: Location,
    destination: Station | Stop,
    destinationName: string,
    destinationArrival: string,
    destinationLocation?: Location,
    countLegs: number,
    plannedDeparture: string,
    plannedArrival: string,
    reachable?: boolean,
    cancelled?: boolean,
    changes: number
}

export interface Hafas {
    journeys: (from: string, to: string, results: number, departure?: Date | undefined, via?: string, transferTime?: number, modes?: string[]) => Promise<ReadonlyArray<Journey>>,
    locations: (from: string, results: number) => Promise<ReadonlyArray<Station | Stop | Location>>,
    departures: (station: string, modes: ReadonlyArray<string>, when: Date, onlyLocalProducts: boolean) => Promise<ReadonlyArray<Alternative>>,
    trip: (tripId: string) => Promise<Trip>,
    stopssOfJourney: (journey: Journey | JourneyInfo, modes: ReadonlyArray<string>) => Promise<Stop[]>,
    journeyInfo: (journey: Journey) => JourneyInfo,
    isStop: (s: Station | Stop | Location) => s is Stop,
    isLocation: (s: Station | Stop | Location) => s is Location
}

export function hafas(profileName: string): Hafas {
    console.log('createClient, profile: ', profileName);
    const profile = choose(profileName);
    const client: HafasClient = createClient(profile, 'my-awesome-program')

    const journeyInfo = (journey: Journey): JourneyInfo => {
        const defaultDate = new Date();
        const indexFrom = 0;
        const indexTo = journey.legs.length - 1;
        const origin = journey.legs[indexFrom].origin;
        const originName = journey.legs[indexFrom].origin.name ?? "";
        const originLocation = journey.legs[indexFrom].origin.location;
        const originDeparture = journey.legs[indexFrom].departure ?? defaultDate.toISOString();
        const destination = journey.legs[indexTo].destination;
        const destinationName = journey.legs[indexTo].destination.name ?? "";
        const destinationLocation = journey.legs[indexTo].destination.location;
        const destinationArrival = journey.legs[indexTo].arrival ?? defaultDate.toISOString();
        const legs = journey.legs.filter(leg => leg?.line);
        const plannedDeparture = journey.legs[indexFrom].plannedDeparture ?? "";
        const plannedArrival = journey.legs[indexTo].plannedArrival ?? "";
        const reachable = journey.legs.every(item => item.reachable || item.walking);
        const cancelled = journey.legs.some(item => item.cancelled);
        let changes = journey.legs.filter(leg => leg?.line).length;
        changes = changes > 0 ? changes - 1 : 0;

        return {
            type: 'journeyinfo', legs, id: originName + '+' + destinationName + '+' + originDeparture + '+' + destinationArrival,
            origin, originName, originDeparture, originLocation,
            destination, destinationName, destinationArrival, destinationLocation,
            countLegs: journey.legs.length,
            plannedDeparture, plannedArrival,
            reachable, cancelled, changes
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

    const stopoversOnLeg = (t: Trip, origin: Station | Stop, destination: Station | Stop): StopOver[] => {
        const from = t.stopovers?.findIndex(stopover => origin.id === stopover.stop.id);
        if (from === -1) return [];
        const to = t.stopovers?.findIndex(stopover => destination.id === stopover.stop.id, from);
        if (to === -1) return [];
        return t.stopovers && to ? t.stopovers.slice(from, to + 1) : [];
    }

    const stopssOfLeg = async (leg: Leg, modes: ReadonlyArray<string>) => {
        const t = await tripOfLeg(leg);
        if (t.line && modes.findIndex(m => m === t.line?.mode?.toString()) >= 0) {
            return stopoversOnLeg(t, leg.origin, leg.destination)
                .filter(stopover => isStop(stopover.stop))
                .map<Stop>(stopover => stopover.stop as Stop);
        } else {
            return [];
        }

    }

    const stopssOfJourney = async (journey: Journey | JourneyInfo, modes: ReadonlyArray<string>) => {
        let stops: Stop[] = [];
        for (const leg of journey.legs) {
            stops = stops.concat(await stopssOfLeg(leg, modes));
        }
        return stops;
    }

    function isStop(s: Station | Stop | Location): s is Stop {
        return s.type === 'stop';
    }

    function isLocation(s: Station | Stop | Location): s is Location {
        return s.type === 'location';
    }

    function getProducts(modes: string[]): Products {
        const products: Products = {}
        profile.products.forEach(p => {
            products[p.id] = modes.length === 0 || modes.find(m => p.mode === m) !== undefined;
        })
        return products;
    }

    const journeys = async (from: string, to: string, results: number, departure?: Date, via?: string, transferTime?: number, modes?: string[]): Promise<ReadonlyArray<Journey>> => {
        if (!transferTime) transferTime = 10;
        const locationsFrom = await client.locations(from, { results: 1 });
        console.log('from:', locationsFrom[0].id, locationsFrom[0].name);
        const locationsTo = await client.locations(to, { results: 1 });
        console.log('to:', locationsTo[0].id, locationsTo[0].name);
        if (locationsFrom[0].id && locationsTo[0].id) {
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
                const res = await client.journeys(locationsFrom[0].id, locationsTo[0].id, { products, results, departure, via: viaId, transferTime });
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

    const isLocalProduct = (product?: string) => {
        return product === 'tram' || product === 'suburban' || product === 'subway';
    }

    const filterLine = (line: Line, modes: ReadonlyArray<string>, onlyLocalProducts: boolean) => {
        return modes.findIndex(m => m === line?.mode?.toString()) >= 0
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

    return { journeys, locations, departures, trip, stopssOfJourney, journeyInfo, isStop, isLocation };
}