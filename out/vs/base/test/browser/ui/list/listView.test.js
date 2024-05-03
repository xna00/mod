/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/list/listView", "vs/base/common/arrays", "vs/base/test/common/utils"], function (require, exports, assert, listView_1, arrays_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ListView', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('all rows get disposed', function () {
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
            const listView = new listView_1.ListView(element, delegate, [renderer]);
            listView.layout(200);
            assert.strictEqual(templatesCount, 0, 'no templates have been allocated');
            listView.splice(0, 0, (0, arrays_1.range)(100));
            assert.strictEqual(templatesCount, 10, 'some templates have been allocated');
            listView.dispose();
            assert.strictEqual(templatesCount, 0, 'all templates have been disposed');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdFZpZXcudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2Jyb3dzZXIvdWkvbGlzdC9saXN0Vmlldy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLEtBQUssQ0FBQyxVQUFVLEVBQUU7UUFDakIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRTtZQUM3QixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQztZQUMvQixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7WUFFOUIsTUFBTSxRQUFRLEdBQWlDO2dCQUM5QyxTQUFTLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixhQUFhLEtBQUssT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDO2FBQ3RDLENBQUM7WUFFRixJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7WUFFdkIsTUFBTSxRQUFRLEdBQWdDO2dCQUM3QyxVQUFVLEVBQUUsVUFBVTtnQkFDdEIsY0FBYyxLQUFLLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdEMsYUFBYSxLQUFLLENBQUM7Z0JBQ25CLGVBQWUsS0FBSyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDdkMsQ0FBQztZQUVGLE1BQU0sUUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBUyxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNyRSxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXJCLE1BQU0sQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO1lBQzFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFBLGNBQUssRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLEVBQUUsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO1lBQzdFLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixNQUFNLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUUsa0NBQWtDLENBQUMsQ0FBQztRQUMzRSxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=