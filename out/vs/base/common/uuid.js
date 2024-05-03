/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateUuid = void 0;
    exports.isUUID = isUUID;
    const _UUIDPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    function isUUID(value) {
        return _UUIDPattern.test(value);
    }
    exports.generateUuid = (function () {
        // use `randomUUID` if possible
        if (typeof crypto === 'object' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID.bind(crypto);
        }
        // use `randomValues` if possible
        let getRandomValues;
        if (typeof crypto === 'object' && typeof crypto.getRandomValues === 'function') {
            getRandomValues = crypto.getRandomValues.bind(crypto);
        }
        else {
            getRandomValues = function (bucket) {
                for (let i = 0; i < bucket.length; i++) {
                    bucket[i] = Math.floor(Math.random() * 256);
                }
                return bucket;
            };
        }
        // prep-work
        const _data = new Uint8Array(16);
        const _hex = [];
        for (let i = 0; i < 256; i++) {
            _hex.push(i.toString(16).padStart(2, '0'));
        }
        return function generateUuid() {
            // get data
            getRandomValues(_data);
            // set version bits
            _data[6] = (_data[6] & 0x0f) | 0x40;
            _data[8] = (_data[8] & 0x3f) | 0x80;
            // print as string
            let i = 0;
            let result = '';
            result += _hex[_data[i++]];
            result += _hex[_data[i++]];
            result += _hex[_data[i++]];
            result += _hex[_data[i++]];
            result += '-';
            result += _hex[_data[i++]];
            result += _hex[_data[i++]];
            result += '-';
            result += _hex[_data[i++]];
            result += _hex[_data[i++]];
            result += '-';
            result += _hex[_data[i++]];
            result += _hex[_data[i++]];
            result += '-';
            result += _hex[_data[i++]];
            result += _hex[_data[i++]];
            result += _hex[_data[i++]];
            result += _hex[_data[i++]];
            result += _hex[_data[i++]];
            result += _hex[_data[i++]];
            return result;
        };
    })();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXVpZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vdXVpZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEcsd0JBRUM7SUFKRCxNQUFNLFlBQVksR0FBRyxpRUFBaUUsQ0FBQztJQUV2RixTQUFnQixNQUFNLENBQUMsS0FBYTtRQUNuQyxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQVNZLFFBQUEsWUFBWSxHQUFHLENBQUM7UUFFNUIsK0JBQStCO1FBQy9CLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxJQUFJLE9BQU8sTUFBTSxDQUFDLFVBQVUsS0FBSyxVQUFVLEVBQUUsQ0FBQztZQUMzRSxPQUFPLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxpQ0FBaUM7UUFDakMsSUFBSSxlQUFtRCxDQUFDO1FBQ3hELElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxJQUFJLE9BQU8sTUFBTSxDQUFDLGVBQWUsS0FBSyxVQUFVLEVBQUUsQ0FBQztZQUNoRixlQUFlLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFdkQsQ0FBQzthQUFNLENBQUM7WUFDUCxlQUFlLEdBQUcsVUFBVSxNQUFrQjtnQkFDN0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDeEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO2dCQUNELE9BQU8sTUFBTSxDQUFDO1lBQ2YsQ0FBQyxDQUFDO1FBQ0gsQ0FBQztRQUVELFlBQVk7UUFDWixNQUFNLEtBQUssR0FBRyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqQyxNQUFNLElBQUksR0FBYSxFQUFFLENBQUM7UUFDMUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELE9BQU8sU0FBUyxZQUFZO1lBQzNCLFdBQVc7WUFDWCxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFdkIsbUJBQW1CO1lBQ25CLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDcEMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztZQUVwQyxrQkFBa0I7WUFDbEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ1YsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQixNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0IsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQixNQUFNLElBQUksR0FBRyxDQUFDO1lBQ2QsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQixNQUFNLElBQUksR0FBRyxDQUFDO1lBQ2QsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQixNQUFNLElBQUksR0FBRyxDQUFDO1lBQ2QsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQixNQUFNLElBQUksR0FBRyxDQUFDO1lBQ2QsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQixNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0IsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQixNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0IsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDLENBQUM7SUFDSCxDQUFDLENBQUMsRUFBRSxDQUFDIn0=