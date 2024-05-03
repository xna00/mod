/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugNameData = void 0;
    exports.getDebugName = getDebugName;
    exports.getFunctionName = getFunctionName;
    class DebugNameData {
        constructor(owner, debugNameSource, referenceFn) {
            this.owner = owner;
            this.debugNameSource = debugNameSource;
            this.referenceFn = referenceFn;
        }
        getDebugName(target) {
            return getDebugName(target, this);
        }
    }
    exports.DebugNameData = DebugNameData;
    const countPerName = new Map();
    const cachedDebugName = new WeakMap();
    function getDebugName(target, data) {
        const cached = cachedDebugName.get(target);
        if (cached) {
            return cached;
        }
        const dbgName = computeDebugName(target, data);
        if (dbgName) {
            let count = countPerName.get(dbgName) ?? 0;
            count++;
            countPerName.set(dbgName, count);
            const result = count === 1 ? dbgName : `${dbgName}#${count}`;
            cachedDebugName.set(target, result);
            return result;
        }
        return undefined;
    }
    function computeDebugName(self, data) {
        const cached = cachedDebugName.get(self);
        if (cached) {
            return cached;
        }
        const ownerStr = data.owner ? formatOwner(data.owner) + `.` : '';
        let result;
        const debugNameSource = data.debugNameSource;
        if (debugNameSource !== undefined) {
            if (typeof debugNameSource === 'function') {
                result = debugNameSource();
                if (result !== undefined) {
                    return ownerStr + result;
                }
            }
            else {
                return ownerStr + debugNameSource;
            }
        }
        const referenceFn = data.referenceFn;
        if (referenceFn !== undefined) {
            result = getFunctionName(referenceFn);
            if (result !== undefined) {
                return ownerStr + result;
            }
        }
        if (data.owner !== undefined) {
            const key = findKey(data.owner, self);
            if (key !== undefined) {
                return ownerStr + key;
            }
        }
        return undefined;
    }
    function findKey(obj, value) {
        for (const key in obj) {
            if (obj[key] === value) {
                return key;
            }
        }
        return undefined;
    }
    const countPerClassName = new Map();
    const ownerId = new WeakMap();
    function formatOwner(owner) {
        const id = ownerId.get(owner);
        if (id) {
            return id;
        }
        const className = getClassName(owner);
        let count = countPerClassName.get(className) ?? 0;
        count++;
        countPerClassName.set(className, count);
        const result = count === 1 ? className : `${className}#${count}`;
        ownerId.set(owner, result);
        return result;
    }
    function getClassName(obj) {
        const ctor = obj.constructor;
        if (ctor) {
            return ctor.name;
        }
        return 'Object';
    }
    function getFunctionName(fn) {
        const fnSrc = fn.toString();
        // Pattern: /** @description ... */
        const regexp = /\/\*\*\s*@description\s*([^*]*)\*\//;
        const match = regexp.exec(fnSrc);
        const result = match ? match[1] : undefined;
        return result?.trim();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdOYW1lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9vYnNlcnZhYmxlSW50ZXJuYWwvZGVidWdOYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTRDaEcsb0NBZ0JDO0lBMEVELDBDQU9DO0lBdkhELE1BQWEsYUFBYTtRQUN6QixZQUNpQixLQUF3QixFQUN4QixlQUE0QyxFQUM1QyxXQUFpQztZQUZqQyxVQUFLLEdBQUwsS0FBSyxDQUFtQjtZQUN4QixvQkFBZSxHQUFmLGVBQWUsQ0FBNkI7WUFDNUMsZ0JBQVcsR0FBWCxXQUFXLENBQXNCO1FBQzlDLENBQUM7UUFFRSxZQUFZLENBQUMsTUFBYztZQUNqQyxPQUFPLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkMsQ0FBQztLQUNEO0lBVkQsc0NBVUM7SUFTRCxNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztJQUMvQyxNQUFNLGVBQWUsR0FBRyxJQUFJLE9BQU8sRUFBa0IsQ0FBQztJQUV0RCxTQUFnQixZQUFZLENBQUMsTUFBYyxFQUFFLElBQW1CO1FBQy9ELE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0MsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNaLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMvQyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ2IsSUFBSSxLQUFLLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsS0FBSyxFQUFFLENBQUM7WUFDUixZQUFZLENBQUMsR0FB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