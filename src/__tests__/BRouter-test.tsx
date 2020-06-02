import 'react-native';
import React from 'react';
import BRouterScreen from '../screens/BRouter';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationDE from '../locales/de/translation.json';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import { hafas } from '../lib/hafas';
import moment from 'moment';

debugger

function zeroFill(number: number, length: number) {
    return (Array(length).join('0') + number).slice(-length);
}

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
                if (value instanceof Date) return moment(value).format(format);
                else if (moment.isMoment(value)) return value.format(format);
                else if (moment.isDuration(value)) return Math.floor(value.asHours()) + ':' + zeroFill(value.minutes(), 2);
                else return value;
            }
        }
    });

const createTestProps = (props: any) => ({
    navigation: {
        navigate: jest.fn()
    },
    route: {
        params: {
            locations: [
                {   // Hannover
                    longitude: 9.7416533,
                    latitude: 52.3769504
                },
                {   // Bielefeld
                    longitude: 8.5327135,
                    latitude: 52.0293323
                }
            ]
        }
    },
    ...props
});

it('renders BRouterScreen correctly', async () => {
    const props = createTestProps({});
    let testRenderer: any;
    await act(() => {
        testRenderer = renderer.create(<BRouterScreen {...props} />);
        return Promise.resolve();
    });
    if (testRenderer) {
        const tree = testRenderer.toJSON();
        expect(tree).toMatchSnapshot();
        const instance = testRenderer.root;
        const texts = instance.findAllByType('div');
        expect(texts.length).toBe(1);
        expect(texts[0].children).toEqual(['https://brouter.de/brouter-web/#map=8/52.203141/9.137183/osm-mapnik-german_style&lonlats=9.7416533,52.3769504;8.5327135,52.0293323&profile=rail']);
    }
});