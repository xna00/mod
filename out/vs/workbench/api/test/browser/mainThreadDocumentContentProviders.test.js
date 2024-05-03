/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/api/browser/mainThreadDocumentContentProviders", "vs/editor/test/common/testTextModel", "vs/base/test/common/mock", "vs/workbench/api/test/common/testRPCProtocol", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, mainThreadDocumentContentProviders_1, testTextModel_1, mock_1, testRPCProtocol_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadDocumentContentProviders', function () {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('events are processed properly', function () {
            const uri = uri_1.URI.parse('test:uri');
            const model = (0, testTextModel_1.createTextModel)('1', undefined, undefined, uri);
            const providers = new mainThreadDocumentContentProviders_1.MainThreadDocumentContentProviders(new testRPCProtocol_1.TestRPCProtocol(), null, null, new class extends (0, mock_1.mock)() {
                getModel(_uri) {
                    assert.strictEqual(uri.toString(), _uri.toString());
                    return model;
                }
            }, new class extends (0, mock_1.mock)() {
                computeMoreMinimalEdits(_uri, data) {
                    assert.strictEqual(model.getValue(), '1');
                    return Promise.resolve(data);
                }
            });
            store.add(model);
            store.add(providers);
            return new Promise((resolve, reject) => {
                let expectedEvents = 1;
                store.add(model.onDidChangeContent(e => {
                    expectedEvents -= 1;
                    try {
                        assert.ok(expectedEvents >= 0);
                    }
                    catch (err) {
                        reject(err);
                    }
                    if (model.getValue() === '1\n2\n3') {
                        model.dispose();
                        resolve();
                    }
                }));
                providers.$onVirtualDocumentChange(uri, '1\n2');
                providers.$onVirtualDocumentChange(uri, '1\n2\n3');
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERvY3VtZW50Q29udGVudFByb3ZpZGVycy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9tYWluVGhyZWFkRG9jdW1lbnRDb250ZW50UHJvdmlkZXJzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLG9DQUFvQyxFQUFFO1FBRTNDLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxJQUFJLENBQUMsK0JBQStCLEVBQUU7WUFFckMsTUFBTSxHQUFHLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNsQyxNQUFNLEtBQUssR0FBRyxJQUFBLCtCQUFlLEVBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFOUQsTUFBTSxTQUFTLEdBQUcsSUFBSSx1RUFBa0MsQ0FBQyxJQUFJLGlDQUFlLEVBQUUsRUFBRSxJQUFLLEVBQUUsSUFBSyxFQUMzRixJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBaUI7Z0JBQzdCLFFBQVEsQ0FBQyxJQUFTO29CQUMxQixNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDcEQsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQzthQUNELEVBQ0QsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQXdCO2dCQUNwQyx1QkFBdUIsQ0FBQyxJQUFTLEVBQUUsSUFBNEI7b0JBQ3ZFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUMxQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlCLENBQUM7YUFDRCxDQUNELENBQUM7WUFFRixLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pCLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFckIsT0FBTyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDNUMsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDO2dCQUN2QixLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDdEMsY0FBYyxJQUFJLENBQUMsQ0FBQztvQkFDcEIsSUFBSSxDQUFDO3dCQUNKLE1BQU0sQ0FBQyxFQUFFLENBQUMsY0FBYyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUNoQyxDQUFDO29CQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7d0JBQ2QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNiLENBQUM7b0JBQ0QsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQ3BDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDaEIsT0FBTyxFQUFFLENBQUM7b0JBQ1gsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNKLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ2hELFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDcEQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=