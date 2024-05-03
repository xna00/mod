/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenizationRegistry = void 0;
    class TokenizationRegistry {
        constructor() {
            this._tokenizationSupports = new Map();
            this._factories = new Map();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._colorMap = null;
        }
        handleChange(languageIds) {
            this._onDidChange.fire({
                changedLanguages: languageIds,
                changedColorMap: false
            });
        }
        register(languageId, support) {
            this._tokenizationSupports.set(languageId, support);
            this.handleChange([languageId]);
            return (0, lifecycle_1.toDisposable)(() => {
                if (this._tokenizationSupports.get(languageId) !== support) {
                    return;
                }
                this._tokenizationSupports.delete(languageId);
                this.handleChange([languageId]);
            });
        }
        get(languageId) {
            return this._tokenizationSupports.get(languageId) || null;
        }
        registerFactory(languageId, factory) {
            this._factories.get(languageId)?.dispose();
            const myData = new TokenizationSupportFactoryData(this, languageId, factory);
            this._factories.set(languageId, myData);
            return (0, lifecycle_1.toDisposable)(() => {
                const v = this._factories.get(languageId);
                if (!v || v !== myData) {
                    return;
                }
                this._factories.delete(languageId);
                v.dispose();
            });
        }
        async getOrCreate(languageId) {
            // check first if the support is already set
            const tokenizationSupport = this.get(languageId);
            if (tokenizationSupport) {
                return tokenizationSupport;
            }
            const factory = this._factories.get(languageId);
            if (!factory || factory.isResolved) {
                // no factory or factory.resolve already finished
                return null;
            }
            await factory.resolve();
            return this.get(languageId);
        }
        isResolved(languageId) {
            const tokenizationSupport = this.get(languageId);
            if (tokenizationSupport) {
                return true;
            }
            const factory = this._factories.get(languageId);
            if (!factory || factory.isResolved) {
                return true;
            }
            return false;
        }
        setColorMap(colorMap) {
            this._colorMap = colorMap;
            this._onDidChange.fire({
                changedLanguages: Array.from(this._tokenizationSupports.keys()),
                changedColorMap: true
            });
        }
        getColorMap() {
            return this._colorMap;
        }
        getDefaultBackground() {
            if (this._colorMap && this._colorMap.length > 2 /* ColorId.DefaultBackground */) {
                return this._colorMap[2 /* ColorId.DefaultBackground */];
            }
            return null;
        }
    }
    exports.TokenizationRegistry = TokenizationRegistry;
    class TokenizationSupportFactoryData extends lifecycle_1.Disposable {
        get isResolved() {
            return this._isResolved;
        }
        constructor(_registry, _languageId, _factory) {
            super();
            this._registry = _registry;
            this._languageId = _languageId;
            this._factory = _factory;
            this._isDisposed = false;
            this._resolvePromise = null;
            this._isResolved = false;
        }
        dispose() {
            this._isDisposed = true;
            super.dispose();
        }
        async resolve() {
            if (!this._resolvePromise) {
                this._resolvePromise = this._create();
            }
            return this._resolvePromise;
        }
        async _create() {
            const value = await this._factory.tokenizationSupport;
            this._isResolved = true;
            if (value && !this._isDisposed) {
                this._register(this._registry.register(this._languageId, value));
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5pemF0aW9uUmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdG9rZW5pemF0aW9uUmVnaXN0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsb0JBQW9CO1FBVWhDO1lBUmlCLDBCQUFxQixHQUFHLElBQUksR0FBRyxFQUFnQyxDQUFDO1lBQ2hFLGVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBMEMsQ0FBQztZQUUvRCxpQkFBWSxHQUFHLElBQUksZUFBTyxFQUFvQyxDQUFDO1lBQ2hFLGdCQUFXLEdBQTRDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBSzlGLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLENBQUM7UUFFTSxZQUFZLENBQUMsV0FBcUI7WUFDeEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUM7Z0JBQ3RCLGdCQUFnQixFQUFFLFdBQVc7Z0JBQzdCLGVBQWUsRUFBRSxLQUFLO2FBQ3RCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxRQUFRLENBQUMsVUFBa0IsRUFBRSxPQUE2QjtZQUNoRSxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNoQyxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxPQUFPLEVBQUUsQ0FBQztvQkFDNUQsT0FBTztnQkFDUixDQUFDO2dCQUNELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsVUFBVSxD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