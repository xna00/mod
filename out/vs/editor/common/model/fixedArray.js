/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays"], function (require, exports, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FixedArray = void 0;
    /**
     * An array that avoids being sparse by always
     * filling up unused indices with a default value.
     */
    class FixedArray {
        constructor(_default) {
            this._default = _default;
            this._store = [];
        }
        get(index) {
            if (index < this._store.length) {
                return this._store[index];
            }
            return this._default;
        }
        set(index, value) {
            while (index >= this._store.length) {
                this._store[this._store.length] = this._default;
            }
            this._store[index] = value;
        }
        replace(index, oldLength, newLength) {
            if (index >= this._store.length) {
                return;
            }
            if (oldLength === 0) {
                this.insert(index, newLength);
                return;
            }
            else if (newLength === 0) {
                this.delete(index, oldLength);
                return;
            }
            const before = this._store.slice(0, index);
            const after = this._store.slice(index + oldLength);
            const insertArr = arrayFill(newLength, this._default);
            this._store = before.concat(insertArr, after);
        }
        delete(deleteIndex, deleteCount) {
            if (deleteCount === 0 || deleteIndex >= this._store.length) {
                return;
            }
            this._store.splice(deleteIndex, deleteCount);
        }
        insert(insertIndex, insertCount) {
            if (insertCount === 0 || insertIndex >= this._store.length) {
                return;
            }
            const arr = [];
            for (let i = 0; i < insertCount; i++) {
                arr[i] = this._default;
            }
            this._store = (0, arrays_1.arrayInsert)(this._store, insertIndex, arr);
        }
    }
    exports.FixedArray = FixedArray;
    function arrayFill(length, value) {
        const arr = [];
        for (let i = 0; i < length; i++) {
            arr[i] = value;
        }
        return arr;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4ZWRBcnJheS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9maXhlZEFycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRzs7O09BR0c7SUFDSCxNQUFhLFVBQVU7UUFHdEIsWUFDa0IsUUFBVztZQUFYLGFBQVEsR0FBUixRQUFRLENBQUc7WUFIckIsV0FBTSxHQUFRLEVBQUUsQ0FBQztRQUlyQixDQUFDO1FBRUUsR0FBRyxDQUFDLEtBQWE7WUFDdkIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVNLEdBQUcsQ0FBQyxLQUFhLEVBQUUsS0FBUTtZQUNqQyxPQUFPLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNqRCxDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDNUIsQ0FBQztRQUVNLE9BQU8sQ0FBQyxLQUFhLEVBQUUsU0FBaUIsRUFBRSxTQUFpQjtZQUNqRSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNqQyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksU0FBUyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDOUIsT0FBTztZQUNSLENBQUM7aUJBQU0sSUFBSSxTQUFTLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUM5QixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMzQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDLENBQUM7WUFDbkQsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRU0sTUFBTSxDQUFDLFdBQW1CLEVBQUUsV0FBbUI7WUFDckQsSUFBSSxXQUFXLEtBQUssQ0FBQyxJQUFJLFdBQVcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM1RCxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRU0sTUFBTSxDQUFDLFdBQW1CLEVBQUUsV0FBbUI7WUFDckQsSUFBSSxXQUFXLEtBQUssQ0FBQyxJQUFJLFdBQVcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM1RCxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFRLEVBQUUsQ0FBQztZQUNwQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3RDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3hCLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUEsb0JBQVcsRUFBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMxRCxDQUFDO0tBQ0Q7SUF6REQsZ0NBeURDO0lBRUQsU0FBUyxTQUFTLENBQUksTUFBYyxFQUFFLEtBQVE7UUFDN0MsTUFBTSxHQUFHLEdBQVEsRUFBRSxDQUFDO1FBQ3BCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNqQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ2hCLENBQUM7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNaLENBQUMifQ==