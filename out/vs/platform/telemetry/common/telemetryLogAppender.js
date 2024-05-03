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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, lifecycle_1, nls_1, environment_1, log_1, productService_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryLogAppender = void 0;
    let TelemetryLogAppender = class TelemetryLogAppender extends lifecycle_1.Disposable {
        constructor(logService, loggerService, environmentService, productService, prefix = '') {
            super();
            this.prefix = prefix;
            const logger = loggerService.getLogger(telemetryUtils_1.telemetryLogId);
            if (logger) {
                this.logger = this._register(logger);
            }
            else {
                // Not a perfect check, but a nice way to indicate if we only have logging enabled for debug purposes and nothing is actually being sent
                const justLoggingAndNotSending = (0, telemetryUtils_1.isLoggingOnly)(productService, environmentService);
                const logSuffix = justLoggingAndNotSending ? ' (Not Sent)' : '';
                const isVisible = () => (0, telemetryUtils_1.supportsTelemetry)(productService, environmentService) && logService.getLevel() === log_1.LogLevel.Trace;
                this.logger = this._register(loggerService.createLogger(telemetryUtils_1.telemetryLogId, { name: (0, nls_1.localize)('telemetryLog', "Telemetry{0}", logSuffix), hidden: !isVisible() }));
                this._register(logService.onDidChangeLogLevel(() => loggerService.setVisibility(telemetryUtils_1.telemetryLogId, isVisible())));
                this.logger.info('Below are logs for every telemetry event sent from VS Code once the log level is set to trace.');
                this.logger.info('===========================================================');
            }
        }
        flush() {
            return Promise.resolve(undefined);
        }
        log(eventName, data) {
            this.logger.trace(`${this.prefix}telemetry/${eventName}`, (0, telemetryUtils_1.validateTelemetryData)(data));
        }
    };
    exports.TelemetryLogAppender = TelemetryLogAppender;
    exports.TelemetryLogAppender = TelemetryLogAppender = __decorate([
        __param(0, log_1.ILogService),
        __param(1, log_1.ILoggerService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, productService_1.IProductService)
    ], TelemetryLogAppender);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5TG9nQXBwZW5kZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9jb21tb24vdGVsZW1ldHJ5TG9nQXBwZW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU3pGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFJbkQsWUFDYyxVQUF1QixFQUNwQixhQUE2QixFQUN4QixrQkFBdUMsRUFDM0MsY0FBK0IsRUFDL0IsU0FBaUIsRUFBRTtZQUVwQyxLQUFLLEVBQUUsQ0FBQztZQUZTLFdBQU0sR0FBTixNQUFNLENBQWE7WUFJcEMsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQywrQkFBYyxDQUFDLENBQUM7WUFDdkQsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLHdJQUF3STtnQkFDeEksTUFBTSx3QkFBd0IsR0FBRyxJQUFBLDhCQUFhLEVBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7Z0JBQ25GLE1BQU0sU0FBUyxHQUFHLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDaEUsTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBQSxrQ0FBaUIsRUFBQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxVQUFVLENBQUMsUUFBUSxFQUFFLEtBQUssY0FBUSxDQUFDLEtBQUssQ0FBQztnQkFDMUgsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsK0JBQWMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsY0FBYyxFQUFFLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5SixJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLCtCQUFjLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9HLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdHQUFnRyxDQUFDLENBQUM7Z0JBQ25ILElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDZEQUE2RCxDQUFDLENBQUM7WUFDakYsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLO1lBQ0osT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxHQUFHLENBQUMsU0FBaUIsRUFBRSxJQUFTO1lBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sYUFBYSxTQUFTLEVBQUUsRUFBRSxJQUFBLHNDQUFxQixFQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDeEYsQ0FBQztLQUNELENBQUE7SUFuQ1ksb0RBQW9CO21DQUFwQixvQkFBb0I7UUFLOUIsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSxvQkFBYyxDQUFBO1FBQ2QsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLGdDQUFlLENBQUE7T0FSTCxvQkFBb0IsQ0FtQ2hDIn0=