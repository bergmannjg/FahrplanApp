// see https://stackoverflow.com/questions/47683591/react-native-different-styles-applied-on-orientation-change
import { useState, useEffect } from 'react';
import {
    Dimensions
} from 'react-native';

/**
 * Returns true if the screen is in portrait mode
 */
const isPortrait = () => {
    const dim = Dimensions.get('window');
    console.log('dim ', dim);
    return dim.height >= dim.width;
};

/**
 * A React Hook which updates when the orientation changes
 * @returns whether the user is in 'PORTRAIT' or 'LANDSCAPE'
 */
export function useOrientation(): 'PORTRAIT' | 'LANDSCAPE' {
    // State to hold the connection status
    const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>(
        isPortrait() ? 'PORTRAIT' : 'LANDSCAPE',
    );

    useEffect(() => {
        const callback = () => {
            const o = isPortrait() ? 'PORTRAIT' : 'LANDSCAPE';
            console.log('changeOrientation to ', o)
            setOrientation(o);
        };    
        const subscription = Dimensions.addEventListener('change', callback);

        return () => {
            subscription.remove();
        };
    }, []);

    console.log('setOrientation to ', orientation);
    return orientation;
}

