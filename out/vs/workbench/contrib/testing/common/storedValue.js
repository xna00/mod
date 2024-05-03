/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/storage/common/storage"], function (require, exports, lifecycle_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StoredValue = void 0;
    const defaultSerialization = {
        deserialize: d => JSON.parse(d),
        serialize: d => JSON.stringify(d),
    };
    /**
     * todo@connor4312: is this worthy to be in common?
     */
    let StoredValue = class StoredValue extends lifecycle_1.Disposable {
        constructor(options, storage) {
            super();
            this.storage = storage;
            this.key = options.key;
            this.scope = options.scope;
            this.target = options.target;
            this.serialization = options.serialization ?? defaultSerialization;
            this.onDidChange = this.storage.onDidChangeValue(this.scope, this.key, this._register(new lifecycle_1.DisposableStore()));
        }
        get(defaultValue) {
            if (this.value === undefined) {
                const value = this.storage.get(this.key, this.scope);
                this.value = value === undefined ? defaultValue : this.serialization.deserialize(value);
            }
            return this.value;
        }
        /**
         * Persists changes to the value.
         * @param value
         */
        store(value) {
            this.value = value;
            this.storage.store(this.key, this.serialization.serialize(value), this.scope, this.target);
        }
        /**
         * Delete an element stored under the provided key from storage.
         */
        delete() {
            this.storage.remove(this.key, this.scope);
        }
    };
    exports.StoredValue = StoredValue;
    exports.StoredValue = StoredValue = __decorate([
        __param(1, storage_1.IStorageService)
    ], StoredValue);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmVkVmFsdWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvY29tbW9uL3N0b3JlZFZhbHVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVdoRyxNQUFNLG9CQUFvQixHQUFtQztRQUM1RCxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMvQixTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztLQUNqQyxDQUFDO0lBU0Y7O09BRUc7SUFDSSxJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFlLFNBQVEsc0JBQVU7UUFZN0MsWUFDQyxPQUErQixFQUNHLE9BQXdCO1lBRTFELEtBQUssRUFBRSxDQUFDO1lBRjBCLFlBQU8sR0FBUCxPQUFPLENBQWlCO1lBSTFELElBQUksQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUN2QixJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDM0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQzdCLElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsSUFBSSxvQkFBb0IsQ0FBQztZQUNuRSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9HLENBQUM7UUFZTSxHQUFHLENBQUMsWUFBZ0I7WUFDMUIsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDckQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVEOzs7V0FHRztRQUNJLEtBQUssQ0FBQyxLQUFRO1lBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUYsQ0FBQztRQUVEOztXQUVHO1FBQ0ksTUFBTTtZQUNaLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNDLENBQUM7S0FDRCxDQUFBO0lBM0RZLGtDQUFXOzBCQUFYLFdBQVc7UUFjckIsV0FBQSx5QkFBZSxDQUFBO09BZEwsV0FBVyxDQTJEdkIifQ==