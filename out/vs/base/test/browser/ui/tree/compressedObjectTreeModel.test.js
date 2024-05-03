/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/tree/compressedObjectTreeModel", "vs/base/common/iterator", "vs/base/test/common/utils"], function (require, exports, assert, compressedObjectTreeModel_1, iterator_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function resolve(treeElement) {
        const result = { element: treeElement.element };
        const children = Array.from(iterator_1.Iterable.from(treeElement.children), resolve);
        if (treeElement.incompressible) {
            result.incompressible = true;
        }
        if (children.length > 0) {
            result.children = children;
        }
        return result;
    }
    suite('CompressedObjectTree', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('compress & decompress', function () {
            test('small', function () {
                const decompressed = { element: 1 };
                const compressed = { element: { elements: [1], incompressible: false } };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('no compression', function () {
                const decompressed = {
                    element: 1, children: [
                        { element: 11 },
                        { element: 12 },
                        { element: 13 }
                    ]
                };
                const compressed = {
                    element: { elements: [1], incompressible: false },
                    children: [
                        { element: { elements: [11], incompressible: false } },
                        { element: { elements: [12], incompressible: false } },
                        { element: { elements: [13], incompressible: false } }
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('single hierarchy', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, children: [
                                        { element: 1111 }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11, 111, 1111], incompressible: false }
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('deep compression', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, children: [
                                        { element: 1111 },
                                        { element: 1112 },
                                        { element: 1113 },
                                        { element: 1114 },
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11, 111], incompressible: false },
                    children: [
                        { element: { elements: [1111], incompressible: false } },
                        { element: { elements: [1112], incompressible: false } },
                        { element: { elements: [1113], incompressible: false } },
                        { element: { elements: [1114], incompressible: false } },
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('double deep compression', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, children: [
                                        { element: 1112 },
                                        { element: 1113 },
                                    ]
                                }
                            ]
                        },
                        {
                            element: 12, children: [
                                {
                                    element: 121, children: [
                                        { element: 1212 },
                                        { element: 1213 },
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1], incompressible: false },
                    children: [
                        {
                            element: { elements: [11, 111], incompressible: false },
                            children: [
                                { element: { elements: [1112], incompressible: false } },
                                { element: { elements: [1113], incompressible: false } },
                            ]
                        },
                        {
                            element: { elements: [12, 121], incompressible: false },
                            children: [
                                { element: { elements: [1212], incompressible: false } },
                                { element: { elements: [1213], incompressible: false } },
                            ]
                        }
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('incompressible leaf', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, children: [
                                        { element: 1111, incompressible: true }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11, 111], incompressible: false },
                    children: [
                        { element: { elements: [1111], incompressible: true } }
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('incompressible branch', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, incompressible: true, children: [
                                        { element: 1111 }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11], incompressible: false },
                    children: [
                        { element: { elements: [111, 1111], incompressible: true } }
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('incompressible chain', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                {
                                    element: 111, incompressible: true, children: [
                                        { element: 1111, incompressible: true }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1, 11], incompressible: false },
                    children: [
                        {
                            element: { elements: [111], incompressible: true },
                            children: [
                                { element: { elements: [1111], incompressible: true } }
                            ]
                        }
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
            test('incompressible tree', function () {
                const decompressed = {
                    element: 1, children: [
                        {
                            element: 11, incompressible: true, children: [
                                {
                                    element: 111, incompressible: true, children: [
                                        { element: 1111, incompressible: true }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                const compressed = {
                    element: { elements: [1], incompressible: false },
                    children: [
                        {
                            element: { elements: [11], incompressible: true },
                            children: [
                                {
                                    element: { elements: [111], incompressible: true },
                                    children: [
                                        { element: { elements: [1111], incompressible: true } }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.compress)(decompressed)), compressed);
                assert.deepStrictEqual(resolve((0, compressedObjectTreeModel_1.decompress)(compressed)), decompressed);
            });
        });
        function toList(arr) {
            return {
                splice(start, deleteCount, elements) {
                    arr.splice(start, deleteCount, ...elements);
                },
                updateElementHeight() { }
            };
        }
        function toArray(list) {
            return list.map(i => i.element.elements);
        }
        suite('CompressedObjectTreeModel', function () {
            /**
             * Calls that test function twice, once with an empty options and
             * once with `diffIdentityProvider`.
             */
            function withSmartSplice(fn) {
                fn({});
                fn({ diffIdentityProvider: { getId: n => String(n) } });
            }
            test('ctor', () => {
                const list = [];
                const model = new compressedObjectTreeModel_1.CompressedObjectTreeModel('test', toList(list));
                assert(model);
                assert.strictEqual(list.length, 0);
                assert.strictEqual(model.size, 0);
            });
            test('flat', () => withSmartSplice(options => {
                const list = [];
                const model = new compressedObjectTreeModel_1.CompressedObjectTreeModel('test', toList(list));
                model.setChildren(null, [
                    { element: 0 },
                    { element: 1 },
                    { element: 2 }
                ], options);
                assert.deepStrictEqual(toArray(list), [[0], [1], [2]]);
                assert.strictEqual(model.size, 3);
                model.setChildren(null, [
                    { element: 3 },
                    { element: 4 },
                    { element: 5 },
                ], options);
                assert.deepStrictEqual(toArray(list), [[3], [4], [5]]);
                assert.strictEqual(model.size, 3);
                model.setChildren(null, [], options);
                assert.deepStrictEqual(toArray(list), []);
                assert.strictEqual(model.size, 0);
            }));
            test('nested', () => withSmartSplice(options => {
                const list = [];
                const model = new compressedObjectTreeModel_1.CompressedObjectTreeModel('test', toList(list));
                model.setChildren(null, [
                    {
                        element: 0, children: [
                            { element: 10 },
                            { element: 11 },
                            { element: 12 },
                        ]
                    },
                    { element: 1 },
                    { element: 2 }
                ], options);
                assert.deepStrictEqual(toArray(list), [[0], [10], [11], [12], [1], [2]]);
                assert.strictEqual(model.size, 6);
                model.setChildren(12, [
                    { element: 120 },
                    { element: 121 }
                ], options);
                assert.deepStrictEqual(toArray(list), [[0], [10], [11], [12], [120], [121], [1], [2]]);
                assert.strictEqual(model.size, 8);
                model.setChildren(0, [], options);
                assert.deepStrictEqual(toArray(list), [[0], [1], [2]]);
                assert.strictEqual(model.size, 3);
                model.setChildren(null, [], options);
                assert.deepStrictEqual(toArray(list), []);
                assert.strictEqual(model.size, 0);
            }));
            test('compressed', () => withSmartSplice(options => {
                const list = [];
                const model = new compressedObjectTreeModel_1.CompressedObjectTreeModel('test', toList(list));
                model.setChildren(null, [
                    {
                        element: 1, children: [{
                                element: 11, children: [{
                                        element: 111, children: [
                                            { element: 1111 },
                                            { element: 1112 },
                                            { element: 1113 },
                                        ]
                                    }]
                            }]
                    }
                ], options);
                assert.deepStrictEqual(toArray(list), [[1, 11, 111], [1111], [1112], [1113]]);
                assert.strictEqual(model.size, 6);
                model.setChildren(11, [
                    { element: 111 },
                    { element: 112 },
                    { element: 113 },
                ], options);
                assert.deepStrictEqual(toArray(list), [[1, 11], [111], [112], [113]]);
                assert.strictEqual(model.size, 5);
                model.setChildren(113, [
                    { element: 1131 }
                ], options);
                assert.deepStrictEqual(toArray(list), [[1, 11], [111], [112], [113, 1131]]);
                assert.strictEqual(model.size, 6);
                model.setChildren(1131, [
                    { element: 1132 }
                ], options);
                assert.deepStrictEqual(toArray(list), [[1, 11], [111], [112], [113, 1131, 1132]]);
                assert.strictEqual(model.size, 7);
                model.setChildren(1131, [
                    { element: 1132 },
                    { element: 1133 },
                ], options);
                assert.deepStrictEqual(toArray(list), [[1, 11], [111], [112], [113, 1131], [1132], [1133]]);
                assert.strictEqual(model.size, 8);
            }));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHJlc3NlZE9iamVjdFRyZWVNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvYnJvd3Nlci91aS90cmVlL2NvbXByZXNzZWRPYmplY3RUcmVlTW9kZWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRyxTQUFTLE9BQU8sQ0FBSSxXQUFzQztRQUN6RCxNQUFNLE1BQU0sR0FBUSxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDckQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxtQkFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFMUUsSUFBSSxXQUFXLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDaEMsTUFBTSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDOUIsQ0FBQztRQUVELElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN6QixNQUFNLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUM1QixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsS0FBSyxDQUFDLHNCQUFzQixFQUFFO1FBRTdCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsdUJBQXVCLEVBQUU7WUFFOUIsSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDYixNQUFNLFlBQVksR0FBbUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BFLE1BQU0sVUFBVSxHQUNmLEVBQUUsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxFQUFFLENB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