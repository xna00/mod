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
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/quickinput/common/quickInput", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls_1, contextkey_1, keybinding_1, quickInput_1, lifecycle_1, editorBrowser_1, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PickerEditorState = exports.defaultQuickAccessContext = exports.defaultQuickAccessContextKeyValue = exports.inQuickPickContext = exports.InQuickPickContextKey = exports.inQuickPickContextKeyValue = void 0;
    exports.getQuickNavigateHandler = getQuickNavigateHandler;
    exports.inQuickPickContextKeyValue = 'inQuickOpen';
    exports.InQuickPickContextKey = new contextkey_1.RawContextKey(exports.inQuickPickContextKeyValue, false, (0, nls_1.localize)('inQuickOpen', "Whether keyboard focus is inside the quick open control"));
    exports.inQuickPickContext = contextkey_1.ContextKeyExpr.has(exports.inQuickPickContextKeyValue);
    exports.defaultQuickAccessContextKeyValue = 'inFilesPicker';
    exports.defaultQuickAccessContext = contextkey_1.ContextKeyExpr.and(exports.inQuickPickContext, contextkey_1.ContextKeyExpr.has(exports.defaultQuickAccessContextKeyValue));
    function getQuickNavigateHandler(id, next) {
        return accessor => {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keys = keybindingService.lookupKeybindings(id);
            const quickNavigate = { keybindings: keys };
            quickInputService.navigate(!!next, quickNavigate);
        };
    }
    let PickerEditorState = class PickerEditorState extends lifecycle_1.Disposable {
        constructor(editorService, editorGroupsService) {
            super();
            this.editorService = editorService;
            this.editorGroupsService = editorGroupsService;
            this._editorViewState = undefined;
            this.openedTransientEditors = new Set(); // editors that were opened between set and restore
        }
        set() {
            if (this._editorViewState) {
                return; // return early if already done
            }
            const activeEditorPane = this.editorService.activeEditorPane;
            if (activeEditorPane) {
                this._editorViewState = {
                    group: activeEditorPane.group,
                    editor: activeEditorPane.input,
                    state: (0, editorBrowser_1.getIEditor)(activeEditorPane.getControl())?.saveViewState() ?? undefined,
                };
            }
        }
        /**
         * Open a transient editor such that it may be closed when the state is restored.
         * Note that, when the state is restored, if the editor is no longer transient, it will not be closed.
         */
        async openTransientEditor(editor, group) {
            editor.options = { ...editor.options, transient: true };
            const editorPane = await this.editorService.openEditor(editor, group);
            if (editorPane?.input && editorPane.input !== this._editorViewState?.editor && editorPane.group.isTransient(editorPane.input)) {
                this.openedTransientEditors.add(editorPane.input);
            }
            return editorPane;
        }
        async restore() {
            if (this._editorViewState) {
                for (const editor of this.openedTransientEditors) {
                    if (editor.isDirty()) {
                        continue;
                    }
                    for (const group of this.editorGroupsService.groups) {
                        if (group.isTransient(editor)) {
                            await group.closeEditor(editor, { preserveFocus: true });
                        }
                    }
                }
                await this._editorViewState.group.openEditor(this._editorViewState.editor, {
                    viewState: this._editorViewState.state,
                    preserveFocus: true // important to not close the picker as a result
                });
                this.reset();
            }
        }
        reset() {
            this._editorViewState = undefined;
            this.openedTransientEditors.clear();
        }
        dispose() {
            super.dispose();
            this.reset();
        }
    };
    exports.PickerEditorState = PickerEditorState;
    exports.PickerEditorState = PickerEditorState = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService)
    ], PickerEditorState);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2thY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3F1aWNrYWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXlDaEcsMERBVUM7SUFuQ1ksUUFBQSwwQkFBMEIsR0FBRyxhQUFhLENBQUM7SUFDM0MsUUFBQSxxQkFBcUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsa0NBQTBCLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSx5REFBeUQsQ0FBQyxDQUFDLENBQUM7SUFDMUssUUFBQSxrQkFBa0IsR0FBRywyQkFBYyxDQUFDLEdBQUcsQ0FBQyxrQ0FBMEIsQ0FBQyxDQUFDO0lBRXBFLFFBQUEsaUNBQWlDLEdBQUcsZUFBZSxDQUFDO0lBQ3BELFFBQUEseUJBQXlCLEdBQUcsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMEJBQWtCLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMseUNBQWlDLENBQUMsQ0FBQyxDQUFDO0lBb0J2SSxTQUFnQix1QkFBdUIsQ0FBQyxFQUFVLEVBQUUsSUFBYztRQUNqRSxPQUFPLFFBQVEsQ0FBQyxFQUFFO1lBQ2pCLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1lBQzNELE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1lBRTNELE1BQU0sSUFBSSxHQUFHLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sYUFBYSxHQUFHLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDO1lBRTVDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFF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