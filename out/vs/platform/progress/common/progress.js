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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, async_1, cancellation_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IEditorProgressService = exports.LongRunningOperation = exports.UnmanagedProgress = exports.AsyncProgress = exports.Progress = exports.emptyProgressRunner = exports.ProgressLocation = exports.IProgressService = void 0;
    exports.IProgressService = (0, instantiation_1.createDecorator)('progressService');
    var ProgressLocation;
    (function (ProgressLocation) {
        ProgressLocation[ProgressLocation["Explorer"] = 1] = "Explorer";
        ProgressLocation[ProgressLocation["Scm"] = 3] = "Scm";
        ProgressLocation[ProgressLocation["Extensions"] = 5] = "Extensions";
        ProgressLocation[ProgressLocation["Window"] = 10] = "Window";
        ProgressLocation[ProgressLocation["Notification"] = 15] = "Notification";
        ProgressLocation[ProgressLocation["Dialog"] = 20] = "Dialog";
    })(ProgressLocation || (exports.ProgressLocation = ProgressLocation = {}));
    exports.emptyProgressRunner = Object.freeze({
        total() { },
        worked() { },
        done() { }
    });
    class Progress {
        static { this.None = Object.freeze({ report() { } }); }
        get value() { return this._value; }
        constructor(callback) {
            this.callback = callback;
        }
        report(item) {
            this._value = item;
            this.callback(this._value);
        }
    }
    exports.Progress = Progress;
    class AsyncProgress {
        get value() { return this._value; }
        constructor(callback) {
            this.callback = callback;
        }
        report(item) {
            if (!this._asyncQueue) {
                this._asyncQueue = [item];
            }
            else {
                this._asyncQueue.push(item);
            }
            this._processAsyncQueue();
        }
        async _processAsyncQueue() {
            if (this._processingAsyncQueue) {
                return;
            }
            try {
                this._processingAsyncQueue = true;
                while (this._asyncQueue && this._asyncQueue.length) {
                    const item = this._asyncQueue.shift();
                    this._value = item;
                    await this.callback(this._value);
                }
            }
            finally {
                this._processingAsyncQueue = false;
                const drainListener = this._drainListener;
                this._drainListener = undefined;
                drainListener?.();
            }
        }
        drain() {
            if (this._processingAsyncQueue) {
                return new Promise(resolve => {
                    const prevListener = this._drainListener;
                    this._drainListener = () => {
                        prevListener?.();
                        resolve();
                    };
                });
            }
            return Promise.resolve();
        }
    }
    exports.AsyncProgress = AsyncProgress;
    /**
     * RAII-style progress instance that allows imperative reporting and hides
     * once `dispose()` is called.
     */
    let UnmanagedProgress = class UnmanagedProgress extends lifecycle_1.Disposable {
        constructor(options, progressService) {
            super();
            this.deferred = new async_1.DeferredPromise();
            progressService.withProgress(options, reporter => {
                this.reporter = reporter;
                if (this.lastStep) {
                    reporter.report(this.lastStep);
                }
                return this.deferred.p;
            });
            this._register((0, lifecycle_1.toDisposable)(() => this.deferred.complete()));
        }
        report(step) {
            if (this.reporter) {
                this.reporter.report(step);
            }
            else {
                this.lastStep = step;
            }
        }
    };
    exports.UnmanagedProgress = UnmanagedProgress;
    exports.UnmanagedProgress = UnmanagedProgress = __decorate([
        __param(1, exports.IProgressService)
    ], UnmanagedProgress);
    class LongRunningOperation extends lifecycle_1.Disposable {
        constructor(progressIndicator) {
            super();
            this.progressIndicator = progressIndicator;
            this.currentOperationId = 0;
            this.currentOperationDisposables = this._register(new lifecycle_1.DisposableStore());
        }
        start(progressDelay) {
            // Stop any previous operation
            this.stop();
            // Start new
            const newOperationId = ++this.currentOperationId;
            const newOperationToken = new cancellation_1.CancellationTokenSource();
            this.currentProgressTimeout = setTimeout(() => {
                if (newOperationId === this.currentOperationId) {
                    this.currentProgressRunner = this.progressIndicator.show(true);
                }
            }, progressDelay);
            this.currentOperationDisposables.add((0, lifecycle_1.toDisposable)(() => clearTimeout(this.currentProgressTimeout)));
            this.currentOperationDisposables.add((0, lifecycle_1.toDisposable)(() => newOperationToken.cancel()));
            this.currentOperationDisposables.add((0, lifecycle_1.toDisposable)(() => this.currentProgressRunner ? this.currentProgressRunner.done() : undefined));
            return {
                id: newOperationId,
                token: newOperationToken.token,
                stop: () => this.doStop(newOperationId),
                isCurrent: () => this.currentOperationId === newOperationId
            };
        }
        stop() {
            this.doStop(this.currentOperationId);
        }
        doStop(operationId) {
            if (this.currentOperationId === operationId) {
                this.currentOperationDisposables.clear();
            }
        }
    }
    exports.LongRunningOperation = LongRunningOperation;
    exports.IEditorProgressService = (0, instantiation_1.createDecorator)('editorProgressService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Byb2dyZXNzL2NvbW1vbi9wcm9ncmVzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTbkYsUUFBQSxnQkFBZ0IsR0FBRyxJQUFBLCtCQUFlLEVBQW1CLGlCQUFpQixDQUFDLENBQUM7SUErQnJGLElBQWtCLGdCQU9qQjtJQVBELFdBQWtCLGdCQUFnQjtRQUNqQywrREFBWSxDQUFBO1FBQ1oscURBQU8sQ0FBQTtRQUNQLG1FQUFjLENBQUE7UUFDZCw0REFBVyxDQUFBO1FBQ1gsd0VBQWlCLENBQUE7UUFDakIsNERBQVcsQ0FBQTtJQUNaLENBQUMsRUFQaUIsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFPakM7SUFpRFksUUFBQSxtQkFBbUIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFrQjtRQUNqRSxLQUFLLEtBQUssQ0FBQztRQUNYLE1BQU0sS0FBSyxDQUFDO1FBQ1osSUFBSSxLQUFLLENBQUM7S0FDVixDQUFDLENBQUM7SUFNSCxNQUFhLFFBQVE7aUJBRUosU0FBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQXFCLEVBQUUsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFHM0UsSUFBSSxLQUFLLEtBQW9CLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFFbEQsWUFBb0IsUUFBOEI7WUFBOUIsYUFBUSxHQUFSLFFBQVEsQ0FBc0I7UUFDbEQsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFPO1lBQ2IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFDbkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUIsQ0FBQzs7SUFiRiw0QkFjQztJQUVE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