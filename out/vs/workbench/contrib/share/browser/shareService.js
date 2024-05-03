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
define(["require", "exports", "vs/editor/browser/services/codeEditorService", "vs/editor/common/languageSelector", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/label/common/label", "vs/platform/quickinput/common/quickInput", "vs/platform/telemetry/common/telemetry"], function (require, exports, codeEditorService_1, languageSelector_1, nls_1, contextkey_1, label_1, quickInput_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShareService = exports.ShareProviderCountContext = void 0;
    exports.ShareProviderCountContext = new contextkey_1.RawContextKey('shareProviderCount', 0, (0, nls_1.localize)('shareProviderCount', "The number of available share providers"));
    let ShareService = class ShareService {
        constructor(contextKeyService, labelService, quickInputService, codeEditorService, telemetryService) {
            this.contextKeyService = contextKeyService;
            this.labelService = labelService;
            this.quickInputService = quickInputService;
            this.codeEditorService = codeEditorService;
            this.telemetryService = telemetryService;
            this._providers = new Set();
            this.providerCount = exports.ShareProviderCountContext.bindTo(this.contextKeyService);
        }
        registerShareProvider(provider) {
            this._providers.add(provider);
            this.providerCount.set(this._providers.size);
            return {
                dispose: () => {
                    this._providers.delete(provider);
                    this.providerCount.set(this._providers.size);
                }
            };
        }
        getShareActions() {
            // todo@joyceerhl return share actions
            return [];
        }
        async provideShare(item, token) {
            const language = this.codeEditorService.getActiveCodeEditor()?.getModel()?.getLanguageId() ?? '';
            const providers = [...this._providers.values()]
                .filter((p) => (0, languageSelector_1.score)(p.selector, item.resourceUri, language, true, undefined, undefined) > 0)
                .sort((a, b) => a.priority - b.priority);
            if (providers.length === 0) {
                return undefined;
            }
            if (providers.length === 1) {
                this.telemetryService.publicLog2('shareService.share', { providerId: providers[0].id });
                return providers[0].provideShare(item, token);
            }
            const items = providers.map((p) => ({ label: p.label, provider: p }));
            const selected = await this.quickInputService.pick(items, { canPickMany: false, placeHolder: (0, nls_1.localize)('type to filter', 'Choose how to share {0}', this.labelService.getUriLabel(item.resourceUri)) }, token);
            if (selected !== undefined) {
                this.telemetryService.publicLog2('shareService.share', { providerId: selected.provider.id });
                return selected.provider.provideShare(item, token);
            }
            return;
        }
    };
    exports.ShareService = ShareService;
    exports.ShareService = ShareService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, label_1.ILabelService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, telemetry_1.ITelemetryService)
    ], ShareService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zaGFyZS9icm93c2VyL3NoYXJlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlbkYsUUFBQSx5QkFBeUIsR0FBRyxJQUFJLDBCQUFhLENBQVMsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLHlDQUF5QyxDQUFDLENBQUMsQ0FBQztJQVVoSyxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFZO1FBTXhCLFlBQ3FCLGlCQUE2QyxFQUNsRCxZQUE0QyxFQUN2QyxpQkFBNkMsRUFDN0MsaUJBQXNELEVBQ3ZELGdCQUFvRDtZQUozQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ2pDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQy9CLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDNUIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUN0QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBUHZELGVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQVN2RCxJQUFJLENBQUMsYUFBYSxHQUFHLGlDQUF5QixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBRUQscUJBQXFCLENBQUMsUUFBd0I7WUFDN0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxPQUFPO2dCQUNOLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JB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