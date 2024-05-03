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
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/platform/languagePacks/common/languagePacks"], function (require, exports, extHost_protocol_1, extHostCustomers_1, uri_1, files_1, lifecycle_1, languagePacks_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadLocalization = void 0;
    let MainThreadLocalization = class MainThreadLocalization extends lifecycle_1.Disposable {
        constructor(extHostContext, fileService, languagePackService) {
            super();
            this.fileService = fileService;
            this.languagePackService = languagePackService;
        }
        async $fetchBuiltInBundleUri(id, language) {
            try {
                const uri = await this.languagePackService.getBuiltInExtensionTranslationsUri(id, language);
                return uri;
            }
            catch (e) {
                return undefined;
            }
        }
        async $fetchBundleContents(uriComponents) {
            const contents = await this.fileService.readFile(uri_1.URI.revive(uriComponents));
            return contents.value.toString();
        }
    };
    exports.MainThreadLocalization = MainThreadLocalization;
    exports.MainThreadLocalization = MainThreadLocalization = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadLocalization),
        __param(1, files_1.IFileService),
        __param(2, languagePacks_1.ILanguagePackService)
    ], MainThreadLocalization);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZExvY2FsaXphdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRMb2NhbGl6YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVXpGLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEsc0JBQVU7UUFFckQsWUFDQyxjQUErQixFQUNBLFdBQXlCLEVBQ2pCLG1CQUF5QztZQUVoRixLQUFLLEVBQUUsQ0FBQztZQUh1QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNqQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1FBR2pGLENBQUM7UUFFRCxLQUFLLENBQUMsc0JBQXNCLENBQUMsRUFBVSxFQUFFLFFBQWdCO1lBQ3hELElBQUksQ0FBQztnQkFDSixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxrQ0FBa0MsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzVGLE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsb0JBQW9CLENBQUMsYUFBNEI7WUFDdEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDNUUsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2xDLENBQUM7S0FDRCxDQUFBO0lBdkJZLHdEQUFzQjtxQ0FBdEIsc0JBQXNCO1FBRGxDLElBQUEsdUNBQW9CLEVBQUMsOEJBQVcsQ0FBQyxzQkFBc0IsQ0FBQztRQUt0RCxXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLG9DQUFvQixDQUFBO09BTFYsc0JBQXNCLENBdUJsQyJ9