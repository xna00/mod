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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/extensions/common/extensions", "vs/base/common/arrays", "vs/base/common/event", "vs/workbench/services/environment/common/environmentService", "vs/platform/files/common/files"], function (require, exports, nls_1, platform_1, lifecycle_1, configurationRegistry_1, configuration_1, editorResolverService_1, extensions_1, arrays_1, event_1, environmentService_1, files_1) {
    "use strict";
    var DynamicEditorConfigurations_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicEditorConfigurations = void 0;
    let DynamicEditorConfigurations = class DynamicEditorConfigurations extends lifecycle_1.Disposable {
        static { DynamicEditorConfigurations_1 = this; }
        static { this.ID = 'workbench.contrib.dynamicEditorConfigurations'; }
        static { this.AUTO_LOCK_DEFAULT_ENABLED = new Set([
            'terminalEditor',
            'mainThreadWebview-simpleBrowser.view',
            'mainThreadWebview-browserPreview'
        ]); }
        static { this.AUTO_LOCK_EXTRA_EDITORS = [
            // List some editor input identifiers that are not
            // registered yet via the editor resolver infrastructure
            {
                id: 'workbench.input.interactive',
                label: (0, nls_1.localize)('interactiveWindow', 'Interactive Window'),
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            },
            {
                id: 'mainThreadWebview-markdown.preview',
                label: (0, nls_1.localize)('markdownPreview', "Markdown Preview"),
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            },
            {
                id: 'mainThreadWebview-simpleBrowser.view',
                label: (0, nls_1.localize)('simpleBrowser', "Simple Browser"),
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            },
            {
                id: 'mainThreadWebview-browserPreview',
                label: (0, nls_1.localize)('livePreview', "Live Preview"),
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }
        ]; }
        static { this.AUTO_LOCK_REMOVE_EDITORS = new Set([
            // List some editor types that the above `AUTO_LOCK_EXTRA_EDITORS`
            // already covers to avoid duplicates.
            'vscode-interactive-input',
            'interactive',
            'vscode.markdown.preview.editor'
        ]); }
        constructor(editorResolverService, extensionService, environmentService) {
            super();
            this.editorResolverService = editorResolverService;
            this.environmentService = environmentService;
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            // Editor configurations are getting updated very aggressively
            // (atleast 20 times) while the extensions are getting registered.
            // As such push out the dynamic configuration until after extensions
            // are registered.
            (async () => {
                await extensionService.whenInstalledExtensionsRegistered();
                this.updateDynamicEditorConfigurations();
                this.registerListeners();
            })();
        }
        registerListeners() {
            // Registered editors (debounced to reduce perf overhead)
            this._register(event_1.Event.debounce(this.editorResolverService.onDidChangeEditorRegistrations, (_, e) => e)(() => this.updateDynamicEditorConfigurations()));
        }
        updateDynamicEditorConfigurations() {
            const lockableEditors = [...this.editorResolverService.getEditors(), ...DynamicEditorConfigurations_1.AUTO_LOCK_EXTRA_EDITORS].filter(e => !DynamicEditorConfigurations_1.AUTO_LOCK_REMOVE_EDITORS.has(e.id));
            const binaryEditorCandidates = this.editorResolverService.getEditors().filter(e => e.priority !== editorResolverService_1.RegisteredEditorPriority.exclusive).map(e => e.id);
            // Build config from registered editors
            const autoLockGroupConfiguration = Object.create(null);
            for (const editor of lockableEditors) {
                autoLockGroupConfiguration[editor.id] = {
                    type: 'boolean',
                    default: DynamicEditorConfigurations_1.AUTO_LOCK_DEFAULT_ENABLED.has(editor.id),
                    description: editor.label
                };
            }
            // Build default config too
            const defaultAutoLockGroupConfiguration = Object.create(null);
            for (const editor of lockableEditors) {
                defaultAutoLockGroupConfiguration[editor.id] = DynamicEditorConfigurations_1.AUTO_LOCK_DEFAULT_ENABLED.has(editor.id);
            }
            // Register setting for auto locking groups
            const oldAutoLockConfigurationNode = this.autoLockConfigurationNode;
            this.autoLockConfigurationNode = {
                ...configuration_1.workbenchConfigurationNodeBase,
                properties: {
                    'workbench.editor.autoLockGroups': {
                        type: 'object',
                        description: (0, nls_1.localize)('workbench.editor.autoLockGroups', "If an editor matching one of the listed types is opened as the first in an editor group and more than one group is open, the group is automatically locked. Locked groups will only be used for opening editors when explicitly chosen by a user gesture (for example drag and drop), but not by default. Consequently, the active editor in a locked group is less likely to be replaced accidentally with a different editor."),
                        properties: autoLockGroupConfiguration,
                        default: defaultAutoLockGroupConfiguration,
                        additionalProperties: false
                    }
                }
            };
            // Registers setting for default binary editors
            const oldDefaultBinaryEditorConfigurationNode = this.defaultBinaryEditorConfigurationNode;
            this.defaultBinaryEditorConfigurationNode = {
                ...configuration_1.workbenchConfigurationNodeBase,
                properties: {
                    'workbench.editor.defaultBinaryEditor': {
                        type: 'string',
                        default: '',
                        // This allows for intellisense autocompletion
                        enum: [...binaryEditorCandidates, ''],
                        description: (0, nls_1.localize)('workbench.editor.defaultBinaryEditor', "The default editor for files detected as binary. If undefined, the user will be presented with a picker."),
                    }
                }
            };
            // Registers setting for editorAssociations
            const oldEditorAssociationsConfigurationNode = this.editorAssociationsConfigurationNode;
            this.editorAssociationsConfigurationNode = {
                ...configuration_1.workbenchConfigurationNodeBase,
                properties: {
                    'workbench.editorAssociations': {
                        type: 'object',
                        markdownDescription: (0, nls_1.localize)('editor.editorAssociations', "Configure [glob patterns](https://aka.ms/vscode-glob-patterns) to editors (for example `\"*.hex\": \"hexEditor.hexedit\"`). These have precedence over the default behavior."),
                        patternProperties: {
                            '.*': {
                                type: 'string',
                                enum: binaryEditorCandidates,
                            }
                        }
                    }
                }
            };
            // Registers setting for large file confirmation based on environment
            const oldEditorLargeFileConfirmationConfigurationNode = this.editorLargeFileConfirmationConfigurationNode;
            this.editorLargeFileConfirmationConfigurationNode = {
                ...configuration_1.workbenchConfigurationNodeBase,
                properties: {
                    'workbench.editorLargeFileConfirmation': {
                        type: 'number',
                        default: (0, files_1.getLargeFileConfirmationLimit)(this.environmentService.remoteAuthority) / files_1.ByteSize.MB,
                        minimum: 1,
                        scope: 4 /* ConfigurationScope.RESOURCE */,
                        markdownDescription: (0, nls_1.localize)('editorLargeFileSizeConfirmation', "Controls the minimum size of a file in MB before asking for confirmation when opening in the editor. Note that this setting may not apply to all editor types and environments."),
                    }
                }
            };
            this.configurationRegistry.updateConfigurations({
                add: [
                    this.autoLockConfigurationNode,
                    this.defaultBinaryEditorConfigurationNode,
                    this.editorAssociationsConfigurationNode,
                    this.editorLargeFileConfirmationConfigurationNode
                ],
                remove: (0, arrays_1.coalesce)([
                    oldAutoLockConfigurationNode,
                    oldDefaultBinaryEditorConfigurationNode,
                    oldEditorAssociationsConfigurationNode,
                    oldEditorLargeFileConfirmationConfigurationNode
                ])
            });
        }
    };
    exports.DynamicEditorConfigurations = DynamicEditorConfigurations;
    exports.DynamicEditorConfigurations = DynamicEditorConfigurations = DynamicEditorConfigurations_1 = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, extensions_1.IExtensionService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService)
    ], DynamicEditorConfigurations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQ29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2VkaXRvckNvbmZpZ3VyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdCekYsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxzQkFBVTs7aUJBRTFDLE9BQUUsR0FBRywrQ0FBK0MsQUFBbEQsQ0FBbUQ7aUJBRTdDLDhCQUF5QixHQUFHLElBQUksR0FBRyxDQUFTO1lBQ25FLGdCQUFnQjtZQUNoQixzQ0FBc0M7WUFDdEMsa0NBQWtDO1NBQ2xDLENBQUMsQUFKK0MsQ0FJOUM7aUJBRXFCLDRCQUF1QixHQUEyQjtZQUV6RSxrREFBa0Q7WUFDbEQsd0RBQXdEO1lBRXhEO2dCQUNDLEVBQUUsRUFBRSw2QkFBNkI7Z0JBQ2pDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQztnQkFDMUQsUUFBUSxFQUFFLGdEQUF3QixDQUFDLE9BQU87YUFDMUM7WUFDRDtnQkFDQyxFQUFFLEVBQUUsb0NBQW9DO2dCQUN4QyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLENBQUM7Z0JBQ3RELFFBQVEsRUFBRSxnREFBd0IsQ0FBQyxPQUFPO2FBQzFDO1lBQ0Q7Z0JBQ0MsRUFBRSxFQUFFLHNDQUFzQztnQkFDMUMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxnQkFBZ0IsQ0FBQztnQkFDbEQsUUFBUSxFQUFFLGdEQUF3QixDQUFDLE9BQU87YUFDMUM7WUFDRDtnQkFDQyxFQUFFLEVBQUUsa0NBQWtDO2dCQUN0QyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsYUFB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