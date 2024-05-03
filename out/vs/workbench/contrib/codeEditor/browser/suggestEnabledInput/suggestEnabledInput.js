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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/widget", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/editor/browser/editorExtensions", "vs/base/browser/fonts", "vs/base/common/history", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/instantiation/common/serviceCollection", "vs/editor/common/services/languageFeatures", "vs/editor/common/core/wordHelper", "vs/platform/configuration/common/configuration", "vs/css!./suggestEnabledInput"], function (require, exports, dom_1, widget_1, event_1, objects_1, platform_1, uri_1, codeEditorWidget_1, editOperation_1, position_1, range_1, model_1, contextmenu_1, snippetController2_1, suggestController_1, contextkey_1, instantiation_1, colorRegistry_1, themeService_1, menuPreventer_1, simpleEditorOptions_1, selectionClipboard_1, editorExtensions_1, fonts_1, history_1, contextScopedHistoryWidget_1, serviceCollection_1, languageFeatures_1, wordHelper_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextScopedSuggestEnabledInputWithHistory = exports.SuggestEnabledInputWithHistory = exports.SuggestEnabledInput = void 0;
    let SuggestEnabledInput = class SuggestEnabledInput extends widget_1.Widget {
        constructor(id, parent, suggestionProvider, ariaLabel, resourceHandle, options, defaultInstantiationService, modelService, contextKeyService, languageFeaturesService, configurationService) {
            super();
            this._onShouldFocusResults = new event_1.Emitter();
            this.onShouldFocusResults = this._onShouldFocusResults.event;
            this._onInputDidChange = new event_1.Emitter();
            this.onInputDidChange = this._onInputDidChange.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this.stylingContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.suggest-input-container'));
            this.element = parent;
            this.placeholderText = (0, dom_1.append)(this.stylingContainer, (0, dom_1.$)('.suggest-input-placeholder', undefined, options.placeholderText || ''));
            const editorOptions = (0, objects_1.mixin)((0, simpleEditorOptions_1.getSimpleEditorOptions)(configurationService), getSuggestEnabledInputOptions(ariaLabel));
            editorOptions.overflowWidgetsDomNode = options.overflowWidgetsDomNode;
            const scopedContextKeyService = this.getScopedContextKeyService(contextKeyService);
            const instantiationService = scopedContextKeyService
                ? defaultInstantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService]))
                : defaultInstantiationService;
            this.inputWidget = this._register(instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.stylingContainer, editorOptions, {
                contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    suggestController_1.SuggestController.ID,
                    snippetController2_1.SnippetController2.ID,
                    contextmenu_1.ContextMenuController.ID,
                    menuPreventer_1.MenuPreventer.ID,
                    selectionClipboard_1.SelectionClipboardContributionID,
                ]),
                isSimpleWidget: true,
            }));
            this._register(configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('editor.accessibilitySupport') ||
                    e.affectsConfiguration('editor.cursorBlinking')) {
                    const accessibilitySupport = configurationService.getValue('editor.accessibilitySupport');
                    const cursorBlinking = configurationService.getValue('editor.cursorBlinking');
                    this.inputWidget.updateOptions({
                        accessibilitySupport,
                        cursorBlinking
                    });
                }
            }));
            this._register(this.inputWidget.onDidFocusEditorText(() => this._onDidFocus.fire()));
            this._register(this.inputWidget.onDidBlurEditorText(() => this._onDidBlur.fire()));
            const scopeHandle = uri_1.URI.parse(resourceHandle);
            this.inputModel = modelService.createModel('', null, scopeHandle, true);
            this._register(this.inputModel);
            this.inputWidget.setModel(this.inputModel);
            this._register(this.inputWidget.onDidPaste(() => this.setValue(this.getValue()))); // setter cleanses
            this._register((this.inputWidget.onDidFocusEditorText(() => {
                if (options.focusContextKey) {
                    options.focusContextKey.set(true);
                }
                this.stylingContainer.classList.add('synthetic-focus');
            })));
            this._register((this.inputWidget.onDidBlurEditorText(() => {
                if (options.focusContextKey) {
                    options.focusContextKey.set(false);
                }
                this.stylingContainer.classList.remove('synthetic-focus');
            })));
            this._register(event_1.Event.chain(this.inputWidget.onKeyDown, $ => $.filter(e => e.keyCode === 3 /* KeyCode.Enter */))(e => { e.preventDefault(); /** Do nothing. Enter causes new line which is not expected. */ }, this));
            this._register(event_1.Event.chain(this.inputWidget.onKeyDown, $ => $.filter(e => e.keyCode === 18 /* KeyCode.DownArrow */ && (platform_1.isMacintosh ? e.metaKey : e.ctrlKey)))(() => this._onShouldFocusResults.fire(), this));
            let preexistingContent = this.getValue();
            const inputWidgetModel = this.inputWidget.getModel();
            if (inputWidgetModel) {
                this._register(inputWidgetModel.onDidChangeContent(() => {
                    const content = this.getValue();
                    this.placeholderText.style.visibility = content ? 'hidden' : 'visible';
                    if (preexistingContent.trim() === content.trim()) {
                        return;
                    }
                    this._onInputDidChange.fire(undefined);
                    preexistingContent = content;
                }));
            }
            const validatedSuggestProvider = {
                provideResults: suggestionProvider.provideResults,
                sortKey: suggestionProvider.sortKey || (a => a),
                triggerCharacters: suggestionProvider.triggerCharacters || [],
                wordDefinition: suggestionProvider.wordDefinition ? (0, wordHelper_1.ensureValidWordDefinition)(suggestionProvider.wordDefinition) : undefined,
                alwaysShowSuggestions: !!suggestionProvider.alwaysShowSuggestions,
            };
            this.setValue(options.value || '');
            this._register(languageFeaturesService.completionProvider.register({ scheme: scopeHandle.scheme, pattern: '**/' + scopeHandle.path, hasAccessToAllModels: true }, {
                _debugDisplayName: `suggestEnabledInput/${id}`,
                triggerCharacters: validatedSuggestProvider.triggerCharacters,
                provideCompletionItems: (model, position, _context) => {
                    const query = model.getValue();
                    const zeroIndexedColumn = position.column - 1;
                    let alreadyTypedCount = 0, zeroIndexedWordStart = 0;
                    if (validatedSuggestProvider.wordDefinition) {
                        const wordAtText = (0, wordHelper_1.getWordAtText)(position.column, validatedSuggestProvider.wordDefinition, query, 0);
                        alreadyTypedCount = wordAtText?.word.length ?? 0;
                        zeroIndexedWordStart = wordAtText ? wordAtText.startColumn - 1 : 0;
                    }
                    else {
                        zeroIndexedWordStart = query.lastIndexOf(' ', zeroIndexedColumn - 1) + 1;
                        alreadyTypedCount = zeroIndexedColumn - zeroIndexedWordStart;
                    }
                    // dont show suggestions if the user has typed something, but hasn't used the trigger character
                    if (!validatedSuggestProvider.alwaysShowSuggestions && alreadyTypedCount > 0 && validatedSuggestProvider.triggerCharacters?.indexOf(query[zeroIndexedWordStart]) === -1) {
                        return { suggestions: [] };
                    }
                    return {
                        suggestions: suggestionProvider.provideResults(query).map((result) => {
                            let label;
                            let rest;
                            if (typeof result === 'string') {
                                label = result;
                            }
                            else {
                                label = result.label;
                                rest = result;
                            }
                            return {
                                label,
                                insertText: label,
                                range: range_1.Range.fromPositions(position.delta(0, -alreadyTypedCount), position),
                                sortText: validatedSuggestProvider.sortKey(label),
                                kind: 17 /* languages.CompletionItemKind.Keyword */,
                                ...rest
                            };
                        })
                    };
                }
            }));
            this.style(options.styleOverrides || {});
        }
        getScopedContextKeyService(_contextKeyService) {
            return undefined;
        }
        updateAriaLabel(label) {
            this.inputWidget.updateOptions({ ariaLabel: label });
        }
        setValue(val) {
            val = val.replace(/\s/g, ' ');
            const fullRange = this.inputModel.getFullModelRange();
            this.inputWidget.executeEdits('suggestEnabledInput.setValue', [editOperation_1.EditOperation.replace(fullRange, val)]);
            this.inputWidget.setScrollTop(0);
            this.inputWidget.setPosition(new position_1.Position(1, val.length + 1));
        }
        getValue() {
            return this.inputWidget.getValue();
        }
        style(styleOverrides) {
            this.stylingContainer.style.backgroundColor = (0, colorRegistry_1.asCssVariable)(styleOverrides.inputBackground ?? colorRegistry_1.inputBackground);
            this.stylingContainer.style.color = (0, colorRegistry_1.asCssVariable)(styleOverrides.inputForeground ?? colorRegistry_1.inputForeground);
            this.placeholderText.style.color = (0, colorRegistry_1.asCssVariable)(styleOverrides.inputPlaceholderForeground ?? colorRegistry_1.inputPlaceholderForeground);
            this.stylingContainer.style.borderWidth = '1px';
            this.stylingContainer.style.borderStyle = 'solid';
            this.stylingContainer.style.borderColor = (0, colorRegistry_1.asCssVariableWithDefault)(styleOverrides.inputBorder ?? colorRegistry_1.inputBorder, 'transparent');
            const cursor = this.stylingContainer.getElementsByClassName('cursor')[0];
            if (cursor) {
                cursor.style.backgroundColor = (0, colorRegistry_1.asCssVariable)(styleOverrides.inputForeground ?? colorRegistry_1.inputForeground);
            }
        }
        focus(selectAll) {
            this.inputWidget.focus();
            if (selectAll && this.inputWidget.getValue()) {
                this.selectAll();
            }
        }
        onHide() {
            this.inputWidget.onHide();
        }
        layout(dimension) {
            this.inputWidget.layout(dimension);
            this.placeholderText.style.width = `${dimension.width - 2}px`;
        }
        selectAll() {
            this.inputWidget.setSelection(new range_1.Range(1, 1, 1, this.getValue().length + 1));
        }
    };
    exports.SuggestEnabledInput = SuggestEnabledInput;
    exports.SuggestEnabledInput = SuggestEnabledInput = __decorate([
        __param(6, instantiation_1.IInstantiationService),
        __param(7, model_1.IModelService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, languageFeatures_1.ILanguageFeaturesService),
        __param(10, configuration_1.IConfigurationService)
    ], SuggestEnabledInput);
    let SuggestEnabledInputWithHistory = class SuggestEnabledInputWithHistory extends SuggestEnabledInput {
        constructor({ id, parent, ariaLabel, suggestionProvider, resourceHandle, suggestOptions, history }, instantiationService, modelService, contextKeyService, languageFeaturesService, configurationService) {
            super(id, parent, suggestionProvider, ariaLabel, resourceHandle, suggestOptions, instantiationService, modelService, contextKeyService, languageFeaturesService, configurationService);
            this.history = new history_1.HistoryNavigator(history, 100);
        }
        addToHistory() {
            const value = this.getValue();
            if (value && value !== this.getCurrentValue()) {
                this.history.add(value);
            }
        }
        getHistory() {
            return this.history.getHistory();
        }
        showNextValue() {
            if (!this.history.has(this.getValue())) {
                this.addToHistory();
            }
            let next = this.getNextValue();
            if (next) {
                next = next === this.getValue() ? this.getNextValue() : next;
            }
            this.setValue(next ?? '');
        }
        showPreviousValue() {
            if (!this.history.has(this.getValue())) {
                this.addToHistory();
            }
            let previous = this.getPreviousValue();
            if (previous) {
                previous = previous === this.getValue() ? this.getPreviousValue() : previous;
            }
            if (previous) {
                this.setValue(previous);
                this.inputWidget.setPosition({ lineNumber: 0, column: 0 });
            }
        }
        clearHistory() {
            this.history.clear();
        }
        getCurrentValue() {
            let currentValue = this.history.current();
            if (!currentValue) {
                currentValue = this.history.last();
                this.history.next();
            }
            return currentValue;
        }
        getPreviousValue() {
            return this.history.previous() || this.history.first();
        }
        getNextValue() {
            return this.history.next();
        }
    };
    exports.SuggestEnabledInputWithHistory = SuggestEnabledInputWithHistory;
    exports.SuggestEnabledInputWithHistory = SuggestEnabledInputWithHistory = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, model_1.IModelService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, languageFeatures_1.ILanguageFeaturesService),
        __param(5, configuration_1.IConfigurationService)
    ], SuggestEnabledInputWithHistory);
    let ContextScopedSuggestEnabledInputWithHistory = class ContextScopedSuggestEnabledInputWithHistory extends SuggestEnabledInputWithHistory {
        constructor(options, instantiationService, modelService, contextKeyService, languageFeaturesService, configurationService) {
            super(options, instantiationService, modelService, contextKeyService, languageFeaturesService, configurationService);
            const { historyNavigationBackwardsEnablement, historyNavigationForwardsEnablement } = this.historyContext;
            this._register(this.inputWidget.onDidChangeCursorPosition(({ position }) => {
                const viewModel = this.inputWidget._getViewModel();
                const lastLineNumber = viewModel.getLineCount();
                const lastLineCol = viewModel.getLineLength(lastLineNumber) + 1;
                const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(position);
                historyNavigationBackwardsEnablement.set(viewPosition.lineNumber === 1 && viewPosition.column === 1);
                historyNavigationForwardsEnablement.set(viewPosition.lineNumber === lastLineNumber && viewPosition.column === lastLineCol);
            }));
        }
        getScopedContextKeyService(contextKeyService) {
            const scopedContextKeyService = this._register(contextKeyService.createScoped(this.element));
            this.historyContext = this._register((0, contextScopedHistoryWidget_1.registerAndCreateHistoryNavigationContext)(scopedContextKeyService, this));
            return scopedContextKeyService;
        }
    };
    exports.ContextScopedSuggestEnabledInputWithHistory = ContextScopedSuggestEnabledInputWithHistory;
    exports.ContextScopedSuggestEnabledInputWithHistory = ContextScopedSuggestEnabledInputWithHistory = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, model_1.IModelService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, languageFeatures_1.ILanguageFeaturesService),
        __param(5, configuration_1.IConfigurationService)
    ], ContextScopedSuggestEnabledInputWithHistory);
    // Override styles in selections.ts
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const selectionBackgroundColor = theme.getColor(colorRegistry_1.selectionBackground);
        if (selectionBackgroundColor) {
            // Override inactive selection bg
            const inputBackgroundColor = theme.getColor(colorRegistry_1.inputBackground);
            if (inputBackgroundColor) {
                collector.addRule(`.suggest-input-container .monaco-editor .selected-text { background-color: ${inputBackgroundColor.transparent(0.4)}; }`);
            }
            // Override selected fg
            const inputForegroundColor = theme.getColor(colorRegistry_1.inputForeground);
            if (inputForegroundColor) {
                collector.addRule(`.suggest-input-container .monaco-editor .view-line span.inline-selected-text { color: ${inputForegroundColor}; }`);
            }
            const backgroundColor = theme.getColor(colorRegistry_1.inputBackground);
            if (backgroundColor) {
                collector.addRule(`.suggest-input-container .monaco-editor-background { background-color: ${backgroundColor}; } `);
            }
            collector.addRule(`.suggest-input-container .monaco-editor .focused .selected-text { background-color: ${selectionBackgroundColor}; }`);
        }
        else {
            // Use editor selection color if theme has not set a selection background color
            collector.addRule(`.suggest-input-container .monaco-editor .focused .selected-text { background-color: ${theme.getColor(colorRegistry_1.editorSelectionBackground)}; }`);
        }
    });
    function getSuggestEnabledInputOptions(ariaLabel) {
        return {
            fontSize: 13,
            lineHeight: 20,
            wordWrap: 'off',
            scrollbar: { vertical: 'hidden', },
            roundedSelection: false,
            guides: {
                indentation: false
            },
            cursorWidth: 1,
            fontFamily: fonts_1.DEFAULT_FONT_FAMILY,
            ariaLabel: ariaLabel || '',
            snippetSuggestions: 'none',
            suggest: { filterGraceful: false, showIcons: false },
            autoClosingBrackets: 'never'
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdEVuYWJsZWRJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL3N1Z2dlc3RFbmFibGVkSW5wdXQvc3VnZ2VzdEVuYWJsZWRJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrSHpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsZUFBTTtRQW9COUMsWUFDQyxFQUFVLEVBQ1YsTUFBbUIsRUFDbkIsa0JBQTBDLEVBQzFDLFNBQWlCLEVBQ2pCLGNBQXNCLEVBQ3RCLE9BQW1DLEVBQ1osMkJBQWtELEVBQzFELFlBQTJCLEVBQ3RCLGlCQUFxQyxFQUMvQix1QkFBaUQsRUFDcEQsb0JBQTJDO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBL0JRLDBCQUFxQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDcEQseUJBQW9CLEdBQWdCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7WUFFN0Qsc0JBQWlCLEdBQUcsSUFBSSxlQUFPLEVBQXNCLENBQUM7WUFDOUQscUJBQWdCLEdBQThCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFFbkUsZ0JBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMxRCxlQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFFNUIsZUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3pELGNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQXVCMUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUEs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