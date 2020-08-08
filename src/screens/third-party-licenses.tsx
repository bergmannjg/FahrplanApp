import React from 'react';
import { StyleSheet, View, Text, Linking, TouchableOpacity, FlatList, } from 'react-native';
import { Colors, } from 'react-native/Libraries/NewAppScreen';
import Data from './data/third-party-licenses.json';

interface LicenseEntry {
    licenses: string;
    repository: string;
    licenseUrl: string;
    parents: string;
}

interface License extends LicenseEntry {
    key: string;
    version: string;
    name: string;
}

interface Licenses {
    [index: string]: LicenseEntry
}

export default function ThirdPartyLicensesScreen(): JSX.Element {
    console.log('constructor TripScreen');

    function sortDataByKey(data: License[]) {
        data.sort((a, b) => {
            return a.key > b.key ? 1 : b.key > a.key ? -1 : 0;
        });
        return data;
    }

    const allLicenses: License[] = Object.keys(Data).map(key => {
        const entry = (Data as Licenses)[key];
        const [name, version] = key.slice(1).split('@');
        entry.licenses = entry.licenses.slice(0, 405);
        return {
            key,
            name: key[0] + name,
            version,
            ...entry,
        };
    });

    sortDataByKey(allLicenses);

    const renderSeparator = () => {
        return (
            <View />
        );
    };

    const Item = ({ item }: { item: License }) => {
        return (
            <View style={styles.subtitleView}>
                <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(item.repository)}>
                    <Text style={styles.itemLicenceText}>
                        {`${item.name}`}
                    </Text>
                </TouchableOpacity>
                <Text style={styles.itemDetailsText}>
                    License: {`${item.licenses}`}
                </Text>
                <Text style={styles.itemDetailsText}>
                    Version: {`${item.version}`}
                </Text>
            </View >
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={allLicenses}
                renderItem={({ item }) => <Item item={item} />}
                keyExtractor={item => item.key}
                ItemSeparatorComponent={renderSeparator}
                onEndReachedThreshold={50}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    subtitleView: {
        flexDirection: 'column',
        paddingLeft: 10,
        paddingTop: 0,
        margin: 0
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        paddingTop: 22
    },
    scrollView: {
        backgroundColor: Colors.lighter,
    },
    engine: {
        position: 'absolute',
        right: 0,
    },
    body: {
        backgroundColor: Colors.white,
    },
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.black,
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
        color: Colors.dark,
    },
    highlight: {
        fontWeight: '700',
    },
    itemButtonText: {
        fontSize: 18,
        margin: 2,
        paddingBottom: 20,
        textAlign: 'center'
    },
    itemHeaderText: {
        fontSize: 14,
        paddingLeft: 20,
    },
    itemWarningText: {
        color: 'red',
        paddingLeft: 50,
    },
    itemLicenceText: {
        fontWeight: 'bold',
    },
    itemDetailsText: {
        paddingLeft: 50,
    },
    footer: {
        color: Colors.dark,
        fontSize: 12,
        fontWeight: '600',
        padding: 4,
        paddingRight: 12,
        textAlign: 'right',
    },
    button: {
        backgroundColor: '#EEEEEE',
        padding: 2,
        margin: 2,
    },
});

