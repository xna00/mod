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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/services/resolverService", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, event_1, lifecycle_1, resources_1, resolverService_1, textfiles_1) {
    "use strict";
    var CustomTextEditorModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomTextEditorModel = void 0;
    let CustomTextEditorModel = CustomTextEditorModel_1 = class CustomTextEditorModel extends lifecycle_1.Disposable {
        static async create(instantiationService, viewType, resource) {
            return instantiationService.invokeFunction(async (accessor) => {
                const textModelResolverService = accessor.get(resolverService_1.ITextModelService);
                const model = await textModelResolverService.createModelReference(resource);
                return instantiationService.createInstance(CustomTextEditorModel_1, viewType, resource, model);
            });
        }
        constructor(viewType, _resource, _model, textFileService) {
            super();
            this.viewType = viewType;
            this._resource = _resource;
            this._model = _model;
            this.textFileService = textFileService;
            this._onDidChangeOrphaned = this._register(new event_1.Emitter());
            this.onDidChangeOrphaned = this._onDidChangeOrphaned.event;
            this._onDidChangeReadonly = this._register(new event_1.Emitter());
            this.onDidChangeReadonly = this._onDidChangeReadonly.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._register(_model);
            this._textFileModel = this.textFileService.files.get(_resource);
            if (this._textFileModel) {
                this._register(this._textFileModel.onDidChangeOrphaned(() => this._onDidChangeOrphaned.fire()));
                this._register(this._textFileModel.onDidChangeReadonly(() => this._onDidChangeReadonly.fire()));
            }
            this._register(this.textFileService.files.onDidChangeDirty(e => {
                if ((0, resources_1.isEqual)(this.resource, e.resource)) {
                    this._onDidChangeDirty.fire();
                    this._onDidChangeContent.fire();
                }
            }));
        }
        get resource() {
            return this._resource;
        }
        isReadonly() {
            return this._model.object.isReadonly();
        }
        get backupId() {
            return undefined;
        }
        get canHotExit() {
            return true; // ensured via backups from text file models
        }
        isDirty() {
            return this.textFileService.isDirty(this.resource);
        }
        isOrphaned() {
            return !!this._textFileModel?.hasState(4 /* TextFileEditorModelState.ORPHAN */);
        }
        async revert(options) {
            return this.textFileService.revert(this.resource, options);
        }
        saveCustomEditor(options) {
            return this.textFileService.save(this.resource, options);
        }
        async saveCustomEditorAs(resource, targetResource, options) {
            return !!await this.textFileService.saveAs(resource, targetResource, options);
        }
    };
    exports.CustomTextEditorModel = CustomTextEditorModel;
    exports.CustomTextEditorModel = CustomTextEditorModel = CustomTextEditorModel_1 = __decorate([
        __param(3, textfiles_1.ITextFileService)
    ], CustomTextEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tVGV4dEVkaXRvck1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jdXN0b21FZGl0b3IvY29tbW9uL2N1c3RvbVRleHRFZGl0b3JNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0scUJBQXFCLDZCQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBRTdDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUN6QixvQkFBMkMsRUFDM0MsUUFBZ0IsRUFDaEIsUUFBYTtZQUViLE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBQyxRQUFRLEVBQUMsRUFBRTtnQkFDM0QsTUFBTSx3QkFBd0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG1DQUFpQixDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sS0FBSyxHQUFHLE1BQU0sd0JBQXdCLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzVFLE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVCQUFxQixFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDOUYsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBVUQsWUFDaUIsUUFBZ0IsRUFDZixTQUFjLEVBQ2QsTUFBNEMsRUFDM0MsZUFBa0Q7WUFFcEUsS0FBSyxFQUFFLENBQUM7WUFMUSxhQUFRLEdBQVIsUUFBUSxDQUFRO1lBQ2YsY0FBUyxHQUFULFNBQVMsQ0FBSztZQUNkLFdBQU0sR0FBTixNQUFNLENBQXNDO1lBQzFCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQVZwRCx5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZ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