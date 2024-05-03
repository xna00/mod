/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils", "vs/editor/test/browser/editorTestServices", "vs/platform/theme/test/common/testThemeService"], function (require, exports, assert, platform, uri_1, utils_1, editorTestServices_1, testThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Decoration Render Options', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const themeServiceMock = new testThemeService_1.TestThemeService();
        const options = {
            gutterIconPath: uri_1.URI.parse('https://github.com/microsoft/vscode/blob/main/resources/linux/code.png'),
            gutterIconSize: 'contain',
            backgroundColor: 'red',
            borderColor: 'yellow'
        };
        test('register and resolve decoration type', () => {
            const s = store.add(new editorTestServices_1.TestCodeEditorService(themeServiceMock));
            store.add(s.registerDecorationType('test', 'example', options));
            assert.notStrictEqual(s.resolveDecorationOptions('example', false), undefined);
        });
        test('remove decoration type', () => {
            const s = store.add(new editorTestServices_1.TestCodeEditorService(themeServiceMock));
            s.registerDecorationType('test', 'example', options);
            assert.notStrictEqual(s.resolveDecorationOptions('example', false), undefined);
            s.removeDecorationType('example');
            assert.throws(() => s.resolveDecorationOptions('example', false));
        });
        function readStyleSheet(styleSheet) {
            return styleSheet.read();
        }
        test('css properties', () => {
            const s = store.add(new editorTestServices_1.TestCodeEditorService(themeServiceMock));
            const styleSheet = s.globalStyleSheet;
            store.add(s.registerDecorationType('test', 'example', options));
            const sheet = readStyleSheet(styleSheet);
            assert(sheet.indexOf(`{background:url('https://github.com/microsoft/vscode/blob/main/resources/linux/code.png') center center no-repeat;background-size:contain;}`) >= 0);
            assert(sheet.indexOf(`{background-color:red;border-color:yellow;box-sizing: border-box;}`) >= 0);
        });
        test('theme color', () => {
            const options = {
                backgroundColor: { id: 'editorBackground' },
                borderColor: { id: 'editorBorder' },
            };
            const themeService = new testThemeService_1.TestThemeService(new testThemeService_1.TestColorTheme({
                editorBackground: '#FF0000'
            }));
            const s = store.add(new editorTestServices_1.TestCodeEditorService(themeService));
            const styleSheet = s.globalStyleSheet;
            s.registerDecorationType('test', 'example', options);
            assert.strictEqual(readStyleSheet(styleSheet), '.monaco-editor .ced-example-0 {background-color:#ff0000;border-color:transparent;box-sizing: border-box;}');
            themeService.setTheme(new testThemeService_1.TestColorTheme({
                editorBackground: '#EE0000',
                editorBorder: '#00FFFF'
            }));
            assert.strictEqual(readStyleSheet(styleSheet), '.monaco-editor .ced-example-0 {background-color:#ee0000;border-color:#00ffff;box-sizing: border-box;}');
            s.removeDecorationType('example');
            assert.strictEqual(readStyleSheet(styleSheet), '');
        });
        test('theme overrides', () => {
            const options = {
                color: { id: 'editorBackground' },
                light: {
                    color: '#FF00FF'
                },
                dark: {
                    color: '#000000',
                    after: {
                        color: { id: 'infoForeground' }
                    }
                }
            };
            const themeService = new testThemeService_1.TestThemeService(new testThemeService_1.TestColorTheme({
                editorBackground: '#FF0000',
                infoForeground: '#444444'
            }));
            const s = store.add(new editorTestServices_1.TestCodeEditorService(themeService));
            const styleSheet = s.globalStyleSheet;
            s.registerDecorationType('test', 'example', options);
            const expected = [
                '.vs-dark.monaco-editor .ced-example-4::after, .hc-black.monaco-editor .ced-example-4::after {color:#444444 !important;}',
                '.vs-dark.monaco-editor .ced-example-1, .hc-black.monaco-editor .ced-example-1 {color:#000000 !important;}',
                '.vs.monaco-editor .ced-example-1, .hc-light.monaco-editor .ced-example-1 {color:#FF00FF !important;}',
                '.monaco-editor .ced-example-1 {color:#ff0000 !important;}'
            ].join('\n');
            assert.strictEqual(readStyleSheet(styleSheet), expected);
            s.removeDecorationType('example');
            assert.strictEqual(readStyleSheet(styleSheet), '');
        });
        test('css properties, gutterIconPaths', () => {
            const s = store.add(new editorTestServices_1.TestCodeEditorService(themeServiceMock));
            const styleSheet = s.globalStyleSheet;
            // URI, only minimal encoding
            s.registerDecorationType('test', 'example', { gutterIconPath: uri_1.URI.parse('data:image/svg+xml;base64,PHN2ZyB4b+') });
            assert(readStyleSheet(styleSheet).indexOf(`{background:url('data:image/svg+xml;base64,PHN2ZyB4b+') center center no-repeat;}`) > 0);
            s.removeDecorationType('example');
            function assertBackground(url1, url2) {
                const actual = readStyleSheet(styleSheet);
                assert(actual.indexOf(`{background:url('${url1}') center center no-repeat;}`) > 0
                    || actual.indexOf(`{background:url('${url2}') center center no-repeat;}`) > 0);
            }
            if (platform.isWindows) {
                // windows file path (used as string)
                s.registerDecorationType('test', 'example', { gutterIconPath: uri_1.URI.file('c:\\files\\miles\\more.png') });
                assertBackground('file:///c:/files/miles/more.png', 'vscode-file://vscode-app/c:/files/miles/more.png');
                s.removeDecorationType('example');
                // single quote must always be escaped/encoded
                s.registerDecorationType('test', 'example', { gutterIconPath: uri_1.URI.file('c:\\files\\foo\\b\'ar.png') });
                assertBackground('file:///c:/files/foo/b%27ar.png', 'vscode-file://vscode-app/c:/files/foo/b%27ar.png');
                s.removeDecorationType('example');
            }
            else {
                // unix file path (used as string)
                s.registerDecorationType('test', 'example', { gutterIconPath: uri_1.URI.file('/Users/foo/bar.png') });
                assertBackground('file:///Users/foo/bar.png', 'vscode-file://vscode-app/Users/foo/bar.png');
                s.removeDecorationType('example');
                // single quote must always be escaped/encoded
                s.registerDecorationType('test', 'example', { gutterIconPath: uri_1.URI.file('/Users/foo/b\'ar.png') });
                assertBackground('file:///Users/foo/b%27ar.png', 'vscode-file://vscode-app/Users/foo/b%27ar.png');
                s.removeDecorationType('example');
            }
            s.registerDecorationType('test', 'example', { gutterIconPath: uri_1.URI.parse('http://test/pa\'th') });
            assert(readStyleSheet(styleSheet).indexOf(`{background:url('http://test/pa%27th') center center no-repeat;}`) > 0);
            s.removeDecorationType('example');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvblJlbmRlck9wdGlvbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvYnJvd3Nlci9zZXJ2aWNlcy9kZWNvcmF0aW9uUmVuZGVyT3B0aW9ucy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7UUFDdkMsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxtQ0FBZ0IsRUFBRSxDQUFDO1FBRWhELE1BQU0sT0FBTyxHQUE2QjtZQUN6QyxjQUFjLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyx3RUFBd0UsQ0FBQztZQUNuRyxjQUFjLEVBQUUsU0FBUztZQUN6QixlQUFlLEVBQUUsS0FBSztZQUN0QixXQUFXLEVBQUUsUUFBUTtTQUNyQixDQUFDO1FBQ0YsSUFBSSxDQUFDLHNDQUFzQyxFQUFFLEdBQUcsRUFBRTtZQUNqRCxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksMENBQXFCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNoRSxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDaEYsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1lBQ25DLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFH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