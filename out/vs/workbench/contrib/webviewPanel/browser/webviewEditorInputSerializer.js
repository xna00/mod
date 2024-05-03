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
define(["require", "exports", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "./webviewEditorInput", "./webviewWorkbenchService"], function (require, exports, uri_1, extensions_1, webviewEditorInput_1, webviewWorkbenchService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewEditorInputSerializer = void 0;
    exports.reviveWebviewExtensionDescription = reviveWebviewExtensionDescription;
    exports.restoreWebviewOptions = restoreWebviewOptions;
    exports.restoreWebviewContentOptions = restoreWebviewContentOptions;
    let WebviewEditorInputSerializer = class WebviewEditorInputSerializer {
        static { this.ID = webviewEditorInput_1.WebviewInput.typeId; }
        constructor(_webviewWorkbenchService) {
            this._webviewWorkbenchService = _webviewWorkbenchService;
        }
        canSerialize(input) {
            return this._webviewWorkbenchService.shouldPersist(input);
        }
        serialize(input) {
            if (!this.canSerialize(input)) {
                return undefined;
            }
            const data = this.toJson(input);
            try {
                return JSON.stringify(data);
            }
            catch {
                return undefined;
            }
        }
        deserialize(_instantiationService, serializedEditorInput) {
            const data = this.fromJson(JSON.parse(serializedEditorInput));
            return this._webviewWorkbenchService.openRevivedWebview({
                webviewInitInfo: {
                    providedViewType: data.providedId,
                    origin: data.origin,
                    title: data.title,
                    options: data.webviewOptions,
                    contentOptions: data.contentOptions,
                    extension: data.extension,
                },
                viewType: data.viewType,
                title: data.title,
                iconPath: data.iconPath,
                state: data.state,
                group: data.group
            });
        }
        fromJson(data) {
            return {
                ...data,
                extension: reviveWebviewExtensionDescription(data.extensionId, data.extensionLocation),
                iconPath: reviveIconPath(data.iconPath),
                state: reviveState(data.state),
                webviewOptions: restoreWebviewOptions(data.options),
                contentOptions: restoreWebviewContentOptions(data.options),
            };
        }
        toJson(input) {
            return {
                origin: input.webview.origin,
                viewType: input.viewType,
                providedId: input.providedId,
                title: input.getName(),
                options: { ...input.webview.options, ...input.webview.contentOptions },
                extensionLocation: input.extension?.location,
                extensionId: input.extension?.id.value,
                state: input.webview.state,
                iconPath: input.iconPath ? { light: input.iconPath.light, dark: input.iconPath.dark, } : undefined,
                group: input.group
            };
        }
    };
    exports.WebviewEditorInputSerializer = WebviewEditorInputSerializer;
    exports.WebviewEditorInputSerializer = WebviewEditorInputSerializer = __decorate([
        __param(0, webviewWorkbenchService_1.IWebviewWorkbenchService)
    ], WebviewEditorInputSerializer);
    function reviveWebviewExtensionDescription(extensionId, extensionLocation) {
        if (!extensionId) {
            return undefined;
        }
        const location = reviveUri(extensionLocation);
        if (!location) {
            return undefined;
        }
        return {
            id: new extensions_1.ExtensionIdentifier(extensionId),
            location,
        };
    }
    function reviveIconPath(data) {
        if (!data) {
            return undefined;
        }
        const light = reviveUri(data.light);
        const dark = reviveUri(data.dark);
        return light && dark ? { light, dark } : undefined;
    }
    function reviveUri(data) {
        if (!data) {
            return undefined;
        }
        try {
            if (typeof data === 'string') {
                return uri_1.URI.parse(data);
            }
            return uri_1.URI.from(data);
        }
        catch {
            return undefined;
        }
    }
    function reviveState(state) {
        return typeof state === 'string' ? state : undefined;
    }
    function restoreWebviewOptions(options) {
        return options;
    }
    function restoreWebviewContentOptions(options) {
        return {
            ...options,
            localResourceRoots: options.localResourceRoots?.map(uri => reviveUri(uri)),
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld0VkaXRvcklucHV0U2VyaWFsaXplci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2Vidmlld1BhbmVsL2Jyb3dzZXIvd2Vidmlld0VkaXRvcklucHV0U2VyaWFsaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzSGhHLDhFQWlCQztJQWlDRCxzREFFQztJQUVELG9FQUtDO0lBcklNLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTRCO2lCQUVqQixPQUFFLEdBQUcsaUNBQVksQ0FBQyxNQUFNLEFBQXRCLENBQXVCO1FBRWhELFlBQzRDLHdCQUFrRDtZQUFsRCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1FBQzFGLENBQUM7UUFFRSxZQUFZLENBQUMsS0FBbUI7WUFDdEMsT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFTSxTQUFTLENBQUMsS0FBbUI7WUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDO2dCQUNKLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QixDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUNSLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO1FBRU0sV0FBVyxDQUNqQixxQkFBNEMsRUFDNUMscUJBQTZCO1lBRTdCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFR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