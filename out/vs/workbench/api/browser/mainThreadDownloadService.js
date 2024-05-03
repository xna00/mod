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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/download/common/download", "vs/base/common/uri"], function (require, exports, lifecycle_1, extHost_protocol_1, extHostCustomers_1, download_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDownloadService = void 0;
    let MainThreadDownloadService = class MainThreadDownloadService extends lifecycle_1.Disposable {
        constructor(extHostContext, downloadService) {
            super();
            this.downloadService = downloadService;
        }
        $download(uri, to) {
            return this.downloadService.download(uri_1.URI.revive(uri), uri_1.URI.revive(to));
        }
    };
    exports.MainThreadDownloadService = MainThreadDownloadService;
    exports.MainThreadDownloadService = MainThreadDownloadService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadDownloadService),
        __param(1, download_1.IDownloadService)
    ], MainThreadDownloadService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERvd25sb2FkU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWREb3dubG9hZFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU3pGLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsc0JBQVU7UUFFeEQsWUFDQyxjQUErQixFQUNJLGVBQWlDO1lBRXBFLEtBQUssRUFBRSxDQUFDO1lBRjJCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtRQUdyRSxDQUFDO1FBRUQsU0FBUyxDQUFDLEdBQWtCLEVBQUUsRUFBaUI7WUFDOUMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2RSxDQUFDO0tBRUQsQ0FBQTtJQWJZLDhEQUF5Qjt3Q0FBekIseUJBQXlCO1FBRHJDLElBQUEsdUNBQW9CLEVBQUMsOEJBQVcsQ0FBQyx5QkFBeUIsQ0FBQztRQUt6RCxXQUFBLDJCQUFnQixDQUFBO09BSk4seUJBQXlCLENBYXJDIn0=