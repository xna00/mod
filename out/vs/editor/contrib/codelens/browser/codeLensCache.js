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
define(["require", "exports", "vs/base/common/event", "vs/base/common/map", "vs/editor/common/core/range", "vs/editor/contrib/codelens/browser/codelens", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/base/browser/window", "vs/base/browser/dom"], function (require, exports, event_1, map_1, range_1, codelens_1, extensions_1, instantiation_1, storage_1, window_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeLensCache = exports.ICodeLensCache = void 0;
    exports.ICodeLensCache = (0, instantiation_1.createDecorator)('ICodeLensCache');
    class CacheItem {
        constructor(lineCount, data) {
            this.lineCount = lineCount;
            this.data = data;
        }
    }
    let CodeLensCache = class CodeLensCache {
        constructor(storageService) {
            this._fakeProvider = new class {
                provideCodeLenses() {
                    throw new Error('not supported');
                }
            };
            this._cache = new map_1.LRUCache(20, 0.75);
            // remove old data
            const oldkey = 'codelens/cache';
            (0, dom_1.runWhenWindowIdle)(window_1.mainWindow, () => storageService.remove(oldkey, 1 /* StorageScope.WORKSPACE */));
            // restore lens data on start
            const key = 'codelens/cache2';
            const raw = storageService.get(key, 1 /* StorageScope.WORKSPACE */, '{}');
            this._deserialize(raw);
            // store lens data on shutdown
            event_1.Event.once(storageService.onWillSaveState)(e => {
                if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    storageService.store(key, this._serialize(), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                }
            });
        }
        put(model, data) {
            // create a copy of the model that is without command-ids
            // but with comand-labels
            const copyItems = data.lenses.map(item => {
                return {
                    range: item.symbol.range,
                    command: item.symbol.command && { id: '', title: item.symbol.command?.title },
                };
            });
            const copyModel = new codelens_1.CodeLensModel();
            copyModel.add({ lenses: copyItems, dispose: () => { } }, this._fakeProvider);
            const item = new CacheItem(model.getLineCount(), copyModel);
            this._cache.set(model.uri.toString(), item);
        }
        get(model) {
            const item = this._cache.get(model.uri.toString());
            return item && item.lineCount === model.getLineCount() ? item.data : undefined;
        }
        delete(model) {
            this._cache.delete(model.uri.toString());
        }
        // --- persistence
        _serialize() {
            const data = Object.create(null);
            for (const [key, value] of this._cache) {
                const lines = new Set();
                for (const d of value.data.lenses) {
                    lines.add(d.symbol.range.startLineNumber);
                }
                data[key] = {
                    lineCount: value.lineCount,
                    lines: [...lines.values()]
                };
            }
            return JSON.stringify(data);
        }
        _deserialize(raw) {
            try {
                const data = JSON.parse(raw);
                for (const key in data) {
                    const element = data[key];
                    const lenses = [];
                    for (const line of element.lines) {
                        lenses.push({ range: new range_1.Range(line, 1, line, 11) });
                    }
                    const model = new codelens_1.CodeLensModel();
                    model.add({ lenses, dispose() { } }, this._fakeProvider);
                    this._cache.set(key, new CacheItem(element.lineCount, model));
                }
            }
            catch {
                // ignore...
            }
        }
    };
    exports.CodeLensCache = CodeLensCache;
    exports.CodeLensCache = CodeLensCache = __decorate([
        __param(0, storage_1.IStorageService)
    ], CodeLensCache);
    (0, extensions_1.registerSingleton)(exports.ICodeLensCache, CodeLensCache, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUxlbnNDYWNoZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29kZWxlbnMvYnJvd3Nlci9jb2RlTGVuc0NhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWNuRixRQUFBLGNBQWMsR0FBRyxJQUFBLCtCQUFlLEVBQWlCLGdCQUFnQixDQUFDLENBQUM7SUFjaEYsTUFBTSxTQUFTO1FBRWQsWUFDVSxTQUFpQixFQUNqQixJQUFtQjtZQURuQixjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQ2pCLFNBQUksR0FBSixJQUFJLENBQWU7UUFDekIsQ0FBQztLQUNMO0lBRU0sSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYTtRQVl6QixZQUE2QixjQUErQjtZQVIzQyxrQkFBYSxHQUFHLElBQUk7Z0JBQ3BDLGlCQUFpQjtvQkFDaEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDbEMsQ0FBQzthQUNELENBQUM7WUFFZSxXQUFNLEdBQUcsSUFBSSxjQUFRLENBQW9CLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUluRSxrQkFBa0I7WUFDbEIsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUM7WUFDaEMsSUFBQSx1QkFBaUIsRUFBQyxtQkFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxpQ0FBeUIsQ0FBQyxDQUFDO1lBRTNGLDZCQUE2QjtZQUM3QixNQUFNLEdBQUcsR0FBRyxpQkFBaUIsQ0FBQztZQUM5QixNQUFNLEdBQUcsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsa0NBQTBCLElBQUksQ0FBQyxDQUFDO1lBQ2xFLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFdkIsOEJB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