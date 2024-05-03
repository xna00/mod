/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.localize = localize;
    exports.localize2 = localize2;
    exports.getConfiguredDefaultLocale = getConfiguredDefaultLocale;
    function _format(message, args) {
        let result;
        if (args.length === 0) {
            result = message;
        }
        else {
            result = message.replace(/\{(\d+)\}/g, function (match, rest) {
                const index = rest[0];
                return typeof args[index] !== 'undefined' ? args[index] : match;
            });
        }
        return result;
    }
    function localize(data, message, ...args) {
        return _format(message, args);
    }
    function localize2(data, message, ...args) {
        const res = _format(message, args);
        return {
            original: res,
            value: res
        };
    }
    function getConfiguredDefaultLocale(_) {
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmxzLm1vY2suanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL25scy5tb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBeUJoRyw0QkFFQztJQUVELDhCQU1DO0lBRUQsZ0VBRUM7SUEzQkQsU0FBUyxPQUFPLENBQUMsT0FBZSxFQUFFLElBQVc7UUFDNUMsSUFBSSxNQUFjLENBQUM7UUFDbkIsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sR0FBRyxPQUFPLENBQUM7UUFDbEIsQ0FBQzthQUFNLENBQUM7WUFDUCxNQUFNLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsVUFBVSxLQUFLLEVBQUUsSUFBSTtnQkFDM0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0QixPQUFPLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDakUsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBZ0IsUUFBUSxDQUFDLElBQTRCLEVBQUUsT0FBZSxFQUFFLEdBQUcsSUFBVztRQUNyRixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVELFNBQWdCLFNBQVMsQ0FBQyxJQUE0QixFQUFFLE9BQWUsRUFBRSxHQUFHLElBQVc7UUFDdEYsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNuQyxPQUFPO1lBQ04sUUFBUSxFQUFFLEdBQUc7WUFDYixLQUFLLEVBQUUsR0FBRztTQUNWLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBZ0IsMEJBQTBCLENBQUMsQ0FBUztRQUNuRCxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDIn0=