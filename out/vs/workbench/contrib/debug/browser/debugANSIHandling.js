/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/workbench/contrib/terminal/common/terminalColorRegistry"], function (require, exports, color_1, terminalColorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.handleANSIOutput = handleANSIOutput;
    exports.appendStylizedStringToContainer = appendStylizedStringToContainer;
    exports.calcANSI8bitColor = calcANSI8bitColor;
    /**
     * @param text The content to stylize.
     * @returns An {@link HTMLSpanElement} that contains the potentially stylized text.
     */
    function handleANSIOutput(text, linkDetector, themeService, workspaceFolder) {
        const root = document.createElement('span');
        const textLength = text.length;
        let styleNames = [];
        let customFgColor;
        let customBgColor;
        let customUnderlineColor;
        let colorsInverted = false;
        let currentPos = 0;
        let buffer = '';
        while (currentPos < textLength) {
            let sequenceFound = false;
            // Potentially an ANSI escape sequence.
            // See http://ascii-table.com/ansi-escape-sequences.php & https://en.wikipedia.org/wiki/ANSI_escape_code
            if (text.charCodeAt(currentPos) === 27 && text.charAt(currentPos + 1) === '[') {
                const startPos = currentPos;
                currentPos += 2; // Ignore 'Esc[' as it's in every sequence.
                let ansiSequence = '';
                while (currentPos < textLength) {
                    const char = text.charAt(currentPos);
                    ansiSequence += char;
                    currentPos++;
                    // Look for a known sequence terminating character.
                    if (char.match(/^[ABCDHIJKfhmpsu]$/)) {
                        sequenceFound = true;
                        break;
                    }
                }
                if (sequenceFound) {
                    // Flush buffer with previous styles.
                    appendStylizedStringToContainer(root, buffer, styleNames, linkDetector, workspaceFolder, customFgColor, customBgColor, customUnderlineColor);
                    buffer = '';
                    /*
                     * Certain ranges that are matched here do not contain real graphics rendition sequences. For
                     * the sake of having a simpler expression, they have been included anyway.
                     */
                    if (ansiSequence.match(/^(?:[34][0-8]|9[0-7]|10[0-7]|[0-9]|2[1-5,7-9]|[34]9|5[8,9]|1[0-9])(?:;[349][0-7]|10[0-7]|[013]|[245]|[34]9)?(?:;[012]?[0-9]?[0-9])*;?m$/)) {
                        const styleCodes = ansiSequence.slice(0, -1) // Remove final 'm' character.
                            .split(';') // Separate style codes.
                            .filter(elem => elem !== '') // Filter empty elems as '34;m' -> ['34', ''].
                            .map(elem => parseInt(elem, 10)); // Convert to numbers.
                        if (styleCodes[0] === 38 || styleCodes[0] === 48 || styleCodes[0] === 58) {
                            // Advanced color code - can't be combined with formatting codes like simple colors can
                            // Ignores invalid colors and additional info beyond what is necessary
                            const colorType = (styleCodes[0] === 38) ? 'foreground' : ((styleCodes[0] === 48) ? 'background' : 'underline');
                            if (styleCodes[1] === 5) {
                                set8BitColor(styleCodes, colorType);
                            }
                            else if (styleCodes[1] === 2) {
                                set24BitColor(styleCodes, colorType);
                            }
                        }
                        else {
                            setBasicFormatters(styleCodes);
                        }
                    }
                    else {
                        // Unsupported sequence so simply hide it.
                    }
                }
                else {
                    currentPos = startPos;
                }
            }
            if (sequenceFound === false) {
                buffer += text.charAt(currentPos);
                currentPos++;
            }
        }
        // Flush remaining text buffer if not empty.
        if (buffer) {
            appendStylizedStringToContainer(root, buffer, styleNames, linkDetector, workspaceFolder, customFgColor, customBgColor, customUnderlineColor);
        }
        return root;
        /**
         * Change the foreground or background color by clearing the current color
         * and adding the new one.
         * @param colorType If `'foreground'`, will change the foreground color, if
         * 	`'background'`, will change the background color, and if `'underline'`
         * will set the underline color.
         * @param color Color to change to. If `undefined` or not provided,
         * will clear current color without adding a new one.
         */
        function changeColor(colorType, color) {
            if (colorType === 'foreground') {
                customFgColor = color;
            }
            else if (colorType === 'background') {
                customBgColor = color;
            }
            else if (colorType === 'underline') {
                customUnderlineColor = color;
            }
            styleNames = styleNames.filter(style => style !== `code-${colorType}-colored`);
            if (color !== undefined) {
                styleNames.push(`code-${colorType}-colored`);
            }
        }
        /**
         * Swap foreground and background colors.  Used for color inversion.  Caller should check
         * [] flag to make sure it is appropriate to turn ON or OFF (if it is already inverted don't call
         */
        function reverseForegroundAndBackgroundColors() {
            const oldFgColor = customFgColor;
            changeColor('foreground', customBgColor);
            changeColor('background', oldFgColor);
        }
        /**
         * Calculate and set basic ANSI formatting. Supports ON/OFF of bold, italic, underline,
         * double underline,  crossed-out/strikethrough, overline, dim, blink, rapid blink,
         * reverse/invert video, hidden, superscript, subscript and alternate font codes,
         * clearing/resetting of foreground, background and underline colors,
         * setting normal foreground and background colors, and bright foreground and
         * background colors. Not to be used for codes containing advanced colors.
         * Will ignore invalid codes.
         * @param styleCodes Array of ANSI basic styling numbers, which will be
         * applied in order. New colors and backgrounds clear old ones; new formatting
         * does not.
         * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#SGR }
         */
        function setBasicFormatters(styleCodes) {
            for (const code of styleCodes) {
                switch (code) {
                    case 0: { // reset (everything)
                        styleNames = [];
                        customFgColor = undefined;
                        customBgColor = undefined;
                        break;
                    }
                    case 1: { // bold
                        styleNames = styleNames.filter(style => style !== `code-bold`);
                        styleNames.push('code-bold');
                        break;
                    }
                    case 2: { // dim
                        styleNames = styleNames.filter(style => style !== `code-dim`);
                        styleNames.push('code-dim');
                        break;
                    }
                    case 3: { // italic
                        styleNames = styleNames.filter(style => style !== `code-italic`);
                        styleNames.push('code-italic');
                        break;
                    }
                    case 4: { // underline
                        styleNames = styleNames.filter(style => (style !== `code-underline` && style !== `code-double-underline`));
                        styleNames.push('code-underline');
                        break;
                    }
                    case 5: { // blink
                        styleNames = styleNames.filter(style => style !== `code-blink`);
                        styleNames.push('code-blink');
                        break;
                    }
                    case 6: { // rapid blink
                        styleNames = styleNames.filter(style => style !== `code-rapid-blink`);
                        styleNames.push('code-rapid-blink');
                        break;
                    }
                    case 7: { // invert foreground and background
                        if (!colorsInverted) {
                            colorsInverted = true;
                            reverseForegroundAndBackgroundColors();
                        }
                        break;
                    }
                    case 8: { // hidden
                        styleNames = styleNames.filter(style => style !== `code-hidden`);
                        styleNames.push('code-hidden');
                        break;
                    }
                    case 9: { // strike-through/crossed-out
                        styleNames = styleNames.filter(style => style !== `code-strike-through`);
                        styleNames.push('code-strike-through');
                        break;
                    }
                    case 10: { // normal default font
                        styleNames = styleNames.filter(style => !style.startsWith('code-font'));
                        break;
                    }
                    case 11:
                    case 12:
                    case 13:
                    case 14:
                    case 15:
                    case 16:
                    case 17:
                    case 18:
                    case 19:
                    case 20: { // font codes (and 20 is 'blackletter' font code)
                        styleNames = styleNames.filter(style => !style.startsWith('code-font'));
                        styleNames.push(`code-font-${code - 10}`);
                        break;
                    }
                    case 21: { // double underline
                        styleNames = styleNames.filter(style => (style !== `code-underline` && style !== `code-double-underline`));
                        styleNames.push('code-double-underline');
                        break;
                    }
                    case 22: { // normal intensity (bold off and dim off)
                        styleNames = styleNames.filter(style => (style !== `code-bold` && style !== `code-dim`));
                        break;
                    }
                    case 23: { // Neither italic or blackletter (font 10)
                        styleNames = styleNames.filter(style => (style !== `code-italic` && style !== `code-font-10`));
                        break;
                    }
                    case 24: { // not underlined (Neither singly nor doubly underlined)
                        styleNames = styleNames.filter(style => (style !== `code-underline` && style !== `code-double-underline`));
                        break;
                    }
                    case 25: { // not blinking
                        styleNames = styleNames.filter(style => (style !== `code-blink` && style !== `code-rapid-blink`));
                        break;
                    }
                    case 27: { // not reversed/inverted
                        if (colorsInverted) {
                            colorsInverted = false;
                            reverseForegroundAndBackgroundColors();
                        }
                        break;
                    }
                    case 28: { // not hidden (reveal)
                        styleNames = styleNames.filter(style => style !== `code-hidden`);
                        break;
                    }
                    case 29: { // not crossed-out
                        styleNames = styleNames.filter(style => style !== `code-strike-through`);
                        break;
                    }
                    case 53: { // overlined
                        styleNames = styleNames.filter(style => style !== `code-overline`);
                        styleNames.push('code-overline');
                        break;
                    }
                    case 55: { // not overlined
                        styleNames = styleNames.filter(style => style !== `code-overline`);
                        break;
                    }
                    case 39: { // default foreground color
                        changeColor('foreground', undefined);
                        break;
                    }
                    case 49: { // default background color
                        changeColor('background', undefined);
                        break;
                    }
                    case 59: { // default underline color
                        changeColor('underline', undefined);
                        break;
                    }
                    case 73: { // superscript
                        styleNames = styleNames.filter(style => (style !== `code-superscript` && style !== `code-subscript`));
                        styleNames.push('code-superscript');
                        break;
                    }
                    case 74: { // subscript
                        styleNames = styleNames.filter(style => (style !== `code-superscript` && style !== `code-subscript`));
                        styleNames.push('code-subscript');
                        break;
                    }
                    case 75: { // neither superscript or subscript
                        styleNames = styleNames.filter(style => (style !== `code-superscript` && style !== `code-subscript`));
                        break;
                    }
                    default: {
                        setBasicColor(code);
                        break;
                    }
                }
            }
        }
        /**
         * Calculate and set styling for complicated 24-bit ANSI color codes.
         * @param styleCodes Full list of integer codes that make up the full ANSI
         * sequence, including the two defining codes and the three RGB codes.
         * @param colorType If `'foreground'`, will set foreground color, if
         * `'background'`, will set background color, and if it is `'underline'`
         * will set the underline color.
         * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#24-bit }
         */
        function set24BitColor(styleCodes, colorType) {
            if (styleCodes.length >= 5 &&
                styleCodes[2] >= 0 && styleCodes[2] <= 255 &&
                styleCodes[3] >= 0 && styleCodes[3] <= 255 &&
                styleCodes[4] >= 0 && styleCodes[4] <= 255) {
                const customColor = new color_1.RGBA(styleCodes[2], styleCodes[3], styleCodes[4]);
                changeColor(colorType, customColor);
            }
        }
        /**
         * Calculate and set styling for advanced 8-bit ANSI color codes.
         * @param styleCodes Full list of integer codes that make up the ANSI
         * sequence, including the two defining codes and the one color code.
         * @param colorType If `'foreground'`, will set foreground color, if
         * `'background'`, will set background color and if it is `'underline'`
         * will set the underline color.
         * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit }
         */
        function set8BitColor(styleCodes, colorType) {
            let colorNumber = styleCodes[2];
            const color = calcANSI8bitColor(colorNumber);
            if (color) {
                changeColor(colorType, color);
            }
            else if (colorNumber >= 0 && colorNumber <= 15) {
                if (colorType === 'underline') {
                    // for underline colors we just decode the 0-15 color number to theme color, set and return
                    const theme = themeService.getColorTheme();
                    const colorName = terminalColorRegistry_1.ansiColorIdentifiers[colorNumber];
                    const color = theme.getColor(colorName);
                    if (color) {
                        changeColor(colorType, color.rgba);
                    }
                    return;
                }
                // Need to map to one of the four basic color ranges (30-37, 90-97, 40-47, 100-107)
                colorNumber += 30;
                if (colorNumber >= 38) {
                    // Bright colors
                    colorNumber += 52;
                }
                if (colorType === 'background') {
                    colorNumber += 10;
                }
                setBasicColor(colorNumber);
            }
        }
        /**
         * Calculate and set styling for basic bright and dark ANSI color codes. Uses
         * theme colors if available. Automatically distinguishes between foreground
         * and background colors; does not support color-clearing codes 39 and 49.
         * @param styleCode Integer color code on one of the following ranges:
         * [30-37, 90-97, 40-47, 100-107]. If not on one of these ranges, will do
         * nothing.
         */
        function setBasicColor(styleCode) {
            const theme = themeService.getColorTheme();
            let colorType;
            let colorIndex;
            if (styleCode >= 30 && styleCode <= 37) {
                colorIndex = styleCode - 30;
                colorType = 'foreground';
            }
            else if (styleCode >= 90 && styleCode <= 97) {
                colorIndex = (styleCode - 90) + 8; // High-intensity (bright)
                colorType = 'foreground';
            }
            else if (styleCode >= 40 && styleCode <= 47) {
                colorIndex = styleCode - 40;
                colorType = 'background';
            }
            else if (styleCode >= 100 && styleCode <= 107) {
                colorIndex = (styleCode - 100) + 8; // High-intensity (bright)
                colorType = 'background';
            }
            if (colorIndex !== undefined && colorType) {
                const colorName = terminalColorRegistry_1.ansiColorIdentifiers[colorIndex];
                const color = theme.getColor(colorName);
                if (color) {
                    changeColor(colorType, color.rgba);
                }
            }
        }
    }
    /**
     * @param root The {@link HTMLElement} to append the content to.
     * @param stringContent The text content to be appended.
     * @param cssClasses The list of CSS styles to apply to the text content.
     * @param linkDetector The {@link LinkDetector} responsible for generating links from {@param stringContent}.
     * @param customTextColor If provided, will apply custom color with inline style.
     * @param customBackgroundColor If provided, will apply custom backgroundColor with inline style.
     * @param customUnderlineColor If provided, will apply custom textDecorationColor with inline style.
     */
    function appendStylizedStringToContainer(root, stringContent, cssClasses, linkDetector, workspaceFolder, customTextColor, customBackgroundColor, customUnderlineColor) {
        if (!root || !stringContent) {
            return;
        }
        const container = linkDetector.linkify(stringContent, true, workspaceFolder);
        container.className = cssClasses.join(' ');
        if (customTextColor) {
            container.style.color =
                color_1.Color.Format.CSS.formatRGB(new color_1.Color(customTextColor));
        }
        if (customBackgroundColor) {
            container.style.backgroundColor =
                color_1.Color.Format.CSS.formatRGB(new color_1.Color(customBackgroundColor));
        }
        if (customUnderlineColor) {
            container.style.textDecorationColor =
                color_1.Color.Format.CSS.formatRGB(new color_1.Color(customUnderlineColor));
        }
        root.appendChild(container);
    }
    /**
     * Calculate the color from the color set defined in the ANSI 8-bit standard.
     * Standard and high intensity colors are not defined in the standard as specific
     * colors, so these and invalid colors return `undefined`.
     * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit } for info.
     * @param colorNumber The number (ranging from 16 to 255) referring to the color
     * desired.
     */
    function calcANSI8bitColor(colorNumber) {
        if (colorNumber % 1 !== 0) {
            // Should be integer
            return;
        }
        if (colorNumber >= 16 && colorNumber <= 231) {
            // Converts to one of 216 RGB colors
            colorNumber -= 16;
            let blue = colorNumber % 6;
            colorNumber = (colorNumber - blue) / 6;
            let green = colorNumber % 6;
            colorNumber = (colorNumber - green) / 6;
            let red = colorNumber;
            // red, green, blue now range on [0, 5], need to map to [0,255]
            const convFactor = 255 / 5;
            blue = Math.round(blue * convFactor);
            green = Math.round(green * convFactor);
            red = Math.round(red * convFactor);
            return new color_1.RGBA(red, green, blue);
        }
        else if (colorNumber >= 232 && colorNumber <= 255) {
            // Converts to a grayscale value
            colorNumber -= 232;
            const colorLevel = Math.round(colorNumber / 23 * 255);
            return new color_1.RGBA(colorLevel, colorLevel, colorLevel);
        }
        else {
            return;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdBTlNJSGFuZGxpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2Jyb3dzZXIvZGVidWdBTlNJSGFuZGxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsNENBeVhDO0lBV0QsMEVBOEJDO0lBVUQsOENBNkJDO0lBN2NEOzs7T0FHRztJQUNILFNBQWdCLGdCQUFnQixDQUFDLElBQVksRUFBRSxZQUEwQixFQUFFLFlBQTJCLEVBQUUsZUFBNkM7UUFFcEosTUFBTSxJQUFJLEdBQW9CLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0QsTUFBTSxVQUFVLEdBQVcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUV2QyxJQUFJLFVBQVUsR0FBYSxFQUFFLENBQUM7UUFDOUIsSUFBSSxhQUErQixDQUFDO1FBQ3BDLElBQUksYUFBK0IsQ0FBQztRQUNwQyxJQUFJLG9CQUFzQyxDQUFDO1FBQzNDLElBQUksY0FBYyxHQUFZLEtBQUssQ0FBQztRQUNwQyxJQUFJLFVBQVUsR0FBVyxDQUFDLENBQUM7UUFDM0IsSUFBSSxNQUFNLEdBQVcsRUFBRSxDQUFDO1FBRXhCLE9BQU8sVUFBVSxHQUFHLFVBQVUsRUFBRSxDQUFDO1lBRWhDLElBQUksYUFBYSxHQUFZLEtBQUssQ0FBQztZQUVuQyx1Q0FBdUM7WUFDdkMsd0dBQXdHO1lBQ3hHLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBRS9FLE1BQU0sUUFBUSxHQUFXLFVBQVUsQ0FBQztnQkFDcEMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLDJDQUEyQztnQkFFNUQsSUFBSSxZQUFZLEdBQVcsRUFBRSxDQUFDO2dCQUU5QixPQUFPLFVBQVUsR0FBRyxVQUFVLEVBQUUsQ0FBQztvQkFDaEMsTUFBTSxJQUFJLEdBQVcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDN0MsWUFBWSxJQUFJLElBQUksQ0FBQztvQkFFckIsVUFBVSxFQUFFLENBQUM7b0JBRWIsbURBQW1EO29CQUNuRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDO3dCQUN0QyxhQUFhLEdBQUcsSUFBSSxDQUFDO3dCQUNyQixNQUFNO29CQUNQLENBQUM7Z0JBRUYsQ0FBQztnQkFFRCxJQUFJLGFBQWEsRUFBRSxDQUFDO29CQUVuQixxQ0FBcUM7b0JBQ3JDLCtCQUErQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO29CQUU3SSxNQUFNLEdBQUcsRUFBRSxDQUFDO29CQUVaOzs7dUJBR0c7b0JBQ0gsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLHlJQUF5SSxDQUFDLEVBQUUsQ0FBQzt3QkFFbkssTUFBTSxVQUFVLEdBQWEsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyw4QkFBOEI7NkJBQ25GLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBYSx3QkFBd0I7NkJBQy9DLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsQ0FBYyw4Q0FBOEM7NkJBQ3ZGLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFhLHNCQUFzQjt3QkFFckUsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDOzRCQUMxRSx1RkFBdUY7NEJBQ3ZGLHNFQUFzRTs0QkFDdEUsTUFBTSxTQUFTLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQzs0QkFFaEgsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0NBQ3pCLFlBQVksQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7NEJBQ3JDLENBQUM7aUNBQU0sSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0NBQ2hDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7NEJBQ3RDLENBQUM7d0JBQ0YsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUNoQyxDQUFDO29CQUVGLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCwwQ0FBMEM7b0JBQzNDLENBQUM7Z0JBRUYsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFVBQVUsR0FBRyxRQUFRLENBQUM7Z0JBQ3ZCLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxhQUFhLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQzdCLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNsQyxVQUFVLEVBQUUsQ0FBQztZQUNkLENBQUM7UUFDRixDQUFDO1FBRUQsNENBQTRDO1FBQzVDLElBQUksTUFBTSxFQUFFLENBQUM7WUFDWiwrQkFBK0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZUFBZSxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUM5SSxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7UUFFWjs7Ozs7Ozs7V0FRRztRQUNILFNBQVMsV0FBVyxDQUFDLFNBQW9ELEVBQUUsS0FBd0I7WUFDbEcsSUFBSSxTQUFTLEtBQUssWUFBWSxFQUFFLENBQUM7Z0JBQ2hDLGFBQWEsR0FBRyxLQUFLLENBQUM7WUFDdkIsQ0FBQztpQkFBTSxJQUFJLFNBQVMsS0FBSyxZQUFZLEVBQUUsQ0FBQztnQkFDdkMsYUFBYSxHQUFHLEtBQUssQ0FBQztZQUN2QixDQUFDO2lCQUFNLElBQUksU0FBUyxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUN0QyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7WUFDOUIsQ0FBQztZQUNELFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxLQUFLLFFBQVEsU0FBUyxVQUFVLENBQUMsQ0FBQztZQUMvRSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDekIsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLFNBQVMsVUFBVSxDQUFDLENBQUM7WUFDOUMsQ0FBQztRQUNGLENBQUM7UUFFRDs7O1dBR0c7UUFDSCxTQUFTLG9DQUFvQztZQUM1QyxNQUFNLFVBQVUsR0FBcUIsYUFBYSxDQUFDO1lBQ25ELFdBQVcsQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDekMsV0FBVyxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRUQ7Ozs7Ozs7Ozs7OztXQVlHO1FBQ0gsU0FBUyxrQkFBa0IsQ0FBQyxVQUFvQjtZQUMvQyxLQUFLLE1BQU0sSUFBSSxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUMvQixRQUFRLElBQUksRUFBRSxDQUFDO29CQUNkLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLHFCQUFxQjt3QkFDL0IsVUFBVSxHQUFHLEVBQUUsQ0FBQzt3QkFDaEIsYUFBYSxHQUFHLFNBQVMsQ0FBQzt3QkFDMUIsYUFBYSxHQUFHLFNBQVMsQ0FBQzt3QkFDMUIsTUFBTTtvQkFDUCxDQUFDO29CQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU87d0JBQ2hCLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxLQUFLLFdBQVcsQ0FBQyxDQUFDO3dCQUMvRCxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO3dCQUM3QixNQUFNO29CQUNQLENBQUM7b0JBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTTt3QkFDZixVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssS0FBSyxVQUFVLENBQUMsQ0FBQzt3QkFDOUQsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDNUIsTUFBTTtvQkFDUCxDQUFDO29CQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7d0JBQ2xCLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxLQUFLLGFBQWEsQ0FBQyxDQUFDO3dCQUNqRSxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO3dCQUMvQixNQUFNO29CQUNQLENBQUM7b0JBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWTt3QkFDckIsVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxnQkFBZ0IsSUFBSSxLQUFLLEtBQUssdUJBQXVCLENBQUMsQ0FBQyxDQUFDO3dCQUMzRyxVQUFVLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7d0JBQ2xDLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRO3dCQUNqQixVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssS0FBSyxZQUFZLENBQUMsQ0FBQzt3QkFDaEUsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQzt3QkFDOUIsTUFBTTtvQkFDUCxDQUFDO29CQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWM7d0JBQ3ZCLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxLQUFLLGtCQUFrQixDQUFDLENBQUM7d0JBQ3RFLFVBQVUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQzt3QkFDcEMsTUFBTTtvQkFDUCxDQUFDO29CQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLG1DQUFtQzt3QkFDNUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDOzRCQUNyQixjQUFjLEdBQUcsSUFBSSxDQUFDOzRCQUN0QixvQ0FBb0MsRUFBRSxDQUFDO3dCQUN4QyxDQUFDO3dCQUNELE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO3dCQUNsQixVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssS0FBSyxhQUFhLENBQUMsQ0FBQzt3QkFDakUsVUFBVSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDL0IsTUFBTTtvQkFDUCxDQUFDO29CQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLDZCQUE2Qjt3QkFDdEMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEtBQUsscUJBQXFCLENBQUMsQ0FBQzt3QkFDekUsVUFBVSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO3dCQUN2QyxNQUFNO29CQUNQLENBQUM7b0JBQ0QsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQXNCO3dCQUNoQyxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO3dCQUN4RSxNQUFNO29CQUNQLENBQUM7b0JBQ0QsS0FBSyxFQUFFLENBQUM7b0JBQUMsS0FBSyxFQUFFLENBQUM7b0JBQUMsS0FBSyxFQUFFLENBQUM7b0JBQUMsS0FBSyxFQUFFLENBQUM7b0JBQUMsS0FBSyxFQUFFLENBQUM7b0JBQUMsS0FBSyxFQUFFLENBQUM7b0JBQUMsS0FBSyxFQUFFLENBQUM7b0JBQUMsS0FBSyxFQUFFLENBQUM7b0JBQUMsS0FBSyxFQUFFLENBQUM7b0JBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsaURBQWlEO3dCQUM1SSxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO3dCQUN4RSxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQzFDLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUI7d0JBQzdCLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssZ0JBQWdCLElBQUksS0FBSyxLQUFLLHVCQUF1QixDQUFDLENBQUMsQ0FBQzt3QkFDM0csVUFBVSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO3dCQUN6QyxNQUFNO29CQUNQLENBQUM7b0JBQ0QsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsMENBQTBDO3dCQUNwRCxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLFdBQVcsSUFBSSxLQUFLLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQzt3QkFDekYsTUFBTTtvQkFDUCxDQUFDO29CQUNELEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLDBDQUEwQzt3QkFDcEQsVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxhQUFhLElBQUksS0FBSyxLQUFLLGNBQWMsQ0FBQyxDQUFDLENBQUM7d0JBQy9GLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyx3REFBd0Q7d0JBQ2xFLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssZ0JBQWdCLElBQUksS0FBSyxLQUFLLHVCQUF1QixDQUFDLENBQUMsQ0FBQzt3QkFDM0csTUFBTTtvQkFDUCxDQUFDO29CQUNELEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWU7d0JBQ3pCLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssWUFBWSxJQUFJLEtBQUssS0FBSyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7d0JBQ2xHLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyx3QkFBd0I7d0JBQ2xDLElBQUksY0FBYyxFQUFFLENBQUM7NEJBQ3BCLGNBQWMsR0FBRyxLQUFLLENBQUM7NEJBQ3ZCLG9DQUFvQyxFQUFFLENBQUM7d0JBQ3hDLENBQUM7d0JBQ0QsTUFBTTtvQkFDUCxDQUFDO29CQUNELEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLHNCQUFzQjt3QkFDaEMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEtBQUssYUFBYSxDQUFDLENBQUM7d0JBQ2pFLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0I7d0JBQzVCLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxLQUFLLHFCQUFxQixDQUFDLENBQUM7d0JBQ3pFLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZO3dCQUN0QixVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssS0FBSyxlQUFlLENBQUMsQ0FBQzt3QkFDbkUsVUFBVSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQzt3QkFDakMsTUFBTTtvQkFDUCxDQUFDO29CQUNELEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQjt3QkFDMUIsVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEtBQUssZUFBZSxDQUFDLENBQUM7d0JBQ25FLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSwyQkFBMkI7d0JBQ3RDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ3JDLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSwyQkFBMkI7d0JBQ3RDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ3JDLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSwwQkFBMEI7d0JBQ3JDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ3BDLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjO3dCQUN4QixVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLGtCQUFrQixJQUFJLEtBQUssS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7d0JBQ3RHLFVBQVUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQzt3QkFDcEMsTUFBTTtvQkFDUCxDQUFDO29CQUNELEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVk7d0JBQ3RCLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssa0JBQWtCLElBQUksS0FBSyxLQUFLLGdCQUFnQixDQUFDLENBQUMsQ0FBQzt3QkFDdEcsVUFBVSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO3dCQUNsQyxNQUFNO29CQUNQLENBQUM7b0JBQ0QsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsbUNBQW1DO3dCQUM3QyxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLGtCQUFrQixJQUFJLEtBQUssS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7d0JBQ3RHLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxPQUFPLENBQUMsQ0FBQyxDQUFDO3dCQUNULGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDcEIsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVEOzs7Ozs7OztXQVFHO1FBQ0gsU0FBUyxhQUFhLENBQUMsVUFBb0IsRUFBRSxTQUFvRDtZQUNoRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQztnQkFDekIsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRztnQkFDMUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRztnQkFDMUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sV0FBVyxHQUFHLElBQUksWUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFFLFdBQVcsQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7UUFFRDs7Ozs7Ozs7V0FRRztRQUNILFNBQVMsWUFBWSxDQUFDLFVBQW9CLEVBQUUsU0FBb0Q7WUFDL0YsSUFBSSxXQUFXLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sS0FBSyxHQUFHLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRTdDLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1gsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMvQixDQUFDO2lCQUFNLElBQUksV0FBVyxJQUFJLENBQUMsSUFBSSxXQUFXLElBQUksRUFBRSxFQUFFLENBQUM7Z0JBQ2xELElBQUksU0FBUyxLQUFLLFdBQVcsRUFBRSxDQUFDO29CQUMvQiwyRkFBMkY7b0JBQzNGLE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDM0MsTUFBTSxTQUFTLEdBQUcsNENBQW9CLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ3BELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3hDLElBQUksS0FBSyxFQUFFLENBQUM7d0JBQ1gsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3BDLENBQUM7b0JBQ0QsT0FBTztnQkFDUixDQUFDO2dCQUNELG1GQUFtRjtnQkFDbkYsV0FBVyxJQUFJLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxXQUFXLElBQUksRUFBRSxFQUFFLENBQUM7b0JBQ3ZCLGdCQUFnQjtvQkFDaEIsV0FBVyxJQUFJLEVBQUUsQ0FBQztnQkFDbkIsQ0FBQztnQkFDRCxJQUFJLFNBQVMsS0FBSyxZQUFZLEVBQUUsQ0FBQztvQkFDaEMsV0FBVyxJQUFJLEVBQUUsQ0FBQztnQkFDbkIsQ0FBQztnQkFDRCxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNGLENBQUM7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsU0FBUyxhQUFhLENBQUMsU0FBaUI7WUFDdkMsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzNDLElBQUksU0FBa0QsQ0FBQztZQUN2RCxJQUFJLFVBQThCLENBQUM7WUFFbkMsSUFBSSxTQUFTLElBQUksRUFBRSxJQUFJLFNBQVMsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDeEMsVUFBVSxHQUFHLFNBQVMsR0FBRyxFQUFFLENBQUM7Z0JBQzVCLFNBQVMsR0FBRyxZQUFZLENBQUM7WUFDMUIsQ0FBQztpQkFBTSxJQUFJLFNBQVMsSUFBSSxFQUFFLElBQUksU0FBUyxJQUFJLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxVQUFVLEdBQUcsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsMEJBQTBCO2dCQUM3RCxTQUFTLEdBQUcsWUFBWSxDQUFDO1lBQzFCLENBQUM7aUJBQU0sSUFBSSxTQUFTLElBQUksRUFBRSxJQUFJLFNBQVMsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsVUFBVSxHQUFHLFNBQVMsR0FBRyxFQUFFLENBQUM7Z0JBQzVCLFNBQVMsR0FBRyxZQUFZLENBQUM7WUFDMUIsQ0FBQztpQkFBTSxJQUFJLFNBQVMsSUFBSSxHQUFHLElBQUksU0FBUyxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNqRCxVQUFVLEdBQUcsQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsMEJBQTBCO2dCQUM5RCxTQUFTLEdBQUcsWUFBWSxDQUFDO1lBQzFCLENBQUM7WUFFRCxJQUFJLFVBQVUsS0FBSyxTQUFTLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQzNDLE1BQU0sU0FBUyxHQUFHLDRDQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNYLFdBQVcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwQyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7SUFDRixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxTQUFnQiwrQkFBK0IsQ0FDOUMsSUFBaUIsRUFDakIsYUFBcUIsRUFDckIsVUFBb0IsRUFDcEIsWUFBMEIsRUFDMUIsZUFBNkMsRUFDN0MsZUFBc0IsRUFDdEIscUJBQTRCLEVBQzVCLG9CQUEyQjtRQUUzQixJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDN0IsT0FBTztRQUNSLENBQUM7UUFFRCxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFN0UsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNDLElBQUksZUFBZSxFQUFFLENBQUM7WUFDckIsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLO2dCQUNwQixhQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxhQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBQ0QsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO1lBQzNCLFNBQVMsQ0FBQyxLQUFLLENBQUMsZUFBZTtnQkFDOUIsYUFBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksYUFBSyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBQ0QsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO1lBQzFCLFNBQVMsQ0FBQyxLQUFLLENBQUMsbUJBQW1CO2dCQUNsQyxhQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxhQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsV0FBbUI7UUFDcEQsSUFBSSxXQUFXLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzNCLG9CQUFvQjtZQUNwQixPQUFPO1FBQ1IsQ0FBQztRQUFDLElBQUksV0FBVyxJQUFJLEVBQUUsSUFBSSxXQUFXLElBQUksR0FBRyxFQUFFLENBQUM7WUFDL0Msb0NBQW9DO1lBQ3BDLFdBQVcsSUFBSSxFQUFFLENBQUM7WUFFbEIsSUFBSSxJQUFJLEdBQVcsV0FBVyxHQUFHLENBQUMsQ0FBQztZQUNuQyxXQUFXLEdBQUcsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksS0FBSyxHQUFXLFdBQVcsR0FBRyxDQUFDLENBQUM7WUFDcEMsV0FBVyxHQUFHLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4QyxJQUFJLEdBQUcsR0FBVyxXQUFXLENBQUM7WUFFOUIsK0RBQStEO1lBQy9ELE1BQU0sVUFBVSxHQUFXLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDbkMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxDQUFDO1lBQ3JDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQztZQUN2QyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLENBQUM7WUFFbkMsT0FBTyxJQUFJLFlBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25DLENBQUM7YUFBTSxJQUFJLFdBQVcsSUFBSSxHQUFHLElBQUksV0FBVyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ3JELGdDQUFnQztZQUNoQyxXQUFXLElBQUksR0FBRyxDQUFDO1lBQ25CLE1BQU0sVUFBVSxHQUFXLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUM5RCxPQUFPLElBQUksWUFBSSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDckQsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPO1FBQ1IsQ0FBQztJQUNGLENBQUMifQ==