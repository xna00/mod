/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map"], function (require, exports, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.removeAccents = void 0;
    exports.normalizeNFC = normalizeNFC;
    exports.normalizeNFD = normalizeNFD;
    const nfcCache = new map_1.LRUCache(10000); // bounded to 10000 elements
    function normalizeNFC(str) {
        return normalize(str, 'NFC', nfcCache);
    }
    const nfdCache = new map_1.LRUCache(10000); // bounded to 10000 elements
    function normalizeNFD(str) {
        return normalize(str, 'NFD', nfdCache);
    }
    const nonAsciiCharactersPattern = /[^\u0000-\u0080]/;
    function normalize(str, form, normalizedCache) {
        if (!str) {
            return str;
        }
        const cached = normalizedCache.get(str);
        if (cached) {
            return cached;
        }
        let res;
        if (nonAsciiCharactersPattern.test(str)) {
            res = str.normalize(form);
        }
        else {
            res = str;
        }
        // Use the cache for fast lookup
        normalizedCache.set(str, res);
        return res;
    }
    exports.removeAccents = (function () {
        // transform into NFD form and remove accents
        // see: https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript/37511463#37511463
        const regex = /[\u0300-\u036f]/g;
        return function (str) {
            return normalizeNFD(str).replace(regex, '');
        };
    })();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9ybWFsaXphdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vbm9ybWFsaXphdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEcsb0NBRUM7SUFHRCxvQ0FFQztJQVJELE1BQU0sUUFBUSxHQUFHLElBQUksY0FBUSxDQUFpQixLQUFLLENBQUMsQ0FBQyxDQUFDLDRCQUE0QjtJQUNsRixTQUFnQixZQUFZLENBQUMsR0FBVztRQUN2QyxPQUFPLFNBQVMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLGNBQVEsQ0FBaUIsS0FBSyxDQUFDLENBQUMsQ0FBQyw0QkFBNEI7SUFDbEYsU0FBZ0IsWUFBWSxDQUFDLEdBQVc7UUFDdkMsT0FBTyxTQUFTLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRUQsTUFBTSx5QkFBeUIsR0FBRyxrQkFBa0IsQ0FBQztJQUNyRCxTQUFTLFNBQVMsQ0FBQyxHQUFXLEVBQUUsSUFBWSxFQUFFLGVBQXlDO1FBQ3RGLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNWLE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEMsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNaLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELElBQUksR0FBVyxDQUFDO1FBQ2hCLElBQUkseUJBQXlCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDekMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQzthQUFNLENBQUM7WUFDUCxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ1gsQ0FBQztRQUVELGdDQUFnQztRQUNoQyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUU5QixPQUFPLEdBQUcsQ0FBQztJQUNaLENBQUM7SUFFWSxRQUFBLGFBQWEsR0FBNEIsQ0FBQztRQUN0RCw2Q0FBNkM7UUFDN0Msd0hBQXdIO1FBQ3hILE1BQU0sS0FBSyxHQUFHLGtCQUFrQixDQUFDO1FBQ2pDLE9BQU8sVUFBVSxHQUFXO1lBQzNCLE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN0MsQ0FBQyxDQUFDO0lBQ0gsQ0FBQyxDQUFDLEVBQUUsQ0FBQyJ9