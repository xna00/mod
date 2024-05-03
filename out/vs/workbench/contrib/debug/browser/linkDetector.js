/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/opener/common/opener", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/path/common/pathService", "vs/base/browser/keyboardEvent", "vs/nls", "vs/platform/tunnel/common/tunnel", "vs/platform/configuration/common/configuration", "vs/base/browser/dom"], function (require, exports, network_1, osPath, platform, uri_1, files_1, opener_1, editorService_1, environmentService_1, pathService_1, keyboardEvent_1, nls_1, tunnel_1, configuration_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinkDetector = void 0;
    const CONTROL_CODES = '\\u0000-\\u0020\\u007f-\\u009f';
    const WEB_LINK_REGEX = new RegExp('(?:[a-zA-Z][a-zA-Z0-9+.-]{2,}:\\/\\/|data:|www\\.)[^\\s' + CONTROL_CODES + '"]{2,}[^\\s' + CONTROL_CODES + '"\')}\\],:;.!?]', 'ug');
    const WIN_ABSOLUTE_PATH = /(?:[a-zA-Z]:(?:(?:\\|\/)[\w\.-]*)+)/;
    const WIN_RELATIVE_PATH = /(?:(?:\~|\.)(?:(?:\\|\/)[\w\.-]*)+)/;
    const WIN_PATH = new RegExp(`(${WIN_ABSOLUTE_PATH.source}|${WIN_RELATIVE_PATH.source})`);
    const POSIX_PATH = /((?:\~|\.)?(?:\/[\w\.-]*)+)/;
    const LINE_COLUMN = /(?:\:([\d]+))?(?:\:([\d]+))?/;
    const PATH_LINK_REGEX = new RegExp(`${platform.isWindows ? WIN_PATH.source : POSIX_PATH.source}${LINE_COLUMN.source}`, 'g');
    const LINE_COLUMN_REGEX = /:([\d]+)(?::([\d]+))?$/;
    const MAX_LENGTH = 2000;
    let LinkDetector = class LinkDetector {
        constructor(editorService, fileService, openerService, pathService, tunnelService, environmentService, configurationService) {
            this.editorService = editorService;
            this.fileService = fileService;
            this.openerService = openerService;
            this.pathService = pathService;
            this.tunnelService = tunnelService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            // noop
        }
        /**
         * Matches and handles web urls, absolute and relative file links in the string provided.
         * Returns <span/> element that wraps the processed string, where matched links are replaced by <a/>.
         * 'onclick' event is attached to all anchored links that opens them in the editor.
         * When splitLines is true, each line of the text, even if it contains no links, is wrapped in a <span>
         * and added as a child of the returned <span>.
         */
        linkify(text, splitLines, workspaceFolder, includeFulltext) {
            if (splitLines) {
                const lines = text.split('\n');
                for (let i = 0; i < lines.length - 1; i++) {
                    lines[i] = lines[i] + '\n';
                }
                if (!lines[lines.length - 1]) {
                    // Remove the last element ('') that split added.
                    lines.pop();
                }
                const elements = lines.map(line => this.linkify(line, false, workspaceFolder, includeFulltext));
                if (elements.length === 1) {
                    // Do not wrap single line with extra span.
                    return elements[0];
                }
                const container = document.createElement('span');
                elements.forEach(e => container.appendChild(e));
                return container;
            }
            const container = document.createElement('span');
            for (const part of this.detectLinks(text)) {
                try {
                    switch (part.kind) {
                        case 'text':
                            container.appendChild(document.createTextNode(part.value));
                            break;
                        case 'web':
                            container.appendChild(this.createWebLink(includeFulltext ? text : undefined, part.value));
                            break;
                        case 'path': {
                            const path = part.captures[0];
                            const lineNumber = part.captures[1] ? Number(part.captures[1]) : 0;
                            const columnNumber = part.captures[2] ? Number(part.captures[2]) : 0;
                            container.appendChild(this.createPathLink(includeFulltext ? text : undefined, part.value, path, lineNumber, columnNumber, workspaceFolder));
                            break;
                        }
                    }
                }
                catch (e) {
                    container.appendChild(document.createTextNode(part.value));
                }
            }
            return container;
        }
        createWebLink(fulltext, url) {
            const link = this.createLink(url);
            let uri = uri_1.URI.parse(url);
            // if the URI ends with something like `foo.js:12:3`, parse
            // that into a fragment to reveal that location (#150702)
            const lineCol = LINE_COLUMN_REGEX.exec(uri.path);
            if (lineCol) {
                uri = uri.with({
                    path: uri.path.slice(0, lineCol.index),
                    fragment: `L${lineCol[0].slice(1)}`
                });
            }
            this.decorateLink(link, uri, fulltext, async () => {
                if (uri.scheme === network_1.Schemas.file) {
                    // Just using fsPath here is unsafe: https://github.com/microsoft/vscode/issues/109076
                    const fsPath = uri.fsPath;
                    const path = await this.pathService.path;
                    const fileUrl = osPath.normalize(((path.sep === osPath.posix.sep) && platform.isWindows) ? fsPath.replace(/\\/g, osPath.posix.sep) : fsPath);
                    const fileUri = uri_1.URI.parse(fileUrl);
                    const exists = await this.fileService.exists(fileUri);
                    if (!exists) {
                        return;
                    }
                    await this.editorService.openEditor({
                        resource: fileUri,
                        options: {
                            pinned: true,
                            selection: lineCol ? { startLineNumber: +lineCol[1], startColumn: +lineCol[2] } : undefined,
                        },
                    });
                    return;
                }
                this.openerService.open(url, { allowTunneling: (!!this.environmentService.remoteAuthority && this.configurationService.getValue('remote.forwardOnOpen')) });
            });
            return link;
        }
        createPathLink(fulltext, text, path, lineNumber, columnNumber, workspaceFolder) {
            if (path[0] === '/' && path[1] === '/') {
                // Most likely a url part which did not match, for example ftp://path.
                return document.createTextNode(text);
            }
            const options = { selection: { startLineNumber: lineNumber, startColumn: columnNumber } };
            if (path[0] === '.') {
                if (!workspaceFolder) {
                    return document.createTextNode(text);
                }
                const uri = workspaceFolder.toResource(path);
                const link = this.createLink(text);
                this.decorateLink(link, uri, fulltext, (preserveFocus) => this.editorService.openEditor({ resource: uri, options: { ...options, preserveFocus } }));
                return link;
            }
            if (path[0] === '~') {
                const userHome = this.pathService.resolvedUserHome;
                if (userHome) {
                    path = osPath.join(userHome.fsPath, path.substring(1));
                }
            }
            const link = this.createLink(text);
            link.tabIndex = 0;
            const uri = uri_1.URI.file(osPath.normalize(path));
            this.fileService.stat(uri).then(stat => {
                if (stat.isDirectory) {
                    return;
                }
                this.decorateLink(link, uri, fulltext, (preserveFocus) => this.editorService.openEditor({ resource: uri, options: { ...options, preserveFocus } }));
            }).catch(() => {
                // If the uri can not be resolved we should not spam the console with error, remain quite #86587
            });
            return link;
        }
        createLink(text) {
            const link = document.createElement('a');
            link.textContent = text;
            return link;
        }
        decorateLink(link, uri, fulltext, onClick) {
            link.classList.add('link');
            const followLink = this.tunnelService.canTunnel(uri) ? (0, nls_1.localize)('followForwardedLink', "follow link using forwarded port") : (0, nls_1.localize)('followLink', "follow link");
            link.title = fulltext
                ? (platform.isMacintosh ? (0, nls_1.localize)('fileLinkWithPathMac', "Cmd + click to {0}\n{1}", followLink, fulltext) : (0, nls_1.localize)('fileLinkWithPath', "Ctrl + click to {0}\n{1}", followLink, fulltext))
                : (platform.isMacintosh ? (0, nls_1.localize)('fileLinkMac', "Cmd + click to {0}", followLink) : (0, nls_1.localize)('fileLink', "Ctrl + click to {0}", followLink));
            link.onmousemove = (event) => { link.classList.toggle('pointer', platform.isMacintosh ? event.metaKey : event.ctrlKey); };
            link.onmouseleave = () => link.classList.remove('pointer');
            link.onclick = (event) => {
                const selection = (0, dom_1.getWindow)(link).getSelection();
                if (!selection || selection.type === 'Range') {
                    return; // do not navigate when user is selecting
                }
                if (!(platform.isMacintosh ? event.metaKey : event.ctrlKey)) {
                    return;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                onClick(false);
            };
            link.onkeydown = e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.keyCode === 3 /* KeyCode.Enter */ || event.keyCode === 10 /* KeyCode.Space */) {
                    event.preventDefault();
                    event.stopPropagation();
                    onClick(event.keyCode === 10 /* KeyCode.Space */);
                }
            };
        }
        detectLinks(text) {
            if (text.length > MAX_LENGTH) {
                return [{ kind: 'text', value: text, captures: [] }];
            }
            const regexes = [WEB_LINK_REGEX, PATH_LINK_REGEX];
            const kinds = ['web', 'path'];
            const result = [];
            const splitOne = (text, regexIndex) => {
                if (regexIndex >= regexes.length) {
                    result.push({ value: text, kind: 'text', captures: [] });
                    return;
                }
                const regex = regexes[regexIndex];
                let currentIndex = 0;
                let match;
                regex.lastIndex = 0;
                while ((match = regex.exec(text)) !== null) {
                    const stringBeforeMatch = text.substring(currentIndex, match.index);
                    if (stringBeforeMatch) {
                        splitOne(stringBeforeMatch, regexIndex + 1);
                    }
                    const value = match[0];
                    result.push({
                        value: value,
                        kind: kinds[regexIndex],
                        captures: match.slice(1)
                    });
                    currentIndex = match.index + value.length;
                }
                const stringAfterMatches = text.substring(currentIndex);
                if (stringAfterMatches) {
                    splitOne(stringAfterMatches, regexIndex + 1);
                }
            };
            splitOne(text, 0);
            return result;
        }
    };
    exports.LinkDetector = LinkDetector;
    exports.LinkDetector = LinkDetector = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, files_1.IFileService),
        __param(2, opener_1.IOpenerService),
        __param(3, pathService_1.IPathService),
        __param(4, tunnel_1.ITunnelService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, configuration_1.IConfigurationService)
    ], LinkDetector);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua0RldGVjdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2xpbmtEZXRlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLE1BQU0sYUFBYSxHQUFHLGdDQUFnQyxDQUFDO0lBQ3ZELE1BQU0sY0FBYyxHQUFHLElBQUksTUFBTSxDQUFDLHlEQUF5RCxHQUFHLGFBQWEsR0FBRyxhQUFhLEdBQUcsYUFBYSxHQUFHLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO0lBRXZLLE1BQU0saUJBQWlCLEdBQUcscUNBQXFDLENBQUM7SUFDaEUsTUFBTSxpQkFBaUIsR0FBRyxxQ0FBcUMsQ0FBQztJQUNoRSxNQUFNLFFBQVEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLGlCQUFpQixDQUFDLE1BQU0sSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3pGLE1BQU0sVUFBVSxHQUFHLDZCQUE2QixDQUFDO0lBQ2pELE1BQU0sV0FBVyxHQUFHLDhCQUE4QixDQUFDO0lBQ25ELE1BQU0sZUFBZSxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDNUgsTUFBTSxpQkFBaUIsR0FBRyx3QkFBd0IsQ0FBQztJQUVuRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUM7SUFTakIsSUFBTSxZQUFZLEdBQWxCLE1BQU0sWUFBWTtRQUN4QixZQUNrQyxhQUE2QixFQUMvQixXQUF5QixFQUN2QixhQUE2QixFQUMv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