/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/filters", "vs/base/common/strings"], function (require, exports, filters_1, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilterOptions = void 0;
    class FilterOptions {
        static { this._filter = filters_1.matchesFuzzy2; }
        static { this._messageFilter = filters_1.matchesFuzzy; }
        constructor(filter, showResolved, showUnresolved) {
            this.filter = filter;
            this.showResolved = true;
            this.showUnresolved = true;
            filter = filter.trim();
            this.showResolved = showResolved;
            this.showUnresolved = showUnresolved;
            const negate = filter.startsWith('!');
            this.textFilter = { text: (negate ? strings.ltrim(filter, '!') : filter).trim(), negate };
        }
    }
    exports.FilterOptions = FilterOptions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNGaWx0ZXJPcHRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL2NvbW1lbnRzRmlsdGVyT3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEcsTUFBYSxhQUFhO2lCQUVULFlBQU8sR0FBWSx1QkFBYSxBQUF6QixDQUEwQjtpQkFDakMsbUJBQWMsR0FBWSxzQkFBWSxBQUF4QixDQUF5QjtRQU12RCxZQUNVLE1BQWMsRUFDdkIsWUFBcUIsRUFDckIsY0FBdUI7WUFGZCxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBTGYsaUJBQVksR0FBWSxJQUFJLENBQUM7WUFDN0IsbUJBQWMsR0FBWSxJQUFJLENBQUM7WUFRdkMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztZQUNqQyxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztZQUVyQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQztRQUMzRixDQUFDOztJQXBCRixzQ0FxQkMifQ==