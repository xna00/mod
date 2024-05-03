/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/event", "vs/workbench/api/common/extHostTreeViews", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/test/common/testRPCProtocol", "vs/base/test/common/mock", "vs/workbench/common/views", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensions", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils"], function (require, exports, assert, sinon, event_1, extHostTreeViews_1, extHostCommands_1, extHost_protocol_1, testRPCProtocol_1, mock_1, views_1, log_1, extensions_1, timeTravelScheduler_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostTreeView', function () {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        class RecordingShape extends (0, mock_1.mock)() {
            constructor() {
                super(...arguments);
                this.onRefresh = new event_1.Emitter();
            }
            async $registerTreeViewDataProvider(treeViewId) {
            }
            $refresh(viewId, itemsToRefresh) {
                return Promise.resolve(null).then(() => {
                    this.onRefresh.fire(itemsToRefresh);
                });
            }
            $reveal(treeViewId, itemInfo, options) {
                return Promise.resolve();
            }
            $disposeTree(treeViewId) {
                return Promise.resolve();
            }
        }
        let testObject;
        let target;
        let onDidChangeTreeNode;
        let onDidChangeTreeNodeWithId;
        let tree;
        let labels;
        let nodes;
        setup(() => {
            tree = {
                'a': {
                    'aa': {},
                    'ab': {}
                },
                'b': {
                    'ba': {},
                    'bb': {}
                }
            };
            labels = {};
            nodes = {};
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadCommands, new class extends (0, mock_1.mock)() {
                $registerCommand() { }
            });
            target = new RecordingShape();
            testObject = store.add(new extHostTreeViews_1.ExtHostTreeViews(target, new extHostCommands_1.ExtHostCommands(rpcProtocol, new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
                onExtensionError() {
                    return true;
                }
            }), new log_1.NullLogService()));
            onDidChangeTreeNode = new event_1.Emitter();
            onDidChangeTreeNodeWithId = new event_1.Emitter();
            testObject.createTreeView('testNodeTreeProvider', { treeDataProvider: aNodeTreeDataProvider() }, extensions_1.nullExtensionDescription);
            testObject.createTreeView('testNodeWithIdTreeProvider', { treeDataProvider: aNodeWithIdTreeDataProvider() }, extensions_1.nullExtensionDescription);
            testObject.createTreeView('testNodeWithHighlightsTreeProvider', { treeDataProvider: aNodeWithHighlightedLabelTreeDataProvider() }, extensions_1.nullExtensionDescription);
            return loadCompleteTree('testNodeTreeProvider');
        });
        test('construct node tree', () => {
            return testObject.$getChildren('testNodeTreeProvider')
                .then(elements => {
                const actuals = elements?.map(e => e.handle);
                assert.deepStrictEqual(actuals, ['0/0:a', '0/0:b']);
                return Promise.all([
                    testObject.$getChildren('testNodeTreeProvider', '0/0:a')
                        .then(children => {
                        const actuals = children?.map(e => e.handle);
                        assert.deepStrictEqual(actuals, ['0/0:a/0:aa', '0/0:a/0:ab']);
                        return Promise.all([
                            testObject.$getChildren('testNodeTreeProvider', '0/0:a/0:aa').then(children => assert.strictEqual(children?.length, 0)),
                            testObject.$getChildren('testNodeTreeProvider', '0/0:a/0:ab').then(children => assert.strictEqual(children?.length, 0))
                        ]);
                    }),
                    testObject.$getChildren('testNodeTreeProvider', '0/0:b')
                        .then(children => {
                        const actuals = children?.map(e => e.handle);
                        assert.deepStrictEqual(actuals, ['0/0:b/0:ba', '0/0:b/0:bb']);
                        return Promise.all([
                            testObject.$getChildren('testNodeTreeProvider', '0/0:b/0:ba').then(children => assert.strictEqual(children?.length, 0)),
                            testObject.$getChildren('testNodeTreeProvider', '0/0:b/0:bb').then(children => assert.strictEqual(children?.length, 0))
                        ]);
                    })
                ]);
            });
        });
        test('construct id tree', () => {
            return testObject.$getChildren('testNodeWithIdTreeProvider')
                .then(elements => {
                const actuals = elements?.map(e => e.handle);
                assert.deepStrictEqual(actuals, ['1/a', '1/b']);
                return Promise.all([
                    testObject.$getChildren('testNodeWithIdTreeProvider', '1/a')
                        .then(children => {
                        const actuals = children?.map(e => e.handle);
                        assert.deepStrictEqual(actuals, ['1/aa', '1/ab']);
                        return Promise.all([
                            testObject.$getChildren('testNodeWithIdTreeProvider', '1/aa').then(children => assert.strictEqual(children?.length, 0)),
                            testObject.$getChildren('testNodeWithIdTreeProvider', '1/ab').then(children => assert.strictEqual(children?.length, 0))
                        ]);
                    }),
                    testObject.$getChildren('testNodeWithIdTreeProvider', '1/b')
                        .then(children => {
                        const actuals = children?.map(e => e.handle);
                        assert.deepStrictEqual(actuals, ['1/ba', '1/bb']);
                        return Promise.all([
                            testObject.$getChildren('testNodeWithIdTreeProvider', '1/ba').then(children => assert.strictEqual(children?.length, 0)),
                            testObject.$getChildren('testNodeWithIdTreeProvider', '1/bb').then(children => assert.strictEqual(children?.length, 0))
                        ]);
                    })
                ]);
            });
        });
        test('construct highlights tree', () => {
            return testObject.$getChildren('testNodeWithHighlightsTreeProvider')
                .then(elements => {
                assert.deepStrictEqual(removeUnsetKeys(elements), [{
                        handle: '1/a',
                        label: { label: 'a', highlights: [[0, 2], [3, 5]] },
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed
                    }, {
                        handle: '1/b',
                        label: { label: 'b', highlights: [[0, 2], [3, 5]] },
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed
                    }]);
                return Promise.all([
                    testObject.$getChildren('testNodeWithHighlightsTreeProvider', '1/a')
                        .then(children => {
                        assert.deepStrictEqual(removeUnsetKeys(children), [{
                                handle: '1/aa',
                                parentHandle: '1/a',
                                label: { label: 'aa', highlights: [[0, 2], [3, 5]] },
                                collapsibleState: views_1.TreeItemCollapsibleState.None
                            }, {
                                handle: '1/ab',
                                parentHandle: '1/a',
                                label: { label: 'ab', highlights: [[0, 2], [3, 5]] },
                                collapsibleState: views_1.TreeItemCollapsibleState.None
                            }]);
                    }),
                    testObject.$getChildren('testNodeWithHighlightsTreeProvider', '1/b')
                        .then(children => {
                        assert.deepStrictEqual(removeUnsetKeys(children), [{
                                handle: '1/ba',
                                parentHandle: '1/b',
                                label: { label: 'ba', highlights: [[0, 2], [3, 5]] },
                                collapsibleState: views_1.TreeItemCollapsibleState.None
                            }, {
                                handle: '1/bb',
                                parentHandle: '1/b',
                                label: { label: 'bb', highlights: [[0, 2], [3, 5]] },
                                collapsibleState: views_1.TreeItemCollapsibleState.None
                            }]);
                    })
                ]);
            });
        });
        test('error is thrown if id is not unique', (done) => {
            tree['a'] = {
                'aa': {},
            };
            tree['b'] = {
                'aa': {},
                'ba': {}
            };
            let caughtExpectedError = false;
            store.add(target.onRefresh.event(() => {
                testObject.$getChildren('testNodeWithIdTreeProvider')
                    .then(elements => {
                    const actuals = elements?.map(e => e.handle);
                    assert.deepStrictEqual(actuals, ['1/a', '1/b']);
                    return testObject.$getChildren('testNodeWithIdTreeProvider', '1/a')
                        .then(() => testObject.$getChildren('testNodeWithIdTreeProvider', '1/b'))
                        .then(() => assert.fail('Should fail with duplicate id'))
                        .catch(() => caughtExpectedError = true)
                        .finally(() => caughtExpectedError ? done() : assert.fail('Expected duplicate id error not thrown.'));
                });
            }));
            onDidChangeTreeNode.fire(undefined);
        });
        test('refresh root', function (done) {
            store.add(target.onRefresh.event(actuals => {
                assert.strictEqual(undefined, actuals);
                done();
            }));
            onDidChangeTreeNode.fire(undefined);
        });
        test('refresh a parent node', () => {
            return new Promise((c, e) => {
                store.add(target.onRefresh.event(actuals => {
                    assert.deepStrictEqual(['0/0:b'], Object.keys(actuals));
                    assert.deepStrictEqual(removeUnsetKeys(actuals['0/0:b']), {
                        handle: '0/0:b',
                        label: { label: 'b' },
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed
                    });
                    c(undefined);
                }));
                onDidChangeTreeNode.fire(getNode('b'));
            });
        });
        test('refresh a leaf node', function (done) {
            store.add(target.onRefresh.event(actuals => {
                assert.deepStrictEqual(['0/0:b/0:bb'], Object.keys(actuals));
                assert.deepStrictEqual(removeUnsetKeys(actuals['0/0:b/0:bb']), {
                    handle: '0/0:b/0:bb',
                    parentHandle: '0/0:b',
                    label: { label: 'bb' },
                    collapsibleState: views_1.TreeItemCollapsibleState.None
                });
                done();
            }));
            onDidChangeTreeNode.fire(getNode('bb'));
        });
        async function runWithEventMerging(action) {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                await new Promise((resolve) => {
                    let subscription = undefined;
                    subscription = target.onRefresh.event(() => {
                        subscription.dispose();
                        resolve();
                    });
                    onDidChangeTreeNode.fire(getNode('b'));
                });
                await new Promise(action);
            });
        }
        test('refresh parent and child node trigger refresh only on parent - scenario 1', async () => {
            return runWithEventMerging((resolve) => {
                store.add(target.onRefresh.event(actuals => {
                    assert.deepStrictEqual(['0/0:b', '0/0:a/0:aa'], Object.keys(actuals));
                    assert.deepStrictEqual(removeUnsetKeys(actuals['0/0:b']), {
                        handle: '0/0:b',
                        label: { label: 'b' },
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed
                    });
                    assert.deepStrictEqual(removeUnsetKeys(actuals['0/0:a/0:aa']), {
                        handle: '0/0:a/0:aa',
                        parentHandle: '0/0:a',
                        label: { label: 'aa' },
                        collapsibleState: views_1.TreeItemCollapsibleState.None
                    });
                    resolve();
                }));
                onDidChangeTreeNode.fire(getNode('b'));
                onDidChangeTreeNode.fire(getNode('aa'));
                onDidChangeTreeNode.fire(getNode('bb'));
            });
        });
        test('refresh parent and child node trigger refresh only on parent - scenario 2', async () => {
            return runWithEventMerging((resolve) => {
                store.add(target.onRefresh.event(actuals => {
                    assert.deepStrictEqual(['0/0:a/0:aa', '0/0:b'], Object.keys(actuals));
                    assert.deepStrictEqual(removeUnsetKeys(actuals['0/0:b']), {
                        handle: '0/0:b',
                        label: { label: 'b' },
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed
                    });
                    assert.deepStrictEqual(removeUnsetKeys(actuals['0/0:a/0:aa']), {
                        handle: '0/0:a/0:aa',
                        parentHandle: '0/0:a',
                        label: { label: 'aa' },
                        collapsibleState: views_1.TreeItemCollapsibleState.None
                    });
                    resolve();
                }));
                onDidChangeTreeNode.fire(getNode('bb'));
                onDidChangeTreeNode.fire(getNode('aa'));
                onDidChangeTreeNode.fire(getNode('b'));
            });
        });
        test('refresh an element for label change', function (done) {
            labels['a'] = 'aa';
            store.add(target.onRefresh.event(actuals => {
                assert.deepStrictEqual(['0/0:a'], Object.keys(actuals));
                assert.deepStrictEqual(removeUnsetKeys(actuals['0/0:a']), {
                    handle: '0/0:aa',
                    label: { label: 'aa' },
                    collapsibleState: views_1.TreeItemCollapsibleState.Collapsed
                });
                done();
            }));
            onDidChangeTreeNode.fire(getNode('a'));
        });
        test('refresh calls are throttled on roots', () => {
            return runWithEventMerging((resolve) => {
                store.add(target.onRefresh.event(actuals => {
                    assert.strictEqual(undefined, actuals);
                    resolve();
                }));
                onDidChangeTreeNode.fire(undefined);
                onDidChangeTreeNode.fire(undefined);
                onDidChangeTreeNode.fire(undefined);
                onDidChangeTreeNode.fire(undefined);
            });
        });
        test('refresh calls are throttled on elements', () => {
            return runWithEventMerging((resolve) => {
                store.add(target.onRefresh.event(actuals => {
                    assert.deepStrictEqual(['0/0:a', '0/0:b'], Object.keys(actuals));
                    resolve();
                }));
                onDidChangeTreeNode.fire(getNode('a'));
                onDidChangeTreeNode.fire(getNode('b'));
                onDidChangeTreeNode.fire(getNode('b'));
                onDidChangeTreeNode.fire(getNode('a'));
            });
        });
        test('refresh calls are throttled on unknown elements', () => {
            return runWithEventMerging((resolve) => {
                store.add(target.onRefresh.event(actuals => {
                    assert.deepStrictEqual(['0/0:a', '0/0:b'], Object.keys(actuals));
                    resolve();
                }));
                onDidChangeTreeNode.fire(getNode('a'));
                onDidChangeTreeNode.fire(getNode('b'));
                onDidChangeTreeNode.fire(getNode('g'));
                onDidChangeTreeNode.fire(getNode('a'));
            });
        });
        test('refresh calls are throttled on unknown elements and root', () => {
            return runWithEventMerging((resolve) => {
                store.add(target.onRefresh.event(actuals => {
                    assert.strictEqual(undefined, actuals);
                    resolve();
                }));
                onDidChangeTreeNode.fire(getNode('a'));
                onDidChangeTreeNode.fire(getNode('b'));
                onDidChangeTreeNode.fire(getNode('g'));
                onDidChangeTreeNode.fire(undefined);
            });
        });
        test('refresh calls are throttled on elements and root', () => {
            return runWithEventMerging((resolve) => {
                store.add(target.onRefresh.event(actuals => {
                    assert.strictEqual(undefined, actuals);
                    resolve();
                }));
                onDidChangeTreeNode.fire(getNode('a'));
                onDidChangeTreeNode.fire(getNode('b'));
                onDidChangeTreeNode.fire(undefined);
                onDidChangeTreeNode.fire(getNode('a'));
            });
        });
        test('generate unique handles from labels by escaping them', (done) => {
            tree = {
                'a/0:b': {}
            };
            store.add(target.onRefresh.event(() => {
                testObject.$getChildren('testNodeTreeProvider')
                    .then(elements => {
                    assert.deepStrictEqual(elements?.map(e => e.handle), ['0/0:a//0:b']);
                    done();
                });
            }));
            onDidChangeTreeNode.fire(undefined);
        });
        test('tree with duplicate labels', (done) => {
            const dupItems = {
                'adup1': 'c',
                'adup2': 'g',
                'bdup1': 'e',
                'hdup1': 'i',
                'hdup2': 'l',
                'jdup1': 'k'
            };
            labels['c'] = 'a';
            labels['e'] = 'b';
            labels['g'] = 'a';
            labels['i'] = 'h';
            labels['l'] = 'h';
            labels['k'] = 'j';
            tree[dupItems['adup1']] = {};
            tree['d'] = {};
            const bdup1Tree = {};
            bdup1Tree['h'] = {};
            bdup1Tree[dupItems['hdup1']] = {};
            bdup1Tree['j'] = {};
            bdup1Tree[dupItems['jdup1']] = {};
            bdup1Tree[dupItems['hdup2']] = {};
            tree[dupItems['bdup1']] = bdup1Tree;
            tree['f'] = {};
            tree[dupItems['adup2']] = {};
            store.add(target.onRefresh.event(() => {
                testObject.$getChildren('testNodeTreeProvider')
                    .then(elements => {
                    const actuals = elements?.map(e => e.handle);
                    assert.deepStrictEqual(actuals, ['0/0:a', '0/0:b', '0/1:a', '0/0:d', '0/1:b', '0/0:f', '0/2:a']);
                    return testObject.$getChildren('testNodeTreeProvider', '0/1:b')
                        .then(elements => {
                        const actuals = elements?.map(e => e.handle);
                        assert.deepStrictEqual(actuals, ['0/1:b/0:h', '0/1:b/1:h', '0/1:b/0:j', '0/1:b/1:j', '0/1:b/2:h']);
                        done();
                    });
                });
            }));
            onDidChangeTreeNode.fire(undefined);
        });
        test('getChildren is not returned from cache if refreshed', (done) => {
            tree = {
                'c': {}
            };
            store.add(target.onRefresh.event(() => {
                testObject.$getChildren('testNodeTreeProvider')
                    .then(elements => {
                    assert.deepStrictEqual(elements?.map(e => e.handle), ['0/0:c']);
                    done();
                });
            }));
            onDidChangeTreeNode.fire(undefined);
        });
        test('getChildren is returned from cache if not refreshed', () => {
            tree = {
                'c': {}
            };
            return testObject.$getChildren('testNodeTreeProvider')
                .then(elements => {
                assert.deepStrictEqual(elements?.map(e => e.handle), ['0/0:a', '0/0:b']);
            });
        });
        test('reveal will throw an error if getParent is not implemented', () => {
            const treeView = testObject.createTreeView('treeDataProvider', { treeDataProvider: aNodeTreeDataProvider() }, extensions_1.nullExtensionDescription);
            return treeView.reveal({ key: 'a' })
                .then(() => assert.fail('Reveal should throw an error as getParent is not implemented'), () => null);
        });
        test('reveal will return empty array for root element', () => {
            const revealTarget = sinon.spy(target, '$reveal');
            const treeView = testObject.createTreeView('treeDataProvider', { treeDataProvider: aCompleteNodeTreeDataProvider() }, extensions_1.nullExtensionDescription);
            const expected = {
                item: { handle: '0/0:a', label: { label: 'a' }, collapsibleState: views_1.TreeItemCollapsibleState.Collapsed },
                parentChain: []
            };
            return treeView.reveal({ key: 'a' })
                .then(() => {
                assert.ok(revealTarget.calledOnce);
                assert.deepStrictEqual('treeDataProvider', revealTarget.args[0][0]);
                assert.deepStrictEqual(expected, removeUnsetKeys(revealTarget.args[0][1]));
                assert.deepStrictEqual({ select: true, focus: false, expand: false }, revealTarget.args[0][2]);
            });
        });
        test('reveal will return parents array for an element when hierarchy is not loaded', () => {
            const revealTarget = sinon.spy(target, '$reveal');
            const treeView = testObject.createTreeView('treeDataProvider', { treeDataProvider: aCompleteNodeTreeDataProvider() }, extensions_1.nullExtensionDescription);
            const expected = {
                item: { handle: '0/0:a/0:aa', label: { label: 'aa' }, collapsibleState: views_1.TreeItemCollapsibleState.None, parentHandle: '0/0:a' },
                parentChain: [{ handle: '0/0:a', label: { label: 'a' }, collapsibleState: views_1.TreeItemCollapsibleState.Collapsed }]
            };
            return treeView.reveal({ key: 'aa' })
                .then(() => {
                assert.ok(revealTarget.calledOnce);
                assert.deepStrictEqual('treeDataProvider', revealTarget.args[0][0]);
                assert.deepStrictEqual(expected.item, removeUnsetKeys(revealTarget.args[0][1].item));
                assert.deepStrictEqual(expected.parentChain, (revealTarget.args[0][1].parentChain).map(arg => removeUnsetKeys(arg)));
                assert.deepStrictEqual({ select: true, focus: false, expand: false }, revealTarget.args[0][2]);
            });
        });
        test('reveal will return parents array for an element when hierarchy is loaded', () => {
            const revealTarget = sinon.spy(target, '$reveal');
            const treeView = testObject.createTreeView('treeDataProvider', { treeDataProvider: aCompleteNodeTreeDataProvider() }, extensions_1.nullExtensionDescription);
            const expected = {
                item: { handle: '0/0:a/0:aa', label: { label: 'aa' }, collapsibleState: views_1.TreeItemCollapsibleState.None, parentHandle: '0/0:a' },
                parentChain: [{ handle: '0/0:a', label: { label: 'a' }, collapsibleState: views_1.TreeItemCollapsibleState.Collapsed }]
            };
            return testObject.$getChildren('treeDataProvider')
                .then(() => testObject.$getChildren('treeDataProvider', '0/0:a'))
                .then(() => treeView.reveal({ key: 'aa' })
                .then(() => {
                assert.ok(revealTarget.calledOnce);
                assert.deepStrictEqual('treeDataProvider', revealTarget.args[0][0]);
                assert.deepStrictEqual(expected.item, removeUnsetKeys(revealTarget.args[0][1].item));
                assert.deepStrictEqual(expected.parentChain, (revealTarget.args[0][1].parentChain).map(arg => removeUnsetKeys(arg)));
                assert.deepStrictEqual({ select: true, focus: false, expand: false }, revealTarget.args[0][2]);
            }));
        });
        test('reveal will return parents array for deeper element with no selection', () => {
            tree = {
                'b': {
                    'ba': {
                        'bac': {}
                    }
                }
            };
            const revealTarget = sinon.spy(target, '$reveal');
            const treeView = testObject.createTreeView('treeDataProvider', { treeDataProvider: aCompleteNodeTreeDataProvider() }, extensions_1.nullExtensionDescription);
            const expected = {
                item: { handle: '0/0:b/0:ba/0:bac', label: { label: 'bac' }, collapsibleState: views_1.TreeItemCollapsibleState.None, parentHandle: '0/0:b/0:ba' },
                parentChain: [
                    { handle: '0/0:b', label: { label: 'b' }, collapsibleState: views_1.TreeItemCollapsibleState.Collapsed },
                    { handle: '0/0:b/0:ba', label: { label: 'ba' }, collapsibleState: views_1.TreeItemCollapsibleState.Collapsed, parentHandle: '0/0:b' }
                ]
            };
            return treeView.reveal({ key: 'bac' }, { select: false, focus: false, expand: false })
                .then(() => {
                assert.ok(revealTarget.calledOnce);
                assert.deepStrictEqual('treeDataProvider', revealTarget.args[0][0]);
                assert.deepStrictEqual(expected.item, removeUnsetKeys(revealTarget.args[0][1].item));
                assert.deepStrictEqual(expected.parentChain, (revealTarget.args[0][1].parentChain).map(arg => removeUnsetKeys(arg)));
                assert.deepStrictEqual({ select: false, focus: false, expand: false }, revealTarget.args[0][2]);
            });
        });
        test('reveal after first udpate', () => {
            const revealTarget = sinon.spy(target, '$reveal');
            const treeView = testObject.createTreeView('treeDataProvider', { treeDataProvider: aCompleteNodeTreeDataProvider() }, extensions_1.nullExtensionDescription);
            const expected = {
                item: { handle: '0/0:a/0:ac', label: { label: 'ac' }, collapsibleState: views_1.TreeItemCollapsibleState.None, parentHandle: '0/0:a' },
                parentChain: [{ handle: '0/0:a', label: { label: 'a' }, collapsibleState: views_1.TreeItemCollapsibleState.Collapsed }]
            };
            return loadCompleteTree('treeDataProvider')
                .then(() => {
                tree = {
                    'a': {
                        'aa': {},
                        'ac': {}
                    },
                    'b': {
                        'ba': {},
                        'bb': {}
                    }
                };
                onDidChangeTreeNode.fire(getNode('a'));
                return treeView.reveal({ key: 'ac' })
                    .then(() => {
                    assert.ok(revealTarget.calledOnce);
                    assert.deepStrictEqual('treeDataProvider', revealTarget.args[0][0]);
                    assert.deepStrictEqual(expected.item, removeUnsetKeys(revealTarget.args[0][1].item));
                    assert.deepStrictEqual(expected.parentChain, (revealTarget.args[0][1].parentChain).map(arg => removeUnsetKeys(arg)));
                    assert.deepStrictEqual({ select: true, focus: false, expand: false }, revealTarget.args[0][2]);
                });
            });
        });
        test('reveal after second udpate', () => {
            const revealTarget = sinon.spy(target, '$reveal');
            const treeView = testObject.createTreeView('treeDataProvider', { treeDataProvider: aCompleteNodeTreeDataProvider() }, extensions_1.nullExtensionDescription);
            return loadCompleteTree('treeDataProvider')
                .then(() => {
                return runWithEventMerging((resolve) => {
                    tree = {
                        'a': {
                            'aa': {},
                            'ac': {}
                        },
                        'b': {
                            'ba': {},
                            'bb': {}
                        }
                    };
                    onDidChangeTreeNode.fire(getNode('a'));
                    tree = {
                        'a': {
                            'aa': {},
                            'ac': {}
                        },
                        'b': {
                            'ba': {},
                            'bc': {}
                        }
                    };
                    onDidChangeTreeNode.fire(getNode('b'));
                    resolve();
                }).then(() => {
                    return treeView.reveal({ key: 'bc' })
                        .then(() => {
                        assert.ok(revealTarget.calledOnce);
                        assert.deepStrictEqual('treeDataProvider', revealTarget.args[0][0]);
                        assert.deepStrictEqual({ handle: '0/0:b/0:bc', label: { label: 'bc' }, collapsibleState: views_1.TreeItemCollapsibleState.None, parentHandle: '0/0:b' }, removeUnsetKeys(revealTarget.args[0][1].item));
                        assert.deepStrictEqual([{ handle: '0/0:b', label: { label: 'b' }, collapsibleState: views_1.TreeItemCollapsibleState.Collapsed }], revealTarget.args[0][1].parentChain.map(arg => removeUnsetKeys(arg)));
                        assert.deepStrictEqual({ select: true, focus: false, expand: false }, revealTarget.args[0][2]);
                    });
                });
            });
        });
        function loadCompleteTree(treeId, element) {
            return testObject.$getChildren(treeId, element)
                .then(elements => elements?.map(e => loadCompleteTree(treeId, e.handle)))
                .then(() => null);
        }
        function removeUnsetKeys(obj) {
            if (Array.isArray(obj)) {
                return obj.map(o => removeUnsetKeys(o));
            }
            if (typeof obj === 'object') {
                const result = {};
                for (const key of Object.keys(obj)) {
                    if (obj[key] !== undefined) {
                        result[key] = removeUnsetKeys(obj[key]);
                    }
                }
                return result;
            }
            return obj;
        }
        function aNodeTreeDataProvider() {
            return {
                getChildren: (element) => {
                    return getChildren(element ? element.key : undefined).map(key => getNode(key));
                },
                getTreeItem: (element) => {
                    return getTreeItem(element.key);
                },
                onDidChangeTreeData: onDidChangeTreeNode.event
            };
        }
        function aCompleteNodeTreeDataProvider() {
            return {
                getChildren: (element) => {
                    return getChildren(element ? element.key : undefined).map(key => getNode(key));
                },
                getTreeItem: (element) => {
                    return getTreeItem(element.key);
                },
                getParent: ({ key }) => {
                    const parentKey = key.substring(0, key.length - 1);
                    return parentKey ? new Key(parentKey) : undefined;
                },
                onDidChangeTreeData: onDidChangeTreeNode.event
            };
        }
        function aNodeWithIdTreeDataProvider() {
            return {
                getChildren: (element) => {
                    return getChildren(element ? element.key : undefined).map(key => getNode(key));
                },
                getTreeItem: (element) => {
                    const treeItem = getTreeItem(element.key);
                    treeItem.id = element.key;
                    return treeItem;
                },
                onDidChangeTreeData: onDidChangeTreeNodeWithId.event
            };
        }
        function aNodeWithHighlightedLabelTreeDataProvider() {
            return {
                getChildren: (element) => {
                    return getChildren(element ? element.key : undefined).map(key => getNode(key));
                },
                getTreeItem: (element) => {
                    const treeItem = getTreeItem(element.key, [[0, 2], [3, 5]]);
                    treeItem.id = element.key;
                    return treeItem;
                },
                onDidChangeTreeData: onDidChangeTreeNodeWithId.event
            };
        }
        function getTreeElement(element) {
            let parent = tree;
            for (let i = 0; i < element.length; i++) {
                parent = parent[element.substring(0, i + 1)];
                if (!parent) {
                    return null;
                }
            }
            return parent;
        }
        function getChildren(key) {
            if (!key) {
                return Object.keys(tree);
            }
            const treeElement = getTreeElement(key);
            if (treeElement) {
                return Object.keys(treeElement);
            }
            return [];
        }
        function getTreeItem(key, highlights) {
            const treeElement = getTreeElement(key);
            return {
                label: { label: labels[key] || key, highlights },
                collapsibleState: treeElement && Object.keys(treeElement).length ? views_1.TreeItemCollapsibleState.Collapsed : views_1.TreeItemCollapsibleState.None
            };
        }
        function getNode(key) {
            if (!nodes[key]) {
                nodes[key] = new Key(key);
            }
            return nodes[key];
        }
        class Key {
            constructor(key) {
                this.key = key;
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRyZWVWaWV3cy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9leHRIb3N0VHJlZVZpZXdzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQmhHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtRQUN4QixNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsTUFBTSxjQUFlLFNBQVEsSUFBQSxXQUFJLEdBQTRCO1lBQTdEOztnQkFFQyxjQUFTLEdBQUcsSUFBSSxlQUFPLEVBQTJDLENBQUM7WUFtQnBFLENBQUM7WUFqQlMsS0FBSyxDQUFDLDZCQUE2QixDQUFDLFVBQWtCO1lBQy9ELENBQUM7WUFFUSxRQUFRLENBQUMsTUFBYyxFQUFFLGNBQXVEO2dCQUN4RixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ3JDLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVRLE9BQU8sQ0FBQyxVQUFrQixFQUFFLFFBQW1FLEVBQUUsT0FBdUI7Z0JBQ2hJLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLENBQUM7WUFFUSxZQUFZLENBQUMsVUFBa0I7Z0JBQ3ZDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLENBQUM7U0FFRDtRQUVELElBQUksVUFBNEIsQ0FBQztRQUNqQyxJQUFJLE1BQXNCLENBQUM7UUFDM0IsSUFBSSxtQkFBeUQsQ0FBQztRQUM5RCxJQUFJLHlCQUFtRCxDQUFDO1FBQ3hELElBQUksSUFBNEIsQ0FBQztRQUNqQyxJQUFJLE1BQWlDLENBQUM7UUFDdEMsSUFBSSxLQUF5QyxDQUFDO1FBRTlDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixJQUFJLEdBQUc7Z0JBQ04sR0FBRyxFQUFFO29CQUNKLElBQUksRUFBRSxFQUFFO29CQUNSLElBQUksRUFBRSxFQUFFO2lCQUNSO2dCQUNELEdBQUcsRUFBRTtvQkFDSixJQUFJLEVBQUUsRUFBRTtvQkFDUixJQUFJLEVBQUUsRUFBRTtpQkFDUjthQUNELENBQUM7WUFFRixNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ1osS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUVYLE1BQU0sV0FBVyxHQUFHLElBQUksaUNBQWUsRUFBRSxDQUFDO1lBRTFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsOEJBQVcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBMkI7Z0JBQ3ZGLGdCQUFnQixLQUFLLENBQUM7YUFDL0IsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7WUFDOUIsVUFBVSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxtQ0FBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxpQ0FBZSxDQUN0RSxXQUFXLEVBQ1gsSUFBSSxvQkFBYyxFQUFFLEVBQ3BCLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUFxQjtnQkFDakMsZ0JBQWdCO29CQUN4QixPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO2FBQ0QsQ0FDRCxFQUFFLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxQixtQkFBbUIsR0FBRyxJQUFJLGVBQU8sRUFBK0IsQ0FBQztZQUNqRSx5QkFBeUIsR0FBRyxJQUFJLGVBQU8sRUFBbUIsQ0FBQztZQUMzRCxVQUFVLENBQUMsY0FBYyxDQUFDLHNCQUFzQixFQUFFLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQUUsRUFBRSxFQUFFLHFDQUFxQixDQUFDLENBQUM7WUFDeEgsVUFBVSxDQUFDLGNBQWMsQ0FBQyw0QkFBNEIsRUFBRSxFQUFFLGdCQUFnQixFQUFFLDJCQUEyQixFQUFFLEVBQUUsRUFBRSxxQ0FBcUIsQ0FBQyxDQUFDO1lBQ3BJLFVBQVUsQ0FBQyxjQUFjLENBQUMsb0NBQW9DLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSx5Q0FBeUMsRUFBRSxFQUFFLEVBQUUscUNBQXFCLENBQUMsQ0FBQztZQUUxSixPQUFPLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1lBQ2hDLE9BQU8sVUFBVSxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsQ0FBQztpQkFDcEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNoQixNQUFNLE9BQU8sR0FBRyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNwRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUM7b0JBQ2xCLFVBQVUsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLEVBQUUsT0FBTyxDQUFDO3lCQUN0RCxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7d0JBQ2hCLE1BQU0sT0FBTyxHQUFHLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQzdDLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7d0JBQzlELE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQzs0QkFDbEIsVUFBVSxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsRUFBRSxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ3ZILFVBQVUsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLEVBQUUsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO3lCQUN2SCxDQUFDLENBQUM7b0JBQ0osQ0FBQyxDQUFDO29CQUNILFVBQVUsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLEVBQUUsT0FBTyxDQUFDO3lCQUN0RCxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7d0JBQ2hCLE1BQU0sT0FBTyxHQUFHLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQzdDLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7d0JBQzlELE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQzs0QkFDbEIsVUFBVSxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsRUFBRSxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ3ZILFVBQVUsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLEVBQUUsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO3lCQUN2SCxDQUFDLENBQUM7b0JBQ0osQ0FBQyxDQUFDO2lCQUNILENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBQzlCLE9BQU8sVUFBVSxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsQ0FBQztpQkFDMUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNoQixNQUFNLE9BQU8sR0FBRyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUM7b0JBQ2xCLFVBQVUsQ0FBQyxZQUFZLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxDQUFDO3lCQUMxRCxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7d0JBQ2hCLE1BQU0sT0FBTyxHQUFHLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQzdDLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7d0JBQ2xELE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQzs0QkFDbEIsVUFBVSxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsRUFBRSxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ3ZILFVBQVUsQ0FBQyxZQUFZLENBQUMsNEJBQTRCLEVBQUUsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO3lCQUN2SCxDQUFDLENBQUM7b0JBQ0osQ0FBQyxDQUFDO29CQUNILFVBQVUsQ0FBQyxZQUFZLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxDQUFDO3lCQUMxRCxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7d0JBQ2hCLE1BQU0sT0FBTyxHQUFHLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQzdDLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7d0JBQ2xELE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQzs0QkFDbEIsVUFBVSxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsRUFBRSxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ3ZILFVBQVUsQ0FBQyxZQUFZLENBQUMsNEJBQTRCLEVBQUUsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO3lCQUN2SCxDQUFDLENBQUM7b0JBQ0osQ0FBQyxDQUFDO2lCQUNILENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLE9BQU8sVUFBVSxDQUFDLFlBQVksQ0FBQyxvQ0FBb0MsQ0FBQztpQkFDbEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNoQixNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO3dCQUNsRCxNQUFNLEVBQUUsS0FBSzt3QkFDYixLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUU7d0JBQ25ELGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLFNBQVM7cUJBQ3BELEVBQUU7d0JBQ0YsTUFBTSxFQUFFLEtBQUs7d0JBQ2IsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFO3dCQUNuRCxnQkFBZ0IsRUFBRSxnQ0FBd0IsQ0FBQyxTQUFTO3FCQUNwRCxDQUFDLENBQUMsQ0FBQztnQkFDSixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUM7b0JBQ2xCLFVBQVUsQ0FBQyxZQUFZLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxDQUFDO3lCQUNsRSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7d0JBQ2hCLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0NBQ2xELE1BQU0sRUFBRSxNQUFNO2dDQUNkLFlBQVksRUFBRSxLQUFLO2dDQUNuQixLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0NBQ3BELGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLElBQUk7NkJBQy9DLEVBQUU7Z0NBQ0YsTUFBTSxFQUFFLE1BQU07Z0NBQ2QsWUFBWSxFQUFFLEtBQUs7Z0NBQ25CLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQ0FDcEQsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsSUFBSTs2QkFDL0MsQ0FBQyxDQUFDLENBQUM7b0JBQ0wsQ0FBQyxDQUFDO29CQUNILFVBQVUsQ0FBQyxZQUFZLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxDQUFDO3lCQUNsRSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7d0JBQ2hCLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0NBQ2xELE1BQU0sRUFBRSxNQUFNO2dDQUNkLFlBQVksRUFBRSxLQUFLO2dDQUNuQixLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0NBQ3BELGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLElBQUk7NkJBQy9DLEVBQUU7Z0NBQ0YsTUFBTSxFQUFFLE1BQU07Z0NBQ2QsWUFBWSxFQUFFLEtBQUs7Z0NBQ25CLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQ0FDcEQsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsSUFBSTs2QkFDL0MsQ0FBQyxDQUFDLENBQUM7b0JBQ0wsQ0FBQyxDQUFDO2lCQUNILENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNwRCxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUc7Z0JBQ1gsSUFBSSxFQUFFLEVBQUU7YUFDUixDQUFDO1lBQ0YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHO2dCQUNYLElBQUksRUFBRSxFQUFFO2dCQUNSLElBQUksRUFBRSxFQUFFO2FBQ1IsQ0FBQztZQUNGLElBQUksbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1lBQ2hDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFO2dCQUNyQyxVQUFVLENBQUMsWUFBWSxDQUFDLDRCQUE0QixDQUFDO3FCQUNuRCxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ2hCLE1BQU0sT0FBTyxHQUFHLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzdDLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ2hELE9BQU8sVUFBVSxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLENBQUM7eUJBQ2pFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLDRCQUE0QixFQUFFLEtBQUssQ0FBQyxDQUFDO3lCQUN4RSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO3lCQUN4RCxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO3lCQUN2QyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHlDQUF5QyxDQUFDLENBQUMsQ0FBQztnQkFDeEcsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osbUJBQW1CLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGNBQWMsRUFBRSxVQUFVLElBQUk7WUFDbEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksRUFBRSxDQUFDO1lBQ1IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLG1CQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7WUFDbEMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDM0IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDMUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDeEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7d0JBQ3pELE1BQU0sRUFBRSxPQUFPO3dCQUNmLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUU7d0JBQ3JCLGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLFNBQVM7cUJBQ3BELENBQUMsQ0FBQztvQkFDSCxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDSixtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQkFBcUIsRUFBRSxVQUFVLElBQUk7WUFDekMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDMUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDN0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUU7b0JBQzlELE1BQU0sRUFBRSxZQUFZO29CQUNwQixZQUFZLEVBQUUsT0FBTztvQkFDckIsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtvQkFDdEIsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsSUFBSTtpQkFDL0MsQ0FBQyxDQUFDO2dCQUNILElBQUksRUFBRSxDQUFDO1lBQ1IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxNQUFxQztZQUN2RSxNQUFNLElBQUEsd0NBQWtCLEVBQUMsRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUN2QyxNQUFNLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLEVBQUU7b0JBQ25DLElBQUksWUFBWSxHQUE0QixTQUFTLENBQUM7b0JBQ3RELFlBQVksR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7d0JBQzFDLFlBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDeEIsT0FBTyxFQUFFLENBQUM7b0JBQ1gsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxDQUFDLENBQUMsQ0FBQztnQkFDSCxNQUFNLElBQUksT0FBTyxDQUFPLE1BQU0sQ0FBQyxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELElBQUksQ0FBQywyRUFBMkUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RixPQUFPLG1CQUFtQixDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7Z0JBQ3RDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQzFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUN0RSxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTt3QkFDekQsTUFBTSxFQUFFLE9BQU87d0JBQ2YsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTt3QkFDckIsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsU0FBUztxQkFDcEQsQ0FBQyxDQUFDO29CQUNILE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFO3dCQUM5RCxNQUFNLEVBQUUsWUFBWTt3QkFDcEIsWUFBWSxFQUFFLE9BQU87d0JBQ3JCLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7d0JBQ3RCLGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLElBQUk7cUJBQy9DLENBQUMsQ0FBQztvQkFDSCxPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNKLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDdkMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDekMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywyRUFBMkUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RixPQUFPLG1CQUFtQixDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7Z0JBQ3RDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQzFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUN0RSxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTt3QkFDekQsTUFBTSxFQUFFLE9BQU87d0JBQ2YsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTt3QkFDckIsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsU0FBUztxQkFDcEQsQ0FBQyxDQUFDO29CQUNILE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFO3dCQUM5RCxNQUFNLEVBQUUsWUFBWTt3QkFDcEIsWUFBWSxFQUFFLE9BQU87d0JBQ3JCLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7d0JBQ3RCLGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLElBQUk7cUJBQy9DLENBQUMsQ0FBQztvQkFDSCxPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNKLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDeEMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxVQUFVLElBQUk7WUFDekQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUNuQixLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUMxQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTtvQkFDekQsTUFBTSxFQUFFLFFBQVE7b0JBQ2hCLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7b0JBQ3RCLGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLFNBQVM7aUJBQ3BELENBQUMsQ0FBQztnQkFDSCxJQUFJLEVBQUUsQ0FBQztZQUNSLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1lBQ2pELE9BQU8sbUJBQW1CLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDdEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ3ZDLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osbUJBQW1CLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNwQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3BDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDcEMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseUNBQXlDLEVBQUUsR0FBRyxFQUFFO1lBQ3BELE9BQU8sbUJBQW1CLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDdEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDMUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQ2pFLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDdkMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaURBQWlELEVBQUUsR0FBRyxFQUFFO1lBQzVELE9BQU8sbUJBQW1CLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDdEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDMUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQ2pFLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDdkMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMERBQTBELEVBQUUsR0FBRyxFQUFFO1lBQ3JFLE9BQU8sbUJBQW1CLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDdEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ3ZDLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDdkMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0RBQWtELEVBQUUsR0FBRyxFQUFFO1lBQzdELE9BQU8sbUJBQW1CLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDdEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ3ZDLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDcEMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0RBQXNELEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNyRSxJQUFJLEdBQUc7Z0JBQ04sT0FBTyxFQUFFLEVBQUU7YUFDWCxDQUFDO1lBRUYsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7Z0JBQ3JDLFVBQVUsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLENBQUM7cUJBQzdDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDaEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztvQkFDckUsSUFBSSxFQUFFLENBQUM7Z0JBQ1IsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osbUJBQW1CLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFFM0MsTUFBTSxRQUFRLEdBQUc7Z0JBQ2hCLE9BQU8sRUFBRSxHQUFHO2dCQUNaLE9BQU8sRUFBRSxHQUFHO2dCQUNaLE9BQU8sRUFBRSxHQUFHO2dCQUNaLE9BQU8sRUFBRSxHQUFHO2dCQUNaLE9BQU8sRUFBRSxHQUFHO2dCQUNaLE9BQU8sRUFBRSxHQUFHO2FBQ1osQ0FBQztZQUVGLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDbEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUNsQixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDbEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUNsQixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBRWxCLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUVmLE1BQU0sU0FBUyxHQUEyQixFQUFFLENBQUM7WUFDN0MsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNwQixTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2xDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDcEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNsQyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRWxDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUM7WUFDcEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNmLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFN0IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7Z0JBQ3JDLFVBQVUsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLENBQUM7cUJBQzdDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDaEIsTUFBTSxPQUFPLEdBQUcsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDN0MsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUNqRyxPQUFPLFVBQVUsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLEVBQUUsT0FBTyxDQUFDO3lCQUM3RCxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7d0JBQ2hCLE1BQU0sT0FBTyxHQUFHLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQzdDLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsV0FBVyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7d0JBQ25HLElBQUksRUFBRSxDQUFDO29CQUNSLENBQUMsQ0FBQyxDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLG1CQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxREFBcUQsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3BFLElBQUksR0FBRztnQkFDTixHQUFHLEVBQUUsRUFBRTthQUNQLENBQUM7WUFFRixLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDckMsVUFBVSxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsQ0FBQztxQkFDN0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUNoQixNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUNoRSxJQUFJLEVBQUUsQ0FBQztnQkFDUixDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixtQkFBbUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscURBQXFELEVBQUUsR0FBRyxFQUFFO1lBQ2hFLElBQUksR0FBRztnQkFDTixHQUFHLEVBQUUsRUFBRTthQUNQLENBQUM7WUFFRixPQUFPLFVBQVUsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLENBQUM7aUJBQ3BELElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDaEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDMUUsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw0REFBNEQsRUFBRSxHQUFHLEVBQUU7WUFDdkUsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLGdCQUFnQixFQUFFLHFCQUFxQixFQUFFLEVBQUUsRUFBRSxxQ0FBcUIsQ0FBQyxDQUFDO1lBQ3JJLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztpQkFDbEMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsOERBQThELENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2RyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpREFBaUQsRUFBRSxHQUFHLEVBQUU7WUFDNUQsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDbEQsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLGdCQUFnQixFQUFFLDZCQUE2QixFQUFFLEVBQUUsRUFBRSxxQ0FBcUIsQ0FBQyxDQUFDO1lBQzdJLE1BQU0sUUFBUSxHQUFHO2dCQUNoQixJQUFJLEVBQ0gsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxnQ0FBd0IsQ0FBQyxTQUFTLEVBQUU7Z0JBQ2pHLFdBQVcsRUFBRSxFQUFFO2FBQ2YsQ0FBQztZQUNGLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztpQkFDbEMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVixNQUFNLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0UsTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEVBQThFLEVBQUUsR0FBRyxFQUFFO1lBQ3pGLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSw2QkFBNkIsRUFBRSxFQUFFLEVBQUUscUNBQXFCLENBQUMsQ0FBQztZQUM3SSxNQUFNLFFBQVEsR0FBRztnQkFDaEIsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUU7Z0JBQzlILFdBQVcsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsU0FBUyxFQUFFLENBQUM7YUFDL0csQ0FBQztZQUNGLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQztpQkFDbkMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVixNQUFNLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQWUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BJLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBFQUEwRSxFQUFFLEdBQUcsRUFBRTtZQUNyRixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNsRCxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsY0FBYyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsNkJBQTZCLEVBQUUsRUFBRSxFQUFFLHFDQUFxQixDQUFDLENBQUM7WUFDN0ksTUFBTSxRQUFRLEdBQUc7Z0JBQ2hCLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFO2dCQUM5SCxXQUFXLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLFNBQVMsRUFBRSxDQUFDO2FBQy9HLENBQUM7WUFDRixPQUFPLFVBQVUsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUM7aUJBQ2hELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxDQUFDO2lCQUNoRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQztpQkFDeEMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVixNQUFNLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BFLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQWUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BJLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUVBQXVFLEVBQUUsR0FBRyxFQUFFO1lBQ2xGLElBQUksR0FBRztnQkFDTixHQUFHLEVBQUU7b0JBQ0osSUFBSSxFQUFFO3dCQUNMLEtBQUssRUFBRSxFQUFFO3FCQUNUO2lCQUNEO2FBQ0QsQ0FBQztZQUNGLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSw2QkFBNkIsRUFBRSxFQUFFLEVBQUUscUNBQXFCLENBQUMsQ0FBQztZQUM3SSxNQUFNLFFBQVEsR0FBRztnQkFDaEIsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxnQ0FBd0IsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRTtnQkFDMUksV0FBVyxFQUFFO29CQUNaLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsU0FBUyxFQUFFO29CQUNoRyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFO2lCQUM3SDthQUNELENBQUM7WUFDRixPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDO2lCQUNwRixJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNWLE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNuQyxNQUFNLENBQUMsZUFBZSxDQUFDLGtCQUFrQixFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3RGLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBZSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUMsV0FBVyxDQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEksTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pHLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSw2QkFBNkIsRUFBRSxFQUFFLEVBQUUscUNBQXFCLENBQUMsQ0FBQztZQUM3SSxNQUFNLFFBQVEsR0FBRztnQkFDaEIsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUU7Z0JBQzlILFdBQVcsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsU0FBUyxFQUFFLENBQUM7YUFDL0csQ0FBQztZQUNGLE9BQU8sZ0JBQWdCLENBQUMsa0JBQWtCLENBQUM7aUJBQ3pDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ1YsSUFBSSxHQUFHO29CQUNOLEdBQUcsRUFBRTt3QkFDSixJQUFJLEVBQUUsRUFBRTt3QkFDUixJQUFJLEVBQUUsRUFBRTtxQkFDUjtvQkFDRCxHQUFHLEVBQUU7d0JBQ0osSUFBSSxFQUFFLEVBQUU7d0JBQ1IsSUFBSSxFQUFFLEVBQUU7cUJBQ1I7aUJBQ0QsQ0FBQztnQkFDRixtQkFBbUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBRXZDLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQztxQkFDbkMsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDVixNQUFNLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDbkMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3BFLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUN0RixNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQWUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLFdBQVcsQ0FBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3BJLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEcsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDRCQUE0QixFQUFFLEdBQUcsRUFBRTtZQUN2QyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNsRCxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsY0FBYyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsNkJBQTZCLEVBQUUsRUFBRSxFQUFFLHFDQUFxQixDQUFDLENBQUM7WUFDN0ksT0FBTyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQztpQkFDekMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVixPQUFPLG1CQUFtQixDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7b0JBQ3RDLElBQUksR0FBRzt3QkFDTixHQUFHLEVBQUU7NEJBQ0osSUFBSSxFQUFFLEVBQUU7NEJBQ1IsSUFBSSxFQUFFLEVBQUU7eUJBQ1I7d0JBQ0QsR0FBRyxFQUFFOzRCQUNKLElBQUksRUFBRSxFQUFFOzRCQUNSLElBQUksRUFBRSxFQUFFO3lCQUNSO3FCQUNELENBQUM7b0JBQ0YsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN2QyxJQUFJLEdBQUc7d0JBQ04sR0FBRyxFQUFFOzRCQUNKLElBQUksRUFBRSxFQUFFOzRCQUNSLElBQUksRUFBRSxFQUFFO3lCQUNSO3dCQUNELEdBQUcsRUFBRTs0QkFDSixJQUFJLEVBQUUsRUFBRTs0QkFDUixJQUFJLEVBQUUsRUFBRTt5QkFDUjtxQkFDRCxDQUFDO29CQUNGLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDdkMsT0FBTyxFQUFFLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDWixPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUM7eUJBQ25DLElBQUksQ0FBQyxHQUFHLEVBQUU7d0JBQ1YsTUFBTSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ25DLE1BQU0sQ0FBQyxlQUFlLENBQUMsa0JBQWtCLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNwRSxNQUFNLENBQUMsZUFBZSxDQUFDLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsRUFBRSxlQUFlLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUNqTSxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxnQ0FBd0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFlLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUMsV0FBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2hOLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEcsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsU0FBUyxnQkFBZ0IsQ0FBQyxNQUFjLEVBQUUsT0FBZ0I7WUFDekQsT0FBTyxVQUFVLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUM7aUJBQzdDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7aUJBQ3hFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixDQUFDO1FBRUQsU0FBUyxlQUFlLENBQUMsR0FBUTtZQUNoQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekMsQ0FBQztZQUVELElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzdCLE1BQU0sTUFBTSxHQUEyQixFQUFFLENBQUM7Z0JBQzFDLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNwQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDNUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDekMsQ0FBQztnQkFDRixDQUFDO2dCQUNELE9BQU8sTUFBTSxDQUFDO1lBQ2YsQ0FBQztZQUNELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUVELFNBQVMscUJBQXFCO1lBQzdCLE9BQU87Z0JBQ04sV0FBVyxFQUFFLENBQUMsT0FBd0IsRUFBcUIsRUFBRTtvQkFDNUQsT0FBTyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDaEYsQ0FBQztnQkFDRCxXQUFXLEVBQUUsQ0FBQyxPQUF3QixFQUFZLEVBQUU7b0JBQ25ELE9BQU8sV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDakMsQ0FBQztnQkFDRCxtQkFBbUIsRUFBRSxtQkFBbUIsQ0FBQyxLQUFLO2FBQzlDLENBQUM7UUFDSCxDQUFDO1FBRUQsU0FBUyw2QkFBNkI7WUFDckMsT0FBTztnQkFDTixXQUFXLEVBQUUsQ0FBQyxPQUF3QixFQUFxQixFQUFFO29CQUM1RCxPQUFPLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNoRixDQUFDO2dCQUNELFdBQVcsRUFBRSxDQUFDLE9BQXdCLEVBQVksRUFBRTtvQkFDbkQsT0FBTyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNqQyxDQUFDO2dCQUNELFNBQVMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFtQixFQUErQixFQUFFO29CQUNwRSxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNuRCxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDbkQsQ0FBQztnQkFDRCxtQkFBbUIsRUFBRSxtQkFBbUIsQ0FBQyxLQUFLO2FBQzlDLENBQUM7UUFDSCxDQUFDO1FBRUQsU0FBUywyQkFBMkI7WUFDbkMsT0FBTztnQkFDTixXQUFXLEVBQUUsQ0FBQyxPQUF3QixFQUFxQixFQUFFO29CQUM1RCxPQUFPLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNoRixDQUFDO2dCQUNELFdBQVcsRUFBRSxDQUFDLE9BQXdCLEVBQVksRUFBRTtvQkFDbkQsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDMUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO29CQUMxQixPQUFPLFFBQVEsQ0FBQztnQkFDakIsQ0FBQztnQkFDRCxtQkFBbUIsRUFBRSx5QkFBeUIsQ0FBQyxLQUFLO2FBQ3BELENBQUM7UUFDSCxDQUFDO1FBRUQsU0FBUyx5Q0FBeUM7WUFDakQsT0FBTztnQkFDTixXQUFXLEVBQUUsQ0FBQyxPQUF3QixFQUFxQixFQUFFO29CQUM1RCxPQUFPLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNoRixDQUFDO2dCQUNELFdBQVcsRUFBRSxDQUFDLE9BQXdCLEVBQVksRUFBRTtvQkFDbkQsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVELFFBQVEsQ0FBQyxFQUFFLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztvQkFDMUIsT0FBTyxRQUFRLENBQUM7Z0JBQ2pCLENBQUM7Z0JBQ0QsbUJBQW1CLEVBQUUseUJBQXlCLENBQUMsS0FBSzthQUNwRCxDQUFDO1FBQ0gsQ0FBQztRQUVELFNBQVMsY0FBYyxDQUFDLE9BQWU7WUFDdEMsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDYixPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELFNBQVMsV0FBVyxDQUFDLEdBQXVCO1lBQzNDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDVixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUIsQ0FBQztZQUNELE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4QyxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNqQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUNELE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVELFNBQVMsV0FBVyxDQUFDLEdBQVcsRUFBRSxVQUErQjtZQUNoRSxNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEMsT0FBTztnQkFDTixLQUFLLEVBQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxVQUFVLEVBQUU7Z0JBQ3JELGdCQUFnQixFQUFFLFdBQVcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsZ0NBQXdCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxnQ0FBd0IsQ0FBQyxJQUFJO2FBQ3JJLENBQUM7UUFDSCxDQUFDO1FBRUQsU0FBUyxPQUFPLENBQUMsR0FBVztZQUMzQixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pCLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzQixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUVELE1BQU0sR0FBRztZQUNSLFlBQXFCLEdBQVc7Z0JBQVgsUUFBRyxHQUFILEdBQUcsQ0FBUTtZQUFJLENBQUM7U0FDckM7SUFFRixDQUFDLENBQUMsQ0FBQyJ9