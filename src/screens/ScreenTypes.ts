import { Hafas, JourneyInfo } from '../lib/hafas';
import { Location, Trip, Alternative } from 'hafas-client';

export interface HomeScreenParams {
    profile?: string,
    tripDetails?: boolean,
    date?: Date
}

export interface OptionScreenParams {
    navigationParams: {
        profile: string,
        tripDetails: boolean,
    }
}

export interface DateTimeScreenParams {
    navigationParams: {
        date: Date,
        mode: 'date' | 'time' | 'datetime',
    }
}

export interface JourneyplanScreenParams {
    journey: JourneyInfo,
    tripDetails: boolean,
    client: Hafas
}

export interface ConnectionsScreenParams {
    date: Date,
    station1: string,
    station2: string,
    via: string,
    tripDetails: boolean,
    client: Hafas
}

export interface BRouterScreenParams {
    locations: Location[];
    isLongPress: boolean
}

export interface DepartureScreenParams {
    station: string,
    alternatives: ReadonlyArray<Alternative>,
    client: Hafas
}

export interface TripScreenParams {
    trip: Trip,
    client: Hafas
}

export interface OpenStreetMapParams {
    name: string,
    location: Location
}

export type MainStackParamList = {
    Home: HomeScreenParams;
    Connections: ConnectionsScreenParams;
    Journeyplan: JourneyplanScreenParams;
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
