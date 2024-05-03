/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.notebookDebug = notebookDebug;
    // import * as DOM from 'vs/base/browser/dom';
    class NotebookLogger {
        constructor() {
            this._frameId = 0;
            this._domFrameLog();
        }
        _domFrameLog() {
            // DOM.scheduleAtNextAnimationFrame(() => {
            // 	this._frameId++;
            // 	this._domFrameLog();
            // }, 1000000);
        }
        debug(...args) {
            const date = new Date();
            console.log(`${date.getSeconds()}:${date.getMilliseconds().toString().padStart(3, '0')}`, `frame #${this._frameId}: `, ...args);
        }
    }
    const instance = new NotebookLogger();
    function notebookDebug(...args) {
        instance.debug(...args);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tMb2dnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvbm90ZWJvb2tMb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF3QmhHLHNDQUVDO0lBeEJELDhDQUE4QztJQUU5QyxNQUFNLGNBQWM7UUFDbkI7WUFHUSxhQUFRLEdBQUcsQ0FBQyxDQUFDO1lBRnBCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBRU8sWUFBWTtZQUNuQiwyQ0FBMkM7WUFDM0Msb0JBQW9CO1lBRXBCLHdCQUF3QjtZQUN4QixlQUFlO1FBQ2hCLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxJQUFXO1lBQ25CLE1BQU0sSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLFVBQVUsSUFBSSxDQUFDLFFBQVEsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDakksQ0FBQztLQUNEO0lBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztJQUN0QyxTQUFnQixhQUFhLENBQUMsR0FBRyxJQUFXO1FBQzNDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUN6QixDQUFDIn0=