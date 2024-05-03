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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/htmlContent", "vs/base/common/keyCodes", "vs/editor/browser/editorExtensions", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/css!./anchorSelect"], function (require, exports, aria_1, htmlContent_1, keyCodes_1, editorExtensions_1, selection_1, editorContextKeys_1, nls_1, contextkey_1) {
    "use strict";
    var SelectionAnchorController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectionAnchorSet = void 0;
    exports.SelectionAnchorSet = new contextkey_1.RawContextKey('selectionAnchorSet', false);
    let SelectionAnchorController = class SelectionAnchorController {
        static { SelectionAnchorController_1 = this; }
        static { this.ID = 'editor.contrib.selectionAnchorController'; }
        static get(editor) {
            return editor.getContribution(SelectionAnchorController_1.ID);
        }
        constructor(editor, contextKeyService) {
            this.editor = editor;
            this.selectionAnchorSetContextKey = exports.SelectionAnchorSet.bindTo(contextKeyService);
            this.modelChangeListener = editor.onDidChangeModel(() => this.selectionAnchorSetContextKey.reset());
        }
        setSelectionAnchor() {
            if (this.editor.hasModel()) {
                const position = this.editor.getPosition();
                this.editor.changeDecorations((accessor) => {
                    if (this.decorationId) {
                        accessor.removeDecoration(this.decorationId);
                    }
                    this.decorationId = accessor.addDecoration(selection_1.Selection.fromPositions(position, position), {
                        description: 'selection-anchor',
                        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                        hoverMessage: new htmlContent_1.MarkdownString().appendText((0, nls_1.localize)('selectionAnchor', "Selection Anchor")),
                        className: 'selection-anchor'
                    });
                });
                this.selectionAnchorSetContextKey.set(!!this.decorationId);
                (0, aria_1.alert)((0, nls_1.localize)('anchorSet', "Anchor set at {0}:{1}", position.lineNumber, position.column));
            }
        }
        goToSelectionAnchor() {
            if (this.editor.hasModel() && this.decorationId) {
                const anchorPosition = this.editor.getModel().getDecorationRange(this.decorationId);
                if (anchorPosition) {
                    this.editor.setPosition(anchorPosition.getStartPosition());
                }
            }
        }
        selectFromAnchorToCursor() {
            if (this.editor.hasModel() && this.decorationId) {
                const start = this.editor.getModel().getDecorationRange(this.decorationId);
                if (start) {
                    const end = this.editor.getPosition();
                    this.editor.setSelection(selection_1.Selection.fromPositions(start.getStartPosition(), end));
                    this.cancelSelectionAnchor();
                }
            }
        }
        cancelSelectionAnchor() {
            if (this.decorationId) {
                const decorationId = this.decorationId;
                this.editor.changeDecorations((accessor) => {
                    accessor.removeDecoration(decorationId);
                    this.decorationId = undefined;
                });
                this.selectionAnchorSetContextKey.set(false);
            }
        }
        dispose() {
            this.cancelSelectionAnchor();
            this.modelChangeListener.dispose();
        }
    };
    SelectionAnchorController = SelectionAnchorController_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], SelectionAnchorController);
    class SetSelectionAnchor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.setSelectionAnchor',
                label: (0, nls_1.localize)('setSelectionAnchor', "Set Selection Anchor"),
                alias: 'Set Selection Anchor',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(_accessor, editor) {
            SelectionAnchorController.get(editor)?.setSelectionAnchor();
        }
    }
    class GoToSelectionAnchor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.goToSelectionAnchor',
                label: (0, nls_1.localize)('goToSelectionAnchor', "Go to Selection Anchor"),
                alias: 'Go to Selection Anchor',
                precondition: exports.SelectionAnchorSet,
            });
        }
        async run(_accessor, editor) {
            SelectionAnchorController.get(editor)?.goToSelectionAnchor();
        }
    }
    class SelectFromAnchorToCursor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.selectFromAnchorToCursor',
                label: (0, nls_1.localize)('selectFromAnchorToCursor', "Select from Anchor to Cursor"),
                alias: 'Select from Anchor to Cursor',
                precondition: exports.SelectionAnchorSet,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(_accessor, editor) {
            SelectionAnchorController.get(editor)?.selectFromAnchorToCursor();
        }
    }
    class CancelSelectionAnchor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.cancelSelectionAnchor',
                label: (0, nls_1.localize)('cancelSelectionAnchor', "Cancel Selection Anchor"),
                alias: 'Cancel Selection Anchor',
                precondition: exports.SelectionAnchorSet,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 9 /* KeyCode.Escape */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(_accessor, editor) {
            SelectionAnchorController.get(editor)?.cancelSelectionAnchor();
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(SelectionAnchorController.ID, SelectionAnchorController, 4 /* EditorContributionInstantiation.Lazy */);
    (0, editorExtensions_1.registerEditorAction)(SetSelectionAnchor);
    (0, editorExtensions_1.registerEditorAction)(GoToSelectionAnchor);
    (0, editorExtensions_1.registerEditorAction)(SelectFromAnchorToCursor);
    (0, editorExtensions_1.registerEditorAction)(CancelSelectionAnchor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5jaG9yU2VsZWN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9hbmNob3JTZWxlY3QvYnJvd3Nlci9hbmNob3JTZWxlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWlCbkYsUUFBQSxrQkFBa0IsR0FBRyxJQUFJLDBCQUFhLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFakYsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBeUI7O2lCQUVQLE9BQUUsR0FBRywwQ0FBMEMsQUFBN0MsQ0FBOEM7UUFFdkUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUM3QixPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQTRCLDJCQUF5QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFNRCxZQUNTLE1BQW1CLEVBQ1AsaUJBQXFDO1lBRGpELFdBQU0sR0FBTixNQUFNLENBQWE7WUFHM0IsSUFBSSxDQUFDLDRCQUE0QixHQUFHLDBCQUFrQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDckcsQ0FBQztRQUVELGtCQUFrQjtZQUNqQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO29CQUMxQyxJQUFJ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