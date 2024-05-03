/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/contrib/terminal/browser/terminalActions"], function (require, exports, assert_1, uri_1, utils_1, terminalActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function makeFakeFolder(name, uri) {
        return {
            name,
            uri,
            index: 0,
            toResource: () => uri,
        };
    }
    function makePair(folder, cwd, isAbsolute) {
        return {
            folder,
            cwd: !cwd ? folder.uri : (cwd instanceof uri_1.URI ? cwd : cwd.uri),
            isAbsolute: !!isAbsolute,
            isOverridden: !!cwd && cwd.toString() !== folder.uri.toString(),
        };
    }
    suite('terminalActions', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const root = uri_1.URI.file('/some-root');
        const a = makeFakeFolder('a', uri_1.URI.joinPath(root, 'a'));
        const b = makeFakeFolder('b', uri_1.URI.joinPath(root, 'b'));
        const c = makeFakeFolder('c', uri_1.URI.joinPath(root, 'c'));
        const d = makeFakeFolder('d', uri_1.URI.joinPath(root, 'd'));
        suite('shrinkWorkspaceFolderCwdPairs', () => {
            test('should return empty when given array is empty', () => {
                (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)([]), []);
            });
            test('should return the only single pair when given argument is a single element array', () => {
                const pairs = [makePair(a)];
                (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)(pairs), pairs);
            });
            test('should return all pairs when no repeated cwds', () => {
                const pairs = [makePair(a), makePair(b), makePair(c)];
                (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)(pairs), pairs);
            });
            suite('should select the pair that has the same URI when repeated cwds exist', () => {
                test('all repeated', () => {
                    const pairA = makePair(a);
                    const pairB = makePair(b, a); // CWD points to A
                    const pairC = makePair(c, a); // CWD points to A
                    (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)([pairA, pairB, pairC]), [pairA]);
                });
                test('two repeated + one different', () => {
                    const pairA = makePair(a);
                    const pairB = makePair(b, a); // CWD points to A
                    const pairC = makePair(c);
                    (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)([pairA, pairB, pairC]), [pairA, pairC]);
                });
                test('two repeated + two repeated', () => {
                    const pairA = makePair(a);
                    const pairB = makePair(b, a); // CWD points to A
                    const pairC = makePair(c);
                    const pairD = makePair(d, c);
                    (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)([pairA, pairB, pairC, pairD]), [pairA, pairC]);
                });
                test('two repeated + two repeated (reverse order)', () => {
                    const pairB = makePair(b, a); // CWD points to A
                    const pairA = makePair(a);
                    const pairD = makePair(d, c);
                    const pairC = makePair(c);
                    (0, assert_1.deepStrictEqual)((0, terminalActions_1.shrinkWorkspaceFolderCwdPairs)([pairA, pairB, pairC, pairD]), [pairA, pairC]);
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxBY3Rpb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL3Rlc3QvYnJvd3Nlci90ZXJtaW5hbEFjdGlvbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxTQUFTLGNBQWMsQ0FBQyxJQUFZLEVBQUUsR0FBUTtRQUM3QyxPQUFPO1lBQ04sSUFBSTtZQUNKLEdBQUc7WUFDSCxLQUFLLEVBQUUsQ0FBQztZQUNSLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHO1NBQ3JCLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBUyxRQUFRLENBQUMsTUFBd0IsRUFBRSxHQUE0QixFQUFFLFVBQW9CO1FBQzdGLE9BQU87WUFDTixNQUFNO1lBQ04sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxTQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztZQUM3RCxVQUFVLEVBQUUsQ0FBQyxDQUFDLFVBQVU7WUFDeEIsWUFBWSxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFO1NBQy9ELENBQUM7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtRQUM3QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsTUFBTSxJQUFJLEdBQVEsU0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsR0FBRyxjQUFjLENBQUMsR0FBRyxFQUFFLFNBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdkQsTUFBTSxDQUFDLEdBQUcsY0FBYyxDQUFDLEdBQUcsRUFBRSxTQUFHLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sQ0FBQyxHQUFHLGNBQWMsQ0FBQyxHQUFHLEVBQUUsU0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN2RCxNQUFNLENBQUMsR0FBRyxjQUFjLENBQUMsR0FBRyxFQUFFLFNBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFdkQsS0FBSyxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtZQUMzQyxJQUFJLENBQUMsK0NBQStDLEVBQUUsR0FBRyxFQUFFO2dCQUMxRCxJQUFBLHdCQUFlLEVBQUMsSUFBQSwrQ0FBNkIsRUFBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN4RCxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxrRkFBa0YsRUFBRSxHQUFHLEVBQUU7Z0JBQzdGLE1BQU0sS0FBSyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLElBQUEsd0JBQWUsRUFBQyxJQUFBLCtDQUE2QixFQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlELENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLCtDQUErQyxFQUFFLEdBQUcsRUFBRTtnQkFDMUQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxJQUFBLHdCQUFlLEVBQUMsSUFBQSwrQ0FBNkIsRUFBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM5RCxDQUFDLENBQUMsQ0FBQztZQUVILEtBQUssQ0FBQyx1RUFBdUUsRUFBRSxHQUFHLEVBQUU7Z0JBQ25GLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO29CQUN6QixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzFCLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0I7b0JBQ2hELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0I7b0JBQ2hELElBQUEsd0JBQWUsRUFBQyxJQUFBLCtDQUE2QixFQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDaEYsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtvQkFDekMsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxQixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCO29CQUNoRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzFCLElBQUEsd0JBQWUsRUFBQyxJQUFBLCtDQUE2QixFQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZGLENBQUMsQ0FBQyxDQUFDO2dCQUVILElBQUksQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7b0JBQ3hDLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQjtvQkFDaEQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxQixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUM3QixJQUFBLHdCQUFlLEVBQUMsSUFBQSwrQ0FBNkIsRUFBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDOUYsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtvQkFDeEQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQjtvQkFDaEQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxQixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUM3QixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzFCLElBQUEsd0JBQWUsRUFBQyxJQUFBLCtDQUE2QixFQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUM5RixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9