import { Fahrzeug } from ".//trainformation";
import { baureihe, getName, getWikiTitle } from './baureihe';
import { imageName } from './wagonimage';

export interface Fahrzeuginfo {
    fahrzeugnummer?: string;
    zuggattung: string;
    baureihename?: string;
    url?: string;
    BRWagen?: string;
    fahrzeugtyp?: string;
    baureihe?: string;
    identifier?: string;
    image?: string;
}

export function fahrzeuginfo(f: Fahrzeug, zuggattung: string): Fahrzeuginfo {
    const br = f.fahrzeugnummer ? baureihe(f.fahrzeugnummer, []) : undefined;
    const baureihename = br ? getName(br) : f.fahrzeugtyp;
    const title = baureihename ? getWikiTitle(baureihename) : undefined;
    const prefix = 'https://de.wikipedia.org/wiki/';
    const url = title ? (prefix + title) : undefined;
    const image = imageName(f, zuggattung, br?.identifier)

    return { fahrzeugnummer: f.fahrzeugnummer, zuggattung, baureihename: baureihename, url: url, BRWagen: br?.BRWagen, fahrzeugtyp: f.fahrzeugtyp, baureihe: br?.BR, identifier: br?.identifier, image: image };
}
