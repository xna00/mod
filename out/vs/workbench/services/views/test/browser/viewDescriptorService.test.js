/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "assert", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/views/browser/viewDescriptorService", "vs/base/common/types", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/base/common/uuid", "vs/base/common/strings", "vs/base/test/common/utils"], function (require, exports, nls, assert, views_1, platform_1, workbenchTestServices_1, descriptors_1, viewDescriptorService_1, types_1, contextKeyService_1, contextkey_1, storage_1, uuid_1, strings_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ViewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    const ViewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
    const viewContainerIdPrefix = 'testViewContainer';
    const sidebarContainer = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
    const panelContainer = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 1 /* ViewContainerLocation.Panel */);
    suite('ViewDescriptorService', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        setup(() => {
            disposables.add(instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables));
            instantiationService.stub(contextkey_1.IContextKeyService, disposables.add(instantiationService.createInstance(contextKeyService_1.ContextKeyService)));
        });
        teardown(() => {
            for (const viewContainer of ViewContainersRegistry.all) {
                if (viewContainer.id.startsWith(viewContainerIdPrefix)) {
                    ViewsRegistry.deregisterViews(ViewsRegistry.getViews(viewContainer), viewContainer);
                }
            }
        });
        function aViewDescriptorService() {
            return disposables.add(instantiationService.createInstance(viewDescriptorService_1.ViewDescriptorService));
        }
        test('Empty Containers', function () {
            const testObject = aViewDescriptorService();
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            const panelViews = testObject.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.allViewDescriptors.length, 0, 'The sidebar container should have no views yet.');
            assert.strictEqual(panelViews.allViewDescriptors.length, 0, 'The panel container should have no views yet.');
        });
        test('Register/Deregister', () => {
            const testObject = aViewDescriptorService();
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            let sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            let panelViews = testObject.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 2, 'Sidebar should have 2 views');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 1, 'Panel should have 1 view');
            ViewsRegistry.deregisterViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.deregisterViews(viewDescriptors.slice(2), panelContainer);
            sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            panelViews = testObject.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 0, 'Sidebar should have no views');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 0, 'Panel should have no views');
        });
        test('move views to existing containers', async function () {
            const testObject = aViewDescriptorService();
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            testObject.moveViewsToContainer(viewDescriptors.slice(2), sidebarContainer);
            testObject.moveViewsToContainer(viewDescriptors.slice(0, 2), panelContainer);
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            const panelViews = testObject.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 1, 'Sidebar should have 2 views');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 2, 'Panel should have 1 view');
            assert.notStrictEqual(sidebarViews.activeViewDescriptors.indexOf(viewDescriptors[2]), -1, `Sidebar should have ${viewDescriptors[2].name.value}`);
            assert.notStrictEqual(panelViews.activeViewDescriptors.indexOf(viewDescriptors[0]), -1, `Panel should have ${viewDescriptors[0].name.value}`);
            assert.notStrictEqual(panelViews.activeViewDescriptors.indexOf(viewDescriptors[1]), -1, `Panel should have ${viewDescriptors[1].name.value}`);
        });
        test('move views to generated containers', async function () {
            const testObject = aViewDescriptorService();
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            testObject.moveViewToLocation(viewDescriptors[0], 1 /* ViewContainerLocation.Panel */);
            testObject.moveViewToLocation(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */);
            let sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            let panelViews = testObject.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 1, 'Sidebar container should have 1 view');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 0, 'Panel container should have no views');
            const generatedPanel = (0, types_1.assertIsDefined)(testObject.getViewContainerByViewId(viewDescriptors[0].id));
            const generatedSidebar = (0, types_1.assertIsDefined)(testObject.getViewContainerByViewId(viewDescriptors[2].id));
            assert.strictEqual(testObject.getViewContainerLocation(generatedPanel), 1 /* ViewContainerLocation.Panel */, 'Generated Panel should be in located in the panel');
            assert.strictEqual(testObject.getViewContainerLocation(generatedSidebar), 0 /* ViewContainerLocation.Sidebar */, 'Generated Sidebar should be in located in the sidebar');
            assert.strictEqual(testObject.getViewContainerLocation(generatedPanel), testObject.getViewLocationById(viewDescriptors[0].id), 'Panel view location and container location should match');
            assert.strictEqual(testObject.getViewContainerLocation(generatedSidebar), testObject.getViewLocationById(viewDescriptors[2].id), 'Sidebar view location and container location should match');
            assert.strictEqual(testObject.getDefaultContainerById(viewDescriptors[2].id), panelContainer, `${viewDescriptors[2].name.value} has wrong default container`);
            assert.strictEqual(testObject.getDefaultContainerById(viewDescriptors[0].id), sidebarContainer, `${viewDescriptors[0].name.value} has wrong default container`);
            testObject.moveViewToLocation(viewDescriptors[0], 0 /* ViewContainerLocation.Sidebar */);
            testObject.moveViewToLocation(viewDescriptors[2], 1 /* ViewContainerLocation.Panel */);
            sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            panelViews = testObject.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 1, 'Sidebar should have 2 views');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 0, 'Panel should have 1 view');
            assert.strictEqual(testObject.getViewLocationById(viewDescriptors[0].id), 0 /* ViewContainerLocation.Sidebar */, 'View should be located in the sidebar');
            assert.strictEqual(testObject.getViewLocationById(viewDescriptors[2].id), 1 /* ViewContainerLocation.Panel */, 'View should be located in the panel');
        });
        test('move view events', async function () {
            const testObject = aViewDescriptorService();
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                }
            ];
            let expectedSequence = '';
            let actualSequence = '';
            const containerMoveString = (view, from, to) => {
                return `Moved ${view.id} from ${from.id} to ${to.id}\n`;
            };
            const locationMoveString = (view, from, to) => {
                return `Moved ${view.id} from ${from === 0 /* ViewContainerLocation.Sidebar */ ? 'Sidebar' : 'Panel'} to ${to === 0 /* ViewContainerLocation.Sidebar */ ? 'Sidebar' : 'Panel'}\n`;
            };
            disposables.add(testObject.onDidChangeContainer(({ views, from, to }) => {
                views.forEach(view => {
                    actualSequence += containerMoveString(view, from, to);
                });
            }));
            disposables.add(testObject.onDidChangeLocation(({ views, from, to }) => {
                views.forEach(view => {
                    actualSequence += locationMoveString(view, from, to);
                });
            }));
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            expectedSequence += locationMoveString(viewDescriptors[0], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            testObject.moveViewToLocation(viewDescriptors[0], 1 /* ViewContainerLocation.Panel */);
            expectedSequence += containerMoveString(viewDescriptors[0], sidebarContainer, testObject.getViewContainerByViewId(viewDescriptors[0].id));
            expectedSequence += locationMoveString(viewDescriptors[2], 1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */);
            testObject.moveViewToLocation(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */);
            expectedSequence += containerMoveString(viewDescriptors[2], panelContainer, testObject.getViewContainerByViewId(viewDescriptors[2].id));
            expectedSequence += locationMoveString(viewDescriptors[0], 1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */);
            expectedSequence += containerMoveString(viewDescriptors[0], testObject.getViewContainerByViewId(viewDescriptors[0].id), sidebarContainer);
            testObject.moveViewsToContainer([viewDescriptors[0]], sidebarContainer);
            expectedSequence += locationMoveString(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            expectedSequence += containerMoveString(viewDescriptors[2], testObject.getViewContainerByViewId(viewDescriptors[2].id), panelContainer);
            testObject.moveViewsToContainer([viewDescriptors[2]], panelContainer);
            expectedSequence += locationMoveString(viewDescriptors[0], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            expectedSequence += containerMoveString(viewDescriptors[0], sidebarContainer, panelContainer);
            testObject.moveViewsToContainer([viewDescriptors[0]], panelContainer);
            expectedSequence += locationMoveString(viewDescriptors[2], 1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */);
            expectedSequence += containerMoveString(viewDescriptors[2], panelContainer, sidebarContainer);
            testObject.moveViewsToContainer([viewDescriptors[2]], sidebarContainer);
            expectedSequence += locationMoveString(viewDescriptors[1], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            expectedSequence += locationMoveString(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            expectedSequence += containerMoveString(viewDescriptors[1], sidebarContainer, panelContainer);
            expectedSequence += containerMoveString(viewDescriptors[2], sidebarContainer, panelContainer);
            testObject.moveViewsToContainer([viewDescriptors[1], viewDescriptors[2]], panelContainer);
            assert.strictEqual(actualSequence, expectedSequence, 'Event sequence not matching expected sequence');
        });
        test('reset', async function () {
            const testObject = aViewDescriptorService();
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true,
                    order: 1
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true,
                    order: 2
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true,
                    order: 3
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            testObject.moveViewToLocation(viewDescriptors[0], 1 /* ViewContainerLocation.Panel */);
            testObject.moveViewsToContainer([viewDescriptors[1]], panelContainer);
            testObject.moveViewToLocation(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */);
            const generatedPanel = (0, types_1.assertIsDefined)(testObject.getViewContainerByViewId(viewDescriptors[0].id));
            const generatedSidebar = (0, types_1.assertIsDefined)(testObject.getViewContainerByViewId(viewDescriptors[2].id));
            testObject.reset();
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            assert.deepStrictEqual(sidebarViews.allViewDescriptors.map(v => v.id), ['view1', 'view2']);
            const panelViews = testObject.getViewContainerModel(panelContainer);
            assert.deepStrictEqual(panelViews.allViewDescriptors.map(v => v.id), ['view3']);
            const actual = JSON.parse(instantiationService.get(storage_1.IStorageService).get('views.customizations', 0 /* StorageScope.PROFILE */));
            assert.deepStrictEqual(actual, { viewContainerLocations: {}, viewLocations: {}, viewContainerBadgeEnablementStates: {} });
            assert.deepStrictEqual(testObject.getViewContainerById(generatedPanel.id), null);
            assert.deepStrictEqual(testObject.getViewContainerById(generatedSidebar.id), null);
        });
        test('initialize with custom locations', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const viewContainer1 = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const generateViewContainer1 = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generateViewContainer1]: 0 /* ViewContainerLocation.Sidebar */,
                    [viewContainer1.id]: 2 /* ViewContainerLocation.AuxiliaryBar */
                },
                viewLocations: {
                    'view1': generateViewContainer1
                }
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                },
                {
                    id: 'view4',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 4', 'Test View 4'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 3), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(3), viewContainer1);
            const testObject = aViewDescriptorService();
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            assert.deepStrictEqual(sidebarViews.allViewDescriptors.map(v => v.id), ['view2', 'view3']);
            const generatedViewContainerViews = testObject.getViewContainerModel(testObject.getViewContainerById(generateViewContainer1));
            assert.deepStrictEqual(generatedViewContainerViews.allViewDescriptors.map(v => v.id), ['view1']);
            const viewContainer1Views = testObject.getViewContainerModel(viewContainer1);
            assert.deepStrictEqual(testObject.getViewContainerLocation(viewContainer1), 2 /* ViewContainerLocation.AuxiliaryBar */);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id), ['view4']);
        });
        test('storage change', async function () {
            const testObject = aViewDescriptorService();
            const viewContainer1 = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const generateViewContainer1 = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                },
                {
                    id: 'view4',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 4', 'Test View 4'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 3), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(3), viewContainer1);
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generateViewContainer1]: 0 /* ViewContainerLocation.Sidebar */,
                    [viewContainer1.id]: 2 /* ViewContainerLocation.AuxiliaryBar */
                },
                viewLocations: {
                    'view1': generateViewContainer1
                }
            };
            instantiationService.get(storage_1.IStorageService).store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            assert.deepStrictEqual(sidebarViews.allViewDescriptors.map(v => v.id), ['view2', 'view3']);
            const generatedViewContainerViews = testObject.getViewContainerModel(testObject.getViewContainerById(generateViewContainer1));
            assert.deepStrictEqual(generatedViewContainerViews.allViewDescriptors.map(v => v.id), ['view1']);
            const viewContainer1Views = testObject.getViewContainerModel(viewContainer1);
            assert.deepStrictEqual(testObject.getViewContainerLocation(viewContainer1), 2 /* ViewContainerLocation.AuxiliaryBar */);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id), ['view4']);
        });
        test('orphan views', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const viewsCustomizations = {
                viewContainerLocations: {},
                viewLocations: {
                    'view1': `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`
                }
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true,
                    order: 1
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true,
                    order: 2
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true,
                    order: 3
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors, sidebarContainer);
            const testObject = aViewDescriptorService();
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            assert.deepStrictEqual(sidebarViews.allViewDescriptors.map(v => v.id), ['view2', 'view3']);
            testObject.whenExtensionsRegistered();
            assert.deepStrictEqual(sidebarViews.allViewDescriptors.map(v => v.id), ['view1', 'view2', 'view3']);
        });
        test('orphan view containers', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const generatedViewContainerId = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generatedViewContainerId]: 0 /* ViewContainerLocation.Sidebar */
                },
                viewLocations: {}
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true,
                    order: 1
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors, sidebarContainer);
            const testObject = aViewDescriptorService();
            testObject.whenExtensionsRegistered();
            assert.deepStrictEqual(testObject.getViewContainerById(generatedViewContainerId), null);
            assert.deepStrictEqual(testObject.isViewContainerRemovedPermanently(generatedViewContainerId), true);
            const actual = JSON.parse(storageService.get('views.customizations', 0 /* StorageScope.PROFILE */));
            assert.deepStrictEqual(actual, { viewContainerLocations: {}, viewLocations: {}, viewContainerBadgeEnablementStates: {} });
        });
        test('custom locations take precedence when default view container of views change', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const viewContainer1 = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const generateViewContainer1 = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generateViewContainer1]: 0 /* ViewContainerLocation.Sidebar */,
                    [viewContainer1.id]: 2 /* ViewContainerLocation.AuxiliaryBar */
                },
                viewLocations: {
                    'view1': generateViewContainer1
                }
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 3', 'Test View 3'),
                    canMoveView: true
                },
                {
                    id: 'view4',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 4', 'Test View 4'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 3), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(3), viewContainer1);
            const testObject = aViewDescriptorService();
            ViewsRegistry.moveViews([viewDescriptors[0], viewDescriptors[1]], panelContainer);
            const sidebarViews = testObject.getViewContainerModel(sidebarContainer);
            assert.deepStrictEqual(sidebarViews.allViewDescriptors.map(v => v.id), ['view3']);
            const panelViews = testObject.getViewContainerModel(panelContainer);
            assert.deepStrictEqual(panelViews.allViewDescriptors.map(v => v.id), ['view2']);
            const generatedViewContainerViews = testObject.getViewContainerModel(testObject.getViewContainerById(generateViewContainer1));
            assert.deepStrictEqual(generatedViewContainerViews.allViewDescriptors.map(v => v.id), ['view1']);
            const viewContainer1Views = testObject.getViewContainerModel(viewContainer1);
            assert.deepStrictEqual(testObject.getViewContainerLocation(viewContainer1), 2 /* ViewContainerLocation.AuxiliaryBar */);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id), ['view4']);
        });
        test('view containers with not existing views are not removed from customizations', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const viewContainer1 = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const generateViewContainer1 = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generateViewContainer1]: 0 /* ViewContainerLocation.Sidebar */,
                    [viewContainer1.id]: 2 /* ViewContainerLocation.AuxiliaryBar */
                },
                viewLocations: {
                    'view5': generateViewContainer1
                }
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors, viewContainer1);
            const testObject = aViewDescriptorService();
            testObject.whenExtensionsRegistered();
            const viewContainer1Views = testObject.getViewContainerModel(viewContainer1);
            assert.deepStrictEqual(testObject.getViewContainerLocation(viewContainer1), 2 /* ViewContainerLocation.AuxiliaryBar */);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id), ['view1']);
            const actual = JSON.parse(storageService.get('views.customizations', 0 /* StorageScope.PROFILE */));
            assert.deepStrictEqual(actual, viewsCustomizations);
        });
        test('storage change also updates locations even if views do not exists and views are registered later', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const testObject = aViewDescriptorService();
            const generateViewContainerId = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(2 /* ViewContainerLocation.AuxiliaryBar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generateViewContainerId]: 2 /* ViewContainerLocation.AuxiliaryBar */,
                },
                viewLocations: {
                    'view1': generateViewContainerId
                }
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const viewContainer = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors, viewContainer);
            testObject.whenExtensionsRegistered();
            const viewContainer1Views = testObject.getViewContainerModel(viewContainer);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id), ['view2']);
            const generateViewContainer = testObject.getViewContainerById(generateViewContainerId);
            assert.deepStrictEqual(testObject.getViewContainerLocation(generateViewContainer), 2 /* ViewContainerLocation.AuxiliaryBar */);
            const generatedViewContainerModel = testObject.getViewContainerModel(generateViewContainer);
            assert.deepStrictEqual(generatedViewContainerModel.allViewDescriptors.map(v => v.id), ['view1']);
        });
        test('storage change move views and retain visibility state', async function () {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const testObject = aViewDescriptorService();
            const viewContainer = ViewContainersRegistry.registerViewContainer({ id: `${viewContainerIdPrefix}-${(0, uuid_1.generateUuid)()}`, title: nls.localize2('test', 'test'), ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 1', 'Test View 1'),
                    canMoveView: true,
                    canToggleVisibility: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: nls.localize2('Test View 2', 'Test View 2'),
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors, viewContainer);
            testObject.whenExtensionsRegistered();
            const viewContainer1Views = testObject.getViewContainerModel(viewContainer);
            viewContainer1Views.setVisible('view1', false);
            const generateViewContainerId = `workbench.views.service.${(0, views_1.ViewContainerLocationToString)(2 /* ViewContainerLocation.AuxiliaryBar */)}.${(0, uuid_1.generateUuid)()}`;
            const viewsCustomizations = {
                viewContainerLocations: {
                    [generateViewContainerId]: 2 /* ViewContainerLocation.AuxiliaryBar */,
                },
                viewLocations: {
                    'view1': generateViewContainerId
                }
            };
            storageService.store('views.customizations', JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const generateViewContainer = testObject.getViewContainerById(generateViewContainerId);
            const generatedViewContainerModel = testObject.getViewContainerModel(generateViewContainer);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id), ['view2']);
            assert.deepStrictEqual(testObject.getViewContainerLocation(generateViewContainer), 2 /* ViewContainerLocation.AuxiliaryBar */);
            assert.deepStrictEqual(generatedViewContainerModel.allViewDescriptors.map(v => v.id), ['view1']);
            storageService.store('views.customizations', JSON.stringify({}), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            assert.deepStrictEqual(viewContainer1Views.allViewDescriptors.map(v => v.id).sort((a, b) => (0, strings_1.compare)(a, b)), ['view1', 'view2']);
            assert.deepStrictEqual(viewContainer1Views.visibleViewDescriptors.map(v => v.id), ['view2']);
            assert.deepStrictEqual(generatedViewContainerModel.allViewDescriptors.map(v => v.id), []);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0Rlc2NyaXB0b3JTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy92aWV3cy90ZXN0L2Jyb3dzZXIvdmlld0Rlc2NyaXB0b3JTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLE1BQU0sYUFBYSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFpQixrQkFBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN6RixNQUFNLHNCQUFzQixHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUEwQixrQkFBdUIsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0lBQ3BILE1BQU0scUJBQXFCLEdBQUcsbUJBQW1CLENBQUM7SUFDbEQsTUFBTSxnQkFBZ0IsR0FBRyxzQkFBc0IsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLHFCQUFxQixJQUFJLElBQUEsbUJBQVksR0FBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLGNBQWMsRUFBRSxJQUFJLDRCQUFjLENBQU0sRUFBRSxDQUFDLEVBQUUsd0NBQWdDLENBQUM7SUFDOU8sTUFBTSxjQUFjLEdBQUcsc0JBQXNCLENBQUMscUJBQXFCLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxxQkFBcUIsSUFBSSxJQUFBLG1CQUFZLEdBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSxjQUFjLEVBQUUsSUFBSSw0QkFBYyxDQUFNLEVBQUUsQ0FBQyxFQUFFLHNDQUE4QixDQUFDO0lBRTFPLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFFbkMsTUFBTSxXQUFXLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzlELElBQUksb0JBQThDLENBQUM7UUFFbkQsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEdBQTZCLElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDeEgsb0JBQW9CLENBQUMsSUFBSSxDQUFDLCtCQUFrQixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHFDQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hILENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLEtBQUssTUFBTSxhQUFhLElBQUksc0JBQXNCLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3hELElBQUksYUFBYSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMscUJBQXFCLENBQUMsRUFBRSxDQUFDO29CQUN4RCxhQUFhLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3JGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxTQUFTLHNCQUFzQjtZQUM5QixPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDZDQUFxQixDQUFDLENBQUMsQ0FBQztRQUNwRixDQUFDO1FBRUQsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQ3hCLE1BQU0sVUFBVSxHQUFHLHNCQUFzQixFQUFFLENBQUM7WUFDNUMsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDeEUsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsaURBQWlELENBQUMsQ0FBQztZQUNqSCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLCtDQUErQyxDQUFDLENBQUM7UUFDOUcsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1lBQ2hDLE1BQU0sVUFBVSxHQUFHLHNCQUFzQixFQUFFLENBQUM7WUFDNUMsTUFBTSxlQUFlLEdBQXNCO2dCQUMxQztvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjthQUNELENBQUM7WUFFRixhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDM0UsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXRFLElBQUksWUFBWSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3RFLElBQUksVUFBVSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUVsRSxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLDZCQUE2QixDQUFDLENBQUM7WUFDaEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO1lBRTNGLGFBQWEsQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM3RSxhQUFhLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFeEUsWUFBWSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2xFLFVBQVUsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO1lBQ2pHLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztRQUM5RixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtQ0FBbUMsRUFBRSxLQUFLO1lBQzlDLE1BQU0sVUFBVSxHQUFHLHNCQUFzQixFQUFFLENBQUM7WUFDNUMsTUFBTSxlQUFlLEdBQXNCO2dCQUMxQztvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjthQUNELENBQUM7WUFFRixhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDM0UsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXRFLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDNUUsVUFBVSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRTdFLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUVwRSxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLDZCQUE2QixDQUFDLENBQUM7WUFDaEcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO1lBRTNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSx1QkFBdUIsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ2xKLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxxQkFBcUIsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQzlJLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxxQkFBcUIsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQy9JLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEtBQUs7WUFDL0MsTUFBTSxVQUFVLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUM1QyxNQUFNLGVBQWUsR0FBc0I7Z0JBQzFDO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2FBQ0QsQ0FBQztZQUVGLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUMzRSxhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFdEUsVUFBVSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsc0NBQThCLENBQUM7WUFDL0UsVUFBVSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsd0NBQWdDLENBQUM7WUFFakYsSUFBSSxZQUFZLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDdEUsSUFBSSxVQUFVLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRWxFLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsc0NBQXNDLENBQUMsQ0FBQztZQUN6RyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLHNDQUFzQyxDQUFDLENBQUM7WUFFdkcsTUFBTSxjQUFjLEdBQUcsSUFBQSx1QkFBZSxFQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRyxNQUFNLGdCQUFnQixHQUFHLElBQUEsdUJBQWUsRUFBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFckcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsY0FBYyxDQUFDLHVDQUErQixtREFBbUQsQ0FBQyxDQUFDO1lBQzFKLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGdCQUFnQixDQUFDLHlDQUFpQyx1REFBdUQsQ0FBQyxDQUFDO1lBRWxLLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUseURBQXlELENBQUMsQ0FBQztZQUMxTCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsMkRBQTJELENBQUMsQ0FBQztZQUU5TCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyx1QkFBdUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsY0FBYyxFQUFFLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLDhCQUE4QixDQUFDLENBQUM7WUFDOUosTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLDhCQUE4QixDQUFDLENBQUM7WUFFaEssVUFBVSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsd0NBQWdDLENBQUM7WUFDakYsVUFBVSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsc0NBQThCLENBQUM7WUFFL0UsWUFBWSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2xFLFVBQVUsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO1lBQ2hHLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztZQUUzRixNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLHlDQUFpQyx1Q0FBdUMsQ0FBQyxDQUFDO1lBQ2xKLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsdUNBQStCLHFDQUFxQyxDQUFDLENBQUM7UUFDL0ksQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsS0FBSztZQUM3QixNQUFNLFVBQVUsR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBQzVDLE1BQU0sZUFBZSxHQUFzQjtnQkFDMUM7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7YUFDRCxDQUFDO1lBRUYsSUFBSSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7WUFDMUIsSUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDO1lBRXhCLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxJQUFxQixFQUFFLElBQW1CLEVBQUUsRUFBaUIsRUFBRSxFQUFFO2dCQUM3RixPQUFPLFNBQVMsSUFBSSxDQUFDLEVBQUUsU0FBUyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztZQUN6RCxDQUFDLENBQUM7WUFFRixNQUFNLGtCQUFrQixHQUFHLENBQUMsSUFBcUIsRUFBRSxJQUEyQixFQUFFLEVBQXlCLEVBQUUsRUFBRTtnQkFDNUcsT0FBTyxTQUFTLElBQUksQ0FBQyxFQUFFLFNBQVMsSUFBSSwwQ0FBa0MsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLE9BQU8sRUFBRSwwQ0FBa0MsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQztZQUNuSyxDQUFDLENBQUM7WUFDRixXQUFXLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUN2RSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNwQixjQUFjLElBQUksbUJBQW1CLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDdkQsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDdEUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDcEIsY0FBYyxJQUFJLGtCQUFrQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3RELENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUMzRSxhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFdEUsZ0JBQWdCLElBQUksa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyw2RUFBNkQsQ0FBQztZQUN2SCxVQUFVLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxzQ0FBOEIsQ0FBQztZQUMvRSxnQkFBZ0IsSUFBSSxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUUsQ0FBQyxDQUFDO1lBRTNJLGdCQUFnQixJQUFJLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsNkVBQTZELENBQUM7WUFDdkgsVUFBVSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsd0NBQWdDLENBQUM7WUFDakYsZ0JBQWdCLElBQUksbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsRUFBRSxVQUFVLENBQUMsd0JBQXdCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBRSxDQUFDLENBQUM7WUFFekksZ0JBQWdCLElBQUksa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyw2RUFBNkQsQ0FBQztZQUN2SCxnQkFBZ0IsSUFBSSxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNJLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFeEUsZ0JBQWdCLElBQUksa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyw2RUFBNkQsQ0FBQztZQUN2SCxnQkFBZ0IsSUFBSSxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUN6SSxVQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUV0RSxnQkFBZ0IsSUFBSSxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLDZFQUE2RCxDQUFDO1lBQ3ZILGdCQUFnQixJQUFJLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM5RixVQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUV0RSxnQkFBZ0IsSUFBSSxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLDZFQUE2RCxDQUFDO1lBQ3ZILGdCQUFnQixJQUFJLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM5RixVQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBRXhFLGdCQUFnQixJQUFJLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsNkVBQTZELENBQUM7WUFDdkgsZ0JBQWdCLElBQUksa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyw2RUFBNkQsQ0FBQztZQUN2SCxnQkFBZ0IsSUFBSSxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDOUYsZ0JBQWdCLElBQUksbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzlGLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUUxRixNQUFNLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxnQkFBZ0IsRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDO1FBQ3ZHLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLO1lBQ2xCLE1BQU0sVUFBVSxHQUFHLHNCQUFzQixFQUFFLENBQUM7WUFDNUMsTUFBTSxlQUFlLEdBQXNCO2dCQUMxQztvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7b0JBQ2pCLEtBQUssRUFBRSxDQUFDO2lCQUNSO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtvQkFDakIsS0FBSyxFQUFFLENBQUM7aUJBQ1I7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO29CQUNqQixLQUFLLEVBQUUsQ0FBQztpQkFDUjthQUNELENBQUM7WUFFRixhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDM0UsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXRFLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLHNDQUE4QixDQUFDO1lBQy9FLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3RFLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLHdDQUFnQyxDQUFDO1lBRWpGLE1BQU0sY0FBYyxHQUFHLElBQUEsdUJBQWUsRUFBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkcsTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLHVCQUFlLEVBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXJHLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVuQixNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUN4RSxNQUFNLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUMzRixNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUVoRixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUMsR0FBRyxDQUFDLHNCQUFzQiwrQkFBd0IsQ0FBQyxDQUFDO1lBQ3hILE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUUsc0JBQXNCLEVBQUUsRUFBRSxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsa0NBQWtDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUUxSCxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0NBQWtDLEVBQUUsS0FBSztZQUM3QyxNQUFNLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFDLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcscUJBQXFCLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUksNEJBQWMsQ0FBTSxFQUFFLENBQUMsRUFBRSx3Q0FBZ0MsQ0FBQztZQUM1TyxNQUFNLHNCQUFzQixHQUFHLDJCQUEyQixJQUFBLHFDQUE2Qix3Q0FBK0IsSUFBSSxJQUFBLG1CQUFZLEdBQUUsRUFBRSxDQUFDO1lBQzNJLE1BQU0sbUJBQW1CLEdBQUc7Z0JBQzNCLHNCQUFzQixFQUFFO29CQUN2QixDQUFDLHNCQUFzQixDQUFDLHVDQUErQjtvQkFDdkQsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLDRDQUFvQztpQkFDdkQ7Z0JBQ0QsYUFBYSxFQUFFO29CQUNkLE9BQU8sRUFBRSxzQkFBc0I7aUJBQy9CO2FBQ0QsQ0FBQztZQUNGLGNBQWMsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQywyREFBMkMsQ0FBQztZQUU1SCxNQUFNLGVBQWUsR0FBc0I7Z0JBQzFDO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7YUFDRCxDQUFDO1lBRUYsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNFLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUV0RSxNQUFNLFVBQVUsR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBRTVDLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRTNGLE1BQU0sMkJBQTJCLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBRSxDQUFDLENBQUM7WUFDL0gsTUFBTSxDQUFDLGVBQWUsQ0FBQywyQkFBMkIsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRWpHLE1BQU0sbUJBQW1CLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyw2Q0FBcUMsQ0FBQztZQUNoSCxNQUFNLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDMUYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsS0FBSztZQUMzQixNQUFNLFVBQVUsR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBRTVDLE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFDLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcscUJBQXFCLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUksNEJBQWMsQ0FBTSxFQUFFLENBQUMsRUFBRSx3Q0FBZ0MsQ0FBQztZQUM1TyxNQUFNLHNCQUFzQixHQUFHLDJCQUEyQixJQUFBLHFDQUE2Qix3Q0FBK0IsSUFBSSxJQUFBLG1CQUFZLEdBQUUsRUFBRSxDQUFDO1lBRTNJLE1BQU0sZUFBZSxHQUFzQjtnQkFDMUM7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjthQUNELENBQUM7WUFFRixhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDM0UsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXRFLE1BQU0sbUJBQW1CLEdBQUc7Z0JBQzNCLHNCQUFzQixFQUFFO29CQUN2QixDQUFDLHNCQUFzQixDQUFDLHVDQUErQjtvQkFDdkQsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLDRDQUFvQztpQkFDdkQ7Z0JBQ0QsYUFBYSxFQUFFO29CQUNkLE9BQU8sRUFBRSxzQkFBc0I7aUJBQy9CO2FBQ0QsQ0FBQztZQUNGLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsMkRBQTJDLENBQUM7WUFFdkosTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDeEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFFM0YsTUFBTSwyQkFBMkIsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLHNCQUFzQixDQUFFLENBQUMsQ0FBQztZQUMvSCxNQUFNLENBQUMsZUFBZSxDQUFDLDJCQUEyQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFFakcsTUFBTSxtQkFBbUIsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsY0FBYyxDQUFDLDZDQUFxQyxDQUFDO1lBQ2hILE1BQU0sQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUMxRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSztZQUN6QixNQUFNLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sbUJBQW1CLEdBQUc7Z0JBQzNCLHNCQUFzQixFQUFFLEVBQUU7Z0JBQzFCLGFBQWEsRUFBRTtvQkFDZCxPQUFPLEVBQUUsR0FBRyxxQkFBcUIsSUFBSSxJQUFBLG1CQUFZLEdBQUUsRUFBRTtpQkFDckQ7YUFDRCxDQUFDO1lBQ0YsY0FBYyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLDJEQUEyQyxDQUFDO1lBRTVILE1BQU0sZUFBZSxHQUFzQjtnQkFDMUM7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO29CQUNqQixLQUFLLEVBQUUsQ0FBQztpQkFDUjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7b0JBQ2pCLEtBQUssRUFBRSxDQUFDO2lCQUNSO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtvQkFDakIsS0FBSyxFQUFFLENBQUM7aUJBQ1I7YUFDRCxDQUFDO1lBRUYsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUUvRCxNQUFNLFVBQVUsR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBRTVDLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRTNGLFVBQVUsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNyRyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3QkFBd0IsRUFBRSxLQUFLO1lBQ25DLE1BQU0sY0FBYyxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUM7WUFDakUsTUFBTSx3QkFBd0IsR0FBRywyQkFBMkIsSUFBQSxxQ0FBNkIsd0NBQStCLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUUsQ0FBQztZQUM3SSxNQUFNLG1CQUFtQixHQUFHO2dCQUMzQixzQkFBc0IsRUFBRTtvQkFDdkIsQ0FBQyx3QkFBd0IsQ0FBQyx1Q0FBK0I7aUJBQ3pEO2dCQUNELGFBQWEsRUFBRSxFQUFFO2FBQ2pCLENBQUM7WUFDRixjQUFjLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsMkRBQTJDLENBQUM7WUFFNUgsTUFBTSxlQUFlLEdBQXNCO2dCQUMxQztvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7b0JBQ2pCLEtBQUssRUFBRSxDQUFDO2lCQUNSO2FBQ0QsQ0FBQztZQUVGLGFBQWEsQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFL0QsTUFBTSxVQUFVLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUM1QyxVQUFVLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUV0QyxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hGLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLGlDQUFpQyxDQUFDLHdCQUF3QixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFckcsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLHNCQUFzQiwrQkFBd0IsQ0FBQyxDQUFDO1lBQzdGLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUUsc0JBQXNCLEVBQUUsRUFBRSxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsa0NBQWtDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMzSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4RUFBOEUsRUFBRSxLQUFLO1lBQ3pGLE1BQU0sY0FBYyxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUM7WUFDakUsTUFBTSxjQUFjLEdBQUcsc0JBQXNCLENBQUMscUJBQXFCLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxxQkFBcUIsSUFBSSxJQUFBLG1CQUFZLEdBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSxjQUFjLEVBQUUsSUFBSSw0QkFBYyxDQUFNLEVBQUUsQ0FBQyxFQUFFLHdDQUFnQyxDQUFDO1lBQzVPLE1BQU0sc0JBQXNCLEdBQUcsMkJBQTJCLElBQUEscUNBQTZCLHdDQUErQixJQUFJLElBQUEsbUJBQVksR0FBRSxFQUFFLENBQUM7WUFDM0ksTUFBTSxtQkFBbUIsR0FBRztnQkFDM0Isc0JBQXNCLEVBQUU7b0JBQ3ZCLENBQUMsc0JBQXNCLENBQUMsdUNBQStCO29CQUN2RCxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsNENBQW9DO2lCQUN2RDtnQkFDRCxhQUFhLEVBQUU7b0JBQ2QsT0FBTyxFQUFFLHNCQUFzQjtpQkFDL0I7YUFDRCxDQUFDO1lBQ0YsY0FBYyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLDJEQUEyQyxDQUFDO1lBRTVILE1BQU0sZUFBZSxHQUFzQjtnQkFDMUM7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7aUJBQ2pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjthQUNELENBQUM7WUFFRixhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDM0UsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXRFLE1BQU0sVUFBVSxHQUFHLHNCQUFzQixFQUFFLENBQUM7WUFDNUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUVsRixNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUN4RSxNQUFNLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRWxGLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRWhGLE1BQU0sMkJBQTJCLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBRSxDQUFDLENBQUM7WUFDL0gsTUFBTSxDQUFDLGVBQWUsQ0FBQywyQkFBMkIsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRWpHLE1BQU0sbUJBQW1CLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyw2Q0FBcUMsQ0FBQztZQUNoSCxNQUFNLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDMUYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkVBQTZFLEVBQUUsS0FBSztZQUN4RixNQUFNLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMseUJBQWUsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFDLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcscUJBQXFCLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUksNEJBQWMsQ0FBTSxFQUFFLENBQUMsRUFBRSx3Q0FBZ0MsQ0FBQztZQUM1TyxNQUFNLHNCQUFzQixHQUFHLDJCQUEyQixJQUFBLHFDQUE2Qix3Q0FBK0IsSUFBSSxJQUFBLG1CQUFZLEdBQUUsRUFBRSxDQUFDO1lBQzNJLE1BQU0sbUJBQW1CLEdBQUc7Z0JBQzNCLHNCQUFzQixFQUFFO29CQUN2QixDQUFDLHNCQUFzQixDQUFDLHVDQUErQjtvQkFDdkQsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLDRDQUFvQztpQkFDdkQ7Z0JBQ0QsYUFBYSxFQUFFO29CQUNkLE9BQU8sRUFBRSxzQkFBc0I7aUJBQy9CO2FBQ0QsQ0FBQztZQUNGLGNBQWMsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQywyREFBMkMsQ0FBQztZQUU1SCxNQUFNLGVBQWUsR0FBc0I7Z0JBQzFDO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7YUFDRCxDQUFDO1lBRUYsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFN0QsTUFBTSxVQUFVLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUM1QyxVQUFVLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUV0QyxNQUFNLG1CQUFtQixHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxjQUFjLENBQUMsNkNBQXFDLENBQUM7WUFDaEgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRXpGLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsK0JBQXdCLENBQUMsQ0FBQztZQUM3RixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3JELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtHQUFrRyxFQUFFLEtBQUs7WUFDN0csTUFBTSxjQUFjLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQztZQUNqRSxNQUFNLFVBQVUsR0FBRyxzQkFBc0IsRUFBRSxDQUFDO1lBRTVDLE1BQU0sdUJBQXVCLEdBQUcsMkJBQTJCLElBQUEscUNBQTZCLDZDQUFvQyxJQUFJLElBQUEsbUJBQVksR0FBRSxFQUFFLENBQUM7WUFDakosTUFBTSxtQkFBbUIsR0FBRztnQkFDM0Isc0JBQXNCLEVBQUU7b0JBQ3ZCLENBQUMsdUJBQXVCLENBQUMsNENBQW9DO2lCQUM3RDtnQkFDRCxhQUFhLEVBQUU7b0JBQ2QsT0FBTyxFQUFFLHVCQUF1QjtpQkFDaEM7YUFDRCxDQUFDO1lBQ0YsY0FBYyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLDJEQUEyQyxDQUFDO1lBRTVILE1BQU0sYUFBYSxHQUFHLHNCQUFzQixDQUFDLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcscUJBQXFCLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUksNEJBQWMsQ0FBTSxFQUFFLENBQUMsRUFBRSx3Q0FBZ0MsQ0FBQztZQUMzTyxNQUFNLGVBQWUsR0FBc0I7Z0JBQzFDO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0MsRUFBRSxFQUFFLE9BQU87b0JBQ1gsY0FBYyxFQUFFLElBQUs7b0JBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2pELFdBQVcsRUFBRSxJQUFJO2lCQUNqQjthQUNELENBQUM7WUFDRixhQUFhLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUU1RCxVQUFVLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUV0QyxNQUFNLG1CQUFtQixHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFFekYsTUFBTSxxQkFBcUIsR0FBRyxVQUFVLENBQUMsb0JBQW9CLENBQUMsdUJBQXVCLENBQUUsQ0FBQztZQUN4RixNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxxQkFBcUIsQ0FBQyw2Q0FBcUMsQ0FBQztZQUN2SCxNQUFNLDJCQUEyQixHQUFHLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQzVGLE1BQU0sQ0FBQyxlQUFlLENBQUMsMkJBQTJCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNsRyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1REFBdUQsRUFBRSxLQUFLO1lBQ2xFLE1BQU0sY0FBYyxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUM7WUFDakUsTUFBTSxVQUFVLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztZQUU1QyxNQUFNLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLHFCQUFxQixJQUFJLElBQUEsbUJBQVksR0FBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLGNBQWMsRUFBRSxJQUFJLDRCQUFjLENBQU0sRUFBRSxDQUFDLEVBQUUsd0NBQWdDLENBQUM7WUFDM08sTUFBTSxlQUFlLEdBQXNCO2dCQUMxQztvQkFDQyxFQUFFLEVBQUUsT0FBTztvQkFDWCxjQUFjLEVBQUUsSUFBSztvQkFDckIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDakQsV0FBVyxFQUFFLElBQUk7b0JBQ2pCLG1CQUFtQixFQUFFLElBQUk7aUJBQ3pCO2dCQUNEO29CQUNDLEVBQUUsRUFBRSxPQUFPO29CQUNYLGNBQWMsRUFBRSxJQUFLO29CQUNyQixJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNqRCxXQUFXLEVBQUUsSUFBSTtpQkFDakI7YUFDRCxDQUFDO1lBQ0YsYUFBYSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFNUQsVUFBVSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFFdEMsTUFBTSxtQkFBbUIsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDNUUsbUJBQW1CLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUUvQyxNQUFNLHVCQUF1QixHQUFHLDJCQUEyQixJQUFBLHFDQUE2Qiw2Q0FBb0MsSUFBSSxJQUFBLG1CQUFZLEdBQUUsRUFBRSxDQUFDO1lBQ2pKLE1BQU0sbUJBQW1CLEdBQUc7Z0JBQzNCLHNCQUFzQixFQUFFO29CQUN2QixDQUFDLHVCQUF1QixDQUFDLDRDQUFvQztpQkFDN0Q7Z0JBQ0QsYUFBYSxFQUFFO29CQUNkLE9BQU8sRUFBRSx1QkFBdUI7aUJBQ2hDO2FBQ0QsQ0FBQztZQUNGLGNBQWMsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQywyREFBMkMsQ0FBQztZQUU1SCxNQUFNLHFCQUFxQixHQUFHLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyx1QkFBdUIsQ0FBRSxDQUFDO1lBQ3hGLE1BQU0sMkJBQTJCLEdBQUcsVUFBVSxDQUFDLHFCQUFxQixDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFFNUYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLHFCQUFxQixDQUFDLDZDQUFxQyxDQUFDO1lBQ3ZILE1BQU0sQ0FBQyxlQUFlLENBQUMsMkJBQTJCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUVqRyxjQUFjLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLDJEQUEyQyxDQUFDO1lBRTNHLE1BQU0sQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUEsaUJBQU8sRUFBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2hJLE1BQU0sQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUM3RixNQUFNLENBQUMsZUFBZSxDQUFDLDJCQUEyQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMzRixDQUFDLENBQUMsQ0FBQztJQUVKLENBQUMsQ0FBQyxDQUFDIn0=