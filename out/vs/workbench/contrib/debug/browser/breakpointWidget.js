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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/button/button", "vs/base/browser/ui/selectBox/selectBox", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/modesRegistry", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/contrib/zoneWidget/browser/zoneWidget", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/workbench/contrib/debug/common/debug", "vs/css!./media/breakpointWidget"], function (require, exports, dom, keyboardEvent_1, button_1, selectBox_1, errors_1, lifecycle, uri_1, editorExtensions_1, codeEditorService_1, codeEditorWidget_1, position_1, range_1, editorContextKeys_1, modesRegistry_1, languageFeatures_1, model_1, resolverService_1, suggest_1, zoneWidget_1, nls, configuration_1, contextkey_1, contextView_1, instantiation_1, serviceCollection_1, keybinding_1, label_1, defaultStyles_1, colorRegistry_1, themeService_1, simpleEditorOptions_1, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreakpointWidget = void 0;
    const $ = dom.$;
    const IPrivateBreakpointWidgetService = (0, instantiation_1.createDecorator)('privateBreakpointWidgetService');
    const DECORATION_KEY = 'breakpointwidgetdecoration';
    function isPositionInCurlyBracketBlock(input) {
        const model = input.getModel();
        const bracketPairs = model.bracketPairs.getBracketPairsInRange(range_1.Range.fromPositions(input.getPosition()));
        return bracketPairs.some(p => p.openingBracketInfo.bracketText === '{');
    }
    function createDecorations(theme, placeHolder) {
        const transparentForeground = theme.getColor(colorRegistry_1.editorForeground)?.transparent(0.4);
        return [{
                range: {
                    startLineNumber: 0,
                    endLineNumber: 0,
                    startColumn: 0,
                    endColumn: 1
                },
                renderOptions: {
                    after: {
                        contentText: placeHolder,
                        color: transparentForeground ? transparentForeground.toString() : undefined
                    }
                }
            }];
    }
    let BreakpointWidget = class BreakpointWidget extends zoneWidget_1.ZoneWidget {
        constructor(editor, lineNumber, column, context, contextViewService, debugService, themeService, contextKeyService, instantiationService, modelService, codeEditorService, _configurationService, languageFeaturesService, keybindingService, labelService, textModelService) {
            super(editor, { showFrame: true, showArrow: false, frameWidth: 1, isAccessible: true });
            this.lineNumber = lineNumber;
            this.column = column;
            this.contextViewService = contextViewService;
            this.debugService = debugService;
            this.themeService = themeService;
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.codeEditorService = codeEditorService;
            this._configurationService = _configurationService;
            this.languageFeaturesService = languageFeaturesService;
            this.keybindingService = keybindingService;
            this.labelService = labelService;
            this.textModelService = textModelService;
            this.conditionInput = '';
            this.hitCountInput = '';
            this.logMessageInput = '';
            this.toDispose = [];
            const model = this.editor.getModel();
            if (model) {
                const uri = model.uri;
                const breakpoints = this.debugService.getModel().getBreakpoints({ lineNumber: this.lineNumber, column: this.column, uri });
                this.breakpoint = breakpoints.length ? breakpoints[0] : undefined;
            }
            if (context === undefined) {
                if (this.breakpoint && !this.breakpoint.condition && !this.breakpoint.hitCondition && this.breakpoint.logMessage) {
                    this.context = 2 /* Context.LOG_MESSAGE */;
                }
                else if (this.breakpoint && !this.breakpoint.condition && this.breakpoint.hitCondition) {
                    this.context = 1 /* Context.HIT_COUNT */;
                }
                else if (this.breakpoint && this.breakpoint.triggeredBy) {
                    this.context = 3 /* Context.TRIGGER_POINT */;
                }
                else {
                    this.context = 0 /* Context.CONDITION */;
                }
            }
            else {
                this.context = context;
            }
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(e => {
                if (this.breakpoint && e && e.removed && e.removed.indexOf(this.breakpoint) >= 0) {
                    this.dispose();
                }
            }));
            this.codeEditorService.registerDecorationType('breakpoint-widget', DECORATION_KEY, {});
            this.create();
        }
        get placeholder() {
            const acceptString = this.keybindingService.lookupKeybinding(AcceptBreakpointWidgetInputAction.ID)?.getLabel() || 'Enter';
            const closeString = this.keybindingService.lookupKeybinding(CloseBreakpointWidgetCommand.ID)?.getLabel() || 'Escape';
            switch (this.context) {
                case 2 /* Context.LOG_MESSAGE */:
                    return nls.localize('breakpointWidgetLogMessagePlaceholder', "Message to log when breakpoint is hit. Expressions within {} are interpolated. '{0}' to accept, '{1}' to cancel.", acceptString, closeString);
                case 1 /* Context.HIT_COUNT */:
                    return nls.localize('breakpointWidgetHitCountPlaceholder', "Break when hit count condition is met. '{0}' to accept, '{1}' to cancel.", acceptString, closeString);
                default:
                    return nls.localize('breakpointWidgetExpressionPlaceholder', "Break when expression evaluates to true. '{0}' to accept, '{1}' to cancel.", acceptString, closeString);
            }
        }
        getInputValue(breakpoint) {
            switch (this.context) {
                case 2 /* Context.LOG_MESSAGE */:
                    return breakpoint && breakpoint.logMessage ? breakpoint.logMessage : this.logMessageInput;
                case 1 /* Context.HIT_COUNT */:
                    return breakpoint && breakpoint.hitCondition ? breakpoint.hitCondition : this.hitCountInput;
                default:
                    return breakpoint && breakpoint.condition ? breakpoint.condition : this.conditionInput;
            }
        }
        rememberInput() {
            if (this.context !== 3 /* Context.TRIGGER_POINT */) {
                const value = this.input.getModel().getValue();
                switch (this.context) {
                    case 2 /* Context.LOG_MESSAGE */:
                        this.logMessageInput = value;
                        break;
                    case 1 /* Context.HIT_COUNT */:
                        this.hitCountInput = value;
                        break;
                    default:
                        this.conditionInput = value;
                }
            }
        }
        setInputMode() {
            if (this.editor.hasModel()) {
                // Use plaintext language for log messages, otherwise respect underlying editor language #125619
                const languageId = this.context === 2 /* Context.LOG_MESSAGE */ ? modesRegistry_1.PLAINTEXT_LANGUAGE_ID : this.editor.getModel().getLanguageId();
                this.input.getModel().setLanguage(languageId);
            }
        }
        show(rangeOrPos) {
            const lineNum = this.input.getModel().getLineCount();
            super.show(rangeOrPos, lineNum + 1);
        }
        fitHeightToContent() {
            const lineNum = this.input.getModel().getLineCount();
            this._relayout(lineNum + 1);
        }
        _fillContainer(container) {
            this.setCssClass('breakpoint-widget');
            const selectBox = new selectBox_1.SelectBox([
                { text: nls.localize('expression', "Expression") },
                { text: nls.localize('hitCount', "Hit Count") },
                { text: nls.localize('logMessage', "Log Message") },
                { text: nls.localize('triggeredBy', "Wait for Breakpoint") },
            ], this.context, this.contextViewService, defaultStyles_1.defaultSelectBoxStyles, { ariaLabel: nls.localize('breakpointType', 'Breakpoint Type') });
            this.selectContainer = $('.breakpoint-select-container');
            selectBox.render(dom.append(container, this.selectContainer));
            selectBox.onDidSelect(e => {
                this.rememberInput();
                this.context = e.index;
                this.updateContextInput();
            });
            this.createModesInput(container);
            this.inputContainer = $('.inputContainer');
            this.createBreakpointInput(dom.append(container, this.inputContainer));
            this.input.getModel().setValue(this.getInputValue(this.breakpoint));
            this.toDispose.push(this.input.getModel().onDidChangeContent(() => {
                this.fitHeightToContent();
            }));
            this.input.setPosition({ lineNumber: 1, column: this.input.getModel().getLineMaxColumn(1) });
            this.createTriggerBreakpointInput(container);
            this.updateContextInput();
            // Due to an electron bug we have to do the timeout, otherwise we do not get focus
            setTimeout(() => this.focusInput(), 150);
        }
        createModesInput(container) {
            const modes = this.debugService.getModel().getBreakpointModes('source');
            if (modes.length <= 1) {
                return;
            }
            const sb = this.selectModeBox = new selectBox_1.SelectBox([
                { text: nls.localize('bpMode', 'Mode'), isDisabled: true },
                ...modes.map(mode => ({ text: mode.label, description: mode.description })),
            ], modes.findIndex(m => m.mode === this.breakpoint?.mode) + 1, this.contextViewService, defaultStyles_1.defaultSelectBoxStyles);
            this.toDispose.push(sb);
            this.toDispose.push(sb.onDidSelect(e => {
                this.modeInput = modes[e.index - 1];
            }));
            const modeWrapper = $('.select-mode-container');
            const selectionWrapper = $('.select-box-container');
            dom.append(modeWrapper, selectionWrapper);
            sb.render(selectionWrapper);
            dom.append(container, modeWrapper);
        }
        createTriggerBreakpointInput(container) {
            const breakpoints = this.debugService.getModel().getBreakpoints().filter(bp => bp !== this.breakpoint);
            const breakpointOptions = [
                { text: nls.localize('noTriggerByBreakpoint', 'None'), isDisabled: true },
                ...breakpoints.map(bp => ({
                    text: `${this.labelService.getUriLabel(bp.uri, { relative: true })}: ${bp.lineNumber}`,
                    description: nls.localize('triggerByLoading', 'Loading...')
                })),
            ];
            const index = breakpoints.findIndex((bp) => this.breakpoint?.triggeredBy === bp.getId());
            for (const [i, bp] of breakpoints.entries()) {
                this.textModelService.createModelReference(bp.uri).then(ref => {
                    try {
                        breakpointOptions[i + 1].description = ref.object.textEditorModel.getLineContent(bp.lineNumber).trim();
                    }
                    finally {
                        ref.dispose();
                    }
                }).catch(() => {
                    breakpointOptions[i + 1].description = nls.localize('noBpSource', 'Could not load source.');
                });
            }
            const selectBreakpointBox = this.selectBreakpointBox = new selectBox_1.SelectBox(breakpointOptions, index + 1, this.contextViewService, defaultStyles_1.defaultSelectBoxStyles, { ariaLabel: nls.localize('selectBreakpoint', 'Select breakpoint') });
            selectBreakpointBox.onDidSelect(e => {
                if (e.index === 0) {
                    this.triggeredByBreakpointInput = undefined;
                }
                else {
                    this.triggeredByBreakpointInput = breakpoints[e.index - 1];
                }
            });
            this.toDispose.push(selectBreakpointBox);
            this.selectBreakpointContainer = $('.select-breakpoint-container');
            this.toDispose.push(dom.addDisposableListener(this.selectBreakpointContainer, dom.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(9 /* KeyCode.Escape */)) {
                    this.close(false);
                }
            }));
            const selectionWrapper = $('.select-box-container');
            dom.append(this.selectBreakpointContainer, selectionWrapper);
            selectBreakpointBox.render(selectionWrapper);
            dom.append(container, this.selectBreakpointContainer);
            const closeButton = new button_1.Button(this.selectBreakpointContainer, defaultStyles_1.defaultButtonStyles);
            closeButton.label = nls.localize('ok', "Ok");
            this.toDispose.push(closeButton.onDidClick(() => this.close(true)));
            this.toDispose.push(closeButton);
        }
        updateContextInput() {
            if (this.context === 3 /* Context.TRIGGER_POINT */) {
                this.inputContainer.hidden = true;
                this.selectBreakpointContainer.hidden = false;
            }
            else {
                this.inputContainer.hidden = false;
                this.selectBreakpointContainer.hidden = true;
                this.setInputMode();
                const value = this.getInputValue(this.breakpoint);
                this.input.getModel().setValue(value);
                this.focusInput();
            }
        }
        _doLayout(heightInPixel, widthInPixel) {
            this.heightInPx = heightInPixel;
            this.input.layout({ height: heightInPixel, width: widthInPixel - 113 });
            this.centerInputVertically();
        }
        _onWidth(widthInPixel) {
            if (typeof this.heightInPx === 'number') {
                this._doLayout(this.heightInPx, widthInPixel);
            }
        }
        createBreakpointInput(container) {
            const scopedContextKeyService = this.contextKeyService.createScoped(container);
            this.toDispose.push(scopedContextKeyService);
            const scopedInstatiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService], [IPrivateBreakpointWidgetService, this]));
            const options = this.createEditorOptions();
            const codeEditorWidgetOptions = (0, simpleEditorOptions_1.getSimpleCodeEditorWidgetOptions)();
            this.input = scopedInstatiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, container, options, codeEditorWidgetOptions);
            debug_1.CONTEXT_IN_BREAKPOINT_WIDGET.bindTo(scopedContextKeyService).set(true);
            const model = this.modelService.createModel('', null, uri_1.URI.parse(`${debug_1.DEBUG_SCHEME}:${this.editor.getId()}:breakpointinput`), true);
            if (this.editor.hasModel()) {
                model.setLanguage(this.editor.getModel().getLanguageId());
            }
            this.input.setModel(model);
            this.setInputMode();
            this.toDispose.push(model);
            const setDecorations = () => {
                const value = this.input.getModel().getValue();
                const decorations = !!value ? [] : createDecorations(this.themeService.getColorTheme(), this.placeholder);
                this.input.setDecorationsByType('breakpoint-widget', DECORATION_KEY, decorations);
            };
            this.input.getModel().onDidChangeContent(() => setDecorations());
            this.themeService.onDidColorThemeChange(() => setDecorations());
            this.toDispose.push(this.languageFeaturesService.completionProvider.register({ scheme: debug_1.DEBUG_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'breakpointWidget',
                provideCompletionItems: (model, position, _context, token) => {
                    let suggestionsPromise;
                    const underlyingModel = this.editor.getModel();
                    if (underlyingModel && (this.context === 0 /* Context.CONDITION */ || (this.context === 2 /* Context.LOG_MESSAGE */ && isPositionInCurlyBracketBlock(this.input)))) {
                        suggestionsPromise = (0, suggest_1.provideSuggestionItems)(this.languageFeaturesService.completionProvider, underlyingModel, new position_1.Position(this.lineNumber, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* CompletionItemKind.Snippet */)), _context, token).then(suggestions => {
                            let overwriteBefore = 0;
                            if (this.context === 0 /* Context.CONDITION */) {
                                overwriteBefore = position.column - 1;
                            }
                            else {
                                // Inside the currly brackets, need to count how many useful characters are behind the position so they would all be taken into account
                                const value = this.input.getModel().getValue();
                                while ((position.column - 2 - overwriteBefore >= 0) && value[position.column - 2 - overwriteBefore] !== '{' && value[position.column - 2 - overwriteBefore] !== ' ') {
                                    overwriteBefore++;
                                }
                            }
                            return {
                                suggestions: suggestions.items.map(s => {
                                    s.completion.range = range_1.Range.fromPositions(position.delta(0, -overwriteBefore), position);
                                    return s.completion;
                                })
                            };
                        });
                    }
                    else {
                        suggestionsPromise = Promise.resolve({ suggestions: [] });
                    }
                    return suggestionsPromise;
                }
            }));
            this.toDispose.push(this._configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('editor.fontSize') || e.affectsConfiguration('editor.lineHeight')) {
                    this.input.updateOptions(this.createEditorOptions());
                    this.centerInputVertically();
                }
            }));
        }
        createEditorOptions() {
            const editorConfig = this._configurationService.getValue('editor');
            const options = (0, simpleEditorOptions_1.getSimpleEditorOptions)(this._configurationService);
            options.fontSize = editorConfig.fontSize;
            options.fontFamily = editorConfig.fontFamily;
            options.lineHeight = editorConfig.lineHeight;
            options.fontLigatures = editorConfig.fontLigatures;
            options.ariaLabel = this.placeholder;
            return options;
        }
        centerInputVertically() {
            if (this.container && typeof this.heightInPx === 'number') {
                const lineHeight = this.input.getOption(67 /* EditorOption.lineHeight */);
                const lineNum = this.input.getModel().getLineCount();
                const newTopMargin = (this.heightInPx - lineNum * lineHeight) / 2;
                this.inputContainer.style.marginTop = newTopMargin + 'px';
            }
        }
        close(success) {
            if (success) {
                // if there is already a breakpoint on this location - remove it.
                let condition = this.breakpoint?.condition;
                let hitCondition = this.breakpoint?.hitCondition;
                let logMessage = this.breakpoint?.logMessage;
                let triggeredBy = this.breakpoint?.triggeredBy;
                let mode = this.breakpoint?.mode;
                let modeLabel = this.breakpoint?.modeLabel;
                this.rememberInput();
                if (this.conditionInput || this.context === 0 /* Context.CONDITION */) {
                    condition = this.conditionInput;
                }
                if (this.hitCountInput || this.context === 1 /* Context.HIT_COUNT */) {
                    hitCondition = this.hitCountInput;
                }
                if (this.logMessageInput || this.context === 2 /* Context.LOG_MESSAGE */) {
                    logMessage = this.logMessageInput;
                }
                if (this.selectModeBox) {
                    mode = this.modeInput?.mode;
                    modeLabel = this.modeInput?.label;
                }
                if (this.context === 3 /* Context.TRIGGER_POINT */) {
                    // currently, trigger points don't support additional conditions:
                    condition = undefined;
                    hitCondition = undefined;
                    logMessage = undefined;
                    triggeredBy = this.triggeredByBreakpointInput?.getId();
                }
                if (this.breakpoint) {
                    const data = new Map();
                    data.set(this.breakpoint.getId(), {
                        condition,
                        hitCondition,
                        logMessage,
                        triggeredBy,
                        mode,
                        modeLabel,
                    });
                    this.debugService.updateBreakpoints(this.breakpoint.originalUri, data, false).then(undefined, errors_1.onUnexpectedError);
                }
                else {
                    const model = this.editor.getModel();
                    if (model) {
                        this.debugService.addBreakpoints(model.uri, [{
                                lineNumber: this.lineNumber,
                                column: this.column,
                                enabled: true,
                                condition,
                                hitCondition,
                                logMessage,
                                triggeredBy,
                                mode,
                                modeLabel,
                            }]);
                    }
                }
            }
            this.dispose();
        }
        focusInput() {
            if (this.context === 3 /* Context.TRIGGER_POINT */) {
                this.selectBreakpointBox.focus();
            }
            else {
                this.input.focus();
            }
        }
        dispose() {
            super.dispose();
            this.input.dispose();
            lifecycle.dispose(this.toDispose);
            setTimeout(() => this.editor.focus(), 0);
        }
    };
    exports.BreakpointWidget = BreakpointWidget;
    exports.BreakpointWidget = BreakpointWidget = __decorate([
        __param(4, contextView_1.IContextViewService),
        __param(5, debug_1.IDebugService),
        __param(6, themeService_1.IThemeService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, model_1.IModelService),
        __param(10, codeEditorService_1.ICodeEditorService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, languageFeatures_1.ILanguageFeaturesService),
        __param(13, keybinding_1.IKeybindingService),
        __param(14, label_1.ILabelService),
        __param(15, resolverService_1.ITextModelService)
    ], BreakpointWidget);
    class AcceptBreakpointWidgetInputAction extends editorExtensions_1.EditorCommand {
        static { this.ID = 'breakpointWidget.action.acceptInput'; }
        constructor() {
            super({
                id: AcceptBreakpointWidgetInputAction.ID,
                precondition: debug_1.CONTEXT_BREAKPOINT_WIDGET_VISIBLE,
                kbOpts: {
                    kbExpr: debug_1.CONTEXT_IN_BREAKPOINT_WIDGET,
                    primary: 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        runEditorCommand(accessor, editor) {
            accessor.get(IPrivateBreakpointWidgetService).close(true);
        }
    }
    class CloseBreakpointWidgetCommand extends editorExtensions_1.EditorCommand {
        static { this.ID = 'closeBreakpointWidget'; }
        constructor() {
            super({
                id: CloseBreakpointWidgetCommand.ID,
                precondition: debug_1.CONTEXT_BREAKPOINT_WIDGET_VISIBLE,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 9 /* KeyCode.Escape */,
                    secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        runEditorCommand(accessor, editor, args) {
            const debugContribution = editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID);
            if (debugContribution) {
                // if focus is in outer editor we need to use the debug contribution to close
                return debugContribution.closeBreakpointWidget();
            }
            accessor.get(IPrivateBreakpointWidgetService).close(false);
        }
    }
    (0, editorExtensions_1.registerEditorCommand)(new AcceptBreakpointWidgetInputAction());
    (0, editorExtensions_1.registerEditorCommand)(new CloseBreakpointWidgetCommand());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWtwb2ludFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9icmVha3BvaW50V2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTRDaEcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNoQixNQUFNLCtCQUErQixHQUFHLElBQUEsK0JBQWUsRUFBa0MsZ0NBQWdDLENBQUMsQ0FBQztJQUszSCxNQUFNLGNBQWMsR0FBRyw0QkFBNEIsQ0FBQztJQUVwRCxTQUFTLDZCQUE2QixDQUFDLEtBQXdCO1FBQzlELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMvQixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLHNCQUFzQixDQUFDLGFBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6RyxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsV0FBVyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFFRCxTQUFTLGlCQUFpQixDQUFDLEtBQWtCLEVBQUUsV0FBbUI7UUFDakUsTUFBTSxxQkFBcUIsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLGdDQUFnQixDQUFDLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pGLE9BQU8sQ0FBQztnQkFDUCxLQUFLLEVBQUU7b0JBQ04sZUFBZSxFQUFFLENBQUM7b0JBQ2xCLGFBQWEsRUFBRSxDQUFDO29CQUNoQixXQUFXLEVBQUUsQ0FBQztvQkFDZCxTQUFTLEVBQUUsQ0FBQztp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