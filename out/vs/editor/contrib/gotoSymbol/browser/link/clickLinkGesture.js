/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform"], function (require, exports, event_1, lifecycle_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClickLinkGesture = exports.ClickLinkOptions = exports.ClickLinkKeyboardEvent = exports.ClickLinkMouseEvent = void 0;
    function hasModifier(e, modifier) {
        return !!e[modifier];
    }
    /**
     * An event that encapsulates the various trigger modifiers logic needed for go to definition.
     */
    class ClickLinkMouseEvent {
        constructor(source, opts) {
            this.target = source.target;
            this.isLeftClick = source.event.leftButton;
            this.isMiddleClick = source.event.middleButton;
            this.isRightClick = source.event.rightButton;
            this.hasTriggerModifier = hasModifier(source.event, opts.triggerModifier);
            this.hasSideBySideModifier = hasModifier(source.event, opts.triggerSideBySideModifier);
            this.isNoneOrSingleMouseDown = (source.event.detail <= 1);
        }
    }
    exports.ClickLinkMouseEvent = ClickLinkMouseEvent;
    /**
     * An event that encapsulates the various trigger modifiers logic needed for go to definition.
     */
    class ClickLinkKeyboardEvent {
        constructor(source, opts) {
            this.keyCodeIsTriggerKey = (source.keyCode === opts.triggerKey);
            this.keyCodeIsSideBySideKey = (source.keyCode === opts.triggerSideBySideKey);
            this.hasTriggerModifier = hasModifier(source, opts.triggerModifier);
        }
    }
    exports.ClickLinkKeyboardEvent = ClickLinkKeyboardEvent;
    class ClickLinkOptions {
        constructor(triggerKey, triggerModifier, triggerSideBySideKey, triggerSideBySideModifier) {
            this.triggerKey = triggerKey;
            this.triggerModifier = triggerModifier;
            this.triggerSideBySideKey = triggerSideBySideKey;
            this.triggerSideBySideModifier = triggerSideBySideModifier;
        }
        equals(other) {
            return (this.triggerKey === other.triggerKey
                && this.triggerModifier === other.triggerModifier
                && this.triggerSideBySideKey === other.triggerSideBySideKey
                && this.triggerSideBySideModifier === other.triggerSideBySideModifier);
        }
    }
    exports.ClickLinkOptions = ClickLinkOptions;
    function createOptions(multiCursorModifier) {
        if (multiCursorModifier === 'altKey') {
            if (platform.isMacintosh) {
                return new ClickLinkOptions(57 /* KeyCode.Meta */, 'metaKey', 6 /* KeyCode.Alt */, 'altKey');
            }
            return new ClickLinkOptions(5 /* KeyCode.Ctrl */, 'ctrlKey', 6 /* KeyCode.Alt */, 'altKey');
        }
        if (platform.isMacintosh) {
            return new ClickLinkOptions(6 /* KeyCode.Alt */, 'altKey', 57 /* KeyCode.Meta */, 'metaKey');
        }
        return new ClickLinkOptions(6 /* KeyCode.Alt */, 'altKey', 5 /* KeyCode.Ctrl */, 'ctrlKey');
    }
    class ClickLinkGesture extends lifecycle_1.Disposable {
        constructor(editor, opts) {
            super();
            this._onMouseMoveOrRelevantKeyDown = this._register(new event_1.Emitter());
            this.onMouseMoveOrRelevantKeyDown = this._onMouseMoveOrRelevantKeyDown.event;
            this._onExecute = this._register(new event_1.Emitter());
            this.onExecute = this._onExecute.event;
            this._onCancel = this._register(new event_1.Emitter());
            this.onCancel = this._onCancel.event;
            this._editor = editor;
            this._extractLineNumberFromMouseEvent = opts?.extractLineNumberFromMouseEvent ?? ((e) => e.target.position ? e.target.position.lineNumber : 0);
            this._opts = createOptions(this._editor.getOption(78 /* EditorOption.multiCursorModifier */));
            this._lastMouseMoveEvent = null;
            this._hasTriggerKeyOnMouseDown = false;
            this._lineNumberOnMouseDown = 0;
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(78 /* EditorOption.multiCursorModifier */)) {
                    const newOpts = createOptions(this._editor.getOption(78 /* EditorOption.multiCursorModifier */));
                    if (this._opts.equals(newOpts)) {
                        return;
                    }
                    this._opts = newOpts;
                    this._lastMouseMoveEvent = null;
                    this._hasTriggerKeyOnMouseDown = false;
                    this._lineNumberOnMouseDown = 0;
                    this._onCancel.fire();
                }
            }));
            this._register(this._editor.onMouseMove((e) => this._onEditorMouseMove(new ClickLinkMouseEvent(e, this._opts))));
            this._register(this._editor.onMouseDown((e) => this._onEditorMouseDown(new ClickLinkMouseEvent(e, this._opts))));
            this._register(this._editor.onMouseUp((e) => this._onEditorMouseUp(new ClickLinkMouseEvent(e, this._opts))));
            this._register(this._editor.onKeyDown((e) => this._onEditorKeyDown(new ClickLinkKeyboardEvent(e, this._opts))));
            this._register(this._editor.onKeyUp((e) => this._onEditorKeyUp(new ClickLinkKeyboardEvent(e, this._opts))));
            this._register(this._editor.onMouseDrag(() => this._resetHandler()));
            this._register(this._editor.onDidChangeCursorSelection((e) => this._onDidChangeCursorSelection(e)));
            this._register(this._editor.onDidChangeModel((e) => this._resetHandler()));
            this._register(this._editor.onDidChangeModelContent(() => this._resetHandler()));
            this._register(this._editor.onDidScrollChange((e) => {
                if (e.scrollTopChanged || e.scrollLeftChanged) {
                    this._resetHandler();
                }
            }));
        }
        _onDidChangeCursorSelection(e) {
            if (e.selection && e.selection.startColumn !== e.selection.endColumn) {
                this._resetHandler(); // immediately stop this feature if the user starts to select (https://github.com/microsoft/vscode/issues/7827)
            }
        }
        _onEditorMouseMove(mouseEvent) {
            this._lastMouseMoveEvent = mouseEvent;
            this._onMouseMoveOrRelevantKeyDown.fire([mouseEvent, null]);
        }
        _onEditorMouseDown(mouseEvent) {
            // We need to record if we had the trigger key on mouse down because someone might select something in the editor
            // holding the mouse down and then while mouse is down start to press Ctrl/Cmd to start a copy operation and then
            // release the mouse button without wanting to do the navigation.
            // With this flag we prevent goto definition if the mouse was down before the trigger key was pressed.
            this._hasTriggerKeyOnMouseDown = mouseEvent.hasTriggerModifier;
            this._lineNumberOnMouseDown = this._extractLineNumberFromMouseEvent(mouseEvent);
        }
        _onEditorMouseUp(mouseEvent) {
            const currentLineNumber = this._extractLineNumberFromMouseEvent(mouseEvent);
            if (this._hasTriggerKeyOnMouseDown && this._lineNumberOnMouseDown && this._lineNumberOnMouseDown === currentLineNumber) {
                this._onExecute.fire(mouseEvent);
            }
        }
        _onEditorKeyDown(e) {
            if (this._lastMouseMoveEvent
                && (e.keyCodeIsTriggerKey // User just pressed Ctrl/Cmd (normal goto definition)
                    || (e.keyCodeIsSideBySideKey && e.hasTriggerModifier) // User pressed Ctrl/Cmd+Alt (goto definition to the side)
                )) {
                this._onMouseMoveOrRelevantKeyDown.fire([this._lastMouseMoveEvent, e]);
            }
            else if (e.hasTriggerModifier) {
                this._onCancel.fire(); // remove decorations if user holds another key with ctrl/cmd to prevent accident goto declaration
            }
        }
        _onEditorKeyUp(e) {
            if (e.keyCodeIsTriggerKey) {
                this._onCancel.fire();
            }
        }
        _resetHandler() {
            this._lastMouseMoveEvent = null;
            this._hasTriggerKeyOnMouseDown = false;
            this._onCancel.fire();
        }
    }
    exports.ClickLinkGesture = ClickLinkGesture;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpY2tMaW5rR2VzdHVyZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZ290b1N5bWJvbC9icm93c2VyL2xpbmsvY2xpY2tMaW5rR2VzdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsU0FBUyxXQUFXLENBQUMsQ0FBNkUsRUFBRSxRQUF1RDtRQUMxSixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBYSxtQkFBbUI7UUFVL0IsWUFBWSxNQUF5QixFQUFFLElBQXNCO1lBQzVELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUM1QixJQUFJLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDO1lBQzNDLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUM7WUFDL0MsSUFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQztZQUM3QyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUN2RixJQUFJLENBQUMsdUJBQXVCLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMzRCxDQUFDO0tBQ0Q7SUFuQkQsa0RBbUJDO0lBRUQ7O09BRUc7SUFDSCxNQUFhLHNCQUFzQjtR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