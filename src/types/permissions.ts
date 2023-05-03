export enum DazaiPermissions {
  playSong = 'playSong',
  skipSong = 'skipSong',
  shuffleQueue = 'shuffleQueue',
  disconnect = 'disconnect',
  connect = 'connect',
  snipe = 'snipe',
  editSnipe = 'editSnipe',
  rank = 'rank',
  rankOther = 'rankOthers',
  slander = 'slander',
  kitten = 'kitten',
  kittenOther = 'kittenOthers',
  purge = 'purge',
}
export const DazaiPermissionsList = Object.values(DazaiPermissions);
export type DazaiPermissionsType = keyof typeof DazaiPermissions;
export const DazaiPermissionsText: Record<DazaiPermissionsType, string> = {
  playSong: 'Play/queue songs',
  skipSong: 'Skip songs',
  shuffleQueue: 'Shuffle the queue',
  disconnect: 'Disconnect from the voice channel',
  connect: 'Connect to a voice channel',
  snipe: 'Snipe deleted messages',
  editSnipe: 'Snipe edited messages',
  rank: 'View own Rank Card',
  rankOther: "View other users' Rank Cards",
  slander: 'Create slander GIFs',
  kitten: 'Toggle Kitten Mode for self',
  kittenOther: 'Toggle Kitten Mode for others',
  purge: 'Purge messages',
};
