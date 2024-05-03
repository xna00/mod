/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/errors"], function (require, exports, instantiation_1, event_1, lifecycle_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiDiffSourceResolverService = exports.MultiDiffEditorItem = exports.ConstResolvedMultiDiffSource = exports.IMultiDiffSourceResolverService = void 0;
    exports.IMultiDiffSourceResolverService = (0, instantiation_1.createDecorator)('multiDiffSourceResolverService');
    class ConstResolvedMultiDiffSource {
        constructor(resources) {
            this.resources = resources;
            this.onDidChange = event_1.Event.None;
        }
    }
    exports.ConstResolvedMultiDiffSource = ConstResolvedMultiDiffSource;
    class MultiDiffEditorItem {
        constructor(original, modified) {
            this.original = original;
            this.modified = modified;
            if (!original && !modified) {
                throw new errors_1.BugIndicatingError('Invalid arguments');
            }
        }
    }
    exports.MultiDiffEditorItem = MultiDiffEditorItem;
    class MultiDiffSourceResolverService {
        constructor() {
            this._resolvers = new Set();
        }
        registerResolver(resolver) {
            // throw on duplicate
            if (this._resolvers.has(resolver)) {
                throw new errors_1.BugIndicatingError('Duplicate resolver');
            }
            this._resolvers.add(resolver);
            return (0, lifecycle_1.toDisposable)(() => this._resolvers.delete(resolver));
        }
        resolve(uri) {
            for (const resolver of this._resolvers) {
                if (resolver.canHandleUri(uri)) {
                    return resolver.resolveDiffSource(uri);
                }
            }
            return Promise.resolve(undefined);
        }
    }
    exports.MultiDiffSourceResolverService = MultiDiffSourceResolverService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlEaWZmU291cmNlUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tdWx0aURpZmZFZGl0b3IvYnJvd3Nlci9tdWx0aURpZmZTb3VyY2VSZXNvbHZlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU25GLFFBQUEsK0JBQStCLEdBQUcsSUFBQSwrQkFBZSxFQUFrQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBd0JsSSxNQUFhLDRCQUE0QjtRQUd4QyxZQUNpQixTQUF5QztZQUF6QyxjQUFTLEdBQVQsU0FBUyxDQUFnQztZQUgxQyxnQkFBVyxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7UUFJckMsQ0FBQztLQUNMO0lBTkQsb0VBTUM7SUFFRCxNQUFhLG1CQUFtQjtRQUMvQixZQUNVLFFBQXlCLEVBQ3pCLFFBQXlCO1lBRHpCLGFBQVEsR0FBUixRQUFRLENBQWlCO1lBQ3pCLGFBQVEsR0FBUixRQUFRLENBQWlCO1lBRWxDLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxJQUFJLDJCQUFrQixDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDbkQsQ0FBQztRQUNGLENBQUM7S0FDRDtJQVRELGtEQVNDO0lBRUQsTUFBYSw4QkFBOEI7UUFBM0M7WUFHa0IsZUFBVSxHQUFHLElBQUksR0FBRyxFQUE0QixDQUFDO1FBbUJuRSxDQUFDO1FBakJBLGdCQUFnQixDQUFDLFFBQWtDO1lBQ2xELHFCQUFxQjtZQUNyQixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3BELENBQUM7WUFDRCxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5QixPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxPQUFPLENBQUMsR0FBUTtZQUNmLEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDaEMsT0FBTyxRQUFRLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3hDLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7S0FDRDtJQXRCRCx3RUFzQkMifQ==