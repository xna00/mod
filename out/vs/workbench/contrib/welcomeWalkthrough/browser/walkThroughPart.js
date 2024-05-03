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
define(["require", "exports", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/touch", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/workbench/browser/parts/editor/editorPane", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/welcomeWalkthrough/browser/walkThroughInput", "vs/platform/opener/common/opener", "vs/editor/common/services/textResourceConfiguration", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/nls", "vs/platform/storage/common/storage", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/base/common/types", "vs/platform/commands/common/commands", "vs/platform/theme/common/themeService", "vs/base/common/keybindingLabels", "vs/base/common/platform", "vs/base/common/objects", "vs/platform/notification/common/notification", "vs/base/browser/dom", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/welcomeWalkthrough/common/walkThroughUtils", "vs/css!./media/walkThroughPart"], function (require, exports, scrollableElement_1, touch_1, strings, uri_1, lifecycle_1, editorPane_1, telemetry_1, walkThroughInput_1, opener_1, textResourceConfiguration_1, codeEditorWidget_1, instantiation_1, keybinding_1, nls_1, storage_1, contextkey_1, configuration_1, types_1, commands_1, themeService_1, keybindingLabels_1, platform_1, objects_1, notification_1, dom_1, editorGroupsService_1, extensions_1) {
    "use strict";
    var WalkThroughPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WalkThroughPart = exports.WALK_THROUGH_FOCUS = void 0;
    exports.WALK_THROUGH_FOCUS = new contextkey_1.RawContextKey('interactivePlaygroundFocus', false);
    const UNBOUND_COMMAND = (0, nls_1.localize)('walkThrough.unboundCommand', "unbound");
    const WALK_THROUGH_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'walkThroughEditorViewState';
    let WalkThroughPart = class WalkThroughPart extends editorPane_1.EditorPane {
        static { WalkThroughPart_1 = this; }
        static { this.ID = 'workbench.editor.walkThroughPart'; }
        constructor(group, telemetryService, themeService, textResourceConfigurationService, instantiationService, openerService, keybindingService, storageService, contextKeyService, configurationService, notificationService, extensionService, editorGroupService) {
            super(WalkThroughPart_1.ID, group, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.openerService = openerService;
            this.keybindingService = keybindingService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.contentDisposables = [];
            this.editorFocus = exports.WALK_THROUGH_FOCUS.bindTo(this.contextKeyService);
            this.editorMemento = this.getEditorMemento(editorGroupService, textResourceConfigurationService, WALK_THROUGH_EDITOR_VIEW_STATE_PREFERENCE_KEY);
        }
        createEditor(container) {
            this.content = document.createElement('div');
            this.content.classList.add('welcomePageFocusElement');
            this.content.tabIndex = 0;
            this.content.style.outlineStyle = 'none';
            this.scrollbar = new scrollableElement_1.DomScrollableElement(this.content, {
                horizontal: 1 /* ScrollbarVisibility.Auto */,
                vertical: 1 /* ScrollbarVisibility.Auto */
            });
            this.disposables.add(this.scrollbar);
            container.appendChild(this.scrollbar.getDomNode());
            this.registerFocusHandlers();
            this.registerClickHandler();
            this.disposables.add(this.scrollbar.onScroll(e => this.updatedScrollPosition()));
        }
        updatedScrollPosition() {
            const scrollDimensions = this.scrollbar.getScrollDimensions();
            const scrollPosition = this.scrollbar.getScrollPosition();
            const scrollHeight = scrollDimensions.scrollHeight;
            if (scrollHeight && this.input instanceof walkThroughInput_1.WalkThroughInput) {
                const scrollTop = scrollPosition.scrollTop;
                const height = scrollDimensions.height;
                this.input.relativeScrollPosition(scrollTop / scrollHeight, (scrollTop + height) / scrollHeight);
            }
        }
        onTouchChange(event) {
            event.preventDefault();
            event.stopPropagation();
            const scrollPosition = this.scrollbar.getScrollPosition();
            this.scrollbar.setScrollPosition({ scrollTop: scrollPosition.scrollTop - event.translationY });
        }
        addEventListener(element, type, listener, useCapture) {
            element.addEventListener(type, listener, useCapture);
            return (0, lifecycle_1.toDisposable)(() => { element.removeEventListener(type, listener, useCapture); });
        }
        registerFocusHandlers() {
            this.disposables.add(this.addEventListener(this.content, 'mousedown', e => {
                this.focus();
            }));
            this.disposables.add(this.addEventListener(this.content, 'focus', e => {
                this.editorFocus.set(true);
            }));
            this.disposables.add(this.addEventListener(this.content, 'blur', e => {
                this.editorFocus.reset();
            }));
            this.disposables.add(this.addEventListener(this.content, 'focusin', (e) => {
                // Work around scrolling as side-effect of setting focus on the offscreen zone widget (#18929)
                if (e.target instanceof HTMLElement && e.target.classList.contains('zone-widget-container')) {
                    const scrollPosition = this.scrollbar.getScrollPosition();
                    this.content.scrollTop = scrollPosition.scrollTop;
                    this.content.scrollLeft = scrollPosition.scrollLeft;
                }
                if (e.target instanceof HTMLElement) {
                    this.lastFocus = e.target;
                }
            }));
        }
        registerClickHandler() {
            this.content.addEventListener('click', event => {
                for (let node = event.target; node; node = node.parentNode) {
                    if (node instanceof HTMLAnchorElement && node.href) {
                        const baseElement = node.ownerDocument.getElementsByTagName('base')[0] || this.window.location;
                        if (baseElement && node.href.indexOf(baseElement.href) >= 0 && node.hash) {
                            const scrollTarget = this.content.querySelector(node.hash);
                            const innerContent = this.content.firstElementChild;
                            if (scrollTarget && innerContent) {
                                const targetTop = scrollTarget.getBoundingClientRect().top - 20;
                                const containerTop = innerContent.getBoundingClientRect().top;
                                this.scrollbar.setScrollPosition({ scrollTop: targetTop - containerTop });
                            }
                        }
                        else {
                            this.open(uri_1.URI.parse(node.href));
                        }
                        event.preventDefault();
                        break;
                    }
                    else if (node instanceof HTMLButtonElement) {
                        const href = node.getAttribute('data-href');
                        if (href) {
                            this.open(uri_1.URI.parse(href));
                        }
                        break;
                    }
                    else if (node === event.currentTarget) {
                        break;
                    }
                }
            });
        }
        open(uri) {
            if (uri.scheme === 'command' && uri.path === 'git.clone' && !commands_1.CommandsRegistry.getCommand('git.clone')) {
                this.notificationService.info((0, nls_1.localize)('walkThrough.gitNotFound', "It looks like Git is not installed on your system."));
                return;
            }
            this.openerService.open(this.addFrom(uri), { allowCommands: true });
        }
        addFrom(uri) {
            if (uri.scheme !== 'command' || !(this.input instanceof walkThroughInput_1.WalkThroughInput)) {
                return uri;
            }
            const query = uri.query ? JSON.parse(uri.query) : {};
            query.from = this.input.getTelemetryFrom();
            return uri.with({ query: JSON.stringify(query) });
        }
        layout(dimension) {
            this.size = dimension;
            (0, dom_1.size)(this.content, dimension.width, dimension.height);
            this.updateSizeClasses();
            this.contentDisposables.forEach(disposable => {
                if (disposable instanceof codeEditorWidget_1.CodeEditorWidget) {
                    disposable.layout();
                }
            });
            const walkthroughInput = this.input instanceof walkThroughInput_1.WalkThroughInput && this.input;
            if (walkthroughInput && walkthroughInput.layout) {
                walkthroughInput.layout(dimension);
            }
            this.scrollbar.scanDomNode();
        }
        updateSizeClasses() {
            const innerContent = this.content.firstElementChild;
            if (this.size && innerContent) {
                innerContent.classList.toggle('max-height-685px', this.size.height <= 685);
            }
        }
        focus() {
            super.focus();
            let active = this.content.ownerDocument.activeElement;
            while (active && active !== this.content) {
                active = active.parentElement;
            }
            if (!active) {
                (this.lastFocus || this.content).focus();
            }
            this.editorFocus.set(true);
        }
        arrowUp() {
            const scrollPosition = this.scrollbar.getScrollPosition();
            this.scrollbar.setScrollPosition({ scrollTop: scrollPosition.scrollTop - this.getArrowScrollHeight() });
        }
        arrowDown() {
            const scrollPosition = this.scrollbar.getScrollPosition();
            this.scrollbar.setScrollPosition({ scrollTop: scrollPosition.scrollTop + this.getArrowScrollHeight() });
        }
        getArrowScrollHeight() {
            let fontSize = this.configurationService.getValue('editor.fontSize');
            if (typeof fontSize !== 'number' || fontSize < 1) {
                fontSize = 12;
            }
            return 3 * fontSize;
        }
        pageUp() {
            const scrollDimensions = this.scrollbar.getScrollDimensions();
            const scrollPosition = this.scrollbar.getScrollPosition();
            this.scrollbar.setScrollPosition({ scrollTop: scrollPosition.scrollTop - scrollDimensions.height });
        }
        pageDown() {
            const scrollDimensions = this.scrollbar.getScrollDimensions();
            const scrollPosition = this.scrollbar.getScrollPosition();
            this.scrollbar.setScrollPosition({ scrollTop: scrollPosition.scrollTop + scrollDimensions.height });
        }
        setInput(input, options, context, token) {
            const store = new lifecycle_1.DisposableStore();
            this.contentDisposables.push(store);
            this.content.innerText = '';
            return super.setInput(input, options, context, token)
                .then(async () => {
                if (input.resource.path.endsWith('.md')) {
                    await this.extensionService.whenInstalledExtensionsRegistered();
                }
                return input.resolve();
            })
                .then(model => {
                if (token.isCancellationRequested) {
                    return;
                }
                const content = model.main;
                if (!input.resource.path.endsWith('.md')) {
                    (0, dom_1.safeInnerHtml)(this.content, content);
                    this.updateSizeClasses();
                    this.decorateContent();
                    this.contentDisposables.push(this.keybindingService.onDidUpdateKeybindings(() => this.decorateContent()));
                    input.onReady?.(this.content.firstElementChild, store);
                    this.scrollbar.scanDomNode();
                    this.loadTextEditorViewState(input);
                    this.updatedScrollPosition();
                    return;
                }
                const innerContent = document.createElement('div');
                innerContent.classList.add('walkThroughContent'); // only for markdown files
                const markdown = this.expandMacros(content);
                (0, dom_1.safeInnerHtml)(innerContent, markdown);
                this.content.appendChild(innerContent);
                model.snippets.forEach((snippet, i) => {
                    const model = snippet.textEditorModel;
                    if (!model) {
                        return;
                    }
                    const id = `snippet-${model.uri.fragment}`;
                    const div = innerContent.querySelector(`#${id.replace(/[\\.]/g, '\\$&')}`);
                    const options = this.getEditorOptions(model.getLanguageId());
                    const telemetryData = {
                        target: this.input instanceof walkThroughInput_1.WalkThroughInput ? this.input.getTelemetryFrom() : undefined,
                        snippet: i
                    };
                    const editor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, div, options, {
                        telemetryData: telemetryData
                    });
                    editor.setModel(model);
                    this.contentDisposables.push(editor);
                    const updateHeight = (initial) => {
                        const lineHeight = editor.getOption(67 /* EditorOption.lineHeight */);
                        const height = `${Math.max(model.getLineCount() + 1, 4) * lineHeight}px`;
                        if (div.style.height !== height) {
                            div.style.height = height;
                            editor.layout();
                            if (!initial) {
                                this.scrollbar.scanDomNode();
                            }
                        }
                    };
                    updateHeight(true);
                    this.contentDisposables.push(editor.onDidChangeModelContent(() => updateHeight(false)));
                    this.contentDisposables.push(editor.onDidChangeCursorPosition(e => {
                        const innerContent = this.content.firstElementChild;
                        if (innerContent) {
                            const targetTop = div.getBoundingClientRect().top;
                            const containerTop = innerContent.getBoundingClientRect().top;
                            const lineHeight = editor.getOption(67 /* EditorOption.lineHeight */);
                            const lineTop = (targetTop + (e.position.lineNumber - 1) * lineHeight) - containerTop;
                            const lineBottom = lineTop + lineHeight;
                            const scrollDimensions = this.scrollbar.getScrollDimensions();
                            const scrollPosition = this.scrollbar.getScrollPosition();
                            const scrollTop = scrollPosition.scrollTop;
                            const height = scrollDimensions.height;
                            if (scrollTop > lineTop) {
                                this.scrollbar.setScrollPosition({ scrollTop: lineTop });
                            }
                            else if (scrollTop < lineBottom - height) {
                                this.scrollbar.setScrollPosition({ scrollTop: lineBottom - height });
                            }
                        }
                    }));
                    this.contentDisposables.push(this.configurationService.onDidChangeConfiguration(e => {
                        if (e.affectsConfiguration('editor') && snippet.textEditorModel) {
                            editor.updateOptions(this.getEditorOptions(snippet.textEditorModel.getLanguageId()));
                        }
                    }));
                });
                this.updateSizeClasses();
                this.multiCursorModifier();
                this.contentDisposables.push(this.configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration('editor.multiCursorModifier')) {
                        this.multiCursorModifier();
                    }
                }));
                input.onReady?.(innerContent, store);
                this.scrollbar.scanDomNode();
                this.loadTextEditorViewState(input);
                this.updatedScrollPosition();
                this.contentDisposables.push(touch_1.Gesture.addTarget(innerContent));
                this.contentDisposables.push((0, dom_1.addDisposableListener)(innerContent, touch_1.EventType.Change, e => this.onTouchChange(e)));
            });
        }
        getEditorOptions(language) {
            const config = (0, objects_1.deepClone)(this.configurationService.getValue('editor', { overrideIdentifier: language }));
            return {
                ...(0, types_1.isObject)(config) ? config : Object.create(null),
                scrollBeyondLastLine: false,
                scrollbar: {
                    verticalScrollbarSize: 14,
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                    alwaysConsumeMouseWheel: false
                },
                overviewRulerLanes: 3,
                fixedOverflowWidgets: false,
                lineNumbersMinChars: 1,
                minimap: { enabled: false },
            };
        }
        expandMacros(input) {
            return input.replace(/kb\(([a-z.\d\-]+)\)/gi, (match, kb) => {
                const keybinding = this.keybindingService.lookupKeybinding(kb);
                const shortcut = keybinding ? keybinding.getLabel() || '' : UNBOUND_COMMAND;
                return `<span class="shortcut">${strings.escape(shortcut)}</span>`;
            });
        }
        decorateContent() {
            const keys = this.content.querySelectorAll('.shortcut[data-command]');
            Array.prototype.forEach.call(keys, (key) => {
                const command = key.getAttribute('data-command');
                const keybinding = command && this.keybindingService.lookupKeybinding(command);
                const label = keybinding ? keybinding.getLabel() || '' : UNBOUND_COMMAND;
                while (key.firstChild) {
                    key.removeChild(key.firstChild);
                }
                key.appendChild(document.createTextNode(label));
            });
            const ifkeys = this.content.querySelectorAll('.if_shortcut[data-command]');
            Array.prototype.forEach.call(ifkeys, (key) => {
                const command = key.getAttribute('data-command');
                const keybinding = command && this.keybindingService.lookupKeybinding(command);
                key.style.display = !keybinding ? 'none' : '';
            });
        }
        multiCursorModifier() {
            const labels = keybindingLabels_1.UILabelProvider.modifierLabels[platform_1.OS];
            const value = this.configurationService.getValue('editor.multiCursorModifier');
            const modifier = labels[value === 'ctrlCmd' ? (platform_1.OS === 2 /* OperatingSystem.Macintosh */ ? 'metaKey' : 'ctrlKey') : 'altKey'];
            const keys = this.content.querySelectorAll('.multi-cursor-modifier');
            Array.prototype.forEach.call(keys, (key) => {
                while (key.firstChild) {
                    key.removeChild(key.firstChild);
                }
                key.appendChild(document.createTextNode(modifier));
            });
        }
        saveTextEditorViewState(input) {
            const scrollPosition = this.scrollbar.getScrollPosition();
            this.editorMemento.saveEditorState(this.group, input, {
                viewState: {
                    scrollTop: scrollPosition.scrollTop,
                    scrollLeft: scrollPosition.scrollLeft
                }
            });
        }
        loadTextEditorViewState(input) {
            const state = this.editorMemento.loadEditorState(this.group, input);
            if (state) {
                this.scrollbar.setScrollPosition(state.viewState);
            }
        }
        clearInput() {
            if (this.input instanceof walkThroughInput_1.WalkThroughInput) {
                this.saveTextEditorViewState(this.input);
            }
            this.contentDisposables = (0, lifecycle_1.dispose)(this.contentDisposables);
            super.clearInput();
        }
        saveState() {
            if (this.input instanceof walkThroughInput_1.WalkThroughInput) {
                this.saveTextEditorViewState(this.input);
            }
            super.saveState();
        }
        dispose() {
            this.editorFocus.reset();
            this.contentDisposables = (0, lifecycle_1.dispose)(this.contentDisposables);
            this.disposables.dispose();
            super.dispose();
        }
    };
    exports.WalkThroughPart = WalkThroughPart;
    exports.WalkThroughPart = WalkThroughPart = WalkThroughPart_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, opener_1.IOpenerService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, storage_1.IStorageService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, notification_1.INotificationService),
        __param(11, extensions_1.IExtensionService),
        __param(12, editorGroupsService_1.IEditorGroupsService)
    ], WalkThroughPart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Fsa1Rocm91Z2hQYXJ0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lV2Fsa3Rocm91Z2gvYnJvd3Nlci93YWxrVGhyb3VnaFBhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFDbkYsUUFBQSxrQkFBa0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsNEJBQTRCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFbEcsTUFBTSxlQUFlLEdBQUcsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDMUUsTUFBTSw2Q0FBNkMsR0FBRyw0QkFBNEIsQ0FBQztJQVc1RSxJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLHVCQUFVOztpQkFFOUIsT0FBRSxHQUFXLGtDQUFrQyxBQUE3QyxDQUE4QztRQVdoRSxZQUNDLEtBQW1CLEVBQ0EsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ1AsZ0NBQW1FLEVBQy9FLG9CQUE0RCxFQUNuRSxhQUE4QyxFQUMxQyxpQkFBc0QsRUFDekQsY0FBK0IsRUFDNUIsaUJBQXNELEVBQ25ELG9CQUE0RCxFQUM3RCxtQkFBMEQsRUFDN0QsZ0JBQW9ELEVBQ2pELGtCQUF3QztZQUU5RCxLQUFLLENBQUMsaUJBQWUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztZQVZ6Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2xELGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN6QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBRXJDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZ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