/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/htmlContent", "vs/base/test/common/utils"], function (require, exports, assert, htmlContent_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MarkdownString', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Escape leading whitespace', function () {
            const mds = new htmlContent_1.MarkdownString();
            mds.appendText('Hello\n    Not a code block');
            assert.strictEqual(mds.value, 'Hello\n\n&nbsp;&nbsp;&nbsp;&nbsp;Not&nbsp;a&nbsp;code&nbsp;block');
        });
        test('MarkdownString.appendText doesn\'t escape quote #109040', function () {
            const mds = new htmlContent_1.MarkdownString();
            mds.appendText('> Text\n>More');
            assert.strictEqual(mds.value, '\\>&nbsp;Text\n\n\\>More');
        });
        test('appendText', () => {
            const mds = new htmlContent_1.MarkdownString();
            mds.appendText('# foo\n*bar*');
            assert.strictEqual(mds.value, '\\#&nbsp;foo\n\n\\*bar\\*');
        });
        test('appendLink', function () {
            function assertLink(target, label, title, expected) {
                const mds = new htmlContent_1.MarkdownString();
                mds.appendLink(target, label, title);
                assert.strictEqual(mds.value, expected);
            }
            assertLink('https://example.com\\()![](file:///Users/jrieken/Code/_samples/devfest/foo/img.png)', 'hello', undefined, '[hello](https://example.com\\(\\)![](file:///Users/jrieken/Code/_samples/devfest/foo/img.png\\))');
            assertLink('https://example.com', 'hello', 'title', '[hello](https://example.com "title")');
            assertLink('foo)', 'hello]', undefined, '[hello\\]](foo\\))');
            assertLink('foo\\)', 'hello]', undefined, '[hello\\]](foo\\))');
            assertLink('fo)o', 'hell]o', undefined, '[hell\\]o](fo\\)o)');
            assertLink('foo)', 'hello]', 'title"', '[hello\\]](foo\\) "title\\"")');
        });
        suite('appendCodeBlock', () => {
            function assertCodeBlock(lang, code, result) {
                const mds = new htmlContent_1.MarkdownString();
                mds.appendCodeblock(lang, code);
                assert.strictEqual(mds.value, result);
            }
            test('common cases', () => {
                // no backticks
                assertCodeBlock('ts', 'const a = 1;', `\n${[
                    '```ts',
                    'const a = 1;',
                    '```'
                ].join('\n')}\n`);
                // backticks
                assertCodeBlock('ts', 'const a = `1`;', `\n${[
                    '```ts',
                    'const a = `1`;',
                    '```'
                ].join('\n')}\n`);
            });
            // @see https://github.com/microsoft/vscode/issues/193746
            test('escape fence', () => {
                // fence in the first line
                assertCodeBlock('md', '```\n```', `\n${[
                    '````md',
                    '```\n```',
                    '````'
                ].join('\n')}\n`);
                // fence in the middle of code
                assertCodeBlock('md', '\n\n```\n```', `\n${[
                    '````md',
                    '\n\n```\n```',
                    '````'
                ].join('\n')}\n`);
                // longer fence at the end of code
                assertCodeBlock('md', '```\n```\n````\n````', `\n${[
                    '`````md',
                    '```\n```\n````\n````',
                    '`````'
                ].join('\n')}\n`);
            });
        });
        suite('ThemeIcons', () => {
            suite('Support On', () => {
                test('appendText', () => {
                    const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                    mds.appendText('$(zap) $(not a theme icon) $(add)');
                    assert.strictEqual(mds.value, '\\\\$\\(zap\\)&nbsp;$\\(not&nbsp;a&nbsp;theme&nbsp;icon\\)&nbsp;\\\\$\\(add\\)');
                });
                test('appendMarkdown', () => {
                    const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                    mds.appendMarkdown('$(zap) $(not a theme icon) $(add)');
                    assert.strictEqual(mds.value, '$(zap) $(not a theme icon) $(add)');
                });
                test('appendMarkdown with escaped icon', () => {
                    const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                    mds.appendMarkdown('\\$(zap) $(not a theme icon) $(add)');
                    assert.strictEqual(mds.value, '\\$(zap) $(not a theme icon) $(add)');
                });
            });
            suite('Support Off', () => {
                test('appendText', () => {
                    const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: false });
                    mds.appendText('$(zap) $(not a theme icon) $(add)');
                    assert.strictEqual(mds.value, '$\\(zap\\)&nbsp;$\\(not&nbsp;a&nbsp;theme&nbsp;icon\\)&nbsp;$\\(add\\)');
                });
                test('appendMarkdown', () => {
                    const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: false });
                    mds.appendMarkdown('$(zap) $(not a theme icon) $(add)');
                    assert.strictEqual(mds.value, '$(zap) $(not a theme icon) $(add)');
                });
                test('appendMarkdown with escaped icon', () => {
                    const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                    mds.appendMarkdown('\\$(zap) $(not a theme icon) $(add)');
                    assert.strictEqual(mds.value, '\\$(zap) $(not a theme icon) $(add)');
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25TdHJpbmcudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9tYXJrZG93blN0cmluZy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFFNUIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQywyQkFBMkIsRUFBRTtZQUNqQyxNQUFNLEdBQUcsR0FBRyxJQUFJLDRCQUFjLEVBQUUsQ0FBQztZQUNqQyxHQUFHLENBQUMsVUFBVSxDQUFDLDZCQUE2QixDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLGtFQUFrRSxDQUFDLENBQUM7UUFDbkcsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseURBQXlELEVBQUU7WUFDL0QsTUFBTSxHQUFHLEdBQUcsSUFBSSw0QkFBYyxFQUFFLENBQUM7WUFDakMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBRXZCLE1BQU0sR0FBRyxHQUFHLElBQUksNEJBQWMsRUFBRSxDQUFDO1lBQ2pDLEdBQUcsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFL0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLDJCQUEyQixDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsWUFBWSxFQUFFO1lB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