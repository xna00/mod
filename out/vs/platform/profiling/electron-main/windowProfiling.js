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
define(["require", "exports", "vs/base/common/async", "vs/platform/log/common/log"], function (require, exports, async_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowProfiler = void 0;
    let WindowProfiler = class WindowProfiler {
        constructor(_window, _sessionId, _logService) {
            this._window = _window;
            this._sessionId = _sessionId;
            this._logService = _logService;
        }
        async inspect(duration) {
            await this._connect();
            const inspector = this._window.webContents.debugger;
            await inspector.sendCommand('Profiler.start');
            this._logService.warn('[perf] profiling STARTED', this._sessionId);
            await (0, async_1.timeout)(duration);
            const data = await inspector.sendCommand('Profiler.stop');
            this._logService.warn('[perf] profiling DONE', this._sessionId);
            await this._disconnect();
            return data.profile;
        }
        async _connect() {
            const inspector = this._window.webContents.debugger;
            inspector.attach();
            await inspector.sendCommand('Profiler.enable');
        }
        async _disconnect() {
            const inspector = this._window.webContents.debugger;
            await inspector.sendCommand('Profiler.disable');
            inspector.detach();
        }
    };
    exports.WindowProfiler = WindowProfiler;
    exports.WindowProfiler = WindowProfiler = __decorate([
        __param(2, log_1.ILogService)
    ], WindowProfiler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93UHJvZmlsaW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9wcm9maWxpbmcvZWxlY3Ryb24tbWFpbi93aW5kb3dQcm9maWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWM7UUFFMUIsWUFDa0IsT0FBc0IsRUFDdEIsVUFBa0IsRUFDTCxXQUF3QjtZQUZyQyxZQUFPLEdBQVAsT0FBTyxDQUFlO1lBQ3RCLGVBQVUsR0FBVixVQUFVLENBQVE7WUFDTCxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtRQUNuRCxDQUFDO1FBRUwsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFnQjtZQUU3QixNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUV0QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7WUFDcEQsTUFBTSxTQUFTLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sSUFBQSxlQUFPLEVBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEIsTUFBTSxJQUFJLEdBQWtCLE1BQU0sU0FBUyxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUN6RSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFaEUsTUFBTSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDekIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3JCLENBQUM7UUFFTyxLQUFLLENBQUMsUUFBUTtZQUNyQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7WUFDcEQsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ25CLE1BQU0sU0FBUyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFTyxLQUFLLENBQUMsV0FBVztZQUN4QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7WUFDcEQsTUFBTSxTQUFTLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDaEQsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3BCLENBQUM7S0FDRCxDQUFBO0lBbENZLHdDQUFjOzZCQUFkLGNBQWM7UUFLeEIsV0FBQSxpQkFBVyxDQUFBO09BTEQsY0FBYyxDQWtDMUIifQ==