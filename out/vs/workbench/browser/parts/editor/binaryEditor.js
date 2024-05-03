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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/workbench/common/editor/binaryEditorModel", "vs/platform/storage/common/storage", "vs/platform/files/common/files", "vs/workbench/browser/parts/editor/editorPlaceholder"], function (require, exports, nls_1, event_1, binaryEditorModel_1, storage_1, files_1, editorPlaceholder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseBinaryResourceEditor = void 0;
    /*
     * This class is only intended to be subclassed and not instantiated.
     */
    let BaseBinaryResourceEditor = class BaseBinaryResourceEditor extends editorPlaceholder_1.EditorPlaceholder {
        constructor(id, group, callbacks, telemetryService, themeService, storageService) {
            super(id, group, telemetryService, themeService, storageService);
            this.callbacks = callbacks;
            this._onDidChangeMetadata = this._register(new event_1.Emitter());
            this.onDidChangeMetadata = this._onDidChangeMetadata.event;
            this._onDidOpenInPlace = this._register(new event_1.Emitter());
            this.onDidOpenInPlace = this._onDidOpenInPlace.event;
        }
        getTitle() {
            return this.input ? this.input.getName() : (0, nls_1.localize)('binaryEditor', "Binary Viewer");
        }
        async getContents(input, options) {
            const model = await input.resolve();
            // Assert Model instance
            if (!(model instanceof binaryEditorModel_1.BinaryEditorModel)) {
                throw new Error('Unable to open file as binary');
            }
            // Update metadata
            const size = model.getSize();
            this.handleMetadataChanged(typeof size === 'number' ? files_1.ByteSize.formatSize(size) : '');
            return {
                icon: '$(warning)',
                label: (0, nls_1.localize)('binaryError', "The file is not displayed in the text editor because it is either binary or uses an unsupported text encoding."),
                actions: [
                    {
                        label: (0, nls_1.localize)('openAnyway', "Open Anyway"),
                        run: async () => {
                            // Open in place
                            await this.callbacks.openInternal(input, options);
                            // Signal to listeners that the binary editor has been opened in-place
                            this._onDidOpenInPlace.fire();
                        }
                    }
                ]
            };
        }
        handleMetadataChanged(meta) {
            this.metadata = meta;
            this._onDidChangeMetadata.fire();
        }
        getMetadata() {
            return this.metadata;
        }
    };
    exports.BaseBinaryResourceEditor = BaseBinaryResourceEditor;
    exports.BaseBinaryResourceEditor = BaseBinaryResourceEditor = __decorate([
        __param(5, storage_1.IStorageService)
    ], BaseBinaryResourceEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluYXJ5RWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvYmluYXJ5RWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCaEc7O09BRUc7SUFDSSxJQUFlLHdCQUF3QixHQUF2QyxNQUFlLHdCQUF5QixTQUFRLHFDQUFpQjtRQVV2RSxZQUNDLEVBQVUsRUFDVixLQUFtQixFQUNGLFNBQXlCLEVBQzFDLGdCQUFtQyxFQUNuQyxZQUEyQixFQUNWLGNBQStCO1lBRWhELEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztZQUxoRCxjQUFTLEdBQVQsU0FBUyxDQUFnQjtZQVgxQix5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNuRSx3QkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBRTlDLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2hFLHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7UUFhekQsQ0FBQztRQUVRLFFBQVE7WUFDaEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDdEYsQ0FBQztRQUVTLEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBa0IsRUFBRSxPQUF1QjtZQUN0RSxNQUFNLEtBQUssR0FBRyxNQUFNLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVwQyx3QkFBd0I7WUFDeEIsSUFBSSxDQUFDLENBQUMsS0FBSyxZQUFZLHFDQUFpQixDQUFDLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxJQUFJLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1lBQ2xELENBQUM7WUFFRCxrQkFBa0I7WUFDbEIsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLGdCQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUV0RixPQUFPO2dCQUNOLElBQUksRUFBRSxZQUFZO2dCQUNsQixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsYUFBYSxFQUFFLGdIQUFnSCxDQUFDO2dCQUNoSixPQUFPLEVBQUU7b0JBQ1I7d0JBQ0MsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxhQUFhLENBQUM7d0JBQzVDLEdBQUcsRUFBRSxLQUFLLElBQUksRUFBRTs0QkFFZixnQkFBZ0I7NEJBQ2hCLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDOzRCQUVsRCxzRUFBc0U7NEJBQ3RFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDL0IsQ0FBQztxQkFDRDtpQkFDRDthQUNELENBQUM7UUFDSCxDQUFDO1FBRU8scUJBQXFCLENBQUMsSUFBd0I7WUFDckQsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFFckIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFFRCxXQUFXO1lBQ1YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7S0FDRCxDQUFBO0lBakVxQiw0REFBd0I7dUNBQXhCLHdCQUF3QjtRQWdCM0MsV0FBQSx5QkFBZSxDQUFBO09BaEJJLHdCQUF3QixDQWlFN0MifQ==