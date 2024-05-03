/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/platform", "vs/editor/browser/controller/textAreaInput", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/editorContextKeys", "vs/editor/contrib/dropOrPasteInto/browser/copyPasteController", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey"], function (require, exports, browser, dom_1, platform, textAreaInput_1, editorExtensions_1, codeEditorService_1, editorContextKeys_1, copyPasteController_1, nls, actions_1, clipboardService_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PasteAction = exports.CopyAction = exports.CutAction = void 0;
    const CLIPBOARD_CONTEXT_MENU_GROUP = '9_cutcopypaste';
    const supportsCut = (platform.isNative || document.queryCommandSupported('cut'));
    const supportsCopy = (platform.isNative || document.queryCommandSupported('copy'));
    // Firefox only supports navigator.clipboard.readText() in browser extensions.
    // See https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText#Browser_compatibility
    // When loading over http, navigator.clipboard can be undefined. See https://github.com/microsoft/monaco-editor/issues/2313
    const supportsPaste = (typeof navigator.clipboard === 'undefined' || browser.isFirefox) ? document.queryCommandSupported('paste') : true;
    function registerCommand(command) {
        command.register();
        return command;
    }
    exports.CutAction = supportsCut ? registerCommand(new editorExtensions_1.MultiCommand({
        id: 'editor.action.clipboardCutAction',
        precondition: undefined,
        kbOpts: (
        // Do not bind cut keybindings in the browser,
        // since browsers do that for us and it avoids security prompts
        platform.isNative ? {
            primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */,
            win: { primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */, secondary: [1024 /* KeyMod.Shift */ | 20 /* KeyCode.Delete */] },
            weight: 100 /* KeybindingWeight.EditorContrib */
        } : undefined),
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '2_ccp',
                title: nls.localize({ key: 'miCut', comment: ['&& denotes a mnemonic'] }, "Cu&&t"),
                order: 1
            }, {
                menuId: actions_1.MenuId.EditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.cutLabel', "Cut"),
                when: editorContextKeys_1.EditorContextKeys.writable,
                order: 1,
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('actions.clipboard.cutLabel', "Cut"),
                order: 1
            }, {
                menuId: actions_1.MenuId.SimpleEditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.cutLabel', "Cut"),
                when: editorContextKeys_1.EditorContextKeys.writable,
                order: 1,
            }]
    })) : undefined;
    exports.CopyAction = supportsCopy ? registerCommand(new editorExtensions_1.MultiCommand({
        id: 'editor.action.clipboardCopyAction',
        precondition: undefined,
        kbOpts: (
        // Do not bind copy keybindings in the browser,
        // since browsers do that for us and it avoids security prompts
        platform.isNative ? {
            primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
            win: { primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */, secondary: [2048 /* KeyMod.CtrlCmd */ | 19 /* KeyCode.Insert */] },
            weight: 100 /* KeybindingWeight.EditorContrib */
        } : undefined),
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '2_ccp',
                title: nls.localize({ key: 'miCopy', comment: ['&& denotes a mnemonic'] }, "&&Copy"),
                order: 2
            }, {
                menuId: actions_1.MenuId.EditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.copyLabel', "Copy"),
                order: 2,
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('actions.clipboard.copyLabel', "Copy"),
                order: 1
            }, {
                menuId: actions_1.MenuId.SimpleEditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.copyLabel', "Copy"),
                order: 2,
            }]
    })) : undefined;
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarEditMenu, { submenu: actions_1.MenuId.MenubarCopy, title: nls.localize2('copy as', "Copy As"), group: '2_ccp', order: 3 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, { submenu: actions_1.MenuId.EditorContextCopy, title: nls.localize2('copy as', "Copy As"), group: CLIPBOARD_CONTEXT_MENU_GROUP, order: 3 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, { submenu: actions_1.MenuId.EditorContextShare, title: nls.localize2('share', "Share"), group: '11_share', order: -1, when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.notEquals('resourceScheme', 'output'), editorContextKeys_1.EditorContextKeys.editorTextFocus) });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { submenu: actions_1.MenuId.EditorTitleContextShare, title: nls.localize2('share', "Share"), group: '11_share', order: -1 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, { submenu: actions_1.MenuId.ExplorerContextShare, title: nls.localize2('share', "Share"), group: '11_share', order: -1 });
    exports.PasteAction = supportsPaste ? registerCommand(new editorExtensions_1.MultiCommand({
        id: 'editor.action.clipboardPasteAction',
        precondition: undefined,
        kbOpts: (
        // Do not bind paste keybindings in the browser,
        // since browsers do that for us and it avoids security prompts
        platform.isNative ? {
            primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */,
            win: { primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */, secondary: [1024 /* KeyMod.Shift */ | 19 /* KeyCode.Insert */] },
            linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */, secondary: [1024 /* KeyMod.Shift */ | 19 /* KeyCode.Insert */] },
            weight: 100 /* KeybindingWeight.EditorContrib */
        } : undefined),
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '2_ccp',
                title: nls.localize({ key: 'miPaste', comment: ['&& denotes a mnemonic'] }, "&&Paste"),
                order: 4
            }, {
                menuId: actions_1.MenuId.EditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.pasteLabel', "Paste"),
                when: editorContextKeys_1.EditorContextKeys.writable,
                order: 4,
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('actions.clipboard.pasteLabel', "Paste"),
                order: 1
            }, {
                menuId: actions_1.MenuId.SimpleEditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.pasteLabel', "Paste"),
                when: editorContextKeys_1.EditorContextKeys.writable,
                order: 4,
            }]
    })) : undefined;
    class ExecCommandCopyWithSyntaxHighlightingAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.clipboardCopyWithSyntaxHighlightingAction',
                label: nls.localize('actions.clipboard.copyWithSyntaxHighlightingLabel', "Copy With Syntax Highlighting"),
                alias: 'Copy With Syntax Highlighting',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const emptySelectionClipboard = editor.getOption(37 /* EditorOption.emptySelectionClipboard */);
            if (!emptySelectionClipboard && editor.getSelection().isEmpty()) {
                return;
            }
            textAreaInput_1.CopyOptions.forceCopyWithSyntaxHighlighting = true;
            editor.focus();
            editor.getContainerDomNode().ownerDocument.execCommand('copy');
            textAreaInput_1.CopyOptions.forceCopyWithSyntaxHighlighting = false;
        }
    }
    function registerExecCommandImpl(target, browserCommand) {
        if (!target) {
            return;
        }
        // 1. handle case when focus is in editor.
        target.addImplementation(10000, 'code-editor', (accessor, args) => {
            // Only if editor text focus (i.e. not if editor has widget focus).
            const focusedEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (focusedEditor && focusedEditor.hasTextFocus()) {
                // Do not execute if there is no selection and empty selection clipboard is off
                const emptySelectionClipboard = focusedEditor.getOption(37 /* EditorOption.emptySelectionClipboard */);
                const selection = focusedEditor.getSelection();
                if (selection && selection.isEmpty() && !emptySelectionClipboard) {
                    return true;
                }
                focusedEditor.getContainerDomNode().ownerDocument.execCommand(browserCommand);
                return true;
            }
            return false;
        });
        // 2. (default) handle case when focus is somewhere else.
        target.addImplementation(0, 'generic-dom', (accessor, args) => {
            (0, dom_1.getActiveDocument)().execCommand(browserCommand);
            return true;
        });
    }
    registerExecCommandImpl(exports.CutAction, 'cut');
    registerExecCommandImpl(exports.CopyAction, 'copy');
    if (exports.PasteAction) {
        // 1. Paste: handle case when focus is in editor.
        exports.PasteAction.addImplementation(10000, 'code-editor', (accessor, args) => {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            // Only if editor text focus (i.e. not if editor has widget focus).
            const focusedEditor = codeEditorService.getFocusedCodeEditor();
            if (focusedEditor && focusedEditor.hasTextFocus()) {
                const result = focusedEditor.getContainerDomNode().ownerDocument.execCommand('paste');
                if (result) {
                    return copyPasteController_1.CopyPasteController.get(focusedEditor)?.finishedPaste() ?? Promise.resolve();
                }
                else if (platform.isWeb) {
                    // Use the clipboard service if document.execCommand('paste') was not successful
                    return (async () => {
                        const clipboardText = await clipboardService.readText();
                        if (clipboardText !== '') {
                            const metadata = textAreaInput_1.InMemoryClipboardMetadataManager.INSTANCE.get(clipboardText);
                            let pasteOnNewLine = false;
                            let multicursorText = null;
                            let mode = null;
                            if (metadata) {
                                pasteOnNewLine = (focusedEditor.getOption(37 /* EditorOption.emptySelectionClipboard */) && !!metadata.isFromEmptySelection);
                                multicursorText = (typeof metadata.multicursorText !== 'undefined' ? metadata.multicursorText : null);
                                mode = metadata.mode;
                            }
                            focusedEditor.trigger('keyboard', "paste" /* Handler.Paste */, {
                                text: clipboardText,
                                pasteOnNewLine,
                                multicursorText,
                                mode
                            });
                        }
                    })();
                }
                return true;
            }
            return false;
        });
        // 2. Paste: (default) handle case when focus is somewhere else.
        exports.PasteAction.addImplementation(0, 'generic-dom', (accessor, args) => {
            (0, dom_1.getActiveDocument)().execCommand('paste');
            return true;
        });
    }
    if (supportsCopy) {
        (0, editorExtensions_1.registerEditorAction)(ExecCommandCopyWithSyntaxHighlightingAction);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpcGJvYXJkLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jbGlwYm9hcmQvYnJvd3Nlci9jbGlwYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJoRyxNQUFNLDRCQUE0QixHQUFHLGdCQUFnQixDQUFDO0lBRXRELE1BQU0sV0FBVyxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNqRixNQUFNLFlBQVksR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDbkYsOEVBQThFO0lBQzlFLGdHQUFnRztJQUNoRywySEFBMkg7SUFDM0gsTUFBTSxhQUFhLEdBQUcsQ0FBQyxPQUFPLFNBQVMsQ0FBQyxTQUFTLEtBQUssV0FBVyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFekksU0FBUyxlQUFlLENBQW9CLE9BQVU7UUFDckQsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ25CLE9BQU8sT0FBTyxDQUFDO0lBQ2hCLENBQUM7SUFFWSxRQUFBLFNBQVMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxJQUFJLCtCQUFZLENBQUM7UUFDdkUsRUFBRSxFQUFFLGtDQUFrQztRQUN0QyxZQUFZLEVBQUUsU0FBUztRQUN2QixNQUFNLEVBQUU7UUFDUCw4Q0FBOEM7UUFDOUMsK0RBQStEO1FBQy9ELFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ25CLE9B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