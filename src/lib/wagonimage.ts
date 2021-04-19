// see https://github.com/marudor/BahnhofsAbfahrten/blob/main/packages/client/Common/Components/Reihung/WagenLink.tsx

import type { Fahrzeug } from './trainformation';

const wagenWithImage = [
    'ARkimbz',
    'ARkimmbz',
    'Apmmz',
    'Avmmz',
    'Avmz',
    'Bimmdzf',
    'Bpmbz',
    'Bpmmbdz',
    'Bpmmbdzf',
    'Bpmmbz',
    'Bpmmdz',
    'Bpmmz',
    'Bvmmsz',
    'Bvmmz',
    'Bvmsz',
    'DApza',
    'DBpza',
    'DBpbzfa',
];

const allowedTypes = ['IC', 'ICE'];

const seriesRegex = /\.S(\d)/;

// url https://lib.finalrewind.org/dbdb/db_wagen/xxx.png
export function imageName(fahrzeug: Fahrzeug, zuggattung: string, identifier?: string): string | undefined {
    if (
        !allowedTypes.includes(zuggattung) ||
        fahrzeug.kategorie === 'TRIEBKOPF' ||
        fahrzeug.kategorie === 'LOK'
    ) {
        return;
    }
    if (
        (!identifier || identifier === 'IC2.TWIN') &&
        fahrzeug.fahrzeugtyp && wagenWithImage.includes(fahrzeug.fahrzeugtyp)
    ) {
        return fahrzeug.fahrzeugtyp;
    }

    if (fahrzeug.fahrzeugnummer && identifier && identifier !== 'TGV' && identifier !== 'MET') {
        let relevantUIC = fahrzeug.fahrzeugnummer.substr(4, 5);
        if (identifier.endsWith('R')) {
            relevantUIC += '.r';
        } else if (identifier.includes('.S')) {
            // @ts-expect-error this works
            relevantUIC += `.${seriesRegex.exec(identifier)[1]}`;
        }
        return relevantUIC;
    }
}