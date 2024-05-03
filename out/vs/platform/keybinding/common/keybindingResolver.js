/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingResolver = exports.NoMatchingKb = exports.ResultKind = void 0;
    //#region resolution-result
    var ResultKind;
    (function (ResultKind) {
        /** No keybinding found this sequence of chords */
        ResultKind[ResultKind["NoMatchingKb"] = 0] = "NoMatchingKb";
        /** There're several keybindings that have the given sequence of chords as a prefix */
        ResultKind[ResultKind["MoreChordsNeeded"] = 1] = "MoreChordsNeeded";
        /** A single keybinding found to be dispatched/invoked */
        ResultKind[ResultKind["KbFound"] = 2] = "KbFound";
    })(ResultKind || (exports.ResultKind = ResultKind = {}));
    // util definitions to make working with the above types easier within this module:
    exports.NoMatchingKb = { kind: 0 /* ResultKind.NoMatchingKb */ };
    const MoreChordsNeeded = { kind: 1 /* ResultKind.MoreChordsNeeded */ };
    function KbFound(commandId, commandArgs, isBubble) {
        return { kind: 2 /* ResultKind.KbFound */, commandId, commandArgs, isBubble };
    }
    //#endregion
    /**
     * Stores mappings from keybindings to commands and from commands to keybindings.
     * Given a sequence of chords, `resolve`s which keybinding it matches
     */
    class KeybindingResolver {
        constructor(
        /** built-in and extension-provided keybindings */
        defaultKeybindings, 
        /** user's keybindings */
        overrides, log) {
            this._log = log;
            this._defaultKeybindings = defaultKeybindings;
            this._defaultBoundCommands = new Map();
            for (const defaultKeybinding of defaultKeybindings) {
                const command = defaultKeybinding.command;
                if (command && command.charAt(0) !== '-') {
                    this._defaultBoundCommands.set(command, true);
                }
            }
            this._map = new Map();
            this._lookupMap = new Map();
            this._keybindings = KeybindingResolver.handleRemovals([].concat(defaultKeybindings).concat(overrides));
            for (let i = 0, len = this._keybindings.length; i < len; i++) {
                const k = this._keybindings[i];
                if (k.chords.length === 0) {
                    // unbound
                    continue;
                }
                // substitute with constants that are registered after startup - https://github.com/microsoft/vscode/issues/174218#issuecomment-1437972127
                const when = k.when?.substituteConstants();
                if (when && when.type === 0 /* ContextKeyExprType.False */) {
                    // when condition is false
                    continue;
                }
                this._addKeyPress(k.chords[0], k);
            }
        }
        static _isTargetedForRemoval(defaultKb, keypress, when) {
            if (keypress) {
                for (let i = 0; i < keypress.length; i++) {
                    if (keypress[i] !== defaultKb.chords[i]) {
                        return false;
                    }
                }
            }
            // `true` means always, as does `undefined`
            // so we will treat `true` === `undefined`
            if (when && when.type !== 1 /* ContextKeyExprType.True */) {
                if (!defaultKb.when) {
                    return false;
                }
                if (!(0, contextkey_1.expressionsAreEqualWithConstantSubstitution)(when, defaultKb.when)) {
                    return false;
                }
            }
            return true;
        }
        /**
         * Looks for rules containing "-commandId" and removes them.
         */
        static handleRemovals(rules) {
            // Do a first pass and construct a hash-map for removals
            const removals = new Map();
            for (let i = 0, len = rules.length; i < len; i++) {
                const rule = rules[i];
                if (rule.command && rule.command.charAt(0) === '-') {
                    const command = rule.command.substring(1);
                    if (!removals.has(command)) {
                        removals.set(command, [rule]);
                    }
                    else {
                        removals.get(command).push(rule);
                    }
                }
            }
            if (removals.size === 0) {
                // There are no removals
                return rules;
            }
            // Do a second pass and keep only non-removed keybindings
            const result = [];
            for (let i = 0, len = rules.length; i < len; i++) {
                const rule = rules[i];
                if (!rule.command || rule.command.length === 0) {
                    result.push(rule);
                    continue;
                }
                if (rule.command.charAt(0) === '-') {
                    continue;
                }
                const commandRemovals = removals.get(rule.command);
                if (!commandRemovals || !rule.isDefault) {
                    result.push(rule);
                    continue;
                }
                let isRemoved = false;
                for (const commandRemoval of commandRemovals) {
                    const when = commandRemoval.when;
                    if (this._isTargetedForRemoval(rule, commandRemoval.chords, when)) {
                        isRemoved = true;
                        break;
                    }
                }
                if (!isRemoved) {
                    result.push(rule);
                    continue;
                }
            }
            return result;
        }
        _addKeyPress(keypress, item) {
            const conflicts = this._map.get(keypress);
            if (typeof conflicts === 'undefined') {
                // There is no conflict so far
                this._map.set(keypress, [item]);
                this._addToLookupMap(item);
                return;
            }
            for (let i = conflicts.length - 1; i >= 0; i--) {
                const conflict = conflicts[i];
                if (conflict.command === item.command) {
                    continue;
                }
                // Test if the shorter keybinding is a prefix of the longer one.
                // If the shorter keybinding is a prefix, it effectively will shadow the longer one and is considered a conflict.
                let isShorterKbPrefix = true;
                for (let i = 1; i < conflict.chords.length && i < item.chords.length; i++) {
                    if (conflict.chords[i] !== item.chords[i]) {
                        // The ith step does not conflict
                        isShorterKbPrefix = false;
                        break;
                    }
                }
                if (!isShorterKbPrefix) {
                    continue;
                }
                if (KeybindingResolver.whenIsEntirelyIncluded(conflict.when, item.when)) {
                    // `item` completely overwrites `conflict`
                    // Remove conflict from the lookupMap
                    this._removeFromLookupMap(conflict);
                }
            }
            conflicts.push(item);
            this._addToLookupMap(item);
        }
        _addToLookupMap(item) {
            if (!item.command) {
                return;
            }
            let arr = this._lookupMap.get(item.command);
            if (typeof arr === 'undefined') {
                arr = [item];
                this._lookupMap.set(item.command, arr);
            }
            else {
                arr.push(item);
            }
        }
        _removeFromLookupMap(item) {
            if (!item.command) {
                return;
            }
            const arr = this._lookupMap.get(item.command);
            if (typeof arr === 'undefined') {
                return;
            }
            for (let i = 0, len = arr.length; i < len; i++) {
                if (arr[i] === item) {
                    arr.splice(i, 1);
                    return;
                }
            }
        }
        /**
         * Returns true if it is provable `a` implies `b`.
         */
        static whenIsEntirelyIncluded(a, b) {
            if (!b || b.type === 1 /* ContextKeyExprType.True */) {
                return true;
            }
            if (!a || a.type === 1 /* ContextKeyExprType.True */) {
                return false;
            }
            return (0, contextkey_1.implies)(a, b);
        }
        getDefaultBoundCommands() {
            return this._defaultBoundCommands;
        }
        getDefaultKeybindings() {
            return this._defaultKeybindings;
        }
        getKeybindings() {
            return this._keybindings;
        }
        lookupKeybindings(commandId) {
            const items = this._lookupMap.get(commandId);
            if (typeof items === 'undefined' || items.length === 0) {
                return [];
            }
            // Reverse to get the most specific item first
            const result = [];
            let resultLen = 0;
            for (let i = items.length - 1; i >= 0; i--) {
                result[resultLen++] = items[i];
            }
            return result;
        }
        lookupPrimaryKeybinding(commandId, context) {
            const items = this._lookupMap.get(commandId);
            if (typeof items === 'undefined' || items.length === 0) {
                return null;
            }
            if (items.length === 1) {
                return items[0];
            }
            for (let i = items.length - 1; i >= 0; i--) {
                const item = items[i];
                if (context.contextMatchesRules(item.when)) {
                    return item;
                }
            }
            return items[items.length - 1];
        }
        /**
         * Looks up a keybinding trigged as a result of pressing a sequence of chords - `[...currentChords, keypress]`
         *
         * Example: resolving 3 chords pressed sequentially - `cmd+k cmd+p cmd+i`:
         * 	`currentChords = [ 'cmd+k' , 'cmd+p' ]` and `keypress = `cmd+i` - last pressed chord
         */
        resolve(context, currentChords, keypress) {
            const pressedChords = [...currentChords, keypress];
            this._log(`| Resolving ${pressedChords}`);
            const kbCandidates = this._map.get(pressedChords[0]);
            if (kbCandidates === undefined) {
                // No bindings with such 0-th chord
                this._log(`\\ No keybinding entries.`);
                return exports.NoMatchingKb;
            }
            let lookupMap = null;
            if (pressedChords.length < 2) {
                lookupMap = kbCandidates;
            }
            else {
                // Fetch all chord bindings for `currentChords`
                lookupMap = [];
                for (let i = 0, len = kbCandidates.length; i < len; i++) {
                    const candidate = kbCandidates[i];
                    if (pressedChords.length > candidate.chords.length) { // # of pressed chords can't be less than # of chords in a keybinding to invoke
                        continue;
                    }
                    let prefixMatches = true;
                    for (let i = 1; i < pressedChords.length; i++) {
                        if (candidate.chords[i] !== pressedChords[i]) {
                            prefixMatches = false;
                            break;
                        }
                    }
                    if (prefixMatches) {
                        lookupMap.push(candidate);
                    }
                }
            }
            // check there's a keybinding with a matching when clause
            const result = this._findCommand(context, lookupMap);
            if (!result) {
                this._log(`\\ From ${lookupMap.length} keybinding entries, no when clauses matched the context.`);
                return exports.NoMatchingKb;
            }
            // check we got all chords necessary to be sure a particular keybinding needs to be invoked
            if (pressedChords.length < result.chords.length) {
                // The chord sequence is not complete
                this._log(`\\ From ${lookupMap.length} keybinding entries, awaiting ${result.chords.length - pressedChords.length} more chord(s), when: ${printWhenExplanation(result.when)}, source: ${printSourceExplanation(result)}.`);
                return MoreChordsNeeded;
            }
            this._log(`\\ From ${lookupMap.length} keybinding entries, matched ${result.command}, when: ${printWhenExplanation(result.when)}, source: ${printSourceExplanation(result)}.`);
            return KbFound(result.command, result.commandArgs, result.bubble);
        }
        _findCommand(context, matches) {
            for (let i = matches.length - 1; i >= 0; i--) {
                const k = matches[i];
                if (!KeybindingResolver._contextMatchesRules(context, k.when)) {
                    continue;
                }
                return k;
            }
            return null;
        }
        static _contextMatchesRules(context, rules) {
            if (!rules) {
                return true;
            }
            return rules.evaluate(context);
        }
    }
    exports.KeybindingResolver = KeybindingResolver;
    function printWhenExplanation(when) {
        if (!when) {
            return `no when condition`;
        }
        return `${when.serialize()}`;
    }
    function printSourceExplanation(kb) {
        return (kb.extensionId
            ? (kb.isBuiltinExtension ? `built-in extension ${kb.extensionId}` : `user extension ${kb.extensionId}`)
            : (kb.isDefault ? `built-in` : `user`));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ1Jlc29sdmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9rZXliaW5kaW5nL2NvbW1vbi9rZXliaW5kaW5nUmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLDJCQUEyQjtJQUUzQixJQUFrQixVQVNqQjtJQVRELFdBQWtCLFVBQVU7UUFDM0Isa0RBQWtEO1FBQ2xELDJEQUFZLENBQUE7UUFFWixzRkFBc0Y7UUFDdEYsbUVBQWdCLENBQUE7UUFFaEIseURBQXlEO1FBQ3pELGlEQUFPLENBQUE7SUFDUixDQUFDLEVBVGlCLFVBQVUsMEJBQVYsVUFBVSxRQVMzQjtJQVFELG1GQUFtRjtJQUV0RSxRQUFBLFlBQVksR0FBcUIsRUFBRSxJQUFJLGlDQUF5QixFQUFFLENBQUM7SUFDaEYsTUFBTSxnQkFBZ0IsR0FBcUIsRUFBRSxJQUFJLHFDQUE2QixFQUFFLENBQUM7SUFDakYsU0FBUyxPQUFPLENBQUMsU0FBd0IsRUFBRSxXQUFnQixFQUFFLFFBQWlCO1FBQzdFLE9BQU8sRUFBRSxJQUFJLDRCQUFvQixFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLENBQUM7SUFDdkUsQ0FBQztJQUVELFlBQVk7SUFFWjs7O09BR0c7SUFDSCxNQUFhLGtCQUFrQjtRQVE5QjtRQUNDLGtEQUFrRDtRQUNsRCxrQkFBNEM7UUFDNUMseUJBQXlCO1FBQ3pCLFNBQW1DLEVBQ25DLEdBQTBCO1lBRTFCLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ2hCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQztZQUU5QyxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxHQUFHLEVBQW1CLENBQUM7WUFDeEQsS0FBSyxNQUFNLGlCQUFpQixJQUFJLGtC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