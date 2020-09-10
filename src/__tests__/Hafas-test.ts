import { hafas } from '../lib/hafas';
import { Journey, Stop, Trip, Leg, Line, StopOver } from 'hafas-client';

const asyncGetLocationsOfBielefeldCorrectly = () => {
    expect.assertions(3);
    const client = hafas('db');
    return client.locations('Bielefeld', 1)
        .then(locations => {
            expect(locations.length).toBe(1);
            expect(locations[0].name).toBe('Bielefeld Hbf');
            expect(locations[0].id).toBe('8000036');
        });
}

const asyncGetLocationsOfHannoverCorrectly = () => {
    expect.assertions(3);
    const client = hafas('db');
    return client.locations('Hannover', 1)
        .then((locations) => {
            expect(locations.length).toBe(1);
            expect(locations[0].name).toBe('Hannover Hbf');
            expect(locations[0].id).toBe('8000152');
        });
}

const asyncGetJourneyCorrectly = () => {
    expect.assertions(3);
    const client = hafas('db');
    return client.journeys('Hannover', 'Bielefeld', 1)
        .then(journeys => {
            expect(journeys.length).toBe(1);
            const info = client.journeyInfo(journeys[0]);
            expect(info.originName).toBe('Hannover Hbf');
            expect(info.destinationName).toBe('Bielefeld Hbf');
        });
}

const asyncGetStopssOfJourneyCorrectly = () => {
    expect.assertions(2);
    const client = hafas('db');
    return client.journeys('Hannover', 'Bielefeld', 1)
        .then(journeys => {
            expect(journeys.length).toBe(1);
            return client.stopssOfJourney(journeys[0], ['train']);
        }).then(stops => {
            expect(stops.length).toBe(3);
        });
}

jest.mock('hafas-client', () => (profile: any, clientName: string) => {
    const origin: Stop = { name: 'Hannover Hbf', id: '8000152', type: 'stop', products: { "train": true } };
    const destination: Stop = { name: 'Bielefeld Hbf', id: '8000036', type: 'stop', products: { "train": true } };
    const Minden: Stop = { name: 'Minden Hbf', id: '8000252', type: 'stop', products: { "train": true } };
    const plannedDeparture = '2020-03-30T11:38:00+02:00';
    const plannedArrival = '2020-03-30T11:52:00+02:00';
    const departure = plannedDeparture;
    const arrival = plannedArrival;
    const line: Line = { type: 'line', mode: 'train' };
    const stopovers: StopOver[] = [{ stop: origin }, { stop: Minden }, { stop: destination }];
    const tripSample: Trip = { id: 'abcd', origin, destination, departure, plannedDeparture, arrival, plannedArrival, stopovers, line };
    const legSample: Leg = { origin, destination, tripId: tripSample.id, plannedDeparture, plannedArrival, line };

    const locations = (query: string) => {
        console.log('mocked locations:', query);
        const stops = stopovers.filter(so => so.stop.name?.startsWith(query)).map(so => so.stop);
        return Promise.resolve(stops);
    }
    const journeys = (from: string, to: string) => {
        console.log('mocked journeys:', from, to);
        return Promise.resolve({ journeys: [{ type: 'journey', legs: [legSample] }] });
    }
    const trip = (id: string, name: string) => {
        return Promise.resolve(tripSample);
    }
    return { locations, journeys, trip }
});

it('async get locations of Bielefeld correctly', asyncGetLocationsOfBielefeldCorrectly);

it('async get locations of Hannover correctly', asyncGetLocationsOfHannoverCorrectly);

it('async get journey of correctly', asyncGetJourneyCorrectly);

it('async get async_get_stopssOfJourney_of_correctly of correctly', asyncGetStopssOfJourneyCorrectly);

