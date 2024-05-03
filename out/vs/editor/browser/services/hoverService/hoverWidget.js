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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/platform/configuration/common/configuration", "vs/editor/common/config/editorOptions", "vs/base/browser/ui/hover/hoverWidget", "vs/base/browser/ui/widget", "vs/platform/opener/common/opener", "vs/platform/instantiation/common/instantiation", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/base/common/htmlContent", "vs/nls", "vs/base/common/platform", "vs/platform/accessibility/common/accessibility", "vs/base/browser/ui/aria/aria", "vs/css!./hover"], function (require, exports, lifecycle_1, event_1, dom, keybinding_1, configuration_1, editorOptions_1, hoverWidget_1, widget_1, opener_1, instantiation_1, markdownRenderer_1, htmlContent_1, nls_1, platform_1, accessibility_1, aria_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverWidget = void 0;
    const $ = dom.$;
    var Constants;
    (function (Constants) {
        Constants[Constants["PointerSize"] = 3] = "PointerSize";
        Constants[Constants["HoverBorderWidth"] = 2] = "HoverBorderWidth";
        Constants[Constants["HoverWindowEdgeMargin"] = 2] = "HoverWindowEdgeMargin";
    })(Constants || (Constants = {}));
    let HoverWidget = class HoverWidget extends widget_1.Widget {
        get _targetWindow() {
            return dom.getWindow(this._target.targetElements[0]);
        }
        get _targetDocumentElement() {
            return dom.getWindow(this._target.targetElements[0]).document.documentElement;
        }
        get isDisposed() { return this._isDisposed; }
        get isMouseIn() { return this._lockMouseTracker.isMouseIn; }
        get domNode() { return this._hover.containerDomNode; }
        get onDispose() { return this._onDispose.event; }
        get onRequestLayout() { return this._onRequestLayout.event; }
        get anchor() { return this._hoverPosition === 2 /* HoverPosition.BELOW */ ? 0 /* AnchorPosition.BELOW */ : 1 /* AnchorPosition.ABOVE */; }
        get x() { return this._x; }
        get y() { return this._y; }
        /**
         * Whether the hover is "locked" by holding the alt/option key. When locked, the hover will not
         * hide and can be hovered regardless of whether the `hideOnHover` hover option is set.
         */
        get isLocked() { return this._isLocked; }
        set isLocked(value) {
            if (this._isLocked === value) {
                return;
            }
            this._isLocked = value;
            this._hoverContainer.classList.toggle('locked', this._isLocked);
        }
        constructor(options, _keybindingService, _configurationService, _openerService, _instantiationService, _accessibilityService) {
            super();
            this._keybindingService = _keybindingService;
            this._configurationService = _configurationService;
            this._openerService = _openerService;
            this._instantiationService = _instantiationService;
            this._accessibilityService = _accessibilityService;
            this._messageListeners = new lifecycle_1.DisposableStore();
            this._isDisposed = false;
            this._forcePosition = false;
            this._x = 0;
            this._y = 0;
            this._isLocked = false;
            this._enableFocusTraps = false;
            this._addedFocusTrap = false;
            this._onDispose = this._register(new event_1.Emitter());
            this._onRequestLayout = this._register(new event_1.Emitter());
            this._linkHandler = options.linkHandler || (url => {
                return (0, markdownRenderer_1.openLinkFromMarkdown)(this._openerService, url, (0, htmlContent_1.isMarkdownString)(options.content) ? options.content.isTrusted : undefined);
            });
            this._target = 'targetElements' in options.target ? options.target : new ElementHoverTarget(options.target);
            this._hoverPointer = options.appearance?.showPointer ? $('div.workbench-hover-pointer') : undefined;
            this._hover = this._register(new hoverWidget_1.HoverWidget());
            this._hover.containerDomNode.classList.add('workbench-hover', 'fadeIn');
            if (options.appearance?.compact) {
                this._hover.containerDomNode.classList.add('workbench-hover', 'compact');
            }
            if (options.appearance?.skipFadeInAnimation) {
                this._hover.containerDomNode.classList.add('skip-fade-in');
            }
            if (options.additionalClasses) {
                this._hover.containerDomNode.classList.add(...options.additionalClasses);
            }
            if (options.position?.forcePosition) {
                this._forcePosition = true;
            }
            if (options.trapFocus) {
                this._enableFocusTraps = true;
            }
            this._hoverPosition = options.position?.hoverPosition ?? 3 /* HoverPosition.ABOVE */;
            // Don't allow mousedown out of the widget, otherwise preventDefault will call and text will
            // not be selected.
            this.onmousedown(this._hover.containerDomNode, e => e.stopPropagation());
            // Hide hover on escape
            this.onkeydown(this._hover.containerDomNode, e => {
                if (e.equals(9 /* KeyCode.Escape */)) {
                    this.dispose();
                }
            });
            // Hide when the window loses focus
            this._register(dom.addDisposableListener(this._targetWindow, 'blur', () => this.dispose()));
            const rowElement = $('div.hover-row.markdown-hover');
            const contentsElement = $('div.hover-contents');
            if (typeof options.content === 'string') {
                contentsElement.textContent = options.content;
                contentsElement.style.whiteSpace = 'pre-wrap';
            }
            else if (options.content instanceof HTMLElement) {
                contentsElement.appendChild(options.content);
                contentsElement.classList.add('html-hover-contents');
            }
            else {
                const markdown = options.content;
                const mdRenderer = this._instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, { codeBlockFontFamily: this._configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily });
                const { element } = mdRenderer.render(markdown, {
                    actionHandler: {
                        callback: (content) => this._linkHandler(content),
                        disposables: this._messageListeners
                    },
                    asyncRenderCallback: () => {
                        contentsElement.classList.add('code-hover-contents');
                        this.layout();
                        // This changes the dimensions of the hover so trigger a layout
                        this._onRequestLayout.fire();
                    }
                });
                contentsElement.appendChild(element);
            }
            rowElement.appendChild(contentsElement);
            this._hover.contentsDomNode.appendChild(rowElement);
            if (options.actions && options.actions.length > 0) {
                const statusBarElement = $('div.hover-row.status-bar');
                const actionsElement = $('div.actions');
                options.actions.forEach(action => {
                    const keybinding = this._keybindingService.lookupKeybinding(action.commandId);
                    const keybindingLabel = keybinding ? keybinding.getLabel() : null;
                    hoverWidget_1.HoverAction.render(actionsElement, {
                        label: action.label,
                        commandId: action.commandId,
                        run: e => {
                            action.run(e);
                            this.dispose();
                        },
                        iconClass: action.iconClass
                    }, keybindingLabel);
                });
                statusBarElement.appendChild(actionsElement);
                this._hover.containerDomNode.appendChild(statusBarElement);
            }
            this._hoverContainer = $('div.workbench-hover-container');
            if (this._hoverPointer) {
                this._hoverContainer.appendChild(this._hoverPointer);
            }
            this._hoverContainer.appendChild(this._hover.containerDomNode);
            // Determine whether to hide on hover
            let hideOnHover;
            if (options.actions && options.actions.length > 0) {
                // If there are actions, require hover so they can be accessed
                hideOnHover = false;
            }
            else {
                if (options.persistence?.hideOnHover === undefined) {
                    // When unset, will default to true when it's a string or when it's markdown that
                    // appears to have a link using a naive check for '](' and '</a>'
                    hideOnHover = typeof options.content === 'string' ||
                        (0, htmlContent_1.isMarkdownString)(options.content) && !options.content.value.includes('](') && !options.content.value.includes('</a>');
                }
                else {
                    // It's set explicitly
                    hideOnHover = options.persistence.hideOnHover;
                }
            }
            // Show the hover hint if needed
            if (hideOnHover && options.appearance?.showHoverHint) {
                const statusBarElement = $('div.hover-row.status-bar');
                const infoElement = $('div.info');
                infoElement.textContent = (0, nls_1.localize)('hoverhint', 'Hold {0} key to mouse over', platform_1.isMacintosh ? 'Option' : 'Alt');
                statusBarElement.appendChild(infoElement);
                this._hover.containerDomNode.appendChild(statusBarElement);
            }
            const mouseTrackerTargets = [...this._target.targetElements];
            if (!hideOnHover) {
                mouseTrackerTargets.push(this._hoverContainer);
            }
            const mouseTracker = this._register(new CompositeMouseTracker(mouseTrackerTargets));
            this._register(mouseTracker.onMouseOut(() => {
                if (!this._isLocked) {
                    this.dispose();
                }
            }));
            // Setup another mouse tracker when hideOnHover is set in order to track the hover as well
            // when it is locked. This ensures the hover will hide on mouseout after alt has been
            // released to unlock the element.
            if (hideOnHover) {
                const mouseTracker2Targets = [...this._target.targetElements, this._hoverContainer];
                this._lockMouseTracker = this._register(new CompositeMouseTracker(mouseTracker2Targets));
                this._register(this._lockMouseTracker.onMouseOut(() => {
                    if (!this._isLocked) {
                        this.dispose();
                    }
                }));
            }
            else {
                this._lockMouseTracker = mouseTracker;
            }
        }
        addFocusTrap() {
            if (!this._enableFocusTraps || this._addedFocusTrap) {
                return;
            }
            this._addedFocusTrap = true;
            // Add a hover tab loop if the hover has at least one element with a valid tabIndex
            const firstContainerFocusElement = this._hover.containerDomNode;
            const lastContainerFocusElement = this.findLastFocusableChild(this._hover.containerDomNode);
            if (lastContainerFocusElement) {
                const beforeContainerFocusElement = dom.prepend(this._hoverContainer, $('div'));
                const afterContainerFocusElement = dom.append(this._hoverContainer, $('div'));
                beforeContainerFocusElement.tabIndex = 0;
                afterContainerFocusElement.tabIndex = 0;
                this._register(dom.addDisposableListener(afterContainerFocusElement, 'focus', (e) => {
                    firstContainerFocusElement.focus();
                    e.preventDefault();
                }));
                this._register(dom.addDisposableListener(beforeContainerFocusElement, 'focus', (e) => {
                    lastContainerFocusElement.focus();
                    e.preventDefault();
                }));
            }
        }
        findLastFocusableChild(root) {
            if (root.hasChildNodes()) {
                for (let i = 0; i < root.childNodes.length; i++) {
                    const node = root.childNodes.item(root.childNodes.length - i - 1);
                    if (node.nodeType === node.ELEMENT_NODE) {
                        const parsedNode = node;
                        if (typeof parsedNode.tabIndex === 'number' && parsedNode.tabIndex >= 0) {
                            return parsedNode;
                        }
                    }
                    const recursivelyFoundElement = this.findLastFocusableChild(node);
                    if (recursivelyFoundElement) {
                        return recursivelyFoundElement;
                    }
                }
            }
            return undefined;
        }
        render(container) {
            container.appendChild(this._hoverContainer);
            const hoverFocused = this._hoverContainer.contains(this._hoverContainer.ownerDocument.activeElement);
            const accessibleViewHint = hoverFocused && (0, hoverWidget_1.getHoverAccessibleViewHint)(this._configurationService.getValue('accessibility.verbosity.hover') === true && this._accessibilityService.isScreenReaderOptimized(), this._keybindingService.lookupKeybinding('editor.action.accessibleView')?.getAriaLabel());
            if (accessibleViewHint) {
                (0, aria_1.status)(accessibleViewHint);
            }
            this.layout();
            this.addFocusTrap();
        }
        layout() {
            this._hover.containerDomNode.classList.remove('right-aligned');
            this._hover.contentsDomNode.style.maxHeight = '';
            const getZoomAccountedBoundingClientRect = (e) => {
                const zoom = dom.getDomNodeZoomLevel(e);
                const boundingRect = e.getBoundingClientRect();
                return {
                    top: boundingRect.top * zoom,
                    bottom: boundingRect.bottom * zoom,
                    right: boundingRect.right * zoom,
                    left: boundingRect.left * zoom,
                };
            };
            const targetBounds = this._target.targetElements.map(e => getZoomAccountedBoundingClientRect(e));
            const { top, right, bottom, left } = targetBounds[0];
            const width = right - left;
            const height = bottom - top;
            const targetRect = {
                top, right, bottom, left, width, height,
                center: {
                    x: left + (width / 2),
                    y: top + (height / 2)
                }
            };
            // These calls adjust the position depending on spacing.
            this.adjustHorizontalHoverPosition(targetRect);
            this.adjustVerticalHoverPosition(targetRect);
            // This call limits the maximum height of the hover.
            this.adjustHoverMaxHeight(targetRect);
            // Offset the hover position if there is a pointer so it aligns with the target element
            this._hoverContainer.style.padding = '';
            this._hoverContainer.style.margin = '';
            if (this._hoverPointer) {
                switch (this._hoverPosition) {
                    case 1 /* HoverPosition.RIGHT */:
                        targetRect.left += 3 /* Constants.PointerSize */;
                        targetRect.right += 3 /* Constants.PointerSize */;
                        this._hoverContainer.style.paddingLeft = `${3 /* Constants.PointerSize */}px`;
                        this._hoverContainer.style.marginLeft = `${-3 /* Constants.PointerSize */}px`;
                        break;
                    case 0 /* HoverPosition.LEFT */:
                        targetRect.left -= 3 /* Constants.PointerSize */;
                        targetRect.right -= 3 /* Constants.PointerSize */;
                        this._hoverContainer.style.paddingRight = `${3 /* Constants.PointerSize */}px`;
                        this._hoverContainer.style.marginRight = `${-3 /* Constants.PointerSize */}px`;
                        break;
                    case 2 /* HoverPosition.BELOW */:
                        targetRect.top += 3 /* Constants.PointerSize */;
                        targetRect.bottom += 3 /* Constants.PointerSize */;
                        this._hoverContainer.style.paddingTop = `${3 /* Constants.PointerSize */}px`;
                        this._hoverContainer.style.marginTop = `${-3 /* Constants.PointerSize */}px`;
                        break;
                    case 3 /* HoverPosition.ABOVE */:
                        targetRect.top -= 3 /* Constants.PointerSize */;
                        targetRect.bottom -= 3 /* Constants.PointerSize */;
                        this._hoverContainer.style.paddingBottom = `${3 /* Constants.PointerSize */}px`;
                        this._hoverContainer.style.marginBottom = `${-3 /* Constants.PointerSize */}px`;
                        break;
                }
                targetRect.center.x = targetRect.left + (width / 2);
                targetRect.center.y = targetRect.top + (height / 2);
            }
            this.computeXCordinate(targetRect);
            this.computeYCordinate(targetRect);
            if (this._hoverPointer) {
                // reset
                this._hoverPointer.classList.remove('top');
                this._hoverPointer.classList.remove('left');
                this._hoverPointer.classList.remove('right');
                this._hoverPointer.classList.remove('bottom');
                this.setHoverPointerPosition(targetRect);
            }
            this._hover.onContentsChanged();
        }
        computeXCordinate(target) {
            const hoverWidth = this._hover.containerDomNode.clientWidth + 2 /* Constants.HoverBorderWidth */;
            if (this._target.x !== undefined) {
                this._x = this._target.x;
            }
            else if (this._hoverPosition === 1 /* HoverPosition.RIGHT */) {
                this._x = target.right;
            }
            else if (this._hoverPosition === 0 /* HoverPosition.LEFT */) {
                this._x = target.left - hoverWidth;
            }
            else {
                if (this._hoverPointer) {
                    this._x = target.center.x - (this._hover.containerDomNode.clientWidth / 2);
                }
                else {
                    this._x = target.left;
                }
                // Hover is going beyond window towards right end
                if (this._x + hoverWidth >= this._targetDocumentElement.clientWidth) {
                    this._hover.containerDomNode.classList.add('right-aligned');
                    this._x = Math.max(this._targetDocumentElement.clientWidth - hoverWidth - 2 /* Constants.HoverWindowEdgeMargin */, this._targetDocumentElement.clientLeft);
                }
            }
            // Hover is going beyond window towards left end
            if (this._x < this._targetDocumentElement.clientLeft) {
                this._x = target.left + 2 /* Constants.HoverWindowEdgeMargin */;
            }
        }
        computeYCordinate(target) {
            if (this._target.y !== undefined) {
                this._y = this._target.y;
            }
            else if (this._hoverPosition === 3 /* HoverPosition.ABOVE */) {
                this._y = target.top;
            }
            else if (this._hoverPosition === 2 /* HoverPosition.BELOW */) {
                this._y = target.bottom - 2;
            }
            else {
                if (this._hoverPointer) {
                    this._y = target.center.y + (this._hover.containerDomNode.clientHeight / 2);
                }
                else {
                    this._y = target.bottom;
                }
            }
            // Hover on bottom is going beyond window
            if (this._y > this._targetWindow.innerHeight) {
                this._y = target.bottom;
            }
        }
        adjustHorizontalHoverPosition(target) {
            // Do not adjust horizontal hover position if x cordiante is provided
            if (this._target.x !== undefined) {
                return;
            }
            const hoverPointerOffset = (this._hoverPointer ? 3 /* Constants.PointerSize */ : 0);
            // When force position is enabled, restrict max width
            if (this._forcePosition) {
                const padding = hoverPointerOffset + 2 /* Constants.HoverBorderWidth */;
                if (this._hoverPosition === 1 /* HoverPosition.RIGHT */) {
                    this._hover.containerDomNode.style.maxWidth = `${this._targetDocumentElement.clientWidth - target.right - padding}px`;
                }
                else if (this._hoverPosition === 0 /* HoverPosition.LEFT */) {
                    this._hover.containerDomNode.style.maxWidth = `${target.left - padding}px`;
                }
                return;
            }
            // Position hover on right to target
            if (this._hoverPosition === 1 /* HoverPosition.RIGHT */) {
                const roomOnRight = this._targetDocumentElement.clientWidth - target.right;
                // Hover on the right is going beyond window.
                if (roomOnRight < this._hover.containerDomNode.clientWidth + hoverPointerOffset) {
                    const roomOnLeft = target.left;
                    // There's enough room on the left, flip the hover position
                    if (roomOnLeft >= this._hover.containerDomNode.clientWidth + hoverPointerOffset) {
                        this._hoverPosition = 0 /* HoverPosition.LEFT */;
                    }
                    // Hover on the left would go beyond window too
                    else {
                        this._hoverPosition = 2 /* HoverPosition.BELOW */;
                    }
                }
            }
            // Position hover on left to target
            else if (this._hoverPosition === 0 /* HoverPosition.LEFT */) {
                const roomOnLeft = target.left;
                // Hover on the left is going beyond window.
                if (roomOnLeft < this._hover.containerDomNode.clientWidth + hoverPointerOffset) {
                    const roomOnRight = this._targetDocumentElement.clientWidth - target.right;
                    // There's enough room on the right, flip the hover position
                    if (roomOnRight >= this._hover.containerDomNode.clientWidth + hoverPointerOffset) {
                        this._hoverPosition = 1 /* HoverPosition.RIGHT */;
                    }
                    // Hover on the right would go beyond window too
                    else {
                        this._hoverPosition = 2 /* HoverPosition.BELOW */;
                    }
                }
                // Hover on the left is going beyond window.
                if (target.left - this._hover.containerDomNode.clientWidth - hoverPointerOffset <= this._targetDocumentElement.clientLeft) {
                    this._hoverPosition = 1 /* HoverPosition.RIGHT */;
                }
            }
        }
        adjustVerticalHoverPosition(target) {
            // Do not adjust vertical hover position if the y coordinate is provided
            // or the position is forced
            if (this._target.y !== undefined || this._forcePosition) {
                return;
            }
            const hoverPointerOffset = (this._hoverPointer ? 3 /* Constants.PointerSize */ : 0);
            // Position hover on top of the target
            if (this._hoverPosition === 3 /* HoverPosition.ABOVE */) {
                // Hover on top is going beyond window
                if (target.top - this._hover.containerDomNode.clientHeight - hoverPointerOffset < 0) {
                    this._hoverPosition = 2 /* HoverPosition.BELOW */;
                }
            }
            // Position hover below the target
            else if (this._hoverPosition === 2 /* HoverPosition.BELOW */) {
                // Hover on bottom is going beyond window
                if (target.bottom + this._hover.containerDomNode.clientHeight + hoverPointerOffset > this._targetWindow.innerHeight) {
                    this._hoverPosition = 3 /* HoverPosition.ABOVE */;
                }
            }
        }
        adjustHoverMaxHeight(target) {
            let maxHeight = this._targetWindow.innerHeight / 2;
            // When force position is enabled, restrict max height
            if (this._forcePosition) {
                const padding = (this._hoverPointer ? 3 /* Constants.PointerSize */ : 0) + 2 /* Constants.HoverBorderWidth */;
                if (this._hoverPosition === 3 /* HoverPosition.ABOVE */) {
                    maxHeight = Math.min(maxHeight, target.top - padding);
                }
                else if (this._hoverPosition === 2 /* HoverPosition.BELOW */) {
                    maxHeight = Math.min(maxHeight, this._targetWindow.innerHeight - target.bottom - padding);
                }
            }
            this._hover.containerDomNode.style.maxHeight = `${maxHeight}px`;
            if (this._hover.contentsDomNode.clientHeight < this._hover.contentsDomNode.scrollHeight) {
                // Add padding for a vertical scrollbar
                const extraRightPadding = `${this._hover.scrollbar.options.verticalScrollbarSize}px`;
                if (this._hover.contentsDomNode.style.paddingRight !== extraRightPadding) {
                    this._hover.contentsDomNode.style.paddingRight = extraRightPadding;
                }
            }
        }
        setHoverPointerPosition(target) {
            if (!this._hoverPointer) {
                return;
            }
            switch (this._hoverPosition) {
                case 0 /* HoverPosition.LEFT */:
                case 1 /* HoverPosition.RIGHT */: {
                    this._hoverPointer.classList.add(this._hoverPosition === 0 /* HoverPosition.LEFT */ ? 'right' : 'left');
                    const hoverHeight = this._hover.containerDomNode.clientHeight;
                    // If hover is taller than target, then show the pointer at the center of target
                    if (hoverHeight > target.height) {
                        this._hoverPointer.style.top = `${target.center.y - (this._y - hoverHeight) - 3 /* Constants.PointerSize */}px`;
                    }
                    // Otherwise show the pointer at the center of hover
                    else {
                        this._hoverPointer.style.top = `${Math.round((hoverHeight / 2)) - 3 /* Constants.PointerSize */}px`;
                    }
                    break;
                }
                case 3 /* HoverPosition.ABOVE */:
                case 2 /* HoverPosition.BELOW */: {
                    this._hoverPointer.classList.add(this._hoverPosition === 3 /* HoverPosition.ABOVE */ ? 'bottom' : 'top');
                    const hoverWidth = this._hover.containerDomNode.clientWidth;
                    // Position pointer at the center of the hover
                    let pointerLeftPosition = Math.round((hoverWidth / 2)) - 3 /* Constants.PointerSize */;
                    // If pointer goes beyond target then position it at the center of the target
                    const pointerX = this._x + pointerLeftPosition;
                    if (pointerX < target.left || pointerX > target.right) {
                        pointerLeftPosition = target.center.x - this._x - 3 /* Constants.PointerSize */;
                    }
                    this._hoverPointer.style.left = `${pointerLeftPosition}px`;
                    break;
                }
            }
        }
        focus() {
            this._hover.containerDomNode.focus();
        }
        hide() {
            this.dispose();
        }
        dispose() {
            if (!this._isDisposed) {
                this._onDispose.fire();
                this._hoverContainer.remove();
                this._messageListeners.dispose();
                this._target.dispose();
                super.dispose();
            }
            this._isDisposed = true;
        }
    };
    exports.HoverWidget = HoverWidget;
    exports.HoverWidget = HoverWidget = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, opener_1.IOpenerService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, accessibility_1.IAccessibilityService)
    ], HoverWidget);
    class CompositeMouseTracker extends widget_1.Widget {
        get onMouseOut() { return this._onMouseOut.event; }
        get isMouseIn() { return this._isMouseIn; }
        constructor(_elements) {
            super();
            this._elements = _elements;
            this._isMouseIn = true;
            this._onMouseOut = this._register(new event_1.Emitter());
            this._elements.forEach(n => this.onmouseover(n, () => this._onTargetMouseOver(n)));
            this._elements.forEach(n => this.onmouseleave(n, () => this._onTargetMouseLeave(n)));
        }
        _onTargetMouseOver(target) {
            this._isMouseIn = true;
            this._clearEvaluateMouseStateTimeout(target);
        }
        _onTargetMouseLeave(target) {
            this._isMouseIn = false;
            this._evaluateMouseState(target);
        }
        _evaluateMouseState(target) {
            this._clearEvaluateMouseStateTimeout(target);
            // Evaluate whether the mouse is still outside asynchronously such that other mouse targets
            // have the opportunity to first their mouse in event.
            this._mouseTimeout = dom.getWindow(target).setTimeout(() => this._fireIfMouseOutside(), 0);
        }
        _clearEvaluateMouseStateTimeout(target) {
            if (this._mouseTimeout) {
                dom.getWindow(target).clearTimeout(this._mouseTimeout);
                this._mouseTimeout = undefined;
            }
        }
        _fireIfMouseOutside() {
            if (!this._isMouseIn) {
                this._onMouseOut.fire();
            }
        }
    }
    class ElementHoverTarget {
        constructor(_element) {
            this._element = _element;
            this.targetElements = [this._element];
        }
        dispose() {
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3NlcnZpY2VzL2hvdmVyU2VydmljZS9ob3ZlcldpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QmhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFXaEIsSUFBVyxTQUlWO0lBSkQsV0FBVyxTQUFTO1FBQ25CLHVEQUFlLENBQUE7UUFDZixpRUFBb0IsQ0FBQTtRQUNwQiwyRUFBeUIsQ0FBQTtJQUMxQixDQUFDLEVBSlUsU0FBUyxLQUFULFNBQVMsUUFJbkI7SUFFTSxJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFZLFNBQVEsZUFBTTtRQW1CdEMsSUFBWSxhQUFhO1lBQ3hCLE9BQU8sR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFDRCxJQUFZLHNCQUFzQjtZQUNqQyxPQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDO1FBQy9FLENBQUM7UUFFRCxJQUFJLFVBQVUsS0FBYyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ3RELElBQUksU0FBUyxLQUFjLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDckUsSUFBSSxPQUFPLEtBQWtCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFHbkUsSUFBSSxTQUFTLEtBQWtCLE9BQU8sSUFBSSxDQUFDLFVB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