import 'react-native';
import React from 'react';
import HomeScreen from '../screens/Home';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationDE from '../locales/de/translation.json';
import renderer, { act } from 'react-test-renderer';
import moment from 'moment';

i18next
    .use(initReactI18next)
    .init({
        lng: 'de',
        debug: false,
        resources: {
            de: {
                translation: translationDE,
            }
        },
        interpolation: {
            format: function (value, format, lng) {
                if (value instanceof Date) return '1.1.2020'; // constant value for toMatchSnapshot
                else if (moment.isMoment(value)) return '1.1.2020'; // constant value for toMatchSnapshot
                else if (moment.isDuration(value)) return '02:30'; // constant value for toMatchSnapshot
                else return value;
            }
        }
    });

const createTestProps = (props: any) => ({
    navigation: {
        setOptions: jest.fn(),
        navigate: jest.fn()
    },
    route: {
    },
    ...props
});

const setOptionsArgsuments = {
    "headerRight": expect.anything(),
    "headerTitle": "Reiseauskunft"
};

it('renders HomeScreen correctly', async () => {
    const props = createTestProps({});
    let testRenderer: any;
    await act(() => {
        testRenderer = renderer.create(<HomeScreen {...props} />);
        return Promise.resolve();
    });
    if (testRenderer) {
        const tree = testRenderer.toJSON();
        expect(tree).toMatchSnapshot();
        expect(props.navigation.setOptions).toHaveBeenCalledWith(setOptionsArgsuments);
    }
});