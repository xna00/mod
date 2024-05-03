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
define(["require", "exports", "vs/base/browser/browser", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/iconLabels", "vs/base/common/platform", "vs/base/common/themables", "vs/editor/contrib/quickAccess/browser/commandsQuickAccess", "vs/nls", "vs/platform/action/common/action", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/product/common/productService", "vs/platform/quickinput/browser/commandsQuickAccess", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/platform/quickinput/common/quickAccess", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/actions/chatQuickInputActions", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/preferences/common/preferences"], function (require, exports, browser_1, async_1, codicons_1, iconLabels_1, platform_1, themables_1, commandsQuickAccess_1, nls_1, action_1, actions_1, commands_1, configuration_1, dialogs_1, instantiation_1, keybinding_1, productService_1, commandsQuickAccess_2, pickerQuickAccess_1, quickAccess_1, quickInput_1, storage_1, telemetry_1, chatActions_1, chatQuickInputActions_1, chatAgents_1, aiRelatedInformation_1, editorGroupsService_1, editorService_1, extensions_1, preferences_1) {
    "use strict";
    var CommandsQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClearCommandHistoryAction = exports.ShowAllCommandsAction = exports.CommandsQuickAccessProvider = void 0;
    let CommandsQuickAccessProvider = class CommandsQuickAccessProvider extends commandsQuickAccess_1.AbstractEditorCommandsQuickAccessProvider {
        static { CommandsQuickAccessProvider_1 = this; }
        static { this.AI_RELATED_INFORMATION_MAX_PICKS = 5; }
        static { this.AI_RELATED_INFORMATION_THRESHOLD = 0.8; }
        static { this.AI_RELATED_INFORMATION_DEBOUNCE = 200; }
        get activeTextEditorControl() { return this.editorService.activeTextEditorControl; }
        get defaultFilterValue() {
            if (this.configuration.preserveInput) {
                return quickAccess_1.DefaultQuickAccessFilterValue.LAST;
            }
            return undefined;
        }
        constructor(editorService, menuService, extensionService, instantiationService, keybindingService, commandService, telemetryService, dialogService, configurationService, editorGroupService, preferencesService, productService, aiRelatedInformationService, chatAgentService) {
            super({
                showAlias: !platform_1.Language.isDefaultVariant(),
                noResultsPick: () => ({
                    label: (0, nls_1.localize)('noCommandResults', "No matching commands"),
                    commandId: ''
                }),
            }, instantiationService, keybindingService, commandService, telemetryService, dialogService);
            this.editorService = editorService;
            this.menuService = menuService;
            this.extensionService = extensionService;
            this.configurationService = configurationService;
            this.editorGroupService = editorGroupService;
            this.preferencesService = preferencesService;
            this.productService = productService;
            this.aiRelatedInformationService = aiRelatedInformationService;
            this.chatAgentService = chatAgentService;
            // If extensions are not yet registered, we wait for a little moment to give them
            // a chance to register so that the complete set of commands shows up as result
            // We do not want to delay functionality beyond that time though to keep the commands
            // functional.
            this.extensionRegistrationRace = (0, async_1.raceTimeout)(this.extensionService.whenInstalledExtensionsRegistered(), 800);
            this.useAiRelatedInfo = false;
            this._register(configurationService.onDidChangeConfiguration((e) => this.updateOptions(e)));
            this.updateOptions();
        }
        get configuration() {
            const commandPaletteConfig = this.configurationService.getValue().workbench.commandPalette;
            return {
                preserveInput: commandPaletteConfig.preserveInput,
                experimental: commandPaletteConfig.experimental
            };
        }
        updateOptions(e) {
            if (e && !e.affectsConfiguration('workbench.commandPalette.experimental')) {
                return;
            }
            const config = this.configuration;
            const suggestedCommandIds = config.experimental.suggestCommands && this.productService.commandPaletteSuggestedCommandIds?.length
                ? new Set(this.productService.commandPaletteSuggestedCommandIds)
                : undefined;
            this.options.suggestedCommandIds = suggestedCommandIds;
            this.useAiRelatedInfo = config.experimental.enableNaturalLanguageSearch;
        }
        async getCommandPicks(token) {
            // wait for extensions registration or 800ms once
            await this.extensionRegistrationRace;
            if (token.isCancellationRequested) {
                return [];
            }
            return [
                ...this.getCodeEditorCommandPicks(),
                ...this.getGlobalCommandPicks()
            ].map(picks => ({
                ...picks,
                buttons: [{
                        iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.gear),
                        tooltip: (0, nls_1.localize)('configure keybinding', "Configure Keybinding"),
                    }],
                trigger: () => {
                    this.preferencesService.openGlobalKeybindingSettings(false, { query: `@command:${picks.commandId}` });
                    return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                },
            }));
        }
        hasAdditionalCommandPicks(filter, token) {
            if (!this.useAiRelatedInfo
                || token.isCancellationRequested
                || filter === ''
                || !this.aiRelatedInformationService.isEnabled()) {
                return false;
            }
            return true;
        }
        async getAdditionalCommandPicks(allPicks, picksSoFar, filter, token) {
            if (!this.hasAdditionalCommandPicks(filter, token)) {
                return [];
            }
            let additionalPicks;
            try {
                // Wait a bit to see if the user is still typing
                await (0, async_1.timeout)(CommandsQuickAccessProvider_1.AI_RELATED_INFORMATION_DEBOUNCE, token);
                additionalPicks = await this.getRelatedInformationPicks(allPicks, picksSoFar, filter, token);
            }
            catch (e) {
                return [];
            }
            if (picksSoFar.length || additionalPicks.length) {
                additionalPicks.push({
                    type: 'separator'
                });
            }
            const defaultAgent = this.chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel);
            if (defaultAgent) {
                additionalPicks.push({
                    label: (0, nls_1.localize)('askXInChat', "Ask {0}: {1}", defaultAgent.metadata.fullName, filter),
                    commandId: this.configuration.experimental.askChatLocation === 'quickChat' ? chatQuickInputActions_1.ASK_QUICK_QUESTION_ACTION_ID : chatActions_1.CHAT_OPEN_ACTION_ID,
                    args: [filter]
                });
            }
            return additionalPicks;
        }
        async getRelatedInformationPicks(allPicks, picksSoFar, filter, token) {
            const relatedInformation = await this.aiRelatedInformationService.getRelatedInformation(filter, [aiRelatedInformation_1.RelatedInformationType.CommandInformation], token);
            // Sort by weight descending to get the most relevant results first
            relatedInformation.sort((a, b) => b.weight - a.weight);
            const setOfPicksSoFar = new Set(picksSoFar.map(p => p.commandId));
            const additionalPicks = new Array();
            for (const info of relatedInformation) {
                if (info.weight < CommandsQuickAccessProvider_1.AI_RELATED_INFORMATION_THRESHOLD || additionalPicks.length === CommandsQuickAccessProvider_1.AI_RELATED_INFORMATION_MAX_PICKS) {
                    break;
                }
                const pick = allPicks.find(p => p.commandId === info.command && !setOfPicksSoFar.has(p.commandId));
                if (pick) {
                    additionalPicks.push(pick);
                }
            }
            return additionalPicks;
        }
        getGlobalCommandPicks() {
            const globalCommandPicks = [];
            const scopedContextKeyService = this.editorService.activeEditorPane?.scopedContextKeyService || this.editorGroupService.activeGroup.scopedContextKeyService;
            const globalCommandsMenu = this.menuService.createMenu(actions_1.MenuId.CommandPalette, scopedContextKeyService);
            const globalCommandsMenuActions = globalCommandsMenu.getActions()
                .reduce((r, [, actions]) => [...r, ...actions], [])
                .filter(action => action instanceof actions_1.MenuItemAction && action.enabled);
            for (const action of globalCommandsMenuActions) {
                // Label
                let label = (typeof action.item.title === 'string' ? action.item.title : action.item.title.value) || action.item.id;
                // Category
                const category = typeof action.item.category === 'string' ? action.item.category : action.item.category?.value;
                if (category) {
                    label = (0, nls_1.localize)('commandWithCategory', "{0}: {1}", category, label);
                }
                // Alias
                const aliasLabel = typeof action.item.title !== 'string' ? action.item.title.original : undefined;
                const aliasCategory = (category && action.item.category && typeof action.item.category !== 'string') ? action.item.category.original : undefined;
                const commandAlias = (aliasLabel && category) ?
                    aliasCategory ? `${aliasCategory}: ${aliasLabel}` : `${category}: ${aliasLabel}` :
                    aliasLabel;
                const metadataDescription = action.item.metadata?.description;
                const commandDescription = metadataDescription === undefined || (0, action_1.isLocalizedString)(metadataDescription)
                    ? metadataDescription
                    // TODO: this type will eventually not be a string and when that happens, this should simplified.
                    : { value: metadataDescription, original: metadataDescription };
                globalCommandPicks.push({
                    commandId: action.item.id,
                    commandAlias,
                    label: (0, iconLabels_1.stripIcons)(label),
                    commandDescription,
                });
            }
            // Cleanup
            globalCommandsMenu.dispose();
            return globalCommandPicks;
        }
    };
    exports.CommandsQuickAccessProvider = CommandsQuickAccessProvider;
    exports.CommandsQuickAccessProvider = CommandsQuickAccessProvider = CommandsQuickAccessProvider_1 = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, actions_1.IMenuService),
        __param(2, extensions_1.IExtensionService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, commands_1.ICommandService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, dialogs_1.IDialogService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, editorGroupsService_1.IEditorGroupsService),
        __param(10, preferences_1.IPreferencesService),
        __param(11, productService_1.IProductService),
        __param(12, aiRelatedInformation_1.IAiRelatedInformationService),
        __param(13, chatAgents_1.IChatAgentService)
    ], CommandsQuickAccessProvider);
    //#region Actions
    class ShowAllCommandsAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.showCommands'; }
        constructor() {
            super({
                id: ShowAllCommandsAction.ID,
                title: (0, nls_1.localize2)('showTriggerActions', 'Show All Commands'),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: undefined,
                    primary: !browser_1.isFirefox ? (2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 46 /* KeyCode.KeyP */) : undefined,
                    secondary: [59 /* KeyCode.F1 */]
                },
                f1: true
            });
        }
        async run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(CommandsQuickAccessProvider.PREFIX);
        }
    }
    exports.ShowAllCommandsAction = ShowAllCommandsAction;
    class ClearCommandHistoryAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.clearCommandHistory',
                title: (0, nls_1.localize2)('clearCommandHistory', 'Clear Command History'),
                f1: true
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const storageService = accessor.get(storage_1.IStorageService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const commandHistoryLength = commandsQuickAccess_2.CommandsHistory.getConfiguredCommandHistoryLength(configurationService);
            if (commandHistoryLength > 0) {
                // Ask for confirmation
                const { confirmed } = await dialogService.confirm({
                    type: 'warning',
                    message: (0, nls_1.localize)('confirmClearMessage', "Do you want to clear the history of recently used commands?"),
                    detail: (0, nls_1.localize)('confirmClearDetail', "This action is irreversible!"),
                    primaryButton: (0, nls_1.localize)({ key: 'clearButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Clear")
                });
                if (!confirmed) {
                    return;
                }
                commandsQuickAccess_2.CommandsHistory.clearHistory(configurationService, storageService);
            }
        }
    }
    exports.ClearCommandHistoryAction = ClearCommandHistoryAction;
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHNRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcXVpY2thY2Nlc3MvYnJvd3Nlci9jb21tYW5kc1F1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFzQ3pGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsK0RBQXlDOztpQkFFMUUscUNBQWdDLEdBQUcsQ0FBQyxBQUFKLENBQUs7aUJBQ3JDLHFDQUFnQyxHQUFHLEdBQUcsQUFBTixDQUFPO2lCQUN2QyxvQ0FBK0IsR0FBRyxHQUFHLEFBQU4sQ0FBTztRQVVyRCxJQUFjLHVCQUF1QixLQUEwQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO1FBRW5ILElBQUksa0JBQWtCO1lBQ3JCLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDdEMsT0FBTywyQ0FBNkIsQ0FBQyxJQUFJLENBQUM7WUFDM0MsQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxZQUNpQixhQUE4QyxFQUNoRCxXQUEwQyxFQUNyQyxnQkFBb0QsRUFDaEQsb0JBQTJDLEVBQzlDLGlCQUFxQyxFQUN4QyxjQUErQixFQUM3QixnQkFBbUMsRUFDdEMsYUFBNkIsRUFDdEIsb0JBQTRELEVBQzdELGtCQUF5RCxFQUMxRCxrQkFBd0QsRUFDNUQsY0FBZ0QsRUFDbkMsMkJBQTBFLEVBQ3JGLGdCQUFvRDtZQUV2RSxLQUFLLENBQUM7Z0JBQ0wsU0FBUyxFQUFFLENBQUMsbUJBQVEsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDdkMsYUFBYSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7b0JBQ3JCLEtBQUss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