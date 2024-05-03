/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path"], function (require, exports, event_1, lifecycle_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockLabelService = void 0;
    class MockLabelService {
        constructor() {
            this.onDidChangeFormatters = new event_1.Emitter().event;
        }
        registerCachedFormatter(formatter) {
            throw new Error('Method not implemented.');
        }
        getUriLabel(resource, options) {
            return (0, path_1.normalize)(resource.fsPath);
        }
        getUriBasenameLabel(resource) {
            return (0, path_1.basename)(resource.fsPath);
        }
        getWorkspaceLabel(workspace, options) {
            return '';
        }
        getHostLabel(scheme, authority) {
            return '';
        }
        getHostTooltip() {
            return '';
        }
        getSeparator(scheme, authority) {
            return '/';
        }
        registerFormatter(formatter) {
            return lifecycle_1.Disposable.None;
        }
    }
    exports.MockLabelService = MockLabelService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0xhYmVsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2xhYmVsL3Rlc3QvY29tbW9uL21vY2tMYWJlbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsZ0JBQWdCO1FBQTdCO1lBMkJDLDBCQUFxQixHQUFpQyxJQUFJLGVBQU8sRUFBeUIsQ0FBQyxLQUFLLENBQUM7UUFDbEcsQ0FBQztRQXpCQSx1QkFBdUIsQ0FBQyxTQUFpQztZQUN4RCxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELFdBQVcsQ0FBQyxRQUFhLEVBQUUsT0FBNEU7WUFDdEcsT0FBTyxJQUFBLGdCQUFTLEVBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFDRCxtQkFBbUIsQ0FBQyxRQUFhO1lBQ2hDLE9BQU8sSUFBQSxlQUFRLEVBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFDRCxpQkFBaUIsQ0FBQyxTQUFrRCxFQUFFLE9BQWdDO1lBQ3JHLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUNELFlBQVksQ0FBQyxNQUFjLEVBQUUsU0FBa0I7WUFDOUMsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBQ00sY0FBYztZQUNwQixPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFDRCxZQUFZLENBQUMsTUFBYyxFQUFFLFNBQWtCO1lBQzlDLE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUNELGlCQUFpQixDQUFDLFNBQWlDO1lBQ2xELE9BQU8sc0JBQVUsQ0FBQyxJQUFJLENBQUM7UUFDeEIsQ0FBQztLQUVEO0lBNUJELDRDQTRCQyJ9