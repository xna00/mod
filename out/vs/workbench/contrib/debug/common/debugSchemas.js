/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/nls", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/configurationResolver/common/configurationResolverSchema", "vs/base/common/lifecycle", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/instantiation/common/descriptors", "vs/platform/registry/common/platform"], function (require, exports, extensionsRegistry, nls, configuration_1, configurationResolverSchema_1, lifecycle_1, extensionFeatures_1, descriptors_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.launchSchema = exports.presentationSchema = exports.breakpointsExtPoint = exports.debuggersExtPoint = void 0;
    // debuggers extension point
    exports.debuggersExtPoint = extensionsRegistry.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'debuggers',
        defaultExtensionKind: ['workspace'],
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.debuggers', 'Contributes debug adapters.'),
            type: 'array',
            defaultSnippets: [{ body: [{ type: '' }] }],
            items: {
                additionalProperties: false,
                type: 'object',
                defaultSnippets: [{ body: { type: '', program: '', runtime: '' } }],
                properties: {
                    type: {
                        description: nls.localize('vscode.extension.contributes.debuggers.type', "Unique identifier for this debug adapter."),
                        type: 'string'
                    },
                    label: {
                        description: nls.localize('vscode.extension.contributes.debuggers.label', "Display name for this debug adapter."),
                        type: 'string'
                    },
                    program: {
                        description: nls.localize('vscode.extension.contributes.debuggers.program', "Path to the debug adapter program. Path is either absolute or relative to the extension folder."),
                        type: 'string'
                    },
                    args: {
                        description: nls.localize('vscode.extension.contributes.debuggers.args', "Optional arguments to pass to the adapter."),
                        type: 'array'
                    },
                    runtime: {
                        description: nls.localize('vscode.extension.contributes.debuggers.runtime', "Optional runtime in case the program attribute is not an executable but requires a runtime."),
                        type: 'string'
                    },
                    runtimeArgs: {
                        description: nls.localize('vscode.extension.contributes.debuggers.runtimeArgs', "Optional runtime arguments."),
                        type: 'array'
                    },
                    variables: {
                        description: nls.localize('vscode.extension.contributes.debuggers.variables', "Mapping from interactive variables (e.g. ${action.pickProcess}) in `launch.json` to a command."),
                        type: 'object'
                    },
                    initialConfigurations: {
                        description: nls.localize('vscode.extension.contributes.debuggers.initialConfigurations', "Configurations for generating the initial \'launch.json\'."),
                        type: ['array', 'string'],
                    },
                    languages: {
                        description: nls.localize('vscode.extension.contributes.debuggers.languages', "List of languages for which the debug extension could be considered the \"default debugger\"."),
                        type: 'array'
                    },
                    configurationSnippets: {
                        description: nls.localize('vscode.extension.contributes.debuggers.configurationSnippets', "Snippets for adding new configurations in \'launch.json\'."),
                        type: 'array'
                    },
                    configurationAttributes: {
                        description: nls.localize('vscode.extension.contributes.debuggers.configurationAttributes', "JSON schema configurations for validating \'launch.json\'."),
                        type: 'object'
                    },
                    when: {
                        description: nls.localize('vscode.extension.contributes.debuggers.when', "Condition which must be true to enable this type of debugger. Consider using 'shellExecutionSupported', 'virtualWorkspace', 'resourceScheme' or an extension-defined context key as appropriate for this."),
                        type: 'string',
                        default: ''
                    },
                    hiddenWhen: {
                        description: nls.localize('vscode.extension.contributes.debuggers.hiddenWhen', "When this condition is true, this debugger type is hidden from the debugger list, but is still enabled."),
                        type: 'string',
                        default: ''
                    },
                    deprecated: {
                        description: nls.localize('vscode.extension.contributes.debuggers.deprecated', "Optional message to mark this debug type as being deprecated."),
                        type: 'string',
                        default: ''
                    },
                    windows: {
                        description: nls.localize('vscode.extension.contributes.debuggers.windows', "Windows specific settings."),
                        type: 'object',
                        properties: {
                            runtime: {
                                description: nls.localize('vscode.extension.contributes.debuggers.windows.runtime', "Runtime used for Windows."),
                                type: 'string'
                            }
                        }
                    },
                    osx: {
                        description: nls.localize('vscode.extension.contributes.debuggers.osx', "macOS specific settings."),
                        type: 'object',
                        properties: {
                            runtime: {
                                description: nls.localize('vscode.extension.contributes.debuggers.osx.runtime', "Runtime used for macOS."),
                                type: 'string'
                            }
                        }
                    },
                    linux: {
                        description: nls.localize('vscode.extension.contributes.debuggers.linux', "Linux specific settings."),
                        type: 'object',
                        properties: {
                            runtime: {
                                description: nls.localize('vscode.extension.contributes.debuggers.linux.runtime', "Runtime used for Linux."),
                                type: 'string'
                            }
                        }
                    },
                    strings: {
                        description: nls.localize('vscode.extension.contributes.debuggers.strings', "UI strings contributed by this debug adapter."),
                        type: 'object',
                        properties: {
                            unverifiedBreakpoints: {
                                description: nls.localize('vscode.extension.contributes.debuggers.strings.unverifiedBreakpoints', "When there are unverified breakpoints in a language supported by this debug adapter, this message will appear on the breakpoint hover and in the breakpoints view. Markdown and command links are supported."),
                                type: 'string'
                            }
                        }
                    }
                }
            }
        }
    });
    // breakpoints extension point #9037
    exports.breakpointsExtPoint = extensionsRegistry.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'breakpoints',
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.breakpoints', 'Contributes breakpoints.'),
            type: 'array',
            defaultSnippets: [{ body: [{ language: '' }] }],
            items: {
                type: 'object',
                additionalProperties: false,
                defaultSnippets: [{ body: { language: '' } }],
                properties: {
                    language: {
                        description: nls.localize('vscode.extension.contributes.breakpoints.language', "Allow breakpoints for this language."),
                        type: 'string'
                    },
                    when: {
                        description: nls.localize('vscode.extension.contributes.breakpoints.when', "Condition which must be true to enable breakpoints in this language. Consider matching this to the debugger when clause as appropriate."),
                        type: 'string',
                        default: ''
                    }
                }
            }
        }
    });
    // debug general schema
    exports.presentationSchema = {
        type: 'object',
        description: nls.localize('presentation', "Presentation options on how to show this configuration in the debug configuration dropdown and the command palette."),
        properties: {
            hidden: {
                type: 'boolean',
                default: false,
                description: nls.localize('presentation.hidden', "Controls if this configuration should be shown in the configuration dropdown and the command palette.")
            },
            group: {
                type: 'string',
                default: '',
                description: nls.localize('presentation.group', "Group that this configuration belongs to. Used for grouping and sorting in the configuration dropdown and the command palette.")
            },
            order: {
                type: 'number',
                default: 1,
                description: nls.localize('presentation.order', "Order of this configuration within a group. Used for grouping and sorting in the configuration dropdown and the command palette.")
            }
        },
        default: {
            hidden: false,
            group: '',
            order: 1
        }
    };
    const defaultCompound = { name: 'Compound', configurations: [] };
    exports.launchSchema = {
        id: configuration_1.launchSchemaId,
        type: 'object',
        title: nls.localize('app.launch.json.title', "Launch"),
        allowTrailingCommas: true,
        allowComments: true,
        required: [],
        default: { version: '0.2.0', configurations: [], compounds: [] },
        properties: {
            version: {
                type: 'string',
                description: nls.localize('app.launch.json.version', "Version of this file format."),
                default: '0.2.0'
            },
            configurations: {
                type: 'array',
                description: nls.localize('app.launch.json.configurations', "List of configurations. Add new configurations or edit existing ones by using IntelliSense."),
                items: {
                    defaultSnippets: [],
                    'type': 'object',
                    oneOf: []
                }
            },
            compounds: {
                type: 'array',
                description: nls.localize('app.launch.json.compounds', "List of compounds. Each compound references multiple configurations which will get launched together."),
                items: {
                    type: 'object',
                    required: ['name', 'configurations'],
                    properties: {
                        name: {
                            type: 'string',
                            description: nls.localize('app.launch.json.compound.name', "Name of compound. Appears in the launch configuration drop down menu.")
                        },
                        presentation: exports.presentationSchema,
                        configurations: {
                            type: 'array',
                            default: [],
                            items: {
                                oneOf: [{
                                        enum: [],
                                        description: nls.localize('useUniqueNames', "Please use unique configuration names.")
                                    }, {
                                        type: 'object',
                                        required: ['name'],
                                        properties: {
                                            name: {
                                                enum: [],
                                                description: nls.localize('app.launch.json.compound.name', "Name of compound. Appears in the launch configuration drop down menu.")
                                            },
                                            folder: {
                                                enum: [],
                                                description: nls.localize('app.launch.json.compound.folder', "Name of folder in which the compound is located.")
                                            }
                                        }
                                    }]
                            },
                            description: nls.localize('app.launch.json.compounds.configurations', "Names of configurations that will be started as part of this compound.")
                        },
                        stopAll: {
                            type: 'boolean',
                            default: false,
                            description: nls.localize('app.launch.json.compound.stopAll', "Controls whether manually terminating one session will stop all of the compound sessions.")
                        },
                        preLaunchTask: {
                            type: 'string',
                            default: '',
                            description: nls.localize('compoundPrelaunchTask', "Task to run before any of the compound configurations start.")
                        }
                    },
                    default: defaultCompound
                },
                default: [
                    defaultCompound
                ]
            },
            inputs: configurationResolverSchema_1.inputsSchema.definitions.inputs
        }
    };
    class DebuggersDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.debuggers;
        }
        render(manifest) {
            const contrib = manifest.contributes?.debuggers || [];
            if (!contrib.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                nls.localize('debugger name', "Name"),
                nls.localize('debugger type', "Type"),
            ];
            const rows = contrib.map(d => {
                return [
                    d.label ?? '',
                    d.type
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
        id: 'debuggers',
        label: nls.localize('debuggers', "Debuggers"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(DebuggersDataRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdTY2hlbWFzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9jb21tb24vZGVidWdTY2hlbWFzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyw0QkFBNEI7SUFDZixRQUFBLGlCQUFpQixHQUFHLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLHNCQUFzQixDQUEwQjtRQUN0SCxjQUFjLEVBQUUsV0FBVztRQUMzQixvQkFBb0IsRUFBRSxDQUFDLFdBQVcsQ0FBQztRQUNuQyxVQUFVLEVBQUU7WUFDWCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3Q0FBd0MsRUFBRSw2QkFBNkIsQ0FBQztZQUNsRyxJQUFJLEVBQUUsT0FBTztZQUNiLGVBQWUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQzNDLEtBQUssRUFBRTtnQkFDTixvQkFBb0IsRUFBRSxLQUFLO2dCQUMzQixJQUFJLEVBQUUsUUFBUTtnQkFDZCxlQUFlLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkUsVUFBVSxFQUFFO29CQUNYLElBQUksRUFBRTt3QkFDTCxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyw2Q0FBNkMsRUFBRSwyQ0FBMkMsQ0FBQzt3QkFDckgsSUFBSSxFQUFFLFFBQVE7cUJBQ2Q7b0JBQ0QsS0FBSyxFQUFFO3dCQUNOLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDhDQUE4QyxFQUFFLHNDQUFzQyxDQUFDO3dCQUNqSCxJQUFJLEVB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