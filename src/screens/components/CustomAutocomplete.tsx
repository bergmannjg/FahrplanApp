import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text, Button, TextInput, Keyboard } from "react-native";
import Autocomplete from 'react-native-autocomplete-input';
import useDebounce from './use-debounce';
import { useTranslation } from 'react-i18next';
import { Hafas } from '../../lib/hafas';
import { Station, Stop, Location } from 'hafas-client';

export interface CustomAutocompleteProps {
    placeholder: string,
    query: string,
    onPress: (name: string) => void,
    client: Hafas
}

export default function CustomAutocomplete(props: CustomAutocompleteProps) {

    const { t, i18n } = useTranslation();

    const client = props.client;
    const onPress = props.onPress;

    const [query, setQuery] = useState(props.query);
    const [bahnhoefe, setBahnhoefe] = useState<ReadonlyArray<Station | Stop | Location>>([]);
    const [count, setCount] = useState(0);

    const debouncedSearchTerm = useDebounce(query, 500);

    const asyncFindBahnhoefe = (queryParam: string, callback: (q: string, arr: ReadonlyArray<Station | Stop | Location>) => void) => {
        if (queryParam === '' || queryParam.length < 3) {
            callback(queryParam, []);
        } else {
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
        return bahnhoefe.length === 1 && comp(query, bahnhoefe[0].name ?? "") ? [] : bahnhoefe as Array<Station | Stop | Location>;
    }
    return (
        <Autocomplete
            autoCapitalize="none"
            autoCorrect={false}
            hideResults={query.length < 3}
            data={getdata()}
            value={query}
            onChangeText={text => {
                if (text.length === 0) {
                    onPress('');
                }
                setQuery(text);
                setCount(count + 1);
            }}
            placeholder={props.placeholder}
            keyExtractor={(item, index) => item.name ?? ""}
            renderTextInput={(renderTextProps) => (
                <TextInput {...renderTextProps} style={styles.itemText} />
            )}
            renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => {
                    console.log('onPress: ', item.name);
                    setQuery(item.name ?? "");
                    setBahnhoefe([])
                    onPress(item.name ?? "");
                    Keyboard.dismiss();
                }}>
                    <Text style={styles.itemText}>
                        {item.name}
                    </Text>
                </TouchableOpacity>
            )}
        />
    );
}

const styles = StyleSheet.create({
    itemText: {
        fontSize: 18,
        margin: 2
    },
});
