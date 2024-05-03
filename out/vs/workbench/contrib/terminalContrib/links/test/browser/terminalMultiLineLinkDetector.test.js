/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/strings", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/terminalContrib/links/test/browser/linkTestUtils", "vs/base/common/async", "assert", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkResolver", "vs/platform/files/common/files", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/uri", "vs/platform/log/common/log", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminalContrib/links/browser/terminalMultiLineLinkDetector", "vs/amdX", "vs/base/test/common/utils"], function (require, exports, platform_1, strings_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, linkTestUtils_1, async_1, assert_1, terminalLinkResolver_1, files_1, workbenchTestServices_1, uri_1, log_1, terminal_1, terminalMultiLineLinkDetector_1, amdX_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const unixLinks = [
        // Absolute
        '/foo',
        '/foo/bar',
        '/foo/[bar]',
        '/foo/[bar].baz',
        '/foo/[bar]/baz',
        '/foo/bar+more',
        // User home
        { link: '~/foo', resource: uri_1.URI.file('/home/foo') },
        // Relative
        { link: './foo', resource: uri_1.URI.file('/parent/cwd/foo') },
        { link: './$foo', resource: uri_1.URI.file('/parent/cwd/$foo') },
        { link: '../foo', resource: uri_1.URI.file('/parent/foo') },
        { link: 'foo/bar', resource: uri_1.URI.file('/parent/cwd/foo/bar') },
        { link: 'foo/bar+more', resource: uri_1.URI.file('/parent/cwd/foo/bar+more') },
    ];
    const windowsLinks = [
        // Absolute
        'c:\\foo',
        { link: '\\\\?\\C:\\foo', resource: uri_1.URI.file('C:\\foo') },
        'c:/foo',
        'c:/foo/bar',
        'c:\\foo\\bar',
        'c:\\foo\\bar+more',
        'c:\\foo/bar\\baz',
        // User home
        { link: '~\\foo', resource: uri_1.URI.file('C:\\Home\\foo') },
        { link: '~/foo', resource: uri_1.URI.file('C:\\Home\\foo') },
        // Relative
        { link: '.\\foo', resource: uri_1.URI.file('C:\\Parent\\Cwd\\foo') },
        { link: './foo', resource: uri_1.URI.file('C:\\Parent\\Cwd\\foo') },
        { link: './$foo', resource: uri_1.URI.file('C:\\Parent\\Cwd\\$foo') },
        { link: '..\\foo', resource: uri_1.URI.file('C:\\Parent\\foo') },
        { link: 'foo/bar', resource: uri_1.URI.file('C:\\Parent\\Cwd\\foo\\bar') },
        { link: 'foo/bar', resource: uri_1.URI.file('C:\\Parent\\Cwd\\foo\\bar') },
        { link: 'foo/[bar]', resource: uri_1.URI.file('C:\\Parent\\Cwd\\foo\\[bar]') },
        { link: 'foo/[bar].baz', resource: uri_1.URI.file('C:\\Parent\\Cwd\\foo\\[bar].baz') },
        { link: 'foo/[bar]/baz', resource: uri_1.URI.file('C:\\Parent\\Cwd\\foo\\[bar]/baz') },
        { link: 'foo\\bar', resource: uri_1.URI.file('C:\\Parent\\Cwd\\foo\\bar') },
        { link: 'foo\\[bar].baz', resource: uri_1.URI.file('C:\\Parent\\Cwd\\foo\\[bar].baz') },
        { link: 'foo\\[bar]\\baz', resource: uri_1.URI.file('C:\\Parent\\Cwd\\foo\\[bar]\\baz') },
        { link: 'foo\\bar+more', resource: uri_1.URI.file('C:\\Parent\\Cwd\\foo\\bar+more') },
    ];
    const supportedLinkFormats = [
        // 5: file content...                         [#181837]
        //   5:3  error                               [#181837]
        { urlFormat: '{0}\r\n{1}:foo', line: '5' },
        { urlFormat: '{0}\r\n{1}: foo', line: '5' },
        { urlFormat: '{0}\r\n5:another link\r\n{1}:{2} foo', line: '5', column: '3' },
        { urlFormat: '{0}\r\n  {1}:{2} foo', line: '5', column: '3' },
        { urlFormat: '{0}\r\n  5:6  error  another one\r\n  {1}:{2}  error', line: '5', column: '3' },
        { urlFormat: `{0}\r\n  5:6  error  ${'a'.repeat(80)}\r\n  {1}:{2}  error`, line: '5', column: '3' },
        // @@ ... <to-file-range> @@ content...       [#182878]   (tests check the entire line, so they don't include the line content at the end of the last @@)
        { urlFormat: '+++ b/{0}\r\n@@ -7,6 +{1},7 @@', line: '5' },
        { urlFormat: '+++ b/{0}\r\n@@ -1,1 +1,1 @@\r\nfoo\r\nbar\r\n@@ -7,6 +{1},7 @@', line: '5' },
    ];
    suite('Workbench - TerminalMultiLineLinkDetector', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let configurationService;
        let detector;
        let resolver;
        let xterm;
        let validResources;
        async function assertLinks(type, text, expected) {
            let to;
            const race = await Promise.race([
                (0, linkTestUtils_1.assertLinkHelper)(text, expected, detector, type).then(() => 'success'),
                (to = (0, async_1.timeout)(2)).then(() => 'timeout')
            ]);
            (0, assert_1.strictEqual)(race, 'success', `Awaiting link assertion for "${text}" timed out`);
            to.cancel();
        }
        async function assertLinksMain(link, resource) {
            const uri = resource ?? uri_1.URI.file(link);
            const lines = link.split('\r\n');
            const lastLine = lines.at(-1);
            // Count lines, accounting for wrapping
            let lineCount = 0;
            for (const line of lines) {
                lineCount += Math.max(Math.ceil(line.length / 80), 1);
            }
            await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, link, [{ uri, range: [[1, lineCount], [lastLine.length, lineCount]] }]);
        }
        setup(async () => {
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            configurationService = new testConfigurationService_1.TestConfigurationService();
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(files_1.IFileService, {
                async stat(resource) {
                    if (!validResources.map(e => e.path).includes(resource.path)) {
                        throw new Error('Doesn\'t exist');
                    }
                    return (0, workbenchTestServices_1.createFileStat)(resource);
                }
            });
            instantiationService.stub(terminal_1.ITerminalLogService, new log_1.NullLogService());
            resolver = instantiationService.createInstance(terminalLinkResolver_1.TerminalLinkResolver);
            validResources = [];
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            xterm = new TerminalCtor({ allowProposedApi: true, cols: 80, rows: 30 });
        });
        suite('macOS/Linux', () => {
            setup(() => {
                detector = instantiationService.createInstance(terminalMultiLineLinkDetector_1.TerminalMultiLineLinkDetector, xterm, {
                    initialCwd: '/parent/cwd',
                    os: 3 /* OperatingSystem.Linux */,
                    remoteAuthority: undefined,
                    userHome: '/home',
                    backend: undefined
                }, resolver);
            });
            for (const l of unixLinks) {
                const baseLink = typeof l === 'string' ? l : l.link;
                const resource = typeof l === 'string' ? uri_1.URI.file(l) : l.resource;
                suite(`Link: ${baseLink}`, () => {
                    for (let i = 0; i < supportedLinkFormats.length; i++) {
                        const linkFormat = supportedLinkFormats[i];
                        const formattedLink = (0, strings_1.format)(linkFormat.urlFormat, baseLink, linkFormat.line, linkFormat.column);
                        test(`should detect in "${escapeMultilineTestName(formattedLink)}"`, async () => {
                            validResources = [resource];
                            await assertLinksMain(formattedLink, resource);
                        });
                    }
                });
            }
        });
        // Only test these when on Windows because there is special behavior around replacing separators
        // in URI that cannot be changed
        if (platform_1.isWindows) {
            suite('Windows', () => {
                setup(() => {
                    detector = instantiationService.createInstance(terminalMultiLineLinkDetector_1.TerminalMultiLineLinkDetector, xterm, {
                        initialCwd: 'C:\\Parent\\Cwd',
                        os: 1 /* OperatingSystem.Windows */,
                        remoteAuthority: undefined,
                        userHome: 'C:\\Home',
                    }, resolver);
                });
                for (const l of windowsLinks) {
                    const baseLink = typeof l === 'string' ? l : l.link;
                    const resource = typeof l === 'string' ? uri_1.URI.file(l) : l.resource;
                    suite(`Link "${baseLink}"`, () => {
                        for (let i = 0; i < supportedLinkFormats.length; i++) {
                            const linkFormat = supportedLinkFormats[i];
                            const formattedLink = (0, strings_1.format)(linkFormat.urlFormat, baseLink, linkFormat.line, linkFormat.column);
                            test(`should detect in "${escapeMultilineTestName(formattedLink)}"`, async () => {
                                validResources = [resource];
                                await assertLinksMain(formattedLink, resource);
                            });
                        }
                    });
                }
            });
        }
    });
    function escapeMultilineTestName(text) {
        return text.replaceAll('\r\n', '\\r\\n');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxNdWx0aUxpbmVMaW5rRGV0ZWN0b3IudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2xpbmtzL3Rlc3QvYnJvd3Nlci90ZXJtaW5hbE11bHRpTGluZUxpbmtEZXRlY3Rvci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyxNQUFNLFNBQVMsR0FBaUQ7UUFDL0QsV0FBVztRQUNYLE1BQU07UUFDTixVQUFVO1FBQ1YsWUFBWTtRQUNaLGdCQUFnQjtRQUNoQixnQkFBZ0I7UUFDaEIsZUFBZTtRQUNmLFlBQVk7UUFDWixFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7UUFDbEQsV0FBVztRQUNYLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO1FBQ3hELEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO1FBQzFELEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRTtRQUNyRCxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsRUFBRTtRQUM5RCxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsRUFBRTtLQUN4RSxDQUFDO0lBRUYsTUFBTSxZQUFZLEdBQWlEO1FBQ2xF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