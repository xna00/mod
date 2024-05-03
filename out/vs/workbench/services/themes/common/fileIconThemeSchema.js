define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/services/themes/common/productIconThemeSchema"], function (require, exports, nls, platform_1, jsonContributionRegistry_1, productIconThemeSchema_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerFileIconThemeSchemas = registerFileIconThemeSchemas;
    const schemaId = 'vscode://schemas/icon-theme';
    const schema = {
        type: 'object',
        allowComments: true,
        allowTrailingCommas: true,
        definitions: {
            folderExpanded: {
                type: 'string',
                description: nls.localize('schema.folderExpanded', 'The folder icon for expanded folders. The expanded folder icon is optional. If not set, the icon defined for folder will be shown.')
            },
            folder: {
                type: 'string',
                description: nls.localize('schema.folder', 'The folder icon for collapsed folders, and if folderExpanded is not set, also for expanded folders.')
            },
            file: {
                type: 'string',
                description: nls.localize('schema.file', 'The default file icon, shown for all files that don\'t match any extension, filename or language id.')
            },
            rootFolder: {
                type: 'string',
                description: nls.localize('schema.rootFolder', 'The folder icon for collapsed root folders, and if rootFolderExpanded is not set, also for expanded root folders.')
            },
            rootFolderExpanded: {
                type: 'string',
                description: nls.localize('schema.rootFolderExpanded', 'The folder icon for expanded root folders. The expanded root folder icon is optional. If not set, the icon defined for root folder will be shown.')
            },
            rootFolderNames: {
                type: 'object',
                description: nls.localize('schema.rootFolderNames', 'Associates root folder names to icons. The object key is the root folder name. No patterns or wildcards are allowed. Root folder name matching is case insensitive.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.folderName', 'The ID of the icon definition for the association.')
                }
            },
            rootFolderNamesExpanded: {
                type: 'object',
                description: nls.localize('schema.rootFolderNamesExpanded', 'Associates root folder names to icons for expanded root folders. The object key is the root folder name. No patterns or wildcards are allowed. Root folder name matching is case insensitive.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.rootFolderNameExpanded', 'The ID of the icon definition for the association.')
                }
            },
            folderNames: {
                type: 'object',
                description: nls.localize('schema.folderNames', 'Associates folder names to icons. The object key is the folder name, not including any path segments. No patterns or wildcards are allowed. Folder name matching is case insensitive.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.folderName', 'The ID of the icon definition for the association.')
                }
            },
            folderNamesExpanded: {
                type: 'object',
                description: nls.localize('schema.folderNamesExpanded', 'Associates folder names to icons for expanded folders. The object key is the folder name, not including any path segments. No patterns or wildcards are allowed. Folder name matching is case insensitive.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.folderNameExpanded', 'The ID of the icon definition for the association.')
                }
            },
            fileExtensions: {
                type: 'object',
                description: nls.localize('schema.fileExtensions', 'Associates file extensions to icons. The object key is the file extension name. The extension name is the last segment of a file name after the last dot (not including the dot). Extensions are compared case insensitive.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.fileExtension', 'The ID of the icon definition for the association.')
                }
            },
            fileNames: {
                type: 'object',
                description: nls.localize('schema.fileNames', 'Associates file names to icons. The object key is the full file name, but not including any path segments. File name can include dots and a possible file extension. No patterns or wildcards are allowed. File name matching is case insensitive.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.fileName', 'The ID of the icon definition for the association.')
                }
            },
            languageIds: {
                type: 'object',
                description: nls.localize('schema.languageIds', 'Associates languages to icons. The object key is the language id as defined in the language contribution point.'),
                additionalProperties: {
                    type: 'string',
                    description: nls.localize('schema.languageId', 'The ID of the icon definition for the association.')
                }
            },
            associations: {
                type: 'object',
                properties: {
                    folderExpanded: {
                        $ref: '#/definitions/folderExpanded'
                    },
                    folder: {
                        $ref: '#/definitions/folder'
                    },
                    file: {
                        $ref: '#/definitions/file'
                    },
                    folderNames: {
                        $ref: '#/definitions/folderNames'
                    },
                    folderNamesExpanded: {
                        $ref: '#/definitions/folderNamesExpanded'
                    },
                    rootFolder: {
                        $ref: '#/definitions/rootFolder'
                    },
                    rootFolderExpanded: {
                        $ref: '#/definitions/rootFolderExpanded'
                    },
                    rootFolderNames: {
                        $ref: '#/definitions/rootFolderNames'
                    },
                    rootFolderNamesExpanded: {
                        $ref: '#/definitions/rootFolderNamesExpanded'
                    },
                    fileExtensions: {
                        $ref: '#/definitions/fileExtensions'
                    },
                    fileNames: {
                        $ref: '#/definitions/fileNames'
                    },
                    languageIds: {
                        $ref: '#/definitions/languageIds'
                    }
                }
            }
        },
        properties: {
            fonts: {
                type: 'array',
                description: nls.localize('schema.fonts', 'Fonts that are used in the icon definitions.'),
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: nls.localize('schema.id', 'The ID of the font.'),
                            pattern: productIconThemeSchema_1.fontIdRegex,
                            patternErrorMessage: nls.localize('schema.id.formatError', 'The ID must only contain letter, numbers, underscore and minus.')
                        },
                        src: {
                            type: 'array',
                            description: nls.localize('schema.src', 'The location of the font.'),
                            items: {
                                type: 'object',
                                properties: {
                                    path: {
                                        type: 'string',
                                        description: nls.localize('schema.font-path', 'The font path, relative to the current file icon theme file.'),
                                    },
                                    format: {
                                        type: 'string',
                                        description: nls.localize('schema.font-format', 'The format of the font.'),
                                        enum: ['woff', 'woff2', 'truetype', 'opentype', 'embedded-opentype', 'svg']
                                    }
                                },
                                required: [
                                    'path',
                                    'format'
                                ]
                            }
                        },
                        weight: {
                            type: 'string',
                            description: nls.localize('schema.font-weight', 'The weight of the font. See https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight for valid values.'),
                            pattern: productIconThemeSchema_1.fontWeightRegex
                        },
                        style: {
                            type: 'string',
                            description: nls.localize('schema.font-style', 'The style of the font. See https://developer.mozilla.org/en-US/docs/Web/CSS/font-style for valid values.'),
                            pattern: productIconThemeSchema_1.fontStyleRegex
                        },
                        size: {
                            type: 'string',
                            description: nls.localize('schema.font-size', 'The default size of the font. See https://developer.mozilla.org/en-US/docs/Web/CSS/font-size for valid values.'),
                            pattern: productIconThemeSchema_1.fontSizeRegex
                        }
                    },
                    required: [
                        'id',
                        'src'
                    ]
                }
            },
            iconDefinitions: {
                type: 'object',
                description: nls.localize('schema.iconDefinitions', 'Description of all icons that can be used when associating files to icons.'),
                additionalProperties: {
                    type: 'object',
                    description: nls.localize('schema.iconDefinition', 'An icon definition. The object key is the ID of the definition.'),
                    properties: {
                        iconPath: {
                            type: 'string',
                            description: nls.localize('schema.iconPath', 'When using a SVG or PNG: The path to the image. The path is relative to the icon set file.')
                        },
                        fontCharacter: {
                            type: 'string',
                            description: nls.localize('schema.fontCharacter', 'When using a glyph font: The character in the font to use.')
                        },
                        fontColor: {
                            type: 'string',
                            format: 'color-hex',
                            description: nls.localize('schema.fontColor', 'When using a glyph font: The color to use.')
                        },
                        fontSize: {
                            type: 'string',
                            description: nls.localize('schema.fontSize', 'When using a font: The font size in percentage to the text font. If not set, defaults to the size in the font definition.'),
                            pattern: productIconThemeSchema_1.fontSizeRegex
                        },
                        fontId: {
                            type: 'string',
                            description: nls.localize('schema.fontId', 'When using a font: The id of the font. If not set, defaults to the first font definition.')
                        }
                    }
                }
            },
            folderExpanded: {
                $ref: '#/definitions/folderExpanded'
            },
            folder: {
                $ref: '#/definitions/folder'
            },
            file: {
                $ref: '#/definitions/file'
            },
            folderNames: {
                $ref: '#/definitions/folderNames'
            },
            folderNamesExpanded: {
                $ref: '#/definitions/folderNamesExpanded'
            },
            rootFolder: {
                $ref: '#/definitions/rootFolder'
            },
            rootFolderExpanded: {
                $ref: '#/definitions/rootFolderExpanded'
            },
            rootFolderNames: {
                $ref: '#/definitions/rootFolderNames'
            },
            rootFolderNamesExpanded: {
                $ref: '#/definitions/rootFolderNamesExpanded'
            },
            fileExtensions: {
                $ref: '#/definitions/fileExtensions'
            },
            fileNames: {
                $ref: '#/definitions/fileNames'
            },
            languageIds: {
                $ref: '#/definitions/languageIds'
            },
            light: {
                $ref: '#/definitions/associations',
                description: nls.localize('schema.light', 'Optional associations for file icons in light color themes.')
            },
            highContrast: {
                $ref: '#/definitions/associations',
                description: nls.localize('schema.highContrast', 'Optional associations for file icons in high contrast color themes.')
            },
            hidesExplorerArrows: {
                type: 'boolean',
                description: nls.localize('schema.hidesExplorerArrows', 'Configures whether the file explorer\'s arrows should be hidden when this theme is active.')
            },
            showLanguageModeIcons: {
                type: 'boolean',
                description: nls.localize('schema.showLanguageModeIcons', 'Configures whether the default language icons should be used if the theme does not define an icon for a language.')
            }
        }
    };
    function registerFileIconThemeSchemas() {
        const schemaRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
        schemaRegistry.registerSchema(schemaId, schema);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUljb25UaGVtZVNjaGVtYS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RoZW1lcy9jb21tb24vZmlsZUljb25UaGVtZVNjaGVtYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUE0UkEsb0VBR0M7SUFwUkQsTUFBTSxRQUFRLEdBQUcsNkJBQTZCLENBQUM7SUFDL0MsTUFBTSxNQUFNLEdBQWdCO1FBQzNCLElBQUksRUFBRSxRQUFRO1FBQ2QsYUFBYSxFQUFFLElBQUk7UUFDbkIsbUJBQW1CLEVBQUUsSUFBSTtRQUN6QixXQUFXLEVBQUU7WUFDWixjQUFjLEVBQUU7Z0JBQ2YsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsb0lBQW9JLENBQUM7YUFDeEw7WUFDRCxNQUFNLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLHFHQUFxRyxDQUFDO2FBRWpKO1lBQ0QsSUFBSSxFQUFFO2dCQUNMLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxzR0FBc0csQ0FBQzthQUVoSjtZQUNELFVBQVUsRUFBRTtnQkFDWCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxtSEFBbUgsQ0FBQzthQUNuSztZQUNELGtCQUFrQixFQUFFO2dCQUNuQixJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsRUFBRSxtSkFBbUosQ0FBQzthQUMzTTtZQUNELGVBQWUsRUFBRTtnQkFDaEIsSUFBSSxF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