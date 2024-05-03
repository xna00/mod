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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/editorAction", "vs/editor/standalone/browser/standaloneServices", "vs/editor/standalone/common/standaloneTheme", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/theme/common/themeService", "vs/platform/accessibility/common/accessibility", "vs/editor/common/standaloneStrings", "vs/platform/clipboard/common/clipboardService", "vs/platform/progress/common/progress", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/standalone/browser/standaloneCodeEditorService", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/base/browser/window", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/platform/hover/browser/hover"], function (require, exports, aria, lifecycle_1, codeEditorService_1, codeEditorWidget_1, editorAction_1, standaloneServices_1, standaloneTheme_1, actions_1, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, themeService_1, accessibility_1, standaloneStrings_1, clipboardService_1, progress_1, model_1, language_1, standaloneCodeEditorService_1, modesRegistry_1, languageConfigurationRegistry_1, languageFeatures_1, diffEditorWidget_1, accessibilitySignalService_1, window_1, hoverDelegateFactory_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandaloneDiffEditor2 = exports.StandaloneEditor = exports.StandaloneCodeEditor = void 0;
    exports.createTextModel = createTextModel;
    let LAST_GENERATED_COMMAND_ID = 0;
    let ariaDomNodeCreated = false;
    /**
     * Create ARIA dom node inside parent,
     * or only for the first editor instantiation inside document.body.
     * @param parent container element for ARIA dom node
     */
    function createAriaDomNode(parent) {
        if (!parent) {
            if (ariaDomNodeCreated) {
                return;
            }
            ariaDomNodeCreated = true;
        }
        aria.setARIAContainer(parent || window_1.mainWindow.document.body);
    }
    /**
     * A code editor to be used both by the standalone editor and the standalone diff editor.
     */
    let StandaloneCodeEditor = class StandaloneCodeEditor extends codeEditorWidget_1.CodeEditorWidget {
        constructor(domElement, _options, instantiationService, codeEditorService, commandService, contextKeyService, keybindingService, themeService, notificationService, accessibilityService, languageConfigurationService, languageFeaturesService) {
            const options = { ..._options };
            options.ariaLabel = options.ariaLabel || standaloneStrings_1.StandaloneCodeEditorNLS.editorViewAccessibleLabel;
            options.ariaLabel = options.ariaLabel + ';' + (standaloneStrings_1.StandaloneCodeEditorNLS.accessibilityHelpMessage);
            super(domElement, options, {}, instantiationService, codeEditorService, commandService, contextKeyService, themeService, notificationService, accessibilityService, languageConfigurationService, languageFeaturesService);
            if (keybindingService instanceof standaloneServices_1.StandaloneKeybindingService) {
                this._standaloneKeybindingService = keybindingService;
            }
            else {
                this._standaloneKeybindingService = null;
            }
            createAriaDomNode(options.ariaContainerElement);
            (0, hoverDelegateFactory_1.setHoverDelegateFactory)((placement, enableInstantHover) => instantiationService.createInstance(hover_1.WorkbenchHoverDelegate, placement, enableInstantHover, {}));
        }
        addCommand(keybinding, handler, context) {
            if (!this._standaloneKeybindingService) {
                console.warn('Cannot add command because the editor is configured with an unrecognized KeybindingService');
                return null;
            }
            const commandId = 'DYNAMIC_' + (++LAST_GENERATED_COMMAND_ID);
            const whenExpression = contextkey_1.ContextKeyExpr.deserialize(context);
            this._standaloneKeybindingService.addDynamicKeybinding(commandId, keybinding, handler, whenExpression);
            return commandId;
        }
        createContextKey(key, defaultValue) {
            return this._contextKeyService.createKey(key, defaultValue);
        }
        addAction(_descriptor) {
            if ((typeof _descriptor.id !== 'string') || (typeof _descriptor.label !== 'string') || (typeof _descriptor.run !== 'function')) {
                throw new Error('Invalid action descriptor, `id`, `label` and `run` are required properties!');
            }
            if (!this._standaloneKeybindingService) {
                console.warn('Cannot add keybinding because the editor is configured with an unrecognized KeybindingService');
                return lifecycle_1.Disposable.None;
            }
            // Read descriptor options
            const id = _descriptor.id;
            const label = _descriptor.label;
            const precondition = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('editorId', this.getId()), contextkey_1.ContextKeyExpr.deserialize(_descriptor.precondition));
            const keybindings = _descriptor.keybindings;
            const keybindingsWhen = contextkey_1.ContextKeyExpr.and(precondition, contextkey_1.ContextKeyExpr.deserialize(_descriptor.keybindingContext));
            const contextMenuGroupId = _descriptor.contextMenuGroupId || null;
            const contextMenuOrder = _descriptor.contextMenuOrder || 0;
            const run = (_accessor, ...args) => {
                return Promise.resolve(_descriptor.run(this, ...args));
            };
            const toDispose = new lifecycle_1.DisposableStore();
            // Generate a unique id to allow the same descriptor.id across multiple editor instances
            const uniqueId = this.getId() + ':' + id;
            // Register the command
            toDispose.add(commands_1.CommandsRegistry.registerCommand(uniqueId, run));
            // Register the context menu item
            if (contextMenuGroupId) {
                const menuItem = {
                    command: {
                        id: uniqueId,
                        title: label
                    },
                    when: precondition,
                    group: contextMenuGroupId,
                    order: contextMenuOrder
                };
                toDispose.add(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, menuItem));
            }
            // Register the keybindings
            if (Array.isArray(keybindings)) {
                for (const kb of keybindings) {
                    toDispose.add(this._standaloneKeybindingService.addDynamicKeybinding(uniqueId, kb, run, keybindingsWhen));
                }
            }
            // Finally, register an internal editor action
            const internalAction = new editorAction_1.InternalEditorAction(uniqueId, label, label, undefined, precondition, (...args) => Promise.resolve(_descriptor.run(this, ...args)), this._contextKeyService);
            // Store it under the original id, such that trigger with the original id will work
            this._actions.set(id, internalAction);
            toDispose.add((0, lifecycle_1.toDisposable)(() => {
                this._actions.delete(id);
            }));
            return toDispose;
        }
        _triggerCommand(handlerId, payload) {
            if (this._codeEditorService instanceof standaloneCodeEditorService_1.StandaloneCodeEditorService) {
                // Help commands find this editor as the active editor
                try {
                    this._codeEditorService.setActiveCodeEditor(this);
                    super._triggerCommand(handlerId, payload);
                }
                finally {
                    this._codeEditorService.setActiveCodeEditor(null);
                }
            }
            else {
                super._triggerCommand(handlerId, payload);
            }
        }
    };
    exports.StandaloneCodeEditor = StandaloneCodeEditor;
    exports.StandaloneCodeEditor = StandaloneCodeEditor = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, commands_1.ICommandService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, themeService_1.IThemeService),
        __param(8, notification_1.INotificationService),
        __param(9, accessibility_1.IAccessibilityService),
        __param(10, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(11, languageFeatures_1.ILanguageFeaturesService)
    ], StandaloneCodeEditor);
    let StandaloneEditor = class StandaloneEditor extends StandaloneCodeEditor {
        constructor(domElement, _options, instantiationService, codeEditorService, commandService, contextKeyService, keybindingService, themeService, notificationService, configurationService, accessibilityService, modelService, languageService, languageConfigurationService, languageFeaturesService) {
            const options = { ..._options };
            (0, standaloneServices_1.updateConfigurationService)(configurationService, options, false);
            const themeDomRegistration = themeService.registerEditorContainer(domElement);
            if (typeof options.theme === 'string') {
                themeService.setTheme(options.theme);
            }
            if (typeof options.autoDetectHighContrast !== 'undefined') {
                themeService.setAutoDetectHighContrast(Boolean(options.autoDetectHighContrast));
            }
            const _model = options.model;
            delete options.model;
            super(domElement, options, instantiationService, codeEditorService, commandService, contextKeyService, keybindingService, themeService, notificationService, accessibilityService, languageConfigurationService, languageFeaturesService);
            this._configurationService = configurationService;
            this._standaloneThemeService = themeService;
            this._register(themeDomRegistration);
            let model;
            if (typeof _model === 'undefined') {
                const languageId = languageService.getLanguageIdByMimeType(options.language) || options.language || modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
                model = createTextModel(modelService, languageService, options.value || '', languageId, undefined);
                this._ownsModel = true;
            }
            else {
                model = _model;
                this._ownsModel = false;
            }
            this._attachModel(model);
            if (model) {
                const e = {
                    oldModelUrl: null,
                    newModelUrl: model.uri
                };
                this._onDidChangeModel.fire(e);
            }
        }
        dispose() {
            super.dispose();
        }
        updateOptions(newOptions) {
            (0, standaloneServices_1.updateConfigurationService)(this._configurationService, newOptions, false);
            if (typeof newOptions.theme === 'string') {
                this._standaloneThemeService.setTheme(newOptions.theme);
            }
            if (typeof newOptions.autoDetectHighContrast !== 'undefined') {
                this._standaloneThemeService.setAutoDetectHighContrast(Boolean(newOptions.autoDetectHighContrast));
            }
            super.updateOptions(newOptions);
        }
        _postDetachModelCleanup(detachedModel) {
            super._postDetachModelCleanup(detachedModel);
            if (detachedModel && this._ownsModel) {
                detachedModel.dispose();
                this._ownsModel = false;
            }
        }
    };
    exports.StandaloneEditor = StandaloneEditor;
    exports.StandaloneEditor = StandaloneEditor = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, commands_1.ICommandService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, standaloneTheme_1.IStandaloneThemeService),
        __param(8, notification_1.INotificationService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, accessibility_1.IAccessibilityService),
        __param(11, model_1.IModelService),
        __param(12, language_1.ILanguageService),
        __param(13, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(14, languageFeatures_1.ILanguageFeaturesService)
    ], StandaloneEditor);
    let StandaloneDiffEditor2 = class StandaloneDiffEditor2 extends diffEditorWidget_1.DiffEditorWidget {
        constructor(domElement, _options, instantiationService, contextKeyService, codeEditorService, themeService, notificationService, configurationService, contextMenuService, editorProgressService, clipboardService, accessibilitySignalService) {
            const options = { ..._options };
            (0, standaloneServices_1.updateConfigurationService)(configurationService, options, true);
            const themeDomRegistration = themeService.registerEditorContainer(domElement);
            if (typeof options.theme === 'string') {
                themeService.setTheme(options.theme);
            }
            if (typeof options.autoDetectHighContrast !== 'undefined') {
                themeService.setAutoDetectHighContrast(Boolean(options.autoDetectHighContrast));
            }
            super(domElement, options, {}, contextKeyService, instantiationService, codeEditorService, accessibilitySignalService, editorProgressService);
            this._configurationService = configurationService;
            this._standaloneThemeService = themeService;
            this._register(themeDomRegistration);
        }
        dispose() {
            super.dispose();
        }
        updateOptions(newOptions) {
            (0, standaloneServices_1.updateConfigurationService)(this._configurationService, newOptions, true);
            if (typeof newOptions.theme === 'string') {
                this._standaloneThemeService.setTheme(newOptions.theme);
            }
            if (typeof newOptions.autoDetectHighContrast !== 'undefined') {
                this._standaloneThemeService.setAutoDetectHighContrast(Boolean(newOptions.autoDetectHighContrast));
            }
            super.updateOptions(newOptions);
        }
        _createInnerEditor(instantiationService, container, options) {
            return instantiationService.createInstance(StandaloneCodeEditor, container, options);
        }
        getOriginalEditor() {
            return super.getOriginalEditor();
        }
        getModifiedEditor() {
            return super.getModifiedEditor();
        }
        addCommand(keybinding, handler, context) {
            return this.getModifiedEditor().addCommand(keybinding, handler, context);
        }
        createContextKey(key, defaultValue) {
            return this.getModifiedEditor().createContextKey(key, defaultValue);
        }
        addAction(descriptor) {
            return this.getModifiedEditor().addAction(descriptor);
        }
    };
    exports.StandaloneDiffEditor2 = StandaloneDiffEditor2;
    exports.StandaloneDiffEditor2 = StandaloneDiffEditor2 = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, standaloneTheme_1.IStandaloneThemeService),
        __param(6, notification_1.INotificationService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, progress_1.IEditorProgressService),
        __param(10, clipboardService_1.IClipboardService),
        __param(11, accessibilitySignalService_1.IAccessibilitySignalService)
    ], StandaloneDiffEditor2);
    /**
     * @internal
     */
    function createTextModel(modelService, languageService, value, languageId, uri) {
        value = value || '';
        if (!languageId) {
            const firstLF = value.indexOf('\n');
            let firstLine = value;
            if (firstLF !== -1) {
                firstLine = value.substring(0, firstLF);
            }
            return doCreateModel(modelService, value, languageService.createByFilepathOrFirstLine(uri || null, firstLine), uri);
        }
        return doCreateModel(modelService, value, languageService.createById(languageId), uri);
    }
    /**
     * @internal
     */
    function doCreateModel(modelService, value, languageSelection, uri) {
        return modelService.createModel(value, languageSelection, uri);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUNvZGVFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9zdGFuZGFsb25lL2Jyb3dzZXIvc3RhbmRhbG9uZUNvZGVFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOGpCaEcsMENBV0M7SUExVkQsSUFBSSx5QkFBeUIsR0FBRyxDQUFDLENBQUM7SUFFbEMsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7SUFDL0I7Ozs7T0FJRztJQUNILFNBQVMsaUJBQWlCLENBQUMsTUFBK0I7UUFDekQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2IsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUNELGtCQUFrQixHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO1FBQ0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sSUFBSSxtQkFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQ7O09BRUc7SUFDSSxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLG1DQUFnQjtRQUl6RCxZQUNDLFVBQXVCLEVBQ3ZCLFFBQXdELEVBQ2pDLG9CQUEyQyxFQUM5QyxpQkFBcUMsRUFDeEMsY0FBK0IsRUFDNUIsaUJBQXFDLEVBQ3JDLGlCQUFxQyxFQUMxQyxZQUEyQixFQUNwQixtQkFBeUMsRUFDeEMsb0JBQTJDLEVBQ25DLDRCQUEyRCxFQUNoRSx1QkFBaUQ7WUFFM0UsTUFBTSxPQUFPLEdBQUcsRUFBRSxHQUFHLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsSUFBSSwyQ0FBdUIsQ0FBQyx5QkFBeUIsQ0FBQztZQUMzRixPQUFPLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLEdBQUcsR0FBRyxHQUFHLENBQUMsMkNBQXVCLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUNqRyxLQUFLLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBRSxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBRSw0QkFBNEIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBRTNOLElBQUksaUJBQWlCLFlBQVksZ0RBQTJCLEVBQUUsQ0FBQztnQkFDOUQsSUFBSSxDQUFDLDRCQUE0QixHQUFHLGlCQUFpQixDQUFDO1lBQ3ZELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsNEJBQTRCLEdBQUcsSUFBSSxDQUFDO1lBQzFDLENBQUM7WUFFRCxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUVoRCxJQUFBLDhDQUF1QixFQUFDLENBQUMsU0FBUyxFQUFFLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsOEJBQXNCLEVBQUUsU0FBUyxFQUFFLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUosQ0FBQztRQUVNLFVBQVUsQ0FBQyxVQUFrQixFQUFFLE9BQXdCLEVBQUUsT0FBZ0I7WUFDL0UsSUFBSSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO2dCQUN4QyxPQUFPLENBQUMsSUFBSSxDQUFDLDRGQUE0RixDQUFDLENBQUM7Z0JBQzNHLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE1BQU0sU0FBUyxHQUFHLFVBQVUsR0FBRyxDQUFDLEVBQUUseUJBQXlCLENBQUMsQ0FBQztZQUM3RCxNQUFNLGNBQWMsR0FBRywyQkFBYyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzRCxJQUFJLENBQUMsNEJBQTRCLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDdkcsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVNLGdCQUFnQixDQUE4QyxHQUFXLEVBQUUsWUFBZTtZQUNoRyxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFTSxTQUFTLENBQUMsV0FBOEI7WUFDOUMsSUFBSSxDQUFDLE9BQU8sV0FBVyxDQUFDLEVBQUUsS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sV0FBVyxDQUFDLEtBQUssS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sV0FBVyxDQUFDLEdBQUcsS0FBSyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUNoSSxNQUFNLElBQUksS0FBSyxDQUFDLDZFQUE2RSxDQUFDLENBQUM7WUFDaEcsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxDQUFDLElBQUksQ0FBQywrRkFBK0YsQ0FBQyxDQUFDO2dCQUM5RyxPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDO1lBQ3hCLENBQUM7WUFFRCwwQkFBMEI7WUFDMUIsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQztZQUMxQixNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDO1lBQ2hDLE1BQU0sWUFBWSxHQUFHLDJCQUFjLENBQUMsR0FBRyxDQUN0QywyQkFBYyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQy9DLDJCQUFjLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FDcEQsQ0FBQztZQUNGLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxXQUFXLENBQUM7WUFDNUMsTUFBTSxlQUFlLEdBQUcsMkJBQWMsQ0FBQyxHQUFHLENBQ3pDLFlBQVksRUFDWiwyQkFBYyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FDekQsQ0FBQztZQUNGLE1BQU0sa0JBQWtCLEdBQUcsV0FBVyxDQUFDLGtCQUFrQixJQUFJLElBQUksQ0FBQztZQUNsRSxNQUFNLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLENBQUM7WUFDM0QsTUFBTSxHQUFHLEdBQUcsQ0FBQyxTQUE0QixFQUFFLEdBQUcsSUFBVyxFQUFpQixFQUFFO2dCQUMzRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hELENBQUMsQ0FBQztZQUdGLE1BQU0sU0FBUyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRXhDLHdGQUF3RjtZQUN4RixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQztZQUV6Qyx1QkFBdUI7WUFDdkIsU0FBUyxDQUFDLEdBQUcsQ0FBQywyQkFBZ0IsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFL0QsaUNBQWlDO1lBQ2pDLElBQUksa0JBQWtCLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxRQUFRLEdBQWM7b0JBQzNCLE9BQU8sRUFBRTt3QkFDUixFQUFFLEVBQUUsUUFBUTt3QkFDWixLQUFLLEVBQUUsS0FBSztxQkFDWjtvQkFDRCxJQUFJLEVBQUUsWUFBWTtvQkFDbEIsS0FBSyxFQUFFLGtCQUFrQjtvQkFDekIsS0FBSyxFQUFFLGdCQUFnQjtpQkFDdkIsQ0FBQztnQkFDRixTQUFTLENBQUMsR0FBRyxDQUFDLHNCQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFNLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDNUUsQ0FBQztZQUVELDJCQUEyQjtZQUMzQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsS0FBSyxNQUFNLEVBQUUsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDOUIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQztnQkFDM0csQ0FBQztZQUNGLENBQUM7WUFFRCw4Q0FBOEM7WUFDOUMsTUFBTSxjQUFjLEdBQUcsSUFBSSxtQ0FBb0IsQ0FDOUMsUUFBUSxFQUNSLEtBQUssRUFDTCxLQUFLLEVBQ0wsU0FBUyxFQUNULFlBQVksRUFDWixDQUFDLEdBQUcsSUFBZSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFDdkUsSUFBSSxDQUFDLGtCQUFrQixDQUN2QixDQUFDO1lBRUYsbUZBQW1GO1lBQ25GLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUN0QyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRWtCLGVBQWUsQ0FBQyxTQUFpQixFQUFFLE9BQVk7WUFDakUsSUFBSSxJQUFJLENBQUMsa0JBQWtCLFlBQVkseURBQTJCLEVBQUUsQ0FBQztnQkFDcEUsc0RBQXNEO2dCQUN0RCxJQUFJLENBQUM7b0JBQ0osSUFBSSxDQUFDLGtCQUFrQixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNsRCxLQUFLLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDM0MsQ0FBQzt3QkFBUyxDQUFDO29CQUNWLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbkQsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxLQUFLLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMzQyxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUEzSVksb0RBQW9CO21DQUFwQixvQkFBb0I7UUFPOUIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEsMEJBQWUsQ0FBQTtRQUNmLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLDRCQUFhLENBQUE7UUFDYixXQUFBLG1DQUFvQixDQUFBO1FBQ3BCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsWUFBQSw2REFBNkIsQ0FBQTtRQUM3QixZQUFBLDJDQUF3QixDQUFBO09BaEJkLG9CQUFvQixDQTJJaEM7SUFFTSxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLG9CQUFvQjtRQU16RCxZQUNDLFVBQXVCLEVBQ3ZCLFFBQW9FLEVBQzdDLG9CQUEyQyxFQUM5QyxpQkFBcUMsRUFDeEMsY0FBK0IsRUFDNUIsaUJBQXFDLEVBQ3JDLGlCQUFxQyxFQUNoQyxZQUFxQyxFQUN4QyxtQkFBeUMsRUFDeEMsb0JBQTJDLEVBQzNDLG9CQUEyQyxFQUNuRCxZQUEyQixFQUN4QixlQUFpQyxFQUNwQiw0QkFBMkQsRUFDaEUsdUJBQWlEO1lBRTNFLE1BQU0sT0FBTyxHQUFHLEVBQUUsR0FBRyxRQUFRLEVBQUUsQ0FBQztZQUNoQyxJQUFBLCtDQUEwQixFQUFDLG9CQUFvQixFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRSxNQUFNLG9CQUFvQixHQUE0QixZQUFhLENBQUMsdUJBQXVCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDeEcsSUFBSSxPQUFPLE9BQU8sQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3ZDLFlBQVksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFDRCxJQUFJLE9BQU8sT0FBTyxDQUFDLHNCQUFzQixLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUMzRCxZQUFZLENBQUMseUJBQXlCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7WUFDakYsQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFrQyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQzVELE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQztZQUNyQixLQUFLLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFFLG1CQUFtQixFQUFFLG9CQUFvQixFQUFFLDRCQUE0QixFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFFMU8sSUFBSSxDQUFDLHFCQUFxQixHQUFHLG9CQUFvQixDQUFDO1lBQ2xELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxZQUFZLENBQUM7WUFDNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBRXJDLElBQUksS0FBd0IsQ0FBQztZQUM3QixJQUFJLE9BQU8sTUFBTSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUNuQyxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUMsdUJBQXVCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLElBQUkscUNBQXFCLENBQUM7Z0JBQzFILEtBQUssR0FBRyxlQUFlLENBQUMsWUFBWSxFQUFFLGVBQWUsRUFBRSxPQUFPLENBQUMsS0FBSyxJQUFJLEVBQUUsRUFBRSxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ25HLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxLQUFLLEdBQUcsTUFBTSxDQUFDO2dCQUNmLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLENBQUM7WUFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1gsTUFBTSxDQUFDLEdBQXVCO29CQUM3QixXQUFXLEVBQUUsSUFBSTtvQkFDakIsV0FBVyxFQUFFLEtBQUssQ0FBQyxHQUFHO2lCQUN0QixDQUFDO2dCQUNGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEMsQ0FBQztRQUNGLENBQUM7UUFFZSxPQUFPO1lBQ3RCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRWUsYUFBYSxDQUFDLFVBQTJEO1lBQ3hGLElBQUEsK0NBQTBCLEVBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxRSxJQUFJLE9BQU8sVUFBVSxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekQsQ0FBQztZQUNELElBQUksT0FBTyxVQUFVLENBQUMsc0JBQXNCLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQzlELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztZQUNwRyxDQUFDO1lBQ0QsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRWtCLHVCQUF1QixDQUFDLGFBQXlCO1lBQ25FLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM3QyxJQUFJLGFBQWEsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDekIsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBbEZZLDRDQUFnQjsrQkFBaEIsZ0JBQWdCO1FBUzFCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxzQ0FBa0IsQ0FBQTtRQUNsQixXQUFBLDBCQUFlLENBQUE7UUFDZixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSx5Q0FBdUIsQ0FBQTtRQUN2QixXQUFBLG1DQUFvQixDQUFBO1FBQ3BCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsWUFBQSxxQ0FBcUIsQ0FBQTtRQUNyQixZQUFBLHFCQUFhLENBQUE7UUFDYixZQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFlBQUEsNkRBQTZCLENBQUE7UUFDN0IsWUFBQSwyQ0FBd0IsQ0FBQTtPQXJCZCxnQkFBZ0IsQ0FrRjVCO0lBRU0sSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSxtQ0FBZ0I7UUFLMUQsWUFDQyxVQUF1QixFQUN2QixRQUF3RSxFQUNqRCxvQkFBMkMsRUFDOUMsaUJBQXFDLEVBQ3JDLGlCQUFxQyxFQUNoQyxZQUFxQyxFQUN4QyxtQkFBeUMsRUFDeEMsb0JBQTJDLEVBQzdDLGtCQUF1QyxFQUNwQyxxQkFBNkMsRUFDbEQsZ0JBQW1DLEVBQ3pCLDBCQUF1RDtZQUVwRixNQUFNLE9BQU8sR0FBRyxFQUFFLEdBQUcsUUFBUSxFQUFFLENBQUM7WUFDaEMsSUFBQSwrQ0FBMEIsRUFBQyxvQkFBb0IsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDaEUsTUFBTSxvQkFBb0IsR0FBNEIsWUFBYSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3hHLElBQUksT0FBTyxPQUFPLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUN2QyxZQUFZLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBQ0QsSUFBSSxPQUFPLE9BQU8sQ0FBQyxzQkFBc0IsS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDM0QsWUFBWSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLENBQUM7WUFFRCxLQUFLLENBQ0osVUFBVSxFQUNWLE9BQU8sRUFDUCxFQUFFLEVBQ0YsaUJBQWlCLEVBQ2pCLG9CQUFvQixFQUNwQixpQkFBaUIsRUFDakIsMEJBQTBCLEVBQzFCLHFCQUFxQixDQUNyQixDQUFDO1lBRUYsSUFBSSxDQUFDLHFCQUFxQixHQUFHLG9CQUFvQixDQUFDO1lBQ2xELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxZQUFZLENBQUM7WUFFNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFZSxPQUFPO1lBQ3RCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRWUsYUFBYSxDQUFDLFVBQStEO1lBQzVGLElBQUEsK0NBQTBCLEVBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6RSxJQUFJLE9BQU8sVUFBVSxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekQsQ0FBQztZQUNELElBQUksT0FBTyxVQUFVLENBQUMsc0JBQXNCLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQzlELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztZQUNwRyxDQUFDO1lBQ0QsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRWtCLGtCQUFrQixDQUFDLG9CQUEyQyxFQUFFLFNBQXNCLEVBQUUsT0FBaUM7WUFDM0ksT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFFZSxpQkFBaUI7WUFDaEMsT0FBNkIsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDeEQsQ0FBQztRQUVlLGlCQUFpQjtZQUNoQyxPQUE2QixLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUN4RCxDQUFDO1FBRU0sVUFBVSxDQUFDLFVBQWtCLEVBQUUsT0FBd0IsRUFBRSxPQUFnQjtZQUMvRSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzFFLENBQUM7UUFFTSxnQkFBZ0IsQ0FBOEMsR0FBVyxFQUFFLFlBQWU7WUFDaEcsT0FBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVNLFNBQVMsQ0FBQyxVQUE2QjtZQUM3QyxPQUFPLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN2RCxDQUFDO0tBQ0QsQ0FBQTtJQXBGWSxzREFBcUI7b0NBQXJCLHFCQUFxQjtRQVEvQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSxzQ0FBa0IsQ0FBQTtRQUNsQixXQUFBLHlDQUF1QixDQUFBO1FBQ3ZCLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsaUNBQXNCLENBQUE7UUFDdEIsWUFBQSxvQ0FBaUIsQ0FBQTtRQUNqQixZQUFBLHdEQUEyQixDQUFBO09BakJqQixxQkFBcUIsQ0FvRmpDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixlQUFlLENBQUMsWUFBMkIsRUFBRSxlQUFpQyxFQUFFLEtBQWEsRUFBRSxVQUE4QixFQUFFLEdBQW9CO1FBQ2xLLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNqQixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztZQUN0QixJQUFJLE9BQU8sS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNwQixTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUNELE9BQU8sYUFBYSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDckgsQ0FBQztRQUNELE9BQU8sYUFBYSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN4RixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTLGFBQWEsQ0FBQyxZQUEyQixFQUFFLEtBQWEsRUFBRSxpQkFBcUMsRUFBRSxHQUFvQjtRQUM3SCxPQUFPLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2hFLENBQUMifQ==