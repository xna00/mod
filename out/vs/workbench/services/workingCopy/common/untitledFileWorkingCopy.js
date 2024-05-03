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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/cancellation", "vs/base/common/async", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/common/stream"], function (require, exports, event_1, lifecycle_1, workingCopyService_1, cancellation_1, async_1, log_1, workingCopyBackup_1, stream_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledFileWorkingCopy = void 0;
    let UntitledFileWorkingCopy = class UntitledFileWorkingCopy extends lifecycle_1.Disposable {
        get model() { return this._model; }
        //#endregion
        constructor(typeId, resource, name, hasAssociatedFilePath, isScratchpad, initialContents, modelFactory, saveDelegate, workingCopyService, workingCopyBackupService, logService) {
            super();
            this.typeId = typeId;
            this.resource = resource;
            this.name = name;
            this.hasAssociatedFilePath = hasAssociatedFilePath;
            this.isScratchpad = isScratchpad;
            this.initialContents = initialContents;
            this.modelFactory = modelFactory;
            this.saveDelegate = saveDelegate;
            this.workingCopyBackupService = workingCopyBackupService;
            this.logService = logService;
            this.capabilities = this.isScratchpad ? 2 /* WorkingCopyCapabilities.Untitled */ | 4 /* WorkingCopyCapabilities.Scratchpad */ : 2 /* WorkingCopyCapabilities.Untitled */;
            this._model = undefined;
            //#region Events
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            //#region Dirty/Modified
            this.modified = this.hasAssociatedFilePath || Boolean(this.initialContents && this.initialContents.markModified !== false);
            // Make known to working copy service
            this._register(workingCopyService.registerWorkingCopy(this));
        }
        isDirty() {
            return this.modified && !this.isScratchpad; // Scratchpad working copies are never dirty
        }
        isModified() {
            return this.modified;
        }
        setModified(modified) {
            if (this.modified === modified) {
                return;
            }
            this.modified = modified;
            if (!this.isScratchpad) {
                this._onDidChangeDirty.fire();
            }
        }
        //#endregion
        //#region Resolve
        async resolve() {
            this.trace('resolve()');
            if (this.isResolved()) {
                this.trace('resolve() - exit (already resolved)');
                // return early if the untitled file working copy is already
                // resolved assuming that the contents have meanwhile changed
                // in the underlying model. we only resolve untitled once.
                return;
            }
            let untitledContents;
            // Check for backups or use initial value or empty
            const backup = await this.workingCopyBackupService.resolve(this);
            if (backup) {
                this.trace('resolve() - with backup');
                untitledContents = backup.value;
            }
            else if (this.initialContents?.value) {
                this.trace('resolve() - with initial contents');
                untitledContents = this.initialContents.value;
            }
            else {
                this.trace('resolve() - empty');
                untitledContents = (0, stream_1.emptyStream)();
            }
            // Create model
            await this.doCreateModel(untitledContents);
            // Untitled associated to file path are modified right away as well as untitled with content
            this.setModified(this.hasAssociatedFilePath || !!backup || Boolean(this.initialContents && this.initialContents.markModified !== false));
            // If we have initial contents, make sure to emit this
            // as the appropriate events to the outside.
            if (!!backup || this.initialContents) {
                this._onDidChangeContent.fire();
            }
        }
        async doCreateModel(contents) {
            this.trace('doCreateModel()');
            // Create model and dispose it when we get disposed
            this._model = this._register(await this.modelFactory.createModel(this.resource, contents, cancellation_1.CancellationToken.None));
            // Model listeners
            this.installModelListeners(this._model);
        }
        installModelListeners(model) {
            // Content Change
            this._register(model.onDidChangeContent(e => this.onModelContentChanged(e)));
            // Lifecycle
            this._register(model.onWillDispose(() => this.dispose()));
        }
        onModelContentChanged(e) {
            // Mark the untitled file working copy as non-modified once its
            // in case provided by the change event and in case we do not
            // have an associated path set
            if (!this.hasAssociatedFilePath && e.isInitial) {
                this.setModified(false);
            }
            // Turn modified otherwise
            else {
                this.setModified(true);
            }
            // Emit as general content change event
            this._onDidChangeContent.fire();
        }
        isResolved() {
            return !!this.model;
        }
        //#endregion
        //#region Backup
        get backupDelay() {
            return this.model?.configuration?.backupDelay;
        }
        async backup(token) {
            let content = undefined;
            // Make sure to check whether this working copy has been
            // resolved or not and fallback to the initial value -
            // if any - to prevent backing up an unresolved working
            // copy and loosing the initial value.
            if (this.isResolved()) {
                content = await (0, async_1.raceCancellation)(this.model.snapshot(token), token);
            }
            else if (this.initialContents) {
                content = this.initialContents.value;
            }
            return { content };
        }
        //#endregion
        //#region Save
        async save(options) {
            this.trace('save()');
            const result = await this.saveDelegate(this, options);
            // Emit Save Event
            if (result) {
                this._onDidSave.fire({ reason: options?.reason, source: options?.source });
            }
            return result;
        }
        //#endregion
        //#region Revert
        async revert() {
            this.trace('revert()');
            // No longer modified
            this.setModified(false);
            // Emit as event
            this._onDidRevert.fire();
            // A reverted untitled file working copy is invalid
            // because it has no actual source on disk to revert to.
            // As such we dispose the model.
            this.dispose();
        }
        //#endregion
        dispose() {
            this.trace('dispose()');
            this._onWillDispose.fire();
            super.dispose();
        }
        trace(msg) {
            this.logService.trace(`[untitled file working copy] ${msg}`, this.resource.toString(), this.typeId);
        }
    };
    exports.UntitledFileWorkingCopy = UntitledFileWorkingCopy;
    exports.UntitledFileWorkingCopy = UntitledFileWorkingCopy = __decorate([
        __param(8, workingCopyService_1.IWorkingCopyService),
        __param(9, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(10, log_1.ILogService)
    ], UntitledFileWorkingCopy);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRGaWxlV29ya2luZ0NvcHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3JraW5nQ29weS9jb21tb24vdW50aXRsZWRGaWxlV29ya2luZ0NvcHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUZ6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUFpRSxTQUFRLHNCQUFVO1FBSy9GLElBQUksS0FBSyxLQUFvQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBbUJsRCxZQUFZO1FBRVosWUFDVSxNQUFjLEVBQ2QsUUFBYSxFQUNiLElBQVksRUFDWixxQkFBOEIsRUFDdEIsWUFBcUIsRUFDckIsZUFBb0UsRUFDcEUsWUFBcUQsRUFDckQsWUFBcUQsRUFDakQsa0JBQXVDLEVBQ2pDLHdCQUFvRSxFQUNsRixVQUF3QztZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQVpDLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCxhQUFRLEdBQVIsUUFBUSxDQUFLO1lBQ2IsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUNaLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBUztZQUN0QixpQkFBWSxHQUFaLFlBQVksQ0FBUztZQUNyQixvQkFBZSxHQUFmLGVBQWUsQ0FBcUQ7WUFDcEUsaUJBQVksR0FBWixZQUFZLENBQXlDO1lBQ3JELGlCQUFZLEdBQVosWUFBWSxDQUF5QztZQUUxQiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTJCO1lBQ2pFLGVBQVUsR0FBVixVQUFVLENBQWE7WUFuQzdDLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMscUZBQXFFLENBQUMsQ0FBQyx5Q0FBaUMsQ0FBQztZQUU3SSxXQUFNLEdBQWtCLFNBQVMsQ0FB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