import { JourneyInfo } from '../lib/hafas';
import { Location, Trip, Alternative, Stop } from 'hafas-client';

export interface HomeScreenParams {
    clientLib?: string;
    profile?: string,
    tripDetails?: boolean,
    date?: number,
    transferTime?: number,
    station?: string | Location
}

export interface OptionScreenParams {
    navigationParams: {
        clientLib: string,
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

export interface TrainformationScreenParams {
    fahrtNr: string;
    date: string;
}

export interface WagonimageScreenParams {
    title: string;
    image: string;
}

export interface ConnectionsScreenParams {
    date: number,
    station1: string | Location,
    station2: string | Location,
    via: string,
    tripDetails: boolean,
    transferTime: number,
    profile: string
}

export interface RadarScreenParams {
    profile: string
}

export interface NearbyScreenParams {
    distance: number,
    searchBusStops: boolean,
    profile: string
}

export interface BRouterScreenParams {
    titleSuffix?: string;
    isCar?: boolean;
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
    Radar: RadarScreenParams;
    Nearby: NearbyScreenParams;
    Journeyplan: JourneyplanScreenParams;
    Trainformation: TrainformationScreenParams;
    Wagonimage: WagonimageScreenParams;
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
