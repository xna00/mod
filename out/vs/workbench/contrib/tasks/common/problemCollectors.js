/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/platform/markers/common/markers", "vs/base/common/uuid", "vs/base/common/platform"], function (require, exports, uri_1, event_1, lifecycle_1, problemMatcher_1, markers_1, uuid_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WatchingProblemCollector = exports.StartStopProblemCollector = exports.ProblemHandlingStrategy = exports.AbstractProblemCollector = exports.ProblemCollectorEventKind = void 0;
    var ProblemCollectorEventKind;
    (function (ProblemCollectorEventKind) {
        ProblemCollectorEventKind["BackgroundProcessingBegins"] = "backgroundProcessingBegins";
        ProblemCollectorEventKind["BackgroundProcessingEnds"] = "backgroundProcessingEnds";
    })(ProblemCollectorEventKind || (exports.ProblemCollectorEventKind = ProblemCollectorEventKind = {}));
    var IProblemCollectorEvent;
    (function (IProblemCollectorEvent) {
        function create(kind) {
            return Object.freeze({ kind });
        }
        IProblemCollectorEvent.create = create;
    })(IProblemCollectorEvent || (IProblemCollectorEvent = {}));
    class AbstractProblemCollector extends lifecycle_1.Disposable {
        constructor(problemMatchers, markerService, modelService, fileService) {
            super();
            this.problemMatchers = problemMatchers;
            this.markerService = markerService;
            this.modelService = modelService;
            this.modelListeners = new lifecycle_1.DisposableStore();
            this._onDidFindFirstMatch = new event_1.Emitter();
            this.onDidFindFirstMatch = this._onDidFindFirstMatch.event;
            this._onDidFindErrors = new event_1.Emitter();
            this.onDidFindErrors = this._onDidFindErrors.event;
            this._onDidRequestInvalidateLastMarker = new event_1.Emitter();
            this.onDidRequestInvalidateLastMarker = this._onDidRequestInvalidateLastMarker.event;
            this.matchers = Object.create(null);
            this.bufferLength = 1;
            problemMatchers.map(elem => (0, problemMatcher_1.createLineMatcher)(elem, fileService)).forEach((matcher) => {
                const length = matcher.matchLength;
                if (length > this.bufferLength) {
                    this.bufferLength = length;
                }
                let value = this.matchers[length];
                if (!value) {
                    value = [];
                    this.matchers[length] = value;
                }
                value.push(matcher);
            });
            this.buffer = [];
            this.activeMatcher = null;
            this._numberOfMatches = 0;
            this._maxMarkerSeverity = undefined;
            this.openModels = Object.create(null);
            this.applyToByOwner = new Map();
            for (const problemMatcher of problemMatchers) {
                const current = this.applyToByOwner.get(problemMatcher.owner);
                if (current === undefined) {
                    this.applyToByOwner.set(problemMatcher.owner, problemMatcher.applyTo);
                }
                else {
                    this.applyToByOwner.set(problemMatcher.owner, this.mergeApplyTo(current, problemMatcher.applyTo));
                }
            }
            this.resourcesToClean = new Map();
            this.markers = new Map();
            this.deliveredMarkers = new Map();
            this._register(this.modelService.onModelAdded((model) => {
                this.openModels[model.uri.toString()] = true;
            }, this, this.modelListeners));
            this._register(this.modelService.onModelRemoved((model) => {
                delete this.openModels[model.uri.toString()];
            }, this, this.modelListeners));
            this.modelService.getModels().forEach(model => this.openModels[model.uri.toString()] = true);
            this._onDidStateChange = new event_1.Emitter();
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        processLine(line) {
            if (this.tail) {
                const oldTail = this.tail;
                this.tail = oldTail.then(() => {
                    return this.processLineInternal(line);
                });
            }
            else {
                this.tail = this.processLineInternal(line);
            }
        }
        dispose() {
            super.dispose();
            this.modelListeners.dispose();
        }
        get numberOfMatches() {
            return this._numberOfMatches;
        }
        get maxMarkerSeverity() {
            return this._maxMarkerSeverity;
        }
        tryFindMarker(line) {
            let result = null;
            if (this.activeMatcher) {
                result = this.activeMatcher.next(line);
                if (result) {
                    this.captureMatch(result);
                    return result;
                }
                this.clearBuffer();
                this.activeMatcher = null;
            }
            if (this.buffer.length < this.bufferLength) {
                this.buffer.push(line);
            }
            else {
                const end = this.buffer.length - 1;
                for (let i = 0; i < end; i++) {
                    this.buffer[i] = this.buffer[i + 1];
                }
                this.buffer[end] = line;
            }
            result = this.tryMatchers();
            if (result) {
                this.clearBuffer();
            }
            return result;
        }
        async shouldApplyMatch(result) {
            switch (result.description.applyTo) {
                case problemMatcher_1.ApplyToKind.allDocuments:
                    return true;
                case problemMatcher_1.ApplyToKind.openDocuments:
                    return !!this.openModels[(await result.resource).toString()];
                case problemMatcher_1.ApplyToKind.closedDocuments:
                    return !this.openModels[(await result.resource).toString()];
                default:
                    return true;
            }
        }
        mergeApplyTo(current, value) {
            if (current === value || current === problemMatcher_1.ApplyToKind.allDocuments) {
                return current;
            }
            return problemMatcher_1.ApplyToKind.allDocuments;
        }
        tryMatchers() {
            this.activeMatcher = null;
            const length = this.buffer.length;
            for (let startIndex = 0; startIndex < length; startIndex++) {
                const candidates = this.matchers[length - startIndex];
                if (!candidates) {
                    continue;
                }
                for (const matcher of candidates) {
                    const result = matcher.handle(this.buffer, startIndex);
                    if (result.match) {
                        this.captureMatch(result.match);
                        if (result.continue) {
                            this.activeMatcher = matcher;
                        }
                        return result.match;
                    }
                }
            }
            return null;
        }
        captureMatch(match) {
            this._numberOfMatches++;
            if (this._maxMarkerSeverity === undefined || match.marker.severity > this._maxMarkerSeverity) {
                this._maxMarkerSeverity = match.marker.severity;
            }
        }
        clearBuffer() {
            if (this.buffer.length > 0) {
                this.buffer = [];
            }
        }
        recordResourcesToClean(owner) {
            const resourceSetToClean = this.getResourceSetToClean(owner);
            this.markerService.read({ owner: owner }).forEach(marker => resourceSetToClean.set(marker.resource.toString(), marker.resource));
        }
        recordResourceToClean(owner, resource) {
            this.getResourceSetToClean(owner).set(resource.toString(), resource);
        }
        removeResourceToClean(owner, resource) {
            const resourceSet = this.resourcesToClean.get(owner);
            resourceSet?.delete(resource);
        }
        getResourceSetToClean(owner) {
            let result = this.resourcesToClean.get(owner);
            if (!result) {
                result = new Map();
                this.resourcesToClean.set(owner, result);
            }
            return result;
        }
        cleanAllMarkers() {
            this.resourcesToClean.forEach((value, owner) => {
                this._cleanMarkers(owner, value);
            });
            this.resourcesToClean = new Map();
        }
        cleanMarkers(owner) {
            const toClean = this.resourcesToClean.get(owner);
            if (toClean) {
                this._cleanMarkers(owner, toClean);
                this.resourcesToClean.delete(owner);
            }
        }
        _cleanMarkers(owner, toClean) {
            const uris = [];
            const applyTo = this.applyToByOwner.get(owner);
            toClean.forEach((uri, uriAsString) => {
                if (applyTo === problemMatcher_1.ApplyToKind.allDocuments ||
                    (applyTo === problemMatcher_1.ApplyToKind.openDocuments && this.openModels[uriAsString]) ||
                    (applyTo === problemMatcher_1.ApplyToKind.closedDocuments && !this.openModels[uriAsString])) {
                    uris.push(uri);
                }
            });
            this.markerService.remove(owner, uris);
        }
        recordMarker(marker, owner, resourceAsString) {
            let markersPerOwner = this.markers.get(owner);
            if (!markersPerOwner) {
                markersPerOwner = new Map();
                this.markers.set(owner, markersPerOwner);
            }
            let markersPerResource = markersPerOwner.get(resourceAsString);
            if (!markersPerResource) {
                markersPerResource = new Map();
                markersPerOwner.set(resourceAsString, markersPerResource);
            }
            const key = markers_1.IMarkerData.makeKeyOptionalMessage(marker, false);
            let existingMarker;
            if (!markersPerResource.has(key)) {
                markersPerResource.set(key, marker);
            }
            else if (((existingMarker = markersPerResource.get(key)) !== undefined) && (existingMarker.message.length < marker.message.length) && platform_1.isWindows) {
                // Most likely https://github.com/microsoft/vscode/issues/77475
                // Heuristic dictates that when the key is the same and message is smaller, we have hit this limitation.
                markersPerResource.set(key, marker);
            }
        }
        reportMarkers() {
            this.markers.forEach((markersPerOwner, owner) => {
                const deliveredMarkersPerOwner = this.getDeliveredMarkersPerOwner(owner);
                markersPerOwner.forEach((markers, resource) => {
                    this.deliverMarkersPerOwnerAndResourceResolved(owner, resource, markers, deliveredMarkersPerOwner);
                });
            });
        }
        deliverMarkersPerOwnerAndResource(owner, resource) {
            const markersPerOwner = this.markers.get(owner);
            if (!markersPerOwner) {
                return;
            }
            const deliveredMarkersPerOwner = this.getDeliveredMarkersPerOwner(owner);
            const markersPerResource = markersPerOwner.get(resource);
            if (!markersPerResource) {
                return;
            }
            this.deliverMarkersPerOwnerAndResourceResolved(owner, resource, markersPerResource, deliveredMarkersPerOwner);
        }
        deliverMarkersPerOwnerAndResourceResolved(owner, resource, markers, reported) {
            if (markers.size !== reported.get(resource)) {
                const toSet = [];
                markers.forEach(value => toSet.push(value));
                this.markerService.changeOne(owner, uri_1.URI.parse(resource), toSet);
                reported.set(resource, markers.size);
            }
        }
        getDeliveredMarkersPerOwner(owner) {
            let result = this.deliveredMarkers.get(owner);
            if (!result) {
                result = new Map();
                this.deliveredMarkers.set(owner, result);
            }
            return result;
        }
        cleanMarkerCaches() {
            this._numberOfMatches = 0;
            this._maxMarkerSeverity = undefined;
            this.markers.clear();
            this.deliveredMarkers.clear();
        }
        done() {
            this.reportMarkers();
            this.cleanAllMarkers();
        }
    }
    exports.AbstractProblemCollector = AbstractProblemCollector;
    var ProblemHandlingStrategy;
    (function (ProblemHandlingStrategy) {
        ProblemHandlingStrategy[ProblemHandlingStrategy["Clean"] = 0] = "Clean";
    })(ProblemHandlingStrategy || (exports.ProblemHandlingStrategy = ProblemHandlingStrategy = {}));
    class StartStopProblemCollector extends AbstractProblemCollector {
        constructor(problemMatchers, markerService, modelService, _strategy = 0 /* ProblemHandlingStrategy.Clean */, fileService) {
            super(problemMatchers, markerService, modelService, fileService);
            const ownerSet = Object.create(null);
            problemMatchers.forEach(description => ownerSet[description.owner] = true);
            this.owners = Object.keys(ownerSet);
            this.owners.forEach((owner) => {
                this.recordResourcesToClean(owner);
            });
        }
        async processLineInternal(line) {
            const markerMatch = this.tryFindMarker(line);
            if (!markerMatch) {
                return;
            }
            const owner = markerMatch.description.owner;
            const resource = await markerMatch.resource;
            const resourceAsString = resource.toString();
            this.removeResourceToClean(owner, resourceAsString);
            const shouldApplyMatch = await this.shouldApplyMatch(markerMatch);
            if (shouldApplyMatch) {
                this.recordMarker(markerMatch.marker, owner, resourceAsString);
                if (this.currentOwner !== owner || this.currentResource !== resourceAsString) {
                    if (this.currentOwner && this.currentResource) {
                        this.deliverMarkersPerOwnerAndResource(this.currentOwner, this.currentResource);
                    }
                    this.currentOwner = owner;
                    this.currentResource = resourceAsString;
                }
            }
        }
    }
    exports.StartStopProblemCollector = StartStopProblemCollector;
    class WatchingProblemCollector extends AbstractProblemCollector {
        constructor(problemMatchers, markerService, modelService, fileService) {
            super(problemMatchers, markerService, modelService, fileService);
            this.lines = [];
            this.beginPatterns = [];
            this.resetCurrentResource();
            this.backgroundPatterns = [];
            this._activeBackgroundMatchers = new Set();
            this.problemMatchers.forEach(matcher => {
                if (matcher.watching) {
                    const key = (0, uuid_1.generateUuid)();
                    this.backgroundPatterns.push({
                        key,
                        matcher: matcher,
                        begin: matcher.watching.beginsPattern,
                        end: matcher.watching.endsPattern
                    });
                    this.beginPatterns.push(matcher.watching.beginsPattern.regexp);
                }
            });
            this.modelListeners.add(this.modelService.onModelRemoved(modelEvent => {
                let markerChanged = event_1.Event.debounce(this.markerService.onMarkerChanged, (last, e) => {
                    return (last ?? []).concat(e);
                }, 500, false, true)(async (markerEvent) => {
                    markerChanged?.dispose();
                    markerChanged = undefined;
                    if (!markerEvent || !markerEvent.includes(modelEvent.uri) || (this.markerService.read({ resource: modelEvent.uri }).length !== 0)) {
                        return;
                    }
                    const oldLines = Array.from(this.lines);
                    for (const line of oldLines) {
                        await this.processLineInternal(line);
                    }
                });
                setTimeout(async () => {
                    // Calling dispose below can trigger the debounce event (via flushOnListenerRemove), so we
                    // have to unset markerChanged first to make sure the handler above doesn't dispose it again.
                    const _markerChanged = markerChanged;
                    markerChanged = undefined;
                    _markerChanged?.dispose();
                }, 600);
            }));
        }
        aboutToStart() {
            for (const background of this.backgroundPatterns) {
                if (background.matcher.watching && background.matcher.watching.activeOnStart) {
                    this._activeBackgroundMatchers.add(background.key);
                    this._onDidStateChange.fire(IProblemCollectorEvent.create("backgroundProcessingBegins" /* ProblemCollectorEventKind.BackgroundProcessingBegins */));
                    this.recordResourcesToClean(background.matcher.owner);
                }
            }
        }
        async processLineInternal(line) {
            if (await this.tryBegin(line) || this.tryFinish(line)) {
                return;
            }
            this.lines.push(line);
            const markerMatch = this.tryFindMarker(line);
            if (!markerMatch) {
                return;
            }
            const resource = await markerMatch.resource;
            const owner = markerMatch.description.owner;
            const resourceAsString = resource.toString();
            this.removeResourceToClean(owner, resourceAsString);
            const shouldApplyMatch = await this.shouldApplyMatch(markerMatch);
            if (shouldApplyMatch) {
                this.recordMarker(markerMatch.marker, owner, resourceAsString);
                if (this.currentOwner !== owner || this.currentResource !== resourceAsString) {
                    this.reportMarkersForCurrentResource();
                    this.currentOwner = owner;
                    this.currentResource = resourceAsString;
                }
            }
        }
        forceDelivery() {
            this.reportMarkersForCurrentResource();
        }
        async tryBegin(line) {
            let result = false;
            for (const background of this.backgroundPatterns) {
                const matches = background.begin.regexp.exec(line);
                if (matches) {
                    if (this._activeBackgroundMatchers.has(background.key)) {
                        continue;
                    }
                    this._activeBackgroundMatchers.add(background.key);
                    result = true;
                    this._onDidFindFirstMatch.fire();
                    this.lines = [];
                    this.lines.push(line);
                    this._onDidStateChange.fire(IProblemCollectorEvent.create("backgroundProcessingBegins" /* ProblemCollectorEventKind.BackgroundProcessingBegins */));
                    this.cleanMarkerCaches();
                    this.resetCurrentResource();
                    const owner = background.matcher.owner;
                    const file = matches[background.begin.file];
                    if (file) {
                        const resource = (0, problemMatcher_1.getResource)(file, background.matcher);
                        this.recordResourceToClean(owner, await resource);
                    }
                    else {
                        this.recordResourcesToClean(owner);
                    }
                }
            }
            return result;
        }
        tryFinish(line) {
            let result = false;
            for (const background of this.backgroundPatterns) {
                const matches = background.end.regexp.exec(line);
                if (matches) {
                    if (this._numberOfMatches > 0) {
                        this._onDidFindErrors.fire();
                    }
                    else {
                        this._onDidRequestInvalidateLastMarker.fire();
                    }
                    if (this._activeBackgroundMatchers.has(background.key)) {
                        this._activeBackgroundMatchers.delete(background.key);
                        this.resetCurrentResource();
                        this._onDidStateChange.fire(IProblemCollectorEvent.create("backgroundProcessingEnds" /* ProblemCollectorEventKind.BackgroundProcessingEnds */));
                        result = true;
                        this.lines.push(line);
                        const owner = background.matcher.owner;
                        this.cleanMarkers(owner);
                        this.cleanMarkerCaches();
                    }
                }
            }
            return result;
        }
        resetCurrentResource() {
            this.reportMarkersForCurrentResource();
            this.currentOwner = undefined;
            this.currentResource = undefined;
        }
        reportMarkersForCurrentResource() {
            if (this.currentOwner && this.currentResource) {
                this.deliverMarkersPerOwnerAndResource(this.currentOwner, this.currentResource);
            }
        }
        done() {
            [...this.applyToByOwner.keys()].forEach(owner => {
                this.recordResourcesToClean(owner);
            });
            super.done();
        }
        isWatching() {
            return this.backgroundPatterns.length > 0;
        }
    }
    exports.WatchingProblemCollector = WatchingProblemCollector;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvYmxlbUNvbGxlY3RvcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rhc2tzL2NvbW1vbi9wcm9ibGVtQ29sbGVjdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsSUFBa0IseUJBR2pCO0lBSEQsV0FBa0IseUJBQXlCO1FBQzFDLHNGQUF5RCxDQUFBO1FBQ3pELGtGQUFxRCxDQUFBO0lBQ3RELENBQUMsRUFIaUIseUJBQXlCLHlDQUF6Qix5QkFBeUIsUUFHMUM7SUFNRCxJQUFVLHNCQUFzQixDQUkvQjtJQUpELFdBQVUsc0JBQXNCO1FBQy9CLFNBQWdCLE1BQU0sQ0FBQyxJQUErQjtZQUNyRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFGZSw2QkFBTSxTQUVyQixDQUFBO0lBQ0YsQ0FBQyxFQUpTLHNCQUFzQixLQUF0QixzQkFBc0IsUUFJL0I7SUFNRCxNQUFzQix3QkFBeUIsU0FBUSxzQkFBVTtRQWdDaEUsWUFBNEIsZUFBaUMsRUFBWSxhQUE2QixFQUFZLFlBQTJCLEVBQUUsV0FBMEI7WUFDeEssS0FBSyxFQUFFLENBQUM7WUFEbUIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQVksa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQVksaUJBQVksR0FBWixZQUFZLENBQWU7WUF2QjFILG1CQUFjLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFjdkMseUJBQW9CLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUNyRCx3QkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBRTVDLHFCQUFnQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDakQsb0JBQWUs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