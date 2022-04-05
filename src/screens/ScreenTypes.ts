import { JourneyInfo } from '../lib/hafas';
import { Location, Trip, Alternative, Stop, Line } from 'hafas-client';

const nortEastArrow = '\u2197';

export function asLinkText(s: string): string {
    return s + ' ' + nortEastArrow;
}

export interface HomeScreenParams {
    clientLib?: string;
    profile?: string,
    tripDetails?: boolean,
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
        mode: 'date' | 'time',
    }
}

export interface JourneyplanScreenParams {
    journey: JourneyInfo,
    tripDetails: boolean,
    profile: string
}

export interface RailwayRoutesOfTripScreenParams {
    profile: string;
    originName: string;
    destinationName: string;
    journeyInfo?: JourneyInfo;
    stops?: Stop[];
    tripDetails: boolean;
    compactifyPath: boolean;
}

export interface RailwayRouteScreenParams {
    railwayRouteNr: number
}

export interface TrainformationScreenParams {
    fahrtNr: string;
    date: string;
    location?: Location
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
    profile: string;
    duration: number;
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
    pois?: Location[];
    isLongPress: boolean;
    zoom?: number;
}

export interface WebViewScreenParams {
    url: string;
    title: string;
}

export interface DepartureScreenParams {
    station: string,
    date: number;
    profile: string
}

export interface TripScreenParams {
    trip: Trip,
    line?: Line;
    profile: string;
    showAsTransits?: boolean;
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
    WebView: WebViewScreenParams;
    OpenStreetMap: OpenStreetMapParams
};

export type RootStackParamList = {
    Main: undefined;
    Options: OptionScreenParams;
    DateTime: DateTimeScreenParams;
    ThirdPartyLicenses: undefined
};
