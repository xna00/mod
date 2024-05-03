/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/diff/linesDiffComputers"], function (require, exports, lifecycle_1, linesDiffComputers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestDiffProviderFactoryService = void 0;
    class TestDiffProviderFactoryService {
        createDiffProvider() {
            return new SyncDocumentDiffProvider();
        }
    }
    exports.TestDiffProviderFactoryService = TestDiffProviderFactoryService;
    class SyncDocumentDiffProvider {
        constructor() {
            this.onDidChange = () => (0, lifecycle_1.toDisposable)(() => { });
        }
        computeDiff(original, modified, options, cancellationToken) {
            const result = linesDiffComputers_1.linesDiffComputers.getDefault().computeDiff(original.getLinesContent(), modified.getLinesContent(), options);
            return Promise.resolve({
                changes: result.changes,
                quitEarly: result.hitTimeout,
                identical: original.getValue() === modified.getValue(),
                moves: result.moves,
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdERpZmZQcm92aWRlckZhY3RvcnlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL2RpZmYvdGVzdERpZmZQcm92aWRlckZhY3RvcnlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLDhCQUE4QjtRQUUxQyxrQkFBa0I7WUFDakIsT0FBTyxJQUFJLHdCQUF3QixFQUFFLENBQUM7UUFDdkMsQ0FBQztLQUNEO0lBTEQsd0VBS0M7SUFFRCxNQUFNLHdCQUF3QjtRQUE5QjtZQVdDLGdCQUFXLEdBQWdCLEdBQUcsRUFBRSxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBWEEsV0FBVyxDQUFDLFFBQW9CLEVBQUUsUUFBb0IsRUFBRSxPQUFxQyxFQUFFLGlCQUFvQztZQUNsSSxNQUFNLE1BQU0sR0FBRyx1Q0FBa0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxlQUFlLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM1SCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUM7Z0JBQ3RCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTztnQkFDdkIsU0FBUyxFQUFFLE1BQU0sQ0FBQyxVQUFVO2dCQUM1QixTQUFTLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLFFBQVEsQ0FBQyxRQUFRLEVBQUU7Z0JBQ3RELEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSzthQUNuQixDQUFDLENBQUM7UUFDSixDQUFDO0tBR0QifQ==