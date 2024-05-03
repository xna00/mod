/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/ime", "vs/base/common/lifecycle", "vs/nls", "vs/platform/keybinding/common/keybindingResolver"], function (require, exports, arrays, async_1, errors_1, event_1, ime_1, lifecycle_1, nls, keybindingResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractKeybindingService = void 0;
    const HIGH_FREQ_COMMANDS = /^(cursor|delete|undo|redo|tab|editor\.action\.clipboard)/;
    class AbstractKeybindingService extends lifecycle_1.Disposable {
        get onDidUpdateKeybindings() {
            return this._onDidUpdateKeybindings ? this._onDidUpdateKeybindings.event : event_1.Event.None; // Sinon stubbing walks properties on prototype
        }
        get inChordMode() {
            return this._currentChords.length > 0;
        }
        constructor(_contextKeyService, _commandService, _telemetryService, _notificationService, _logService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._commandService = _commandService;
            this._telemetryService = _telemetryService;
            this._notificationService = _notificationService;
            this._logService = _logService;
            this._onDidUpdateKeybindings = this._register(new event_1.Emitter());
            this._currentChords = [];
            this._currentChordChecker = new async_1.IntervalTimer();
            this._currentChordStatusMessage = null;
            this._ignoreSingleModifiers = KeybindingModifierSet.EMPTY;
            this._currentSingleModifier = null;
            this._currentSingleModifierClearTimeout = new async_1.TimeoutTimer();
            this._currentlyDispatchingCommandId = null;
            this._logging = false;
        }
        dispose() {
            super.dispose();
        }
        getDefaultKeybindingsContent() {
            return '';
        }
        toggleLogging() {
            this._logging = !this._logging;
            return this._logging;
        }
        _log(str) {
            if (this._logging) {
                this._logService.info(`[KeybindingService]: ${str}`);
            }
        }
        getDefaultKeybindings() {
            return this._getResolver().getDefaultKeybindings();
        }
        getKeybindings() {
            return this._getResolver().getKeybindings();
        }
        customKeybindingsCount() {
            return 0;
        }
        lookupKeybindings(commandId) {
            return arrays.coalesce(this._getResolver().lookupKeybindings(commandId).map(item => item.resolvedKeybinding));
        }
        lookupKeybinding(commandId, context) {
            const result = this._getResolver().lookupPrimaryKeybinding(commandId, context || this._contextKeyService);
            if (!result) {
                return undefined;
            }
            return result.resolvedKeybinding;
        }
        dispatchEvent(e, target) {
            return this._dispatch(e, target);
        }
        // TODO@ulugbekna: update namings to align with `_doDispatch`
        // TODO@ulugbekna: this fn doesn't seem to take into account single-modifier keybindings, eg `shift shift`
        softDispatch(e, target) {
            this._log(`/ Soft dispatching keyboard event`);
            const keybinding = this.resolveKeyboardEvent(e);
            if (keybinding.hasMultipleChords()) {
                console.warn('keyboard event should not be mapped to multiple chords');
                return keybindingResolver_1.NoMatchingKb;
            }
            const [firstChord,] = keybinding.getDispatchChords();
            if (firstChord === null) {
                // cannot be dispatched, probably only modifier keys
                this._log(`\\ Keyboard event cannot be dispatched`);
                return keybindingResolver_1.NoMatchingKb;
            }
            const contextValue = this._contextKeyService.getContext(target);
            const currentChords = this._currentChords.map((({ keypress }) => keypress));
            return this._getResolver().resolve(contextValue, currentChords, firstChord);
        }
        _scheduleLeaveChordMode() {
            const chordLastInteractedTime = Date.now();
            this._currentChordChecker.cancelAndSet(() => {
                if (!this._documentHasFocus()) {
                    // Focus has been lost => leave chord mode
                    this._leaveChordMode();
                    return;
                }
                if (Date.now() - chordLastInteractedTime > 5000) {
                    // 5 seconds elapsed => leave chord mode
                    this._leaveChordMode();
                }
            }, 500);
        }
        _expectAnotherChord(firstChord, keypressLabel) {
            this._currentChords.push({ keypress: firstChord, label: keypressLabel });
            switch (this._currentChords.length) {
                case 0:
                    throw (0, errors_1.illegalState)('impossible');
                case 1:
                    // TODO@ulugbekna: revise this message and the one below (at least, fix terminology)
                    this._currentChordStatusMessage = this._notificationService.status(nls.localize('first.chord', "({0}) was pressed. Waiting for second key of chord...", keypressLabel));
                    break;
                default: {
                    const fullKeypressLabel = this._currentChords.map(({ label }) => label).join(', ');
                    this._currentChordStatusMessage = this._notificationService.status(nls.localize('next.chord', "({0}) was pressed. Waiting for next key of chord...", fullKeypressLabel));
                }
            }
            this._scheduleLeaveChordMode();
            if (ime_1.IME.enabled) {
                ime_1.IME.disable();
            }
        }
        _leaveChordMode() {
            if (this._currentChordStatusMessage) {
                this._currentChordStatusMessage.dispose();
                this._currentChordStatusMessage = null;
            }
            this._currentChordChecker.cancel();
            this._currentChords = [];
            ime_1.IME.enable();
        }
        dispatchByUserSettingsLabel(userSettingsLabel, target) {
            this._log(`/ Dispatching keybinding triggered via menu entry accelerator - ${userSettingsLabel}`);
            const keybindings = this.resolveUserBinding(userSettingsLabel);
            if (keybindings.length === 0) {
                this._log(`\\ Could not resolve - ${userSettingsLabel}`);
            }
            else {
                this._doDispatch(keybindings[0], target, /*isSingleModiferChord*/ false);
            }
        }
        _dispatch(e, target) {
            return this._doDispatch(this.resolveKeyboardEvent(e), target, /*isSingleModiferChord*/ false);
        }
        _singleModifierDispatch(e, target) {
            const keybinding = this.resolveKeyboardEvent(e);
            const [singleModifier,] = keybinding.getSingleModifierDispatchChords();
            if (singleModifier) {
                if (this._ignoreSingleModifiers.has(singleModifier)) {
                    this._log(`+ Ignoring single modifier ${singleModifier} due to it being pressed together with other keys.`);
                    this._ignoreSingleModifiers = KeybindingModifierSet.EMPTY;
                    this._currentSingleModifierClearTimeout.cancel();
                    this._currentSingleModifier = null;
                    return false;
                }
                this._ignoreSingleModifiers = KeybindingModifierSet.EMPTY;
                if (this._currentSingleModifier === null) {
                    // we have a valid `singleModifier`, store it for the next keyup, but clear it in 300ms
                    this._log(`+ Storing single modifier for possible chord ${singleModifier}.`);
                    this._currentSingleModifier = singleModifier;
                    this._currentSingleModifierClearTimeout.cancelAndSet(() => {
                        this._log(`+ Clearing single modifier due to 300ms elapsed.`);
                        this._currentSingleModifier = null;
                    }, 300);
                    return false;
                }
                if (singleModifier === this._currentSingleModifier) {
                    // bingo!
                    this._log(`/ Dispatching single modifier chord ${singleModifier} ${singleModifier}`);
                    this._currentSingleModifierClearTimeout.cancel();
                    this._currentSingleModifier = null;
                    return this._doDispatch(keybinding, target, /*isSingleModiferChord*/ true);
                }
                this._log(`+ Clearing single modifier due to modifier mismatch: ${this._currentSingleModifier} ${singleModifier}`);
                this._currentSingleModifierClearTimeout.cancel();
                this._currentSingleModifier = null;
                return false;
            }
            // When pressing a modifier and holding it pressed with any other modifier or key combination,
            // the pressed modifiers should no longer be considered for single modifier dispatch.
            const [firstChord,] = keybinding.getChords();
            this._ignoreSingleModifiers = new KeybindingModifierSet(firstChord);
            if (this._currentSingleModifier !== null) {
                this._log(`+ Clearing single modifier due to other key up.`);
            }
            this._currentSingleModifierClearTimeout.cancel();
            this._currentSingleModifier = null;
            return false;
        }
        _doDispatch(userKeypress, target, isSingleModiferChord = false) {
            let shouldPreventDefault = false;
            if (userKeypress.hasMultipleChords()) { // warn - because user can press a single chord at a time
                console.warn('Unexpected keyboard event mapped to multiple chords');
                return false;
            }
            let userPressedChord = null;
            let currentChords = null;
            if (isSingleModiferChord) {
                // The keybinding is the second keypress of a single modifier chord, e.g. "shift shift".
                // A single modifier can only occur when the same modifier is pressed in short sequence,
                // hence we disregard `_currentChord` and use the same modifier instead.
                const [dispatchKeyname,] = userKeypress.getSingleModifierDispatchChords();
                userPressedChord = dispatchKeyname;
                currentChords = dispatchKeyname ? [dispatchKeyname] : []; // TODO@ulugbekna: in the `else` case we assign an empty array - make sure `resolve` can handle an empty array well
            }
            else {
                [userPressedChord,] = userKeypress.getDispatchChords();
                currentChords = this._currentChords.map(({ keypress }) => keypress);
            }
            if (userPressedChord === null) {
                this._log(`\\ Keyboard event cannot be dispatched in keydown phase.`);
                // cannot be dispatched, probably only modifier keys
                return shouldPreventDefault;
            }
            const contextValue = this._contextKeyService.getContext(target);
            const keypressLabel = userKeypress.getLabel();
            const resolveResult = this._getResolver().resolve(contextValue, currentChords, userPressedChord);
            switch (resolveResult.kind) {
                case 0 /* ResultKind.NoMatchingKb */: {
                    this._logService.trace('KeybindingService#dispatch', keypressLabel, `[ No matching keybinding ]`);
                    if (this.inChordMode) {
                        const currentChordsLabel = this._currentChords.map(({ label }) => label).join(', ');
                        this._log(`+ Leaving multi-chord mode: Nothing bound to "${currentChordsLabel}, ${keypressLabel}".`);
                        this._notificationService.status(nls.localize('missing.chord', "The key combination ({0}, {1}) is not a command.", currentChordsLabel, keypressLabel), { hideAfter: 10 * 1000 /* 10s */ });
                        this._leaveChordMode();
                        shouldPreventDefault = true;
                    }
                    return shouldPreventDefault;
                }
                case 1 /* ResultKind.MoreChordsNeeded */: {
                    this._logService.trace('KeybindingService#dispatch', keypressLabel, `[ Several keybindings match - more chords needed ]`);
                    shouldPreventDefault = true;
                    this._expectAnotherChord(userPressedChord, keypressLabel);
                    this._log(this._currentChords.length === 1 ? `+ Entering multi-chord mode...` : `+ Continuing multi-chord mode...`);
                    return shouldPreventDefault;
                }
                case 2 /* ResultKind.KbFound */: {
                    this._logService.trace('KeybindingService#dispatch', keypressLabel, `[ Will dispatch command ${resolveResult.commandId} ]`);
                    if (resolveResult.commandId === null || resolveResult.commandId === '') {
                        if (this.inChordMode) {
                            const currentChordsLabel = this._currentChords.map(({ label }) => label).join(', ');
                            this._log(`+ Leaving chord mode: Nothing bound to "${currentChordsLabel}, ${keypressLabel}".`);
                            this._notificationService.status(nls.localize('missing.chord', "The key combination ({0}, {1}) is not a command.", currentChordsLabel, keypressLabel), { hideAfter: 10 * 1000 /* 10s */ });
                            this._leaveChordMode();
                            shouldPreventDefault = true;
                        }
                    }
                    else {
                        if (this.inChordMode) {
                            this._leaveChordMode();
                        }
                        if (!resolveResult.isBubble) {
                            shouldPreventDefault = true;
                        }
                        this._log(`+ Invoking command ${resolveResult.commandId}.`);
                        this._currentlyDispatchingCommandId = resolveResult.commandId;
                        try {
                            if (typeof resolveResult.commandArgs === 'undefined') {
                                this._commandService.executeCommand(resolveResult.commandId).then(undefined, err => this._notificationService.warn(err));
                            }
                            else {
                                this._commandService.executeCommand(resolveResult.commandId, resolveResult.commandArgs).then(undefined, err => this._notificationService.warn(err));
                            }
                        }
                        finally {
                            this._currentlyDispatchingCommandId = null;
                        }
                        if (!HIGH_FREQ_COMMANDS.test(resolveResult.commandId)) {
                            this._telemetryService.publicLog2('workbenchActionExecuted', { id: resolveResult.commandId, from: 'keybinding', detail: userKeypress.getUserSettingsLabel() ?? undefined });
                        }
                    }
                    return shouldPreventDefault;
                }
            }
        }
        mightProducePrintableCharacter(event) {
            if (event.ctrlKey || event.metaKey) {
                // ignore ctrl/cmd-combination but not shift/alt-combinatios
                return false;
            }
            // weak check for certain ranges. this is properly implemented in a subclass
            // with access to the KeyboardMapperFactory.
            if ((event.keyCode >= 31 /* KeyCode.KeyA */ && event.keyCode <= 56 /* KeyCode.KeyZ */)
                || (event.keyCode >= 21 /* KeyCode.Digit0 */ && event.keyCode <= 30 /* KeyCode.Digit9 */)) {
                return true;
            }
            return false;
        }
    }
    exports.AbstractKeybindingService = AbstractKeybindingService;
    class KeybindingModifierSet {
        static { this.EMPTY = new KeybindingModifierSet(null); }
        constructor(source) {
            this._ctrlKey = source ? source.ctrlKey : false;
            this._shiftKey = source ? source.shiftKey : false;
            this._altKey = source ? source.altKey : false;
            this._metaKey = source ? source.metaKey : false;
        }
        has(modifier) {
            switch (modifier) {
                case 'ctrl': return this._ctrlKey;
                case 'shift': return this._shiftKey;
                case 'alt': return this._altKey;
                case 'meta': return this._metaKey;
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RLZXliaW5kaW5nU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0va2V5YmluZGluZy9jb21tb24vYWJzdHJhY3RLZXliaW5kaW5nU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEyQmhHLE1BQU0sa0JBQWtCLEdBQUcsMERBQTBELENBQUM7SUFFdEYsTUFBc0IseUJBQTBCLFNBQVEsc0JBQVU7UUFLakUsSUFBSSxzQkFBc0I7WUFDekIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQywrQ0FBK0M7UUFDdkksQ0FBQztRQW9CRCxJQUFXLFdBQVc7WUFDckIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVELFlBQ1Msa0JBQXNDLEVBQ3BDLGVBQWdDLEVBQ2hDLGlCQUFvQyxFQUN0QyxvQkFBMEMsRUFDeEMsV0FBd0I7WUFFbEMsS0FBSyxFQUFFLENBQUM7WUFOQSx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3BDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNoQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ3RDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDeEMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFoQ2hCLDRCQUF1QixHQUFrQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQW9DL0YsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUks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