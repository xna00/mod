/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/objects", "vs/base/common/platform", "vs/editor/common/core/textModelDefaults", "vs/editor/common/core/wordHelper", "vs/nls"], function (require, exports, arrays, objects, platform, textModelDefaults_1, wordHelper_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorOptions = exports.EditorOption = exports.editorOptionsRegistry = exports.EDITOR_FONT_DEFAULTS = exports.WrappingIndent = exports.unicodeHighlightConfigKeys = exports.inUntrustedWorkspace = exports.RenderLineNumbersType = exports.ShowLightbulbIconMode = exports.EditorLayoutInfoComputer = exports.RenderMinimap = exports.EditorFontVariations = exports.EditorFontLigatures = exports.TextEditorCursorStyle = exports.TextEditorCursorBlinkingStyle = exports.ApplyUpdateResult = exports.ComputeOptionsMemory = exports.ConfigurationChangedEvent = exports.MINIMAP_GUTTER_WIDTH = exports.EditorAutoIndentStrategy = void 0;
    exports.boolean = boolean;
    exports.clampedInt = clampedInt;
    exports.clampedFloat = clampedFloat;
    exports.stringSet = stringSet;
    exports.cursorStyleToString = cursorStyleToString;
    exports.filterValidationDecorations = filterValidationDecorations;
    /**
     * Configuration options for auto indentation in the editor
     */
    var EditorAutoIndentStrategy;
    (function (EditorAutoIndentStrategy) {
        EditorAutoIndentStrategy[EditorAutoIndentStrategy["None"] = 0] = "None";
        EditorAutoIndentStrategy[EditorAutoIndentStrategy["Keep"] = 1] = "Keep";
        EditorAutoIndentStrategy[EditorAutoIndentStrategy["Brackets"] = 2] = "Brackets";
        EditorAutoIndentStrategy[EditorAutoIndentStrategy["Advanced"] = 3] = "Advanced";
        EditorAutoIndentStrategy[EditorAutoIndentStrategy["Full"] = 4] = "Full";
    })(EditorAutoIndentStrategy || (exports.EditorAutoIndentStrategy = EditorAutoIndentStrategy = {}));
    /**
     * @internal
     * The width of the minimap gutter, in pixels.
     */
    exports.MINIMAP_GUTTER_WIDTH = 8;
    //#endregion
    /**
     * An event describing that the configuration of the editor has changed.
     */
    class ConfigurationChangedEvent {
        /**
         * @internal
         */
        constructor(values) {
            this._values = values;
        }
        hasChanged(id) {
            return this._values[id];
        }
    }
    exports.ConfigurationChangedEvent = ConfigurationChangedEvent;
    /**
     * @internal
     */
    class ComputeOptionsMemory {
        constructor() {
            this.stableMinimapLayoutInput = null;
            this.stableFitMaxMinimapScale = 0;
            this.stableFitRemainingWidth = 0;
        }
    }
    exports.ComputeOptionsMemory = ComputeOptionsMemory;
    /**
     * @internal
     */
    class BaseEditorOption {
        constructor(id, name, defaultValue, schema) {
            this.id = id;
            this.name = name;
            this.defaultValue = defaultValue;
            this.schema = schema;
        }
        applyUpdate(value, update) {
            return applyUpdate(value, update);
        }
        compute(env, options, value) {
            return value;
        }
    }
    class ApplyUpdateResult {
        constructor(newValue, didChange) {
            this.newValue = newValue;
            this.didChange = didChange;
        }
    }
    exports.ApplyUpdateResult = ApplyUpdateResult;
    function applyUpdate(value, update) {
        if (typeof value !== 'object' || typeof update !== 'object' || !value || !update) {
            return new ApplyUpdateResult(update, value !== update);
        }
        if (Array.isArray(value) || Array.isArray(update)) {
            const arrayEquals = Array.isArray(value) && Array.isArray(update) && arrays.equals(value, update);
            return new ApplyUpdateResult(update, !arrayEquals);
        }
        let didChange = false;
        for (const key in update) {
            if (update.hasOwnProperty(key)) {
                const result = applyUpdate(value[key], update[key]);
                if (result.didChange) {
                    value[key] = result.newValue;
                    didChange = true;
                }
            }
        }
        return new ApplyUpdateResult(value, didChange);
    }
    /**
     * @internal
     */
    class ComputedEditorOption {
        constructor(id) {
            this.schema = undefined;
            this.id = id;
            this.name = '_never_';
            this.defaultValue = undefined;
        }
        applyUpdate(value, update) {
            return applyUpdate(value, update);
        }
        validate(input) {
            return this.defaultValue;
        }
    }
    class SimpleEditorOption {
        constructor(id, name, defaultValue, schema) {
            this.id = id;
            this.name = name;
            this.defaultValue = defaultValue;
            this.schema = schema;
        }
        applyUpdate(value, update) {
            return applyUpdate(value, update);
        }
        validate(input) {
            if (typeof input === 'undefined') {
                return this.defaultValue;
            }
            return input;
        }
        compute(env, options, value) {
            return value;
        }
    }
    /**
     * @internal
     */
    function boolean(value, defaultValue) {
        if (typeof value === 'undefined') {
            return defaultValue;
        }
        if (value === 'false') {
            // treat the string 'false' as false
            return false;
        }
        return Boolean(value);
    }
    class EditorBooleanOption extends SimpleEditorOption {
        constructor(id, name, defaultValue, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'boolean';
                schema.default = defaultValue;
            }
            super(id, name, defaultValue, schema);
        }
        validate(input) {
            return boolean(input, this.defaultValue);
        }
    }
    /**
     * @internal
     */
    function clampedInt(value, defaultValue, minimum, maximum) {
        if (typeof value === 'undefined') {
            return defaultValue;
        }
        let r = parseInt(value, 10);
        if (isNaN(r)) {
            return defaultValue;
        }
        r = Math.max(minimum, r);
        r = Math.min(maximum, r);
        return r | 0;
    }
    class EditorIntOption extends SimpleEditorOption {
        static clampedInt(value, defaultValue, minimum, maximum) {
            return clampedInt(value, defaultValue, minimum, maximum);
        }
        constructor(id, name, defaultValue, minimum, maximum, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'integer';
                schema.default = defaultValue;
                schema.minimum = minimum;
                schema.maximum = maximum;
            }
            super(id, name, defaultValue, schema);
            this.minimum = minimum;
            this.maximum = maximum;
        }
        validate(input) {
            return EditorIntOption.clampedInt(input, this.defaultValue, this.minimum, this.maximum);
        }
    }
    /**
     * @internal
     */
    function clampedFloat(value, defaultValue, minimum, maximum) {
        if (typeof value === 'undefined') {
            return defaultValue;
        }
        const r = EditorFloatOption.float(value, defaultValue);
        return EditorFloatOption.clamp(r, minimum, maximum);
    }
    class EditorFloatOption extends SimpleEditorOption {
        static clamp(n, min, max) {
            if (n < min) {
                return min;
            }
            if (n > max) {
                return max;
            }
            return n;
        }
        static float(value, defaultValue) {
            if (typeof value === 'number') {
                return value;
            }
            if (typeof value === 'undefined') {
                return defaultValue;
            }
            const r = parseFloat(value);
            return (isNaN(r) ? defaultValue : r);
        }
        constructor(id, name, defaultValue, validationFn, schema) {
            if (typeof schema !== 'undefined') {
                schema.type = 'number';
                schema.default = defaultValue;
            }
            super(id, name, defaultValue, schema);
            this.validationFn = validationFn;
        }
        validate(input) {
            return this.validationFn(EditorFloatOption.float(input, this.defaultValue));
        }
    }
    class EditorStringOption extends SimpleEditorOption {
        static string(value, defaultValue) {
            if (typeof value !== 'string') {
                return defaultValue;
            }
            return value;
        }
        constructor(id, name, defaultValue, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'string';
                schema.default = defaultValue;
            }
            super(id, name, defaultValue, schema);
        }
        validate(input) {
            return EditorStringOption.string(input, this.defaultValue);
        }
    }
    /**
     * @internal
     */
    function stringSet(value, defaultValue, allowedValues, renamedValues) {
        if (typeof value !== 'string') {
            return defaultValue;
        }
        if (renamedValues && value in renamedValues) {
            return renamedValues[value];
        }
        if (allowedValues.indexOf(value) === -1) {
            return defaultValue;
        }
        return value;
    }
    class EditorStringEnumOption extends SimpleEditorOption {
        constructor(id, name, defaultValue, allowedValues, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'string';
                schema.enum = allowedValues;
                schema.default = defaultValue;
            }
            super(id, name, defaultValue, schema);
            this._allowedValues = allowedValues;
        }
        validate(input) {
            return stringSet(input, this.defaultValue, this._allowedValues);
        }
    }
    class EditorEnumOption extends BaseEditorOption {
        constructor(id, name, defaultValue, defaultStringValue, allowedValues, convert, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'string';
                schema.enum = allowedValues;
                schema.default = defaultStringValue;
            }
            super(id, name, defaultValue, schema);
            this._allowedValues = allowedValues;
            this._convert = convert;
        }
        validate(input) {
            if (typeof input !== 'string') {
                return this.defaultValue;
            }
            if (this._allowedValues.indexOf(input) === -1) {
                return this.defaultValue;
            }
            return this._convert(input);
        }
    }
    //#endregion
    //#region autoIndent
    function _autoIndentFromString(autoIndent) {
        switch (autoIndent) {
            case 'none': return 0 /* EditorAutoIndentStrategy.None */;
            case 'keep': return 1 /* EditorAutoIndentStrategy.Keep */;
            case 'brackets': return 2 /* EditorAutoIndentStrategy.Brackets */;
            case 'advanced': return 3 /* EditorAutoIndentStrategy.Advanced */;
            case 'full': return 4 /* EditorAutoIndentStrategy.Full */;
        }
    }
    //#endregion
    //#region accessibilitySupport
    class EditorAccessibilitySupport extends BaseEditorOption {
        constructor() {
            super(2 /* EditorOption.accessibilitySupport */, 'accessibilitySupport', 0 /* AccessibilitySupport.Unknown */, {
                type: 'string',
                enum: ['auto', 'on', 'off'],
                enumDescriptions: [
                    nls.localize('accessibilitySupport.auto', "Use platform APIs to detect when a Screen Reader is attached."),
                    nls.localize('accessibilitySupport.on', "Optimize for usage with a Screen Reader."),
                    nls.localize('accessibilitySupport.off', "Assume a screen reader is not attached."),
                ],
                default: 'auto',
                tags: ['accessibility'],
                description: nls.localize('accessibilitySupport', "Controls if the UI should run in a mode where it is optimized for screen readers.")
            });
        }
        validate(input) {
            switch (input) {
                case 'auto': return 0 /* AccessibilitySupport.Unknown */;
                case 'off': return 1 /* AccessibilitySupport.Disabled */;
                case 'on': return 2 /* AccessibilitySupport.Enabled */;
            }
            return this.defaultValue;
        }
        compute(env, options, value) {
            if (value === 0 /* AccessibilitySupport.Unknown */) {
                // The editor reads the `accessibilitySupport` from the environment
                return env.accessibilitySupport;
            }
            return value;
        }
    }
    class EditorComments extends BaseEditorOption {
        constructor() {
            const defaults = {
                insertSpace: true,
                ignoreEmptyLines: true,
            };
            super(23 /* EditorOption.comments */, 'comments', defaults, {
                'editor.comments.insertSpace': {
                    type: 'boolean',
                    default: defaults.insertSpace,
                    description: nls.localize('comments.insertSpace', "Controls whether a space character is inserted when commenting.")
                },
                'editor.comments.ignoreEmptyLines': {
                    type: 'boolean',
                    default: defaults.ignoreEmptyLines,
                    description: nls.localize('comments.ignoreEmptyLines', 'Controls if empty lines should be ignored with toggle, add or remove actions for line comments.')
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                insertSpace: boolean(input.insertSpace, this.defaultValue.insertSpace),
                ignoreEmptyLines: boolean(input.ignoreEmptyLines, this.defaultValue.ignoreEmptyLines),
            };
        }
    }
    //#endregion
    //#region cursorBlinking
    /**
     * The kind of animation in which the editor's cursor should be rendered.
     */
    var TextEditorCursorBlinkingStyle;
    (function (TextEditorCursorBlinkingStyle) {
        /**
         * Hidden
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Hidden"] = 0] = "Hidden";
        /**
         * Blinking
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Blink"] = 1] = "Blink";
        /**
         * Blinking with smooth fading
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Smooth"] = 2] = "Smooth";
        /**
         * Blinking with prolonged filled state and smooth fading
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Phase"] = 3] = "Phase";
        /**
         * Expand collapse animation on the y axis
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Expand"] = 4] = "Expand";
        /**
         * No-Blinking
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Solid"] = 5] = "Solid";
    })(TextEditorCursorBlinkingStyle || (exports.TextEditorCursorBlinkingStyle = TextEditorCursorBlinkingStyle = {}));
    function _cursorBlinkingStyleFromString(cursorBlinkingStyle) {
        switch (cursorBlinkingStyle) {
            case 'blink': return 1 /* TextEditorCursorBlinkingStyle.Blink */;
            case 'smooth': return 2 /* TextEditorCursorBlinkingStyle.Smooth */;
            case 'phase': return 3 /* TextEditorCursorBlinkingStyle.Phase */;
            case 'expand': return 4 /* TextEditorCursorBlinkingStyle.Expand */;
            case 'solid': return 5 /* TextEditorCursorBlinkingStyle.Solid */;
        }
    }
    //#endregion
    //#region cursorStyle
    /**
     * The style in which the editor's cursor should be rendered.
     */
    var TextEditorCursorStyle;
    (function (TextEditorCursorStyle) {
        /**
         * As a vertical line (sitting between two characters).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["Line"] = 1] = "Line";
        /**
         * As a block (sitting on top of a character).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["Block"] = 2] = "Block";
        /**
         * As a horizontal line (sitting under a character).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["Underline"] = 3] = "Underline";
        /**
         * As a thin vertical line (sitting between two characters).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["LineThin"] = 4] = "LineThin";
        /**
         * As an outlined block (sitting on top of a character).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["BlockOutline"] = 5] = "BlockOutline";
        /**
         * As a thin horizontal line (sitting under a character).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["UnderlineThin"] = 6] = "UnderlineThin";
    })(TextEditorCursorStyle || (exports.TextEditorCursorStyle = TextEditorCursorStyle = {}));
    /**
     * @internal
     */
    function cursorStyleToString(cursorStyle) {
        switch (cursorStyle) {
            case TextEditorCursorStyle.Line: return 'line';
            case TextEditorCursorStyle.Block: return 'block';
            case TextEditorCursorStyle.Underline: return 'underline';
            case TextEditorCursorStyle.LineThin: return 'line-thin';
            case TextEditorCursorStyle.BlockOutline: return 'block-outline';
            case TextEditorCursorStyle.UnderlineThin: return 'underline-thin';
        }
    }
    function _cursorStyleFromString(cursorStyle) {
        switch (cursorStyle) {
            case 'line': return TextEditorCursorStyle.Line;
            case 'block': return TextEditorCursorStyle.Block;
            case 'underline': return TextEditorCursorStyle.Underline;
            case 'line-thin': return TextEditorCursorStyle.LineThin;
            case 'block-outline': return TextEditorCursorStyle.BlockOutline;
            case 'underline-thin': return TextEditorCursorStyle.UnderlineThin;
        }
    }
    //#endregion
    //#region editorClassName
    class EditorClassName extends ComputedEditorOption {
        constructor() {
            super(142 /* EditorOption.editorClassName */);
        }
        compute(env, options, _) {
            const classNames = ['monaco-editor'];
            if (options.get(39 /* EditorOption.extraEditorClassName */)) {
                classNames.push(options.get(39 /* EditorOption.extraEditorClassName */));
            }
            if (env.extraEditorClassName) {
                classNames.push(env.extraEditorClassName);
            }
            if (options.get(74 /* EditorOption.mouseStyle */) === 'default') {
                classNames.push('mouse-default');
            }
            else if (options.get(74 /* EditorOption.mouseStyle */) === 'copy') {
                classNames.push('mouse-copy');
            }
            if (options.get(111 /* EditorOption.showUnused */)) {
                classNames.push('showUnused');
            }
            if (options.get(140 /* EditorOption.showDeprecated */)) {
                classNames.push('showDeprecated');
            }
            return classNames.join(' ');
        }
    }
    //#endregion
    //#region emptySelectionClipboard
    class EditorEmptySelectionClipboard extends EditorBooleanOption {
        constructor() {
            super(37 /* EditorOption.emptySelectionClipboard */, 'emptySelectionClipboard', true, { description: nls.localize('emptySelectionClipboard', "Controls whether copying without a selection copies the current line.") });
        }
        compute(env, options, value) {
            return value && env.emptySelectionClipboard;
        }
    }
    class EditorFind extends BaseEditorOption {
        constructor() {
            const defaults = {
                cursorMoveOnType: true,
                seedSearchStringFromSelection: 'always',
                autoFindInSelection: 'never',
                globalFindClipboard: false,
                addExtraSpaceOnTop: true,
                loop: true
            };
            super(41 /* EditorOption.find */, 'find', defaults, {
                'editor.find.cursorMoveOnType': {
                    type: 'boolean',
                    default: defaults.cursorMoveOnType,
                    description: nls.localize('find.cursorMoveOnType', "Controls whether the cursor should jump to find matches while typing.")
                },
                'editor.find.seedSearchStringFromSelection': {
                    type: 'string',
                    enum: ['never', 'always', 'selection'],
                    default: defaults.seedSearchStringFromSelection,
                    enumDescriptions: [
                        nls.localize('editor.find.seedSearchStringFromSelection.never', 'Never seed search string from the editor selection.'),
                        nls.localize('editor.find.seedSearchStringFromSelection.always', 'Always seed search string from the editor selection, including word at cursor position.'),
                        nls.localize('editor.find.seedSearchStringFromSelection.selection', 'Only seed search string from the editor selection.')
                    ],
                    description: nls.localize('find.seedSearchStringFromSelection', "Controls whether the search string in the Find Widget is seeded from the editor selection.")
                },
                'editor.find.autoFindInSelection': {
                    type: 'string',
                    enum: ['never', 'always', 'multiline'],
                    default: defaults.autoFindInSelection,
                    enumDescriptions: [
                        nls.localize('editor.find.autoFindInSelection.never', 'Never turn on Find in Selection automatically (default).'),
                        nls.localize('editor.find.autoFindInSelection.always', 'Always turn on Find in Selection automatically.'),
                        nls.localize('editor.find.autoFindInSelection.multiline', 'Turn on Find in Selection automatically when multiple lines of content are selected.')
                    ],
                    description: nls.localize('find.autoFindInSelection', "Controls the condition for turning on Find in Selection automatically.")
                },
                'editor.find.globalFindClipboard': {
                    type: 'boolean',
                    default: defaults.globalFindClipboard,
                    description: nls.localize('find.globalFindClipboard', "Controls whether the Find Widget should read or modify the shared find clipboard on macOS."),
                    included: platform.isMacintosh
                },
                'editor.find.addExtraSpaceOnTop': {
                    type: 'boolean',
                    default: defaults.addExtraSpaceOnTop,
                    description: nls.localize('find.addExtraSpaceOnTop', "Controls whether the Find Widget should add extra lines on top of the editor. When true, you can scroll beyond the first line when the Find Widget is visible.")
                },
                'editor.find.loop': {
                    type: 'boolean',
                    default: defaults.loop,
                    description: nls.localize('find.loop', "Controls whether the search automatically restarts from the beginning (or the end) when no further matches can be found.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                cursorMoveOnType: boolean(input.cursorMoveOnType, this.defaultValue.cursorMoveOnType),
                seedSearchStringFromSelection: typeof _input.seedSearchStringFromSelection === 'boolean'
                    ? (_input.seedSearchStringFromSelection ? 'always' : 'never')
                    : stringSet(input.seedSearchStringFromSelection, this.defaultValue.seedSearchStringFromSelection, ['never', 'always', 'selection']),
                autoFindInSelection: typeof _input.autoFindInSelection === 'boolean'
                    ? (_input.autoFindInSelection ? 'always' : 'never')
                    : stringSet(input.autoFindInSelection, this.defaultValue.autoFindInSelection, ['never', 'always', 'multiline']),
                globalFindClipboard: boolean(input.globalFindClipboard, this.defaultValue.globalFindClipboard),
                addExtraSpaceOnTop: boolean(input.addExtraSpaceOnTop, this.defaultValue.addExtraSpaceOnTop),
                loop: boolean(input.loop, this.defaultValue.loop),
            };
        }
    }
    //#endregion
    //#region fontLigatures
    /**
     * @internal
     */
    class EditorFontLigatures extends BaseEditorOption {
        static { this.OFF = '"liga" off, "calt" off'; }
        static { this.ON = '"liga" on, "calt" on'; }
        constructor() {
            super(51 /* EditorOption.fontLigatures */, 'fontLigatures', EditorFontLigatures.OFF, {
                anyOf: [
                    {
                        type: 'boolean',
                        description: nls.localize('fontLigatures', "Enables/Disables font ligatures ('calt' and 'liga' font features). Change this to a string for fine-grained control of the 'font-feature-settings' CSS property."),
                    },
                    {
                        type: 'string',
                        description: nls.localize('fontFeatureSettings', "Explicit 'font-feature-settings' CSS property. A boolean can be passed instead if one only needs to turn on/off ligatures.")
                    }
                ],
                description: nls.localize('fontLigaturesGeneral', "Configures font ligatures or font features. Can be either a boolean to enable/disable ligatures or a string for the value of the CSS 'font-feature-settings' property."),
                default: false
            });
        }
        validate(input) {
            if (typeof input === 'undefined') {
                return this.defaultValue;
            }
            if (typeof input === 'string') {
                if (input === 'false' || input.length === 0) {
                    return EditorFontLigatures.OFF;
                }
                if (input === 'true') {
                    return EditorFontLigatures.ON;
                }
                return input;
            }
            if (Boolean(input)) {
                return EditorFontLigatures.ON;
            }
            return EditorFontLigatures.OFF;
        }
    }
    exports.EditorFontLigatures = EditorFontLigatures;
    //#endregion
    //#region fontVariations
    /**
     * @internal
     */
    class EditorFontVariations extends BaseEditorOption {
        // Text is laid out using default settings.
        static { this.OFF = 'normal'; }
        // Translate `fontWeight` config to the `font-variation-settings` CSS property.
        static { this.TRANSLATE = 'translate'; }
        constructor() {
            super(54 /* EditorOption.fontVariations */, 'fontVariations', EditorFontVariations.OFF, {
                anyOf: [
                    {
                        type: 'boolean',
                        description: nls.localize('fontVariations', "Enables/Disables the translation from font-weight to font-variation-settings. Change this to a string for fine-grained control of the 'font-variation-settings' CSS property."),
                    },
                    {
                        type: 'string',
                        description: nls.localize('fontVariationSettings', "Explicit 'font-variation-settings' CSS property. A boolean can be passed instead if one only needs to translate font-weight to font-variation-settings.")
                    }
                ],
                description: nls.localize('fontVariationsGeneral', "Configures font variations. Can be either a boolean to enable/disable the translation from font-weight to font-variation-settings or a string for the value of the CSS 'font-variation-settings' property."),
                default: false
            });
        }
        validate(input) {
            if (typeof input === 'undefined') {
                return this.defaultValue;
            }
            if (typeof input === 'string') {
                if (input === 'false') {
                    return EditorFontVariations.OFF;
                }
                if (input === 'true') {
                    return EditorFontVariations.TRANSLATE;
                }
                return input;
            }
            if (Boolean(input)) {
                return EditorFontVariations.TRANSLATE;
            }
            return EditorFontVariations.OFF;
        }
        compute(env, options, value) {
            // The value is computed from the fontWeight if it is true.
            // So take the result from env.fontInfo
            return env.fontInfo.fontVariationSettings;
        }
    }
    exports.EditorFontVariations = EditorFontVariations;
    //#endregion
    //#region fontInfo
    class EditorFontInfo extends ComputedEditorOption {
        constructor() {
            super(50 /* EditorOption.fontInfo */);
        }
        compute(env, options, _) {
            return env.fontInfo;
        }
    }
    //#endregion
    //#region fontSize
    class EditorFontSize extends SimpleEditorOption {
        constructor() {
            super(52 /* EditorOption.fontSize */, 'fontSize', exports.EDITOR_FONT_DEFAULTS.fontSize, {
                type: 'number',
                minimum: 6,
                maximum: 100,
                default: exports.EDITOR_FONT_DEFAULTS.fontSize,
                description: nls.localize('fontSize', "Controls the font size in pixels.")
            });
        }
        validate(input) {
            const r = EditorFloatOption.float(input, this.defaultValue);
            if (r === 0) {
                return exports.EDITOR_FONT_DEFAULTS.fontSize;
            }
            return EditorFloatOption.clamp(r, 6, 100);
        }
        compute(env, options, value) {
            // The final fontSize respects the editor zoom level.
            // So take the result from env.fontInfo
            return env.fontInfo.fontSize;
        }
    }
    //#endregion
    //#region fontWeight
    class EditorFontWeight extends BaseEditorOption {
        static { this.SUGGESTION_VALUES = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']; }
        static { this.MINIMUM_VALUE = 1; }
        static { this.MAXIMUM_VALUE = 1000; }
        constructor() {
            super(53 /* EditorOption.fontWeight */, 'fontWeight', exports.EDITOR_FONT_DEFAULTS.fontWeight, {
                anyOf: [
                    {
                        type: 'number',
                        minimum: EditorFontWeight.MINIMUM_VALUE,
                        maximum: EditorFontWeight.MAXIMUM_VALUE,
                        errorMessage: nls.localize('fontWeightErrorMessage', "Only \"normal\" and \"bold\" keywords or numbers between 1 and 1000 are allowed.")
                    },
                    {
                        type: 'string',
                        pattern: '^(normal|bold|1000|[1-9][0-9]{0,2})$'
                    },
                    {
                        enum: EditorFontWeight.SUGGESTION_VALUES
                    }
                ],
                default: exports.EDITOR_FONT_DEFAULTS.fontWeight,
                description: nls.localize('fontWeight', "Controls the font weight. Accepts \"normal\" and \"bold\" keywords or numbers between 1 and 1000.")
            });
        }
        validate(input) {
            if (input === 'normal' || input === 'bold') {
                return input;
            }
            return String(EditorIntOption.clampedInt(input, exports.EDITOR_FONT_DEFAULTS.fontWeight, EditorFontWeight.MINIMUM_VALUE, EditorFontWeight.MAXIMUM_VALUE));
        }
    }
    class EditorGoToLocation extends BaseEditorOption {
        constructor() {
            const defaults = {
                multiple: 'peek',
                multipleDefinitions: 'peek',
                multipleTypeDefinitions: 'peek',
                multipleDeclarations: 'peek',
                multipleImplementations: 'peek',
                multipleReferences: 'peek',
                alternativeDefinitionCommand: 'editor.action.goToReferences',
                alternativeTypeDefinitionCommand: 'editor.action.goToReferences',
                alternativeDeclarationCommand: 'editor.action.goToReferences',
                alternativeImplementationCommand: '',
                alternativeReferenceCommand: '',
            };
            const jsonSubset = {
                type: 'string',
                enum: ['peek', 'gotoAndPeek', 'goto'],
                default: defaults.multiple,
                enumDescriptions: [
                    nls.localize('editor.gotoLocation.multiple.peek', 'Show Peek view of the results (default)'),
                    nls.localize('editor.gotoLocation.multiple.gotoAndPeek', 'Go to the primary result and show a Peek view'),
                    nls.localize('editor.gotoLocation.multiple.goto', 'Go to the primary result and enable Peek-less navigation to others')
                ]
            };
            const alternativeCommandOptions = ['', 'editor.action.referenceSearch.trigger', 'editor.action.goToReferences', 'editor.action.peekImplementation', 'editor.action.goToImplementation', 'editor.action.peekTypeDefinition', 'editor.action.goToTypeDefinition', 'editor.action.peekDeclaration', 'editor.action.revealDeclaration', 'editor.action.peekDefinition', 'editor.action.revealDefinitionAside', 'editor.action.revealDefinition'];
            super(58 /* EditorOption.gotoLocation */, 'gotoLocation', defaults, {
                'editor.gotoLocation.multiple': {
                    deprecationMessage: nls.localize('editor.gotoLocation.multiple.deprecated', "This setting is deprecated, please use separate settings like 'editor.editor.gotoLocation.multipleDefinitions' or 'editor.editor.gotoLocation.multipleImplementations' instead."),
                },
                'editor.gotoLocation.multipleDefinitions': {
                    description: nls.localize('editor.editor.gotoLocation.multipleDefinitions', "Controls the behavior the 'Go to Definition'-command when multiple target locations exist."),
                    ...jsonSubset,
                },
                'editor.gotoLocation.multipleTypeDefinitions': {
                    description: nls.localize('editor.editor.gotoLocation.multipleTypeDefinitions', "Controls the behavior the 'Go to Type Definition'-command when multiple target locations exist."),
                    ...jsonSubset,
                },
                'editor.gotoLocation.multipleDeclarations': {
                    description: nls.localize('editor.editor.gotoLocation.multipleDeclarations', "Controls the behavior the 'Go to Declaration'-command when multiple target locations exist."),
                    ...jsonSubset,
                },
                'editor.gotoLocation.multipleImplementations': {
                    description: nls.localize('editor.editor.gotoLocation.multipleImplemenattions', "Controls the behavior the 'Go to Implementations'-command when multiple target locations exist."),
                    ...jsonSubset,
                },
                'editor.gotoLocation.multipleReferences': {
                    description: nls.localize('editor.editor.gotoLocation.multipleReferences', "Controls the behavior the 'Go to References'-command when multiple target locations exist."),
                    ...jsonSubset,
                },
                'editor.gotoLocation.alternativeDefinitionCommand': {
                    type: 'string',
                    default: defaults.alternativeDefinitionCommand,
                    enum: alternativeCommandOptions,
                    description: nls.localize('alternativeDefinitionCommand', "Alternative command id that is being executed when the result of 'Go to Definition' is the current location.")
                },
                'editor.gotoLocation.alternativeTypeDefinitionCommand': {
                    type: 'string',
                    default: defaults.alternativeTypeDefinitionCommand,
                    enum: alternativeCommandOptions,
                    description: nls.localize('alternativeTypeDefinitionCommand', "Alternative command id that is being executed when the result of 'Go to Type Definition' is the current location.")
                },
                'editor.gotoLocation.alternativeDeclarationCommand': {
                    type: 'string',
                    default: defaults.alternativeDeclarationCommand,
                    enum: alternativeCommandOptions,
                    description: nls.localize('alternativeDeclarationCommand', "Alternative command id that is being executed when the result of 'Go to Declaration' is the current location.")
                },
                'editor.gotoLocation.alternativeImplementationCommand': {
                    type: 'string',
                    default: defaults.alternativeImplementationCommand,
                    enum: alternativeCommandOptions,
                    description: nls.localize('alternativeImplementationCommand', "Alternative command id that is being executed when the result of 'Go to Implementation' is the current location.")
                },
                'editor.gotoLocation.alternativeReferenceCommand': {
                    type: 'string',
                    default: defaults.alternativeReferenceCommand,
                    enum: alternativeCommandOptions,
                    description: nls.localize('alternativeReferenceCommand', "Alternative command id that is being executed when the result of 'Go to Reference' is the current location.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                multiple: stringSet(input.multiple, this.defaultValue.multiple, ['peek', 'gotoAndPeek', 'goto']),
                multipleDefinitions: input.multipleDefinitions ?? stringSet(input.multipleDefinitions, 'peek', ['peek', 'gotoAndPeek', 'goto']),
                multipleTypeDefinitions: input.multipleTypeDefinitions ?? stringSet(input.multipleTypeDefinitions, 'peek', ['peek', 'gotoAndPeek', 'goto']),
                multipleDeclarations: input.multipleDeclarations ?? stringSet(input.multipleDeclarations, 'peek', ['peek', 'gotoAndPeek', 'goto']),
                multipleImplementations: input.multipleImplementations ?? stringSet(input.multipleImplementations, 'peek', ['peek', 'gotoAndPeek', 'goto']),
                multipleReferences: input.multipleReferences ?? stringSet(input.multipleReferences, 'peek', ['peek', 'gotoAndPeek', 'goto']),
                alternativeDefinitionCommand: EditorStringOption.string(input.alternativeDefinitionCommand, this.defaultValue.alternativeDefinitionCommand),
                alternativeTypeDefinitionCommand: EditorStringOption.string(input.alternativeTypeDefinitionCommand, this.defaultValue.alternativeTypeDefinitionCommand),
                alternativeDeclarationCommand: EditorStringOption.string(input.alternativeDeclarationCommand, this.defaultValue.alternativeDeclarationCommand),
                alternativeImplementationCommand: EditorStringOption.string(input.alternativeImplementationCommand, this.defaultValue.alternativeImplementationCommand),
                alternativeReferenceCommand: EditorStringOption.string(input.alternativeReferenceCommand, this.defaultValue.alternativeReferenceCommand),
            };
        }
    }
    class EditorHover extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: true,
                delay: 300,
                hidingDelay: 300,
                sticky: true,
                above: true,
            };
            super(60 /* EditorOption.hover */, 'hover', defaults, {
                'editor.hover.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('hover.enabled', "Controls whether the hover is shown.")
                },
                'editor.hover.delay': {
                    type: 'number',
                    default: defaults.delay,
                    minimum: 0,
                    maximum: 10000,
                    description: nls.localize('hover.delay', "Controls the delay in milliseconds after which the hover is shown.")
                },
                'editor.hover.sticky': {
                    type: 'boolean',
                    default: defaults.sticky,
                    description: nls.localize('hover.sticky', "Controls whether the hover should remain visible when mouse is moved over it.")
                },
                'editor.hover.hidingDelay': {
                    type: 'integer',
                    minimum: 0,
                    default: defaults.hidingDelay,
                    description: nls.localize('hover.hidingDelay', "Controls the delay in milliseconds after which the hover is hidden. Requires `editor.hover.sticky` to be enabled.")
                },
                'editor.hover.above': {
                    type: 'boolean',
                    default: defaults.above,
                    description: nls.localize('hover.above', "Prefer showing hovers above the line, if there's space.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                delay: EditorIntOption.clampedInt(input.delay, this.defaultValue.delay, 0, 10000),
                sticky: boolean(input.sticky, this.defaultValue.sticky),
                hidingDelay: EditorIntOption.clampedInt(input.hidingDelay, this.defaultValue.hidingDelay, 0, 600000),
                above: boolean(input.above, this.defaultValue.above),
            };
        }
    }
    var RenderMinimap;
    (function (RenderMinimap) {
        RenderMinimap[RenderMinimap["None"] = 0] = "None";
        RenderMinimap[RenderMinimap["Text"] = 1] = "Text";
        RenderMinimap[RenderMinimap["Blocks"] = 2] = "Blocks";
    })(RenderMinimap || (exports.RenderMinimap = RenderMinimap = {}));
    /**
     * @internal
     */
    class EditorLayoutInfoComputer extends ComputedEditorOption {
        constructor() {
            super(145 /* EditorOption.layoutInfo */);
        }
        compute(env, options, _) {
            return EditorLayoutInfoComputer.computeLayout(options, {
                memory: env.memory,
                outerWidth: env.outerWidth,
                outerHeight: env.outerHeight,
                isDominatedByLongLines: env.isDominatedByLongLines,
                lineHeight: env.fontInfo.lineHeight,
                viewLineCount: env.viewLineCount,
                lineNumbersDigitCount: env.lineNumbersDigitCount,
                typicalHalfwidthCharacterWidth: env.fontInfo.typicalHalfwidthCharacterWidth,
                maxDigitWidth: env.fontInfo.maxDigitWidth,
                pixelRatio: env.pixelRatio,
                glyphMarginDecorationLaneCount: env.glyphMarginDecorationLaneCount
            });
        }
        static computeContainedMinimapLineCount(input) {
            const typicalViewportLineCount = input.height / input.lineHeight;
            const extraLinesBeforeFirstLine = Math.floor(input.paddingTop / input.lineHeight);
            let extraLinesBeyondLastLine = Math.floor(input.paddingBottom / input.lineHeight);
            if (input.scrollBeyondLastLine) {
                extraLinesBeyondLastLine = Math.max(extraLinesBeyondLastLine, typicalViewportLineCount - 1);
            }
            const desiredRatio = (extraLinesBeforeFirstLine + input.viewLineCount + extraLinesBeyondLastLine) / (input.pixelRatio * input.height);
            const minimapLineCount = Math.floor(input.viewLineCount / desiredRatio);
            return { typicalViewportLineCount, extraLinesBeforeFirstLine, extraLinesBeyondLastLine, desiredRatio, minimapLineCount };
        }
        static _computeMinimapLayout(input, memory) {
            const outerWidth = input.outerWidth;
            const outerHeight = input.outerHeight;
            const pixelRatio = input.pixelRatio;
            if (!input.minimap.enabled) {
                return {
                    renderMinimap: 0 /* RenderMinimap.None */,
                    minimapLeft: 0,
                    minimapWidth: 0,
                    minimapHeightIsEditorHeight: false,
                    minimapIsSampling: false,
                    minimapScale: 1,
                    minimapLineHeight: 1,
                    minimapCanvasInnerWidth: 0,
                    minimapCanvasInnerHeight: Math.floor(pixelRatio * outerHeight),
                    minimapCanvasOuterWidth: 0,
                    minimapCanvasOuterHeight: outerHeight,
                };
            }
            // Can use memory if only the `viewLineCount` and `remainingWidth` have changed
            const stableMinimapLayoutInput = memory.stableMinimapLayoutInput;
            const couldUseMemory = (stableMinimapLayoutInput
                // && input.outerWidth === lastMinimapLayoutInput.outerWidth !!! INTENTIONAL OMITTED
                && input.outerHeight === stableMinimapLayoutInput.outerHeight
                && input.lineHeight === stableMinimapLayoutInput.lineHeight
                && input.typicalHalfwidthCharacterWidth === stableMinimapLayoutInput.typicalHalfwidthCharacterWidth
                && input.pixelRatio === stableMinimapLayoutInput.pixelRatio
                && input.scrollBeyondLastLine === stableMinimapLayoutInput.scrollBeyondLastLine
                && input.paddingTop === stableMinimapLayoutInput.paddingTop
                && input.paddingBottom === stableMinimapLayoutInput.paddingBottom
                && input.minimap.enabled === stableMinimapLayoutInput.minimap.enabled
                && input.minimap.side === stableMinimapLayoutInput.minimap.side
                && input.minimap.size === stableMinimapLayoutInput.minimap.size
                && input.minimap.showSlider === stableMinimapLayoutInput.minimap.showSlider
                && input.minimap.renderCharacters === stableMinimapLayoutInput.minimap.renderCharacters
                && input.minimap.maxColumn === stableMinimapLayoutInput.minimap.maxColumn
                && input.minimap.scale === stableMinimapLayoutInput.minimap.scale
                && input.verticalScrollbarWidth === stableMinimapLayoutInput.verticalScrollbarWidth
                // && input.viewLineCount === lastMinimapLayoutInput.viewLineCount !!! INTENTIONAL OMITTED
                // && input.remainingWidth === lastMinimapLayoutInput.remainingWidth !!! INTENTIONAL OMITTED
                && input.isViewportWrapping === stableMinimapLayoutInput.isViewportWrapping);
            const lineHeight = input.lineHeight;
            const typicalHalfwidthCharacterWidth = input.typicalHalfwidthCharacterWidth;
            const scrollBeyondLastLine = input.scrollBeyondLastLine;
            const minimapRenderCharacters = input.minimap.renderCharacters;
            let minimapScale = (pixelRatio >= 2 ? Math.round(input.minimap.scale * 2) : input.minimap.scale);
            const minimapMaxColumn = input.minimap.maxColumn;
            const minimapSize = input.minimap.size;
            const minimapSide = input.minimap.side;
            const verticalScrollbarWidth = input.verticalScrollbarWidth;
            const viewLineCount = input.viewLineCount;
            const remainingWidth = input.remainingWidth;
            const isViewportWrapping = input.isViewportWrapping;
            const baseCharHeight = minimapRenderCharacters ? 2 : 3;
            let minimapCanvasInnerHeight = Math.floor(pixelRatio * outerHeight);
            const minimapCanvasOuterHeight = minimapCanvasInnerHeight / pixelRatio;
            let minimapHeightIsEditorHeight = false;
            let minimapIsSampling = false;
            let minimapLineHeight = baseCharHeight * minimapScale;
            let minimapCharWidth = minimapScale / pixelRatio;
            let minimapWidthMultiplier = 1;
            if (minimapSize === 'fill' || minimapSize === 'fit') {
                const { typicalViewportLineCount, extraLinesBeforeFirstLine, extraLinesBeyondLastLine, desiredRatio, minimapLineCount } = EditorLayoutInfoComputer.computeContainedMinimapLineCount({
                    viewLineCount: viewLineCount,
                    scrollBeyondLastLine: scrollBeyondLastLine,
                    paddingTop: input.paddingTop,
                    paddingBottom: input.paddingBottom,
                    height: outerHeight,
                    lineHeight: lineHeight,
                    pixelRatio: pixelRatio
                });
                // ratio is intentionally not part of the layout to avoid the layout changing all the time
                // when doing sampling
                const ratio = viewLineCount / minimapLineCount;
                if (ratio > 1) {
                    minimapHeightIsEditorHeight = true;
                    minimapIsSampling = true;
                    minimapScale = 1;
                    minimapLineHeight = 1;
                    minimapCharWidth = minimapScale / pixelRatio;
                }
                else {
                    let fitBecomesFill = false;
                    let maxMinimapScale = minimapScale + 1;
                    if (minimapSize === 'fit') {
                        const effectiveMinimapHeight = Math.ceil((extraLinesBeforeFirstLine + viewLineCount + extraLinesBeyondLastLine) * minimapLineHeight);
                        if (isViewportWrapping && couldUseMemory && remainingWidth <= memory.stableFitRemainingWidth) {
                            // There is a loop when using `fit` and viewport wrapping:
                            // - view line count impacts minimap layout
                            // - minimap layout impacts viewport width
                            // - viewport width impacts view line count
                            // To break the loop, once we go to a smaller minimap scale, we try to stick with it.
                            fitBecomesFill = true;
                            maxMinimapScale = memory.stableFitMaxMinimapScale;
                        }
                        else {
                            fitBecomesFill = (effectiveMinimapHeight > minimapCanvasInnerHeight);
                        }
                    }
                    if (minimapSize === 'fill' || fitBecomesFill) {
                        minimapHeightIsEditorHeight = true;
                        const configuredMinimapScale = minimapScale;
                        minimapLineHeight = Math.min(lineHeight * pixelRatio, Math.max(1, Math.floor(1 / desiredRatio)));
                        if (isViewportWrapping && couldUseMemory && remainingWidth <= memory.stableFitRemainingWidth) {
                            // There is a loop when using `fill` and viewport wrapping:
                            // - view line count impacts minimap layout
                            // - minimap layout impacts viewport width
                            // - viewport width impacts view line count
                            // To break the loop, once we go to a smaller minimap scale, we try to stick with it.
                            maxMinimapScale = memory.stableFitMaxMinimapScale;
                        }
                        minimapScale = Math.min(maxMinimapScale, Math.max(1, Math.floor(minimapLineHeight / baseCharHeight)));
                        if (minimapScale > configuredMinimapScale) {
                            minimapWidthMultiplier = Math.min(2, minimapScale / configuredMinimapScale);
                        }
                        minimapCharWidth = minimapScale / pixelRatio / minimapWidthMultiplier;
                        minimapCanvasInnerHeight = Math.ceil((Math.max(typicalViewportLineCount, extraLinesBeforeFirstLine + viewLineCount + extraLinesBeyondLastLine)) * minimapLineHeight);
                        if (isViewportWrapping) {
                            // remember for next time
                            memory.stableMinimapLayoutInput = input;
                            memory.stableFitRemainingWidth = remainingWidth;
                            memory.stableFitMaxMinimapScale = minimapScale;
                        }
                        else {
                            memory.stableMinimapLayoutInput = null;
                            memory.stableFitRemainingWidth = 0;
                        }
                    }
                }
            }
            // Given:
            // (leaving 2px for the cursor to have space after the last character)
            // viewportColumn = (contentWidth - verticalScrollbarWidth - 2) / typicalHalfwidthCharacterWidth
            // minimapWidth = viewportColumn * minimapCharWidth
            // contentWidth = remainingWidth - minimapWidth
            // What are good values for contentWidth and minimapWidth ?
            // minimapWidth = ((contentWidth - verticalScrollbarWidth - 2) / typicalHalfwidthCharacterWidth) * minimapCharWidth
            // typicalHalfwidthCharacterWidth * minimapWidth = (contentWidth - verticalScrollbarWidth - 2) * minimapCharWidth
            // typicalHalfwidthCharacterWidth * minimapWidth = (remainingWidth - minimapWidth - verticalScrollbarWidth - 2) * minimapCharWidth
            // (typicalHalfwidthCharacterWidth + minimapCharWidth) * minimapWidth = (remainingWidth - verticalScrollbarWidth - 2) * minimapCharWidth
            // minimapWidth = ((remainingWidth - verticalScrollbarWidth - 2) * minimapCharWidth) / (typicalHalfwidthCharacterWidth + minimapCharWidth)
            const minimapMaxWidth = Math.floor(minimapMaxColumn * minimapCharWidth);
            const minimapWidth = Math.min(minimapMaxWidth, Math.max(0, Math.floor(((remainingWidth - verticalScrollbarWidth - 2) * minimapCharWidth) / (typicalHalfwidthCharacterWidth + minimapCharWidth))) + exports.MINIMAP_GUTTER_WIDTH);
            let minimapCanvasInnerWidth = Math.floor(pixelRatio * minimapWidth);
            const minimapCanvasOuterWidth = minimapCanvasInnerWidth / pixelRatio;
            minimapCanvasInnerWidth = Math.floor(minimapCanvasInnerWidth * minimapWidthMultiplier);
            const renderMinimap = (minimapRenderCharacters ? 1 /* RenderMinimap.Text */ : 2 /* RenderMinimap.Blocks */);
            const minimapLeft = (minimapSide === 'left' ? 0 : (outerWidth - minimapWidth - verticalScrollbarWidth));
            return {
                renderMinimap,
                minimapLeft,
                minimapWidth,
                minimapHeightIsEditorHeight,
                minimapIsSampling,
                minimapScale,
                minimapLineHeight,
                minimapCanvasInnerWidth,
                minimapCanvasInnerHeight,
                minimapCanvasOuterWidth,
                minimapCanvasOuterHeight,
            };
        }
        static computeLayout(options, env) {
            const outerWidth = env.outerWidth | 0;
            const outerHeight = env.outerHeight | 0;
            const lineHeight = env.lineHeight | 0;
            const lineNumbersDigitCount = env.lineNumbersDigitCount | 0;
            const typicalHalfwidthCharacterWidth = env.typicalHalfwidthCharacterWidth;
            const maxDigitWidth = env.maxDigitWidth;
            const pixelRatio = env.pixelRatio;
            const viewLineCount = env.viewLineCount;
            const wordWrapOverride2 = options.get(137 /* EditorOption.wordWrapOverride2 */);
            const wordWrapOverride1 = (wordWrapOverride2 === 'inherit' ? options.get(136 /* EditorOption.wordWrapOverride1 */) : wordWrapOverride2);
            const wordWrap = (wordWrapOverride1 === 'inherit' ? options.get(132 /* EditorOption.wordWrap */) : wordWrapOverride1);
            const wordWrapColumn = options.get(135 /* EditorOption.wordWrapColumn */);
            const isDominatedByLongLines = env.isDominatedByLongLines;
            const showGlyphMargin = options.get(57 /* EditorOption.glyphMargin */);
            const showLineNumbers = (options.get(68 /* EditorOption.lineNumbers */).renderType !== 0 /* RenderLineNumbersType.Off */);
            const lineNumbersMinChars = options.get(69 /* EditorOption.lineNumbersMinChars */);
            const scrollBeyondLastLine = options.get(105 /* EditorOption.scrollBeyondLastLine */);
            const padding = options.get(84 /* EditorOption.padding */);
            const minimap = options.get(73 /* EditorOption.minimap */);
            const scrollbar = options.get(103 /* EditorOption.scrollbar */);
            const verticalScrollbarWidth = scrollbar.verticalScrollbarSize;
            const verticalScrollbarHasArrows = scrollbar.verticalHasArrows;
            const scrollbarArrowSize = scrollbar.arrowSize;
            const horizontalScrollbarHeight = scrollbar.horizontalScrollbarSize;
            const folding = options.get(43 /* EditorOption.folding */);
            const showFoldingDecoration = options.get(110 /* EditorOption.showFoldingControls */) !== 'never';
            let lineDecorationsWidth = options.get(66 /* EditorOption.lineDecorationsWidth */);
            if (folding && showFoldingDecoration) {
                lineDecorationsWidth += 16;
            }
            let lineNumbersWidth = 0;
            if (showLineNumbers) {
                const digitCount = Math.max(lineNumbersDigitCount, lineNumbersMinChars);
                lineNumbersWidth = Math.round(digitCount * maxDigitWidth);
            }
            let glyphMarginWidth = 0;
            if (showGlyphMargin) {
                glyphMarginWidth = lineHeight * env.glyphMarginDecorationLaneCount;
            }
            let glyphMarginLeft = 0;
            let lineNumbersLeft = glyphMarginLeft + glyphMarginWidth;
            let decorationsLeft = lineNumbersLeft + lineNumbersWidth;
            let contentLeft = decorationsLeft + lineDecorationsWidth;
            const remainingWidth = outerWidth - glyphMarginWidth - lineNumbersWidth - lineDecorationsWidth;
            let isWordWrapMinified = false;
            let isViewportWrapping = false;
            let wrappingColumn = -1;
            if (wordWrapOverride1 === 'inherit' && isDominatedByLongLines) {
                // Force viewport width wrapping if model is dominated by long lines
                isWordWrapMinified = true;
                isViewportWrapping = true;
            }
            else if (wordWrap === 'on' || wordWrap === 'bounded') {
                isViewportWrapping = true;
            }
            else if (wordWrap === 'wordWrapColumn') {
                wrappingColumn = wordWrapColumn;
            }
            const minimapLayout = EditorLayoutInfoComputer._computeMinimapLayout({
                outerWidth: outerWidth,
                outerHeight: outerHeight,
                lineHeight: lineHeight,
                typicalHalfwidthCharacterWidth: typicalHalfwidthCharacterWidth,
                pixelRatio: pixelRatio,
                scrollBeyondLastLine: scrollBeyondLastLine,
                paddingTop: padding.top,
                paddingBottom: padding.bottom,
                minimap: minimap,
                verticalScrollbarWidth: verticalScrollbarWidth,
                viewLineCount: viewLineCount,
                remainingWidth: remainingWidth,
                isViewportWrapping: isViewportWrapping,
            }, env.memory || new ComputeOptionsMemory());
            if (minimapLayout.renderMinimap !== 0 /* RenderMinimap.None */ && minimapLayout.minimapLeft === 0) {
                // the minimap is rendered to the left, so move everything to the right
                glyphMarginLeft += minimapLayout.minimapWidth;
                lineNumbersLeft += minimapLayout.minimapWidth;
                decorationsLeft += minimapLayout.minimapWidth;
                contentLeft += minimapLayout.minimapWidth;
            }
            const contentWidth = remainingWidth - minimapLayout.minimapWidth;
            // (leaving 2px for the cursor to have space after the last character)
            const viewportColumn = Math.max(1, Math.floor((contentWidth - verticalScrollbarWidth - 2) / typicalHalfwidthCharacterWidth));
            const verticalArrowSize = (verticalScrollbarHasArrows ? scrollbarArrowSize : 0);
            if (isViewportWrapping) {
                // compute the actual wrappingColumn
                wrappingColumn = Math.max(1, viewportColumn);
                if (wordWrap === 'bounded') {
                    wrappingColumn = Math.min(wrappingColumn, wordWrapColumn);
                }
            }
            return {
                width: outerWidth,
                height: outerHeight,
                glyphMarginLeft: glyphMarginLeft,
                glyphMarginWidth: glyphMarginWidth,
                glyphMarginDecorationLaneCount: env.glyphMarginDecorationLaneCount,
                lineNumbersLeft: lineNumbersLeft,
                lineNumbersWidth: lineNumbersWidth,
                decorationsLeft: decorationsLeft,
                decorationsWidth: lineDecorationsWidth,
                contentLeft: contentLeft,
                contentWidth: contentWidth,
                minimap: minimapLayout,
                viewportColumn: viewportColumn,
                isWordWrapMinified: isWordWrapMinified,
                isViewportWrapping: isViewportWrapping,
                wrappingColumn: wrappingColumn,
                verticalScrollbarWidth: verticalScrollbarWidth,
                horizontalScrollbarHeight: horizontalScrollbarHeight,
                overviewRuler: {
                    top: verticalArrowSize,
                    width: verticalScrollbarWidth,
                    height: (outerHeight - 2 * verticalArrowSize),
                    right: 0
                }
            };
        }
    }
    exports.EditorLayoutInfoComputer = EditorLayoutInfoComputer;
    //#endregion
    //#region WrappingStrategy
    class WrappingStrategy extends BaseEditorOption {
        constructor() {
            super(139 /* EditorOption.wrappingStrategy */, 'wrappingStrategy', 'simple', {
                'editor.wrappingStrategy': {
                    enumDescriptions: [
                        nls.localize('wrappingStrategy.simple', "Assumes that all characters are of the same width. This is a fast algorithm that works correctly for monospace fonts and certain scripts (like Latin characters) where glyphs are of equal width."),
                        nls.localize('wrappingStrategy.advanced', "Delegates wrapping points computation to the browser. This is a slow algorithm, that might cause freezes for large files, but it works correctly in all cases.")
                    ],
                    type: 'string',
                    enum: ['simple', 'advanced'],
                    default: 'simple',
                    description: nls.localize('wrappingStrategy', "Controls the algorithm that computes wrapping points. Note that when in accessibility mode, advanced will be used for the best experience.")
                }
            });
        }
        validate(input) {
            return stringSet(input, 'simple', ['simple', 'advanced']);
        }
        compute(env, options, value) {
            const accessibilitySupport = options.get(2 /* EditorOption.accessibilitySupport */);
            if (accessibilitySupport === 2 /* AccessibilitySupport.Enabled */) {
                // if we know for a fact that a screen reader is attached, we switch our strategy to advanced to
                // help that the editor's wrapping points match the textarea's wrapping points
                return 'advanced';
            }
            return value;
        }
    }
    //#endregion
    //#region lightbulb
    var ShowLightbulbIconMode;
    (function (ShowLightbulbIconMode) {
        ShowLightbulbIconMode["Off"] = "off";
        ShowLightbulbIconMode["OnCode"] = "onCode";
        ShowLightbulbIconMode["On"] = "on";
    })(ShowLightbulbIconMode || (exports.ShowLightbulbIconMode = ShowLightbulbIconMode = {}));
    class EditorLightbulb extends BaseEditorOption {
        constructor() {
            const defaults = { enabled: ShowLightbulbIconMode.On };
            super(65 /* EditorOption.lightbulb */, 'lightbulb', defaults, {
                'editor.lightbulb.enabled': {
                    type: 'string',
                    tags: ['experimental'],
                    enum: [ShowLightbulbIconMode.Off, ShowLightbulbIconMode.OnCode, ShowLightbulbIconMode.On],
                    default: defaults.enabled,
                    enumDescriptions: [
                        nls.localize('editor.lightbulb.enabled.off', 'Disable the code action menu.'),
                        nls.localize('editor.lightbulb.enabled.onCode', 'Show the code action menu when the cursor is on lines with code.'),
                        nls.localize('editor.lightbulb.enabled.on', 'Show the code action menu when the cursor is on lines with code or on empty lines.'),
                    ],
                    description: nls.localize('enabled', "Enables the Code Action lightbulb in the editor.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: stringSet(input.enabled, this.defaultValue.enabled, [ShowLightbulbIconMode.Off, ShowLightbulbIconMode.OnCode, ShowLightbulbIconMode.On])
            };
        }
    }
    class EditorStickyScroll extends BaseEditorOption {
        constructor() {
            const defaults = { enabled: true, maxLineCount: 5, defaultModel: 'outlineModel', scrollWithEditor: true };
            super(115 /* EditorOption.stickyScroll */, 'stickyScroll', defaults, {
                'editor.stickyScroll.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('editor.stickyScroll.enabled', "Shows the nested current scopes during the scroll at the top of the editor."),
                    tags: ['experimental']
                },
                'editor.stickyScroll.maxLineCount': {
                    type: 'number',
                    default: defaults.maxLineCount,
                    minimum: 1,
                    maximum: 20,
                    description: nls.localize('editor.stickyScroll.maxLineCount', "Defines the maximum number of sticky lines to show.")
                },
                'editor.stickyScroll.defaultModel': {
                    type: 'string',
                    enum: ['outlineModel', 'foldingProviderModel', 'indentationModel'],
                    default: defaults.defaultModel,
                    description: nls.localize('editor.stickyScroll.defaultModel', "Defines the model to use for determining which lines to stick. If the outline model does not exist, it will fall back on the folding provider model which falls back on the indentation model. This order is respected in all three cases.")
                },
                'editor.stickyScroll.scrollWithEditor': {
                    type: 'boolean',
                    default: defaults.scrollWithEditor,
                    description: nls.localize('editor.stickyScroll.scrollWithEditor', "Enable scrolling of Sticky Scroll with the editor's horizontal scrollbar.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                maxLineCount: EditorIntOption.clampedInt(input.maxLineCount, this.defaultValue.maxLineCount, 1, 20),
                defaultModel: stringSet(input.defaultModel, this.defaultValue.defaultModel, ['outlineModel', 'foldingProviderModel', 'indentationModel']),
                scrollWithEditor: boolean(input.scrollWithEditor, this.defaultValue.scrollWithEditor)
            };
        }
    }
    class EditorInlayHints extends BaseEditorOption {
        constructor() {
            const defaults = { enabled: 'on', fontSize: 0, fontFamily: '', padding: false };
            super(141 /* EditorOption.inlayHints */, 'inlayHints', defaults, {
                'editor.inlayHints.enabled': {
                    type: 'string',
                    default: defaults.enabled,
                    description: nls.localize('inlayHints.enable', "Enables the inlay hints in the editor."),
                    enum: ['on', 'onUnlessPressed', 'offUnlessPressed', 'off'],
                    markdownEnumDescriptions: [
                        nls.localize('editor.inlayHints.on', "Inlay hints are enabled"),
                        nls.localize('editor.inlayHints.onUnlessPressed', "Inlay hints are showing by default and hide when holding {0}", platform.isMacintosh ? `Ctrl+Option` : `Ctrl+Alt`),
                        nls.localize('editor.inlayHints.offUnlessPressed', "Inlay hints are hidden by default and show when holding {0}", platform.isMacintosh ? `Ctrl+Option` : `Ctrl+Alt`),
                        nls.localize('editor.inlayHints.off', "Inlay hints are disabled"),
                    ],
                },
                'editor.inlayHints.fontSize': {
                    type: 'number',
                    default: defaults.fontSize,
                    markdownDescription: nls.localize('inlayHints.fontSize', "Controls font size of inlay hints in the editor. As default the {0} is used when the configured value is less than {1} or greater than the editor font size.", '`#editor.fontSize#`', '`5`')
                },
                'editor.inlayHints.fontFamily': {
                    type: 'string',
                    default: defaults.fontFamily,
                    markdownDescription: nls.localize('inlayHints.fontFamily', "Controls font family of inlay hints in the editor. When set to empty, the {0} is used.", '`#editor.fontFamily#`')
                },
                'editor.inlayHints.padding': {
                    type: 'boolean',
                    default: defaults.padding,
                    description: nls.localize('inlayHints.padding', "Enables the padding around the inlay hints in the editor.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            if (typeof input.enabled === 'boolean') {
                input.enabled = input.enabled ? 'on' : 'off';
            }
            return {
                enabled: stringSet(input.enabled, this.defaultValue.enabled, ['on', 'off', 'offUnlessPressed', 'onUnlessPressed']),
                fontSize: EditorIntOption.clampedInt(input.fontSize, this.defaultValue.fontSize, 0, 100),
                fontFamily: EditorStringOption.string(input.fontFamily, this.defaultValue.fontFamily),
                padding: boolean(input.padding, this.defaultValue.padding)
            };
        }
    }
    //#endregion
    //#region lineDecorationsWidth
    class EditorLineDecorationsWidth extends BaseEditorOption {
        constructor() {
            super(66 /* EditorOption.lineDecorationsWidth */, 'lineDecorationsWidth', 10);
        }
        validate(input) {
            if (typeof input === 'string' && /^\d+(\.\d+)?ch$/.test(input)) {
                const multiple = parseFloat(input.substring(0, input.length - 2));
                return -multiple; // negative numbers signal a multiple
            }
            else {
                return EditorIntOption.clampedInt(input, this.defaultValue, 0, 1000);
            }
        }
        compute(env, options, value) {
            if (value < 0) {
                // negative numbers signal a multiple
                return EditorIntOption.clampedInt(-value * env.fontInfo.typicalHalfwidthCharacterWidth, this.defaultValue, 0, 1000);
            }
            else {
                return value;
            }
        }
    }
    //#endregion
    //#region lineHeight
    class EditorLineHeight extends EditorFloatOption {
        constructor() {
            super(67 /* EditorOption.lineHeight */, 'lineHeight', exports.EDITOR_FONT_DEFAULTS.lineHeight, x => EditorFloatOption.clamp(x, 0, 150), { markdownDescription: nls.localize('lineHeight', "Controls the line height. \n - Use 0 to automatically compute the line height from the font size.\n - Values between 0 and 8 will be used as a multiplier with the font size.\n - Values greater than or equal to 8 will be used as effective values.") });
        }
        compute(env, options, value) {
            // The lineHeight is computed from the fontSize if it is 0.
            // Moreover, the final lineHeight respects the editor zoom level.
            // So take the result from env.fontInfo
            return env.fontInfo.lineHeight;
        }
    }
    class EditorMinimap extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: true,
                size: 'proportional',
                side: 'right',
                showSlider: 'mouseover',
                autohide: false,
                renderCharacters: true,
                maxColumn: 120,
                scale: 1,
                showRegionSectionHeaders: true,
                showMarkSectionHeaders: true,
                sectionHeaderFontSize: 9,
            };
            super(73 /* EditorOption.minimap */, 'minimap', defaults, {
                'editor.minimap.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('minimap.enabled', "Controls whether the minimap is shown.")
                },
                'editor.minimap.autohide': {
                    type: 'boolean',
                    default: defaults.autohide,
                    description: nls.localize('minimap.autohide', "Controls whether the minimap is hidden automatically.")
                },
                'editor.minimap.size': {
                    type: 'string',
                    enum: ['proportional', 'fill', 'fit'],
                    enumDescriptions: [
                        nls.localize('minimap.size.proportional', "The minimap has the same size as the editor contents (and might scroll)."),
                        nls.localize('minimap.size.fill', "The minimap will stretch or shrink as necessary to fill the height of the editor (no scrolling)."),
                        nls.localize('minimap.size.fit', "The minimap will shrink as necessary to never be larger than the editor (no scrolling)."),
                    ],
                    default: defaults.size,
                    description: nls.localize('minimap.size', "Controls the size of the minimap.")
                },
                'editor.minimap.side': {
                    type: 'string',
                    enum: ['left', 'right'],
                    default: defaults.side,
                    description: nls.localize('minimap.side', "Controls the side where to render the minimap.")
                },
                'editor.minimap.showSlider': {
                    type: 'string',
                    enum: ['always', 'mouseover'],
                    default: defaults.showSlider,
                    description: nls.localize('minimap.showSlider', "Controls when the minimap slider is shown.")
                },
                'editor.minimap.scale': {
                    type: 'number',
                    default: defaults.scale,
                    minimum: 1,
                    maximum: 3,
                    enum: [1, 2, 3],
                    description: nls.localize('minimap.scale', "Scale of content drawn in the minimap: 1, 2 or 3.")
                },
                'editor.minimap.renderCharacters': {
                    type: 'boolean',
                    default: defaults.renderCharacters,
                    description: nls.localize('minimap.renderCharacters', "Render the actual characters on a line as opposed to color blocks.")
                },
                'editor.minimap.maxColumn': {
                    type: 'number',
                    default: defaults.maxColumn,
                    description: nls.localize('minimap.maxColumn', "Limit the width of the minimap to render at most a certain number of columns.")
                },
                'editor.minimap.showRegionSectionHeaders': {
                    type: 'boolean',
                    default: defaults.showRegionSectionHeaders,
                    description: nls.localize('minimap.showRegionSectionHeaders', "Controls whether named regions are shown as section headers in the minimap.")
                },
                'editor.minimap.showMarkSectionHeaders': {
                    type: 'boolean',
                    default: defaults.showMarkSectionHeaders,
                    description: nls.localize('minimap.showMarkSectionHeaders', "Controls whether MARK: comments are shown as section headers in the minimap.")
                },
                'editor.minimap.sectionHeaderFontSize': {
                    type: 'number',
                    default: defaults.sectionHeaderFontSize,
                    description: nls.localize('minimap.sectionHeaderFontSize', "Controls the font size of section headers in the minimap.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                autohide: boolean(input.autohide, this.defaultValue.autohide),
                size: stringSet(input.size, this.defaultValue.size, ['proportional', 'fill', 'fit']),
                side: stringSet(input.side, this.defaultValue.side, ['right', 'left']),
                showSlider: stringSet(input.showSlider, this.defaultValue.showSlider, ['always', 'mouseover']),
                renderCharacters: boolean(input.renderCharacters, this.defaultValue.renderCharacters),
                scale: EditorIntOption.clampedInt(input.scale, 1, 1, 3),
                maxColumn: EditorIntOption.clampedInt(input.maxColumn, this.defaultValue.maxColumn, 1, 10000),
                showRegionSectionHeaders: boolean(input.showRegionSectionHeaders, this.defaultValue.showRegionSectionHeaders),
                showMarkSectionHeaders: boolean(input.showMarkSectionHeaders, this.defaultValue.showMarkSectionHeaders),
                sectionHeaderFontSize: EditorFloatOption.clamp(input.sectionHeaderFontSize ?? this.defaultValue.sectionHeaderFontSize, 4, 32),
            };
        }
    }
    //#endregion
    //#region multiCursorModifier
    function _multiCursorModifierFromString(multiCursorModifier) {
        if (multiCursorModifier === 'ctrlCmd') {
            return (platform.isMacintosh ? 'metaKey' : 'ctrlKey');
        }
        return 'altKey';
    }
    class EditorPadding extends BaseEditorOption {
        constructor() {
            super(84 /* EditorOption.padding */, 'padding', { top: 0, bottom: 0 }, {
                'editor.padding.top': {
                    type: 'number',
                    default: 0,
                    minimum: 0,
                    maximum: 1000,
                    description: nls.localize('padding.top', "Controls the amount of space between the top edge of the editor and the first line.")
                },
                'editor.padding.bottom': {
                    type: 'number',
                    default: 0,
                    minimum: 0,
                    maximum: 1000,
                    description: nls.localize('padding.bottom', "Controls the amount of space between the bottom edge of the editor and the last line.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                top: EditorIntOption.clampedInt(input.top, 0, 0, 1000),
                bottom: EditorIntOption.clampedInt(input.bottom, 0, 0, 1000)
            };
        }
    }
    class EditorParameterHints extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: true,
                cycle: true
            };
            super(86 /* EditorOption.parameterHints */, 'parameterHints', defaults, {
                'editor.parameterHints.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('parameterHints.enabled', "Enables a pop-up that shows parameter documentation and type information as you type.")
                },
                'editor.parameterHints.cycle': {
                    type: 'boolean',
                    default: defaults.cycle,
                    description: nls.localize('parameterHints.cycle', "Controls whether the parameter hints menu cycles or closes when reaching the end of the list.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                cycle: boolean(input.cycle, this.defaultValue.cycle)
            };
        }
    }
    //#endregion
    //#region pixelRatio
    class EditorPixelRatio extends ComputedEditorOption {
        constructor() {
            super(143 /* EditorOption.pixelRatio */);
        }
        compute(env, options, _) {
            return env.pixelRatio;
        }
    }
    class EditorQuickSuggestions extends BaseEditorOption {
        constructor() {
            const defaults = {
                other: 'on',
                comments: 'off',
                strings: 'off'
            };
            const types = [
                { type: 'boolean' },
                {
                    type: 'string',
                    enum: ['on', 'inline', 'off'],
                    enumDescriptions: [nls.localize('on', "Quick suggestions show inside the suggest widget"), nls.localize('inline', "Quick suggestions show as ghost text"), nls.localize('off', "Quick suggestions are disabled")]
                }
            ];
            super(89 /* EditorOption.quickSuggestions */, 'quickSuggestions', defaults, {
                type: 'object',
                additionalProperties: false,
                properties: {
                    strings: {
                        anyOf: types,
                        default: defaults.strings,
                        description: nls.localize('quickSuggestions.strings', "Enable quick suggestions inside strings.")
                    },
                    comments: {
                        anyOf: types,
                        default: defaults.comments,
                        description: nls.localize('quickSuggestions.comments', "Enable quick suggestions inside comments.")
                    },
                    other: {
                        anyOf: types,
                        default: defaults.other,
                        description: nls.localize('quickSuggestions.other', "Enable quick suggestions outside of strings and comments.")
                    },
                },
                default: defaults,
                markdownDescription: nls.localize('quickSuggestions', "Controls whether suggestions should automatically show up while typing. This can be controlled for typing in comments, strings, and other code. Quick suggestion can be configured to show as ghost text or with the suggest widget. Also be aware of the '{0}'-setting which controls if suggestions are triggered by special characters.", `#editor.suggestOnTriggerCharacters#`)
            });
            this.defaultValue = defaults;
        }
        validate(input) {
            if (typeof input === 'boolean') {
                // boolean -> all on/off
                const value = input ? 'on' : 'off';
                return { comments: value, strings: value, other: value };
            }
            if (!input || typeof input !== 'object') {
                // invalid object
                return this.defaultValue;
            }
            const { other, comments, strings } = input;
            const allowedValues = ['on', 'inline', 'off'];
            let validatedOther;
            let validatedComments;
            let validatedStrings;
            if (typeof other === 'boolean') {
                validatedOther = other ? 'on' : 'off';
            }
            else {
                validatedOther = stringSet(other, this.defaultValue.other, allowedValues);
            }
            if (typeof comments === 'boolean') {
                validatedComments = comments ? 'on' : 'off';
            }
            else {
                validatedComments = stringSet(comments, this.defaultValue.comments, allowedValues);
            }
            if (typeof strings === 'boolean') {
                validatedStrings = strings ? 'on' : 'off';
            }
            else {
                validatedStrings = stringSet(strings, this.defaultValue.strings, allowedValues);
            }
            return {
                other: validatedOther,
                comments: validatedComments,
                strings: validatedStrings
            };
        }
    }
    var RenderLineNumbersType;
    (function (RenderLineNumbersType) {
        RenderLineNumbersType[RenderLineNumbersType["Off"] = 0] = "Off";
        RenderLineNumbersType[RenderLineNumbersType["On"] = 1] = "On";
        RenderLineNumbersType[RenderLineNumbersType["Relative"] = 2] = "Relative";
        RenderLineNumbersType[RenderLineNumbersType["Interval"] = 3] = "Interval";
        RenderLineNumbersType[RenderLineNumbersType["Custom"] = 4] = "Custom";
    })(RenderLineNumbersType || (exports.RenderLineNumbersType = RenderLineNumbersType = {}));
    class EditorRenderLineNumbersOption extends BaseEditorOption {
        constructor() {
            super(68 /* EditorOption.lineNumbers */, 'lineNumbers', { renderType: 1 /* RenderLineNumbersType.On */, renderFn: null }, {
                type: 'string',
                enum: ['off', 'on', 'relative', 'interval'],
                enumDescriptions: [
                    nls.localize('lineNumbers.off', "Line numbers are not rendered."),
                    nls.localize('lineNumbers.on', "Line numbers are rendered as absolute number."),
                    nls.localize('lineNumbers.relative', "Line numbers are rendered as distance in lines to cursor position."),
                    nls.localize('lineNumbers.interval', "Line numbers are rendered every 10 lines.")
                ],
                default: 'on',
                description: nls.localize('lineNumbers', "Controls the display of line numbers.")
            });
        }
        validate(lineNumbers) {
            let renderType = this.defaultValue.renderType;
            let renderFn = this.defaultValue.renderFn;
            if (typeof lineNumbers !== 'undefined') {
                if (typeof lineNumbers === 'function') {
                    renderType = 4 /* RenderLineNumbersType.Custom */;
                    renderFn = lineNumbers;
                }
                else if (lineNumbers === 'interval') {
                    renderType = 3 /* RenderLineNumbersType.Interval */;
                }
                else if (lineNumbers === 'relative') {
                    renderType = 2 /* RenderLineNumbersType.Relative */;
                }
                else if (lineNumbers === 'on') {
                    renderType = 1 /* RenderLineNumbersType.On */;
                }
                else {
                    renderType = 0 /* RenderLineNumbersType.Off */;
                }
            }
            return {
                renderType,
                renderFn
            };
        }
    }
    //#endregion
    //#region renderValidationDecorations
    /**
     * @internal
     */
    function filterValidationDecorations(options) {
        const renderValidationDecorations = options.get(98 /* EditorOption.renderValidationDecorations */);
        if (renderValidationDecorations === 'editable') {
            return options.get(91 /* EditorOption.readOnly */);
        }
        return renderValidationDecorations === 'on' ? false : true;
    }
    class EditorRulers extends BaseEditorOption {
        constructor() {
            const defaults = [];
            const columnSchema = { type: 'number', description: nls.localize('rulers.size', "Number of monospace characters at which this editor ruler will render.") };
            super(102 /* EditorOption.rulers */, 'rulers', defaults, {
                type: 'array',
                items: {
                    anyOf: [
                        columnSchema,
                        {
                            type: [
                                'object'
                            ],
                            properties: {
                                column: columnSchema,
                                color: {
                                    type: 'string',
                                    description: nls.localize('rulers.color', "Color of this editor ruler."),
                                    format: 'color-hex'
                                }
                            }
                        }
                    ]
                },
                default: defaults,
                description: nls.localize('rulers', "Render vertical rulers after a certain number of monospace characters. Use multiple values for multiple rulers. No rulers are drawn if array is empty.")
            });
        }
        validate(input) {
            if (Array.isArray(input)) {
                const rulers = [];
                for (const _element of input) {
                    if (typeof _element === 'number') {
                        rulers.push({
                            column: EditorIntOption.clampedInt(_element, 0, 0, 10000),
                            color: null
                        });
                    }
                    else if (_element && typeof _element === 'object') {
                        const element = _element;
                        rulers.push({
                            column: EditorIntOption.clampedInt(element.column, 0, 0, 10000),
                            color: element.color
                        });
                    }
                }
                rulers.sort((a, b) => a.column - b.column);
                return rulers;
            }
            return this.defaultValue;
        }
    }
    //#endregion
    //#region readonly
    /**
     * Configuration options for readonly message
     */
    class ReadonlyMessage extends BaseEditorOption {
        constructor() {
            const defaults = undefined;
            super(92 /* EditorOption.readOnlyMessage */, 'readOnlyMessage', defaults);
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            return _input;
        }
    }
    function _scrollbarVisibilityFromString(visibility, defaultValue) {
        if (typeof visibility !== 'string') {
            return defaultValue;
        }
        switch (visibility) {
            case 'hidden': return 2 /* ScrollbarVisibility.Hidden */;
            case 'visible': return 3 /* ScrollbarVisibility.Visible */;
            default: return 1 /* ScrollbarVisibility.Auto */;
        }
    }
    class EditorScrollbar extends BaseEditorOption {
        constructor() {
            const defaults = {
                vertical: 1 /* ScrollbarVisibility.Auto */,
                horizontal: 1 /* ScrollbarVisibility.Auto */,
                arrowSize: 11,
                useShadows: true,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                horizontalScrollbarSize: 12,
                horizontalSliderSize: 12,
                verticalScrollbarSize: 14,
                verticalSliderSize: 14,
                handleMouseWheel: true,
                alwaysConsumeMouseWheel: true,
                scrollByPage: false,
                ignoreHorizontalScrollbarInContentHeight: false,
            };
            super(103 /* EditorOption.scrollbar */, 'scrollbar', defaults, {
                'editor.scrollbar.vertical': {
                    type: 'string',
                    enum: ['auto', 'visible', 'hidden'],
                    enumDescriptions: [
                        nls.localize('scrollbar.vertical.auto', "The vertical scrollbar will be visible only when necessary."),
                        nls.localize('scrollbar.vertical.visible', "The vertical scrollbar will always be visible."),
                        nls.localize('scrollbar.vertical.fit', "The vertical scrollbar will always be hidden."),
                    ],
                    default: 'auto',
                    description: nls.localize('scrollbar.vertical', "Controls the visibility of the vertical scrollbar.")
                },
                'editor.scrollbar.horizontal': {
                    type: 'string',
                    enum: ['auto', 'visible', 'hidden'],
                    enumDescriptions: [
                        nls.localize('scrollbar.horizontal.auto', "The horizontal scrollbar will be visible only when necessary."),
                        nls.localize('scrollbar.horizontal.visible', "The horizontal scrollbar will always be visible."),
                        nls.localize('scrollbar.horizontal.fit', "The horizontal scrollbar will always be hidden."),
                    ],
                    default: 'auto',
                    description: nls.localize('scrollbar.horizontal', "Controls the visibility of the horizontal scrollbar.")
                },
                'editor.scrollbar.verticalScrollbarSize': {
                    type: 'number',
                    default: defaults.verticalScrollbarSize,
                    description: nls.localize('scrollbar.verticalScrollbarSize', "The width of the vertical scrollbar.")
                },
                'editor.scrollbar.horizontalScrollbarSize': {
                    type: 'number',
                    default: defaults.horizontalScrollbarSize,
                    description: nls.localize('scrollbar.horizontalScrollbarSize', "The height of the horizontal scrollbar.")
                },
                'editor.scrollbar.scrollByPage': {
                    type: 'boolean',
                    default: defaults.scrollByPage,
                    description: nls.localize('scrollbar.scrollByPage', "Controls whether clicks scroll by page or jump to click position.")
                },
                'editor.scrollbar.ignoreHorizontalScrollbarInContentHeight': {
                    type: 'boolean',
                    default: defaults.ignoreHorizontalScrollbarInContentHeight,
                    description: nls.localize('scrollbar.ignoreHorizontalScrollbarInContentHeight', "When set, the horizontal scrollbar will not increase the size of the editor's content.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            const horizontalScrollbarSize = EditorIntOption.clampedInt(input.horizontalScrollbarSize, this.defaultValue.horizontalScrollbarSize, 0, 1000);
            const verticalScrollbarSize = EditorIntOption.clampedInt(input.verticalScrollbarSize, this.defaultValue.verticalScrollbarSize, 0, 1000);
            return {
                arrowSize: EditorIntOption.clampedInt(input.arrowSize, this.defaultValue.arrowSize, 0, 1000),
                vertical: _scrollbarVisibilityFromString(input.vertical, this.defaultValue.vertical),
                horizontal: _scrollbarVisibilityFromString(input.horizontal, this.defaultValue.horizontal),
                useShadows: boolean(input.useShadows, this.defaultValue.useShadows),
                verticalHasArrows: boolean(input.verticalHasArrows, this.defaultValue.verticalHasArrows),
                horizontalHasArrows: boolean(input.horizontalHasArrows, this.defaultValue.horizontalHasArrows),
                handleMouseWheel: boolean(input.handleMouseWheel, this.defaultValue.handleMouseWheel),
                alwaysConsumeMouseWheel: boolean(input.alwaysConsumeMouseWheel, this.defaultValue.alwaysConsumeMouseWheel),
                horizontalScrollbarSize: horizontalScrollbarSize,
                horizontalSliderSize: EditorIntOption.clampedInt(input.horizontalSliderSize, horizontalScrollbarSize, 0, 1000),
                verticalScrollbarSize: verticalScrollbarSize,
                verticalSliderSize: EditorIntOption.clampedInt(input.verticalSliderSize, verticalScrollbarSize, 0, 1000),
                scrollByPage: boolean(input.scrollByPage, this.defaultValue.scrollByPage),
                ignoreHorizontalScrollbarInContentHeight: boolean(input.ignoreHorizontalScrollbarInContentHeight, this.defaultValue.ignoreHorizontalScrollbarInContentHeight),
            };
        }
    }
    /**
     * @internal
    */
    exports.inUntrustedWorkspace = 'inUntrustedWorkspace';
    /**
     * @internal
     */
    exports.unicodeHighlightConfigKeys = {
        allowedCharacters: 'editor.unicodeHighlight.allowedCharacters',
        invisibleCharacters: 'editor.unicodeHighlight.invisibleCharacters',
        nonBasicASCII: 'editor.unicodeHighlight.nonBasicASCII',
        ambiguousCharacters: 'editor.unicodeHighlight.ambiguousCharacters',
        includeComments: 'editor.unicodeHighlight.includeComments',
        includeStrings: 'editor.unicodeHighlight.includeStrings',
        allowedLocales: 'editor.unicodeHighlight.allowedLocales',
    };
    class UnicodeHighlight extends BaseEditorOption {
        constructor() {
            const defaults = {
                nonBasicASCII: exports.inUntrustedWorkspace,
                invisibleCharacters: true,
                ambiguousCharacters: true,
                includeComments: exports.inUntrustedWorkspace,
                includeStrings: true,
                allowedCharacters: {},
                allowedLocales: { _os: true, _vscode: true },
            };
            super(125 /* EditorOption.unicodeHighlighting */, 'unicodeHighlight', defaults, {
                [exports.unicodeHighlightConfigKeys.nonBasicASCII]: {
                    restricted: true,
                    type: ['boolean', 'string'],
                    enum: [true, false, exports.inUntrustedWorkspace],
                    default: defaults.nonBasicASCII,
                    description: nls.localize('unicodeHighlight.nonBasicASCII', "Controls whether all non-basic ASCII characters are highlighted. Only characters between U+0020 and U+007E, tab, line-feed and carriage-return are considered basic ASCII.")
                },
                [exports.unicodeHighlightConfigKeys.invisibleCharacters]: {
                    restricted: true,
                    type: 'boolean',
                    default: defaults.invisibleCharacters,
                    description: nls.localize('unicodeHighlight.invisibleCharacters', "Controls whether characters that just reserve space or have no width at all are highlighted.")
                },
                [exports.unicodeHighlightConfigKeys.ambiguousCharacters]: {
                    restricted: true,
                    type: 'boolean',
                    default: defaults.ambiguousCharacters,
                    description: nls.localize('unicodeHighlight.ambiguousCharacters', "Controls whether characters are highlighted that can be confused with basic ASCII characters, except those that are common in the current user locale.")
                },
                [exports.unicodeHighlightConfigKeys.includeComments]: {
                    restricted: true,
                    type: ['boolean', 'string'],
                    enum: [true, false, exports.inUntrustedWorkspace],
                    default: defaults.includeComments,
                    description: nls.localize('unicodeHighlight.includeComments', "Controls whether characters in comments should also be subject to Unicode highlighting.")
                },
                [exports.unicodeHighlightConfigKeys.includeStrings]: {
                    restricted: true,
                    type: ['boolean', 'string'],
                    enum: [true, false, exports.inUntrustedWorkspace],
                    default: defaults.includeStrings,
                    description: nls.localize('unicodeHighlight.includeStrings', "Controls whether characters in strings should also be subject to Unicode highlighting.")
                },
                [exports.unicodeHighlightConfigKeys.allowedCharacters]: {
                    restricted: true,
                    type: 'object',
                    default: defaults.allowedCharacters,
                    description: nls.localize('unicodeHighlight.allowedCharacters', "Defines allowed characters that are not being highlighted."),
                    additionalProperties: {
                        type: 'boolean'
                    }
                },
                [exports.unicodeHighlightConfigKeys.allowedLocales]: {
                    restricted: true,
                    type: 'object',
                    additionalProperties: {
                        type: 'boolean'
                    },
                    default: defaults.allowedLocales,
                    description: nls.localize('unicodeHighlight.allowedLocales', "Unicode characters that are common in allowed locales are not being highlighted.")
                },
            });
        }
        applyUpdate(value, update) {
            let didChange = false;
            if (update.allowedCharacters && value) {
                // Treat allowedCharacters atomically
                if (!objects.equals(value.allowedCharacters, update.allowedCharacters)) {
                    value = { ...value, allowedCharacters: update.allowedCharacters };
                    didChange = true;
                }
            }
            if (update.allowedLocales && value) {
                // Treat allowedLocales atomically
                if (!objects.equals(value.allowedLocales, update.allowedLocales)) {
                    value = { ...value, allowedLocales: update.allowedLocales };
                    didChange = true;
                }
            }
            const result = super.applyUpdate(value, update);
            if (didChange) {
                return new ApplyUpdateResult(result.newValue, true);
            }
            return result;
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                nonBasicASCII: primitiveSet(input.nonBasicASCII, exports.inUntrustedWorkspace, [true, false, exports.inUntrustedWorkspace]),
                invisibleCharacters: boolean(input.invisibleCharacters, this.defaultValue.invisibleCharacters),
                ambiguousCharacters: boolean(input.ambiguousCharacters, this.defaultValue.ambiguousCharacters),
                includeComments: primitiveSet(input.includeComments, exports.inUntrustedWorkspace, [true, false, exports.inUntrustedWorkspace]),
                includeStrings: primitiveSet(input.includeStrings, exports.inUntrustedWorkspace, [true, false, exports.inUntrustedWorkspace]),
                allowedCharacters: this.validateBooleanMap(_input.allowedCharacters, this.defaultValue.allowedCharacters),
                allowedLocales: this.validateBooleanMap(_input.allowedLocales, this.defaultValue.allowedLocales),
            };
        }
        validateBooleanMap(map, defaultValue) {
            if ((typeof map !== 'object') || !map) {
                return defaultValue;
            }
            const result = {};
            for (const [key, value] of Object.entries(map)) {
                if (value === true) {
                    result[key] = true;
                }
            }
            return result;
        }
    }
    /**
     * Configuration options for inline suggestions
     */
    class InlineEditorSuggest extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: true,
                mode: 'subwordSmart',
                showToolbar: 'onHover',
                suppressSuggestions: false,
                keepOnBlur: false,
                fontFamily: 'default'
            };
            super(62 /* EditorOption.inlineSuggest */, 'inlineSuggest', defaults, {
                'editor.inlineSuggest.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('inlineSuggest.enabled', "Controls whether to automatically show inline suggestions in the editor.")
                },
                'editor.inlineSuggest.showToolbar': {
                    type: 'string',
                    default: defaults.showToolbar,
                    enum: ['always', 'onHover', 'never'],
                    enumDescriptions: [
                        nls.localize('inlineSuggest.showToolbar.always', "Show the inline suggestion toolbar whenever an inline suggestion is shown."),
                        nls.localize('inlineSuggest.showToolbar.onHover', "Show the inline suggestion toolbar when hovering over an inline suggestion."),
                        nls.localize('inlineSuggest.showToolbar.never', "Never show the inline suggestion toolbar."),
                    ],
                    description: nls.localize('inlineSuggest.showToolbar', "Controls when to show the inline suggestion toolbar."),
                },
                'editor.inlineSuggest.suppressSuggestions': {
                    type: 'boolean',
                    default: defaults.suppressSuggestions,
                    description: nls.localize('inlineSuggest.suppressSuggestions', "Controls how inline suggestions interact with the suggest widget. If enabled, the suggest widget is not shown automatically when inline suggestions are available.")
                },
                'editor.inlineSuggest.fontFamily': {
                    type: 'string',
                    default: defaults.fontFamily,
                    description: nls.localize('inlineSuggest.fontFamily', "Controls the font family of the inline suggestions.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                mode: stringSet(input.mode, this.defaultValue.mode, ['prefix', 'subword', 'subwordSmart']),
                showToolbar: stringSet(input.showToolbar, this.defaultValue.showToolbar, ['always', 'onHover', 'never']),
                suppressSuggestions: boolean(input.suppressSuggestions, this.defaultValue.suppressSuggestions),
                keepOnBlur: boolean(input.keepOnBlur, this.defaultValue.keepOnBlur),
                fontFamily: EditorStringOption.string(input.fontFamily, this.defaultValue.fontFamily)
            };
        }
    }
    class InlineEditorEdit extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: false,
                showToolbar: 'onHover',
                fontFamily: 'default',
                keepOnBlur: false,
                backgroundColoring: false,
            };
            super(63 /* EditorOption.inlineEdit */, 'experimentalInlineEdit', defaults, {
                'editor.experimentalInlineEdit.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('inlineEdit.enabled', "Controls whether to show inline edits in the editor.")
                },
                'editor.experimentalInlineEdit.showToolbar': {
                    type: 'string',
                    default: defaults.showToolbar,
                    enum: ['always', 'onHover', 'never'],
                    enumDescriptions: [
                        nls.localize('inlineEdit.showToolbar.always', "Show the inline edit toolbar whenever an inline suggestion is shown."),
                        nls.localize('inlineEdit.showToolbar.onHover', "Show the inline edit toolbar when hovering over an inline suggestion."),
                        nls.localize('inlineEdit.showToolbar.never', "Never show the inline edit toolbar."),
                    ],
                    description: nls.localize('inlineEdit.showToolbar', "Controls when to show the inline edit toolbar."),
                },
                'editor.experimentalInlineEdit.fontFamily': {
                    type: 'string',
                    default: defaults.fontFamily,
                    description: nls.localize('inlineEdit.fontFamily', "Controls the font family of the inline edit.")
                },
                'editor.experimentalInlineEdit.backgroundColoring': {
                    type: 'boolean',
                    default: defaults.backgroundColoring,
                    description: nls.localize('inlineEdit.backgroundColoring', "Controls whether to color the background of inline edits.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                showToolbar: stringSet(input.showToolbar, this.defaultValue.showToolbar, ['always', 'onHover', 'never']),
                fontFamily: EditorStringOption.string(input.fontFamily, this.defaultValue.fontFamily),
                keepOnBlur: boolean(input.keepOnBlur, this.defaultValue.keepOnBlur),
                backgroundColoring: boolean(input.backgroundColoring, this.defaultValue.backgroundColoring)
            };
        }
    }
    /**
     * Configuration options for inline suggestions
     */
    class BracketPairColorization extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.bracketPairColorizationOptions.enabled,
                independentColorPoolPerBracketType: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.bracketPairColorizationOptions.independentColorPoolPerBracketType,
            };
            super(15 /* EditorOption.bracketPairColorization */, 'bracketPairColorization', defaults, {
                'editor.bracketPairColorization.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    markdownDescription: nls.localize('bracketPairColorization.enabled', "Controls whether bracket pair colorization is enabled or not. Use {0} to override the bracket highlight colors.", '`#workbench.colorCustomizations#`')
                },
                'editor.bracketPairColorization.independentColorPoolPerBracketType': {
                    type: 'boolean',
                    default: defaults.independentColorPoolPerBracketType,
                    description: nls.localize('bracketPairColorization.independentColorPoolPerBracketType', "Controls whether each bracket type has its own independent color pool.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                independentColorPoolPerBracketType: boolean(input.independentColorPoolPerBracketType, this.defaultValue.independentColorPoolPerBracketType),
            };
        }
    }
    /**
     * Configuration options for inline suggestions
     */
    class GuideOptions extends BaseEditorOption {
        constructor() {
            const defaults = {
                bracketPairs: false,
                bracketPairsHorizontal: 'active',
                highlightActiveBracketPair: true,
                indentation: true,
                highlightActiveIndentation: true
            };
            super(16 /* EditorOption.guides */, 'guides', defaults, {
                'editor.guides.bracketPairs': {
                    type: ['boolean', 'string'],
                    enum: [true, 'active', false],
                    enumDescriptions: [
                        nls.localize('editor.guides.bracketPairs.true', "Enables bracket pair guides."),
                        nls.localize('editor.guides.bracketPairs.active', "Enables bracket pair guides only for the active bracket pair."),
                        nls.localize('editor.guides.bracketPairs.false', "Disables bracket pair guides."),
                    ],
                    default: defaults.bracketPairs,
                    description: nls.localize('editor.guides.bracketPairs', "Controls whether bracket pair guides are enabled or not.")
                },
                'editor.guides.bracketPairsHorizontal': {
                    type: ['boolean', 'string'],
                    enum: [true, 'active', false],
                    enumDescriptions: [
                        nls.localize('editor.guides.bracketPairsHorizontal.true', "Enables horizontal guides as addition to vertical bracket pair guides."),
                        nls.localize('editor.guides.bracketPairsHorizontal.active', "Enables horizontal guides only for the active bracket pair."),
                        nls.localize('editor.guides.bracketPairsHorizontal.false', "Disables horizontal bracket pair guides."),
                    ],
                    default: defaults.bracketPairsHorizontal,
                    description: nls.localize('editor.guides.bracketPairsHorizontal', "Controls whether horizontal bracket pair guides are enabled or not.")
                },
                'editor.guides.highlightActiveBracketPair': {
                    type: 'boolean',
                    default: defaults.highlightActiveBracketPair,
                    description: nls.localize('editor.guides.highlightActiveBracketPair', "Controls whether the editor should highlight the active bracket pair.")
                },
                'editor.guides.indentation': {
                    type: 'boolean',
                    default: defaults.indentation,
                    description: nls.localize('editor.guides.indentation', "Controls whether the editor should render indent guides.")
                },
                'editor.guides.highlightActiveIndentation': {
                    type: ['boolean', 'string'],
                    enum: [true, 'always', false],
                    enumDescriptions: [
                        nls.localize('editor.guides.highlightActiveIndentation.true', "Highlights the active indent guide."),
                        nls.localize('editor.guides.highlightActiveIndentation.always', "Highlights the active indent guide even if bracket guides are highlighted."),
                        nls.localize('editor.guides.highlightActiveIndentation.false', "Do not highlight the active indent guide."),
                    ],
                    default: defaults.highlightActiveIndentation,
                    description: nls.localize('editor.guides.highlightActiveIndentation', "Controls whether the editor should highlight the active indent guide.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                bracketPairs: primitiveSet(input.bracketPairs, this.defaultValue.bracketPairs, [true, false, 'active']),
                bracketPairsHorizontal: primitiveSet(input.bracketPairsHorizontal, this.defaultValue.bracketPairsHorizontal, [true, false, 'active']),
                highlightActiveBracketPair: boolean(input.highlightActiveBracketPair, this.defaultValue.highlightActiveBracketPair),
                indentation: boolean(input.indentation, this.defaultValue.indentation),
                highlightActiveIndentation: primitiveSet(input.highlightActiveIndentation, this.defaultValue.highlightActiveIndentation, [true, false, 'always']),
            };
        }
    }
    function primitiveSet(value, defaultValue, allowedValues) {
        const idx = allowedValues.indexOf(value);
        if (idx === -1) {
            return defaultValue;
        }
        return allowedValues[idx];
    }
    class EditorSuggest extends BaseEditorOption {
        constructor() {
            const defaults = {
                insertMode: 'insert',
                filterGraceful: true,
                snippetsPreventQuickSuggestions: false,
                localityBonus: false,
                shareSuggestSelections: false,
                selectionMode: 'always',
                showIcons: true,
                showStatusBar: false,
                preview: false,
                previewMode: 'subwordSmart',
                showInlineDetails: true,
                showMethods: true,
                showFunctions: true,
                showConstructors: true,
                showDeprecated: true,
                matchOnWordStartOnly: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showStructs: true,
                showInterfaces: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showKeywords: true,
                showWords: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showSnippets: true,
                showUsers: true,
                showIssues: true,
            };
            super(118 /* EditorOption.suggest */, 'suggest', defaults, {
                'editor.suggest.insertMode': {
                    type: 'string',
                    enum: ['insert', 'replace'],
                    enumDescriptions: [
                        nls.localize('suggest.insertMode.insert', "Insert suggestion without overwriting text right of the cursor."),
                        nls.localize('suggest.insertMode.replace', "Insert suggestion and overwrite text right of the cursor."),
                    ],
                    default: defaults.insertMode,
                    description: nls.localize('suggest.insertMode', "Controls whether words are overwritten when accepting completions. Note that this depends on extensions opting into this feature.")
                },
                'editor.suggest.filterGraceful': {
                    type: 'boolean',
                    default: defaults.filterGraceful,
                    description: nls.localize('suggest.filterGraceful', "Controls whether filtering and sorting suggestions accounts for small typos.")
                },
                'editor.suggest.localityBonus': {
                    type: 'boolean',
                    default: defaults.localityBonus,
                    description: nls.localize('suggest.localityBonus', "Controls whether sorting favors words that appear close to the cursor.")
                },
                'editor.suggest.shareSuggestSelections': {
                    type: 'boolean',
                    default: defaults.shareSuggestSelections,
                    markdownDescription: nls.localize('suggest.shareSuggestSelections', "Controls whether remembered suggestion selections are shared between multiple workspaces and windows (needs `#editor.suggestSelection#`).")
                },
                'editor.suggest.selectionMode': {
                    type: 'string',
                    enum: ['always', 'never', 'whenTriggerCharacter', 'whenQuickSuggestion'],
                    enumDescriptions: [
                        nls.localize('suggest.insertMode.always', "Always select a suggestion when automatically triggering IntelliSense."),
                        nls.localize('suggest.insertMode.never', "Never select a suggestion when automatically triggering IntelliSense."),
                        nls.localize('suggest.insertMode.whenTriggerCharacter', "Select a suggestion only when triggering IntelliSense from a trigger character."),
                        nls.localize('suggest.insertMode.whenQuickSuggestion', "Select a suggestion only when triggering IntelliSense as you type."),
                    ],
                    default: defaults.selectionMode,
                    markdownDescription: nls.localize('suggest.selectionMode', "Controls whether a suggestion is selected when the widget shows. Note that this only applies to automatically triggered suggestions (`#editor.quickSuggestions#` and `#editor.suggestOnTriggerCharacters#`) and that a suggestion is always selected when explicitly invoked, e.g via `Ctrl+Space`.")
                },
                'editor.suggest.snippetsPreventQuickSuggestions': {
                    type: 'boolean',
                    default: defaults.snippetsPreventQuickSuggestions,
                    description: nls.localize('suggest.snippetsPreventQuickSuggestions', "Controls whether an active snippet prevents quick suggestions.")
                },
                'editor.suggest.showIcons': {
                    type: 'boolean',
                    default: defaults.showIcons,
                    description: nls.localize('suggest.showIcons', "Controls whether to show or hide icons in suggestions.")
                },
                'editor.suggest.showStatusBar': {
                    type: 'boolean',
                    default: defaults.showStatusBar,
                    description: nls.localize('suggest.showStatusBar', "Controls the visibility of the status bar at the bottom of the suggest widget.")
                },
                'editor.suggest.preview': {
                    type: 'boolean',
                    default: defaults.preview,
                    description: nls.localize('suggest.preview', "Controls whether to preview the suggestion outcome in the editor.")
                },
                'editor.suggest.showInlineDetails': {
                    type: 'boolean',
                    default: defaults.showInlineDetails,
                    description: nls.localize('suggest.showInlineDetails', "Controls whether suggest details show inline with the label or only in the details widget.")
                },
                'editor.suggest.maxVisibleSuggestions': {
                    type: 'number',
                    deprecationMessage: nls.localize('suggest.maxVisibleSuggestions.dep', "This setting is deprecated. The suggest widget can now be resized."),
                },
                'editor.suggest.filteredTypes': {
                    type: 'object',
                    deprecationMessage: nls.localize('deprecated', "This setting is deprecated, please use separate settings like 'editor.suggest.showKeywords' or 'editor.suggest.showSnippets' instead.")
                },
                'editor.suggest.showMethods': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showMethods', "When enabled IntelliSense shows `method`-suggestions.")
                },
                'editor.suggest.showFunctions': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showFunctions', "When enabled IntelliSense shows `function`-suggestions.")
                },
                'editor.suggest.showConstructors': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showConstructors', "When enabled IntelliSense shows `constructor`-suggestions.")
                },
                'editor.suggest.showDeprecated': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showDeprecated', "When enabled IntelliSense shows `deprecated`-suggestions.")
                },
                'editor.suggest.matchOnWordStartOnly': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.matchOnWordStartOnly', "When enabled IntelliSense filtering requires that the first character matches on a word start. For example, `c` on `Console` or `WebContext` but _not_ on `description`. When disabled IntelliSense will show more results but still sorts them by match quality.")
                },
                'editor.suggest.showFields': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showFields', "When enabled IntelliSense shows `field`-suggestions.")
                },
                'editor.suggest.showVariables': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showVariables', "When enabled IntelliSense shows `variable`-suggestions.")
                },
                'editor.suggest.showClasses': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showClasss', "When enabled IntelliSense shows `class`-suggestions.")
                },
                'editor.suggest.showStructs': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showStructs', "When enabled IntelliSense shows `struct`-suggestions.")
                },
                'editor.suggest.showInterfaces': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showInterfaces', "When enabled IntelliSense shows `interface`-suggestions.")
                },
                'editor.suggest.showModules': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showModules', "When enabled IntelliSense shows `module`-suggestions.")
                },
                'editor.suggest.showProperties': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showPropertys', "When enabled IntelliSense shows `property`-suggestions.")
                },
                'editor.suggest.showEvents': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showEvents', "When enabled IntelliSense shows `event`-suggestions.")
                },
                'editor.suggest.showOperators': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showOperators', "When enabled IntelliSense shows `operator`-suggestions.")
                },
                'editor.suggest.showUnits': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showUnits', "When enabled IntelliSense shows `unit`-suggestions.")
                },
                'editor.suggest.showValues': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showValues', "When enabled IntelliSense shows `value`-suggestions.")
                },
                'editor.suggest.showConstants': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showConstants', "When enabled IntelliSense shows `constant`-suggestions.")
                },
                'editor.suggest.showEnums': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showEnums', "When enabled IntelliSense shows `enum`-suggestions.")
                },
                'editor.suggest.showEnumMembers': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showEnumMembers', "When enabled IntelliSense shows `enumMember`-suggestions.")
                },
                'editor.suggest.showKeywords': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showKeywords', "When enabled IntelliSense shows `keyword`-suggestions.")
                },
                'editor.suggest.showWords': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showTexts', "When enabled IntelliSense shows `text`-suggestions.")
                },
                'editor.suggest.showColors': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showColors', "When enabled IntelliSense shows `color`-suggestions.")
                },
                'editor.suggest.showFiles': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showFiles', "When enabled IntelliSense shows `file`-suggestions.")
                },
                'editor.suggest.showReferences': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showReferences', "When enabled IntelliSense shows `reference`-suggestions.")
                },
                'editor.suggest.showCustomcolors': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showCustomcolors', "When enabled IntelliSense shows `customcolor`-suggestions.")
                },
                'editor.suggest.showFolders': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showFolders', "When enabled IntelliSense shows `folder`-suggestions.")
                },
                'editor.suggest.showTypeParameters': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showTypeParameters', "When enabled IntelliSense shows `typeParameter`-suggestions.")
                },
                'editor.suggest.showSnippets': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showSnippets', "When enabled IntelliSense shows `snippet`-suggestions.")
                },
                'editor.suggest.showUsers': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showUsers', "When enabled IntelliSense shows `user`-suggestions.")
                },
                'editor.suggest.showIssues': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showIssues', "When enabled IntelliSense shows `issues`-suggestions.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                insertMode: stringSet(input.insertMode, this.defaultValue.insertMode, ['insert', 'replace']),
                filterGraceful: boolean(input.filterGraceful, this.defaultValue.filterGraceful),
                snippetsPreventQuickSuggestions: boolean(input.snippetsPreventQuickSuggestions, this.defaultValue.filterGraceful),
                localityBonus: boolean(input.localityBonus, this.defaultValue.localityBonus),
                shareSuggestSelections: boolean(input.shareSuggestSelections, this.defaultValue.shareSuggestSelections),
                selectionMode: stringSet(input.selectionMode, this.defaultValue.selectionMode, ['always', 'never', 'whenQuickSuggestion', 'whenTriggerCharacter']),
                showIcons: boolean(input.showIcons, this.defaultValue.showIcons),
                showStatusBar: boolean(input.showStatusBar, this.defaultValue.showStatusBar),
                preview: boolean(input.preview, this.defaultValue.preview),
                previewMode: stringSet(input.previewMode, this.defaultValue.previewMode, ['prefix', 'subword', 'subwordSmart']),
                showInlineDetails: boolean(input.showInlineDetails, this.defaultValue.showInlineDetails),
                showMethods: boolean(input.showMethods, this.defaultValue.showMethods),
                showFunctions: boolean(input.showFunctions, this.defaultValue.showFunctions),
                showConstructors: boolean(input.showConstructors, this.defaultValue.showConstructors),
                showDeprecated: boolean(input.showDeprecated, this.defaultValue.showDeprecated),
                matchOnWordStartOnly: boolean(input.matchOnWordStartOnly, this.defaultValue.matchOnWordStartOnly),
                showFields: boolean(input.showFields, this.defaultValue.showFields),
                showVariables: boolean(input.showVariables, this.defaultValue.showVariables),
                showClasses: boolean(input.showClasses, this.defaultValue.showClasses),
                showStructs: boolean(input.showStructs, this.defaultValue.showStructs),
                showInterfaces: boolean(input.showInterfaces, this.defaultValue.showInterfaces),
                showModules: boolean(input.showModules, this.defaultValue.showModules),
                showProperties: boolean(input.showProperties, this.defaultValue.showProperties),
                showEvents: boolean(input.showEvents, this.defaultValue.showEvents),
                showOperators: boolean(input.showOperators, this.defaultValue.showOperators),
                showUnits: boolean(input.showUnits, this.defaultValue.showUnits),
                showValues: boolean(input.showValues, this.defaultValue.showValues),
                showConstants: boolean(input.showConstants, this.defaultValue.showConstants),
                showEnums: boolean(input.showEnums, this.defaultValue.showEnums),
                showEnumMembers: boolean(input.showEnumMembers, this.defaultValue.showEnumMembers),
                showKeywords: boolean(input.showKeywords, this.defaultValue.showKeywords),
                showWords: boolean(input.showWords, this.defaultValue.showWords),
                showColors: boolean(input.showColors, this.defaultValue.showColors),
                showFiles: boolean(input.showFiles, this.defaultValue.showFiles),
                showReferences: boolean(input.showReferences, this.defaultValue.showReferences),
                showFolders: boolean(input.showFolders, this.defaultValue.showFolders),
                showTypeParameters: boolean(input.showTypeParameters, this.defaultValue.showTypeParameters),
                showSnippets: boolean(input.showSnippets, this.defaultValue.showSnippets),
                showUsers: boolean(input.showUsers, this.defaultValue.showUsers),
                showIssues: boolean(input.showIssues, this.defaultValue.showIssues),
            };
        }
    }
    class SmartSelect extends BaseEditorOption {
        constructor() {
            super(113 /* EditorOption.smartSelect */, 'smartSelect', {
                selectLeadingAndTrailingWhitespace: true,
                selectSubwords: true,
            }, {
                'editor.smartSelect.selectLeadingAndTrailingWhitespace': {
                    description: nls.localize('selectLeadingAndTrailingWhitespace', "Whether leading and trailing whitespace should always be selected."),
                    default: true,
                    type: 'boolean'
                },
                'editor.smartSelect.selectSubwords': {
                    description: nls.localize('selectSubwords', "Whether subwords (like 'foo' in 'fooBar' or 'foo_bar') should be selected."),
                    default: true,
                    type: 'boolean'
                }
            });
        }
        validate(input) {
            if (!input || typeof input !== 'object') {
                return this.defaultValue;
            }
            return {
                selectLeadingAndTrailingWhitespace: boolean(input.selectLeadingAndTrailingWhitespace, this.defaultValue.selectLeadingAndTrailingWhitespace),
                selectSubwords: boolean(input.selectSubwords, this.defaultValue.selectSubwords),
            };
        }
    }
    //#endregion
    //#region wordSegmenterLocales
    /**
     * Locales used for segmenting lines into words when doing word related navigations or operations.
     *
     * Specify the BCP 47 language tag of the word you wish to recognize (e.g., ja, zh-CN, zh-Hant-TW, etc.).
     */
    class WordSegmenterLocales extends BaseEditorOption {
        constructor() {
            const defaults = [];
            super(130 /* EditorOption.wordSegmenterLocales */, 'wordSegmenterLocales', defaults, {
                anyOf: [
                    {
                        description: nls.localize('wordSegmenterLocales', "Locales to be used for word segmentation when doing word related navigations or operations. Specify the BCP 47 language tag of the word you wish to recognize (e.g., ja, zh-CN, zh-Hant-TW, etc.)."),
                        type: 'string',
                    }, {
                        description: nls.localize('wordSegmenterLocales', "Locales to be used for word segmentation when doing word related navigations or operations. Specify the BCP 47 language tag of the word you wish to recognize (e.g., ja, zh-CN, zh-Hant-TW, etc.)."),
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    }
                ]
            });
        }
        validate(input) {
            if (typeof input === 'string') {
                input = [input];
            }
            if (Array.isArray(input)) {
                const validLocales = [];
                for (const locale of input) {
                    if (typeof locale === 'string') {
                        try {
                            if (Intl.Segmenter.supportedLocalesOf(locale).length > 0) {
                                validLocales.push(locale);
                            }
                        }
                        catch {
                            // ignore invalid locales
                        }
                    }
                }
                return validLocales;
            }
            return this.defaultValue;
        }
    }
    //#endregion
    //#region wrappingIndent
    /**
     * Describes how to indent wrapped lines.
     */
    var WrappingIndent;
    (function (WrappingIndent) {
        /**
         * No indentation => wrapped lines begin at column 1.
         */
        WrappingIndent[WrappingIndent["None"] = 0] = "None";
        /**
         * Same => wrapped lines get the same indentation as the parent.
         */
        WrappingIndent[WrappingIndent["Same"] = 1] = "Same";
        /**
         * Indent => wrapped lines get +1 indentation toward the parent.
         */
        WrappingIndent[WrappingIndent["Indent"] = 2] = "Indent";
        /**
         * DeepIndent => wrapped lines get +2 indentation toward the parent.
         */
        WrappingIndent[WrappingIndent["DeepIndent"] = 3] = "DeepIndent";
    })(WrappingIndent || (exports.WrappingIndent = WrappingIndent = {}));
    class WrappingIndentOption extends BaseEditorOption {
        constructor() {
            super(138 /* EditorOption.wrappingIndent */, 'wrappingIndent', 1 /* WrappingIndent.Same */, {
                'editor.wrappingIndent': {
                    type: 'string',
                    enum: ['none', 'same', 'indent', 'deepIndent'],
                    enumDescriptions: [
                        nls.localize('wrappingIndent.none', "No indentation. Wrapped lines begin at column 1."),
                        nls.localize('wrappingIndent.same', "Wrapped lines get the same indentation as the parent."),
                        nls.localize('wrappingIndent.indent', "Wrapped lines get +1 indentation toward the parent."),
                        nls.localize('wrappingIndent.deepIndent', "Wrapped lines get +2 indentation toward the parent."),
                    ],
                    description: nls.localize('wrappingIndent', "Controls the indentation of wrapped lines."),
                    default: 'same'
                }
            });
        }
        validate(input) {
            switch (input) {
                case 'none': return 0 /* WrappingIndent.None */;
                case 'same': return 1 /* WrappingIndent.Same */;
                case 'indent': return 2 /* WrappingIndent.Indent */;
                case 'deepIndent': return 3 /* WrappingIndent.DeepIndent */;
            }
            return 1 /* WrappingIndent.Same */;
        }
        compute(env, options, value) {
            const accessibilitySupport = options.get(2 /* EditorOption.accessibilitySupport */);
            if (accessibilitySupport === 2 /* AccessibilitySupport.Enabled */) {
                // if we know for a fact that a screen reader is attached, we use no indent wrapping to
                // help that the editor's wrapping points match the textarea's wrapping points
                return 0 /* WrappingIndent.None */;
            }
            return value;
        }
    }
    class EditorWrappingInfoComputer extends ComputedEditorOption {
        constructor() {
            super(146 /* EditorOption.wrappingInfo */);
        }
        compute(env, options, _) {
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            return {
                isDominatedByLongLines: env.isDominatedByLongLines,
                isWordWrapMinified: layoutInfo.isWordWrapMinified,
                isViewportWrapping: layoutInfo.isViewportWrapping,
                wrappingColumn: layoutInfo.wrappingColumn,
            };
        }
    }
    class EditorDropIntoEditor extends BaseEditorOption {
        constructor() {
            const defaults = { enabled: true, showDropSelector: 'afterDrop' };
            super(36 /* EditorOption.dropIntoEditor */, 'dropIntoEditor', defaults, {
                'editor.dropIntoEditor.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    markdownDescription: nls.localize('dropIntoEditor.enabled', "Controls whether you can drag and drop a file into a text editor by holding down the `Shift` key (instead of opening the file in an editor)."),
                },
                'editor.dropIntoEditor.showDropSelector': {
                    type: 'string',
                    markdownDescription: nls.localize('dropIntoEditor.showDropSelector', "Controls if a widget is shown when dropping files into the editor. This widget lets you control how the file is dropped."),
                    enum: [
                        'afterDrop',
                        'never'
                    ],
                    enumDescriptions: [
                        nls.localize('dropIntoEditor.showDropSelector.afterDrop', "Show the drop selector widget after a file is dropped into the editor."),
                        nls.localize('dropIntoEditor.showDropSelector.never', "Never show the drop selector widget. Instead the default drop provider is always used."),
                    ],
                    default: 'afterDrop',
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                showDropSelector: stringSet(input.showDropSelector, this.defaultValue.showDropSelector, ['afterDrop', 'never']),
            };
        }
    }
    class EditorPasteAs extends BaseEditorOption {
        constructor() {
            const defaults = { enabled: true, showPasteSelector: 'afterPaste' };
            super(85 /* EditorOption.pasteAs */, 'pasteAs', defaults, {
                'editor.pasteAs.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    markdownDescription: nls.localize('pasteAs.enabled', "Controls whether you can paste content in different ways."),
                },
                'editor.pasteAs.showPasteSelector': {
                    type: 'string',
                    markdownDescription: nls.localize('pasteAs.showPasteSelector', "Controls if a widget is shown when pasting content in to the editor. This widget lets you control how the file is pasted."),
                    enum: [
                        'afterPaste',
                        'never'
                    ],
                    enumDescriptions: [
                        nls.localize('pasteAs.showPasteSelector.afterPaste', "Show the paste selector widget after content is pasted into the editor."),
                        nls.localize('pasteAs.showPasteSelector.never', "Never show the paste selector widget. Instead the default pasting behavior is always used."),
                    ],
                    default: 'afterPaste',
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                showPasteSelector: stringSet(input.showPasteSelector, this.defaultValue.showPasteSelector, ['afterPaste', 'never']),
            };
        }
    }
    //#endregion
    const DEFAULT_WINDOWS_FONT_FAMILY = 'Consolas, \'Courier New\', monospace';
    const DEFAULT_MAC_FONT_FAMILY = 'Menlo, Monaco, \'Courier New\', monospace';
    const DEFAULT_LINUX_FONT_FAMILY = '\'Droid Sans Mono\', \'monospace\', monospace';
    /**
     * @internal
     */
    exports.EDITOR_FONT_DEFAULTS = {
        fontFamily: (platform.isMacintosh ? DEFAULT_MAC_FONT_FAMILY : (platform.isLinux ? DEFAULT_LINUX_FONT_FAMILY : DEFAULT_WINDOWS_FONT_FAMILY)),
        fontWeight: 'normal',
        fontSize: (platform.isMacintosh ? 12 : 14),
        lineHeight: 0,
        letterSpacing: 0,
    };
    /**
     * @internal
     */
    exports.editorOptionsRegistry = [];
    function register(option) {
        exports.editorOptionsRegistry[option.id] = option;
        return option;
    }
    var EditorOption;
    (function (EditorOption) {
        EditorOption[EditorOption["acceptSuggestionOnCommitCharacter"] = 0] = "acceptSuggestionOnCommitCharacter";
        EditorOption[EditorOption["acceptSuggestionOnEnter"] = 1] = "acceptSuggestionOnEnter";
        EditorOption[EditorOption["accessibilitySupport"] = 2] = "accessibilitySupport";
        EditorOption[EditorOption["accessibilityPageSize"] = 3] = "accessibilityPageSize";
        EditorOption[EditorOption["ariaLabel"] = 4] = "ariaLabel";
        EditorOption[EditorOption["ariaRequired"] = 5] = "ariaRequired";
        EditorOption[EditorOption["autoClosingBrackets"] = 6] = "autoClosingBrackets";
        EditorOption[EditorOption["autoClosingComments"] = 7] = "autoClosingComments";
        EditorOption[EditorOption["screenReaderAnnounceInlineSuggestion"] = 8] = "screenReaderAnnounceInlineSuggestion";
        EditorOption[EditorOption["autoClosingDelete"] = 9] = "autoClosingDelete";
        EditorOption[EditorOption["autoClosingOvertype"] = 10] = "autoClosingOvertype";
        EditorOption[EditorOption["autoClosingQuotes"] = 11] = "autoClosingQuotes";
        EditorOption[EditorOption["autoIndent"] = 12] = "autoIndent";
        EditorOption[EditorOption["automaticLayout"] = 13] = "automaticLayout";
        EditorOption[EditorOption["autoSurround"] = 14] = "autoSurround";
        EditorOption[EditorOption["bracketPairColorization"] = 15] = "bracketPairColorization";
        EditorOption[EditorOption["guides"] = 16] = "guides";
        EditorOption[EditorOption["codeLens"] = 17] = "codeLens";
        EditorOption[EditorOption["codeLensFontFamily"] = 18] = "codeLensFontFamily";
        EditorOption[EditorOption["codeLensFontSize"] = 19] = "codeLensFontSize";
        EditorOption[EditorOption["colorDecorators"] = 20] = "colorDecorators";
        EditorOption[EditorOption["colorDecoratorsLimit"] = 21] = "colorDecoratorsLimit";
        EditorOption[EditorOption["columnSelection"] = 22] = "columnSelection";
        EditorOption[EditorOption["comments"] = 23] = "comments";
        EditorOption[EditorOption["contextmenu"] = 24] = "contextmenu";
        EditorOption[EditorOption["copyWithSyntaxHighlighting"] = 25] = "copyWithSyntaxHighlighting";
        EditorOption[EditorOption["cursorBlinking"] = 26] = "cursorBlinking";
        EditorOption[EditorOption["cursorSmoothCaretAnimation"] = 27] = "cursorSmoothCaretAnimation";
        EditorOption[EditorOption["cursorStyle"] = 28] = "cursorStyle";
        EditorOption[EditorOption["cursorSurroundingLines"] = 29] = "cursorSurroundingLines";
        EditorOption[EditorOption["cursorSurroundingLinesStyle"] = 30] = "cursorSurroundingLinesStyle";
        EditorOption[EditorOption["cursorWidth"] = 31] = "cursorWidth";
        EditorOption[EditorOption["disableLayerHinting"] = 32] = "disableLayerHinting";
        EditorOption[EditorOption["disableMonospaceOptimizations"] = 33] = "disableMonospaceOptimizations";
        EditorOption[EditorOption["domReadOnly"] = 34] = "domReadOnly";
        EditorOption[EditorOption["dragAndDrop"] = 35] = "dragAndDrop";
        EditorOption[EditorOption["dropIntoEditor"] = 36] = "dropIntoEditor";
        EditorOption[EditorOption["emptySelectionClipboard"] = 37] = "emptySelectionClipboard";
        EditorOption[EditorOption["experimentalWhitespaceRendering"] = 38] = "experimentalWhitespaceRendering";
        EditorOption[EditorOption["extraEditorClassName"] = 39] = "extraEditorClassName";
        EditorOption[EditorOption["fastScrollSensitivity"] = 40] = "fastScrollSensitivity";
        EditorOption[EditorOption["find"] = 41] = "find";
        EditorOption[EditorOption["fixedOverflowWidgets"] = 42] = "fixedOverflowWidgets";
        EditorOption[EditorOption["folding"] = 43] = "folding";
        EditorOption[EditorOption["foldingStrategy"] = 44] = "foldingStrategy";
        EditorOption[EditorOption["foldingHighlight"] = 45] = "foldingHighlight";
        EditorOption[EditorOption["foldingImportsByDefault"] = 46] = "foldingImportsByDefault";
        EditorOption[EditorOption["foldingMaximumRegions"] = 47] = "foldingMaximumRegions";
        EditorOption[EditorOption["unfoldOnClickAfterEndOfLine"] = 48] = "unfoldOnClickAfterEndOfLine";
        EditorOption[EditorOption["fontFamily"] = 49] = "fontFamily";
        EditorOption[EditorOption["fontInfo"] = 50] = "fontInfo";
        EditorOption[EditorOption["fontLigatures"] = 51] = "fontLigatures";
        EditorOption[EditorOption["fontSize"] = 52] = "fontSize";
        EditorOption[EditorOption["fontWeight"] = 53] = "fontWeight";
        EditorOption[EditorOption["fontVariations"] = 54] = "fontVariations";
        EditorOption[EditorOption["formatOnPaste"] = 55] = "formatOnPaste";
        EditorOption[EditorOption["formatOnType"] = 56] = "formatOnType";
        EditorOption[EditorOption["glyphMargin"] = 57] = "glyphMargin";
        EditorOption[EditorOption["gotoLocation"] = 58] = "gotoLocation";
        EditorOption[EditorOption["hideCursorInOverviewRuler"] = 59] = "hideCursorInOverviewRuler";
        EditorOption[EditorOption["hover"] = 60] = "hover";
        EditorOption[EditorOption["inDiffEditor"] = 61] = "inDiffEditor";
        EditorOption[EditorOption["inlineSuggest"] = 62] = "inlineSuggest";
        EditorOption[EditorOption["inlineEdit"] = 63] = "inlineEdit";
        EditorOption[EditorOption["letterSpacing"] = 64] = "letterSpacing";
        EditorOption[EditorOption["lightbulb"] = 65] = "lightbulb";
        EditorOption[EditorOption["lineDecorationsWidth"] = 66] = "lineDecorationsWidth";
        EditorOption[EditorOption["lineHeight"] = 67] = "lineHeight";
        EditorOption[EditorOption["lineNumbers"] = 68] = "lineNumbers";
        EditorOption[EditorOption["lineNumbersMinChars"] = 69] = "lineNumbersMinChars";
        EditorOption[EditorOption["linkedEditing"] = 70] = "linkedEditing";
        EditorOption[EditorOption["links"] = 71] = "links";
        EditorOption[EditorOption["matchBrackets"] = 72] = "matchBrackets";
        EditorOption[EditorOption["minimap"] = 73] = "minimap";
        EditorOption[EditorOption["mouseStyle"] = 74] = "mouseStyle";
        EditorOption[EditorOption["mouseWheelScrollSensitivity"] = 75] = "mouseWheelScrollSensitivity";
        EditorOption[EditorOption["mouseWheelZoom"] = 76] = "mouseWheelZoom";
        EditorOption[EditorOption["multiCursorMergeOverlapping"] = 77] = "multiCursorMergeOverlapping";
        EditorOption[EditorOption["multiCursorModifier"] = 78] = "multiCursorModifier";
        EditorOption[EditorOption["multiCursorPaste"] = 79] = "multiCursorPaste";
        EditorOption[EditorOption["multiCursorLimit"] = 80] = "multiCursorLimit";
        EditorOption[EditorOption["occurrencesHighlight"] = 81] = "occurrencesHighlight";
        EditorOption[EditorOption["overviewRulerBorder"] = 82] = "overviewRulerBorder";
        EditorOption[EditorOption["overviewRulerLanes"] = 83] = "overviewRulerLanes";
        EditorOption[EditorOption["padding"] = 84] = "padding";
        EditorOption[EditorOption["pasteAs"] = 85] = "pasteAs";
        EditorOption[EditorOption["parameterHints"] = 86] = "parameterHints";
        EditorOption[EditorOption["peekWidgetDefaultFocus"] = 87] = "peekWidgetDefaultFocus";
        EditorOption[EditorOption["definitionLinkOpensInPeek"] = 88] = "definitionLinkOpensInPeek";
        EditorOption[EditorOption["quickSuggestions"] = 89] = "quickSuggestions";
        EditorOption[EditorOption["quickSuggestionsDelay"] = 90] = "quickSuggestionsDelay";
        EditorOption[EditorOption["readOnly"] = 91] = "readOnly";
        EditorOption[EditorOption["readOnlyMessage"] = 92] = "readOnlyMessage";
        EditorOption[EditorOption["renameOnType"] = 93] = "renameOnType";
        EditorOption[EditorOption["renderControlCharacters"] = 94] = "renderControlCharacters";
        EditorOption[EditorOption["renderFinalNewline"] = 95] = "renderFinalNewline";
        EditorOption[EditorOption["renderLineHighlight"] = 96] = "renderLineHighlight";
        EditorOption[EditorOption["renderLineHighlightOnlyWhenFocus"] = 97] = "renderLineHighlightOnlyWhenFocus";
        EditorOption[EditorOption["renderValidationDecorations"] = 98] = "renderValidationDecorations";
        EditorOption[EditorOption["renderWhitespace"] = 99] = "renderWhitespace";
        EditorOption[EditorOption["revealHorizontalRightPadding"] = 100] = "revealHorizontalRightPadding";
        EditorOption[EditorOption["roundedSelection"] = 101] = "roundedSelection";
        EditorOption[EditorOption["rulers"] = 102] = "rulers";
        EditorOption[EditorOption["scrollbar"] = 103] = "scrollbar";
        EditorOption[EditorOption["scrollBeyondLastColumn"] = 104] = "scrollBeyondLastColumn";
        EditorOption[EditorOption["scrollBeyondLastLine"] = 105] = "scrollBeyondLastLine";
        EditorOption[EditorOption["scrollPredominantAxis"] = 106] = "scrollPredominantAxis";
        EditorOption[EditorOption["selectionClipboard"] = 107] = "selectionClipboard";
        EditorOption[EditorOption["selectionHighlight"] = 108] = "selectionHighlight";
        EditorOption[EditorOption["selectOnLineNumbers"] = 109] = "selectOnLineNumbers";
        EditorOption[EditorOption["showFoldingControls"] = 110] = "showFoldingControls";
        EditorOption[EditorOption["showUnused"] = 111] = "showUnused";
        EditorOption[EditorOption["snippetSuggestions"] = 112] = "snippetSuggestions";
        EditorOption[EditorOption["smartSelect"] = 113] = "smartSelect";
        EditorOption[EditorOption["smoothScrolling"] = 114] = "smoothScrolling";
        EditorOption[EditorOption["stickyScroll"] = 115] = "stickyScroll";
        EditorOption[EditorOption["stickyTabStops"] = 116] = "stickyTabStops";
        EditorOption[EditorOption["stopRenderingLineAfter"] = 117] = "stopRenderingLineAfter";
        EditorOption[EditorOption["suggest"] = 118] = "suggest";
        EditorOption[EditorOption["suggestFontSize"] = 119] = "suggestFontSize";
        EditorOption[EditorOption["suggestLineHeight"] = 120] = "suggestLineHeight";
        EditorOption[EditorOption["suggestOnTriggerCharacters"] = 121] = "suggestOnTriggerCharacters";
        EditorOption[EditorOption["suggestSelection"] = 122] = "suggestSelection";
        EditorOption[EditorOption["tabCompletion"] = 123] = "tabCompletion";
        EditorOption[EditorOption["tabIndex"] = 124] = "tabIndex";
        EditorOption[EditorOption["unicodeHighlighting"] = 125] = "unicodeHighlighting";
        EditorOption[EditorOption["unusualLineTerminators"] = 126] = "unusualLineTerminators";
        EditorOption[EditorOption["useShadowDOM"] = 127] = "useShadowDOM";
        EditorOption[EditorOption["useTabStops"] = 128] = "useTabStops";
        EditorOption[EditorOption["wordBreak"] = 129] = "wordBreak";
        EditorOption[EditorOption["wordSegmenterLocales"] = 130] = "wordSegmenterLocales";
        EditorOption[EditorOption["wordSeparators"] = 131] = "wordSeparators";
        EditorOption[EditorOption["wordWrap"] = 132] = "wordWrap";
        EditorOption[EditorOption["wordWrapBreakAfterCharacters"] = 133] = "wordWrapBreakAfterCharacters";
        EditorOption[EditorOption["wordWrapBreakBeforeCharacters"] = 134] = "wordWrapBreakBeforeCharacters";
        EditorOption[EditorOption["wordWrapColumn"] = 135] = "wordWrapColumn";
        EditorOption[EditorOption["wordWrapOverride1"] = 136] = "wordWrapOverride1";
        EditorOption[EditorOption["wordWrapOverride2"] = 137] = "wordWrapOverride2";
        EditorOption[EditorOption["wrappingIndent"] = 138] = "wrappingIndent";
        EditorOption[EditorOption["wrappingStrategy"] = 139] = "wrappingStrategy";
        EditorOption[EditorOption["showDeprecated"] = 140] = "showDeprecated";
        EditorOption[EditorOption["inlayHints"] = 141] = "inlayHints";
        // Leave these at the end (because they have dependencies!)
        EditorOption[EditorOption["editorClassName"] = 142] = "editorClassName";
        EditorOption[EditorOption["pixelRatio"] = 143] = "pixelRatio";
        EditorOption[EditorOption["tabFocusMode"] = 144] = "tabFocusMode";
        EditorOption[EditorOption["layoutInfo"] = 145] = "layoutInfo";
        EditorOption[EditorOption["wrappingInfo"] = 146] = "wrappingInfo";
        EditorOption[EditorOption["defaultColorDecorators"] = 147] = "defaultColorDecorators";
        EditorOption[EditorOption["colorDecoratorsActivatedOn"] = 148] = "colorDecoratorsActivatedOn";
        EditorOption[EditorOption["inlineCompletionsAccessibilityVerbose"] = 149] = "inlineCompletionsAccessibilityVerbose";
    })(EditorOption || (exports.EditorOption = EditorOption = {}));
    exports.EditorOptions = {
        acceptSuggestionOnCommitCharacter: register(new EditorBooleanOption(0 /* EditorOption.acceptSuggestionOnCommitCharacter */, 'acceptSuggestionOnCommitCharacter', true, { markdownDescription: nls.localize('acceptSuggestionOnCommitCharacter', "Controls whether suggestions should be accepted on commit characters. For example, in JavaScript, the semi-colon (`;`) can be a commit character that accepts a suggestion and types that character.") })),
        acceptSuggestionOnEnter: register(new EditorStringEnumOption(1 /* EditorOption.acceptSuggestionOnEnter */, 'acceptSuggestionOnEnter', 'on', ['on', 'smart', 'off'], {
            markdownEnumDescriptions: [
                '',
                nls.localize('acceptSuggestionOnEnterSmart', "Only accept a suggestion with `Enter` when it makes a textual change."),
                ''
            ],
            markdownDescription: nls.localize('acceptSuggestionOnEnter', "Controls whether suggestions should be accepted on `Enter`, in addition to `Tab`. Helps to avoid ambiguity between inserting new lines or accepting suggestions.")
        })),
        accessibilitySupport: register(new EditorAccessibilitySupport()),
        accessibilityPageSize: register(new EditorIntOption(3 /* EditorOption.accessibilityPageSize */, 'accessibilityPageSize', 10, 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, {
            description: nls.localize('accessibilityPageSize', "Controls the number of lines in the editor that can be read out by a screen reader at once. When we detect a screen reader we automatically set the default to be 500. Warning: this has a performance implication for numbers larger than the default."),
            tags: ['accessibility']
        })),
        ariaLabel: register(new EditorStringOption(4 /* EditorOption.ariaLabel */, 'ariaLabel', nls.localize('editorViewAccessibleLabel', "Editor content"))),
        ariaRequired: register(new EditorBooleanOption(5 /* EditorOption.ariaRequired */, 'ariaRequired', false, undefined)),
        screenReaderAnnounceInlineSuggestion: register(new EditorBooleanOption(8 /* EditorOption.screenReaderAnnounceInlineSuggestion */, 'screenReaderAnnounceInlineSuggestion', true, {
            description: nls.localize('screenReaderAnnounceInlineSuggestion', "Control whether inline suggestions are announced by a screen reader."),
            tags: ['accessibility']
        })),
        autoClosingBrackets: register(new EditorStringEnumOption(6 /* EditorOption.autoClosingBrackets */, 'autoClosingBrackets', 'languageDefined', ['always', 'languageDefined', 'beforeWhitespace', 'never'], {
            enumDescriptions: [
                '',
                nls.localize('editor.autoClosingBrackets.languageDefined', "Use language configurations to determine when to autoclose brackets."),
                nls.localize('editor.autoClosingBrackets.beforeWhitespace', "Autoclose brackets only when the cursor is to the left of whitespace."),
                '',
            ],
            description: nls.localize('autoClosingBrackets', "Controls whether the editor should automatically close brackets after the user adds an opening bracket.")
        })),
        autoClosingComments: register(new EditorStringEnumOption(7 /* EditorOption.autoClosingComments */, 'autoClosingComments', 'languageDefined', ['always', 'languageDefined', 'beforeWhitespace', 'never'], {
            enumDescriptions: [
                '',
                nls.localize('editor.autoClosingComments.languageDefined', "Use language configurations to determine when to autoclose comments."),
                nls.localize('editor.autoClosingComments.beforeWhitespace', "Autoclose comments only when the cursor is to the left of whitespace."),
                '',
            ],
            description: nls.localize('autoClosingComments', "Controls whether the editor should automatically close comments after the user adds an opening comment.")
        })),
        autoClosingDelete: register(new EditorStringEnumOption(9 /* EditorOption.autoClosingDelete */, 'autoClosingDelete', 'auto', ['always', 'auto', 'never'], {
            enumDescriptions: [
                '',
                nls.localize('editor.autoClosingDelete.auto', "Remove adjacent closing quotes or brackets only if they were automatically inserted."),
                '',
            ],
            description: nls.localize('autoClosingDelete', "Controls whether the editor should remove adjacent closing quotes or brackets when deleting.")
        })),
        autoClosingOvertype: register(new EditorStringEnumOption(10 /* EditorOption.autoClosingOvertype */, 'autoClosingOvertype', 'auto', ['always', 'auto', 'never'], {
            enumDescriptions: [
                '',
                nls.localize('editor.autoClosingOvertype.auto', "Type over closing quotes or brackets only if they were automatically inserted."),
                '',
            ],
            description: nls.localize('autoClosingOvertype', "Controls whether the editor should type over closing quotes or brackets.")
        })),
        autoClosingQuotes: register(new EditorStringEnumOption(11 /* EditorOption.autoClosingQuotes */, 'autoClosingQuotes', 'languageDefined', ['always', 'languageDefined', 'beforeWhitespace', 'never'], {
            enumDescriptions: [
                '',
                nls.localize('editor.autoClosingQuotes.languageDefined', "Use language configurations to determine when to autoclose quotes."),
                nls.localize('editor.autoClosingQuotes.beforeWhitespace', "Autoclose quotes only when the cursor is to the left of whitespace."),
                '',
            ],
            description: nls.localize('autoClosingQuotes', "Controls whether the editor should automatically close quotes after the user adds an opening quote.")
        })),
        autoIndent: register(new EditorEnumOption(12 /* EditorOption.autoIndent */, 'autoIndent', 4 /* EditorAutoIndentStrategy.Full */, 'full', ['none', 'keep', 'brackets', 'advanced', 'full'], _autoIndentFromString, {
            enumDescriptions: [
                nls.localize('editor.autoIndent.none', "The editor will not insert indentation automatically."),
                nls.localize('editor.autoIndent.keep', "The editor will keep the current line's indentation."),
                nls.localize('editor.autoIndent.brackets', "The editor will keep the current line's indentation and honor language defined brackets."),
                nls.localize('editor.autoIndent.advanced', "The editor will keep the current line's indentation, honor language defined brackets and invoke special onEnterRules defined by languages."),
                nls.localize('editor.autoIndent.full', "The editor will keep the current line's indentation, honor language defined brackets, invoke special onEnterRules defined by languages, and honor indentationRules defined by languages."),
            ],
            description: nls.localize('autoIndent', "Controls whether the editor should automatically adjust the indentation when users type, paste, move or indent lines.")
        })),
        automaticLayout: register(new EditorBooleanOption(13 /* EditorOption.automaticLayout */, 'automaticLayout', false)),
        autoSurround: register(new EditorStringEnumOption(14 /* EditorOption.autoSurround */, 'autoSurround', 'languageDefined', ['languageDefined', 'quotes', 'brackets', 'never'], {
            enumDescriptions: [
                nls.localize('editor.autoSurround.languageDefined', "Use language configurations to determine when to automatically surround selections."),
                nls.localize('editor.autoSurround.quotes', "Surround with quotes but not brackets."),
                nls.localize('editor.autoSurround.brackets', "Surround with brackets but not quotes."),
                ''
            ],
            description: nls.localize('autoSurround', "Controls whether the editor should automatically surround selections when typing quotes or brackets.")
        })),
        bracketPairColorization: register(new BracketPairColorization()),
        bracketPairGuides: register(new GuideOptions()),
        stickyTabStops: register(new EditorBooleanOption(116 /* EditorOption.stickyTabStops */, 'stickyTabStops', false, { description: nls.localize('stickyTabStops', "Emulate selection behavior of tab characters when using spaces for indentation. Selection will stick to tab stops.") })),
        codeLens: register(new EditorBooleanOption(17 /* EditorOption.codeLens */, 'codeLens', true, { description: nls.localize('codeLens', "Controls whether the editor shows CodeLens.") })),
        codeLensFontFamily: register(new EditorStringOption(18 /* EditorOption.codeLensFontFamily */, 'codeLensFontFamily', '', { description: nls.localize('codeLensFontFamily', "Controls the font family for CodeLens.") })),
        codeLensFontSize: register(new EditorIntOption(19 /* EditorOption.codeLensFontSize */, 'codeLensFontSize', 0, 0, 100, {
            type: 'number',
            default: 0,
            minimum: 0,
            maximum: 100,
            markdownDescription: nls.localize('codeLensFontSize', "Controls the font size in pixels for CodeLens. When set to 0, 90% of `#editor.fontSize#` is used.")
        })),
        colorDecorators: register(new EditorBooleanOption(20 /* EditorOption.colorDecorators */, 'colorDecorators', true, { description: nls.localize('colorDecorators', "Controls whether the editor should render the inline color decorators and color picker.") })),
        colorDecoratorActivatedOn: register(new EditorStringEnumOption(148 /* EditorOption.colorDecoratorsActivatedOn */, 'colorDecoratorsActivatedOn', 'clickAndHover', ['clickAndHover', 'hover', 'click'], {
            enumDescriptions: [
                nls.localize('editor.colorDecoratorActivatedOn.clickAndHover', "Make the color picker appear both on click and hover of the color decorator"),
                nls.localize('editor.colorDecoratorActivatedOn.hover', "Make the color picker appear on hover of the color decorator"),
                nls.localize('editor.colorDecoratorActivatedOn.click', "Make the color picker appear on click of the color decorator")
            ],
            description: nls.localize('colorDecoratorActivatedOn', "Controls the condition to make a color picker appear from a color decorator")
        })),
        colorDecoratorsLimit: register(new EditorIntOption(21 /* EditorOption.colorDecoratorsLimit */, 'colorDecoratorsLimit', 500, 1, 1000000, {
            markdownDescription: nls.localize('colorDecoratorsLimit', "Controls the max number of color decorators that can be rendered in an editor at once.")
        })),
        columnSelection: register(new EditorBooleanOption(22 /* EditorOption.columnSelection */, 'columnSelection', false, { description: nls.localize('columnSelection', "Enable that the selection with the mouse and keys is doing column selection.") })),
        comments: register(new EditorComments()),
        contextmenu: register(new EditorBooleanOption(24 /* EditorOption.contextmenu */, 'contextmenu', true)),
        copyWithSyntaxHighlighting: register(new EditorBooleanOption(25 /* EditorOption.copyWithSyntaxHighlighting */, 'copyWithSyntaxHighlighting', true, { description: nls.localize('copyWithSyntaxHighlighting', "Controls whether syntax highlighting should be copied into the clipboard.") })),
        cursorBlinking: register(new EditorEnumOption(26 /* EditorOption.cursorBlinking */, 'cursorBlinking', 1 /* TextEditorCursorBlinkingStyle.Blink */, 'blink', ['blink', 'smooth', 'phase', 'expand', 'solid'], _cursorBlinkingStyleFromString, { description: nls.localize('cursorBlinking', "Control the cursor animation style.") })),
        cursorSmoothCaretAnimation: register(new EditorStringEnumOption(27 /* EditorOption.cursorSmoothCaretAnimation */, 'cursorSmoothCaretAnimation', 'off', ['off', 'explicit', 'on'], {
            enumDescriptions: [
                nls.localize('cursorSmoothCaretAnimation.off', "Smooth caret animation is disabled."),
                nls.localize('cursorSmoothCaretAnimation.explicit', "Smooth caret animation is enabled only when the user moves the cursor with an explicit gesture."),
                nls.localize('cursorSmoothCaretAnimation.on', "Smooth caret animation is always enabled.")
            ],
            description: nls.localize('cursorSmoothCaretAnimation', "Controls whether the smooth caret animation should be enabled.")
        })),
        cursorStyle: register(new EditorEnumOption(28 /* EditorOption.cursorStyle */, 'cursorStyle', TextEditorCursorStyle.Line, 'line', ['line', 'block', 'underline', 'line-thin', 'block-outline', 'underline-thin'], _cursorStyleFromString, { description: nls.localize('cursorStyle', "Controls the cursor style.") })),
        cursorSurroundingLines: register(new EditorIntOption(29 /* EditorOption.cursorSurroundingLines */, 'cursorSurroundingLines', 0, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, { description: nls.localize('cursorSurroundingLines', "Controls the minimal number of visible leading lines (minimum 0) and trailing lines (minimum 1) surrounding the cursor. Known as 'scrollOff' or 'scrollOffset' in some other editors.") })),
        cursorSurroundingLinesStyle: register(new EditorStringEnumOption(30 /* EditorOption.cursorSurroundingLinesStyle */, 'cursorSurroundingLinesStyle', 'default', ['default', 'all'], {
            enumDescriptions: [
                nls.localize('cursorSurroundingLinesStyle.default', "`cursorSurroundingLines` is enforced only when triggered via the keyboard or API."),
                nls.localize('cursorSurroundingLinesStyle.all', "`cursorSurroundingLines` is enforced always.")
            ],
            markdownDescription: nls.localize('cursorSurroundingLinesStyle', "Controls when `#editor.cursorSurroundingLines#` should be enforced.")
        })),
        cursorWidth: register(new EditorIntOption(31 /* EditorOption.cursorWidth */, 'cursorWidth', 0, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, { markdownDescription: nls.localize('cursorWidth', "Controls the width of the cursor when `#editor.cursorStyle#` is set to `line`.") })),
        disableLayerHinting: register(new EditorBooleanOption(32 /* EditorOption.disableLayerHinting */, 'disableLayerHinting', false)),
        disableMonospaceOptimizations: register(new EditorBooleanOption(33 /* EditorOption.disableMonospaceOptimizations */, 'disableMonospaceOptimizations', false)),
        domReadOnly: register(new EditorBooleanOption(34 /* EditorOption.domReadOnly */, 'domReadOnly', false)),
        dragAndDrop: register(new EditorBooleanOption(35 /* EditorOption.dragAndDrop */, 'dragAndDrop', true, { description: nls.localize('dragAndDrop', "Controls whether the editor should allow moving selections via drag and drop.") })),
        emptySelectionClipboard: register(new EditorEmptySelectionClipboard()),
        dropIntoEditor: register(new EditorDropIntoEditor()),
        stickyScroll: register(new EditorStickyScroll()),
        experimentalWhitespaceRendering: register(new EditorStringEnumOption(38 /* EditorOption.experimentalWhitespaceRendering */, 'experimentalWhitespaceRendering', 'svg', ['svg', 'font', 'off'], {
            enumDescriptions: [
                nls.localize('experimentalWhitespaceRendering.svg', "Use a new rendering method with svgs."),
                nls.localize('experimentalWhitespaceRendering.font', "Use a new rendering method with font characters."),
                nls.localize('experimentalWhitespaceRendering.off', "Use the stable rendering method."),
            ],
            description: nls.localize('experimentalWhitespaceRendering', "Controls whether whitespace is rendered with a new, experimental method.")
        })),
        extraEditorClassName: register(new EditorStringOption(39 /* EditorOption.extraEditorClassName */, 'extraEditorClassName', '')),
        fastScrollSensitivity: register(new EditorFloatOption(40 /* EditorOption.fastScrollSensitivity */, 'fastScrollSensitivity', 5, x => (x <= 0 ? 5 : x), { markdownDescription: nls.localize('fastScrollSensitivity', "Scrolling speed multiplier when pressing `Alt`.") })),
        find: register(new EditorFind()),
        fixedOverflowWidgets: register(new EditorBooleanOption(42 /* EditorOption.fixedOverflowWidgets */, 'fixedOverflowWidgets', false)),
        folding: register(new EditorBooleanOption(43 /* EditorOption.folding */, 'folding', true, { description: nls.localize('folding', "Controls whether the editor has code folding enabled.") })),
        foldingStrategy: register(new EditorStringEnumOption(44 /* EditorOption.foldingStrategy */, 'foldingStrategy', 'auto', ['auto', 'indentation'], {
            enumDescriptions: [
                nls.localize('foldingStrategy.auto', "Use a language-specific folding strategy if available, else the indentation-based one."),
                nls.localize('foldingStrategy.indentation', "Use the indentation-based folding strategy."),
            ],
            description: nls.localize('foldingStrategy', "Controls the strategy for computing folding ranges.")
        })),
        foldingHighlight: register(new EditorBooleanOption(45 /* EditorOption.foldingHighlight */, 'foldingHighlight', true, { description: nls.localize('foldingHighlight', "Controls whether the editor should highlight folded ranges.") })),
        foldingImportsByDefault: register(new EditorBooleanOption(46 /* EditorOption.foldingImportsByDefault */, 'foldingImportsByDefault', false, { description: nls.localize('foldingImportsByDefault', "Controls whether the editor automatically collapses import ranges.") })),
        foldingMaximumRegions: register(new EditorIntOption(47 /* EditorOption.foldingMaximumRegions */, 'foldingMaximumRegions', 5000, 10, 65000, // limit must be less than foldingRanges MAX_FOLDING_REGIONS
        { description: nls.localize('foldingMaximumRegions', "The maximum number of foldable regions. Increasing this value may result in the editor becoming less responsive when the current source has a large number of foldable regions.") })),
        unfoldOnClickAfterEndOfLine: register(new EditorBooleanOption(48 /* EditorOption.unfoldOnClickAfterEndOfLine */, 'unfoldOnClickAfterEndOfLine', false, { description: nls.localize('unfoldOnClickAfterEndOfLine', "Controls whether clicking on the empty content after a folded line will unfold the line.") })),
        fontFamily: register(new EditorStringOption(49 /* EditorOption.fontFamily */, 'fontFamily', exports.EDITOR_FONT_DEFAULTS.fontFamily, { description: nls.localize('fontFamily', "Controls the font family.") })),
        fontInfo: register(new EditorFontInfo()),
        fontLigatures2: register(new EditorFontLigatures()),
        fontSize: register(new EditorFontSize()),
        fontWeight: register(new EditorFontWeight()),
        fontVariations: register(new EditorFontVariations()),
        formatOnPaste: register(new EditorBooleanOption(55 /* EditorOption.formatOnPaste */, 'formatOnPaste', false, { description: nls.localize('formatOnPaste', "Controls whether the editor should automatically format the pasted content. A formatter must be available and the formatter should be able to format a range in a document.") })),
        formatOnType: register(new EditorBooleanOption(56 /* EditorOption.formatOnType */, 'formatOnType', false, { description: nls.localize('formatOnType', "Controls whether the editor should automatically format the line after typing.") })),
        glyphMargin: register(new EditorBooleanOption(57 /* EditorOption.glyphMargin */, 'glyphMargin', true, { description: nls.localize('glyphMargin', "Controls whether the editor should render the vertical glyph margin. Glyph margin is mostly used for debugging.") })),
        gotoLocation: register(new EditorGoToLocation()),
        hideCursorInOverviewRuler: register(new EditorBooleanOption(59 /* EditorOption.hideCursorInOverviewRuler */, 'hideCursorInOverviewRuler', false, { description: nls.localize('hideCursorInOverviewRuler', "Controls whether the cursor should be hidden in the overview ruler.") })),
        hover: register(new EditorHover()),
        inDiffEditor: register(new EditorBooleanOption(61 /* EditorOption.inDiffEditor */, 'inDiffEditor', false)),
        letterSpacing: register(new EditorFloatOption(64 /* EditorOption.letterSpacing */, 'letterSpacing', exports.EDITOR_FONT_DEFAULTS.letterSpacing, x => EditorFloatOption.clamp(x, -5, 20), { description: nls.localize('letterSpacing', "Controls the letter spacing in pixels.") })),
        lightbulb: register(new EditorLightbulb()),
        lineDecorationsWidth: register(new EditorLineDecorationsWidth()),
        lineHeight: register(new EditorLineHeight()),
        lineNumbers: register(new EditorRenderLineNumbersOption()),
        lineNumbersMinChars: register(new EditorIntOption(69 /* EditorOption.lineNumbersMinChars */, 'lineNumbersMinChars', 5, 1, 300)),
        linkedEditing: register(new EditorBooleanOption(70 /* EditorOption.linkedEditing */, 'linkedEditing', false, { description: nls.localize('linkedEditing', "Controls whether the editor has linked editing enabled. Depending on the language, related symbols such as HTML tags, are updated while editing.") })),
        links: register(new EditorBooleanOption(71 /* EditorOption.links */, 'links', true, { description: nls.localize('links', "Controls whether the editor should detect links and make them clickable.") })),
        matchBrackets: register(new EditorStringEnumOption(72 /* EditorOption.matchBrackets */, 'matchBrackets', 'always', ['always', 'near', 'never'], { description: nls.localize('matchBrackets', "Highlight matching brackets.") })),
        minimap: register(new EditorMinimap()),
        mouseStyle: register(new EditorStringEnumOption(74 /* EditorOption.mouseStyle */, 'mouseStyle', 'text', ['text', 'default', 'copy'])),
        mouseWheelScrollSensitivity: register(new EditorFloatOption(75 /* EditorOption.mouseWheelScrollSensitivity */, 'mouseWheelScrollSensitivity', 1, x => (x === 0 ? 1 : x), { markdownDescription: nls.localize('mouseWheelScrollSensitivity', "A multiplier to be used on the `deltaX` and `deltaY` of mouse wheel scroll events.") })),
        mouseWheelZoom: register(new EditorBooleanOption(76 /* EditorOption.mouseWheelZoom */, 'mouseWheelZoom', false, {
            markdownDescription: platform.isMacintosh
                ? nls.localize('mouseWheelZoom.mac', "Zoom the font of the editor when using mouse wheel and holding `Cmd`.")
                : nls.localize('mouseWheelZoom', "Zoom the font of the editor when using mouse wheel and holding `Ctrl`.")
        })),
        multiCursorMergeOverlapping: register(new EditorBooleanOption(77 /* EditorOption.multiCursorMergeOverlapping */, 'multiCursorMergeOverlapping', true, { description: nls.localize('multiCursorMergeOverlapping', "Merge multiple cursors when they are overlapping.") })),
        multiCursorModifier: register(new EditorEnumOption(78 /* EditorOption.multiCursorModifier */, 'multiCursorModifier', 'altKey', 'alt', ['ctrlCmd', 'alt'], _multiCursorModifierFromString, {
            markdownEnumDescriptions: [
                nls.localize('multiCursorModifier.ctrlCmd', "Maps to `Control` on Windows and Linux and to `Command` on macOS."),
                nls.localize('multiCursorModifier.alt', "Maps to `Alt` on Windows and Linux and to `Option` on macOS.")
            ],
            markdownDescription: nls.localize({
                key: 'multiCursorModifier',
                comment: [
                    '- `ctrlCmd` refers to a value the setting can take and should not be localized.',
                    '- `Control` and `Command` refer to the modifier keys Ctrl or Cmd on the keyboard and can be localized.'
                ]
            }, "The modifier to be used to add multiple cursors with the mouse. The Go to Definition and Open Link mouse gestures will adapt such that they do not conflict with the [multicursor modifier](https://code.visualstudio.com/docs/editor/codebasics#_multicursor-modifier).")
        })),
        multiCursorPaste: register(new EditorStringEnumOption(79 /* EditorOption.multiCursorPaste */, 'multiCursorPaste', 'spread', ['spread', 'full'], {
            markdownEnumDescriptions: [
                nls.localize('multiCursorPaste.spread', "Each cursor pastes a single line of the text."),
                nls.localize('multiCursorPaste.full', "Each cursor pastes the full text.")
            ],
            markdownDescription: nls.localize('multiCursorPaste', "Controls pasting when the line count of the pasted text matches the cursor count.")
        })),
        multiCursorLimit: register(new EditorIntOption(80 /* EditorOption.multiCursorLimit */, 'multiCursorLimit', 10000, 1, 100000, {
            markdownDescription: nls.localize('multiCursorLimit', "Controls the max number of cursors that can be in an active editor at once.")
        })),
        occurrencesHighlight: register(new EditorStringEnumOption(81 /* EditorOption.occurrencesHighlight */, 'occurrencesHighlight', 'singleFile', ['off', 'singleFile', 'multiFile'], {
            markdownEnumDescriptions: [
                nls.localize('occurrencesHighlight.off', "Does not highlight occurrences."),
                nls.localize('occurrencesHighlight.singleFile', "Highlights occurrences only in the current file."),
                nls.localize('occurrencesHighlight.multiFile', "Experimental: Highlights occurrences across all valid open files.")
            ],
            markdownDescription: nls.localize('occurrencesHighlight', "Controls whether occurrences should be highlighted across open files.")
        })),
        overviewRulerBorder: register(new EditorBooleanOption(82 /* EditorOption.overviewRulerBorder */, 'overviewRulerBorder', true, { description: nls.localize('overviewRulerBorder', "Controls whether a border should be drawn around the overview ruler.") })),
        overviewRulerLanes: register(new EditorIntOption(83 /* EditorOption.overviewRulerLanes */, 'overviewRulerLanes', 3, 0, 3)),
        padding: register(new EditorPadding()),
        pasteAs: register(new EditorPasteAs()),
        parameterHints: register(new EditorParameterHints()),
        peekWidgetDefaultFocus: register(new EditorStringEnumOption(87 /* EditorOption.peekWidgetDefaultFocus */, 'peekWidgetDefaultFocus', 'tree', ['tree', 'editor'], {
            enumDescriptions: [
                nls.localize('peekWidgetDefaultFocus.tree', "Focus the tree when opening peek"),
                nls.localize('peekWidgetDefaultFocus.editor', "Focus the editor when opening peek")
            ],
            description: nls.localize('peekWidgetDefaultFocus', "Controls whether to focus the inline editor or the tree in the peek widget.")
        })),
        definitionLinkOpensInPeek: register(new EditorBooleanOption(88 /* EditorOption.definitionLinkOpensInPeek */, 'definitionLinkOpensInPeek', false, { description: nls.localize('definitionLinkOpensInPeek', "Controls whether the Go to Definition mouse gesture always opens the peek widget.") })),
        quickSuggestions: register(new EditorQuickSuggestions()),
        quickSuggestionsDelay: register(new EditorIntOption(90 /* EditorOption.quickSuggestionsDelay */, 'quickSuggestionsDelay', 10, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, { description: nls.localize('quickSuggestionsDelay', "Controls the delay in milliseconds after which quick suggestions will show up.") })),
        readOnly: register(new EditorBooleanOption(91 /* EditorOption.readOnly */, 'readOnly', false)),
        readOnlyMessage: register(new ReadonlyMessage()),
        renameOnType: register(new EditorBooleanOption(93 /* EditorOption.renameOnType */, 'renameOnType', false, { description: nls.localize('renameOnType', "Controls whether the editor auto renames on type."), markdownDeprecationMessage: nls.localize('renameOnTypeDeprecate', "Deprecated, use `editor.linkedEditing` instead.") })),
        renderControlCharacters: register(new EditorBooleanOption(94 /* EditorOption.renderControlCharacters */, 'renderControlCharacters', true, { description: nls.localize('renderControlCharacters', "Controls whether the editor should render control characters."), restricted: true })),
        renderFinalNewline: register(new EditorStringEnumOption(95 /* EditorOption.renderFinalNewline */, 'renderFinalNewline', (platform.isLinux ? 'dimmed' : 'on'), ['off', 'on', 'dimmed'], { description: nls.localize('renderFinalNewline', "Render last line number when the file ends with a newline.") })),
        renderLineHighlight: register(new EditorStringEnumOption(96 /* EditorOption.renderLineHighlight */, 'renderLineHighlight', 'line', ['none', 'gutter', 'line', 'all'], {
            enumDescriptions: [
                '',
                '',
                '',
                nls.localize('renderLineHighlight.all', "Highlights both the gutter and the current line."),
            ],
            description: nls.localize('renderLineHighlight', "Controls how the editor should render the current line highlight.")
        })),
        renderLineHighlightOnlyWhenFocus: register(new EditorBooleanOption(97 /* EditorOption.renderLineHighlightOnlyWhenFocus */, 'renderLineHighlightOnlyWhenFocus', false, { description: nls.localize('renderLineHighlightOnlyWhenFocus', "Controls if the editor should render the current line highlight only when the editor is focused.") })),
        renderValidationDecorations: register(new EditorStringEnumOption(98 /* EditorOption.renderValidationDecorations */, 'renderValidationDecorations', 'editable', ['editable', 'on', 'off'])),
        renderWhitespace: register(new EditorStringEnumOption(99 /* EditorOption.renderWhitespace */, 'renderWhitespace', 'selection', ['none', 'boundary', 'selection', 'trailing', 'all'], {
            enumDescriptions: [
                '',
                nls.localize('renderWhitespace.boundary', "Render whitespace characters except for single spaces between words."),
                nls.localize('renderWhitespace.selection', "Render whitespace characters only on selected text."),
                nls.localize('renderWhitespace.trailing', "Render only trailing whitespace characters."),
                ''
            ],
            description: nls.localize('renderWhitespace', "Controls how the editor should render whitespace characters.")
        })),
        revealHorizontalRightPadding: register(new EditorIntOption(100 /* EditorOption.revealHorizontalRightPadding */, 'revealHorizontalRightPadding', 15, 0, 1000)),
        roundedSelection: register(new EditorBooleanOption(101 /* EditorOption.roundedSelection */, 'roundedSelection', true, { description: nls.localize('roundedSelection', "Controls whether selections should have rounded corners.") })),
        rulers: register(new EditorRulers()),
        scrollbar: register(new EditorScrollbar()),
        scrollBeyondLastColumn: register(new EditorIntOption(104 /* EditorOption.scrollBeyondLastColumn */, 'scrollBeyondLastColumn', 4, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, { description: nls.localize('scrollBeyondLastColumn', "Controls the number of extra characters beyond which the editor will scroll horizontally.") })),
        scrollBeyondLastLine: register(new EditorBooleanOption(105 /* EditorOption.scrollBeyondLastLine */, 'scrollBeyondLastLine', true, { description: nls.localize('scrollBeyondLastLine', "Controls whether the editor will scroll beyond the last line.") })),
        scrollPredominantAxis: register(new EditorBooleanOption(106 /* EditorOption.scrollPredominantAxis */, 'scrollPredominantAxis', true, { description: nls.localize('scrollPredominantAxis', "Scroll only along the predominant axis when scrolling both vertically and horizontally at the same time. Prevents horizontal drift when scrolling vertically on a trackpad.") })),
        selectionClipboard: register(new EditorBooleanOption(107 /* EditorOption.selectionClipboard */, 'selectionClipboard', true, {
            description: nls.localize('selectionClipboard', "Controls whether the Linux primary clipboard should be supported."),
            included: platform.isLinux
        })),
        selectionHighlight: register(new EditorBooleanOption(108 /* EditorOption.selectionHighlight */, 'selectionHighlight', true, { description: nls.localize('selectionHighlight', "Controls whether the editor should highlight matches similar to the selection.") })),
        selectOnLineNumbers: register(new EditorBooleanOption(109 /* EditorOption.selectOnLineNumbers */, 'selectOnLineNumbers', true)),
        showFoldingControls: register(new EditorStringEnumOption(110 /* EditorOption.showFoldingControls */, 'showFoldingControls', 'mouseover', ['always', 'never', 'mouseover'], {
            enumDescriptions: [
                nls.localize('showFoldingControls.always', "Always show the folding controls."),
                nls.localize('showFoldingControls.never', "Never show the folding controls and reduce the gutter size."),
                nls.localize('showFoldingControls.mouseover', "Only show the folding controls when the mouse is over the gutter."),
            ],
            description: nls.localize('showFoldingControls', "Controls when the folding controls on the gutter are shown.")
        })),
        showUnused: register(new EditorBooleanOption(111 /* EditorOption.showUnused */, 'showUnused', true, { description: nls.localize('showUnused', "Controls fading out of unused code.") })),
        showDeprecated: register(new EditorBooleanOption(140 /* EditorOption.showDeprecated */, 'showDeprecated', true, { description: nls.localize('showDeprecated', "Controls strikethrough deprecated variables.") })),
        inlayHints: register(new EditorInlayHints()),
        snippetSuggestions: register(new EditorStringEnumOption(112 /* EditorOption.snippetSuggestions */, 'snippetSuggestions', 'inline', ['top', 'bottom', 'inline', 'none'], {
            enumDescriptions: [
                nls.localize('snippetSuggestions.top', "Show snippet suggestions on top of other suggestions."),
                nls.localize('snippetSuggestions.bottom', "Show snippet suggestions below other suggestions."),
                nls.localize('snippetSuggestions.inline', "Show snippets suggestions with other suggestions."),
                nls.localize('snippetSuggestions.none', "Do not show snippet suggestions."),
            ],
            description: nls.localize('snippetSuggestions', "Controls whether snippets are shown with other suggestions and how they are sorted.")
        })),
        smartSelect: register(new SmartSelect()),
        smoothScrolling: register(new EditorBooleanOption(114 /* EditorOption.smoothScrolling */, 'smoothScrolling', false, { description: nls.localize('smoothScrolling', "Controls whether the editor will scroll using an animation.") })),
        stopRenderingLineAfter: register(new EditorIntOption(117 /* EditorOption.stopRenderingLineAfter */, 'stopRenderingLineAfter', 10000, -1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */)),
        suggest: register(new EditorSuggest()),
        inlineSuggest: register(new InlineEditorSuggest()),
        inlineEdit: register(new InlineEditorEdit()),
        inlineCompletionsAccessibilityVerbose: register(new EditorBooleanOption(149 /* EditorOption.inlineCompletionsAccessibilityVerbose */, 'inlineCompletionsAccessibilityVerbose', false, { description: nls.localize('inlineCompletionsAccessibilityVerbose', "Controls whether the accessibility hint should be provided to screen reader users when an inline completion is shown.") })),
        suggestFontSize: register(new EditorIntOption(119 /* EditorOption.suggestFontSize */, 'suggestFontSize', 0, 0, 1000, { markdownDescription: nls.localize('suggestFontSize', "Font size for the suggest widget. When set to {0}, the value of {1} is used.", '`0`', '`#editor.fontSize#`') })),
        suggestLineHeight: register(new EditorIntOption(120 /* EditorOption.suggestLineHeight */, 'suggestLineHeight', 0, 0, 1000, { markdownDescription: nls.localize('suggestLineHeight', "Line height for the suggest widget. When set to {0}, the value of {1} is used. The minimum value is 8.", '`0`', '`#editor.lineHeight#`') })),
        suggestOnTriggerCharacters: register(new EditorBooleanOption(121 /* EditorOption.suggestOnTriggerCharacters */, 'suggestOnTriggerCharacters', true, { description: nls.localize('suggestOnTriggerCharacters', "Controls whether suggestions should automatically show up when typing trigger characters.") })),
        suggestSelection: register(new EditorStringEnumOption(122 /* EditorOption.suggestSelection */, 'suggestSelection', 'first', ['first', 'recentlyUsed', 'recentlyUsedByPrefix'], {
            markdownEnumDescriptions: [
                nls.localize('suggestSelection.first', "Always select the first suggestion."),
                nls.localize('suggestSelection.recentlyUsed', "Select recent suggestions unless further typing selects one, e.g. `console.| -> console.log` because `log` has been completed recently."),
                nls.localize('suggestSelection.recentlyUsedByPrefix', "Select suggestions based on previous prefixes that have completed those suggestions, e.g. `co -> console` and `con -> const`."),
            ],
            description: nls.localize('suggestSelection', "Controls how suggestions are pre-selected when showing the suggest list.")
        })),
        tabCompletion: register(new EditorStringEnumOption(123 /* EditorOption.tabCompletion */, 'tabCompletion', 'off', ['on', 'off', 'onlySnippets'], {
            enumDescriptions: [
                nls.localize('tabCompletion.on', "Tab complete will insert the best matching suggestion when pressing tab."),
                nls.localize('tabCompletion.off', "Disable tab completions."),
                nls.localize('tabCompletion.onlySnippets', "Tab complete snippets when their prefix match. Works best when 'quickSuggestions' aren't enabled."),
            ],
            description: nls.localize('tabCompletion', "Enables tab completions.")
        })),
        tabIndex: register(new EditorIntOption(124 /* EditorOption.tabIndex */, 'tabIndex', 0, -1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */)),
        unicodeHighlight: register(new UnicodeHighlight()),
        unusualLineTerminators: register(new EditorStringEnumOption(126 /* EditorOption.unusualLineTerminators */, 'unusualLineTerminators', 'prompt', ['auto', 'off', 'prompt'], {
            enumDescriptions: [
                nls.localize('unusualLineTerminators.auto', "Unusual line terminators are automatically removed."),
                nls.localize('unusualLineTerminators.off', "Unusual line terminators are ignored."),
                nls.localize('unusualLineTerminators.prompt', "Unusual line terminators prompt to be removed."),
            ],
            description: nls.localize('unusualLineTerminators', "Remove unusual line terminators that might cause problems.")
        })),
        useShadowDOM: register(new EditorBooleanOption(127 /* EditorOption.useShadowDOM */, 'useShadowDOM', true)),
        useTabStops: register(new EditorBooleanOption(128 /* EditorOption.useTabStops */, 'useTabStops', true, { description: nls.localize('useTabStops', "Spaces and tabs are inserted and deleted in alignment with tab stops.") })),
        wordBreak: register(new EditorStringEnumOption(129 /* EditorOption.wordBreak */, 'wordBreak', 'normal', ['normal', 'keepAll'], {
            markdownEnumDescriptions: [
                nls.localize('wordBreak.normal', "Use the default line break rule."),
                nls.localize('wordBreak.keepAll', "Word breaks should not be used for Chinese/Japanese/Korean (CJK) text. Non-CJK text behavior is the same as for normal."),
            ],
            description: nls.localize('wordBreak', "Controls the word break rules used for Chinese/Japanese/Korean (CJK) text.")
        })),
        wordSegmenterLocales: register(new WordSegmenterLocales()),
        wordSeparators: register(new EditorStringOption(131 /* EditorOption.wordSeparators */, 'wordSeparators', wordHelper_1.USUAL_WORD_SEPARATORS, { description: nls.localize('wordSeparators', "Characters that will be used as word separators when doing word related navigations or operations.") })),
        wordWrap: register(new EditorStringEnumOption(132 /* EditorOption.wordWrap */, 'wordWrap', 'off', ['off', 'on', 'wordWrapColumn', 'bounded'], {
            markdownEnumDescriptions: [
                nls.localize('wordWrap.off', "Lines will never wrap."),
                nls.localize('wordWrap.on', "Lines will wrap at the viewport width."),
                nls.localize({
                    key: 'wordWrap.wordWrapColumn',
                    comment: [
                        '- `editor.wordWrapColumn` refers to a different setting and should not be localized.'
                    ]
                }, "Lines will wrap at `#editor.wordWrapColumn#`."),
                nls.localize({
                    key: 'wordWrap.bounded',
                    comment: [
                        '- viewport means the edge of the visible window size.',
                        '- `editor.wordWrapColumn` refers to a different setting and should not be localized.'
                    ]
                }, "Lines will wrap at the minimum of viewport and `#editor.wordWrapColumn#`."),
            ],
            description: nls.localize({
                key: 'wordWrap',
                comment: [
                    '- \'off\', \'on\', \'wordWrapColumn\' and \'bounded\' refer to values the setting can take and should not be localized.',
                    '- `editor.wordWrapColumn` refers to a different setting and should not be localized.'
                ]
            }, "Controls how lines should wrap.")
        })),
        wordWrapBreakAfterCharacters: register(new EditorStringOption(133 /* EditorOption.wordWrapBreakAfterCharacters */, 'wordWrapBreakAfterCharacters', 
        // allow-any-unicode-next-line
        ' \t})]?|/&.,;¢°′″‰℃、。｡､￠，．：；？！％・･ゝゞヽヾーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ々〻ｧｨｩｪｫｬｭｮｯｰ”〉》」』】〕）］｝｣')),
        wordWrapBreakBeforeCharacters: register(new EditorStringOption(134 /* EditorOption.wordWrapBreakBeforeCharacters */, 'wordWrapBreakBeforeCharacters', 
        // allow-any-unicode-next-line
        '([{‘“〈《「『【〔（［｛｢£¥＄￡￥+＋')),
        wordWrapColumn: register(new EditorIntOption(135 /* EditorOption.wordWrapColumn */, 'wordWrapColumn', 80, 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, {
            markdownDescription: nls.localize({
                key: 'wordWrapColumn',
                comment: [
                    '- `editor.wordWrap` refers to a different setting and should not be localized.',
                    '- \'wordWrapColumn\' and \'bounded\' refer to values the different setting can take and should not be localized.'
                ]
            }, "Controls the wrapping column of the editor when `#editor.wordWrap#` is `wordWrapColumn` or `bounded`.")
        })),
        wordWrapOverride1: register(new EditorStringEnumOption(136 /* EditorOption.wordWrapOverride1 */, 'wordWrapOverride1', 'inherit', ['off', 'on', 'inherit'])),
        wordWrapOverride2: register(new EditorStringEnumOption(137 /* EditorOption.wordWrapOverride2 */, 'wordWrapOverride2', 'inherit', ['off', 'on', 'inherit'])),
        // Leave these at the end (because they have dependencies!)
        editorClassName: register(new EditorClassName()),
        defaultColorDecorators: register(new EditorBooleanOption(147 /* EditorOption.defaultColorDecorators */, 'defaultColorDecorators', false, { markdownDescription: nls.localize('defaultColorDecorators', "Controls whether inline color decorations should be shown using the default document color provider") })),
        pixelRatio: register(new EditorPixelRatio()),
        tabFocusMode: register(new EditorBooleanOption(144 /* EditorOption.tabFocusMode */, 'tabFocusMode', false, { markdownDescription: nls.localize('tabFocusMode', "Controls whether the editor receives tabs or defers them to the workbench for navigation.") })),
        layoutInfo: register(new EditorLayoutInfoComputer()),
        wrappingInfo: register(new EditorWrappingInfoComputer()),
        wrappingIndent: register(new WrappingIndentOption()),
        wrappingStrategy: register(new WrappingStrategy())
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yT3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb25maWcvZWRpdG9yT3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFta0NoRywwQkFTQztJQW9CRCxnQ0FXQztJQThCRCxvQ0FNQztJQWtFRCw4QkFXQztJQXNQRCxrREFTQztJQTI5REQsa0VBTUM7SUEzNUdEOztPQUVHO0lBQ0gsSUFBa0Isd0JBTWpCO0lBTkQsV0FBa0Isd0JBQXdCO1FBQ3pDLHVFQUFRLENBQUE7UUFDUix1RUFBUSxDQUFBO1FBQ1IsK0VBQVksQ0FBQTtRQUNaLCtFQUFZLENBQUE7UUFDWix1RUFBUSxDQUFBO0lBQ1QsQ0FBQyxFQU5pQix3QkFBd0Isd0NBQXhCLHdCQUF3QixRQU16QztJQXFzQkQ7OztPQUdHO0lBQ1UsUUFBQSxvQkFBb0IsR0FBRyxDQUFDLENBQUM7SUE4SHRDLFlBQVk7SUFFWjs7T0FFRztJQUNILE1BQWEseUJBQXlCO1FBRXJDOztXQUVHO1FBQ0gsWUFBWSxNQUFpQjtZQUM1QixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN2QixDQUFDO1FBQ00sVUFBVSxDQUFDLEVBQWdCO1lBQ2pDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN6QixDQUFDO0tBQ0Q7SUFYRCw4REFXQztJQThCRDs7T0FFRztJQUNILE1BQWEsb0JBQW9CO1FBTWhDO1lBQ0MsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQztZQUNyQyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxDQUFDLENBQUM7UUFDbEMsQ0FBQztLQUNEO0lBWEQsb0RBV0M7SUFrQ0Q7O09BRUc7SUFD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