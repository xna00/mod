// WORKBENCH_WEB_BASE_URL
// WORKBENCH_WEB_CONFIGURATION
// WORKBENCH_AUTH_SESSION
// WORKBENCH_BUILTIN_EXTENSIONS
// WORKBENCH_MAIN

const { exec, execSync } = require("child_process");
const { readdirSync, unlinkSync, statSync, copyFileSync, mkdirSync } = require("fs");
const { resolve, basename, dirname } = require("path");

execSync(`
mkdir dist
touch dist/.nojekyll
cp index.html dist
cp -r vscode/out-vscode-web-min dist
#cp -r vscode/out dist
mkdir dist/extensions
cp -r vscode-web-playground dist/extensions
cp -r vscode/extensions/theme-defaults dist/extensions
cp -r vscode/resources dist

mkdir dist/node_modules
`)

const modules = { "@microsoft/1ds-core-js": "dist/ms.core.min.js", "@microsoft/1ds-post-js": "dist/ms.post.min.js", "@vscode/iconv-lite-umd": "lib/iconv-lite-umd.js", "@vscode/vscode-languagedetection": "dist/lib/index.js", "@xterm/addon-image": "lib/addon-image.js", "@xterm/addon-search": "lib/addon-search.js", "@xterm/addon-serialize": "lib/addon-serialize.js", "@xterm/addon-unicode11": "lib/addon-unicode11.js", "@xterm/addon-webgl": "lib/addon-webgl.js", "@xterm/xterm": "lib/xterm.js", "jschardet": "dist/jschardet.min.js", "tas-client-umd": "lib/tas-client-umd.js", "vscode-oniguruma": "release/main.js", "vscode-textmate": "release/main.js", "@microsoft/dynamicproto-js": "lib/dist/umd/dynamicproto-js.min.js", "@microsoft/applicationinsights-shims": "dist/umd/applicationinsights-shims.min.js", "@microsoft/applicationinsights-core-js": "browser/applicationinsights-core-js.min.js" }

Object.entries(modules).forEach(([k, v]) => {
    const src = `./vscode/node_modules/${k}/${v}`
    const dest = `./dist/node_modules/${k}/${v}`
    mkdirSync(dirname(dest), { recursive: true })
    // console.log('copy', src, dest)
    copyFileSync(src, dest)
})

let count1 = 0, count2 = 0
function traverse(dir) {
    const files = readdirSync(dir)
    files.forEach(file => {
        const p = resolve(dir, file)
        try {
            if (statSync(p).isDirectory()) {
                traverse(p)
                return
            }
            count1++
            if (file.endsWith('.js.map')) {
                unlinkSync(p)
                // console.log('remove', p)
            } else {
                count2++
            }
        } catch (e) {
            console.log(e)
        }
    })
}

traverse('./dist')
console.log(count1, count2)