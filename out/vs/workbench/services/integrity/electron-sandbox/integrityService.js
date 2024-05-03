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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/base/common/uri", "vs/workbench/services/integrity/common/integrity", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/product/common/productService", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/extensions", "vs/platform/opener/common/opener", "vs/base/common/network", "vs/platform/checksum/common/checksumService", "vs/platform/log/common/log"], function (require, exports, nls_1, severity_1, uri_1, integrity_1, lifecycle_1, productService_1, notification_1, storage_1, extensions_1, opener_1, network_1, checksumService_1, log_1) {
    "use strict";
    var IntegrityService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntegrityService = void 0;
    class IntegrityStorage {
        static { this.KEY = 'integrityService'; }
        constructor(storageService) {
            this.storageService = storageService;
            this.value = this._read();
        }
        _read() {
            const jsonValue = this.storageService.get(IntegrityStorage.KEY, -1 /* StorageScope.APPLICATION */);
            if (!jsonValue) {
                return null;
            }
            try {
                return JSON.parse(jsonValue);
            }
            catch (err) {
                return null;
            }
        }
        get() {
            return this.value;
        }
        set(data) {
            this.value = data;
            this.storageService.store(IntegrityStorage.KEY, JSON.stringify(this.value), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
    }
    let IntegrityService = IntegrityService_1 = class IntegrityService {
        isPure() {
            return this._isPurePromise;
        }
        constructor(notificationService, storageService, lifecycleService, openerService, productService, checksumService, logService) {
            this.notificationService = notificationService;
            this.storageService = storageService;
            this.lifecycleService = lifecycleService;
            this.openerService = openerService;
            this.productService = productService;
            this.checksumService = checksumService;
            this.logService = logService;
            this._storage = new IntegrityStorage(this.storageService);
            this._isPurePromise = this._isPure();
            this._compute();
        }
        async _compute() {
            const { isPure } = await this.isPure();
            if (isPure) {
                return; // all is good
            }
            this.logService.warn(`

----------------------------------------------
***	Installation has been modified on disk ***
----------------------------------------------

`);
            const storedData = this._storage.get();
            if (storedData?.dontShowPrompt && storedData.commit === this.productService.commit) {
                return; // Do not prompt
            }
            this._showNotification();
        }
        async _isPure() {
            const expectedChecksums = this.productService.checksums || {};
            await this.lifecycleService.when(4 /* LifecyclePhase.Eventually */);
            const allResults = await Promise.all(Object.keys(expectedChecksums).map(filename => this._resolve(filename, expectedChecksums[filename])));
            let isPure = true;
            for (let i = 0, len = allResults.length; i < len; i++) {
                if (!allResults[i].isPure) {
                    isPure = false;
                    break;
                }
            }
            return {
                isPure,
                proof: allResults
            };
        }
        async _resolve(filename, expected) {
            const fileUri = network_1.FileAccess.asFileUri(filename);
            try {
                const checksum = await this.checksumService.checksum(fileUri);
                return IntegrityService_1._createChecksumPair(fileUri, checksum, expected);
            }
            catch (error) {
                return IntegrityService_1._createChecksumPair(fileUri, '', expected);
            }
        }
        static _createChecksumPair(uri, actual, expected) {
            return {
                uri: uri,
                actual: actual,
                expected: expected,
                isPure: (actual === expected)
            };
        }
        _showNotification() {
            const checksumFailMoreInfoUrl = this.productService.checksumFailMoreInfoUrl;
            const message = (0, nls_1.localize)('integrity.prompt', "Your {0} installation appears to be corrupt. Please reinstall.", this.productService.nameShort);
            if (checksumFailMoreInfoUrl) {
                this.notificationService.prompt(severity_1.default.Warning, message, [
                    {
                        label: (0, nls_1.localize)('integrity.moreInformation', "More Information"),
                        run: () => this.openerService.open(uri_1.URI.parse(checksumFailMoreInfoUrl))
                    },
                    {
                        label: (0, nls_1.localize)('integrity.dontShowAgain', "Don't Show Again"),
                        isSecondary: true,
                        run: () => this._storage.set({ dontShowPrompt: true, commit: this.productService.commit })
                    }
                ], {
                    sticky: true,
                    priority: notification_1.NotificationPriority.URGENT
                });
            }
            else {
                this.notificationService.notify({
                    severity: severity_1.default.Warning,
                    message,
                    sticky: true,
                    priority: notification_1.NotificationPriority.URGENT
                });
            }
        }
    };
    exports.IntegrityService = IntegrityService;
    exports.IntegrityService = IntegrityService = IntegrityService_1 = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, storage_1.IStorageService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, opener_1.IOpenerService),
        __param(4, productService_1.IProductService),
        __param(5, checksumService_1.IChecksumService),
        __param(6, log_1.ILogService)
    ], IntegrityService);
    (0, extensions_1.registerSingleton)(integrity_1.IIntegrityService, IntegrityService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWdyaXR5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2ludGVncml0eS9lbGVjdHJvbi1zYW5kYm94L2ludGVncml0eVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFCaEcsTUFBTSxnQkFBZ0I7aUJBRUcsUUFBRyxHQUFHLGtCQUFrQixDQUFDO1FBSWpELFlBQTZCLGNBQStCO1lBQS9CLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMzRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRU8sS0FBSztZQUNaLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsb0NBQTJCLENBQUM7WUFDMUYsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxJQUFJLENBQUM7Z0JBQ0osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzlCLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNkLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztRQUNGLENBQUM7UUFFRCxHQUFHO1lBQ0YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFFRCxHQUFHLENBQUMsSUFBeUI7WUFDNUIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxt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