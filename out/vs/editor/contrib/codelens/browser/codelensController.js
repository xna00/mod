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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/browser/stableEditorScroll", "vs/editor/browser/editorExtensions", "vs/editor/common/config/editorOptions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/codelens/browser/codelens", "vs/editor/contrib/codelens/browser/codeLensCache", "vs/editor/contrib/codelens/browser/codelensWidget", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures"], function (require, exports, async_1, errors_1, lifecycle_1, stableEditorScroll_1, editorExtensions_1, editorOptions_1, editorContextKeys_1, codelens_1, codeLensCache_1, codelensWidget_1, nls_1, commands_1, notification_1, quickInput_1, languageFeatureDebounce_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeLensContribution = void 0;
    let CodeLensContribution = class CodeLensContribution {
        static { this.ID = 'css.editor.codeLens'; }
        constructor(_editor, _languageFeaturesService, debounceService, _commandService, _notificationService, _codeLensCache) {
            this._editor = _editor;
            this._languageFeaturesService = _languageFeaturesService;
            this._commandService = _commandService;
            this._notificationService = _notificationService;
            this._codeLensCache = _codeLensCache;
            this._disposables = new lifecycle_1.DisposableStore();
            this._localToDispose = new lifecycle_1.DisposableStore();
            this._lenses = [];
            this._oldCodeLensModels = new lifecycle_1.DisposableStore();
            this._provideCodeLensDebounce = debounceService.for(_languageFeaturesService.codeLensProvider, 'CodeLensProvide', { min: 250 });
            this._resolveCodeLensesDebounce = debounceService.for(_languageFeaturesService.codeLensProvider, 'CodeLensResolve', { min: 250, salt: 'resolve' });
            this._resolveCodeLensesScheduler = new async_1.RunOnceScheduler(() => this._resolveCodeLensesInViewport(), this._resolveCodeLensesDebounce.default());
            this._disposables.add(this._editor.onDidChangeModel(() => this._onModelChange()));
            this._disposables.add(this._editor.onDidChangeModelLanguage(() => this._onModelChange()));
            this._disposables.add(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(50 /* EditorOption.fontInfo */) || e.hasChanged(19 /* EditorOption.codeLensFontSize */) || e.hasChanged(18 /* EditorOption.codeLensFontFamily */)) {
                    this._updateLensStyle();
                }
                if (e.hasChanged(17 /* EditorOption.codeLens */)) {
                    this._onModelChange();
                }
            }));
            this._disposables.add(_languageFeaturesService.codeLensProvider.onDidChange(this._onModelChange, this));
            this._onModelChange();
            this._updateLensStyle();
        }
        dispose() {
            this._localDispose();
            this._disposables.dispose();
            this._oldCodeLensModels.dispose();
            this._currentCodeLensModel?.dispose();
        }
        _getLayoutInfo() {
            const lineHeightFactor = Math.max(1.3, this._editor.getOption(67 /* EditorOption.lineHeight */) / this._editor.getOption(52 /* EditorOption.fontSize */));
            let fontSize = this._editor.getOption(19 /* EditorOption.codeLensFontSize */);
            if (!fontSize || fontSize < 5) {
                fontSize = (this._editor.getOption(52 /* EditorOption.fontSize */) * .9) | 0;
            }
            return {
                fontSize,
                codeLensHeight: (fontSize * lineHeightFactor) | 0,
            };
        }
        _updateLensStyle() {
            const { codeLensHeight, fontSize } = this._getLayoutInfo();
            const fontFamily = this._editor.getOption(18 /* EditorOption.codeLensFontFamily */);
            const editorFontInfo = this._editor.getOption(50 /* EditorOption.fontInfo */);
            const { style } = this._editor.getContainerDomNode();
            style.setProperty('--vscode-editorCodeLens-lineHeight', `${codeLensHeight}px`);
            style.setProperty('--vscode-editorCodeLens-fontSize', `${fontSize}px`);
            style.setProperty('--vscode-editorCodeLens-fontFeatureSettings', editorFontInfo.fontFeatureSettings);
            if (fontFamily) {
                style.setProperty('--vscode-editorCodeLens-fontFamily', fontFamily);
                style.setProperty('--vscode-editorCodeLens-fontFamilyDefault', editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily);
            }
            //
            this._editor.changeViewZones(accessor => {
                for (const lens of this._lenses) {
                    lens.updateHeight(codeLensHeight, accessor);
                }
            });
        }
        _localDispose() {
            this._getCodeLensModelPromise?.cancel();
            this._getCodeLensModelPromise = undefined;
            this._resolveCodeLensesPromise?.cancel();
            this._resolveCodeLensesPromise = undefined;
            this._localToDispose.clear();
            this._oldCodeLensModels.clear();
            this._currentCodeLensModel?.dispose();
        }
        _onModelChange() {
            this._localDispose();
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            if (!this._editor.getOption(17 /* EditorOption.codeLens */) || model.isTooLargeForTokenization()) {
                return;
            }
            const cachedLenses = this._codeLensCache.get(model);
            if (cachedLenses) {
                this._renderCodeLensSymbols(cachedLenses);
            }
            if (!this._languageFeaturesService.codeLensProvider.has(model)) {
                // no provider -> return but check with
                // cached lenses. they expire after 30 seconds
                if (cachedLenses) {
                    (0, async_1.disposableTimeout)(() => {
                        const cachedLensesNow = this._codeLensCache.get(model);
                        if (cachedLenses === cachedLensesNow) {
                            this._codeLensCache.delete(model);
                            this._onModelChange();
                        }
                    }, 30 * 1000, this._localToDispose);
                }
                return;
            }
            for (const provider of this._languageFeaturesService.codeLensProvider.all(model)) {
                if (typeof provider.onDidChange === 'function') {
                    const registration = provider.onDidChange(() => scheduler.schedule());
                    this._localToDispose.add(registration);
                }
            }
            const scheduler = new async_1.RunOnceScheduler(() => {
                const t1 = Date.now();
                this._getCodeLensModelPromise?.cancel();
                this._getCodeLensModelPromise = (0, async_1.createCancelablePromise)(token => (0, codelens_1.getCodeLensModel)(this._languageFeaturesService.codeLensProvider, model, token));
                this._getCodeLensModelPromise.then(result => {
                    if (this._currentCodeLensModel) {
                        this._oldCodeLensModels.add(this._currentCodeLensModel);
                    }
                    this._currentCodeLensModel = result;
                    // cache model to reduce flicker
                    this._codeLensCache.put(model, result);
                    // update moving average
                    const newDelay = this._provideCodeLensDebounce.update(model, Date.now() - t1);
                    scheduler.delay = newDelay;
                    // render lenses
                    this._renderCodeLensSymbols(result);
                    // dom.scheduleAtNextAnimationFrame(() => this._resolveCodeLensesInViewport());
                    this._resolveCodeLensesInViewportSoon();
                }, errors_1.onUnexpectedError);
            }, this._provideCodeLensDebounce.get(model));
            this._localToDispose.add(scheduler);
            this._localToDispose.add((0, lifecycle_1.toDisposable)(() => this._resolveCodeLensesScheduler.cancel()));
            this._localToDispose.add(this._editor.onDidChangeModelContent(() => {
                this._editor.changeDecorations(decorationsAccessor => {
                    this._editor.changeViewZones(viewZonesAccessor => {
                        const toDispose = [];
                        let lastLensLineNumber = -1;
                        this._lenses.forEach((lens) => {
                            if (!lens.isValid() || lastLensLineNumber === lens.getLineNumber()) {
                                // invalid -> lens collapsed, attach range doesn't exist anymore
                                // line_number -> lenses should never be on the same line
                                toDispose.push(lens);
                            }
                            else {
                                lens.update(viewZonesAccessor);
                                lastLensLineNumber = lens.getLineNumber();
                            }
                        });
                        const helper = new codelensWidget_1.CodeLensHelper();
                        toDispose.forEach((l) => {
                            l.dispose(helper, viewZonesAccessor);
                            this._lenses.splice(this._lenses.indexOf(l), 1);
                        });
                        helper.commit(decorationsAccessor);
                    });
                });
                // Ask for all references again
                scheduler.schedule();
                // Cancel pending and active resolve requests
                this._resolveCodeLensesScheduler.cancel();
                this._resolveCodeLensesPromise?.cancel();
                this._resolveCodeLensesPromise = undefined;
            }));
            this._localToDispose.add(this._editor.onDidFocusEditorWidget(() => {
                scheduler.schedule();
            }));
            this._localToDispose.add(this._editor.onDidBlurEditorText(() => {
                scheduler.cancel();
            }));
            this._localToDispose.add(this._editor.onDidScrollChange(e => {
                if (e.scrollTopChanged && this._lenses.length > 0) {
                    this._resolveCodeLensesInViewportSoon();
                }
            }));
            this._localToDispose.add(this._editor.onDidLayoutChange(() => {
                this._resolveCodeLensesInViewportSoon();
            }));
            this._localToDispose.add((0, lifecycle_1.toDisposable)(() => {
                if (this._editor.getModel()) {
                    const scrollState = stableEditorScroll_1.StableEditorScrollState.capture(this._editor);
                    this._editor.changeDecorations(decorationsAccessor => {
                        this._editor.changeViewZones(viewZonesAccessor => {
                            this._disposeAllLenses(decorationsAccessor, viewZonesAccessor);
                        });
                    });
                    scrollState.restore(this._editor);
                }
                else {
                    // No accessors available
                    this._disposeAllLenses(undefined, undefined);
                }
            }));
            this._localToDispose.add(this._editor.onMouseDown(e => {
                if (e.target.type !== 9 /* MouseTargetType.CONTENT_WIDGET */) {
                    return;
                }
                let target = e.target.element;
                if (target?.tagName === 'SPAN') {
                    target = target.parentElement;
                }
                if (target?.tagName === 'A') {
                    for (const lens of this._lenses) {
                        const command = lens.getCommand(target);
                        if (command) {
                            this._commandService.executeCommand(command.id, ...(command.arguments || [])).catch(err => this._notificationService.error(err));
                            break;
                        }
                    }
                }
            }));
            scheduler.schedule();
        }
        _disposeAllLenses(decChangeAccessor, viewZoneChangeAccessor) {
            const helper = new codelensWidget_1.CodeLensHelper();
            for (const lens of this._lenses) {
                lens.dispose(helper, viewZoneChangeAccessor);
            }
            if (decChangeAccessor) {
                helper.commit(decChangeAccessor);
            }
            this._lenses.length = 0;
        }
        _renderCodeLensSymbols(symbols) {
            if (!this._editor.hasModel()) {
                return;
            }
            const maxLineNumber = this._editor.getModel().getLineCount();
            const groups = [];
            let lastGroup;
            for (const symbol of symbols.lenses) {
                const line = symbol.symbol.range.startLineNumber;
                if (line < 1 || line > maxLineNumber) {
                    // invalid code lens
                    continue;
                }
                else if (lastGroup && lastGroup[lastGroup.length - 1].symbol.range.startLineNumber === line) {
                    // on same line as previous
                    lastGroup.push(symbol);
                }
                else {
                    // on later line as previous
                    lastGroup = [symbol];
                    groups.push(lastGroup);
                }
            }
            if (!groups.length && !this._lenses.length) {
                // Nothing to change
                return;
            }
            const scrollState = stableEditorScroll_1.StableEditorScrollState.capture(this._editor);
            const layoutInfo = this._getLayoutInfo();
            this._editor.changeDecorations(decorationsAccessor => {
                this._editor.changeViewZones(viewZoneAccessor => {
                    const helper = new codelensWidget_1.CodeLensHelper();
                    let codeLensIndex = 0;
                    let groupsIndex = 0;
                    while (groupsIndex < groups.length && codeLensIndex < this._lenses.length) {
                        const symbolsLineNumber = groups[groupsIndex][0].symbol.range.startLineNumber;
                        const codeLensLineNumber = this._lenses[codeLensIndex].getLineNumber();
                        if (codeLensLineNumber < symbolsLineNumber) {
                            this._lenses[codeLensIndex].dispose(helper, viewZoneAccessor);
                            this._lenses.splice(codeLensIndex, 1);
                        }
                        else if (codeLensLineNumber === symbolsLineNumber) {
                            this._lenses[codeLensIndex].updateCodeLensSymbols(groups[groupsIndex], helper);
                            groupsIndex++;
                            codeLensIndex++;
                        }
                        else {
                            this._lenses.splice(codeLensIndex, 0, new codelensWidget_1.CodeLensWidget(groups[groupsIndex], this._editor, helper, viewZoneAccessor, layoutInfo.codeLensHeight, () => this._resolveCodeLensesInViewportSoon()));
                            codeLensIndex++;
                            groupsIndex++;
                        }
                    }
                    // Delete extra code lenses
                    while (codeLensIndex < this._lenses.length) {
                        this._lenses[codeLensIndex].dispose(helper, viewZoneAccessor);
                        this._lenses.splice(codeLensIndex, 1);
                    }
                    // Create extra symbols
                    while (groupsIndex < groups.length) {
                        this._lenses.push(new codelensWidget_1.CodeLensWidget(groups[groupsIndex], this._editor, helper, viewZoneAccessor, layoutInfo.codeLensHeight, () => this._resolveCodeLensesInViewportSoon()));
                        groupsIndex++;
                    }
                    helper.commit(decorationsAccessor);
                });
            });
            scrollState.restore(this._editor);
        }
        _resolveCodeLensesInViewportSoon() {
            const model = this._editor.getModel();
            if (model) {
                this._resolveCodeLensesScheduler.schedule();
            }
        }
        _resolveCodeLensesInViewport() {
            this._resolveCodeLensesPromise?.cancel();
            this._resolveCodeLensesPromise = undefined;
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            const toResolve = [];
            const lenses = [];
            this._lenses.forEach((lens) => {
                const request = lens.computeIfNecessary(model);
                if (request) {
                    toResolve.push(request);
                    lenses.push(lens);
                }
            });
            if (toResolve.length === 0) {
                return;
            }
            const t1 = Date.now();
            const resolvePromise = (0, async_1.createCancelablePromise)(token => {
                const promises = toResolve.map((request, i) => {
                    const resolvedSymbols = new Array(request.length);
                    const promises = request.map((request, i) => {
                        if (!request.symbol.command && typeof request.provider.resolveCodeLens === 'function') {
                            return Promise.resolve(request.provider.resolveCodeLens(model, request.symbol, token)).then(symbol => {
                                resolvedSymbols[i] = symbol;
                            }, errors_1.onUnexpectedExternalError);
                        }
                        else {
                            resolvedSymbols[i] = request.symbol;
                            return Promise.resolve(undefined);
                        }
                    });
                    return Promise.all(promises).then(() => {
                        if (!token.isCancellationRequested && !lenses[i].isDisposed()) {
                            lenses[i].updateCommands(resolvedSymbols);
                        }
                    });
                });
                return Promise.all(promises);
            });
            this._resolveCodeLensesPromise = resolvePromise;
            this._resolveCodeLensesPromise.then(() => {
                // update moving average
                const newDelay = this._resolveCodeLensesDebounce.update(model, Date.now() - t1);
                this._resolveCodeLensesScheduler.delay = newDelay;
                if (this._currentCodeLensModel) { // update the cached state with new resolved items
                    this._codeLensCache.put(model, this._currentCodeLensModel);
                }
                this._oldCodeLensModels.clear(); // dispose old models once we have updated the UI with the current model
                if (resolvePromise === this._resolveCodeLensesPromise) {
                    this._resolveCodeLensesPromise = undefined;
                }
            }, err => {
                (0, errors_1.onUnexpectedError)(err); // can also be cancellation!
                if (resolvePromise === this._resolveCodeLensesPromise) {
                    this._resolveCodeLensesPromise = undefined;
                }
            });
        }
        async getModel() {
            await this._getCodeLensModelPromise;
            await this._resolveCodeLensesPromise;
            return !this._currentCodeLensModel?.isDisposed
                ? this._currentCodeLensModel
                : undefined;
        }
    };
    exports.CodeLensContribution = CodeLensContribution;
    exports.CodeLensContribution = CodeLensContribution = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(3, commands_1.ICommandService),
        __param(4, notification_1.INotificationService),
        __param(5, codeLensCache_1.ICodeLensCache)
    ], CodeLensContribution);
    (0, editorExtensions_1.registerEditorContribution)(CodeLensContribution.ID, CodeLensContribution, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    (0, editorExtensions_1.registerEditorAction)(class ShowLensesInCurrentLine extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'codelens.showLensesInCurrentLine',
                precondition: editorContextKeys_1.EditorContextKeys.hasCodeLensProvider,
                label: (0, nls_1.localize)('showLensOnLine', "Show CodeLens Commands For Current Line"),
                alias: 'Show CodeLens Commands For Current Line',
            });
        }
        async run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const commandService = accessor.get(commands_1.ICommandService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const lineNumber = editor.getSelection().positionLineNumber;
            const codelensController = editor.getContribution(CodeLensContribution.ID);
            if (!codelensController) {
                return;
            }
            const model = await codelensController.getModel();
            if (!model) {
                // nothing
                return;
            }
            const items = [];
            for (const lens of model.lenses) {
                if (lens.symbol.command && lens.symbol.range.startLineNumber === lineNumber) {
                    items.push({
                        label: lens.symbol.command.title,
                        command: lens.symbol.command
                    });
                }
            }
            if (items.length === 0) {
                // We dont want an empty picker
                return;
            }
            const item = await quickInputService.pick(items, {
                canPickMany: false,
                placeHolder: (0, nls_1.localize)('placeHolder', "Select a command")
            });
            if (!item) {
                // Nothing picked
                return;
            }
            let command = item.command;
            if (model.isDisposed) {
                // try to find the same command again in-case the model has been re-created in the meantime
                // this is a best attempt approach which shouldn't be needed because eager model re-creates
                // shouldn't happen due to focus in/out anymore
                const newModel = await codelensController.getModel();
                const newLens = newModel?.lenses.find(lens => lens.symbol.range.startLineNumber === lineNumber && lens.symbol.command?.title === command.title);
                if (!newLens || !newLens.symbol.command) {
                    return;
                }
                command = newLens.symbol.command;
            }
            try {
                await commandService.executeCommand(command.id, ...(command.arguments || []));
            }
            catch (err) {
                notificationService.error(err);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZWxlbnNDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb2RlbGVucy9icm93c2VyL2NvZGVsZW5zQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QnpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQW9CO2lCQUVoQixPQUFFLEdBQVcscUJBQXFCLEFBQWhDLENBQWlDO1FBZ0JuRCxZQUNrQixPQUFvQixFQUNYLHdCQUFtRSxFQUM1RCxlQUFnRCxFQUNoRSxlQUFpRCxFQUM1QyxvQkFBMkQsRUFDakUsY0FBK0M7WUFMOUMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNNLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFFM0Qsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQzNCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDaEQsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBcEIvQyxpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3JDLG9CQUFlLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFeEMsWUFBTyxHQUFxQixFQUFFLENBQUM7WUFPL0IsdUJBQWtCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFZM0QsSUFBSSxDQUFDLHdCQUF3QixHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNoSSxJQUFJLENBQUMsMEJBQTBCLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFH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