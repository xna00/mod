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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/editor/common/editorContextKeys", "vs/base/common/codicons", "vs/workbench/common/contributions", "vs/workbench/services/editor/common/editorService", "vs/base/common/event", "vs/base/browser/dom", "vs/base/browser/window"], function (require, exports, nls, lifecycle_1, editorExtensions_1, codeEditorService_1, actions_1, contextkey_1, editorContextKeys_1, codicons_1, contributions_1, editorService_1, event_1, dom_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.writeTransientState = writeTransientState;
    exports.readTransientState = readTransientState;
    const transientWordWrapState = 'transientWordWrapState';
    const isWordWrapMinifiedKey = 'isWordWrapMinified';
    const isDominatedByLongLinesKey = 'isDominatedByLongLines';
    const CAN_TOGGLE_WORD_WRAP = new contextkey_1.RawContextKey('canToggleWordWrap', false, true);
    const EDITOR_WORD_WRAP = new contextkey_1.RawContextKey('editorWordWrap', false, nls.localize('editorWordWrap', 'Whether the editor is currently using word wrapping.'));
    /**
     * Store (in memory) the word wrap state for a particular model.
     */
    function writeTransientState(model, state, codeEditorService) {
        codeEditorService.setTransientModelProperty(model, transientWordWrapState, state);
    }
    /**
     * Read (in memory) the word wrap state for a particular model.
     */
    function readTransientState(model, codeEditorService) {
        return codeEditorService.getTransientModelProperty(model, transientWordWrapState);
    }
    const TOGGLE_WORD_WRAP_ID = 'editor.action.toggleWordWrap';
    class ToggleWordWrapAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: TOGGLE_WORD_WRAP_ID,
                label: nls.localize('toggle.wordwrap', "View: Toggle Word Wrap"),
                alias: 'View: Toggle Word Wrap',
                precondition: undefined,
                kbOpts: {
                    kbExpr: null,
                    primary: 512 /* KeyMod.Alt */ | 56 /* KeyCode.KeyZ */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            if (!canToggleWordWrap(codeEditorService, editor)) {
                return;
            }
            const model = editor.getModel();
            // Read the current state
            const transientState = readTransientState(model, codeEditorService);
            // Compute the new state
            let newState;
            if (transientState) {
                newState = null;
            }
            else {
                const actualWrappingInfo = editor.getOption(146 /* EditorOption.wrappingInfo */);
                const wordWrapOverride = (actualWrappingInfo.wrappingColumn === -1 ? 'on' : 'off');
                newState = { wordWrapOverride };
            }
            // Write the new state
            // (this will cause an event and the controller will apply the state)
            writeTransientState(model, newState, codeEditorService);
            // if we are in a diff editor, update the other editor (if possible)
            const diffEditor = findDiffEditorContainingCodeEditor(editor, codeEditorService);
            if (diffEditor) {
                const originalEditor = diffEditor.getOriginalEditor();
                const modifiedEditor = diffEditor.getModifiedEditor();
                const otherEditor = (originalEditor === editor ? modifiedEditor : originalEditor);
                if (canToggleWordWrap(codeEditorService, otherEditor)) {
                    writeTransientState(otherEditor.getModel(), newState, codeEditorService);
                    diffEditor.updateOptions({});
                }
            }
        }
    }
    /**
     * If `editor` is the original or modified editor of a diff editor, it returns it.
     * It returns null otherwise.
     */
    function findDiffEditorContainingCodeEditor(editor, codeEditorService) {
        if (!editor.getOption(61 /* EditorOption.inDiffEditor */)) {
            return null;
        }
        for (const diffEditor of codeEditorService.listDiffEditors()) {
            const originalEditor = diffEditor.getOriginalEditor();
            const modifiedEditor = diffEditor.getModifiedEditor();
            if (originalEditor === editor || modifiedEditor === editor) {
                return diffEditor;
            }
        }
        return null;
    }
    let ToggleWordWrapController = class ToggleWordWrapController extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.toggleWordWrapController'; }
        constructor(_editor, _contextKeyService, _codeEditorService) {
            super();
            this._editor = _editor;
            this._contextKeyService = _contextKeyService;
            this._codeEditorService = _codeEditorService;
            const options = this._editor.getOptions();
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            const isWordWrapMinified = this._contextKeyService.createKey(isWordWrapMinifiedKey, wrappingInfo.isWordWrapMinified);
            const isDominatedByLongLines = this._contextKeyService.createKey(isDominatedByLongLinesKey, wrappingInfo.isDominatedByLongLines);
            let currentlyApplyingEditorConfig = false;
            this._register(_editor.onDidChangeConfiguration((e) => {
                if (!e.hasChanged(146 /* EditorOption.wrappingInfo */)) {
                    return;
                }
                const options = this._editor.getOptions();
                const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
                isWordWrapMinified.set(wrappingInfo.isWordWrapMinified);
                isDominatedByLongLines.set(wrappingInfo.isDominatedByLongLines);
                if (!currentlyApplyingEditorConfig) {
                    // I am not the cause of the word wrap getting changed
                    ensureWordWrapSettings();
                }
            }));
            this._register(_editor.onDidChangeModel((e) => {
                ensureWordWrapSettings();
            }));
            this._register(_codeEditorService.onDidChangeTransientModelProperty(() => {
                ensureWordWrapSettings();
            }));
            const ensureWordWrapSettings = () => {
                if (!canToggleWordWrap(this._codeEditorService, this._editor)) {
                    return;
                }
                const transientState = readTransientState(this._editor.getModel(), this._codeEditorService);
                // Apply the state
                try {
                    currentlyApplyingEditorConfig = true;
                    this._applyWordWrapState(transientState);
                }
                finally {
                    currentlyApplyingEditorConfig = false;
                }
            };
        }
        _applyWordWrapState(state) {
            const wordWrapOverride2 = state ? state.wordWrapOverride : 'inherit';
            this._editor.updateOptions({
                wordWrapOverride2: wordWrapOverride2
            });
        }
    };
    ToggleWordWrapController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, codeEditorService_1.ICodeEditorService)
    ], ToggleWordWrapController);
    let DiffToggleWordWrapController = class DiffToggleWordWrapController extends lifecycle_1.Disposable {
        static { this.ID = 'diffeditor.contrib.toggleWordWrapController'; }
        constructor(_diffEditor, _codeEditorService) {
            super();
            this._diffEditor = _diffEditor;
            this._codeEditorService = _codeEditorService;
            this._register(this._diffEditor.onDidChangeModel(() => {
                this._ensureSyncedWordWrapToggle();
            }));
        }
        _ensureSyncedWordWrapToggle() {
            const originalEditor = this._diffEditor.getOriginalEditor();
            const modifiedEditor = this._diffEditor.getModifiedEditor();
            if (!originalEditor.hasModel() || !modifiedEditor.hasModel()) {
                return;
            }
            const originalTransientState = readTransientState(originalEditor.getModel(), this._codeEditorService);
            const modifiedTransientState = readTransientState(modifiedEditor.getModel(), this._codeEditorService);
            if (originalTransientState && !modifiedTransientState && canToggleWordWrap(this._codeEditorService, originalEditor)) {
                writeTransientState(modifiedEditor.getModel(), originalTransientState, this._codeEditorService);
                this._diffEditor.updateOptions({});
            }
            if (!originalTransientState && modifiedTransientState && canToggleWordWrap(this._codeEditorService, modifiedEditor)) {
                writeTransientState(originalEditor.getModel(), modifiedTransientState, this._codeEditorService);
                this._diffEditor.updateOptions({});
            }
        }
    };
    DiffToggleWordWrapController = __decorate([
        __param(1, codeEditorService_1.ICodeEditorService)
    ], DiffToggleWordWrapController);
    function canToggleWordWrap(codeEditorService, editor) {
        if (!editor) {
            return false;
        }
        if (editor.isSimpleWidget) {
            // in a simple widget...
            return false;
        }
        // Ensure correct word wrap settings
        const model = editor.getModel();
        if (!model) {
            return false;
        }
        if (editor.getOption(61 /* EditorOption.inDiffEditor */)) {
            // this editor belongs to a diff editor
            for (const diffEditor of codeEditorService.listDiffEditors()) {
                if (diffEditor.getOriginalEditor() === editor && !diffEditor.renderSideBySide) {
                    // this editor is the left side of an inline diff editor
                    return false;
                }
            }
        }
        return true;
    }
    let EditorWordWrapContextKeyTracker = class EditorWordWrapContextKeyTracker extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.editorWordWrapContextKeyTracker'; }
        constructor(_editorService, _codeEditorService, _contextService) {
            super();
            this._editorService = _editorService;
            this._codeEditorService = _codeEditorService;
            this._contextService = _contextService;
            this._register(event_1.Event.runAndSubscribe(dom_1.onDidRegisterWindow, ({ window, disposables }) => {
                disposables.add((0, dom_1.addDisposableListener)(window, 'focus', () => this._update(), true));
                disposables.add((0, dom_1.addDisposableListener)(window, 'blur', () => this._update(), true));
            }, { window: window_1.mainWindow, disposables: this._store }));
            this._editorService.onDidActiveEditorChange(() => this._update());
            this._canToggleWordWrap = CAN_TOGGLE_WORD_WRAP.bindTo(this._contextService);
            this._editorWordWrap = EDITOR_WORD_WRAP.bindTo(this._contextService);
            this._activeEditor = null;
            this._activeEditorListener = new lifecycle_1.DisposableStore();
            this._update();
        }
        _update() {
            const activeEditor = this._codeEditorService.getFocusedCodeEditor() || this._codeEditorService.getActiveCodeEditor();
            if (this._activeEditor === activeEditor) {
                // no change
                return;
            }
            this._activeEditorListener.clear();
            this._activeEditor = activeEditor;
            if (activeEditor) {
                this._activeEditorListener.add(activeEditor.onDidChangeModel(() => this._updateFromCodeEditor()));
                this._activeEditorListener.add(activeEditor.onDidChangeConfiguration((e) => {
                    if (e.hasChanged(146 /* EditorOption.wrappingInfo */)) {
                        this._updateFromCodeEditor();
                    }
                }));
                this._updateFromCodeEditor();
            }
        }
        _updateFromCodeEditor() {
            if (!canToggleWordWrap(this._codeEditorService, this._activeEditor)) {
                return this._setValues(false, false);
            }
            else {
                const wrappingInfo = this._activeEditor.getOption(146 /* EditorOption.wrappingInfo */);
                this._setValues(true, wrappingInfo.wrappingColumn !== -1);
            }
        }
        _setValues(canToggleWordWrap, isWordWrap) {
            this._canToggleWordWrap.set(canToggleWordWrap);
            this._editorWordWrap.set(isWordWrap);
        }
    };
    EditorWordWrapContextKeyTracker = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, contextkey_1.IContextKeyService)
    ], EditorWordWrapContextKeyTracker);
    (0, contributions_1.registerWorkbenchContribution2)(EditorWordWrapContextKeyTracker.ID, EditorWordWrapContextKeyTracker, 3 /* WorkbenchPhase.AfterRestored */);
    (0, editorExtensions_1.registerEditorContribution)(ToggleWordWrapController.ID, ToggleWordWrapController, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to change the editor word wrap configuration
    (0, editorExtensions_1.registerDiffEditorContribution)(DiffToggleWordWrapController.ID, DiffToggleWordWrapController);
    (0, editorExtensions_1.registerEditorAction)(ToggleWordWrapAction);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: TOGGLE_WORD_WRAP_ID,
            title: nls.localize('unwrapMinified', "Disable wrapping for this file"),
            icon: codicons_1.Codicon.wordWrap
        },
        group: 'navigation',
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(isDominatedByLongLinesKey), contextkey_1.ContextKeyExpr.has(isWordWrapMinifiedKey))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: TOGGLE_WORD_WRAP_ID,
            title: nls.localize('wrapMinified', "Enable wrapping for this file"),
            icon: codicons_1.Codicon.wordWrap
        },
        group: 'navigation',
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.inDiffEditor.negate(), contextkey_1.ContextKeyExpr.has(isDominatedByLongLinesKey), contextkey_1.ContextKeyExpr.not(isWordWrapMinifiedKey))
    });
    // View menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        command: {
            id: TOGGLE_WORD_WRAP_ID,
            title: nls.localize({ key: 'miToggleWordWrap', comment: ['&& denotes a mnemonic'] }, "&&Word Wrap"),
            toggled: EDITOR_WORD_WRAP,
            precondition: CAN_TOGGLE_WORD_WRAP
        },
        order: 1,
        group: '5_editor'
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlV29yZFdyYXAuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvYnJvd3Nlci90b2dnbGVXb3JkV3JhcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQXNDaEcsa0RBRUM7SUFLRCxnREFFQztJQXpCRCxNQUFNLHNCQUFzQixHQUFHLHdCQUF3QixDQUFDO0lBQ3hELE1BQU0scUJBQXFCLEdBQUcsb0JBQW9CLENBQUM7SUFDbkQsTUFBTSx5QkFBeUIsR0FBRyx3QkFBd0IsQ0FBQztJQUMzRCxNQUFNLG9CQUFvQixHQUFHLElBQUksMEJBQWEsQ0FBVSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUYsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsc0RBQXNELENBQUMsQ0FBQyxDQUFDO0lBU3JLOztPQUVHO0lBQ0gsU0FBZ0IsbUJBQW1CLENBQUMsS0FBaUIsRUFBRSxLQUFxQyxFQUFFLGlCQUFxQztRQUNsSSxpQkFBaUIsQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbkYsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0Isa0JBQWtCLENBQUMsS0FBaUIsRUFBRSxpQkFBcUM7UUFDMUYsT0FBTyxpQkFBaUIsQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztJQUNuRixDQUFDO0lBRUQsTUFBTSxtQkFBbUIsR0FBRyw4QkFBOEIsQ0FBQztJQUMzRCxNQUFNLG9CQUFxQixTQUFRLCtCQUFZO1FBRTlDO1lBQ0MsS0FBSyxD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