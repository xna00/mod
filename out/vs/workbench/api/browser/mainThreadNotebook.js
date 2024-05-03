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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/base/common/types", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/platform/log/common/log", "vs/workbench/api/browser/mainThreadNotebookDto", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/extensions/common/proxyIdentifier", "../common/extHost.protocol", "vs/base/common/marshalling", "vs/base/common/arrays"], function (require, exports, buffer_1, cancellation_1, event_1, lifecycle_1, stopwatch_1, types_1, uri_1, commands_1, log_1, mainThreadNotebookDto_1, notebookCellStatusBarService_1, notebookService_1, extHostCustomers_1, proxyIdentifier_1, extHost_protocol_1, marshalling_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebooks = void 0;
    let MainThreadNotebooks = class MainThreadNotebooks {
        constructor(extHostContext, _notebookService, _cellStatusBarService, _logService) {
            this._notebookService = _notebookService;
            this._cellStatusBarService = _cellStatusBarService;
            this._logService = _logService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._notebookSerializer = new Map();
            this._notebookCellStatusBarRegistrations = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebook);
        }
        dispose() {
            this._disposables.dispose();
            (0, lifecycle_1.dispose)(this._notebookSerializer.values());
        }
        $registerNotebookSerializer(handle, extension, viewType, options, data) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(this._notebookService.registerNotebookSerializer(viewType, extension, {
                options,
                dataToNotebook: async (data) => {
                    const sw = new stopwatch_1.StopWatch();
                    let result;
                    if (data.byteLength === 0 && viewType === 'interactive') {
                        // we don't want any starting cells for an empty interactive window.
                        result = mainThreadNotebookDto_1.NotebookDto.fromNotebookDataDto({ cells: [], metadata: {} });
                    }
                    else {
                        const dto = await this._proxy.$dataToNotebook(handle, data, cancellation_1.CancellationToken.None);
                        result = mainThreadNotebookDto_1.NotebookDto.fromNotebookDataDto(dto.value);
                    }
                    this._logService.trace(`[NotebookSerializer] dataToNotebook DONE after ${sw.elapsed()}ms`, {
                        viewType,
                        extensionId: extension.id.value,
                    });
                    return result;
                },
                notebookToData: (data) => {
                    const sw = new stopwatch_1.StopWatch();
                    const result = this._proxy.$notebookToData(handle, new proxyIdentifier_1.SerializableObjectWithBuffers(mainThreadNotebookDto_1.NotebookDto.toNotebookDataDto(data)), cancellation_1.CancellationToken.None);
                    this._logService.trace(`[NotebookSerializer] notebookToData DONE after ${sw.elapsed()}`, {
                        viewType,
                        extensionId: extension.id.value,
                    });
                    return result;
                },
                save: async (uri, versionId, options, token) => {
                    const stat = await this._proxy.$saveNotebook(handle, uri, versionId, options, token);
                    return {
                        ...stat,
                        children: undefined,
                        resource: uri
                    };
                },
                searchInNotebooks: async (textQuery, token, allPriorityInfo) => {
                    const contributedType = this._notebookService.getContributedNotebookType(viewType);
                    if (!contributedType) {
                        return { results: [], limitHit: false };
                    }
                    const fileNames = contributedType.selectors;
                    const includes = fileNames.map((selector) => {
                        const globPattern = selector.include || selector;
                        return globPattern.toString();
                    });
                    if (!includes.length) {
                        return {
                            results: [], limitHit: false
                        };
                    }
                    const thisPriorityInfo = (0, arrays_1.coalesce)([{ isFromSettings: false, filenamePatterns: includes }, ...allPriorityInfo.get(viewType) ?? []]);
                    const otherEditorsPriorityInfo = Array.from(allPriorityInfo.keys())
                        .flatMap(key => {
                        if (key !== viewType) {
                            return allPriorityInfo.get(key) ?? [];
                        }
                        return [];
                    });
                    const searchComplete = await this._proxy.$searchInNotebooks(handle, textQuery, thisPriorityInfo, otherEditorsPriorityInfo, token);
                    const revivedResults = searchComplete.results.map(result => {
                        const resource = uri_1.URI.revive(result.resource);
                        return {
                            resource,
                            cellResults: result.cellResults.map(e => (0, marshalling_1.revive)(e))
                        };
                    });
                    return { results: revivedResults, limitHit: searchComplete.limitHit };
                }
            }));
            if (data) {
                disposables.add(this._notebookService.registerContributedNotebookType(viewType, data));
            }
            this._notebookSerializer.set(handle, disposables);
            this._logService.trace('[NotebookSerializer] registered notebook serializer', {
                viewType,
                extensionId: extension.id.value,
            });
        }
        $unregisterNotebookSerializer(handle) {
            this._notebookSerializer.get(handle)?.dispose();
            this._notebookSerializer.delete(handle);
        }
        $emitCellStatusBarEvent(eventHandle) {
            const emitter = this._notebookCellStatusBarRegistrations.get(eventHandle);
            if (emitter instanceof event_1.Emitter) {
                emitter.fire(undefined);
            }
        }
        async $registerNotebookCellStatusBarItemProvider(handle, eventHandle, viewType) {
            const that = this;
            const provider = {
                async provideCellStatusBarItems(uri, index, token) {
                    const result = await that._proxy.$provideNotebookCellStatusBarItems(handle, uri, index, token);
                    return {
                        items: result?.items ?? [],
                        dispose() {
                            if (result) {
                                that._proxy.$releaseNotebookCellStatusBarItems(result.cacheId);
                            }
                        }
                    };
                },
                viewType
            };
            if (typeof eventHandle === 'number') {
                const emitter = new event_1.Emitter();
                this._notebookCellStatusBarRegistrations.set(eventHandle, emitter);
                provider.onDidChangeStatusBarItems = emitter.event;
            }
            const disposable = this._cellStatusBarService.registerCellStatusBarItemProvider(provider);
            this._notebookCellStatusBarRegistrations.set(handle, disposable);
        }
        async $unregisterNotebookCellStatusBarItemProvider(handle, eventHandle) {
            const unregisterThing = (handle) => {
                const entry = this._notebookCellStatusBarRegistrations.get(handle);
                if (entry) {
                    this._notebookCellStatusBarRegistrations.get(handle)?.dispose();
                    this._notebookCellStatusBarRegistrations.delete(handle);
                }
            };
            unregisterThing(handle);
            if (typeof eventHandle === 'number') {
                unregisterThing(eventHandle);
            }
        }
    };
    exports.MainThreadNotebooks = MainThreadNotebooks;
    exports.MainThreadNotebooks = MainThreadNotebooks = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadNotebook),
        __param(1, notebookService_1.INotebookService),
        __param(2, notebookCellStatusBarService_1.INotebookCellStatusBarService),
        __param(3, log_1.ILogService)
    ], MainThreadNotebooks);
    commands_1.CommandsRegistry.registerCommand('_executeDataToNotebook', async (accessor, ...args) => {
        const [notebookType, bytes] = args;
        (0, types_1.assertType)(typeof notebookType === 'string', 'string');
        (0, types_1.assertType)(bytes instanceof buffer_1.VSBuffer, 'VSBuffer');
        const notebookService = accessor.get(notebookService_1.INotebookService);
        const info = await notebookService.withNotebookDataProvider(notebookType);
        if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
            return;
        }
        const dto = await info.serializer.dataToNotebook(bytes);
        return new proxyIdentifier_1.SerializableObjectWithBuffers(mainThreadNotebookDto_1.NotebookDto.toNotebookDataDto(dto));
    });
    commands_1.CommandsRegistry.registerCommand('_executeNotebookToData', async (accessor, ...args) => {
        const [notebookType, dto] = args;
        (0, types_1.assertType)(typeof notebookType === 'string', 'string');
        (0, types_1.assertType)(typeof dto === 'object');
        const notebookService = accessor.get(notebookService_1.INotebookService);
        const info = await notebookService.withNotebookDataProvider(notebookType);
        if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
            return;
        }
        const data = mainThreadNotebookDto_1.NotebookDto.fromNotebookDataDto(dto.value);
        const bytes = await info.serializer.notebookToData(data);
        return bytes;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE5vdGVib29rLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZE5vdGVib29rLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXlCekYsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBbUI7UUFRL0IsWUFDQyxjQUErQixFQUNiLGdCQUFtRCxFQUN0QyxxQkFBcUUsRUFDdkYsV0FBeUM7WUFGbkIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNyQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQStCO1lBQ3RFLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBVnRDLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFHckMsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFDckQsd0NBQW1DLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFRckYsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzVCLElBQUEsbUJBQU8sRUFBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsMkJBQTJCLENBQUMsTUFBYyxFQUFFLFNBQXVDLEVBQUUsUUFBZ0IsRUFBRSxPQUF5QixFQUFFLElBQTJDO1lBQzVLLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRTFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLDBCQUEwQixDQUFD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