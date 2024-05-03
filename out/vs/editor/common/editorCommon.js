/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Handler = exports.EditorType = exports.ScrollType = void 0;
    exports.isThemeColor = isThemeColor;
    var ScrollType;
    (function (ScrollType) {
        ScrollType[ScrollType["Smooth"] = 0] = "Smooth";
        ScrollType[ScrollType["Immediate"] = 1] = "Immediate";
    })(ScrollType || (exports.ScrollType = ScrollType = {}));
    /**
     * @internal
     */
    function isThemeColor(o) {
        return o && typeof o.id === 'string';
    }
    /**
     * The type of the `IEditor`.
     */
    exports.EditorType = {
        ICodeEditor: 'vs.editor.ICodeEditor',
        IDiffEditor: 'vs.editor.IDiffEditor'
    };
    /**
     * Built-in commands.
     * @internal
     */
    var Handler;
    (function (Handler) {
        Handler["CompositionStart"] = "compositionStart";
        Handler["CompositionEnd"] = "compositionEnd";
        Handler["Type"] = "type";
        Handler["ReplacePreviousChar"] = "replacePreviousChar";
        Handler["CompositionType"] = "compositionType";
        Handler["Paste"] = "paste";
        Handler["Cut"] = "cut";
    })(Handler || (exports.Handler = Handler = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQ29tbW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2VkaXRvckNvbW1vbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1bEJoRyxvQ0FFQztJQTlZRCxJQUFrQixVQUdqQjtJQUhELFdBQWtCLFVBQVU7UUFDM0IsK0NBQVUsQ0FBQTtRQUNWLHFEQUFhLENBQUE7SUFDZCxDQUFDLEVBSGlCLFVBQVUsMEJBQVYsVUFBVSxRQUczQjtJQXNZRDs7T0FFRztJQUNILFNBQWdCLFlBQVksQ0FBQyxDQUFNO1FBQ2xDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLEVBQUUsS0FBSyxRQUFRLENBQUM7SUFDdEMsQ0FBQztJQTBIRDs7T0FFRztJQUNVLFFBQUEsVUFBVSxHQUFHO1FBQ3pCLFdBQVcsRUFBRSx1QkFBdUI7UUFDcEMsV0FBVyxFQUFFLHVCQUF1QjtLQUNwQyxDQUFDO0lBRUY7OztPQUdHO0lBQ0gsSUFBa0IsT0FRakI7SUFSRCxXQUFrQixPQUFPO1FBQ3hCLGdEQUFxQyxDQUFBO1FBQ3JDLDRDQUFpQyxDQUFBO1FBQ2pDLHdCQUFhLENBQUE7UUFDYixzREFBMkMsQ0FBQTtRQUMzQyw4Q0FBbUMsQ0FBQTtRQUNuQywwQkFBZSxDQUFBO1FBQ2Ysc0JBQVcsQ0FBQTtJQUNaLENBQUMsRUFSaUIsT0FBTyx1QkFBUCxPQUFPLFFBUXhCIn0=