/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/workbench/common/editor/editorOptions", "vs/platform/contextkey/common/contextkey", "vs/base/common/resources", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/workbench/browser/parts/editor/textEditor"], function (require, exports, nls_1, types_1, editorOptions_1, contextkey_1, resources_1, codeEditorWidget_1, textEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractTextCodeEditor = void 0;
    /**
     * A text editor using the code editor widget.
     */
    class AbstractTextCodeEditor extends textEditor_1.AbstractTextEditor {
        constructor() {
            super(...arguments);
            this.editorControl = undefined;
        }
        get scopedContextKeyService() {
            return this.editorControl?.invokeWithinContext(accessor => accessor.get(contextkey_1.IContextKeyService));
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('textEditor', "Text Editor");
        }
        createEditorControl(parent, initialOptions) {
            this.editorControl = this._register(this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, parent, initialOptions, this.getCodeEditorWidgetOptions()));
        }
        getCodeEditorWidgetOptions() {
            return Object.create(null);
        }
        updateEditorControlOptions(options) {
            this.editorControl?.updateOptions(options);
        }
        getMainControl() {
            return this.editorControl;
        }
        getControl() {
            return this.editorControl;
        }
        computeEditorViewState(resource) {
            if (!this.editorControl) {
                return undefined;
            }
            const model = this.editorControl.getModel();
            if (!model) {
                return undefined; // view state always needs a model
            }
            const modelUri = model.uri;
            if (!modelUri) {
                return undefined; // model URI is needed to make sure we save the view state correctly
            }
            if (!(0, resources_1.isEqual)(modelUri, resource)) {
                return undefined; // prevent saving view state for a model that is not the expected one
            }
            return this.editorControl.saveViewState() ?? undefined;
        }
        setOptions(options) {
            super.setOptions(options);
            if (options) {
                (0, editorOptions_1.applyTextEditorOptions)(options, (0, types_1.assertIsDefined)(this.editorControl), 0 /* ScrollType.Smooth */);
            }
        }
        focus() {
            super.focus();
            this.editorControl?.focus();
        }
        hasFocus() {
            return this.editorControl?.hasTextFocus() || super.hasFocus();
        }
        setEditorVisible(visible) {
            super.setEditorVisible(visible);
            if (visible) {
                this.editorControl?.onVisible();
            }
            else {
                this.editorControl?.onHide();
            }
        }
        layout(dimension) {
            this.editorControl?.layout(dimension);
        }
    }
    exports.AbstractTextCodeEditor = AbstractTextCodeEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dENvZGVFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci90ZXh0Q29kZUVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHOztPQUVHO0lBQ0gsTUFBc0Isc0JBQW1ELFNBQVEsK0JBQXFCO1FBQXRHOztZQUVXLGtCQUFhLEdBQTRCLFNBQVMsQ0FBQztRQXVGOUQsQ0FBQztRQXJGQSxJQUFhLHVCQUF1QjtZQUNuQyxPQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsbUJBQW1CLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUM5RixDQUFDO1FBRVEsUUFBUTtZQUNoQixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzdCLENBQUM7WUFFRCxPQUFPLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRVMsbUJBQW1CLENBQUMsTUFBbUIsRUFBRSxjQUFrQztZQUNwRixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtQ0FBZ0IsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1SixDQUFDO1FBRVMsMEJBQTBCO1lBQ25DLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBRVMsMEJBQTBCLENBQUMsT0FBMkI7WUFDL0QsSUFBSSxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVTLGNBQWM7WUFDdkIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzNCLENBQUM7UUFFUSxVQUFVO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRWtCLHNCQUFzQixDQUFDLFFBQWE7WUFDdEQsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDNUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU8sU0FBUyxDQUFDLENBQUMsa0NBQWtDO1lBQ3JELENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO1lBQzNCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPLFNBQVMsQ0FBQyxDQUFDLG9FQUFvRTtZQUN2RixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUEsbUJBQU8sRUFBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxTQUFTLENBQUMsQ0FBQyxxRUFBcUU7WUFDeEYsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQWtCLElBQUksU0FBUyxDQUFDO1FBQ3hFLENBQUM7UUFFUSxVQUFVLENBQUMsT0FBdUM7WUFDMUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUUxQixJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLElBQUEsc0NBQXNCLEVBQUMsT0FBTyxFQUFFLElBQUEsdUJBQWUsRUFBQyxJQUFJLENBQUMsYUFBYSxDQUFDLDRCQUFvQixDQUFDO1lBQ3pGLENBQUM7UUFDRixDQUFDO1FBRVEsS0FBSztZQUNiLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVkLElBQUksQ0FBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDN0IsQ0FBQztRQUVRLFFBQVE7WUFDaEIsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMvRCxDQUFDO1FBRWtCLGdCQUFnQixDQUFDLE9BQWdCO1lBQ25ELEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVoQyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLElBQUksQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLENBQUM7WUFDakMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxhQUFhLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUM7UUFFUSxNQUFNLENBQUMsU0FBb0I7WUFDbkMsSUFBSSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdkMsQ0FBQztLQUNEO0lBekZELHdEQXlGQyJ9