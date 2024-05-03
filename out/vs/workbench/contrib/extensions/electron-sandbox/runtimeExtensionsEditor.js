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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/theme/common/themeService", "vs/workbench/services/extensions/common/extensions", "vs/platform/contextview/browser/contextView", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/platform/label/common/label", "vs/workbench/contrib/extensions/electron-sandbox/extensionsSlowActions", "vs/workbench/services/environment/common/environmentService", "vs/workbench/contrib/extensions/common/reportExtensionIssueAction", "vs/workbench/contrib/extensions/browser/abstractRuntimeExtensionsEditor", "vs/base/common/buffer", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/profiling/common/profiling", "vs/platform/clipboard/common/clipboardService", "vs/platform/dialogs/common/dialogs", "vs/base/common/network", "vs/base/common/resources", "vs/workbench/services/extensionManagement/common/extensionFeatures"], function (require, exports, nls, actions_1, telemetry_1, instantiation_1, extensions_1, themeService_1, extensions_2, contextView_1, notification_1, contextkey_1, storage_1, label_1, extensionsSlowActions_1, environmentService_1, reportExtensionIssueAction_1, abstractRuntimeExtensionsEditor_1, buffer_1, uri_1, files_1, profiling_1, clipboardService_1, dialogs_1, network_1, resources_1, extensionFeatures_1) {
    "use strict";
    var StartExtensionHostProfileAction_1, SaveExtensionHostProfileAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SaveExtensionHostProfileAction = exports.StopExtensionHostProfileAction = exports.StartExtensionHostProfileAction = exports.RuntimeExtensionsEditor = exports.ProfileSessionState = exports.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED = exports.CONTEXT_PROFILE_SESSION_STATE = exports.IExtensionHostProfileService = void 0;
    exports.IExtensionHostProfileService = (0, instantiation_1.createDecorator)('extensionHostProfileService');
    exports.CONTEXT_PROFILE_SESSION_STATE = new contextkey_1.RawContextKey('profileSessionState', 'none');
    exports.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED = new contextkey_1.RawContextKey('extensionHostProfileRecorded', false);
    var ProfileSessionState;
    (function (ProfileSessionState) {
        ProfileSessionState[ProfileSessionState["None"] = 0] = "None";
        ProfileSessionState[ProfileSessionState["Starting"] = 1] = "Starting";
        ProfileSessionState[ProfileSessionState["Running"] = 2] = "Running";
        ProfileSessionState[ProfileSessionState["Stopping"] = 3] = "Stopping";
    })(ProfileSessionState || (exports.ProfileSessionState = ProfileSessionState = {}));
    let RuntimeExtensionsEditor = class RuntimeExtensionsEditor extends abstractRuntimeExtensionsEditor_1.AbstractRuntimeExtensionsEditor {
        constructor(group, telemetryService, themeService, contextKeyService, extensionsWorkbenchService, extensionService, notificationService, contextMenuService, instantiationService, storageService, labelService, environmentService, clipboardService, _extensionHostProfileService, extensionFeaturesManagementService) {
            super(group, telemetryService, themeService, contextKeyService, extensionsWorkbenchService, extensionService, notificationService, contextMenuService, instantiationService, storageService, labelService, environmentService, clipboardService, extensionFeaturesManagementService);
            this._extensionHostProfileService = _extensionHostProfileService;
            this._profileInfo = this._extensionHostProfileService.lastProfile;
            this._extensionsHostRecorded = exports.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED.bindTo(contextKeyService);
            this._profileSessionState = exports.CONTEXT_PROFILE_SESSION_STATE.bindTo(contextKeyService);
            this._register(this._extensionHostProfileService.onDidChangeLastProfile(() => {
                this._profileInfo = this._extensionHostProfileService.lastProfile;
                this._extensionsHostRecorded.set(!!this._profileInfo);
                this._updateExtensions();
            }));
            this._register(this._extensionHostProfileService.onDidChangeState(() => {
                const state = this._extensionHostProfileService.state;
                this._profileSessionState.set(ProfileSessionState[state].toLowerCase());
            }));
        }
        _getProfileInfo() {
            return this._profileInfo;
        }
        _getUnresponsiveProfile(extensionId) {
            return this._extensionHostProfileService.getUnresponsiveProfile(extensionId);
        }
        _createSlowExtensionAction(element) {
            if (element.unresponsiveProfile) {
                return this._instantiationService.createInstance(extensionsSlowActions_1.SlowExtensionAction, element.description, element.unresponsiveProfile);
            }
            return null;
        }
        _createReportExtensionIssueAction(element) {
            if (element.marketplaceInfo) {
                return this._instantiationService.createInstance(reportExtensionIssueAction_1.ReportExtensionIssueAction, element.description);
            }
            return null;
        }
        _createSaveExtensionHostProfileAction() {
            return this._instantiationService.createInstance(SaveExtensionHostProfileAction, SaveExtensionHostProfileAction.ID, SaveExtensionHostProfileAction.LABEL);
        }
        _createProfileAction() {
            const state = this._extensionHostProfileService.state;
            const profileAction = (state === ProfileSessionState.Running
                ? this._instantiationService.createInstance(StopExtensionHostProfileAction, StopExtensionHostProfileAction.ID, StopExtensionHostProfileAction.LABEL)
                : this._instantiationService.createInstance(StartExtensionHostProfileAction, StartExtensionHostProfileAction.ID, StartExtensionHostProfileAction.LABEL));
            return profileAction;
        }
    };
    exports.RuntimeExtensionsEditor = RuntimeExtensionsEditor;
    exports.RuntimeExtensionsEditor = RuntimeExtensionsEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, extensions_1.IExtensionsWorkbenchService),
        __param(5, extensions_2.IExtensionService),
        __param(6, notification_1.INotificationService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, storage_1.IStorageService),
        __param(10, label_1.ILabelService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService),
        __param(12, clipboardService_1.IClipboardService),
        __param(13, exports.IExtensionHostProfileService),
        __param(14, extensionFeatures_1.IExtensionFeaturesManagementService)
    ], RuntimeExtensionsEditor);
    let StartExtensionHostProfileAction = class StartExtensionHostProfileAction extends actions_1.Action {
        static { StartExtensionHostProfileAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.extensionHostProfile'; }
        static { this.LABEL = nls.localize('extensionHostProfileStart', "Start Extension Host Profile"); }
        constructor(id = StartExtensionHostProfileAction_1.ID, label = StartExtensionHostProfileAction_1.LABEL, _extensionHostProfileService) {
            super(id, label);
            this._extensionHostProfileService = _extensionHostProfileService;
        }
        run() {
            this._extensionHostProfileService.startProfiling();
            return Promise.resolve();
        }
    };
    exports.StartExtensionHostProfileAction = StartExtensionHostProfileAction;
    exports.StartExtensionHostProfileAction = StartExtensionHostProfileAction = StartExtensionHostProfileAction_1 = __decorate([
        __param(2, exports.IExtensionHostProfileService)
    ], StartExtensionHostProfileAction);
    let StopExtensionHostProfileAction = class StopExtensionHostProfileAction extends actions_1.Action {
        static { this.ID = 'workbench.extensions.action.stopExtensionHostProfile'; }
        static { this.LABEL = nls.localize('stopExtensionHostProfileStart', "Stop Extension Host Profile"); }
        constructor(id = StartExtensionHostProfileAction.ID, label = StartExtensionHostProfileAction.LABEL, _extensionHostProfileService) {
            super(id, label);
            this._extensionHostProfileService = _extensionHostProfileService;
        }
        run() {
            this._extensionHostProfileService.stopProfiling();
            return Promise.resolve();
        }
    };
    exports.StopExtensionHostProfileAction = StopExtensionHostProfileAction;
    exports.StopExtensionHostProfileAction = StopExtensionHostProfileAction = __decorate([
        __param(2, exports.IExtensionHostProfileService)
    ], StopExtensionHostProfileAction);
    let SaveExtensionHostProfileAction = class SaveExtensionHostProfileAction extends actions_1.Action {
        static { SaveExtensionHostProfileAction_1 = this; }
        static { this.LABEL = nls.localize('saveExtensionHostProfile', "Save Extension Host Profile"); }
        static { this.ID = 'workbench.extensions.action.saveExtensionHostProfile'; }
        constructor(id = SaveExtensionHostProfileAction_1.ID, label = SaveExtensionHostProfileAction_1.LABEL, _environmentService, _extensionHostProfileService, _fileService, _fileDialogService) {
            super(id, label, undefined, false);
            this._environmentService = _environmentService;
            this._extensionHostProfileService = _extensionHostProfileService;
            this._fileService = _fileService;
            this._fileDialogService = _fileDialogService;
            this._extensionHostProfileService.onDidChangeLastProfile(() => {
                this.enabled = (this._extensionHostProfileService.lastProfile !== null);
            });
        }
        run() {
            return Promise.resolve(this._asyncRun());
        }
        async _asyncRun() {
            const picked = await this._fileDialogService.showSaveDialog({
                title: nls.localize('saveprofile.dialogTitle', "Save Extension Host Profile"),
                availableFileSystems: [network_1.Schemas.file],
                defaultUri: (0, resources_1.joinPath)(await this._fileDialogService.defaultFilePath(), `CPU-${new Date().toISOString().replace(/[\-:]/g, '')}.cpuprofile`),
                filters: [{
                        name: 'CPU Profiles',
                        extensions: ['cpuprofile', 'txt']
                    }]
            });
            if (!picked) {
                return;
            }
            const profileInfo = this._extensionHostProfileService.lastProfile;
            let dataToWrite = profileInfo ? profileInfo.data : {};
            let savePath = picked.fsPath;
            if (this._environmentService.isBuilt) {
                // when running from a not-development-build we remove
                // absolute filenames because we don't want to reveal anything
                // about users. We also append the `.txt` suffix to make it
                // easier to attach these files to GH issues
                dataToWrite = profiling_1.Utils.rewriteAbsolutePaths(dataToWrite, 'piiRemoved');
                savePath = savePath + '.txt';
            }
            return this._fileService.writeFile(uri_1.URI.file(savePath), buffer_1.VSBuffer.fromString(JSON.stringify(profileInfo ? profileInfo.data : {}, null, '\t')));
        }
    };
    exports.SaveExtensionHostProfileAction = SaveExtensionHostProfileAction;
    exports.SaveExtensionHostProfileAction = SaveExtensionHostProfileAction = SaveExtensionHostProfileAction_1 = __decorate([
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, exports.IExtensionHostProfileService),
        __param(4, files_1.IFileService),
        __param(5, dialogs_1.IFileDialogService)
    ], SaveExtensionHostProfileAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVudGltZUV4dGVuc2lvbnNFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvZWxlY3Ryb24tc2FuZGJveC9ydW50aW1lRXh0ZW5zaW9uc0VkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBK0JuRixRQUFBLDRCQUE0QixHQUFHLElBQUEsK0JBQWUsRUFBK0IsNkJBQTZCLENBQUMsQ0FBQztJQUM1RyxRQUFBLDZCQUE2QixHQUFHLElBQUksMEJBQWEsQ0FBUyxxQkFBcUIsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6RixRQUFBLHVDQUF1QyxHQUFHLElBQUksMEJBQWEsQ0FBVSw4QkFBOEIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUV6SCxJQUFZLG1CQUtYO0lBTEQsV0FBWSxtQkFBbUI7UUFDOUIsNkRBQVEsQ0FBQTtRQUNSLHFFQUFZLENBQUE7UUFDWixtRUFBVyxDQUFBO1FBQ1gscUVBQVksQ0FBQTtJQUNiLENBQUMsRUFMVyxtQkFBbUIsbUNBQW5CLG1CQUFtQixRQUs5QjtJQWtCTSxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLGlFQUErQjtRQU0zRSxZQUNDLEtBQW1CLEVBQ0EsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ3RCLGlCQUFxQyxFQUM1QiwwQkFBdUQsRUFDakUsZ0JBQW1DLEVBQ2hDLG1CQUF5QyxFQUMxQyxrQkFBdUMsRUFDckMsb0JBQTJDLEVBQ2pELGNBQStCLEVBQ2pDLFlBQTJCLEVBQ1osa0JBQWdELEVBQzNELGdCQUFtQyxFQUNQLDRCQUEwRCxFQUNwRSxrQ0FBdUU7WUFFNUcsS0FBSyxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsaUJBQWlCLEVBQUUsMEJBQTBC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