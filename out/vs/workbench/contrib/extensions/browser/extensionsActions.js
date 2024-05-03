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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/async", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/json", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/common/extensionsFileTemplate", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/workbench/services/host/browser/host", "vs/workbench/services/extensions/common/extensions", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/configuration/common/jsonEditing", "vs/editor/common/services/resolverService", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/browser/actions/workspaceCommands", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/workbench/services/editor/common/editorService", "vs/platform/quickinput/common/quickInput", "vs/base/common/cancellation", "vs/base/browser/ui/aria/aria", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/label/common/label", "vs/workbench/services/textfile/common/textfiles", "vs/platform/product/common/productService", "vs/platform/dialogs/common/dialogs", "vs/platform/progress/common/progress", "vs/base/browser/ui/actionbar/actionViewItems", "vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig", "vs/base/common/errors", "vs/platform/userDataSync/common/userDataSync", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/platform/log/common/log", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/base/common/platform", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/workspace/common/workspaceTrust", "vs/platform/workspace/common/virtualWorkspace", "vs/base/common/htmlContent", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/arrays", "vs/base/common/date", "vs/workbench/services/preferences/common/preferences", "vs/platform/languagePacks/common/languagePacks", "vs/workbench/services/localization/common/locale", "vs/base/common/types", "vs/workbench/services/log/common/logConstants", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/registry/common/platform", "vs/platform/update/common/update", "vs/css!./media/extensionActions"], function (require, exports, nls_1, actions_1, async_1, DOM, event_1, json, contextView_1, lifecycle_1, extensions_1, extensionsFileTemplate_1, extensionManagement_1, extensionManagement_2, extensionRecommendations_1, extensionManagementUtil_1, extensions_2, instantiation_1, files_1, workspace_1, host_1, extensions_3, uri_1, commands_1, configuration_1, themeService_1, themables_1, colorRegistry_1, jsonEditing_1, resolverService_1, contextkey_1, actions_2, workspaceCommands_1, notification_1, opener_1, editorService_1, quickInput_1, cancellation_1, aria_1, workbenchThemeService_1, label_1, textfiles_1, productService_1, dialogs_1, progress_1, actionViewItems_1, workspaceExtensionsConfig_1, errors_1, userDataSync_1, dropdownActionViewItem_1, log_1, extensionsIcons_1, platform_1, extensionManifestPropertiesService_1, workspaceTrust_1, virtualWorkspace_1, htmlContent_1, panecomposite_1, arrays_1, date_1, preferences_1, languagePacks_1, locale_1, types_1, logConstants_1, telemetry_1, extensionFeatures_1, platform_2, update_1) {
    "use strict";
    var InstallAction_1, InstallInOtherServerAction_1, UninstallAction_1, ToggleAutoUpdateForExtensionAction_1, ToggleAutoUpdatesForPublisherAction_1, MigrateDeprecatedExtensionAction_1, ManageExtensionAction_1, TogglePreReleaseExtensionAction_1, InstallAnotherVersionAction_1, EnableForWorkspaceAction_1, EnableGloballyAction_1, DisableForWorkspaceAction_1, DisableGloballyAction_1, ExtensionRuntimeStateAction_1, SetColorThemeAction_1, SetFileIconThemeAction_1, SetProductIconThemeAction_1, SetLanguageAction_1, ClearLanguageAction_1, ShowRecommendedExtensionAction_1, InstallRecommendedExtensionAction_1, IgnoreExtensionRecommendationAction_1, UndoIgnoreExtensionRecommendationAction_1, ExtensionStatusLabelAction_1, ToggleSyncExtensionAction_1, ExtensionStatusAction_1, ReinstallAction_1, InstallSpecificVersionOfExtensionAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extensionButtonProminentBackground = exports.InstallRemoteExtensionsInLocalAction = exports.InstallLocalExtensionsInRemoteAction = exports.AbstractInstallExtensionsInServerAction = exports.InstallSpecificVersionOfExtensionAction = exports.ReinstallAction = exports.ExtensionStatusAction = exports.ToggleSyncExtensionAction = exports.ExtensionStatusLabelAction = exports.ConfigureWorkspaceFolderRecommendedExtensionsAction = exports.ConfigureWorkspaceRecommendedExtensionsAction = exports.AbstractConfigureRecommendedExtensionsAction = exports.SearchExtensionsAction = exports.UndoIgnoreExtensionRecommendationAction = exports.IgnoreExtensionRecommendationAction = exports.InstallRecommendedExtensionAction = exports.ShowRecommendedExtensionAction = exports.ClearLanguageAction = exports.SetLanguageAction = exports.SetProductIconThemeAction = exports.SetFileIconThemeAction = exports.SetColorThemeAction = exports.ExtensionRuntimeStateAction = exports.DisableDropDownAction = exports.EnableDropDownAction = exports.DisableGloballyAction = exports.DisableForWorkspaceAction = exports.EnableGloballyAction = exports.EnableForWorkspaceAction = exports.InstallAnotherVersionAction = exports.TogglePreReleaseExtensionAction = exports.MenuItemExtensionAction = exports.ExtensionEditorManageExtensionAction = exports.ManageExtensionAction = exports.DropDownMenuActionViewItem = exports.ExtensionDropDownAction = exports.ExtensionActionWithDropdownActionViewItem = exports.MigrateDeprecatedExtensionAction = exports.ToggleAutoUpdatesForPublisherAction = exports.ToggleAutoUpdateForExtensionAction = exports.UpdateAction = exports.UninstallAction = exports.WebInstallAction = exports.LocalInstallAction = exports.RemoteInstallAction = exports.InstallInOtherServerAction = exports.InstallingLabelAction = exports.InstallDropdownAction = exports.InstallAction = exports.ActionWithDropDownAction = exports.ExtensionAction = exports.PromptExtensionInstallFailureAction = void 0;
    exports.getContextMenuActions = getContextMenuActions;
    let PromptExtensionInstallFailureAction = class PromptExtensionInstallFailureAction extends actions_1.Action {
        constructor(extension, version, installOperation, error, productService, openerService, notificationService, dialogService, commandService, logService, extensionManagementServerService, instantiationService, galleryService, extensionManifestPropertiesService) {
            super('extension.promptExtensionInstallFailure');
            this.extension = extension;
            this.version = version;
            this.installOperation = installOperation;
            this.error = error;
            this.productService = productService;
            this.openerService = openerService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.commandService = commandService;
            this.logService = logService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.instantiationService = instantiationService;
            this.galleryService = galleryService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
        }
        async run() {
            if ((0, errors_1.isCancellationError)(this.error)) {
                return;
            }
            this.logService.error(this.error);
            if (this.error.name === extensionManagement_1.ExtensionManagementErrorCode.Unsupported) {
                const productName = platform_1.isWeb ? (0, nls_1.localize)('VS Code for Web', "{0} for the Web", this.productService.nameLong) : this.productService.nameLong;
                const message = (0, nls_1.localize)('cannot be installed', "The '{0}' extension is not available in {1}. Click 'More Information' to learn more.", this.extension.displayName || this.extension.identifier.id, productName);
                const { confirmed } = await this.dialogService.confirm({
                    type: notification_1.Severity.Info,
                    message,
                    primaryButton: (0, nls_1.localize)({ key: 'more information', comment: ['&& denotes a mnemonic'] }, "&&More Information"),
                    cancelButton: (0, nls_1.localize)('close', "Close")
                });
                if (confirmed) {
                    this.openerService.open(platform_1.isWeb ? uri_1.URI.parse('https://aka.ms/vscode-web-extensions-guide') : uri_1.URI.parse('https://aka.ms/vscode-remote'));
                }
                return;
            }
            if (extensionManagement_1.ExtensionManagementErrorCode.ReleaseVersionNotFound === this.error.name) {
                await this.dialogService.prompt({
                    type: 'error',
                    message: (0, errors_1.getErrorMessage)(this.error),
                    buttons: [{
                            label: (0, nls_1.localize)('install prerelease', "Install Pre-Release"),
                            run: () => {
                                const installAction = this.instantiationService.createInstance(InstallAction, { installPreReleaseVersion: true });
                                installAction.extension = this.extension;
                                return installAction.run();
                            }
                        }],
                    cancelButton: (0, nls_1.localize)('cancel', "Cancel")
                });
                return;
            }
            if ([extensionManagement_1.ExtensionManagementErrorCode.Incompatible, extensionManagement_1.ExtensionManagementErrorCode.IncompatibleTargetPlatform, extensionManagement_1.ExtensionManagementErrorCode.Malicious, extensionManagement_1.ExtensionManagementErrorCode.Deprecated].includes(this.error.name)) {
                await this.dialogService.info((0, errors_1.getErrorMessage)(this.error));
                return;
            }
            if (extensionManagement_1.ExtensionManagementErrorCode.Signature === this.error.name) {
                await this.dialogService.prompt({
                    type: 'error',
                    message: (0, nls_1.localize)('signature verification failed', "{0} cannot verify the '{1}' extension. Are you sure you want to install it?", this.productService.nameLong, this.extension.displayName || this.extension.identifier.id),
                    buttons: [{
                            label: (0, nls_1.localize)('install anyway', "Install Anyway"),
                            run: () => {
                                const installAction = this.instantiationService.createInstance(InstallAction, { donotVerifySignature: true });
                                installAction.extension = this.extension;
                                return installAction.run();
                            }
                        }],
                    cancelButton: (0, nls_1.localize)('cancel', "Cancel")
                });
                return;
            }
            const operationMessage = this.installOperation === 3 /* InstallOperation.Update */ ? (0, nls_1.localize)('update operation', "Error while updating '{0}' extension.", this.extension.displayName || this.extension.identifier.id)
                : (0, nls_1.localize)('install operation', "Error while installing '{0}' extension.", this.extension.displayName || this.extension.identifier.id);
            let additionalMessage;
            const promptChoices = [];
            const downloadUrl = await this.getDownloadUrl();
            if (downloadUrl) {
                additionalMessage = (0, nls_1.localize)('check logs', "Please check the [log]({0}) for more details.", `command:${logConstants_1.showWindowLogActionId}`);
                promptChoices.push({
                    label: (0, nls_1.localize)('download', "Try Downloading Manually..."),
                    run: () => this.openerService.open(downloadUrl).then(() => {
                        this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('install vsix', 'Once downloaded, please manually install the downloaded VSIX of \'{0}\'.', this.extension.identifier.id), [{
                                label: (0, nls_1.localize)('installVSIX', "Install from VSIX..."),
                                run: () => this.commandService.executeCommand(extensions_1.SELECT_INSTALL_VSIX_EXTENSION_COMMAND_ID)
                            }]);
                    })
                });
            }
            const message = `${operationMessage}${additionalMessage ? ` ${additionalMessage}` : ''}`;
            this.notificationService.prompt(notification_1.Severity.Error, message, promptChoices);
        }
        async getDownloadUrl() {
            if (platform_1.isIOS) {
                return undefined;
            }
            if (!this.extension.gallery) {
                return undefined;
            }
            if (!this.productService.extensionsGallery) {
                return undefined;
            }
            if (!this.extensionManagementServerService.localExtensionManagementServer && !this.extensionManagementServerService.remoteExtensionManagementServer) {
                return undefined;
            }
            let targetPlatform = this.extension.gallery.properties.targetPlatform;
            if (targetPlatform !== "universal" /* TargetPlatform.UNIVERSAL */ && targetPlatform !== "undefined" /* TargetPlatform.UNDEFINED */ && this.extensionManagementServerService.remoteExtensionManagementServer) {
                try {
                    const manifest = await this.galleryService.getManifest(this.extension.gallery, cancellation_1.CancellationToken.None);
                    if (manifest && this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(manifest)) {
                        targetPlatform = await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getTargetPlatform();
                    }
                }
                catch (error) {
                    this.logService.error(error);
                    return undefined;
                }
            }
            if (targetPlatform === "unknown" /* TargetPlatform.UNKNOWN */) {
                return undefined;
            }
            return uri_1.URI.parse(`${this.productService.extensionsGallery.serviceUrl}/publishers/${this.extension.publisher}/vsextensions/${this.extension.name}/${this.version}/vspackage${targetPlatform !== "undefined" /* TargetPlatform.UNDEFINED */ ? `?targetPlatform=${targetPlatform}` : ''}`);
        }
    };
    exports.PromptExtensionInstallFailureAction = PromptExtensionInstallFailureAction;
    exports.PromptExtensionInstallFailureAction = PromptExtensionInstallFailureAction = __decorate([
        __param(4, productService_1.IProductService),
        __param(5, opener_1.IOpenerService),
        __param(6, notification_1.INotificationService),
        __param(7, dialogs_1.IDialogService),
        __param(8, commands_1.ICommandService),
        __param(9, log_1.ILogService),
        __param(10, extensionManagement_2.IExtensionManagementServerService),
        __param(11, instantiation_1.IInstantiationService),
        __param(12, extensionManagement_1.IExtensionGalleryService),
        __param(13, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], PromptExtensionInstallFailureAction);
    class ExtensionAction extends actions_1.Action {
        constructor() {
            super(...arguments);
            this._extension = null;
        }
        static { this.EXTENSION_ACTION_CLASS = 'extension-action'; }
        static { this.TEXT_ACTION_CLASS = `${ExtensionAction.EXTENSION_ACTION_CLASS} text`; }
        static { this.LABEL_ACTION_CLASS = `${ExtensionAction.EXTENSION_ACTION_CLASS} label`; }
        static { this.ICON_ACTION_CLASS = `${ExtensionAction.EXTENSION_ACTION_CLASS} icon`; }
        get extension() { return this._extension; }
        set extension(extension) { this._extension = extension; this.update(); }
    }
    exports.ExtensionAction = ExtensionAction;
    class ActionWithDropDownAction extends ExtensionAction {
        get menuActions() { return [...this._menuActions]; }
        get extension() {
            return super.extension;
        }
        set extension(extension) {
            this.extensionActions.forEach(a => a.extension = extension);
            super.extension = extension;
        }
        constructor(id, label, actionsGroups) {
            super(id, label);
            this.actionsGroups = actionsGroups;
            this._menuActions = [];
            this.extensionActions = (0, arrays_1.flatten)(actionsGroups);
            this.update();
            this._register(event_1.Event.any(...this.extensionActions.map(a => a.onDidChange))(() => this.update(true)));
            this.extensionActions.forEach(a => this._register(a));
        }
        update(donotUpdateActions) {
            if (!donotUpdateActions) {
                this.extensionActions.forEach(a => a.update());
            }
            const enabledActionsGroups = this.actionsGroups.map(actionsGroup => actionsGroup.filter(a => a.enabled));
            let actions = [];
            for (const enabledActions of enabledActionsGroups) {
                if (enabledActions.length) {
                    actions = [...actions, ...enabledActions, new actions_1.Separator()];
                }
            }
            actions = actions.length ? actions.slice(0, actions.length - 1) : actions;
            this.action = actions[0];
            this._menuActions = actions.length > 1 ? actions : [];
            this.enabled = !!this.action;
            if (this.action) {
                this.label = this.getLabel(this.action);
                this.tooltip = this.action.tooltip;
            }
            let clazz = (this.action || this.extensionActions[0])?.class || '';
            clazz = clazz ? `${clazz} action-dropdown` : 'action-dropdown';
            if (this._menuActions.length === 0) {
                clazz += ' action-dropdown';
            }
            this.class = clazz;
        }
        run() {
            const enabledActions = this.extensionActions.filter(a => a.enabled);
            return enabledActions[0].run();
        }
        getLabel(action) {
            return action.label;
        }
    }
    exports.ActionWithDropDownAction = ActionWithDropDownAction;
    let InstallAction = class InstallAction extends ExtensionAction {
        static { InstallAction_1 = this; }
        static { this.Class = `${ExtensionAction.LABEL_ACTION_CLASS} prominent install`; }
        set manifest(manifest) {
            this._manifest = manifest;
            this.updateLabel();
        }
        constructor(options, extensionsWorkbenchService, instantiationService, runtimeExtensionService, workbenchThemeService, labelService, dialogService, preferencesService, telemetryService, contextService) {
            super('extensions.install', (0, nls_1.localize)('install', "Install"), InstallAction_1.Class, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.instantiationService = instantiationService;
            this.runtimeExtensionService = runtimeExtensionService;
            this.workbenchThemeService = workbenchThemeService;
            this.labelService = labelService;
            this.dialogService = dialogService;
            this.preferencesService = preferencesService;
            this.telemetryService = telemetryService;
            this.contextService = contextService;
            this._manifest = null;
            this.updateThrottler = new async_1.Throttler();
            this.options = { ...options, isMachineScoped: false };
            this.update();
            this._register(this.labelService.onDidChangeFormatters(() => this.updateLabel(), this));
        }
        update() {
            this.updateThrottler.queue(() => this.computeAndUpdateEnablement());
        }
        async computeAndUpdateEnablement() {
            this.enabled = false;
            if (!this.extension) {
                return;
            }
            if (this.extension.isBuiltin) {
                return;
            }
            if (this.extensionsWorkbenchService.canSetLanguage(this.extension)) {
                return;
            }
            if (this.extension.state === 3 /* ExtensionState.Uninstalled */ && await this.extensionsWorkbenchService.canInstall(this.extension)) {
                this.enabled = this.options.installPreReleaseVersion ? this.extension.hasPreReleaseVersion : this.extension.hasReleaseVersion;
                this.updateLabel();
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            if (this.extension.deprecationInfo) {
                let detail = (0, nls_1.localize)('deprecated message', "This extension is deprecated as it is no longer being maintained.");
                let DeprecationChoice;
                (function (DeprecationChoice) {
                    DeprecationChoice[DeprecationChoice["InstallAnyway"] = 0] = "InstallAnyway";
                    DeprecationChoice[DeprecationChoice["ShowAlternateExtension"] = 1] = "ShowAlternateExtension";
                    DeprecationChoice[DeprecationChoice["ConfigureSettings"] = 2] = "ConfigureSettings";
                    DeprecationChoice[DeprecationChoice["Cancel"] = 3] = "Cancel";
                })(DeprecationChoice || (DeprecationChoice = {}));
                const buttons = [
                    {
                        label: (0, nls_1.localize)('install anyway', "Install Anyway"),
                        run: () => DeprecationChoice.InstallAnyway
                    }
                ];
                if (this.extension.deprecationInfo.extension) {
                    detail = (0, nls_1.localize)('deprecated with alternate extension message', "This extension is deprecated. Use the {0} extension instead.", this.extension.deprecationInfo.extension.displayName);
                    const alternateExtension = this.extension.deprecationInfo.extension;
                    buttons.push({
                        label: (0, nls_1.localize)({ key: 'Show alternate extension', comment: ['&& denotes a mnemonic'] }, "&&Open {0}", this.extension.deprecationInfo.extension.displayName),
                        run: async () => {
                            const [extension] = await this.extensionsWorkbenchService.getExtensions([{ id: alternateExtension.id, preRelease: alternateExtension.preRelease }], cancellation_1.CancellationToken.None);
                            await this.extensionsWorkbenchService.open(extension);
                            return DeprecationChoice.ShowAlternateExtension;
                        }
                    });
                }
                else if (this.extension.deprecationInfo.settings) {
                    detail = (0, nls_1.localize)('deprecated with alternate settings message', "This extension is deprecated as this functionality is now built-in to VS Code.");
                    const settings = this.extension.deprecationInfo.settings;
                    buttons.push({
                        label: (0, nls_1.localize)({ key: 'configure in settings', comment: ['&& denotes a mnemonic'] }, "&&Configure Settings"),
                        run: async () => {
                            await this.preferencesService.openSettings({ query: settings.map(setting => `@id:${setting}`).join(' ') });
                            return DeprecationChoice.ConfigureSettings;
                        }
                    });
                }
                else if (this.extension.deprecationInfo.additionalInfo) {
                    detail = new htmlContent_1.MarkdownString(`${detail} ${this.extension.deprecationInfo.additionalInfo}`);
                }
                const { result } = await this.dialogService.prompt({
                    type: notification_1.Severity.Warning,
                    message: (0, nls_1.localize)('install confirmation', "Are you sure you want to install '{0}'?", this.extension.displayName),
                    detail: (0, types_1.isString)(detail) ? detail : undefined,
                    custom: (0, types_1.isString)(detail) ? undefined : {
                        markdownDetails: [{
                                markdown: detail
                            }]
                    },
                    buttons,
                    cancelButton: {
                        run: () => DeprecationChoice.Cancel
                    }
                });
                if (result !== DeprecationChoice.InstallAnyway) {
                    return;
                }
            }
            this.extensionsWorkbenchService.open(this.extension, { showPreReleaseVersion: this.options.installPreReleaseVersion });
            (0, aria_1.alert)((0, nls_1.localize)('installExtensionStart', "Installing extension {0} started. An editor is now open with more details on this extension", this.extension.displayName));
            /* __GDPR__
                "extensions:action:install" : {
                    "owner": "sandy081",
                    "actionId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "${include}": [
                        "${GalleryExtensionTelemetryData}"
                    ]
                }
            */
            this.telemetryService.publicLog('extensions:action:install', { ...this.extension.telemetryData, actionId: this.id });
            const extension = await this.install(this.extension);
            if (extension?.local) {
                (0, aria_1.alert)((0, nls_1.localize)('installExtensionComplete', "Installing extension {0} is completed.", this.extension.displayName));
                const runningExtension = await this.getRunningExtension(extension.local);
                if (runningExtension && !(runningExtension.activationEvents && runningExtension.activationEvents.some(activationEent => activationEent.startsWith('onLanguage')))) {
                    const action = await this.getThemeAction(extension);
                    if (action) {
                        action.extension = extension;
                        try {
                            return action.run({ showCurrentTheme: true, ignoreFocusLost: true });
                        }
                        finally {
                            action.dispose();
                        }
                    }
                }
            }
        }
        async getThemeAction(extension) {
            const colorThemes = await this.workbenchThemeService.getColorThemes();
            if (colorThemes.some(theme => isThemeFromExtension(theme, extension))) {
                return this.instantiationService.createInstance(SetColorThemeAction);
            }
            const fileIconThemes = await this.workbenchThemeService.getFileIconThemes();
            if (fileIconThemes.some(theme => isThemeFromExtension(theme, extension))) {
                return this.instantiationService.createInstance(SetFileIconThemeAction);
            }
            const productIconThemes = await this.workbenchThemeService.getProductIconThemes();
            if (productIconThemes.some(theme => isThemeFromExtension(theme, extension))) {
                return this.instantiationService.createInstance(SetProductIconThemeAction);
            }
            return undefined;
        }
        async install(extension) {
            try {
                return await this.extensionsWorkbenchService.install(extension, this.options);
            }
            catch (error) {
                await this.instantiationService.createInstance(PromptExtensionInstallFailureAction, extension, extension.latestVersion, 2 /* InstallOperation.Install */, error).run();
                return undefined;
            }
        }
        async getRunningExtension(extension) {
            const runningExtension = await this.runtimeExtensionService.getExtension(extension.identifier.id);
            if (runningExtension) {
                return runningExtension;
            }
            if (this.runtimeExtensionService.canAddExtension((0, extensions_3.toExtensionDescription)(extension))) {
                return new Promise((c, e) => {
                    const disposable = this.runtimeExtensionService.onDidChangeExtensions(async () => {
                        const runningExtension = await this.runtimeExtensionService.getExtension(extension.identifier.id);
                        if (runningExtension) {
                            disposable.dispose();
                            c(runningExtension);
                        }
                    });
                });
            }
            return null;
        }
        updateLabel() {
            this.label = this.getLabel();
        }
        getLabel(primary) {
            if (this.extension?.isWorkspaceScoped && this.extension.resourceExtension && this.contextService.isInsideWorkspace(this.extension.resourceExtension.location)) {
                return (0, nls_1.localize)('install workspace version', "Install Workspace Extension");
            }
            /* install pre-release version */
            if (this.options.installPreReleaseVersion && this.extension?.hasPreReleaseVersion) {
                return primary ? (0, nls_1.localize)('install pre-release', "Install Pre-Release") : (0, nls_1.localize)('install pre-release version', "Install Pre-Release Version");
            }
            /* install released version that has a pre release version */
            if (this.extension?.hasPreReleaseVersion) {
                return primary ? (0, nls_1.localize)('install', "Install") : (0, nls_1.localize)('install release version', "Install Release Version");
            }
            return (0, nls_1.localize)('install', "Install");
        }
    };
    exports.InstallAction = InstallAction;
    exports.InstallAction = InstallAction = InstallAction_1 = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, extensions_3.IExtensionService),
        __param(4, workbenchThemeService_1.IWorkbenchThemeService),
        __param(5, label_1.ILabelService),
        __param(6, dialogs_1.IDialogService),
        __param(7, preferences_1.IPreferencesService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, workspace_1.IWorkspaceContextService)
    ], InstallAction);
    let InstallDropdownAction = class InstallDropdownAction extends ActionWithDropDownAction {
        set manifest(manifest) {
            this.extensionActions.forEach(a => a.manifest = manifest);
            this.update();
        }
        constructor(instantiationService, extensionsWorkbenchService) {
            super(`extensions.installActions`, '', [
                [
                    instantiationService.createInstance(InstallAction, { installPreReleaseVersion: extensionsWorkbenchService.preferPreReleases }),
                    instantiationService.createInstance(InstallAction, { installPreReleaseVersion: !extensionsWorkbenchService.preferPreReleases }),
                ]
            ]);
        }
        getLabel(action) {
            return action.getLabel(true);
        }
    };
    exports.InstallDropdownAction = InstallDropdownAction;
    exports.InstallDropdownAction = InstallDropdownAction = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensions_1.IExtensionsWorkbenchService)
    ], InstallDropdownAction);
    class InstallingLabelAction extends ExtensionAction {
        static { this.LABEL = (0, nls_1.localize)('installing', "Installing"); }
        static { this.CLASS = `${ExtensionAction.LABEL_ACTION_CLASS} install installing`; }
        constructor() {
            super('extension.installing', InstallingLabelAction.LABEL, InstallingLabelAction.CLASS, false);
        }
        update() {
            this.class = `${InstallingLabelAction.CLASS}${this.extension && this.extension.state === 0 /* ExtensionState.Installing */ ? '' : ' hide'}`;
        }
    }
    exports.InstallingLabelAction = InstallingLabelAction;
    let InstallInOtherServerAction = class InstallInOtherServerAction extends ExtensionAction {
        static { InstallInOtherServerAction_1 = this; }
        static { this.INSTALL_LABEL = (0, nls_1.localize)('install', "Install"); }
        static { this.INSTALLING_LABEL = (0, nls_1.localize)('installing', "Installing"); }
        static { this.Class = `${ExtensionAction.LABEL_ACTION_CLASS} prominent install`; }
        static { this.InstallingClass = `${ExtensionAction.LABEL_ACTION_CLASS} install installing`; }
        constructor(id, server, canInstallAnyWhere, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService) {
            super(id, InstallInOtherServerAction_1.INSTALL_LABEL, InstallInOtherServerAction_1.Class, false);
            this.server = server;
            this.canInstallAnyWhere = canInstallAnyWhere;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.updateWhenCounterExtensionChanges = true;
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = InstallInOtherServerAction_1.Class;
            if (this.canInstall()) {
                const extensionInOtherServer = this.extensionsWorkbenchService.installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.extension.identifier) && e.server === this.server)[0];
                if (extensionInOtherServer) {
                    // Getting installed in other server
                    if (extensionInOtherServer.state === 0 /* ExtensionState.Installing */ && !extensionInOtherServer.local) {
                        this.enabled = true;
                        this.label = InstallInOtherServerAction_1.INSTALLING_LABEL;
                        this.class = InstallInOtherServerAction_1.InstallingClass;
                    }
                }
                else {
                    // Not installed in other server
                    this.enabled = true;
                    this.label = this.getInstallLabel();
                }
            }
        }
        canInstall() {
            // Disable if extension is not installed or not an user extension
            if (!this.extension
                || !this.server
                || !this.extension.local
                || this.extension.state !== 1 /* ExtensionState.Installed */
                || this.extension.type !== 1 /* ExtensionType.User */
                || this.extension.enablementState === 2 /* EnablementState.DisabledByEnvironment */ || this.extension.enablementState === 0 /* EnablementState.DisabledByTrustRequirement */ || this.extension.enablementState === 4 /* EnablementState.DisabledByVirtualWorkspace */) {
                return false;
            }
            if ((0, extensions_2.isLanguagePackExtension)(this.extension.local.manifest)) {
                return true;
            }
            // Prefers to run on UI
            if (this.server === this.extensionManagementServerService.localExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnUI(this.extension.local.manifest)) {
                return true;
            }
            // Prefers to run on Workspace
            if (this.server === this.extensionManagementServerService.remoteExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(this.extension.local.manifest)) {
                return true;
            }
            // Prefers to run on Web
            if (this.server === this.extensionManagementServerService.webExtensionManagementServer && this.extensionManifestPropertiesService.prefersExecuteOnWeb(this.extension.local.manifest)) {
                return true;
            }
            if (this.canInstallAnyWhere) {
                // Can run on UI
                if (this.server === this.extensionManagementServerService.localExtensionManagementServer && this.extensionManifestPropertiesService.canExecuteOnUI(this.extension.local.manifest)) {
                    return true;
                }
                // Can run on Workspace
                if (this.server === this.extensionManagementServerService.remoteExtensionManagementServer && this.extensionManifestPropertiesService.canExecuteOnWorkspace(this.extension.local.manifest)) {
                    return true;
                }
            }
            return false;
        }
        async run() {
            if (!this.extension?.local) {
                return;
            }
            if (!this.extension?.server) {
                return;
            }
            if (!this.server) {
                return;
            }
            this.extensionsWorkbenchService.open(this.extension);
            (0, aria_1.alert)((0, nls_1.localize)('installExtensionStart', "Installing extension {0} started. An editor is now open with more details on this extension", this.extension.displayName));
            return this.extensionsWorkbenchService.installInServer(this.extension, this.server);
        }
    };
    exports.InstallInOtherServerAction = InstallInOtherServerAction;
    exports.InstallInOtherServerAction = InstallInOtherServerAction = InstallInOtherServerAction_1 = __decorate([
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, extensionManagement_2.IExtensionManagementServerService),
        __param(5, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], InstallInOtherServerAction);
    let RemoteInstallAction = class RemoteInstallAction extends InstallInOtherServerAction {
        constructor(canInstallAnyWhere, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService) {
            super(`extensions.remoteinstall`, extensionManagementServerService.remoteExtensionManagementServer, canInstallAnyWhere, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService);
        }
        getInstallLabel() {
            return this.extensionManagementServerService.remoteExtensionManagementServer
                ? (0, nls_1.localize)({ key: 'install in remote', comment: ['This is the name of the action to install an extension in remote server. Placeholder is for the name of remote server.'] }, "Install in {0}", this.extensionManagementServerService.remoteExtensionManagementServer.label)
                : InstallInOtherServerAction.INSTALL_LABEL;
        }
    };
    exports.RemoteInstallAction = RemoteInstallAction;
    exports.RemoteInstallAction = RemoteInstallAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, extensionManagement_2.IExtensionManagementServerService),
        __param(3, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], RemoteInstallAction);
    let LocalInstallAction = class LocalInstallAction extends InstallInOtherServerAction {
        constructor(extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService) {
            super(`extensions.localinstall`, extensionManagementServerService.localExtensionManagementServer, false, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService);
        }
        getInstallLabel() {
            return (0, nls_1.localize)('install locally', "Install Locally");
        }
    };
    exports.LocalInstallAction = LocalInstallAction;
    exports.LocalInstallAction = LocalInstallAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], LocalInstallAction);
    let WebInstallAction = class WebInstallAction extends InstallInOtherServerAction {
        constructor(extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService) {
            super(`extensions.webInstall`, extensionManagementServerService.webExtensionManagementServer, false, extensionsWorkbenchService, extensionManagementServerService, extensionManifestPropertiesService);
        }
        getInstallLabel() {
            return (0, nls_1.localize)('install browser', "Install in Browser");
        }
    };
    exports.WebInstallAction = WebInstallAction;
    exports.WebInstallAction = WebInstallAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], WebInstallAction);
    let UninstallAction = class UninstallAction extends ExtensionAction {
        static { UninstallAction_1 = this; }
        static { this.UninstallLabel = (0, nls_1.localize)('uninstallAction', "Uninstall"); }
        static { this.UninstallingLabel = (0, nls_1.localize)('Uninstalling', "Uninstalling"); }
        static { this.UninstallClass = `${ExtensionAction.LABEL_ACTION_CLASS} uninstall`; }
        static { this.UnInstallingClass = `${ExtensionAction.LABEL_ACTION_CLASS} uninstall uninstalling`; }
        constructor(extensionsWorkbenchService, dialogService) {
            super('extensions.uninstall', UninstallAction_1.UninstallLabel, UninstallAction_1.UninstallClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.dialogService = dialogService;
            this.update();
        }
        update() {
            if (!this.extension) {
                this.enabled = false;
                return;
            }
            const state = this.extension.state;
            if (state === 2 /* ExtensionState.Uninstalling */) {
                this.label = UninstallAction_1.UninstallingLabel;
                this.class = UninstallAction_1.UnInstallingClass;
                this.enabled = false;
                return;
            }
            this.label = UninstallAction_1.UninstallLabel;
            this.class = UninstallAction_1.UninstallClass;
            this.tooltip = UninstallAction_1.UninstallLabel;
            if (state !== 1 /* ExtensionState.Installed */) {
                this.enabled = false;
                return;
            }
            if (this.extension.isBuiltin) {
                this.enabled = false;
                return;
            }
            this.enabled = true;
        }
        async run() {
            if (!this.extension) {
                return;
            }
            (0, aria_1.alert)((0, nls_1.localize)('uninstallExtensionStart', "Uninstalling extension {0} started.", this.extension.displayName));
            try {
                await this.extensionsWorkbenchService.uninstall(this.extension);
                (0, aria_1.alert)((0, nls_1.localize)('uninstallExtensionComplete', "Please reload Visual Studio Code to complete the uninstallation of the extension {0}.", this.extension.displayName));
            }
            catch (error) {
                this.dialogService.error((0, errors_1.getErrorMessage)(error));
            }
        }
    };
    exports.UninstallAction = UninstallAction;
    exports.UninstallAction = UninstallAction = UninstallAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, dialogs_1.IDialogService)
    ], UninstallAction);
    class AbstractUpdateAction extends ExtensionAction {
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} prominent update`; }
        static { this.DisabledClass = `${AbstractUpdateAction.EnabledClass} disabled`; }
        constructor(id, label, extensionsWorkbenchService) {
            super(id, label, AbstractUpdateAction.DisabledClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.updateThrottler = new async_1.Throttler();
            this.update();
        }
        update() {
            this.updateThrottler.queue(() => this.computeAndUpdateEnablement());
        }
        async computeAndUpdateEnablement() {
            this.enabled = false;
            this.class = UpdateAction.DisabledClass;
            if (!this.extension) {
                return;
            }
            if (this.extension.deprecationInfo) {
                return;
            }
            const canInstall = await this.extensionsWorkbenchService.canInstall(this.extension);
            const isInstalled = this.extension.state === 1 /* ExtensionState.Installed */;
            this.enabled = canInstall && isInstalled && this.extension.outdated;
            this.class = this.enabled ? AbstractUpdateAction.EnabledClass : AbstractUpdateAction.DisabledClass;
        }
    }
    let UpdateAction = class UpdateAction extends AbstractUpdateAction {
        constructor(verbose, extensionsWorkbenchService, instantiationService) {
            super(`extensions.update`, (0, nls_1.localize)('update', "Update"), extensionsWorkbenchService);
            this.verbose = verbose;
            this.instantiationService = instantiationService;
        }
        update() {
            super.update();
            if (this.extension) {
                this.label = this.verbose ? (0, nls_1.localize)('update to', "Update to v{0}", this.extension.latestVersion) : (0, nls_1.localize)('update', "Update");
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            (0, aria_1.alert)((0, nls_1.localize)('updateExtensionStart', "Updating extension {0} to version {1} started.", this.extension.displayName, this.extension.latestVersion));
            return this.install(this.extension);
        }
        async install(extension) {
            try {
                await this.extensionsWorkbenchService.install(extension, extension.local?.preRelease ? { installPreReleaseVersion: true } : undefined);
                (0, aria_1.alert)((0, nls_1.localize)('updateExtensionComplete', "Updating extension {0} to version {1} completed.", extension.displayName, extension.latestVersion));
            }
            catch (err) {
                this.instantiationService.createInstance(PromptExtensionInstallFailureAction, extension, extension.latestVersion, 3 /* InstallOperation.Update */, err).run();
            }
        }
    };
    exports.UpdateAction = UpdateAction;
    exports.UpdateAction = UpdateAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, instantiation_1.IInstantiationService)
    ], UpdateAction);
    let ToggleAutoUpdateForExtensionAction = class ToggleAutoUpdateForExtensionAction extends ExtensionAction {
        static { ToggleAutoUpdateForExtensionAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.toggleAutoUpdateForExtension'; }
        static { this.LABEL = (0, nls_1.localize2)('enableAutoUpdateLabel', "Auto Update"); }
        static { this.EnabledClass = `${ExtensionAction.EXTENSION_ACTION_CLASS} auto-update`; }
        static { this.DisabledClass = `${ToggleAutoUpdateForExtensionAction_1.EnabledClass} hide`; }
        constructor(enableWhenOutdated, enableWhenAutoUpdateValue, extensionsWorkbenchService, configurationService) {
            super(ToggleAutoUpdateForExtensionAction_1.ID, ToggleAutoUpdateForExtensionAction_1.LABEL.value, ToggleAutoUpdateForExtensionAction_1.DisabledClass);
            this.enableWhenOutdated = enableWhenOutdated;
            this.enableWhenAutoUpdateValue = enableWhenAutoUpdateValue;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(extensions_1.AutoUpdateConfigurationKey)) {
                    this.update();
                }
            }));
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = ToggleAutoUpdateForExtensionAction_1.DisabledClass;
            if (!this.extension) {
                return;
            }
            if (this.extension.isBuiltin) {
                return;
            }
            if (this.enableWhenOutdated && (this.extension.state !== 1 /* ExtensionState.Installed */ || !this.extension.outdated)) {
                return;
            }
            if (!this.enableWhenAutoUpdateValue.includes(this.extensionsWorkbenchService.getAutoUpdateValue())) {
                return;
            }
            this.enabled = true;
            this.class = ToggleAutoUpdateForExtensionAction_1.EnabledClass;
            this.checked = this.extensionsWorkbenchService.isAutoUpdateEnabledFor(this.extension);
        }
        async run() {
            if (!this.extension) {
                return;
            }
            const enableAutoUpdate = !this.extensionsWorkbenchService.isAutoUpdateEnabledFor(this.extension);
            await this.extensionsWorkbenchService.updateAutoUpdateEnablementFor(this.extension, enableAutoUpdate);
            if (enableAutoUpdate) {
                (0, aria_1.alert)((0, nls_1.localize)('enableAutoUpdate', "Enabled auto updates for", this.extension.displayName));
            }
            else {
                (0, aria_1.alert)((0, nls_1.localize)('disableAutoUpdate', "Disabled auto updates for", this.extension.displayName));
            }
        }
    };
    exports.ToggleAutoUpdateForExtensionAction = ToggleAutoUpdateForExtensionAction;
    exports.ToggleAutoUpdateForExtensionAction = ToggleAutoUpdateForExtensionAction = ToggleAutoUpdateForExtensionAction_1 = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, configuration_1.IConfigurationService)
    ], ToggleAutoUpdateForExtensionAction);
    let ToggleAutoUpdatesForPublisherAction = class ToggleAutoUpdatesForPublisherAction extends ExtensionAction {
        static { ToggleAutoUpdatesForPublisherAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.toggleAutoUpdatesForPublisher'; }
        static { this.LABEL = (0, nls_1.localize)('toggleAutoUpdatesForPublisherLabel', "Auto Update All (From Publisher)"); }
        constructor(extensionsWorkbenchService) {
            super(ToggleAutoUpdatesForPublisherAction_1.ID, ToggleAutoUpdatesForPublisherAction_1.LABEL);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
        }
        update() { }
        async run() {
            if (!this.extension) {
                return;
            }
            (0, aria_1.alert)((0, nls_1.localize)('ignoreExtensionUpdatePublisher', "Ignoring updates published by {0}.", this.extension.publisherDisplayName));
            const enableAutoUpdate = !this.extensionsWorkbenchService.isAutoUpdateEnabledFor(this.extension.publisher);
            await this.extensionsWorkbenchService.updateAutoUpdateEnablementFor(this.extension.publisher, enableAutoUpdate);
            if (enableAutoUpdate) {
                (0, aria_1.alert)((0, nls_1.localize)('enableAutoUpdate', "Enabled auto updates for", this.extension.displayName));
            }
            else {
                (0, aria_1.alert)((0, nls_1.localize)('disableAutoUpdate', "Disabled auto updates for", this.extension.displayName));
            }
        }
    };
    exports.ToggleAutoUpdatesForPublisherAction = ToggleAutoUpdatesForPublisherAction;
    exports.ToggleAutoUpdatesForPublisherAction = ToggleAutoUpdatesForPublisherAction = ToggleAutoUpdatesForPublisherAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService)
    ], ToggleAutoUpdatesForPublisherAction);
    let MigrateDeprecatedExtensionAction = class MigrateDeprecatedExtensionAction extends ExtensionAction {
        static { MigrateDeprecatedExtensionAction_1 = this; }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} migrate`; }
        static { this.DisabledClass = `${MigrateDeprecatedExtensionAction_1.EnabledClass} disabled`; }
        constructor(small, extensionsWorkbenchService) {
            super('extensionsAction.migrateDeprecatedExtension', (0, nls_1.localize)('migrateExtension', "Migrate"), MigrateDeprecatedExtensionAction_1.DisabledClass, false);
            this.small = small;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = MigrateDeprecatedExtensionAction_1.DisabledClass;
            if (!this.extension?.local) {
                return;
            }
            if (this.extension.state !== 1 /* ExtensionState.Installed */) {
                return;
            }
            if (!this.extension.deprecationInfo?.extension) {
                return;
            }
            const id = this.extension.deprecationInfo.extension.id;
            if (this.extensionsWorkbenchService.local.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }))) {
                return;
            }
            this.enabled = true;
            this.class = MigrateDeprecatedExtensionAction_1.EnabledClass;
            this.tooltip = (0, nls_1.localize)('migrate to', "Migrate to {0}", this.extension.deprecationInfo.extension.displayName);
            this.label = this.small ? (0, nls_1.localize)('migrate', "Migrate") : this.tooltip;
        }
        async run() {
            if (!this.extension?.deprecationInfo?.extension) {
                return;
            }
            const local = this.extension.local;
            await this.extensionsWorkbenchService.uninstall(this.extension);
            const [extension] = await this.extensionsWorkbenchService.getExtensions([{ id: this.extension.deprecationInfo.extension.id, preRelease: this.extension.deprecationInfo?.extension?.preRelease }], cancellation_1.CancellationToken.None);
            await this.extensionsWorkbenchService.install(extension, { isMachineScoped: local?.isMachineScoped });
        }
    };
    exports.MigrateDeprecatedExtensionAction = MigrateDeprecatedExtensionAction;
    exports.MigrateDeprecatedExtensionAction = MigrateDeprecatedExtensionAction = MigrateDeprecatedExtensionAction_1 = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService)
    ], MigrateDeprecatedExtensionAction);
    class ExtensionActionWithDropdownActionViewItem extends dropdownActionViewItem_1.ActionWithDropdownActionViewItem {
        constructor(action, options, contextMenuProvider) {
            super(null, action, options, contextMenuProvider);
        }
        render(container) {
            super.render(container);
            this.updateClass();
        }
        updateClass() {
            super.updateClass();
            if (this.element && this.dropdownMenuActionViewItem && this.dropdownMenuActionViewItem.element) {
                this.element.classList.toggle('empty', this._action.menuActions.length === 0);
                this.dropdownMenuActionViewItem.element.classList.toggle('hide', this._action.menuActions.length === 0);
            }
        }
    }
    exports.ExtensionActionWithDropdownActionViewItem = ExtensionActionWithDropdownActionViewItem;
    let ExtensionDropDownAction = class ExtensionDropDownAction extends ExtensionAction {
        constructor(id, label, cssClass, enabled, instantiationService) {
            super(id, label, cssClass, enabled);
            this.instantiationService = instantiationService;
            this._actionViewItem = null;
        }
        createActionViewItem(options) {
            this._actionViewItem = this.instantiationService.createInstance(DropDownMenuActionViewItem, this, options);
            return this._actionViewItem;
        }
        run({ actionGroups, disposeActionsOnHide }) {
            this._actionViewItem?.showMenu(actionGroups, disposeActionsOnHide);
            return Promise.resolve();
        }
    };
    exports.ExtensionDropDownAction = ExtensionDropDownAction;
    exports.ExtensionDropDownAction = ExtensionDropDownAction = __decorate([
        __param(4, instantiation_1.IInstantiationService)
    ], ExtensionDropDownAction);
    let DropDownMenuActionViewItem = class DropDownMenuActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(action, options, contextMenuService) {
            super(null, action, { ...options, icon: true, label: true });
            this.contextMenuService = contextMenuService;
        }
        showMenu(menuActionGroups, disposeActionsOnHide) {
            if (this.element) {
                const actions = this.getActions(menuActionGroups);
                const elementPosition = DOM.getDomNodePagePosition(this.element);
                const anchor = { x: elementPosition.left, y: elementPosition.top + elementPosition.height + 10 };
                this.contextMenuService.showContextMenu({
                    getAnchor: () => anchor,
                    getActions: () => actions,
                    actionRunner: this.actionRunner,
                    onHide: () => { if (disposeActionsOnHide) {
                        (0, lifecycle_1.disposeIfDisposable)(actions);
                    } }
                });
            }
        }
        getActions(menuActionGroups) {
            let actions = [];
            for (const menuActions of menuActionGroups) {
                actions = [...actions, ...menuActions, new actions_1.Separator()];
            }
            return actions.length ? actions.slice(0, actions.length - 1) : actions;
        }
    };
    exports.DropDownMenuActionViewItem = DropDownMenuActionViewItem;
    exports.DropDownMenuActionViewItem = DropDownMenuActionViewItem = __decorate([
        __param(2, contextView_1.IContextMenuService)
    ], DropDownMenuActionViewItem);
    async function getContextMenuActionsGroups(extension, contextKeyService, instantiationService) {
        return instantiationService.invokeFunction(async (accessor) => {
            const extensionsWorkbenchService = accessor.get(extensions_1.IExtensionsWorkbenchService);
            const menuService = accessor.get(actions_2.IMenuService);
            const extensionRecommendationsService = accessor.get(extensionRecommendations_1.IExtensionRecommendationsService);
            const extensionIgnoredRecommendationsService = accessor.get(extensionRecommendations_1.IExtensionIgnoredRecommendationsService);
            const workbenchThemeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const cksOverlay = [];
            if (extension) {
                cksOverlay.push(['extension', extension.identifier.id]);
                cksOverlay.push(['isBuiltinExtension', extension.isBuiltin]);
                cksOverlay.push(['isDefaultApplicationScopedExtension', extension.local && (0, extensions_2.isApplicationScopedExtension)(extension.local.manifest)]);
                cksOverlay.push(['isApplicationScopedExtension', extension.local && extension.local.isApplicationScoped]);
                cksOverlay.push(['isWorkspaceScopedExtension', extension.isWorkspaceScoped]);
                if (extension.local) {
                    cksOverlay.push(['extensionSource', extension.local.source]);
                }
                cksOverlay.push(['extensionHasConfiguration', extension.local && !!extension.local.manifest.contributes && !!extension.local.manifest.contributes.configuration]);
                cksOverlay.push(['extensionHasKeybindings', extension.local && !!extension.local.manifest.contributes && !!extension.local.manifest.contributes.keybindings]);
                cksOverlay.push(['extensionHasCommands', extension.local && !!extension.local.manifest.contributes && !!extension.local.manifest.contributes?.commands]);
                cksOverlay.push(['isExtensionRecommended', !!extensionRecommendationsService.getAllRecommendationsWithReason()[extension.identifier.id.toLowerCase()]]);
                cksOverlay.push(['isExtensionWorkspaceRecommended', extensionRecommendationsService.getAllRecommendationsWithReason()[extension.identifier.id.toLowerCase()]?.reasonId === 0 /* ExtensionRecommendationReason.Workspace */]);
                cksOverlay.push(['isUserIgnoredRecommendation', extensionIgnoredRecommendationsService.globalIgnoredRecommendations.some(e => e === extension.identifier.id.toLowerCase())]);
                if (extension.state === 1 /* ExtensionState.Installed */) {
                    cksOverlay.push(['extensionStatus', 'installed']);
                }
                cksOverlay.push(['installedExtensionIsPreReleaseVersion', !!extension.local?.isPreReleaseVersion]);
                cksOverlay.push(['installedExtensionIsOptedToPreRelease', !!extension.local?.preRelease]);
                cksOverlay.push(['galleryExtensionIsPreReleaseVersion', !!extension.gallery?.properties.isPreReleaseVersion]);
                cksOverlay.push(['galleryExtensionHasPreReleaseVersion', extension.gallery?.hasPreReleaseVersion]);
                cksOverlay.push(['extensionHasReleaseVersion', extension.hasReleaseVersion]);
                const [colorThemes, fileIconThemes, productIconThemes] = await Promise.all([workbenchThemeService.getColorThemes(), workbenchThemeService.getFileIconThemes(), workbenchThemeService.getProductIconThemes()]);
                cksOverlay.push(['extensionHasColorThemes', colorThemes.some(theme => isThemeFromExtension(theme, extension))]);
                cksOverlay.push(['extensionHasFileIconThemes', fileIconThemes.some(theme => isThemeFromExtension(theme, extension))]);
                cksOverlay.push(['extensionHasProductIconThemes', productIconThemes.some(theme => isThemeFromExtension(theme, extension))]);
                cksOverlay.push(['canSetLanguage', extensionsWorkbenchService.canSetLanguage(extension)]);
                cksOverlay.push(['isActiveLanguagePackExtension', extension.gallery && platform_1.language === (0, languagePacks_1.getLocale)(extension.gallery)]);
            }
            const menu = menuService.createMenu(actions_2.MenuId.ExtensionContext, contextKeyService.createOverlay(cksOverlay));
            const actionsGroups = menu.getActions({ shouldForwardArgs: true });
            menu.dispose();
            return actionsGroups;
        });
    }
    function toActions(actionsGroups, instantiationService) {
        const result = [];
        for (const [, actions] of actionsGroups) {
            result.push(actions.map(action => {
                if (action instanceof actions_1.SubmenuAction) {
                    return action;
                }
                return instantiationService.createInstance(MenuItemExtensionAction, action);
            }));
        }
        return result;
    }
    async function getContextMenuActions(extension, contextKeyService, instantiationService) {
        const actionsGroups = await getContextMenuActionsGroups(extension, contextKeyService, instantiationService);
        return toActions(actionsGroups, instantiationService);
    }
    let ManageExtensionAction = class ManageExtensionAction extends ExtensionDropDownAction {
        static { ManageExtensionAction_1 = this; }
        static { this.ID = 'extensions.manage'; }
        static { this.Class = `${ExtensionAction.ICON_ACTION_CLASS} manage ` + themables_1.ThemeIcon.asClassName(extensionsIcons_1.manageExtensionIcon); }
        static { this.HideManageExtensionClass = `${ManageExtensionAction_1.Class} hide`; }
        constructor(instantiationService, extensionService, contextKeyService) {
            super(ManageExtensionAction_1.ID, '', '', true, instantiationService);
            this.extensionService = extensionService;
            this.contextKeyService = contextKeyService;
            this.tooltip = (0, nls_1.localize)('manage', "Manage");
            this.update();
        }
        async getActionGroups() {
            const groups = [];
            const contextMenuActionsGroups = await getContextMenuActionsGroups(this.extension, this.contextKeyService, this.instantiationService);
            const themeActions = [], installActions = [], updateActions = [], otherActionGroups = [];
            for (const [group, actions] of contextMenuActionsGroups) {
                if (group === extensions_1.INSTALL_ACTIONS_GROUP) {
                    installActions.push(...toActions([[group, actions]], this.instantiationService)[0]);
                }
                else if (group === extensions_1.UPDATE_ACTIONS_GROUP) {
                    updateActions.push(...toActions([[group, actions]], this.instantiationService)[0]);
                }
                else if (group === extensions_1.THEME_ACTIONS_GROUP) {
                    themeActions.push(...toActions([[group, actions]], this.instantiationService)[0]);
                }
                else {
                    otherActionGroups.push(...toActions([[group, actions]], this.instantiationService));
                }
            }
            if (themeActions.length) {
                groups.push(themeActions);
            }
            groups.push([
                this.instantiationService.createInstance(EnableGloballyAction),
                this.instantiationService.createInstance(EnableForWorkspaceAction)
            ]);
            groups.push([
                this.instantiationService.createInstance(DisableGloballyAction),
                this.instantiationService.createInstance(DisableForWorkspaceAction)
            ]);
            if (updateActions.length) {
                groups.push(updateActions);
            }
            groups.push([
                ...(installActions.length ? installActions : []),
                this.instantiationService.createInstance(InstallAnotherVersionAction),
                this.instantiationService.createInstance(UninstallAction),
            ]);
            otherActionGroups.forEach(actions => groups.push(actions));
            groups.forEach(group => group.forEach(extensionAction => {
                if (extensionAction instanceof ExtensionAction) {
                    extensionAction.extension = this.extension;
                }
            }));
            return groups;
        }
        async run() {
            await this.extensionService.whenInstalledExtensionsRegistered();
            return super.run({ actionGroups: await this.getActionGroups(), disposeActionsOnHide: true });
        }
        update() {
            this.class = ManageExtensionAction_1.HideManageExtensionClass;
            this.enabled = false;
            if (this.extension) {
                const state = this.extension.state;
                this.enabled = state === 1 /* ExtensionState.Installed */;
                this.class = this.enabled || state === 2 /* ExtensionState.Uninstalling */ ? ManageExtensionAction_1.Class : ManageExtensionAction_1.HideManageExtensionClass;
            }
        }
    };
    exports.ManageExtensionAction = ManageExtensionAction;
    exports.ManageExtensionAction = ManageExtensionAction = ManageExtensionAction_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensions_3.IExtensionService),
        __param(2, contextkey_1.IContextKeyService)
    ], ManageExtensionAction);
    class ExtensionEditorManageExtensionAction extends ExtensionDropDownAction {
        constructor(contextKeyService, instantiationService) {
            super('extensionEditor.manageExtension', '', `${ExtensionAction.ICON_ACTION_CLASS} manage ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.manageExtensionIcon)}`, true, instantiationService);
            this.contextKeyService = contextKeyService;
            this.tooltip = (0, nls_1.localize)('manage', "Manage");
        }
        update() { }
        async run() {
            const actionGroups = [];
            (await getContextMenuActions(this.extension, this.contextKeyService, this.instantiationService)).forEach(actions => actionGroups.push(actions));
            actionGroups.forEach(group => group.forEach(extensionAction => {
                if (extensionAction instanceof ExtensionAction) {
                    extensionAction.extension = this.extension;
                }
            }));
            return super.run({ actionGroups, disposeActionsOnHide: true });
        }
    }
    exports.ExtensionEditorManageExtensionAction = ExtensionEditorManageExtensionAction;
    let MenuItemExtensionAction = class MenuItemExtensionAction extends ExtensionAction {
        constructor(action, extensionsWorkbenchService) {
            super(action.id, action.label);
            this.action = action;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
        }
        update() {
            if (!this.extension) {
                return;
            }
            if (this.action.id === extensions_1.TOGGLE_IGNORE_EXTENSION_ACTION_ID) {
                this.checked = !this.extensionsWorkbenchService.isExtensionIgnoredToSync(this.extension);
            }
            else if (this.action.id === ToggleAutoUpdateForExtensionAction.ID) {
                this.checked = this.extensionsWorkbenchService.isAutoUpdateEnabledFor(this.extension);
            }
            else if (this.action.id === ToggleAutoUpdatesForPublisherAction.ID) {
                this.checked = this.extensionsWorkbenchService.isAutoUpdateEnabledFor(this.extension.publisher);
            }
            else {
                this.checked = this.action.checked;
            }
        }
        async run() {
            if (this.extension) {
                await this.action.run(this.extension.local ? (0, extensionManagementUtil_1.getExtensionId)(this.extension.local.manifest.publisher, this.extension.local.manifest.name)
                    : this.extension.gallery ? (0, extensionManagementUtil_1.getExtensionId)(this.extension.gallery.publisher, this.extension.gallery.name)
                        : this.extension.identifier.id);
            }
        }
    };
    exports.MenuItemExtensionAction = MenuItemExtensionAction;
    exports.MenuItemExtensionAction = MenuItemExtensionAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService)
    ], MenuItemExtensionAction);
    let TogglePreReleaseExtensionAction = class TogglePreReleaseExtensionAction extends ExtensionAction {
        static { TogglePreReleaseExtensionAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.togglePreRlease'; }
        static { this.LABEL = (0, nls_1.localize)('togglePreRleaseLabel', "Pre-Release"); }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} pre-release`; }
        static { this.DisabledClass = `${TogglePreReleaseExtensionAction_1.EnabledClass} hide`; }
        constructor(extensionsWorkbenchService) {
            super(TogglePreReleaseExtensionAction_1.ID, TogglePreReleaseExtensionAction_1.LABEL, TogglePreReleaseExtensionAction_1.DisabledClass);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = TogglePreReleaseExtensionAction_1.DisabledClass;
            if (!this.extension) {
                return;
            }
            if (this.extension.isBuiltin) {
                return;
            }
            if (this.extension.state !== 1 /* ExtensionState.Installed */) {
                return;
            }
            if (!this.extension.hasPreReleaseVersion) {
                return;
            }
            if (!this.extension.gallery) {
                return;
            }
            if (this.extension.preRelease && !this.extension.isPreReleaseVersion) {
                return;
            }
            if (!this.extension.preRelease && !this.extension.gallery.hasPreReleaseVersion) {
                return;
            }
            this.enabled = true;
            this.class = TogglePreReleaseExtensionAction_1.EnabledClass;
            if (this.extension.preRelease) {
                this.label = (0, nls_1.localize)('togglePreRleaseDisableLabel', "Switch to Release Version");
                this.tooltip = (0, nls_1.localize)('togglePreRleaseDisableTooltip', "This will switch and enable updates to release versions");
            }
            else {
                this.label = (0, nls_1.localize)('switchToPreReleaseLabel', "Switch to Pre-Release Version");
                this.tooltip = (0, nls_1.localize)('switchToPreReleaseTooltip', "This will switch to pre-release version and enable updates to latest version always");
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            this.extensionsWorkbenchService.open(this.extension, { showPreReleaseVersion: !this.extension.preRelease });
            await this.extensionsWorkbenchService.togglePreRelease(this.extension);
        }
    };
    exports.TogglePreReleaseExtensionAction = TogglePreReleaseExtensionAction;
    exports.TogglePreReleaseExtensionAction = TogglePreReleaseExtensionAction = TogglePreReleaseExtensionAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService)
    ], TogglePreReleaseExtensionAction);
    let InstallAnotherVersionAction = class InstallAnotherVersionAction extends ExtensionAction {
        static { InstallAnotherVersionAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.install.anotherVersion'; }
        static { this.LABEL = (0, nls_1.localize)('install another version', "Install Another Version..."); }
        constructor(extensionsWorkbenchService, extensionGalleryService, quickInputService, instantiationService, dialogService) {
            super(InstallAnotherVersionAction_1.ID, InstallAnotherVersionAction_1.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionGalleryService = extensionGalleryService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.dialogService = dialogService;
            this.update();
        }
        update() {
            this.enabled = !!this.extension && !this.extension.isBuiltin && !!this.extension.gallery && !!this.extension.local && !!this.extension.server && this.extension.state === 1 /* ExtensionState.Installed */ && !this.extension.deprecationInfo;
        }
        async run() {
            if (!this.enabled) {
                return;
            }
            const targetPlatform = await this.extension.server.extensionManagementService.getTargetPlatform();
            const allVersions = await this.extensionGalleryService.getAllCompatibleVersions(this.extension.gallery, this.extension.local.preRelease, targetPlatform);
            if (!allVersions.length) {
                await this.dialogService.info((0, nls_1.localize)('no versions', "This extension has no other versions."));
                return;
            }
            const picks = allVersions.map((v, i) => {
                return {
                    id: v.version,
                    label: v.version,
                    description: `${(0, date_1.fromNow)(new Date(Date.parse(v.date)), true)}${v.isPreReleaseVersion ? ` (${(0, nls_1.localize)('pre-release', "pre-release")})` : ''}${v.version === this.extension.version ? ` (${(0, nls_1.localize)('current', "current")})` : ''}`,
                    latest: i === 0,
                    ariaLabel: `${v.isPreReleaseVersion ? 'Pre-Release version' : 'Release version'} ${v.version}`,
                    isPreReleaseVersion: v.isPreReleaseVersion
                };
            });
            const pick = await this.quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('selectVersion', "Select Version to Install"),
                matchOnDetail: true
            });
            if (pick) {
                if (this.extension.version === pick.id) {
                    return;
                }
                try {
                    if (pick.latest) {
                        const [extension] = pick.id !== this.extension?.version ? await this.extensionsWorkbenchService.getExtensions([{ id: this.extension.identifier.id, preRelease: pick.isPreReleaseVersion }], cancellation_1.CancellationToken.None) : [this.extension];
                        await this.extensionsWorkbenchService.install(extension ?? this.extension, { installPreReleaseVersion: pick.isPreReleaseVersion });
                    }
                    else {
                        await this.extensionsWorkbenchService.install(this.extension, { installPreReleaseVersion: pick.isPreReleaseVersion, version: pick.id });
                    }
                }
                catch (error) {
                    this.instantiationService.createInstance(PromptExtensionInstallFailureAction, this.extension, pick.latest ? this.extension.latestVersion : pick.id, 2 /* InstallOperation.Install */, error).run();
                }
            }
            return null;
        }
    };
    exports.InstallAnotherVersionAction = InstallAnotherVersionAction;
    exports.InstallAnotherVersionAction = InstallAnotherVersionAction = InstallAnotherVersionAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, dialogs_1.IDialogService)
    ], InstallAnotherVersionAction);
    let EnableForWorkspaceAction = class EnableForWorkspaceAction extends ExtensionAction {
        static { EnableForWorkspaceAction_1 = this; }
        static { this.ID = 'extensions.enableForWorkspace'; }
        static { this.LABEL = (0, nls_1.localize)('enableForWorkspaceAction', "Enable (Workspace)"); }
        constructor(extensionsWorkbenchService, extensionEnablementService) {
            super(EnableForWorkspaceAction_1.ID, EnableForWorkspaceAction_1.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.tooltip = (0, nls_1.localize)('enableForWorkspaceActionToolTip', "Enable this extension only in this workspace");
            this.update();
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local && !this.extension.isWorkspaceScoped) {
                this.enabled = this.extension.state === 1 /* ExtensionState.Installed */
                    && !this.extensionEnablementService.isEnabled(this.extension.local)
                    && this.extensionEnablementService.canChangeWorkspaceEnablement(this.extension.local);
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            return this.extensionsWorkbenchService.setEnablement(this.extension, 9 /* EnablementState.EnabledWorkspace */);
        }
    };
    exports.EnableForWorkspaceAction = EnableForWorkspaceAction;
    exports.EnableForWorkspaceAction = EnableForWorkspaceAction = EnableForWorkspaceAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], EnableForWorkspaceAction);
    let EnableGloballyAction = class EnableGloballyAction extends ExtensionAction {
        static { EnableGloballyAction_1 = this; }
        static { this.ID = 'extensions.enableGlobally'; }
        static { this.LABEL = (0, nls_1.localize)('enableGloballyAction', "Enable"); }
        constructor(extensionsWorkbenchService, extensionEnablementService) {
            super(EnableGloballyAction_1.ID, EnableGloballyAction_1.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.tooltip = (0, nls_1.localize)('enableGloballyActionToolTip', "Enable this extension");
            this.update();
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local && !this.extension.isWorkspaceScoped) {
                this.enabled = this.extension.state === 1 /* ExtensionState.Installed */
                    && this.extensionEnablementService.isDisabledGlobally(this.extension.local)
                    && this.extensionEnablementService.canChangeEnablement(this.extension.local);
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            return this.extensionsWorkbenchService.setEnablement(this.extension, 8 /* EnablementState.EnabledGlobally */);
        }
    };
    exports.EnableGloballyAction = EnableGloballyAction;
    exports.EnableGloballyAction = EnableGloballyAction = EnableGloballyAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], EnableGloballyAction);
    let DisableForWorkspaceAction = class DisableForWorkspaceAction extends ExtensionAction {
        static { DisableForWorkspaceAction_1 = this; }
        static { this.ID = 'extensions.disableForWorkspace'; }
        static { this.LABEL = (0, nls_1.localize)('disableForWorkspaceAction', "Disable (Workspace)"); }
        constructor(workspaceContextService, extensionsWorkbenchService, extensionEnablementService, extensionService) {
            super(DisableForWorkspaceAction_1.ID, DisableForWorkspaceAction_1.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.workspaceContextService = workspaceContextService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionService = extensionService;
            this.tooltip = (0, nls_1.localize)('disableForWorkspaceActionToolTip', "Disable this extension only in this workspace");
            this.update();
            this._register(this.extensionService.onDidChangeExtensions(() => this.update()));
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local && !this.extension.isWorkspaceScoped && this.extensionService.extensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier) && this.workspaceContextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */)) {
                this.enabled = this.extension.state === 1 /* ExtensionState.Installed */
                    && (this.extension.enablementState === 8 /* EnablementState.EnabledGlobally */ || this.extension.enablementState === 9 /* EnablementState.EnabledWorkspace */)
                    && this.extensionEnablementService.canChangeWorkspaceEnablement(this.extension.local);
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            return this.extensionsWorkbenchService.setEnablement(this.extension, 7 /* EnablementState.DisabledWorkspace */);
        }
    };
    exports.DisableForWorkspaceAction = DisableForWorkspaceAction;
    exports.DisableForWorkspaceAction = DisableForWorkspaceAction = DisableForWorkspaceAction_1 = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(3, extensions_3.IExtensionService)
    ], DisableForWorkspaceAction);
    let DisableGloballyAction = class DisableGloballyAction extends ExtensionAction {
        static { DisableGloballyAction_1 = this; }
        static { this.ID = 'extensions.disableGlobally'; }
        static { this.LABEL = (0, nls_1.localize)('disableGloballyAction', "Disable"); }
        constructor(extensionsWorkbenchService, extensionEnablementService, extensionService) {
            super(DisableGloballyAction_1.ID, DisableGloballyAction_1.LABEL, ExtensionAction.LABEL_ACTION_CLASS);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionService = extensionService;
            this.tooltip = (0, nls_1.localize)('disableGloballyActionToolTip', "Disable this extension");
            this.update();
            this._register(this.extensionService.onDidChangeExtensions(() => this.update()));
        }
        update() {
            this.enabled = false;
            if (this.extension && this.extension.local && !this.extension.isWorkspaceScoped && this.extensionService.extensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))) {
                this.enabled = this.extension.state === 1 /* ExtensionState.Installed */
                    && (this.extension.enablementState === 8 /* EnablementState.EnabledGlobally */ || this.extension.enablementState === 9 /* EnablementState.EnabledWorkspace */)
                    && this.extensionEnablementService.canChangeEnablement(this.extension.local);
            }
        }
        async run() {
            if (!this.extension) {
                return;
            }
            return this.extensionsWorkbenchService.setEnablement(this.extension, 6 /* EnablementState.DisabledGlobally */);
        }
    };
    exports.DisableGloballyAction = DisableGloballyAction;
    exports.DisableGloballyAction = DisableGloballyAction = DisableGloballyAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(2, extensions_3.IExtensionService)
    ], DisableGloballyAction);
    let EnableDropDownAction = class EnableDropDownAction extends ActionWithDropDownAction {
        constructor(instantiationService) {
            super('extensions.enable', (0, nls_1.localize)('enableAction', "Enable"), [
                [
                    instantiationService.createInstance(EnableGloballyAction),
                    instantiationService.createInstance(EnableForWorkspaceAction)
                ]
            ]);
        }
    };
    exports.EnableDropDownAction = EnableDropDownAction;
    exports.EnableDropDownAction = EnableDropDownAction = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], EnableDropDownAction);
    let DisableDropDownAction = class DisableDropDownAction extends ActionWithDropDownAction {
        constructor(instantiationService) {
            super('extensions.disable', (0, nls_1.localize)('disableAction', "Disable"), [[
                    instantiationService.createInstance(DisableGloballyAction),
                    instantiationService.createInstance(DisableForWorkspaceAction)
                ]]);
        }
    };
    exports.DisableDropDownAction = DisableDropDownAction;
    exports.DisableDropDownAction = DisableDropDownAction = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], DisableDropDownAction);
    let ExtensionRuntimeStateAction = class ExtensionRuntimeStateAction extends ExtensionAction {
        static { ExtensionRuntimeStateAction_1 = this; }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} reload`; }
        static { this.DisabledClass = `${ExtensionRuntimeStateAction_1.EnabledClass} disabled`; }
        constructor(hostService, extensionsWorkbenchService, updateService, extensionService, productService, telemetryService) {
            super('extensions.runtimeState', '', ExtensionRuntimeStateAction_1.DisabledClass, false);
            this.hostService = hostService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.updateService = updateService;
            this.extensionService = extensionService;
            this.productService = productService;
            this.telemetryService = telemetryService;
            this.updateWhenCounterExtensionChanges = true;
            this._register(this.extensionService.onDidChangeExtensions(() => this.update()));
            this.update();
        }
        update() {
            this.enabled = false;
            this.tooltip = '';
            this.class = ExtensionRuntimeStateAction_1.DisabledClass;
            if (!this.extension) {
                return;
            }
            const state = this.extension.state;
            if (state === 0 /* ExtensionState.Installing */ || state === 2 /* ExtensionState.Uninstalling */) {
                return;
            }
            if (this.extension.local && this.extension.local.manifest && this.extension.local.manifest.contributes && this.extension.local.manifest.contributes.localizations && this.extension.local.manifest.contributes.localizations.length > 0) {
                return;
            }
            const runtimeState = this.extension.runtimeState;
            if (!runtimeState) {
                return;
            }
            this.enabled = true;
            this.class = ExtensionRuntimeStateAction_1.EnabledClass;
            this.tooltip = runtimeState.reason;
            this.label = runtimeState.action === "reloadWindow" /* ExtensionRuntimeActionType.ReloadWindow */ ? (0, nls_1.localize)('reload window', 'Reload Window')
                : runtimeState.action === "restartExtensions" /* ExtensionRuntimeActionType.RestartExtensions */ ? (0, nls_1.localize)('restart extensions', 'Restart Extensions')
                    : runtimeState.action === "quitAndInstall" /* ExtensionRuntimeActionType.QuitAndInstall */ ? (0, nls_1.localize)('restart product', 'Restart to Update')
                        : runtimeState.action === "applyUpdate" /* ExtensionRuntimeActionType.ApplyUpdate */ || runtimeState.action === "downloadUpdate" /* ExtensionRuntimeActionType.DownloadUpdate */ ? (0, nls_1.localize)('update product', 'Update {0}', this.productService.nameShort) : '';
        }
        async run() {
            const runtimeState = this.extension?.runtimeState;
            if (!runtimeState?.action) {
                return;
            }
            this.telemetryService.publicLog2('extensions:runtimestate:action', {
                action: runtimeState.action
            });
            if (runtimeState?.action === "reloadWindow" /* ExtensionRuntimeActionType.ReloadWindow */) {
                return this.hostService.reload();
            }
            else if (runtimeState?.action === "restartExtensions" /* ExtensionRuntimeActionType.RestartExtensions */) {
                return this.extensionsWorkbenchService.updateRunningExtensions();
            }
            else if (runtimeState?.action === "downloadUpdate" /* ExtensionRuntimeActionType.DownloadUpdate */) {
                return this.updateService.downloadUpdate();
            }
            else if (runtimeState?.action === "applyUpdate" /* ExtensionRuntimeActionType.ApplyUpdate */) {
                return this.updateService.applyUpdate();
            }
            else if (runtimeState?.action === "quitAndInstall" /* ExtensionRuntimeActionType.QuitAndInstall */) {
                return this.updateService.quitAndInstall();
            }
        }
    };
    exports.ExtensionRuntimeStateAction = ExtensionRuntimeStateAction;
    exports.ExtensionRuntimeStateAction = ExtensionRuntimeStateAction = ExtensionRuntimeStateAction_1 = __decorate([
        __param(0, host_1.IHostService),
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, update_1.IUpdateService),
        __param(3, extensions_3.IExtensionService),
        __param(4, productService_1.IProductService),
        __param(5, telemetry_1.ITelemetryService)
    ], ExtensionRuntimeStateAction);
    function isThemeFromExtension(theme, extension) {
        return !!(extension && theme.extensionData && extensions_2.ExtensionIdentifier.equals(theme.extensionData.extensionId, extension.identifier.id));
    }
    function getQuickPickEntries(themes, currentTheme, extension, showCurrentTheme) {
        const picks = [];
        for (const theme of themes) {
            if (isThemeFromExtension(theme, extension) && !(showCurrentTheme && theme === currentTheme)) {
                picks.push({ label: theme.label, id: theme.id });
            }
        }
        if (showCurrentTheme) {
            picks.push({ type: 'separator', label: (0, nls_1.localize)('current', "current") });
            picks.push({ label: currentTheme.label, id: currentTheme.id });
        }
        return picks;
    }
    let SetColorThemeAction = class SetColorThemeAction extends ExtensionAction {
        static { SetColorThemeAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.setColorTheme'; }
        static { this.TITLE = (0, nls_1.localize2)('workbench.extensions.action.setColorTheme', 'Set Color Theme'); }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} theme`; }
        static { this.DisabledClass = `${SetColorThemeAction_1.EnabledClass} disabled`; }
        constructor(extensionService, workbenchThemeService, quickInputService, extensionEnablementService) {
            super(SetColorThemeAction_1.ID, SetColorThemeAction_1.TITLE.value, SetColorThemeAction_1.DisabledClass, false);
            this.workbenchThemeService = workbenchThemeService;
            this.quickInputService = quickInputService;
            this.extensionEnablementService = extensionEnablementService;
            this._register(event_1.Event.any(extensionService.onDidChangeExtensions, workbenchThemeService.onDidColorThemeChange)(() => this.update(), this));
            this.update();
        }
        update() {
            this.workbenchThemeService.getColorThemes().then(colorThemes => {
                this.enabled = this.computeEnablement(colorThemes);
                this.class = this.enabled ? SetColorThemeAction_1.EnabledClass : SetColorThemeAction_1.DisabledClass;
            });
        }
        computeEnablement(colorThemes) {
            return !!this.extension && this.extension.state === 1 /* ExtensionState.Installed */ && this.extensionEnablementService.isEnabledEnablementState(this.extension.enablementState) && colorThemes.some(th => isThemeFromExtension(th, this.extension));
        }
        async run({ showCurrentTheme, ignoreFocusLost } = { showCurrentTheme: false, ignoreFocusLost: false }) {
            const colorThemes = await this.workbenchThemeService.getColorThemes();
            if (!this.computeEnablement(colorThemes)) {
                return;
            }
            const currentTheme = this.workbenchThemeService.getColorTheme();
            const delayer = new async_1.Delayer(100);
            const picks = getQuickPickEntries(colorThemes, currentTheme, this.extension, showCurrentTheme);
            const pickedTheme = await this.quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('select color theme', "Select Color Theme"),
                onDidFocus: item => delayer.trigger(() => this.workbenchThemeService.setColorTheme(item.id, undefined)),
                ignoreFocusLost
            });
            return this.workbenchThemeService.setColorTheme(pickedTheme ? pickedTheme.id : currentTheme.id, 'auto');
        }
    };
    exports.SetColorThemeAction = SetColorThemeAction;
    exports.SetColorThemeAction = SetColorThemeAction = SetColorThemeAction_1 = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], SetColorThemeAction);
    let SetFileIconThemeAction = class SetFileIconThemeAction extends ExtensionAction {
        static { SetFileIconThemeAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.setFileIconTheme'; }
        static { this.TITLE = (0, nls_1.localize2)('workbench.extensions.action.setFileIconTheme', 'Set File Icon Theme'); }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} theme`; }
        static { this.DisabledClass = `${SetFileIconThemeAction_1.EnabledClass} disabled`; }
        constructor(extensionService, workbenchThemeService, quickInputService, extensionEnablementService) {
            super(SetFileIconThemeAction_1.ID, SetFileIconThemeAction_1.TITLE.value, SetFileIconThemeAction_1.DisabledClass, false);
            this.workbenchThemeService = workbenchThemeService;
            this.quickInputService = quickInputService;
            this.extensionEnablementService = extensionEnablementService;
            this._register(event_1.Event.any(extensionService.onDidChangeExtensions, workbenchThemeService.onDidFileIconThemeChange)(() => this.update(), this));
            this.update();
        }
        update() {
            this.workbenchThemeService.getFileIconThemes().then(fileIconThemes => {
                this.enabled = this.computeEnablement(fileIconThemes);
                this.class = this.enabled ? SetFileIconThemeAction_1.EnabledClass : SetFileIconThemeAction_1.DisabledClass;
            });
        }
        computeEnablement(colorThemfileIconThemess) {
            return !!this.extension && this.extension.state === 1 /* ExtensionState.Installed */ && this.extensionEnablementService.isEnabledEnablementState(this.extension.enablementState) && colorThemfileIconThemess.some(th => isThemeFromExtension(th, this.extension));
        }
        async run({ showCurrentTheme, ignoreFocusLost } = { showCurrentTheme: false, ignoreFocusLost: false }) {
            const fileIconThemes = await this.workbenchThemeService.getFileIconThemes();
            if (!this.computeEnablement(fileIconThemes)) {
                return;
            }
            const currentTheme = this.workbenchThemeService.getFileIconTheme();
            const delayer = new async_1.Delayer(100);
            const picks = getQuickPickEntries(fileIconThemes, currentTheme, this.extension, showCurrentTheme);
            const pickedTheme = await this.quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('select file icon theme', "Select File Icon Theme"),
                onDidFocus: item => delayer.trigger(() => this.workbenchThemeService.setFileIconTheme(item.id, undefined)),
                ignoreFocusLost
            });
            return this.workbenchThemeService.setFileIconTheme(pickedTheme ? pickedTheme.id : currentTheme.id, 'auto');
        }
    };
    exports.SetFileIconThemeAction = SetFileIconThemeAction;
    exports.SetFileIconThemeAction = SetFileIconThemeAction = SetFileIconThemeAction_1 = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], SetFileIconThemeAction);
    let SetProductIconThemeAction = class SetProductIconThemeAction extends ExtensionAction {
        static { SetProductIconThemeAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.setProductIconTheme'; }
        static { this.TITLE = (0, nls_1.localize2)('workbench.extensions.action.setProductIconTheme', 'Set Product Icon Theme'); }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} theme`; }
        static { this.DisabledClass = `${SetProductIconThemeAction_1.EnabledClass} disabled`; }
        constructor(extensionService, workbenchThemeService, quickInputService, extensionEnablementService) {
            super(SetProductIconThemeAction_1.ID, SetProductIconThemeAction_1.TITLE.value, SetProductIconThemeAction_1.DisabledClass, false);
            this.workbenchThemeService = workbenchThemeService;
            this.quickInputService = quickInputService;
            this.extensionEnablementService = extensionEnablementService;
            this._register(event_1.Event.any(extensionService.onDidChangeExtensions, workbenchThemeService.onDidProductIconThemeChange)(() => this.update(), this));
            this.update();
        }
        update() {
            this.workbenchThemeService.getProductIconThemes().then(productIconThemes => {
                this.enabled = this.computeEnablement(productIconThemes);
                this.class = this.enabled ? SetProductIconThemeAction_1.EnabledClass : SetProductIconThemeAction_1.DisabledClass;
            });
        }
        computeEnablement(productIconThemes) {
            return !!this.extension && this.extension.state === 1 /* ExtensionState.Installed */ && this.extensionEnablementService.isEnabledEnablementState(this.extension.enablementState) && productIconThemes.some(th => isThemeFromExtension(th, this.extension));
        }
        async run({ showCurrentTheme, ignoreFocusLost } = { showCurrentTheme: false, ignoreFocusLost: false }) {
            const productIconThemes = await this.workbenchThemeService.getProductIconThemes();
            if (!this.computeEnablement(productIconThemes)) {
                return;
            }
            const currentTheme = this.workbenchThemeService.getProductIconTheme();
            const delayer = new async_1.Delayer(100);
            const picks = getQuickPickEntries(productIconThemes, currentTheme, this.extension, showCurrentTheme);
            const pickedTheme = await this.quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('select product icon theme', "Select Product Icon Theme"),
                onDidFocus: item => delayer.trigger(() => this.workbenchThemeService.setProductIconTheme(item.id, undefined)),
                ignoreFocusLost
            });
            return this.workbenchThemeService.setProductIconTheme(pickedTheme ? pickedTheme.id : currentTheme.id, 'auto');
        }
    };
    exports.SetProductIconThemeAction = SetProductIconThemeAction;
    exports.SetProductIconThemeAction = SetProductIconThemeAction = SetProductIconThemeAction_1 = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], SetProductIconThemeAction);
    let SetLanguageAction = class SetLanguageAction extends ExtensionAction {
        static { SetLanguageAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.setDisplayLanguage'; }
        static { this.TITLE = (0, nls_1.localize2)('workbench.extensions.action.setDisplayLanguage', 'Set Display Language'); }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} language`; }
        static { this.DisabledClass = `${SetLanguageAction_1.EnabledClass} disabled`; }
        constructor(extensionsWorkbenchService) {
            super(SetLanguageAction_1.ID, SetLanguageAction_1.TITLE.value, SetLanguageAction_1.DisabledClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = SetLanguageAction_1.DisabledClass;
            if (!this.extension) {
                return;
            }
            if (!this.extensionsWorkbenchService.canSetLanguage(this.extension)) {
                return;
            }
            if (this.extension.gallery && platform_1.language === (0, languagePacks_1.getLocale)(this.extension.gallery)) {
                return;
            }
            this.enabled = true;
            this.class = SetLanguageAction_1.EnabledClass;
        }
        async run() {
            return this.extension && this.extensionsWorkbenchService.setLanguage(this.extension);
        }
    };
    exports.SetLanguageAction = SetLanguageAction;
    exports.SetLanguageAction = SetLanguageAction = SetLanguageAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService)
    ], SetLanguageAction);
    let ClearLanguageAction = class ClearLanguageAction extends ExtensionAction {
        static { ClearLanguageAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.clearLanguage'; }
        static { this.TITLE = (0, nls_1.localize2)('workbench.extensions.action.clearLanguage', 'Clear Display Language'); }
        static { this.EnabledClass = `${ExtensionAction.LABEL_ACTION_CLASS} language`; }
        static { this.DisabledClass = `${ClearLanguageAction_1.EnabledClass} disabled`; }
        constructor(extensionsWorkbenchService, localeService) {
            super(ClearLanguageAction_1.ID, ClearLanguageAction_1.TITLE.value, ClearLanguageAction_1.DisabledClass, false);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.localeService = localeService;
            this.update();
        }
        update() {
            this.enabled = false;
            this.class = ClearLanguageAction_1.DisabledClass;
            if (!this.extension) {
                return;
            }
            if (!this.extensionsWorkbenchService.canSetLanguage(this.extension)) {
                return;
            }
            if (this.extension.gallery && platform_1.language !== (0, languagePacks_1.getLocale)(this.extension.gallery)) {
                return;
            }
            this.enabled = true;
            this.class = ClearLanguageAction_1.EnabledClass;
        }
        async run() {
            return this.extension && this.localeService.clearLocalePreference();
        }
    };
    exports.ClearLanguageAction = ClearLanguageAction;
    exports.ClearLanguageAction = ClearLanguageAction = ClearLanguageAction_1 = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, locale_1.ILocaleService)
    ], ClearLanguageAction);
    let ShowRecommendedExtensionAction = class ShowRecommendedExtensionAction extends actions_1.Action {
        static { ShowRecommendedExtensionAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.showRecommendedExtension'; }
        static { this.LABEL = (0, nls_1.localize)('showRecommendedExtension', "Show Recommended Extension"); }
        constructor(extensionId, paneCompositeService, extensionWorkbenchService) {
            super(ShowRecommendedExtensionAction_1.ID, ShowRecommendedExtensionAction_1.LABEL, undefined, false);
            this.paneCompositeService = paneCompositeService;
            this.extensionWorkbenchService = extensionWorkbenchService;
            this.extensionId = extensionId;
        }
        async run() {
            const paneComposite = await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const paneContainer = paneComposite?.getViewPaneContainer();
            paneContainer.search(`@id:${this.extensionId}`);
            paneContainer.focus();
            const [extension] = await this.extensionWorkbenchService.getExtensions([{ id: this.extensionId }], { source: 'install-recommendation' }, cancellation_1.CancellationToken.None);
            if (extension) {
                return this.extensionWorkbenchService.open(extension);
            }
            return null;
        }
    };
    exports.ShowRecommendedExtensionAction = ShowRecommendedExtensionAction;
    exports.ShowRecommendedExtensionAction = ShowRecommendedExtensionAction = ShowRecommendedExtensionAction_1 = __decorate([
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, extensions_1.IExtensionsWorkbenchService)
    ], ShowRecommendedExtensionAction);
    let InstallRecommendedExtensionAction = class InstallRecommendedExtensionAction extends actions_1.Action {
        static { InstallRecommendedExtensionAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.installRecommendedExtension'; }
        static { this.LABEL = (0, nls_1.localize)('installRecommendedExtension', "Install Recommended Extension"); }
        constructor(extensionId, paneCompositeService, instantiationService, extensionWorkbenchService) {
            super(InstallRecommendedExtensionAction_1.ID, InstallRecommendedExtensionAction_1.LABEL, undefined, false);
            this.paneCompositeService = paneCompositeService;
            this.instantiationService = instantiationService;
            this.extensionWorkbenchService = extensionWorkbenchService;
            this.extensionId = extensionId;
        }
        async run() {
            const viewlet = await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const viewPaneContainer = viewlet?.getViewPaneContainer();
            viewPaneContainer.search(`@id:${this.extensionId}`);
            viewPaneContainer.focus();
            const [extension] = await this.extensionWorkbenchService.getExtensions([{ id: this.extensionId }], { source: 'install-recommendation' }, cancellation_1.CancellationToken.None);
            if (extension) {
                await this.extensionWorkbenchService.open(extension);
                try {
                    await this.extensionWorkbenchService.install(extension);
                }
                catch (err) {
                    this.instantiationService.createInstance(PromptExtensionInstallFailureAction, extension, extension.latestVersion, 2 /* InstallOperation.Install */, err).run();
                }
            }
        }
    };
    exports.InstallRecommendedExtensionAction = InstallRecommendedExtensionAction;
    exports.InstallRecommendedExtensionAction = InstallRecommendedExtensionAction = InstallRecommendedExtensionAction_1 = __decorate([
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, extensions_1.IExtensionsWorkbenchService)
    ], InstallRecommendedExtensionAction);
    let IgnoreExtensionRecommendationAction = class IgnoreExtensionRecommendationAction extends actions_1.Action {
        static { IgnoreExtensionRecommendationAction_1 = this; }
        static { this.ID = 'extensions.ignore'; }
        static { this.Class = `${ExtensionAction.LABEL_ACTION_CLASS} ignore`; }
        constructor(extension, extensionRecommendationsManagementService) {
            super(IgnoreExtensionRecommendationAction_1.ID, 'Ignore Recommendation');
            this.extension = extension;
            this.extensionRecommendationsManagementService = extensionRecommendationsManagementService;
            this.class = IgnoreExtensionRecommendationAction_1.Class;
            this.tooltip = (0, nls_1.localize)('ignoreExtensionRecommendation', "Do not recommend this extension again");
            this.enabled = true;
        }
        run() {
            this.extensionRecommendationsManagementService.toggleGlobalIgnoredRecommendation(this.extension.identifier.id, true);
            return Promise.resolve();
        }
    };
    exports.IgnoreExtensionRecommendationAction = IgnoreExtensionRecommendationAction;
    exports.IgnoreExtensionRecommendationAction = IgnoreExtensionRecommendationAction = IgnoreExtensionRecommendationAction_1 = __decorate([
        __param(1, extensionRecommendations_1.IExtensionIgnoredRecommendationsService)
    ], IgnoreExtensionRecommendationAction);
    let UndoIgnoreExtensionRecommendationAction = class UndoIgnoreExtensionRecommendationAction extends actions_1.Action {
        static { UndoIgnoreExtensionRecommendationAction_1 = this; }
        static { this.ID = 'extensions.ignore'; }
        static { this.Class = `${ExtensionAction.LABEL_ACTION_CLASS} undo-ignore`; }
        constructor(extension, extensionRecommendationsManagementService) {
            super(UndoIgnoreExtensionRecommendationAction_1.ID, 'Undo');
            this.extension = extension;
            this.extensionRecommendationsManagementService = extensionRecommendationsManagementService;
            this.class = UndoIgnoreExtensionRecommendationAction_1.Class;
            this.tooltip = (0, nls_1.localize)('undo', "Undo");
            this.enabled = true;
        }
        run() {
            this.extensionRecommendationsManagementService.toggleGlobalIgnoredRecommendation(this.extension.identifier.id, false);
            return Promise.resolve();
        }
    };
    exports.UndoIgnoreExtensionRecommendationAction = UndoIgnoreExtensionRecommendationAction;
    exports.UndoIgnoreExtensionRecommendationAction = UndoIgnoreExtensionRecommendationAction = UndoIgnoreExtensionRecommendationAction_1 = __decorate([
        __param(1, extensionRecommendations_1.IExtensionIgnoredRecommendationsService)
    ], UndoIgnoreExtensionRecommendationAction);
    let SearchExtensionsAction = class SearchExtensionsAction extends actions_1.Action {
        constructor(searchValue, paneCompositeService) {
            super('extensions.searchExtensions', (0, nls_1.localize)('search recommendations', "Search Extensions"), undefined, true);
            this.searchValue = searchValue;
            this.paneCompositeService = paneCompositeService;
        }
        async run() {
            const viewPaneContainer = (await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true))?.getViewPaneContainer();
            viewPaneContainer.search(this.searchValue);
            viewPaneContainer.focus();
        }
    };
    exports.SearchExtensionsAction = SearchExtensionsAction;
    exports.SearchExtensionsAction = SearchExtensionsAction = __decorate([
        __param(1, panecomposite_1.IPaneCompositePartService)
    ], SearchExtensionsAction);
    let AbstractConfigureRecommendedExtensionsAction = class AbstractConfigureRecommendedExtensionsAction extends actions_1.Action {
        constructor(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService) {
            super(id, label);
            this.contextService = contextService;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.jsonEditingService = jsonEditingService;
            this.textModelResolverService = textModelResolverService;
        }
        openExtensionsFile(extensionsFileResource) {
            return this.getOrCreateExtensionsFile(extensionsFileResource)
                .then(({ created, content }) => this.getSelectionPosition(content, extensionsFileResource, ['recommendations'])
                .then(selection => this.editorService.openEditor({
                resource: extensionsFileResource,
                options: {
                    pinned: created,
                    selection
                }
            })), error => Promise.reject(new Error((0, nls_1.localize)('OpenExtensionsFile.failed', "Unable to create 'extensions.json' file inside the '.vscode' folder ({0}).", error))));
        }
        openWorkspaceConfigurationFile(workspaceConfigurationFile) {
            return this.getOrUpdateWorkspaceConfigurationFile(workspaceConfigurationFile)
                .then(content => this.getSelectionPosition(content.value.toString(), content.resource, ['extensions', 'recommendations']))
                .then(selection => this.editorService.openEditor({
                resource: workspaceConfigurationFile,
                options: {
                    selection,
                    forceReload: true // because content has changed
                }
            }));
        }
        getOrUpdateWorkspaceConfigurationFile(workspaceConfigurationFile) {
            return Promise.resolve(this.fileService.readFile(workspaceConfigurationFile))
                .then(content => {
                const workspaceRecommendations = json.parse(content.value.toString())['extensions'];
                if (!workspaceRecommendations || !workspaceRecommendations.recommendations) {
                    return this.jsonEditingService.write(workspaceConfigurationFile, [{ path: ['extensions'], value: { recommendations: [] } }], true)
                        .then(() => this.fileService.readFile(workspaceConfigurationFile));
                }
                return content;
            });
        }
        getSelectionPosition(content, resource, path) {
            const tree = json.parseTree(content);
            const node = json.findNodeAtLocation(tree, path);
            if (node && node.parent && node.parent.children) {
                const recommendationsValueNode = node.parent.children[1];
                const lastExtensionNode = recommendationsValueNode.children && recommendationsValueNode.children.length ? recommendationsValueNode.children[recommendationsValueNode.children.length - 1] : null;
                const offset = lastExtensionNode ? lastExtensionNode.offset + lastExtensionNode.length : recommendationsValueNode.offset + 1;
                return Promise.resolve(this.textModelResolverService.createModelReference(resource))
                    .then(reference => {
                    const position = reference.object.textEditorModel.getPositionAt(offset);
                    reference.dispose();
                    return {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                    };
                });
            }
            return Promise.resolve(undefined);
        }
        getOrCreateExtensionsFile(extensionsFileResource) {
            return Promise.resolve(this.fileService.readFile(extensionsFileResource)).then(content => {
                return { created: false, extensionsFileResource, content: content.value.toString() };
            }, err => {
                return this.textFileService.write(extensionsFileResource, extensionsFileTemplate_1.ExtensionsConfigurationInitialContent).then(() => {
                    return { created: true, extensionsFileResource, content: extensionsFileTemplate_1.ExtensionsConfigurationInitialContent };
                });
            });
        }
    };
    exports.AbstractConfigureRecommendedExtensionsAction = AbstractConfigureRecommendedExtensionsAction;
    exports.AbstractConfigureRecommendedExtensionsAction = AbstractConfigureRecommendedExtensionsAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, files_1.IFileService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService)
    ], AbstractConfigureRecommendedExtensionsAction);
    let ConfigureWorkspaceRecommendedExtensionsAction = class ConfigureWorkspaceRecommendedExtensionsAction extends AbstractConfigureRecommendedExtensionsAction {
        static { this.ID = 'workbench.extensions.action.configureWorkspaceRecommendedExtensions'; }
        static { this.LABEL = (0, nls_1.localize)('configureWorkspaceRecommendedExtensions', "Configure Recommended Extensions (Workspace)"); }
        constructor(id, label, fileService, textFileService, contextService, editorService, jsonEditingService, textModelResolverService) {
            super(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService);
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.update(), this));
            this.update();
        }
        update() {
            this.enabled = this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */;
        }
        run() {
            switch (this.contextService.getWorkbenchState()) {
                case 2 /* WorkbenchState.FOLDER */:
                    return this.openExtensionsFile(this.contextService.getWorkspace().folders[0].toResource(workspaceExtensionsConfig_1.EXTENSIONS_CONFIG));
                case 3 /* WorkbenchState.WORKSPACE */:
                    return this.openWorkspaceConfigurationFile(this.contextService.getWorkspace().configuration);
            }
            return Promise.resolve();
        }
    };
    exports.ConfigureWorkspaceRecommendedExtensionsAction = ConfigureWorkspaceRecommendedExtensionsAction;
    exports.ConfigureWorkspaceRecommendedExtensionsAction = ConfigureWorkspaceRecommendedExtensionsAction = __decorate([
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService)
    ], ConfigureWorkspaceRecommendedExtensionsAction);
    let ConfigureWorkspaceFolderRecommendedExtensionsAction = class ConfigureWorkspaceFolderRecommendedExtensionsAction extends AbstractConfigureRecommendedExtensionsAction {
        static { this.ID = 'workbench.extensions.action.configureWorkspaceFolderRecommendedExtensions'; }
        static { this.LABEL = (0, nls_1.localize)('configureWorkspaceFolderRecommendedExtensions', "Configure Recommended Extensions (Workspace Folder)"); }
        constructor(id, label, fileService, textFileService, contextService, editorService, jsonEditingService, textModelResolverService, commandService) {
            super(id, label, contextService, fileService, textFileService, editorService, jsonEditingService, textModelResolverService);
            this.commandService = commandService;
        }
        run() {
            const folderCount = this.contextService.getWorkspace().folders.length;
            const pickFolderPromise = folderCount === 1 ? Promise.resolve(this.contextService.getWorkspace().folders[0]) : this.commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
            return Promise.resolve(pickFolderPromise)
                .then(workspaceFolder => {
                if (workspaceFolder) {
                    return this.openExtensionsFile(workspaceFolder.toResource(workspaceExtensionsConfig_1.EXTENSIONS_CONFIG));
                }
                return null;
            });
        }
    };
    exports.ConfigureWorkspaceFolderRecommendedExtensionsAction = ConfigureWorkspaceFolderRecommendedExtensionsAction;
    exports.ConfigureWorkspaceFolderRecommendedExtensionsAction = ConfigureWorkspaceFolderRecommendedExtensionsAction = __decorate([
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, editorService_1.IEditorService),
        __param(6, jsonEditing_1.IJSONEditingService),
        __param(7, resolverService_1.ITextModelService),
        __param(8, commands_1.ICommandService)
    ], ConfigureWorkspaceFolderRecommendedExtensionsAction);
    let ExtensionStatusLabelAction = class ExtensionStatusLabelAction extends actions_1.Action {
        static { ExtensionStatusLabelAction_1 = this; }
        static { this.ENABLED_CLASS = `${ExtensionAction.TEXT_ACTION_CLASS} extension-status-label`; }
        static { this.DISABLED_CLASS = `${ExtensionStatusLabelAction_1.ENABLED_CLASS} hide`; }
        get extension() { return this._extension; }
        set extension(extension) {
            if (!(this._extension && extension && (0, extensionManagementUtil_1.areSameExtensions)(this._extension.identifier, extension.identifier))) {
                // Different extension. Reset
                this.initialStatus = null;
                this.status = null;
                this.enablementState = null;
            }
            this._extension = extension;
            this.update();
        }
        constructor(extensionService, extensionManagementServerService, extensionEnablementService) {
            super('extensions.action.statusLabel', '', ExtensionStatusLabelAction_1.DISABLED_CLASS, false);
            this.extensionService = extensionService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionEnablementService = extensionEnablementService;
            this.initialStatus = null;
            this.status = null;
            this.version = null;
            this.enablementState = null;
            this._extension = null;
        }
        update() {
            const label = this.computeLabel();
            this.label = label || '';
            this.class = label ? ExtensionStatusLabelAction_1.ENABLED_CLASS : ExtensionStatusLabelAction_1.DISABLED_CLASS;
        }
        computeLabel() {
            if (!this.extension) {
                return null;
            }
            const currentStatus = this.status;
            const currentVersion = this.version;
            const currentEnablementState = this.enablementState;
            this.status = this.extension.state;
            this.version = this.extension.version;
            if (this.initialStatus === null) {
                this.initialStatus = this.status;
            }
            this.enablementState = this.extension.enablementState;
            const canAddExtension = () => {
                const runningExtension = this.extensionService.extensions.filter(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))[0];
                if (this.extension.local) {
                    if (runningExtension && this.extension.version === runningExtension.version) {
                        return true;
                    }
                    return this.extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(this.extension.local));
                }
                return false;
            };
            const canRemoveExtension = () => {
                if (this.extension.local) {
                    if (this.extensionService.extensions.every(e => !((0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier) && this.extension.server === this.extensionManagementServerService.getExtensionManagementServer((0, extensions_3.toExtension)(e))))) {
                        return true;
                    }
                    return this.extensionService.canRemoveExtension((0, extensions_3.toExtensionDescription)(this.extension.local));
                }
                return false;
            };
            if (currentStatus !== null) {
                if (currentStatus === 0 /* ExtensionState.Installing */ && this.status === 1 /* ExtensionState.Installed */) {
                    return canAddExtension() ? this.initialStatus === 1 /* ExtensionState.Installed */ && this.version !== currentVersion ? (0, nls_1.localize)('updated', "Updated") : (0, nls_1.localize)('installed', "Installed") : null;
                }
                if (currentStatus === 2 /* ExtensionState.Uninstalling */ && this.status === 3 /* ExtensionState.Uninstalled */) {
                    this.initialStatus = this.status;
                    return canRemoveExtension() ? (0, nls_1.localize)('uninstalled', "Uninstalled") : null;
                }
            }
            if (currentEnablementState !== null) {
                const currentlyEnabled = this.extensionEnablementService.isEnabledEnablementState(currentEnablementState);
                const enabled = this.extensionEnablementService.isEnabledEnablementState(this.enablementState);
                if (!currentlyEnabled && enabled) {
                    return canAddExtension() ? (0, nls_1.localize)('enabled', "Enabled") : null;
                }
                if (currentlyEnabled && !enabled) {
                    return canRemoveExtension() ? (0, nls_1.localize)('disabled', "Disabled") : null;
                }
            }
            return null;
        }
        run() {
            return Promise.resolve();
        }
    };
    exports.ExtensionStatusLabelAction = ExtensionStatusLabelAction;
    exports.ExtensionStatusLabelAction = ExtensionStatusLabelAction = ExtensionStatusLabelAction_1 = __decorate([
        __param(0, extensions_3.IExtensionService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], ExtensionStatusLabelAction);
    let ToggleSyncExtensionAction = class ToggleSyncExtensionAction extends ExtensionDropDownAction {
        static { ToggleSyncExtensionAction_1 = this; }
        static { this.IGNORED_SYNC_CLASS = `${ExtensionAction.ICON_ACTION_CLASS} extension-sync ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.syncIgnoredIcon)}`; }
        static { this.SYNC_CLASS = `${ToggleSyncExtensionAction_1.ICON_ACTION_CLASS} extension-sync ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.syncEnabledIcon)}`; }
        constructor(configurationService, extensionsWorkbenchService, userDataSyncEnablementService, instantiationService) {
            super('extensions.sync', '', ToggleSyncExtensionAction_1.SYNC_CLASS, false, instantiationService);
            this.configurationService = configurationService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('settingsSync.ignoredExtensions'))(() => this.update()));
            this._register(userDataSyncEnablementService.onDidChangeEnablement(() => this.update()));
            this.update();
        }
        update() {
            this.enabled = !!this.extension && this.userDataSyncEnablementService.isEnabled() && this.extension.state === 1 /* ExtensionState.Installed */;
            if (this.extension) {
                const isIgnored = this.extensionsWorkbenchService.isExtensionIgnoredToSync(this.extension);
                this.class = isIgnored ? ToggleSyncExtensionAction_1.IGNORED_SYNC_CLASS : ToggleSyncExtensionAction_1.SYNC_CLASS;
                this.tooltip = isIgnored ? (0, nls_1.localize)('ignored', "This extension is ignored during sync") : (0, nls_1.localize)('synced', "This extension is synced");
            }
        }
        async run() {
            return super.run({
                actionGroups: [
                    [
                        new actions_1.Action('extensions.syncignore', this.extensionsWorkbenchService.isExtensionIgnoredToSync(this.extension) ? (0, nls_1.localize)('sync', "Sync this extension") : (0, nls_1.localize)('do not sync', "Do not sync this extension"), undefined, true, () => this.extensionsWorkbenchService.toggleExtensionIgnoredToSync(this.extension))
                    ]
                ], disposeActionsOnHide: true
            });
        }
    };
    exports.ToggleSyncExtensionAction = ToggleSyncExtensionAction;
    exports.ToggleSyncExtensionAction = ToggleSyncExtensionAction = ToggleSyncExtensionAction_1 = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, userDataSync_1.IUserDataSyncEnablementService),
        __param(3, instantiation_1.IInstantiationService)
    ], ToggleSyncExtensionAction);
    let ExtensionStatusAction = class ExtensionStatusAction extends ExtensionAction {
        static { ExtensionStatusAction_1 = this; }
        static { this.CLASS = `${ExtensionAction.ICON_ACTION_CLASS} extension-status`; }
        get status() { return this._status; }
        constructor(extensionManagementServerService, labelService, commandService, workspaceTrustEnablementService, workspaceTrustService, extensionsWorkbenchService, extensionService, extensionManifestPropertiesService, contextService, productService, workbenchExtensionEnablementService, extensionFeaturesManagementService) {
            super('extensions.status', '', `${ExtensionStatusAction_1.CLASS} hide`, false);
            this.extensionManagementServerService = extensionManagementServerService;
            this.labelService = labelService;
            this.commandService = commandService;
            this.workspaceTrustEnablementService = workspaceTrustEnablementService;
            this.workspaceTrustService = workspaceTrustService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionService = extensionService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.contextService = contextService;
            this.productService = productService;
            this.workbenchExtensionEnablementService = workbenchExtensionEnablementService;
            this.extensionFeaturesManagementService = extensionFeaturesManagementService;
            this.updateWhenCounterExtensionChanges = true;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this.updateThrottler = new async_1.Throttler();
            this._register(this.labelService.onDidChangeFormatters(() => this.update(), this));
            this._register(this.extensionService.onDidChangeExtensions(() => this.update()));
            this._register(this.extensionFeaturesManagementService.onDidChangeAccessData(() => this.update()));
            this.update();
        }
        update() {
            this.updateThrottler.queue(() => this.computeAndUpdateStatus());
        }
        async computeAndUpdateStatus() {
            this.updateStatus(undefined, true);
            this.enabled = false;
            if (!this.extension) {
                return;
            }
            if (this.extension.isMalicious) {
                this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString((0, nls_1.localize)('malicious tooltip', "This extension was reported to be problematic.")) }, true);
                return;
            }
            if (this.extension.deprecationInfo) {
                if (this.extension.deprecationInfo.extension) {
                    const link = `[${this.extension.deprecationInfo.extension.displayName}](${uri_1.URI.parse(`command:extension.open?${encodeURIComponent(JSON.stringify([this.extension.deprecationInfo.extension.id]))}`)})`;
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString((0, nls_1.localize)('deprecated with alternate extension tooltip', "This extension is deprecated. Use the {0} extension instead.", link)) }, true);
                }
                else if (this.extension.deprecationInfo.settings) {
                    const link = `[${(0, nls_1.localize)('settings', "settings")}](${uri_1.URI.parse(`command:workbench.action.openSettings?${encodeURIComponent(JSON.stringify([this.extension.deprecationInfo.settings.map(setting => `@id:${setting}`).join(' ')]))}`)})`;
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString((0, nls_1.localize)('deprecated with alternate settings tooltip', "This extension is deprecated as this functionality is now built-in to VS Code. Configure these {0} to use this functionality.", link)) }, true);
                }
                else {
                    const message = new htmlContent_1.MarkdownString((0, nls_1.localize)('deprecated tooltip', "This extension is deprecated as it is no longer being maintained."));
                    if (this.extension.deprecationInfo.additionalInfo) {
                        message.appendMarkdown(` ${this.extension.deprecationInfo.additionalInfo}`);
                    }
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message }, true);
                }
                return;
            }
            if (this.extensionsWorkbenchService.canSetLanguage(this.extension)) {
                return;
            }
            if (this.extension.gallery && this.extension.state === 3 /* ExtensionState.Uninstalled */ && !await this.extensionsWorkbenchService.canInstall(this.extension)) {
                if (this.extensionManagementServerService.localExtensionManagementServer || this.extensionManagementServerService.remoteExtensionManagementServer) {
                    const targetPlatform = await (this.extensionManagementServerService.localExtensionManagementServer ? this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getTargetPlatform() : this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getTargetPlatform());
                    const message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('incompatible platform', "The '{0}' extension is not available in {1} for {2}.", this.extension.displayName || this.extension.identifier.id, this.productService.nameLong, (0, extensionManagement_1.TargetPlatformToString)(targetPlatform))} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-platform-specific-extensions)`);
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message }, true);
                    return;
                }
                if (this.extensionManagementServerService.webExtensionManagementServer) {
                    const productName = (0, nls_1.localize)('VS Code for Web', "{0} for the Web", this.productService.nameLong);
                    const message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('not web tooltip', "The '{0}' extension is not available in {1}.", this.extension.displayName || this.extension.identifier.id, productName)} [${(0, nls_1.localize)('learn why', "Learn Why")}](https://aka.ms/vscode-web-extensions-guide)`);
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message }, true);
                    return;
                }
            }
            if (!this.extension.local ||
                !this.extension.server ||
                this.extension.state !== 1 /* ExtensionState.Installed */) {
                return;
            }
            // Extension is disabled by environment
            if (this.extension.enablementState === 2 /* EnablementState.DisabledByEnvironment */) {
                this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('disabled by environment', "This extension is disabled by the environment.")) }, true);
                return;
            }
            // Extension is enabled by environment
            if (this.extension.enablementState === 3 /* EnablementState.EnabledByEnvironment */) {
                this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('enabled by environment', "This extension is enabled because it is required in the current environment.")) }, true);
                return;
            }
            // Extension is disabled by virtual workspace
            if (this.extension.enablementState === 4 /* EnablementState.DisabledByVirtualWorkspace */) {
                const details = (0, extensions_2.getWorkspaceSupportTypeMessage)(this.extension.local.manifest.capabilities?.virtualWorkspaces);
                this.updateStatus({ icon: extensionsIcons_1.infoIcon, message: new htmlContent_1.MarkdownString(details ? (0, htmlContent_1.escapeMarkdownSyntaxTokens)(details) : (0, nls_1.localize)('disabled because of virtual workspace', "This extension has been disabled because it does not support virtual workspaces.")) }, true);
                return;
            }
            // Limited support in Virtual Workspace
            if ((0, virtualWorkspace_1.isVirtualWorkspace)(this.contextService.getWorkspace())) {
                const virtualSupportType = this.extensionManifestPropertiesService.getExtensionVirtualWorkspaceSupportType(this.extension.local.manifest);
                const details = (0, extensions_2.getWorkspaceSupportTypeMessage)(this.extension.local.manifest.capabilities?.virtualWorkspaces);
                if (virtualSupportType === 'limited' || details) {
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString(details ? (0, htmlContent_1.escapeMarkdownSyntaxTokens)(details) : (0, nls_1.localize)('extension limited because of virtual workspace', "This extension has limited features because the current workspace is virtual.")) }, true);
                    return;
                }
            }
            // Extension is disabled by untrusted workspace
            if (this.extension.enablementState === 0 /* EnablementState.DisabledByTrustRequirement */ ||
                // All disabled dependencies of the extension are disabled by untrusted workspace
                (this.extension.enablementState === 5 /* EnablementState.DisabledByExtensionDependency */ && this.workbenchExtensionEnablementService.getDependenciesEnablementStates(this.extension.local).every(([, enablementState]) => this.workbenchExtensionEnablementService.isEnabledEnablementState(enablementState) || enablementState === 0 /* EnablementState.DisabledByTrustRequirement */))) {
                this.enabled = true;
                const untrustedDetails = (0, extensions_2.getWorkspaceSupportTypeMessage)(this.extension.local.manifest.capabilities?.untrustedWorkspaces);
                this.updateStatus({ icon: extensionsIcons_1.trustIcon, message: new htmlContent_1.MarkdownString(untrustedDetails ? (0, htmlContent_1.escapeMarkdownSyntaxTokens)(untrustedDetails) : (0, nls_1.localize)('extension disabled because of trust requirement', "This extension has been disabled because the current workspace is not trusted.")) }, true);
                return;
            }
            // Limited support in Untrusted Workspace
            if (this.workspaceTrustEnablementService.isWorkspaceTrustEnabled() && !this.workspaceTrustService.isWorkspaceTrusted()) {
                const untrustedSupportType = this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(this.extension.local.manifest);
                const untrustedDetails = (0, extensions_2.getWorkspaceSupportTypeMessage)(this.extension.local.manifest.capabilities?.untrustedWorkspaces);
                if (untrustedSupportType === 'limited' || untrustedDetails) {
                    this.enabled = true;
                    this.updateStatus({ icon: extensionsIcons_1.trustIcon, message: new htmlContent_1.MarkdownString(untrustedDetails ? (0, htmlContent_1.escapeMarkdownSyntaxTokens)(untrustedDetails) : (0, nls_1.localize)('extension limited because of trust requirement', "This extension has limited features because the current workspace is not trusted.")) }, true);
                    return;
                }
            }
            // Extension is disabled by extension kind
            if (this.extension.enablementState === 1 /* EnablementState.DisabledByExtensionKind */) {
                if (!this.extensionsWorkbenchService.installed.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.extension.identifier) && e.server !== this.extension.server)) {
                    let message;
                    // Extension on Local Server
                    if (this.extensionManagementServerService.localExtensionManagementServer === this.extension.server) {
                        if (this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(this.extension.local.manifest)) {
                            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                                message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('Install in remote server to enable', "This extension is disabled in this workspace because it is defined to run in the Remote Extension Host. Please install the extension in '{0}' to enable.", this.extensionManagementServerService.remoteExtensionManagementServer.label)} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`);
                            }
                        }
                    }
                    // Extension on Remote Server
                    else if (this.extensionManagementServerService.remoteExtensionManagementServer === this.extension.server) {
                        if (this.extensionManifestPropertiesService.prefersExecuteOnUI(this.extension.local.manifest)) {
                            if (this.extensionManagementServerService.localExtensionManagementServer) {
                                message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('Install in local server to enable', "This extension is disabled in this workspace because it is defined to run in the Local Extension Host. Please install the extension locally to enable.", this.extensionManagementServerService.remoteExtensionManagementServer.label)} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`);
                            }
                            else if (platform_1.isWeb) {
                                message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('Defined to run in desktop', "This extension is disabled because it is defined to run only in {0} for the Desktop.", this.productService.nameLong)} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`);
                            }
                        }
                    }
                    // Extension on Web Server
                    else if (this.extensionManagementServerService.webExtensionManagementServer === this.extension.server) {
                        message = new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('Cannot be enabled', "This extension is disabled because it is not supported in {0} for the Web.", this.productService.nameLong)} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`);
                    }
                    if (message) {
                        this.updateStatus({ icon: extensionsIcons_1.warningIcon, message }, true);
                    }
                    return;
                }
            }
            const extensionId = new extensions_2.ExtensionIdentifier(this.extension.identifier.id);
            const features = platform_2.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).getExtensionFeatures();
            for (const feature of features) {
                const status = this.extensionFeaturesManagementService.getAccessData(extensionId, feature.id)?.current?.status;
                const manageAccessLink = `[${(0, nls_1.localize)('manage access', 'Manage Access')}](${uri_1.URI.parse(`command:extension.open?${encodeURIComponent(JSON.stringify([this.extension.identifier.id, "features" /* ExtensionEditorTab.Features */, false, feature.id]))}`)})`;
                if (status?.severity === notification_1.Severity.Error) {
                    this.updateStatus({ icon: extensionsIcons_1.errorIcon, message: new htmlContent_1.MarkdownString().appendText(status.message).appendMarkdown(` ${manageAccessLink}`) }, true);
                    return;
                }
                if (status?.severity === notification_1.Severity.Warning) {
                    this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString().appendText(status.message).appendMarkdown(` ${manageAccessLink}`) }, true);
                    return;
                }
            }
            // Remote Workspace
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                if ((0, extensions_2.isLanguagePackExtension)(this.extension.local.manifest)) {
                    if (!this.extensionsWorkbenchService.installed.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, this.extension.identifier) && e.server !== this.extension.server)) {
                        const message = this.extension.server === this.extensionManagementServerService.localExtensionManagementServer
                            ? new htmlContent_1.MarkdownString((0, nls_1.localize)('Install language pack also in remote server', "Install the language pack extension on '{0}' to enable it there also.", this.extensionManagementServerService.remoteExtensionManagementServer.label))
                            : new htmlContent_1.MarkdownString((0, nls_1.localize)('Install language pack also locally', "Install the language pack extension locally to enable it there also."));
                        this.updateStatus({ icon: extensionsIcons_1.infoIcon, message }, true);
                    }
                    return;
                }
                const runningExtension = this.extensionService.extensions.filter(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier))[0];
                const runningExtensionServer = runningExtension ? this.extensionManagementServerService.getExtensionManagementServer((0, extensions_3.toExtension)(runningExtension)) : null;
                if (this.extension.server === this.extensionManagementServerService.localExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.remoteExtensionManagementServer) {
                    if (this.extensionManifestPropertiesService.prefersExecuteOnWorkspace(this.extension.local.manifest)) {
                        this.updateStatus({ icon: extensionsIcons_1.infoIcon, message: new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('enabled remotely', "This extension is enabled in the Remote Extension Host because it prefers to run there.")} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`) }, true);
                    }
                    return;
                }
                if (this.extension.server === this.extensionManagementServerService.remoteExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.localExtensionManagementServer) {
                    if (this.extensionManifestPropertiesService.prefersExecuteOnUI(this.extension.local.manifest)) {
                        this.updateStatus({ icon: extensionsIcons_1.infoIcon, message: new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('enabled locally', "This extension is enabled in the Local Extension Host because it prefers to run there.")} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`) }, true);
                    }
                    return;
                }
                if (this.extension.server === this.extensionManagementServerService.remoteExtensionManagementServer && runningExtensionServer === this.extensionManagementServerService.webExtensionManagementServer) {
                    if (this.extensionManifestPropertiesService.canExecuteOnWeb(this.extension.local.manifest)) {
                        this.updateStatus({ icon: extensionsIcons_1.infoIcon, message: new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('enabled in web worker', "This extension is enabled in the Web Worker Extension Host because it prefers to run there.")} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-remote/developing-extensions/architecture)`) }, true);
                    }
                    return;
                }
            }
            // Extension is disabled by its dependency
            if (this.extension.enablementState === 5 /* EnablementState.DisabledByExtensionDependency */) {
                this.updateStatus({ icon: extensionsIcons_1.warningIcon, message: new htmlContent_1.MarkdownString((0, nls_1.localize)('extension disabled because of dependency', "This extension has been disabled because it depends on an extension that is disabled.")) }, true);
                return;
            }
            const isEnabled = this.workbenchExtensionEnablementService.isEnabled(this.extension.local);
            const isRunning = this.extensionService.extensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.identifier.value, uuid: e.uuid }, this.extension.identifier));
            if (!this.extension.isWorkspaceScoped && isEnabled && isRunning) {
                if (this.extension.enablementState === 9 /* EnablementState.EnabledWorkspace */) {
                    this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('workspace enabled', "This extension is enabled for this workspace by the user.")) }, true);
                    return;
                }
                if (this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                    if (this.extension.server === this.extensionManagementServerService.remoteExtensionManagementServer) {
                        this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('extension enabled on remote', "Extension is enabled on '{0}'", this.extension.server.label)) }, true);
                        return;
                    }
                }
                if (this.extension.enablementState === 8 /* EnablementState.EnabledGlobally */) {
                    this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('globally enabled', "This extension is enabled globally.")) }, true);
                    return;
                }
            }
            if (!isEnabled && !isRunning) {
                if (this.extension.enablementState === 6 /* EnablementState.DisabledGlobally */) {
                    this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('globally disabled', "This extension is disabled globally by the user.")) }, true);
                    return;
                }
                if (this.extension.enablementState === 7 /* EnablementState.DisabledWorkspace */) {
                    this.updateStatus({ message: new htmlContent_1.MarkdownString((0, nls_1.localize)('workspace disabled', "This extension is disabled for this workspace by the user.")) }, true);
                    return;
                }
            }
            if (isEnabled && !isRunning && !this.extension.local.isValid) {
                const errors = this.extension.local.validations.filter(([severity]) => severity === notification_1.Severity.Error).map(([, message]) => message);
                this.updateStatus({ icon: extensionsIcons_1.errorIcon, message: new htmlContent_1.MarkdownString(errors.join(' ').trim()) }, true);
            }
        }
        updateStatus(status, updateClass) {
            if (this._status === status) {
                return;
            }
            if (this._status && status && this._status.message === status.message && this._status.icon?.id === status.icon?.id) {
                return;
            }
            this._status = status;
            if (updateClass) {
                if (this._status?.icon === extensionsIcons_1.errorIcon) {
                    this.class = `${ExtensionStatusAction_1.CLASS} extension-status-error ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.errorIcon)}`;
                }
                else if (this._status?.icon === extensionsIcons_1.warningIcon) {
                    this.class = `${ExtensionStatusAction_1.CLASS} extension-status-warning ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.warningIcon)}`;
                }
                else if (this._status?.icon === extensionsIcons_1.infoIcon) {
                    this.class = `${ExtensionStatusAction_1.CLASS} extension-status-info ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.infoIcon)}`;
                }
                else if (this._status?.icon === extensionsIcons_1.trustIcon) {
                    this.class = `${ExtensionStatusAction_1.CLASS} ${themables_1.ThemeIcon.asClassName(extensionsIcons_1.trustIcon)}`;
                }
                else {
                    this.class = `${ExtensionStatusAction_1.CLASS} hide`;
                }
            }
            this._onDidChangeStatus.fire();
        }
        async run() {
            if (this._status?.icon === extensionsIcons_1.trustIcon) {
                return this.commandService.executeCommand('workbench.trust.manage');
            }
        }
    };
    exports.ExtensionStatusAction = ExtensionStatusAction;
    exports.ExtensionStatusAction = ExtensionStatusAction = ExtensionStatusAction_1 = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, label_1.ILabelService),
        __param(2, commands_1.ICommandService),
        __param(3, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(4, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(5, extensions_1.IExtensionsWorkbenchService),
        __param(6, extensions_3.IExtensionService),
        __param(7, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, productService_1.IProductService),
        __param(10, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(11, extensionFeatures_1.IExtensionFeaturesManagementService)
    ], ExtensionStatusAction);
    let ReinstallAction = class ReinstallAction extends actions_1.Action {
        static { ReinstallAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.reinstall'; }
        static { this.LABEL = (0, nls_1.localize)('reinstall', "Reinstall Extension..."); }
        constructor(id = ReinstallAction_1.ID, label = ReinstallAction_1.LABEL, extensionsWorkbenchService, extensionManagementServerService, quickInputService, notificationService, hostService, instantiationService, extensionService) {
            super(id, label);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.hostService = hostService;
            this.instantiationService = instantiationService;
            this.extensionService = extensionService;
        }
        get enabled() {
            return this.extensionsWorkbenchService.local.filter(l => !l.isBuiltin && l.local).length > 0;
        }
        run() {
            return this.quickInputService.pick(this.getEntries(), { placeHolder: (0, nls_1.localize)('selectExtensionToReinstall', "Select Extension to Reinstall") })
                .then(pick => pick && this.reinstallExtension(pick.extension));
        }
        getEntries() {
            return this.extensionsWorkbenchService.queryLocal()
                .then(local => {
                const entries = local
                    .filter(extension => !extension.isBuiltin && extension.server !== this.extensionManagementServerService.webExtensionManagementServer)
                    .map(extension => {
                    return {
                        id: extension.identifier.id,
                        label: extension.displayName,
                        description: extension.identifier.id,
                        extension,
                    };
                });
                return entries;
            });
        }
        reinstallExtension(extension) {
            return this.instantiationService.createInstance(SearchExtensionsAction, '@installed ').run()
                .then(() => {
                return this.extensionsWorkbenchService.reinstall(extension)
                    .then(extension => {
                    const requireReload = !(extension.local && this.extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(extension.local)));
                    const message = requireReload ? (0, nls_1.localize)('ReinstallAction.successReload', "Please reload Visual Studio Code to complete reinstalling the extension {0}.", extension.identifier.id)
                        : (0, nls_1.localize)('ReinstallAction.success', "Reinstalling the extension {0} is completed.", extension.identifier.id);
                    const actions = requireReload ? [{
                            label: (0, nls_1.localize)('InstallVSIXAction.reloadNow', "Reload Now"),
                            run: () => this.hostService.reload()
                        }] : [];
                    this.notificationService.prompt(notification_1.Severity.Info, message, actions, { sticky: true });
                }, error => this.notificationService.error(error));
            });
        }
    };
    exports.ReinstallAction = ReinstallAction;
    exports.ReinstallAction = ReinstallAction = ReinstallAction_1 = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, extensionManagement_2.IExtensionManagementServerService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, notification_1.INotificationService),
        __param(6, host_1.IHostService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, extensions_3.IExtensionService)
    ], ReinstallAction);
    let InstallSpecificVersionOfExtensionAction = class InstallSpecificVersionOfExtensionAction extends actions_1.Action {
        static { InstallSpecificVersionOfExtensionAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.install.specificVersion'; }
        static { this.LABEL = (0, nls_1.localize)('install previous version', "Install Specific Version of Extension..."); }
        constructor(id = InstallSpecificVersionOfExtensionAction_1.ID, label = InstallSpecificVersionOfExtensionAction_1.LABEL, extensionsWorkbenchService, quickInputService, instantiationService, extensionEnablementService) {
            super(id, label);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.extensionEnablementService = extensionEnablementService;
        }
        get enabled() {
            return this.extensionsWorkbenchService.local.some(l => this.isEnabled(l));
        }
        async run() {
            const extensionPick = await this.quickInputService.pick(this.getExtensionEntries(), { placeHolder: (0, nls_1.localize)('selectExtension', "Select Extension"), matchOnDetail: true });
            if (extensionPick && extensionPick.extension) {
                const action = this.instantiationService.createInstance(InstallAnotherVersionAction);
                action.extension = extensionPick.extension;
                await action.run();
                await this.instantiationService.createInstance(SearchExtensionsAction, extensionPick.extension.identifier.id).run();
            }
        }
        isEnabled(extension) {
            const action = this.instantiationService.createInstance(InstallAnotherVersionAction);
            action.extension = extension;
            return action.enabled && !!extension.local && this.extensionEnablementService.isEnabled(extension.local);
        }
        async getExtensionEntries() {
            const installed = await this.extensionsWorkbenchService.queryLocal();
            const entries = [];
            for (const extension of installed) {
                if (this.isEnabled(extension)) {
                    entries.push({
                        id: extension.identifier.id,
                        label: extension.displayName || extension.identifier.id,
                        description: extension.identifier.id,
                        extension,
                    });
                }
            }
            return entries.sort((e1, e2) => e1.extension.displayName.localeCompare(e2.extension.displayName));
        }
    };
    exports.InstallSpecificVersionOfExtensionAction = InstallSpecificVersionOfExtensionAction;
    exports.InstallSpecificVersionOfExtensionAction = InstallSpecificVersionOfExtensionAction = InstallSpecificVersionOfExtensionAction_1 = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], InstallSpecificVersionOfExtensionAction);
    let AbstractInstallExtensionsInServerAction = class AbstractInstallExtensionsInServerAction extends actions_1.Action {
        constructor(id, extensionsWorkbenchService, quickInputService, notificationService, progressService) {
            super(id);
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.progressService = progressService;
            this.extensions = undefined;
            this.update();
            this.extensionsWorkbenchService.queryLocal().then(() => this.updateExtensions());
            this._register(this.extensionsWorkbenchService.onChange(() => {
                if (this.extensions) {
                    this.updateExtensions();
                }
            }));
        }
        updateExtensions() {
            this.extensions = this.extensionsWorkbenchService.local;
            this.update();
        }
        update() {
            this.enabled = !!this.extensions && this.getExtensionsToInstall(this.extensions).length > 0;
            this.tooltip = this.label;
        }
        async run() {
            return this.selectAndInstallExtensions();
        }
        async queryExtensionsToInstall() {
            const local = await this.extensionsWorkbenchService.queryLocal();
            return this.getExtensionsToInstall(local);
        }
        async selectAndInstallExtensions() {
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.busy = true;
            const disposable = quickPick.onDidAccept(() => {
                disposable.dispose();
                quickPick.hide();
                quickPick.dispose();
                this.onDidAccept(quickPick.selectedItems);
            });
            quickPick.show();
            const localExtensionsToInstall = await this.queryExtensionsToInstall();
            quickPick.busy = false;
            if (localExtensionsToInstall.length) {
                quickPick.title = this.getQuickPickTitle();
                quickPick.placeholder = (0, nls_1.localize)('select extensions to install', "Select extensions to install");
                quickPick.canSelectMany = true;
                localExtensionsToInstall.sort((e1, e2) => e1.displayName.localeCompare(e2.displayName));
                quickPick.items = localExtensionsToInstall.map(extension => ({ extension, label: extension.displayName, description: extension.version }));
            }
            else {
                quickPick.hide();
                quickPick.dispose();
                this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message: (0, nls_1.localize)('no local extensions', "There are no extensions to install.")
                });
            }
        }
        async onDidAccept(selectedItems) {
            if (selectedItems.length) {
                const localExtensionsToInstall = selectedItems.filter(r => !!r.extension).map(r => r.extension);
                if (localExtensionsToInstall.length) {
                    await this.progressService.withProgress({
                        location: 15 /* ProgressLocation.Notification */,
                        title: (0, nls_1.localize)('installing extensions', "Installing Extensions...")
                    }, () => this.installExtensions(localExtensionsToInstall));
                    this.notificationService.info((0, nls_1.localize)('finished installing', "Successfully installed extensions."));
                }
            }
        }
    };
    exports.AbstractInstallExtensionsInServerAction = AbstractInstallExtensionsInServerAction;
    exports.AbstractInstallExtensionsInServerAction = AbstractInstallExtensionsInServerAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, notification_1.INotificationService),
        __param(4, progress_1.IProgressService)
    ], AbstractInstallExtensionsInServerAction);
    let InstallLocalExtensionsInRemoteAction = class InstallLocalExtensionsInRemoteAction extends AbstractInstallExtensionsInServerAction {
        constructor(extensionsWorkbenchService, quickInputService, progressService, notificationService, extensionManagementServerService, extensionGalleryService, instantiationService, fileService, logService) {
            super('workbench.extensions.actions.installLocalExtensionsInRemote', extensionsWorkbenchService, quickInputService, notificationService, progressService);
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionGalleryService = extensionGalleryService;
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.logService = logService;
        }
        get label() {
            if (this.extensionManagementServerService && this.extensionManagementServerService.remoteExtensionManagementServer) {
                return (0, nls_1.localize)('select and install local extensions', "Install Local Extensions in '{0}'...", this.extensionManagementServerService.remoteExtensionManagementServer.label);
            }
            return '';
        }
        getQuickPickTitle() {
            return (0, nls_1.localize)('install local extensions title', "Install Local Extensions in '{0}'", this.extensionManagementServerService.remoteExtensionManagementServer.label);
        }
        getExtensionsToInstall(local) {
            return local.filter(extension => {
                const action = this.instantiationService.createInstance(RemoteInstallAction, true);
                action.extension = extension;
                return action.enabled;
            });
        }
        async installExtensions(localExtensionsToInstall) {
            const galleryExtensions = [];
            const vsixs = [];
            const targetPlatform = await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.getTargetPlatform();
            await async_1.Promises.settled(localExtensionsToInstall.map(async (extension) => {
                if (this.extensionGalleryService.isEnabled()) {
                    const gallery = (await this.extensionGalleryService.getExtensions([{ ...extension.identifier, preRelease: !!extension.local?.preRelease }], { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None))[0];
                    if (gallery) {
                        galleryExtensions.push(gallery);
                        return;
                    }
                }
                const vsix = await this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.zip(extension.local);
                vsixs.push(vsix);
            }));
            await async_1.Promises.settled(galleryExtensions.map(gallery => this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.installFromGallery(gallery)));
            try {
                await async_1.Promises.settled(vsixs.map(vsix => this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.install(vsix)));
            }
            finally {
                try {
                    await Promise.allSettled(vsixs.map(vsix => this.fileService.del(vsix)));
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
        }
    };
    exports.InstallLocalExtensionsInRemoteAction = InstallLocalExtensionsInRemoteAction;
    exports.InstallLocalExtensionsInRemoteAction = InstallLocalExtensionsInRemoteAction = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, quickInput_1.IQuickInputService),
        __param(2, progress_1.IProgressService),
        __param(3, notification_1.INotificationService),
        __param(4, extensionManagement_2.IExtensionManagementServerService),
        __param(5, extensionManagement_1.IExtensionGalleryService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, files_1.IFileService),
        __param(8, log_1.ILogService)
    ], InstallLocalExtensionsInRemoteAction);
    let InstallRemoteExtensionsInLocalAction = class InstallRemoteExtensionsInLocalAction extends AbstractInstallExtensionsInServerAction {
        constructor(id, extensionsWorkbenchService, quickInputService, progressService, notificationService, extensionManagementServerService, extensionGalleryService, fileService, logService) {
            super(id, extensionsWorkbenchService, quickInputService, notificationService, progressService);
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionGalleryService = extensionGalleryService;
            this.fileService = fileService;
            this.logService = logService;
        }
        get label() {
            return (0, nls_1.localize)('select and install remote extensions', "Install Remote Extensions Locally...");
        }
        getQuickPickTitle() {
            return (0, nls_1.localize)('install remote extensions', "Install Remote Extensions Locally");
        }
        getExtensionsToInstall(local) {
            return local.filter(extension => extension.type === 1 /* ExtensionType.User */ && extension.server !== this.extensionManagementServerService.localExtensionManagementServer
                && !this.extensionsWorkbenchService.installed.some(e => e.server === this.extensionManagementServerService.localExtensionManagementServer && (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier)));
        }
        async installExtensions(extensions) {
            const galleryExtensions = [];
            const vsixs = [];
            const targetPlatform = await this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.getTargetPlatform();
            await async_1.Promises.settled(extensions.map(async (extension) => {
                if (this.extensionGalleryService.isEnabled()) {
                    const gallery = (await this.extensionGalleryService.getExtensions([{ ...extension.identifier, preRelease: !!extension.local?.preRelease }], { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None))[0];
                    if (gallery) {
                        galleryExtensions.push(gallery);
                        return;
                    }
                }
                const vsix = await this.extensionManagementServerService.remoteExtensionManagementServer.extensionManagementService.zip(extension.local);
                vsixs.push(vsix);
            }));
            await async_1.Promises.settled(galleryExtensions.map(gallery => this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.installFromGallery(gallery)));
            try {
                await async_1.Promises.settled(vsixs.map(vsix => this.extensionManagementServerService.localExtensionManagementServer.extensionManagementService.install(vsix)));
            }
            finally {
                try {
                    await Promise.allSettled(vsixs.map(vsix => this.fileService.del(vsix)));
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
        }
    };
    exports.InstallRemoteExtensionsInLocalAction = InstallRemoteExtensionsInLocalAction;
    exports.InstallRemoteExtensionsInLocalAction = InstallRemoteExtensionsInLocalAction = __decorate([
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, progress_1.IProgressService),
        __param(4, notification_1.INotificationService),
        __param(5, extensionManagement_2.IExtensionManagementServerService),
        __param(6, extensionManagement_1.IExtensionGalleryService),
        __param(7, files_1.IFileService),
        __param(8, log_1.ILogService)
    ], InstallRemoteExtensionsInLocalAction);
    commands_1.CommandsRegistry.registerCommand('workbench.extensions.action.showExtensionsForLanguage', function (accessor, fileExtension) {
        const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
        return paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
            .then(viewlet => viewlet?.getViewPaneContainer())
            .then(viewlet => {
            viewlet.search(`ext:${fileExtension.replace(/^\./, '')}`);
            viewlet.focus();
        });
    });
    commands_1.CommandsRegistry.registerCommand('workbench.extensions.action.showExtensionsWithIds', function (accessor, extensionIds) {
        const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
        return paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
            .then(viewlet => viewlet?.getViewPaneContainer())
            .then(viewlet => {
            const query = extensionIds
                .map(id => `@id:${id}`)
                .join(' ');
            viewlet.search(query);
            viewlet.focus();
        });
    });
    (0, colorRegistry_1.registerColor)('extensionButton.background', {
        dark: colorRegistry_1.buttonBackground,
        light: colorRegistry_1.buttonBackground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonBackground', "Button background color for extension actions."));
    (0, colorRegistry_1.registerColor)('extensionButton.foreground', {
        dark: colorRegistry_1.buttonForeground,
        light: colorRegistry_1.buttonForeground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonForeground', "Button foreground color for extension actions."));
    (0, colorRegistry_1.registerColor)('extensionButton.hoverBackground', {
        dark: colorRegistry_1.buttonHoverBackground,
        light: colorRegistry_1.buttonHoverBackground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonHoverBackground', "Button background hover color for extension actions."));
    (0, colorRegistry_1.registerColor)('extensionButton.separator', {
        dark: colorRegistry_1.buttonSeparator,
        light: colorRegistry_1.buttonSeparator,
        hcDark: colorRegistry_1.buttonSeparator,
        hcLight: colorRegistry_1.buttonSeparator
    }, (0, nls_1.localize)('extensionButtonSeparator', "Button separator color for extension actions"));
    exports.extensionButtonProminentBackground = (0, colorRegistry_1.registerColor)('extensionButton.prominentBackground', {
        dark: colorRegistry_1.buttonBackground,
        light: colorRegistry_1.buttonBackground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonProminentBackground', "Button background color for extension actions that stand out (e.g. install button)."));
    (0, colorRegistry_1.registerColor)('extensionButton.prominentForeground', {
        dark: colorRegistry_1.buttonForeground,
        light: colorRegistry_1.buttonForeground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonProminentForeground', "Button foreground color for extension actions that stand out (e.g. install button)."));
    (0, colorRegistry_1.registerColor)('extensionButton.prominentHoverBackground', {
        dark: colorRegistry_1.buttonHoverBackground,
        light: colorRegistry_1.buttonHoverBackground,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('extensionButtonProminentHoverBackground', "Button background hover color for extension actions that stand out (e.g. install button)."));
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const errorColor = theme.getColor(colorRegistry_1.editorErrorForeground);
        if (errorColor) {
            collector.addRule(`.extension-editor .header .actions-status-container > .status ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.errorIcon)} { color: ${errorColor}; }`);
            collector.addRule(`.extension-editor .body .subcontent .runtime-status ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.errorIcon)} { color: ${errorColor}; }`);
            collector.addRule(`.monaco-hover.extension-hover .markdown-hover .hover-contents ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.errorIcon)} { color: ${errorColor}; }`);
        }
        const warningColor = theme.getColor(colorRegistry_1.editorWarningForeground);
        if (warningColor) {
            collector.addRule(`.extension-editor .header .actions-status-container > .status ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.warningIcon)} { color: ${warningColor}; }`);
            collector.addRule(`.extension-editor .body .subcontent .runtime-status ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.warningIcon)} { color: ${warningColor}; }`);
            collector.addRule(`.monaco-hover.extension-hover .markdown-hover .hover-contents ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.warningIcon)} { color: ${warningColor}; }`);
        }
        const infoColor = theme.getColor(colorRegistry_1.editorInfoForeground);
        if (infoColor) {
            collector.addRule(`.extension-editor .header .actions-status-container > .status ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.infoIcon)} { color: ${infoColor}; }`);
            collector.addRule(`.extension-editor .body .subcontent .runtime-status ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.infoIcon)} { color: ${infoColor}; }`);
            collector.addRule(`.monaco-hover.extension-hover .markdown-hover .hover-contents ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.infoIcon)} { color: ${infoColor}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvYnJvd3Nlci9leHRlbnNpb25zQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNG1DaEcsc0RBR0M7SUFyaUNNLElBQU0sbUNBQW1DLEdBQXpDLE1BQU0sbUNBQW9DLFNBQVEsZ0JBQU07UUFFOUQsWUFDa0IsU0FBcUIsRUFDckIsT0FBZSxFQUNmLGdCQUFrQyxFQUNsQyxLQUFZLEVBQ0ssY0FBK0IsRUFDaEMsYUFBNkIsRUFDdkIsbUJBQXlDLEVBQy9DLGFBQTZCLEVBQzVCLGNBQStCLEVBQ25DLFVBQXVCLEVBQ0QsZ0NBQW1FLEVBQy9FLG9CQUEyQyxFQUN4QyxjQUF3QyxFQUM3QixrQ0FBdUU7WUFFN0gsS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7WUFmaEMsY0FBUyxHQUFULFNBQVMsQ0FBWTtZQUNyQixZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQ2YscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNsQyxVQUFLLEdBQUwsS0FBSyxDQUFPO1lBQ0ssbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ2hDLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN2Qix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQy9DLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUM1QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbkMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNELHFDQUFnQyxHQUFoQyxnQ0FBZ0MsQ0FBbUM7WUFDL0UseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUN4QyxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDN0IsdUNBQWtDLEdBQWxDLGtDQUFrQyxDQUFxQztRQUc5SCxDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUc7WUFDakIsSUFBSSxJQUFBLDRCQUFtQixFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVsQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLGtEQUE0QixDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNsRSxNQUFNLFdBQVcsR0FBRyxnQkFBSyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQztnQkFDeEksTUFBTSxPQUFPLEdBQUcsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsc0ZBQXNGLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUNqTixNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztvQkFDdEQsSUFBSSxFQUFFLHVCQUFRLENBQUMsSUFBSTtvQkFDbkIsT0FBTztvQkFDUCxhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsa0JBQWtCLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLG9CQUFvQixDQUFDO29CQUM5RyxZQUFZLEVBQUUsSUFBQSxjQUFRLEVBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQztpQkFDeEMsQ0FBQyxDQUFDO2dCQUNILElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsZ0JBQUssQ0FBQyxDQUFDLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQztnQkFDdEksQ0FBQztnQkFDRCxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksa0RBQTRCLENBQUMsc0JBQXNCLEtBQW9DLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSyxFQUFFLENBQUM7Z0JBQzdHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7b0JBQy9CLElBQUksRUFBRSxPQUFPO29CQUNiLE9BQU8sRUFBRSxJQUFBLHdCQUFlLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztvQkFDcEMsT0FBTyxFQUFFLENBQUM7NEJBQ1QsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLHFCQUFxQixDQUFDOzRCQUM1RCxHQUFHLEVBQUUsR0FBRyxFQUFFO2dDQUNULE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsYUFBYSxFQUFFLEVBQUUsd0JBQXdCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQ0FDbEgsYUFBYSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO2dDQUN6QyxPQUFPLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs0QkFDNUIsQ0FBQzt5QkFDRCxDQUFDO29CQUNGLFlBQVksRUFBRSxJQUFBLGNBQVEsRUFBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO2lCQUMxQyxDQUFDLENBQUM7Z0JBQ0gsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsa0RBQTRCLENBQUMsWUFBWSxFQUFFLGtEQUE0QixDQUFDLDBCQUEwQixFQUFFLGtEQUE0QixDQUFDLFNBQVMsRUFBRSxrREFBNEIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQStCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDblAsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFBLHdCQUFlLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQzNELE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxrREFBNEIsQ0FBQyxTQUFTLEtBQW9DLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSyxFQUFFLENBQUM7Z0JBQ2hHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7b0JBQy9CLElBQUksRUFBRSxPQUFPO29CQUNiLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSw2RUFBNkUsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7b0JBQzNOLE9BQU8sRUFBRSxDQUFDOzRCQUNULEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsQ0FBQzs0QkFDbkQsR0FBRyxFQUFFLEdBQUcsRUFBRTtnQ0FDVCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0NBQzlHLGFBQWEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQ0FDekMsT0FBTyxhQUFhLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQzVCLENBQUM7eUJBQ0QsQ0FBQztvQkFDRixZQUFZLEVBQUUsSUFBQSxjQUFRLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQztpQkFDMUMsQ0FBQyxDQUFDO2dCQUNILE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLG9DQUE0QixDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSx1Q0FBdUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQzdNLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSx5Q0FBeUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN4SSxJQUFJLGlCQUFpQixDQUFDO1lBQ3RCLE1BQU0sYUFBYSxHQUFvQixFQUFFLENBQUM7WUFFMUMsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDaEQsSUFBSSxXQUFXLEVBQUUsQ0FBQztnQkFDakIsaUJBQWlCLEdBQUcsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLCtDQUErQyxFQUFFLFdBQVcsb0NBQXFCLEVBQUUsQ0FBQyxDQUFDO2dCQUNoSSxhQUFhLENBQUMsSUFBSSxDQUFDO29CQUNsQixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLDZCQUE2QixDQUFDO29CQUMxRCxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTt3QkFDekQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FDOUIsdUJBQVEsQ0FBQyxJQUFJLEVBQ2IsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLDBFQUEwRSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUNsSSxDQUFDO2dDQUNBLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxhQUFhLEVBQUUsc0JBQXNCLENBQUM7Z0NBQ3RELEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxxREFBd0MsQ0FBQzs2QkFDdkYsQ0FBQyxDQUNGLENBQUM7b0JBQ0gsQ0FBQyxDQUFDO2lCQUNGLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxHQUFHLGdCQUFnQixHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3pGLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsdUJBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFTyxLQUFLLENBQUMsY0FBYztZQUMzQixJQUFJLGdCQUFLLEVBQUUsQ0FBQztnQkFDWCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM1QyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyw4QkFBOEIsSUFBSSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQywrQkFBK0IsRUFBRSxDQUFDO2dCQUNySixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQztZQUN0RSxJQUFJLGNBQWMsK0NBQTZCLElBQUksY0FBYywrQ0FBNkIsSUFBSSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsK0JBQStCLEVBQUUsQ0FBQztnQkFDekssSUFBSSxDQUFDO29CQUNKLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3ZHLElBQUksUUFBUSxJQUFJLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO3dCQUM3RixjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsK0JBQStCLENBQUMsMEJBQTBCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDN0ksQ0FBQztnQkFDRixDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM3QixPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLGNBQWMsMkNBQTJCLEVBQUUsQ0FBQztnQkFDL0MsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELE9BQU8sU0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsVUFBVSxlQUFlLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxpQkFBaUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE9BQU8sYUFBYSxjQUFjLCtDQUE2QixDQUFDLENBQUMsQ0FBQyxtQkFBbUIsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdlEsQ0FBQztLQUVELENBQUE7SUE1SVksa0ZBQW1DO2tEQUFuQyxtQ0FBbUM7UUFPN0MsV0FBQSxnQ0FBZSxDQUFBO1FBQ2YsV0FBQSx1QkFBYyxDQUFBO1FBQ2QsV0FBQSxtQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLHdCQUFjLENBQUE7UUFDZCxXQUFBLDBCQUFlLENBQUE7UUFDZixXQUFBLGlCQUFXLENBQUE7UUFDWCxZQUFBLHVEQUFpQyxDQUFBO1FBQ2pDLFlBQUEscUNBQXFCLENBQUE7UUFDckIsWUFBQSw4Q0FBd0IsQ0FBQTtRQUN4QixZQUFBLHdFQUFtQyxDQUFBO09BaEJ6QixtQ0FBbUMsQ0E0SS9DO0lBRUQsTUFBc0IsZUFBZ0IsU0FBUSxnQkFBTTtRQUFwRDs7WUFLUyxlQUFVLEdBQXNCLElBQUksQ0FBQztRQUk5QyxDQUFDO2lCQVJnQiwyQkFBc0IsR0FBRyxrQkFBa0IsQUFBckIsQ0FBc0I7aUJBQzVDLHNCQUFpQixHQUFHLEdBQUcsZUFBZSxDQUFDLHNCQUFzQixPQUFPLEFBQW5ELENBQW9EO2lCQUNyRSx1QkFBa0IsR0FBRyxHQUFHLGVBQWUsQ0FBQyxzQkFBc0IsUUFBUSxBQUFwRCxDQUFxRDtpQkFDdkUsc0JBQWlCLEdBQUcsR0FBRyxlQUFlLENBQUMsc0JBQXNCLE9BQU8sQUFBbkQsQ0FBb0Q7UUFFckYsSUFBSSxTQUFTLEtBQXdCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDOUQsSUFBSSxTQUFTLENBQUMsU0FBNEIsSUFBSSxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0lBUDVGLDBDQVNDO0lBRUQsTUFBYSx3QkFBeUIsU0FBUSxlQUFlO1FBSzVELElBQUksV0FBVyxLQUFnQixPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRS9ELElBQWEsU0FBUztZQUNyQixPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDeEIsQ0FBQztRQUVELElBQWEsU0FBUyxDQUFDLFNBQTRCO1lBQ2xELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBQzVELEtBQUssQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzdCLENBQUM7UUFJRCxZQUNDLEVBQVUsRUFBRSxLQUFhLEVBQ1IsYUFBa0M7WUFFbkQsS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUZBLGtCQUFhLEdBQWIsYUFBYSxDQUFxQjtZQWhCNUMsaUJBQVksR0FBYyxFQUFFLENBQUM7WUFtQnBDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFBLGdCQUFPLEVBQUMsYUFBYSxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELE1BQU0sQ0FBQyxrQkFBNEI7WUFDbEMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUNoRCxDQUFDO1lBRUQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUV6RyxJQUFJLE9BQU8sR0FBYyxFQUFFLENBQUM7WUFDNUIsS0FBSyxNQUFNLGNBQWMsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO2dCQUNuRCxJQUFJLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDM0IsT0FBTyxHQUFHLENBQUMsR0FBRyxPQUFPLEVBQUUsR0FBRyxjQUFjLEVBQUUsSUFBSSxtQkFBUyxFQUFFLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1lBRTFFLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBRXRELElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDN0IsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBeUIsQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQ3BDLENBQUM7WUFFRCxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNuRSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssa0JBQWtCLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDO1lBQy9ELElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3BDLEtBQUssSUFBSSxrQkFBa0IsQ0FBQztZQUM3QixDQUFDO1lBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDcEIsQ0FBQztRQUVRLEdBQUc7WUFDWCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3BFLE9BQU8sY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFFUyxRQUFRLENBQUMsTUFBdUI7WUFDekMsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ3JCLENBQUM7S0FDRDtJQXJFRCw0REFxRUM7SUFFTSxJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFjLFNBQVEsZUFBZTs7aUJBRWpDLFVBQUssR0FBRyxHQUFHLGVBQWUsQ0FBQyxrQkFBa0Isb0JBQW9CLEFBQTVELENBQTZEO1FBR2xGLElBQUksUUFBUSxDQUFDLFFBQW1DO1lBQy9DLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQzFCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNwQixDQUFDO1FBS0QsWUFDQyxPQUF1QixFQUNNLDBCQUF3RSxFQUM5RSxvQkFBNEQsRUFDaEUsdUJBQTJELEVBQ3RELHFCQUE4RCxFQUN2RSxZQUE0QyxFQUMzQyxhQUE4QyxFQUN6QyxrQkFBd0QsRUFDMUQsZ0JBQW9ELEVBQzdDLGNBQXlEO1lBRW5GLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsZUFBYSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQVYxQywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQzdELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDL0MsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUFtQjtZQUNyQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ3RELGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQzFCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN4Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3pDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDNUIsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBbkIxRSxjQUFTLEdBQThCLElBQUksQ0FBQztZQU1yQyxvQkFBZSxHQUFHLElBQUksaUJBQVMsRUFBRSxDQUFDO1lBZ0JsRCxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsR0FBRyxPQUFPLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQ3RELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNkLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN6RixDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVTLEtBQUssQ0FBQywwQkFBMEI7WUFDekMsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzlCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsMEJBQTBCLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUNwRSxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLHVDQUErQixJQUFJLE1BQU0sSUFBSSxDQUFDLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDN0gsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDO2dCQUM5SCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDcEIsQ0FBQztRQUNGLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxNQUFNLEdBQTRCLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLG1FQUFtRSxDQUFDLENBQUM7Z0JBQzFJLElBQUssaUJBS0o7Z0JBTEQsV0FBSyxpQkFBaUI7b0JBQ3JCLDJFQUFpQixDQUFBO29CQUNqQiw2RkFBMEIsQ0FBQTtvQkFDMUIsbUZBQXFCLENBQUE7b0JBQ3JCLDZEQUFVLENBQUE7Z0JBQ1gsQ0FBQyxFQUxJLGlCQUFpQixLQUFqQixpQkFBaUIsUUFLckI7Z0JBQ0QsTUFBTSxPQUFPLEdBQXVDO29CQUNuRDt3QkFDQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUM7d0JBQ25ELEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhO3FCQUMxQztpQkFDRCxDQUFDO2dCQUVGLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQzlDLE1BQU0sR0FBRyxJQUFBLGNBQVEsRUFBQyw2Q0FBNkMsRUFBRSw4REFBOEQsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBRXZMLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDO29CQUNwRSxPQUFPLENBQUMsSUFBSSxDQUFDO3dCQUNaLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSwwQkFBMEIsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUM7d0JBQzVKLEdBQUcsRUFBRSxLQUFLLElBQUksRUFBRTs0QkFDZixNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUM1SyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7NEJBRXRELE9BQU8saUJBQWlCLENBQUMsc0JBQXNCLENBQUM7d0JBQ2pELENBQUM7cUJBQ0QsQ0FBQyxDQUFDO2dCQUNKLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDcEQsTUFBTSxHQUFHLElBQUEsY0FBUSxFQUFDLDRDQUE0QyxFQUFFLGdGQUFnRixDQUFDLENBQUM7b0JBRWxKLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQztvQkFDekQsT0FBTyxDQUFDLElBQUksQ0FBQzt3QkFDWixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsdUJBQXVCLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLHNCQUFzQixDQUFDO3dCQUM3RyxHQUFHLEVBQUUsS0FBSyxJQUFJLEVBQUU7NEJBQ2YsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQzs0QkFFM0csT0FBTyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQzt3QkFDNUMsQ0FBQztxQkFDRCxDQUFDLENBQUM7Z0JBQ0osQ0FBQztxQkFBTSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUMxRCxNQUFNLEdBQUcsSUFBSSw0QkFBYyxDQUFDLEdBQUcsTUFBTSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7Z0JBQzNGLENBQUM7Z0JBRUQsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7b0JBQ2xELElBQUksRUFBRSx1QkFBUSxDQUFDLE9BQU87b0JBQ3RCLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSx5Q0FBeUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztvQkFDaEgsTUFBTSxFQUFFLElBQUEsZ0JBQVEsRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTO29CQUM3QyxNQUFNLEVBQUUsSUFBQSxnQkFBUSxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUN0QyxlQUFlLEVBQUUsQ0FBQztnQ0FDakIsUUFBUSxFQUFFLE1BQU07NkJBQ2hCLENBQUM7cUJBQ0Y7b0JBQ0QsT0FBTztvQkFDUCxZQUFZLEVBQUU7d0JBQ2IsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE1BQU07cUJBQ25DO2lCQUNELENBQUMsQ0FBQztnQkFDSCxJQUFJLE1BQU0sS0FBSyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDaEQsT0FBTztnQkFDUixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLHFCQUFxQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBRXZILElBQUEsWUFBSyxFQUFDLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLDZGQUE2RixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUVwSzs7Ozs7Ozs7Y0FRRTtZQUNGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVySCxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXJELElBQUksU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDO2dCQUN0QixJQUFBLFlBQUssRUFBQyxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSx3Q0FBd0MsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xILE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN6RSxJQUFJLGdCQUFnQixJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNuSyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3BELElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ1osTUFBTSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7d0JBQzdCLElBQUksQ0FBQzs0QkFDSixPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7d0JBQ3RFLENBQUM7Z0NBQVMsQ0FBQzs0QkFDVixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2xCLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUVGLENBQUM7UUFFTyxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQXFCO1lBQ2pELE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3RFLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZFLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ3RFLENBQUM7WUFDRCxNQUFNLGNBQWMsR0FBRyxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzVFLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzFFLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ3pFLENBQUM7WUFDRCxNQUFNLGlCQUFpQixHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDbEYsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUM3RSxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUM1RSxDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBcUI7WUFDMUMsSUFBSSxDQUFDO2dCQUNKLE9BQU8sTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDL0UsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtQ0FBbUMsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLGFBQWEsb0NBQTRCLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUMvSixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxTQUEwQjtZQUMzRCxNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEIsT0FBTyxnQkFBZ0IsQ0FBQztZQUN6QixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLElBQUEsbUNBQXNCLEVBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNyRixPQUFPLElBQUksT0FBTyxDQUErQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDekQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLHFCQUFxQixDQUFDLEtBQUssSUFBSSxFQUFFO3dCQUNoRixNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUNsRyxJQUFJLGdCQUFnQixFQUFFLENBQUM7NEJBQ3RCLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs0QkFDckIsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUM7d0JBQ3JCLENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRVMsV0FBVztZQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QixDQUFDO1FBRUQsUUFBUSxDQUFDLE9BQWlCO1lBQ3pCLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUMvSixPQUFPLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLDZCQUE2QixDQUFDLENBQUM7WUFDN0UsQ0FBQztZQUNELGlDQUFpQztZQUNqQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsd0JBQXdCLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxvQkFBb0IsRUFBRSxDQUFDO2dCQUNuRixPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsNkJBQTZCLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztZQUNsSixDQUFDO1lBQ0QsNkRBQTZEO1lBQzdELElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxvQkFBb0IsRUFBRSxDQUFDO2dCQUMxQyxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1lBQ2xILENBQUM7WUFDRCxPQUFPLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN2QyxDQUFDOztJQXhOVyxzQ0FBYTs0QkFBYixhQUFhO1FBZXZCLFdBQUEsd0NBQTJCLENBQUE7UUFDM0IsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDhCQUFpQixDQUFBO1FBQ2pCLFdBQUEsOENBQXNCLENBQUE7UUFDdEIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSx3QkFBYyxDQUFBO1FBQ2QsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsb0NBQXdCLENBQUE7T0F2QmQsYUFBYSxDQTBOekI7SUFFTSxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHdCQUF3QjtRQUVsRSxJQUFJLFFBQVEsQ0FBQyxRQUFtQztZQUMvQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQWlCLENBQUUsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUM7WUFDM0UsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELFlBQ3dCLG9CQUEyQyxFQUNyQywwQkFBdUQ7WUFFcEYsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEVBQUUsRUFBRTtnQkFDdEM7b0JBQ0Msb0JBQW9CLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxFQUFFLHdCQUF3QixFQUFFLDBCQUEwQixDQUFDLGlCQUFpQixFQUFFLENBQUM7b0JBQzlILG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsRUFBRSx3QkFBd0IsRUFBRSxDQUFDLDBCQUEwQixDQUFDLGlCQUFpQixFQUFFLENBQUM7aUJBQy9IO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVrQixRQUFRLENBQUMsTUFBcUI7WUFDaEQsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLENBQUM7S0FFRCxDQUFBO0lBdkJZLHNEQUFxQjtvQ0FBckIscUJBQXFCO1FBUS9CLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSx3Q0FBMkIsQ0FBQTtPQVRqQixxQkFBcUIsQ0F1QmpDO0lBRUQsTUFBYSxxQkFBc0IsU0FBUSxlQUFlO2lCQUVqQyxVQUFLLEdBQUcsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO2lCQUM3QyxVQUFLLEdBQUcsR0FBRyxlQUFlLENBQUMsa0JBQWtCLHFCQUFxQixDQUFDO1FBRTNGO1lBQ0MsS0FBSyxDQUFDLHNCQUFzQixFQUFFLHFCQUFxQixDQUFDLEtBQUssRUFBRSxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEcsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcscUJBQXFCLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLHNDQUE4QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JJLENBQUM7O0lBWEYsc0RBWUM7SUFFTSxJQUFlLDBCQUEwQixHQUF6QyxNQUFlLDBCQUEyQixTQUFRLGVBQWU7O2lCQUU3QyxrQkFBYSxHQUFHLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQUFBakMsQ0FBa0M7aUJBQy9DLHFCQUFnQixHQUFHLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQUFBdkMsQ0FBd0M7aUJBRTFELFVBQUssR0FBRyxHQUFHLGVBQWUsQ0FBQyxrQkFBa0Isb0JBQW9CLEFBQTVELENBQTZEO2lCQUNsRSxvQkFBZSxHQUFHLEdBQUcsZUFBZSxDQUFDLGtCQUFrQixxQkFBcUIsQUFBN0QsQ0FBOEQ7UUFJckcsWUFDQyxFQUFVLEVBQ08sTUFBeUMsRUFDekMsa0JBQTJCLEVBQ2YsMEJBQXdFLEVBQ2xFLGdDQUFzRixFQUNwRixrQ0FBd0Y7WUFFN0gsS0FBSyxDQUFDLEVBQUUsRUFBRSw0QkFBMEIsQ0FBQyxhQUFhLEVBQUUsNEJBQTBCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBTjVFLFdBQU0sR0FBTixNQUFNLENBQW1DO1lBQ3pDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBUztZQUNFLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFDL0MscUNBQWdDLEdBQWhDLGdDQUFnQyxDQUFtQztZQUNuRSx1Q0FBa0MsR0FBbEMsa0NBQWtDLENBQXFDO1lBUjlILHNDQUFpQyxHQUFZLElBQUksQ0FBQztZQVdqRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsNEJBQTBCLENBQUMsS0FBSyxDQUFDO1lBRTlDLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDJDQUFpQixFQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakwsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO29CQUM1QixvQ0FBb0M7b0JBQ3BDLElBQUksc0JBQXNCLENBQUMsS0FBSyxzQ0FBOEIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNqRyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQzt3QkFDcEIsSUFBSSxDQUFDLEtBQUssR0FBRyw0QkFBMEIsQ0FBQyxnQkFBZ0IsQ0FBQzt3QkFDekQsSUFBSSxDQUFDLEtBQUssR0FBRyw0QkFBMEIsQ0FBQyxlQUFlLENBQUM7b0JBQ3pELENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLGdDQUFnQztvQkFDaEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7b0JBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUNyQyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFUyxVQUFVO1lBQ25CLGlFQUFpRTtZQUNqRSxJQUNDLENBQUMsSUFBSSxDQUFDLFNBQVM7bUJBQ1osQ0FBQyxJQUFJLENBQUMsTUFBTTttQkFDWixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSzttQkFDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLHFDQUE2QjttQkFDakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLCtCQUF1QjttQkFDMUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLGtEQUEwQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSx1REFBK0MsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsdURBQStDLEVBQzVPLENBQUM7Z0JBQ0YsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsSUFBSSxJQUFBLG9DQUF1QixFQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzVELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELHVCQUF1QjtZQUN2QixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLGdDQUFnQyxDQUFDLDhCQUE4QixJQUFJLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUN2TCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCw4QkFBOEI7WUFDOUIsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQywrQkFBK0IsSUFBSSxJQUFJLENBQUMsa0NBQWtDLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDL0wsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsd0JBQXdCO1lBQ3hCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsNEJBQTRCLElBQUksSUFBSSxDQUFDLGtDQUFrQyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RMLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQzdCLGdCQUFnQjtnQkFDaEIsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyw4QkFBOEIsSUFBSSxJQUFJLENBQUMsa0NBQWtDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ25MLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsdUJBQXVCO2dCQUN2QixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLGdDQUFnQyxDQUFDLCtCQUErQixJQUFJLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUMzTCxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDO2dCQUM1QixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2xCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckQsSUFBQSxZQUFLLEVBQUMsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsNkZBQTZGLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3BLLE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyRixDQUFDOztJQXZHb0IsZ0VBQTBCO3lDQUExQiwwQkFBMEI7UUFjN0MsV0FBQSx3Q0FBMkIsQ0FBQTtRQUMzQixXQUFBLHVEQUFpQyxDQUFBO1FBQ2pDLFdBQUEsd0VBQW1DLENBQUE7T0FoQmhCLDBCQUEwQixDQTBHL0M7SUFFTSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLDBCQUEwQjtRQUVsRSxZQUNDLGtCQUEyQixFQUNFLDBCQUF1RCxFQUNqRCxnQ0FBbUUsRUFDakUsa0NBQXVFO1lBRTVHLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxnQ0FBZ0MsQ0FBQywrQkFBK0IsRUFBRSxrQkFBa0IsRUFBRSwwQkFBMEIsRUFBRSxnQ0FBZ0MsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO1FBQzNOLENBQUM7UUFFUyxlQUFlO1lBQ3hCLE9BQU8sSUFBSSxDQUFDLGdDQUFnQyxDQUFDLCtCQUErQjtnQkFDM0UsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLG1CQUFtQixFQUFFLE9BQU8sRUFBRSxDQUFDLHdIQUF3SCxDQUFDLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsK0JBQStCLENBQUMsS0FBSyxDQUFDO2dCQUM1USxDQUFDLENBQUMsMEJBQTBCLENBQUMsYUFBYSxDQUFDO1FBQzdDLENBQUM7S0FFRCxDQUFBO0lBakJZLGtEQUFtQjtrQ0FBbkIsbUJBQW1CO1FBSTdCLFdBQUEsd0NBQTJCLENBQUE7UUFDM0IsV0FBQSx1REFBaUMsQ0FBQTtRQUNqQyxXQUFBLHdFQUFtQyxDQUFBO09BTnpCLG1CQUFtQixDQWlCL0I7SUFFTSxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLDBCQUEwQjtRQUVqRSxZQUM4QiwwQkFBdUQsRUFDakQsZ0NBQW1FLEVBQ2pFLGtDQUF1RTtZQUU1RyxLQUFLLENBQUMseUJBQXlCLEVBQUUsZ0NBQWdDLENBQUMsOEJBQThCLEVBQUUsS0FBSyxFQUFFLDBCQUEwQixFQUFFLGdDQUFnQyxFQUFFLGtDQUFrQyxDQUFDLENBQUM7UUFDNU0sQ0FBQztRQUVTLGVBQWU7WUFDeEIsT0FBTyxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7S0FFRCxDQUFBO0lBZFksZ0RBQWtCO2lDQUFsQixrQkFBa0I7UUFHNUIsV0FBQSx3Q0FBMkIsQ0FBQTtRQUMzQixXQUFBLHVEQUFpQyxDQUFBO1FBQ2pDLFdBQUEsd0VBQW1DLENBQUE7T0FMekIsa0JBQWtCLENBYzlCO0lBRU0sSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSwwQkFBMEI7UUFFL0QsWUFDOEIsMEJBQXVELEVBQ2pELGdDQUFtRSxFQUNqRSxrQ0FBdUU7WUFFNUcsS0FBSyxDQUFDLHVCQUF1QixFQUFFLGdDQUFnQyxDQUFDLDRCQUE0QixFQUFFLEtBQUssRUFBRSwwQkFBMEIsRUFBRSxnQ0FBZ0MsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO1FBQ3hNLENBQUM7UUFFUyxlQUFlO1lBQ3hCLE9BQU8sSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUMxRCxDQUFDO0tBRUQsQ0FBQTtJQWRZLDRDQUFnQjsrQkFBaEIsZ0JBQWdCO1FBRzFCLFdBQUEsd0NBQTJCLENBQUE7UUFDM0IsV0FBQSx1REFBaUMsQ0FBQTtRQUNqQyxXQUFBLHdFQUFtQyxDQUFBO09BTHpCLGdCQUFnQixDQWM1QjtJQUVNLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsZUFBZTs7aUJBRW5DLG1CQUFjLEdBQUcsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsV0FBVyxDQUFDLEFBQTNDLENBQTRDO2lCQUNsRCxzQkFBaUIsR0FBRyxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLEFBQTNDLENBQTRDO2lCQUU3RCxtQkFBYyxHQUFHLEdBQUcsZUFBZSxDQUFDLGtCQUFrQixZQUFZLEFBQXBELENBQXFEO2lCQUNuRSxzQkFBaUIsR0FBRyxHQUFHLGVBQWUsQ0FBQyxrQkFBa0IseUJBQXlCLEFBQWpFLENBQWtFO1FBRTNHLFlBQytDLDBCQUF1RCxFQUNwRSxhQUE2QjtZQUU5RCxLQUFLLENBQUMsc0JBQXNCLEVBQUUsaUJBQWUsQ0FBQyxjQUFjLEVBQUUsaUJBQWUsQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFIdkQsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUNwRSxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFHOUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUVuQyxJQUFJLEtBQUssd0NBQWdDLEVBQUUsQ0FBQztnQkFDM0MsSUFBSSxDQUFDLEtBQUssR0FBRyxpQkFBZSxDQUFDLGlCQUFpQixDQUFDO2dCQUMvQyxJQUFJLENBQUMsS0FBSyxHQUFHLGlCQUFlLENBQUMsaUJBQWlCLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsaUJBQWUsQ0FBQyxjQUFjLENBQUM7WUFDNUMsSUFBSSxDQUFDLEtBQUssR0FBRyxpQkFBZSxDQUFDLGNBQWMsQ0FBQztZQUM1QyxJQUFJLENBQUMsT0FBTyxHQUFHLGlCQUFlLENBQUMsY0FBYyxDQUFDO1lBRTlDLElBQUksS0FBSyxxQ0FBNkIsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUEsWUFBSyxFQUFDLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLHFDQUFxQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUU5RyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDaEUsSUFBQSxZQUFLLEVBQUMsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsdUZBQXVGLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3BLLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFBLHdCQUFlLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNsRCxDQUFDO1FBQ0YsQ0FBQzs7SUE1RFcsMENBQWU7OEJBQWYsZUFBZTtRQVN6QixXQUFBLHdDQUEyQixDQUFBO1FBQzNCLFdBQUEsd0JBQWMsQ0FBQTtPQVZKLGVBQWUsQ0E2RDNCO0lBRUQsTUFBZSxvQkFBcUIsU0FBUSxlQUFlO2lCQUVsQyxpQkFBWSxHQUFHLEdBQUcsZUFBZSxDQUFDLGtCQUFrQixtQkFBbUIsQUFBM0QsQ0FBNEQ7aUJBQ3hFLGtCQUFhLEdBQUcsR0FBRyxvQkFBb0IsQ0FBQyxZQUFZLFdBQVcsQUFBbEQsQ0FBbUQ7UUFJeEYsWUFDQyxFQUFVLEVBQUUsS0FBeUIsRUFDbEIsMEJBQXVEO1lBRTFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLG9CQUFvQixDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUZ6QywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBSjFELG9CQUFlLEdBQUcsSUFBSSxpQkFBUyxFQUFFLENBQUM7WUFPbEQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFFTyxLQUFLLENBQUMsMEJBQTBCO1lBQ3ZDLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsWUFBWSxDQUFDLGFBQWEsQ0FBQztZQUV4QyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDcEMsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxxQ0FBNkIsQ0FBQztZQUV0RSxJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsSUFBSSxXQUFXLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7WUFDcEUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLGFBQWEsQ0FBQztRQUNwRyxDQUFDOztJQUdLLElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQWEsU0FBUSxvQkFBb0I7UUFFckQsWUFDa0IsT0FBZ0IsRUFDSiwwQkFBdUQsRUFDMUMsb0JBQTJDO1lBRXJGLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztZQUpwRSxZQUFPLEdBQVAsT0FBTyxDQUFTO1lBRVMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtRQUd0RixDQUFDO1FBRVEsTUFBTTtZQUNkLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNmLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDbEksQ0FBQztRQUNGLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUEsWUFBSyxFQUFDLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLGdEQUFnRCxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUNwSixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFTyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQXFCO1lBQzFDLElBQUksQ0FBQztnQkFDSixNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLHdCQUF3QixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdkksSUFBQSxZQUFLLEVBQUMsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsa0RBQWtELEVBQUUsU0FBUyxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUNoSixDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDZCxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1DQUFtQyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsYUFBYSxtQ0FBMkIsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDdkosQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBakNZLG9DQUFZOzJCQUFaLFlBQVk7UUFJdEIsV0FBQSx3Q0FBMkIsQ0FBQTtRQUMzQixXQUFBLHFDQUFxQixDQUFBO09BTFgsWUFBWSxDQWlDeEI7SUFFTSxJQUFNLGtDQUFrQyxHQUF4QyxNQUFNLGtDQUFtQyxTQUFRLGVBQWU7O2lCQUV0RCxPQUFFLEdBQUcsMERBQTBELEFBQTdELENBQThEO2lCQUNoRSxVQUFLLEdBQUcsSUFBQSxlQUFTLEVBQUMsdUJBQXVCLEVBQUUsYUFBYSxDQUFDLEFBQXBELENBQXFEO2lCQUVsRCxpQkFBWSxHQUFHLEdBQUcsZUFBZSxDQUFDLHNCQUFzQixjQUFjLEFBQTFELENBQTJEO2lCQUN2RSxrQkFBYSxHQUFHLEdBQUcsb0NBQWtDLENBQUMsWUFBWSxPQUFPLEFBQTVELENBQTZEO1FBRWxHLFlBQ2tCLGtCQUEyQixFQUMzQix5QkFBeUQsRUFDNUIsMEJBQXVELEVBQzlFLG9CQUEyQztZQUdsRSxLQUFLLENBQUMsb0NBQWtDLENBQUMsRUFBRSxFQUFFLG9DQUFrQyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsb0NBQWtDLENBQUMsYUFBYSxDQUFDLENBQUM7WUFOOUgsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFTO1lBQzNCLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBZ0M7WUFDNUIsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUtyRyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNoRSxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyx1Q0FBMEIsQ0FBQyxFQUFFLENBQUM7b0JBQ3hELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDZixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFUSxNQUFNO1lBQ2QsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxvQ0FBa0MsQ0FBQyxhQUFhLENBQUM7WUFDOUQsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzlCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsa0JBQWtCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUsscUNBQTZCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hILE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLGtCQUFrQixFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNwRyxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsb0NBQWtDLENBQUMsWUFBWSxDQUFDO1lBQzdELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN2RixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUc7WUFDakIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLGdCQUFnQixHQUFHLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNqRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFdEcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN0QixJQUFBLFlBQUssRUFBQyxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSwwQkFBMEIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDN0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUEsWUFBSyxFQUFDLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLDJCQUEyQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUMvRixDQUFDO1FBQ0YsQ0FBQzs7SUF6RFcsZ0ZBQWtDO2lEQUFsQyxrQ0FBa0M7UUFXNUMsV0FBQSx3Q0FBMkIsQ0FBQTtRQUMzQixXQUFBLHFDQUFxQixDQUFBO09BWlgsa0NBQWtDLENBMEQ5QztJQUVNLElBQU0sbUNBQW1DLEdBQXpDLE1BQU0sbUNBQW9DLFNBQVEsZUFBZTs7aUJBRXZELE9BQUUsR0FBRywyREFBMkQsQUFBOUQsQ0FBK0Q7aUJBQ2pFLFVBQUssR0FBRyxJQUFBLGNBQVEsRUFBQyxvQ0FBb0MsRUFBRSxrQ0FBa0MsQ0FBQyxBQUFyRixDQUFzRjtRQUUzRyxZQUMrQywwQkFBdUQ7WUFFckcsS0FBSyxDQUFDLHFDQUFtQyxDQUFDLEVBQUUsRUFBRSxxQ0FBbUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUYzQywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1FBR3RHLENBQUM7UUFFUSxNQUFNLEtBQUssQ0FBQztRQUVaLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3JCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBQSxZQUFLLEVBQUMsSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUsb0NBQW9DLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDN0gsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNHLE1BQU0sSUFBSSxDQUFDLDBCQUEwQixDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDaEgsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN0QixJQUFBLFlBQUssRUFBQyxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSwwQkFBMEIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDN0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUEsWUFBSyxFQUFDLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLDJCQUEyQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUMvRixDQUFDO1FBQ0YsQ0FBQzs7SUF6Qlcsa0ZBQW1DO2tEQUFuQyxtQ0FBbUM7UUFNN0MsV0FBQSx3Q0FBMkIsQ0FBQTtPQU5qQixtQ0FBbUMsQ0EwQi9DO0lBRU0sSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxlQUFlOztpQkFFNUMsaUJBQVksR0FBRyxHQUFHLGVBQWUsQ0FBQyxrQkFBa0IsVUFBVSxBQUFsRCxDQUFtRDtpQkFDL0Qsa0JBQWEsR0FBRyxHQUFHLGtDQUFnQyxDQUFDLFlBQVksV0FBVyxBQUE5RCxDQUErRDtRQUVwRyxZQUNrQixLQUFjLEVBQ00sMEJBQXVEO1lBRTVGLEtBQUssQ0FBQyw2Q0FBNkMsRUFBRSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxTQUFTLENBQUMsRUFBRSxrQ0FBZ0MsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFIcEksVUFBSyxHQUFMLEtBQUssQ0FBUztZQUNNLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFHNUYsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHLGtDQUFnQyxDQUFDLGFBQWEsQ0FBQztZQUM1RCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQztnQkFDNUIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxxQ0FBNkIsRUFBRSxDQUFDO2dCQUN2RCxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxTQUFTLEVBQUUsQ0FBQztnQkFDaEQsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQ3ZELElBQUksSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDJDQUFpQixFQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDOUYsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLGtDQUFnQyxDQUFDLFlBQVksQ0FBQztZQUMzRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDOUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDekUsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsQ0FBQztnQkFDakQsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUNuQyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxTixNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZHLENBQUM7O0lBM0NXLDRFQUFnQzsrQ0FBaEMsZ0NBQWdDO1FBTzFDLFdBQUEsd0NBQTJCLENBQUE7T0FQakIsZ0NBQWdDLENBNEM1QztJQUVELE1BQWEseUNBQTBDLFNBQVEseURBQWdDO1FBRTlGLFlBQ0MsTUFBZ0MsRUFDaEMsT0FBMEUsRUFDMUUsbUJBQXlDO1lBRXpDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFUSxNQUFNLENBQUMsU0FBc0I7WUFDckMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDcEIsQ0FBQztRQUVrQixXQUFXO1lBQzdCLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNwQixJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLDBCQUEwQixJQUFJLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDaEcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBNkIsSUFBSSxDQUFDLE9BQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUMxRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUE2QixJQUFJLENBQUMsT0FBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDckksQ0FBQztRQUNGLENBQUM7S0FFRDtJQXZCRCw4RkF1QkM7SUFFTSxJQUFlLHVCQUF1QixHQUF0QyxNQUFlLHVCQUF3QixTQUFRLGVBQWU7UUFFcEUsWUFDQyxFQUFVLEVBQ1YsS0FBYSxFQUNiLFFBQWdCLEVBQ2hCLE9BQWdCLEVBQ08sb0JBQXFEO1lBRTVFLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUZILHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFLckUsb0JBQWUsR0FBc0MsSUFBSSxDQUFDO1FBRmxFLENBQUM7UUFHRCxvQkFBb0IsQ0FBQyxPQUErQjtZQUNuRCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMEJBQTBCLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzNHLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM3QixDQUFDO1FBRWUsR0FBRyxDQUFDLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixFQUFnRTtZQUN2SCxJQUFJLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxZQUFZLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUNuRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQ0QsQ0FBQTtJQXRCcUIsMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFPMUMsV0FBQSxxQ0FBcUIsQ0FBQTtPQVBGLHVCQUF1QixDQXNCNUM7SUFFTSxJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLGdDQUFjO1FBRTdELFlBQ0MsTUFBK0IsRUFDL0IsT0FBK0IsRUFDTyxrQkFBdUM7WUFFN0UsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxHQUFHLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRnZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7UUFHOUUsQ0FBQztRQUVNLFFBQVEsQ0FBQyxnQkFBNkIsRUFBRSxvQkFBNkI7WUFDM0UsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDbEQsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDakUsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLEVBQUUsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsZUFBZSxDQUFDLEdBQUcsR0FBRyxlQUFlLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRSxDQUFDO2dCQUNqRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDO29CQUN2QyxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTTtvQkFDdkIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU87b0JBQ3pCLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtvQkFDL0IsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksb0JBQW9CLEVBQUUsQ0FBQzt3QkFBQyxJQUFBLCtCQUFtQixFQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUM3RSxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQztRQUVPLFVBQVUsQ0FBQyxnQkFBNkI7WUFDL0MsSUFBSSxPQUFPLEdBQWMsRUFBRSxDQUFDO1lBQzVCLEtBQUssTUFBTSxXQUFXLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDNUMsT0FBTyxHQUFHLENBQUMsR0FBRyxPQUFPLEVBQUUsR0FBRyxXQUFXLEVBQUUsSUFBSSxtQkFBUyxFQUFFLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDeEUsQ0FBQztLQUNELENBQUE7SUEvQlksZ0VBQTBCO3lDQUExQiwwQkFBMEI7UUFLcEMsV0FBQSxpQ0FBbUIsQ0FBQTtPQUxULDBCQUEwQixDQStCdEM7SUFFRCxLQUFLLFVBQVUsMkJBQTJCLENBQUMsU0FBd0MsRUFBRSxpQkFBcUMsRUFBRSxvQkFBMkM7UUFDdEssT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFDLFFBQVEsRUFBQyxFQUFFO1lBQzNELE1BQU0sMEJBQTBCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3Q0FBMkIsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0JBQVksQ0FBQyxDQUFDO1lBQy9DLE1BQU0sK0JBQStCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyREFBZ0MsQ0FBQyxDQUFDO1lBQ3ZGLE1BQU0sc0NBQXNDLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxrRUFBdUMsQ0FBQyxDQUFDO1lBQ3JHLE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4Q0FBc0IsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sVUFBVSxHQUFvQixFQUFFLENBQUM7WUFFdkMsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDeEQsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLG9CQUFvQixFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUM3RCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMscUNBQXFDLEVBQUUsU0FBUyxDQUFDLEtBQUssSUFBSSxJQUFBLHlDQUE0QixFQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsOEJBQThCLEVBQUUsU0FBUyxDQUFDLEtBQUssSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztnQkFDMUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLDRCQUE0QixFQUFFLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7Z0JBQzdFLElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNyQixVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsaUJBQWlCLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxDQUFDO2dCQUNELFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQywyQkFBMkIsRUFBRSxTQUFTLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUNsSyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMseUJBQXlCLEVBQUUsU0FBUyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFDOUosVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLHNCQUFzQixFQUFFLFNBQVMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pKLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUMsK0JBQStCLENBQUMsK0JBQStCLEVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEosVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLGlDQUFpQyxFQUFFLCtCQUErQixDQUFDLCtCQUErQixFQUFFLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxRQUFRLG9EQUE0QyxDQUFDLENBQUMsQ0FBQztnQkFDck4sVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLDZCQUE2QixFQUFFLHNDQUFzQyxDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0ssSUFBSSxTQUFTLENBQUMsS0FBSyxxQ0FBNkIsRUFBRSxDQUFDO29CQUNsRCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsaUJBQWlCLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsQ0FBQztnQkFDRCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsdUNBQXVDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO2dCQUNuRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsdUNBQXVDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDMUYsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLHFDQUFxQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7Z0JBQzlHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxzQ0FBc0MsRUFBRSxTQUFTLENBQUMsT0FBTyxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztnQkFDbkcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLDRCQUE0QixFQUFFLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7Z0JBRTdFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMscUJBQXFCLENBQUMsY0FBYyxFQUFFLEVBQUUscUJBQXFCLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxxQkFBcUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOU0sVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLHlCQUF5QixFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hILFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyw0QkFBNEIsRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0SCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsK0JBQStCLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU1SCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsMEJBQTBCLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUYsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLCtCQUErQixFQUFFLFNBQVMsQ0FBQyxPQUFPLElBQUksbUJBQVEsS0FBSyxJQUFBLHlCQUFTLEVBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwSCxDQUFDO1lBRUQsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxnQkFBTSxDQUFDLGdCQUFnQixFQUFFLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzFHLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLE9BQU8sYUFBYSxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELFNBQVMsU0FBUyxDQUFDLGFBQW9FLEVBQUUsb0JBQTJDO1FBQ25JLE1BQU0sTUFBTSxHQUFnQixFQUFFLENBQUM7UUFDL0IsS0FBSyxNQUFNLENBQUMsRUFBRSxPQUFPLENBQUMsSUFBSSxhQUFhLEVBQUUsQ0FBQztZQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ2hDLElBQUksTUFBTSxZQUFZLHVCQUFhLEVBQUUsQ0FBQztvQkFDckMsT0FBTyxNQUFNLENBQUM7Z0JBQ2YsQ0FBQztnQkFDRCxPQUFPLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM3RSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUdNLEtBQUssVUFBVSxxQkFBcUIsQ0FBQyxTQUF3QyxFQUFFLGlCQUFxQyxFQUFFLG9CQUEyQztRQUN2SyxNQUFNLGFBQWEsR0FBRyxNQUFNLDJCQUEyQixDQUFDLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQzVHLE9BQU8sU0FBUyxDQUFDLGFBQWEsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFTSxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHVCQUF1Qjs7aUJBRWpELE9BQUUsR0FBRyxtQkFBbUIsQUFBdEIsQ0FBdUI7aUJBRWpCLFVBQUssR0FBRyxHQUFHLGVBQWUsQ0FBQyxpQkFBaUIsVUFBVSxHQUFHLHFCQUFTLENBQUMsV0FBVyxDQUFDLHFDQUFtQixDQUFDLEFBQTlGLENBQStGO2lCQUNwRyw2QkFBd0IsR0FBRyxHQUFHLHVCQUFxQixDQUFDLEtBQUssT0FBTyxBQUF4QyxDQUF5QztRQUV6RixZQUN3QixvQkFBMkMsRUFDOUIsZ0JBQW1DLEVBQ2xDLGlCQUFxQztZQUcxRSxLQUFLLENBQUMsdUJBQXFCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFKaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNsQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBSzFFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBQSxjQUFRLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRTVDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZTtZQUNwQixNQUFNLE1BQU0sR0FBZ0IsRUFBRSxDQUFDO1lBQy9CLE1BQU0sd0JBQXdCLEdBQUcsTUFBTSwyQkFBMkIsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUN0SSxNQUFNLFlBQVksR0FBYyxFQUFFLEVBQUUsY0FBYyxHQUFjLEVBQUUsRUFBRSxhQUFhLEdBQWMsRUFBRSxFQUFFLGlCQUFpQixHQUFnQixFQUFFLENBQUM7WUFDdkksS0FBSyxNQUFNLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxJQUFJLHdCQUF3QixFQUFFLENBQUM7Z0JBQ3pELElBQUksS0FBSyxLQUFLLGtDQUFxQixFQUFFLENBQUM7b0JBQ3JDLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JGLENBQUM7cUJBQU0sSUFBSSxLQUFLLEtBQUssaUNBQW9CLEVBQUUsQ0FBQztvQkFDM0MsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEYsQ0FBQztxQkFBTSxJQUFJLEtBQUssS0FBSyxnQ0FBbUIsRUFBRSxDQUFDO29CQUMxQyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO2dCQUNyRixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNYLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUM7Z0JBQzlELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUM7YUFDbEUsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDWCxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHFCQUFxQixDQUFDO2dCQUMvRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHlCQUF5QixDQUFDO2FBQ25FLENBQUMsQ0FBQztZQUNILElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNYLEdBQUcsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQztnQkFDckUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUM7YUFDekQsQ0FBQyxDQUFDO1lBRUgsaUJBQWlCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRTNELE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFO2dCQUN2RCxJQUFJLGVBQWUsWUFBWSxlQUFlLEVBQUUsQ0FBQztvQkFDaEQsZUFBZSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUM1QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlDQUFpQyxFQUFFLENBQUM7WUFDaEUsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsWUFBWSxFQUFFLE1BQU0sSUFBSSxDQUFDLGVBQWUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMsS0FBSyxHQUFHLHVCQUFxQixDQUFDLHdCQUF3QixDQUFDO1lBQzVELElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztnQkFDbkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLHFDQUE2QixDQUFDO2dCQUNsRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksS0FBSyx3Q0FBZ0MsQ0FBQyxDQUFDLENBQUMsdUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyx1QkFBcUIsQ0FBQyx3QkFBd0IsQ0FBQztZQUNuSixDQUFDO1FBQ0YsQ0FBQzs7SUFqRlcsc0RBQXFCO29DQUFyQixxQkFBcUI7UUFRL0IsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDhCQUFpQixDQUFBO1FBQ2pCLFdBQUEsK0JBQWtCLENBQUE7T0FWUixxQkFBcUIsQ0FrRmpDO0lBRUQsTUFBYSxvQ0FBcUMsU0FBUSx1QkFBdUI7UUFFaEYsWUFDa0IsaUJBQXFDLEVBQ3RELG9CQUEyQztZQUUzQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsRUFBRSxFQUFFLEdBQUcsZUFBZSxDQUFDLGlCQUFpQixXQUFXLHFCQUFTLENBQUMsV0FBVyxDQUFDLHFDQUFtQixDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUhySixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBSXRELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBQSxjQUFRLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFRCxNQUFNLEtBQVcsQ0FBQztRQUVULEtBQUssQ0FBQyxHQUFHO1lBQ2pCLE1BQU0sWUFBWSxHQUFnQixFQUFFLENBQUM7WUFDckMsQ0FBQyxNQUFNLHFCQUFxQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2hKLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFO2dCQUM3RCxJQUFJLGVBQWUsWUFBWSxlQUFlLEVBQUUsQ0FBQztvQkFDaEQsZUFBZSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUM1QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFlBQVksRUFBRSxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7S0FFRDtJQXZCRCxvRkF1QkM7SUFFTSxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLGVBQWU7UUFFM0QsWUFDa0IsTUFBZSxFQUNjLDBCQUF1RDtZQUVyRyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFIZCxXQUFNLEdBQU4sTUFBTSxDQUFTO1lBQ2MsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtRQUd0RyxDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3JCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyw4Q0FBaUMsRUFBRSxDQUFDO2dCQUMxRCxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMxRixDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssa0NBQWtDLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3JFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2RixDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssbUNBQW1DLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3RFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDakcsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDcEMsQ0FBQztRQUNGLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBQSx3Q0FBYyxFQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztvQkFDdkksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFBLHdDQUFjLEVBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQzt3QkFDdkcsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25DLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQS9CWSwwREFBdUI7c0NBQXZCLHVCQUF1QjtRQUlqQyxXQUFBLHdDQUEyQixDQUFBO09BSmpCLHVCQUF1QixDQStCbkM7SUFFTSxJQUFNLCtCQUErQixHQUFyQyxNQUFNLCtCQUFnQyxTQUFRLGVBQWU7O2lCQUVuRCxPQUFFLEdBQUcsNkNBQTZDLEFBQWhELENBQWlEO2lCQUNuRCxVQUFLLEdBQUcsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsYUFBYSxDQUFDLEFBQWxELENBQW1EO2lCQUVoRCxpQkFBWSxHQUFHLEdBQUcsZUFBZSxDQUFDLGtCQUFrQixjQUFjLEFBQXRELENBQXVEO2lCQUNuRSxrQkFBYSxHQUFHLEdBQUcsaUNBQStCLENBQUMsWUFBWSxPQUFPLEFBQXpELENBQTBEO1FBRS9GLFlBQytDLDBCQUF1RDtZQUVyRyxLQUFLLENBQUMsaUNBQStCLENBQUMsRUFBRSxFQUFFLGlDQUErQixDQUFDLEtBQUssRUFBRSxpQ0FBK0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUZsRiwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBR3JHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFUSxNQUFNO1lBQ2QsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxpQ0FBK0IsQ0FBQyxhQUFhLENBQUM7WUFDM0QsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzlCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUsscUNBQTZCLEVBQUUsQ0FBQztnQkFDdkQsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUMxQyxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3RFLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDaEYsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLGlDQUErQixDQUFDLFlBQVksQ0FBQztZQUUxRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBQSxjQUFRLEVBQUMsNkJBQTZCLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztnQkFDbEYsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSx5REFBeUQsQ0FBQyxDQUFDO1lBQ3JILENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLCtCQUErQixDQUFDLENBQUM7Z0JBQ2xGLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUscUZBQXFGLENBQUMsQ0FBQztZQUM3SSxDQUFDO1FBQ0YsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3JCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDNUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7O0lBekRXLDBFQUErQjs4Q0FBL0IsK0JBQStCO1FBU3pDLFdBQUEsd0NBQTJCLENBQUE7T0FUakIsK0JBQStCLENBMEQzQztJQUVNLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsZUFBZTs7aUJBRS9DLE9BQUUsR0FBRyxvREFBb0QsQUFBdkQsQ0FBd0Q7aUJBQzFELFVBQUssR0FBRyxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSw0QkFBNEIsQ0FBQyxBQUFwRSxDQUFxRTtRQUUxRixZQUMrQywwQkFBdUQsRUFDMUQsdUJBQWlELEVBQ3ZELGlCQUFxQyxFQUNsQyxvQkFBMkMsRUFDbEQsYUFBNkI7WUFFOUQsS0FBSyxDQUFDLDZCQUEyQixDQUFDLEVBQUUsRUFBRSw2QkFBMkIsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFOL0QsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUMxRCw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ3ZELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNsRCxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFHOUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLHFDQUE2QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUM7UUFDdk8sQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBVSxDQUFDLE1BQU8sQ0FBQywwQkFBMEIsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3BHLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxTQUFVLENBQUMsT0FBUSxFQUFFLElBQUksQ0FBQyxTQUFVLENBQUMsS0FBTSxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM3SixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN6QixNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hHLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDdEMsT0FBTztvQkFDTixFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU87b0JBQ2IsS0FBSyxFQUFFLENBQUMsQ0FBQyxPQUFPO29CQUNoQixXQUFXLEVBQUUsR0FBRyxJQUFBLGNBQU8sRUFBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFBLGNBQVEsRUFBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLFNBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtvQkFDak8sTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDO29CQUNmLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUU7b0JBQzlGLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxtQkFBbUI7aUJBQzFDLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQ25EO2dCQUNDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsMkJBQTJCLENBQUM7Z0JBQ25FLGFBQWEsRUFBRSxJQUFJO2FBQ25CLENBQUMsQ0FBQztZQUNKLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1YsSUFBSSxJQUFJLENBQUMsU0FBVSxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ3pDLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxJQUFJLENBQUM7b0JBQ0osSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ2pCLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUN4TyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFVLEVBQUUsRUFBRSx3QkFBd0IsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO29CQUNySSxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFVLEVBQUUsRUFBRSx3QkFBd0IsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUMxSSxDQUFDO2dCQUNGLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtQ0FBbUMsRUFBRSxJQUFJLENBQUMsU0FBVSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxvQ0FBNEIsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzlMLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDOztJQTlEVyxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQU1yQyxXQUFBLHdDQUEyQixDQUFBO1FBQzNCLFdBQUEsOENBQXdCLENBQUE7UUFDeEIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsd0JBQWMsQ0FBQTtPQVZKLDJCQUEyQixDQWdFdkM7SUFFTSxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLGVBQWU7O2lCQUU1QyxPQUFFLEdBQUcsK0JBQStCLEFBQWxDLENBQW1DO2lCQUNyQyxVQUFLLEdBQUcsSUFBQSxjQUFRLEVBQUMsMEJBQTBCLEVBQUUsb0JBQW9CLENBQUMsQUFBN0QsQ0FBOEQ7UUFFbkYsWUFDK0MsMEJBQXVELEVBQzlDLDBCQUFnRTtZQUV2SCxLQUFLLENBQUMsMEJBQXdCLENBQUMsRUFBRSxFQUFFLDBCQUF3QixDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUh6RCwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQzlDLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBc0M7WUFHdkgsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQyxpQ0FBaUMsRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO1lBQzNHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFRCxNQUFNO1lBQ0wsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDckIsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUNqRixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxxQ0FBNkI7dUJBQzVELENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQzt1QkFDaEUsSUFBSSxDQUFDLDBCQUEwQixDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEYsQ0FBQztRQUNGLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUywyQ0FBbUMsQ0FBQztRQUN4RyxDQUFDOztJQTVCVyw0REFBd0I7dUNBQXhCLHdCQUF3QjtRQU1sQyxXQUFBLHdDQUEyQixDQUFBO1FBQzNCLFdBQUEsMERBQW9DLENBQUE7T0FQMUIsd0JBQXdCLENBNkJwQztJQUVNLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsZUFBZTs7aUJBRXhDLE9BQUUsR0FBRywyQkFBMkIsQUFBOUIsQ0FBK0I7aUJBQ2pDLFVBQUssR0FBRyxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSxRQUFRLENBQUMsQUFBN0MsQ0FBOEM7UUFFbkUsWUFDK0MsMEJBQXVELEVBQzlDLDBCQUFnRTtZQUV2SCxLQUFLLENBQUMsc0JBQW9CLENBQUMsRUFBRSxFQUFFLHNCQUFvQixDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUhqRCwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQzlDLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBc0M7WUFHdkgsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQ2hGLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFRCxNQUFNO1lBQ0wsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDckIsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUNqRixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxxQ0FBNkI7dUJBQzVELElBQUksQ0FBQywwQkFBMEIsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQzt1QkFDeEUsSUFBSSxDQUFDLDBCQUEwQixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0UsQ0FBQztRQUNGLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUywwQ0FBa0MsQ0FBQztRQUN2RyxDQUFDOztJQTVCVyxvREFBb0I7bUNBQXBCLG9CQUFvQjtRQU05QixXQUFBLHdDQUEyQixDQUFBO1FBQzNCLFdBQUEsMERBQW9DLENBQUE7T0FQMUIsb0JBQW9CLENBNkJoQztJQUVNLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsZUFBZTs7aUJBRTdDLE9BQUUsR0FBRyxnQ0FBZ0MsQUFBbkMsQ0FBb0M7aUJBQ3RDLFVBQUssR0FBRyxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSxxQkFBcUIsQ0FBQyxBQUEvRCxDQUFnRTtRQUVyRixZQUM0Qyx1QkFBaUQsRUFDOUMsMEJBQXVELEVBQzlDLDBCQUFnRSxFQUNuRixnQkFBbUM7WUFFdkUsS0FBSyxDQUFDLDJCQUF5QixDQUFDLEVBQUUsRUFBRSwyQkFBeUIsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFMOUQsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUM5QywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQzlDLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBc0M7WUFDbkYscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUd2RSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsY0FBUSxFQUFDLGtDQUFrQyxFQUFFLCtDQUErQyxDQUFDLENBQUM7WUFDN0csSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMscUJBQXFCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDJDQUFpQixFQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsaUJBQWlCLEVBQUUsaUNBQXlCLENBQUMsRUFBRSxDQUFDO2dCQUNyUyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxxQ0FBNkI7dUJBQzVELENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLDRDQUFvQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSw2Q0FBcUMsQ0FBQzt1QkFDM0ksSUFBSSxDQUFDLDBCQUEwQixDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEYsQ0FBQztRQUNGLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyw0Q0FBb0MsQ0FBQztRQUN6RyxDQUFDOztJQS9CVyw4REFBeUI7d0NBQXpCLHlCQUF5QjtRQU1uQyxXQUFBLG9DQUF3QixDQUFBO1FBQ3hCLFdBQUEsd0NBQTJCLENBQUE7UUFDM0IsV0FBQSwwREFBb0MsQ0FBQTtRQUNwQyxXQUFBLDhCQUFpQixDQUFBO09BVFAseUJBQXlCLENBZ0NyQztJQUVNLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsZUFBZTs7aUJBRXpDLE9BQUUsR0FBRyw0QkFBNEIsQUFBL0IsQ0FBZ0M7aUJBQ2xDLFVBQUssR0FBRyxJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSxTQUFTLENBQUMsQUFBL0MsQ0FBZ0Q7UUFFckUsWUFDK0MsMEJBQXVELEVBQzlDLDBCQUFnRSxFQUNuRixnQkFBbUM7WUFFdkUsS0FBSyxDQUFDLHVCQUFxQixDQUFDLEVBQUUsRUFBRSx1QkFBcUIsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFKbkQsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUM5QywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQXNDO1lBQ25GLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFHdkUsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBQ2xGLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNkLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEYsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNyQixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBQSwyQ0FBaUIsRUFBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN4TixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxxQ0FBNkI7dUJBQzVELENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLDRDQUFvQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSw2Q0FBcUMsQ0FBQzt1QkFDM0ksSUFBSSxDQUFDLDBCQUEwQixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0UsQ0FBQztRQUNGLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUywyQ0FBbUMsQ0FBQztRQUN4RyxDQUFDOztJQTlCVyxzREFBcUI7b0NBQXJCLHFCQUFxQjtRQU0vQixXQUFBLHdDQUEyQixDQUFBO1FBQzNCLFdBQUEsMERBQW9DLENBQUE7UUFDcEMsV0FBQSw4QkFBaUIsQ0FBQTtPQVJQLHFCQUFxQixDQStCakM7SUFFTSxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHdCQUF3QjtRQUVqRSxZQUN3QixvQkFBMkM7WUFFbEUsS0FBSyxDQUFDLG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsRUFBRTtnQkFDOUQ7b0JBQ0Msb0JBQW9CLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFDO29CQUN6RCxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUM7aUJBQzdEO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUE7SUFaWSxvREFBb0I7bUNBQXBCLG9CQUFvQjtRQUc5QixXQUFBLHFDQUFxQixDQUFBO09BSFgsb0JBQW9CLENBWWhDO0lBRU0sSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSx3QkFBd0I7UUFFbEUsWUFDd0Isb0JBQTJDO1lBRWxFLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDbEUsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHFCQUFxQixDQUFDO29CQUMxRCxvQkFBb0IsQ0FBQyxjQUFjLENBQUMseUJBQXlCLENBQUM7aUJBQzlELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUVELENBQUE7SUFYWSxzREFBcUI7b0NBQXJCLHFCQUFxQjtRQUcvQixXQUFBLHFDQUFxQixDQUFBO09BSFgscUJBQXFCLENBV2pDO0lBRU0sSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxlQUFlOztpQkFFdkMsaUJBQVksR0FBRyxHQUFHLGVBQWUsQ0FBQyxrQkFBa0IsU0FBUyxBQUFqRCxDQUFrRDtpQkFDOUQsa0JBQWEsR0FBRyxHQUFHLDZCQUEyQixDQUFDLFlBQVksV0FBVyxBQUF6RCxDQUEwRDtRQUkvRixZQUNlLFdBQTBDLEVBQzNCLDBCQUF3RSxFQUNyRixhQUE4QyxFQUMzQyxnQkFBb0QsRUFDdEQsY0FBZ0QsRUFDOUMsZ0JBQW9EO1lBRXZFLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxFQUFFLEVBQUUsNkJBQTJCLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBUHhELGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ1YsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUNwRSxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDMUIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNyQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQVJ4RSxzQ0FBaUMsR0FBWSxJQUFJLENBQUM7WUFXakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMscUJBQXFCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxLQUFLLEdBQUcsNkJBQTJCLENBQUMsYUFBYSxDQUFDO1lBRXZELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3JCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7WUFDbkMsSUFBSSxLQUFLLHNDQUE4QixJQUFJLEtBQUssd0NBQWdDLEVBQUUsQ0FBQztnQkFDbEYsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDek8sT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztZQUNqRCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ25CLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEIsSUFBSSxDQUFDLEtBQUssR0FBRyw2QkFBMkIsQ0FBQyxZQUFZLENBQUM7WUFDdEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDO1lBQ25DLElBQUksQ0FBQyxLQUFLLEdBQUcsWUFBWSxDQUFDLE1BQU0saUVBQTRDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxlQUFlLENBQUM7Z0JBQ3hILENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSwyRUFBaUQsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsb0JBQW9CLENBQUM7b0JBQzVILENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxxRUFBOEMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsbUJBQW1CLENBQUM7d0JBQ3JILENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSwrREFBMkMsSUFBSSxZQUFZLENBQUMsTUFBTSxxRUFBOEMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUN6TixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUc7WUFDakIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUM7WUFDbEQsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsQ0FBQztnQkFDM0IsT0FBTztZQUNSLENBQUM7WUFVRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUE4RSxnQ0FBZ0MsRUFBRTtnQkFDL0ksTUFBTSxFQUFFLFlBQVksQ0FBQyxNQUFNO2FBQzNCLENBQUMsQ0FBQztZQUVILElBQUksWUFBWSxFQUFFLE1BQU0saUVBQTRDLEVBQUUsQ0FBQztnQkFDdEUsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2xDLENBQUM7aUJBRUksSUFBSSxZQUFZLEVBQUUsTUFBTSwyRUFBaUQsRUFBRSxDQUFDO2dCQUNoRixPQUFPLElBQUksQ0FBQywwQkFBMEIsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQ2xFLENBQUM7aUJBRUksSUFBSSxZQUFZLEVBQUUsTUFBTSxxRUFBOEMsRUFBRSxDQUFDO2dCQUM3RSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDNUMsQ0FBQztpQkFFSSxJQUFJLFlBQVksRUFBRSxNQUFNLCtEQUEyQyxFQUFFLENBQUM7Z0JBQzFFLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN6QyxDQUFDO2lCQUVJLElBQUksWUFBWSxFQUFFLE1BQU0scUVBQThDLEVBQUUsQ0FBQztnQkFDN0UsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQzVDLENBQUM7UUFFRixDQUFDOztJQTFGVyxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQVFyQyxXQUFBLG1CQUFZLENBQUE7UUFDWixXQUFBLHdDQUEyQixDQUFBO1FBQzNCLFdBQUEsdUJBQWMsQ0FBQTtRQUNkLFdBQUEsOEJBQWlCLENBQUE7UUFDakIsV0FBQSxnQ0FBZSxDQUFBO1FBQ2YsV0FBQSw2QkFBaUIsQ0FBQTtPQWJQLDJCQUEyQixDQTJGdkM7SUFFRCxTQUFTLG9CQUFvQixDQUFDLEtBQXNCLEVBQUUsU0FBd0M7UUFDN0YsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLGFBQWEsSUFBSSxnQ0FBbUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3JJLENBQUM7SUFFRCxTQUFTLG1CQUFtQixDQUFDLE1BQXlCLEVBQUUsWUFBNkIsRUFBRSxTQUF3QyxFQUFFLGdCQUF5QjtRQUN6SixNQUFNLEtBQUssR0FBb0IsRUFBRSxDQUFDO1FBQ2xDLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7WUFDNUIsSUFBSSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLGdCQUFnQixJQUFJLEtBQUssS0FBSyxZQUFZLENBQUMsRUFBRSxDQUFDO2dCQUM3RixLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELENBQUM7UUFDRixDQUFDO1FBQ0QsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3RCLEtBQUssQ0FBQyxJQUFJLENBQXNCLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM5RixLQUFLLENBQUMsSUFBSSxDQUFpQixFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxZQUFZLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNoRixDQUFDO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBRU0sSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxlQUFlOztpQkFFdkMsT0FBRSxHQUFHLDJDQUEyQyxBQUE5QyxDQUErQztpQkFDakQsVUFBSyxHQUFHLElBQUEsZUFBUyxFQUFDLDJDQUEyQyxFQUFFLGlCQUFpQixDQUFDLEFBQTVFLENBQTZFO2lCQUUxRSxpQkFBWSxHQUFHLEdBQUcsZUFBZSxDQUFDLGtCQUFrQixRQUFRLEFBQWhELENBQWlEO2lCQUM3RCxrQkFBYSxHQUFHLEdBQUcscUJBQW1CLENBQUMsWUFBWSxXQUFXLEFBQWpELENBQWtEO1FBRXZGLFlBQ29CLGdCQUFtQyxFQUNiLHFCQUE2QyxFQUNqRCxpQkFBcUMsRUFDbkIsMEJBQWdFO1lBRXZILEtBQUssQ0FBQyxxQkFBbUIsQ0FBQyxFQUFFLEVBQUUscUJBQW1CLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxxQkFBbUIsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFKaEUsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUNqRCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ25CLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBc0M7WUFHdkgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFNLGdCQUFnQixDQUFDLHFCQUFxQixFQUFFLHFCQUFxQixDQUFDLHFCQUFxQixDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDL0ksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dCQUM5RCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxxQkFBbUIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLHFCQUFtQixDQUFDLGFBQWEsQ0FBQztZQUNsRyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxXQUFtQztZQUM1RCxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxxQ0FBNkIsSUFBSSxJQUFJLENBQUMsMEJBQTBCLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzlPLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxLQUE4RCxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFO1lBQ3RLLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsRUFBRSxDQUFDO1lBRXRFLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDMUMsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsYUFBYSxFQUFFLENBQUM7WUFFaEUsTUFBTSxPQUFPLEdBQUcsSUFBSSxlQUFPLENBQU0sR0FBRyxDQUFDLENBQUM7WUFDdEMsTUFBTSxLQUFLLEdBQUcsbUJBQW1CLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDL0YsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUNwRCxLQUFLLEVBQ0w7Z0JBQ0MsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLG9CQUFvQixDQUFDO2dCQUNqRSxVQUFVLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDdkcsZUFBZTthQUNmLENBQUMsQ0FBQztZQUNKLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDekcsQ0FBQzs7SUFoRFcsa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFTN0IsV0FBQSw4QkFBaUIsQ0FBQTtRQUNqQixXQUFBLDhDQUFzQixDQUFBO1FBQ3RCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSwwREFBb0MsQ0FBQTtPQVoxQixtQkFBbUIsQ0FpRC9CO0lBRU0sSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxlQUFlOztpQkFFMUMsT0FBRSxHQUFHLDhDQUE4QyxBQUFqRCxDQUFrRDtpQkFDcEQsVUFBSyxHQUFHLElBQUEsZUFBUyxFQUFDLDhDQUE4QyxFQUFFLHFCQUFxQixDQUFDLEFBQW5GLENBQW9GO2lCQUVqRixpQkFBWSxHQUFHLEdBQUcsZUFBZSxDQUFDLGtCQUFrQixRQUFRLEFBQWhELENBQWlEO2lCQUM3RCxrQkFBYSxHQUFHLEdBQUcsd0JBQXNCLENBQUMsWUFBWSxXQUFXLEFBQXBELENBQXFEO1FBRTFGLFlBQ29CLGdCQUFtQyxFQUNiLHFCQUE2QyxFQUNqRCxpQkFBcUMsRUFDbkIsMEJBQWdFO1lBRXZILEtBQUssQ0FBQyx3QkFBc0IsQ0FBQyxFQUFFLEVBQUUsd0JBQXNCLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSx3QkFBc0IsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFKekUsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUNqRCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ25CLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBc0M7WUFHdkgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFNLGdCQUFnQixDQUFDLHFCQUFxQixFQUFFLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbEosSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUU7Z0JBQ3BFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHdCQUFzQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsd0JBQXNCLENBQUMsYUFBYSxDQUFDO1lBQ3hHLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLGlCQUFpQixDQUFDLHdCQUFtRDtZQUM1RSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxxQ0FBNkIsSUFBSSxJQUFJLENBQUMsMEJBQTBCLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDM1AsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLEtBQThELEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUU7WUFDdEssTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUM1RSxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7Z0JBQzdDLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFFbkUsTUFBTSxPQUFPLEdBQUcsSUFBSSxlQUFPLENBQU0sR0FBRyxDQUFDLENBQUM7WUFDdEMsTUFBTSxLQUFLLEdBQUcsbUJBQW1CLENBQUMsY0FBYyxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDbEcsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUNwRCxLQUFLLEVBQ0w7Z0JBQ0MsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLHdCQUF3QixDQUFDO2dCQUN6RSxVQUFVLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMxRyxlQUFlO2FBQ2YsQ0FBQyxDQUFDO1lBQ0osT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzVHLENBQUM7O0lBL0NXLHdEQUFzQjtxQ0FBdEIsc0JBQXNCO1FBU2hDLFdBQUEsOEJBQWlCLENBQUE7UUFDakIsV0FBQSw4Q0FBc0IsQ0FBQTtRQUN0QixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsMERBQW9DLENBQUE7T0FaMUIsc0JBQXNCLENBZ0RsQztJQUVNLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsZUFBZTs7aUJBRTdDLE9BQUUsR0FBRyxpREFBaUQsQUFBcEQsQ0FBcUQ7aUJBQ3ZELFVBQUssR0FBRyxJQUFBLGVBQVMsRUFBQyxpREFBaUQsRUFBRSx3QkFBd0IsQ0FBQyxBQUF6RixDQUEwRjtpQkFFdkYsaUJBQVksR0FBRyxHQUFHLGVBQWUsQ0FBQyxrQkFBa0IsUUFBUSxBQUFoRCxDQUFpRDtpQkFDN0Qsa0JBQWEsR0FBRyxHQUFHLDJCQUF5QixDQUFDLFlBQVksV0FBVyxBQUF2RCxDQUF3RDtRQUU3RixZQUNvQixnQkFBbUMsRUFDYixxQkFBNkMsRUFDakQsaUJBQXFDLEVBQ25CLDBCQUFnRTtZQUV2SCxLQUFLLENBQUMsMkJBQXlCLENBQUMsRUFBRSxFQUFFLDJCQUF5QixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsMkJBQXlCLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBSmxGLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDakQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNuQiwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQXNDO1lBR3ZILElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBTSxnQkFBZ0IsQ0FBQyxxQkFBcUIsRUFBRSxxQkFBcUIsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3JKLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFRCxNQUFNO1lBQ0wsSUFBSSxDQUFDLHFCQUFxQixDQUFDLG9CQUFvQixFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7Z0JBQzFFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsMkJBQXlCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQywyQkFBeUIsQ0FBQyxhQUFhLENBQUM7WUFDOUcsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8saUJBQWlCLENBQUMsaUJBQStDO1lBQ3hFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLHFDQUE2QixJQUFJLElBQUksQ0FBQywwQkFBMEIsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNwUCxDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLGVBQWUsS0FBOEQsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRTtZQUN0SyxNQUFNLGlCQUFpQixHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDbEYsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFFdEUsTUFBTSxPQUFPLEdBQUcsSUFBSSxlQUFPLENBQU0sR0FBRyxDQUFDLENBQUM7WUFDdEMsTUFBTSxLQUFLLEdBQUcsbUJBQW1CLENBQUMsaUJBQWlCLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUNyRyxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQ3BELEtBQUssRUFDTDtnQkFDQyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsMkJBQTJCLENBQUM7Z0JBQy9FLFVBQVUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzdHLGVBQWU7YUFDZixDQUFDLENBQUM7WUFDSixPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDL0csQ0FBQzs7SUFoRFcsOERBQXlCO3dDQUF6Qix5QkFBeUI7UUFTbkMsV0FBQSw4QkFBaUIsQ0FBQTtRQUNqQixXQUFBLDhDQUFzQixDQUFBO1FBQ3RCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSwwREFBb0MsQ0FBQTtPQVoxQix5QkFBeUIsQ0FpRHJDO0lBRU0sSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSxlQUFlOztpQkFFckMsT0FBRSxHQUFHLGdEQUFnRCxBQUFuRCxDQUFvRDtpQkFDdEQsVUFBSyxHQUFHLElBQUEsZUFBUyxFQUFDLGdEQUFnRCxFQUFFLHNCQUFzQixDQUFDLEFBQXRGLENBQXVGO2lCQUVwRixpQkFBWSxHQUFHLEdBQUcsZUFBZSxDQUFDLGtCQUFrQixXQUFXLEFBQW5ELENBQW9EO2lCQUNoRSxrQkFBYSxHQUFHLEdBQUcsbUJBQWlCLENBQUMsWUFBWSxXQUFXLEFBQS9DLENBQWdEO1FBRXJGLFlBQytDLDBCQUF1RDtZQUVyRyxLQUFLLENBQUMsbUJBQWlCLENBQUMsRUFBRSxFQUFFLG1CQUFpQixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsbUJBQWlCLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRnJELCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFHckcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHLG1CQUFpQixDQUFDLGFBQWEsQ0FBQztZQUM3QyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUNyRSxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLElBQUksbUJBQVEsS0FBSyxJQUFBLHlCQUFTLEVBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUM5RSxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsbUJBQWlCLENBQUMsWUFBWSxDQUFDO1FBQzdDLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixPQUFPLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLDBCQUEwQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEYsQ0FBQzs7SUFqQ1csOENBQWlCO2dDQUFqQixpQkFBaUI7UUFTM0IsV0FBQSx3Q0FBMkIsQ0FBQTtPQVRqQixpQkFBaUIsQ0FrQzdCO0lBRU0sSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxlQUFlOztpQkFFdkMsT0FBRSxHQUFHLDJDQUEyQyxBQUE5QyxDQUErQztpQkFDakQsVUFBSyxHQUFHLElBQUEsZUFBUyxFQUFDLDJDQUEyQyxFQUFFLHdCQUF3QixDQUFDLEFBQW5GLENBQW9GO2lCQUVqRixpQkFBWSxHQUFHLEdBQUcsZUFBZSxDQUFDLGtCQUFrQixXQUFXLEFBQW5ELENBQW9EO2lCQUNoRSxrQkFBYSxHQUFHLEdBQUcscUJBQW1CLENBQUMsWUFBWSxXQUFXLEFBQWpELENBQWtEO1FBRXZGLFlBQytDLDBCQUF1RCxFQUNwRSxhQUE2QjtZQUU5RCxLQUFLLENBQUMscUJBQW1CLENBQUMsRUFBRSxFQUFFLHFCQUFtQixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUscUJBQW1CLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBSDNELCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFDcEUsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBRzlELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFRCxNQUFNO1lBQ0wsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxxQkFBbUIsQ0FBQyxhQUFhLENBQUM7WUFDL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDckUsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLG1CQUFRLEtBQUssSUFBQSx5QkFBUyxFQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDOUUsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLHFCQUFtQixDQUFDLFlBQVksQ0FBQztRQUMvQyxDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUc7WUFDakIsT0FBTyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUNyRSxDQUFDOztJQWxDVyxrREFBbUI7a0NBQW5CLG1CQUFtQjtRQVM3QixXQUFBLHdDQUEyQixDQUFBO1FBQzNCLFdBQUEsdUJBQWMsQ0FBQTtPQVZKLG1CQUFtQixDQW1DL0I7SUFFTSxJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLGdCQUFNOztpQkFFekMsT0FBRSxHQUFHLHNEQUFzRCxBQUF6RCxDQUEwRDtpQkFDNUQsVUFBSyxHQUFHLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLDRCQUE0QixDQUFDLEFBQXJFLENBQXNFO1FBSTNGLFlBQ0MsV0FBbUIsRUFDeUIsb0JBQStDLEVBQzdDLHlCQUFzRDtZQUVwRyxLQUFLLENBQUMsZ0NBQThCLENBQUMsRUFBRSxFQUFFLGdDQUE4QixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFIckQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUEyQjtZQUM3Qyw4QkFBeUIsR0FBekIseUJBQXlCLENBQTZCO1lBR3BHLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQ2hDLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBVSx5Q0FBaUMsSUFBSSxDQUFDLENBQUM7WUFDekgsTUFBTSxhQUFhLEdBQUcsYUFBYSxFQUFFLG9CQUFvQixFQUFrQyxDQUFDO1lBQzVGLGFBQWEsQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUNoRCxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdEIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLHdCQUF3QixFQUFFLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakssSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdkQsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQzs7SUExQlcsd0VBQThCOzZDQUE5Qiw4QkFBOEI7UUFTeEMsV0FBQSx5Q0FBeUIsQ0FBQTtRQUN6QixXQUFBLHdDQUEyQixDQUFBO09BVmpCLDhCQUE4QixDQTJCMUM7SUFFTSxJQUFNLGlDQUFpQyxHQUF2QyxNQUFNLGlDQUFrQyxTQUFRLGdCQUFNOztpQkFFNUMsT0FBRSxHQUFHLHlEQUF5RCxBQUE1RCxDQUE2RDtpQkFDL0QsVUFBSyxHQUFHLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLCtCQUErQixDQUFDLEFBQTNFLENBQTRFO1FBSWpHLFlBQ0MsV0FBbUIsRUFDeUIsb0JBQStDLEVBQ25ELG9CQUEyQyxFQUNyQyx5QkFBc0Q7WUFFcEcsS0FBSyxDQUFDLG1DQUFpQyxDQUFDLEVBQUUsRUFBRSxtQ0FBaUMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBSjNELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMkI7WUFDbkQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyQyw4QkFBeUIsR0FBekIseUJBQXlCLENBQTZCO1lBR3BHLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQ2hDLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRztZQUNqQixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBVSx5Q0FBaUMsSUFBSSxDQUFDLENBQUM7WUFDbkgsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLEVBQUUsb0JBQW9CLEVBQWtDLENBQUM7WUFDMUYsaUJBQWlCLENBQUMsTUFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDcEQsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDMUIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLHdCQUF3QixFQUFFLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakssSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixNQUFNLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3JELElBQUksQ0FBQztvQkFDSixNQUFNLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3pELENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1DQUFtQyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsYUFBYSxvQ0FBNEIsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3hKLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQzs7SUEvQlcsOEVBQWlDO2dEQUFqQyxpQ0FBaUM7UUFTM0MsV0FBQSx5Q0FBeUIsQ0FBQTtRQUN6QixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsd0NBQTJCLENBQUE7T0FYakIsaUNBQWlDLENBZ0M3QztJQUVNLElBQU0sbUNBQW1DLEdBQXpDLE1BQU0sbUNBQW9DLFNBQVEsZ0JBQU07O2lCQUU5QyxPQUFFLEdBQUcsbUJBQW1CLEFBQXRCLENBQXVCO2lCQUVqQixVQUFLLEdBQUcsR0FBRyxlQUFlLENBQUMsa0JBQWtCLFNBQVMsQUFBakQsQ0FBa0Q7UUFFL0UsWUFDa0IsU0FBcUIsRUFDb0IseUNBQWtGO1lBRTVJLEtBQUssQ0FBQyxxQ0FBbUMsQ0FBQyxFQUFFLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUh0RCxjQUFTLEdBQVQsU0FBUyxDQUFZO1lBQ29CLDhDQUF5QyxHQUF6Qyx5Q0FBeUMsQ0FBeUM7WUFJNUksSUFBSSxDQUFDLEtBQUssR0FBRyxxQ0FBbUMsQ0FBQyxLQUFLLENBQUM7WUFDdkQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO1lBQ2xHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLENBQUM7UUFFZSxHQUFHO1lBQ2xCLElBQUksQ0FBQyx5Q0FBeUMsQ0FBQyxpQ0FBaUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDckgsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDMUIsQ0FBQzs7SUFwQlcsa0ZBQW1DO2tEQUFuQyxtQ0FBbUM7UUFRN0MsV0FBQSxrRUFBdUMsQ0FBQTtPQVI3QixtQ0FBbUMsQ0FxQi9DO0lBRU0sSUFBTSx1Q0FBdUMsR0FBN0MsTUFBTSx1Q0FBd0MsU0FBUSxnQkFBTTs7aUJBRWxELE9BQUUsR0FBRyxtQkFBbUIsQUFBdEIsQ0FBdUI7aUJBRWpCLFVBQUssR0FBRyxHQUFHLGVBQWUsQ0FBQyxrQkFBa0IsY0FBYyxBQUF0RCxDQUF1RDtRQUVwRixZQUNrQixTQUFxQixFQUNvQix5Q0FBa0Y7WUFFNUksS0FBSyxDQUFDLHlDQUF1QyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUh6QyxjQUFTLEdBQVQsU0FBUyxDQUFZO1lBQ29CLDhDQUF5QyxHQUF6Qyx5Q0FBeUMsQ0FBeUM7WUFJNUksSUFBSSxDQUFDLEtBQUssR0FBRyx5Q0FBdUMsQ0FBQyxLQUFLLENBQUM7WUFDM0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDckIsQ0FBQztRQUVlLEdBQUc7WUFDbEIsSUFBSSxDQUFDLHlDQUF5QyxDQUFDLGlDQUFpQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0SCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMxQixDQUFDOztJQXBCVywwRkFBdUM7c0RBQXZDLHVDQUF1QztRQVFqRCxXQUFBLGtFQUF1QyxDQUFBO09BUjdCLHVDQUF1QyxDQXFCbkQ7SUFFTSxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLGdCQUFNO1FBRWpELFlBQ2tCLFdBQW1CLEVBQ1Esb0JBQStDO1lBRTNGLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUg5RixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNRLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMkI7UUFHNUYsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBVSx5Q0FBaUMsSUFBSSxDQUFDLENBQUMsRUFBRSxvQkFBb0IsRUFBa0MsQ0FBQztZQUN2TCxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzNCLENBQUM7S0FDRCxDQUFBO0lBZFksd0RBQXNCO3FDQUF0QixzQkFBc0I7UUFJaEMsV0FBQSx5Q0FBeUIsQ0FBQTtPQUpmLHNCQUFzQixDQWNsQztJQUVNLElBQWUsNENBQTRDLEdBQTNELE1BQWUsNENBQTZDLFNBQVEsZ0JBQU07UUFFaEYsWUFDQyxFQUFVLEVBQ1YsS0FBYSxFQUN1QixjQUF3QyxFQUM3QyxXQUF5QixFQUNyQixlQUFpQyxFQUMxQyxhQUE2QixFQUNqQixrQkFBdUMsRUFDekMsd0JBQTJDO1lBRS9FLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFQbUIsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQzdDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3JCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUMxQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDakIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN6Qyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQW1CO1FBR2hGLENBQUM7UUFFUyxrQkFBa0IsQ0FBQyxzQkFBMkI7WUFDdkQsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsc0JBQXNCLENBQUM7aUJBQzNELElBQUksQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FDOUIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxDQUFDLGlCQUFpQixDQUFDLENBQUM7aUJBQzdFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDO2dCQUNoRCxRQUFRLEVBQUUsc0JBQXNCO2dCQUNoQyxPQUFPLEVBQUU7b0JBQ1IsTUFBTSxFQUFFLE9BQU87b0JBQ2YsU0FBUztpQkFDVDthQUNELENBQUMsQ0FBQyxFQUNKLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSw0RUFBNEUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuSyxDQUFDO1FBRVMsOEJBQThCLENBQUMsMEJBQStCO1lBQ3ZFLE9BQU8sSUFBSSxDQUFDLHFDQUFxQyxDQUFDLDBCQUEwQixDQUFDO2lCQUMzRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztpQkFDekgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUM7Z0JBQ2hELFFBQVEsRUFBRSwwQkFBMEI7Z0JBQ3BDLE9BQU8sRUFBRTtvQkFDUixTQUFTO29CQUNULFdBQVcsRUFBRSxJQUFJLENBQUMsOEJBQThCO2lCQUNoRDthQUNELENBQUMsQ0FBQyxDQUFDO1FBQ04sQ0FBQztRQUVPLHFDQUFxQyxDQUFDLDBCQUErQjtZQUM1RSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLENBQUMsQ0FBQztpQkFDM0UsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNmLE1BQU0sd0JBQXdCLEdBQTZCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUM5RyxJQUFJLENBQUMsd0JBQXdCLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDNUUsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxlQUFlLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQzt5QkFDaEksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQztnQkFDckUsQ0FBQztnQkFDRCxPQUFPLE9BQU8sQ0FBQztZQUNoQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxvQkFBb0IsQ0FBQyxPQUFlLEVBQUUsUUFBYSxFQUFFLElBQW1CO1lBQy9FLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2pELE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELE1BQU0saUJBQWlCLEdBQUcsd0JBQXdCLENBQUMsUUFBUSxJQUFJLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ2pNLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUM3SCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO3FCQUNsRixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUU7b0JBQ2pCLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDeEUsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNwQixPQUE2Qjt3QkFDNUIsZUFBZSxFQUFFLFFBQVEsQ0FBQyxVQUFVO3dCQUNwQyxXQUFXLEVBQUUsUUFBUSxDQUFDLE1BQU07d0JBQzVCLGFBQWEsRUFBRSxRQUFRLENBQUMsVUFBVTt3QkFDbEMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxNQUFNO3FCQUMxQixDQUFDO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRU8seUJBQXlCLENBQUMsc0JBQTJCO1lBQzVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUN4RixPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxzQkFBc0IsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO1lBQ3RGLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRTtnQkFDUixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLDhEQUFxQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDMUcsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsT0FBTyxFQUFFLDhEQUFxQyxFQUFFLENBQUM7Z0JBQ2xHLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQTtJQXBGcUIsb0dBQTRDOzJEQUE1Qyw0Q0FBNEM7UUFLL0QsV0FBQSxvQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLDRCQUFnQixDQUFBO1FBQ2hCLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxtQ0FBaUIsQ0FBQTtPQVZFLDRDQUE0QyxDQW9GakU7SUFFTSxJQUFNLDZDQUE2QyxHQUFuRCxNQUFNLDZDQUE4QyxTQUFRLDRDQUE0QztpQkFFOUYsT0FBRSxHQUFHLHFFQUFxRSxBQUF4RSxDQUF5RTtpQkFDM0UsVUFBSyxHQUFHLElBQUEsY0FBUSxFQUFDLHlDQUF5QyxFQUFFLDhDQUE4QyxDQUFDLEFBQXRHLENBQXVHO1FBRTVILFlBQ0MsRUFBVSxFQUNWLEtBQWEsRUFDQyxXQUF5QixFQUNyQixlQUFpQyxFQUN6QixjQUF3QyxFQUNsRCxhQUE2QixFQUN4QixrQkFBdUMsRUFDekMsd0JBQTJDO1lBRTlELEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLGFBQWEsRUFBRSxrQkFBa0IsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBQzVILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN6RixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRU8sTUFBTTtZQUNiLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxpQ0FBeUIsQ0FBQztRQUNqRixDQUFDO1FBRWUsR0FBRztZQUNsQixRQUFRLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDO2dCQUNqRDtvQkFDQyxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsNkNBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUM3RztvQkFDQyxPQUFPLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxDQUFDLGFBQWMsQ0FBQyxDQUFDO1lBQ2hHLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMxQixDQUFDOztJQWhDVyxzR0FBNkM7NERBQTdDLDZDQUE2QztRQVF2RCxXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLDRCQUFnQixDQUFBO1FBQ2hCLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLG1DQUFpQixDQUFBO09BYlAsNkNBQTZDLENBaUN6RDtJQUVNLElBQU0sbURBQW1ELEdBQXpELE1BQU0sbURBQW9ELFNBQVEsNENBQTRDO2lCQUVwRyxPQUFFLEdBQUcsMkVBQTJFLEFBQTlFLENBQStFO2lCQUNqRixVQUFLLEdBQUcsSUFBQSxjQUFRLEVBQUMsK0NBQStDLEVBQUUscURBQXFELENBQUMsQUFBbkgsQ0FBb0g7UUFFekksWUFDQyxFQUFVLEVBQ1YsS0FBYSxFQUNDLFdBQXlCLEVBQ3JCLGVBQWlDLEVBQ3pCLGNBQXdDLEVBQ2xELGFBQTZCLEVBQ3hCLGtCQUF1QyxFQUN6Qyx3QkFBMkMsRUFDNUIsY0FBK0I7WUFFakUsS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUUsYUFBYSxFQUFFLGtCQUFrQixFQUFFLHdCQUF3QixDQUFDLENBQUM7WUFGMUYsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1FBR2xFLENBQUM7UUFFZSxHQUFHO1lBQ2xCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUN0RSxNQUFNLGlCQUFpQixHQUFHLFdBQVcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQW1CLG9EQUFnQyxDQUFDLENBQUM7WUFDdE0sT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO2lCQUN2QyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUU7Z0JBQ3ZCLElBQUksZUFBZSxFQUFFLENBQUM7b0JBQ3JCLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsNkNBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUMvRSxDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDOztJQTdCVyxrSEFBbUQ7a0VBQW5ELG1EQUFtRDtRQVE3RCxXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLDRCQUFnQixDQUFBO1FBQ2hCLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLG1DQUFpQixDQUFBO1FBQ2pCLFdBQUEsMEJBQWUsQ0FBQTtPQWRMLG1EQUFtRCxDQThCL0Q7SUFFTSxJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLGdCQUFNOztpQkFFN0Isa0JBQWEsR0FBRyxHQUFHLGVBQWUsQ0FBQyxpQkFBaUIseUJBQXlCLEFBQWhFLENBQWlFO2lCQUM5RSxtQkFBYyxHQUFHLEdBQUcsNEJBQTBCLENBQUMsYUFBYSxPQUFPLEFBQXJELENBQXNEO1FBUTVGLElBQUksU0FBUyxLQUF3QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzlELElBQUksU0FBUyxDQUFDLFNBQTRCO1lBQ3pDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksU0FBUyxJQUFJLElBQUEsMkNBQWlCLEVBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDNUcsNkJBQTZCO2dCQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztnQkFDMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQzdCLENBQUM7WUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRUQsWUFDb0IsZ0JBQW9ELEVBQ3BDLGdDQUFvRixFQUNqRiwwQkFBaUY7WUFFdkgsS0FBSyxDQUFDLCtCQUErQixFQUFFLEVBQUUsRUFBRSw0QkFBMEIsQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFKekQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNuQixxQ0FBZ0MsR0FBaEMsZ0NBQWdDLENBQW1DO1lBQ2hFLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBc0M7WUFyQmhILGtCQUFhLEdBQTBCLElBQUksQ0FBQztZQUM1QyxXQUFNLEdBQTBCLElBQUksQ0FBQztZQUNyQyxZQUFPLEdBQWtCLElBQUksQ0FBQztZQUM5QixvQkFBZSxHQUEyQixJQUFJLENBQUM7WUFFL0MsZUFBVSxHQUFzQixJQUFJLENBQUM7UUFtQjdDLENBQUM7UUFFRCxNQUFNO1lBQ0wsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUN6QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsNEJBQTBCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyw0QkFBMEIsQ0FBQyxjQUFjLENBQUM7UUFDM0csQ0FBQztRQUVPLFlBQVk7WUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNsQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ3BDLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNwRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO1lBQ25DLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7WUFDdEMsSUFBSSxJQUFJLENBQUMsYUFBYSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDbEMsQ0FBQztZQUNELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUM7WUFFdEQsTUFBTSxlQUFlLEdBQUcsR0FBRyxFQUFFO2dCQUM1QixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBQSwyQ0FBaUIsRUFBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEssSUFBSSxJQUFJLENBQUMsU0FBVSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUMzQixJQUFJLGdCQUFnQixJQUFJLElBQUksQ0FBQyxTQUFVLENBQUMsT0FBTyxLQUFLLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUM5RSxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUNELE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxJQUFBLG1DQUFzQixFQUFDLElBQUksQ0FBQyxTQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDN0YsQ0FBQztnQkFDRCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUMsQ0FBQztZQUNGLE1BQU0sa0JBQWtCLEdBQUcsR0FBRyxFQUFFO2dCQUMvQixJQUFJLElBQUksQ0FBQyxTQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQzNCLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBQSwyQ0FBaUIsRUFBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFVLENBQUMsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVUsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLGdDQUFnQyxDQUFDLDRCQUE0QixDQUFDLElBQUEsd0JBQVcsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUM5UCxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUNELE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDLElBQUEsbUNBQXNCLEVBQUMsSUFBSSxDQUFDLFNBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNoRyxDQUFDO2dCQUNELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQyxDQUFDO1lBRUYsSUFBSSxhQUFhLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzVCLElBQUksYUFBYSxzQ0FBOEIsSUFBSSxJQUFJLENBQUMsTUFBTSxxQ0FBNkIsRUFBRSxDQUFDO29CQUM3RixPQUFPLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxxQ0FBNkIsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDNUwsQ0FBQztnQkFDRCxJQUFJLGFBQWEsd0NBQWdDLElBQUksSUFBSSxDQUFDLE1BQU0sdUNBQStCLEVBQUUsQ0FBQztvQkFDakcsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO29CQUNqQyxPQUFPLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUM3RSxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksc0JBQXNCLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3JDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLHdCQUF3QixDQUFDLHNCQUFzQixDQUFDLENBQUM7Z0JBQzFHLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQy9GLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDbEMsT0FBTyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ2xFLENBQUM7Z0JBQ0QsSUFBSSxnQkFBZ0IsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNsQyxPQUFPLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUN2RSxDQUFDO1lBRUYsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVRLEdBQUc7WUFDWCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMxQixDQUFDOztJQW5HVyxnRUFBMEI7eUNBQTFCLDBCQUEwQjtRQXdCcEMsV0FBQSw4QkFBaUIsQ0FBQTtRQUNqQixXQUFBLHVEQUFpQyxDQUFBO1FBQ2pDLFdBQUEsMERBQW9DLENBQUE7T0ExQjFCLDBCQUEwQixDQXFHdEM7SUFFTSxJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUEwQixTQUFRLHVCQUF1Qjs7aUJBRTdDLHVCQUFrQixHQUFHLEdBQUcsZUFBZSxDQUFDLGlCQUFpQixtQkFBbUIscUJBQVMsQ0FBQyxXQUFXLENBQUMsaUNBQWUsQ0FBQyxFQUFFLEFBQWxHLENBQW1HO2lCQUNySCxlQUFVLEdBQUcsR0FBRywyQkFBeUIsQ0FBQyxpQkFBaUIsbUJBQW1CLHFCQUFTLENBQUMsV0FBVyxDQUFDLGlDQUFlLENBQUMsRUFBRSxBQUE1RyxDQUE2RztRQUUvSSxZQUN5QyxvQkFBMkMsRUFDckMsMEJBQXVELEVBQ3BELDZCQUE2RCxFQUN2RixvQkFBMkM7WUFFbEUsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsRUFBRSwyQkFBeUIsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFMeEQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyQywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQ3BELGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFJOUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNySyxJQUFJLENBQUMsU0FBUyxDQUFDLDZCQUE2QixDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekYsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUsscUNBQTZCLENBQUM7WUFDdkksSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzNGLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQywyQkFBeUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsMkJBQXlCLENBQUMsVUFBVSxDQUFDO2dCQUM3RyxJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLHVDQUF1QyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLFFBQVEsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO1lBQzFJLENBQUM7UUFDRixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUc7WUFDakIsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDO2dCQUNoQixZQUFZLEVBQUU7b0JBQ2I7d0JBQ0MsSUFBSSxnQkFBTSxDQUNULHVCQUF1QixFQUN2QixJQUFJLENBQUMsMEJBQTBCLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLFNBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsYUFBYSxFQUFFLDRCQUE0QixDQUFDLEVBQ3pLLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxTQUFVLENBQUMsQ0FBQztxQkFDeEc7aUJBQ0QsRUFBRSxvQkFBb0IsRUFBRSxJQUFJO2FBQzdCLENBQUMsQ0FBQztRQUNKLENBQUM7O0lBckNXLDhEQUF5Qjt3Q0FBekIseUJBQXlCO1FBTW5DLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSx3Q0FBMkIsQ0FBQTtRQUMzQixXQUFBLDZDQUE4QixDQUFBO1FBQzlCLFdBQUEscUNBQXFCLENBQUE7T0FUWCx5QkFBeUIsQ0FzQ3JDO0lBSU0sSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSxlQUFlOztpQkFFakMsVUFBSyxHQUFHLEdBQUcsZUFBZSxDQUFDLGlCQUFpQixtQkFBbUIsQUFBMUQsQ0FBMkQ7UUFLeEYsSUFBSSxNQUFNLEtBQWtDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFPbEUsWUFDb0MsZ0NBQW9GLEVBQ3hHLFlBQTRDLEVBQzFDLGNBQWdELEVBQy9CLCtCQUFrRixFQUNsRixxQkFBd0UsRUFDN0UsMEJBQXdFLEVBQ2xGLGdCQUFvRCxFQUNsQyxrQ0FBd0YsRUFDbkcsY0FBeUQsRUFDbEUsY0FBZ0QsRUFDM0IsbUNBQTBGLEVBQzNGLGtDQUF3RjtZQUU3SCxLQUFLLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxFQUFFLEdBQUcsdUJBQXFCLENBQUMsS0FBSyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFiekIscUNBQWdDLEdBQWhDLGdDQUFnQyxDQUFtQztZQUN2RixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUN6QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDZCxvQ0FBK0IsR0FBL0IsK0JBQStCLENBQWtDO1lBQ2pFLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBa0M7WUFDNUQsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUNqRSxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ2pCLHVDQUFrQyxHQUFsQyxrQ0FBa0MsQ0FBcUM7WUFDbEYsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQ2pELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNWLHdDQUFtQyxHQUFuQyxtQ0FBbUMsQ0FBc0M7WUFDMUUsdUNBQWtDLEdBQWxDLGtDQUFrQyxDQUFxQztZQXRCOUgsc0NBQWlDLEdBQVksSUFBSSxDQUFDO1lBS2pDLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2pFLHNCQUFpQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFFMUMsb0JBQWUsR0FBRyxJQUFJLGlCQUFTLEVBQUUsQ0FBQztZQWlCbEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ25GLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsa0NBQWtDLENBQUMscUJBQXFCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVPLEtBQUssQ0FBQyxzQkFBc0I7WUFDbkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFFckIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsNkJBQVcsRUFBRSxPQUFPLEVBQUUsSUFBSSw0QkFBYyxDQUFDLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLGdEQUFnRCxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3SixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDOUMsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsV0FBVyxLQUFLLFNBQUcsQ0FBQyxLQUFLLENBQUMsMEJBQTBCLGtCQUFrQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO29CQUN0TSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLDZCQUFXLEVBQUUsT0FBTyxFQUFFLElBQUksNEJBQWMsQ0FBQyxJQUFBLGNBQVEsRUFBQyw2Q0FBNkMsRUFBRSw4REFBOEQsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVNLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDcEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLEtBQUssU0FBRyxDQUFDLEtBQUssQ0FBQyx5Q0FBeUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO29CQUN4TyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLDZCQUFXLEVBQUUsT0FBTyxFQUFFLElBQUksNEJBQWMsQ0FBQyxJQUFBLGNBQVEsRUFBQyw0Q0FBNEMsRUFBRSwrSEFBK0gsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVRLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLE9BQU8sR0FBRyxJQUFJLDRCQUFjLENBQUMsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsbUVBQW1FLENBQUMsQ0FBQyxDQUFDO29CQUN4SSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLGNBQWMsRUFBRSxDQUFDO3dCQUNuRCxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztvQkFDN0UsQ0FBQztvQkFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLDZCQUFXLEVBQUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3pELENBQUM7Z0JBQ0QsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BFLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssdUNBQStCLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hKLElBQUksSUFBSSxDQUFDLGdDQUFnQyxDQUFDLDhCQUE4QixJQUFJLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQywrQkFBK0IsRUFBRSxDQUFDO29CQUNuSixNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsOEJBQThCLENBQUMsMEJBQTBCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLCtCQUFnQyxDQUFDLDBCQUEwQixDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQztvQkFDbFYsTUFBTSxPQUFPLEdBQUcsSUFBSSw0QkFBYyxDQUFDLEdBQUcsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsc0RBQXNELEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLElBQUEsNENBQXNCLEVBQUMsY0FBYyxDQUFDLENBQUMsS0FBSyxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLHVEQUF1RCxDQUFDLENBQUM7b0JBQ25XLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsNkJBQVcsRUFBRSxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDeEQsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksSUFBSSxDQUFDLGdDQUFnQyxDQUFDLDRCQUE0QixFQUFFLENBQUM7b0JBQ3hFLE1BQU0sV0FBVyxHQUFHLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ2pHLE1BQU0sT0FBTyxHQUFHLElBQUksNEJBQWMsQ0FBQyxHQUFHLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLDhDQUE4QyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsS0FBSyxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLCtDQUErQyxDQUFDLENBQUM7b0JBQ2xSLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsNkJBQVcsRUFBRSxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDeEQsT0FBTztnQkFDUixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUs7Z0JBQ3hCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNO2dCQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUsscUNBQTZCLEVBQ2hELENBQUM7Z0JBQ0YsT0FBTztZQUNSLENBQUM7WUFFRCx1Q0FBdUM7WUFDdkMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsa0RBQTBDLEVBQUUsQ0FBQztnQkFDOUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLDRCQUFjLENBQUMsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsZ0RBQWdELENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2hKLE9BQU87WUFDUixDQUFDO1lBRUQsc0NBQXNDO1lBQ3RDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLGlEQUF5QyxFQUFFLENBQUM7Z0JBQzdFLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSw0QkFBYyxDQUFDLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLDhFQUE4RSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3SyxPQUFPO1lBQ1IsQ0FBQztZQUVELDZDQUE2QztZQUM3QyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSx1REFBK0MsRUFBRSxDQUFDO2dCQUNuRixNQUFNLE9BQU8sR0FBRyxJQUFBLDJDQUE4QixFQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztnQkFDOUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSwwQkFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLDRCQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFBLHdDQUEwQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyx1Q0FBdUMsRUFBRSxrRkFBa0YsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDaFEsT0FBTztZQUNSLENBQUM7WUFFRCx1Q0FBdUM7WUFDdkMsSUFBSSxJQUFBLHFDQUFrQixFQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUM1RCxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyx1Q0FBdUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDMUksTUFBTSxPQUFPLEdBQUcsSUFBQSwyQ0FBOEIsRUFBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBQzlHLElBQUksa0JBQWtCLEtBQUssU0FBUyxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUNqRCxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLDZCQUFXLEVBQUUsT0FBTyxFQUFFLElBQUksNEJBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUEsd0NBQTBCLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGdEQUFnRCxFQUFFLCtFQUErRSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN6USxPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBRUQsK0NBQStDO1lBQy9DLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLHVEQUErQztnQkFDaEYsaUZBQWlGO2dCQUNqRixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSwwREFBa0QsSUFBSSxJQUFJLENBQUMsbUNBQW1DLENBQUMsK0JBQStCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsZUFBZSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsSUFBSSxlQUFlLHVEQUErQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUM1VyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDcEIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLDJDQUE4QixFQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztnQkFDekgsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSwyQkFBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLDRCQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUEsd0NBQTBCLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsaURBQWlELEVBQUUsZ0ZBQWdGLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzNSLE9BQU87WUFDUixDQUFDO1lBRUQseUNBQXlDO1lBQ3pDLElBQUksSUFBSSxDQUFDLCtCQUErQixDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDO2dCQUN4SCxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyx5Q0FBeUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDOUksTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLDJDQUE4QixFQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztnQkFDekgsSUFBSSxvQkFBb0IsS0FBSyxTQUFTLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztvQkFDNUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7b0JBQ3BCLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsMkJBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSw0QkFBYyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFBLHdDQUEwQixFQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGdEQUFnRCxFQUFFLG1GQUFtRixDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUM3UixPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBRUQsMENBQTBDO1lBQzFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLG9EQUE0QyxFQUFFLENBQUM7Z0JBQ2hGLElBQUksQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEsMkNBQWlCLEVBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLFNBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUM5SixJQUFJLE9BQU8sQ0FBQztvQkFDWiw0QkFBNEI7b0JBQzVCLElBQUksSUFBSSxDQUFDLGdDQUFnQyxDQUFDLDhCQUE4QixLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ3BHLElBQUksSUFBSSxDQUFDLGtDQUFrQyxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7NEJBQ3RHLElBQUksSUFBSSxDQUFDLGdDQUFnQyxDQUFDLCtCQUErQixFQUFFLENBQUM7Z0NBQzNFLE9BQU8sR0FBRyxJQUFJLDRCQUFjLENBQUMsR0FBRyxJQUFBLGNBQVEsRUFBQyxvQ0FBb0MsRUFBRSwwSkFBMEosRUFBRSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsK0JBQStCLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxvRUFBb0UsQ0FBQyxDQUFDOzRCQUN2YSxDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCw2QkFBNkI7eUJBQ3hCLElBQUksSUFBSSxDQUFDLGdDQUFnQyxDQUFDLCtCQUErQixLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQzFHLElBQUksSUFBSSxDQUFDLGtDQUFrQyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7NEJBQy9GLElBQUksSUFBSSxDQUFDLGdDQUFnQyxDQUFDLDhCQUE4QixFQUFFLENBQUM7Z0NBQzFFLE9BQU8sR0FBRyxJQUFJLDRCQUFjLENBQUMsR0FBRyxJQUFBLGNBQVEsRUFBQyxtQ0FBbUMsRUFBRSx3SkFBd0osRUFBRSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsK0JBQStCLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxvRUFBb0UsQ0FBQyxDQUFDOzRCQUNwYSxDQUFDO2lDQUFNLElBQUksZ0JBQUssRUFBRSxDQUFDO2dDQUNsQixPQUFPLEdBQUcsSUFBSSw0QkFBYyxDQUFDLEdBQUcsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsc0ZBQXNGLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLG9FQUFvRSxDQUFDLENBQUM7NEJBQzNTLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO29CQUNELDBCQUEwQjt5QkFDckIsSUFBSSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsNEJBQTRCLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDdkcsT0FBTyxHQUFHLElBQUksNEJBQWMsQ0FBQyxHQUFHLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLDRFQUE0RSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxvRUFBb0UsQ0FBQyxDQUFDO29CQUN6UixDQUFDO29CQUNELElBQUksT0FBTyxFQUFFLENBQUM7d0JBQ2IsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSw2QkFBVyxFQUFFLE9BQU8sRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN6RCxDQUFDO29CQUNELE9BQU87Z0JBQ1IsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLGdDQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLE1BQU0sUUFBUSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUE2Qiw4QkFBVSxDQUFDLHlCQUF5QixDQUFDLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUN0SCxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsa0NBQWtDLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQztnQkFDL0csTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxlQUFlLENBQUMsS0FBSyxTQUFHLENBQUMsS0FBSyxDQUFDLDBCQUEwQixrQkFBa0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxnREFBK0IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQ3pPLElBQUksTUFBTSxFQUFFLFFBQVEsS0FBSyx1QkFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUN6QyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLDJCQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksNEJBQWMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQzlJLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxJQUFJLE1BQU0sRUFBRSxRQUFRLEtBQUssdUJBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDM0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSw2QkFBVyxFQUFFLE9BQU8sRUFBRSxJQUFJLDRCQUFjLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLGdCQUFnQixFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNoSixPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBRUQsbUJBQW1CO1lBQ25CLElBQUksSUFBSSxDQUFDLGdDQUFnQyxDQUFDLCtCQUErQixFQUFFLENBQUM7Z0JBQzNFLElBQUksSUFBQSxvQ0FBdUIsRUFBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUM1RCxJQUFJLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDJDQUFpQixFQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxTQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQzt3QkFDOUosTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLGdDQUFnQyxDQUFDLDhCQUE4Qjs0QkFDN0csQ0FBQyxDQUFDLElBQUksNEJBQWMsQ0FBQyxJQUFBLGNBQVEsRUFBQyw2Q0FBNkMsRUFBRSx1RUFBdUUsRUFBRSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsK0JBQStCLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQ25PLENBQUMsQ0FBQyxJQUFJLDRCQUFjLENBQUMsSUFBQSxjQUFRLEVBQUMsb0NBQW9DLEVBQUUsc0VBQXNFLENBQUMsQ0FBQyxDQUFDO3dCQUM5SSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLDBCQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ3RELENBQUM7b0JBQ0QsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDJDQUFpQixFQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsSyxNQUFNLHNCQUFzQixHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsNEJBQTRCLENBQUMsSUFBQSx3QkFBVyxFQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMzSixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyw4QkFBOEIsSUFBSSxzQkFBc0IsS0FBSyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsK0JBQStCLEVBQUUsQ0FBQztvQkFDeE0sSUFBSSxJQUFJLENBQUMsa0NBQWtDLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQzt3QkFDdEcsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSwwQkFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLDRCQUFjLENBQUMsR0FBRyxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSx5RkFBeUYsQ0FBQyxLQUFLLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsb0VBQW9FLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNuVCxDQUFDO29CQUNELE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQywrQkFBK0IsSUFBSSxzQkFBc0IsS0FBSyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsOEJBQThCLEVBQUUsQ0FBQztvQkFDeE0sSUFBSSxJQUFJLENBQUMsa0NBQWtDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQzt3QkFDL0YsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSwwQkFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLDRCQUFjLENBQUMsR0FBRyxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSx3RkFBd0YsQ0FBQyxLQUFLLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsb0VBQW9FLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNqVCxDQUFDO29CQUNELE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQywrQkFBK0IsSUFBSSxzQkFBc0IsS0FBSyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztvQkFDdE0sSUFBSSxJQUFJLENBQUMsa0NBQWtDLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7d0JBQzVGLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsMEJBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSw0QkFBYyxDQUFDLEdBQUcsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsNkZBQTZGLENBQUMsS0FBSyxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLG9FQUFvRSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDNVQsQ0FBQztvQkFDRCxPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBRUQsMENBQTBDO1lBQzFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLDBEQUFrRCxFQUFFLENBQUM7Z0JBQ3RGLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsNkJBQVcsRUFBRSxPQUFPLEVBQUUsSUFBSSw0QkFBYyxDQUFDLElBQUEsY0FBUSxFQUFDLDBDQUEwQyxFQUFFLHVGQUF1RixDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMzTixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzRixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEsMkNBQWlCLEVBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFFdEosSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLElBQUksU0FBUyxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNqRSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSw2Q0FBcUMsRUFBRSxDQUFDO29CQUN6RSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksNEJBQWMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSwyREFBMkQsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDckosT0FBTztnQkFDUixDQUFDO2dCQUNELElBQUksSUFBSSxDQUFDLGdDQUFnQyxDQUFDLDhCQUE4QixJQUFJLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQywrQkFBK0IsRUFBRSxDQUFDO29CQUNuSixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQywrQkFBK0IsRUFBRSxDQUFDO3dCQUNyRyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksNEJBQWMsQ0FBQyxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSwrQkFBK0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQ2hLLE9BQU87b0JBQ1IsQ0FBQztnQkFDRixDQUFDO2dCQUNELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLDRDQUFvQyxFQUFFLENBQUM7b0JBQ3hFLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSw0QkFBYyxDQUFDLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLHFDQUFxQyxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUM5SCxPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUM5QixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSw2Q0FBcUMsRUFBRSxDQUFDO29CQUN6RSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksNEJBQWMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxrREFBa0QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDNUksT0FBTztnQkFDUixDQUFDO2dCQUNELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLDhDQUFzQyxFQUFFLENBQUM7b0JBQzFFLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSw0QkFBYyxDQUFDLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLDREQUE0RCxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN2SixPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxTQUFTLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDOUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsS0FBSyx1QkFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xJLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsMkJBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSw0QkFBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BHLENBQUM7UUFFRixDQUFDO1FBRU8sWUFBWSxDQUFDLE1BQW1DLEVBQUUsV0FBb0I7WUFDN0UsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLE1BQU0sRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEtBQUssTUFBTSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDcEgsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNqQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxLQUFLLDJCQUFTLEVBQUUsQ0FBQztvQkFDdEMsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLHVCQUFxQixDQUFDLEtBQUssMkJBQTJCLHFCQUFTLENBQUMsV0FBVyxDQUFDLDJCQUFTLENBQUMsRUFBRSxDQUFDO2dCQUMxRyxDQUFDO3FCQUNJLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEtBQUssNkJBQVcsRUFBRSxDQUFDO29CQUM3QyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsdUJBQXFCLENBQUMsS0FBSyw2QkFBNkIscUJBQVMsQ0FBQyxXQUFXLENBQUMsNkJBQVcsQ0FBQyxFQUFFLENBQUM7Z0JBQzlHLENBQUM7cUJBQ0ksSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksS0FBSywwQkFBUSxFQUFFLENBQUM7b0JBQzFDLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyx1QkFBcUIsQ0FBQyxLQUFLLDBCQUEwQixxQkFBUyxDQUFDLFdBQVcsQ0FBQywwQkFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDeEcsQ0FBQztxQkFDSSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxLQUFLLDJCQUFTLEVBQUUsQ0FBQztvQkFDM0MsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLHVCQUFxQixDQUFDLEtBQUssSUFBSSxxQkFBUyxDQUFDLFdBQVcsQ0FBQywyQkFBUyxDQUFDLEVBQUUsQ0FBQztnQkFDbkYsQ0FBQztxQkFDSSxDQUFDO29CQUNMLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyx1QkFBcUIsQ0FBQyxLQUFLLE9BQU8sQ0FBQztnQkFDcEQsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEtBQUssMkJBQVMsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDckUsQ0FBQztRQUNGLENBQUM7O0lBbFRXLHNEQUFxQjtvQ0FBckIscUJBQXFCO1FBZS9CLFdBQUEsdURBQWlDLENBQUE7UUFDakMsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSwwQkFBZSxDQUFBO1FBQ2YsV0FBQSxpREFBZ0MsQ0FBQTtRQUNoQyxXQUFBLGlEQUFnQyxDQUFBO1FBQ2hDLFdBQUEsd0NBQTJCLENBQUE7UUFDM0IsV0FBQSw4QkFBaUIsQ0FBQTtRQUNqQixXQUFBLHdFQUFtQyxDQUFBO1FBQ25DLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSxnQ0FBZSxDQUFBO1FBQ2YsWUFBQSwwREFBb0MsQ0FBQTtRQUNwQyxZQUFBLHVEQUFtQyxDQUFBO09BMUJ6QixxQkFBcUIsQ0FtVGpDO0lBRU0sSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxnQkFBTTs7aUJBRTFCLE9BQUUsR0FBRyx1Q0FBdUMsQUFBMUMsQ0FBMkM7aUJBQzdDLFVBQUssR0FBRyxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsd0JBQXdCLENBQUMsQUFBbEQsQ0FBbUQ7UUFFeEUsWUFDQyxLQUFhLGlCQUFlLENBQUMsRUFBRSxFQUFFLFFBQWdCLGlCQUFlLENBQUMsS0FBSyxFQUN4QiwwQkFBdUQsRUFDakQsZ0NBQW1FLEVBQ2xGLGlCQUFxQyxFQUNuQyxtQkFBeUMsRUFDakQsV0FBeUIsRUFDaEIsb0JBQTJDLEVBQy9DLGdCQUFtQztZQUV2RSxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBUjZCLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFDakQscUNBQWdDLEdBQWhDLGdDQUFnQyxDQUFtQztZQUNsRixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ25DLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDakQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDaEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMvQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1FBR3hFLENBQUM7UUFFRCxJQUFhLE9BQU87WUFDbkIsT0FBTyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUM5RixDQUFDO1FBRVEsR0FBRztZQUNYLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsK0JBQStCLENBQUMsRUFBRSxDQUFDO2lCQUM3SSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFTyxVQUFVO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDLFVBQVUsRUFBRTtpQkFDakQsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNiLE1BQU0sT0FBTyxHQUFHLEtBQUs7cUJBQ25CLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyw0QkFBNEIsQ0FBQztxQkFDcEksR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO29CQUNoQixPQUFPO3dCQUNOLEVBQUUsRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7d0JBQzNCLEtBQUssRUFBRSxTQUFTLENBQUMsV0FBVzt3QkFDNUIsV0FBVyxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTt3QkFDcEMsU0FBUztxQkFDdUMsQ0FBQztnQkFDbkQsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osT0FBTyxPQUFPLENBQUM7WUFDaEIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sa0JBQWtCLENBQUMsU0FBcUI7WUFDL0MsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHNCQUFzQixFQUFFLGFBQWEsQ0FBQyxDQUFDLEdBQUcsRUFBRTtpQkFDMUYsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVixPQUFPLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO3FCQUN6RCxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUU7b0JBQ2pCLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsSUFBQSxtQ0FBc0IsRUFBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMzSCxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLCtCQUErQixFQUFFLDhFQUE4RSxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO3dCQUNqTCxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsOENBQThDLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDaEgsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNoQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsNkJBQTZCLEVBQUUsWUFBWSxDQUFDOzRCQUM1RCxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7eUJBQ3BDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNSLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQzlCLHVCQUFRLENBQUMsSUFBSSxFQUNiLE9BQU8sRUFDUCxPQUFPLEVBQ1AsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2hCLENBQUM7Z0JBQ0gsQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQzs7SUFoRVcsMENBQWU7OEJBQWYsZUFBZTtRQU96QixXQUFBLHdDQUEyQixDQUFBO1FBQzNCLFdBQUEsdURBQWlDLENBQUE7UUFDakMsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLG1DQUFvQixDQUFBO1FBQ3BCLFdBQUEsbUJBQVksQ0FBQTtRQUNaLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw4QkFBaUIsQ0FBQTtPQWJQLGVBQWUsQ0FpRTNCO0lBRU0sSUFBTSx1Q0FBdUMsR0FBN0MsTUFBTSx1Q0FBd0MsU0FBUSxnQkFBTTs7aUJBRWxELE9BQUUsR0FBRyxxREFBcUQsQUFBeEQsQ0FBeUQ7aUJBQzNELFVBQUssR0FBRyxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSwwQ0FBMEMsQ0FBQyxBQUFuRixDQUFvRjtRQUV6RyxZQUNDLEtBQWEseUNBQXVDLENBQUMsRUFBRSxFQUFFLFFBQWdCLHlDQUF1QyxDQUFDLEtBQUssRUFDeEUsMEJBQXVELEVBQ2hFLGlCQUFxQyxFQUNsQyxvQkFBMkMsRUFDNUIsMEJBQWdFO1lBRXZILEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFMNkIsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUNoRSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ2xDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDNUIsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUFzQztRQUd4SCxDQUFDO1FBRUQsSUFBYSxPQUFPO1lBQ25CLE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBQ2pCLE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzNLLElBQUksYUFBYSxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDOUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2dCQUNyRixNQUFNLENBQUMsU0FBUyxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUM7Z0JBQzNDLE1BQU0sTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNuQixNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsc0JBQXNCLEVBQUUsYUFBYSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDckgsQ0FBQztRQUNGLENBQUM7UUFFTyxTQUFTLENBQUMsU0FBcUI7WUFDdEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzdCLE9BQU8sTUFBTSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsMEJBQTBCLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxRyxDQUFDO1FBRU8sS0FBSyxDQUFDLG1CQUFtQjtZQUNoQyxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNyRSxNQUFNLE9BQU8sR0FBeUIsRUFBRSxDQUFDO1lBQ3pDLEtBQUssTUFBTSxTQUFTLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ25DLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUMvQixPQUFPLENBQUMsSUFBSSxDQUFDO3dCQUNaLEVBQUUsRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7d0JBQzNCLEtBQUssRUFBRSxTQUFTLENBQUMsV0FBVyxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTt3QkFDdkQsV0FBVyxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTt3QkFDcEMsU0FBUztxQkFDVCxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ25HLENBQUM7O0lBakRXLDBGQUF1QztzREFBdkMsdUNBQXVDO1FBT2pELFdBQUEsd0NBQTJCLENBQUE7UUFDM0IsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsMERBQW9DLENBQUE7T0FWMUIsdUNBQXVDLENBa0RuRDtJQU1NLElBQWUsdUNBQXVDLEdBQXRELE1BQWUsdUNBQXdDLFNBQVEsZ0JBQU07UUFJM0UsWUFDQyxFQUFVLEVBQ21CLDBCQUEwRSxFQUNuRixpQkFBc0QsRUFDcEQsbUJBQTBELEVBQzlELGVBQWtEO1lBRXBFLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUxzQywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQ2xFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbkMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUM3QyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFQN0QsZUFBVSxHQUE2QixTQUFTLENBQUM7WUFVeEQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2QsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUU7Z0JBQzVELElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNyQixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDekIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sZ0JBQWdCO1lBQ3ZCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQztZQUN4RCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRU8sTUFBTTtZQUNiLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQzVGLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUMzQixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUc7WUFDakIsT0FBTyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztRQUMxQyxDQUFDO1FBRU8sS0FBSyxDQUFDLHdCQUF3QjtZQUNyQyxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNqRSxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRU8sS0FBSyxDQUFDLDBCQUEwQjtZQUN2QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxFQUFzQixDQUFDO1lBQy9FLFNBQVMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFO2dCQUM3QyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3JCLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDakIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMzQyxDQUFDLENBQUMsQ0FBQztZQUNILFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNqQixNQUFNLHdCQUF3QixHQUFHLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDdkUsU0FBUyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7WUFDdkIsSUFBSSx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDckMsU0FBUyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDM0MsU0FBUyxDQUFDLFdBQVcsR0FBRyxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO2dCQUNqRyxTQUFTLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztnQkFDL0Isd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hGLFNBQVMsQ0FBQyxLQUFLLEdBQUcsd0JBQXdCLENBQUMsR0FBRyxDQUFxQixTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEssQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDakIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQixJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDO29CQUMvQixRQUFRLEVBQUUsdUJBQVEsQ0FBQyxJQUFJO29CQUN2QixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUscUNBQXFDLENBQUM7aUJBQy9FLENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLFdBQVcsQ0FBQyxhQUFnRDtZQUN6RSxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSx3QkFBd0IsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2hHLElBQUksd0JBQXdCLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3JDLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQ3RDO3dCQUNDLFFBQVEsd0NBQStCO3dCQUN2QyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsMEJBQTBCLENBQUM7cUJBQ3BFLEVBQ0QsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztvQkFDekQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RHLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztLQUtELENBQUE7SUF0RnFCLDBGQUF1QztzREFBdkMsdUNBQXVDO1FBTTFELFdBQUEsd0NBQTJCLENBQUE7UUFDM0IsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLG1DQUFvQixDQUFBO1FBQ3BCLFdBQUEsMkJBQWdCLENBQUE7T0FURyx1Q0FBdUMsQ0FzRjVEO0lBRU0sSUFBTSxvQ0FBb0MsR0FBMUMsTUFBTSxvQ0FBcUMsU0FBUSx1Q0FBdUM7UUFFaEcsWUFDOEIsMEJBQXVELEVBQ2hFLGlCQUFxQyxFQUN2QyxlQUFpQyxFQUM3QixtQkFBeUMsRUFDWCxnQ0FBbUUsRUFDNUUsdUJBQWlELEVBQ3BELG9CQUEyQyxFQUNwRCxXQUF5QixFQUMxQixVQUF1QjtZQUVyRCxLQUFLLENBQUMsNkRBQTZELEVBQUUsMEJBQTBCLEVBQUUsaUJBQWlCLEVBQUUsbUJBQW1CLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFOdEcscUNBQWdDLEdBQWhDLGdDQUFnQyxDQUFtQztZQUM1RSw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ3BELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDcEQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDMUIsZUFBVSxHQUFWLFVBQVUsQ0FBYTtRQUd0RCxDQUFDO1FBRUQsSUFBYSxLQUFLO1lBQ2pCLElBQUksSUFBSSxDQUFDLGdDQUFnQyxJQUFJLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQywrQkFBK0IsRUFBRSxDQUFDO2dCQUNwSCxPQUFPLElBQUEsY0FBUSxFQUFDLHFDQUFxQyxFQUFFLHNDQUFzQyxFQUFFLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQywrQkFBK0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3SyxDQUFDO1lBQ0QsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRVMsaUJBQWlCO1lBQzFCLE9BQU8sSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUsbUNBQW1DLEVBQUUsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLCtCQUFnQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RLLENBQUM7UUFFUyxzQkFBc0IsQ0FBQyxLQUFtQjtZQUNuRCxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQy9CLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ25GLE1BQU0sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO2dCQUM3QixPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDdkIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRVMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLHdCQUFzQztZQUN2RSxNQUFNLGlCQUFpQixHQUF3QixFQUFFLENBQUM7WUFDbEQsTUFBTSxLQUFLLEdBQVUsRUFBRSxDQUFDO1lBQ3hCLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLGdDQUFnQyxDQUFDLCtCQUFnQyxDQUFDLDBCQUEwQixDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDbkosTUFBTSxnQkFBUSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFDLFNBQVMsRUFBQyxFQUFFO2dCQUNyRSxJQUFJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDO29CQUM5QyxNQUFNLE9BQU8sR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxTQUFTLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM5TSxJQUFJLE9BQU8sRUFBRSxDQUFDO3dCQUNiLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDaEMsT0FBTztvQkFDUixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsOEJBQStCLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFNLENBQUMsQ0FBQztnQkFDMUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxnQkFBUSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsK0JBQWdDLENBQUMsMEJBQTBCLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hMLElBQUksQ0FBQztnQkFDSixNQUFNLGdCQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsK0JBQWdDLENBQUMsMEJBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1SixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxDQUFDO29CQUNKLE1BQU0sT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6RSxDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM5QixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBOURZLG9GQUFvQzttREFBcEMsb0NBQW9DO1FBRzlDLFdBQUEsd0NBQTJCLENBQUE7UUFDM0IsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSx1REFBaUMsQ0FBQTtRQUNqQyxXQUFBLDhDQUF3QixDQUFBO1FBQ3hCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxpQkFBVyxDQUFBO09BWEQsb0NBQW9DLENBOERoRDtJQUVNLElBQU0sb0NBQW9DLEdBQTFDLE1BQU0sb0NBQXFDLFNBQVEsdUNBQXVDO1FBRWhHLFlBQ0MsRUFBVSxFQUNtQiwwQkFBdUQsRUFDaEUsaUJBQXFDLEVBQ3ZDLGVBQWlDLEVBQzdCLG1CQUF5QyxFQUNYLGdDQUFtRSxFQUM1RSx1QkFBaUQsRUFDN0QsV0FBeUIsRUFDMUIsVUFBdUI7WUFFckQsS0FBSyxDQUFDLEVBQUUsRUFBRSwwQkFBMEIsRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUwzQyxxQ0FBZ0MsR0FBaEMsZ0NBQWdDLENBQW1DO1lBQzVFLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDN0QsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDMUIsZUFBVSxHQUFWLFVBQVUsQ0FBYTtRQUd0RCxDQUFDO1FBRUQsSUFBYSxLQUFLO1lBQ2pCLE9BQU8sSUFBQSxjQUFRLEVBQUMsc0NBQXNDLEVBQUUsc0NBQXNDLENBQUMsQ0FBQztRQUNqRyxDQUFDO1FBRVMsaUJBQWlCO1lBQzFCLE9BQU8sSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsbUNBQW1DLENBQUMsQ0FBQztRQUNuRixDQUFDO1FBRVMsc0JBQXNCLENBQUMsS0FBbUI7WUFDbkQsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQy9CLFNBQVMsQ0FBQyxJQUFJLCtCQUF1QixJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLGdDQUFnQyxDQUFDLDhCQUE4QjttQkFDL0gsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLGdDQUFnQyxDQUFDLDhCQUE4QixJQUFJLElBQUEsMkNBQWlCLEVBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZNLENBQUM7UUFFUyxLQUFLLENBQUMsaUJBQWlCLENBQUMsVUFBd0I7WUFDekQsTUFBTSxpQkFBaUIsR0FBd0IsRUFBRSxDQUFDO1lBQ2xELE1BQU0sS0FBSyxHQUFVLEVBQUUsQ0FBQztZQUN4QixNQUFNLGNBQWMsR0FBRyxNQUFNLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyw4QkFBK0IsQ0FBQywwQkFBMEIsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ2xKLE1BQU0sZ0JBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUMsU0FBUyxFQUFDLEVBQUU7Z0JBQ3ZELElBQUksSUFBSSxDQUFDLHVCQUF1QixDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUM7b0JBQzlDLE1BQU0sT0FBTyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzlNLElBQUksT0FBTyxFQUFFLENBQUM7d0JBQ2IsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUNoQyxPQUFPO29CQUNSLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQywrQkFBZ0MsQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQU0sQ0FBQyxDQUFDO2dCQUMzSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLGdCQUFRLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyw4QkFBK0IsQ0FBQywwQkFBMEIsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkwsSUFBSSxDQUFDO2dCQUNKLE1BQU0sZ0JBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyw4QkFBK0IsQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNKLENBQUM7b0JBQVMsQ0FBQztnQkFDVixJQUFJLENBQUM7b0JBQ0osTUFBTSxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pFLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzlCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUF6RFksb0ZBQW9DO21EQUFwQyxvQ0FBb0M7UUFJOUMsV0FBQSx3Q0FBMkIsQ0FBQTtRQUMzQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSxtQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLHVEQUFpQyxDQUFBO1FBQ2pDLFdBQUEsOENBQXdCLENBQUE7UUFDeEIsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxpQkFBVyxDQUFBO09BWEQsb0NBQW9DLENBeURoRDtJQUVELDJCQUFnQixDQUFDLGVBQWUsQ0FBQyx1REFBdUQsRUFBRSxVQUFVLFFBQTBCLEVBQUUsYUFBcUI7UUFDcEosTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHlDQUF5QixDQUFDLENBQUM7UUFFckUsT0FBTyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBVSx5Q0FBaUMsSUFBSSxDQUFDO2FBQzVGLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxvQkFBb0IsRUFBa0MsQ0FBQzthQUNoRixJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDZixPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sYUFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFELE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsMkJBQWdCLENBQUMsZUFBZSxDQUFDLG1EQUFtRCxFQUFFLFVBQVUsUUFBMEIsRUFBRSxZQUFzQjtRQUNqSixNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUNBQXlCLENBQUMsQ0FBQztRQUVyRSxPQUFPLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDLHVCQUFVLHlDQUFpQyxJQUFJLENBQUM7YUFDNUYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLG9CQUFvQixFQUFrQyxDQUFDO2FBQ2hGLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNmLE1BQU0sS0FBSyxHQUFHLFlBQVk7aUJBQ3hCLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7aUJBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNaLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEIsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFBLDZCQUFhLEVBQUMsNEJBQTRCLEVBQUU7UUFDM0MsSUFBSSxFQUFFLGdDQUFnQjtRQUN0QixLQUFLLEVBQUUsZ0NBQWdCO1FBQ3ZCLE1BQU0sRUFBRSxJQUFJO1FBQ1osT0FBTyxFQUFFLElBQUk7S0FDYixFQUFFLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLGdEQUFnRCxDQUFDLENBQUMsQ0FBQztJQUU1RixJQUFBLDZCQUFhLEVBQUMsNEJBQTRCLEVBQUU7UUFDM0MsSUFBSSxFQUFFLGdDQUFnQjtRQUN0QixLQUFLLEVBQUUsZ0NBQWdCO1FBQ3ZCLE1BQU0sRUFBRSxJQUFJO1FBQ1osT0FBTyxFQUFFLElBQUk7S0FDYixFQUFFLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLGdEQUFnRCxDQUFDLENBQUMsQ0FBQztJQUU1RixJQUFBLDZCQUFhLEVBQUMsaUNBQWlDLEVBQUU7UUFDaEQsSUFBSSxFQUFFLHFDQUFxQjtRQUMzQixLQUFLLEVBQUUscUNBQXFCO1FBQzVCLE1BQU0sRUFBRSxJQUFJO1FBQ1osT0FBTyxFQUFFLElBQUk7S0FDYixFQUFFLElBQUEsY0FBUSxFQUFDLGdDQUFnQyxFQUFFLHNEQUFzRCxDQUFDLENBQUMsQ0FBQztJQUV2RyxJQUFBLDZCQUFhLEVBQUMsMkJBQTJCLEVBQUU7UUFDMUMsSUFBSSxFQUFFLCtCQUFlO1FBQ3JCLEtBQUssRUFBRSwrQkFBZTtRQUN0QixNQUFNLEVBQUUsK0JBQWU7UUFDdkIsT0FBTyxFQUFFLCtCQUFlO0tBQ3hCLEVBQUUsSUFBQSxjQUFRLEVBQUMsMEJBQTBCLEVBQUUsOENBQThDLENBQUMsQ0FBQyxDQUFDO0lBRTVFLFFBQUEsa0NBQWtDLEdBQUcsSUFBQSw2QkFBYSxFQUFDLHFDQUFxQyxFQUFFO1FBQ3RHLElBQUksRUFBRSxnQ0FBZ0I7UUFDdEIsS0FBSyxFQUFFLGdDQUFnQjtRQUN2QixNQUFNLEVBQUUsSUFBSTtRQUNaLE9BQU8sRUFBRSxJQUFJO0tBQ2IsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQ0FBb0MsRUFBRSxxRkFBcUYsQ0FBQyxDQUFDLENBQUM7SUFFMUksSUFBQSw2QkFBYSxFQUFDLHFDQUFxQyxFQUFFO1FBQ3BELElBQUksRUFBRSxnQ0FBZ0I7UUFDdEIsS0FBSyxFQUFFLGdDQUFnQjtRQUN2QixNQUFNLEVBQUUsSUFBSTtRQUNaLE9BQU8sRUFBRSxJQUFJO0tBQ2IsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQ0FBb0MsRUFBRSxxRkFBcUYsQ0FBQyxDQUFDLENBQUM7SUFFMUksSUFBQSw2QkFBYSxFQUFDLDBDQUEwQyxFQUFFO1FBQ3pELElBQUksRUFBRSxxQ0FBcUI7UUFDM0IsS0FBSyxFQUFFLHFDQUFxQjtRQUM1QixNQUFNLEVBQUUsSUFBSTtRQUNaLE9BQU8sRUFBRSxJQUFJO0tBQ2IsRUFBRSxJQUFBLGNBQVEsRUFBQyx5Q0FBeUMsRUFBRSwyRkFBMkYsQ0FBQyxDQUFDLENBQUM7SUFFckosSUFBQSx5Q0FBMEIsRUFBQyxDQUFDLEtBQWtCLEVBQUUsU0FBNkIsRUFBRSxFQUFFO1FBRWhGLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMscUNBQXFCLENBQUMsQ0FBQztRQUN6RCxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLFNBQVMsQ0FBQyxPQUFPLENBQUMsaUVBQWlFLHFCQUFTLENBQUMsYUFBYSxDQUFDLDJCQUFTLENBQUMsYUFBYSxVQUFVLEtBQUssQ0FBQyxDQUFDO1lBQ25KLFNBQVMsQ0FBQyxPQUFPLENBQUMsdURBQXVELHFCQUFTLENBQUMsYUFBYSxDQUFDLDJCQUFTLENBQUMsYUFBYSxVQUFVLEtBQUssQ0FBQyxDQUFDO1lBQ3pJLFNBQVMsQ0FBQyxPQUFPLENBQUMsaUVBQWlFLHFCQUFTLENBQUMsYUFBYSxDQUFDLDJCQUFTLENBQUMsYUFBYSxVQUFVLEtBQUssQ0FBQyxDQUFDO1FBQ3BKLENBQUM7UUFFRCxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLHVDQUF1QixDQUFDLENBQUM7UUFDN0QsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUNsQixTQUFTLENBQUMsT0FBTyxDQUFDLGlFQUFpRSxxQkFBUyxDQUFDLGFBQWEsQ0FBQyw2QkFBVyxDQUFDLGFBQWEsWUFBWSxLQUFLLENBQUMsQ0FBQztZQUN2SixTQUFTLENBQUMsT0FBTyxDQUFDLHVEQUF1RCxxQkFBUyxDQUFDLGFBQWEsQ0FBQyw2QkFBVyxDQUFDLGFBQWEsWUFBWSxLQUFLLENBQUMsQ0FBQztZQUM3SSxTQUFTLENBQUMsT0FBTyxDQUFDLGlFQUFpRSxxQkFBUyxDQUFDLGFBQWEsQ0FBQyw2QkFBVyxDQUFDLGFBQWEsWUFBWSxLQUFLLENBQUMsQ0FBQztRQUN4SixDQUFDO1FBRUQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxvQ0FBb0IsQ0FBQyxDQUFDO1FBQ3ZELElBQUksU0FBUyxFQUFFLENBQUM7WUFDZixTQUFTLENBQUMsT0FBTyxDQUFDLGlFQUFpRSxxQkFBUyxDQUFDLGFBQWEsQ0FBQywwQkFBUSxDQUFDLGFBQWEsU0FBUyxLQUFLLENBQUMsQ0FBQztZQUNqSixTQUFTLENBQUMsT0FBTyxDQUFDLHVEQUF1RCxxQkFBUyxDQUFDLGFBQWEsQ0FBQywwQkFBUSxDQUFDLGFBQWEsU0FBUyxLQUFLLENBQUMsQ0FBQztZQUN2SSxTQUFTLENBQUMsT0FBTyxDQUFDLGlFQUFpRSxxQkFBUyxDQUFDLGFBQWEsQ0FBQywwQkFBUSxDQUFDLGFBQWEsU0FBUyxLQUFLLENBQUMsQ0FBQztRQUNsSixDQUFDO0lBQ0YsQ0FBQyxDQUFDLENBQUMifQ==