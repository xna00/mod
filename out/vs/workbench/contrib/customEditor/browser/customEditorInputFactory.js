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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/customEditor/browser/customEditorInput", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInputSerializer", "vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/workingCopy/common/workingCopyEditorService"], function (require, exports, lifecycle_1, network_1, resources_1, uri_1, instantiation_1, customEditorInput_1, customEditor_1, notebookEditorInput_1, webview_1, webviewEditorInputSerializer_1, webviewWorkbenchService_1, workingCopyBackup_1, workingCopyEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ComplexCustomWorkingCopyEditorHandler = exports.CustomEditorInputSerializer = void 0;
    let CustomEditorInputSerializer = class CustomEditorInputSerializer extends webviewEditorInputSerializer_1.WebviewEditorInputSerializer {
        static { this.ID = customEditorInput_1.CustomEditorInput.typeId; }
        constructor(webviewWorkbenchService, _instantiationService, _webviewService) {
            super(webviewWorkbenchService);
            this._instantiationService = _instantiationService;
            this._webviewService = _webviewService;
        }
        serialize(input) {
            const dirty = input.isDirty();
            const data = {
                ...this.toJson(input),
                editorResource: input.resource.toJSON(),
                dirty,
                backupId: dirty ? input.backupId : undefined,
            };
            try {
                return JSON.stringify(data);
            }
            catch {
                return undefined;
            }
        }
        fromJson(data) {
            return {
                ...super.fromJson(data),
                editorResource: uri_1.URI.from(data.editorResource),
                dirty: data.dirty,
            };
        }
        deserialize(_instantiationService, serializedEditorInput) {
            const data = this.fromJson(JSON.parse(serializedEditorInput));
            const webview = reviveWebview(this._webviewService, data);
            const customInput = this._instantiationService.createInstance(customEditorInput_1.CustomEditorInput, { resource: data.editorResource, viewType: data.viewType }, webview, { startsDirty: data.dirty, backupId: data.backupId });
            if (typeof data.group === 'number') {
                customInput.updateGroup(data.group);
            }
            return customInput;
        }
    };
    exports.CustomEditorInputSerializer = CustomEditorInputSerializer;
    exports.CustomEditorInputSerializer = CustomEditorInputSerializer = __decorate([
        __param(0, webviewWorkbenchService_1.IWebviewWorkbenchService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, webview_1.IWebviewService)
    ], CustomEditorInputSerializer);
    function reviveWebview(webviewService, data) {
        const webview = webviewService.createWebviewOverlay({
            providedViewType: data.viewType,
            origin: data.origin,
            title: undefined,
            options: {
                purpose: "customEditor" /* WebviewContentPurpose.CustomEditor */,
                enableFindWidget: data.webviewOptions.enableFindWidget,
                retainContextWhenHidden: data.webviewOptions.retainContextWhenHidden,
            },
            contentOptions: data.contentOptions,
            extension: data.extension,
        });
        webview.state = data.state;
        return webview;
    }
    let ComplexCustomWorkingCopyEditorHandler = class ComplexCustomWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.complexCustomWorkingCopyEditorHandler'; }
        constructor(_instantiationService, _workingCopyEditorService, _workingCopyBackupService, _webviewService, _customEditorService // DO NOT REMOVE (needed on startup to register overrides properly)
        ) {
            super();
            this._instantiationService = _instantiationService;
            this._workingCopyBackupService = _workingCopyBackupService;
            this._webviewService = _webviewService;
            this._register(_workingCopyEditorService.registerHandler(this));
        }
        handles(workingCopy) {
            return workingCopy.resource.scheme === network_1.Schemas.vscodeCustomEditor;
        }
        isOpen(workingCopy, editor) {
            if (!this.handles(workingCopy)) {
                return false;
            }
            if (workingCopy.resource.authority === 'jupyter-notebook-ipynb' && editor instanceof notebookEditorInput_1.NotebookEditorInput) {
                try {
                    const data = JSON.parse(workingCopy.resource.query);
                    const workingCopyResource = uri_1.URI.from(data);
                    return (0, resources_1.isEqual)(workingCopyResource, editor.resource);
                }
                catch {
                    return false;
                }
            }
            if (!(editor instanceof customEditorInput_1.CustomEditorInput)) {
                return false;
            }
            if (workingCopy.resource.authority !== editor.viewType.replace(/[^a-z0-9\-_]/gi, '-').toLowerCase()) {
                return false;
            }
            // The working copy stores the uri of the original resource as its query param
            try {
                const data = JSON.parse(workingCopy.resource.query);
                const workingCopyResource = uri_1.URI.from(data);
                return (0, resources_1.isEqual)(workingCopyResource, editor.resource);
            }
            catch {
                return false;
            }
        }
        async createEditor(workingCopy) {
            const backup = await this._workingCopyBackupService.resolve(workingCopy);
            if (!backup?.meta) {
                throw new Error(`No backup found for custom editor: ${workingCopy.resource}`);
            }
            const backupData = backup.meta;
            const extension = (0, webviewEditorInputSerializer_1.reviveWebviewExtensionDescription)(backupData.extension?.id, backupData.extension?.location);
            const webview = reviveWebview(this._webviewService, {
                viewType: backupData.viewType,
                origin: backupData.webview.origin,
                webviewOptions: (0, webviewEditorInputSerializer_1.restoreWebviewOptions)(backupData.webview.options),
                contentOptions: (0, webviewEditorInputSerializer_1.restoreWebviewContentOptions)(backupData.webview.options),
                state: backupData.webview.state,
                extension,
            });
            const editor = this._instantiationService.createInstance(customEditorInput_1.CustomEditorInput, { resource: uri_1.URI.revive(backupData.editorResource), viewType: backupData.viewType }, webview, { backupId: backupData.backupId });
            editor.updateGroup(0);
            return editor;
        }
    };
    exports.ComplexCustomWorkingCopyEditorHandler = ComplexCustomWorkingCopyEditorHandler;
    exports.ComplexCustomWorkingCopyEditorHandler = ComplexCustomWorkingCopyEditorHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(2, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(3, webview_1.IWebviewService),
        __param(4, customEditor_1.ICustomEditorService)
    ], ComplexCustomWorkingCopyEditorHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tRWRpdG9ySW5wdXRGYWN0b3J5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jdXN0b21FZGl0b3IvYnJvd3Nlci9jdXN0b21FZGl0b3JJbnB1dEZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0R6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLDJEQUE0QjtpQkFFNUMsT0FBRSxHQUFHLHFDQUFpQixDQUFDLE1BQU0sQUFBM0IsQ0FBNEI7UUFFOUQsWUFDMkIsdUJBQWlELEVBQ25DLHFCQUE0QyxFQUNsRCxlQUFnQztZQUVsRSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUhTLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDbEQsb0JBQWUsR0FBZixlQUFlLENBQWlCO1FBR25FLENBQUM7UUFFZSxTQUFTLENBQUMsS0FBd0I7WUFDakQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzlCLE1BQU0sSUFBSSxHQUEyQjtnQkFDcEMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDckIsY0FBYyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUN2QyxLQUFLO2dCQUNMLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVM7YUFDNUMsQ0FBQztZQUVGLElBQUksQ0FBQztnQkFDSixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0IsQ0FBQztZQUFDLE1BQU0sQ0FBQztnQkFDUixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1FBQ0YsQ0FBQztRQUVrQixRQUFRLENBQUMsSUFBNEI7WUFDdkQsT0FBTztnQkFDTixHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUN2QixjQUFjLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDO2dCQUM3QyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7YUFDakIsQ0FBQztRQUNILENBQUM7UUFFZSxXQUFXLENBQzFCLHFCQUE0QyxFQUM1QyxxQkFBNkI7WUFFN0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztZQUU5RCxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLHFDQUFpQixFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDNU0sSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3BDLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFDRCxPQUFPLFdBQVcsQ0FBQztRQUNwQixDQUFDOztJQWhEVyxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQUtyQyxXQUFBLGtEQUF3QixDQUFBO1FBQ3hCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSx5QkFBZSxDQUFBO09BUEwsMkJBQTJCLENBaUR2QztJQUVELFNBQVMsYUFBYSxDQUFDLGNBQStCLEVBQUUsSUFBa0w7UUFDek8sTUFBTSxPQUFPLEdBQUcsY0FBYyxDQUFDLG9CQUFvQixDQUFDO1lBQ25ELGdCQUFnQixFQUFFLElBQUksQ0FBQyxRQUFRO1lBQy9CLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtZQUNuQixLQUFLLEVBQUUsU0FBUztZQUNoQixPQUFPLEVBQUU7Z0JBQ1IsT0FBTyx5REFBb0M7Z0JBQzNDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCO2dCQUN0RCx1QkFBdUIsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLHVCQUF1QjthQUNwRTtZQUNELGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYztZQUNuQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7U0FDekIsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzNCLE9BQU8sT0FBTyxDQUFDO0lBQ2hCLENBQUM7SUFFTSxJQUFNLHFDQUFxQyxHQUEzQyxNQUFNLHFDQUFzQyxTQUFRLHNCQUFVO2lCQUVwRCxPQUFFLEdBQUcseURBQXlELEFBQTVELENBQTZEO1FBRS9FLFlBQ3lDLHFCQUE0QyxFQUN6RCx5QkFBb0QsRUFDbkMseUJBQW9ELEVBQzlELGVBQWdDLEVBQzVDLG9CQUEwQyxDQUFDLG1FQUFtRTs7WUFFcEksS0FBSyxFQUFFLENBQUM7WUFOZ0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUV4Qyw4QkFBeUIsR0FBekIseUJBQXlCLENBQTJCO1lBQzlELG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUtsRSxJQUFJLENBQUMsU0FBUyxDQUFDLHlCQUF5QixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFRCxPQUFPLENBQUMsV0FBbUM7WUFDMUMsT0FBTyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLGtCQUFrQixDQUFDO1FBQ25FLENBQUM7UUFFRCxNQUFNLENBQUMsV0FBbUMsRUFBRSxNQUFtQjtZQUM5RCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsU0FBUyxLQUFLLHdCQUF3QixJQUFJLE1BQU0sWUFBWSx5Q0FBbUIsRUFBRSxDQUFDO2dCQUMxRyxJQUFJLENBQUM7b0JBQ0osTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNwRCxNQUFNLG1CQUFtQixHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzNDLE9BQU8sSUFBQSxtQkFBTyxFQUFDLG1CQUFtQixFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdEQsQ0FBQztnQkFBQyxNQUFNLENBQUM7b0JBQ1IsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsQ0FBQyxNQUFNLFlBQVkscUNBQWlCLENBQUMsRUFBRSxDQUFDO2dCQUM1QyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsU0FBUyxLQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQ3JHLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELDhFQUE4RTtZQUM5RSxJQUFJLENBQUM7Z0JBQ0osTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNwRCxNQUFNLG1CQUFtQixHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzNDLE9BQU8sSUFBQSxtQkFBTyxFQUFDLG1CQUFtQixFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0RCxDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUNSLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsWUFBWSxDQUFDLFdBQW1DO1lBQ3JELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBMkIsV0FBVyxDQUFDLENBQUM7WUFDbkcsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDL0UsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDL0IsTUFBTSxTQUFTLEdBQUcsSUFBQSxnRUFBaUMsRUFBQyxVQUFVLENBQUMsU0FBUyxFQUFFLEVBQUUsRUFBRSxVQUFVLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzlHLE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO2dCQUNuRCxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVE7Z0JBQzdCLE1BQU0sRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU07Z0JBQ2pDLGNBQWMsRUFBRSxJQUFBLG9EQUFxQixFQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUNqRSxjQUFjLEVBQUUsSUFBQSwyREFBNEIsRUFBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztnQkFDeEUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSztnQkFDL0IsU0FBUzthQUNULENBQUMsQ0FBQztZQUVILE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMscUNBQWlCLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDNU0sTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7O0lBekVXLHNGQUFxQztvREFBckMscUNBQXFDO1FBSy9DLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxvREFBeUIsQ0FBQTtRQUN6QixXQUFBLDZDQUF5QixDQUFBO1FBQ3pCLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEsbUNBQW9CLENBQUE7T0FUVixxQ0FBcUMsQ0EwRWpEIn0=