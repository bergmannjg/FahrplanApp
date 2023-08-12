import { rinfgraph } from 'rinf-graph/rinfgraph.bundle.js';
import type { GraphNode, OpInfo, LineInfo, Location, PathElement } from 'rinf-graph/rinfgraph.bundle';
import { Stop } from 'hafas-client';
import { distance } from './distance';

// eslint-disable-next-line @typescript-eslint/no-var-requires
import g from 'rinf-graph/data/Graph.json' assert { type: 'json' };
// eslint-disable-next-line @typescript-eslint/no-var-requires
import opInfos from 'rinf-graph/data/OpInfos.json' assert { type: 'json' };
// eslint-disable-next-line @typescript-eslint/no-var-requires
import lineInfos from 'rinf-graph/data/LineInfos.json' assert { type: 'json' };
// eslint-disable-next-line @typescript-eslint/no-var-requires
import tunnelInfos from 'rinf-graph/data/TunnelInfos.json' assert { type: 'json' };

const operationalPointType = rinfgraph.Graph_operationalPointType;

interface TunnelNode {
    name: string;
    km?: string;
    length: string;
}

interface LineNode {
    name: string;
    opid: string;
    rinftype: string;
    latitude: number;
    longitude: number;
    km: string;
    maxSpeed?: number;
    electrified?: boolean;
    tunnelNodes: TunnelNode[];
}

const mapOps = opInfos.reduce((map: Map<string, OpInfo>, op: OpInfo) => map.set(op.UOPID, op), new Map());
const mapLines = lineInfos.reduce((map: Map<string, LineInfo>, line: LineInfo) => map.set(line.Line, line), new Map());
const graph = rinfgraph.Graph_toGraph(g);

function rinfTypeToString(t?: number): string {
    switch (t) {
        case operationalPointType.station: return 'station';
        case operationalPointType.smallstation: return 'smallstation';
        case operationalPointType.passengerterminal: return 'passengerterminal';
        case operationalPointType.freightterminal: return 'freightterminal';
        case operationalPointType.depotorworkshop: return 'depotorworkshop';
        case operationalPointType.traintechnicalservices: return 'traintechnicalservices';
        case operationalPointType.junction: return 'junction';
        case operationalPointType.passengerstop: return 'passengerstop';
        case operationalPointType.switch: return 'switch';
        case operationalPointType.borderpoint: return 'borderpoint';
        default: return 'rinf/' + t?.toString();
    }
}

interface OpIdDist {
    name?: string;
    km: number;
}

function nearby(lat1: number, lon1: number, lat2: number, lon2: number): boolean {
    return Math.abs(lat1 - lat2) < 1 && Math.abs(lon1 - lon2) < 1;
}

function getOpIdWithMinDistanceFromLatLon(s: Stop): string | undefined {

    const opid = opInfos.reduce((state: OpIdDist, op: OpInfo) => {
        if (s.location?.latitude && s.location?.longitude && nearby(s.location.latitude, s.location.longitude, op.Latitude, op.Longitude)) {
            const dist = distance(s.location.latitude, s.location.longitude, op.Latitude, op.Longitude);
            if (dist < state.km) {
                state.name = op.UOPID;
                state.km = dist;
            }
        }
        return state;
    }, { name: undefined, km: 2 });
    console.log('OpId found', opid.name, ', km ', opid.km.toFixed(3), ' for stop ', s.name);
    return opid.name;
}

function findOPIDForStop(s: Stop): string {
    const opid = getOpIdWithMinDistanceFromLatLon(s);
    if (opid) return opid;
    console.log('opid not found: ', s.name);
    return '';
}

function rinfGetLineName(line: string): string {
    const lineInfo = mapLines.get(line);
    return lineInfo?.Name ?? line.toString();
}

function rinfToPathElement(n: GraphNode): PathElement {
    return rinfgraph.Graph_toPathElement(mapOps, mapLines, n);
}

function rinfIsWalkingPath(n: GraphNode): boolean {
    return rinfgraph.Graph_isWalkingPath(n);
}

function rinfToLineNode(n: GraphNode): LineNode | undefined {
    const tunnelsOfLine: TunnelNode[] = tunnelInfos
        .filter(t =>
            t.Line === n.Edges[0].Line
            && (t.StartKm && t.EndKm
                ? t.StartKm >= n.Edges[0].StartKm && t.EndKm <= n.Edges[0].EndKm
                : n.Node == t.StartOP))
        .sort((a, b) => a.StartKm && b.StartKm ? a.StartKm - b.StartKm : a.StartLat - b.StartLat)
        .map(t => {
            return {
                name: t.Tunnel,
                km: t.StartKm ? Number(t.StartKm).toFixed(3) : undefined,
                length: t.Length.toFixed(3)
            }
        }
        );
    const op = mapOps.get(n.Node);
    return op ? {
        name: op.Name,
        opid: n.Node,
        rinftype: rinfTypeToString(op.RinfType),
        latitude: op.Latitude,
        longitude: op.Longitude,
        km: n.Edges[0].StartKm.toFixed(3),
        maxSpeed: n.Edges[0].MaxSpeed,
        electrified: n.Edges[0].Electrified,
        tunnelNodes: tunnelsOfLine
    } : undefined;
}

function toLineNodes(nodes: GraphNode[]): LineNode[] {
    if (nodes.length === 0) return [];
    const lastNode = nodes[nodes.length - 1];
    const op = mapOps.get(lastNode.Edges[0].Node);
    if (!op) return [];
    const lastElement: LineNode = {
        name: op.Name,
        opid: lastNode.Edges[0].Node,
        rinftype: rinfTypeToString(op.RinfType),
        latitude: op.Latitude,
        longitude: op.Longitude,
        km: (lastNode.Edges[0].StartKm + lastNode.Edges[0].Length).toFixed(3),
        tunnelNodes: []
    }
    return nodes.map(n => rinfToLineNode(n)).filter((item): item is LineNode => !!item).concat([lastElement]);
}

function removeLineNodeDuplicates(arr: Array<LineNode>) {
    const temp: Array<LineNode> = [];
    for (let i = 0; i < arr.length; i++) {
        if (!temp.find(t => t.opid === arr[i].opid)) { temp.push(arr[i]); }
    }
    return temp;
}

function removeDuplicates<T>(arr: Array<T>) {
    const temp: Array<T> = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== arr[i + 1]) { temp.push(arr[i]); }
    }
    return temp;
}

const optypeExcludes = [operationalPointType.privatesiding, operationalPointType.depotorworkshop];

function filterOpId(opid: string): boolean {
    const op = mapOps.get(opid);
    return op === undefined || !optypeExcludes.find(x => x === op.RinfType);
}

function rinfToLineNodes(nodesList: GraphNode[][]): LineNode[] {
    return removeLineNodeDuplicates(nodesList.map(nodes => toLineNodes(nodes))
        .reduce((accumulator, value) => accumulator.concat(value), []))
        .filter(ln => filterOpId(ln.opid));
}

function findOpIdsForStops(stops: Stop[]) {
    return stops
        .map(stop => findOPIDForStop(stop))
        .filter(opId => {
            const op = mapOps.get(opId)
            if (!op) {
                console.log('opId not found: ', opId);
            }
            return op;
        });
}

function splitter(previous: GraphNode[][], current: GraphNode): GraphNode[][] {
    if (["DE000HH", "DE000AH", "DE000NN", "DE000MH"].includes(current.Node)) {
        previous.push([]);
    }

    previous[previous.length - 1] = previous[previous.length - 1].concat([current]);
    return previous;
}

// split path to better compactify paths
function splitPath(path: GraphNode[]): GraphNode[][] {
    return path.reduce(splitter, [[]]);
}

const compactifiedPathCostRatio = 1.2;

function rinfFindRailwayRoutesOfTrip(ids: string[], compactifyPath: boolean): GraphNode[] {
    const spath = rinfgraph.Graph_getShortestPathFromGraph(g, graph, ids);
    if (compactifyPath) {
        const compactifiedPath = splitPath(spath).map(p => rinfgraph.Graph_compactifyPath(p, g)).flat(1)
        const costOfCompactifiedPath = rinfgraph.Graph_costOfPath(compactifiedPath);
        const costOfPath = rinfgraph.Graph_costOfPath(spath);
        const ratio = costOfCompactifiedPath / costOfPath;
        console.log('route', ids[0], ids[ids.length - 1], 'costOfPath', costOfPath, 'costOfCompactified', costOfCompactifiedPath, 'ratio', ratio.toFixed(2));
        return ratio < compactifiedPathCostRatio ? compactifiedPath : spath;
    } else {
        return spath;
    }
}

function rinfFindRailwayRoutesOfLine(line: string): GraphNode[][] {
    return lineInfos
        .filter(li => li.Line === line)
        .map(li => rinfgraph.Graph_getPathOfLineFromGraph(g, graph, li))
        .sort((a, b) => a[0].Edges[0].StartKm - b[0].Edges[0].StartKm);
}

function rinfFindRailwayRoutesOfTripStops(stops: Stop[], compactifyPath: boolean): GraphNode[] {
    const ids = removeDuplicates(findOpIdsForStops(stops));
    return rinfFindRailwayRoutesOfTrip(ids, compactifyPath);
}

function rinfGetCompactPath(path: GraphNode[], useMaxSpeed?: boolean): GraphNode[] {
    if (useMaxSpeed) return rinfgraph.Graph_getCompactPathWithMaxSpeed(path, g);
    else return rinfgraph.Graph_getCompactPath(path);
}

function rinfGetLocationsOfPath(path: GraphNode[]): Location[][] {
    return rinfgraph.Graph_getFilteredLocationsOfPath(g, mapOps, path, optypeExcludes);
}

function rinfComputeDistanceOfPath(path: GraphNode[]): number {
    return path.reduce((accu: number, r) => {
        return accu + r.Edges[0].Length;
    }, 0)
}

function rinfOpInfos(q: string, textSearch: 'first exact match' | 'exact' | 'caseinsensitive' | 'regex'): OpInfo[] {
    if (q.length < 3) {
        return [];
    } else if (textSearch === 'first exact match') {
        const found = opInfos.find(op => op.Name === q);
        return found ? [found] : [];
    } else {
        let re: RegExp;
        if (textSearch === 'regex')
            try {
                re = new RegExp(q);
            } catch (error) {
                return [];
            }
        const qLowerCase = textSearch === 'caseinsensitive' ? q.toLowerCase() : q;

        const findMatch = (s: string): boolean => {
            if (textSearch === 'exact') return s.includes(q);
            else if (textSearch === 'caseinsensitive') return s.toLowerCase().includes(qLowerCase);
            else return re.test(s);
        }

        return opInfos.reduce((acc: OpInfo[], op) => {
            if (acc.length < 10) {
                if (!acc.find(v => v.Name === op.Name) && findMatch(op.Name)) {
                    acc.push(op);
                }
            }
            return acc;
        }, []);
    }
}

function rinfNearby(latitude: number, longitude: number, maxdistance: number): OpInfo[] {
    return opInfos.filter(op => distance(latitude, longitude, op.Latitude, op.Longitude) < maxdistance);
}

export { rinfNearby, rinfOpInfos, rinfTypeToString, rinfToPathElement, rinfIsWalkingPath, rinfToLineNodes, rinfFindRailwayRoutesOfTrip, rinfFindRailwayRoutesOfTripStops, rinfGetLineName, rinfFindRailwayRoutesOfLine, rinfGetCompactPath, rinfComputeDistanceOfPath, rinfGetLocationsOfPath }

export type { PathElement, LineNode, TunnelNode }