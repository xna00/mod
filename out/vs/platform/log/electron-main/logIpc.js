/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map", "vs/base/common/uri", "vs/platform/log/common/log"], function (require, exports, map_1, uri_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoggerChannel = void 0;
    class LoggerChannel {
        constructor(loggerService) {
            this.loggerService = loggerService;
            this.loggers = new map_1.ResourceMap();
        }
        listen(_, event, windowId) {
            switch (event) {
                case 'onDidChangeLoggers': return windowId ? this.loggerService.getOnDidChangeLoggersEvent(windowId) : this.loggerService.onDidChangeLoggers;
                case 'onDidChangeLogLevel': return windowId ? this.loggerService.getOnDidChangeLogLevelEvent(windowId) : this.loggerService.onDidChangeLogLevel;
                case 'onDidChangeVisibility': return windowId ? this.loggerService.getOnDidChangeVisibilityEvent(windowId) : this.loggerService.onDidChangeVisibility;
            }
            throw new Error(`Event not found: ${event}`);
        }
        async call(_, command, arg) {
            switch (command) {
                case 'createLogger':
                    this.createLogger(uri_1.URI.revive(arg[0]), arg[1], arg[2]);
                    return;
                case 'log': return this.log(uri_1.URI.revive(arg[0]), arg[1]);
                case 'consoleLog': return this.consoleLog(arg[0], arg[1]);
                case 'setLogLevel': return (0, log_1.isLogLevel)(arg[0]) ? this.loggerService.setLogLevel(arg[0]) : this.loggerService.setLogLevel(uri_1.URI.revive(arg[0]), arg[1]);
                case 'setVisibility': return this.loggerService.setVisibility(uri_1.URI.revive(arg[0]), arg[1]);
                case 'registerLogger': return this.loggerService.registerLogger({ ...arg[0], resource: uri_1.URI.revive(arg[0].resource) }, arg[1]);
                case 'deregisterLogger': return this.loggerService.deregisterLogger(uri_1.URI.revive(arg[0]));
            }
            throw new Error(`Call not found: ${command}`);
        }
        createLogger(file, options, windowId) {
            this.loggers.set(file, this.loggerService.createLogger(file, options, windowId));
        }
        consoleLog(level, args) {
            let consoleFn = console.log;
            switch (level) {
                case log_1.LogLevel.Error:
                    consoleFn = console.error;
                    break;
                case log_1.LogLevel.Warning:
                    consoleFn = console.warn;
                    break;
                case log_1.LogLevel.Info:
                    consoleFn = console.info;
                    break;
            }
            consoleFn.call(console, ...args);
        }
        log(file, messages) {
            const logger = this.loggers.get(file);
            if (!logger) {
                throw new Error('Create the logger before logging');
            }
            for (const [level, message] of messages) {
                (0, log_1.log)(logger, level, message);
            }
        }
    }
    exports.LoggerChannel = LoggerChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9sb2cvZWxlY3Ryb24tbWFpbi9sb2dJcGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsYUFBYTtRQUl6QixZQUE2QixhQUFpQztZQUFqQyxrQkFBYSxHQUFiLGFBQWEsQ0FBb0I7WUFGN0MsWUFBTyxHQUFHLElBQUksaUJBQVcsRUFBVyxDQUFDO1FBRVksQ0FBQztRQUVuRSxNQUFNLENBQUMsQ0FBVSxFQUFFLEtBQWEsRUFBRSxRQUFpQjtZQUNsRCxRQUFRLEtBQUssRUFBRSxDQUFDO2dCQUNmLEtBQUssb0JBQW9CLENBQUMsQ0FBQyxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQztnQkFDN0ksS0FBSyxxQkFBcUIsQ0FBQyxDQUFDLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLDJCQUEyQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDO2dCQUNoSixLQUFLLHVCQUF1QixDQUFDLENBQUMsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsNkJBQTZCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMscUJBQXFCLENBQUM7WUFDdkosQ0FBQztZQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFJLENB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