/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoaderStats = exports.isESM = void 0;
    // ESM-comment-begin
    exports.isESM = false;
    // ESM-comment-end
    // ESM-uncomment-begin
    // export const isESM = true;
    // ESM-uncomment-end
    class LoaderStats {
        static get() {
            const amdLoadScript = new Map();
            const amdInvokeFactory = new Map();
            const nodeRequire = new Map();
            const nodeEval = new Map();
            function mark(map, stat) {
                if (map.has(stat.detail)) {
                    // console.warn('BAD events, DOUBLE start', stat);
                    // map.delete(stat.detail);
                    return;
                }
                map.set(stat.detail, -stat.timestamp);
            }
            function diff(map, stat) {
                const duration = map.get(stat.detail);
                if (!duration) {
                    // console.warn('BAD events, end WITHOUT start', stat);
                    // map.delete(stat.detail);
                    return;
                }
                if (duration >= 0) {
                    // console.warn('BAD events, DOUBLE end', stat);
                    // map.delete(stat.detail);
                    return;
                }
                map.set(stat.detail, duration + stat.timestamp);
            }
            let stats = [];
            if (typeof require === 'function' && typeof require.getStats === 'function') {
                stats = require.getStats().slice(0).sort((a, b) => a.timestamp - b.timestamp);
            }
            for (const stat of stats) {
                switch (stat.type) {
                    case 10 /* LoaderEventType.BeginLoadingScript */:
                        mark(amdLoadScript, stat);
                        break;
                    case 11 /* LoaderEventType.EndLoadingScriptOK */:
                    case 12 /* LoaderEventType.EndLoadingScriptError */:
                        diff(amdLoadScript, stat);
                        break;
                    case 21 /* LoaderEventType.BeginInvokeFactory */:
                        mark(amdInvokeFactory, stat);
                        break;
                    case 22 /* LoaderEventType.EndInvokeFactory */:
                        diff(amdInvokeFactory, stat);
                        break;
                    case 33 /* LoaderEventType.NodeBeginNativeRequire */:
                        mark(nodeRequire, stat);
                        break;
                    case 34 /* LoaderEventType.NodeEndNativeRequire */:
                        diff(nodeRequire, stat);
                        break;
                    case 31 /* LoaderEventType.NodeBeginEvaluatingScript */:
                        mark(nodeEval, stat);
                        break;
                    case 32 /* LoaderEventType.NodeEndEvaluatingScript */:
                        diff(nodeEval, stat);
                        break;
                }
            }
            let nodeRequireTotal = 0;
            nodeRequire.forEach(value => nodeRequireTotal += value);
            function to2dArray(map) {
                const res = [];
                map.forEach((value, index) => res.push([index, value]));
                return res;
            }
            return {
                amdLoad: to2dArray(amdLoadScript),
                amdInvoke: to2dArray(amdInvokeFactory),
                nodeRequire: to2dArray(nodeRequire),
                nodeEval: to2dArray(nodeEval),
                nodeRequireTotal
            };
        }
        static toMarkdownTable(header, rows) {
            let result = '';
            const lengths = [];
            header.forEach((cell, ci) => {
                lengths[ci] = cell.length;
            });
            rows.forEach(row => {
                row.forEach((cell, ci) => {
                    if (typeof cell === 'undefined') {
                        cell = row[ci] = '-';
                    }
                    const len = cell.toString().length;
                    lengths[ci] = Math.max(len, lengths[ci]);
                });
            });
            // header
            header.forEach((cell, ci) => { result += `| ${cell + ' '.repeat(lengths[ci] - cell.toString().length)} `; });
            result += '|\n';
            header.forEach((_cell, ci) => { result += `| ${'-'.repeat(lengths[ci])} `; });
            result += '|\n';
            // cells
            rows.forEach(row => {
                row.forEach((cell, ci) => {
                    if (typeof cell !== 'undefined') {
                        result += `| ${cell + ' '.repeat(lengths[ci] - cell.toString().length)} `;
                    }
                });
                result += '|\n';
            });
            return result;
        }
    }
    exports.LoaderStats = LoaderStats;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW1kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9hbWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBRWhHLG9CQUFvQjtJQUNQLFFBQUEsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUMzQixrQkFBa0I7SUFDbEIsc0JBQXNCO0lBQ3RCLDZCQUE2QjtJQUM3QixvQkFBb0I7SUFFcEIsTUFBc0IsV0FBVztRQU9oQyxNQUFNLENBQUMsR0FBRztZQUNULE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBQ2hELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFDbkQsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFDOUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFFM0MsU0FBUyxJQUFJLENBQUMsR0FBd0IsRUFBRSxJQUFpQjtnQkFDeEQsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUMxQixrREFBa0Q7b0JBQ2xELDJCQUEyQjtvQkFDM0IsT0FBTztnQkFDUixDQUFDO2dCQUNELEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBRUQsU0FBUyxJQUFJLENBQUMsR0FBd0IsRUFBRSxJQUFpQjtnQkFDeEQsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDZix1REFBdUQ7b0JBQ3ZELDJCQUEyQjtvQkFDM0IsT0FBTztnQkFDUixD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