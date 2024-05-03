/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/keyCodes", "vs/base/common/keybindings", "vs/base/common/keybindingLabels", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/workbench/services/keybinding/common/macLinuxKeyboardMapper", "vs/workbench/services/keybinding/test/node/keyboardMapperTestUtils", "vs/base/test/common/utils"], function (require, exports, assert, keyCodes_1, keybindings_1, keybindingLabels_1, usLayoutResolvedKeybinding_1, macLinuxKeyboardMapper_1, keyboardMapperTestUtils_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const WRITE_FILE_IF_DIFFERENT = false;
    async function createKeyboardMapper(isUSStandard, file, mapAltGrToCtrlAlt, OS) {
        const rawMappings = await (0, keyboardMapperTestUtils_1.readRawMapping)(file);
        return new macLinuxKeyboardMapper_1.MacLinuxKeyboardMapper(isUSStandard, rawMappings, mapAltGrToCtrlAlt, OS);
    }
    suite('keyboardMapper - MAC de_ch', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let mapper;
        suiteSetup(async () => {
            const _mapper = await createKeyboardMapper(false, 'mac_de_ch', false, 2 /* OperatingSystem.Macintosh */);
            mapper = _mapper;
        });
        test('mapping', () => {
            return (0, keyboardMapperTestUtils_1.assertMapping)(WRITE_FILE_IF_DIFFERENT, mapper, 'mac_de_ch.txt');
        });
        function assertKeybindingTranslation(kb, expected) {
            _assertKeybindingTranslation(mapper, 2 /* OperatingSystem.Macintosh */, kb, expected);
        }
        function _assertResolveKeybinding(k, expected) {
            (0, keyboardMapperTestUtils_1.assertResolveKeybinding)(mapper, (0, keybindings_1.decodeKeybinding)(k, 2 /* OperatingSystem.Macintosh */), expected);
        }
        test('kb => hw', () => {
            // unchanged
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 22 /* KeyCode.Digit1 */, 'cmd+Digit1');
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */, 'cmd+KeyB');
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 32 /* KeyCode.KeyB */, 'shift+cmd+KeyB');
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 32 /* KeyCode.KeyB */, 'ctrl+shift+alt+cmd+KeyB');
            // flips Y and Z
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 56 /* KeyCode.KeyZ */, 'cmd+KeyY');
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */, 'cmd+KeyZ');
            // Ctrl+/
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 90 /* KeyCode.Slash */, 'shift+cmd+Digit7');
        });
        test('resolveKeybinding Cmd+A', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, [{
                    label: '⌘A',
                    ariaLabel: 'Command+A',
                    electronAccelerator: 'Cmd+A',
                    userSettingsLabel: 'cmd+a',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['meta+[KeyA]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Cmd+B', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */, [{
                    label: '⌘B',
                    ariaLabel: 'Command+B',
                    electronAccelerator: 'Cmd+B',
                    userSettingsLabel: 'cmd+b',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['meta+[KeyB]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Cmd+Z', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 56 /* KeyCode.KeyZ */, [{
                    label: '⌘Z',
                    ariaLabel: 'Command+Z',
                    electronAccelerator: 'Cmd+Z',
                    userSettingsLabel: 'cmd+z',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['meta+[KeyY]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeyboardEvent Cmd+[KeyY]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: true,
                altGraphKey: false,
                keyCode: -1,
                code: 'KeyY'
            }, {
                label: '⌘Z',
                ariaLabel: 'Command+Z',
                electronAccelerator: 'Cmd+Z',
                userSettingsLabel: 'cmd+z',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: ['meta+[KeyY]'],
                singleModifierDispatchParts: [null],
            });
        });
        test('resolveKeybinding Cmd+]', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 94 /* KeyCode.BracketRight */, [{
                    label: '⌃⌥⌘6',
                    ariaLabel: 'Control+Option+Command+6',
                    electronAccelerator: 'Ctrl+Alt+Cmd+6',
                    userSettingsLabel: 'ctrl+alt+cmd+6',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+alt+meta+[Digit6]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeyboardEvent Cmd+[BracketRight]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: true,
                altGraphKey: false,
                keyCode: -1,
                code: 'BracketRight'
            }, {
                label: '⌘¨',
                ariaLabel: 'Command+¨',
                electronAccelerator: null,
                userSettingsLabel: 'cmd+[BracketRight]',
                isWYSIWYG: false,
                isMultiChord: false,
                dispatchParts: ['meta+[BracketRight]'],
                singleModifierDispatchParts: [null],
            });
        });
        test('resolveKeybinding Shift+]', () => {
            _assertResolveKeybinding(1024 /* KeyMod.Shift */ | 94 /* KeyCode.BracketRight */, [{
                    label: '⌃⌥9',
                    ariaLabel: 'Control+Option+9',
                    electronAccelerator: 'Ctrl+Alt+9',
                    userSettingsLabel: 'ctrl+alt+9',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+alt+[Digit9]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Cmd+/', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 90 /* KeyCode.Slash */, [{
                    label: '⇧⌘7',
                    ariaLabel: 'Shift+Command+7',
                    electronAccelerator: 'Shift+Cmd+7',
                    userSettingsLabel: 'shift+cmd+7',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['shift+meta+[Digit7]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Cmd+Shift+/', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 90 /* KeyCode.Slash */, [{
                    label: '⇧⌘\'',
                    ariaLabel: 'Shift+Command+\'',
                    electronAccelerator: null,
                    userSettingsLabel: 'shift+cmd+[Minus]',
                    isWYSIWYG: false,
                    isMultiChord: false,
                    dispatchParts: ['shift+meta+[Minus]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Cmd+K Cmd+\\', () => {
            _assertResolveKeybinding((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */), [{
                    label: '⌘K ⌃⇧⌥⌘7',
                    ariaLabel: 'Command+K Control+Shift+Option+Command+7',
                    electronAccelerator: null,
                    userSettingsLabel: 'cmd+k ctrl+shift+alt+cmd+7',
                    isWYSIWYG: true,
                    isMultiChord: true,
                    dispatchParts: ['meta+[KeyK]', 'ctrl+shift+alt+meta+[Digit7]'],
                    singleModifierDispatchParts: [null, null],
                }]);
        });
        test('resolveKeybinding Cmd+K Cmd+=', () => {
            _assertResolveKeybinding((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 86 /* KeyCode.Equal */), [{
                    label: '⌘K ⇧⌘0',
                    ariaLabel: 'Command+K Shift+Command+0',
                    electronAccelerator: null,
                    userSettingsLabel: 'cmd+k shift+cmd+0',
                    isWYSIWYG: true,
                    isMultiChord: true,
                    dispatchParts: ['meta+[KeyK]', 'shift+meta+[Digit0]'],
                    singleModifierDispatchParts: [null, null],
                }]);
        });
        test('resolveKeybinding Cmd+DownArrow', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */, [{
                    label: '⌘↓',
                    ariaLabel: 'Command+DownArrow',
                    electronAccelerator: 'Cmd+Down',
                    userSettingsLabel: 'cmd+down',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['meta+[ArrowDown]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Cmd+NUMPAD_0', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 98 /* KeyCode.Numpad0 */, [{
                    label: '⌘NumPad0',
                    ariaLabel: 'Command+NumPad0',
                    electronAccelerator: null,
                    userSettingsLabel: 'cmd+numpad0',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['meta+[Numpad0]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+Home', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */, [{
                    label: '⌘Home',
                    ariaLabel: 'Command+Home',
                    electronAccelerator: 'Cmd+Home',
                    userSettingsLabel: 'cmd+home',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['meta+[Home]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeyboardEvent Ctrl+[Home]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: true,
                altGraphKey: false,
                keyCode: -1,
                code: 'Home'
            }, {
                label: '⌘Home',
                ariaLabel: 'Command+Home',
                electronAccelerator: 'Cmd+Home',
                userSettingsLabel: 'cmd+home',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: ['meta+[Home]'],
                singleModifierDispatchParts: [null],
            });
        });
        test('resolveUserBinding Cmd+[Comma] Cmd+/', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeybinding)(mapper, new keybindings_1.Keybinding([
                new keybindings_1.ScanCodeChord(false, false, false, true, 60 /* ScanCode.Comma */),
                new keybindings_1.KeyCodeChord(false, false, false, true, 90 /* KeyCode.Slash */),
            ]), [{
                    label: '⌘, ⇧⌘7',
                    ariaLabel: 'Command+, Shift+Command+7',
                    electronAccelerator: null,
                    userSettingsLabel: 'cmd+[Comma] shift+cmd+7',
                    isWYSIWYG: false,
                    isMultiChord: true,
                    dispatchParts: ['meta+[Comma]', 'shift+meta+[Digit7]'],
                    singleModifierDispatchParts: [null, null],
                }]);
        });
        test('resolveKeyboardEvent Single Modifier MetaLeft+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: true,
                altGraphKey: false,
                keyCode: -1,
                code: 'MetaLeft'
            }, {
                label: '⌘',
                ariaLabel: 'Command',
                electronAccelerator: null,
                userSettingsLabel: 'cmd',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['meta'],
            });
        });
        test('resolveKeyboardEvent Single Modifier MetaRight+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: true,
                altGraphKey: false,
                keyCode: -1,
                code: 'MetaRight'
            }, {
                label: '⌘',
                ariaLabel: 'Command',
                electronAccelerator: null,
                userSettingsLabel: 'cmd',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['meta'],
            });
        });
    });
    suite('keyboardMapper - MAC en_us', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let mapper;
        suiteSetup(async () => {
            const _mapper = await createKeyboardMapper(true, 'mac_en_us', false, 2 /* OperatingSystem.Macintosh */);
            mapper = _mapper;
        });
        test('mapping', () => {
            return (0, keyboardMapperTestUtils_1.assertMapping)(WRITE_FILE_IF_DIFFERENT, mapper, 'mac_en_us.txt');
        });
        test('resolveUserBinding Cmd+[Comma] Cmd+/', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeybinding)(mapper, new keybindings_1.Keybinding([
                new keybindings_1.ScanCodeChord(false, false, false, true, 60 /* ScanCode.Comma */),
                new keybindings_1.KeyCodeChord(false, false, false, true, 90 /* KeyCode.Slash */),
            ]), [{
                    label: '⌘, ⌘/',
                    ariaLabel: 'Command+, Command+/',
                    electronAccelerator: null,
                    userSettingsLabel: 'cmd+, cmd+/',
                    isWYSIWYG: true,
                    isMultiChord: true,
                    dispatchParts: ['meta+[Comma]', 'meta+[Slash]'],
                    singleModifierDispatchParts: [null, null],
                }]);
        });
        test('resolveKeyboardEvent Single Modifier MetaLeft+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: true,
                altGraphKey: false,
                keyCode: -1,
                code: 'MetaLeft'
            }, {
                label: '⌘',
                ariaLabel: 'Command',
                electronAccelerator: null,
                userSettingsLabel: 'cmd',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['meta'],
            });
        });
        test('resolveKeyboardEvent Single Modifier MetaRight+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: true,
                altGraphKey: false,
                keyCode: -1,
                code: 'MetaRight'
            }, {
                label: '⌘',
                ariaLabel: 'Command',
                electronAccelerator: null,
                userSettingsLabel: 'cmd',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['meta'],
            });
        });
        test('resolveKeyboardEvent mapAltGrToCtrlAlt AltGr+Z', async () => {
            const mapper = await createKeyboardMapper(true, 'mac_en_us', true, 2 /* OperatingSystem.Macintosh */);
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: true,
                keyCode: -1,
                code: 'KeyZ'
            }, {
                label: '⌃⌥Z',
                ariaLabel: 'Control+Option+Z',
                electronAccelerator: 'Ctrl+Alt+Z',
                userSettingsLabel: 'ctrl+alt+z',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: ['ctrl+alt+[KeyZ]'],
                singleModifierDispatchParts: [null],
            });
        });
    });
    suite('keyboardMapper - LINUX de_ch', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let mapper;
        suiteSetup(async () => {
            const _mapper = await createKeyboardMapper(false, 'linux_de_ch', false, 3 /* OperatingSystem.Linux */);
            mapper = _mapper;
        });
        test('mapping', () => {
            return (0, keyboardMapperTestUtils_1.assertMapping)(WRITE_FILE_IF_DIFFERENT, mapper, 'linux_de_ch.txt');
        });
        function assertKeybindingTranslation(kb, expected) {
            _assertKeybindingTranslation(mapper, 3 /* OperatingSystem.Linux */, kb, expected);
        }
        function _assertResolveKeybinding(k, expected) {
            (0, keyboardMapperTestUtils_1.assertResolveKeybinding)(mapper, (0, keybindings_1.decodeKeybinding)(k, 3 /* OperatingSystem.Linux */), expected);
        }
        test('kb => hw', () => {
            // unchanged
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 22 /* KeyCode.Digit1 */, 'ctrl+Digit1');
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */, 'ctrl+KeyB');
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 32 /* KeyCode.KeyB */, 'ctrl+shift+KeyB');
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 32 /* KeyCode.KeyB */, 'ctrl+shift+alt+meta+KeyB');
            // flips Y and Z
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 56 /* KeyCode.KeyZ */, 'ctrl+KeyY');
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */, 'ctrl+KeyZ');
            // Ctrl+/
            assertKeybindingTranslation(2048 /* KeyMod.CtrlCmd */ | 90 /* KeyCode.Slash */, 'ctrl+shift+Digit7');
        });
        test('resolveKeybinding Ctrl+A', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, [{
                    label: 'Ctrl+A',
                    ariaLabel: 'Control+A',
                    electronAccelerator: 'Ctrl+A',
                    userSettingsLabel: 'ctrl+a',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[KeyA]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+Z', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 56 /* KeyCode.KeyZ */, [{
                    label: 'Ctrl+Z',
                    ariaLabel: 'Control+Z',
                    electronAccelerator: 'Ctrl+Z',
                    userSettingsLabel: 'ctrl+z',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[KeyY]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeyboardEvent Ctrl+[KeyY]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'KeyY'
            }, {
                label: 'Ctrl+Z',
                ariaLabel: 'Control+Z',
                electronAccelerator: 'Ctrl+Z',
                userSettingsLabel: 'ctrl+z',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: ['ctrl+[KeyY]'],
                singleModifierDispatchParts: [null],
            });
        });
        test('resolveKeybinding Ctrl+]', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 94 /* KeyCode.BracketRight */, []);
        });
        test('resolveKeyboardEvent Ctrl+[BracketRight]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'BracketRight'
            }, {
                label: 'Ctrl+¨',
                ariaLabel: 'Control+¨',
                electronAccelerator: null,
                userSettingsLabel: 'ctrl+[BracketRight]',
                isWYSIWYG: false,
                isMultiChord: false,
                dispatchParts: ['ctrl+[BracketRight]'],
                singleModifierDispatchParts: [null],
            });
        });
        test('resolveKeybinding Shift+]', () => {
            _assertResolveKeybinding(1024 /* KeyMod.Shift */ | 94 /* KeyCode.BracketRight */, [{
                    label: 'Ctrl+Alt+0',
                    ariaLabel: 'Control+Alt+0',
                    electronAccelerator: 'Ctrl+Alt+0',
                    userSettingsLabel: 'ctrl+alt+0',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+alt+[Digit0]'],
                    singleModifierDispatchParts: [null],
                }, {
                    label: 'Ctrl+Alt+$',
                    ariaLabel: 'Control+Alt+$',
                    electronAccelerator: null,
                    userSettingsLabel: 'ctrl+alt+[Backslash]',
                    isWYSIWYG: false,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+alt+[Backslash]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+/', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 90 /* KeyCode.Slash */, [{
                    label: 'Ctrl+Shift+7',
                    ariaLabel: 'Control+Shift+7',
                    electronAccelerator: 'Ctrl+Shift+7',
                    userSettingsLabel: 'ctrl+shift+7',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+shift+[Digit7]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+Shift+/', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 90 /* KeyCode.Slash */, [{
                    label: 'Ctrl+Shift+\'',
                    ariaLabel: 'Control+Shift+\'',
                    electronAccelerator: null,
                    userSettingsLabel: 'ctrl+shift+[Minus]',
                    isWYSIWYG: false,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+shift+[Minus]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+K Ctrl+\\', () => {
            _assertResolveKeybinding((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */), []);
        });
        test('resolveKeybinding Ctrl+K Ctrl+=', () => {
            _assertResolveKeybinding((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 86 /* KeyCode.Equal */), [{
                    label: 'Ctrl+K Ctrl+Shift+0',
                    ariaLabel: 'Control+K Control+Shift+0',
                    electronAccelerator: null,
                    userSettingsLabel: 'ctrl+k ctrl+shift+0',
                    isWYSIWYG: true,
                    isMultiChord: true,
                    dispatchParts: ['ctrl+[KeyK]', 'ctrl+shift+[Digit0]'],
                    singleModifierDispatchParts: [null, null],
                }]);
        });
        test('resolveKeybinding Ctrl+DownArrow', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */, [{
                    label: 'Ctrl+DownArrow',
                    ariaLabel: 'Control+DownArrow',
                    electronAccelerator: 'Ctrl+Down',
                    userSettingsLabel: 'ctrl+down',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[ArrowDown]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+NUMPAD_0', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 98 /* KeyCode.Numpad0 */, [{
                    label: 'Ctrl+NumPad0',
                    ariaLabel: 'Control+NumPad0',
                    electronAccelerator: null,
                    userSettingsLabel: 'ctrl+numpad0',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[Numpad0]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+Home', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */, [{
                    label: 'Ctrl+Home',
                    ariaLabel: 'Control+Home',
                    electronAccelerator: 'Ctrl+Home',
                    userSettingsLabel: 'ctrl+home',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[Home]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeyboardEvent Ctrl+[Home]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'Home'
            }, {
                label: 'Ctrl+Home',
                ariaLabel: 'Control+Home',
                electronAccelerator: 'Ctrl+Home',
                userSettingsLabel: 'ctrl+home',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: ['ctrl+[Home]'],
                singleModifierDispatchParts: [null],
            });
        });
        test('resolveKeyboardEvent Ctrl+[KeyX]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'KeyX'
            }, {
                label: 'Ctrl+X',
                ariaLabel: 'Control+X',
                electronAccelerator: 'Ctrl+X',
                userSettingsLabel: 'ctrl+x',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: ['ctrl+[KeyX]'],
                singleModifierDispatchParts: [null],
            });
        });
        test('resolveUserBinding Ctrl+[Comma] Ctrl+/', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeybinding)(mapper, new keybindings_1.Keybinding([
                new keybindings_1.ScanCodeChord(true, false, false, false, 60 /* ScanCode.Comma */),
                new keybindings_1.KeyCodeChord(true, false, false, false, 90 /* KeyCode.Slash */),
            ]), [{
                    label: 'Ctrl+, Ctrl+Shift+7',
                    ariaLabel: 'Control+, Control+Shift+7',
                    electronAccelerator: null,
                    userSettingsLabel: 'ctrl+[Comma] ctrl+shift+7',
                    isWYSIWYG: false,
                    isMultiChord: true,
                    dispatchParts: ['ctrl+[Comma]', 'ctrl+shift+[Digit7]'],
                    singleModifierDispatchParts: [null, null],
                }]);
        });
        test('resolveKeyboardEvent Single Modifier ControlLeft+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'ControlLeft'
            }, {
                label: 'Ctrl',
                ariaLabel: 'Control',
                electronAccelerator: null,
                userSettingsLabel: 'ctrl',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['ctrl'],
            });
        });
        test('resolveKeyboardEvent Single Modifier ControlRight+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'ControlRight'
            }, {
                label: 'Ctrl',
                ariaLabel: 'Control',
                electronAccelerator: null,
                userSettingsLabel: 'ctrl',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['ctrl'],
            });
        });
    });
    suite('keyboardMapper - LINUX en_us', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let mapper;
        suiteSetup(async () => {
            const _mapper = await createKeyboardMapper(true, 'linux_en_us', false, 3 /* OperatingSystem.Linux */);
            mapper = _mapper;
        });
        test('mapping', () => {
            return (0, keyboardMapperTestUtils_1.assertMapping)(WRITE_FILE_IF_DIFFERENT, mapper, 'linux_en_us.txt');
        });
        function _assertResolveKeybinding(k, expected) {
            (0, keyboardMapperTestUtils_1.assertResolveKeybinding)(mapper, (0, keybindings_1.decodeKeybinding)(k, 3 /* OperatingSystem.Linux */), expected);
        }
        test('resolveKeybinding Ctrl+A', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */, [{
                    label: 'Ctrl+A',
                    ariaLabel: 'Control+A',
                    electronAccelerator: 'Ctrl+A',
                    userSettingsLabel: 'ctrl+a',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[KeyA]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+Z', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 56 /* KeyCode.KeyZ */, [{
                    label: 'Ctrl+Z',
                    ariaLabel: 'Control+Z',
                    electronAccelerator: 'Ctrl+Z',
                    userSettingsLabel: 'ctrl+z',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[KeyZ]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeyboardEvent Ctrl+[KeyZ]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'KeyZ'
            }, {
                label: 'Ctrl+Z',
                ariaLabel: 'Control+Z',
                electronAccelerator: 'Ctrl+Z',
                userSettingsLabel: 'ctrl+z',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: ['ctrl+[KeyZ]'],
                singleModifierDispatchParts: [null],
            });
        });
        test('resolveKeybinding Ctrl+]', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 94 /* KeyCode.BracketRight */, [{
                    label: 'Ctrl+]',
                    ariaLabel: 'Control+]',
                    electronAccelerator: 'Ctrl+]',
                    userSettingsLabel: 'ctrl+]',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[BracketRight]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeyboardEvent Ctrl+[BracketRight]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'BracketRight'
            }, {
                label: 'Ctrl+]',
                ariaLabel: 'Control+]',
                electronAccelerator: 'Ctrl+]',
                userSettingsLabel: 'ctrl+]',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: ['ctrl+[BracketRight]'],
                singleModifierDispatchParts: [null],
            });
        });
        test('resolveKeybinding Shift+]', () => {
            _assertResolveKeybinding(1024 /* KeyMod.Shift */ | 94 /* KeyCode.BracketRight */, [{
                    label: 'Shift+]',
                    ariaLabel: 'Shift+]',
                    electronAccelerator: 'Shift+]',
                    userSettingsLabel: 'shift+]',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['shift+[BracketRight]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+/', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 90 /* KeyCode.Slash */, [{
                    label: 'Ctrl+/',
                    ariaLabel: 'Control+/',
                    electronAccelerator: 'Ctrl+/',
                    userSettingsLabel: 'ctrl+/',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[Slash]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+Shift+/', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 90 /* KeyCode.Slash */, [{
                    label: 'Ctrl+Shift+/',
                    ariaLabel: 'Control+Shift+/',
                    electronAccelerator: 'Ctrl+Shift+/',
                    userSettingsLabel: 'ctrl+shift+/',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+shift+[Slash]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+K Ctrl+\\', () => {
            _assertResolveKeybinding((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */), [{
                    label: 'Ctrl+K Ctrl+\\',
                    ariaLabel: 'Control+K Control+\\',
                    electronAccelerator: null,
                    userSettingsLabel: 'ctrl+k ctrl+\\',
                    isWYSIWYG: true,
                    isMultiChord: true,
                    dispatchParts: ['ctrl+[KeyK]', 'ctrl+[Backslash]'],
                    singleModifierDispatchParts: [null, null],
                }]);
        });
        test('resolveKeybinding Ctrl+K Ctrl+=', () => {
            _assertResolveKeybinding((0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 86 /* KeyCode.Equal */), [{
                    label: 'Ctrl+K Ctrl+=',
                    ariaLabel: 'Control+K Control+=',
                    electronAccelerator: null,
                    userSettingsLabel: 'ctrl+k ctrl+=',
                    isWYSIWYG: true,
                    isMultiChord: true,
                    dispatchParts: ['ctrl+[KeyK]', 'ctrl+[Equal]'],
                    singleModifierDispatchParts: [null, null],
                }]);
        });
        test('resolveKeybinding Ctrl+DownArrow', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */, [{
                    label: 'Ctrl+DownArrow',
                    ariaLabel: 'Control+DownArrow',
                    electronAccelerator: 'Ctrl+Down',
                    userSettingsLabel: 'ctrl+down',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[ArrowDown]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+NUMPAD_0', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 98 /* KeyCode.Numpad0 */, [{
                    label: 'Ctrl+NumPad0',
                    ariaLabel: 'Control+NumPad0',
                    electronAccelerator: null,
                    userSettingsLabel: 'ctrl+numpad0',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[Numpad0]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeybinding Ctrl+Home', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */, [{
                    label: 'Ctrl+Home',
                    ariaLabel: 'Control+Home',
                    electronAccelerator: 'Ctrl+Home',
                    userSettingsLabel: 'ctrl+home',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[Home]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeyboardEvent Ctrl+[Home]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'Home'
            }, {
                label: 'Ctrl+Home',
                ariaLabel: 'Control+Home',
                electronAccelerator: 'Ctrl+Home',
                userSettingsLabel: 'ctrl+home',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: ['ctrl+[Home]'],
                singleModifierDispatchParts: [null],
            });
        });
        test('resolveKeybinding Ctrl+Shift+,', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 87 /* KeyCode.Comma */, [{
                    label: 'Ctrl+Shift+,',
                    ariaLabel: 'Control+Shift+,',
                    electronAccelerator: 'Ctrl+Shift+,',
                    userSettingsLabel: 'ctrl+shift+,',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+shift+[Comma]'],
                    singleModifierDispatchParts: [null],
                }, {
                    label: 'Ctrl+<',
                    ariaLabel: 'Control+<',
                    electronAccelerator: null,
                    userSettingsLabel: 'ctrl+[IntlBackslash]',
                    isWYSIWYG: false,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[IntlBackslash]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('issue #23393: resolveKeybinding Ctrl+Enter', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */, [{
                    label: 'Ctrl+Enter',
                    ariaLabel: 'Control+Enter',
                    electronAccelerator: 'Ctrl+Enter',
                    userSettingsLabel: 'ctrl+enter',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[Enter]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('issue #23393: resolveKeyboardEvent Ctrl+[NumpadEnter]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'NumpadEnter'
            }, {
                label: 'Ctrl+Enter',
                ariaLabel: 'Control+Enter',
                electronAccelerator: 'Ctrl+Enter',
                userSettingsLabel: 'ctrl+enter',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: ['ctrl+[Enter]'],
                singleModifierDispatchParts: [null],
            });
        });
        test('resolveUserBinding Ctrl+[Comma] Ctrl+/', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeybinding)(mapper, new keybindings_1.Keybinding([
                new keybindings_1.ScanCodeChord(true, false, false, false, 60 /* ScanCode.Comma */),
                new keybindings_1.KeyCodeChord(true, false, false, false, 90 /* KeyCode.Slash */),
            ]), [{
                    label: 'Ctrl+, Ctrl+/',
                    ariaLabel: 'Control+, Control+/',
                    electronAccelerator: null,
                    userSettingsLabel: 'ctrl+, ctrl+/',
                    isWYSIWYG: true,
                    isMultiChord: true,
                    dispatchParts: ['ctrl+[Comma]', 'ctrl+[Slash]'],
                    singleModifierDispatchParts: [null, null],
                }]);
        });
        test('resolveUserBinding Ctrl+[Comma]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeybinding)(mapper, new keybindings_1.Keybinding([
                new keybindings_1.ScanCodeChord(true, false, false, false, 60 /* ScanCode.Comma */)
            ]), [{
                    label: 'Ctrl+,',
                    ariaLabel: 'Control+,',
                    electronAccelerator: 'Ctrl+,',
                    userSettingsLabel: 'ctrl+,',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[Comma]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
        test('resolveKeyboardEvent Single Modifier ControlLeft+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'ControlLeft'
            }, {
                label: 'Ctrl',
                ariaLabel: 'Control',
                electronAccelerator: null,
                userSettingsLabel: 'ctrl',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['ctrl'],
            });
        });
        test('resolveKeyboardEvent Single Modifier ControlRight+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'ControlRight'
            }, {
                label: 'Ctrl',
                ariaLabel: 'Control',
                electronAccelerator: null,
                userSettingsLabel: 'ctrl',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['ctrl'],
            });
        });
        test('resolveKeyboardEvent Single Modifier ShiftLeft+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: true,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'ShiftLeft'
            }, {
                label: 'Shift',
                ariaLabel: 'Shift',
                electronAccelerator: null,
                userSettingsLabel: 'shift',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['shift'],
            });
        });
        test('resolveKeyboardEvent Single Modifier ShiftRight+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: true,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'ShiftRight'
            }, {
                label: 'Shift',
                ariaLabel: 'Shift',
                electronAccelerator: null,
                userSettingsLabel: 'shift',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['shift'],
            });
        });
        test('resolveKeyboardEvent Single Modifier AltLeft+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: true,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'AltLeft'
            }, {
                label: 'Alt',
                ariaLabel: 'Alt',
                electronAccelerator: null,
                userSettingsLabel: 'alt',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['alt'],
            });
        });
        test('resolveKeyboardEvent Single Modifier AltRight+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: true,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'AltRight'
            }, {
                label: 'Alt',
                ariaLabel: 'Alt',
                electronAccelerator: null,
                userSettingsLabel: 'alt',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['alt'],
            });
        });
        test('resolveKeyboardEvent Single Modifier MetaLeft+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: true,
                altGraphKey: false,
                keyCode: -1,
                code: 'MetaLeft'
            }, {
                label: 'Super',
                ariaLabel: 'Super',
                electronAccelerator: null,
                userSettingsLabel: 'meta',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['meta'],
            });
        });
        test('resolveKeyboardEvent Single Modifier MetaRight+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: true,
                altGraphKey: false,
                keyCode: -1,
                code: 'MetaRight'
            }, {
                label: 'Super',
                ariaLabel: 'Super',
                electronAccelerator: null,
                userSettingsLabel: 'meta',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: ['meta'],
            });
        });
        test('resolveKeyboardEvent Only Modifiers Ctrl+Shift+', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: true,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'ShiftLeft'
            }, {
                label: 'Ctrl+Shift',
                ariaLabel: 'Control+Shift',
                electronAccelerator: null,
                userSettingsLabel: 'ctrl+shift',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: [null],
                singleModifierDispatchParts: [null],
            });
        });
        test('resolveKeyboardEvent mapAltGrToCtrlAlt AltGr+Z', async () => {
            const mapper = await createKeyboardMapper(true, 'linux_en_us', true, 3 /* OperatingSystem.Linux */);
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: false,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: true,
                keyCode: -1,
                code: 'KeyZ'
            }, {
                label: 'Ctrl+Alt+Z',
                ariaLabel: 'Control+Alt+Z',
                electronAccelerator: 'Ctrl+Alt+Z',
                userSettingsLabel: 'ctrl+alt+z',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: ['ctrl+alt+[KeyZ]'],
                singleModifierDispatchParts: [null],
            });
        });
    });
    suite('keyboardMapper', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #23706: Linux UK layout: Ctrl + Apostrophe also toggles terminal', () => {
            const mapper = new macLinuxKeyboardMapper_1.MacLinuxKeyboardMapper(false, {
                'Backquote': {
                    'value': '`',
                    'withShift': '¬',
                    'withAltGr': '|',
                    'withShiftAltGr': '|'
                }
            }, false, 3 /* OperatingSystem.Linux */);
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: false,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'Backquote'
            }, {
                label: 'Ctrl+`',
                ariaLabel: 'Control+`',
                electronAccelerator: null,
                userSettingsLabel: 'ctrl+`',
                isWYSIWYG: true,
                isMultiChord: false,
                dispatchParts: ['ctrl+[Backquote]'],
                singleModifierDispatchParts: [null],
            });
        });
        test('issue #24064: NumLock/NumPad keys stopped working in 1.11 on Linux', () => {
            const mapper = new macLinuxKeyboardMapper_1.MacLinuxKeyboardMapper(false, {}, false, 3 /* OperatingSystem.Linux */);
            function assertNumpadKeyboardEvent(keyCode, code, label, electronAccelerator, userSettingsLabel, dispatch) {
                (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                    _standardKeyboardEventBrand: true,
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false,
                    metaKey: false,
                    altGraphKey: false,
                    keyCode: keyCode,
                    code: code
                }, {
                    label: label,
                    ariaLabel: label,
                    electronAccelerator: electronAccelerator,
                    userSettingsLabel: userSettingsLabel,
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: [dispatch],
                    singleModifierDispatchParts: [null],
                });
            }
            assertNumpadKeyboardEvent(13 /* KeyCode.End */, 'Numpad1', 'End', 'End', 'end', '[End]');
            assertNumpadKeyboardEvent(18 /* KeyCode.DownArrow */, 'Numpad2', 'DownArrow', 'Down', 'down', '[ArrowDown]');
            assertNumpadKeyboardEvent(12 /* KeyCode.PageDown */, 'Numpad3', 'PageDown', 'PageDown', 'pagedown', '[PageDown]');
            assertNumpadKeyboardEvent(15 /* KeyCode.LeftArrow */, 'Numpad4', 'LeftArrow', 'Left', 'left', '[ArrowLeft]');
            assertNumpadKeyboardEvent(0 /* KeyCode.Unknown */, 'Numpad5', 'NumPad5', null, 'numpad5', '[Numpad5]');
            assertNumpadKeyboardEvent(17 /* KeyCode.RightArrow */, 'Numpad6', 'RightArrow', 'Right', 'right', '[ArrowRight]');
            assertNumpadKeyboardEvent(14 /* KeyCode.Home */, 'Numpad7', 'Home', 'Home', 'home', '[Home]');
            assertNumpadKeyboardEvent(16 /* KeyCode.UpArrow */, 'Numpad8', 'UpArrow', 'Up', 'up', '[ArrowUp]');
            assertNumpadKeyboardEvent(11 /* KeyCode.PageUp */, 'Numpad9', 'PageUp', 'PageUp', 'pageup', '[PageUp]');
            assertNumpadKeyboardEvent(19 /* KeyCode.Insert */, 'Numpad0', 'Insert', 'Insert', 'insert', '[Insert]');
            assertNumpadKeyboardEvent(20 /* KeyCode.Delete */, 'NumpadDecimal', 'Delete', 'Delete', 'delete', '[Delete]');
        });
        test('issue #24107: Delete, Insert, Home, End, PgUp, PgDn, and arrow keys no longer work editor in 1.11', () => {
            const mapper = new macLinuxKeyboardMapper_1.MacLinuxKeyboardMapper(false, {}, false, 3 /* OperatingSystem.Linux */);
            function assertKeyboardEvent(keyCode, code, label, electronAccelerator, userSettingsLabel, dispatch) {
                (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                    _standardKeyboardEventBrand: true,
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false,
                    metaKey: false,
                    altGraphKey: false,
                    keyCode: keyCode,
                    code: code
                }, {
                    label: label,
                    ariaLabel: label,
                    electronAccelerator: electronAccelerator,
                    userSettingsLabel: userSettingsLabel,
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: [dispatch],
                    singleModifierDispatchParts: [null],
                });
            }
            // https://github.com/microsoft/vscode/issues/24107#issuecomment-292318497
            assertKeyboardEvent(16 /* KeyCode.UpArrow */, 'Lang3', 'UpArrow', 'Up', 'up', '[ArrowUp]');
            assertKeyboardEvent(18 /* KeyCode.DownArrow */, 'NumpadEnter', 'DownArrow', 'Down', 'down', '[ArrowDown]');
            assertKeyboardEvent(15 /* KeyCode.LeftArrow */, 'Convert', 'LeftArrow', 'Left', 'left', '[ArrowLeft]');
            assertKeyboardEvent(17 /* KeyCode.RightArrow */, 'NonConvert', 'RightArrow', 'Right', 'right', '[ArrowRight]');
            assertKeyboardEvent(20 /* KeyCode.Delete */, 'PrintScreen', 'Delete', 'Delete', 'delete', '[Delete]');
            assertKeyboardEvent(19 /* KeyCode.Insert */, 'NumpadDivide', 'Insert', 'Insert', 'insert', '[Insert]');
            assertKeyboardEvent(13 /* KeyCode.End */, 'Unknown', 'End', 'End', 'end', '[End]');
            assertKeyboardEvent(14 /* KeyCode.Home */, 'IntlRo', 'Home', 'Home', 'home', '[Home]');
            assertKeyboardEvent(12 /* KeyCode.PageDown */, 'ControlRight', 'PageDown', 'PageDown', 'pagedown', '[PageDown]');
            assertKeyboardEvent(11 /* KeyCode.PageUp */, 'Lang4', 'PageUp', 'PageUp', 'pageup', '[PageUp]');
            // https://github.com/microsoft/vscode/issues/24107#issuecomment-292323924
            assertKeyboardEvent(12 /* KeyCode.PageDown */, 'ControlRight', 'PageDown', 'PageDown', 'pagedown', '[PageDown]');
            assertKeyboardEvent(11 /* KeyCode.PageUp */, 'Lang4', 'PageUp', 'PageUp', 'pageup', '[PageUp]');
            assertKeyboardEvent(13 /* KeyCode.End */, '', 'End', 'End', 'end', '[End]');
            assertKeyboardEvent(14 /* KeyCode.Home */, 'IntlRo', 'Home', 'Home', 'home', '[Home]');
            assertKeyboardEvent(20 /* KeyCode.Delete */, 'PrintScreen', 'Delete', 'Delete', 'delete', '[Delete]');
            assertKeyboardEvent(19 /* KeyCode.Insert */, 'NumpadDivide', 'Insert', 'Insert', 'insert', '[Insert]');
            assertKeyboardEvent(17 /* KeyCode.RightArrow */, 'NonConvert', 'RightArrow', 'Right', 'right', '[ArrowRight]');
            assertKeyboardEvent(15 /* KeyCode.LeftArrow */, 'Convert', 'LeftArrow', 'Left', 'left', '[ArrowLeft]');
            assertKeyboardEvent(18 /* KeyCode.DownArrow */, 'NumpadEnter', 'DownArrow', 'Down', 'down', '[ArrowDown]');
            assertKeyboardEvent(16 /* KeyCode.UpArrow */, 'Lang3', 'UpArrow', 'Up', 'up', '[ArrowUp]');
        });
    });
    suite('keyboardMapper - LINUX ru', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let mapper;
        suiteSetup(async () => {
            const _mapper = await createKeyboardMapper(false, 'linux_ru', false, 3 /* OperatingSystem.Linux */);
            mapper = _mapper;
        });
        test('mapping', () => {
            return (0, keyboardMapperTestUtils_1.assertMapping)(WRITE_FILE_IF_DIFFERENT, mapper, 'linux_ru.txt');
        });
        function _assertResolveKeybinding(k, expected) {
            (0, keyboardMapperTestUtils_1.assertResolveKeybinding)(mapper, (0, keybindings_1.decodeKeybinding)(k, 3 /* OperatingSystem.Linux */), expected);
        }
        test('resolveKeybinding Ctrl+S', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 49 /* KeyCode.KeyS */, [{
                    label: 'Ctrl+S',
                    ariaLabel: 'Control+S',
                    electronAccelerator: 'Ctrl+S',
                    userSettingsLabel: 'ctrl+s',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['ctrl+[KeyS]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
    });
    suite('keyboardMapper - LINUX en_uk', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let mapper;
        suiteSetup(async () => {
            const _mapper = await createKeyboardMapper(false, 'linux_en_uk', false, 3 /* OperatingSystem.Linux */);
            mapper = _mapper;
        });
        test('mapping', () => {
            return (0, keyboardMapperTestUtils_1.assertMapping)(WRITE_FILE_IF_DIFFERENT, mapper, 'linux_en_uk.txt');
        });
        test('issue #24522: resolveKeyboardEvent Ctrl+Alt+[Minus]', () => {
            (0, keyboardMapperTestUtils_1.assertResolveKeyboardEvent)(mapper, {
                _standardKeyboardEventBrand: true,
                ctrlKey: true,
                shiftKey: false,
                altKey: true,
                metaKey: false,
                altGraphKey: false,
                keyCode: -1,
                code: 'Minus'
            }, {
                label: 'Ctrl+Alt+-',
                ariaLabel: 'Control+Alt+-',
                electronAccelerator: null,
                userSettingsLabel: 'ctrl+alt+[Minus]',
                isWYSIWYG: false,
                isMultiChord: false,
                dispatchParts: ['ctrl+alt+[Minus]'],
                singleModifierDispatchParts: [null],
            });
        });
    });
    suite('keyboardMapper - MAC zh_hant', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let mapper;
        suiteSetup(async () => {
            const _mapper = await createKeyboardMapper(false, 'mac_zh_hant', false, 2 /* OperatingSystem.Macintosh */);
            mapper = _mapper;
        });
        test('mapping', () => {
            return (0, keyboardMapperTestUtils_1.assertMapping)(WRITE_FILE_IF_DIFFERENT, mapper, 'mac_zh_hant.txt');
        });
        function _assertResolveKeybinding(k, expected) {
            (0, keyboardMapperTestUtils_1.assertResolveKeybinding)(mapper, (0, keybindings_1.decodeKeybinding)(k, 2 /* OperatingSystem.Macintosh */), expected);
        }
        test('issue #28237 resolveKeybinding Cmd+C', () => {
            _assertResolveKeybinding(2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */, [{
                    label: '⌘C',
                    ariaLabel: 'Command+C',
                    electronAccelerator: 'Cmd+C',
                    userSettingsLabel: 'cmd+c',
                    isWYSIWYG: true,
                    isMultiChord: false,
                    dispatchParts: ['meta+[KeyC]'],
                    singleModifierDispatchParts: [null],
                }]);
        });
    });
    suite('keyboardMapper - MAC zh_hant2', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let mapper;
        suiteSetup(async () => {
            const _mapper = await createKeyboardMapper(false, 'mac_zh_hant2', false, 2 /* OperatingSystem.Macintosh */);
            mapper = _mapper;
        });
        test('mapping', () => {
            return (0, keyboardMapperTestUtils_1.assertMapping)(WRITE_FILE_IF_DIFFERENT, mapper, 'mac_zh_hant2.txt');
        });
    });
    function _assertKeybindingTranslation(mapper, OS, kb, _expected) {
        let expected;
        if (typeof _expected === 'string') {
            expected = [_expected];
        }
        else if (Array.isArray(_expected)) {
            expected = _expected;
        }
        else {
            expected = [];
        }
        const runtimeKeybinding = (0, keybindings_1.createSimpleKeybinding)(kb, OS);
        const keybindingLabel = new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding([runtimeKeybinding], OS).getUserSettingsLabel();
        const actualHardwareKeypresses = mapper.keyCodeChordToScanCodeChord(runtimeKeybinding);
        if (actualHardwareKeypresses.length === 0) {
            assert.deepStrictEqual([], expected, `simpleKeybindingToHardwareKeypress -- "${keybindingLabel}" -- actual: "[]" -- expected: "${expected}"`);
            return;
        }
        const actual = actualHardwareKeypresses
            .map(k => keybindingLabels_1.UserSettingsLabelProvider.toLabel(OS, [k], (keybinding) => keyCodes_1.ScanCodeUtils.toString(keybinding.scanCode)));
        assert.deepStrictEqual(actual, expected, `simpleKeybindingToHardwareKeypress -- "${keybindingLabel}" -- actual: "${actual}" -- expected: "${expected}"`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFjTGludXhLZXlib2FyZE1hcHBlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMva2V5YmluZGluZy90ZXN0L25vZGUvbWFjTGludXhLZXlib2FyZE1hcHBlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLE1BQU0sdUJBQXVCLEdBQUcsS0FBSyxDQUFDO0lBRXRDLEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxZQUFxQixFQUFFLElBQVksRUFBRSxpQkFBMEIsRUFBRSxFQUFtQjtRQUN2SCxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsd0NBQWMsRUFBMkIsSUFBSSxDQUFDLENBQUM7UUFDekUsT0FBTyxJQUFJLCtDQUFzQixDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDckYsQ0FBQztJQUVELEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7UUFFeEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksTUFBOEIsQ0FBQztRQUVuQyxVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDckIsTUFBTSxPQUFPLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsV0FBVyxFQUFFLEtBQUssb0NBQTRCLENBQUM7WUFDakcsTUFBTSxHQUFHLE9BQU8sQ0FBQztRQUNsQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1lBQ3BCLE9BQU8sSUFBQSx1Q0FBYSxFQUFDLHVCQUF1QixFQUFFLE1BQU0sRUFBRSxlQUFlLENBQUMsQ0FBQztRQUN4RSxDQUFDLENBQUMsQ0FBQztRQUVILFNBQVMsMkJBQTJCLENBQUMsRUFBVSxFQUFFLFFBQTJCO1lBQzNF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