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
define(["require", "exports", "vs/platform/files/common/files", "vs/platform/configuration/common/configuration", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/base/common/arrays", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/network"], function (require, exports, files_1, configuration_1, workingCopyFileService_1, undoRedo_1, instantiation_1, log_1, cancellation_1, arrays_1, textfiles_1, network_1) {
    "use strict";
    var RenameOperation_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkFileEdits = void 0;
    class Noop {
        constructor() {
            this.uris = [];
        }
        async perform() { return this; }
        toString() {
            return '(noop)';
        }
    }
    class RenameEdit {
        constructor(newUri, oldUri, options) {
            this.newUri = newUri;
            this.oldUri = oldUri;
            this.options = options;
            this.type = 'rename';
        }
    }
    let RenameOperation = RenameOperation_1 = class RenameOperation {
        constructor(_edits, _undoRedoInfo, _workingCopyFileService, _fileService) {
            this._edits = _edits;
            this._undoRedoInfo = _undoRedoInfo;
            this._workingCopyFileService = _workingCopyFileService;
            this._fileService = _fileService;
        }
        get uris() {
            return this._edits.flatMap(edit => [edit.newUri, edit.oldUri]);
        }
        async perform(token) {
            const moves = [];
            const undoes = [];
            for (const edit of this._edits) {
                // check: not overwriting, but ignoring, and the target file exists
                const skip = edit.options.overwrite === undefined && edit.options.ignoreIfExists && await this._fileService.exists(edit.newUri);
                if (!skip) {
                    moves.push({
                        file: { source: edit.oldUri, target: edit.newUri },
                        overwrite: edit.options.overwrite
                    });
                    // reverse edit
                    undoes.push(new RenameEdit(edit.oldUri, edit.newUri, edit.options));
                }
            }
            if (moves.length === 0) {
                return new Noop();
            }
            await this._workingCopyFileService.move(moves, token, this._undoRedoInfo);
            return new RenameOperation_1(undoes, { isUndoing: true }, this._workingCopyFileService, this._fileService);
        }
        toString() {
            return `(rename ${this._edits.map(edit => `${edit.oldUri} to ${edit.newUri}`).join(', ')})`;
        }
    };
    RenameOperation = RenameOperation_1 = __decorate([
        __param(2, workingCopyFileService_1.IWorkingCopyFileService),
        __param(3, files_1.IFileService)
    ], RenameOperation);
    class CopyEdit {
        constructor(newUri, oldUri, options) {
            this.newUri = newUri;
            this.oldUri = oldUri;
            this.options = options;
            this.type = 'copy';
        }
    }
    let CopyOperation = class CopyOperation {
        constructor(_edits, _undoRedoInfo, _workingCopyFileService, _fileService, _instaService) {
            this._edits = _edits;
            this._undoRedoInfo = _undoRedoInfo;
            this._workingCopyFileService = _workingCopyFileService;
            this._fileService = _fileService;
            this._instaService = _instaService;
        }
        get uris() {
            return this._edits.flatMap(edit => [edit.newUri, edit.oldUri]);
        }
        async perform(token) {
            // (1) create copy operations, remove noops
            const copies = [];
            for (const edit of this._edits) {
                //check: not overwriting, but ignoring, and the target file exists
                const skip = edit.options.overwrite === undefined && edit.options.ignoreIfExists && await this._fileService.exists(edit.newUri);
                if (!skip) {
                    copies.push({ file: { source: edit.oldUri, target: edit.newUri }, overwrite: edit.options.overwrite });
                }
            }
            if (copies.length === 0) {
                return new Noop();
            }
            // (2) perform the actual copy and use the return stats to build undo edits
            const stats = await this._workingCopyFileService.copy(copies, token, this._undoRedoInfo);
            const undoes = [];
            for (let i = 0; i < stats.length; i++) {
                const stat = stats[i];
                const edit = this._edits[i];
                undoes.push(new DeleteEdit(stat.resource, { recursive: true, folder: this._edits[i].options.folder || stat.isDirectory, ...edit.options }, false));
            }
            return this._instaService.createInstance(DeleteOperation, undoes, { isUndoing: true });
        }
        toString() {
            return `(copy ${this._edits.map(edit => `${edit.oldUri} to ${edit.newUri}`).join(', ')})`;
        }
    };
    CopyOperation = __decorate([
        __param(2, workingCopyFileService_1.IWorkingCopyFileService),
        __param(3, files_1.IFileService),
        __param(4, instantiation_1.IInstantiationService)
    ], CopyOperation);
    class CreateEdit {
        constructor(newUri, options, contents) {
            this.newUri = newUri;
            this.options = options;
            this.contents = contents;
            this.type = 'create';
        }
    }
    let CreateOperation = class CreateOperation {
        constructor(_edits, _undoRedoInfo, _fileService, _workingCopyFileService, _instaService, _textFileService) {
            this._edits = _edits;
            this._undoRedoInfo = _undoRedoInfo;
            this._fileService = _fileService;
            this._workingCopyFileService = _workingCopyFileService;
            this._instaService = _instaService;
            this._textFileService = _textFileService;
        }
        get uris() {
            return this._edits.map(edit => edit.newUri);
        }
        async perform(token) {
            const folderCreates = [];
            const fileCreates = [];
            const undoes = [];
            for (const edit of this._edits) {
                if (edit.newUri.scheme === network_1.Schemas.untitled) {
                    continue; // ignore, will be handled by a later edit
                }
                if (edit.options.overwrite === undefined && edit.options.ignoreIfExists && await this._fileService.exists(edit.newUri)) {
                    continue; // not overwriting, but ignoring, and the target file exists
                }
                if (edit.options.folder) {
                    folderCreates.push({ resource: edit.newUri });
                }
                else {
                    // If the contents are part of the edit they include the encoding, thus use them. Otherwise get the encoding for a new empty file.
                    const encodedReadable = typeof edit.contents !== 'undefined' ? edit.contents : await this._textFileService.getEncodedReadable(edit.newUri);
                    fileCreates.push({ resource: edit.newUri, contents: encodedReadable, overwrite: edit.options.overwrite });
                }
                undoes.push(new DeleteEdit(edit.newUri, edit.options, !edit.options.folder && !edit.contents));
            }
            if (folderCreates.length === 0 && fileCreates.length === 0) {
                return new Noop();
            }
            await this._workingCopyFileService.createFolder(folderCreates, token, this._undoRedoInfo);
            await this._workingCopyFileService.create(fileCreates, token, this._undoRedoInfo);
            return this._instaService.createInstance(DeleteOperation, undoes, { isUndoing: true });
        }
        toString() {
            return `(create ${this._edits.map(edit => edit.options.folder ? `folder ${edit.newUri}` : `file ${edit.newUri} with ${edit.contents?.byteLength || 0} bytes`).join(', ')})`;
        }
    };
    CreateOperation = __decorate([
        __param(2, files_1.IFileService),
        __param(3, workingCopyFileService_1.IWorkingCopyFileService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, textfiles_1.ITextFileService)
    ], CreateOperation);
    class DeleteEdit {
        constructor(oldUri, options, undoesCreate) {
            this.oldUri = oldUri;
            this.options = options;
            this.undoesCreate = undoesCreate;
            this.type = 'delete';
        }
    }
    let DeleteOperation = class DeleteOperation {
        constructor(_edits, _undoRedoInfo, _workingCopyFileService, _fileService, _configurationService, _instaService, _logService) {
            this._edits = _edits;
            this._undoRedoInfo = _undoRedoInfo;
            this._workingCopyFileService = _workingCopyFileService;
            this._fileService = _fileService;
            this._configurationService = _configurationService;
            this._instaService = _instaService;
            this._logService = _logService;
        }
        get uris() {
            return this._edits.map(edit => edit.oldUri);
        }
        async perform(token) {
            // delete file
            const deletes = [];
            const undoes = [];
            for (const edit of this._edits) {
                let fileStat;
                try {
                    fileStat = await this._fileService.resolve(edit.oldUri, { resolveMetadata: true });
                }
                catch (err) {
                    if (!edit.options.ignoreIfNotExists) {
                        throw new Error(`${edit.oldUri} does not exist and can not be deleted`);
                    }
                    continue;
                }
                deletes.push({
                    resource: edit.oldUri,
                    recursive: edit.options.recursive,
                    useTrash: !edit.options.skipTrashBin && this._fileService.hasCapability(edit.oldUri, 4096 /* FileSystemProviderCapabilities.Trash */) && this._configurationService.getValue('files.enableTrash')
                });
                // read file contents for undo operation. when a file is too large it won't be restored
                let fileContent;
                if (!edit.undoesCreate && !edit.options.folder && !(typeof edit.options.maxSize === 'number' && fileStat.size > edit.options.maxSize)) {
                    try {
                        fileContent = await this._fileService.readFile(edit.oldUri);
                    }
                    catch (err) {
                        this._logService.error(err);
                    }
                }
                if (fileContent !== undefined) {
                    undoes.push(new CreateEdit(edit.oldUri, edit.options, fileContent.value));
                }
            }
            if (deletes.length === 0) {
                return new Noop();
            }
            await this._workingCopyFileService.delete(deletes, token, this._undoRedoInfo);
            if (undoes.length === 0) {
                return new Noop();
            }
            return this._instaService.createInstance(CreateOperation, undoes, { isUndoing: true });
        }
        toString() {
            return `(delete ${this._edits.map(edit => edit.oldUri).join(', ')})`;
        }
    };
    DeleteOperation = __decorate([
        __param(2, workingCopyFileService_1.IWorkingCopyFileService),
        __param(3, files_1.IFileService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, log_1.ILogService)
    ], DeleteOperation);
    class FileUndoRedoElement {
        constructor(label, code, operations, confirmBeforeUndo) {
            this.label = label;
            this.code = code;
            this.operations = operations;
            this.confirmBeforeUndo = confirmBeforeUndo;
            this.type = 1 /* UndoRedoElementType.Workspace */;
            this.resources = operations.flatMap(op => op.uris);
        }
        async undo() {
            await this._reverse();
        }
        async redo() {
            await this._reverse();
        }
        async _reverse() {
            for (let i = 0; i < this.operations.length; i++) {
                const op = this.operations[i];
                const undo = await op.perform(cancellation_1.CancellationToken.None);
                this.operations[i] = undo;
            }
        }
        toString() {
            return this.operations.map(op => String(op)).join(', ');
        }
    }
    let BulkFileEdits = class BulkFileEdits {
        constructor(_label, _code, _undoRedoGroup, _undoRedoSource, _confirmBeforeUndo, _progress, _token, _edits, _instaService, _undoRedoService) {
            this._label = _label;
            this._code = _code;
            this._undoRedoGroup = _undoRedoGroup;
            this._undoRedoSource = _undoRedoSource;
            this._confirmBeforeUndo = _confirmBeforeUndo;
            this._progress = _progress;
            this._token = _token;
            this._edits = _edits;
            this._instaService = _instaService;
            this._undoRedoService = _undoRedoService;
        }
        async apply() {
            const undoOperations = [];
            const undoRedoInfo = { undoRedoGroupId: this._undoRedoGroup.id };
            const edits = [];
            for (const edit of this._edits) {
                if (edit.newResource && edit.oldResource && !edit.options?.copy) {
                    edits.push(new RenameEdit(edit.newResource, edit.oldResource, edit.options ?? {}));
                }
                else if (edit.newResource && edit.oldResource && edit.options?.copy) {
                    edits.push(new CopyEdit(edit.newResource, edit.oldResource, edit.options ?? {}));
                }
                else if (!edit.newResource && edit.oldResource) {
                    edits.push(new DeleteEdit(edit.oldResource, edit.options ?? {}, false));
                }
                else if (edit.newResource && !edit.oldResource) {
                    edits.push(new CreateEdit(edit.newResource, edit.options ?? {}, await edit.options.contents));
                }
            }
            if (edits.length === 0) {
                return [];
            }
            const groups = [];
            groups[0] = [edits[0]];
            for (let i = 1; i < edits.length; i++) {
                const edit = edits[i];
                const lastGroup = (0, arrays_1.tail)(groups);
                if (lastGroup[0].type === edit.type) {
                    lastGroup.push(edit);
                }
                else {
                    groups.push([edit]);
                }
            }
            for (const group of groups) {
                if (this._token.isCancellationRequested) {
                    break;
                }
                let op;
                switch (group[0].type) {
                    case 'rename':
                        op = this._instaService.createInstance(RenameOperation, group, undoRedoInfo);
                        break;
                    case 'copy':
                        op = this._instaService.createInstance(CopyOperation, group, undoRedoInfo);
                        break;
                    case 'delete':
                        op = this._instaService.createInstance(DeleteOperation, group, undoRedoInfo);
                        break;
                    case 'create':
                        op = this._instaService.createInstance(CreateOperation, group, undoRedoInfo);
                        break;
                }
                if (op) {
                    const undoOp = await op.perform(this._token);
                    undoOperations.push(undoOp);
                }
                this._progress.report(undefined);
            }
            const undoRedoElement = new FileUndoRedoElement(this._label, this._code, undoOperations, this._confirmBeforeUndo);
            this._undoRedoService.pushElement(undoRedoElement, this._undoRedoGroup, this._undoRedoSource);
            return undoRedoElement.resources;
        }
    };
    exports.BulkFileEdits = BulkFileEdits;
    exports.BulkFileEdits = BulkFileEdits = __decorate([
        __param(8, instantiation_1.IInstantiationService),
        __param(9, undoRedo_1.IUndoRedoService)
    ], BulkFileEdits);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0ZpbGVFZGl0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYnVsa0VkaXQvYnJvd3Nlci9idWxrRmlsZUVkaXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF3QmhHLE1BQU0sSUFBSTtRQUFWO1lBQ1UsU0FBSSxHQUFHLEVBQUUsQ0FBQztRQUtwQixDQUFDO1FBSkEsS0FBSyxDQUFDLE9BQU8sS0FBSyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDaEMsUUFBUTtZQUNQLE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7S0FDRDtJQUVELE1BQU0sVUFBVTtRQUVmLFlBQ1UsTUFBVyxFQUNYLE1BQVcsRUFDWCxPQUFpQztZQUZqQyxXQUFNLEdBQU4sTUFBTSxDQUFLO1lBQ1gsV0FBTSxHQUFOLE1BQU0sQ0FBSztZQUNYLFlBQU8sR0FBUCxPQUFPLENBQTBCO1lBSmxDLFNBQUksR0FBRyxRQUFRLENBQUM7UUFLckIsQ0FBQztLQUNMO0lBRUQsSUFBTSxlQUFlLHVCQUFyQixNQUFNLGVBQWU7UUFFcEIsWUFDa0IsTUFBb0IsRUFDcEIsYUFBeUMsRUFDaEIsdUJBQWdELEVBQzNELFlBQTBCO1lBSHhDLFdBQU0sR0FBTixNQUFNLENBQWM7WUFDcEIsa0JBQWEsR0FBYixhQUFhLENBQTRCO1lBQ2hCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBeUI7WUFDM0QsaUJBQVksR0FBWixZQUFZLENBQWM7UUFDdEQsQ0FBQztRQUVMLElBQUksSUFBSTtZQUNQLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFD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