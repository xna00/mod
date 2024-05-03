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
define(["require", "exports", "vs/nls", "vs/editor/common/services/languagesAssociations", "vs/base/common/resources", "vs/editor/common/languages/language", "vs/editor/common/services/languageService", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/base/common/arrays", "vs/base/common/htmlContent"], function (require, exports, nls_1, languagesAssociations_1, resources_1, language_1, languageService_1, configuration_1, environment_1, files_1, extensions_1, extensionsRegistry_1, extensions_2, log_1, lifecycle_1, extensionFeatures_1, platform_1, descriptors_1, arrays_1, htmlContent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchLanguageService = exports.languagesExtPoint = void 0;
    exports.languagesExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'languages',
        jsonSchema: {
            description: (0, nls_1.localize)('vscode.extension.contributes.languages', 'Contributes language declarations.'),
            type: 'array',
            items: {
                type: 'object',
                defaultSnippets: [{ body: { id: '${1:languageId}', aliases: ['${2:label}'], extensions: ['${3:extension}'], configuration: './language-configuration.json' } }],
                properties: {
                    id: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.languages.id', 'ID of the language.'),
                        type: 'string'
                    },
                    aliases: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.languages.aliases', 'Name aliases for the language.'),
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    extensions: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.languages.extensions', 'File extensions associated to the language.'),
                        default: ['.foo'],
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    filenames: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.languages.filenames', 'File names associated to the language.'),
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    filenamePatterns: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.languages.filenamePatterns', 'File name glob patterns associated to the language.'),
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    mimetypes: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.languages.mimetypes', 'Mime types associated to the language.'),
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    firstLine: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.languages.firstLine', 'A regular expression matching the first line of a file of the language.'),
                        type: 'string'
                    },
                    configuration: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.languages.configuration', 'A relative path to a file containing configuration options for the language.'),
                        type: 'string',
                        default: './language-configuration.json'
                    },
                    icon: {
                        type: 'object',
                        description: (0, nls_1.localize)('vscode.extension.contributes.languages.icon', 'A icon to use as file icon, if no icon theme provides one for the language.'),
                        properties: {
                            light: {
                                description: (0, nls_1.localize)('vscode.extension.contributes.languages.icon.light', 'Icon path when a light theme is used'),
                                type: 'string'
                            },
                            dark: {
                                description: (0, nls_1.localize)('vscode.extension.contributes.languages.icon.dark', 'Icon path when a dark theme is used'),
                                type: 'string'
                            }
                        }
                    }
                }
            }
        },
        activationEventsGenerator: (languageContributions, result) => {
            for (const languageContribution of languageContributions) {
                if (languageContribution.id && languageContribution.configuration) {
                    result.push(`onLanguage:${languageContribution.id}`);
                }
            }
        }
    });
    class LanguageTableRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.languages;
        }
        render(manifest) {
            const contributes = manifest.contributes;
            const rawLanguages = contributes?.languages || [];
            const languages = rawLanguages.map(l => ({
                id: l.id,
                name: (l.aliases || [])[0] || l.id,
                extensions: l.extensions || [],
                hasGrammar: false,
                hasSnippets: false
            }));
            const byId = (0, arrays_1.index)(languages, l => l.id);
            const grammars = contributes?.grammars || [];
            grammars.forEach(grammar => {
                let language = byId[grammar.language];
                if (language) {
                    language.hasGrammar = true;
                }
                else {
                    language = { id: grammar.language, name: grammar.language, extensions: [], hasGrammar: true, hasSnippets: false };
                    byId[language.id] = language;
                    languages.push(language);
                }
            });
            const snippets = contributes?.snippets || [];
            snippets.forEach(snippet => {
                let language = byId[snippet.language];
                if (language) {
                    language.hasSnippets = true;
                }
                else {
                    language = { id: snippet.language, name: snippet.language, extensions: [], hasGrammar: false, hasSnippets: true };
                    byId[language.id] = language;
                    languages.push(language);
                }
            });
            if (!languages.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                (0, nls_1.localize)('language id', "ID"),
                (0, nls_1.localize)('language name', "Name"),
                (0, nls_1.localize)('file extensions', "File Extensions"),
                (0, nls_1.localize)('grammar', "Grammar"),
                (0, nls_1.localize)('snippets', "Snippets")
            ];
            const rows = languages.sort((a, b) => a.id.localeCompare(b.id))
                .map(l => {
                return [
                    l.id, l.name,
                    new htmlContent_1.MarkdownString().appendMarkdown(`${l.extensions.map(e => `\`${e}\``).join('&nbsp;')}`),
                    l.hasGrammar ? '✔︎' : '\u2014',
                    l.hasSnippets ? '✔︎' : '\u2014'
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
        id: 'languages',
        label: (0, nls_1.localize)('languages', "Programming Languages"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(LanguageTableRenderer),
    });
    let WorkbenchLanguageService = class WorkbenchLanguageService extends languageService_1.LanguageService {
        constructor(extensionService, configurationService, environmentService, logService) {
            super(environmentService.verbose || environmentService.isExtensionDevelopment || !environmentService.isBuilt);
            this.logService = logService;
            this._configurationService = configurationService;
            this._extensionService = extensionService;
            exports.languagesExtPoint.setHandler((extensions) => {
                const allValidLanguages = [];
                for (let i = 0, len = extensions.length; i < len; i++) {
                    const extension = extensions[i];
                    if (!Array.isArray(extension.value)) {
                        extension.collector.error((0, nls_1.localize)('invalid', "Invalid `contributes.{0}`. Expected an array.", exports.languagesExtPoint.name));
                        continue;
                    }
                    for (let j = 0, lenJ = extension.value.length; j < lenJ; j++) {
                        const ext = extension.value[j];
                        if (isValidLanguageExtensionPoint(ext, extension.description, extension.collector)) {
                            let configuration = undefined;
                            if (ext.configuration) {
                                configuration = (0, resources_1.joinPath)(extension.description.extensionLocation, ext.configuration);
                            }
                            allValidLanguages.push({
                                id: ext.id,
                                extensions: ext.extensions,
                                filenames: ext.filenames,
                                filenamePatterns: ext.filenamePatterns,
                                firstLine: ext.firstLine,
                                aliases: ext.aliases,
                                mimetypes: ext.mimetypes,
                                configuration: configuration,
                                icon: ext.icon && {
                                    light: (0, resources_1.joinPath)(extension.description.extensionLocation, ext.icon.light),
                                    dark: (0, resources_1.joinPath)(extension.description.extensionLocation, ext.icon.dark)
                                }
                            });
                        }
                    }
                }
                this._registry.setDynamicLanguages(allValidLanguages);
            });
            this.updateMime();
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(files_1.FILES_ASSOCIATIONS_CONFIG)) {
                    this.updateMime();
                }
            }));
            this._extensionService.whenInstalledExtensionsRegistered().then(() => {
                this.updateMime();
            });
            this._register(this.onDidRequestRichLanguageFeatures((languageId) => {
                // extension activation
                this._extensionService.activateByEvent(`onLanguage:${languageId}`);
                this._extensionService.activateByEvent(`onLanguage`);
            }));
        }
        updateMime() {
            const configuration = this._configurationService.getValue();
            // Clear user configured mime associations
            (0, languagesAssociations_1.clearConfiguredLanguageAssociations)();
            // Register based on settings
            if (configuration.files?.associations) {
                Object.keys(configuration.files.associations).forEach(pattern => {
                    const langId = configuration.files.associations[pattern];
                    if (typeof langId !== 'string') {
                        this.logService.warn(`Ignoring configured 'files.associations' for '${pattern}' because its type is not a string but '${typeof langId}'`);
                        return; // https://github.com/microsoft/vscode/issues/147284
                    }
                    const mimeType = this.getMimeType(langId) || `text/x-${langId}`;
                    (0, languagesAssociations_1.registerConfiguredLanguageAssociation)({ id: langId, mime: mimeType, filepattern: pattern });
                });
            }
            this._onDidChange.fire();
        }
    };
    exports.WorkbenchLanguageService = WorkbenchLanguageService;
    exports.WorkbenchLanguageService = WorkbenchLanguageService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, log_1.ILogService)
    ], WorkbenchLanguageService);
    function isUndefinedOrStringArray(value) {
        if (typeof value === 'undefined') {
            return true;
        }
        if (!Array.isArray(value)) {
            return false;
        }
        return value.every(item => typeof item === 'string');
    }
    function isValidLanguageExtensionPoint(value, extension, collector) {
        if (!value) {
            collector.error((0, nls_1.localize)('invalid.empty', "Empty value for `contributes.{0}`", exports.languagesExtPoint.name));
            return false;
        }
        if (typeof value.id !== 'string') {
            collector.error((0, nls_1.localize)('require.id', "property `{0}` is mandatory and must be of type `string`", 'id'));
            return false;
        }
        if (!isUndefinedOrStringArray(value.extensions)) {
            collector.error((0, nls_1.localize)('opt.extensions', "property `{0}` can be omitted and must be of type `string[]`", 'extensions'));
            return false;
        }
        if (!isUndefinedOrStringArray(value.filenames)) {
            collector.error((0, nls_1.localize)('opt.filenames', "property `{0}` can be omitted and must be of type `string[]`", 'filenames'));
            return false;
        }
        if (typeof value.firstLine !== 'undefined' && typeof value.firstLine !== 'string') {
            collector.error((0, nls_1.localize)('opt.firstLine', "property `{0}` can be omitted and must be of type `string`", 'firstLine'));
            return false;
        }
        if (typeof value.configuration !== 'undefined' && typeof value.configuration !== 'string') {
            collector.error((0, nls_1.localize)('opt.configuration', "property `{0}` can be omitted and must be of type `string`", 'configuration'));
            return false;
        }
        if (!isUndefinedOrStringArray(value.aliases)) {
            collector.error((0, nls_1.localize)('opt.aliases', "property `{0}` can be omitted and must be of type `string[]`", 'aliases'));
            return false;
        }
        if (!isUndefinedOrStringArray(value.mimetypes)) {
            collector.error((0, nls_1.localize)('opt.mimetypes', "property `{0}` can be omitted and must be of type `string[]`", 'mimetypes'));
            return false;
        }
        if (typeof value.icon !== 'undefined') {
            if (typeof value.icon !== 'object' || typeof value.icon.light !== 'string' || typeof value.icon.dark !== 'string') {
                collector.error((0, nls_1.localize)('opt.icon', "property `{0}` can be omitted and must be of type `object` with properties `{1}` and `{2}` of type `string`", 'icon', 'light', 'dark'));
                return false;
            }
        }
        return true;
    }
    (0, extensions_2.registerSingleton)(language_1.ILanguageService, WorkbenchLanguageService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvbGFuZ3VhZ2UvY29tbW9uL2xhbmd1YWdlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQ25GLFFBQUEsaUJBQWlCLEdBQWtELHVDQUFrQixDQUFDLHNCQUFzQixDQUErQjtRQUN2SixjQUFjLEVBQUUsV0FBVztRQUMzQixVQUFVLEVBQUU7WUFDWCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0NBQXdDLEVBQUUsb0NBQW9DLENBQUM7WUFDckcsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsZUFBZSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxhQUFhLEVBQUUsK0JBQStCLEVBQUUsRUFBRSxDQUFDO2dCQUMvSixVQUFVLEVBQUU7b0JBQ1gsRUFBRSxFQUFFO3dCQUNILFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywyQ0FBMkMsRUFBRSxxQkFBcUIsQ0FBQzt3QkFDekYsSUFBSSxFQUFFLFFBQVE7cUJBQ2Q7b0JBQ0QsT0FBTyxFQUFFO3dCQUNSLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxnREFBZ0QsRUFBRSxnQ0FBZ0MsQ0FBQzt3QkFDekcsSUFBSSxFQUFFLE9BQU87d0JBQ2IsS0FBSyxFQUFFOzRCQUNOLElBQUksRUFBRSxRQUFRO3lCQUNkO3FCQUNEO29CQUNELFVBQVUsRUFBRTt3QkFDWCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsbURBQW1E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