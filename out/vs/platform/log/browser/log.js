/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/window", "vs/base/common/resources", "vs/platform/log/common/log"], function (require, exports, window_1, resources_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConsoleLogInAutomationLogger = void 0;
    exports.getLogs = getLogs;
    /**
     * Only used in browser contexts where the log files are not stored on disk
     * but in IndexedDB. A method to get all logs with their contents so that
     * CI automation can persist them.
     */
    async function getLogs(fileService, environmentService) {
        const result = [];
        await doGetLogs(fileService, result, environmentService.logsHome, environmentService.logsHome);
        return result;
    }
    async function doGetLogs(fileService, logs, curFolder, logsHome) {
        const stat = await fileService.resolve(curFolder);
        for (const { resource, isDirectory } of stat.children || []) {
            if (isDirectory) {
                await doGetLogs(fileService, logs, resource, logsHome);
            }
            else {
                const contents = (await fileService.readFile(resource)).value.toString();
                if (contents) {
                    const path = (0, resources_1.relativePath)(logsHome, resource);
                    if (path) {
                        logs.push({ relativePath: path, contents });
                    }
                }
            }
        }
    }
    function logLevelToString(level) {
        switch (level) {
            case log_1.LogLevel.Trace: return 'trace';
            case log_1.LogLevel.Debug: return 'debug';
            case log_1.LogLevel.Info: return 'info';
            case log_1.LogLevel.Warning: return 'warn';
            case log_1.LogLevel.Error: return 'error';
        }
        return 'info';
    }
    /**
     * A logger that is used when VSCode is running in the web with
     * an automation such as playwright. We expect a global codeAutomationLog
     * to be defined that we can use to log to.
     */
    class ConsoleLogInAutomationLogger extends log_1.AdapterLogger {
        constructor(logLevel = log_1.DEFAULT_LOG_LEVEL) {
            super({ log: (level, args) => this.consoleLog(logLevelToString(level), args) }, logLevel);
        }
        consoleLog(type, args) {
            const automatedWindow = window_1.mainWindow;
            if (typeof automatedWindow.codeAutomationLog === 'function') {
                try {
                    automatedWindow.codeAutomationLog(type, args);
                }
                catch (err) {
                    // see https://github.com/microsoft/vscode-test-web/issues/69
                    console.error('Problems writing to codeAutomationLog', err);
                }
            }
        }
    }
    exports.ConsoleLogInAutomationLogger = ConsoleLogInAutomationLogger;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9sb2cvYnJvd3Nlci9sb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0JoRywwQkFNQztJQVhEOzs7O09BSUc7SUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLFdBQXlCLEVBQUUsa0JBQXVDO1FBQy9GLE1BQU0sTUFBTSxHQUFlLEVBQUUsQ0FBQztRQUU5QixNQUFNLFNBQVMsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUUvRixPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRCxLQUFLLFVBQVUsU0FBUyxDQUFDLFdBQXlCLEVBQUUsSUFBZ0IsRUFBRSxTQUFjLEVBQUUsUUFBYTtRQUNsRyxNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFbEQsS0FBSyxNQUFNLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxFQUFFLENBQUM7WUFDN0QsSUFBSSxXQUFXLEVBQUUsQ0FBQztnQkFDakIsTUFBTSxTQUFTLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDeEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sUUFBUSxHQUFHLENBQUMsTUFBTSxXQUFXLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN6RSxJQUFJLFFBQVEsRUFBRSxDQUFDO29CQUNkLE1BQU0sSUFBSSxHQUFHLElBQUEsd0JBQVksRUFBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzlDLElBQUksSUFBSSxFQUFFLENBQUM7d0JBQ1YsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDN0MsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7SUFDRixDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFlO1FBQ3hDLFFBQVEsS0FBSyxFQUFFLENBQUM7WUFDZixLQUFLLGNBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLE9BQU8sQ0FBQztZQUNwQyxLQUFLLGNBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLE9BQU8sQ0FBQztZQUNwQyxLQUFLLGNBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQztZQUNsQyxLQUFLLGNBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQztZQUNyQyxLQUFLLGNBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLE9BQU8sQ0FBQztRQUNyQyxDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE1BQWEsNEJBQTZCLFNBQVEsbUJBQWE7UUFJOUQsWUFBWSxXQUFxQix1QkFBaUI7WUFDakQsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzNGLENBQUM7UUFFTyxVQUFVLENBQUMsSUFBWSxFQUFFLElBQVc7WUFDM0MsTUFBTSxlQUFlLEdBQUcsbUJBQXlDLENBQUM7WUFDbEUsSUFBSSxPQUFPLGVBQWUsQ0FBQyxpQkFBaUIsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDN0QsSUFBSSxDQUFDO29CQUNKLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQy9DLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCw2REFBNkQ7b0JBQzdELE9BQU8sQ0FBQyxLQUFLLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzdELENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBbkJELG9FQW1CQyJ9