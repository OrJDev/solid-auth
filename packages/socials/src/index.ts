export * from './discord'
export * from './github'
export * from './google'
export * from './facebook'
export * from './microsoft'

export const SocialProvider = {
  discord: 'discord',
  github: 'github',
  google: 'google',
  facebook: 'facebook',
  microsoft: 'microsoft',
}

export type ISocialProvider = keyof typeof SocialProvider
