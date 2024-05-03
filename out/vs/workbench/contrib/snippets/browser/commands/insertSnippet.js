/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/language", "vs/editor/contrib/snippet/browser/snippetController2", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/snippets/browser/commands/abstractSnippetsActions", "vs/workbench/contrib/snippets/browser/snippetPicker", "vs/workbench/contrib/snippets/browser/snippets", "vs/workbench/contrib/snippets/browser/snippetsFile"], function (require, exports, editorContextKeys_1, language_1, snippetController2_1, nls, clipboardService_1, instantiation_1, abstractSnippetsActions_1, snippetPicker_1, snippets_1, snippetsFile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InsertSnippetAction = void 0;
    class Args {
        static fromUser(arg) {
            if (!arg || typeof arg !== 'object') {
                return Args._empty;
            }
            let { snippet, name, langId } = arg;
            if (typeof snippet !== 'string') {
                snippet = undefined;
            }
            if (typeof name !== 'string') {
                name = undefined;
            }
            if (typeof langId !== 'string') {
                langId = undefined;
            }
            return new Args(snippet, name, langId);
        }
        static { this._empty = new Args(undefined, undefined, undefined); }
        constructor(snippet, name, langId) {
            this.snippet = snippet;
            this.name = name;
            this.langId = langId;
        }
    }
    class InsertSnippetAction extends abstractSnippetsActions_1.SnippetEditorAction {
        constructor() {
            super({
                id: 'editor.action.insertSnippet',
                title: nls.localize2('snippet.suggestions.label', "Insert Snippet"),
                f1: true,
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                metadata: {
                    description: `Insert Snippet`,
                    args: [{
                            name: 'args',
                            schema: {
                                'type': 'object',
                                'properties': {
                                    'snippet': {
                                        'type': 'string'
                                    },
                                    'langId': {
                                        'type': 'string',
                                    },
                                    'name': {
                                        'type': 'string'
                                    }
                                },
                            }
                        }]
                }
            });
        }
        async runEditorCommand(accessor, editor, arg) {
            const languageService = accessor.get(language_1.ILanguageService);
            const snippetService = accessor.get(snippets_1.ISnippetsService);
            if (!editor.hasModel()) {
                return;
            }
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const snippet = await new Promise((resolve, reject) => {
                const { lineNumber, column } = editor.getPosition();
                const { snippet, name, langId } = Args.fromUser(arg);
                if (snippet) {
                    return resolve(new snippetsFile_1.Snippet(false, [], '', '', '', snippet, '', 1 /* SnippetSource.User */, `random/${Math.random()}`));
                }
                let languageId;
                if (langId) {
                    if (!languageService.isRegisteredLanguageId(langId)) {
                        return resolve(undefined);
                    }
                    languageId = langId;
                }
                else {
                    editor.getModel().tokenization.tokenizeIfCheap(lineNumber);
                    languageId = editor.getModel().getLanguageIdAtPosition(lineNumber, column);
                    // validate the `languageId` to ensure this is a user
                    // facing language with a name and the chance to have
                    // snippets, else fall back to the outer language
                    if (!languageService.getLanguageName(languageId)) {
                        languageId = editor.getModel().getLanguageId();
                    }
                }
                if (name) {
                    // take selected snippet
                    snippetService.getSnippets(languageId, { includeNoPrefixSnippets: true })
                        .then(snippets => snippets.find(snippet => snippet.name === name))
                        .then(resolve, reject);
                }
                else {
                    // let user pick a snippet
                    resolve(instaService.invokeFunction(snippetPicker_1.pickSnippet, languageId));
                }
            });
            if (!snippet) {
                return;
            }
            let clipboardText;
            if (snippet.needsClipboard) {
                clipboardText = await clipboardService.readText();
            }
            editor.focus();
            snippetController2_1.SnippetController2.get(editor)?.insert(snippet.codeSnippet, { clipboardText });
            snippetService.updateUsageTimestamp(snippet);
        }
    }
    exports.InsertSnippetAction = InsertSnippetAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zZXJ0U25pcHBldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc25pcHBldHMvYnJvd3Nlci9jb21tYW5kcy9pbnNlcnRTbmlwcGV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFNLElBQUk7UUFFVCxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQVE7WUFDdkIsSUFBSSxDQUFDLEdBQUcsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3BCLENBQUM7WUFDRCxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUM7WUFDcEMsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxHQUFHLFNBQVMsQ0FBQztZQUNyQixDQUFDO1lBQ0QsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxHQUFHLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxHQUFHLFNBQVMsQ0FBQztZQUNwQixDQUFDO1lBQ0QsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3hDLENBQUM7aUJBRXVCLFdBQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRTNFLFlBQ2lCLE9BQTJCLEVBQzNCLElBQXdCLEVBQ3hCLE1BQTBCO1lBRjFCLFlBQU8sR0FBUCxPQUFPLENBQW9CO1lBQzNCLFNBQUksR0FBSixJQUFJLENB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