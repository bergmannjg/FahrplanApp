
interface RailwayLine {
    Line: number;
    StartStation: string;
    EndStation: string;
    Trains: string[];
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const railwayLines = require('../../db-data/railway-lines.json') as RailwayLine[];

function onlyUnique<T>(value: T, index: number, self: T[]) {
    return self.indexOf(value) === index;
}

const railwayLineInfos: RailwayLine[] = railwayLines
    .map(r => r.Line)
    .filter(onlyUnique)
    .map(l => ({ Line: l, StartStation: '', EndStation: '', Trains: [] }));

export { railwayLines, railwayLineInfos }

export type { RailwayLine }
