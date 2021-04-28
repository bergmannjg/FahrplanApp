import { Fahrzeug } from ".//trainformation";
import { baureihe, getName } from './baureihe';
import { imageName } from './wagonimage';

export interface Fahrzeuginfo {
    fahrzeugnummer?: string;
    zuggattung: string;
    name?: string;
    BRWagen?: string;
    fahrzeugtyp?: string;
    baureihe?: string;
    identifier?: string;
    image?: string;
}

export function fahrzeuginfo(f: Fahrzeug, zuggattung: string): Fahrzeuginfo {
    const br = f.fahrzeugnummer ? baureihe(f.fahrzeugnummer, []) : undefined;
    const name = br ? getName(br) : f.fahrzeugtyp;
    const image = imageName(f, zuggattung, br?.identifier)

    return { fahrzeugnummer: f.fahrzeugnummer, zuggattung, name: name, BRWagen: br?.BRWagen, fahrzeugtyp: f.fahrzeugtyp, baureihe: br?.BR, identifier: br?.identifier, image: image };
}
