/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/network", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkOpeners", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchService", "vs/platform/terminal/common/terminal", "vs/amdX", "vs/base/test/common/utils", "vs/platform/terminal/common/capabilities/commandDetection/terminalCommand"], function (require, exports, assert_1, network_1, uri_1, files_1, fileService_1, instantiationServiceMock_1, log_1, quickInput_1, workspace_1, commandDetectionCapability_1, terminalLinkOpeners_1, terminalCapabilityStore_1, editorService_1, environmentService_1, workbenchTestServices_1, search_1, searchService_1, terminal_1, amdX_1, utils_1, terminalCommand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestCommandDetectionCapability extends commandDetectionCapability_1.CommandDetectionCapability {
        setCommands(commands) {
            this._commands = commands;
        }
    }
    class TestFileService extends fileService_1.FileService {
        constructor() {
            super(...arguments);
            this._files = '*';
        }
        async stat(resource) {
            if (this._files === '*' || this._files.some(e => e.toString() === resource.toString())) {
                return { isFile: true, isDirectory: false, isSymbolicLink: false };
            }
            throw new Error('ENOENT');
        }
        setFiles(files) {
            this._files = files;
        }
    }
    class TestSearchService extends searchService_1.SearchService {
        async fileSearch(query) {
            return this._searchResult;
        }
        setSearchResult(result) {
            this._searchResult = result;
        }
    }
    class TestTerminalSearchLinkOpener extends terminalLinkOpeners_1.TerminalSearchLinkOpener {
        setFileQueryBuilder(value) {
            this._fileQueryBuilder = value;
        }
    }
    suite('Workbench - TerminalLinkOpeners', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let fileService;
        let searchService;
        let activationResult;
        let xterm;
        setup(async () => {
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            fileService = store.add(new TestFileService(new log_1.NullLogService()));
            searchService = store.add(new TestSearchService(null, null, null, null, null, null, null));
            instantiationService.set(files_1.IFileService, fileService);
            instantiationService.set(log_1.ILogService, new log_1.NullLogService());
            instantiationService.set(search_1.ISearchService, searchService);
            instantiationService.set(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
            instantiationService.stub(terminal_1.ITerminalLogService, new log_1.NullLogService());
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, {
                remoteAuthority: undefined
            });
            // Allow intercepting link activations
            activationResult = undefined;
            instantiationService.stub(quickInput_1.IQuickInputService, {
                quickAccess: {
                    show(link) {
                        activationResult = { link, source: 'search' };
                    }
                }
            });
            instantiationService.stub(editorService_1.IEditorService, {
                async openEditor(editor) {
                    activationResult = {
                        source: 'editor',
                        link: editor.resource?.toString()
                    };
                    // Only assert on selection if it's not the default value
                    if (editor.options?.selection && (editor.options.selection.startColumn !== 1 || editor.options.selection.startLineNumber !== 1)) {
                        activationResult.selection = editor.options.selection;
                    }
                }
            });
            const TerminalCtor = (await (0, amdX_1.importAMDNodeModule)('@xterm/xterm', 'lib/xterm.js')).Terminal;
            xterm = store.add(new TerminalCtor({ allowProposedApi: true }));
        });
        suite('TerminalSearchLinkOpener', () => {
            let opener;
            let capabilities;
            let commandDetection;
            let localFileOpener;
            setup(() => {
                capabilities = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
                commandDetection = store.add(instantiationService.createInstance(TestCommandDetectionCapability, xterm));
                capabilities.add(2 /* TerminalCapability.CommandDetection */, commandDetection);
            });
            test('should open single exact match against cwd when searching if it exists when command detection cwd is available', async () => {
                localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/initial/cwd', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                // Set a fake detected command starting as line 0 to establish the cwd
                commandDetection.setCommands([new terminalCommand_1.TerminalCommand(xterm, {
                        command: '',
                        exitCode: 0,
                        commandStartLineContent: '',
                        markProperties: {},
                        isTrusted: true,
                        cwd: '/initial/cwd',
                        timestamp: 0,
                        duration: 0,
                        executedX: undefined,
                        startX: undefined,
                        marker: {
                            line: 0
                        },
                    })]);
                fileService.setFiles([
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }),
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo2/bar.txt' })
                ]);
                await opener.open({
                    text: 'foo/bar.txt',
                    bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                    type: "Search" /* TerminalBuiltinLinkType.Search */
                });
                (0, assert_1.deepStrictEqual)(activationResult, {
                    link: 'file:///initial/cwd/foo/bar.txt',
                    source: 'editor'
                });
            });
            test('should open single exact match against cwd for paths containing a separator when searching if it exists, even when command detection isn\'t available', async () => {
                localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/initial/cwd', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                fileService.setFiles([
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }),
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo2/bar.txt' })
                ]);
                await opener.open({
                    text: 'foo/bar.txt',
                    bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                    type: "Search" /* TerminalBuiltinLinkType.Search */
                });
                (0, assert_1.deepStrictEqual)(activationResult, {
                    link: 'file:///initial/cwd/foo/bar.txt',
                    source: 'editor'
                });
            });
            test('should open single exact match against any folder for paths not containing a separator when there is a single search result, even when command detection isn\'t available', async () => {
                localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/initial/cwd', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                capabilities.remove(2 /* TerminalCapability.CommandDetection */);
                opener.setFileQueryBuilder({ file: () => null });
                fileService.setFiles([
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }),
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo2/baz.txt' })
                ]);
                searchService.setSearchResult({
                    messages: [],
                    results: [
                        { resource: uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }) }
                    ]
                });
                await opener.open({
                    text: 'bar.txt',
                    bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                    type: "Search" /* TerminalBuiltinLinkType.Search */
                });
                (0, assert_1.deepStrictEqual)(activationResult, {
                    link: 'file:///initial/cwd/foo/bar.txt',
                    source: 'editor'
                });
            });
            test('should open single exact match against any folder for paths not containing a separator when there are multiple search results, even when command detection isn\'t available', async () => {
                localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/initial/cwd', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                capabilities.remove(2 /* TerminalCapability.CommandDetection */);
                opener.setFileQueryBuilder({ file: () => null });
                fileService.setFiles([
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }),
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.test.txt' }),
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo2/bar.test.txt' })
                ]);
                searchService.setSearchResult({
                    messages: [],
                    results: [
                        { resource: uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }) },
                        { resource: uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.test.txt' }) },
                        { resource: uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo2/bar.test.txt' }) }
                    ]
                });
                await opener.open({
                    text: 'bar.txt',
                    bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                    type: "Search" /* TerminalBuiltinLinkType.Search */
                });
                (0, assert_1.deepStrictEqual)(activationResult, {
                    link: 'file:///initial/cwd/foo/bar.txt',
                    source: 'editor'
                });
            });
            test('should not open single exact match for paths not containing a when command detection isn\'t available', async () => {
                localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/initial/cwd', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                fileService.setFiles([
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo/bar.txt' }),
                    uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/initial/cwd/foo2/bar.txt' })
                ]);
                await opener.open({
                    text: 'bar.txt',
                    bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                    type: "Search" /* TerminalBuiltinLinkType.Search */
                });
                (0, assert_1.deepStrictEqual)(activationResult, {
                    link: 'bar.txt',
                    source: 'search'
                });
            });
            suite('macOS/Linux', () => {
                setup(() => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                });
                test('should apply the cwd to the link only when the file exists and cwdDetection is enabled', async () => {
                    const cwd = '/Users/home/folder';
                    const absoluteFile = '/Users/home/folder/file.txt';
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: absoluteFile }),
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/Users/home/folder/other/file.txt' })
                    ]);
                    // Set a fake detected command starting as line 0 to establish the cwd
                    commandDetection.setCommands([new terminalCommand_1.TerminalCommand(xterm, {
                            command: '',
                            isTrusted: true,
                            cwd,
                            timestamp: 0,
                            duration: 0,
                            executedX: undefined,
                            startX: undefined,
                            marker: {
                                line: 0
                            },
                            exitCode: 0,
                            commandStartLineContent: '',
                            markProperties: {}
                        })]);
                    await opener.open({
                        text: 'file.txt',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///Users/home/folder/file.txt',
                        source: 'editor'
                    });
                    // Clear detected commands and ensure the same request results in a search since there are 2 matches
                    commandDetection.setCommands([]);
                    opener.setFileQueryBuilder({ file: () => null });
                    searchService.setSearchResult({
                        messages: [],
                        results: [
                            { resource: uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'file:///Users/home/folder/file.txt' }) },
                            { resource: uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'file:///Users/home/folder/other/file.txt' }) }
                        ]
                    });
                    await opener.open({
                        text: 'file.txt',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file.txt',
                        source: 'search'
                    });
                });
                test('should extract column and/or line numbers from links in a workspace containing spaces', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/space folder', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/space folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt:10:5',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///space%20folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///space%20folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                test('should extract column and/or line numbers from links and remove trailing periods', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/folder', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                    });
                    await opener.open({
                        text: './foo/bar.txt:10:5.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                test('should extract column and/or line numbers from links and remove grepped lines', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/folder', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt:10:5:import { ILoveVSCode } from \'./foo/bar.ts\';',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10:import { ILoveVSCode } from \'./foo/bar.ts\';',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                // Test for https://github.com/microsoft/vscode/pull/200919#discussion_r1428124196
                test('should extract column and/or line numbers from links and remove grepped lines incl singular spaces', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/folder', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt:10:5: ',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10: ',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                test('should extract line numbers from links and remove ruby stack traces', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '/folder', localFileOpener, localFolderOpener, () => 3 /* OperatingSystem.Linux */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/folder/foo/bar.rb' })
                    ]);
                    await opener.open({
                        text: './foo/bar.rb:30:in `<main>`',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///folder/foo/bar.rb',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 30,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
            });
            suite('Windows', () => {
                setup(() => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, '', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                });
                test('should apply the cwd to the link only when the file exists and cwdDetection is enabled', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, 'c:\\Users', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                    const cwd = 'c:\\Users\\home\\folder';
                    const absoluteFile = 'c:\\Users\\home\\folder\\file.txt';
                    fileService.setFiles([
                        uri_1.URI.file('/c:/Users/home/folder/file.txt')
                    ]);
                    // Set a fake detected command starting as line 0 to establish the cwd
                    commandDetection.setCommands([new terminalCommand_1.TerminalCommand(xterm, {
                            exitCode: 0,
                            commandStartLineContent: '',
                            markProperties: {},
                            command: '',
                            isTrusted: true,
                            cwd,
                            executedX: undefined,
                            startX: undefined,
                            timestamp: 0,
                            duration: 0,
                            marker: {
                                line: 0
                            },
                        })]);
                    await opener.open({
                        text: 'file.txt',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/Users/home/folder/file.txt',
                        source: 'editor'
                    });
                    // Clear detected commands and ensure the same request results in a search
                    commandDetection.setCommands([]);
                    opener.setFileQueryBuilder({ file: () => null });
                    searchService.setSearchResult({
                        messages: [],
                        results: [
                            { resource: uri_1.URI.file(absoluteFile) },
                            { resource: uri_1.URI.file('/c:/Users/home/folder/other/file.txt') }
                        ]
                    });
                    await opener.open({
                        text: 'file.txt',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file.txt',
                        source: 'search'
                    });
                });
                test('should extract column and/or line numbers from links in a workspace containing spaces', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, 'c:/space folder', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'c:/space folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt:10:5',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/space%20folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/space%20folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:10:5',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/space%20folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:10',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/space%20folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                test('should extract column and/or line numbers from links and remove trailing periods', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, 'c:/folder', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'c:/folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                    });
                    await opener.open({
                        text: './foo/bar.txt:10:5.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:2:5.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 2,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:2.',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 2,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                test('should extract column and/or line numbers from links and remove grepped lines', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, 'c:/folder', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'c:/folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt:10:5:import { ILoveVSCode } from \'./foo/bar.ts\';',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10:import { ILoveVSCode } from \'./foo/bar.ts\';',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:10:5:import { ILoveVSCode } from \'./foo/bar.ts\';',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:10:import { ILoveVSCode } from \'./foo/bar.ts\';',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                // Test for https://github.com/microsoft/vscode/pull/200919#discussion_r1428124196
                test('should extract column and/or line numbers from links and remove grepped lines incl singular spaces', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, 'c:/folder', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'c:/folder/foo/bar.txt' })
                    ]);
                    await opener.open({
                        text: './foo/bar.txt:10:5: ',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: './foo/bar.txt:10: ',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:10:5: ',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 5,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.txt:10: ',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.txt',
                        source: 'editor',
                        selection: {
                            startColumn: 1,
                            startLineNumber: 10,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
                test('should extract line numbers from links and remove ruby stack traces', async () => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(TestTerminalSearchLinkOpener, capabilities, 'c:/folder', localFileOpener, localFolderOpener, () => 1 /* OperatingSystem.Windows */);
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'c:/folder/foo/bar.rb' })
                    ]);
                    await opener.open({
                        text: './foo/bar.rb:30:in `<main>`',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.rb',
                        source: 'editor',
                        selection: {
                            startColumn: 1, // Since Ruby doesn't appear to put columns in stack traces, this should be 1
                            startLineNumber: 30,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                    await opener.open({
                        text: '.\\foo\\bar.rb:30:in `<main>`',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: "Search" /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A/folder/foo/bar.rb',
                        source: 'editor',
                        selection: {
                            startColumn: 1, // Since Ruby doesn't appear to put columns in stack traces, this should be 1
                            startLineNumber: 30,
                            endColumn: undefined,
                            endLineNumber: undefined
                        },
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rT3BlbmVycy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvdGVzdC9icm93c2VyL3Rlcm1pbmFsTGlua09wZW5lcnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW1DaEcsTUFBTSw4QkFBK0IsU0FBUSx1REFBMEI7UUFDdEUsV0FBVyxDQUFDLFFBQTJCO1lBQ3RDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQzNCLENBQUM7S0FDRDtJQUVELE1BQU0sZUFBZ0IsU0FBUSx5QkFBVztRQUF6Qzs7WUFDUyxXQUFNLEdBQWdCLEdBQUcsQ0FBQztRQVVuQyxDQUFDO1FBVFMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFhO1lBQ2hDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEtBQUssUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDeEYsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFrQyxDQUFDO1lBQ3BHLENBQUM7WUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNCLENBQUM7UUFDRCxRQUFRLENBQUMsS0FBa0I7WUFDMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDckIsQ0FBQztLQUNEO0lBRUQsTUFBTSxpQkFBa0IsU0FBUSw2QkFBYTtRQUVuQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQWlCO1lBQzFD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