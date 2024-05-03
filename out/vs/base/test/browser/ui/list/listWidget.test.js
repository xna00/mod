/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/list/listWidget", "vs/base/common/arrays", "vs/base/common/async", "vs/base/test/common/utils"], function (require, exports, assert, listWidget_1, arrays_1, async_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ListWidget', function () {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Page up and down', async function () {
            const element = document.createElement('div');
            element.style.height = '200px';
            element.style.width = '200px';
            const delegate = {
                getHeight() { return 20; },
                getTemplateId() { return 'template'; }
            };
            let templatesCount = 0;
            const renderer = {
                templateId: 'template',
                renderTemplate() { templatesCount++; },
                renderElement() { },
                disposeTemplate() { templatesCount--; }
            };
            const listWidget = store.add(new listWidget_1.List('test', element, delegate, [renderer]));
            listWidget.layout(200);
            assert.strictEqual(templatesCount, 0, 'no templates have been allocated');
            listWidget.splice(0, 0, (0, arrays_1.range)(100));
            listWidget.focusFirst();
            listWidget.focusNextPage();
            assert.strictEqual(listWidget.getFocus()[0], 9, 'first page down moves focus to element at bottom');
            // scroll to next page is async
            listWidget.focusNextPage();
            await (0, async_1.timeout)(0);
            assert.strictEqual(listWidget.getFocus()[0], 19, 'page down to next page');
            listWidget.focusPreviousPage();
            assert.strictEqual(listWidget.getFocus()[0], 10, 'first page up moves focus to element at top');
            // scroll to previous page is async
            listWidget.focusPreviousPage();
            await (0, async_1.timeout)(0);
            assert.strictEqual(listWidget.getFocus()[0], 0, 'page down to previous page');
        });
        test('Page up and down with item taller than viewport #149502', async function () {
            const element = document.createElement('div');
            element.style.height = '200px';
            element.style.width = '200px';
            const delegate = {
                getHeight() { return 200; },
                getTemplateId() { return 'template'; }
            };
            let templatesCount = 0;
            const renderer = {
                templateId: 'template',
                renderTemplate() { templatesCount++; },
                renderElement() { },
                disposeTemplate() { templatesCount--; }
            };
            const listWidget = store.add(new listWidget_1.List('test', element, delegate, [renderer]));
            listWidget.layout(200);
            assert.strictEqual(templatesCount, 0, 'no templates have been allocated');
            listWidget.splice(0, 0, (0, arrays_1.range)(100));
            listWidget.focusFirst();
            assert.strictEqual(listWidget.getFocus()[0], 0, 'initial focus is first element');
            // scroll to next page is async
            listWidget.focusNextPage();
            await (0, async_1.timeout)(0);
            assert.strictEqual(listWidget.getFocus()[0], 1, 'page down to next page');
            // scroll to previous page is async
            listWidget.focusPreviousPage();
            await (0, async_1.timeout)(0);
            assert.strictEqual(listWidget.getFocus()[0], 0, 'page up to next page');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdFdpZGdldC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvYnJvd3Nlci91aS9saXN0L2xpc3RXaWRnZXQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxLQUFLLENBQUMsWUFBWSxFQUFFO1FBQ25CLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsS0FBSztZQUM3QixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQztZQUMvQixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7WUFFOUIsTUFBTSxRQUFRLEdBQWlDO2dCQUM5QyxTQUFTLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixhQUFhLEtBQUssT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDO2FBQ3RDLENBQUM7WUFFRixJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7WUFFdkIsTUFBTSxRQUFRLEdBQWdDO2dCQUM3QyxVQUFVLEVBQUUsVUFBVTtnQkFDdEIsY0FBYyxLQUFLLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdEMsYUFBYSxLQUFLLENBQUM7Z0JBQ25CLGVBQWUsS0FBSyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDdkMsQ0FBQztZQUVGLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxpQkFBSSxDQUFTLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXRGLFVBQVUs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