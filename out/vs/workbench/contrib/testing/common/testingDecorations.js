/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiation"], function (require, exports, arrays_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITestingDecorationsService = exports.TestDecorations = void 0;
    class TestDecorations {
        constructor() {
            this.value = [];
        }
        /**
         * Adds a new value to the decorations.
         */
        push(value) {
            const searchIndex = (0, arrays_1.binarySearch)(this.value, value, (a, b) => a.line - b.line);
            this.value.splice(searchIndex < 0 ? ~searchIndex : searchIndex, 0, value);
        }
        /**
         * Gets decorations on each line.
         */
        *lines() {
            if (!this.value.length) {
                return;
            }
            let startIndex = 0;
            let startLine = this.value[0].line;
            for (let i = 1; i < this.value.length; i++) {
                const v = this.value[i];
                if (v.line !== startLine) {
                    yield [startLine, this.value.slice(startIndex, i)];
                    startLine = v.line;
                    startIndex = i;
                }
            }
            yield [startLine, this.value.slice(startIndex)];
        }
    }
    exports.TestDecorations = TestDecorations;
    exports.ITestingDecorationsService = (0, instantiation_1.createDecorator)('testingDecorationService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ0RlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi90ZXN0aW5nRGVjb3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBOERoRyxNQUFhLGVBQWU7UUFBNUI7WUFDUSxVQUFLLEdBQVEsRUFBRSxDQUFDO1FBOEJ4QixDQUFDO1FBN0JBOztXQUVHO1FBQ0ksSUFBSSxDQUFDLEtBQVE7WUFDbkIsTUFBTSxXQUFXLEdBQUcsSUFBQSxxQkFBWSxFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0UsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUVEOztXQUVHO1FBQ0ksQ0FBQyxLQUFLO1lBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM1QyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQzFCLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ25ELFNBQVMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUNuQixVQUFVLEdBQUcsQ0FBQyxDQUFDO2dCQUNoQixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNqRCxDQUFDO0tBQ0Q7SUEvQkQsMENBK0JDO0lBRVksUUFBQSwwQkFBMEIsR0FBRyxJQUFBLCtCQUFlLEVBQTZCLDBCQUEwQixDQUFDLENBQUMifQ==