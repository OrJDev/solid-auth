import { getBaseOptions } from '../../tsup.config'

export default (options) => getBaseOptions(options, ['src/**/*.ts'], false)
