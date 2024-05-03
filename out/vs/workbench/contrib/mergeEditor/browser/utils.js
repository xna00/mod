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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/platform/storage/common/storage"], function (require, exports, arrays_1, errors_1, lifecycle_1, observable_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PersistentStore = exports.ReentrancyBarrier = void 0;
    exports.setStyle = setStyle;
    exports.applyObservableDecorations = applyObservableDecorations;
    exports.leftJoin = leftJoin;
    exports.join = join;
    exports.concatArrays = concatArrays;
    exports.elementAtOrUndefined = elementAtOrUndefined;
    exports.thenIfNotDisposed = thenIfNotDisposed;
    exports.setFields = setFields;
    exports.deepMerge = deepMerge;
    exports.observableConfigValue = observableConfigValue;
    class ReentrancyBarrier {
        constructor() {
            this._isActive = false;
        }
        get isActive() {
            return this._isActive;
        }
        makeExclusive(fn) {
            return ((...args) => {
                if (this._isActive) {
                    return;
                }
                this._isActive = true;
                try {
                    return fn(...args);
                }
                finally {
                    this._isActive = false;
                }
            });
        }
        runExclusively(fn) {
            if (this._isActive) {
                return;
            }
            this._isActive = true;
            try {
                fn();
            }
            finally {
                this._isActive = false;
            }
        }
        runExclusivelyOrThrow(fn) {
            if (this._isActive) {
                throw new errors_1.BugIndicatingError();
            }
            this._isActive = true;
            try {
                fn();
            }
            finally {
                this._isActive = false;
            }
        }
    }
    exports.ReentrancyBarrier = ReentrancyBarrier;
    function setStyle(element, style) {
        Object.entries(style).forEach(([key, value]) => {
            element.style.setProperty(key, toSize(value));
        });
    }
    function toSize(value) {
        return typeof value === 'number' ? `${value}px` : value;
    }
    function applyObservableDecorations(editor, decorations) {
        const d = new lifecycle_1.DisposableStore();
        let decorationIds = [];
        d.add((0, observable_1.autorunOpts)({ debugName: () => `Apply decorations from ${decorations.debugName}` }, reader => {
            const d = decorations.read(reader);
            editor.changeDecorations(a => {
                decorationIds = a.deltaDecorations(decorationIds, d);
            });
        }));
        d.add({
            dispose: () => {
                editor.changeDecorations(a => {
                    decorationIds = a.deltaDecorations(decorationIds, []);
                });
            }
        });
        return d;
    }
    function* leftJoin(left, right, compare) {
        const rightQueue = new arrays_1.ArrayQueue(right);
        for (const leftElement of left) {
            rightQueue.takeWhile(rightElement => arrays_1.CompareResult.isGreaterThan(compare(leftElement, rightElement)));
            const equals = rightQueue.takeWhile(rightElement => arrays_1.CompareResult.isNeitherLessOrGreaterThan(compare(leftElement, rightElement)));
            yield { left: leftElement, rights: equals || [] };
        }
    }
    function* join(left, right, compare) {
        const rightQueue = new arrays_1.ArrayQueue(right);
        for (const leftElement of left) {
            const skipped = rightQueue.takeWhile(rightElement => arrays_1.CompareResult.isGreaterThan(compare(leftElement, rightElement)));
            if (skipped) {
                yield { rights: skipped };
            }
            const equals = rightQueue.takeWhile(rightElement => arrays_1.CompareResult.isNeitherLessOrGreaterThan(compare(leftElement, rightElement)));
            yield { left: leftElement, rights: equals || [] };
        }
    }
    function concatArrays(...arrays) {
        return [].concat(...arrays);
    }
    function elementAtOrUndefined(arr, index) {
        return arr[index];
    }
    function thenIfNotDisposed(promise, then) {
        let disposed = false;
        promise.then(() => {
            if (disposed) {
                return;
            }
            then();
        });
        return (0, lifecycle_1.toDisposable)(() => {
            disposed = true;
        });
    }
    function setFields(obj, fields) {
        return Object.assign(obj, fields);
    }
    function deepMerge(source1, source2) {
        const result = {};
        for (const key in source1) {
            result[key] = source1[key];
        }
        for (const key in source2) {
            const source2Value = source2[key];
            if (typeof result[key] === 'object' && source2Value && typeof source2Value === 'object') {
                result[key] = deepMerge(result[key], source2Value);
            }
            else {
                result[key] = source2Value;
            }
        }
        return result;
    }
    let PersistentStore = class PersistentStore {
        constructor(key, storageService) {
            this.key = key;
            this.storageService = storageService;
            this.hasValue = false;
            this.value = undefined;
        }
        get() {
            if (!this.hasValue) {
                const value = this.storageService.get(this.key, 0 /* StorageScope.PROFILE */);
                if (value !== undefined) {
                    try {
                        this.value = JSON.parse(value);
                    }
                    catch (e) {
                        (0, errors_1.onUnexpectedError)(e);
                    }
                }
                this.hasValue = true;
            }
            return this.value;
        }
        set(newValue) {
            this.value = newValue;
            this.storageService.store(this.key, JSON.stringify(this.value), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
    };
    exports.PersistentStore = PersistentStore;
    exports.PersistentStore = PersistentStore = __decorate([
        __param(1, storage_1.IStorageService)
    ], PersistentStore);
    function observableConfigValue(key, defaultValue, configurationService) {
        return (0, observable_1.observableFromEvent)((handleChange) => configurationService.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(key)) {
                handleChange(e);
            }
        }), () => configurationService.getValue(key) ?? defaultValue);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeURoRyw0QkFZQztJQU1ELGdFQWlCQztJQUVELDRCQVdDO0lBRUQsb0JBY0M7SUFFRCxvQ0FFQztJQUVELG9EQUVDO0lBRUQsOENBV0M7SUFFRCw4QkFFQztJQUVELDhCQWNDO0lBdUNELHNEQVNDO0lBdk1ELE1BQWEsaUJBQWlCO1FBQTlCO1lBQ1MsY0FBUyxHQUFHLEtBQUssQ0FBQztRQTJDM0IsQ0FBQztRQXpDQSxJQUFXLFFBQVE7WUFDbEIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7UUFFTSxhQUFhLENBQTZCLEVBQWE7WUFDN0QsT0FBTyxDQUFDLENBQUMsR0FBRyxJQUFXLEVBQUUsRUFBRTtnQkFDMUIsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ3BCLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztnQkFDdEIsSUFBSSxDQUFDO29CQUNKLE9BQU8sRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBQ3BCLENBQUM7d0JBQVMsQ0FBQztvQkFDVixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztnQkFDeEIsQ0FBQztZQUNGLENBQUMsQ0FBUSxDQUFDO1FBQ1gsQ0FBQztRQUVNLGNBQWMsQ0FBQyxFQUFjO1lBQ25DLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwQixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLElBQUksQ0FBQztnQkFD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