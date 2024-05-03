/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range"], function (require, exports, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditOperation = void 0;
    class EditOperation {
        static insert(position, text) {
            return {
                range: new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: text,
                forceMoveMarkers: true
            };
        }
        static delete(range) {
            return {
                range: range,
                text: null
            };
        }
        static replace(range, text) {
            return {
                range: range,
                text: text
            };
        }
        static replaceMove(range, text) {
            return {
                range: range,
                text: text,
                forceMoveMarkers: true
            };
        }
    }
    exports.EditOperation = EditOperation;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdE9wZXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb3JlL2VkaXRPcGVyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBeUJoRyxNQUFhLGFBQWE7UUFFbEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFrQixFQUFFLElBQVk7WUFDcEQsT0FBTztnQkFDTixLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQztnQkFDNUYsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsZ0JBQWdCLEVBQUUsSUFBSTthQUN0QixDQUFDO1FBQ0gsQ0FBQztRQUVNLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBWTtZQUNoQyxPQUFPO2dCQUNOLEtBQUssRUFBRSxLQUFLO2dCQUNaLElBQUksRUFBRSxJQUFJO2FBQ1YsQ0FBQztRQUNILENBQUM7UUFFTSxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQVksRUFBRSxJQUFtQjtZQUN0RCxPQUFPO2dCQUNOLEtBQUssRUFBRSxLQUFLO2dCQUNaLElBQUksRUFBRSxJQUFJO2FBQ1YsQ0FBQztRQUNILENBQUM7UUFFTSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQVksRUFBRSxJQUFtQjtZQUMxRCxPQUFPO2dCQUNOLEtBQUssRUFBRSxLQUFLO2dCQUNaLElBQUksRUFBRSxJQUFJO2dCQUNWLGdCQUFnQixFQUFFLElBQUk7YUFDdEIsQ0FBQztRQUNILENBQUM7S0FDRDtJQS9CRCxzQ0ErQkMifQ==