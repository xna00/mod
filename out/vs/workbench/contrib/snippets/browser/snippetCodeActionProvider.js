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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/core/selection", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/codeAction/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/snippets/browser/commands/fileTemplateSnippets", "vs/workbench/contrib/snippets/browser/commands/surroundWithSnippet", "./snippets"], function (require, exports, lifecycle_1, selection_1, languageFeatures_1, types_1, nls_1, configuration_1, instantiation_1, fileTemplateSnippets_1, surroundWithSnippet_1, snippets_1) {
    "use strict";
    var SurroundWithSnippetCodeActionProvider_1, FileTemplateCodeActionProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetCodeActions = void 0;
    let SurroundWithSnippetCodeActionProvider = class SurroundWithSnippetCodeActionProvider {
        static { SurroundWithSnippetCodeActionProvider_1 = this; }
        static { this._MAX_CODE_ACTIONS = 4; }
        static { this._overflowCommandCodeAction = {
            kind: types_1.CodeActionKind.SurroundWith.value,
            title: (0, nls_1.localize)('more', "More..."),
            command: {
                id: surroundWithSnippet_1.SurroundWithSnippetEditorAction.options.id,
                title: surroundWithSnippet_1.SurroundWithSnippetEditorAction.options.title.value,
            },
        }; }
        constructor(_snippetService) {
            this._snippetService = _snippetService;
        }
        async provideCodeActions(model, range) {
            if (range.isEmpty()) {
                return undefined;
            }
            const position = selection_1.Selection.isISelection(range) ? range.getPosition() : range.getStartPosition();
            const snippets = await (0, surroundWithSnippet_1.getSurroundableSnippets)(this._snippetService, model, position, false);
            if (!snippets.length) {
                return undefined;
            }
            const actions = [];
            for (const snippet of snippets) {
                if (actions.length >= SurroundWithSnippetCodeActionProvider_1._MAX_CODE_ACTIONS) {
                    actions.push(SurroundWithSnippetCodeActionProvider_1._overflowCommandCodeAction);
                    break;
                }
                actions.push({
                    title: (0, nls_1.localize)('codeAction', "{0}", snippet.name),
                    kind: types_1.CodeActionKind.SurroundWith.value,
                    edit: asWorkspaceEdit(model, range, snippet)
                });
            }
            return {
                actions,
                dispose() { }
            };
        }
    };
    SurroundWithSnippetCodeActionProvider = SurroundWithSnippetCodeActionProvider_1 = __decorate([
        __param(0, snippets_1.ISnippetsService)
    ], SurroundWithSnippetCodeActionProvider);
    let FileTemplateCodeActionProvider = class FileTemplateCodeActionProvider {
        static { FileTemplateCodeActionProvider_1 = this; }
        static { this._MAX_CODE_ACTIONS = 4; }
        static { this._overflowCommandCodeAction = {
            title: (0, nls_1.localize)('overflow.start.title', 'Start with Snippet'),
            kind: types_1.CodeActionKind.SurroundWith.value,
            command: {
                id: fileTemplateSnippets_1.ApplyFileSnippetAction.Id,
                title: ''
            }
        }; }
        constructor(_snippetService) {
            this._snippetService = _snippetService;
            this.providedCodeActionKinds = [types_1.CodeActionKind.SurroundWith.value];
        }
        async provideCodeActions(model) {
            if (model.getValueLength() !== 0) {
                return undefined;
            }
            const snippets = await this._snippetService.getSnippets(model.getLanguageId(), { fileTemplateSnippets: true, includeNoPrefixSnippets: true });
            const actions = [];
            for (const snippet of snippets) {
                if (actions.length >= FileTemplateCodeActionProvider_1._MAX_CODE_ACTIONS) {
                    actions.push(FileTemplateCodeActionProvider_1._overflowCommandCodeAction);
                    break;
                }
                actions.push({
                    title: (0, nls_1.localize)('title', 'Start with: {0}', snippet.name),
                    kind: types_1.CodeActionKind.SurroundWith.value,
                    edit: asWorkspaceEdit(model, model.getFullModelRange(), snippet)
                });
            }
            return {
                actions,
                dispose() { }
            };
        }
    };
    FileTemplateCodeActionProvider = FileTemplateCodeActionProvider_1 = __decorate([
        __param(0, snippets_1.ISnippetsService)
    ], FileTemplateCodeActionProvider);
    function asWorkspaceEdit(model, range, snippet) {
        return {
            edits: [{
                    versionId: model.getVersionId(),
                    resource: model.uri,
                    textEdit: {
                        range,
                        text: snippet.body,
                        insertAsSnippet: true,
                    }
                }]
        };
    }
    let SnippetCodeActions = class SnippetCodeActions {
        constructor(instantiationService, languageFeaturesService, configService) {
            this._store = new lifecycle_1.DisposableStore();
            const setting = 'editor.snippets.codeActions.enabled';
            const sessionStore = new lifecycle_1.DisposableStore();
            const update = () => {
                sessionStore.clear();
                if (configService.getValue(setting)) {
                    sessionStore.add(languageFeaturesService.codeActionProvider.register('*', instantiationService.createInstance(SurroundWithSnippetCodeActionProvider)));
                    sessionStore.add(languageFeaturesService.codeActionProvider.register('*', instantiationService.createInstance(FileTemplateCodeActionProvider)));
                }
            };
            update();
            this._store.add(configService.onDidChangeConfiguration(e => e.affectsConfiguration(setting) && update()));
            this._store.add(sessionStore);
        }
        dispose() {
            this._store.dispose();
        }
    };
    exports.SnippetCodeActions = SnippetCodeActions;
    exports.SnippetCodeActions = SnippetCodeActions = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, configuration_1.IConfigurationService)
    ], SnippetCodeActions);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldENvZGVBY3Rpb25Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc25pcHBldHMvYnJvd3Nlci9zbmlwcGV0Q29kZUFjdGlvblByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFrQmhHLElBQU0scUNBQXFDLEdBQTNDLE1BQU0scUNBQXFDOztpQkFFbEIsc0JBQWlCLEdBQUcsQ0FBQyxBQUFKLENBQUs7aUJBRXRCLCtCQUEwQixHQUFlO1lBQ2hFLElBQUksRUFBRSxzQkFBYyxDQUFDLFlBQVksQ0FBQyxLQUFLO1lBQ3ZDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsU0FBUyxDQUFDO1lBQ2xDLE9BQU8sRUFBRTtnQkFDUixFQUFFLEVBQUUscURBQStCLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQzlDLEtBQUssRUFBRSxxREFBK0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUs7YUFDMUQ7U0FDRCxBQVBpRCxDQU9oRDtRQUVGLFlBQStDLGVBQWlDO1lBQWpDLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtRQUFJLENBQUM7UUFFckYsS0FBSyxDQUFDLGtCQUFrQixDQUFDLEtBQWlCLEVBQUUsS0FBd0I7WUFFbkUsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztnQkFDckIsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLHFCQUFTLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ2hHLE1BQU0sUUFBUSxHQUFHLE1B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