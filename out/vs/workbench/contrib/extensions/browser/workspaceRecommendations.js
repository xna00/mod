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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/arrays", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/notification/common/notification", "vs/nls", "vs/base/common/event", "vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig", "vs/platform/workspace/common/workspace", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/files/common/files", "vs/base/common/async", "vs/workbench/services/extensionManagement/common/extensionManagement"], function (require, exports, extensionManagement_1, arrays_1, extensionRecommendations_1, notification_1, nls_1, event_1, workspaceExtensionsConfig_1, workspace_1, uriIdentity_1, files_1, async_1, extensionManagement_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceRecommendations = void 0;
    const WORKSPACE_EXTENSIONS_FOLDER = '.vscode/extensions';
    let WorkspaceRecommendations = class WorkspaceRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        get recommendations() { return this._recommendations; }
        get ignoredRecommendations() { return this._ignoredRecommendations; }
        constructor(workspaceExtensionsConfigService, contextService, uriIdentityService, fileService, workbenchExtensionManagementService, notificationService) {
            super();
            this.workspaceExtensionsConfigService = workspaceExtensionsConfigService;
            this.contextService = contextService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.workbenchExtensionManagementService = workbenchExtensionManagementService;
            this.notificationService = notificationService;
            this._recommendations = [];
            this._onDidChangeRecommendations = this._register(new event_1.Emitter());
            this.onDidChangeRecommendations = this._onDidChangeRecommendations.event;
            this._ignoredRecommendations = [];
            this.workspaceExtensions = [];
            this.onDidChangeWorkspaceExtensionsScheduler = this._register(new async_1.RunOnceScheduler(() => this.onDidChangeWorkspaceExtensionsFolders(), 1000));
        }
        async doActivate() {
            this.workspaceExtensions = await this.fetchWorkspaceExtensions();
            await this.fetch();
            this._register(this.workspaceExtensionsConfigService.onDidChangeExtensionsConfigs(() => this.onDidChangeExtensionsConfigs()));
            for (const folder of this.contextService.getWorkspace().folders) {
                this._register(this.fileService.watch(this.uriIdentityService.extUri.joinPath(folder.uri, WORKSPACE_EXTENSIONS_FOLDER)));
            }
            if (this.workbenchExtensionManagementService.isWorkspaceExtensionsSupported()) {
                this._register(this.fileService.onDidFilesChange(e => {
                    if (this.contextService.getWorkspace().folders.some(folder => e.affects(this.uriIdentityService.extUri.joinPath(folder.uri, WORKSPACE_EXTENSIONS_FOLDER), 1 /* FileChangeType.ADDED */, 2 /* FileChangeType.DELETED */))) {
                        this.onDidChangeWorkspaceExtensionsScheduler.schedule();
                    }
                }));
            }
        }
        async onDidChangeWorkspaceExtensionsFolders() {
            const existing = this.workspaceExtensions;
            this.workspaceExtensions = await this.fetchWorkspaceExtensions();
            if (!(0, arrays_1.equals)(existing, this.workspaceExtensions, (a, b) => this.uriIdentityService.extUri.isEqual(a, b))) {
                this.onDidChangeExtensionsConfigs();
            }
        }
        async fetchWorkspaceExtensions() {
            if (!this.workbenchExtensionManagementService.isWorkspaceExtensionsSupported()) {
                return [];
            }
            const workspaceExtensions = [];
            for (const workspaceFolder of this.contextService.getWorkspace().folders) {
                const extensionsLocaiton = this.uriIdentityService.extUri.joinPath(workspaceFolder.uri, WORKSPACE_EXTENSIONS_FOLDER);
                try {
                    const stat = await this.fileService.resolve(extensionsLocaiton);
                    for (const extension of stat.children ?? []) {
                        if (!extension.isDirectory) {
                            continue;
                        }
                        workspaceExtensions.push(extension.resource);
                    }
                }
                catch (error) {
                    // ignore
                }
            }
            if (workspaceExtensions.length) {
                const resourceExtensions = await this.workbenchExtensionManagementService.getExtensions(workspaceExtensions);
                return resourceExtensions.map(extension => extension.location);
            }
            return [];
        }
        /**
         * Parse all extensions.json files, fetch workspace recommendations, filter out invalid and unwanted ones
         */
        async fetch() {
            const extensionsConfigs = await this.workspaceExtensionsConfigService.getExtensionsConfigs();
            const { invalidRecommendations, message } = await this.validateExtensions(extensionsConfigs);
            if (invalidRecommendations.length) {
                this.notificationService.warn(`The ${invalidRecommendations.length} extension(s) below, in workspace recommendations have issues:\n${message}`);
            }
            this._recommendations = [];
            this._ignoredRecommendations = [];
            for (const extensionsConfig of extensionsConfigs) {
                if (extensionsConfig.unwantedRecommendations) {
                    for (const unwantedRecommendation of extensionsConfig.unwantedRecommendations) {
                        if (invalidRecommendations.indexOf(unwantedRecommendation) === -1) {
                            this._ignoredRecommendations.push(unwantedRecommendation);
                        }
                    }
                }
                if (extensionsConfig.recommendations) {
                    for (const extensionId of extensionsConfig.recommendations) {
                        if (invalidRecommendations.indexOf(extensionId) === -1) {
                            this._recommendations.push({
                                extension: extensionId,
                                reason: {
                                    reasonId: 0 /* ExtensionRecommendationReason.Workspace */,
                                    reasonText: (0, nls_1.localize)('workspaceRecommendation', "This extension is recommended by users of the current workspace.")
                                }
                            });
                        }
                    }
                }
            }
            for (const extension of this.workspaceExtensions) {
                this._recommendations.push({
                    extension,
                    reason: {
                        reasonId: 0 /* ExtensionRecommendationReason.Workspace */,
                        reasonText: (0, nls_1.localize)('workspaceRecommendation', "This extension is recommended by users of the current workspace.")
                    }
                });
            }
        }
        async validateExtensions(contents) {
            const validExtensions = [];
            const invalidExtensions = [];
            let message = '';
            const allRecommendations = (0, arrays_1.distinct)((0, arrays_1.flatten)(contents.map(({ recommendations }) => recommendations || [])));
            const regEx = new RegExp(extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN);
            for (const extensionId of allRecommendations) {
                if (regEx.test(extensionId)) {
                    validExtensions.push(extensionId);
                }
                else {
                    invalidExtensions.push(extensionId);
                    message += `${extensionId} (bad format) Expected: <provider>.<name>\n`;
                }
            }
            return { validRecommendations: validExtensions, invalidRecommendations: invalidExtensions, message };
        }
        async onDidChangeExtensionsConfigs() {
            await this.fetch();
            this._onDidChangeRecommendations.fire();
        }
    };
    exports.WorkspaceRecommendations = WorkspaceRecommendations;
    exports.WorkspaceRecommendations = WorkspaceRecommendations = __decorate([
        __param(0, workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, files_1.IFileService),
        __param(4, extensionManagement_2.IWorkbenchExtensionManagementService),
        __param(5, notification_1.INotificationService)
    ], WorkspaceRecommendations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlUmVjb21tZW5kYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvd29ya3NwYWNlUmVjb21tZW5kYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCaEcsTUFBTSwyQkFBMkIsR0FBRyxvQkFBb0IsQ0FBQztJQUVsRCxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLG1EQUF3QjtRQUdyRSxJQUFJLGVBQWUsS0FBNkMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBTS9GLElBQUksc0JBQXNCLEtBQTRCLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQztRQUs1RixZQUNvQyxnQ0FBb0YsRUFDN0YsY0FBeUQsRUFDOUQsa0JBQXdELEVBQy9ELFdBQTBDLEVBQ2xCLG1DQUEwRixFQUMxRyxtQkFBMEQ7WUFFaEYsS0FBSyxFQUFFLENBQUM7WUFQNEMscUNBQWdDLEdBQWhDLGdDQUFnQyxDQUFtQztZQUM1RSxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDN0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM5QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNELHdDQUFtQyxHQUFuQyxtQ0FBbUMsQ0FBc0M7WUFDekYsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQWxCekUscUJBQWdCLEdBQThCLEVBQUUsQ0FBQztZQUdqRCxnQ0FBMkIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNqRSwrQkFBMEIsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsS0FBSyxDQUFDO1lBRXJFLDRCQUF1QixH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