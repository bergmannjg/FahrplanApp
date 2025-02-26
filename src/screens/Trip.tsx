
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Linking } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { extractTimeOfDatestring, momentWithTimezone, MomentWithTimezone } from '../lib/iso-8601-datetime-utils';
import { Location, Trip, StopOver, Line, Stop, Station, Hint } from 'fs-hafas-client/hafas-client';
import { Hafas, getLocation, stopovers2Locations4Routes } from '../lib/hafas';
import { MainStackParamList, TripScreenParams, asLinkText } from './ScreenTypes';
import moment from 'moment-timezone';
import { hafas, isStopover4Routes, hasTrainformation } from '../lib/hafas';
import { useOrientation } from './useOrientation';
import { stylesPortrait, stylesLandscape, styles } from './styles';

type Props = {
	route: RouteProp<MainStackParamList, 'Trip'>;
	navigation: StackNavigationProp<MainStackParamList, 'Trip'>;
};

enum PositionKind {
	Departure,
	Stop,
	Arrival
}

interface ItemType {
	s: StopOver;
	p: PositionKind;
}

interface ItemHint {
	hint: Hint;
}

export default function TripScreen({ route, navigation }: Props): JSX.Element {
	console.log('constructor TripScreen');

	const { t } = useTranslation();

	const { params }: { params: TripScreenParams } = route;
	const trip: Trip = params.trip;
	const showAsTransits = params.showAsTransits;
	const line = params.line;
	const profile = params.profile;
	const client: Hafas = hafas(profile);

	console.log('remarks:', trip.remarks);

	const orientation = useOrientation();

	const length = trip.stopovers?.length ?? 0;
	const getPositionKind = (i: number) => {
		if (i == 0) return PositionKind.Departure;
		else if (i == length - 1) return PositionKind.Arrival;
		else return PositionKind.Stop;
	}
	let data: (ItemType | ItemHint)[] | undefined = trip.stopovers?.map((s, i): ItemType => { return { s: s, p: getPositionKind(i) } })
	let hints: ItemHint[] | undefined =
		trip.remarks?.filter(remark => remark.type === "hint").map((remark): ItemHint => { return { hint: remark as Hint }; });
	if (hints) {
		const header: ItemHint = { hint: { type: "hint", text: "Infomationen" } };
		data = data?.concat([header]).concat(hints);
	}
	const operatorName = trip.line?.operator?.name;
	const fahrtName = trip.line?.product === 'regional' ? trip.line?.fahrtNr : undefined;
	const zugfinderUrl = trip.line?.productName && trip.line?.fahrtNr
		? 'https://www.zugfinder.net/de/zug-' + trip.line?.productName + '_' + trip.line?.fahrtNr : undefined;

	const departure = trip.plannedDeparture ? momentWithTimezone(trip.plannedDeparture) : undefined;

	const showRailwayRoutes = (longPress: boolean) => {
		console.log('Trip showRailwayRoutes');
		const stops = trip.stopovers ? stopovers2Locations4Routes(trip.stopovers) : [];
		if (stops.length > 1) {
			navigation.navigate('RailwayRoutesOfTrip', { profile, tripDetails: true, useMaxSpeed: longPress, originName: stops[0].name ?? '', destinationName: stops[stops.length - 1].name ?? '', locations: stops });
		}
	}

	const showRoute = (isLongPress: boolean) => {
		const locations = [] as Location[];
		const pois = [] as Location[];
		if (trip.currentLocation) {
			trip.currentLocation.name = trip.line?.name;
			pois.push(trip.currentLocation);
		}
		trip.stopovers?.forEach(stopover => {
			if (!stopover.cancelled && stopover.stop?.location) {
				if (isStopover4Routes(stopover)) {
					locations.push(stopover.stop.location);
				} else {
					pois.push(stopover.stop.location);
				}
			}
		});
		console.log('locations: ', locations.length);
		navigation.navigate('BRouter', { isLongPress, locations, pois });
	}

	const showDepartures = (query: string, date: string) => {
		navigation.navigate('Departures', { station: query, date: date.length > 0 ? new Date(Date.parse(date)).valueOf() : new Date().valueOf(), profile })
	}

	const railwayCar = '\uD83D\uDE83'; // surrogate pair of U+1F683

	const showLocation = async (item: Stop | Station | Location | undefined) => {
		const loc = client.getLocation(item);
		if (loc && item) {
			console.log('showLocation: ', loc);
			navigation.navigate('BRouter', { isLongPress: false, locations: [loc], pois: [], titleSuffix: item.name });
		}
	}

	const showCurrentLocation = async (loc: Location | undefined, line: string | undefined) => {
		if (loc) {
			console.log('showLocation: ', loc);
			navigation.navigate('BRouter', { isLongPress: false, locations: [], pois: [loc], titleSuffix: line, zoom: 10 });
		}
	}

	const goToWagenreihung = (line: Line, plannedDeparture?: string, stop?: Stop | Station) => {
		console.log('Navigation router run to Wagenreihung');
		console.log('fahrtNr: ', line?.fahrtNr, ', plannedDeparture:', plannedDeparture);

		const loc = getLocation(stop);
		if (line && loc && plannedDeparture) {
			const url = "https://dbf.finalrewind.org/carriage-formation?administrationId=80"
				+ "&category=" + line.productName
				+ "&time=" + (new Date(plannedDeparture)).toISOString()
				+ "&number=" + line?.fahrtNr
				+ "&date=" + plannedDeparture.substring(0, 10)
				+ "&evaNumber=" + loc.id;
			console.log('url', url);
			Linking.openURL(url);
		}
	}

	const renderSeparator = () => {
		return (
			<View
				style={{
					height: 1,
					width: "86%",
					backgroundColor: "#CED0CE",
					marginLeft: "14%"
				}}
			/>
		);
	};

	const OptionalItemDeparture = ({ item }: { item: ItemType }) => {
		let departure: MomentWithTimezone = { hasTimezone: false, moment: moment() };
		if (!item.s.plannedArrival && item.s.plannedDeparture && item.s.stop?.location) {
			departure = momentWithTimezone(item.s.plannedDeparture, item.s.stop?.location);
		}

		return (
			item.p == PositionKind.Departure && item.s.plannedDeparture ?
				<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
					<Text style={styles.itemStationText}>
						{`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.s.plannedDeparture) })} ${departure.hasTimezone ? t('TripScreen.Timezone', { date: departure.moment }) : ''} ${item.s.stop?.name}`}
					</Text>
					{line && line.fahrtNr && hasTrainformation(line, item.s.departure || item.s.plannedDeparture) && item.s.plannedDeparture && !item.s.cancelled &&
						<TouchableOpacity onPress={() => goToWagenreihung(line, item.s.plannedDeparture, item.s.stop)}>
							<Text style={{ paddingRight: 10 }}>{asLinkText(railwayCar)}</Text>
						</TouchableOpacity>
					}
				</View>
				:
				null
		)
	}

	const OptionalItemDelay = ({ item }: { item: ItemType }) => {
		if (item.s.departureDelay && item.s.departureDelay > 0 && item.s.departure)
			return (
				<View>
					<Text style={styles.itemDelayTextTrip}>
						{`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.s.departure) })}`}
					</Text>
				</View>
			)
		else
			return null;
	}

	const cancelledInfo = (item: StopOver): string => {
		const cancelled = item.cancelled;
		return cancelled ? "entfällt" : "";
	}

	const additionalStopInfo = (item: StopOver): string => {
		const additionalStop = item.additional;
		return additionalStop ? "zusätzlicher Halt" : "";
	}

	const transitInfo = (so: StopOver): string => {
		if (so.plannedDeparture) {
			return t('TripScreen.Time', { date: extractTimeOfDatestring(so.plannedDeparture) })
		} else {
			return 'Durchfahrt';
		}
	}

	const nameInfo = (so: StopOver): string => {
		const name = so.stop?.name ?? '';
		if (name.length > 20) {
			return name.substring(0, 18) + '...';
		} else {
			return name;
		}
	}

	const distanceInfo = (so: StopOver): string => {
		const dist = so.stop?.distance ? (', ' + so.stop?.distance.toFixed(0) + ' km') : '';
		return dist;
	}

	const OptionalItemBetween = ({ item }: { item: ItemType }) => {
		if (!showAsTransits && item.p == PositionKind.Stop && item.s.plannedDeparture)
			return (
				<View>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
						<TouchableOpacity onPress={() => showDepartures(item.s.stop?.name ?? "", item.s.plannedArrival ?? '')}>
							<Text style={styles.itemDetailsText}>
								{`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.s.plannedDeparture) })} ${asLinkText(item.s.stop?.name ?? '')}`}
								<Text style={styles.itemWarningText}>
									{` ${cancelledInfo(item.s)}`}
								</Text>
								<Text style={styles.itemInfoText}>
									{` ${additionalStopInfo(item.s)}`}
								</Text>
							</Text>
						</TouchableOpacity>
						{line && line.fahrtNr && hasTrainformation(line, item.s.departure || item.s.plannedDeparture) && item.s.plannedDeparture && !item.s.cancelled &&
							<TouchableOpacity onPress={() => goToWagenreihung(line, item.s.plannedDeparture, item.s.stop)}>
								<Text style={{ paddingRight: 10 }}>{asLinkText(railwayCar)}</Text>
							</TouchableOpacity>
						}
					</View>
					<OptionalItemDelay item={item} />
				</View>
			)
		else if (!showAsTransits && item.p == PositionKind.Stop && item.s.plannedArrival)
			return (
				<View>
					<Text style={styles.itemDetailsText}>
						{`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.s.plannedArrival) })} ${item.s.stop?.name ?? ''}`}
						<Text style={styles.itemWarningText}>
							{` ${cancelledInfo(item.s)}`}
						</Text>
						<Text style={styles.itemInfoText}>
							{` ${additionalStopInfo(item.s)}`}
						</Text>
					</Text>
					<OptionalItemDelay item={item} />
				</View>
			)
		else if (item.p == PositionKind.Stop && item.s.stop && item.s.stop?.name)
			return (
				<View>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
						<TouchableOpacity onPress={() => showLocation(item.s.stop)}>
							<Text style={styles.itemDetailsTextTransit}>
								{`${transitInfo(item.s)} ${asLinkText(nameInfo(item.s) + distanceInfo(item.s))}`}
								<Text style={styles.itemWarningText}>
									{` ${cancelledInfo(item.s)}`}
								</Text>
								<Text style={styles.itemInfoText}>
									{` ${additionalStopInfo(item.s)}`}
								</Text>
							</Text>
						</TouchableOpacity>
					</View>
					<OptionalItemDelay item={item} />
				</View>
			)
		else
			return null;
	}

	const OptionalItemArrival = ({ item }: { item: ItemType }) => {
		let arrival: MomentWithTimezone = { hasTimezone: false, moment: moment() };
		if (item.s.plannedArrival && !item.s.plannedDeparture && item.s.stop?.location) {
			arrival = momentWithTimezone(item.s.plannedArrival, item.s.stop?.location);
		}

		return (
			item.p == PositionKind.Arrival && item.s.plannedArrival ?
				<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
					<Text style={styles.itemStationText}>
						{`${t('TripScreen.Time', { date: extractTimeOfDatestring(item.s.plannedArrival) })} ${arrival.hasTimezone ? t('TripScreen.Timezone', { date: arrival.moment }) : ''} ${item.s.stop?.name}`}
					</Text>
					{line && item.s.plannedDeparture && hasTrainformation(line, item.s.plannedArrival) &&
						<TouchableOpacity onPress={() => goToWagenreihung(line, item.s.plannedArrival, item.s.stop)}>
							<Text style={{ paddingRight: 10 }}>{asLinkText(railwayCar)}</Text>
						</TouchableOpacity>
					}
				</View>
				:
				null
		)
	}

	const Item = ({ item }: { item: ItemType | ItemHint }) => {
		if ("s" in item)
			return (
				<View style={styles.subtitleViewTrip}>
					<OptionalItemDeparture item={item} />
					<OptionalItemBetween item={item} />
					<OptionalItemArrival item={item} />
				</View >
			);
		if ("hint" in item && item.hint.type === "hint")
			return (
				item.hint.text === "Infomationen" ?
					<View style={styles.subtitleViewTrip}>
						<Text style={styles.itemStationText}>{item.hint.text}</Text>
					</View >
					: <View style={styles.subtitleViewTrip}>
						<Text style={styles.itemHintText}>{item.hint.text}</Text>
					</View >
			);
	}

	const hasLine = () => !!trip.line?.matchId && !!trip.line?.product?.includes('national')

	return (
		<View style={styles.container}>
			<View style={orientation === 'PORTRAIT' ? stylesPortrait.containerButtons : stylesLandscape.containerButtons}>
				<TouchableOpacity style={styles.buttonTrip} onPress={() => showRoute(false)} onLongPress={() => showRoute(true)}>
					<Text style={styles.itemButtonText}>
						{t('TripScreen.ShowRoute')}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.buttonJourneyPlan} onPress={() => showRailwayRoutes(false)} onLongPress={() => showRailwayRoutes(true)}>
					<Text style={styles.itemButtonText}>
						{t('JourneyplanScreen.ShowRailwayRoutes')}
					</Text>
				</TouchableOpacity>
			</View>
			{
				zugfinderUrl
					?
					<View>
						<View style={{ flexDirection: 'row', paddingLeft: 10 }}>
							<Text style={styles.itemHeaderText}
								onPress={() => Linking.openURL(zugfinderUrl)}>
								{trip.line?.name ?? ''}{fahrtName ? (' / ' + fahrtName) : ''}{operatorName ? (' (' + operatorName + ') ') : ''}, {asLinkText('Pünktlichkeit')}
							</Text>
						</View>
						<View style={{ flexDirection: 'row', paddingLeft: 10 }}>
							<Text style={styles.itemHeaderText}>
								{departure ? t('TripScreen.Departure', { date: departure.moment }) + ',' : ''} {t('TripScreen.Duration', { duration: moment.duration((new Date(trip.plannedArrival ?? "")).valueOf() - (new Date(trip.plannedDeparture ?? "")).valueOf()) })}{hasLine() ? ',' : ''}
							</Text>
							{hasLine() &&
								<Text style={styles.itemHeaderTextLeft}>
									Linie {trip.line?.matchId}
								</Text>
							}
						</View>
					</View>
					:
					<View style={{ paddingLeft: 10 }}>
						<Text style={styles.itemHeaderText}>
							{trip.line?.name ?? ''}{fahrtName ? (' / ' + fahrtName) : ''}{operatorName ? (' (' + operatorName + ') ') : ''} {departure ? t('TripScreen.Departure', { date: departure.moment }) + ',' : ''} {t('TripScreen.Duration', { duration: moment.duration((new Date(trip.plannedArrival ?? "")).valueOf() - (new Date(trip.plannedDeparture ?? "")).valueOf()) })}
						</Text>
					</View>
			}
			{
				(trip.currentLocation) &&
				<View style={{ flexDirection: 'row', paddingLeft: 10 }}>
					<TouchableOpacity onPress={() => showCurrentLocation(trip.currentLocation, trip.line?.name)}>
						<Text style={styles.itemHeaderText}>{asLinkText("aktuelle Position um " + (new Date).toLocaleTimeString())}</Text>
					</TouchableOpacity>
				</View>
			}

			{
				data && data.length > 1 &&
				< FlatList
					data={data}
					renderItem={({ item }) => <Item item={item} />}
					keyExtractor={item => ("s" in item) ? (item.s.stop?.name ?? "") : ("hint" in item) ? (item.hint.text ?? "") : ""}
					ItemSeparatorComponent={renderSeparator}
					onEndReachedThreshold={50}
				/>
			}
		</View >
	);
}
