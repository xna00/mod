/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/textEdit", "vs/editor/common/core/textLength"], function (require, exports, textEdit_1, textLength_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextModelText = void 0;
    class TextModelText extends textEdit_1.AbstractText {
        constructor(_textModel) {
            super();
            this._textModel = _textModel;
        }
        getValueOfRange(range) {
            return this._textModel.getValueInRange(range);
        }
        get length() {
            const lastLineNumber = this._textModel.getLineCount();
            const lastLineLen = this._textModel.getLineLength(lastLineNumber);
            return new textLength_1.TextLength(lastLineNumber - 1, lastLineLen);
        }
    }
    exports.TextModelText = TextModelText;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsVGV4dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC90ZXh0TW9kZWxUZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxNQUFhLGFBQWMsU0FBUSx1QkFBWTtRQUM5QyxZQUE2QixVQUFzQjtZQUNsRCxLQUFLLEVBQUUsQ0FBQztZQURvQixlQUFVLEdBQVYsVUFBVSxDQUFZO1FBRW5ELENBQUM7UUFFRCxlQUFlLENBQUMsS0FBWTtZQUMzQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCxJQUFJLE1BQU07WUFDVCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3RELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ2xFLE9BQU8sSUFBSSx1QkFBVSxDQUFDLGNBQWMsR0FBRyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDeEQsQ0FBQztLQUNEO0lBZEQsc0NBY0MifQ==