import { JourneyInfo, JourneyParams } from '../lib/hafas';
import { Location, Trip, Stop, Line } from 'hafas-client';

const nortEastArrow = '\u2197';

export function asLinkText(s: string): string {
    return s + ' ' + nortEastArrow;
}

export interface RInfSearchParams {
    textSearch: 'first exact match' | 'exact' | 'caseinsensitive' | 'regex';
    railwaRoutesAllItems: boolean;
}

export const rinfProfile = 'rinf/strecken';

export interface HomeScreenParams {
    clientLib?: string;
    profile?: string,
    tripDetails?: boolean,
    station?: string | Location,
    station2?: string,
    stationVia?: string,
    journeyParams?: JourneyParams,
    rinfSearchParams?: RInfSearchParams,
}

export interface OptionScreenParams {
    navigationParams: {
        clientLib: string,
        profile: string,
        tripDetails: boolean,
    }
}

export interface JourneyOptionScreenParams {
    profile: string,
    navigationParams: {
        journeyParams: JourneyParams
        rinfSearchParams: RInfSearchParams,
    }
}

export interface DateTimeScreenParams {
    navigationParams: {
        date: number,
        mode: 'date' | 'time',
    }
}

export interface JourneyplanScreenParams {
    journey?: JourneyInfo,
    refreshToken?: string;
    tripDetails: boolean,
    profile: string
}

export interface RailwayRoutesOfTripScreenParams {
    profile: string;
    originName: string;
    destinationName: string;
    stops?: Stop[];
    ids?: string[];
    tripDetails: boolean;
    useMaxSpeed: boolean;
}

export interface RailwayRouteScreenParams {
    railwayRouteNr: string;
    country: string;
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
    profile: string
}

export interface RailwayRouteNetworkParams {
    railwaRoutesAllItems: boolean;
}

export interface MyJourneysParams {
    tripDetails: boolean,
}

export interface ConnectionsScreenParams {
    date: number,
    station1: string | Location,
    station2: string | Location,
    via: string,
    tripDetails: boolean,
    profile: string,
    journeyParams: JourneyParams
}

export interface BestPriceConnectionsScreenParams {
    date: number,
    station1: string | Location,
    station2: string | Location,
    via: string,
    tripDetails: boolean,
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

export interface ArrivalScreenParams {
    station: string,
    date: number;
    profile: string
}

export interface DepartureScreenParams {
    station: string,
    date: number;
    profile: string
}

export interface TripsOfLineScreenParams {
    lineName: string;
    train: string;
    refreshToken?: string
    profile: string;
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
    RailwayRouteNetwork: RailwayRouteNetworkParams;
    MyJourneys: MyJourneysParams;
    BestPriceConnections: BestPriceConnectionsScreenParams;
    Radar: RadarScreenParams;
    Nearby: NearbyScreenParams;
    Journeyplan: JourneyplanScreenParams;
    Trainformation: TrainformationScreenParams;
    Wagonimage: WagonimageScreenParams;
    RailwayRoutesOfTrip: RailwayRoutesOfTripScreenParams;
    RailwayRoute: RailwayRouteScreenParams;
    BRouter: BRouterScreenParams;
    Arrivals: ArrivalScreenParams;
    Departures: DepartureScreenParams;
    TripsOfLine: TripsOfLineScreenParams;
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
