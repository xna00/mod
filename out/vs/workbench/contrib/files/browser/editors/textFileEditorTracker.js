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
define(["require", "exports", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/lifecycle/common/lifecycle", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/workbench/services/host/browser/host", "vs/workbench/services/editor/common/editorService", "vs/base/common/async", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/contrib/files/common/files", "vs/base/common/network", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/common/editor"], function (require, exports, textfiles_1, lifecycle_1, lifecycle_2, arrays_1, host_1, editorService_1, async_1, codeEditorService_1, filesConfigurationService_1, files_1, network_1, untitledTextEditorInput_1, workingCopyEditorService_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextFileEditorTracker = void 0;
    let TextFileEditorTracker = class TextFileEditorTracker extends lifecycle_2.Disposable {
        static { this.ID = 'workbench.contrib.textFileEditorTracker'; }
        constructor(editorService, textFileService, lifecycleService, hostService, codeEditorService, filesConfigurationService, workingCopyEditorService) {
            super();
            this.editorService = editorService;
            this.textFileService = textFileService;
            this.lifecycleService = lifecycleService;
            this.hostService = hostService;
            this.codeEditorService = codeEditorService;
            this.filesConfigurationService = filesConfigurationService;
            this.workingCopyEditorService = workingCopyEditorService;
            //#region Text File: Ensure every dirty text and untitled file is opened in an editor
            this.ensureDirtyFilesAreOpenedWorker = this._register(new async_1.RunOnceWorker(units => this.ensureDirtyTextFilesAreOpened(units), this.getDirtyTextFileTrackerDelay()));
            this.registerListeners();
        }
        registerListeners() {
            // Ensure dirty text file and untitled models are always opened as editors
            this._register(this.textFileService.files.onDidChangeDirty(model => this.ensureDirtyFilesAreOpenedWorker.work(model.resource)));
            this._register(this.textFileService.files.onDidSaveError(model => this.ensureDirtyFilesAreOpenedWorker.work(model.resource)));
            this._register(this.textFileService.untitled.onDidChangeDirty(model => this.ensureDirtyFilesAreOpenedWorker.work(model.resource)));
            // Update visible text file editors when focus is gained
            this._register(this.hostService.onDidChangeFocus(hasFocus => hasFocus ? this.reloadVisibleTextFileEditors() : undefined));
            // Lifecycle
            this._register(this.lifecycleService.onDidShutdown(() => this.dispose()));
        }
        getDirtyTextFileTrackerDelay() {
            return 800; // encapsulated in a method for tests to override
        }
        ensureDirtyTextFilesAreOpened(resources) {
            this.doEnsureDirtyTextFilesAreOpened((0, arrays_1.distinct)(resources.filter(resource => {
                if (!this.textFileService.isDirty(resource)) {
                    return false; // resource must be dirty
                }
                const fileModel = this.textFileService.files.get(resource);
                if (fileModel?.hasState(2 /* TextFileEditorModelState.PENDING_SAVE */)) {
                    return false; // resource must not be pending to save
                }
                if (resource.scheme !== network_1.Schemas.untitled && !fileModel?.hasState(5 /* TextFileEditorModelState.ERROR */) && this.filesConfigurationService.hasShortAutoSaveDelay(resource)) {
                    // leave models auto saved after short delay unless
                    // the save resulted in an error and not for untitled
                    // that are not auto-saved anyway
                    return false;
                }
                if (this.editorService.isOpened({ resource, typeId: resource.scheme === network_1.Schemas.untitled ? untitledTextEditorInput_1.UntitledTextEditorInput.ID : files_1.FILE_EDITOR_INPUT_ID, editorId: editor_1.DEFAULT_EDITOR_ASSOCIATION.id })) {
                    return false; // model must not be opened already as file (fast check via editor type)
                }
                const model = fileModel ?? this.textFileService.untitled.get(resource);
                if (model && this.workingCopyEditorService.findEditor(model)) {
                    return false; // model must not be opened already as file (slower check via working copy)
                }
                return true;
            }), resource => resource.toString()));
        }
        doEnsureDirtyTextFilesAreOpened(resources) {
            if (!resources.length) {
                return;
            }
            this.editorService.openEditors(resources.map(resource => ({
                resource,
                options: { inactive: true, pinned: true, preserveFocus: true }
            })));
        }
        //#endregion
        //#region Window Focus Change: Update visible code editors when focus is gained that have a known text file model
        reloadVisibleTextFileEditors() {
            // the window got focus and we use this as a hint that files might have been changed outside
            // of this window. since file events can be unreliable, we queue a load for models that
            // are visible in any editor. since this is a fast operation in the case nothing has changed,
            // we tolerate the additional work.
            (0, arrays_1.distinct)((0, arrays_1.coalesce)(this.codeEditorService.listCodeEditors()
                .map(codeEditor => {
                const resource = codeEditor.getModel()?.uri;
                if (!resource) {
                    return undefined;
                }
                const model = this.textFileService.files.get(resource);
                if (!model || model.isDirty() || !model.isResolved()) {
                    return undefined;
                }
                return model;
            })), model => model.resource.toString()).forEach(model => this.textFileService.files.resolve(model.resource, { reload: { async: true } }));
        }
    };
    exports.TextFileEditorTracker = TextFileEditorTracker;
    exports.TextFileEditorTracker = TextFileEditorTracker = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, host_1.IHostService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, filesConfigurationService_1.IFilesConfigurationService),
        __param(6, workingCopyEditorService_1.IWorkingCopyEditorService)
    ], TextFileEditorTracker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVFZGl0b3JUcmFja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL2VkaXRvcnMvdGV4dEZpbGVFZGl0b3JUcmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSxzQkFBVTtpQkFFcEMsT0FBRSxHQUFHLHlDQUF5QyxBQUE1QyxDQUE2QztRQUUvRCxZQUNpQixhQUE4QyxFQUM1QyxlQUFrRCxFQUNqRCxnQkFBb0QsRUFDekQsV0FBMEMsRUFDcEMsaUJBQXNELEVBQzlDLHlCQUFzRSxFQUN2RSx3QkFBb0U7WUFFL0YsS0FBSyxFQUFFLENBQUM7WUFSeUIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQzNCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNoQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3hDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ25CLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDN0IsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUE0QjtZQUN0RCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTJCO1lBcUJoRyxxRkFBcUY7WUFFcEUsb0NBQStCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHFCQUFhLENBQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBbkJsTCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJBQWlCO1lBRXhCLDBFQUEwRTtZQUMxRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsK0JBQStCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbkksd0RBQXdEO1lBQ3hELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFMUgsWUFBWTtZQUNaLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFNUyw0QkFBNEI7WUFDckMsT0FBTyxHQUFHLENBQUMsQ0FBQyxpREFBaUQ7UUFDOUQsQ0FBQztRQUVPLDZCQUE2QixDQUFDLFNBQWdCO1lBQ3JELElBQUksQ0FBQywrQkFBK0IsQ0FBQyxJQUFBLGlCQUFRLEVBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDekUsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQzdDLE9BQU8sS0FBSyxDQUFDLENBQUMseUJBQXlCO2dCQUN4QyxDQUFDO2dCQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxTQUFTLEVBQUUsUUFBUSwrQ0FBdUMsRUFBRSxDQUFDO29CQUNoRSxPQUFPLEtBQUssQ0FBQyxDQUFDLHVDQUF1QztnQkFDdEQsQ0FBQztnQkFFRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxRQUFRLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSx3Q0FBZ0MsSUFBSSxJQUFJLENBQUMseUJBQXlCLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDcEssbURBQW1EO29CQUNuRCxxREFBcUQ7b0JBQ3JELGlDQUFpQztvQkFDakMsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztnQkFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxpREFBdUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLDRCQUFvQixFQUFFLFFBQVEsRUFBRSxtQ0FBMEIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQzFMLE9BQU8sS0FBSyxDQUFDLENBQUMsd0VBQXdFO2dCQUN2RixDQUFDO2dCQUVELE1BQU0sS0FBSyxHQUFHLFNBQVMsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZFLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDOUQsT0FBTyxLQUFLLENBQUMsQ0FBQywyRUFBMkU7Z0JBQzFGLENBQUM7Z0JBRUQsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVPLCtCQUErQixDQUFDLFNBQWdCO1lBQ3ZELElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3pELFFBQVE7Z0JBQ1IsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUU7YUFDOUQsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNOLENBQUM7UUFFRCxZQUFZO1FBRVosaUhBQWlIO1FBRXpHLDRCQUE0QjtZQUNuQyw0RkFBNEY7WUFDNUYsdUZBQXVGO1lBQ3ZGLDZGQUE2RjtZQUM3RixtQ0FBbUM7WUFDbkMsSUFBQSxpQkFBUSxFQUNQLElBQUEsaUJBQVEsRUFBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxFQUFFO2lCQUMvQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ2pCLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDZixPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztnQkFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZELElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7b0JBQ3RELE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUVELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQUMsRUFDSixLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQ2xDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckcsQ0FBQzs7SUE1R1csc0RBQXFCO29DQUFyQixxQkFBcUI7UUFLL0IsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSw0QkFBZ0IsQ0FBQTtRQUNoQixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsbUJBQVksQ0FBQTtRQUNaLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSxzREFBMEIsQ0FBQTtRQUMxQixXQUFBLG9EQUF5QixDQUFBO09BWGYscUJBQXFCLENBK0dqQyJ9