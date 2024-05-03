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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/product/common/productService"], function (require, exports, async_1, errors_1, lifecycle_1, path_1, pfs_1, environment_1, log_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguagePackCachedDataCleaner = void 0;
    let LanguagePackCachedDataCleaner = class LanguagePackCachedDataCleaner extends lifecycle_1.Disposable {
        constructor(environmentService, logService, productService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.productService = productService;
            this._DataMaxAge = this.productService.quality !== 'stable'
                ? 1000 * 60 * 60 * 24 * 7 // roughly 1 week (insiders)
                : 1000 * 60 * 60 * 24 * 30 * 3; // roughly 3 months (stable)
            // We have no Language pack support for dev version (run from source)
            // So only cleanup when we have a build version.
            if (this.environmentService.isBuilt) {
                const scheduler = this._register(new async_1.RunOnceScheduler(() => {
                    this.cleanUpLanguagePackCache();
                }, 40 * 1000 /* after 40s */));
                scheduler.schedule();
            }
        }
        async cleanUpLanguagePackCache() {
            this.logService.trace('[language pack cache cleanup]: Starting to clean up unused language packs.');
            try {
                const installed = Object.create(null);
                const metaData = JSON.parse(await pfs_1.Promises.readFile((0, path_1.join)(this.environmentService.userDataPath, 'languagepacks.json'), 'utf8'));
                for (const locale of Object.keys(metaData)) {
                    const entry = metaData[locale];
                    installed[`${entry.hash}.${locale}`] = true;
                }
                // Cleanup entries for language packs that aren't installed anymore
                const cacheDir = (0, path_1.join)(this.environmentService.userDataPath, 'clp');
                const cacheDirExists = await pfs_1.Promises.exists(cacheDir);
                if (!cacheDirExists) {
                    return;
                }
                const entries = await pfs_1.Promises.readdir(cacheDir);
                for (const entry of entries) {
                    if (installed[entry]) {
                        this.logService.trace(`[language pack cache cleanup]: Skipping folder ${entry}. Language pack still in use.`);
                        continue;
                    }
                    this.logService.trace(`[language pack cache cleanup]: Removing unused language pack: ${entry}`);
                    await pfs_1.Promises.rm((0, path_1.join)(cacheDir, entry));
                }
                const now = Date.now();
                for (const packEntry of Object.keys(installed)) {
                    const folder = (0, path_1.join)(cacheDir, packEntry);
                    const entries = await pfs_1.Promises.readdir(folder);
                    for (const entry of entries) {
                        if (entry === 'tcf.json') {
                            continue;
                        }
                        const candidate = (0, path_1.join)(folder, entry);
                        const stat = await pfs_1.Promises.stat(candidate);
                        if (stat.isDirectory() && (now - stat.mtime.getTime()) > this._DataMaxAge) {
                            this.logService.trace(`[language pack cache cleanup]: Removing language pack cache folder: ${(0, path_1.join)(packEntry, entry)}`);
                            await pfs_1.Promises.rm(candidate);
                        }
                    }
                }
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
            }
        }
    };
    exports.LanguagePackCachedDataCleaner = LanguagePackCachedDataCleaner;
    exports.LanguagePackCachedDataCleaner = LanguagePackCachedDataCleaner = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, log_1.ILogService),
        __param(2, productService_1.IProductService)
    ], LanguagePackCachedDataCleaner);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VQYWNrQ2FjaGVkRGF0YUNsZWFuZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2NvZGUvbm9kZS9zaGFyZWRQcm9jZXNzL2NvbnRyaWIvbGFuZ3VhZ2VQYWNrQ2FjaGVkRGF0YUNsZWFuZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNkJ6RixJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE4QixTQUFRLHNCQUFVO1FBTTVELFlBQzRCLGtCQUE4RCxFQUM1RSxVQUF3QyxFQUNwQyxjQUFnRDtZQUVqRSxLQUFLLEVBQUUsQ0FBQztZQUpvQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQTJCO1lBQzNELGVBQVUsR0FBVixVQUFVLENBQWE7WUFDbkIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBUGpELGdCQUFXLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEtBQUssUUFBUTtnQkFDdEUsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUcsNEJBQTRCO2dCQUN4RCxDQUFDLENBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyw0QkFBNEI7WUFTNUQscUVBQXFFO1lBQ3JFLGdEQUFnRDtZQUNoRCxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFDLEdBQUcsRUFBRTtvQkFDMUQsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ2pDLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFD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