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
define(["require", "exports", "./extHostTypeConverters", "vs/platform/progress/common/progress", "vs/base/common/cancellation", "vs/base/common/decorators", "vs/base/common/errors"], function (require, exports, extHostTypeConverters_1, progress_1, cancellation_1, decorators_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostProgress = void 0;
    class ExtHostProgress {
        constructor(proxy) {
            this._handles = 0;
            this._mapHandleToCancellationSource = new Map();
            this._proxy = proxy;
        }
        async withProgress(extension, options, task) {
            const handle = this._handles++;
            const { title, location, cancellable } = options;
            const source = { label: extension.displayName || extension.name, id: extension.identifier.value };
            this._proxy.$startProgress(handle, { location: extHostTypeConverters_1.ProgressLocation.from(location), title, source, cancellable }, !extension.isUnderDevelopment ? extension.identifier.value : undefined).catch(errors_1.onUnexpectedExternalError);
            return this._withProgress(handle, task, !!cancellable);
        }
        _withProgress(handle, task, cancellable) {
            let source;
            if (cancellable) {
                source = new cancellation_1.CancellationTokenSource();
                this._mapHandleToCancellationSource.set(handle, source);
            }
            const progressEnd = (handle) => {
                this._proxy.$progressEnd(handle);
                this._mapHandleToCancellationSource.delete(handle);
                source?.dispose();
            };
            let p;
            try {
                p = task(new ProgressCallback(this._proxy, handle), cancellable && source ? source.token : cancellation_1.CancellationToken.None);
            }
            catch (err) {
                progressEnd(handle);
                throw err;
            }
            p.then(result => progressEnd(handle), err => progressEnd(handle));
            return p;
        }
        $acceptProgressCanceled(handle) {
            const source = this._mapHandleToCancellationSource.get(handle);
            if (source) {
                source.cancel();
                this._mapHandleToCancellationSource.delete(handle);
            }
        }
    }
    exports.ExtHostProgress = ExtHostProgress;
    function mergeProgress(result, currentValue) {
        result.message = currentValue.message;
        if (typeof currentValue.increment === 'number') {
            if (typeof result.increment === 'number') {
                result.increment += currentValue.increment;
            }
            else {
                result.increment = currentValue.increment;
            }
        }
        return result;
    }
    class ProgressCallback extends progress_1.Progress {
        constructor(_proxy, _handle) {
            super(p => this.throttledReport(p));
            this._proxy = _proxy;
            this._handle = _handle;
        }
        throttledReport(p) {
            this._proxy.$progressReport(this._handle, p);
        }
    }
    __decorate([
        (0, decorators_1.throttle)(100, (result, currentValue) => mergeProgress(result, currentValue), () => Object.create(null))
    ], ProgressCallback.prototype, "throttledReport", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFByb2dyZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0UHJvZ3Jlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7O0lBV2hHLE1BQWEsZUFBZTtRQU0zQixZQUFZLEtBQThCO1lBSGxDLGFBQVEsR0FBVyxDQUFDLENBQUM7WUFDckIsbUNBQThCLEdBQXlDLElBQUksR0FBRyxFQUFFLENBQUM7WUFHeEYsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDckIsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZLENBQUksU0FBZ0MsRUFBRSxPQUF3QixFQUFFLElBQWtGO1lBQ25LLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMvQixNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDakQsTUFBTSxNQUFNLEdBQUcsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLFdBQVcsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRWxHLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSx3Q0FBZ0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxrQ0FBeUIsQ0FBQyxDQUFDO1lBQ3ZO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