/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/browser/config/migrateOptions", "vs/editor/common/config/editorZoom", "vs/editor/test/browser/config/testConfiguration"], function (require, exports, assert, utils_1, migrateOptions_1, editorZoom_1, testConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Common Editor Config', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Zoom Level', () => {
            //Zoom levels are defined to go between -5, 20 inclusive
            const zoom = editorZoom_1.EditorZoom;
            zoom.setZoomLevel(0);
            assert.strictEqual(zoom.getZoomLevel(), 0);
            zoom.setZoomLevel(-0);
            assert.strictEqual(zoom.getZoomLevel(), 0);
            zoom.setZoomLevel(5);
            assert.strictEqual(zoom.getZoomLevel(), 5);
            zoom.setZoomLevel(-1);
            assert.strictEqual(zoom.getZoomLevel(), -1);
            zoom.setZoomLevel(9);
            assert.strictEqual(zoom.getZoomLevel(), 9);
            zoom.setZoomLevel(-9);
            assert.strictEqual(zoom.getZoomLevel(), -5);
            zoom.setZoomLevel(20);
            assert.strictEqual(zoom.getZoomLevel(), 20);
            zoom.setZoomLevel(-10);
            assert.strictEqual(zoom.getZoomLevel(), -5);
            zoom.setZoomLevel(9.1);
            assert.strictEqual(zoom.getZoomLevel(), 9.1);
            zoom.setZoomLevel(-9.1);
            assert.strictEqual(zoom.getZoomLevel(), -5);
            zoom.setZoomLevel(Infinity);
            assert.strictEqual(zoom.getZoomLevel(), 20);
            zoom.setZoomLevel(Number.NEGATIVE_INFINITY);
            assert.strictEqual(zoom.getZoomLevel(), -5);
        });
        class TestWrappingConfiguration extends testConfiguration_1.TestConfiguration {
            _readEnvConfiguration() {
                return {
                    extraEditorClassName: '',
                    outerWidth: 1000,
                    outerHeight: 100,
                    emptySelectionClipboard: true,
                    pixelRatio: 1,
                    accessibilitySupport: 0 /* AccessibilitySupport.Unknown */
                };
            }
        }
        function assertWrapping(config, isViewportWrapping, wrappingColumn) {
            const options = config.options;
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            assert.strictEqual(wrappingInfo.isViewportWrapping, isViewportWrapping);
            assert.strictEqual(wrappingInfo.wrappingColumn, wrappingColumn);
        }
        test('wordWrap default', () => {
            const config = new TestWrappingConfiguration({});
            assertWrapping(config, false, -1);
            config.dispose();
        });
        test('wordWrap compat false', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: false
            });
            assertWrapping(config, false, -1);
            config.dispose();
        });
        test('wordWrap compat true', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: true
            });
            assertWrapping(config, true, 80);
            config.dispose();
        });
        test('wordWrap on', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: 'on'
            });
            assertWrapping(config, true, 80);
            config.dispose();
        });
        test('wordWrap on without minimap', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: 'on',
                minimap: {
                    enabled: false
                }
            });
            assertWrapping(config, true, 88);
            config.dispose();
        });
        test('wordWrap on does not use wordWrapColumn', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: 'on',
                wordWrapColumn: 10
            });
            assertWrapping(config, true, 80);
            config.dispose();
        });
        test('wordWrap off', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: 'off'
            });
            assertWrapping(config, false, -1);
            config.dispose();
        });
        test('wordWrap off does not use wordWrapColumn', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: 'off',
                wordWrapColumn: 10
            });
            assertWrapping(config, false, -1);
            config.dispose();
        });
        test('wordWrap wordWrapColumn uses default wordWrapColumn', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: 'wordWrapColumn'
            });
            assertWrapping(config, false, 80);
            config.dispose();
        });
        test('wordWrap wordWrapColumn uses wordWrapColumn', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: 100
            });
            assertWrapping(config, false, 100);
            config.dispose();
        });
        test('wordWrap wordWrapColumn validates wordWrapColumn', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: 'wordWrapColumn',
                wordWrapColumn: -1
            });
            assertWrapping(config, false, 1);
            config.dispose();
        });
        test('wordWrap bounded uses default wordWrapColumn', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: 'bounded'
            });
            assertWrapping(config, true, 80);
            config.dispose();
        });
        test('wordWrap bounded uses wordWrapColumn', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: 'bounded',
                wordWrapColumn: 40
            });
            assertWrapping(config, true, 40);
            config.dispose();
        });
        test('wordWrap bounded validates wordWrapColumn', () => {
            const config = new TestWrappingConfiguration({
                wordWrap: 'bounded',
                wordWrapColumn: -1
            });
            assertWrapping(config, true, 1);
            config.dispose();
        });
        test('issue #53152: Cannot assign to read only property \'enabled\' of object', () => {
            const hoverOptions = {};
            Object.defineProperty(hoverOptions, 'enabled', {
                writable: false,
                value: true
            });
            const config = new testConfiguration_1.TestConfiguration({ hover: hoverOptions });
            assert.strictEqual(config.options.get(60 /* EditorOption.hover */).enabled, true);
            config.updateOptions({ hover: { enabled: false } });
            assert.strictEqual(config.options.get(60 /* EditorOption.hover */).enabled, false);
            config.dispose();
        });
        test('does not emit event when nothing changes', () => {
            const config = new testConfiguration_1.TestConfiguration({ glyphMargin: true, roundedSelection: false });
            let event = null;
            const disposable = config.onDidChange(e => event = e);
            assert.strictEqual(config.options.get(57 /* EditorOption.glyphMargin */), true);
            config.updateOptions({ glyphMargin: true });
            config.updateOptions({ roundedSelection: false });
            assert.strictEqual(event, null);
            config.dispose();
            disposable.dispose();
        });
        test('issue #94931: Unable to open source file', () => {
            const config = new testConfiguration_1.TestConfiguration({ quickSuggestions: null });
            const actual = config.options.get(89 /* EditorOption.quickSuggestions */);
            assert.deepStrictEqual(actual, {
                other: 'on',
                comments: 'off',
                strings: 'off'
            });
            config.dispose();
        });
        test('issue #102920: Can\'t snap or split view with JSON files', () => {
            const config = new testConfiguration_1.TestConfiguration({ quickSuggestions: null });
            config.updateOptions({ quickSuggestions: { strings: true } });
            const actual = config.options.get(89 /* EditorOption.quickSuggestions */);
            assert.deepStrictEqual(actual, {
                other: 'on',
                comments: 'off',
                strings: 'on'
            });
            config.dispose();
        });
        test('issue #151926: Untyped editor options apply', () => {
            const config = new testConfiguration_1.TestConfiguration({});
            config.updateOptions({ unicodeHighlight: { allowedCharacters: { 'x': true } } });
            const actual = config.options.get(125 /* EditorOption.unicodeHighlighting */);
            assert.deepStrictEqual(actual, {
                nonBasicASCII: "inUntrustedWorkspace",
                invisibleCharacters: true,
                ambiguousCharacters: true,
                includeComments: "inUntrustedWorkspace",
                includeStrings: "inUntrustedWorkspace",
                allowedCharacters: { "x": true },
                allowedLocales: { "_os": true, "_vscode": true }
            });
            config.dispose();
        });
    });
    suite('migrateOptions', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function migrate(options) {
            (0, migrateOptions_1.migrateOptions)(options);
            return options;
        }
        test('wordWrap', () => {
            assert.deepStrictEqual(migrate({ wordWrap: true }), { wordWrap: 'on' });
            assert.deepStrictEqual(migrate({ wordWrap: false }), { wordWrap: 'off' });
        });
        test('lineNumbers', () => {
            assert.deepStrictEqual(migrate({ lineNumbers: true }), { lineNumbers: 'on' });
            assert.deepStrictEqual(migrate({ lineNumbers: false }), { lineNumbers: 'off' });
        });
        test('autoClosingBrackets', () => {
            assert.deepStrictEqual(migrate({ autoClosingBrackets: false }), { autoClosingBrackets: 'never', autoClosingQuotes: 'never', autoSurround: 'never' });
        });
        test('cursorBlinking', () => {
            assert.deepStrictEqual(migrate({ cursorBlinking: 'visible' }), { cursorBlinking: 'solid' });
        });
        test('renderWhitespace', () => {
            assert.deepStrictEqual(migrate({ renderWhitespace: true }), { renderWhitespace: 'boundary' });
            assert.deepStrictEqual(migrate({ renderWhitespace: false }), { renderWhitespace: 'none' });
        });
        test('renderLineHighlight', () => {
            assert.deepStrictEqual(migrate({ renderLineHighlight: true }), { renderLineHighlight: 'line' });
            assert.deepStrictEqual(migrate({ renderLineHighlight: false }), { renderLineHighlight: 'none' });
        });
        test('acceptSuggestionOnEnter', () => {
            assert.deepStrictEqual(migrate({ acceptSuggestionOnEnter: true }), { acceptSuggestionOnEnter: 'on' });
            assert.deepStrictEqual(migrate({ acceptSuggestionOnEnter: false }), { acceptSuggestionOnEnter: 'off' });
        });
        test('tabCompletion', () => {
            assert.deepStrictEqual(migrate({ tabCompletion: true }), { tabCompletion: 'onlySnippets' });
            assert.deepStrictEqual(migrate({ tabCompletion: false }), { tabCompletion: 'off' });
        });
        test('suggest.filteredTypes', () => {
            assert.deepStrictEqual(migrate({
                suggest: {
                    filteredTypes: {
                        method: false,
                        function: false,
                        constructor: false,
                        deprecated: false,
                        field: false,
                        variable: false,
                        class: false,
                        struct: false,
                        interface: false,
                        module: false,
                        property: false,
                        event: false,
                        operator: false,
                        unit: false,
                        value: false,
                        constant: false,
                        enum: false,
                        enumMember: false,
                        keyword: false,
                        text: false,
                        color: false,
                        file: false,
                        reference: false,
                        folder: false,
                        typeParameter: false,
                        snippet: false,
                    }
                }
            }), {
                suggest: {
                    filteredTypes: undefined,
                    showMethods: false,
                    showFunctions: false,
                    showConstructors: false,
                    showDeprecated: false,
                    showFields: false,
                    showVariables: false,
                    showClasses: false,
                    showStructs: false,
                    showInterfaces: false,
                    showModules: false,
                    showProperties: false,
                    showEvents: false,
                    showOperators: false,
                    showUnits: false,
                    showValues: false,
                    showConstants: false,
                    showEnums: false,
                    showEnumMembers: false,
                    showKeywords: false,
                    showWords: false,
                    showColors: false,
                    showFiles: false,
                    showReferences: false,
                    showFolders: false,
                    showTypeParameters: false,
                    showSnippets: false,
                }
            });
        });
        test('quickSuggestions', () => {
            assert.deepStrictEqual(migrate({ quickSuggestions: true }), { quickSuggestions: { comments: 'on', strings: 'on', other: 'on' } });
            assert.deepStrictEqual(migrate({ quickSuggestions: false }), { quickSuggestions: { comments: 'off', strings: 'off', other: 'off' } });
            assert.deepStrictEqual(migrate({ quickSuggestions: { comments: 'on', strings: 'off' } }), { quickSuggestions: { comments: 'on', strings: 'off' } });
        });
        test('hover', () => {
            assert.deepStrictEqual(migrate({ hover: true }), { hover: { enabled: true } });
            assert.deepStrictEqual(migrate({ hover: false }), { hover: { enabled: false } });
        });
        test('parameterHints', () => {
            assert.deepStrictEqual(migrate({ parameterHints: true }), { parameterHints: { enabled: true } });
            assert.deepStrictEqual(migrate({ parameterHints: false }), { parameterHints: { enabled: false } });
        });
        test('autoIndent', () => {
            assert.deepStrictEqual(migrate({ autoIndent: true }), { autoIndent: 'full' });
            assert.deepStrictEqual(migrate({ autoIndent: false }), { autoIndent: 'advanced' });
        });
        test('matchBrackets', () => {
            assert.deepStrictEqual(migrate({ matchBrackets: true }), { matchBrackets: 'always' });
            assert.deepStrictEqual(migrate({ matchBrackets: false }), { matchBrackets: 'never' });
        });
        test('renderIndentGuides, highlightActiveIndentGuide', () => {
            assert.deepStrictEqual(migrate({ renderIndentGuides: true }), { renderIndentGuides: undefined, guides: { indentation: true } });
            assert.deepStrictEqual(migrate({ renderIndentGuides: false }), { renderIndentGuides: undefined, guides: { indentation: false } });
            assert.deepStrictEqual(migrate({ highlightActiveIndentGuide: true }), { highlightActiveIndentGuide: undefined, guides: { highlightActiveIndentation: true } });
            assert.deepStrictEqual(migrate({ highlightActiveIndentGuide: false }), { highlightActiveIndentGuide: undefined, guides: { highlightActiveIndentation: false } });
        });
        test('migration does not overwrite new setting', () => {
            assert.deepStrictEqual(migrate({ renderIndentGuides: true, guides: { indentation: false } }), { renderIndentGuides: undefined, guides: { indentation: false } });
            assert.deepStrictEqual(migrate({ highlightActiveIndentGuide: true, guides: { highlightActiveIndentation: false } }), { highlightActiveIndentGuide: undefined, guides: { highlightActiveIndentation: false } });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQ29uZmlndXJhdGlvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL2NvbmZpZy9lZGl0b3JDb25maWd1cmF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtRQUVsQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7WUFFdkIsd0RBQXdEO1lBQ3hELE1BQU0sSUFBSSxHQUFHLHVCQUFVLENBQUM7WUFFeEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFM0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU1QyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFD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