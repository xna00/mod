/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/testing/common/testingUri"], function (require, exports, assert, utils_1, testingUri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - Testing URIs', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('round trip', () => {
            const uris = [
                { type: 3 /* TestUriType.ResultActualOutput */, taskIndex: 1, messageIndex: 42, resultId: 'r', testExtId: 't' },
                { type: 4 /* TestUriType.ResultExpectedOutput */, taskIndex: 1, messageIndex: 42, resultId: 'r', testExtId: 't' },
                { type: 2 /* TestUriType.ResultMessage */, taskIndex: 1, messageIndex: 42, resultId: 'r', testExtId: 't' },
            ];
            for (const uri of uris) {
                const serialized = (0, testingUri_1.buildTestUri)(uri);
                assert.deepStrictEqual(uri, (0, testingUri_1.parseTestUri)(serialized));
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ1VyaS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL3Rlc3QvY29tbW9uL3Rlc3RpbmdVcmkudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1FBQ3RDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUN2QixNQUFNLElBQUksR0FBb0I7Z0JBQzdCLEVBQUUsSUFBSSx3Q0FBZ0MsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFO2dCQUN2RyxFQUFFLElBQUksMENBQWtDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRTtnQkFDekcsRUFBRSxJQUFJLG1DQUEyQixFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUU7YUFDbEcsQ0FBQztZQUVGLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sVUFBVSxHQUFHLElBQUEseUJBQVksRUFBQyxHQUFHLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsSUFBQSx5QkFBWSxFQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDdkQsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==