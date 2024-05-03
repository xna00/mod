/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/keybindings", "vs/base/common/platform", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/usLayoutResolvedKeybinding"], function (require, exports, event_1, keybindings_1, platform_1, keybindingResolver_1, usLayoutResolvedKeybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockKeybindingService = exports.MockScopableContextKeyService = exports.MockContextKeyService = void 0;
    class MockKeybindingContextKey {
        constructor(defaultValue) {
            this._defaultValue = defaultValue;
            this._value = this._defaultValue;
        }
        set(value) {
            this._value = value;
        }
        reset() {
            this._value = this._defaultValue;
        }
        get() {
            return this._value;
        }
    }
    class MockContextKeyService {
        constructor() {
            this._keys = new Map();
        }
        dispose() {
            //
        }
        createKey(key, defaultValue) {
            const ret = new MockKeybindingContextKey(defaultValue);
            this._keys.set(key, ret);
            return ret;
        }
        contextMatchesRules(rules) {
            return false;
        }
        get onDidChangeContext() {
            return event_1.Event.None;
        }
        bufferChangeEvents(callback) { callback(); }
        getContextKeyValue(key) {
            const value = this._keys.get(key);
            if (value) {
                return value.get();
            }
        }
        getContext(domNode) {
            return null;
        }
        createScoped(domNode) {
            return this;
        }
        createOverlay() {
            return this;
        }
        updateParent(_parentContextKeyService) {
            // no-op
        }
    }
    exports.MockContextKeyService = MockContextKeyService;
    class MockScopableContextKeyService extends MockContextKeyService {
        /**
         * Don't implement this for all tests since we rarely depend on this behavior and it isn't implemented fully
         */
        createScoped(domNote) {
            return new MockScopableContextKeyService();
        }
    }
    exports.MockScopableContextKeyService = MockScopableContextKeyService;
    class MockKeybindingService {
        constructor() {
            this.inChordMode = false;
        }
        get onDidUpdateKeybindings() {
            return event_1.Event.None;
        }
        getDefaultKeybindingsContent() {
            return '';
        }
        getDefaultKeybindings() {
            return [];
        }
        getKeybindings() {
            return [];
        }
        resolveKeybinding(keybinding) {
            return usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveKeybinding(keybinding, platform_1.OS);
        }
        resolveKeyboardEvent(keyboardEvent) {
            const chord = new keybindings_1.KeyCodeChord(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode);
            return this.resolveKeybinding(chord.toKeybinding())[0];
        }
        resolveUserBinding(userBinding) {
            return [];
        }
        lookupKeybindings(commandId) {
            return [];
        }
        lookupKeybinding(commandId) {
            return undefined;
        }
        customKeybindingsCount() {
            return 0;
        }
        softDispatch(keybinding, target) {
            return keybindingResolver_1.NoMatchingKb;
        }
        dispatchByUserSettingsLabel(userSettingsLabel, target) {
        }
        dispatchEvent(e, target) {
            return false;
        }
        enableKeybindingHoldMode(commandId) {
            return undefined;
        }
        mightProducePrintableCharacter(e) {
            return false;
        }
        toggleLogging() {
            return false;
        }
        _dumpDebugInfo() {
            return '';
        }
        _dumpDebugInfoJSON() {
            return '';
        }
        registerSchemaContribution() {
            // noop
        }
    }
    exports.MockKeybindingService = MockKeybindingService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0tleWJpbmRpbmdTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9rZXliaW5kaW5nL3Rlc3QvY29tbW9uL21vY2tLZXliaW5kaW5nU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBTSx3QkFBd0I7UUFJN0IsWUFBWSxZQUEyQjtZQUN0QyxJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztZQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDbEMsQ0FBQztRQUVNLEdBQUcsQ0FBQyxLQUFvQjtZQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNyQixDQUFDO1FBRU0sS0FBSztZQUNYLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUNsQyxDQUFDO1FBRU0sR0FBRztZQUNULE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO0tBQ0Q7SUFFRCxNQUFhLHFCQUFxQjtRQUFsQztZQUdTLFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBNEIsQ0FBQztRQW1DckQsQ0FBQztRQWpDTyxPQUFPO1lBQ2IsRUFBRTtRQUNILENBQUM7UUFDTSxTQUFTLENBQThDLEdBQVcsRUFBRSxZQUEyQjtZQUNyRyxNQUFNLEdBQUcsR0FBRyxJQUFJLHdCQUF3QixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6QixPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7UUFDTSxtQkFBbUIsQ0FBQyxLQUEyQjtZQUNyRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDRCxJQUFXLGtCQUFr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