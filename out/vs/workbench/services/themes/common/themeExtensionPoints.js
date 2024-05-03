/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/resources", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/base/common/htmlContent", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors"], function (require, exports, nls, types, resources, extensionsRegistry_1, workbenchThemeService_1, event_1, lifecycle_1, extensionFeatures_1, htmlContent_1, platform_1, descriptors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeRegistry = void 0;
    exports.registerColorThemeExtensionPoint = registerColorThemeExtensionPoint;
    exports.registerFileIconThemeExtensionPoint = registerFileIconThemeExtensionPoint;
    exports.registerProductIconThemeExtensionPoint = registerProductIconThemeExtensionPoint;
    function registerColorThemeExtensionPoint() {
        return extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
            extensionPoint: 'themes',
            jsonSchema: {
                description: nls.localize('vscode.extension.contributes.themes', 'Contributes textmate color themes.'),
                type: 'array',
                items: {
                    type: 'object',
                    defaultSnippets: [{ body: { label: '${1:label}', id: '${2:id}', uiTheme: workbenchThemeService_1.VS_DARK_THEME, path: './themes/${3:id}.tmTheme.' } }],
                    properties: {
                        id: {
                            description: nls.localize('vscode.extension.contributes.themes.id', 'Id of the color theme as used in the user settings.'),
                            type: 'string'
                        },
                        label: {
                            description: nls.localize('vscode.extension.contributes.themes.label', 'Label of the color theme as shown in the UI.'),
                            type: 'string'
                        },
                        uiTheme: {
                            description: nls.localize('vscode.extension.contributes.themes.uiTheme', 'Base theme defining the colors around the editor: \'vs\' is the light color theme, \'vs-dark\' is the dark color theme. \'hc-black\' is the dark high contrast theme, \'hc-light\' is the light high contrast theme.'),
                            enum: [workbenchThemeService_1.VS_LIGHT_THEME, workbenchThemeService_1.VS_DARK_THEME, workbenchThemeService_1.VS_HC_THEME, workbenchThemeService_1.VS_HC_LIGHT_THEME]
                        },
                        path: {
                            description: nls.localize('vscode.extension.contributes.themes.path', 'Path of the tmTheme file. The path is relative to the extension folder and is typically \'./colorthemes/awesome-color-theme.json\'.'),
                            type: 'string'
                        }
                    },
                    required: ['path', 'uiTheme']
                }
            }
        });
    }
    function registerFileIconThemeExtensionPoint() {
        return extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
            extensionPoint: 'iconThemes',
            jsonSchema: {
                description: nls.localize('vscode.extension.contributes.iconThemes', 'Contributes file icon themes.'),
                type: 'array',
                items: {
                    type: 'object',
                    defaultSnippets: [{ body: { id: '${1:id}', label: '${2:label}', path: './fileicons/${3:id}-icon-theme.json' } }],
                    properties: {
                        id: {
                            description: nls.localize('vscode.extension.contributes.iconThemes.id', 'Id of the file icon theme as used in the user settings.'),
                            type: 'string'
                        },
                        label: {
                            description: nls.localize('vscode.extension.contributes.iconThemes.label', 'Label of the file icon theme as shown in the UI.'),
                            type: 'string'
                        },
                        path: {
                            description: nls.localize('vscode.extension.contributes.iconThemes.path', 'Path of the file icon theme definition file. The path is relative to the extension folder and is typically \'./fileicons/awesome-icon-theme.json\'.'),
                            type: 'string'
                        }
                    },
                    required: ['path', 'id']
                }
            }
        });
    }
    function registerProductIconThemeExtensionPoint() {
        return extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
            extensionPoint: 'productIconThemes',
            jsonSchema: {
                description: nls.localize('vscode.extension.contributes.productIconThemes', 'Contributes product icon themes.'),
                type: 'array',
                items: {
                    type: 'object',
                    defaultSnippets: [{ body: { id: '${1:id}', label: '${2:label}', path: './producticons/${3:id}-product-icon-theme.json' } }],
                    properties: {
                        id: {
                            description: nls.localize('vscode.extension.contributes.productIconThemes.id', 'Id of the product icon theme as used in the user settings.'),
                            type: 'string'
                        },
                        label: {
                            description: nls.localize('vscode.extension.contributes.productIconThemes.label', 'Label of the product icon theme as shown in the UI.'),
                            type: 'string'
                        },
                        path: {
                            description: nls.localize('vscode.extension.contributes.productIconThemes.path', 'Path of the product icon theme definition file. The path is relative to the extension folder and is typically \'./producticons/awesome-product-icon-theme.json\'.'),
                            type: 'string'
                        }
                    },
                    required: ['path', 'id']
                }
            }
        });
    }
    class ThemeDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'markdown';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.themes || !!manifest.contributes?.iconThemes || !!manifest.contributes?.productIconThemes;
        }
        render(manifest) {
            const markdown = new htmlContent_1.MarkdownString();
            if (manifest.contributes?.themes) {
                markdown.appendMarkdown(`### ${nls.localize('color themes', "Color Themes")}\n\n`);
                for (const theme of manifest.contributes.themes) {
                    markdown.appendMarkdown(`- ${theme.label}\n`);
                }
            }
            if (manifest.contributes?.iconThemes) {
                markdown.appendMarkdown(`### ${nls.localize('file icon themes', "File Icon Themes")}\n\n`);
                for (const theme of manifest.contributes.iconThemes) {
                    markdown.appendMarkdown(`- ${theme.label}\n`);
                }
            }
            if (manifest.contributes?.productIconThemes) {
                markdown.appendMarkdown(`### ${nls.localize('product icon themes', "Product Icon Themes")}\n\n`);
                for (const theme of manifest.contributes.productIconThemes) {
                    markdown.appendMarkdown(`- ${theme.label}\n`);
                }
            }
            return {
                data: markdown,
                dispose: () => { }
            };
        }
    }
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'themes',
        label: nls.localize('themes', "Themes"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(ThemeDataRenderer),
    });
    class ThemeRegistry {
        constructor(themesExtPoint, create, idRequired = false, builtInTheme = undefined) {
            this.themesExtPoint = themesExtPoint;
            this.create = create;
            this.idRequired = idRequired;
            this.builtInTheme = builtInTheme;
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.extensionThemes = [];
            this.initialize();
        }
        dispose() {
            this.themesExtPoint.setHandler(() => { });
        }
        initialize() {
            this.themesExtPoint.setHandler((extensions, delta) => {
                const previousIds = {};
                const added = [];
                for (const theme of this.extensionThemes) {
                    previousIds[theme.id] = theme;
                }
                this.extensionThemes.length = 0;
                for (const ext of extensions) {
                    const extensionData = workbenchThemeService_1.ExtensionData.fromName(ext.description.publisher, ext.description.name, ext.description.isBuiltin);
                    this.onThemes(extensionData, ext.description.extensionLocation, ext.value, this.extensionThemes, ext.collector);
                }
                for (const theme of this.extensionThemes) {
                    if (!previousIds[theme.id]) {
                        added.push(theme);
                    }
                    else {
                        delete previousIds[theme.id];
                    }
                }
                const removed = Object.values(previousIds);
                this.onDidChangeEmitter.fire({ themes: this.extensionThemes, added, removed });
            });
        }
        onThemes(extensionData, extensionLocation, themeContributions, resultingThemes = [], log) {
            if (!Array.isArray(themeContributions)) {
                log?.error(nls.localize('reqarray', "Extension point `{0}` must be an array.", this.themesExtPoint.name));
                return resultingThemes;
            }
            themeContributions.forEach(theme => {
                if (!theme.path || !types.isString(theme.path)) {
                    log?.error(nls.localize('reqpath', "Expected string in `contributes.{0}.path`. Provided value: {1}", this.themesExtPoint.name, String(theme.path)));
                    return;
                }
                if (this.idRequired && (!theme.id || !types.isString(theme.id))) {
                    log?.error(nls.localize('reqid', "Expected string in `contributes.{0}.id`. Provided value: {1}", this.themesExtPoint.name, String(theme.id)));
                    return;
                }
                const themeLocation = resources.joinPath(extensionLocation, theme.path);
                if (!resources.isEqualOrParent(themeLocation, extensionLocation)) {
                    log?.warn(nls.localize('invalid.path.1', "Expected `contributes.{0}.path` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", this.themesExtPoint.name, themeLocation.path, extensionLocation.path));
                }
                const themeData = this.create(theme, themeLocation, extensionData);
                resultingThemes.push(themeData);
            });
            return resultingThemes;
        }
        findThemeById(themeId) {
            if (this.builtInTheme && this.builtInTheme.id === themeId) {
                return this.builtInTheme;
            }
            const allThemes = this.getThemes();
            for (const t of allThemes) {
                if (t.id === themeId) {
                    return t;
                }
            }
            return undefined;
        }
        findThemeBySettingsId(settingsId, defaultSettingsId) {
            if (this.builtInTheme && this.builtInTheme.settingsId === settingsId) {
                return this.builtInTheme;
            }
            const allThemes = this.getThemes();
            let defaultTheme = undefined;
            for (const t of allThemes) {
                if (t.settingsId === settingsId) {
                    return t;
                }
                if (t.settingsId === defaultSettingsId) {
                    defaultTheme = t;
                }
            }
            return defaultTheme;
        }
        findThemeByExtensionLocation(extLocation) {
            if (extLocation) {
                return this.getThemes().filter(t => t.location && resources.isEqualOrParent(t.location, extLocation));
            }
            return [];
        }
        getThemes() {
            return this.extensionThemes;
        }
        getMarketplaceThemes(manifest, extensionLocation, extensionData) {
            const themes = manifest?.contributes?.[this.themesExtPoint.name];
            if (Array.isArray(themes)) {
                return this.onThemes(extensionData, extensionLocation, themes);
            }
            return [];
        }
    }
    exports.ThemeRegistry = ThemeRegistry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVFeHRlbnNpb25Qb2ludHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90aGVtZXMvY29tbW9uL3RoZW1lRXh0ZW5zaW9uUG9pbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsNEVBK0JDO0lBQ0Qsa0ZBMkJDO0lBRUQsd0ZBMkJDO0lBeEZELFNBQWdCLGdDQUFnQztRQUMvQyxPQUFPLHVDQUFrQixDQUFDLHNCQUFzQixDQUF5QjtZQUN4RSxjQUFjLEVBQUUsUUFBUTtZQUN4QixVQUFVLEVBQUU7Z0JBQ1gsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMscUNBQXFDLEVBQUUsb0NBQW9DLENBQUM7Z0JBQ3RHLElBQUksRUFBRSxPQUFPO2dCQUNiLEtBQUssRUFBRTtvQkFDTixJQUFJLEVBQUUsUUFBUTtvQkFDZCxlQUFlLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUscUNBQWEsRUFBRSxJQUFJLEVBQUUsMkJBQTJCLEVBQUUsRUFBRSxDQUFDO29CQUM5SCxVQUFVLEVBQUU7d0JBQ1gsRUFBRSxFQUFFOzRCQUNILFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHdDQUF3QyxFQUFFLHFEQUFxRCxDQUFDOzRCQUMxSCxJQUFJLEVBQUUsUUFBUTt5QkFDZDt3QkFDRCxLQUFLLEVBQUU7NEJBQ04sV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsMkNBQTJDLEVBQUUsOENBQThDLENBQUM7NEJBQ3RILElBQUksRUFBRSxRQUFRO3lCQUNkO3dCQUNELE9BQU8sRUFBRTs0QkFDUixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyw2Q0FBNkMs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