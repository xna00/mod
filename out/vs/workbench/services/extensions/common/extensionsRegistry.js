/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/base/common/severity", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsApiProposals", "vs/platform/product/common/productService", "vs/platform/extensionManagement/common/implicitActivationEvents"], function (require, exports, nls, errors_1, severity_1, extensionManagement_1, jsonContributionRegistry_1, platform_1, extensions_1, extensionsApiProposals_1, productService_1, implicitActivationEvents_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsRegistry = exports.ExtensionsRegistryImpl = exports.schema = exports.ExtensionPoint = exports.ExtensionPointUserDelta = exports.ExtensionMessageCollector = void 0;
    const schemaRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    class ExtensionMessageCollector {
        constructor(messageHandler, extension, extensionPointId) {
            this._messageHandler = messageHandler;
            this._extension = extension;
            this._extensionPointId = extensionPointId;
        }
        _msg(type, message) {
            this._messageHandler({
                type: type,
                message: message,
                extensionId: this._extension.identifier,
                extensionPointId: this._extensionPointId
            });
        }
        error(message) {
            this._msg(severity_1.default.Error, message);
        }
        warn(message) {
            this._msg(severity_1.default.Warning, message);
        }
        info(message) {
            this._msg(severity_1.default.Info, message);
        }
    }
    exports.ExtensionMessageCollector = ExtensionMessageCollector;
    class ExtensionPointUserDelta {
        static _toSet(arr) {
            const result = new extensions_1.ExtensionIdentifierSet();
            for (let i = 0, len = arr.length; i < len; i++) {
                result.add(arr[i].description.identifier);
            }
            return result;
        }
        static compute(previous, current) {
            if (!previous || !previous.length) {
                return new ExtensionPointUserDelta(current, []);
            }
            if (!current || !current.length) {
                return new ExtensionPointUserDelta([], previous);
            }
            const previousSet = this._toSet(previous);
            const currentSet = this._toSet(current);
            const added = current.filter(user => !previousSet.has(user.description.identifier));
            const removed = previous.filter(user => !currentSet.has(user.description.identifier));
            return new ExtensionPointUserDelta(added, removed);
        }
        constructor(added, removed) {
            this.added = added;
            this.removed = removed;
        }
    }
    exports.ExtensionPointUserDelta = ExtensionPointUserDelta;
    class ExtensionPoint {
        constructor(name, defaultExtensionKind) {
            this.name = name;
            this.defaultExtensionKind = defaultExtensionKind;
            this._handler = null;
            this._users = null;
            this._delta = null;
        }
        setHandler(handler) {
            if (this._handler !== null) {
                throw new Error('Handler already set!');
            }
            this._handler = handler;
            this._handle();
        }
        acceptUsers(users) {
            this._delta = ExtensionPointUserDelta.compute(this._users, users);
            this._users = users;
            this._handle();
        }
        _handle() {
            if (this._handler === null || this._users === null || this._delta === null) {
                return;
            }
            try {
                this._handler(this._users, this._delta);
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
            }
        }
    }
    exports.ExtensionPoint = ExtensionPoint;
    const extensionKindSchema = {
        type: 'string',
        enum: [
            'ui',
            'workspace'
        ],
        enumDescriptions: [
            nls.localize('ui', "UI extension kind. In a remote window, such extensions are enabled only when available on the local machine."),
            nls.localize('workspace', "Workspace extension kind. In a remote window, such extensions are enabled only when available on the remote."),
        ],
    };
    const schemaId = 'vscode://schemas/vscode-extensions';
    exports.schema = {
        properties: {
            engines: {
                type: 'object',
                description: nls.localize('vscode.extension.engines', "Engine compatibility."),
                properties: {
                    'vscode': {
                        type: 'string',
                        description: nls.localize('vscode.extension.engines.vscode', 'For VS Code extensions, specifies the VS Code version that the extension is compatible with. Cannot be *. For example: ^0.10.5 indicates compatibility with a minimum VS Code version of 0.10.5.'),
                        default: '^1.22.0',
                    }
                }
            },
            publisher: {
                description: nls.localize('vscode.extension.publisher', 'The publisher of the VS Code extension.'),
                type: 'string'
            },
            displayName: {
                description: nls.localize('vscode.extension.displayName', 'The display name for the extension used in the VS Code gallery.'),
                type: 'string'
            },
            categories: {
                description: nls.localize('vscode.extension.categories', 'The categories used by the VS Code gallery to categorize the extension.'),
                type: 'array',
                uniqueItems: true,
                items: {
                    oneOf: [{
                            type: 'string',
                            enum: extensions_1.EXTENSION_CATEGORIES,
                        },
                        {
                            type: 'string',
                            const: 'Languages',
                            deprecationMessage: nls.localize('vscode.extension.category.languages.deprecated', 'Use \'Programming  Languages\' instead'),
                        }]
                }
            },
            galleryBanner: {
                type: 'object',
                description: nls.localize('vscode.extension.galleryBanner', 'Banner used in the VS Code marketplace.'),
                properties: {
                    color: {
                        description: nls.localize('vscode.extension.galleryBanner.color', 'The banner color on the VS Code marketplace page header.'),
                        type: 'string'
                    },
                    theme: {
                        description: nls.localize('vscode.extension.galleryBanner.theme', 'The color theme for the font used in the banner.'),
                        type: 'string',
                        enum: ['dark', 'light']
                    }
                }
            },
            contributes: {
                description: nls.localize('vscode.extension.contributes', 'All contributions of the VS Code extension represented by this package.'),
                type: 'object',
                properties: {
                // extensions will fill in
                },
                default: {}
            },
            preview: {
                type: 'boolean',
                description: nls.localize('vscode.extension.preview', 'Sets the extension to be flagged as a Preview in the Marketplace.'),
            },
            enableProposedApi: {
                type: 'boolean',
                deprecationMessage: nls.localize('vscode.extension.enableProposedApi.deprecated', 'Use `enabledApiProposals` instead.'),
            },
            enabledApiProposals: {
                markdownDescription: nls.localize('vscode.extension.enabledApiProposals', 'Enable API proposals to try them out. Only valid **during development**. Extensions **cannot be published** with this property. For more details visit: https://code.visualstudio.com/api/advanced-topics/using-proposed-api'),
                type: 'array',
                uniqueItems: true,
                items: {
                    type: 'string',
                    enum: Object.keys(extensionsApiProposals_1.allApiProposals),
                    markdownEnumDescriptions: Object.values(extensionsApiProposals_1.allApiProposals)
                }
            },
            api: {
                markdownDescription: nls.localize('vscode.extension.api', 'Describe the API provided by this extension. For more details visit: https://code.visualstudio.com/api/advanced-topics/remote-extensions#handling-dependencies-with-remote-extensions'),
                type: 'string',
                enum: ['none'],
                enumDescriptions: [
                    nls.localize('vscode.extension.api.none', "Give up entirely the ability to export any APIs. This allows other extensions that depend on this extension to run in a separate extension host process or in a remote machine.")
                ]
            },
            activationEvents: {
                description: nls.localize('vscode.extension.activationEvents', 'Activation events for the VS Code extension.'),
                type: 'array',
                items: {
                    type: 'string',
                    defaultSnippets: [
                        {
                            label: 'onWebviewPanel',
                            description: nls.localize('vscode.extension.activationEvents.onWebviewPanel', 'An activation event emmited when a webview is loaded of a certain viewType'),
                            body: 'onWebviewPanel:viewType'
                        },
                        {
                            label: 'onLanguage',
                            description: nls.localize('vscode.extension.activationEvents.onLanguage', 'An activation event emitted whenever a file that resolves to the specified language gets opened.'),
                            body: 'onLanguage:${1:languageId}'
                        },
                        {
                            label: 'onCommand',
                            description: nls.localize('vscode.extension.activationEvents.onCommand', 'An activation event emitted whenever the specified command gets invoked.'),
                            body: 'onCommand:${2:commandId}'
                        },
                        {
                            label: 'onDebug',
                            description: nls.localize('vscode.extension.activationEvents.onDebug', 'An activation event emitted whenever a user is about to start debugging or about to setup debug configurations.'),
                            body: 'onDebug'
                        },
                        {
                            label: 'onDebugInitialConfigurations',
                            description: nls.localize('vscode.extension.activationEvents.onDebugInitialConfigurations', 'An activation event emitted whenever a "launch.json" needs to be created (and all provideDebugConfigurations methods need to be called).'),
                            body: 'onDebugInitialConfigurations'
                        },
                        {
                            label: 'onDebugDynamicConfigurations',
                            description: nls.localize('vscode.extension.activationEvents.onDebugDynamicConfigurations', 'An activation event emitted whenever a list of all debug configurations needs to be created (and all provideDebugConfigurations methods for the "dynamic" scope need to be called).'),
                            body: 'onDebugDynamicConfigurations'
                        },
                        {
                            label: 'onDebugResolve',
                            description: nls.localize('vscode.extension.activationEvents.onDebugResolve', 'An activation event emitted whenever a debug session with the specific type is about to be launched (and a corresponding resolveDebugConfiguration method needs to be called).'),
                            body: 'onDebugResolve:${6:type}'
                        },
                        {
                            label: 'onDebugAdapterProtocolTracker',
                            description: nls.localize('vscode.extension.activationEvents.onDebugAdapterProtocolTracker', 'An activation event emitted whenever a debug session with the specific type is about to be launched and a debug protocol tracker might be needed.'),
                            body: 'onDebugAdapterProtocolTracker:${6:type}'
                        },
                        {
                            label: 'workspaceContains',
                            description: nls.localize('vscode.extension.activationEvents.workspaceContains', 'An activation event emitted whenever a folder is opened that contains at least a file matching the specified glob pattern.'),
                            body: 'workspaceContains:${4:filePattern}'
                        },
                        {
                            label: 'onStartupFinished',
                            description: nls.localize('vscode.extension.activationEvents.onStartupFinished', 'An activation event emitted after the start-up finished (after all `*` activated extensions have finished activating).'),
                            body: 'onStartupFinished'
                        },
                        {
                            label: 'onTaskType',
                            description: nls.localize('vscode.extension.activationEvents.onTaskType', 'An activation event emitted whenever tasks of a certain type need to be listed or resolved.'),
                            body: 'onTaskType:${1:taskType}'
                        },
                        {
                            label: 'onFileSystem',
                            description: nls.localize('vscode.extension.activationEvents.onFileSystem', 'An activation event emitted whenever a file or folder is accessed with the given scheme.'),
                            body: 'onFileSystem:${1:scheme}'
                        },
                        {
                            label: 'onEditSession',
                            description: nls.localize('vscode.extension.activationEvents.onEditSession', 'An activation event emitted whenever an edit session is accessed with the given scheme.'),
                            body: 'onEditSession:${1:scheme}'
                        },
                        {
                            label: 'onSearch',
                            description: nls.localize('vscode.extension.activationEvents.onSearch', 'An activation event emitted whenever a search is started in the folder with the given scheme.'),
                            body: 'onSearch:${7:scheme}'
                        },
                        {
                            label: 'onView',
                            body: 'onView:${5:viewId}',
                            description: nls.localize('vscode.extension.activationEvents.onView', 'An activation event emitted whenever the specified view is expanded.'),
                        },
                        {
                            label: 'onUri',
                            body: 'onUri',
                            description: nls.localize('vscode.extension.activationEvents.onUri', 'An activation event emitted whenever a system-wide Uri directed towards this extension is open.'),
                        },
                        {
                            label: 'onOpenExternalUri',
                            body: 'onOpenExternalUri',
                            description: nls.localize('vscode.extension.activationEvents.onOpenExternalUri', 'An activation event emitted whenever a external uri (such as an http or https link) is being opened.'),
                        },
                        {
                            label: 'onCustomEditor',
                            body: 'onCustomEditor:${9:viewType}',
                            description: nls.localize('vscode.extension.activationEvents.onCustomEditor', 'An activation event emitted whenever the specified custom editor becomes visible.'),
                        },
                        {
                            label: 'onNotebook',
                            body: 'onNotebook:${1:type}',
                            description: nls.localize('vscode.extension.activationEvents.onNotebook', 'An activation event emitted whenever the specified notebook document is opened.'),
                        },
                        {
                            label: 'onAuthenticationRequest',
                            body: 'onAuthenticationRequest:${11:authenticationProviderId}',
                            description: nls.localize('vscode.extension.activationEvents.onAuthenticationRequest', 'An activation event emitted whenever sessions are requested from the specified authentication provider.')
                        },
                        {
                            label: 'onRenderer',
                            description: nls.localize('vscode.extension.activationEvents.onRenderer', 'An activation event emitted whenever a notebook output renderer is used.'),
                            body: 'onRenderer:${11:rendererId}'
                        },
                        {
                            label: 'onTerminalProfile',
                            body: 'onTerminalProfile:${1:terminalId}',
                            description: nls.localize('vscode.extension.activationEvents.onTerminalProfile', 'An activation event emitted when a specific terminal profile is launched.'),
                        },
                        {
                            label: 'onTerminalQuickFixRequest',
                            body: 'onTerminalQuickFixRequest:${1:quickFixId}',
                            description: nls.localize('vscode.extension.activationEvents.onTerminalQuickFixRequest', 'An activation event emitted when a command matches the selector associated with this ID'),
                        },
                        {
                            label: 'onWalkthrough',
                            body: 'onWalkthrough:${1:walkthroughID}',
                            description: nls.localize('vscode.extension.activationEvents.onWalkthrough', 'An activation event emitted when a specified walkthrough is opened.'),
                        },
                        {
                            label: 'onIssueReporterOpened',
                            body: 'onIssueReporterOpened',
                            description: nls.localize('vscode.extension.activationEvents.onIssueReporterOpened', 'An activation event emitted when the issue reporter is opened.'),
                        },
                        {
                            label: '*',
                            description: nls.localize('vscode.extension.activationEvents.star', 'An activation event emitted on VS Code startup. To ensure a great end user experience, please use this activation event in your extension only when no other activation events combination works in your use-case.'),
                            body: '*'
                        }
                    ],
                }
            },
            badges: {
                type: 'array',
                description: nls.localize('vscode.extension.badges', 'Array of badges to display in the sidebar of the Marketplace\'s extension page.'),
                items: {
                    type: 'object',
                    required: ['url', 'href', 'description'],
                    properties: {
                        url: {
                            type: 'string',
                            description: nls.localize('vscode.extension.badges.url', 'Badge image URL.')
                        },
                        href: {
                            type: 'string',
                            description: nls.localize('vscode.extension.badges.href', 'Badge link.')
                        },
                        description: {
                            type: 'string',
                            description: nls.localize('vscode.extension.badges.description', 'Badge description.')
                        }
                    }
                }
            },
            markdown: {
                type: 'string',
                description: nls.localize('vscode.extension.markdown', "Controls the Markdown rendering engine used in the Marketplace. Either github (default) or standard."),
                enum: ['github', 'standard'],
                default: 'github'
            },
            qna: {
                default: 'marketplace',
                description: nls.localize('vscode.extension.qna', "Controls the Q&A link in the Marketplace. Set to marketplace to enable the default Marketplace Q & A site. Set to a string to provide the URL of a custom Q & A site. Set to false to disable Q & A altogether."),
                anyOf: [
                    {
                        type: ['string', 'boolean'],
                        enum: ['marketplace', false]
                    },
                    {
                        type: 'string'
                    }
                ]
            },
            extensionDependencies: {
                description: nls.localize('vscode.extension.extensionDependencies', 'Dependencies to other extensions. The identifier of an extension is always ${publisher}.${name}. For example: vscode.csharp.'),
                type: 'array',
                uniqueItems: true,
                items: {
                    type: 'string',
                    pattern: extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN
                }
            },
            extensionPack: {
                description: nls.localize('vscode.extension.contributes.extensionPack', "A set of extensions that can be installed together. The identifier of an extension is always ${publisher}.${name}. For example: vscode.csharp."),
                type: 'array',
                uniqueItems: true,
                items: {
                    type: 'string',
                    pattern: extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN
                }
            },
            extensionKind: {
                description: nls.localize('extensionKind', "Define the kind of an extension. `ui` extensions are installed and run on the local machine while `workspace` extensions run on the remote."),
                type: 'array',
                items: extensionKindSchema,
                default: ['workspace'],
                defaultSnippets: [
                    {
                        body: ['ui'],
                        description: nls.localize('extensionKind.ui', "Define an extension which can run only on the local machine when connected to remote window.")
                    },
                    {
                        body: ['workspace'],
                        description: nls.localize('extensionKind.workspace', "Define an extension which can run only on the remote machine when connected remote window.")
                    },
                    {
                        body: ['ui', 'workspace'],
                        description: nls.localize('extensionKind.ui-workspace', "Define an extension which can run on either side, with a preference towards running on the local machine.")
                    },
                    {
                        body: ['workspace', 'ui'],
                        description: nls.localize('extensionKind.workspace-ui', "Define an extension which can run on either side, with a preference towards running on the remote machine.")
                    },
                    {
                        body: [],
                        description: nls.localize('extensionKind.empty', "Define an extension which cannot run in a remote context, neither on the local, nor on the remote machine.")
                    }
                ]
            },
            capabilities: {
                description: nls.localize('vscode.extension.capabilities', "Declare the set of supported capabilities by the extension."),
                type: 'object',
                properties: {
                    virtualWorkspaces: {
                        description: nls.localize('vscode.extension.capabilities.virtualWorkspaces', "Declares whether the extension should be enabled in virtual workspaces. A virtual workspace is a workspace which is not backed by any on-disk resources. When false, this extension will be automatically disabled in virtual workspaces. Default is true."),
                        type: ['boolean', 'object'],
                        defaultSnippets: [
                            { label: 'limited', body: { supported: '${1:limited}', description: '${2}' } },
                            { label: 'false', body: { supported: false, description: '${2}' } },
                        ],
                        default: true.valueOf,
                        properties: {
                            supported: {
                                markdownDescription: nls.localize('vscode.extension.capabilities.virtualWorkspaces.supported', "Declares the level of support for virtual workspaces by the extension."),
                                type: ['string', 'boolean'],
                                enum: ['limited', true, false],
                                enumDescriptions: [
                                    nls.localize('vscode.extension.capabilities.virtualWorkspaces.supported.limited', "The extension will be enabled in virtual workspaces with some functionality disabled."),
                                    nls.localize('vscode.extension.capabilities.virtualWorkspaces.supported.true', "The extension will be enabled in virtual workspaces with all functionality enabled."),
                                    nls.localize('vscode.extension.capabilities.virtualWorkspaces.supported.false', "The extension will not be enabled in virtual workspaces."),
                                ]
                            },
                            description: {
                                type: 'string',
                                markdownDescription: nls.localize('vscode.extension.capabilities.virtualWorkspaces.description', "A description of how virtual workspaces affects the extensions behavior and why it is needed. This only applies when `supported` is not `true`."),
                            }
                        }
                    },
                    untrustedWorkspaces: {
                        description: nls.localize('vscode.extension.capabilities.untrustedWorkspaces', 'Declares how the extension should be handled in untrusted workspaces.'),
                        type: 'object',
                        required: ['supported'],
                        defaultSnippets: [
                            { body: { supported: '${1:limited}', description: '${2}' } },
                        ],
                        properties: {
                            supported: {
                                markdownDescription: nls.localize('vscode.extension.capabilities.untrustedWorkspaces.supported', "Declares the level of support for untrusted workspaces by the extension."),
                                type: ['string', 'boolean'],
                                enum: ['limited', true, false],
                                enumDescriptions: [
                                    nls.localize('vscode.extension.capabilities.untrustedWorkspaces.supported.limited', "The extension will be enabled in untrusted workspaces with some functionality disabled."),
                                    nls.localize('vscode.extension.capabilities.untrustedWorkspaces.supported.true', "The extension will be enabled in untrusted workspaces with all functionality enabled."),
                                    nls.localize('vscode.extension.capabilities.untrustedWorkspaces.supported.false', "The extension will not be enabled in untrusted workspaces."),
                                ]
                            },
                            restrictedConfigurations: {
                                description: nls.localize('vscode.extension.capabilities.untrustedWorkspaces.restrictedConfigurations', "A list of configuration keys contributed by the extension that should not use workspace values in untrusted workspaces."),
                                type: 'array',
                                items: {
                                    type: 'string'
                                }
                            },
                            description: {
                                type: 'string',
                                markdownDescription: nls.localize('vscode.extension.capabilities.untrustedWorkspaces.description', "A description of how workspace trust affects the extensions behavior and why it is needed. This only applies when `supported` is not `true`."),
                            }
                        }
                    }
                }
            },
            sponsor: {
                description: nls.localize('vscode.extension.contributes.sponsor', "Specify the location from where users can sponsor your extension."),
                type: 'object',
                defaultSnippets: [
                    { body: { url: '${1:https:}' } },
                ],
                properties: {
                    'url': {
                        description: nls.localize('vscode.extension.contributes.sponsor.url', "URL from where users can sponsor your extension. It must be a valid URL with a HTTP or HTTPS protocol. Example value: https://github.com/sponsors/nvaccess"),
                        type: 'string',
                    }
                }
            },
            scripts: {
                type: 'object',
                properties: {
                    'vscode:prepublish': {
                        description: nls.localize('vscode.extension.scripts.prepublish', 'Script executed before the package is published as a VS Code extension.'),
                        type: 'string'
                    },
                    'vscode:uninstall': {
                        description: nls.localize('vscode.extension.scripts.uninstall', 'Uninstall hook for VS Code extension. Script that gets executed when the extension is completely uninstalled from VS Code which is when VS Code is restarted (shutdown and start) after the extension is uninstalled. Only Node scripts are supported.'),
                        type: 'string'
                    }
                }
            },
            icon: {
                type: 'string',
                description: nls.localize('vscode.extension.icon', 'The path to a 128x128 pixel icon.')
            },
            l10n: {
                type: 'string',
                description: nls.localize({
                    key: 'vscode.extension.l10n',
                    comment: [
                        '{Locked="bundle.l10n._locale_.json"}',
                        '{Locked="vscode.l10n API"}'
                    ]
                }, 'The relative path to a folder containing localization (bundle.l10n.*.json) files. Must be specified if you are using the vscode.l10n API.')
            },
            pricing: {
                type: 'string',
                markdownDescription: nls.localize('vscode.extension.pricing', 'The pricing information for the extension. Can be Free (default) or Trial. For more details visit: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#extension-pricing-label'),
                enum: ['Free', 'Trial'],
                default: 'Free'
            }
        }
    };
    class ExtensionsRegistryImpl {
        constructor() {
            this._extensionPoints = new Map();
        }
        registerExtensionPoint(desc) {
            if (this._extensionPoints.has(desc.extensionPoint)) {
                throw new Error('Duplicate extension point: ' + desc.extensionPoint);
            }
            const result = new ExtensionPoint(desc.extensionPoint, desc.defaultExtensionKind);
            this._extensionPoints.set(desc.extensionPoint, result);
            if (desc.activationEventsGenerator) {
                implicitActivationEvents_1.ImplicitActivationEvents.register(desc.extensionPoint, desc.activationEventsGenerator);
            }
            exports.schema.properties['contributes'].properties[desc.extensionPoint] = desc.jsonSchema;
            schemaRegistry.registerSchema(schemaId, exports.schema);
            return result;
        }
        getExtensionPoints() {
            return Array.from(this._extensionPoints.values());
        }
    }
    exports.ExtensionsRegistryImpl = ExtensionsRegistryImpl;
    const PRExtensions = {
        ExtensionsRegistry: 'ExtensionsRegistry'
    };
    platform_1.Registry.add(PRExtensions.ExtensionsRegistry, new ExtensionsRegistryImpl());
    exports.ExtensionsRegistry = platform_1.Registry.as(PRExtensions.ExtensionsRegistry);
    schemaRegistry.registerSchema(schemaId, exports.schema);
    schemaRegistry.registerSchema(productService_1.productSchemaId, {
        properties: {
            extensionEnabledApiProposals: {
                description: nls.localize('product.extensionEnabledApiProposals', "API proposals that the respective extensions can freely use."),
                type: 'object',
                properties: {},
                additionalProperties: {
                    anyOf: [{
                            type: 'array',
                            uniqueItems: true,
                            items: {
                                type: 'string',
                                enum: Object.keys(extensionsApiProposals_1.allApiProposals),
                                markdownEnumDescriptions: Object.values(extensionsApiProposals_1.allApiProposals)
                            }
                        }]
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1JlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9jb21tb24vZXh0ZW5zaW9uc1JlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdCaEcsTUFBTSxjQUFjLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQTRCLHFDQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUUzRixNQUFhLHlCQUF5QjtRQU1yQyxZQUNDLGNBQXVDLEVBQ3ZDLFNBQWdDLEVBQ2hDLGdCQUF3QjtZQUV4QixJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztZQUN0QyxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsZ0JBQWdCLENBQUM7UUFDM0MsQ0FBQztRQUVPLElBQUksQ0FBQyxJQUFjLEVBQUUsT0FBZTtZQUMzQyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUNwQixJQUFJLEVBQUUsSUFBSTtnQkFDVixPQUFPLEVBQUUsT0FBTztnQkFDaEIsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVTtnQkFDdkMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjthQUN4QyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sS0FBSyxDQUFDLE9BQWU7WUFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBUSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRU0sSUFBSSxDQUFDLE9BQWU7WUFDMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRU0sSUFBSSxDQUFDLE9BQWU7WUFD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