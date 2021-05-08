// see https://github.com/marudor/BahnhofsAbfahrten/blob/main/packages/server/Reihung/getBR.ts

import type { Fahrzeug } from './trainformation';

export interface BRInfo {
    name: string;
    BR?: string;
    BRWagen?: string;
    identifier?: string;
    noPdf?: boolean;
    country?: 'DE' | 'AT';
    showBRInfo?: boolean;
}

const getATBR = (
    code: string,
    _serial: string,
    _fahrzeuge: Fahrzeug[],
): undefined | Omit<BRInfo, 'name'> => {
    switch (code) {
        case '4011':
            return {
                BR: '411',
                identifier: '411.S1',
            };
    }
};
const getDEBR = (
    code: string,
    uicOrdnungsnummer: string,
    fahrzeuge: Fahrzeug[],
): undefined | Omit<BRInfo, 'name'> => {
    switch (code) {
        case '0812':
        case '1412':
        case '1812':
        case '2412':
        case '2812':
        case '3412':
        case '4812':
        case '5812':
        case '6412':
        case '6812':
        case '7412':
        case '7812':
        case '8812':
        case '9412':
        case '9812': {
            let identifier: '412' | '412.13' | '412.7' = '412';
            switch (fahrzeuge.length) {
                case 13:
                    identifier = '412.13';
                    break;
                case 7:
                    identifier = '412.7';
                    break;
            }
            return {
                identifier,
                BR: '412',
                BRWagen: code.substr(1, 3) + '.' + uicOrdnungsnummer.substr(0, 1),
                noPdf: fahrzeuge.length !== 12,
            };
        }
        case '5401':
        case '5801':
        case '5802':
        case '5803':
        case '5804': {
            let identifier: '401' | '401.LDV' | '401.9' = '401';
            let noPdf: boolean | undefined = undefined;
            if (fahrzeuge.length === 11) {
                if (
                    fahrzeuge.filter((f) => f.kategorie?.includes('ERSTEKLASSE')).length === 2
                ) {
                    identifier = '401.LDV';
                } else {
                    identifier = '401.9';
                }
                noPdf = true;
            }
            return {
                identifier,
                BR: '401',
                BRWagen: code.substr(1, 3) + '.' + uicOrdnungsnummer.substr(0, 1),
                noPdf,
            };
        }
        case '5402':
        case '5805':
        case '5806':
        case '5807':
        case '5808':
            return {
                BR: '402',
                BRWagen: code.substr(1, 3) + '.' + uicOrdnungsnummer.substr(0, 1),
                identifier: '402',
            };
        case '5403':
            return {
                BR: '403',
                identifier: `403.S${Number.parseInt(uicOrdnungsnummer.substr(1), 10) <= 37 ? '1' : '2'
                    }`,
            };
        case '5406':
            return {
                BR: '406',
                identifier: '406',
            };
        case '5407':
            return {
                BR: '407',
                identifier: '407',
            };
        case '5410':
            return {
                BR: '410.1',
                identifier: '410.1',
                noPdf: true,
            };
        case '5411':
            return {
                BR: '411',
                BRWagen: code.substr(1, 3) + '.' + uicOrdnungsnummer.substr(0, 1),
                identifier: `411.S${Number.parseInt(uicOrdnungsnummer, 10) <= 32 ? '1' : '2'
                    }`,
            };
        case '5415':
            return {
                BR: '415',
                identifier: '415',
            };
        case '5475':
            return {
                identifier: 'TGV',
                noPdf: true,
            };
    }
};

const nameMap: {
    [K in string]: string;
} = {
    '401': 'ICE 1 (BR401)',
    '401.9': 'ICE 1 Kurz (BR401)',
    '401.LDV': 'ICE 1 LDV (BR401)',
    '402': 'ICE 2 (BR402)',
    '403': 'ICE 3 (BR403)',
    '403.S1': 'ICE 3 (BR403 1. Serie)',
    '403.S2': 'ICE 3 (BR403 2. Serie)',
    '403.R': 'ICE 3 (BR403 Redesign)',
    '406': 'ICE 3 (BR406)',
    '406.R': 'ICE 3 (BR406 Redesign)',
    '407': 'ICE 3 Velaro (BR407)',
    '410.1': 'ICE S (BR410.1)',
    '411': 'ICE T (BR411)',
    '411.S1': 'ICE T (BR411 1. Serie)',
    '411.S2': 'ICE T (BR411 2. Serie)',
    '412': 'ICE 4 (BR412)',
    '412.7': 'ICE 4 Kurz (BR412)',
    '412.13': 'ICE 4 Lang (BR412)',
    '415': 'ICE T Kurz (BR415)',
    'IC2.TWIN': 'IC 2 (Twindexx)',
    'IC2.KISS': 'IC 2 (KISS)',
    MET: 'MET',
    TGV: 'TGV',
};

export function getName(br: Omit<BRInfo, 'name'>): string | undefined {
    if (br.identifier) return nameMap[br.identifier];
}

const wikiTitleMap: {
    [K in string]: string;
} = {
    'ICE 1 (BR401)': 'ICE_1',
    'ICE 1 Kurz (BR401)': 'ICE_1',
    'ICE 1 LDV (BR401)': 'ICE_1',
    'ICE 2 (BR402)': 'ICE_2',
    'ICE 3 (BR403)': 'ICE_3',
    'ICE 3 (BR403 1. Serie)': 'DB-Baureihe_403_(1997)',
    'ICE 3 (BR403 2. Serie)': 'DB-Baureihe_403_(1997)',
    'ICE 3 (BR403 Redesign)': 'ICE_3',
    'ICE 3 (BR406)': 'DB-Baureihe_406',
    'ICE 3 (BR406 Redesign)': 'DB-Baureihe_406',
    'ICE 3 Velaro (BR407)': 'DB-Baureihe_407',
    'ICE S (BR410.1)': 'ICE_1',
    'ICE T (BR411)': 'ICE_T',
    'ICE T (BR411 1. Serie)': 'ICE_T',
    'ICE T (BR411 2. Serie)': 'ICE_T',
    'ICE 4 (BR412)': 'ICE_4',
    'ICE 4 Kurz (BR412)': 'ICE_4',
    'ICE 4 Lang (BR412)': 'ICE_4',
    'ICE T Kurz (BR415)': 'ICE_T',
    'IC 2 (Twindexx)': 'Intercity_2_(Deutsche_Bahn)',
    'IC 2 (KISS)': 'Intercity_2_(Deutsche_Bahn)',
    'MET': 'Metropolitan',
    'TGV': 'TGV',
};

export function getWikiTitle(name?: string): string | undefined {
    if (name) return wikiTitleMap[name];
}

export function baureihe(
    fahrzeugnummer: string,
    fahrzeuge: Fahrzeug[],
): undefined | Omit<BRInfo, 'name'> {
    const country = fahrzeugnummer.substr(2, 2);
    const code = fahrzeugnummer.substr(4, 4);
    const serial = fahrzeugnummer.substr(8, 3);

    let info;

    switch (country) {
        case '80':
            info = getDEBR(code, serial, fahrzeuge);
            break;
        case '81':
            info = getATBR(code, serial, fahrzeuge);
            break;
    }

    return info;
}
