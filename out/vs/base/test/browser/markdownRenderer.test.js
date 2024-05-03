/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/markdownRenderer", "vs/base/common/htmlContent", "vs/base/common/marked/marked", "vs/base/common/marshalling", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils"], function (require, exports, assert, markdownRenderer_1, htmlContent_1, marked_1, marshalling_1, platform_1, uri_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function strToNode(str) {
        return new DOMParser().parseFromString(str, 'text/html').body.firstChild;
    }
    function assertNodeEquals(actualNode, expectedHtml) {
        const expectedNode = strToNode(expectedHtml);
        assert.ok(actualNode.isEqualNode(expectedNode), `Expected: ${expectedNode.outerHTML}\nActual: ${actualNode.outerHTML}`);
    }
    suite('MarkdownRenderer', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('Sanitization', () => {
            test('Should not render images with unknown schemes', () => {
                const markdown = { value: `![image](no-such://example.com/cat.gif)` };
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(markdown)).element;
                assert.strictEqual(result.innerHTML, '<p><img alt="image"></p>');
            });
        });
        suite('Images', () => {
            test('image rendering conforms to default', () => {
                const markdown = { value: `![image](http://example.com/cat.gif 'caption')` };
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(markdown)).element;
                assertNodeEquals(result, '<div><p><img title="caption" alt="image" src="http://example.com/cat.gif"></p></div>');
            });
            test('image rendering conforms to default without title', () => {
                const markdown = { value: `![image](http://example.com/cat.gif)` };
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(markdown)).element;
                assertNodeEquals(result, '<div><p><img alt="image" src="http://example.com/cat.gif"></p></div>');
            });
            test('image width from title params', () => {
                const result = store.add((0, markdownRenderer_1.renderMarkdown)({ value: `![image](http://example.com/cat.gif|width=100px 'caption')` })).element;
                assertNodeEquals(result, `<div><p><img width="100" title="caption" alt="image" src="http://example.com/cat.gif"></p></div>`);
            });
            test('image height from title params', () => {
                const result = store.add((0, markdownRenderer_1.renderMarkdown)({ value: `![image](http://example.com/cat.gif|height=100 'caption')` })).element;
                assertNodeEquals(result, `<div><p><img height="100" title="caption" alt="image" src="http://example.com/cat.gif"></p></div>`);
            });
            test('image width and height from title params', () => {
                const result = store.add((0, markdownRenderer_1.renderMarkdown)({ value: `![image](http://example.com/cat.gif|height=200,width=100 'caption')` })).element;
                assertNodeEquals(result, `<div><p><img height="200" width="100" title="caption" alt="image" src="http://example.com/cat.gif"></p></div>`);
            });
            test('image with file uri should render as same origin uri', () => {
                if (platform_1.isWeb) {
                    return;
                }
                const result = store.add((0, markdownRenderer_1.renderMarkdown)({ value: `![image](file:///images/cat.gif)` })).element;
                assertNodeEquals(result, '<div><p><img src="vscode-file://vscode-app/images/cat.gif" alt="image"></p></div>');
            });
        });
        suite('Code block renderer', () => {
            const simpleCodeBlockRenderer = (lang, code) => {
                const element = document.createElement('code');
                element.textContent = code;
                return Promise.resolve(element);
            };
            test('asyncRenderCallback should be invoked for code blocks', () => {
                const markdown = { value: '```js\n1 + 1;\n```' };
                return new Promise(resolve => {
                    store.add((0, markdownRenderer_1.renderMarkdown)(markdown, {
                        asyncRenderCallback: resolve,
                        codeBlockRenderer: simpleCodeBlockRenderer
                    }));
                });
            });
            test('asyncRenderCallback should not be invoked if result is immediately disposed', () => {
                const markdown = { value: '```js\n1 + 1;\n```' };
                return new Promise((resolve, reject) => {
                    const result = (0, markdownRenderer_1.renderMarkdown)(markdown, {
                        asyncRenderCallback: reject,
                        codeBlockRenderer: simpleCodeBlockRenderer
                    });
                    result.dispose();
                    setTimeout(resolve, 10);
                });
            });
            test('asyncRenderCallback should not be invoked if dispose is called before code block is rendered', () => {
                const markdown = { value: '```js\n1 + 1;\n```' };
                return new Promise((resolve, reject) => {
                    let resolveCodeBlockRendering;
                    const result = (0, markdownRenderer_1.renderMarkdown)(markdown, {
                        asyncRenderCallback: reject,
                        codeBlockRenderer: () => {
                            return new Promise(resolve => {
                                resolveCodeBlockRendering = resolve;
                            });
                        }
                    });
                    setTimeout(() => {
                        result.dispose();
                        resolveCodeBlockRendering(document.createElement('code'));
                        setTimeout(resolve, 10);
                    }, 10);
                });
            });
            test('Code blocks should use leading language id (#157793)', async () => {
                const markdown = { value: '```js some other stuff\n1 + 1;\n```' };
                const lang = await new Promise(resolve => {
                    store.add((0, markdownRenderer_1.renderMarkdown)(markdown, {
                        codeBlockRenderer: async (lang, value) => {
                            resolve(lang);
                            return simpleCodeBlockRenderer(lang, value);
                        }
                    }));
                });
                assert.strictEqual(lang, 'js');
            });
        });
        suite('ThemeIcons Support On', () => {
            test('render appendText', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                mds.appendText('$(zap) $(not a theme icon) $(add)');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>$(zap)&nbsp;$(not&nbsp;a&nbsp;theme&nbsp;icon)&nbsp;$(add)</p>`);
            });
            test('render appendMarkdown', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                mds.appendMarkdown('$(zap) $(not a theme icon) $(add)');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p><span class="codicon codicon-zap"></span> $(not a theme icon) <span class="codicon codicon-add"></span></p>`);
            });
            test('render appendMarkdown with escaped icon', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                mds.appendMarkdown('\\$(zap) $(not a theme icon) $(add)');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>$(zap) $(not a theme icon) <span class="codicon codicon-add"></span></p>`);
            });
            test('render icon in link', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                mds.appendMarkdown(`[$(zap)-link](#link)`);
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p><a data-href="#link" href="" title="#link" draggable="false"><span class="codicon codicon-zap"></span>-link</a></p>`);
            });
            test('render icon in table', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true });
                mds.appendMarkdown(`
| text   | text                 |
|--------|----------------------|
| $(zap) | [$(zap)-link](#link) |`);
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<table>
<thead>
<tr>
<th>text</th>
<th>text</th>
</tr>
</thead>
<tbody><tr>
<td><span class="codicon codicon-zap"></span></td>
<td><a data-href="#link" href="" title="#link" draggable="false"><span class="codicon codicon-zap"></span>-link</a></td>
</tr>
</tbody></table>
`);
            });
            test('render icon in <a> without href (#152170)', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true, supportHtml: true });
                mds.appendMarkdown(`<a>$(sync)</a>`);
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p><span class="codicon codicon-sync"></span></p>`);
            });
        });
        suite('ThemeIcons Support Off', () => {
            test('render appendText', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: false });
                mds.appendText('$(zap) $(not a theme icon) $(add)');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>$(zap)&nbsp;$(not&nbsp;a&nbsp;theme&nbsp;icon)&nbsp;$(add)</p>`);
            });
            test('render appendMarkdown with escaped icon', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: false });
                mds.appendMarkdown('\\$(zap) $(not a theme icon) $(add)');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>$(zap) $(not a theme icon) $(add)</p>`);
            });
        });
        test('npm Hover Run Script not working #90855', function () {
            const md = JSON.parse('{"value":"[Run Script](command:npm.runScriptFromHover?%7B%22documentUri%22%3A%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22c%3A%5C%5CUsers%5C%5Cjrieken%5C%5CCode%5C%5C_sample%5C%5Cfoo%5C%5Cpackage.json%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fc%253A%2FUsers%2Fjrieken%2FCode%2F_sample%2Ffoo%2Fpackage.json%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2Fjrieken%2FCode%2F_sample%2Ffoo%2Fpackage.json%22%2C%22scheme%22%3A%22file%22%7D%2C%22script%22%3A%22echo%22%7D \\"Run the script as a task\\")","supportThemeIcons":false,"isTrusted":true,"uris":{"__uri_e49443":{"$mid":1,"fsPath":"c:\\\\Users\\\\jrieken\\\\Code\\\\_sample\\\\foo\\\\package.json","_sep":1,"external":"file:///c%3A/Users/jrieken/Code/_sample/foo/package.json","path":"/c:/Users/jrieken/Code/_sample/foo/package.json","scheme":"file"},"command:npm.runScriptFromHover?%7B%22documentUri%22%3A%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22c%3A%5C%5CUsers%5C%5Cjrieken%5C%5CCode%5C%5C_sample%5C%5Cfoo%5C%5Cpackage.json%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fc%253A%2FUsers%2Fjrieken%2FCode%2F_sample%2Ffoo%2Fpackage.json%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2Fjrieken%2FCode%2F_sample%2Ffoo%2Fpackage.json%22%2C%22scheme%22%3A%22file%22%7D%2C%22script%22%3A%22echo%22%7D":{"$mid":1,"path":"npm.runScriptFromHover","scheme":"command","query":"{\\"documentUri\\":\\"__uri_e49443\\",\\"script\\":\\"echo\\"}"}}}');
            const element = store.add((0, markdownRenderer_1.renderMarkdown)(md)).element;
            const anchor = element.querySelector('a');
            assert.ok(anchor);
            assert.ok(anchor.dataset['href']);
            const uri = uri_1.URI.parse(anchor.dataset['href']);
            const data = (0, marshalling_1.parse)(decodeURIComponent(uri.query));
            assert.ok(data);
            assert.strictEqual(data.script, 'echo');
            assert.ok(data.documentUri.toString().startsWith('file:///c%3A/'));
        });
        test('Should not render command links by default', () => {
            const md = new htmlContent_1.MarkdownString(`[command1](command:doFoo) <a href="command:doFoo">command2</a>`, {
                supportHtml: true
            });
            const result = store.add((0, markdownRenderer_1.renderMarkdown)(md)).element;
            assert.strictEqual(result.innerHTML, `<p>command1 command2</p>`);
        });
        test('Should render command links in trusted strings', () => {
            const md = new htmlContent_1.MarkdownString(`[command1](command:doFoo) <a href="command:doFoo">command2</a>`, {
                isTrusted: true,
                supportHtml: true,
            });
            const result = store.add((0, markdownRenderer_1.renderMarkdown)(md)).element;
            assert.strictEqual(result.innerHTML, `<p><a data-href="command:doFoo" href="" title="command:doFoo" draggable="false">command1</a> <a data-href="command:doFoo" href="">command2</a></p>`);
        });
        suite('PlaintextMarkdownRender', () => {
            test('test code, blockquote, heading, list, listitem, paragraph, table, tablerow, tablecell, strong, em, br, del, text are rendered plaintext', () => {
                const markdown = { value: '`code`\n>quote\n# heading\n- list\n\n\ntable | table2\n--- | --- \none | two\n\n\nbo**ld**\n_italic_\n~~del~~\nsome text' };
                const expected = 'code\nquote\nheading\nlist\ntable table2 one two \nbold\nitalic\ndel\nsome text\n';
                const result = (0, markdownRenderer_1.renderMarkdownAsPlaintext)(markdown);
                assert.strictEqual(result, expected);
            });
            test('test html, hr, image, link are rendered plaintext', () => {
                const markdown = { value: '<div>html</div>\n\n---\n![image](imageLink)\n[text](textLink)' };
                const expected = '\ntext\n';
                const result = (0, markdownRenderer_1.renderMarkdownAsPlaintext)(markdown);
                assert.strictEqual(result, expected);
            });
        });
        suite('supportHtml', () => {
            test('supportHtml is disabled by default', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, {});
                mds.appendMarkdown('a<b>b</b>c');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>abc</p>`);
            });
            test('Renders html when supportHtml=true', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportHtml: true });
                mds.appendMarkdown('a<b>b</b>c');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>a<b>b</b>c</p>`);
            });
            test('Should not include scripts even when supportHtml=true', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportHtml: true });
                mds.appendMarkdown('a<b onclick="alert(1)">b</b><script>alert(2)</script>c');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>a<b>b</b>c</p>`);
            });
            test('Should not render html appended as text', () => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportHtml: true });
                mds.appendText('a<b>b</b>c');
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<p>a&lt;b&gt;b&lt;/b&gt;c</p>`);
            });
            test('Should render html images', () => {
                if (platform_1.isWeb) {
                    return;
                }
                const mds = new htmlContent_1.MarkdownString(undefined, { supportHtml: true });
                mds.appendMarkdown(`<img src="http://example.com/cat.gif">`);
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<img src="http://example.com/cat.gif">`);
            });
            test('Should render html images with file uri as same origin uri', () => {
                if (platform_1.isWeb) {
                    return;
                }
                const mds = new htmlContent_1.MarkdownString(undefined, { supportHtml: true });
                mds.appendMarkdown(`<img src="file:///images/cat.gif">`);
                const result = store.add((0, markdownRenderer_1.renderMarkdown)(mds)).element;
                assert.strictEqual(result.innerHTML, `<img src="vscode-file://vscode-app/images/cat.gif">`);
            });
        });
        suite('fillInIncompleteTokens', () => {
            function ignoreRaw(...tokenLists) {
                tokenLists.forEach(tokens => {
                    tokens.forEach(t => t.raw = '');
                });
            }
            const completeTable = '| a | b |\n| --- | --- |';
            suite('table', () => {
                test('complete table', () => {
                    const tokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.equal(newTokens, tokens);
                });
                test('full header only', () => {
                    const incompleteTable = '| a | b |';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header only with trailing space', () => {
                    const incompleteTable = '| a | b | ';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    ignoreRaw(newTokens, completeTableTokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('incomplete header', () => {
                    const incompleteTable = '| a | b';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    ignoreRaw(newTokens, completeTableTokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('incomplete header one column', () => {
                    const incompleteTable = '| a ';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(incompleteTable + '|\n| --- |');
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    ignoreRaw(newTokens, completeTableTokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header with extras', () => {
                    const incompleteTable = '| a **bold** | b _italics_ |';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(incompleteTable + '\n| --- | --- |');
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header with leading text', () => {
                    // Parsing this gives one token and one 'text' subtoken
                    const incompleteTable = 'here is a table\n| a | b |';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(incompleteTable + '\n| --- | --- |');
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header with leading other stuff', () => {
                    // Parsing this gives one token and one 'text' subtoken
                    const incompleteTable = '```js\nconst xyz = 123;\n```\n| a | b |';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(incompleteTable + '\n| --- | --- |');
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header with incomplete separator', () => {
                    const incompleteTable = '| a | b |\n| ---';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header with incomplete separator 2', () => {
                    const incompleteTable = '| a | b |\n| --- |';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('full header with incomplete separator 3', () => {
                    const incompleteTable = '| a | b |\n|';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const completeTableTokens = marked_1.marked.lexer(completeTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, completeTableTokens);
                });
                test('not a table', () => {
                    const incompleteTable = '| a | b |\nsome text';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
                test('not a table 2', () => {
                    const incompleteTable = '| a | b |\n| --- |\nsome text';
                    const tokens = marked_1.marked.lexer(incompleteTable);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
            });
            suite('codeblock', () => {
                test('complete code block', () => {
                    const completeCodeblock = '```js\nconst xyz = 123;\n```';
                    const tokens = marked_1.marked.lexer(completeCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.equal(newTokens, tokens);
                });
                test('code block header only', () => {
                    const incompleteCodeblock = '```js';
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n```');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
                test('code block header no lang', () => {
                    const incompleteCodeblock = '```';
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n```');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
                test('code block header and some code', () => {
                    const incompleteCodeblock = '```js\nconst';
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n```');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
                test('code block header with leading text', () => {
                    const incompleteCodeblock = 'some text\n```js';
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n```');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
                test('code block header with leading text and some code', () => {
                    const incompleteCodeblock = 'some text\n```js\nconst';
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n```');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
                test('code block header with more backticks', () => {
                    const incompleteCodeblock = 'some text\n`````js\nconst';
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n`````');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
                test('code block header containing codeblock', () => {
                    const incompleteCodeblock = `some text
\`\`\`\`\`js
const x = 1;
\`\`\`
const y = 2;
\`\`\`
// foo`;
                    const tokens = marked_1.marked.lexer(incompleteCodeblock);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodeblockTokens = marked_1.marked.lexer(incompleteCodeblock + '\n`````');
                    assert.deepStrictEqual(newTokens, completeCodeblockTokens);
                });
            });
            function simpleMarkdownTestSuite(name, delimiter) {
                test(`incomplete ${name}`, () => {
                    const incomplete = `${delimiter}code`;
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + delimiter);
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test(`complete ${name}`, () => {
                    const text = `leading text ${delimiter}code${delimiter} trailing text`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
                test(`${name} with leading text`, () => {
                    const incomplete = `some text and ${delimiter}some code`;
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + delimiter);
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test(`single loose "${delimiter}"`, () => {
                    const text = `some text and ${delimiter}by itself\nmore text here`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
                test(`incomplete ${name} after newline`, () => {
                    const text = `some text\nmore text here and ${delimiter}text`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + delimiter);
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test(`incomplete after complete ${name}`, () => {
                    const text = `leading text ${delimiter}code${delimiter} trailing text and ${delimiter}another`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + delimiter);
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test.skip(`incomplete ${name} in list`, () => {
                    const text = `- list item one\n- list item two and ${delimiter}text`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + delimiter);
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
            }
            suite('codespan', () => {
                simpleMarkdownTestSuite('codespan', '`');
                test(`backtick between letters`, () => {
                    const text = 'a`b';
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeCodespanTokens = marked_1.marked.lexer(text + '`');
                    assert.deepStrictEqual(newTokens, completeCodespanTokens);
                });
                test(`nested pattern`, () => {
                    const text = 'sldkfjsd `abc __def__ ghi';
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + '`');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
            });
            suite('star', () => {
                simpleMarkdownTestSuite('star', '*');
                test(`star between letters`, () => {
                    const text = 'sldkfjsd a*b';
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + '*');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test(`nested pattern`, () => {
                    const text = 'sldkfjsd *abc __def__ ghi';
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + '*');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
            });
            suite('double star', () => {
                simpleMarkdownTestSuite('double star', '**');
                test(`double star between letters`, () => {
                    const text = 'a**b';
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(text + '**');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
            });
            suite('underscore', () => {
                simpleMarkdownTestSuite('underscore', '_');
                test(`underscore between letters`, () => {
                    const text = `this_not_italics`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
            });
            suite('double underscore', () => {
                simpleMarkdownTestSuite('double underscore', '__');
                test(`double underscore between letters`, () => {
                    const text = `this__not__bold`;
                    const tokens = marked_1.marked.lexer(text);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
            });
            suite('link', () => {
                test('incomplete link text', () => {
                    const incomplete = 'abc [text';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + '](about:blank)');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test('incomplete link target', () => {
                    const incomplete = 'foo [text](http://microsoft';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + ')');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test('incomplete link target 2', () => {
                    const incomplete = 'foo [text](http://microsoft.com';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + ')');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test('incomplete link target with extra stuff', () => {
                    const incomplete = '[before `text` after](http://microsoft.com';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + ')');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test('incomplete link target with extra stuff and arg', () => {
                    const incomplete = '[before `text` after](http://microsoft.com "more text ';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + ')');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test('incomplete link target with arg', () => {
                    const incomplete = 'foo [text](http://microsoft.com "more text here ';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + '")');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test.skip('incomplete link in list', () => {
                    const incomplete = '- [text';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    const completeTokens = marked_1.marked.lexer(incomplete + '](about:blank)');
                    assert.deepStrictEqual(newTokens, completeTokens);
                });
                test('square brace between letters', () => {
                    const incomplete = 'a[b';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
                test('square brace on previous line', () => {
                    const incomplete = 'text[\nmore text';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
                test('complete link', () => {
                    const incomplete = 'text [link](http://microsoft.com)';
                    const tokens = marked_1.marked.lexer(incomplete);
                    const newTokens = (0, markdownRenderer_1.fillInIncompleteTokens)(tokens);
                    assert.deepStrictEqual(newTokens, tokens);
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25SZW5kZXJlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvYnJvd3Nlci9tYXJrZG93blJlbmRlcmVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsU0FBUyxTQUFTLENBQUMsR0FBVztRQUM3QixPQUFPLElBQUksU0FBUyxFQUFFLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBeUIsQ0FBQztJQUN6RixDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxVQUF1QixFQUFFLFlBQW9CO1FBQ3RFLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM3QyxNQUFNLENBQUMsRUFBRSxDQUNSLFVBQVUsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLEVBQ3BDLGFBQWEsWUFBWSxDQUFDLFNBQVMsYUFBYSxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUMxRSxDQUFDO0lBRUQsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUU5QixNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsS0FBSyxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7WUFDMUIsSUFBSSxDQUFDLCtDQUErQyxFQUFFLEdBQUcsRUFBRTtnQkFDMUQsTUFBTSxRQUFRLEdBQUcsRUFBRSxLQUFLLEVBQUUseUNBQXlDLEVBQUUsQ0FBQztnQkFDdEUsTUFBTSxNQUFNLEdBQWdCLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBQSxpQ0FBYyxFQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUN4RSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUs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