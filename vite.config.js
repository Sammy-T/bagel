import { resolve } from 'path';

export default {
    root: "site",
    build: {
        outDir: "../dist",
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'site', 'index.html'),
                members: resolve(__dirname, 'site/members', 'index.html')
            }
        }
    }
}