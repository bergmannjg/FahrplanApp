declare module 'db-prices' {
    import { Journey } from 'hafas-client';
    export type Bahncard = 0
        | 1 /*BahnCard 25 1. Klasse*/
        | 2 /*BahnCard 25 2. Klasse*/
        | 3 /*BahnCard 50 1. Klasse*/
        | 4 /*BahnCard 50 2. Klasse*/;
    export interface Traveller { bc: Bahncard; typ: 'E' | 'K' | 'B'; alter?: number }
    export interface Options { class?: 1 | 2; travellers?: Traveller[]; preferFastRoutes?: boolean; noICETrains?: boolean }
    function prices(from: string, to: string, day?: Date, opt?: Options): Promise<Journey[]>;
    namespace prices { } // This is a hack to allow ES6 wildcard imports
    export = prices;
}