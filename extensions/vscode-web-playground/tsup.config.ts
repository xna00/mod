import { defineConfig } from 'tsup'

export default defineConfig({
    "entry": [
        "src/extension.ts",
        "src/server.ts"
    ],
    "format": [
        "cjs", "esm"
    ],
    "external": [
        "vscode", "fs", "constants", "tty", "child_process"
    ],
    target: "es2022",
    platform: 'browser',
    "splitting": false,
    "sourcemap": true,
    "clean": true,
    // minify: true
})