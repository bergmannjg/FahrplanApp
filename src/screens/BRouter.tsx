import React from 'react';
import Clipboard from '@react-native-community/clipboard';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import { Location } from 'hafas-client';
import { MainStackParamList, BRouterScreenParams } from './ScreenTypes'
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { distance } from '../lib/distance';

const noramlizelocations = (locations: Location[]) => {
    if (locations.length < 2) return locations;
    const newlocations: Location[] = [];
    newlocations.push(locations[0]);
    if (locations.length > 2) {
        for (let n = 1; n < locations.length - 1; n++) {
            const prev = locations[n - 1];
            const curr = locations[n];
            if (prev.longitude !== curr.longitude || prev.latitude !== curr.latitude) {
                newlocations.push(curr);
            }
        }
    }
    newlocations.push(locations[locations.length - 1]);
    return newlocations;
}

const centerOflocations = (locations: Location[]): Location => {
    if (locations.length === 1) return { type: 'location', longitude: locations[0].longitude, latitude: locations[0].latitude, altitude: 0 }
    let lon1 = Infinity; let lon2 = -Infinity; let lat1 = Infinity; let lat2 = -Infinity;
    for (const l of locations) {
        if (l.longitude && lon1 > l.longitude) lon1 = l.longitude;
        if (l.longitude && lon2 < l.longitude) lon2 = l.longitude;
        if (l.latitude && lat1 > l.latitude) lat1 = l.latitude;
        if (l.latitude && lat2 < l.latitude) lat2 = l.latitude;
    }
    console.log('lon1:', lon1, ',lon2:', lon2, ',lat1:', lat1, ',lat2:', lat2);

    let lon = lon1 + ((lon2 - lon1) / 2);
    let lat = lat1 + ((lat2 - lat1) / 2);
    const scale = 1000000;
    lon = Math.floor(lon * scale) / scale;
    lat = Math.floor(lat * scale) / scale;

    const dh = distance(lat1, lon1, lat1, lon2);
    const dv = distance(lat1, lon1, lat2, lon1);

    console.log('dh:', dh);
    console.log('dv:', dv);

    return {
        type: 'location',
        longitude: lon,
        latitude: lat,
        altitude: dh + dv
    }
}

const locations2zoom = (locations: Location[], preferredZoom?: number) : string => {
    try {
        const center = centerOflocations(locations);
        const latitude = center.latitude ?? 0;
        const longitude = center.longitude ?? 0;
        const d = center.altitude ?? 0;

        const zoom = preferredZoom ?? distance2zoom(d);
        return zoom + '/' + latitude + '/' + longitude;
    }
    catch (e) {
        return '12/52.1651/8.6147';
    }
}

const locations2params = (locations: Location[], preferredZoom?: number) : string => {
    try {
        const from = locations[0];
        const to = locations[locations.length - 1];
        console.log('from: ', from);
        console.log('to: ', to);

        let s = '';
        if (locations.length > 2) {
            for (let n = 1; n < locations.length - 1; n++) {
                const curr = locations[n];
                s = s + curr.longitude + ',' + curr.latitude + ';'
            }
        }

        const lonlat =
            from.longitude + ',' + from.latitude
            + ';'
            + s
            + to.longitude + ',' + to.latitude;

        return lonlat;
    }
    catch (e) {
        return '';
    }
}

const pois2params = (locations: Location[]) : string  => {
    try {
        const from = locations[0];
        const to = locations[locations.length - 1];

        let s = '';
        if (locations.length > 2) {
            for (let n = 1; n < locations.length - 1; n++) {
                const curr = locations[n];
                s = s + curr.longitude + ',' + curr.latitude + ',' + (curr.name ?? '') + ';'
            }
        }

        const lonlat =
            from.longitude + ',' + from.latitude + ',' + (from.name ?? '')
            + ';'
            + s
            + to.longitude + ',' + to.latitude + ',' + (to.name ?? '');

        return lonlat;
    }
    catch (e) {
        return '';
    }
}

const distance2zoom = (d: number) => {
    let zoom = 10;
    if (d < 3) zoom = 16;
    else if (d < 15) zoom = 11;
    else if (d < 30) zoom = 10;
    else if (d < 70) zoom = 9;
    else if (d < 200) zoom = 8;
    else if (d < 300) zoom = 7;
    else if (d < 500) zoom = 6;
    else if (d < 1000) zoom = 5;
    else if (d < 2000) zoom = 4;
    else if (d < 4000) zoom = 3;
    else zoom = 2;

    return zoom;
}

type Props = {
    route: RouteProp<MainStackParamList, 'BRouter'>;
    navigation: StackNavigationProp<MainStackParamList, 'BRouter'>;
};

function hasProperty<T extends object, K extends string>(obj: T, prop: K): obj is T & Record<K, number> {
    return prop in obj;
}

export default function BRouterScreen({ route, navigation }: Props): JSX.Element {
    console.log('BRouterScreen constructor');

    const { t } = useTranslation();

    const { params }: { params: BRouterScreenParams } = route;
    const locations = noramlizelocations(params.locations);
    const pois = params.pois;
    const map = locations2zoom(locations.length > 0 ? locations : pois ?? [], params.zoom);
    const p = locations2params(locations);
    const o = pois ? pois2params(pois) : '';
    const isCar = !!params.isCar;
    const profile = isCar ? 'car-fast' : 'rail';
    // the query string may change, it reflects the brouter api
    const uri = `https://brouter.de/brouter-web/#map=${map}/osm-mapnik-german_style&lonlats=${p}&pois=${o}&profile=${profile}`;
    console.log('uri: ', uri);

    Clipboard.setString(uri);

    const onMessage = (d: unknown) => {
        if (locations.length > 1 && typeof d === 'object' && d !== null && hasProperty(d, "distance")) {
            const title = t('BRouterScreen.Route', { locations: locations.length, distance: d.distance });
            navigation.setOptions({
                headerTitle: title
            });
        }
    }

    /*
        set style.display = 'none' is a hack to get rid of alert message 'Error: java.lang.NullPointerException'
    */
    const jsCodeObserverDistanceWithEventListener = `
    if (typeof window.brouterdistance === "undefined") {
        window.brouterdistance = true;
        var messageElement = document.getElementById('message');
        messageElement.style.display = 'none';
        function contentChanged() {
            var distance = document.getElementById('distance').innerHTML;
            if (distance && distance.length > 0) {
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({distance:distance}));
            }
        }
        var distanceElement = document.getElementById('distance');
        distanceElement.addEventListener('DOMSubtreeModified', contentChanged, false);
    }
    true;
`;

    return (
        <WebView
            source={{ uri }}
            style={{ marginTop: 20 }}
            onMessage={event => {
                const { data } = event.nativeEvent;
                console.log('event:', data);
                onMessage(JSON.parse(data));
            }}
            injectedJavaScript={jsCodeObserverDistanceWithEventListener}
            javaScriptEnabled={true}
            cacheEnabled={false}
        />
    );
}
