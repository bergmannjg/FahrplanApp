#!/usr/bin/env ts-node-script
// search for stations of typ 'FV' not in betriebsstellen_open_data.json

import type { Stop, BetriebsstelleRailwayRoutePosition } from '../src/lib/db-data'

const stations = require('../db-data/original/D_Bahnhof_2020_alle.json') as Array<Stop>
const betriebsstellen = require('../db-data/original/betriebsstellen_open_data.json') as Array<BetriebsstelleRailwayRoutePosition>

stations.forEach(s => {
    if (s.Verkehr === "FV") {
        const splitDs100 = s.DS100.split(',');
        const countFound = splitDs100.reduce((accu, ds) => {
            const entry = betriebsstellen.find(bs => bs.KUERZEL === ds);
            if (entry) accu++;
            return accu;
        }, 0)
        if (countFound === 0) {
            console.log('ds100 not found:', s.DS100, s.NAME)
        }
    }
})
