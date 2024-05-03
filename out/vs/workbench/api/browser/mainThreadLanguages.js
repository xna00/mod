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
define(["require", "exports", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/editor/common/services/model", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/workbench/services/languageStatus/common/languageStatusService", "vs/base/common/lifecycle"], function (require, exports, uri_1, language_1, model_1, extHost_protocol_1, extHostCustomers_1, range_1, resolverService_1, languageStatusService_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadLanguages = void 0;
    let MainThreadLanguages = class MainThreadLanguages {
        constructor(_extHostContext, _languageService, _modelService, _resolverService, _languageStatusService) {
            this._languageService = _languageService;
            this._modelService = _modelService;
            this._resolverService = _resolverService;
            this._languageStatusService = _languageStatusService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._status = new lifecycle_1.DisposableMap();
            this._proxy = _extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostLanguages);
            this._proxy.$acceptLanguageIds(_languageService.getRegisteredLanguageIds());
            this._disposables.add(_languageService.onDidChange(_ => {
                this._proxy.$acceptLanguageIds(_languageService.getRegisteredLanguageIds());
            }));
        }
        dispose() {
            this._disposables.dispose();
            this._status.dispose();
        }
        async $changeLanguage(resource, languageId) {
            if (!this._languageService.isRegisteredLanguageId(languageId)) {
                return Promise.reject(new Error(`Unknown language id: ${languageId}`));
            }
            const uri = uri_1.URI.revive(resource);
            const ref = await this._resolverService.createModelReference(uri);
            try {
                ref.object.textEditorModel.setLanguage(this._languageService.createById(languageId));
            }
            finally {
                ref.dispose();
            }
        }
        async $tokensAtPosition(resource, position) {
            const uri = uri_1.URI.revive(resource);
            const model = this._modelService.getModel(uri);
            if (!model) {
                return undefined;
            }
            model.tokenization.tokenizeIfCheap(position.lineNumber);
            const tokens = model.tokenization.getLineTokens(position.lineNumber);
            const idx = tokens.findTokenIndexAtOffset(position.column - 1);
            return {
                type: tokens.getStandardTokenType(idx),
                range: new range_1.Range(position.lineNumber, 1 + tokens.getStartOffset(idx), position.lineNumber, 1 + tokens.getEndOffset(idx))
            };
        }
        // --- language status
        $setLanguageStatus(handle, status) {
            this._status.get(handle)?.dispose();
            this._status.set(handle, this._languageStatusService.addStatus(status));
        }
        $removeLanguageStatus(handle) {
            this._status.get(handle)?.dispose();
        }
    };
    exports.MainThreadLanguages = MainThreadLanguages;
    exports.MainThreadLanguages = MainThreadLanguages = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadLanguages),
        __param(1, language_1.ILanguageService),
        __param(2, model_1.IModelService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, languageStatusService_1.ILanguageStatusService)
    ], MainThreadLanguages);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZExhbmd1YWdlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRMYW5ndWFnZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZXpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1CO1FBTy9CLFlBQ0MsZUFBZ0MsRUFDZCxnQkFBbUQsRUFDdEQsYUFBNkMsRUFDekMsZ0JBQTJDLEVBQ3RDLHNCQUErRDtZQUhwRCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ3JDLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ2pDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDckIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtZQVZ2RSxpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBR3JDLFlBQU8sR0FBRyxJQUFJLHlCQUFhLEVBQVUsQ0FBQztZQVN0RCxJQUFJLENBQUMsTUFBTSxHQUFHLGVBQWUsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRXhFLElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBQzVFLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDdEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUM7WUFDN0UsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVB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