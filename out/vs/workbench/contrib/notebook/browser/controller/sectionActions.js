/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/browser/contrib/outline/notebookOutline", "vs/workbench/contrib/notebook/browser/controller/foldingController", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, nls_1, actions_1, contextkey_1, notebookOutline_1, foldingController_1, icons, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookExpandSection = exports.NotebookFoldSection = exports.NotebookRunCellsInSection = exports.NotebookRunSingleCellInSection = void 0;
    class NotebookRunSingleCellInSection extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.section.runSingleCell',
                title: {
                    ...(0, nls_1.localize2)('runCell', "Run Cell"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mirunCell', comment: ['&& denotes a mnemonic'] }, "&&Run Cell"),
                },
                shortTitle: (0, nls_1.localize)('runCell', "Run Cell"),
                icon: icons.executeIcon,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookOutlineActionMenu,
                        group: 'inline',
                        order: 1,
                        when: contextkey_1.ContextKeyExpr.and(notebookOutline_1.NotebookOutlineContext.CellKind.isEqualTo(notebookCommon_1.CellKind.Code), notebookOutline_1.NotebookOutlineContext.OutlineElementTarget.isEqualTo(1 /* OutlineTarget.OutlinePane */), notebookOutline_1.NotebookOutlineContext.CellHasChildren.toNegated(), notebookOutline_1.NotebookOutlineContext.CellHasHeader.toNegated())
                    }
                ]
            });
        }
        async run(_accessor, context) {
            if (!checkSectionContext(context)) {
                return;
            }
            context.notebookEditor.executeNotebookCells([context.outlineEntry.cell]);
        }
    }
    exports.NotebookRunSingleCellInSection = NotebookRunSingleCellInSection;
    class NotebookRunCellsInSection extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.section.runCells',
                title: {
                    ...(0, nls_1.localize2)('runCellsInSection', "Run Cells In Section"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mirunCellsInSection', comment: ['&& denotes a mnemonic'] }, "&&Run Cells In Section"),
                },
                shortTitle: (0, nls_1.localize)('runCellsInSection', "Run Cells In Section"),
                // icon: icons.executeBelowIcon, // TODO @Yoyokrazy replace this with new icon later
                menu: [
                    {
                        id: actions_1.MenuId.NotebookStickyScrollContext,
                        group: 'notebookExecution',
                        order: 1
                    },
                    {
                        id: actions_1.MenuId.NotebookOutlineActionMenu,
                        group: 'inline',
                        order: 1,
                        when: contextkey_1.ContextKeyExpr.and(notebookOutline_1.NotebookOutlineContext.CellKind.isEqualTo(notebookCommon_1.CellKind.Markup), notebookOutline_1.NotebookOutlineContext.OutlineElementTarget.isEqualTo(1 /* OutlineTarget.OutlinePane */), notebookOutline_1.NotebookOutlineContext.CellHasChildren, notebookOutline_1.NotebookOutlineContext.CellHasHeader)
                    }
                ]
            });
        }
        async run(_accessor, context) {
            if (!checkSectionContext(context)) {
                return;
            }
            const cell = context.outlineEntry.cell;
            const idx = context.notebookEditor.getViewModel()?.getCellIndex(cell);
            if (idx === undefined) {
                return;
            }
            const length = context.notebookEditor.getViewModel()?.getFoldedLength(idx);
            if (length === undefined) {
                return;
            }
            const cells = context.notebookEditor.getCellsInRange({ start: idx, end: idx + length + 1 });
            context.notebookEditor.executeNotebookCells(cells);
        }
    }
    exports.NotebookRunCellsInSection = NotebookRunCellsInSection;
    class NotebookFoldSection extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.section.foldSection',
                title: {
                    ...(0, nls_1.localize2)('foldSection', "Fold Section"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mifoldSection', comment: ['&& denotes a mnemonic'] }, "&&Fold Section"),
                },
                shortTitle: (0, nls_1.localize)('foldSection', "Fold Section"),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookOutlineActionMenu,
                        group: 'notebookFolding',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.and(notebookOutline_1.NotebookOutlineContext.CellKind.isEqualTo(notebookCommon_1.CellKind.Markup), notebookOutline_1.NotebookOutlineContext.OutlineElementTarget.isEqualTo(1 /* OutlineTarget.OutlinePane */), notebookOutline_1.NotebookOutlineContext.CellHasChildren, notebookOutline_1.NotebookOutlineContext.CellHasHeader, notebookOutline_1.NotebookOutlineContext.CellFoldingState.isEqualTo(1 /* CellFoldingState.Expanded */))
                    }
                ]
            });
        }
        async run(_accessor, context) {
            if (!checkSectionContext(context)) {
                return;
            }
            this.toggleFoldRange(context.outlineEntry, context.notebookEditor);
        }
        toggleFoldRange(entry, notebookEditor) {
            const foldingController = notebookEditor.getContribution(foldingController_1.FoldingController.id);
            const index = entry.index;
            const headerLevel = entry.level;
            const newFoldingState = 2 /* CellFoldingState.Collapsed */;
            foldingController.setFoldingStateDown(index, newFoldingState, headerLevel);
        }
    }
    exports.NotebookFoldSection = NotebookFoldSection;
    class NotebookExpandSection extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.section.expandSection',
                title: {
                    ...(0, nls_1.localize2)('expandSection', "Expand Section"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miexpandSection', comment: ['&& denotes a mnemonic'] }, "&&Expand Section"),
                },
                shortTitle: (0, nls_1.localize)('expandSection', "Expand Section"),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookOutlineActionMenu,
                        group: 'notebookFolding',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.and(notebookOutline_1.NotebookOutlineContext.CellKind.isEqualTo(notebookCommon_1.CellKind.Markup), notebookOutline_1.NotebookOutlineContext.OutlineElementTarget.isEqualTo(1 /* OutlineTarget.OutlinePane */), notebookOutline_1.NotebookOutlineContext.CellHasChildren, notebookOutline_1.NotebookOutlineContext.CellHasHeader, notebookOutline_1.NotebookOutlineContext.CellFoldingState.isEqualTo(2 /* CellFoldingState.Collapsed */))
                    }
                ]
            });
        }
        async run(_accessor, context) {
            if (!checkSectionContext(context)) {
                return;
            }
            this.toggleFoldRange(context.outlineEntry, context.notebookEditor);
        }
        toggleFoldRange(entry, notebookEditor) {
            const foldingController = notebookEditor.getContribution(foldingController_1.FoldingController.id);
            const index = entry.index;
            const headerLevel = entry.level;
            const newFoldingState = 1 /* CellFoldingState.Expanded */;
            foldingController.setFoldingStateDown(index, newFoldingState, headerLevel);
        }
    }
    exports.NotebookExpandSection = NotebookExpandSection;
    /**
     * Take in context args and check if they exist
     *
     * @param context - Notebook Section Context containing a notebook editor and outline entry
     * @returns true if context is valid, false otherwise
     */
    function checkSectionContext(context) {
        return !!(context && context.notebookEditor && context.outlineEntry);
    }
    (0, actions_1.registerAction2)(NotebookRunSingleCellInSection);
    (0, actions_1.registerAction2)(NotebookRunCellsInSection);
    (0, actions_1.registerAction2)(NotebookFoldSection);
    (0, actions_1.registerAction2)(NotebookExpandSection);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdGlvbkFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJvbGxlci9zZWN0aW9uQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3QmhHLE1BQWEsOEJBQStCLFNBQVEsaUJBQU87UUFDMUQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGdDQUFnQztnQkFDcEMsS0FBSyxFQUFFO29CQUNOLEdBQUcsSUFBQSxlQUFTLEVBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQztvQkFDbkMsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsWUFBWSxDQUFDO2lCQUMvRjtnQkFDRCxVQUFVLEVBQUUsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQztnQkFDM0MsSUFBSSxFQUFFLEtBQUssQ0FBQyxXQUFXO2dCQUN2QixJQUFJLEVBQUU7b0JBQ0w7d0JBQ0MsRUFBRSxFQUFFLGdCQUFNLENBQUMseUJBQXlCO3dCQUNwQyxLQUFLLEVBQUUsUUFBUTt3QkFDZixLQUFLLEVBQUUsQ0FBQzt3QkFDUixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQ3ZCLHdDQUFzQixDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMseUJBQVEsQ0FBQyxJQUFJLENBQUMsRUFDeEQsd0NBQXNCLENBQUMsb0JBQW9CLENBQUMsU0FBUyxtQ0FBMkIsRUFDaEYsd0NBQXNCLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxFQUNsRCx3Q0FBc0IsQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLENBQ2hEO3FCQUNEO2lCQUNEO2FBQ0QsQ0FB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