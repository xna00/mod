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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol"], function (require, exports, lifecycle_1, configuration_1, environment_1, productService_1, telemetry_1, telemetryUtils_1, extHostCustomers_1, extHost_protocol_1) {
    "use strict";
    var MainThreadTelemetry_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTelemetry = void 0;
    let MainThreadTelemetry = class MainThreadTelemetry extends lifecycle_1.Disposable {
        static { MainThreadTelemetry_1 = this; }
        static { this._name = 'pluginHostTelemetry'; }
        constructor(extHostContext, _telemetryService, _configurationService, _environmentService, _productService) {
            super();
            this._telemetryService = _telemetryService;
            this._configurationService = _configurationService;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTelemetry);
            if ((0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService)) {
                this._register(this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration(telemetry_1.TELEMETRY_SETTING_ID) || e.affectsConfiguration(telemetry_1.TELEMETRY_OLD_SETTING_ID)) {
                        this._proxy.$onDidChangeTelemetryLevel(this.telemetryLevel);
                    }
                }));
            }
            this._proxy.$initializeTelemetryLevel(this.telemetryLevel, (0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService), this._productService.enabledTelemetryLevels);
        }
        get telemetryLevel() {
            if (!(0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService)) {
                return 0 /* TelemetryLevel.NONE */;
            }
            return this._telemetryService.telemetryLevel;
        }
        $publicLog(eventName, data = Object.create(null)) {
            // __GDPR__COMMON__ "pluginHostTelemetry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            data[MainThreadTelemetry_1._name] = true;
            this._telemetryService.publicLog(eventName, data);
        }
        $publicLog2(eventName, data) {
            this.$publicLog(eventName, data);
        }
    };
    exports.MainThreadTelemetry = MainThreadTelemetry;
    exports.MainThreadTelemetry = MainThreadTelemetry = MainThreadTelemetry_1 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTelemetry),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, productService_1.IProductService)
    ], MainThreadTelemetry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRlbGVtZXRyeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRUZWxlbWV0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWF6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVOztpQkFHMUIsVUFBSyxHQUFHLHFCQUFxQixBQUF4QixDQUF5QjtRQUV0RCxZQUNDLGNBQStCLEVBQ0ssaUJBQW9DLEVBQ2hDLHFCQUE0QyxFQUM5QyxtQkFBd0MsRUFDNUMsZUFBZ0M7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFMNEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNoQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzlDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDNUMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBSWxFLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFdkUsSUFBSSxJQUFBLGtDQUFpQixFQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsQ0FBQztnQkFDdkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ3RFLElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLGdDQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLG9DQUF3QixDQUFDLEVBQUUsQ0FBQzt3QkFDdEcsSUFBSSxDQUFDLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQzdELENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBQSxrQ0FBaUIsRUFBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUM1SyxDQUFDO1FBRUQsSUFBWSxjQUFjO1lBQ3pCLElBQUksQ0FBQyxJQUFBLGtDQUFpQixFQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsQ0FBQztnQkFDeEUsbUNBQTJCO1lBQzVCLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUM7UUFDOUMsQ0FBQztRQUVELFVBQVUsQ0FBQyxTQUFpQixFQUFFLE9BQVksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDNUQsc0lBQXNJO1lBQ3RJLElBQUksQ0FBQyxxQkFBbUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDdkMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELFdBQVcsQ0FBc0YsU0FBaUIsRUFBRSxJQUFnQztZQUNuSixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxJQUFXLENBQUMsQ0FBQztRQUN6QyxDQUFDOztJQTFDVyxrREFBbUI7a0NBQW5CLG1CQUFtQjtRQUQvQixJQUFBLHVDQUFvQixFQUFDLDhCQUFXLENBQUMsbUJBQW1CLENBQUM7UUFRbkQsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxnQ0FBZSxDQUFBO09BVkwsbUJBQW1CLENBMkMvQiJ9