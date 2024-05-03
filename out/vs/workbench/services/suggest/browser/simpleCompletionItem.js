/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/filters"], function (require, exports, filters_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleCompletionItem = void 0;
    class SimpleCompletionItem {
        constructor(completion) {
            this.completion = completion;
            // sorting, filtering
            this.score = filters_1.FuzzyScore.Default;
            // ensure lower-variants (perf)
            this.labelLow = this.completion.label.toLowerCase();
        }
    }
    exports.SimpleCompletionItem = SimpleCompletionItem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlQ29tcGxldGlvbkl0ZW0uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zdWdnZXN0L2Jyb3dzZXIvc2ltcGxlQ29tcGxldGlvbkl0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0JoRyxNQUFhLG9CQUFvQjtRQVNoQyxZQUNVLFVBQTZCO1lBQTdCLGVBQVUsR0FBVixVQUFVLENBQW1CO1lBTnZDLHFCQUFxQjtZQUNyQixVQUFLLEdBQWUsb0JBQVUsQ0FBQyxPQUFPLENBQUM7WUFPdEMsK0JBQStCO1lBQy9CLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDckQsQ0FBQztLQUNEO0lBZkQsb0RBZUMifQ==