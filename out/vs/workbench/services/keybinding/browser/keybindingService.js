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
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/browser/canIUse", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/common/async", "vs/base/common/event", "vs/base/common/json", "vs/base/common/keybindingLabels", "vs/base/common/keybindingParser", "vs/base/common/keybindings", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/resources", "vs/base/browser/window", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/keybinding/common/abstractKeybindingService", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keyboardLayout/common/keyboardLayout", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/action/common/action", "vs/workbench/services/actions/common/menusExtensionPoint", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/host/browser/host", "vs/workbench/services/keybinding/browser/unboundCommands", "vs/workbench/services/keybinding/common/keybindingIO", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, nls, browser, canIUse_1, dom, keyboardEvent_1, async_1, event_1, json_1, keybindingLabels_1, keybindingParser_1, keybindings_1, keyCodes_1, lifecycle_1, objects, platform_1, resources_1, window_1, actions_1, commands_1, contextkey_1, files_1, extensions_1, jsonContributionRegistry_1, abstractKeybindingService_1, keybinding_1, keybindingResolver_1, keybindingsRegistry_1, resolvedKeybindingItem_1, keyboardLayout_1, log_1, notification_1, platform_2, telemetry_1, uriIdentity_1, action_1, menusExtensionPoint_1, extensions_2, extensionsRegistry_1, host_1, unboundCommands_1, keybindingIO_1, userDataProfile_1) {
    "use strict";
    var WorkbenchKeybindingService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchKeybindingService = void 0;
    function isValidContributedKeyBinding(keyBinding, rejects) {
        if (!keyBinding) {
            rejects.push(nls.localize('nonempty', "expected non-empty value."));
            return false;
        }
        if (typeof keyBinding.command !== 'string') {
            rejects.push(nls.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'command'));
            return false;
        }
        if (keyBinding.key && typeof keyBinding.key !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'key'));
            return false;
        }
        if (keyBinding.when && typeof keyBinding.when !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
            return false;
        }
        if (keyBinding.mac && typeof keyBinding.mac !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'mac'));
            return false;
        }
        if (keyBinding.linux && typeof keyBinding.linux !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'linux'));
            return false;
        }
        if (keyBinding.win && typeof keyBinding.win !== 'string') {
            rejects.push(nls.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'win'));
            return false;
        }
        return true;
    }
    const keybindingType = {
        type: 'object',
        default: { command: '', key: '' },
        properties: {
            command: {
                description: nls.localize('vscode.extension.contributes.keybindings.command', 'Identifier of the command to run when keybinding is triggered.'),
                type: 'string'
            },
            args: {
                description: nls.localize('vscode.extension.contributes.keybindings.args', "Arguments to pass to the command to execute.")
            },
            key: {
                description: nls.localize('vscode.extension.contributes.keybindings.key', 'Key or key sequence (separate keys with plus-sign and sequences with space, e.g. Ctrl+O and Ctrl+L L for a chord).'),
                type: 'string'
            },
            mac: {
                description: nls.localize('vscode.extension.contributes.keybindings.mac', 'Mac specific key or key sequence.'),
                type: 'string'
            },
            linux: {
                description: nls.localize('vscode.extension.contributes.keybindings.linux', 'Linux specific key or key sequence.'),
                type: 'string'
            },
            win: {
                description: nls.localize('vscode.extension.contributes.keybindings.win', 'Windows specific key or key sequence.'),
                type: 'string'
            },
            when: {
                description: nls.localize('vscode.extension.contributes.keybindings.when', 'Condition when the key is active.'),
                type: 'string'
            },
        }
    };
    const keybindingsExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'keybindings',
        deps: [menusExtensionPoint_1.commandsExtensionPoint],
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.keybindings', "Contributes keybindings."),
            oneOf: [
                keybindingType,
                {
                    type: 'array',
                    items: keybindingType
                }
            ]
        }
    });
    const NUMPAD_PRINTABLE_SCANCODES = [
        90 /* ScanCode.NumpadDivide */,
        91 /* ScanCode.NumpadMultiply */,
        92 /* ScanCode.NumpadSubtract */,
        93 /* ScanCode.NumpadAdd */,
        95 /* ScanCode.Numpad1 */,
        96 /* ScanCode.Numpad2 */,
        97 /* ScanCode.Numpad3 */,
        98 /* ScanCode.Numpad4 */,
        99 /* ScanCode.Numpad5 */,
        100 /* ScanCode.Numpad6 */,
        101 /* ScanCode.Numpad7 */,
        102 /* ScanCode.Numpad8 */,
        103 /* ScanCode.Numpad9 */,
        104 /* ScanCode.Numpad0 */,
        105 /* ScanCode.NumpadDecimal */
    ];
    const otherMacNumpadMapping = new Map();
    otherMacNumpadMapping.set(95 /* ScanCode.Numpad1 */, 22 /* KeyCode.Digit1 */);
    otherMacNumpadMapping.set(96 /* ScanCode.Numpad2 */, 23 /* KeyCode.Digit2 */);
    otherMacNumpadMapping.set(97 /* ScanCode.Numpad3 */, 24 /* KeyCode.Digit3 */);
    otherMacNumpadMapping.set(98 /* ScanCode.Numpad4 */, 25 /* KeyCode.Digit4 */);
    otherMacNumpadMapping.set(99 /* ScanCode.Numpad5 */, 26 /* KeyCode.Digit5 */);
    otherMacNumpadMapping.set(100 /* ScanCode.Numpad6 */, 27 /* KeyCode.Digit6 */);
    otherMacNumpadMapping.set(101 /* ScanCode.Numpad7 */, 28 /* KeyCode.Digit7 */);
    otherMacNumpadMapping.set(102 /* ScanCode.Numpad8 */, 29 /* KeyCode.Digit8 */);
    otherMacNumpadMapping.set(103 /* ScanCode.Numpad9 */, 30 /* KeyCode.Digit9 */);
    otherMacNumpadMapping.set(104 /* ScanCode.Numpad0 */, 21 /* KeyCode.Digit0 */);
    let WorkbenchKeybindingService = WorkbenchKeybindingService_1 = class WorkbenchKeybindingService extends abstractKeybindingService_1.AbstractKeybindingService {
        constructor(contextKeyService, commandService, telemetryService, notificationService, userDataProfileService, hostService, extensionService, fileService, uriIdentityService, logService, keyboardLayoutService) {
            super(contextKeyService, commandService, telemetryService, notificationService, logService);
            this.hostService = hostService;
            this.keyboardLayoutService = keyboardLayoutService;
            this._contributions = [];
            this.isComposingGlobalContextKey = contextKeyService.createKey('isComposing', false);
            this.kbsJsonSchema = new KeybindingsJsonSchema();
            this.updateKeybindingsJsonSchema();
            this._keyboardMapper = this.keyboardLayoutService.getKeyboardMapper();
            this._register(this.keyboardLayoutService.onDidChangeKeyboardLayout(() => {
                this._keyboardMapper = this.keyboardLayoutService.getKeyboardMapper();
                this.updateResolver();
            }));
            this._keybindingHoldMode = null;
            this._cachedResolver = null;
            this.userKeybindings = this._register(new UserKeybindings(userDataProfileService, uriIdentityService, fileService, logService));
            this.userKeybindings.initialize().then(() => {
                if (this.userKeybindings.keybindings.length) {
                    this.updateResolver();
                }
            });
            this._register(this.userKeybindings.onDidChange(() => {
                logService.debug('User keybindings changed');
                this.updateResolver();
            }));
            keybindingsExtPoint.setHandler((extensions) => {
                const keybindings = [];
                for (const extension of extensions) {
                    this._handleKeybindingsExtensionPointUser(extension.description.identifier, extension.description.isBuiltin, extension.value, extension.collector, keybindings);
                }
                keybindingsRegistry_1.KeybindingsRegistry.setExtensionKeybindings(keybindings);
                this.updateResolver();
            });
            this.updateKeybindingsJsonSchema();
            this._register(extensionService.onDidRegisterExtensions(() => this.updateKeybindingsJsonSchema()));
            this._register(event_1.Event.runAndSubscribe(dom.onDidRegisterWindow, ({ window, disposables }) => disposables.add(this._registerKeyListeners(window)), { window: window_1.mainWindow, disposables: this._store }));
            this._register(browser.onDidChangeFullscreen(windowId => {
                if (windowId !== window_1.mainWindow.vscodeWindowId) {
                    return;
                }
                const keyboard = navigator.keyboard;
                if (canIUse_1.BrowserFeatures.keyboard === 2 /* KeyboardSupport.None */) {
                    return;
                }
                if (browser.isFullscreen(window_1.mainWindow)) {
                    keyboard?.lock(['Escape']);
                }
                else {
                    keyboard?.unlock();
                }
                // update resolver which will bring back all unbound keyboard shortcuts
                this._cachedResolver = null;
                this._onDidUpdateKeybindings.fire();
            }));
        }
        _registerKeyListeners(window) {
            const disposables = new lifecycle_1.DisposableStore();
            // for standard keybindings
            disposables.add(dom.addDisposableListener(window, dom.EventType.KEY_DOWN, (e) => {
                if (this._keybindingHoldMode) {
                    return;
                }
                this.isComposingGlobalContextKey.set(e.isComposing);
                const keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                this._log(`/ Received  keydown event - ${(0, keyboardEvent_1.printKeyboardEvent)(e)}`);
                this._log(`| Converted keydown event - ${(0, keyboardEvent_1.printStandardKeyboardEvent)(keyEvent)}`);
                const shouldPreventDefault = this._dispatch(keyEvent, keyEvent.target);
                if (shouldPreventDefault) {
                    keyEvent.preventDefault();
                }
                this.isComposingGlobalContextKey.set(false);
            }));
            // for single modifier chord keybindings (e.g. shift shift)
            disposables.add(dom.addDisposableListener(window, dom.EventType.KEY_UP, (e) => {
                this._resetKeybindingHoldMode();
                this.isComposingGlobalContextKey.set(e.isComposing);
                const keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                const shouldPreventDefault = this._singleModifierDispatch(keyEvent, keyEvent.target);
                if (shouldPreventDefault) {
                    keyEvent.preventDefault();
                }
                this.isComposingGlobalContextKey.set(false);
            }));
            return disposables;
        }
        registerSchemaContribution(contribution) {
            this._contributions.push(contribution);
            if (contribution.onDidChange) {
                this._register(contribution.onDidChange(() => this.updateKeybindingsJsonSchema()));
            }
            this.updateKeybindingsJsonSchema();
        }
        updateKeybindingsJsonSchema() {
            this.kbsJsonSchema.updateSchema(this._contributions.flatMap(x => x.getSchemaAdditions()));
        }
        _printKeybinding(keybinding) {
            return keybindingLabels_1.UserSettingsLabelProvider.toLabel(platform_1.OS, keybinding.chords, (chord) => {
                if (chord instanceof keybindings_1.KeyCodeChord) {
                    return keyCodes_1.KeyCodeUtils.toString(chord.keyCode);
                }
                return keyCodes_1.ScanCodeUtils.toString(chord.scanCode);
            }) || '[null]';
        }
        _printResolvedKeybinding(resolvedKeybinding) {
            return resolvedKeybinding.getDispatchChords().map(x => x || '[null]').join(' ');
        }
        _printResolvedKeybindings(output, input, resolvedKeybindings) {
            const padLength = 35;
            const firstRow = `${input.padStart(padLength, ' ')} => `;
            if (resolvedKeybindings.length === 0) {
                // no binding found
                output.push(`${firstRow}${'[NO BINDING]'.padStart(padLength, ' ')}`);
                return;
            }
            const firstRowIndentation = firstRow.length;
            const isFirst = true;
            for (const resolvedKeybinding of resolvedKeybindings) {
                if (isFirst) {
                    output.push(`${firstRow}${this._printResolvedKeybinding(resolvedKeybinding).padStart(padLength, ' ')}`);
                }
                else {
                    output.push(`${' '.repeat(firstRowIndentation)}${this._printResolvedKeybinding(resolvedKeybinding).padStart(padLength, ' ')}`);
                }
            }
        }
        _dumpResolveKeybindingDebugInfo() {
            const seenBindings = new Set();
            const result = [];
            result.push(`Default Resolved Keybindings (unique only):`);
            for (const item of keybindingsRegistry_1.KeybindingsRegistry.getDefaultKeybindings()) {
                if (!item.keybinding) {
                    continue;
                }
                const input = this._printKeybinding(item.keybinding);
                if (seenBindings.has(input)) {
                    continue;
                }
                seenBindings.add(input);
                const resolvedKeybindings = this._keyboardMapper.resolveKeybinding(item.keybinding);
                this._printResolvedKeybindings(result, input, resolvedKeybindings);
            }
            result.push(`User Resolved Keybindings (unique only):`);
            for (const item of this.userKeybindings.keybindings) {
                if (!item.keybinding) {
                    continue;
                }
                const input = item._sourceKey ?? 'Impossible: missing source key, but has keybinding';
                if (seenBindings.has(input)) {
                    continue;
                }
                seenBindings.add(input);
                const resolvedKeybindings = this._keyboardMapper.resolveKeybinding(item.keybinding);
                this._printResolvedKeybindings(result, input, resolvedKeybindings);
            }
            return result.join('\n');
        }
        _dumpDebugInfo() {
            const layoutInfo = JSON.stringify(this.keyboardLayoutService.getCurrentKeyboardLayout(), null, '\t');
            const mapperInfo = this._keyboardMapper.dumpDebugInfo();
            const resolvedKeybindings = this._dumpResolveKeybindingDebugInfo();
            const rawMapping = JSON.stringify(this.keyboardLayoutService.getRawKeyboardMapping(), null, '\t');
            return `Layout info:\n${layoutInfo}\n\n${resolvedKeybindings}\n\n${mapperInfo}\n\nRaw mapping:\n${rawMapping}`;
        }
        _dumpDebugInfoJSON() {
            const info = {
                layout: this.keyboardLayoutService.getCurrentKeyboardLayout(),
                rawMapping: this.keyboardLayoutService.getRawKeyboardMapping()
            };
            return JSON.stringify(info, null, '\t');
        }
        enableKeybindingHoldMode(commandId) {
            if (this._currentlyDispatchingCommandId !== commandId) {
                return undefined;
            }
            this._keybindingHoldMode = new async_1.DeferredPromise();
            const focusTracker = dom.trackFocus(dom.getWindow(undefined));
            const listener = focusTracker.onDidBlur(() => this._resetKeybindingHoldMode());
            this._keybindingHoldMode.p.finally(() => {
                listener.dispose();
                focusTracker.dispose();
            });
            this._log(`+ Enabled hold-mode for ${commandId}.`);
            return this._keybindingHoldMode.p;
        }
        _resetKeybindingHoldMode() {
            if (this._keybindingHoldMode) {
                this._keybindingHoldMode?.complete();
                this._keybindingHoldMode = null;
            }
        }
        customKeybindingsCount() {
            return this.userKeybindings.keybindings.length;
        }
        updateResolver() {
            this._cachedResolver = null;
            this._onDidUpdateKeybindings.fire();
        }
        _getResolver() {
            if (!this._cachedResolver) {
                const defaults = this._resolveKeybindingItems(keybindingsRegistry_1.KeybindingsRegistry.getDefaultKeybindings(), true);
                const overrides = this._resolveUserKeybindingItems(this.userKeybindings.keybindings, false);
                this._cachedResolver = new keybindingResolver_1.KeybindingResolver(defaults, overrides, (str) => this._log(str));
            }
            return this._cachedResolver;
        }
        _documentHasFocus() {
            // it is possible that the document has lost focus, but the
            // window is still focused, e.g. when a <webview> element
            // has focus
            return this.hostService.hasFocus;
        }
        _resolveKeybindingItems(items, isDefault) {
            const result = [];
            let resultLen = 0;
            for (const item of items) {
                const when = item.when || undefined;
                const keybinding = item.keybinding;
                if (!keybinding) {
                    // This might be a removal keybinding item in user settings => accept it
                    result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(undefined, item.command, item.commandArgs, when, isDefault, item.extensionId, item.isBuiltinExtension);
                }
                else {
                    if (this._assertBrowserConflicts(keybinding)) {
                        continue;
                    }
                    const resolvedKeybindings = this._keyboardMapper.resolveKeybinding(keybinding);
                    for (let i = resolvedKeybindings.length - 1; i >= 0; i--) {
                        const resolvedKeybinding = resolvedKeybindings[i];
                        result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, item.command, item.commandArgs, when, isDefault, item.extensionId, item.isBuiltinExtension);
                    }
                }
            }
            return result;
        }
        _resolveUserKeybindingItems(items, isDefault) {
            const result = [];
            let resultLen = 0;
            for (const item of items) {
                const when = item.when || undefined;
                if (!item.keybinding) {
                    // This might be a removal keybinding item in user settings => accept it
                    result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(undefined, item.command, item.commandArgs, when, isDefault, null, false);
                }
                else {
                    const resolvedKeybindings = this._keyboardMapper.resolveKeybinding(item.keybinding);
                    for (const resolvedKeybinding of resolvedKeybindings) {
                        result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, item.command, item.commandArgs, when, isDefault, null, false);
                    }
                }
            }
            return result;
        }
        _assertBrowserConflicts(keybinding) {
            if (canIUse_1.BrowserFeatures.keyboard === 0 /* KeyboardSupport.Always */) {
                return false;
            }
            if (canIUse_1.BrowserFeatures.keyboard === 1 /* KeyboardSupport.FullScreen */ && browser.isFullscreen(window_1.mainWindow)) {
                return false;
            }
            for (const chord of keybinding.chords) {
                if (!chord.metaKey && !chord.altKey && !chord.ctrlKey && !chord.shiftKey) {
                    continue;
                }
                const modifiersMask = 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */;
                let partModifiersMask = 0;
                if (chord.metaKey) {
                    partModifiersMask |= 2048 /* KeyMod.CtrlCmd */;
                }
                if (chord.shiftKey) {
                    partModifiersMask |= 1024 /* KeyMod.Shift */;
                }
                if (chord.altKey) {
                    partModifiersMask |= 512 /* KeyMod.Alt */;
                }
                if (chord.ctrlKey && platform_1.OS === 2 /* OperatingSystem.Macintosh */) {
                    partModifiersMask |= 256 /* KeyMod.WinCtrl */;
                }
                if ((partModifiersMask & modifiersMask) === (2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */)) {
                    if (chord instanceof keybindings_1.ScanCodeChord && (chord.scanCode === 86 /* ScanCode.ArrowLeft */ || chord.scanCode === 85 /* ScanCode.ArrowRight */)) {
                        // console.warn('Ctrl/Cmd+Arrow keybindings should not be used by default in web. Offender: ', kb.getHashCode(), ' for ', commandId);
                        return true;
                    }
                    if (chord instanceof keybindings_1.KeyCodeChord && (chord.keyCode === 15 /* KeyCode.LeftArrow */ || chord.keyCode === 17 /* KeyCode.RightArrow */)) {
                        // console.warn('Ctrl/Cmd+Arrow keybindings should not be used by default in web. Offender: ', kb.getHashCode(), ' for ', commandId);
                        return true;
                    }
                }
                if ((partModifiersMask & modifiersMask) === 2048 /* KeyMod.CtrlCmd */) {
                    if (chord instanceof keybindings_1.ScanCodeChord && (chord.scanCode >= 36 /* ScanCode.Digit1 */ && chord.scanCode <= 45 /* ScanCode.Digit0 */)) {
                        // console.warn('Ctrl/Cmd+Num keybindings should not be used by default in web. Offender: ', kb.getHashCode(), ' for ', commandId);
                        return true;
                    }
                    if (chord instanceof keybindings_1.KeyCodeChord && (chord.keyCode >= 21 /* KeyCode.Digit0 */ && chord.keyCode <= 30 /* KeyCode.Digit9 */)) {
                        // console.warn('Ctrl/Cmd+Num keybindings should not be used by default in web. Offender: ', kb.getHashCode(), ' for ', commandId);
                        return true;
                    }
                }
            }
            return false;
        }
        resolveKeybinding(kb) {
            return this._keyboardMapper.resolveKeybinding(kb);
        }
        resolveKeyboardEvent(keyboardEvent) {
            this.keyboardLayoutService.validateCurrentKeyboardMapping(keyboardEvent);
            return this._keyboardMapper.resolveKeyboardEvent(keyboardEvent);
        }
        resolveUserBinding(userBinding) {
            const keybinding = keybindingParser_1.KeybindingParser.parseKeybinding(userBinding);
            return (keybinding ? this._keyboardMapper.resolveKeybinding(keybinding) : []);
        }
        _handleKeybindingsExtensionPointUser(extensionId, isBuiltin, keybindings, collector, result) {
            if (Array.isArray(keybindings)) {
                for (let i = 0, len = keybindings.length; i < len; i++) {
                    this._handleKeybinding(extensionId, isBuiltin, i + 1, keybindings[i], collector, result);
                }
            }
            else {
                this._handleKeybinding(extensionId, isBuiltin, 1, keybindings, collector, result);
            }
        }
        _handleKeybinding(extensionId, isBuiltin, idx, keybindings, collector, result) {
            const rejects = [];
            if (isValidContributedKeyBinding(keybindings, rejects)) {
                const rule = this._asCommandRule(extensionId, isBuiltin, idx++, keybindings);
                if (rule) {
                    result.push(rule);
                }
            }
            if (rejects.length > 0) {
                collector.error(nls.localize('invalid.keybindings', "Invalid `contributes.{0}`: {1}", keybindingsExtPoint.name, rejects.join('\n')));
            }
        }
        static bindToCurrentPlatform(key, mac, linux, win) {
            if (platform_1.OS === 1 /* OperatingSystem.Windows */ && win) {
                if (win) {
                    return win;
                }
            }
            else if (platform_1.OS === 2 /* OperatingSystem.Macintosh */) {
                if (mac) {
                    return mac;
                }
            }
            else {
                if (linux) {
                    return linux;
                }
            }
            return key;
        }
        _asCommandRule(extensionId, isBuiltin, idx, binding) {
            const { command, args, when, key, mac, linux, win } = binding;
            const keybinding = WorkbenchKeybindingService_1.bindToCurrentPlatform(key, mac, linux, win);
            if (!keybinding) {
                return undefined;
            }
            let weight;
            if (isBuiltin) {
                weight = 300 /* KeybindingWeight.BuiltinExtension */ + idx;
            }
            else {
                weight = 400 /* KeybindingWeight.ExternalExtension */ + idx;
            }
            const commandAction = actions_1.MenuRegistry.getCommand(command);
            const precondition = commandAction && commandAction.precondition;
            let fullWhen;
            if (when && precondition) {
                fullWhen = contextkey_1.ContextKeyExpr.and(precondition, contextkey_1.ContextKeyExpr.deserialize(when));
            }
            else if (when) {
                fullWhen = contextkey_1.ContextKeyExpr.deserialize(when);
            }
            else if (precondition) {
                fullWhen = precondition;
            }
            const desc = {
                id: command,
                args,
                when: fullWhen,
                weight: weight,
                keybinding: keybindingParser_1.KeybindingParser.parseKeybinding(keybinding),
                extensionId: extensionId.value,
                isBuiltinExtension: isBuiltin
            };
            return desc;
        }
        getDefaultKeybindingsContent() {
            const resolver = this._getResolver();
            const defaultKeybindings = resolver.getDefaultKeybindings();
            const boundCommands = resolver.getDefaultBoundCommands();
            return (WorkbenchKeybindingService_1._getDefaultKeybindings(defaultKeybindings)
                + '\n\n'
                + WorkbenchKeybindingService_1._getAllCommandsAsComment(boundCommands));
        }
        static _getDefaultKeybindings(defaultKeybindings) {
            const out = new keybindingIO_1.OutputBuilder();
            out.writeLine('[');
            const lastIndex = defaultKeybindings.length - 1;
            defaultKeybindings.forEach((k, index) => {
                keybindingIO_1.KeybindingIO.writeKeybindingItem(out, k);
                if (index !== lastIndex) {
                    out.writeLine(',');
                }
                else {
                    out.writeLine();
                }
            });
            out.writeLine(']');
            return out.toString();
        }
        static _getAllCommandsAsComment(boundCommands) {
            const unboundCommands = (0, unboundCommands_1.getAllUnboundCommands)(boundCommands);
            const pretty = unboundCommands.sort().join('\n// - ');
            return '// ' + nls.localize('unboundCommands', "Here are other available commands: ") + '\n// - ' + pretty;
        }
        mightProducePrintableCharacter(event) {
            if (event.ctrlKey || event.metaKey || event.altKey) {
                // ignore ctrl/cmd/alt-combination but not shift-combinatios
                return false;
            }
            const code = keyCodes_1.ScanCodeUtils.toEnum(event.code);
            if (NUMPAD_PRINTABLE_SCANCODES.indexOf(code) !== -1) {
                // This is a numpad key that might produce a printable character based on NumLock.
                // Let's check if NumLock is on or off based on the event's keyCode.
                // e.g.
                // - when NumLock is off, ScanCode.Numpad4 produces KeyCode.LeftArrow
                // - when NumLock is on, ScanCode.Numpad4 produces KeyCode.NUMPAD_4
                // However, ScanCode.NumpadAdd always produces KeyCode.NUMPAD_ADD
                if (event.keyCode === keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[code]) {
                    // NumLock is on or this is /, *, -, + on the numpad
                    return true;
                }
                if (platform_1.isMacintosh && event.keyCode === otherMacNumpadMapping.get(code)) {
                    // on macOS, the numpad keys can also map to keys 1 - 0.
                    return true;
                }
                return false;
            }
            const keycode = keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[code];
            if (keycode !== -1) {
                // https://github.com/microsoft/vscode/issues/74934
                return false;
            }
            // consult the KeyboardMapperFactory to check the given event for
            // a printable value.
            const mapping = this.keyboardLayoutService.getRawKeyboardMapping();
            if (!mapping) {
                return false;
            }
            const keyInfo = mapping[event.code];
            if (!keyInfo) {
                return false;
            }
            if (!keyInfo.value || /\s/.test(keyInfo.value)) {
                return false;
            }
            return true;
        }
    };
    exports.WorkbenchKeybindingService = WorkbenchKeybindingService;
    exports.WorkbenchKeybindingService = WorkbenchKeybindingService = WorkbenchKeybindingService_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, commands_1.ICommandService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, notification_1.INotificationService),
        __param(4, userDataProfile_1.IUserDataProfileService),
        __param(5, host_1.IHostService),
        __param(6, extensions_2.IExtensionService),
        __param(7, files_1.IFileService),
        __param(8, uriIdentity_1.IUriIdentityService),
        __param(9, log_1.ILogService),
        __param(10, keyboardLayout_1.IKeyboardLayoutService)
    ], WorkbenchKeybindingService);
    class UserKeybindings extends lifecycle_1.Disposable {
        get keybindings() { return this._keybindings; }
        constructor(userDataProfileService, uriIdentityService, fileService, logService) {
            super();
            this.userDataProfileService = userDataProfileService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this._rawKeybindings = [];
            this._keybindings = [];
            this.watchDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.watch();
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.reload().then(changed => {
                if (changed) {
                    this._onDidChange.fire();
                }
            }), 50));
            this._register(event_1.Event.filter(this.fileService.onDidFilesChange, e => e.contains(this.userDataProfileService.currentProfile.keybindingsResource))(() => {
                logService.debug('Keybindings file changed');
                this.reloadConfigurationScheduler.schedule();
            }));
            this._register(this.fileService.onDidRunOperation((e) => {
                if (e.operation === 4 /* FileOperation.WRITE */ && e.resource.toString() === this.userDataProfileService.currentProfile.keybindingsResource.toString()) {
                    logService.debug('Keybindings file written');
                    this.reloadConfigurationScheduler.schedule();
                }
            }));
            this._register(userDataProfileService.onDidChangeCurrentProfile(e => {
                if (!this.uriIdentityService.extUri.isEqual(e.previous.keybindingsResource, e.profile.keybindingsResource)) {
                    e.join(this.whenCurrentProfileChanged());
                }
            }));
        }
        async whenCurrentProfileChanged() {
            this.watch();
            this.reloadConfigurationScheduler.schedule();
        }
        watch() {
            this.watchDisposables.clear();
            this.watchDisposables.add(this.fileService.watch((0, resources_1.dirname)(this.userDataProfileService.currentProfile.keybindingsResource)));
            // Also listen to the resource incase the resource is a symlink - https://github.com/microsoft/vscode/issues/118134
            this.watchDisposables.add(this.fileService.watch(this.userDataProfileService.currentProfile.keybindingsResource));
        }
        async initialize() {
            await this.reload();
        }
        async reload() {
            const newKeybindings = await this.readUserKeybindings();
            if (objects.equals(this._rawKeybindings, newKeybindings)) {
                // no change
                return false;
            }
            this._rawKeybindings = newKeybindings;
            this._keybindings = this._rawKeybindings.map((k) => keybindingIO_1.KeybindingIO.readUserKeybindingItem(k));
            return true;
        }
        async readUserKeybindings() {
            try {
                const content = await this.fileService.readFile(this.userDataProfileService.currentProfile.keybindingsResource);
                const value = (0, json_1.parse)(content.value.toString());
                return Array.isArray(value)
                    ? value.filter(v => v && typeof v === 'object' /* just typeof === object doesn't catch `null` */)
                    : [];
            }
            catch (e) {
                return [];
            }
        }
    }
    /**
     * Registers the `keybindings.json`'s schema with the JSON schema registry. Allows updating the schema, e.g., when new commands are registered (e.g., by extensions).
     *
     * Lifecycle owned by `WorkbenchKeybindingService`. Must be instantiated only once.
     */
    class KeybindingsJsonSchema {
        static { this.schemaId = 'vscode://schemas/keybindings'; }
        constructor() {
            this.commandsSchemas = [];
            this.commandsEnum = [];
            this.removalCommandsEnum = [];
            this.commandsEnumDescriptions = [];
            this.schema = {
                id: KeybindingsJsonSchema.schemaId,
                type: 'array',
                title: nls.localize('keybindings.json.title', "Keybindings configuration"),
                allowTrailingCommas: true,
                allowComments: true,
                definitions: {
                    'editorGroupsSchema': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'groups': {
                                    '$ref': '#/definitions/editorGroupsSchema',
                                    'default': [{}, {}]
                                },
                                'size': {
                                    'type': 'number',
                                    'default': 0.5
                                }
                            }
                        }
                    },
                    'commandNames': {
                        'type': 'string',
                        'enum': this.commandsEnum,
                        'enumDescriptions': this.commandsEnumDescriptions,
                        'description': nls.localize('keybindings.json.command', "Name of the command to execute"),
                    },
                    'commandType': {
                        'anyOf': [
                            {
                                $ref: '#/definitions/commandNames'
                            },
                            {
                                'type': 'string',
                                'enum': this.removalCommandsEnum,
                                'enumDescriptions': this.commandsEnumDescriptions,
                                'description': nls.localize('keybindings.json.removalCommand', "Name of the command to remove keyboard shortcut for"),
                            },
                            {
                                'type': 'string'
                            },
                        ]
                    },
                    'commandsSchemas': {
                        'allOf': this.commandsSchemas
                    }
                },
                items: {
                    'required': ['key'],
                    'type': 'object',
                    'defaultSnippets': [{ 'body': { 'key': '$1', 'command': '$2', 'when': '$3' } }],
                    'properties': {
                        'key': {
                            'type': 'string',
                            'description': nls.localize('keybindings.json.key', "Key or key sequence (separated by space)"),
                        },
                        'command': {
                            'anyOf': [
                                {
                                    'if': {
                                        'type': 'array'
                                    },
                                    'then': {
                                        'not': {
                                            'type': 'array'
                                        },
                                        'errorMessage': nls.localize('keybindings.commandsIsArray', "Incorrect type. Expected \"{0}\". The field 'command' does not support running multiple commands. Use command 'runCommands' to pass it multiple commands to run.", 'string')
                                    },
                                    'else': {
                                        '$ref': '#/definitions/commandType'
                                    }
                                },
                                {
                                    '$ref': '#/definitions/commandType'
                                }
                            ]
                        },
                        'when': {
                            'type': 'string',
                            'description': nls.localize('keybindings.json.when', "Condition when the key is active.")
                        },
                        'args': {
                            'description': nls.localize('keybindings.json.args', "Arguments to pass to the command to execute.")
                        }
                    },
                    '$ref': '#/definitions/commandsSchemas'
                }
            };
            this.schemaRegistry = platform_2.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
            this.schemaRegistry.registerSchema(KeybindingsJsonSchema.schemaId, this.schema);
        }
        // TODO@ulugbekna: can updates happen incrementally rather than rebuilding; concerns:
        // - is just appending additional schemas enough for the registry to pick them up?
        // - can `CommandsRegistry.getCommands` and `MenuRegistry.getCommands` return different values at different times? ie would just pushing new schemas from `additionalContributions` not be enough?
        updateSchema(additionalContributions) {
            this.commandsSchemas.length = 0;
            this.commandsEnum.length = 0;
            this.removalCommandsEnum.length = 0;
            this.commandsEnumDescriptions.length = 0;
            const knownCommands = new Set();
            const addKnownCommand = (commandId, description) => {
                if (!/^_/.test(commandId)) {
                    if (!knownCommands.has(commandId)) {
                        knownCommands.add(commandId);
                        this.commandsEnum.push(commandId);
                        this.commandsEnumDescriptions.push((0, action_1.isLocalizedString)(description) ? description.value : description);
                        // Also add the negative form for keybinding removal
                        this.removalCommandsEnum.push(`-${commandId}`);
                    }
                }
            };
            const allCommands = commands_1.CommandsRegistry.getCommands();
            for (const [commandId, command] of allCommands) {
                const commandMetadata = command.metadata;
                addKnownCommand(commandId, commandMetadata?.description);
                if (!commandMetadata || !commandMetadata.args || commandMetadata.args.length !== 1 || !commandMetadata.args[0].schema) {
                    continue;
                }
                const argsSchema = commandMetadata.args[0].schema;
                const argsRequired = ((typeof commandMetadata.args[0].isOptional !== 'undefined')
                    ? (!commandMetadata.args[0].isOptional)
                    : (Array.isArray(argsSchema.required) && argsSchema.required.length > 0));
                const addition = {
                    'if': {
                        'required': ['command'],
                        'properties': {
                            'command': { 'const': commandId }
                        }
                    },
                    'then': {
                        'required': [].concat(argsRequired ? ['args'] : []),
                        'properties': {
                            'args': argsSchema
                        }
                    }
                };
                this.commandsSchemas.push(addition);
            }
            const menuCommands = actions_1.MenuRegistry.getCommands();
            for (const commandId of menuCommands.keys()) {
                addKnownCommand(commandId);
            }
            this.commandsSchemas.push(...additionalContributions);
            this.schemaRegistry.notifySchemaChanged(KeybindingsJsonSchema.schemaId);
        }
    }
    (0, extensions_1.registerSingleton)(keybinding_1.IKeybindingService, WorkbenchKeybindingService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9rZXliaW5kaW5nL2Jyb3dzZXIva2V5YmluZGluZ1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWlFaEcsU0FBUyw0QkFBNEIsQ0FBQyxVQUFpQyxFQUFFLE9BQWlCO1FBQ3pGLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNqQixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLDJCQUEyQixDQUFDLENBQUMsQ0FBQztZQUNwRSxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDRCxJQUFJLE9BQU8sVUFBVSxDQUFDLE9BQU8sS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUM1QyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLDBEQUEwRCxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDbkgsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QsSUFBSSxVQUFVLENBQUMsR0FBRyxJQUFJLE9BQU8sVUFBVSxDQUFDLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUMxRCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLDJEQUEyRCxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDNUcsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QsSUFBSSxVQUFVLENBQUMsSUFBSSxJQUFJLE9BQU8sVUFBVSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUM1RCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FB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