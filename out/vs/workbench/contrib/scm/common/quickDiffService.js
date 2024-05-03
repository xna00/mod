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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/languageSelector", "vs/base/common/event", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, lifecycle_1, resources_1, languageSelector_1, event_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickDiffService = void 0;
    function createProviderComparer(uri) {
        return (a, b) => {
            if (a.rootUri && !b.rootUri) {
                return -1;
            }
            else if (!a.rootUri && b.rootUri) {
                return 1;
            }
            else if (!a.rootUri && !b.rootUri) {
                return 0;
            }
            const aIsParent = (0, resources_1.isEqualOrParent)(uri, a.rootUri);
            const bIsParent = (0, resources_1.isEqualOrParent)(uri, b.rootUri);
            if (aIsParent && bIsParent) {
                return a.rootUri.fsPath.length - b.rootUri.fsPath.length;
            }
            else if (aIsParent) {
                return -1;
            }
            else if (bIsParent) {
                return 1;
            }
            else {
                return 0;
            }
        };
    }
    let QuickDiffService = class QuickDiffService extends lifecycle_1.Disposable {
        constructor(uriIdentityService) {
            super();
            this.uriIdentityService = uriIdentityService;
            this.quickDiffProviders = new Set();
            this._onDidChangeQuickDiffProviders = this._register(new event_1.Emitter());
            this.onDidChangeQuickDiffProviders = this._onDidChangeQuickDiffProviders.event;
        }
        addQuickDiffProvider(quickDiff) {
            this.quickDiffProviders.add(quickDiff);
            this._onDidChangeQuickDiffProviders.fire();
            return {
                dispose: () => {
                    this.quickDiffProviders.delete(quickDiff);
                    this._onDidChangeQuickDiffProviders.fire();
                }
            };
        }
        isQuickDiff(diff) {
            return !!diff.originalResource && (typeof diff.label === 'string') && (typeof diff.isSCM === 'boolean');
        }
        async getQuickDiffs(uri, language = '', isSynchronized = false) {
            const providers = Array.from(this.quickDiffProviders)
                .filter(provider => !provider.rootUri || this.uriIdentityService.extUri.isEqualOrParent(uri, provider.rootUri))
                .sort(createProviderComparer(uri));
            const diffs = await Promise.all(providers.map(async (provider) => {
                const scoreValue = provider.selector ? (0, languageSelector_1.score)(provider.selector, uri, language, isSynchronized, undefined, undefined) : 10;
                const diff = {
                    originalResource: scoreValue > 0 ? await provider.getOriginalResource(uri) ?? undefined : undefined,
                    label: provider.label,
                    isSCM: provider.isSCM
                };
                return diff;
            }));
            return diffs.filter(this.isQuickDiff);
        }
    };
    exports.QuickDiffService = QuickDiffService;
    exports.QuickDiffService = QuickDiffService = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService)
    ], QuickDiffService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tEaWZmU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2NtL2NvbW1vbi9xdWlja0RpZmZTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVVoRyxTQUFTLHNCQUFzQixDQUFDLEdBQVE7UUFDdkMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNmLElBQUksQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNYLENBQUM7aUJBQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQyxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7aUJBQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLElBQUEsMkJBQWUsRUFBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLE9BQVEsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sU0FBUyxHQUFHLElBQUEsMkJBQWUsRUFBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLE9BQVEsQ0FBQyxDQUFDO1lBRW5ELElBQUksU0FBUyxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixPQUFPLENBQUMsQ0FBQyxPQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsT0FBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDNUQsQ0FBQztpQkFBTSxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUN0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