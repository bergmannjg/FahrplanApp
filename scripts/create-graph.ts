#!/usr/bin/env ts-node-script

// create graph for shortest path algorithm
// requires ts-node (https://github.com/TypeStrong/ts-node)

import { createGraph } from '../src/lib/db-data-graph'
const fs = require('fs');

const g = createGraph();

fs.writeFile("./db-data/generated/graph.json", JSON.stringify(g), function (err: any) {
    if (err) {
        console.log(err);
    }
});

