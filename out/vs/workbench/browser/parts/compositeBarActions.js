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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/commands/common/commands", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/workbench/services/activity/common/activity", "vs/platform/instantiation/common/instantiation", "vs/base/browser/dnd", "vs/platform/keybinding/common/keybinding", "vs/base/common/event", "vs/workbench/browser/dnd", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/common/codicons", "vs/base/common/themables", "vs/platform/hover/browser/hover", "vs/base/common/async", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/colorRegistry"], function (require, exports, nls_1, actions_1, dom_1, commands_1, lifecycle_1, contextView_1, themeService_1, activity_1, instantiation_1, dnd_1, keybinding_1, event_1, dnd_2, actionViewItems_1, codicons_1, themables_1, hover_1, async_1, configuration_1, colorRegistry_1) {
    "use strict";
    var CompositeBarActionViewItem_1, CompositeActionViewItem_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleCompositeBadgeAction = exports.ToggleCompositePinnedAction = exports.CompositeActionViewItem = exports.CompositeOverflowActivityActionViewItem = exports.CompositeOverflowActivityAction = exports.CompositeBarActionViewItem = exports.CompositeBarAction = void 0;
    class CompositeBarAction extends actions_1.Action {
        constructor(item) {
            super(item.id, item.name, item.classNames?.join(' '), true);
            this.item = item;
            this._onDidChangeCompositeBarActionItem = this._register(new event_1.Emitter());
            this.onDidChangeCompositeBarActionItem = this._onDidChangeCompositeBarActionItem.event;
            this._onDidChangeActivity = this._register(new event_1.Emitter());
            this.onDidChangeActivity = this._onDidChangeActivity.event;
        }
        get compositeBarActionItem() {
            return this.item;
        }
        set compositeBarActionItem(item) {
            this._label = item.name;
            this.item = item;
            this._onDidChangeCompositeBarActionItem.fire(this);
        }
        get activity() {
            return this._activity;
        }
        set activity(activity) {
            this._activity = activity;
            this._onDidChangeActivity.fire(activity);
        }
        activate() {
            if (!this.checked) {
                this._setChecked(true);
            }
        }
        deactivate() {
            if (this.checked) {
                this._setChecked(false);
            }
        }
    }
    exports.CompositeBarAction = CompositeBarAction;
    let CompositeBarActionViewItem = class CompositeBarActionViewItem extends actionViewItems_1.BaseActionViewItem {
        static { CompositeBarActionViewItem_1 = this; }
        static { this.hoverLeaveTime = 0; }
        constructor(action, options, badgesEnabled, themeService, hoverService, configurationService, keybindingService) {
            super(null, action, options);
            this.badgesEnabled = badgesEnabled;
            this.themeService = themeService;
            this.hoverService = hoverService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.badgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.hoverDisposables = this._register(new lifecycle_1.DisposableStore());
            this.showHoverScheduler = new async_1.RunOnceScheduler(() => this.showHover(), 0);
            this.options = options;
            this._register(this.themeService.onDidColorThemeChange(this.onThemeChange, this));
            this._register(action.onDidChangeCompositeBarActionItem(() => this.update()));
            this._register(event_1.Event.filter(keybindingService.onDidUpdateKeybindings, () => this.keybindingLabel !== this.computeKeybindingLabel())(() => this.updateTitle()));
            this._register(action.onDidChangeActivity(() => this.updateActivity()));
            this._register((0, lifecycle_1.toDisposable)(() => this.showHoverScheduler.cancel()));
        }
        get compositeBarActionItem() {
            return this._action.compositeBarActionItem;
        }
        updateStyles() {
            const theme = this.themeService.getColorTheme();
            const colors = this.options.colors(theme);
            if (this.label) {
                if (this.options.icon) {
                    const foreground = this._action.checked ? colors.activeForegroundColor : colors.inactiveForegroundColor;
                    if (this.compositeBarActionItem.iconUrl) {
                        // Apply background color to activity bar item provided with iconUrls
                        this.label.style.backgroundColor = foreground ? foreground.toString() : '';
                        this.label.style.color = '';
                    }
                    else {
                        // Apply foreground color to activity bar items provided with codicons
                        this.label.style.color = foreground ? foreground.toString() : '';
                        this.label.style.backgroundColor = '';
                    }
                }
                else {
                    const foreground = this._action.checked ? colors.activeForegroundColor : colors.inactiveForegroundColor;
                    const borderBottomColor = this._action.checked ? colors.activeBorderBottomColor : null;
                    this.label.style.color = foreground ? foreground.toString() : '';
                    this.label.style.borderBottomColor = borderBottomColor ? borderBottomColor.toString() : '';
                }
                this.container.style.setProperty('--insert-border-color', colors.dragAndDropBorder ? colors.dragAndDropBorder.toString() : '');
            }
            // Badge
            if (this.badgeContent) {
                const badgeFg = colors.badgeForeground ?? theme.getColor(colorRegistry_1.badgeForeground);
                const badgeBg = colors.badgeBackground ?? theme.getColor(colorRegistry_1.badgeBackground);
                const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
                this.badgeContent.style.color = badgeFg ? badgeFg.toString() : '';
                this.badgeContent.style.backgroundColor = badgeBg ? badgeBg.toString() : '';
                this.badgeContent.style.borderStyle = contrastBorderColor && !this.options.compact ? 'solid' : '';
                this.badgeContent.style.borderWidth = contrastBorderColor ? '1px' : '';
                this.badgeContent.style.borderColor = contrastBorderColor ? contrastBorderColor.toString() : '';
            }
        }
        render(container) {
            super.render(container);
            this.container = container;
            if (this.options.icon) {
                this.container.classList.add('icon');
            }
            if (this.options.hasPopup) {
                this.container.setAttribute('role', 'button');
                this.container.setAttribute('aria-haspopup', 'true');
            }
            else {
                this.container.setAttribute('role', 'tab');
            }
            // Try hard to prevent keyboard only focus feedback when using mouse
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_DOWN, () => {
                this.container.classList.add('clicked');
            }));
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_UP, () => {
                if (this.mouseUpTimeout) {
                    clearTimeout(this.mouseUpTimeout);
                }
                this.mouseUpTimeout = setTimeout(() => {
                    this.container.classList.remove('clicked');
                }, 800); // delayed to prevent focus feedback from showing on mouse up
            }));
            // Label
            this.label = (0, dom_1.append)(container, (0, dom_1.$)('a'));
            // Badge
            this.badge = (0, dom_1.append)(container, (0, dom_1.$)('.badge'));
            this.badgeContent = (0, dom_1.append)(this.badge, (0, dom_1.$)('.badge-content'));
            // pane composite bar active border + background
            (0, dom_1.append)(container, (0, dom_1.$)('.active-item-indicator'));
            (0, dom_1.hide)(this.badge);
            this.update();
            this.updateStyles();
            this.updateHover();
        }
        onThemeChange(theme) {
            this.updateStyles();
        }
        update() {
            this.updateLabel();
            this.updateActivity();
            this.updateTitle();
            this.updateStyles();
        }
        updateActivity() {
            const action = this.action;
            if (!this.badge || !this.badgeContent || !(action instanceof CompositeBarAction)) {
                return;
            }
            const activity = action.activity;
            this.badgeDisposable.clear();
            (0, dom_1.clearNode)(this.badgeContent);
            (0, dom_1.hide)(this.badge);
            const shouldRenderBadges = this.badgesEnabled(this.compositeBarActionItem.id);
            if (activity && shouldRenderBadges) {
                const { badge } = activity;
                const classes = [];
                if (this.options.compact) {
                    classes.push('compact');
                }
                // Progress
                if (badge instanceof activity_1.ProgressBadge) {
                    (0, dom_1.show)(this.badge);
                    classes.push('progress-badge');
                }
                // Number
                else if (badge instanceof activity_1.NumberBadge) {
                    if (badge.number) {
                        let number = badge.number.toString();
                        if (this.options.compact) {
                            if (badge.number > 99) {
                                number = '';
                            }
                        }
                        else if (badge.number > 999) {
                            const noOfThousands = badge.number / 1000;
                            const floor = Math.floor(noOfThousands);
                            if (noOfThousands > floor) {
                                number = `${floor}K+`;
                            }
                            else {
                                number = `${noOfThousands}K`;
                            }
                        }
                        this.badgeContent.textContent = number;
                        (0, dom_1.show)(this.badge);
                    }
                }
                if (classes.length) {
                    this.badge.classList.add(...classes);
                    this.badgeDisposable.value = (0, lifecycle_1.toDisposable)(() => this.badge.classList.remove(...classes));
                }
            }
            this.updateTitle();
        }
        updateLabel() {
            this.label.className = 'action-label';
            if (this.compositeBarActionItem.classNames) {
                this.label.classList.add(...this.compositeBarActionItem.classNames);
            }
            if (!this.options.icon) {
                this.label.textContent = this.action.label;
            }
        }
        updateTitle() {
            const title = this.computeTitle();
            [this.label, this.badge, this.container].forEach(element => {
                if (element) {
                    element.setAttribute('aria-label', title);
                    element.setAttribute('title', '');
                    element.removeAttribute('title');
                }
            });
        }
        computeTitle() {
            this.keybindingLabel = this.computeKeybindingLabel();
            let title = this.keybindingLabel ? (0, nls_1.localize)('titleKeybinding', "{0} ({1})", this.compositeBarActionItem.name, this.keybindingLabel) : this.compositeBarActionItem.name;
            const badge = this.action.activity?.badge;
            if (badge?.getDescription()) {
                title = (0, nls_1.localize)('badgeTitle', "{0} - {1}", title, badge.getDescription());
            }
            return title;
        }
        computeKeybindingLabel() {
            const keybinding = this.compositeBarActionItem.keybindingId ? this.keybindingService.lookupKeybinding(this.compositeBarActionItem.keybindingId) : null;
            return keybinding?.getLabel();
        }
        updateHover() {
            this.hoverDisposables.clear();
            this.updateTitle();
            this.hoverDisposables.add((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_OVER, () => {
                if (!this.showHoverScheduler.isScheduled()) {
                    if (Date.now() - CompositeBarActionViewItem_1.hoverLeaveTime < 200) {
                        this.showHover(true);
                    }
                    else {
                        this.showHoverScheduler.schedule(this.configurationService.getValue('workbench.hover.delay'));
                    }
                }
            }, true));
            this.hoverDisposables.add((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_LEAVE, e => {
                if (e.target === this.container) {
                    CompositeBarActionViewItem_1.hoverLeaveTime = Date.now();
                    this.hoverService.hideHover();
                    this.showHoverScheduler.cancel();
                }
            }, true));
            this.hoverDisposables.add((0, lifecycle_1.toDisposable)(() => {
                this.hoverService.hideHover();
                this.showHoverScheduler.cancel();
            }));
        }
        showHover(skipFadeInAnimation = false) {
            if (this.lastHover && !this.lastHover.isDisposed) {
                return;
            }
            const hoverPosition = this.options.hoverOptions.position();
            this.lastHover = this.hoverService.showHover({
                target: this.container,
                content: this.computeTitle(),
                position: {
                    hoverPosition,
                },
                persistence: {
                    hideOnKeyDown: true,
                },
                appearance: {
                    showPointer: true,
                    compact: true,
                    skipFadeInAnimation,
                }
            });
        }
        dispose() {
            super.dispose();
            if (this.mouseUpTimeout) {
                clearTimeout(this.mouseUpTimeout);
            }
            this.badge.remove();
        }
    };
    exports.CompositeBarActionViewItem = CompositeBarActionViewItem;
    exports.CompositeBarActionViewItem = CompositeBarActionViewItem = CompositeBarActionViewItem_1 = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, hover_1.IHoverService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, keybinding_1.IKeybindingService)
    ], CompositeBarActionViewItem);
    class CompositeOverflowActivityAction extends CompositeBarAction {
        constructor(showMenu) {
            super({
                id: 'additionalComposites.action',
                name: (0, nls_1.localize)('additionalViews', "Additional Views"),
                classNames: themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.more)
            });
            this.showMenu = showMenu;
        }
        async run() {
            this.showMenu();
        }
    }
    exports.CompositeOverflowActivityAction = CompositeOverflowActivityAction;
    let CompositeOverflowActivityActionViewItem = class CompositeOverflowActivityActionViewItem extends CompositeBarActionViewItem {
        constructor(action, getOverflowingComposites, getActiveCompositeId, getBadge, getCompositeOpenAction, colors, hoverOptions, contextMenuService, themeService, hoverService, configurationService, keybindingService) {
            super(action, { icon: true, colors, hasPopup: true, hoverOptions }, () => true, themeService, hoverService, configurationService, keybindingService);
            this.getOverflowingComposites = getOverflowingComposites;
            this.getActiveCompositeId = getActiveCompositeId;
            this.getBadge = getBadge;
            this.getCompositeOpenAction = getCompositeOpenAction;
            this.contextMenuService = contextMenuService;
        }
        showMenu() {
            this.contextMenuService.showContextMenu({
                getAnchor: () => this.container,
                getActions: () => this.getActions(),
                getCheckedActionsRepresentation: () => 'radio',
            });
        }
        getActions() {
            return this.getOverflowingComposites().map(composite => {
                const action = this.getCompositeOpenAction(composite.id);
                action.checked = this.getActiveCompositeId() === action.id;
                const badge = this.getBadge(composite.id);
                let suffix;
                if (badge instanceof activity_1.NumberBadge) {
                    suffix = badge.number;
                }
                if (suffix) {
                    action.label = (0, nls_1.localize)('numberBadge', "{0} ({1})", composite.name, suffix);
                }
                else {
                    action.label = composite.name || '';
                }
                return action;
            });
        }
    };
    exports.CompositeOverflowActivityActionViewItem = CompositeOverflowActivityActionViewItem;
    exports.CompositeOverflowActivityActionViewItem = CompositeOverflowActivityActionViewItem = __decorate([
        __param(7, contextView_1.IContextMenuService),
        __param(8, themeService_1.IThemeService),
        __param(9, hover_1.IHoverService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, keybinding_1.IKeybindingService)
    ], CompositeOverflowActivityActionViewItem);
    let ManageExtensionAction = class ManageExtensionAction extends actions_1.Action {
        constructor(commandService) {
            super('activitybar.manage.extension', (0, nls_1.localize)('manageExtension', "Manage Extension"));
            this.commandService = commandService;
        }
        run(id) {
            return this.commandService.executeCommand('_extensions.manage', id);
        }
    };
    ManageExtensionAction = __decorate([
        __param(0, commands_1.ICommandService)
    ], ManageExtensionAction);
    let CompositeActionViewItem = class CompositeActionViewItem extends CompositeBarActionViewItem {
        static { CompositeActionViewItem_1 = this; }
        constructor(options, compositeActivityAction, toggleCompositePinnedAction, toggleCompositeBadgeAction, compositeContextMenuActionsProvider, contextMenuActionsProvider, dndHandler, compositeBar, contextMenuService, keybindingService, instantiationService, themeService, hoverService, configurationService) {
            super(compositeActivityAction, options, compositeBar.areBadgesEnabled.bind(compositeBar), themeService, hoverService, configurationService, keybindingService);
            this.compositeActivityAction = compositeActivityAction;
            this.toggleCompositePinnedAction = toggleCompositePinnedAction;
            this.toggleCompositeBadgeAction = toggleCompositeBadgeAction;
            this.compositeContextMenuActionsProvider = compositeContextMenuActionsProvider;
            this.contextMenuActionsProvider = contextMenuActionsProvider;
            this.dndHandler = dndHandler;
            this.compositeBar = compositeBar;
            this.contextMenuService = contextMenuService;
            if (!CompositeActionViewItem_1.manageExtensionAction) {
                CompositeActionViewItem_1.manageExtensionAction = instantiationService.createInstance(ManageExtensionAction);
            }
        }
        render(container) {
            super.render(container);
            this.updateChecked();
            this.updateEnabled();
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.CONTEXT_MENU, e => {
                dom_1.EventHelper.stop(e, true);
                this.showContextMenu(container);
            }));
            // Allow to drag
            let insertDropBefore = undefined;
            this._register(dnd_2.CompositeDragAndDropObserver.INSTANCE.registerDraggable(this.container, () => { return { type: 'composite', id: this.compositeBarActionItem.id }; }, {
                onDragOver: e => {
                    const isValidMove = e.dragAndDropData.getData().id !== this.compositeBarActionItem.id && this.dndHandler.onDragOver(e.dragAndDropData, this.compositeBarActionItem.id, e.eventData);
                    (0, dnd_2.toggleDropEffect)(e.eventData.dataTransfer, 'move', isValidMove);
                    insertDropBefore = this.updateFromDragging(container, isValidMove, e.eventData);
                },
                onDragLeave: e => {
                    insertDropBefore = this.updateFromDragging(container, false, e.eventData);
                },
                onDragEnd: e => {
                    insertDropBefore = this.updateFromDragging(container, false, e.eventData);
                },
                onDrop: e => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.dndHandler.drop(e.dragAndDropData, this.compositeBarActionItem.id, e.eventData, insertDropBefore);
                    insertDropBefore = this.updateFromDragging(container, false, e.eventData);
                },
                onDragStart: e => {
                    if (e.dragAndDropData.getData().id !== this.compositeBarActionItem.id) {
                        return;
                    }
                    if (e.eventData.dataTransfer) {
                        e.eventData.dataTransfer.effectAllowed = 'move';
                    }
                    this.blur(); // Remove focus indicator when dragging
                }
            }));
            // Activate on drag over to reveal targets
            [this.badge, this.label].forEach(element => this._register(new dnd_1.DelayedDragHandler(element, () => {
                if (!this.action.checked) {
                    this.action.run();
                }
            })));
            this.updateStyles();
        }
        updateFromDragging(element, showFeedback, event) {
            const rect = element.getBoundingClientRect();
            const posX = event.clientX;
            const posY = event.clientY;
            const height = rect.bottom - rect.top;
            const width = rect.right - rect.left;
            const forceTop = posY <= rect.top + height * 0.4;
            const forceBottom = posY > rect.bottom - height * 0.4;
            const preferTop = posY <= rect.top + height * 0.5;
            const forceLeft = posX <= rect.left + width * 0.4;
            const forceRight = posX > rect.right - width * 0.4;
            const preferLeft = posX <= rect.left + width * 0.5;
            const classes = element.classList;
            const lastClasses = {
                vertical: classes.contains('top') ? 'top' : (classes.contains('bottom') ? 'bottom' : undefined),
                horizontal: classes.contains('left') ? 'left' : (classes.contains('right') ? 'right' : undefined)
            };
            const top = forceTop || (preferTop && !lastClasses.vertical) || (!forceBottom && lastClasses.vertical === 'top');
            const bottom = forceBottom || (!preferTop && !lastClasses.vertical) || (!forceTop && lastClasses.vertical === 'bottom');
            const left = forceLeft || (preferLeft && !lastClasses.horizontal) || (!forceRight && lastClasses.horizontal === 'left');
            const right = forceRight || (!preferLeft && !lastClasses.horizontal) || (!forceLeft && lastClasses.horizontal === 'right');
            element.classList.toggle('top', showFeedback && top);
            element.classList.toggle('bottom', showFeedback && bottom);
            element.classList.toggle('left', showFeedback && left);
            element.classList.toggle('right', showFeedback && right);
            if (!showFeedback) {
                return undefined;
            }
            return { verticallyBefore: top, horizontallyBefore: left };
        }
        showContextMenu(container) {
            const actions = [this.toggleCompositePinnedAction, this.toggleCompositeBadgeAction];
            const compositeContextMenuActions = this.compositeContextMenuActionsProvider(this.compositeBarActionItem.id);
            if (compositeContextMenuActions.length) {
                actions.push(...compositeContextMenuActions);
            }
            if (this.compositeActivityAction.compositeBarActionItem.extensionId) {
                actions.push(new actions_1.Separator());
                actions.push(CompositeActionViewItem_1.manageExtensionAction);
            }
            const isPinned = this.compositeBar.isPinned(this.compositeBarActionItem.id);
            if (isPinned) {
                this.toggleCompositePinnedAction.label = (0, nls_1.localize)('hide', "Hide '{0}'", this.compositeBarActionItem.name);
                this.toggleCompositePinnedAction.checked = false;
            }
            else {
                this.toggleCompositePinnedAction.label = (0, nls_1.localize)('keep', "Keep '{0}'", this.compositeBarActionItem.name);
            }
            const isBadgeEnabled = this.compositeBar.areBadgesEnabled(this.compositeBarActionItem.id);
            if (isBadgeEnabled) {
                this.toggleCompositeBadgeAction.label = (0, nls_1.localize)('hideBadge', "Hide Badge");
            }
            else {
                this.toggleCompositeBadgeAction.label = (0, nls_1.localize)('showBadge', "Show Badge");
            }
            const otherActions = this.contextMenuActionsProvider();
            if (otherActions.length) {
                actions.push(new actions_1.Separator());
                actions.push(...otherActions);
            }
            const elementPosition = (0, dom_1.getDomNodePagePosition)(container);
            const anchor = {
                x: Math.floor(elementPosition.left + (elementPosition.width / 2)),
                y: elementPosition.top + elementPosition.height
            };
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                getActionsContext: () => this.compositeBarActionItem.id
            });
        }
        updateChecked() {
            if (this.action.checked) {
                this.container.classList.add('checked');
                this.container.setAttribute('aria-label', this.getTooltip() ?? this.container.title);
                this.container.setAttribute('aria-expanded', 'true');
                this.container.setAttribute('aria-selected', 'true');
            }
            else {
                this.container.classList.remove('checked');
                this.container.setAttribute('aria-label', this.getTooltip() ?? this.container.title);
                this.container.setAttribute('aria-expanded', 'false');
                this.container.setAttribute('aria-selected', 'false');
            }
            this.updateStyles();
        }
        updateEnabled() {
            if (!this.element) {
                return;
            }
            if (this.action.enabled) {
                this.element.classList.remove('disabled');
            }
            else {
                this.element.classList.add('disabled');
            }
        }
        dispose() {
            super.dispose();
            this.label.remove();
        }
    };
    exports.CompositeActionViewItem = CompositeActionViewItem;
    exports.CompositeActionViewItem = CompositeActionViewItem = CompositeActionViewItem_1 = __decorate([
        __param(8, contextView_1.IContextMenuService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, themeService_1.IThemeService),
        __param(12, hover_1.IHoverService),
        __param(13, configuration_1.IConfigurationService)
    ], CompositeActionViewItem);
    class ToggleCompositePinnedAction extends actions_1.Action {
        constructor(activity, compositeBar) {
            super('show.toggleCompositePinned', activity ? activity.name : (0, nls_1.localize)('toggle', "Toggle View Pinned"));
            this.activity = activity;
            this.compositeBar = compositeBar;
            this.checked = !!this.activity && this.compositeBar.isPinned(this.activity.id);
        }
        async run(context) {
            const id = this.activity ? this.activity.id : context;
            if (this.compositeBar.isPinned(id)) {
                this.compositeBar.unpin(id);
            }
            else {
                this.compositeBar.pin(id);
            }
        }
    }
    exports.ToggleCompositePinnedAction = ToggleCompositePinnedAction;
    class ToggleCompositeBadgeAction extends actions_1.Action {
        constructor(compositeBarActionItem, compositeBar) {
            super('show.toggleCompositeBadge', compositeBarActionItem ? compositeBarActionItem.name : (0, nls_1.localize)('toggleBadge', "Toggle View Badge"));
            this.compositeBarActionItem = compositeBarActionItem;
            this.compositeBar = compositeBar;
            this.checked = false;
        }
        async run(context) {
            const id = this.compositeBarActionItem ? this.compositeBarActionItem.id : context;
            this.compositeBar.toggleBadgeEnablement(id);
        }
    }
    exports.ToggleCompositeBadgeAction = ToggleCompositeBadgeAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9zaXRlQmFyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvY29tcG9zaXRlQmFyQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0VoRyxNQUFhLGtCQUFtQixTQUFRLGdCQUFNO1FBVTdDLFlBQW9CLElBQTZCO1lBQ2hELEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFEekMsU0FBSSxHQUFKLElBQUksQ0FBeUI7WUFSaEMsdUNBQWtDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBc0IsQ0FBQyxDQUFDO1lBQy9GLHNDQUFpQyxHQUFHLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxLQUFLLENBQUM7WUFFMUUseUJBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBeUIsQ0FBQyxDQUFDO1lBQ3BGLHdCQUFtQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7UUFNL0QsQ0FBQztRQUVELElBQUksc0JBQXNCO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixDQUFDO1FBRUQsSUFBSSxzQkFBc0IsQ0FBQyxJQUE2QjtZQUN2RCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDeEIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDakIsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRUQs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