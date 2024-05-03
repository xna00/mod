/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/lifecycle", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/base/common/htmlContent"], function (require, exports, nls, extensionsRegistry_1, resources, types_1, lifecycle_1, extensionFeatures_1, platform_1, descriptors_1, htmlContent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JSONValidationExtensionPoint = void 0;
    const configurationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'jsonValidation',
        defaultExtensionKind: ['workspace', 'web'],
        jsonSchema: {
            description: nls.localize('contributes.jsonValidation', 'Contributes json schema configuration.'),
            type: 'array',
            defaultSnippets: [{ body: [{ fileMatch: '${1:file.json}', url: '${2:url}' }] }],
            items: {
                type: 'object',
                defaultSnippets: [{ body: { fileMatch: '${1:file.json}', url: '${2:url}' } }],
                properties: {
                    fileMatch: {
                        type: ['string', 'array'],
                        description: nls.localize('contributes.jsonValidation.fileMatch', 'The file pattern (or an array of patterns) to match, for example "package.json" or "*.launch". Exclusion patterns start with \'!\''),
                        items: {
                            type: ['string']
                        }
                    },
                    url: {
                        description: nls.localize('contributes.jsonValidation.url', 'A schema URL (\'http:\', \'https:\') or relative path to the extension folder (\'./\').'),
                        type: 'string'
                    }
                }
            }
        }
    });
    class JSONValidationExtensionPoint {
        constructor() {
            configurationExtPoint.setHandler((extensions) => {
                for (const extension of extensions) {
                    const extensionValue = extension.value;
                    const collector = extension.collector;
                    const extensionLocation = extension.description.extensionLocation;
                    if (!extensionValue || !Array.isArray(extensionValue)) {
                        collector.error(nls.localize('invalid.jsonValidation', "'configuration.jsonValidation' must be a array"));
                        return;
                    }
                    extensionValue.forEach(extension => {
                        if (!(0, types_1.isString)(extension.fileMatch) && !(Array.isArray(extension.fileMatch) && extension.fileMatch.every(types_1.isString))) {
                            collector.error(nls.localize('invalid.fileMatch', "'configuration.jsonValidation.fileMatch' must be defined as a string or an array of strings."));
                            return;
                        }
                        const uri = extension.url;
                        if (!(0, types_1.isString)(uri)) {
                            collector.error(nls.localize('invalid.url', "'configuration.jsonValidation.url' must be a URL or relative path"));
                            return;
                        }
                        if (uri.startsWith('./')) {
                            try {
                                const colorThemeLocation = resources.joinPath(extensionLocation, uri);
                                if (!resources.isEqualOrParent(colorThemeLocation, extensionLocation)) {
                                    collector.warn(nls.localize('invalid.path.1', "Expected `contributes.{0}.url` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", configurationExtPoint.name, colorThemeLocation.toString(), extensionLocation.path));
                                }
                            }
                            catch (e) {
                                collector.error(nls.localize('invalid.url.fileschema', "'configuration.jsonValidation.url' is an invalid relative URL: {0}", e.message));
                            }
                        }
                        else if (!/^[^:/?#]+:\/\//.test(uri)) {
                            collector.error(nls.localize('invalid.url.schema', "'configuration.jsonValidation.url' must be an absolute URL or start with './'  to reference schemas located in the extension."));
                            return;
                        }
                    });
                }
            });
        }
    }
    exports.JSONValidationExtensionPoint = JSONValidationExtensionPoint;
    class JSONValidationDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.jsonValidation;
        }
        render(manifest) {
            const contrib = manifest.contributes?.jsonValidation || [];
            if (!contrib.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                nls.localize('fileMatch', "File Match"),
                nls.localize('schema', "Schema"),
            ];
            const rows = contrib.map(v => {
                return [
                    new htmlContent_1.MarkdownString().appendMarkdown(`\`${Array.isArray(v.fileMatch) ? v.fileMatch.join(', ') : v.fileMatch}\``),
                    v.url,
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
        id: 'jsonValidation',
        label: nls.localize('jsonValidation', "JSON Validation"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(JSONValidationDataRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvblZhbGlkYXRpb25FeHRlbnNpb25Qb2ludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vanNvblZhbGlkYXRpb25FeHRlbnNpb25Qb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQmhHLE1BQU0scUJBQXFCLEdBQUcsdUNBQWtCLENBQUMsc0JBQXNCLENBQWtDO1FBQ3hHLGNBQWMsRUFBRSxnQkFBZ0I7UUFDaEMsb0JBQW9CLEVBQUUsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDO1FBQzFDLFVBQVUsRUFBRTtZQUNYLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDRCQUE0QixFQUFFLHdDQUF3QyxDQUFDO1lBQ2pHLElBQUksRUFBRSxPQUFPO1lBQ2IsZUFBZSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQy9FLEtBQUssRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxlQUFlLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDN0UsVUFBVSxFQUFFO29CQUNYLFNBQVMsRUFBRTt3QkFDVixJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDO3dCQUN6QixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRSxvSUFBb0ksQ0FBQzt3QkFDdk0sS0FBSyxFQUFFOzRCQUNOLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQzt5QkFDaEI7cUJBQ0Q7b0JBQ0QsR0FBRyxFQUFFO3dCQUNKLFdB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