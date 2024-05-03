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
define(["require", "exports", "vs/nls", "vs/base/common/json", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatures"], function (require, exports, nls_1, json_1, lifecycle_1, extensionManagement_1, range_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsCompletionItemsProvider = void 0;
    let ExtensionsCompletionItemsProvider = class ExtensionsCompletionItemsProvider extends lifecycle_1.Disposable {
        constructor(extensionManagementService, languageFeaturesService) {
            super();
            this.extensionManagementService = extensionManagementService;
            this._register(languageFeaturesService.completionProvider.register({ language: 'jsonc', pattern: '**/settings.json' }, {
                _debugDisplayName: 'extensionsCompletionProvider',
                provideCompletionItems: async (model, position, _context, token) => {
                    const getWordRangeAtPosition = (model, position) => {
                        const wordAtPosition = model.getWordAtPosition(position);
                        return wordAtPosition ? new range_1.Range(position.lineNumber, wordAtPosition.startColumn, position.lineNumber, wordAtPosition.endColumn) : null;
                    };
                    const location = (0, json_1.getLocation)(model.getValue(), model.getOffsetAt(position));
                    const range = getWordRangeAtPosition(model, position) ?? range_1.Range.fromPositions(position, position);
                    // extensions.supportUntrustedWorkspaces
                    if (location.path[0] === 'extensions.supportUntrustedWorkspaces' && location.path.length === 2 && location.isAtPropertyKey) {
                        let alreadyConfigured = [];
                        try {
                            alreadyConfigured = Object.keys((0, json_1.parse)(model.getValue())['extensions.supportUntrustedWorkspaces']);
                        }
                        catch (e) { /* ignore error */ }
                        return { suggestions: await this.provideSupportUntrustedWorkspacesExtensionProposals(alreadyConfigured, range) };
                    }
                    return { suggestions: [] };
                }
            }));
        }
        async provideSupportUntrustedWorkspacesExtensionProposals(alreadyConfigured, range) {
            const suggestions = [];
            const installedExtensions = (await this.extensionManagementService.getInstalled()).filter(e => e.manifest.main);
            const proposedExtensions = installedExtensions.filter(e => alreadyConfigured.indexOf(e.identifier.id) === -1);
            if (proposedExtensions.length) {
                suggestions.push(...proposedExtensions.map(e => {
                    const text = `"${e.identifier.id}": {\n\t"supported": true,\n\t"version": "${e.manifest.version}"\n},`;
                    return { label: e.identifier.id, kind: 13 /* CompletionItemKind.Value */, insertText: text, filterText: text, range };
                }));
            }
            else {
                const text = '"vscode.csharp": {\n\t"supported": true,\n\t"version": "0.0.0"\n},';
                suggestions.push({ label: (0, nls_1.localize)('exampleExtension', "Example"), kind: 13 /* CompletionItemKind.Value */, insertText: text, filterText: text, range });
            }
            return suggestions;
        }
    };
    exports.ExtensionsCompletionItemsProvider = ExtensionsCompletionItemsProvider;
    exports.ExtensionsCompletionItemsProvider = ExtensionsCompletionItemsProvider = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, languageFeatures_1.ILanguageFeaturesService)
    ], ExtensionsCompletionItemsProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc0NvbXBsZXRpb25JdGVtc1Byb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZXh0ZW5zaW9uc0NvbXBsZXRpb25JdGVtc1Byb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWV6RixJQUFNLGlDQUFpQyxHQUF2QyxNQUFNLGlDQUFrQyxTQUFRLHNCQUFVO1FBQ2hFLFlBQytDLDBCQUF1RCxFQUMzRSx1QkFBaUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFIc0MsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUtyRyxJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLEVBQUU7Z0JBQ3RILGlCQUFpQixFQUFFLDhCQUE4QjtnQkFDakQsc0JBQXNCLEVBQUUsS0FBSyxFQUFFLEtBQWlCLEVBQUUsUUFBa0IsRUFBRSxRQUEyQixFQUFFLEtBQXdCLEVBQTJCLEVBQUU7b0JBQ3ZKLE1BQU0sc0JBQXNCLEdBQUcsQ0FBQyxLQUFpQixFQUFFLFFBQWtCLEVBQWdCLEVBQUU7d0JBQ3RGLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDekQsT0FBTyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksYUFBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUMxSSxDQUFD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