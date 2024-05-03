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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/timeline/common/timeline", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/base/common/uri", "vs/workbench/services/path/common/pathService", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/files/common/files", "vs/workbench/contrib/localHistory/browser/localHistoryFileSystemProvider", "vs/workbench/services/environment/common/environmentService", "vs/workbench/common/editor", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/localHistory/browser/localHistoryCommands", "vs/base/common/htmlContent", "vs/workbench/contrib/localHistory/browser/localHistory", "vs/base/common/network", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/virtualWorkspace"], function (require, exports, nls_1, event_1, lifecycle_1, timeline_1, workingCopyHistory_1, uri_1, pathService_1, editorCommands_1, files_1, localHistoryFileSystemProvider_1, environmentService_1, editor_1, configuration_1, localHistoryCommands_1, htmlContent_1, localHistory_1, network_1, workspace_1, virtualWorkspace_1) {
    "use strict";
    var LocalHistoryTimeline_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalHistoryTimeline = void 0;
    let LocalHistoryTimeline = class LocalHistoryTimeline extends lifecycle_1.Disposable {
        static { LocalHistoryTimeline_1 = this; }
        static { this.ID = 'workbench.contrib.localHistoryTimeline'; }
        static { this.LOCAL_HISTORY_ENABLED_SETTINGS_KEY = 'workbench.localHistory.enabled'; }
        constructor(timelineService, workingCopyHistoryService, pathService, fileService, environmentService, configurationService, contextService) {
            super();
            this.timelineService = timelineService;
            this.workingCopyHistoryService = workingCopyHistoryService;
            this.pathService = pathService;
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.id = 'timeline.localHistory';
            this.label = (0, nls_1.localize)('localHistory', "Local History");
            this.scheme = '*'; // we try to show local history for all schemes if possible
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.timelineProviderDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.registerComponents();
            this.registerListeners();
        }
        registerComponents() {
            // Timeline (if enabled)
            this.updateTimelineRegistration();
            // File Service Provider
            this._register(this.fileService.registerProvider(localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.SCHEMA, new localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider(this.fileService)));
        }
        updateTimelineRegistration() {
            if (this.configurationService.getValue(LocalHistoryTimeline_1.LOCAL_HISTORY_ENABLED_SETTINGS_KEY)) {
                this.timelineProviderDisposable.value = this.timelineService.registerTimelineProvider(this);
            }
            else {
                this.timelineProviderDisposable.clear();
            }
        }
        registerListeners() {
            // History changes
            this._register(this.workingCopyHistoryService.onDidAddEntry(e => this.onDidChangeWorkingCopyHistoryEntry(e.entry)));
            this._register(this.workingCopyHistoryService.onDidChangeEntry(e => this.onDidChangeWorkingCopyHistoryEntry(e.entry)));
            this._register(this.workingCopyHistoryService.onDidReplaceEntry(e => this.onDidChangeWorkingCopyHistoryEntry(e.entry)));
            this._register(this.workingCopyHistoryService.onDidRemoveEntry(e => this.onDidChangeWorkingCopyHistoryEntry(e.entry)));
            this._register(this.workingCopyHistoryService.onDidRemoveEntries(() => this.onDidChangeWorkingCopyHistoryEntry(undefined /* all entries */)));
            this._register(this.workingCopyHistoryService.onDidMoveEntries(() => this.onDidChangeWorkingCopyHistoryEntry(undefined /* all entries */)));
            // Configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(LocalHistoryTimeline_1.LOCAL_HISTORY_ENABLED_SETTINGS_KEY)) {
                    this.updateTimelineRegistration();
                }
            }));
        }
        onDidChangeWorkingCopyHistoryEntry(entry) {
            // Re-emit as timeline change event
            this._onDidChange.fire({
                id: this.id,
                uri: entry?.workingCopy.resource,
                reset: true // there is no other way to indicate that items might have been replaced/removed
            });
        }
        async provideTimeline(uri, options, token) {
            const items = [];
            // Try to convert the provided `uri` into a form that is likely
            // for the provider to find entries for so that we can ensure
            // the timeline is always providing local history entries
            let resource = undefined;
            if (uri.scheme === localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.SCHEMA) {
                // `vscode-local-history`: convert back to the associated resource
                resource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.fromLocalHistoryFileSystem(uri).associatedResource;
            }
            else if (uri.scheme === this.pathService.defaultUriScheme || uri.scheme === network_1.Schemas.vscodeUserData) {
                // default-scheme / settings: keep as is
                resource = uri;
            }
            else if (this.fileService.hasProvider(uri)) {
                // anything that is backed by a file system provider:
                // try best to convert the URI back into a form that is
                // likely to match the workspace URIs. That means:
                // - change to the default URI scheme
                // - change to the remote authority or virtual workspace authority
                // - preserve the path
                resource = uri_1.URI.from({
                    scheme: this.pathService.defaultUriScheme,
                    authority: this.environmentService.remoteAuthority ?? (0, virtualWorkspace_1.getVirtualWorkspaceAuthority)(this.contextService.getWorkspace()),
                    path: uri.path
                });
            }
            if (resource) {
                // Retrieve from working copy history
                const entries = await this.workingCopyHistoryService.getEntries(resource, token);
                // Convert to timeline items
                for (const entry of entries) {
                    items.push(this.toTimelineItem(entry));
                }
            }
            return {
                source: this.id,
                items
            };
        }
        toTimelineItem(entry) {
            return {
                handle: entry.id,
                label: editor_1.SaveSourceRegistry.getSourceLabel(entry.source),
                tooltip: new htmlContent_1.MarkdownString(`$(history) ${(0, localHistory_1.getLocalHistoryDateFormatter)().format(entry.timestamp)}\n\n${editor_1.SaveSourceRegistry.getSourceLabel(entry.source)}`, { supportThemeIcons: true }),
                source: this.id,
                timestamp: entry.timestamp,
                themeIcon: localHistory_1.LOCAL_HISTORY_ICON_ENTRY,
                contextValue: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_VALUE,
                command: {
                    id: editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID,
                    title: localHistoryCommands_1.COMPARE_WITH_FILE_LABEL.value,
                    arguments: (0, localHistoryCommands_1.toDiffEditorArguments)(entry, entry.workingCopy.resource)
                }
            };
        }
    };
    exports.LocalHistoryTimeline = LocalHistoryTimeline;
    exports.LocalHistoryTimeline = LocalHistoryTimeline = LocalHistoryTimeline_1 = __decorate([
        __param(0, timeline_1.ITimelineService),
        __param(1, workingCopyHistory_1.IWorkingCopyHistoryService),
        __param(2, pathService_1.IPathService),
        __param(3, files_1.IFileService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, workspace_1.IWorkspaceContextService)
    ], LocalHistoryTimeline);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxIaXN0b3J5VGltZWxpbmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xvY2FsSGlzdG9yeS9icm93c2VyL2xvY2FsSGlzdG9yeVRpbWVsaW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF3QnpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7O2lCQUVuQyxPQUFFLEdBQUcsd0NBQXdDLEFBQTNDLENBQTRDO2lCQUV0Qyx1Q0FBa0MsR0FBRyxnQ0FBZ0MsQUFBbkMsQ0FBb0M7UUFhOUYsWUFDbUIsZUFBa0QsRUFDeEMseUJBQXNFLEVBQ3BGLFdBQTBDLEVBQzFDLFdBQTBDLEVBQzFCLGtCQUFpRSxFQUN4RSxvQkFBNEQsRUFDekQsY0FBeUQ7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFSMkIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3ZCLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBNEI7WUFDbkUsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDekIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDVCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQThCO1lBQ3ZELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDeEMsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBbEIzRSxPQUFFLEdBQUcsdUJBQXVCLENBQUM7WUFFN0IsVUFBSyxHQUFHLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUVsRCxXQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsMkRBQTJEO1lBRWpFLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBdUIsQ0FBQyxDQUFDO1lBQzFFLGdCQUFXLEdBQUcsSUFBSSxD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