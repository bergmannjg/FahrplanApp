
interface RailwayLine {
    Line: number;
    Trains: string[];
    StartStation: string;
    EndStation: string;
    ViaStations: string[];
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
import railwayLines from '../../db-data/compact-line-infos.json' assert { type: 'json' };

const railwayLineInfos: RailwayLine[] = railwayLines

export { railwayLines, railwayLineInfos }

export type { RailwayLine }
