/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/services/bulkEditService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/contextkeys", "vs/workbench/contrib/notebook/browser/diff/diffElementViewModel", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditor", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/services/editor/common/editorService", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/editor", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, bulkEditService_1, nls_1, actions_1, configuration_1, contextkey_1, contextkeys_1, diffElementViewModel_1, notebookDiffEditorBrowser_1, notebookDiffEditor_1, notebookIcons_1, editorService_1, platform_1, configurationRegistry_1, editor_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ActiveEditorContext.isEqualTo(SearchEditorConstants.SearchEditorID)
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.diff.switchToText',
                icon: notebookIcons_1.openAsTextIcon,
                title: (0, nls_1.localize2)('notebook.diff.switchToText', 'Open Text Diff Editor'),
                precondition: contextkeys_1.ActiveEditorContext.isEqualTo(notebookDiffEditor_1.NotebookTextDiffEditor.ID),
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        group: 'navigation',
                        when: contextkeys_1.ActiveEditorContext.isEqualTo(notebookDiffEditor_1.NotebookTextDiffEditor.ID)
                    }]
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditor = editorService.activeEditorPane;
            if (activeEditor && activeEditor instanceof notebookDiffEditor_1.NotebookTextDiffEditor) {
                const diffEditorInput = activeEditor.input;
                await editorService.openEditor({
                    original: { resource: diffEditorInput.original.resource },
                    modified: { resource: diffEditorInput.resource },
                    label: diffEditorInput.getName(),
                    options: {
                        preserveFocus: false,
                        override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id
                    }
                });
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.diff.cell.revertMetadata',
                title: (0, nls_1.localize)('notebook.diff.cell.revertMetadata', "Revert Metadata"),
                icon: notebookIcons_1.revertIcon,
                f1: false,
                menu: {
                    id: actions_1.MenuId.NotebookDiffCellMetadataTitle,
                    when: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY
                },
                precondition: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY
            });
        }
        run(accessor, context) {
            if (!context) {
                return;
            }
            const original = context.cell.original;
            const modified = context.cell.modified;
            if (!original || !modified) {
                return;
            }
            modified.textModel.metadata = original.metadata;
        }
    });
    // registerAction2(class extends Action2 {
    // 	constructor() {
    // 		super(
    // 			{
    // 				id: 'notebook.diff.cell.switchOutputRenderingStyle',
    // 				title: localize('notebook.diff.cell.switchOutputRenderingStyle', "Switch Outputs Rendering"),
    // 				icon: renderOutputIcon,
    // 				f1: false,
    // 				menu: {
    // 					id: MenuId.NotebookDiffCellOutputsTitle
    // 				}
    // 			}
    // 		);
    // 	}
    // 	run(accessor: ServicesAccessor, context?: { cell: DiffElementViewModelBase }) {
    // 		if (!context) {
    // 			return;
    // 		}
    // 		context.cell.renderOutput = true;
    // 	}
    // });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.diff.cell.switchOutputRenderingStyleToText',
                title: (0, nls_1.localize)('notebook.diff.cell.switchOutputRenderingStyleToText', "Switch Output Rendering"),
                icon: notebookIcons_1.renderOutputIcon,
                f1: false,
                menu: {
                    id: actions_1.MenuId.NotebookDiffCellOutputsTitle,
                    when: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY_EXPANDED
                }
            });
        }
        run(accessor, context) {
            if (!context) {
                return;
            }
            context.cell.renderOutput = !context.cell.renderOutput;
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.diff.cell.revertOutputs',
                title: (0, nls_1.localize)('notebook.diff.cell.revertOutputs', "Revert Outputs"),
                icon: notebookIcons_1.revertIcon,
                f1: false,
                menu: {
                    id: actions_1.MenuId.NotebookDiffCellOutputsTitle,
                    when: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY
                },
                precondition: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY
            });
        }
        run(accessor, context) {
            if (!context) {
                return;
            }
            if (!(context.cell instanceof diffElementViewModel_1.SideBySideDiffElementViewModel)) {
                return;
            }
            const original = context.cell.original;
            const modified = context.cell.modified;
            const modifiedCellIndex = context.cell.mainDocumentTextModel.cells.indexOf(modified.textModel);
            if (modifiedCellIndex === -1) {
                return;
            }
            context.cell.mainDocumentTextModel.applyEdits([{
                    editType: 2 /* CellEditType.Output */, index: modifiedCellIndex, outputs: original.outputs
                }], true, undefined, () => undefined, undefined, true);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.diff.cell.revertInput',
                title: (0, nls_1.localize)('notebook.diff.cell.revertInput', "Revert Input"),
                icon: notebookIcons_1.revertIcon,
                f1: false,
                menu: {
                    id: actions_1.MenuId.NotebookDiffCellInputTitle,
                    when: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_INPUT
                },
                precondition: notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_INPUT
            });
        }
        run(accessor, context) {
            if (!context) {
                return;
            }
            const original = context.cell.original;
            const modified = context.cell.modified;
            if (!original || !modified) {
                return;
            }
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            return bulkEditService.apply([
                new bulkEditService_1.ResourceTextEdit(modified.uri, { range: modified.textModel.getFullModelRange(), text: original.textModel.getValue() }),
            ], { quotableLabel: 'Revert Notebook Cell Content Change' });
        }
    });
    class ToggleRenderAction extends actions_1.Action2 {
        constructor(id, title, precondition, toggled, order, toggleOutputs, toggleMetadata) {
            super({
                id: id,
                title,
                precondition: precondition,
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        group: 'notebook',
                        when: precondition,
                        order: order,
                    }],
                toggled: toggled
            });
            this.toggleOutputs = toggleOutputs;
            this.toggleMetadata = toggleMetadata;
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            if (this.toggleOutputs !== undefined) {
                const oldValue = configurationService.getValue('notebook.diff.ignoreOutputs');
                configurationService.updateValue('notebook.diff.ignoreOutputs', !oldValue);
            }
            if (this.toggleMetadata !== undefined) {
                const oldValue = configurationService.getValue('notebook.diff.ignoreMetadata');
                configurationService.updateValue('notebook.diff.ignoreMetadata', !oldValue);
            }
        }
    }
    (0, actions_1.registerAction2)(class extends ToggleRenderAction {
        constructor() {
            super('notebook.diff.showOutputs', (0, nls_1.localize2)('notebook.diff.showOutputs', 'Show Outputs Differences'), contextkeys_1.ActiveEditorContext.isEqualTo(notebookDiffEditor_1.NotebookTextDiffEditor.ID), contextkey_1.ContextKeyExpr.notEquals('config.notebook.diff.ignoreOutputs', true), 2, true, undefined);
        }
    });
    (0, actions_1.registerAction2)(class extends ToggleRenderAction {
        constructor() {
            super('notebook.diff.showMetadata', (0, nls_1.localize2)('notebook.diff.showMetadata', 'Show Metadata Differences'), contextkeys_1.ActiveEditorContext.isEqualTo(notebookDiffEditor_1.NotebookTextDiffEditor.ID), contextkey_1.ContextKeyExpr.notEquals('config.notebook.diff.ignoreMetadata', true), 1, undefined, true);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.diff.action.previous',
                title: (0, nls_1.localize)('notebook.diff.action.previous.title', "Show Previous Change"),
                icon: notebookIcons_1.previousChangeIcon,
                f1: false,
                keybinding: {
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 61 /* KeyCode.F3 */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkeys_1.ActiveEditorContext.isEqualTo(notebookDiffEditor_1.NotebookTextDiffEditor.ID)
                },
                menu: {
                    id: actions_1.MenuId.EditorTitle,
                    group: 'navigation',
                    when: contextkeys_1.ActiveEditorContext.isEqualTo(notebookDiffEditor_1.NotebookTextDiffEditor.ID)
                }
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            if (editorService.activeEditorPane?.getId() !== notebookCommon_1.NOTEBOOK_DIFF_EDITOR_ID) {
                return;
            }
            const editor = editorService.activeEditorPane.getControl();
            editor?.previousChange();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.diff.action.next',
                title: (0, nls_1.localize)('notebook.diff.action.next.title', "Show Next Change"),
                icon: notebookIcons_1.nextChangeIcon,
                f1: false,
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 61 /* KeyCode.F3 */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkeys_1.ActiveEditorContext.isEqualTo(notebookDiffEditor_1.NotebookTextDiffEditor.ID)
                },
                menu: {
                    id: actions_1.MenuId.EditorTitle,
                    group: 'navigation',
                    when: contextkeys_1.ActiveEditorContext.isEqualTo(notebookDiffEditor_1.NotebookTextDiffEditor.ID)
                }
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            if (editorService.activeEditorPane?.getId() !== notebookCommon_1.NOTEBOOK_DIFF_EDITOR_ID) {
                return;
            }
            const editor = editorService.activeEditorPane.getControl();
            editor?.nextChange();
        }
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'notebook',
        order: 100,
        type: 'object',
        'properties': {
            'notebook.diff.ignoreMetadata': {
                type: 'boolean',
                default: false,
                markdownDescription: (0, nls_1.localize)('notebook.diff.ignoreMetadata', "Hide Metadata Differences")
            },
            'notebook.diff.ignoreOutputs': {
                type: 'boolean',
                default: false,
                markdownDescription: (0, nls_1.localize)('notebook.diff.ignoreOutputs', "Hide Outputs Differences")
            },
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tEaWZmQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9kaWZmL25vdGVib29rRGlmZkFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF1QmhHLHNFQUFzRTtJQUV0RSxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw0QkFBNEI7Z0JBQ2hDLElBQUksRUFBRSw4QkFBYztnQkFDcEIsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDRCQUE0QixFQUFFLHVCQUF1QixDQUFDO2dCQUN2RSxZQUFZLEVBQUUsaUNBQW1CLENBQUMsU0FBUyxDQUFDLDJDQUFzQixDQUFDLEVBQUUsQ0FBQztnQkFDdEUsSUFBSSxFQUFFLENBQUM7d0JBQ04sRUFBRSxFQUFFLGdCQUFNLENBQUMsV0FBVzt3QkFDdEIsS0FBSyxFQUFFLFlBQVk7d0JBQ25CLElBQUksRUFBRSxpQ0FBbUIsQ0FBQyxTQUFTLENBQUMsMkNBQXNCLENBQUMsRUFBRSxDQUFDO3FCQUM5RCxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFFbkQsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLGdCQUFnQixDQUFDO1lBQ3BELElBQUksWUFBWSxJQUFJLFlBQVksWUFBWSwyQ0FBc0IsRUFBRSxDQUFDO2dCQUNwRSxNQUFNLGVBQWUsR0FBRyxZQUFZLENBQUMsS0FBZ0MsQ0FBQztnQkFFdEUsTUFBTSxhQUFhLENBQUMsVUFBVSxDQUM3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