/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/themes/common/colorThemeData", "assert", "vs/platform/theme/common/tokenClassificationRegistry", "vs/base/common/color", "vs/base/common/types", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/network", "vs/platform/extensionResourceLoader/common/extensionResourceLoaderService", "vs/workbench/test/common/workbenchTestServices", "vs/base/test/common/utils"], function (require, exports, colorThemeData_1, assert, tokenClassificationRegistry_1, color_1, types_1, fileService_1, log_1, diskFileSystemProvider_1, network_1, extensionResourceLoaderService_1, workbenchTestServices_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const undefinedStyle = { bold: undefined, underline: undefined, italic: undefined };
    const unsetStyle = { bold: false, underline: false, italic: false };
    function ts(foreground, styleFlags) {
        const foregroundColor = (0, types_1.isString)(foreground) ? color_1.Color.fromHex(foreground) : undefined;
        return new tokenClassificationRegistry_1.TokenStyle(foregroundColor, styleFlags?.bold, styleFlags?.underline, styleFlags?.strikethrough, styleFlags?.italic);
    }
    function tokenStyleAsString(ts) {
        if (!ts) {
            return 'tokenstyle-undefined';
        }
        let str = ts.foreground ? ts.foreground.toString() : 'no-foreground';
        if (ts.bold !== undefined) {
            str += ts.bold ? '+B' : '-B';
        }
        if (ts.underline !== undefined) {
            str += ts.underline ? '+U' : '-U';
        }
        if (ts.italic !== undefined) {
            str += ts.italic ? '+I' : '-I';
        }
        return str;
    }
    function assertTokenStyle(actual, expected, message) {
        assert.strictEqual(tokenStyleAsString(actual), tokenStyleAsString(expected), message);
    }
    function assertTokenStyleMetaData(colorIndex, actual, expected, message = '') {
        if (expected === undefined || expected === null || actual === undefined) {
            assert.strictEqual(actual, expected, message);
            return;
        }
        assert.strictEqual(actual.bold, expected.bold, 'bold ' + message);
        assert.strictEqual(actual.italic, expected.italic, 'italic ' + message);
        assert.strictEqual(actual.underline, expected.underline, 'underline ' + message);
        const actualForegroundIndex = actual.foreground;
        if (actualForegroundIndex && expected.foreground) {
            assert.strictEqual(colorIndex[actualForegroundIndex], color_1.Color.Format.CSS.formatHexA(expected.foreground, true).toUpperCase(), 'foreground ' + message);
        }
        else {
            assert.strictEqual(actualForegroundIndex, expected.foreground || 0, 'foreground ' + message);
        }
    }
    function assertTokenStyles(themeData, expected, language = 'typescript') {
        const colorIndex = themeData.tokenColorMap;
        for (const qualifiedClassifier in expected) {
            const [type, ...modifiers] = qualifiedClassifier.split('.');
            const expectedTokenStyle = expected[qualifiedClassifier];
            const tokenStyleMetaData = themeData.getTokenStyleMetadata(type, modifiers, language);
            assertTokenStyleMetaData(colorIndex, tokenStyleMetaData, expectedTokenStyle, qualifiedClassifier);
        }
    }
    suite('Themes - TokenStyleResolving', () => {
        const fileService = new fileService_1.FileService(new log_1.NullLogService());
        const requestService = new ((0, workbenchTestServices_1.mock)())();
        const storageService = new ((0, workbenchTestServices_1.mock)())();
        const environmentService = new ((0, workbenchTestServices_1.mock)())();
        const configurationService = new ((0, workbenchTestServices_1.mock)())();
        const extensionResourceLoaderService = new extensionResourceLoaderService_1.ExtensionResourceLoaderService(fileService, storageService, workbenchTestServices_1.TestProductService, environmentService, configurationService, requestService);
        const diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(new log_1.NullLogService());
        fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
        teardown(() => {
            diskFileSystemProvider.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('color defaults', async () => {
            const themeData = colorThemeData_1.ColorThemeData.createUnloadedTheme('foo');
            themeData.location = network_1.FileAccess.asFileUri('vs/workbench/services/themes/test/node/color-theme.json');
            await themeData.ensureLoaded(extensionResourceLoaderService);
            assert.strictEqual(themeData.isLoaded, true);
            assertTokenStyles(themeData, {
                'comment': ts('#000000', undefinedStyle),
                'variable': ts('#111111', unsetStyle),
                'type': ts('#333333', { bold: false, underline: true, italic: false }),
                'function': ts('#333333', unsetStyle),
                'string': ts('#444444', undefinedStyle),
                'number': ts('#555555', undefinedStyle),
                'keyword': ts('#666666', undefinedStyle)
            });
        });
        test('resolveScopes', async () => {
            const themeData = colorThemeData_1.ColorThemeData.createLoadedEmptyTheme('test', 'test');
            const customTokenColors = {
                textMateRules: [
                    {
                        scope: 'variable',
                        settings: {
                            fontStyle: '',
                            foreground: '#F8F8F2'
                        }
                    },
                    {
                        scope: 'keyword.operator',
                        settings: {
                            fontStyle: 'italic bold underline',
                            foreground: '#F92672'
                        }
                    },
                    {
                        scope: 'storage',
                        settings: {
                            fontStyle: 'italic',
                            foreground: '#F92672'
                        }
                    },
                    {
                        scope: ['storage.type', 'meta.structure.dictionary.json string.quoted.double.json'],
                        settings: {
                            foreground: '#66D9EF'
                        }
                    },
                    {
                        scope: 'entity.name.type, entity.name.class, entity.name.namespace, entity.name.scope-resolution',
                        settings: {
                            fontStyle: 'underline',
                            foreground: '#A6E22E'
                        }
                    },
                ]
            };
            themeData.setCustomTokenColors(customTokenColors);
            let tokenStyle;
            const defaultTokenStyle = undefined;
            tokenStyle = themeData.resolveScopes([['variable']]);
            assertTokenStyle(tokenStyle, ts('#F8F8F2', unsetStyle), 'variable');
            tokenStyle = themeData.resolveScopes([['keyword.operator']]);
            assertTokenStyle(tokenStyle, ts('#F92672', { italic: true, bold: true, underline: true }), 'keyword');
            tokenStyle = themeData.resolveScopes([['keyword']]);
            assertTokenStyle(tokenStyle, defaultTokenStyle, 'keyword');
            tokenStyle = themeData.resolveScopes([['keyword.operator']]);
            assertTokenStyle(tokenStyle, ts('#F92672', { italic: true, bold: true, underline: true }), 'keyword.operator');
            tokenStyle = themeData.resolveScopes([['keyword.operators']]);
            assertTokenStyle(tokenStyle, defaultTokenStyle, 'keyword.operators');
            tokenStyle = themeData.resolveScopes([['storage']]);
            assertTokenStyle(tokenStyle, ts('#F92672', { italic: true, bold: false, underline: false }), 'storage');
            tokenStyle = themeData.resolveScopes([['storage.type']]);
            assertTokenStyle(tokenStyle, ts('#66D9EF', { italic: true, bold: false, underline: false }), 'storage.type');
            tokenStyle = themeData.resolveScopes([['entity.name.class']]);
            assertTokenStyle(tokenStyle, ts('#A6E22E', { italic: false, bold: false, underline: true }), 'entity.name.class');
            tokenStyle = themeData.resolveScopes([['meta.structure.dictionary.json', 'string.quoted.double.json']]);
            assertTokenStyle(tokenStyle, ts('#66D9EF', undefined), 'json property');
            tokenStyle = themeData.resolveScopes([['keyword'], ['storage.type'], ['entity.name.class']]);
            assertTokenStyle(tokenStyle, ts('#66D9EF', { italic: true, bold: false, underline: false }), 'storage.type');
        });
        test('resolveScopes - match most specific', async () => {
            const themeData = colorThemeData_1.ColorThemeData.createLoadedEmptyTheme('test', 'test');
            const customTokenColors = {
                textMateRules: [
                    {
                        scope: 'entity.name.type',
                        settings: {
                            fontStyle: 'underline',
                            foreground: '#A6E22E'
                        }
                    },
                    {
                        scope: 'entity.name.type.class',
                        settings: {
                            foreground: '#FF00FF'
                        }
                    },
                    {
                        scope: 'entity.name',
                        settings: {
                            foreground: '#FFFFFF'
                        }
                    },
                ]
            };
            themeData.setCustomTokenColors(customTokenColors);
            const tokenStyle = themeData.resolveScopes([['entity.name.type.class']]);
            assertTokenStyle(tokenStyle, ts('#FF00FF', { italic: false, bold: false, underline: true }), 'entity.name.type.class');
        });
        test('rule matching', async () => {
            const themeData = colorThemeData_1.ColorThemeData.createLoadedEmptyTheme('test', 'test');
            themeData.setCustomColors({ 'editor.foreground': '#000000' });
            themeData.setCustomSemanticTokenColors({
                enabled: true,
                rules: {
                    'type': '#ff0000',
                    'class': { foreground: '#0000ff', italic: true },
                    '*.static': { bold: true },
                    '*.declaration': { italic: true },
                    '*.async.static': { italic: true, underline: true },
                    '*.async': { foreground: '#000fff', underline: true }
                }
            });
            assertTokenStyles(themeData, {
                'type': ts('#ff0000', undefinedStyle),
                'type.static': ts('#ff0000', { bold: true }),
                'type.static.declaration': ts('#ff0000', { bold: true, italic: true }),
                'class': ts('#0000ff', { italic: true }),
                'class.static.declaration': ts('#0000ff', { bold: true, italic: true, }),
                'class.declaration': ts('#0000ff', { italic: true }),
                'class.declaration.async': ts('#000fff', { underline: true, italic: true }),
                'class.declaration.async.static': ts('#000fff', { italic: true, underline: true, bold: true }),
            });
        });
        test('super type', async () => {
            const registry = (0, tokenClassificationRegistry_1.getTokenClassificationRegistry)();
            registry.registerTokenType('myTestInterface', 'A type just for testing', 'interface');
            registry.registerTokenType('myTestSubInterface', 'A type just for testing', 'myTestInterface');
            try {
                const themeData = colorThemeData_1.ColorThemeData.createLoadedEmptyTheme('test', 'test');
                themeData.setCustomColors({ 'editor.foreground': '#000000' });
                themeData.setCustomSemanticTokenColors({
                    enabled: true,
                    rules: {
                        'interface': '#ff0000',
                        'myTestInterface': { italic: true },
                        'interface.static': { bold: true }
                    }
                });
                assertTokenStyles(themeData, { 'myTestSubInterface': ts('#ff0000', { italic: true }) });
                assertTokenStyles(themeData, { 'myTestSubInterface.static': ts('#ff0000', { italic: true, bold: true }) });
                themeData.setCustomSemanticTokenColors({
                    enabled: true,
                    rules: {
                        'interface': '#ff0000',
                        'myTestInterface': { foreground: '#ff00ff', italic: true }
                    }
                });
                assertTokenStyles(themeData, { 'myTestSubInterface': ts('#ff00ff', { italic: true }) });
            }
            finally {
                registry.deregisterTokenType('myTestInterface');
                registry.deregisterTokenType('myTestSubInterface');
            }
        });
        test('language', async () => {
            try {
                const themeData = colorThemeData_1.ColorThemeData.createLoadedEmptyTheme('test', 'test');
                themeData.setCustomColors({ 'editor.foreground': '#000000' });
                themeData.setCustomSemanticTokenColors({
                    enabled: true,
                    rules: {
                        'interface': '#fff000',
                        'interface:java': '#ff0000',
                        'interface.static': { bold: true },
                        'interface.static:typescript': { italic: true }
                    }
                });
                assertTokenStyles(themeData, { 'interface': ts('#ff0000', undefined) }, 'java');
                assertTokenStyles(themeData, { 'interface': ts('#fff000', undefined) }, 'typescript');
                assertTokenStyles(themeData, { 'interface.static': ts('#ff0000', { bold: true }) }, 'java');
                assertTokenStyles(themeData, { 'interface.static': ts('#fff000', { bold: true, italic: true }) }, 'typescript');
            }
            finally {
            }
        });
        test('language - scope resolving', async () => {
            const registry = (0, tokenClassificationRegistry_1.getTokenClassificationRegistry)();
            const numberOfDefaultRules = registry.getTokenStylingDefaultRules().length;
            registry.registerTokenStyleDefault(registry.parseTokenSelector('type', 'typescript1'), { scopesToProbe: [['entity.name.type.ts1']] });
            registry.registerTokenStyleDefault(registry.parseTokenSelector('type:javascript1'), { scopesToProbe: [['entity.name.type.js1']] });
            try {
                const themeData = colorThemeData_1.ColorThemeData.createLoadedEmptyTheme('test', 'test');
                themeData.setCustomColors({ 'editor.foreground': '#000000' });
                themeData.setCustomTokenColors({
                    textMateRules: [
                        {
                            scope: 'entity.name.type',
                            settings: { foreground: '#aa0000' }
                        },
                        {
                            scope: 'entity.name.type.ts1',
                            settings: { foreground: '#bb0000' }
                        }
                    ]
                });
                assertTokenStyles(themeData, { 'type': ts('#aa0000', undefined) }, 'javascript1');
                assertTokenStyles(themeData, { 'type': ts('#bb0000', undefined) }, 'typescript1');
            }
            finally {
                registry.deregisterTokenStyleDefault(registry.parseTokenSelector('type', 'typescript1'));
                registry.deregisterTokenStyleDefault(registry.parseTokenSelector('type:javascript1'));
                assert.strictEqual(registry.getTokenStylingDefaultRules().length, numberOfDefaultRules);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5TdHlsZVJlc29sdmluZy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGhlbWVzL3Rlc3Qvbm9kZS90b2tlblN0eWxlUmVzb2x2aW5nLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFxQmhHLE1BQU0sY0FBYyxHQUFHLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQztJQUNwRixNQUFNLFVBQVUsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFFcEUsU0FBUyxFQUFFLENBQUMsVUFBOEIsRUFBRSxVQUEwRztRQUNySixNQUFNLGVBQWUsR0FBRyxJQUFBLGdCQUFRLEVBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNyRixPQUFPLElBQUksd0NBQVUsQ0FBQyxlQUFlLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2hJLENBQUM7SUFFRCxTQUFTLGtCQUFrQixDQUFDLEVBQWlDO1FBQzVELElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNULE9BQU8sc0JBQXNCLENBQUM7UUFDL0IsQ0FBQztRQUNELElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztRQUNyRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDM0IsR0FBRyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzlCLENBQUM7UUFDRCxJQUFJLEVBQUUsQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDaEMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ25DLENBQUM7UUFDRCxJQUFJLEVBQUUsQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDN0IsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ2hDLENBQUM7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNaLENBQUM7SUFFRCxTQUFTLGdCQUFnQixDQUFDLE1BQXFDLEVBQUUsUUFBdUMsRUFBRSxPQUFnQjtRQUN6SCxNQUFNLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxFQUFFLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFFRCxTQUFTLHdCQUF3QixDQUFDLFVBQW9CLEVBQUUsTUFBK0IsRUFBRSxRQUF1QyxFQUFFLE9BQU8sR0FBRyxFQUFFO1FBQzdJLElBQUksUUFBUSxLQUFLLFNBQVMsSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN6RSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUMsT0FBTztRQUNSLENBQUM7UUFDRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUM7UUFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxHQUFHLE9BQU8sQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUyxFQUFFLFlBQVksR0FBRyxPQUFPLENBQUMsQ0FBQztRQUVqRixNQUFNLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDaEQsSUFBSSxxQkFBcUIsSUFBSSxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMscUJBQXFCLENBQUMsRUFBRSxhQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxhQUFhLEdBQUcsT0FBTyxDQUFDLENBQUM7UUFDdEosQ0FBQzthQUFNLENBQUM7WUFDUCxNQUFNLENBQUMsV0FBVyxDQUFDLHFCQUFxQixFQUFFLFFBQVEsQ0FBQyxVQUFVLElBQUksQ0FBQyxFQUFFLGFBQWEsR0FBRyxPQUFPLENBQUMsQ0FBQztRQUM5RixDQUFDO0lBQ0YsQ0FBQztJQUdELFNBQVMsaUJBQWlCLENBQUMsU0FBeUIsRUFBRSxRQUF1RCxFQUFFLFFBQVEsR0FBRyxZQUFZO1FBQ3JJLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUM7UUFFM0MsS0FBSyxNQUFNLG1CQUFtQixJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsR0FBRyxTQUFTLENBQUMsR0FBRyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFNUQsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUV6RCxNQUFNLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3RGLHdCQUF3QixDQUFDLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ25HLENBQUM7SUFDRixDQUFDO0lBRUQsS0FBSyxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtRQUMxQyxNQUFNLFdBQVcsR0FBRyxJQUFJLHlCQUFXLENBQUMsSUFBSSxvQkFBYyxFQUFFLENBQUMsQ0FBQztRQUMxRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsSUFBQSw0QkFBSSxHQUFtQixDQUFDLEVBQUUsQ0FBQztRQUN2RCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsSUFBQSw0QkFBSSxHQUFtQixDQUFDLEVBQUUsQ0FBQztRQUN2RCxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxJQUFBLDRCQUFJLEdBQXVCLENBQUMsRUFBRSxDQUFDO1FBQy9ELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLElBQUEsNEJBQUksR0FBeUIsQ0FBQyxFQUFFLENBQUM7UUFFbkUsTUFBTSw4QkFBOEIsR0FBRyxJQUFJLCtEQUE4QixDQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsMENBQWtCLEVBQUUsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFckwsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLCtDQUFzQixDQUFDLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUM7UUFDaEYsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGlCQUFPLENBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFFbkUsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2xDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNqQyxNQUFNLFNBQVMsR0FBRywrQkFBYyxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVELFNBQVMsQ0FBQyxRQUFRLEdBQUcsb0JBQVUsQ0FBQyxTQUFTLENBQUMseURBQXlELENBQUMsQ0FBQztZQUNyRyxNQUFNLFNBQVMsQ0FBQyxZQUFZLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUU3RCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFN0MsaUJBQWlCLENBQUMsU0FBUyxFQUFFO2dCQUM1QixTQUFTLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUM7Z0JBQ3hDLFVBQVUsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQztnQkFDckMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDO2dCQUN0RSxVQUFVLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUM7Z0JBQ3JDLFFBQVEsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQztnQkFDdkMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDO2dCQUN2QyxTQUFTLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUM7YUFDeEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFBZSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hDLE1BQU0sU0FBUyxHQUFHLCtCQUFjLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRXhFLE1BQU0saUJBQWlCLEdBQThCO2dCQUNwRCxhQUFhLEVBQUU7b0JBQ2Q7d0JBQ0MsS0FBSyxFQUFFLFVBQVU7d0JBQ2pCLFFBQVEsRUFBRTs0QkFDVCxTQUFTLEVBQUUsRUFBRTs0QkFDYixVQUFVLEVBQUUsU0FBUzt5QkFDckI7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsS0FBSyxFQUFFLGtCQUFrQjt3QkFDekIsUUFBUSxFQUFFOzRCQUNULFNBQVMsRUFBRSx1QkFBdUI7NEJBQ2xDLFVBQVUsRUFBRSxTQUFTO3lCQUNyQjtxQkFDRDtvQkFDRDt3QkFDQyxLQUFLLEVBQUUsU0FBUzt3QkFDaEIsUUFBUSxFQUFFOzRCQUNULFNBQVMsRUFBRSxRQUFROzRCQUNuQixVQUFVLEVBQUUsU0FBUzt5QkFDckI7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsS0FBSyxFQUFFLENBQUMsY0FBYyxFQUFFLDBEQUEwRCxDQUFDO3dCQUNuRixRQUFRLEVBQUU7NEJBQ1QsVUFBVSxFQUFFLFNBQVM7eUJBQ3JCO3FCQUNEO29CQUNEO3dCQUNDLEtBQUssRUFBRSwwRkFBMEY7d0JBQ2pHLFFBQVEsRUFBRTs0QkFDVCxTQUFTLEVBQUUsV0FBVzs0QkFDdEIsVUFBVSxFQUFFLFNBQVM7eUJBQ3JCO3FCQUNEO2lCQUNEO2FBQ0QsQ0FBQztZQUVGLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRWxELElBQUksVUFBVSxDQUFDO1lBQ2YsTUFBTSxpQkFBaUIsR0FBRyxTQUFTLENBQUM7WUFFcEMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRCxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVwRSxVQUFVLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0QsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFdEcsVUFBVSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRCxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFM0QsVUFBVSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdELGdCQUFnQixDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFFL0csVUFBVSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlELGdCQUFnQixDQUFDLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBRXJFLFVBQVUsR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFeEcsVUFBVSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RCxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUU3RyxVQUFVLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUQsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUVsSCxVQUFVLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsZ0NBQWdDLEVBQUUsMkJBQTJCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEcsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFFeEUsVUFBVSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RixnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUU5RyxDQUFDLENBQUMsQ0FBQztRQUdILElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN0RCxNQUFNLFNBQVMsR0FBRywrQkFBYyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUV4RSxNQUFNLGlCQUFpQixHQUE4QjtnQkFDcEQsYUFBYSxFQUFFO29CQUNkO3dCQUNDLEtBQUssRUFBRSxrQkFBa0I7d0JBQ3pCLFFBQVEsRUFBRTs0QkFDVCxTQUFTLEVBQUUsV0FBVzs0QkFDdEIsVUFBVSxFQUFFLFNBQVM7eUJBQ3JCO3FCQUNEO29CQUNEO3dCQUNDLEtBQUssRUFBRSx3QkFBd0I7d0JBQy9CLFFBQVEsRUFBRTs0QkFDVCxVQUFVLEVBQUUsU0FBUzt5QkFDckI7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsS0FBSyxFQUFFLGFBQWE7d0JBQ3BCLFFBQVEsRUFBRTs0QkFDVCxVQUFVLEVBQUUsU0FBUzt5QkFDckI7cUJBQ0Q7aUJBQ0Q7YUFDRCxDQUFDO1lBRUYsU0FBUyxDQUFDLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFbEQsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekUsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztRQUV4SCxDQUFDLENBQUMsQ0FBQztRQUdILElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDaEMsTUFBTSxTQUFTLEdBQUcsK0JBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDeEUsU0FBUyxDQUFDLGVBQWUsQ0FBQyxFQUFFLG1CQUFtQixFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLDRCQUE0QixDQUFDO2dCQUN0QyxPQUFPLEVBQUUsSUFBSTtnQkFDYixLQUFLLEVBQUU7b0JBQ04sTUFBTSxFQUFFLFNBQVM7b0JBQ2pCLE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtvQkFDaEQsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtvQkFDMUIsZUFBZSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtvQkFDakMsZ0JBQWdCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUU7b0JBQ25ELFNBQVMsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRTtpQkFDckQ7YUFDRCxDQUFDLENBQUM7WUFFSCxpQkFBaUIsQ0FBQyxTQUFTLEVBQUU7Z0JBQzVCLE1BQU0sRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQztnQkFDckMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUM7Z0JBQzVDLHlCQUF5QixFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDdEUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUM7Z0JBQ3hDLDBCQUEwQixFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEdBQUcsQ0FBQztnQkFDeEUsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDcEQseUJBQXlCLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUMzRSxnQ0FBZ0MsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQzthQUM5RixDQUFDLENBQUM7UUFFSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDN0IsTUFBTSxRQUFRLEdBQUcsSUFBQSw0REFBOEIsR0FBRSxDQUFDO1lBRWxELFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsRUFBRSx5QkFBeUIsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN0RixRQUFRLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLEVBQUUseUJBQXlCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUUvRixJQUFJLENBQUM7Z0JBQ0osTUFBTSxTQUFTLEdBQUcsK0JBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3hFLFNBQVMsQ0FBQyxlQUFlLENBQUMsRUFBRSxtQkFBbUIsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO2dCQUM5RCxTQUFTLENBQUMsNEJBQTRCLENBQUM7b0JBQ3RDLE9BQU8sRUFBRSxJQUFJO29CQUNiLEtBQUssRUFBRTt3QkFDTixXQUFXLEVBQUUsU0FBUzt3QkFDdEIsaUJBQWlCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO3dCQUNuQyxrQkFBa0IsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7cUJBQ2xDO2lCQUNELENBQUMsQ0FBQztnQkFFSCxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RixpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsRUFBRSwyQkFBMkIsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTNHLFNBQVMsQ0FBQyw0QkFBNEIsQ0FBQztvQkFDdEMsT0FBTyxFQUFFLElBQUk7b0JBQ2IsS0FBSyxFQUFFO3dCQUNOLFdBQVcsRUFBRSxTQUFTO3dCQUN0QixpQkFBaUIsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtxQkFDMUQ7aUJBQ0QsQ0FBQyxDQUFDO2dCQUNILGlCQUFpQixDQUFDLFNBQVMsRUFBRSxFQUFFLG9CQUFvQixFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDekYsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUNoRCxRQUFRLENBQUMsbUJBQW1CLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUNwRCxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzNCLElBQUksQ0FBQztnQkFDSixNQUFNLFNBQVMsR0FBRywrQkFBYyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDeEUsU0FBUyxDQUFDLGVBQWUsQ0FBQyxFQUFFLG1CQUFtQixFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7Z0JBQzlELFNBQVMsQ0FBQyw0QkFBNEIsQ0FBQztvQkFDdEMsT0FBTyxFQUFFLElBQUk7b0JBQ2IsS0FBSyxFQUFFO3dCQUNOLFdBQVcsRUFBRSxTQUFTO3dCQUN0QixnQkFBZ0IsRUFBRSxTQUFTO3dCQUMzQixrQkFBa0IsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7d0JBQ2xDLDZCQUE2QixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtxQkFDL0M7aUJBQ0QsQ0FBQyxDQUFDO2dCQUVILGlCQUFpQixDQUFDLFNBQVMsRUFBRSxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ2hGLGlCQUFpQixDQUFDLFNBQVMsRUFBRSxFQUFFLFdBQVcsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ3RGLGlCQUFpQixDQUFDLFNBQVMsRUFBRSxFQUFFLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM1RixpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2pILENBQUM7b0JBQVMsQ0FBQztZQUNYLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM3QyxNQUFNLFFBQVEsR0FBRyxJQUFBLDREQUE4QixHQUFFLENBQUM7WUFFbEQsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxNQUFNLENBQUM7WUFFM0UsUUFBUSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLEVBQUUsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdEksUUFBUSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRW5JLElBQUksQ0FBQztnQkFDSixNQUFNLFNBQVMsR0FBRywrQkFBYyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDeEUsU0FBUyxDQUFDLGVBQWUsQ0FBQyxFQUFFLG1CQUFtQixFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7Z0JBQzlELFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQztvQkFDOUIsYUFBYSxFQUFFO3dCQUNkOzRCQUNDLEtBQUssRUFBRSxrQkFBa0I7NEJBQ3pCLFFBQVEsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUU7eUJBQ25DO3dCQUNEOzRCQUNDLEtBQUssRUFBRSxzQkFBc0I7NEJBQzdCLFFBQVEsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUU7eUJBQ25DO3FCQUNEO2lCQUNELENBQUMsQ0FBQztnQkFFSCxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNsRixpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRW5GLENBQUM7b0JBQVMsQ0FBQztnQkFDVixRQUFRLENBQUMsMkJBQTJCLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUN6RixRQUFRLENBQUMsMkJBQTJCLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztnQkFFdEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUN6RixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9