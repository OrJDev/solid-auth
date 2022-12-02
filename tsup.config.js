import { defineConfig } from 'tsup'

export const getBaseOptions = (options, entry, bundle = true) =>
  defineConfig({
    entry,
    target: 'esnext',
    sourcemap: options.watch ? 'inline' : false,
    clean: true,
    minify: false,
    keepNames: false,
    tsconfig: './tsconfig.json',
    format: ['esm'],
    external: ['solid-js', 'solid-js/web', 'solid-start'],
    dts: true,
    bundle,
  })

export default (options) => getBaseOptions(options, ['src/index.ts'])
