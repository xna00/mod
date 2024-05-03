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
define(["require", "exports", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/platform/terminal/common/terminal"], function (require, exports, uriIdentity_1, workspace_1, terminalLinkHelpers_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalMultiLineLinkDetector = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The max line length to try extract word links from.
         */
        Constants[Constants["MaxLineLength"] = 2000] = "MaxLineLength";
        /**
         * The maximum length of a link to resolve against the file system. This limit is put in place
         * to avoid sending excessive data when remote connections are in place.
         */
        Constants[Constants["MaxResolvedLinkLength"] = 1024] = "MaxResolvedLinkLength";
    })(Constants || (Constants = {}));
    const lineNumberPrefixMatchers = [
        // Ripgrep:
        //   /some/file
        //   16:searchresult
        //   16:    searchresult
        // Eslint:
        //   /some/file
        //     16:5  error ...
        /^ *(?<link>(?<line>\d+):(?<col>\d+)?)/
    ];
    const gitDiffMatchers = [
        // --- a/some/file
        // +++ b/some/file
        // @@ -8,11 +8,11 @@ file content...
        /^(?<link>@@ .+ \+(?<toFileLine>\d+),(?<toFileCount>\d+) @@)/
    ];
    let TerminalMultiLineLinkDetector = class TerminalMultiLineLinkDetector {
        static { this.id = 'multiline'; }
        constructor(xterm, _processManager, _linkResolver, _logService, _uriIdentityService, _workspaceContextService) {
            this.xterm = xterm;
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
            this._logService.trace('terminalMultiLineLinkDetector#detect text', text);
            // Match against the fallback matchers which are mainly designed to catch paths with spaces
            // that aren't possible using the regular mechanism.
            for (const matcher of lineNumberPrefixMatchers) {
                const match = text.match(matcher);
                const group = match?.groups;
                if (!group) {
                    continue;
                }
                const link = group?.link;
                const line = group?.line;
                const col = group?.col;
                if (!link || line === undefined) {
                    continue;
                }
                // Don't try resolve any links of excessive length
                if (link.length > 1024 /* Constants.MaxResolvedLinkLength */) {
                    continue;
                }
                this._logService.trace('terminalMultiLineLinkDetector#detect candidate', link);
                // Scan up looking for the first line that could be a path
                let possiblePath;
                for (let index = startLine - 1; index >= 0; index--) {
                    // Ignore lines that aren't at the beginning of a wrapped line
                    if (this.xterm.buffer.active.getLine(index).isWrapped) {
                        continue;
                    }
                    const text = (0, terminalLinkHelpers_1.getXtermLineContent)(this.xterm.buffer.active, index, index, this.xterm.cols);
                    if (!text.match(/^\s*\d/)) {
                        possiblePath = text;
                        break;
                    }
                }
                if (!possiblePath) {
                    continue;
                }
                // Check if the first non-matching line is an absolute or relative link
                const linkStat = await this._linkResolver.resolveLink(this._processManager, possiblePath);
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
                    // Convert the entire line's text string index into a wrapped buffer range
                    const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                        startColumn: 1,
                        startLineNumber: 1,
                        endColumn: 1 + text.length,
                        endLineNumber: 1
                    }, startLine);
                    const simpleLink = {
                        text: link,
                        uri: linkStat.uri,
                        selection: {
                            startLineNumber: parseInt(line),
                            startColumn: col ? parseInt(col) : 1
                        },
                        disableTrimColon: true,
                        bufferRange: bufferRange,
                        type
                    };
                    this._logService.trace('terminalMultiLineLinkDetector#detect verified link', simpleLink);
                    links.push(simpleLink);
                    // Break on the first match
                    break;
                }
            }
            if (links.length === 0) {
                for (const matcher of gitDiffMatchers) {
                    const match = text.match(matcher);
                    const group = match?.groups;
                    if (!group) {
                        continue;
                    }
                    const link = group?.link;
                    const toFileLine = group?.toFileLine;
                    const toFileCount = group?.toFileCount;
                    if (!link || toFileLine === undefined) {
                        continue;
                    }
                    // Don't try resolve any links of excessive length
                    if (link.length > 1024 /* Constants.MaxResolvedLinkLength */) {
                        continue;
                    }
                    this._logService.trace('terminalMultiLineLinkDetector#detect candidate', link);
                    // Scan up looking for the first line that could be a path
                    let possiblePath;
                    for (let index = startLine - 1; index >= 0; index--) {
                        // Ignore lines that aren't at the beginning of a wrapped line
                        if (this.xterm.buffer.active.getLine(index).isWrapped) {
                            continue;
                        }
                        const text = (0, terminalLinkHelpers_1.getXtermLineContent)(this.xterm.buffer.active, index, index, this.xterm.cols);
                        const match = text.match(/\+\+\+ b\/(?<path>.+)/);
                        if (match) {
                            possiblePath = match.groups?.path;
                            break;
                        }
                    }
                    if (!possiblePath) {
                        continue;
                    }
                    // Check if the first non-matching line is an absolute or relative link
                    const linkStat = await this._linkResolver.resolveLink(this._processManager, possiblePath);
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
                        // Convert the link to the buffer range
                        const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                            startColumn: 1,
                            startLineNumber: 1,
                            endColumn: 1 + link.length,
                            endLineNumber: 1
                        }, startLine);
                        const simpleLink = {
                            text: link,
                            uri: linkStat.uri,
                            selection: {
                                startLineNumber: parseInt(toFileLine),
                                startColumn: 1,
                                endLineNumber: parseInt(toFileLine) + parseInt(toFileCount)
                            },
                            bufferRange: bufferRange,
                            type
                        };
                        this._logService.trace('terminalMultiLineLinkDetector#detect verified link', simpleLink);
                        links.push(simpleLink);
                        // Break on the first match
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
    };
    exports.TerminalMultiLineLinkDetector = TerminalMultiLineLinkDetector;
    exports.TerminalMultiLineLinkDetector = TerminalMultiLineLinkDetector = __decorate([
        __param(3, terminal_1.ITerminalLogService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, workspace_1.IWorkspaceContextService)
    ], TerminalMultiLineLinkDetector);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxNdWx0aUxpbmVMaW5rRGV0ZWN0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9saW5rcy9icm93c2VyL3Rlcm1pbmFsTXVsdGlMaW5lTGlua0RldGVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVdoRyxJQUFXLFNBV1Y7SUFYRCxXQUFXLFNBQVM7UUFDbkI7O1dBRUc7UUFDSCw4REFBb0IsQ0FBQTtRQUVwQjs7O1dBR0c7UUFDSCw4RUFBNEIsQ0FBQTtJQUM3QixDQUFDLEVBWFUsU0FBUyxLQUFULFNBQVMsUUFXbkI7SUFFRCxNQUFNLHdCQUF3QixHQUFHO1FBQ2hDLFdBQVc7UUFDWCxlQUFlO1FBQ2Ysb0JBQW9CO1FBQ3BCLHdCQUF3QjtRQUN4QixVQUFVO1FBQ1YsZUFBZTtRQUNmLHNCQUFzQjtRQUN0Qix1Q0FBdUM7S0FDdkMsQ0FBQztJQUVGLE1BQU0sZUFBZSxHQUFHO1FBQ3ZCLGtCQUFrQjtRQUNsQixrQkFBa0I7UUFDbEIsb0NBQW9DO1FBQ3BDLDZEQUE2RDtLQUM3RCxDQUFDO0lBRUssSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBNkI7aUJBQ2xDLE9BQUUsR0FBRyxXQUFXLEFBQWQsQ0FBZTtRQVF4QixZQUNVLEtBQWUsRUFDUCxlQUF5SixFQUN6SixhQUFvQyxFQUNoQyxXQUFpRCxFQUNqRCxtQkFBeUQsRUFDcEQsd0JBQW1FO1lBTHBGLFVBQUssR0FBTCxLQUFLLENBQVU7WUFDUCxvQkFBZSxHQUFmLGVBQWUsQ0FBMEk7WUFDekosa0JBQWEsR0FBYixhQUFhLENBQXVCO1lBQ2YsZ0JBQVcsR0FBWCxXQUFXLENBQXFCO1lBQ2hDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDbkMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQVo5Riw2RkFBNkY7WUFDN0YsNEZBQTRGO1lBQzVGLDJDQUEyQztZQUMzQyx1Q0FBdUM7WUFDOUIsa0JBQWEsR0FBRyxHQUFHLENBQUM7UUFVN0IsQ0FBQztRQUVELEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBb0IsRUFBRSxTQUFpQixFQUFFLE9BQWU7WUFDcEUsTUFBTSxLQUFLLEdBQTBCLEVBQUUsQ0FBQztZQUV4QyxrREFBa0Q7WUFDbEQsTUFBTSxJQUFJLEdBQUcsSUFBQSx5Q0FBbUIsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hHLElBQUksSUFBSSxLQUFLLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxxQ0FBMEIsRUFBRSxDQUFDO2dCQUMxRCxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQywyQ0FBMkMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUUxRSwyRkFBMkY7WUFDM0Ysb0RBQW9EO1lBQ3BELEtBQUssTUFBTSxPQUFPLElBQUksd0JBQXdCLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxFQUFFLE1BQU0sQ0FBQztnQkFDNUIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNaLFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsSUFBSSxDQUFDO2dCQUN6QixNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsSUFBSSxDQUFDO2dCQUN6QixNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBRyxDQUFDO2dCQUN2QixJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDakMsU0FBUztnQkFDVixDQUFDO2dCQUVELGtEQUFrRDtnQkFDbEQsSUFBSSxJQUFJLENBQUMsTUFBTSw2Q0FBa0MsRUFBRSxDQUFDO29CQUNuRCxTQUFTO2dCQUNWLENBQUM7Z0JBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsZ0RBQWdELEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRS9FLDBEQUEwRDtnQkFDMUQsSUFBSSxZQUFnQyxDQUFDO2dCQUNyQyxLQUFLLElBQUksS0FBSyxHQUFHLFNBQVMsR0FBRyxDQUFDLEVBQUUsS0FBSyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO29CQUNyRCw4REFBOEQ7b0JBQzlELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQzt3QkFDeEQsU0FBUztvQkFDVixDQUFDO29CQUNELE1BQU0sSUFBSSxHQUFHLElBQUEseUNBQW1CLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDMUYsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQzt3QkFDM0IsWUFBWSxHQUFHLElBQUksQ0FBQzt3QkFDcEIsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUNuQixTQUFTO2dCQUNWLENBQUM7Z0JBRUQsdUVBQXVFO2dCQUN2RSxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQzFGLElBQUksUUFBUSxFQUFFLENBQUM7b0JBQ2QsSUFBSSxJQUE2QixDQUFDO29CQUNsQyxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDMUIsSUFBSSxJQUFJLENBQUMsMkJBQTJCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7NEJBQ3BELElBQUksZ0ZBQWlELENBQUM7d0JBQ3ZELENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxJQUFJLDBGQUFzRCxDQUFDO3dCQUM1RCxDQUFDO29CQUNGLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLHNEQUFvQyxDQUFDO29CQUMxQyxDQUFDO29CQUVELDBFQUEwRTtvQkFDMUUsTUFBTSxXQUFXLEdBQUcsSUFBQSw4Q0FBd0IsRUFBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7d0JBQ3BFLFdBQVcsRUFBRSxDQUFDO3dCQUNkLGVBQWUsRUFBRSxDQUFDO3dCQUNsQixTQUFTLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNO3dCQUMxQixhQUFhLEVBQUUsQ0FBQztxQkFDaEIsRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFFZCxNQUFNLFVBQVUsR0FBd0I7d0JBQ3ZDLElBQUksRUFBRSxJQUFJO3dCQUNWLEdBQUcsRUFBRSxRQUFRLENBQUMsR0FBRzt3QkFDakIsU0FBUyxFQUFFOzRCQUNWLGVBQWUsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDOzRCQUMvQixXQUFXLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7eUJBQ3BDO3dCQUNELGdCQUFnQixFQUFFLElBQUk7d0JBQ3RCLFdBQVcsRUFBRSxXQUFXO3dCQUN4QixJQUFJO3FCQUNKLENBQUM7b0JBQ0YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsb0RBQW9ELEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQ3pGLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBRXZCLDJCQUEyQjtvQkFDM0IsTUFBTTtnQkFDUCxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsS0FBSyxNQUFNLE9BQU8sSUFBSSxlQUFlLEVBQUUsQ0FBQztvQkFDdkMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDbEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxFQUFFLE1BQU0sQ0FBQztvQkFDNUIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNaLFNBQVM7b0JBQ1YsQ0FBQztvQkFDRCxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsSUFBSSxDQUFDO29CQUN6QixNQUFNLFVBQVUsR0FBRyxLQUFLLEVBQUUsVUFBVSxDQUFDO29CQUNyQyxNQUFNLFdBQVcsR0FBRyxLQUFLLEVBQUUsV0FBVyxDQUFDO29CQUN2QyxJQUFJLENBQUMsSUFBSSxJQUFJLFVBQVUsS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDdkMsU0FBUztvQkFDVixDQUFDO29CQUVELGtEQUFrRDtvQkFDbEQsSUFBSSxJQUFJLENBQUMsTUFBTSw2Q0FBa0MsRUFBRSxDQUFDO3dCQUNuRCxTQUFTO29CQUNWLENBQUM7b0JBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsZ0RBQWdELEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBRy9FLDBEQUEwRDtvQkFDMUQsSUFBSSxZQUFnQyxDQUFDO29CQUNyQyxLQUFLLElBQUksS0FBSyxHQUFHLFNBQVMsR0FBRyxDQUFDLEVBQUUsS0FBSyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO3dCQUNyRCw4REFBOEQ7d0JBQzlELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQzs0QkFDeEQsU0FBUzt3QkFDVixDQUFDO3dCQUNELE1BQU0sSUFBSSxHQUFHLElBQUEseUNBQW1CLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDMUYsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO3dCQUNsRCxJQUFJLEtBQUssRUFBRSxDQUFDOzRCQUNYLFlBQVksR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQzs0QkFDbEMsTUFBTTt3QkFDUCxDQUFDO29CQUNGLENBQUM7b0JBQ0QsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUNuQixTQUFTO29CQUNWLENBQUM7b0JBRUQsdUVBQXVFO29CQUN2RSxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7b0JBQzFGLElBQUksUUFBUSxFQUFFLENBQUM7d0JBQ2QsSUFBSSxJQUE2QixDQUFDO3dCQUNsQyxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQzs0QkFDMUIsSUFBSSxJQUFJLENBQUMsMkJBQTJCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0NBQ3BELElBQUksZ0ZBQWlELENBQUM7NEJBQ3ZELENBQUM7aUNBQU0sQ0FBQztnQ0FDUCxJQUFJLDBGQUFzRCxDQUFDOzRCQUM1RCxDQUFDO3dCQUNGLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxJQUFJLHNEQUFvQyxDQUFDO3dCQUMxQyxDQUFDO3dCQUVELHVDQUF1Qzt3QkFDdkMsTUFBTSxXQUFXLEdBQUcsSUFBQSw4Q0FBd0IsRUFBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUU7NEJBQ3BFLFdBQVcsRUFBRSxDQUFDOzRCQUNkLGVBQWUsRUFBRSxDQUFDOzRCQUNsQixTQUFTLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNOzRCQUMxQixhQUFhLEVBQUUsQ0FBQzt5QkFDaEIsRUFBRSxTQUFTLENBQUMsQ0FBQzt3QkFFZCxNQUFNLFVBQVUsR0FBd0I7NEJBQ3ZDLElBQUksRUFBRSxJQUFJOzRCQUNWLEdBQUcsRUFBRSxRQUFRLENBQUMsR0FBRzs0QkFDakIsU0FBUyxFQUFFO2dDQUNWLGVBQWUsRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDO2dDQUNyQyxXQUFXLEVBQUUsQ0FBQztnQ0FDZCxhQUFhLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUM7NkJBQzNEOzRCQUNELFdBQVcsRUFBRSxXQUFXOzRCQUN4QixJQUFJO3lCQUNKLENBQUM7d0JBQ0YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsb0RBQW9ELEVBQUUsVUFBVSxDQUFDLENBQUM7d0JBQ3pGLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBRXZCLDJCQUEyQjt3QkFDM0IsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU8sMkJBQTJCLENBQUMsR0FBUTtZQUMzQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDO1lBQ3JFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUMxRSxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQzs7SUEzTVcsc0VBQTZCOzRDQUE3Qiw2QkFBNkI7UUFhdkMsV0FBQSw4QkFBbUIsQ0FBQTtRQUNuQixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsb0NBQXdCLENBQUE7T0FmZCw2QkFBNkIsQ0E0TXpDIn0=