#!/bin/bash

mkdir dist
touch dist/.nojekyll
cp index.html dist
cp -r vscode/out-vscode-web-min dist

cp -r vscode/extensions dist

cp -r vscode/resources dist

mkdir dist/node_modules

mkdir -p dist/node_modules/@microsoft/1ds-core-js/dist
cp vscode/node_modules/@microsoft/1ds-core-js/dist/ms.core.min.js dist/node_modules/@microsoft/1ds-core-js/dist/ms.core.min.js
mkdir -p dist/node_modules/@microsoft/1ds-post-js/dist
cp vscode/node_modules/@microsoft/1ds-post-js/dist/ms.post.min.js dist/node_modules/@microsoft/1ds-post-js/dist/ms.post.min.js
mkdir -p dist/node_modules/@vscode/iconv-lite-umd/lib
cp vscode/node_modules/@vscode/iconv-lite-umd/lib/iconv-lite-umd.js dist/node_modules/@vscode/iconv-lite-umd/lib/iconv-lite-umd.js
mkdir -p dist/node_modules/@vscode/vscode-languagedetection/dist/lib
cp vscode/node_modules/@vscode/vscode-languagedetection/dist/lib/index.js dist/node_modules/@vscode/vscode-languagedetection/dist/lib/index.js
mkdir -p dist/node_modules/@xterm/addon-image/lib
cp vscode/node_modules/@xterm/addon-image/lib/addon-image.js dist/node_modules/@xterm/addon-image/lib/addon-image.js
mkdir -p dist/node_modules/@xterm/addon-search/lib
cp vscode/node_modules/@xterm/addon-search/lib/addon-search.js dist/node_modules/@xterm/addon-search/lib/addon-search.js
mkdir -p dist/node_modules/@xterm/addon-serialize/lib
cp vscode/node_modules/@xterm/addon-serialize/lib/addon-serialize.js dist/node_modules/@xterm/addon-serialize/lib/addon-serialize.js
mkdir -p dist/node_modules/@xterm/addon-unicode11/lib
cp vscode/node_modules/@xterm/addon-unicode11/lib/addon-unicode11.js dist/node_modules/@xterm/addon-unicode11/lib/addon-unicode11.js
mkdir -p dist/node_modules/@xterm/addon-webgl/lib
cp vscode/node_modules/@xterm/addon-webgl/lib/addon-webgl.js dist/node_modules/@xterm/addon-webgl/lib/addon-webgl.js
mkdir -p dist/node_modules/@xterm/xterm/lib
cp vscode/node_modules/@xterm/xterm/lib/xterm.js dist/node_modules/@xterm/xterm/lib/xterm.js
mkdir -p dist/node_modules/jschardet/dist
cp vscode/node_modules/jschardet/dist/jschardet.min.js dist/node_modules/jschardet/dist/jschardet.min.js
mkdir -p dist/node_modules/tas-client-umd/lib
cp vscode/node_modules/tas-client-umd/lib/tas-client-umd.js dist/node_modules/tas-client-umd/lib/tas-client-umd.js
mkdir -p dist/node_modules/vscode-oniguruma/release
cp vscode/node_modules/vscode-oniguruma/release/main.js dist/node_modules/vscode-oniguruma/release/main.js
mkdir -p dist/node_modules/vscode-textmate/release
cp vscode/node_modules/vscode-textmate/release/main.js dist/node_modules/vscode-textmate/release/main.js
mkdir -p dist/node_modules/@microsoft/dynamicproto-js/lib/dist/umd
cp vscode/node_modules/@microsoft/dynamicproto-js/lib/dist/umd/dynamicproto-js.min.js dist/node_modules/@microsoft/dynamicproto-js/lib/dist/umd/dynamicproto-js.min.js
mkdir -p dist/node_modules/@microsoft/applicationinsights-shims/dist/umd
cp vscode/node_modules/@microsoft/applicationinsights-shims/dist/umd/applicationinsights-shims.min.js dist/node_modules/@microsoft/applicationinsights-shims/dist/umd/applicationinsights-shims.min.js
mkdir -p dist/node_modules/@microsoft/applicationinsights-core-js/browser
cp vscode/node_modules/@microsoft/applicationinsights-core-js/browser/applicationinsights-core-js.min.js dist/node_modules/@microsoft/applicationinsights-core-js/browser/applicationinsights-core-js.min.js

echo "rm sourcemaps"
ls -1 dist/**/* | wc -l
rm -rf dist/**/*.js.map
ls -1 dist/**/* | wc -l