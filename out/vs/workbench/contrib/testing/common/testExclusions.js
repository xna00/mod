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
define(["require", "exports", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/storedValue"], function (require, exports, iterator_1, lifecycle_1, storage_1, observableValue_1, storedValue_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestExclusions = void 0;
    let TestExclusions = class TestExclusions extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this.excluded = this._register(observableValue_1.MutableObservableValue.stored(this._register(new storedValue_1.StoredValue({
                key: 'excludedTestItems',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 1 /* StorageTarget.MACHINE */,
                serialization: {
                    deserialize: v => new Set(JSON.parse(v)),
                    serialize: v => JSON.stringify([...v])
                },
            }, this.storageService)), new Set()));
            /**
             * Event that fires when the excluded tests change.
             */
            this.onTestExclusionsChanged = this.excluded.onDidChange;
        }
        /**
         * Gets whether there's any excluded tests.
         */
        get hasAny() {
            return this.excluded.value.size > 0;
        }
        /**
         * Gets all excluded tests.
         */
        get all() {
            return this.excluded.value;
        }
        /**
         * Sets whether a test is excluded.
         */
        toggle(test, exclude) {
            if (exclude !== true && this.excluded.value.has(test.item.extId)) {
                this.excluded.value = new Set(iterator_1.Iterable.filter(this.excluded.value, e => e !== test.item.extId));
            }
            else if (exclude !== false && !this.excluded.value.has(test.item.extId)) {
                this.excluded.value = new Set([...this.excluded.value, test.item.extId]);
            }
        }
        /**
         * Gets whether a test is excluded.
         */
        contains(test) {
            return this.excluded.value.has(test.item.extId);
        }
        /**
         * Removes all test exclusions.
         */
        clear() {
            this.excluded.value = new Set();
        }
    };
    exports.TestExclusions = TestExclusions;
    exports.TestExclusions = TestExclusions = __decorate([
        __param(0, storage_1.IStorageService)
    ], TestExclusions);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEV4Y2x1c2lvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvY29tbW9uL3Rlc3RFeGNsdXNpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsc0JBQVU7UUFhN0MsWUFBNkIsY0FBZ0Q7WUFDNUUsS0FBSyxFQUFFLENBQUM7WUFEcUMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBWjVELGFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUN6Qyx3Q0FBc0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFXLENBQXNCO2dCQUNqRixHQUFHLEVBQUUsbUJBQW1CO2dCQUN4QixLQUFLLGdDQUF3QjtnQkFDN0IsTUFBTSwrQkFBdUI7Z0JBQzdCLGFBQWEsRUFBRTtvQkFDZCxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN4QyxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztpQkFDdEM7YUFDRCxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLElBQUksR0FBRyxFQUFFLENBQUMsQ0FDcEMsQ0FBQztZQU1GOztlQUVHO1lBQ2EsNEJBQXVCLEdBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDO1FBTHBGLENBQUM7UUFPRDs7V0FFRztRQUNILElBQVcsTUFBTTtZQUNoQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVEOztXQUVHO1FBQ0gsSUFBVyxHQUFHO1lBQ2IsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztRQUM1QixDQUFDO1FBRUQ7O1dBRUc7UUFDSSxNQUFNLENBQUMsSUFBc0IsRUFBRSxPQUFpQjtZQUN0RCxJQUFJLE9BQU8sS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsbUJBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2pHLENBQUM7aUJBQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDM0UsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMxRSxDQUFDO1FBQ0YsQ0FBQztRQUVEOztXQUVHO1FBQ0ksUUFBUSxDQUFDLElBQXNCO1lBQ3JDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVEOztXQUVHO1FBQ0ksS0FBSztZQUNYLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDakMsQ0FBQztLQUNELENBQUE7SUE1RFksd0NBQWM7NkJBQWQsY0FBYztRQWFiLFdBQUEseUJBQWUsQ0FBQTtPQWJoQixjQUFjLENBNEQxQiJ9