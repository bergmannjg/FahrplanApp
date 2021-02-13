import { JourneyInfo } from '../lib/hafas';
import { Location, Trip, Alternative, Stop } from 'hafas-client';

export interface HomeScreenParams {
    profile?: string,
    tripDetails?: boolean,
    date?: number,
    transferTime?: number
}

export interface OptionScreenParams {
    navigationParams: {
        profile: string,
        tripDetails: boolean,
        transferTime: number
    }
}

export interface DateTimeScreenParams {
    navigationParams: {
        date: number,
        mode: 'date' | 'time' | 'datetime',
    }
}

export interface JourneyplanScreenParams {
    journey: JourneyInfo,
    tripDetails: boolean,
    profile: string
}

export interface RailwayRoutesOfTripScreenParams {
    stops: Stop[]
}

export interface RailwayRouteScreenParams {
    railwayRouteNr: number
}

export interface ConnectionsScreenParams {
    date: number,
    station1: string,
    station2: string,
    via: string,
    tripDetails: boolean,
    transferTime: number,
    profile: string
}

export interface BRouterScreenParams {
    locations: Location[];
    isLongPress: boolean
}

export interface DepartureScreenParams {
    station: string,
    alternatives: ReadonlyArray<Alternative>,
    profile: string
}

export interface TripScreenParams {
    trip: Trip,
    profile: string
}

export interface OpenStreetMapParams {
    name: string,
    location: Location
}

export type MainStackParamList = {
    Home: HomeScreenParams;
    Connections: ConnectionsScreenParams;
    Journeyplan: JourneyplanScreenParams;
    RailwayRoutesOfTrip: RailwayRoutesOfTripScreenParams;
    RailwayRoute: RailwayRouteScreenParams;
    BRouter: BRouterScreenParams;
    Departures: DepartureScreenParams;
    Trip: TripScreenParams;
    OpenStreetMap: OpenStreetMapParams
};

export type RootStackParamList = {
    Main: undefined;
    Options: OptionScreenParams;
    DateTime: DateTimeScreenParams;
    ThirdPartyLicenses: undefined
};
