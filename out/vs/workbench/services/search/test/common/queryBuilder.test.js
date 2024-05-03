define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, platform_1, uri_1, utils_1, testWorkspace_1, queryBuilder_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('QueryBuilderCommon', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let context;
        setup(() => {
            const workspace = (0, testWorkspace_1.testWorkspace)(uri_1.URI.file(platform_1.isWindows ? 'C:\\testWorkspace' : '/testWorkspace'));
            context = new workbenchTestServices_1.TestContextService(workspace);
        });
        test('resolveResourcesForSearchIncludes passes through paths without special glob characters', () => {
            const actual = (0, queryBuilder_1.resolveResourcesForSearchIncludes)([uri_1.URI.file(platform_1.isWindows ? "C:\\testWorkspace\\pages\\blog" : "/testWorkspace/pages/blog")], context);
            assert.deepStrictEqual(actual, ["./pages/blog"]);
        });
        test('resolveResourcesForSearchIncludes escapes paths with special characters', () => {
            const actual = (0, queryBuilder_1.resolveResourcesForSearchIncludes)([uri_1.URI.file(platform_1.isWindows ? "C:\\testWorkspace\\pages\\blog\\[postId]" : "/testWorkspace/pages/blog/[postId]")], context);
            assert.deepStrictEqual(actual, ["./pages/blog/[[]postId[]]"]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnlCdWlsZGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvdGVzdC9jb21tb24vcXVlcnlCdWlsZGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBYUEsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtRQUNoQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFDMUMsSUFBSSxPQUFpQyxDQUFDO1FBRXRDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLFNBQVMsR0FBRyxJQUFBLDZCQUFhLEVBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBUyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQzlGLE9BQU8sR0FBRyxJQUFJLDBDQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdGQUF3RixFQUFFLEdBQUcsRUFBRTtZQUNuRyxNQUFNLE1BQU0sR0FBRyxJQUFBLGdEQUFpQyxFQUFDLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBUyxDQUFDLENBQUMsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2xKLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5RUFBeUUsRUFBRSxHQUFHLEVBQUU7WUFDcEYsTUFBTSxNQUFNLEdBQUcsSUFBQSxnREFBaUMsRUFBQyxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQVMsQ0FBQyxDQUFDLENBQUMsMENBQTBDLENBQUMsQ0FBQyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNySyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=