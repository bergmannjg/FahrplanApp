import React from 'react';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList, WagonimageScreenParams } from './ScreenTypes';
import ImageTransformer from "react-native-image-transformer";

type Props = {
    route: RouteProp<MainStackParamList, 'Wagonimage'>;
    navigation: StackNavigationProp<MainStackParamList, 'Wagonimage'>;
};

export default function WagonimageScreen({ route }: Props): JSX.Element {
    const { params }: { params: WagonimageScreenParams } = route;

    const image = params.image;
    const uri = 'https://lib.finalrewind.org/dbdb/db_wagen/' + image + '.png';

    console.log('WagonimageScreen: ', uri);

    return (

        <ImageTransformer
            style={{ flex: 1, paddingLeft: 5, paddingRight: 5 }}
            image={
                {
                    uri: uri
                }
            } />
    );
}
