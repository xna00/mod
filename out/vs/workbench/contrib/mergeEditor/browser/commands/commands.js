/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/resources", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput", "vs/workbench/contrib/mergeEditor/browser/view/mergeEditor", "vs/workbench/contrib/mergeEditor/common/mergeEditor", "vs/workbench/services/editor/common/editorService"], function (require, exports, codicons_1, resources_1, uri_1, nls_1, actions_1, contextkey_1, dialogs_1, opener_1, storage_1, mergeEditorInput_1, mergeEditor_1, mergeEditor_2, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AcceptMerge = exports.ResetCloseWithConflictsChoice = exports.ResetToBaseAndAutoMergeCommand = exports.AcceptAllInput2 = exports.AcceptAllInput1 = exports.OpenBaseFile = exports.CompareInput2WithBaseCommand = exports.CompareInput1WithBaseCommand = exports.ToggleActiveConflictInput2 = exports.ToggleActiveConflictInput1 = exports.GoToPreviousUnhandledConflict = exports.GoToNextUnhandledConflict = exports.OpenResultResource = exports.ShowHideCenterBase = exports.ShowHideTopBase = exports.ShowHideBase = exports.ShowNonConflictingChanges = exports.SetColumnLayout = exports.SetMixedLayout = exports.OpenMergeEditor = void 0;
    class MergeEditorAction extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                const vm = activeEditorPane.viewModel.get();
                if (!vm) {
                    return;
                }
                this.runWithViewModel(vm, accessor);
            }
        }
    }
    class MergeEditorAction2 extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
        }
        run(accessor, ...args) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                const vm = activeEditorPane.viewModel.get();
                if (!vm) {
                    return;
                }
                return this.runWithMergeEditor({
                    viewModel: vm,
                    inputModel: activeEditorPane.inputModel.get(),
                    input: activeEditorPane.input,
                    editorIdentifier: {
                        editor: activeEditorPane.input,
                        groupId: activeEditorPane.group.id,
                    }
                }, accessor, ...args);
            }
        }
    }
    class OpenMergeEditor extends actions_1.Action2 {
        constructor() {
            super({
                id: '_open.mergeEditor',
                title: (0, nls_1.localize2)('title', 'Open Merge Editor'),
            });
        }
        run(accessor, ...args) {
            const validatedArgs = IRelaxedOpenArgs.validate(args[0]);
            const input = {
                base: { resource: validatedArgs.base },
                input1: { resource: validatedArgs.input1.uri, label: validatedArgs.input1.title, description: validatedArgs.input1.description, detail: validatedArgs.input1.detail },
                input2: { resource: validatedArgs.input2.uri, label: validatedArgs.input2.title, description: validatedArgs.input2.description, detail: validatedArgs.input2.detail },
                result: { resource: validatedArgs.output },
                options: { preserveFocus: true }
            };
            accessor.get(editorService_1.IEditorService).openEditor(input);
        }
    }
    exports.OpenMergeEditor = OpenMergeEditor;
    var IRelaxedOpenArgs;
    (function (IRelaxedOpenArgs) {
        function validate(obj) {
            if (!obj || typeof obj !== 'object') {
                throw new TypeError('invalid argument');
            }
            const o = obj;
            const base = toUri(o.base);
            const output = toUri(o.output);
            const input1 = toInputData(o.input1);
            const input2 = toInputData(o.input2);
            return { base, input1, input2, output };
        }
        IRelaxedOpenArgs.validate = validate;
        function toInputData(obj) {
            if (typeof obj === 'string') {
                return new mergeEditorInput_1.MergeEditorInputData(uri_1.URI.parse(obj, true), undefined, undefined, undefined);
            }
            if (!obj || typeof obj !== 'object') {
                throw new TypeError('invalid argument');
            }
            if (isUriComponents(obj)) {
                return new mergeEditorInput_1.MergeEditorInputData(uri_1.URI.revive(obj), undefined, undefined, undefined);
            }
            const o = obj;
            const title = o.title;
            const uri = toUri(o.uri);
            const detail = o.detail;
            const description = o.description;
            return new mergeEditorInput_1.MergeEditorInputData(uri, title, detail, description);
        }
        function toUri(obj) {
            if (typeof obj === 'string') {
                return uri_1.URI.parse(obj, true);
            }
            else if (obj && typeof obj === 'object') {
                return uri_1.URI.revive(obj);
            }
            throw new TypeError('invalid argument');
        }
        function isUriComponents(obj) {
            if (!obj || typeof obj !== 'object') {
                return false;
            }
            const o = obj;
            return typeof o.scheme === 'string'
                && typeof o.authority === 'string'
                && typeof o.path === 'string'
                && typeof o.query === 'string'
                && typeof o.fragment === 'string';
        }
    })(IRelaxedOpenArgs || (IRelaxedOpenArgs = {}));
    class SetMixedLayout extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.mixedLayout',
                title: (0, nls_1.localize2)('layout.mixed', "Mixed Layout"),
                toggled: mergeEditor_2.ctxMergeEditorLayout.isEqualTo('mixed'),
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_2.ctxIsMergeEditor,
                        group: '1_merge',
                        order: 9,
                    },
                ],
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.setLayoutKind('mixed');
            }
        }
    }
    exports.SetMixedLayout = SetMixedLayout;
    class SetColumnLayout extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.columnLayout',
                title: (0, nls_1.localize2)('layout.column', 'Column Layout'),
                toggled: mergeEditor_2.ctxMergeEditorLayout.isEqualTo('columns'),
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_2.ctxIsMergeEditor,
                        group: '1_merge',
                        order: 10,
                    }],
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.setLayoutKind('columns');
            }
        }
    }
    exports.SetColumnLayout = SetColumnLayout;
    class ShowNonConflictingChanges extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.showNonConflictingChanges',
                title: (0, nls_1.localize2)('showNonConflictingChanges', "Show Non-Conflicting Changes"),
                toggled: mergeEditor_2.ctxMergeEditorShowNonConflictingChanges.isEqualTo(true),
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_2.ctxIsMergeEditor,
                        group: '3_merge',
                        order: 9,
                    },
                ],
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.toggleShowNonConflictingChanges();
            }
        }
    }
    exports.ShowNonConflictingChanges = ShowNonConflictingChanges;
    class ShowHideBase extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.showBase',
                title: (0, nls_1.localize2)('layout.showBase', "Show Base"),
                toggled: mergeEditor_2.ctxMergeEditorShowBase.isEqualTo(true),
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(mergeEditor_2.ctxIsMergeEditor, mergeEditor_2.ctxMergeEditorLayout.isEqualTo('columns')),
                        group: '2_merge',
                        order: 9,
                    },
                ]
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.toggleBase();
            }
        }
    }
    exports.ShowHideBase = ShowHideBase;
    class ShowHideTopBase extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.showBaseTop',
                title: (0, nls_1.localize2)('layout.showBaseTop', "Show Base Top"),
                toggled: contextkey_1.ContextKeyExpr.and(mergeEditor_2.ctxMergeEditorShowBase, mergeEditor_2.ctxMergeEditorShowBaseAtTop),
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(mergeEditor_2.ctxIsMergeEditor, mergeEditor_2.ctxMergeEditorLayout.isEqualTo('mixed')),
                        group: '2_merge',
                        order: 10,
                    },
                ],
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.toggleShowBaseTop();
            }
        }
    }
    exports.ShowHideTopBase = ShowHideTopBase;
    class ShowHideCenterBase extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.showBaseCenter',
                title: (0, nls_1.localize2)('layout.showBaseCenter', "Show Base Center"),
                toggled: contextkey_1.ContextKeyExpr.and(mergeEditor_2.ctxMergeEditorShowBase, mergeEditor_2.ctxMergeEditorShowBaseAtTop.negate()),
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(mergeEditor_2.ctxIsMergeEditor, mergeEditor_2.ctxMergeEditorLayout.isEqualTo('mixed')),
                        group: '2_merge',
                        order: 11,
                    },
                ],
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.toggleShowBaseCenter();
            }
        }
    }
    exports.ShowHideCenterBase = ShowHideCenterBase;
    const mergeEditorCategory = (0, nls_1.localize2)('mergeEditor', "Merge Editor");
    class OpenResultResource extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.openResult',
                icon: codicons_1.Codicon.goToFile,
                title: (0, nls_1.localize2)('openfile', "Open File"),
                category: mergeEditorCategory,
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_2.ctxIsMergeEditor,
                        group: 'navigation',
                        order: 1,
                    }],
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        runWithViewModel(viewModel, accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            editorService.openEditor({ resource: viewModel.model.resultTextModel.uri });
        }
    }
    exports.OpenResultResource = OpenResultResource;
    class GoToNextUnhandledConflict extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.goToNextUnhandledConflict',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.goToNextUnhandledConflict', "Go to Next Unhandled Conflict"),
                icon: codicons_1.Codicon.arrowDown,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_2.ctxIsMergeEditor,
                        group: 'navigation',
                        order: 3
                    },
                ],
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        runWithViewModel(viewModel) {
            viewModel.model.telemetry.reportNavigationToNextConflict();
            viewModel.goToNextModifiedBaseRange(r => !viewModel.model.isHandled(r).get());
        }
    }
    exports.GoToNextUnhandledConflict = GoToNextUnhandledConflict;
    class GoToPreviousUnhandledConflict extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.goToPreviousUnhandledConflict',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.goToPreviousUnhandledConflict', "Go to Previous Unhandled Conflict"),
                icon: codicons_1.Codicon.arrowUp,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_2.ctxIsMergeEditor,
                        group: 'navigation',
                        order: 2
                    },
                ],
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        runWithViewModel(viewModel) {
            viewModel.model.telemetry.reportNavigationToPreviousConflict();
            viewModel.goToPreviousModifiedBaseRange(r => !viewModel.model.isHandled(r).get());
        }
    }
    exports.GoToPreviousUnhandledConflict = GoToPreviousUnhandledConflict;
    class ToggleActiveConflictInput1 extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.toggleActiveConflictInput1',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.toggleCurrentConflictFromLeft', "Toggle Current Conflict from Left"),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        runWithViewModel(viewModel) {
            viewModel.toggleActiveConflict(1);
        }
    }
    exports.ToggleActiveConflictInput1 = ToggleActiveConflictInput1;
    class ToggleActiveConflictInput2 extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.toggleActiveConflictInput2',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.toggleCurrentConflictFromRight', "Toggle Current Conflict from Right"),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        runWithViewModel(viewModel) {
            viewModel.toggleActiveConflict(2);
        }
    }
    exports.ToggleActiveConflictInput2 = ToggleActiveConflictInput2;
    class CompareInput1WithBaseCommand extends MergeEditorAction {
        constructor() {
            super({
                id: 'mergeEditor.compareInput1WithBase',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('mergeEditor.compareInput1WithBase', "Compare Input 1 With Base"),
                shortTitle: (0, nls_1.localize)('mergeEditor.compareWithBase', 'Compare With Base'),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
                menu: { id: actions_1.MenuId.MergeInput1Toolbar, group: 'primary' },
                icon: codicons_1.Codicon.compareChanges,
            });
        }
        runWithViewModel(viewModel, accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            mergeEditorCompare(viewModel, editorService, 1);
        }
    }
    exports.CompareInput1WithBaseCommand = CompareInput1WithBaseCommand;
    class CompareInput2WithBaseCommand extends MergeEditorAction {
        constructor() {
            super({
                id: 'mergeEditor.compareInput2WithBase',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('mergeEditor.compareInput2WithBase', "Compare Input 2 With Base"),
                shortTitle: (0, nls_1.localize)('mergeEditor.compareWithBase', 'Compare With Base'),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
                menu: { id: actions_1.MenuId.MergeInput2Toolbar, group: 'primary' },
                icon: codicons_1.Codicon.compareChanges,
            });
        }
        runWithViewModel(viewModel, accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            mergeEditorCompare(viewModel, editorService, 2);
        }
    }
    exports.CompareInput2WithBaseCommand = CompareInput2WithBaseCommand;
    async function mergeEditorCompare(viewModel, editorService, inputNumber) {
        editorService.openEditor(editorService.activeEditor, { pinned: true });
        const model = viewModel.model;
        const base = model.base;
        const input = inputNumber === 1 ? viewModel.inputCodeEditorView1.editor : viewModel.inputCodeEditorView2.editor;
        const lineNumber = input.getPosition().lineNumber;
        await editorService.openEditor({
            original: { resource: base.uri },
            modified: { resource: input.getModel().uri },
            options: {
                selection: {
                    startLineNumber: lineNumber,
                    startColumn: 1,
                },
                revealIfOpened: true,
                revealIfVisible: true,
            }
        });
    }
    class OpenBaseFile extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.openBaseEditor',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.openBaseEditor', "Open Base File"),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
            });
        }
        runWithViewModel(viewModel, accessor) {
            const openerService = accessor.get(opener_1.IOpenerService);
            openerService.open(viewModel.model.base.uri);
        }
    }
    exports.OpenBaseFile = OpenBaseFile;
    class AcceptAllInput1 extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.acceptAllInput1',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.acceptAllInput1', "Accept All Changes from Left"),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
                menu: { id: actions_1.MenuId.MergeInput1Toolbar, group: 'primary' },
                icon: codicons_1.Codicon.checkAll,
            });
        }
        runWithViewModel(viewModel) {
            viewModel.acceptAll(1);
        }
    }
    exports.AcceptAllInput1 = AcceptAllInput1;
    class AcceptAllInput2 extends MergeEditorAction {
        constructor() {
            super({
                id: 'merge.acceptAllInput2',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('merge.acceptAllInput2', "Accept All Changes from Right"),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
                menu: { id: actions_1.MenuId.MergeInput2Toolbar, group: 'primary' },
                icon: codicons_1.Codicon.checkAll,
            });
        }
        runWithViewModel(viewModel) {
            viewModel.acceptAll(2);
        }
    }
    exports.AcceptAllInput2 = AcceptAllInput2;
    class ResetToBaseAndAutoMergeCommand extends MergeEditorAction {
        constructor() {
            super({
                id: 'mergeEditor.resetResultToBaseAndAutoMerge',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('mergeEditor.resetResultToBaseAndAutoMerge', "Reset Result"),
                shortTitle: (0, nls_1.localize)('mergeEditor.resetResultToBaseAndAutoMerge.short', 'Reset'),
                f1: true,
                precondition: mergeEditor_2.ctxIsMergeEditor,
                menu: { id: actions_1.MenuId.MergeInputResultToolbar, group: 'primary' },
                icon: codicons_1.Codicon.discard,
            });
        }
        runWithViewModel(viewModel, accessor) {
            viewModel.model.reset();
        }
    }
    exports.ResetToBaseAndAutoMergeCommand = ResetToBaseAndAutoMergeCommand;
    class ResetCloseWithConflictsChoice extends actions_1.Action2 {
        constructor() {
            super({
                id: 'mergeEditor.resetCloseWithConflictsChoice',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('mergeEditor.resetChoice', "Reset Choice for \'Close with Conflicts\'"),
                f1: true,
            });
        }
        run(accessor) {
            accessor.get(storage_1.IStorageService).remove(mergeEditor_2.StorageCloseWithConflicts, 0 /* StorageScope.PROFILE */);
        }
    }
    exports.ResetCloseWithConflictsChoice = ResetCloseWithConflictsChoice;
    // this is an API command
    class AcceptMerge extends MergeEditorAction2 {
        constructor() {
            super({
                id: 'mergeEditor.acceptMerge',
                category: mergeEditorCategory,
                title: (0, nls_1.localize2)('mergeEditor.acceptMerge', "Complete Merge"),
                f1: false,
                precondition: mergeEditor_2.ctxIsMergeEditor
            });
        }
        async runWithMergeEditor({ inputModel, editorIdentifier, viewModel }, accessor) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const editorService = accessor.get(editorService_1.IEditorService);
            if (viewModel.model.unhandledConflictsCount.get() > 0) {
                const { confirmed } = await dialogService.confirm({
                    message: (0, nls_1.localize)('mergeEditor.acceptMerge.unhandledConflicts.message', "Do you want to complete the merge of {0}?", (0, resources_1.basename)(inputModel.resultUri)),
                    detail: (0, nls_1.localize)('mergeEditor.acceptMerge.unhandledConflicts.detail', "The file contains unhandled conflicts."),
                    primaryButton: (0, nls_1.localize)({ key: 'mergeEditor.acceptMerge.unhandledConflicts.accept', comment: ['&& denotes a mnemonic'] }, "&&Complete with Conflicts")
                });
                if (!confirmed) {
                    return {
                        successful: false
                    };
                }
            }
            await inputModel.accept();
            await editorService.closeEditor(editorIdentifier);
            return {
                successful: true
            };
        }
    }
    exports.AcceptMerge = AcceptMerge;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvY29tbWFuZHMvY29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc0JoRyxNQUFlLGlCQUFrQixTQUFRLGlCQUFPO1FBQy9DLFlBQVksSUFBK0I7WUFDMUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2IsQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztZQUMxRCxJQUFJLGdCQUFnQixZQUFZLHlCQUFXLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxFQUFFLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ1QsT0FBTztnQkFDUixDQUFDO2dCQUNELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7S0FHRDtJQVNELE1BQWUsa0JBQW1CLFNBQVEsaUJBQU87UUFDaEQsWUFBWSxJQUErQjtZQUMxQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDYixDQUFDO1FBRVEsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO1lBQ3RELE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQzFELElBQUksZ0JBQWdCLFlBQVkseUJBQVcsRUFBRSxDQUFDO2dCQUM3QyxNQUFNLEVBQUUsR0FBRyxnQkFBZ0IsQ0FBQyxTQUFT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