/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/services/semanticTokensDto", "vs/base/common/buffer", "vs/base/test/common/utils"], function (require, exports, assert, semanticTokensDto_1, buffer_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SemanticTokensDto', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function toArr(arr) {
            const result = [];
            for (let i = 0, len = arr.length; i < len; i++) {
                result[i] = arr[i];
            }
            return result;
        }
        function assertEqualFull(actual, expected) {
            const convert = (dto) => {
                return {
                    id: dto.id,
                    type: dto.type,
                    data: toArr(dto.data)
                };
            };
            assert.deepStrictEqual(convert(actual), convert(expected));
        }
        function assertEqualDelta(actual, expected) {
            const convertOne = (delta) => {
                if (!delta.data) {
                    return delta;
                }
                return {
                    start: delta.start,
                    deleteCount: delta.deleteCount,
                    data: toArr(delta.data)
                };
            };
            const convert = (dto) => {
                return {
                    id: dto.id,
                    type: dto.type,
                    deltas: dto.deltas.map(convertOne)
                };
            };
            assert.deepStrictEqual(convert(actual), convert(expected));
        }
        function testRoundTrip(value) {
            const decoded = (0, semanticTokensDto_1.decodeSemanticTokensDto)((0, semanticTokensDto_1.encodeSemanticTokensDto)(value));
            if (value.type === 'full' && decoded.type === 'full') {
                assertEqualFull(decoded, value);
            }
            else if (value.type === 'delta' && decoded.type === 'delta') {
                assertEqualDelta(decoded, value);
            }
            else {
                assert.fail('wrong type');
            }
        }
        test('full encoding', () => {
            testRoundTrip({
                id: 12,
                type: 'full',
                data: new Uint32Array([(1 << 24) + (2 << 16) + (3 << 8) + 4])
            });
        });
        test('delta encoding', () => {
            testRoundTrip({
                id: 12,
                type: 'delta',
                deltas: [{
                        start: 0,
                        deleteCount: 4,
                        data: undefined
                    }, {
                        start: 15,
                        deleteCount: 0,
                        data: new Uint32Array([(1 << 24) + (2 << 16) + (3 << 8) + 4])
                    }, {
                        start: 27,
                        deleteCount: 5,
                        data: new Uint32Array([(1 << 24) + (2 << 16) + (3 << 8) + 4, 1, 2, 3, 4, 5, 6, 7, 8, 9])
                    }]
            });
        });
        test('partial array buffer', () => {
            const sharedArr = new Uint32Array([
                (1 << 24) + (2 << 16) + (3 << 8) + 4,
                1, 2, 3, 4, 5, (1 << 24) + (2 << 16) + (3 << 8) + 4
            ]);
            testRoundTrip({
                id: 12,
                type: 'delta',
                deltas: [{
                        start: 0,
                        deleteCount: 4,
                        data: sharedArr.subarray(0, 1)
                    }, {
                        start: 15,
                        deleteCount: 0,
                        data: sharedArr.subarray(1, sharedArr.length)
                    }]
            });
        });
        test('issue #94521: unusual backing array buffer', () => {
            function wrapAndSliceUint8Arry(buff, prefixLength, suffixLength) {
                const wrapped = new Uint8Array(prefixLength + buff.byteLength + suffixLength);
                wrapped.set(buff, prefixLength);
                return wrapped.subarray(prefixLength, prefixLength + buff.byteLength);
            }
            function wrapAndSlice(buff, prefixLength, suffixLength) {
                return buffer_1.VSBuffer.wrap(wrapAndSliceUint8Arry(buff.buffer, prefixLength, suffixLength));
            }
            const dto = {
                id: 5,
                type: 'full',
                data: new Uint32Array([1, 2, 3, 4, 5])
            };
            const encoded = (0, semanticTokensDto_1.encodeSemanticTokensDto)(dto);
            // with misaligned prefix and misaligned suffix
            assertEqualFull((0, semanticTokensDto_1.decodeSemanticTokensDto)(wrapAndSlice(encoded, 1, 1)), dto);
            // with misaligned prefix and aligned suffix
            assertEqualFull((0, semanticTokensDto_1.decodeSemanticTokensDto)(wrapAndSlice(encoded, 1, 4)), dto);
            // with aligned prefix and misaligned suffix
            assertEqualFull((0, semanticTokensDto_1.decodeSemanticTokensDto)(wrapAndSlice(encoded, 4, 1)), dto);
            // with aligned prefix and aligned suffix
            assertEqualFull((0, semanticTokensDto_1.decodeSemanticTokensDto)(wrapAndSlice(encoded, 4, 4)), dto);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VtYW50aWNUb2tlbnNEdG8udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL3NlcnZpY2VzL3NlbWFudGljVG9rZW5zRHRvLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUUvQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUyxLQUFLLENBQUMsR0FBZ0I7WUFDOUIsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1lBQzVCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQsU0FBUyxlQUFlLENBQUMsTUFBOEIsRUFBRSxRQUFnQztZQUN4RixNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQTJCLEVBQUUsRUFBRTtnQkFDL0MsT0FBTztvQkFDTixFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUU7b0JBQ1YsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJO29CQUNkLElBQUksRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztpQkFDckIsQ0FBQztZQUNILENBQUMsQ0FBQztZQUNGLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCxTQUFTLGdCQUFnQixDQUFDLE1B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