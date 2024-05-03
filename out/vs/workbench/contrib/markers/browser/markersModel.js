/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/editor/common/core/range", "vs/platform/markers/common/markers", "vs/base/common/arrays", "vs/base/common/map", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/strings", "vs/platform/markers/common/markerService"], function (require, exports, resources_1, range_1, markers_1, arrays_1, map_1, event_1, hash_1, strings_1, markerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkersModel = exports.RelatedInformation = exports.MarkerTableItem = exports.Marker = exports.ResourceMarkers = void 0;
    exports.compareMarkersByUri = compareMarkersByUri;
    function compareMarkersByUri(a, b) {
        return resources_1.extUri.compare(a.resource, b.resource);
    }
    function compareResourceMarkers(a, b) {
        const [firstMarkerOfA] = a.markers;
        const [firstMarkerOfB] = b.markers;
        let res = 0;
        if (firstMarkerOfA && firstMarkerOfB) {
            res = markers_1.MarkerSeverity.compare(firstMarkerOfA.marker.severity, firstMarkerOfB.marker.severity);
        }
        if (res === 0) {
            res = a.path.localeCompare(b.path) || a.name.localeCompare(b.name);
        }
        return res;
    }
    class ResourceMarkers {
        constructor(id, resource) {
            this.id = id;
            this.resource = resource;
            this._markersMap = new map_1.ResourceMap();
            this._total = 0;
            this.path = this.resource.fsPath;
            this.name = (0, resources_1.basename)(this.resource);
        }
        get markers() {
            if (!this._cachedMarkers) {
                this._cachedMarkers = (0, arrays_1.flatten)([...this._markersMap.values()]).sort(ResourceMarkers._compareMarkers);
            }
            return this._cachedMarkers;
        }
        has(uri) {
            return this._markersMap.has(uri);
        }
        set(uri, marker) {
            this.delete(uri);
            if ((0, arrays_1.isNonEmptyArray)(marker)) {
                this._markersMap.set(uri, marker);
                this._total += marker.length;
                this._cachedMarkers = undefined;
            }
        }
        delete(uri) {
            const array = this._markersMap.get(uri);
            if (array) {
                this._total -= array.length;
                this._cachedMarkers = undefined;
                this._markersMap.delete(uri);
            }
        }
        get total() {
            return this._total;
        }
        static _compareMarkers(a, b) {
            return markers_1.MarkerSeverity.compare(a.marker.severity, b.marker.severity)
                || resources_1.extUri.compare(a.resource, b.resource)
                || range_1.Range.compareRangesUsingStarts(a.marker, b.marker);
        }
    }
    exports.ResourceMarkers = ResourceMarkers;
    class Marker {
        get resource() { return this.marker.resource; }
        get range() { return this.marker; }
        get lines() {
            if (!this._lines) {
                this._lines = (0, strings_1.splitLines)(this.marker.message);
            }
            return this._lines;
        }
        constructor(id, marker, relatedInformation = []) {
            this.id = id;
            this.marker = marker;
            this.relatedInformation = relatedInformation;
        }
        toString() {
            return JSON.stringify({
                ...this.marker,
                resource: this.marker.resource.path,
                relatedInformation: this.relatedInformation.length ? this.relatedInformation.map(r => ({ ...r.raw, resource: r.raw.resource.path })) : undefined
            }, null, '\t');
        }
    }
    exports.Marker = Marker;
    class MarkerTableItem extends Marker {
        constructor(marker, sourceMatches, codeMatches, messageMatches, fileMatches, ownerMatches) {
            super(marker.id, marker.marker, marker.relatedInformation);
            this.sourceMatches = sourceMatches;
            this.codeMatches = codeMatches;
            this.messageMatches = messageMatches;
            this.fileMatches = fileMatches;
            this.ownerMatches = ownerMatches;
        }
    }
    exports.MarkerTableItem = MarkerTableItem;
    class RelatedInformation {
        constructor(id, marker, raw) {
            this.id = id;
            this.marker = marker;
            this.raw = raw;
        }
    }
    exports.RelatedInformation = RelatedInformation;
    class MarkersModel {
        get resourceMarkers() {
            if (!this.cachedSortedResources) {
                this.cachedSortedResources = [...this.resourcesByUri.values()].sort(compareResourceMarkers);
            }
            return this.cachedSortedResources;
        }
        constructor() {
            this.cachedSortedResources = undefined;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._total = 0;
            this.resourcesByUri = new Map();
        }
        reset() {
            const removed = new Set();
            for (const resourceMarker of this.resourcesByUri.values()) {
                removed.add(resourceMarker);
            }
            this.resourcesByUri.clear();
            this._total = 0;
            this._onDidChange.fire({ removed, added: new Set(), updated: new Set() });
        }
        get total() {
            return this._total;
        }
        getResourceMarkers(resource) {
            return this.resourcesByUri.get(resources_1.extUri.getComparisonKey(resource, true)) ?? null;
        }
        setResourceMarkers(resourcesMarkers) {
            const change = { added: new Set(), removed: new Set(), updated: new Set() };
            for (const [resource, rawMarkers] of resourcesMarkers) {
                if (markerService_1.unsupportedSchemas.has(resource.scheme)) {
                    continue;
                }
                const key = resources_1.extUri.getComparisonKey(resource, true);
                let resourceMarkers = this.resourcesByUri.get(key);
                if ((0, arrays_1.isNonEmptyArray)(rawMarkers)) {
                    // update, add
                    if (!resourceMarkers) {
                        const resourceMarkersId = this.id(resource.toString());
                        resourceMarkers = new ResourceMarkers(resourceMarkersId, resource.with({ fragment: null }));
                        this.resourcesByUri.set(key, resourceMarkers);
                        change.added.add(resourceMarkers);
                    }
                    else {
                        change.updated.add(resourceMarkers);
                    }
                    const markersCountByKey = new Map();
                    const markers = rawMarkers.map((rawMarker) => {
                        const key = markers_1.IMarkerData.makeKey(rawMarker);
                        const index = markersCountByKey.get(key) || 0;
                        markersCountByKey.set(key, index + 1);
                        const markerId = this.id(resourceMarkers.id, key, index, rawMarker.resource.toString());
                        let relatedInformation = undefined;
                        if (rawMarker.relatedInformation) {
                            relatedInformation = rawMarker.relatedInformation.map((r, index) => new RelatedInformation(this.id(markerId, r.resource.toString(), r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn, index), rawMarker, r));
                        }
                        return new Marker(markerId, rawMarker, relatedInformation);
                    });
                    this._total -= resourceMarkers.total;
                    resourceMarkers.set(resource, markers);
                    this._total += resourceMarkers.total;
                }
                else if (resourceMarkers) {
                    // clear
                    this._total -= resourceMarkers.total;
                    resourceMarkers.delete(resource);
                    this._total += resourceMarkers.total;
                    if (resourceMarkers.total === 0) {
                        this.resourcesByUri.delete(key);
                        change.removed.add(resourceMarkers);
                    }
                    else {
                        change.updated.add(resourceMarkers);
                    }
                }
            }
            this.cachedSortedResources = undefined;
            if (change.added.size || change.removed.size || change.updated.size) {
                this._onDidChange.fire(change);
            }
        }
        id(...values) {
            const hasher = new hash_1.Hasher();
            for (const value of values) {
                hasher.hash(value);
            }
            return `${hasher.value}`;
        }
        dispose() {
            this._onDidChange.dispose();
            this.resourcesByUri.clear();
        }
    }
    exports.MarkersModel = MarkersModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vyc01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tYXJrZXJzL2Jyb3dzZXIvbWFya2Vyc01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdCaEcsa0RBRUM7SUFGRCxTQUFnQixtQkFBbUIsQ0FBQyxDQUFVLEVBQUUsQ0FBVTtRQUN6RCxPQUFPLGtCQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRCxTQUFTLHNCQUFzQixDQUFDLENBQWtCLEVBQUUsQ0FBa0I7UUFDckUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDbkMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDbkMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ1osSUFBSSxjQUFjLElBQUksY0FBYyxFQUFFLENBQUM7WUFDdEMsR0FBRyxHQUFHLHdCQUFjLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUNELElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ2YsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDO0lBQ1osQ0FBQztJQUdELE1BQWEsZUFBZTtRQVUzQixZQUFxQixFQUFVLEVBQVcsUUFBYTtZQUFsQyxPQUFFLEdBQUYsRUFBRSxDQUFRO1lBQVcsYUFBUSxHQUFSLFFBQVEsQ0FBSztZQUovQyxnQkFBVyxHQUFHLElBQUksaUJBQVcsRUFBWSxDQUFDO1lBRTFDLFdBQU0sR0FBVyxDQUFDLENBQUM7WUFHMUIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUNqQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUEsb0JBQVEsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBQSxnQkFBTyxFQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3JHLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDNUIsQ0FBQztRQUVELEdBQUcsQ0FBQyxHQUFRO1lBQ1gsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsR0FBRyxDQUFDLEdBQVEsRUFBRSxNQUFnQjtZQUM3QixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLElBQUksSUFBQSx3QkFBZSxFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUM3QixJQUFJLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQztZQUNqQyxDQUFDO1FBQ0YsQ0FBQztRQUVELE1BQU0sQ0FBQyxHQUFRO1lBQ2QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEMsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO2dCQUNoQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5QixDQUFDO1FBQ0YsQ0FBQztRQUVELElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRU8sTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFTLEVBQUUsQ0FBUztZQUNsRCxPQUFPLHdCQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO21CQUMvRCxrQkFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUM7bUJBQ3RDLGFBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN4RCxDQUFDO0tBQ0Q7SUFyREQsMENBcURDO0lBRUQsTUFBYSxNQUFNO1FBRWxCLElBQUksUUFBUSxLQUFVLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksS0FBSyxLQUFhLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFHM0MsSUFBSSxLQUFLO1lBQ1IsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFBLG9CQUFVLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvQyxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxZQUNVLEVBQVUsRUFDVixNQUFlLEVBQ2YscUJBQTJDLEVBQUU7WUFGN0MsT0FBRSxHQUFGLEVBQUUsQ0FBUTtZQUNWLFdBQU0sR0FBTixNQUFNLENBQVM7WUFDZix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQTJCO1FBQ25ELENBQUM7UUFFTCxRQUFRO1lBQ1AsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNyQixHQUFHLElBQUksQ0FBQyxNQUFNO2dCQUNkLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJO2dCQUNuQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2FBQ2hKLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hCLENBQUM7S0FDRDtJQTFCRCx3QkEwQkM7SUFFRCxNQUFhLGVBQWdCLFNBQVEsTUFBTTtRQUMxQyxZQUNDLE1BQWMsRUFDTCxhQUF3QixFQUN4QixXQUFzQixFQUN0QixjQUF5QixFQUN6QixXQUFzQixFQUN0QixZQUF1QjtZQUVoQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBTmxELGtCQUFhLEdBQWIsYUFBYSxDQUFXO1lBQ3hCLGdCQUFXLEdBQVgsV0FBVyxDQUFXO1lBQ3RCLG1CQUFjLEdBQWQsY0FBYyxDQUFXO1lBQ3pCLGdCQUFXLEdBQVgsV0FBVyxDQUFXO1lBQ3RCLGlCQUFZLEdBQVosWUFBWSxDQUFXO1FBR2pDLENBQUM7S0FDRDtJQVhELDBDQVdDO0lBRUQsTUFBYSxrQkFBa0I7UUFFOUIsWUFDVSxFQUFVLEVBQ1YsTUFBZSxFQUNmLEdBQXdCO1lBRnhCLE9BQUUsR0FBRixFQUFFLENBQVE7WUFDVixXQUFNLEdBQU4sTUFBTSxDQUFTO1lBQ2YsUUFBRyxHQUFILEdBQUcsQ0FBcUI7UUFDOUIsQ0FBQztLQUNMO0lBUEQsZ0RBT0M7SUFRRCxNQUFhLFlBQVk7UUFPeEIsSUFBSSxlQUFlO1lBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDN0YsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDO1FBQ25DLENBQUM7UUFJRDtZQWRRLDBCQUFxQixHQUFrQyxTQUFTLENBQUM7WUFFeEQsaUJBQVksR0FBRyxJQUFJLGVBQU8sRUFBc0IsQ0FBQztZQUN6RCxnQkFBVyxHQUE4QixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQXlCbEUsV0FBTSxHQUFXLENBQUMsQ0FBQztZQWIxQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1FBQzFELENBQUM7UUFFRCxLQUFLO1lBQ0osTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQW1CLENBQUM7WUFDM0MsS0FBSyxNQUFNLGNBQWMsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQzNELE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDN0IsQ0FBQztZQUNELElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDaEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksR0FBRyxFQUFtQixFQUFFLE9BQU8sRUFBRSxJQUFJLEdBQUcsRUFBbUIsRUFBRSxDQUFDLENBQUM7UUFDN0csQ0FBQztRQUdELElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRUQsa0JBQWtCLENBQUMsUUFBYTtZQUMvQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLGtCQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO1FBQ2pGLENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxnQkFBb0M7WUFDdEQsTUFBTSxNQUFNLEdBQXVCLEVBQUUsS0FBSyxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQztZQUNoRyxLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFFdkQsSUFBSSxrQ0FBa0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQzdDLFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCxNQUFNLEdBQUcsR0FBRyxrQkFBTSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBRW5ELElBQUksSUFBQSx3QkFBZSxFQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLGNBQWM7b0JBQ2QsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO3dCQUN0QixNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7d0JBQ3ZELGVBQWUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDNUYsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLGVBQWUsQ0FBQyxDQUFDO3dCQUM5QyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDbkMsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUNyQyxDQUFDO29CQUNELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7b0JBQ3BELE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRTt3QkFDNUMsTUFBTSxHQUFHLEdBQUcscUJBQVcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7d0JBQzNDLE1BQU0sS0FBSyxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQzlDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUV0QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLGVBQWdCLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO3dCQUV6RixJQUFJLGtCQUFrQixHQUFxQyxTQUFTLENBQUM7d0JBQ3JFLElBQUksU0FBUyxDQUFDLGtCQUFrQixFQUFFLENBQUM7NEJBQ2xDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDNU4sQ0FBQzt3QkFFRCxPQUFPLElBQUksTUFBTSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztvQkFDNUQsQ0FBQyxDQUFDLENBQUM7b0JBRUgsSUFBSSxDQUFDLE1BQU0sSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDO29CQUNyQyxlQUFlLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLE1BQU0sSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDO2dCQUV0QyxDQUFDO3FCQUFNLElBQUksZUFBZSxFQUFFLENBQUM7b0JBQzVCLFFBQVE7b0JBQ1IsSUFBSSxDQUFDLE1BQU0sSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDO29CQUNyQyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNqQyxJQUFJLENBQUMsTUFBTSxJQUFJLGVBQWUsQ0FBQyxLQUFLLENBQUM7b0JBQ3JDLElBQUksZUFBZSxDQUFDLEtBQUssS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDakMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2hDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUNyQyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ3JDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMscUJBQXFCLEdBQUcsU0FBUyxDQUFDO1lBQ3ZDLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDckUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEMsQ0FBQztRQUNGLENBQUM7UUFFTyxFQUFFLENBQUMsR0FBRyxNQUEyQjtZQUN4QyxNQUFNLE1BQU0sR0FBRyxJQUFJLGFBQU0sRUFBRSxDQUFDO1lBQzVCLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEIsQ0FBQztZQUNELE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDN0IsQ0FBQztLQUNEO0lBaEhELG9DQWdIQyJ9