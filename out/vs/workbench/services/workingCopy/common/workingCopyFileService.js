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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/base/common/async", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/cancellation", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/workingCopy/common/workingCopyFileOperationParticipant", "vs/workbench/services/workingCopy/common/storedFileWorkingCopySaveParticipant"], function (require, exports, instantiation_1, extensions_1, event_1, async_1, arrays_1, lifecycle_1, files_1, cancellation_1, workingCopyService_1, uriIdentity_1, workingCopyFileOperationParticipant_1, storedFileWorkingCopySaveParticipant_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyFileService = exports.IWorkingCopyFileService = void 0;
    exports.IWorkingCopyFileService = (0, instantiation_1.createDecorator)('workingCopyFileService');
    let WorkingCopyFileService = class WorkingCopyFileService extends lifecycle_1.Disposable {
        constructor(fileService, workingCopyService, instantiationService, uriIdentityService) {
            super();
            this.fileService = fileService;
            this.workingCopyService = workingCopyService;
            this.instantiationService = instantiationService;
            this.uriIdentityService = uriIdentityService;
            //#region Events
            this._onWillRunWorkingCopyFileOperation = this._register(new event_1.AsyncEmitter());
            this.onWillRunWorkingCopyFileOperation = this._onWillRunWorkingCopyFileOperation.event;
            this._onDidFailWorkingCopyFileOperation = this._register(new event_1.AsyncEmitter());
            this.onDidFailWorkingCopyFileOperation = this._onDidFailWorkingCopyFileOperation.event;
            this._onDidRunWorkingCopyFileOperation = this._register(new event_1.AsyncEmitter());
            this.onDidRunWorkingCopyFileOperation = this._onDidRunWorkingCopyFileOperation.event;
            //#endregion
            this.correlationIds = 0;
            //#endregion
            //#region File operation participants
            this.fileOperationParticipants = this._register(this.instantiationService.createInstance(workingCopyFileOperationParticipant_1.WorkingCopyFileOperationParticipant));
            //#endregion
            //#region Save participants (stored file working copies only)
            this.saveParticipants = this._register(this.instantiationService.createInstance(storedFileWorkingCopySaveParticipant_1.StoredFileWorkingCopySaveParticipant));
            //#endregion
            //#region Path related
            this.workingCopyProviders = [];
            // register a default working copy provider that uses the working copy service
            this._register(this.registerWorkingCopyProvider(resource => {
                return this.workingCopyService.workingCopies.filter(workingCopy => {
                    if (this.fileService.hasProvider(resource)) {
                        // only check for parents if the resource can be handled
                        // by the file system where we then assume a folder like
                        // path structure
                        return this.uriIdentityService.extUri.isEqualOrParent(workingCopy.resource, resource);
                    }
                    return this.uriIdentityService.extUri.isEqual(workingCopy.resource, resource);
                });
            }));
        }
        //#region File operations
        create(operations, token, undoInfo) {
            return this.doCreateFileOrFolder(operations, true, token, undoInfo);
        }
        createFolder(operations, token, undoInfo) {
            return this.doCreateFileOrFolder(operations, false, token, undoInfo);
        }
        async doCreateFileOrFolder(operations, isFile, token, undoInfo) {
            if (operations.length === 0) {
                return [];
            }
            // validate create operation before starting
            if (isFile) {
                const validateCreates = await async_1.Promises.settled(operations.map(operation => this.fileService.canCreateFile(operation.resource, { overwrite: operation.overwrite })));
                const error = validateCreates.find(validateCreate => validateCreate instanceof Error);
                if (error instanceof Error) {
                    throw error;
                }
            }
            // file operation participant
            const files = operations.map(operation => ({ target: operation.resource }));
            await this.runFileOperationParticipants(files, 0 /* FileOperation.CREATE */, undoInfo, token);
            // before events
            const event = { correlationId: this.correlationIds++, operation: 0 /* FileOperation.CREATE */, files };
            await this._onWillRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
            // now actually create on disk
            let stats;
            try {
                if (isFile) {
                    stats = await async_1.Promises.settled(operations.map(operation => this.fileService.createFile(operation.resource, operation.contents, { overwrite: operation.overwrite })));
                }
                else {
                    stats = await async_1.Promises.settled(operations.map(operation => this.fileService.createFolder(operation.resource)));
                }
            }
            catch (error) {
                // error event
                await this._onDidFailWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
                throw error;
            }
            // after event
            await this._onDidRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
            return stats;
        }
        async move(operations, token, undoInfo) {
            return this.doMoveOrCopy(operations, true, token, undoInfo);
        }
        async copy(operations, token, undoInfo) {
            return this.doMoveOrCopy(operations, false, token, undoInfo);
        }
        async doMoveOrCopy(operations, move, token, undoInfo) {
            const stats = [];
            // validate move/copy operation before starting
            for (const { file: { source, target }, overwrite } of operations) {
                const validateMoveOrCopy = await (move ? this.fileService.canMove(source, target, overwrite) : this.fileService.canCopy(source, target, overwrite));
                if (validateMoveOrCopy instanceof Error) {
                    throw validateMoveOrCopy;
                }
            }
            // file operation participant
            const files = operations.map(o => o.file);
            await this.runFileOperationParticipants(files, move ? 2 /* FileOperation.MOVE */ : 3 /* FileOperation.COPY */, undoInfo, token);
            // before event
            const event = { correlationId: this.correlationIds++, operation: move ? 2 /* FileOperation.MOVE */ : 3 /* FileOperation.COPY */, files };
            await this._onWillRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
            try {
                for (const { file: { source, target }, overwrite } of operations) {
                    // if source and target are not equal, handle dirty working copies
                    // depending on the operation:
                    // - move: revert both source and target (if any)
                    // - copy: revert target (if any)
                    if (!this.uriIdentityService.extUri.isEqual(source, target)) {
                        const dirtyWorkingCopies = (move ? [...this.getDirty(source), ...this.getDirty(target)] : this.getDirty(target));
                        await async_1.Promises.settled(dirtyWorkingCopies.map(dirtyWorkingCopy => dirtyWorkingCopy.revert({ soft: true })));
                    }
                    // now we can rename the source to target via file operation
                    if (move) {
                        stats.push(await this.fileService.move(source, target, overwrite));
                    }
                    else {
                        stats.push(await this.fileService.copy(source, target, overwrite));
                    }
                }
            }
            catch (error) {
                // error event
                await this._onDidFailWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
                throw error;
            }
            // after event
            await this._onDidRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
            return stats;
        }
        async delete(operations, token, undoInfo) {
            // validate delete operation before starting
            for (const operation of operations) {
                const validateDelete = await this.fileService.canDelete(operation.resource, { recursive: operation.recursive, useTrash: operation.useTrash });
                if (validateDelete instanceof Error) {
                    throw validateDelete;
                }
            }
            // file operation participant
            const files = operations.map(operation => ({ target: operation.resource }));
            await this.runFileOperationParticipants(files, 1 /* FileOperation.DELETE */, undoInfo, token);
            // before events
            const event = { correlationId: this.correlationIds++, operation: 1 /* FileOperation.DELETE */, files };
            await this._onWillRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
            // check for any existing dirty working copies for the resource
            // and do a soft revert before deleting to be able to close
            // any opened editor with these working copies
            for (const operation of operations) {
                const dirtyWorkingCopies = this.getDirty(operation.resource);
                await async_1.Promises.settled(dirtyWorkingCopies.map(dirtyWorkingCopy => dirtyWorkingCopy.revert({ soft: true })));
            }
            // now actually delete from disk
            try {
                for (const operation of operations) {
                    await this.fileService.del(operation.resource, { recursive: operation.recursive, useTrash: operation.useTrash });
                }
            }
            catch (error) {
                // error event
                await this._onDidFailWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
                throw error;
            }
            // after event
            await this._onDidRunWorkingCopyFileOperation.fireAsync(event, cancellation_1.CancellationToken.None /* intentional: we currently only forward cancellation to participants */);
        }
        addFileOperationParticipant(participant) {
            return this.fileOperationParticipants.addFileOperationParticipant(participant);
        }
        runFileOperationParticipants(files, operation, undoInfo, token) {
            return this.fileOperationParticipants.participate(files, operation, undoInfo, token);
        }
        get hasSaveParticipants() { return this.saveParticipants.length > 0; }
        addSaveParticipant(participant) {
            return this.saveParticipants.addSaveParticipant(participant);
        }
        runSaveParticipants(workingCopy, context, token) {
            return this.saveParticipants.participate(workingCopy, context, token);
        }
        registerWorkingCopyProvider(provider) {
            const remove = (0, arrays_1.insert)(this.workingCopyProviders, provider);
            return (0, lifecycle_1.toDisposable)(remove);
        }
        getDirty(resource) {
            const dirtyWorkingCopies = new Set();
            for (const provider of this.workingCopyProviders) {
                for (const workingCopy of provider(resource)) {
                    if (workingCopy.isDirty()) {
                        dirtyWorkingCopies.add(workingCopy);
                    }
                }
            }
            return Array.from(dirtyWorkingCopies);
        }
    };
    exports.WorkingCopyFileService = WorkingCopyFileService;
    exports.WorkingCopyFileService = WorkingCopyFileService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, workingCopyService_1.IWorkingCopyService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], WorkingCopyFileService);
    (0, extensions_1.registerSingleton)(exports.IWorkingCopyFileService, WorkingCopyFileService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlGaWxlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2NvbW1vbi93b3JraW5nQ29weUZpbGVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFCbkYsUUFBQSx1QkFBdUIsR0FBRyxJQUFBLCtCQUFlLEVBQTBCLHdCQUF3QixDQUFDLENBQUM7SUFtUW5HLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEsc0JBQVU7UUFtQnJELFlBQ2UsV0FBMEMsRUFDbkMsa0JBQXdELEVBQ3RELG9CQUE0RCxFQUM5RCxrQkFBd0Q7WUFFN0UsS0FBSyxFQUFFLENBQUM7WUFMdUIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUNyQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzdDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFuQjlFLGdCQUFnQjtZQUVDLHVDQUFrQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxvQkFBWSxFQUF3QixDQUFDLENBQUM7WUFDdEcsc0NBQWlDLEdBQUcsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLEtBQUssQ0FBQztZQUUxRSx1Q0FBa0MsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksb0JBQVksRUFBd0IsQ0FBQyxDQUFDO1lBQ3RHLHNDQUFpQyxHQUFHLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxLQUFLLENBQUM7WUFFMUUsc0NBQWlDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLG9CQUFZLEVBQXdCLENBQUMsQ0FBQztZQUNyRyxxQ0FBZ0MsR0FBRyxJQUFJLENBQUMsaUNBQWlD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