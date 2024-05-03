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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, configuration_1, instantiation_1, productService_1, telemetry_1, telemetryService_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IServerTelemetryService = exports.ServerNullTelemetryService = exports.ServerTelemetryService = void 0;
    let ServerTelemetryService = class ServerTelemetryService extends telemetryService_1.TelemetryService {
        constructor(config, injectedTelemetryLevel, _configurationService, _productService) {
            super(config, _configurationService, _productService);
            this._injectedTelemetryLevel = injectedTelemetryLevel;
        }
        publicLog(eventName, data) {
            if (this._injectedTelemetryLevel < 3 /* TelemetryLevel.USAGE */) {
                return;
            }
            return super.publicLog(eventName, data);
        }
        publicLog2(eventName, data) {
            return this.publicLog(eventName, data);
        }
        publicLogError(errorEventName, data) {
            if (this._injectedTelemetryLevel < 2 /* TelemetryLevel.ERROR */) {
                return Promise.resolve(undefined);
            }
            return super.publicLogError(errorEventName, data);
        }
        publicLogError2(eventName, data) {
            return this.publicLogError(eventName, data);
        }
        async updateInjectedTelemetryLevel(telemetryLevel) {
            if (telemetryLevel === undefined) {
                this._injectedTelemetryLevel = 0 /* TelemetryLevel.NONE */;
                throw new Error('Telemetry level cannot be undefined. This will cause infinite looping!');
            }
            // We always take the most restrictive level because we don't want multiple clients to connect and send data when one client does not consent
            this._injectedTelemetryLevel = this._injectedTelemetryLevel ? Math.min(this._injectedTelemetryLevel, telemetryLevel) : telemetryLevel;
            if (this._injectedTelemetryLevel === 0 /* TelemetryLevel.NONE */) {
                this.dispose();
            }
        }
    };
    exports.ServerTelemetryService = ServerTelemetryService;
    exports.ServerTelemetryService = ServerTelemetryService = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, productService_1.IProductService)
    ], ServerTelemetryService);
    exports.ServerNullTelemetryService = new class extends telemetryUtils_1.NullTelemetryServiceShape {
        async updateInjectedTelemetryLevel() { return; } // No-op, telemetry is already disabled
    };
    exports.IServerTelemetryService = (0, instantiation_1.refineServiceDecorator)(telemetry_1.ITelemetryService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyVGVsZW1ldHJ5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVsZW1ldHJ5L2NvbW1vbi9zZXJ2ZXJUZWxlbWV0cnlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLG1DQUFnQjtRQUszRCxZQUNDLE1BQStCLEVBQy9CLHNCQUFzQyxFQUNmLHFCQUE0QyxFQUNsRCxlQUFnQztZQUVqRCxLQUFLLENBQUMsTUFBTSxFQUFFLHFCQUFxQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxzQkFBc0IsQ0FBQztRQUN2RCxDQUFDO1FBRVEsU0FBUyxDQUFDLFNBQWlCLEVBQUUsSUFBcUI7WUFDMUQsSUFBSSxJQUFJLENBQUMsdUJBQXVCLCtCQUF1QixFQUFFLENBQUM7Z0JBQ3pELE9BQU87WUFDUixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRVEsVUFBVSxDQUFzRixTQUFpQixFQUFFLElBQWdDO1lBQzNKLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBa0MsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFUSxjQUFjLENBQUMsY0FBc0IsRUFBRSxJQUFxQjtZQUNwRSxJQUFJLElBQUksQ0FBQyx1QkFBdUIsK0JBQXVCLEVBQUUsQ0FBQztnQkFDekQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFUSxlQUFlLENBQXNGLFNBQWlCLEVBQUUsSUFBZ0M7WUFDaEssT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxJQUFrQyxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUVELEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxjQUE4QjtZQUNoRSxJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLHVCQUF1Qiw4QkFBc0IsQ0FBQztnQkFDbkQsTUFBTSxJQUFJLEtBQUssQ0FBQyx3RUFBd0UsQ0FBQyxDQUFDO1lBQzNGLENBQUM7WUFDRCw2SUFBNkk7WUFDN0ksSUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQztZQUN0SSxJQUFJLElBQUksQ0FBQyx1QkFBdUIsZ0NBQXdCLEVBQUUsQ0FBQztnQkFDMUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQWhEWSx3REFBc0I7cUNBQXRCLHNCQUFzQjtRQVFoQyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsZ0NBQWUsQ0FBQTtPQVRMLHNCQUFzQixDQWdEbEM7SUFFWSxRQUFBLDBCQUEwQixHQUFHLElBQUksS0FBTSxTQUFRLDBDQUF5QjtRQUNwRixLQUFLLENBQUMsNEJBQTRCLEtBQW9CLE9BQU8sQ0FBQyxDQUFDLENBQUMsdUNBQXVDO0tBQ3ZHLENBQUM7SUFFVyxRQUFBLHVCQUF1QixHQUFHLElBQUEsc0NBQXNCLEVBQTZDLDZCQUFpQixDQUFDLENBQUMifQ==