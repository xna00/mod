/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/tree/dataTree", "vs/base/test/common/utils"], function (require, exports, assert, dataTree_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('DataTree', function () {
        let tree;
        const root = {
            value: -1,
            children: [
                { value: 0, children: [{ value: 10 }, { value: 11 }, { value: 12 }] },
                { value: 1 },
                { value: 2 },
            ]
        };
        const empty = {
            value: -1,
            children: []
        };
        teardown(() => tree.dispose());
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
                    templateData.textContent = `${element.element.value}`;
                }
                disposeTemplate() { }
            };
            const dataSource = new class {
                getChildren(element) {
                    return element.children || [];
                }
            };
            const identityProvider = new class {
                getId(element) {
                    return `${element.value}`;
                }
            };
            tree = new dataTree_1.DataTree('test', container, delegate, [renderer], dataSource, { identityProvider });
            tree.layout(200);
        });
        test('view state is lost implicitly', () => {
            tree.setInput(root);
            let navigator = tree.navigate();
            assert.strictEqual(navigator.next().value, 0);
            assert.strictEqual(navigator.next().value, 10);
            assert.strictEqual(navigator.next().value, 11);
            assert.strictEqual(navigator.next().value, 12);
            assert.strictEqual(navigator.next().value, 1);
            assert.strictEqual(navigator.next().value, 2);
            assert.strictEqual(navigator.next(), null);
            tree.collapse(root.children[0]);
            navigator = tree.navigate();
            assert.strictEqual(navigator.next().value, 0);
            assert.strictEqual(navigator.next().value, 1);
            assert.strictEqual(navigator.next().value, 2);
            assert.strictEqual(navigator.next(), null);
            tree.setSelection([root.children[1]]);
            tree.setFocus([root.children[2]]);
            tree.setInput(empty);
            tree.setInput(root);
            navigator = tree.navigate();
            assert.strictEqual(navigator.next().value, 0);
            assert.strictEqual(navigator.next().value, 10);
            assert.strictEqual(navigator.next().value, 11);
            assert.strictEqual(navigator.next().value, 12);
            assert.strictEqual(navigator.next().value, 1);
            assert.strictEqual(navigator.next().value, 2);
            assert.strictEqual(navigator.next(), null);
            assert.deepStrictEqual(tree.getSelection(), []);
            assert.deepStrictEqual(tree.getFocus(), []);
        });
        test('view state can be preserved', () => {
            tree.setInput(root);
            let navigator = tree.navigate();
            assert.strictEqual(navigator.next().value, 0);
            assert.strictEqual(navigator.next().value, 10);
            assert.strictEqual(navigator.next().value, 11);
            assert.strictEqual(navigator.next().value, 12);
            assert.strictEqual(navigator.next().value, 1);
            assert.strictEqual(navigator.next().value, 2);
            assert.strictEqual(navigator.next(), null);
            tree.collapse(root.children[0]);
            navigator = tree.navigate();
            assert.strictEqual(navigator.next().value, 0);
            assert.strictEqual(navigator.next().value, 1);
            assert.strictEqual(navigator.next().value, 2);
            assert.strictEqual(navigator.next(), null);
            tree.setSelection([root.children[1]]);
            tree.setFocus([root.children[2]]);
            const viewState = tree.getViewState();
            tree.setInput(empty);
            tree.setInput(root, viewState);
            navigator = tree.navigate();
            assert.strictEqual(navigator.next().value, 0);
            assert.strictEqual(navigator.next().value, 1);
            assert.strictEqual(navigator.next().value, 2);
            assert.strictEqual(navigator.next(), null);
            assert.deepStrictEqual(tree.getSelection(), [root.children[1]]);
            assert.deepStrictEqual(tree.getFocus(), [root.children[2]]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YVRyZWUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2Jyb3dzZXIvdWkvdHJlZS9kYXRhVHJlZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLEtBQUssQ0FBQyxVQUFVLEVBQUU7UUFDakIsSUFBSSxJQUFvQixDQUFDO1FBRXpCLE1BQU0sSUFBSSxHQUFNO1lBQ2YsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNULFFBQVEsRUFBRTtnQkFDVCxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDckUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO2dCQUNaLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRTthQUNaO1NBQ0QsQ0FBQztRQUVGLE1BQU0sS0FBSyxHQUFNO1lBQ2hCLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDVCxRQUFRLEVBQUUsRUFBRTtTQUNaLENBQUM7UUFFRixRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFFL0IsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hELFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztZQUNoQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUM7WUFFakMsTUFBTSxRQUFRLEdBQUcsSUFBSTtnQkFDcEIsU0FBUyxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUIsYUFBYSxLQUFhLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQzthQUM3QyxDQUFDO1lBRUYsTUFBTSxRQUFRLEdBQUcsSUFBSTtnQkFBQTtvQkFDWCxlQUFVLEdBQUcsU0FBUyxDQUFDO2dCQVFqQyxDQUFDO2dCQVBBLGNBQWMsQ0FBQyxTQUFzQjtvQkFDcEMsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUM7Z0JBQ0QsYUFBYSxDQUFDLE9BQTJCLEVBQUUsS0FBYSxFQUFFLFlBQXlCO29CQUNsRixZQUFZLENBQUMsV0FBVyxHQUFHLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDdkQsQ0FBQztnQkFDRCxlQUFlLEtBQVcsQ0FBQzthQUMzQixDQUFDO1lBRUYsTUFBTSxVQUFVLEdBQUcsSUFBSTtnQkFDdEIsV0FBVyxDQUFDLE9BQVU7b0JBQ3JCLE9BQU8sT0FBTyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7Z0JBQy9CLENBQUM7YUFDRCxDQUFDO1lBRUYsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJO2dCQUM1QixLQUFLLENBQUMsT0FBVTtvQkFDZixPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUMzQixDQUFDO2FBQ0QsQ0FBQztZQUVGLElBQUksR0FBRyxJQUFJLG1CQUFRLENBQU8sTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxVQUFVLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7WUFDckcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrQkFBK0IsRUFBRSxHQUFHLEVBQUU7WUFDMUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVwQixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFHLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFNUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsU0FBUyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM1QixNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJ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Q0FBQztZQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRTVDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbkMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBRXRDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDL0IsU0FBUyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM1QixNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUU1QyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9