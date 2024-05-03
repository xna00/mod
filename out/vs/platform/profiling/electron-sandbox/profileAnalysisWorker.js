/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/ternarySearchTree", "vs/base/common/uri", "vs/platform/profiling/common/profiling", "vs/platform/profiling/common/profilingModel"], function (require, exports, path_1, ternarySearchTree_1, uri_1, profiling_1, profilingModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.create = create;
    function create() {
        return new ProfileAnalysisWorker();
    }
    class ProfileAnalysisWorker {
        analyseBottomUp(profile) {
            if (!profiling_1.Utils.isValidProfile(profile)) {
                return { kind: 1 /* ProfilingOutput.Irrelevant */, samples: [] };
            }
            const model = (0, profilingModel_1.buildModel)(profile);
            const samples = bottomUp(model, 5)
                .filter(s => !s.isSpecial);
            if (samples.length === 0 || samples[0].percentage < 10) {
                // ignore this profile because 90% of the time is spent inside "special" frames
                // like idle, GC, or program
                return { kind: 1 /* ProfilingOutput.Irrelevant */, samples: [] };
            }
            return { kind: 2 /* ProfilingOutput.Interesting */, samples };
        }
        analyseByUrlCategory(profile, categories) {
            // build search tree
            const searchTree = ternarySearchTree_1.TernarySearchTree.forUris();
            searchTree.fill(categories);
            // cost by categories
            const model = (0, profilingModel_1.buildModel)(profile);
            const aggegrateByCategory = new Map();
            for (const node of model.nodes) {
                const loc = model.locations[node.locationId];
                let category;
                try {
                    category = searchTree.findSubstr(uri_1.URI.parse(loc.callFrame.url));
                }
                catch {
                    // ignore
                }
                if (!category) {
                    category = printCallFrameShort(loc.callFrame);
                }
                const value = aggegrateByCategory.get(category) ?? 0;
                const newValue = value + node.selfTime;
                aggegrateByCategory.set(category, newValue);
            }
            const result = [];
            for (const [key, value] of aggegrateByCategory) {
                result.push([key, value]);
            }
            return result;
        }
    }
    function isSpecial(call) {
        return call.functionName.startsWith('(') && call.functionName.endsWith(')');
    }
    function printCallFrameShort(frame) {
        let result = frame.functionName || '(anonymous)';
        if (frame.url) {
            result += '#';
            result += (0, path_1.basename)(frame.url);
            if (frame.lineNumber >= 0) {
                result += ':';
                result += frame.lineNumber + 1;
            }
            if (frame.columnNumber >= 0) {
                result += ':';
                result += frame.columnNumber + 1;
            }
        }
        return result;
    }
    function printCallFrameStackLike(frame) {
        let result = frame.functionName || '(anonymous)';
        if (frame.url) {
            result += ' (';
            result += frame.url;
            if (frame.lineNumber >= 0) {
                result += ':';
                result += frame.lineNumber + 1;
            }
            if (frame.columnNumber >= 0) {
                result += ':';
                result += frame.columnNumber + 1;
            }
            result += ')';
        }
        return result;
    }
    function getHeaviestLocationIds(model, topN) {
        const stackSelfTime = {};
        for (const node of model.nodes) {
            stackSelfTime[node.locationId] = (stackSelfTime[node.locationId] || 0) + node.selfTime;
        }
        const locationIds = Object.entries(stackSelfTime)
            .sort(([, a], [, b]) => b - a)
            .slice(0, topN)
            .map(([locationId]) => Number(locationId));
        return new Set(locationIds);
    }
    function bottomUp(model, topN) {
        const root = profilingModel_1.BottomUpNode.root();
        const locationIds = getHeaviestLocationIds(model, topN);
        for (const node of model.nodes) {
            if (locationIds.has(node.locationId)) {
                (0, profilingModel_1.processNode)(root, node, model);
                root.addNode(node);
            }
        }
        const result = Object.values(root.children)
            .sort((a, b) => b.selfTime - a.selfTime)
            .slice(0, topN);
        const samples = [];
        for (const node of result) {
            const sample = {
                selfTime: Math.round(node.selfTime / 1000),
                totalTime: Math.round(node.aggregateTime / 1000),
                location: printCallFrameShort(node.callFrame),
                absLocation: printCallFrameStackLike(node.callFrame),
                url: node.callFrame.url,
                caller: [],
                percentage: Math.round(node.selfTime / (model.duration / 100)),
                isSpecial: isSpecial(node.callFrame)
            };
            // follow the heaviest caller paths
            const stack = [node];
            while (stack.length) {
                const node = stack.pop();
                let top;
                for (const candidate of Object.values(node.children)) {
                    if (!top || top.selfTime < candidate.selfTime) {
                        top = candidate;
                    }
                }
                if (top) {
                    const percentage = Math.round(top.selfTime / (node.selfTime / 100));
                    sample.caller.push({
                        percentage,
                        location: printCallFrameShort(top.callFrame),
                        absLocation: printCallFrameStackLike(top.callFrame),
                    });
                    stack.push(top);
                }
            }
            samples.push(sample);
        }
        return samples;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZUFuYWx5c2lzV29ya2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9wcm9maWxpbmcvZWxlY3Ryb24tc2FuZGJveC9wcm9maWxlQW5hbHlzaXNXb3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsd0JBRUM7SUFGRCxTQUFnQixNQUFNO1FBQ3JCLE9BQU8sSUFBSSxxQkFBcUIsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFFRCxNQUFNLHFCQUFxQjtRQUkxQixlQUFlLENBQUMsT0FBbUI7WUFDbEMsSUFBSSxDQUFDLGlCQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ3BDLE9BQU8sRUFBRSxJQUFJLG9DQUE0QixFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUMxRCxDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsSUFBQSwyQkFBVSxFQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO2lCQUNoQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUU1QixJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEdBQUcsRUFBRSxFQUFFLENBQUM7Z0JBQ3hELCtFQUErRTtnQkFDL0UsNEJBQTRCO2dCQUM1QixPQUFPLEVBQUUsSUFBSSxvQ0FBNEIsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDMUQsQ0FBQztZQUVELE9BQU8sRUFBRSxJQUFJLHFDQUE2QixFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ3ZELENBQUM7UUFFRCxvQkFB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