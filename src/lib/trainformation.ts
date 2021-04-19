import moment from 'moment';

require('isomorphic-fetch');

export interface Meta {
    id?: string;
    owner?: string;
    format?: string;
    version?: string;
    created?: Date;
    sequence?: number;
}

export interface Fahrzeugausstattung {
    anzahl?: string;
    ausstattungsart?: string;
    bezeichnung?: string;
    status?: string;
}

export interface Positionamhalt {
    endemeter?: string;
    endeprozent?: string;
    startmeter?: string;
    startprozent?: string;
}

export interface Fahrzeug {
    allFahrzeugausstattung?: Fahrzeugausstattung[];
    kategorie?: string;
    fahrzeugnummer?: string;
    orientierung?: string;
    positioningruppe?: string;
    fahrzeugsektor?: string;
    fahrzeugtyp?: string;
    wagenordnungsnummer?: string;
    positionamhalt?: Positionamhalt;
    status?: string;
}

export interface Fahrzeuggruppe {
    allFahrzeug?: Fahrzeug[];
    fahrzeuggruppebezeichnung?: string;
    zielbetriebsstellename?: string;
    startbetriebsstellename?: string;
    verkehrlichezugnummer?: string;
}

export interface Positionamgleis {
    endemeter?: string;
    endeprozent?: string;
    startmeter?: string;
    startprozent?: string;
}

export interface AllSektor {
    positionamgleis?: Positionamgleis;
    sektorbezeichnung?: string;
}

export interface Halt {
    abfahrtszeit?: Date;
    ankunftszeit?: Date;
    bahnhofsname?: string;
    evanummer?: string;
    gleisbezeichnung?: string;
    haltid?: string;
    rl100?: string;
    allSektor?: AllSektor[];
}

export interface Istformation {
    fahrtrichtung?: string;
    allFahrzeuggruppe?: Fahrzeuggruppe[];
    halt?: Halt;
    liniebezeichnung?: string;
    zuggattung?: string;
    zugnummer?: string;
    serviceid?: string;
    planstarttag?: string;
    fahrtid?: string;
    istplaninformation?: boolean;
}

export interface Data {
    istformation?: Istformation;
}

export interface Trainformation {
    meta?: Meta;
    data?: Data;
}

function extractDateString(s: string) {
    if (s.length === 12) return s;
    else if (s.length === 25) { // iso
        const dt = new Date(s)
        const dateString = moment(dt).format('YYYYMMDDHHmm');
        return dateString;
    } else return undefined;
}

export function trainformation(id: string, date: string): Promise<Trainformation | undefined> {
    const dt = extractDateString(date);
    if (dt) {
        const url = 'https://www.apps-bahn.de/wr/wagenreihung/1.0/' + id + '/' + dt
        console.log(url);
        return fetch(url)
            .then(function (response) {
                if (response.status >= 300) {
                    console.warn(response.status, response.statusText);
                    throw new Error("Bad response from server");
                }
                return response.json()
            }).catch(error => {
                console.warn(error);
                return undefined;
            });
    } else {
        return Promise.resolve(undefined);
    }
}

