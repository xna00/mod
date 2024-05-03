/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/map"], function (require, exports, instantiation_1, extensions_1, event_1, uri_1, lifecycle_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyService = exports.IWorkingCopyService = void 0;
    exports.IWorkingCopyService = (0, instantiation_1.createDecorator)('workingCopyService');
    class WorkingCopyService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            //#region Events
            this._onDidRegister = this._register(new event_1.Emitter());
            this.onDidRegister = this._onDidRegister.event;
            this._onDidUnregister = this._register(new event_1.Emitter());
            this.onDidUnregister = this._onDidUnregister.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._workingCopies = new Set();
            this.mapResourceToWorkingCopies = new map_1.ResourceMap();
            this.mapWorkingCopyToListeners = this._register(new lifecycle_1.DisposableMap());
            //#endregion
        }
        //#endregion
        //#region Registry
        get workingCopies() { return Array.from(this._workingCopies.values()); }
        registerWorkingCopy(workingCopy) {
            let workingCopiesForResource = this.mapResourceToWorkingCopies.get(workingCopy.resource);
            if (workingCopiesForResource?.has(workingCopy.typeId)) {
                throw new Error(`Cannot register more than one working copy with the same resource ${workingCopy.resource.toString()} and type ${workingCopy.typeId}.`);
            }
            // Registry (all)
            this._workingCopies.add(workingCopy);
            // Registry (type based)
            if (!workingCopiesForResource) {
                workingCopiesForResource = new Map();
                this.mapResourceToWorkingCopies.set(workingCopy.resource, workingCopiesForResource);
            }
            workingCopiesForResource.set(workingCopy.typeId, workingCopy);
            // Wire in Events
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(workingCopy.onDidChangeContent(() => this._onDidChangeContent.fire(workingCopy)));
            disposables.add(workingCopy.onDidChangeDirty(() => this._onDidChangeDirty.fire(workingCopy)));
            disposables.add(workingCopy.onDidSave(e => this._onDidSave.fire({ workingCopy, ...e })));
            this.mapWorkingCopyToListeners.set(workingCopy, disposables);
            // Send some initial events
            this._onDidRegister.fire(workingCopy);
            if (workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                // Unregister working copy
                this.unregisterWorkingCopy(workingCopy);
                // Signal as event
                this._onDidUnregister.fire(workingCopy);
            });
        }
        unregisterWorkingCopy(workingCopy) {
            // Registry (all)
            this._workingCopies.delete(workingCopy);
            // Registry (type based)
            const workingCopiesForResource = this.mapResourceToWorkingCopies.get(workingCopy.resource);
            if (workingCopiesForResource?.delete(workingCopy.typeId) && workingCopiesForResource.size === 0) {
                this.mapResourceToWorkingCopies.delete(workingCopy.resource);
            }
            // If copy is dirty, ensure to fire an event to signal the dirty change
            // (a disposed working copy cannot account for being dirty in our model)
            if (workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
            // Remove all listeners associated to working copy
            this.mapWorkingCopyToListeners.deleteAndDispose(workingCopy);
        }
        has(resourceOrIdentifier) {
            if (uri_1.URI.isUri(resourceOrIdentifier)) {
                return this.mapResourceToWorkingCopies.has(resourceOrIdentifier);
            }
            return this.mapResourceToWorkingCopies.get(resourceOrIdentifier.resource)?.has(resourceOrIdentifier.typeId) ?? false;
        }
        get(identifier) {
            return this.mapResourceToWorkingCopies.get(identifier.resource)?.get(identifier.typeId);
        }
        getAll(resource) {
            const workingCopies = this.mapResourceToWorkingCopies.get(resource);
            if (!workingCopies) {
                return undefined;
            }
            return Array.from(workingCopies.values());
        }
        //#endregion
        //#region Dirty Tracking
        get hasDirty() {
            for (const workingCopy of this._workingCopies) {
                if (workingCopy.isDirty()) {
                    return true;
                }
            }
            return false;
        }
        get dirtyCount() {
            let totalDirtyCount = 0;
            for (const workingCopy of this._workingCopies) {
                if (workingCopy.isDirty()) {
                    totalDirtyCount++;
                }
            }
            return totalDirtyCount;
        }
        get dirtyWorkingCopies() {
            return this.workingCopies.filter(workingCopy => workingCopy.isDirty());
        }
        get modifiedCount() {
            let totalModifiedCount = 0;
            for (const workingCopy of this._workingCopies) {
                if (workingCopy.isModified()) {
                    totalModifiedCount++;
                }
            }
            return totalModifiedCount;
        }
        get modifiedWorkingCopies() {
            return this.workingCopies.filter(workingCopy => workingCopy.isModified());
        }
        isDirty(resource, typeId) {
            const workingCopies = this.mapResourceToWorkingCopies.get(resource);
            if (workingCopies) {
                // For a specific type
                if (typeof typeId === 'string') {
                    return workingCopies.get(typeId)?.isDirty() ?? false;
                }
                // Across all working copies
                else {
                    for (const [, workingCopy] of workingCopies) {
                        if (workingCopy.isDirty()) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    }
    exports.WorkingCopyService = WorkingCopyService;
    (0, extensions_1.registerSingleton)(exports.IWorkingCopyService, WorkingCopyService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvY29tbW9uL3dvcmtpbmdDb3B5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVbkYsUUFBQSxtQkFBbUIsR0FBRyxJQUFBLCtCQUFlLEVBQXNCLG9CQUFvQixDQUFDLENBQUM7SUE4SDlGLE1BQWEsa0JBQW1CLFNBQVEsc0JBQVU7UUFBbEQ7O1lBSUMsZ0JBQWdCO1lBRUMsbUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFnQixDQUFDLENBQUM7WUFDckUsa0JBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQUVsQyxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFnQixDQUFDLENBQUM7WUFDdkUsb0JBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBRXRDLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWdCLENBQUMsQ0FBQztZQUN4RSxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1lBRXhDLHdCQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWdCLENBQUMsQ0FBQztZQUMxRSx1QkFBa0IsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDO1lBRTVDLGVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF5QixDQUFDLENBQUM7WUFDMUUsY0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lB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