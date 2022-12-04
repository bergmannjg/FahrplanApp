
interface RailwayLine {
    Line: number;
    Train: string;
    StartStation: string;
    EndStation: string;
    ViaStations: string[];
}

interface RailwayLineTripId {
    Line: number;
    TripId: string;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
import railwayLines from '../../db-data/compact-line-infos.json' assert { type: 'json' };

// eslint-disable-next-line @typescript-eslint/no-var-requires
import _railwayLineTripIds from '../../db-data/line-tripids.json' assert { type: 'json' };

const railwayLineInfos: RailwayLine[] = railwayLines

const railwayLineTripIds: RailwayLineTripId[] = _railwayLineTripIds

export { railwayLines, railwayLineInfos, railwayLineTripIds }

export type { RailwayLine, RailwayLineTripId }
