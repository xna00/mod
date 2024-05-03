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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/nls", "vs/platform/log/common/log", "vs/platform/workspace/common/workspace", "vs/platform/environment/common/environment", "vs/base/common/resources"], function (require, exports, lifecycle_1, event_1, nls_1, log_1, workspace_1, environment_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLogService = void 0;
    let TerminalLogService = class TerminalLogService extends lifecycle_1.Disposable {
        get onDidChangeLogLevel() { return this._logger.onDidChangeLogLevel; }
        constructor(_loggerService, workspaceContextService, environmentService) {
            super();
            this._loggerService = _loggerService;
            this._logger = this._loggerService.createLogger((0, resources_1.joinPath)(environmentService.logsHome, 'terminal.log'), { id: 'terminal', name: (0, nls_1.localize)('terminalLoggerName', 'Terminal') });
            this._register(event_1.Event.runAndSubscribe(workspaceContextService.onDidChangeWorkspaceFolders, () => {
                this._workspaceId = workspaceContextService.getWorkspace().id.substring(0, 7);
            }));
        }
        getLevel() { return this._logger.getLevel(); }
        setLevel(level) { this._logger.setLevel(level); }
        flush() { this._logger.flush(); }
        trace(message, ...args) { this._logger.trace(this._formatMessage(message), args); }
        debug(message, ...args) { this._logger.debug(this._formatMessage(message), args); }
        info(message, ...args) { this._logger.info(this._formatMessage(message), args); }
        warn(message, ...args) { this._logger.warn(this._formatMessage(message), args); }
        error(message, ...args) {
            if (message instanceof Error) {
                this._logger.error(this._formatMessage(''), message, args);
                return;
            }
            this._logger.error(this._formatMessage(message), args);
        }
        _formatMessage(message) {
            if (this._logger.getLevel() === log_1.LogLevel.Trace) {
                return `[${this._workspaceId}] ${message}`;
            }
            return message;
        }
    };
    exports.TerminalLogService = TerminalLogService;
    exports.TerminalLogService = TerminalLogService = __decorate([
        __param(0, log_1.ILoggerService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, environment_1.IEnvironmentService)
    ], TerminalLogService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMb2dTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vdGVybWluYWxMb2dTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVd6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLHNCQUFVO1FBUWpELElBQUksbUJBQW1CLEtBQXNCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFFdkYsWUFDa0MsY0FBOEIsRUFDckMsdUJBQWlELEVBQ3RELGtCQUF1QztZQUU1RCxLQUFLLEVBQUUsQ0FBQztZQUp5QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFLL0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxJQUFBLG9CQUFRLEVBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzdLLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLGVBQWUsQ0FBQyx1QkFBdUIsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7Z0JBQzlGLElBQUksQ0FBQyxZQUFZLEdBQUcsdUJBQXVCLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0UsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxRQUFRLEtBQWUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN4RCxRQUFRLENBQUMsS0FBZSxJQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRSxLQUFLLEtBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFdkMsS0FBSyxDQUFDLE9BQWUsRUFBRSxHQUFHLElBQVcsSUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RyxLQUFLLENBQUMsT0FBZSxFQUFFLEdBQUcsSUFBVyxJQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hHLElBQUksQ0FBQyxPQUFlLEVBQUUsR0FBRyxJQUFXLElBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEcsSUFBSSxDQUFDLE9BQWUsRUFBRSxHQUFHLElBQVcsSUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RyxLQUFLLENBQUMsT0FBdUIsRUFBRSxHQUFHLElBQVc7WUFDNUMsSUFBSSxPQUFPLFlBQVksS0FBSyxFQUFFLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMzRCxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVPLGNBQWMsQ0FBQyxPQUFlO1lBQ3JDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsS0FBSyxjQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2hELE9BQU8sSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLE9BQU8sRUFBRSxDQUFDO1lBQzVDLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO0tBQ0QsQ0FBQTtJQTVDWSxnREFBa0I7aUNBQWxCLGtCQUFrQjtRQVc1QixXQUFBLG9CQUFjLENBQUE7UUFDZCxXQUFBLG9DQUF3QixDQUFBO1FBQ3hCLFdBQUEsaUNBQW1CLENBQUE7T0FiVCxrQkFBa0IsQ0E0QzlCIn0=