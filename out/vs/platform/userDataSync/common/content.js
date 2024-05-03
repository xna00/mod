/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/jsonEdit"], function (require, exports, jsonEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.edit = edit;
    exports.getLineStartOffset = getLineStartOffset;
    exports.getLineEndOffset = getLineEndOffset;
    function edit(content, originalPath, value, formattingOptions) {
        const edit = (0, jsonEdit_1.setProperty)(content, originalPath, value, formattingOptions)[0];
        if (edit) {
            content = content.substring(0, edit.offset) + edit.content + content.substring(edit.offset + edit.length);
        }
        return content;
    }
    function getLineStartOffset(content, eol, atOffset) {
        let lineStartingOffset = atOffset;
        while (lineStartingOffset >= 0) {
            if (content.charAt(lineStartingOffset) === eol.charAt(eol.length - 1)) {
                if (eol.length === 1) {
                    return lineStartingOffset + 1;
                }
            }
            lineStartingOffset--;
            if (eol.length === 2) {
                if (lineStartingOffset >= 0 && content.charAt(lineStartingOffset) === eol.charAt(0)) {
                    return lineStartingOffset + 2;
                }
            }
        }
        return 0;
    }
    function getLineEndOffset(content, eol, atOffset) {
        let lineEndOffset = atOffset;
        while (lineEndOffset >= 0) {
            if (content.charAt(lineEndOffset) === eol.charAt(eol.length - 1)) {
                if (eol.length === 1) {
                    return lineEndOffset;
                }
            }
            lineEndOffset++;
            if (eol.length === 2) {
                if (lineEndOffset >= 0 && content.charAt(lineEndOffset) === eol.charAt(1)) {
                    return lineEndOffset;
                }
            }
        }
        return content.length - 1;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL2NvbW1vbi9jb250ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLG9CQU1DO0lBRUQsZ0RBZ0JDO0lBRUQsNENBZ0JDO0lBMUNELFNBQWdCLElBQUksQ0FBQyxPQUFlLEVBQUUsWUFBc0IsRUFBRSxLQUFVLEVBQUUsaUJBQW9DO1FBQzdHLE1BQU0sSUFBSSxHQUFHLElBQUEsc0JBQVcsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdFLElBQUksSUFBSSxFQUFFLENBQUM7WUFDVixPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzRyxDQUFDO1FBQ0QsT0FBTyxPQUFPLENBQUM7SUFDaEIsQ0FBQztJQUVELFNBQWdCLGtCQUFrQixDQUFDLE9BQWUsRUFBRSxHQUFXLEVBQUUsUUFBZ0I7UUFDaEYsSUFBSSxrQkFBa0IsR0FBRyxRQUFRLENBQUM7UUFDbEMsT0FBTyxrQkFBa0IsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNoQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDdkUsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN0QixPQUFPLGtCQUFrQixHQUFHLENBQUMsQ0FBQztnQkFDL0IsQ0FBQztZQUNGLENBQUM7WUFDRCxrQkFBa0IsRUFBRSxDQUFDO1lBQ3JCLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxrQkFBa0IsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDckYsT0FBTyxrQkFBa0IsR0FBRyxDQUFDLENBQUM7Z0JBQy9CLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztJQUVELFNBQWdCLGdCQUFnQixDQUFDLE9BQWUsRUFBRSxHQUFXLEVBQUUsUUFBZ0I7UUFDOUUsSUFBSSxhQUFhLEdBQUcsUUFBUSxDQUFDO1FBQzdCLE9BQU8sYUFBYSxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzNCLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbEUsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN0QixPQUFPLGFBQWEsQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUM7WUFDRCxhQUFhLEVBQUUsQ0FBQztZQUNoQixJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksYUFBYSxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDM0UsT0FBTyxhQUFhLENBQUM7Z0JBQ3RCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDM0IsQ0FBQyJ9