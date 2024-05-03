/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/uri"], function (require, exports, buffer_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stringify = stringify;
    exports.parse = parse;
    exports.revive = revive;
    function stringify(obj) {
        return JSON.stringify(obj, replacer);
    }
    function parse(text) {
        let data = JSON.parse(text);
        data = revive(data);
        return data;
    }
    function replacer(key, value) {
        // URI is done via toJSON-member
        if (value instanceof RegExp) {
            return {
                $mid: 2 /* MarshalledId.Regexp */,
                source: value.source,
                flags: value.flags,
            };
        }
        return value;
    }
    function revive(obj, depth = 0) {
        if (!obj || depth > 200) {
            return obj;
        }
        if (typeof obj === 'object') {
            switch (obj.$mid) {
                case 1 /* MarshalledId.Uri */: return uri_1.URI.revive(obj);
                case 2 /* MarshalledId.Regexp */: return new RegExp(obj.source, obj.flags);
                case 17 /* MarshalledId.Date */: return new Date(obj.source);
            }
            if (obj instanceof buffer_1.VSBuffer
                || obj instanceof Uint8Array) {
                return obj;
            }
            if (Array.isArray(obj)) {
                for (let i = 0; i < obj.length; ++i) {
                    obj[i] = revive(obj[i], depth + 1);
                }
            }
            else {
                // walk object
                for (const key in obj) {
                    if (Object.hasOwnProperty.call(obj, key)) {
                        obj[key] = revive(obj[key], depth + 1);
                    }
                }
            }
        }
        return obj;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFyc2hhbGxpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL21hcnNoYWxsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLDhCQUVDO0lBRUQsc0JBSUM7SUEyQkQsd0JBbUNDO0lBdEVELFNBQWdCLFNBQVMsQ0FBQyxHQUFRO1FBQ2pDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELFNBQWdCLEtBQUssQ0FBQyxJQUFZO1FBQ2pDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFNRCxTQUFTLFFBQVEsQ0FBQyxHQUFXLEVBQUUsS0FBVTtRQUN4QyxnQ0FBZ0M7UUFDaEMsSUFBSSxLQUFLLFlBQVksTUFBTSxFQUFFLENBQUM7WUFDN0IsT0FBTztnQkFDTixJQUFJLDZCQUFxQjtnQkFDekIsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNO2dCQUNwQixLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUs7YUFDbEIsQ0FBQztRQUNILENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFXRCxTQUFnQixNQUFNLENBQVUsR0FBUSxFQUFFLEtBQUssR0FBRyxDQUFDO1FBQ2xELElBQUksQ0FBQyxHQUFHLElBQUksS0FBSyxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUVELElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7WUFFN0IsUUFBMkIsR0FBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN0Qyw2QkFBcUIsQ0FBQyxDQUFDLE9BQVksU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbkQsZ0NBQXdCLENBQUMsQ0FBQyxPQUFZLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN4RSwrQkFBc0IsQ0FBQyxDQUFDLE9BQVksSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFELENBQUM7WUFFRCxJQUNDLEdBQUcsWUFBWSxpQkFBUTttQkFDcEIsR0FBRyxZQUFZLFVBQVUsRUFDM0IsQ0FBQztnQkFDRixPQUFZLEdBQUcsQ0FBQztZQUNqQixDQUFDO1lBRUQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ3JDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDcEMsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxjQUFjO2dCQUNkLEtBQUssTUFBTSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7b0JBQ3ZCLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQzFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDeEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLEdBQUcsQ0FBQztJQUNaLENBQUMifQ==