/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/window", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/telemetry/common/errorTelemetry"], function (require, exports, window_1, errors_1, lifecycle_1, errorTelemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ErrorTelemetry extends errorTelemetry_1.default {
        installErrorListeners() {
            let oldOnError;
            const that = this;
            if (typeof window_1.mainWindow.onerror === 'function') {
                oldOnError = window_1.mainWindow.onerror;
            }
            window_1.mainWindow.onerror = function (message, filename, line, column, error) {
                that._onUncaughtError(message, filename, line, column, error);
                oldOnError?.apply(this, [message, filename, line, column, error]);
            };
            this._disposables.add((0, lifecycle_1.toDisposable)(() => {
                if (oldOnError) {
                    window_1.mainWindow.onerror = oldOnError;
                }
            }));
        }
        _onUncaughtError(msg, file, line, column, err) {
            const data = {
                callstack: msg,
                msg,
                file,
                line,
                column
            };
            if (err) {
                // If it's the no telemetry error it doesn't get logged
                if (errors_1.ErrorNoTelemetry.isErrorNoTelemetry(err)) {
                    return;
                }
                const { name, message, stack } = err;
                data.uncaught_error_name = name;
                if (message) {
                    data.uncaught_error_msg = message;
                }
                if (stack) {
                    data.callstack = Array.isArray(err.stack)
                        ? err.stack = err.stack.join('\n')
                        : err.stack;
                }
            }
            this._enqueue(data);
        }
    }
    exports.default = ErrorTelemetry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JUZWxlbWV0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9icm93c2VyL2Vycm9yVGVsZW1ldHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLE1BQXFCLGNBQWUsU0FBUSx3QkFBa0I7UUFDMUMscUJBQXFCO1lBQ3ZDLElBQUksVUFBK0IsQ0FBQztZQUNwQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxPQUFPLG1CQUFVLENBQUMsT0FBTyxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUM5QyxVQUFVLEdBQUcsbUJBQVUsQ0FBQyxPQUFPLENBQUM7WUFDakMsQ0FBQztZQUNELG1CQUFVLENBQUMsT0FBTyxHQUFHLFVBQVUsT0FBdUIsRUFBRSxRQUFpQixFQUFFLElBQWEsRUFBRSxNQUFlLEVBQUUsS0FBYTtnQkFDdkgsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQWlCLEVBQUUsUUFBa0IsRUFBRSxJQUFjLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUM1RixVQUFVLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ25FLENBQUMsQ0FBQztZQUNGLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3ZDLElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLG1CQUFVLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQztnQkFDakMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sZ0JBQWdCLENBQUMsR0FBVyxFQUFFLElBQVksRUFBRSxJQUFZLEVBQUUsTUFBZSxFQUFFLEdBQVM7WUFDM0YsTUFBTSxJQUFJLEdBQWU7Z0JBQ3hCLFNBQVMsRUFBRSxHQUFHO2dCQUNkLEdBQUc7Z0JBQ0gsSUFBSTtnQkFDSixJQUFJO2dCQUNKLE1BQU07YUFDTixDQUFDO1lBRUYsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDVCx1REFBdUQ7Z0JBQ3ZELElBQUkseUJBQWdCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDOUMsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFHLEdBQUcsQ0FBQztnQkFDckMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztnQkFDaEMsSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDYixJQUFJLENBQUMsa0JBQWtCLEdBQUcsT0FBTyxDQUFDO2dCQUNuQyxDQUFDO2dCQUNELElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1gsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7d0JBQ3hDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzt3QkFDbEMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JCLENBQUM7S0FDRDtJQS9DRCxpQ0ErQ0MifQ==