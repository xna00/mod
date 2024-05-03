/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/test/common/utils", "vs/workbench/services/search/node/ripgrepFileSearch"], function (require, exports, assert, platform, utils_1, ripgrepFileSearch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RipgrepFileSearch - etc', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function testGetAbsGlob(params) {
            const [folder, glob, expectedResult] = params;
            assert.strictEqual((0, ripgrepFileSearch_1.fixDriveC)((0, ripgrepFileSearch_1.getAbsoluteGlob)(folder, glob)), expectedResult, JSON.stringify(params));
        }
        (!platform.isWindows ? test.skip : test)('getAbsoluteGlob_win', () => {
            [
                ['C:/foo/bar', 'glob/**', '/foo\\bar\\glob\\**'],
                ['c:/', 'glob/**', '/glob\\**'],
                ['C:\\foo\\bar', 'glob\\**', '/foo\\bar\\glob\\**'],
                ['c:\\foo\\bar', 'glob\\**', '/foo\\bar\\glob\\**'],
                ['c:\\', 'glob\\**', '/glob\\**'],
                ['\\\\localhost\\c$\\foo\\bar', 'glob/**', '\\\\localhost\\c$\\foo\\bar\\glob\\**'],
                // absolute paths are not resolved further
                ['c:/foo/bar', '/path/something', '/path/something'],
                ['c:/foo/bar', 'c:\\project\\folder', '/project\\folder']
            ].forEach(testGetAbsGlob);
        });
        (platform.isWindows ? test.skip : test)('getAbsoluteGlob_posix', () => {
            [
                ['/foo/bar', 'glob/**', '/foo/bar/glob/**'],
                ['/', 'glob/**', '/glob/**'],
                // absolute paths are not resolved further
                ['/', '/project/folder', '/project/folder'],
            ].forEach(testGetAbsGlob);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlwZ3JlcEZpbGVTZWFyY2gudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC90ZXN0L25vZGUvcmlwZ3JlcEZpbGVTZWFyY2gudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO1FBQ3JDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUMxQyxTQUFTLGNBQWMsQ0FBQyxNQUFnQjtZQUN2QyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsR0FBRyxNQUFNLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDZCQUFTLEVBQUMsSUFBQSxtQ0FBZSxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDdEcsQ0FBQztRQUVELENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7WUFDcEU7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLHFCQUFxQixDQUFDO2dCQUNoRCxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDO2dCQUMvQixDQUFDLGNBQWMsRUFBRSxVQUFVLEVBQUUscUJBQXFCLENBQUM7Z0JBQ25ELENBQUMsY0FBYyxFQUFFLFVBQVUsRUFBRSxxQkFBcUIsQ0FBQztnQkFDbkQsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQztnQkFDakMsQ0FBQyw2QkFBNkIsRUFBRSxTQUFTLEVBQUUsdUNBQXVDLENBQUM7Z0JBRW5GLDBDQUEwQztnQkFDMUMsQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUM7Z0JBQ3BELENBQUMsWUFBWSxFQUFFLHFCQUFxQixFQUFFLGtCQUFrQixDQUFDO2FBQ3pELENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO1FBRUgsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7WUFDckU7Z0JBQ0MsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLGtCQUFrQixDQUFDO2dCQUMzQyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDO2dCQUU1QiwwQ0FBMEM7Z0JBQzFDLENBQUMsR0FBRyxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDO2FBQzNDLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==