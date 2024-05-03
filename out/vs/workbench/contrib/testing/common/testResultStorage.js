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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testResult"], function (require, exports, buffer_1, lifecycle_1, types_1, uri_1, environment_1, files_1, instantiation_1, log_1, storage_1, uriIdentity_1, workspace_1, storedValue_1, testResult_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestResultStorage = exports.InMemoryResultStorage = exports.BaseTestResultStorage = exports.ITestResultStorage = exports.RETAIN_MAX_RESULTS = void 0;
    exports.RETAIN_MAX_RESULTS = 128;
    const RETAIN_MIN_RESULTS = 16;
    const RETAIN_MAX_BYTES = 1024 * 128;
    const CLEANUP_PROBABILITY = 0.2;
    exports.ITestResultStorage = (0, instantiation_1.createDecorator)('ITestResultStorage');
    /**
     * Data revision this version of VS Code deals with. Should be bumped whenever
     * a breaking change is made to the stored results, which will cause previous
     * revisions to be discarded.
     */
    const currentRevision = 1;
    let BaseTestResultStorage = class BaseTestResultStorage extends lifecycle_1.Disposable {
        constructor(uriIdentityService, storageService, logService) {
            super();
            this.uriIdentityService = uriIdentityService;
            this.storageService = storageService;
            this.logService = logService;
            this.stored = this._register(new storedValue_1.StoredValue({
                key: 'storedTestResults',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 1 /* StorageTarget.MACHINE */
            }, this.storageService));
        }
        /**
         * @override
         */
        async read() {
            const results = await Promise.all(this.stored.get([]).map(async ({ id, rev }) => {
                if (rev !== currentRevision) {
                    return undefined;
                }
                try {
                    const contents = await this.readForResultId(id);
                    if (!contents) {
                        return undefined;
                    }
                    return new testResult_1.HydratedTestResult(this.uriIdentityService, contents);
                }
                catch (e) {
                    this.logService.warn(`Error deserializing stored test result ${id}`, e);
                    return undefined;
                }
            }));
            return results.filter(types_1.isDefined);
        }
        /**
         * @override
         */
        getResultOutputWriter(resultId) {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            this.storeOutputForResultId(resultId, stream);
            return stream;
        }
        /**
         * @override
         */
        async persist(results) {
            const toDelete = new Map(this.stored.get([]).map(({ id, bytes }) => [id, bytes]));
            const toStore = [];
            const todo = [];
            let budget = RETAIN_MAX_BYTES;
            // Run until either:
            // 1. We store all results
            // 2. We store the max results
            // 3. We store the min results, and have no more byte budget
            for (let i = 0; i < results.length && i < exports.RETAIN_MAX_RESULTS && (budget > 0 || toStore.length < RETAIN_MIN_RESULTS); i++) {
                const result = results[i];
                const existingBytes = toDelete.get(result.id);
                if (existingBytes !== undefined) {
                    toDelete.delete(result.id);
                    toStore.push({ id: result.id, rev: currentRevision, bytes: existingBytes });
                    budget -= existingBytes;
                    continue;
                }
                const obj = result.toJSON();
                if (!obj) {
                    continue;
                }
                const contents = buffer_1.VSBuffer.fromString(JSON.stringify(obj));
                todo.push(this.storeForResultId(result.id, obj));
                toStore.push({ id: result.id, rev: currentRevision, bytes: contents.byteLength });
                budget -= contents.byteLength;
            }
            for (const id of toDelete.keys()) {
                todo.push(this.deleteForResultId(id).catch(() => undefined));
            }
            this.stored.store(toStore);
            await Promise.all(todo);
        }
    };
    exports.BaseTestResultStorage = BaseTestResultStorage;
    exports.BaseTestResultStorage = BaseTestResultStorage = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService),
        __param(1, storage_1.IStorageService),
        __param(2, log_1.ILogService)
    ], BaseTestResultStorage);
    class InMemoryResultStorage extends BaseTestResultStorage {
        constructor() {
            super(...arguments);
            this.cache = new Map();
        }
        async readForResultId(id) {
            return Promise.resolve(this.cache.get(id));
        }
        storeForResultId(id, contents) {
            this.cache.set(id, contents);
            return Promise.resolve();
        }
        deleteForResultId(id) {
            this.cache.delete(id);
            return Promise.resolve();
        }
        readOutputForResultId(id) {
            throw new Error('Method not implemented.');
        }
        storeOutputForResultId(id, input) {
            throw new Error('Method not implemented.');
        }
        readOutputRangeForResultId(id, offset, length) {
            throw new Error('Method not implemented.');
        }
    }
    exports.InMemoryResultStorage = InMemoryResultStorage;
    let TestResultStorage = class TestResultStorage extends BaseTestResultStorage {
        constructor(uriIdentityService, storageService, logService, workspaceContext, fileService, environmentService) {
            super(uriIdentityService, storageService, logService);
            this.fileService = fileService;
            this.directory = uri_1.URI.joinPath(environmentService.workspaceStorageHome, workspaceContext.getWorkspace().id, 'testResults');
        }
        async readForResultId(id) {
            const contents = await this.fileService.readFile(this.getResultJsonPath(id));
            return JSON.parse(contents.value.toString());
        }
        storeForResultId(id, contents) {
            return this.fileService.writeFile(this.getResultJsonPath(id), buffer_1.VSBuffer.fromString(JSON.stringify(contents)));
        }
        deleteForResultId(id) {
            return this.fileService.del(this.getResultJsonPath(id)).catch(() => undefined);
        }
        async readOutputRangeForResultId(id, offset, length) {
            try {
                const { value } = await this.fileService.readFile(this.getResultOutputPath(id), { position: offset, length });
                return value;
            }
            catch {
                return buffer_1.VSBuffer.alloc(0);
            }
        }
        async readOutputForResultId(id) {
            try {
                const { value } = await this.fileService.readFileStream(this.getResultOutputPath(id));
                return value;
            }
            catch {
                return (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.alloc(0));
            }
        }
        async storeOutputForResultId(id, input) {
            await this.fileService.createFile(this.getResultOutputPath(id), input);
        }
        /**
         * @inheritdoc
         */
        async persist(results) {
            await super.persist(results);
            if (Math.random() < CLEANUP_PROBABILITY) {
                await this.cleanupDereferenced();
            }
        }
        /**
         * Cleans up orphaned files. For instance, output can get orphaned if it's
         * written but the editor is closed before the test run is complete.
         */
        async cleanupDereferenced() {
            const { children } = await this.fileService.resolve(this.directory);
            if (!children) {
                return;
            }
            const stored = new Set(this.stored.get([]).filter(s => s.rev === currentRevision).map(s => s.id));
            await Promise.all(children
                .filter(child => !stored.has(child.name.replace(/\.[a-z]+$/, '')))
                .map(child => this.fileService.del(child.resource).catch(() => undefined)));
        }
        getResultJsonPath(id) {
            return uri_1.URI.joinPath(this.directory, `${id}.json`);
        }
        getResultOutputPath(id) {
            return uri_1.URI.joinPath(this.directory, `${id}.output`);
        }
    };
    exports.TestResultStorage = TestResultStorage;
    exports.TestResultStorage = TestResultStorage = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService),
        __param(1, storage_1.IStorageService),
        __param(2, log_1.ILogService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, files_1.IFileService),
        __param(5, environment_1.IEnvironmentService)
    ], TestResultStorage);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFJlc3VsdFN0b3JhZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvY29tbW9uL3Rlc3RSZXN1bHRTdG9yYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCbkYsUUFBQSxrQkFBa0IsR0FBRyxHQUFHLENBQUM7SUFDdEMsTUFBTSxrQkFBa0IsR0FBRyxFQUFFLENBQUM7SUFDOUIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDO0lBQ3BDLE1BQU0sbUJBQW1CLEdBQUcsR0FBRyxDQUFDO0lBZ0JuQixRQUFBLGtCQUFrQixHQUFHLElBQUEsK0JBQWUsRUFBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBRXhFOzs7O09BSUc7SUFDSCxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUM7SUFFbkIsSUFBZSxxQkFBcUIsR0FBcEMsTUFBZSxxQkFBc0IsU0FBUSxzQkFBVTtRQVM3RCxZQUNzQixrQkFBd0QsRUFDNUQsY0FBZ0QsRUFDcEQsVUFBd0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFKOEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMzQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbkMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQVRuQyxXQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFXLENBQTREO2dCQUNySCxHQUFHLEVBQUUsbUJBQW1CO2dCQUN4QixLQUFLLGdDQUF3QjtnQkFDN0IsTUFBTSwrQkFBdUI7YUFDN0IsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQVF6QixDQUFDO1FBRUQ7O1dBRUc7UUFDSSxLQUFLLENBQUMsSUFBSTtZQUNoQixNQUFNLE9BQU8sR0FBRyxNQUFN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