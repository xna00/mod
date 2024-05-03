/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor/editorModel"], function (require, exports, editorModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorModel = void 0;
    /**
     * The base editor model for the diff editor. It is made up of two editor models, the original version
     * and the modified version.
     */
    class DiffEditorModel extends editorModel_1.EditorModel {
        get originalModel() { return this._originalModel; }
        get modifiedModel() { return this._modifiedModel; }
        constructor(originalModel, modifiedModel) {
            super();
            this._originalModel = originalModel;
            this._modifiedModel = modifiedModel;
        }
        async resolve() {
            await Promise.all([
                this._originalModel?.resolve(),
                this._modifiedModel?.resolve()
            ]);
        }
        isResolved() {
            return !!(this._originalModel?.isResolved() && this._modifiedModel?.isResolved());
        }
        dispose() {
            // Do not propagate the dispose() call to the two models inside. We never created the two models
            // (original and modified) so we can not dispose them without sideeffects. Rather rely on the
            // models getting disposed when their related inputs get disposed from the diffEditorInput.
            super.dispose();
        }
    }
    exports.DiffEditorModel = DiffEditorModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvck1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29tbW9uL2VkaXRvci9kaWZmRWRpdG9yTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHOzs7T0FHRztJQUNILE1BQWEsZUFBZ0IsU0FBUSx5QkFBVztRQUcvQyxJQUFJLGFBQWEsS0FBeUMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUd2RixJQUFJLGFBQWEsS0FBeUMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUV2RixZQUFZLGFBQWlELEVBQUUsYUFBaUQ7WUFDL0csS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztZQUNwQyxJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztRQUNyQyxDQUFDO1FBRVEsS0FBSyxDQUFDLE9BQU87WUFDckIsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO2dCQUNqQixJQUFJLENBQUMsY0FBYyxFQUFFLE9BQU8sRUFBRTtnQkFDOUIsSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLEVBQUU7YUFDOUIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLFVBQVU7WUFDbEIsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUNuRixDQUFDO1FBRVEsT0FBTztZQUVmLGdHQUFnRztZQUNoRyw2RkFBNkY7WUFDN0YsMkZBQTJGO1lBRTNGLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBQ0Q7SUFsQ0QsMENBa0NDIn0=