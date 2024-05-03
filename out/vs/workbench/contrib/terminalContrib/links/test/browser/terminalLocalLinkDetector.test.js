/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/strings", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/terminalContrib/links/browser/terminalLocalLinkDetector", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/contrib/terminalContrib/links/test/browser/linkTestUtils", "vs/base/common/async", "assert", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkResolver", "vs/platform/files/common/files", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/uri", "vs/platform/log/common/log", "vs/platform/terminal/common/terminal", "vs/amdX", "vs/base/test/common/utils"], function (require, exports, platform_1, strings_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, terminalLocalLinkDetector_1, terminalCapabilityStore_1, linkTestUtils_1, async_1, assert_1, terminalLinkResolver_1, files_1, workbenchTestServices_1, uri_1, log_1, terminal_1, amdX_1, utils_1) {
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
        // URI file://
        { link: 'file:///foo', resource: uri_1.URI.file('/foo') },
        { link: 'file:///foo/bar', resource: uri_1.URI.file('/foo/bar') },
        { link: 'file:///foo/bar%20baz', resource: uri_1.URI.file('/foo/bar baz') },
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
        // URI file://
        { link: 'file:///c:/foo', resource: uri_1.URI.file('c:\\foo') },
        { link: 'file:///c:/foo/bar', resource: uri_1.URI.file('c:\\foo\\bar') },
        { link: 'file:///c:/foo/bar%20baz', resource: uri_1.URI.file('c:\\foo\\bar baz') },
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
        { urlFormat: '{0}' },
        { urlFormat: '{0}" on line {1}', line: '5' },
        { urlFormat: '{0}" on line {1}, column {2}', line: '5', column: '3' },
        { urlFormat: '{0}":line {1}', line: '5' },
        { urlFormat: '{0}":line {1}, column {2}', line: '5', column: '3' },
        { urlFormat: '{0}": line {1}', line: '5' },
        { urlFormat: '{0}": line {1}, col {2}', line: '5', column: '3' },
        { urlFormat: '{0}({1})', line: '5' },
        { urlFormat: '{0} ({1})', line: '5' },
        { urlFormat: '{0}({1},{2})', line: '5', column: '3' },
        { urlFormat: '{0} ({1},{2})', line: '5', column: '3' },
        { urlFormat: '{0}: ({1},{2})', line: '5', column: '3' },
        { urlFormat: '{0}({1}, {2})', line: '5', column: '3' },
        { urlFormat: '{0} ({1}, {2})', line: '5', column: '3' },
        { urlFormat: '{0}: ({1}, {2})', line: '5', column: '3' },
        { urlFormat: '{0}:{1}', line: '5' },
        { urlFormat: '{0}:{1}:{2}', line: '5', column: '3' },
        { urlFormat: '{0} {1}:{2}', line: '5', column: '3' },
        { urlFormat: '{0}[{1}]', line: '5' },
        { urlFormat: '{0} [{1}]', line: '5' },
        { urlFormat: '{0}[{1},{2}]', line: '5', column: '3' },
        { urlFormat: '{0} [{1},{2}]', line: '5', column: '3' },
        { urlFormat: '{0}: [{1},{2}]', line: '5', column: '3' },
        { urlFormat: '{0}[{1}, {2}]', line: '5', column: '3' },
        { urlFormat: '{0} [{1}, {2}]', line: '5', column: '3' },
        { urlFormat: '{0}: [{1}, {2}]', line: '5', column: '3' },
        { urlFormat: '{0}",{1}', line: '5' },
        { urlFormat: '{0}\',{1}', line: '5' },
        { urlFormat: '{0}#{1}', line: '5' },
        { urlFormat: '{0}#{1}:{2}', line: '5', column: '5' }
    ];
    const windowsFallbackLinks = [
        'C:\\foo bar',
        'C:\\foo bar\\baz',
        'C:\\foo\\bar baz',
        'C:\\foo/bar baz'
    ];
    const supportedFallbackLinkFormats = [
        // Python style error: File "<path>", line <line>
        { urlFormat: 'File "{0}"', linkCellStartOffset: 5 },
        { urlFormat: 'File "{0}", line {1}', line: '5', linkCellStartOffset: 5 },
        // Unknown tool #200166: FILE  <path>:<line>:<col>
        { urlFormat: ' FILE  {0}', linkCellStartOffset: 7 },
        { urlFormat: ' FILE  {0}:{1}', line: '5', linkCellStartOffset: 7 },
        { urlFormat: ' FILE  {0}:{1}:{2}', line: '5', column: '3', linkCellStartOffset: 7 },
        // Some C++ compile error formats
        { urlFormat: '{0}({1}) :', line: '5', linkCellEndOffset: -2 },
        { urlFormat: '{0}({1},{2}) :', line: '5', column: '3', linkCellEndOffset: -2 },
        { urlFormat: '{0}({1}, {2}) :', line: '5', column: '3', linkCellEndOffset: -2 },
        { urlFormat: '{0}({1}):', line: '5', linkCellEndOffset: -1 },
        { urlFormat: '{0}({1},{2}):', line: '5', column: '3', linkCellEndOffset: -1 },
        { urlFormat: '{0}({1}, {2}):', line: '5', column: '3', linkCellEndOffset: -1 },
        { urlFormat: '{0}:{1} :', line: '5', linkCellEndOffset: -2 },
        { urlFormat: '{0}:{1}:{2} :', line: '5', column: '3', linkCellEndOffset: -2 },
        { urlFormat: '{0}:{1}:', line: '5', linkCellEndOffset: -1 },
        { urlFormat: '{0}:{1}:{2}:', line: '5', column: '3', linkCellEndOffset: -1 },
        // Cmd prompt
        { urlFormat: '{0}>', linkCellEndOffset: -1 },
        // The whole line is the path
        { urlFormat: '{0}' },
    ];
    suite('Workbench - TerminalLocalLinkDetector', () => {
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
        async function assertLinksWithWrapped(link, resource) {
            const uri = resource ?? uri_1.URI.file(link);
            await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, link, [{ uri, range: [[1, 1], [link.length, 1]] }]);
            await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, ` ${link} `, [{ uri, range: [[2, 1], [link.length + 1, 1]] }]);
            await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, `(${link})`, [{ uri, range: [[2, 1], [link.length + 1, 1]] }]);
            await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, `[${link}]`, [{ uri, range: [[2, 1], [link.length + 1, 1]] }]);
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
        suite('platform independent', () => {
            setup(() => {
                detector = instantiationService.createInstance(terminalLocalLinkDetector_1.TerminalLocalLinkDetector, xterm, store.add(new terminalCapabilityStore_1.TerminalCapabilityStore()), {
                    initialCwd: '/parent/cwd',
                    os: 3 /* OperatingSystem.Linux */,
                    remoteAuthority: undefined,
                    userHome: '/home',
                    backend: undefined
                }, resolver);
            });
            test('should support multiple link results', async () => {
                validResources = [
                    uri_1.URI.file('/parent/cwd/foo'),
                    uri_1.URI.file('/parent/cwd/bar')
                ];
                await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, './foo ./bar', [
                    { range: [[1, 1], [5, 1]], uri: uri_1.URI.file('/parent/cwd/foo') },
                    { range: [[7, 1], [11, 1]], uri: uri_1.URI.file('/parent/cwd/bar') }
                ]);
            });
            test('should support trimming extra quotes', async () => {
                validResources = [uri_1.URI.file('/parent/cwd/foo')];
                await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, '"foo"" on line 5', [
                    { range: [[1, 1], [16, 1]], uri: uri_1.URI.file('/parent/cwd/foo') }
                ]);
            });
            test('should support trimming extra square brackets', async () => {
                validResources = [uri_1.URI.file('/parent/cwd/foo')];
                await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, '"foo]" on line 5', [
                    { range: [[1, 1], [16, 1]], uri: uri_1.URI.file('/parent/cwd/foo') }
                ]);
            });
        });
        suite('macOS/Linux', () => {
            setup(() => {
                detector = instantiationService.createInstance(terminalLocalLinkDetector_1.TerminalLocalLinkDetector, xterm, store.add(new terminalCapabilityStore_1.TerminalCapabilityStore()), {
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
                        test(`should detect in "${formattedLink}"`, async () => {
                            validResources = [resource];
                            await assertLinksWithWrapped(formattedLink, resource);
                        });
                    }
                });
            }
            test('Git diff links', async () => {
                validResources = [uri_1.URI.file('/parent/cwd/foo/bar')];
                await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, `diff --git a/foo/bar b/foo/bar`, [
                    { uri: validResources[0], range: [[14, 1], [20, 1]] },
                    { uri: validResources[0], range: [[24, 1], [30, 1]] }
                ]);
                await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, `--- a/foo/bar`, [{ uri: validResources[0], range: [[7, 1], [13, 1]] }]);
                await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, `+++ b/foo/bar`, [{ uri: validResources[0], range: [[7, 1], [13, 1]] }]);
            });
        });
        // Only test these when on Windows because there is special behavior around replacing separators
        // in URI that cannot be changed
        if (platform_1.isWindows) {
            suite('Windows', () => {
                const wslUnixToWindowsPathMap = new Map();
                setup(() => {
                    detector = instantiationService.createInstance(terminalLocalLinkDetector_1.TerminalLocalLinkDetector, xterm, store.add(new terminalCapabilityStore_1.TerminalCapabilityStore()), {
                        initialCwd: 'C:\\Parent\\Cwd',
                        os: 1 /* OperatingSystem.Windows */,
                        remoteAuthority: undefined,
                        userHome: 'C:\\Home',
                        backend: {
                            async getWslPath(original, direction) {
                                if (direction === 'unix-to-win') {
                                    return wslUnixToWindowsPathMap.get(original) ?? original;
                                }
                                return original;
                            },
                        }
                    }, resolver);
                    wslUnixToWindowsPathMap.clear();
                });
                for (const l of windowsLinks) {
                    const baseLink = typeof l === 'string' ? l : l.link;
                    const resource = typeof l === 'string' ? uri_1.URI.file(l) : l.resource;
                    suite(`Link "${baseLink}"`, () => {
                        for (let i = 0; i < supportedLinkFormats.length; i++) {
                            const linkFormat = supportedLinkFormats[i];
                            const formattedLink = (0, strings_1.format)(linkFormat.urlFormat, baseLink, linkFormat.line, linkFormat.column);
                            test(`should detect in "${formattedLink}"`, async () => {
                                validResources = [resource];
                                await assertLinksWithWrapped(formattedLink, resource);
                            });
                        }
                    });
                }
                for (const l of windowsFallbackLinks) {
                    const baseLink = typeof l === 'string' ? l : l.link;
                    const resource = typeof l === 'string' ? uri_1.URI.file(l) : l.resource;
                    suite(`Fallback link "${baseLink}"`, () => {
                        for (let i = 0; i < supportedFallbackLinkFormats.length; i++) {
                            const linkFormat = supportedFallbackLinkFormats[i];
                            const formattedLink = (0, strings_1.format)(linkFormat.urlFormat, baseLink, linkFormat.line, linkFormat.column);
                            const linkCellStartOffset = linkFormat.linkCellStartOffset ?? 0;
                            const linkCellEndOffset = linkFormat.linkCellEndOffset ?? 0;
                            test(`should detect in "${formattedLink}"`, async () => {
                                validResources = [resource];
                                await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, formattedLink, [{ uri: resource, range: [[1 + linkCellStartOffset, 1], [formattedLink.length + linkCellEndOffset, 1]] }]);
                            });
                        }
                    });
                }
                test('Git diff links', async () => {
                    const resource = uri_1.URI.file('C:\\Parent\\Cwd\\foo\\bar');
                    validResources = [resource];
                    await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, `diff --git a/foo/bar b/foo/bar`, [
                        { uri: resource, range: [[14, 1], [20, 1]] },
                        { uri: resource, range: [[24, 1], [30, 1]] }
                    ]);
                    await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, `--- a/foo/bar`, [{ uri: resource, range: [[7, 1], [13, 1]] }]);
                    await assertLinks("LocalFile" /* TerminalBuiltinLinkType.LocalFile */, `+++ b/foo/bar`, [{ uri: resource, range: [[7, 1], [13, 1]] }]);
                });
                suite('WSL', () => {
                    test('Unix -> Windows /mnt/ style links', async () => {
                        wslUnixToWindowsPathMap.set('/mnt/c/foo/bar', 'C:\\foo\\bar');
                        validResources = [uri_1.URI.file('C:\\foo\\bar')];
                        await assertLinksWithWrapped('/mnt/c/foo/bar', validResources[0]);
                    });
                    test('Windows -> Unix \\\\wsl$\\ style links', async () => {
                        validResources = [uri_1.URI.file('\\\\wsl$\\Debian\\home\\foo\\bar')];
                        await assertLinksWithWrapped('\\\\wsl$\\Debian\\home\\foo\\bar');
                    });
                    test('Windows -> Unix \\\\wsl.localhost\\ style links', async () => {
                        validResources = [uri_1.URI.file('\\\\wsl.localhost\\Debian\\home\\foo\\bar')];
                        await assertLinksWithWrapped('\\\\wsl.localhost\\Debian\\home\\foo\\bar');
                    });
                });
            });
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMb2NhbExpbmtEZXRlY3Rvci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvdGVzdC9icm93c2VyL3Rlcm1pbmFsTG9jYWxMaW5rRGV0ZWN0b3IudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXVCaEcsTUFBTSxTQUFTLEdBQWlEO1FBQy9ELFdBQVc7UUFDWCxNQUFNO1FBQ04sVUFBVTtRQUNWLFlBQVk7UUFDWixnQkFBZ0I7UUFDaEIsZ0JBQWdCO1FBQ2hCLGVBQWU7UUFDZixjQUFjO1FBQ2QsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ25ELEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQzNELEVBQUUsSUFBSSxFQUFFLHVCQUF1QixFQUFFLFFBQVEsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFO1FBQ3JFLFlBQVk7UUFDWixFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7UUFDbEQsV0FBVztRQUNYLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO1FBQ3hELEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO1FBQzFELEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFR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