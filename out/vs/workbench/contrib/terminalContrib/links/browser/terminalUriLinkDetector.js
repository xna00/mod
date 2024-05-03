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
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/editor/common/languages/linkComputer", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/platform/terminal/common/terminal"], function (require, exports, network_1, uri_1, linkComputer_1, uriIdentity_1, workspace_1, terminalLinkHelpers_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalUriLinkDetector = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The maximum number of links in a line to resolve against the file system. This limit is put
         * in place to avoid sending excessive data when remote connections are in place.
         */
        Constants[Constants["MaxResolvedLinksInLine"] = 10] = "MaxResolvedLinksInLine";
    })(Constants || (Constants = {}));
    let TerminalUriLinkDetector = class TerminalUriLinkDetector {
        static { this.id = 'uri'; }
        constructor(xterm, _processManager, _linkResolver, _logService, _uriIdentityService, _workspaceContextService) {
            this.xterm = xterm;
            this._processManager = _processManager;
            this._linkResolver = _linkResolver;
            this._logService = _logService;
            this._uriIdentityService = _uriIdentityService;
            this._workspaceContextService = _workspaceContextService;
            // 2048 is the maximum URL length
            this.maxLinkLength = 2048;
        }
        async detect(lines, startLine, endLine) {
            const links = [];
            const linkComputerTarget = new TerminalLinkAdapter(this.xterm, startLine, endLine);
            const computedLinks = linkComputer_1.LinkComputer.computeLinks(linkComputerTarget);
            let resolvedLinkCount = 0;
            this._logService.trace('terminalUriLinkDetector#detect computedLinks', computedLinks);
            for (const computedLink of computedLinks) {
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, computedLink.range, startLine);
                // Check if the link is within the mouse position
                const uri = computedLink.url
                    ? (typeof computedLink.url === 'string' ? uri_1.URI.parse(this._excludeLineAndColSuffix(computedLink.url)) : computedLink.url)
                    : undefined;
                if (!uri) {
                    continue;
                }
                const text = computedLink.url?.toString() || '';
                // Don't try resolve any links of excessive length
                if (text.length > this.maxLinkLength) {
                    continue;
                }
                // Handle non-file scheme links
                if (uri.scheme !== network_1.Schemas.file) {
                    links.push({
                        text,
                        uri,
                        bufferRange,
                        type: "Url" /* TerminalBuiltinLinkType.Url */
                    });
                    continue;
                }
                // Filter out URI with unrecognized authorities
                if (uri.authority.length !== 2 && uri.authority.endsWith(':')) {
                    continue;
                }
                // As a fallback URI, treat the authority as local to the workspace. This is required
                // for `ls --hyperlink` support for example which includes the hostname in the URI like
                // `file://Some-Hostname/mnt/c/foo/bar`.
                const uriCandidates = [uri];
                if (uri.authority.length > 0) {
                    uriCandidates.push(uri_1.URI.from({ ...uri, authority: undefined }));
                }
                // Iterate over all candidates, pushing the candidate on the first that's verified
                this._logService.trace('terminalUriLinkDetector#detect uriCandidates', uriCandidates);
                for (const uriCandidate of uriCandidates) {
                    const linkStat = await this._linkResolver.resolveLink(this._processManager, text, uriCandidate);
                    // Create the link if validated
                    if (linkStat) {
                        let type;
                        if (linkStat.isDirectory) {
                            if (this._isDirectoryInsideWorkspace(uriCandidate)) {
                                type = "LocalFolderInWorkspace" /* TerminalBuiltinLinkType.LocalFolderInWorkspace */;
                            }
                            else {
                                type = "LocalFolderOutsideWorkspace" /* TerminalBuiltinLinkType.LocalFolderOutsideWorkspace */;
                            }
                        }
                        else {
                            type = "LocalFile" /* TerminalBuiltinLinkType.LocalFile */;
                        }
                        const simpleLink = {
                            // Use computedLink.url if it's a string to retain the line/col suffix
                            text: typeof computedLink.url === 'string' ? computedLink.url : linkStat.link,
                            uri: uriCandidate,
                            bufferRange,
                            type
                        };
                        this._logService.trace('terminalUriLinkDetector#detect verified link', simpleLink);
                        links.push(simpleLink);
                        resolvedLinkCount++;
                        break;
                    }
                }
                // Stop early if too many links exist in the line
                if (++resolvedLinkCount >= 10 /* Constants.MaxResolvedLinksInLine */) {
                    break;
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
        _excludeLineAndColSuffix(path) {
            return path.replace(/:\d+(:\d+)?$/, '');
        }
    };
    exports.TerminalUriLinkDetector = TerminalUriLinkDetector;
    exports.TerminalUriLinkDetector = TerminalUriLinkDetector = __decorate([
        __param(3, terminal_1.ITerminalLogService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, workspace_1.IWorkspaceContextService)
    ], TerminalUriLinkDetector);
    class TerminalLinkAdapter {
        constructor(_xterm, _lineStart, _lineEnd) {
            this._xterm = _xterm;
            this._lineStart = _lineStart;
            this._lineEnd = _lineEnd;
        }
        getLineCount() {
            return 1;
        }
        getLineContent() {
            return (0, terminalLinkHelpers_1.getXtermLineContent)(this._xterm.buffer.active, this._lineStart, this._lineEnd, this._xterm.cols);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxVcmlMaW5rRGV0ZWN0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9saW5rcy9icm93c2VyL3Rlcm1pbmFsVXJpTGlua0RldGVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWFoRyxJQUFXLFNBTVY7SUFORCxXQUFXLFNBQVM7UUFDbkI7OztXQUdHO1FBQ0gsOEVBQTJCLENBQUE7SUFDNUIsQ0FBQyxFQU5VLFNBQVMsS0FBVCxTQUFTLFFBTW5CO0lBRU0sSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBdUI7aUJBQzVCLE9BQUUsR0FBRyxLQUFLLEFBQVIsQ0FBUztRQUtsQixZQUNVLEtBQWUsRUFDUCxlQUF5SixFQUN6SixhQUFvQyxFQUNoQyxXQUFpRCxFQUNqRCxtQkFBeUQsRUFDcEQsd0JBQW1FO1lBTHBGLFVBQUssR0FBTCxLQUFLLENBQVU7WUFDUCxvQkFBZSxHQUFmLGVBQWUsQ0FBMEk7WUFDekosa0JBQWEsR0FBYixhQUFhLENBQXVCO1lBQ2YsZ0JBQVcsR0FBWCxXQUFXLENBQXFCO1lBQ2hDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDbkMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQVQ5RixpQ0FBaUM7WUFDeEIsa0JBQWEsR0FBRyxJQUFJLENBQUM7UUFVOUIsQ0FBQztRQUVELEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBb0IsRUFBRSxTQUFpQixFQUFFLE9BQWU7WUFDcEUsTUFBTSxLQUFLLEdBQTBCLEVBQUUsQ0FBQztZQUV4QyxNQUFNLGtCQUFrQixHQUFHLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbkYsTUFBTSxhQUFhLEdBQUcsMkJBQVksQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUVwRSxJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUN0RixLQUFLLE1BQU0sWUFBWSxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUMxQyxNQUFNLFdBQVcsR0FBRyxJQUFBLDhDQUF3QixFQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUVwRyxpREFBaUQ7Z0JBQ2pELE1BQU0sR0FBRyxHQUFHLFlBQVksQ0FBQyxHQUFHO29CQUMzQixDQUFDLENBQUMsQ0FBQyxPQUFPLFlBQVksQ0FBQyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQztvQkFDeEgsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFFYixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ1YsU0FBUztnQkFDVixDQUFDO2dCQUVELE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUVoRCxrREFBa0Q7Z0JBQ2xELElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3RDLFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCwrQkFBK0I7Z0JBQy9CLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNqQyxLQUFLLENBQUMsSUFBSSxDQUFDO3dCQUNWLElBQUk7d0JBQ0osR0FBRzt3QkFDSCxXQUFXO3dCQUNYLElBQUkseUNBQTZCO3FCQUNqQyxDQUFDLENBQUM7b0JBQ0gsU0FBUztnQkFDVixDQUFDO2dCQUVELCtDQUErQztnQkFDL0MsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDL0QsU0FBUztnQkFDVixDQUFDO2dCQUVELHFGQUFxRjtnQkFDckYsdUZBQXVGO2dCQUN2Rix3Q0FBd0M7Z0JBQ3hDLE1BQU0sYUFBYSxHQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ25DLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzlCLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hFLENBQUM7Z0JBRUQsa0ZBQWtGO2dCQUNsRixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDdEYsS0FBSyxNQUFNLFlBQVksSUFBSSxhQUFhLEVBQUUsQ0FBQztvQkFDMUMsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztvQkFFaEcsK0JBQStCO29CQUMvQixJQUFJLFFBQVEsRUFBRSxDQUFDO3dCQUNkLElBQUksSUFBNkIsQ0FBQzt3QkFDbEMsSUFBSSxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7NEJBQzFCLElBQUksSUFBSSxDQUFDLDJCQUEyQixDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7Z0NBQ3BELElBQUksZ0ZBQWlELENBQUM7NEJBQ3ZELENBQUM7aUNBQU0sQ0FBQztnQ0FDUCxJQUFJLDBGQUFzRCxDQUFDOzRCQUM1RCxDQUFDO3dCQUNGLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxJQUFJLHNEQUFvQyxDQUFDO3dCQUMxQyxDQUFDO3dCQUNELE1BQU0sVUFBVSxHQUF3Qjs0QkFDdkMsc0VBQXNFOzRCQUN0RSxJQUFJLEVBQUUsT0FBTyxZQUFZLENBQUMsR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUk7NEJBQzdFLEdBQUcsRUFBRSxZQUFZOzRCQUNqQixXQUFXOzRCQUNYLElBQUk7eUJBQ0osQ0FBQzt3QkFDRixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsRUFBRSxVQUFVLENBQUMsQ0FBQzt3QkFDbkYsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDdkIsaUJBQWlCLEVBQUUsQ0FBQzt3QkFDcEIsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsaURBQWlEO2dCQUNqRCxJQUFJLEVBQUUsaUJBQWlCLDZDQUFvQyxFQUFFLENBQUM7b0JBQzdELE1BQU07Z0JBQ1AsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTywyQkFBMkIsQ0FBQyxHQUFRO1lBQzNDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUM7WUFDckUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzFFLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU8sd0JBQXdCLENBQUMsSUFBWTtZQUM1QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7O0lBdkhXLDBEQUF1QjtzQ0FBdkIsdUJBQXVCO1FBVWpDLFdBQUEsOEJBQW1CLENBQUE7UUFDbkIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLG9DQUF3QixDQUFBO09BWmQsdUJBQXVCLENBd0huQztJQUVELE1BQU0sbUJBQW1CO1FBQ3hCLFlBQ1MsTUFBZ0IsRUFDaEIsVUFBa0IsRUFDbEIsUUFBZ0I7WUFGaEIsV0FBTSxHQUFOLE1BQU0sQ0FBVTtZQUNoQixlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ2xCLGFBQVEsR0FBUixRQUFRLENBQVE7UUFDckIsQ0FBQztRQUVMLFlBQVk7WUFDWCxPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7UUFFRCxjQUFjO1lBQ2IsT0FBTyxJQUFBLHlDQUFtQixFQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6RyxDQUFDO0tBQ0QifQ==