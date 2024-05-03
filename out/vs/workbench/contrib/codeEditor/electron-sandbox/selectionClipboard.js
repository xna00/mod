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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/common/contributions", "vs/platform/configuration/common/configuration", "vs/editor/common/editorContextKeys", "vs/base/browser/window", "vs/base/common/event", "vs/base/browser/dom"], function (require, exports, nls, async_1, lifecycle_1, platform, editorExtensions_1, range_1, clipboardService_1, selectionClipboard_1, contributions_1, configuration_1, editorContextKeys_1, window_1, event_1, dom_1) {
    "use strict";
    var SelectionClipboard_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectionClipboard = void 0;
    let SelectionClipboard = class SelectionClipboard extends lifecycle_1.Disposable {
        static { SelectionClipboard_1 = this; }
        static { this.SELECTION_LENGTH_LIMIT = 65536; }
        constructor(editor, clipboardService) {
            super();
            if (platform.isLinux) {
                let isEnabled = editor.getOption(107 /* EditorOption.selectionClipboard */);
                this._register(editor.onDidChangeConfiguration((e) => {
                    if (e.hasChanged(107 /* EditorOption.selectionClipboard */)) {
                        isEnabled = editor.getOption(107 /* EditorOption.selectionClipboard */);
                    }
                }));
                const setSelectionToClipboard = this._register(new async_1.RunOnceScheduler(() => {
                    if (!editor.hasModel()) {
                        return;
                    }
                    const model = editor.getModel();
                    let selections = editor.getSelections();
                    selections = selections.slice(0);
                    selections.sort(range_1.Range.compareRangesUsingStarts);
                    let resultLength = 0;
                    for (const sel of selections) {
                        if (sel.isEmpty()) {
                            // Only write if all cursors have selection
                            return;
                        }
                        resultLength += model.getValueLengthInRange(sel);
                    }
                    if (resultLength > SelectionClipboard_1.SELECTION_LENGTH_LIMIT) {
                        // This is a large selection!
                        // => do not write it to the selection clipboard
                        return;
                    }
                    const result = [];
                    for (const sel of selections) {
                        result.push(model.getValueInRange(sel, 0 /* EndOfLinePreference.TextDefined */));
                    }
                    const textToCopy = result.join(model.getEOL());
                    clipboardService.writeText(textToCopy, 'selection');
                }, 100));
                this._register(editor.onDidChangeCursorSelection((e) => {
                    if (!isEnabled) {
                        return;
                    }
                    if (e.source === 'restoreState') {
                        // do not set selection to clipboard if this selection change
                        // was caused by restoring editors...
                        return;
                    }
                    setSelectionToClipboard.schedule();
                }));
            }
        }
        dispose() {
            super.dispose();
        }
    };
    exports.SelectionClipboard = SelectionClipboard;
    exports.SelectionClipboard = SelectionClipboard = SelectionClipboard_1 = __decorate([
        __param(1, clipboardService_1.IClipboardService)
    ], SelectionClipboard);
    let LinuxSelectionClipboardPastePreventer = class LinuxSelectionClipboardPastePreventer extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.linuxSelectionClipboardPastePreventer'; }
        constructor(configurationService) {
            super();
            this._register(event_1.Event.runAndSubscribe(dom_1.onDidRegisterWindow, ({ window, disposables }) => {
                disposables.add((0, dom_1.addDisposableListener)(window.document, 'mouseup', e => {
                    if (e.button === 1) {
                        // middle button
                        const config = configurationService.getValue('editor');
                        if (!config.selectionClipboard) {
                            // selection clipboard is disabled
                            // try to stop the upcoming paste
                            e.preventDefault();
                        }
                    }
                }));
            }, { window: window_1.mainWindow, disposables: this._store }));
        }
    };
    LinuxSelectionClipboardPastePreventer = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], LinuxSelectionClipboardPastePreventer);
    class PasteSelectionClipboardAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.selectionClipboardPaste',
                label: nls.localize('actions.pasteSelectionClipboard', "Paste Selection Clipboard"),
                alias: 'Paste Selection Clipboard',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        async run(accessor, editor, args) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            // read selection clipboard
            const text = await clipboardService.readText('selection');
            editor.trigger('keyboard', "paste" /* Handler.Paste */, {
                text: text,
                pasteOnNewLine: false,
                multicursorText: null
            });
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(selectionClipboard_1.SelectionClipboardContributionID, SelectionClipboard, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to listen to selection change events
    if (platform.isLinux) {
        (0, contributions_1.registerWorkbenchContribution2)(LinuxSelectionClipboardPastePreventer.ID, LinuxSelectionClipboardPastePreventer, 2 /* WorkbenchPhase.BlockRestore */); // eager because it listens to mouse-up events globally
        (0, editorExtensions_1.registerEditorAction)(PasteSelectionClipboardAction);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uQ2xpcGJvYXJkLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlRWRpdG9yL2VsZWN0cm9uLXNhbmRib3gvc2VsZWN0aW9uQ2xpcGJvYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFzQnpGLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsc0JBQVU7O2lCQUN6QiwyQkFBc0IsR0FBRyxLQUFLLEFBQVIsQ0FBUztRQUV2RCxZQUFZLE1BQW1CLEVBQXFCLGdCQUFtQztZQUN0RixLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN0QixJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUywyQ0FBaUMsQ0FBQztnQkFFbEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUE0QixFQUFFLEVBQUU7b0JBQy9FLElBQUksQ0FBQyxDQUFDLFVBQVUsMkNBQWlDLEVBQUUsQ0FBQzt3QkFDbkQsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLDJDQUFpQyxDQUFDO29CQUMvRCxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosTUFBTSx1QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFO29CQUN4RSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7d0JBQ3hCLE9BQU87b0JBQ1IsQ0FBQztvQkFDRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2hDLElBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztv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