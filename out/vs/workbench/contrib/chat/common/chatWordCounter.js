/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getNWords = getNWords;
    exports.countWords = countWords;
    const wordSeparatorCharPattern = /[\s\|\-]/;
    function getNWords(str, numWordsToCount) {
        let wordCount = numWordsToCount;
        let i = 0;
        while (i < str.length && wordCount > 0) {
            // Consume word separator chars
            while (i < str.length && str[i].match(wordSeparatorCharPattern)) {
                i++;
            }
            // Consume word chars
            while (i < str.length && !str[i].match(wordSeparatorCharPattern)) {
                i++;
            }
            wordCount--;
        }
        const value = str.substring(0, i);
        return {
            value,
            actualWordCount: numWordsToCount - wordCount,
            isFullString: i >= str.length
        };
    }
    function countWords(str) {
        const result = getNWords(str, Number.MAX_SAFE_INTEGER);
        return result.actualWordCount;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFdvcmRDb3VudGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2NvbW1vbi9jaGF0V29yZENvdW50ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsOEJBdUJDO0lBRUQsZ0NBR0M7SUFwQ0QsTUFBTSx3QkFBd0IsR0FBRyxVQUFVLENBQUM7SUFRNUMsU0FBZ0IsU0FBUyxDQUFDLEdBQVcsRUFBRSxlQUF1QjtRQUM3RCxJQUFJLFNBQVMsR0FBRyxlQUFlLENBQUM7UUFDaEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1YsT0FBTyxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDeEMsK0JBQStCO1lBQy9CLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pFLENBQUMsRUFBRSxDQUFDO1lBQ0wsQ0FBQztZQUVELHFCQUFxQjtZQUNyQixPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xFLENBQUMsRUFBRSxDQUFDO1lBQ0wsQ0FBQztZQUVELFNBQVMsRUFBRSxDQUFDO1FBQ2IsQ0FBQztRQUVELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLE9BQU87WUFDTixLQUFLO1lBQ0wsZUFBZSxFQUFFLGVBQWUsR0FBRyxTQUFTO1lBQzVDLFlBQVksRUFBRSxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU07U0FDN0IsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFnQixVQUFVLENBQUMsR0FBVztRQUNyQyxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3ZELE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBQztJQUMvQixDQUFDIn0=