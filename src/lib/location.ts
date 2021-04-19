import { Location } from 'hafas-client';

import GetLocation from 'react-native-get-location'
require('isomorphic-fetch');

const getAddress = (latitude: number, longitude: number): Promise<string | undefined> => {

    const promise = fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + latitude + '&lon=' + longitude)
        .then(function (response) {
            if (response.status >= 400) {
                throw new Error("Bad response from server");
            }
            return response.json();
        })
        .then(function (response) {
            console.log('getAddress: ', response);
            if (response.address && response.address.road && response.address.town) {
                if (response.address.house_number) return response.address.road + ' ' + response.address.house_number + ', ' + response.address.town as string;
                else return response.address.road + ', ' + response.address.town as string;
            }
        }).catch(error => {
            const { code, message } = error;
            console.warn(code, message);
            return undefined;
        });

    return promise;
}

export function getCurrentPosition(): Promise<Location> {
    const promise = GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 3000,
    }).then(location => {
        console.log('getCurrentPosition:', location);
        const currLoc = {
            type: 'location',
            name: 'aktuelle Postion',
            address: 'unused',
            latitude: location.latitude,
            longitude: location.longitude,
            distance: 0
        } as Location;

        return currLoc;
    });

    return promise;
}

export function getCurrentAddress(): Promise<Location> {
    const promise = GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 3000,
    }).then(location => {
        console.log('getCurrentPosition:', location);
        const currLoc = {
            type: 'location',
            name: 'aktuelle Postion',
            address: 'unused',
            latitude: location.latitude,
            longitude: location.longitude,
            distance: 0
        } as Location;

        const promise = getAddress(location.latitude, location.longitude)
            .then(address => {
                if (address) {
                    currLoc.name = address;
                    currLoc.address = address;
                }
                return currLoc
            }).catch(error => {
                const { code, message } = error;
                console.warn(code, message);
                return currLoc
            });

        return promise;
    });

    return promise;
}

