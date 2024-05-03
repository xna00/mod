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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, dom_1, actionViewItems_1, hoverDelegateFactory_1, updatableHoverWidget_1, iconLabels_1, actions_1, codicons_1, event_1, lifecycle_1, nls_1, menuEntryActionViewItem_1, toolbar_1, actions_2, instantiation_1, keybinding_1, quickInput_1, editorGroupsService_1) {
    "use strict";
    var CommandCenterCenterViewItem_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandCenterControl = void 0;
    let CommandCenterControl = class CommandCenterControl {
        constructor(windowTitle, hoverDelegate, instantiationService, quickInputService) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidChangeVisibility = new event_1.Emitter();
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this.element = document.createElement('div');
            this.element.classList.add('command-center');
            const titleToolbar = instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, this.element, actions_2.MenuId.CommandCenter, {
                contextMenu: actions_2.MenuId.TitleBarContext,
                hiddenItemStrategy: -1 /* HiddenItemStrategy.NoHide */,
                toolbarOptions: {
                    primaryGroup: () => true,
                },
                telemetrySource: 'commandCenter',
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_2.SubmenuItemAction && action.item.submenu === actions_2.MenuId.CommandCenterCenter) {
                        return instantiationService.createInstance(CommandCenterCenterViewItem, action, windowTitle, { ...options, hoverDelegate });
                    }
                    else {
                        return (0, menuEntryActionViewItem_1.createActionViewItem)(instantiationService, action, { ...options, hoverDelegate });
                    }
                }
            });
            this._disposables.add(event_1.Event.filter(quickInputService.onShow, () => (0, dom_1.isActiveDocument)(this.element), this._disposables)(this._setVisibility.bind(this, false)));
            this._disposables.add(event_1.Event.filter(quickInputService.onHide, () => (0, dom_1.isActiveDocument)(this.element), this._disposables)(this._setVisibility.bind(this, true)));
            this._disposables.add(titleToolbar);
        }
        _setVisibility(show) {
            this.element.classList.toggle('hide', !show);
            this._onDidChangeVisibility.fire();
        }
        dispose() {
            this._disposables.dispose();
        }
    };
    exports.CommandCenterControl = CommandCenterControl;
    exports.CommandCenterControl = CommandCenterControl = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, quickInput_1.IQuickInputService)
    ], CommandCenterControl);
    let CommandCenterCenterViewItem = class CommandCenterCenterViewItem extends actionViewItems_1.BaseActionViewItem {
        static { CommandCenterCenterViewItem_1 = this; }
        static { this._quickOpenCommandId = 'workbench.action.quickOpenWithModes'; }
        constructor(_submenu, _windowTitle, options, _keybindingService, _instaService, _editorGroupService) {
            super(undefined, _submenu.actions.find(action => action.id === 'workbench.action.quickOpenWithModes') ?? _submenu.actions[0], options);
            this._submenu = _submenu;
            this._windowTitle = _windowTitle;
            this._keybindingService = _keybindingService;
            this._instaService = _instaService;
            this._editorGroupService = _editorGroupService;
            this._hoverDelegate = options.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse');
        }
        render(container) {
            super.render(container);
            container.classList.add('command-center-center');
            container.classList.toggle('multiple', (this._submenu.actions.length > 1));
            const hover = this._store.add((0, updatableHoverWidget_1.setupCustomHover)(this._hoverDelegate, container, this.getTooltip()));
            // update label & tooltip when window title changes
            this._store.add(this._windowTitle.onDidChange(() => {
                hover.update(this.getTooltip());
            }));
            const groups = [];
            for (const action of this._submenu.actions) {
                if (action instanceof actions_1.SubmenuAction) {
                    groups.push(action.actions);
                }
                else {
                    groups.push([action]);
                }
            }
            for (let i = 0; i < groups.length; i++) {
                const group = groups[i];
                // nested toolbar
                const toolbar = this._instaService.createInstance(toolbar_1.WorkbenchToolBar, container, {
                    hiddenItemStrategy: -1 /* HiddenItemStrategy.NoHide */,
                    telemetrySource: 'commandCenterCenter',
                    actionViewItemProvider: (action, options) => {
                        options = {
                            ...options,
                            hoverDelegate: this._hoverDelegate,
                        };
                        if (action.id !== CommandCenterCenterViewItem_1._quickOpenCommandId) {
                            return (0, menuEntryActionViewItem_1.createActionViewItem)(this._instaService, action, options);
                        }
                        const that = this;
                        return this._instaService.createInstance(class CommandCenterQuickPickItem extends actionViewItems_1.BaseActionViewItem {
                            constructor() {
                                super(undefined, action, options);
                            }
                            render(container) {
                                super.render(container);
                                container.classList.toggle('command-center-quick-pick');
                                const action = this.action;
                                // icon (search)
                                const searchIcon = document.createElement('span');
                                searchIcon.ariaHidden = 'true';
                                searchIcon.className = action.class ?? '';
                                searchIcon.classList.add('search-icon');
                                // label: just workspace name and optional decorations
                                const label = this._getLabel();
                                const labelElement = document.createElement('span');
                                labelElement.classList.add('search-label');
                                labelElement.innerText = label;
                                (0, dom_1.reset)(container, searchIcon, labelElement);
                                const hover = this._store.add((0, updatableHoverWidget_1.setupCustomHover)(that._hoverDelegate, container, this.getTooltip()));
                                // update label & tooltip when window title changes
                                this._store.add(that._windowTitle.onDidChange(() => {
                                    hover.update(this.getTooltip());
                                    labelElement.innerText = this._getLabel();
                                }));
                                // update label & tooltip when tabs visibility changes
                                this._store.add(that._editorGroupService.onDidChangeEditorPartOptions(({ newPartOptions, oldPartOptions }) => {
                                    if (newPartOptions.showTabs !== oldPartOptions.showTabs) {
                                        hover.update(this.getTooltip());
                                        labelElement.innerText = this._getLabel();
                                    }
                                }));
                            }
                            getTooltip() {
                                return that.getTooltip();
                            }
                            _getLabel() {
                                const { prefix, suffix } = that._windowTitle.getTitleDecorations();
                                let label = that._windowTitle.workspaceName;
                                if (that._windowTitle.isCustomTitleFormat()) {
                                    label = that._windowTitle.getWindowTitle();
                                }
                                else if (that._editorGroupService.partOptions.showTabs === 'none') {
                                    label = that._windowTitle.fileName ?? label;
                                }
                                if (!label) {
                                    label = (0, nls_1.localize)('label.dfl', "Search");
                                }
                                if (prefix) {
                                    label = (0, nls_1.localize)('label1', "{0} {1}", prefix, label);
                                }
                                if (suffix) {
                                    label = (0, nls_1.localize)('label2', "{0} {1}", label, suffix);
                                }
                                return label.replaceAll(/\r\n|\r|\n/g, '\u23CE');
                            }
                        });
                    }
                });
                toolbar.setActions(group);
                this._store.add(toolbar);
                // spacer
                if (i < groups.length - 1) {
                    const icon = (0, iconLabels_1.renderIcon)(codicons_1.Codicon.circleSmallFilled);
                    icon.style.padding = '0 12px';
                    icon.style.height = '100%';
                    icon.style.opacity = '0.5';
                    container.appendChild(icon);
                }
            }
        }
        getTooltip() {
            // tooltip: full windowTitle
            const kb = this._keybindingService.lookupKeybinding(this.action.id)?.getLabel();
            const title = kb
                ? (0, nls_1.localize)('title', "Search {0} ({1}) \u2014 {2}", this._windowTitle.workspaceName, kb, this._windowTitle.value)
                : (0, nls_1.localize)('title2', "Search {0} \u2014 {1}", this._windowTitle.workspaceName, this._windowTitle.value);
            return title;
        }
    };
    CommandCenterCenterViewItem = CommandCenterCenterViewItem_1 = __decorate([
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, editorGroupsService_1.IEditorGroupsService)
    ], CommandCenterCenterViewItem);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandCenter, {
        submenu: actions_2.MenuId.CommandCenterCenter,
        title: (0, nls_1.localize)('title3', "Command Center"),
        icon: codicons_1.Codicon.shield,
        order: 101,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZENlbnRlckNvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL3RpdGxlYmFyL2NvbW1hbmRDZW50ZXJDb250cm9sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFzQnpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQW9CO1FBU2hDLFlBQ0MsV0FBd0IsRUFDeEIsYUFBNkIsRUFDTixvQkFBMkMsRUFDOUMsaUJBQXFDO1lBWHpDLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFckMsMkJBQXNCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUNyRCwwQkFBcUIsR0FBZ0IsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUV2RSxZQUFPLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFRN0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFN0MsTUFBTSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDhCQUFvQixFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsZ0JBQU0sQ0FBQyxhQUFhLEVBQUU7Z0JBQ2xILFdBQVcsRUFBRSxnQkFBTSxDQUFDLGVBQWU7Z0JBQ25DLGtCQUFrQixvQ0FBMkI7Z0JBQzdDLGNBQWMsRUFBRTtvQkFDZixZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSTtpQkFDeEI7Z0JBQ0QsZUFBZSxFQUFFLGVBQWU7Z0JBQ2hDLHNCQUFzQixFQUFFLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFO29CQUMzQyxJQUFJLE1BQU0sWUFBWSwyQkFBaUIsSUFBSSxNQUFNLENBQUMs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