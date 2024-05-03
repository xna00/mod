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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/actions/browser/toolbar", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView"], function (require, exports, DOM, lifecycle_1, toolbar_1, actions_1, contextView_1, instantiation_1, cellActionView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListTopCellToolbar = void 0;
    let ListTopCellToolbar = class ListTopCellToolbar extends lifecycle_1.Disposable {
        constructor(notebookEditor, notebookOptions, instantiationService, contextMenuService, menuService) {
            super();
            this.notebookEditor = notebookEditor;
            this.notebookOptions = notebookOptions;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this.viewZone = this._register(new lifecycle_1.MutableDisposable());
            this._modelDisposables = this._register(new lifecycle_1.DisposableStore());
            this.topCellToolbarContainer = DOM.$('div');
            this.topCellToolbar = DOM.$('.cell-list-top-cell-toolbar-container');
            this.topCellToolbarContainer.appendChild(this.topCellToolbar);
            this._register(this.notebookEditor.onDidAttachViewModel(() => {
                this.updateTopToolbar();
            }));
            this._register(this.notebookOptions.onDidChangeOptions(e => {
                if (e.insertToolbarAlignment || e.insertToolbarPosition || e.cellToolbarLocation) {
                    this.updateTopToolbar();
                }
            }));
        }
        updateTopToolbar() {
            const layoutInfo = this.notebookOptions.getLayoutConfiguration();
            this.viewZone.value = new lifecycle_1.DisposableStore();
            if (layoutInfo.insertToolbarPosition === 'hidden' || layoutInfo.insertToolbarPosition === 'notebookToolbar') {
                const height = this.notebookOptions.computeTopInsertToolbarHeight(this.notebookEditor.textModel?.viewType);
                if (height !== 0) {
                    // reserve whitespace to avoid overlap with cell toolbar
                    this.notebookEditor.changeViewZones(accessor => {
                        const id = accessor.addZone({
                            afterModelPosition: 0,
                            heightInPx: height,
                            domNode: DOM.$('div')
                        });
                        accessor.layoutZone(id);
                        this.viewZone.value?.add({
                            dispose: () => {
                                if (!this.notebookEditor.isDisposed) {
                                    this.notebookEditor.changeViewZones(accessor => {
                                        accessor.removeZone(id);
                                    });
                                }
                            }
                        });
                    });
                }
                return;
            }
            this.notebookEditor.changeViewZones(accessor => {
                const height = this.notebookOptions.computeTopInsertToolbarHeight(this.notebookEditor.textModel?.viewType);
                const id = accessor.addZone({
                    afterModelPosition: 0,
                    heightInPx: height,
                    domNode: this.topCellToolbarContainer
                });
                accessor.layoutZone(id);
                this.viewZone.value?.add({
                    dispose: () => {
                        if (!this.notebookEditor.isDisposed) {
                            this.notebookEditor.changeViewZones(accessor => {
                                accessor.removeZone(id);
                            });
                        }
                    }
                });
                DOM.clearNode(this.topCellToolbar);
                const toolbar = this.instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, this.topCellToolbar, this.notebookEditor.creationOptions.menuIds.cellTopInsertToolbar, {
                    actionViewItemProvider: (action, options) => {
                        if (action instanceof actions_1.MenuItemAction) {
                            const item = this.instantiationService.createInstance(cellActionView_1.CodiconActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                            return item;
                        }
                        return undefined;
                    },
                    menuOptions: {
                        shouldForwardArgs: true
                    },
                    toolbarOptions: {
                        primaryGroup: (g) => /^inline/.test(g),
                    },
                    hiddenItemStrategy: 0 /* HiddenItemStrategy.Ignore */,
                });
                toolbar.context = {
                    notebookEditor: this.notebookEditor
                };
                this.viewZone.value?.add(toolbar);
                // update toolbar container css based on cell list length
                this.viewZone.value?.add(this.notebookEditor.onDidChangeModel(() => {
                    this._modelDisposables.clear();
                    if (this.notebookEditor.hasModel()) {
                        this._modelDisposables.add(this.notebookEditor.onDidChangeViewCells(() => {
                            this.updateClass();
                        }));
                        this.updateClass();
                    }
                }));
                this.updateClass();
            });
        }
        updateClass() {
            if (this.notebookEditor.hasModel() && this.notebookEditor.getLength() === 0) {
                this.topCellToolbar.classList.add('emptyNotebook');
            }
            else {
                this.topCellToolbar.classList.remove('emptyNotebook');
            }
        }
    };
    exports.ListTopCellToolbar = ListTopCellToolbar;
    exports.ListTopCellToolbar = ListTopCellToolbar = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, actions_1.IMenuService)
    ], ListTopCellToolbar);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tUb3BDZWxsVG9vbGJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3UGFydHMvbm90ZWJvb2tUb3BDZWxsVG9vbGJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQUtqRCxZQUNvQixjQUF1QyxFQUN6QyxlQUFnQyxFQUMxQixvQkFBOEQsRUFDaEUsa0JBQTBELEVBQ2pFLFdBQTRDO1lBRTFELEtBQUssRUFBRSxDQUFDO1lBTlcsbUJBQWMsR0FBZCxjQUFjLENBQXlCO1lBQ3pDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNQLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDN0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM5QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQVBuRCxhQUFRLEdBQXVDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFDOUUsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBVTFFLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxjQUFjLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1lBQ3JFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRTlELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FB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