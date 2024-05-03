/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/registry/common/platform", "vs/workbench/browser/panecomposite", "vs/base/common/types", "vs/base/test/common/utils"], function (require, exports, assert, platform_1, panecomposite_1, types_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Viewlets', () => {
        class TestViewlet extends panecomposite_1.PaneComposite {
            constructor() {
                super('id', null, null, null, null, null, null, null);
            }
            layout(dimension) {
                throw new Error('Method not implemented.');
            }
            setBoundarySashes(sashes) {
                throw new Error('Method not implemented.');
            }
            createViewPaneContainer() { return null; }
        }
        test('ViewletDescriptor API', function () {
            const d = panecomposite_1.PaneCompositeDescriptor.create(TestViewlet, 'id', 'name', 'class', 5);
            assert.strictEqual(d.id, 'id');
            assert.strictEqual(d.name, 'name');
            assert.strictEqual(d.cssClass, 'class');
            assert.strictEqual(d.order, 5);
        });
        test('Editor Aware ViewletDescriptor API', function () {
            let d = panecomposite_1.PaneCompositeDescriptor.create(TestViewlet, 'id', 'name', 'class', 5);
            assert.strictEqual(d.id, 'id');
            assert.strictEqual(d.name, 'name');
            d = panecomposite_1.PaneCompositeDescriptor.create(TestViewlet, 'id', 'name', 'class', 5);
            assert.strictEqual(d.id, 'id');
            assert.strictEqual(d.name, 'name');
        });
        test('Viewlet extension point and registration', function () {
            assert((0, types_1.isFunction)(platform_1.Registry.as(panecomposite_1.Extensions.Viewlets).registerPaneComposite));
            assert((0, types_1.isFunction)(platform_1.Registry.as(panecomposite_1.Extensions.Viewlets).getPaneComposite));
            assert((0, types_1.isFunction)(platform_1.Registry.as(panecomposite_1.Extensions.Viewlets).getPaneComposites));
            const oldCount = platform_1.Registry.as(panecomposite_1.Extensions.Viewlets).getPaneComposites().length;
            const d = panecomposite_1.PaneCompositeDescriptor.create(TestViewlet, 'reg-test-id', 'name');
            platform_1.Registry.as(panecomposite_1.Extensions.Viewlets).registerPaneComposite(d);
            assert(d === platform_1.Registry.as(panecomposite_1.Extensions.Viewlets).getPaneComposite('reg-test-id'));
            assert.strictEqual(oldCount + 1, platform_1.Registry.as(panecomposite_1.Extensions.Viewlets).getPaneComposites().length);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld2xldC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9icm93c2VyL3ZpZXdsZXQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxLQUFLLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtRQUV0QixNQUFNLFdBQVksU0FBUSw2QkFBYTtZQUV0QztnQkFDQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUssRUFBRSxJQUFLLEVBQUUsSUFBSyxFQUFFLElBQUssRUFBRSxJQUFLLEVBQUUsSUFBSyxFQUFFLElBQUssQ0FBQyxDQUFDO1lBQzlELENBQUM7WUFFUSxNQUFNLENBQUMsU0FBYztnQkFDN0IsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFFUSxpQkFBaUIsQ0FBQyxNQUF1QjtnQkFDakQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFFa0IsdUJBQXVCLEtBQUssT0FBTyxJQUFLLENBQUMsQ0FBQyxDQUFDO1NBQzlEO1FBRUQsSUFBSSxDQUFDLHVCQUF1QixFQUFFO1lBQzdCLE1BQU0sQ0FBQyxHQUFHLHVDQUF1QixDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDeEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9DQUFvQyxFQUFFO1lBQzFDLElBQUksQ0FBQyxHQUFHLHVDQUF1QixDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUVuQyxDQUFDLEdBQUcsdUNBQXVCLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBDQUEwQyxFQUFFO1lBQ2hELE1BQU0sQ0FBQyxJQUFBLGtCQUFVLEVBQUMsbUJBQVEsQ0FBQyxFQUFFLENBQXdCLDBCQUFVLENBQUMsUUFBUSxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLE1BQU0sQ0FBQyxJQUFBLGtCQUFVLEVBQUMsbUJBQVEsQ0FBQyxFQUFFLENBQXdCLDBCQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQzdGLE1BQU0sQ0FBQyxJQUFBLGtCQUFVLEVBQUMsbUJBQVEsQ0FBQyxFQUFFLENBQXdCLDBCQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBRTlGLE1BQU0sUUFBUSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF3QiwwQkFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLENBQUMsTUFBTSxDQUFDO1lBQ3BHLE1BQU0sQ0FBQyxHQUFHLHVDQUF1QixDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzdFLG1CQUFRLENBQUMsRUFBRSxDQUF3QiwwQkFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWpGLE1BQU0sQ0FBQyxDQUFDLEtBQUssbUJBQVEsQ0FBQyxFQUFFLENBQXdCLDBCQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUN0RyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsbUJBQVEsQ0FBQyxFQUFFLENBQXdCLDBCQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0SCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9