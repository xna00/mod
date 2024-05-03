/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/language/common/languageService"], function (require, exports, nls, extensionsRegistry_1, languageService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.grammarsExtPoint = void 0;
    exports.grammarsExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'grammars',
        deps: [languageService_1.languagesExtPoint],
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.grammars', 'Contributes textmate tokenizers.'),
            type: 'array',
            defaultSnippets: [{ body: [{ language: '${1:id}', scopeName: 'source.${2:id}', path: './syntaxes/${3:id}.tmLanguage.' }] }],
            items: {
                type: 'object',
                defaultSnippets: [{ body: { language: '${1:id}', scopeName: 'source.${2:id}', path: './syntaxes/${3:id}.tmLanguage.' } }],
                properties: {
                    language: {
                        description: nls.localize('vscode.extension.contributes.grammars.language', 'Language identifier for which this syntax is contributed to.'),
                        type: 'string'
                    },
                    scopeName: {
                        description: nls.localize('vscode.extension.contributes.grammars.scopeName', 'Textmate scope name used by the tmLanguage file.'),
                        type: 'string'
                    },
                    path: {
                        description: nls.localize('vscode.extension.contributes.grammars.path', 'Path of the tmLanguage file. The path is relative to the extension folder and typically starts with \'./syntaxes/\'.'),
                        type: 'string'
                    },
                    embeddedLanguages: {
                        description: nls.localize('vscode.extension.contributes.grammars.embeddedLanguages', 'A map of scope name to language id if this grammar contains embedded languages.'),
                        type: 'object'
                    },
                    tokenTypes: {
                        description: nls.localize('vscode.extension.contributes.grammars.tokenTypes', 'A map of scope name to token types.'),
                        type: 'object',
                        additionalProperties: {
                            enum: ['string', 'comment', 'other']
                        }
                    },
                    injectTo: {
                        description: nls.localize('vscode.extension.contributes.grammars.injectTo', 'List of language scope names to which this grammar is injected to.'),
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    balancedBracketScopes: {
                        description: nls.localize('vscode.extension.contributes.grammars.balancedBracketScopes', 'Defines which scope names contain balanced brackets.'),
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        default: ['*'],
                    },
                    unbalancedBracketScopes: {
                        description: nls.localize('vscode.extension.contributes.grammars.unbalancedBracketScopes', 'Defines which scope names do not contain balanced brackets.'),
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        default: [],
                    },
                },
                required: ['scopeName', 'path']
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVE1HcmFtbWFycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRNYXRlL2NvbW1vbi9UTUdyYW1tYXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXlCbkYsUUFBQSxnQkFBZ0IsR0FBK0MsdUNBQWtCLENBQUMsc0JBQXNCLENBQTRCO1FBQ2hKLGNBQWMsRUFBRSxVQUFVO1FBQzFCLElBQUksRUFBRSxDQUFDLG1DQUFpQixDQUFDO1FBQ3pCLFVBQVUsRUFBRTtZQUNYLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHVDQUF1QyxFQUFFLGtDQUFrQyxDQUFDO1lBQ3RHLElBQUksRUFBRSxPQUFPO1lBQ2IsZUFBZSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxnQ0FBZ0MsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUMzSCxLQUFLLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsZUFBZSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsZ0NBQWdDLEVBQUUsRUFBRSxDQUFDO2dCQUN6SCxVQUFVLEVBQUU7b0JBQ1gsUUFBUSxFQUFFO3dCQUNULFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGdEQUFnRCxFQUFFLDhEQUE4RCxDQUFDO3dCQUMzSSxJQUFJLEVBQUUsUUFBUTtxQkFDZDtvQkFDRCxTQUFTLEVBQUU7d0JBQ1YsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsaURBQWlELEVBQUUsa0RBQWtELENBQUM7d0JBQ2hJLElBQUksRUFBRSxRQUFRO3FCQUNkO29CQUNELElBQUksRUFBRTt3QkFDTCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyw0Q0FBNEMsRUFBRSxzSEFBc0gsQ0FBQzt3QkFDL0wsSUFBSSxFQUFFLFFBQVE7cUJBQ2Q7b0JBQ0QsaUJBQWlCLEVBQUU7d0JBQ2xCLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHlEQUF5RCxFQUFFLGlGQUFpRixDQUFDO3dCQUN2SyxJQUFJLEVBQUUsUUFBUTtxQkFDZDtvQkFDRCxVQUFVLEVBQUU7d0JBQ1gsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsa0RBQWtELEVBQUUscUNBQXFDLENBQUM7d0JBQ3BILElBQUksRUFBRSxRQUFRO3dCQUNkLG9CQUFvQixFQUFFOzRCQUNyQixJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQzt5QkFDcEM7cUJBQ0Q7b0JBQ0QsUUFBUSxFQUFFO3dCQUNULFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGdEQUFnRCxFQUFFLG9FQUFvRSxDQUFDO3dCQUNqSixJQUFJLEVBQUUsT0FBTzt3QkFDYixLQUFLLEVBQUU7NEJBQ04sSUFBSSxFQUFFLFFBQVE7eUJBQ2Q7cUJBQ0Q7b0JBQ0QscUJBQXFCLEVBQUU7d0JBQ3RCLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDZEQUE2RCxFQUFFLHNEQUFzRCxDQUFDO3dCQUNoSixJQUFJLEVBQUUsT0FBTzt3QkFDYixLQUFLLEVBQUU7NEJBQ04sSUFBSSxFQUFFLFFBQVE7eUJBQ2Q7d0JBQ0QsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO3FCQUNkO29CQUNELHVCQUF1QixFQUFFO3dCQUN4QixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywrREFBK0QsRUFBRSw2REFBNkQsQ0FBQzt3QkFDekosSUFBSSxFQUFFLE9BQU87d0JBQ2IsS0FBSyxFQUFFOzRCQUNOLElBQUksRUFBRSxRQUFRO3lCQUNkO3dCQUNELE9BQU8sRUFBRSxFQUFFO3FCQUNYO2lCQUNEO2dCQUNELFFBQVEsRUFBRSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUM7YUFDL0I7U0FDRDtLQUNELENBQUMsQ0FBQyJ9