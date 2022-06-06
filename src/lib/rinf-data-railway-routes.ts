import { rinfgraph } from 'rinf-graph/rinfgraph.bundle';
import type { GraphNode, OpInfo, LineInfo, Location, PathElement } from 'rinf-graph/rinfgraph.bundle';

interface DBHaltestelle {
    EVA_NR: number;
    DS100: string;
    Verkehr: string;
}

interface ÖBBHaltestelle {
    EVA_NR: number;
    DB640_CODE: string;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const g = require('rinf-graph/data/Graph.json') as GraphNode[];
// eslint-disable-next-line @typescript-eslint/no-var-requires
const opInfos = require('rinf-graph/data/OpInfos.json') as OpInfo[];
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lineInfos = require('rinf-graph/data/LineInfos.json') as LineInfo[];
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dbhaltestellen = require('../../db-data/uic-to-opid.json') as DBHaltestelle[];
// eslint-disable-next-line @typescript-eslint/no-var-requires
const öbbhaltestellen = require('../../öbb-data/uic-to-opid.json') as ÖBBHaltestelle[];

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

function ds100ToUOPID(ds100pattern: string) {
    const ds100 = ds100pattern.split(',')[0];
    return 'DE' + '0'.repeat(5 - ds100.length) + ds100;
}

function db640ToUOPID(ds640: string) {
    return 'AT' + ds640;
}
function findOPIDForUicRef(uicref: number): string {
    const haltestelle = dbhaltestellen.find(h => h.EVA_NR === uicref);
    if (haltestelle) return ds100ToUOPID(missingDS100.get(haltestelle.DS100) ?? haltestelle.DS100);
    else {
        const haltestelle = öbbhaltestellen.find(h => h.EVA_NR === uicref);
        if (haltestelle) return db640ToUOPID(haltestelle.DB640_CODE);
        else {
            console.log('uic not found: ', uicref);
            return '';
        }
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

function findDs100PatternsForUicrefs(uicrefs: number[]) {
    return uicrefs
        .map(uicref => findOPIDForUicRef(uicref))
        .filter(opId => {
            const op = mapOps.get(opId)
            if (!op) {
                console.log('opId not found: ', opId);
            }
            return op;
        });
}

function rinfFindRailwayRoutesOfTrip(ids: string[], compactifyPath: boolean): GraphNode[] {
    const spath = rinfgraph.Graph_getShortestPathFromGraph(g, graph, ids);
    return compactifyPath ? rinfgraph.Graph_compactifyPath(spath, g) : spath;
}

function rinfFindRailwayRoutesOfLine(line: number): GraphNode[][] {
    return lineInfos
        .filter(li => li.Line === line.toString())
        .map(li => rinfgraph.Graph_getPathOfLineFromGraph(g, graph, li))
        .sort((a, b) => a[0].Edges[0].StartKm - b[0].Edges[0].StartKm);
}

function rinfFindRailwayRoutesOfTripIBNRs(uic_refs: number[], compactifyPath: boolean): GraphNode[] {
    const ids = findDs100PatternsForUicrefs(removeDuplicates(uic_refs));
    console.log('uic_refs:', uic_refs)
    console.log('opids:', ids)
    return rinfFindRailwayRoutesOfTrip(ids, compactifyPath);
}

function rinfGetCompactPath(path: GraphNode[], useMaxSpeed?: boolean): GraphNode[] {
    if (useMaxSpeed) return rinfgraph.Graph_getCompactPathWithMaxSpeed(path, g);
    else return rinfgraph.Graph_getCompactPath(path);
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