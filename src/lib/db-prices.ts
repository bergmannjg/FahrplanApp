import moment, { Moment } from 'moment';
import { Journey, JourneysOptions, Journeys } from 'hafas-client';
import { JourneyParams } from './hafas';
import { fshafas } from "fs-hafas-client";
import { profiles } from "fs-hafas-profiles";

const compare = (a: Journey, b: Journey) => {
    const comparePrice = (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity);
    if (comparePrice === 0 && a.legs[0].departure && b.legs[0].departure) {
        const a_departure = moment(a.legs[0].departure);
        const b_departure = moment(b.legs[0].departure);
        return a_departure.diff(b_departure);
    }
    return comparePrice;
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

export const dbPrices = (from: string, to: string, date = new Date(), days = 1, journeyParams: JourneyParams, via?: string, minHour = 6): Promise<Journey[]> => {
    const day = moment(date).set('hour', 0).set('minute', 0).set('second', 0);
    const loyaltyCard = journeyParams.bahncardDiscount > 0 ? { type: 'Bahncard', discount: journeyParams.bahncardDiscount, class: journeyParams.bahncardClass } : undefined; // todo: per parameter
    const options: JourneysOptions = { departure: date, age: journeyParams.age, firstClass: journeyParams.firstClass, loyaltyCard, via }
    if (days <= 1) {
        return fshafas.bestprices(profiles.getProfile('db'), from, to, options)
            .then(journeys => {
                const adjusted = [...(journeys.journeys ?? [])].filter(j => j.price);
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

        const requests: Promise<Journeys>[] = dates.map(dt => {
            const _options: JourneysOptions = { ...options };
            _options.departure = dt.toDate();
            const p: Promise<Journeys> = fshafas.bestprices(profiles.getProfile('db'), from, to, _options);

            return p;
        });

        return Promise.all(requests)
            .then((result: Journeys[]) => {
                return result
                    .map(journeys => {
                        if (journeys.journeys && journeys.journeys.length > 0) {
                            const filtered = journeys.journeys.filter(j => j.price && filter(j, minHour));
                            filtered.sort(compare);
                            return filtered[0];
                        }
                    })
                    .filter((j): j is Journey => j !== undefined);
            })
            .catch(err => {
                console.error('dbPrices:', err);
                return [];
            });
    }
}
