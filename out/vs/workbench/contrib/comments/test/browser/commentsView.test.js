/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/test/browser/workbenchTestServices", "vs/editor/common/core/range", "vs/workbench/contrib/comments/browser/commentsView", "vs/workbench/contrib/comments/browser/commentService", "vs/base/common/event", "vs/workbench/common/views", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert, workbenchTestServices_1, range_1, commentsView_1, commentService_1, event_1, views_1, configuration_1, testConfigurationService_1, contextView_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestViewDescriptorService = void 0;
    class TestCommentThread {
        isDocumentCommentThread() {
            return true;
        }
        constructor(commentThreadHandle, controllerHandle, threadId, resource, range, comments) {
            this.commentThreadHandle = commentThreadHandle;
            this.controllerHandle = controllerHandle;
            this.threadId = threadId;
            this.resource = resource;
            this.range = range;
            this.comments = comments;
            this.onDidChangeComments = new event_1.Emitter().event;
            this.onDidChangeInitialCollapsibleState = new event_1.Emitter().event;
            this.canReply = false;
            this.onDidChangeInput = new event_1.Emitter().event;
            this.onDidChangeRange = new event_1.Emitter().event;
            this.onDidChangeLabel = new event_1.Emitter().event;
            this.onDidChangeCollapsibleState = new event_1.Emitter().event;
            this.onDidChangeState = new event_1.Emitter().event;
            this.onDidChangeCanReply = new event_1.Emitter().event;
            this.isDisposed = false;
            this.isTemplate = false;
            this.label = undefined;
            this.contextValue = undefined;
        }
    }
    class TestCommentController {
        constructor() {
            this.id = 'test';
            this.label = 'Test Comments';
            this.owner = 'test';
            this.features = {};
        }
        createCommentThreadTemplate(resource, range) {
            throw new Error('Method not implemented.');
        }
        updateCommentThreadTemplate(threadHandle, range) {
            throw new Error('Method not implemented.');
        }
        deleteCommentThreadMain(commentThreadId) {
            throw new Error('Method not implemented.');
        }
        toggleReaction(uri, thread, comment, reaction, token) {
            throw new Error('Method not implemented.');
        }
        getDocumentComments(resource, token) {
            throw new Error('Method not implemented.');
        }
        getNotebookComments(resource, token) {
            throw new Error('Method not implemented.');
        }
        setActiveCommentAndThread(commentInfo) {
            throw new Error('Method not implemented.');
        }
    }
    class TestViewDescriptorService {
        constructor() {
            this.onDidChangeLocation = new event_1.Emitter().event;
        }
        getViewLocationById(id) {
            return 1 /* ViewContainerLocation.Panel */;
        }
        getViewDescriptorById(id) {
            return null;
        }
        getViewContainerByViewId(id) {
            return {
                id: 'comments',
                title: { value: 'Comments', original: 'Comments' },
                ctorDescriptor: {}
            };
        }
        getViewContainerModel(viewContainer) {
            const partialViewContainerModel = {
                onDidChangeContainerInfo: new event_1.Emitter().event
            };
            return partialViewContainerModel;
        }
        getDefaultContainerById(id) {
            return null;
        }
    }
    exports.TestViewDescriptorService = TestViewDescriptorService;
    suite('Comments View', function () {
        teardown(() => {
            instantiationService.dispose();
            commentService.dispose();
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let disposables;
        let instantiationService;
        let commentService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({}, disposables);
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(contextView_1.IContextViewService, {});
            instantiationService.stub(views_1.IViewDescriptorService, new TestViewDescriptorService());
            commentService = instantiationService.createInstance(commentService_1.CommentService);
            instantiationService.stub(commentService_1.ICommentService, commentService);
            commentService.registerCommentController('test', new TestCommentController());
        });
        test('collapse all', async function () {
            const view = instantiationService.createInstance(commentsView_1.CommentsPanel, { id: 'comments', title: 'Comments' });
            view.render();
            commentService.setWorkspaceComments('test', [
                new TestCommentThread(1, 1, '1', 'test1', new range_1.Range(1, 1, 1, 1), [{ body: 'test', uniqueIdInThread: 1, userName: 'alex' }]),
                new TestCommentThread(2, 1, '1', 'test2', new range_1.Range(1, 1, 1, 1), [{ body: 'test', uniqueIdInThread: 1, userName: 'alex' }]),
            ]);
            assert.strictEqual(view.getFilterStats().total, 2);
            assert.strictEqual(view.areAllCommentsExpanded(), true);
            view.collapseAll();
            assert.strictEqual(view.isSomeCommentsExpanded(), false);
            view.dispose();
        });
        test('expand all', async function () {
            const view = instantiationService.createInstance(commentsView_1.CommentsPanel, { id: 'comments', title: 'Comments' });
            view.render();
            commentService.setWorkspaceComments('test', [
                new TestCommentThread(1, 1, '1', 'test1', new range_1.Range(1, 1, 1, 1), [{ body: 'test', uniqueIdInThread: 1, userName: 'alex' }]),
                new TestCommentThread(2, 1, '1', 'test2', new range_1.Range(1, 1, 1, 1), [{ body: 'test', uniqueIdInThread: 1, userName: 'alex' }]),
            ]);
            assert.strictEqual(view.getFilterStats().total, 2);
            view.collapseAll();
            assert.strictEqual(view.isSomeCommentsExpanded(), false);
            view.expandAll();
            assert.strictEqual(view.areAllCommentsExpanded(), true);
            view.dispose();
        });
        test('filter by text', async function () {
            const view = instantiationService.createInstance(commentsView_1.CommentsPanel, { id: 'comments', title: 'Comments' });
            view.setVisible(true);
            view.render();
            commentService.setWorkspaceComments('test', [
                new TestCommentThread(1, 1, '1', 'test1', new range_1.Range(1, 1, 1, 1), [{ body: 'This comment is a cat.', uniqueIdInThread: 1, userName: 'alex' }]),
                new TestCommentThread(2, 1, '1', 'test2', new range_1.Range(1, 1, 1, 1), [{ body: 'This comment is a dog.', uniqueIdInThread: 1, userName: 'alex' }]),
            ]);
            assert.strictEqual(view.getFilterStats().total, 2);
            assert.strictEqual(view.getFilterStats().filtered, 2);
            view.getFilterWidget().setFilterText('cat');
            // Setting showResolved causes the filter to trigger for the purposes of this test.
            view.filters.showResolved = false;
            assert.strictEqual(view.getFilterStats().total, 2);
            assert.strictEqual(view.getFilterStats().filtered, 1);
            view.clearFilterText();
            // Setting showResolved causes the filter to trigger for the purposes of this test.
            view.filters.showResolved = true;
            assert.strictEqual(view.getFilterStats().total, 2);
            assert.strictEqual(view.getFilterStats().filtered, 2);
            view.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNWaWV3LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvbW1lbnRzL3Rlc3QvYnJvd3Nlci9jb21tZW50c1ZpZXcudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQmhHLE1BQU0saUJBQWlCO1FBQ3RCLHVCQUF1QjtZQUN0QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDRCxZQUE0QixtQkFBMkIsRUFDdEMsZ0JBQXdCLEVBQ3hCLFFBQWdCLEVBQ2hCLFFBQWdCLEVBQ2hCLEtBQWEsRUFDYixRQUFtQjtZQUxSLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBUTtZQUN0QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVE7WUFDeEIsYUFBUSxHQUFSLFFBQVEsQ0FBUTtZQUNoQixhQUFRLEdBQVIsUUFBUSxDQUFRO1lBQ2hCLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDYixhQUFRLEdBQVIsUUFBUSxDQUFXO1lBRXBDLHdCQUFtQixHQUEwQyxJQUFJLGVBQU8sRUFBa0MsQ0FBQyxLQUFLLENBQUM7WUFDakgsdUNBQWtDLEdBQXFELElBQUksZUFBTyxFQUE2QyxDQUFDLEtBQUssQ0FBQztZQUN0SixhQUFRLEdBQVksS0FBSyxDQUFDO1lBQzFCLHFCQUFnQixHQUFvQyxJQUFJLGVBQU8sRUFBNEIsQ0FBQyxLQUFLLENBQUM7WUFDbEcscUJBQWdCLEdBQWtCLElBQUksZUFBTyxFQUFVLENBQUMsS0FBSyxDQUFDO1lBQzlELHFCQUFnQixHQUE4QixJQUFJLGVBQU8sRUFBc0IsQ0FBQyxLQUFLLENBQUM7WUFDdEYsZ0NBQTJCLEdBQXFELElBQUksZUFBTyxFQUE2QyxDQUFDLEtBQUssQ0FBQztZQUMvSSxxQkFBZ0IsR0FBMEMsSUFBSSxlQUFPLEVBQWtDLENBQUMsS0FBSyxDQUFDO1lBQzlHLHdCQUFtQixHQUFtQixJQUFJLGVBQU8sRUFBVyxDQUFDLEtBQUssQ0FBQztZQUNuRSxlQUFVLEdBQVksS0FBSyxDQUFDO1lBQzVCLGVBQVUsR0FBWSxLQUFLLENBQUM7WUFDNUIsVUFBSyxHQUF1QixTQUFTLENBQUM7WUFDdEMsaUJBQVksR0FBdUIsU0FBUyxDQUFDO1FBZEwsQ0FBQztLQWV6QztJQUVELE1BQU0scUJBQXFCO1FBQTNCO1lBQ0MsT0FBRSxHQUFXLE1BQU0sQ0FBQztZQUNwQixVQUFLLEdBQVcsZUFBZSxDQUFDO1lBQ2hDLFVBQUssR0FBVyxNQUFNLENBQUM7WUFDdkIsYUFBUSxHQUFHLEVBQUUsQ0FBQztRQXVCZixDQUFDO1FBdEJBLDJCQUEyQixDQUFDLFFBQXVCLEVBQUUsS0FBeUI7WUFDN0UsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCwyQkFBMkIsQ0FBQyxZQUFvQixFQUFFLEtBQWE7WUFDOUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCx1QkFBdUIsQ0FBQyxlQUF1QjtZQUM5QyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELGNBQWMsQ0FBQyxHQUFRLEVBQUUsTUFBNkIsRUFBRSxPQUFnQixFQUFFLFFBQXlCLEVBQUUsS0FBd0I7WUFDNUgsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxtQkFBbUIsQ0FBQyxRQUFhLEVBQUUsS0FBd0I7WUFDMUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxtQkFBbUIsQ0FBQyxRQUFhLEVBQUUsS0FBd0I7WUFDMUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCx5QkFBeUIsQ0FBQyxXQUFvRTtZQUM3RixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztLQUVEO0lBRUQsTUFBYSx5QkFBeUI7UUFBdEM7WUFJVSx3QkFBbUIsR0FBZ0csSUFBSSxlQUFPLEVBQXdGLENBQUMsS0FBSyxDQUFDO1FBb0J2TyxDQUFDO1FBdkJBLG1CQUFtQixDQUFDLEVBQVU7WUFDN0IsMkNBQW1DO1FBQ3BDLENBQUM7UUFFRCxxQkFBcUIsQ0FBQyxFQUFVO1lBQy9CLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNELHdCQUF3QixDQUFDLEVBQVU7WUFDbEMsT0FBTztnQkFDTixFQUFFLEVBQUUsVUFBVTtnQkFDZCxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUU7Z0JBQ2xELGNBQWMsRUFBRSxFQUFTO2FBQ3pCLENBQUM7UUFDSCxDQUFDO1FBQ0QscUJBQXFCLENBQUMsYUFBNEI7WUFDakQsTUFBTSx5QkFBeUIsR0FBaUM7Z0JBQy9ELHdCQUF3QixFQUFFLElBQUksZUFBTyxFQUErRCxDQUFDLEtBQUs7YUFDMUcsQ0FBQztZQUNGLE9BQU8seUJBQWdELENBQUM7UUFDekQsQ0FBQztRQUNELHVCQUF1QixDQUFDLEVBQVU7WUFDakMsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO0tBQ0Q7SUF4QkQsOERBd0JDO0lBRUQsS0FBSyxDQUFDLGVBQWUsRUFBRTtRQUN0QixRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2Isb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDL0IsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3pCLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLFdBQTRCLENBQUM7UUFDakMsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLGNBQThCLENBQUM7UUFFbkMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNwQyxvQkFBb0IsR0FBRyxJQUFBLHFEQUE2QixFQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN0RSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMscUNBQXFCLEVBQUUsSUFBSSxtREFBd0IsRUFBRSxDQUFDLENBQUM7WUFDakYsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGlDQUFtQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25ELG9CQUFvQixDQUFDLElBQUksQ0FBQyw4QkFBc0IsRUFBRSxJQUFJLHlCQUF5QixFQUFFLENBQUMsQ0FBQztZQUNuRixjQUFjLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLCtCQUFjLENBQUMsQ0FBQztZQUNyRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsZ0NBQWUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUMzRCxjQUFjLENBQUMseUJBQXlCLENBQUMsTUFBTSxFQUFFLElBQUkscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1FBQy9FLENBQUMsQ0FBQyxDQUFDO1FBSUgsSUFBSSxDQUFDLGNBQWMsRUFBRSxLQUFLO1lBQ3pCLE1BQU0sSUFBSSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw0QkFBYSxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUN2RyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDZCxjQUFjLENBQUMsb0JBQW9CLENBQUMsTUFBTSxFQUFFO2dCQUMzQyxJQUFJLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQzNILElBQUksaUJBQWlCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQzthQUMzSCxDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4RCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6RCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUs7WUFDdkIsTUFBTSxJQUFJLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDRCQUFhLEVBQUUsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNkLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUU7Z0JBQzNDLElBQUksaUJBQWlCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDM0gsSUFBSSxpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO2FBQzNILENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6RCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDakIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4RCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsS0FBSztZQUMzQixNQUFNLElBQUksR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNEJBQWEsRUFBRSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDdkcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDZCxjQUFjLENBQUMsb0JBQW9CLENBQUMsTUFBTSxFQUFFO2dCQUMzQyxJQUFJLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLHdCQUF3QixFQUFFLGdCQUFnQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDN0ksSUFBSSxpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7YUFDN0ksQ0FBQyxDQUFDO1lBQ0gsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVDLG1GQUFtRjtZQUNuRixJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7WUFFbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDdkIsbUZBQW1GO1lBQ25GLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztZQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=