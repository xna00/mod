/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultGenerator = exports.IdGenerator = void 0;
    class IdGenerator {
        constructor(prefix) {
            this._prefix = prefix;
            this._lastId = 0;
        }
        nextId() {
            return this._prefix + (++this._lastId);
        }
    }
    exports.IdGenerator = IdGenerator;
    exports.defaultGenerator = new IdGenerator('id#');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRHZW5lcmF0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2lkR2VuZXJhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUVoRyxNQUFhLFdBQVc7UUFLdkIsWUFBWSxNQUFjO1lBQ3pCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLENBQUM7UUFFTSxNQUFNO1lBQ1osT0FBTyxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsQ0FBQztLQUNEO0lBYkQsa0NBYUM7SUFFWSxRQUFBLGdCQUFnQixHQUFHLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDIn0=