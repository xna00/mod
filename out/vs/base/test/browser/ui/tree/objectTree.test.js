/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/tree/objectTree", "vs/base/test/common/utils"], function (require, exports, assert, objectTree_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ObjectTree', function () {
        suite('TreeNavigator', function () {
            let tree;
            let filter = (_) => true;
            teardown(() => {
                tree.dispose();
                filter = (_) => true;
            });
            (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
            setup(() => {
                const container = document.createElement('div');
                container.style.width = '200px';
                container.style.height = '200px';
                const delegate = new class {
                    getHeight() { return 20; }
                    getTemplateId() { return 'default'; }
                };
                const renderer = new class {
                    constructor() {
                        this.templateId = 'default';
                    }
                    renderTemplate(container) {
                        return container;
                    }
                    renderElement(element, index, templateData) {
                        templateData.textContent = `${element.element}`;
                    }
                    disposeTemplate() { }
                };
                tree = new objectTree_1.ObjectTree('test', container, delegate, [renderer], { filter: { filter: (el) => filter(el) } });
                tree.layout(200);
            });
            test('should be able to navigate', () => {
                tree.setChildren(null, [
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
                const navigator = tree.navigate();
                assert.strictEqual(navigator.current(), null);
                assert.strictEqual(navigator.next(), 0);
                assert.strictEqual(navigator.current(), 0);
                assert.strictEqual(navigator.next(), 10);
                assert.strictEqual(navigator.current(), 10);
                assert.strictEqual(navigator.next(), 11);
                assert.strictEqual(navigator.current(), 11);
                assert.strictEqual(navigator.next(), 12);
                assert.strictEqual(navigator.current(), 12);
                assert.strictEqual(navigator.next(), 1);
                assert.strictEqual(navigator.current(), 1);
                assert.strictEqual(navigator.next(), 2);
                assert.strictEqual(navigator.current(), 2);
                assert.strictEqual(navigator.previous(), 1);
                assert.strictEqual(navigator.current(), 1);
                assert.strictEqual(navigator.previous(), 12);
                assert.strictEqual(navigator.previous(), 11);
                assert.strictEqual(navigator.previous(), 10);
                assert.strictEqual(navigator.previous(), 0);
                assert.strictEqual(navigator.previous(), null);
                assert.strictEqual(navigator.next(), 0);
                assert.strictEqual(navigator.next(), 10);
                assert.strictEqual(navigator.first(), 0);
                assert.strictEqual(navigator.last(), 2);
            });
            test('should skip collapsed nodes', () => {
                tree.setChildren(null, [
                    {
                        element: 0, collapsed: true, children: [
                            { element: 10 },
                            { element: 11 },
                            { element: 12 },
                        ]
                    },
                    { element: 1 },
                    { element: 2 }
                ]);
                const navigator = tree.navigate();
                assert.strictEqual(navigator.current(), null);
                assert.strictEqual(navigator.next(), 0);
                assert.strictEqual(navigator.next(), 1);
                assert.strictEqual(navigator.next(), 2);
                assert.strictEqual(navigator.next(), null);
                assert.strictEqual(navigator.previous(), 2);
                assert.strictEqual(navigator.previous(), 1);
                assert.strictEqual(navigator.previous(), 0);
                assert.strictEqual(navigator.previous(), null);
                assert.strictEqual(navigator.next(), 0);
                assert.strictEqual(navigator.first(), 0);
                assert.strictEqual(navigator.last(), 2);
            });
            test('should skip filtered elements', () => {
                filter = el => el % 2 === 0;
                tree.setChildren(null, [
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
                const navigator = tree.navigate();
                assert.strictEqual(navigator.current(), null);
                assert.strictEqual(navigator.next(), 0);
                assert.strictEqual(navigator.next(), 10);
                assert.strictEqual(navigator.next(), 12);
                assert.strictEqual(navigator.next(), 2);
                assert.strictEqual(navigator.next(), null);
                assert.strictEqual(navigator.previous(), 2);
                assert.strictEqual(navigator.previous(), 12);
                assert.strictEqual(navigator.previous(), 10);
                assert.strictEqual(navigator.previous(), 0);
                assert.strictEqual(navigator.previous(), null);
                assert.strictEqual(navigator.next(), 0);
                assert.strictEqual(navigator.next(), 10);
                assert.strictEqual(navigator.first(), 0);
                assert.strictEqual(navigator.last(), 2);
            });
            test('should be able to start from node', () => {
                tree.setChildren(null, [
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
                const navigator = tree.navigate(1);
                assert.strictEqual(navigator.current(), 1);
                assert.strictEqual(navigator.next(), 2);
                assert.strictEqual(navigator.current(), 2);
                assert.strictEqual(navigator.previous(), 1);
                assert.strictEqual(navigator.current(), 1);
                assert.strictEqual(navigator.previous(), 12);
                assert.strictEqual(navigator.previous(), 11);
                assert.strictEqual(navigator.previous(), 10);
                assert.strictEqual(navigator.previous(), 0);
                assert.strictEqual(navigator.previous(), null);
                assert.strictEqual(navigator.next(), 0);
                assert.strictEqual(navigator.next(), 10);
                assert.strictEqual(navigator.first(), 0);
                assert.strictEqual(navigator.last(), 2);
            });
        });
        test('traits are preserved according to string identity', function () {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const delegate = new class {
                getHeight() { return 20; }
                getTemplateId() { return 'default'; }
            };
            const renderer = new class {
                constructor() {
                    this.templateId = 'default';
                }
                renderTemplate(container) {
                    return container;
                }
                renderElement(element, index, templateData) {
                    templateData.textContent = `${element.element}`;
                }
                disposeTemplate() { }
            };
            const identityProvider = new class {
                getId(element) {
                    return `${element % 100}`;
                }
            };
            const tree = new objectTree_1.ObjectTree('test', container, delegate, [renderer], { identityProvider });
            tree.layout(200);
            tree.setChildren(null, [{ element: 0 }, { element: 1 }, { element: 2 }, { element: 3 }]);
            tree.setFocus([1]);
            assert.deepStrictEqual(tree.getFocus(), [1]);
            tree.setChildren(null, [{ element: 100 }, { element: 101 }, { element: 102 }, { element: 103 }]);
            assert.deepStrictEqual(tree.getFocus(), [101]);
        });
    });
    function getRowsTextContent(container) {
        const rows = [...container.querySelectorAll('.monaco-list-row')];
        rows.sort((a, b) => parseInt(a.getAttribute('data-index')) - parseInt(b.getAttribute('data-index')));
        return rows.map(row => row.querySelector('.monaco-tl-contents').textContent);
    }
    suite('CompressibleObjectTree', function () {
        class Delegate {
            getHeight() { return 20; }
            getTemplateId() { return 'default'; }
        }
        class Renderer {
            constructor() {
                this.templateId = 'default';
            }
            renderTemplate(container) {
                return container;
            }
            renderElement(node, _, templateData) {
                templateData.textContent = `${node.element}`;
            }
            renderCompressedElements(node, _, templateData) {
                templateData.textContent = `${node.element.elements.join('/')}`;
            }
            disposeTemplate() { }
        }
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('empty', function () {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const tree = ds.add(new objectTree_1.CompressibleObjectTree('test', container, new Delegate(), [new Renderer()]));
            tree.layout(200);
            assert.strictEqual(getRowsTextContent(container).length, 0);
        });
        test('simple', function () {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const tree = ds.add(new objectTree_1.CompressibleObjectTree('test', container, new Delegate(), [new Renderer()]));
            tree.layout(200);
            tree.setChildren(null, [
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
            assert.deepStrictEqual(getRowsTextContent(container), ['0', '10', '11', '12', '1', '2']);
        });
        test('compressed', () => {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const tree = ds.add(new objectTree_1.CompressibleObjectTree('test', container, new Delegate(), [new Renderer()]));
            tree.layout(200);
            tree.setChildren(null, [
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
            ]);
            assert.deepStrictEqual(getRowsTextContent(container), ['1/11/111', '1111', '1112', '1113']);
            tree.setChildren(11, [
                { element: 111 },
                { element: 112 },
                { element: 113 },
            ]);
            assert.deepStrictEqual(getRowsTextContent(container), ['1/11', '111', '112', '113']);
            tree.setChildren(113, [
                { element: 1131 }
            ]);
            assert.deepStrictEqual(getRowsTextContent(container), ['1/11', '111', '112', '113/1131']);
            tree.setChildren(1131, [
                { element: 1132 }
            ]);
            assert.deepStrictEqual(getRowsTextContent(container), ['1/11', '111', '112', '113/1131/1132']);
            tree.setChildren(1131, [
                { element: 1132 },
                { element: 1133 },
            ]);
            assert.deepStrictEqual(getRowsTextContent(container), ['1/11', '111', '112', '113/1131', '1132', '1133']);
        });
        test('enableCompression', () => {
            const container = document.createElement('div');
            container.style.width = '200px';
            container.style.height = '200px';
            const tree = ds.add(new objectTree_1.CompressibleObjectTree('test', container, new Delegate(), [new Renderer()]));
            tree.layout(200);
            tree.setChildren(null, [
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
            ]);
            assert.deepStrictEqual(getRowsTextContent(container), ['1/11/111', '1111', '1112', '1113']);
            tree.updateOptions({ compressionEnabled: false });
            assert.deepStrictEqual(getRowsTextContent(container), ['1', '11', '111', '1111', '1112', '1113']);
            tree.updateOptions({ compressionEnabled: true });
            assert.deepStrictEqual(getRowsTextContent(container), ['1/11/111', '1111', '1112', '1113']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0VHJlZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvYnJvd3Nlci91aS90cmVlL29iamVjdFRyZWUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxLQUFLLENBQUMsWUFBWSxFQUFFO1FBRW5CLEtBQUssQ0FBQyxlQUFlLEVBQUU7WUFDdEIsSUFBSSxJQUF3QixDQUFDO1lBQzdCLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUM7WUFFakMsUUFBUSxDQUFDLEdBQUcsRUFBRTtnQkFDYixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxHQUFHLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUM7WUFDOUIsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7WUFFMUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDVixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNoRCxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7Z0JBQ2hDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQztnQkFFakMsTUFBTSxRQUFRLEdBQUcsSUFBSTtvQkFDcEIsU0FBUyxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDMUIsYUFBYSxLQUFhLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztpQkFDN0MsQ0FBQztnQkFFRixNQUFNLFFBQVEsR0FBRyxJQUFJO29CQUFBO3dCQUNYLGVBQVUsR0FBRyxTQUFTLENBQUM7b0JBUWpDLENBQUM7b0JBUEEsY0FBYyxDQUFDLFNBQXNCO3dCQUNwQyxP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