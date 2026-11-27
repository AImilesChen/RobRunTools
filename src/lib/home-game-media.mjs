import { officialArtPreview } from './game-media.mjs';

export const homeGameplayPreview = officialArtPreview || process.env.ROBRUN_HOME_GAMEPLAY === 'true';
export const homeGameplayEnabled = homeGameplayPreview || process.env.ROBRUN_RELEASE_GAMEPLAY === 'true';
export const officialRobRunSite = 'https://robrun.com/en';
export function homeMediaUrl(asset) {
  return homeGameplayEnabled ? '/gameplay-home/' + asset.file : asset.source;
}

