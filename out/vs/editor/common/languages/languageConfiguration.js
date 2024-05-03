/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AutoClosingPairs = exports.StandardAutoClosingPairConditional = exports.IndentAction = void 0;
    /**
     * Describes what to do with the indentation when pressing Enter.
     */
    var IndentAction;
    (function (IndentAction) {
        /**
         * Insert new line and copy the previous line's indentation.
         */
        IndentAction[IndentAction["None"] = 0] = "None";
        /**
         * Insert new line and indent once (relative to the previous line's indentation).
         */
        IndentAction[IndentAction["Indent"] = 1] = "Indent";
        /**
         * Insert two new lines:
         *  - the first one indented which will hold the cursor
         *  - the second one at the same indentation level
         */
        IndentAction[IndentAction["IndentOutdent"] = 2] = "IndentOutdent";
        /**
         * Insert new line and outdent once (relative to the previous line's indentation).
         */
        IndentAction[IndentAction["Outdent"] = 3] = "Outdent";
    })(IndentAction || (exports.IndentAction = IndentAction = {}));
    /**
     * @internal
     */
    class StandardAutoClosingPairConditional {
        constructor(source) {
            this._neutralCharacter = null;
            this._neutralCharacterSearched = false;
            this.open = source.open;
            this.close = source.close;
            // initially allowed in all tokens
            this._inString = true;
            this._inComment = true;
            this._inRegEx = true;
            if (Array.isArray(source.notIn)) {
                for (let i = 0, len = source.notIn.length; i < len; i++) {
                    const notIn = source.notIn[i];
                    switch (notIn) {
                        case 'string':
                            this._inString = false;
                            break;
                        case 'comment':
                            this._inComment = false;
                            break;
                        case 'regex':
                            this._inRegEx = false;
                            break;
                    }
                }
            }
        }
        isOK(standardToken) {
            switch (standardToken) {
                case 0 /* StandardTokenType.Other */:
                    return true;
                case 1 /* StandardTokenType.Comment */:
                    return this._inComment;
                case 2 /* StandardTokenType.String */:
                    return this._inString;
                case 3 /* StandardTokenType.RegEx */:
                    return this._inRegEx;
            }
        }
        shouldAutoClose(context, column) {
            // Always complete on empty line
            if (context.getTokenCount() === 0) {
                return true;
            }
            const tokenIndex = context.findTokenIndexAtOffset(column - 2);
            const standardTokenType = context.getStandardTokenType(tokenIndex);
            return this.isOK(standardTokenType);
        }
        _findNeutralCharacterInRange(fromCharCode, toCharCode) {
            for (let charCode = fromCharCode; charCode <= toCharCode; charCode++) {
                const character = String.fromCharCode(charCode);
                if (!this.open.includes(character) && !this.close.includes(character)) {
                    return character;
                }
            }
            return null;
        }
        /**
         * Find a character in the range [0-9a-zA-Z] that does not appear in the open or close
         */
        findNeutralCharacter() {
            if (!this._neutralCharacterSearched) {
                this._neutralCharacterSearched = true;
                if (!this._neutralCharacter) {
                    this._neutralCharacter = this._findNeutralCharacterInRange(48 /* CharCode.Digit0 */, 57 /* CharCode.Digit9 */);
                }
                if (!this._neutralCharacter) {
                    this._neutralCharacter = this._findNeutralCharacterInRange(97 /* CharCode.a */, 122 /* CharCode.z */);
                }
                if (!this._neutralCharacter) {
                    this._neutralCharacter = this._findNeutralCharacterInRange(65 /* CharCode.A */, 90 /* CharCode.Z */);
                }
            }
            return this._neutralCharacter;
        }
    }
    exports.StandardAutoClosingPairConditional = StandardAutoClosingPairConditional;
    /**
     * @internal
     */
    class AutoClosingPairs {
        constructor(autoClosingPairs) {
            this.autoClosingPairsOpenByStart = new Map();
            this.autoClosingPairsOpenByEnd = new Map();
            this.autoClosingPairsCloseByStart = new Map();
            this.autoClosingPairsCloseByEnd = new Map();
            this.autoClosingPairsCloseSingleChar = new Map();
            for (const pair of autoClosingPairs) {
                appendEntry(this.autoClosingPairsOpenByStart, pair.open.charAt(0), pair);
                appendEntry(this.autoClosingPairsOpenByEnd, pair.open.charAt(pair.open.length - 1), pair);
                appendEntry(this.autoClosingPairsCloseByStart, pair.close.charAt(0), pair);
                appendEntry(this.autoClosingPairsCloseByEnd, pair.close.charAt(pair.close.length - 1), pair);
                if (pair.close.length === 1 && pair.open.length === 1) {
                    appendEntry(this.autoClosingPairsCloseSingleChar, pair.close, pair);
                }
            }
        }
    }
    exports.AutoClosingPairs = AutoClosingPairs;
    function appendEntry(target, key, value) {
        if (target.has(key)) {
            target.get(key).push(value);
        }
        else {
            target.set(key, [value]);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VDb25maWd1cmF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2xhbmd1YWdlcy9sYW5ndWFnZUNvbmZpZ3VyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBeU1oRzs7T0FFRztJQUNILElBQVksWUFtQlg7SUFuQkQsV0FBWSxZQUFZO1FBQ3ZCOztXQUVHO1FBQ0gsK0NBQVEsQ0FBQTtRQUNSOztXQUVHO1FBQ0gsbURBQVUsQ0FBQTtRQUNWOzs7O1dBSUc7UUFDSCxpRUFBaUIsQ0FBQTtRQUNqQjs7V0FFRztRQUNILHFEQUFXLENBQUE7SUFDWixDQUFDLEVBbkJXLFlBQVksNEJBQVosWUFBWSxRQW1CdkI7SUEwQ0Q7O09BRUc7SUFDSCxNQUFhLGtDQUFrQztRQVU5QyxZQUFZLE1BQW1DO1lBSHZDLHNCQUFpQixHQUFrQixJQUFJLENBQUM7WUFDeEMsOEJBQXlCLEdBQVksS0FBSyxDQUFDO1lBR2xELElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFFMUIsa0NBQWtDO1lBQ2xDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBRXJCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDakMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FB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