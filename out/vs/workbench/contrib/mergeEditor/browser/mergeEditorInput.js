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
define(["require", "exports", "vs/base/common/assert", "vs/base/common/observable", "vs/base/common/resources", "vs/base/common/types", "vs/editor/common/services/textResourceConfiguration", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/workbench/common/editor", "vs/workbench/services/editor/common/customEditorLabelService", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInputModel", "vs/workbench/contrib/mergeEditor/browser/telemetry", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, assert_1, observable_1, resources_1, types_1, textResourceConfiguration_1, nls_1, configuration_1, files_1, instantiation_1, label_1, editor_1, customEditorLabelService_1, textResourceEditorInput_1, mergeEditorInputModel_1, telemetry_1, editorService_1, filesConfigurationService_1, textfiles_1) {
    "use strict";
    var MergeEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorInput = exports.MergeEditorInputData = void 0;
    class MergeEditorInputData {
        constructor(uri, title, detail, description) {
            this.uri = uri;
            this.title = title;
            this.detail = detail;
            this.description = description;
        }
    }
    exports.MergeEditorInputData = MergeEditorInputData;
    let MergeEditorInput = class MergeEditorInput extends textResourceEditorInput_1.AbstractTextResourceEditorInput {
        static { MergeEditorInput_1 = this; }
        static { this.ID = 'mergeEditor.Input'; }
        get useWorkingCopy() {
            return this.configurationService.getValue('mergeEditor.useWorkingCopy') ?? false;
        }
        constructor(base, input1, input2, result, _instaService, editorService, textFileService, labelService, fileService, configurationService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService) {
            super(result, undefined, editorService, textFileService, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService);
            this.base = base;
            this.input1 = input1;
            this.input2 = input2;
            this.result = result;
            this._instaService = _instaService;
            this.configurationService = configurationService;
            this.closeHandler = {
                showConfirm: () => this._inputModel?.shouldConfirmClose() ?? false,
                confirm: async (editors) => {
                    (0, assert_1.assertFn)(() => editors.every(e => e.editor instanceof MergeEditorInput_1));
                    const inputModels = editors.map(e => e.editor._inputModel).filter(types_1.isDefined);
                    return await this._inputModel.confirmClose(inputModels);
                },
            };
            this.mergeEditorModeFactory = this._instaService.createInstance(this.useWorkingCopy
                ? mergeEditorInputModel_1.TempFileMergeEditorModeFactory
                : mergeEditorInputModel_1.WorkspaceMergeEditorModeFactory, this._instaService.createInstance(telemetry_1.MergeEditorTelemetry));
        }
        dispose() {
            super.dispose();
        }
        get typeId() {
            return MergeEditorInput_1.ID;
        }
        get editorId() {
            return editor_1.DEFAULT_EDITOR_ASSOCIATION.id;
        }
        get capabilities() {
            let capabilities = super.capabilities | 256 /* EditorInputCapabilities.MultipleEditors */;
            if (this.useWorkingCopy) {
                capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            }
            return capabilities;
        }
        getName() {
            return (0, nls_1.localize)('name', "Merging: {0}", super.getName());
        }
        async resolve() {
            if (!this._inputModel) {
                const inputModel = this._register(await this.mergeEditorModeFactory.createInputModel({
                    base: this.base,
                    input1: this.input1,
                    input2: this.input2,
                    result: this.result,
                }));
                this._inputModel = inputModel;
                this._register((0, observable_1.autorun)(reader => {
                    /** @description fire dirty event */
                    inputModel.isDirty.read(reader);
                    this._onDidChangeDirty.fire();
                }));
                await this._inputModel.model.onInitialized;
            }
            return this._inputModel;
        }
        async accept() {
            await this._inputModel?.accept();
        }
        async save(group, options) {
            await this._inputModel?.save(options);
            return undefined;
        }
        toUntyped() {
            return {
                input1: { resource: this.input1.uri, label: this.input1.title, description: this.input1.description, detail: this.input1.detail },
                input2: { resource: this.input2.uri, label: this.input2.title, description: this.input2.description, detail: this.input2.detail },
                base: { resource: this.base },
                result: { resource: this.result },
                options: {
                    override: this.typeId
                }
            };
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if (otherInput instanceof MergeEditorInput_1) {
                return (0, resources_1.isEqual)(this.base, otherInput.base)
                    && (0, resources_1.isEqual)(this.input1.uri, otherInput.input1.uri)
                    && (0, resources_1.isEqual)(this.input2.uri, otherInput.input2.uri)
                    && (0, resources_1.isEqual)(this.result, otherInput.result);
            }
            if ((0, editor_1.isResourceMergeEditorInput)(otherInput)) {
                return (this.editorId === otherInput.options?.override || otherInput.options?.override === undefined)
                    && (0, resources_1.isEqual)(this.base, otherInput.base.resource)
                    && (0, resources_1.isEqual)(this.input1.uri, otherInput.input1.resource)
                    && (0, resources_1.isEqual)(this.input2.uri, otherInput.input2.resource)
                    && (0, resources_1.isEqual)(this.result, otherInput.result.resource);
            }
            return false;
        }
        async revert(group, options) {
            return this._inputModel?.revert(options);
        }
        // ---- FileEditorInput
        isDirty() {
            return this._inputModel?.isDirty.get() ?? false;
        }
        setLanguageId(languageId, source) {
            this._inputModel?.model.setLanguageId(languageId, source);
        }
    };
    exports.MergeEditorInput = MergeEditorInput;
    exports.MergeEditorInput = MergeEditorInput = MergeEditorInput_1 = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, editorService_1.IEditorService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, label_1.ILabelService),
        __param(8, files_1.IFileService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, filesConfigurationService_1.IFilesConfigurationService),
        __param(11, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(12, customEditorLabelService_1.ICustomEditorLabelService)
    ], MergeEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvYnJvd3Nlci9tZXJnZUVkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF1QmhHLE1BQWEsb0JBQW9CO1FBQ2hDLFlBQ1UsR0FBUSxFQUNSLEtBQXlCLEVBQ3pCLE1BQTBCLEVBQzFCLFdBQStCO1lBSC9CLFFBQUcsR0FBSCxHQUFHLENBQUs7WUFDUixVQUFLLEdBQUwsS0FBSyxDQUFvQjtZQUN6QixXQUFNLEdBQU4sTUFBTSxDQUFvQjtZQUMxQixnQkFBVyxHQUFYLFdBQVcsQ0FBb0I7UUFDckMsQ0FBQztLQUNMO0lBUEQsb0RBT0M7SUFFTSxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHlEQUErQjs7aUJBQ3BELE9BQUUsR0FBRyxtQkFBbUIsQUFBdEIsQ0FBdUI7UUFhekMsSUFBWSxjQUFjO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLEtBQUssQ0FBQztRQUNsRixDQUFDO1FBRUQsWUFDaUIsSUFBUyxFQUNULE1BQTRCLEVBQzVCLE1BQTRCLEVBQzVCLE1BQVcsRUFDSixhQUFxRCxFQUM1RCxhQUE2QixFQUMzQixlQUFpQyxFQUNwQyxZQUEyQixFQUM1QixXQUF5QixFQUNoQixvQkFBNEQsRUFDdkQseUJBQXFELEVBQzlDLGdDQUFtRSxFQUMzRSx3QkFBbUQ7WUFFOUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLHlCQUF5QixFQUFFLGdDQUFnQyxFQUFFLHdCQUF3QixDQUFDLENB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