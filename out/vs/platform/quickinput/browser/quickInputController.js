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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/countBadge/countBadge", "vs/base/browser/ui/progressbar/progressbar", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/base/common/types", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/platform/quickinput/browser/quickInputBox", "vs/platform/quickinput/browser/quickInput", "vs/platform/layout/browser/layoutService", "vs/base/browser/window", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/browser/quickInputTree"], function (require, exports, dom, actionbar_1, button_1, countBadge_1, progressbar_1, cancellation_1, event_1, lifecycle_1, severity_1, types_1, nls_1, quickInput_1, quickInputBox_1, quickInput_2, layoutService_1, window_1, instantiation_1, quickInputTree_1) {
    "use strict";
    var QuickInputController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputController = void 0;
    const $ = dom.$;
    let QuickInputController = class QuickInputController extends lifecycle_1.Disposable {
        static { QuickInputController_1 = this; }
        static { this.MAX_WIDTH = 600; } // Max total width of quick input widget
        get container() { return this._container; }
        constructor(options, layoutService, instantiationService) {
            super();
            this.options = options;
            this.layoutService = layoutService;
            this.instantiationService = instantiationService;
            this.enabled = true;
            this.onDidAcceptEmitter = this._register(new event_1.Emitter());
            this.onDidCustomEmitter = this._register(new event_1.Emitter());
            this.onDidTriggerButtonEmitter = this._register(new event_1.Emitter());
            this.keyMods = { ctrlCmd: false, alt: false };
            this.controller = null;
            this.onShowEmitter = this._register(new event_1.Emitter());
            this.onShow = this.onShowEmitter.event;
            this.onHideEmitter = this._register(new event_1.Emitter());
            this.onHide = this.onHideEmitter.event;
            this.backButton = quickInput_2.backButton;
            this.idPrefix = options.idPrefix;
            this._container = options.container;
            this.styles = options.styles;
            this._register(event_1.Event.runAndSubscribe(dom.onDidRegisterWindow, ({ window, disposables }) => this.registerKeyModsListeners(window, disposables), { window: window_1.mainWindow, disposables: this._store }));
            this._register(dom.onWillUnregisterWindow(window => {
                if (this.ui && dom.getWindow(this.ui.container) === window) {
                    // The window this quick input is contained in is about to
                    // close, so we have to make sure to reparent it back to an
                    // existing parent to not loose functionality.
                    // (https://github.com/microsoft/vscode/issues/195870)
                    this.reparentUI(this.layoutService.mainContainer);
                    this.layout(this.layoutService.mainContainerDimension, this.layoutService.mainContainerOffset.quickPickTop);
                }
            }));
        }
        registerKeyModsListeners(window, disposables) {
            const listener = (e) => {
                this.keyMods.ctrlCmd = e.ctrlKey || e.metaKey;
                this.keyMods.alt = e.altKey;
            };
            for (const event of [dom.EventType.KEY_DOWN, dom.EventType.KEY_UP, dom.EventType.MOUSE_DOWN]) {
                disposables.add(dom.addDisposableListener(window, event, listener, true));
            }
        }
        getUI(showInActiveContainer) {
            if (this.ui) {
                // In order to support aux windows, re-parent the controller
                // if the original event is from a different document
                if (showInActiveContainer) {
                    if (dom.getWindow(this._container) !== dom.getWindow(this.layoutService.activeContainer)) {
                        this.reparentUI(this.layoutService.activeContainer);
                        this.layout(this.layoutService.activeContainerDimension, this.layoutService.activeContainerOffset.quickPickTop);
                    }
                }
                return this.ui;
            }
            const container = dom.append(this._container, $('.quick-input-widget.show-file-icons'));
            container.tabIndex = -1;
            container.style.display = 'none';
            const styleSheet = dom.createStyleSheet(container);
            const titleBar = dom.append(container, $('.quick-input-titlebar'));
            const leftActionBar = this._register(new actionbar_1.ActionBar(titleBar, { hoverDelegate: this.options.hoverDelegate }));
            leftActionBar.domNode.classList.add('quick-input-left-action-bar');
            const title = dom.append(titleBar, $('.quick-input-title'));
            const rightActionBar = this._register(new actionbar_1.ActionBar(titleBar, { hoverDelegate: this.options.hoverDelegate }));
            rightActionBar.domNode.classList.add('quick-input-right-action-bar');
            const headerContainer = dom.append(container, $('.quick-input-header'));
            const checkAll = dom.append(headerContainer, $('input.quick-input-check-all'));
            checkAll.type = 'checkbox';
            checkAll.setAttribute('aria-label', (0, nls_1.localize)('quickInput.checkAll', "Toggle all checkboxes"));
            this._register(dom.addStandardDisposableListener(checkAll, dom.EventType.CHANGE, e => {
                const checked = checkAll.checked;
                list.setAllVisibleChecked(checked);
            }));
            this._register(dom.addDisposableListener(checkAll, dom.EventType.CLICK, e => {
                if (e.x || e.y) { // Avoid 'click' triggered by 'space'...
                    inputBox.setFocus();
                }
            }));
            const description2 = dom.append(headerContainer, $('.quick-input-description'));
            const inputContainer = dom.append(headerContainer, $('.quick-input-and-message'));
            const filterContainer = dom.append(inputContainer, $('.quick-input-filter'));
            const inputBox = this._register(new quickInputBox_1.QuickInputBox(filterContainer, this.styles.inputBox, this.styles.toggle));
            inputBox.setAttribute('aria-describedby', `${this.idPrefix}message`);
            const visibleCountContainer = dom.append(filterContainer, $('.quick-input-visible-count'));
            visibleCountContainer.setAttribute('aria-live', 'polite');
            visibleCountContainer.setAttribute('aria-atomic', 'true');
            const visibleCount = new countBadge_1.CountBadge(visibleCountContainer, { countFormat: (0, nls_1.localize)({ key: 'quickInput.visibleCount', comment: ['This tells the user how many items are shown in a list of items to select from. The items can be anything. Currently not visible, but read by screen readers.'] }, "{0} Results") }, this.styles.countBadge);
            const countContainer = dom.append(filterContainer, $('.quick-input-count'));
            countContainer.setAttribute('aria-live', 'polite');
            const count = new countBadge_1.CountBadge(countContainer, { countFormat: (0, nls_1.localize)({ key: 'quickInput.countSelected', comment: ['This tells the user how many items are selected in a list of items to select from. The items can be anything.'] }, "{0} Selected") }, this.styles.countBadge);
            const okContainer = dom.append(headerContainer, $('.quick-input-action'));
            const ok = this._register(new button_1.Button(okContainer, this.styles.button));
            ok.label = (0, nls_1.localize)('ok', "OK");
            this._register(ok.onDidClick(e => {
                this.onDidAcceptEmitter.fire();
            }));
            const customButtonContainer = dom.append(headerContainer, $('.quick-input-action'));
            const customButton = this._register(new button_1.Button(customButtonContainer, { ...this.styles.button, supportIcons: true }));
            customButton.label = (0, nls_1.localize)('custom', "Custom");
            this._register(customButton.onDidClick(e => {
                this.onDidCustomEmitter.fire();
            }));
            const message = dom.append(inputContainer, $(`#${this.idPrefix}message.quick-input-message`));
            const progressBar = this._register(new progressbar_1.ProgressBar(container, this.styles.progressBar));
            progressBar.getContainer().classList.add('quick-input-progress');
            const widget = dom.append(container, $('.quick-input-html-widget'));
            widget.tabIndex = -1;
            const description1 = dom.append(container, $('.quick-input-description'));
            const listId = this.idPrefix + 'list';
            const list = this._register(this.instantiationService.createInstance(quickInputTree_1.QuickInputTree, container, this.options.hoverDelegate, this.options.linkOpenerDelegate, listId));
            inputBox.setAttribute('aria-controls', listId);
            this._register(list.onDidChangeFocus(() => {
                inputBox.setAttribute('aria-activedescendant', list.getActiveDescendant() ?? '');
            }));
            this._register(list.onChangedAllVisibleChecked(checked => {
                checkAll.checked = checked;
            }));
            this._register(list.onChangedVisibleCount(c => {
                visibleCount.setCount(c);
            }));
            this._register(list.onChangedCheckedCount(c => {
                count.setCount(c);
            }));
            this._register(list.onLeave(() => {
                // Defer to avoid the input field reacting to the triggering key.
                // TODO@TylerLeonhardt https://github.com/microsoft/vscode/issues/203675
                setTimeout(() => {
                    if (!this.controller) {
                        return;
                    }
                    inputBox.setFocus();
                    if (this.controller instanceof quickInput_2.QuickPick && this.controller.canSelectMany) {
                        list.clearFocus();
                    }
                }, 0);
            }));
            const focusTracker = dom.trackFocus(container);
            this._register(focusTracker);
            this._register(dom.addDisposableListener(container, dom.EventType.FOCUS, e => {
                // Ignore focus events within container
                if (dom.isAncestor(e.relatedTarget, container)) {
                    return;
                }
                this.previousFocusElement = e.relatedTarget instanceof HTMLElement ? e.relatedTarget : undefined;
            }, true));
            this._register(focusTracker.onDidBlur(() => {
                if (!this.getUI().ignoreFocusOut && !this.options.ignoreFocusOut()) {
                    this.hide(quickInput_1.QuickInputHideReason.Blur);
                }
                this.previousFocusElement = undefined;
            }));
            this._register(dom.addDisposableListener(container, dom.EventType.FOCUS, (e) => {
                inputBox.setFocus();
            }));
            // TODO: Turn into commands instead of handling KEY_DOWN
            // Keybindings for the quickinput widget as a whole
            this._register(dom.addStandardDisposableListener(container, dom.EventType.KEY_DOWN, (event) => {
                if (dom.isAncestor(event.target, widget)) {
                    return; // Ignore event if target is inside widget to allow the widget to handle the event.
                }
                switch (event.keyCode) {
                    case 3 /* KeyCode.Enter */:
                        dom.EventHelper.stop(event, true);
                        if (this.enabled) {
                            this.onDidAcceptEmitter.fire();
                        }
                        break;
                    case 9 /* KeyCode.Escape */:
                        dom.EventHelper.stop(event, true);
                        this.hide(quickInput_1.QuickInputHideReason.Gesture);
                        break;
                    case 2 /* KeyCode.Tab */:
                        if (!event.altKey && !event.ctrlKey && !event.metaKey) {
                            // detect only visible actions
                            const selectors = [
                                '.quick-input-list .monaco-action-bar .always-visible',
                                '.quick-input-list-entry:hover .monaco-action-bar',
                                '.monaco-list-row.focused .monaco-action-bar'
                            ];
                            if (container.classList.contains('show-checkboxes')) {
                                selectors.push('input');
                            }
                            else {
                                selectors.push('input[type=text]');
                            }
                            if (this.getUI().list.isDisplayed()) {
                                selectors.push('.monaco-list');
                            }
                            // focus links if there are any
                            if (this.getUI().message) {
                                selectors.push('.quick-input-message a');
                            }
                            if (this.getUI().widget) {
                                if (dom.isAncestor(event.target, this.getUI().widget)) {
                                    // let the widget control tab
                                    break;
                                }
                                selectors.push('.quick-input-html-widget');
                            }
                            const stops = container.querySelectorAll(selectors.join(', '));
                            if (event.shiftKey && event.target === stops[0]) {
                                // Clear the focus from the list in order to allow
                                // screen readers to read operations in the input box.
                                dom.EventHelper.stop(event, true);
                                list.clearFocus();
                            }
                            else if (!event.shiftKey && dom.isAncestor(event.target, stops[stops.length - 1])) {
                                dom.EventHelper.stop(event, true);
                                stops[0].focus();
                            }
                        }
                        break;
                    case 10 /* KeyCode.Space */:
                        if (event.ctrlKey) {
                            dom.EventHelper.stop(event, true);
                            this.getUI().list.toggleHover();
                        }
                        break;
                }
            }));
            this.ui = {
                container,
                styleSheet,
                leftActionBar,
                titleBar,
                title,
                description1,
                description2,
                widget,
                rightActionBar,
                checkAll,
                inputContainer,
                filterContainer,
                inputBox,
                visibleCountContainer,
                visibleCount,
                countContainer,
                count,
                okContainer,
                ok,
                message,
                customButtonContainer,
                customButton,
                list,
                progressBar,
                onDidAccept: this.onDidAcceptEmitter.event,
                onDidCustom: this.onDidCustomEmitter.event,
                onDidTriggerButton: this.onDidTriggerButtonEmitter.event,
                ignoreFocusOut: false,
                keyMods: this.keyMods,
                show: controller => this.show(controller),
                hide: () => this.hide(),
                setVisibilities: visibilities => this.setVisibilities(visibilities),
                setEnabled: enabled => this.setEnabled(enabled),
                setContextKey: contextKey => this.options.setContextKey(contextKey),
                linkOpenerDelegate: content => this.options.linkOpenerDelegate(content)
            };
            this.updateStyles();
            return this.ui;
        }
        reparentUI(container) {
            if (this.ui) {
                this._container = container;
                dom.append(this._container, this.ui.container);
            }
        }
        pick(picks, options = {}, token = cancellation_1.CancellationToken.None) {
            return new Promise((doResolve, reject) => {
                let resolve = (result) => {
                    resolve = doResolve;
                    options.onKeyMods?.(input.keyMods);
                    doResolve(result);
                };
                if (token.isCancellationRequested) {
                    resolve(undefined);
                    return;
                }
                const input = this.createQuickPick();
                let activeItem;
                const disposables = [
                    input,
                    input.onDidAccept(() => {
                        if (input.canSelectMany) {
                            resolve(input.selectedItems.slice());
                            input.hide();
                        }
                        else {
                            const result = input.activeItems[0];
                            if (result) {
                                resolve(result);
                                input.hide();
                            }
                        }
                    }),
                    input.onDidChangeActive(items => {
                        const focused = items[0];
                        if (focused && options.onDidFocus) {
                            options.onDidFocus(focused);
                        }
                    }),
                    input.onDidChangeSelection(items => {
                        if (!input.canSelectMany) {
                            const result = items[0];
                            if (result) {
                                resolve(result);
                                input.hide();
                            }
                        }
                    }),
                    input.onDidTriggerItemButton(event => options.onDidTriggerItemButton && options.onDidTriggerItemButton({
                        ...event,
                        removeItem: () => {
                            const index = input.items.indexOf(event.item);
                            if (index !== -1) {
                                const items = input.items.slice();
                                const removed = items.splice(index, 1);
                                const activeItems = input.activeItems.filter(activeItem => activeItem !== removed[0]);
                                const keepScrollPositionBefore = input.keepScrollPosition;
                                input.keepScrollPosition = true;
                                input.items = items;
                                if (activeItems) {
                                    input.activeItems = activeItems;
                                }
                                input.keepScrollPosition = keepScrollPositionBefore;
                            }
                        }
                    })),
                    input.onDidTriggerSeparatorButton(event => options.onDidTriggerSeparatorButton?.(event)),
                    input.onDidChangeValue(value => {
                        if (activeItem && !value && (input.activeItems.length !== 1 || input.activeItems[0] !== activeItem)) {
                            input.activeItems = [activeItem];
                        }
                    }),
                    token.onCancellationRequested(() => {
                        input.hide();
                    }),
                    input.onDidHide(() => {
                        (0, lifecycle_1.dispose)(disposables);
                        resolve(undefined);
                    }),
                ];
                input.title = options.title;
                input.canSelectMany = !!options.canPickMany;
                input.placeholder = options.placeHolder;
                input.ignoreFocusOut = !!options.ignoreFocusLost;
                input.matchOnDescription = !!options.matchOnDescription;
                input.matchOnDetail = !!options.matchOnDetail;
                input.matchOnLabel = (options.matchOnLabel === undefined) || options.matchOnLabel; // default to true
                input.quickNavigate = options.quickNavigate;
                input.hideInput = !!options.hideInput;
                input.contextKey = options.contextKey;
                input.busy = true;
                Promise.all([picks, options.activeItem])
                    .then(([items, _activeItem]) => {
                    activeItem = _activeItem;
                    input.busy = false;
                    input.items = items;
                    if (input.canSelectMany) {
                        input.selectedItems = items.filter(item => item.type !== 'separator' && item.picked);
                    }
                    if (activeItem) {
                        input.activeItems = [activeItem];
                    }
                });
                input.show();
                Promise.resolve(picks).then(undefined, err => {
                    reject(err);
                    input.hide();
                });
            });
        }
        setValidationOnInput(input, validationResult) {
            if (validationResult && (0, types_1.isString)(validationResult)) {
                input.severity = severity_1.default.Error;
                input.validationMessage = validationResult;
            }
            else if (validationResult && !(0, types_1.isString)(validationResult)) {
                input.severity = validationResult.severity;
                input.validationMessage = validationResult.content;
            }
            else {
                input.severity = severity_1.default.Ignore;
                input.validationMessage = undefined;
            }
        }
        input(options = {}, token = cancellation_1.CancellationToken.None) {
            return new Promise((resolve) => {
                if (token.isCancellationRequested) {
                    resolve(undefined);
                    return;
                }
                const input = this.createInputBox();
                const validateInput = options.validateInput || (() => Promise.resolve(undefined));
                const onDidValueChange = event_1.Event.debounce(input.onDidChangeValue, (last, cur) => cur, 100);
                let validationValue = options.value || '';
                let validation = Promise.resolve(validateInput(validationValue));
                const disposables = [
                    input,
                    onDidValueChange(value => {
                        if (value !== validationValue) {
                            validation = Promise.resolve(validateInput(value));
                            validationValue = value;
                        }
                        validation.then(result => {
                            if (value === validationValue) {
                                this.setValidationOnInput(input, result);
                            }
                        });
                    }),
                    input.onDidAccept(() => {
                        const value = input.value;
                        if (value !== validationValue) {
                            validation = Promise.resolve(validateInput(value));
                            validationValue = value;
                        }
                        validation.then(result => {
                            if (!result || (!(0, types_1.isString)(result) && result.severity !== severity_1.default.Error)) {
                                resolve(value);
                                input.hide();
                            }
                            else if (value === validationValue) {
                                this.setValidationOnInput(input, result);
                            }
                        });
                    }),
                    token.onCancellationRequested(() => {
                        input.hide();
                    }),
                    input.onDidHide(() => {
                        (0, lifecycle_1.dispose)(disposables);
                        resolve(undefined);
                    }),
                ];
                input.title = options.title;
                input.value = options.value || '';
                input.valueSelection = options.valueSelection;
                input.prompt = options.prompt;
                input.placeholder = options.placeHolder;
                input.password = !!options.password;
                input.ignoreFocusOut = !!options.ignoreFocusLost;
                input.show();
            });
        }
        createQuickPick() {
            const ui = this.getUI(true);
            return new quickInput_2.QuickPick(ui);
        }
        createInputBox() {
            const ui = this.getUI(true);
            return new quickInput_2.InputBox(ui);
        }
        createQuickWidget() {
            const ui = this.getUI(true);
            return new quickInput_2.QuickWidget(ui);
        }
        show(controller) {
            const ui = this.getUI(true);
            this.onShowEmitter.fire();
            const oldController = this.controller;
            this.controller = controller;
            oldController?.didHide();
            this.setEnabled(true);
            ui.leftActionBar.clear();
            ui.title.textContent = '';
            ui.description1.textContent = '';
            ui.description2.textContent = '';
            dom.reset(ui.widget);
            ui.rightActionBar.clear();
            ui.checkAll.checked = false;
            // ui.inputBox.value = ''; Avoid triggering an event.
            ui.inputBox.placeholder = '';
            ui.inputBox.password = false;
            ui.inputBox.showDecoration(severity_1.default.Ignore);
            ui.visibleCount.setCount(0);
            ui.count.setCount(0);
            dom.reset(ui.message);
            ui.progressBar.stop();
            ui.list.setElements([]);
            ui.list.matchOnDescription = false;
            ui.list.matchOnDetail = false;
            ui.list.matchOnLabel = true;
            ui.list.sortByLabel = true;
            ui.ignoreFocusOut = false;
            ui.inputBox.toggles = undefined;
            const backKeybindingLabel = this.options.backKeybindingLabel();
            quickInput_2.backButton.tooltip = backKeybindingLabel ? (0, nls_1.localize)('quickInput.backWithKeybinding', "Back ({0})", backKeybindingLabel) : (0, nls_1.localize)('quickInput.back', "Back");
            ui.container.style.display = '';
            this.updateLayout();
            ui.inputBox.setFocus();
        }
        isVisible() {
            return !!this.ui && this.ui.container.style.display !== 'none';
        }
        setVisibilities(visibilities) {
            const ui = this.getUI();
            ui.title.style.display = visibilities.title ? '' : 'none';
            ui.description1.style.display = visibilities.description && (visibilities.inputBox || visibilities.checkAll) ? '' : 'none';
            ui.description2.style.display = visibilities.description && !(visibilities.inputBox || visibilities.checkAll) ? '' : 'none';
            ui.checkAll.style.display = visibilities.checkAll ? '' : 'none';
            ui.inputContainer.style.display = visibilities.inputBox ? '' : 'none';
            ui.filterContainer.style.display = visibilities.inputBox ? '' : 'none';
            ui.visibleCountContainer.style.display = visibilities.visibleCount ? '' : 'none';
            ui.countContainer.style.display = visibilities.count ? '' : 'none';
            ui.okContainer.style.display = visibilities.ok ? '' : 'none';
            ui.customButtonContainer.style.display = visibilities.customButton ? '' : 'none';
            ui.message.style.display = visibilities.message ? '' : 'none';
            ui.progressBar.getContainer().style.display = visibilities.progressBar ? '' : 'none';
            ui.list.display(!!visibilities.list);
            ui.container.classList.toggle('show-checkboxes', !!visibilities.checkBox);
            ui.container.classList.toggle('hidden-input', !visibilities.inputBox && !visibilities.description);
            this.updateLayout(); // TODO
        }
        setEnabled(enabled) {
            if (enabled !== this.enabled) {
                this.enabled = enabled;
                for (const item of this.getUI().leftActionBar.viewItems) {
                    item.action.enabled = enabled;
                }
                for (const item of this.getUI().rightActionBar.viewItems) {
                    item.action.enabled = enabled;
                }
                this.getUI().checkAll.disabled = !enabled;
                this.getUI().inputBox.enabled = enabled;
                this.getUI().ok.enabled = enabled;
                this.getUI().list.enabled = enabled;
            }
        }
        hide(reason) {
            const controller = this.controller;
            if (!controller) {
                return;
            }
            controller.willHide(reason);
            const container = this.ui?.container;
            const focusChanged = container && !dom.isAncestorOfActiveElement(container);
            this.controller = null;
            this.onHideEmitter.fire();
            if (container) {
                container.style.display = 'none';
            }
            if (!focusChanged) {
                let currentElement = this.previousFocusElement;
                while (currentElement && !currentElement.offsetParent) {
                    currentElement = currentElement.parentElement ?? undefined;
                }
                if (currentElement?.offsetParent) {
                    currentElement.focus();
                    this.previousFocusElement = undefined;
                }
                else {
                    this.options.returnFocus();
                }
            }
            controller.didHide(reason);
        }
        focus() {
            if (this.isVisible()) {
                const ui = this.getUI();
                if (ui.inputBox.enabled) {
                    ui.inputBox.setFocus();
                }
                else {
                    ui.list.domFocus();
                }
            }
        }
        toggle() {
            if (this.isVisible() && this.controller instanceof quickInput_2.QuickPick && this.controller.canSelectMany) {
                this.getUI().list.toggleCheckbox();
            }
        }
        navigate(next, quickNavigate) {
            if (this.isVisible() && this.getUI().list.isDisplayed()) {
                this.getUI().list.focus(next ? quickInputTree_1.QuickInputListFocus.Next : quickInputTree_1.QuickInputListFocus.Previous);
                if (quickNavigate && this.controller instanceof quickInput_2.QuickPick) {
                    this.controller.quickNavigate = quickNavigate;
                }
            }
        }
        async accept(keyMods = { alt: false, ctrlCmd: false }) {
            // When accepting the item programmatically, it is important that
            // we update `keyMods` either from the provided set or unset it
            // because the accept did not happen from mouse or keyboard
            // interaction on the list itself
            this.keyMods.alt = keyMods.alt;
            this.keyMods.ctrlCmd = keyMods.ctrlCmd;
            this.onDidAcceptEmitter.fire();
        }
        async back() {
            this.onDidTriggerButtonEmitter.fire(this.backButton);
        }
        async cancel() {
            this.hide();
        }
        layout(dimension, titleBarOffset) {
            this.dimension = dimension;
            this.titleBarOffset = titleBarOffset;
            this.updateLayout();
        }
        updateLayout() {
            if (this.ui && this.isVisible()) {
                this.ui.container.style.top = `${this.titleBarOffset}px`;
                const style = this.ui.container.style;
                const width = Math.min(this.dimension.width * 0.62 /* golden cut */, QuickInputController_1.MAX_WIDTH);
                style.width = width + 'px';
                style.marginLeft = '-' + (width / 2) + 'px';
                this.ui.inputBox.layout();
                this.ui.list.layout(this.dimension && this.dimension.height * 0.4);
            }
        }
        applyStyles(styles) {
            this.styles = styles;
            this.updateStyles();
        }
        updateStyles() {
            if (this.ui) {
                const { quickInputTitleBackground, quickInputBackground, quickInputForeground, widgetBorder, widgetShadow, } = this.styles.widget;
                this.ui.titleBar.style.backgroundColor = quickInputTitleBackground ?? '';
                this.ui.container.style.backgroundColor = quickInputBackground ?? '';
                this.ui.container.style.color = quickInputForeground ?? '';
                this.ui.container.style.border = widgetBorder ? `1px solid ${widgetBorder}` : '';
                this.ui.container.style.boxShadow = widgetShadow ? `0 0 8px 2px ${widgetShadow}` : '';
                this.ui.list.style(this.styles.list);
                const content = [];
                if (this.styles.pickerGroup.pickerGroupBorder) {
                    content.push(`.quick-input-list .quick-input-list-entry { border-top-color:  ${this.styles.pickerGroup.pickerGroupBorder}; }`);
                }
                if (this.styles.pickerGroup.pickerGroupForeground) {
                    content.push(`.quick-input-list .quick-input-list-separator { color:  ${this.styles.pickerGroup.pickerGroupForeground}; }`);
                }
                if (this.styles.pickerGroup.pickerGroupForeground) {
                    content.push(`.quick-input-list .quick-input-list-separator-as-item { color: var(--vscode-descriptionForeground); }`);
                }
                if (this.styles.keybindingLabel.keybindingLabelBackground ||
                    this.styles.keybindingLabel.keybindingLabelBorder ||
                    this.styles.keybindingLabel.keybindingLabelBottomBorder ||
                    this.styles.keybindingLabel.keybindingLabelShadow ||
                    this.styles.keybindingLabel.keybindingLabelForeground) {
                    content.push('.quick-input-list .monaco-keybinding > .monaco-keybinding-key {');
                    if (this.styles.keybindingLabel.keybindingLabelBackground) {
                        content.push(`background-color: ${this.styles.keybindingLabel.keybindingLabelBackground};`);
                    }
                    if (this.styles.keybindingLabel.keybindingLabelBorder) {
                        // Order matters here. `border-color` must come before `border-bottom-color`.
                        content.push(`border-color: ${this.styles.keybindingLabel.keybindingLabelBorder};`);
                    }
                    if (this.styles.keybindingLabel.keybindingLabelBottomBorder) {
                        content.push(`border-bottom-color: ${this.styles.keybindingLabel.keybindingLabelBottomBorder};`);
                    }
                    if (this.styles.keybindingLabel.keybindingLabelShadow) {
                        content.push(`box-shadow: inset 0 -1px 0 ${this.styles.keybindingLabel.keybindingLabelShadow};`);
                    }
                    if (this.styles.keybindingLabel.keybindingLabelForeground) {
                        content.push(`color: ${this.styles.keybindingLabel.keybindingLabelForeground};`);
                    }
                    content.push('}');
                }
                const newStyles = content.join('\n');
                if (newStyles !== this.ui.styleSheet.textContent) {
                    this.ui.styleSheet.textContent = newStyles;
                }
            }
        }
    };
    exports.QuickInputController = QuickInputController;
    exports.QuickInputController = QuickInputController = QuickInputController_1 = __decorate([
        __param(1, layoutService_1.ILayoutService),
        __param(2, instantiation_1.IInstantiationService)
    ], QuickInputController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tJbnB1dENvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3F1aWNraW5wdXQvYnJvd3Nlci9xdWlja0lucHV0Q29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBdUJoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRVQsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTs7aUJBQzNCLGNBQVMsR0FBRyxHQUFHLEFBQU4sQ0FBTyxHQUFDLHdDQUF3QztRQWVqRixJQUFJLFNBQVMsS0FBSyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBWTNDLFlBQ1MsT0FBMkIsRUFDbkIsYUFBOEMsRUFDdkMsb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBSkEsWUFBTyxHQUFQLE9BQU8sQ0FBb0I7WUFDRixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDdEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQXhCNUUsWUFBTyxHQUFHLElBQUksQ0FBQztZQUNOLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3pELHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3pELDhCQUF5QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUN0RixZQUFPLEdBQXdCLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUM7WUFFOUQsZUFBVSxHQUF1QixJQUFJLENBQUM7WUFPdEMsa0JBQWEsR0FB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