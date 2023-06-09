
interface RailwayLine {
    Line: number;
    Train: string;
    StartStation: string;
    EndStation: string;
    ViaStations: string[];
}

interface RailwayLineToken {
    Line: number;
    RefreshToken: string;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
import railwayLines from './compact-line-infos.json' assert { type: 'json' };

// eslint-disable-next-line @typescript-eslint/no-var-requires
import _railwayLineTokens from './line-tokens.json' assert { type: 'json' };

const railwayLineInfos: RailwayLine[] = railwayLines

const railwayLineTokens: RailwayLineToken[] = _railwayLineTokens

export { railwayLineInfos, railwayLineTokens }

export type { RailwayLine, RailwayLineToken }
