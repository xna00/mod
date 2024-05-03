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
define(["require", "exports", "vs/base/common/resources", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/workbench/contrib/editSessions/common/editSessions"], function (require, exports, resources_1, nls_1, environment_1, log_1, editSessions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditSessionsLogService = void 0;
    let EditSessionsLogService = class EditSessionsLogService extends log_1.AbstractLogger {
        constructor(loggerService, environmentService) {
            super();
            this.logger = this._register(loggerService.createLogger((0, resources_1.joinPath)(environmentService.logsHome, `${editSessions_1.editSessionsLogId}.log`), { id: editSessions_1.editSessionsLogId, name: (0, nls_1.localize)('cloudChangesLog', "Cloud Changes") }));
        }
        trace(message, ...args) {
            this.logger.trace(message, ...args);
        }
        debug(message, ...args) {
            this.logger.debug(message, ...args);
        }
        info(message, ...args) {
            this.logger.info(message, ...args);
        }
        warn(message, ...args) {
            this.logger.warn(message, ...args);
        }
        error(message, ...args) {
            this.logger.error(message, ...args);
        }
        flush() {
            this.logger.flush();
        }
    };
    exports.EditSessionsLogService = EditSessionsLogService;
    exports.EditSessionsLogService = EditSessionsLogService = __decorate([
        __param(0, log_1.ILoggerService),
        __param(1, environment_1.IEnvironmentService)
    ], EditSessionsLogService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25zTG9nU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZWRpdFNlc3Npb25zL2NvbW1vbi9lZGl0U2Vzc2lvbnNMb2dTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVF6RixJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLG9CQUFjO1FBS3pELFlBQ2lCLGFBQTZCLEVBQ3hCLGtCQUF1QztZQUU1RCxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUEsb0JBQVEsRUFBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyxnQ0FBaUIsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsZ0NBQWlCLEVBQUUsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVNLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBZSxFQUFFLEdBQUcsSUFBVztZQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQWUsRUFBRSxHQUFHLElBQVc7WUFDcEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELElBQUksQ0FBQyxPQUFlLEVBQUUsR0FBRyxJQUFXO1lBQ25DLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxJQUFJLENBQUMsT0FBZSxFQUFFLEdBQUcsSUFBVztZQUNuQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQXVCLEVBQUUsR0FBRyxJQUFXO1lBQzVDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDO0tBQ0QsQ0FBQTtJQXBDWSx3REFBc0I7cUNBQXRCLHNCQUFzQjtRQU1oQyxXQUFBLG9CQUFjLENBQUE7UUFDZCxXQUFBLGlDQUFtQixDQUFBO09BUFQsc0JBQXNCLENBb0NsQyJ9