/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/range", "vs/editor/contrib/smartSelect/browser/bracketSelections"], function (require, exports, arrays_1, range_1, bracketSelections_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordDistance = void 0;
    class WordDistance {
        static { this.None = new class extends WordDistance {
            distance() { return 0; }
        }; }
        static async create(service, editor) {
            if (!editor.getOption(118 /* EditorOption.suggest */).localityBonus) {
                return WordDistance.None;
            }
            if (!editor.hasModel()) {
                return WordDistance.None;
            }
            const model = editor.getModel();
            const position = editor.getPosition();
            if (!service.canComputeWordRanges(model.uri)) {
                return WordDistance.None;
            }
            const [ranges] = await new bracketSelections_1.BracketSelectionRangeProvider().provideSelectionRanges(model, [position]);
            if (ranges.length === 0) {
                return WordDistance.None;
            }
            const wordRanges = await service.computeWordRanges(model.uri, ranges[0].range);
            if (!wordRanges) {
                return WordDistance.None;
            }
            // remove current word
            const wordUntilPos = model.getWordUntilPosition(position);
            delete wordRanges[wordUntilPos.word];
            return new class extends WordDistance {
                distance(anchor, item) {
                    if (!position.equals(editor.getPosition())) {
                        return 0;
                    }
                    if (item.kind === 17 /* CompletionItemKind.Keyword */) {
                        return 2 << 20;
                    }
                    const word = typeof item.label === 'string' ? item.label : item.label.label;
                    const wordLines = wordRanges[word];
                    if ((0, arrays_1.isFalsyOrEmpty)(wordLines)) {
                        return 2 << 20;
                    }
                    const idx = (0, arrays_1.binarySearch)(wordLines, range_1.Range.fromPositions(anchor), range_1.Range.compareRangesUsingStarts);
                    const bestWordRange = idx >= 0 ? wordLines[idx] : wordLines[Math.max(0, ~idx - 1)];
                    let blockDistance = ranges.length;
                    for (const range of ranges) {
                        if (!range_1.Range.containsRange(range.range, bestWordRange)) {
                            break;
                        }
                        blockDistance -= 1;
                    }
                    return blockDistance;
                }
            };
        }
    }
    exports.WordDistance = WordDistance;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZERpc3RhbmNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zdWdnZXN0L2Jyb3dzZXIvd29yZERpc3RhbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFzQixZQUFZO2lCQUVqQixTQUFJLEdBQUcsSUFBSSxLQUFNLFNBQVEsWUFBWTtZQUNwRCxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3hCLENBQUM7UUFFRixNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUE2QixFQUFFLE1BQW1CO1lBRXJFLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxnQ0FBc0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDM0QsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDO1lBQzFCLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQztZQUMxQixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUV0QyxJQUFJLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM5QyxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUM7WUFDMUIsQ0FBQztZQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLElBQUksaURBQTZCLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3JHLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDO1lBQzFCLENBQUM7WUFFRCxNQUFNLFVBQVUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvRSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQztZQUMxQixDQUFDO1lBRUQsc0JBQXNCO1lBQ3RCLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMxRCxPQUFPLFVBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFckMsT0FBTyxJQUFJLEtBQU0sU0FBUSxZQUFZO2dCQUNwQyxRQUFRLENBQUMsTUFBaUIsRUFBRSxJQUFvQjtvQkFDL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQzt3QkFDNUMsT0FBTyxDQUFDLENBQUM7b0JBQ1YsQ0FBQztvQkFDRCxJQUFJLElBQUksQ0FBQyxJQUFJLHdDQUErQixFQUFFLENBQUM7d0JBQzlDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDaEIsQ0FBQztvQkFDRCxNQUFNLElBQUksR0FBRyxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztvQkFDNUUsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNuQyxJQUFJLElBQUEsdUJBQWMsRUFBQyxTQUFTLENBQUMsRUFBRSxDQUFDO3dCQUMvQixPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2hCLENBQUM7b0JBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBQSxxQkFBWSxFQUFDLFNBQVMsRUFBRSxhQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFLGFBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO29CQUNqRyxNQUFNLGFBQWEsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNuRixJQUFJLGFBQWEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO29CQUNsQyxLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO3dCQUM1QixJQUFJLENBQUMsYUFBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxFQUFFLENBQUM7NEJBQ3RELE1BQU07d0JBQ1AsQ0FBQzt3QkFDRCxhQUFhLElBQUksQ0FBQyxDQUFDO29CQUNwQixDQUFDO29CQUNELE9BQU8sYUFBYSxDQUFDO2dCQUN0QixDQUFDO2FBQ0QsQ0FBQztRQUNILENBQUM7O0lBOURGLG9DQWlFQyJ9