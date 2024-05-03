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
define(["require", "exports", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService"], function (require, exports, platform_1, strings_1, uri_1, instantiation_1, log_1, extHost_protocol_1, extHostInitDataService_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostLocalizationService = exports.ExtHostLocalizationService = void 0;
    let ExtHostLocalizationService = class ExtHostLocalizationService {
        constructor(initData, rpc, logService) {
            this.logService = logService;
            this.bundleCache = new Map();
            this._proxy = rpc.getProxy(extHost_protocol_1.MainContext.MainThreadLocalization);
            this.currentLanguage = initData.environment.appLanguage;
            this.isDefaultLanguage = this.currentLanguage === platform_1.LANGUAGE_DEFAULT;
        }
        getMessage(extensionId, details) {
            const { message, args, comment } = details;
            if (this.isDefaultLanguage) {
                return (0, strings_1.format2)(message, (args ?? {}));
            }
            let key = message;
            if (comment && comment.length > 0) {
                key += `/${Array.isArray(comment) ? comment.join('') : comment}`;
            }
            const str = this.bundleCache.get(extensionId)?.contents[key];
            if (!str) {
                this.logService.warn(`Using default string since no string found in i18n bundle that has the key: ${key}`);
            }
            return (0, strings_1.format2)(str ?? message, (args ?? {}));
        }
        getBundle(extensionId) {
            return this.bundleCache.get(extensionId)?.contents;
        }
        getBundleUri(extensionId) {
            return this.bundleCache.get(extensionId)?.uri;
        }
        async initializeLocalizedMessages(extension) {
            if (this.isDefaultLanguage
                || (!extension.l10n && !extension.isBuiltin)) {
                return;
            }
            if (this.bundleCache.has(extension.identifier.value)) {
                return;
            }
            let contents;
            const bundleUri = await this.getBundleLocation(extension);
            if (!bundleUri) {
                this.logService.error(`No bundle location found for extension ${extension.identifier.value}`);
                return;
            }
            try {
                const response = await this._proxy.$fetchBundleContents(bundleUri);
                const result = JSON.parse(response);
                // 'contents.bundle' is a well-known key in the language pack json file that contains the _code_ translations for the extension
                contents = extension.isBuiltin ? result.contents?.bundle : result;
            }
            catch (e) {
                this.logService.error(`Failed to load translations for ${extension.identifier.value} from ${bundleUri}: ${e.message}`);
                return;
            }
            if (contents) {
                this.bundleCache.set(extension.identifier.value, {
                    contents,
                    uri: bundleUri
                });
            }
        }
        async getBundleLocation(extension) {
            if (extension.isBuiltin) {
                const uri = await this._proxy.$fetchBuiltInBundleUri(extension.identifier.value, this.currentLanguage);
                return uri_1.URI.revive(uri);
            }
            return extension.l10n
                ? uri_1.URI.joinPath(extension.extensionLocation, extension.l10n, `bundle.l10n.${this.currentLanguage}.json`)
                : undefined;
        }
    };
    exports.ExtHostLocalizationService = ExtHostLocalizationService;
    exports.ExtHostLocalizationService = ExtHostLocalizationService = __decorate([
        __param(0, extHostInitDataService_1.IExtHostInitDataService),
        __param(1, extHostRpcService_1.IExtHostRpcService),
        __param(2, log_1.ILogService)
    ], ExtHostLocalizationService);
    exports.IExtHostLocalizationService = (0, instantiation_1.createDecorator)('IExtHostLocalizationService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExvY2FsaXphdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RMb2NhbGl6YXRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVl6RixJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEwQjtRQVN0QyxZQUMwQixRQUFpQyxFQUN0QyxHQUF1QixFQUM5QixVQUF3QztZQUF2QixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBTHJDLGdCQUFXLEdBQW1FLElBQUksR0FBRyxFQUFFLENBQUM7WUFPeEcsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsZUFBZSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDO1lBQ3hELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsZUFBZSxLQUFLLDJCQUFnQixDQUFDO1FBQ3BFLENBQUM7UUFFRCxVQUFVLENBQUMsV0FBbUIsRUFBRSxPQUF1QjtZQUN0RCxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDM0MsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDNUIsT0FBTyxJQUFBLGlCQUFPLEVBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUVELElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQztZQUNsQixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxHQUFHLElB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