/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor/diffEditorModel"], function (require, exports, diffEditorModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextDiffEditorModel = void 0;
    /**
     * The base text editor model for the diff editor. It is made up of two text editor models, the original version
     * and the modified version.
     */
    class TextDiffEditorModel extends diffEditorModel_1.DiffEditorModel {
        get originalModel() { return this._originalModel; }
        get modifiedModel() { return this._modifiedModel; }
        get textDiffEditorModel() { return this._textDiffEditorModel; }
        constructor(originalModel, modifiedModel) {
            super(originalModel, modifiedModel);
            this._textDiffEditorModel = undefined;
            this._originalModel = originalModel;
            this._modifiedModel = modifiedModel;
            this.updateTextDiffEditorModel();
        }
        async resolve() {
            await super.resolve();
            this.updateTextDiffEditorModel();
        }
        updateTextDiffEditorModel() {
            if (this.originalModel?.isResolved() && this.modifiedModel?.isResolved()) {
                // Create new
                if (!this._textDiffEditorModel) {
                    this._textDiffEditorModel = {
                        original: this.originalModel.textEditorModel,
                        modified: this.modifiedModel.textEditorModel
                    };
                }
                // Update existing
                else {
                    this._textDiffEditorModel.original = this.originalModel.textEditorModel;
                    this._textDiffEditorModel.modified = this.modifiedModel.textEditorModel;
                }
            }
        }
        isResolved() {
            return !!this._textDiffEditorModel;
        }
        isReadonly() {
            return !!this.modifiedModel && this.modifiedModel.isReadonly();
        }
        dispose() {
            // Free the diff editor model but do not propagate the dispose() call to the two models
            // inside. We never created the two models (original and modified) so we can not dispose
            // them without sideeffects. Rather rely on the models getting disposed when their related
            // inputs get disposed from the diffEditorInput.
            this._textDiffEditorModel = undefined;
            super.dispose();
        }
    }
    exports.TextDiffEditorModel = TextDiffEditorModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dERpZmZFZGl0b3JNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9lZGl0b3IvdGV4dERpZmZFZGl0b3JNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEc7OztPQUdHO0lBQ0gsTUFBYSxtQkFBb0IsU0FBUSxpQ0FBZTtRQUd2RCxJQUFhLGFBQWEsS0FBc0MsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUc3RixJQUFhLGFBQWEsS0FBc0MsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUc3RixJQUFJLG1CQUFtQixLQUFtQyxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFFN0YsWUFBWSxhQUFrQyxFQUFFLGFBQWtDO1lBQ2pGLEtBQUssQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFKN0IseUJBQW9CLEdBQWlDLFNBQVMsQ0FBQztZQU10RSxJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztZQUNwQyxJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztZQUVwQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUNsQyxDQUFDO1FBRVEsS0FBSyxDQUFDLE9BQU87WUFDckIsTUFBTSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFdEIsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUVPLHlCQUF5QjtZQUNoQyxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUUxRSxhQUFhO2dCQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLG9CQUFvQixHQUFHO3dCQUMzQixRQUFRLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlO3dCQUM1QyxRQUFRLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlO3FCQUM1QyxDQUFDO2dCQUNILENBQUM7Z0JBRUQsa0JBQWtCO3FCQUNiLENBQUM7b0JBQ0wsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQztvQkFDeEUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQztnQkFDekUsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRVEsVUFBVTtZQUNsQixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUM7UUFDcEMsQ0FBQztRQUVELFVBQVU7WUFDVCxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDaEUsQ0FBQztRQUVRLE9BQU87WUFFZix1RkFBdUY7WUFDdkYsd0ZBQXdGO1lBQ3hGLDBGQUEwRjtZQUMxRixnREFBZ0Q7WUFDaEQsSUFBSSxDQUFDLG9CQUFvQixHQUFHLFNBQVMsQ0FBQztZQUV0QyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztLQUNEO0lBL0RELGtEQStEQyJ9