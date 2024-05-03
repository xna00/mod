/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/url/browser/trustedDomainsValidator", "vs/base/common/uri", "vs/workbench/contrib/url/browser/trustedDomains", "vs/base/test/common/utils"], function (require, exports, assert, trustedDomainsValidator_1, uri_1, trustedDomains_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function linkAllowedByRules(link, rules) {
        assert.ok((0, trustedDomainsValidator_1.isURLDomainTrusted)(uri_1.URI.parse(link), rules), `Link\n${link}\n should be allowed by rules\n${JSON.stringify(rules)}`);
    }
    function linkNotAllowedByRules(link, rules) {
        assert.ok(!(0, trustedDomainsValidator_1.isURLDomainTrusted)(uri_1.URI.parse(link), rules), `Link\n${link}\n should NOT be allowed by rules\n${JSON.stringify(rules)}`);
    }
    suite('GitHub remote extraction', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('All known formats', () => {
            assert.deepStrictEqual((0, trustedDomains_1.extractGitHubRemotesFromGitConfig)(`
[remote "1"]
			url = git@github.com:sshgit/vscode.git
[remote "2"]
			url = git@github.com:ssh/vscode
[remote "3"]
			url = https://github.com/httpsgit/vscode.git
[remote "4"]
			url = https://github.com/https/vscode`), [
                'https://github.com/sshgit/vscode/',
                'https://github.com/ssh/vscode/',
                'https://github.com/httpsgit/vscode/',
                'https://github.com/https/vscode/'
            ]);
        });
    });
    suite('Link protection domain matching', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('simple', () => {
            linkNotAllowedByRules('https://x.org', []);
            linkAllowedByRules('https://x.org', ['https://x.org']);
            linkAllowedByRules('https://x.org/foo', ['https://x.org']);
            linkNotAllowedByRules('https://x.org', ['http://x.org']);
            linkNotAllowedByRules('http://x.org', ['https://x.org']);
            linkNotAllowedByRules('https://www.x.org', ['https://x.org']);
            linkAllowedByRules('https://www.x.org', ['https://www.x.org', 'https://y.org']);
        });
        test('localhost', () => {
            linkAllowedByRules('https://127.0.0.1', []);
            linkAllowedByRules('https://127.0.0.1:3000', []);
            linkAllowedByRules('https://localhost', []);
            linkAllowedByRules('https://localhost:3000', []);
        });
        test('* star', () => {
            linkAllowedByRules('https://a.x.org', ['https://*.x.org']);
            linkAllowedByRules('https://a.b.x.org', ['https://*.x.org']);
        });
        test('no scheme', () => {
            linkAllowedByRules('https://a.x.org', ['a.x.org']);
            linkAllowedByRules('https://a.x.org', ['*.x.org']);
            linkAllowedByRules('https://a.b.x.org', ['*.x.org']);
            linkAllowedByRules('https://x.org', ['*.x.org']);
        });
        test('sub paths', () => {
            linkAllowedByRules('https://x.org/foo', ['https://x.org/foo']);
            linkAllowedByRules('https://x.org/foo/bar', ['https://x.org/foo']);
            linkAllowedByRules('https://x.org/foo', ['https://x.org/foo/']);
            linkAllowedByRules('https://x.org/foo/bar', ['https://x.org/foo/']);
            linkAllowedByRules('https://x.org/foo', ['x.org/foo']);
            linkAllowedByRules('https://x.org/foo', ['*.org/foo']);
            linkNotAllowedByRules('https://x.org/bar', ['https://x.org/foo']);
            linkNotAllowedByRules('https://x.org/bar', ['x.org/foo']);
            linkNotAllowedByRules('https://x.org/bar', ['*.org/foo']);
            linkAllowedByRules('https://x.org/foo/bar', ['https://x.org/foo']);
            linkNotAllowedByRules('https://x.org/foo2', ['https://x.org/foo']);
            linkNotAllowedByRules('https://www.x.org/foo', ['https://x.org/foo']);
            linkNotAllowedByRules('https://a.x.org/bar', ['https://*.x.org/foo']);
            linkNotAllowedByRules('https://a.b.x.org/bar', ['https://*.x.org/foo']);
            linkAllowedByRules('https://github.com', ['https://github.com/foo/bar', 'https://github.com']);
        });
        test('ports', () => {
            linkNotAllowedByRules('https://x.org:8080/foo/bar', ['https://x.org:8081/foo']);
            linkAllowedByRules('https://x.org:8080/foo/bar', ['https://x.org:*/foo']);
            linkAllowedByRules('https://x.org/foo/bar', ['https://x.org:*/foo']);
            linkAllowedByRules('https://x.org:8080/foo/bar', ['https://x.org:8080/foo']);
        });
        test('ip addresses', () => {
            linkAllowedByRules('http://192.168.1.7/', ['http://192.168.1.7/']);
            linkAllowedByRules('http://192.168.1.7/', ['http://192.168.1.7']);
            linkAllowedByRules('http://192.168.1.7/', ['http://192.168.1.*']);
            linkNotAllowedByRules('http://192.168.1.7:3000/', ['http://192.168.*.6:*']);
            linkAllowedByRules('http://192.168.1.7:3000/', ['http://192.168.1.7:3000/']);
            linkAllowedByRules('http://192.168.1.7:3000/', ['http://192.168.1.7:*']);
            linkAllowedByRules('http://192.168.1.7:3000/', ['http://192.168.1.*:*']);
            linkNotAllowedByRules('http://192.168.1.7:3000/', ['http://192.168.*.6:*']);
        });
        test('scheme match', () => {
            linkAllowedByRules('http://192.168.1.7/', ['http://*']);
            linkAllowedByRules('http://twitter.com', ['http://*']);
            linkAllowedByRules('http://twitter.com/hello', ['http://*']);
            linkNotAllowedByRules('https://192.168.1.7/', ['http://*']);
            linkNotAllowedByRules('https://twitter.com/', ['http://*']);
        });
        test('case normalization', () => {
            // https://github.com/microsoft/vscode/issues/99294
            linkAllowedByRules('https://github.com/microsoft/vscode/issues/new', ['https://github.com/microsoft']);
            linkAllowedByRules('https://github.com/microsoft/vscode/issues/new', ['https://github.com/microsoft']);
        });
        test('ignore query & fragment - https://github.com/microsoft/vscode/issues/156839', () => {
            linkAllowedByRules('https://github.com/login/oauth/authorize?foo=4', ['https://github.com/login/oauth/authorize']);
            linkAllowedByRules('https://github.com/login/oauth/authorize#foo', ['https://github.com/login/oauth/authorize']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1c3RlZERvbWFpbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXJsL3Rlc3QvYnJvd3Nlci90cnVzdGVkRG9tYWlucy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLFNBQVMsa0JBQWtCLENBQUMsSUFBWSxFQUFFLEtBQWU7UUFDeEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLDRDQUFrQixFQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsU0FBUyxJQUFJLGtDQUFrQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMvSCxDQUFDO0lBQ0QsU0FBUyxxQkFBcUIsQ0FBQyxJQUFZLEVBQUUsS0FBZTtRQUMzRCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBQSw0Q0FBa0IsRUFBQyxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLFNBQVMsSUFBSSxzQ0FBc0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDcEksQ0FBQztJQUVELEtBQUssQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7UUFDdEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7WUFDOUIsTUFBTSxDQUFDLGVBQWUsQ0FDckIsSUFBQSxrREFBaUMsRUFDaEM7Ozs7Ozs7O3lDQVFxQyxDQUFDLEVBQ3ZDO2dCQUNDLG1DQUFtQztnQkFDbkMsZ0NBQWdDO2dCQUNoQyxxQ0FBcUM7Z0JBQ3JDLGtDQUFrQzthQUNsQyxDQUFDLENBQUM7UUFDTCxDQUFDLENB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