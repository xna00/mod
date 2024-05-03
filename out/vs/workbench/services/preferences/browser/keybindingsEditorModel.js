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
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/platform", "vs/base/common/filters", "vs/base/common/keybindingLabels", "vs/platform/actions/common/actions", "vs/workbench/common/editor/editorModel", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/workbench/services/keybinding/browser/unboundCommands", "vs/base/common/types", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensions/common/extensions"], function (require, exports, nls_1, arrays_1, strings, platform_1, filters_1, keybindingLabels_1, actions_1, editorModel_1, keybinding_1, resolvedKeybindingItem_1, unboundCommands_1, types_1, extensions_1, extensions_2) {
    "use strict";
    var KeybindingsEditorModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsEditorModel = exports.KEYBINDING_ENTRY_TEMPLATE_ID = void 0;
    exports.KEYBINDING_ENTRY_TEMPLATE_ID = 'keybinding.entry.template';
    const SOURCE_SYSTEM = (0, nls_1.localize)('default', "System");
    const SOURCE_EXTENSION = (0, nls_1.localize)('extension', "Extension");
    const SOURCE_USER = (0, nls_1.localize)('user', "User");
    const wordFilter = (0, filters_1.or)(filters_1.matchesPrefix, filters_1.matchesWords, filters_1.matchesContiguousSubString);
    const SOURCE_REGEX = /@source:\s*(user|default|system|extension)/i;
    const EXTENSION_REGEX = /@ext:\s*((".+")|([^\s]+))/i;
    let KeybindingsEditorModel = KeybindingsEditorModel_1 = class KeybindingsEditorModel extends editorModel_1.EditorModel {
        constructor(os, keybindingsService, extensionService) {
            super();
            this.keybindingsService = keybindingsService;
            this.extensionService = extensionService;
            this._keybindingItems = [];
            this._keybindingItemsSortedByPrecedence = [];
            this.modifierLabels = {
                ui: keybindingLabels_1.UILabelProvider.modifierLabels[os],
                aria: keybindingLabels_1.AriaLabelProvider.modifierLabels[os],
                user: keybindingLabels_1.UserSettingsLabelProvider.modifierLabels[os]
            };
        }
        fetch(searchValue, sortByPrecedence = false) {
            let keybindingItems = sortByPrecedence ? this._keybindingItemsSortedByPrecedence : this._keybindingItems;
            const commandIdMatches = /@command:\s*(.+)/i.exec(searchValue);
            if (commandIdMatches && commandIdMatches[1]) {
                return keybindingItems.filter(k => k.command === commandIdMatches[1])
                    .map(keybindingItem => ({ id: KeybindingsEditorModel_1.getId(keybindingItem), keybindingItem, templateId: exports.KEYBINDING_ENTRY_TEMPLATE_ID }));
            }
            if (SOURCE_REGEX.test(searchValue)) {
                keybindingItems = this.filterBySource(keybindingItems, searchValue);
                searchValue = searchValue.replace(SOURCE_REGEX, '');
            }
            else {
                const extensionMatches = EXTENSION_REGEX.exec(searchValue);
                if (extensionMatches && (extensionMatches[2] || extensionMatches[3])) {
                    const extensionId = extensionMatches[2] ? extensionMatches[2].substring(1, extensionMatches[2].length - 1) : extensionMatches[3];
                    keybindingItems = this.filterByExtension(keybindingItems, extensionId);
                    searchValue = searchValue.replace(EXTENSION_REGEX, '');
                }
                else {
                    const keybindingMatches = /@keybinding:\s*((\".+\")|(\S+))/i.exec(searchValue);
                    if (keybindingMatches && (keybindingMatches[2] || keybindingMatches[3])) {
                        searchValue = keybindingMatches[2] || `"${keybindingMatches[3]}"`;
                    }
                }
            }
            searchValue = searchValue.trim();
            if (!searchValue) {
                return keybindingItems.map(keybindingItem => ({ id: KeybindingsEditorModel_1.getId(keybindingItem), keybindingItem, templateId: exports.KEYBINDING_ENTRY_TEMPLATE_ID }));
            }
            return this.filterByText(keybindingItems, searchValue);
        }
        filterBySource(keybindingItems, searchValue) {
            if (/@source:\s*default/i.test(searchValue) || /@source:\s*system/i.test(searchValue)) {
                return keybindingItems.filter(k => k.source === SOURCE_SYSTEM);
            }
            if (/@source:\s*user/i.test(searchValue)) {
                return keybindingItems.filter(k => k.source === SOURCE_USER);
            }
            if (/@source:\s*extension/i.test(searchValue)) {
                return keybindingItems.filter(k => !(0, types_1.isString)(k.source) || k.source === SOURCE_EXTENSION);
            }
            return keybindingItems;
        }
        filterByExtension(keybindingItems, extension) {
            extension = extension.toLowerCase().trim();
            return keybindingItems.filter(k => !(0, types_1.isString)(k.source) && (extensions_2.ExtensionIdentifier.equals(k.source.identifier, extension) || k.source.displayName?.toLowerCase() === extension.toLowerCase()));
        }
        filterByText(keybindingItems, searchValue) {
            const quoteAtFirstChar = searchValue.charAt(0) === '"';
            const quoteAtLastChar = searchValue.charAt(searchValue.length - 1) === '"';
            const completeMatch = quoteAtFirstChar && quoteAtLastChar;
            if (quoteAtFirstChar) {
                searchValue = searchValue.substring(1);
            }
            if (quoteAtLastChar) {
                searchValue = searchValue.substring(0, searchValue.length - 1);
            }
            searchValue = searchValue.trim();
            const result = [];
            const words = searchValue.split(' ');
            const keybindingWords = this.splitKeybindingWords(words);
            for (const keybindingItem of keybindingItems) {
                const keybindingMatches = new KeybindingItemMatches(this.modifierLabels, keybindingItem, searchValue, words, keybindingWords, completeMatch);
                if (keybindingMatches.commandIdMatches
                    || keybindingMatches.commandLabelMatches
                    || keybindingMatches.commandDefaultLabelMatches
                    || keybindingMatches.sourceMatches
                    || keybindingMatches.whenMatches
                    || keybindingMatches.keybindingMatches
                    || keybindingMatches.extensionIdMatches
                    || keybindingMatches.extensionLabelMatches) {
                    result.push({
                        id: KeybindingsEditorModel_1.getId(keybindingItem),
                        templateId: exports.KEYBINDING_ENTRY_TEMPLATE_ID,
                        commandLabelMatches: keybindingMatches.commandLabelMatches || undefined,
                        commandDefaultLabelMatches: keybindingMatches.commandDefaultLabelMatches || undefined,
                        keybindingItem,
                        keybindingMatches: keybindingMatches.keybindingMatches || undefined,
                        commandIdMatches: keybindingMatches.commandIdMatches || undefined,
                        sourceMatches: keybindingMatches.sourceMatches || undefined,
                        whenMatches: keybindingMatches.whenMatches || undefined,
                        extensionIdMatches: keybindingMatches.extensionIdMatches || undefined,
                        extensionLabelMatches: keybindingMatches.extensionLabelMatches || undefined
                    });
                }
            }
            return result;
        }
        splitKeybindingWords(wordsSeparatedBySpaces) {
            const result = [];
            for (const word of wordsSeparatedBySpaces) {
                result.push(...(0, arrays_1.coalesce)(word.split('+')));
            }
            return result;
        }
        async resolve(actionLabels = new Map()) {
            const extensions = new extensions_2.ExtensionIdentifierMap();
            for (const extension of this.extensionService.extensions) {
                extensions.set(extension.identifier, extension);
            }
            this._keybindingItemsSortedByPrecedence = [];
            const boundCommands = new Map();
            for (const keybinding of this.keybindingsService.getKeybindings()) {
                if (keybinding.command) { // Skip keybindings without commands
                    this._keybindingItemsSortedByPrecedence.push(KeybindingsEditorModel_1.toKeybindingEntry(keybinding.command, keybinding, actionLabels, extensions));
                    boundCommands.set(keybinding.command, true);
                }
            }
            const commandsWithDefaultKeybindings = this.keybindingsService.getDefaultKeybindings().map(keybinding => keybinding.command);
            for (const command of (0, unboundCommands_1.getAllUnboundCommands)(boundCommands)) {
                const keybindingItem = new resolvedKeybindingItem_1.ResolvedKeybindingItem(undefined, command, null, undefined, commandsWithDefaultKeybindings.indexOf(command) === -1, null, false);
                this._keybindingItemsSortedByPrecedence.push(KeybindingsEditorModel_1.toKeybindingEntry(command, keybindingItem, actionLabels, extensions));
            }
            this._keybindingItemsSortedByPrecedence = (0, arrays_1.distinct)(this._keybindingItemsSortedByPrecedence, keybindingItem => KeybindingsEditorModel_1.getId(keybindingItem));
            this._keybindingItems = this._keybindingItemsSortedByPrecedence.slice(0).sort((a, b) => KeybindingsEditorModel_1.compareKeybindingData(a, b));
            return super.resolve();
        }
        static getId(keybindingItem) {
            return keybindingItem.command + (keybindingItem?.keybinding?.getAriaLabel() ?? '') + keybindingItem.when + ((0, types_1.isString)(keybindingItem.source) ? keybindingItem.source : keybindingItem.source.identifier.value);
        }
        static compareKeybindingData(a, b) {
            if (a.keybinding && !b.keybinding) {
                return -1;
            }
            if (b.keybinding && !a.keybinding) {
                return 1;
            }
            if (a.commandLabel && !b.commandLabel) {
                return -1;
            }
            if (b.commandLabel && !a.commandLabel) {
                return 1;
            }
            if (a.commandLabel && b.commandLabel) {
                if (a.commandLabel !== b.commandLabel) {
                    return a.commandLabel.localeCompare(b.commandLabel);
                }
            }
            if (a.command === b.command) {
                return a.keybindingItem.isDefault ? 1 : -1;
            }
            return a.command.localeCompare(b.command);
        }
        static toKeybindingEntry(command, keybindingItem, actions, extensions) {
            const menuCommand = actions_1.MenuRegistry.getCommand(command);
            const editorActionLabel = actions.get(command);
            let source = SOURCE_USER;
            if (keybindingItem.isDefault) {
                const extensionId = keybindingItem.extensionId ?? (keybindingItem.resolvedKeybinding ? undefined : menuCommand?.source?.id);
                source = extensionId ? extensions.get(extensionId) ?? SOURCE_EXTENSION : SOURCE_SYSTEM;
            }
            return {
                keybinding: keybindingItem.resolvedKeybinding,
                keybindingItem,
                command,
                commandLabel: KeybindingsEditorModel_1.getCommandLabel(menuCommand, editorActionLabel),
                commandDefaultLabel: KeybindingsEditorModel_1.getCommandDefaultLabel(menuCommand),
                when: keybindingItem.when ? keybindingItem.when.serialize() : '',
                source
            };
        }
        static getCommandDefaultLabel(menuCommand) {
            if (!platform_1.Language.isDefaultVariant()) {
                if (menuCommand && menuCommand.title && menuCommand.title.original) {
                    const category = menuCommand.category ? menuCommand.category.original : undefined;
                    const title = menuCommand.title.original;
                    return category ? (0, nls_1.localize)('cat.title', "{0}: {1}", category, title) : title;
                }
            }
            return null;
        }
        static getCommandLabel(menuCommand, editorActionLabel) {
            if (menuCommand) {
                const category = menuCommand.category ? typeof menuCommand.category === 'string' ? menuCommand.category : menuCommand.category.value : undefined;
                const title = typeof menuCommand.title === 'string' ? menuCommand.title : menuCommand.title.value;
                return category ? (0, nls_1.localize)('cat.title', "{0}: {1}", category, title) : title;
            }
            if (editorActionLabel) {
                return editorActionLabel;
            }
            return '';
        }
    };
    exports.KeybindingsEditorModel = KeybindingsEditorModel;
    exports.KeybindingsEditorModel = KeybindingsEditorModel = KeybindingsEditorModel_1 = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, extensions_1.IExtensionService)
    ], KeybindingsEditorModel);
    class KeybindingItemMatches {
        constructor(modifierLabels, keybindingItem, searchValue, words, keybindingWords, completeMatch) {
            this.modifierLabels = modifierLabels;
            this.commandIdMatches = null;
            this.commandLabelMatches = null;
            this.commandDefaultLabelMatches = null;
            this.sourceMatches = null;
            this.whenMatches = null;
            this.keybindingMatches = null;
            this.extensionIdMatches = null;
            this.extensionLabelMatches = null;
            if (!completeMatch) {
                this.commandIdMatches = this.matches(searchValue, keybindingItem.command, (0, filters_1.or)(filters_1.matchesWords, filters_1.matchesCamelCase), words);
                this.commandLabelMatches = keybindingItem.commandLabel ? this.matches(searchValue, keybindingItem.commandLabel, (word, wordToMatchAgainst) => (0, filters_1.matchesWords)(word, keybindingItem.commandLabel, true), words) : null;
                this.commandDefaultLabelMatches = keybindingItem.commandDefaultLabel ? this.matches(searchValue, keybindingItem.commandDefaultLabel, (word, wordToMatchAgainst) => (0, filters_1.matchesWords)(word, keybindingItem.commandDefaultLabel, true), words) : null;
                this.whenMatches = keybindingItem.when ? this.matches(null, keybindingItem.when, (0, filters_1.or)(filters_1.matchesWords, filters_1.matchesCamelCase), words) : null;
                if ((0, types_1.isString)(keybindingItem.source)) {
                    this.sourceMatches = this.matches(searchValue, keybindingItem.source, (word, wordToMatchAgainst) => (0, filters_1.matchesWords)(word, keybindingItem.source, true), words);
                }
                else {
                    this.extensionLabelMatches = keybindingItem.source.displayName ? this.matches(searchValue, keybindingItem.source.displayName, (word, wordToMatchAgainst) => (0, filters_1.matchesWords)(word, keybindingItem.commandLabel, true), words) : null;
                }
            }
            this.keybindingMatches = keybindingItem.keybinding ? this.matchesKeybinding(keybindingItem.keybinding, searchValue, keybindingWords, completeMatch) : null;
        }
        matches(searchValue, wordToMatchAgainst, wordMatchesFilter, words) {
            let matches = searchValue ? wordFilter(searchValue, wordToMatchAgainst) : null;
            if (!matches) {
                matches = this.matchesWords(words, wordToMatchAgainst, wordMatchesFilter);
            }
            if (matches) {
                matches = this.filterAndSort(matches);
            }
            return matches;
        }
        matchesWords(words, wordToMatchAgainst, wordMatchesFilter) {
            let matches = [];
            for (const word of words) {
                const wordMatches = wordMatchesFilter(word, wordToMatchAgainst);
                if (wordMatches) {
                    matches = [...(matches || []), ...wordMatches];
                }
                else {
                    matches = null;
                    break;
                }
            }
            return matches;
        }
        filterAndSort(matches) {
            return (0, arrays_1.distinct)(matches, (a => a.start + '.' + a.end)).filter(match => !matches.some(m => !(m.start === match.start && m.end === match.end) && (m.start <= match.start && m.end >= match.end))).sort((a, b) => a.start - b.start);
        }
        matchesKeybinding(keybinding, searchValue, words, completeMatch) {
            const [firstPart, chordPart] = keybinding.getChords();
            const userSettingsLabel = keybinding.getUserSettingsLabel();
            const ariaLabel = keybinding.getAriaLabel();
            const label = keybinding.getLabel();
            if ((userSettingsLabel && strings.compareIgnoreCase(searchValue, userSettingsLabel) === 0)
                || (ariaLabel && strings.compareIgnoreCase(searchValue, ariaLabel) === 0)
                || (label && strings.compareIgnoreCase(searchValue, label) === 0)) {
                return {
                    firstPart: this.createCompleteMatch(firstPart),
                    chordPart: this.createCompleteMatch(chordPart)
                };
            }
            const firstPartMatch = {};
            let chordPartMatch = {};
            const matchedWords = [];
            const firstPartMatchedWords = [];
            let chordPartMatchedWords = [];
            let matchFirstPart = true;
            for (let index = 0; index < words.length; index++) {
                const word = words[index];
                let firstPartMatched = false;
                let chordPartMatched = false;
                matchFirstPart = matchFirstPart && !firstPartMatch.keyCode;
                let matchChordPart = !chordPartMatch.keyCode;
                if (matchFirstPart) {
                    firstPartMatched = this.matchPart(firstPart, firstPartMatch, word, completeMatch);
                    if (firstPartMatch.keyCode) {
                        for (const cordPartMatchedWordIndex of chordPartMatchedWords) {
                            if (firstPartMatchedWords.indexOf(cordPartMatchedWordIndex) === -1) {
                                matchedWords.splice(matchedWords.indexOf(cordPartMatchedWordIndex), 1);
                            }
                        }
                        chordPartMatch = {};
                        chordPartMatchedWords = [];
                        matchChordPart = false;
                    }
                }
                if (matchChordPart) {
                    chordPartMatched = this.matchPart(chordPart, chordPartMatch, word, completeMatch);
                }
                if (firstPartMatched) {
                    firstPartMatchedWords.push(index);
                }
                if (chordPartMatched) {
                    chordPartMatchedWords.push(index);
                }
                if (firstPartMatched || chordPartMatched) {
                    matchedWords.push(index);
                }
                matchFirstPart = matchFirstPart && this.isModifier(word);
            }
            if (matchedWords.length !== words.length) {
                return null;
            }
            if (completeMatch) {
                if (!this.isCompleteMatch(firstPart, firstPartMatch)) {
                    return null;
                }
                if (!(0, types_1.isEmptyObject)(chordPartMatch) && !this.isCompleteMatch(chordPart, chordPartMatch)) {
                    return null;
                }
            }
            return this.hasAnyMatch(firstPartMatch) || this.hasAnyMatch(chordPartMatch) ? { firstPart: firstPartMatch, chordPart: chordPartMatch } : null;
        }
        matchPart(chord, match, word, completeMatch) {
            let matched = false;
            if (this.matchesMetaModifier(chord, word)) {
                matched = true;
                match.metaKey = true;
            }
            if (this.matchesCtrlModifier(chord, word)) {
                matched = true;
                match.ctrlKey = true;
            }
            if (this.matchesShiftModifier(chord, word)) {
                matched = true;
                match.shiftKey = true;
            }
            if (this.matchesAltModifier(chord, word)) {
                matched = true;
                match.altKey = true;
            }
            if (this.matchesKeyCode(chord, word, completeMatch)) {
                match.keyCode = true;
                matched = true;
            }
            return matched;
        }
        matchesKeyCode(chord, word, completeMatch) {
            if (!chord) {
                return false;
            }
            const ariaLabel = chord.keyAriaLabel || '';
            if (completeMatch || ariaLabel.length === 1 || word.length === 1) {
                if (strings.compareIgnoreCase(ariaLabel, word) === 0) {
                    return true;
                }
            }
            else {
                if ((0, filters_1.matchesContiguousSubString)(word, ariaLabel)) {
                    return true;
                }
            }
            return false;
        }
        matchesMetaModifier(chord, word) {
            if (!chord) {
                return false;
            }
            if (!chord.metaKey) {
                return false;
            }
            return this.wordMatchesMetaModifier(word);
        }
        matchesCtrlModifier(chord, word) {
            if (!chord) {
                return false;
            }
            if (!chord.ctrlKey) {
                return false;
            }
            return this.wordMatchesCtrlModifier(word);
        }
        matchesShiftModifier(chord, word) {
            if (!chord) {
                return false;
            }
            if (!chord.shiftKey) {
                return false;
            }
            return this.wordMatchesShiftModifier(word);
        }
        matchesAltModifier(chord, word) {
            if (!chord) {
                return false;
            }
            if (!chord.altKey) {
                return false;
            }
            return this.wordMatchesAltModifier(word);
        }
        hasAnyMatch(keybindingMatch) {
            return !!keybindingMatch.altKey ||
                !!keybindingMatch.ctrlKey ||
                !!keybindingMatch.metaKey ||
                !!keybindingMatch.shiftKey ||
                !!keybindingMatch.keyCode;
        }
        isCompleteMatch(chord, match) {
            if (!chord) {
                return true;
            }
            if (!match.keyCode) {
                return false;
            }
            if (chord.metaKey && !match.metaKey) {
                return false;
            }
            if (chord.altKey && !match.altKey) {
                return false;
            }
            if (chord.ctrlKey && !match.ctrlKey) {
                return false;
            }
            if (chord.shiftKey && !match.shiftKey) {
                return false;
            }
            return true;
        }
        createCompleteMatch(chord) {
            const match = {};
            if (chord) {
                match.keyCode = true;
                if (chord.metaKey) {
                    match.metaKey = true;
                }
                if (chord.altKey) {
                    match.altKey = true;
                }
                if (chord.ctrlKey) {
                    match.ctrlKey = true;
                }
                if (chord.shiftKey) {
                    match.shiftKey = true;
                }
            }
            return match;
        }
        isModifier(word) {
            if (this.wordMatchesAltModifier(word)) {
                return true;
            }
            if (this.wordMatchesCtrlModifier(word)) {
                return true;
            }
            if (this.wordMatchesMetaModifier(word)) {
                return true;
            }
            if (this.wordMatchesShiftModifier(word)) {
                return true;
            }
            return false;
        }
        wordMatchesAltModifier(word) {
            if (strings.equalsIgnoreCase(this.modifierLabels.ui.altKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.aria.altKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.user.altKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase((0, nls_1.localize)('option', "option"), word)) {
                return true;
            }
            return false;
        }
        wordMatchesCtrlModifier(word) {
            if (strings.equalsIgnoreCase(this.modifierLabels.ui.ctrlKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.aria.ctrlKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.user.ctrlKey, word)) {
                return true;
            }
            return false;
        }
        wordMatchesMetaModifier(word) {
            if (strings.equalsIgnoreCase(this.modifierLabels.ui.metaKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.aria.metaKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.user.metaKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase((0, nls_1.localize)('meta', "meta"), word)) {
                return true;
            }
            return false;
        }
        wordMatchesShiftModifier(word) {
            if (strings.equalsIgnoreCase(this.modifierLabels.ui.shiftKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.aria.shiftKey, word)) {
                return true;
            }
            if (strings.equalsIgnoreCase(this.modifierLabels.user.shiftKey, word)) {
                return true;
            }
            return false;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NFZGl0b3JNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3ByZWZlcmVuY2VzL2Jyb3dzZXIva2V5YmluZGluZ3NFZGl0b3JNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBb0JuRixRQUFBLDRCQUE0QixHQUFHLDJCQUEyQixDQUFDO0lBRXhFLE1BQU0sYUFBYSxHQUFHLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNwRCxNQUFNLGdCQUFnQixHQUFHLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM1RCxNQUFNLFdBQVcsR0FBRyxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFRN0MsTUFBTSxVQUFVLEdBQUcsSUFBQSxZQUFFLEVBQUMsdUJBQWEsRUFBRSxzQkFBWSxFQUFFLG9DQUEwQixDQUFDLENBQUM7SUFDL0UsTUFBTSxZQUFZLEdBQUcsNkNBQTZDLENBQUM7SUFDbkUsTUFBTSxlQUFlLEdBQUcsNEJBQTRCLENBQUM7SUFFOUMsSUFBTSxzQkFBc0IsOEJBQTVCLE1BQU0sc0JBQXVCLFNBQVEseUJBQVc7UUFNdEQsWUFDQyxFQUFtQixFQUNrQixrQkFBc0MsRUFDdkMsZ0JBQW1DO1lBRXZFLEtBQUssRUFBRSxDQUFDO1lBSDZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDdkMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUd2RSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxrQ0FBa0MsR0FBRyxFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLGNBQWMsR0FBRztnQkFDckIs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