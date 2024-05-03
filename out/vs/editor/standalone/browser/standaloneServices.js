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
define(["require", "exports", "vs/base/common/strings", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/common/event", "vs/base/common/keybindings", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/uri", "vs/editor/browser/services/bulkEditService", "vs/editor/common/config/editorConfigurationSchema", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/editor/common/services/textResourceConfiguration", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/abstractKeybindingService", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/label/common/label", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/layout/browser/layoutService", "vs/editor/common/standaloneStrings", "vs/base/common/resources", "vs/editor/browser/services/codeEditorService", "vs/platform/log/common/log", "vs/platform/workspace/common/workspaceTrust", "vs/platform/contextview/browser/contextView", "vs/platform/contextview/browser/contextViewService", "vs/editor/common/services/languageService", "vs/platform/contextview/browser/contextMenuService", "vs/platform/instantiation/common/extensions", "vs/editor/browser/services/openerService", "vs/editor/common/services/editorWorker", "vs/editor/browser/services/editorWorkerService", "vs/editor/common/languages/language", "vs/editor/common/services/markerDecorationsService", "vs/editor/common/services/markerDecorations", "vs/editor/common/services/modelService", "vs/editor/standalone/browser/quickInput/standaloneQuickInputService", "vs/editor/standalone/browser/standaloneThemeService", "vs/editor/standalone/common/standaloneTheme", "vs/platform/accessibility/browser/accessibilityService", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/actions/common/menuService", "vs/platform/clipboard/browser/clipboardService", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/list/browser/listService", "vs/platform/markers/common/markers", "vs/platform/markers/common/markerService", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configurations", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/log/common/logService", "vs/editor/common/editorFeatures", "vs/base/common/errors", "vs/platform/environment/common/environment", "vs/base/browser/window", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/standalone/browser/standaloneCodeEditorService", "vs/editor/standalone/browser/standaloneLayoutService", "vs/platform/undoRedo/common/undoRedoService", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/semanticTokensStylingService", "vs/editor/common/services/languageFeaturesService", "vs/editor/browser/services/hoverService/hoverService"], function (require, exports, strings, dom, keyboardEvent_1, event_1, keybindings_1, lifecycle_1, platform_1, severity_1, uri_1, bulkEditService_1, editorConfigurationSchema_1, editOperation_1, position_1, range_1, model_1, resolverService_1, textResourceConfiguration_1, commands_1, configuration_1, configurationModels_1, contextkey_1, dialogs_1, instantiation_1, abstractKeybindingService_1, keybinding_1, keybindingResolver_1, keybindingsRegistry_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, label_1, notification_1, progress_1, telemetry_1, workspace_1, layoutService_1, standaloneStrings_1, resources_1, codeEditorService_1, log_1, workspaceTrust_1, contextView_1, contextViewService_1, languageService_1, contextMenuService_1, extensions_1, openerService_1, editorWorker_1, editorWorkerService_1, language_1, markerDecorationsService_1, markerDecorations_1, modelService_1, standaloneQuickInputService_1, standaloneThemeService_1, standaloneTheme_1, accessibilityService_1, accessibility_1, actions_1, menuService_1, clipboardService_1, clipboardService_2, contextKeyService_1, descriptors_1, instantiationService_1, serviceCollection_1, listService_1, markers_1, markerService_1, opener_1, quickInput_1, storage_1, configurations_1, accessibilitySignalService_1, logService_1, editorFeatures_1, errors_1, environment_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandaloneServices = exports.StandaloneConfigurationService = exports.StandaloneKeybindingService = exports.StandaloneCommandService = exports.StandaloneNotificationService = void 0;
    exports.updateConfigurationService = updateConfigurationService;
    class SimpleModel {
        constructor(model) {
            this.disposed = false;
            this.model = model;
            this._onWillDispose = new event_1.Emitter();
        }
        get onWillDispose() {
            return this._onWillDispose.event;
        }
        resolve() {
            return Promise.resolve();
        }
        get textEditorModel() {
            return this.model;
        }
        createSnapshot() {
            return this.model.createSnapshot();
        }
        isReadonly() {
            return false;
        }
        dispose() {
            this.disposed = true;
            this._onWillDispose.fire();
        }
        isDisposed() {
            return this.disposed;
        }
        isResolved() {
            return true;
        }
        getLanguageId() {
            return this.model.getLanguageId();
        }
    }
    let StandaloneTextModelService = class StandaloneTextModelService {
        constructor(modelService) {
            this.modelService = modelService;
        }
        createModelReference(resource) {
            const model = this.modelService.getModel(resource);
            if (!model) {
                return Promise.reject(new Error(`Model not found`));
            }
            return Promise.resolve(new lifecycle_1.ImmortalReference(new SimpleModel(model)));
        }
        registerTextModelContentProvider(scheme, provider) {
            return {
                dispose: function () { }
            };
        }
        canHandleResource(resource) {
            return false;
        }
    };
    StandaloneTextModelService = __decorate([
        __param(0, model_1.IModelService)
    ], StandaloneTextModelService);
    class StandaloneEditorProgressService {
        static { this.NULL_PROGRESS_RUNNER = {
            done: () => { },
            total: () => { },
            worked: () => { }
        }; }
        show() {
            return StandaloneEditorProgressService.NULL_PROGRESS_RUNNER;
        }
        async showWhile(promise, delay) {
            await promise;
        }
    }
    class StandaloneProgressService {
        withProgress(_options, task, onDidCancel) {
            return task({
                report: () => { },
            });
        }
    }
    class StandaloneEnvironmentService {
        constructor() {
            this.stateResource = uri_1.URI.from({ scheme: 'monaco', authority: 'stateResource' });
            this.userRoamingDataHome = uri_1.URI.from({ scheme: 'monaco', authority: 'userRoamingDataHome' });
            this.keyboardLayoutResource = uri_1.URI.from({ scheme: 'monaco', authority: 'keyboardLayoutResource' });
            this.argvResource = uri_1.URI.from({ scheme: 'monaco', authority: 'argvResource' });
            this.untitledWorkspacesHome = uri_1.URI.from({ scheme: 'monaco', authority: 'untitledWorkspacesHome' });
            this.workspaceStorageHome = uri_1.URI.from({ scheme: 'monaco', authority: 'workspaceStorageHome' });
            this.localHistoryHome = uri_1.URI.from({ scheme: 'monaco', authority: 'localHistoryHome' });
            this.cacheHome = uri_1.URI.from({ scheme: 'monaco', authority: 'cacheHome' });
            this.userDataSyncHome = uri_1.URI.from({ scheme: 'monaco', authority: 'userDataSyncHome' });
            this.sync = undefined;
            this.continueOn = undefined;
            this.editSessionId = undefined;
            this.debugExtensionHost = { port: null, break: false };
            this.isExtensionDevelopment = false;
            this.disableExtensions = false;
            this.enableExtensions = undefined;
            this.extensionDevelopmentLocationURI = undefined;
            this.extensionDevelopmentKind = undefined;
            this.extensionTestsLocationURI = undefined;
            this.logsHome = uri_1.URI.from({ scheme: 'monaco', authority: 'logsHome' });
            this.logLevel = undefined;
            this.extensionLogLevel = undefined;
            this.verbose = false;
            this.isBuilt = false;
            this.disableTelemetry = false;
            this.serviceMachineIdResource = uri_1.URI.from({ scheme: 'monaco', authority: 'serviceMachineIdResource' });
            this.policyFile = undefined;
        }
    }
    class StandaloneDialogService {
        constructor() {
            this.onWillShowDialog = event_1.Event.None;
            this.onDidShowDialog = event_1.Event.None;
        }
        async confirm(confirmation) {
            const confirmed = this.doConfirm(confirmation.message, confirmation.detail);
            return {
                confirmed,
                checkboxChecked: false // unsupported
            };
        }
        doConfirm(message, detail) {
            let messageText = message;
            if (detail) {
                messageText = messageText + '\n\n' + detail;
            }
            return window_1.mainWindow.confirm(messageText);
        }
        async prompt(prompt) {
            let result = undefined;
            const confirmed = this.doConfirm(prompt.message, prompt.detail);
            if (confirmed) {
                const promptButtons = [...(prompt.buttons ?? [])];
                if (prompt.cancelButton && typeof prompt.cancelButton !== 'string' && typeof prompt.cancelButton !== 'boolean') {
                    promptButtons.push(prompt.cancelButton);
                }
                result = await promptButtons[0]?.run({ checkboxChecked: false });
            }
            return { result };
        }
        async info(message, detail) {
            await this.prompt({ type: severity_1.default.Info, message, detail });
        }
        async warn(message, detail) {
            await this.prompt({ type: severity_1.default.Warning, message, detail });
        }
        async error(message, detail) {
            await this.prompt({ type: severity_1.default.Error, message, detail });
        }
        input() {
            return Promise.resolve({ confirmed: false }); // unsupported
        }
        about() {
            return Promise.resolve(undefined);
        }
    }
    class StandaloneNotificationService {
        constructor() {
            this.onDidAddNotification = event_1.Event.None;
            this.onDidRemoveNotification = event_1.Event.None;
            this.onDidChangeFilter = event_1.Event.None;
        }
        static { this.NO_OP = new notification_1.NoOpNotification(); }
        info(message) {
            return this.notify({ severity: severity_1.default.Info, message });
        }
        warn(message) {
            return this.notify({ severity: severity_1.default.Warning, message });
        }
        error(error) {
            return this.notify({ severity: severity_1.default.Error, message: error });
        }
        notify(notification) {
            switch (notification.severity) {
                case severity_1.default.Error:
                    console.error(notification.message);
                    break;
                case severity_1.default.Warning:
                    console.warn(notification.message);
                    break;
                default:
                    console.log(notification.message);
                    break;
            }
            return StandaloneNotificationService.NO_OP;
        }
        prompt(severity, message, choices, options) {
            return StandaloneNotificationService.NO_OP;
        }
        status(message, options) {
            return lifecycle_1.Disposable.None;
        }
        setFilter(filter) { }
        getFilter(source) {
            return notification_1.NotificationsFilter.OFF;
        }
        getFilters() {
            return [];
        }
        removeFilter(sourceId) { }
    }
    exports.StandaloneNotificationService = StandaloneNotificationService;
    let StandaloneCommandService = class StandaloneCommandService {
        constructor(instantiationService) {
            this._onWillExecuteCommand = new event_1.Emitter();
            this._onDidExecuteCommand = new event_1.Emitter();
            this.onWillExecuteCommand = this._onWillExecuteCommand.event;
            this.onDidExecuteCommand = this._onDidExecuteCommand.event;
            this._instantiationService = instantiationService;
        }
        executeCommand(id, ...args) {
            const command = commands_1.CommandsRegistry.getCommand(id);
            if (!command) {
                return Promise.reject(new Error(`command '${id}' not found`));
            }
            try {
                this._onWillExecuteCommand.fire({ commandId: id, args });
                const result = this._instantiationService.invokeFunction.apply(this._instantiationService, [command.handler, ...args]);
                this._onDidExecuteCommand.fire({ commandId: id, args });
                return Promise.resolve(result);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    };
    exports.StandaloneCommandService = StandaloneCommandService;
    exports.StandaloneCommandService = StandaloneCommandService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], StandaloneCommandService);
    let StandaloneKeybindingService = class StandaloneKeybindingService extends abstractKeybindingService_1.AbstractKeybindingService {
        constructor(contextKeyService, commandService, telemetryService, notificationService, logService, codeEditorService) {
            super(contextKeyService, commandService, telemetryService, notificationService, logService);
            this._cachedResolver = null;
            this._dynamicKeybindings = [];
            this._domNodeListeners = [];
            const addContainer = (domNode) => {
                const disposables = new lifecycle_1.DisposableStore();
                // for standard keybindings
                disposables.add(dom.addDisposableListener(domNode, dom.EventType.KEY_DOWN, (e) => {
                    const keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    const shouldPreventDefault = this._dispatch(keyEvent, keyEvent.target);
                    if (shouldPreventDefault) {
                        keyEvent.preventDefault();
                        keyEvent.stopPropagation();
                    }
                }));
                // for single modifier chord keybindings (e.g. shift shift)
                disposables.add(dom.addDisposableListener(domNode, dom.EventType.KEY_UP, (e) => {
                    const keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    const shouldPreventDefault = this._singleModifierDispatch(keyEvent, keyEvent.target);
                    if (shouldPreventDefault) {
                        keyEvent.preventDefault();
                    }
                }));
                this._domNodeListeners.push(new DomNodeListeners(domNode, disposables));
            };
            const removeContainer = (domNode) => {
                for (let i = 0; i < this._domNodeListeners.length; i++) {
                    const domNodeListeners = this._domNodeListeners[i];
                    if (domNodeListeners.domNode === domNode) {
                        this._domNodeListeners.splice(i, 1);
                        domNodeListeners.dispose();
                    }
                }
            };
            const addCodeEditor = (codeEditor) => {
                if (codeEditor.getOption(61 /* EditorOption.inDiffEditor */)) {
                    return;
                }
                addContainer(codeEditor.getContainerDomNode());
            };
            const removeCodeEditor = (codeEditor) => {
                if (codeEditor.getOption(61 /* EditorOption.inDiffEditor */)) {
                    return;
                }
                removeContainer(codeEditor.getContainerDomNode());
            };
            this._register(codeEditorService.onCodeEditorAdd(addCodeEditor));
            this._register(codeEditorService.onCodeEditorRemove(removeCodeEditor));
            codeEditorService.listCodeEditors().forEach(addCodeEditor);
            const addDiffEditor = (diffEditor) => {
                addContainer(diffEditor.getContainerDomNode());
            };
            const removeDiffEditor = (diffEditor) => {
                removeContainer(diffEditor.getContainerDomNode());
            };
            this._register(codeEditorService.onDiffEditorAdd(addDiffEditor));
            this._register(codeEditorService.onDiffEditorRemove(removeDiffEditor));
            codeEditorService.listDiffEditors().forEach(addDiffEditor);
        }
        addDynamicKeybinding(command, keybinding, handler, when) {
            return (0, lifecycle_1.combinedDisposable)(commands_1.CommandsRegistry.registerCommand(command, handler), this.addDynamicKeybindings([{
                    keybinding,
                    command,
                    when
                }]));
        }
        addDynamicKeybindings(rules) {
            const entries = rules.map((rule) => {
                const keybinding = (0, keybindings_1.decodeKeybinding)(rule.keybinding, platform_1.OS);
                return {
                    keybinding,
                    command: rule.command ?? null,
                    commandArgs: rule.commandArgs,
                    when: rule.when,
                    weight1: 1000,
                    weight2: 0,
                    extensionId: null,
                    isBuiltinExtension: false
                };
            });
            this._dynamicKeybindings = this._dynamicKeybindings.concat(entries);
            this.updateResolver();
            return (0, lifecycle_1.toDisposable)(() => {
                // Search the first entry and remove them all since they will be contiguous
                for (let i = 0; i < this._dynamicKeybindings.length; i++) {
                    if (this._dynamicKeybindings[i] === entries[0]) {
                        this._dynamicKeybindings.splice(i, entries.length);
                        this.updateResolver();
                        return;
                    }
                }
            });
        }
        updateResolver() {
            this._cachedResolver = null;
            this._onDidUpdateKeybindings.fire();
        }
        _getResolver() {
            if (!this._cachedResolver) {
                const defaults = this._toNormalizedKeybindingItems(keybindingsRegistry_1.KeybindingsRegistry.getDefaultKeybindings(), true);
                const overrides = this._toNormalizedKeybindingItems(this._dynamicKeybindings, false);
                this._cachedResolver = new keybindingResolver_1.KeybindingResolver(defaults, overrides, (str) => this._log(str));
            }
            return this._cachedResolver;
        }
        _documentHasFocus() {
            return window_1.mainWindow.document.hasFocus();
        }
        _toNormalizedKeybindingItems(items, isDefault) {
            const result = [];
            let resultLen = 0;
            for (const item of items) {
                const when = item.when || undefined;
                const keybinding = item.keybinding;
                if (!keybinding) {
                    // This might be a removal keybinding item in user settings => accept it
                    result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(undefined, item.command, item.commandArgs, when, isDefault, null, false);
                }
                else {
                    const resolvedKeybindings = usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveKeybinding(keybinding, platform_1.OS);
                    for (const resolvedKeybinding of resolvedKeybindings) {
                        result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, item.command, item.commandArgs, when, isDefault, null, false);
                    }
                }
            }
            return result;
        }
        resolveKeybinding(keybinding) {
            return usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveKeybinding(keybinding, platform_1.OS);
        }
        resolveKeyboardEvent(keyboardEvent) {
            const chord = new keybindings_1.KeyCodeChord(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode);
            return new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding([chord], platform_1.OS);
        }
        resolveUserBinding(userBinding) {
            return [];
        }
        _dumpDebugInfo() {
            return '';
        }
        _dumpDebugInfoJSON() {
            return '';
        }
        registerSchemaContribution(contribution) {
            // noop
        }
        /**
         * not yet supported
         */
        enableKeybindingHoldMode(commandId) {
            return undefined;
        }
    };
    exports.StandaloneKeybindingService = StandaloneKeybindingService;
    exports.StandaloneKeybindingService = StandaloneKeybindingService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, commands_1.ICommandService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService),
        __param(5, codeEditorService_1.ICodeEditorService)
    ], StandaloneKeybindingService);
    class DomNodeListeners extends lifecycle_1.Disposable {
        constructor(domNode, disposables) {
            super();
            this.domNode = domNode;
            this._register(disposables);
        }
    }
    function isConfigurationOverrides(thing) {
        return thing
            && typeof thing === 'object'
            && (!thing.overrideIdentifier || typeof thing.overrideIdentifier === 'string')
            && (!thing.resource || thing.resource instanceof uri_1.URI);
    }
    class StandaloneConfigurationService {
        constructor() {
            this._onDidChangeConfiguration = new event_1.Emitter();
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            const defaultConfiguration = new configurations_1.DefaultConfiguration();
            this._configuration = new configurationModels_1.Configuration(defaultConfiguration.reload(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            defaultConfiguration.dispose();
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = isConfigurationOverrides(arg1) ? arg1 : isConfigurationOverrides(arg2) ? arg2 : {};
            return this._configuration.getValue(section, overrides, undefined);
        }
        updateValues(values) {
            const previous = { data: this._configuration.toData() };
            const changedKeys = [];
            for (const entry of values) {
                const [key, value] = entry;
                if (this.getValue(key) === value) {
                    continue;
                }
                this._configuration.updateValue(key, value);
                changedKeys.push(key);
            }
            if (changedKeys.length > 0) {
                const configurationChangeEvent = new configurationModels_1.ConfigurationChangeEvent({ keys: changedKeys, overrides: [] }, previous, this._configuration);
                configurationChangeEvent.source = 8 /* ConfigurationTarget.MEMORY */;
                this._onDidChangeConfiguration.fire(configurationChangeEvent);
            }
            return Promise.resolve();
        }
        updateValue(key, value, arg3, arg4) {
            return this.updateValues([[key, value]]);
        }
        inspect(key, options = {}) {
            return this._configuration.inspect(key, options, undefined);
        }
        keys() {
            return this._configuration.keys(undefined);
        }
        reloadConfiguration() {
            return Promise.resolve(undefined);
        }
        getConfigurationData() {
            const emptyModel = {
                contents: {},
                keys: [],
                overrides: []
            };
            return {
                defaults: emptyModel,
                policy: emptyModel,
                application: emptyModel,
                user: emptyModel,
                workspace: emptyModel,
                folders: []
            };
        }
    }
    exports.StandaloneConfigurationService = StandaloneConfigurationService;
    let StandaloneResourceConfigurationService = class StandaloneResourceConfigurationService {
        constructor(configurationService, modelService, languageService) {
            this.configurationService = configurationService;
            this.modelService = modelService;
            this.languageService = languageService;
            this._onDidChangeConfiguration = new event_1.Emitter();
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.configurationService.onDidChangeConfiguration((e) => {
                this._onDidChangeConfiguration.fire({ affectedKeys: e.affectedKeys, affectsConfiguration: (resource, configuration) => e.affectsConfiguration(configuration) });
            });
        }
        getValue(resource, arg2, arg3) {
            const position = position_1.Position.isIPosition(arg2) ? arg2 : null;
            const section = position ? (typeof arg3 === 'string' ? arg3 : undefined) : (typeof arg2 === 'string' ? arg2 : undefined);
            const language = resource ? this.getLanguage(resource, position) : undefined;
            if (typeof section === 'undefined') {
                return this.configurationService.getValue({
                    resource,
                    overrideIdentifier: language
                });
            }
            return this.configurationService.getValue(section, {
                resource,
                overrideIdentifier: language
            });
        }
        inspect(resource, position, section) {
            const language = resource ? this.getLanguage(resource, position) : undefined;
            return this.configurationService.inspect(section, { resource, overrideIdentifier: language });
        }
        getLanguage(resource, position) {
            const model = this.modelService.getModel(resource);
            if (model) {
                return position ? model.getLanguageIdAtPosition(position.lineNumber, position.column) : model.getLanguageId();
            }
            return this.languageService.guessLanguageIdByFilepathOrFirstLine(resource);
        }
        updateValue(resource, key, value, configurationTarget) {
            return this.configurationService.updateValue(key, value, { resource }, configurationTarget);
        }
    };
    StandaloneResourceConfigurationService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService)
    ], StandaloneResourceConfigurationService);
    let StandaloneResourcePropertiesService = class StandaloneResourcePropertiesService {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getEOL(resource, language) {
            const eol = this.configurationService.getValue('files.eol', { overrideIdentifier: language, resource });
            if (eol && typeof eol === 'string' && eol !== 'auto') {
                return eol;
            }
            return (platform_1.isLinux || platform_1.isMacintosh) ? '\n' : '\r\n';
        }
    };
    StandaloneResourcePropertiesService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], StandaloneResourcePropertiesService);
    class StandaloneTelemetryService {
        constructor() {
            this.telemetryLevel = 0 /* TelemetryLevel.NONE */;
            this.sessionId = 'someValue.sessionId';
            this.machineId = 'someValue.machineId';
            this.sqmId = 'someValue.sqmId';
            this.firstSessionDate = 'someValue.firstSessionDate';
            this.sendErrorTelemetry = false;
        }
        setEnabled() { }
        setExperimentProperty() { }
        publicLog() { }
        publicLog2() { }
        publicLogError() { }
        publicLogError2() { }
    }
    class StandaloneWorkspaceContextService {
        static { this.SCHEME = 'inmemory'; }
        constructor() {
            this._onDidChangeWorkspaceName = new event_1.Emitter();
            this.onDidChangeWorkspaceName = this._onDidChangeWorkspaceName.event;
            this._onWillChangeWorkspaceFolders = new event_1.Emitter();
            this.onWillChangeWorkspaceFolders = this._onWillChangeWorkspaceFolders.event;
            this._onDidChangeWorkspaceFolders = new event_1.Emitter();
            this.onDidChangeWorkspaceFolders = this._onDidChangeWorkspaceFolders.event;
            this._onDidChangeWorkbenchState = new event_1.Emitter();
            this.onDidChangeWorkbenchState = this._onDidChangeWorkbenchState.event;
            const resource = uri_1.URI.from({ scheme: StandaloneWorkspaceContextService.SCHEME, authority: 'model', path: '/' });
            this.workspace = { id: workspace_1.STANDALONE_EDITOR_WORKSPACE_ID, folders: [new workspace_1.WorkspaceFolder({ uri: resource, name: '', index: 0 })] };
        }
        getCompleteWorkspace() {
            return Promise.resolve(this.getWorkspace());
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkbenchState() {
            if (this.workspace) {
                if (this.workspace.configuration) {
                    return 3 /* WorkbenchState.WORKSPACE */;
                }
                return 2 /* WorkbenchState.FOLDER */;
            }
            return 1 /* WorkbenchState.EMPTY */;
        }
        getWorkspaceFolder(resource) {
            return resource && resource.scheme === StandaloneWorkspaceContextService.SCHEME ? this.workspace.folders[0] : null;
        }
        isInsideWorkspace(resource) {
            return resource && resource.scheme === StandaloneWorkspaceContextService.SCHEME;
        }
        isCurrentWorkspace(workspaceIdOrFolder) {
            return true;
        }
    }
    function updateConfigurationService(configurationService, source, isDiffEditor) {
        if (!source) {
            return;
        }
        if (!(configurationService instanceof StandaloneConfigurationService)) {
            return;
        }
        const toUpdate = [];
        Object.keys(source).forEach((key) => {
            if ((0, editorConfigurationSchema_1.isEditorConfigurationKey)(key)) {
                toUpdate.push([`editor.${key}`, source[key]]);
            }
            if (isDiffEditor && (0, editorConfigurationSchema_1.isDiffEditorConfigurationKey)(key)) {
                toUpdate.push([`diffEditor.${key}`, source[key]]);
            }
        });
        if (toUpdate.length > 0) {
            configurationService.updateValues(toUpdate);
        }
    }
    let StandaloneBulkEditService = class StandaloneBulkEditService {
        constructor(_modelService) {
            this._modelService = _modelService;
            //
        }
        hasPreviewHandler() {
            return false;
        }
        setPreviewHandler() {
            return lifecycle_1.Disposable.None;
        }
        async apply(editsIn, _options) {
            const edits = Array.isArray(editsIn) ? editsIn : bulkEditService_1.ResourceEdit.convert(editsIn);
            const textEdits = new Map();
            for (const edit of edits) {
                if (!(edit instanceof bulkEditService_1.ResourceTextEdit)) {
                    throw new Error('bad edit - only text edits are supported');
                }
                const model = this._modelService.getModel(edit.resource);
                if (!model) {
                    throw new Error('bad edit - model not found');
                }
                if (typeof edit.versionId === 'number' && model.getVersionId() !== edit.versionId) {
                    throw new Error('bad state - model changed in the meantime');
                }
                let array = textEdits.get(model);
                if (!array) {
                    array = [];
                    textEdits.set(model, array);
                }
                array.push(editOperation_1.EditOperation.replaceMove(range_1.Range.lift(edit.textEdit.range), edit.textEdit.text));
            }
            let totalEdits = 0;
            let totalFiles = 0;
            for (const [model, edits] of textEdits) {
                model.pushStackElement();
                model.pushEditOperations([], edits, () => []);
                model.pushStackElement();
                totalFiles += 1;
                totalEdits += edits.length;
            }
            return {
                ariaSummary: strings.format(standaloneStrings_1.StandaloneServicesNLS.bulkEditServiceSummary, totalEdits, totalFiles),
                isApplied: totalEdits > 0
            };
        }
    };
    StandaloneBulkEditService = __decorate([
        __param(0, model_1.IModelService)
    ], StandaloneBulkEditService);
    class StandaloneUriLabelService {
        constructor() {
            this.onDidChangeFormatters = event_1.Event.None;
        }
        getUriLabel(resource, options) {
            if (resource.scheme === 'file') {
                return resource.fsPath;
            }
            return resource.path;
        }
        getUriBasenameLabel(resource) {
            return (0, resources_1.basename)(resource);
        }
        getWorkspaceLabel(workspace, options) {
            return '';
        }
        getSeparator(scheme, authority) {
            return '/';
        }
        registerFormatter(formatter) {
            throw new Error('Not implemented');
        }
        registerCachedFormatter(formatter) {
            return this.registerFormatter(formatter);
        }
        getHostLabel() {
            return '';
        }
        getHostTooltip() {
            return undefined;
        }
    }
    let StandaloneContextViewService = class StandaloneContextViewService extends contextViewService_1.ContextViewService {
        constructor(layoutService, _codeEditorService) {
            super(layoutService);
            this._codeEditorService = _codeEditorService;
        }
        showContextView(delegate, container, shadowRoot) {
            if (!container) {
                const codeEditor = this._codeEditorService.getFocusedCodeEditor() || this._codeEditorService.getActiveCodeEditor();
                if (codeEditor) {
                    container = codeEditor.getContainerDomNode();
                }
            }
            return super.showContextView(delegate, container, shadowRoot);
        }
    };
    StandaloneContextViewService = __decorate([
        __param(0, layoutService_1.ILayoutService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], StandaloneContextViewService);
    class StandaloneWorkspaceTrustManagementService {
        constructor() {
            this._neverEmitter = new event_1.Emitter();
            this.onDidChangeTrust = this._neverEmitter.event;
            this.onDidChangeTrustedFolders = this._neverEmitter.event;
            this.workspaceResolved = Promise.resolve();
            this.workspaceTrustInitialized = Promise.resolve();
            this.acceptsOutOfWorkspaceFiles = true;
        }
        isWorkspaceTrusted() {
            return true;
        }
        isWorkspaceTrustForced() {
            return false;
        }
        canSetParentFolderTrust() {
            return false;
        }
        async setParentFolderTrust(trusted) {
            // noop
        }
        canSetWorkspaceTrust() {
            return false;
        }
        async setWorkspaceTrust(trusted) {
            // noop
        }
        getUriTrustInfo(uri) {
            throw new Error('Method not supported.');
        }
        async setUrisTrust(uri, trusted) {
            // noop
        }
        getTrustedUris() {
            return [];
        }
        async setTrustedUris(uris) {
            // noop
        }
        addWorkspaceTrustTransitionParticipant(participant) {
            throw new Error('Method not supported.');
        }
    }
    class StandaloneLanguageService extends languageService_1.LanguageService {
        constructor() {
            super();
        }
    }
    class StandaloneLogService extends logService_1.LogService {
        constructor() {
            super(new log_1.ConsoleLogger());
        }
    }
    let StandaloneContextMenuService = class StandaloneContextMenuService extends contextMenuService_1.ContextMenuService {
        constructor(telemetryService, notificationService, contextViewService, keybindingService, menuService, contextKeyService) {
            super(telemetryService, notificationService, contextViewService, keybindingService, menuService, contextKeyService);
            this.configure({ blockMouse: false }); // we do not want that in the standalone editor
        }
    };
    StandaloneContextMenuService = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, notification_1.INotificationService),
        __param(2, contextView_1.IContextViewService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, actions_1.IMenuService),
        __param(5, contextkey_1.IContextKeyService)
    ], StandaloneContextMenuService);
    class StandaloneAccessbilitySignalService {
        async playSignal(cue, options) {
        }
        async playSignals(cues) {
        }
        isSoundEnabled(cue) {
            return false;
        }
        isAnnouncementEnabled(cue) {
            return false;
        }
        onSoundEnabledChanged(cue) {
            return event_1.Event.None;
        }
        onAnnouncementEnabledChanged(cue) {
            return event_1.Event.None;
        }
        async playSound(cue, allowManyInParallel) {
        }
        playSignalLoop(cue) {
            return (0, lifecycle_1.toDisposable)(() => { });
        }
    }
    (0, extensions_1.registerSingleton)(configuration_1.IConfigurationService, StandaloneConfigurationService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(textResourceConfiguration_1.ITextResourceConfigurationService, StandaloneResourceConfigurationService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(textResourceConfiguration_1.ITextResourcePropertiesService, StandaloneResourcePropertiesService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(workspace_1.IWorkspaceContextService, StandaloneWorkspaceContextService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(label_1.ILabelService, StandaloneUriLabelService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(telemetry_1.ITelemetryService, StandaloneTelemetryService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(dialogs_1.IDialogService, StandaloneDialogService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(environment_1.IEnvironmentService, StandaloneEnvironmentService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(notification_1.INotificationService, StandaloneNotificationService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(markers_1.IMarkerService, markerService_1.MarkerService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(language_1.ILanguageService, StandaloneLanguageService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(standaloneTheme_1.IStandaloneThemeService, standaloneThemeService_1.StandaloneThemeService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(log_1.ILogService, StandaloneLogService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(model_1.IModelService, modelService_1.ModelService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(markerDecorations_1.IMarkerDecorationsService, markerDecorationsService_1.MarkerDecorationsService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(contextkey_1.IContextKeyService, contextKeyService_1.ContextKeyService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(progress_1.IProgressService, StandaloneProgressService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(progress_1.IEditorProgressService, StandaloneEditorProgressService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(storage_1.IStorageService, storage_1.InMemoryStorageService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(editorWorker_1.IEditorWorkerService, editorWorkerService_1.EditorWorkerService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(bulkEditService_1.IBulkEditService, StandaloneBulkEditService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(workspaceTrust_1.IWorkspaceTrustManagementService, StandaloneWorkspaceTrustManagementService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(resolverService_1.ITextModelService, StandaloneTextModelService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(accessibility_1.IAccessibilityService, accessibilityService_1.AccessibilityService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(listService_1.IListService, listService_1.ListService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(commands_1.ICommandService, StandaloneCommandService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(keybinding_1.IKeybindingService, StandaloneKeybindingService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(quickInput_1.IQuickInputService, standaloneQuickInputService_1.StandaloneQuickInputService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(contextView_1.IContextViewService, StandaloneContextViewService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(opener_1.IOpenerService, openerService_1.OpenerService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(clipboardService_2.IClipboardService, clipboardService_1.BrowserClipboardService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(contextView_1.IContextMenuService, StandaloneContextMenuService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(actions_1.IMenuService, menuService_1.MenuService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(accessibilitySignalService_1.IAccessibilitySignalService, StandaloneAccessbilitySignalService, 0 /* InstantiationType.Eager */);
    /**
     * We don't want to eagerly instantiate services because embedders get a one time chance
     * to override services when they create the first editor.
     */
    var StandaloneServices;
    (function (StandaloneServices) {
        const serviceCollection = new serviceCollection_1.ServiceCollection();
        for (const [id, descriptor] of (0, extensions_1.getSingletonServiceDescriptors)()) {
            serviceCollection.set(id, descriptor);
        }
        const instantiationService = new instantiationService_1.InstantiationService(serviceCollection, true);
        serviceCollection.set(instantiation_1.IInstantiationService, instantiationService);
        function get(serviceId) {
            if (!initialized) {
                initialize({});
            }
            const r = serviceCollection.get(serviceId);
            if (!r) {
                throw new Error('Missing service ' + serviceId);
            }
            if (r instanceof descriptors_1.SyncDescriptor) {
                return instantiationService.invokeFunction((accessor) => accessor.get(serviceId));
            }
            else {
                return r;
            }
        }
        StandaloneServices.get = get;
        let initialized = false;
        const onDidInitialize = new event_1.Emitter();
        function initialize(overrides) {
            if (initialized) {
                return instantiationService;
            }
            initialized = true;
            // Add singletons that were registered after this module loaded
            for (const [id, descriptor] of (0, extensions_1.getSingletonServiceDescriptors)()) {
                if (!serviceCollection.get(id)) {
                    serviceCollection.set(id, descriptor);
                }
            }
            // Initialize the service collection with the overrides, but only if the
            // service was not instantiated in the meantime.
            for (const serviceId in overrides) {
                if (overrides.hasOwnProperty(serviceId)) {
                    const serviceIdentifier = (0, instantiation_1.createDecorator)(serviceId);
                    const r = serviceCollection.get(serviceIdentifier);
                    if (r instanceof descriptors_1.SyncDescriptor) {
                        serviceCollection.set(serviceIdentifier, overrides[serviceId]);
                    }
                }
            }
            // Instantiate all editor features
            const editorFeatures = (0, editorFeatures_1.getEditorFeatures)();
            for (const feature of editorFeatures) {
                try {
                    instantiationService.createInstance(feature);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
            }
            onDidInitialize.fire();
            return instantiationService;
        }
        StandaloneServices.initialize = initialize;
        /**
         * Executes callback once services are initialized.
         */
        function withServices(callback) {
            if (initialized) {
                return callback();
            }
            const disposable = new lifecycle_1.DisposableStore();
            const listener = disposable.add(onDidInitialize.event(() => {
                listener.dispose();
                disposable.add(callback());
            }));
            return disposable;
        }
        StandaloneServices.withServices = withServices;
    })(StandaloneServices || (exports.StandaloneServices = StandaloneServices = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZVNlcnZpY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3Ivc3RhbmRhbG9uZS9icm93c2VyL3N0YW5kYWxvbmVTZXJ2aWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyMEJoRyxnRUFtQkM7SUFod0JELE1BQU0sV0FBVztRQUtoQixZQUFZLEtBQWlCO1lBeUJyQixhQUFRLEdBQUcsS0FBSyxDQUFDO1lBeEJ4QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7UUFDM0MsQ0FBQztRQUVELElBQVcsYUFBYTtZQUN2QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO1FBQ2xDLENBQUM7UUFFTSxPQUFPO1lBQ2IsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVELElBQVcsZUFBZTtZQUN6QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVNLGNBQWM7WUFDcEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3BDLENBQUM7UUFFTSxVQUFVO1lBQ2hCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUdNLE9BQU87WUFDYixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUVyQixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVCLENBQUM7UUFFTSxVQUFVO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRU0sVUFBVTtZQUNoQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTSxhQUFhO1lBQ25CLE9BQU8s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