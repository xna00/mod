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
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkParsing", "vs/platform/terminal/common/terminal"], function (require, exports, platform_1, uri_1, uriIdentity_1, workspace_1, terminalLinkHelpers_1, terminalLinkParsing_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLocalLinkDetector = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The max line length to try extract word links from.
         */
        Constants[Constants["MaxLineLength"] = 2000] = "MaxLineLength";
        /**
         * The maximum number of links in a line to resolve against the file system. This limit is put
         * in place to avoid sending excessive data when remote connections are in place.
         */
        Constants[Constants["MaxResolvedLinksInLine"] = 10] = "MaxResolvedLinksInLine";
        /**
         * The maximum length of a link to resolve against the file system. This limit is put in place
         * to avoid sending excessive data when remote connections are in place.
         */
        Constants[Constants["MaxResolvedLinkLength"] = 1024] = "MaxResolvedLinkLength";
    })(Constants || (Constants = {}));
    const fallbackMatchers = [
        // Python style error: File "<path>", line <line>
        /^ *File (?<link>"(?<path>.+)"(, line (?<line>\d+))?)/,
        // Unknown tool #200166: FILE  <path>:<line>:<col>
        /^ +FILE +(?<link>(?<path>.+)(?::(?<line>\d+)(?::(?<col>\d+))?)?)/,
        // Some C++ compile error formats:
        // C:\foo\bar baz(339) : error ...
        // C:\foo\bar baz(339,12) : error ...
        // C:\foo\bar baz(339, 12) : error ...
        // C:\foo\bar baz(339): error ...       [#178584, Visual Studio CL/NVIDIA CUDA compiler]
        // C:\foo\bar baz(339,12): ...
        // C:\foo\bar baz(339, 12): ...
        /^(?<link>(?<path>.+)\((?<line>\d+)(?:, ?(?<col>\d+))?\)) ?:/,
        // C:\foo/bar baz:339 : error ...
        // C:\foo/bar baz:339:12 : error ...
        // C:\foo/bar baz:339: error ...
        // C:\foo/bar baz:339:12: error ...     [#178584, Clang]
        /^(?<link>(?<path>.+):(?<line>\d+)(?::(?<col>\d+))?) ?:/,
        // Cmd prompt
        /^(?<link>(?<path>.+))>/,
        // The whole line is the path
        /^ *(?<link>(?<path>.+))/
    ];
    let TerminalLocalLinkDetector = class TerminalLocalLinkDetector {
        static { this.id = 'local'; }
        constructor(xterm, _capabilities, _processManager, _linkResolver, _logService, _uriIdentityService, _workspaceContextService) {
            this.xterm = xterm;
            this._capabilities = _capabilities;
            this._processManager = _processManager;
            this._linkResolver = _linkResolver;
            this._logService = _logService;
            this._uriIdentityService = _uriIdentityService;
            this._workspaceContextService = _workspaceContextService;
            // This was chosen as a reasonable maximum line length given the tradeoff between performance
            // and how likely it is to encounter such a large line length. Some useful reference points:
            // - Window old max length: 260 ($MAX_PATH)
            // - Linux max length: 4096 ($PATH_MAX)
            this.maxLinkLength = 500;
        }
        async detect(lines, startLine, endLine) {
            const links = [];
            // Get the text representation of the wrapped line
            const text = (0, terminalLinkHelpers_1.getXtermLineContent)(this.xterm.buffer.active, startLine, endLine, this.xterm.cols);
            if (text === '' || text.length > 2000 /* Constants.MaxLineLength */) {
                return [];
            }
            let stringIndex = -1;
            let resolvedLinkCount = 0;
            const os = this._processManager.os || platform_1.OS;
            const parsedLinks = (0, terminalLinkParsing_1.detectLinks)(text, os);
            this._logService.trace('terminalLocalLinkDetector#detect text', text);
            this._logService.trace('terminalLocalLinkDetector#detect parsedLinks', parsedLinks);
            for (const parsedLink of parsedLinks) {
                // Don't try resolve any links of excessive length
                if (parsedLink.path.text.length > 1024 /* Constants.MaxResolvedLinkLength */) {
                    continue;
                }
                // Convert the link text's string index into a wrapped buffer range
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                    startColumn: (parsedLink.prefix?.index ?? parsedLink.path.index) + 1,
                    startLineNumber: 1,
                    endColumn: parsedLink.path.index + parsedLink.path.text.length + (parsedLink.suffix?.suffix.text.length ?? 0) + 1,
                    endLineNumber: 1
                }, startLine);
                // Get a single link candidate if the cwd of the line is known
                const linkCandidates = [];
                const osPath = (0, terminalLinkHelpers_1.osPathModule)(os);
                const isUri = parsedLink.path.text.startsWith('file://');
                if (osPath.isAbsolute(parsedLink.path.text) || parsedLink.path.text.startsWith('~') || isUri) {
                    linkCandidates.push(parsedLink.path.text);
                }
                else {
                    if (this._capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                        const absolutePath = (0, terminalLinkHelpers_1.updateLinkWithRelativeCwd)(this._capabilities, bufferRange.start.y, parsedLink.path.text, osPath, this._logService);
                        // Only add a single exact link candidate if the cwd is available, this may cause
                        // the link to not be resolved but that should only occur when the actual file does
                        // not exist. Doing otherwise could cause unexpected results where handling via the
                        // word link detector is preferable.
                        if (absolutePath) {
                            linkCandidates.push(...absolutePath);
                        }
                    }
                    // Fallback to resolving against the initial cwd, removing any relative directory prefixes
                    if (linkCandidates.length === 0) {
                        linkCandidates.push(parsedLink.path.text);
                        if (parsedLink.path.text.match(/^(\.\.[\/\\])+/)) {
                            linkCandidates.push(parsedLink.path.text.replace(/^(\.\.[\/\\])+/, ''));
                        }
                    }
                }
                // If any candidates end with special characters that are likely to not be part of the
                // link, add a candidate excluding them.
                const specialEndCharRegex = /[\[\]"'\.]$/;
                const trimRangeMap = new Map();
                const specialEndLinkCandidates = [];
                for (const candidate of linkCandidates) {
                    let previous = candidate;
                    let removed = previous.replace(specialEndCharRegex, '');
                    let trimRange = 0;
                    while (removed !== previous) {
                        // Only trim the link if there is no suffix, otherwise the underline would be incorrect
                        if (!parsedLink.suffix) {
                            trimRange++;
                        }
                        specialEndLinkCandidates.push(removed);
                        trimRangeMap.set(removed, trimRange);
                        previous = removed;
                        removed = removed.replace(specialEndCharRegex, '');
                    }
                }
                linkCandidates.push(...specialEndLinkCandidates);
                this._logService.trace('terminalLocalLinkDetector#detect linkCandidates', linkCandidates);
                // Validate the path and convert to the outgoing type
                const simpleLink = await this._validateAndGetLink(undefined, bufferRange, linkCandidates, trimRangeMap);
                if (simpleLink) {
                    simpleLink.parsedLink = parsedLink;
                    simpleLink.text = text.substring(parsedLink.prefix?.index ?? parsedLink.path.index, parsedLink.suffix ? parsedLink.suffix.suffix.index + parsedLink.suffix.suffix.text.length : parsedLink.path.index + parsedLink.path.text.length);
                    this._logService.trace('terminalLocalLinkDetector#detect verified link', simpleLink);
                    links.push(simpleLink);
                }
                // Stop early if too many links exist in the line
                if (++resolvedLinkCount >= 10 /* Constants.MaxResolvedLinksInLine */) {
                    break;
                }
            }
            // Match against the fallback matchers which are mainly designed to catch paths with spaces
            // that aren't possible using the regular mechanism.
            if (links.length === 0) {
                for (const matcher of fallbackMatchers) {
                    const match = text.match(matcher);
                    const group = match?.groups;
                    if (!group) {
                        continue;
                    }
                    const link = group?.link;
                    const path = group?.path;
                    const line = group?.line;
                    const col = group?.col;
                    if (!link || !path) {
                        continue;
                    }
                    // Don't try resolve any links of excessive length
                    if (link.length > 1024 /* Constants.MaxResolvedLinkLength */) {
                        continue;
                    }
                    // Convert the link text's string index into a wrapped buffer range
                    stringIndex = text.indexOf(link);
                    const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                        startColumn: stringIndex + 1,
                        startLineNumber: 1,
                        endColumn: stringIndex + link.length + 1,
                        endLineNumber: 1
                    }, startLine);
                    // Validate and add link
                    const suffix = line ? `:${line}${col ? `:${col}` : ''}` : '';
                    const simpleLink = await this._validateAndGetLink(`${path}${suffix}`, bufferRange, [path]);
                    if (simpleLink) {
                        links.push(simpleLink);
                    }
                    // Only match a single fallback matcher
                    break;
                }
            }
            // Sometimes links are styled specially in the terminal like underlined or bolded, try split
            // the line by attributes and test whether it matches a path
            if (links.length === 0) {
                const rangeCandidates = (0, terminalLinkHelpers_1.getXtermRangesByAttr)(this.xterm.buffer.active, startLine, endLine, this.xterm.cols);
                for (const rangeCandidate of rangeCandidates) {
                    let text = '';
                    for (let y = rangeCandidate.start.y; y <= rangeCandidate.end.y; y++) {
                        const line = this.xterm.buffer.active.getLine(y);
                        if (!line) {
                            break;
                        }
                        const lineStartX = y === rangeCandidate.start.y ? rangeCandidate.start.x : 0;
                        const lineEndX = y === rangeCandidate.end.y ? rangeCandidate.end.x : this.xterm.cols - 1;
                        text += line.translateToString(false, lineStartX, lineEndX);
                    }
                    // HACK: Adjust to 1-based for link API
                    rangeCandidate.start.x++;
                    rangeCandidate.start.y++;
                    rangeCandidate.end.y++;
                    // Validate and add link
                    const simpleLink = await this._validateAndGetLink(text, rangeCandidate, [text]);
                    if (simpleLink) {
                        links.push(simpleLink);
                    }
                    // Stop early if too many links exist in the line
                    if (++resolvedLinkCount >= 10 /* Constants.MaxResolvedLinksInLine */) {
                        break;
                    }
                }
            }
            return links;
        }
        _isDirectoryInsideWorkspace(uri) {
            const folders = this._workspaceContextService.getWorkspace().folders;
            for (let i = 0; i < folders.length; i++) {
                if (this._uriIdentityService.extUri.isEqualOrParent(uri, folders[i].uri)) {
                    return true;
                }
            }
            return false;
        }
        async _validateLinkCandidates(linkCandidates) {
            for (const link of linkCandidates) {
                let uri;
                if (link.startsWith('file://')) {
                    uri = uri_1.URI.parse(link);
                }
                const result = await this._linkResolver.resolveLink(this._processManager, link, uri);
                if (result) {
                    return result;
                }
            }
            return undefined;
        }
        /**
         * Validates a set of link candidates and returns a link if validated.
         * @param linkText The link text, this should be undefined to use the link stat value
         * @param trimRangeMap A map of link candidates to the amount of buffer range they need trimmed.
         */
        async _validateAndGetLink(linkText, bufferRange, linkCandidates, trimRangeMap) {
            const linkStat = await this._validateLinkCandidates(linkCandidates);
            if (linkStat) {
                let type;
                if (linkStat.isDirectory) {
                    if (this._isDirectoryInsideWorkspace(linkStat.uri)) {
                        type = "LocalFolderInWorkspace" /* TerminalBuiltinLinkType.LocalFolderInWorkspace */;
                    }
                    else {
                        type = "LocalFolderOutsideWorkspace" /* TerminalBuiltinLinkType.LocalFolderOutsideWorkspace */;
                    }
                }
                else {
                    type = "LocalFile" /* TerminalBuiltinLinkType.LocalFile */;
                }
                // Offset the buffer range if the link range was trimmed
                const trimRange = trimRangeMap?.get(linkStat.link);
                if (trimRange) {
                    bufferRange.end.x -= trimRange;
                    if (bufferRange.end.x < 0) {
                        bufferRange.end.y--;
                        bufferRange.end.x += this.xterm.cols;
                    }
                }
                return {
                    text: linkText ?? linkStat.link,
                    uri: linkStat.uri,
                    bufferRange: bufferRange,
                    type
                };
            }
            return undefined;
        }
    };
    exports.TerminalLocalLinkDetector = TerminalLocalLinkDetector;
    exports.TerminalLocalLinkDetector = TerminalLocalLinkDetector = __decorate([
        __param(4, terminal_1.ITerminalLogService),
        __param(5, uriIdentity_1.IUriIdentityService),
        __param(6, workspace_1.IWorkspaceContextService)
    ], TerminalLocalLinkDetector);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMb2NhbExpbmtEZXRlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL2Jyb3dzZXIvdGVybWluYWxMb2NhbExpbmtEZXRlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjaEcsSUFBVyxTQWlCVjtJQWpCRCxXQUFXLFNBQVM7UUFDbkI7O1dBRUc7UUFDSCw4REFBb0IsQ0FBQTtRQUVwQjs7O1dBR0c7UUFDSCw4RUFBMkIsQ0FBQTtRQUUzQjs7O1dBR0c7UUFDSCw4RUFBNEIsQ0FBQTtJQUM3QixDQUFDLEVBakJVLFNBQVMsS0FBVCxTQUFTLFFBaUJuQjtJQUVELE1BQU0sZ0JBQWdCLEdBQWE7UUFDbEMsaURBQWlEO1FBQ2pELHNEQUFzRDtRQUN0RCxrREFBa0Q7UUFDbEQsa0VBQWtFO1FBQ2xFLGtDQUFrQztRQUNsQyxrQ0FBa0M7UUFDbEMscUNBQXFDO1FBQ3JDLHNDQUFzQztRQUN0Qyx3RkFBd0Y7UUFDeEYsOEJBQThCO1FBQzlCLCtCQUErQjtRQUMvQiw2REFBNkQ7UUFDN0QsaUNBQWlDO1FBQ2pDLG9DQUFvQztRQUNwQyxnQ0FBZ0M7UUFDaEMsd0RBQXdEO1FBQ3hELHdEQUF3RDtRQUN4RCxhQUFhO1FBQ2Isd0JBQXdCO1FBQ3hCLDZCQUE2QjtRQUM3Qix5QkFBeUI7S0FDekIsQ0FBQztJQUVLLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQXlCO2lCQUM5QixPQUFFLEdBQUcsT0FBTyxBQUFWLENBQVc7UUFRcEIsWUFDVSxLQUFlLEVBQ1AsYUFBdUMsRUFDdkMsZUFBeUosRUFDekosYUFBb0MsRUFDaEMsV0FBaUQsRUFDakQsbUJBQXlELEVBQ3BELHdCQUFtRTtZQU5wRixVQUFLLEdB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