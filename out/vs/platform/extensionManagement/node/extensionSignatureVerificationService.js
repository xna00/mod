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
define(["require", "exports", "vs/base/common/errors", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry"], function (require, exports, errors_1, instantiation_1, log_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionSignatureVerificationService = exports.IExtensionSignatureVerificationService = void 0;
    exports.IExtensionSignatureVerificationService = (0, instantiation_1.createDecorator)('IExtensionSignatureVerificationService');
    let ExtensionSignatureVerificationService = class ExtensionSignatureVerificationService {
        constructor(logService, telemetryService) {
            this.logService = logService;
            this.telemetryService = telemetryService;
        }
        vsceSign() {
            if (!this.moduleLoadingPromise) {
                this.moduleLoadingPromise = new Promise((resolve, reject) => require(['@vscode/vsce-sign'], async (obj) => {
                    const instance = obj;
                    return resolve(instance);
                }, reject));
            }
            return this.moduleLoadingPromise;
        }
        async verify(vsixFilePath, signatureArchiveFilePath, verbose) {
            let module;
            try {
                module = await this.vsceSign();
            }
            catch (error) {
                this.logService.error('Could not load vsce-sign module', (0, errors_1.getErrorMessage)(error));
                return false;
            }
            const startTime = new Date().getTime();
            let verified;
            let error;
            try {
                verified = await module.verify(vsixFilePath, signatureArchiveFilePath, verbose);
                return verified;
            }
            catch (e) {
                error = e;
                throw e;
            }
            finally {
                const duration = new Date().getTime() - startTime;
                this.telemetryService.publicLog2('extensionsignature:verification', {
                    duration,
                    verified,
                    error: error ? (error.code ?? 'unknown') : undefined,
                });
            }
        }
    };
    exports.ExtensionSignatureVerificationService = ExtensionSignatureVerificationService;
    exports.ExtensionSignatureVerificationService = ExtensionSignatureVerificationService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, telemetry_1.ITelemetryService)
    ], ExtensionSignatureVerificationService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uU2lnbmF0dXJlVmVyaWZpY2F0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uTWFuYWdlbWVudC9ub2RlL2V4dGVuc2lvblNpZ25hdHVyZVZlcmlmaWNhdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBT25GLFFBQUEsc0NBQXNDLEdBQUcsSUFBQSwrQkFBZSxFQUF5Qyx3Q0FBd0MsQ0FBQyxDQUFDO0lBa0NqSixJQUFNLHFDQUFxQyxHQUEzQyxNQUFNLHFDQUFxQztRQUtqRCxZQUMrQixVQUF1QixFQUNqQixnQkFBbUM7WUFEekMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNqQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1FBQ3BFLENBQUM7UUFFRyxRQUFRO1lBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxPQUFPLENBQ3RDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUMzQixDQUFDLG1CQUFtQixDQUFDLEVBQ3JCLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtvQkFDYixNQUFNLFFBQVEsR0FBb0IsR0FBRyxDQUFDO29CQUV0QyxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDMUIsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDZixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUM7UUFDbEMsQ0FBQztRQUVNLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBb0IsRUFBRSx3QkFBZ0MsRUFBRSxPQUFnQjtZQUMzRixJQUFJLE1BQXVCLENBQUM7WUFFNUIsSUFBSSxDQUFDO2dCQUNKLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoQyxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsSUFBQSx3QkFBZSxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2pGLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkMsSUFBSSxRQUE2QixDQUFDO1lBQ2xDLElBQUksS0FBc0QsQ0FBQztZQUUzRCxJQUFJLENBQUM7Z0JBQ0osUUFBUSxHQUFHLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsd0JBQXdCLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ2hGLE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLEtBQUssR0FBRyxDQUFDLENBQUM7Z0JBQ1YsTUFBTSxDQUFDLENBQUM7WUFDVCxDQUFDO29CQUFTLENBQUM7Z0JBQ1YsTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxTQUFTLENBQUM7Z0JBYWxELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQW9GLGlDQUFpQyxFQUFFO29CQUN0SixRQUFRO29CQUNSLFFBQVE7b0JBQ1IsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2lCQUNwRCxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUFsRVksc0ZBQXFDO29EQUFyQyxxQ0FBcUM7UUFNL0MsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSw2QkFBaUIsQ0FBQTtPQVBQLHFDQUFxQyxDQWtFakQifQ==