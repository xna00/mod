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
define(["require", "exports", "vs/base/common/path", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/node/ps", "vs/platform/log/common/log"], function (require, exports, path_1, decorators_1, event_1, lifecycle_1, ps_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChildProcessMonitor = exports.ignoreProcessNames = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The amount of time to throttle checks when the process receives output.
         */
        Constants[Constants["InactiveThrottleDuration"] = 5000] = "InactiveThrottleDuration";
        /**
         * The amount of time to debounce check when the process receives input.
         */
        Constants[Constants["ActiveDebounceDuration"] = 1000] = "ActiveDebounceDuration";
    })(Constants || (Constants = {}));
    exports.ignoreProcessNames = [];
    /**
     * Monitors a process for child processes, checking at differing times depending on input and output
     * calls into the monitor.
     */
    let ChildProcessMonitor = class ChildProcessMonitor extends lifecycle_1.Disposable {
        set hasChildProcesses(value) {
            if (this._hasChildProcesses !== value) {
                this._hasChildProcesses = value;
                this._logService.debug('ChildProcessMonitor: Has child processes changed', value);
                this._onDidChangeHasChildProcesses.fire(value);
            }
        }
        /**
         * Whether the process has child processes.
         */
        get hasChildProcesses() { return this._hasChildProcesses; }
        constructor(_pid, _logService) {
            super();
            this._pid = _pid;
            this._logService = _logService;
            this._hasChildProcesses = false;
            this._onDidChangeHasChildProcesses = this._register(new event_1.Emitter());
            /**
             * An event that fires when whether the process has child processes changes.
             */
            this.onDidChangeHasChildProcesses = this._onDidChangeHasChildProcesses.event;
        }
        /**
         * Input was triggered on the process.
         */
        handleInput() {
            this._refreshActive();
        }
        /**
         * Output was triggered on the process.
         */
        handleOutput() {
            this._refreshInactive();
        }
        async _refreshActive() {
            if (this._store.isDisposed) {
                return;
            }
            try {
                const processItem = await (0, ps_1.listProcesses)(this._pid);
                this.hasChildProcesses = this._processContainsChildren(processItem);
            }
            catch (e) {
                this._logService.debug('ChildProcessMonitor: Fetching process tree failed', e);
            }
        }
        _refreshInactive() {
            this._refreshActive();
        }
        _processContainsChildren(processItem) {
            // No child processes
            if (!processItem.children) {
                return false;
            }
            // A single child process, handle special cases
            if (processItem.children.length === 1) {
                const item = processItem.children[0];
                let cmd;
                if (item.cmd.startsWith(`"`)) {
                    cmd = item.cmd.substring(1, item.cmd.indexOf(`"`, 1));
                }
                else {
                    const spaceIndex = item.cmd.indexOf(` `);
                    if (spaceIndex === -1) {
                        cmd = item.cmd;
                    }
                    else {
                        cmd = item.cmd.substring(0, spaceIndex);
                    }
                }
                return exports.ignoreProcessNames.indexOf((0, path_1.parse)(cmd).name) === -1;
            }
            // Fallback, count child processes
            return processItem.children.length > 0;
        }
    };
    exports.ChildProcessMonitor = ChildProcessMonitor;
    __decorate([
        (0, decorators_1.debounce)(1000 /* Constants.ActiveDebounceDuration */)
    ], ChildProcessMonitor.prototype, "_refreshActive", null);
    __decorate([
        (0, decorators_1.throttle)(5000 /* Constants.InactiveThrottleDuration */)
    ], ChildProcessMonitor.prototype, "_refreshInactive", null);
    exports.ChildProcessMonitor = ChildProcessMonitor = __decorate([
        __param(1, log_1.ILogService)
    ], ChildProcessMonitor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hpbGRQcm9jZXNzTW9uaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvbm9kZS9jaGlsZFByb2Nlc3NNb25pdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVVoRyxJQUFXLFNBU1Y7SUFURCxXQUFXLFNBQVM7UUFDbkI7O1dBRUc7UUFDSCxvRkFBK0IsQ0FBQTtRQUMvQjs7V0FFRztRQUNILGdGQUE2QixDQUFBO0lBQzlCLENBQUMsRUFUVSxTQUFTLEtBQVQsU0FBUyxRQVNuQjtJQUVZLFFBQUEsa0JBQWtCLEdBQWEsRUFBRSxDQUFDO0lBRS9DOzs7T0FHRztJQUNJLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7UUFFbEQsSUFBWSxpQkFBaUIsQ0FBQyxLQUFjO1lBQzNDLElBQUksSUFBSSxDQUFDLGtCQUFrQixLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUN2QyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsS0FBSyxDQUFDO2dCQUNoQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxrREFBa0QsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDbEYsSUFBSSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoRCxDQUFDO1FBQ0YsQ0FBQztRQUNEOztXQUVHO1FBQ0gsSUFBSSxpQkFBaUIsS0FBYyxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFRcEUsWUFDa0IsSUFBWSxFQUNoQixXQUF5QztZQUV0RCxLQUFLLEVBQUUsQ0FBQztZQUhTLFNBQUksR0FBSixJQUFJLENBQVE7WUFDQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQXJCL0MsdUJBQWtCLEdBQVksS0FBSyxDQUFD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