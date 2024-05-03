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
define(["require", "exports", "vs/base/common/hash", "vs/base/common/map", "vs/base/common/numbers", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/base/common/network"], function (require, exports, hash_1, map_1, numbers_1, environment_1, extensions_1, instantiation_1, log_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageFeatureDebounceService = exports.ILanguageFeatureDebounceService = void 0;
    exports.ILanguageFeatureDebounceService = (0, instantiation_1.createDecorator)('ILanguageFeatureDebounceService');
    var IdentityHash;
    (function (IdentityHash) {
        const _hashes = new WeakMap();
        let pool = 0;
        function of(obj) {
            let value = _hashes.get(obj);
            if (value === undefined) {
                value = ++pool;
                _hashes.set(obj, value);
            }
            return value;
        }
        IdentityHash.of = of;
    })(IdentityHash || (IdentityHash = {}));
    class NullDebounceInformation {
        constructor(_default) {
            this._default = _default;
        }
        get(_model) {
            return this._default;
        }
        update(_model, _value) {
            return this._default;
        }
        default() {
            return this._default;
        }
    }
    class FeatureDebounceInformation {
        constructor(_logService, _name, _registry, _default, _min, _max) {
            this._logService = _logService;
            this._name = _name;
            this._registry = _registry;
            this._default = _default;
            this._min = _min;
            this._max = _max;
            this._cache = new map_1.LRUCache(50, 0.7);
        }
        _key(model) {
            return model.id + this._registry.all(model).reduce((hashVal, obj) => (0, hash_1.doHash)(IdentityHash.of(obj), hashVal), 0);
        }
        get(model) {
            const key = this._key(model);
            const avg = this._cache.get(key);
            return avg
                ? (0, numbers_1.clamp)(avg.value, this._min, this._max)
                : this.default();
        }
        update(model, value) {
            const key = this._key(model);
            let avg = this._cache.get(key);
            if (!avg) {
                avg = new numbers_1.SlidingWindowAverage(6);
                this._cache.set(key, avg);
            }
            const newValue = (0, numbers_1.clamp)(avg.update(value), this._min, this._max);
            if (!(0, network_1.matchesScheme)(model.uri, 'output')) {
                this._logService.trace(`[DEBOUNCE: ${this._name}] for ${model.uri.toString()} is ${newValue}ms`);
            }
            return newValue;
        }
        _overall() {
            const result = new numbers_1.MovingAverage();
            for (const [, avg] of this._cache) {
                result.update(avg.value);
            }
            return result.value;
        }
        default() {
            const value = (this._overall() | 0) || this._default;
            return (0, numbers_1.clamp)(value, this._min, this._max);
        }
    }
    let LanguageFeatureDebounceService = class LanguageFeatureDebounceService {
        constructor(_logService, envService) {
            this._logService = _logService;
            this._data = new Map();
            this._isDev = envService.isExtensionDevelopment || !envService.isBuilt;
        }
        for(feature, name, config) {
            const min = config?.min ?? 50;
            const max = config?.max ?? min ** 2;
            const extra = config?.key ?? undefined;
            const key = `${IdentityHash.of(feature)},${min}${extra ? ',' + extra : ''}`;
            let info = this._data.get(key);
            if (!info) {
                if (!this._isDev) {
                    this._logService.debug(`[DEBOUNCE: ${name}] is disabled in developed mode`);
                    info = new NullDebounceInformation(min * 1.5);
                }
                else {
                    info = new FeatureDebounceInformation(this._logService, name, feature, (this._overallAverage() | 0) || (min * 1.5), // default is overall default or derived from min-value
                    min, max);
                }
                this._data.set(key, info);
            }
            return info;
        }
        _overallAverage() {
            // Average of all language features. Not a great value but an approximation
            const result = new numbers_1.MovingAverage();
            for (const info of this._data.values()) {
                result.update(info.default());
            }
            return result.value;
        }
    };
    exports.LanguageFeatureDebounceService = LanguageFeatureDebounceService;
    exports.LanguageFeatureDebounceService = LanguageFeatureDebounceService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environment_1.IEnvironmentService)
    ], LanguageFeatureDebounceService);
    (0, extensions_1.registerSingleton)(exports.ILanguageFeatureDebounceService, LanguageFeatureDebounceService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VGZWF0dXJlRGVib3VuY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vc2VydmljZXMvbGFuZ3VhZ2VGZWF0dXJlRGVib3VuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY25GLFFBQUEsK0JBQStCLEdBQUcsSUFBQSwrQkFBZSxFQUFrQyxpQ0FBaUMsQ0FBQyxDQUFDO0lBZW5JLElBQVUsWUFBWSxDQVdyQjtJQVhELFdBQVUsWUFBWTtRQUNyQixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBa0IsQ0FBQztRQUM5QyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7UUFDYixTQUFnQixFQUFFLENBQUMsR0FBVztZQUM3QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUN6QixLQUFLLEdBQUcsRUFBRSxJQUFJLENBQUM7Z0JBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekIsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQVBlLGVBQUUsS0FPakIsQ0FBQTtJQUNGLENBQUMsRUFYUyxZQUFZLEtBQVosWUFBWSxRQVdyQjtJQUVELE1BQU0sdUJBQXVCO1FBRTVCLFlBQTZCLFFBQWdCO1lBQWhCLGFBQVEsR0FBUixRQUFRLENBQVE7UUFBSSxDQUFDO1FBRWxELEdBQUcsQ0FBQyxNQUFrQjtZQUNyQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUNELE1BQU0sQ0FBQyxNQUFrQixFQUFFLE1BQWM7WUFDeEMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFD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