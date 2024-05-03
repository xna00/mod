/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/browser/parts/editor/editorTabsControl", "vs/base/browser/dom", "vs/css!./media/singleeditortabscontrol"], function (require, exports, editorTabsControl_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoEditorTabsControl = void 0;
    class NoEditorTabsControl extends editorTabsControl_1.EditorTabsControl {
        constructor() {
            super(...arguments);
            this.activeEditor = null;
        }
        prepareEditorActions(editorActions) {
            return {
                primary: [],
                secondary: []
            };
        }
        openEditor(editor) {
            return this.handleOpenedEditors();
        }
        openEditors(editors) {
            return this.handleOpenedEditors();
        }
        handleOpenedEditors() {
            const didChange = this.activeEditorChanged();
            this.activeEditor = this.tabsModel.activeEditor;
            return didChange;
        }
        activeEditorChanged() {
            if (!this.activeEditor && this.tabsModel.activeEditor || // active editor changed from null => editor
                this.activeEditor && !this.tabsModel.activeEditor || // active editor changed from editor => null
                (!this.activeEditor || !this.tabsModel.isActive(this.activeEditor)) // active editor changed from editorA => editorB
            ) {
                return true;
            }
            return false;
        }
        beforeCloseEditor(editor) { }
        closeEditor(editor) { }
        closeEditors(editors) { }
        moveEditor(editor, fromIndex, targetIndex) { }
        pinEditor(editor) { }
        stickEditor(editor) { }
        unstickEditor(editor) { }
        setActive(isActive) { }
        updateEditorLabel(editor) { }
        updateEditorDirty(editor) { }
        getHeight() {
            return 0;
        }
        layout(dimensions) {
            return new dom_1.Dimension(dimensions.container.width, this.getHeight());
        }
    }
    exports.NoEditorTabsControl = NoEditorTabsControl;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9FZGl0b3JUYWJzQ29udHJvbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL25vRWRpdG9yVGFic0NvbnRyb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsbUJBQW9CLFNBQVEscUNBQWlCO1FBQTFEOztZQUNTLGlCQUFZLEdBQXVCLElBQUksQ0FBQztRQTZEakQsQ0FBQztRQTNEVSxvQkFBb0IsQ0FBQyxhQUE4QjtZQUM1RCxPQUFPO2dCQUNOLE9BQU8sRUFBRSxFQUFFO2dCQUNYLFNBQVMsRUFBRSxFQUFFO2FBQ2IsQ0FBQztRQUNILENBQUM7UUFFRCxVQUFVLENBQUMsTUFBbUI7WUFDN0IsT0FBTyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRUQsV0FBVyxDQUFDLE9BQXNCO1lBQ2pDLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDbkMsQ0FBQztRQUVPLG1CQUFtQjtZQUMxQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUM3QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDO1lBQ2hELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFTyxtQkFBbUI7WUFDMUIsSUFDQyxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLElBQVEsNENBQTRDO2dCQUNyRyxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLElBQVEsNENBQTRDO2dCQUNyRyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGdEQUFnRDtjQUNuSCxDQUFDO2dCQUNGLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELGlCQUFpQixDQUFDLE1BQW1CLElBQVUsQ0FBQztRQUVoRCxXQUFXLENBQUMsTUFBbUIsSUFBVSxDQUFDO1FBRTFDLFlBQVksQ0FBQyxPQUFzQixJQUFVLENBQUM7UUFFOUMsVUFBVSxDQUFDLE1BQW1CLEVBQUUsU0FBaUIsRUFBRSxXQUFtQixJQUFVLENBQUM7UUFFakYsU0FBUyxDQUFDLE1BQW1CLElBQVUsQ0FBQztRQUV4QyxXQUFXLENBQUMsTUFBbUIsSUFBVSxDQUFDO1FBRTFDLGFBQWEsQ0FBQyxNQUFtQixJQUFVLENBQUM7UUFFNUMsU0FBUyxDQUFDLFFBQWlCLElBQVUsQ0FBQztRQUV0QyxpQkFBaUIsQ0FBQyxNQUFtQixJQUFVLENBQUM7UUFFaEQsaUJBQWlCLENBQUMsTUFBbUIsSUFBVSxDQUFDO1FBRWhELFNBQVM7WUFDUixPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7UUFFRCxNQUFNLENBQUMsVUFBeUM7WUFDL0MsT0FBTyxJQUFJLGVBQVMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUNwRSxDQUFDO0tBQ0Q7SUE5REQsa0RBOERDIn0=