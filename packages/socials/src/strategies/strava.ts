import type { StrategyVerifyCallback } from '@solid-auth/core'
import type { OAuth2StrategyVerifyParams } from '@solid-auth/oauth2'
import { OAuth2Strategy } from '@solid-auth/oauth2'
import { SocialProvider } from '..'

export interface StravaStrategyOptions {
  clientID: string
  clientSecret: string
  redirectURI: string
  /**
   * @default "auto"
   */
  approvalPrompt?: 'force' | 'auto'
  /**
   * @default "read"
   */
  scope?: Array<StravaScope>
}

export type StravaScope =
  | 'read'
  | 'read_all'
  | 'profile:read_all'
  | 'profile:write'
  | 'activity:read'
  | 'activity:read_all'
  | 'activity:write'

export type StravaProfile = StravaDetailedAthlete | StravaSummaryAthlete

export type StravaExtraParams = {
  token_type: 'Bearer'
  expires_at: number
  expires_in: number
  athlete: StravaSummaryAthlete
} & Record<string, string | number>

const StravaDefaultScope: StravaScope[] = ['read']
const StravaScopeSeperator = ','

export class StravaStrategy<User> extends OAuth2Strategy<
  User,
  StravaProfile,
  StravaExtraParams
> {
  public name = SocialProvider.strava
  private readonly scope: Array<StravaScope>
  private readonly prompt?: 'force' | 'auto'
  private readonly userInfoURL = 'https://www.strava.com/api/v3/athlete'

  constructor(
    {
      clientID,
      clientSecret,
      redirectURI,
      approvalPrompt,
      scope,
    }: StravaStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<StravaProfile, StravaExtraParams>
    >
  ) {
    super(
      {
        clientID,
        clientSecret,
        callbackURL: redirectURI,
        authorizationURL: 'https://www.strava.com/oauth/authorize',
        tokenURL: 'https://www.strava.com/oauth/token',
      },
      verify
    )

    this.scope = scope || StravaDefaultScope
    this.prompt = approvalPrompt || 'auto'
  }

  protected authorizationParams(): URLSearchParams {
    const params = new URLSearchParams({
      scope: this.scope.join(StravaScopeSeperator),
      approval_prompt: this.prompt,
      response_type: 'code',
    })
    return params
  }

  protected async userProfile(accessToken: string): Promise<StravaProfile> {
    const response = await fetch(this.userInfoURL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const data: StravaProfile = await response.json()
    data.provider = SocialProvider.strava
    return data
  }
}

export interface StravaDetailedAthlete {
  /**
   * The unique identifier of the athlete
   */
  id: number // int64
  /**
   * The athlet's username defined under settings > my profile > personal url
   */
  username?: string
  /**
   * Resource state, indicates level of detail. Possible values: 1 -> "meta", 2 -> "summary", 3 -> "detail"
   */
  resource_state?: number
  /**
   * The athlete's first name.
   */
  firstname?: string
  /**
   * The athlete's last name.
   */
  lastname?: string
  /**
   * The athlet's biography
   */
  bio?: string
  /**
   * URL to a 62x62 pixel profile picture.
   */
  profile_medium?: string
  /**
   * URL to a 124x124 pixel profile picture.
   */
  profile?: string
  /**
   * The athlete's city.
   */
  city?: string
  /**
   * The athlete's state or geographical region.
   */
  state?: string
  /**
   * The athlete's country.
   */
  country?: string
  /**
   * The athlete's sex.
   */
  sex?: 'M' | 'F'
  /**
   * Deprecated.  Use summit field instead. Whether the athlete has any Summit subscription.
   */
  premium?: boolean
  /**
   * Whether the athlete has any Summit subscription.
   */
  summit?: boolean
  /**
   * The time at which the athlete was created.
   */
  created_at: string // date-time
  /**
   * The time at which the athlete was last updated.
   */
  updated_at: string // date-time
  /**
   * The athlete's follower count.
   */
  follower_count?: number
  /**
   * The athlete's friend count.
   */
  friend_count?: number
  /**
   * The athlete's preferred unit system.
   */
  measurement_preference?: 'feet' | 'meters'
  /**
   * The athlete's FTP (Functional Threshold Power).
   */
  ftp?: number
  /**
   * The athlete's weight.
   */
  weight?: number // float
  /**
   * The athlete's clubs.
   */
  clubs?: StravaSummaryClub[]
  /**
   * The athlete's bikes.
   */
  bikes?: StravaSummaryGear[]
  /**
   * The athlete's shoes.
   */
  shoes?: StravaSummaryGear[]
  /**
   * The athlet's badge type
   */
  badge_type_id?: number
  friend?: number
  follower?: number
  blocked?: boolean
  can_follow?: boolean
  mutual_friend_count?: number
  athlete_type?: number
  date_preference?: string
  provider: string
}

export interface StravaSummaryAthlete {
  /**
   * The unique identifier of the athlete
   */
  id: string // int64
  /**
   * The athlet's username defined under settings > my profile > personal url
   */
  username: string | null
  /**
   * Resource state, indicates level of detail. Possible values: 1 -> "meta", 2 -> "summary", 3 -> "detail"
   */
  resource_state: number
  /**
   * The athlete's first name.
   */
  firstname?: string
  /**
   * The athlete's last name.
   */
  lastname?: string
  /**
   * The athlet's biography
   */
  bio?: string
  /**
   * URL to a 62x62 pixel profile picture.
   */
  profile_medium?: string
  /**
   * URL to a 124x124 pixel profile picture.
   */
  profile?: string
  /**
   * The athlete's city.
   */
  city?: string
  /**
   * The athlete's state or geographical region.
   */
  state?: string
  /**
   * The athlete's country.
   */
  country?: string
  /**
   * The athlete's sex.
   */
  sex?: 'M' | 'F'
  /**
   * Deprecated.  Use summit field instead. Whether the athlete has any Summit subscription.
   */
  premium?: boolean
  /**
   * Whether the athlete has any Summit subscription.
   */
  summit?: boolean
  /**
   * The time at which the athlete was created.
   */
  created_at?: string // date-time
  /**
   * The time at which the athlete was last updated.
   */
  updated_at?: string // date-time
  /**
   * The athlet's badge type
   */
  badge_type_id?: number
  /**
   * The athlete's weight.
   */
  weight?: number // float
  friend?: number
  follower?: number
  provider: string
}

export interface StravaSummaryClub {
  /**
   * The club's unique identifier.
   */
  id: number // int64
  /**
   * Resource state, indicates level of detail. Possible values: 1 -> "meta", 2 -> "summary", 3 -> "detail"
   */
  resource_state?: number
  /**
   * The club's name.
   */
  name?: string
  /**
   * URL to a 60x60 pixel profile picture.
   */
  profile_medium?: string
  /**
   * URL to a ~1185x580 pixel cover photo.
   */
  cover_photo?: string
  /**
   * URL to a ~360x176  pixel cover photo.
   */
  cover_photo_small?: string
  /**
   * Deprecated. Prefer to use activity_types.
   */
  sport_type?: 'cycling' | 'running' | 'triathlon' | 'other'
  /**
   * The activity types that count for a club. This takes precedence over sport_type.
   */
  activity_types?: StravaActivityType[]
  /**
   * The club's city.
   */
  city?: string
  /**
   * The club's state or geographical region.
   */
  state?: string
  /**
   * The club's country.
   */
  country?: string
  /**
   * Whether the club is private.
   */
  private?: boolean
  /**
   * The club's member count.
   */
  member_count?: number
  /**
   * Whether the club is featured or not.
   */
  featured?: boolean
  /**
   * Whether the club is verified or not.
   */
  verified?: boolean
  /**
   * The club's vanity URL.
   */
  url?: string
}

export interface StravaSummaryGear {
  /**
   * The gear's unique identifier.
   */
  id: string
  /**
   * Resource state, indicates level of detail. Possible values: 2 -> "summary", 3 -> "detail"
   */
  resource_state?: number
  /**
   * Whether this gear's is the owner's default one.
   */
  primary?: boolean
  /**
   * The gear's name.
   */
  name?: string
  /**
   * The distance logged with this gear.
   */
  distance?: number // float
}

export type StravaActivityType =
  | 'AlpineSki'
  | 'BackcountrySki'
  | 'Canoeing'
  | 'Crossfit'
  | 'EBikeRide'
  | 'Elliptical'
  | 'Golf'
  | 'Handcycle'
  | 'Hike'
  | 'IceSkate'
  | 'InlineSkate'
  | 'Kayaking'
  | 'Kitesurf'
  | 'NordicSki'
  | 'Ride'
  | 'RockClimbing'
  | 'RollerSki'
  | 'Rowing'
  | 'Run'
  | 'Sail'
  | 'Skateboard'
  | 'Snowboard'
  | 'Snowshoe'
  | 'Soccer'
  | 'StairStepper'
  | 'StandUpPaddling'
  | 'Surfing'
  | 'Swim'
  | 'Velomobile'
  | 'VirtualRide'
  | 'VirtualRun'
  | 'Walk'
  | 'WeightTraining'
  | 'Wheelchair'
  | 'Windsurf'
  | 'Workout'
  | 'Yoga'
