/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/cursorColumns"], function (require, exports, strings, cursorColumns_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.normalizeIndentation = normalizeIndentation;
    function _normalizeIndentationFromWhitespace(str, indentSize, insertSpaces) {
        let spacesCnt = 0;
        for (let i = 0; i < str.length; i++) {
            if (str.charAt(i) === '\t') {
                spacesCnt = cursorColumns_1.CursorColumns.nextIndentTabStop(spacesCnt, indentSize);
            }
            else {
                spacesCnt++;
            }
        }
        let result = '';
        if (!insertSpaces) {
            const tabsCnt = Math.floor(spacesCnt / indentSize);
            spacesCnt = spacesCnt % indentSize;
            for (let i = 0; i < tabsCnt; i++) {
                result += '\t';
            }
        }
        for (let i = 0; i < spacesCnt; i++) {
            result += ' ';
        }
        return result;
    }
    function normalizeIndentation(str, indentSize, insertSpaces) {
        let firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(str);
        if (firstNonWhitespaceIndex === -1) {
            firstNonWhitespaceIndex = str.length;
        }
        return _normalizeIndentationFromWhitespace(str.substring(0, firstNonWhitespaceIndex), indentSize, insertSpaces) + str.substring(firstNonWhitespaceIndex);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50YXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY29yZS9pbmRlbnRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQStCaEcsb0RBTUM7SUFoQ0QsU0FBUyxtQ0FBbUMsQ0FBQyxHQUFXLEVBQUUsVUFBa0IsRUFBRSxZQUFxQjtRQUNsRyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNyQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzVCLFNBQVMsR0FBRyw2QkFBYSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNwRSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsU0FBUyxFQUFFLENBQUM7WUFDYixDQUFDO1FBQ0YsQ0FBQztRQUVELElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDbkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDLENBQUM7WUFDbkQsU0FBUyxHQUFHLFNBQVMsR0FBRyxVQUFVLENBQUM7WUFDbkMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsQyxNQUFNLElBQUksSUFBSSxDQUFDO1lBQ2hCLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sSUFBSSxHQUFHLENBQUM7UUFDZixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBZ0Isb0JBQW9CLENBQUMsR0FBVyxFQUFFLFVBQWtCLEVBQUUsWUFBcUI7UUFDMUYsSUFBSSx1QkFBdUIsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkUsSUFBSSx1QkFBdUIsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3BDLHVCQUF1QixHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7UUFDdEMsQ0FBQztRQUNELE9BQU8sbUNBQW1DLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsdUJBQXVCLENBQUMsRUFBRSxVQUFVLEVBQUUsWUFBWSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQzFKLENBQUMifQ==