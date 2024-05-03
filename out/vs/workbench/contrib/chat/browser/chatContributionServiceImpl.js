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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/common/contributions", "vs/workbench/common/views", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/actions/chatClearActions", "vs/workbench/contrib/chat/browser/actions/chatMoveActions", "vs/workbench/contrib/chat/browser/actions/chatQuickInputActions", "vs/workbench/contrib/chat/browser/chatViewPane", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContributionService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry"], function (require, exports, arrays_1, codicons_1, lifecycle_1, nls_1, actions_1, contextkey_1, descriptors_1, log_1, productService_1, platform_1, viewPaneContainer_1, contributions_1, views_1, chatActions_1, chatClearActions_1, chatMoveActions_1, chatQuickInputActions_1, chatViewPane_1, chatAgents_1, chatContributionService_1, extensions_1, extensionsRegistry) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatContributionService = exports.ChatExtensionPointHandler = void 0;
    const chatExtensionPoint = extensionsRegistry.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'interactiveSession',
        jsonSchema: {
            description: (0, nls_1.localize)('vscode.extension.contributes.interactiveSession', 'Contributes an Interactive Session provider'),
            type: 'array',
            items: {
                additionalProperties: false,
                type: 'object',
                defaultSnippets: [{ body: { id: '', program: '', runtime: '' } }],
                required: ['id', 'label'],
                properties: {
                    id: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.interactiveSession.id', "Unique identifier for this Interactive Session provider."),
                        type: 'string'
                    },
                    label: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.interactiveSession.label', "Display name for this Interactive Session provider."),
                        type: 'string'
                    },
                    icon: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.interactiveSession.icon', "An icon for this Interactive Session provider."),
                        type: 'string'
                    },
                    when: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.interactiveSession.when', "A condition which must be true to enable this Interactive Session provider."),
                        type: 'string'
                    },
                }
            }
        },
        activationEventsGenerator: (contributions, result) => {
            for (const contrib of contributions) {
                result.push(`onInteractiveSession:${contrib.id}`);
            }
        },
    });
    const chatParticipantExtensionPoint = extensionsRegistry.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'chatParticipants',
        jsonSchema: {
            description: (0, nls_1.localize)('vscode.extension.contributes.chatParticipant', 'Contributes a chat participant'),
            type: 'array',
            items: {
                additionalProperties: false,
                type: 'object',
                defaultSnippets: [{ body: { name: '', description: '' } }],
                required: ['name', 'id'],
                properties: {
                    id: {
                        description: (0, nls_1.localize)('chatParticipantId', "A unique id for this chat participant."),
                        type: 'string'
                    },
                    name: {
                        description: (0, nls_1.localize)('chatParticipantName', "User-facing display name for this chat participant. The user will use '@' with this name to invoke the participant."),
                        type: 'string'
                    },
                    description: {
                        description: (0, nls_1.localize)('chatParticipantDescription', "A description of this chat participant, shown in the UI."),
                        type: 'string'
                    },
                    isDefault: {
                        markdownDescription: (0, nls_1.localize)('chatParticipantIsDefaultDescription', "**Only** allowed for extensions that have the `defaultChatParticipant` proposal."),
                        type: 'boolean',
                    },
                    isSticky: {
                        description: (0, nls_1.localize)('chatCommandSticky', "Whether invoking the command puts the chat into a persistent mode, where the command is automatically added to the chat input for the next message."),
                        type: 'boolean'
                    },
                    defaultImplicitVariables: {
                        markdownDescription: '**Only** allowed for extensions that have the `chatParticipantAdditions` proposal. The names of the variables that are invoked by default',
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    commands: {
                        markdownDescription: (0, nls_1.localize)('chatCommandsDescription', "Commands available for this chat participant, which the user can invoke with a `/`."),
                        type: 'array',
                        items: {
                            additionalProperties: false,
                            type: 'object',
                            defaultSnippets: [{ body: { name: '', description: '' } }],
                            required: ['name'],
                            properties: {
                                name: {
                                    description: (0, nls_1.localize)('chatCommand', "A short name by which this command is referred to in the UI, e.g. `fix` or * `explain` for commands that fix an issue or explain code. The name should be unique among the commands provided by this participant."),
                                    type: 'string'
                                },
                                description: {
                                    description: (0, nls_1.localize)('chatCommandDescription', "A description of this command."),
                                    type: 'string'
                                },
                                when: {
                                    description: (0, nls_1.localize)('chatCommandWhen', "A condition which must be true to enable this command."),
                                    type: 'string'
                                },
                                sampleRequest: {
                                    description: (0, nls_1.localize)('chatCommandSampleRequest', "When the user clicks this command in `/help`, this text will be submitted to this participant."),
                                    type: 'string'
                                },
                                isSticky: {
                                    description: (0, nls_1.localize)('chatCommandSticky', "Whether invoking the command puts the chat into a persistent mode, where the command is automatically added to the chat input for the next message."),
                                    type: 'boolean'
                                },
                                defaultImplicitVariables: {
                                    markdownDescription: (0, nls_1.localize)('defaultImplicitVariables', "**Only** allowed for extensions that have the `chatParticipantAdditions` proposal. The names of the variables that are invoked by default"),
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    }
                                },
                            }
                        }
                    },
                    locations: {
                        markdownDescription: (0, nls_1.localize)('chatLocationsDescription', "Locations in which this chat participant is available."),
                        type: 'array',
                        default: ['panel'],
                        items: {
                            type: 'string',
                            enum: ['panel', 'terminal', 'notebook']
                        }
                    }
                }
            }
        },
        activationEventsGenerator: (contributions, result) => {
            for (const contrib of contributions) {
                result.push(`onChatParticipant:${contrib.id}`);
            }
        },
    });
    let ChatExtensionPointHandler = class ChatExtensionPointHandler {
        static { this.ID = 'workbench.contrib.chatExtensionPointHandler'; }
        constructor(_chatContributionService, _chatAgentService, productService, contextService, logService) {
            this._chatContributionService = _chatContributionService;
            this._chatAgentService = _chatAgentService;
            this.productService = productService;
            this.contextService = contextService;
            this.logService = logService;
            this.disposables = new lifecycle_1.DisposableStore();
            this._registrationDisposables = new Map();
            this._participantRegistrationDisposables = new lifecycle_1.DisposableMap();
            this._viewContainer = this.registerViewContainer();
            this.registerListeners();
            this.handleAndRegisterChatExtensions();
        }
        registerListeners() {
            this.contextService.onDidChangeContext(e => {
                if (!this.productService.chatWelcomeView) {
                    return;
                }
                const showWelcomeViewConfigKey = 'workbench.chat.experimental.showWelcomeView';
                const keys = new Set([showWelcomeViewConfigKey]);
                if (e.affectsSome(keys)) {
                    const contextKeyExpr = contextkey_1.ContextKeyExpr.equals(showWelcomeViewConfigKey, true);
                    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
                    if (this.contextService.contextMatchesRules(contextKeyExpr)) {
                        const viewId = this._chatContributionService.getViewIdForProvider(this.productService.chatWelcomeView.welcomeViewId);
                        this._welcomeViewDescriptor = {
                            id: viewId,
                            name: { original: this.productService.chatWelcomeView.welcomeViewTitle, value: this.productService.chatWelcomeView.welcomeViewTitle },
                            containerIcon: this._viewContainer.icon,
                            ctorDescriptor: new descriptors_1.SyncDescriptor(chatViewPane_1.ChatViewPane, [{ providerId: this.productService.chatWelcomeView.welcomeViewId }]),
                            canToggleVisibility: false,
                            canMoveView: true,
                            order: 100
                        };
                        viewsRegistry.registerViews([this._welcomeViewDescriptor], this._viewContainer);
                        viewsRegistry.registerViewWelcomeContent(viewId, {
                            content: this.productService.chatWelcomeView.welcomeViewContent,
                        });
                    }
                    else if (this._welcomeViewDescriptor) {
                        viewsRegistry.deregisterViews([this._welcomeViewDescriptor], this._viewContainer);
                    }
                }
            }, null, this.disposables);
        }
        handleAndRegisterChatExtensions() {
            chatExtensionPoint.setHandler((extensions, delta) => {
                for (const extension of delta.added) {
                    const extensionDisposable = new lifecycle_1.DisposableStore();
                    for (const providerDescriptor of extension.value) {
                        this.registerChatProvider(providerDescriptor);
                        this._chatContributionService.registerChatProvider(providerDescriptor);
                    }
                    this._registrationDisposables.set(extension.description.identifier.value, extensionDisposable);
                }
                for (const extension of delta.removed) {
                    const registration = this._registrationDisposables.get(extension.description.identifier.value);
                    if (registration) {
                        registration.dispose();
                        this._registrationDisposables.delete(extension.description.identifier.value);
                    }
                    for (const providerDescriptor of extension.value) {
                        this._chatContributionService.deregisterChatProvider(providerDescriptor.id);
                    }
                }
            });
            chatParticipantExtensionPoint.setHandler((extensions, delta) => {
                for (const extension of delta.added) {
                    for (const providerDescriptor of extension.value) {
                        if (providerDescriptor.isDefault && !(0, extensions_1.isProposedApiEnabled)(extension.description, 'defaultChatParticipant')) {
                            this.logService.error(`Extension '${extension.description.identifier.value}' CANNOT use API proposal: defaultChatParticipant.`);
                            continue;
                        }
                        if (providerDescriptor.defaultImplicitVariables && !(0, extensions_1.isProposedApiEnabled)(extension.description, 'chatParticipantAdditions')) {
                            this.logService.error(`Extension '${extension.description.identifier.value}' CANNOT use API proposal: chatParticipantAdditions.`);
                            continue;
                        }
                        if (!providerDescriptor.id || !providerDescriptor.name) {
                            this.logService.error(`Extension '${extension.description.identifier.value}' CANNOT register participant without both id and name.`);
                            continue;
                        }
                        this._participantRegistrationDisposables.set(getParticipantKey(extension.description.identifier, providerDescriptor.name), this._chatAgentService.registerAgent(providerDescriptor.id, {
                            extensionId: extension.description.identifier,
                            id: providerDescriptor.id,
                            description: providerDescriptor.description,
                            metadata: {
                                isSticky: providerDescriptor.isSticky,
                            },
                            name: providerDescriptor.name,
                            isDefault: providerDescriptor.isDefault,
                            defaultImplicitVariables: providerDescriptor.defaultImplicitVariables,
                            locations: (0, arrays_1.isNonEmptyArray)(providerDescriptor.locations) ?
                                providerDescriptor.locations.map(chatAgents_1.ChatAgentLocation.fromRaw) :
                                [chatAgents_1.ChatAgentLocation.Panel],
                            slashCommands: providerDescriptor.commands ?? []
                        }));
                    }
                }
                for (const extension of delta.removed) {
                    for (const providerDescriptor of extension.value) {
                        this._participantRegistrationDisposables.deleteAndDispose(getParticipantKey(extension.description.identifier, providerDescriptor.name));
                    }
                }
            });
        }
        registerViewContainer() {
            // Register View Container
            const title = (0, nls_1.localize2)('chat.viewContainer.label', "Chat");
            const icon = codicons_1.Codicon.commentDiscussion;
            const viewContainerId = chatViewPane_1.CHAT_SIDEBAR_PANEL_ID;
            const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                id: viewContainerId,
                title,
                icon,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [viewContainerId, { mergeViewWithContainerWhenSingleView: true }]),
                storageId: viewContainerId,
                hideIfEmpty: true,
                order: 100,
            }, 0 /* ViewContainerLocation.Sidebar */);
            return viewContainer;
        }
        registerChatProvider(providerDescriptor) {
            // Register View
            const viewId = this._chatContributionService.getViewIdForProvider(providerDescriptor.id);
            const viewDescriptor = [{
                    id: viewId,
                    containerIcon: this._viewContainer.icon,
                    containerTitle: this._viewContainer.title.value,
                    singleViewPaneContainerTitle: this._viewContainer.title.value,
                    name: { value: providerDescriptor.label, original: providerDescriptor.label },
                    canToggleVisibility: false,
                    canMoveView: true,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(chatViewPane_1.ChatViewPane, [{ providerId: providerDescriptor.id }]),
                    when: contextkey_1.ContextKeyExpr.deserialize(providerDescriptor.when)
                }];
            platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews(viewDescriptor, this._viewContainer);
            // Per-provider actions
            // Actions in view title
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, actions_1.registerAction2)((0, chatActions_1.getHistoryAction)(viewId, providerDescriptor.id)));
            disposables.add((0, actions_1.registerAction2)((0, chatClearActions_1.getNewChatAction)(viewId, providerDescriptor.id)));
            disposables.add((0, actions_1.registerAction2)((0, chatMoveActions_1.getMoveToEditorAction)(viewId, providerDescriptor.id)));
            disposables.add((0, actions_1.registerAction2)((0, chatMoveActions_1.getMoveToNewWindowAction)(viewId, providerDescriptor.id)));
            // "Open Chat" Actions
            disposables.add((0, actions_1.registerAction2)((0, chatActions_1.getOpenChatEditorAction)(providerDescriptor.id, providerDescriptor.label, providerDescriptor.when)));
            disposables.add((0, actions_1.registerAction2)((0, chatQuickInputActions_1.getQuickChatActionForProvider)(providerDescriptor.id, providerDescriptor.label)));
            return {
                dispose: () => {
                    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).deregisterViews(viewDescriptor, this._viewContainer);
                    platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).deregisterViewContainer(this._viewContainer);
                    disposables.dispose();
                }
            };
        }
    };
    exports.ChatExtensionPointHandler = ChatExtensionPointHandler;
    exports.ChatExtensionPointHandler = ChatExtensionPointHandler = __decorate([
        __param(0, chatContributionService_1.IChatContributionService),
        __param(1, chatAgents_1.IChatAgentService),
        __param(2, productService_1.IProductService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, log_1.ILogService)
    ], ChatExtensionPointHandler);
    (0, contributions_1.registerWorkbenchContribution2)(ChatExtensionPointHandler.ID, ChatExtensionPointHandler, 1 /* WorkbenchPhase.BlockStartup */);
    function getParticipantKey(extensionId, participantName) {
        return `${extensionId.value}_${participantName}`;
    }
    class ChatContributionService {
        constructor() {
            this._registeredProviders = new Map();
        }
        getViewIdForProvider(providerId) {
            return chatViewPane_1.ChatViewPane.ID + '.' + providerId;
        }
        registerChatProvider(provider) {
            this._registeredProviders.set(provider.id, provider);
        }
        deregisterChatProvider(providerId) {
            this._registeredProviders.delete(providerId);
        }
        get registeredProviders() {
            return Array.from(this._registeredProviders.values());
        }
    }
    exports.ChatContributionService = ChatContributionService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdENvbnRyaWJ1dGlvblNlcnZpY2VJbXBsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvY2hhdENvbnRyaWJ1dGlvblNlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTBCaEcsTUFBTSxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxzQkFBc0IsQ0FBaUM7UUFDdkgsY0FBYyxFQUFFLG9CQUFvQjtRQUNwQyxVQUFVLEVBQUU7WUFDWCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsaURBQWlELEVBQUUsNkNBQTZDLENBQUM7WUFDdkgsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUU7Z0JBQ04sb0JBQW9CLEVBQUUsS0FBSztnQkFDM0IsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsZUFBZSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ2pFLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUM7Z0JBQ3pCLFVBQVUsRUFBRTtvQkFDWCxFQUFFLEVBQUU7d0JBQ0gsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLG9EQUFvRCxFQUFFLDBEQUEwRCxDQUFDO3dCQUN2SSxJQUFJLEVBQUUsUUFBUTtxQkFDZDtvQkFDRCxLQUFLLEVBQUU7d0JBQ04sV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHVEQUF1RCxFQUFFLHFEQUFxRCxDQUFDO3dCQUNySSxJQUFJLEVBQUUsUUFBUTtxQkFDZDtvQkFDRCxJQUFJLEVBQUU7d0JBQ0wsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHNEQUFzRCxFQUFFLGdEQUFnRCxDQUFDO3dCQUMvSCxJQUFJLEVBQUUsUUFBUTtxQkFDZDtvQkFDRCxJQUFJLEVBQUU7d0JBQ0wsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHNEQUFzRCxFQUFFLDZFQUE2RSxDQUFDO3dCQUM1SixJQUFJLEVBQUUsUUFBUTtxQkFDZDtpQkFDRDthQUNEO1NBQ0Q7UUFDRCx5QkFBeUIsRUFBRSxDQUFDLGFBQTZDLEVBQUUsTUFBb0MsRUFBRSxFQUFFO1lBQ2xILEtBQUssTUFBTSxPQUFPLElBQUksYUFBYSxFQUFFLENBQUM7Z0JBQ3JDLE1BQU0sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLE9BQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25ELENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsTUFBTSw2QkFBNkIsR0FBRyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxzQkFBc0IsQ0FBb0M7UUFDckksY0FBYyxFQUFFLGtCQUFrQjtRQUNsQyxVQUFVLEVBQUU7WUFDWCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsOENBQThDLEVBQUUsZ0NBQWdDLENBQUM7WUFDdkcsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUU7Z0JBQ04sb0JBQW9CLEVBQUUsS0FBSztnQkFDM0IsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsZUFBZSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUMxRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDO2dCQUN4QixVQUFVLEVBQUU7b0JBQ1gsRUFBRSxFQUFFO3dCQUNILFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSx3Q0FBd0MsQ0FBQzt3QkFDcEYsSUFBSSxFQUFFLFFBQVE7cUJBQ2Q7b0JBQ0QsSUFBSSxFQUFFO3dCQUNMLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxxSEFBcUgsQ0FBQzt3QkFDbkssSUFBSSxFQUFFLFFBQVE7cUJBQ2Q7b0JBQ0QsV0FBVyxFQUFFO3dCQUNaLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSwwREFBMEQsQ0FBQzt3QkFDL0csSUFBSSxFQUFFLFFBQVE7cUJBQ2Q7b0JBQ0QsU0FBUyxFQUFFO3dCQUNWLG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLHFDQUFxQyxFQUFFLGtGQUFrRixDQUFDO3dCQUN4SixJQUFJLEVBQUUsU0FBUztxQkFDZjtvQkFDRCxRQUFRLEVBQUU7d0JBQ1QsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLHFKQUFxSixDQUFDO3dCQUNqTSxJQUFJLEVBQUUsU0FBUztxQkFDZjtvQkFDRCx3QkFBd0IsRUFBRTt3QkFDekIsbUJBQW1CLEVBQUUsMklBQTJJO3dCQUNoSyxJQUFJLEVBQUUsT0FBTzt3QkFDYixLQUFLLEVBQUU7NEJBQ04sSUFBSSxFQUFFLFFBQVE7eUJBQ2Q7cUJBQ0Q7b0JBQ0QsUUFBUSxFQUFFO3dCQUNULG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLHFGQUFxRixDQUFDO3dCQUMvSSxJQUFJLEVBQUUsT0FBTzt3QkFDYixLQUFLLEVBQUU7NEJBQ04sb0JBQW9CLEVBQUUsS0FBSzs0QkFDM0IsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsZUFBZSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDOzRCQUMxRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUM7NEJBQ2xCLFVBQVUsRUFBRTtnQ0FDWCxJQUFJLEVBQUU7b0NBQ0wsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSxtTkFBbU4sQ0FBQztvQ0FDelAsSUFBSSxFQUFFLFFBQVE7aUNBQ2Q7Z0NBQ0QsV0FBVyxFQUFFO29DQUNaLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSxnQ0FBZ0MsQ0FBQztvQ0FDakYsSUFBSSxFQUFFLFFBQVE7aUNBQ2Q7Z0NBQ0QsSUFBSSxFQUFFO29DQUNMLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSx3REFBd0QsQ0FBQztvQ0FDbEcsSUFBSSxFQUFFLFFBQVE7aUNBQ2Q7Z0NBQ0QsYUFBYSxFQUFFO29DQUNkLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSxnR0FBZ0csQ0FBQztvQ0FDbkosSUFBSSxFQUFFLFFBQVE7aUNBQ2Q7Z0NBQ0QsUUFBUSxFQUFFO29DQUNULFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxxSkFBcUosQ0FBQztvQ0FDak0sSUFBSSxFQUFFLFNBQVM7aUNBQ2Y7Z0NBQ0Qsd0JBQXdCLEVBQUU7b0NBQ3pCLG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLDJJQUEySSxDQUFDO29DQUN0TSxJQUFJLEVBQUUsT0FBTztvQ0FDYixLQUFLLEVBQUU7d0NBQ04sSUFBSSxFQUFFLFFBQVE7cUNBQ2Q7aUNBQ0Q7NkJBQ0Q7eUJBQ0Q7cUJBQ0Q7b0JBQ0QsU0FBUyxFQUFFO3dCQUNWLG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLHdEQUF3RCxDQUFDO3dCQUNuSCxJQUFJLEVBQUUsT0FBTzt3QkFDYixPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUM7d0JBQ2xCLEtBQUssRUFBRTs0QkFDTixJQUFJLEVBQUUsUUFBUTs0QkFDZCxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQzt5QkFDdkM7cUJBRUQ7aUJBQ0Q7YUFDRDtTQUNEO1FBQ0QseUJBQXlCLEVBQUUsQ0FBQyxhQUFnRCxFQUFFLE1BQW9DLEVBQUUsRUFBRTtZQUNySCxLQUFLLE1BQU0sT0FBTyxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNyQyxNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNoRCxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVJLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQXlCO2lCQUVyQixPQUFFLEdBQUcsNkNBQTZDLEFBQWhELENBQWlEO1FBUW5FLFlBQzJCLHdCQUFtRSxFQUMxRSxpQkFBcUQsRUFDdkQsY0FBZ0QsRUFDN0MsY0FBbUQsRUFDMUQsVUFBd0M7WUFKViw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ3pELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDdEMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzVCLG1CQUFjLEdBQWQsY0FBYyxDQUFvQjtZQUN6QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBWHJDLGdCQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFHN0MsNkJBQXdCLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFDMUQsd0NBQW1DLEdBQUcsSUFBSSx5QkFBYSxFQUFVLENBQUM7WUFTekUsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUNuRCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN6QixJQUFJLENBQUMsK0JBQStCLEVBQUUsQ0FBQztRQUN4QyxDQUFDO1FBRU8saUJBQWlCO1lBQ3hCLElBQUksQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBRTFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUMxQyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSx3QkFBd0IsR0FBRyw2Q0FBNkMsQ0FBQztnQkFDL0UsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN6QixNQUFNLGNBQWMsR0FBRywyQkFBYyxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDN0UsTUFBTSxhQUFhLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQWlCLGtCQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBQ2hGLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO3dCQUM3RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLENBQUM7d0JBRXJILElBQUksQ0FBQyxzQkFBc0IsR0FBRzs0QkFDN0IsRUFBRSxFQUFFLE1BQU07NEJBQ1YsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLGdCQUFnQixFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRTs0QkFDckksYUFBYSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSTs0QkFDdkMsY0FBYyxFQUFFLElBQUksNEJBQWMsQ0FBQywyQkFBWSxFQUFFLENBQW1CLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7NEJBQ3ZJLG1CQUFtQixFQUFFLEtBQUs7NEJBQzFCLFdBQVcsRUFBRSxJQUFJOzRCQUNqQixLQUFLLEVBQUUsR0FBRzt5QkFDVixDQUFDO3dCQUNGLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7d0JBRWhGLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLEVBQUU7NEJBQ2hELE9BQU8sRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxrQkFBa0I7eUJBQy9ELENBQUMsQ0FBQztvQkFDSixDQUFDO3lCQUFNLElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7d0JBQ3hDLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQ25GLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFTywrQkFBK0I7WUFDdEMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNuRCxLQUFLLE1BQU0sU0FBUyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDckMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztvQkFDbEQsS0FBSyxNQUFNLGtCQUFrQixJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDbEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDLENBQUM7d0JBQzlDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxvQkFBb0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO29CQUN4RSxDQUFDO29CQUNELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2hHLENBQUM7Z0JBRUQsS0FBSyxNQUFNLFNBQVMsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3ZDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQy9GLElBQUksWUFBWSxFQUFFLENBQUM7d0JBQ2xCLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDdkIsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDOUUsQ0FBQztvQkFFRCxLQUFLLE1BQU0sa0JBQWtCLElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNsRCxJQUFJLENBQUMsd0JBQXdCLENBQUMsc0JBQXNCLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzdFLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsNkJBQTZCLENBQUMsVUFBVSxDQUFDLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUM5RCxLQUFLLE1BQU0sU0FBUyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDckMsS0FBSyxNQUFNLGtCQUFrQixJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDbEQsSUFBSSxrQkFBa0IsQ0FBQyxTQUFTLElBQUksQ0FBQyxJQUFBLGlDQUFvQixFQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsd0JBQXdCLENBQUMsRUFBRSxDQUFDOzRCQUM1RyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxjQUFjLFNBQVMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEtBQUssb0RBQW9ELENBQUMsQ0FBQzs0QkFDaEksU0FBUzt3QkFDVixDQUFDO3dCQUVELElBQUksa0JBQWtCLENBQUMsd0JBQXdCLElBQUksQ0FBQyxJQUFBLGlDQUFvQixFQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsMEJBQTBCLENBQUMsRUFBRSxDQUFDOzRCQUM3SCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxjQUFjLFNBQVMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEtBQUssc0RBQXNELENBQUMsQ0FBQzs0QkFDbEksU0FBUzt3QkFDVixDQUFDO3dCQUVELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs0QkFDeEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsY0FBYyxTQUFTLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxLQUFLLHlEQUF5RCxDQUFDLENBQUM7NEJBQ3JJLFNBQVM7d0JBQ1YsQ0FBQzt3QkFFRCxJQUFJLENBQUMsbUNBQW1DLENBQUMsR0FBRyxDQUMzQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFDNUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FDbkMsa0JBQWtCLENBQUMsRUFBRSxFQUNyQjs0QkFDQyxXQUFXLEVBQUUsU0FBUyxDQUFDLFdBQVcsQ0FBQyxVQUFVOzRCQUM3QyxFQUFFLEVBQUUsa0JBQWtCLENBQUMsRUFBRTs0QkFDekIsV0FBVyxFQUFFLGtCQUFrQixDQUFDLFdBQVc7NEJBQzNDLFFBQVEsRUFBRTtnQ0FDVCxRQUFRLEVBQUUsa0JBQWtCLENBQUMsUUFBUTs2QkFDckM7NEJBQ0QsSUFBSSxFQUFFLGtCQUFrQixDQUFDLElBQUk7NEJBQzdCLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxTQUFTOzRCQUN2Qyx3QkFBd0IsRUFBRSxrQkFBa0IsQ0FBQyx3QkFBd0I7NEJBQ3JFLFNBQVMsRUFBRSxJQUFBLHdCQUFlLEVBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQ0FDekQsa0JBQWtCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyw4QkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dDQUM3RCxDQUFDLDhCQUFpQixDQUFDLEtBQUssQ0FBQzs0QkFDMUIsYUFBYSxFQUFFLGtCQUFrQixDQUFDLFFBQVEsSUFBSSxFQUFFO3lCQUN2QixDQUFDLENBQUMsQ0FBQztvQkFDaEMsQ0FBQztnQkFDRixDQUFDO2dCQUVELEtBQUssTUFBTSxTQUFTLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN2QyxLQUFLLE1BQU0sa0JBQWtCLElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNsRCxJQUFJLENBQUMsbUNBQW1DLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDekksQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8scUJBQXFCO1lBQzVCLDBCQUEwQjtZQUMxQixNQUFNLEtBQUssR0FBRyxJQUFBLGVBQVMsRUFBQywwQkFBMEIsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1RCxNQUFNLElBQUksR0FBRyxrQkFBTyxDQUFDLGlCQUFpQixDQUFDO1lBQ3ZDLE1BQU0sZUFBZSxHQUFHLG9DQUFxQixDQUFDO1lBQzlDLE1BQU0sYUFBYSxHQUFrQixtQkFBUSxDQUFDLEVBQUUsQ0FBMEIsa0JBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLHFCQUFxQixDQUFDO2dCQUN0SSxFQUFFLEVBQUUsZUFBZTtnQkFDbkIsS0FBSztnQkFDTCxJQUFJO2dCQUNKLGNBQWMsRUFBRSxJQUFJLDRCQUFjLENBQUMscUNBQWlCLEVBQUUsQ0FBQyxlQUFlLEVBQUUsRUFBRSxvQ0FBb0MsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUN4SCxTQUFTLEVBQUUsZUFBZTtnQkFDMUIsV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLEtBQUssRUFBRSxHQUFHO2FBQ1Ysd0NBQWdDLENBQUM7WUFFbEMsT0FBTyxhQUFhLENBQUM7UUFDdEIsQ0FBQztRQUVPLG9CQUFvQixDQUFDLGtCQUFnRDtZQUM1RSxnQkFBZ0I7WUFDaEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sY0FBYyxHQUFzQixDQUFDO29CQUMxQyxFQUFFLEVBQUUsTUFBTTtvQkFDVixhQUFhLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJO29CQUN2QyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsS0FBSztvQkFDL0MsNEJBQTRCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsS0FBSztvQkFDN0QsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsa0JBQWtCLENBQUMsS0FBSyxFQUFFO29CQUM3RSxtQkFBbUIsRUFBRSxLQUFLO29CQUMxQixXQUFXLEVBQUUsSUFBSTtvQkFDakIsY0FBYyxFQUFFLElBQUksNEJBQWMsQ0FBQywyQkFBWSxFQUFFLENBQW1CLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQzNHLElBQUksRUFBRSwyQkFBYyxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7aUJBQ3pELENBQUMsQ0FBQztZQUNILG1CQUFRLENBQUMsRUFBRSxDQUFpQixrQkFBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRTdHLHVCQUF1QjtZQUV2Qix3QkFBd0I7WUFDeEIsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDMUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsSUFBQSw4QkFBZ0IsRUFBQyxNQUFNLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSx5QkFBZSxFQUFDLElBQUEsbUNBQWdCLEVBQUMsTUFBTSxFQUFFLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsRixXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEseUJBQWUsRUFBQyxJQUFBLHVDQUFxQixFQUFDLE1BQU0sRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkYsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsSUFBQSwwQ0FBd0IsRUFBQyxNQUFNLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTFGLHNCQUFzQjtZQUN0QixXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEseUJBQWUsRUFBQyxJQUFBLHFDQUF1QixFQUFDLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BJLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSx5QkFBZSxFQUFDLElBQUEscURBQTZCLEVBQUMsa0JBQWtCLENBQUMsRUFBRSxFQUFFLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVqSCxPQUFPO2dCQUNOLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsbUJBQVEsQ0FBQyxFQUFFLENBQWlCLGtCQUFjLENBQUMsYUFBYSxDQUFDLENBQUMsZUFBZSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQy9HLG1CQUFRLENBQUMsRUFBRSxDQUEwQixrQkFBYyxDQUFDLHNCQUFzQixDQUFDLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUN6SCxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3ZCLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQzs7SUF4TFcsOERBQXlCO3dDQUF6Qix5QkFBeUI7UUFXbkMsV0FBQSxrREFBd0IsQ0FBQTtRQUN4QixXQUFBLDhCQUFpQixDQUFBO1FBQ2pCLFdBQUEsZ0NBQWUsQ0FBQTtRQUNmLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSxpQkFBVyxDQUFBO09BZkQseUJBQXlCLENBeUxyQztJQUVELElBQUEsOENBQThCLEVBQUMseUJBQXlCLENBQUMsRUFBRSxFQUFFLHlCQUF5QixzQ0FBOEIsQ0FBQztJQUVySCxTQUFTLGlCQUFpQixDQUFDLFdBQWdDLEVBQUUsZUFBdUI7UUFDbkYsT0FBTyxHQUFHLFdBQVcsQ0FBQyxLQUFLLElBQUksZUFBZSxFQUFFLENBQUM7SUFDbEQsQ0FBQztJQUVELE1BQWEsdUJBQXVCO1FBS25DO1lBRlEseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQXFDLENBQUM7UUFHeEUsQ0FBQztRQUVFLG9CQUFvQixDQUFDLFVBQWtCO1lBQzdDLE9BQU8sMkJBQVksQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLFVBQVUsQ0FBQztRQUMzQyxDQUFDO1FBRU0sb0JBQW9CLENBQUMsUUFBbUM7WUFDOUQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFTSxzQkFBc0IsQ0FBQyxVQUFrQjtZQUMvQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxJQUFXLG1CQUFtQjtZQUM3QixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdkQsQ0FBQztLQUNEO0lBdkJELDBEQXVCQyJ9