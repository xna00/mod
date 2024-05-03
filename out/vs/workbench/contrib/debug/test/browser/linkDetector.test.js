/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/tunnel/common/tunnel", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/debug/browser/linkDetector", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, platform_1, uri_1, utils_1, tunnel_1, workspace_1, linkDetector_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - Link Detector', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let linkDetector;
        /**
         * Instantiate a {@link LinkDetector} for use by the functions being tested.
         */
        setup(() => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            instantiationService.stub(tunnel_1.ITunnelService, { canTunnel: () => false });
            linkDetector = instantiationService.createInstance(linkDetector_1.LinkDetector);
        });
        /**
         * Assert that a given Element is an anchor element.
         *
         * @param element The Element to verify.
         */
        function assertElementIsLink(element) {
            assert(element instanceof HTMLAnchorElement);
        }
        test('noLinks', () => {
            const input = 'I am a string';
            const expectedOutput = '<span>I am a string</span>';
            const output = linkDetector.linkify(input);
            assert.strictEqual(0, output.children.length);
            assert.strictEqual('SPAN', output.tagName);
            assert.strictEqual(expectedOutput, output.outerHTML);
        });
        test('trailingNewline', () => {
            const input = 'I am a string\n';
            const expectedOutput = '<span>I am a string\n</span>';
            const output = linkDetector.linkify(input);
            assert.strictEqual(0, output.children.length);
            assert.strictEqual('SPAN', output.tagName);
            assert.strictEqual(expectedOutput, output.outerHTML);
        });
        test('trailingNewlineSplit', () => {
            const input = 'I am a string\n';
            const expectedOutput = '<span>I am a string\n</span>';
            const output = linkDetector.linkify(input, true);
            assert.strictEqual(0, output.children.length);
            assert.strictEqual('SPAN', output.tagName);
            assert.strictEqual(expectedOutput, output.outerHTML);
        });
        test('singleLineLink', () => {
            const input = platform_1.isWindows ? 'C:\\foo\\bar.js:12:34' : '/Users/foo/bar.js:12:34';
            const expectedOutput = platform_1.isWindows ? '<span><a tabindex="0">C:\\foo\\bar.js:12:34<\/a><\/span>' : '<span><a tabindex="0">/Users/foo/bar.js:12:34<\/a><\/span>';
            const output = linkDetector.linkify(input);
            assert.strictEqual(1, output.children.length);
            assert.strictEqual('SPAN', output.tagName);
            assert.strictEqual('A', output.firstElementChild.tagName);
            assert.strictEqual(expectedOutput, output.outerHTML);
            assertElementIsLink(output.firstElementChild);
            assert.strictEqual(platform_1.isWindows ? 'C:\\foo\\bar.js:12:34' : '/Users/foo/bar.js:12:34', output.firstElementChild.textContent);
        });
        test('relativeLink', () => {
            const input = '\./foo/bar.js';
            const expectedOutput = '<span>\./foo/bar.js</span>';
            const output = linkDetector.linkify(input);
            assert.strictEqual(0, output.children.length);
            assert.strictEqual('SPAN', output.tagName);
            assert.strictEqual(expectedOutput, output.outerHTML);
        });
        test('relativeLinkWithWorkspace', async () => {
            const input = '\./foo/bar.js';
            const output = linkDetector.linkify(input, false, new workspace_1.WorkspaceFolder({ uri: uri_1.URI.file('/path/to/workspace'), name: 'ws', index: 0 }));
            assert.strictEqual('SPAN', output.tagName);
            assert.ok(output.outerHTML.indexOf('link') >= 0);
        });
        test('singleLineLinkAndText', function () {
            const input = platform_1.isWindows ? 'The link: C:/foo/bar.js:12:34' : 'The link: /Users/foo/bar.js:12:34';
            const expectedOutput = /^<span>The link: <a tabindex="0">.*\/foo\/bar.js:12:34<\/a><\/span>$/;
            const output = linkDetector.linkify(input);
            assert.strictEqual(1, output.children.length);
            assert.strictEqual('SPAN', output.tagName);
            assert.strictEqual('A', output.children[0].tagName);
            assert(expectedOutput.test(output.outerHTML));
            assertElementIsLink(output.children[0]);
            assert.strictEqual(platform_1.isWindows ? 'C:/foo/bar.js:12:34' : '/Users/foo/bar.js:12:34', output.children[0].textContent);
        });
        test('singleLineMultipleLinks', () => {
            const input = platform_1.isWindows ? 'Here is a link C:/foo/bar.js:12:34 and here is another D:/boo/far.js:56:78' :
                'Here is a link /Users/foo/bar.js:12:34 and here is another /Users/boo/far.js:56:78';
            const expectedOutput = /^<span>Here is a link <a tabindex="0">.*\/foo\/bar.js:12:34<\/a> and here is another <a tabindex="0">.*\/boo\/far.js:56:78<\/a><\/span>$/;
            const output = linkDetector.linkify(input);
            assert.strictEqual(2, output.children.length);
            assert.strictEqual('SPAN', output.tagName);
            assert.strictEqual('A', output.children[0].tagName);
            assert.strictEqual('A', output.children[1].tagName);
            assert(expectedOutput.test(output.outerHTML));
            assertElementIsLink(output.children[0]);
            assertElementIsLink(output.children[1]);
            assert.strictEqual(platform_1.isWindows ? 'C:/foo/bar.js:12:34' : '/Users/foo/bar.js:12:34', output.children[0].textContent);
            assert.strictEqual(platform_1.isWindows ? 'D:/boo/far.js:56:78' : '/Users/boo/far.js:56:78', output.children[1].textContent);
        });
        test('multilineNoLinks', () => {
            const input = 'Line one\nLine two\nLine three';
            const expectedOutput = /^<span><span>Line one\n<\/span><span>Line two\n<\/span><span>Line three<\/span><\/span>$/;
            const output = linkDetector.linkify(input, true);
            assert.strictEqual(3, output.children.length);
            assert.strictEqual('SPAN', output.tagName);
            assert.strictEqual('SPAN', output.children[0].tagName);
            assert.strictEqual('SPAN', output.children[1].tagName);
            assert.strictEqual('SPAN', output.children[2].tagName);
            assert(expectedOutput.test(output.outerHTML));
        });
        test('multilineTrailingNewline', () => {
            const input = 'I am a string\nAnd I am another\n';
            const expectedOutput = '<span><span>I am a string\n<\/span><span>And I am another\n<\/span><\/span>';
            const output = linkDetector.linkify(input, true);
            assert.strictEqual(2, output.children.length);
            assert.strictEqual('SPAN', output.tagName);
            assert.strictEqual('SPAN', output.children[0].tagName);
            assert.strictEqual('SPAN', output.children[1].tagName);
            assert.strictEqual(expectedOutput, output.outerHTML);
        });
        test('multilineWithLinks', () => {
            const input = platform_1.isWindows ? 'I have a link for you\nHere it is: C:/foo/bar.js:12:34\nCool, huh?' :
                'I have a link for you\nHere it is: /Users/foo/bar.js:12:34\nCool, huh?';
            const expectedOutput = /^<span><span>I have a link for you\n<\/span><span>Here it is: <a tabindex="0">.*\/foo\/bar.js:12:34<\/a>\n<\/span><span>Cool, huh\?<\/span><\/span>$/;
            const output = linkDetector.linkify(input, true);
            assert.strictEqual(3, output.children.length);
            assert.strictEqual('SPAN', output.tagName);
            assert.strictEqual('SPAN', output.children[0].tagName);
            assert.strictEqual('SPAN', output.children[1].tagName);
            assert.strictEqual('SPAN', output.children[2].tagName);
            assert.strictEqual('A', output.children[1].children[0].tagName);
            assert(expectedOutput.test(output.outerHTML));
            assertElementIsLink(output.children[1].children[0]);
            assert.strictEqual(platform_1.isWindows ? 'C:/foo/bar.js:12:34' : '/Users/foo/bar.js:12:34', output.children[1].children[0].textContent);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua0RldGVjdG9yLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL3Rlc3QvYnJvd3Nlci9saW5rRGV0ZWN0b3IudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBRW5DLE1BQU0sV0FBVyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUM5RCxJQUFJLFlBQTBCLENBQUM7UUFFL0I7O1dBRUc7UUFDSCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsTUFBTSxvQkFBb0IsR0FBdUQsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDdkksb0JBQW9CLENBQUMsSUFBSSxDQUFDLHVCQUFjLEVBQUUsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUN0RSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUFZLENBQUMsQ0FBQztRQUNsRSxDQUFDLENBQUMsQ0FBQztRQUVIOzs7O1dBSUc7UUFDSCxTQUFTLG1CQUFtQixDQUFDLE9BQWdCO1lBQzVDLE1BQU0sQ0FBQyxPQUFPLFlBQVksaUJBQWlCLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7WUFDcEIsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDO1lBQzlCLE1BQU0sY0FBYyxHQUFHLDRCQUE0QixDQUFDO1lBQ3BELE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtZQUM1QixNQUFNLEtBQUssR0FBRyxpQkFBaUIsQ0FBQztZQUNoQyxNQUFNLGNBQWMsR0FBRyw4QkFBOEIsQ0FBQztZQUN0RCxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7WUFDakMsTUFBTSxLQUFLLEdBQUcsaUJBQWlCLENBQUM7WUFDaEMsTUFBTSxjQUFjLEdBQUcsOEJBQThCLENBQUM7WUFDdEQsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtZQUMzQixNQUFNLEtBQUssR0FBRyxvQkFBUyxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMseUJBQXlCLENBQUM7WUFDOUUsTUFBTSxjQUFjLEdBQUcsb0JBQVMsQ0FBQyxDQUFDLENBQUMsMERBQTBELENBQUMsQ0FBQyxDQUFDLDREQUE0RCxDQUFDO1lBQzdKLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLGlCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyRCxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsaUJBQWtCLENBQUMsQ0FBQztZQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFTLENBQUMsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyx5QkFBeUIsRUFBRSxNQUFNLENBQUMsaUJBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDNUgsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtZQUN6QixNQUFNLEtBQUssR0FBRyxlQUFlLENBQUM7WUFDOUIsTUFBTSxjQUFjLEdBQUcsNEJBQTRCLENBQUM7WUFDcEQsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUUzQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDNUMsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDO1lBQzlCLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLDJCQUFlLENBQUMsRUFBRSxHQUFHLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0SSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1QkFBdUIsRUFBRTtZQUM3QixNQUFNLEtBQUssR0FBRyxvQkFBUyxDQUFDLENBQUMsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsbUNBQW1DLENBQUM7WUFDaEcsTUFBTSxjQUFjLEdBQUcsc0VBQXNFLENBQUM7WUFDOUYsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUUzQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzlDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLG9CQUFTLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyx5QkFBeUIsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ25ILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtZQUNwQyxNQUFNLEtBQUssR0FBRyxvQkFBUyxDQUFDLENBQUMsQ0FBQyw0RUFBNEUsQ0FBQyxDQUFDO2dCQUN2RyxvRkFBb0YsQ0FBQztZQUN0RixNQUFNLGNBQWMsR0FBRywwSUFBMEksQ0FBQztZQUNsSyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUM5QyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsb0JBQVMsQ0FBQyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDbEgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBUyxDQUFDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMseUJBQXlCLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNuSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFDN0IsTUFBTSxLQUFLLEdBQUcsZ0NBQWdDLENBQUM7WUFDL0MsTUFBTSxjQUFjLEdBQUcsMEZBQTBGLENBQUM7WUFDbEgsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1lBQ3JDLE1BQU0sS0FBSyxHQUFHLG1DQUFtQyxDQUFDO1lBQ2xELE1BQU0sY0FBYyxHQUFHLDZFQUE2RSxDQUFDO1lBQ3JHLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWpELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO1lBQy9CLE1BQU0sS0FBSyxHQUFHLG9CQUFTLENBQUMsQ0FBQyxDQUFDLG9FQUFvRSxDQUFDLENBQUM7Z0JBQy9GLHdFQUF3RSxDQUFDO1lBQzFFLE1BQU0sY0FBYyxHQUFHLHNKQUFzSixDQUFDO1lBQzlLLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWpELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzlDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBUyxDQUFDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMseUJBQXlCLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDL0gsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9