import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, TextInput, Keyboard } from "react-native";
import Autocomplete from 'react-native-autocomplete-input';
import useDebounce from './use-debounce';
import { hafas } from '../../lib/hafas';
import { Station, Stop, Location } from 'hafas-client';
import { styles } from '../styles';
import { rinfProfile, RInfSearchParams } from './../ScreenTypes';

export interface CustomAutocompleteProps {
    placeholder: string,
    query: string,
    onPress: (name: string) => void,
    profile: string,
    rinfSearchParams: RInfSearchParams
}

export default function CustomAutocomplete(props: CustomAutocompleteProps): JSX.Element {

    const profile = props.profile;
    const client = profile !== rinfProfile ? hafas(profile) : undefined;
    const onPress = props.onPress;

    const [query, setQuery] = useState(props.query);
    const [bahnhoefe, setBahnhoefe] = useState<ReadonlyArray<Station | Stop | Location>>([]);
    const [count, setCount] = useState(0);

    const debouncedSearchTerm = useDebounce(query, 500);

    const asyncFindBahnhoefe = (queryParam: string, callback: (q: string, arr: ReadonlyArray<Station | Stop | Location>) => void) => {
        if (queryParam === '' || queryParam.length < 3) {
            callback(queryParam, []);
        } else if (profile === rinfProfile) {
            import('../../lib/rinf-data-railway-routes')
                .then(rinf => {
                    const locations: Location[] = rinf.rinfOpInfos(queryParam, props.rinfSearchParams.textSearch)
                        .map(op => {
                            return {
                                type: 'location', name: op.Name, id: op.UOPID,
                                latitude: op.Latitude, longitude: op.Longitude
                            };
                        });
                    callback(queryParam, locations);
                })
        } else if (client) {
            client.locations(queryParam, 12)
                .then(locations => callback(queryParam, locations))
                .catch(error => {
                    console.log('There has been a problem with your locations operation: ' + error);
                    callback(queryParam, []);
                });
        }
    }

    useEffect(() => {
        if (count > 0) {
            if (debouncedSearchTerm) {
                asyncFindBahnhoefe(query, (queryParam, bahnhoefeParam) => setBahnhoefe(bahnhoefeParam));
            }
        }
    }, [count]);

    const comp = (a: string, b: string) => a.toLowerCase().trim() === b.toLowerCase().trim();

    const getdata = (): Array<Station | Stop | Location> => {
        const stops = bahnhoefe.length === 1 && comp(query, bahnhoefe[0].name ?? "") ? [] : bahnhoefe as Array<Station | Stop | Location>;
        return stops.filter(s => s.name);
    }

    return (
        <Autocomplete
            autoCapitalize="none"
            autoCorrect={false}
            hideResults={query.length < 3}
            data={getdata()}
            value={query}
            onChangeText={text => {
                setQuery(text);
                setCount(count + 1);
            }}
            placeholder={props.placeholder}
            flatListProps={{
                keyboardShouldPersistTaps: 'always',
                keyExtractor: (item) => item.name ?? "" + item.id ?? "",
                renderItem: ({ item }) =>
                    <TouchableOpacity onPress={() => {
                        const x = item.name ?? '';
                        console.log('onPress: ', x);
                        setQuery(x);
                        setBahnhoefe([])
                        onPress(x);
                        Keyboard.dismiss();
                    }}>
                        <Text style={styles.itemText}>
                            {item.name}
                        </Text>
                    </TouchableOpacity>
            }}
            renderTextInput={(renderTextProps) => (
                <TextInput {...renderTextProps} style={styles.itemText} />
            )}
        />
    );
}
