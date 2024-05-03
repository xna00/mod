/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.randomPort = randomPort;
    /**
     * @returns Returns a random port between 1025 and 65535.
     */
    function randomPort() {
        const min = 1025;
        const max = 65535;
        return min + Math.floor((max - min) * Math.random());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3BvcnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBS2hHLGdDQUlDO0lBUEQ7O09BRUc7SUFDSCxTQUFnQixVQUFVO1FBQ3pCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQztRQUNqQixNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUM7UUFDbEIsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUN0RCxDQUFDIn0=