/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uuid", "vs/base/test/common/utils", "vs/workbench/contrib/snippets/browser/snippetsFile"], function (require, exports, assert, uuid_1, utils_1, snippetsFile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SnippetRewrite', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertRewrite(input, expected) {
            const actual = new snippetsFile_1.Snippet(false, ['foo'], 'foo', 'foo', 'foo', input, 'foo', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)());
            if (typeof expected === 'boolean') {
                assert.strictEqual(actual.codeSnippet, input);
            }
            else {
                assert.strictEqual(actual.codeSnippet, expected);
            }
        }
        test('bogous variable rewrite', function () {
            assertRewrite('foo', false);
            assertRewrite('hello $1 world$0', false);
            assertRewrite('$foo and $foo', '${1:foo} and ${1:foo}');
            assertRewrite('$1 and $SELECTION and $foo', '$1 and ${SELECTION} and ${2:foo}');
            assertRewrite([
                'for (var ${index} = 0; ${index} < ${array}.length; ${index}++) {',
                '\tvar ${element} = ${array}[${index}];',
                '\t$0',
                '}'
            ].join('\n'), [
                'for (var ${1:index} = 0; ${1:index} < ${2:array}.length; ${1:index}++) {',
                '\tvar ${3:element} = ${2:array}[${1:index}];',
                '\t$0',
                '\\}'
            ].join('\n'));
        });
        test('Snippet choices: unable to escape comma and pipe, #31521', function () {
            assertRewrite('console.log(${1|not\\, not, five, 5, 1   23|});', false);
        });
        test('lazy bogous variable rewrite', function () {
            const snippet = new snippetsFile_1.Snippet(false, ['fooLang'], 'foo', 'prefix', 'desc', 'This is ${bogous} because it is a ${var}', 'source', 3 /* SnippetSource.Extension */, (0, uuid_1.generateUuid)());
            assert.strictEqual(snippet.body, 'This is ${bogous} because it is a ${var}');
            assert.strictEqual(snippet.codeSnippet, 'This is ${1:bogous} because it is a ${2:var}');
            assert.strictEqual(snippet.isBogous, true);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNSZXdyaXRlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NuaXBwZXRzL3Rlc3QvYnJvd3Nlci9zbmlwcGV0c1Jld3JpdGUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsZ0JBQWdCLEVBQUU7UUFFdkIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLFNBQVMsYUFBYSxDQUFDLEtBQWEsRUFBRSxRQUEwQjtZQUMvRCxNQUFNLE1BQU0sR0FBRyxJQUFJLHNCQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssOEJBQXNCLElBQUEsbUJBQVksR0FBRSxDQUFDLENBQUM7WUFDbEgsSUFBSSxPQUFPLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9DLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDbEQsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLENBQUMseUJBQXlCLEVBQUU7WUFFL0IsYUFBYSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QixhQUFhLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFekMsYUFBYSxDQUFDLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3hELGFBQWEsQ0FBQyw0QkFBNEIsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO1lBR2hGLGFBQWEsQ0FDWjtnQkFDQyxrRUFBa0U7Z0JBQ2xFLHdDQUF3QztnQkFDeEMsTUFBTTtnQkFDTixHQUFHO2FBQ0gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ1o7Z0JBQ0MsMEVBQTBFO2dCQUMxRSw4Q0FBOEM7Z0JBQzlDLE1BQU07Z0JBQ04sS0FBSzthQUNMLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUNaLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwREFBMEQsRUFBRTtZQUNoRSxhQUFhLENBQUMsaURBQWlELEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEJBQThCLEVBQUU7WUFDcEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLDBDQUEwQyxFQUFFLFFBQVEsbUNBQTJCLElBQUEsbUJBQVksR0FBRSxDQUFDLENBQUM7WUFDeEssTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLDBDQUEwQyxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLDhDQUE4QyxDQUFDLENBQUM7WUFDeEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==