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
define(["require", "exports", "vs/base/browser/ui/toggle/toggle", "vs/base/common/platform", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/common/quickInput", "vs/platform/terminal/common/terminalEnvironment", "vs/platform/theme/common/colorRegistry", "vs/base/common/themables", "vs/workbench/contrib/terminal/browser/terminalIcons", "vs/workbench/contrib/terminal/common/history", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/base/common/uri", "vs/base/common/date", "vs/workbench/services/editor/common/editorService", "vs/platform/quickinput/browser/quickPickPin", "vs/platform/storage/common/storage", "vs/workbench/contrib/accessibility/browser/accessibleView"], function (require, exports, toggle_1, platform_1, model_1, resolverService_1, nls_1, instantiation_1, quickInput_1, terminalEnvironment_1, colorRegistry_1, themables_1, terminalIcons_1, history_1, terminalStrings_1, uri_1, date_1, editorService_1, quickPickPin_1, storage_1, accessibleView_1) {
    "use strict";
    var TerminalOutputProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showRunRecentQuickPick = showRunRecentQuickPick;
    async function showRunRecentQuickPick(accessor, instance, terminalInRunCommandPicker, type, filterMode, value) {
        if (!instance.xterm) {
            return;
        }
        const editorService = accessor.get(editorService_1.IEditorService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        const storageService = accessor.get(storage_1.IStorageService);
        const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
        const runRecentStorageKey = `${"terminal.pinnedRecentCommands" /* TerminalStorageKeys.PinnedRecentCommandsPrefix */}.${instance.shellType}`;
        let placeholder;
        let items = [];
        const commandMap = new Set();
        const removeFromCommandHistoryButton = {
            iconClass: themables_1.ThemeIcon.asClassName(terminalIcons_1.commandHistoryRemoveIcon),
            tooltip: (0, nls_1.localize)('removeCommand', "Remove from Command History")
        };
        const commandOutputButton = {
            iconClass: themables_1.ThemeIcon.asClassName(terminalIcons_1.commandHistoryOutputIcon),
            tooltip: (0, nls_1.localize)('viewCommandOutput', "View Command Output"),
            alwaysVisible: false
        };
        if (type === 'command') {
            placeholder = platform_1.isMacintosh ? (0, nls_1.localize)('selectRecentCommandMac', 'Select a command to run (hold Option-key to edit the command)') : (0, nls_1.localize)('selectRecentCommand', 'Select a command to run (hold Alt-key to edit the command)');
            const cmdDetection = instance.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            const commands = cmdDetection?.commands;
            // Current session history
            const executingCommand = cmdDetection?.executingCommand;
            if (executingCommand) {
                commandMap.add(executingCommand);
            }
            function formatLabel(label) {
                return label
                    // Replace new lines with "enter" symbol
                    .replace(/\r?\n/g, '\u23CE')
                    // Replace 3 or more spaces with midline horizontal ellipsis which looks similar
                    // to whitespace in the editor
                    .replace(/\s\s\s+/g, '\u22EF');
            }
            if (commands && commands.length > 0) {
                for (const entry of commands) {
                    // Trim off any whitespace and/or line endings, replace new lines with the
                    // Downwards Arrow with Corner Leftwards symbol
                    const label = entry.command.trim();
                    if (label.length === 0 || commandMap.has(label)) {
                        continue;
                    }
                    let description = (0, terminalEnvironment_1.collapseTildePath)(entry.cwd, instance.userHome, instance.os === 1 /* OperatingSystem.Windows */ ? '\\' : '/');
                    if (entry.exitCode) {
                        // Since you cannot get the last command's exit code on pwsh, just whether it failed
                        // or not, -1 is treated specially as simply failed
                        if (entry.exitCode === -1) {
                            description += ' failed';
                        }
                        else {
                            description += ` exitCode: ${entry.exitCode}`;
                        }
                    }
                    description = description.trim();
                    const buttons = [commandOutputButton];
                    // Merge consecutive commands
                    const lastItem = items.length > 0 ? items[items.length - 1] : undefined;
                    if (lastItem?.type !== 'separator' && lastItem?.label === label) {
                        lastItem.id = entry.timestamp.toString();
                        lastItem.description = description;
                        continue;
                    }
                    items.push({
                        label: formatLabel(label),
                        rawLabel: label,
                        description,
                        id: entry.timestamp.toString(),
                        command: entry,
                        buttons: entry.hasOutput() ? buttons : undefined
                    });
                    commandMap.add(label);
                }
                items = items.reverse();
            }
            if (executingCommand) {
                items.unshift({
                    label: formatLabel(executingCommand),
                    rawLabel: executingCommand,
                    description: cmdDetection.cwd
                });
            }
            if (items.length > 0) {
                items.unshift({ type: 'separator', label: terminalStrings_1.terminalStrings.currentSessionCategory });
            }
            // Gather previous session history
            const history = instantiationService.invokeFunction(history_1.getCommandHistory);
            const previousSessionItems = [];
            for (const [label, info] of history.entries) {
                // Only add previous session item if it's not in this session
                if (!commandMap.has(label) && info.shellType === instance.shellType) {
                    previousSessionItems.unshift({
                        label: formatLabel(label),
                        rawLabel: label,
                        buttons: [removeFromCommandHistoryButton]
                    });
                    commandMap.add(label);
                }
            }
            if (previousSessionItems.length > 0) {
                items.push({ type: 'separator', label: terminalStrings_1.terminalStrings.previousSessionCategory }, ...previousSessionItems);
            }
            // Gather shell file history
            const shellFileHistory = await instantiationService.invokeFunction(history_1.getShellFileHistory, instance.shellType);
            const dedupedShellFileItems = [];
            for (const label of shellFileHistory) {
                if (!commandMap.has(label)) {
                    dedupedShellFileItems.unshift({
                        label: formatLabel(label),
                        rawLabel: label
                    });
                }
            }
            if (dedupedShellFileItems.length > 0) {
                items.push({ type: 'separator', label: (0, nls_1.localize)('shellFileHistoryCategory', '{0} history', instance.shellType) }, ...dedupedShellFileItems);
            }
        }
        else {
            placeholder = platform_1.isMacintosh
                ? (0, nls_1.localize)('selectRecentDirectoryMac', 'Select a directory to go to (hold Option-key to edit the command)')
                : (0, nls_1.localize)('selectRecentDirectory', 'Select a directory to go to (hold Alt-key to edit the command)');
            const cwds = instance.capabilities.get(0 /* TerminalCapability.CwdDetection */)?.cwds || [];
            if (cwds && cwds.length > 0) {
                for (const label of cwds) {
                    items.push({ label, rawLabel: label });
                }
                items = items.reverse();
                items.unshift({ type: 'separator', label: terminalStrings_1.terminalStrings.currentSessionCategory });
            }
            // Gather previous session history
            const history = instantiationService.invokeFunction(history_1.getDirectoryHistory);
            const previousSessionItems = [];
            // Only add previous session item if it's not in this session and it matches the remote authority
            for (const [label, info] of history.entries) {
                if ((info === null || info.remoteAuthority === instance.remoteAuthority) && !cwds.includes(label)) {
                    previousSessionItems.unshift({
                        label,
                        rawLabel: label,
                        buttons: [removeFromCommandHistoryButton]
                    });
                }
            }
            if (previousSessionItems.length > 0) {
                items.push({ type: 'separator', label: terminalStrings_1.terminalStrings.previousSessionCategory }, ...previousSessionItems);
            }
        }
        if (items.length === 0) {
            return;
        }
        const fuzzySearchToggle = new toggle_1.Toggle({
            title: 'Fuzzy search',
            icon: terminalIcons_1.commandHistoryFuzzySearchIcon,
            isChecked: filterMode === 'fuzzy',
            inputActiveOptionBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionBorder),
            inputActiveOptionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionForeground),
            inputActiveOptionBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionBackground)
        });
        fuzzySearchToggle.onChange(() => {
            instantiationService.invokeFunction(showRunRecentQuickPick, instance, terminalInRunCommandPicker, type, fuzzySearchToggle.checked ? 'fuzzy' : 'contiguous', quickPick.value);
        });
        const outputProvider = instantiationService.createInstance(TerminalOutputProvider);
        const quickPick = quickInputService.createQuickPick();
        const originalItems = items;
        quickPick.items = [...originalItems];
        quickPick.sortByLabel = false;
        quickPick.placeholder = placeholder;
        quickPick.matchOnLabelMode = filterMode || 'contiguous';
        quickPick.toggles = [fuzzySearchToggle];
        quickPick.onDidTriggerItemButton(async (e) => {
            if (e.button === removeFromCommandHistoryButton) {
                if (type === 'command') {
                    instantiationService.invokeFunction(history_1.getCommandHistory)?.remove(e.item.label);
                }
                else {
                    instantiationService.invokeFunction(history_1.getDirectoryHistory)?.remove(e.item.label);
                }
            }
            else if (e.button === commandOutputButton) {
                const selectedCommand = e.item.command;
                const output = selectedCommand?.getOutput();
                if (output && selectedCommand?.command) {
                    const textContent = await outputProvider.provideTextContent(uri_1.URI.from({
                        scheme: TerminalOutputProvider.scheme,
                        path: `${selectedCommand.command}... ${(0, date_1.fromNow)(selectedCommand.timestamp, true)}`,
                        fragment: output,
                        query: `terminal-output-${selectedCommand.timestamp}-${instance.instanceId}`
                    }));
                    if (textContent) {
                        await editorService.openEditor({
                            resource: textContent.uri
                        });
                    }
                }
            }
            await instantiationService.invokeFunction(showRunRecentQuickPick, instance, terminalInRunCommandPicker, type, filterMode, value);
        });
        quickPick.onDidChangeValue(async (value) => {
            if (!value) {
                await instantiationService.invokeFunction(showRunRecentQuickPick, instance, terminalInRunCommandPicker, type, filterMode, value);
            }
        });
        let terminalScrollStateSaved = false;
        function restoreScrollState() {
            terminalScrollStateSaved = false;
            instance.xterm?.markTracker.restoreScrollState();
            instance.xterm?.markTracker.clear();
        }
        quickPick.onDidChangeActive(async () => {
            const xterm = instance.xterm;
            if (!xterm) {
                return;
            }
            const [item] = quickPick.activeItems;
            if ('command' in item && item.command && item.command.marker) {
                if (!terminalScrollStateSaved) {
                    xterm.markTracker.saveScrollState();
                    terminalScrollStateSaved = true;
                }
                const promptRowCount = item.command.getPromptRowCount();
                const commandRowCount = item.command.getCommandRowCount();
                xterm.markTracker.revealRange({
                    start: {
                        x: 1,
                        y: item.command.marker.line - (promptRowCount - 1) + 1
                    },
                    end: {
                        x: instance.cols,
                        y: item.command.marker.line + (commandRowCount - 1) + 1
                    }
                });
            }
            else {
                restoreScrollState();
            }
        });
        quickPick.onDidAccept(async () => {
            const result = quickPick.activeItems[0];
            let text;
            if (type === 'cwd') {
                text = `cd ${await instance.preparePathForShell(result.rawLabel)}`;
            }
            else { // command
                text = result.rawLabel;
            }
            quickPick.hide();
            instance.runCommand(text, !quickPick.keyMods.alt);
            if (quickPick.keyMods.alt) {
                instance.focus();
            }
            restoreScrollState();
        });
        quickPick.onDidHide(() => restoreScrollState());
        if (value) {
            quickPick.value = value;
        }
        return new Promise(r => {
            terminalInRunCommandPicker.set(true);
            (0, quickPickPin_1.showWithPinnedItems)(storageService, runRecentStorageKey, quickPick, true);
            quickPick.onDidHide(() => {
                terminalInRunCommandPicker.set(false);
                accessibleViewService.showLastProvider("terminal" /* AccessibleViewProviderId.Terminal */);
                r();
            });
        });
    }
    let TerminalOutputProvider = class TerminalOutputProvider {
        static { TerminalOutputProvider_1 = this; }
        static { this.scheme = 'TERMINAL_OUTPUT'; }
        constructor(textModelResolverService, _modelService) {
            this._modelService = _modelService;
            textModelResolverService.registerTextModelContentProvider(TerminalOutputProvider_1.scheme, this);
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing && !existing.isDisposed()) {
                return existing;
            }
            return this._modelService.createModel(resource.fragment, null, resource, false);
        }
    };
    TerminalOutputProvider = TerminalOutputProvider_1 = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService)
    ], TerminalOutputProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxSdW5SZWNlbnRRdWlja1BpY2suanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxSdW5SZWNlbnRRdWlja1BpY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNEJoRyx3REFrU0M7SUFsU00sS0FBSyxVQUFVLHNCQUFzQixDQUMzQyxRQUEwQixFQUMxQixRQUEyQixFQUMzQiwwQkFBZ0QsRUFDaEQsSUFBdUIsRUFDdkIsVUFBbUMsRUFDbkMsS0FBYztRQUVkLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDckIsT0FBTztRQUNSLENBQUM7UUFFRCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztRQUNuRCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztRQUNqRSxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztRQUMzRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQztRQUNyRCxNQUFNLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUNBQXNCLENBQUMsQ0FBQztRQUVuRSxNQUFNLG1CQUFtQixHQUFHLEdBQUcsb0ZBQThDLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3RHLElBQUksV0FBbUIsQ0FBQztRQUV4QixJQUFJLEtBQUssR0FBMkUsRUFBRSxDQUFDO1FBQ3ZGLE1BQU0sVUFBVSxHQUFnQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRTFDLE1BQU0sOEJBQThCLEdB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