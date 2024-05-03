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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/dataTransfer", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/common/languages", "vs/editor/common/services/languageFeatures", "vs/nls", "vs/platform/workspace/common/workspace"], function (require, exports, arrays_1, dataTransfer_1, hierarchicalKind_1, lifecycle_1, mime_1, network_1, resources_1, uri_1, languages_1, languageFeatures_1, nls_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultPasteProvidersFeature = exports.DefaultDropProvidersFeature = exports.DefaultTextPasteOrDropEditProvider = void 0;
    class SimplePasteAndDropProvider {
        async provideDocumentPasteEdits(_model, _ranges, dataTransfer, context, token) {
            const edit = await this.getEdit(dataTransfer, token);
            if (!edit) {
                return undefined;
            }
            return {
                dispose() { },
                edits: [{ insertText: edit.insertText, title: edit.title, kind: edit.kind, handledMimeType: edit.handledMimeType, yieldTo: edit.yieldTo }]
            };
        }
        async provideDocumentOnDropEdits(_model, _position, dataTransfer, token) {
            const edit = await this.getEdit(dataTransfer, token);
            return edit ? [{ insertText: edit.insertText, title: edit.title, kind: edit.kind, handledMimeType: edit.handledMimeType, yieldTo: edit.yieldTo }] : undefined;
        }
    }
    class DefaultTextPasteOrDropEditProvider extends SimplePasteAndDropProvider {
        constructor() {
            super(...arguments);
            this.id = DefaultTextPasteOrDropEditProvider.id;
            this.kind = DefaultTextPasteOrDropEditProvider.kind;
            this.dropMimeTypes = [mime_1.Mimes.text];
            this.pasteMimeTypes = [mime_1.Mimes.text];
        }
        static { this.id = 'text'; }
        static { this.kind = new hierarchicalKind_1.HierarchicalKind('text.plain'); }
        async getEdit(dataTransfer, _token) {
            const textEntry = dataTransfer.get(mime_1.Mimes.text);
            if (!textEntry) {
                return;
            }
            // Suppress if there's also a uriList entry.
            // Typically the uri-list contains the same text as the text entry so showing both is confusing.
            if (dataTransfer.has(mime_1.Mimes.uriList)) {
                return;
            }
            const insertText = await textEntry.asString();
            return {
                handledMimeType: mime_1.Mimes.text,
                title: (0, nls_1.localize)('text.label', "Insert Plain Text"),
                insertText,
                kind: this.kind,
            };
        }
    }
    exports.DefaultTextPasteOrDropEditProvider = DefaultTextPasteOrDropEditProvider;
    class PathProvider extends SimplePasteAndDropProvider {
        constructor() {
            super(...arguments);
            this.kind = new hierarchicalKind_1.HierarchicalKind('uri.absolute');
            this.dropMimeTypes = [mime_1.Mimes.uriList];
            this.pasteMimeTypes = [mime_1.Mimes.uriList];
        }
        async getEdit(dataTransfer, token) {
            const entries = await extractUriList(dataTransfer);
            if (!entries.length || token.isCancellationRequested) {
                return;
            }
            let uriCount = 0;
            const insertText = entries
                .map(({ uri, originalText }) => {
                if (uri.scheme === network_1.Schemas.file) {
                    return uri.fsPath;
                }
                else {
                    uriCount++;
                    return originalText;
                }
            })
                .join(' ');
            let label;
            if (uriCount > 0) {
                // Dropping at least one generic uri (such as https) so use most generic label
                label = entries.length > 1
                    ? (0, nls_1.localize)('defaultDropProvider.uriList.uris', "Insert Uris")
                    : (0, nls_1.localize)('defaultDropProvider.uriList.uri', "Insert Uri");
            }
            else {
                // All the paths are file paths
                label = entries.length > 1
                    ? (0, nls_1.localize)('defaultDropProvider.uriList.paths', "Insert Paths")
                    : (0, nls_1.localize)('defaultDropProvider.uriList.path', "Insert Path");
            }
            return {
                handledMimeType: mime_1.Mimes.uriList,
                insertText,
                title: label,
                kind: this.kind,
            };
        }
    }
    let RelativePathProvider = class RelativePathProvider extends SimplePasteAndDropProvider {
        constructor(_workspaceContextService) {
            super();
            this._workspaceContextService = _workspaceContextService;
            this.kind = new hierarchicalKind_1.HierarchicalKind('uri.relative');
            this.dropMimeTypes = [mime_1.Mimes.uriList];
            this.pasteMimeTypes = [mime_1.Mimes.uriList];
        }
        async getEdit(dataTransfer, token) {
            const entries = await extractUriList(dataTransfer);
            if (!entries.length || token.isCancellationRequested) {
                return;
            }
            const relativeUris = (0, arrays_1.coalesce)(entries.map(({ uri }) => {
                const root = this._workspaceContextService.getWorkspaceFolder(uri);
                return root ? (0, resources_1.relativePath)(root.uri, uri) : undefined;
            }));
            if (!relativeUris.length) {
                return;
            }
            return {
                handledMimeType: mime_1.Mimes.uriList,
                insertText: relativeUris.join(' '),
                title: entries.length > 1
                    ? (0, nls_1.localize)('defaultDropProvider.uriList.relativePaths', "Insert Relative Paths")
                    : (0, nls_1.localize)('defaultDropProvider.uriList.relativePath', "Insert Relative Path"),
                kind: this.kind,
            };
        }
    };
    RelativePathProvider = __decorate([
        __param(0, workspace_1.IWorkspaceContextService)
    ], RelativePathProvider);
    class PasteHtmlProvider {
        constructor() {
            this.kind = new hierarchicalKind_1.HierarchicalKind('html');
            this.pasteMimeTypes = ['text/html'];
            this._yieldTo = [{ mimeType: mime_1.Mimes.text }];
        }
        async provideDocumentPasteEdits(_model, _ranges, dataTransfer, context, token) {
            if (context.triggerKind !== languages_1.DocumentPasteTriggerKind.PasteAs && !context.only?.contains(this.kind)) {
                return;
            }
            const entry = dataTransfer.get('text/html');
            const htmlText = await entry?.asString();
            if (!htmlText || token.isCancellationRequested) {
                return;
            }
            return {
                dispose() { },
                edits: [{
                        insertText: htmlText,
                        yieldTo: this._yieldTo,
                        title: (0, nls_1.localize)('pasteHtmlLabel', 'Insert HTML'),
                        kind: this.kind,
                    }],
            };
        }
    }
    async function extractUriList(dataTransfer) {
        const urlListEntry = dataTransfer.get(mime_1.Mimes.uriList);
        if (!urlListEntry) {
            return [];
        }
        const strUriList = await urlListEntry.asString();
        const entries = [];
        for (const entry of dataTransfer_1.UriList.parse(strUriList)) {
            try {
                entries.push({ uri: uri_1.URI.parse(entry), originalText: entry });
            }
            catch {
                // noop
            }
        }
        return entries;
    }
    let DefaultDropProvidersFeature = class DefaultDropProvidersFeature extends lifecycle_1.Disposable {
        constructor(languageFeaturesService, workspaceContextService) {
            super();
            this._register(languageFeaturesService.documentOnDropEditProvider.register('*', new DefaultTextPasteOrDropEditProvider()));
            this._register(languageFeaturesService.documentOnDropEditProvider.register('*', new PathProvider()));
            this._register(languageFeaturesService.documentOnDropEditProvider.register('*', new RelativePathProvider(workspaceContextService)));
        }
    };
    exports.DefaultDropProvidersFeature = DefaultDropProvidersFeature;
    exports.DefaultDropProvidersFeature = DefaultDropProvidersFeature = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], DefaultDropProvidersFeature);
    let DefaultPasteProvidersFeature = class DefaultPasteProvidersFeature extends lifecycle_1.Disposable {
        constructor(languageFeaturesService, workspaceContextService) {
            super();
            this._register(languageFeaturesService.documentPasteEditProvider.register('*', new DefaultTextPasteOrDropEditProvider()));
            this._register(languageFeaturesService.documentPasteEditProvider.register('*', new PathProvider()));
            this._register(languageFeaturesService.documentPasteEditProvider.register('*', new RelativePathProvider(workspaceContextService)));
            this._register(languageFeaturesService.documentPasteEditProvider.register('*', new PasteHtmlProvider()));
        }
    };
    exports.DefaultPasteProvidersFeature = DefaultPasteProvidersFeature;
    exports.DefaultPasteProvidersFeature = DefaultPasteProvidersFeature = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], DefaultPasteProvidersFeature);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdFByb3ZpZGVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZHJvcE9yUGFzdGVJbnRvL2Jyb3dzZXIvZGVmYXVsdFByb3ZpZGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQmhHLE1BQWUsMEJBQTBCO1FBTXhDLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxNQUFrQixFQUFFLE9BQTBCLEVBQUUsWUFBcUMsRUFBRSxPQUE2QixFQUFFLEtBQXdCO1lBQzdLLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxPQUFPO2dCQUNOLE9BQU8sS0FBSyxDQUFDO2dCQUNiLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUMxSSxDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxNQUFrQixFQUFFLFNBQW9CLEVBQUUsWUFBcUMsRUFBRSxLQUF3QjtZQUN6SSxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JELE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FB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