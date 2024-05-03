/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffChange = void 0;
    /**
     * Represents information about a specific difference between two sequences.
     */
    class DiffChange {
        /**
         * Constructs a new DiffChange with the given sequence information
         * and content.
         */
        constructor(originalStart, originalLength, modifiedStart, modifiedLength) {
            //Debug.Assert(originalLength > 0 || modifiedLength > 0, "originalLength and modifiedLength cannot both be <= 0");
            this.originalStart = originalStart;
            this.originalLength = originalLength;
            this.modifiedStart = modifiedStart;
            this.modifiedLength = modifiedLength;
        }
        /**
         * The end point (exclusive) of the change in the original sequence.
         */
        getOriginalEnd() {
            return this.originalStart + this.originalLength;
        }
        /**
         * The end point (exclusive) of the change in the modified sequence.
         */
        getModifiedEnd() {
            return this.modifiedStart + this.modifiedLength;
        }
    }
    exports.DiffChange = DiffChange;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkNoYW5nZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vZGlmZi9kaWZmQ2hhbmdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUVoRzs7T0FFRztJQUNILE1BQWEsVUFBVTtRQTBCdEI7OztXQUdHO1FBQ0gsWUFBWSxhQUFxQixFQUFFLGNBQXNCLEVBQUUsYUFBcUIsRUFBRSxjQUFzQjtZQUN2RyxrSEFBa0g7WUFDbEgsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7WUFDbkMsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7WUFDckMsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7WUFDbkMsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFDdEMsQ0FBQztRQUVEOztXQUVHO1FBQ0ksY0FBYztZQUNwQixPQUFPLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUNqRCxDQUFDO1FBRUQ7O1dBRUc7UUFDSSxjQUFjO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQ2pELENBQUM7S0FDRDtJQW5ERCxnQ0FtREMifQ==