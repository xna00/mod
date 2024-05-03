/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/files/common/files", "vs/workbench/services/workingCopy/common/resourceWorkingCopy", "vs/base/common/lifecycle", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils"], function (require, exports, assert, event_1, uri_1, workbenchTestServices_1, files_1, resourceWorkingCopy_1, lifecycle_1, timeTravelScheduler_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ResourceWorkingCopy', function () {
        class TestResourceWorkingCopy extends resourceWorkingCopy_1.ResourceWorkingCopy {
            constructor() {
                super(...arguments);
                this.name = 'testName';
                this.typeId = 'testTypeId';
                this.capabilities = 0 /* WorkingCopyCapabilities.None */;
                this.onDidChangeDirty = event_1.Event.None;
                this.onDidChangeContent = event_1.Event.None;
                this.onDidSave = event_1.Event.None;
            }
            isDirty() { return false; }
            async backup(token) { throw new Error('Method not implemented.'); }
            async save(options) { return false; }
            async revert(options) { }
        }
        const disposables = new lifecycle_1.DisposableStore();
        const resource = uri_1.URI.file('test/resource');
        let instantiationService;
        let accessor;
        let workingCopy;
        function createWorkingCopy(uri = resource) {
            return new TestResourceWorkingCopy(uri, accessor.fileService);
        }
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            workingCopy = disposables.add(createWorkingCopy());
        });
        teardown(() => {
            disposables.clear();
        });
        test('orphaned tracking', async () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                assert.strictEqual(workingCopy.isOrphaned(), false);
                let onDidChangeOrphanedPromise = event_1.Event.toPromise(workingCopy.onDidChangeOrphaned);
                accessor.fileService.notExistsSet.set(resource, true);
                accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource, type: 2 /* FileChangeType.DELETED */ }], false));
                await onDidChangeOrphanedPromise;
                assert.strictEqual(workingCopy.isOrphaned(), true);
                onDidChangeOrphanedPromise = event_1.Event.toPromise(workingCopy.onDidChangeOrphaned);
                accessor.fileService.notExistsSet.delete(resource);
                accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource, type: 1 /* FileChangeType.ADDED */ }], false));
                await onDidChangeOrphanedPromise;
                assert.strictEqual(workingCopy.isOrphaned(), false);
            });
        });
        test('dispose, isDisposed', async () => {
            assert.strictEqual(workingCopy.isDisposed(), false);
            let disposedEvent = false;
            disposables.add(workingCopy.onWillDispose(() => {
                disposedEvent = true;
            }));
            workingCopy.dispose();
            assert.strictEqual(workingCopy.isDisposed(), true);
            assert.strictEqual(disposedEvent, true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VXb3JraW5nQ29weS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvdGVzdC9icm93c2VyL3Jlc291cmNlV29ya2luZ0NvcHkudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdCaEcsS0FBSyxDQUFDLHFCQUFxQixFQUFFO1FBRTVCLE1BQU0sdUJBQXdCLFNBQVEseUNBQW1CO1lBQXpEOztnQkFDQyxTQUFJLEdBQUcsVUFBVSxDQUFDO2dCQUNsQixXQUFNLEdBQUcsWUFBWSxDQUFDO2dCQUN0QixpQkFBWSx3Q0FBZ0M7Z0JBQzVDLHFCQUFnQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQzlCLHVCQUFrQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ2hDLGNBQVMsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBTXhCLENBQUM7WUFMQSxPQUFPLEtBQWMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBd0IsSUFBaUMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuSCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQXNCLElBQXNCLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN0RSxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQXdCLElBQW1CLENBQUM7U0FFekQ7UUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxNQUFNLFFBQVEsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQzNDLElBQUksb0JBQTJDLENBQUM7UUFDaEQsSUFBSSxRQUE2QixDQUFDO1FBQ2xDLElBQUksV0FBb0MsQ0FBQztRQUV6QyxTQUFTLGlCQUFpQixDQUFDLE1BQVcsUUFBUTtZQUM3QyxPQUFPLElBQUksdUJBQXVCLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLG9CQUFvQixHQUFHLElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzdFLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkNBQW1CLENBQUMsQ0FBQztZQUVwRSxXQUFXLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3BDLE9BQU8sSUFBQSx3Q0FBa0IsRUFBQyxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUVwRCxJQUFJLDBCQUEwQixHQUFHLGFBQUssQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2xGLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3RELFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLElBQUksd0JBQWdCLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLGdDQUF3QixFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUVoSCxNQUFNLDBCQUEwQixDQUFDO2dCQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFbkQsMEJBQTBCLEdBQUcsYUFBSyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDOUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNuRCxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxJQUFJLHdCQUFnQixDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSw4QkFBc0IsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFFOUcsTUFBTSwwQkFBMEIsQ0FBQztnQkFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVwRCxJQUFJLGFBQWEsR0FBRyxLQUFLLENBQUM7WUFDMUIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRTtnQkFDOUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXRCLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=