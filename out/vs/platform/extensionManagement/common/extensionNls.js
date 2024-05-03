/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/nls"], function (require, exports, types_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.localizeManifest = localizeManifest;
    function localizeManifest(logger, extensionManifest, translations, fallbackTranslations) {
        try {
            replaceNLStrings(logger, extensionManifest, translations, fallbackTranslations);
        }
        catch (error) {
            logger.error(error?.message ?? error);
            /*Ignore Error*/
        }
        return extensionManifest;
    }
    /**
     * This routine makes the following assumptions:
     * The root element is an object literal
     */
    function replaceNLStrings(logger, extensionManifest, messages, originalMessages) {
        const processEntry = (obj, key, command) => {
            const value = obj[key];
            if ((0, types_1.isString)(value)) {
                const str = value;
                const length = str.length;
                if (length > 1 && str[0] === '%' && str[length - 1] === '%') {
                    const messageKey = str.substr(1, length - 2);
                    let translated = messages[messageKey];
                    // If the messages come from a language pack they might miss some keys
                    // Fill them from the original messages.
                    if (translated === undefined && originalMessages) {
                        translated = originalMessages[messageKey];
                    }
                    const message = typeof translated === 'string' ? translated : translated?.message;
                    // This branch returns ILocalizedString's instead of Strings so that the Command Palette can contain both the localized and the original value.
                    const original = originalMessages?.[messageKey];
                    const originalMessage = typeof original === 'string' ? original : original?.message;
                    if (!message) {
                        if (!originalMessage) {
                            logger.warn(`[${extensionManifest.name}]: ${(0, nls_1.localize)('missingNLSKey', "Couldn't find message for key {0}.", messageKey)}`);
                        }
                        return;
                    }
                    if (
                    // if we are translating the title or category of a command
                    command && (key === 'title' || key === 'category') &&
                        // and the original value is not the same as the translated value
                        originalMessage && originalMessage !== message) {
                        const localizedString = {
                            value: message,
                            original: originalMessage
                        };
                        obj[key] = localizedString;
                    }
                    else {
                        obj[key] = message;
                    }
                }
            }
            else if ((0, types_1.isObject)(value)) {
                for (const k in value) {
                    if (value.hasOwnProperty(k)) {
                        k === 'commands' ? processEntry(value, k, true) : processEntry(value, k, command);
                    }
                }
            }
            else if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    processEntry(value, i, command);
                }
            }
        };
        for (const key in extensionManifest) {
            if (extensionManifest.hasOwnProperty(key)) {
                processEntry(extensionManifest, key);
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTmxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25NYW5hZ2VtZW50L2NvbW1vbi9leHRlbnNpb25ObHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsNENBUUM7SUFSRCxTQUFnQixnQkFBZ0IsQ0FBQyxNQUFlLEVBQUUsaUJBQXFDLEVBQUUsWUFBMkIsRUFBRSxvQkFBb0M7UUFDekosSUFBSSxDQUFDO1lBQ0osZ0JBQWdCLENBQUMsTUFBTSxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQ2pGLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE9BQU8sSUFBSSxLQUFLLENBQUMsQ0FBQztZQUN0QyxnQkFBZ0I7UUFDakIsQ0FBQztRQUNELE9BQU8saUJBQWlCLENBQUM7SUFDMUIsQ0FBQztJQUVEOzs7T0FHRztJQUNILFNBQVMsZ0JBQWdCLENBQUMsTUFBZSxFQUFFLGlCQUFxQyxFQUFFLFFBQXVCLEVBQUUsZ0JBQWdDO1FBQzFJLE1BQU0sWUFBWSxHQUFHLENBQUMsR0FBUSxFQUFFLEdBQW9CLEVBQUUsT0FBaUIsRUFBRSxFQUFFO1lBQzFFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QixJQUFJLElBQUEsZ0JBQVEsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNyQixNQUFNLEdBQUcsR0FBVyxLQUFLLENBQUM7Z0JBQzFCLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7Z0JBQzFCLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJ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