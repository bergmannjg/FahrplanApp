import React from 'react';
import { Clipboard } from 'react-native'
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import { Location } from 'hafas-client';
import { MainStackParamList, BRouterScreenParams } from './ScreenTypes'
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

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
    if (locations.length <= 1) return { type: 'location', longitude: 0, latitude: 0, altitude: 0 }
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

    const dh = distance(lat1, lon1, lat1, lon2, 'K');
    const dv = distance(lat1, lon1, lat2, lon1, 'K');

    console.log('dh:', dh);
    console.log('dv:', dv);

    return {
        type: 'location',
        longitude: lon,
        latitude: lat,
        altitude: dh + dv
    }
}

const locations2params = (locations: Location[]) => {
    try {
        const from = locations[0];
        const to = locations[locations.length - 1];
        console.log('from: ', from);
        console.log('to: ', to);

        const center = centerOflocations(locations);
        const latitude = center.latitude ?? 0;
        const longitude = center.longitude ?? 0;
        console.log('center: ', center);
        const d = center.altitude ?? 0;

        const zoom = distance2zoom(d);
        console.log('distance: ', d, ', zoom: ', zoom);

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

        return {
            map: zoom + '/' + latitude + '/' + longitude,
            lonlats: lonlat
        };
    }
    catch (e) {
        return { map: '12/52.1651/8.6147', lonlats: '8.573928,52.202136;8.663836,52.119524' };
    }
}

const distance2zoom = (d: number) => {
    let zoom = 10;
    if (d < 15) zoom = 11;
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

const distance = (lat1: number, lon1: number, lat2: number, lon2: number, unit: string) => {
    if ((lat1 === lat2) && (lon1 === lon2)) {
        return 0;
    }
    else {
        const radlat1 = Math.PI * lat1 / 180;
        const radlat2 = Math.PI * lat2 / 180;
        const theta = lon1 - lon2;
        const radtheta = Math.PI * theta / 180;
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit === "K") { dist = dist * 1.609344 }
        if (unit === "N") { dist = dist * 0.8684 }
        return dist;
    }
}

type Props = {
    route: RouteProp<MainStackParamList, 'BRouter'>;
    navigation: StackNavigationProp<MainStackParamList, 'BRouter'>;
};

function hasDistanceProperty<T>(obj: T): obj is T & Record<'distance', number> {
    return Object.prototype.hasOwnProperty.call(obj, 'distance')
}

export default function BRouterScreen({ route, navigation }: Props): JSX.Element {
    console.log('BRouterScreen constructor');

    const { t } = useTranslation();

    const { params }: { params: BRouterScreenParams } = route;
    const locations = noramlizelocations(params.locations);
    const p = locations2params(locations);
    // the query string may change, it reflects the brouter api
    const uri = `https://brouter.de/brouter-web/#map=${p.map}/osm-mapnik-german_style&lonlats=${p.lonlats}&profile=rail`;
    console.log('uri: ', uri);

    Clipboard.setString(uri);

    const onMessage = (d: unknown) => {
        if (hasDistanceProperty(d)) {
            navigation.setOptions({
                headerTitle: t('BRouterScreen.Route', { locations: locations.length, distance: d.distance })
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
