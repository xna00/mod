/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/editOperation", "vs/editor/common/core/lineRange", "vs/editor/common/core/range", "vs/base/common/async", "vs/workbench/contrib/chat/common/chatWordCounter"], function (require, exports, editOperation_1, lineRange_1, range_1, async_1, chatWordCounter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.invertLineRange = invertLineRange;
    exports.asRange = asRange;
    exports.performAsyncTextEdit = performAsyncTextEdit;
    exports.asProgressiveEdit = asProgressiveEdit;
    function invertLineRange(range, model) {
        if (range.isEmpty) {
            return [];
        }
        const result = [];
        if (range.startLineNumber > 1) {
            result.push(new lineRange_1.LineRange(1, range.startLineNumber));
        }
        if (range.endLineNumberExclusive < model.getLineCount() + 1) {
            result.push(new lineRange_1.LineRange(range.endLineNumberExclusive, model.getLineCount() + 1));
        }
        return result.filter(r => !r.isEmpty);
    }
    function asRange(lineRange, model) {
        return lineRange.isEmpty
            ? new range_1.Range(lineRange.startLineNumber, 1, lineRange.startLineNumber, model.getLineLength(lineRange.startLineNumber))
            : new range_1.Range(lineRange.startLineNumber, 1, lineRange.endLineNumberExclusive - 1, model.getLineLength(lineRange.endLineNumberExclusive - 1));
    }
    async function performAsyncTextEdit(model, edit, progress, obs) {
        const [id] = model.deltaDecorations([], [{
                range: edit.range,
                options: {
                    description: 'asyncTextEdit',
                    stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */
                }
            }]);
        let first = true;
        for await (const part of edit.newText) {
            if (model.isDisposed()) {
                break;
            }
            const range = model.getDecorationRange(id);
            if (!range) {
                throw new Error('FAILED to perform async replace edit because the anchor decoration was removed');
            }
            const edit = first
                ? editOperation_1.EditOperation.replace(range, part) // first edit needs to override the "anchor"
                : editOperation_1.EditOperation.insert(range.getEndPosition(), part);
            obs?.start();
            model.pushEditOperations(null, [edit], (undoEdits) => {
                progress?.report(undoEdits);
                return null;
            });
            obs?.stop();
            first = false;
        }
    }
    function asProgressiveEdit(interval, edit, wordsPerSec, token) {
        wordsPerSec = Math.max(30, wordsPerSec);
        const stream = new async_1.AsyncIterableSource();
        let newText = edit.text ?? '';
        interval.cancelAndSet(() => {
            const r = (0, chatWordCounter_1.getNWords)(newText, 1);
            stream.emitOne(r.value);
            newText = newText.substring(r.value.length);
            if (r.isFullString) {
                interval.cancel();
                stream.resolve();
                d.dispose();
            }
        }, 1000 / wordsPerSec);
        // cancel ASAP
        const d = token.onCancellationRequested(() => {
            interval.cancel();
            stream.resolve();
            d.dispose();
        });
        return {
            range: edit.range,
            newText: stream.asyncIterable
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvYnJvd3Nlci91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRywwQ0FZQztJQUVELDBCQUlDO0lBU0Qsb0RBaUNDO0lBRUQsOENBOEJDO0lBNUZELFNBQWdCLGVBQWUsQ0FBQyxLQUFnQixFQUFFLEtBQWlCO1FBQ2xFLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ25CLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFnQixFQUFFLENBQUM7UUFDL0IsSUFBSSxLQUFLLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBQ0QsSUFBSSxLQUFLLENBQUMsc0JBQXNCLEdBQUcsS0FBSyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzdELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxxQkFBUyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxLQUFLLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRixDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELFNBQWdCLE9BQU8sQ0FBQyxTQUFvQixFQUFFLEtBQWlCO1FBQzlELE9BQU8sU0FBUyxDQUFDLE9BQU87WUFDdkIsQ0FBQyxDQUFDLElBQUksYUFBSyxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDcEgsQ0FBQyxDQUFDLElBQUksYUFBSyxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxzQkFBc0IsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3SSxDQUFDO0lBU00sS0FBSyxVQUFVLG9CQUFvQixDQUFDLEtBQWlCLEVBQUUsSUFBbUIsRUFBRSxRQUEyQyxFQUFFLEdBQW1CO1FBRWxKLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3hDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsT0FBTyxFQUFFO29CQUNSLFdBQVcsRUFBRSxlQUFlO29CQUM1QixVQUFVLDZEQUFxRDtpQkFDL0Q7YUFDRCxDQUFDLENBQUMsQ0FBQztRQUVKLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLEtBQUssRUFBRSxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFdkMsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDeEIsTUFBTTtZQUNQLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0ZBQWdGLENBQUMsQ0FBQztZQUNuRyxDQUFDO1lBRUQsTUFBTSxJQUFJLEdBQUcsS0FBSztnQkFDakIsQ0FBQyxDQUFDLDZCQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyw0Q0FBNEM7Z0JBQ2pGLENBQUMsQ0FBQyw2QkFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEQsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQ2IsS0FBSyxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUU7Z0JBQ3BELFFBQVEsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxDQUFDLENBQUM7WUFDSCxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDWixLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ2YsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxRQUF1QixFQUFFLElBQW9DLEVBQUUsV0FBbUIsRUFBRSxLQUF3QjtRQUU3SSxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFeEMsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQkFBbUIsRUFBVSxDQUFDO1FBQ2pELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBRTlCLFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFO1lBQzFCLE1BQU0sQ0FBQyxHQUFHLElBQUEsMkJBQVMsRUFBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEIsT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDcEIsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2pCLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLENBQUM7UUFFRixDQUFDLEVBQUUsSUFBSSxHQUFHLFdBQVcsQ0FBQyxDQUFDO1FBRXZCLGNBQWM7UUFDZCxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsdUJBQXVCLENBQUMsR0FBRyxFQUFFO1lBQzVDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNsQixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPO1lBQ04sS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLE9BQU8sRUFBRSxNQUFNLENBQUMsYUFBYTtTQUM3QixDQUFDO0lBQ0gsQ0FBQyJ9