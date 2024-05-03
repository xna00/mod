/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/cancellation", "vs/base/common/date", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/network", "vs/platform/label/common/label", "vs/base/common/strings", "vs/base/common/uri", "vs/base/browser/ui/iconLabel/iconLabel", "vs/workbench/browser/parts/views/viewPane", "vs/platform/list/browser/listService", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/timeline/common/timeline", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/editor", "vs/platform/commands/common/commands", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/common/views", "vs/platform/progress/common/progress", "vs/platform/opener/common/opener", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/telemetry/common/telemetry", "vs/base/browser/ui/actionbar/actionViewItems", "vs/platform/theme/common/theme", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/types", "vs/base/browser/markdownRenderer", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/extensions/common/extensions", "vs/platform/storage/common/storage", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./media/timelinePane"], function (require, exports, nls_1, DOM, actions_1, cancellation_1, date_1, decorators_1, event_1, filters_1, iterator_1, lifecycle_1, network_1, label_1, strings_1, uri_1, iconLabel_1, viewPane_1, listService_1, keybinding_1, contextView_1, contextkey_1, configuration_1, instantiation_1, timeline_1, editorService_1, editor_1, commands_1, themeService_1, themables_1, views_1, progress_1, opener_1, actionbar_1, menuEntryActionViewItem_1, actions_2, telemetry_1, actionViewItems_1, theme_1, codicons_1, iconRegistry_1, editorCommands_1, types_1, markdownRenderer_1, uriIdentity_1, extensions_1, storage_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimelineListVirtualDelegate = exports.TimelineKeyboardNavigationLabelProvider = exports.TimelineIdentityProvider = exports.TimelinePane = exports.TimelineExcludeSources = exports.TimelineFollowActiveEditorContext = void 0;
    const ItemHeight = 22;
    function isLoadMoreCommand(item) {
        return item instanceof LoadMoreCommand;
    }
    function isTimelineItem(item) {
        return !item?.handle.startsWith('vscode-command:') ?? false;
    }
    function updateRelativeTime(item, lastRelativeTime) {
        item.relativeTime = isTimelineItem(item) ? (0, date_1.fromNow)(item.timestamp) : undefined;
        item.relativeTimeFullWord = isTimelineItem(item) ? (0, date_1.fromNow)(item.timestamp, false, true) : undefined;
        if (lastRelativeTime === undefined || item.relativeTime !== lastRelativeTime) {
            lastRelativeTime = item.relativeTime;
            item.hideRelativeTime = false;
        }
        else {
            item.hideRelativeTime = true;
        }
        return lastRelativeTime;
    }
    class TimelineAggregate {
        constructor(timeline) {
            this._stale = false;
            this._requiresReset = false;
            this.source = timeline.source;
            this.items = timeline.items;
            this._cursor = timeline.paging?.cursor;
            this.lastRenderedIndex = -1;
        }
        get cursor() {
            return this._cursor;
        }
        get more() {
            return this._cursor !== undefined;
        }
        get newest() {
            return this.items[0];
        }
        get oldest() {
            return this.items[this.items.length - 1];
        }
        add(timeline, options) {
            let updated = false;
            if (timeline.items.length !== 0 && this.items.length !== 0) {
                updated = true;
                const ids = new Set();
                const timestamps = new Set();
                for (const item of timeline.items) {
                    if (item.id === undefined) {
                        timestamps.add(item.timestamp);
                    }
                    else {
                        ids.add(item.id);
                    }
                }
                // Remove any duplicate items
                let i = this.items.length;
                let item;
                while (i--) {
                    item = this.items[i];
                    if ((item.id !== undefined && ids.has(item.id)) || timestamps.has(item.timestamp)) {
                        this.items.splice(i, 1);
                    }
                }
                if ((timeline.items[timeline.items.length - 1]?.timestamp ?? 0) >= (this.newest?.timestamp ?? 0)) {
                    this.items.splice(0, 0, ...timeline.items);
                }
                else {
                    this.items.push(...timeline.items);
                }
            }
            else if (timeline.items.length !== 0) {
                updated = true;
                this.items.push(...timeline.items);
            }
            // If we are not requesting more recent items than we have, then update the cursor
            if (options.cursor !== undefined || typeof options.limit !== 'object') {
                this._cursor = timeline.paging?.cursor;
            }
            if (updated) {
                this.items.sort((a, b) => (b.timestamp - a.timestamp) ||
                    (a.source === undefined
                        ? b.source === undefined ? 0 : 1
                        : b.source === undefined ? -1 : b.source.localeCompare(a.source, undefined, { numeric: true, sensitivity: 'base' })));
            }
            return updated;
        }
        get stale() {
            return this._stale;
        }
        get requiresReset() {
            return this._requiresReset;
        }
        invalidate(requiresReset) {
            this._stale = true;
            this._requiresReset = requiresReset;
        }
    }
    class LoadMoreCommand {
        constructor(loading) {
            this.handle = 'vscode-command:loadMore';
            this.timestamp = 0;
            this.description = undefined;
            this.tooltip = undefined;
            this.contextValue = undefined;
            // Make things easier for duck typing
            this.id = undefined;
            this.icon = undefined;
            this.iconDark = undefined;
            this.source = undefined;
            this.relativeTime = undefined;
            this.relativeTimeFullWord = undefined;
            this.hideRelativeTime = undefined;
            this._loading = false;
            this._loading = loading;
        }
        get loading() {
            return this._loading;
        }
        set loading(value) {
            this._loading = value;
        }
        get ariaLabel() {
            return this.label;
        }
        get label() {
            return this.loading ? (0, nls_1.localize)('timeline.loadingMore', "Loading...") : (0, nls_1.localize)('timeline.loadMore', "Load more");
        }
        get themeIcon() {
            return undefined; //this.loading ? { id: 'sync~spin' } : undefined;
        }
    }
    exports.TimelineFollowActiveEditorContext = new contextkey_1.RawContextKey('timelineFollowActiveEditor', true, true);
    exports.TimelineExcludeSources = new contextkey_1.RawContextKey('timelineExcludeSources', '[]', true);
    let TimelinePane = class TimelinePane extends viewPane_1.ViewPane {
        static { this.TITLE = (0, nls_1.localize2)('timeline', "Timeline"); }
        constructor(options, keybindingService, contextMenuService, contextKeyService, configurationService, storageService, viewDescriptorService, instantiationService, editorService, commandService, progressService, timelineService, openerService, themeService, telemetryService, labelService, uriIdentityService, extensionService) {
            super({ ...options, titleMenuId: actions_2.MenuId.TimelineTitle }, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.storageService = storageService;
            this.editorService = editorService;
            this.commandService = commandService;
            this.progressService = progressService;
            this.timelineService = timelineService;
            this.labelService = labelService;
            this.uriIdentityService = uriIdentityService;
            this.extensionService = extensionService;
            this.pendingRequests = new Map();
            this.timelinesBySource = new Map();
            this._followActiveEditor = true;
            this._isEmpty = true;
            this._maxItemCount = 0;
            this._visibleItemCount = 0;
            this._pendingRefresh = false;
            this.commands = this._register(this.instantiationService.createInstance(TimelinePaneCommands, this));
            this.followActiveEditorContext = exports.TimelineFollowActiveEditorContext.bindTo(this.contextKeyService);
            this.timelineExcludeSourcesContext = exports.TimelineExcludeSources.bindTo(this.contextKeyService);
            const excludedSourcesString = storageService.get('timeline.excludeSources', 0 /* StorageScope.PROFILE */, '[]');
            this.timelineExcludeSourcesContext.set(excludedSourcesString);
            this.excludedSources = new Set(JSON.parse(excludedSourcesString));
            this._register(storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, 'timeline.excludeSources', this._register(new lifecycle_1.DisposableStore()))(this.onStorageServiceChanged, this));
            this._register(configurationService.onDidChangeConfiguration(this.onConfigurationChanged, this));
            this._register(timelineService.onDidChangeProviders(this.onProvidersChanged, this));
            this._register(timelineService.onDidChangeTimeline(this.onTimelineChanged, this));
            this._register(timelineService.onDidChangeUri(uri => this.setUri(uri), this));
        }
        get followActiveEditor() {
            return this._followActiveEditor;
        }
        set followActiveEditor(value) {
            if (this._followActiveEditor === value) {
                return;
            }
            this._followActiveEditor = value;
            this.followActiveEditorContext.set(value);
            this.updateFilename(this._filename);
            if (value) {
                this.onActiveEditorChanged();
            }
        }
        get pageOnScroll() {
            if (this._pageOnScroll === undefined) {
                this._pageOnScroll = this.configurationService.getValue('timeline.pageOnScroll') ?? false;
            }
            return this._pageOnScroll;
        }
        get pageSize() {
            let pageSize = this.configurationService.getValue('timeline.pageSize');
            if (pageSize === undefined || pageSize === null) {
                // If we are paging when scrolling, then add an extra item to the end to make sure the "Load more" item is out of view
                pageSize = Math.max(20, Math.floor((this.tree?.renderHeight ?? 0 / ItemHeight) + (this.pageOnScroll ? 1 : -1)));
            }
            return pageSize;
        }
        reset() {
            this.loadTimeline(true);
        }
        setUri(uri) {
            this.setUriCore(uri, true);
        }
        setUriCore(uri, disableFollowing) {
            if (disableFollowing) {
                this.followActiveEditor = false;
            }
            this.uri = uri;
            this.updateFilename(uri ? this.labelService.getUriBasenameLabel(uri) : undefined);
            this.treeRenderer?.setUri(uri);
            this.loadTimeline(true);
        }
        onStorageServiceChanged() {
            const excludedSourcesString = this.storageService.get('timeline.excludeSources', 0 /* StorageScope.PROFILE */, '[]');
            this.timelineExcludeSourcesContext.set(excludedSourcesString);
            this.excludedSources = new Set(JSON.parse(excludedSourcesString));
            const missing = this.timelineService.getSources()
                .filter(({ id }) => !this.excludedSources.has(id) && !this.timelinesBySource.has(id));
            if (missing.length !== 0) {
                this.loadTimeline(true, missing.map(({ id }) => id));
            }
            else {
                this.refresh();
            }
        }
        onConfigurationChanged(e) {
            if (e.affectsConfiguration('timeline.pageOnScroll')) {
                this._pageOnScroll = undefined;
            }
        }
        onActiveEditorChanged() {
            if (!this.followActiveEditor || !this.isExpanded()) {
                return;
            }
            const uri = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if ((this.uriIdentityService.extUri.isEqual(uri, this.uri) && uri !== undefined) ||
                // Fallback to match on fsPath if we are dealing with files or git schemes
                (uri?.fsPath === this.uri?.fsPath && (uri?.scheme === network_1.Schemas.file || uri?.scheme === 'git') && (this.uri?.scheme === network_1.Schemas.file || this.uri?.scheme === 'git'))) {
                // If the uri hasn't changed, make sure we have valid caches
                for (const source of this.timelineService.getSources()) {
                    if (this.excludedSources.has(source.id)) {
                        continue;
                    }
                    const timeline = this.timelinesBySource.get(source.id);
                    if (timeline !== undefined && !timeline.stale) {
                        continue;
                    }
                    if (timeline !== undefined) {
                        this.updateTimeline(timeline, timeline.requiresReset);
                    }
                    else {
                        this.loadTimelineForSource(source.id, uri, true);
                    }
                }
                return;
            }
            this.setUriCore(uri, false);
        }
        onProvidersChanged(e) {
            if (e.removed) {
                for (const source of e.removed) {
                    this.timelinesBySource.delete(source);
                }
                this.refresh();
            }
            if (e.added) {
                this.loadTimeline(true, e.added);
            }
        }
        onTimelineChanged(e) {
            if (e?.uri === undefined || this.uriIdentityService.extUri.isEqual(e.uri, this.uri)) {
                const timeline = this.timelinesBySource.get(e.id);
                if (timeline === undefined) {
                    return;
                }
                if (this.isBodyVisible()) {
                    this.updateTimeline(timeline, e.reset);
                }
                else {
                    timeline.invalidate(e.reset);
                }
            }
        }
        updateFilename(filename) {
            this._filename = filename;
            if (this.followActiveEditor || !filename) {
                this.updateTitleDescription(filename);
            }
            else {
                this.updateTitleDescription(`${filename} (pinned)`);
            }
        }
        get message() {
            return this._message;
        }
        set message(message) {
            this._message = message;
            this.updateMessage();
        }
        updateMessage() {
            if (this._message !== undefined) {
                this.showMessage(this._message);
            }
            else {
                this.hideMessage();
            }
        }
        showMessage(message) {
            if (!this.$message) {
                return;
            }
            this.$message.classList.remove('hide');
            this.resetMessageElement();
            this.$message.textContent = message;
        }
        hideMessage() {
            this.resetMessageElement();
            this.$message.classList.add('hide');
        }
        resetMessageElement() {
            DOM.clearNode(this.$message);
        }
        get hasVisibleItems() {
            return this._visibleItemCount > 0;
        }
        clear(cancelPending) {
            this._visibleItemCount = 0;
            this._maxItemCount = this.pageSize;
            this.timelinesBySource.clear();
            if (cancelPending) {
                for (const { tokenSource } of this.pendingRequests.values()) {
                    tokenSource.dispose(true);
                }
                this.pendingRequests.clear();
                if (!this.isBodyVisible() && this.tree) {
                    this.tree.setChildren(null, undefined);
                    this._isEmpty = true;
                }
            }
        }
        async loadTimeline(reset, sources) {
            // If we have no source, we are resetting all sources, so cancel everything in flight and reset caches
            if (sources === undefined) {
                if (reset) {
                    this.clear(true);
                }
                // TODO@eamodio: Are these the right the list of schemes to exclude? Is there a better way?
                if (this.uri?.scheme === network_1.Schemas.vscodeSettings || this.uri?.scheme === network_1.Schemas.webviewPanel || this.uri?.scheme === network_1.Schemas.walkThrough) {
                    this.uri = undefined;
                    this.clear(false);
                    this.refresh();
                    return;
                }
                if (this._isEmpty && this.uri !== undefined) {
                    this.setLoadingUriMessage();
                }
            }
            if (this.uri === undefined) {
                this.clear(false);
                this.refresh();
                return;
            }
            if (!this.isBodyVisible()) {
                return;
            }
            let hasPendingRequests = false;
            for (const source of sources ?? this.timelineService.getSources().map(s => s.id)) {
                const requested = this.loadTimelineForSource(source, this.uri, reset);
                if (requested) {
                    hasPendingRequests = true;
                }
            }
            if (!hasPendingRequests) {
                this.refresh();
            }
            else if (this._isEmpty) {
                this.setLoadingUriMessage();
            }
        }
        loadTimelineForSource(source, uri, reset, options) {
            if (this.excludedSources.has(source)) {
                return false;
            }
            const timeline = this.timelinesBySource.get(source);
            // If we are paging, and there are no more items or we have enough cached items to cover the next page,
            // don't bother querying for more
            if (!reset &&
                options?.cursor !== undefined &&
                timeline !== undefined &&
                (!timeline?.more || timeline.items.length > timeline.lastRenderedIndex + this.pageSize)) {
                return false;
            }
            if (options === undefined) {
                options = { cursor: reset ? undefined : timeline?.cursor, limit: this.pageSize };
            }
            let request = this.pendingRequests.get(source);
            if (request !== undefined) {
                options.cursor = request.options.cursor;
                // TODO@eamodio deal with concurrent requests better
                if (typeof options.limit === 'number') {
                    if (typeof request.options.limit === 'number') {
                        options.limit += request.options.limit;
                    }
                    else {
                        options.limit = request.options.limit;
                    }
                }
            }
            request?.tokenSource.dispose(true);
            options.cacheResults = true;
            options.resetCache = reset;
            request = this.timelineService.getTimeline(source, uri, options, new cancellation_1.CancellationTokenSource());
            if (request === undefined) {
                return false;
            }
            this.pendingRequests.set(source, request);
            request.tokenSource.token.onCancellationRequested(() => this.pendingRequests.delete(source));
            this.handleRequest(request);
            return true;
        }
        updateTimeline(timeline, reset) {
            if (reset) {
                this.timelinesBySource.delete(timeline.source);
                // Override the limit, to re-query for all our existing cached (possibly visible) items to keep visual continuity
                const { oldest } = timeline;
                this.loadTimelineForSource(timeline.source, this.uri, true, oldest !== undefined ? { limit: { timestamp: oldest.timestamp, id: oldest.id } } : undefined);
            }
            else {
                // Override the limit, to query for any newer items
                const { newest } = timeline;
                this.loadTimelineForSource(timeline.source, this.uri, false, newest !== undefined ? { limit: { timestamp: newest.timestamp, id: newest.id } } : { limit: this.pageSize });
            }
        }
        async handleRequest(request) {
            let response;
            try {
                response = await this.progressService.withProgress({ location: this.id }, () => request.result);
            }
            finally {
                this.pendingRequests.delete(request.source);
            }
            if (response === undefined ||
                request.tokenSource.token.isCancellationRequested ||
                request.uri !== this.uri) {
                if (this.pendingRequests.size === 0 && this._pendingRefresh) {
                    this.refresh();
                }
                return;
            }
            const source = request.source;
            let updated = false;
            const timeline = this.timelinesBySource.get(source);
            if (timeline === undefined) {
                this.timelinesBySource.set(source, new TimelineAggregate(response));
                updated = true;
            }
            else {
                updated = timeline.add(response, request.options);
            }
            if (updated) {
                this._pendingRefresh = true;
                // If we have visible items already and there are other pending requests, debounce for a bit to wait for other requests
                if (this.hasVisibleItems && this.pendingRequests.size !== 0) {
                    this.refreshDebounced();
                }
                else {
                    this.refresh();
                }
            }
            else if (this.pendingRequests.size === 0) {
                if (this._pendingRefresh) {
                    this.refresh();
                }
                else {
                    this.tree.rerender();
                }
            }
        }
        *getItems() {
            let more = false;
            if (this.uri === undefined || this.timelinesBySource.size === 0) {
                this._visibleItemCount = 0;
                return;
            }
            const maxCount = this._maxItemCount;
            let count = 0;
            if (this.timelinesBySource.size === 1) {
                const [source, timeline] = iterator_1.Iterable.first(this.timelinesBySource);
                timeline.lastRenderedIndex = -1;
                if (this.excludedSources.has(source)) {
                    this._visibleItemCount = 0;
                    return;
                }
                if (timeline.items.length !== 0) {
                    // If we have any items, just say we have one for now -- the real count will be updated below
                    this._visibleItemCount = 1;
                }
                more = timeline.more;
                let lastRelativeTime;
                for (const item of timeline.items) {
                    item.relativeTime = undefined;
                    item.hideRelativeTime = undefined;
                    count++;
                    if (count > maxCount) {
                        more = true;
                        break;
                    }
                    lastRelativeTime = updateRelativeTime(item, lastRelativeTime);
                    yield { element: item };
                }
                timeline.lastRenderedIndex = count - 1;
            }
            else {
                const sources = [];
                let hasAnyItems = false;
                let mostRecentEnd = 0;
                for (const [source, timeline] of this.timelinesBySource) {
                    timeline.lastRenderedIndex = -1;
                    if (this.excludedSources.has(source) || timeline.stale) {
                        continue;
                    }
                    if (timeline.items.length !== 0) {
                        hasAnyItems = true;
                    }
                    if (timeline.more) {
                        more = true;
                        const last = timeline.items[Math.min(maxCount, timeline.items.length - 1)];
                        if (last.timestamp > mostRecentEnd) {
                            mostRecentEnd = last.timestamp;
                        }
                    }
                    const iterator = timeline.items[Symbol.iterator]();
                    sources.push({ timeline, iterator, nextItem: iterator.next() });
                }
                this._visibleItemCount = hasAnyItems ? 1 : 0;
                function getNextMostRecentSource() {
                    return sources
                        .filter(source => !source.nextItem.done)
                        .reduce((previous, current) => (previous === undefined || current.nextItem.value.timestamp >= previous.nextItem.value.timestamp) ? current : previous, undefined);
                }
                let lastRelativeTime;
                let nextSource;
                while (nextSource = getNextMostRecentSource()) {
                    nextSource.timeline.lastRenderedIndex++;
                    const item = nextSource.nextItem.value;
                    item.relativeTime = undefined;
                    item.hideRelativeTime = undefined;
                    if (item.timestamp >= mostRecentEnd) {
                        count++;
                        if (count > maxCount) {
                            more = true;
                            break;
                        }
                        lastRelativeTime = updateRelativeTime(item, lastRelativeTime);
                        yield { element: item };
                    }
                    nextSource.nextItem = nextSource.iterator.next();
                }
            }
            this._visibleItemCount = count;
            if (count > 0) {
                if (more) {
                    yield {
                        element: new LoadMoreCommand(this.pendingRequests.size !== 0)
                    };
                }
                else if (this.pendingRequests.size !== 0) {
                    yield {
                        element: new LoadMoreCommand(true)
                    };
                }
            }
        }
        refresh() {
            if (!this.isBodyVisible()) {
                return;
            }
            this.tree.setChildren(null, this.getItems());
            this._isEmpty = !this.hasVisibleItems;
            if (this.uri === undefined) {
                this.updateFilename(undefined);
                this.message = (0, nls_1.localize)('timeline.editorCannotProvideTimeline', "The active editor cannot provide timeline information.");
            }
            else if (this._isEmpty) {
                if (this.pendingRequests.size !== 0) {
                    this.setLoadingUriMessage();
                }
                else {
                    this.updateFilename(this.labelService.getUriBasenameLabel(this.uri));
                    const scmProviderCount = this.contextKeyService.getContextKeyValue('scm.providerCount');
                    if (this.timelineService.getSources().filter(({ id }) => !this.excludedSources.has(id)).length === 0) {
                        this.message = (0, nls_1.localize)('timeline.noTimelineSourcesEnabled', "All timeline sources have been filtered out.");
                    }
                    else {
                        if (this.configurationService.getValue('workbench.localHistory.enabled') && !this.excludedSources.has('timeline.localHistory')) {
                            this.message = (0, nls_1.localize)('timeline.noLocalHistoryYet', "Local History will track recent changes as you save them unless the file has been excluded or is too large.");
                        }
                        else if (this.excludedSources.size > 0) {
                            this.message = (0, nls_1.localize)('timeline.noTimelineInfoFromEnabledSources', "No filtered timeline information was provided.");
                        }
                        else {
                            this.message = (0, nls_1.localize)('timeline.noTimelineInfo', "No timeline information was provided.");
                        }
                    }
                    if (!scmProviderCount || scmProviderCount === 0) {
                        this.message += ' ' + (0, nls_1.localize)('timeline.noSCM', "Source Control has not been configured.");
                    }
                }
            }
            else {
                this.updateFilename(this.labelService.getUriBasenameLabel(this.uri));
                this.message = undefined;
            }
            this._pendingRefresh = false;
        }
        refreshDebounced() {
            this.refresh();
        }
        focus() {
            super.focus();
            this.tree.domFocus();
        }
        setExpanded(expanded) {
            const changed = super.setExpanded(expanded);
            if (changed && this.isBodyVisible()) {
                if (!this.followActiveEditor) {
                    this.setUriCore(this.uri, true);
                }
                else {
                    this.onActiveEditorChanged();
                }
            }
            return changed;
        }
        setVisible(visible) {
            if (visible) {
                this.extensionService.activateByEvent('onView:timeline');
                this.visibilityDisposables = new lifecycle_1.DisposableStore();
                this.editorService.onDidActiveEditorChange(this.onActiveEditorChanged, this, this.visibilityDisposables);
                // Refresh the view on focus to update the relative timestamps
                this.onDidFocus(() => this.refreshDebounced(), this, this.visibilityDisposables);
                super.setVisible(visible);
                this.onActiveEditorChanged();
            }
            else {
                this.visibilityDisposables?.dispose();
                super.setVisible(visible);
            }
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
        renderHeaderTitle(container) {
            super.renderHeaderTitle(container, this.title);
            container.classList.add('timeline-view');
        }
        renderBody(container) {
            super.renderBody(container);
            this.$container = container;
            container.classList.add('tree-explorer-viewlet-tree-view', 'timeline-tree-view');
            this.$message = DOM.append(this.$container, DOM.$('.message'));
            this.$message.classList.add('timeline-subtle');
            this.message = (0, nls_1.localize)('timeline.editorCannotProvideTimeline', "The active editor cannot provide timeline information.");
            this.$tree = document.createElement('div');
            this.$tree.classList.add('customview-tree', 'file-icon-themable-tree', 'hide-arrows');
            // this.treeElement.classList.add('show-file-icons');
            container.appendChild(this.$tree);
            this.treeRenderer = this.instantiationService.createInstance(TimelineTreeRenderer, this.commands);
            this.treeRenderer.onDidScrollToEnd(item => {
                if (this.pageOnScroll) {
                    this.loadMore(item);
                }
            });
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchObjectTree, 'TimelinePane', this.$tree, new TimelineListVirtualDelegate(), [this.treeRenderer], {
                identityProvider: new TimelineIdentityProvider(),
                accessibilityProvider: {
                    getAriaLabel(element) {
                        if (isLoadMoreCommand(element)) {
                            return element.ariaLabel;
                        }
                        return element.accessibilityInformation ? element.accessibilityInformation.label : (0, nls_1.localize)('timeline.aria.item', "{0}: {1}", element.relativeTimeFullWord ?? '', element.label);
                    },
                    getRole(element) {
                        if (isLoadMoreCommand(element)) {
                            return 'treeitem';
                        }
                        return element.accessibilityInformation && element.accessibilityInformation.role ? element.accessibilityInformation.role : 'treeitem';
                    },
                    getWidgetAriaLabel() {
                        return (0, nls_1.localize)('timeline', "Timeline");
                    }
                },
                keyboardNavigationLabelProvider: new TimelineKeyboardNavigationLabelProvider(),
                multipleSelectionSupport: false,
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            this._register(this.tree.onContextMenu(e => this.onContextMenu(this.commands, e)));
            this._register(this.tree.onDidChangeSelection(e => this.ensureValidItems()));
            this._register(this.tree.onDidOpen(e => {
                if (!e.browserEvent || !this.ensureValidItems()) {
                    return;
                }
                const selection = this.tree.getSelection();
                let item;
                if (selection.length === 1) {
                    item = selection[0];
                }
                if (item === null) {
                    return;
                }
                if (isTimelineItem(item)) {
                    if (item.command) {
                        let args = item.command.arguments ?? [];
                        if (item.command.id === editorCommands_1.API_OPEN_EDITOR_COMMAND_ID || item.command.id === editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID) {
                            // Some commands owned by us should receive the
                            // `IOpenEvent` as context to open properly
                            args = [...args, e];
                        }
                        this.commandService.executeCommand(item.command.id, ...args);
                    }
                }
                else if (isLoadMoreCommand(item)) {
                    this.loadMore(item);
                }
            }));
        }
        loadMore(item) {
            if (item.loading) {
                return;
            }
            item.loading = true;
            this.tree.rerender(item);
            if (this.pendingRequests.size !== 0) {
                return;
            }
            this._maxItemCount = this._visibleItemCount + this.pageSize;
            this.loadTimeline(false);
        }
        ensureValidItems() {
            // If we don't have any non-excluded timelines, clear the tree and show the loading message
            if (!this.hasVisibleItems || !this.timelineService.getSources().some(({ id }) => !this.excludedSources.has(id) && this.timelinesBySource.has(id))) {
                this.tree.setChildren(null, undefined);
                this._isEmpty = true;
                this.setLoadingUriMessage();
                return false;
            }
            return true;
        }
        setLoadingUriMessage() {
            const file = this.uri && this.labelService.getUriBasenameLabel(this.uri);
            this.updateFilename(file);
            this.message = file ? (0, nls_1.localize)('timeline.loading', "Loading timeline for {0}...", file) : '';
        }
        onContextMenu(commands, treeEvent) {
            const item = treeEvent.element;
            if (item === null) {
                return;
            }
            const event = treeEvent.browserEvent;
            event.preventDefault();
            event.stopPropagation();
            if (!this.ensureValidItems()) {
                return;
            }
            this.tree.setFocus([item]);
            const actions = commands.getItemContextActions(item);
            if (!actions.length) {
                return;
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => treeEvent.anchor,
                getActions: () => actions,
                getActionViewItem: (action) => {
                    const keybinding = this.keybindingService.lookupKeybinding(action.id);
                    if (keybinding) {
                        return new actionViewItems_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel() });
                    }
                    return undefined;
                },
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.tree.domFocus();
                    }
                },
                getActionsContext: () => ({ uri: this.uri, item }),
                actionRunner: new TimelineActionRunner()
            });
        }
    };
    exports.TimelinePane = TimelinePane;
    __decorate([
        (0, decorators_1.debounce)(500)
    ], TimelinePane.prototype, "refreshDebounced", null);
    exports.TimelinePane = TimelinePane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, storage_1.IStorageService),
        __param(6, views_1.IViewDescriptorService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, editorService_1.IEditorService),
        __param(9, commands_1.ICommandService),
        __param(10, progress_1.IProgressService),
        __param(11, timeline_1.ITimelineService),
        __param(12, opener_1.IOpenerService),
        __param(13, themeService_1.IThemeService),
        __param(14, telemetry_1.ITelemetryService),
        __param(15, label_1.ILabelService),
        __param(16, uriIdentity_1.IUriIdentityService),
        __param(17, extensions_1.IExtensionService)
    ], TimelinePane);
    class TimelineElementTemplate {
        static { this.id = 'TimelineElementTemplate'; }
        constructor(container, actionViewItemProvider, hoverDelegate) {
            container.classList.add('custom-view-tree-node-item');
            this.icon = DOM.append(container, DOM.$('.custom-view-tree-node-item-icon'));
            this.iconLabel = new iconLabel_1.IconLabel(container, { supportHighlights: true, supportIcons: true, hoverDelegate });
            const timestampContainer = DOM.append(this.iconLabel.element, DOM.$('.timeline-timestamp-container'));
            this.timestamp = DOM.append(timestampContainer, DOM.$('span.timeline-timestamp'));
            const actionsContainer = DOM.append(this.iconLabel.element, DOM.$('.actions'));
            this.actionBar = new actionbar_1.ActionBar(actionsContainer, { actionViewItemProvider });
        }
        dispose() {
            this.iconLabel.dispose();
            this.actionBar.dispose();
        }
        reset() {
            this.icon.className = '';
            this.icon.style.backgroundImage = '';
            this.actionBar.clear();
        }
    }
    class TimelineIdentityProvider {
        getId(item) {
            return item.handle;
        }
    }
    exports.TimelineIdentityProvider = TimelineIdentityProvider;
    class TimelineActionRunner extends actions_1.ActionRunner {
        async runAction(action, { uri, item }) {
            if (!isTimelineItem(item)) {
                // TODO@eamodio do we need to do anything else?
                await action.run();
                return;
            }
            await action.run({
                $mid: 12 /* MarshalledId.TimelineActionContext */,
                handle: item.handle,
                source: item.source,
                uri
            }, uri, item.source);
        }
    }
    class TimelineKeyboardNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            return element.label;
        }
    }
    exports.TimelineKeyboardNavigationLabelProvider = TimelineKeyboardNavigationLabelProvider;
    class TimelineListVirtualDelegate {
        getHeight(_element) {
            return ItemHeight;
        }
        getTemplateId(element) {
            return TimelineElementTemplate.id;
        }
    }
    exports.TimelineListVirtualDelegate = TimelineListVirtualDelegate;
    let TimelineTreeRenderer = class TimelineTreeRenderer {
        constructor(commands, instantiationService, themeService) {
            this.commands = commands;
            this.instantiationService = instantiationService;
            this.themeService = themeService;
            this._onDidScrollToEnd = new event_1.Emitter();
            this.onDidScrollToEnd = this._onDidScrollToEnd.event;
            this.templateId = TimelineElementTemplate.id;
            this.actionViewItemProvider = menuEntryActionViewItem_1.createActionViewItem.bind(undefined, this.instantiationService);
            this._hoverDelegate = (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse');
        }
        setUri(uri) {
            this.uri = uri;
        }
        renderTemplate(container) {
            return new TimelineElementTemplate(container, this.actionViewItemProvider, this._hoverDelegate);
        }
        renderElement(node, index, template, height) {
            template.reset();
            const { element: item } = node;
            const theme = this.themeService.getColorTheme();
            const icon = theme.type === theme_1.ColorScheme.LIGHT ? item.icon : item.iconDark;
            const iconUrl = icon ? uri_1.URI.revive(icon) : null;
            if (iconUrl) {
                template.icon.className = 'custom-view-tree-node-item-icon';
                template.icon.style.backgroundImage = DOM.asCSSUrl(iconUrl);
                template.icon.style.color = '';
            }
            else if (item.themeIcon) {
                template.icon.className = `custom-view-tree-node-item-icon ${themables_1.ThemeIcon.asClassName(item.themeIcon)}`;
                if (item.themeIcon.color) {
                    template.icon.style.color = theme.getColor(item.themeIcon.color.id)?.toString() ?? '';
                }
                else {
                    template.icon.style.color = '';
                }
                template.icon.style.backgroundImage = '';
            }
            else {
                template.icon.className = 'custom-view-tree-node-item-icon';
                template.icon.style.backgroundImage = '';
                template.icon.style.color = '';
            }
            const tooltip = item.tooltip
                ? (0, types_1.isString)(item.tooltip)
                    ? item.tooltip
                    : { markdown: item.tooltip, markdownNotSupportedFallback: (0, markdownRenderer_1.renderMarkdownAsPlaintext)(item.tooltip) }
                : undefined;
            template.iconLabel.setLabel(item.label, item.description, {
                title: tooltip,
                matches: (0, filters_1.createMatches)(node.filterData)
            });
            template.timestamp.textContent = item.relativeTime ?? '';
            template.timestamp.ariaLabel = item.relativeTimeFullWord ?? '';
            template.timestamp.parentElement.classList.toggle('timeline-timestamp--duplicate', isTimelineItem(item) && item.hideRelativeTime);
            template.actionBar.context = { uri: this.uri, item };
            template.actionBar.actionRunner = new TimelineActionRunner();
            template.actionBar.push(this.commands.getItemActions(item), { icon: true, label: false });
            // If we are rendering the load more item, we've scrolled to the end, so trigger an event
            if (isLoadMoreCommand(item)) {
                setTimeout(() => this._onDidScrollToEnd.fire(item), 0);
            }
        }
        disposeTemplate(template) {
            template.dispose();
        }
    };
    TimelineTreeRenderer = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService)
    ], TimelineTreeRenderer);
    const timelineRefresh = (0, iconRegistry_1.registerIcon)('timeline-refresh', codicons_1.Codicon.refresh, (0, nls_1.localize)('timelineRefresh', 'Icon for the refresh timeline action.'));
    const timelinePin = (0, iconRegistry_1.registerIcon)('timeline-pin', codicons_1.Codicon.pin, (0, nls_1.localize)('timelinePin', 'Icon for the pin timeline action.'));
    const timelineUnpin = (0, iconRegistry_1.registerIcon)('timeline-unpin', codicons_1.Codicon.pinned, (0, nls_1.localize)('timelineUnpin', 'Icon for the unpin timeline action.'));
    let TimelinePaneCommands = class TimelinePaneCommands extends lifecycle_1.Disposable {
        constructor(pane, timelineService, storageService, contextKeyService, menuService) {
            super();
            this.pane = pane;
            this.timelineService = timelineService;
            this.storageService = storageService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this._register(this.sourceDisposables = new lifecycle_1.DisposableStore());
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'timeline.refresh',
                        title: (0, nls_1.localize2)('refresh', "Refresh"),
                        icon: timelineRefresh,
                        category: (0, nls_1.localize2)('timeline', "Timeline"),
                        menu: {
                            id: actions_2.MenuId.TimelineTitle,
                            group: 'navigation',
                            order: 99,
                        }
                    });
                }
                run(accessor, ...args) {
                    pane.reset();
                }
            }));
            this._register(commands_1.CommandsRegistry.registerCommand('timeline.toggleFollowActiveEditor', (accessor, ...args) => pane.followActiveEditor = !pane.followActiveEditor));
            this._register(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TimelineTitle, ({
                command: {
                    id: 'timeline.toggleFollowActiveEditor',
                    title: (0, nls_1.localize2)('timeline.toggleFollowActiveEditorCommand.follow', 'Pin the Current Timeline'),
                    icon: timelinePin,
                    category: (0, nls_1.localize2)('timeline', "Timeline"),
                },
                group: 'navigation',
                order: 98,
                when: exports.TimelineFollowActiveEditorContext
            })));
            this._register(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TimelineTitle, ({
                command: {
                    id: 'timeline.toggleFollowActiveEditor',
                    title: (0, nls_1.localize2)('timeline.toggleFollowActiveEditorCommand.unfollow', 'Unpin the Current Timeline'),
                    icon: timelineUnpin,
                    category: (0, nls_1.localize2)('timeline', "Timeline"),
                },
                group: 'navigation',
                order: 98,
                when: exports.TimelineFollowActiveEditorContext.toNegated()
            })));
            this._register(timelineService.onDidChangeProviders(() => this.updateTimelineSourceFilters()));
            this.updateTimelineSourceFilters();
        }
        getItemActions(element) {
            return this.getActions(actions_2.MenuId.TimelineItemContext, { key: 'timelineItem', value: element.contextValue }).primary;
        }
        getItemContextActions(element) {
            return this.getActions(actions_2.MenuId.TimelineItemContext, { key: 'timelineItem', value: element.contextValue }).secondary;
        }
        getActions(menuId, context) {
            const contextKeyService = this.contextKeyService.createOverlay([
                ['view', this.pane.id],
                [context.key, context.value],
            ]);
            const menu = this.menuService.createMenu(menuId, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, result, 'inline');
            menu.dispose();
            return result;
        }
        updateTimelineSourceFilters() {
            this.sourceDisposables.clear();
            const excluded = new Set(JSON.parse(this.storageService.get('timeline.excludeSources', 0 /* StorageScope.PROFILE */, '[]')));
            for (const source of this.timelineService.getSources()) {
                this.sourceDisposables.add((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: `timeline.toggleExcludeSource:${source.id}`,
                            title: source.label,
                            menu: {
                                id: actions_2.MenuId.TimelineFilterSubMenu,
                                group: 'navigation',
                            },
                            toggled: contextkey_1.ContextKeyExpr.regex(`timelineExcludeSources`, new RegExp(`\\b${(0, strings_1.escapeRegExpCharacters)(source.id)}\\b`)).negate()
                        });
                    }
                    run(accessor, ...args) {
                        if (excluded.has(source.id)) {
                            excluded.delete(source.id);
                        }
                        else {
                            excluded.add(source.id);
                        }
                        const storageService = accessor.get(storage_1.IStorageService);
                        storageService.store('timeline.excludeSources', JSON.stringify([...excluded.keys()]), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                    }
                }));
            }
        }
    };
    TimelinePaneCommands = __decorate([
        __param(1, timeline_1.ITimelineService),
        __param(2, storage_1.IStorageService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, actions_2.IMenuService)
    ], TimelinePaneCommands);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZWxpbmVQYW5lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90aW1lbGluZS9icm93c2VyL3RpbWVsaW5lUGFuZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3RGhHLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztJQUl0QixTQUFTLGlCQUFpQixDQUFDLElBQTZCO1FBQ3ZELE9BQU8sSUFBSSxZQUFZLGVBQWUsQ0FBQztJQUN4QyxDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUMsSUFBNkI7UUFDcEQsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDLElBQUksS0FBSyxDQUFDO0lBQzdELENBQUM7SUFFRCxTQUFTLGtCQUFrQixDQUFDLElBQWtCLEVBQUUsZ0JBQW9DO1FBQ25GLElBQUksQ0FBQyxZQUFZLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQU8sRUFBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUMvRSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQU8sRUFBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ3BHLElBQUksZ0JBQWdCLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssZ0JBQWdCLEVBQUUsQ0FBQztZQUM5RSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7UUFDL0IsQ0FBQzthQUFNLENBQUM7WUFDUCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1FBQzlCLENBQUM7UUFFRCxPQUFPLGdCQUFnQixDQUFDO0lBQ3pCLENBQUM7SUFPRCxNQUFNLGlCQUFpQjtRQU10QixZQUFZLFFBQWtCO1lBaUZ0QixXQUFNLEdBQUcsS0FBSyxDQUFDO1lBS2YsbUJBQWMsR0FBRyxLQUFLLENBQUM7WUFyRjlCLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUM5QixJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztZQUN2QyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUdELElBQUksTUFBTTtZQUNULE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRUQsSUFBSSxJQUFJO1lBQ1AsT0FBTyxJQUFJLENBQUMsT0FBTyxLQUFLLFNBQVMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsSUFBSSxNQUFNO1lBQ1QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUM7UUFFRCxJQUFJLE1BQU07WUFDVCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUFrQixFQUFFLE9BQXdCO1lBQy9DLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztZQUVwQixJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDNUQsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFFZixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUN0QixNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUU3QixLQUFLLE1BQU0sSUFBSSxJQUFJLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDbkMsSUFBSSxJQUFJLENBQUMsRUFBRSxLQUFLLFNBQVMsRUFBRSxDQUFDO3dCQUMzQixVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDaEMsQ0FBQzt5QkFDSSxDQUFDO3dCQUNMLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNsQixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsNkJBQTZCO2dCQUM3QixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztnQkFDMUIsSUFBSSxJQUFJLENBQUM7Z0JBQ1QsT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUNaLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO3dCQUNuRixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3pCLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxTQUFTLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNsRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3BDLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBRWYsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUVELGtGQUFrRjtZQUNsRixJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssU0FBUyxJQUFJLE9BQU8sT0FBTyxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDdkUsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztZQUN4QyxDQUFDO1lBRUQsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDZCxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUNSLENBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDO29CQUMzQixDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssU0FBUzt3QkFDdEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUN0SCxDQUFDO1lBQ0gsQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFHRCxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUdELElBQUksYUFBYTtZQUNoQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDNUIsQ0FBQztRQUVELFVBQVUsQ0FBQyxhQUFzQjtZQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUNuQixJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztRQUNyQyxDQUFDO0tBQ0Q7SUFFRCxNQUFNLGVBQWU7UUFlcEIsWUFBWSxPQUFnQjtZQWRuQixXQUFNLEdBQUcseUJBQXlCLENBQUM7WUFDbkMsY0FBUyxHQUFHLENBQUMsQ0FBQztZQUNkLGdCQUFXLEdBQUcsU0FBUyxDQUFDO1lBQ3hCLFlBQU8sR0FBRyxTQUFTLENBQUM7WUFDcEIsaUJBQVksR0FBRyxTQUFTLENBQUM7WUFDbEMscUNBQXFDO1lBQzVCLE9BQUUsR0FBRyxTQUFTLENBQUM7WUFDZixTQUFJLEdBQUcsU0FBUyxDQUFDO1lBQ2pCLGFBQVEsR0FBRyxTQUFTLENBQUM7WUFDckIsV0FBTSxHQUFHLFNBQVMsQ0FBQztZQUNuQixpQkFBWSxHQUFHLFNBQVMsQ0FBQztZQUN6Qix5QkFBb0IsR0FBRyxTQUFTLENBQUM7WUFDakMscUJBQWdCLEdBQUcsU0FBUyxDQUFDO1lBSzlCLGFBQVEsR0FBWSxLQUFLLENBQUM7WUFGakMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFDekIsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBQ0QsSUFBSSxPQUFPLENBQUMsS0FBYztZQUN6QixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUN2QixDQUFDO1FBRUQsSUFBSSxTQUFTO1lBQ1osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFFRCxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNuSCxDQUFDO1FBRUQsSUFBSSxTQUFTO1lBQ1osT0FBTyxTQUFTLENBQUMsQ0FBQyxpREFBaUQ7UUFDcEUsQ0FBQztLQUNEO0lBRVksUUFBQSxpQ0FBaUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsNEJBQTRCLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3pHLFFBQUEsc0JBQXNCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLHdCQUF3QixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUUvRixJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFhLFNBQVEsbUJBQVE7aUJBQ3pCLFVBQUssR0FBcUIsSUFBQSxlQUFTLEVBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxBQUF0RCxDQUF1RDtRQW1CNUUsWUFDQyxPQUF5QixFQUNMLGlCQUFxQyxFQUNwQyxrQkFBdUMsRUFDeEMsaUJBQXFDLEVBQ2xDLG9CQUEyQyxFQUNqRCxjQUFnRCxFQUN6QyxxQkFBNkMsRUFDOUMsb0JBQTJDLEVBQ2xELGFBQXVDLEVBQ3RDLGNBQXlDLEVBQ3hDLGVBQWtELEVBQ2xELGVBQTJDLEVBQzdDLGFBQTZCLEVBQzlCLFlBQTJCLEVBQ3ZCLGdCQUFtQyxFQUN2QyxZQUE0QyxFQUN0QyxrQkFBd0QsRUFDMUQsZ0JBQW9EO1lBRXZFLEtBQUssQ0FBQyxFQUFFLEdBQUcsT0FBTyxFQUFFLFdBQVcsRUFBRSxnQkFBTSxDQUFDLGFBQWEsRUFBRSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixFQUFFLG9CQUFvQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQWRuTSxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFHdkMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQzVCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUN2QixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDeEMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBSTdCLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ3JCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDekMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQXZCaEUsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztZQUNyRCxzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztZQTBDekQsd0JBQW1CLEdBQVksSUFBSSxDQUFDO1lBMkxwQyxhQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ2hCLGtCQUFhLEdBQUcsQ0FBQyxDQUFDO1lBRWxCLHNCQUFpQixHQUFHLENBQUMsQ0FBQztZQTRJdEIsb0JBQWUsR0FBRyxLQUFLLENBQUM7WUExVi9CLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFckcsSUFBSSxDQUFDLHlCQUF5QixHQUFHLHlDQUFpQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNsRyxJQUFJLENBQUMsNkJBQTZCLEdBQUcsOEJBQXNCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRTNGLE1BQU0scUJBQXFCLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsZ0NBQXdCLElBQUksQ0FBQyxDQUFDO1lBQ3hHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1lBRWxFLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLGdCQUFnQiwrQkFBdUIseUJBQXlCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDNUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqRyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRixJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDL0UsQ0FBQztRQUdELElBQUksa0JBQWtCO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBQ2pDLENBQUM7UUFDRCxJQUFJLGtCQUFrQixDQUFDLEtBQWM7WUFDcEMsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ3hDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEtBQUssQ0FBQztZQUNqQyxJQUFJLENBQUMseUJBQXlCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXBDLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUM7UUFHRCxJQUFJLFlBQVk7WUFDZixJQUFJLElBQUksQ0FBQyxhQUFhLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBNkIsdUJBQXVCLENBQUMsSUFBSSxLQUFLLENBQUM7WUFDdkgsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBSSxRQUFRO1lBQ1gsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBNEIsbUJBQW1CLENBQUMsQ0FBQztZQUNsRyxJQUFJLFFBQVEsS0FBSyxTQUFTLElBQUksUUFBUSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNqRCxzSEFBc0g7Z0JBQ3RILFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxZQUFZLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqSCxDQUFDO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxNQUFNLENBQUMsR0FBUTtZQUNkLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFTyxVQUFVLENBQUMsR0FBb0IsRUFBRSxnQkFBeUI7WUFDakUsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsS0FBSyxDQUFDO1lBQ2pDLENBQUM7WUFFRCxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNmLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFFTyx1QkFBdUI7WUFDOUIsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsZ0NBQXdCLElBQUksQ0FBQyxDQUFDO1lBQzdHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1lBRWxFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFO2lCQUMvQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixDQUFDO1FBQ0YsQ0FBQztRQUVPLHNCQUFzQixDQUFDLENBQTRCO1lBQzFELElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLHVCQUF1QixDQUFDLEVBQUUsQ0FBQztnQkFDckQsSUFBSSxDQUFDLGFBQWEsR0FBRyxTQUFTLENBQUM7WUFDaEMsQ0FBQztRQUNGLENBQUM7UUFFTyxxQkFBcUI7WUFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUNwRCxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sR0FBRyxHQUFHLCtCQUFzQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxFQUFFLGlCQUFpQixFQUFFLHlCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFFcEksSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxLQUFLLFNBQVMsQ0FBQztnQkFDL0UsMEVBQTBFO2dCQUMxRSxDQUFDLEdBQUcsRUFBRSxNQUFNLEtBQUssSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxNQUFNLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBRXJLLDREQUE0RDtnQkFDNUQsS0FBSyxNQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7b0JBQ3hELElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQ3pDLFNBQVM7b0JBQ1YsQ0FBQztvQkFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDdkQsSUFBSSxRQUFRLEtBQUssU0FBUyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUMvQyxTQUFTO29CQUNWLENBQUM7b0JBRUQsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQzVCLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFDdkQsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDbEQsQ0FBQztnQkFDRixDQUFDO2dCQUVELE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVPLGtCQUFrQixDQUFDLENBQStCO1lBQ3pELElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLEtBQUssTUFBTSxNQUFNLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNoQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO2dCQUVELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixDQUFDO1lBRUQsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2IsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xDLENBQUM7UUFDRixDQUFDO1FBRU8saUJBQWlCLENBQUMsQ0FBc0I7WUFDL0MsSUFBSSxDQUFDLEVBQUUsR0FBRyxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNyRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQzVCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDO29CQUMxQixJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBR0QsY0FBYyxDQUFDLFFBQTRCO1lBQzFDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQzFCLElBQUksSUFBSSxDQUFDLGtCQUFrQixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN2QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsUUFBUSxXQUFXLENBQUMsQ0FBQztZQUNyRCxDQUFDO1FBQ0YsQ0FBQztRQUdELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBSSxPQUFPLENBQUMsT0FBMkI7WUFDdEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDeEIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFTyxhQUFhO1lBQ3BCLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNwQixDQUFDO1FBQ0YsQ0FBQztRQUVPLFdBQVcsQ0FBQyxPQUFlO1lBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3BCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBRTNCLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQztRQUNyQyxDQUFDO1FBRU8sV0FBVztZQUNsQixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUMzQixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVPLG1CQUFtQjtZQUMxQixHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBTUQsSUFBWSxlQUFlO1lBQzFCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRU8sS0FBSyxDQUFDLGFBQXNCO1lBQ25DLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ25DLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUUvQixJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNuQixLQUFLLE1BQU0sRUFBRSxXQUFXLEVBQUUsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQzdELFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzNCLENBQUM7Z0JBRUQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQ3RCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBYyxFQUFFLE9BQWtCO1lBQzVELHNHQUFzRztZQUN0RyxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDWCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNsQixDQUFDO2dCQUVELDJGQUEyRjtnQkFDM0YsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUMxSSxJQUFJLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQztvQkFFckIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbEIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUVmLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDN0MsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzdCLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRWYsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUM7Z0JBQzNCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7WUFFL0IsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDbEYsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN0RSxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUNmLGtCQUFrQixHQUFHLElBQUksQ0FBQztnQkFDM0IsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLENBQUM7aUJBQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzdCLENBQUM7UUFDRixDQUFDO1FBRU8scUJBQXFCLENBQUMsTUFBYyxFQUFFLEdBQVEsRUFBRSxLQUFjLEVBQUUsT0FBeUI7WUFDaEcsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXBELHVHQUF1RztZQUN2RyxpQ0FBaUM7WUFDakMsSUFDQyxDQUFDLEtBQUs7Z0JBQ04sT0FBTyxFQUFFLE1BQU0sS0FBSyxTQUFTO2dCQUM3QixRQUFRLEtBQUssU0FBUztnQkFDdEIsQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsRUFDdEYsQ0FBQztnQkFDRixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEYsQ0FBQztZQUVELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9DLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMzQixPQUFPLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO2dCQUV4QyxvREFBb0Q7Z0JBQ3BELElBQUksT0FBTyxPQUFPLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUN2QyxJQUFJLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7d0JBQy9DLE9BQU8sQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7b0JBQ3hDLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxPQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO29CQUN2QyxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxFQUFFLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkMsT0FBTyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDNUIsT0FBTyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDM0IsT0FBTyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUN6QyxNQUFNLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLHNDQUF1QixFQUFFLENBQ25ELENBQUM7WUFFRixJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFFN0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU1QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTyxjQUFjLENBQUMsUUFBMkIsRUFBRSxLQUFjO1lBQ2pFLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQy9DLGlIQUFpSDtnQkFDakgsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzVKLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxtREFBbUQ7Z0JBQ25ELE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM1SyxDQUFDO1FBQ0YsQ0FBQztRQUlPLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBd0I7WUFDbkQsSUFBSSxRQUE4QixDQUFDO1lBQ25DLElBQUksQ0FBQztnQkFDSixRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pHLENBQUM7b0JBQ08sQ0FBQztnQkFDUixJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDN0MsQ0FBQztZQUVELElBQ0MsUUFBUSxLQUFLLFNBQVM7Z0JBQ3RCLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLHVCQUF1QjtnQkFDakQsT0FBTyxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUMsR0FBRyxFQUN2QixDQUFDO2dCQUNGLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDN0QsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNoQixDQUFDO2dCQUVELE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUU5QixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDcEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwRCxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2hCLENBQUM7aUJBQ0ksQ0FBQztnQkFDTCxPQUFPLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ25ELENBQUM7WUFFRCxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO2dCQUU1Qix1SEFBdUg7Z0JBQ3ZILElBQUksSUFBSSxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDN0QsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3pCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2hCLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzVDLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUMxQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2hCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN0QixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxDQUFDLFFBQVE7WUFDaEIsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO1lBRWpCLElBQUksSUFBSSxDQUFDLEdBQUcsS0FBSyxTQUFTLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDakUsSUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztnQkFFM0IsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO1lBQ3BDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztZQUVkLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsR0FBRyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUUsQ0FBQztnQkFFbkUsUUFBUSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUVoQyxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ3RDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7b0JBRTNCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNqQyw2RkFBNkY7b0JBQzdGLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7Z0JBQzVCLENBQUM7Z0JBRUQsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBRXJCLElBQUksZ0JBQW9DLENBQUM7Z0JBQ3pDLEtBQUssTUFBTSxJQUFJLElBQUksUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNuQyxJQUFJLENBQUMsWUFBWSxHQUFHLFNBQVMsQ0FBQztvQkFDOUIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztvQkFFbEMsS0FBSyxFQUFFLENBQUM7b0JBQ1IsSUFBSSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7d0JBQ3RCLElBQUksR0FBRyxJQUFJLENBQUM7d0JBQ1osTUFBTTtvQkFDUCxDQUFDO29CQUVELGdCQUFnQixHQUFHLGtCQUFrQixDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO29CQUM5RCxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUN6QixDQUFDO2dCQUVELFFBQVEsQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7aUJBQ0ksQ0FBQztnQkFDTCxNQUFNLE9BQU8sR0FBc0ksRUFBRSxDQUFDO2dCQUV0SixJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7Z0JBQ3hCLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztnQkFFdEIsS0FBSyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUN6RCxRQUFRLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBRWhDLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUN4RCxTQUFTO29CQUNWLENBQUM7b0JBRUQsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDakMsV0FBVyxHQUFHLElBQUksQ0FBQztvQkFDcEIsQ0FBQztvQkFFRCxJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDbkIsSUFBSSxHQUFHLElBQUksQ0FBQzt3QkFFWixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzNFLElBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxhQUFhLEVBQUUsQ0FBQzs0QkFDcEMsYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7d0JBQ2hDLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUNuRCxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDakUsQ0FBQztnQkFFRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFN0MsU0FBUyx1QkFBdUI7b0JBQy9CLE9BQU8sT0FBTzt5QkFDWixNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO3lCQUN2QyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLFFBQVEsS0FBSyxTQUFTLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxTQUFVLENBQUMsQ0FBQztnQkFDckssQ0FBQztnQkFFRCxJQUFJLGdCQUFvQyxDQUFDO2dCQUN6QyxJQUFJLFVBQVUsQ0FBQztnQkFDZixPQUFPLFVBQVUsR0FBRyx1QkFBdUIsRUFBRSxFQUFFLENBQUM7b0JBQy9DLFVBQVUsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFFeEMsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDO29CQUM5QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsU0FBUyxDQUFDO29CQUVsQyxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksYUFBYSxFQUFFLENBQUM7d0JBQ3JDLEtBQUssRUFBRSxDQUFDO3dCQUNSLElBQUksS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDOzRCQUN0QixJQUFJLEdBQUcsSUFBSSxDQUFDOzRCQUNaLE1BQU07d0JBQ1AsQ0FBQzt3QkFFRCxnQkFBZ0IsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQzt3QkFDOUQsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztvQkFDekIsQ0FBQztvQkFFRCxVQUFVLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2xELENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQztZQUMvQixJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDZixJQUFJLElBQUksRUFBRSxDQUFDO29CQUNWLE1BQU07d0JBQ0wsT0FBTyxFQUFFLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztxQkFDN0QsQ0FBQztnQkFDSCxDQUFDO3FCQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQzVDLE1BQU07d0JBQ0wsT0FBTyxFQUFFLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQztxQkFDbEMsQ0FBQztnQkFDSCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxPQUFPO1lBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDO2dCQUMzQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFTLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUV0QyxJQUFJLElBQUksQ0FBQyxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBQSxjQUFRLEVBQUMsc0NBQXNDLEVBQUUsd0RBQXdELENBQUMsQ0FBQztZQUMzSCxDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMxQixJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNyQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDN0IsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDckUsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLENBQVMsbUJBQW1CLENBQUMsQ0FBQztvQkFDaEcsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ3RHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBQSxjQUFRLEVBQUMsbUNBQW1DLEVBQUUsOENBQThDLENBQUMsQ0FBQztvQkFDOUcsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsRUFBRSxDQUFDOzRCQUNoSSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLDZHQUE2RyxDQUFDLENBQUM7d0JBQ3RLLENBQUM7NkJBQU0sSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQzs0QkFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQywyQ0FBMkMsRUFBRSxnREFBZ0QsQ0FBQyxDQUFDO3dCQUN4SCxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO3dCQUM3RixDQUFDO29CQUNGLENBQUM7b0JBQ0QsSUFBSSxDQUFDLGdCQUFnQixJQUFJLGdCQUFnQixLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUNqRCxJQUFJLENBQUMsT0FBTyxJQUFJLEdBQUcsR0FBRyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSx5Q0FBeUMsQ0FBQyxDQUFDO29CQUM3RixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQztZQUMxQixDQUFDO1lBRUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7UUFDOUIsQ0FBQztRQUdPLGdCQUFnQjtZQUN2QixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEIsQ0FBQztRQUVRLEtBQUs7WUFDYixLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFUSxXQUFXLENBQUMsUUFBaUI7WUFDckMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU1QyxJQUFJLE9BQU8sSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO29CQUM5QixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2pDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRVEsVUFBVSxDQUFDLE9BQWdCO1lBQ25DLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7Z0JBRW5ELElBQUksQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFDekcsOERBQThEO2dCQUM5RCxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFFakYsS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFMUIsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDOUIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxPQUFPLEVBQUUsQ0FBQztnQkFFdEMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztRQUVrQixVQUFVLENBQUMsTUFBYyxFQUFFLEtBQWE7WUFDMUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFa0IsaUJBQWlCLENBQUMsU0FBc0I7WUFDMUQsS0FBSyxDQUFDLGlCQUFpQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFL0MsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUVrQixVQUFVLENBQUMsU0FBc0I7WUFDbkQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUU1QixJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBRWpGLElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUUvQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsY0FBUSxFQUFDLHNDQUFzQyxFQUFFLHdEQUF3RCxDQUFDLENBQUM7WUFFMUgsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSx5QkFBeUIsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUN0RixxREFBcUQ7WUFDckQsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbEMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRyxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN6QyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDdkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLElBQUksR0FBaUQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpQ0FBbUIsRUFBRSxjQUFjLEVBQ3JJLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSwyQkFBMkIsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUNwRSxnQkFBZ0IsRUFBRSxJQUFJLHdCQUF3QixFQUFFO2dCQUNoRCxxQkFBcUIsRUFBRTtvQkFDdEIsWUFBWSxDQUFDLE9BQW9CO3dCQUNoQyxJQUFJLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7NEJBQ2hDLE9BQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQzt3QkFDMUIsQ0FBQzt3QkFDRCxPQUFPLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxvQkFBb0IsSUFBSSxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNsTCxDQUFDO29CQUNELE9BQU8sQ0FBQyxPQUFvQjt3QkFDM0IsSUFBSSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDOzRCQUNoQyxPQUFPLFVBQVUsQ0FBQzt3QkFDbkIsQ0FBQzt3QkFDRCxPQUFPLE9BQU8sQ0FBQyx3QkFBd0IsSUFBSSxPQUFPLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7b0JBQ3ZJLENBQUM7b0JBQ0Qsa0JBQWtCO3dCQUNqQixPQUFPLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztvQkFDekMsQ0FBQztpQkFDRDtnQkFDRCwrQkFBK0IsRUFBRSxJQUFJLHVDQUF1QyxFQUFFO2dCQUM5RSx3QkFBd0IsRUFBRSxLQUFLO2dCQUMvQixjQUFjLEVBQUU7b0JBQ2YsY0FBYyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtpQkFDekM7YUFDRCxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDdEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDO29CQUNqRCxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDM0MsSUFBSSxJQUFJLENBQUM7Z0JBQ1QsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUM1QixJQUFJLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixDQUFDO2dCQUVELElBQUksSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDO29CQUNuQixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDMUIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2xCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQzt3QkFDeEMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSywyQ0FBMEIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxnREFBK0IsRUFBRSxDQUFDOzRCQUMzRywrQ0FBK0M7NEJBQy9DLDJDQUEyQzs0QkFDM0MsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3JCLENBQUM7d0JBRUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztvQkFDOUQsQ0FBQztnQkFDRixDQUFDO3FCQUNJLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDbEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sUUFBUSxDQUFDLElBQXFCO1lBQ3JDLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXpCLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUM1RCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFRCxnQkFBZ0I7WUFDZiwyRkFBMkY7WUFDM0YsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ25KLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBRXJCLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUU1QixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxvQkFBb0I7WUFDbkIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6RSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSw2QkFBNkIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzlGLENBQUM7UUFFTyxhQUFhLENBQUMsUUFBOEIsRUFBRSxTQUFvRDtZQUN6RyxNQUFNLElBQUksR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDO1lBQy9CLElBQUksSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNuQixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFZLFNBQVMsQ0FBQyxZQUFZLENBQUM7WUFFOUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3ZCLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUV4QixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQztnQkFDOUIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDM0IsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQztnQkFDdkMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNO2dCQUNqQyxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTztnQkFDekIsaUJBQWlCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtvQkFDN0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDdEUsSUFBSSxVQUFVLEVBQUUsQ0FBQzt3QkFDaEIsT0FBTyxJQUFJLGdDQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQy9GLENBQUM7b0JBQ0QsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUM7Z0JBQ0QsTUFBTSxFQUFFLENBQUMsWUFBc0IsRUFBRSxFQUFFO29CQUNsQyxJQUFJLFlBQVksRUFBRSxDQUFDO3dCQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN0QixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsaUJBQWlCLEVBQUUsR0FBMEIsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDekUsWUFBWSxFQUFFLElBQUksb0JBQW9CLEVBQUU7YUFDeEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQzs7SUFqekJXLG9DQUFZO0lBNmxCaEI7UUFEUCxJQUFBLHFCQUFRLEVBQUMsR0FBRyxDQUFDO3dEQUdiOzJCQS9sQlcsWUFBWTtRQXNCdEIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLDhCQUFzQixDQUFBO1FBQ3RCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSwwQkFBZSxDQUFBO1FBQ2YsWUFBQSwyQkFBZ0IsQ0FBQTtRQUNoQixZQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFlBQUEsdUJBQWMsQ0FBQTtRQUNkLFlBQUEsNEJBQWEsQ0FBQTtRQUNiLFlBQUEsNkJBQWlCLENBQUE7UUFDakIsWUFBQSxxQkFBYSxDQUFBO1FBQ2IsWUFBQSxpQ0FBbUIsQ0FBQTtRQUNuQixZQUFBLDhCQUFpQixDQUFBO09BdENQLFlBQVksQ0FrekJ4QjtJQUVELE1BQU0sdUJBQXVCO2lCQUNaLE9BQUUsR0FBRyx5QkFBeUIsQ0FBQztRQU8vQyxZQUNDLFNBQXNCLEVBQ3RCLHNCQUErQyxFQUMvQyxhQUE2QjtZQUU3QixTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7WUFFN0UsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLHFCQUFTLENBQUMsU0FBUyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUUxRyxNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUM7WUFDdEcsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDO1lBRWxGLE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDL0UsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLHFCQUFTLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxzQkFBc0IsRUFBRSxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztZQUNyQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3hCLENBQUM7O0lBR0YsTUFBYSx3QkFBd0I7UUFDcEMsS0FBSyxDQUFDLElBQWlCO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO0tBQ0Q7SUFKRCw0REFJQztJQUVELE1BQU0sb0JBQXFCLFNBQVEsc0JBQVk7UUFFM0IsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFlLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUF5QjtZQUN2RixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLCtDQUErQztnQkFDL0MsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ25CLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUNmO2dCQUNDLElBQUksNkNBQW9DO2dCQUN4QyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07Z0JBQ25CLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtnQkFDbkIsR0FBRzthQUNILEVBQ0QsR0FBRyxFQUNILElBQUksQ0FBQyxNQUFNLENBQ1gsQ0FBQztRQUNILENBQUM7S0FDRDtJQUVELE1BQWEsdUNBQXVDO1FBQ25ELDBCQUEwQixDQUFDLE9BQW9CO1lBQzlDLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQztRQUN0QixDQUFDO0tBQ0Q7SUFKRCwwRkFJQztJQUVELE1BQWEsMkJBQTJCO1FBQ3ZDLFNBQVMsQ0FBQyxRQUFxQjtZQUM5QixPQUFPLFVBQVUsQ0FBQztRQUNuQixDQUFDO1FBRUQsYUFBYSxDQUFDLE9BQW9CO1lBQ2pDLE9BQU8sdUJBQXVCLENBQUMsRUFBRSxDQUFDO1FBQ25DLENBQUM7S0FDRDtJQVJELGtFQVFDO0lBRUQsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBb0I7UUFVekIsWUFDa0IsUUFBOEIsRUFDeEIsb0JBQThELEVBQ3RFLFlBQW1DO1lBRmpDLGFBQVEsR0FBUixRQUFRLENBQXNCO1lBQ0wseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM5RCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQVpsQyxzQkFBaUIsR0FBRyxJQUFJLGVBQU8sRUFBbUIsQ0FBQztZQUMzRCxxQkFBZ0IsR0FBMkIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUV4RSxlQUFVLEdBQVcsdUJBQXVCLENBQUMsRUFBRSxDQUFDO1lBV3hELElBQUksQ0FBQyxzQkFBc0IsR0FBRyw4Q0FBb0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQzlGLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBQSw4Q0FBdUIsRUFBQyxPQUFPLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBR0QsTUFBTSxDQUFDLEdBQW9CO1lBQzFCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLENBQUM7UUFFRCxjQUFjLENBQUMsU0FBc0I7WUFDcEMsT0FBTyxJQUFJLHVCQUF1QixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2pHLENBQUM7UUFFRCxhQUFhLENBQ1osSUFBd0MsRUFDeEMsS0FBYSxFQUNiLFFBQWlDLEVBQ2pDLE1BQTBCO1lBRTFCLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVqQixNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQztZQUUvQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ2hELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLEtBQUssbUJBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDMUUsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFFL0MsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxpQ0FBaUMsQ0FBQztnQkFDNUQsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzVELFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDaEMsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDM0IsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsbUNBQW1DLHFCQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUNyRyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQzFCLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDdkYsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ2hDLENBQUM7Z0JBQ0QsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztZQUMxQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsaUNBQWlDLENBQUM7Z0JBQzVELFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7Z0JBQ3pDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDaEMsQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPO2dCQUMzQixDQUFDLENBQUMsSUFBQSxnQkFBUSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7b0JBQ3ZCLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTztvQkFDZCxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxJQUFBLDRDQUF5QixFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDcEcsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUViLFFBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDekQsS0FBSyxFQUFFLE9BQU87Z0JBQ2QsT0FBTyxFQUFFLElBQUEsdUJBQWEsRUFBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2FBQ3ZDLENBQUMsQ0FBQztZQUVILFFBQVEsQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFDO1lBQ3pELFFBQVEsQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsSUFBSSxFQUFFLENBQUM7WUFDL0QsUUFBUSxDQUFDLFNBQVMsQ0FBQyxhQUFjLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQywrQkFBK0IsRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFbkksUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQTJCLENBQUM7WUFDOUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO1lBQzdELFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUUxRix5RkFBeUY7WUFDekYsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUM3QixVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4RCxDQUFDO1FBQ0YsQ0FBQztRQUVELGVBQWUsQ0FBQyxRQUFpQztZQUNoRCxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEIsQ0FBQztLQUNELENBQUE7SUF2Rkssb0JBQW9CO1FBWXZCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw0QkFBYSxDQUFBO09BYlYsb0JBQW9CLENBdUZ6QjtJQUdELE1BQU0sZUFBZSxHQUFHLElBQUEsMkJBQVksRUFBQyxrQkFBa0IsRUFBRSxrQkFBTyxDQUFDLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDLENBQUM7SUFDaEosTUFBTSxXQUFXLEdBQUcsSUFBQSwyQkFBWSxFQUFDLGNBQWMsRUFBRSxrQkFBTyxDQUFDLEdBQUcsRUFBRSxJQUFBLGNBQVEsRUFBQyxhQUFhLEVBQUUsbUNBQW1DLENBQUMsQ0FBQyxDQUFDO0lBQzVILE1BQU0sYUFBYSxHQUFHLElBQUEsMkJBQVksRUFBQyxnQkFBZ0IsRUFBRSxrQkFBTyxDQUFDLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUscUNBQXFDLENBQUMsQ0FBQyxDQUFDO0lBRXZJLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFHNUMsWUFDa0IsSUFBa0IsRUFDQSxlQUFpQyxFQUNsQyxjQUErQixFQUM1QixpQkFBcUMsRUFDM0MsV0FBeUI7WUFFeEQsS0FBSyxFQUFFLENBQUM7WUFOUyxTQUFJLEdBQUosSUFBSSxDQUFjO1lBQ0Esb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ2xDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUM1QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzNDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBSXhELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFFL0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO2dCQUNuRDtvQkFDQyxLQUFLLENBQUM7d0JBQ0wsRUFBRSxFQUFFLGtCQUFrQjt3QkFDdEIsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLFNBQVMsRUFBRSxTQUFTLENBQUM7d0JBQ3RDLElBQUksRUFBRSxlQUFlO3dCQUNyQixRQUFRLEVBQUUsSUFBQSxlQUFTLEVBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQzt3QkFDM0MsSUFBSSxFQUFFOzRCQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGFBQWE7NEJBQ3hCLEtBQUssRUFBRSxZQUFZOzRCQUNuQixLQUFLLEVBQUUsRUFBRTt5QkFDVDtxQkFDRCxDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFDRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7b0JBQzdDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDZCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLDJCQUFnQixDQUFDLGVBQWUsQ0FBQyxtQ0FBbUMsRUFDbEYsQ0FBQyxRQUEwQixFQUFFLEdBQUcsSUFBVyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQ2xHLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxTQUFTLENBQUMsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDakUsT0FBTyxFQUFFO29CQUNSLEVBQUUsRUFBRSxtQ0FBbUM7b0JBQ3ZDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxpREFBaUQsRUFBRSwwQkFBMEIsQ0FBQztvQkFDL0YsSUFBSSxFQUFFLFdBQVc7b0JBQ2pCLFFBQVEsRUFBRSxJQUFBLGVBQVMsRUFBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO2lCQUMzQztnQkFDRCxLQUFLLEVBQUUsWUFBWTtnQkFDbkIsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLHlDQUFpQzthQUN2QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUwsSUFBSSxDQUFDLFNBQVMsQ0FBQyxzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNqRSxPQUFPLEVBQUU7b0JBQ1IsRUFBRSxFQUFFLG1DQUFtQztvQkFDdkMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLG1EQUFtRCxFQUFFLDRCQUE0QixDQUFDO29CQUNuRyxJQUFJLEVBQUUsYUFBYTtvQkFDbkIsUUFBUSxFQUFFLElBQUEsZUFBUyxFQUFDLFVBQVUsRUFBRSxVQUFVLENBQUM7aUJBQzNDO2dCQUNELEtBQUssRUFBRSxZQUFZO2dCQUNuQixLQUFLLEVBQUUsRUFBRTtnQkFDVCxJQUFJLEVBQUUseUNBQWlDLENBQUMsU0FBUyxFQUFFO2FBQ25ELENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFTCxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0YsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7UUFDcEMsQ0FBQztRQUVELGNBQWMsQ0FBQyxPQUFvQjtZQUNsQyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsZ0JBQU0sQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLEdBQUcsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNsSCxDQUFDO1FBRUQscUJBQXFCLENBQUMsT0FBb0I7WUFDekMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFNLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxHQUFHLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDcEgsQ0FBQztRQUVPLFVBQVUsQ0FBQyxNQUFjLEVBQUUsT0FBd0M7WUFDMUUsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDO2dCQUM5RCxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUM7YUFDNUIsQ0FBQyxDQUFDO1lBRUgsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDcEUsTUFBTSxPQUFPLEdBQWMsRUFBRSxDQUFDO1lBQzlCLE1BQU0sU0FBUyxHQUFjLEVBQUUsQ0FBQztZQUNoQyxNQUFNLE1BQU0sR0FBRyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQztZQUN0QyxJQUFBLDJEQUFpQyxFQUFDLElBQUksRUFBRSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUV2RixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFZixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTywyQkFBMkI7WUFDbEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBRS9CLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMseUJBQXlCLGdDQUF3QixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckgsS0FBSyxNQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ3hELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztvQkFDL0Q7d0JBQ0MsS0FBSyxDQUFDOzRCQUNMLEVBQUUsRUFBRSxnQ0FBZ0MsTUFBTSxDQUFDLEVBQUUsRUFBRTs0QkFDL0MsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLOzRCQUNuQixJQUFJLEVBQUU7Z0NBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMscUJBQXFCO2dDQUNoQyxLQUFLLEVBQUUsWUFBWTs2QkFDbkI7NEJBQ0QsT0FBTyxFQUFFLDJCQUFjLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBQSxnQ0FBc0IsRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFO3lCQUMxSCxDQUFDLENBQUM7b0JBQ0osQ0FBQztvQkFDRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7d0JBQzdDLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQzs0QkFDN0IsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQzVCLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDekIsQ0FBQzt3QkFFRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQzt3QkFDckQsY0FBYyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQywyREFBMkMsQ0FBQztvQkFDakksQ0FBQztpQkFDRCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQXhISyxvQkFBb0I7UUFLdkIsV0FBQSwyQkFBZ0IsQ0FBQTtRQUNoQixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsc0JBQVksQ0FBQTtPQVJULG9CQUFvQixDQXdIekIifQ==