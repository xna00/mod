/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./length"], function (require, exports, length_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeReader = void 0;
    /**
     * Allows to efficiently find a longest child at a given offset in a fixed node.
     * The requested offsets must increase monotonously.
    */
    class NodeReader {
        constructor(node) {
            this.lastOffset = length_1.lengthZero;
            this.nextNodes = [node];
            this.offsets = [length_1.lengthZero];
            this.idxs = [];
        }
        /**
         * Returns the longest node at `offset` that satisfies the predicate.
         * @param offset must be greater than or equal to the last offset this method has been called with!
        */
        readLongestNodeAt(offset, predicate) {
            if ((0, length_1.lengthLessThan)(offset, this.lastOffset)) {
                throw new Error('Invalid offset');
            }
            this.lastOffset = offset;
            // Find the longest node of all those that are closest to the current offset.
            while (true) {
                const curNode = lastOrUndefined(this.nextNodes);
                if (!curNode) {
                    return undefined;
                }
                const curNodeOffset = lastOrUndefined(this.offsets);
                if ((0, length_1.lengthLessThan)(offset, curNodeOffset)) {
                    // The next best node is not here yet.
                    // The reader must advance before a cached node is hit.
                    return undefined;
                }
                if ((0, length_1.lengthLessThan)(curNodeOffset, offset)) {
                    // The reader is ahead of the current node.
                    if ((0, length_1.lengthAdd)(curNodeOffset, curNode.length) <= offset) {
                        // The reader is after the end of the current node.
                        this.nextNodeAfterCurrent();
                    }
                    else {
                        // The reader is somewhere in the current node.
                        const nextChildIdx = getNextChildIdx(curNode);
                        if (nextChildIdx !== -1) {
                            // Go to the first child and repeat.
                            this.nextNodes.push(curNode.getChild(nextChildIdx));
                            this.offsets.push(curNodeOffset);
                            this.idxs.push(nextChildIdx);
                        }
                        else {
                            // We don't have children
                            this.nextNodeAfterCurrent();
                        }
                    }
                }
                else {
                    // readerOffsetBeforeChange === curNodeOffset
                    if (predicate(curNode)) {
                        this.nextNodeAfterCurrent();
                        return curNode;
                    }
                    else {
                        const nextChildIdx = getNextChildIdx(curNode);
                        // look for shorter node
                        if (nextChildIdx === -1) {
                            // There is no shorter node.
                            this.nextNodeAfterCurrent();
                            return undefined;
                        }
                        else {
                            // Descend into first child & repeat.
                            this.nextNodes.push(curNode.getChild(nextChildIdx));
                            this.offsets.push(curNodeOffset);
                            this.idxs.push(nextChildIdx);
                        }
                    }
                }
            }
        }
        // Navigates to the longest node that continues after the current node.
        nextNodeAfterCurrent() {
            while (true) {
                const currentOffset = lastOrUndefined(this.offsets);
                const currentNode = lastOrUndefined(this.nextNodes);
                this.nextNodes.pop();
                this.offsets.pop();
                if (this.idxs.length === 0) {
                    // We just popped the root node, there is no next node.
                    break;
                }
                // Parent is not undefined, because idxs is not empty
                const parent = lastOrUndefined(this.nextNodes);
                const nextChildIdx = getNextChildIdx(parent, this.idxs[this.idxs.length - 1]);
                if (nextChildIdx !== -1) {
                    this.nextNodes.push(parent.getChild(nextChildIdx));
                    this.offsets.push((0, length_1.lengthAdd)(currentOffset, currentNode.length));
                    this.idxs[this.idxs.length - 1] = nextChildIdx;
                    break;
                }
                else {
                    this.idxs.pop();
                }
                // We fully consumed the parent.
                // Current node is now parent, so call nextNodeAfterCurrent again
            }
        }
    }
    exports.NodeReader = NodeReader;
    function getNextChildIdx(node, curIdx = -1) {
        while (true) {
            curIdx++;
            if (curIdx >= node.childrenLength) {
                return -1;
            }
            if (node.getChild(curIdx)) {
                return curIdx;
            }
        }
    }
    function lastOrUndefined(arr) {
        return arr.length > 0 ? arr[arr.length - 1] : undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZVJlYWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9icmFja2V0UGFpcnNUZXh0TW9kZWxQYXJ0L2JyYWNrZXRQYWlyc1RyZWUvbm9kZVJlYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEc7OztNQUdFO0lBQ0YsTUFBYSxVQUFVO1FBTXRCLFlBQVksSUFBYTtZQUZqQixlQUFVLEdBQVcsbUJBQVUsQ0FBQztZQUd2QyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLG1CQUFVLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNoQixDQUFDO1FBRUQ7OztVQUdFO1FBQ0YsaUJBQWlCLENBQUMsTUFBYyxFQUFFLFNBQXFDO1lBQ3RFLElBQUksSUFBQSx1QkFBYyxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ25DLENBQUM7WUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQztZQUV6Qiw2RUFBNkU7WUFDN0UsT0FBTyxJQUFJLEVBQUUsQ0FBQztnQkFDYixNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUVoRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2QsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUM7Z0JBQ0QsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQztnQkFFckQsSUFBSSxJQUFBLHVCQUFjLEVBQUMs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