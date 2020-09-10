import 'react-native';
import React from 'react';
import ConnectionsScreen from '../screens/Connections';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationDE from '../locales/de/translation.json';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import { hafas } from '../lib/hafas';
import moment from 'moment';

debugger

jest.mock('hafas-client', () => (profile: any, name: string) => {
    const mockHannover = { name: 'Hannover Hbf', id: '8000152' };
    const mockBielefeld = { name: 'Bielefeld Hbf', id: '8000036' };

    const locations = (query: string) => {
        console.log('mocked locations:', query);
        const res = [] as any;
        if (query == 'Hannover') {
            res.push(mockHannover);
        }
        else if (query == 'Bielefeld') {
            res.push(mockBielefeld);
        }
        return Promise.resolve(res);
    }
    const journeys = (from: string, to: string, numresults: number, date: string) => {
        console.log('mocked journeys:', from, to);
        const journeys = [
            {
                id: '123456',
                legs: [{
                    origin: mockHannover,
                    destination: mockBielefeld,
                    departure: '2020-03-30T11:38:00+02:00',
                    plannedDeparture: '2020-03-30T11:38:00+02:00',
                    arrival: '2020-03-30T11:52:00+02:00',
                    plannedArrival: '2020-03-30T11:52:00+02:00',
                    reachable: true
                }]
            },
            {
                id: '234567',
                legs: [{
                    origin: mockHannover,
                    destination: mockBielefeld,
                    departure: '2020-03-30T23:58:00+02:00',
                    plannedDeparture: '2020-03-30T23:58:00+02:00',
                    arrival: '2020-03-31T00:12:00+02:00',
                    plannedArrival: '2020-03-31T00:12:00+02:00',
                    reachable: true
                }]
            }];
        return Promise.resolve({ journeys: journeys });
    }
    return {
        locations: locations,
        journeys: journeys
    }
});

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
            station1: 'Hannover',
            station2: 'Bielefeld',
            date: new Date('2020-03-30T13:00:00+02:00'),
            client: hafas('db')
        }
    },
    ...props
});

it('renders ConnectionsScreen correctly', async () => {
    const props = createTestProps({});
    let testRenderer: any;
    await act(() => {
        testRenderer = renderer.create(<ConnectionsScreen {...props} />);
        return Promise.resolve();
    });
    if (testRenderer) {
        const tree = testRenderer.toJSON();
        expect(tree).toMatchSnapshot()
        const instance = testRenderer.root;
        const texts = instance.findAllByType("Text");
        expect(texts.length).toBe(9);
 
        expect(texts[3].children).toEqual(['Hannover Hbf nach Bielefeld Hbf']);
        expect(texts[5].children).toEqual(['ab: 11:38, an: 11:52, Dauer: 0:14, Umstiege: 0']);
        expect(texts[6].children).toEqual(['Hannover Hbf nach Bielefeld Hbf']);
        expect(texts[8].children).toEqual(['ab: 23:58, an: 00:12(+1 Tag), Dauer: 0:14, Umstiege: 0']);
    }
});