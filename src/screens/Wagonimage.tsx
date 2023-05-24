import React from 'react';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList, WagonimageScreenParams } from './ScreenTypes';
import { Dimensions, Image } from 'react-native';
import { useOrientation } from './useOrientation';

type Props = {
    route: RouteProp<MainStackParamList, 'Wagonimage'>;
    navigation: StackNavigationProp<MainStackParamList, 'Wagonimage'>;
};

export default function WagonimageScreen({ route }: Props): JSX.Element {
    const { params }: { params: WagonimageScreenParams } = route;

    const image = params.image;
    const uri = 'https://lib.finalrewind.org/dbdb/db_wagen/' + image + '.png';

    const dim = Dimensions.get('window');
    console.log('WagonimageScreen: ', uri, dim);
    const orientation = useOrientation();
    return (
        orientation === 'PORTRAIT' ?
            <Image
                style={{ marginTop: dim.height / 2 - 110, marginLeft: 10, marginRight: 10, width: dim.width - 20, height: 50 }}
                source={{ uri: uri }}
            />
            :
            <Image
                style={{ marginTop: dim.height / 2 - 110, marginLeft: 10, marginRight: 10, width: dim.width - 20, height: 90 }}
                source={{ uri: uri }}
            />
    );
}
