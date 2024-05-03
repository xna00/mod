/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/tree/asyncDataTree", "vs/base/common/async", "vs/base/common/iterator", "vs/base/test/common/utils"], function (require, exports, assert, asyncDataTree_1, async_1, iterator_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function find(element, id) {
        if (element.id === id) {
            return element;
        }
        if (!element.children) {
            return undefined;
        }
        for (const child of element.children) {
            const result = find(child, id);
            if (result) {
                return result;
            }
        }
        return undefined;
    }
    class Renderer {
        constructor() {
            this.templateId = 'default';
        }
        renderTemplate(container) {
            return container;
        }
        renderElement(element, index, templateData) {
            templateData.textContent = element.element.id + (element.element.suffix || '');
        }
        disposeTemplate(templateData) {
            // noop
        }
        renderCompressedElements(node, index, templateData, height) {
            const result = [];
            for (const element of node.element.elements) {
                result.push(element.id + (element.suffix || ''));
            }
            templateData.textContent = result.join('/');
        }
    }
    class IdentityProvider {
        getId(element) {
            return element.id;
        }
    }
    class VirtualDelegate {
        getHeight() { return 20; }
        getTemplateId(element) { return 'default'; }
    }
    class DataSource {
        hasChildren(element) {
            return !!element.children && element.children.length > 0;
        }
        getChildren(element) {
            return Promise.resolve(element.children || []);
        }
    }
    class Model {
        constructor(root) {
            this.root = root;
        }
        get(id) {
            const result = find(this.root, id);
            if (!result) {
                throw new Error('element not found');
            }
            return result;
        }
    }
    suite('AsyncDataTree', function () {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Collapse state should be preserved across refresh calls', async () => {
            const container = document.createElement('div');
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a'
                    }]
            });
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], new DataSource(), { identityProvider: new IdentityProvider() }));
            tree.layout(200);
            assert.strictEqual(container.querySelectorAll('.monaco-list-row').length, 0);
            await tree.setInput(model.root);
            assert.strictEqual(container.querySelectorAll('.monaco-list-row').length, 1);
            const twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(!twistie.classList.contains('collapsible'));
            assert(!twistie.classList.contains('collapsed'));
            model.get('a').children = [
                { id: 'aa' },
                { id: 'ab' },
                { id: 'ac' }
            ];
            await tree.updateChildren(model.root);
            assert.strictEqual(container.querySelectorAll('.monaco-list-row').length, 1);
            await tree.expand(model.get('a'));
            assert.strictEqual(container.querySelectorAll('.monaco-list-row').length, 4);
            model.get('a').children = [];
            await tree.updateChildren(model.root);
            assert.strictEqual(container.querySelectorAll('.monaco-list-row').length, 1);
        });
        test('issue #68648', async () => {
            const container = document.createElement('div');
            const getChildrenCalls = [];
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                getChildren(element) {
                    getChildrenCalls.push(element.id);
                    return Promise.resolve(element.children || []);
                }
            };
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a'
                    }]
            });
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], dataSource, { identityProvider: new IdentityProvider() }));
            tree.layout(200);
            await tree.setInput(model.root);
            assert.deepStrictEqual(getChildrenCalls, ['root']);
            let twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(!twistie.classList.contains('collapsible'));
            assert(!twistie.classList.contains('collapsed'));
            assert(tree.getNode().children[0].collapsed);
            model.get('a').children = [{ id: 'aa' }, { id: 'ab' }, { id: 'ac' }];
            await tree.updateChildren(model.root);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'root']);
            twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(twistie.classList.contains('collapsible'));
            assert(twistie.classList.contains('collapsed'));
            assert(tree.getNode().children[0].collapsed);
            model.get('a').children = [];
            await tree.updateChildren(model.root);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'root', 'root']);
            twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(!twistie.classList.contains('collapsible'));
            assert(!twistie.classList.contains('collapsed'));
            assert(tree.getNode().children[0].collapsed);
            model.get('a').children = [{ id: 'aa' }, { id: 'ab' }, { id: 'ac' }];
            await tree.updateChildren(model.root);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'root', 'root', 'root']);
            twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(twistie.classList.contains('collapsible'));
            assert(twistie.classList.contains('collapsed'));
            assert(tree.getNode().children[0].collapsed);
        });
        test('issue #67722 - once resolved, refreshed collapsed nodes should only get children when expanded', async () => {
            const container = document.createElement('div');
            const getChildrenCalls = [];
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                getChildren(element) {
                    getChildrenCalls.push(element.id);
                    return Promise.resolve(element.children || []);
                }
            };
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a', children: [{ id: 'aa' }, { id: 'ab' }, { id: 'ac' }]
                    }]
            });
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], dataSource, { identityProvider: new IdentityProvider() }));
            tree.layout(200);
            await tree.setInput(model.root);
            assert(tree.getNode(model.get('a')).collapsed);
            assert.deepStrictEqual(getChildrenCalls, ['root']);
            await tree.expand(model.get('a'));
            assert(!tree.getNode(model.get('a')).collapsed);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'a']);
            tree.collapse(model.get('a'));
            assert(tree.getNode(model.get('a')).collapsed);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'a']);
            await tree.updateChildren();
            assert(tree.getNode(model.get('a')).collapsed);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'a', 'root'], 'a should not be refreshed, since it\' collapsed');
        });
        test('resolved collapsed nodes which lose children should lose twistie as well', async () => {
            const container = document.createElement('div');
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a', children: [{ id: 'aa' }, { id: 'ab' }, { id: 'ac' }]
                    }]
            });
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], new DataSource(), { identityProvider: new IdentityProvider() }));
            tree.layout(200);
            await tree.setInput(model.root);
            await tree.expand(model.get('a'));
            let twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(twistie.classList.contains('collapsible'));
            assert(!twistie.classList.contains('collapsed'));
            assert(!tree.getNode(model.get('a')).collapsed);
            tree.collapse(model.get('a'));
            model.get('a').children = [];
            await tree.updateChildren(model.root);
            twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(!twistie.classList.contains('collapsible'));
            assert(!twistie.classList.contains('collapsed'));
            assert(tree.getNode(model.get('a')).collapsed);
        });
        test('issue #192422 - resolved collapsed nodes with changed children don\'t show old children', async () => {
            const container = document.createElement('div');
            let hasGottenAChildren = false;
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                async getChildren(element) {
                    if (element.id === 'a') {
                        if (!hasGottenAChildren) {
                            hasGottenAChildren = true;
                        }
                        else {
                            return [{ id: 'c' }];
                        }
                    }
                    return element.children || [];
                }
            };
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a', children: [{ id: 'b' }]
                    }]
            });
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], dataSource, { identityProvider: new IdentityProvider() }));
            tree.layout(200);
            await tree.setInput(model.root);
            const a = model.get('a');
            const aNode = tree.getNode(a);
            assert(aNode.collapsed);
            await tree.expand(a);
            assert(!aNode.collapsed);
            assert.equal(aNode.children.length, 1);
            assert.equal(aNode.children[0].element.id, 'b');
            const bChild = container.querySelector('.monaco-list-row:nth-child(2)');
            assert.equal(bChild?.textContent, 'b');
            tree.collapse(a);
            assert(aNode.collapsed);
            await tree.updateChildren(a);
            const aUpdated1 = model.get('a');
            const aNodeUpdated1 = tree.getNode(a);
            assert(aNodeUpdated1.collapsed);
            assert.equal(aNodeUpdated1.children.length, 0);
            let didCheckNoChildren = false;
            const event = tree.onDidChangeCollapseState(e => {
                const child = container.querySelector('.monaco-list-row:nth-child(2)');
                assert.equal(child, undefined);
                didCheckNoChildren = true;
            });
            await tree.expand(aUpdated1);
            event.dispose();
            assert(didCheckNoChildren);
            const aNodeUpdated2 = tree.getNode(a);
            assert(!aNodeUpdated2.collapsed);
            assert.equal(aNodeUpdated2.children.length, 1);
            assert.equal(aNodeUpdated2.children[0].element.id, 'c');
            const child = container.querySelector('.monaco-list-row:nth-child(2)');
            assert.equal(child?.textContent, 'c');
        });
        test('issue #192422 - resolved collapsed nodes with unchanged children immediately show children', async () => {
            const container = document.createElement('div');
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                async getChildren(element) {
                    return element.children || [];
                }
            };
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a', children: [{ id: 'b' }]
                    }]
            });
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], dataSource, { identityProvider: new IdentityProvider() }));
            tree.layout(200);
            await tree.setInput(model.root);
            const a = model.get('a');
            const aNode = tree.getNode(a);
            assert(aNode.collapsed);
            await tree.expand(a);
            assert(!aNode.collapsed);
            assert.equal(aNode.children.length, 1);
            assert.equal(aNode.children[0].element.id, 'b');
            const bChild = container.querySelector('.monaco-list-row:nth-child(2)');
            assert.equal(bChild?.textContent, 'b');
            tree.collapse(a);
            assert(aNode.collapsed);
            const aUpdated1 = model.get('a');
            const aNodeUpdated1 = tree.getNode(a);
            assert(aNodeUpdated1.collapsed);
            assert.equal(aNodeUpdated1.children.length, 1);
            let didCheckSameChildren = false;
            const event = tree.onDidChangeCollapseState(e => {
                const child = container.querySelector('.monaco-list-row:nth-child(2)');
                assert.equal(child?.textContent, 'b');
                didCheckSameChildren = true;
            });
            await tree.expand(aUpdated1);
            event.dispose();
            assert(didCheckSameChildren);
            const aNodeUpdated2 = tree.getNode(a);
            assert(!aNodeUpdated2.collapsed);
            assert.equal(aNodeUpdated2.children.length, 1);
            assert.equal(aNodeUpdated2.children[0].element.id, 'b');
            const child = container.querySelector('.monaco-list-row:nth-child(2)');
            assert.equal(child?.textContent, 'b');
        });
        test('support default collapse state per element', async () => {
            const container = document.createElement('div');
            const getChildrenCalls = [];
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                getChildren(element) {
                    getChildrenCalls.push(element.id);
                    return Promise.resolve(element.children || []);
                }
            };
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a', children: [{ id: 'aa' }, { id: 'ab' }, { id: 'ac' }]
                    }]
            });
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], dataSource, {
                collapseByDefault: el => el.id !== 'a'
            }));
            tree.layout(200);
            await tree.setInput(model.root);
            assert(!tree.getNode(model.get('a')).collapsed);
            assert.deepStrictEqual(getChildrenCalls, ['root', 'a']);
        });
        test('issue #80098 - concurrent refresh and expand', async () => {
            const container = document.createElement('div');
            const calls = [];
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                getChildren(element) {
                    return new Promise(c => calls.push(() => c(element.children || [])));
                }
            };
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a', children: [{
                                id: 'aa'
                            }]
                    }]
            });
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], dataSource, { identityProvider: new IdentityProvider() }));
            tree.layout(200);
            const pSetInput = tree.setInput(model.root);
            calls.pop()(); // resolve getChildren(root)
            await pSetInput;
            const pUpdateChildrenA = tree.updateChildren(model.get('a'));
            const pExpandA = tree.expand(model.get('a'));
            assert.strictEqual(calls.length, 1, 'expand(a) still hasn\'t called getChildren(a)');
            calls.pop()();
            assert.strictEqual(calls.length, 0, 'no pending getChildren calls');
            await pUpdateChildrenA;
            assert.strictEqual(calls.length, 0, 'expand(a) should not have forced a second refresh');
            const result = await pExpandA;
            assert.strictEqual(result, true, 'expand(a) should be done');
        });
        test('issue #80098 - first expand should call getChildren', async () => {
            const container = document.createElement('div');
            const calls = [];
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                getChildren(element) {
                    return new Promise(c => calls.push(() => c(element.children || [])));
                }
            };
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a', children: [{
                                id: 'aa'
                            }]
                    }]
            });
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], dataSource, { identityProvider: new IdentityProvider() }));
            tree.layout(200);
            const pSetInput = tree.setInput(model.root);
            calls.pop()(); // resolve getChildren(root)
            await pSetInput;
            const pExpandA = tree.expand(model.get('a'));
            assert.strictEqual(calls.length, 1, 'expand(a) should\'ve called getChildren(a)');
            let race = await Promise.race([pExpandA.then(() => 'expand'), (0, async_1.timeout)(1).then(() => 'timeout')]);
            assert.strictEqual(race, 'timeout', 'expand(a) should not be yet done');
            calls.pop()();
            assert.strictEqual(calls.length, 0, 'no pending getChildren calls');
            race = await Promise.race([pExpandA.then(() => 'expand'), (0, async_1.timeout)(1).then(() => 'timeout')]);
            assert.strictEqual(race, 'expand', 'expand(a) should now be done');
        });
        test('issue #78388 - tree should react to hasChildren toggles', async () => {
            const container = document.createElement('div');
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a'
                    }]
            });
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], new DataSource(), { identityProvider: new IdentityProvider() }));
            tree.layout(200);
            await tree.setInput(model.root);
            assert.strictEqual(container.querySelectorAll('.monaco-list-row').length, 1);
            let twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(!twistie.classList.contains('collapsible'));
            assert(!twistie.classList.contains('collapsed'));
            model.get('a').children = [{ id: 'aa' }];
            await tree.updateChildren(model.get('a'), false);
            assert.strictEqual(container.querySelectorAll('.monaco-list-row').length, 1);
            twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(twistie.classList.contains('collapsible'));
            assert(twistie.classList.contains('collapsed'));
            model.get('a').children = [];
            await tree.updateChildren(model.get('a'), false);
            assert.strictEqual(container.querySelectorAll('.monaco-list-row').length, 1);
            twistie = container.querySelector('.monaco-list-row:first-child .monaco-tl-twistie');
            assert(!twistie.classList.contains('collapsible'));
            assert(!twistie.classList.contains('collapsed'));
        });
        test('issues #84569, #82629 - rerender', async () => {
            const container = document.createElement('div');
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a',
                        children: [{
                                id: 'b',
                                suffix: '1'
                            }]
                    }]
            });
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], new DataSource(), { identityProvider: new IdentityProvider() }));
            tree.layout(200);
            await tree.setInput(model.root);
            await tree.expand(model.get('a'));
            assert.deepStrictEqual(Array.from(container.querySelectorAll('.monaco-list-row')).map(e => e.textContent), ['a', 'b1']);
            const a = model.get('a');
            const b = model.get('b');
            a.children?.splice(0, 1, { id: 'b', suffix: '2' });
            await Promise.all([
                tree.updateChildren(a, true, true),
                tree.updateChildren(b, true, true)
            ]);
            assert.deepStrictEqual(Array.from(container.querySelectorAll('.monaco-list-row')).map(e => e.textContent), ['a', 'b2']);
        });
        test('issue #199264 - dispose during render', async () => {
            const container = document.createElement('div');
            const model1 = new Model({
                id: 'root',
                children: [{
                        id: 'a', children: [{ id: 'aa' }, { id: 'ab' }, { id: 'ac' }]
                    }]
            });
            const model2 = new Model({
                id: 'root',
                children: [{
                        id: 'a', children: [{ id: 'aa' }, { id: 'ab' }, { id: 'ac' }]
                    }]
            });
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], new DataSource(), { identityProvider: new IdentityProvider() }));
            tree.layout(200);
            await tree.setInput(model1.root);
            const input = tree.setInput(model2.root);
            tree.dispose();
            await input;
            assert.strictEqual(container.innerHTML, '');
        });
        test('issue #121567', async () => {
            const container = document.createElement('div');
            const calls = [];
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                async getChildren(element) {
                    calls.push(element);
                    return element.children ?? iterator_1.Iterable.empty();
                }
            };
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a', children: [{
                                id: 'aa'
                            }]
                    }]
            });
            const a = model.get('a');
            const tree = store.add(new asyncDataTree_1.AsyncDataTree('test', container, new VirtualDelegate(), [new Renderer()], dataSource, { identityProvider: new IdentityProvider() }));
            tree.layout(200);
            await tree.setInput(model.root);
            assert.strictEqual(calls.length, 1, 'There should be a single getChildren call for the root');
            assert(tree.isCollapsible(a), 'a is collapsible');
            assert(tree.isCollapsed(a), 'a is collapsed');
            await tree.updateChildren(a, false);
            assert.strictEqual(calls.length, 1, 'There should be no changes to the calls list, since a was collapsed');
            assert(tree.isCollapsible(a), 'a is collapsible');
            assert(tree.isCollapsed(a), 'a is collapsed');
            const children = a.children;
            a.children = [];
            await tree.updateChildren(a, false);
            assert.strictEqual(calls.length, 1, 'There should still be no changes to the calls list, since a was collapsed');
            assert(!tree.isCollapsible(a), 'a is no longer collapsible');
            assert(tree.isCollapsed(a), 'a is collapsed');
            a.children = children;
            await tree.updateChildren(a, false);
            assert.strictEqual(calls.length, 1, 'There should still be no changes to the calls list, since a was collapsed');
            assert(tree.isCollapsible(a), 'a is collapsible again');
            assert(tree.isCollapsed(a), 'a is collapsed');
            await tree.expand(a);
            assert.strictEqual(calls.length, 2, 'Finally, there should be a getChildren call for a');
            assert(tree.isCollapsible(a), 'a is still collapsible');
            assert(!tree.isCollapsed(a), 'a is expanded');
        });
        test('issue #199441', async () => {
            const container = document.createElement('div');
            const dataSource = new class {
                hasChildren(element) {
                    return !!element.children && element.children.length > 0;
                }
                async getChildren(element) {
                    return element.children ?? iterator_1.Iterable.empty();
                }
            };
            const compressionDelegate = new class {
                isIncompressible(element) {
                    return !dataSource.hasChildren(element);
                }
            };
            const model = new Model({
                id: 'root',
                children: [{
                        id: 'a', children: [{
                                id: 'b',
                                children: [{ id: 'b.txt' }]
                            }]
                    }]
            });
            const collapseByDefault = (element) => false;
            const tree = store.add(new asyncDataTree_1.CompressibleAsyncDataTree('test', container, new VirtualDelegate(), compressionDelegate, [new Renderer()], dataSource, { identityProvider: new IdentityProvider(), collapseByDefault }));
            tree.layout(200);
            await tree.setInput(model.root);
            assert.deepStrictEqual(Array.from(container.querySelectorAll('.monaco-list-row')).map(e => e.textContent), ['a/b', 'b.txt']);
            model.get('a').children.push({
                id: 'c',
                children: [{ id: 'c.txt' }]
            });
            await tree.updateChildren(model.root, true);
            assert.deepStrictEqual(Array.from(container.querySelectorAll('.monaco-list-row')).map(e => e.textContent), ['a', 'b', 'b.txt', 'c', 'c.txt']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmNEYXRhVHJlZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvYnJvd3Nlci91aS90cmVlL2FzeW5jRGF0YVRyZWUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtCaEcsU0FBUyxJQUFJLENBQUMsT0FBZ0IsRUFBRSxFQUFVO1FBQ3pDLElBQUksT0FBTyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQztZQUN2QixPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN2QixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsS0FBSyxNQUFNLEtBQUssSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUUvQixJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE9BQU8sTUFBTSxDQUFDO1lBQ2YsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDO0lBRUQsTUFBTSxRQUFRO1FBQWQ7WUFDVSxlQUFVLEdBQUcsU0FBUyxDQUFDO1FBbUJqQyxDQUFDO1FBbEJBLGNBQWMsQ0FBQyxTQUFzQjtZQUNwQyxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsYUFBYSxDQUFDLE9BQWlDLEVBQUUsS0FBYSxFQUFFLFlBQXlCO1lBQ3hGLFlBQVksQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNoRixDQUFDO1FBQ0QsZUFBZSxDQUFDLFlB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