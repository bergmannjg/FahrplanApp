import moment from 'moment-timezone';
import tzlookup from "tz-lookup";
import cache from 'js-cache';
import { Location } from 'hafas-client';

// utils for ISO 8601 date strings, to show time in local time at stations
// all times in legs of hafas as are in local time
// strategy 1) use date strings with func extractTimeOfDatestring
// strategy 2) use date strings and location with func momentAtLocation

// parse ISO 8601 date string
export function parseDatestring(datestring: string): {
    datestring: string;
    year: string;
    month: string;
    day: string;
    hour: string;
    minute: string;
    second: string;
    tz_op: string;
    tz_hour: string;
    tz_minute: string;
    timezoneOffset: number;
} | undefined {
    const re = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-])(\d{2}):(\d{2})/;
    const found = datestring.match(re);
    if (found && found.length === 10) {

        // compatible to Date.getTimezoneOffset
        const getTimezoneOffset = (tzop: string, tzhour: string) => {
            const parsed = parseInt(tzhour, 10);
            const factor = tzop === '+' ? -1 : 1;
            return factor * parsed * 60;
        }

        const res = {
            datestring,
            year: found[1],
            month: found[2],
            day: found[3],
            hour: found[4],
            minute: found[5],
            second: found[6],
            tz_op: found[7],
            tz_hour: found[8],
            tz_minute: found[9],
            timezoneOffset: getTimezoneOffset(found[7], found[8])
        };

        return res;
    } else {
        return undefined;
    }
}

export function extractTimeOfDatestring(datestring: string): string {
    const dt = parseDatestring(datestring);
    if (dt) {
        return dt.hour + ':' + dt.minute;
    } else {
        return datestring;
    }
}

export function getTimezoneOfLocation(location: Location): string {
    const key = location.latitude + '-' + location.longitude;
    const value = cache.get(key);
    if (value) {
        console.log('found:', key, value);
        return value;
    } else if (location.latitude && location.longitude) {
        const tz = tzlookup(location.latitude, location.longitude);
        cache.set(key, tz);
        return tz;
    } else {
        return "";
    }
}

export function momentAtLocation(datestring: string, location: Location): moment.Moment {
    const m = moment(datestring).tz(getTimezoneOfLocation(location));
    return m;
}

export interface MomentWithTimezone {
    hasTimezone: boolean;
    moment: moment.Moment
}
export function momentWithTimezone(datestring: string, location?: Location): MomentWithTimezone {

    const d = new Date();
    const tz = d.getTimezoneOffset();
    const dtDate = parseDatestring(datestring);
    const hasTimezone = tz !== dtDate?.timezoneOffset && location !== undefined;
    const momentOfDate = hasTimezone && location ?
        momentAtLocation(datestring, location)
        : moment(datestring);

    return { hasTimezone, moment: momentOfDate };
}