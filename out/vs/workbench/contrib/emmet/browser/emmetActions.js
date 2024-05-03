/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/workbench/services/textMate/common/TMGrammars", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands"], function (require, exports, editorExtensions_1, TMGrammars_1, extensions_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmmetEditorAction = void 0;
    class GrammarContributions {
        static { this._grammars = {}; }
        constructor(contributions) {
            if (!Object.keys(GrammarContributions._grammars).length) {
                this.fillModeScopeMap(contributions);
            }
        }
        fillModeScopeMap(contributions) {
            contributions.forEach((contribution) => {
                contribution.value.forEach((grammar) => {
                    if (grammar.language && grammar.scopeName) {
                        GrammarContributions._grammars[grammar.language] = grammar.scopeName;
                    }
                });
            });
        }
        getGrammar(mode) {
            return GrammarContributions._grammars[mode];
        }
    }
    class EmmetEditorAction extends editorExtensions_1.EditorAction {
        constructor(opts) {
            super(opts);
            this._lastGrammarContributions = null;
            this._lastExtensionService = null;
            this.emmetActionName = opts.actionName;
        }
        static { this.emmetSupportedModes = ['html', 'css', 'xml', 'xsl', 'haml', 'jade', 'jsx', 'slim', 'scss', 'sass', 'less', 'stylus', 'styl', 'svg']; }
        _withGrammarContributions(extensionService) {
            if (this._lastExtensionService !== extensionService) {
                this._lastExtensionService = extensionService;
                this._lastGrammarContributions = extensionService.readExtensionPointContributions(TMGrammars_1.grammarsExtPoint).then((contributions) => {
                    return new GrammarContributions(contributions);
                });
            }
            return this._lastGrammarContributions || Promise.resolve(null);
        }
        run(accessor, editor) {
            const extensionService = accessor.get(extensions_1.IExtensionService);
            const commandService = accessor.get(commands_1.ICommandService);
            return this._withGrammarContributions(extensionService).then((grammarContributions) => {
                if (this.id === 'editor.emmet.action.expandAbbreviation' && grammarContributions) {
                    return commandService.executeCommand('emmet.expandAbbreviation', EmmetEditorAction.getLanguage(editor, grammarContributions));
                }
                return undefined;
            });
        }
        static getLanguage(editor, grammars) {
            const model = editor.getModel();
            const selection = editor.getSelection();
            if (!model || !selection) {
                return null;
            }
            const position = selection.getStartPosition();
            model.tokenization.tokenizeIfCheap(position.lineNumber);
            const languageId = model.getLanguageIdAtPosition(position.lineNumber, position.column);
            const syntax = languageId.split('.').pop();
            if (!syntax) {
                return null;
            }
            const checkParentMode = () => {
                const languageGrammar = grammars.getGrammar(syntax);
                if (!languageGrammar) {
                    return syntax;
                }
                const languages = languageGrammar.split('.');
                if (languages.length < 2) {
                    return syntax;
                }
                for (let i = 1; i < languages.length; i++) {
                    const language = languages[languages.length - i];
                    if (this.emmetSupportedModes.indexOf(language) !== -1) {
                        return language;
                    }
                }
                return syntax;
            };
            return {
                language: syntax,
                parentMode: checkParentMode()
            };
        }
    }
    exports.EmmetEditorAction = EmmetEditorAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1tZXRBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9lbW1ldC9icm93c2VyL2VtbWV0QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHLE1BQU0sb0JBQW9CO2lCQUVWLGNBQVMsR0FBaUIsRUFBRSxDQUFDO1FBRTVDLFlBQVksYUFBc0U7WUFDakYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztRQUVPLGdCQUFnQixDQUFDLGFBQXNFO1lBQzlGLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFBRTtnQkFDdEMsWUFBWSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtvQkFDdEMsSUFBSSxPQUFPLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQzt3QkFDM0Msb0JBQW9CLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDO29CQUN0RSxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sVUFBVSxDQUFDLElBQVk7WUFDN0IsT0FBTyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsQ0FBQzs7SUFPRixNQUFzQixpQkFBa0IsU0FBUSwrQkFBWTtRQUkzRCxZQUFZLElBQXlCO1lBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZ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