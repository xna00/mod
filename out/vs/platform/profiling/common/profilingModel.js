/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.processNode = exports.BottomUpNode = exports.buildModel = void 0;
    /**
     * Recursive function that computes and caches the aggregate time for the
     * children of the computed now.
     */
    const computeAggregateTime = (index, nodes) => {
        const row = nodes[index];
        if (row.aggregateTime) {
            return row.aggregateTime;
        }
        let total = row.selfTime;
        for (const child of row.children) {
            total += computeAggregateTime(child, nodes);
        }
        return (row.aggregateTime = total);
    };
    const ensureSourceLocations = (profile) => {
        let locationIdCounter = 0;
        const locationsByRef = new Map();
        const getLocationIdFor = (callFrame) => {
            const ref = [
                callFrame.functionName,
                callFrame.url,
                callFrame.scriptId,
                callFrame.lineNumber,
                callFrame.columnNumber,
            ].join(':');
            const existing = locationsByRef.get(ref);
            if (existing) {
                return existing.id;
            }
            const id = locationIdCounter++;
            locationsByRef.set(ref, {
                id,
                callFrame,
                location: {
                    lineNumber: callFrame.lineNumber + 1,
                    columnNumber: callFrame.columnNumber + 1,
                    // source: {
                    // 	name: maybeFileUrlToPath(callFrame.url),
                    // 	path: maybeFileUrlToPath(callFrame.url),
                    // 	sourceReference: 0,
                    // },
                },
            });
            return id;
        };
        for (const node of profile.nodes) {
            node.locationId = getLocationIdFor(node.callFrame);
            node.positionTicks = node.positionTicks?.map(tick => ({
                ...tick,
                // weirdly, line numbers here are 1-based, not 0-based. The position tick
                // only gives line-level granularity, so 'mark' the entire range of source
                // code the tick refers to
                startLocationId: getLocationIdFor({
                    ...node.callFrame,
                    lineNumber: tick.line - 1,
                    columnNumber: 0,
                }),
                endLocationId: getLocationIdFor({
                    ...node.callFrame,
                    lineNumber: tick.line,
                    columnNumber: 0,
                }),
            }));
        }
        return [...locationsByRef.values()]
            .sort((a, b) => a.id - b.id)
            .map(l => ({ locations: [l.location], callFrame: l.callFrame }));
    };
    /**
     * Computes the model for the given profile.
     */
    const buildModel = (profile) => {
        if (!profile.timeDeltas || !profile.samples) {
            return {
                nodes: [],
                locations: [],
                samples: profile.samples || [],
                timeDeltas: profile.timeDeltas || [],
                // rootPath: profile.$vscode?.rootPath,
                duration: profile.endTime - profile.startTime,
            };
        }
        const { samples, timeDeltas } = profile;
        const sourceLocations = ensureSourceLocations(profile);
        const locations = sourceLocations.map((l, id) => {
            const src = l.locations[0]; //getBestLocation(profile, l.locations);
            return {
                id,
                selfTime: 0,
                aggregateTime: 0,
                ticks: 0,
                // category: categorize(l.callFrame, src),
                callFrame: l.callFrame,
                src,
            };
        });
        const idMap = new Map();
        const mapId = (nodeId) => {
            let id = idMap.get(nodeId);
            if (id === undefined) {
                id = idMap.size;
                idMap.set(nodeId, id);
            }
            return id;
        };
        // 1. Created a sorted list of nodes. It seems that the profile always has
        // incrementing IDs, although they are just not initially sorted.
        const nodes = new Array(profile.nodes.length);
        for (let i = 0; i < profile.nodes.length; i++) {
            const node = profile.nodes[i];
            // make them 0-based:
            const id = mapId(node.id);
            nodes[id] = {
                id,
                selfTime: 0,
                aggregateTime: 0,
                locationId: node.locationId,
                children: node.children?.map(mapId) || [],
            };
            for (const child of node.positionTicks || []) {
                if (child.startLocationId) {
                    locations[child.startLocationId].ticks += child.ticks;
                }
            }
        }
        for (const node of nodes) {
            for (const child of node.children) {
                nodes[child].parent = node.id;
            }
        }
        // 2. The profile samples are the 'bottom-most' node, the currently running
        // code. Sum of these in the self time.
        const duration = profile.endTime - profile.startTime;
        let lastNodeTime = duration - timeDeltas[0];
        for (let i = 0; i < timeDeltas.length - 1; i++) {
            const d = timeDeltas[i + 1];
            nodes[mapId(samples[i])].selfTime += d;
            lastNodeTime -= d;
        }
        // Add in an extra time delta for the last sample. `timeDeltas[0]` is the
        // time before the first sample, and the time of the last sample is only
        // derived (approximately) by the missing time in the sum of deltas. Save
        // some work by calculating it here.
        if (nodes.length) {
            nodes[mapId(samples[timeDeltas.length - 1])].selfTime += lastNodeTime;
            timeDeltas.push(lastNodeTime);
        }
        // 3. Add the aggregate times for all node children and locations
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const location = locations[node.locationId];
            location.aggregateTime += computeAggregateTime(i, nodes);
            location.selfTime += node.selfTime;
        }
        return {
            nodes,
            locations,
            samples: samples.map(mapId),
            timeDeltas,
            // rootPath: profile.$vscode?.rootPath,
            duration,
        };
    };
    exports.buildModel = buildModel;
    class BottomUpNode {
        static root() {
            return new BottomUpNode({
                id: -1,
                selfTime: 0,
                aggregateTime: 0,
                ticks: 0,
                callFrame: {
                    functionName: '(root)',
                    lineNumber: -1,
                    columnNumber: -1,
                    scriptId: '0',
                    url: '',
                },
            });
        }
        get id() {
            return this.location.id;
        }
        get callFrame() {
            return this.location.callFrame;
        }
        get src() {
            return this.location.src;
        }
        constructor(location, parent) {
            this.location = location;
            this.parent = parent;
            this.children = {};
            this.aggregateTime = 0;
            this.selfTime = 0;
            this.ticks = 0;
            this.childrenSize = 0;
        }
        addNode(node) {
            this.selfTime += node.selfTime;
            this.aggregateTime += node.aggregateTime;
        }
    }
    exports.BottomUpNode = BottomUpNode;
    const processNode = (aggregate, node, model, initialNode = node) => {
        let child = aggregate.children[node.locationId];
        if (!child) {
            child = new BottomUpNode(model.locations[node.locationId], aggregate);
            aggregate.childrenSize++;
            aggregate.children[node.locationId] = child;
        }
        child.addNode(initialNode);
        if (node.parent) {
            (0, exports.processNode)(child, model.nodes[node.parent], model, initialNode);
        }
    };
    exports.processNode = processNode;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsaW5nTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Byb2ZpbGluZy9jb21tb24vcHJvZmlsaW5nTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNkVoRzs7O09BR0c7SUFDSCxNQUFNLG9CQUFvQixHQUFHLENBQUMsS0FBYSxFQUFFLEtBQXNCLEVBQVUsRUFBRTtRQUM5RSxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsSUFBSSxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDdkIsT0FBTyxHQUFHLENBQUMsYUFBYSxDQUFDO1FBQzFCLENBQUM7UUFFRCxJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQ3pCLEtBQUssTUFBTSxLQUFLLElBQUksR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xDLEtBQUssSUFBSSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxDQUFDO0lBQ3BDLENBQUMsQ0FBQztJQUVGLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxPQUF1QixFQUFzQyxFQUFFO1FBRTdGLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUE4RSxDQUFDO1FBRTdHLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxTQUF1QixFQUFFLEVBQUU7WUFDcEQsTUFBTSxHQUFHLEdBQUc7Z0JBQ1gsU0FBUyxDQUFDLFlBQVk7Z0JBQ3RCLFNBQVMsQ0FBQyxHQUFHO2dCQUNiLFNBQVMsQ0FBQyxRQUFRO2dCQUNsQixTQUFTLENBQUMsVUFBVTtnQkFDcEIsU0FBUyxDQUFDLFlBQVk7YUFDdEIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFWixNQUFNLFFBQVEsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3pDLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2QsT0FBTyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQ3BCLENBQUM7WUFDRCxNQUFNLEVBQUUsR0FBRyxpQkFBaUIsRUFBRSxDQUFDO1lBQy9CLGNBQWMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO2dCQUN2QixFQUFFO2dCQUNGLFNBQVM7Z0JBQ1QsUUFBUSxFQUFFO29CQUNULFVBQVUsRUFBRSxTQUFTLENBQUMsVUFBVSxHQUFHLENBQUM7b0JBQ3BDLFlBQVksRUFBRSxTQUFTLENBQUMsWUFBWSxHQUFHLENBQUM7b0JBQ3hDLFlBQVk7b0JBQ1osNENBQTRDO29CQUM1Qyw0Q0FBNEM7b0JBQzVDLHVCQUF1QjtvQkFDdkIsS0FBSztpQkFDTDthQUNELENBQUMsQ0FBQztZQUVILE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQyxDQUFDO1FBRUYsS0FBSyxNQUFNLElBQUksSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3JELEdBQUcsSUFBSTtnQkFDUCx5RUFBeUU7Z0JBQ3pFLDBFQUEwRTtnQkFDMUUsMEJBQTBCO2dCQUMxQixlQUFlLEVBQUUsZ0JBQWdCLENBQUM7b0JBQ2pDLEdBQUcsSUFBSSxDQUFDLFNBQVM7b0JBQ2pCLFVBQVUsRUFBRSxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUM7b0JBQ3pCLFlBQVksRUFBRSxDQUFDO2lCQUNmLENBQUM7Z0JBQ0YsYUFBYSxFQUFFLGdCQUFnQixDQUFDO29CQUMvQixHQUFHLElBQUksQ0FBQyxTQUFTO29CQUNqQixVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUk7b0JBQ3JCLFlBQVksRUFBRSxDQUFDO2lCQUNmLENBQUM7YUFDRixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxPQUFPLENBQUMsR0FBRyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUM7YUFDakMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO2FBQzNCLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbkUsQ0FBQyxDQUFDO0lBRUY7O09BRUc7SUFDSSxNQUFNLFVBQVUsR0FBRyxDQUFDLE9BQXVCLEVBQWlCLEVBQUU7UUFDcEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDN0MsT0FBTztnQkFDTixLQUFLLEVBQUUsRUFBRTtnQkFDVCxTQUFTLEVBQUUsRUFBRTtnQkFDYixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFO2dCQUM5QixVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVUsSUFBSSxFQUFFO2dCQUNwQyx1Q0FBdUM7Z0JBQ3ZDLFFBQVEsRUFBRSxPQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTO2FBQzdDLENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsR0FBRyxPQUFPLENBQUM7UUFDeEMsTUFBTSxlQUFlLEdBQUcscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkQsTUFBTSxTQUFTLEdBQWdCLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDNUQsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLHdDQUF3QztZQUVwRSxPQUFPO2dCQUNOLEVBQUU7Z0JBQ0YsUUFBUSxFQUFFLENBQUM7Z0JBQ1gsYUFBYSxFQUFFLENBQUM7Z0JBQ2hCLEtBQUssRUFBRSxDQUFDO2dCQUNSLDBDQUEwQztnQkFDMUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxTQUFTO2dCQUN0QixHQUFHO2FBQ0gsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQTRELENBQUM7UUFDbEYsTUFBTSxLQUFLLEdBQUcsQ0FBQyxNQUFjLEVBQUUsRUFBRTtZQUNoQyxJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNCLElBQUksRUFBRSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUN0QixFQUFFLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztnQkFDaEIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdkIsQ0FBQztZQUVELE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQyxDQUFDO1FBRUYsMEVBQTBFO1FBQzFFLGlFQUFpRTtRQUNqRSxNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBZ0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUMvQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTlCLHFCQUFxQjtZQUNyQixNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFCLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRztnQkFDWCxFQUFFO2dCQUNGLFFBQVEsRUFBRSxDQUFDO2dCQUNYLGFBQWEsRUFBRSxDQUFDO2dCQUNoQixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQW9CO2dCQUNyQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRTthQUN6QyxDQUFDO1lBRUYsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDM0IsU0FBUyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQztnQkFDdkQsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUMxQixLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQy9CLENBQUM7UUFDRixDQUFDO1FBRUQsMkVBQTJFO1FBQzNFLHVDQUF1QztRQUN2QyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7UUFDckQsSUFBSSxZQUFZLEdBQUcsUUFBUSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNoRCxNQUFNLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzVCLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLFlBQVksSUFBSSxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUVELHlFQUF5RTtRQUN6RSx3RUFBd0U7UUFDeEUseUVBQXlFO1FBQ3pFLG9DQUFvQztRQUNwQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNsQixLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUksWUFBWSxDQUFDO1lBQ3RFLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELGlFQUFpRTtRQUNqRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3ZDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVDLFFBQVEsQ0FBQyxhQUFhLElBQUksb0JBQW9CLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3pELFFBQVEsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUNwQyxDQUFDO1FBRUQsT0FBTztZQUNOLEtBQUs7WUFDTCxTQUFTO1lBQ1QsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO1lBQzNCLFVBQVU7WUFDVix1Q0FBdUM7WUFDdkMsUUFBUTtTQUNSLENBQUM7SUFDSCxDQUFDLENBQUM7SUF2R1csUUFBQSxVQUFVLGNBdUdyQjtJQUVGLE1BQWEsWUFBWTtRQUNqQixNQUFNLENBQUMsSUFBSTtZQUNqQixPQUFPLElBQUksWUFBWSxDQUFDO2dCQUN2QixFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNOLFFBQVEsRUFBRSxDQUFDO2dCQUNYLGFBQWEsRUFBRSxDQUFDO2dCQUNoQixLQUFLLEVBQUUsQ0FBQztnQkFDUixTQUFTLEVBQUU7b0JBQ1YsWUFBWSxFQUFFLFFBQVE7b0JBQ3RCLFVBQVUsRUFBRSxDQUFDLENBQUM7b0JBQ2QsWUFBWSxFQUFFLENBQUMsQ0FBQztvQkFDaEIsUUFBUSxFQUFFLEdBQUc7b0JBQ2IsR0FBRyxFQUFFLEVBQUU7aUJBQ1A7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBUUQsSUFBVyxFQUFFO1lBQ1osT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBRUQsSUFBVyxTQUFTO1lBQ25CLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7UUFDaEMsQ0FBQztRQUVELElBQVcsR0FBRztZQUNiLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7UUFDMUIsQ0FBQztRQUVELFlBQTRCLFFBQW1CLEVBQWtCLE1BQXFCO1lBQTFELGFBQVEsR0FBUixRQUFRLENBQVc7WUFBa0IsV0FBTSxHQUFOLE1BQU0sQ0FBZTtZQWxCL0UsYUFBUSxHQUFtQyxFQUFFLENBQUM7WUFDOUMsa0JBQWEsR0FBRyxDQUFDLENBQUM7WUFDbEIsYUFBUSxHQUFHLENBQUMsQ0FBQztZQUNiLFVBQUssR0FBRyxDQUFDLENBQUM7WUFDVixpQkFBWSxHQUFHLENBQUMsQ0FBQztRQWNrRSxDQUFDO1FBRXBGLE9BQU8sQ0FBQyxJQUFtQjtZQUNqQyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDL0IsSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzFDLENBQUM7S0FFRDtJQTFDRCxvQ0EwQ0M7SUFFTSxNQUFNLFdBQVcsR0FBRyxDQUFDLFNBQXVCLEVBQUUsSUFBbUIsRUFBRSxLQUFvQixFQUFFLFdBQVcsR0FBRyxJQUFJLEVBQUUsRUFBRTtRQUNySCxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNoRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWixLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEUsU0FBUyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3pCLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUM3QyxDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUUzQixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNqQixJQUFBLG1CQUFXLEVBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNsRSxDQUFDO0lBQ0YsQ0FBQyxDQUFDO0lBYlcsUUFBQSxXQUFXLGVBYXRCIn0=