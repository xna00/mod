/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostTesting", "vs/workbench/api/common/extHostTestItem", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/test/common/testRPCProtocol", "vs/workbench/contrib/testing/common/testId", "vs/workbench/services/extensions/common/extensions"], function (require, exports, assert, sinon, buffer_1, cancellation_1, event_1, iterator_1, uri_1, mock_1, utils_1, editorRange, extensions_1, log_1, extHostCommands_1, extHostDocumentsAndEditors_1, extHostTesting_1, extHostTestItem_1, convert, extHostTypes_1, testRPCProtocol_1, testId_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const simplify = (item) => ({
        id: item.id,
        label: item.label,
        uri: item.uri,
        range: item.range,
    });
    const assertTreesEqual = (a, b) => {
        if (!a) {
            throw new assert.AssertionError({ message: 'Expected a to be defined', actual: a });
        }
        if (!b) {
            throw new assert.AssertionError({ message: 'Expected b to be defined', actual: b });
        }
        assert.deepStrictEqual(simplify(a), simplify(b));
        const aChildren = [...a.children].map(([_, c]) => c.id).sort();
        const bChildren = [...b.children].map(([_, c]) => c.id).sort();
        assert.strictEqual(aChildren.length, bChildren.length, `expected ${a.label}.children.length == ${b.label}.children.length`);
        aChildren.forEach(key => assertTreesEqual(a.children.get(key), b.children.get(key)));
    };
    // const assertTreeListEqual = (a: ReadonlyArray<TestItem>, b: ReadonlyArray<TestItem>) => {
    // 	assert.strictEqual(a.length, b.length, `expected a.length == n.length`);
    // 	a.forEach((_, i) => assertTreesEqual(a[i], b[i]));
    // };
    // class TestMirroredCollection extends MirroredTestCollection {
    // 	public changeEvent!: TestChangeEvent;
    // 	constructor() {
    // 		super();
    // 		this.onDidChangeTests(evt => this.changeEvent = evt);
    // 	}
    // 	public get length() {
    // 		return this.items.size;
    // 	}
    // }
    suite('ExtHost Testing', () => {
        class TestExtHostTestItemCollection extends extHostTestItem_1.ExtHostTestItemCollection {
            setDiff(diff) {
                this.diff = diff;
            }
        }
        teardown(() => {
            sinon.restore();
        });
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let single;
        setup(() => {
            single = ds.add(new TestExtHostTestItemCollection('ctrlId', 'root', {
                getDocument: () => undefined,
            }));
            single.resolveHandler = item => {
                if (item === undefined) {
                    const a = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-a', 'a', uri_1.URI.file('/'));
                    a.canResolveChildren = true;
                    const b = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-b', 'b', uri_1.URI.file('/'));
                    single.root.children.add(a);
                    single.root.children.add(b);
                }
                else if (item.id === 'id-a') {
                    item.children.add(new extHostTestItem_1.TestItemImpl('ctrlId', 'id-aa', 'aa', uri_1.URI.file('/')));
                    item.children.add(new extHostTestItem_1.TestItemImpl('ctrlId', 'id-ab', 'ab', uri_1.URI.file('/')));
                }
            };
            ds.add(single.onDidGenerateDiff(d => single.setDiff(d /* don't clear during testing */)));
        });
        suite('OwnedTestCollection', () => {
            test('adds a root recursively', async () => {
                await single.expand(single.root.id, Infinity);
                const a = single.root.children.get('id-a');
                const b = single.root.children.get('id-b');
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 0 /* TestDiffOpType.Add */,
                        item: { controllerId: 'ctrlId', expand: 2 /* TestItemExpandState.BusyExpanding */, item: { ...convert.TestItem.from(single.root) } }
                    },
                    {
                        op: 0 /* TestDiffOpType.Add */,
                        item: { controllerId: 'ctrlId', expand: 2 /* TestItemExpandState.BusyExpanding */, item: { ...convert.TestItem.from(a) } }
                    },
                    {
                        op: 0 /* TestDiffOpType.Add */,
                        item: { controllerId: 'ctrlId', expand: 0 /* TestItemExpandState.NotExpandable */, item: convert.TestItem.from(a.children.get('id-aa')) }
                    },
                    {
                        op: 0 /* TestDiffOpType.Add */,
                        item: { controllerId: 'ctrlId', expand: 0 /* TestItemExpandState.NotExpandable */, item: convert.TestItem.from(a.children.get('id-ab')) }
                    },
                    {
                        op: 1 /* TestDiffOpType.Update */,
                        item: { extId: new testId_1.TestId(['ctrlId', 'id-a']).toString(), expand: 3 /* TestItemExpandState.Expanded */ }
                    },
                    {
                        op: 0 /* TestDiffOpType.Add */,
                        item: { controllerId: 'ctrlId', expand: 0 /* TestItemExpandState.NotExpandable */, item: convert.TestItem.from(b) }
                    },
                    {
                        op: 1 /* TestDiffOpType.Update */,
                        item: { extId: single.root.id, expand: 3 /* TestItemExpandState.Expanded */ }
                    },
                ]);
            });
            test('parents are set correctly', () => {
                single.expand(single.root.id, Infinity);
                single.collectDiff();
                const a = single.root.children.get('id-a');
                const ab = a.children.get('id-ab');
                assert.strictEqual(a.parent, undefined);
                assert.strictEqual(ab.parent, a);
            });
            test('can add an item with same ID as root', () => {
                single.collectDiff();
                const child = new extHostTestItem_1.TestItemImpl('ctrlId', 'ctrlId', 'c', undefined);
                single.root.children.add(child);
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 0 /* TestDiffOpType.Add */,
                        item: { controllerId: 'ctrlId', expand: 0 /* TestItemExpandState.NotExpandable */, item: convert.TestItem.from(child) },
                    }
                ]);
            });
            test('no-ops if items not changed', () => {
                single.collectDiff();
                assert.deepStrictEqual(single.collectDiff(), []);
            });
            test('watches property mutations', () => {
                single.expand(single.root.id, Infinity);
                single.collectDiff();
                single.root.children.get('id-a').description = 'Hello world'; /* item a */
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 1 /* TestDiffOpType.Update */,
                        item: { extId: new testId_1.TestId(['ctrlId', 'id-a']).toString(), item: { description: 'Hello world' } },
                    }
                ]);
            });
            test('removes children', () => {
                single.expand(single.root.id, Infinity);
                single.collectDiff();
                single.root.children.delete('id-a');
                assert.deepStrictEqual(single.collectDiff(), [
                    { op: 3 /* TestDiffOpType.Remove */, itemId: new testId_1.TestId(['ctrlId', 'id-a']).toString() },
                ]);
                assert.deepStrictEqual([...single.tree.keys()].sort(), [single.root.id, new testId_1.TestId(['ctrlId', 'id-b']).toString()]);
                assert.strictEqual(single.tree.size, 2);
            });
            test('adds new children', () => {
                single.expand(single.root.id, Infinity);
                single.collectDiff();
                const child = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-ac', 'c', undefined);
                single.root.children.get('id-a').children.add(child);
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 0 /* TestDiffOpType.Add */, item: {
                            controllerId: 'ctrlId',
                            expand: 0 /* TestItemExpandState.NotExpandable */,
                            item: convert.TestItem.from(child),
                        }
                    },
                ]);
                assert.deepStrictEqual([...single.tree.values()].map(n => n.actual.id).sort(), [single.root.id, 'id-a', 'id-aa', 'id-ab', 'id-ac', 'id-b']);
                assert.strictEqual(single.tree.size, 6);
            });
            test('manages tags correctly', () => {
                single.expand(single.root.id, Infinity);
                single.collectDiff();
                const tag1 = new extHostTypes_1.TestTag('tag1');
                const tag2 = new extHostTypes_1.TestTag('tag2');
                const tag3 = new extHostTypes_1.TestTag('tag3');
                const child = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-ac', 'c', undefined);
                child.tags = [tag1, tag2];
                single.root.children.get('id-a').children.add(child);
                assert.deepStrictEqual(single.collectDiff(), [
                    { op: 6 /* TestDiffOpType.AddTag */, tag: { id: 'ctrlId\0tag1' } },
                    { op: 6 /* TestDiffOpType.AddTag */, tag: { id: 'ctrlId\0tag2' } },
                    {
                        op: 0 /* TestDiffOpType.Add */, item: {
                            controllerId: 'ctrlId',
                            expand: 0 /* TestItemExpandState.NotExpandable */,
                            item: convert.TestItem.from(child),
                        }
                    },
                ]);
                child.tags = [tag2, tag3];
                assert.deepStrictEqual(single.collectDiff(), [
                    { op: 6 /* TestDiffOpType.AddTag */, tag: { id: 'ctrlId\0tag3' } },
                    {
                        op: 1 /* TestDiffOpType.Update */, item: {
                            extId: new testId_1.TestId(['ctrlId', 'id-a', 'id-ac']).toString(),
                            item: { tags: ['ctrlId\0tag2', 'ctrlId\0tag3'] }
                        }
                    },
                    { op: 7 /* TestDiffOpType.RemoveTag */, id: 'ctrlId\0tag1' },
                ]);
                const a = single.root.children.get('id-a');
                a.tags = [tag2];
                a.children.replace([]);
                assert.deepStrictEqual(single.collectDiff().filter(t => t.op === 7 /* TestDiffOpType.RemoveTag */), [
                    { op: 7 /* TestDiffOpType.RemoveTag */, id: 'ctrlId\0tag3' },
                ]);
            });
            test('replaces on uri change', () => {
                single.expand(single.root.id, Infinity);
                single.collectDiff();
                const oldA = single.root.children.get('id-a');
                const uri = single.root.children.get('id-a').uri?.with({ path: '/different' });
                const newA = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-a', 'Hello world', uri);
                newA.children.replace([...oldA.children].map(([_, item]) => item));
                single.root.children.replace([...single.root.children].map(([id, i]) => id === 'id-a' ? newA : i));
                assert.deepStrictEqual(single.collectDiff(), [
                    { op: 3 /* TestDiffOpType.Remove */, itemId: new testId_1.TestId(['ctrlId', 'id-a']).toString() },
                    {
                        op: 0 /* TestDiffOpType.Add */,
                        item: { controllerId: 'ctrlId', expand: 0 /* TestItemExpandState.NotExpandable */, item: { ...convert.TestItem.from(newA) } }
                    },
                    {
                        op: 0 /* TestDiffOpType.Add */,
                        item: { controllerId: 'ctrlId', expand: 0 /* TestItemExpandState.NotExpandable */, item: convert.TestItem.from(newA.children.get('id-aa')) }
                    },
                    {
                        op: 0 /* TestDiffOpType.Add */,
                        item: { controllerId: 'ctrlId', expand: 0 /* TestItemExpandState.NotExpandable */, item: convert.TestItem.from(newA.children.get('id-ab')) }
                    },
                ]);
            });
            test('treats in-place replacement as mutation', () => {
                single.expand(single.root.id, Infinity);
                single.collectDiff();
                const oldA = single.root.children.get('id-a');
                const uri = single.root.children.get('id-a').uri;
                const newA = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-a', 'Hello world', uri);
                newA.children.replace([...oldA.children].map(([_, item]) => item));
                single.root.children.replace([
                    newA,
                    new extHostTestItem_1.TestItemImpl('ctrlId', 'id-b', single.root.children.get('id-b').label, uri),
                ]);
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 1 /* TestDiffOpType.Update */,
                        item: { extId: new testId_1.TestId(['ctrlId', 'id-a']).toString(), expand: 3 /* TestItemExpandState.Expanded */, item: { label: 'Hello world' } },
                    },
                    {
                        op: 2 /* TestDiffOpType.DocumentSynced */,
                        docv: undefined,
                        uri: uri
                    }
                ]);
                newA.label = 'still connected';
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 1 /* TestDiffOpType.Update */,
                        item: { extId: new testId_1.TestId(['ctrlId', 'id-a']).toString(), item: { label: 'still connected' } }
                    },
                ]);
                oldA.label = 'no longer connected';
                assert.deepStrictEqual(single.collectDiff(), []);
            });
            test('treats in-place replacement as mutation deeply', () => {
                single.expand(single.root.id, Infinity);
                single.collectDiff();
                const oldA = single.root.children.get('id-a');
                const uri = oldA.uri;
                const newA = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-a', single.root.children.get('id-a').label, uri);
                const oldAA = oldA.children.get('id-aa');
                const oldAB = oldA.children.get('id-ab');
                const newAB = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-ab', 'Hello world', uri);
                newA.children.replace([oldAA, newAB]);
                single.root.children.replace([newA, single.root.children.get('id-b')]);
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 1 /* TestDiffOpType.Update */,
                        item: { extId: new testId_1.TestId(['ctrlId', 'id-a']).toString(), expand: 3 /* TestItemExpandState.Expanded */ },
                    },
                    {
                        op: 1 /* TestDiffOpType.Update */,
                        item: { extId: testId_1.TestId.fromExtHostTestItem(oldAB, 'ctrlId').toString(), item: { label: 'Hello world' } },
                    },
                    {
                        op: 2 /* TestDiffOpType.DocumentSynced */,
                        docv: undefined,
                        uri: uri
                    }
                ]);
                oldAA.label = 'still connected1';
                newAB.label = 'still connected2';
                oldAB.label = 'not connected3';
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 1 /* TestDiffOpType.Update */,
                        item: { extId: new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString(), item: { label: 'still connected1' } }
                    },
                    {
                        op: 1 /* TestDiffOpType.Update */,
                        item: { extId: new testId_1.TestId(['ctrlId', 'id-a', 'id-ab']).toString(), item: { label: 'still connected2' } }
                    },
                ]);
                assert.strictEqual(newAB.parent, newA);
                assert.strictEqual(oldAA.parent, newA);
                assert.deepStrictEqual(newA.parent, undefined);
            });
            test('moves an item to be a new child', async () => {
                await single.expand(single.root.id, 0);
                single.collectDiff();
                const b = single.root.children.get('id-b');
                const a = single.root.children.get('id-a');
                a.children.add(b);
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 3 /* TestDiffOpType.Remove */,
                        itemId: new testId_1.TestId(['ctrlId', 'id-b']).toString(),
                    },
                    {
                        op: 0 /* TestDiffOpType.Add */,
                        item: { controllerId: 'ctrlId', expand: 0 /* TestItemExpandState.NotExpandable */, item: convert.TestItem.from(b) }
                    },
                ]);
                b.label = 'still connected';
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 1 /* TestDiffOpType.Update */,
                        item: { extId: new testId_1.TestId(['ctrlId', 'id-a', 'id-b']).toString(), item: { label: 'still connected' } }
                    },
                ]);
                assert.deepStrictEqual([...single.root.children].map(([_, item]) => item), [single.root.children.get('id-a')]);
                assert.deepStrictEqual(b.parent, a);
            });
            test('sends document sync events', async () => {
                await single.expand(single.root.id, 0);
                single.collectDiff();
                const a = single.root.children.get('id-a');
                a.range = new extHostTypes_1.Range(new extHostTypes_1.Position(0, 0), new extHostTypes_1.Position(1, 0));
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 2 /* TestDiffOpType.DocumentSynced */,
                        docv: undefined,
                        uri: uri_1.URI.file('/')
                    },
                    {
                        op: 1 /* TestDiffOpType.Update */,
                        item: {
                            extId: new testId_1.TestId(['ctrlId', 'id-a']).toString(),
                            item: {
                                range: editorRange.Range.lift({
                                    endColumn: 1,
                                    endLineNumber: 2,
                                    startColumn: 1,
                                    startLineNumber: 1
                                })
                            }
                        },
                    },
                ]);
                // sends on replace even if it's a no-op
                a.range = a.range;
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 2 /* TestDiffOpType.DocumentSynced */,
                        docv: undefined,
                        uri: uri_1.URI.file('/')
                    },
                ]);
                // sends on a child replacement
                const uri = uri_1.URI.file('/');
                const a2 = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-a', 'a', uri);
                a2.range = a.range;
                single.root.children.replace([a2, single.root.children.get('id-b')]);
                assert.deepStrictEqual(single.collectDiff(), [
                    {
                        op: 2 /* TestDiffOpType.DocumentSynced */,
                        docv: undefined,
                        uri
                    },
                ]);
            });
        });
        suite('MirroredTestCollection', () => {
            // todo@connor4312: re-renable when we figure out what observing looks like we async children
            // 	let m: TestMirroredCollection;
            // 	setup(() => m = new TestMirroredCollection());
            // 	test('mirrors creation of the root', () => {
            // 		const tests = testStubs.nested();
            // 		single.addRoot(tests, 'pid');
            // 		single.expand(single.root.id, Infinity);
            // 		m.apply(single.collectDiff());
            // 		assertTreesEqual(m.rootTestItems[0], owned.getTestById(single.root.id)![1].actual);
            // 		assert.strictEqual(m.length, single.itemToInternal.size);
            // 	});
            // 	test('mirrors node deletion', () => {
            // 		const tests = testStubs.nested();
            // 		single.addRoot(tests, 'pid');
            // 		m.apply(single.collectDiff());
            // 		single.expand(single.root.id, Infinity);
            // 		tests.children!.splice(0, 1);
            // 		single.onItemChange(tests, 'pid');
            // 		single.expand(single.root.id, Infinity);
            // 		m.apply(single.collectDiff());
            // 		assertTreesEqual(m.rootTestItems[0], owned.getTestById(single.root.id)![1].actual);
            // 		assert.strictEqual(m.length, single.itemToInternal.size);
            // 	});
            // 	test('mirrors node addition', () => {
            // 		const tests = testStubs.nested();
            // 		single.addRoot(tests, 'pid');
            // 		m.apply(single.collectDiff());
            // 		tests.children![0].children!.push(stubTest('ac'));
            // 		single.onItemChange(tests, 'pid');
            // 		m.apply(single.collectDiff());
            // 		assertTreesEqual(m.rootTestItems[0], owned.getTestById(single.root.id)![1].actual);
            // 		assert.strictEqual(m.length, single.itemToInternal.size);
            // 	});
            // 	test('mirrors node update', () => {
            // 		const tests = testStubs.nested();
            // 		single.addRoot(tests, 'pid');
            // 		m.apply(single.collectDiff());
            // 		tests.children![0].description = 'Hello world'; /* item a */
            // 		single.onItemChange(tests, 'pid');
            // 		m.apply(single.collectDiff());
            // 		assertTreesEqual(m.rootTestItems[0], owned.getTestById(single.root.id)![1].actual);
            // 	});
            // 	suite('MirroredChangeCollector', () => {
            // 		let tests = testStubs.nested();
            // 		setup(() => {
            // 			tests = testStubs.nested();
            // 			single.addRoot(tests, 'pid');
            // 			m.apply(single.collectDiff());
            // 		});
            // 		test('creates change for root', () => {
            // 			assertTreeListEqual(m.changeEvent.added, [
            // 				tests,
            // 				tests.children[0],
            // 				tests.children![0].children![0],
            // 				tests.children![0].children![1],
            // 				tests.children[1],
            // 			]);
            // 			assertTreeListEqual(m.changeEvent.removed, []);
            // 			assertTreeListEqual(m.changeEvent.updated, []);
            // 		});
            // 		test('creates change for delete', () => {
            // 			const rm = tests.children.shift()!;
            // 			single.onItemChange(tests, 'pid');
            // 			m.apply(single.collectDiff());
            // 			assertTreeListEqual(m.changeEvent.added, []);
            // 			assertTreeListEqual(m.changeEvent.removed, [
            // 				{ ...rm },
            // 				{ ...rm.children![0] },
            // 				{ ...rm.children![1] },
            // 			]);
            // 			assertTreeListEqual(m.changeEvent.updated, []);
            // 		});
            // 		test('creates change for update', () => {
            // 			tests.children[0].label = 'updated!';
            // 			single.onItemChange(tests, 'pid');
            // 			m.apply(single.collectDiff());
            // 			assertTreeListEqual(m.changeEvent.added, []);
            // 			assertTreeListEqual(m.changeEvent.removed, []);
            // 			assertTreeListEqual(m.changeEvent.updated, [tests.children[0]]);
            // 		});
            // 		test('is a no-op if a node is added and removed', () => {
            // 			const nested = testStubs.nested('id2-');
            // 			tests.children.push(nested);
            // 			single.onItemChange(tests, 'pid');
            // 			tests.children.pop();
            // 			single.onItemChange(tests, 'pid');
            // 			const previousEvent = m.changeEvent;
            // 			m.apply(single.collectDiff());
            // 			assert.strictEqual(m.changeEvent, previousEvent);
            // 		});
            // 		test('is a single-op if a node is added and changed', () => {
            // 			const child = stubTest('c');
            // 			tests.children.push(child);
            // 			single.onItemChange(tests, 'pid');
            // 			child.label = 'd';
            // 			single.onItemChange(tests, 'pid');
            // 			m.apply(single.collectDiff());
            // 			assertTreeListEqual(m.changeEvent.added, [child]);
            // 			assertTreeListEqual(m.changeEvent.removed, []);
            // 			assertTreeListEqual(m.changeEvent.updated, []);
            // 		});
            // 		test('gets the common ancestor (1)', () => {
            // 			tests.children![0].children![0].label = 'za';
            // 			tests.children![0].children![1].label = 'zb';
            // 			single.onItemChange(tests, 'pid');
            // 			m.apply(single.collectDiff());
            // 		});
            // 		test('gets the common ancestor (2)', () => {
            // 			tests.children![0].children![0].label = 'za';
            // 			tests.children![1].label = 'ab';
            // 			single.onItemChange(tests, 'pid');
            // 			m.apply(single.collectDiff());
            // 		});
            // 	});
        });
        suite('TestRunTracker', () => {
            let proxy;
            let c;
            let cts;
            let configuration;
            let req;
            let dto;
            teardown(() => {
                for (const { id } of c.trackers) {
                    c.disposeTestRun(id);
                }
            });
            setup(async () => {
                proxy = (0, mock_1.mockObject)()();
                cts = new cancellation_1.CancellationTokenSource();
                c = new extHostTesting_1.TestRunCoordinator(proxy, new log_1.NullLogService());
                configuration = new extHostTesting_1.TestRunProfileImpl((0, mock_1.mockObject)()(), new Map(), new Set(), event_1.Event.None, 'ctrlId', 42, 'Do Run', extHostTypes_1.TestRunProfileKind.Run, () => { }, false);
                await single.expand(single.root.id, Infinity);
                single.collectDiff();
                req = {
                    include: undefined,
                    exclude: [single.root.children.get('id-b')],
                    profile: configuration,
                };
                dto = extHostTesting_1.TestRunDto.fromInternal({
                    controllerId: 'ctrl',
                    profileId: configuration.profileId,
                    excludeExtIds: ['id-b'],
                    runId: 'run-id',
                    testIds: [single.root.id],
                }, single);
            });
            test('tracks a run started from a main thread request', () => {
                const tracker = ds.add(c.prepareForMainThreadTestRun(req, dto, configuration, cts.token));
                assert.strictEqual(tracker.hasRunningTasks, false);
                const task1 = c.createTestRun('ctrl', single, req, 'run1', true);
                const task2 = c.createTestRun('ctrl', single, req, 'run2', true);
                assert.strictEqual(proxy.$startedExtensionTestRun.called, false);
                assert.strictEqual(tracker.hasRunningTasks, true);
                task1.appendOutput('hello');
                const taskId = proxy.$appendOutputToRun.args[0]?.[1];
                assert.deepStrictEqual([['run-id', taskId, buffer_1.VSBuffer.fromString('hello'), undefined, undefined]], proxy.$appendOutputToRun.args);
                task1.end();
                assert.strictEqual(proxy.$finishedExtensionTestRun.called, false);
                assert.strictEqual(tracker.hasRunningTasks, true);
                task2.end();
                assert.strictEqual(proxy.$finishedExtensionTestRun.called, false);
                assert.strictEqual(tracker.hasRunningTasks, false);
            });
            test('run cancel force ends after a timeout', () => {
                const clock = sinon.useFakeTimers();
                try {
                    const tracker = ds.add(c.prepareForMainThreadTestRun(req, dto, configuration, cts.token));
                    const task = c.createTestRun('ctrl', single, req, 'run1', true);
                    const onEnded = sinon.stub();
                    ds.add(tracker.onEnd(onEnded));
                    assert.strictEqual(task.token.isCancellationRequested, false);
                    assert.strictEqual(tracker.hasRunningTasks, true);
                    tracker.cancel();
                    assert.strictEqual(task.token.isCancellationRequested, true);
                    assert.strictEqual(tracker.hasRunningTasks, true);
                    clock.tick(9999);
                    assert.strictEqual(tracker.hasRunningTasks, true);
                    assert.strictEqual(onEnded.called, false);
                    clock.tick(1);
                    assert.strictEqual(onEnded.called, true);
                    assert.strictEqual(tracker.hasRunningTasks, false);
                }
                finally {
                    clock.restore();
                }
            });
            test('run cancel force ends on second cancellation request', () => {
                const tracker = ds.add(c.prepareForMainThreadTestRun(req, dto, configuration, cts.token));
                const task = c.createTestRun('ctrl', single, req, 'run1', true);
                const onEnded = sinon.stub();
                ds.add(tracker.onEnd(onEnded));
                assert.strictEqual(task.token.isCancellationRequested, false);
                assert.strictEqual(tracker.hasRunningTasks, true);
                tracker.cancel();
                assert.strictEqual(task.token.isCancellationRequested, true);
                assert.strictEqual(tracker.hasRunningTasks, true);
                assert.strictEqual(onEnded.called, false);
                tracker.cancel();
                assert.strictEqual(tracker.hasRunningTasks, false);
                assert.strictEqual(onEnded.called, true);
            });
            test('tracks a run started from an extension request', () => {
                const task1 = c.createTestRun('ctrl', single, req, 'hello world', false);
                const tracker = iterator_1.Iterable.first(c.trackers);
                assert.strictEqual(tracker.hasRunningTasks, true);
                assert.deepStrictEqual(proxy.$startedExtensionTestRun.args, [
                    [{
                            profile: { group: 2, id: 42 },
                            controllerId: 'ctrl',
                            id: tracker.id,
                            include: [single.root.id],
                            exclude: [new testId_1.TestId(['ctrlId', 'id-b']).toString()],
                            persist: false,
                            continuous: false,
                        }]
                ]);
                const task2 = c.createTestRun('ctrl', single, req, 'run2', true);
                const task3Detached = c.createTestRun('ctrl', single, { ...req }, 'task3Detached', true);
                task1.end();
                assert.strictEqual(proxy.$finishedExtensionTestRun.called, false);
                assert.strictEqual(tracker.hasRunningTasks, true);
                task2.end();
                assert.deepStrictEqual(proxy.$finishedExtensionTestRun.args, [[tracker.id]]);
                assert.strictEqual(tracker.hasRunningTasks, false);
                task3Detached.end();
            });
            test('adds tests to run smartly', () => {
                const task1 = c.createTestRun('ctrlId', single, req, 'hello world', false);
                const tracker = iterator_1.Iterable.first(c.trackers);
                const expectedArgs = [];
                assert.deepStrictEqual(proxy.$addTestsToRun.args, expectedArgs);
                task1.passed(single.root.children.get('id-a').children.get('id-aa'));
                expectedArgs.push([
                    'ctrlId',
                    tracker.id,
                    [
                        convert.TestItem.from(single.root),
                        convert.TestItem.from(single.root.children.get('id-a')),
                        convert.TestItem.from(single.root.children.get('id-a').children.get('id-aa')),
                    ]
                ]);
                assert.deepStrictEqual(proxy.$addTestsToRun.args, expectedArgs);
                task1.enqueued(single.root.children.get('id-a').children.get('id-ab'));
                expectedArgs.push([
                    'ctrlId',
                    tracker.id,
                    [
                        convert.TestItem.from(single.root.children.get('id-a')),
                        convert.TestItem.from(single.root.children.get('id-a').children.get('id-ab')),
                    ],
                ]);
                assert.deepStrictEqual(proxy.$addTestsToRun.args, expectedArgs);
                task1.passed(single.root.children.get('id-a').children.get('id-ab'));
                assert.deepStrictEqual(proxy.$addTestsToRun.args, expectedArgs);
                task1.end();
            });
            test('adds test messages to run', () => {
                const test1 = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-c', 'test c', uri_1.URI.file('/testc.txt'));
                const test2 = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-d', 'test d', uri_1.URI.file('/testd.txt'));
                test1.range = test2.range = new extHostTypes_1.Range(new extHostTypes_1.Position(0, 0), new extHostTypes_1.Position(1, 0));
                single.root.children.replace([test1, test2]);
                const task = c.createTestRun('ctrlId', single, req, 'hello world', false);
                const message1 = new extHostTypes_1.TestMessage('some message');
                message1.location = new extHostTypes_1.Location(uri_1.URI.file('/a.txt'), new extHostTypes_1.Position(0, 0));
                task.failed(test1, message1);
                const args = proxy.$appendTestMessagesInRun.args[0];
                assert.deepStrictEqual(proxy.$appendTestMessagesInRun.args[0], [
                    args[0],
                    args[1],
                    new testId_1.TestId(['ctrlId', 'id-c']).toString(),
                    [{
                            message: 'some message',
                            type: 0 /* TestMessageType.Error */,
                            expected: undefined,
                            contextValue: undefined,
                            actual: undefined,
                            location: convert.location.from(message1.location)
                        }]
                ]);
                // should use test location as default
                task.failed(test2, new extHostTypes_1.TestMessage('some message'));
                assert.deepStrictEqual(proxy.$appendTestMessagesInRun.args[1], [
                    args[0],
                    args[1],
                    new testId_1.TestId(['ctrlId', 'id-d']).toString(),
                    [{
                            message: 'some message',
                            type: 0 /* TestMessageType.Error */,
                            contextValue: undefined,
                            expected: undefined,
                            actual: undefined,
                            location: convert.location.from({ uri: test2.uri, range: test2.range }),
                        }]
                ]);
                task.end();
            });
            test('guards calls after runs are ended', () => {
                const task = c.createTestRun('ctrl', single, req, 'hello world', false);
                task.end();
                task.failed(single.root, new extHostTypes_1.TestMessage('some message'));
                task.appendOutput('output');
                assert.strictEqual(proxy.$addTestsToRun.called, false);
                assert.strictEqual(proxy.$appendOutputToRun.called, false);
                assert.strictEqual(proxy.$appendTestMessagesInRun.called, false);
            });
            test('excludes tests outside tree or explicitly excluded', () => {
                const task = c.createTestRun('ctrlId', single, {
                    profile: configuration,
                    include: [single.root.children.get('id-a')],
                    exclude: [single.root.children.get('id-a').children.get('id-aa')],
                }, 'hello world', false);
                task.passed(single.root.children.get('id-a').children.get('id-aa'));
                task.passed(single.root.children.get('id-a').children.get('id-ab'));
                assert.deepStrictEqual(proxy.$updateTestStateInRun.args.length, 1);
                const args = proxy.$updateTestStateInRun.args[0];
                assert.deepStrictEqual(proxy.$updateTestStateInRun.args, [[
                        args[0],
                        args[1],
                        new testId_1.TestId(['ctrlId', 'id-a', 'id-ab']).toString(),
                        extHostTypes_1.TestResultState.Passed,
                        undefined,
                    ]]);
                task.end();
            });
            test('sets state of test with identical local IDs (#131827)', () => {
                const testA = single.root.children.get('id-a');
                const testB = single.root.children.get('id-b');
                const childA = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-child', 'child', undefined);
                testA.children.replace([childA]);
                const childB = new extHostTestItem_1.TestItemImpl('ctrlId', 'id-child', 'child', undefined);
                testB.children.replace([childB]);
                const task1 = c.createTestRun('ctrl', single, new extHostTypes_1.TestRunRequest(), 'hello world', false);
                const tracker = iterator_1.Iterable.first(c.trackers);
                task1.passed(childA);
                task1.passed(childB);
                assert.deepStrictEqual(proxy.$addTestsToRun.args, [
                    [
                        'ctrl',
                        tracker.id,
                        [single.root, testA, childA].map(t => convert.TestItem.from(t)),
                    ],
                    [
                        'ctrl',
                        tracker.id,
                        [single.root, testB, childB].map(t => convert.TestItem.from(t)),
                    ],
                ]);
                task1.end();
            });
        });
        suite('service', () => {
            let ctrl;
            class TestExtHostTesting extends extHostTesting_1.ExtHostTesting {
                getProfileInternalId(ctrl, profile) {
                    for (const [id, p] of this.controllers.get(ctrl.id).profiles) {
                        if (profile === p) {
                            return id;
                        }
                    }
                    throw new Error('profile not found');
                }
            }
            setup(() => {
                const rpcProtocol = (0, testRPCProtocol_1.AnyCallRPCProtocol)();
                ctrl = ds.add(new TestExtHostTesting(rpcProtocol, new log_1.NullLogService(), new extHostCommands_1.ExtHostCommands(rpcProtocol, new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
                    onExtensionError() {
                        return true;
                    }
                }), new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(rpcProtocol, new log_1.NullLogService())));
            });
            test('exposes active profiles correctly', async () => {
                const extA = { ...extensions_2.nullExtensionDescription, identifier: new extensions_1.ExtensionIdentifier('ext.a'), enabledApiProposals: ['testingActiveProfile'] };
                const extB = { ...extensions_2.nullExtensionDescription, identifier: new extensions_1.ExtensionIdentifier('ext.b'), enabledApiProposals: ['testingActiveProfile'] };
                const ctrlA = ds.add(ctrl.createTestController(extA, 'a', 'ctrla'));
                const profAA = ds.add(ctrlA.createRunProfile('aa', extHostTypes_1.TestRunProfileKind.Run, () => { }));
                const profAB = ds.add(ctrlA.createRunProfile('ab', extHostTypes_1.TestRunProfileKind.Run, () => { }));
                const ctrlB = ds.add(ctrl.createTestController(extB, 'b', 'ctrlb'));
                const profBA = ds.add(ctrlB.createRunProfile('ba', extHostTypes_1.TestRunProfileKind.Run, () => { }));
                const profBB = ds.add(ctrlB.createRunProfile('bb', extHostTypes_1.TestRunProfileKind.Run, () => { }));
                const neverCalled = sinon.stub();
                // empty default state:
                assert.deepStrictEqual(profAA.isDefault, false);
                assert.deepStrictEqual(profBA.isDefault, false);
                assert.deepStrictEqual(profBB.isDefault, false);
                // fires a change event:
                const changeA = event_1.Event.toPromise(profAA.onDidChangeDefault);
                const changeBA = event_1.Event.toPromise(profBA.onDidChangeDefault);
                const changeBB = event_1.Event.toPromise(profBB.onDidChangeDefault);
                ds.add(profAB.onDidChangeDefault(neverCalled));
                assert.strictEqual(neverCalled.called, false);
                ctrl.$setDefaultRunProfiles({
                    a: [ctrl.getProfileInternalId(ctrlA, profAA)],
                    b: [ctrl.getProfileInternalId(ctrlB, profBA), ctrl.getProfileInternalId(ctrlB, profBB)]
                });
                assert.deepStrictEqual(await changeA, true);
                assert.deepStrictEqual(await changeBA, true);
                assert.deepStrictEqual(await changeBB, true);
                // updates internal state:
                assert.deepStrictEqual(profAA.isDefault, true);
                assert.deepStrictEqual(profBA.isDefault, true);
                assert.deepStrictEqual(profBB.isDefault, true);
                assert.deepStrictEqual(profAB.isDefault, false);
                // no-ops if equal
                ds.add(profAA.onDidChangeDefault(neverCalled));
                ctrl.$setDefaultRunProfiles({
                    a: [ctrl.getProfileInternalId(ctrlA, profAA)],
                });
                assert.strictEqual(neverCalled.called, false);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlc3RpbmcudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L2Jyb3dzZXIvZXh0SG9zdFRlc3RpbmcudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTRCaEcsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDckMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFO1FBQ1gsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1FBQ2pCLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztRQUNiLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztLQUNqQixDQUFDLENBQUM7SUFFSCxNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBMkIsRUFBRSxDQUEyQixFQUFFLEVBQUU7UUFDckYsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ1IsTUFBTSxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDckYsQ0FBQztRQUVELElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNSLE1BQU0sSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7UUFFRCxNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVqRCxNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFF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