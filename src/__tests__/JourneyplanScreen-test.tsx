import React from 'react';
import JourneyplanScreen from '../screens/Journeyplan';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationDE from '../locales/de/translation.json';
import TestRenderer from 'react-test-renderer';
import { hafas } from '../lib/hafas';
import moment from 'moment';
import { Journey, Station } from 'hafas-client';

debugger

jest.mock('hafas-client', () => (profile: any, name: string) => {
    return {}
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

const mockHannover: Station = { type: 'station', name: 'Hannover Hbf', id: '8000152', location: { type: 'location', longitude: 0, latitude: 0 } };
const mockBielefeld: Station = { type: 'station', name: 'Bielefeld Hbf', id: '8000036', location: { type: 'location', longitude: 0, latitude: 0 } };

const journey: Journey = {
    type: 'journey',
    legs: [{
        origin: mockHannover,
        destination: mockBielefeld,
        departure: '2020-03-30T11:38:00+02:00',
        plannedDeparture: '2020-03-30T11:38:00+02:00',
        arrival: '2020-03-30T11:52:00+02:00',
        plannedArrival: '2020-03-30T11:52:00+02:00',
        reachable: true,
        tripId: '',
        departurePlatform: '',
        arrivalPlatform: '',
        direction: '',
        departureDelay: 0,
        arrivalDelay: 0
    }]
};

const client = hafas('db');

const createTestProps = (props: any) => ({
    navigation: {
        navigate: jest.fn()
    },
    route: {
        params: {
            journey: client.journeyInfo(journey),
            tripDetails: true,
            client: client
        }
    },
    ...props
});

it('renders JourneyplanScreen correctly', async () => {
    const props = createTestProps({});
    let testRenderer: any;
    await TestRenderer.act(() => {
        testRenderer = TestRenderer.create(<JourneyplanScreen {...props} />);
        return Promise.resolve();
    });
    if (testRenderer) {
        const tree = testRenderer.toJSON();
        expect(tree).toMatchSnapshot();
        const instance = testRenderer.root;
        const texts = instance.findAllByType("Text");
        expect(texts.length).toBe(5);
        expect(texts[2].children).toEqual(['Hannover Hbf', ' ', 'nach', ' ', 'Bielefeld Hbf']);
        expect(texts[3].children).toEqual(['Abfahrt 30.03.20 11:38', '']);
        expect(texts[4].children).toEqual(['Ankunft 30.03.20 11:52', '']);
    }
});