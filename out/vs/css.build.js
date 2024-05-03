/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CSSPluginUtilities = void 0;
    exports.load = load;
    exports.write = write;
    exports.writeFile = writeFile;
    exports.getInlinedResources = getInlinedResources;
    exports.rewriteUrls = rewriteUrls;
    const nodeReq = (module) => {
        if (typeof require.__$__nodeRequire === 'function') {
            return require.__$__nodeRequire(module);
        }
        return undefined;
    };
    const fs = nodeReq('fs');
    const path = nodeReq('path');
    let inlineResources = false;
    let inlineResourcesLimit = 5000;
    const contentsMap = {};
    const pathMap = {};
    const entryPoints = {};
    const inlinedResources = [];
    /**
     * Invoked by the loader at build-time
     */
    function load(name, req, load, config) {
        if (!fs) {
            throw new Error(`Cannot load files without 'fs'!`);
        }
        config = config || {};
        const myConfig = (config['vs/css'] || {});
        inlineResources = (typeof myConfig.inlineResources === 'undefined' ? false : myConfig.inlineResources);
        inlineResourcesLimit = (myConfig.inlineResourcesLimit || 5000);
        const cssUrl = req.toUrl(name + '.css');
        let contents = fs.readFileSync(cssUrl, 'utf8');
        if (contents.charCodeAt(0) === 65279 /* BOM */) {
            // Remove BOM
            contents = contents.substring(1);
        }
        if (config.isBuild) {
            contentsMap[name] = contents;
            pathMap[name] = cssUrl;
        }
        load({});
    }
    /**
     * Invoked by the loader at build-time
     */
    function write(pluginName, moduleName, write) {
        const entryPoint = write.getEntryPoint();
        entryPoints[entryPoint] = entryPoints[entryPoint] || [];
        entryPoints[entryPoint].push({
            moduleName: moduleName,
            contents: contentsMap[moduleName],
            fsPath: pathMap[moduleName],
        });
        write.asModule(pluginName + '!' + moduleName, 'define([\'vs/css!' + entryPoint + '\'], {});');
    }
    /**
     * Invoked by the loader at build-time
     */
    function writeFile(pluginName, moduleName, req, write, config) {
        if (entryPoints && entryPoints.hasOwnProperty(moduleName)) {
            const fileName = req.toUrl(moduleName + '.css');
            const contents = [
                '/*---------------------------------------------------------',
                ' * Copyright (c) Microsoft Corporation. All rights reserved.',
                ' *--------------------------------------------------------*/'
            ], entries = entryPoints[moduleName];
            for (let i = 0; i < entries.length; i++) {
                if (inlineResources) {
                    contents.push(rewriteOrInlineUrls(entries[i].fsPath, entries[i].moduleName, moduleName, entries[i].contents, inlineResources === 'base64', inlineResourcesLimit));
                }
                else {
                    contents.push(rewriteUrls(entries[i].moduleName, moduleName, entries[i].contents));
                }
            }
            write(fileName, contents.join('\r\n'));
        }
    }
    function getInlinedResources() {
        return inlinedResources || [];
    }
    function rewriteOrInlineUrls(originalFileFSPath, originalFile, newFile, contents, forceBase64, inlineByteLimit) {
        if (!fs || !path) {
            throw new Error(`Cannot rewrite or inline urls without 'fs' or 'path'!`);
        }
        return CSSPluginUtilities.replaceURL(contents, (url) => {
            if (/\.(svg|png)$/.test(url)) {
                const fsPath = path.join(path.dirname(originalFileFSPath), url);
                const fileContents = fs.readFileSync(fsPath);
                if (fileContents.length < inlineByteLimit) {
                    const normalizedFSPath = fsPath.replace(/\\/g, '/');
                    inlinedResources.push(normalizedFSPath);
                    const MIME = /\.svg$/.test(url) ? 'image/svg+xml' : 'image/png';
                    let DATA = ';base64,' + fileContents.toString('base64');
                    if (!forceBase64 && /\.svg$/.test(url)) {
                        // .svg => url encode as explained at https://codepen.io/tigt/post/optimizing-svgs-in-data-uris
                        const newText = fileContents.toString()
                            .replace(/"/g, '\'')
                            .replace(/%/g, '%25')
                            .replace(/</g, '%3C')
                            .replace(/>/g, '%3E')
                            .replace(/&/g, '%26')
                            .replace(/#/g, '%23')
                            .replace(/\s+/g, ' ');
                        const encodedData = ',' + newText;
                        if (encodedData.length < DATA.length) {
                            DATA = encodedData;
                        }
                    }
                    return '"data:' + MIME + DATA + '"';
                }
            }
            const absoluteUrl = CSSPluginUtilities.joinPaths(CSSPluginUtilities.pathOf(originalFile), url);
            return CSSPluginUtilities.relativePath(newFile, absoluteUrl);
        });
    }
    function rewriteUrls(originalFile, newFile, contents) {
        return CSSPluginUtilities.replaceURL(contents, (url) => {
            const absoluteUrl = CSSPluginUtilities.joinPaths(CSSPluginUtilities.pathOf(originalFile), url);
            return CSSPluginUtilities.relativePath(newFile, absoluteUrl);
        });
    }
    class CSSPluginUtilities {
        static startsWith(haystack, needle) {
            return haystack.length >= needle.length && haystack.substr(0, needle.length) === needle;
        }
        /**
         * Find the path of a file.
         */
        static pathOf(filename) {
            const lastSlash = filename.lastIndexOf('/');
            if (lastSlash !== -1) {
                return filename.substr(0, lastSlash + 1);
            }
            else {
                return '';
            }
        }
        /**
         * A conceptual a + b for paths.
         * Takes into account if `a` contains a protocol.
         * Also normalizes the result: e.g.: a/b/ + ../c => a/c
         */
        static joinPaths(a, b) {
            function findSlashIndexAfterPrefix(haystack, prefix) {
                if (CSSPluginUtilities.startsWith(haystack, prefix)) {
                    return Math.max(prefix.length, haystack.indexOf('/', prefix.length));
                }
                return 0;
            }
            let aPathStartIndex = 0;
            aPathStartIndex = aPathStartIndex || findSlashIndexAfterPrefix(a, '//');
            aPathStartIndex = aPathStartIndex || findSlashIndexAfterPrefix(a, 'http://');
            aPathStartIndex = aPathStartIndex || findSlashIndexAfterPrefix(a, 'https://');
            function pushPiece(pieces, piece) {
                if (piece === './') {
                    // Ignore
                    return;
                }
                if (piece === '../') {
                    const prevPiece = (pieces.length > 0 ? pieces[pieces.length - 1] : null);
                    if (prevPiece && prevPiece === '/') {
                        // Ignore
                        return;
                    }
                    if (prevPiece && prevPiece !== '../') {
                        // Pop
                        pieces.pop();
                        return;
                    }
                }
                // Push
                pieces.push(piece);
            }
            function push(pieces, path) {
                while (path.length > 0) {
                    const slashIndex = path.indexOf('/');
                    const piece = (slashIndex >= 0 ? path.substring(0, slashIndex + 1) : path);
                    path = (slashIndex >= 0 ? path.substring(slashIndex + 1) : '');
                    pushPiece(pieces, piece);
                }
            }
            let pieces = [];
            push(pieces, a.substr(aPathStartIndex));
            if (b.length > 0 && b.charAt(0) === '/') {
                pieces = [];
            }
            push(pieces, b);
            return a.substring(0, aPathStartIndex) + pieces.join('');
        }
        static commonPrefix(str1, str2) {
            const len = Math.min(str1.length, str2.length);
            for (let i = 0; i < len; i++) {
                if (str1.charCodeAt(i) !== str2.charCodeAt(i)) {
                    return str1.substring(0, i);
                }
            }
            return str1.substring(0, len);
        }
        static commonFolderPrefix(fromPath, toPath) {
            const prefix = CSSPluginUtilities.commonPrefix(fromPath, toPath);
            const slashIndex = prefix.lastIndexOf('/');
            if (slashIndex === -1) {
                return '';
            }
            return prefix.substring(0, slashIndex + 1);
        }
        static relativePath(fromPath, toPath) {
            if (CSSPluginUtilities.startsWith(toPath, '/') || CSSPluginUtilities.startsWith(toPath, 'http://') || CSSPluginUtilities.startsWith(toPath, 'https://')) {
                return toPath;
            }
            // Ignore common folder prefix
            const prefix = CSSPluginUtilities.commonFolderPrefix(fromPath, toPath);
            fromPath = fromPath.substr(prefix.length);
            toPath = toPath.substr(prefix.length);
            const upCount = fromPath.split('/').length;
            let result = '';
            for (let i = 1; i < upCount; i++) {
                result += '../';
            }
            return result + toPath;
        }
        static replaceURL(contents, replacer) {
            // Use ")" as the terminator as quotes are oftentimes not used at all
            return contents.replace(/url\(\s*([^\)]+)\s*\)?/g, (_, ...matches) => {
                let url = matches[0];
                // Eliminate starting quotes (the initial whitespace is not captured)
                if (url.charAt(0) === '"' || url.charAt(0) === '\'') {
                    url = url.substring(1);
                }
                // The ending whitespace is captured
                while (url.length > 0 && (url.charAt(url.length - 1) === ' ' || url.charAt(url.length - 1) === '\t')) {
                    url = url.substring(0, url.length - 1);
                }
                // Eliminate ending quotes
                if (url.charAt(url.length - 1) === '"' || url.charAt(url.length - 1) === '\'') {
                    url = url.substring(0, url.length - 1);
                }
                if (!CSSPluginUtilities.startsWith(url, 'data:') && !CSSPluginUtilities.startsWith(url, 'http://') && !CSSPluginUtilities.startsWith(url, 'https://')) {
                    url = replacer(url);
                }
                return 'url(' + url + ')';
            });
        }
    }
    exports.CSSPluginUtilities = CSSPluginUtilities;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzLmJ1aWxkLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9jc3MuYnVpbGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaURoRyxvQkFtQkM7SUFLRCxzQkFhQztJQUtELDhCQWtCQztJQUVELGtEQUVDO0lBMENELGtDQUtDO0lBcElELE1BQU0sT0FBTyxHQUFHLENBQUksTUFBYyxFQUFpQixFQUFFO1FBQ3BELElBQUksT0FBYSxPQUFRLENBQUMsZ0JBQWdCLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDM0QsT0FBYSxPQUFRLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUMsQ0FBQztJQUVGLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBVSxJQUFJLENBQUMsQ0FBQztJQUNsQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQVksTUFBTSxDQUFDLENBQUM7SUFFeEMsSUFBSSxlQUFlLEdBQXVCLEtBQUssQ0FBQztJQUNoRCxJQUFJLG9CQUFvQixHQUFXLElBQUksQ0FBQztJQUV4QyxNQUFNLFdBQVcsR0FBcUMsRUFBRSxDQUFDO0lBQ3pELE1BQU0sT0FBTyxHQUFxQyxFQUFFLENBQUM7SUFDckQsTUFBTSxXQUFXLEdBQW1ELEVBQUUsQ0FBQztJQUN2RSxNQUFNLGdCQUFnQixHQUFhLEVBQUUsQ0FBQztJQUV0Qzs7T0FFRztJQUNILFNBQWdCLElBQUksQ0FBQyxJQUFZLEVBQUUsR0FBK0IsRUFBRSxJQUFtQyxFQUFFLE1BQXVDO1FBQy9JLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBQ0QsTUFBTSxHQUFHLE1BQU0sSUFBSSxFQUFFLENB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