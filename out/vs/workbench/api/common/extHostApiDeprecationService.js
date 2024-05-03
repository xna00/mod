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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService"], function (require, exports, instantiation_1, log_1, extHostProtocol, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullApiDeprecationService = exports.ExtHostApiDeprecationService = exports.IExtHostApiDeprecationService = void 0;
    exports.IExtHostApiDeprecationService = (0, instantiation_1.createDecorator)('IExtHostApiDeprecationService');
    let ExtHostApiDeprecationService = class ExtHostApiDeprecationService {
        constructor(rpc, _extHostLogService) {
            this._extHostLogService = _extHostLogService;
            this._reportedUsages = new Set();
            this._telemetryShape = rpc.getProxy(extHostProtocol.MainContext.MainThreadTelemetry);
        }
        report(apiId, extension, migrationSuggestion) {
            const key = this.getUsageKey(apiId, extension);
            if (this._reportedUsages.has(key)) {
                return;
            }
            this._reportedUsages.add(key);
            if (extension.isUnderDevelopment) {
                this._extHostLogService.warn(`[Deprecation Warning] '${apiId}' is deprecated. ${migrationSuggestion}`);
            }
            this._telemetryShape.$publicLog2('extHostDeprecatedApiUsage', {
                extensionId: extension.identifier.value,
                apiId: apiId,
            });
        }
        getUsageKey(apiId, extension) {
            return `${apiId}-${extension.identifier.value}`;
        }
    };
    exports.ExtHostApiDeprecationService = ExtHostApiDeprecationService;
    exports.ExtHostApiDeprecationService = ExtHostApiDeprecationService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService)
    ], ExtHostApiDeprecationService);
    exports.NullApiDeprecationService = Object.freeze(new class {
        report(_apiId, _extension, _warningMessage) {
            // noop
        }
    }());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEFwaURlcHJlY2F0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdEFwaURlcHJlY2F0aW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjbkYsUUFBQSw2QkFBNkIsR0FBRyxJQUFBLCtCQUFlLEVBQWdDLCtCQUErQixDQUFDLENBQUM7SUFFdEgsSUFBTSw0QkFBNEIsR0FBbEMsTUFBTSw0QkFBNEI7UUFPeEMsWUFDcUIsR0FBdUIsRUFDOUIsa0JBQWdEO1lBQS9CLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBYTtZQUw3QyxvQkFBZSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFPcEQsSUFBSSxDQUFDLGVBQWUsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUN0RixDQUFDO1FBRU0sTUFBTSxDQUFDLEtBQWEsRUFBRSxTQUFnQyxFQUFFLG1CQUEyQjtZQUN6RixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMvQyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFOUIsSUFBSSxTQUFTLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQywwQkFBMEIsS0FBSyxvQkFBb0IsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQ3hHLENBQUM7WUFZRCxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBaUQsMkJBQTJCLEVBQUU7Z0JBQzdHLFdBQVcsRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLEtBQUs7Z0JBQ3ZDLEtBQUssRUFBRSxLQUFLO2FBQ1osQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLFdBQVcsQ0FBQyxLQUFhLEVBQUUsU0FBZ0M7WUFDbEUsT0FBTyxHQUFHLEtBQUssSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2pELENBQUM7S0FDRCxDQUFBO0lBNUNZLG9FQUE0QjsyQ0FBNUIsNEJBQTRCO1FBUXRDLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSxpQkFBVyxDQUFBO09BVEQsNEJBQTRCLENBNEN4QztJQUdZLFFBQUEseUJBQXlCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJO1FBR25ELE1BQU0sQ0FBQyxNQUFjLEVBQUUsVUFBaUMsRUFBRSxlQUF1QjtZQUN2RixPQUFPO1FBQ1IsQ0FBQztLQUNELEVBQUUsQ0FBQyxDQUFDIn0=