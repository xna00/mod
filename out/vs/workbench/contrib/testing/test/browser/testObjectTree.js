/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/objectTree", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/common/mainThreadTestCollection", "vs/workbench/contrib/testing/test/common/testStubs"], function (require, exports, objectTree_1, event_1, lifecycle_1, index_1, mainThreadTestCollection_1, testStubs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestTreeTestHarness = void 0;
    const element = document.createElement('div');
    element.style.height = '1000px';
    element.style.width = '200px';
    class TestObjectTree extends objectTree_1.ObjectTree {
        constructor(serializer, sorter) {
            super('test', element, {
                getHeight: () => 20,
                getTemplateId: () => 'default'
            }, [
                {
                    disposeTemplate: ({ store }) => store.dispose(),
                    renderElement: ({ depth, element }, _index, { container, store }) => {
                        const render = () => {
                            container.textContent = `${depth}:${serializer(element)}`;
                            Object.assign(container.dataset, element);
                        };
                        render();
                        if (element instanceof index_1.TestItemTreeElement) {
                            store.add(element.onChange(render));
                        }
                    },
                    disposeElement: (_el, _index, { store }) => store.clear(),
                    renderTemplate: container => ({ container, store: new lifecycle_1.DisposableStore() }),
                    templateId: 'default'
                }
            ], {
                sorter: sorter ?? {
                    compare: (a, b) => serializer(a).localeCompare(serializer(b))
                }
            });
            this.layout(1000, 200);
        }
        getModel() {
            return this.model;
        }
        getRendered(getProperty) {
            const elements = element.querySelectorAll('.monaco-tl-contents');
            const sorted = [...elements].sort((a, b) => pos(a) - pos(b));
            const chain = [{ e: '', children: [] }];
            for (const element of sorted) {
                const [depthStr, label] = element.textContent.split(':');
                const depth = Number(depthStr);
                const parent = chain[depth - 1];
                const child = { e: label };
                if (getProperty) {
                    child.data = element.dataset[getProperty];
                }
                parent.children = parent.children?.concat(child) ?? [child];
                chain[depth] = child;
            }
            return chain[0].children;
        }
    }
    const pos = (element) => Number(element.parentElement.parentElement.getAttribute('aria-posinset'));
    class ByLabelTreeSorter {
        compare(a, b) {
            if (a instanceof index_1.TestTreeErrorMessage || b instanceof index_1.TestTreeErrorMessage) {
                return (a instanceof index_1.TestTreeErrorMessage ? -1 : 0) + (b instanceof index_1.TestTreeErrorMessage ? 1 : 0);
            }
            if (a instanceof index_1.TestItemTreeElement && b instanceof index_1.TestItemTreeElement && a.test.item.uri && b.test.item.uri && a.test.item.uri.toString() === b.test.item.uri.toString() && a.test.item.range && b.test.item.range) {
                const delta = a.test.item.range.startLineNumber - b.test.item.range.startLineNumber;
                if (delta !== 0) {
                    return delta;
                }
            }
            return (a.test.item.sortText || a.test.item.label).localeCompare(b.test.item.sortText || b.test.item.label);
        }
    }
    // names are hard
    class TestTreeTestHarness extends lifecycle_1.Disposable {
        constructor(makeTree, c = testStubs_1.testStubs.nested()) {
            super();
            this.c = c;
            this.onDiff = this._register(new event_1.Emitter());
            this.onFolderChange = this._register(new event_1.Emitter());
            this.isProcessingDiff = false;
            this._register(c);
            this._register(this.c.onDidGenerateDiff(d => this.c.setDiff(d /* don't clear during testing */)));
            const collection = new mainThreadTestCollection_1.MainThreadTestCollection({ asCanonicalUri: u => u }, (testId, levels) => {
                this.c.expand(testId, levels);
                if (!this.isProcessingDiff) {
                    this.onDiff.fire(this.c.collectDiff());
                }
                return Promise.resolve();
            });
            this._register(this.onDiff.event(diff => collection.apply(diff)));
            this.projection = this._register(makeTree({
                collection,
                onDidProcessDiff: this.onDiff.event,
            }));
            const sorter = new ByLabelTreeSorter();
            this.tree = this._register(new TestObjectTree(t => 'test' in t ? t.test.item.label : t.message.toString(), sorter));
            this._register(this.tree.onDidChangeCollapseState(evt => {
                if (evt.node.element instanceof index_1.TestItemTreeElement) {
                    this.projection.expandElement(evt.node.element, evt.deep ? Infinity : 0);
                }
            }));
        }
        pushDiff(...diff) {
            this.onDiff.fire(diff);
        }
        flush() {
            this.isProcessingDiff = true;
            while (this.c.currentDiff.length) {
                this.onDiff.fire(this.c.collectDiff());
            }
            this.isProcessingDiff = false;
            this.projection.applyTo(this.tree);
            return this.tree.getRendered();
        }
    }
    exports.TestTreeTestHarness = TestTreeTestHarness;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdE9iamVjdFRyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvdGVzdC9icm93c2VyL3Rlc3RPYmplY3RUcmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQztJQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7SUFFOUIsTUFBTSxjQUFrQixTQUFRLHVCQUFrQjtRQUNqRCxZQUFZLFVBQStCLEVBQUUsTUFBdUI7WUFDbkUsS0FBSyxDQUNKLE1BQU0sRUFDTixPQUFPLEVBQ1A7Z0JBQ0MsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7Z0JBQ25CLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTO2FBQzlCLEVBQ0Q7Z0JBQ0M7b0JBQ0MsZUFBZSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRTtvQkFDL0MsYUFBYSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7d0JBQ25FLE1BQU0sTUFBTSxHQUFHLEdBQUcsRUFBRTs0QkFDbkIsU0FBUyxDQUFDLFdBQVcsR0FBRyxHQUFHLEtBQUssSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzs0QkFDMUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO3dCQUMzQyxD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