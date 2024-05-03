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
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/language", "vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition", "vs/editor/contrib/hover/browser/contentHover", "vs/editor/contrib/hover/browser/marginHover", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/hover/browser/markdownHoverParticipant", "vs/editor/contrib/hover/browser/markerHoverParticipant", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsHintsWidget", "vs/platform/keybinding/common/keybinding", "vs/base/common/async", "vs/nls", "vs/css!./hover"], function (require, exports, keyCodes_1, lifecycle_1, editorExtensions_1, range_1, editorContextKeys_1, language_1, goToDefinitionAtPosition_1, contentHover_1, marginHover_1, instantiation_1, opener_1, colorRegistry_1, themeService_1, hoverTypes_1, markdownHoverParticipant_1, markerHoverParticipant_1, inlineCompletionsHintsWidget_1, keybinding_1, async_1, nls) {
    "use strict";
    var HoverController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverController = void 0;
    // sticky hover widget which doesn't disappear on focus out and such
    const _sticky = false;
    let HoverController = class HoverController extends lifecycle_1.Disposable {
        static { HoverController_1 = this; }
        static { this.ID = 'editor.contrib.hover'; }
        constructor(_editor, _instantiationService, _openerService, _languageService, _keybindingService) {
            super();
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            this._openerService = _openerService;
            this._languageService = _languageService;
            this._keybindingService = _keybindingService;
            this._listenersStore = new lifecycle_1.DisposableStore();
            this._hoverState = {
                mouseDown: false,
                contentHoverFocused: false,
                activatedByDecoratorClick: false
            };
            this._reactToEditorMouseMoveRunner = this._register(new async_1.RunOnceScheduler(() => this._reactToEditorMouseMove(this._mouseMoveEvent), 0));
            this._hookListeners();
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(60 /* EditorOption.hover */)) {
                    this._unhookListeners();
                    this._hookListeners();
                }
            }));
        }
        static get(editor) {
            return editor.getContribution(HoverController_1.ID);
        }
        _hookListeners() {
            const hoverOpts = this._editor.getOption(60 /* EditorOption.hover */);
            this._hoverSettings = {
                enabled: hoverOpts.enabled,
                sticky: hoverOpts.sticky,
                hidingDelay: hoverOpts.delay
            };
            if (hoverOpts.enabled) {
                this._listenersStore.add(this._editor.onMouseDown((e) => this._onEditorMouseDown(e)));
                this._listenersStore.add(this._editor.onMouseUp(() => this._onEditorMouseUp()));
                this._listenersStore.add(this._editor.onMouseMove((e) => this._onEditorMouseMove(e)));
                this._listenersStore.add(this._editor.onKeyDown((e) => this._onKeyDown(e)));
            }
            else {
                this._listenersStore.add(this._editor.onMouseMove((e) => this._onEditorMouseMove(e)));
                this._listenersStore.add(this._editor.onKeyDown((e) => this._onKeyDown(e)));
            }
            this._listenersStore.add(this._editor.onMouseLeave((e) => this._onEditorMouseLeave(e)));
            this._listenersStore.add(this._editor.onDidChangeModel(() => {
                this._cancelScheduler();
                this._hideWidgets();
            }));
            this._listenersStore.add(this._editor.onDidChangeModelContent(() => this._cancelScheduler()));
            this._listenersStore.add(this._editor.onDidScrollChange((e) => this._onEditorScrollChanged(e)));
        }
        _unhookListeners() {
            this._listenersStore.clear();
        }
        _cancelScheduler() {
            this._mouseMoveEvent = undefined;
            this._reactToEditorMouseMoveRunner.cancel();
        }
        _onEditorScrollChanged(e) {
            if (e.scrollTopChanged || e.scrollLeftChanged) {
                this._hideWidgets();
            }
        }
        _onEditorMouseDown(mouseEvent) {
            this._hoverState.mouseDown = true;
            const target = mouseEvent.target;
            if (target.type === 9 /* MouseTargetType.CONTENT_WIDGET */ && target.detail === contentHover_1.ContentHoverWidget.ID) {
                // mouse down on top of content hover widget
                this._hoverState.contentHoverFocused = true;
                return;
            }
            if (target.type === 12 /* MouseTargetType.OVERLAY_WIDGET */ && target.detail === marginHover_1.MarginHoverWidget.ID) {
                // mouse down on top of margin hover widget
                return;
            }
            if (target.type !== 12 /* MouseTargetType.OVERLAY_WIDGET */) {
                this._hoverState.contentHoverFocused = false;
            }
            if (this._contentWidget?.widget.isResizing) {
                return;
            }
            this._hideWidgets();
        }
        _onEditorMouseUp() {
            this._hoverState.mouseDown = false;
        }
        _onEditorMouseLeave(mouseEvent) {
            this._cancelScheduler();
            const targetElement = (mouseEvent.event.browserEvent.relatedTarget);
            if (this._contentWidget?.widget.isResizing || this._contentWidget?.containsNode(targetElement)) {
                // When the content widget is resizing
                // When the mouse is inside hover widget
                return;
            }
            if (_sticky) {
                return;
            }
            this._hideWidgets();
        }
        _isMouseOverWidget(mouseEvent) {
            const target = mouseEvent.target;
            const sticky = this._hoverSettings.sticky;
            if (sticky
                && target.type === 9 /* MouseTargetType.CONTENT_WIDGET */
                && target.detail === contentHover_1.ContentHoverWidget.ID) {
                // mouse moved on top of content hover widget
                return true;
            }
            if (sticky
                && this._contentWidget?.containsNode(mouseEvent.event.browserEvent.view?.document.activeElement)
                && !mouseEvent.event.browserEvent.view?.getSelection()?.isCollapsed) {
                // selected text within content hover widget
                return true;
            }
            if (!sticky
                && target.type === 9 /* MouseTargetType.CONTENT_WIDGET */
                && target.detail === contentHover_1.ContentHoverWidget.ID
                && this._contentWidget?.isColorPickerVisible) {
                // though the hover is not sticky, the color picker is sticky
                return true;
            }
            if (sticky
                && target.type === 12 /* MouseTargetType.OVERLAY_WIDGET */
                && target.detail === marginHover_1.MarginHoverWidget.ID) {
                // mouse moved on top of overlay hover widget
                return true;
            }
            return false;
        }
        _onEditorMouseMove(mouseEvent) {
            this._mouseMoveEvent = mouseEvent;
            if (this._contentWidget?.isFocused || this._contentWidget?.isResizing) {
                return;
            }
            if (this._hoverState.mouseDown && this._hoverState.contentHoverFocused) {
                return;
            }
            const sticky = this._hoverSettings.sticky;
            if (sticky && this._contentWidget?.isVisibleFromKeyboard) {
                // Sticky mode is on and the hover has been shown via keyboard
                // so moving the mouse has no effect
                return;
            }
            const mouseIsOverWidget = this._isMouseOverWidget(mouseEvent);
            // If the mouse is over the widget and the hiding timeout is defined, then cancel it
            if (mouseIsOverWidget) {
                this._reactToEditorMouseMoveRunner.cancel();
                return;
            }
            // If the mouse is not over the widget, and if sticky is on,
            // then give it a grace period before reacting to the mouse event
            const hidingDelay = this._hoverSettings.hidingDelay;
            if (this._contentWidget?.isVisible && sticky && hidingDelay > 0) {
                if (!this._reactToEditorMouseMoveRunner.isScheduled()) {
                    this._reactToEditorMouseMoveRunner.schedule(hidingDelay);
                }
                return;
            }
            this._reactToEditorMouseMove(mouseEvent);
        }
        _reactToEditorMouseMove(mouseEvent) {
            if (!mouseEvent) {
                return;
            }
            const target = mouseEvent.target;
            const mouseOnDecorator = target.element?.classList.contains('colorpicker-color-decoration');
            const decoratorActivatedOn = this._editor.getOption(148 /* EditorOption.colorDecoratorsActivatedOn */);
            const enabled = this._hoverSettings.enabled;
            const activatedByDecoratorClick = this._hoverState.activatedByDecoratorClick;
            if ((mouseOnDecorator && ((decoratorActivatedOn === 'click' && !activatedByDecoratorClick) ||
                (decoratorActivatedOn === 'hover' && !enabled && !_sticky) ||
                (decoratorActivatedOn === 'clickAndHover' && !enabled && !activatedByDecoratorClick))) || (!mouseOnDecorator && !enabled && !activatedByDecoratorClick)) {
                this._hideWidgets();
                return;
            }
            const contentWidget = this._getOrCreateContentWidget();
            if (contentWidget.showsOrWillShow(mouseEvent)) {
                this._glyphWidget?.hide();
                return;
            }
            if (target.type === 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */ && target.position && target.detail.glyphMarginLane) {
                this._contentWidget?.hide();
                const glyphWidget = this._getOrCreateGlyphWidget();
                glyphWidget.startShowingAt(target.position.lineNumber, target.detail.glyphMarginLane);
                return;
            }
            if (target.type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */ && target.position) {
                this._contentWidget?.hide();
                const glyphWidget = this._getOrCreateGlyphWidget();
                glyphWidget.startShowingAt(target.position.lineNumber, 'lineNo');
                return;
            }
            if (_sticky) {
                return;
            }
            this._hideWidgets();
        }
        _onKeyDown(e) {
            if (!this._editor.hasModel()) {
                return;
            }
            const resolvedKeyboardEvent = this._keybindingService.softDispatch(e, this._editor.getDomNode());
            // If the beginning of a multi-chord keybinding is pressed,
            // or the command aims to focus the hover,
            // set the variable to true, otherwise false
            const mightTriggerFocus = (resolvedKeyboardEvent.kind === 1 /* ResultKind.MoreChordsNeeded */ ||
                (resolvedKeyboardEvent.kind === 2 /* ResultKind.KbFound */
                    && resolvedKeyboardEvent.commandId === 'editor.action.showHover'
                    && this._contentWidget?.isVisible));
            if (e.keyCode === 5 /* KeyCode.Ctrl */
                || e.keyCode === 6 /* KeyCode.Alt */
                || e.keyCode === 57 /* KeyCode.Meta */
                || e.keyCode === 4 /* KeyCode.Shift */
                || mightTriggerFocus) {
                // Do not hide hover when a modifier key is pressed
                return;
            }
            this._hideWidgets();
        }
        _hideWidgets() {
            if (_sticky) {
                return;
            }
            if ((this._hoverState.mouseDown
                && this._hoverState.contentHoverFocused
                && this._contentWidget?.isColorPickerVisible)
                || inlineCompletionsHintsWidget_1.InlineSuggestionHintsContentWidget.dropDownVisible) {
                return;
            }
            this._hoverState.activatedByDecoratorClick = false;
            this._hoverState.contentHoverFocused = false;
            this._glyphWidget?.hide();
            this._contentWidget?.hide();
        }
        _getOrCreateContentWidget() {
            if (!this._contentWidget) {
                this._contentWidget = this._instantiationService.createInstance(contentHover_1.ContentHoverController, this._editor);
            }
            return this._contentWidget;
        }
        _getOrCreateGlyphWidget() {
            if (!this._glyphWidget) {
                this._glyphWidget = new marginHover_1.MarginHoverWidget(this._editor, this._languageService, this._openerService);
            }
            return this._glyphWidget;
        }
        hideContentHover() {
            this._hideWidgets();
        }
        showContentHover(range, mode, source, focus, activatedByColorDecoratorClick = false) {
            this._hoverState.activatedByDecoratorClick = activatedByColorDecoratorClick;
            this._getOrCreateContentWidget().startShowingAtRange(range, mode, source, focus);
        }
        focus() {
            this._contentWidget?.focus();
        }
        scrollUp() {
            this._contentWidget?.scrollUp();
        }
        scrollDown() {
            this._contentWidget?.scrollDown();
        }
        scrollLeft() {
            this._contentWidget?.scrollLeft();
        }
        scrollRight() {
            this._contentWidget?.scrollRight();
        }
        pageUp() {
            this._contentWidget?.pageUp();
        }
        pageDown() {
            this._contentWidget?.pageDown();
        }
        goToTop() {
            this._contentWidget?.goToTop();
        }
        goToBottom() {
            this._contentWidget?.goToBottom();
        }
        getWidgetContent() {
            return this._contentWidget?.getWidgetContent();
        }
        get isColorPickerVisible() {
            return this._contentWidget?.isColorPickerVisible;
        }
        get isHoverVisible() {
            return this._contentWidget?.isVisible;
        }
        dispose() {
            super.dispose();
            this._unhookListeners();
            this._listenersStore.dispose();
            this._glyphWidget?.dispose();
            this._contentWidget?.dispose();
        }
    };
    exports.HoverController = HoverController;
    exports.HoverController = HoverController = HoverController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, opener_1.IOpenerService),
        __param(3, language_1.ILanguageService),
        __param(4, keybinding_1.IKeybindingService)
    ], HoverController);
    var HoverFocusBehavior;
    (function (HoverFocusBehavior) {
        HoverFocusBehavior["NoAutoFocus"] = "noAutoFocus";
        HoverFocusBehavior["FocusIfVisible"] = "focusIfVisible";
        HoverFocusBehavior["AutoFocusImmediately"] = "autoFocusImmediately";
    })(HoverFocusBehavior || (HoverFocusBehavior = {}));
    class ShowOrFocusHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.showHover',
                label: nls.localize({
                    key: 'showOrFocusHover',
                    comment: [
                        'Label for action that will trigger the showing/focusing of a hover in the editor.',
                        'If the hover is not visible, it will show the hover.',
                        'This allows for users to show the hover without using the mouse.'
                    ]
                }, "Show or Focus Hover"),
                metadata: {
                    description: `Show or Focus Hover`,
                    args: [{
                            name: 'args',
                            schema: {
                                type: 'object',
                                properties: {
                                    'focus': {
                                        description: 'Controls if and when the hover should take focus upon being triggered by this action.',
                                        enum: [HoverFocusBehavior.NoAutoFocus, HoverFocusBehavior.FocusIfVisible, HoverFocusBehavior.AutoFocusImmediately],
                                        enumDescriptions: [
                                            nls.localize('showOrFocusHover.focus.noAutoFocus', 'The hover will not automatically take focus.'),
                                            nls.localize('showOrFocusHover.focus.focusIfVisible', 'The hover will take focus only if it is already visible.'),
                                            nls.localize('showOrFocusHover.focus.autoFocusImmediately', 'The hover will automatically take focus when it appears.'),
                                        ],
                                        default: HoverFocusBehavior.FocusIfVisible,
                                    }
                                },
                            }
                        }]
                },
                alias: 'Show or Focus Hover',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const controller = HoverController.get(editor);
            if (!controller) {
                return;
            }
            const focusArgument = args?.focus;
            let focusOption = HoverFocusBehavior.FocusIfVisible;
            if (Object.values(HoverFocusBehavior).includes(focusArgument)) {
                focusOption = focusArgument;
            }
            else if (typeof focusArgument === 'boolean' && focusArgument) {
                focusOption = HoverFocusBehavior.AutoFocusImmediately;
            }
            const showContentHover = (focus) => {
                const position = editor.getPosition();
                const range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
                controller.showContentHover(range, 1 /* HoverStartMode.Immediate */, 1 /* HoverStartSource.Keyboard */, focus);
            };
            const accessibilitySupportEnabled = editor.getOption(2 /* EditorOption.accessibilitySupport */) === 2 /* AccessibilitySupport.Enabled */;
            if (controller.isHoverVisible) {
                if (focusOption !== HoverFocusBehavior.NoAutoFocus) {
                    controller.focus();
                }
                else {
                    showContentHover(accessibilitySupportEnabled);
                }
            }
            else {
                showContentHover(accessibilitySupportEnabled || focusOption === HoverFocusBehavior.AutoFocusImmediately);
            }
        }
    }
    class ShowDefinitionPreviewHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.showDefinitionPreviewHover',
                label: nls.localize({
                    key: 'showDefinitionPreviewHover',
                    comment: [
                        'Label for action that will trigger the showing of definition preview hover in the editor.',
                        'This allows for users to show the definition preview hover without using the mouse.'
                    ]
                }, "Show Definition Preview Hover"),
                alias: 'Show Definition Preview Hover',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            const controller = HoverController.get(editor);
            if (!controller) {
                return;
            }
            const position = editor.getPosition();
            if (!position) {
                return;
            }
            const range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
            const goto = goToDefinitionAtPosition_1.GotoDefinitionAtPositionEditorContribution.get(editor);
            if (!goto) {
                return;
            }
            const promise = goto.startFindDefinitionFromCursor(position);
            promise.then(() => {
                controller.showContentHover(range, 1 /* HoverStartMode.Immediate */, 1 /* HoverStartSource.Keyboard */, true);
            });
        }
    }
    class ScrollUpHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.scrollUpHover',
                label: nls.localize({
                    key: 'scrollUpHover',
                    comment: [
                        'Action that allows to scroll up in the hover widget with the up arrow when the hover widget is focused.'
                    ]
                }, "Scroll Up Hover"),
                alias: 'Scroll Up Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 16 /* KeyCode.UpArrow */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.scrollUp();
        }
    }
    class ScrollDownHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.scrollDownHover',
                label: nls.localize({
                    key: 'scrollDownHover',
                    comment: [
                        'Action that allows to scroll down in the hover widget with the up arrow when the hover widget is focused.'
                    ]
                }, "Scroll Down Hover"),
                alias: 'Scroll Down Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 18 /* KeyCode.DownArrow */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.scrollDown();
        }
    }
    class ScrollLeftHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.scrollLeftHover',
                label: nls.localize({
                    key: 'scrollLeftHover',
                    comment: [
                        'Action that allows to scroll left in the hover widget with the left arrow when the hover widget is focused.'
                    ]
                }, "Scroll Left Hover"),
                alias: 'Scroll Left Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 15 /* KeyCode.LeftArrow */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.scrollLeft();
        }
    }
    class ScrollRightHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.scrollRightHover',
                label: nls.localize({
                    key: 'scrollRightHover',
                    comment: [
                        'Action that allows to scroll right in the hover widget with the right arrow when the hover widget is focused.'
                    ]
                }, "Scroll Right Hover"),
                alias: 'Scroll Right Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 17 /* KeyCode.RightArrow */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.scrollRight();
        }
    }
    class PageUpHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.pageUpHover',
                label: nls.localize({
                    key: 'pageUpHover',
                    comment: [
                        'Action that allows to page up in the hover widget with the page up command when the hover widget is focused.'
                    ]
                }, "Page Up Hover"),
                alias: 'Page Up Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 11 /* KeyCode.PageUp */,
                    secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */],
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.pageUp();
        }
    }
    class PageDownHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.pageDownHover',
                label: nls.localize({
                    key: 'pageDownHover',
                    comment: [
                        'Action that allows to page down in the hover widget with the page down command when the hover widget is focused.'
                    ]
                }, "Page Down Hover"),
                alias: 'Page Down Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 12 /* KeyCode.PageDown */,
                    secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */],
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.pageDown();
        }
    }
    class GoToTopHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.goToTopHover',
                label: nls.localize({
                    key: 'goToTopHover',
                    comment: [
                        'Action that allows to go to the top of the hover widget with the home command when the hover widget is focused.'
                    ]
                }, "Go To Top Hover"),
                alias: 'Go To Bottom Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 14 /* KeyCode.Home */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */],
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.goToTop();
        }
    }
    class GoToBottomHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.goToBottomHover',
                label: nls.localize({
                    key: 'goToBottomHover',
                    comment: [
                        'Action that allows to go to the bottom in the hover widget with the end command when the hover widget is focused.'
                    ]
                }, "Go To Bottom Hover"),
                alias: 'Go To Bottom Hover',
                precondition: editorContextKeys_1.EditorContextKeys.hoverFocused,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.hoverFocused,
                    primary: 13 /* KeyCode.End */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */],
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = HoverController.get(editor);
            if (!controller) {
                return;
            }
            controller.goToBottom();
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(HoverController.ID, HoverController, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    (0, editorExtensions_1.registerEditorAction)(ShowOrFocusHoverAction);
    (0, editorExtensions_1.registerEditorAction)(ShowDefinitionPreviewHoverAction);
    (0, editorExtensions_1.registerEditorAction)(ScrollUpHoverAction);
    (0, editorExtensions_1.registerEditorAction)(ScrollDownHoverAction);
    (0, editorExtensions_1.registerEditorAction)(ScrollLeftHoverAction);
    (0, editorExtensions_1.registerEditorAction)(ScrollRightHoverAction);
    (0, editorExtensions_1.registerEditorAction)(PageUpHoverAction);
    (0, editorExtensions_1.registerEditorAction)(PageDownHoverAction);
    (0, editorExtensions_1.registerEditorAction)(GoToTopHoverAction);
    (0, editorExtensions_1.registerEditorAction)(GoToBottomHoverAction);
    hoverTypes_1.HoverParticipantRegistry.register(markdownHoverParticipant_1.MarkdownHoverParticipant);
    hoverTypes_1.HoverParticipantRegistry.register(markerHoverParticipant_1.MarkerHoverParticipant);
    // theming
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const hoverBorder = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (hoverBorder) {
            collector.addRule(`.monaco-editor .monaco-hover .hover-row:not(:first-child):not(:empty) { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-editor .monaco-hover hr { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-editor .monaco-hover hr { border-bottom: 0px solid ${hoverBorder.transparent(0.5)}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2hvdmVyL2Jyb3dzZXIvaG92ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdDaEcsb0VBQW9FO0lBQ3BFLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FFbkI7SUFlSyxJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLHNCQUFVOztpQkFFdkIsT0FBRSxHQUFHLHNCQUFzQixBQUF6QixDQUEwQjtRQWlCbkQsWUFDa0IsT0FBb0IsRUFDZCxxQkFBNkQsRUFDcEUsY0FBK0MsRUFDN0MsZ0JBQW1ELEVBQ2pELGtCQUF1RDtZQUUzRSxLQUFLLEVBQUUsQ0FBQztZQU5TLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDRywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ25ELG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUM1QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ2hDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFwQjNELG9CQUFlLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFTakQsZ0JBQVcsR0FBZ0I7Z0JBQ2xDLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixtQkFBbUIsRUFBRSxLQUFLO2dCQUMxQix5QkFBeUIsRUFBRSxLQUFLO2FBQ2hDLENBQUM7WUFVRCxJQUFJLENBQUMsNkJBQTZCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FDbEQsSUFBSSx3QkFBZ0IsQ0FDbkIsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQzNELENBQ0QsQ0FBQztZQUNGLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0QixJQUFJ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