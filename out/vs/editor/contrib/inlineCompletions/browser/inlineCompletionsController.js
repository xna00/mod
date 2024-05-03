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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/coreCommands", "vs/editor/common/core/position", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/inlineCompletions/browser/commandIds", "vs/editor/contrib/inlineCompletions/browser/ghostTextWidget", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionContextKeys", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsHintsWidget", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsModel", "vs/editor/contrib/inlineCompletions/browser/suggestWidgetInlineCompletionProvider", "vs/nls", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/base/common/observableInternal/utils"], function (require, exports, dom_1, aria_1, lifecycle_1, observable_1, coreCommands_1, position_1, languageFeatureDebounce_1, languageFeatures_1, commandIds_1, ghostTextWidget_1, inlineCompletionContextKeys_1, inlineCompletionsHintsWidget_1, inlineCompletionsModel_1, suggestWidgetInlineCompletionProvider_1, nls_1, accessibilitySignalService_1, commands_1, configuration_1, contextkey_1, instantiation_1, keybinding_1, utils_1) {
    "use strict";
    var InlineCompletionsController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineCompletionsController = void 0;
    let InlineCompletionsController = class InlineCompletionsController extends lifecycle_1.Disposable {
        static { InlineCompletionsController_1 = this; }
        static { this.ID = 'editor.contrib.inlineCompletionsController'; }
        static get(editor) {
            return editor.getContribution(InlineCompletionsController_1.ID);
        }
        constructor(editor, _instantiationService, _contextKeyService, _configurationService, _commandService, _debounceService, _languageFeaturesService, _accessibilitySignalService, _keybindingService) {
            super();
            this.editor = editor;
            this._instantiationService = _instantiationService;
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._commandService = _commandService;
            this._debounceService = _debounceService;
            this._languageFeaturesService = _languageFeaturesService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._keybindingService = _keybindingService;
            this.model = this._register((0, observable_1.disposableObservableValue)('inlineCompletionModel', undefined));
            this._textModelVersionId = (0, observable_1.observableValue)(this, -1);
            this._positions = (0, observable_1.observableValue)(this, [new position_1.Position(1, 1)]);
            this._suggestWidgetAdaptor = this._register(new suggestWidgetInlineCompletionProvider_1.SuggestWidgetAdaptor(this.editor, () => this.model.get()?.selectedInlineCompletion.get()?.toSingleTextEdit(undefined), (tx) => this.updateObservables(tx, inlineCompletionsModel_1.VersionIdChangeReason.Other), (item) => {
                (0, observable_1.transaction)(tx => {
                    /** @description InlineCompletionsController.handleSuggestAccepted */
                    this.updateObservables(tx, inlineCompletionsModel_1.VersionIdChangeReason.Other);
                    this.model.get()?.handleSuggestAccepted(item);
                });
            }));
            this._enabled = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(62 /* EditorOption.inlineSuggest */).enabled);
            this._fontFamily = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(62 /* EditorOption.inlineSuggest */).fontFamily);
            this._ghostTexts = (0, observable_1.derived)(this, (reader) => {
                const model = this.model.read(reader);
                return model?.ghostTexts.read(reader) ?? [];
            });
            this._stablizedGhostTexts = convertItemsToStableObservables(this._ghostTexts, this._store);
            this._ghostTextWidgets = (0, utils_1.mapObservableArrayCached)(this, this._stablizedGhostTexts, (ghostText, store) => {
                return store.add(this._instantiationService.createInstance(ghostTextWidget_1.GhostTextWidget, this.editor, {
                    ghostText: ghostText,
                    minReservedLineCount: (0, observable_1.constObservable)(0),
                    targetTextModel: this.model.map(v => v?.textModel),
                }));
            }).recomputeInitiallyAndOnChange(this._store);
            this._debounceValue = this._debounceService.for(this._languageFeaturesService.inlineCompletionsProvider, 'InlineCompletionsDebounce', { min: 50, max: 50 });
            this._playAccessibilitySignal = (0, observable_1.observableSignal)(this);
            this._isReadonly = (0, observable_1.observableFromEvent)(this.editor.onDidChangeConfiguration, () => this.editor.getOption(91 /* EditorOption.readOnly */));
            this._textModel = (0, observable_1.observableFromEvent)(this.editor.onDidChangeModel, () => this.editor.getModel());
            this._textModelIfWritable = (0, observable_1.derived)(reader => this._isReadonly.read(reader) ? undefined : this._textModel.read(reader));
            this._register(new inlineCompletionContextKeys_1.InlineCompletionContextKeys(this._contextKeyService, this.model));
            this._register((0, observable_1.autorun)(reader => {
                /** @description InlineCompletionsController.update model */
                const textModel = this._textModelIfWritable.read(reader);
                (0, observable_1.transaction)(tx => {
                    /** @description InlineCompletionsController.onDidChangeModel/readonly */
                    this.model.set(undefined, tx);
                    this.updateObservables(tx, inlineCompletionsModel_1.VersionIdChangeReason.Other);
                    if (textModel) {
                        const model = _instantiationService.createInstance(inlineCompletionsModel_1.InlineCompletionsModel, textModel, this._suggestWidgetAdaptor.selectedItem, this._textModelVersionId, this._positions, this._debounceValue, (0, observable_1.observableFromEvent)(editor.onDidChangeConfiguration, () => editor.getOption(118 /* EditorOption.suggest */).preview), (0, observable_1.observableFromEvent)(editor.onDidChangeConfiguration, () => editor.getOption(118 /* EditorOption.suggest */).previewMode), (0, observable_1.observableFromEvent)(editor.onDidChangeConfiguration, () => editor.getOption(62 /* EditorOption.inlineSuggest */).mode), this._enabled);
                        this.model.set(model, tx);
                    }
                });
            }));
            const styleElement = this._register((0, dom_1.createStyleSheet2)());
            this._register((0, observable_1.autorun)(reader => {
                const fontFamily = this._fontFamily.read(reader);
                styleElement.setStyle(fontFamily === '' || fontFamily === 'default' ? `` : `
.monaco-editor .ghost-text-decoration,
.monaco-editor .ghost-text-decoration-preview,
.monaco-editor .ghost-text {
	font-family: ${fontFamily};
}`);
            }));
            const getReason = (e) => {
                if (e.isUndoing) {
                    return inlineCompletionsModel_1.VersionIdChangeReason.Undo;
                }
                if (e.isRedoing) {
                    return inlineCompletionsModel_1.VersionIdChangeReason.Redo;
                }
                if (this.model.get()?.isAcceptingPartially) {
                    return inlineCompletionsModel_1.VersionIdChangeReason.AcceptWord;
                }
                return inlineCompletionsModel_1.VersionIdChangeReason.Other;
            };
            this._register(editor.onDidChangeModelContent((e) => (0, observable_1.transaction)(tx => 
            /** @description InlineCompletionsController.onDidChangeModelContent */
            this.updateObservables(tx, getReason(e)))));
            this._register(editor.onDidChangeCursorPosition(e => (0, observable_1.transaction)(tx => {
                /** @description InlineCompletionsController.onDidChangeCursorPosition */
                this.updateObservables(tx, inlineCompletionsModel_1.VersionIdChangeReason.Other);
                if (e.reason === 3 /* CursorChangeReason.Explicit */ || e.source === 'api') {
                    this.model.get()?.stop(tx);
                }
            })));
            this._register(editor.onDidType(() => (0, observable_1.transaction)(tx => {
                /** @description InlineCompletionsController.onDidType */
                this.updateObservables(tx, inlineCompletionsModel_1.VersionIdChangeReason.Other);
                if (this._enabled.get()) {
                    this.model.get()?.trigger(tx);
                }
            })));
            this._register(this._commandService.onDidExecuteCommand((e) => {
                // These commands don't trigger onDidType.
                const commands = new Set([
                    coreCommands_1.CoreEditingCommands.Tab.id,
                    coreCommands_1.CoreEditingCommands.DeleteLeft.id,
                    coreCommands_1.CoreEditingCommands.DeleteRight.id,
                    commandIds_1.inlineSuggestCommitId,
                    'acceptSelectedSuggestion',
                ]);
                if (commands.has(e.commandId) && editor.hasTextFocus() && this._enabled.get()) {
                    (0, observable_1.transaction)(tx => {
                        /** @description onDidExecuteCommand */
                        this.model.get()?.trigger(tx);
                    });
                }
            }));
            this._register(this.editor.onDidBlurEditorWidget(() => {
                // This is a hidden setting very useful for debugging
                if (this._contextKeyService.getContextKeyValue('accessibleViewIsShown') || this._configurationService.getValue('editor.inlineSuggest.keepOnBlur') ||
                    editor.getOption(62 /* EditorOption.inlineSuggest */).keepOnBlur) {
                    return;
                }
                if (inlineCompletionsHintsWidget_1.InlineSuggestionHintsContentWidget.dropDownVisible) {
                    return;
                }
                (0, observable_1.transaction)(tx => {
                    /** @description InlineCompletionsController.onDidBlurEditorWidget */
                    this.model.get()?.stop(tx);
                });
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description InlineCompletionsController.forceRenderingAbove */
                const state = this.model.read(reader)?.state.read(reader);
                if (state?.suggestItem) {
                    if (state.primaryGhostText.lineCount >= 2) {
                        this._suggestWidgetAdaptor.forceRenderingAbove();
                    }
                }
                else {
                    this._suggestWidgetAdaptor.stopForceRenderingAbove();
                }
            }));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this._suggestWidgetAdaptor.stopForceRenderingAbove();
            }));
            let lastInlineCompletionId = undefined;
            this._register((0, observable_1.autorunHandleChanges)({
                handleChange: (context, changeSummary) => {
                    if (context.didChange(this._playAccessibilitySignal)) {
                        lastInlineCompletionId = undefined;
                    }
                    return true;
                },
            }, async (reader) => {
                /** @description InlineCompletionsController.playAccessibilitySignalAndReadSuggestion */
                this._playAccessibilitySignal.read(reader);
                const model = this.model.read(reader);
                const state = model?.state.read(reader);
                if (!model || !state || !state.inlineCompletion) {
                    lastInlineCompletionId = undefined;
                    return;
                }
                if (state.inlineCompletion.semanticId !== lastInlineCompletionId) {
                    lastInlineCompletionId = state.inlineCompletion.semanticId;
                    const lineText = model.textModel.getLineContent(state.primaryGhostText.lineNumber);
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.inlineSuggestion).then(() => {
                        if (this.editor.getOption(8 /* EditorOption.screenReaderAnnounceInlineSuggestion */)) {
                            this.provideScreenReaderUpdate(state.primaryGhostText.renderForScreenReader(lineText));
                        }
                    });
                }
            }));
            this._register(new inlineCompletionsHintsWidget_1.InlineCompletionsHintsWidget(this.editor, this.model, this._instantiationService));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('accessibility.verbosity.inlineCompletions')) {
                    this.editor.updateOptions({ inlineCompletionsAccessibilityVerbose: this._configurationService.getValue('accessibility.verbosity.inlineCompletions') });
                }
            }));
            this.editor.updateOptions({ inlineCompletionsAccessibilityVerbose: this._configurationService.getValue('accessibility.verbosity.inlineCompletions') });
        }
        playAccessibilitySignal(tx) {
            this._playAccessibilitySignal.trigger(tx);
        }
        provideScreenReaderUpdate(content) {
            const accessibleViewShowing = this._contextKeyService.getContextKeyValue('accessibleViewIsShown');
            const accessibleViewKeybinding = this._keybindingService.lookupKeybinding('editor.action.accessibleView');
            let hint;
            if (!accessibleViewShowing && accessibleViewKeybinding && this.editor.getOption(149 /* EditorOption.inlineCompletionsAccessibilityVerbose */)) {
                hint = (0, nls_1.localize)('showAccessibleViewHint', "Inspect this in the accessible view ({0})", accessibleViewKeybinding.getAriaLabel());
            }
            hint ? (0, aria_1.alert)(content + ', ' + hint) : (0, aria_1.alert)(content);
        }
        /**
         * Copies over the relevant state from the text model to observables.
         * This solves all kind of eventing issues, as we make sure we always operate on the latest state,
         * regardless of who calls into us.
         */
        updateObservables(tx, changeReason) {
            const newModel = this.editor.getModel();
            this._textModelVersionId.set(newModel?.getVersionId() ?? -1, tx, changeReason);
            this._positions.set(this.editor.getSelections()?.map(selection => selection.getPosition()) ?? [new position_1.Position(1, 1)], tx);
        }
        shouldShowHoverAt(range) {
            const ghostText = this.model.get()?.primaryGhostText.get();
            if (ghostText) {
                return ghostText.parts.some(p => range.containsPosition(new position_1.Position(ghostText.lineNumber, p.column)));
            }
            return false;
        }
        shouldShowHoverAtViewZone(viewZoneId) {
            return this._ghostTextWidgets.get()[0]?.ownsViewZone(viewZoneId) ?? false;
        }
        hide() {
            (0, observable_1.transaction)(tx => {
                this.model.get()?.stop(tx);
            });
        }
    };
    exports.InlineCompletionsController = InlineCompletionsController;
    exports.InlineCompletionsController = InlineCompletionsController = InlineCompletionsController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, commands_1.ICommandService),
        __param(5, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(6, languageFeatures_1.ILanguageFeaturesService),
        __param(7, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(8, keybinding_1.IKeybindingService)
    ], InlineCompletionsController);
    function convertItemsToStableObservables(items, store) {
        const result = (0, observable_1.observableValue)('result', []);
        const innerObservables = [];
        store.add((0, observable_1.autorun)(reader => {
            const itemsValue = items.read(reader);
            (0, observable_1.transaction)(tx => {
                if (itemsValue.length !== innerObservables.length) {
                    innerObservables.length = itemsValue.length;
                    for (let i = 0; i < innerObservables.length; i++) {
                        if (!innerObservables[i]) {
                            innerObservables[i] = (0, observable_1.observableValue)('item', itemsValue[i]);
                        }
                    }
                    result.set([...innerObservables], tx);
                }
                innerObservables.forEach((o, i) => o.set(itemsValue[i], tx));
            });
        }));
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ29tcGxldGlvbnNDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVDb21wbGV0aW9ucy9icm93c2VyL2lubGluZUNvbXBsZXRpb25zQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBK0J6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHNCQUFVOztpQkFDbkQsT0FBRSxHQUFHLDRDQUE0QyxBQUEvQyxDQUFnRDtRQUVsRCxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQ3BDLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBOEIsNkJBQTJCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDNUYsQ0FBQztRQStDRCxZQUNpQixNQUFtQixFQUNaLHFCQUE2RCxFQUNoRSxrQkFBdUQsRUFDcEQscUJBQTZELEVBQ25FLGVBQWlELEVBQ2pDLGdCQUFrRSxFQUN6RSx3QkFBbUUsRUFDaEUsMkJBQXlFLEVBQ2xGLGtCQUF1RDtZQUUzRSxLQUFLLEVBQUUsQ0FBQztZQVZRLFdBQU0sR0FBTixNQUFNLENBQWE7WUFDSywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQy9DLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDbkMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUNsRCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDaEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFpQztZQUN4RCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQy9DLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFDakUsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQXRENUQsVUFBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSxzQ0FBeUIsRUFBcUMsdUJBQXVCLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN6SCx3QkFBbUIsR0FBRyxJQUFBLDRCQUFlLEVBQWdDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9FLGVBQVUsR0FBRyxJQUFBLDRCQUFlLEVBQXNCLElBQUksRUFBRSxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlFLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw0REFBb0IsQ0FDL0UsSUFBSSxDQUFDLE1BQU0sRUFDWCxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxFQUFFLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxFQUNuRixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsRUFBRSw4Q0FBcUIsQ0FBQyxLQUFLLENBQUMsRUFDL0QsQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDUixJQUFBLHdCQUFXLEVBQUMsRUFBRSxDQUFDLEVBQUU7b0JBQ2hCLHFFQUFxRTtvQkFDckUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsRUFBRSw4Q0FBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDeEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDL0MsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQ0QsQ0FBQyxDQUFDO1lBQ2MsYUFBUSxHQUFHLElBQUEsZ0NBQW1CLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMscUNBQTRCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEksZ0JBQVcsR0FBRyxJQUFBLGdDQUFtQixFQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLHFDQUE0QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTVJLGdCQUFXLEdBQUcsSUFBQSxvQkFBTyxFQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUN2RCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEMsT0FBTyxLQUFLLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDN0MsQ0FBQyxDQUFDLENBQUM7WUFFYyx5QkFBb0IsR0FBRywrQkFBK0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUV0RixzQkFBaUIsR0FBRyxJQUFBLGdDQUF3QixFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ25ILE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLGlDQUFlLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRTtvQkFDeEYsU0FBUyxFQUFFLFNBQVM7b0JBQ3BCLG9CQUFvQixFQUFFLElBQUEsNEJBQWUsRUFBQyxDQUFDLENBQUM7b0JBQ3hDLGVBQWUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUM7aUJBQ2xELENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTdCLG1CQUFjLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FDMUQsSUFBSSxDQUFDLHdCQUF3QixDQUFDLHlCQUF5QixFQUN2RCwyQkFBMkIsRUFDM0IsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FDcEIsQ0FBQztZQUVlLDZCQUF3QixHQUFHLElBQUEsNkJBQWdCLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFFbEQsZ0JBQVcsR0FBRyxJQUFBLGdDQUFtQixFQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLGdDQUF1QixDQUFDLENBQUM7WUFDNUgsZUFBVSxHQUFHLElBQUEsZ0NBQW1CLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDN0YseUJBQW9CLEdBQUcsSUFBQSxvQkFBTyxFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQWVuSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseURBQTJCLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRXJGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSxvQkFBTyxFQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUMvQiw0REFBNEQ7Z0JBQzVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3pELElBQUEsd0JBQVcsRUFBQyxFQUFFLENBQUMsRUFBRTtvQkFDaEIseUVBQXlFO29CQUN6RSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQzlCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsOENBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBRXhELElBQUksU0FBUyxFQUFFLENBQUM7d0JBQ2YsTUFBTSxLQUFLLEdBQUcscUJBQXFCLENBQUMsY0FBYyxDQUNqRCwrQ0FBc0IsRUFDdEIsU0FBUyxFQUNULElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLEVBQ3ZDLElBQUksQ0FBQyxtQkFBbUIsRUFDeEIsSUFBSSxDQUFDLFVBQVUsRUFDZixJQUFJLENBQUMsY0FBYyxFQUNuQixJQUFBLGdDQUFtQixFQUFDLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxnQ0FBc0IsQ0FBQyxPQUFPLENBQUMsRUFDMUcsSUFBQSxnQ0FBbUIsRUFBQyxNQUFNLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsZ0NBQXNCLENBQUMsV0FBVyxDQUFDLEVBQzlHLElBQUEsZ0NBQW1CLEVBQUMsTUFBTSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLHFDQUE0QixDQUFDLElBQUksQ0FBQyxFQUM3RyxJQUFJLENBQUMsUUFBUSxDQUNiLENBQUM7d0JBQ0YsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUMzQixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx1QkFBaUIsR0FBRSxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLG9CQUFPLEVBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQy9CLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNqRCxZQUFZLENBQUMsUUFBUSxDQUFDLFVBQVUsS0FBSyxFQUFFLElBQUksVUFBVSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7OztnQkFJOUQsVUFBVTtFQUN4QixDQUFDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUE0QixFQUF5QixFQUFFO2dCQUN6RSxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFBQyxPQUFPLDhDQUFxQixDQUFDLElBQUksQ0FBQztnQkFBQyxDQUFDO2dCQUN2RCxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFBQyxPQUFPLDhDQUFxQixDQUFDLElBQUksQ0FBQztnQkFBQyxDQUFDO2dCQUN2RCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQztvQkFBQyxPQUFPLDhDQUFxQixDQUFDLFVBQVUsQ0FBQztnQkFBQyxDQUFDO2dCQUN4RixPQUFPLDhDQUFxQixDQUFDLEtBQUssQ0FBQztZQUNwQyxDQUFDLENBQUM7WUFDRixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBQSx3QkFBVyxFQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQ3JFLHVFQUF1RTtZQUN2RSxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUN4QyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBQSx3QkFBVyxFQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNyRSx5RUFBeUU7Z0JBQ3pFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsOENBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hELElBQUksQ0FBQyxDQUFDLE1BQU0sd0NBQWdDLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUUsQ0FBQztvQkFDcEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzVCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFTCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSx3QkFBVyxFQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUN0RCx5REFBeUQ7Z0JBQ3pELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsOENBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDL0IsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVMLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUM3RCwwQ0FBMEM7Z0JBQzFDLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDO29CQUN4QixrQ0FBbUIsQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFDMUIsa0NBQW1CLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQ2pDLGtDQUFtQixDQUFDLFdBQVcsQ0FBQyxFQUFFO29CQUNsQyxrQ0FBcUI7b0JBQ3JCLDBCQUEwQjtpQkFDMUIsQ0FBQyxDQUFDO2dCQUNILElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksTUFBTSxDQUFDLFlBQVksRUFBRSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztvQkFDL0UsSUFBQSx3QkFBVyxFQUFDLEVBQUUsQ0FBQyxFQUFFO3dCQUNoQix1Q0FBdUM7d0JBQ3ZDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUMvQixDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3JELHFEQUFxRDtnQkFDckQsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsa0JBQWtCLENBQVUsdUJBQXVCLENBQUMsSUFBSSxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLGlDQUFpQyxDQUFDO29CQUN6SixNQUFNLENBQUMsU0FBUyxxQ0FBNEIsQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDMUQsT0FBTztnQkFDUixDQUFDO2dCQUNELElBQUksaUVBQWtDLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3hELE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxJQUFBLHdCQUFXLEVBQUMsRUFBRSxDQUFDLEVBQUU7b0JBQ2hCLHFFQUFxRTtvQkFDckUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzVCLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSxvQkFBTyxFQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUMvQixtRUFBbUU7Z0JBQ25FLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzFELElBQUksS0FBSyxFQUFFLFdBQVcsRUFBRSxDQUFDO29CQUN4QixJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLElBQUksQ0FBQyxFQUFFLENBQUM7d0JBQzNDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29CQUNsRCxDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDdEQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQ3RELENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLHNCQUFzQixHQUF1QixTQUFTLENBQUM7WUFDM0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLGlDQUFvQixFQUFDO2dCQUNuQyxZQUFZLEVBQUUsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLEVBQUU7b0JBQ3hDLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsRUFBRSxDQUFDO3dCQUN0RCxzQkFBc0IsR0FBRyxTQUFTLENBQUM7b0JBQ3BDLENBQUM7b0JBQ0QsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQzthQUNELEVBQUUsS0FBSyxFQUFDLE1BQU0sRUFBQyxFQUFFO2dCQUNqQix3RkFBd0Y7Z0JBQ3hGLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRTNDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLEtBQUssR0FBRyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUNqRCxzQkFBc0IsR0FBRyxTQUFTLENBQUM7b0JBQ25DLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEtBQUssc0JBQXNCLEVBQUUsQ0FBQztvQkFDbEUsc0JBQXNCLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQztvQkFDM0QsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUNuRixJQUFJLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLGdEQUFtQixDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTt3QkFDM0YsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsMkRBQW1ELEVBQUUsQ0FBQzs0QkFDOUUsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO3dCQUN4RixDQUFDO29CQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJEQUE0QixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1lBQ3RHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN0RSxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQywyQ0FBMkMsQ0FBQyxFQUFFLENBQUM7b0JBQ3pFLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUscUNBQXFDLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQywyQ0FBMkMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDeEosQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxFQUFFLHFDQUFxQyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsMkNBQTJDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDeEosQ0FBQztRQUVNLHVCQUF1QixDQUFDLEVBQWdCO1lBQzlDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVPLHlCQUF5QixDQUFDLE9BQWU7WUFDaEQsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsa0JBQWtCLENBQVUsdUJBQXVCLENBQUMsQ0FBQztZQUMzRyxNQUFNLHdCQUF3QixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQzFHLElBQUksSUFBd0IsQ0FBQztZQUM3QixJQUFJLENBQUMscUJBQXFCLElBQUksd0JBQXdCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLDhEQUFvRCxFQUFFLENBQUM7Z0JBQ3JJLElBQUksR0FBRyxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSwyQ0FBMkMsRUFBRSx3QkFBd0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ2pJLENBQUM7WUFDRCxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUEsWUFBSyxFQUFDLE9BQU8sR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEsWUFBSyxFQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRDs7OztXQUlHO1FBQ0ssaUJBQWlCLENBQUMsRUFBZ0IsRUFBRSxZQUFtQztZQUM5RSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUMvRSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3pILENBQUM7UUFFTSxpQkFBaUIsQ0FBQyxLQUFZO1lBQ3BDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDM0QsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixPQUFPLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLElBQUksbUJBQVEsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEcsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVNLHlCQUF5QixDQUFDLFVBQWtCO1lBQ2xELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLENBQUM7UUFDM0UsQ0FBQztRQUVNLElBQUk7WUFDVixJQUFBLHdCQUFXLEVBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQzs7SUFsUVcsa0VBQTJCOzBDQUEzQiwyQkFBMkI7UUFzRHJDLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsMEJBQWUsQ0FBQTtRQUNmLFdBQUEseURBQStCLENBQUE7UUFDL0IsV0FBQSwyQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLHdEQUEyQixDQUFBO1FBQzNCLFdBQUEsK0JBQWtCLENBQUE7T0E3RFIsMkJBQTJCLENBbVF2QztJQUVELFNBQVMsK0JBQStCLENBQUksS0FBZ0MsRUFBRSxLQUFzQjtRQUNuRyxNQUFNLE1BQU0sR0FBRyxJQUFBLDRCQUFlLEVBQW1CLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMvRCxNQUFNLGdCQUFnQixHQUE2QixFQUFFLENBQUM7UUFFdEQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFBLG9CQUFPLEVBQUMsTUFBTSxDQUFDLEVBQUU7WUFDMUIsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUV0QyxJQUFBLHdCQUFXLEVBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ2hCLElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDbkQsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7b0JBQzVDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDbEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQzFCLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUEsNEJBQWUsRUFBSSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2pFLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO2dCQUNELGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRUosT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDIn0=