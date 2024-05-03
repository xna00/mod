/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/browser/coreCommands", "vs/base/common/observable"], function (require, exports, async_1, lifecycle_1, coreCommands_1, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GhostTextContext = exports.MockInlineCompletionsProvider = void 0;
    class MockInlineCompletionsProvider {
        constructor() {
            this.returnValue = [];
            this.delayMs = 0;
            this.callHistory = new Array();
            this.calledTwiceIn50Ms = false;
            this.lastTimeMs = undefined;
        }
        setReturnValue(value, delayMs = 0) {
            this.returnValue = value ? [value] : [];
            this.delayMs = delayMs;
        }
        setReturnValues(values, delayMs = 0) {
            this.returnValue = values;
            this.delayMs = delayMs;
        }
        getAndClearCallHistory() {
            const history = [...this.callHistory];
            this.callHistory = [];
            return history;
        }
        assertNotCalledTwiceWithin50ms() {
            if (this.calledTwiceIn50Ms) {
                throw new Error('provideInlineCompletions has been called at least twice within 50ms. This should not happen.');
            }
        }
        async provideInlineCompletions(model, position, context, token) {
            const currentTimeMs = new Date().getTime();
            if (this.lastTimeMs && currentTimeMs - this.lastTimeMs < 50) {
                this.calledTwiceIn50Ms = true;
            }
            this.lastTimeMs = currentTimeMs;
            this.callHistory.push({
                position: position.toString(),
                triggerKind: context.triggerKind,
                text: model.getValue()
            });
            const result = new Array();
            result.push(...this.returnValue);
            if (this.delayMs > 0) {
                await (0, async_1.timeout)(this.delayMs);
            }
            return { items: result };
        }
        freeInlineCompletions() { }
        handleItemDidShow() { }
    }
    exports.MockInlineCompletionsProvider = MockInlineCompletionsProvider;
    class GhostTextContext extends lifecycle_1.Disposable {
        get currentPrettyViewState() {
            return this._currentPrettyViewState;
        }
        constructor(model, editor) {
            super();
            this.editor = editor;
            this.prettyViewStates = new Array();
            this._register((0, observable_1.autorun)(reader => {
                /** @description update */
                const ghostText = model.primaryGhostText.read(reader);
                let view;
                if (ghostText) {
                    view = ghostText.render(this.editor.getValue(), true);
                }
                else {
                    view = this.editor.getValue();
                }
                if (this._currentPrettyViewState !== view) {
                    this.prettyViewStates.push(view);
                }
                this._currentPrettyViewState = view;
            }));
        }
        getAndClearViewStates() {
            const arr = [...this.prettyViewStates];
            this.prettyViewStates.length = 0;
            return arr;
        }
        keyboardType(text) {
            this.editor.trigger('keyboard', 'type', { text });
        }
        cursorUp() {
            coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, this.editor, null);
        }
        cursorRight() {
            coreCommands_1.CoreNavigationCommands.CursorRight.runEditorCommand(null, this.editor, null);
        }
        cursorLeft() {
            coreCommands_1.CoreNavigationCommands.CursorLeft.runEditorCommand(null, this.editor, null);
        }
        cursorDown() {
            coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, this.editor, null);
        }
        cursorLineEnd() {
            coreCommands_1.CoreNavigationCommands.CursorLineEnd.runEditorCommand(null, this.editor, null);
        }
        leftDelete() {
            coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, this.editor, null);
        }
    }
    exports.GhostTextContext = GhostTextContext;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGluZUNvbXBsZXRpb25zL3Rlc3QvYnJvd3Nlci91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBYSw2QkFBNkI7UUFBMUM7WUFDUyxnQkFBVyxHQUF1QixFQUFFLENBQUM7WUFDckMsWUFBTyxHQUFXLENBQUMsQ0FBQztZQUVwQixnQkFBVyxHQUFHLElBQUksS0FBSyxFQUFXLENBQUM7WUFDbkMsc0JBQWlCLEdBQUcsS0FBSyxDQUFDO1lBd0IxQixlQUFVLEdBQXVCLFNBQVMsQ0FBQztRQXlCcEQsQ0FBQztRQS9DTyxjQUFjLENBQUMsS0FBbUMsRUFBRSxVQUFrQixDQUFDO1lBQzdFLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDeEIsQ0FBQztRQUVNLGVBQWUsQ0FBQyxNQUEwQixFQUFFLFVBQWtCLENBQUM7WUFDckUsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUM7WUFDMUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDeEIsQ0FBQztRQUVNLHNCQUFzQjtZQUM1QixNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO1lBQ3RCLE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFTSw4QkFBOEI7WUFDcEMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxJQUFJLEtBQUssQ0FB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