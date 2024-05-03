/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/platform/files/common/files"], function (require, exports, arrays_1, errors_1, lifecycle_1, objects_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ErrorEvent = void 0;
    var ErrorEvent;
    (function (ErrorEvent) {
        function compare(a, b) {
            if (a.callstack < b.callstack) {
                return -1;
            }
            else if (a.callstack > b.callstack) {
                return 1;
            }
            return 0;
        }
        ErrorEvent.compare = compare;
    })(ErrorEvent || (exports.ErrorEvent = ErrorEvent = {}));
    class BaseErrorTelemetry {
        static { this.ERROR_FLUSH_TIMEOUT = 5 * 1000; }
        constructor(telemetryService, flushDelay = BaseErrorTelemetry.ERROR_FLUSH_TIMEOUT) {
            this._flushHandle = -1;
            this._buffer = [];
            this._disposables = new lifecycle_1.DisposableStore();
            this._telemetryService = telemetryService;
            this._flushDelay = flushDelay;
            // (1) check for unexpected but handled errors
            const unbind = errors_1.errorHandler.addListener((err) => this._onErrorEvent(err));
            this._disposables.add((0, lifecycle_1.toDisposable)(unbind));
            // (2) install implementation-specific error listeners
            this.installErrorListeners();
        }
        dispose() {
            clearTimeout(this._flushHandle);
            this._flushBuffer();
            this._disposables.dispose();
        }
        installErrorListeners() {
            // to override
        }
        _onErrorEvent(err) {
            if (!err || err.code) {
                return;
            }
            // unwrap nested errors from loader
            if (err.detail && err.detail.stack) {
                err = err.detail;
            }
            // If it's the no telemetry error it doesn't get logged
            // TOOD @lramos15 hacking in FileOperation error because it's too messy to adopt ErrorNoTelemetry. A better solution should be found
            if (errors_1.ErrorNoTelemetry.isErrorNoTelemetry(err) || err instanceof files_1.FileOperationError || (typeof err?.message === 'string' && err.message.includes('Unable to read file'))) {
                return;
            }
            // work around behavior in workerServer.ts that breaks up Error.stack
            const callstack = Array.isArray(err.stack) ? err.stack.join('\n') : err.stack;
            const msg = err.message ? err.message : (0, objects_1.safeStringify)(err);
            // errors without a stack are not useful telemetry
            if (!callstack) {
                return;
            }
            this._enqueue({ msg, callstack });
        }
        _enqueue(e) {
            const idx = (0, arrays_1.binarySearch)(this._buffer, e, ErrorEvent.compare);
            if (idx < 0) {
                e.count = 1;
                this._buffer.splice(~idx, 0, e);
            }
            else {
                if (!this._buffer[idx].count) {
                    this._buffer[idx].count = 0;
                }
                this._buffer[idx].count += 1;
            }
            if (this._flushHandle === -1) {
                this._flushHandle = setTimeout(() => {
                    this._flushBuffer();
                    this._flushHandle = -1;
                }, this._flushDelay);
            }
        }
        _flushBuffer() {
            for (const error of this._buffer) {
                this._telemetryService.publicLogError2('UnhandledError', error);
            }
            this._buffer.length = 0;
        }
    }
    exports.default = BaseErrorTelemetry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JUZWxlbWV0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9jb21tb24vZXJyb3JUZWxlbWV0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0NoRyxJQUFpQixVQUFVLENBUzFCO0lBVEQsV0FBaUIsVUFBVTtRQUMxQixTQUFnQixPQUFPLENBQUMsQ0FBYSxFQUFFLENBQWE7WUFDbkQsSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNYLENBQUM7aUJBQU0sSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBQ0QsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO1FBUGUsa0JBQU8sVUFPdEIsQ0FBQTtJQUNGLENBQUMsRUFUZ0IsVUFBVSwwQkFBVixVQUFVLFFBUzFCO0lBRUQsTUFBOEIsa0JBQWtCO2lCQUVqQyx3QkFBbUIsR0FBVyxDQUFDLEdBQUcsSUFBSSxBQUFuQixDQUFvQjtRQVFyRCxZQUFZLGdCQUFtQyxFQUFFLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxtQkFBbUI7WUFKNUYsaUJBQVksR0FBUSxDQUFDLENBQUMsQ0FBQztZQUN2QixZQUFPLEdBQWlCLEVBQUUsQ0FBQztZQUNoQixpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBR3ZELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQztZQUMxQyxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUU5Qiw4Q0FBOEM7WUFDOUMsTUFBTSxNQUFNLEdBQUcscUJBQVksQ0FBQyxXQUFX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