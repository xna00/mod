/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/linkedList", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, linkedList_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketSelectionRangeProvider = void 0;
    class BracketSelectionRangeProvider {
        async provideSelectionRanges(model, positions) {
            const result = [];
            for (const position of positions) {
                const bucket = [];
                result.push(bucket);
                const ranges = new Map();
                await new Promise(resolve => BracketSelectionRangeProvider._bracketsRightYield(resolve, 0, model, position, ranges));
                await new Promise(resolve => BracketSelectionRangeProvider._bracketsLeftYield(resolve, 0, model, position, ranges, bucket));
            }
            return result;
        }
        static { this._maxDuration = 30; }
        static { this._maxRounds = 2; }
        static _bracketsRightYield(resolve, round, model, pos, ranges) {
            const counts = new Map();
            const t1 = Date.now();
            while (true) {
                if (round >= BracketSelectionRangeProvider._maxRounds) {
                    resolve();
                    break;
                }
                if (!pos) {
                    resolve();
                    break;
                }
                const bracket = model.bracketPairs.findNextBracket(pos);
                if (!bracket) {
                    resolve();
                    break;
                }
                const d = Date.now() - t1;
                if (d > BracketSelectionRangeProvider._maxDuration) {
                    setTimeout(() => BracketSelectionRangeProvider._bracketsRightYield(resolve, round + 1, model, pos, ranges));
                    break;
                }
                if (bracket.bracketInfo.isOpeningBracket) {
                    const key = bracket.bracketInfo.bracketText;
                    // wait for closing
                    const val = counts.has(key) ? counts.get(key) : 0;
                    counts.set(key, val + 1);
                }
                else {
                    const key = bracket.bracketInfo.getOpeningBrackets()[0].bracketText;
                    // process closing
                    let val = counts.has(key) ? counts.get(key) : 0;
                    val -= 1;
                    counts.set(key, Math.max(0, val));
                    if (val < 0) {
                        let list = ranges.get(key);
                        if (!list) {
                            list = new linkedList_1.LinkedList();
                            ranges.set(key, list);
                        }
                        list.push(bracket.range);
                    }
                }
                pos = bracket.range.getEndPosition();
            }
        }
        static _bracketsLeftYield(resolve, round, model, pos, ranges, bucket) {
            const counts = new Map();
            const t1 = Date.now();
            while (true) {
                if (round >= BracketSelectionRangeProvider._maxRounds && ranges.size === 0) {
                    resolve();
                    break;
                }
                if (!pos) {
                    resolve();
                    break;
                }
                const bracket = model.bracketPairs.findPrevBracket(pos);
                if (!bracket) {
                    resolve();
                    break;
                }
                const d = Date.now() - t1;
                if (d > BracketSelectionRangeProvider._maxDuration) {
                    setTimeout(() => BracketSelectionRangeProvider._bracketsLeftYield(resolve, round + 1, model, pos, ranges, bucket));
                    break;
                }
                if (!bracket.bracketInfo.isOpeningBracket) {
                    const key = bracket.bracketInfo.getOpeningBrackets()[0].bracketText;
                    // wait for opening
                    const val = counts.has(key) ? counts.get(key) : 0;
                    counts.set(key, val + 1);
                }
                else {
                    const key = bracket.bracketInfo.bracketText;
                    // opening
                    let val = counts.has(key) ? counts.get(key) : 0;
                    val -= 1;
                    counts.set(key, Math.max(0, val));
                    if (val < 0) {
                        const list = ranges.get(key);
                        if (list) {
                            const closing = list.shift();
                            if (list.size === 0) {
                                ranges.delete(key);
                            }
                            const innerBracket = range_1.Range.fromPositions(bracket.range.getEndPosition(), closing.getStartPosition());
                            const outerBracket = range_1.Range.fromPositions(bracket.range.getStartPosition(), closing.getEndPosition());
                            bucket.push({ range: innerBracket });
                            bucket.push({ range: outerBracket });
                            BracketSelectionRangeProvider._addBracketLeading(model, outerBracket, bucket);
                        }
                    }
                }
                pos = bracket.range.getStartPosition();
            }
        }
        static _addBracketLeading(model, bracket, bucket) {
            if (bracket.startLineNumber === bracket.endLineNumber) {
                return;
            }
            // xxxxxxxx {
            //
            // }
            const startLine = bracket.startLineNumber;
            const column = model.getLineFirstNonWhitespaceColumn(startLine);
            if (column !== 0 && column !== bracket.startColumn) {
                bucket.push({ range: range_1.Range.fromPositions(new position_1.Position(startLine, column), bracket.getEndPosition()) });
                bucket.push({ range: range_1.Range.fromPositions(new position_1.Position(startLine, 1), bracket.getEndPosition()) });
            }
            // xxxxxxxx
            // {
            //
            // }
            const aboveLine = startLine - 1;
            if (aboveLine > 0) {
                const column = model.getLineFirstNonWhitespaceColumn(aboveLine);
                if (column === bracket.startColumn && column !== model.getLineLastNonWhitespaceColumn(aboveLine)) {
                    bucket.push({ range: range_1.Range.fromPositions(new position_1.Position(aboveLine, column), bracket.getEndPosition()) });
                    bucket.push({ range: range_1.Range.fromPositions(new position_1.Position(aboveLine, 1), bracket.getEndPosition()) });
                }
            }
        }
    }
    exports.BracketSelectionRangeProvider = BracketSelectionRangeProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldFNlbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3NtYXJ0U2VsZWN0L2Jyb3dzZXIvYnJhY2tldFNlbGVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsNkJBQTZCO1FBRXpDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxLQUFpQixFQUFFLFNBQXFCO1lBQ3BFLE1BQU0sTUFBTSxHQUF1QixFQUFFLENBQUM7WUFFdEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDbEMsTUFBTSxNQUFNLEdBQXFCLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFcEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQTZCLENBQUM7Z0JBQ3BELE1BQU0sSUFBSSxPQUFPLENBQU8sT0FBTyxDQUFDLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDM0gsTUFBTSxJQUFJLE9BQU8sQ0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDLDZCQUE2QixDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNuSSxDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO2lCQUVhLGlCQUFZLEdBQUcsRUFBRSxDQUFDO2lCQUNSLGVBQVUsR0FBRyxDQUFDLENBQUM7UUFFL0IsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE9BQW1CLEVBQUUsS0FBYSxFQUFFLEtBQWlCLEVBQUUsR0FBYSxFQUFFLE1BQXNDO1lBQzlJLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBQ3pDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN0QixPQUFPLElBQUksRUFBRSxDQUFDO2dCQUNiLElBQUksS0FBSyxJQUFJLDZCQUE2QixDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUN2RCxPQUFPLEVBQUUsQ0FBQztvQkFDVixNQUFNO2dCQUNQLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNWLE9BQU8sRUFBRSxDQUFDO29CQUNWLE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNkLE9BQU8sRUFBRSxDQUFDO29CQUNWLE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsR0FBRyw2QkFBNkIsQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDcEQsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLDZCQUE2QixDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDNUcsTUFBTTtnQkFDUCxDQUFDO2dCQUNELElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUMxQyxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQztvQkFDNUMsbUJBQW1CO29CQUNuQixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ25ELE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7b0JBQ3BFLGtCQUFrQjtvQkFDbEIsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNqRCxHQUFHLElBQUksQ0FBQyxDQUFDO29CQUNULE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUNiLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQzNCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzs0QkFDWCxJQUFJLEdBQUcsSUFBSSx1QkFBVSxFQUFFLENBQUM7NEJBQ3hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUN2QixDQUFDO3dCQUNELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMxQixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdEMsQ0FBQztRQUNGLENBQUM7UUFFTyxNQUFNLENBQUMsa0JBQWtCLENBQUMsT0FBbUIsRUFBRSxLQUFhLEVBQUUsS0FBaUIsRUFBRSxHQUFhLEVBQUUsTUFBc0MsRUFBRSxNQUF3QjtZQUN2SyxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQUN6QyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDdEIsT0FBTyxJQUFJLEVBQUUsQ0FBQztnQkFDYixJQUFJLEtBQUssSUFBSSw2QkFBNkIsQ0FBQyxVQUFVLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDNUUsT0FBTyxFQUFFLENBQUM7b0JBQ1YsTUFBTTtnQkFDUCxDQUFDO2dCQUNELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDVixPQUFPLEVBQUUsQ0FBQztvQkFDVixNQUFNO2dCQUNQLENBQUM7Z0JBQ0QsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3hELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDZCxPQUFPLEVBQUUsQ0FBQztvQkFDVixNQUFNO2dCQUNQLENBQUM7Z0JBQ0QsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLEdBQUcsNkJBQTZCLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3BELFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNuSCxNQUFNO2dCQUNQLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDM0MsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztvQkFDcEUsbUJBQW1CO29CQUNuQixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ25ELE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDO29CQUM1QyxVQUFVO29CQUNWLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDakQsR0FBRyxJQUFJLENBQUMsQ0FBQztvQkFDVCxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDYixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUM3QixJQUFJLElBQUksRUFBRSxDQUFDOzRCQUNWLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzs0QkFDN0IsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO2dDQUNyQixNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUNwQixDQUFDOzRCQUNELE1BQU0sWUFBWSxHQUFHLGFBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsRUFBRSxPQUFRLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDOzRCQUN0RyxNQUFNLFlBQVksR0FBRyxhQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxPQUFRLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQzs0QkFDdEcsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDOzRCQUNyQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7NEJBQ3JDLDZCQUE2QixDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7d0JBQy9FLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2dCQUNELEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDeEMsQ0FBQztRQUNGLENBQUM7UUFFTyxNQUFNLENBQUMsa0JBQWtCLENBQUMsS0FBaUIsRUFBRSxPQUFjLEVBQUUsTUFBd0I7WUFDNUYsSUFBSSxPQUFPLENBQUMsZUFBZSxLQUFLLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDdkQsT0FBTztZQUNSLENBQUM7WUFDRCxhQUFhO1lBQ2IsRUFBRTtZQUNGLElBQUk7WUFDSixNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDO1lBQzFDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNoRSxJQUFJLE1BQU0sS0FBSyxDQUFDLElBQUksTUFBTSxLQUFLLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDcEQsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxhQUFLLENBQUMsYUFBYSxDQUFDLElBQUksbUJBQVEsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLEVBQUUsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN2RyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGFBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxtQkFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbkcsQ0FBQztZQUVELFdBQVc7WUFDWCxJQUFJO1lBQ0osRUFBRTtZQUNGLElBQUk7WUFDSixNQUFNLFNBQVMsR0FBRyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLElBQUksU0FBUyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNuQixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsK0JBQStCLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2hFLElBQUksTUFBTSxLQUFLLE9BQU8sQ0FBQyxXQUFXLElBQUksTUFBTSxLQUFLLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUNsRyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGFBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxtQkFBUSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsRUFBRSxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3ZHLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsYUFBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLG1CQUFRLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDbkcsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDOztJQWhKRixzRUFpSkMifQ==