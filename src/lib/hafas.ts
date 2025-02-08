import { createClient, Feature, Profile } from 'hafas-client';

import { profile as bvgProfile } from 'hafas-client/p/bvg/index.js';
import { profile as oebbProfile } from 'hafas-client/p/oebb/index.js';
import { profile as rejseplanenProfile } from 'hafas-client/p/rejseplanen/index.js';
import { profile as vbbProfile } from 'hafas-client/p/vbb/index.js';

import { createClient as createVendoClient } from 'db-vendo-client';
import { profile as dbProfile } from 'db-vendo-client/p/dbnav/index.js';

import { TripsByNameOptions, TripsWithRealtimeData, FeatureCollection, Journey, Leg, Line, Location, Station, Stop, StopOver, Trip, Alternative, Products, Status, Movement } from 'fs-hafas-client/hafas-client.js';
import { fshafas } from "fs-hafas-client";
import { profiles } from "fs-hafas-profiles";
import { distance } from './distance';

// eslint-disable-next-line @typescript-eslint/no-var-requires
import geolib from 'geolib';

const chooseClient = (p: string, profile: Profile) => {
	if (p === 'db') {
		return createVendoClient(profile, 'agent');
	} else if (p.endsWith('-fsharp')) {
		return fshafas.createClient(profile);
	} else return createClient(profile, 'agent');
}

const chooseProfile = (p: string): Profile => {
	switch (p) {
		case 'bvg': return bvgProfile;
		case 'db': return dbProfile;
		case 'oebb': return oebbProfile;
		case 'rejseplanen': return rejseplanenProfile;
		case 'vbb': return vbbProfile;
		case 'bvg-fsharp': return profiles.getProfile('bvg');
		case 'db-fsharp': return profiles.getProfile('db');
		case 'mobilnrw-fsharp': return profiles.getProfile('mobilnrw');
		case 'oebb-fsharp': return profiles.getProfile('oebb');
		case 'rejseplanen-fsharp': return profiles.getProfile('rejseplanen');
		default: {
			console.log('choose default');
			return dbProfile;
		}
	}
};

export interface JourneyParams {
	bahncardDiscount: number;
	bahncardClass: number;
	age: number,
	results: number,
	firstClass: boolean;
	transfers: number;
	transferTime: number;
	regional: boolean;
}

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
	distance: number,
	price?: string,
	refreshToken?: string
}

export interface Hafas {
	journeys: (from: string | Location, to: string | Location, journeyParams: JourneyParams, departure?: Date | undefined, via?: string, modes?: string[]) => Promise<ReadonlyArray<Journey>>,
	refreshJourney: (refreshToken: string) => Promise<Journey | undefined>,
	locations: (from: string, results: number) => Promise<ReadonlyArray<Station | Stop | Location>>,
	stopsOfIds: (ids: string[], preferredUicrefs: number[]) => Promise<ReadonlyArray<Stop>>,
	nearby: (latitude: number, longitude: number, distance: number, modes?: string[], products?: Products) => Promise<ReadonlyArray<Station | Stop | Location>>,
	arrivals: (station: string, modes: ReadonlyArray<string>, when: Date, onlyLocalProducts: boolean) => Promise<ReadonlyArray<Alternative>>,
	departures: (station: string, modes: ReadonlyArray<string>, when: Date, onlyLocalProducts: boolean) => Promise<ReadonlyArray<Alternative>>,
	trip: (tripId?: string) => Promise<Trip>,
	tripsByName: (productName: string, lineName: string, operatorNames?: string[], today?: boolean) => Promise<TripsWithRealtimeData>;
	tripOfLeg: (tripId: string, origin: Station | Stop | Location | undefined, destination: Station | Stop | Location | undefined, fc?: FeatureCollection) => Promise<Trip>,
	stopssOfJourney: (journey: Journey | JourneyInfo, modes: ReadonlyArray<string>, useTransits?: boolean, nationalProductsOfStops?: boolean) => Promise<Stop[]>,
	radar: (loc: Location, duration?: number) => Promise<ReadonlyArray<Movement>>,
	journeyInfo: (journey: Journey) => JourneyInfo,
	getLocation: (s: Station | Stop | Location | undefined) => Location | undefined,
	distanceOfJourney: (j: Journey) => number,
	distanceOfLeg: (l: Leg) => number
}

export function isStation(s: Station | Stop | Location | undefined): s is Station {
	return 'object' === typeof s && s.type === 'station';
}

export function isStop(s: Station | Stop | Location | undefined): s is Stop {
	return 'object' === typeof s && s.type === 'stop';
}

export function isLocation(s: string | Station | Stop | Location | undefined): s is Location {
	return 'object' === typeof s && s.type === 'location';
}

export function isStop4Routes(stop: Stop): boolean {
	return !!stop.products?.nationalExpress || !!stop.products?.national;
}

export function isStopover4Routes(stopover: StopOver): boolean {
	return isStop(stopover.stop)
		&& !stopover.cancelled && (!!stopover.plannedDeparture || !!stopover.plannedArrival
			// conditions for transit stations
			|| isStop4Routes(stopover.stop))
}

export function stopovers2Locations4Routes(stopovers: readonly StopOver[]): Location[] {
	let locations: Location[] = []
	stopovers.forEach(stopover => {
		if (isStop(stopover.stop) && isStopover4Routes(stopover)) {
			locations.push({
				"type": "location", "id": stopover.stop.id,
				"name": stopover.stop.name, "latitude": stopover.stop.location?.latitude, "longitude": stopover.stop.location?.longitude
			});
		} else if (isStation(stopover.stop)) {
			locations.push({
				"type": "location", "id": stopover.stop.id,
				"name": stopover.stop.name, "latitude": stopover.stop.location?.latitude, "longitude": stopover.stop.location?.longitude
			});
		}
	})

	return locations;
}

export function legs2Locations4Routes(legs: Leg[]): Location[] {
	let locations: Location[] = []
	legs.forEach(leg => {
		leg.stopovers?.forEach(stopover => {
			if (isStop(stopover.stop) && isStopover4Routes(stopover)) {
				locations.push({
					"type": "location", "id": stopover.stop.id,
					"name": stopover.stop.name, "latitude": stopover.stop.location?.latitude, "longitude": stopover.stop.location?.longitude
				});
			} else if (isStation(stopover.stop)) {
				locations.push({
					"type": "location", "id": stopover.stop.id,
					"name": stopover.stop.name, "latitude": stopover.stop.location?.latitude, "longitude": stopover.stop.location?.longitude
				});
			}
		})
	})

	return locations;
}

export function hasTrainformation(line?: Line, departure?: string): boolean {
	if (departure) {
		const dt = new Date(departure);
		const today = new Date(Date.now());
		if (dt.getFullYear() != today.getFullYear()
			|| dt.getMonth() != today.getMonth()
			|| dt.getDate() != today.getDate())
			return false;
		else {
			return !!line && !!line.product && line.product?.startsWith('national')
				&& !!line.productName && (line.productName?.startsWith('IC') || line.productName?.startsWith('EC'));
		}
	} else {
		return false;
	}
}

export function getLocation(s: Station | Stop | Location | undefined): Location | undefined {
	if (isStop(s)) return s.location
	else if (isStation(s)) return s.location
	else if (isLocation(s)) return s
	else return undefined;
}

export function hafas(profileName: string): Hafas {
	console.log('createClient, profile: ', profileName);
	const profile = chooseProfile(profileName);
	const client = chooseClient(profileName, profile)

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
		const plannedDeparture = journey.legs[indexFrom].plannedDeparture ?? (journey.legs[indexFrom].walking ? (journey.legs[indexFrom + 1].plannedDeparture ?? "") : "");
		const plannedArrival = journey.legs[indexTo].plannedArrival ?? (journey.legs[indexTo].walking ? (journey.legs[indexTo - 1].plannedArrival ?? "") : "");
		const reachable =
			journey.legs.every(item => item.reachable === undefined) ? undefined :
				journey.legs.every(item => item.reachable || item.walking || item.reachable === undefined);
		const cancelled =
			journey.legs.every(item => item.cancelled === undefined) ? undefined :
				journey.legs.some(item => item.cancelled);
		let changes = journey.legs.filter(leg => leg?.line).length;
		const lineNames = journey.legs.reduce((acc, leg) => {
			const name = leg.line?.name ?? '';
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

		const price = journey.price && journey.price.amount > 0 ? journey.price.amount?.toFixed(2) + ' ' + journey.price.currency : undefined;
		return {
			type: 'journeyinfo', legs, id: journey.refreshToken ?? originName + '+' + destinationName + '+' + originDeparture + '+' + destinationArrival + '+' + legs[0].tripId,
			origin, originName, originDeparture, originLocation,
			destination, destinationName, destinationArrival, destinationLocation,
			countLegs: journey.legs.length,
			plannedDeparture, plannedArrival,
			reachable, cancelled,
			informationAvailable: statusRemarks && statusRemarks.length > 0 ? true : false, statusRemarks: statusRemarks ? statusRemarks : [],
			changes, lineNames, distance: distanceOfJourney(journey), price, refreshToken: journey.refreshToken
		};
	}

	const trip = async (tripId?: string): Promise<Trip> => {
		if (client.trip && tripId) {
			const { trip } = await client.trip(tripId, {});
			return trip;
		} else {
			return Promise.reject();
		}
	}

	const tripsByName = async (productName: string, lineName: string, operatorNames?: string[], today?: boolean): Promise<TripsWithRealtimeData> => {
		if (client.tripsByName) {
			const options: TripsByNameOptions = { lineName, operatorNames }
			if (!!today) {
				const fromWhen = new Date();
				fromWhen.setHours(4);
				fromWhen.setMinutes(0);
				fromWhen.setSeconds(0);
				options.fromWhen = fromWhen;
				const untilWhen = new Date();
				untilWhen.setHours(22);
				untilWhen.setMinutes(0);
				untilWhen.setSeconds(0);
				options.untilWhen = untilWhen;

			} else {
				options.when = new Date();
			}
			console.log('options', options);
			const trips = await client.tripsByName(productName, options);
			return trips;
		} else {
			return Promise.reject();
		}
	}

	const tripOfLeg = async (tripId: string, origin: Station | Stop | Location | undefined, destination: Station | Stop | Location | undefined, fc?: FeatureCollection): Promise<Trip> => {
		if (client.trip && tripId) {
			const { trip }: { trip: Trip } = await client.trip(tripId, {});

			const stopovers = stopoversOnLeg(trip, origin, destination)
				.filter(stopover => stopover.stop && (isStop(stopover.stop) || isStation(stopover.stop)));
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
				if (stopoversInFeatureCollection.length > 0) {
					const plannedDeparture = stopoversInFeatureCollection[0].plannedDeparture;
					const plannedArrival = stopoversInFeatureCollection[stopoversInFeatureCollection.length - 1].plannedArrival;
					console.log('stopoversInFeatureCollection.length:', stopoversInFeatureCollection.length);
					return { id: trip.id, origin: trip.origin, destination: trip.destination, currentLocation: trip.currentLocation, line: trip.line, plannedDeparture, plannedArrival, stopovers: stopoversInFeatureCollection };
				} else {
					const plannedDeparture = stopovers[0].plannedDeparture;
					const plannedArrival = stopovers[stopovers.length - 1].plannedArrival;
					return { id: trip.id, origin: trip.origin, destination: trip.destination, currentLocation: trip.currentLocation, line: trip.line, plannedDeparture, plannedArrival, stopovers };
				}
			} else if (stopovers.length > 0) {
				const plannedDeparture = stopovers[0].plannedDeparture;
				const plannedArrival = stopovers[stopovers.length - 1].plannedArrival;
				console.log('stopovers.length:', stopovers.length);
				return { id: trip.id, origin: trip.origin, destination: trip.destination, currentLocation: trip.currentLocation, line: trip.line, plannedDeparture, plannedArrival, stopovers };
			} else {
				return Promise.reject();
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
		if (t.line && modes.findIndex(m => t.line?.mode === undefined || m === t.line?.mode?.toString().toLowerCase()) >= 0) {
			return stopoversOnLeg(t, leg.origin, leg.destination)
				.filter(stopover => !stopover.cancelled && stopover.stop && (isStop(stopover.stop) || isStation(stopover.stop)))
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

	function getProductsFromModes(modes: string[], regional?: boolean): Products {
		const products: Products = {}
		profile.products.forEach(p => {
			products[p.id] = modes.length === 0 || modes.find(m => unionToString(p.mode) === m.toLowerCase()) !== undefined;
			if (regional && products[p.id]) {
				products[p.id] = p.id.toLowerCase().indexOf('national') < 0 && p.id.toLowerCase().indexOf('regionalexp') < 0;
			}
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

	interface HafasError {
		isHafasError: boolean;
		hafasErrorCode: string
	}

	const journeys = async (from: string | Location, to: string | Location, journeyParams: JourneyParams, departure?: Date, via?: string, modes?: string[]): Promise<ReadonlyArray<Journey>> => {
		if (!journeyParams.transferTime) journeyParams.transferTime = 10;
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
				console.log('departure: ', departure);
				const products = getProductsFromModes(modes ?? [], journeyParams.regional);
				const loyaltyCard = journeyParams.bahncardDiscount > 0 ? { type: 'Bahncard', discount: journeyParams.bahncardDiscount, class: journeyParams.bahncardClass } : undefined; // todo: per parameter
				const res = await client.journeys(locationsFrom[0], locationsTo[0], { products, results: journeyParams.results, departure, via: viaId, transfers: journeyParams.transfers, transferTime: journeyParams.transferTime, polylines: true, stopovers: true, age: journeyParams.age, firstClass: journeyParams.firstClass, loyaltyCard });
				return res.journeys ?? [];
			} catch (e) {
				const error = e as Error;
				const isHafasError = (e as HafasError).isHafasError;
				if (isHafasError) {
					console.log(error.message, ', hafasErrorCode: ', (e as HafasError).hafasErrorCode);
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

	const refreshJourney = async (refreshToken: string): Promise<Journey | undefined> => {
		if (client.refreshJourney) {
			const j = await client.refreshJourney(refreshToken, { stopovers: true });

			return j.journey;
		} else { return undefined }
	}

	const locations = async (from: string, results: number): Promise<ReadonlyArray<Station | Stop | Location>> => {
		return await client.locations(from, { results });
	}

	const addStop = async (s: string, preferredUicrefs: number[], stops: Stop[]) => {
		const locs = await locations(s, 2);
		if (locs.length > 1) {
			if (isStop(locs[0]) && isStop(locs[1])) {
				const id = Number(locs[0].id);
				if (!preferredUicrefs.find((uicref => uicref === id))) stops.push(locs[1]);
				else stops.push(locs[0]);
			}
		} else if (locs.length > 0) {
			if (isStop(locs[0])) stops.push(locs[0]);
		}
	}

	const stopsOfIds = async (ids: string[], preferredUicrefs: number[]): Promise<ReadonlyArray<Stop>> => {
		const stops: Stop[] = [];
		for (let n = 0; n < ids.length; n++) {
			await addStop(ids[n], preferredUicrefs, stops);
		}

		return stops;
	}

	const radar = async (loc: Location, duration?: number): Promise<ReadonlyArray<Movement>> => {
		if (client.radar && loc.latitude && loc.longitude) {
			const [southwest, northeast] = geolib.getBoundsOfDistance(
				{ latitude: loc.latitude, longitude: loc.longitude },
				2000
			);
			console.log('southwest:', southwest, ', northeast:', northeast);
			const radar = await client.radar({
				north: northeast.latitude,
				west: southwest.longitude,
				south: southwest.latitude,
				east: northeast.longitude
			}, { results: 20, duration: duration });
			return radar.movements ?? [];
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
		console.log('departures station:', locationsOfStation[0].id, locationsOfStation[0].name);
		if (locationsOfStation[0].id) {
			const departures = await client.departures(locationsOfStation[0], { duration, when });
			let alternatives = departures.departures.filter(a => a.line && filterLine(a.line, modes, onlyLocalProducts));
			if (alternatives.length > results) {
				alternatives = alternatives.slice(0, results);
			}
			return alternatives;
		} else {
			return [];
		}
	}

	const arrivals = async (station: string, modes: ReadonlyArray<string>, when: Date, onlyLocalProducts: boolean): Promise<ReadonlyArray<Alternative>> => {
		const locationsOfStation = await client.locations(station, { results: 1 });
		const duration = 120;
		const results = 50;
		console.log('arrivals station:', locationsOfStation[0].id, locationsOfStation[0].name);
		if (locationsOfStation[0].id) {
			const arrivals = await client.arrivals(locationsOfStation[0], { duration, when });
			console.log('arrivals', arrivals.arrivals.length);
			let alternatives = arrivals.arrivals.filter(a => a.line && filterLine(a.line, modes, onlyLocalProducts));
			if (alternatives.length > results) {
				alternatives = alternatives.slice(0, results);
			}
			return alternatives;
		} else {
			return [];
		}
	}

	function getDistanceFromFeaturesInKm(f0: Feature, f1: Feature): number {
		return distance(f0.geometry.coordinates[1], f0.geometry.coordinates[0], f1.geometry.coordinates[1], f1.geometry.coordinates[0]);
	}

	function distanceOfFeatureCollection(fc: FeatureCollection): number {
		return fc.features.map((v, i) => {
			if (i > 0) {
				return getDistanceFromFeaturesInKm(fc.features[i - 1], fc.features[i]);
			}
			else {
				return 0.0;
			}
		}).reduce((a, b) => a + b, 0);
	}

	function distanceOfFeatureCollectionSubset(from: number, to: number, fc: FeatureCollection): number {
		const latLonPoints =
			fc.features.slice(from, to + 1).map(f => { return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }; })

		return latLonPoints.map((v, i) => {
			if (i > 0) {
				const prev = latLonPoints[i - 1]
				const curr = latLonPoints[i]
				return distance(prev.lat, prev.lon, curr.lat, curr.lon);
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

	const coordinatesDistance = (lat: number, lon: number, coordinates: number[], maxDist: number): boolean => {

		if (coordinates.length === 2) {
			const dist = distance(lat, lon, coordinates[1], coordinates[0])
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

		try {
			const fc: FeatureCollection = JSON.parse(JSON.stringify(fc0));

			const stopsInFcOrig = findStops(fc);
			stopsInLeg.forEach(s => {
				if (stopsInFcOrig.find(sFc => sFc.stop?.name === s.name) === undefined) {
					const index = s.location && s.location?.latitude && s.location?.longitude ? findIndex(s.location?.latitude, s.location?.longitude, fc, 0.1) : undefined;
					if (index && fc.features[index].properties !== undefined) {
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
			else {
				return [];
			}
		} catch (e) {
			return [];
		}
	}

	return { journeys, refreshJourney, locations, stopsOfIds, nearby, arrivals, departures, tripsByName, trip, tripOfLeg, stopssOfJourney, radar, journeyInfo, getLocation, distanceOfJourney, distanceOfLeg };
}