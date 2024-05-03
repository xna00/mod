/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Constants = void 0;
    exports.toUint8 = toUint8;
    exports.toUint32 = toUint32;
    var Constants;
    (function (Constants) {
        /**
         * MAX SMI (SMall Integer) as defined in v8.
         * one bit is lost for boxing/unboxing flag.
         * one bit is lost for sign flag.
         * See https://thibaultlaurens.github.io/javascript/2013/04/29/how-the-v8-engine-works/#tagged-values
         */
        Constants[Constants["MAX_SAFE_SMALL_INTEGER"] = 1073741824] = "MAX_SAFE_SMALL_INTEGER";
        /**
         * MIN SMI (SMall Integer) as defined in v8.
         * one bit is lost for boxing/unboxing flag.
         * one bit is lost for sign flag.
         * See https://thibaultlaurens.github.io/javascript/2013/04/29/how-the-v8-engine-works/#tagged-values
         */
        Constants[Constants["MIN_SAFE_SMALL_INTEGER"] = -1073741824] = "MIN_SAFE_SMALL_INTEGER";
        /**
         * Max unsigned integer that fits on 8 bits.
         */
        Constants[Constants["MAX_UINT_8"] = 255] = "MAX_UINT_8";
        /**
         * Max unsigned integer that fits on 16 bits.
         */
        Constants[Constants["MAX_UINT_16"] = 65535] = "MAX_UINT_16";
        /**
         * Max unsigned integer that fits on 32 bits.
         */
        Constants[Constants["MAX_UINT_32"] = 4294967295] = "MAX_UINT_32";
        Constants[Constants["UNICODE_SUPPLEMENTARY_PLANE_BEGIN"] = 65536] = "UNICODE_SUPPLEMENTARY_PLANE_BEGIN";
    })(Constants || (exports.Constants = Constants = {}));
    function toUint8(v) {
        if (v < 0) {
            return 0;
        }
        if (v > 255 /* Constants.MAX_UINT_8 */) {
            return 255 /* Constants.MAX_UINT_8 */;
        }
        return v | 0;
    }
    function toUint32(v) {
        if (v < 0) {
            return 0;
        }
        if (v > 4294967295 /* Constants.MAX_UINT_32 */) {
            return 4294967295 /* Constants.MAX_UINT_32 */;
        }
        return v | 0;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidWludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vdWludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxQ2hHLDBCQVFDO0lBRUQsNEJBUUM7SUFyREQsSUFBa0IsU0FpQ2pCO0lBakNELFdBQWtCLFNBQVM7UUFDMUI7Ozs7O1dBS0c7UUFDSCxzRkFBZ0MsQ0FBQTtRQUVoQzs7Ozs7V0FLRztRQUNILHVGQUFtQyxDQUFBO1FBRW5DOztXQUVHO1FBQ0gsdURBQWdCLENBQUE7UUFFaEI7O1dBRUc7UUFDSCwyREFBbUIsQ0FBQTtRQUVuQjs7V0FFRztRQUNILGdFQUF3QixDQUFBO1FBRXhCLHVHQUE0QyxDQUFBO0lBQzdDLENBQUMsRUFqQ2lCLFNBQVMseUJBQVQsU0FBUyxRQWlDMUI7SUFFRCxTQUFnQixPQUFPLENBQUMsQ0FBUztRQUNoQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQUNELElBQUksQ0FBQyxpQ0FBdUIsRUFBRSxDQUFDO1lBQzlCLHNDQUE0QjtRQUM3QixDQUFDO1FBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsQ0FBQztJQUVELFNBQWdCLFFBQVEsQ0FBQyxDQUFTO1FBQ2pDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ1gsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDO1FBQ0QsSUFBSSxDQUFDLHlDQUF3QixFQUFFLENBQUM7WUFDL0IsOENBQTZCO1FBQzlCLENBQUM7UUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDZCxDQUFDIn0=