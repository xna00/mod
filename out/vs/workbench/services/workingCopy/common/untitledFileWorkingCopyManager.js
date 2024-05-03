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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/services/workingCopy/common/untitledFileWorkingCopy", "vs/base/common/event", "vs/base/common/network", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/files/common/files", "vs/workbench/services/workingCopy/common/abstractFileWorkingCopyManager", "vs/base/common/map"], function (require, exports, lifecycle_1, uri_1, untitledFileWorkingCopy_1, event_1, network_1, workingCopyService_1, label_1, log_1, workingCopyBackup_1, files_1, abstractFileWorkingCopyManager_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledFileWorkingCopyManager = void 0;
    let UntitledFileWorkingCopyManager = class UntitledFileWorkingCopyManager extends abstractFileWorkingCopyManager_1.BaseFileWorkingCopyManager {
        constructor(workingCopyTypeId, modelFactory, saveDelegate, fileService, labelService, logService, workingCopyBackupService, workingCopyService) {
            super(fileService, logService, workingCopyBackupService);
            this.workingCopyTypeId = workingCopyTypeId;
            this.modelFactory = modelFactory;
            this.saveDelegate = saveDelegate;
            this.labelService = labelService;
            this.workingCopyService = workingCopyService;
            //#region Events
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            //#endregion
            this.mapResourceToWorkingCopyListeners = new map_1.ResourceMap();
        }
        async resolve(options) {
            const workingCopy = this.doCreateOrGet(options);
            await workingCopy.resolve();
            return workingCopy;
        }
        doCreateOrGet(options = Object.create(null)) {
            const massagedOptions = this.massageOptions(options);
            // Return existing instance if asked for it
            if (massagedOptions.untitledResource) {
                const existingWorkingCopy = this.get(massagedOptions.untitledResource);
                if (existingWorkingCopy) {
                    return existingWorkingCopy;
                }
            }
            // Create new instance otherwise
            return this.doCreate(massagedOptions);
        }
        massageOptions(options) {
            const massagedOptions = Object.create(null);
            // Handle associated resource
            if (options.associatedResource) {
                massagedOptions.untitledResource = uri_1.URI.from({
                    scheme: network_1.Schemas.untitled,
                    authority: options.associatedResource.authority,
                    fragment: options.associatedResource.fragment,
                    path: options.associatedResource.path,
                    query: options.associatedResource.query
                });
                massagedOptions.associatedResource = options.associatedResource;
            }
            // Handle untitled resource
            else {
                if (options.untitledResource?.scheme === network_1.Schemas.untitled) {
                    massagedOptions.untitledResource = options.untitledResource;
                }
                massagedOptions.isScratchpad = options.isScratchpad;
            }
            // Take over initial value
            massagedOptions.contents = options.contents;
            return massagedOptions;
        }
        doCreate(options) {
            // Create a new untitled resource if none is provided
            let untitledResource = options.untitledResource;
            if (!untitledResource) {
                let counter = 1;
                do {
                    untitledResource = uri_1.URI.from({
                        scheme: network_1.Schemas.untitled,
                        path: options.isScratchpad ? `Scratchpad-${counter}` : `Untitled-${counter}`,
                        query: this.workingCopyTypeId ?
                            `typeId=${this.workingCopyTypeId}` : // distinguish untitled resources among others by encoding the `typeId` as query param
                            undefined // keep untitled resources for text files as they are (when `typeId === ''`)
                    });
                    counter++;
                } while (this.has(untitledResource));
            }
            // Create new working copy with provided options
            const workingCopy = new untitledFileWorkingCopy_1.UntitledFileWorkingCopy(this.workingCopyTypeId, untitledResource, this.labelService.getUriBasenameLabel(untitledResource), !!options.associatedResource, !!options.isScratchpad, options.contents, this.modelFactory, this.saveDelegate, this.workingCopyService, this.workingCopyBackupService, this.logService);
            // Register
            this.registerWorkingCopy(workingCopy);
            return workingCopy;
        }
        registerWorkingCopy(workingCopy) {
            // Install working copy listeners
            const workingCopyListeners = new lifecycle_1.DisposableStore();
            workingCopyListeners.add(workingCopy.onDidChangeDirty(() => this._onDidChangeDirty.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onWillDispose(() => this._onWillDispose.fire(workingCopy)));
            // Keep for disposal
            this.mapResourceToWorkingCopyListeners.set(workingCopy.resource, workingCopyListeners);
            // Add to cache
            this.add(workingCopy.resource, workingCopy);
            // If the working copy is dirty right from the beginning,
            // make sure to emit this as an event
            if (workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
        }
        remove(resource) {
            const removed = super.remove(resource);
            // Dispose any existing working copy listeners
            const workingCopyListener = this.mapResourceToWorkingCopyListeners.get(resource);
            if (workingCopyListener) {
                (0, lifecycle_1.dispose)(workingCopyListener);
                this.mapResourceToWorkingCopyListeners.delete(resource);
            }
            return removed;
        }
        //#endregion
        //#region Lifecycle
        dispose() {
            super.dispose();
            // Dispose the working copy change listeners
            (0, lifecycle_1.dispose)(this.mapResourceToWorkingCopyListeners.values());
            this.mapResourceToWorkingCopyListeners.clear();
        }
    };
    exports.UntitledFileWorkingCopyManager = UntitledFileWorkingCopyManager;
    exports.UntitledFileWorkingCopyManager = UntitledFileWorkingCopyManager = __decorate([
        __param(3, files_1.IFileService),
        __param(4, label_1.ILabelService),
        __param(5, log_1.ILogService),
        __param(6, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(7, workingCopyService_1.IWorkingCopyService)
    ], UntitledFileWorkingCopyManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRGaWxlV29ya2luZ0NvcHlNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvY29tbW9uL3VudGl0bGVkRmlsZVdvcmtpbmdDb3B5TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvR3pGLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQXdFLFNBQVEsMkRBQTBEO1FBY3RKLFlBQ2tCLGlCQUF5QixFQUN6QixZQUFxRCxFQUNyRCxZQUFxRCxFQUN4RCxXQUF5QixFQUN4QixZQUE0QyxFQUM5QyxVQUF1QixFQUNULHdCQUFtRCxFQUN6RCxrQkFBd0Q7WUFFN0UsS0FBSyxDQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztZQVR4QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQVE7WUFDekIsaUJBQVksR0FBWixZQUFZLENBQXlDO1lBQ3JELGlCQUFZLEdBQVosWUFBWSxDQUF5QztZQUV0QyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUdyQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBcEI5RSxnQkFBZ0I7WUFFQyxzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUErQixDQUFDLENBQUM7WUFDdkYscUJBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUV4QyxtQkFBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQStCLENBQUMsQ0FBQztZQUNwRixrQkFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO1lBRW5ELFlBQVk7WUFFSyxzQ0FBaUMsR0FBRyxJQUFJLGlCQUFXLEVBQWUs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