/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/extensions", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/snippets/browser/commands/configureSnippets", "vs/workbench/contrib/snippets/browser/commands/fileTemplateSnippets", "vs/workbench/contrib/snippets/browser/commands/insertSnippet", "vs/workbench/contrib/snippets/browser/commands/surroundWithSnippet", "vs/workbench/contrib/snippets/browser/snippetCodeActionProvider", "vs/workbench/contrib/snippets/browser/snippets", "vs/workbench/contrib/snippets/browser/snippetsService", "vs/platform/configuration/common/configurationRegistry", "vs/editor/common/config/editorConfigurationSchema", "vs/workbench/contrib/snippets/browser/tabCompletion"], function (require, exports, nls, actions_1, commands_1, extensions_1, JSONContributionRegistry, platform_1, contributions_1, configureSnippets_1, fileTemplateSnippets_1, insertSnippet_1, surroundWithSnippet_1, snippetCodeActionProvider_1, snippets_1, snippetsService_1, configurationRegistry_1, editorConfigurationSchema_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // service
    (0, extensions_1.registerSingleton)(snippets_1.ISnippetsService, snippetsService_1.SnippetsService, 1 /* InstantiationType.Delayed */);
    // actions
    (0, actions_1.registerAction2)(insertSnippet_1.InsertSnippetAction);
    commands_1.CommandsRegistry.registerCommandAlias('editor.action.showSnippets', 'editor.action.insertSnippet');
    (0, actions_1.registerAction2)(surroundWithSnippet_1.SurroundWithSnippetEditorAction);
    (0, actions_1.registerAction2)(fileTemplateSnippets_1.ApplyFileSnippetAction);
    (0, actions_1.registerAction2)(configureSnippets_1.ConfigureSnippetsAction);
    // workbench contribs
    const workbenchContribRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContribRegistry.registerWorkbenchContribution(snippetCodeActionProvider_1.SnippetCodeActions, 3 /* LifecyclePhase.Restored */);
    // config
    platform_1.Registry
        .as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        ...editorConfigurationSchema_1.editorConfigurationBaseNode,
        'properties': {
            'editor.snippets.codeActions.enabled': {
                'description': nls.localize('editor.snippets.codeActions.enabled', 'Controls if surround-with-snippets or file template snippets show as Code Actions.'),
                'type': 'boolean',
                'default': true
            }
        }
    });
    // schema
    const languageScopeSchemaId = 'vscode://schemas/snippets';
    const snippetSchemaProperties = {
        prefix: {
            description: nls.localize('snippetSchema.json.prefix', 'The prefix to use when selecting the snippet in intellisense'),
            type: ['string', 'array']
        },
        isFileTemplate: {
            description: nls.localize('snippetSchema.json.isFileTemplate', 'The snippet is meant to populate or replace a whole file'),
            type: 'boolean'
        },
        body: {
            markdownDescription: nls.localize('snippetSchema.json.body', 'The snippet content. Use `$1`, `${1:defaultText}` to define cursor positions, use `$0` for the final cursor position. Insert variable values with `${varName}` and `${varName:defaultText}`, e.g. `This is file: $TM_FILENAME`.'),
            type: ['string', 'array'],
            items: {
                type: 'string'
            }
        },
        description: {
            description: nls.localize('snippetSchema.json.description', 'The snippet description.'),
            type: ['string', 'array']
        }
    };
    const languageScopeSchema = {
        id: languageScopeSchemaId,
        allowComments: true,
        allowTrailingCommas: true,
        defaultSnippets: [{
                label: nls.localize('snippetSchema.json.default', "Empty snippet"),
                body: { '${1:snippetName}': { 'prefix': '${2:prefix}', 'body': '${3:snippet}', 'description': '${4:description}' } }
            }],
        type: 'object',
        description: nls.localize('snippetSchema.json', 'User snippet configuration'),
        additionalProperties: {
            type: 'object',
            required: ['body'],
            properties: snippetSchemaProperties,
            additionalProperties: false
        }
    };
    const globalSchemaId = 'vscode://schemas/global-snippets';
    const globalSchema = {
        id: globalSchemaId,
        allowComments: true,
        allowTrailingCommas: true,
        defaultSnippets: [{
                label: nls.localize('snippetSchema.json.default', "Empty snippet"),
                body: { '${1:snippetName}': { 'scope': '${2:scope}', 'prefix': '${3:prefix}', 'body': '${4:snippet}', 'description': '${5:description}' } }
            }],
        type: 'object',
        description: nls.localize('snippetSchema.json', 'User snippet configuration'),
        additionalProperties: {
            type: 'object',
            required: ['body'],
            properties: {
                ...snippetSchemaProperties,
                scope: {
                    description: nls.localize('snippetSchema.json.scope', "A list of language names to which this snippet applies, e.g. 'typescript,javascript'."),
                    type: 'string'
                }
            },
            additionalProperties: false
        }
    };
    const reg = platform_1.Registry.as(JSONContributionRegistry.Extensions.JSONContribution);
    reg.registerSchema(languageScopeSchemaId, languageScopeSchema);
    reg.registerSchema(globalSchemaId, globalSchema);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zbmlwcGV0cy9icm93c2VyL3NuaXBwZXRzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXVCaEcsVUFBVTtJQUNWLElBQUEsOEJBQWlCLEVBQUMsMkJBQWdCLEVBQUUsaUNBQWUsb0NBQTRCLENBQUM7SUFFaEYsVUFBVTtJQUNWLElBQUEseUJBQWUsRUFBQyxtQ0FBbUIsQ0FBQyxDQUFDO0lBQ3JDLDJCQUFnQixDQUFDLG9CQUFvQixDQUFDLDRCQUE0QixFQUFFLDZCQUE2QixDQUFDLENBQUM7SUFDbkcsSUFBQSx5QkFBZSxFQUFDLHFEQUErQixDQUFDLENBQUM7SUFDakQsSUFBQSx5QkFBZSxFQUFDLDZDQUFzQixDQUFDLENBQUM7SUFDeEMsSUFBQSx5QkFBZSxFQUFDLDJDQUF1QixDQUFDLENBQUM7SUFFekMscUJBQXFCO0lBQ3JCLE1BQU0sd0JBQXdCLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzdHLHdCQUF3QixDQUFDLDZCQUE2QixDQUFDLDhDQUFrQixrQ0FBMEIsQ0FBQztJQUVwRyxTQUFTO0lBQ1QsbUJBQVE7U0FDTixFQUFFLENBQXlCLGtDQUFVLENBQUMsYUFBYSxDQUFDO1NBQ3BELHFCQUFxQixDQUFDO1FBQ3RCLEdBQUcsdURBQTJCO1FBQzlCLFlBQVksRUFBRTtZQUNiLHFDQUFxQyxFQUFFO2dCQUN0QyxhQUFhLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxxQ0FBcUMsRUFBRSxvRkFBb0YsQ0FBQztnQkFDeEosTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7U0FD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