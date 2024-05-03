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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/editorDom", "vs/editor/browser/stableEditorScroll", "vs/editor/common/config/editorOptions", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/resolverService", "vs/editor/contrib/gotoSymbol/browser/link/clickLinkGesture", "vs/editor/contrib/inlayHints/browser/inlayHints", "vs/editor/contrib/inlayHints/browser/inlayHintsLocations", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, dom_1, arrays_1, async_1, cancellation_1, errors_1, lifecycle_1, map_1, types_1, uri_1, editorDom_1, stableEditorScroll_1, editorOptions_1, editOperation_1, range_1, languages, model_1, textModel_1, languageFeatureDebounce_1, languageFeatures_1, resolverService_1, clickLinkGesture_1, inlayHints_1, inlayHintsLocations_1, commands_1, extensions_1, instantiation_1, notification_1, colors, themeService_1) {
    "use strict";
    var InlayHintsController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlayHintsController = exports.RenderedInlayHintLabelPart = void 0;
    // --- hint caching service (per session)
    class InlayHintsCache {
        constructor() {
            this._entries = new map_1.LRUCache(50);
        }
        get(model) {
            const key = InlayHintsCache._key(model);
            return this._entries.get(key);
        }
        set(model, value) {
            const key = InlayHintsCache._key(model);
            this._entries.set(key, value);
        }
        static _key(model) {
            return `${model.uri.toString()}/${model.getVersionId()}`;
        }
    }
    const IInlayHintsCache = (0, instantiation_1.createDecorator)('IInlayHintsCache');
    (0, extensions_1.registerSingleton)(IInlayHintsCache, InlayHintsCache, 1 /* InstantiationType.Delayed */);
    // --- rendered label
    class RenderedInlayHintLabelPart {
        constructor(item, index) {
            this.item = item;
            this.index = index;
        }
        get part() {
            const label = this.item.hint.label;
            if (typeof label === 'string') {
                return { label };
            }
            else {
                return label[this.index];
            }
        }
    }
    exports.RenderedInlayHintLabelPart = RenderedInlayHintLabelPart;
    class ActiveInlayHintInfo {
        constructor(part, hasTriggerModifier) {
            this.part = part;
            this.hasTriggerModifier = hasTriggerModifier;
        }
    }
    var RenderMode;
    (function (RenderMode) {
        RenderMode[RenderMode["Normal"] = 0] = "Normal";
        RenderMode[RenderMode["Invisible"] = 1] = "Invisible";
    })(RenderMode || (RenderMode = {}));
    // --- controller
    let InlayHintsController = class InlayHintsController {
        static { InlayHintsController_1 = this; }
        static { this.ID = 'editor.contrib.InlayHints'; }
        static { this._MAX_DECORATORS = 1500; }
        static { this._MAX_LABEL_LEN = 43; }
        static get(editor) {
            return editor.getContribution(InlayHintsController_1.ID) ?? undefined;
        }
        constructor(_editor, _languageFeaturesService, _featureDebounce, _inlayHintsCache, _commandService, _notificationService, _instaService) {
            this._editor = _editor;
            this._languageFeaturesService = _languageFeaturesService;
            this._inlayHintsCache = _inlayHintsCache;
            this._commandService = _commandService;
            this._notificationService = _notificationService;
            this._instaService = _instaService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._decorationsMetadata = new Map();
            this._ruleFactory = new editorDom_1.DynamicCssRules(this._editor);
            this._activeRenderMode = 0 /* RenderMode.Normal */;
            this._debounceInfo = _featureDebounce.for(_languageFeaturesService.inlayHintsProvider, 'InlayHint', { min: 25 });
            this._disposables.add(_languageFeaturesService.inlayHintsProvider.onDidChange(() => this._update()));
            this._disposables.add(_editor.onDidChangeModel(() => this._update()));
            this._disposables.add(_editor.onDidChangeModelLanguage(() => this._update()));
            this._disposables.add(_editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(141 /* EditorOption.inlayHints */)) {
                    this._update();
                }
            }));
            this._update();
        }
        dispose() {
            this._sessionDisposables.dispose();
            this._removeAllDecorations();
            this._disposables.dispose();
        }
        _update() {
            this._sessionDisposables.clear();
            this._removeAllDecorations();
            const options = this._editor.getOption(141 /* EditorOption.inlayHints */);
            if (options.enabled === 'off') {
                return;
            }
            const model = this._editor.getModel();
            if (!model || !this._languageFeaturesService.inlayHintsProvider.has(model)) {
                return;
            }
            if (options.enabled === 'on') {
                // different "on" modes: always
                this._activeRenderMode = 0 /* RenderMode.Normal */;
            }
            else {
                // different "on" modes: offUnlessPressed, or onUnlessPressed
                let defaultMode;
                let altMode;
                if (options.enabled === 'onUnlessPressed') {
                    defaultMode = 0 /* RenderMode.Normal */;
                    altMode = 1 /* RenderMode.Invisible */;
                }
                else {
                    defaultMode = 1 /* RenderMode.Invisible */;
                    altMode = 0 /* RenderMode.Normal */;
                }
                this._activeRenderMode = defaultMode;
                this._sessionDisposables.add(dom_1.ModifierKeyEmitter.getInstance().event(e => {
                    if (!this._editor.hasModel()) {
                        return;
                    }
                    const newRenderMode = e.altKey && e.ctrlKey && !(e.shiftKey || e.metaKey) ? altMode : defaultMode;
                    if (newRenderMode !== this._activeRenderMode) {
                        this._activeRenderMode = newRenderMode;
                        const model = this._editor.getModel();
                        const copies = this._copyInlayHintsWithCurrentAnchor(model);
                        this._updateHintsDecorators([model.getFullModelRange()], copies);
                        scheduler.schedule(0);
                    }
                }));
            }
            // iff possible, quickly update from cache
            const cached = this._inlayHintsCache.get(model);
            if (cached) {
                this._updateHintsDecorators([model.getFullModelRange()], cached);
            }
            this._sessionDisposables.add((0, lifecycle_1.toDisposable)(() => {
                // cache items when switching files etc
                if (!model.isDisposed()) {
                    this._cacheHintsForFastRestore(model);
                }
            }));
            let cts;
            const watchedProviders = new Set();
            const scheduler = new async_1.RunOnceScheduler(async () => {
                const t1 = Date.now();
                cts?.dispose(true);
                cts = new cancellation_1.CancellationTokenSource();
                const listener = model.onWillDispose(() => cts?.cancel());
                try {
                    const myToken = cts.token;
                    const inlayHints = await inlayHints_1.InlayHintsFragments.create(this._languageFeaturesService.inlayHintsProvider, model, this._getHintsRanges(), myToken);
                    scheduler.delay = this._debounceInfo.update(model, Date.now() - t1);
                    if (myToken.isCancellationRequested) {
                        inlayHints.dispose();
                        return;
                    }
                    // listen to provider changes
                    for (const provider of inlayHints.provider) {
                        if (typeof provider.onDidChangeInlayHints === 'function' && !watchedProviders.has(provider)) {
                            watchedProviders.add(provider);
                            this._sessionDisposables.add(provider.onDidChangeInlayHints(() => {
                                if (!scheduler.isScheduled()) { // ignore event when request is already scheduled
                                    scheduler.schedule();
                                }
                            }));
                        }
                    }
                    this._sessionDisposables.add(inlayHints);
                    this._updateHintsDecorators(inlayHints.ranges, inlayHints.items);
                    this._cacheHintsForFastRestore(model);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                finally {
                    cts.dispose();
                    listener.dispose();
                }
            }, this._debounceInfo.get(model));
            this._sessionDisposables.add(scheduler);
            this._sessionDisposables.add((0, lifecycle_1.toDisposable)(() => cts?.dispose(true)));
            scheduler.schedule(0);
            this._sessionDisposables.add(this._editor.onDidScrollChange((e) => {
                // update when scroll position changes
                // uses scrollTopChanged has weak heuristic to differenatiate between scrolling due to
                // typing or due to "actual" scrolling
                if (e.scrollTopChanged || !scheduler.isScheduled()) {
                    scheduler.schedule();
                }
            }));
            this._sessionDisposables.add(this._editor.onDidChangeModelContent((e) => {
                cts?.cancel();
                // update less aggressive when typing
                const delay = Math.max(scheduler.delay, 1250);
                scheduler.schedule(delay);
            }));
            // mouse gestures
            this._sessionDisposables.add(this._installDblClickGesture(() => scheduler.schedule(0)));
            this._sessionDisposables.add(this._installLinkGesture());
            this._sessionDisposables.add(this._installContextMenu());
        }
        _installLinkGesture() {
            const store = new lifecycle_1.DisposableStore();
            const gesture = store.add(new clickLinkGesture_1.ClickLinkGesture(this._editor));
            // let removeHighlight = () => { };
            const sessionStore = new lifecycle_1.DisposableStore();
            store.add(sessionStore);
            store.add(gesture.onMouseMoveOrRelevantKeyDown(e => {
                const [mouseEvent] = e;
                const labelPart = this._getInlayHintLabelPart(mouseEvent);
                const model = this._editor.getModel();
                if (!labelPart || !model) {
                    sessionStore.clear();
                    return;
                }
                // resolve the item
                const cts = new cancellation_1.CancellationTokenSource();
                sessionStore.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
                labelPart.item.resolve(cts.token);
                // render link => when the modifier is pressed and when there is a command or location
                this._activeInlayHintPart = labelPart.part.command || labelPart.part.location
                    ? new ActiveInlayHintInfo(labelPart, mouseEvent.hasTriggerModifier)
                    : undefined;
                const lineNumber = model.validatePosition(labelPart.item.hint.position).lineNumber;
                const range = new range_1.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber));
                const lineHints = this._getInlineHintsForRange(range);
                this._updateHintsDecorators([range], lineHints);
                sessionStore.add((0, lifecycle_1.toDisposable)(() => {
                    this._activeInlayHintPart = undefined;
                    this._updateHintsDecorators([range], lineHints);
                }));
            }));
            store.add(gesture.onCancel(() => sessionStore.clear()));
            store.add(gesture.onExecute(async (e) => {
                const label = this._getInlayHintLabelPart(e);
                if (label) {
                    const part = label.part;
                    if (part.location) {
                        // location -> execute go to def
                        this._instaService.invokeFunction(inlayHintsLocations_1.goToDefinitionWithLocation, e, this._editor, part.location);
                    }
                    else if (languages.Command.is(part.command)) {
                        // command -> execute it
                        await this._invokeCommand(part.command, label.item);
                    }
                }
            }));
            return store;
        }
        _getInlineHintsForRange(range) {
            const lineHints = new Set();
            for (const data of this._decorationsMetadata.values()) {
                if (range.containsRange(data.item.anchor.range)) {
                    lineHints.add(data.item);
                }
            }
            return Array.from(lineHints);
        }
        _installDblClickGesture(updateInlayHints) {
            return this._editor.onMouseUp(async (e) => {
                if (e.event.detail !== 2) {
                    return;
                }
                const part = this._getInlayHintLabelPart(e);
                if (!part) {
                    return;
                }
                e.event.preventDefault();
                await part.item.resolve(cancellation_1.CancellationToken.None);
                if ((0, arrays_1.isNonEmptyArray)(part.item.hint.textEdits)) {
                    const edits = part.item.hint.textEdits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text));
                    this._editor.executeEdits('inlayHint.default', edits);
                    updateInlayHints();
                }
            });
        }
        _installContextMenu() {
            return this._editor.onContextMenu(async (e) => {
                if (!(e.event.target instanceof HTMLElement)) {
                    return;
                }
                const part = this._getInlayHintLabelPart(e);
                if (part) {
                    await this._instaService.invokeFunction(inlayHintsLocations_1.showGoToContextMenu, this._editor, e.event.target, part);
                }
            });
        }
        _getInlayHintLabelPart(e) {
            if (e.target.type !== 6 /* MouseTargetType.CONTENT_TEXT */) {
                return undefined;
            }
            const options = e.target.detail.injectedText?.options;
            if (options instanceof textModel_1.ModelDecorationInjectedTextOptions && options?.attachedData instanceof RenderedInlayHintLabelPart) {
                return options.attachedData;
            }
            return undefined;
        }
        async _invokeCommand(command, item) {
            try {
                await this._commandService.executeCommand(command.id, ...(command.arguments ?? []));
            }
            catch (err) {
                this._notificationService.notify({
                    severity: notification_1.Severity.Error,
                    source: item.provider.displayName,
                    message: err
                });
            }
        }
        _cacheHintsForFastRestore(model) {
            const hints = this._copyInlayHintsWithCurrentAnchor(model);
            this._inlayHintsCache.set(model, hints);
        }
        // return inlay hints but with an anchor that reflects "updates"
        // that happened after receiving them, e.g adding new lines before a hint
        _copyInlayHintsWithCurrentAnchor(model) {
            const items = new Map();
            for (const [id, obj] of this._decorationsMetadata) {
                if (items.has(obj.item)) {
                    // an inlay item can be rendered as multiple decorations
                    // but they will all uses the same range
                    continue;
                }
                const range = model.getDecorationRange(id);
                if (range) {
                    // update range with whatever the editor has tweaked it to
                    const anchor = new inlayHints_1.InlayHintAnchor(range, obj.item.anchor.direction);
                    const copy = obj.item.with({ anchor });
                    items.set(obj.item, copy);
                }
            }
            return Array.from(items.values());
        }
        _getHintsRanges() {
            const extra = 30;
            const model = this._editor.getModel();
            const visibleRanges = this._editor.getVisibleRangesPlusViewportAboveBelow();
            const result = [];
            for (const range of visibleRanges.sort(range_1.Range.compareRangesUsingStarts)) {
                const extendedRange = model.validateRange(new range_1.Range(range.startLineNumber - extra, range.startColumn, range.endLineNumber + extra, range.endColumn));
                if (result.length === 0 || !range_1.Range.areIntersectingOrTouching(result[result.length - 1], extendedRange)) {
                    result.push(extendedRange);
                }
                else {
                    result[result.length - 1] = range_1.Range.plusRange(result[result.length - 1], extendedRange);
                }
            }
            return result;
        }
        _updateHintsDecorators(ranges, items) {
            // utils to collect/create injected text decorations
            const newDecorationsData = [];
            const addInjectedText = (item, ref, content, cursorStops, attachedData) => {
                const opts = {
                    content,
                    inlineClassNameAffectsLetterSpacing: true,
                    inlineClassName: ref.className,
                    cursorStops,
                    attachedData
                };
                newDecorationsData.push({
                    item,
                    classNameRef: ref,
                    decoration: {
                        range: item.anchor.range,
                        options: {
                            // className: "rangeHighlight", // DEBUG highlight to see to what range a hint is attached
                            description: 'InlayHint',
                            showIfCollapsed: item.anchor.range.isEmpty(), // "original" range is empty
                            collapseOnReplaceEdit: !item.anchor.range.isEmpty(),
                            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
                            [item.anchor.direction]: this._activeRenderMode === 0 /* RenderMode.Normal */ ? opts : undefined
                        }
                    }
                });
            };
            const addInjectedWhitespace = (item, isLast) => {
                const marginRule = this._ruleFactory.createClassNameRef({
                    width: `${(fontSize / 3) | 0}px`,
                    display: 'inline-block'
                });
                addInjectedText(item, marginRule, '\u200a', isLast ? model_1.InjectedTextCursorStops.Right : model_1.InjectedTextCursorStops.None);
            };
            //
            const { fontSize, fontFamily, padding, isUniform } = this._getLayoutInfo();
            const fontFamilyVar = '--code-editorInlayHintsFontFamily';
            this._editor.getContainerDomNode().style.setProperty(fontFamilyVar, fontFamily);
            let currentLineInfo = { line: 0, totalLen: 0 };
            for (const item of items) {
                if (currentLineInfo.line !== item.anchor.range.startLineNumber) {
                    currentLineInfo = { line: item.anchor.range.startLineNumber, totalLen: 0 };
                }
                if (currentLineInfo.totalLen > InlayHintsController_1._MAX_LABEL_LEN) {
                    continue;
                }
                // whitespace leading the actual label
                if (item.hint.paddingLeft) {
                    addInjectedWhitespace(item, false);
                }
                // the label with its parts
                const parts = typeof item.hint.label === 'string'
                    ? [{ label: item.hint.label }]
                    : item.hint.label;
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    const isFirst = i === 0;
                    const isLast = i === parts.length - 1;
                    const cssProperties = {
                        fontSize: `${fontSize}px`,
                        fontFamily: `var(${fontFamilyVar}), ${editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily}`,
                        verticalAlign: isUniform ? 'baseline' : 'middle',
                        unicodeBidi: 'isolate'
                    };
                    if ((0, arrays_1.isNonEmptyArray)(item.hint.textEdits)) {
                        cssProperties.cursor = 'default';
                    }
                    this._fillInColors(cssProperties, item.hint);
                    if ((part.command || part.location) && this._activeInlayHintPart?.part.item === item && this._activeInlayHintPart.part.index === i) {
                        // active link!
                        cssProperties.textDecoration = 'underline';
                        if (this._activeInlayHintPart.hasTriggerModifier) {
                            cssProperties.color = (0, themeService_1.themeColorFromId)(colors.editorActiveLinkForeground);
                            cssProperties.cursor = 'pointer';
                        }
                    }
                    if (padding) {
                        if (isFirst && isLast) {
                            // only element
                            cssProperties.padding = `1px ${Math.max(1, fontSize / 4) | 0}px`;
                            cssProperties.borderRadius = `${(fontSize / 4) | 0}px`;
                        }
                        else if (isFirst) {
                            // first element
                            cssProperties.padding = `1px 0 1px ${Math.max(1, fontSize / 4) | 0}px`;
                            cssProperties.borderRadius = `${(fontSize / 4) | 0}px 0 0 ${(fontSize / 4) | 0}px`;
                        }
                        else if (isLast) {
                            // last element
                            cssProperties.padding = `1px ${Math.max(1, fontSize / 4) | 0}px 1px 0`;
                            cssProperties.borderRadius = `0 ${(fontSize / 4) | 0}px ${(fontSize / 4) | 0}px 0`;
                        }
                        else {
                            cssProperties.padding = `1px 0 1px 0`;
                        }
                    }
                    let textlabel = part.label;
                    currentLineInfo.totalLen += textlabel.length;
                    let tooLong = false;
                    const over = currentLineInfo.totalLen - InlayHintsController_1._MAX_LABEL_LEN;
                    if (over > 0) {
                        textlabel = textlabel.slice(0, -over) + '…';
                        tooLong = true;
                    }
                    addInjectedText(item, this._ruleFactory.createClassNameRef(cssProperties), fixSpace(textlabel), isLast && !item.hint.paddingRight ? model_1.InjectedTextCursorStops.Right : model_1.InjectedTextCursorStops.None, new RenderedInlayHintLabelPart(item, i));
                    if (tooLong) {
                        break;
                    }
                }
                // whitespace trailing the actual label
                if (item.hint.paddingRight) {
                    addInjectedWhitespace(item, true);
                }
                if (newDecorationsData.length > InlayHintsController_1._MAX_DECORATORS) {
                    break;
                }
            }
            // collect all decoration ids that are affected by the ranges
            // and only update those decorations
            const decorationIdsToReplace = [];
            for (const [id, metadata] of this._decorationsMetadata) {
                const range = this._editor.getModel()?.getDecorationRange(id);
                if (range && ranges.some(r => r.containsRange(range))) {
                    decorationIdsToReplace.push(id);
                    metadata.classNameRef.dispose();
                    this._decorationsMetadata.delete(id);
                }
            }
            const scrollState = stableEditorScroll_1.StableEditorScrollState.capture(this._editor);
            this._editor.changeDecorations(accessor => {
                const newDecorationIds = accessor.deltaDecorations(decorationIdsToReplace, newDecorationsData.map(d => d.decoration));
                for (let i = 0; i < newDecorationIds.length; i++) {
                    const data = newDecorationsData[i];
                    this._decorationsMetadata.set(newDecorationIds[i], data);
                }
            });
            scrollState.restore(this._editor);
        }
        _fillInColors(props, hint) {
            if (hint.kind === languages.InlayHintKind.Parameter) {
                props.backgroundColor = (0, themeService_1.themeColorFromId)(colors.editorInlayHintParameterBackground);
                props.color = (0, themeService_1.themeColorFromId)(colors.editorInlayHintParameterForeground);
            }
            else if (hint.kind === languages.InlayHintKind.Type) {
                props.backgroundColor = (0, themeService_1.themeColorFromId)(colors.editorInlayHintTypeBackground);
                props.color = (0, themeService_1.themeColorFromId)(colors.editorInlayHintTypeForeground);
            }
            else {
                props.backgroundColor = (0, themeService_1.themeColorFromId)(colors.editorInlayHintBackground);
                props.color = (0, themeService_1.themeColorFromId)(colors.editorInlayHintForeground);
            }
        }
        _getLayoutInfo() {
            const options = this._editor.getOption(141 /* EditorOption.inlayHints */);
            const padding = options.padding;
            const editorFontSize = this._editor.getOption(52 /* EditorOption.fontSize */);
            const editorFontFamily = this._editor.getOption(49 /* EditorOption.fontFamily */);
            let fontSize = options.fontSize;
            if (!fontSize || fontSize < 5 || fontSize > editorFontSize) {
                fontSize = editorFontSize;
            }
            const fontFamily = options.fontFamily || editorFontFamily;
            const isUniform = !padding
                && fontFamily === editorFontFamily
                && fontSize === editorFontSize;
            return { fontSize, fontFamily, padding, isUniform };
        }
        _removeAllDecorations() {
            this._editor.removeDecorations(Array.from(this._decorationsMetadata.keys()));
            for (const obj of this._decorationsMetadata.values()) {
                obj.classNameRef.dispose();
            }
            this._decorationsMetadata.clear();
        }
        // --- accessibility
        getInlayHintsForLine(line) {
            if (!this._editor.hasModel()) {
                return [];
            }
            const set = new Set();
            const result = [];
            for (const deco of this._editor.getLineDecorations(line)) {
                const data = this._decorationsMetadata.get(deco.id);
                if (data && !set.has(data.item.hint)) {
                    set.add(data.item.hint);
                    result.push(data.item);
                }
            }
            return result;
        }
    };
    exports.InlayHintsController = InlayHintsController;
    exports.InlayHintsController = InlayHintsController = InlayHintsController_1 = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(3, IInlayHintsCache),
        __param(4, commands_1.ICommandService),
        __param(5, notification_1.INotificationService),
        __param(6, instantiation_1.IInstantiationService)
    ], InlayHintsController);
    // Prevents the view from potentially visible whitespace
    function fixSpace(str) {
        const noBreakWhitespace = '\xa0';
        return str.replace(/[ \t]/g, noBreakWhitespace);
    }
    commands_1.CommandsRegistry.registerCommand('_executeInlayHintProvider', async (accessor, ...args) => {
        const [uri, range] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(uri));
        (0, types_1.assertType)(range_1.Range.isIRange(range));
        const { inlayHintsProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const ref = await accessor.get(resolverService_1.ITextModelService).createModelReference(uri);
        try {
            const model = await inlayHints_1.InlayHintsFragments.create(inlayHintsProvider, ref.object.textEditorModel, [range_1.Range.lift(range)], cancellation_1.CancellationToken.None);
            const result = model.items.map(i => i.hint);
            setTimeout(() => model.dispose(), 0); // dispose after sending to ext host
            return result;
        }
        finally {
            ref.dispose();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5sYXlIaW50c0NvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGF5SGludHMvYnJvd3Nlci9pbmxheUhpbnRzQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBbUNoRyx5Q0FBeUM7SUFFekMsTUFBTSxlQUFlO1FBQXJCO1lBSWtCLGFBQVEsR0FBRyxJQUFJLGNBQVEsQ0FBMEIsRUFBRSxDQUFDLENBQUM7UUFldkUsQ0FBQztRQWJBLEdBQUcsQ0FBQyxLQUFpQjtZQUNwQixNQUFNLEdBQUcsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELEdBQUcsQ0FBQyxLQUFpQixFQUFFLEtBQXNCO1lBQzVDLE1BQU0sR0FBRyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFTyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQWlCO1lBQ3BDLE9BQU8sR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLEtBQUssQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDO1FBQzFELENBQUM7S0FDRDtJQUdELE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSwrQkFBZSxFQUFtQixrQkFBa0IsQ0FBQyxDQUFDO0lBQy9FLElBQUEsOEJBQWlCLEVBQUMsZ0JBQWdCLEVBQUUsZUFBZSxvQ0FBNEIsQ0FBQztJQUVoRixxQkFBcUI7SUFFckIsTUFB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