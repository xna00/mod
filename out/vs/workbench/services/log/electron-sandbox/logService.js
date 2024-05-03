/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/nls", "vs/workbench/services/log/common/logConstants", "vs/platform/log/common/logService"], function (require, exports, log_1, lifecycle_1, nls_1, logConstants_1, logService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLogService = void 0;
    class NativeLogService extends logService_1.LogService {
        constructor(loggerService, environmentService) {
            const disposables = new lifecycle_1.DisposableStore();
            const fileLogger = disposables.add(loggerService.createLogger(environmentService.logFile, { id: logConstants_1.windowLogId, name: (0, nls_1.localize)('rendererLog', "Window") }));
            let consoleLogger;
            if (environmentService.isExtensionDevelopment && !!environmentService.extensionTestsLocationURI) {
                // Extension development test CLI: forward everything to main side
                consoleLogger = loggerService.createConsoleMainLogger();
            }
            else {
                // Normal mode: Log to console
                consoleLogger = new log_1.ConsoleLogger(fileLogger.getLevel());
            }
            super(fileLogger, [consoleLogger]);
            this._register(disposables);
        }
    }
    exports.NativeLogService = NativeLogService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2xvZy9lbGVjdHJvbi1zYW5kYm94L2xvZ1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsZ0JBQWlCLFNBQVEsdUJBQVU7UUFFL0MsWUFBWSxhQUFrQyxFQUFFLGtCQUFzRDtZQUVyRyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUUxQyxNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLDBCQUFXLEVBQUUsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV6SixJQUFJLGFBQXNCLENBQUM7WUFDM0IsSUFBSSxrQkFBa0IsQ0FBQyxzQkFBc0IsSUFBSSxDQUFDLENBQUMsa0JBQWtCLENBQUMseUJBQXlCLEVBQUUsQ0FBQztnQkFDakcsa0VBQWtFO2dCQUNsRSxhQUFhLEdBQUcsYUFBYSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDekQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLDhCQUE4QjtnQkFDOUIsYUFBYSxHQUFHLElBQUksbUJBQWEsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBRUQsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFFbkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM3QixDQUFDO0tBQ0Q7SUFyQkQsNENBcUJDIn0=