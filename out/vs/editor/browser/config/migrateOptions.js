/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorSettingMigration = void 0;
    exports.migrateOptions = migrateOptions;
    class EditorSettingMigration {
        static { this.items = []; }
        constructor(key, migrate) {
            this.key = key;
            this.migrate = migrate;
        }
        apply(options) {
            const value = EditorSettingMigration._read(options, this.key);
            const read = (key) => EditorSettingMigration._read(options, key);
            const write = (key, value) => EditorSettingMigration._write(options, key, value);
            this.migrate(value, read, write);
        }
        static _read(source, key) {
            if (typeof source === 'undefined') {
                return undefined;
            }
            const firstDotIndex = key.indexOf('.');
            if (firstDotIndex >= 0) {
                const firstSegment = key.substring(0, firstDotIndex);
                return this._read(source[firstSegment], key.substring(firstDotIndex + 1));
            }
            return source[key];
        }
        static _write(target, key, value) {
            const firstDotIndex = key.indexOf('.');
            if (firstDotIndex >= 0) {
                const firstSegment = key.substring(0, firstDotIndex);
                target[firstSegment] = target[firstSegment] || {};
                this._write(target[firstSegment], key.substring(firstDotIndex + 1), value);
                return;
            }
            target[key] = value;
        }
    }
    exports.EditorSettingMigration = EditorSettingMigration;
    function registerEditorSettingMigration(key, migrate) {
        EditorSettingMigration.items.push(new EditorSettingMigration(key, migrate));
    }
    function registerSimpleEditorSettingMigration(key, values) {
        registerEditorSettingMigration(key, (value, read, write) => {
            if (typeof value !== 'undefined') {
                for (const [oldValue, newValue] of values) {
                    if (value === oldValue) {
                        write(key, newValue);
                        return;
                    }
                }
            }
        });
    }
    /**
     * Compatibility with old options
     */
    function migrateOptions(options) {
        EditorSettingMigration.items.forEach(migration => migration.apply(options));
    }
    registerSimpleEditorSettingMigration('wordWrap', [[true, 'on'], [false, 'off']]);
    registerSimpleEditorSettingMigration('lineNumbers', [[true, 'on'], [false, 'off']]);
    registerSimpleEditorSettingMigration('cursorBlinking', [['visible', 'solid']]);
    registerSimpleEditorSettingMigration('renderWhitespace', [[true, 'boundary'], [false, 'none']]);
    registerSimpleEditorSettingMigration('renderLineHighlight', [[true, 'line'], [false, 'none']]);
    registerSimpleEditorSettingMigration('acceptSuggestionOnEnter', [[true, 'on'], [false, 'off']]);
    registerSimpleEditorSettingMigration('tabCompletion', [[false, 'off'], [true, 'onlySnippets']]);
    registerSimpleEditorSettingMigration('hover', [[true, { enabled: true }], [false, { enabled: false }]]);
    registerSimpleEditorSettingMigration('parameterHints', [[true, { enabled: true }], [false, { enabled: false }]]);
    registerSimpleEditorSettingMigration('autoIndent', [[false, 'advanced'], [true, 'full']]);
    registerSimpleEditorSettingMigration('matchBrackets', [[true, 'always'], [false, 'never']]);
    registerSimpleEditorSettingMigration('renderFinalNewline', [[true, 'on'], [false, 'off']]);
    registerSimpleEditorSettingMigration('cursorSmoothCaretAnimation', [[true, 'on'], [false, 'off']]);
    registerSimpleEditorSettingMigration('occurrencesHighlight', [[true, 'singleFile'], [false, 'off']]);
    registerSimpleEditorSettingMigration('wordBasedSuggestions', [[true, 'matchingDocuments'], [false, 'off']]);
    registerEditorSettingMigration('autoClosingBrackets', (value, read, write) => {
        if (value === false) {
            write('autoClosingBrackets', 'never');
            if (typeof read('autoClosingQuotes') === 'undefined') {
                write('autoClosingQuotes', 'never');
            }
            if (typeof read('autoSurround') === 'undefined') {
                write('autoSurround', 'never');
            }
        }
    });
    registerEditorSettingMigration('renderIndentGuides', (value, read, write) => {
        if (typeof value !== 'undefined') {
            write('renderIndentGuides', undefined);
            if (typeof read('guides.indentation') === 'undefined') {
                write('guides.indentation', !!value);
            }
        }
    });
    registerEditorSettingMigration('highlightActiveIndentGuide', (value, read, write) => {
        if (typeof value !== 'undefined') {
            write('highlightActiveIndentGuide', undefined);
            if (typeof read('guides.highlightActiveIndentation') === 'undefined') {
                write('guides.highlightActiveIndentation', !!value);
            }
        }
    });
    const suggestFilteredTypesMapping = {
        method: 'showMethods',
        function: 'showFunctions',
        constructor: 'showConstructors',
        deprecated: 'showDeprecated',
        field: 'showFields',
        variable: 'showVariables',
        class: 'showClasses',
        struct: 'showStructs',
        interface: 'showInterfaces',
        module: 'showModules',
        property: 'showProperties',
        event: 'showEvents',
        operator: 'showOperators',
        unit: 'showUnits',
        value: 'showValues',
        constant: 'showConstants',
        enum: 'showEnums',
        enumMember: 'showEnumMembers',
        keyword: 'showKeywords',
        text: 'showWords',
        color: 'showColors',
        file: 'showFiles',
        reference: 'showReferences',
        folder: 'showFolders',
        typeParameter: 'showTypeParameters',
        snippet: 'showSnippets',
    };
    registerEditorSettingMigration('suggest.filteredTypes', (value, read, write) => {
        if (value && typeof value === 'object') {
            for (const entry of Object.entries(suggestFilteredTypesMapping)) {
                const v = value[entry[0]];
                if (v === false) {
                    if (typeof read(`suggest.${entry[1]}`) === 'undefined') {
                        write(`suggest.${entry[1]}`, false);
                    }
                }
            }
            write('suggest.filteredTypes', undefined);
        }
    });
    registerEditorSettingMigration('quickSuggestions', (input, read, write) => {
        if (typeof input === 'boolean') {
            const value = input ? 'on' : 'off';
            const newValue = { comments: value, strings: value, other: value };
            write('quickSuggestions', newValue);
        }
    });
    // Sticky Scroll
    registerEditorSettingMigration('experimental.stickyScroll.enabled', (value, read, write) => {
        if (typeof value === 'boolean') {
            write('experimental.stickyScroll.enabled', undefined);
            if (typeof read('stickyScroll.enabled') === 'undefined') {
                write('stickyScroll.enabled', value);
            }
        }
    });
    registerEditorSettingMigration('experimental.stickyScroll.maxLineCount', (value, read, write) => {
        if (typeof value === 'number') {
            write('experimental.stickyScroll.maxLineCount', undefined);
            if (typeof read('stickyScroll.maxLineCount') === 'undefined') {
                write('stickyScroll.maxLineCount', value);
            }
        }
    });
    // Code Actions on Save
    registerEditorSettingMigration('codeActionsOnSave', (value, read, write) => {
        if (value && typeof value === 'object') {
            let toBeModified = false;
            const newValue = {};
            for (const entry of Object.entries(value)) {
                if (typeof entry[1] === 'boolean') {
                    toBeModified = true;
                    newValue[entry[0]] = entry[1] ? 'explicit' : 'never';
                }
                else {
                    newValue[entry[0]] = entry[1];
                }
            }
            if (toBeModified) {
                write(`codeActionsOnSave`, newValue);
            }
        }
    });
    // Migrate Quick Fix Settings
    registerEditorSettingMigration('codeActionWidget.includeNearbyQuickfixes', (value, read, write) => {
        if (typeof value === 'boolean') {
            write('codeActionWidget.includeNearbyQuickfixes', undefined);
            if (typeof read('codeActionWidget.includeNearbyQuickFixes') === 'undefined') {
                write('codeActionWidget.includeNearbyQuickFixes', value);
            }
        }
    });
    // Migrate the lightbulb settings
    registerEditorSettingMigration('lightbulb.enabled', (value, read, write) => {
        if (typeof value === 'boolean') {
            write('lightbulb.enabled', value ? undefined : 'off');
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0ZU9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL2NvbmZpZy9taWdyYXRlT3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5RWhHLHdDQUVDO0lBL0RELE1BQWEsc0JBQXNCO2lCQUVwQixVQUFLLEdBQTZCLEVBQUUsQ0FBQztRQUVuRCxZQUNpQixHQUFXLEVBQ1gsT0FBNEU7WUFENUUsUUFBRyxHQUFILEdBQUcsQ0FBUTtZQUNYLFlBQU8sR0FBUCxPQUFPLENBQXFFO1FBQ3pGLENBQUM7UUFFTCxLQUFLLENBQUMsT0FBWTtZQUNqQixNQUFNLEtBQUssR0FBRyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5RCxNQUFNLElBQUksR0FBRyxDQUFDLEdBQVcsRUFBRSxFQUFFLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6RSxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQVcsRUFBRSxLQUFVLEVBQUUsRUFBRSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlGLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFXLEVBQUUsR0FBVztZQUM1QyxJQUFJLE9BQU8sTUFBTSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUNuQyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMs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