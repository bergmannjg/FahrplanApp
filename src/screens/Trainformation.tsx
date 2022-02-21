import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import moment from 'moment';
import { ListItem } from "react-native-elements";
import { useTranslation } from 'react-i18next';
import { MainStackParamList, TrainformationScreenParams, asLinkText } from './ScreenTypes';
import { Fahrzeug, Halt, trainformation } from '../lib/trainformation';
import { fahrzeuginfo, Fahrzeuginfo } from '../lib/fahrzeuginfo';
import { useOrientation } from './useOrientation';
import { stylesPortrait, stylesLandscape, styles } from './styles';

type Props = {
    route: RouteProp<MainStackParamList, 'Trainformation'>;
    navigation: StackNavigationProp<MainStackParamList, 'Trainformation'>;
};

export default function TrainformationScreen({ route, navigation }: Props): JSX.Element {
    const { params }: { params: TrainformationScreenParams } = route;

    if (__DEV__) {
        console.log('constructor ConnectionsScreen, params.date: ', params.date);
    }

    const { t } = useTranslation();

    const [baureihe, setBaureihe] = useState('');
    const [baureiheUrl, setBaureiheUrl] = useState<string | undefined>(undefined);
    const [data, setData] = useState([] as Fahrzeug[]);
    const [halt, setHalt] = useState<Halt | undefined>(undefined);
    const [zuggattung, setZuggattung] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [count] = useState(0);

    const fahrtNr = params.fahrtNr;
    const date = params.date;
    const location = params.location;

    const makeRemoteRequest = () => {
        console.log('makeRemoteRequest, loading:', loading);
        if (loading) return;
        setLoading(true);

        trainformation(fahrtNr, date)
            .then(trainformation => {
                let _data = [] as Fahrzeug[];
                const allFahrzeuggruppe = trainformation?.data?.istformation?.allFahrzeuggruppe;
                if (allFahrzeuggruppe && allFahrzeuggruppe.length === 1) {
                    const allFahrzeug = allFahrzeuggruppe[0].allFahrzeug;
                    if (allFahrzeug) {
                        _data = allFahrzeug;
                        setData(_data);
                    }
                }
                else if (allFahrzeuggruppe && allFahrzeuggruppe.length === 2) {
                    const allFahrzeug1 = allFahrzeuggruppe[0].allFahrzeug;
                    const allFahrzeug2 = allFahrzeuggruppe[1].allFahrzeug;
                    if (allFahrzeug1 && allFahrzeug2) {
                        _data = allFahrzeug1.concat(allFahrzeug2);
                        setData(_data);
                    }
                }
                setHalt(trainformation?.data?.istformation?.halt);
                const _zuggattung = trainformation?.data?.istformation?.zuggattung;
                setZuggattung(_zuggattung);
                if (_data.length > 0) {
                    const fi = _zuggattung ? fahrzeuginfo(_data[0], _zuggattung) : undefined;
                    setBaureihe(fi?.baureihename ?? '');
                    setBaureiheUrl(fi?.url);
                }
                setLoading(false);
            })
            .catch((error) => {
                console.log('There has been a problem with your trainformation operation: ' + error);
                console.log(error.stack);
                setLoading(false);
                setData([]);
            });
    };

    const orientation = useOrientation();

    useEffect(() => {
        makeRemoteRequest();
    }, [count]);

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

    const renderFooter = () => {
        if (!loading) return null;

        return (
            <View
                style={{
                    paddingVertical: 20,
                    borderTopWidth: 1,
                    borderColor: "#CED0CE"
                }}
            >
                <ActivityIndicator size="small" color="#0000ff" />
            </View>
        );
    };

    const showTime = (dt?: Date) => {
        return dt ? moment(dt).format('HH:mm') : '';
    }

    const showImage = async (fi?: Fahrzeuginfo) => {
        console.log('showRoute.Wagonimage: ', fi?.image);

        if (fi?.image) {
            navigation.navigate('Wagonimage', { title: (fi.fahrzeugtyp ?? '') + ' ' + (fi?.BRWagen ?? ''), image: fi.image });
        }
    }

    const showUrl = async (url: string, title: string) => {
        console.log('showWebView: ', url);

        navigation.navigate('WebView', { url, title });
    }

    const showLocation = async (name?: string) => {
        if (location) {
            console.log('showLocation: ', location);
            navigation.navigate('BRouter', { isLongPress: false, locations: [location], titleSuffix: name });
        }
    }

    interface ItemProps {
        item: Fahrzeug
    }

    const Item = ({ item }: ItemProps) => {
        const fi = zuggattung ? fahrzeuginfo(item, zuggattung) : undefined;
        return (
            <View style={styles.subtitleViewColumn}>
                <Text>{`Kategorie ${item.kategorie}`}</Text>
                <Text>{`Fahrzeugnummer ${item.fahrzeugnummer}`}</Text>
                <TouchableOpacity onPress={() => showImage(fi)} disabled={fi?.image === undefined}>
                    <Text>{`Baureihe ${item.fahrzeugtyp} ${asLinkText(fi?.BRWagen ?? '')}`}</Text>
                </TouchableOpacity>
                <Text>{`Sektor ${item.fahrzeugsektor}, Start ${item.positionamhalt?.startmeter} m, Ende ${item.positionamhalt?.endemeter} m`}</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View >
                {
                    !loading && data.length === 0 &&
                    <Text style={styles.itemHeaderTextTrainformation}>
                        {`keine Wagenreihung gefunden, FahrtNr: ${fahrtNr}, Datum: ${showTime(new Date(date))}`}
                    </Text>
                }
                {
                    halt &&
                    <View style={orientation === 'PORTRAIT' ? stylesPortrait.containerInfo : stylesLandscape.containerInfo}>
                        {location && halt.bahnhofsname ?
                            <TouchableOpacity onPress={() => showLocation(halt.bahnhofsname)}>
                                <Text style={styles.itemHeaderTextTrainformation}>
                                    {`Bahnhof ${halt.bahnhofsname}, Gleis ${halt.gleisbezeichnung ? asLinkText(halt.gleisbezeichnung) : ''}`}
                                </Text>
                            </TouchableOpacity>
                            :
                            <Text style={styles.itemHeaderTextTrainformation}>
                                {`Bahnhof ${halt.bahnhofsname}, Gleis ${halt.gleisbezeichnung}`}
                            </Text>
                        }
                        <Text style={styles.itemHeaderTextTrainformation}>
                            {`Ankunft ${showTime(halt.ankunftszeit)}, Abfahrt ${showTime(halt.abfahrtszeit)}`}
                        </Text>

                        {baureiheUrl ?
                            <TouchableOpacity onPress={() => showUrl(baureiheUrl, baureihe)}>
                                <Text style={styles.itemHeaderTextTrainformation}>
                                    {`Baureihe ${asLinkText(baureihe)}`}
                                </Text>
                            </TouchableOpacity>
                            :
                            <Text style={styles.itemHeaderTextTrainformation}>
                                {`Baureihe ${baureihe}`}
                            </Text>
                        }
                    </View>
                }
            </View>
            <View style={styles.container}>
                <FlatList
                    data={data}
                    renderItem={({ item }) => (
                        <ListItem containerStyle={{ borderBottomWidth: 0 }}>
                            <ListItem.Content>
                                <ListItem.Title>{`Wagen ${item.wagenordnungsnummer}`}</ListItem.Title>
                                <ListItem.Subtitle><Item item={item} /></ListItem.Subtitle>
                            </ListItem.Content>
                        </ListItem>
                    )}
                    keyExtractor={item => item.fahrzeugnummer ?? ''}
                    ItemSeparatorComponent={renderSeparator}
                    ListFooterComponent={renderFooter}
                    onEndReachedThreshold={50}
                />
            </View>
        </View>
    );
}
