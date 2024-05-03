/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookRange", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/platform/telemetry/common/telemetry", "vs/base/common/resources"], function (require, exports, uri_1, nls_1, actions_1, contextkey_1, notebookBrowser_1, notebookContextKeys_1, notebookRange_1, editorService_1, notebookEditorService_1, telemetry_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cellExecutionArgs = exports.executeNotebookCondition = exports.NotebookCellAction = exports.NotebookMultiCellAction = exports.NotebookAction = exports.CellOverflowToolbarGroups = exports.CellToolbarOrder = exports.NOTEBOOK_OUTPUT_WEBVIEW_ACTION_WEIGHT = exports.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT = exports.CELL_TITLE_OUTPUT_GROUP_ID = exports.CELL_TITLE_CELL_GROUP_ID = exports.NOTEBOOK_ACTIONS_CATEGORY = exports.SELECT_KERNEL_ID = void 0;
    exports.getContextFromActiveEditor = getContextFromActiveEditor;
    exports.getContextFromUri = getContextFromUri;
    exports.findTargetCellEditor = findTargetCellEditor;
    exports.getEditorFromArgsOrActivePane = getEditorFromArgsOrActivePane;
    exports.parseMultiCellExecutionArgs = parseMultiCellExecutionArgs;
    // Kernel Command
    exports.SELECT_KERNEL_ID = '_notebook.selectKernel';
    exports.NOTEBOOK_ACTIONS_CATEGORY = (0, nls_1.localize2)('notebookActions.category', 'Notebook');
    exports.CELL_TITLE_CELL_GROUP_ID = 'inline/cell';
    exports.CELL_TITLE_OUTPUT_GROUP_ID = 'inline/output';
    exports.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT = 100 /* KeybindingWeight.EditorContrib */; // smaller than Suggest Widget, etc
    exports.NOTEBOOK_OUTPUT_WEBVIEW_ACTION_WEIGHT = 200 /* KeybindingWeight.WorkbenchContrib */ + 1; // higher than Workbench contribution (such as Notebook List View), etc
    var CellToolbarOrder;
    (function (CellToolbarOrder) {
        CellToolbarOrder[CellToolbarOrder["EditCell"] = 0] = "EditCell";
        CellToolbarOrder[CellToolbarOrder["ExecuteAboveCells"] = 1] = "ExecuteAboveCells";
        CellToolbarOrder[CellToolbarOrder["ExecuteCellAndBelow"] = 2] = "ExecuteCellAndBelow";
        CellToolbarOrder[CellToolbarOrder["SaveCell"] = 3] = "SaveCell";
        CellToolbarOrder[CellToolbarOrder["SplitCell"] = 4] = "SplitCell";
        CellToolbarOrder[CellToolbarOrder["ClearCellOutput"] = 5] = "ClearCellOutput";
    })(CellToolbarOrder || (exports.CellToolbarOrder = CellToolbarOrder = {}));
    var CellOverflowToolbarGroups;
    (function (CellOverflowToolbarGroups) {
        CellOverflowToolbarGroups["Copy"] = "1_copy";
        CellOverflowToolbarGroups["Insert"] = "2_insert";
        CellOverflowToolbarGroups["Edit"] = "3_edit";
        CellOverflowToolbarGroups["Share"] = "4_share";
    })(CellOverflowToolbarGroups || (exports.CellOverflowToolbarGroups = CellOverflowToolbarGroups = {}));
    function getContextFromActiveEditor(editorService) {
        const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
        if (!editor || !editor.hasModel()) {
            return;
        }
        const activeCell = editor.getActiveCell();
        const selectedCells = editor.getSelectionViewModels();
        return {
            cell: activeCell,
            selectedCells,
            notebookEditor: editor
        };
    }
    function getWidgetFromUri(accessor, uri) {
        const notebookEditorService = accessor.get(notebookEditorService_1.INotebookEditorService);
        const widget = notebookEditorService.listNotebookEditors().find(widget => widget.hasModel() && widget.textModel.uri.toString() === uri.toString());
        if (widget && widget.hasModel()) {
            return widget;
        }
        return undefined;
    }
    function getContextFromUri(accessor, context) {
        const uri = uri_1.URI.revive(context);
        if (uri) {
            const widget = getWidgetFromUri(accessor, uri);
            if (widget) {
                return {
                    notebookEditor: widget,
                };
            }
        }
        return undefined;
    }
    function findTargetCellEditor(context, targetCell) {
        let foundEditor = undefined;
        for (const [, codeEditor] of context.notebookEditor.codeEditors) {
            if ((0, resources_1.isEqual)(codeEditor.getModel()?.uri, targetCell.uri)) {
                foundEditor = codeEditor;
                break;
            }
        }
        return foundEditor;
    }
    class NotebookAction extends actions_1.Action2 {
        constructor(desc) {
            if (desc.f1 !== false) {
                desc.f1 = false;
                const f1Menu = {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.INTERACTIVE_WINDOW_IS_ACTIVE_EDITOR)
                };
                if (!desc.menu) {
                    desc.menu = [];
                }
                else if (!Array.isArray(desc.menu)) {
                    desc.menu = [desc.menu];
                }
                desc.menu = [
                    ...desc.menu,
                    f1Menu
                ];
            }
            desc.category = exports.NOTEBOOK_ACTIONS_CATEGORY;
            super(desc);
        }
        async run(accessor, context, ...additionalArgs) {
            const isFromUI = !!context;
            const from = isFromUI ? (this.isNotebookActionContext(context) ? 'notebookToolbar' : 'editorToolbar') : undefined;
            if (!this.isNotebookActionContext(context)) {
                context = this.getEditorContextFromArgsOrActive(accessor, context, ...additionalArgs);
                if (!context) {
                    return;
                }
            }
            if (from !== undefined) {
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                telemetryService.publicLog2('workbenchActionExecuted', { id: this.desc.id, from: from });
            }
            return this.runWithContext(accessor, context);
        }
        isNotebookActionContext(context) {
            return !!context && !!context.notebookEditor;
        }
        getEditorContextFromArgsOrActive(accessor, context, ...additionalArgs) {
            return getContextFromActiveEditor(accessor.get(editorService_1.IEditorService));
        }
    }
    exports.NotebookAction = NotebookAction;
    // todo@rebornix, replace NotebookAction with this
    class NotebookMultiCellAction extends actions_1.Action2 {
        constructor(desc) {
            if (desc.f1 !== false) {
                desc.f1 = false;
                const f1Menu = {
                    id: actions_1.MenuId.CommandPalette,
                    when: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR
                };
                if (!desc.menu) {
                    desc.menu = [];
                }
                else if (!Array.isArray(desc.menu)) {
                    desc.menu = [desc.menu];
                }
                desc.menu = [
                    ...desc.menu,
                    f1Menu
                ];
            }
            desc.category = exports.NOTEBOOK_ACTIONS_CATEGORY;
            super(desc);
        }
        parseArgs(accessor, ...args) {
            return undefined;
        }
        isCellToolbarContext(context) {
            return !!context && !!context.notebookEditor && context.$mid === 13 /* MarshalledId.NotebookCellActionContext */;
        }
        isEditorContext(context) {
            return !!context && context.groupId !== undefined;
        }
        /**
         * The action/command args are resolved in following order
         * `run(accessor, cellToolbarContext)` from cell toolbar
         * `run(accessor, ...args)` from command service with arguments
         * `run(accessor, undefined)` from keyboard shortcuts, command palatte, etc
         */
        async run(accessor, ...additionalArgs) {
            const context = additionalArgs[0];
            const isFromCellToolbar = this.isCellToolbarContext(context);
            const isFromEditorToolbar = this.isEditorContext(context);
            const from = isFromCellToolbar ? 'cellToolbar' : (isFromEditorToolbar ? 'editorToolbar' : 'other');
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            if (isFromCellToolbar) {
                telemetryService.publicLog2('workbenchActionExecuted', { id: this.desc.id, from: from });
                return this.runWithContext(accessor, context);
            }
            // handle parsed args
            const parsedArgs = this.parseArgs(accessor, ...additionalArgs);
            if (parsedArgs) {
                telemetryService.publicLog2('workbenchActionExecuted', { id: this.desc.id, from: from });
                return this.runWithContext(accessor, parsedArgs);
            }
            // no parsed args, try handle active editor
            const editor = getEditorFromArgsOrActivePane(accessor);
            if (editor) {
                telemetryService.publicLog2('workbenchActionExecuted', { id: this.desc.id, from: from });
                return this.runWithContext(accessor, {
                    ui: false,
                    notebookEditor: editor,
                    selectedCells: (0, notebookBrowser_1.cellRangeToViewCells)(editor, editor.getSelections())
                });
            }
        }
    }
    exports.NotebookMultiCellAction = NotebookMultiCellAction;
    class NotebookCellAction extends NotebookAction {
        isCellActionContext(context) {
            return !!context && !!context.notebookEditor && !!context.cell;
        }
        getCellContextFromArgs(accessor, context, ...additionalArgs) {
            return undefined;
        }
        async run(accessor, context, ...additionalArgs) {
            if (this.isCellActionContext(context)) {
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                telemetryService.publicLog2('workbenchActionExecuted', { id: this.desc.id, from: 'cellToolbar' });
                return this.runWithContext(accessor, context);
            }
            const contextFromArgs = this.getCellContextFromArgs(accessor, context, ...additionalArgs);
            if (contextFromArgs) {
                return this.runWithContext(accessor, contextFromArgs);
            }
            const activeEditorContext = this.getEditorContextFromArgsOrActive(accessor);
            if (this.isCellActionContext(activeEditorContext)) {
                return this.runWithContext(accessor, activeEditorContext);
            }
        }
    }
    exports.NotebookCellAction = NotebookCellAction;
    exports.executeNotebookCondition = contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.greater(notebookContextKeys_1.NOTEBOOK_KERNEL_COUNT.key, 0), contextkey_1.ContextKeyExpr.greater(notebookContextKeys_1.NOTEBOOK_KERNEL_SOURCE_COUNT.key, 0));
    function isMultiCellArgs(arg) {
        if (arg === undefined) {
            return false;
        }
        const ranges = arg.ranges;
        if (!ranges) {
            return false;
        }
        if (!Array.isArray(ranges) || ranges.some(range => !(0, notebookRange_1.isICellRange)(range))) {
            return false;
        }
        if (arg.document) {
            const uri = uri_1.URI.revive(arg.document);
            if (!uri) {
                return false;
            }
        }
        return true;
    }
    function getEditorFromArgsOrActivePane(accessor, context) {
        const editorFromUri = getContextFromUri(accessor, context)?.notebookEditor;
        if (editorFromUri) {
            return editorFromUri;
        }
        const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(accessor.get(editorService_1.IEditorService).activeEditorPane);
        if (!editor || !editor.hasModel()) {
            return;
        }
        return editor;
    }
    function parseMultiCellExecutionArgs(accessor, ...args) {
        const firstArg = args[0];
        if (isMultiCellArgs(firstArg)) {
            const editor = getEditorFromArgsOrActivePane(accessor, firstArg.document);
            if (!editor) {
                return;
            }
            const ranges = firstArg.ranges;
            const selectedCells = ranges.map(range => editor.getCellsInRange(range).slice(0)).flat();
            const autoReveal = firstArg.autoReveal;
            return {
                ui: false,
                notebookEditor: editor,
                selectedCells,
                autoReveal
            };
        }
        // handle legacy arguments
        if ((0, notebookRange_1.isICellRange)(firstArg)) {
            // cellRange, document
            const secondArg = args[1];
            const editor = getEditorFromArgsOrActivePane(accessor, secondArg);
            if (!editor) {
                return;
            }
            return {
                ui: false,
                notebookEditor: editor,
                selectedCells: editor.getCellsInRange(firstArg)
            };
        }
        // let's just execute the active cell
        const context = getContextFromActiveEditor(accessor.get(editorService_1.IEditorService));
        return context ? {
            ui: false,
            notebookEditor: context.notebookEditor,
            selectedCells: context.selectedCells ?? [],
            cell: context.cell
        } : undefined;
    }
    exports.cellExecutionArgs = [
        {
            isOptional: true,
            name: 'options',
            description: 'The cell range options',
            schema: {
                'type': 'object',
                'required': ['ranges'],
                'properties': {
                    'ranges': {
                        'type': 'array',
                        items: [
                            {
                                'type': 'object',
                                'required': ['start', 'end'],
                                'properties': {
                                    'start': {
                                        'type': 'number'
                                    },
                                    'end': {
                                        'type': 'number'
                                    }
                                }
                            }
                        ]
                    },
                    'document': {
                        'type': 'object',
                        'description': 'The document uri',
                    },
                    'autoReveal': {
                        'type': 'boolean',
                        'description': 'Whether the cell should be revealed into view automatically'
                    }
                }
            }
        }
    ];
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellTitle, {
        submenu: actions_1.MenuId.NotebookCellInsert,
        title: (0, nls_1.localize)('notebookMenu.insertCell', "Insert Cell"),
        group: "2_insert" /* CellOverflowToolbarGroups.Insert */,
        when: notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, {
        submenu: actions_1.MenuId.NotebookCellTitle,
        title: (0, nls_1.localize)('notebookMenu.cellTitle', "Notebook Cell"),
        group: "2_insert" /* CellOverflowToolbarGroups.Insert */,
        when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellTitle, {
        title: (0, nls_1.localize)('miShare', "Share"),
        submenu: actions_1.MenuId.EditorContextShare,
        group: "4_share" /* CellOverflowToolbarGroups.Share */
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZUFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJvbGxlci9jb3JlQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwRWhHLGdFQWFDO0lBYUQsOENBY0M7SUFFRCxvREFVQztJQXlNRCxzRUFhQztJQUVELGtFQTRDQztJQTVXRCxpQkFBaUI7SUFDSixRQUFBLGdCQUFnQixHQUFHLHdCQUF3QixDQUFDO0lBQzVDLFFBQUEseUJBQXlCLEdBQUcsSUFBQSxlQUFTLEVBQUMsMEJBQTBCLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFOUUsUUFBQSx3QkFBd0IsR0FBRyxhQUFhLENBQUM7SUFDekMsUUFBQSwwQkFBMEIsR0FBRyxlQUFlLENBQUM7SUFFN0MsUUFBQSxvQ0FBb0MsNENBQWtDLENBQUMsbUNBQW1DO0lBQzFHLFFBQUEscUNBQXFDLEdBQUcsOENBQW9DLENBQUMsQ0FBQyxDQUFDLHVFQUF1RTtJQUVuSyxJQUFrQixnQkFPakI7SUFQRCxXQUFrQixnQkFBZ0I7UUFDakMsK0RBQVEsQ0FBQTtRQUNSLGlGQUFpQixDQUFBO1FBQ2pCLHFGQUFtQixDQUFBO1FBQ25CLCtEQUFRLENBQUE7UUFDUixpRUFBUyxDQUFBO1FBQ1QsNkVBQWUsQ0FBQTtJQUNoQixDQUFDLEVBUGlCLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBT2pDO0lBRUQsSUFBa0IseUJBS2pCO0lBTEQsV0FBa0IseUJBQXlCO1FBQzFDLDRDQUFlLENBQUE7UUFDZixnREFBbUIsQ0FBQTtRQUNuQiw0Q0FBZSxDQUFBO1FBQ2YsOENBQWlCLENBQUE7SUFDbEIsQ0FBQyxFQUxpQix5QkFBeUIseUNBQXpCLHlCQUF5QixRQUsxQztJQTRCRCxTQUFnQiwwQkFB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