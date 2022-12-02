export const SocialProvider = {
  discord: 'discord',
  github: 'github',
  google: 'google',
  facebook: 'facebook',
  microsoft: 'microsoft',
  strava: 'strava',
}

export type ISocialProvider = keyof typeof SocialProvider
