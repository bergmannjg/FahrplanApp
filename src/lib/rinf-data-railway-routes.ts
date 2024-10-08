import { rinfgraph } from 'rinf-graph/rinfgraph.bundle.js';
import type { GraphNode, OpInfo, LineInfo, Location as RInfLocation, PathElement, GraphEdge } from 'rinf-graph/rinfgraph.bundle';
import { Stop, Location } from 'hafas-client';
import { distance } from './distance';

// eslint-disable-next-line @typescript-eslint/no-var-requires
import g from 'rinf-graph/data/Graph.json' with { type: 'json' };
// eslint-disable-next-line @typescript-eslint/no-var-requires
import opInfos from 'rinf-graph/data/OpInfos.json' with { type: 'json' };
// eslint-disable-next-line @typescript-eslint/no-var-requires
import lineInfos from 'rinf-graph/data/LineInfos.json' with { type: 'json' };
// eslint-disable-next-line @typescript-eslint/no-var-requires
import tunnelInfos from 'rinf-graph/data/TunnelInfos.json' with { type: 'json' };
// eslint-disable-next-line @typescript-eslint/no-var-requires
import dbStationsOrig from '../../db-data/D_Bahnhof_2020_alle.json' with { type: 'json' };

type DbStation = {
	id: string,
	latitude: number,
	longitude: number,
	opid: string
}

const dbStations: DbStation[] = dbStationsOrig.map(s => {
	const ds100 = s.DS100.split(',')[0];
	const opid = ds100.length < 5 ? 'DE' + '0'.repeat(5 - ds100.length) + ds100 : 'DE' + ds100;
	let r: DbStation =
	{
		id: s.EVA_NR.toString(),
		latitude: parseFloat(s.Breite.replace(',', '.')),
		longitude: parseFloat(s.Laenge.replace(',', '.')),
		opid: opid
	};
	return r;
})

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

// todo: move to LineInfo
interface LineInfoExtra {
	lineInfo: LineInfo;
	maxSpeed: number;
	lengthWithHighSpeed: number; // speed >= 200 km/h
}

const mapOps = opInfos.reduce((map: Map<string, OpInfo>, op: OpInfo) => map.set(op.UOPID, op), new Map());
const countries: string[] = (lineInfos as LineInfo[]).reduce(
	(arr: string[], line: LineInfo) => arr.find(x => x === line.Country) ? arr : [line.Country, ...arr],
	[]);
console.log('countries', countries);
const mapLines =
	countries.reduce((m: Map<string, Map<string, LineInfo>>, country: string) => {
		const countryLines: Map<string, LineInfo> =
			(lineInfos as LineInfo[])
				.filter(line => line.Country === country)
				.reduce((map: Map<string, LineInfo>, line: LineInfo) => map.set(line.Line, line), new Map());
		return m.set(country, countryLines)
	}, new Map());
const graph = rinfgraph.Graph_toGraph(g);

function addLengthWithHighSpeed(li: LineInfoExtra, node: GraphNode, edge: GraphEdge) {
	const nodeIndex = li.lineInfo.UOPIDs.findIndex(id => id === node.Node);
	const edgeIndex = li.lineInfo.UOPIDs.findIndex(id => id === edge.Node);
	if (nodeIndex >= 0 && edgeIndex >= 0 && nodeIndex + 1 === edgeIndex) {
		li.lengthWithHighSpeed += edge.Length;
	}
}

export function getLineInfoExtra(): LineInfoExtra[] {
	const lineInfoExtras = (g as GraphNode[]).reduce(((acc: LineInfoExtra[], node: GraphNode) => {
		node.Edges.forEach(edge => {
			const found = acc.find(li => li.lineInfo.Line === edge.Line && li.lineInfo.Country === edge.Country);
			if (found) {
				if (found.maxSpeed < edge.MaxSpeed) {
					found.maxSpeed = edge.MaxSpeed;
				}
				if (edge.MaxSpeed >= 200) {
					addLengthWithHighSpeed(found, node, edge);
				}
			} else if (edge.MaxSpeed >= 200) {
				const lineInfo = (lineInfos as LineInfo[]).find(li => li.Line === edge.Line && li.Country === edge.Country);
				if (lineInfo) {
					const li = { lineInfo, maxSpeed: edge.MaxSpeed, lengthWithHighSpeed: 0 };
					addLengthWithHighSpeed(li, node, edge);
					acc.push(li)
				}
			}
		});
		return acc;
	}), []);
	console.log('lineInfoExtras', lineInfoExtras.length);
	lineInfoExtras.sort((a, b) => (a.lineInfo.Country + a.lineInfo.Line).localeCompare(b.lineInfo.Country + b.lineInfo.Line))
	return lineInfoExtras;
}

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
	uopid?: string;
	name?: string;
	km: number;
}

function nearby(lat1: number, lon1: number, lat2: number, lon2: number): boolean {
	return Math.abs(lat1 - lat2) < 1 && Math.abs(lon1 - lon2) < 1;
}

function prefix(words: string[]): string {
	// check border cases size 1 array and empty first word)
	if (!words[0] || words.length == 1) return words[0] || "";
	let i = 0;
	// while all words have the same character at position i, increment i
	while (words[0][i] && words.every(w => w[i] === words[0][i]))
		i++;

	// prefix is the substring from the beginning to the last successfully checked i
	return words[0].substring(0, i);
}

function getOpIdFromDbStations(s: Location): string | undefined {
	if (s.latitude && s.longitude) {
		let station = dbStations.find(station => station.id === s.id);
		if (station) {
			const dist = distance(s.latitude, s.longitude, station.latitude, station.longitude);
			console.log('getOpIdFromDbStations', s.id, station.opid, dist.toFixed(3));
			if (dist < 1.0) return station.opid;
		}
	}
}

function getOpIdWithMinDistanceFromLatLon(s: Location): string | undefined {
	const maxKm = 2;
	const opid = opInfos.reduce((state: OpIdDist, op: OpInfo) => {
		if (s.latitude && s.longitude && nearby(s.latitude, s.longitude, op.Latitude, op.Longitude)) {
			const dist = distance(s.latitude, s.longitude, op.Latitude, op.Longitude);
			if (dist < maxKm) {
				const prefixWithCandidate = prefix([s.name ?? '', op.Name])
				const prefixWithState = prefix([s.name ?? '', state.name ?? ''])
				if (dist < state.km || prefixWithState.length === 0 && prefixWithCandidate.length > op.Name.length / 2) {
					console.log('OpId search, dist', dist.toFixed(3), op.Name);
					state.uopid = op.UOPID;
					state.name = op.Name;
					state.km = dist;
				}
			}
		}
		return state;
	}, { uopid: undefined, km: maxKm });
	console.log('OpId found', opid.uopid, '/', opid.name, ', km ', opid.km.toFixed(3), ' for stop ', s.name, s.longitude, ',', s.latitude);
	return opid.uopid;
}

function findOPIDForStop(s: Location): string | undefined {
	const opid = getOpIdFromDbStations(s);
	if (opid && mapOps.get(opid)) return opid;
	const op = getOpIdWithMinDistanceFromLatLon(s)
	if (op) return op;
	console.log('stop.id not found: ', s.name);
	return undefined;
}

function rinfGetLineName(country: string, line: string): string {
	const lineInfo = mapLines.get(country)?.get(line);
	return lineInfo?.Name ?? line.toString();
}

function rinfGetWikipediaUrl(country: string, line: string): string | undefined {
	const lineInfo = mapLines.get(country)?.get(line);
	return lineInfo ? lineInfo.Wikipedia : undefined;
}

function rinfToPathElement(n: GraphNode): PathElement {
	const country = n.Edges[0].Country;
	const map = mapLines.get(country) ?? (new Map());
	return rinfgraph.Graph_toPathElement(mapOps, map, n);
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

function findOpIdsForStops(stops: Location[]) : string[] {
	const ids = stops
		.map(stop => findOPIDForStop(stop))
		.filter(opId => !!opId);
	return ids as string[];
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
	return path.reduce(splitter, [[]
	]);
}

function startOpIdOfPath(path: GraphNode[]): String {
	return path[0]?.Node;
}

function endOpIdOfPath(path: GraphNode[]): String {
	return path[path.length - 1]?.Edges[0]?.Node;
}

function compactifyPath(path: GraphNode[], g: GraphNode[]): GraphNode[] {
	if (path.length === 0) return [];

	console.log('compactifyPath length:', path.length,
		'from: ', startOpIdOfPath(path),
		'to: ', endOpIdOfPath(path),
		'costOfPath:', rinfgraph.Graph_costOfPath(path),
		'lengthOfPath:', rinfgraph.Graph_lengthOfPath(path))
	const result = rinfgraph.Graph_compactifyPath(path, g);
	console.log('result of compactifyPath length:', result.length,
		'from: ', startOpIdOfPath(result),
		'to: ', endOpIdOfPath(result),
		'costOfPath:', rinfgraph.Graph_costOfPath(result),
		'lengthOfPath:', rinfgraph.Graph_lengthOfPath(result))
	return result;
}

function rinfFindRailwayRoutesOfTrip(ids: string[], isCompactifyPath: boolean): GraphNode[] {
	const spath = rinfgraph.Graph_getShortestPathFromGraph(g, graph, ids);
	if (isCompactifyPath) {
		if (spath.length > 5) {
			return splitPath(spath).map(p => compactifyPath(p, g)).flat(1)
		} else {
			return compactifyPath(spath, g);
		}
	} else {
		return spath;
	}
}

function rinfFindRailwayRoutesOfLine(country: string, line: string): GraphNode[][] {
	return (lineInfos as LineInfo[])
		.filter(li => li.Line === line && li.Country === country)
		.map(li => rinfgraph.Graph_getPathOfLineFromGraph(g, graph, li))
		.sort((a, b) => a[0].Edges[0].StartKm - b[0].Edges[0].StartKm);
}

function rinfFindRailwayRoutesOfTripStops(stops: Location[], compactifyPath: boolean): GraphNode[] {
	const ids = removeDuplicates(findOpIdsForStops(stops));
	return rinfFindRailwayRoutesOfTrip(ids, compactifyPath);
}

function rinfGetCompactPath(path: GraphNode[], useMaxSpeed?: boolean): GraphNode[] {
	if (useMaxSpeed) return rinfgraph.Graph_getCompactPathWithMaxSpeed(path, g);
	else return rinfgraph.Graph_getCompactPath(path);
}

function rinfGetLocationsOfPath(path: GraphNode[]): RInfLocation[][] {
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

export { rinfGetWikipediaUrl, rinfNearby, rinfOpInfos, rinfTypeToString, rinfToPathElement, rinfIsWalkingPath, rinfToLineNodes, rinfFindRailwayRoutesOfTrip, rinfFindRailwayRoutesOfTripStops, rinfGetLineName, rinfFindRailwayRoutesOfLine, rinfGetCompactPath, rinfComputeDistanceOfPath, rinfGetLocationsOfPath }

export type { PathElement, LineNode, TunnelNode, LineInfoExtra }