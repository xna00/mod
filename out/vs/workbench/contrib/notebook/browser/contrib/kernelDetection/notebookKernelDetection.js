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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookLoggingService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, lifecycle_1, platform_1, contributions_1, notebookKernelService_1, notebookLoggingService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NotebookKernelDetection = class NotebookKernelDetection extends lifecycle_1.Disposable {
        constructor(_notebookKernelService, _extensionService, _notebookLoggingService) {
            super();
            this._notebookKernelService = _notebookKernelService;
            this._extensionService = _extensionService;
            this._notebookLoggingService = _notebookLoggingService;
            this._detectionMap = new Map();
            this._localDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._registerListeners();
        }
        _registerListeners() {
            this._localDisposableStore.clear();
            this._localDisposableStore.add(this._extensionService.onWillActivateByEvent(e => {
                if (e.event.startsWith('onNotebook:')) {
                    if (this._extensionService.activationEventIsDone(e.event)) {
                        return;
                    }
                    // parse the event to get the notebook type
                    const notebookType = e.event.substring('onNotebook:'.length);
                    if (notebookType === '*') {
                        // ignore
                        return;
                    }
                    let shouldStartDetection = false;
                    const extensionStatus = this._extensionService.getExtensionsStatus();
                    this._extensionService.extensions.forEach(extension => {
                        if (extensionStatus[extension.identifier.value].activationTimes) {
                            // already activated
                            return;
                        }
                        if (extension.activationEvents?.includes(e.event)) {
                            shouldStartDetection = true;
                        }
                    });
                    if (shouldStartDetection && !this._detectionMap.has(notebookType)) {
                        this._notebookLoggingService.debug('KernelDetection', `start extension activation for ${notebookType}`);
                        const task = this._notebookKernelService.registerNotebookKernelDetectionTask({
                            notebookType: notebookType
                        });
                        this._detectionMap.set(notebookType, task);
                    }
                }
            }));
            let timer = null;
            this._localDisposableStore.add(this._extensionService.onDidChangeExtensionsStatus(() => {
                if (timer) {
                    clearTimeout(timer);
                }
                // activation state might not be updated yet, postpone to next frame
                timer = setTimeout(() => {
                    const taskToDelete = [];
                    for (const [notebookType, task] of this._detectionMap) {
                        if (this._extensionService.activationEventIsDone(`onNotebook:${notebookType}`)) {
                            this._notebookLoggingService.debug('KernelDetection', `finish extension activation for ${notebookType}`);
                            taskToDelete.push(notebookType);
                            task.dispose();
                        }
                    }
                    taskToDelete.forEach(notebookType => {
                        this._detectionMap.delete(notebookType);
                    });
                });
            }));
            this._localDisposableStore.add({
                dispose: () => {
                    if (timer) {
                        clearTimeout(timer);
                    }
                }
            });
        }
    };
    NotebookKernelDetection = __decorate([
        __param(0, notebookKernelService_1.INotebookKernelService),
        __param(1, extensions_1.IExtensionService),
        __param(2, notebookLoggingService_1.INotebookLoggingService)
    ], NotebookKernelDetection);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(NotebookKernelDetection, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tLZXJuZWxEZXRlY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9rZXJuZWxEZXRlY3Rpb24vbm90ZWJvb2tLZXJuZWxEZXRlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFXaEcsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTtRQUkvQyxZQUN5QixzQkFBK0QsRUFDcEUsaUJBQXFELEVBQy9DLHVCQUFpRTtZQUUxRixLQUFLLEVBQUUsQ0FBQztZQUppQywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBQ25ELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDOUIsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtZQU5uRixrQkFBYSxHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBQy9DLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQVNyRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRU8sa0JBQWtCO1lBQ3pCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVuQyxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDL0UsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO29CQUN2QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVB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