/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/editor/common/tokens/contiguousMultilineTokens"], function (require, exports, buffer_1, contiguousMultilineTokens_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContiguousMultilineTokensBuilder = void 0;
    class ContiguousMultilineTokensBuilder {
        static deserialize(buff) {
            let offset = 0;
            const count = (0, buffer_1.readUInt32BE)(buff, offset);
            offset += 4;
            const result = [];
            for (let i = 0; i < count; i++) {
                offset = contiguousMultilineTokens_1.ContiguousMultilineTokens.deserialize(buff, offset, result);
            }
            return result;
        }
        constructor() {
            this._tokens = [];
        }
        add(lineNumber, lineTokens) {
            if (this._tokens.length > 0) {
                const last = this._tokens[this._tokens.length - 1];
                if (last.endLineNumber + 1 === lineNumber) {
                    // append
                    last.appendLineTokens(lineTokens);
                    return;
                }
            }
            this._tokens.push(new contiguousMultilineTokens_1.ContiguousMultilineTokens(lineNumber, [lineTokens]));
        }
        finalize() {
            return this._tokens;
        }
        serialize() {
            const size = this._serializeSize();
            const result = new Uint8Array(size);
            this._serialize(result);
            return result;
        }
        _serializeSize() {
            let result = 0;
            result += 4; // 4 bytes for the count
            for (let i = 0; i < this._tokens.length; i++) {
                result += this._tokens[i].serializeSize();
            }
            return result;
        }
        _serialize(destination) {
            let offset = 0;
            (0, buffer_1.writeUInt32BE)(destination, this._tokens.length, offset);
            offset += 4;
            for (let i = 0; i < this._tokens.length; i++) {
                offset = this._tokens[i].serialize(destination, offset);
            }
        }
    }
    exports.ContiguousMultilineTokensBuilder = ContiguousMultilineTokensBuilder;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGlndW91c011bHRpbGluZVRva2Vuc0J1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdG9rZW5zL2NvbnRpZ3VvdXNNdWx0aWxpbmVUb2tlbnNCdWlsZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRyxNQUFhLGdDQUFnQztRQUVyQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQWdCO1lBQ3pDLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNmLE1BQU0sS0FBSyxHQUFHLElBQUEscUJBQVksRUFBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFBQyxNQUFNLElBQUksQ0FBQyxDQUFDO1lBQ3RELE1BQU0sTUFBTSxHQUFnQyxFQUFFLENBQUM7WUFDL0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLEdBQUcscURBQXlCLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDdEUsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUlEO1lBQ0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbkIsQ0FBQztRQUVNLEdBQUcsQ0FBQyxVQUFrQixFQUFFLFVBQXVCO1lBQ3JELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELElBQUksSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLEtBQUssVUFBVSxFQUFFLENBQUM7b0JBQzNDLFNBQVM7b0JBQ1QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUNsQyxPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxxREFBeUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUUsQ0FBQztRQUVNLFFBQVE7WUFDZCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVNLFNBQVM7WUFDZixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkMsTUFBTSxNQUFNLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyxjQUFjO1lBQ3JCLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNmLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyx3QkFBd0I7WUFDckMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzlDLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzNDLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyxVQUFVLENBQUMsV0FBdUI7WUFDekMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsSUFBQSxzQkFBYSxFQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7WUFDckUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzlDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDekQsQ0FBQztRQUNGLENBQUM7S0FDRDtJQXpERCw0RUF5REMifQ==