define(["require", "exports", "vs/base/common/color"], function (require, exports, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeDefaultDocumentColors = computeDefaultDocumentColors;
    function _parseCaptureGroups(captureGroups) {
        const values = [];
        for (const captureGroup of captureGroups) {
            const parsedNumber = Number(captureGroup);
            if (parsedNumber || parsedNumber === 0 && captureGroup.replace(/\s/g, '') !== '') {
                values.push(parsedNumber);
            }
        }
        return values;
    }
    function _toIColor(r, g, b, a) {
        return {
            red: r / 255,
            blue: b / 255,
            green: g / 255,
            alpha: a
        };
    }
    function _findRange(model, match) {
        const index = match.index;
        const length = match[0].length;
        if (!index) {
            return;
        }
        const startPosition = model.positionAt(index);
        const range = {
            startLineNumber: startPosition.lineNumber,
            startColumn: startPosition.column,
            endLineNumber: startPosition.lineNumber,
            endColumn: startPosition.column + length
        };
        return range;
    }
    function _findHexColorInformation(range, hexValue) {
        if (!range) {
            return;
        }
        const parsedHexColor = color_1.Color.Format.CSS.parseHex(hexValue);
        if (!parsedHexColor) {
            return;
        }
        return {
            range: range,
            color: _toIColor(parsedHexColor.rgba.r, parsedHexColor.rgba.g, parsedHexColor.rgba.b, parsedHexColor.rgba.a)
        };
    }
    function _findRGBColorInformation(range, matches, isAlpha) {
        if (!range || matches.length !== 1) {
            return;
        }
        const match = matches[0];
        const captureGroups = match.values();
        const parsedRegex = _parseCaptureGroups(captureGroups);
        return {
            range: range,
            color: _toIColor(parsedRegex[0], parsedRegex[1], parsedRegex[2], isAlpha ? parsedRegex[3] : 1)
        };
    }
    function _findHSLColorInformation(range, matches, isAlpha) {
        if (!range || matches.length !== 1) {
            return;
        }
        const match = matches[0];
        const captureGroups = match.values();
        const parsedRegex = _parseCaptureGroups(captureGroups);
        const colorEquivalent = new color_1.Color(new color_1.HSLA(parsedRegex[0], parsedRegex[1] / 100, parsedRegex[2] / 100, isAlpha ? parsedRegex[3] : 1));
        return {
            range: range,
            color: _toIColor(colorEquivalent.rgba.r, colorEquivalent.rgba.g, colorEquivalent.rgba.b, colorEquivalent.rgba.a)
        };
    }
    function _findMatches(model, regex) {
        if (typeof model === 'string') {
            return [...model.matchAll(regex)];
        }
        else {
            return model.findMatches(regex);
        }
    }
    function computeColors(model) {
        const result = [];
        // Early validation for RGB and HSL
        const initialValidationRegex = /\b(rgb|rgba|hsl|hsla)(\([0-9\s,.\%]*\))|(#)([A-Fa-f0-9]{3})\b|(#)([A-Fa-f0-9]{4})\b|(#)([A-Fa-f0-9]{6})\b|(#)([A-Fa-f0-9]{8})\b/gm;
        const initialValidationMatches = _findMatches(model, initialValidationRegex);
        // Potential colors have been found, validate the parameters
        if (initialValidationMatches.length > 0) {
            for (const initialMatch of initialValidationMatches) {
                const initialCaptureGroups = initialMatch.filter(captureGroup => captureGroup !== undefined);
                const colorScheme = initialCaptureGroups[1];
                const colorParameters = initialCaptureGroups[2];
                if (!colorParameters) {
                    continue;
                }
                let colorInformation;
                if (colorScheme === 'rgb') {
                    const regexParameters = /^\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*\)$/gm;
                    colorInformation = _findRGBColorInformation(_findRange(model, initialMatch), _findMatches(colorParameters, regexParameters), false);
                }
                else if (colorScheme === 'rgba') {
                    const regexParameters = /^\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(0[.][0-9]+|[.][0-9]+|[01][.]|[01])\s*\)$/gm;
                    colorInformation = _findRGBColorInformation(_findRange(model, initialMatch), _findMatches(colorParameters, regexParameters), true);
                }
                else if (colorScheme === 'hsl') {
                    const regexParameters = /^\(\s*(36[0]|3[0-5][0-9]|[12][0-9][0-9]|[1-9]?[0-9])\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*\)$/gm;
                    colorInformation = _findHSLColorInformation(_findRange(model, initialMatch), _findMatches(colorParameters, regexParameters), false);
                }
                else if (colorScheme === 'hsla') {
                    const regexParameters = /^\(\s*(36[0]|3[0-5][0-9]|[12][0-9][0-9]|[1-9]?[0-9])\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(0[.][0-9]+|[.][0-9]+|[01][.]|[01])\s*\)$/gm;
                    colorInformation = _findHSLColorInformation(_findRange(model, initialMatch), _findMatches(colorParameters, regexParameters), true);
                }
                else if (colorScheme === '#') {
                    colorInformation = _findHexColorInformation(_findRange(model, initialMatch), colorScheme + colorParameters);
                }
                if (colorInformation) {
                    result.push(colorInformation);
                }
            }
        }
        return result;
    }
    /**
     * Returns an array of all default document colors in the provided document
     */
    function computeDefaultDocumentColors(model) {
        if (!model || typeof model.getValue !== 'function' || typeof model.positionAt !== 'function') {
            // Unknown caller!
            return [];
        }
        return computeColors(model);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdERvY3VtZW50Q29sb3JzQ29tcHV0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbGFuZ3VhZ2VzL2RlZmF1bHREb2N1bWVudENvbG9yc0NvbXB1dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQThJQSxvRUFNQztJQXJJRCxTQUFTLG1CQUFtQixDQUFDLGFBQXVDO1FBQ25FLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNsQixLQUFLLE1BQU0sWUFBWSxJQUFJLGFBQWEsRUFBRSxDQUFDO1lBQzFDLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMxQyxJQUFJLFlBQVksSUFBSSxZQUFZLEtBQUssQ0FBQyxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDO2dCQUNsRixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzNCLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBUyxTQUFTLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUztRQUM1RCxPQUFPO1lBQ04sR0FBRyxFQUFFLENBQUMsR0FBRyxHQUFHO1lBQ1osSUFBSSxFQUFFLENBQUMsR0FBRyxHQUFHO1lBQ2IsS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHO1lBQ2QsS0FBSyxFQUFFLENBQUM7U0FDUixDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFDLEtBQW1DLEVBQUUsS0FBdUI7UUFDL0UsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUMxQixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMs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