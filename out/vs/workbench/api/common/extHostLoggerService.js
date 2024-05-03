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
define(["require", "exports", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService", "vs/base/common/uri", "vs/base/common/marshalling"], function (require, exports, log_1, extHost_protocol_1, extHostInitDataService_1, extHostRpcService_1, uri_1, marshalling_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLoggerService = void 0;
    let ExtHostLoggerService = class ExtHostLoggerService extends log_1.AbstractLoggerService {
        constructor(rpc, initData) {
            super(initData.logLevel, initData.logsLocation, initData.loggers.map(logger => (0, marshalling_1.revive)(logger)));
            this._proxy = rpc.getProxy(extHost_protocol_1.MainContext.MainThreadLogger);
        }
        $setLogLevel(logLevel, resource) {
            if (resource) {
                this.setLogLevel(uri_1.URI.revive(resource), logLevel);
            }
            else {
                this.setLogLevel(logLevel);
            }
        }
        setVisibility(resource, visibility) {
            super.setVisibility(resource, visibility);
            this._proxy.$setVisibility(resource, visibility);
        }
        doCreateLogger(resource, logLevel, options) {
            return new Logger(this._proxy, resource, logLevel, options);
        }
    };
    exports.ExtHostLoggerService = ExtHostLoggerService;
    exports.ExtHostLoggerService = ExtHostLoggerService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService)
    ], ExtHostLoggerService);
    class Logger extends log_1.AbstractMessageLogger {
        constructor(proxy, file, logLevel, loggerOptions) {
            super(loggerOptions?.logLevel === 'always');
            this.proxy = proxy;
            this.file = file;
            this.isLoggerCreated = false;
            this.buffer = [];
            this.setLevel(logLevel);
            this.proxy.$createLogger(file, loggerOptions)
                .then(() => {
                this.doLog(this.buffer);
                this.isLoggerCreated = true;
            });
        }
        log(level, message) {
            const messages = [[level, message]];
            if (this.isLoggerCreated) {
                this.doLog(messages);
            }
            else {
                this.buffer.push(...messages);
            }
        }
        doLog(messages) {
            this.proxy.$log(this.file, messages);
        }
        flush() {
            this.proxy.$flush(this.file);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExvZ2dlclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RMb2dnZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLDJCQUFxQjtRQUs5RCxZQUNxQixHQUF1QixFQUNsQixRQUFpQztZQUUxRCxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBQSxvQkFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRyxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFRCxZQUFZLENBQUMsUUFBa0IsRUFBRSxRQUF3QjtZQUN4RCxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNsRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1QixDQUFDO1FBQ0YsQ0FBQztRQUVRLGFBQWEsQ0FBQyxRQUFhLEVBQUUsVUFBbUI7WUFDeEQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFUyxjQUFjLENBQUMsUUFBYSxFQUFFLFFBQWtCLEVBQUUsT0FBd0I7WUFDbkYsT0FBTyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0QsQ0FBQztLQUNELENBQUE7SUE3Qlksb0RBQW9CO21DQUFwQixvQkFBb0I7UUFNOUIsV0FBQSxzQ0FBa0IsQ0FBQTtRQUNsQixXQUFBLGdEQUF1QixDQUFBO09BUGIsb0JBQW9CLENBNkJoQztJQUVELE1BQU0sTUFBTyxTQUFRLDJCQUFxQjtRQUt6QyxZQUNrQixLQUE0QixFQUM1QixJQUFTLEVBQzFCLFFBQWtCLEVBQ2xCLGFBQThCO1lBRTlCLEtBQUssQ0FBQyxhQUFhLEVBQUUsUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDO1lBTDNCLFVBQUssR0FBTCxLQUFLLENBQXVCO1lBQzVCLFNBQUksR0FBSixJQUFJLENBQUs7WUFMbkIsb0JBQWUsR0FBWSxLQUFLLENBQUM7WUFDakMsV0FBTSxHQUF5QixFQUFFLENBQUM7WUFTekMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDO2lCQUMzQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNWLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN4QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztZQUM3QixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFUyxHQUFHLENBQUMsS0FBZSxFQUFFLE9BQWU7WUFDN0MsTUFBTSxRQUFRLEdBQXlCLENBQUMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUMxRCxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQztZQUMvQixDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxRQUE4QjtZQUMzQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFUSxLQUFLO1lBQ2IsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLENBQUM7S0FDRCJ9