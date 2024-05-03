/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/lifecycle", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/registry/common/platform"], function (require, exports, nls, extensionsRegistry_1, notebookCommon_1, lifecycle_1, descriptors_1, extensionFeatures_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.notebookPreloadExtensionPoint = exports.notebookRendererExtensionPoint = exports.notebooksExtensionPoint = void 0;
    const NotebookEditorContribution = Object.freeze({
        type: 'type',
        displayName: 'displayName',
        selector: 'selector',
        priority: 'priority',
    });
    const NotebookRendererContribution = Object.freeze({
        id: 'id',
        displayName: 'displayName',
        mimeTypes: 'mimeTypes',
        entrypoint: 'entrypoint',
        hardDependencies: 'dependencies',
        optionalDependencies: 'optionalDependencies',
        requiresMessaging: 'requiresMessaging',
    });
    const NotebookPreloadContribution = Object.freeze({
        type: 'type',
        entrypoint: 'entrypoint',
        localResourceRoots: 'localResourceRoots',
    });
    const notebookProviderContribution = {
        description: nls.localize('contributes.notebook.provider', 'Contributes notebook document provider.'),
        type: 'array',
        defaultSnippets: [{ body: [{ type: '', displayName: '', 'selector': [{ 'filenamePattern': '' }] }] }],
        items: {
            type: 'object',
            required: [
                NotebookEditorContribution.type,
                NotebookEditorContribution.displayName,
                NotebookEditorContribution.selector,
            ],
            properties: {
                [NotebookEditorContribution.type]: {
                    type: 'string',
                    description: nls.localize('contributes.notebook.provider.viewType', 'Type of the notebook.'),
                },
                [NotebookEditorContribution.displayName]: {
                    type: 'string',
                    description: nls.localize('contributes.notebook.provider.displayName', 'Human readable name of the notebook.'),
                },
                [NotebookEditorContribution.selector]: {
                    type: 'array',
                    description: nls.localize('contributes.notebook.provider.selector', 'Set of globs that the notebook is for.'),
                    items: {
                        type: 'object',
                        properties: {
                            filenamePattern: {
                                type: 'string',
                                description: nls.localize('contributes.notebook.provider.selector.filenamePattern', 'Glob that the notebook is enabled for.'),
                            },
                            excludeFileNamePattern: {
                                type: 'string',
                                description: nls.localize('contributes.notebook.selector.provider.excludeFileNamePattern', 'Glob that the notebook is disabled for.')
                            }
                        }
                    }
                },
                [NotebookEditorContribution.priority]: {
                    type: 'string',
                    markdownDeprecationMessage: nls.localize('contributes.priority', 'Controls if the custom editor is enabled automatically when the user opens a file. This may be overridden by users using the `workbench.editorAssociations` setting.'),
                    enum: [
                        notebookCommon_1.NotebookEditorPriority.default,
                        notebookCommon_1.NotebookEditorPriority.option,
                    ],
                    markdownEnumDescriptions: [
                        nls.localize('contributes.priority.default', 'The editor is automatically used when the user opens a resource, provided that no other default custom editors are registered for that resource.'),
                        nls.localize('contributes.priority.option', 'The editor is not automatically used when the user opens a resource, but a user can switch to the editor using the `Reopen With` command.'),
                    ],
                    default: 'default'
                }
            }
        }
    };
    const defaultRendererSnippet = Object.freeze({ id: '', displayName: '', mimeTypes: [''], entrypoint: '' });
    const notebookRendererContribution = {
        description: nls.localize('contributes.notebook.renderer', 'Contributes notebook output renderer provider.'),
        type: 'array',
        defaultSnippets: [{ body: [defaultRendererSnippet] }],
        items: {
            defaultSnippets: [{ body: defaultRendererSnippet }],
            allOf: [
                {
                    type: 'object',
                    required: [
                        NotebookRendererContribution.id,
                        NotebookRendererContribution.displayName,
                    ],
                    properties: {
                        [NotebookRendererContribution.id]: {
                            type: 'string',
                            description: nls.localize('contributes.notebook.renderer.viewType', 'Unique identifier of the notebook output renderer.'),
                        },
                        [NotebookRendererContribution.displayName]: {
                            type: 'string',
                            description: nls.localize('contributes.notebook.renderer.displayName', 'Human readable name of the notebook output renderer.'),
                        },
                        [NotebookRendererContribution.hardDependencies]: {
                            type: 'array',
                            uniqueItems: true,
                            items: { type: 'string' },
                            markdownDescription: nls.localize('contributes.notebook.renderer.hardDependencies', 'List of kernel dependencies the renderer requires. If any of the dependencies are present in the `NotebookKernel.preloads`, the renderer can be used.'),
                        },
                        [NotebookRendererContribution.optionalDependencies]: {
                            type: 'array',
                            uniqueItems: true,
                            items: { type: 'string' },
                            markdownDescription: nls.localize('contributes.notebook.renderer.optionalDependencies', 'List of soft kernel dependencies the renderer can make use of. If any of the dependencies are present in the `NotebookKernel.preloads`, the renderer will be preferred over renderers that don\'t interact with the kernel.'),
                        },
                        [NotebookRendererContribution.requiresMessaging]: {
                            default: 'never',
                            enum: [
                                'always',
                                'optional',
                                'never',
                            ],
                            enumDescriptions: [
                                nls.localize('contributes.notebook.renderer.requiresMessaging.always', 'Messaging is required. The renderer will only be used when it\'s part of an extension that can be run in an extension host.'),
                                nls.localize('contributes.notebook.renderer.requiresMessaging.optional', 'The renderer is better with messaging available, but it\'s not requried.'),
                                nls.localize('contributes.notebook.renderer.requiresMessaging.never', 'The renderer does not require messaging.'),
                            ],
                            description: nls.localize('contributes.notebook.renderer.requiresMessaging', 'Defines how and if the renderer needs to communicate with an extension host, via `createRendererMessaging`. Renderers with stronger messaging requirements may not work in all environments.'),
                        },
                    }
                },
                {
                    oneOf: [
                        {
                            required: [
                                NotebookRendererContribution.entrypoint,
                                NotebookRendererContribution.mimeTypes,
                            ],
                            properties: {
                                [NotebookRendererContribution.mimeTypes]: {
                                    type: 'array',
                                    description: nls.localize('contributes.notebook.selector', 'Set of globs that the notebook is for.'),
                                    items: {
                                        type: 'string'
                                    }
                                },
                                [NotebookRendererContribution.entrypoint]: {
                                    description: nls.localize('contributes.notebook.renderer.entrypoint', 'File to load in the webview to render the extension.'),
                                    type: 'string',
                                },
                            }
                        },
                        {
                            required: [
                                NotebookRendererContribution.entrypoint,
                            ],
                            properties: {
                                [NotebookRendererContribution.entrypoint]: {
                                    description: nls.localize('contributes.notebook.renderer.entrypoint', 'File to load in the webview to render the extension.'),
                                    type: 'object',
                                    required: ['extends', 'path'],
                                    properties: {
                                        extends: {
                                            type: 'string',
                                            description: nls.localize('contributes.notebook.renderer.entrypoint.extends', 'Existing renderer that this one extends.'),
                                        },
                                        path: {
                                            type: 'string',
                                            description: nls.localize('contributes.notebook.renderer.entrypoint', 'File to load in the webview to render the extension.'),
                                        },
                                    }
                                },
                            }
                        }
                    ]
                }
            ]
        }
    };
    const notebookPreloadContribution = {
        description: nls.localize('contributes.preload.provider', 'Contributes notebook preloads.'),
        type: 'array',
        defaultSnippets: [{ body: [{ type: '', entrypoint: '' }] }],
        items: {
            type: 'object',
            required: [
                NotebookPreloadContribution.type,
                NotebookPreloadContribution.entrypoint
            ],
            properties: {
                [NotebookPreloadContribution.type]: {
                    type: 'string',
                    description: nls.localize('contributes.preload.provider.viewType', 'Type of the notebook.'),
                },
                [NotebookPreloadContribution.entrypoint]: {
                    type: 'string',
                    description: nls.localize('contributes.preload.entrypoint', 'Path to file loaded in the webview.'),
                },
                [NotebookPreloadContribution.localResourceRoots]: {
                    type: 'array',
                    items: { type: 'string' },
                    description: nls.localize('contributes.preload.localResourceRoots', 'Paths to additional resources that should be allowed in the webview.'),
                },
            }
        }
    };
    exports.notebooksExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'notebooks',
        jsonSchema: notebookProviderContribution,
        activationEventsGenerator: (contribs, result) => {
            for (const contrib of contribs) {
                if (contrib.type) {
                    result.push(`onNotebookSerializer:${contrib.type}`);
                }
            }
        }
    });
    exports.notebookRendererExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'notebookRenderer',
        jsonSchema: notebookRendererContribution,
        activationEventsGenerator: (contribs, result) => {
            for (const contrib of contribs) {
                if (contrib.id) {
                    result.push(`onRenderer:${contrib.id}`);
                }
            }
        }
    });
    exports.notebookPreloadExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'notebookPreload',
        jsonSchema: notebookPreloadContribution,
    });
    class NotebooksDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.notebooks;
        }
        render(manifest) {
            const contrib = manifest.contributes?.notebooks || [];
            if (!contrib.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                nls.localize('Notebook id', "ID"),
                nls.localize('Notebook name', "Name"),
            ];
            const rows = contrib
                .sort((a, b) => a.type.localeCompare(b.type))
                .map(notebook => {
                return [
                    notebook.type,
                    notebook.displayName
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
    class NotebookRenderersDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.notebookRenderer;
        }
        render(manifest) {
            const contrib = manifest.contributes?.notebookRenderer || [];
            if (!contrib.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                nls.localize('Notebook renderer name', "Name"),
                nls.localize('Notebook mimetypes', "Mimetypes"),
            ];
            const rows = contrib
                .sort((a, b) => a.displayName.localeCompare(b.displayName))
                .map(notebookRenderer => {
                return [
                    notebookRenderer.displayName,
                    notebookRenderer.mimeTypes.join(',')
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
        id: 'notebooks',
        label: nls.localize('notebooks', "Notebooks"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(NotebooksDataRenderer),
    });
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'notebookRenderer',
        label: nls.localize('notebookRenderer', "Notebook Renderers"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(NotebookRenderersDataRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFeHRlbnNpb25Qb2ludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9ub3RlYm9va0V4dGVuc2lvblBvaW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFNLDBCQUEwQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDaEQsSUFBSSxFQUFFLE1BQU07UUFDWixXQUFXLEVBQUUsYUFBYTtRQUMxQixRQUFRLEVBQUUsVUFBVTtRQUNwQixRQUFRLEVBQUUsVUFBVTtLQUNwQixDQUFDLENBQUM7SUFTSCxNQUFNLDRCQUE0QixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDbEQsRUFBRSxFQUFFLElBQUk7UUFDUixXQUFXLEVBQUUsYUFBYTtRQUMxQixTQUFTLEVBQUUsV0FBVztRQUN0QixVQUFVLEVBQUUsWUFBWTtRQUN4QixnQkFBZ0IsRUFBRSxjQUFjO1FBQ2hDLG9CQUFvQixFQUFFLHNCQUFzQjtRQUM1QyxpQkFBaUIsRUFBRSxtQkFBbUI7S0FDdEMsQ0FBQyxDQUFDO0lBWUgsTUFBTSwyQkFBMkIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2pELElBQUksRUFBRSxNQUFNO1FBQ1osVUFBVSxFQUFFLFlBQVk7UUFDeEIsa0JBQWtCLEVBQUUsb0JBQW9CO0tBQ3hDLENBQUMsQ0FBQztJQVFILE1BQU0sNEJBQTRCLEdBQWdCO1FBQ2pELFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLCtCQUErQixFQUFFLHlDQUF5QyxDQUFDO1FBQ3JHLElBQUksRUFBRSxPQUFPO1FBQ2IsZUFBZSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLEVB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