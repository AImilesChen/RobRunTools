import { officialArtPreview } from './game-media.mjs';

export const homeGameplayPreview = officialArtPreview || process.env.ROBRUN_HOME_GAMEPLAY === 'true';
export const officialRobRunSite = 'https://robrun.com/en';
export const officialGameplayVideo = '/gameplay-home/driving.mp4';

