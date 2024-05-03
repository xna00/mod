/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/common/contextkeys", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, event_1, nls_1, actions_1, configuration_1, configurationRegistry_1, contextkey_1, platform_1, contextkeys_1, coreActions_1, notebookContextKeys_1, cellPart_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellEditorOptions = void 0;
    //todo@Yoyokrazy implenets is needed or not?
    class CellEditorOptions extends cellPart_1.CellContentPart {
        set tabSize(value) {
            if (this._tabSize !== value) {
                this._tabSize = value;
                this._onDidChange.fire();
            }
        }
        get tabSize() {
            return this._tabSize;
        }
        set indentSize(value) {
            if (this._indentSize !== value) {
                this._indentSize = value;
                this._onDidChange.fire();
            }
        }
        get indentSize() {
            return this._indentSize;
        }
        set insertSpaces(value) {
            if (this._insertSpaces !== value) {
                this._insertSpaces = value;
                this._onDidChange.fire();
            }
        }
        get insertSpaces() {
            return this._insertSpaces;
        }
        constructor(base, notebookOptions, configurationService) {
            super();
            this.base = base;
            this.notebookOptions = notebookOptions;
            this.configurationService = configurationService;
            this._lineNumbers = 'inherit';
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(base.onDidChange(() => {
                this._recomputeOptions();
            }));
            this._value = this._computeEditorOptions();
        }
        updateState(element, e) {
            if (e.cellLineNumberChanged) {
                this.setLineNumbers(element.lineNumbers);
            }
        }
        _recomputeOptions() {
            this._value = this._computeEditorOptions();
            this._onDidChange.fire();
        }
        _computeEditorOptions() {
            const value = this.base.value; // base IEditorOptions
            // TODO @Yoyokrazy find a different way to get the editor overrides, this is not the right way
            const cellEditorOverridesRaw = this.notebookOptions.getDisplayOptions().editorOptionsCustomizations;
            const indentSize = cellEditorOverridesRaw['editor.indentSize'];
            if (indentSize !== undefined) {
                this.indentSize = indentSize;
            }
            const insertSpaces = cellEditorOverridesRaw['editor.insertSpaces'];
            if (insertSpaces !== undefined) {
                this.insertSpaces = insertSpaces;
            }
            const tabSize = cellEditorOverridesRaw['editor.tabSize'];
            if (tabSize !== undefined) {
                this.tabSize = tabSize;
            }
            let cellRenderLineNumber = value.lineNumbers;
            switch (this._lineNumbers) {
                case 'inherit':
                    // inherit from the notebook setting
                    if (this.configurationService.getValue('notebook.lineNumbers') === 'on') {
                        if (value.lineNumbers === 'off') {
                            cellRenderLineNumber = 'on';
                        } // otherwise just use the editor setting
                    }
                    else {
                        cellRenderLineNumber = 'off';
                    }
                    break;
                case 'on':
                    // should turn on, ignore the editor line numbers off options
                    if (value.lineNumbers === 'off') {
                        cellRenderLineNumber = 'on';
                    } // otherwise just use the editor setting
                    break;
                case 'off':
                    cellRenderLineNumber = 'off';
                    break;
            }
            if (value.lineNumbers !== cellRenderLineNumber) {
                return {
                    ...value,
                    ...{ lineNumbers: cellRenderLineNumber }
                };
            }
            else {
                return Object.assign({}, value);
            }
        }
        getUpdatedValue(internalMetadata, cellUri) {
            const options = this.getValue(internalMetadata, cellUri);
            delete options.hover; // This is toggled by a debug editor contribution
            return options;
        }
        getValue(internalMetadata, cellUri) {
            return {
                ...this._value,
                ...{
                    padding: this.notebookOptions.computeEditorPadding(internalMetadata, cellUri)
                }
            };
        }
        getDefaultValue() {
            return {
                ...this._value,
                ...{
                    padding: { top: 12, bottom: 12 }
                }
            };
        }
        setLineNumbers(lineNumbers) {
            this._lineNumbers = lineNumbers;
            this._recomputeOptions();
        }
    }
    exports.CellEditorOptions = CellEditorOptions;
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'notebook',
        order: 100,
        type: 'object',
        'properties': {
            'notebook.lineNumbers': {
                type: 'string',
                enum: ['off', 'on'],
                default: 'off',
                markdownDescription: (0, nls_1.localize)('notebook.lineNumbers', "Controls the display of line numbers in the cell editor.")
            }
        }
    });
    (0, actions_1.registerAction2)(class ToggleLineNumberAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.toggleLineNumbers',
                title: (0, nls_1.localize2)('notebook.toggleLineNumbers', 'Toggle Notebook Line Numbers'),
                precondition: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        group: 'notebookLayout',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true)
                    }
                ],
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.notEquals('config.notebook.lineNumbers', 'off'),
                    title: (0, nls_1.localize)('notebook.showLineNumbers', "Notebook Line Numbers"),
                }
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const renderLiNumbers = configurationService.getValue('notebook.lineNumbers') === 'on';
            if (renderLiNumbers) {
                configurationService.updateValue('notebook.lineNumbers', 'off');
            }
            else {
                configurationService.updateValue('notebook.lineNumbers', 'on');
            }
        }
    });
    (0, actions_1.registerAction2)(class ToggleActiveLineNumberAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: 'notebook.cell.toggleLineNumbers',
                title: (0, nls_1.localize)('notebook.cell.toggleLineNumbers.title', "Show Cell Line Numbers"),
                precondition: contextkeys_1.ActiveEditorContext.isEqualTo(notebookCommon_1.NOTEBOOK_EDITOR_ID),
                menu: [{
                        id: actions_1.MenuId.NotebookCellTitle,
                        group: 'View',
                        order: 1
                    }],
                toggled: contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_CELL_LINE_NUMBERS.isEqualTo('on'), contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LINE_NUMBERS.isEqualTo('inherit'), contextkey_1.ContextKeyExpr.equals('config.notebook.lineNumbers', 'on')))
            });
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                this.updateCell(accessor.get(configuration_1.IConfigurationService), context.cell);
            }
            else {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                context.selectedCells.forEach(cell => {
                    this.updateCell(configurationService, cell);
                });
            }
        }
        updateCell(configurationService, cell) {
            const renderLineNumbers = configurationService.getValue('notebook.lineNumbers') === 'on';
            const cellLineNumbers = cell.lineNumbers;
            // 'on', 'inherit' 	-> 'on'
            // 'on', 'off'		-> 'off'
            // 'on', 'on'		-> 'on'
            // 'off', 'inherit'	-> 'off'
            // 'off', 'off'		-> 'off'
            // 'off', 'on'		-> 'on'
            const currentLineNumberIsOn = cellLineNumbers === 'on' || (cellLineNumbers === 'inherit' && renderLineNumbers);
            if (currentLineNumberIsOn) {
                cell.lineNumbers = 'off';
            }
            else {
                cell.lineNumbers = 'on';
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbEVkaXRvck9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlldy9jZWxsUGFydHMvY2VsbEVkaXRvck9wdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc0JoRyw0Q0FBNEM7SUFDNUMsTUFBYSxpQkFBa0IsU0FBUSwwQkFBZTtRQU1yRCxJQUFJLE9BQU8sQ0FBQyxLQUF5QjtZQUNwQyxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO2dCQUN0QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzFCLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxPQUFPO1lBQ1YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxJQUFJLFVBQVUsQ0FBQyxLQUFxQztZQUNuRCxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO2dCQUN6QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzFCLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxVQUFVO1lBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxJQUFJLFlBQVksQ0FBQyxLQUEwQjtZQUMxQyxJQUFJLElBQUksQ0FBQyxhQUFhLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO2dCQUMzQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzFCLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxZQUFZO1lBQ2YsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzNCLENBQUM7UUFNRCxZQUNrQixJQUE0QixFQUNwQyxlQUFnQyxFQUNoQyxvQkFBMkM7WUFDcEQsS0FBSyxFQUFFLENBQUM7WUFIUyxTQUFJLEdBQUosSUFBSSxDQUF3QjtZQUNwQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDaEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQTdDN0MsaUJBQVksR0FBNkIsU0FBUyxDQUFDO1lBc0MxQyxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzNELGdCQUFXLEdBQWdCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBUzNELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3BDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQzVDLENBQUM7UUFFUSxXQUFXLENBQUMsT0FBdUIsRUFBRSxDQUFnQztZQUM3RSxJQUFJLENBQUMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMxQyxDQUFDO1FBQ0YsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQzNDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLHFCQUFxQjtZQUM1QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLHNCQUFzQjtZQUVyRCw4RkFBOEY7WUFDOUYsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLGlCQUFpQixFQUFFLENBQUMsMkJBQTJCLENBQUM7WUFDcEcsTUFBTSxVQUFVLEdBQUcsc0JBQXNCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUMvRCxJQUFJLFVBQVUsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFDOUIsQ0FBQztZQUNELE1BQU0sWUFBWSxHQUFHLHNCQUFzQixDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDbkUsSUFBSSxZQUFZLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1lBQ2xDLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxzQkFBc0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3pELElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN4QixDQUFDO1lBRUQsSUFBSSxvQkFBb0IsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO1lBRTdDLFFBQVEsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUMzQixLQUFLLFNBQVM7b0JBQ2Isb0NBQW9DO29CQUNwQyxJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQWUsc0JBQXNCLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQzt3QkFDdkYsSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLEtBQUssRUFBRSxDQUFDOzRCQUNqQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7d0JBQzdCLENBQUMsQ0FBQyx3Q0FBd0M7b0JBQzNDLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxvQkFBb0IsR0FBRyxLQUFLLENBQUM7b0JBQzlCLENBQUM7b0JBQ0QsTUFBTTtnQkFDUCxLQUFLLElBQUk7b0JBQ1IsNkRBQTZEO29CQUM3RCxJQUFJLEtBQUssQ0FBQyxXQUFXLEtBQUssS0FBSyxFQUFFLENBQUM7d0JBQ2pDLG9CQUFvQixHQUFHLElBQUksQ0FBQztvQkFDN0IsQ0FBQyxDQUFDLHdDQUF3QztvQkFDMUMsTUFBTTtnQkFDUCxLQUFLLEtBQUs7b0JBQ1Qsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO29CQUM3QixNQUFNO1lBQ1IsQ0FBQztZQUVELElBQUksS0FBSyxDQUFDLFdBQVcsS0FBSyxvQkFBb0IsRUFBRSxDQUFDO2dCQUNoRCxPQUFPO29CQUNOLEdBQUcsS0FBSztvQkFDUixHQUFHLEVBQUUsV0FBVyxFQUFFLG9CQUFvQixFQUFFO2lCQUN4QyxDQUFDO1lBQ0gsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDakMsQ0FBQztRQUNGLENBQUM7UUFFRCxlQUFlLENBQUMsZ0JBQThDLEVBQUUsT0FBWTtZQUMzRSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3pELE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLGlEQUFpRDtZQUV2RSxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRUQsUUFBUSxDQUFDLGdCQUE4QyxFQUFFLE9BQVk7WUFDcEUsT0FBTztnQkFDTixHQUFHLElBQUksQ0FBQyxNQUFNO2dCQUNkLEdBQUc7b0JBQ0YsT0FBTyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDO2lCQUM3RTthQUNELENBQUM7UUFDSCxDQUFDO1FBRUQsZUFBZTtZQUNkLE9BQU87Z0JBQ04sR0FBRyxJQUFJLENBQUMsTUFBTTtnQkFDZCxHQUFHO29CQUNGLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtpQkFDaEM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVELGNBQWMsQ0FBQyxXQUFxQztZQUNuRCxJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztZQUNoQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQ0Q7SUFwSkQsOENBb0pDO0lBRUQsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUF1QixDQUFDLGFBQWEsQ0FBQyxDQUFDLHFCQUFxQixDQUFDO1FBQ2hHLEVBQUUsRUFBRSxVQUFVO1FBQ2QsS0FBSyxFQUFFLEdBQUc7UUFDVixJQUFJLEVBQUUsUUFBUTtRQUNkLFlBQVksRUFBRTtZQUNiLHNCQUFzQixFQUFFO2dCQUN2QixJQUFJLEVBQUUsUUFBUTtnQkFDZCxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDO2dCQUNuQixPQUFPLEVBQUUsS0FBSztnQkFDZCxtQkFBbUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSwwREFBMEQsQ0FBQzthQUNqSDtTQUNEO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sc0JBQXVCLFNBQVEsaUJBQU87UUFDM0Q7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDRCQUE0QjtnQkFDaEMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDRCQUE0QixFQUFFLDhCQUE4QixDQUFDO2dCQUM5RSxZQUFZLEVBQUUsNkNBQXVCO2dCQUNyQyxJQUFJLEVBQUU7b0JBQ0w7d0JBQ0MsRUFBRSxFQUFFLGdCQUFNLENBQUMsZUFBZTt3QkFDMUIsS0FBSyxFQUFFLGdCQUFnQjt3QkFDdkIsS0FBSyxFQUFFLENBQUM7d0JBQ1IsSUFBSSxFQUFFLDJCQUFjLENBQUMsTUFBTSxDQUFDLCtCQUErQixFQUFFLElBQUksQ0FBQztxQkFDbEU7aUJBQUM7Z0JBQ0gsUUFBUSxFQUFFLHVDQUF5QjtnQkFDbkMsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsT0FBTyxFQUFFO29CQUNSLFNBQVMsRUFBRSwyQkFBYyxDQUFDLFNBQVMsQ0FBQyw2QkFBNkIsRUFBRSxLQUFLLENBQUM7b0JBQ3pFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSx1QkFBdUIsQ0FBQztpQkFDcEU7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUNuQyxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUNqRSxNQUFNLGVBQWUsR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQWUsc0JBQXNCLENBQUMsS0FBSyxJQUFJLENBQUM7WUFFckcsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDckIsb0JBQW9CLENBQUMsV0FBVyxDQUFDLHNCQUFzQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDaEUsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsTUFBTSw0QkFBNkIsU0FBUSxxQ0FBdUI7UUFDakY7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGlDQUFpQztnQkFDckMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHVDQUF1QyxFQUFFLHdCQUF3QixDQUFDO2dCQUNsRixZQUFZLEVBQUUsaUNBQW1CLENBQUMsU0FBUyxDQUFDLG1DQUFrQixDQUFDO2dCQUMvRCxJQUFJLEVBQUUsQ0FBQzt3QkFDTixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxpQkFBaUI7d0JBQzVCLEtBQUssRUFBRSxNQUFNO3dCQUNiLEtBQUssRUFBRSxDQUFDO3FCQUNSLENBQUM7Z0JBQ0YsT0FBTyxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUN6QixnREFBMEIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQzFDLDJCQUFjLENBQUMsR0FBRyxDQUFDLGdEQUEwQixDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUMvSDthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQTBCLEVBQUUsT0FBb0U7WUFDcEgsSUFBSSxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7Z0JBQ2pFLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNwQyxJQUFJLENBQUMsVUFBVSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDO1FBRU8sVUFBVSxDQUFDLG9CQUEyQyxFQUFFLElBQW9CO1lBQ25GLE1BQU0saUJBQWlCLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFlLHNCQUFzQixDQUFDLEtBQUssSUFBSSxDQUFDO1lBQ3ZHLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDekMsMkJBQTJCO1lBQzNCLHdCQUF3QjtZQUN4QixzQkFBc0I7WUFDdEIsNEJBQTRCO1lBQzVCLHlCQUF5QjtZQUN6Qix1QkFBdUI7WUFDdkIsTUFBTSxxQkFBcUIsR0FBRyxlQUFlLEtBQUssSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxDQUFDO1lBRS9HLElBQUkscUJBQXFCLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDMUIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLENBQUM7UUFFRixDQUFDO0tBQ0QsQ0FBQyxDQUFDIn0=