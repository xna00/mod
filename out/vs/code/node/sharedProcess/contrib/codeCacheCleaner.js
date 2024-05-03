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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/log/common/log", "vs/platform/product/common/productService"], function (require, exports, async_1, errors_1, lifecycle_1, path_1, pfs_1, log_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCacheCleaner = void 0;
    let CodeCacheCleaner = class CodeCacheCleaner extends lifecycle_1.Disposable {
        constructor(currentCodeCachePath, productService, logService) {
            super();
            this.productService = productService;
            this.logService = logService;
            this._DataMaxAge = this.productService.quality !== 'stable'
                ? 1000 * 60 * 60 * 24 * 7 // roughly 1 week (insiders)
                : 1000 * 60 * 60 * 24 * 30 * 3; // roughly 3 months (stable)
            // Cached data is stored as user data and we run a cleanup task every time
            // the editor starts. The strategy is to delete all files that are older than
            // 3 months (1 week respectively)
            if (currentCodeCachePath) {
                const scheduler = this._register(new async_1.RunOnceScheduler(() => {
                    this.cleanUpCodeCaches(currentCodeCachePath);
                }, 30 * 1000 /* after 30s */));
                scheduler.schedule();
            }
        }
        async cleanUpCodeCaches(currentCodeCachePath) {
            this.logService.trace('[code cache cleanup]: Starting to clean up old code cache folders.');
            try {
                const now = Date.now();
                // The folder which contains folders of cached data.
                // Each of these folders is partioned per commit
                const codeCacheRootPath = (0, path_1.dirname)(currentCodeCachePath);
                const currentCodeCache = (0, path_1.basename)(currentCodeCachePath);
                const codeCaches = await pfs_1.Promises.readdir(codeCacheRootPath);
                await Promise.all(codeCaches.map(async (codeCache) => {
                    if (codeCache === currentCodeCache) {
                        return; // not the current cache folder
                    }
                    // Delete cache folder if old enough
                    const codeCacheEntryPath = (0, path_1.join)(codeCacheRootPath, codeCache);
                    const codeCacheEntryStat = await pfs_1.Promises.stat(codeCacheEntryPath);
                    if (codeCacheEntryStat.isDirectory() && (now - codeCacheEntryStat.mtime.getTime()) > this._DataMaxAge) {
                        this.logService.trace(`[code cache cleanup]: Removing code cache folder ${codeCache}.`);
                        return pfs_1.Promises.rm(codeCacheEntryPath);
                    }
                }));
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
            }
        }
    };
    exports.CodeCacheCleaner = CodeCacheCleaner;
    exports.CodeCacheCleaner = CodeCacheCleaner = __decorate([
        __param(1, productService_1.IProductService),
        __param(2, log_1.ILogService)
    ], CodeCacheCleaner);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUNhY2hlQ2xlYW5lci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvY29kZS9ub2RlL3NoYXJlZFByb2Nlc3MvY29udHJpYi9jb2RlQ2FjaGVDbGVhbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHNCQUFVO1FBTS9DLFlBQ0Msb0JBQXdDLEVBQ3ZCLGNBQWdELEVBQ3BELFVBQXdDO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBSDBCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNuQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBUHJDLGdCQUFXLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEtBQUssUUFBUTtnQkFDdEUsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUcsNEJBQTRCO2dCQUN4RCxDQUFDLENBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyw0QkFBNEI7WUFTNUQsMEVBQTBFO1lBQzFFLDZFQUE2RTtZQUM3RSxpQ0FBaUM7WUFDakMsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO2dCQUMxQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFO29CQUMxRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDOUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztnQkFDL0IsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3RCLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLGlCQUFpQixDQUFDLG9CQUE0QjtZQUMzRCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxvRUFBb0UsQ0FBQyxDQUFDO1lBRTVGLElBQUksQ0FBQztnQkFDSixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBRXZCLG9EQUFvRDtnQkFDcEQsZ0RBQWdEO2dCQUNoRCxNQUFNLGlCQUFpQixHQUFHLElBQUEsY0FBTyxFQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBQ3hELE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSxlQUFRLEVBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFFeEQsTUFBTSxVQUFVLEdBQUcsTUFBTSxjQUFRLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQzdELE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxTQUFTLEVBQUMsRUFBRTtvQkFDbEQsSUFBSSxTQUFTLEtBQUssZ0JBQWdCLEVBQUUsQ0FBQzt3QkFDcEMsT0FBTyxDQUFDLCtCQUErQjtvQkFDeEMsQ0FBQztvQkFFRCxvQ0FBb0M7b0JBQ3BDLE1BQU0sa0JBQWtCLEdBQUcsSUFBQSxXQUFJLEVBQUMsaUJBQWlCLEVBQUUsU0FBUyxDQUFDLENBQUM7b0JBQzlELE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxjQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7b0JBQ25FLElBQUksa0JBQWtCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUN2RyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxvREFBb0QsU0FBUyxHQUFHLENBQUMsQ0FBQzt3QkFFeEYsT0FBTyxjQUFRLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLENBQUM7b0JBQ3hDLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFBLDBCQUFpQixFQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFCLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQXREWSw0Q0FBZ0I7K0JBQWhCLGdCQUFnQjtRQVExQixXQUFBLGdDQUFlLENBQUE7UUFDZixXQUFBLGlCQUFXLENBQUE7T0FURCxnQkFBZ0IsQ0FzRDVCIn0=