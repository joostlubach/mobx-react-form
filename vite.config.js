import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'

const name = path.basename(require('./package.json').exports['.'].import, '.js')

export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths(),
        dts(),
    ],

    build: {
        lib: {
            entry:  path.resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: () => `${name}.js`,
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'mobx', 'mobx-react'],
        },
    },
})