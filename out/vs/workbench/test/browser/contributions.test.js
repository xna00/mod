/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/common/contributions", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, async_1, lifecycle_1, platform_1, uri_1, utils_1, descriptors_1, serviceCollection_1, contributions_1, editorService_1, editorGroupsService_1, editorService_2, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Contributions', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let aCreated;
        let aCreatedPromise;
        let bCreated;
        let bCreatedPromise;
        const TEST_EDITOR_ID = 'MyTestEditorForContributions';
        const TEST_EDITOR_INPUT_ID = 'testEditorInputForContributions';
        async function createEditorService(instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables)) {
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = disposables.add(instantiationService.createInstance(editorService_1.EditorService, undefined));
            instantiationService.stub(editorService_2.IEditorService, editorService);
            return [part, editorService];
        }
        setup(() => {
            aCreated = false;
            aCreatedPromise = new async_1.DeferredPromise();
            bCreated = false;
            bCreatedPromise = new async_1.DeferredPromise();
            disposables.add((0, workbenchTestServices_1.registerTestEditor)(TEST_EDITOR_ID, [new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestFileEditorInput), new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestSingletonFileEditorInput)], TEST_EDITOR_INPUT_ID));
        });
        teardown(async () => {
            disposables.clear();
        });
        class TestContributionA {
            constructor() {
                aCreated = true;
                aCreatedPromise.complete();
            }
        }
        class TestContributionB {
            constructor() {
                bCreated = true;
                bCreatedPromise.complete();
            }
        }
        class TestContributionError {
            constructor() {
                throw new Error();
            }
        }
        test('getWorkbenchContribution() - with lazy contributions', () => {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            assert.throws(() => registry.getWorkbenchContribution('a'));
            registry.registerWorkbenchContribution2('a', TestContributionA, { lazy: true });
            assert.throws(() => registry.getWorkbenchContribution('a'));
            registry.registerWorkbenchContribution2('b', TestContributionB, { lazy: true });
            registry.registerWorkbenchContribution2('c', TestContributionError, { lazy: true });
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            registry.start(instantiationService);
            const instanceA = registry.getWorkbenchContribution('a');
            assert.ok(instanceA instanceof TestContributionA);
            assert.ok(aCreated);
            assert.strictEqual(instanceA, registry.getWorkbenchContribution('a'));
            const instanceB = registry.getWorkbenchContribution('b');
            assert.ok(instanceB instanceof TestContributionB);
            assert.throws(() => registry.getWorkbenchContribution('c'));
        });
        test('getWorkbenchContribution() - with non-lazy contributions', async () => {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.lifecycleService.usePhases = true;
            registry.start(instantiationService);
            assert.throws(() => registry.getWorkbenchContribution('a'));
            registry.registerWorkbenchContribution2('a', TestContributionA, 2 /* WorkbenchPhase.BlockRestore */);
            const instanceA = registry.getWorkbenchContribution('a');
            assert.ok(instanceA instanceof TestContributionA);
            assert.ok(aCreated);
            accessor.lifecycleService.phase = 2 /* LifecyclePhase.Ready */;
            await aCreatedPromise.p;
            assert.strictEqual(instanceA, registry.getWorkbenchContribution('a'));
        });
        test('lifecycle phase instantiation works when phase changes', async () => {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            registry.start(instantiationService);
            registry.registerWorkbenchContribution2('a', TestContributionA, 2 /* WorkbenchPhase.BlockRestore */);
            assert.ok(!aCreated);
            accessor.lifecycleService.phase = 2 /* LifecyclePhase.Ready */;
            await aCreatedPromise.p;
            assert.ok(aCreated);
        });
        test('lifecycle phase instantiation works when phase was already met', async () => {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.lifecycleService.usePhases = true;
            accessor.lifecycleService.phase = 3 /* LifecyclePhase.Restored */;
            registry.registerWorkbenchContribution2('a', TestContributionA, 2 /* WorkbenchPhase.BlockRestore */);
            registry.start(instantiationService);
            await aCreatedPromise.p;
            assert.ok(aCreated);
        });
        (platform_1.isCI ? test.skip /* runWhenIdle seems flaky in CI on Windows */ : test)('lifecycle phase instantiation works for late phases', async () => {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.lifecycleService.usePhases = true;
            registry.start(instantiationService);
            registry.registerWorkbenchContribution2('a', TestContributionA, 3 /* WorkbenchPhase.AfterRestored */);
            registry.registerWorkbenchContribution2('b', TestContributionB, 4 /* WorkbenchPhase.Eventually */);
            assert.ok(!aCreated);
            assert.ok(!bCreated);
            accessor.lifecycleService.phase = 1 /* LifecyclePhase.Starting */;
            accessor.lifecycleService.phase = 2 /* LifecyclePhase.Ready */;
            accessor.lifecycleService.phase = 3 /* LifecyclePhase.Restored */;
            await aCreatedPromise.p;
            assert.ok(aCreated);
            accessor.lifecycleService.phase = 4 /* LifecyclePhase.Eventually */;
            await bCreatedPromise.p;
            assert.ok(bCreated);
        });
        test('contribution on editor - editor exists before start', async function () {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const [, editorService] = await createEditorService(instantiationService);
            const input = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID));
            await editorService.openEditor(input, { pinned: true });
            registry.registerWorkbenchContribution2('a', TestContributionA, { editorTypeId: TEST_EDITOR_ID });
            registry.start(instantiationService.createChild(new serviceCollection_1.ServiceCollection([editorService_2.IEditorService, editorService])));
            await aCreatedPromise.p;
            assert.ok(aCreated);
            registry.registerWorkbenchContribution2('b', TestContributionB, { editorTypeId: TEST_EDITOR_ID });
            const input2 = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-basics2'), TEST_EDITOR_INPUT_ID));
            await editorService.openEditor(input2, { pinned: true }, editorService_2.SIDE_GROUP);
            await bCreatedPromise.p;
            assert.ok(bCreated);
        });
        test('contribution on editor - editor does not exist before start', async function () {
            const registry = disposables.add(new contributions_1.WorkbenchContributionsRegistry());
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const [, editorService] = await createEditorService(instantiationService);
            const input = disposables.add(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID));
            registry.registerWorkbenchContribution2('a', TestContributionA, { editorTypeId: TEST_EDITOR_ID });
            registry.start(instantiationService.createChild(new serviceCollection_1.ServiceCollection([editorService_2.IEditorService, editorService])));
            await editorService.openEditor(input, { pinned: true });
            await aCreatedPromise.p;
            assert.ok(aCreated);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0aW9ucy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9icm93c2VyL2NvbnRyaWJ1dGlvbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtCaEcsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDM0IsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsSUFBSSxRQUFpQixDQUFDO1FBQ3RCLElBQUksZUFBc0MsQ0FBQztRQUUzQyxJQUFJLFFBQWlCLENBQUM7UUFDdEIsSUFBSSxlQUFzQyxDQUFDO1FBRTNDLE1BQU0sY0FBYyxHQUFHLDhCQUE4QixDQUFDO1FBQ3RELE1BQU0sb0JBQW9CLEdBQUcsaUNBQWlDLENBQUM7UUFFL0QsS0FBSyxVQUFVLG1CQUFtQixDQUFDLHVCQUFrRCxJQUFBLHFEQUE2QixFQUFDLFNBQVMsRUFBRSxXQUFXLENBQUM7WUFDekksTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFBLHdDQUFnQixFQUFDLG9CQUFvQixFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3ZFLG9CQUFvQixDQUFDLElBQUksQ0FBQywwQ0FBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUV0RCxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw2QkFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDckcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDhCQUFjLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFekQsT0FBTyxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLFFBQVEsR0FBRyxLQUFLLENBQUM7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