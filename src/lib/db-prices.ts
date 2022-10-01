import prices from 'db-prices';
import moment, { Moment } from 'moment';
import { Journey } from 'hafas-client';
import { Bahncard } from 'db-prices';
import { JourneyParams } from './hafas';

const compare = (a: Journey, b: Journey) => {
    const comparePrice = (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity);
    if (comparePrice === 0 && a.legs[0].departure && b.legs[0].departure) {
        const a_departure = moment(a.legs[0].departure);
        const b_departure = moment(b.legs[0].departure);
        return a_departure.diff(b_departure);
    }
    return comparePrice;
}

const adjust = (j: Journey): Journey => {
    j.legs.map(l => {
        l.reachable = true;
        if (l.plannedDeparture === undefined) l.plannedDeparture = l.departure;
        if (l.plannedArrival === undefined) l.plannedArrival = l.arrival;
        return l;
    });
    return j;
}

const filter = (j: Journey, minHour: number): boolean => {
    const departure = j.legs[0]?.departure;
    const arrival = j.legs && j.legs.length > 0 ? j.legs[j.legs.length - 1]?.arrival : undefined;
    if (departure) {
        const dtDeparture = new Date(departure);
        if (dtDeparture.getHours() < minHour) return false;
    }
    if (departure && arrival) {
        const dtDeparture = new Date(departure);
        const dtArrival = new Date(arrival);
        if (dtDeparture.getDate() !== dtArrival.getDate()) return false;
    }

    return true;
}

const convertBahncardClass = (bahncardDiscount: number, bahncardClass: number): Bahncard => {
    if (bahncardClass === 1 && bahncardDiscount === 25) return 1;
    else if (bahncardClass === 2 && bahncardDiscount === 25) return 2;
    else if (bahncardClass === 1 && bahncardDiscount === 50) return 3;
    else if (bahncardClass === 2 && bahncardDiscount === 50) return 4;
    else return 0;
}

export const dbPrices = (from: string, to: string, date = new Date(), days = 0, journeyParams: JourneyParams, minHour = 6): Promise<Journey[]> => {
    const day = moment(date).set('hour', 0).set('minute', 0).set('second', 0);

    const travellerClass= journeyParams.firstClass ? 1 : 2;
    const bahncard = convertBahncardClass(journeyParams.bahncardDiscount, journeyParams.bahncardClass);
    const age = journeyParams.age;

    if (days <= 0) {
        return prices(from, to, day.toDate(), {
            class: travellerClass, travellers: [{ typ: 'E', bc: bahncard, alter: age }],
        })
            .then(journeys => {
                const adjusted = journeys.map(adjust);
                adjusted.sort(compare);
                return adjusted;
            })
            .catch(err => {
                console.error('dbPrices:', err);
                return [];
            });
    }
    else {
        const dates: Moment[] = Array.from(Array(days).keys()).map(n => {
            const dt = moment(day).add(n, 'd');
            return moment(dt);
        });

        const requests: Promise<Journey[]>[] = dates.map(dt => {
            const p: Promise<Journey[]> = prices(from, to, dt.toDate(), {
                class: travellerClass, travellers: [{ typ: 'E', bc: bahncard }],
            });

            return p;
        });

        return Promise.all(requests)
            .then((result: Journey[][]) => {
                return result
                    .map(journeys => {
                        if (journeys && journeys.length > 0) {
                            const filtered = journeys.filter(j => filter(j, minHour));
                            filtered.sort(compare);
                            return filtered[0];
                        }
                    })
                    .filter((j): j is Journey => j !== undefined)
                    .map(adjust);
            })
            .catch(err => {
                console.error('dbPrices:', err);
                return [];
            });
    }
}
