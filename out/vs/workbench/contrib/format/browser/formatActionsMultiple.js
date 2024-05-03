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
define(["require", "exports", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/quickinput/common/quickInput", "vs/base/common/cancellation", "vs/platform/instantiation/common/instantiation", "vs/editor/contrib/format/browser/format", "vs/editor/common/core/range", "vs/platform/telemetry/common/telemetry", "vs/platform/extensions/common/extensions", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/contributions", "vs/workbench/services/extensions/common/extensions", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/editor/common/languages/language", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/editor/common/config/editorConfigurationSchema", "vs/platform/dialogs/common/dialogs", "vs/editor/common/services/languageFeatures", "vs/workbench/services/languageStatus/common/languageStatusService", "vs/workbench/services/editor/common/editorService", "vs/platform/commands/common/commands", "vs/base/common/uuid"], function (require, exports, editorBrowser_1, editorExtensions_1, editorContextKeys_1, nls, contextkey_1, quickInput_1, cancellation_1, instantiation_1, format_1, range_1, telemetry_1, extensions_1, platform_1, configurationRegistry_1, contributions_1, extensions_2, lifecycle_1, configuration_1, notification_1, language_1, extensionManagement_1, editorConfigurationSchema_1, dialogs_1, languageFeatures_1, languageStatusService_1, editorService_1, commands_1, uuid_1) {
    "use strict";
    var DefaultFormatter_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let DefaultFormatter = class DefaultFormatter extends lifecycle_1.Disposable {
        static { DefaultFormatter_1 = this; }
        static { this.configName = 'editor.defaultFormatter'; }
        static { this.extensionIds = []; }
        static { this.extensionItemLabels = []; }
        static { this.extensionDescriptions = []; }
        constructor(_extensionService, _extensionEnablementService, _configService, _notificationService, _dialogService, _quickInputService, _languageService, _languageFeaturesService, _languageStatusService, _editorService) {
            super();
            this._extensionService = _extensionService;
            this._extensionEnablementService = _extensionEnablementService;
            this._configService = _configService;
            this._notificationService = _notificationService;
            this._dialogService = _dialogService;
            this._quickInputService = _quickInputService;
            this._languageService = _languageService;
            this._languageFeaturesService = _languageFeaturesService;
            this._languageStatusService = _languageStatusService;
            this._editorService = _editorService;
            this._languageStatusStore = this._store.add(new lifecycle_1.DisposableStore());
            this._store.add(this._extensionService.onDidChangeExtensions(this._updateConfigValues, this));
            this._store.add(format_1.FormattingConflicts.setFormatterSelector((formatter, document, mode, kind) => this._selectFormatter(formatter, document, mode, kind)));
            this._store.add(_editorService.onDidActiveEditorChange(this._updateStatus, this));
            this._store.add(_languageFeaturesService.documentFormattingEditProvider.onDidChange(this._updateStatus, this));
            this._store.add(_languageFeaturesService.documentRangeFormattingEditProvider.onDidChange(this._updateStatus, this));
            this._store.add(_configService.onDidChangeConfiguration(e => e.affectsConfiguration(DefaultFormatter_1.configName) && this._updateStatus()));
            this._updateConfigValues();
        }
        async _updateConfigValues() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            let extensions = [...this._extensionService.extensions];
            extensions = extensions.sort((a, b) => {
                const boostA = a.categories?.find(cat => cat === 'Formatters' || cat === 'Programming Languages');
                const boostB = b.categories?.find(cat => cat === 'Formatters' || cat === 'Programming Languages');
                if (boostA && !boostB) {
                    return -1;
                }
                else if (!boostA && boostB) {
                    return 1;
                }
                else {
                    return a.name.localeCompare(b.name);
                }
            });
            DefaultFormatter_1.extensionIds.length = 0;
            DefaultFormatter_1.extensionItemLabels.length = 0;
            DefaultFormatter_1.extensionDescriptions.length = 0;
            DefaultFormatter_1.extensionIds.push(null);
            DefaultFormatter_1.extensionItemLabels.push(nls.localize('null', 'None'));
            DefaultFormatter_1.extensionDescriptions.push(nls.localize('nullFormatterDescription', "None"));
            for (const extension of extensions) {
                if (extension.main || extension.browser) {
                    DefaultFormatter_1.extensionIds.push(extension.identifier.value);
                    DefaultFormatter_1.extensionItemLabels.push(extension.displayName ?? '');
                    DefaultFormatter_1.extensionDescriptions.push(extension.description ?? '');
                }
            }
        }
        static _maybeQuotes(s) {
            return s.match(/\s/) ? `'${s}'` : s;
        }
        async _analyzeFormatter(kind, formatter, document) {
            const defaultFormatterId = this._configService.getValue(DefaultFormatter_1.configName, {
                resource: document.uri,
                overrideIdentifier: document.getLanguageId()
            });
            if (defaultFormatterId) {
                // good -> formatter configured
                const defaultFormatter = formatter.find(formatter => extensions_1.ExtensionIdentifier.equals(formatter.extensionId, defaultFormatterId));
                if (defaultFormatter) {
                    // formatter available
                    return defaultFormatter;
                }
                // bad -> formatter gone
                const extension = await this._extensionService.getExtension(defaultFormatterId);
                if (extension && this._extensionEnablementService.isEnabled((0, extensions_2.toExtension)(extension))) {
                    // formatter does not target this file
                    const langName = this._languageService.getLanguageName(document.getLanguageId()) || document.getLanguageId();
                    const detail = kind === 1 /* FormattingKind.File */
                        ? nls.localize('miss.1', "Extension '{0}' is configured as formatter but it cannot format '{1}'-files", extension.displayName || extension.name, langName)
                        : nls.localize('miss.2', "Extension '{0}' is configured as formatter but it can only format '{1}'-files as a whole, not selections or parts of it.", extension.displayName || extension.name, langName);
                    return detail;
                }
            }
            else if (formatter.length === 1) {
                // ok -> nothing configured but only one formatter available
                return formatter[0];
            }
            const langName = this._languageService.getLanguageName(document.getLanguageId()) || document.getLanguageId();
            const message = !defaultFormatterId
                ? nls.localize('config.needed', "There are multiple formatters for '{0}' files. One of them should be configured as default formatter.", DefaultFormatter_1._maybeQuotes(langName))
                : nls.localize('config.bad', "Extension '{0}' is configured as formatter but not available. Select a different default formatter to continue.", defaultFormatterId);
            return message;
        }
        async _selectFormatter(formatter, document, mode, kind) {
            const formatterOrMessage = await this._analyzeFormatter(kind, formatter, document);
            if (typeof formatterOrMessage !== 'string') {
                return formatterOrMessage;
            }
            if (mode !== 2 /* FormattingMode.Silent */) {
                // running from a user action -> show modal dialog so that users configure
                // a default formatter
                const { confirmed } = await this._dialogService.confirm({
                    message: nls.localize('miss', "Configure Default Formatter"),
                    detail: formatterOrMessage,
                    primaryButton: nls.localize({ key: 'do.config', comment: ['&& denotes a mnemonic'] }, "&&Configure...")
                });
                if (confirmed) {
                    return this._pickAndPersistDefaultFormatter(formatter, document);
                }
            }
            else {
                // no user action -> show a silent notification and proceed
                this._notificationService.prompt(notification_1.Severity.Info, formatterOrMessage, [{ label: nls.localize('do.config.notification', "Configure..."), run: () => this._pickAndPersistDefaultFormatter(formatter, document) }], { priority: notification_1.NotificationPriority.SILENT });
            }
            return undefined;
        }
        async _pickAndPersistDefaultFormatter(formatter, document) {
            const picks = formatter.map((formatter, index) => {
                return {
                    index,
                    label: formatter.displayName || (formatter.extensionId ? formatter.extensionId.value : '?'),
                    description: formatter.extensionId && formatter.extensionId.value
                };
            });
            const langName = this._languageService.getLanguageName(document.getLanguageId()) || document.getLanguageId();
            const pick = await this._quickInputService.pick(picks, { placeHolder: nls.localize('select', "Select a default formatter for '{0}' files", DefaultFormatter_1._maybeQuotes(langName)) });
            if (!pick || !formatter[pick.index].extensionId) {
                return undefined;
            }
            this._configService.updateValue(DefaultFormatter_1.configName, formatter[pick.index].extensionId.value, {
                resource: document.uri,
                overrideIdentifier: document.getLanguageId()
            });
            return formatter[pick.index];
        }
        // --- status item
        _updateStatus() {
            this._languageStatusStore.clear();
            const editor = (0, editorBrowser_1.getCodeEditor)(this._editorService.activeTextEditorControl);
            if (!editor || !editor.hasModel()) {
                return;
            }
            const document = editor.getModel();
            const formatter = (0, format_1.getRealAndSyntheticDocumentFormattersOrdered)(this._languageFeaturesService.documentFormattingEditProvider, this._languageFeaturesService.documentRangeFormattingEditProvider, document);
            if (formatter.length === 0) {
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            this._languageStatusStore.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            this._analyzeFormatter(1 /* FormattingKind.File */, formatter, document).then(result => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                if (typeof result !== 'string') {
                    return;
                }
                const command = { id: `formatter/configure/dfl/${(0, uuid_1.generateUuid)()}`, title: nls.localize('do.config.command', "Configure...") };
                this._languageStatusStore.add(commands_1.CommandsRegistry.registerCommand(command.id, () => this._pickAndPersistDefaultFormatter(formatter, document)));
                this._languageStatusStore.add(this._languageStatusService.addStatus({
                    id: 'formatter.conflict',
                    name: nls.localize('summary', "Formatter Conflicts"),
                    selector: { language: document.getLanguageId(), pattern: document.uri.fsPath },
                    severity: notification_1.Severity.Error,
                    label: nls.localize('formatter', "Formatting"),
                    detail: result,
                    busy: false,
                    source: '',
                    command,
                    accessibilityInfo: undefined
                }));
            });
        }
    };
    DefaultFormatter = DefaultFormatter_1 = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, language_1.ILanguageService),
        __param(7, languageFeatures_1.ILanguageFeaturesService),
        __param(8, languageStatusService_1.ILanguageStatusService),
        __param(9, editorService_1.IEditorService)
    ], DefaultFormatter);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(DefaultFormatter, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        ...editorConfigurationSchema_1.editorConfigurationBaseNode,
        properties: {
            [DefaultFormatter.configName]: {
                description: nls.localize('formatter.default', "Defines a default formatter which takes precedence over all other formatter settings. Must be the identifier of an extension contributing a formatter."),
                type: ['string', 'null'],
                default: null,
                enum: DefaultFormatter.extensionIds,
                enumItemLabels: DefaultFormatter.extensionItemLabels,
                markdownEnumDescriptions: DefaultFormatter.extensionDescriptions
            }
        }
    });
    function logFormatterTelemetry(telemetryService, mode, options, pick) {
        function extKey(obj) {
            return obj.extensionId ? extensions_1.ExtensionIdentifier.toKey(obj.extensionId) : 'unknown';
        }
        telemetryService.publicLog2('formatterpick', {
            mode,
            extensions: options.map(extKey),
            pick: pick ? extKey(pick) : 'none'
        });
    }
    async function showFormatterPick(accessor, model, formatters) {
        const quickPickService = accessor.get(quickInput_1.IQuickInputService);
        const configService = accessor.get(configuration_1.IConfigurationService);
        const languageService = accessor.get(language_1.ILanguageService);
        const overrides = { resource: model.uri, overrideIdentifier: model.getLanguageId() };
        const defaultFormatter = configService.getValue(DefaultFormatter.configName, overrides);
        let defaultFormatterPick;
        const picks = formatters.map((provider, index) => {
            const isDefault = extensions_1.ExtensionIdentifier.equals(provider.extensionId, defaultFormatter);
            const pick = {
                index,
                label: provider.displayName || '',
                description: isDefault ? nls.localize('def', "(default)") : undefined,
            };
            if (isDefault) {
                // autofocus default pick
                defaultFormatterPick = pick;
            }
            return pick;
        });
        const configurePick = {
            label: nls.localize('config', "Configure Default Formatter...")
        };
        const pick = await quickPickService.pick([...picks, { type: 'separator' }, configurePick], {
            placeHolder: nls.localize('format.placeHolder', "Select a formatter"),
            activeItem: defaultFormatterPick
        });
        if (!pick) {
            // dismissed
            return undefined;
        }
        else if (pick === configurePick) {
            // config default
            const langName = languageService.getLanguageName(model.getLanguageId()) || model.getLanguageId();
            const pick = await quickPickService.pick(picks, { placeHolder: nls.localize('select', "Select a default formatter for '{0}' files", DefaultFormatter._maybeQuotes(langName)) });
            if (pick && formatters[pick.index].extensionId) {
                configService.updateValue(DefaultFormatter.configName, formatters[pick.index].extensionId.value, overrides);
            }
            return undefined;
        }
        else {
            // picked one
            return pick.index;
        }
    }
    (0, editorExtensions_1.registerEditorAction)(class FormatDocumentMultipleAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatDocument.multiple',
                label: nls.localize('formatDocument.label.multiple', "Format Document With..."),
                alias: 'Format Document...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasMultipleDocumentFormattingProvider),
                contextMenuOpts: {
                    group: '1_modification',
                    order: 1.3
                }
            });
        }
        async run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
            const model = editor.getModel();
            const provider = (0, format_1.getRealAndSyntheticDocumentFormattersOrdered)(languageFeaturesService.documentFormattingEditProvider, languageFeaturesService.documentRangeFormattingEditProvider, model);
            const pick = await instaService.invokeFunction(showFormatterPick, model, provider);
            if (typeof pick === 'number') {
                await instaService.invokeFunction(format_1.formatDocumentWithProvider, provider[pick], editor, 1 /* FormattingMode.Explicit */, cancellation_1.CancellationToken.None);
            }
            logFormatterTelemetry(telemetryService, 'document', provider, typeof pick === 'number' && provider[pick] || undefined);
        }
    });
    (0, editorExtensions_1.registerEditorAction)(class FormatSelectionMultipleAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatSelection.multiple',
                label: nls.localize('formatSelection.label.multiple', "Format Selection With..."),
                alias: 'Format Code...',
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable), editorContextKeys_1.EditorContextKeys.hasMultipleDocumentSelectionFormattingProvider),
                contextMenuOpts: {
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasNonEmptySelection),
                    group: '1_modification',
                    order: 1.31
                }
            });
        }
        async run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            const model = editor.getModel();
            let range = editor.getSelection();
            if (range.isEmpty()) {
                range = new range_1.Range(range.startLineNumber, 1, range.startLineNumber, model.getLineMaxColumn(range.startLineNumber));
            }
            const provider = languageFeaturesService.documentRangeFormattingEditProvider.ordered(model);
            const pick = await instaService.invokeFunction(showFormatterPick, model, provider);
            if (typeof pick === 'number') {
                await instaService.invokeFunction(format_1.formatDocumentRangesWithProvider, provider[pick], editor, range, cancellation_1.CancellationToken.None, true);
            }
            logFormatterTelemetry(telemetryService, 'range', provider, typeof pick === 'number' && provider[pick] || undefined);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0QWN0aW9uc011bHRpcGxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9mb3JtYXQvYnJvd3Nlci9mb3JtYXRBY3Rpb25zTXVsdGlwbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0NoRyxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHNCQUFVOztpQkFFeEIsZUFBVSxHQUFHLHlCQUF5QixBQUE1QixDQUE2QjtpQkFFaEQsaUJBQVksR0FBc0IsRUFBRSxBQUF4QixDQUF5QjtpQkFDckMsd0JBQW1CLEdBQWEsRUFBRSxBQUFmLENBQWdCO2lCQUNuQywwQkFBcUIsR0FBYSxFQUFFLEFBQWYsQ0FBZ0I7UUFJNUMsWUFDb0IsaUJBQXFELEVBQ2xDLDJCQUFrRixFQUNqRyxjQUFzRCxFQUN2RCxvQkFBMkQsRUFDakUsY0FBK0MsRUFDM0Msa0JBQXVELEVBQ3pELGdCQUFtRCxFQUMzQyx3QkFBbUUsRUFDckUsc0JBQStELEVBQ3ZFLGNBQStDO1lBRS9ELEtBQUssRUFBRSxDQUFDO1lBWDRCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDakIsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUFzQztZQUNoRixtQkFBYyxHQUFkLGNBQWMsQ0FBdUI7WUFDdEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUNoRCxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDMUIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUN4QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQzFCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDcEQsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtZQUN0RCxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFa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