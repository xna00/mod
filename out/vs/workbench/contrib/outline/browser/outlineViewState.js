/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutlineViewState = void 0;
    class OutlineViewState {
        constructor() {
            this._followCursor = false;
            this._filterOnType = true;
            this._sortBy = 0 /* OutlineSortOrder.ByPosition */;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        dispose() {
            this._onDidChange.dispose();
        }
        set followCursor(value) {
            if (value !== this._followCursor) {
                this._followCursor = value;
                this._onDidChange.fire({ followCursor: true });
            }
        }
        get followCursor() {
            return this._followCursor;
        }
        get filterOnType() {
            return this._filterOnType;
        }
        set filterOnType(value) {
            if (value !== this._filterOnType) {
                this._filterOnType = value;
                this._onDidChange.fire({ filterOnType: true });
            }
        }
        set sortBy(value) {
            if (value !== this._sortBy) {
                this._sortBy = value;
                this._onDidChange.fire({ sortBy: true });
            }
        }
        get sortBy() {
            return this._sortBy;
        }
        persist(storageService) {
            storageService.store('outline/state', JSON.stringify({
                followCursor: this.followCursor,
                sortBy: this.sortBy,
                filterOnType: this.filterOnType,
            }), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        restore(storageService) {
            const raw = storageService.get('outline/state', 1 /* StorageScope.WORKSPACE */);
            if (!raw) {
                return;
            }
            let data;
            try {
                data = JSON.parse(raw);
            }
            catch (e) {
                return;
            }
            this.followCursor = data.followCursor;
            this.sortBy = data.sortBy ?? 0 /* OutlineSortOrder.ByPosition */;
            if (typeof data.filterOnType === 'boolean') {
                this.filterOnType = data.filterOnType;
            }
        }
    }
    exports.OutlineViewState = OutlineViewState;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZVZpZXdTdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvb3V0bGluZS9icm93c2VyL291dGxpbmVWaWV3U3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsZ0JBQWdCO1FBQTdCO1lBRVMsa0JBQWEsR0FBRyxLQUFLLENBQUM7WUFDdEIsa0JBQWEsR0FBRyxJQUFJLENBQUM7WUFDckIsWUFBTyx1Q0FBK0I7WUFFN0IsaUJBQVksR0FBRyxJQUFJLGVBQU8sRUFBd0UsQ0FBQztZQUMzRyxnQkFBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBZ0VoRCxDQUFDO1FBOURBLE9BQU87WUFDTixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFFRCxJQUFJLFlBQVksQ0FBQyxLQUFjO1lBQzlCLElBQUksS0FBSyxLQUFLLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDaEQsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLFlBQVk7WUFDZixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVELElBQUksWUFBWTtZQUNmLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBSSxZQUFZLENBQUMsS0FBSztZQUNyQixJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO2dCQUMzQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2hELENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxNQUFNLENBQUMsS0FBdUI7WUFDakMsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztnQkFDckIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMxQyxDQUFDO1FBQ0YsQ0FBQztRQUVELElBQUksTUFBTTtZQUNULE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRUQsT0FBTyxDQUFDLGNBQStCO1lBQ3RDLGNBQWMsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3BELFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtnQkFDL0IsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO2dCQUNuQixZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7YUFDL0IsQ0FBQyxnRUFBZ0QsQ0FBQztRQUNwRCxDQUFDO1FBRUQsT0FBTyxDQUFDLGNBQStCO1lBQ3RDLE1BQU0sR0FBRyxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsZUFBZSxpQ0FBeUIsQ0FBQztZQUN4RSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ1YsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLElBQVMsQ0FBQztZQUNkLElBQUksQ0FBQztnQkFDSixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4QixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUN0QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLHVDQUErQixDQUFDO1lBQ3pELElBQUksT0FBTyxJQUFJLENBQUMsWUFBWSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDdkMsQ0FBQztRQUNGLENBQUM7S0FDRDtJQXZFRCw0Q0F1RUMifQ==