/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModelTokensChangedEvent = exports.ModelOptionsChangedEvent = exports.ModelContentChangedEvent = exports.ModelLanguageConfigurationChangedEvent = exports.ModelLanguageChangedEvent = exports.ModelDecorationsChangedEvent = exports.ReadOnlyEditAttemptEvent = exports.CursorStateChangedEvent = exports.HiddenAreasChangedEvent = exports.ViewZonesChangedEvent = exports.ScrollChangedEvent = exports.FocusChangedEvent = exports.ContentSizeChangedEvent = exports.OutgoingViewModelEventKind = exports.ViewModelEventsCollector = exports.ViewModelEventDispatcher = void 0;
    class ViewModelEventDispatcher extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onEvent = this._register(new event_1.Emitter());
            this.onEvent = this._onEvent.event;
            this._eventHandlers = [];
            this._viewEventQueue = null;
            this._isConsumingViewEventQueue = false;
            this._collector = null;
            this._collectorCnt = 0;
            this._outgoingEvents = [];
        }
        emitOutgoingEvent(e) {
            this._addOutgoingEvent(e);
            this._emitOutgoingEvents();
        }
        _addOutgoingEvent(e) {
            for (let i = 0, len = this._outgoingEvents.length; i < len; i++) {
                const mergeResult = (this._outgoingEvents[i].kind === e.kind ? this._outgoingEvents[i].attemptToMerge(e) : null);
                if (mergeResult) {
                    this._outgoingEvents[i] = mergeResult;
                    return;
                }
            }
            // not merged
            this._outgoingEvents.push(e);
        }
        _emitOutgoingEvents() {
            while (this._outgoingEvents.length > 0) {
                if (this._collector || this._isConsumingViewEventQueue) {
                    // right now collecting or emitting view events, so let's postpone emitting
                    return;
                }
                const event = this._outgoingEvents.shift();
                if (event.isNoOp()) {
                    continue;
                }
                this._onEvent.fire(event);
            }
        }
        addViewEventHandler(eventHandler) {
            for (let i = 0, len = this._eventHandlers.length; i < len; i++) {
                if (this._eventHandlers[i] === eventHandler) {
                    console.warn('Detected duplicate listener in ViewEventDispatcher', eventHandler);
                }
            }
            this._eventHandlers.push(eventHandler);
        }
        removeViewEventHandler(eventHandler) {
            for (let i = 0; i < this._eventHandlers.length; i++) {
                if (this._eventHandlers[i] === eventHandler) {
                    this._eventHandlers.splice(i, 1);
                    break;
                }
            }
        }
        beginEmitViewEvents() {
            this._collectorCnt++;
            if (this._collectorCnt === 1) {
                this._collector = new ViewModelEventsCollector();
            }
            return this._collector;
        }
        endEmitViewEvents() {
            this._collectorCnt--;
            if (this._collectorCnt === 0) {
                const outgoingEvents = this._collector.outgoingEvents;
                const viewEvents = this._collector.viewEvents;
                this._collector = null;
                for (const outgoingEvent of outgoingEvents) {
                    this._addOutgoingEvent(outgoingEvent);
                }
                if (viewEvents.length > 0) {
                    this._emitMany(viewEvents);
                }
            }
            this._emitOutgoingEvents();
        }
        emitSingleViewEvent(event) {
            try {
                const eventsCollector = this.beginEmitViewEvents();
                eventsCollector.emitViewEvent(event);
            }
            finally {
                this.endEmitViewEvents();
            }
        }
        _emitMany(events) {
            if (this._viewEventQueue) {
                this._viewEventQueue = this._viewEventQueue.concat(events);
            }
            else {
                this._viewEventQueue = events;
            }
            if (!this._isConsumingViewEventQueue) {
                this._consumeViewEventQueue();
            }
        }
        _consumeViewEventQueue() {
            try {
                this._isConsumingViewEventQueue = true;
                this._doConsumeQueue();
            }
            finally {
                this._isConsumingViewEventQueue = false;
            }
        }
        _doConsumeQueue() {
            while (this._viewEventQueue) {
                // Empty event queue, as events might come in while sending these off
                const events = this._viewEventQueue;
                this._viewEventQueue = null;
                // Use a clone of the event handlers list, as they might remove themselves
                const eventHandlers = this._eventHandlers.slice(0);
                for (const eventHandler of eventHandlers) {
                    eventHandler.handleEvents(events);
                }
            }
        }
    }
    exports.ViewModelEventDispatcher = ViewModelEventDispatcher;
    class ViewModelEventsCollector {
        constructor() {
            this.viewEvents = [];
            this.outgoingEvents = [];
        }
        emitViewEvent(event) {
            this.viewEvents.push(event);
        }
        emitOutgoingEvent(e) {
            this.outgoingEvents.push(e);
        }
    }
    exports.ViewModelEventsCollector = ViewModelEventsCollector;
    var OutgoingViewModelEventKind;
    (function (OutgoingViewModelEventKind) {
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ContentSizeChanged"] = 0] = "ContentSizeChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["FocusChanged"] = 1] = "FocusChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ScrollChanged"] = 2] = "ScrollChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ViewZonesChanged"] = 3] = "ViewZonesChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["HiddenAreasChanged"] = 4] = "HiddenAreasChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ReadOnlyEditAttempt"] = 5] = "ReadOnlyEditAttempt";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["CursorStateChanged"] = 6] = "CursorStateChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ModelDecorationsChanged"] = 7] = "ModelDecorationsChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ModelLanguageChanged"] = 8] = "ModelLanguageChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ModelLanguageConfigurationChanged"] = 9] = "ModelLanguageConfigurationChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ModelContentChanged"] = 10] = "ModelContentChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ModelOptionsChanged"] = 11] = "ModelOptionsChanged";
        OutgoingViewModelEventKind[OutgoingViewModelEventKind["ModelTokensChanged"] = 12] = "ModelTokensChanged";
    })(OutgoingViewModelEventKind || (exports.OutgoingViewModelEventKind = OutgoingViewModelEventKind = {}));
    class ContentSizeChangedEvent {
        constructor(oldContentWidth, oldContentHeight, contentWidth, contentHeight) {
            this.kind = 0 /* OutgoingViewModelEventKind.ContentSizeChanged */;
            this._oldContentWidth = oldContentWidth;
            this._oldContentHeight = oldContentHeight;
            this.contentWidth = contentWidth;
            this.contentHeight = contentHeight;
            this.contentWidthChanged = (this._oldContentWidth !== this.contentWidth);
            this.contentHeightChanged = (this._oldContentHeight !== this.contentHeight);
        }
        isNoOp() {
            return (!this.contentWidthChanged && !this.contentHeightChanged);
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return new ContentSizeChangedEvent(this._oldContentWidth, this._oldContentHeight, other.contentWidth, other.contentHeight);
        }
    }
    exports.ContentSizeChangedEvent = ContentSizeChangedEvent;
    class FocusChangedEvent {
        constructor(oldHasFocus, hasFocus) {
            this.kind = 1 /* OutgoingViewModelEventKind.FocusChanged */;
            this.oldHasFocus = oldHasFocus;
            this.hasFocus = hasFocus;
        }
        isNoOp() {
            return (this.oldHasFocus === this.hasFocus);
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return new FocusChangedEvent(this.oldHasFocus, other.hasFocus);
        }
    }
    exports.FocusChangedEvent = FocusChangedEvent;
    class ScrollChangedEvent {
        constructor(oldScrollWidth, oldScrollLeft, oldScrollHeight, oldScrollTop, scrollWidth, scrollLeft, scrollHeight, scrollTop) {
            this.kind = 2 /* OutgoingViewModelEventKind.ScrollChanged */;
            this._oldScrollWidth = oldScrollWidth;
            this._oldScrollLeft = oldScrollLeft;
            this._oldScrollHeight = oldScrollHeight;
            this._oldScrollTop = oldScrollTop;
            this.scrollWidth = scrollWidth;
            this.scrollLeft = scrollLeft;
            this.scrollHeight = scrollHeight;
            this.scrollTop = scrollTop;
            this.scrollWidthChanged = (this._oldScrollWidth !== this.scrollWidth);
            this.scrollLeftChanged = (this._oldScrollLeft !== this.scrollLeft);
            this.scrollHeightChanged = (this._oldScrollHeight !== this.scrollHeight);
            this.scrollTopChanged = (this._oldScrollTop !== this.scrollTop);
        }
        isNoOp() {
            return (!this.scrollWidthChanged && !this.scrollLeftChanged && !this.scrollHeightChanged && !this.scrollTopChanged);
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return new ScrollChangedEvent(this._oldScrollWidth, this._oldScrollLeft, this._oldScrollHeight, this._oldScrollTop, other.scrollWidth, other.scrollLeft, other.scrollHeight, other.scrollTop);
        }
    }
    exports.ScrollChangedEvent = ScrollChangedEvent;
    class ViewZonesChangedEvent {
        constructor() {
            this.kind = 3 /* OutgoingViewModelEventKind.ViewZonesChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return this;
        }
    }
    exports.ViewZonesChangedEvent = ViewZonesChangedEvent;
    class HiddenAreasChangedEvent {
        constructor() {
            this.kind = 4 /* OutgoingViewModelEventKind.HiddenAreasChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return this;
        }
    }
    exports.HiddenAreasChangedEvent = HiddenAreasChangedEvent;
    class CursorStateChangedEvent {
        constructor(oldSelections, selections, oldModelVersionId, modelVersionId, source, reason, reachedMaxCursorCount) {
            this.kind = 6 /* OutgoingViewModelEventKind.CursorStateChanged */;
            this.oldSelections = oldSelections;
            this.selections = selections;
            this.oldModelVersionId = oldModelVersionId;
            this.modelVersionId = modelVersionId;
            this.source = source;
            this.reason = reason;
            this.reachedMaxCursorCount = reachedMaxCursorCount;
        }
        static _selectionsAreEqual(a, b) {
            if (!a && !b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            const aLen = a.length;
            const bLen = b.length;
            if (aLen !== bLen) {
                return false;
            }
            for (let i = 0; i < aLen; i++) {
                if (!a[i].equalsSelection(b[i])) {
                    return false;
                }
            }
            return true;
        }
        isNoOp() {
            return (CursorStateChangedEvent._selectionsAreEqual(this.oldSelections, this.selections)
                && this.oldModelVersionId === this.modelVersionId);
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return new CursorStateChangedEvent(this.oldSelections, other.selections, this.oldModelVersionId, other.modelVersionId, other.source, other.reason, this.reachedMaxCursorCount || other.reachedMaxCursorCount);
        }
    }
    exports.CursorStateChangedEvent = CursorStateChangedEvent;
    class ReadOnlyEditAttemptEvent {
        constructor() {
            this.kind = 5 /* OutgoingViewModelEventKind.ReadOnlyEditAttempt */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            if (other.kind !== this.kind) {
                return null;
            }
            return this;
        }
    }
    exports.ReadOnlyEditAttemptEvent = ReadOnlyEditAttemptEvent;
    class ModelDecorationsChangedEvent {
        constructor(event) {
            this.event = event;
            this.kind = 7 /* OutgoingViewModelEventKind.ModelDecorationsChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            return null;
        }
    }
    exports.ModelDecorationsChangedEvent = ModelDecorationsChangedEvent;
    class ModelLanguageChangedEvent {
        constructor(event) {
            this.event = event;
            this.kind = 8 /* OutgoingViewModelEventKind.ModelLanguageChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            return null;
        }
    }
    exports.ModelLanguageChangedEvent = ModelLanguageChangedEvent;
    class ModelLanguageConfigurationChangedEvent {
        constructor(event) {
            this.event = event;
            this.kind = 9 /* OutgoingViewModelEventKind.ModelLanguageConfigurationChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            return null;
        }
    }
    exports.ModelLanguageConfigurationChangedEvent = ModelLanguageConfigurationChangedEvent;
    class ModelContentChangedEvent {
        constructor(event) {
            this.event = event;
            this.kind = 10 /* OutgoingViewModelEventKind.ModelContentChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            return null;
        }
    }
    exports.ModelContentChangedEvent = ModelContentChangedEvent;
    class ModelOptionsChangedEvent {
        constructor(event) {
            this.event = event;
            this.kind = 11 /* OutgoingViewModelEventKind.ModelOptionsChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            return null;
        }
    }
    exports.ModelOptionsChangedEvent = ModelOptionsChangedEvent;
    class ModelTokensChangedEvent {
        constructor(event) {
            this.event = event;
            this.kind = 12 /* OutgoingViewModelEventKind.ModelTokensChanged */;
        }
        isNoOp() {
            return false;
        }
        attemptToMerge(other) {
            return null;
        }
    }
    exports.ModelTokensChangedEvent = ModelTokensChangedEvent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsRXZlbnREaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3ZpZXdNb2RlbEV2ZW50RGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSx3QkFBeUIsU0FBUSxzQkFBVTtRQVl2RDtZQUNDLEtBQUssRUFBRSxDQUFDO1lBWFEsYUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTBCLENBQUMsQ0FBQztZQUNsRSxZQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFXN0MsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLDBCQUEwQixHQUFHLEtBQUssQ0FBQztZQUN4QyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQztZQUN2QixJQUFJLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRU0saUJBQWlCLENBQUMsQ0FBeUI7WUFDakQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQzVCLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxDQUF5QjtZQUNsRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNqRSxNQUFNLFdBQVcsR0FBRyxDQUFDLElBQUksQ0FBQyxl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