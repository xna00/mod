/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeIndentLevel = computeIndentLevel;
    /**
     * Returns:
     *  - -1 => the line consists of whitespace
     *  - otherwise => the indent level is returned value
     */
    function computeIndentLevel(line, tabSize) {
        let indent = 0;
        let i = 0;
        const len = line.length;
        while (i < len) {
            const chCode = line.charCodeAt(i);
            if (chCode === 32 /* CharCode.Space */) {
                indent++;
            }
            else if (chCode === 9 /* CharCode.Tab */) {
                indent = indent - indent % tabSize + tabSize;
            }
            else {
                break;
            }
            i++;
        }
        if (i === len) {
            return -1; // line only consists of whitespace
        }
        return indent;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsZ0RBc0JDO0lBM0JEOzs7O09BSUc7SUFDSCxTQUFnQixrQkFBa0IsQ0FBQyxJQUFZLEVBQUUsT0FBZTtRQUMvRCxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDZixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBRXhCLE9BQU8sQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEMsSUFBSSxNQUFNLDRCQUFtQixFQUFFLENBQUM7Z0JBQy9CLE1BQU0sRUFBRSxDQUFDO1lBQ1YsQ0FBQztpQkFBTSxJQUFJLE1BQU0seUJBQWlCLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUM5QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTTtZQUNQLENBQUM7WUFDRCxDQUFDLEVBQUUsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQ0FBbUM7UUFDL0MsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyJ9