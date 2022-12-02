import { defineConfig } from 'tsup'
import { getBaseOptions } from '../../tsup.config'

export default defineConfig((options) =>
  getBaseOptions(options, ['src/**/*.ts'], false)
)
