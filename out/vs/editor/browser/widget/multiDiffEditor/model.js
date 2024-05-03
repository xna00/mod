/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConstLazyPromise = void 0;
    class ConstLazyPromise {
        constructor(_value) {
            this._value = _value;
            this.onHasValueDidChange = event_1.Event.None;
        }
        request() {
            return Promise.resolve(this._value);
        }
        get value() {
            return this._value;
        }
    }
    exports.ConstLazyPromise = ConstLazyPromise;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9tdWx0aURpZmZFZGl0b3IvbW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUJoRyxNQUFhLGdCQUFnQjtRQUc1QixZQUNrQixNQUFTO1lBQVQsV0FBTSxHQUFOLE1BQU0sQ0FBRztZQUhYLHdCQUFtQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7UUFJN0MsQ0FBQztRQUVFLE9BQU87WUFDYixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxJQUFXLEtBQUs7WUFDZixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztLQUNEO0lBZEQsNENBY0MifQ==