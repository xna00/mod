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
define(["require", "exports", "vs/base/common/async", "vs/platform/encryption/common/encryptionService", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/secrets/common/secrets", "vs/platform/storage/common/storage", "vs/workbench/services/environment/browser/environmentService"], function (require, exports, async_1, encryptionService_1, extensions_1, log_1, secrets_1, storage_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserSecretStorageService = void 0;
    let BrowserSecretStorageService = class BrowserSecretStorageService extends secrets_1.BaseSecretStorageService {
        constructor(storageService, encryptionService, environmentService, logService) {
            // We don't have encryption in the browser so instead we use the
            // in-memory base class implementation instead.
            super(true, storageService, encryptionService, logService);
            if (environmentService.options?.secretStorageProvider) {
                this._secretStorageProvider = environmentService.options.secretStorageProvider;
                this._embedderSequencer = new async_1.SequencerByKey();
            }
        }
        get(key) {
            if (this._secretStorageProvider) {
                return this._embedderSequencer.queue(key, () => this._secretStorageProvider.get(key));
            }
            return super.get(key);
        }
        set(key, value) {
            if (this._secretStorageProvider) {
                return this._embedderSequencer.queue(key, async () => {
                    await this._secretStorageProvider.set(key, value);
                    this.onDidChangeSecretEmitter.fire(key);
                });
            }
            return super.set(key, value);
        }
        delete(key) {
            if (this._secretStorageProvider) {
                return this._embedderSequencer.queue(key, async () => {
                    await this._secretStorageProvider.delete(key);
                    this.onDidChangeSecretEmitter.fire(key);
                });
            }
            return super.delete(key);
        }
        get type() {
            if (this._secretStorageProvider) {
                return this._secretStorageProvider.type;
            }
            return super.type;
        }
    };
    exports.BrowserSecretStorageService = BrowserSecretStorageService;
    exports.BrowserSecretStorageService = BrowserSecretStorageService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, encryptionService_1.IEncryptionService),
        __param(2, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(3, log_1.ILogService)
    ], BrowserSecretStorageService);
    (0, extensions_1.registerSingleton)(secrets_1.ISecretStorageService, BrowserSecretStorageService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0U3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWNyZXRzL2Jyb3dzZXIvc2VjcmV0U3RvcmFnZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVXpGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsa0NBQXdCO1FBS3hFLFlBQ2tCLGNBQStCLEVBQzVCLGlCQUFxQyxFQUNwQixrQkFBdUQsRUFDL0UsVUFBdUI7WUFFcEMsZ0VBQWdFO1lBQ2hFLCtDQUErQztZQUMvQyxLQUFLLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUUzRCxJQUFJLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxDQUFDO2dCQUN2RCxJQUFJLENBQUMsc0JBQXNCLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDO2dCQUMvRSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxzQkFBYyxFQUFVLENBQUM7WUFDeEQsQ0FBQztRQUNGLENBQUM7UUFFUSxHQUFHLENBQUMsR0FBVztZQUN2QixJQUFJLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUNqQyxPQUFPLElBQUksQ0FBQyxrQkFBbUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBdUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN6RixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7UUFFUSxHQUFHLENBQUMsR0FBVyxFQUFFLEtBQWE7WUFDdEMsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxJQUFJLENBQUMsa0JBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDckQsTUFBTSxJQUFJLENBQUMsc0JBQXVCLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDbkQsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDekMsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRVEsTUFBTSxDQUFDLEdBQVc7WUFDMUIsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxJQUFJLENBQUMsa0JBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLElBQUksRUFBRTtvQkFDckQsTUFBTSxJQUFJLENBQUMsc0JBQXVCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUMvQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN6QyxDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUVELElBQWEsSUFBSTtZQUNoQixJQUFJLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUNqQyxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUM7WUFDekMsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQztRQUNuQixDQUFDO0tBQ0QsQ0FBQTtJQTFEWSxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQU1yQyxXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEsd0RBQW1DLENBQUE7UUFDbkMsV0FBQSxpQkFBVyxDQUFBO09BVEQsMkJBQTJCLENBMER2QztJQUVELElBQUEsOEJBQWlCLEVBQUMsK0JBQXFCLEVBQUUsMkJBQTJCLG9DQUE0QixDQUFDIn0=