/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/path"], function (require, exports, lazy_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compareFileNames = compareFileNames;
    exports.compareFileNamesDefault = compareFileNamesDefault;
    exports.compareFileNamesUpper = compareFileNamesUpper;
    exports.compareFileNamesLower = compareFileNamesLower;
    exports.compareFileNamesUnicode = compareFileNamesUnicode;
    exports.compareFileExtensions = compareFileExtensions;
    exports.compareFileExtensionsDefault = compareFileExtensionsDefault;
    exports.compareFileExtensionsUpper = compareFileExtensionsUpper;
    exports.compareFileExtensionsLower = compareFileExtensionsLower;
    exports.compareFileExtensionsUnicode = compareFileExtensionsUnicode;
    exports.comparePaths = comparePaths;
    exports.compareAnything = compareAnything;
    exports.compareByPrefix = compareByPrefix;
    // When comparing large numbers of strings it's better for performance to create an
    // Intl.Collator object and use the function provided by its compare property
    // than it is to use String.prototype.localeCompare()
    // A collator with numeric sorting enabled, and no sensitivity to case, accents or diacritics.
    const intlFileNameCollatorBaseNumeric = new lazy_1.Lazy(() => {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        return {
            collator,
            collatorIsNumeric: collator.resolvedOptions().numeric
        };
    });
    // A collator with numeric sorting enabled.
    const intlFileNameCollatorNumeric = new lazy_1.Lazy(() => {
        const collator = new Intl.Collator(undefined, { numeric: true });
        return {
            collator
        };
    });
    // A collator with numeric sorting enabled, and sensitivity to accents and diacritics but not case.
    const intlFileNameCollatorNumericCaseInsensitive = new lazy_1.Lazy(() => {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'accent' });
        return {
            collator
        };
    });
    /** Compares filenames without distinguishing the name from the extension. Disambiguates by unicode comparison. */
    function compareFileNames(one, other, caseSensitive = false) {
        const a = one || '';
        const b = other || '';
        const result = intlFileNameCollatorBaseNumeric.value.collator.compare(a, b);
        // Using the numeric option will make compare(`foo1`, `foo01`) === 0. Disambiguate.
        if (intlFileNameCollatorBaseNumeric.value.collatorIsNumeric && result === 0 && a !== b) {
            return a < b ? -1 : 1;
        }
        return result;
    }
    /** Compares full filenames without grouping by case. */
    function compareFileNamesDefault(one, other) {
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        one = one || '';
        other = other || '';
        return compareAndDisambiguateByLength(collatorNumeric, one, other);
    }
    /** Compares full filenames grouping uppercase names before lowercase. */
    function compareFileNamesUpper(one, other) {
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        one = one || '';
        other = other || '';
        return compareCaseUpperFirst(one, other) || compareAndDisambiguateByLength(collatorNumeric, one, other);
    }
    /** Compares full filenames grouping lowercase names before uppercase. */
    function compareFileNamesLower(one, other) {
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        one = one || '';
        other = other || '';
        return compareCaseLowerFirst(one, other) || compareAndDisambiguateByLength(collatorNumeric, one, other);
    }
    /** Compares full filenames by unicode value. */
    function compareFileNamesUnicode(one, other) {
        one = one || '';
        other = other || '';
        if (one === other) {
            return 0;
        }
        return one < other ? -1 : 1;
    }
    /** Compares filenames by extension, then by name. Disambiguates by unicode comparison. */
    function compareFileExtensions(one, other) {
        const [oneName, oneExtension] = extractNameAndExtension(one);
        const [otherName, otherExtension] = extractNameAndExtension(other);
        let result = intlFileNameCollatorBaseNumeric.value.collator.compare(oneExtension, otherExtension);
        if (result === 0) {
            // Using the numeric option will  make compare(`foo1`, `foo01`) === 0. Disambiguate.
            if (intlFileNameCollatorBaseNumeric.value.collatorIsNumeric && oneExtension !== otherExtension) {
                return oneExtension < otherExtension ? -1 : 1;
            }
            // Extensions are equal, compare filenames
            result = intlFileNameCollatorBaseNumeric.value.collator.compare(oneName, otherName);
            if (intlFileNameCollatorBaseNumeric.value.collatorIsNumeric && result === 0 && oneName !== otherName) {
                return oneName < otherName ? -1 : 1;
            }
        }
        return result;
    }
    /** Compares filenames by extension, then by full filename. Mixes uppercase and lowercase names together. */
    function compareFileExtensionsDefault(one, other) {
        one = one || '';
        other = other || '';
        const oneExtension = extractExtension(one);
        const otherExtension = extractExtension(other);
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        const collatorNumericCaseInsensitive = intlFileNameCollatorNumericCaseInsensitive.value.collator;
        return compareAndDisambiguateByLength(collatorNumericCaseInsensitive, oneExtension, otherExtension) ||
            compareAndDisambiguateByLength(collatorNumeric, one, other);
    }
    /** Compares filenames by extension, then case, then full filename. Groups uppercase names before lowercase. */
    function compareFileExtensionsUpper(one, other) {
        one = one || '';
        other = other || '';
        const oneExtension = extractExtension(one);
        const otherExtension = extractExtension(other);
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        const collatorNumericCaseInsensitive = intlFileNameCollatorNumericCaseInsensitive.value.collator;
        return compareAndDisambiguateByLength(collatorNumericCaseInsensitive, oneExtension, otherExtension) ||
            compareCaseUpperFirst(one, other) ||
            compareAndDisambiguateByLength(collatorNumeric, one, other);
    }
    /** Compares filenames by extension, then case, then full filename. Groups lowercase names before uppercase. */
    function compareFileExtensionsLower(one, other) {
        one = one || '';
        other = other || '';
        const oneExtension = extractExtension(one);
        const otherExtension = extractExtension(other);
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        const collatorNumericCaseInsensitive = intlFileNameCollatorNumericCaseInsensitive.value.collator;
        return compareAndDisambiguateByLength(collatorNumericCaseInsensitive, oneExtension, otherExtension) ||
            compareCaseLowerFirst(one, other) ||
            compareAndDisambiguateByLength(collatorNumeric, one, other);
    }
    /** Compares filenames by case-insensitive extension unicode value, then by full filename unicode value. */
    function compareFileExtensionsUnicode(one, other) {
        one = one || '';
        other = other || '';
        const oneExtension = extractExtension(one).toLowerCase();
        const otherExtension = extractExtension(other).toLowerCase();
        // Check for extension differences
        if (oneExtension !== otherExtension) {
            return oneExtension < otherExtension ? -1 : 1;
        }
        // Check for full filename differences.
        if (one !== other) {
            return one < other ? -1 : 1;
        }
        return 0;
    }
    const FileNameMatch = /^(.*?)(\.([^.]*))?$/;
    /** Extracts the name and extension from a full filename, with optional special handling for dotfiles */
    function extractNameAndExtension(str, dotfilesAsNames = false) {
        const match = str ? FileNameMatch.exec(str) : [];
        let result = [(match && match[1]) || '', (match && match[3]) || ''];
        // if the dotfilesAsNames option is selected, treat an empty filename with an extension
        // or a filename that starts with a dot, as a dotfile name
        if (dotfilesAsNames && (!result[0] && result[1] || result[0] && result[0].charAt(0) === '.')) {
            result = [result[0] + '.' + result[1], ''];
        }
        return result;
    }
    /** Extracts the extension from a full filename. Treats dotfiles as names, not extensions. */
    function extractExtension(str) {
        const match = str ? FileNameMatch.exec(str) : [];
        return (match && match[1] && match[1].charAt(0) !== '.' && match[3]) || '';
    }
    function compareAndDisambiguateByLength(collator, one, other) {
        // Check for differences
        const result = collator.compare(one, other);
        if (result !== 0) {
            return result;
        }
        // In a numeric comparison, `foo1` and `foo01` will compare as equivalent.
        // Disambiguate by sorting the shorter string first.
        if (one.length !== other.length) {
            return one.length < other.length ? -1 : 1;
        }
        return 0;
    }
    /** @returns `true` if the string is starts with a lowercase letter. Otherwise, `false`. */
    function startsWithLower(string) {
        const character = string.charAt(0);
        return (character.toLocaleUpperCase() !== character) ? true : false;
    }
    /** @returns `true` if the string starts with an uppercase letter. Otherwise, `false`. */
    function startsWithUpper(string) {
        const character = string.charAt(0);
        return (character.toLocaleLowerCase() !== character) ? true : false;
    }
    /**
     * Compares the case of the provided strings - lowercase before uppercase
     *
     * @returns
     * ```text
     *   -1 if one is lowercase and other is uppercase
     *    1 if one is uppercase and other is lowercase
     *    0 otherwise
     * ```
     */
    function compareCaseLowerFirst(one, other) {
        if (startsWithLower(one) && startsWithUpper(other)) {
            return -1;
        }
        return (startsWithUpper(one) && startsWithLower(other)) ? 1 : 0;
    }
    /**
     * Compares the case of the provided strings - uppercase before lowercase
     *
     * @returns
     * ```text
     *   -1 if one is uppercase and other is lowercase
     *    1 if one is lowercase and other is uppercase
     *    0 otherwise
     * ```
     */
    function compareCaseUpperFirst(one, other) {
        if (startsWithUpper(one) && startsWithLower(other)) {
            return -1;
        }
        return (startsWithLower(one) && startsWithUpper(other)) ? 1 : 0;
    }
    function comparePathComponents(one, other, caseSensitive = false) {
        if (!caseSensitive) {
            one = one && one.toLowerCase();
            other = other && other.toLowerCase();
        }
        if (one === other) {
            return 0;
        }
        return one < other ? -1 : 1;
    }
    function comparePaths(one, other, caseSensitive = false) {
        const oneParts = one.split(path_1.sep);
        const otherParts = other.split(path_1.sep);
        const lastOne = oneParts.length - 1;
        const lastOther = otherParts.length - 1;
        let endOne, endOther;
        for (let i = 0;; i++) {
            endOne = lastOne === i;
            endOther = lastOther === i;
            if (endOne && endOther) {
                return compareFileNames(oneParts[i], otherParts[i], caseSensitive);
            }
            else if (endOne) {
                return -1;
            }
            else if (endOther) {
                return 1;
            }
            const result = comparePathComponents(oneParts[i], otherParts[i], caseSensitive);
            if (result !== 0) {
                return result;
            }
        }
    }
    function compareAnything(one, other, lookFor) {
        const elementAName = one.toLowerCase();
        const elementBName = other.toLowerCase();
        // Sort prefix matches over non prefix matches
        const prefixCompare = compareByPrefix(one, other, lookFor);
        if (prefixCompare) {
            return prefixCompare;
        }
        // Sort suffix matches over non suffix matches
        const elementASuffixMatch = elementAName.endsWith(lookFor);
        const elementBSuffixMatch = elementBName.endsWith(lookFor);
        if (elementASuffixMatch !== elementBSuffixMatch) {
            return elementASuffixMatch ? -1 : 1;
        }
        // Understand file names
        const r = compareFileNames(elementAName, elementBName);
        if (r !== 0) {
            return r;
        }
        // Compare by name
        return elementAName.localeCompare(elementBName);
    }
    function compareByPrefix(one, other, lookFor) {
        const elementAName = one.toLowerCase();
        const elementBName = other.toLowerCase();
        // Sort prefix matches over non prefix matches
        const elementAPrefixMatch = elementAName.startsWith(lookFor);
        const elementBPrefixMatch = elementBName.startsWith(lookFor);
        if (elementAPrefixMatch !== elementBPrefixMatch) {
            return elementAPrefixMatch ? -1 : 1;
        }
        // Same prefix: Sort shorter matches to the top to have those on top that match more precisely
        else if (elementAPrefixMatch && elementBPrefixMatch) {
            if (elementAName.length < elementBName.length) {
                return -1;
            }
            if (elementAName.length > elementBName.length) {
                return 1;
            }
        }
        return 0;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGFyZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9jb21wYXJlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQ2hHLDRDQVdDO0lBR0QsMERBTUM7SUFHRCxzREFNQztJQUdELHNEQU1DO0lBR0QsMERBU0M7SUFHRCxzREFxQkM7SUFHRCxvRUFVQztJQUdELGdFQVdDO0lBR0QsZ0VBV0M7SUFHRCxvRUFpQkM7SUF1R0Qsb0NBMEJDO0lBRUQsMENBeUJDO0lBRUQsMENBdUJDO0lBMVZELG1GQUFtRjtJQUNuRiw2RUFBNkU7SUFDN0UscURBQXFEO0lBRXJELDhGQUE4RjtJQUM5RixNQUFNLCtCQUErQixHQUFrRSxJQUFJLFdBQUksQ0FBQyxHQUFHLEVBQUU7UUFDcEgsTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdEYsT0FBTztZQUNOLFFBQVE7WUFDUixpQkFBaUIsRUFBRSxRQUFRLENBQUMsZUFBZSxFQUFFLENBQUMsT0FBTztTQUNyRCxDQUFDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFFSCwyQ0FBMkM7SUFDM0MsTUFBTSwyQkFBMkIsR0FBc0MsSUFBSSxXQUFJLENBQUMsR0FBRyxFQUFFO1FBQ3BGLE1BQU0sUUFBUSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNqRSxPQUFPO1lBQ04sUUFBUTtTQUNSLENBQUM7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILG1HQUFtRztJQUNuRyxNQUFNLDBDQUEwQyxHQUFzQyxJQUFJLFdBQUks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