/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockObjectTree = void 0;
    const someEvent = new event_1.Emitter().event;
    /**
     * Add stub methods as needed
     */
    class MockObjectTree {
        get onDidChangeFocus() { return someEvent; }
        get onDidChangeSelection() { return someEvent; }
        get onDidOpen() { return someEvent; }
        get onMouseClick() { return someEvent; }
        get onMouseDblClick() { return someEvent; }
        get onContextMenu() { return someEvent; }
        get onKeyDown() { return someEvent; }
        get onKeyUp() { return someEvent; }
        get onKeyPress() { return someEvent; }
        get onDidFocus() { return someEvent; }
        get onDidBlur() { return someEvent; }
        get onDidChangeCollapseState() { return someEvent; }
        get onDidChangeRenderNodeCount() { return someEvent; }
        get onDidDispose() { return someEvent; }
        get lastVisibleElement() { return this.elements[this.elements.length - 1]; }
        constructor(elements) {
            this.elements = elements;
        }
        domFocus() { }
        collapse(location, recursive = false) {
            return true;
        }
        expand(location, recursive = false) {
            return true;
        }
        navigate(start) {
            const startIdx = start ? this.elements.indexOf(start) :
                undefined;
            return new ArrayNavigator(this.elements, startIdx);
        }
        getParentElement(elem) {
            return elem.parent();
        }
        dispose() {
        }
    }
    exports.MockObjectTree = MockObjectTree;
    class ArrayNavigator {
        constructor(elements, index = 0) {
            this.elements = elements;
            this.index = index;
        }
        current() {
            return this.elements[this.index];
        }
        previous() {
            return this.elements[--this.index];
        }
        first() {
            this.index = 0;
            return this.elements[this.index];
        }
        last() {
            this.index = this.elements.length - 1;
            return this.elements[this.index];
        }
        next() {
            return this.elements[++this.index];
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja1NlYXJjaFRyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC90ZXN0L2Jyb3dzZXIvbW9ja1NlYXJjaFRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQU0sU0FBUyxHQUFHLElBQUksZUFBTyxFQUFFLENBQUMsS0FBSyxDQUFDO0lBRXRDOztPQUVHO0lBQ0gsTUFBYSxjQUFjO1FBRTFCLElBQUksZ0JBQWdCLEtBQUssT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzVDLElBQUksb0JBQW9CLEtBQUssT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ2hELElBQUksU0FBUyxLQUFLLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUVyQyxJQUFJLFlBQVksS0FBSyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDeEMsSUFBSSxlQUFlLEtBQUssT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzNDLElBQUksYUFBYSxLQUFLLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUV6QyxJQUFJLFNBQVMsS0FBSyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDckMsSUFBSSxPQUFPLEtBQUssT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ25DLElBQUksVUFBVSxLQUFLLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUV0QyxJQUFJLFVBQVUsS0FBSyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDdEMsSUFBSSxTQUFTLEtBQUssT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBRXJDLElBQUksd0JBQXdCLEtBQUssT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksMEJBQTBCLEtBQUssT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBRXRELElBQUksWUFBWSxLQUFLLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN4QyxJQUFJLGtCQUFrQixLQUFLLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFNUUsWUFBb0IsUUFBZTtZQUFmLGFBQVEsR0FBUixRQUFRLENBQU87UUFBSSxDQUFDO1FBRXhDLFFBQVEsS0FBVyxDQUFDO1FBRXBCLFFBQVEsQ0FBQyxRQUFjLEVBQUUsWUFBcUIsS0FBSztZQUNsRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxNQUFNLENBQUMsUUFBYyxFQUFFLFlBQXFCLEtBQUs7WUFDaEQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsUUFBUSxDQUFDLEtBQVk7WUFDcEIsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxTQUFTLENBQUM7WUFFWCxPQUFPLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVELGdCQUFnQixDQUFDLElBQXFCO1lBQ3JDLE9BQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxPQUFPO1FBQ1AsQ0FBQztLQUNEO0lBaERELHdDQWdEQztJQUVELE1BQU0sY0FBYztRQUNuQixZQUFvQixRQUFhLEVBQVUsUUFBUSxDQUFDO1lBQWhDLGFBQVEsR0FBUixRQUFRLENBQUs7WUFBVSxVQUFLLEdBQUwsS0FBSyxDQUFJO1FBQUksQ0FBQztRQUV6RCxPQUFPO1lBQ04sT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsUUFBUTtZQUNQLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsS0FBSztZQUNKLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsSUFBSTtZQUNILElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELElBQUk7WUFDSCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEMsQ0FBQztLQUNEIn0=