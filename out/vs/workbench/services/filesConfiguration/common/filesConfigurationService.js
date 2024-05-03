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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/base/common/objects", "vs/base/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/common/resources", "vs/base/common/async", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/environment/common/environment", "vs/base/common/map", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor", "vs/platform/markers/common/markers", "vs/editor/common/services/textResourceConfiguration"], function (require, exports, nls_1, instantiation_1, extensions_1, event_1, lifecycle_1, contextkey_1, configuration_1, files_1, objects_1, platform_1, workspace_1, resources_1, async_1, uriIdentity_1, environment_1, map_1, editorInput_1, editor_1, markers_1, textResourceConfiguration_1) {
    "use strict";
    var FilesConfigurationService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilesConfigurationService = exports.IFilesConfigurationService = exports.AutoSaveDisabledReason = exports.AutoSaveMode = exports.AutoSaveAfterShortDelayContext = void 0;
    exports.AutoSaveAfterShortDelayContext = new contextkey_1.RawContextKey('autoSaveAfterShortDelayContext', false, true);
    var AutoSaveMode;
    (function (AutoSaveMode) {
        AutoSaveMode[AutoSaveMode["OFF"] = 0] = "OFF";
        AutoSaveMode[AutoSaveMode["AFTER_SHORT_DELAY"] = 1] = "AFTER_SHORT_DELAY";
        AutoSaveMode[AutoSaveMode["AFTER_LONG_DELAY"] = 2] = "AFTER_LONG_DELAY";
        AutoSaveMode[AutoSaveMode["ON_FOCUS_CHANGE"] = 3] = "ON_FOCUS_CHANGE";
        AutoSaveMode[AutoSaveMode["ON_WINDOW_CHANGE"] = 4] = "ON_WINDOW_CHANGE";
    })(AutoSaveMode || (exports.AutoSaveMode = AutoSaveMode = {}));
    var AutoSaveDisabledReason;
    (function (AutoSaveDisabledReason) {
        AutoSaveDisabledReason[AutoSaveDisabledReason["SETTINGS"] = 1] = "SETTINGS";
        AutoSaveDisabledReason[AutoSaveDisabledReason["OUT_OF_WORKSPACE"] = 2] = "OUT_OF_WORKSPACE";
        AutoSaveDisabledReason[AutoSaveDisabledReason["ERRORS"] = 3] = "ERRORS";
        AutoSaveDisabledReason[AutoSaveDisabledReason["DISABLED"] = 4] = "DISABLED";
    })(AutoSaveDisabledReason || (exports.AutoSaveDisabledReason = AutoSaveDisabledReason = {}));
    exports.IFilesConfigurationService = (0, instantiation_1.createDecorator)('filesConfigurationService');
    let FilesConfigurationService = class FilesConfigurationService extends lifecycle_1.Disposable {
        static { FilesConfigurationService_1 = this; }
        static { this.DEFAULT_AUTO_SAVE_MODE = platform_1.isWeb ? files_1.AutoSaveConfiguration.AFTER_DELAY : files_1.AutoSaveConfiguration.OFF; }
        static { this.DEFAULT_AUTO_SAVE_DELAY = 1000; }
        static { this.READONLY_MESSAGES = {
            providerReadonly: { value: (0, nls_1.localize)('providerReadonly', "Editor is read-only because the file system of the file is read-only."), isTrusted: true },
            sessionReadonly: { value: (0, nls_1.localize)({ key: 'sessionReadonly', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change', '{Locked="](command:{0})"}'] }, "Editor is read-only because the file was set read-only in this session. [Click here](command:{0}) to set writeable.", 'workbench.action.files.setActiveEditorWriteableInSession'), isTrusted: true },
            configuredReadonly: { value: (0, nls_1.localize)({ key: 'configuredReadonly', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change', '{Locked="](command:{0})"}'] }, "Editor is read-only because the file was set read-only via settings. [Click here](command:{0}) to configure.", `workbench.action.openSettings?${encodeURIComponent('["files.readonly"]')}`), isTrusted: true },
            fileLocked: { value: (0, nls_1.localize)({ key: 'fileLocked', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change', '{Locked="](command:{0})"}'] }, "Editor is read-only because of file permissions. [Click here](command:{0}) to set writeable anyway.", 'workbench.action.files.setActiveEditorWriteableInSession'), isTrusted: true },
            fileReadonly: { value: (0, nls_1.localize)('fileReadonly', "Editor is read-only because the file is read-only."), isTrusted: true }
        }; }
        constructor(contextKeyService, configurationService, contextService, environmentService, uriIdentityService, fileService, markerService, textResourceConfigurationService) {
            super();
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.markerService = markerService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this._onDidChangeAutoSaveConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeAutoSaveConfiguration = this._onDidChangeAutoSaveConfiguration.event;
            this._onDidChangeAutoSaveDisabled = this._register(new event_1.Emitter());
            this.onDidChangeAutoSaveDisabled = this._onDidChangeAutoSaveDisabled.event;
            this._onDidChangeFilesAssociation = this._register(new event_1.Emitter());
            this.onDidChangeFilesAssociation = this._onDidChangeFilesAssociation.event;
            this._onDidChangeReadonly = this._register(new event_1.Emitter());
            this.onDidChangeReadonly = this._onDidChangeReadonly.event;
            this.autoSaveConfigurationCache = new map_1.LRUCache(1000);
            this.autoSaveDisabledOverrides = new map_1.ResourceMap();
            this.autoSaveAfterShortDelayContext = exports.AutoSaveAfterShortDelayContext.bindTo(this.contextKeyService);
            this.readonlyIncludeMatcher = this._register(new async_1.GlobalIdleValue(() => this.createReadonlyMatcher(files_1.FILES_READONLY_INCLUDE_CONFIG)));
            this.readonlyExcludeMatcher = this._register(new async_1.GlobalIdleValue(() => this.createReadonlyMatcher(files_1.FILES_READONLY_EXCLUDE_CONFIG)));
            this.sessionReadonlyOverrides = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            const configuration = configurationService.getValue();
            this.currentGlobalAutoSaveConfiguration = this.computeAutoSaveConfiguration(undefined, configuration.files);
            this.currentFilesAssociationConfiguration = configuration?.files?.associations;
            this.currentHotExitConfiguration = configuration?.files?.hotExit || files_1.HotExitConfiguration.ON_EXIT;
            this.onFilesConfigurationChange(configuration, false);
            this.registerListeners();
        }
        createReadonlyMatcher(config) {
            const matcher = this._register(new resources_1.ResourceGlobMatcher(resource => this.configurationService.getValue(config, { resource }), event => event.affectsConfiguration(config), this.contextService, this.configurationService));
            this._register(matcher.onExpressionChange(() => this._onDidChangeReadonly.fire()));
            return matcher;
        }
        isReadonly(resource, stat) {
            // if the entire file system provider is readonly, we respect that
            // and do not allow to change readonly. we take this as a hint that
            // the provider has no capabilities of writing.
            const provider = this.fileService.getProvider(resource.scheme);
            if (provider && (0, files_1.hasReadonlyCapability)(provider)) {
                return provider.readOnlyMessage ?? FilesConfigurationService_1.READONLY_MESSAGES.providerReadonly;
            }
            // session override always wins over the others
            const sessionReadonlyOverride = this.sessionReadonlyOverrides.get(resource);
            if (typeof sessionReadonlyOverride === 'boolean') {
                return sessionReadonlyOverride === true ? FilesConfigurationService_1.READONLY_MESSAGES.sessionReadonly : false;
            }
            if (this.uriIdentityService.extUri.isEqualOrParent(resource, this.environmentService.userRoamingDataHome) ||
                this.uriIdentityService.extUri.isEqual(resource, this.contextService.getWorkspace().configuration ?? undefined)) {
                return false; // explicitly exclude some paths from readonly that we need for configuration
            }
            // configured glob patterns win over stat information
            if (this.readonlyIncludeMatcher.value.matches(resource)) {
                return !this.readonlyExcludeMatcher.value.matches(resource) ? FilesConfigurationService_1.READONLY_MESSAGES.configuredReadonly : false;
            }
            // check if file is locked and configured to treat as readonly
            if (this.configuredReadonlyFromPermissions && stat?.locked) {
                return FilesConfigurationService_1.READONLY_MESSAGES.fileLocked;
            }
            // check if file is marked readonly from the file system provider
            if (stat?.readonly) {
                return FilesConfigurationService_1.READONLY_MESSAGES.fileReadonly;
            }
            return false;
        }
        async updateReadonly(resource, readonly) {
            if (readonly === 'toggle') {
                let stat = undefined;
                try {
                    stat = await this.fileService.resolve(resource, { resolveMetadata: true });
                }
                catch (error) {
                    // ignore
                }
                readonly = !this.isReadonly(resource, stat);
            }
            if (readonly === 'reset') {
                this.sessionReadonlyOverrides.delete(resource);
            }
            else {
                this.sessionReadonlyOverrides.set(resource, readonly);
            }
            this._onDidChangeReadonly.fire();
        }
        registerListeners() {
            // Files configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('files')) {
                    this.onFilesConfigurationChange(this.configurationService.getValue(), true);
                }
            }));
        }
        onFilesConfigurationChange(configuration, fromEvent) {
            // Auto Save
            this.currentGlobalAutoSaveConfiguration = this.computeAutoSaveConfiguration(undefined, configuration.files);
            this.autoSaveConfigurationCache.clear();
            this.autoSaveAfterShortDelayContext.set(this.getAutoSaveMode(undefined).mode === 1 /* AutoSaveMode.AFTER_SHORT_DELAY */);
            if (fromEvent) {
                this._onDidChangeAutoSaveConfiguration.fire();
            }
            // Check for change in files associations
            const filesAssociation = configuration?.files?.associations;
            if (!(0, objects_1.equals)(this.currentFilesAssociationConfiguration, filesAssociation)) {
                this.currentFilesAssociationConfiguration = filesAssociation;
                if (fromEvent) {
                    this._onDidChangeFilesAssociation.fire();
                }
            }
            // Hot exit
            const hotExitMode = configuration?.files?.hotExit;
            if (hotExitMode === files_1.HotExitConfiguration.OFF || hotExitMode === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE) {
                this.currentHotExitConfiguration = hotExitMode;
            }
            else {
                this.currentHotExitConfiguration = files_1.HotExitConfiguration.ON_EXIT;
            }
            // Readonly
            const readonlyFromPermissions = Boolean(configuration?.files?.readonlyFromPermissions);
            if (readonlyFromPermissions !== Boolean(this.configuredReadonlyFromPermissions)) {
                this.configuredReadonlyFromPermissions = readonlyFromPermissions;
                if (fromEvent) {
                    this._onDidChangeReadonly.fire();
                }
            }
        }
        getAutoSaveConfiguration(resourceOrEditor) {
            const resource = this.toResource(resourceOrEditor);
            if (resource) {
                let resourceAutoSaveConfiguration = this.autoSaveConfigurationCache.get(resource);
                if (!resourceAutoSaveConfiguration) {
                    resourceAutoSaveConfiguration = this.computeAutoSaveConfiguration(resource, this.textResourceConfigurationService.getValue(resource, 'files'));
                    this.autoSaveConfigurationCache.set(resource, resourceAutoSaveConfiguration);
                }
                return resourceAutoSaveConfiguration;
            }
            return this.currentGlobalAutoSaveConfiguration;
        }
        computeAutoSaveConfiguration(resource, filesConfiguration) {
            let autoSave;
            let autoSaveDelay;
            let autoSaveWorkspaceFilesOnly;
            let autoSaveWhenNoErrors;
            let isOutOfWorkspace;
            let isShortAutoSaveDelay;
            switch (filesConfiguration.autoSave ?? FilesConfigurationService_1.DEFAULT_AUTO_SAVE_MODE) {
                case files_1.AutoSaveConfiguration.AFTER_DELAY: {
                    autoSave = 'afterDelay';
                    autoSaveDelay = typeof filesConfiguration.autoSaveDelay === 'number' && filesConfiguration.autoSaveDelay >= 0 ? filesConfiguration.autoSaveDelay : FilesConfigurationService_1.DEFAULT_AUTO_SAVE_DELAY;
                    isShortAutoSaveDelay = autoSaveDelay <= FilesConfigurationService_1.DEFAULT_AUTO_SAVE_DELAY;
                    break;
                }
                case files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE:
                    autoSave = 'onFocusChange';
                    break;
                case files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE:
                    autoSave = 'onWindowChange';
                    break;
            }
            if (filesConfiguration.autoSaveWorkspaceFilesOnly === true) {
                autoSaveWorkspaceFilesOnly = true;
                if (resource && !this.contextService.isInsideWorkspace(resource)) {
                    isOutOfWorkspace = true;
                    isShortAutoSaveDelay = undefined; // out of workspace file are not auto saved with this configuration
                }
            }
            if (filesConfiguration.autoSaveWhenNoErrors === true) {
                autoSaveWhenNoErrors = true;
                isShortAutoSaveDelay = undefined; // this configuration disables short auto save delay
            }
            return {
                autoSave,
                autoSaveDelay,
                autoSaveWorkspaceFilesOnly,
                autoSaveWhenNoErrors,
                isOutOfWorkspace,
                isShortAutoSaveDelay
            };
        }
        toResource(resourceOrEditor) {
            if (resourceOrEditor instanceof editorInput_1.EditorInput) {
                return editor_1.EditorResourceAccessor.getOriginalUri(resourceOrEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            }
            return resourceOrEditor;
        }
        hasShortAutoSaveDelay(resourceOrEditor) {
            const resource = this.toResource(resourceOrEditor);
            if (this.getAutoSaveConfiguration(resource).isShortAutoSaveDelay) {
                return !resource || !this.autoSaveDisabledOverrides.has(resource);
            }
            return false;
        }
        getAutoSaveMode(resourceOrEditor, saveReason) {
            const resource = this.toResource(resourceOrEditor);
            if (resource && this.autoSaveDisabledOverrides.has(resource)) {
                return { mode: 0 /* AutoSaveMode.OFF */, reason: 4 /* AutoSaveDisabledReason.DISABLED */ };
            }
            const autoSaveConfiguration = this.getAutoSaveConfiguration(resource);
            if (typeof autoSaveConfiguration.autoSave === 'undefined') {
                return { mode: 0 /* AutoSaveMode.OFF */, reason: 1 /* AutoSaveDisabledReason.SETTINGS */ };
            }
            if (typeof saveReason === 'number') {
                if ((autoSaveConfiguration.autoSave === 'afterDelay' && saveReason !== 2 /* SaveReason.AUTO */) ||
                    (autoSaveConfiguration.autoSave === 'onFocusChange' && saveReason !== 3 /* SaveReason.FOCUS_CHANGE */ && saveReason !== 4 /* SaveReason.WINDOW_CHANGE */) ||
                    (autoSaveConfiguration.autoSave === 'onWindowChange' && saveReason !== 4 /* SaveReason.WINDOW_CHANGE */)) {
                    return { mode: 0 /* AutoSaveMode.OFF */, reason: 1 /* AutoSaveDisabledReason.SETTINGS */ };
                }
            }
            if (resource) {
                if (autoSaveConfiguration.autoSaveWorkspaceFilesOnly && autoSaveConfiguration.isOutOfWorkspace) {
                    return { mode: 0 /* AutoSaveMode.OFF */, reason: 2 /* AutoSaveDisabledReason.OUT_OF_WORKSPACE */ };
                }
                if (autoSaveConfiguration.autoSaveWhenNoErrors && this.markerService.read({ resource, take: 1, severities: markers_1.MarkerSeverity.Error }).length > 0) {
                    return { mode: 0 /* AutoSaveMode.OFF */, reason: 3 /* AutoSaveDisabledReason.ERRORS */ };
                }
            }
            switch (autoSaveConfiguration.autoSave) {
                case 'afterDelay':
                    if (typeof autoSaveConfiguration.autoSaveDelay === 'number' && autoSaveConfiguration.autoSaveDelay <= FilesConfigurationService_1.DEFAULT_AUTO_SAVE_DELAY) {
                        // Explicitly mark auto save configurations as long running
                        // if they are configured to not run when there are errors.
                        // The rationale here is that errors may come in after auto
                        // save has been scheduled and then further delay the auto
                        // save until resolved.
                        return { mode: autoSaveConfiguration.autoSaveWhenNoErrors ? 2 /* AutoSaveMode.AFTER_LONG_DELAY */ : 1 /* AutoSaveMode.AFTER_SHORT_DELAY */ };
                    }
                    return { mode: 2 /* AutoSaveMode.AFTER_LONG_DELAY */ };
                case 'onFocusChange':
                    return { mode: 3 /* AutoSaveMode.ON_FOCUS_CHANGE */ };
                case 'onWindowChange':
                    return { mode: 4 /* AutoSaveMode.ON_WINDOW_CHANGE */ };
            }
        }
        async toggleAutoSave() {
            const currentSetting = this.configurationService.getValue('files.autoSave');
            let newAutoSaveValue;
            if ([files_1.AutoSaveConfiguration.AFTER_DELAY, files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE, files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE].some(setting => setting === currentSetting)) {
                newAutoSaveValue = files_1.AutoSaveConfiguration.OFF;
            }
            else {
                newAutoSaveValue = files_1.AutoSaveConfiguration.AFTER_DELAY;
            }
            return this.configurationService.updateValue('files.autoSave', newAutoSaveValue);
        }
        disableAutoSave(resourceOrEditor) {
            const resource = this.toResource(resourceOrEditor);
            if (!resource) {
                return lifecycle_1.Disposable.None;
            }
            const counter = this.autoSaveDisabledOverrides.get(resource) ?? 0;
            this.autoSaveDisabledOverrides.set(resource, counter + 1);
            if (counter === 0) {
                this._onDidChangeAutoSaveDisabled.fire(resource);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                const counter = this.autoSaveDisabledOverrides.get(resource) ?? 0;
                if (counter <= 1) {
                    this.autoSaveDisabledOverrides.delete(resource);
                    this._onDidChangeAutoSaveDisabled.fire(resource);
                }
                else {
                    this.autoSaveDisabledOverrides.set(resource, counter - 1);
                }
            });
        }
        get isHotExitEnabled() {
            if (this.contextService.getWorkspace().transient) {
                // Transient workspace: hot exit is disabled because
                // transient workspaces are not restored upon restart
                return false;
            }
            return this.currentHotExitConfiguration !== files_1.HotExitConfiguration.OFF;
        }
        get hotExitConfiguration() {
            return this.currentHotExitConfiguration;
        }
        preventSaveConflicts(resource, language) {
            return this.configurationService.getValue('files.saveConflictResolution', { resource, overrideIdentifier: language }) !== 'overwriteFileOnDisk';
        }
    };
    exports.FilesConfigurationService = FilesConfigurationService;
    exports.FilesConfigurationService = FilesConfigurationService = FilesConfigurationService_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, files_1.IFileService),
        __param(6, markers_1.IMarkerService),
        __param(7, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], FilesConfigurationService);
    (0, extensions_1.registerSingleton)(exports.IFilesConfigurationService, FilesConfigurationService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZXNDb25maWd1cmF0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2ZpbGVzQ29uZmlndXJhdGlvbi9jb21tb24vZmlsZXNDb25maWd1cmF0aW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBMEJuRixRQUFBLDhCQUE4QixHQUFHLElBQUksMEJBQWEsQ0FBVSxnQ0FBZ0MsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFtQnhILElBQWtCLFlBTWpCO0lBTkQsV0FBa0IsWUFBWTtRQUM3Qiw2Q0FBRyxDQUFBO1FBQ0gseUVBQWlCLENBQUE7UUFDakIsdUVBQWdCLENBQUE7UUFDaEIscUVBQWUsQ0FBQTtRQUNmLHVFQUFnQixDQUFBO0lBQ2pCLENBQUMsRUFOaUIsWUFBWSw0QkFBWixZQUFZLFFBTTdCO0lBRUQsSUFBa0Isc0JBS2pCO0lBTEQsV0FBa0Isc0JBQXNCO1FBQ3ZDLDJFQUFZLENBQUE7UUFDWiwyRkFBZ0IsQ0FBQTtRQUNoQix1RUFBTSxDQUFBO1FBQ04sMkVBQVEsQ0FBQTtJQUNULENBQUMsRUFMaUIsc0JBQXNCLHNDQUF0QixzQkFBc0IsUUFLdkM7SUFhWSxRQUFBLDBCQUEwQixHQUFHLElBQUEsK0JBQWUsRUFBNkIsMkJBQTJCLENBQUMsQ0FBQztJQTJDNUcsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBMEIsU0FBUSxzQkFBVTs7aUJBSWhDLDJCQUFzQixHQUFHLGdCQUFLLENBQUMsQ0FBQyxDQUFDLDZCQUFxQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsNkJBQXFCLENBQUMsR0FBRyxBQUF4RSxDQUF5RTtpQkFDL0YsNEJBQXVCLEdBQUcsSUFBSSxBQUFQLENBQVE7aUJBRS9CLHNCQUFp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