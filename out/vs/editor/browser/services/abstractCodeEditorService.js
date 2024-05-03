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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/common/editorCommon", "vs/editor/common/model", "vs/platform/theme/common/themeService"], function (require, exports, dom, event_1, lifecycle_1, linkedList_1, strings, uri_1, editorCommon_1, model_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports._CSS_MAP = exports.GlobalStyleSheet = exports.ModelTransientSettingWatcher = exports.AbstractCodeEditorService = void 0;
    let AbstractCodeEditorService = class AbstractCodeEditorService extends lifecycle_1.Disposable {
        constructor(_themeService) {
            super();
            this._themeService = _themeService;
            this._onWillCreateCodeEditor = this._register(new event_1.Emitter());
            this.onWillCreateCodeEditor = this._onWillCreateCodeEditor.event;
            this._onCodeEditorAdd = this._register(new event_1.Emitter());
            this.onCodeEditorAdd = this._onCodeEditorAdd.event;
            this._onCodeEditorRemove = this._register(new event_1.Emitter());
            this.onCodeEditorRemove = this._onCodeEditorRemove.event;
            this._onWillCreateDiffEditor = this._register(new event_1.Emitter());
            this.onWillCreateDiffEditor = this._onWillCreateDiffEditor.event;
            this._onDiffEditorAdd = this._register(new event_1.Emitter());
            this.onDiffEditorAdd = this._onDiffEditorAdd.event;
            this._onDiffEditorRemove = this._register(new event_1.Emitter());
            this.onDiffEditorRemove = this._onDiffEditorRemove.event;
            this._onDidChangeTransientModelProperty = this._register(new event_1.Emitter());
            this.onDidChangeTransientModelProperty = this._onDidChangeTransientModelProperty.event;
            this._onDecorationTypeRegistered = this._register(new event_1.Emitter());
            this.onDecorationTypeRegistered = this._onDecorationTypeRegistered.event;
            this._decorationOptionProviders = new Map();
            this._editorStyleSheets = new Map();
            this._codeEditorOpenHandlers = new linkedList_1.LinkedList();
            this._transientWatchers = {};
            this._modelProperties = new Map();
            this._codeEditors = Object.create(null);
            this._diffEditors = Object.create(null);
            this._globalStyleSheet = null;
        }
        willCreateCodeEditor() {
            this._onWillCreateCodeEditor.fire();
        }
        addCodeEditor(editor) {
            this._codeEditors[editor.getId()] = editor;
            this._onCodeEditorAdd.fire(editor);
        }
        removeCodeEditor(editor) {
            if (delete this._codeEditors[editor.getId()]) {
                this._onCodeEditorRemove.fire(editor);
            }
        }
        listCodeEditors() {
            return Object.keys(this._codeEditors).map(id => this._codeEditors[id]);
        }
        willCreateDiffEditor() {
            this._onWillCreateDiffEditor.fire();
        }
        addDiffEditor(editor) {
            this._diffEditors[editor.getId()] = editor;
            this._onDiffEditorAdd.fire(editor);
        }
        removeDiffEditor(editor) {
            if (delete this._diffEditors[editor.getId()]) {
                this._onDiffEditorRemove.fire(editor);
            }
        }
        listDiffEditors() {
            return Object.keys(this._diffEditors).map(id => this._diffEditors[id]);
        }
        getFocusedCodeEditor() {
            let editorWithWidgetFocus = null;
            const editors = this.listCodeEditors();
            for (const editor of editors) {
                if (editor.hasTextFocus()) {
                    // bingo!
                    return editor;
                }
                if (editor.hasWidgetFocus()) {
                    editorWithWidgetFocus = editor;
                }
            }
            return editorWithWidgetFocus;
        }
        _getOrCreateGlobalStyleSheet() {
            if (!this._globalStyleSheet) {
                this._globalStyleSheet = this._createGlobalStyleSheet();
            }
            return this._globalStyleSheet;
        }
        _createGlobalStyleSheet() {
            return new GlobalStyleSheet(dom.createStyleSheet());
        }
        _getOrCreateStyleSheet(editor) {
            if (!editor) {
                return this._getOrCreateGlobalStyleSheet();
            }
            const domNode = editor.getContainerDomNode();
            if (!dom.isInShadowDOM(domNode)) {
                return this._getOrCreateGlobalStyleSheet();
            }
            const editorId = editor.getId();
            if (!this._editorStyleSheets.has(editorId)) {
                const refCountedStyleSheet = new RefCountedStyleSheet(this, editorId, dom.createStyleSheet(domNode));
                this._editorStyleSheets.set(editorId, refCountedStyleSheet);
            }
            return this._editorStyleSheets.get(editorId);
        }
        _removeEditorStyleSheets(editorId) {
            this._editorStyleSheets.delete(editorId);
        }
        registerDecorationType(description, key, options, parentTypeKey, editor) {
            let provider = this._decorationOptionProviders.get(key);
            if (!provider) {
                const styleSheet = this._getOrCreateStyleSheet(editor);
                const providerArgs = {
                    styleSheet: styleSheet,
                    key: key,
                    parentTypeKey: parentTypeKey,
                    options: options || Object.create(null)
                };
                if (!parentTypeKey) {
                    provider = new DecorationTypeOptionsProvider(description, this._themeService, styleSheet, providerArgs);
                }
                else {
                    provider = new DecorationSubTypeOptionsProvider(this._themeService, styleSheet, providerArgs);
                }
                this._decorationOptionProviders.set(key, provider);
                this._onDecorationTypeRegistered.fire(key);
            }
            provider.refCount++;
            return {
                dispose: () => {
                    this.removeDecorationType(key);
                }
            };
        }
        listDecorationTypes() {
            return Array.from(this._decorationOptionProviders.keys());
        }
        removeDecorationType(key) {
            const provider = this._decorationOptionProviders.get(key);
            if (provider) {
                provider.refCount--;
                if (provider.refCount <= 0) {
                    this._decorationOptionProviders.delete(key);
                    provider.dispose();
                    this.listCodeEditors().forEach((ed) => ed.removeDecorationsByType(key));
                }
            }
        }
        resolveDecorationOptions(decorationTypeKey, writable) {
            const provider = this._decorationOptionProviders.get(decorationTypeKey);
            if (!provider) {
                throw new Error('Unknown decoration type key: ' + decorationTypeKey);
            }
            return provider.getOptions(this, writable);
        }
        resolveDecorationCSSRules(decorationTypeKey) {
            const provider = this._decorationOptionProviders.get(decorationTypeKey);
            if (!provider) {
                return null;
            }
            return provider.resolveDecorationCSSRules();
        }
        setModelProperty(resource, key, value) {
            const key1 = resource.toString();
            let dest;
            if (this._modelProperties.has(key1)) {
                dest = this._modelProperties.get(key1);
            }
            else {
                dest = new Map();
                this._modelProperties.set(key1, dest);
            }
            dest.set(key, value);
        }
        getModelProperty(resource, key) {
            const key1 = resource.toString();
            if (this._modelProperties.has(key1)) {
                const innerMap = this._modelProperties.get(key1);
                return innerMap.get(key);
            }
            return undefined;
        }
        setTransientModelProperty(model, key, value) {
            const uri = model.uri.toString();
            let w;
            if (this._transientWatchers.hasOwnProperty(uri)) {
                w = this._transientWatchers[uri];
            }
            else {
                w = new ModelTransientSettingWatcher(uri, model, this);
                this._transientWatchers[uri] = w;
            }
            const previousValue = w.get(key);
            if (previousValue !== value) {
                w.set(key, value);
                this._onDidChangeTransientModelProperty.fire(model);
            }
        }
        getTransientModelProperty(model, key) {
            const uri = model.uri.toString();
            if (!this._transientWatchers.hasOwnProperty(uri)) {
                return undefined;
            }
            return this._transientWatchers[uri].get(key);
        }
        getTransientModelProperties(model) {
            const uri = model.uri.toString();
            if (!this._transientWatchers.hasOwnProperty(uri)) {
                return undefined;
            }
            return this._transientWatchers[uri].keys().map(key => [key, this._transientWatchers[uri].get(key)]);
        }
        _removeWatcher(w) {
            delete this._transientWatchers[w.uri];
        }
        async openCodeEditor(input, source, sideBySide) {
            for (const handler of this._codeEditorOpenHandlers) {
                const candidate = await handler(input, source, sideBySide);
                if (candidate !== null) {
                    return candidate;
                }
            }
            return null;
        }
        registerCodeEditorOpenHandler(handler) {
            const rm = this._codeEditorOpenHandlers.unshift(handler);
            return (0, lifecycle_1.toDisposable)(rm);
        }
    };
    exports.AbstractCodeEditorService = AbstractCodeEditorService;
    exports.AbstractCodeEditorService = AbstractCodeEditorService = __decorate([
        __param(0, themeService_1.IThemeService)
    ], AbstractCodeEditorService);
    class ModelTransientSettingWatcher {
        constructor(uri, model, owner) {
            this.uri = uri;
            this._values = {};
            model.onWillDispose(() => owner._removeWatcher(this));
        }
        set(key, value) {
            this._values[key] = value;
        }
        get(key) {
            return this._values[key];
        }
        keys() {
            return Object.keys(this._values);
        }
    }
    exports.ModelTransientSettingWatcher = ModelTransientSettingWatcher;
    class RefCountedStyleSheet {
        get sheet() {
            return this._styleSheet.sheet;
        }
        constructor(parent, editorId, styleSheet) {
            this._parent = parent;
            this._editorId = editorId;
            this._styleSheet = styleSheet;
            this._refCount = 0;
        }
        ref() {
            this._refCount++;
        }
        unref() {
            this._refCount--;
            if (this._refCount === 0) {
                this._styleSheet.parentNode?.removeChild(this._styleSheet);
                this._parent._removeEditorStyleSheets(this._editorId);
            }
        }
        insertRule(selector, rule) {
            dom.createCSSRule(selector, rule, this._styleSheet);
        }
        removeRulesContainingSelector(ruleName) {
            dom.removeCSSRulesContainingSelector(ruleName, this._styleSheet);
        }
    }
    class GlobalStyleSheet {
        get sheet() {
            return this._styleSheet.sheet;
        }
        constructor(styleSheet) {
            this._styleSheet = styleSheet;
        }
        ref() {
        }
        unref() {
        }
        insertRule(selector, rule) {
            dom.createCSSRule(selector, rule, this._styleSheet);
        }
        removeRulesContainingSelector(ruleName) {
            dom.removeCSSRulesContainingSelector(ruleName, this._styleSheet);
        }
    }
    exports.GlobalStyleSheet = GlobalStyleSheet;
    class DecorationSubTypeOptionsProvider {
        constructor(themeService, styleSheet, providerArgs) {
            this._styleSheet = styleSheet;
            this._styleSheet.ref();
            this._parentTypeKey = providerArgs.parentTypeKey;
            this.refCount = 0;
            this._beforeContentRules = new DecorationCSSRules(3 /* ModelDecorationCSSRuleType.BeforeContentClassName */, providerArgs, themeService);
            this._afterContentRules = new DecorationCSSRules(4 /* ModelDecorationCSSRuleType.AfterContentClassName */, providerArgs, themeService);
        }
        getOptions(codeEditorService, writable) {
            const options = codeEditorService.resolveDecorationOptions(this._parentTypeKey, true);
            if (this._beforeContentRules) {
                options.beforeContentClassName = this._beforeContentRules.className;
            }
            if (this._afterContentRules) {
                options.afterContentClassName = this._afterContentRules.className;
            }
            return options;
        }
        resolveDecorationCSSRules() {
            return this._styleSheet.sheet.cssRules;
        }
        dispose() {
            if (this._beforeContentRules) {
                this._beforeContentRules.dispose();
                this._beforeContentRules = null;
            }
            if (this._afterContentRules) {
                this._afterContentRules.dispose();
                this._afterContentRules = null;
            }
            this._styleSheet.unref();
        }
    }
    class DecorationTypeOptionsProvider {
        constructor(description, themeService, styleSheet, providerArgs) {
            this._disposables = new lifecycle_1.DisposableStore();
            this.description = description;
            this._styleSheet = styleSheet;
            this._styleSheet.ref();
            this.refCount = 0;
            const createCSSRules = (type) => {
                const rules = new DecorationCSSRules(type, providerArgs, themeService);
                this._disposables.add(rules);
                if (rules.hasContent) {
                    return rules.className;
                }
                return undefined;
            };
            const createInlineCSSRules = (type) => {
                const rules = new DecorationCSSRules(type, providerArgs, themeService);
                this._disposables.add(rules);
                if (rules.hasContent) {
                    return { className: rules.className, hasLetterSpacing: rules.hasLetterSpacing };
                }
                return null;
            };
            this.className = createCSSRules(0 /* ModelDecorationCSSRuleType.ClassName */);
            const inlineData = createInlineCSSRules(1 /* ModelDecorationCSSRuleType.InlineClassName */);
            if (inlineData) {
                this.inlineClassName = inlineData.className;
                this.inlineClassNameAffectsLetterSpacing = inlineData.hasLetterSpacing;
            }
            this.beforeContentClassName = createCSSRules(3 /* ModelDecorationCSSRuleType.BeforeContentClassName */);
            this.afterContentClassName = createCSSRules(4 /* ModelDecorationCSSRuleType.AfterContentClassName */);
            if (providerArgs.options.beforeInjectedText && providerArgs.options.beforeInjectedText.contentText) {
                const beforeInlineData = createInlineCSSRules(5 /* ModelDecorationCSSRuleType.BeforeInjectedTextClassName */);
                this.beforeInjectedText = {
                    content: providerArgs.options.beforeInjectedText.contentText,
                    inlineClassName: beforeInlineData?.className,
                    inlineClassNameAffectsLetterSpacing: beforeInlineData?.hasLetterSpacing || providerArgs.options.beforeInjectedText.affectsLetterSpacing
                };
            }
            if (providerArgs.options.afterInjectedText && providerArgs.options.afterInjectedText.contentText) {
                const afterInlineData = createInlineCSSRules(6 /* ModelDecorationCSSRuleType.AfterInjectedTextClassName */);
                this.afterInjectedText = {
                    content: providerArgs.options.afterInjectedText.contentText,
                    inlineClassName: afterInlineData?.className,
                    inlineClassNameAffectsLetterSpacing: afterInlineData?.hasLetterSpacing || providerArgs.options.afterInjectedText.affectsLetterSpacing
                };
            }
            this.glyphMarginClassName = createCSSRules(2 /* ModelDecorationCSSRuleType.GlyphMarginClassName */);
            const options = providerArgs.options;
            this.isWholeLine = Boolean(options.isWholeLine);
            this.stickiness = options.rangeBehavior;
            const lightOverviewRulerColor = options.light && options.light.overviewRulerColor || options.overviewRulerColor;
            const darkOverviewRulerColor = options.dark && options.dark.overviewRulerColor || options.overviewRulerColor;
            if (typeof lightOverviewRulerColor !== 'undefined'
                || typeof darkOverviewRulerColor !== 'undefined') {
                this.overviewRuler = {
                    color: lightOverviewRulerColor || darkOverviewRulerColor,
                    darkColor: darkOverviewRulerColor || lightOverviewRulerColor,
                    position: options.overviewRulerLane || model_1.OverviewRulerLane.Center
                };
            }
        }
        getOptions(codeEditorService, writable) {
            if (!writable) {
                return this;
            }
            return {
                description: this.description,
                inlineClassName: this.inlineClassName,
                beforeContentClassName: this.beforeContentClassName,
                afterContentClassName: this.afterContentClassName,
                className: this.className,
                glyphMarginClassName: this.glyphMarginClassName,
                isWholeLine: this.isWholeLine,
                overviewRuler: this.overviewRuler,
                stickiness: this.stickiness,
                before: this.beforeInjectedText,
                after: this.afterInjectedText
            };
        }
        resolveDecorationCSSRules() {
            return this._styleSheet.sheet.rules;
        }
        dispose() {
            this._disposables.dispose();
            this._styleSheet.unref();
        }
    }
    exports._CSS_MAP = {
        color: 'color:{0} !important;',
        opacity: 'opacity:{0};',
        backgroundColor: 'background-color:{0};',
        outline: 'outline:{0};',
        outlineColor: 'outline-color:{0};',
        outlineStyle: 'outline-style:{0};',
        outlineWidth: 'outline-width:{0};',
        border: 'border:{0};',
        borderColor: 'border-color:{0};',
        borderRadius: 'border-radius:{0};',
        borderSpacing: 'border-spacing:{0};',
        borderStyle: 'border-style:{0};',
        borderWidth: 'border-width:{0};',
        fontStyle: 'font-style:{0};',
        fontWeight: 'font-weight:{0};',
        fontSize: 'font-size:{0};',
        fontFamily: 'font-family:{0};',
        textDecoration: 'text-decoration:{0};',
        cursor: 'cursor:{0};',
        letterSpacing: 'letter-spacing:{0};',
        gutterIconPath: 'background:{0} center center no-repeat;',
        gutterIconSize: 'background-size:{0};',
        contentText: 'content:\'{0}\';',
        contentIconPath: 'content:{0};',
        margin: 'margin:{0};',
        padding: 'padding:{0};',
        width: 'width:{0};',
        height: 'height:{0};',
        verticalAlign: 'vertical-align:{0};',
    };
    class DecorationCSSRules {
        constructor(ruleType, providerArgs, themeService) {
            this._theme = themeService.getColorTheme();
            this._ruleType = ruleType;
            this._providerArgs = providerArgs;
            this._usesThemeColors = false;
            this._hasContent = false;
            this._hasLetterSpacing = false;
            let className = CSSNameHelper.getClassName(this._providerArgs.key, ruleType);
            if (this._providerArgs.parentTypeKey) {
                className = className + ' ' + CSSNameHelper.getClassName(this._providerArgs.parentTypeKey, ruleType);
            }
            this._className = className;
            this._unThemedSelector = CSSNameHelper.getSelector(this._providerArgs.key, this._providerArgs.parentTypeKey, ruleType);
            this._buildCSS();
            if (this._usesThemeColors) {
                this._themeListener = themeService.onDidColorThemeChange(theme => {
                    this._theme = themeService.getColorTheme();
                    this._removeCSS();
                    this._buildCSS();
                });
            }
            else {
                this._themeListener = null;
            }
        }
        dispose() {
            if (this._hasContent) {
                this._removeCSS();
                this._hasContent = false;
            }
            if (this._themeListener) {
                this._themeListener.dispose();
                this._themeListener = null;
            }
        }
        get hasContent() {
            return this._hasContent;
        }
        get hasLetterSpacing() {
            return this._hasLetterSpacing;
        }
        get className() {
            return this._className;
        }
        _buildCSS() {
            const options = this._providerArgs.options;
            let unthemedCSS, lightCSS, darkCSS;
            switch (this._ruleType) {
                case 0 /* ModelDecorationCSSRuleType.ClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationClassName(options);
                    lightCSS = this.getCSSTextForModelDecorationClassName(options.light);
                    darkCSS = this.getCSSTextForModelDecorationClassName(options.dark);
                    break;
                case 1 /* ModelDecorationCSSRuleType.InlineClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationInlineClassName(options);
                    lightCSS = this.getCSSTextForModelDecorationInlineClassName(options.light);
                    darkCSS = this.getCSSTextForModelDecorationInlineClassName(options.dark);
                    break;
                case 2 /* ModelDecorationCSSRuleType.GlyphMarginClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationGlyphMarginClassName(options);
                    lightCSS = this.getCSSTextForModelDecorationGlyphMarginClassName(options.light);
                    darkCSS = this.getCSSTextForModelDecorationGlyphMarginClassName(options.dark);
                    break;
                case 3 /* ModelDecorationCSSRuleType.BeforeContentClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationContentClassName(options.before);
                    lightCSS = this.getCSSTextForModelDecorationContentClassName(options.light && options.light.before);
                    darkCSS = this.getCSSTextForModelDecorationContentClassName(options.dark && options.dark.before);
                    break;
                case 4 /* ModelDecorationCSSRuleType.AfterContentClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationContentClassName(options.after);
                    lightCSS = this.getCSSTextForModelDecorationContentClassName(options.light && options.light.after);
                    darkCSS = this.getCSSTextForModelDecorationContentClassName(options.dark && options.dark.after);
                    break;
                case 5 /* ModelDecorationCSSRuleType.BeforeInjectedTextClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationContentClassName(options.beforeInjectedText);
                    lightCSS = this.getCSSTextForModelDecorationContentClassName(options.light && options.light.beforeInjectedText);
                    darkCSS = this.getCSSTextForModelDecorationContentClassName(options.dark && options.dark.beforeInjectedText);
                    break;
                case 6 /* ModelDecorationCSSRuleType.AfterInjectedTextClassName */:
                    unthemedCSS = this.getCSSTextForModelDecorationContentClassName(options.afterInjectedText);
                    lightCSS = this.getCSSTextForModelDecorationContentClassName(options.light && options.light.afterInjectedText);
                    darkCSS = this.getCSSTextForModelDecorationContentClassName(options.dark && options.dark.afterInjectedText);
                    break;
                default:
                    throw new Error('Unknown rule type: ' + this._ruleType);
            }
            const sheet = this._providerArgs.styleSheet;
            let hasContent = false;
            if (unthemedCSS.length > 0) {
                sheet.insertRule(this._unThemedSelector, unthemedCSS);
                hasContent = true;
            }
            if (lightCSS.length > 0) {
                sheet.insertRule(`.vs${this._unThemedSelector}, .hc-light${this._unThemedSelector}`, lightCSS);
                hasContent = true;
            }
            if (darkCSS.length > 0) {
                sheet.insertRule(`.vs-dark${this._unThemedSelector}, .hc-black${this._unThemedSelector}`, darkCSS);
                hasContent = true;
            }
            this._hasContent = hasContent;
        }
        _removeCSS() {
            this._providerArgs.styleSheet.removeRulesContainingSelector(this._unThemedSelector);
        }
        /**
         * Build the CSS for decorations styled via `className`.
         */
        getCSSTextForModelDecorationClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            this.collectCSSText(opts, ['backgroundColor'], cssTextArr);
            this.collectCSSText(opts, ['outline', 'outlineColor', 'outlineStyle', 'outlineWidth'], cssTextArr);
            this.collectBorderSettingsCSSText(opts, cssTextArr);
            return cssTextArr.join('');
        }
        /**
         * Build the CSS for decorations styled via `inlineClassName`.
         */
        getCSSTextForModelDecorationInlineClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            this.collectCSSText(opts, ['fontStyle', 'fontWeight', 'textDecoration', 'cursor', 'color', 'opacity', 'letterSpacing'], cssTextArr);
            if (opts.letterSpacing) {
                this._hasLetterSpacing = true;
            }
            return cssTextArr.join('');
        }
        /**
         * Build the CSS for decorations styled before or after content.
         */
        getCSSTextForModelDecorationContentClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            if (typeof opts !== 'undefined') {
                this.collectBorderSettingsCSSText(opts, cssTextArr);
                if (typeof opts.contentIconPath !== 'undefined') {
                    cssTextArr.push(strings.format(exports._CSS_MAP.contentIconPath, dom.asCSSUrl(uri_1.URI.revive(opts.contentIconPath))));
                }
                if (typeof opts.contentText === 'string') {
                    const truncated = opts.contentText.match(/^.*$/m)[0]; // only take first line
                    const escaped = truncated.replace(/['\\]/g, '\\$&');
                    cssTextArr.push(strings.format(exports._CSS_MAP.contentText, escaped));
                }
                this.collectCSSText(opts, ['verticalAlign', 'fontStyle', 'fontWeight', 'fontSize', 'fontFamily', 'textDecoration', 'color', 'opacity', 'backgroundColor', 'margin', 'padding'], cssTextArr);
                if (this.collectCSSText(opts, ['width', 'height'], cssTextArr)) {
                    cssTextArr.push('display:inline-block;');
                }
            }
            return cssTextArr.join('');
        }
        /**
         * Build the CSS for decorations styled via `glyphMarginClassName`.
         */
        getCSSTextForModelDecorationGlyphMarginClassName(opts) {
            if (!opts) {
                return '';
            }
            const cssTextArr = [];
            if (typeof opts.gutterIconPath !== 'undefined') {
                cssTextArr.push(strings.format(exports._CSS_MAP.gutterIconPath, dom.asCSSUrl(uri_1.URI.revive(opts.gutterIconPath))));
                if (typeof opts.gutterIconSize !== 'undefined') {
                    cssTextArr.push(strings.format(exports._CSS_MAP.gutterIconSize, opts.gutterIconSize));
                }
            }
            return cssTextArr.join('');
        }
        collectBorderSettingsCSSText(opts, cssTextArr) {
            if (this.collectCSSText(opts, ['border', 'borderColor', 'borderRadius', 'borderSpacing', 'borderStyle', 'borderWidth'], cssTextArr)) {
                cssTextArr.push(strings.format('box-sizing: border-box;'));
                return true;
            }
            return false;
        }
        collectCSSText(opts, properties, cssTextArr) {
            const lenBefore = cssTextArr.length;
            for (const property of properties) {
                const value = this.resolveValue(opts[property]);
                if (typeof value === 'string') {
                    cssTextArr.push(strings.format(exports._CSS_MAP[property], value));
                }
            }
            return cssTextArr.length !== lenBefore;
        }
        resolveValue(value) {
            if ((0, editorCommon_1.isThemeColor)(value)) {
                this._usesThemeColors = true;
                const color = this._theme.getColor(value.id);
                if (color) {
                    return color.toString();
                }
                return 'transparent';
            }
            return value;
        }
    }
    var ModelDecorationCSSRuleType;
    (function (ModelDecorationCSSRuleType) {
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["ClassName"] = 0] = "ClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["InlineClassName"] = 1] = "InlineClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["GlyphMarginClassName"] = 2] = "GlyphMarginClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["BeforeContentClassName"] = 3] = "BeforeContentClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["AfterContentClassName"] = 4] = "AfterContentClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["BeforeInjectedTextClassName"] = 5] = "BeforeInjectedTextClassName";
        ModelDecorationCSSRuleType[ModelDecorationCSSRuleType["AfterInjectedTextClassName"] = 6] = "AfterInjectedTextClassName";
    })(ModelDecorationCSSRuleType || (ModelDecorationCSSRuleType = {}));
    class CSSNameHelper {
        static getClassName(key, type) {
            return 'ced-' + key + '-' + type;
        }
        static getSelector(key, parentKey, ruleType) {
            let selector = '.monaco-editor .' + this.getClassName(key, ruleType);
            if (parentKey) {
                selector = selector + '.' + this.getClassName(parentKey, ruleType);
            }
            if (ruleType === 3 /* ModelDecorationCSSRuleType.BeforeContentClassName */) {
                selector += '::before';
            }
            else if (ruleType === 4 /* ModelDecorationCSSRuleType.AfterContentClassName */) {
                selector += '::after';
            }
            return selector;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RDb2RlRWRpdG9yU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvc2VydmljZXMvYWJzdHJhY3RDb2RlRWRpdG9yU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQnpGLElBQWUseUJBQXlCLEdBQXhDLE1BQWUseUJBQTBCLFNBQVEsc0JBQVU7UUFtQ2pFLFlBQ2dCLGFBQTZDO1lBRTVELEtBQUssRUFBRSxDQUFDO1lBRndCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBaEM1Qyw0QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMvRCwyQkFBc0IsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1lBRTNELHFCQUFnQixHQUF5QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFlLENBQUMsQ0FBQztZQUNyRixvQkFBZSxHQUF1QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBRWpFLHdCQUFtQixHQUF5QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFlLENBQUMsQ0FBQztZQUN4Rix1QkFBa0IsR0FBdUIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQztZQUV2RSw0QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMvRCwyQkFBc0IsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1lBRTNELHFCQUFnQixHQUF5QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFlLENBQUMsQ0FBQztZQUNyRixvQkFBZSxHQUF1QixJQUFJ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