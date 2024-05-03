/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/config/diffEditor", "vs/editor/common/config/editorOptions", "vs/editor/common/core/textModelDefaults", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, diffEditor_1, editorOptions_1, textModelDefaults_1, nls, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editorConfigurationBaseNode = void 0;
    exports.isEditorConfigurationKey = isEditorConfigurationKey;
    exports.isDiffEditorConfigurationKey = isDiffEditorConfigurationKey;
    exports.editorConfigurationBaseNode = Object.freeze({
        id: 'editor',
        order: 5,
        type: 'object',
        title: nls.localize('editorConfigurationTitle', "Editor"),
        scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
    });
    const editorConfiguration = {
        ...exports.editorConfigurationBaseNode,
        properties: {
            'editor.tabSize': {
                type: 'number',
                default: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.tabSize,
                minimum: 1,
                markdownDescription: nls.localize('tabSize', "The number of spaces a tab is equal to. This setting is overridden based on the file contents when {0} is on.", '`#editor.detectIndentation#`')
            },
            'editor.indentSize': {
                'anyOf': [
                    {
                        type: 'string',
                        enum: ['tabSize']
                    },
                    {
                        type: 'number',
                        minimum: 1
                    }
                ],
                default: 'tabSize',
                markdownDescription: nls.localize('indentSize', "The number of spaces used for indentation or `\"tabSize\"` to use the value from `#editor.tabSize#`. This setting is overridden based on the file contents when `#editor.detectIndentation#` is on.")
            },
            'editor.insertSpaces': {
                type: 'boolean',
                default: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.insertSpaces,
                markdownDescription: nls.localize('insertSpaces', "Insert spaces when pressing `Tab`. This setting is overridden based on the file contents when {0} is on.", '`#editor.detectIndentation#`')
            },
            'editor.detectIndentation': {
                type: 'boolean',
                default: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.detectIndentation,
                markdownDescription: nls.localize('detectIndentation', "Controls whether {0} and {1} will be automatically detected when a file is opened based on the file contents.", '`#editor.tabSize#`', '`#editor.insertSpaces#`')
            },
            'editor.trimAutoWhitespace': {
                type: 'boolean',
                default: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.trimAutoWhitespace,
                description: nls.localize('trimAutoWhitespace', "Remove trailing auto inserted whitespace.")
            },
            'editor.largeFileOptimizations': {
                type: 'boolean',
                default: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.largeFileOptimizations,
                description: nls.localize('largeFileOptimizations', "Special handling for large files to disable certain memory intensive features.")
            },
            'editor.wordBasedSuggestions': {
                enum: ['off', 'currentDocument', 'matchingDocuments', 'allDocuments'],
                default: 'matchingDocuments',
                enumDescriptions: [
                    nls.localize('wordBasedSuggestions.off', 'Turn off Word Based Suggestions.'),
                    nls.localize('wordBasedSuggestions.currentDocument', 'Only suggest words from the active document.'),
                    nls.localize('wordBasedSuggestions.matchingDocuments', 'Suggest words from all open documents of the same language.'),
                    nls.localize('wordBasedSuggestions.allDocuments', 'Suggest words from all open documents.')
                ],
                description: nls.localize('wordBasedSuggestions', "Controls whether completions should be computed based on words in the document and from which documents they are computed.")
            },
            'editor.semanticHighlighting.enabled': {
                enum: [true, false, 'configuredByTheme'],
                enumDescriptions: [
                    nls.localize('semanticHighlighting.true', 'Semantic highlighting enabled for all color themes.'),
                    nls.localize('semanticHighlighting.false', 'Semantic highlighting disabled for all color themes.'),
                    nls.localize('semanticHighlighting.configuredByTheme', 'Semantic highlighting is configured by the current color theme\'s `semanticHighlighting` setting.')
                ],
                default: 'configuredByTheme',
                description: nls.localize('semanticHighlighting.enabled', "Controls whether the semanticHighlighting is shown for the languages that support it.")
            },
            'editor.stablePeek': {
                type: 'boolean',
                default: false,
                markdownDescription: nls.localize('stablePeek', "Keep peek editors open even when double-clicking their content or when hitting `Escape`.")
            },
            'editor.maxTokenizationLineLength': {
                type: 'integer',
                default: 20_000,
                description: nls.localize('maxTokenizationLineLength', "Lines above this length will not be tokenized for performance reasons")
            },
            'editor.experimental.asyncTokenization': {
                type: 'boolean',
                default: false,
                description: nls.localize('editor.experimental.asyncTokenization', "Controls whether the tokenization should happen asynchronously on a web worker."),
                tags: ['experimental'],
            },
            'editor.experimental.asyncTokenizationLogging': {
                type: 'boolean',
                default: false,
                description: nls.localize('editor.experimental.asyncTokenizationLogging', "Controls whether async tokenization should be logged. For debugging only."),
            },
            'editor.experimental.asyncTokenizationVerification': {
                type: 'boolean',
                default: false,
                description: nls.localize('editor.experimental.asyncTokenizationVerification', "Controls whether async tokenization should be verified against legacy background tokenization. Might slow down tokenization. For debugging only."),
                tags: ['experimental'],
            },
            'editor.language.brackets': {
                type: ['array', 'null'],
                default: null, // We want to distinguish the empty array from not configured.
                description: nls.localize('schema.brackets', 'Defines the bracket symbols that increase or decrease the indentation.'),
                items: {
                    type: 'array',
                    items: [
                        {
                            type: 'string',
                            description: nls.localize('schema.openBracket', 'The opening bracket character or string sequence.')
                        },
                        {
                            type: 'string',
                            description: nls.localize('schema.closeBracket', 'The closing bracket character or string sequence.')
                        }
                    ]
                }
            },
            'editor.language.colorizedBracketPairs': {
                type: ['array', 'null'],
                default: null, // We want to distinguish the empty array from not configured.
                description: nls.localize('schema.colorizedBracketPairs', 'Defines the bracket pairs that are colorized by their nesting level if bracket pair colorization is enabled.'),
                items: {
                    type: 'array',
                    items: [
                        {
                            type: 'string',
                            description: nls.localize('schema.openBracket', 'The opening bracket character or string sequence.')
                        },
                        {
                            type: 'string',
                            description: nls.localize('schema.closeBracket', 'The closing bracket character or string sequence.')
                        }
                    ]
                }
            },
            'diffEditor.maxComputationTime': {
                type: 'number',
                default: diffEditor_1.diffEditorDefaultOptions.maxComputationTime,
                description: nls.localize('maxComputationTime', "Timeout in milliseconds after which diff computation is cancelled. Use 0 for no timeout.")
            },
            'diffEditor.maxFileSize': {
                type: 'number',
                default: diffEditor_1.diffEditorDefaultOptions.maxFileSize,
                description: nls.localize('maxFileSize', "Maximum file size in MB for which to compute diffs. Use 0 for no limit.")
            },
            'diffEditor.renderSideBySide': {
                type: 'boolean',
                default: diffEditor_1.diffEditorDefaultOptions.renderSideBySide,
                description: nls.localize('sideBySide', "Controls whether the diff editor shows the diff side by side or inline.")
            },
            'diffEditor.renderSideBySideInlineBreakpoint': {
                type: 'number',
                default: diffEditor_1.diffEditorDefaultOptions.renderSideBySideInlineBreakpoint,
                description: nls.localize('renderSideBySideInlineBreakpoint', "If the diff editor width is smaller than this value, the inline view is used.")
            },
            'diffEditor.useInlineViewWhenSpaceIsLimited': {
                type: 'boolean',
                default: diffEditor_1.diffEditorDefaultOptions.useInlineViewWhenSpaceIsLimited,
                description: nls.localize('useInlineViewWhenSpaceIsLimited', "If enabled and the editor width is too small, the inline view is used.")
            },
            'diffEditor.renderMarginRevertIcon': {
                type: 'boolean',
                default: diffEditor_1.diffEditorDefaultOptions.renderMarginRevertIcon,
                description: nls.localize('renderMarginRevertIcon', "When enabled, the diff editor shows arrows in its glyph margin to revert changes.")
            },
            'diffEditor.renderGutterMenu': {
                type: 'boolean',
                default: diffEditor_1.diffEditorDefaultOptions.renderGutterMenu,
                description: nls.localize('renderGutterMenu', "When enabled, the diff editor shows a special gutter for revert and stage actions.")
            },
            'diffEditor.ignoreTrimWhitespace': {
                type: 'boolean',
                default: diffEditor_1.diffEditorDefaultOptions.ignoreTrimWhitespace,
                description: nls.localize('ignoreTrimWhitespace', "When enabled, the diff editor ignores changes in leading or trailing whitespace.")
            },
            'diffEditor.renderIndicators': {
                type: 'boolean',
                default: diffEditor_1.diffEditorDefaultOptions.renderIndicators,
                description: nls.localize('renderIndicators', "Controls whether the diff editor shows +/- indicators for added/removed changes.")
            },
            'diffEditor.codeLens': {
                type: 'boolean',
                default: diffEditor_1.diffEditorDefaultOptions.diffCodeLens,
                description: nls.localize('codeLens', "Controls whether the editor shows CodeLens.")
            },
            'diffEditor.wordWrap': {
                type: 'string',
                enum: ['off', 'on', 'inherit'],
                default: diffEditor_1.diffEditorDefaultOptions.diffWordWrap,
                markdownEnumDescriptions: [
                    nls.localize('wordWrap.off', "Lines will never wrap."),
                    nls.localize('wordWrap.on', "Lines will wrap at the viewport width."),
                    nls.localize('wordWrap.inherit', "Lines will wrap according to the {0} setting.", '`#editor.wordWrap#`'),
                ]
            },
            'diffEditor.diffAlgorithm': {
                type: 'string',
                enum: ['legacy', 'advanced'],
                default: diffEditor_1.diffEditorDefaultOptions.diffAlgorithm,
                markdownEnumDescriptions: [
                    nls.localize('diffAlgorithm.legacy', "Uses the legacy diffing algorithm."),
                    nls.localize('diffAlgorithm.advanced', "Uses the advanced diffing algorithm."),
                ],
                tags: ['experimental'],
            },
            'diffEditor.hideUnchangedRegions.enabled': {
                type: 'boolean',
                default: diffEditor_1.diffEditorDefaultOptions.hideUnchangedRegions.enabled,
                markdownDescription: nls.localize('hideUnchangedRegions.enabled', "Controls whether the diff editor shows unchanged regions."),
            },
            'diffEditor.hideUnchangedRegions.revealLineCount': {
                type: 'integer',
                default: diffEditor_1.diffEditorDefaultOptions.hideUnchangedRegions.revealLineCount,
                markdownDescription: nls.localize('hideUnchangedRegions.revealLineCount', "Controls how many lines are used for unchanged regions."),
                minimum: 1,
            },
            'diffEditor.hideUnchangedRegions.minimumLineCount': {
                type: 'integer',
                default: diffEditor_1.diffEditorDefaultOptions.hideUnchangedRegions.minimumLineCount,
                markdownDescription: nls.localize('hideUnchangedRegions.minimumLineCount', "Controls how many lines are used as a minimum for unchanged regions."),
                minimum: 1,
            },
            'diffEditor.hideUnchangedRegions.contextLineCount': {
                type: 'integer',
                default: diffEditor_1.diffEditorDefaultOptions.hideUnchangedRegions.contextLineCount,
                markdownDescription: nls.localize('hideUnchangedRegions.contextLineCount', "Controls how many lines are used as context when comparing unchanged regions."),
                minimum: 1,
            },
            'diffEditor.experimental.showMoves': {
                type: 'boolean',
                default: diffEditor_1.diffEditorDefaultOptions.experimental.showMoves,
                markdownDescription: nls.localize('showMoves', "Controls whether the diff editor should show detected code moves.")
            },
            'diffEditor.experimental.showEmptyDecorations': {
                type: 'boolean',
                default: diffEditor_1.diffEditorDefaultOptions.experimental.showEmptyDecorations,
                description: nls.localize('showEmptyDecorations', "Controls whether the diff editor shows empty decorations to see where characters got inserted or deleted."),
            }
        }
    };
    function isConfigurationPropertySchema(x) {
        return (typeof x.type !== 'undefined' || typeof x.anyOf !== 'undefined');
    }
    // Add properties from the Editor Option Registry
    for (const editorOption of editorOptions_1.editorOptionsRegistry) {
        const schema = editorOption.schema;
        if (typeof schema !== 'undefined') {
            if (isConfigurationPropertySchema(schema)) {
                // This is a single schema contribution
                editorConfiguration.properties[`editor.${editorOption.name}`] = schema;
            }
            else {
                for (const key in schema) {
                    if (Object.hasOwnProperty.call(schema, key)) {
                        editorConfiguration.properties[key] = schema[key];
                    }
                }
            }
        }
    }
    let cachedEditorConfigurationKeys = null;
    function getEditorConfigurationKeys() {
        if (cachedEditorConfigurationKeys === null) {
            cachedEditorConfigurationKeys = Object.create(null);
            Object.keys(editorConfiguration.properties).forEach((prop) => {
                cachedEditorConfigurationKeys[prop] = true;
            });
        }
        return cachedEditorConfigurationKeys;
    }
    function isEditorConfigurationKey(key) {
        const editorConfigurationKeys = getEditorConfigurationKeys();
        return (editorConfigurationKeys[`editor.${key}`] || false);
    }
    function isDiffEditorConfigurationKey(key) {
        const editorConfigurationKeys = getEditorConfigurationKeys();
        return (editorConfigurationKeys[`diffEditor.${key}`] || false);
    }
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration(editorConfiguration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQ29uZmlndXJhdGlvblNjaGVtYS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb25maWcvZWRpdG9yQ29uZmlndXJhdGlvblNjaGVtYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwUmhHLDREQUdDO0lBRUQsb0VBR0M7SUF6UlksUUFBQSwyQkFBMkIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFxQjtRQUM1RSxFQUFFLEVBQUUsUUFBUTtRQUNaLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxFQUFFLFFBQVE7UUFDZCxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxRQUFRLENBQUM7UUFDekQsS0FBSyxpREFBeUM7S0FDOUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxtQkFBbUIsR0FBdUI7UUFDL0MsR0FBRyxtQ0FBMkI7UUFDOUIsVUFBVSxFQUFFO1lBQ1gsZ0JBQWdCLEVBQUU7Z0JBQ2pCLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSx5Q0FBcUIsQ0FBQyxPQUFPO2dCQUN0QyxPQUFPLEVBQUUsQ0FBQztnQkFDVixtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSwrR0FBK0csRUFBRSw4QkFBOEIsQ0FBQzthQUM3TDtZQUNELG1CQUFtQixFQUFFO2dCQUNwQixPQUFPLEVBQUU7b0JBQ1I7d0JBQ0MsSUFBSSxFQUFFLFFBQVE7d0JBQ2QsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDO3FCQUNqQjtvQkFDRDt3QkFDQyxJQUFJLEVBQUUsUUFBUTt3QkFDZCxPQUFPLEVBQUUsQ0FBQztxQkFDVjtpQkFDRDtnQkFDRCxPQUFPLEVBQUUsU0FBUztnQkFDbEIsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUscU1BQXFNLENBQUM7YUFDdFA7WUFDRCxxQkFBcUIsRUFBRTtnQkFDdEIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLHlDQUFxQixDQUFDLFlBQVk7Z0JBQzNDLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLDBHQUEwRyxFQUFFLDhCQUE4QixDQUFDO2FBQzdMO1lBQ0QsMEJBQTBCLEVBQUU7Z0JBQzNCLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSx5Q0FBcUIsQ0FBQyxpQkFBaUI7Z0JBQ2hELG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUUsK0dBQStHLEVBQUUsb0JBQW9CLEVBQUUseUJBQXlCLENBQUM7YUFDeE47WUFDRCwyQkFBMkIsRUFBRTtnQkFDNUIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLHlDQUFxQixDQUFDLGtCQUFrQjtnQkFDakQsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsMkNBQTJDLENBQUM7YUFDNUY7WUFDRCwrQkFBK0IsRUFBRTtnQkFDaEMsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLHlDQUFxQixDQUFDLHNCQUFzQjtnQkFDckQsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsd0JBQXdCLEVBQUUsZ0ZBQWdGLENBQUM7YUFDckk7WUFDRCw2QkFBNkIsRUFBRTtnQkFDOUIsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixFQUFFLGNBQWMsQ0FBQztnQkFDckUsT0FBTyxFQUFFLG1CQUFtQjtnQkFDNUIsZ0JBQWdCLEVBQUU7b0JBQ2pCLEdBQUcsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLEVBQUUsa0NBQWtDLENBQUM7b0JBQzVFLEdBQUcsQ0FBQyxRQUFRLENBQUMsc0NBQXNDLEVBQUUsOENBQThDLENBQUM7b0JBQ3BHLEdBQUcsQ0FBQyxRQUFRLENBQUMsd0NBQXdDLEVBQUUsNkRBQTZELENBQUM7b0JBQ3JILEdBQUcsQ0FBQyxRQUFRLENBQUMsbUNBQW1DLEVBQUUsd0NBQXdDLENBQUM7aUJBQzNGO2dCQUNELFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLDRIQUE0SCxDQUFDO2FBQy9LO1lBQ0QscUNBQXFDLEVBQUU7Z0JBQ3RDLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUM7Z0JBQ3hDLGdCQUFnQixFQUFFO29CQUNqQixHQUFHLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFLHFEQUFxRCxDQUFDO29CQUNoRyxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLHNEQUFzRCxDQUFDO29CQUNsRyxHQUFHLENBQUMsUUFBUSxDQUFDLHdDQUF3QyxFQUFFLG1HQUFtRyxDQUFDO2lCQUMzSjtnQkFDRCxPQUFPLEVBQUUsbUJBQW1CO2dCQUM1QixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyw4QkFBOEIsRUFBRSx1RkFBdUYsQ0FBQzthQUNsSjtZQUNELG1CQUFtQixFQUFFO2dCQUNwQixJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsS0FBSztnQkFDZCxtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSwwRkFBMEYsQ0FBQzthQUMzSTtZQUNELGtDQUFrQyxFQUFFO2dCQUNuQyxJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsTUFBTTtnQkFDZixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsRUFBRSx1RUFBdUUsQ0FBQzthQUMvSDtZQUNELHVDQUF1QyxFQUFFO2dCQUN4QyxJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsS0FBSztnQkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx1Q0FBdUMsRUFBRSxpRkFBaUYsQ0FBQztnQkFDckosSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDO2FBQ3RCO1lBQ0QsOENBQThDLEVBQUU7Z0JBQy9DLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxLQUFLO2dCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDhDQUE4QyxFQUFFLDJFQUEyRSxDQUFDO2FBQ3RKO1lBQ0QsbURBQW1ELEVBQUU7Z0JBQ3BELElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxLQUFLO2dCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG1EQUFtRCxFQUFFLGtKQUFrSixDQUFDO2dCQUNsTyxJQUFJLEVBQUUsQ0FBQyxjQUFjLENBQUM7YUFDdEI7WUFDRCwwQkFBMEIsRUFBRTtnQkFDM0IsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQztnQkFDdkIsT0FBTyxFQUFFLElBQUksRUFBRSw4REFBOEQ7Z0JBQzdFLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLHdFQUF3RSxDQUFDO2dCQUN0SCxLQUFLLEVBQUU7b0JBQ04sSUFBSSxFQUFFLE9BQU87b0JBQ2IsS0FBSyxFQUFFO3dCQUNOOzRCQUNDLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLG1EQUFtRCxDQUFDO3lCQUNwRzt3QkFDRDs0QkFDQyxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxtREFBbUQsQ0FBQzt5QkFDckc7cUJBQ0Q7aUJBQ0Q7YUFDRDtZQUNELHVDQUF1QyxFQUFFO2dCQUN4QyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDO2dCQUN2QixPQUFPLEVBQUUsSUFBSSxFQUFFLDhEQUE4RDtnQkFDN0UsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsOEJBQThCLEVBQUUsOEdBQThHLENBQUM7Z0JBQ3pLLEtBQUssRUFBRTtvQkFDTixJQUFJLEVBQUUsT0FBTztvQkFDYixLQUFLLEVBQUU7d0JBQ047NEJBQ0MsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsbURBQW1ELENBQUM7eUJBQ3BHO3dCQUNEOzRCQUNDLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLG1EQUFtRCxDQUFDO3lCQUNyRztxQkFDRDtpQkFDRDthQUNEO1lBQ0QsK0JBQStCLEVBQUU7Z0JBQ2hDLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxrQkFBa0I7Z0JBQ3BELFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLDBGQUEwRixDQUFDO2FBQzNJO1lBQ0Qsd0JBQXdCLEVBQUU7Z0JBQ3pCLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxXQUFXO2dCQUM3QyxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUseUVBQXlFLENBQUM7YUFDbkg7WUFDRCw2QkFBNkIsRUFBRTtnQkFDOUIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLHFDQUF3QixDQUFDLGdCQUFnQjtnQkFDbEQsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLHlFQUF5RSxDQUFDO2FBQ2xIO1lBQ0QsNkNBQTZDLEVBQUU7Z0JBQzlDLElBQUksRUFBRSxRQUFRO2dCQUNkLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxnQ0FBZ0M7Z0JBQ2xFLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGtDQUFrQyxFQUFFLCtFQUErRSxDQUFDO2FBQzlJO1lBQ0QsNENBQTRDLEVBQUU7Z0JBQzdDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQywrQkFBK0I7Z0JBQ2pFLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGlDQUFpQyxFQUFFLHdFQUF3RSxDQUFDO2FBQ3RJO1lBQ0QsbUNBQW1DLEVBQUU7Z0JBQ3BDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxzQkFBc0I7Z0JBQ3hELFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUFFLG1GQUFtRixDQUFDO2FBQ3hJO1lBQ0QsNkJBQTZCLEVBQUU7Z0JBQzlCLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxnQkFBZ0I7Z0JBQ2xELFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLG9GQUFvRixDQUFDO2FBQ25JO1lBQ0QsaUNBQWlDLEVBQUU7Z0JBQ2xDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxvQkFBb0I7Z0JBQ3RELFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLGtGQUFrRixDQUFDO2FBQ3JJO1lBQ0QsNkJBQTZCLEVBQUU7Z0JBQzlCLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxnQkFBZ0I7Z0JBQ2xELFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLGtGQUFrRixDQUFDO2FBQ2pJO1lBQ0QscUJBQXFCLEVBQUU7Z0JBQ3RCLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxZQUFZO2dCQUM5QyxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsNkNBQTZDLENBQUM7YUFDcEY7WUFDRCxxQkFBcUIsRUFBRTtnQkFDdEIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLENBQUM7Z0JBQzlCLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxZQUFZO2dCQUM5Qyx3QkFBd0IsRUFBRTtvQkFDekIsR0FBRyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsd0JBQXdCLENBQUM7b0JBQ3RELEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLHdDQUF3QyxDQUFDO29CQUNyRSxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLCtDQUErQyxFQUFFLHFCQUFxQixDQUFDO2lCQUN4RzthQUNEO1lBQ0QsMEJBQTBCLEVBQUU7Z0JBQzNCLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUM7Z0JBQzVCLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxhQUFhO2dCQUMvQyx3QkFBd0IsRUFBRTtvQkFDekIsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxvQ0FBb0MsQ0FBQztvQkFDMUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxzQ0FBc0MsQ0FBQztpQkFDOUU7Z0JBQ0QsSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDO2FBQ3RCO1lBQ0QseUNBQXlDLEVBQUU7Z0JBQzFDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPO2dCQUM5RCxtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDhCQUE4QixFQUFFLDJEQUEyRCxDQUFDO2FBQzlIO1lBQ0QsaURBQWlELEVBQUU7Z0JBQ2xELElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlO2dCQUN0RSxtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHNDQUFzQyxFQUFFLHlEQUF5RCxDQUFDO2dCQUNwSSxPQUFPLEVBQUUsQ0FBQzthQUNWO1lBQ0Qsa0RBQWtELEVBQUU7Z0JBQ25ELElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxvQkFBb0IsQ0FBQyxnQkFBZ0I7Z0JBQ3ZFLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUNBQXVDLEVBQUUsc0VBQXNFLENBQUM7Z0JBQ2xKLE9BQU8sRUFBRSxDQUFDO2FBQ1Y7WUFDRCxrREFBa0QsRUFBRTtnQkFDbkQsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLHFDQUF3QixDQUFDLG9CQUFvQixDQUFDLGdCQUFnQjtnQkFDdkUsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx1Q0FBdUMsRUFBRSwrRUFBK0UsQ0FBQztnQkFDM0osT0FBTyxFQUFFLENBQUM7YUFDVjtZQUNELG1DQUFtQyxFQUFFO2dCQUNwQyxJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUscUNBQXdCLENBQUMsWUFBWSxDQUFDLFNBQVM7Z0JBQ3hELG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLG1FQUFtRSxDQUFDO2FBQ25IO1lBQ0QsOENBQThDLEVBQUU7Z0JBQy9DLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxxQ0FBd0IsQ0FBQyxZQUFZLENBQUMsb0JBQW9CO2dCQUNuRSxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSwyR0FBMkcsQ0FBQzthQUM5SjtTQUNEO0tBQ0QsQ0FBQztJQUVGLFNBQVMsNkJBQTZCLENBQUMsQ0FBa0Y7UUFDeEgsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksS0FBSyxXQUFXLElBQUksT0FBTyxDQUFDLENBQUMsS0FBSyxLQUFLLFdBQVcsQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFFRCxpREFBaUQ7SUFDakQsS0FBSyxNQUFNLFlBQVksSUFBSSxxQ0FBcUIsRUFBRSxDQUFDO1FBQ2xELE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUM7UUFDbkMsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUNuQyxJQUFJLDZCQUE2QixDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQzNDLHVDQUF1QztnQkFDdkMsbUJBQW1CLENBQUMsVUFBVyxDQUFDLFVBQVUsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDO1lBQ3pFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUMxQixJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUM3QyxtQkFBbUIsQ0FBQyxVQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNwRCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUM7SUFFRCxJQUFJLDZCQUE2QixHQUFzQyxJQUFJLENBQUM7SUFDNUUsU0FBUywwQkFBMEI7UUFDbEMsSUFBSSw2QkFBNkIsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUM1Qyw2QkFBNkIsR0FBK0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRixNQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUM3RCw2QkFBOEIsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDN0MsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsT0FBTyw2QkFBNkIsQ0FBQztJQUN0QyxDQUFDO0lBRUQsU0FBZ0Isd0JBQXdCLENBQUMsR0FBVztRQUNuRCxNQUFNLHVCQUF1QixHQUFHLDBCQUEwQixFQUFFLENBQUM7UUFDN0QsT0FBTyxDQUFDLHVCQUF1QixDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsU0FBZ0IsNEJBQTRCLENBQUMsR0FBVztRQUN2RCxNQUFNLHVCQUF1QixHQUFHLDBCQUEwQixFQUFFLENBQUM7UUFDN0QsT0FBTyxDQUFDLHVCQUF1QixDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQsTUFBTSxxQkFBcUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUM1RixxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDIn0=