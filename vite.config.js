import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths(),
        dts({
            insertTypesEntry: true,
            rollupTypes: true,
        }),
    ],

    build: {
        lib: {
            entry:  path.resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: () => `mobx-react-form.js`,
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'mobx', 'mobx-react'],
        },
    },
})