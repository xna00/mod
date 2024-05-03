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
define(["require", "exports", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/filters", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/tfIdf", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry"], function (require, exports, errorMessage_1, errors_1, filters_1, functional_1, lifecycle_1, map_1, tfIdf_1, nls_1, commands_1, configuration_1, dialogs_1, instantiation_1, keybinding_1, log_1, pickerQuickAccess_1, storage_1, telemetry_1) {
    "use strict";
    var AbstractCommandsQuickAccessProvider_1, CommandsHistory_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandsHistory = exports.AbstractCommandsQuickAccessProvider = void 0;
    let AbstractCommandsQuickAccessProvider = class AbstractCommandsQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { AbstractCommandsQuickAccessProvider_1 = this; }
        static { this.PREFIX = '>'; }
        static { this.TFIDF_THRESHOLD = 0.5; }
        static { this.TFIDF_MAX_RESULTS = 5; }
        static { this.WORD_FILTER = (0, filters_1.or)(filters_1.matchesPrefix, filters_1.matchesWords, filters_1.matchesContiguousSubString); }
        constructor(options, instantiationService, keybindingService, commandService, telemetryService, dialogService) {
            super(AbstractCommandsQuickAccessProvider_1.PREFIX, options);
            this.instantiationService = instantiationService;
            this.keybindingService = keybindingService;
            this.commandService = commandService;
            this.telemetryService = telemetryService;
            this.dialogService = dialogService;
            this.commandsHistory = this._register(this.instantiationService.createInstance(CommandsHistory));
            this.options = options;
        }
        async _getPicks(filter, _disposables, token, runOptions) {
            // Ask subclass for all command picks
            const allCommandPicks = await this.getCommandPicks(token);
            if (token.isCancellationRequested) {
                return [];
            }
            const runTfidf = (0, functional_1.createSingleCallFunction)(() => {
                const tfidf = new tfIdf_1.TfIdfCalculator();
                tfidf.updateDocuments(allCommandPicks.map(commandPick => ({
                    key: commandPick.commandId,
                    textChunks: [this.getTfIdfChunk(commandPick)]
                })));
                const result = tfidf.calculateScores(filter, token);
                return (0, tfIdf_1.normalizeTfIdfScores)(result)
                    .filter(score => score.score > AbstractCommandsQuickAccessProvider_1.TFIDF_THRESHOLD)
                    .slice(0, AbstractCommandsQuickAccessProvider_1.TFIDF_MAX_RESULTS);
            });
            // Filter
            const filteredCommandPicks = [];
            for (const commandPick of allCommandPicks) {
                const labelHighlights = AbstractCommandsQuickAccessProvider_1.WORD_FILTER(filter, commandPick.label) ?? undefined;
                const aliasHighlights = commandPick.commandAlias ? AbstractCommandsQuickAccessProvider_1.WORD_FILTER(filter, commandPick.commandAlias) ?? undefined : undefined;
                // Add if matching in label or alias
                if (labelHighlights || aliasHighlights) {
                    commandPick.highlights = {
                        label: labelHighlights,
                        detail: this.options.showAlias ? aliasHighlights : undefined
                    };
                    filteredCommandPicks.push(commandPick);
                }
                // Also add if we have a 100% command ID match
                else if (filter === commandPick.commandId) {
                    filteredCommandPicks.push(commandPick);
                }
                // Handle tf-idf scoring for the rest if there's a filter
                else if (filter.length >= 3) {
                    const tfidf = runTfidf();
                    if (token.isCancellationRequested) {
                        return [];
                    }
                    // Add if we have a tf-idf score
                    const tfidfScore = tfidf.find(score => score.key === commandPick.commandId);
                    if (tfidfScore) {
                        commandPick.tfIdfScore = tfidfScore.score;
                        filteredCommandPicks.push(commandPick);
                    }
                }
            }
            // Add description to commands that have duplicate labels
            const mapLabelToCommand = new Map();
            for (const commandPick of filteredCommandPicks) {
                const existingCommandForLabel = mapLabelToCommand.get(commandPick.label);
                if (existingCommandForLabel) {
                    commandPick.description = commandPick.commandId;
                    existingCommandForLabel.description = existingCommandForLabel.commandId;
                }
                else {
                    mapLabelToCommand.set(commandPick.label, commandPick);
                }
            }
            // Sort by MRU order and fallback to name otherwise
            filteredCommandPicks.sort((commandPickA, commandPickB) => {
                // If a result came from tf-idf, we want to put that towards the bottom
                if (commandPickA.tfIdfScore && commandPickB.tfIdfScore) {
                    if (commandPickA.tfIdfScore === commandPickB.tfIdfScore) {
                        return commandPickA.label.localeCompare(commandPickB.label); // prefer lexicographically smaller command
                    }
                    return commandPickB.tfIdfScore - commandPickA.tfIdfScore; // prefer higher tf-idf score
                }
                else if (commandPickA.tfIdfScore) {
                    return 1; // first command has a score but other doesn't so other wins
                }
                else if (commandPickB.tfIdfScore) {
                    return -1; // other command has a score but first doesn't so first wins
                }
                const commandACounter = this.commandsHistory.peek(commandPickA.commandId);
                const commandBCounter = this.commandsHistory.peek(commandPickB.commandId);
                if (commandACounter && commandBCounter) {
                    return commandACounter > commandBCounter ? -1 : 1; // use more recently used command before older
                }
                if (commandACounter) {
                    return -1; // first command was used, so it wins over the non used one
                }
                if (commandBCounter) {
                    return 1; // other command was used so it wins over the command
                }
                if (this.options.suggestedCommandIds) {
                    const commandASuggestion = this.options.suggestedCommandIds.has(commandPickA.commandId);
                    const commandBSuggestion = this.options.suggestedCommandIds.has(commandPickB.commandId);
                    if (commandASuggestion && commandBSuggestion) {
                        return 0; // honor the order of the array
                    }
                    if (commandASuggestion) {
                        return -1; // first command was suggested, so it wins over the non suggested one
                    }
                    if (commandBSuggestion) {
                        return 1; // other command was suggested so it wins over the command
                    }
                }
                // both commands were never used, so we sort by name
                return commandPickA.label.localeCompare(commandPickB.label);
            });
            const commandPicks = [];
            let addOtherSeparator = false;
            let addSuggestedSeparator = true;
            let addCommonlyUsedSeparator = !!this.options.suggestedCommandIds;
            for (let i = 0; i < filteredCommandPicks.length; i++) {
                const commandPick = filteredCommandPicks[i];
                // Separator: recently used
                if (i === 0 && this.commandsHistory.peek(commandPick.commandId)) {
                    commandPicks.push({ type: 'separator', label: (0, nls_1.localize)('recentlyUsed', "recently used") });
                    addOtherSeparator = true;
                }
                if (addSuggestedSeparator && commandPick.tfIdfScore !== undefined) {
                    commandPicks.push({ type: 'separator', label: (0, nls_1.localize)('suggested', "similar commands") });
                    addSuggestedSeparator = false;
                }
                // Separator: commonly used
                if (addCommonlyUsedSeparator && commandPick.tfIdfScore === undefined && !this.commandsHistory.peek(commandPick.commandId) && this.options.suggestedCommandIds?.has(commandPick.commandId)) {
                    commandPicks.push({ type: 'separator', label: (0, nls_1.localize)('commonlyUsed', "commonly used") });
                    addOtherSeparator = true;
                    addCommonlyUsedSeparator = false;
                }
                // Separator: other commands
                if (addOtherSeparator && commandPick.tfIdfScore === undefined && !this.commandsHistory.peek(commandPick.commandId) && !this.options.suggestedCommandIds?.has(commandPick.commandId)) {
                    commandPicks.push({ type: 'separator', label: (0, nls_1.localize)('morecCommands', "other commands") });
                    addOtherSeparator = false;
                }
                // Command
                commandPicks.push(this.toCommandPick(commandPick, runOptions));
            }
            if (!this.hasAdditionalCommandPicks(filter, token)) {
                return commandPicks;
            }
            return {
                picks: commandPicks,
                additionalPicks: (async () => {
                    const additionalCommandPicks = await this.getAdditionalCommandPicks(allCommandPicks, filteredCommandPicks, filter, token);
                    if (token.isCancellationRequested) {
                        return [];
                    }
                    const commandPicks = additionalCommandPicks.map(commandPick => this.toCommandPick(commandPick, runOptions));
                    // Basically, if we haven't already added a separator, we add one before the additional picks so long
                    // as one hasn't been added to the start of the array.
                    if (addSuggestedSeparator && commandPicks[0]?.type !== 'separator') {
                        commandPicks.unshift({ type: 'separator', label: (0, nls_1.localize)('suggested', "similar commands") });
                    }
                    return commandPicks;
                })()
            };
        }
        toCommandPick(commandPick, runOptions) {
            if (commandPick.type === 'separator') {
                return commandPick;
            }
            const keybinding = this.keybindingService.lookupKeybinding(commandPick.commandId);
            const ariaLabel = keybinding ?
                (0, nls_1.localize)('commandPickAriaLabelWithKeybinding', "{0}, {1}", commandPick.label, keybinding.getAriaLabel()) :
                commandPick.label;
            return {
                ...commandPick,
                ariaLabel,
                detail: this.options.showAlias && commandPick.commandAlias !== commandPick.label ? commandPick.commandAlias : undefined,
                keybinding,
                accept: async () => {
                    // Add to history
                    this.commandsHistory.push(commandPick.commandId);
                    // Telementry
                    this.telemetryService.publicLog2('workbenchActionExecuted', {
                        id: commandPick.commandId,
                        from: runOptions?.from ?? 'quick open'
                    });
                    // Run
                    try {
                        commandPick.args?.length
                            ? await this.commandService.executeCommand(commandPick.commandId, ...commandPick.args)
                            : await this.commandService.executeCommand(commandPick.commandId);
                    }
                    catch (error) {
                        if (!(0, errors_1.isCancellationError)(error)) {
                            this.dialogService.error((0, nls_1.localize)('canNotRun', "Command '{0}' resulted in an error", commandPick.label), (0, errorMessage_1.toErrorMessage)(error));
                        }
                    }
                }
            };
        }
        // TF-IDF string to be indexed
        getTfIdfChunk({ label, commandAlias, commandDescription }) {
            let chunk = label;
            if (commandAlias && commandAlias !== label) {
                chunk += ` - ${commandAlias}`;
            }
            if (commandDescription && commandDescription.value !== label) {
                // If the original is the same as the value, don't add it
                chunk += ` - ${commandDescription.value === commandDescription.original ? commandDescription.value : `${commandDescription.value} (${commandDescription.original})`}`;
            }
            return chunk;
        }
    };
    exports.AbstractCommandsQuickAccessProvider = AbstractCommandsQuickAccessProvider;
    exports.AbstractCommandsQuickAccessProvider = AbstractCommandsQuickAccessProvider = AbstractCommandsQuickAccessProvider_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, commands_1.ICommandService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, dialogs_1.IDialogService)
    ], AbstractCommandsQuickAccessProvider);
    let CommandsHistory = class CommandsHistory extends lifecycle_1.Disposable {
        static { CommandsHistory_1 = this; }
        static { this.DEFAULT_COMMANDS_HISTORY_LENGTH = 50; }
        static { this.PREF_KEY_CACHE = 'commandPalette.mru.cache'; }
        static { this.PREF_KEY_COUNTER = 'commandPalette.mru.counter'; }
        static { this.counter = 1; }
        static { this.hasChanges = false; }
        constructor(storageService, configurationService, logService) {
            super();
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.logService = logService;
            this.configuredCommandsHistoryLength = 0;
            this.updateConfiguration();
            this.load();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.updateConfiguration(e)));
            this._register(this.storageService.onWillSaveState(e => {
                if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    // Commands history is very dynamic and so we limit impact
                    // on storage to only save on shutdown. This helps reduce
                    // the overhead of syncing this data across machines.
                    this.saveState();
                }
            }));
        }
        updateConfiguration(e) {
            if (e && !e.affectsConfiguration('workbench.commandPalette.history')) {
                return;
            }
            this.configuredCommandsHistoryLength = CommandsHistory_1.getConfiguredCommandHistoryLength(this.configurationService);
            if (CommandsHistory_1.cache && CommandsHistory_1.cache.limit !== this.configuredCommandsHistoryLength) {
                CommandsHistory_1.cache.limit = this.configuredCommandsHistoryLength;
                CommandsHistory_1.hasChanges = true;
            }
        }
        load() {
            const raw = this.storageService.get(CommandsHistory_1.PREF_KEY_CACHE, 0 /* StorageScope.PROFILE */);
            let serializedCache;
            if (raw) {
                try {
                    serializedCache = JSON.parse(raw);
                }
                catch (error) {
                    this.logService.error(`[CommandsHistory] invalid data: ${error}`);
                }
            }
            const cache = CommandsHistory_1.cache = new map_1.LRUCache(this.configuredCommandsHistoryLength, 1);
            if (serializedCache) {
                let entries;
                if (serializedCache.usesLRU) {
                    entries = serializedCache.entries;
                }
                else {
                    entries = serializedCache.entries.sort((a, b) => a.value - b.value);
                }
                entries.forEach(entry => cache.set(entry.key, entry.value));
            }
            CommandsHistory_1.counter = this.storageService.getNumber(CommandsHistory_1.PREF_KEY_COUNTER, 0 /* StorageScope.PROFILE */, CommandsHistory_1.counter);
        }
        push(commandId) {
            if (!CommandsHistory_1.cache) {
                return;
            }
            CommandsHistory_1.cache.set(commandId, CommandsHistory_1.counter++); // set counter to command
            CommandsHistory_1.hasChanges = true;
        }
        peek(commandId) {
            return CommandsHistory_1.cache?.peek(commandId);
        }
        saveState() {
            if (!CommandsHistory_1.cache) {
                return;
            }
            if (!CommandsHistory_1.hasChanges) {
                return;
            }
            const serializedCache = { usesLRU: true, entries: [] };
            CommandsHistory_1.cache.forEach((value, key) => serializedCache.entries.push({ key, value }));
            this.storageService.store(CommandsHistory_1.PREF_KEY_CACHE, JSON.stringify(serializedCache), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            this.storageService.store(CommandsHistory_1.PREF_KEY_COUNTER, CommandsHistory_1.counter, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            CommandsHistory_1.hasChanges = false;
        }
        static getConfiguredCommandHistoryLength(configurationService) {
            const config = configurationService.getValue();
            const configuredCommandHistoryLength = config.workbench?.commandPalette?.history;
            if (typeof configuredCommandHistoryLength === 'number') {
                return configuredCommandHistoryLength;
            }
            return CommandsHistory_1.DEFAULT_COMMANDS_HISTORY_LENGTH;
        }
        static clearHistory(configurationService, storageService) {
            const commandHistoryLength = CommandsHistory_1.getConfiguredCommandHistoryLength(configurationService);
            CommandsHistory_1.cache = new map_1.LRUCache(commandHistoryLength);
            CommandsHistory_1.counter = 1;
            CommandsHistory_1.hasChanges = true;
        }
    };
    exports.CommandsHistory = CommandsHistory;
    exports.CommandsHistory = CommandsHistory = CommandsHistory_1 = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService)
    ], CommandsHistory);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHNRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcXVpY2tpbnB1dC9icm93c2VyL2NvbW1hbmRzUXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXNDekYsSUFBZSxtQ0FBbUMsR0FBbEQsTUFBZSxtQ0FBb0MsU0FBUSw2Q0FBNEM7O2lCQUV0RyxXQUFNLEdBQUcsR0FBRyxBQUFOLENBQU87aUJBRUksb0JBQWUsR0FBRyxHQUFHLEFBQU4sQ0FBTztpQkFDdEIsc0JBQWlCLEdBQUcsQ0FBQyxBQUFKLENBQUs7aUJBRS9CLGdCQUFXLEdBQUcsSUFBQSxZQUFFLEVBQUMsdUJBQWEsRUFBRSxzQkFBWSxFQUFFLG9DQUEwQixDQUFDLEFBQTlELENBQStEO1FBTXpGLFlBQ0MsT0FBb0MsRUFDYixvQkFBNEQsRUFDL0QsaUJBQXNELEVBQ3pELGNBQWdELEVBQzlDLGdCQUFvRCxFQUN2RCxhQUE4QztZQUU5RCxLQUFLLENBQUMscUNBQW1DLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBTm5CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDOUMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUN4QyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN0QyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFWOUMsb0JBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQWM1RyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN4QixDQUFDO1FBRVMsS0FBSyxDQUFDLFNB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