/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/tree/indexTreeModel", "vs/base/common/async", "vs/base/test/common/utils"], function (require, exports, assert, indexTreeModel_1, async_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function toList(arr) {
        return {
            splice(start, deleteCount, elements) {
                arr.splice(start, deleteCount, ...elements);
            },
            updateElementHeight() { }
        };
    }
    function toArray(list) {
        return list.map(i => i.element);
    }
    function toElements(node) {
        return node.children?.length ? { e: node.element, children: node.children.map(toElements) } : node.element;
    }
    const diffIdentityProvider = { getId: (n) => String(n) };
    /**
     * Calls that test function twice, once with an empty options and
     * once with `diffIdentityProvider`.
     */
    function withSmartSplice(fn) {
        fn({});
        fn({ diffIdentityProvider });
    }
    suite('IndexTreeModel', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('ctor', () => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            assert(model);
            assert.strictEqual(list.length, 0);
        });
        test('insert', () => withSmartSplice(options => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            model.splice([0], 0, [
                { element: 0 },
                { element: 1 },
                { element: 2 }
            ], options);
            assert.deepStrictEqual(list.length, 3);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsed, false);
            assert.deepStrictEqual(list[0].depth, 1);
            assert.deepStrictEqual(list[1].element, 1);
            assert.deepStrictEqual(list[1].collapsed, false);
            assert.deepStrictEqual(list[1].depth, 1);
            assert.deepStrictEqual(list[2].element, 2);
            assert.deepStrictEqual(list[2].collapsed, false);
            assert.deepStrictEqual(list[2].depth, 1);
        }));
        test('deep insert', () => withSmartSplice(options => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            model.splice([0], 0, [
                {
                    element: 0, children: [
                        { element: 10 },
                        { element: 11 },
                        { element: 12 },
                    ]
                },
                { element: 1 },
                { element: 2 }
            ]);
            assert.deepStrictEqual(list.length, 6);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsed, false);
            assert.deepStrictEqual(list[0].depth, 1);
            assert.deepStrictEqual(list[1].element, 10);
            assert.deepStrictEqual(list[1].collapsed, false);
            assert.deepStrictEqual(list[1].depth, 2);
            assert.deepStrictEqual(list[2].element, 11);
            assert.deepStrictEqual(list[2].collapsed, false);
            assert.deepStrictEqual(list[2].depth, 2);
            assert.deepStrictEqual(list[3].element, 12);
            assert.deepStrictEqual(list[3].collapsed, false);
            assert.deepStrictEqual(list[3].depth, 2);
            assert.deepStrictEqual(list[4].element, 1);
            assert.deepStrictEqual(list[4].collapsed, false);
            assert.deepStrictEqual(list[4].depth, 1);
            assert.deepStrictEqual(list[5].element, 2);
            assert.deepStrictEqual(list[5].collapsed, false);
            assert.deepStrictEqual(list[5].depth, 1);
        }));
        test('deep insert collapsed', () => withSmartSplice(options => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            model.splice([0], 0, [
                {
                    element: 0, collapsed: true, children: [
                        { element: 10 },
                        { element: 11 },
                        { element: 12 },
                    ]
                },
                { element: 1 },
                { element: 2 }
            ], options);
            assert.deepStrictEqual(list.length, 3);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsed, true);
            assert.deepStrictEqual(list[0].depth, 1);
            assert.deepStrictEqual(list[1].element, 1);
            assert.deepStrictEqual(list[1].collapsed, false);
            assert.deepStrictEqual(list[1].depth, 1);
            assert.deepStrictEqual(list[2].element, 2);
            assert.deepStrictEqual(list[2].collapsed, false);
            assert.deepStrictEqual(list[2].depth, 1);
        }));
        test('delete', () => withSmartSplice(options => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            model.splice([0], 0, [
                { element: 0 },
                { element: 1 },
                { element: 2 }
            ], options);
            assert.deepStrictEqual(list.length, 3);
            model.splice([1], 1, undefined, options);
            assert.deepStrictEqual(list.length, 2);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsed, false);
            assert.deepStrictEqual(list[0].depth, 1);
            assert.deepStrictEqual(list[1].element, 2);
            assert.deepStrictEqual(list[1].collapsed, false);
            assert.deepStrictEqual(list[1].depth, 1);
            model.splice([0], 2, undefined, options);
            assert.deepStrictEqual(list.length, 0);
        }));
        test('nested delete', () => withSmartSplice(options => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            model.splice([0], 0, [
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
            assert.deepStrictEqual(list.length, 6);
            model.splice([1], 2, undefined, options);
            assert.deepStrictEqual(list.length, 4);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsed, false);
            assert.deepStrictEqual(list[0].depth, 1);
            assert.deepStrictEqual(list[1].element, 10);
            assert.deepStrictEqual(list[1].collapsed, false);
            assert.deepStrictEqual(list[1].depth, 2);
            assert.deepStrictEqual(list[2].element, 11);
            assert.deepStrictEqual(list[2].collapsed, false);
            assert.deepStrictEqual(list[2].depth, 2);
            assert.deepStrictEqual(list[3].element, 12);
            assert.deepStrictEqual(list[3].collapsed, false);
            assert.deepStrictEqual(list[3].depth, 2);
        }));
        test('deep delete', () => withSmartSplice(options => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            model.splice([0], 0, [
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
            assert.deepStrictEqual(list.length, 6);
            model.splice([0], 1, undefined, options);
            assert.deepStrictEqual(list.length, 2);
            assert.deepStrictEqual(list[0].element, 1);
            assert.deepStrictEqual(list[0].collapsed, false);
            assert.deepStrictEqual(list[0].depth, 1);
            assert.deepStrictEqual(list[1].element, 2);
            assert.deepStrictEqual(list[1].collapsed, false);
            assert.deepStrictEqual(list[1].depth, 1);
        }));
        test('smart splice deep', () => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            model.splice([0], 0, [
                { element: 0 },
                { element: 1 },
                { element: 2 },
                { element: 3 },
            ], { diffIdentityProvider });
            assert.deepStrictEqual(list.filter(l => l.depth === 1).map(toElements), [
                0,
                1,
                2,
                3,
            ]);
            model.splice([0], 3, [
                { element: -0.5 },
                { element: 0, children: [{ element: 0.1 }] },
                { element: 1 },
                { element: 2, children: [{ element: 2.1 }, { element: 2.2, children: [{ element: 2.21 }] }] },
            ], { diffIdentityProvider, diffDepth: Infinity });
            assert.deepStrictEqual(list.filter(l => l.depth === 1).map(toElements), [
                -0.5,
                { e: 0, children: [0.1] },
                1,
                { e: 2, children: [2.1, { e: 2.2, children: [2.21] }] },
                3,
            ]);
        });
        test('hidden delete', () => withSmartSplice(options => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            model.splice([0], 0, [
                {
                    element: 0, collapsed: true, children: [
                        { element: 10 },
                        { element: 11 },
                        { element: 12 },
                    ]
                },
                { element: 1 },
                { element: 2 }
            ], options);
            assert.deepStrictEqual(list.length, 3);
            model.splice([0, 1], 1, undefined, options);
            assert.deepStrictEqual(list.length, 3);
            model.splice([0, 0], 2, undefined, options);
            assert.deepStrictEqual(list.length, 3);
        }));
        test('collapse', () => withSmartSplice(options => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            model.splice([0], 0, [
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
            assert.deepStrictEqual(list.length, 6);
            model.setCollapsed([0], true);
            assert.deepStrictEqual(list.length, 3);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsed, true);
            assert.deepStrictEqual(list[0].depth, 1);
            assert.deepStrictEqual(list[1].element, 1);
            assert.deepStrictEqual(list[1].collapsed, false);
            assert.deepStrictEqual(list[1].depth, 1);
            assert.deepStrictEqual(list[2].element, 2);
            assert.deepStrictEqual(list[2].collapsed, false);
            assert.deepStrictEqual(list[2].depth, 1);
        }));
        test('expand', () => withSmartSplice(options => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            model.splice([0], 0, [
                {
                    element: 0, collapsed: true, children: [
                        { element: 10 },
                        { element: 11 },
                        { element: 12 },
                    ]
                },
                { element: 1 },
                { element: 2 }
            ], options);
            assert.deepStrictEqual(list.length, 3);
            model.expandTo([0, 1]);
            assert.deepStrictEqual(list.length, 6);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsed, false);
            assert.deepStrictEqual(list[0].depth, 1);
            assert.deepStrictEqual(list[1].element, 10);
            assert.deepStrictEqual(list[1].collapsed, false);
            assert.deepStrictEqual(list[1].depth, 2);
            assert.deepStrictEqual(list[2].element, 11);
            assert.deepStrictEqual(list[2].collapsed, false);
            assert.deepStrictEqual(list[2].depth, 2);
            assert.deepStrictEqual(list[3].element, 12);
            assert.deepStrictEqual(list[3].collapsed, false);
            assert.deepStrictEqual(list[3].depth, 2);
            assert.deepStrictEqual(list[4].element, 1);
            assert.deepStrictEqual(list[4].collapsed, false);
            assert.deepStrictEqual(list[4].depth, 1);
            assert.deepStrictEqual(list[5].element, 2);
            assert.deepStrictEqual(list[5].collapsed, false);
            assert.deepStrictEqual(list[5].depth, 1);
        }));
        test('smart diff consistency', () => {
            const times = 500;
            const minEdits = 1;
            const maxEdits = 10;
            const maxInserts = 5;
            for (let i = 0; i < times; i++) {
                const list = [];
                const options = { diffIdentityProvider: { getId: (n) => String(n) } };
                const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
                const changes = [];
                const expected = [];
                let elementCounter = 0;
                for (let edits = Math.random() * (maxEdits - minEdits) + minEdits; edits > 0; edits--) {
                    const spliceIndex = Math.floor(Math.random() * list.length);
                    const deleteCount = Math.ceil(Math.random() * (list.length - spliceIndex));
                    const insertCount = Math.floor(Math.random() * maxInserts + 1);
                    const inserts = [];
                    for (let i = 0; i < insertCount; i++) {
                        const element = elementCounter++;
                        inserts.push({ element, children: [] });
                    }
                    // move existing items
                    if (Math.random() < 0.5) {
                        const elements = list.slice(spliceIndex, spliceIndex + Math.floor(deleteCount / 2));
                        inserts.push(...elements.map(({ element }) => ({ element, children: [] })));
                    }
                    model.splice([spliceIndex], deleteCount, inserts, options);
                    expected.splice(spliceIndex, deleteCount, ...inserts.map(i => i.element));
                    const listElements = list.map(l => l.element);
                    changes.push(`splice(${spliceIndex}, ${deleteCount}, [${inserts.map(e => e.element).join(', ')}]) -> ${listElements.join(', ')}`);
                    assert.deepStrictEqual(expected, listElements, `Expected ${listElements.join(', ')} to equal ${expected.join(', ')}. Steps:\n\n${changes.join('\n')}`);
                }
            }
        });
        test('collapse should recursively adjust visible count', () => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            model.splice([0], 0, [
                {
                    element: 1, children: [
                        {
                            element: 11, children: [
                                { element: 111 }
                            ]
                        }
                    ]
                },
                {
                    element: 2, children: [
                        { element: 21 }
                    ]
                }
            ]);
            assert.deepStrictEqual(list.length, 5);
            assert.deepStrictEqual(toArray(list), [1, 11, 111, 2, 21]);
            model.setCollapsed([0, 0], true);
            assert.deepStrictEqual(list.length, 4);
            assert.deepStrictEqual(toArray(list), [1, 11, 2, 21]);
            model.setCollapsed([1], true);
            assert.deepStrictEqual(list.length, 3);
            assert.deepStrictEqual(toArray(list), [1, 11, 2]);
        });
        test('setCollapsible', () => {
            const list = [];
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
            model.splice([0], 0, [
                {
                    element: 0, children: [
                        { element: 10 }
                    ]
                }
            ]);
            assert.deepStrictEqual(list.length, 2);
            model.setCollapsible([0], false);
            assert.deepStrictEqual(list.length, 2);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsible, false);
            assert.deepStrictEqual(list[0].collapsed, false);
            assert.deepStrictEqual(list[1].element, 10);
            assert.deepStrictEqual(list[1].collapsible, false);
            assert.deepStrictEqual(list[1].collapsed, false);
            assert.deepStrictEqual(model.setCollapsed([0], true), false);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsible, false);
            assert.deepStrictEqual(list[0].collapsed, false);
            assert.deepStrictEqual(list[1].element, 10);
            assert.deepStrictEqual(list[1].collapsible, false);
            assert.deepStrictEqual(list[1].collapsed, false);
            assert.deepStrictEqual(model.setCollapsed([0], false), false);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsible, false);
            assert.deepStrictEqual(list[0].collapsed, false);
            assert.deepStrictEqual(list[1].element, 10);
            assert.deepStrictEqual(list[1].collapsible, false);
            assert.deepStrictEqual(list[1].collapsed, false);
            model.setCollapsible([0], true);
            assert.deepStrictEqual(list.length, 2);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsible, true);
            assert.deepStrictEqual(list[0].collapsed, false);
            assert.deepStrictEqual(list[1].element, 10);
            assert.deepStrictEqual(list[1].collapsible, false);
            assert.deepStrictEqual(list[1].collapsed, false);
            assert.deepStrictEqual(model.setCollapsed([0], true), true);
            assert.deepStrictEqual(list.length, 1);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsible, true);
            assert.deepStrictEqual(list[0].collapsed, true);
            assert.deepStrictEqual(model.setCollapsed([0], false), true);
            assert.deepStrictEqual(list[0].element, 0);
            assert.deepStrictEqual(list[0].collapsible, true);
            assert.deepStrictEqual(list[0].collapsed, false);
            assert.deepStrictEqual(list[1].element, 10);
            assert.deepStrictEqual(list[1].collapsible, false);
            assert.deepStrictEqual(list[1].collapsed, false);
        });
        test('simple filter', () => {
            const list = [];
            const filter = new class {
                filter(element) {
                    return element % 2 === 0 ? 1 /* TreeVisibility.Visible */ : 0 /* TreeVisibility.Hidden */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1, { filter });
            model.splice([0], 0, [
                {
                    element: 0, children: [
                        { element: 1 },
                        { element: 2 },
                        { element: 3 },
                        { element: 4 },
                        { element: 5 },
                        { element: 6 },
                        { element: 7 }
                    ]
                }
            ]);
            assert.deepStrictEqual(list.length, 4);
            assert.deepStrictEqual(toArray(list), [0, 2, 4, 6]);
            model.setCollapsed([0], true);
            assert.deepStrictEqual(toArray(list), [0]);
            model.setCollapsed([0], false);
            assert.deepStrictEqual(toArray(list), [0, 2, 4, 6]);
        });
        test('recursive filter on initial model', () => {
            const list = [];
            const filter = new class {
                filter(element) {
                    return element === 0 ? 2 /* TreeVisibility.Recurse */ : 0 /* TreeVisibility.Hidden */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1, { filter });
            model.splice([0], 0, [
                {
                    element: 0, children: [
                        { element: 1 },
                        { element: 2 }
                    ]
                }
            ]);
            assert.deepStrictEqual(toArray(list), []);
        });
        test('refilter', () => {
            const list = [];
            let shouldFilter = false;
            const filter = new class {
                filter(element) {
                    return (!shouldFilter || element % 2 === 0) ? 1 /* TreeVisibility.Visible */ : 0 /* TreeVisibility.Hidden */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1, { filter });
            model.splice([0], 0, [
                {
                    element: 0, children: [
                        { element: 1 },
                        { element: 2 },
                        { element: 3 },
                        { element: 4 },
                        { element: 5 },
                        { element: 6 },
                        { element: 7 }
                    ]
                },
            ]);
            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);
            model.refilter();
            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);
            shouldFilter = true;
            model.refilter();
            assert.deepStrictEqual(toArray(list), [0, 2, 4, 6]);
            shouldFilter = false;
            model.refilter();
            assert.deepStrictEqual(toArray(list), [0, 1, 2, 3, 4, 5, 6, 7]);
        });
        test('recursive filter', () => {
            const list = [];
            let query = new RegExp('');
            const filter = new class {
                filter(element) {
                    return query.test(element) ? 1 /* TreeVisibility.Visible */ : 2 /* TreeVisibility.Recurse */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), 'root', { filter });
            model.splice([0], 0, [
                {
                    element: 'vscode', children: [
                        { element: '.build' },
                        { element: 'git' },
                        {
                            element: 'github', children: [
                                { element: 'calendar.yml' },
                                { element: 'endgame' },
                                { element: 'build.js' },
                            ]
                        },
                        {
                            element: 'build', children: [
                                { element: 'lib' },
                                { element: 'gulpfile.js' }
                            ]
                        }
                    ]
                },
            ]);
            assert.deepStrictEqual(list.length, 10);
            query = /build/;
            model.refilter();
            assert.deepStrictEqual(toArray(list), ['vscode', '.build', 'github', 'build.js', 'build']);
            model.setCollapsed([0], true);
            assert.deepStrictEqual(toArray(list), ['vscode']);
            model.setCollapsed([0], false);
            assert.deepStrictEqual(toArray(list), ['vscode', '.build', 'github', 'build.js', 'build']);
        });
        test('recursive filter updates when children change (#133272)', async () => {
            const list = [];
            let query = '';
            const filter = new class {
                filter(element) {
                    return element.includes(query) ? 1 /* TreeVisibility.Visible */ : 2 /* TreeVisibility.Recurse */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), 'root', { filter });
            model.splice([0], 0, [
                {
                    element: 'a',
                    children: [
                        { element: 'b' },
                    ],
                },
            ]);
            assert.deepStrictEqual(toArray(list), ['a', 'b']);
            query = 'visible';
            model.refilter();
            assert.deepStrictEqual(toArray(list), []);
            model.splice([0, 0, 0], 0, [
                {
                    element: 'visible', children: []
                },
            ]);
            await (0, async_1.timeout)(0); // wait for refilter microtask
            assert.deepStrictEqual(toArray(list), ['a', 'b', 'visible']);
        });
        test('recursive filter with collapse', () => {
            const list = [];
            let query = new RegExp('');
            const filter = new class {
                filter(element) {
                    return query.test(element) ? 1 /* TreeVisibility.Visible */ : 2 /* TreeVisibility.Recurse */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), 'root', { filter });
            model.splice([0], 0, [
                {
                    element: 'vscode', children: [
                        { element: '.build' },
                        { element: 'git' },
                        {
                            element: 'github', children: [
                                { element: 'calendar.yml' },
                                { element: 'endgame' },
                                { element: 'build.js' },
                            ]
                        },
                        {
                            element: 'build', children: [
                                { element: 'lib' },
                                { element: 'gulpfile.js' }
                            ]
                        }
                    ]
                },
            ]);
            assert.deepStrictEqual(list.length, 10);
            query = /gulp/;
            model.refilter();
            assert.deepStrictEqual(toArray(list), ['vscode', 'build', 'gulpfile.js']);
            model.setCollapsed([0, 3], true);
            assert.deepStrictEqual(toArray(list), ['vscode', 'build']);
            model.setCollapsed([0], true);
            assert.deepStrictEqual(toArray(list), ['vscode']);
        });
        test('recursive filter while collapsed', () => {
            const list = [];
            let query = new RegExp('');
            const filter = new class {
                filter(element) {
                    return query.test(element) ? 1 /* TreeVisibility.Visible */ : 2 /* TreeVisibility.Recurse */;
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), 'root', { filter });
            model.splice([0], 0, [
                {
                    element: 'vscode', collapsed: true, children: [
                        { element: '.build' },
                        { element: 'git' },
                        {
                            element: 'github', children: [
                                { element: 'calendar.yml' },
                                { element: 'endgame' },
                                { element: 'build.js' },
                            ]
                        },
                        {
                            element: 'build', children: [
                                { element: 'lib' },
                                { element: 'gulpfile.js' }
                            ]
                        }
                    ]
                },
            ]);
            assert.deepStrictEqual(toArray(list), ['vscode']);
            query = /gulp/;
            model.refilter();
            assert.deepStrictEqual(toArray(list), ['vscode']);
            model.setCollapsed([0], false);
            assert.deepStrictEqual(toArray(list), ['vscode', 'build', 'gulpfile.js']);
            model.setCollapsed([0], true);
            assert.deepStrictEqual(toArray(list), ['vscode']);
            query = new RegExp('');
            model.refilter();
            assert.deepStrictEqual(toArray(list), ['vscode']);
            model.setCollapsed([0], false);
            assert.deepStrictEqual(list.length, 10);
        });
        suite('getNodeLocation', () => {
            test('simple', () => {
                const list = [];
                const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1);
                model.splice([0], 0, [
                    {
                        element: 0, children: [
                            { element: 10 },
                            { element: 11 },
                            { element: 12 },
                        ]
                    },
                    { element: 1 },
                    { element: 2 }
                ]);
                assert.deepStrictEqual(model.getNodeLocation(list[0]), [0]);
                assert.deepStrictEqual(model.getNodeLocation(list[1]), [0, 0]);
                assert.deepStrictEqual(model.getNodeLocation(list[2]), [0, 1]);
                assert.deepStrictEqual(model.getNodeLocation(list[3]), [0, 2]);
                assert.deepStrictEqual(model.getNodeLocation(list[4]), [1]);
                assert.deepStrictEqual(model.getNodeLocation(list[5]), [2]);
            });
            test('with filter', () => {
                const list = [];
                const filter = new class {
                    filter(element) {
                        return element % 2 === 0 ? 1 /* TreeVisibility.Visible */ : 0 /* TreeVisibility.Hidden */;
                    }
                };
                const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), -1, { filter });
                model.splice([0], 0, [
                    {
                        element: 0, children: [
                            { element: 1 },
                            { element: 2 },
                            { element: 3 },
                            { element: 4 },
                            { element: 5 },
                            { element: 6 },
                            { element: 7 }
                        ]
                    }
                ]);
                assert.deepStrictEqual(model.getNodeLocation(list[0]), [0]);
                assert.deepStrictEqual(model.getNodeLocation(list[1]), [0, 1]);
                assert.deepStrictEqual(model.getNodeLocation(list[2]), [0, 3]);
                assert.deepStrictEqual(model.getNodeLocation(list[3]), [0, 5]);
            });
        });
        test('refilter with filtered out nodes', () => {
            const list = [];
            let query = new RegExp('');
            const filter = new class {
                filter(element) {
                    return query.test(element);
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), 'root', { filter });
            model.splice([0], 0, [
                { element: 'silver' },
                { element: 'gold' },
                { element: 'platinum' }
            ]);
            assert.deepStrictEqual(toArray(list), ['silver', 'gold', 'platinum']);
            query = /platinum/;
            model.refilter();
            assert.deepStrictEqual(toArray(list), ['platinum']);
            model.splice([0], Number.POSITIVE_INFINITY, [
                { element: 'silver' },
                { element: 'gold' },
                { element: 'platinum' }
            ]);
            assert.deepStrictEqual(toArray(list), ['platinum']);
            model.refilter();
            assert.deepStrictEqual(toArray(list), ['platinum']);
        });
        test('explicit hidden nodes should have renderNodeCount == 0, issue #83211', () => {
            const list = [];
            let query = new RegExp('');
            const filter = new class {
                filter(element) {
                    return query.test(element);
                }
            };
            const model = new indexTreeModel_1.IndexTreeModel('test', toList(list), 'root', { filter });
            model.splice([0], 0, [
                { element: 'a', children: [{ element: 'aa' }] },
                { element: 'b', children: [{ element: 'bb' }] }
            ]);
            assert.deepStrictEqual(toArray(list), ['a', 'aa', 'b', 'bb']);
            assert.deepStrictEqual(model.getListIndex([0]), 0);
            assert.deepStrictEqual(model.getListIndex([0, 0]), 1);
            assert.deepStrictEqual(model.getListIndex([1]), 2);
            assert.deepStrictEqual(model.getListIndex([1, 0]), 3);
            query = /b/;
            model.refilter();
            assert.deepStrictEqual(toArray(list), ['b', 'bb']);
            assert.deepStrictEqual(model.getListIndex([0]), -1);
            assert.deepStrictEqual(model.getListIndex([0, 0]), -1);
            assert.deepStrictEqual(model.getListIndex([1]), 0);
            assert.deepStrictEqual(model.getListIndex([1, 0]), 1);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhUcmVlTW9kZWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2Jyb3dzZXIvdWkvdHJlZS9pbmRleFRyZWVNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLFNBQVMsTUFBTSxDQUFJLEdBQVE7UUFDMUIsT0FBTztZQUNOLE1BQU0sQ0FBQyxLQUFhLEVBQUUsV0FBbUIsRUFBRSxRQUFhO2dCQUN2RCxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsR0FBRyxRQUFRLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBQ0QsbUJBQW1CLEtBQUssQ0FBQztTQUN6QixDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQVMsT0FBTyxDQUFJLElBQW9CO1FBQ3ZDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBR0QsU0FBUyxVQUFVLENBQUksSUFBa0I7UUFDeEMsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUM1RyxDQUFDO0lBRUQsTUFBTSxvQkFBb0IsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFFakU7OztPQUdHO0lBQ0gsU0FBUyxlQUFlLENBQUMsRUFBZ0U7UUFDeEYsRUFBRSxDQUFDLEVBQUUs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LGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFD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RUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRWpELE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRWpELEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFakQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxD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