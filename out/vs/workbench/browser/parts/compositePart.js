/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/idGenerator", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/errors", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/progressbar/progressbar", "vs/workbench/browser/part", "vs/platform/instantiation/common/serviceCollection", "vs/platform/progress/common/progress", "vs/base/browser/dom", "vs/base/common/types", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/workbench/services/progress/browser/progressIndicator", "vs/platform/actions/browser/toolbar", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/css!./media/compositepart"], function (require, exports, nls_1, idGenerator_1, lifecycle_1, event_1, errors_1, actionbar_1, progressbar_1, part_1, serviceCollection_1, progress_1, dom_1, types_1, menuEntryActionViewItem_1, progressIndicator_1, toolbar_1, defaultStyles_1, hoverDelegateFactory_1, updatableHoverWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompositePart = void 0;
    class CompositePart extends part_1.Part {
        constructor(notificationService, storageService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, registry, activeCompositeSettingsKey, defaultCompositeId, nameForTelemetry, compositeCSSClass, titleForegroundColor, id, options) {
            super(id, options, themeService, storageService, layoutService);
            this.notificationService = notificationService;
            this.storageService = storageService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.instantiationService = instantiationService;
            this.registry = registry;
            this.activeCompositeSettingsKey = activeCompositeSettingsKey;
            this.defaultCompositeId = defaultCompositeId;
            this.nameForTelemetry = nameForTelemetry;
            this.compositeCSSClass = compositeCSSClass;
            this.titleForegroundColor = titleForegroundColor;
            this.onDidCompositeOpen = this._register(new event_1.Emitter());
            this.onDidCompositeClose = this._register(new event_1.Emitter());
            this.mapCompositeToCompositeContainer = new Map();
            this.mapActionsBindingToComposite = new Map();
            this.instantiatedCompositeItems = new Map();
            this.actionsListener = this._register(new lifecycle_1.MutableDisposable());
            this.lastActiveCompositeId = storageService.get(activeCompositeSettingsKey, 1 /* StorageScope.WORKSPACE */, this.defaultCompositeId);
            this.toolbarHoverDelegate = this._register((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
        }
        openComposite(id, focus) {
            // Check if composite already visible and just focus in that case
            if (this.activeComposite?.getId() === id) {
                if (focus) {
                    this.activeComposite.focus();
                }
                // Fullfill promise with composite that is being opened
                return this.activeComposite;
            }
            // We cannot open the composite if we have not been created yet
            if (!this.element) {
                return;
            }
            // Open
            return this.doOpenComposite(id, focus);
        }
        doOpenComposite(id, focus = false) {
            // Use a generated token to avoid race conditions from long running promises
            const currentCompositeOpenToken = idGenerator_1.defaultGenerator.nextId();
            this.currentCompositeOpenToken = currentCompositeOpenToken;
            // Hide current
            if (this.activeComposite) {
                this.hideActiveComposite();
            }
            // Update Title
            this.updateTitle(id);
            // Create composite
            const composite = this.createComposite(id, true);
            // Check if another composite opened meanwhile and return in that case
            if ((this.currentCompositeOpenToken !== currentCompositeOpenToken) || (this.activeComposite && this.activeComposite.getId() !== composite.getId())) {
                return undefined;
            }
            // Check if composite already visible and just focus in that case
            if (this.activeComposite?.getId() === composite.getId()) {
                if (focus) {
                    composite.focus();
                }
                this.onDidCompositeOpen.fire({ composite, focus });
                return composite;
            }
            // Show Composite and Focus
            this.showComposite(composite);
            if (focus) {
                composite.focus();
            }
            // Return with the composite that is being opened
            if (composite) {
                this.onDidCompositeOpen.fire({ composite, focus });
            }
            return composite;
        }
        createComposite(id, isActive) {
            // Check if composite is already created
            const compositeItem = this.instantiatedCompositeItems.get(id);
            if (compositeItem) {
                return compositeItem.composite;
            }
            // Instantiate composite from registry otherwise
            const compositeDescriptor = this.registry.getComposite(id);
            if (compositeDescriptor) {
                const that = this;
                const compositeProgressIndicator = new progressIndicator_1.ScopedProgressIndicator((0, types_1.assertIsDefined)(this.progressBar), new class extends progressIndicator_1.AbstractProgressScope {
                    constructor() {
                        super(compositeDescriptor.id, !!isActive);
                        this._register(that.onDidCompositeOpen.event(e => this.onScopeOpened(e.composite.getId())));
                        this._register(that.onDidCompositeClose.event(e => this.onScopeClosed(e.getId())));
                    }
                }());
                const compositeInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([progress_1.IEditorProgressService, compositeProgressIndicator] // provide the editor progress service for any editors instantiated within the composite
                ));
                const composite = compositeDescriptor.instantiate(compositeInstantiationService);
                const disposable = new lifecycle_1.DisposableStore();
                // Remember as Instantiated
                this.instantiatedCompositeItems.set(id, { composite, disposable, progress: compositeProgressIndicator });
                // Register to title area update events from the composite
                disposable.add(composite.onTitleAreaUpdate(() => this.onTitleAreaUpdate(composite.getId()), this));
                return composite;
            }
            throw new Error(`Unable to find composite with id ${id}`);
        }
        showComposite(composite) {
            // Remember Composite
            this.activeComposite = composite;
            // Store in preferences
            const id = this.activeComposite.getId();
            if (id !== this.defaultCompositeId) {
                this.storageService.store(this.activeCompositeSettingsKey, id, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(this.activeCompositeSettingsKey, 1 /* StorageScope.WORKSPACE */);
            }
            // Remember
            this.lastActiveCompositeId = this.activeComposite.getId();
            // Composites created for the first time
            let compositeContainer = this.mapCompositeToCompositeContainer.get(composite.getId());
            if (!compositeContainer) {
                // Build Container off-DOM
                compositeContainer = (0, dom_1.$)('.composite');
                compositeContainer.classList.add(...this.compositeCSSClass.split(' '));
                compositeContainer.id = composite.getId();
                composite.create(compositeContainer);
                composite.updateStyles();
                // Remember composite container
                this.mapCompositeToCompositeContainer.set(composite.getId(), compositeContainer);
            }
            // Fill Content and Actions
            // Make sure that the user meanwhile did not open another composite or closed the part containing the composite
            if (!this.activeComposite || composite.getId() !== this.activeComposite.getId()) {
                return undefined;
            }
            // Take Composite on-DOM and show
            const contentArea = this.getContentArea();
            contentArea?.appendChild(compositeContainer);
            (0, dom_1.show)(compositeContainer);
            // Setup action runner
            const toolBar = (0, types_1.assertIsDefined)(this.toolBar);
            toolBar.actionRunner = composite.getActionRunner();
            // Update title with composite title if it differs from descriptor
            const descriptor = this.registry.getComposite(composite.getId());
            if (descriptor && descriptor.name !== composite.getTitle()) {
                this.updateTitle(composite.getId(), composite.getTitle());
            }
            // Handle Composite Actions
            let actionsBinding = this.mapActionsBindingToComposite.get(composite.getId());
            if (!actionsBinding) {
                actionsBinding = this.collectCompositeActions(composite);
                this.mapActionsBindingToComposite.set(composite.getId(), actionsBinding);
            }
            actionsBinding();
            // Action Run Handling
            this.actionsListener.value = toolBar.actionRunner.onDidRun(e => {
                // Check for Error
                if (e.error && !(0, errors_1.isCancellationError)(e.error)) {
                    this.notificationService.error(e.error);
                }
            });
            // Indicate to composite that it is now visible
            composite.setVisible(true);
            // Make sure that the user meanwhile did not open another composite or closed the part containing the composite
            if (!this.activeComposite || composite.getId() !== this.activeComposite.getId()) {
                return;
            }
            // Make sure the composite is layed out
            if (this.contentAreaSize) {
                composite.layout(this.contentAreaSize);
            }
            // Make sure boundary sashes are propagated
            if (this.boundarySashes) {
                composite.setBoundarySashes(this.boundarySashes);
            }
        }
        onTitleAreaUpdate(compositeId) {
            // Title
            const composite = this.instantiatedCompositeItems.get(compositeId);
            if (composite) {
                this.updateTitle(compositeId, composite.composite.getTitle());
            }
            // Active Composite
            if (this.activeComposite?.getId() === compositeId) {
                // Actions
                const actionsBinding = this.collectCompositeActions(this.activeComposite);
                this.mapActionsBindingToComposite.set(this.activeComposite.getId(), actionsBinding);
                actionsBinding();
            }
            // Otherwise invalidate actions binding for next time when the composite becomes visible
            else {
                this.mapActionsBindingToComposite.delete(compositeId);
            }
        }
        updateTitle(compositeId, compositeTitle) {
            const compositeDescriptor = this.registry.getComposite(compositeId);
            if (!compositeDescriptor || !this.titleLabel) {
                return;
            }
            if (!compositeTitle) {
                compositeTitle = compositeDescriptor.name;
            }
            const keybinding = this.keybindingService.lookupKeybinding(compositeId);
            this.titleLabel.updateTitle(compositeId, compositeTitle, keybinding?.getLabel() ?? undefined);
            const toolBar = (0, types_1.assertIsDefined)(this.toolBar);
            toolBar.setAriaLabel((0, nls_1.localize)('ariaCompositeToolbarLabel', "{0} actions", compositeTitle));
        }
        collectCompositeActions(composite) {
            // From Composite
            const menuIds = composite?.getMenuIds();
            const primaryActions = composite?.getActions().slice(0) || [];
            const secondaryActions = composite?.getSecondaryActions().slice(0) || [];
            // Update context
            const toolBar = (0, types_1.assertIsDefined)(this.toolBar);
            toolBar.context = this.actionsContextProvider();
            // Return fn to set into toolbar
            return () => toolBar.setActions((0, actionbar_1.prepareActions)(primaryActions), (0, actionbar_1.prepareActions)(secondaryActions), menuIds);
        }
        getActiveComposite() {
            return this.activeComposite;
        }
        getLastActiveCompositeId() {
            return this.lastActiveCompositeId;
        }
        hideActiveComposite() {
            if (!this.activeComposite) {
                return undefined; // Nothing to do
            }
            const composite = this.activeComposite;
            this.activeComposite = undefined;
            const compositeContainer = this.mapCompositeToCompositeContainer.get(composite.getId());
            // Indicate to Composite
            composite.setVisible(false);
            // Take Container Off-DOM and hide
            if (compositeContainer) {
                compositeContainer.remove();
                (0, dom_1.hide)(compositeContainer);
            }
            // Clear any running Progress
            this.progressBar?.stop().hide();
            // Empty Actions
            if (this.toolBar) {
                this.collectCompositeActions()();
            }
            this.onDidCompositeClose.fire(composite);
            return composite;
        }
        createTitleArea(parent) {
            // Title Area Container
            const titleArea = (0, dom_1.append)(parent, (0, dom_1.$)('.composite'));
            titleArea.classList.add('title');
            // Left Title Label
            this.titleLabel = this.createTitleLabel(titleArea);
            // Right Actions Container
            const titleActionsContainer = (0, dom_1.append)(titleArea, (0, dom_1.$)('.title-actions'));
            // Toolbar
            this.toolBar = this._register(this.instantiationService.createInstance(toolbar_1.WorkbenchToolBar, titleActionsContainer, {
                actionViewItemProvider: (action, options) => this.actionViewItemProvider(action, options),
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                anchorAlignmentProvider: () => this.getTitleAreaDropDownAnchorAlignment(),
                toggleMenuTitle: (0, nls_1.localize)('viewsAndMoreActions', "Views and More Actions..."),
                telemetrySource: this.nameForTelemetry,
                hoverDelegate: this.toolbarHoverDelegate
            }));
            this.collectCompositeActions()();
            return titleArea;
        }
        createTitleLabel(parent) {
            const titleContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.title-label'));
            const titleLabel = (0, dom_1.append)(titleContainer, (0, dom_1.$)('h2'));
            this.titleLabelElement = titleLabel;
            const hover = this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), titleLabel, ''));
            const $this = this;
            return {
                updateTitle: (id, title, keybinding) => {
                    // The title label is shared for all composites in the base CompositePart
                    if (!this.activeComposite || this.activeComposite.getId() === id) {
                        titleLabel.innerText = title;
                        hover.update(keybinding ? (0, nls_1.localize)('titleTooltip', "{0} ({1})", title, keybinding) : title);
                    }
                },
                updateStyles: () => {
                    titleLabel.style.color = $this.titleForegroundColor ? $this.getColor($this.titleForegroundColor) || '' : '';
                }
            };
        }
        createHeaderArea() {
            return (0, dom_1.$)('.composite');
        }
        createFooterArea() {
            return (0, dom_1.$)('.composite');
        }
        updateStyles() {
            super.updateStyles();
            // Forward to title label
            const titleLabel = (0, types_1.assertIsDefined)(this.titleLabel);
            titleLabel.updateStyles();
        }
        actionViewItemProvider(action, options) {
            // Check Active Composite
            if (this.activeComposite) {
                return this.activeComposite.getActionViewItem(action, options);
            }
            return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, options);
        }
        actionsContextProvider() {
            // Check Active Composite
            if (this.activeComposite) {
                return this.activeComposite.getActionsContext();
            }
            return null;
        }
        createContentArea(parent) {
            const contentContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.content'));
            this.progressBar = this._register(new progressbar_1.ProgressBar(contentContainer, defaultStyles_1.defaultProgressBarStyles));
            this.progressBar.hide();
            return contentContainer;
        }
        getProgressIndicator(id) {
            const compositeItem = this.instantiatedCompositeItems.get(id);
            return compositeItem ? compositeItem.progress : undefined;
        }
        getTitleAreaDropDownAnchorAlignment() {
            return 1 /* AnchorAlignment.RIGHT */;
        }
        layout(width, height, top, left) {
            super.layout(width, height, top, left);
            // Layout contents
            this.contentAreaSize = dom_1.Dimension.lift(super.layoutContents(width, height).contentSize);
            // Layout composite
            this.activeComposite?.layout(this.contentAreaSize);
        }
        setBoundarySashes(sashes) {
            this.boundarySashes = sashes;
            this.activeComposite?.setBoundarySashes(sashes);
        }
        removeComposite(compositeId) {
            if (this.activeComposite?.getId() === compositeId) {
                return false; // do not remove active composite
            }
            this.mapCompositeToCompositeContainer.delete(compositeId);
            this.mapActionsBindingToComposite.delete(compositeId);
            const compositeItem = this.instantiatedCompositeItems.get(compositeId);
            if (compositeItem) {
                compositeItem.composite.dispose();
                (0, lifecycle_1.dispose)(compositeItem.disposable);
                this.instantiatedCompositeItems.delete(compositeId);
            }
            return true;
        }
        dispose() {
            this.mapCompositeToCompositeContainer.clear();
            this.mapActionsBindingToComposite.clear();
            this.instantiatedCompositeItems.forEach(compositeItem => {
                compositeItem.composite.dispose();
                (0, lifecycle_1.dispose)(compositeItem.disposable);
            });
            this.instantiatedCompositeItems.clear();
            super.dispose();
        }
    }
    exports.CompositePart = CompositePart;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9zaXRlUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvY29tcG9zaXRlUGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1RGhHLE1BQXNCLGFBQW1DLFNBQVEsV0FBSTtRQXFCcEUsWUFDa0IsbUJBQXlDLEVBQ3ZDLGNBQStCLEVBQy9CLGtCQUF1QyxFQUMxRCxhQUFzQyxFQUNuQixpQkFBcUMsRUFDckMsb0JBQTJDLEVBQzlELFlBQTJCLEVBQ1IsUUFBOEIsRUFDaEMsMEJBQWtDLEVBQ2xDLGtCQUEwQixFQUMxQixnQkFBd0IsRUFDeEIsaUJBQXlCLEVBQ3pCLG9CQUF3QyxFQUN6RCxFQUFVLEVBQ1YsT0FBcUI7WUFFckIsS0FBSyxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQWhCL0Msd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUN2QyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDL0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUV2QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ3JDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFFM0MsYUFBUSxHQUFSLFFBQVEsQ0FBc0I7WUFDaEMsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUFRO1lBQ2xDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBUTtZQUMxQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVE7WUFDeEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFRO1lBQ3pCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBb0I7WUFoQ3ZDLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTZDLENB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