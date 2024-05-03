/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/uri", "vs/workbench/api/common/extHostTypes", "./extHost.protocol", "vs/base/common/network", "vs/base/common/cancellation", "vs/base/common/strings"], function (require, exports, errors_1, uri_1, extHostTypes_1, extHost_protocol_1, network_1, cancellation_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDocumentContentProvider = void 0;
    class ExtHostDocumentContentProvider {
        static { this._handlePool = 0; }
        constructor(mainContext, _documentsAndEditors, _logService) {
            this._documentsAndEditors = _documentsAndEditors;
            this._logService = _logService;
            this._documentContentProviders = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDocumentContentProviders);
        }
        registerTextDocumentContentProvider(scheme, provider) {
            // todo@remote
            // check with scheme from fs-providers!
            if (Object.keys(network_1.Schemas).indexOf(scheme) >= 0) {
                throw new Error(`scheme '${scheme}' already registered`);
            }
            const handle = ExtHostDocumentContentProvider._handlePool++;
            this._documentContentProviders.set(handle, provider);
            this._proxy.$registerTextContentProvider(handle, scheme);
            let subscription;
            if (typeof provider.onDidChange === 'function') {
                let lastEvent;
                subscription = provider.onDidChange(async (uri) => {
                    if (uri.scheme !== scheme) {
                        this._logService.warn(`Provider for scheme '${scheme}' is firing event for schema '${uri.scheme}' which will be IGNORED`);
                        return;
                    }
                    if (!this._documentsAndEditors.getDocument(uri)) {
                        // ignore event if document isn't open
                        return;
                    }
                    if (lastEvent) {
                        await lastEvent;
                    }
                    const thisEvent = this.$provideTextDocumentContent(handle, uri)
                        .then(async (value) => {
                        if (!value && typeof value !== 'string') {
                            return;
                        }
                        const document = this._documentsAndEditors.getDocument(uri);
                        if (!document) {
                            // disposed in the meantime
                            return;
                        }
                        // create lines and compare
                        const lines = (0, strings_1.splitLines)(value);
                        // broadcast event when content changed
                        if (!document.equalLines(lines)) {
                            return this._proxy.$onVirtualDocumentChange(uri, value);
                        }
                    })
                        .catch(errors_1.onUnexpectedError)
                        .finally(() => {
                        if (lastEvent === thisEvent) {
                            lastEvent = undefined;
                        }
                    });
                    lastEvent = thisEvent;
                });
            }
            return new extHostTypes_1.Disposable(() => {
                if (this._documentContentProviders.delete(handle)) {
                    this._proxy.$unregisterTextContentProvider(handle);
                }
                if (subscription) {
                    subscription.dispose();
                    subscription = undefined;
                }
            });
        }
        $provideTextDocumentContent(handle, uri) {
            const provider = this._documentContentProviders.get(handle);
            if (!provider) {
                return Promise.reject(new Error(`unsupported uri-scheme: ${uri.scheme}`));
            }
            return Promise.resolve(provider.provideTextDocumentContent(uri_1.URI.revive(uri), cancellation_1.CancellationToken.None));
        }
    }
    exports.ExtHostDocumentContentProvider = ExtHostDocumentContentProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50Q29udGVudFByb3ZpZGVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdERvY3VtZW50Q29udGVudFByb3ZpZGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSw4QkFBOEI7aUJBRTNCLGdCQUFXLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFLL0IsWUFDQyxXQUF5QixFQUNSLG9CQUFnRCxFQUNoRCxXQUF3QjtZQUR4Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQTRCO1lBQ2hELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBTnpCLDhCQUF5QixHQUFHLElBQUksR0FBRyxFQUE4QyxDQUFDO1lBUWxHLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQUVELG1DQUFtQyxDQUFDLE1BQWMsRUFBRSxRQUE0QztZQUMvRixjQUFjO1lBQ2QsdUNBQXVDO1lBQ3ZDLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBTyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMvQyxNQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsTUFBTSxzQkFBc0IsQ0FBQyxDQUFDO1lBQzFELENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBRyw4QkFBOEIsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUU1RCxJQUFJLENBQUMseUJBQXlCLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNyRCxJQUFJLENBQUMsTUFBTSxDQUFDLDRCQUE0QixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZ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