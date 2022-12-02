export * from './strategies/discord'
export * from './strategies/facebook'
export * from './strategies/github'
export * from './strategies/google'
export * from './strategies/microsoft'
export * from './strategies/strava'

export const SocialProvider = {
  discord: 'discord',
  github: 'github',
  google: 'google',
  facebook: 'facebook',
  microsoft: 'microsoft',
  strava: 'strava',
}

export type ISocialProvider = keyof typeof SocialProvider
