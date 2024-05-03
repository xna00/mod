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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/editorModel", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, editor_1, editorModel_1, diffEditorInput_1, notebookEditorInput_1, editorService_1) {
    "use strict";
    var NotebookDiffEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookDiffEditorInput = void 0;
    class NotebookDiffEditorModel extends editorModel_1.EditorModel {
        constructor(original, modified) {
            super();
            this.original = original;
            this.modified = modified;
        }
    }
    let NotebookDiffEditorInput = class NotebookDiffEditorInput extends diffEditorInput_1.DiffEditorInput {
        static { NotebookDiffEditorInput_1 = this; }
        static create(instantiationService, resource, name, description, originalResource, viewType) {
            const original = notebookEditorInput_1.NotebookEditorInput.getOrCreate(instantiationService, originalResource, undefined, viewType);
            const modified = notebookEditorInput_1.NotebookEditorInput.getOrCreate(instantiationService, resource, undefined, viewType);
            return instantiationService.createInstance(NotebookDiffEditorInput_1, name, description, original, modified, viewType);
        }
        static { this.ID = 'workbench.input.diffNotebookInput'; }
        get resource() {
            return this.modified.resource;
        }
        get editorId() {
            return this.viewType;
        }
        constructor(name, description, original, modified, viewType, editorService) {
            super(name, description, original, modified, undefined, editorService);
            this.original = original;
            this.modified = modified;
            this.viewType = viewType;
            this._modifiedTextModel = null;
            this._originalTextModel = null;
            this._cachedModel = undefined;
        }
        get typeId() {
            return NotebookDiffEditorInput_1.ID;
        }
        async resolve() {
            const [originalEditorModel, modifiedEditorModel] = await Promise.all([
                this.original.resolve(),
                this.modified.resolve(),
            ]);
            this._cachedModel?.dispose();
            // TODO@rebornix check how we restore the editor in text diff editor
            if (!modifiedEditorModel) {
                throw new Error(`Fail to resolve modified editor model for resource ${this.modified.resource} with notebookType ${this.viewType}`);
            }
            if (!originalEditorModel) {
                throw new Error(`Fail to resolve original editor model for resource ${this.original.resource} with notebookType ${this.viewType}`);
            }
            this._originalTextModel = originalEditorModel;
            this._modifiedTextModel = modifiedEditorModel;
            this._cachedModel = new NotebookDiffEditorModel(this._originalTextModel, this._modifiedTextModel);
            return this._cachedModel;
        }
        toUntyped() {
            const original = { resource: this.original.resource };
            const modified = { resource: this.resource };
            return {
                original,
                modified,
                primary: modified,
                secondary: original,
                options: {
                    override: this.viewType
                }
            };
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if (otherInput instanceof NotebookDiffEditorInput_1) {
                return this.modified.matches(otherInput.modified)
                    && this.original.matches(otherInput.original)
                    && this.viewType === otherInput.viewType;
            }
            if ((0, editor_1.isResourceDiffEditorInput)(otherInput)) {
                return this.modified.matches(otherInput.modified)
                    && this.original.matches(otherInput.original)
                    && this.editorId !== undefined
                    && (this.editorId === otherInput.options?.override || otherInput.options?.override === undefined);
            }
            return false;
        }
        dispose() {
            super.dispose();
            this._cachedModel?.dispose();
            this._cachedModel = undefined;
            this.original.dispose();
            this.modified.dispose();
            this._originalTextModel = null;
            this._modifiedTextModel = null;
        }
    };
    exports.NotebookDiffEditorInput = NotebookDiffEditorInput;
    exports.NotebookDiffEditorInput = NotebookDiffEditorInput = NotebookDiffEditorInput_1 = __decorate([
        __param(5, editorService_1.IEditorService)
    ], NotebookDiffEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tEaWZmRWRpdG9ySW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2NvbW1vbi9ub3RlYm9va0RpZmZFZGl0b3JJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBWWhHLE1BQU0sdUJBQXdCLFNBQVEseUJBQVc7UUFDaEQsWUFDVSxRQUFzQyxFQUN0QyxRQUFzQztZQUUvQyxLQUFLLEVBQUUsQ0FBQztZQUhDLGFBQVEsR0FBUixRQUFRLENBQThCO1lBQ3RDLGFBQVEsR0FBUixRQUFRLENBQThCO1FBR2hELENBQUM7S0FDRDtJQUVNLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsaUNBQWU7O1FBQzNELE1BQU0sQ0FBQyxNQUFNLENBQUMsb0JBQTJDLEVBQUUsUUFBYSxFQUFFLElBQXdCLEVBQUUsV0FBK0IsRUFBRSxnQkFBcUIsRUFBRSxRQUFnQjtZQUMzSyxNQUFNLFFBQVEsR0FBRyx5Q0FBbUIsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzlHLE1BQU0sUUFBUSxHQUFHLHlDQUFtQixDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3RHLE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLHlCQUF1QixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0SCxDQUFDO2lCQUV3QixPQUFFLEdBQVcsbUNBQW1DLEFBQTlDLENBQStDO1FBSzFFLElBQWEsUUFBUTtZQUNwQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFhLFFBQVE7WUFDcEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFJRCxZQUNDLElBQXdCLEVBQ3hCLFdBQStCLEVBQ2IsUUFBNkIsRUFDN0IsUUFBNkIsRUFDL0IsUUFBZ0IsRUFDaEIsYUFBNkI7WUFFN0MsS0FBSyxDQUNKLElBQUksRUFDSixXQUFXLEVBQ1gsUUFBUSxFQUNSLFFBQVEsRUFDUixTQUFTLEVBQ1QsYUFBYSxDQUNiLENBQUM7WUFaZ0IsYUFBUSxHQUFSLFFBQVEsQ0FBcUI7WUFDN0IsYUFBUSxHQUFSLFFBQVEsQ0FBcUI7WUFDL0IsYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQWxCekIsdUJBQWtCLEdBQXdDLElBQUksQ0FBQztZQUMvRCx1QkFBa0IsR0FBd0MsSUFBSSxDQUFDO1lBVS9ELGlCQUFZLEdBQXdDLFNBQVMsQ0FBQztRQWtCdEUsQ0FBQztRQUVELElBQWEsTUFBTTtZQUNsQixPQUFPLHlCQUF1QixDQUFDLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRVEsS0FBSyxDQUFDLE9BQU87WUFDckIsTUFBTSxDQUFDLG1CQUFtQixFQUFFLG1CQUFtQixDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO2dCQUNwRSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtnQkFDdkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7YUFDdkIsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUU3QixvRUFBb0U7WUFDcEUsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0RBQXNELElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxzQkFBc0IsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDcEksQ0FBQztZQUVELElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLHNEQUFzRCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsc0JBQXNCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3BJLENBQUM7WUFFRCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsbUJBQW1CLENBQUM7WUFDOUMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLG1CQUFtQixDQUFDO1lBQzlDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDbEcsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFFUSxTQUFTO1lBQ2pCLE1BQU0sUUFBUSxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdEQsTUFBTSxRQUFRLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzdDLE9BQU87Z0JBQ04sUUFBUTtnQkFDUixRQUFRO2dCQUNSLE9BQU8sRUFBRSxRQUFRO2dCQUNqQixTQUFTLEVBQUUsUUFBUTtnQkFDbkIsT0FBTyxFQUFFO29CQUNSLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtpQkFDdkI7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVRLE9BQU8sQ0FBQyxVQUE2QztZQUM3RCxJQUFJLElBQUksS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsSUFBSSxVQUFVLFlBQVkseUJBQXVCLEVBQUUsQ0FBQztnQkFDbkQsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO3VCQUM3QyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO3VCQUMxQyxJQUFJLENBQUMsUUFBUSxLQUFLLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDM0MsQ0FBQztZQUVELElBQUksSUFBQSxrQ0FBeUIsRUFBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUMzQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7dUJBQzdDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7dUJBQzFDLElBQUksQ0FBQyxRQUFRLEtBQUssU0FBUzt1QkFDM0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLFVBQVUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxLQUFLLFNBQVMsQ0FBQyxDQUFDO1lBQ3BHLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUM7WUFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7WUFDL0IsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztRQUNoQyxDQUFDOztJQTlHVywwREFBdUI7c0NBQXZCLHVCQUF1QjtRQTRCakMsV0FBQSw4QkFBYyxDQUFBO09BNUJKLHVCQUF1QixDQStHbkMifQ==