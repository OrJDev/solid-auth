export * from './discord'
export * from './facebook'
export * from './github'
export * from './google'
export * from './microsoft'
export * from './strava'

export const SocialProvider = {
  discord: 'discord',
  github: 'github',
  google: 'google',
  facebook: 'facebook',
  microsoft: 'microsoft',
  strava: 'strava',
}

export type ISocialProvider = keyof typeof SocialProvider
