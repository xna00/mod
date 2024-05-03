/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/iterator", "vs/base/common/uuid"], function (require, exports, arrays_1, iterator_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UriList = exports.VSDataTransfer = void 0;
    exports.createStringDataTransferItem = createStringDataTransferItem;
    exports.createFileDataTransferItem = createFileDataTransferItem;
    exports.matchesMimeType = matchesMimeType;
    function createStringDataTransferItem(stringOrPromise) {
        return {
            asString: async () => stringOrPromise,
            asFile: () => undefined,
            value: typeof stringOrPromise === 'string' ? stringOrPromise : undefined,
        };
    }
    function createFileDataTransferItem(fileName, uri, data) {
        const file = { id: (0, uuid_1.generateUuid)(), name: fileName, uri, data };
        return {
            asString: async () => '',
            asFile: () => file,
            value: undefined,
        };
    }
    class VSDataTransfer {
        constructor() {
            this._entries = new Map();
        }
        get size() {
            let size = 0;
            for (const _ of this._entries) {
                size++;
            }
            return size;
        }
        has(mimeType) {
            return this._entries.has(this.toKey(mimeType));
        }
        matches(pattern) {
            const mimes = [...this._entries.keys()];
            if (iterator_1.Iterable.some(this, ([_, item]) => item.asFile())) {
                mimes.push('files');
            }
            return matchesMimeType_normalized(normalizeMimeType(pattern), mimes);
        }
        get(mimeType) {
            return this._entries.get(this.toKey(mimeType))?.[0];
        }
        /**
         * Add a new entry to this data transfer.
         *
         * This does not replace existing entries for `mimeType`.
         */
        append(mimeType, value) {
            const existing = this._entries.get(mimeType);
            if (existing) {
                existing.push(value);
            }
            else {
                this._entries.set(this.toKey(mimeType), [value]);
            }
        }
        /**
         * Set the entry for a given mime type.
         *
         * This replaces all existing entries for `mimeType`.
         */
        replace(mimeType, value) {
            this._entries.set(this.toKey(mimeType), [value]);
        }
        /**
         * Remove all entries for `mimeType`.
         */
        delete(mimeType) {
            this._entries.delete(this.toKey(mimeType));
        }
        /**
         * Iterate over all `[mime, item]` pairs in this data transfer.
         *
         * There may be multiple entries for each mime type.
         */
        *[Symbol.iterator]() {
            for (const [mine, items] of this._entries) {
                for (const item of items) {
                    yield [mine, item];
                }
            }
        }
        toKey(mimeType) {
            return normalizeMimeType(mimeType);
        }
    }
    exports.VSDataTransfer = VSDataTransfer;
    function normalizeMimeType(mimeType) {
        return mimeType.toLowerCase();
    }
    function matchesMimeType(pattern, mimeTypes) {
        return matchesMimeType_normalized(normalizeMimeType(pattern), mimeTypes.map(normalizeMimeType));
    }
    function matchesMimeType_normalized(normalizedPattern, normalizedMimeTypes) {
        // Anything wildcard
        if (normalizedPattern === '*/*') {
            return normalizedMimeTypes.length > 0;
        }
        // Exact match
        if (normalizedMimeTypes.includes(normalizedPattern)) {
            return true;
        }
        // Wildcard, such as `image/*`
        const wildcard = normalizedPattern.match(/^([a-z]+)\/([a-z]+|\*)$/i);
        if (!wildcard) {
            return false;
        }
        const [_, type, subtype] = wildcard;
        if (subtype === '*') {
            return normalizedMimeTypes.some(mime => mime.startsWith(type + '/'));
        }
        return false;
    }
    exports.UriList = Object.freeze({
        // http://amundsen.com/hypermedia/urilist/
        create: (entries) => {
            return (0, arrays_1.distinct)(entries.map(x => x.toString())).join('\r\n');
        },
        split: (str) => {
            return str.split('\r\n');
        },
        parse: (str) => {
            return exports.UriList.split(str).filter(value => !value.startsWith('#'));
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YVRyYW5zZmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9kYXRhVHJhbnNmZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0JoRyxvRUFNQztJQUVELGdFQU9DO0lBaUhELDBDQUlDO0lBcElELFNBQWdCLDRCQUE0QixDQUFDLGVBQXlDO1FBQ3JGLE9BQU87WUFDTixRQUFRLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxlQUFlO1lBQ3JDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTO1lBQ3ZCLEtBQUssRUFBRSxPQUFPLGVBQWUsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsU0FBUztTQUN4RSxDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQWdCLDBCQUEwQixDQUFDLFFBQWdCLEVBQUUsR0FBb0IsRUFBRSxJQUErQjtRQUNqSCxNQUFNLElBQUksR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFBLG1CQUFZLEdBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUMvRCxPQUFPO1lBQ04sUUFBUSxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsRUFBRTtZQUN4QixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSTtZQUNsQixLQUFLLEVBQUUsU0FBUztTQUNoQixDQUFDO0lBQ0gsQ0FBQztJQWdDRCxNQUFhLGNBQWM7UUFBM0I7WUFFa0IsYUFBUSxHQUFHLElBQUksR0FBRyxFQUErQixDQUFDO1FBeUVwRSxDQUFDO1FBdkVBLElBQVcsSUFBSTtZQUNkLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztZQUNiLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMv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