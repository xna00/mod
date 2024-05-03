/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/keyCodes", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/standalone/standaloneEnums"], function (require, exports, cancellation_1, event_1, keyCodes_1, uri_1, position_1, range_1, selection_1, languages_1, standaloneEnums) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyMod = void 0;
    exports.createMonacoBaseAPI = createMonacoBaseAPI;
    class KeyMod {
        static { this.CtrlCmd = 2048 /* ConstKeyMod.CtrlCmd */; }
        static { this.Shift = 1024 /* ConstKeyMod.Shift */; }
        static { this.Alt = 512 /* ConstKeyMod.Alt */; }
        static { this.WinCtrl = 256 /* ConstKeyMod.WinCtrl */; }
        static chord(firstPart, secondPart) {
            return (0, keyCodes_1.KeyChord)(firstPart, secondPart);
        }
    }
    exports.KeyMod = KeyMod;
    function createMonacoBaseAPI() {
        return {
            editor: undefined, // undefined override expected here
            languages: undefined, // undefined override expected here
            CancellationTokenSource: cancellation_1.CancellationTokenSource,
            Emitter: event_1.Emitter,
            KeyCode: standaloneEnums.KeyCode,
            KeyMod: KeyMod,
            Position: position_1.Position,
            Range: range_1.Range,
            Selection: selection_1.Selection,
            SelectionDirection: standaloneEnums.SelectionDirection,
            MarkerSeverity: standaloneEnums.MarkerSeverity,
            MarkerTag: standaloneEnums.MarkerTag,
            Uri: uri_1.URI,
            Token: languages_1.Token
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQmFzZUFwaS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9zZXJ2aWNlcy9lZGl0b3JCYXNlQXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXVCaEcsa0RBaUJDO0lBNUJELE1BQWEsTUFBTTtpQkFDSyxZQUFPLGtDQUErQjtpQkFDdEMsVUFBSyxnQ0FBNkI7aUJBQ2xDLFFBQUcsNkJBQTJCO2lCQUM5QixZQUFPLGlDQUErQjtRQUV0RCxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQWlCLEVBQUUsVUFBa0I7WUFDeEQsT0FBTyxJQUFBLG1CQUFRLEVBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7O0lBUkYsd0JBU0M7SUFFRCxTQUFnQixtQkFBbUI7UUFDbEMsT0FBTztZQUNOLE1BQU0sRUFBRSxTQUFVLEVBQUUsbUNBQW1DO1lBQ3ZELFNBQVMsRUFBRSxTQUFVLEVBQUUsbUNBQW1DO1lBQzFELHVCQUF1QixFQUFFLHNDQUF1QjtZQUNoRCxPQUFPLEVBQUUsZUFBTztZQUNoQixPQUFPLEVBQUUsZUFBZSxDQUFDLE9BQU87WUFDaEMsTUFBTSxFQUFFLE1BQU07WUFDZCxRQUFRLEVBQUUsbUJBQVE7WUFDbEIsS0FBSyxFQUFFLGFBQUs7WUFDWixTQUFTLEVBQU8scUJBQVM7WUFDekIsa0JBQWtCLEVBQUUsZUFBZSxDQUFDLGtCQUFrQjtZQUN0RCxjQUFjLEVBQUUsZUFBZSxDQUFDLGNBQWM7WUFDOUMsU0FBUyxFQUFFLGVBQWUsQ0FBQyxTQUFTO1lBQ3BDLEdBQUcsRUFBTyxTQUFHO1lBQ2IsS0FBSyxFQUFFLGlCQUFLO1NBQ1osQ0FBQztJQUNILENBQUMifQ==