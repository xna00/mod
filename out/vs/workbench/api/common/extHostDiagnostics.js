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
define(["require", "exports", "vs/nls", "vs/platform/markers/common/markers", "vs/base/common/uri", "./extHost.protocol", "./extHostTypes", "./extHostTypeConverters", "vs/base/common/event", "vs/platform/log/common/log", "vs/base/common/map", "vs/workbench/api/common/extHostFileSystemInfo"], function (require, exports, nls_1, markers_1, uri_1, extHost_protocol_1, extHostTypes_1, converter, event_1, log_1, map_1, extHostFileSystemInfo_1) {
    "use strict";
    var ExtHostDiagnostics_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDiagnostics = exports.DiagnosticCollection = void 0;
    class DiagnosticCollection {
        #proxy;
        #onDidChangeDiagnostics;
        #data;
        constructor(_name, _owner, _maxDiagnosticsTotal, _maxDiagnosticsPerFile, _modelVersionIdProvider, extUri, proxy, onDidChangeDiagnostics) {
            this._name = _name;
            this._owner = _owner;
            this._maxDiagnosticsTotal = _maxDiagnosticsTotal;
            this._maxDiagnosticsPerFile = _maxDiagnosticsPerFile;
            this._modelVersionIdProvider = _modelVersionIdProvider;
            this._isDisposed = false;
            this._maxDiagnosticsTotal = Math.max(_maxDiagnosticsPerFile, _maxDiagnosticsTotal);
            this.#data = new map_1.ResourceMap(uri => extUri.getComparisonKey(uri));
            this.#proxy = proxy;
            this.#onDidChangeDiagnostics = onDidChangeDiagnostics;
        }
        dispose() {
            if (!this._isDisposed) {
                this.#onDidChangeDiagnostics.fire([...this.#data.keys()]);
                this.#proxy?.$clear(this._owner);
                this.#data.clear();
                this._isDisposed = true;
            }
        }
        get name() {
            this._checkDisposed();
            return this._name;
        }
        set(first, diagnostics) {
            if (!first) {
                // this set-call is a clear-call
                this.clear();
                return;
            }
            // the actual implementation for #set
            this._checkDisposed();
            let toSync = [];
            if (uri_1.URI.isUri(first)) {
                if (!diagnostics) {
                    // remove this entry
                    this.delete(first);
                    return;
                }
                // update single row
                this.#data.set(first, diagnostics.slice());
                toSync = [first];
            }
            else if (Array.isArray(first)) {
                // update many rows
                toSync = [];
                let lastUri;
                // ensure stable-sort
                first = [...first].sort(DiagnosticCollection._compareIndexedTuplesByUri);
                for (const tuple of first) {
                    const [uri, diagnostics] = tuple;
                    if (!lastUri || uri.toString() !== lastUri.toString()) {
                        if (lastUri && this.#data.get(lastUri).length === 0) {
                            this.#data.delete(lastUri);
                        }
                        lastUri = uri;
                        toSync.push(uri);
                        this.#data.set(uri, []);
                    }
                    if (!diagnostics) {
                        // [Uri, undefined] means clear this
                        const currentDiagnostics = this.#data.get(uri);
                        if (currentDiagnostics) {
                            currentDiagnostics.length = 0;
                        }
                    }
                    else {
                        const currentDiagnostics = this.#data.get(uri);
                        currentDiagnostics?.push(...diagnostics);
                    }
                }
            }
            // send event for extensions
            this.#onDidChangeDiagnostics.fire(toSync);
            // compute change and send to main side
            if (!this.#proxy) {
                return;
            }
            const entries = [];
            let totalMarkerCount = 0;
            for (const uri of toSync) {
                let marker = [];
                const diagnostics = this.#data.get(uri);
                if (diagnostics) {
                    // no more than N diagnostics per file
                    if (diagnostics.length > this._maxDiagnosticsPerFile) {
                        marker = [];
                        const order = [extHostTypes_1.DiagnosticSeverity.Error, extHostTypes_1.DiagnosticSeverity.Warning, extHostTypes_1.DiagnosticSeverity.Information, extHostTypes_1.DiagnosticSeverity.Hint];
                        orderLoop: for (let i = 0; i < 4; i++) {
                            for (const diagnostic of diagnostics) {
                                if (diagnostic.severity === order[i]) {
                                    const len = marker.push({ ...converter.Diagnostic.from(diagnostic), modelVersionId: this._modelVersionIdProvider(uri) });
                                    if (len === this._maxDiagnosticsPerFile) {
                                        break orderLoop;
                                    }
                                }
                            }
                        }
                        // add 'signal' marker for showing omitted errors/warnings
                        marker.push({
                            severity: markers_1.MarkerSeverity.Info,
                            message: (0, nls_1.localize)({ key: 'limitHit', comment: ['amount of errors/warning skipped due to limits'] }, "Not showing {0} further errors and warnings.", diagnostics.length - this._maxDiagnosticsPerFile),
                            startLineNumber: marker[marker.length - 1].startLineNumber,
                            startColumn: marker[marker.length - 1].startColumn,
                            endLineNumber: marker[marker.length - 1].endLineNumber,
                            endColumn: marker[marker.length - 1].endColumn
                        });
                    }
                    else {
                        marker = diagnostics.map(diag => ({ ...converter.Diagnostic.from(diag), modelVersionId: this._modelVersionIdProvider(uri) }));
                    }
                }
                entries.push([uri, marker]);
                totalMarkerCount += marker.length;
                if (totalMarkerCount > this._maxDiagnosticsTotal) {
                    // ignore markers that are above the limit
                    break;
                }
            }
            this.#proxy.$changeMany(this._owner, entries);
        }
        delete(uri) {
            this._checkDisposed();
            this.#onDidChangeDiagnostics.fire([uri]);
            this.#data.delete(uri);
            this.#proxy?.$changeMany(this._owner, [[uri, undefined]]);
        }
        clear() {
            this._checkDisposed();
            this.#onDidChangeDiagnostics.fire([...this.#data.keys()]);
            this.#data.clear();
            this.#proxy?.$clear(this._owner);
        }
        forEach(callback, thisArg) {
            this._checkDisposed();
            for (const [uri, values] of this) {
                callback.call(thisArg, uri, values, this);
            }
        }
        *[Symbol.iterator]() {
            this._checkDisposed();
            for (const uri of this.#data.keys()) {
                yield [uri, this.get(uri)];
            }
        }
        get(uri) {
            this._checkDisposed();
            const result = this.#data.get(uri);
            if (Array.isArray(result)) {
                return Object.freeze(result.slice(0));
            }
            return [];
        }
        has(uri) {
            this._checkDisposed();
            return Array.isArray(this.#data.get(uri));
        }
        _checkDisposed() {
            if (this._isDisposed) {
                throw new Error('illegal state - object is disposed');
            }
        }
        static _compareIndexedTuplesByUri(a, b) {
            if (a[0].toString() < b[0].toString()) {
                return -1;
            }
            else if (a[0].toString() > b[0].toString()) {
                return 1;
            }
            else {
                return 0;
            }
        }
    }
    exports.DiagnosticCollection = DiagnosticCollection;
    let ExtHostDiagnostics = class ExtHostDiagnostics {
        static { ExtHostDiagnostics_1 = this; }
        static { this._idPool = 0; }
        static { this._maxDiagnosticsPerFile = 1000; }
        static { this._maxDiagnosticsTotal = 1.1 * ExtHostDiagnostics_1._maxDiagnosticsPerFile; }
        static _mapper(last) {
            const map = new map_1.ResourceMap();
            for (const uri of last) {
                map.set(uri, uri);
            }
            return { uris: Object.freeze(Array.from(map.values())) };
        }
        constructor(mainContext, _logService, _fileSystemInfoService, _extHostDocumentsAndEditors) {
            this._logService = _logService;
            this._fileSystemInfoService = _fileSystemInfoService;
            this._extHostDocumentsAndEditors = _extHostDocumentsAndEditors;
            this._collections = new Map();
            this._onDidChangeDiagnostics = new event_1.DebounceEmitter({ merge: all => all.flat(), delay: 50 });
            this.onDidChangeDiagnostics = event_1.Event.map(this._onDidChangeDiagnostics.event, ExtHostDiagnostics_1._mapper);
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDiagnostics);
        }
        createDiagnosticCollection(extensionId, name) {
            const { _collections, _proxy, _onDidChangeDiagnostics, _logService, _fileSystemInfoService, _extHostDocumentsAndEditors } = this;
            const loggingProxy = new class {
                $changeMany(owner, entries) {
                    _proxy.$changeMany(owner, entries);
                    _logService.trace('[DiagnosticCollection] change many (extension, owner, uris)', extensionId.value, owner, entries.length === 0 ? 'CLEARING' : entries);
                }
                $clear(owner) {
                    _proxy.$clear(owner);
                    _logService.trace('[DiagnosticCollection] remove all (extension, owner)', extensionId.value, owner);
                }
                dispose() {
                    _proxy.dispose();
                }
            };
            let owner;
            if (!name) {
                name = '_generated_diagnostic_collection_name_#' + ExtHostDiagnostics_1._idPool++;
                owner = name;
            }
            else if (!_collections.has(name)) {
                owner = name;
            }
            else {
                this._logService.warn(`DiagnosticCollection with name '${name}' does already exist.`);
                do {
                    owner = name + ExtHostDiagnostics_1._idPool++;
                } while (_collections.has(owner));
            }
            const result = new class extends DiagnosticCollection {
                constructor() {
                    super(name, owner, ExtHostDiagnostics_1._maxDiagnosticsTotal, ExtHostDiagnostics_1._maxDiagnosticsPerFile, uri => _extHostDocumentsAndEditors.getDocument(uri)?.version, _fileSystemInfoService.extUri, loggingProxy, _onDidChangeDiagnostics);
                    _collections.set(owner, this);
                }
                dispose() {
                    super.dispose();
                    _collections.delete(owner);
                }
            };
            return result;
        }
        getDiagnostics(resource) {
            if (resource) {
                return this._getDiagnostics(resource);
            }
            else {
                const index = new Map();
                const res = [];
                for (const collection of this._collections.values()) {
                    collection.forEach((uri, diagnostics) => {
                        let idx = index.get(uri.toString());
                        if (typeof idx === 'undefined') {
                            idx = res.length;
                            index.set(uri.toString(), idx);
                            res.push([uri, []]);
                        }
                        res[idx][1] = res[idx][1].concat(...diagnostics);
                    });
                }
                return res;
            }
        }
        _getDiagnostics(resource) {
            let res = [];
            for (const collection of this._collections.values()) {
                if (collection.has(resource)) {
                    res = res.concat(collection.get(resource));
                }
            }
            return res;
        }
        $acceptMarkersChange(data) {
            if (!this._mirrorCollection) {
                const name = '_generated_mirror';
                const collection = new DiagnosticCollection(name, name, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, // no limits because this collection is just a mirror of "sanitized" data
                // no limits because this collection is just a mirror of "sanitized" data
                _uri => undefined, this._fileSystemInfoService.extUri, undefined, this._onDidChangeDiagnostics);
                this._collections.set(name, collection);
                this._mirrorCollection = collection;
            }
            for (const [uri, markers] of data) {
                this._mirrorCollection.set(uri_1.URI.revive(uri), markers.map(converter.Diagnostic.to));
            }
        }
    };
    exports.ExtHostDiagnostics = ExtHostDiagnostics;
    exports.ExtHostDiagnostics = ExtHostDiagnostics = ExtHostDiagnostics_1 = __decorate([
        __param(1, log_1.ILogService),
        __param(2, extHostFileSystemInfo_1.IExtHostFileSystemInfo)
    ], ExtHostDiagnostics);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERpYWdub3N0aWNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0RGlhZ25vc3RpY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW1CaEcsTUFBYSxvQkFBb0I7UUFFdkIsTUFBTSxDQUF5QztRQUMvQyx1QkFBdUIsQ0FBaUM7UUFDeEQsS0FBSyxDQUFtQztRQUlqRCxZQUNrQixLQUFhLEVBQ2IsTUFBYyxFQUNkLG9CQUE0QixFQUM1QixzQkFBOEIsRUFDOUIsdUJBQXlELEVBQzFFLE1BQWUsRUFDZixLQUE2QyxFQUM3QyxzQkFBc0Q7WUFQckMsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQVE7WUFDNUIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFRO1lBQzlCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBa0M7WUFQbkUsZ0JBQVcsR0FBRyxLQUFLLENBQUM7WUFZM0IsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUNuRixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksaUJBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxzQkFBc0IsQ0FBQztRQUN2RCxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxRCxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxJQUFJO1lBQ1AsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQixDQUFDO1FBSUQsR0FBRyxDQUFDLEtBQWlGLEVBQUUsV0FBOEM7WUFFcEksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLGdDQUFnQztnQkFDaEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNiLE9BQU87WUFDUixDQUFDO1lBRUQscUNBQXFDO1lBRXJDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0QixJQUFJLE1BQU0sR0FBaUIsRUFBRSxDQUFDO1lBRTlCLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUV0QixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2xCLG9CQUFvQjtvQkFDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbkIsT0FBTztnQkFDUixDQUFDO2dCQUVELG9CQUFvQjtnQkFDcEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVsQixDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNqQyxtQkFBbUI7Z0JBQ25CLE1BQU0sR0FBRyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxPQUErQixDQUFDO2dCQUVwQyxxQkFBcUI7Z0JBQ3JCLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLDBCQUEwQixDQUFDLENBQUM7Z0JBRXpFLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQzNCLE1BQU0sQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLEdBQUcsS0FBSyxDQUFDO29CQUNqQyxJQUFJLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQzt3QkFDdkQsSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDOzRCQUN0RCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDNUIsQ0FBQzt3QkFDRCxPQUFPLEdBQUcsR0FBRyxDQUFDO3dCQUNkLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2pCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDekIsQ0FBQztvQkFFRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7d0JBQ2xCLG9DQUFvQzt3QkFDcEMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDL0MsSUFBSSxrQkFBa0IsRUFBRSxDQUFDOzRCQUN4QixrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO3dCQUMvQixDQUFDO29CQUNGLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUMvQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQztvQkFDMUMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELDRCQUE0QjtZQUM1QixJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTFDLHVDQUF1QztZQUN2QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sT0FBTyxHQUEyQixFQUFFLENBQUM7WUFDM0MsSUFBSSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7WUFDekIsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxNQUFNLEdBQWtCLEVBQUUsQ0FBQztnQkFDL0IsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3hDLElBQUksV0FBVyxFQUFFLENBQUM7b0JBRWpCLHNDQUFzQztvQkFDdEMsSUFBSSxXQUFXLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO3dCQUN0RCxNQUFNLEdBQUcsRUFBRSxDQUFDO3dCQUNaLE1BQU0sS0FBSyxHQUFHLENBQUMsaUNBQWtCLENBQUMsS0FBSyxFQUFFLGlDQUFrQixDQUFDLE9BQU8sRUFBRSxpQ0FBa0IsQ0FBQyxXQUFXLEVBQUUsaUNBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQzlILFNBQVMsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7NEJBQ3ZDLEtBQUssTUFBTSxVQUFVLElBQUksV0FBVyxFQUFFLENBQUM7Z0NBQ3RDLElBQUksVUFBVSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQ0FDdEMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7b0NBQ3pILElBQUksR0FBRyxLQUFLLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO3dDQUN6QyxNQUFNLFNBQVMsQ0FBQztvQ0FDakIsQ0FBQztnQ0FDRixDQUFDOzRCQUNGLENBQUM7d0JBQ0YsQ0FBQzt3QkFFRCwwREFBMEQ7d0JBQzFELE1BQU0sQ0FBQyxJQUFJLENBQUM7NEJBQ1gsUUFBUSxFQUFFLHdCQUFjLENBQUMsSUFBSTs0QkFDN0IsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxnREFBZ0QsQ0FBQyxFQUFFLEVBQUUsOENBQThDLEVBQUUsV0FBVyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUM7NEJBQ3JNLGVBQWUsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxlQUFlOzRCQUMxRCxXQUFXLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVzs0QkFDbEQsYUFBYSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLGFBQWE7NEJBQ3RELFNBQVMsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTO3lCQUM5QyxDQUFDLENBQUM7b0JBQ0osQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE1BQU0sR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDL0gsQ0FBQztnQkFDRixDQUFDO2dCQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFFNUIsZ0JBQWdCLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDbEMsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztvQkFDbEQsMENBQTBDO29CQUMxQyxNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRUQsTUFBTSxDQUFDLEdBQWU7WUFDckIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELE9BQU8sQ0FBQyxRQUE0RyxFQUFFLE9BQWE7WUFDbEksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3RCLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDbEMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMzQyxDQUFDO1FBQ0YsQ0FBQztRQUVELENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0QixLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNGLENBQUM7UUFFRCxHQUFHLENBQUMsR0FBUTtZQUNYLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBQ0QsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsR0FBRyxDQUFDLEdBQVE7WUFDWCxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdEIsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVPLGNBQWM7WUFDckIsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsb0NBQW9DLENBQUMsQ0FBQztZQUN2RCxDQUFDO1FBQ0YsQ0FBQztRQUVPLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxDQUE2QyxFQUFFLENBQTZDO1lBQ3JJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUN2QyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQztpQkFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDOUMsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBaE5ELG9EQWdOQztJQUVNLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQWtCOztpQkFFZixZQUFPLEdBQVcsQ0FBQyxBQUFaLENBQWE7aUJBQ1gsMkJBQXNCLEdBQVcsSUFBSSxBQUFmLENBQWdCO2lCQUN0Qyx5QkFBb0IsR0FBVyxHQUFHLEdBQUcsb0JBQWtCLENBQUMsc0JBQXNCLEFBQTFELENBQTJEO1FBTXZHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBMkI7WUFDekMsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBVyxFQUFjLENBQUM7WUFDMUMsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDeEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkIsQ0FBQztZQUNELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUMxRCxDQUFDO1FBSUQsWUFDQyxXQUF5QixFQUNaLFdBQXlDLEVBQzlCLHNCQUErRCxFQUN0RSwyQkFBdUQ7WUFGMUMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDYiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBQ3RFLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNEI7WUFqQnhELGlCQUFZLEdBQUcsSUFBSSxHQUFHLEVBQWdDLENBQUM7WUFDdkQsNEJBQXVCLEdBQUcsSUFBSSx1QkFBZSxDQUF3QixFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQVV0SCwyQkFBc0IsR0FBd0MsYUFBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLG9CQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBUWhKLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELDBCQUEwQixDQUFDLFdBQWdDLEVBQUUsSUFBYTtZQUV6RSxNQUFNLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsc0JBQXNCLEVBQUUsMkJBQTJCLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFFakksTUFBTSxZQUFZLEdBQUcsSUFBSTtnQkFDeEIsV0FBVyxDQUFDLEtBQWEsRUFBRSxPQUFxRDtvQkFDL0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ25DLFdBQVcsQ0FBQyxLQUFLLENBQUMsNkRBQTZELEVBQUUsV0FBVyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3pKLENBQUM7Z0JBQ0QsTUFBTSxDQUFDLEtBQWE7b0JBQ25CLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3JCLFdBQVcsQ0FBQyxLQUFLLENBQUMsc0RBQXNELEVBQUUsV0FBVyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDckcsQ0FBQztnQkFDRCxPQUFPO29CQUNOLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEIsQ0FBQzthQUNELENBQUM7WUFHRixJQUFJLEtBQWEsQ0FBQztZQUNsQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxHQUFHLHlDQUF5QyxHQUFHLG9CQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNoRixLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2QsQ0FBQztpQkFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNwQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2QsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxJQUFJLHVCQUF1QixDQUFDLENBQUM7Z0JBQ3RGLEdBQUcsQ0FBQztvQkFDSCxLQUFLLEdBQUcsSUFBSSxHQUFHLG9CQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM3QyxDQUFDLFFBQVEsWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNuQyxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxLQUFNLFNBQVEsb0JBQW9CO2dCQUNwRDtvQkFDQyxLQUFLLENBQ0osSUFBSyxFQUFFLEtBQUssRUFDWixvQkFBa0IsQ0FBQyxvQkFBb0IsRUFDdkMsb0JBQWtCLENBQUMsc0JBQXNCLEVBQ3pDLEdBQUcsQ0FBQyxFQUFFLENBQUMsMkJBQTJCLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFDNUQsc0JBQXNCLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSx1QkFBdUIsQ0FDcEUsQ0FBQztvQkFDRixZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDL0IsQ0FBQztnQkFDUSxPQUFPO29CQUNmLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDaEIsWUFBWSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDNUIsQ0FBQzthQUNELENBQUM7WUFFRixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFLRCxjQUFjLENBQUMsUUFBcUI7WUFDbkMsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdkMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO2dCQUN4QyxNQUFNLEdBQUcsR0FBd0MsRUFBRSxDQUFDO2dCQUNwRCxLQUFLLE1BQU0sVUFBVSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztvQkFDckQsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsRUFBRTt3QkFDdkMsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQzt3QkFDcEMsSUFBSSxPQUFPLEdBQUcsS0FBSyxXQUFXLEVBQUUsQ0FBQzs0QkFDaEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7NEJBQ2pCLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDOzRCQUMvQixHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3JCLENBQUM7d0JBQ0QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQztvQkFDbEQsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFDRCxPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUM7UUFDRixDQUFDO1FBRU8sZUFBZSxDQUFDLFFBQW9CO1lBQzNDLElBQUksR0FBRyxHQUF3QixFQUFFLENBQUM7WUFDbEMsS0FBSyxNQUFNLFVBQVUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ3JELElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUM5QixHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO1FBSUQsb0JBQW9CLENBQUMsSUFBc0M7WUFFMUQsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM3QixNQUFNLElBQUksR0FBRyxtQkFBbUIsQ0FBQztnQkFDakMsTUFBTSxVQUFVLEdBQUcsSUFBSSxvQkFBb0IsQ0FDMUMsSUFBSSxFQUFFLElBQUksRUFDVixNQUFNLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixFQUFFLHlFQUF5RTtnQkFDM0gsQUFEa0QseUVBQXlFO2dCQUMzSCxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFDakIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixDQUMzRSxDQUFDO2dCQUNGLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQztZQUNyQyxDQUFDO1lBRUQsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkYsQ0FBQztRQUNGLENBQUM7O0lBdElXLGdEQUFrQjtpQ0FBbEIsa0JBQWtCO1FBc0I1QixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLDhDQUFzQixDQUFBO09BdkJaLGtCQUFrQixDQXVJOUIifQ==