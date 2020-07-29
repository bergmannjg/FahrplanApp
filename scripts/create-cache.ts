#!/usr/bin/env ts-node-script

// create matchings of a two station trip and the corresponding railway route numbers to avoid complex search
// requires ts-node (https://github.com/TypeStrong/ts-node)

import { findRailwayRoutesOfTrip, RailwayRouteCache } from '../src/lib/db-data-railway-routes'
const fs = require('fs');

const cache: RailwayRouteCache[] = [];

const stopsForCache = [
    [8011113, 8010089], // Berlin Südkreuz Dresden-Neustadt
    [8000105, 8000244], // Frankurt(Main)Hbf Mannheim Hbf
    [8070003, 8000207], // Frankfurt(M) Flughafen Fernbf Köln
    [8070003, 8000244], // Frankfurt(M) Flughafen Fernbf Mannheim Hbf
    [8002549, 8010324], // Hamburg Hbf Schwerin Hbf
    [8002548, 8003102], // Hamburg Dammtor Itzehoe
    [8000149, 8000142], // Hamm Hagen
    [8000152, 8098160], // Hannover Berlin
    [8000152, 8010404], // Hannover Spandau
    [8000152, 8002549], // Hannover Hamburg 
    [8000152, 8006552], // Hannover Wolfsburg
    [8000156, 8000096], // Heidelberg Hbf Stuttgart Hbf
    [8000207, 8005556], // Köln Hbf Siegburg/Bonn
    [8000284, 8000261], // Nürnberg München
    [8000284, 8000260], // Nürnberg Würzburg 
    [8000284, 8000183], // Nürnberg Ingolstadt
    [8000266, 8000087, 8000207], // Wuppertal - Solingen - Köln
];

stopsForCache.forEach(s => {
    if (s.length == 2) {
        cache.push({ uicFrom: s[0], uicTo: s[1], railwayRoutes: findRailwayRoutesOfTrip(s, false) });
        s.reverse();
        cache.push({ uicFrom: s[0], uicTo: s[1], railwayRoutes: findRailwayRoutesOfTrip(s, false) });
    } else if (s.length == 3) {
        cache.push({ uicFrom: s[0], uicTo: s[2], railwayRoutes: findRailwayRoutesOfTrip(s, false) });
        s.reverse();
        cache.push({ uicFrom: s[0], uicTo: s[2], railwayRoutes: findRailwayRoutesOfTrip(s, false) });
    }
})

fs.writeFile("./db-data/generated/RailwayRouteCache.json", JSON.stringify(cache), function (err: any) {
    if (err) {
        console.log(err);
    }
});
