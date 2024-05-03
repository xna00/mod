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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/languages/language", "vs/platform/theme/common/themeService", "vs/platform/log/common/log", "vs/editor/common/services/semanticTokensProviderStyling", "vs/editor/common/services/semanticTokensStyling", "vs/platform/instantiation/common/extensions"], function (require, exports, lifecycle_1, language_1, themeService_1, log_1, semanticTokensProviderStyling_1, semanticTokensStyling_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SemanticTokensStylingService = void 0;
    let SemanticTokensStylingService = class SemanticTokensStylingService extends lifecycle_1.Disposable {
        constructor(_themeService, _logService, _languageService) {
            super();
            this._themeService = _themeService;
            this._logService = _logService;
            this._languageService = _languageService;
            this._caches = new WeakMap();
            this._register(this._themeService.onDidColorThemeChange(() => {
                this._caches = new WeakMap();
            }));
        }
        getStyling(provider) {
            if (!this._caches.has(provider)) {
                this._caches.set(provider, new semanticTokensProviderStyling_1.SemanticTokensProviderStyling(provider.getLegend(), this._themeService, this._languageService, this._logService));
            }
            return this._caches.get(provider);
        }
    };
    exports.SemanticTokensStylingService = SemanticTokensStylingService;
    exports.SemanticTokensStylingService = SemanticTokensStylingService = __decorate([
        __param(0, themeService_1.IThemeService),
        __param(1, log_1.ILogService),
        __param(2, language_1.ILanguageService)
    ], SemanticTokensStylingService);
    (0, extensions_1.registerSingleton)(semanticTokensStyling_1.ISemanticTokensStylingService, SemanticTokensStylingService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VtYW50aWNUb2tlbnNTdHlsaW5nU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9zZXJ2aWNlcy9zZW1hbnRpY1Rva2Vuc1N0eWxpbmdTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVd6RixJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE2QixTQUFRLHNCQUFVO1FBTTNELFlBQ2lDLGFBQTRCLEVBQzlCLFdBQXdCLEVBQ25CLGdCQUFrQztZQUVyRSxLQUFLLEVBQUUsQ0FBQztZQUp3QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUM5QixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNuQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBR3JFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQXlELENBQUM7WUFDcEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRTtnQkFDNUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBeUQsQ0FBQztZQUNyRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVNLFVBQVUsQ0FBQyxRQUFnQztZQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksNkRBQTZCLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ2xKLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBRSxDQUFDO1FBQ3BDLENBQUM7S0FDRCxDQUFBO0lBeEJZLG9FQUE0QjsyQ0FBNUIsNEJBQTRCO1FBT3RDLFdBQUEsNEJBQWEsQ0FBQTtRQUNiLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsMkJBQWdCLENBQUE7T0FUTiw0QkFBNEIsQ0F3QnhDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxxREFBNkIsRUFBRSw0QkFBNEIsb0NBQTRCLENBQUMifQ==