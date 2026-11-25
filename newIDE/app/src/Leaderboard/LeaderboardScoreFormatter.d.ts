import {
  type LeaderboardScoreFormattingCustom,
  type LeaderboardScoreFormattingTime,
  type LeaderboardScoreFormatting,
} from '../Utils/GDevelopServices/Play';

export declare const orderedTimeUnits: Array<string>;

export declare const unitToNextSeparator: {
  hour: string;
  minute: string;
  second: string;
  millisecond: string;
};

export declare const formatDuration: (
  durationInSecond: number,
  options: LeaderboardScoreFormattingTime
) => string;

export declare const formatCustomScore: (
  score: number,
  options: LeaderboardScoreFormattingCustom
) => string;

export declare const formatScore: (
  score: number,
  options: LeaderboardScoreFormatting
) => string;
