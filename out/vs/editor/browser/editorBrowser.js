/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/editorCommon"], function (require, exports, editorCommon) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorState = exports.MouseTargetType = exports.OverlayWidgetPositionPreference = exports.ContentWidgetPositionPreference = void 0;
    exports.isCodeEditor = isCodeEditor;
    exports.isDiffEditor = isDiffEditor;
    exports.isCompositeEditor = isCompositeEditor;
    exports.getCodeEditor = getCodeEditor;
    exports.getIEditor = getIEditor;
    /**
     * A positioning preference for rendering content widgets.
     */
    var ContentWidgetPositionPreference;
    (function (ContentWidgetPositionPreference) {
        /**
         * Place the content widget exactly at a position
         */
        ContentWidgetPositionPreference[ContentWidgetPositionPreference["EXACT"] = 0] = "EXACT";
        /**
         * Place the content widget above a position
         */
        ContentWidgetPositionPreference[ContentWidgetPositionPreference["ABOVE"] = 1] = "ABOVE";
        /**
         * Place the content widget below a position
         */
        ContentWidgetPositionPreference[ContentWidgetPositionPreference["BELOW"] = 2] = "BELOW";
    })(ContentWidgetPositionPreference || (exports.ContentWidgetPositionPreference = ContentWidgetPositionPreference = {}));
    /**
     * A positioning preference for rendering overlay widgets.
     */
    var OverlayWidgetPositionPreference;
    (function (OverlayWidgetPositionPreference) {
        /**
         * Position the overlay widget in the top right corner
         */
        OverlayWidgetPositionPreference[OverlayWidgetPositionPreference["TOP_RIGHT_CORNER"] = 0] = "TOP_RIGHT_CORNER";
        /**
         * Position the overlay widget in the bottom right corner
         */
        OverlayWidgetPositionPreference[OverlayWidgetPositionPreference["BOTTOM_RIGHT_CORNER"] = 1] = "BOTTOM_RIGHT_CORNER";
        /**
         * Position the overlay widget in the top center
         */
        OverlayWidgetPositionPreference[OverlayWidgetPositionPreference["TOP_CENTER"] = 2] = "TOP_CENTER";
    })(OverlayWidgetPositionPreference || (exports.OverlayWidgetPositionPreference = OverlayWidgetPositionPreference = {}));
    /**
     * Type of hit element with the mouse in the editor.
     */
    var MouseTargetType;
    (function (MouseTargetType) {
        /**
         * Mouse is on top of an unknown element.
         */
        MouseTargetType[MouseTargetType["UNKNOWN"] = 0] = "UNKNOWN";
        /**
         * Mouse is on top of the textarea used for input.
         */
        MouseTargetType[MouseTargetType["TEXTAREA"] = 1] = "TEXTAREA";
        /**
         * Mouse is on top of the glyph margin
         */
        MouseTargetType[MouseTargetType["GUTTER_GLYPH_MARGIN"] = 2] = "GUTTER_GLYPH_MARGIN";
        /**
         * Mouse is on top of the line numbers
         */
        MouseTargetType[MouseTargetType["GUTTER_LINE_NUMBERS"] = 3] = "GUTTER_LINE_NUMBERS";
        /**
         * Mouse is on top of the line decorations
         */
        MouseTargetType[MouseTargetType["GUTTER_LINE_DECORATIONS"] = 4] = "GUTTER_LINE_DECORATIONS";
        /**
         * Mouse is on top of the whitespace left in the gutter by a view zone.
         */
        MouseTargetType[MouseTargetType["GUTTER_VIEW_ZONE"] = 5] = "GUTTER_VIEW_ZONE";
        /**
         * Mouse is on top of text in the content.
         */
        MouseTargetType[MouseTargetType["CONTENT_TEXT"] = 6] = "CONTENT_TEXT";
        /**
         * Mouse is on top of empty space in the content (e.g. after line text or below last line)
         */
        MouseTargetType[MouseTargetType["CONTENT_EMPTY"] = 7] = "CONTENT_EMPTY";
        /**
         * Mouse is on top of a view zone in the content.
         */
        MouseTargetType[MouseTargetType["CONTENT_VIEW_ZONE"] = 8] = "CONTENT_VIEW_ZONE";
        /**
         * Mouse is on top of a content widget.
         */
        MouseTargetType[MouseTargetType["CONTENT_WIDGET"] = 9] = "CONTENT_WIDGET";
        /**
         * Mouse is on top of the decorations overview ruler.
         */
        MouseTargetType[MouseTargetType["OVERVIEW_RULER"] = 10] = "OVERVIEW_RULER";
        /**
         * Mouse is on top of a scrollbar.
         */
        MouseTargetType[MouseTargetType["SCROLLBAR"] = 11] = "SCROLLBAR";
        /**
         * Mouse is on top of an overlay widget.
         */
        MouseTargetType[MouseTargetType["OVERLAY_WIDGET"] = 12] = "OVERLAY_WIDGET";
        /**
         * Mouse is outside of the editor.
         */
        MouseTargetType[MouseTargetType["OUTSIDE_EDITOR"] = 13] = "OUTSIDE_EDITOR";
    })(MouseTargetType || (exports.MouseTargetType = MouseTargetType = {}));
    /**
     * @internal
     */
    var DiffEditorState;
    (function (DiffEditorState) {
        DiffEditorState[DiffEditorState["Idle"] = 0] = "Idle";
        DiffEditorState[DiffEditorState["ComputingDiff"] = 1] = "ComputingDiff";
        DiffEditorState[DiffEditorState["DiffComputed"] = 2] = "DiffComputed";
    })(DiffEditorState || (exports.DiffEditorState = DiffEditorState = {}));
    /**
     *@internal
     */
    function isCodeEditor(thing) {
        if (thing && typeof thing.getEditorType === 'function') {
            return thing.getEditorType() === editorCommon.EditorType.ICodeEditor;
        }
        else {
            return false;
        }
    }
    /**
     *@internal
     */
    function isDiffEditor(thing) {
        if (thing && typeof thing.getEditorType === 'function') {
            return thing.getEditorType() === editorCommon.EditorType.IDiffEditor;
        }
        else {
            return false;
        }
    }
    /**
     *@internal
     */
    function isCompositeEditor(thing) {
        return !!thing
            && typeof thing === 'object'
            && typeof thing.onDidChangeActiveEditor === 'function';
    }
    /**
     *@internal
     */
    function getCodeEditor(thing) {
        if (isCodeEditor(thing)) {
            return thing;
        }
        if (isDiffEditor(thing)) {
            return thing.getModifiedEditor();
        }
        if (isCompositeEditor(thing) && isCodeEditor(thing.activeCodeEditor)) {
            return thing.activeCodeEditor;
        }
        return null;
    }
    /**
     *@internal
     */
    function getIEditor(thing) {
        if (isCodeEditor(thing) || isDiffEditor(thing)) {
            return thing;
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvZWRpdG9yQnJvd3Nlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5eUNoRyxvQ0FNQztJQUtELG9DQU1DO0lBS0QsOENBS0M7SUFLRCxzQ0FjQztJQUtELGdDQU1DO0lBL3VDRDs7T0FFRztJQUNILElBQWtCLCtCQWFqQjtJQWJELFdBQWtCLCtCQUErQjtRQUNoRDs7V0FFRztRQUNILHVGQUFLLENBQUE7UUFDTDs7V0FFRztRQUNILHVGQUFLLENBQUE7UUFDTDs7V0FFRztRQUNILHVGQUFLLENBQUE7SUFDTixDQUFDLEVBYmlCLCtCQUErQiwrQ0FBL0IsK0JBQStCLFFBYWhEO0lBMEVEOztPQUVHO0lBQ0gsSUFBa0IsK0JBZWpCO0lBZkQsV0FBa0IsK0JBQStCO1FBQ2hEOztXQUVHO1FBQ0gsNkdBQWdCLENBQUE7UUFFaEI7O1dBRUc7UUFDSCxtSEFBbUIsQ0FBQTtRQUVuQjs7V0FFRztRQUNILGlHQUFVLENBQUE7SUFDWCxDQUFDLEVBZmlCLCtCQUErQiwrQ0FBL0IsK0JBQStCLFFBZWhEO0lBMEZEOztPQUVHO0lBQ0gsSUFBa0IsZUF5RGpCO0lBekRELFdBQWtCLGVBQWU7UUFDaEM7O1dBRUc7UUFDSCwyREFBTyxDQUFBO1FBQ1A7O1dBRUc7UUFDSCw2REFBUSxDQUFBO1FBQ1I7O1dBRUc7UUFDSCxtRkFBbUIsQ0FBQTtRQUNuQjs7V0FFRztRQUNILG1GQUFtQixDQUFBO1FBQ25COztXQUVHO1FBQ0gsMkZBQXVCLENBQUE7UUFDdkI7O1dBRUc7UUFDSCw2RUFBZ0IsQ0FBQTtRQUNoQjs7V0FFRztRQUNILHFFQUFZLENBQUE7UUFDWjs7V0FFRztRQUNILHVFQUFhLENBQUE7UUFDYjs7V0FFRztRQUNILCtFQUFpQixDQUFBO1FBQ2pCOztXQUVHO1FBQ0gseUVBQWMsQ0FBQTtRQUNkOztXQUVHO1FBQ0gsMEVBQWMsQ0FBQTtRQUNkOztXQUVHO1FBQ0gsZ0VBQVMsQ0FBQTtRQUNUOztXQUVHO1FBQ0gsMEVBQWMsQ0FBQTtRQUNkOztXQUVHO1FBQ0gsMEVBQWMsQ0FBQTtJQUNmLENBQUMsRUF6RGlCLGVBQWUsK0JBQWYsZUFBZSxRQXlEaEM7SUFzekJEOztPQUVHO0lBQ0gsSUFBa0IsZUFJakI7SUFKRCxXQUFrQixlQUFlO1FBQ2hDLHFEQUFJLENBQUE7UUFDSix1RUFBYSxDQUFBO1FBQ2IscUVBQVksQ0FBQTtJQUNiLENBQUMsRUFKaUIsZUFBZSwrQkFBZixlQUFlLFFBSWhDO0lBb0hEOztPQUVHO0lBQ0gsU0FBZ0IsWUFBWSxDQUFDLEtBQWM7UUFDMUMsSUFBSSxLQUFLLElBQUksT0FBcUIsS0FBTSxDQUFDLGFBQWEsS0FBSyxVQUFVLEVBQUUsQ0FBQztZQUN2RSxPQUFxQixLQUFNLENBQUMsYUFBYSxFQUFFLEtBQUssWUFBWSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUM7UUFDckYsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7SUFDRixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixZQUFZLENBQUMsS0FBYztRQUMxQyxJQUFJLEtBQUssSUFBSSxPQUFxQixLQUFNLENBQUMsYUFBYSxLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQ3ZFLE9BQXFCLEtBQU0sQ0FBQyxhQUFhLEVBQUUsS0FBSyxZQUFZLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQztRQUNyRixDQUFDO2FBQU0sQ0FBQztZQUNQLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztJQUNGLENBQUM7SUFFRDs7T0FFRztJQUNILFNBQWdCLGlCQUFpQixDQUFDLEtBQWM7UUFDL0MsT0FBTyxDQUFDLENBQUMsS0FBSztlQUNWLE9BQU8sS0FBSyxLQUFLLFFBQVE7ZUFDekIsT0FBMkMsS0FBTSxDQUFDLHVCQUF1QixLQUFLLFVBQVUsQ0FBQztJQUU5RixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixhQUFhLENBQUMsS0FBYztRQUMzQyxJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3pCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDekIsT0FBTyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNsQyxDQUFDO1FBRUQsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztZQUN0RSxPQUFPLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztRQUMvQixDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixVQUFVLENBQUMsS0FBVTtRQUNwQyxJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNoRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMifQ==