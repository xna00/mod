/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/registry/common/platform", "vs/base/common/themables", "vs/base/common/resources", "vs/base/common/path"], function (require, exports, nls, extensionsRegistry_1, iconRegistry_1, platform_1, themables_1, resources, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IconExtensionPoint = void 0;
    const iconRegistry = platform_1.Registry.as(iconRegistry_1.Extensions.IconContribution);
    const iconReferenceSchema = iconRegistry.getIconReferenceSchema();
    const iconIdPattern = `^${themables_1.ThemeIcon.iconNameSegment}(-${themables_1.ThemeIcon.iconNameSegment})+$`;
    const iconConfigurationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'icons',
        jsonSchema: {
            description: nls.localize('contributes.icons', 'Contributes extension defined themable icons'),
            type: 'object',
            propertyNames: {
                pattern: iconIdPattern,
                description: nls.localize('contributes.icon.id', 'The identifier of the themable icon'),
                patternErrorMessage: nls.localize('contributes.icon.id.format', 'Identifiers can only contain letters, digits and minuses and need to consist of at least two segments in the form `component-iconname`.'),
            },
            additionalProperties: {
                type: 'object',
                properties: {
                    description: {
                        type: 'string',
                        description: nls.localize('contributes.icon.description', 'The description of the themable icon'),
                    },
                    default: {
                        anyOf: [
                            iconReferenceSchema,
                            {
                                type: 'object',
                                properties: {
                                    fontPath: {
                                        description: nls.localize('contributes.icon.default.fontPath', 'The path of the icon font that defines the icon.'),
                                        type: 'string'
                                    },
                                    fontCharacter: {
                                        description: nls.localize('contributes.icon.default.fontCharacter', 'The character for the icon in the icon font.'),
                                        type: 'string'
                                    }
                                },
                                required: ['fontPath', 'fontCharacter'],
                                defaultSnippets: [{ body: { fontPath: '${1:myiconfont.woff}', fontCharacter: '${2:\\\\E001}' } }]
                            }
                        ],
                        description: nls.localize('contributes.icon.default', 'The default of the icon. Either a reference to an extisting ThemeIcon or an icon in an icon font.'),
                    }
                },
                required: ['description', 'default'],
                defaultSnippets: [{ body: { description: '${1:my icon}', default: { fontPath: '${2:myiconfont.woff}', fontCharacter: '${3:\\\\E001}' } } }]
            },
            defaultSnippets: [{ body: { '${1:my-icon-id}': { description: '${2:my icon}', default: { fontPath: '${3:myiconfont.woff}', fontCharacter: '${4:\\\\E001}' } } } }]
        }
    });
    class IconExtensionPoint {
        constructor() {
            iconConfigurationExtPoint.setHandler((extensions, delta) => {
                for (const extension of delta.added) {
                    const extensionValue = extension.value;
                    const collector = extension.collector;
                    if (!extensionValue || typeof extensionValue !== 'object') {
                        collector.error(nls.localize('invalid.icons.configuration', "'configuration.icons' must be an object with the icon names as properties."));
                        return;
                    }
                    for (const id in extensionValue) {
                        if (!id.match(iconIdPattern)) {
                            collector.error(nls.localize('invalid.icons.id.format', "'configuration.icons' keys represent the icon id and can only contain letter, digits and minuses. They need to consist of at least two segments in the form `component-iconname`."));
                            return;
                        }
                        const iconContribution = extensionValue[id];
                        if (typeof iconContribution.description !== 'string' || iconContribution.description.length === 0) {
                            collector.error(nls.localize('invalid.icons.description', "'configuration.icons.description' must be defined and can not be empty"));
                            return;
                        }
                        const defaultIcon = iconContribution.default;
                        if (typeof defaultIcon === 'string') {
                            iconRegistry.registerIcon(id, { id: defaultIcon }, iconContribution.description);
                        }
                        else if (typeof defaultIcon === 'object' && typeof defaultIcon.fontPath === 'string' && typeof defaultIcon.fontCharacter === 'string') {
                            const fileExt = (0, path_1.extname)(defaultIcon.fontPath).substring(1);
                            const format = formatMap[fileExt];
                            if (!format) {
                                collector.warn(nls.localize('invalid.icons.default.fontPath.extension', "Expected `contributes.icons.default.fontPath` to have file extension 'woff', woff2' or 'ttf', is '{0}'.", fileExt));
                                return;
                            }
                            const extensionLocation = extension.description.extensionLocation;
                            const iconFontLocation = resources.joinPath(extensionLocation, defaultIcon.fontPath);
                            if (!resources.isEqualOrParent(iconFontLocation, extensionLocation)) {
                                collector.warn(nls.localize('invalid.icons.default.fontPath.path', "Expected `contributes.icons.default.fontPath` ({0}) to be included inside extension's folder ({0}).", iconFontLocation.path, extensionLocation.path));
                                return;
                            }
                            const fontId = getFontId(extension.description, defaultIcon.fontPath);
                            const definition = iconRegistry.registerIconFont(fontId, { src: [{ location: iconFontLocation, format }] });
                            iconRegistry.registerIcon(id, {
                                fontCharacter: defaultIcon.fontCharacter,
                                font: {
                                    id: fontId,
                                    definition
                                }
                            }, iconContribution.description);
                        }
                        else {
                            collector.error(nls.localize('invalid.icons.default', "'configuration.icons.default' must be either a reference to the id of an other theme icon (string) or a icon definition (object) with properties `fontPath` and `fontCharacter`."));
                        }
                    }
                }
                for (const extension of delta.removed) {
                    const extensionValue = extension.value;
                    for (const id in extensionValue) {
                        iconRegistry.deregisterIcon(id);
                    }
                }
            });
        }
    }
    exports.IconExtensionPoint = IconExtensionPoint;
    const formatMap = {
        'ttf': 'truetype',
        'woff': 'woff',
        'woff2': 'woff2'
    };
    function getFontId(description, fontPath) {
        return path_1.posix.join(description.identifier.value, fontPath);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvbkV4dGVuc2lvblBvaW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGhlbWVzL2NvbW1vbi9pY29uRXh0ZW5zaW9uUG9pbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxNQUFNLFlBQVksR0FBa0IsbUJBQVEsQ0FBQyxFQUFFLENBQWdCLHlCQUFzQixDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFFeEcsTUFBTSxtQkFBbUIsR0FBRyxZQUFZLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztJQUNsRSxNQUFNLGFBQWEsR0FBRyxJQUFJLHFCQUFTLENBQUMsZUFBZSxLQUFLLHFCQUFTLENBQUMsZUFBZSxLQUFLLENBQUM7SUFFdkYsTUFBTSx5QkFBeUIsR0FBRyx1Q0FBa0IsQ0FBQyxzQkFBc0IsQ0FBc0I7UUFDaEcsY0FBYyxFQUFFLE9BQU87UUFDdkIsVUFBVSxFQUFFO1lBQ1gsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUUsOENBQThDLENBQUM7WUFDOUYsSUFBSSxFQUFFLFFBQVE7WUFDZCxhQUFhLEVBQUU7Z0JBQ2QsT0FBTyxFQUFFLGFBQWE7Z0JBQ3RCLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLHFDQUFxQyxDQUFDO2dCQUN2RixtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLHlJQUF5SSxDQUFDO2FBQzFNO1lBQ0Qsb0JBQW9CLEVBQUU7Z0JBQ3JCLElBQUksRUFBRSxRQUFRO2dCQUNkLFVBQVUsRUFBRTtvQkFDWCxXQUFXLEVBQUU7d0JBQ1osSUFBSSxFQUFFLFFBQVE7d0JBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsOEJBQThCLEVBQUUsc0NB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