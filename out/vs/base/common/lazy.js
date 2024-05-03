/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Lazy = void 0;
    class Lazy {
        constructor(executor) {
            this.executor = executor;
            this._didRun = false;
        }
        /**
         * True if the lazy value has been resolved.
         */
        get hasValue() { return this._didRun; }
        /**
         * Get the wrapped value.
         *
         * This will force evaluation of the lazy value if it has not been resolved yet. Lazy values are only
         * resolved once. `getValue` will re-throw exceptions that are hit while resolving the value
         */
        get value() {
            if (!this._didRun) {
                try {
                    this._value = this.executor();
                }
                catch (err) {
                    this._error = err;
                }
                finally {
                    this._didRun = true;
                }
            }
            if (this._error) {
                throw this._error;
            }
            return this._value;
        }
        /**
         * Get the wrapped value without forcing evaluation.
         */
        get rawValue() { return this._value; }
    }
    exports.Lazy = Lazy;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF6eS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vbGF6eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFaEcsTUFBYSxJQUFJO1FBTWhCLFlBQ2tCLFFBQWlCO1lBQWpCLGFBQVEsR0FBUixRQUFRLENBQVM7WUFMM0IsWUFBTyxHQUFZLEtBQUssQ0FBQztRQU03QixDQUFDO1FBRUw7O1dBRUc7UUFDSCxJQUFJLFFBQVEsS0FBSyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRXZDOzs7OztXQUtHO1FBQ0gsSUFBSSxLQUFLO1lBQ1IsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDO29CQUNKLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMvQixDQUFDO2dCQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7b0JBQ2QsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7Z0JBQ25CLENBQUM7d0JBQVMsQ0FBQztvQkFDVixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDckIsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakIsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ25CLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxNQUFPLENBQUM7UUFDckIsQ0FBQztRQUVEOztXQUVHO1FBQ0gsSUFBSSxRQUFRLEtBQW9CLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7S0FDckQ7SUF6Q0Qsb0JBeUNDIn0=