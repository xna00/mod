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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/resolverService", "vs/editor/common/services/editorWorker", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/scm/common/scm", "vs/editor/common/model/textModel", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/contrib/peekView/browser/peekView", "vs/platform/contextkey/common/contextkey", "vs/editor/common/editorContextKeys", "vs/editor/common/core/position", "vs/base/common/numbers", "vs/platform/keybinding/common/keybindingsRegistry", "vs/editor/browser/widget/diffEditor/embeddedDiffEditorWidget", "vs/base/common/actions", "vs/platform/keybinding/common/keybinding", "vs/base/common/resources", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/editor/common/model", "vs/base/common/arrays", "vs/editor/browser/services/codeEditorService", "vs/base/browser/dom", "vs/workbench/services/textfile/common/textfiles", "vs/platform/theme/common/iconRegistry", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/errors", "vs/workbench/common/contextkeys", "vs/platform/progress/common/progress", "vs/base/common/color", "vs/base/common/map", "vs/workbench/services/editor/common/editorService", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/accessibility/common/accessibility", "vs/workbench/contrib/scm/common/quickDiff", "vs/workbench/contrib/scm/browser/dirtyDiffSwitcher", "vs/css!./media/dirtydiffDecorator"], function (require, exports, nls, async_1, lifecycle_1, event_1, instantiation_1, resolverService_1, editorWorker_1, configuration_1, scm_1, textModel_1, themeService_1, colorRegistry_1, editorBrowser_1, editorExtensions_1, peekView_1, contextkey_1, editorContextKeys_1, position_1, numbers_1, keybindingsRegistry_1, embeddedDiffEditorWidget_1, actions_1, keybinding_1, resources_1, actions_2, menuEntryActionViewItem_1, model_1, arrays_1, codeEditorService_1, dom, textfiles_1, iconRegistry_1, codicons_1, themables_1, errors_1, contextkeys_1, progress_1, color_1, map_1, editorService_1, accessibilitySignalService_1, accessibility_1, quickDiff_1, dirtyDiffSwitcher_1) {
    "use strict";
    var DirtyDiffController_1, DirtyDiffDecorator_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DirtyDiffWorkbenchController = exports.DirtyDiffModel = exports.DirtyDiffController = exports.GotoNextChangeAction = exports.GotoPreviousChangeAction = exports.ShowNextChangeAction = exports.ShowPreviousChangeAction = exports.isDirtyDiffVisible = void 0;
    exports.getOriginalResource = getOriginalResource;
    class DiffActionRunner extends actions_1.ActionRunner {
        runAction(action, context) {
            if (action instanceof actions_2.MenuItemAction) {
                return action.run(...context);
            }
            return super.runAction(action, context);
        }
    }
    exports.isDirtyDiffVisible = new contextkey_1.RawContextKey('dirtyDiffVisible', false);
    function getChangeHeight(change) {
        const modified = change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;
        const original = change.originalEndLineNumber - change.originalStartLineNumber + 1;
        if (change.originalEndLineNumber === 0) {
            return modified;
        }
        else if (change.modifiedEndLineNumber === 0) {
            return original;
        }
        else {
            return modified + original;
        }
    }
    function getModifiedEndLineNumber(change) {
        if (change.modifiedEndLineNumber === 0) {
            return change.modifiedStartLineNumber === 0 ? 1 : change.modifiedStartLineNumber;
        }
        else {
            return change.modifiedEndLineNumber;
        }
    }
    function lineIntersectsChange(lineNumber, change) {
        // deletion at the beginning of the file
        if (lineNumber === 1 && change.modifiedStartLineNumber === 0 && change.modifiedEndLineNumber === 0) {
            return true;
        }
        return lineNumber >= change.modifiedStartLineNumber && lineNumber <= (change.modifiedEndLineNumber || change.modifiedStartLineNumber);
    }
    let UIEditorAction = class UIEditorAction extends actions_1.Action {
        constructor(editor, action, cssClass, keybindingService, instantiationService) {
            const keybinding = keybindingService.lookupKeybinding(action.id);
            const label = action.label + (keybinding ? ` (${keybinding.getLabel()})` : '');
            super(action.id, label, cssClass);
            this.instantiationService = instantiationService;
            this.action = action;
            this.editor = editor;
        }
        run() {
            return Promise.resolve(this.instantiationService.invokeFunction(accessor => this.action.run(accessor, this.editor, null)));
        }
    };
    UIEditorAction = __decorate([
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService)
    ], UIEditorAction);
    var ChangeType;
    (function (ChangeType) {
        ChangeType[ChangeType["Modify"] = 0] = "Modify";
        ChangeType[ChangeType["Add"] = 1] = "Add";
        ChangeType[ChangeType["Delete"] = 2] = "Delete";
    })(ChangeType || (ChangeType = {}));
    function getChangeType(change) {
        if (change.originalEndLineNumber === 0) {
            return ChangeType.Add;
        }
        else if (change.modifiedEndLineNumber === 0) {
            return ChangeType.Delete;
        }
        else {
            return ChangeType.Modify;
        }
    }
    function getChangeTypeColor(theme, changeType) {
        switch (changeType) {
            case ChangeType.Modify: return theme.getColor(editorGutterModifiedBackground);
            case ChangeType.Add: return theme.getColor(editorGutterAddedBackground);
            case ChangeType.Delete: return theme.getColor(editorGutterDeletedBackground);
        }
    }
    function getOuterEditorFromDiffEditor(accessor) {
        const diffEditors = accessor.get(codeEditorService_1.ICodeEditorService).listDiffEditors();
        for (const diffEditor of diffEditors) {
            if (diffEditor.hasTextFocus() && diffEditor instanceof embeddedDiffEditorWidget_1.EmbeddedDiffEditorWidget) {
                return diffEditor.getParentEditor();
            }
        }
        return (0, peekView_1.getOuterEditor)(accessor);
    }
    let DirtyDiffWidget = class DirtyDiffWidget extends peekView_1.PeekViewWidget {
        constructor(editor, model, themeService, instantiationService, menuService, contextKeyService) {
            super(editor, { isResizeable: true, frameWidth: 1, keepEditorSelection: true, className: 'dirty-diff' }, instantiationService);
            this.model = model;
            this.themeService = themeService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this._index = 0;
            this._provider = '';
            this.height = undefined;
            this._disposables.add(themeService.onDidColorThemeChange(this._applyTheme, this));
            this._applyTheme(themeService.getColorTheme());
            if (this.model.original.length > 0) {
                contextKeyService = contextKeyService.createOverlay([['originalResourceScheme', this.model.original[0].uri.scheme], ['originalResourceSchemes', this.model.original.map(original => original.uri.scheme)]]);
            }
            this.create();
            if (editor.hasModel()) {
                this.title = (0, resources_1.basename)(editor.getModel().uri);
            }
            else {
                this.title = '';
            }
            this.setTitle(this.title);
        }
        get provider() {
            return this._provider;
        }
        get index() {
            return this._index;
        }
        get visibleRange() {
            const visibleRanges = this.diffEditor.getModifiedEditor().getVisibleRanges();
            return visibleRanges.length >= 0 ? visibleRanges[0] : undefined;
        }
        showChange(index, usePosition = true) {
            const labeledChange = this.model.changes[index];
            const change = labeledChange.change;
            this._index = index;
            this.contextKeyService.createKey('originalResourceScheme', this.model.changes[index].uri.scheme);
            this.updateActions();
            this._provider = labeledChange.label;
            this.change = change;
            const originalModel = this.model.original;
            if (!originalModel) {
                return;
            }
            const onFirstDiffUpdate = event_1.Event.once(this.diffEditor.onDidUpdateDiff);
            // TODO@joao TODO@alex need this setTimeout probably because the
            // non-side-by-side diff still hasn't created the view zones
            onFirstDiffUpdate(() => setTimeout(() => this.revealChange(change), 0));
            const diffEditorModel = this.model.getDiffEditorModel(labeledChange.uri.toString());
            if (!diffEditorModel) {
                return;
            }
            this.diffEditor.setModel(diffEditorModel);
            this.dropdown?.setSelection(labeledChange.label);
            const position = new position_1.Position(getModifiedEndLineNumber(change), 1);
            const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
            const editorHeight = this.editor.getLayoutInfo().height;
            const editorHeightInLines = Math.floor(editorHeight / lineHeight);
            const height = Math.min(getChangeHeight(change) + /* padding */ 8, Math.floor(editorHeightInLines / 3));
            this.renderTitle(labeledChange.label);
            const changeType = getChangeType(change);
            const changeTypeColor = getChangeTypeColor(this.themeService.getColorTheme(), changeType);
            this.style({ frameColor: changeTypeColor, arrowColor: changeTypeColor });
            const providerSpecificChanges = [];
            let contextIndex = index;
            for (const change of this.model.changes) {
                if (change.label === this.model.changes[this._index].label) {
                    providerSpecificChanges.push(change.change);
                    if (labeledChange === change) {
                        contextIndex = providerSpecificChanges.length - 1;
                    }
                }
            }
            this._actionbarWidget.context = [diffEditorModel.modified.uri, providerSpecificChanges, contextIndex];
            if (usePosition) {
                this.show(position, height);
                this.editor.setPosition(position);
                this.editor.focus();
            }
        }
        renderTitle(label) {
            const providerChanges = this.model.mapChanges.get(label);
            const providerIndex = providerChanges.indexOf(this._index);
            let detail;
            if (!this.shouldUseDropdown()) {
                detail = this.model.changes.length > 1
                    ? nls.localize('changes', "{0} - {1} of {2} changes", label, providerIndex + 1, providerChanges.length)
                    : nls.localize('change', "{0} - {1} of {2} change", label, providerIndex + 1, providerChanges.length);
                this.dropdownContainer.style.display = 'none';
            }
            else {
                detail = this.model.changes.length > 1
                    ? nls.localize('multiChanges', "{0} of {1} changes", providerIndex + 1, providerChanges.length)
                    : nls.localize('multiChange', "{0} of {1} change", providerIndex + 1, providerChanges.length);
                this.dropdownContainer.style.display = 'inherit';
            }
            this.setTitle(this.title, detail);
        }
        switchQuickDiff(event) {
            const newProvider = event?.provider;
            if (newProvider === this.model.changes[this._index].label) {
                return;
            }
            let closestGreaterIndex = this._index < this.model.changes.length - 1 ? this._index + 1 : 0;
            for (let i = closestGreaterIndex; i !== this._index; i < this.model.changes.length - 1 ? i++ : i = 0) {
                if (this.model.changes[i].label === newProvider) {
                    closestGreaterIndex = i;
                    break;
                }
            }
            let closestLesserIndex = this._index > 0 ? this._index - 1 : this.model.changes.length - 1;
            for (let i = closestLesserIndex; i !== this._index; i >= 0 ? i-- : i = this.model.changes.length - 1) {
                if (this.model.changes[i].label === newProvider) {
                    closestLesserIndex = i;
                    break;
                }
            }
            const closestIndex = Math.abs(this.model.changes[closestGreaterIndex].change.modifiedEndLineNumber - this.model.changes[this._index].change.modifiedEndLineNumber)
                < Math.abs(this.model.changes[closestLesserIndex].change.modifiedEndLineNumber - this.model.changes[this._index].change.modifiedEndLineNumber)
                ? closestGreaterIndex : closestLesserIndex;
            this.showChange(closestIndex, false);
        }
        shouldUseDropdown() {
            let providersWithChangesCount = 0;
            if (this.model.mapChanges.size > 1) {
                const keys = Array.from(this.model.mapChanges.keys());
                for (let i = 0; (i < keys.length) && (providersWithChangesCount <= 1); i++) {
                    if (this.model.mapChanges.get(keys[i]).length > 0) {
                        providersWithChangesCount++;
                    }
                }
            }
            return providersWithChangesCount >= 2;
        }
        updateActions() {
            if (!this._actionbarWidget) {
                return;
            }
            const previous = this.instantiationService.createInstance(UIEditorAction, this.editor, new ShowPreviousChangeAction(this.editor), themables_1.ThemeIcon.asClassName(iconRegistry_1.gotoPreviousLocation));
            const next = this.instantiationService.createInstance(UIEditorAction, this.editor, new ShowNextChangeAction(this.editor), themables_1.ThemeIcon.asClassName(iconRegistry_1.gotoNextLocation));
            this._disposables.add(previous);
            this._disposables.add(next);
            const actions = [];
            if (this.menu) {
                this.menu.dispose();
            }
            this.menu = this.menuService.createMenu(actions_2.MenuId.SCMChangeContext, this.contextKeyService);
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, { shouldForwardArgs: true }, actions);
            this._actionbarWidget.clear();
            this._actionbarWidget.push(actions.reverse(), { label: false, icon: true });
            this._actionbarWidget.push([next, previous], { label: false, icon: true });
            this._actionbarWidget.push(new actions_1.Action('peekview.close', nls.localize('label.close', "Close"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.close), true, () => this.dispose()), { label: false, icon: true });
        }
        _fillHead(container) {
            super._fillHead(container, true);
            this.dropdownContainer = dom.prepend(this._titleElement, dom.$('.dropdown'));
            this.dropdown = this.instantiationService.createInstance(dirtyDiffSwitcher_1.SwitchQuickDiffViewItem, new dirtyDiffSwitcher_1.SwitchQuickDiffBaseAction((event) => this.switchQuickDiff(event)), this.model.quickDiffs.map(quickDiffer => quickDiffer.label), this.model.changes[this._index].label);
            this.dropdown.render(this.dropdownContainer);
            this.updateActions();
        }
        _getActionBarOptions() {
            const actionRunner = new DiffActionRunner();
            // close widget on successful action
            actionRunner.onDidRun(e => {
                if (!(e.action instanceof UIEditorAction) && !e.error) {
                    this.dispose();
                }
            });
            return {
                ...super._getActionBarOptions(),
                actionRunner
            };
        }
        _fillBody(container) {
            const options = {
                scrollBeyondLastLine: true,
                scrollbar: {
                    verticalScrollbarSize: 14,
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false
                },
                overviewRulerLanes: 2,
                fixedOverflowWidgets: true,
                minimap: { enabled: false },
                renderSideBySide: false,
                readOnly: false,
                renderIndicators: false,
                diffAlgorithm: 'advanced',
                ignoreTrimWhitespace: false,
                stickyScroll: { enabled: false }
            };
            this.diffEditor = this.instantiationService.createInstance(embeddedDiffEditorWidget_1.EmbeddedDiffEditorWidget, container, options, {}, this.editor);
            this._disposables.add(this.diffEditor);
        }
        _onWidth(width) {
            if (typeof this.height === 'undefined') {
                return;
            }
            this.diffEditor.layout({ height: this.height, width });
        }
        _doLayoutBody(height, width) {
            super._doLayoutBody(height, width);
            this.diffEditor.layout({ height, width });
            if (typeof this.height === 'undefined' && this.change) {
                this.revealChange(this.change);
            }
            this.height = height;
        }
        revealChange(change) {
            let start, end;
            if (change.modifiedEndLineNumber === 0) { // deletion
                start = change.modifiedStartLineNumber;
                end = change.modifiedStartLineNumber + 1;
            }
            else if (change.originalEndLineNumber > 0) { // modification
                start = change.modifiedStartLineNumber - 1;
                end = change.modifiedEndLineNumber + 1;
            }
            else { // insertion
                start = change.modifiedStartLineNumber;
                end = change.modifiedEndLineNumber;
            }
            this.diffEditor.revealLinesInCenter(start, end, 1 /* ScrollType.Immediate */);
        }
        _applyTheme(theme) {
            const borderColor = theme.getColor(peekView_1.peekViewBorder) || color_1.Color.transparent;
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor,
                headerBackgroundColor: theme.getColor(peekView_1.peekViewTitleBackground) || color_1.Color.transparent,
                primaryHeadingColor: theme.getColor(peekView_1.peekViewTitleForeground),
                secondaryHeadingColor: theme.getColor(peekView_1.peekViewTitleInfoForeground)
            });
        }
        revealRange(range) {
            this.editor.revealLineInCenterIfOutsideViewport(range.endLineNumber, 0 /* ScrollType.Smooth */);
        }
        hasFocus() {
            return this.diffEditor.hasTextFocus();
        }
        dispose() {
            super.dispose();
            this.menu?.dispose();
        }
    };
    DirtyDiffWidget = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, actions_2.IMenuService),
        __param(5, contextkey_1.IContextKeyService)
    ], DirtyDiffWidget);
    class ShowPreviousChangeAction extends editorExtensions_1.EditorAction {
        constructor(outerEditor) {
            super({
                id: 'editor.action.dirtydiff.previous',
                label: nls.localize('show previous change', "Show Previous Change"),
                alias: 'Show Previous Change',
                precondition: contextkeys_1.TextCompareEditorActiveContext.toNegated(),
                kbOpts: { kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus, primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 61 /* KeyCode.F3 */, weight: 100 /* KeybindingWeight.EditorContrib */ }
            });
            this.outerEditor = outerEditor;
        }
        run(accessor) {
            const outerEditor = this.outerEditor ?? getOuterEditorFromDiffEditor(accessor);
            if (!outerEditor) {
                return;
            }
            const controller = DirtyDiffController.get(outerEditor);
            if (!controller) {
                return;
            }
            if (!controller.canNavigate()) {
                return;
            }
            controller.previous();
        }
    }
    exports.ShowPreviousChangeAction = ShowPreviousChangeAction;
    (0, editorExtensions_1.registerEditorAction)(ShowPreviousChangeAction);
    class ShowNextChangeAction extends editorExtensions_1.EditorAction {
        constructor(outerEditor) {
            super({
                id: 'editor.action.dirtydiff.next',
                label: nls.localize('show next change', "Show Next Change"),
                alias: 'Show Next Change',
                precondition: contextkeys_1.TextCompareEditorActiveContext.toNegated(),
                kbOpts: { kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus, primary: 512 /* KeyMod.Alt */ | 61 /* KeyCode.F3 */, weight: 100 /* KeybindingWeight.EditorContrib */ }
            });
            this.outerEditor = outerEditor;
        }
        run(accessor) {
            const outerEditor = this.outerEditor ?? getOuterEditorFromDiffEditor(accessor);
            if (!outerEditor) {
                return;
            }
            const controller = DirtyDiffController.get(outerEditor);
            if (!controller) {
                return;
            }
            if (!controller.canNavigate()) {
                return;
            }
            controller.next();
        }
    }
    exports.ShowNextChangeAction = ShowNextChangeAction;
    (0, editorExtensions_1.registerEditorAction)(ShowNextChangeAction);
    // Go to menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '7_change_nav',
        command: {
            id: 'editor.action.dirtydiff.next',
            title: nls.localize({ key: 'miGotoNextChange', comment: ['&& denotes a mnemonic'] }, "Next &&Change")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '7_change_nav',
        command: {
            id: 'editor.action.dirtydiff.previous',
            title: nls.localize({ key: 'miGotoPreviousChange', comment: ['&& denotes a mnemonic'] }, "Previous &&Change")
        },
        order: 2
    });
    class GotoPreviousChangeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'workbench.action.editor.previousChange',
                label: nls.localize('move to previous change', "Go to Previous Change"),
                alias: 'Go to Previous Change',
                precondition: contextkeys_1.TextCompareEditorActiveContext.toNegated(),
                kbOpts: { kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus, primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 63 /* KeyCode.F5 */, weight: 100 /* KeybindingWeight.EditorContrib */ }
            });
        }
        async run(accessor) {
            const outerEditor = getOuterEditorFromDiffEditor(accessor);
            const accessibilitySignalService = accessor.get(accessibilitySignalService_1.IAccessibilitySignalService);
            const accessibilityService = accessor.get(accessibility_1.IAccessibilityService);
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            if (!outerEditor || !outerEditor.hasModel()) {
                return;
            }
            const controller = DirtyDiffController.get(outerEditor);
            if (!controller || !controller.modelRegistry) {
                return;
            }
            const lineNumber = outerEditor.getPosition().lineNumber;
            const model = controller.modelRegistry.getModel(outerEditor.getModel(), outerEditor);
            if (!model || model.changes.length === 0) {
                return;
            }
            const index = model.findPreviousClosestChange(lineNumber, false);
            const change = model.changes[index];
            await playAccessibilitySymbolForChange(change.change, accessibilitySignalService);
            setPositionAndSelection(change.change, outerEditor, accessibilityService, codeEditorService);
        }
    }
    exports.GotoPreviousChangeAction = GotoPreviousChangeAction;
    (0, editorExtensions_1.registerEditorAction)(GotoPreviousChangeAction);
    class GotoNextChangeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'workbench.action.editor.nextChange',
                label: nls.localize('move to next change', "Go to Next Change"),
                alias: 'Go to Next Change',
                precondition: contextkeys_1.TextCompareEditorActiveContext.toNegated(),
                kbOpts: { kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus, primary: 512 /* KeyMod.Alt */ | 63 /* KeyCode.F5 */, weight: 100 /* KeybindingWeight.EditorContrib */ }
            });
        }
        async run(accessor) {
            const accessibilitySignalService = accessor.get(accessibilitySignalService_1.IAccessibilitySignalService);
            const outerEditor = getOuterEditorFromDiffEditor(accessor);
            const accessibilityService = accessor.get(accessibility_1.IAccessibilityService);
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            if (!outerEditor || !outerEditor.hasModel()) {
                return;
            }
            const controller = DirtyDiffController.get(outerEditor);
            if (!controller || !controller.modelRegistry) {
                return;
            }
            const lineNumber = outerEditor.getPosition().lineNumber;
            const model = controller.modelRegistry.getModel(outerEditor.getModel(), outerEditor);
            if (!model || model.changes.length === 0) {
                return;
            }
            const index = model.findNextClosestChange(lineNumber, false);
            const change = model.changes[index].change;
            await playAccessibilitySymbolForChange(change, accessibilitySignalService);
            setPositionAndSelection(change, outerEditor, accessibilityService, codeEditorService);
        }
    }
    exports.GotoNextChangeAction = GotoNextChangeAction;
    function setPositionAndSelection(change, editor, accessibilityService, codeEditorService) {
        const position = new position_1.Position(change.modifiedStartLineNumber, 1);
        editor.setPosition(position);
        editor.revealPositionInCenter(position);
        if (accessibilityService.isScreenReaderOptimized()) {
            editor.setSelection({ startLineNumber: change.modifiedStartLineNumber, startColumn: 0, endLineNumber: change.modifiedStartLineNumber, endColumn: Number.MAX_VALUE });
            codeEditorService.getActiveCodeEditor()?.writeScreenReaderContent('diff-navigation');
        }
    }
    async function playAccessibilitySymbolForChange(change, accessibilitySignalService) {
        const changeType = getChangeType(change);
        switch (changeType) {
            case ChangeType.Add:
                accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineInserted, { allowManyInParallel: true, source: 'dirtyDiffDecoration' });
                break;
            case ChangeType.Delete:
                accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineDeleted, { allowManyInParallel: true, source: 'dirtyDiffDecoration' });
                break;
            case ChangeType.Modify:
                accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.diffLineModified, { allowManyInParallel: true, source: 'dirtyDiffDecoration' });
                break;
        }
    }
    (0, editorExtensions_1.registerEditorAction)(GotoNextChangeAction);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'closeDirtyDiff',
        weight: 100 /* KeybindingWeight.EditorContrib */ + 50,
        primary: 9 /* KeyCode.Escape */,
        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
        when: contextkey_1.ContextKeyExpr.and(exports.isDirtyDiffVisible),
        handler: (accessor) => {
            const outerEditor = getOuterEditorFromDiffEditor(accessor);
            if (!outerEditor) {
                return;
            }
            const controller = DirtyDiffController.get(outerEditor);
            if (!controller) {
                return;
            }
            controller.close();
        }
    });
    let DirtyDiffController = class DirtyDiffController extends lifecycle_1.Disposable {
        static { DirtyDiffController_1 = this; }
        static { this.ID = 'editor.contrib.dirtydiff'; }
        static get(editor) {
            return editor.getContribution(DirtyDiffController_1.ID);
        }
        constructor(editor, contextKeyService, configurationService, instantiationService) {
            super();
            this.editor = editor;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.modelRegistry = null;
            this.model = null;
            this.widget = null;
            this.session = lifecycle_1.Disposable.None;
            this.mouseDownInfo = null;
            this.enabled = false;
            this.gutterActionDisposables = new lifecycle_1.DisposableStore();
            this.enabled = !contextKeyService.getContextKeyValue('isInDiffEditor');
            this.stylesheet = dom.createStyleSheet(undefined, undefined, this._store);
            if (this.enabled) {
                this.isDirtyDiffVisible = exports.isDirtyDiffVisible.bindTo(contextKeyService);
                this._register(editor.onDidChangeModel(() => this.close()));
                const onDidChangeGutterAction = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.diffDecorationsGutterAction'));
                this._register(onDidChangeGutterAction(this.onDidChangeGutterAction, this));
                this.onDidChangeGutterAction();
            }
        }
        onDidChangeGutterAction() {
            const gutterAction = this.configurationService.getValue('scm.diffDecorationsGutterAction');
            this.gutterActionDisposables.clear();
            if (gutterAction === 'diff') {
                this.gutterActionDisposables.add(this.editor.onMouseDown(e => this.onEditorMouseDown(e)));
                this.gutterActionDisposables.add(this.editor.onMouseUp(e => this.onEditorMouseUp(e)));
                this.stylesheet.textContent = `
				.monaco-editor .dirty-diff-glyph {
					cursor: pointer;
				}

				.monaco-editor .margin-view-overlays .dirty-diff-glyph:hover::before {
					height: 100%;
					width: 6px;
					left: -6px;
				}

				.monaco-editor .margin-view-overlays .dirty-diff-deleted:hover::after {
					bottom: 0;
					border-top-width: 0;
					border-bottom-width: 0;
				}
			`;
            }
            else {
                this.stylesheet.textContent = ``;
            }
        }
        canNavigate() {
            return !this.widget || (this.widget?.index === -1) || (!!this.model && this.model.changes.length > 1);
        }
        refresh() {
            this.widget?.showChange(this.widget.index, false);
        }
        next(lineNumber) {
            if (!this.assertWidget()) {
                return;
            }
            if (!this.widget || !this.model) {
                return;
            }
            let index;
            if (this.editor.hasModel() && (typeof lineNumber === 'number' || !this.widget.provider)) {
                index = this.model.findNextClosestChange(typeof lineNumber === 'number' ? lineNumber : this.editor.getPosition().lineNumber, true, this.widget.provider);
            }
            else {
                const providerChanges = this.model.mapChanges.get(this.widget.provider) ?? this.model.mapChanges.values().next().value;
                const mapIndex = providerChanges.findIndex(value => value === this.widget.index);
                index = providerChanges[(0, numbers_1.rot)(mapIndex + 1, providerChanges.length)];
            }
            this.widget.showChange(index);
        }
        previous(lineNumber) {
            if (!this.assertWidget()) {
                return;
            }
            if (!this.widget || !this.model) {
                return;
            }
            let index;
            if (this.editor.hasModel() && (typeof lineNumber === 'number')) {
                index = this.model.findPreviousClosestChange(typeof lineNumber === 'number' ? lineNumber : this.editor.getPosition().lineNumber, true, this.widget.provider);
            }
            else {
                const providerChanges = this.model.mapChanges.get(this.widget.provider) ?? this.model.mapChanges.values().next().value;
                const mapIndex = providerChanges.findIndex(value => value === this.widget.index);
                index = providerChanges[(0, numbers_1.rot)(mapIndex - 1, providerChanges.length)];
            }
            this.widget.showChange(index);
        }
        close() {
            this.session.dispose();
            this.session = lifecycle_1.Disposable.None;
        }
        assertWidget() {
            if (!this.enabled) {
                return false;
            }
            if (this.widget) {
                if (!this.model || this.model.changes.length === 0) {
                    this.close();
                    return false;
                }
                return true;
            }
            if (!this.modelRegistry) {
                return false;
            }
            const editorModel = this.editor.getModel();
            if (!editorModel) {
                return false;
            }
            const model = this.modelRegistry.getModel(editorModel, this.editor);
            if (!model) {
                return false;
            }
            if (model.changes.length === 0) {
                return false;
            }
            this.model = model;
            this.widget = this.instantiationService.createInstance(DirtyDiffWidget, this.editor, model);
            this.isDirtyDiffVisible.set(true);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(event_1.Event.once(this.widget.onDidClose)(this.close, this));
            const onDidModelChange = event_1.Event.chain(model.onDidChange, $ => $.filter(e => e.diff.length > 0)
                .map(e => e.diff));
            onDidModelChange(this.onDidModelChange, this, disposables);
            disposables.add(this.widget);
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                this.model = null;
                this.widget = null;
                this.isDirtyDiffVisible.set(false);
                this.editor.focus();
            }));
            this.session = disposables;
            return true;
        }
        onDidModelChange(splices) {
            if (!this.model || !this.widget || this.widget.hasFocus()) {
                return;
            }
            for (const splice of splices) {
                if (splice.start <= this.widget.index) {
                    this.next();
                    return;
                }
            }
            this.refresh();
        }
        onEditorMouseDown(e) {
            this.mouseDownInfo = null;
            const range = e.target.range;
            if (!range) {
                return;
            }
            if (!e.event.leftButton) {
                return;
            }
            if (e.target.type !== 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
                return;
            }
            if (!e.target.element) {
                return;
            }
            if (e.target.element.className.indexOf('dirty-diff-glyph') < 0) {
                return;
            }
            const data = e.target.detail;
            const offsetLeftInGutter = e.target.element.offsetLeft;
            const gutterOffsetX = data.offsetX - offsetLeftInGutter;
            // TODO@joao TODO@alex TODO@martin this is such that we don't collide with folding
            if (gutterOffsetX < -3 || gutterOffsetX > 3) { // dirty diff decoration on hover is 6px wide
                return;
            }
            this.mouseDownInfo = { lineNumber: range.startLineNumber };
        }
        onEditorMouseUp(e) {
            if (!this.mouseDownInfo) {
                return;
            }
            const { lineNumber } = this.mouseDownInfo;
            this.mouseDownInfo = null;
            const range = e.target.range;
            if (!range || range.startLineNumber !== lineNumber) {
                return;
            }
            if (e.target.type !== 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
                return;
            }
            if (!this.modelRegistry) {
                return;
            }
            const editorModel = this.editor.getModel();
            if (!editorModel) {
                return;
            }
            const model = this.modelRegistry.getModel(editorModel, this.editor);
            if (!model) {
                return;
            }
            const index = model.changes.findIndex(change => lineIntersectsChange(lineNumber, change.change));
            if (index < 0) {
                return;
            }
            if (index === this.widget?.index) {
                this.close();
            }
            else {
                this.next(lineNumber);
            }
        }
        getChanges() {
            if (!this.modelRegistry) {
                return [];
            }
            if (!this.editor.hasModel()) {
                return [];
            }
            const model = this.modelRegistry.getModel(this.editor.getModel(), this.editor);
            if (!model) {
                return [];
            }
            return model.changes.map(change => change.change);
        }
        dispose() {
            this.gutterActionDisposables.dispose();
            super.dispose();
        }
    };
    exports.DirtyDiffController = DirtyDiffController;
    exports.DirtyDiffController = DirtyDiffController = DirtyDiffController_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, instantiation_1.IInstantiationService)
    ], DirtyDiffController);
    const editorGutterModifiedBackground = (0, colorRegistry_1.registerColor)('editorGutter.modifiedBackground', {
        dark: '#1B81A8',
        light: '#2090D3',
        hcDark: '#1B81A8',
        hcLight: '#2090D3'
    }, nls.localize('editorGutterModifiedBackground', "Editor gutter background color for lines that are modified."));
    const editorGutterAddedBackground = (0, colorRegistry_1.registerColor)('editorGutter.addedBackground', {
        dark: '#487E02',
        light: '#48985D',
        hcDark: '#487E02',
        hcLight: '#48985D'
    }, nls.localize('editorGutterAddedBackground', "Editor gutter background color for lines that are added."));
    const editorGutterDeletedBackground = (0, colorRegistry_1.registerColor)('editorGutter.deletedBackground', {
        dark: colorRegistry_1.editorErrorForeground,
        light: colorRegistry_1.editorErrorForeground,
        hcDark: colorRegistry_1.editorErrorForeground,
        hcLight: colorRegistry_1.editorErrorForeground
    }, nls.localize('editorGutterDeletedBackground', "Editor gutter background color for lines that are deleted."));
    const minimapGutterModifiedBackground = (0, colorRegistry_1.registerColor)('minimapGutter.modifiedBackground', {
        dark: editorGutterModifiedBackground,
        light: editorGutterModifiedBackground,
        hcDark: editorGutterModifiedBackground,
        hcLight: editorGutterModifiedBackground
    }, nls.localize('minimapGutterModifiedBackground', "Minimap gutter background color for lines that are modified."));
    const minimapGutterAddedBackground = (0, colorRegistry_1.registerColor)('minimapGutter.addedBackground', {
        dark: editorGutterAddedBackground,
        light: editorGutterAddedBackground,
        hcDark: editorGutterAddedBackground,
        hcLight: editorGutterAddedBackground
    }, nls.localize('minimapGutterAddedBackground', "Minimap gutter background color for lines that are added."));
    const minimapGutterDeletedBackground = (0, colorRegistry_1.registerColor)('minimapGutter.deletedBackground', {
        dark: editorGutterDeletedBackground,
        light: editorGutterDeletedBackground,
        hcDark: editorGutterDeletedBackground,
        hcLight: editorGutterDeletedBackground
    }, nls.localize('minimapGutterDeletedBackground', "Minimap gutter background color for lines that are deleted."));
    const overviewRulerModifiedForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.modifiedForeground', { dark: (0, colorRegistry_1.transparent)(editorGutterModifiedBackground, 0.6), light: (0, colorRegistry_1.transparent)(editorGutterModifiedBackground, 0.6), hcDark: (0, colorRegistry_1.transparent)(editorGutterModifiedBackground, 0.6), hcLight: (0, colorRegistry_1.transparent)(editorGutterModifiedBackground, 0.6) }, nls.localize('overviewRulerModifiedForeground', 'Overview ruler marker color for modified content.'));
    const overviewRulerAddedForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.addedForeground', { dark: (0, colorRegistry_1.transparent)(editorGutterAddedBackground, 0.6), light: (0, colorRegistry_1.transparent)(editorGutterAddedBackground, 0.6), hcDark: (0, colorRegistry_1.transparent)(editorGutterAddedBackground, 0.6), hcLight: (0, colorRegistry_1.transparent)(editorGutterAddedBackground, 0.6) }, nls.localize('overviewRulerAddedForeground', 'Overview ruler marker color for added content.'));
    const overviewRulerDeletedForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.deletedForeground', { dark: (0, colorRegistry_1.transparent)(editorGutterDeletedBackground, 0.6), light: (0, colorRegistry_1.transparent)(editorGutterDeletedBackground, 0.6), hcDark: (0, colorRegistry_1.transparent)(editorGutterDeletedBackground, 0.6), hcLight: (0, colorRegistry_1.transparent)(editorGutterDeletedBackground, 0.6) }, nls.localize('overviewRulerDeletedForeground', 'Overview ruler marker color for deleted content.'));
    let DirtyDiffDecorator = DirtyDiffDecorator_1 = class DirtyDiffDecorator extends lifecycle_1.Disposable {
        static createDecoration(className, tooltip, options) {
            const decorationOptions = {
                description: 'dirty-diff-decoration',
                isWholeLine: options.isWholeLine,
            };
            if (options.gutter) {
                decorationOptions.linesDecorationsClassName = `dirty-diff-glyph ${className}`;
                decorationOptions.linesDecorationsTooltip = tooltip;
            }
            if (options.overview.active) {
                decorationOptions.overviewRuler = {
                    color: (0, themeService_1.themeColorFromId)(options.overview.color),
                    position: model_1.OverviewRulerLane.Left
                };
            }
            if (options.minimap.active) {
                decorationOptions.minimap = {
                    color: (0, themeService_1.themeColorFromId)(options.minimap.color),
                    position: 2 /* MinimapPosition.Gutter */
                };
            }
            return textModel_1.ModelDecorationOptions.createDynamic(decorationOptions);
        }
        constructor(editorModel, codeEditor, model, configurationService) {
            super();
            this.codeEditor = codeEditor;
            this.model = model;
            this.configurationService = configurationService;
            this.editorModel = editorModel;
            const decorations = configurationService.getValue('scm.diffDecorations');
            const gutter = decorations === 'all' || decorations === 'gutter';
            const overview = decorations === 'all' || decorations === 'overview';
            const minimap = decorations === 'all' || decorations === 'minimap';
            const diffAdded = nls.localize('diffAdded', 'Added lines');
            this.addedOptions = DirtyDiffDecorator_1.createDecoration('dirty-diff-added', diffAdded, {
                gutter,
                overview: { active: overview, color: overviewRulerAddedForeground },
                minimap: { active: minimap, color: minimapGutterAddedBackground },
                isWholeLine: true
            });
            this.addedPatternOptions = DirtyDiffDecorator_1.createDecoration('dirty-diff-added-pattern', diffAdded, {
                gutter,
                overview: { active: overview, color: overviewRulerAddedForeground },
                minimap: { active: minimap, color: minimapGutterAddedBackground },
                isWholeLine: true
            });
            const diffModified = nls.localize('diffModified', 'Changed lines');
            this.modifiedOptions = DirtyDiffDecorator_1.createDecoration('dirty-diff-modified', diffModified, {
                gutter,
                overview: { active: overview, color: overviewRulerModifiedForeground },
                minimap: { active: minimap, color: minimapGutterModifiedBackground },
                isWholeLine: true
            });
            this.modifiedPatternOptions = DirtyDiffDecorator_1.createDecoration('dirty-diff-modified-pattern', diffModified, {
                gutter,
                overview: { active: overview, color: overviewRulerModifiedForeground },
                minimap: { active: minimap, color: minimapGutterModifiedBackground },
                isWholeLine: true
            });
            this.deletedOptions = DirtyDiffDecorator_1.createDecoration('dirty-diff-deleted', nls.localize('diffDeleted', 'Removed lines'), {
                gutter,
                overview: { active: overview, color: overviewRulerDeletedForeground },
                minimap: { active: minimap, color: minimapGutterDeletedBackground },
                isWholeLine: false
            });
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('scm.diffDecorationsGutterPattern')) {
                    this.onDidChange();
                }
            }));
            this._register(model.onDidChange(this.onDidChange, this));
        }
        onDidChange() {
            if (!this.editorModel) {
                return;
            }
            const pattern = this.configurationService.getValue('scm.diffDecorationsGutterPattern');
            const decorations = this.model.changes.map((labeledChange) => {
                const change = labeledChange.change;
                const changeType = getChangeType(change);
                const startLineNumber = change.modifiedStartLineNumber;
                const endLineNumber = change.modifiedEndLineNumber || startLineNumber;
                switch (changeType) {
                    case ChangeType.Add:
                        return {
                            range: {
                                startLineNumber: startLineNumber, startColumn: 1,
                                endLineNumber: endLineNumber, endColumn: 1
                            },
                            options: pattern.added ? this.addedPatternOptions : this.addedOptions
                        };
                    case ChangeType.Delete:
                        return {
                            range: {
                                startLineNumber: startLineNumber, startColumn: Number.MAX_VALUE,
                                endLineNumber: startLineNumber, endColumn: Number.MAX_VALUE
                            },
                            options: this.deletedOptions
                        };
                    case ChangeType.Modify:
                        return {
                            range: {
                                startLineNumber: startLineNumber, startColumn: 1,
                                endLineNumber: endLineNumber, endColumn: 1
                            },
                            options: pattern.modified ? this.modifiedPatternOptions : this.modifiedOptions
                        };
                }
            });
            if (!this.decorationsCollection) {
                this.decorationsCollection = this.codeEditor.createDecorationsCollection(decorations);
            }
            else {
                this.decorationsCollection.set(decorations);
            }
        }
        dispose() {
            super.dispose();
            if (this.decorationsCollection) {
                this.decorationsCollection?.clear();
            }
            this.editorModel = null;
            this.decorationsCollection = undefined;
        }
    };
    DirtyDiffDecorator = DirtyDiffDecorator_1 = __decorate([
        __param(3, configuration_1.IConfigurationService)
    ], DirtyDiffDecorator);
    function compareChanges(a, b) {
        let result = a.modifiedStartLineNumber - b.modifiedStartLineNumber;
        if (result !== 0) {
            return result;
        }
        result = a.modifiedEndLineNumber - b.modifiedEndLineNumber;
        if (result !== 0) {
            return result;
        }
        result = a.originalStartLineNumber - b.originalStartLineNumber;
        if (result !== 0) {
            return result;
        }
        return a.originalEndLineNumber - b.originalEndLineNumber;
    }
    async function getOriginalResource(quickDiffService, uri, language, isSynchronized) {
        const quickDiffs = await quickDiffService.getQuickDiffs(uri, language, isSynchronized);
        return quickDiffs.length > 0 ? quickDiffs[0].originalResource : null;
    }
    let DirtyDiffModel = class DirtyDiffModel extends lifecycle_1.Disposable {
        get original() { return this._originalTextModels; }
        get changes() { return this._changes; }
        get mapChanges() { return this._mapChanges; }
        constructor(textFileModel, scmService, quickDiffService, editorWorkerService, configurationService, textModelResolverService, progressService) {
            super();
            this.scmService = scmService;
            this.quickDiffService = quickDiffService;
            this.editorWorkerService = editorWorkerService;
            this.configurationService = configurationService;
            this.textModelResolverService = textModelResolverService;
            this.progressService = progressService;
            this._quickDiffs = [];
            this._originalModels = new Map(); // key is uri.toString()
            this._originalTextModels = [];
            this.diffDelayer = new async_1.ThrottledDelayer(200);
            this.repositoryDisposables = new Set();
            this.originalModelDisposables = this._register(new lifecycle_1.DisposableStore());
            this._disposed = false;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._changes = [];
            this._mapChanges = new Map(); // key is the quick diff name, value is the index of the change in this._changes
            this._model = textFileModel;
            this._register(textFileModel.textEditorModel.onDidChangeContent(() => this.triggerDiff()));
            this._register(event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.diffDecorationsIgnoreTrimWhitespace') || e.affectsConfiguration('diffEditor.ignoreTrimWhitespace'))(this.triggerDiff, this));
            this._register(scmService.onDidAddRepository(this.onDidAddRepository, this));
            for (const r of scmService.repositories) {
                this.onDidAddRepository(r);
            }
            this._register(this._model.onDidChangeEncoding(() => {
                this.diffDelayer.cancel();
                this._quickDiffs = [];
                this._originalModels.clear();
                this._originalTextModels = [];
                this._quickDiffsPromise = undefined;
                this.setChanges([], new Map());
                this.triggerDiff();
            }));
            this._register(this.quickDiffService.onDidChangeQuickDiffProviders(() => this.triggerDiff()));
            this.triggerDiff();
        }
        get quickDiffs() {
            return this._quickDiffs;
        }
        getDiffEditorModel(originalUri) {
            if (!this._originalModels.has(originalUri)) {
                return;
            }
            const original = this._originalModels.get(originalUri);
            return {
                modified: this._model.textEditorModel,
                original: original.textEditorModel
            };
        }
        onDidAddRepository(repository) {
            const disposables = new lifecycle_1.DisposableStore();
            this.repositoryDisposables.add(disposables);
            disposables.add((0, lifecycle_1.toDisposable)(() => this.repositoryDisposables.delete(disposables)));
            const onDidChange = event_1.Event.any(repository.provider.onDidChange, repository.provider.onDidChangeResources);
            disposables.add(onDidChange(this.triggerDiff, this));
            const onDidRemoveThis = event_1.Event.filter(this.scmService.onDidRemoveRepository, r => r === repository);
            disposables.add(onDidRemoveThis(() => (0, lifecycle_1.dispose)(disposables), null));
            this.triggerDiff();
        }
        triggerDiff() {
            if (!this.diffDelayer) {
                return Promise.resolve(null);
            }
            return this.diffDelayer
                .trigger(() => this.diff())
                .then((result) => {
                const originalModels = Array.from(this._originalModels.values());
                if (!result || this._disposed || this._model.isDisposed() || originalModels.some(originalModel => originalModel.isDisposed())) {
                    return; // disposed
                }
                if (originalModels.every(originalModel => originalModel.textEditorModel.getValueLength() === 0)) {
                    result.changes = [];
                }
                if (!result.changes) {
                    result.changes = [];
                }
                this.setChanges(result.changes, result.mapChanges);
            }, (err) => (0, errors_1.onUnexpectedError)(err));
        }
        setChanges(changes, mapChanges) {
            const diff = (0, arrays_1.sortedDiff)(this._changes, changes, (a, b) => compareChanges(a.change, b.change));
            this._changes = changes;
            this._mapChanges = mapChanges;
            this._onDidChange.fire({ changes, diff });
        }
        diff() {
            return this.progressService.withProgress({ location: 3 /* ProgressLocation.Scm */, delay: 250 }, async () => {
                const originalURIs = await this.getQuickDiffsPromise();
                if (this._disposed || this._model.isDisposed() || (originalURIs.length === 0)) {
                    return Promise.resolve({ changes: [], mapChanges: new Map() }); // disposed
                }
                const filteredToDiffable = originalURIs.filter(quickDiff => this.editorWorkerService.canComputeDirtyDiff(quickDiff.originalResource, this._model.resource));
                if (filteredToDiffable.length === 0) {
                    return Promise.resolve({ changes: [], mapChanges: new Map() }); // All files are too large
                }
                const ignoreTrimWhitespaceSetting = this.configurationService.getValue('scm.diffDecorationsIgnoreTrimWhitespace');
                const ignoreTrimWhitespace = ignoreTrimWhitespaceSetting === 'inherit'
                    ? this.configurationService.getValue('diffEditor.ignoreTrimWhitespace')
                    : ignoreTrimWhitespaceSetting !== 'false';
                const allDiffs = [];
                for (const quickDiff of filteredToDiffable) {
                    const dirtyDiff = await this.editorWorkerService.computeDirtyDiff(quickDiff.originalResource, this._model.resource, ignoreTrimWhitespace);
                    if (dirtyDiff) {
                        for (const diff of dirtyDiff) {
                            if (diff) {
                                allDiffs.push({ change: diff, label: quickDiff.label, uri: quickDiff.originalResource });
                            }
                        }
                    }
                }
                const sorted = allDiffs.sort((a, b) => compareChanges(a.change, b.change));
                const map = new Map();
                for (let i = 0; i < sorted.length; i++) {
                    const label = sorted[i].label;
                    if (!map.has(label)) {
                        map.set(label, []);
                    }
                    map.get(label).push(i);
                }
                return { changes: sorted, mapChanges: map };
            });
        }
        getQuickDiffsPromise() {
            if (this._quickDiffsPromise) {
                return this._quickDiffsPromise;
            }
            this._quickDiffsPromise = this.getOriginalResource().then(async (quickDiffs) => {
                if (this._disposed) { // disposed
                    return [];
                }
                if (quickDiffs.length === 0) {
                    this._quickDiffs = [];
                    this._originalModels.clear();
                    this._originalTextModels = [];
                    return [];
                }
                if ((0, arrays_1.equals)(this._quickDiffs, quickDiffs, (a, b) => a.originalResource.toString() === b.originalResource.toString() && a.label === b.label)) {
                    return quickDiffs;
                }
                this.originalModelDisposables.clear();
                this._originalModels.clear();
                this._originalTextModels = [];
                this._quickDiffs = quickDiffs;
                return (await Promise.all(quickDiffs.map(async (quickDiff) => {
                    try {
                        const ref = await this.textModelResolverService.createModelReference(quickDiff.originalResource);
                        if (this._disposed) { // disposed
                            ref.dispose();
                            return [];
                        }
                        this._originalModels.set(quickDiff.originalResource.toString(), ref.object);
                        this._originalTextModels.push(ref.object.textEditorModel);
                        if ((0, textfiles_1.isTextFileEditorModel)(ref.object)) {
                            const encoding = this._model.getEncoding();
                            if (encoding) {
                                ref.object.setEncoding(encoding, 1 /* EncodingMode.Decode */);
                            }
                        }
                        this.originalModelDisposables.add(ref);
                        this.originalModelDisposables.add(ref.object.textEditorModel.onDidChangeContent(() => this.triggerDiff()));
                        return quickDiff;
                    }
                    catch (error) {
                        return []; // possibly invalid reference
                    }
                }))).flat();
            });
            return this._quickDiffsPromise.finally(() => {
                this._quickDiffsPromise = undefined;
            });
        }
        async getOriginalResource() {
            if (this._disposed) {
                return Promise.resolve([]);
            }
            const uri = this._model.resource;
            return this.quickDiffService.getQuickDiffs(uri, this._model.getLanguageId(), this._model.textEditorModel ? (0, model_1.shouldSynchronizeModel)(this._model.textEditorModel) : undefined);
        }
        findNextClosestChange(lineNumber, inclusive = true, provider) {
            let preferredProvider;
            if (!provider && inclusive) {
                preferredProvider = this.quickDiffs.find(value => value.isSCM)?.label;
            }
            const possibleChanges = [];
            for (let i = 0; i < this.changes.length; i++) {
                if (provider && this.changes[i].label !== provider) {
                    continue;
                }
                const change = this.changes[i];
                const possibleChangesLength = possibleChanges.length;
                if (inclusive) {
                    if (getModifiedEndLineNumber(change.change) >= lineNumber) {
                        if (preferredProvider && change.label !== preferredProvider) {
                            possibleChanges.push(i);
                        }
                        else {
                            return i;
                        }
                    }
                }
                else {
                    if (change.change.modifiedStartLineNumber > lineNumber) {
                        return i;
                    }
                }
                if ((possibleChanges.length > 0) && (possibleChanges.length === possibleChangesLength)) {
                    return possibleChanges[0];
                }
            }
            return possibleChanges.length > 0 ? possibleChanges[0] : 0;
        }
        findPreviousClosestChange(lineNumber, inclusive = true, provider) {
            for (let i = this.changes.length - 1; i >= 0; i--) {
                if (provider && this.changes[i].label !== provider) {
                    continue;
                }
                const change = this.changes[i].change;
                if (inclusive) {
                    if (change.modifiedStartLineNumber <= lineNumber) {
                        return i;
                    }
                }
                else {
                    if (getModifiedEndLineNumber(change) < lineNumber) {
                        return i;
                    }
                }
            }
            return this.changes.length - 1;
        }
        dispose() {
            super.dispose();
            this._disposed = true;
            this._quickDiffs = [];
            this._originalModels.clear();
            this._originalTextModels = [];
            this.diffDelayer.cancel();
            this.repositoryDisposables.forEach(d => (0, lifecycle_1.dispose)(d));
            this.repositoryDisposables.clear();
        }
    };
    exports.DirtyDiffModel = DirtyDiffModel;
    exports.DirtyDiffModel = DirtyDiffModel = __decorate([
        __param(1, scm_1.ISCMService),
        __param(2, quickDiff_1.IQuickDiffService),
        __param(3, editorWorker_1.IEditorWorkerService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, resolverService_1.ITextModelService),
        __param(6, progress_1.IProgressService)
    ], DirtyDiffModel);
    class DirtyDiffItem {
        constructor(model, decorator) {
            this.model = model;
            this.decorator = decorator;
        }
        dispose() {
            this.decorator.dispose();
            this.model.dispose();
        }
    }
    let DirtyDiffWorkbenchController = class DirtyDiffWorkbenchController extends lifecycle_1.Disposable {
        constructor(editorService, instantiationService, configurationService, textFileService) {
            super();
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.textFileService = textFileService;
            this.enabled = false;
            this.viewState = { width: 3, visibility: 'always' };
            this.items = new map_1.ResourceMap(); // resource -> editor id -> DirtyDiffItem
            this.transientDisposables = this._register(new lifecycle_1.DisposableStore());
            this.stylesheet = dom.createStyleSheet(undefined, undefined, this._store);
            const onDidChangeConfiguration = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.diffDecorations'));
            this._register(onDidChangeConfiguration(this.onDidChangeConfiguration, this));
            this.onDidChangeConfiguration();
            const onDidChangeDiffWidthConfiguration = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.diffDecorationsGutterWidth'));
            this._register(onDidChangeDiffWidthConfiguration(this.onDidChangeDiffWidthConfiguration, this));
            this.onDidChangeDiffWidthConfiguration();
            const onDidChangeDiffVisibilityConfiguration = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.diffDecorationsGutterVisibility'));
            this._register(onDidChangeDiffVisibilityConfiguration(this.onDidChangeDiffVisibilityConfiguration, this));
            this.onDidChangeDiffVisibilityConfiguration();
        }
        onDidChangeConfiguration() {
            const enabled = this.configurationService.getValue('scm.diffDecorations') !== 'none';
            if (enabled) {
                this.enable();
            }
            else {
                this.disable();
            }
        }
        onDidChangeDiffWidthConfiguration() {
            let width = this.configurationService.getValue('scm.diffDecorationsGutterWidth');
            if (isNaN(width) || width <= 0 || width > 5) {
                width = 3;
            }
            this.setViewState({ ...this.viewState, width });
        }
        onDidChangeDiffVisibilityConfiguration() {
            const visibility = this.configurationService.getValue('scm.diffDecorationsGutterVisibility');
            this.setViewState({ ...this.viewState, visibility });
        }
        setViewState(state) {
            this.viewState = state;
            this.stylesheet.textContent = `
			.monaco-editor .dirty-diff-added,
			.monaco-editor .dirty-diff-modified {
				border-left-width:${state.width}px;
			}
			.monaco-editor .dirty-diff-added-pattern,
			.monaco-editor .dirty-diff-added-pattern:before,
			.monaco-editor .dirty-diff-modified-pattern,
			.monaco-editor .dirty-diff-modified-pattern:before {
				background-size: ${state.width}px ${state.width}px;
			}
			.monaco-editor .dirty-diff-added,
			.monaco-editor .dirty-diff-added-pattern,
			.monaco-editor .dirty-diff-modified,
			.monaco-editor .dirty-diff-modified-pattern,
			.monaco-editor .dirty-diff-deleted {
				opacity: ${state.visibility === 'always' ? 1 : 0};
			}
		`;
        }
        enable() {
            if (this.enabled) {
                this.disable();
            }
            this.transientDisposables.add(event_1.Event.any(this.editorService.onDidCloseEditor, this.editorService.onDidVisibleEditorsChange)(() => this.onEditorsChanged()));
            this.onEditorsChanged();
            this.enabled = true;
        }
        disable() {
            if (!this.enabled) {
                return;
            }
            this.transientDisposables.clear();
            for (const [, dirtyDiff] of this.items) {
                (0, lifecycle_1.dispose)(dirtyDiff.values());
            }
            this.items.clear();
            this.enabled = false;
        }
        onEditorsChanged() {
            for (const editor of this.editorService.visibleTextEditorControls) {
                if ((0, editorBrowser_1.isCodeEditor)(editor)) {
                    const textModel = editor.getModel();
                    const controller = DirtyDiffController.get(editor);
                    if (controller) {
                        controller.modelRegistry = this;
                    }
                    if (textModel && (!this.items.has(textModel.uri) || !this.items.get(textModel.uri).has(editor.getId()))) {
                        const textFileModel = this.textFileService.files.get(textModel.uri);
                        if (textFileModel?.isResolved()) {
                            const dirtyDiffModel = this.instantiationService.createInstance(DirtyDiffModel, textFileModel);
                            const decorator = new DirtyDiffDecorator(textFileModel.textEditorModel, editor, dirtyDiffModel, this.configurationService);
                            if (!this.items.has(textModel.uri)) {
                                this.items.set(textModel.uri, new Map());
                            }
                            this.items.get(textModel.uri)?.set(editor.getId(), new DirtyDiffItem(dirtyDiffModel, decorator));
                        }
                    }
                }
            }
            for (const [uri, item] of this.items) {
                for (const editorId of item.keys()) {
                    if (!this.editorService.visibleTextEditorControls.find(editor => (0, editorBrowser_1.isCodeEditor)(editor) && editor.getModel()?.uri.toString() === uri.toString() && editor.getId() === editorId)) {
                        if (item.has(editorId)) {
                            const dirtyDiffItem = item.get(editorId);
                            dirtyDiffItem?.dispose();
                            item.delete(editorId);
                            if (item.size === 0) {
                                this.items.delete(uri);
                            }
                        }
                    }
                }
            }
        }
        getModel(editorModel, codeEditor) {
            return this.items.get(editorModel.uri)?.get(codeEditor.getId())?.model;
        }
        dispose() {
            this.disable();
            super.dispose();
        }
    };
    exports.DirtyDiffWorkbenchController = DirtyDiffWorkbenchController;
    exports.DirtyDiffWorkbenchController = DirtyDiffWorkbenchController = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, textfiles_1.ITextFileService)
    ], DirtyDiffWorkbenchController);
    (0, editorExtensions_1.registerEditorContribution)(DirtyDiffController.ID, DirtyDiffController, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlydHlkaWZmRGVjb3JhdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zY20vYnJvd3Nlci9kaXJ0eWRpZmZEZWNvcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW9zQ2hHLGtEQUdDO0lBN29DRCxNQUFNLGdCQUFpQixTQUFRLHNCQUFZO1FBRXZCLFNBQVMsQ0FBQyxNQUFlLEVBQUUsT0FBWTtZQUN6RCxJQUFJLE1BQU0sWUFBWSx3QkFBYyxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRDtJQVVZLFFBQUEsa0JBQWtCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXhGLFNBQVMsZUFBZSxDQUFDLE1BQWU7UUFDdkMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyx1QkFBdUIsR0FBRyxDQUFDLENBQUM7UUFDbkYsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyx1QkFBdUIsR0FBRyxDQUFDLENBQUM7UUFFbkYsSUFBSSxNQUFNLENBQUMscUJBQXFCLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDeEMsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQzthQUFNLElBQUksTUFBTSxDQUFDLHFCQUFxQixLQUFLLENBQUMsRUFBRSxDQUFDO1lBQy9DLE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7YUFBTSxDQUFDO1lBQ1AsT0FB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