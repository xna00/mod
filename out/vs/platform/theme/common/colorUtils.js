/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/async", "vs/base/common/color", "vs/base/common/event", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform"], function (require, exports, assert_1, async_1, color_1, event_1, jsonContributionRegistry_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.workbenchColorsSchemaId = exports.Extensions = exports.ColorTransformType = void 0;
    exports.asCssVariableName = asCssVariableName;
    exports.asCssVariable = asCssVariable;
    exports.asCssVariableWithDefault = asCssVariableWithDefault;
    exports.registerColor = registerColor;
    exports.getColorRegistry = getColorRegistry;
    exports.executeTransform = executeTransform;
    exports.darken = darken;
    exports.lighten = lighten;
    exports.transparent = transparent;
    exports.opaque = opaque;
    exports.oneOf = oneOf;
    exports.ifDefinedThenElse = ifDefinedThenElse;
    exports.lessProminent = lessProminent;
    exports.resolveColorValue = resolveColorValue;
    /**
     * Returns the css variable name for the given color identifier. Dots (`.`) are replaced with hyphens (`-`) and
     * everything is prefixed with `--vscode-`.
     *
     * @sample `editorSuggestWidget.background` is `--vscode-editorSuggestWidget-background`.
     */
    function asCssVariableName(colorIdent) {
        return `--vscode-${colorIdent.replace(/\./g, '-')}`;
    }
    function asCssVariable(color) {
        return `var(${asCssVariableName(color)})`;
    }
    function asCssVariableWithDefault(color, defaultCssValue) {
        return `var(${asCssVariableName(color)}, ${defaultCssValue})`;
    }
    var ColorTransformType;
    (function (ColorTransformType) {
        ColorTransformType[ColorTransformType["Darken"] = 0] = "Darken";
        ColorTransformType[ColorTransformType["Lighten"] = 1] = "Lighten";
        ColorTransformType[ColorTransformType["Transparent"] = 2] = "Transparent";
        ColorTransformType[ColorTransformType["Opaque"] = 3] = "Opaque";
        ColorTransformType[ColorTransformType["OneOf"] = 4] = "OneOf";
        ColorTransformType[ColorTransformType["LessProminent"] = 5] = "LessProminent";
        ColorTransformType[ColorTransformType["IfDefinedThenElse"] = 6] = "IfDefinedThenElse";
    })(ColorTransformType || (exports.ColorTransformType = ColorTransformType = {}));
    // color registry
    exports.Extensions = {
        ColorContribution: 'base.contributions.colors'
    };
    class ColorRegistry {
        constructor() {
            this._onDidChangeSchema = new event_1.Emitter();
            this.onDidChangeSchema = this._onDidChangeSchema.event;
            this.colorSchema = { type: 'object', properties: {} };
            this.colorReferenceSchema = { type: 'string', enum: [], enumDescriptions: [] };
            this.colorsById = {};
        }
        registerColor(id, defaults, description, needsTransparency = false, deprecationMessage) {
            const colorContribution = { id, description, defaults, needsTransparency, deprecationMessage };
            this.colorsById[id] = colorContribution;
            const propertySchema = { type: 'string', description, format: 'color-hex', defaultSnippets: [{ body: '${1:#ff0000}' }] };
            if (deprecationMessage) {
                propertySchema.deprecationMessage = deprecationMessage;
            }
            if (needsTransparency) {
                propertySchema.pattern = '^#(?:(?<rgba>[0-9a-fA-f]{3}[0-9a-eA-E])|(?:[0-9a-fA-F]{6}(?:(?![fF]{2})(?:[0-9a-fA-F]{2}))))?$';
                propertySchema.patternErrorMessage = 'This color must be transparent or it will obscure content';
            }
            this.colorSchema.properties[id] = propertySchema;
            this.colorReferenceSchema.enum.push(id);
            this.colorReferenceSchema.enumDescriptions.push(description);
            this._onDidChangeSchema.fire();
            return id;
        }
        deregisterColor(id) {
            delete this.colorsById[id];
            delete this.colorSchema.properties[id];
            const index = this.colorReferenceSchema.enum.indexOf(id);
            if (index !== -1) {
                this.colorReferenceSchema.enum.splice(index, 1);
                this.colorReferenceSchema.enumDescriptions.splice(index, 1);
            }
            this._onDidChangeSchema.fire();
        }
        getColors() {
            return Object.keys(this.colorsById).map(id => this.colorsById[id]);
        }
        resolveDefaultColor(id, theme) {
            const colorDesc = this.colorsById[id];
            if (colorDesc && colorDesc.defaults) {
                const colorValue = colorDesc.defaults[theme.type];
                return resolveColorValue(colorValue, theme);
            }
            return undefined;
        }
        getColorSchema() {
            return this.colorSchema;
        }
        getColorReferenceSchema() {
            return this.colorReferenceSchema;
        }
        toString() {
            const sorter = (a, b) => {
                const cat1 = a.indexOf('.') === -1 ? 0 : 1;
                const cat2 = b.indexOf('.') === -1 ? 0 : 1;
                if (cat1 !== cat2) {
                    return cat1 - cat2;
                }
                return a.localeCompare(b);
            };
            return Object.keys(this.colorsById).sort(sorter).map(k => `- \`${k}\`: ${this.colorsById[k].description}`).join('\n');
        }
    }
    const colorRegistry = new ColorRegistry();
    platform.Registry.add(exports.Extensions.ColorContribution, colorRegistry);
    function registerColor(id, defaults, description, needsTransparency, deprecationMessage) {
        return colorRegistry.registerColor(id, defaults, description, needsTransparency, deprecationMessage);
    }
    function getColorRegistry() {
        return colorRegistry;
    }
    // ----- color functions
    function executeTransform(transform, theme) {
        switch (transform.op) {
            case 0 /* ColorTransformType.Darken */:
                return resolveColorValue(transform.value, theme)?.darken(transform.factor);
            case 1 /* ColorTransformType.Lighten */:
                return resolveColorValue(transform.value, theme)?.lighten(transform.factor);
            case 2 /* ColorTransformType.Transparent */:
                return resolveColorValue(transform.value, theme)?.transparent(transform.factor);
            case 3 /* ColorTransformType.Opaque */: {
                const backgroundColor = resolveColorValue(transform.background, theme);
                if (!backgroundColor) {
                    return resolveColorValue(transform.value, theme);
                }
                return resolveColorValue(transform.value, theme)?.makeOpaque(backgroundColor);
            }
            case 4 /* ColorTransformType.OneOf */:
                for (const candidate of transform.values) {
                    const color = resolveColorValue(candidate, theme);
                    if (color) {
                        return color;
                    }
                }
                return undefined;
            case 6 /* ColorTransformType.IfDefinedThenElse */:
                return resolveColorValue(theme.defines(transform.if) ? transform.then : transform.else, theme);
            case 5 /* ColorTransformType.LessProminent */: {
                const from = resolveColorValue(transform.value, theme);
                if (!from) {
                    return undefined;
                }
                const backgroundColor = resolveColorValue(transform.background, theme);
                if (!backgroundColor) {
                    return from.transparent(transform.factor * transform.transparency);
                }
                return from.isDarkerThan(backgroundColor)
                    ? color_1.Color.getLighterColor(from, backgroundColor, transform.factor).transparent(transform.transparency)
                    : color_1.Color.getDarkerColor(from, backgroundColor, transform.factor).transparent(transform.transparency);
            }
            default:
                throw (0, assert_1.assertNever)(transform);
        }
    }
    function darken(colorValue, factor) {
        return { op: 0 /* ColorTransformType.Darken */, value: colorValue, factor };
    }
    function lighten(colorValue, factor) {
        return { op: 1 /* ColorTransformType.Lighten */, value: colorValue, factor };
    }
    function transparent(colorValue, factor) {
        return { op: 2 /* ColorTransformType.Transparent */, value: colorValue, factor };
    }
    function opaque(colorValue, background) {
        return { op: 3 /* ColorTransformType.Opaque */, value: colorValue, background };
    }
    function oneOf(...colorValues) {
        return { op: 4 /* ColorTransformType.OneOf */, values: colorValues };
    }
    function ifDefinedThenElse(ifArg, thenArg, elseArg) {
        return { op: 6 /* ColorTransformType.IfDefinedThenElse */, if: ifArg, then: thenArg, else: elseArg };
    }
    function lessProminent(colorValue, backgroundColorValue, factor, transparency) {
        return { op: 5 /* ColorTransformType.LessProminent */, value: colorValue, background: backgroundColorValue, factor, transparency };
    }
    // ----- implementation
    /**
     * @param colorValue Resolve a color value in the context of a theme
     */
    function resolveColorValue(colorValue, theme) {
        if (colorValue === null) {
            return undefined;
        }
        else if (typeof colorValue === 'string') {
            if (colorValue[0] === '#') {
                return color_1.Color.fromHex(colorValue);
            }
            return theme.getColor(colorValue);
        }
        else if (colorValue instanceof color_1.Color) {
            return colorValue;
        }
        else if (typeof colorValue === 'object') {
            return executeTransform(colorValue, theme);
        }
        return undefined;
    }
    exports.workbenchColorsSchemaId = 'vscode://schemas/workbench-colors';
    const schemaRegistry = platform.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(exports.workbenchColorsSchemaId, colorRegistry.getColorSchema());
    const delayer = new async_1.RunOnceScheduler(() => schemaRegistry.notifySchemaChanged(exports.workbenchColorsSchemaId), 200);
    colorRegistry.onDidChangeSchema(() => {
        if (!delayer.isScheduled()) {
            delayer.schedule();
        }
    });
});
// setTimeout(_ => console.log(colorRegistry.toString()), 5000);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JVdGlscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGhlbWUvY29tbW9uL2NvbG9yVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNkJoRyw4Q0FFQztJQUVELHNDQUVDO0lBRUQsNERBRUM7SUFtS0Qsc0NBRUM7SUFFRCw0Q0FFQztJQUlELDRDQWlEQztJQUVELHdCQUVDO0lBRUQsMEJBRUM7SUFFRCxrQ0FFQztJQUVELHdCQUVDO0lBRUQsc0JBRUM7SUFFRCw4Q0FFQztJQUVELHNDQUVDO0lBT0QsOENBY0M7SUEvUkQ7Ozs7O09BS0c7SUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxVQUEyQjtRQUM1RCxPQUFPLFlBQVksVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztJQUNyRCxDQUFDO0lBRUQsU0FBZ0IsYUFBYSxDQUFDLEtBQXNCO1FBQ25ELE9BQU8sT0FBTyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQzNDLENBQUM7SUFFRCxTQUFnQix3QkFBd0IsQ0FBQyxLQUFzQixFQUFFLGVBQXVCO1FBQ3ZGLE9BQU8sT0FBTyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxlQUFlLEdBQUcsQ0FBQztJQUMvRCxDQUFDO0lBRUQsSUFBa0Isa0JBUWpCO0lBUkQsV0FBa0Isa0JBQWtCO1FBQ25DLCtEQUFNLENBQUE7UUFDTixpRUFBTyxDQUFBO1FBQ1AseUVBQVcsQ0FBQTtRQUNYLCtEQUFNLENBQUE7UUFDTiw2REFBSyxDQUFBO1FBQ0wsNkVBQWEsQ0FBQTtRQUNiLHFGQUFpQixDQUFBO0lBQ2xCLENBQUMsRUFSaUIsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFRbkM7SUF3QkQsaUJBQWlCO0lBQ0osUUFBQSxVQUFVLEdB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