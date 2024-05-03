/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "assert", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/instantiation/common/descriptors", "vs/platform/log/common/log", "vs/platform/notification/test/common/testNotificationService", "vs/platform/registry/common/platform", "vs/workbench/api/browser/mainThreadTreeViews", "vs/workbench/browser/parts/views/treeView", "vs/workbench/common/views", "vs/workbench/services/views/browser/viewDescriptorService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, nls, assert, mock_1, utils_1, descriptors_1, log_1, testNotificationService_1, platform_1, mainThreadTreeViews_1, treeView_1, views_1, viewDescriptorService_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadHostTreeView', function () {
        const testTreeViewId = 'testTreeView';
        const customValue = 'customValue';
        const ViewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
        class MockExtHostTreeViewsShape extends (0, mock_1.mock)() {
            async $getChildren(treeViewId, treeItemHandle) {
                return [{ handle: 'testItem1', collapsibleState: views_1.TreeItemCollapsibleState.Expanded, customProp: customValue }];
            }
            async $hasResolve() {
                return false;
            }
            $setVisible() { }
        }
        let container;
        let mainThreadTreeViews;
        let extHostTreeViewsShape;
        teardown(() => {
            ViewsRegistry.deregisterViews(ViewsRegistry.getViews(container), container);
        });
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const viewDescriptorService = disposables.add(instantiationService.createInstance(viewDescriptorService_1.ViewDescriptorService));
            instantiationService.stub(views_1.IViewDescriptorService, viewDescriptorService);
            container = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({ id: 'testContainer', title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const viewDescriptor = {
                id: testTreeViewId,
                ctorDescriptor: null,
                name: nls.localize2('Test View 1', 'Test View 1'),
                treeView: disposables.add(instantiationService.createInstance(treeView_1.CustomTreeView, 'testTree', 'Test Title', 'extension.id')),
            };
            ViewsRegistry.registerViews([viewDescriptor], container);
            const testExtensionService = new workbenchTestServices_2.TestExtensionService();
            extHostTreeViewsShape = new MockExtHostTreeViewsShape();
            mainThreadTreeViews = disposables.add(new mainThreadTreeViews_1.MainThreadTreeViews(new class {
                constructor() {
                    this.remoteAuthority = '';
                    this.extensionHostKind = 1 /* ExtensionHostKind.LocalProcess */;
                }
                dispose() { }
                assertRegistered() { }
                set(v) { return null; }
                getProxy() {
                    return extHostTreeViewsShape;
                }
                drain() { return null; }
            }, new workbenchTestServices_1.TestViewsService(), new testNotificationService_1.TestNotificationService(), testExtensionService, new log_1.NullLogService()));
            mainThreadTreeViews.$registerTreeViewDataProvider(testTreeViewId, { showCollapseAll: false, canSelectMany: false, dropMimeTypes: [], dragMimeTypes: [], hasHandleDrag: false, hasHandleDrop: false, manuallyManageCheckboxes: false });
            await testExtensionService.whenInstalledExtensionsRegistered();
        });
        test('getChildren keeps custom properties', async () => {
            const treeView = ViewsRegistry.getView(testTreeViewId).treeView;
            const children = await treeView.dataProvider?.getChildren({ handle: 'root', collapsibleState: views_1.TreeItemCollapsibleState.Expanded });
            assert(children.length === 1, 'Exactly one child should be returned');
            assert(children[0].customProp === customValue, 'Tree Items should keep custom properties');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRyZWVWaWV3cy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9tYWluVGhyZWFkVHJlZVZpZXdzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFxQmhHLEtBQUssQ0FBQyx3QkFBd0IsRUFBRTtRQUMvQixNQUFNLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFDdEMsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDO1FBQ2xDLE1BQU0sYUFBYSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFpQixrQkFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBTTVFLE1BQU0seUJBQTBCLFNBQVEsSUFBQSxXQUFJLEdBQXlCO1lBQzNELEtBQUssQ0FBQyxZQUFZLENBQUMsVUFBa0IsRUFBRSxjQUF1QjtnQkFDdEUsT0FBTyxDQUFpQixFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ2hJLENBQUM7WUFFUSxLQUFLLENBQUMsV0FBVztnQkFDekIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRVEsV0FBVyxLQUFXLENBQUM7U0FDaEM7UUFFRCxJQUFJLFNBQXdCLENBQUM7UUFDN0IsSUFBSSxtQkFBd0MsQ0FBQztRQUM3QyxJQUFJLHFCQUFnRCxDQUFDO1FBRXJELFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixhQUFhLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDN0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLFdBQVcsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENB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