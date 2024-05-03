/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languages"], function (require, exports, languages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullState = void 0;
    exports.nullTokenize = nullTokenize;
    exports.nullTokenizeEncoded = nullTokenizeEncoded;
    exports.NullState = new class {
        clone() {
            return this;
        }
        equals(other) {
            return (this === other);
        }
    };
    function nullTokenize(languageId, state) {
        return new languages_1.TokenizationResult([new languages_1.Token(0, '', languageId)], state);
    }
    function nullTokenizeEncoded(languageId, state) {
        const tokens = new Uint32Array(2);
        tokens[0] = 0;
        tokens[1] = ((languageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
            | (0 /* StandardTokenType.Other */ << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)
            | (0 /* FontStyle.None */ << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)
            | (1 /* ColorId.DefaultForeground */ << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
            | (2 /* ColorId.DefaultBackground */ << 24 /* MetadataConsts.BACKGROUND_OFFSET */)) >>> 0;
        return new languages_1.EncodedTokenizationResult(tokens, state === null ? exports.NullState : state);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbFRva2VuaXplLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2xhbmd1YWdlcy9udWxsVG9rZW5pemUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLG9DQUVDO0lBRUQsa0RBWUM7SUF6QlksUUFBQSxTQUFTLEdBQVcsSUFBSTtRQUM3QixLQUFLO1lBQ1gsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ00sTUFBTSxDQUFDLEtBQWE7WUFDMUIsT0FBTyxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQztRQUN6QixDQUFDO0tBQ0QsQ0FBQztJQUVGLFNBQWdCLFlBQVksQ0FBQyxVQUFrQixFQUFFLEtBQWE7UUFDN0QsT0FBTyxJQUFJLDhCQUFrQixDQUFDLENBQUMsSUFBSSxpQkFBSyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQsU0FBZ0IsbUJBQW1CLENBQUMsVUFBc0IsRUFBRSxLQUFvQjtRQUMvRSxNQUFNLE1BQU0sR0FBRyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQ1gsQ0FBQyxVQUFVLDRDQUFvQyxDQUFDO2NBQzlDLENBQUMsMkVBQTJELENBQUM7Y0FDN0QsQ0FBQyxtRUFBa0QsQ0FBQztjQUNwRCxDQUFDLDhFQUE2RCxDQUFDO2NBQy9ELENBQUMsOEVBQTZELENBQUMsQ0FDakUsS0FBSyxDQUFDLENBQUM7UUFFUixPQUFPLElBQUkscUNBQXlCLENBQUMsTUFBTSxFQUFFLEtBQUssS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlCQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xGLENBQUMifQ==