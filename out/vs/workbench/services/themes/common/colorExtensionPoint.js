/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/theme/common/colorRegistry", "vs/base/common/color", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/instantiation/common/descriptors", "vs/base/common/htmlContent"], function (require, exports, nls, extensionsRegistry_1, colorRegistry_1, color_1, platform_1, lifecycle_1, extensionFeatures_1, descriptors_1, htmlContent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorExtensionPoint = void 0;
    const colorRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
    const colorReferenceSchema = colorRegistry.getColorReferenceSchema();
    const colorIdPattern = '^\\w+[.\\w+]*$';
    const configurationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'colors',
        jsonSchema: {
            description: nls.localize('contributes.color', 'Contributes extension defined themable colors'),
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: nls.localize('contributes.color.id', 'The identifier of the themable color'),
                        pattern: colorIdPattern,
                        patternErrorMessage: nls.localize('contributes.color.id.format', 'Identifiers must only contain letters, digits and dots and can not start with a dot'),
                    },
                    description: {
                        type: 'string',
                        description: nls.localize('contributes.color.description', 'The description of the themable color'),
                    },
                    defaults: {
                        type: 'object',
                        properties: {
                            light: {
                                description: nls.localize('contributes.defaults.light', 'The default color for light themes. Either a color value in hex (#RRGGBB[AA]) or the identifier of a themable color which provides the default.'),
                                type: 'string',
                                anyOf: [
                                    colorReferenceSchema,
                                    { type: 'string', format: 'color-hex' }
                                ]
                            },
                            dark: {
                                description: nls.localize('contributes.defaults.dark', 'The default color for dark themes. Either a color value in hex (#RRGGBB[AA]) or the identifier of a themable color which provides the default.'),
                                type: 'string',
                                anyOf: [
                                    colorReferenceSchema,
                                    { type: 'string', format: 'color-hex' }
                                ]
                            },
                            highContrast: {
                                description: nls.localize('contributes.defaults.highContrast', 'The default color for high contrast dark themes. Either a color value in hex (#RRGGBB[AA]) or the identifier of a themable color which provides the default. If not provided, the `dark` color is used as default for high contrast dark themes.'),
                                type: 'string',
                                anyOf: [
                                    colorReferenceSchema,
                                    { type: 'string', format: 'color-hex' }
                                ]
                            },
                            highContrastLight: {
                                description: nls.localize('contributes.defaults.highContrastLight', 'The default color for high contrast light themes. Either a color value in hex (#RRGGBB[AA]) or the identifier of a themable color which provides the default. If not provided, the `light` color is used as default for high contrast light themes.'),
                                type: 'string',
                                anyOf: [
                                    colorReferenceSchema,
                                    { type: 'string', format: 'color-hex' }
                                ]
                            }
                        },
                        required: ['light', 'dark']
                    }
                }
            }
        }
    });
    class ColorExtensionPoint {
        constructor() {
            configurationExtPoint.setHandler((extensions, delta) => {
                for (const extension of delta.added) {
                    const extensionValue = extension.value;
                    const collector = extension.collector;
                    if (!extensionValue || !Array.isArray(extensionValue)) {
                        collector.error(nls.localize('invalid.colorConfiguration', "'configuration.colors' must be a array"));
                        return;
                    }
                    const parseColorValue = (s, name) => {
                        if (s.length > 0) {
                            if (s[0] === '#') {
                                return color_1.Color.Format.CSS.parseHex(s);
                            }
                            else {
                                return s;
                            }
                        }
                        collector.error(nls.localize('invalid.default.colorType', "{0} must be either a color value in hex (#RRGGBB[AA] or #RGB[A]) or the identifier of a themable color which provides the default.", name));
                        return color_1.Color.red;
                    };
                    for (const colorContribution of extensionValue) {
                        if (typeof colorContribution.id !== 'string' || colorContribution.id.length === 0) {
                            collector.error(nls.localize('invalid.id', "'configuration.colors.id' must be defined and can not be empty"));
                            return;
                        }
                        if (!colorContribution.id.match(colorIdPattern)) {
                            collector.error(nls.localize('invalid.id.format', "'configuration.colors.id' must only contain letters, digits and dots and can not start with a dot"));
                            return;
                        }
                        if (typeof colorContribution.description !== 'string' || colorContribution.id.length === 0) {
                            collector.error(nls.localize('invalid.description', "'configuration.colors.description' must be defined and can not be empty"));
                            return;
                        }
                        const defaults = colorContribution.defaults;
                        if (!defaults || typeof defaults !== 'object' || typeof defaults.light !== 'string' || typeof defaults.dark !== 'string') {
                            collector.error(nls.localize('invalid.defaults', "'configuration.colors.defaults' must be defined and must contain 'light' and 'dark'"));
                            return;
                        }
                        if (defaults.highContrast && typeof defaults.highContrast !== 'string') {
                            collector.error(nls.localize('invalid.defaults.highContrast', "If defined, 'configuration.colors.defaults.highContrast' must be a string."));
                            return;
                        }
                        if (defaults.highContrastLight && typeof defaults.highContrastLight !== 'string') {
                            collector.error(nls.localize('invalid.defaults.highContrastLight', "If defined, 'configuration.colors.defaults.highContrastLight' must be a string."));
                            return;
                        }
                        colorRegistry.registerColor(colorContribution.id, {
                            light: parseColorValue(defaults.light, 'configuration.colors.defaults.light'),
                            dark: parseColorValue(defaults.dark, 'configuration.colors.defaults.dark'),
                            hcDark: parseColorValue(defaults.highContrast ?? defaults.dark, 'configuration.colors.defaults.highContrast'),
                            hcLight: parseColorValue(defaults.highContrastLight ?? defaults.light, 'configuration.colors.defaults.highContrastLight'),
                        }, colorContribution.description);
                    }
                }
                for (const extension of delta.removed) {
                    const extensionValue = extension.value;
                    for (const colorContribution of extensionValue) {
                        colorRegistry.deregisterColor(colorContribution.id);
                    }
                }
            });
        }
    }
    exports.ColorExtensionPoint = ColorExtensionPoint;
    class ColorDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.colors;
        }
        render(manifest) {
            const colors = manifest.contributes?.colors || [];
            if (!colors.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                nls.localize('id', "ID"),
                nls.localize('description', "Description"),
                nls.localize('defaultDark', "Dark Default"),
                nls.localize('defaultLight', "Light Default"),
                nls.localize('defaultHC', "High Contrast Default"),
            ];
            const toColor = (colorReference) => colorReference[0] === '#' ? color_1.Color.fromHex(colorReference) : undefined;
            const rows = colors.sort((a, b) => a.id.localeCompare(b.id))
                .map(color => {
                return [
                    new htmlContent_1.MarkdownString().appendMarkdown(`\`${color.id}\``),
                    color.description,
                    toColor(color.defaults.dark) ?? new htmlContent_1.MarkdownString().appendMarkdown(`\`${color.defaults.dark}\``),
                    toColor(color.defaults.light) ?? new htmlContent_1.MarkdownString().appendMarkdown(`\`${color.defaults.light}\``),
                    toColor(color.defaults.highContrast) ?? new htmlContent_1.MarkdownString().appendMarkdown(`\`${color.defaults.highContrast}\``),
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
        id: 'colors',
        label: nls.localize('colors', "Colors"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(ColorDataRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JFeHRlbnNpb25Qb2ludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RoZW1lcy9jb21tb24vY29sb3JFeHRlbnNpb25Qb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQmhHLE1BQU0sYUFBYSxHQUFtQixtQkFBUSxDQUFDLEVBQUUsQ0FBaUIsMEJBQXVCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUU3RyxNQUFNLG9CQUFvQixHQUFHLGFBQWEsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO0lBQ3JFLE1BQU0sY0FBYyxHQUFHLGdCQUFnQixDQUFDO0lBRXhDLE1BQU0scUJBQXFCLEdBQUcsdUNBQWtCLENBQUMsc0JBQXNCLENBQXlCO1FBQy9GLGNBQWMsRUFBRSxRQUFRO1FBQ3hCLFVBQVUsRUFBRTtZQUNYLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLCtDQUErQyxDQUFDO1lBQy9GLElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFO2dCQUNOLElBQUksRUFBRSxRQUFRO2dCQUNkLFVBQVUsRUFBRTtvQkFDWCxFQUFFLEVBQUU7d0JBQ0gsSUFBSSxFQUFFLFFBQVE7d0JBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsc0NBQXNDLENBQUM7d0JBQ3pGLE9BQU8sRUFBRSxjQUFjO3dCQUN2QixtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDZCQUE2QixFQUFFLHFGQUFxRixDQUFDO3FCQUN2SjtvQkFDRCxXQUFXLEVBQUU7d0JBQ1osSUFBSSxFQUFFLFFBQVE7d0JBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsK0JBQStCLEVBQUUsdUNBQXVDLENBQUM7cUJBQ25HO29CQUNELFFBQVEsRUFBRTt3QkFDVCxJQUFJLEVBQUUsUUFBUTt3QkFDZCxVQUFVLEVBQUU7NEJBQ1gsS0FBSyxFQUFFO2dDQUNOLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLGlKQUFpSixDQUFDO2dDQUMxTSxJQUFJLEVBQUUsUUFBUTtnQ0FDZCxLQUFLLEVBQUU7b0NBQ04sb0JBQW9CO29DQUNwQixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtpQ0FDdkM7NkJBQ0Q7NEJBQ0QsSUFBSSxFQUFFO2dDQUNMLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFLGdKQUFnSixDQUFDO2dDQUN4TSxJQUFJLEVBQUUsUUFBUTtnQ0FDZCxLQUFLLEVBQUU7b0NBQ04sb0JBQW9CO29DQUNwQixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtpQ0FDdkM7NkJBQ0Q7NEJBQ0QsWUFBWSxFQUFFO2dDQUNiLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG1DQUFtQyxFQUFFLGtQQUFrUCxDQUFDO2dDQUNsVCxJQUFJLEVBQUUsUUFBUTtnQ0FDZCxLQUFLLEVBQUU7b0NBQ04sb0JBQW9CO29DQUNwQixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtpQ0FDdkM7NkJBQ0Q7NEJBQ0QsaUJBQWlCLEVBQUU7Z0NBQ2xCLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHdDQUF3QyxFQUFFLHFQQUFxUCxDQUFDO2dDQUMxVCxJQUFJLEVBQUUsUUFBUTtnQ0FDZCxLQUFLLEVBQUU7b0NBQ04sb0JBQW9CO29DQUNwQixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtpQ0FDdkM7NkJBQ0Q7eUJBQ0Q7d0JBQ0QsUUFBUSxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQztxQkFDM0I7aUJBQ0Q7YUFDRDtTQUNEO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsTUFBYSxtQkFBbUI7UUFFL0I7WUFDQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ3RELEtBQUssTUFBTSxTQUFTLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNyQyxNQUFNLGNBQWMsR0FBMkIsU0FBUyxDQUFDLEtBQUssQ0FBQztvQkFDL0QsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztvQkFFdEMsSUFBSSxDQUFDLGNBQWMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQzt3QkFDdkQsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLHdDQUF3QyxDQUFDLENBQUMsQ0FBQzt3QkFDdEcsT0FBTztvQkFDUixDQUFDO29CQUNELE1BQU0sZUFBZSxHQUFHLENBQUMsQ0FBUyxFQUFFLElBQVksRUFBRSxFQUFFO3dCQUNuRCxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7NEJBQ2xCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO2dDQUNsQixPQUFPLGFBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDckMsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLE9BQU8sQ0FBQyxDQUFDOzRCQUNWLENBQUM7d0JBQ0YsQ0FBQzt3QkFDRCxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsMkJBQTJCLEVBQUUsb0lBQW9JLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDdk0sT0FBTyxhQUFLLENBQUMsR0FBRyxDQUFDO29CQUNsQixDQUFDLENBQUM7b0JBRUYsS0FBSyxNQUFNLGlCQUFpQixJQUFJLGNBQWMsRUFBRSxDQUFDO3dCQUNoRCxJQUFJLE9BQU8saUJBQWlCLENBQUMsRUFBRSxLQUFLLFFBQVEsSUFBSSxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDOzRCQUNuRixTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLGdFQUFnRSxDQUFDLENBQUMsQ0FBQzs0QkFDOUcsT0FBTzt3QkFDUixDQUFDO3dCQUNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7NEJBQ2pELFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxtR0FBbUcsQ0FBQyxDQUFDLENBQUM7NEJBQ3hKLE9BQU87d0JBQ1IsQ0FBQzt3QkFDRCxJQUFJLE9BQU8saUJBQWlCLENBQUMsV0FBVyxLQUFLLFFBQVEsSUFBSSxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDOzRCQUM1RixTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUseUVBQXlFLENBQUMsQ0FBQyxDQUFDOzRCQUNoSSxPQUFPO3dCQUNSLENBQUM7d0JBQ0QsTUFBTSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDO3dCQUM1QyxJQUFJLENBQUMsUUFBUSxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsSUFBSSxPQUFPLFFBQVEsQ0FBQyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sUUFBUSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQzs0QkFDMUgsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLHFGQUFxRixDQUFDLENBQUMsQ0FBQzs0QkFDekksT0FBTzt3QkFDUixDQUFDO3dCQUNELElBQUksUUFBUSxDQUFDLFlBQVksSUFBSSxPQUFPLFFBQVEsQ0FBQyxZQUFZLEtBQUssUUFBUSxFQUFFLENBQUM7NEJBQ3hFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQywrQkFBK0IsRUFBRSw0RUFBNEUsQ0FBQyxDQUFDLENBQUM7NEJBQzdJLE9BQU87d0JBQ1IsQ0FBQzt3QkFDRCxJQUFJLFFBQVEsQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLFFBQVEsQ0FBQyxpQkFBaUIsS0FBSyxRQUFRLEVBQUUsQ0FBQzs0QkFDbEYsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLG9DQUFvQyxFQUFFLGlGQUFpRixDQUFDLENBQUMsQ0FBQzs0QkFDdkosT0FBTzt3QkFDUixDQUFDO3dCQUVELGFBQWEsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFOzRCQUNqRCxLQUFLLEVBQUUsZUFBZSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUscUNBQXFDLENBQUM7NEJBQzdFLElBQUksRUFBRSxlQUFlLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxvQ0FBb0MsQ0FBQzs0QkFDMUUsTUFBTSxFQUFFLGVBQWUsQ0FBQyxRQUFRLENBQUMsWUFBWSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUUsNENBQTRDLENBQUM7NEJBQzdHLE9BQU8sRUFBRSxlQUFlLENBQUMsUUFBUSxDQUFDLGlCQUFpQixJQUFJLFFBQVEsQ0FBQyxLQUFLLEVBQUUsaURBQWlELENBQUM7eUJBQ3pILEVBQUUsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ25DLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxLQUFLLE1BQU0sU0FBUyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDdkMsTUFBTSxjQUFjLEdBQTJCLFNBQVMsQ0FBQyxLQUFLLENBQUM7b0JBQy9ELEtBQUssTUFBTSxpQkFBaUIsSUFBSSxjQUFjLEVBQUUsQ0FBQzt3QkFDaEQsYUFBYSxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDckQsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFuRUQsa0RBbUVDO0lBRUQsTUFBTSxpQkFBa0IsU0FBUSxzQkFBVTtRQUExQzs7WUFFVSxTQUFJLEdBQUcsT0FBTyxDQUFDO1FBeUN6QixDQUFDO1FBdkNBLFlBQVksQ0FBQyxRQUE0QjtZQUN4QyxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQztRQUN2QyxDQUFDO1FBRUQsTUFBTSxDQUFDLFFBQTRCO1lBQ2xDLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsTUFBTSxJQUFJLEVBQUUsQ0FBQztZQUNsRCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNwQixPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2hFLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRztnQkFDZixHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUM7Z0JBQ3hCLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztnQkFDMUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsY0FBYyxDQUFDO2dCQUMzQyxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUM7Z0JBQzdDLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLHVCQUF1QixDQUFDO2FBQ2xELENBQUM7WUFFRixNQUFNLE9BQU8sR0FBRyxDQUFDLGNBQXNCLEVBQXFCLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFFckksTUFBTSxJQUFJLEdBQWlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3hFLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDWixPQUFPO29CQUNOLElBQUksNEJBQWMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQztvQkFDdEQsS0FBSyxDQUFDLFdBQVc7b0JBQ2pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksNEJBQWMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUM7b0JBQ2pHLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksNEJBQWMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLENBQUM7b0JBQ25HLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUksNEJBQWMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxJQUFJLENBQUM7aUJBQ2pILENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUVKLE9BQU87Z0JBQ04sSUFBSSxFQUFFO29CQUNMLE9BQU87b0JBQ1AsSUFBSTtpQkFDSjtnQkFDRCxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQzthQUNsQixDQUFDO1FBQ0gsQ0FBQztLQUNEO0lBRUQsbUJBQVEsQ0FBQyxFQUFFLENBQTZCLDhCQUFVLENBQUMseUJBQXlCLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQztRQUN0RyxFQUFFLEVBQUUsUUFBUTtRQUNaLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUM7UUFDdkMsTUFBTSxFQUFFO1lBQ1AsU0FBUyxFQUFFLEtBQUs7U0FDaEI7UUFDRCxRQUFRLEVBQUUsSUFBSSw0QkFBYyxDQUFDLGlCQUFpQixDQUFDO0tBQy9DLENBQUMsQ0FBQyJ9