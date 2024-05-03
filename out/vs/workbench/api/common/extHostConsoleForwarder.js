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
define(["require", "exports", "vs/base/common/objects", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService"], function (require, exports, objects_1, extHost_protocol_1, extHostInitDataService_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExtHostConsoleForwarder = void 0;
    let AbstractExtHostConsoleForwarder = class AbstractExtHostConsoleForwarder {
        constructor(extHostRpc, initData) {
            this._mainThreadConsole = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadConsole);
            this._includeStack = initData.consoleForward.includeStack;
            this._logNative = initData.consoleForward.logNative;
            // Pass console logging to the outside so that we have it in the main side if told so
            this._wrapConsoleMethod('info', 'log');
            this._wrapConsoleMethod('log', 'log');
            this._wrapConsoleMethod('warn', 'warn');
            this._wrapConsoleMethod('debug', 'debug');
            this._wrapConsoleMethod('error', 'error');
        }
        /**
         * Wraps a console message so that it is transmitted to the renderer. If
         * native logging is turned on, the original console message will be written
         * as well. This is needed since the console methods are "magic" in V8 and
         * are the only methods that allow later introspection of logged variables.
         *
         * The wrapped property is not defined with `writable: false` to avoid
         * throwing errors, but rather a no-op setting. See https://github.com/microsoft/vscode-extension-telemetry/issues/88
         */
        _wrapConsoleMethod(method, severity) {
            const that = this;
            const original = console[method];
            Object.defineProperty(console, method, {
                set: () => { },
                get: () => function () {
                    that._handleConsoleCall(method, severity, original, arguments);
                },
            });
        }
        _handleConsoleCall(method, severity, original, args) {
            this._mainThreadConsole.$logExtensionHostMessage({
                type: '__$console',
                severity,
                arguments: safeStringifyArgumentsToArray(args, this._includeStack)
            });
            if (this._logNative) {
                this._nativeConsoleLogMessage(method, original, args);
            }
        }
    };
    exports.AbstractExtHostConsoleForwarder = AbstractExtHostConsoleForwarder;
    exports.AbstractExtHostConsoleForwarder = AbstractExtHostConsoleForwarder = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService)
    ], AbstractExtHostConsoleForwarder);
    const MAX_LENGTH = 100000;
    /**
     * Prevent circular stringify and convert arguments to real array
     */
    function safeStringifyArgumentsToArray(args, includeStack) {
        const argsArray = [];
        // Massage some arguments with special treatment
        if (args.length) {
            for (let i = 0; i < args.length; i++) {
                let arg = args[i];
                // Any argument of type 'undefined' needs to be specially treated because
                // JSON.stringify will simply ignore those. We replace them with the string
                // 'undefined' which is not 100% right, but good enough to be logged to console
                if (typeof arg === 'undefined') {
                    arg = 'undefined';
                }
                // Any argument that is an Error will be changed to be just the error stack/message
                // itself because currently cannot serialize the error over entirely.
                else if (arg instanceof Error) {
                    const errorObj = arg;
                    if (errorObj.stack) {
                        arg = errorObj.stack;
                    }
                    else {
                        arg = errorObj.toString();
                    }
                }
                argsArray.push(arg);
            }
        }
        // Add the stack trace as payload if we are told so. We remove the message and the 2 top frames
        // to start the stacktrace where the console message was being written
        if (includeStack) {
            const stack = new Error().stack;
            if (stack) {
                argsArray.push({ __$stack: stack.split('\n').slice(3).join('\n') });
            }
        }
        try {
            const res = (0, objects_1.safeStringify)(argsArray);
            if (res.length > MAX_LENGTH) {
                return 'Output omitted for a large object that exceeds the limits';
            }
            return res;
        }
        catch (error) {
            return `Output omitted for an object that cannot be inspected ('${error.toString()}')`;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvbnNvbGVGb3J3YXJkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RDb25zb2xlRm9yd2FyZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVF6RixJQUFlLCtCQUErQixHQUE5QyxNQUFlLCtCQUErQjtRQU1wRCxZQUNxQixVQUE4QixFQUN6QixRQUFpQztZQUUxRCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDN0UsSUFBSSxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQztZQUMxRCxJQUFJLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO1lBRXBELHFGQUFxRjtZQUNyRixJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVEOzs7Ozs7OztXQVFHO1FBQ0ssa0JBQWtCLENBQUMsTUFBbUQsRUFBRSxRQUE0QztZQUMzSCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7WUFDbEIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FB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