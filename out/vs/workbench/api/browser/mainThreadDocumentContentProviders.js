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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/services/editorWorker", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol", "vs/base/common/cancellation"], function (require, exports, errors_1, lifecycle_1, uri_1, editOperation_1, range_1, editorWorker_1, model_1, language_1, resolverService_1, extHostCustomers_1, extHost_protocol_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDocumentContentProviders = void 0;
    let MainThreadDocumentContentProviders = class MainThreadDocumentContentProviders {
        constructor(extHostContext, _textModelResolverService, _languageService, _modelService, _editorWorkerService) {
            this._textModelResolverService = _textModelResolverService;
            this._languageService = _languageService;
            this._modelService = _modelService;
            this._editorWorkerService = _editorWorkerService;
            this._resourceContentProvider = new lifecycle_1.DisposableMap();
            this._pendingUpdate = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDocumentContentProviders);
        }
        dispose() {
            this._resourceContentProvider.dispose();
            (0, lifecycle_1.dispose)(this._pendingUpdate.values());
        }
        $registerTextContentProvider(handle, scheme) {
            const registration = this._textModelResolverService.registerTextModelContentProvider(scheme, {
                provideTextContent: (uri) => {
                    return this._proxy.$provideTextDocumentContent(handle, uri).then(value => {
                        if (typeof value === 'string') {
                            const firstLineText = value.substr(0, 1 + value.search(/\r?\n/));
                            const languageSelection = this._languageService.createByFilepathOrFirstLine(uri, firstLineText);
                            return this._modelService.createModel(value, languageSelection, uri);
                        }
                        return null;
                    });
                }
            });
            this._resourceContentProvider.set(handle, registration);
        }
        $unregisterTextContentProvider(handle) {
            this._resourceContentProvider.deleteAndDispose(handle);
        }
        async $onVirtualDocumentChange(uri, value) {
            const model = this._modelService.getModel(uri_1.URI.revive(uri));
            if (!model) {
                return;
            }
            // cancel and dispose an existing update
            const pending = this._pendingUpdate.get(model.id);
            pending?.cancel();
            // create and keep update token
            const myToken = new cancellation_1.CancellationTokenSource();
            this._pendingUpdate.set(model.id, myToken);
            try {
                const edits = await this._editorWorkerService.computeMoreMinimalEdits(model.uri, [{ text: value, range: model.getFullModelRange() }]);
                // remove token
                this._pendingUpdate.delete(model.id);
                if (myToken.token.isCancellationRequested) {
                    // ignore this
                    return;
                }
                if (edits && edits.length > 0) {
                    // use the evil-edit as these models show in readonly-editor only
                    model.applyEdits(edits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text)));
                }
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
            }
        }
    };
    exports.MainThreadDocumentContentProviders = MainThreadDocumentContentProviders;
    exports.MainThreadDocumentContentProviders = MainThreadDocumentContentProviders = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadDocumentContentProviders),
        __param(1, resolverService_1.ITextModelService),
        __param(2, language_1.ILanguageService),
        __param(3, model_1.IModelService),
        __param(4, editorWorker_1.IEditorWorkerService)
    ], MainThreadDocumentContentProviders);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERvY3VtZW50Q29udGVudFByb3ZpZGVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWREb2N1bWVudENvbnRlbnRQcm92aWRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJ6RixJQUFNLGtDQUFrQyxHQUF4QyxNQUFNLGtDQUFrQztRQU05QyxZQUNDLGNBQStCLEVBQ1oseUJBQTZELEVBQzlELGdCQUFtRCxFQUN0RCxhQUE2QyxFQUN0QyxvQkFBMkQ7WUFIN0MsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUFtQjtZQUM3QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ3JDLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ3JCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFUakUsNkJBQXdCLEdBQUcsSUFBSSx5QkFBYSxFQUFVLENBQUM7WUFDdkQsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBbUMsQ0FBQztZQVU1RSxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1FBQ3ZGLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3hDLElBQUEsbUJBQU8sRUFBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVELDRCQUE0QixDQUFDLE1BQWMsRUFBRSxNQUFjO1lBQzFELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxnQ0FBZ0MsQ0FBQyxNQUFNLEVBQUU7Z0JBQzVGLGtCQUFrQixFQUFFLENBQUMsR0FBUSxF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