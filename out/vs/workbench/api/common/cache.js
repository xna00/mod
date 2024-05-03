/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Cache = void 0;
    class Cache {
        static { this.enableDebugLogging = false; }
        constructor(id) {
            this.id = id;
            this._data = new Map();
            this._idPool = 1;
        }
        add(item) {
            const id = this._idPool++;
            this._data.set(id, item);
            this.logDebugInfo();
            return id;
        }
        get(pid, id) {
            return this._data.has(pid) ? this._data.get(pid)[id] : undefined;
        }
        delete(id) {
            this._data.delete(id);
            this.logDebugInfo();
        }
        logDebugInfo() {
            if (!Cache.enableDebugLogging) {
                return;
            }
            console.log(`${this.id} cache size - ${this._data.size}`);
        }
    }
    exports.Cache = Cache;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2NhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUVoRyxNQUFhLEtBQUs7aUJBRU8sdUJBQWtCLEdBQUcsS0FBSyxBQUFSLENBQVM7UUFLbkQsWUFDa0IsRUFBVTtZQUFWLE9BQUUsR0FBRixFQUFFLENBQVE7WUFKWCxVQUFLLEdBQUcsSUFBSSxHQUFHLEVBQXdCLENBQUM7WUFDakQsWUFBTyxHQUFHLENBQUMsQ0FBQztRQUloQixDQUFDO1FBRUwsR0FBRyxDQUFDLElBQWtCO1lBQ3JCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMxQixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3BCLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVELEdBQUcsQ0FBQyxHQUFXLEVBQUUsRUFBVTtZQUMxQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ25FLENBQUM7UUFFRCxNQUFNLENBQUMsRUFBVTtZQUNoQixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN0QixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDckIsQ0FBQztRQUVPLFlBQVk7WUFDbkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUMvQixPQUFPO1lBQ1IsQ0FBQztZQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxpQkFBaUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNELENBQUM7O0lBaENGLHNCQWlDQyJ9