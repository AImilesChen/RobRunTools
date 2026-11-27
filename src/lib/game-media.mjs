export const officialGamePage = 'https://kefirgames.com/games/rob-run';
export const officialSteamPage = 'https://store.steampowered.com/app/4262460/ROB_RUN/';

const storeScreenshot = 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/4262460/258546065bdba3f2dc14b476a6c0ba8caaf5b367/ss_258546065bdba3f2dc14b476a6c0ba8caaf5b367.1920x1080.jpg?t=1795595062';
const inventoryScreenshot = 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/4262460/e16f10d92eeb37401f77be4fdee0d7cab70d4b6a/ss_e16f10d92eeb37401f77be4fdee0d7cab70d4b6a.1920x1080.jpg?t=1795595062';
export const officialArtPreview = process.env.ROBRUN_DESIGN_PREVIEW === 'true';
export const communityItemImageBase = officialArtPreview ? 'https://robrunwiki.net/assets/items/' : '';
export const previewScenes = {
  city: officialArtPreview ? storeScreenshot : '',
  equipment: officialArtPreview ? inventoryScreenshot : '',
  terrain: '',
};
