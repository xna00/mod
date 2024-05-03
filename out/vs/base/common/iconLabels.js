/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/filters", "vs/base/common/strings", "vs/base/common/themables"], function (require, exports, filters_1, strings_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.escapeIcons = escapeIcons;
    exports.markdownEscapeEscapedIcons = markdownEscapeEscapedIcons;
    exports.stripIcons = stripIcons;
    exports.getCodiconAriaLabel = getCodiconAriaLabel;
    exports.parseLabelWithIcons = parseLabelWithIcons;
    exports.matchesFuzzyIconAware = matchesFuzzyIconAware;
    const iconStartMarker = '$(';
    const iconsRegex = new RegExp(`\\$\\(${themables_1.ThemeIcon.iconNameExpression}(?:${themables_1.ThemeIcon.iconModifierExpression})?\\)`, 'g'); // no capturing groups
    const escapeIconsRegex = new RegExp(`(\\\\)?${iconsRegex.source}`, 'g');
    function escapeIcons(text) {
        return text.replace(escapeIconsRegex, (match, escaped) => escaped ? match : `\\${match}`);
    }
    const markdownEscapedIconsRegex = new RegExp(`\\\\${iconsRegex.source}`, 'g');
    function markdownEscapeEscapedIcons(text) {
        // Need to add an extra \ for escaping in markdown
        return text.replace(markdownEscapedIconsRegex, match => `\\${match}`);
    }
    const stripIconsRegex = new RegExp(`(\\s)?(\\\\)?${iconsRegex.source}(\\s)?`, 'g');
    /**
     * Takes a label with icons (`$(iconId)xyz`)  and strips the icons out (`xyz`)
     */
    function stripIcons(text) {
        if (text.indexOf(iconStartMarker) === -1) {
            return text;
        }
        return text.replace(stripIconsRegex, (match, preWhitespace, escaped, postWhitespace) => escaped ? match : preWhitespace || postWhitespace || '');
    }
    /**
     * Takes a label with icons (`$(iconId)xyz`), removes the icon syntax adds whitespace so that screen readers can read the text better.
     */
    function getCodiconAriaLabel(text) {
        if (!text) {
            return '';
        }
        return text.replace(/\$\((.*?)\)/g, (_match, codiconName) => ` ${codiconName} `).trim();
    }
    const _parseIconsRegex = new RegExp(`\\$\\(${themables_1.ThemeIcon.iconNameCharacter}+\\)`, 'g');
    /**
     * Takes a label with icons (`abc $(iconId)xyz`) and returns the text (`abc xyz`) and the offsets of the icons (`[3]`)
     */
    function parseLabelWithIcons(input) {
        _parseIconsRegex.lastIndex = 0;
        let text = '';
        const iconOffsets = [];
        let iconsOffset = 0;
        while (true) {
            const pos = _parseIconsRegex.lastIndex;
            const match = _parseIconsRegex.exec(input);
            const chars = input.substring(pos, match?.index);
            if (chars.length > 0) {
                text += chars;
                for (let i = 0; i < chars.length; i++) {
                    iconOffsets.push(iconsOffset);
                }
            }
            if (!match) {
                break;
            }
            iconsOffset += match[0].length;
        }
        return { text, iconOffsets };
    }
    function matchesFuzzyIconAware(query, target, enableSeparateSubstringMatching = false) {
        const { text, iconOffsets } = target;
        // Return early if there are no icon markers in the word to match against
        if (!iconOffsets || iconOffsets.length === 0) {
            return (0, filters_1.matchesFuzzy)(query, text, enableSeparateSubstringMatching);
        }
        // Trim the word to match against because it could have leading
        // whitespace now if the word started with an icon
        const wordToMatchAgainstWithoutIconsTrimmed = (0, strings_1.ltrim)(text, ' ');
        const leadingWhitespaceOffset = text.length - wordToMatchAgainstWithoutIconsTrimmed.length;
        // match on value without icon
        const matches = (0, filters_1.matchesFuzzy)(query, wordToMatchAgainstWithoutIconsTrimmed, enableSeparateSubstringMatching);
        // Map matches back to offsets with icon and trimming
        if (matches) {
            for (const match of matches) {
                const iconOffset = iconOffsets[match.start + leadingWhitespaceOffset] /* icon offsets at index */ + leadingWhitespaceOffset /* overall leading whitespace offset */;
                match.start += iconOffset;
                match.end += iconOffset;
            }
        }
        return matches;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvbkxhYmVscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vaWNvbkxhYmVscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxrQ0FFQztJQUdELGdFQUdDO0lBT0QsZ0NBTUM7SUFNRCxrREFNQztJQWFELGtEQTBCQztJQUdELHNEQTBCQztJQTFHRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUM7SUFFN0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxNQUFNLENBQUMsU0FBUyxxQkFBUyxDQUFDLGtCQUFrQixNQUFNLHFCQUFTLENBQUMsc0JBQXNCLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLHNCQUFzQjtJQUU5SSxNQUFNLGdCQUFnQixHQUFHLElBQUksTUFBTSxDQUFDLFVBQVUsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3hFLFNBQWdCLFdBQVcsQ0FBQyxJQUFZO1FBQ3ZDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDM0YsQ0FBQztJQUVELE1BQU0seUJBQXlCLEdBQUcsSUFBSSxNQUFNLENBQUMsT0FBTyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDOUUsU0FBZ0IsMEJBQTBCLENBQUMsSUFBWTtRQUN0RCxrREFBa0Q7UUFDbEQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRCxNQUFNLGVBQWUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsVUFBVSxDQUFDLE1BQU0sUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBRW5GOztPQUVHO0lBQ0gsU0FBZ0IsVUFBVSxDQUFDLElBQVk7UUFDdEMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDMUMsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGFBQWEsSUFBSSxjQUFjLElBQUksRUFBRSxDQUFDLENBQUM7SUFDbEosQ0FBQztJQUdEOztPQUVHO0lBQ0gsU0FBZ0IsbUJBQW1CLENBQUMsSUFBd0I7UUFDM0QsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1gsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxDQUFDLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN6RixDQUFDO0lBUUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxTQUFTLHFCQUFTLENBQUMsaUJBQWlCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUVyRjs7T0FFRztJQUNILFNBQWdCLG1CQUFtQixDQUFDLEtBQWE7UUFFaEQsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUUvQixJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZCxNQUFNLFdBQVcsR0FBYSxFQUFFLENBQUM7UUFDakMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBRXBCLE9BQU8sSUFBSSxFQUFFLENBQUM7WUFDYixNQUFNLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUM7WUFDdkMsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTNDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksSUFBSSxLQUFLLENBQUM7Z0JBQ2QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDdkMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDL0IsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osTUFBTTtZQUNQLENBQUM7WUFDRCxXQUFXLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNoQyxDQUFDO1FBRUQsT0FBTyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBR0QsU0FBZ0IscUJBQXFCLENBQUMsS0FBYSxFQUFFLE1BQTZCLEVBQUUsK0JBQStCLEdBQUcsS0FBSztRQUMxSCxNQUFNLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxHQUFHLE1BQU0sQ0FBQztRQUVyQyx5RUFBeUU7UUFDekUsSUFBSSxDQUFDLFdBQVcsSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzlDLE9BQU8sSUFBQSxzQkFBWSxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsK0JBQStCLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRUQsK0RBQStEO1FBQy9ELGtEQUFrRDtRQUNsRCxNQUFNLHFDQUFxQyxHQUFHLElBQUEsZUFBSyxFQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMvRCxNQUFNLHVCQUF1QixHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcscUNBQXFDLENBQUMsTUFBTSxDQUFDO1FBRTNGLDhCQUE4QjtRQUM5QixNQUFNLE9BQU8sR0FBRyxJQUFBLHNCQUFZLEVBQUMsS0FBSyxFQUFFLHFDQUFxQyxFQUFFLCtCQUErQixDQUFDLENBQUM7UUFFNUcscURBQXFEO1FBQ3JELElBQUksT0FBTyxFQUFFLENBQUM7WUFDYixLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUM3QixNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyx1QkFBdUIsQ0FBQyxDQUFDLDJCQUEyQixHQUFHLHVCQUF1QixDQUFDLHVDQUF1QyxDQUFDO2dCQUNwSyxLQUFLLENBQUMsS0FBSyxJQUFJLFVBQVUsQ0FBQztnQkFDMUIsS0FBSyxDQUFDLEdBQUcsSUFBSSxVQUFVLENBQUM7WUFDekIsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNoQixDQUFDIn0=