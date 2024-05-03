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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/severity", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/platform/notification/common/notification", "vs/platform/undoRedo/common/undoRedo"], function (require, exports, errors_1, lifecycle_1, network_1, severity_1, nls, dialogs_1, extensions_1, notification_1, undoRedo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UndoRedoService = void 0;
    const DEBUG = false;
    function getResourceLabel(resource) {
        return resource.scheme === network_1.Schemas.file ? resource.fsPath : resource.path;
    }
    let stackElementCounter = 0;
    class ResourceStackElement {
        constructor(actual, resourceLabel, strResource, groupId, groupOrder, sourceId, sourceOrder) {
            this.id = (++stackElementCounter);
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.actual = actual;
            this.label = actual.label;
            this.confirmBeforeUndo = actual.confirmBeforeUndo || false;
            this.resourceLabel = resourceLabel;
            this.strResource = strResource;
            this.resourceLabels = [this.resourceLabel];
            this.strResources = [this.strResource];
            this.groupId = groupId;
            this.groupOrder = groupOrder;
            this.sourceId = sourceId;
            this.sourceOrder = sourceOrder;
            this.isValid = true;
        }
        setValid(isValid) {
            this.isValid = isValid;
        }
        toString() {
            return `[id:${this.id}] [group:${this.groupId}] [${this.isValid ? '  VALID' : 'INVALID'}] ${this.actual.constructor.name} - ${this.actual}`;
        }
    }
    var RemovedResourceReason;
    (function (RemovedResourceReason) {
        RemovedResourceReason[RemovedResourceReason["ExternalRemoval"] = 0] = "ExternalRemoval";
        RemovedResourceReason[RemovedResourceReason["NoParallelUniverses"] = 1] = "NoParallelUniverses";
    })(RemovedResourceReason || (RemovedResourceReason = {}));
    class ResourceReasonPair {
        constructor(resourceLabel, reason) {
            this.resourceLabel = resourceLabel;
            this.reason = reason;
        }
    }
    class RemovedResources {
        constructor() {
            this.elements = new Map();
        }
        createMessage() {
            const externalRemoval = [];
            const noParallelUniverses = [];
            for (const [, element] of this.elements) {
                const dest = (element.reason === 0 /* RemovedResourceReason.ExternalRemoval */
                    ? externalRemoval
                    : noParallelUniverses);
                dest.push(element.resourceLabel);
            }
            const messages = [];
            if (externalRemoval.length > 0) {
                messages.push(nls.localize({ key: 'externalRemoval', comment: ['{0} is a list of filenames'] }, "The following files have been closed and modified on disk: {0}.", externalRemoval.join(', ')));
            }
            if (noParallelUniverses.length > 0) {
                messages.push(nls.localize({ key: 'noParallelUniverses', comment: ['{0} is a list of filenames'] }, "The following files have been modified in an incompatible way: {0}.", noParallelUniverses.join(', ')));
            }
            return messages.join('\n');
        }
        get size() {
            return this.elements.size;
        }
        has(strResource) {
            return this.elements.has(strResource);
        }
        set(strResource, value) {
            this.elements.set(strResource, value);
        }
        delete(strResource) {
            return this.elements.delete(strResource);
        }
    }
    class WorkspaceStackElement {
        constructor(actual, resourceLabels, strResources, groupId, groupOrder, sourceId, sourceOrder) {
            this.id = (++stackElementCounter);
            this.type = 1 /* UndoRedoElementType.Workspace */;
            this.actual = actual;
            this.label = actual.label;
            this.confirmBeforeUndo = actual.confirmBeforeUndo || false;
            this.resourceLabels = resourceLabels;
            this.strResources = strResources;
            this.groupId = groupId;
            this.groupOrder = groupOrder;
            this.sourceId = sourceId;
            this.sourceOrder = sourceOrder;
            this.removedResources = null;
            this.invalidatedResources = null;
        }
        canSplit() {
            return (typeof this.actual.split === 'function');
        }
        removeResource(resourceLabel, strResource, reason) {
            if (!this.removedResources) {
                this.removedResources = new RemovedResources();
            }
            if (!this.removedResources.has(strResource)) {
                this.removedResources.set(strResource, new ResourceReasonPair(resourceLabel, reason));
            }
        }
        setValid(resourceLabel, strResource, isValid) {
            if (isValid) {
                if (this.invalidatedResources) {
                    this.invalidatedResources.delete(strResource);
                    if (this.invalidatedResources.size === 0) {
                        this.invalidatedResources = null;
                    }
                }
            }
            else {
                if (!this.invalidatedResources) {
                    this.invalidatedResources = new RemovedResources();
                }
                if (!this.invalidatedResources.has(strResource)) {
                    this.invalidatedResources.set(strResource, new ResourceReasonPair(resourceLabel, 0 /* RemovedResourceReason.ExternalRemoval */));
                }
            }
        }
        toString() {
            return `[id:${this.id}] [group:${this.groupId}] [${this.invalidatedResources ? 'INVALID' : '  VALID'}] ${this.actual.constructor.name} - ${this.actual}`;
        }
    }
    class ResourceEditStack {
        constructor(resourceLabel, strResource) {
            this.resourceLabel = resourceLabel;
            this.strResource = strResource;
            this._past = [];
            this._future = [];
            this.locked = false;
            this.versionId = 1;
        }
        dispose() {
            for (const element of this._past) {
                if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                    element.removeResource(this.resourceLabel, this.strResource, 0 /* RemovedResourceReason.ExternalRemoval */);
                }
            }
            for (const element of this._future) {
                if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                    element.removeResource(this.resourceLabel, this.strResource, 0 /* RemovedResourceReason.ExternalRemoval */);
                }
            }
            this.versionId++;
        }
        toString() {
            const result = [];
            result.push(`* ${this.strResource}:`);
            for (let i = 0; i < this._past.length; i++) {
                result.push(`   * [UNDO] ${this._past[i]}`);
            }
            for (let i = this._future.length - 1; i >= 0; i--) {
                result.push(`   * [REDO] ${this._future[i]}`);
            }
            return result.join('\n');
        }
        flushAllElements() {
            this._past = [];
            this._future = [];
            this.versionId++;
        }
        setElementsIsValid(isValid) {
            for (const element of this._past) {
                if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                    element.setValid(this.resourceLabel, this.strResource, isValid);
                }
                else {
                    element.setValid(isValid);
                }
            }
            for (const element of this._future) {
                if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                    element.setValid(this.resourceLabel, this.strResource, isValid);
                }
                else {
                    element.setValid(isValid);
                }
            }
        }
        _setElementValidFlag(element, isValid) {
            if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                element.setValid(this.resourceLabel, this.strResource, isValid);
            }
            else {
                element.setValid(isValid);
            }
        }
        setElementsValidFlag(isValid, filter) {
            for (const element of this._past) {
                if (filter(element.actual)) {
                    this._setElementValidFlag(element, isValid);
                }
            }
            for (const element of this._future) {
                if (filter(element.actual)) {
                    this._setElementValidFlag(element, isValid);
                }
            }
        }
        pushElement(element) {
            // remove the future
            for (const futureElement of this._future) {
                if (futureElement.type === 1 /* UndoRedoElementType.Workspace */) {
                    futureElement.removeResource(this.resourceLabel, this.strResource, 1 /* RemovedResourceReason.NoParallelUniverses */);
                }
            }
            this._future = [];
            this._past.push(element);
            this.versionId++;
        }
        createSnapshot(resource) {
            const elements = [];
            for (let i = 0, len = this._past.length; i < len; i++) {
                elements.push(this._past[i].id);
            }
            for (let i = this._future.length - 1; i >= 0; i--) {
                elements.push(this._future[i].id);
            }
            return new undoRedo_1.ResourceEditStackSnapshot(resource, elements);
        }
        restoreSnapshot(snapshot) {
            const snapshotLength = snapshot.elements.length;
            let isOK = true;
            let snapshotIndex = 0;
            let removePastAfter = -1;
            for (let i = 0, len = this._past.length; i < len; i++, snapshotIndex++) {
                const element = this._past[i];
                if (isOK && (snapshotIndex >= snapshotLength || element.id !== snapshot.elements[snapshotIndex])) {
                    isOK = false;
                    removePastAfter = 0;
                }
                if (!isOK && element.type === 1 /* UndoRedoElementType.Workspace */) {
                    element.removeResource(this.resourceLabel, this.strResource, 0 /* RemovedResourceReason.ExternalRemoval */);
                }
            }
            let removeFutureBefore = -1;
            for (let i = this._future.length - 1; i >= 0; i--, snapshotIndex++) {
                const element = this._future[i];
                if (isOK && (snapshotIndex >= snapshotLength || element.id !== snapshot.elements[snapshotIndex])) {
                    isOK = false;
                    removeFutureBefore = i;
                }
                if (!isOK && element.type === 1 /* UndoRedoElementType.Workspace */) {
                    element.removeResource(this.resourceLabel, this.strResource, 0 /* RemovedResourceReason.ExternalRemoval */);
                }
            }
            if (removePastAfter !== -1) {
                this._past = this._past.slice(0, removePastAfter);
            }
            if (removeFutureBefore !== -1) {
                this._future = this._future.slice(removeFutureBefore + 1);
            }
            this.versionId++;
        }
        getElements() {
            const past = [];
            const future = [];
            for (const element of this._past) {
                past.push(element.actual);
            }
            for (const element of this._future) {
                future.push(element.actual);
            }
            return { past, future };
        }
        getClosestPastElement() {
            if (this._past.length === 0) {
                return null;
            }
            return this._past[this._past.length - 1];
        }
        getSecondClosestPastElement() {
            if (this._past.length < 2) {
                return null;
            }
            return this._past[this._past.length - 2];
        }
        getClosestFutureElement() {
            if (this._future.length === 0) {
                return null;
            }
            return this._future[this._future.length - 1];
        }
        hasPastElements() {
            return (this._past.length > 0);
        }
        hasFutureElements() {
            return (this._future.length > 0);
        }
        splitPastWorkspaceElement(toRemove, individualMap) {
            for (let j = this._past.length - 1; j >= 0; j--) {
                if (this._past[j] === toRemove) {
                    if (individualMap.has(this.strResource)) {
                        // gets replaced
                        this._past[j] = individualMap.get(this.strResource);
                    }
                    else {
                        // gets deleted
                        this._past.splice(j, 1);
                    }
                    break;
                }
            }
            this.versionId++;
        }
        splitFutureWorkspaceElement(toRemove, individualMap) {
            for (let j = this._future.length - 1; j >= 0; j--) {
                if (this._future[j] === toRemove) {
                    if (individualMap.has(this.strResource)) {
                        // gets replaced
                        this._future[j] = individualMap.get(this.strResource);
                    }
                    else {
                        // gets deleted
                        this._future.splice(j, 1);
                    }
                    break;
                }
            }
            this.versionId++;
        }
        moveBackward(element) {
            this._past.pop();
            this._future.push(element);
            this.versionId++;
        }
        moveForward(element) {
            this._future.pop();
            this._past.push(element);
            this.versionId++;
        }
    }
    class EditStackSnapshot {
        constructor(editStacks) {
            this.editStacks = editStacks;
            this._versionIds = [];
            for (let i = 0, len = this.editStacks.length; i < len; i++) {
                this._versionIds[i] = this.editStacks[i].versionId;
            }
        }
        isValid() {
            for (let i = 0, len = this.editStacks.length; i < len; i++) {
                if (this._versionIds[i] !== this.editStacks[i].versionId) {
                    return false;
                }
            }
            return true;
        }
    }
    const missingEditStack = new ResourceEditStack('', '');
    missingEditStack.locked = true;
    let UndoRedoService = class UndoRedoService {
        constructor(_dialogService, _notificationService) {
            this._dialogService = _dialogService;
            this._notificationService = _notificationService;
            this._editStacks = new Map();
            this._uriComparisonKeyComputers = [];
        }
        registerUriComparisonKeyComputer(scheme, uriComparisonKeyComputer) {
            this._uriComparisonKeyComputers.push([scheme, uriComparisonKeyComputer]);
            return {
                dispose: () => {
                    for (let i = 0, len = this._uriComparisonKeyComputers.length; i < len; i++) {
                        if (this._uriComparisonKeyComputers[i][1] === uriComparisonKeyComputer) {
                            this._uriComparisonKeyComputers.splice(i, 1);
                            return;
                        }
                    }
                }
            };
        }
        getUriComparisonKey(resource) {
            for (const uriComparisonKeyComputer of this._uriComparisonKeyComputers) {
                if (uriComparisonKeyComputer[0] === resource.scheme) {
                    return uriComparisonKeyComputer[1].getComparisonKey(resource);
                }
            }
            return resource.toString();
        }
        _print(label) {
            console.log(`------------------------------------`);
            console.log(`AFTER ${label}: `);
            const str = [];
            for (const element of this._editStacks) {
                str.push(element[1].toString());
            }
            console.log(str.join('\n'));
        }
        pushElement(element, group = undoRedo_1.UndoRedoGroup.None, source = undoRedo_1.UndoRedoSource.None) {
            if (element.type === 0 /* UndoRedoElementType.Resource */) {
                const resourceLabel = getResourceLabel(element.resource);
                const strResource = this.getUriComparisonKey(element.resource);
                this._pushElement(new ResourceStackElement(element, resourceLabel, strResource, group.id, group.nextOrder(), source.id, source.nextOrder()));
            }
            else {
                const seen = new Set();
                const resourceLabels = [];
                const strResources = [];
                for (const resource of element.resources) {
                    const resourceLabel = getResourceLabel(resource);
                    const strResource = this.getUriComparisonKey(resource);
                    if (seen.has(strResource)) {
                        continue;
                    }
                    seen.add(strResource);
                    resourceLabels.push(resourceLabel);
                    strResources.push(strResource);
                }
                if (resourceLabels.length === 1) {
                    this._pushElement(new ResourceStackElement(element, resourceLabels[0], strResources[0], group.id, group.nextOrder(), source.id, source.nextOrder()));
                }
                else {
                    this._pushElement(new WorkspaceStackElement(element, resourceLabels, strResources, group.id, group.nextOrder(), source.id, source.nextOrder()));
                }
            }
            if (DEBUG) {
                this._print('pushElement');
            }
        }
        _pushElement(element) {
            for (let i = 0, len = element.strResources.length; i < len; i++) {
                const resourceLabel = element.resourceLabels[i];
                const strResource = element.strResources[i];
                let editStack;
                if (this._editStacks.has(strResource)) {
                    editStack = this._editStacks.get(strResource);
                }
                else {
                    editStack = new ResourceEditStack(resourceLabel, strResource);
                    this._editStacks.set(strResource, editStack);
                }
                editStack.pushElement(element);
            }
        }
        getLastElement(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                if (editStack.hasFutureElements()) {
                    return null;
                }
                const closestPastElement = editStack.getClosestPastElement();
                return closestPastElement ? closestPastElement.actual : null;
            }
            return null;
        }
        _splitPastWorkspaceElement(toRemove, ignoreResources) {
            const individualArr = toRemove.actual.split();
            const individualMap = new Map();
            for (const _element of individualArr) {
                const resourceLabel = getResourceLabel(_element.resource);
                const strResource = this.getUriComparisonKey(_element.resource);
                const element = new ResourceStackElement(_element, resourceLabel, strResource, 0, 0, 0, 0);
                individualMap.set(element.strResource, element);
            }
            for (const strResource of toRemove.strResources) {
                if (ignoreResources && ignoreResources.has(strResource)) {
                    continue;
                }
                const editStack = this._editStacks.get(strResource);
                editStack.splitPastWorkspaceElement(toRemove, individualMap);
            }
        }
        _splitFutureWorkspaceElement(toRemove, ignoreResources) {
            const individualArr = toRemove.actual.split();
            const individualMap = new Map();
            for (const _element of individualArr) {
                const resourceLabel = getResourceLabel(_element.resource);
                const strResource = this.getUriComparisonKey(_element.resource);
                const element = new ResourceStackElement(_element, resourceLabel, strResource, 0, 0, 0, 0);
                individualMap.set(element.strResource, element);
            }
            for (const strResource of toRemove.strResources) {
                if (ignoreResources && ignoreResources.has(strResource)) {
                    continue;
                }
                const editStack = this._editStacks.get(strResource);
                editStack.splitFutureWorkspaceElement(toRemove, individualMap);
            }
        }
        removeElements(resource) {
            const strResource = typeof resource === 'string' ? resource : this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                editStack.dispose();
                this._editStacks.delete(strResource);
            }
            if (DEBUG) {
                this._print('removeElements');
            }
        }
        setElementsValidFlag(resource, isValid, filter) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                editStack.setElementsValidFlag(isValid, filter);
            }
            if (DEBUG) {
                this._print('setElementsValidFlag');
            }
        }
        hasElements(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return (editStack.hasPastElements() || editStack.hasFutureElements());
            }
            return false;
        }
        createSnapshot(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return editStack.createSnapshot(resource);
            }
            return new undoRedo_1.ResourceEditStackSnapshot(resource, []);
        }
        restoreSnapshot(snapshot) {
            const strResource = this.getUriComparisonKey(snapshot.resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                editStack.restoreSnapshot(snapshot);
                if (!editStack.hasPastElements() && !editStack.hasFutureElements()) {
                    // the edit stack is now empty, just remove it entirely
                    editStack.dispose();
                    this._editStacks.delete(strResource);
                }
            }
            if (DEBUG) {
                this._print('restoreSnapshot');
            }
        }
        getElements(resource) {
            const strResource = this.getUriComparisonKey(resource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return editStack.getElements();
            }
            return { past: [], future: [] };
        }
        _findClosestUndoElementWithSource(sourceId) {
            if (!sourceId) {
                return [null, null];
            }
            // find an element with the sourceId and with the highest sourceOrder ready to be undone
            let matchedElement = null;
            let matchedStrResource = null;
            for (const [strResource, editStack] of this._editStacks) {
                const candidate = editStack.getClosestPastElement();
                if (!candidate) {
                    continue;
                }
                if (candidate.sourceId === sourceId) {
                    if (!matchedElement || candidate.sourceOrder > matchedElement.sourceOrder) {
                        matchedElement = candidate;
                        matchedStrResource = strResource;
                    }
                }
            }
            return [matchedElement, matchedStrResource];
        }
        canUndo(resourceOrSource) {
            if (resourceOrSource instanceof undoRedo_1.UndoRedoSource) {
                const [, matchedStrResource] = this._findClosestUndoElementWithSource(resourceOrSource.id);
                return matchedStrResource ? true : false;
            }
            const strResource = this.getUriComparisonKey(resourceOrSource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return editStack.hasPastElements();
            }
            return false;
        }
        _onError(err, element) {
            (0, errors_1.onUnexpectedError)(err);
            // An error occurred while undoing or redoing => drop the undo/redo stack for all affected resources
            for (const strResource of element.strResources) {
                this.removeElements(strResource);
            }
            this._notificationService.error(err);
        }
        _acquireLocks(editStackSnapshot) {
            // first, check if all locks can be acquired
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.locked) {
                    throw new Error('Cannot acquire edit stack lock');
                }
            }
            // can acquire all locks
            for (const editStack of editStackSnapshot.editStacks) {
                editStack.locked = true;
            }
            return () => {
                // release all locks
                for (const editStack of editStackSnapshot.editStacks) {
                    editStack.locked = false;
                }
            };
        }
        _safeInvokeWithLocks(element, invoke, editStackSnapshot, cleanup, continuation) {
            const releaseLocks = this._acquireLocks(editStackSnapshot);
            let result;
            try {
                result = invoke();
            }
            catch (err) {
                releaseLocks();
                cleanup.dispose();
                return this._onError(err, element);
            }
            if (result) {
                // result is Promise<void>
                return result.then(() => {
                    releaseLocks();
                    cleanup.dispose();
                    return continuation();
                }, (err) => {
                    releaseLocks();
                    cleanup.dispose();
                    return this._onError(err, element);
                });
            }
            else {
                // result is void
                releaseLocks();
                cleanup.dispose();
                return continuation();
            }
        }
        async _invokeWorkspacePrepare(element) {
            if (typeof element.actual.prepareUndoRedo === 'undefined') {
                return lifecycle_1.Disposable.None;
            }
            const result = element.actual.prepareUndoRedo();
            if (typeof result === 'undefined') {
                return lifecycle_1.Disposable.None;
            }
            return result;
        }
        _invokeResourcePrepare(element, callback) {
            if (element.actual.type !== 1 /* UndoRedoElementType.Workspace */ || typeof element.actual.prepareUndoRedo === 'undefined') {
                // no preparation needed
                return callback(lifecycle_1.Disposable.None);
            }
            const r = element.actual.prepareUndoRedo();
            if (!r) {
                // nothing to clean up
                return callback(lifecycle_1.Disposable.None);
            }
            if ((0, lifecycle_1.isDisposable)(r)) {
                return callback(r);
            }
            return r.then((disposable) => {
                return callback(disposable);
            });
        }
        _getAffectedEditStacks(element) {
            const affectedEditStacks = [];
            for (const strResource of element.strResources) {
                affectedEditStacks.push(this._editStacks.get(strResource) || missingEditStack);
            }
            return new EditStackSnapshot(affectedEditStacks);
        }
        _tryToSplitAndUndo(strResource, element, ignoreResources, message) {
            if (element.canSplit()) {
                this._splitPastWorkspaceElement(element, ignoreResources);
                this._notificationService.warn(message);
                return new WorkspaceVerificationError(this._undo(strResource, 0, true));
            }
            else {
                // Cannot safely split this workspace element => flush all undo/redo stacks
                for (const strResource of element.strResources) {
                    this.removeElements(strResource);
                }
                this._notificationService.warn(message);
                return new WorkspaceVerificationError();
            }
        }
        _checkWorkspaceUndo(strResource, element, editStackSnapshot, checkInvalidatedResources) {
            if (element.removedResources) {
                return this._tryToSplitAndUndo(strResource, element, element.removedResources, nls.localize({ key: 'cannotWorkspaceUndo', comment: ['{0} is a label for an operation. {1} is another message.'] }, "Could not undo '{0}' across all files. {1}", element.label, element.removedResources.createMessage()));
            }
            if (checkInvalidatedResources && element.invalidatedResources) {
                return this._tryToSplitAndUndo(strResource, element, element.invalidatedResources, nls.localize({ key: 'cannotWorkspaceUndo', comment: ['{0} is a label for an operation. {1} is another message.'] }, "Could not undo '{0}' across all files. {1}", element.label, element.invalidatedResources.createMessage()));
            }
            // this must be the last past element in all the impacted resources!
            const cannotUndoDueToResources = [];
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.getClosestPastElement() !== element) {
                    cannotUndoDueToResources.push(editStack.resourceLabel);
                }
            }
            if (cannotUndoDueToResources.length > 0) {
                return this._tryToSplitAndUndo(strResource, element, null, nls.localize({ key: 'cannotWorkspaceUndoDueToChanges', comment: ['{0} is a label for an operation. {1} is a list of filenames.'] }, "Could not undo '{0}' across all files because changes were made to {1}", element.label, cannotUndoDueToResources.join(', ')));
            }
            const cannotLockDueToResources = [];
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.locked) {
                    cannotLockDueToResources.push(editStack.resourceLabel);
                }
            }
            if (cannotLockDueToResources.length > 0) {
                return this._tryToSplitAndUndo(strResource, element, null, nls.localize({ key: 'cannotWorkspaceUndoDueToInProgressUndoRedo', comment: ['{0} is a label for an operation. {1} is a list of filenames.'] }, "Could not undo '{0}' across all files because there is already an undo or redo operation running on {1}", element.label, cannotLockDueToResources.join(', ')));
            }
            // check if new stack elements were added in the meantime...
            if (!editStackSnapshot.isValid()) {
                return this._tryToSplitAndUndo(strResource, element, null, nls.localize({ key: 'cannotWorkspaceUndoDueToInMeantimeUndoRedo', comment: ['{0} is a label for an operation. {1} is a list of filenames.'] }, "Could not undo '{0}' across all files because an undo or redo operation occurred in the meantime", element.label));
            }
            return null;
        }
        _workspaceUndo(strResource, element, undoConfirmed) {
            const affectedEditStacks = this._getAffectedEditStacks(element);
            const verificationError = this._checkWorkspaceUndo(strResource, element, affectedEditStacks, /*invalidated resources will be checked after the prepare call*/ false);
            if (verificationError) {
                return verificationError.returnValue;
            }
            return this._confirmAndExecuteWorkspaceUndo(strResource, element, affectedEditStacks, undoConfirmed);
        }
        _isPartOfUndoGroup(element) {
            if (!element.groupId) {
                return false;
            }
            // check that there is at least another element with the same groupId ready to be undone
            for (const [, editStack] of this._editStacks) {
                const pastElement = editStack.getClosestPastElement();
                if (!pastElement) {
                    continue;
                }
                if (pastElement === element) {
                    const secondPastElement = editStack.getSecondClosestPastElement();
                    if (secondPastElement && secondPastElement.groupId === element.groupId) {
                        // there is another element with the same group id in the same stack!
                        return true;
                    }
                }
                if (pastElement.groupId === element.groupId) {
                    // there is another element with the same group id in another stack!
                    return true;
                }
            }
            return false;
        }
        async _confirmAndExecuteWorkspaceUndo(strResource, element, editStackSnapshot, undoConfirmed) {
            if (element.canSplit() && !this._isPartOfUndoGroup(element)) {
                // this element can be split
                let UndoChoice;
                (function (UndoChoice) {
                    UndoChoice[UndoChoice["All"] = 0] = "All";
                    UndoChoice[UndoChoice["This"] = 1] = "This";
                    UndoChoice[UndoChoice["Cancel"] = 2] = "Cancel";
                })(UndoChoice || (UndoChoice = {}));
                const { result } = await this._dialogService.prompt({
                    type: severity_1.default.Info,
                    message: nls.localize('confirmWorkspace', "Would you like to undo '{0}' across all files?", element.label),
                    buttons: [
                        {
                            label: nls.localize({ key: 'ok', comment: ['{0} denotes a number that is > 1, && denotes a mnemonic'] }, "&&Undo in {0} Files", editStackSnapshot.editStacks.length),
                            run: () => UndoChoice.All
                        },
                        {
                            label: nls.localize({ key: 'nok', comment: ['&& denotes a mnemonic'] }, "Undo this &&File"),
                            run: () => UndoChoice.This
                        }
                    ],
                    cancelButton: {
                        run: () => UndoChoice.Cancel
                    }
                });
                if (result === UndoChoice.Cancel) {
                    // choice: cancel
                    return;
                }
                if (result === UndoChoice.This) {
                    // choice: undo this file
                    this._splitPastWorkspaceElement(element, null);
                    return this._undo(strResource, 0, true);
                }
                // choice: undo in all files
                // At this point, it is possible that the element has been made invalid in the meantime (due to the confirmation await)
                const verificationError1 = this._checkWorkspaceUndo(strResource, element, editStackSnapshot, /*invalidated resources will be checked after the prepare call*/ false);
                if (verificationError1) {
                    return verificationError1.returnValue;
                }
                undoConfirmed = true;
            }
            // prepare
            let cleanup;
            try {
                cleanup = await this._invokeWorkspacePrepare(element);
            }
            catch (err) {
                return this._onError(err, element);
            }
            // At this point, it is possible that the element has been made invalid in the meantime (due to the prepare await)
            const verificationError2 = this._checkWorkspaceUndo(strResource, element, editStackSnapshot, /*now also check that there are no more invalidated resources*/ true);
            if (verificationError2) {
                cleanup.dispose();
                return verificationError2.returnValue;
            }
            for (const editStack of editStackSnapshot.editStacks) {
                editStack.moveBackward(element);
            }
            return this._safeInvokeWithLocks(element, () => element.actual.undo(), editStackSnapshot, cleanup, () => this._continueUndoInGroup(element.groupId, undoConfirmed));
        }
        _resourceUndo(editStack, element, undoConfirmed) {
            if (!element.isValid) {
                // invalid element => immediately flush edit stack!
                editStack.flushAllElements();
                return;
            }
            if (editStack.locked) {
                const message = nls.localize({ key: 'cannotResourceUndoDueToInProgressUndoRedo', comment: ['{0} is a label for an operation.'] }, "Could not undo '{0}' because there is already an undo or redo operation running.", element.label);
                this._notificationService.warn(message);
                return;
            }
            return this._invokeResourcePrepare(element, (cleanup) => {
                editStack.moveBackward(element);
                return this._safeInvokeWithLocks(element, () => element.actual.undo(), new EditStackSnapshot([editStack]), cleanup, () => this._continueUndoInGroup(element.groupId, undoConfirmed));
            });
        }
        _findClosestUndoElementInGroup(groupId) {
            if (!groupId) {
                return [null, null];
            }
            // find another element with the same groupId and with the highest groupOrder ready to be undone
            let matchedElement = null;
            let matchedStrResource = null;
            for (const [strResource, editStack] of this._editStacks) {
                const candidate = editStack.getClosestPastElement();
                if (!candidate) {
                    continue;
                }
                if (candidate.groupId === groupId) {
                    if (!matchedElement || candidate.groupOrder > matchedElement.groupOrder) {
                        matchedElement = candidate;
                        matchedStrResource = strResource;
                    }
                }
            }
            return [matchedElement, matchedStrResource];
        }
        _continueUndoInGroup(groupId, undoConfirmed) {
            if (!groupId) {
                return;
            }
            const [, matchedStrResource] = this._findClosestUndoElementInGroup(groupId);
            if (matchedStrResource) {
                return this._undo(matchedStrResource, 0, undoConfirmed);
            }
        }
        undo(resourceOrSource) {
            if (resourceOrSource instanceof undoRedo_1.UndoRedoSource) {
                const [, matchedStrResource] = this._findClosestUndoElementWithSource(resourceOrSource.id);
                return matchedStrResource ? this._undo(matchedStrResource, resourceOrSource.id, false) : undefined;
            }
            if (typeof resourceOrSource === 'string') {
                return this._undo(resourceOrSource, 0, false);
            }
            return this._undo(this.getUriComparisonKey(resourceOrSource), 0, false);
        }
        _undo(strResource, sourceId = 0, undoConfirmed) {
            if (!this._editStacks.has(strResource)) {
                return;
            }
            const editStack = this._editStacks.get(strResource);
            const element = editStack.getClosestPastElement();
            if (!element) {
                return;
            }
            if (element.groupId) {
                // this element is a part of a group, we need to make sure undoing in a group is in order
                const [matchedElement, matchedStrResource] = this._findClosestUndoElementInGroup(element.groupId);
                if (element !== matchedElement && matchedStrResource) {
                    // there is an element in the same group that should be undone before this one
                    return this._undo(matchedStrResource, sourceId, undoConfirmed);
                }
            }
            const shouldPromptForConfirmation = (element.sourceId !== sourceId || element.confirmBeforeUndo);
            if (shouldPromptForConfirmation && !undoConfirmed) {
                // Hit a different source or the element asks for prompt before undo, prompt for confirmation
                return this._confirmAndContinueUndo(strResource, sourceId, element);
            }
            try {
                if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                    return this._workspaceUndo(strResource, element, undoConfirmed);
                }
                else {
                    return this._resourceUndo(editStack, element, undoConfirmed);
                }
            }
            finally {
                if (DEBUG) {
                    this._print('undo');
                }
            }
        }
        async _confirmAndContinueUndo(strResource, sourceId, element) {
            const result = await this._dialogService.confirm({
                message: nls.localize('confirmDifferentSource', "Would you like to undo '{0}'?", element.label),
                primaryButton: nls.localize({ key: 'confirmDifferentSource.yes', comment: ['&& denotes a mnemonic'] }, "&&Yes"),
                cancelButton: nls.localize('confirmDifferentSource.no', "No")
            });
            if (!result.confirmed) {
                return;
            }
            return this._undo(strResource, sourceId, true);
        }
        _findClosestRedoElementWithSource(sourceId) {
            if (!sourceId) {
                return [null, null];
            }
            // find an element with sourceId and with the lowest sourceOrder ready to be redone
            let matchedElement = null;
            let matchedStrResource = null;
            for (const [strResource, editStack] of this._editStacks) {
                const candidate = editStack.getClosestFutureElement();
                if (!candidate) {
                    continue;
                }
                if (candidate.sourceId === sourceId) {
                    if (!matchedElement || candidate.sourceOrder < matchedElement.sourceOrder) {
                        matchedElement = candidate;
                        matchedStrResource = strResource;
                    }
                }
            }
            return [matchedElement, matchedStrResource];
        }
        canRedo(resourceOrSource) {
            if (resourceOrSource instanceof undoRedo_1.UndoRedoSource) {
                const [, matchedStrResource] = this._findClosestRedoElementWithSource(resourceOrSource.id);
                return matchedStrResource ? true : false;
            }
            const strResource = this.getUriComparisonKey(resourceOrSource);
            if (this._editStacks.has(strResource)) {
                const editStack = this._editStacks.get(strResource);
                return editStack.hasFutureElements();
            }
            return false;
        }
        _tryToSplitAndRedo(strResource, element, ignoreResources, message) {
            if (element.canSplit()) {
                this._splitFutureWorkspaceElement(element, ignoreResources);
                this._notificationService.warn(message);
                return new WorkspaceVerificationError(this._redo(strResource));
            }
            else {
                // Cannot safely split this workspace element => flush all undo/redo stacks
                for (const strResource of element.strResources) {
                    this.removeElements(strResource);
                }
                this._notificationService.warn(message);
                return new WorkspaceVerificationError();
            }
        }
        _checkWorkspaceRedo(strResource, element, editStackSnapshot, checkInvalidatedResources) {
            if (element.removedResources) {
                return this._tryToSplitAndRedo(strResource, element, element.removedResources, nls.localize({ key: 'cannotWorkspaceRedo', comment: ['{0} is a label for an operation. {1} is another message.'] }, "Could not redo '{0}' across all files. {1}", element.label, element.removedResources.createMessage()));
            }
            if (checkInvalidatedResources && element.invalidatedResources) {
                return this._tryToSplitAndRedo(strResource, element, element.invalidatedResources, nls.localize({ key: 'cannotWorkspaceRedo', comment: ['{0} is a label for an operation. {1} is another message.'] }, "Could not redo '{0}' across all files. {1}", element.label, element.invalidatedResources.createMessage()));
            }
            // this must be the last future element in all the impacted resources!
            const cannotRedoDueToResources = [];
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.getClosestFutureElement() !== element) {
                    cannotRedoDueToResources.push(editStack.resourceLabel);
                }
            }
            if (cannotRedoDueToResources.length > 0) {
                return this._tryToSplitAndRedo(strResource, element, null, nls.localize({ key: 'cannotWorkspaceRedoDueToChanges', comment: ['{0} is a label for an operation. {1} is a list of filenames.'] }, "Could not redo '{0}' across all files because changes were made to {1}", element.label, cannotRedoDueToResources.join(', ')));
            }
            const cannotLockDueToResources = [];
            for (const editStack of editStackSnapshot.editStacks) {
                if (editStack.locked) {
                    cannotLockDueToResources.push(editStack.resourceLabel);
                }
            }
            if (cannotLockDueToResources.length > 0) {
                return this._tryToSplitAndRedo(strResource, element, null, nls.localize({ key: 'cannotWorkspaceRedoDueToInProgressUndoRedo', comment: ['{0} is a label for an operation. {1} is a list of filenames.'] }, "Could not redo '{0}' across all files because there is already an undo or redo operation running on {1}", element.label, cannotLockDueToResources.join(', ')));
            }
            // check if new stack elements were added in the meantime...
            if (!editStackSnapshot.isValid()) {
                return this._tryToSplitAndRedo(strResource, element, null, nls.localize({ key: 'cannotWorkspaceRedoDueToInMeantimeUndoRedo', comment: ['{0} is a label for an operation. {1} is a list of filenames.'] }, "Could not redo '{0}' across all files because an undo or redo operation occurred in the meantime", element.label));
            }
            return null;
        }
        _workspaceRedo(strResource, element) {
            const affectedEditStacks = this._getAffectedEditStacks(element);
            const verificationError = this._checkWorkspaceRedo(strResource, element, affectedEditStacks, /*invalidated resources will be checked after the prepare call*/ false);
            if (verificationError) {
                return verificationError.returnValue;
            }
            return this._executeWorkspaceRedo(strResource, element, affectedEditStacks);
        }
        async _executeWorkspaceRedo(strResource, element, editStackSnapshot) {
            // prepare
            let cleanup;
            try {
                cleanup = await this._invokeWorkspacePrepare(element);
            }
            catch (err) {
                return this._onError(err, element);
            }
            // At this point, it is possible that the element has been made invalid in the meantime (due to the prepare await)
            const verificationError = this._checkWorkspaceRedo(strResource, element, editStackSnapshot, /*now also check that there are no more invalidated resources*/ true);
            if (verificationError) {
                cleanup.dispose();
                return verificationError.returnValue;
            }
            for (const editStack of editStackSnapshot.editStacks) {
                editStack.moveForward(element);
            }
            return this._safeInvokeWithLocks(element, () => element.actual.redo(), editStackSnapshot, cleanup, () => this._continueRedoInGroup(element.groupId));
        }
        _resourceRedo(editStack, element) {
            if (!element.isValid) {
                // invalid element => immediately flush edit stack!
                editStack.flushAllElements();
                return;
            }
            if (editStack.locked) {
                const message = nls.localize({ key: 'cannotResourceRedoDueToInProgressUndoRedo', comment: ['{0} is a label for an operation.'] }, "Could not redo '{0}' because there is already an undo or redo operation running.", element.label);
                this._notificationService.warn(message);
                return;
            }
            return this._invokeResourcePrepare(element, (cleanup) => {
                editStack.moveForward(element);
                return this._safeInvokeWithLocks(element, () => element.actual.redo(), new EditStackSnapshot([editStack]), cleanup, () => this._continueRedoInGroup(element.groupId));
            });
        }
        _findClosestRedoElementInGroup(groupId) {
            if (!groupId) {
                return [null, null];
            }
            // find another element with the same groupId and with the lowest groupOrder ready to be redone
            let matchedElement = null;
            let matchedStrResource = null;
            for (const [strResource, editStack] of this._editStacks) {
                const candidate = editStack.getClosestFutureElement();
                if (!candidate) {
                    continue;
                }
                if (candidate.groupId === groupId) {
                    if (!matchedElement || candidate.groupOrder < matchedElement.groupOrder) {
                        matchedElement = candidate;
                        matchedStrResource = strResource;
                    }
                }
            }
            return [matchedElement, matchedStrResource];
        }
        _continueRedoInGroup(groupId) {
            if (!groupId) {
                return;
            }
            const [, matchedStrResource] = this._findClosestRedoElementInGroup(groupId);
            if (matchedStrResource) {
                return this._redo(matchedStrResource);
            }
        }
        redo(resourceOrSource) {
            if (resourceOrSource instanceof undoRedo_1.UndoRedoSource) {
                const [, matchedStrResource] = this._findClosestRedoElementWithSource(resourceOrSource.id);
                return matchedStrResource ? this._redo(matchedStrResource) : undefined;
            }
            if (typeof resourceOrSource === 'string') {
                return this._redo(resourceOrSource);
            }
            return this._redo(this.getUriComparisonKey(resourceOrSource));
        }
        _redo(strResource) {
            if (!this._editStacks.has(strResource)) {
                return;
            }
            const editStack = this._editStacks.get(strResource);
            const element = editStack.getClosestFutureElement();
            if (!element) {
                return;
            }
            if (element.groupId) {
                // this element is a part of a group, we need to make sure redoing in a group is in order
                const [matchedElement, matchedStrResource] = this._findClosestRedoElementInGroup(element.groupId);
                if (element !== matchedElement && matchedStrResource) {
                    // there is an element in the same group that should be redone before this one
                    return this._redo(matchedStrResource);
                }
            }
            try {
                if (element.type === 1 /* UndoRedoElementType.Workspace */) {
                    return this._workspaceRedo(strResource, element);
                }
                else {
                    return this._resourceRedo(editStack, element);
                }
            }
            finally {
                if (DEBUG) {
                    this._print('redo');
                }
            }
        }
    };
    exports.UndoRedoService = UndoRedoService;
    exports.UndoRedoService = UndoRedoService = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, notification_1.INotificationService)
    ], UndoRedoService);
    class WorkspaceVerificationError {
        constructor(returnValue) {
            this.returnValue = returnValue;
        }
    }
    (0, extensions_1.registerSingleton)(undoRedo_1.IUndoRedoService, UndoRedoService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5kb1JlZG9TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91bmRvUmVkby9jb21tb24vdW5kb1JlZG9TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWFoRyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUM7SUFFcEIsU0FBUyxnQkFBZ0IsQ0FBQyxRQUFhO1FBQ3RDLE9BQU8sUUFBUSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztJQUMzRSxDQUFDO0lBRUQsSUFBSSxtQkFBbUIsR0FBRyxDQUFDLENBQUM7SUFFNUIsTUFBTSxvQkFBb0I7UUFpQnpCLFlBQVksTUFBd0IsRUFBRSxhQUFxQixFQUFFLFdBQW1CLEVBQUUsT0FBZSxFQUFFLFVBQWtCLEVBQUUsUUFBZ0IsRUFBRSxXQUFtQjtZQWhCNUksT0FBRSxHQUFHLENBQUMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQzdCLFNBQUksd0NBQWdDO1lBZ0JuRCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDMUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUM7WUFDM0QsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7WUFDbkMsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7WUFDL0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMzQyxJQUFJLENBQUMsWUFBWSxHQUFHLENB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