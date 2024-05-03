/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createSingleCallFunction = createSingleCallFunction;
    /**
     * Given a function, returns a function that is only calling that function once.
     */
    function createSingleCallFunction(fn, fnDidRunCallback) {
        const _this = this;
        let didCall = false;
        let result;
        return function () {
            if (didCall) {
                return result;
            }
            didCall = true;
            if (fnDidRunCallback) {
                try {
                    result = fn.apply(_this, arguments);
                }
                finally {
                    fnDidRunCallback();
                }
            }
            else {
                result = fn.apply(_this, arguments);
            }
            return result;
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25hbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vZnVuY3Rpb25hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQUtoRyw0REF1QkM7SUExQkQ7O09BRUc7SUFDSCxTQUFnQix3QkFBd0IsQ0FBb0MsRUFBSyxFQUFFLGdCQUE2QjtRQUMvRyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbkIsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLElBQUksTUFBZSxDQUFDO1FBRXBCLE9BQU87WUFDTixJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLE9BQU8sTUFBTSxDQUFDO1lBQ2YsQ0FBQztZQUVELE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDZixJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQztvQkFDSixNQUFNLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3JDLENBQUM7d0JBQVMsQ0FBQztvQkFDVixnQkFBZ0IsRUFBRSxDQUFDO2dCQUNwQixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNyQyxDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFpQixDQUFDO0lBQ25CLENBQUMifQ==