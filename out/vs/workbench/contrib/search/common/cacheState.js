/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/idGenerator", "vs/base/common/objects"], function (require, exports, idGenerator_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileQueryCacheState = void 0;
    var LoadingPhase;
    (function (LoadingPhase) {
        LoadingPhase[LoadingPhase["Created"] = 1] = "Created";
        LoadingPhase[LoadingPhase["Loading"] = 2] = "Loading";
        LoadingPhase[LoadingPhase["Loaded"] = 3] = "Loaded";
        LoadingPhase[LoadingPhase["Errored"] = 4] = "Errored";
        LoadingPhase[LoadingPhase["Disposed"] = 5] = "Disposed";
    })(LoadingPhase || (LoadingPhase = {}));
    class FileQueryCacheState {
        get cacheKey() {
            if (this.loadingPhase === LoadingPhase.Loaded || !this.previousCacheState) {
                return this._cacheKey;
            }
            return this.previousCacheState.cacheKey;
        }
        get isLoaded() {
            const isLoaded = this.loadingPhase === LoadingPhase.Loaded;
            return isLoaded || !this.previousCacheState ? isLoaded : this.previousCacheState.isLoaded;
        }
        get isUpdating() {
            const isUpdating = this.loadingPhase === LoadingPhase.Loading;
            return isUpdating || !this.previousCacheState ? isUpdating : this.previousCacheState.isUpdating;
        }
        constructor(cacheQuery, loadFn, disposeFn, previousCacheState) {
            this.cacheQuery = cacheQuery;
            this.loadFn = loadFn;
            this.disposeFn = disposeFn;
            this.previousCacheState = previousCacheState;
            this._cacheKey = idGenerator_1.defaultGenerator.nextId();
            this.query = this.cacheQuery(this._cacheKey);
            this.loadingPhase = LoadingPhase.Created;
            if (this.previousCacheState) {
                const current = Object.assign({}, this.query, { cacheKey: null });
                const previous = Object.assign({}, this.previousCacheState.query, { cacheKey: null });
                if (!(0, objects_1.equals)(current, previous)) {
                    this.previousCacheState.dispose();
                    this.previousCacheState = undefined;
                }
            }
        }
        load() {
            if (this.isUpdating) {
                return this;
            }
            this.loadingPhase = LoadingPhase.Loading;
            this.loadPromise = (async () => {
                try {
                    await this.loadFn(this.query);
                    this.loadingPhase = LoadingPhase.Loaded;
                    if (this.previousCacheState) {
                        this.previousCacheState.dispose();
                        this.previousCacheState = undefined;
                    }
                }
                catch (error) {
                    this.loadingPhase = LoadingPhase.Errored;
                    throw error;
                }
            })();
            return this;
        }
        dispose() {
            if (this.loadPromise) {
                (async () => {
                    try {
                        await this.loadPromise;
                    }
                    catch (error) {
                        // ignore
                    }
                    this.loadingPhase = LoadingPhase.Disposed;
                    this.disposeFn(this._cacheKey);
                })();
            }
            else {
                this.loadingPhase = LoadingPhase.Disposed;
            }
            if (this.previousCacheState) {
                this.previousCacheState.dispose();
                this.previousCacheState = undefined;
            }
        }
    }
    exports.FileQueryCacheState = FileQueryCacheState;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGVTdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2NvbW1vbi9jYWNoZVN0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxJQUFLLFlBTUo7SUFORCxXQUFLLFlBQVk7UUFDaEIscURBQVcsQ0FBQTtRQUNYLHFEQUFXLENBQUE7UUFDWCxtREFBVSxDQUFBO1FBQ1YscURBQVcsQ0FBQTtRQUNYLHVEQUFZLENBQUE7SUFDYixDQUFDLEVBTkksWUFBWSxLQUFaLFlBQVksUUFNaEI7SUFFRCxNQUFhLG1CQUFtQjtRQUcvQixJQUFJLFFBQVE7WUFDWCxJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssWUFBWSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUMzRSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDdkIsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQztRQUN6QyxDQUFDO1FBRUQsSUFBSSxRQUFRO1lBQ1gsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksS0FBSyxZQUFZLENBQUMsTUFBTSxDQUFDO1lBRTNELE9BQU8sUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUM7UUFDM0YsQ0FBQztRQUVELElBQUksVUFBVTtZQUNiLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLEtBQUssWUFBWSxDQUFDLE9BQU8sQ0FBQztZQUU5RCxPQUFPLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMs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