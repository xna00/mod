/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/descriptors", "vs/platform/registry/common/platform", "vs/workbench/contrib/localization/common/localizationsActions", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/workbench/services/extensions/common/extensionsRegistry"], function (require, exports, lifecycle_1, nls_1, actions_1, descriptors_1, platform_1, localizationsActions_1, extensionFeatures_1, extensionsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseLocalizationWorkbenchContribution = void 0;
    class BaseLocalizationWorkbenchContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            // Register action to configure locale and related settings
            (0, actions_1.registerAction2)(localizationsActions_1.ConfigureDisplayLanguageAction);
            (0, actions_1.registerAction2)(localizationsActions_1.ClearDisplayLanguageAction);
            extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
                extensionPoint: 'localizations',
                defaultExtensionKind: ['ui', 'workspace'],
                jsonSchema: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.localizations', "Contributes localizations to the editor"),
                    type: 'array',
                    default: [],
                    items: {
                        type: 'object',
                        required: ['languageId', 'translations'],
                        defaultSnippets: [{ body: { languageId: '', languageName: '', localizedLanguageName: '', translations: [{ id: 'vscode', path: '' }] } }],
                        properties: {
                            languageId: {
                                description: (0, nls_1.localize)('vscode.extension.contributes.localizations.languageId', 'Id of the language into which the display strings are translated.'),
                                type: 'string'
                            },
                            languageName: {
                                description: (0, nls_1.localize)('vscode.extension.contributes.localizations.languageName', 'Name of the language in English.'),
                                type: 'string'
                            },
                            localizedLanguageName: {
                                description: (0, nls_1.localize)('vscode.extension.contributes.localizations.languageNameLocalized', 'Name of the language in contributed language.'),
                                type: 'string'
                            },
                            translations: {
                                description: (0, nls_1.localize)('vscode.extension.contributes.localizations.translations', 'List of translations associated to the language.'),
                                type: 'array',
                                default: [{ id: 'vscode', path: '' }],
                                items: {
                                    type: 'object',
                                    required: ['id', 'path'],
                                    properties: {
                                        id: {
                                            type: 'string',
                                            description: (0, nls_1.localize)('vscode.extension.contributes.localizations.translations.id', "Id of VS Code or Extension for which this translation is contributed to. Id of VS Code is always `vscode` and of extension should be in format `publisherId.extensionName`."),
                                            pattern: '^((vscode)|([a-z0-9A-Z][a-z0-9A-Z-]*)\\.([a-z0-9A-Z][a-z0-9A-Z-]*))$',
                                            patternErrorMessage: (0, nls_1.localize)('vscode.extension.contributes.localizations.translations.id.pattern', "Id should be `vscode` or in format `publisherId.extensionName` for translating VS code or an extension respectively.")
                                        },
                                        path: {
                                            type: 'string',
                                            description: (0, nls_1.localize)('vscode.extension.contributes.localizations.translations.path', "A relative path to a file containing translations for the language.")
                                        }
                                    },
                                    defaultSnippets: [{ body: { id: '', path: '' } }],
                                },
                            }
                        }
                    }
                }
            });
        }
    }
    exports.BaseLocalizationWorkbenchContribution = BaseLocalizationWorkbenchContribution;
    class LocalizationsDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.localizations;
        }
        render(manifest) {
            const localizations = manifest.contributes?.localizations || [];
            if (!localizations.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                (0, nls_1.localize)('language id', "Language ID"),
                (0, nls_1.localize)('localizations language name', "Language Name"),
                (0, nls_1.localize)('localizations localized language name', "Language Name (Localized)"),
            ];
            const rows = localizations
                .sort((a, b) => a.languageId.localeCompare(b.languageId))
                .map(localization => {
                return [
                    localization.languageId,
                    localization.languageName ?? '',
                    localization.localizedLanguageName ?? ''
                ];
            });
            return {
                data: {
                    headers,
                    rows
                },
                dispose: () => { }
            };
        }
    }
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'localizations',
        label: (0, nls_1.localize)('localizations', "Langauage Packs"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(LocalizationsDataRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxpemF0aW9uLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbG9jYWxpemF0aW9uL2NvbW1vbi9sb2NhbGl6YXRpb24uY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFhLHFDQUFzQyxTQUFRLHNCQUFVO1FBQ3BFO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFFUiwyREFBMkQ7WUFDM0QsSUFBQSx5QkFBZSxFQUFDLHFEQUE4QixDQUFDLENBQUM7WUFDaEQsSUFBQSx5QkFBZSxFQUFDLGlEQUEwQixDQUFDLENBQUM7WUFFNUMsdUNBQWtCLENBQUMsc0JBQXNCLENBQUM7Z0JBQ3pDLGNBQWMsRUFBRSxlQUFlO2dCQUMvQixvQkFBb0IsRUFBRSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUM7Z0JBQ3pDLFVBQVUsRUFBRTtvQkFDWCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsNENBQTRDLEVBQUUseUNBQXlDLENBQUM7b0JBQzlHLElBQUksRUFBRSxPQUFPO29CQUNiLE9BQU8sRUFBRSxFQUFFO29CQUNYLEtBQUssRUFBRTt3QkFDTixJQUFJLEVBQUUsUUFBUTt3QkFDZCxRQUFRLEVBQUUsQ0FBQyxZQUFZLEVBQUUsY0FBYyxDQUFDO3dCQUN4QyxlQUFlLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxxQkFBcUIsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDeEksVUFBVSxFQUFFOzRCQUNYLFVBQVUsRUFBRTtn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