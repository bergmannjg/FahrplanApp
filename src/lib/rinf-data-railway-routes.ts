import { rinfgraph } from 'rinf-data/rinfgraph.bundle';
import type { GraphNode, OpInfo, LineInfo, Location, PathElement } from 'rinf-data/rinfgraph.bundle';

interface Haltestelle {
    EVA_NR: number;
    DS100: string;
    Verkehr: string;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const g = require('rinf-data/data/Graph.json') as GraphNode[];
// eslint-disable-next-line @typescript-eslint/no-var-requires
const opInfos = require('rinf-data/data/OpInfos.json') as OpInfo[];
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lineInfos = require('rinf-data/data/LineInfos.json') as LineInfo[];
// eslint-disable-next-line @typescript-eslint/no-var-requires
const haltestellen = require('../../db-data/uic-to-opid.json') as Haltestelle[];

interface LineNode {
    name: string;
    opid: string;
    km: string;
    maxSpeed?: number;
}

const mapOps = opInfos.reduce((map: Map<string, OpInfo>, op: OpInfo) => map.set(op.UOPID, op), new Map());
const mapLines = lineInfos.reduce((map: Map<string, LineInfo>, line: LineInfo) => map.set(line.Line, line), new Map());
const graph = rinfgraph.Graph_toGraph(g);

// missing data
const missingDS100: Map<string, string> = new Map().set('EBILP', 'EBIL').set('UE  P', 'UE').set('MH  S', 'MH');

function findDS100ForUicRef(uicref: number): string | undefined {
    const haltestelle = haltestellen.find(h => h.EVA_NR === uicref);
    if (haltestelle) return missingDS100.get(haltestelle.DS100) ?? haltestelle.DS100;
    else {
        console.log('uic not found: ', uicref);
    }
}

function rinfGetLineName(line: number): string {
    return mapLines.get(line.toString())?.Name ?? line.toString();
}

function rinfToPathElement(n: GraphNode): PathElement {
    return rinfgraph.Graph_toPathElement(mapOps, mapLines, n);
}

function rinfIsWalkingPath(n: GraphNode): boolean {
    return rinfgraph.Graph_isWalkingPath(n);
}

function rinfToLineNode(n: GraphNode): LineNode {
    return {
        name: mapOps.get(n.Node)?.Name ?? n.Node,
        opid: n.Node,
        km: n.Edges[0].StartKm.toFixed(3),
        maxSpeed: n.Edges[0].MaxSpeed
    }
}

function toLineNodes(nodes: GraphNode[]): LineNode[] {
    if (nodes.length === 0) return [];
    const lastNode = nodes[nodes.length - 1];
    const lastElement: LineNode = {
        name: mapOps.get(lastNode.Edges[0].Node)?.Name ?? lastNode.Edges[0].Node,
        opid: lastNode.Edges[0].Node,
        km: (lastNode.Edges[0].StartKm + lastNode.Edges[0].Length).toFixed(3)
    }
    return nodes.map(n => rinfToLineNode(n)).concat([lastElement]);
}

function rinfToLineNodes(nodesList: GraphNode[][]): LineNode[] {
    return nodesList.map(nodes => toLineNodes(nodes))
        .reduce((accumulator, value) => accumulator.concat(value), []);
}
function removeDuplicates(arr: Array<number>) {
    const temp: Array<number> = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== arr[i + 1]) { temp.push(arr[i]); }
    }
    return temp;
}

function ds100ToUOPID(ds100pattern: string) {
    const ds100 = ds100pattern.split(',')[0];
    return 'DE' + ' '.repeat(5 - ds100.length) + ds100;
}

/*
haltestellen.forEach(h => {
    if (h.Verkehr !== 'nur DPN') {
        const opId = ds100ToUOPID(h.DS100);
        if (!mapOps.get(opId)) {
            console.log('no OPID for ', h.DS100);
        }
    }
})
*/

function findDs100PatternsForUicrefs(uicrefs: number[]) {
    return uicrefs
        .map(uicref => findDS100ForUicRef(uicref))
        .map(ds100 => ds100ToUOPID(ds100 ?? ''))
        .filter(opId => {
            const op = mapOps.get(opId)
            if (!op) {
                console.log('opId not found: ', opId);
            }
            return op;
        });
}

function rinfFindRailwayRoutesOfTrip(ids: string[]): GraphNode[] {
    return rinfgraph.Graph_getShortestPathFromGraph(g, graph, ids);
}

function rinfFindRailwayRoutesOfLine(line: number): GraphNode[][] {
    return lineInfos
        .filter(li => li.Line === line.toString())
        .map(li => rinfgraph.Graph_getPathOfLineFromGraph(g, graph, li))
        .sort((a, b) => a[0].Edges[0].StartKm - b[0].Edges[0].StartKm);
}

function rinfFindRailwayRoutesOfTripIBNRs(uic_refs: number[]): GraphNode[] {
    const ids = findDs100PatternsForUicrefs(removeDuplicates(uic_refs));
    console.log('uic_refs:', uic_refs)
    console.log('opids:', ids)
    return rinfFindRailwayRoutesOfTrip(ids);
}

function rinfGetCompactPath(path: GraphNode[]): GraphNode[] {
    return rinfgraph.Graph_getCompactPath(path);
}

function rinfGetLocationsOfPath(path: GraphNode[]): Location[][] {
    return rinfgraph.Graph_getLocationsOfPath(g, mapOps, path);
}

function rinfComputeDistanceOfPath(path: GraphNode[]): number {
    return path.reduce((accu: number, r) => {
        return accu + r.Edges[0].Length;
    }, 0)
}

export { rinfToPathElement, rinfIsWalkingPath, rinfToLineNodes, rinfFindRailwayRoutesOfTrip, rinfFindRailwayRoutesOfTripIBNRs, rinfGetLineName, rinfFindRailwayRoutesOfLine, rinfGetCompactPath, rinfComputeDistanceOfPath, rinfGetLocationsOfPath }

export type { PathElement, LineNode }