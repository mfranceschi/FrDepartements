import RAW from './fleuvesDepts.json';

export interface FleuveDept { depts: string[]; scalerank: number }
export const FLEUVES_DEPTS: Record<string, FleuveDept> = RAW as Record<string, FleuveDept>;
