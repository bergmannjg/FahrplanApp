import { JourneyInfo, JourneyParams } from '../lib/hafas';
import { Location, Trip, Stop, Line } from 'hafas-client';

const nortEastArrow = '\u2197';

export function asLinkText(s: string): string {
    return s + ' ' + nortEastArrow;
}

export interface HomeScreenParams {
    clientLib?: string;
    profile?: string,
    tripDetails?: boolean,
    compactifyPath?: boolean,
    station?: string | Location,
    station2?: string,
    stationVia?: string,
    journeyParams?: JourneyParams
}

export interface OptionScreenParams {
    navigationParams: {
        clientLib: string,
        profile: string,
        tripDetails: boolean,
        compactifyPath: boolean,
    }
}

export interface JourneyOptionScreenParams {
    navigationParams: {
        journeyParams: JourneyParams
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
    compactifyPath: boolean;
    profile: string
}

export interface RailwayRoutesOfTripScreenParams {
    profile: string;
    originName: string;
    destinationName: string;
    stops?: Stop[];
    tripDetails: boolean;
    compactifyPath: boolean;
    useMaxSpeed: boolean;
}

export interface RailwayRouteScreenParams {
    railwayRouteNr: number;
    imcode: string;
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

export interface LineNetworkParams {
    line?: number;
    profile: string
}

export interface ConnectionsScreenParams {
    date: number,
    station1: string | Location,
    station2: string | Location,
    via: string,
    tripDetails: boolean,
    compactifyPath: boolean;
    profile: string,
    journeyParams: JourneyParams
}

export interface BestPriceConnectionsScreenParams {
    date: number,
    station1: string | Location,
    station2: string | Location,
    via: string,
    tripDetails: boolean,
    compactifyPath: boolean;
    profile: string,
    journeyParams: JourneyParams,
    days: number,
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
    LineNetwork: LineNetworkParams;
    BestPriceConnections: BestPriceConnectionsScreenParams;
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
    JourneyOptions: JourneyOptionScreenParams;
    DateTime: DateTimeScreenParams;
    ThirdPartyLicenses: undefined
};
