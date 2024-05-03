/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/htmlContent", "vs/base/test/common/snapshot", "vs/base/test/common/utils", "../../common/annotations"], function (require, exports, htmlContent_1, snapshot_1, utils_1, annotations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function content(str) {
        return { kind: 'markdownContent', content: new htmlContent_1.MarkdownString(str) };
    }
    suite('Annotations', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('extractVulnerabilitiesFromText', () => {
            test('single line', async () => {
                const before = 'some code ';
                const vulnContent = 'content with vuln';
                const after = ' after';
                const annotatedResult = (0, annotations_1.annotateSpecialMarkdownContent)([content(before), { kind: 'markdownVuln', content: new htmlContent_1.MarkdownString(vulnContent), vulnerabilities: [{ title: 'title', description: 'vuln' }] }, content(after)]);
                await (0, snapshot_1.assertSnapshot)(annotatedResult);
                const markdown = annotatedResult[0];
                const result = (0, annotations_1.extractVulnerabilitiesFromText)(markdown.content.value);
                await (0, snapshot_1.assertSnapshot)(result);
            });
            test('multiline', async () => {
                const before = 'some code\nover\nmultiple lines ';
                const vulnContent = 'content with vuln\nand\nnewlines';
                const after = 'more code\nwith newline';
                const annotatedResult = (0, annotations_1.annotateSpecialMarkdownContent)([content(before), { kind: 'markdownVuln', content: new htmlContent_1.MarkdownString(vulnContent), vulnerabilities: [{ title: 'title', description: 'vuln' }] }, content(after)]);
                await (0, snapshot_1.assertSnapshot)(annotatedResult);
                const markdown = annotatedResult[0];
                const result = (0, annotations_1.extractVulnerabilitiesFromText)(markdown.content.value);
                await (0, snapshot_1.assertSnapshot)(result);
            });
            test('multiple vulns', async () => {
                const before = 'some code\nover\nmultiple lines ';
                const vulnContent = 'content with vuln\nand\nnewlines';
                const after = 'more code\nwith newline';
                const annotatedResult = (0, annotations_1.annotateSpecialMarkdownContent)([
                    content(before),
                    { kind: 'markdownVuln', content: new htmlContent_1.MarkdownString(vulnContent), vulnerabilities: [{ title: 'title', description: 'vuln' }] },
                    content(after),
                    { kind: 'markdownVuln', content: new htmlContent_1.MarkdownString(vulnContent), vulnerabilities: [{ title: 'title', description: 'vuln' }] },
                ]);
                await (0, snapshot_1.assertSnapshot)(annotatedResult);
                const markdown = annotatedResult[0];
                const result = (0, annotations_1.extractVulnerabilitiesFromText)(markdown.content.value);
                await (0, snapshot_1.assertSnapshot)(result);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGlvbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC90ZXN0L2NvbW1vbi9hbm5vdGF0aW9ucy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLFNBQVMsT0FBTyxDQUFDLEdBQVc7UUFDM0IsT0FBTyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsSUFBSSw0QkFBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7SUFDdEUsQ0FBQztJQUVELEtBQUssQ0FBQyxhQUFhLEVBQUU7UUFDcEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLEVBQUU7WUFDNUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDOUIsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO2dCQUM1QixNQUFNLFdBQVcsR0FBRyxtQkFBbUIsQ0FBQztnQkFDeEMsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDO2dCQUN2QixNQUFNLGVBQWUsR0FBRyxJQUFBLDRDQUE4QixFQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxPQUFPLEVBQUUsSUFBSSw0QkFBYyxDQUFDLFdBQVcsQ0FBQyxFQUFFLGVBQWUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFOLE1BQU0sSUFBQSx5QkFBYyxFQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUV0QyxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsQ0FB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