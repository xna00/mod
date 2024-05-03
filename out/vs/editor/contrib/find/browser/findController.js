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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/core/editorColorRegistry", "vs/editor/common/editorContextKeys", "vs/editor/common/model", "vs/editor/contrib/find/browser/findModel", "vs/editor/contrib/find/browser/findOptionsWidget", "vs/editor/contrib/find/browser/findState", "vs/editor/contrib/find/browser/findWidget", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService"], function (require, exports, async_1, lifecycle_1, strings, editorExtensions_1, editorColorRegistry_1, editorContextKeys_1, model_1, findModel_1, findOptionsWidget_1, findState_1, findWidget_1, nls, actions_1, clipboardService_1, contextkey_1, contextView_1, keybinding_1, notification_1, quickInput_1, storage_1, themeService_1) {
    "use strict";
    var CommonFindController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartFindReplaceAction = exports.PreviousSelectionMatchFindAction = exports.NextSelectionMatchFindAction = exports.SelectionMatchFindAction = exports.MoveToMatchFindAction = exports.PreviousMatchFindAction = exports.NextMatchFindAction = exports.MatchFindAction = exports.StartFindWithSelectionAction = exports.StartFindWithArgsAction = exports.StartFindAction = exports.FindController = exports.CommonFindController = exports.FindStartFocusAction = void 0;
    exports.getSelectionSearchString = getSelectionSearchString;
    const SEARCH_STRING_MAX_LENGTH = 524288;
    function getSelectionSearchString(editor, seedSearchStringFromSelection = 'single', seedSearchStringFromNonEmptySelection = false) {
        if (!editor.hasModel()) {
            return null;
        }
        const selection = editor.getSelection();
        // if selection spans multiple lines, default search string to empty
        if ((seedSearchStringFromSelection === 'single' && selection.startLineNumber === selection.endLineNumber)
            || seedSearchStringFromSelection === 'multiple') {
            if (selection.isEmpty()) {
                const wordAtPosition = editor.getConfiguredWordAtPosition(selection.getStartPosition());
                if (wordAtPosition && (false === seedSearchStringFromNonEmptySelection)) {
                    return wordAtPosition.word;
                }
            }
            else {
                if (editor.getModel().getValueLengthInRange(selection) < SEARCH_STRING_MAX_LENGTH) {
                    return editor.getModel().getValueInRange(selection);
                }
            }
        }
        return null;
    }
    var FindStartFocusAction;
    (function (FindStartFocusAction) {
        FindStartFocusAction[FindStartFocusAction["NoFocusChange"] = 0] = "NoFocusChange";
        FindStartFocusAction[FindStartFocusAction["FocusFindInput"] = 1] = "FocusFindInput";
        FindStartFocusAction[FindStartFocusAction["FocusReplaceInput"] = 2] = "FocusReplaceInput";
    })(FindStartFocusAction || (exports.FindStartFocusAction = FindStartFocusAction = {}));
    let CommonFindController = class CommonFindController extends lifecycle_1.Disposable {
        static { CommonFindController_1 = this; }
        static { this.ID = 'editor.contrib.findController'; }
        get editor() {
            return this._editor;
        }
        static get(editor) {
            return editor.getContribution(CommonFindController_1.ID);
        }
        constructor(editor, contextKeyService, storageService, clipboardService, notificationService) {
            super();
            this._editor = editor;
            this._findWidgetVisible = findModel_1.CONTEXT_FIND_WIDGET_VISIBLE.bindTo(contextKeyService);
            this._contextKeyService = contextKeyService;
            this._storageService = storageService;
            this._clipboardService = clipboardService;
            this._notificationService = notificationService;
            this._updateHistoryDelayer = new async_1.Delayer(500);
            this._state = this._register(new findState_1.FindReplaceState());
            this.loadQueryState();
            this._register(this._state.onFindReplaceStateChange((e) => this._onStateChanged(e)));
            this._model = null;
            this._register(this._editor.onDidChangeModel(() => {
                const shouldRestartFind = (this._editor.getModel() && this._state.isRevealed);
                this.disposeModel();
                this._state.change({
                    searchScope: null,
                    matchCase: this._storageService.getBoolean('editor.matchCase', 1 /* StorageScope.WORKSPACE */, false),
                    wholeWord: this._storageService.getBoolean('editor.wholeWord', 1 /* StorageScope.WORKSPACE */, false),
                    isRegex: this._storageService.getBoolean('editor.isRegex', 1 /* StorageScope.WORKSPACE */, false),
                    preserveCase: this._storageService.getBoolean('editor.preserveCase', 1 /* StorageScope.WORKSPACE */, false)
                }, false);
                if (shouldRestartFind) {
                    this._start({
                        forceRevealReplace: false,
                        seedSearchStringFromSelection: 'none',
                        seedSearchStringFromNonEmptySelection: false,
                        seedSearchStringFromGlobalClipboard: false,
                        shouldFocus: 0 /* FindStartFocusAction.NoFocusChange */,
                        shouldAnimate: false,
                        updateSearchScope: false,
                        loop: this._editor.getOption(41 /* EditorOption.find */).loop
                    });
                }
            }));
        }
        dispose() {
            this.disposeModel();
            super.dispose();
        }
        disposeModel() {
            if (this._model) {
                this._model.dispose();
                this._model = null;
            }
        }
        _onStateChanged(e) {
            this.saveQueryState(e);
            if (e.isRevealed) {
                if (this._state.isRevealed) {
                    this._findWidgetVisible.set(true);
                }
                else {
                    this._findWidgetVisible.reset();
                    this.disposeModel();
                }
            }
            if (e.searchString) {
                this.setGlobalBufferTerm(this._state.searchString);
            }
        }
        saveQueryState(e) {
            if (e.isRegex) {
                this._storageService.store('editor.isRegex', this._state.actualIsRegex, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            if (e.wholeWord) {
                this._storageService.store('editor.wholeWord', this._state.actualWholeWord, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            if (e.matchCase) {
                this._storageService.store('editor.matchCase', this._state.actualMatchCase, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            if (e.preserveCase) {
                this._storageService.store('editor.preserveCase', this._state.actualPreserveCase, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
        }
        loadQueryState() {
            this._state.change({
                matchCase: this._storageService.getBoolean('editor.matchCase', 1 /* StorageScope.WORKSPACE */, this._state.matchCase),
                wholeWord: this._storageService.getBoolean('editor.wholeWord', 1 /* StorageScope.WORKSPACE */, this._state.wholeWord),
                isRegex: this._storageService.getBoolean('editor.isRegex', 1 /* StorageScope.WORKSPACE */, this._state.isRegex),
                preserveCase: this._storageService.getBoolean('editor.preserveCase', 1 /* StorageScope.WORKSPACE */, this._state.preserveCase)
            }, false);
        }
        isFindInputFocused() {
            return !!findModel_1.CONTEXT_FIND_INPUT_FOCUSED.getValue(this._contextKeyService);
        }
        getState() {
            return this._state;
        }
        closeFindWidget() {
            this._state.change({
                isRevealed: false,
                searchScope: null
            }, false);
            this._editor.focus();
        }
        toggleCaseSensitive() {
            this._state.change({ matchCase: !this._state.matchCase }, false);
            if (!this._state.isRevealed) {
                this.highlightFindOptions();
            }
        }
        toggleWholeWords() {
            this._state.change({ wholeWord: !this._state.wholeWord }, false);
            if (!this._state.isRevealed) {
                this.highlightFindOptions();
            }
        }
        toggleRegex() {
            this._state.change({ isRegex: !this._state.isRegex }, false);
            if (!this._state.isRevealed) {
                this.highlightFindOptions();
            }
        }
        togglePreserveCase() {
            this._state.change({ preserveCase: !this._state.preserveCase }, false);
            if (!this._state.isRevealed) {
                this.highlightFindOptions();
            }
        }
        toggleSearchScope() {
            if (this._state.searchScope) {
                this._state.change({ searchScope: null }, true);
            }
            else {
                if (this._editor.hasModel()) {
                    let selections = this._editor.getSelections();
                    selections = selections.map(selection => {
                        if (selection.endColumn === 1 && selection.endLineNumber > selection.startLineNumber) {
                            selection = selection.setEndPosition(selection.endLineNumber - 1, this._editor.getModel().getLineMaxColumn(selection.endLineNumber - 1));
                        }
                        if (!selection.isEmpty()) {
                            return selection;
                        }
                        return null;
                    }).filter((element) => !!element);
                    if (selections.length) {
                        this._state.change({ searchScope: selections }, true);
                    }
                }
            }
        }
        setSearchString(searchString) {
            if (this._state.isRegex) {
                searchString = strings.escapeRegExpCharacters(searchString);
            }
            this._state.change({ searchString: searchString }, false);
        }
        highlightFindOptions(ignoreWhenVisible = false) {
            // overwritten in subclass
        }
        async _start(opts, newState) {
            this.disposeModel();
            if (!this._editor.hasModel()) {
                // cannot do anything with an editor that doesn't have a model...
                return;
            }
            const stateChanges = {
                ...newState,
                isRevealed: true
            };
            if (opts.seedSearchStringFromSelection === 'single') {
                const selectionSearchString = getSelectionSearchString(this._editor, opts.seedSearchStringFromSelection, opts.seedSearchStringFromNonEmptySelection);
                if (selectionSearchString) {
                    if (this._state.isRegex) {
                        stateChanges.searchString = strings.escapeRegExpCharacters(selectionSearchString);
                    }
                    else {
                        stateChanges.searchString = selectionSearchString;
                    }
                }
            }
            else if (opts.seedSearchStringFromSelection === 'multiple' && !opts.updateSearchScope) {
                const selectionSearchString = getSelectionSearchString(this._editor, opts.seedSearchStringFromSelection);
                if (selectionSearchString) {
                    stateChanges.searchString = selectionSearchString;
                }
            }
            if (!stateChanges.searchString && opts.seedSearchStringFromGlobalClipboard) {
                const selectionSearchString = await this.getGlobalBufferTerm();
                if (!this._editor.hasModel()) {
                    // the editor has lost its model in the meantime
                    return;
                }
                if (selectionSearchString) {
                    stateChanges.searchString = selectionSearchString;
                }
            }
            // Overwrite isReplaceRevealed
            if (opts.forceRevealReplace || stateChanges.isReplaceRevealed) {
                stateChanges.isReplaceRevealed = true;
            }
            else if (!this._findWidgetVisible.get()) {
                stateChanges.isReplaceRevealed = false;
            }
            if (opts.updateSearchScope) {
                const currentSelections = this._editor.getSelections();
                if (currentSelections.some(selection => !selection.isEmpty())) {
                    stateChanges.searchScope = currentSelections;
                }
            }
            stateChanges.loop = opts.loop;
            this._state.change(stateChanges, false);
            if (!this._model) {
                this._model = new findModel_1.FindModelBoundToEditorModel(this._editor, this._state);
            }
        }
        start(opts, newState) {
            return this._start(opts, newState);
        }
        moveToNextMatch() {
            if (this._model) {
                this._model.moveToNextMatch();
                return true;
            }
            return false;
        }
        moveToPrevMatch() {
            if (this._model) {
                this._model.moveToPrevMatch();
                return true;
            }
            return false;
        }
        goToMatch(index) {
            if (this._model) {
                this._model.moveToMatch(index);
                return true;
            }
            return false;
        }
        replace() {
            if (this._model) {
                this._model.replace();
                return true;
            }
            return false;
        }
        replaceAll() {
            if (this._model) {
                if (this._editor.getModel()?.isTooLargeForHeapOperation()) {
                    this._notificationService.warn(nls.localize('too.large.for.replaceall', "The file is too large to perform a replace all operation."));
                    return false;
                }
                this._model.replaceAll();
                return true;
            }
            return false;
        }
        selectAllMatches() {
            if (this._model) {
                this._model.selectAllMatches();
                this._editor.focus();
                return true;
            }
            return false;
        }
        async getGlobalBufferTerm() {
            if (this._editor.getOption(41 /* EditorOption.find */).globalFindClipboard
                && this._editor.hasModel()
                && !this._editor.getModel().isTooLargeForSyncing()) {
                return this._clipboardService.readFindText();
            }
            return '';
        }
        setGlobalBufferTerm(text) {
            if (this._editor.getOption(41 /* EditorOption.find */).globalFindClipboard
                && this._editor.hasModel()
                && !this._editor.getModel().isTooLargeForSyncing()) {
                // intentionally not awaited
                this._clipboardService.writeFindText(text);
            }
        }
    };
    exports.CommonFindController = CommonFindController;
    exports.CommonFindController = CommonFindController = CommonFindController_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, storage_1.IStorageService),
        __param(3, clipboardService_1.IClipboardService),
        __param(4, notification_1.INotificationService)
    ], CommonFindController);
    let FindController = class FindController extends CommonFindController {
        constructor(editor, _contextViewService, _contextKeyService, _keybindingService, _themeService, notificationService, _storageService, clipboardService) {
            super(editor, _contextKeyService, _storageService, clipboardService, notificationService);
            this._contextViewService = _contextViewService;
            this._keybindingService = _keybindingService;
            this._themeService = _themeService;
            this._widget = null;
            this._findOptionsWidget = null;
        }
        async _start(opts, newState) {
            if (!this._widget) {
                this._createFindWidget();
            }
            const selection = this._editor.getSelection();
            let updateSearchScope = false;
            switch (this._editor.getOption(41 /* EditorOption.find */).autoFindInSelection) {
                case 'always':
                    updateSearchScope = true;
                    break;
                case 'never':
                    updateSearchScope = false;
                    break;
                case 'multiline': {
                    const isSelectionMultipleLine = !!selection && selection.startLineNumber !== selection.endLineNumber;
                    updateSearchScope = isSelectionMultipleLine;
                    break;
                }
                default:
                    break;
            }
            opts.updateSearchScope = opts.updateSearchScope || updateSearchScope;
            await super._start(opts, newState);
            if (this._widget) {
                if (opts.shouldFocus === 2 /* FindStartFocusAction.FocusReplaceInput */) {
                    this._widget.focusReplaceInput();
                }
                else if (opts.shouldFocus === 1 /* FindStartFocusAction.FocusFindInput */) {
                    this._widget.focusFindInput();
                }
            }
        }
        highlightFindOptions(ignoreWhenVisible = false) {
            if (!this._widget) {
                this._createFindWidget();
            }
            if (this._state.isRevealed && !ignoreWhenVisible) {
                this._widget.highlightFindOptions();
            }
            else {
                this._findOptionsWidget.highlightFindOptions();
            }
        }
        _createFindWidget() {
            this._widget = this._register(new findWidget_1.FindWidget(this._editor, this, this._state, this._contextViewService, this._keybindingService, this._contextKeyService, this._themeService, this._storageService, this._notificationService));
            this._findOptionsWidget = this._register(new findOptionsWidget_1.FindOptionsWidget(this._editor, this._state, this._keybindingService));
        }
        saveViewState() {
            return this._widget?.getViewState();
        }
        restoreViewState(state) {
            this._widget?.setViewState(state);
        }
    };
    exports.FindController = FindController;
    exports.FindController = FindController = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, themeService_1.IThemeService),
        __param(5, notification_1.INotificationService),
        __param(6, storage_1.IStorageService),
        __param(7, clipboardService_1.IClipboardService)
    ], FindController);
    exports.StartFindAction = (0, editorExtensions_1.registerMultiEditorAction)(new editorExtensions_1.MultiEditorAction({
        id: findModel_1.FIND_IDS.StartFindAction,
        label: nls.localize('startFindAction', "Find"),
        alias: 'Find',
        precondition: contextkey_1.ContextKeyExpr.or(editorContextKeys_1.EditorContextKeys.focus, contextkey_1.ContextKeyExpr.has('editorIsOpen')),
        kbOpts: {
            kbExpr: null,
            primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
            weight: 100 /* KeybindingWeight.EditorContrib */
        },
        menuOpts: {
            menuId: actions_1.MenuId.MenubarEditMenu,
            group: '3_find',
            title: nls.localize({ key: 'miFind', comment: ['&& denotes a mnemonic'] }, "&&Find"),
            order: 1
        }
    }));
    exports.StartFindAction.addImplementation(0, (accessor, editor, args) => {
        const controller = CommonFindController.get(editor);
        if (!controller) {
            return false;
        }
        return controller.start({
            forceRevealReplace: false,
            seedSearchStringFromSelection: editor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection !== 'never' ? 'single' : 'none',
            seedSearchStringFromNonEmptySelection: editor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection === 'selection',
            seedSearchStringFromGlobalClipboard: editor.getOption(41 /* EditorOption.find */).globalFindClipboard,
            shouldFocus: 1 /* FindStartFocusAction.FocusFindInput */,
            shouldAnimate: true,
            updateSearchScope: false,
            loop: editor.getOption(41 /* EditorOption.find */).loop
        });
    });
    const findArgDescription = {
        description: 'Open a new In-Editor Find Widget.',
        args: [{
                name: 'Open a new In-Editor Find Widget args',
                schema: {
                    properties: {
                        searchString: { type: 'string' },
                        replaceString: { type: 'string' },
                        isRegex: { type: 'boolean' },
                        matchWholeWord: { type: 'boolean' },
                        isCaseSensitive: { type: 'boolean' },
                        preserveCase: { type: 'boolean' },
                        findInSelection: { type: 'boolean' },
                    }
                }
            }]
    };
    class StartFindWithArgsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.StartFindWithArgs,
                label: nls.localize('startFindWithArgsAction', "Find With Arguments"),
                alias: 'Find With Arguments',
                precondition: undefined,
                kbOpts: {
                    kbExpr: null,
                    primary: 0,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                metadata: findArgDescription
            });
        }
        async run(accessor, editor, args) {
            const controller = CommonFindController.get(editor);
            if (controller) {
                const newState = args ? {
                    searchString: args.searchString,
                    replaceString: args.replaceString,
                    isReplaceRevealed: args.replaceString !== undefined,
                    isRegex: args.isRegex,
                    // isRegexOverride: args.regexOverride,
                    wholeWord: args.matchWholeWord,
                    // wholeWordOverride: args.wholeWordOverride,
                    matchCase: args.isCaseSensitive,
                    // matchCaseOverride: args.matchCaseOverride,
                    preserveCase: args.preserveCase,
                    // preserveCaseOverride: args.preserveCaseOverride,
                } : {};
                await controller.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: (controller.getState().searchString.length === 0) && editor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection !== 'never' ? 'single' : 'none',
                    seedSearchStringFromNonEmptySelection: editor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection === 'selection',
                    seedSearchStringFromGlobalClipboard: true,
                    shouldFocus: 1 /* FindStartFocusAction.FocusFindInput */,
                    shouldAnimate: true,
                    updateSearchScope: args?.findInSelection || false,
                    loop: editor.getOption(41 /* EditorOption.find */).loop
                }, newState);
                controller.setGlobalBufferTerm(controller.getState().searchString);
            }
        }
    }
    exports.StartFindWithArgsAction = StartFindWithArgsAction;
    class StartFindWithSelectionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.StartFindWithSelection,
                label: nls.localize('startFindWithSelectionAction', "Find With Selection"),
                alias: 'Find With Selection',
                precondition: undefined,
                kbOpts: {
                    kbExpr: null,
                    primary: 0,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 35 /* KeyCode.KeyE */,
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(accessor, editor) {
            const controller = CommonFindController.get(editor);
            if (controller) {
                await controller.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: 'multiple',
                    seedSearchStringFromNonEmptySelection: false,
                    seedSearchStringFromGlobalClipboard: false,
                    shouldFocus: 0 /* FindStartFocusAction.NoFocusChange */,
                    shouldAnimate: true,
                    updateSearchScope: false,
                    loop: editor.getOption(41 /* EditorOption.find */).loop
                });
                controller.setGlobalBufferTerm(controller.getState().searchString);
            }
        }
    }
    exports.StartFindWithSelectionAction = StartFindWithSelectionAction;
    class MatchFindAction extends editorExtensions_1.EditorAction {
        async run(accessor, editor) {
            const controller = CommonFindController.get(editor);
            if (controller && !this._run(controller)) {
                await controller.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: (controller.getState().searchString.length === 0) && editor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection !== 'never' ? 'single' : 'none',
                    seedSearchStringFromNonEmptySelection: editor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection === 'selection',
                    seedSearchStringFromGlobalClipboard: true,
                    shouldFocus: 0 /* FindStartFocusAction.NoFocusChange */,
                    shouldAnimate: true,
                    updateSearchScope: false,
                    loop: editor.getOption(41 /* EditorOption.find */).loop
                });
                this._run(controller);
            }
        }
    }
    exports.MatchFindAction = MatchFindAction;
    class NextMatchFindAction extends MatchFindAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.NextMatchFindAction,
                label: nls.localize('findNextMatchAction', "Find Next"),
                alias: 'Find Next',
                precondition: undefined,
                kbOpts: [{
                        kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                        primary: 61 /* KeyCode.F3 */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */, secondary: [61 /* KeyCode.F3 */] },
                        weight: 100 /* KeybindingWeight.EditorContrib */
                    }, {
                        kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, findModel_1.CONTEXT_FIND_INPUT_FOCUSED),
                        primary: 3 /* KeyCode.Enter */,
                        weight: 100 /* KeybindingWeight.EditorContrib */
                    }]
            });
        }
        _run(controller) {
            const result = controller.moveToNextMatch();
            if (result) {
                controller.editor.pushUndoStop();
                return true;
            }
            return false;
        }
    }
    exports.NextMatchFindAction = NextMatchFindAction;
    class PreviousMatchFindAction extends MatchFindAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.PreviousMatchFindAction,
                label: nls.localize('findPreviousMatchAction', "Find Previous"),
                alias: 'Find Previous',
                precondition: undefined,
                kbOpts: [{
                        kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                        primary: 1024 /* KeyMod.Shift */ | 61 /* KeyCode.F3 */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 37 /* KeyCode.KeyG */, secondary: [1024 /* KeyMod.Shift */ | 61 /* KeyCode.F3 */] },
                        weight: 100 /* KeybindingWeight.EditorContrib */
                    }, {
                        kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, findModel_1.CONTEXT_FIND_INPUT_FOCUSED),
                        primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                        weight: 100 /* KeybindingWeight.EditorContrib */
                    }
                ]
            });
        }
        _run(controller) {
            return controller.moveToPrevMatch();
        }
    }
    exports.PreviousMatchFindAction = PreviousMatchFindAction;
    class MoveToMatchFindAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.GoToMatchFindAction,
                label: nls.localize('findMatchAction.goToMatch', "Go to Match..."),
                alias: 'Go to Match...',
                precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE
            });
            this._highlightDecorations = [];
        }
        run(accessor, editor, args) {
            const controller = CommonFindController.get(editor);
            if (!controller) {
                return;
            }
            const matchesCount = controller.getState().matchesCount;
            if (matchesCount < 1) {
                const notificationService = accessor.get(notification_1.INotificationService);
                notificationService.notify({
                    severity: notification_1.Severity.Warning,
                    message: nls.localize('findMatchAction.noResults', "No matches. Try searching for something else.")
                });
                return;
            }
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const inputBox = quickInputService.createInputBox();
            inputBox.placeholder = nls.localize('findMatchAction.inputPlaceHolder', "Type a number to go to a specific match (between 1 and {0})", matchesCount);
            const toFindMatchIndex = (value) => {
                const index = parseInt(value);
                if (isNaN(index)) {
                    return undefined;
                }
                const matchCount = controller.getState().matchesCount;
                if (index > 0 && index <= matchCount) {
                    return index - 1; // zero based
                }
                else if (index < 0 && index >= -matchCount) {
                    return matchCount + index;
                }
                return undefined;
            };
            const updatePickerAndEditor = (value) => {
                const index = toFindMatchIndex(value);
                if (typeof index === 'number') {
                    // valid
                    inputBox.validationMessage = undefined;
                    controller.goToMatch(index);
                    const currentMatch = controller.getState().currentMatch;
                    if (currentMatch) {
                        this.addDecorations(editor, currentMatch);
                    }
                }
                else {
                    inputBox.validationMessage = nls.localize('findMatchAction.inputValidationMessage', "Please type a number between 1 and {0}", controller.getState().matchesCount);
                    this.clearDecorations(editor);
                }
            };
            inputBox.onDidChangeValue(value => {
                updatePickerAndEditor(value);
            });
            inputBox.onDidAccept(() => {
                const index = toFindMatchIndex(inputBox.value);
                if (typeof index === 'number') {
                    controller.goToMatch(index);
                    inputBox.hide();
                }
                else {
                    inputBox.validationMessage = nls.localize('findMatchAction.inputValidationMessage', "Please type a number between 1 and {0}", controller.getState().matchesCount);
                }
            });
            inputBox.onDidHide(() => {
                this.clearDecorations(editor);
                inputBox.dispose();
            });
            inputBox.show();
        }
        clearDecorations(editor) {
            editor.changeDecorations(changeAccessor => {
                this._highlightDecorations = changeAccessor.deltaDecorations(this._highlightDecorations, []);
            });
        }
        addDecorations(editor, range) {
            editor.changeDecorations(changeAccessor => {
                this._highlightDecorations = changeAccessor.deltaDecorations(this._highlightDecorations, [
                    {
                        range,
                        options: {
                            description: 'find-match-quick-access-range-highlight',
                            className: 'rangeHighlight',
                            isWholeLine: true
                        }
                    },
                    {
                        range,
                        options: {
                            description: 'find-match-quick-access-range-highlight-overview',
                            overviewRuler: {
                                color: (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerRangeHighlight),
                                position: model_1.OverviewRulerLane.Full
                            }
                        }
                    }
                ]);
            });
        }
    }
    exports.MoveToMatchFindAction = MoveToMatchFindAction;
    class SelectionMatchFindAction extends editorExtensions_1.EditorAction {
        async run(accessor, editor) {
            const controller = CommonFindController.get(editor);
            if (!controller) {
                return;
            }
            const selectionSearchString = getSelectionSearchString(editor, 'single', false);
            if (selectionSearchString) {
                controller.setSearchString(selectionSearchString);
            }
            if (!this._run(controller)) {
                await controller.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: 'none',
                    seedSearchStringFromNonEmptySelection: false,
                    seedSearchStringFromGlobalClipboard: false,
                    shouldFocus: 0 /* FindStartFocusAction.NoFocusChange */,
                    shouldAnimate: true,
                    updateSearchScope: false,
                    loop: editor.getOption(41 /* EditorOption.find */).loop
                });
                this._run(controller);
            }
        }
    }
    exports.SelectionMatchFindAction = SelectionMatchFindAction;
    class NextSelectionMatchFindAction extends SelectionMatchFindAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.NextSelectionMatchFindAction,
                label: nls.localize('nextSelectionMatchFindAction', "Find Next Selection"),
                alias: 'Find Next Selection',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 61 /* KeyCode.F3 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _run(controller) {
            return controller.moveToNextMatch();
        }
    }
    exports.NextSelectionMatchFindAction = NextSelectionMatchFindAction;
    class PreviousSelectionMatchFindAction extends SelectionMatchFindAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.PreviousSelectionMatchFindAction,
                label: nls.localize('previousSelectionMatchFindAction', "Find Previous Selection"),
                alias: 'Find Previous Selection',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 61 /* KeyCode.F3 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _run(controller) {
            return controller.moveToPrevMatch();
        }
    }
    exports.PreviousSelectionMatchFindAction = PreviousSelectionMatchFindAction;
    exports.StartFindReplaceAction = (0, editorExtensions_1.registerMultiEditorAction)(new editorExtensions_1.MultiEditorAction({
        id: findModel_1.FIND_IDS.StartFindReplaceAction,
        label: nls.localize('startReplace', "Replace"),
        alias: 'Replace',
        precondition: contextkey_1.ContextKeyExpr.or(editorContextKeys_1.EditorContextKeys.focus, contextkey_1.ContextKeyExpr.has('editorIsOpen')),
        kbOpts: {
            kbExpr: null,
            primary: 2048 /* KeyMod.CtrlCmd */ | 38 /* KeyCode.KeyH */,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */ },
            weight: 100 /* KeybindingWeight.EditorContrib */
        },
        menuOpts: {
            menuId: actions_1.MenuId.MenubarEditMenu,
            group: '3_find',
            title: nls.localize({ key: 'miReplace', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
            order: 2
        }
    }));
    exports.StartFindReplaceAction.addImplementation(0, (accessor, editor, args) => {
        if (!editor.hasModel() || editor.getOption(91 /* EditorOption.readOnly */)) {
            return false;
        }
        const controller = CommonFindController.get(editor);
        if (!controller) {
            return false;
        }
        const currentSelection = editor.getSelection();
        const findInputFocused = controller.isFindInputFocused();
        // we only seed search string from selection when the current selection is single line and not empty,
        // + the find input is not focused
        const seedSearchStringFromSelection = !currentSelection.isEmpty()
            && currentSelection.startLineNumber === currentSelection.endLineNumber
            && (editor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection !== 'never')
            && !findInputFocused;
        /*
        * if the existing search string in find widget is empty and we don't seed search string from selection, it means the Find Input is still empty, so we should focus the Find Input instead of Replace Input.
    
        * findInputFocused true -> seedSearchStringFromSelection false, FocusReplaceInput
        * findInputFocused false, seedSearchStringFromSelection true FocusReplaceInput
        * findInputFocused false seedSearchStringFromSelection false FocusFindInput
        */
        const shouldFocus = (findInputFocused || seedSearchStringFromSelection) ?
            2 /* FindStartFocusAction.FocusReplaceInput */ : 1 /* FindStartFocusAction.FocusFindInput */;
        return controller.start({
            forceRevealReplace: true,
            seedSearchStringFromSelection: seedSearchStringFromSelection ? 'single' : 'none',
            seedSearchStringFromNonEmptySelection: editor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection === 'selection',
            seedSearchStringFromGlobalClipboard: editor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection !== 'never',
            shouldFocus: shouldFocus,
            shouldAnimate: true,
            updateSearchScope: false,
            loop: editor.getOption(41 /* EditorOption.find */).loop
        });
    });
    (0, editorExtensions_1.registerEditorContribution)(CommonFindController.ID, FindController, 0 /* EditorContributionInstantiation.Eager */); // eager because it uses `saveViewState`/`restoreViewState`
    (0, editorExtensions_1.registerEditorAction)(StartFindWithArgsAction);
    (0, editorExtensions_1.registerEditorAction)(StartFindWithSelectionAction);
    (0, editorExtensions_1.registerEditorAction)(NextMatchFindAction);
    (0, editorExtensions_1.registerEditorAction)(PreviousMatchFindAction);
    (0, editorExtensions_1.registerEditorAction)(MoveToMatchFindAction);
    (0, editorExtensions_1.registerEditorAction)(NextSelectionMatchFindAction);
    (0, editorExtensions_1.registerEditorAction)(PreviousSelectionMatchFindAction);
    const FindCommand = editorExtensions_1.EditorCommand.bindToContribution(CommonFindController.get);
    (0, editorExtensions_1.registerEditorCommand)(new FindCommand({
        id: findModel_1.FIND_IDS.CloseFindWidgetCommand,
        precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE,
        handler: x => x.closeFindWidget(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 5,
            kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, contextkey_1.ContextKeyExpr.not('isComposing')),
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new FindCommand({
        id: findModel_1.FIND_IDS.ToggleCaseSensitiveCommand,
        precondition: undefined,
        handler: x => x.toggleCaseSensitive(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: findModel_1.ToggleCaseSensitiveKeybinding.primary,
            mac: findModel_1.ToggleCaseSensitiveKeybinding.mac,
            win: findModel_1.ToggleCaseSensitiveKeybinding.win,
            linux: findModel_1.ToggleCaseSensitiveKeybinding.linux
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new FindCommand({
        id: findModel_1.FIND_IDS.ToggleWholeWordCommand,
        precondition: undefined,
        handler: x => x.toggleWholeWords(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: findModel_1.ToggleWholeWordKeybinding.primary,
            mac: findModel_1.ToggleWholeWordKeybinding.mac,
            win: findModel_1.ToggleWholeWordKeybinding.win,
            linux: findModel_1.ToggleWholeWordKeybinding.linux
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new FindCommand({
        id: findModel_1.FIND_IDS.ToggleRegexCommand,
        precondition: undefined,
        handler: x => x.toggleRegex(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: findModel_1.ToggleRegexKeybinding.primary,
            mac: findModel_1.ToggleRegexKeybinding.mac,
            win: findModel_1.ToggleRegexKeybinding.win,
            linux: findModel_1.ToggleRegexKeybinding.linux
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new FindCommand({
        id: findModel_1.FIND_IDS.ToggleSearchScopeCommand,
        precondition: undefined,
        handler: x => x.toggleSearchScope(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: findModel_1.ToggleSearchScopeKeybinding.primary,
            mac: findModel_1.ToggleSearchScopeKeybinding.mac,
            win: findModel_1.ToggleSearchScopeKeybinding.win,
            linux: findModel_1.ToggleSearchScopeKeybinding.linux
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new FindCommand({
        id: findModel_1.FIND_IDS.TogglePreserveCaseCommand,
        precondition: undefined,
        handler: x => x.togglePreserveCase(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: findModel_1.TogglePreserveCaseKeybinding.primary,
            mac: findModel_1.TogglePreserveCaseKeybinding.mac,
            win: findModel_1.TogglePreserveCaseKeybinding.win,
            linux: findModel_1.TogglePreserveCaseKeybinding.linux
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new FindCommand({
        id: findModel_1.FIND_IDS.ReplaceOneAction,
        precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE,
        handler: x => x.replace(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 22 /* KeyCode.Digit1 */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new FindCommand({
        id: findModel_1.FIND_IDS.ReplaceOneAction,
        precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE,
        handler: x => x.replace(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 5,
            kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, findModel_1.CONTEXT_REPLACE_INPUT_FOCUSED),
            primary: 3 /* KeyCode.Enter */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new FindCommand({
        id: findModel_1.FIND_IDS.ReplaceAllAction,
        precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE,
        handler: x => x.replaceAll(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new FindCommand({
        id: findModel_1.FIND_IDS.ReplaceAllAction,
        precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE,
        handler: x => x.replaceAll(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 5,
            kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, findModel_1.CONTEXT_REPLACE_INPUT_FOCUSED),
            primary: undefined,
            mac: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
            }
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new FindCommand({
        id: findModel_1.FIND_IDS.SelectAllMatchesAction,
        precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE,
        handler: x => x.selectAllMatches(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */
        }
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZENvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2ZpbmQvYnJvd3Nlci9maW5kQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBaUNoRyw0REF1QkM7SUF6QkQsTUFBTSx3QkFBd0IsR0FBRyxNQUFNLENBQUM7SUFFeEMsU0FBZ0Isd0JBQXdCLENBQUMsTUFBbUIsRUFBRSxnQ0FBdUQsUUFBUSxFQUFFLHdDQUFpRCxLQUFLO1FBQ3BMLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztZQUN4QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDeEMsb0VBQW9FO1FBRXBFLElBQUksQ0FBQyw2QkFBNkIsS0FBSyxRQUFRLElBQUksU0FBUyxDQUFDLGVBQWUsS0FBSyxTQUFTLENBQUMsYUFBYSxDQUFDO2VBQ3JHLDZCQUE2QixLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQ2xELElBQUksU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7Z0JBQ3pCLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RixJQUFJLGNBQWMsSUFBSSxDQUFDLEtBQUssS0FBSyxxQ0FBcUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3pFLE9BQU8sY0FBYyxDQUFDLElBQUksQ0FBQztnQkFDNUIsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsR0FBRyx3QkFBd0IsRUFBRSxD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