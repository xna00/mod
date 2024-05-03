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
define(["require", "exports", "vs/nls", "vs/workbench/common/editor", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/editor/binaryEditor", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls_1, editor_1, telemetry_1, themeService_1, sideBySideEditor_1, instantiation_1, binaryEditor_1, storage_1, configuration_1, textResourceConfiguration_1, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BinaryResourceDiffEditor = void 0;
    /**
     * An implementation of editor for diffing binary files like images or videos.
     */
    let BinaryResourceDiffEditor = class BinaryResourceDiffEditor extends sideBySideEditor_1.SideBySideEditor {
        static { this.ID = editor_1.BINARY_DIFF_EDITOR_ID; }
        constructor(group, telemetryService, instantiationService, themeService, storageService, configurationService, textResourceConfigurationService, editorService, editorGroupService) {
            super(group, telemetryService, instantiationService, themeService, storageService, configurationService, textResourceConfigurationService, editorService, editorGroupService);
        }
        getMetadata() {
            const primary = this.getPrimaryEditorPane();
            const secondary = this.getSecondaryEditorPane();
            if (primary instanceof binaryEditor_1.BaseBinaryResourceEditor && secondary instanceof binaryEditor_1.BaseBinaryResourceEditor) {
                return (0, nls_1.localize)('metadataDiff', "{0} ↔ {1}", secondary.getMetadata(), primary.getMetadata());
            }
            return undefined;
        }
    };
    exports.BinaryResourceDiffEditor = BinaryResourceDiffEditor;
    exports.BinaryResourceDiffEditor = BinaryResourceDiffEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService),
        __param(4, storage_1.IStorageService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, editorService_1.IEditorService),
        __param(8, editorGroupsService_1.IEditorGroupsService)
    ], BinaryResourceDiffEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluYXJ5RGlmZkVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2JpbmFyeURpZmZFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZWhHOztPQUVHO0lBQ0ksSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxtQ0FBZ0I7aUJBRXBDLE9BQUUsR0FBRyw4QkFBcUIsQUFBeEIsQ0FBeUI7UUFFcEQsWUFDQyxLQUFtQixFQUNBLGdCQUFtQyxFQUMvQixvQkFBMkMsRUFDbkQsWUFBMkIsRUFDekIsY0FBK0IsRUFDekIsb0JBQTJDLEVBQy9CLGdDQUFtRSxFQUN0RixhQUE2QixFQUN2QixrQkFBd0M7WUFFOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLG9CQUFvQixFQUFFLGdDQUFnQyxFQUFFLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQy9LLENBQUM7UUFFRCxXQUFXO1lBQ1YsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDNUMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFFaEQsSUFBSSxPQUFPLFlBQVksdUNBQXdCLElBQUksU0FBUyxZQUFZLHVDQUF3QixFQUFFLENBQUM7Z0JBQ2xHLE9BQU8sSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsV0FBVyxFQUFFLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDOUYsQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7O0lBM0JXLDREQUF3Qjt1Q0FBeEIsd0JBQXdCO1FBTWxDLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDRCQUFhLENBQUE7UUFDYixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsNkRBQWlDLENBQUE7UUFDakMsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSwwQ0FBb0IsQ0FBQTtPQWJWLHdCQUF3QixDQTRCcEMifQ==