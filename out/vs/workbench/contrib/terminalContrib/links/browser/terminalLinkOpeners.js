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
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/host/browser/host", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/services/search/common/search", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkParsing", "vs/platform/terminal/common/terminal"], function (require, exports, network_1, uri_1, commands_1, files_1, instantiation_1, opener_1, quickInput_1, workspace_1, terminalLinkHelpers_1, editorService_1, environmentService_1, host_1, queryBuilder_1, search_1, configuration_1, terminalLinkParsing_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalUrlLinkOpener = exports.TerminalSearchLinkOpener = exports.TerminalLocalFolderOutsideWorkspaceLinkOpener = exports.TerminalLocalFolderInWorkspaceLinkOpener = exports.TerminalLocalFileLinkOpener = void 0;
    let TerminalLocalFileLinkOpener = class TerminalLocalFileLinkOpener {
        constructor(_editorService) {
            this._editorService = _editorService;
        }
        async open(link) {
            if (!link.uri) {
                throw new Error('Tried to open file link without a resolved URI');
            }
            const linkSuffix = link.parsedLink ? link.parsedLink.suffix : (0, terminalLinkParsing_1.getLinkSuffix)(link.text);
            let selection = link.selection;
            if (!selection) {
                selection = linkSuffix?.row === undefined ? undefined : {
                    startLineNumber: linkSuffix.row ?? 1,
                    startColumn: linkSuffix.col ?? 1,
                    endLineNumber: linkSuffix.rowEnd,
                    endColumn: linkSuffix.colEnd
                };
            }
            await this._editorService.openEditor({
                resource: link.uri,
                options: { pinned: true, selection, revealIfOpened: true }
            });
        }
    };
    exports.TerminalLocalFileLinkOpener = TerminalLocalFileLinkOpener;
    exports.TerminalLocalFileLinkOpener = TerminalLocalFileLinkOpener = __decorate([
        __param(0, editorService_1.IEditorService)
    ], TerminalLocalFileLinkOpener);
    let TerminalLocalFolderInWorkspaceLinkOpener = class TerminalLocalFolderInWorkspaceLinkOpener {
        constructor(_commandService) {
            this._commandService = _commandService;
        }
        async open(link) {
            if (!link.uri) {
                throw new Error('Tried to open folder in workspace link without a resolved URI');
            }
            await this._commandService.executeCommand('revealInExplorer', link.uri);
        }
    };
    exports.TerminalLocalFolderInWorkspaceLinkOpener = TerminalLocalFolderInWorkspaceLinkOpener;
    exports.TerminalLocalFolderInWorkspaceLinkOpener = TerminalLocalFolderInWorkspaceLinkOpener = __decorate([
        __param(0, commands_1.ICommandService)
    ], TerminalLocalFolderInWorkspaceLinkOpener);
    let TerminalLocalFolderOutsideWorkspaceLinkOpener = class TerminalLocalFolderOutsideWorkspaceLinkOpener {
        constructor(_hostService) {
            this._hostService = _hostService;
        }
        async open(link) {
            if (!link.uri) {
                throw new Error('Tried to open folder in workspace link without a resolved URI');
            }
            this._hostService.openWindow([{ folderUri: link.uri }], { forceNewWindow: true });
        }
    };
    exports.TerminalLocalFolderOutsideWorkspaceLinkOpener = TerminalLocalFolderOutsideWorkspaceLinkOpener;
    exports.TerminalLocalFolderOutsideWorkspaceLinkOpener = TerminalLocalFolderOutsideWorkspaceLinkOpener = __decorate([
        __param(0, host_1.IHostService)
    ], TerminalLocalFolderOutsideWorkspaceLinkOpener);
    let TerminalSearchLinkOpener = class TerminalSearchLinkOpener {
        constructor(_capabilities, _initialCwd, _localFileOpener, _localFolderInWorkspaceOpener, _getOS, _fileService, _instantiationService, _logService, _quickInputService, _searchService, _workspaceContextService, _workbenchEnvironmentService) {
            this._capabilities = _capabilities;
            this._initialCwd = _initialCwd;
            this._localFileOpener = _localFileOpener;
            this._localFolderInWorkspaceOpener = _localFolderInWorkspaceOpener;
            this._getOS = _getOS;
            this._fileService = _fileService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._quickInputService = _quickInputService;
            this._searchService = _searchService;
            this._workspaceContextService = _workspaceContextService;
            this._workbenchEnvironmentService = _workbenchEnvironmentService;
            this._fileQueryBuilder = this._instantiationService.createInstance(queryBuilder_1.QueryBuilder);
        }
        async open(link) {
            const osPath = (0, terminalLinkHelpers_1.osPathModule)(this._getOS());
            const pathSeparator = osPath.sep;
            // Remove file:/// and any leading ./ or ../ since quick access doesn't understand that format
            let text = link.text.replace(/^file:\/\/\/?/, '');
            text = osPath.normalize(text).replace(/^(\.+[\\/])+/, '');
            // Try extract any trailing line and column numbers by matching the text against parsed
            // links. This will give a search link `foo` on a line like `"foo", line 10` to open the
            // quick pick with `foo:10` as the contents.
            if (link.contextLine) {
                const parsedLinks = (0, terminalLinkParsing_1.detectLinks)(link.contextLine, this._getOS());
                const matchingParsedLink = parsedLinks.find(parsedLink => parsedLink.suffix && link.text === parsedLink.path.text);
                if (matchingParsedLink) {
                    if (matchingParsedLink.suffix?.row !== undefined) {
                        text += `:${matchingParsedLink.suffix.row}`;
                        if (matchingParsedLink.suffix?.col !== undefined) {
                            text += `:${matchingParsedLink.suffix.col}`;
                        }
                    }
                }
            }
            // Remove `:<one or more non number characters>` from the end of the link.
            // Examples:
            // - Ruby stack traces: <link>:in ...
            // - Grep output: <link>:<result line>
            // This only happens when the colon is _not_ followed by a forward- or back-slash as that
            // would break absolute Windows paths (eg. `C:/Users/...`).
            text = text.replace(/:[^\\/\d][^\d]*$/, '');
            // Remove any trailing periods after the line/column numbers, to prevent breaking the search feature, #200257
            // Examples:
            // "Check your code Test.tsx:12:45." -> Test.tsx:12:45
            // "Check your code Test.tsx:12." -> Test.tsx:12
            text = text.replace(/\.$/, '');
            // If any of the names of the folders in the workspace matches
            // a prefix of the link, remove that prefix and continue
            this._workspaceContextService.getWorkspace().folders.forEach((folder) => {
                if (text.substring(0, folder.name.length + 1) === folder.name + pathSeparator) {
                    text = text.substring(folder.name.length + 1);
                    return;
                }
            });
            let cwdResolvedText = text;
            if (this._capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                cwdResolvedText = (0, terminalLinkHelpers_1.updateLinkWithRelativeCwd)(this._capabilities, link.bufferRange.start.y, text, osPath, this._logService)?.[0] || text;
            }
            // Try open the cwd resolved link first
            if (await this._tryOpenExactLink(cwdResolvedText, link)) {
                return;
            }
            // If the cwd resolved text didn't match, try find the link without the cwd resolved, for
            // example when a command prints paths in a sub-directory of the current cwd
            if (text !== cwdResolvedText) {
                if (await this._tryOpenExactLink(text, link)) {
                    return;
                }
            }
            // Fallback to searching quick access
            return this._quickInputService.quickAccess.show(text);
        }
        async _getExactMatch(sanitizedLink) {
            // Make the link relative to the cwd if it isn't absolute
            const os = this._getOS();
            const pathModule = (0, terminalLinkHelpers_1.osPathModule)(os);
            const isAbsolute = pathModule.isAbsolute(sanitizedLink);
            let absolutePath = isAbsolute ? sanitizedLink : undefined;
            if (!isAbsolute && this._initialCwd.length > 0) {
                absolutePath = pathModule.join(this._initialCwd, sanitizedLink);
            }
            // Try open as an absolute link
            let resourceMatch;
            if (absolutePath) {
                let normalizedAbsolutePath = absolutePath;
                if (os === 1 /* OperatingSystem.Windows */) {
                    normalizedAbsolutePath = absolutePath.replace(/\\/g, '/');
                    if (normalizedAbsolutePath.match(/[a-z]:/i)) {
                        normalizedAbsolutePath = `/${normalizedAbsolutePath}`;
                    }
                }
                let uri;
                if (this._workbenchEnvironmentService.remoteAuthority) {
                    uri = uri_1.URI.from({
                        scheme: network_1.Schemas.vscodeRemote,
                        authority: this._workbenchEnvironmentService.remoteAuthority,
                        path: normalizedAbsolutePath
                    });
                }
                else {
                    uri = uri_1.URI.file(normalizedAbsolutePath);
                }
                try {
                    const fileStat = await this._fileService.stat(uri);
                    resourceMatch = { uri, isDirectory: fileStat.isDirectory };
                }
                catch {
                    // File or dir doesn't exist, continue on
                }
            }
            // Search the workspace if an exact match based on the absolute path was not found
            if (!resourceMatch) {
                const results = await this._searchService.fileSearch(this._fileQueryBuilder.file(this._workspaceContextService.getWorkspace().folders, {
                    filePattern: sanitizedLink,
                    maxResults: 2
                }));
                if (results.results.length > 0) {
                    if (results.results.length === 1) {
                        // If there's exactly 1 search result, return it regardless of whether it's
                        // exact or partial.
                        resourceMatch = { uri: results.results[0].resource };
                    }
                    else if (!isAbsolute) {
                        // For non-absolute links, exact link matching is allowed only if there is a single an exact
                        // file match. For example searching for `foo.txt` when there is no cwd information
                        // available (ie. only the initial cwd) should open the file directly only if there is a
                        // single file names `foo.txt` anywhere within the folder. These same rules apply to
                        // relative paths with folders such as `src/foo.txt`.
                        const results = await this._searchService.fileSearch(this._fileQueryBuilder.file(this._workspaceContextService.getWorkspace().folders, {
                            filePattern: `**/${sanitizedLink}`
                        }));
                        // Find an exact match if it exists
                        const exactMatches = results.results.filter(e => e.resource.toString().endsWith(sanitizedLink));
                        if (exactMatches.length === 1) {
                            resourceMatch = { uri: exactMatches[0].resource };
                        }
                    }
                }
            }
            return resourceMatch;
        }
        async _tryOpenExactLink(text, link) {
            const sanitizedLink = text.replace(/:\d+(:\d+)?$/, '');
            try {
                const result = await this._getExactMatch(sanitizedLink);
                if (result) {
                    const { uri, isDirectory } = result;
                    const linkToOpen = {
                        // Use the absolute URI's path here so the optional line/col get detected
                        text: result.uri.path + (text.match(/:\d+(:\d+)?$/)?.[0] || ''),
                        uri,
                        bufferRange: link.bufferRange,
                        type: link.type
                    };
                    if (uri) {
                        await (isDirectory ? this._localFolderInWorkspaceOpener.open(linkToOpen) : this._localFileOpener.open(linkToOpen));
                        return true;
                    }
                }
            }
            catch {
                return false;
            }
            return false;
        }
    };
    exports.TerminalSearchLinkOpener = TerminalSearchLinkOpener;
    exports.TerminalSearchLinkOpener = TerminalSearchLinkOpener = __decorate([
        __param(5, files_1.IFileService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, terminal_1.ITerminalLogService),
        __param(8, quickInput_1.IQuickInputService),
        __param(9, search_1.ISearchService),
        __param(10, workspace_1.IWorkspaceContextService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService)
    ], TerminalSearchLinkOpener);
    let TerminalUrlLinkOpener = class TerminalUrlLinkOpener {
        constructor(_isRemote, _openerService, _configurationService) {
            this._isRemote = _isRemote;
            this._openerService = _openerService;
            this._configurationService = _configurationService;
        }
        async open(link) {
            if (!link.uri) {
                throw new Error('Tried to open a url without a resolved URI');
            }
            // It's important to use the raw string value here to avoid converting pre-encoded values
            // from the URL like `%2B` -> `+`.
            this._openerService.open(link.text, {
                allowTunneling: this._isRemote && this._configurationService.getValue('remote.forwardOnOpen'),
                allowContributedOpeners: true,
                openExternal: true
            });
        }
    };
    exports.TerminalUrlLinkOpener = TerminalUrlLinkOpener;
    exports.TerminalUrlLinkOpener = TerminalUrlLinkOpener = __decorate([
        __param(1, opener_1.IOpenerService),
        __param(2, configuration_1.IConfigurationService)
    ], TerminalUrlLinkOpener);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rT3BlbmVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL2Jyb3dzZXIvdGVybWluYWxMaW5rT3BlbmVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QnpGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTJCO1FBQ3ZDLFlBQ2tDLGNBQThCO1lBQTlCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtRQUVoRSxDQUFDO1FBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUF5QjtZQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztZQUNuRSxDQUFDO1lBQ0QsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUEsbUNBQWEsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkYsSUFBSSxTQUFTLEdBQXFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDakUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixTQUFTLEdBQUcsVUFBVSxFQUFFLEdBQUcsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZELGVBQWUsRUFBRSxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUM7b0JBQ3BDLFdBQVcsRUFBRSxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUM7b0JBQ2hDLGFBQWEsRUFBRSxVQUFVLENBQUMsTUFBTTtvQkFDaEMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxN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