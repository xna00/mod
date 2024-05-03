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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/markers/browser/messages", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/browser/ui/actionbar/actionViewItems", "vs/workbench/contrib/markers/common/markers", "vs/css!./markersViewActions"], function (require, exports, DOM, actions_1, contextView_1, messages_1, lifecycle_1, event_1, codicons_1, themables_1, actionViewItems_1, markers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickFixActionViewItem = exports.QuickFixAction = exports.MarkersFilters = void 0;
    class MarkersFilters extends lifecycle_1.Disposable {
        constructor(options, contextKeyService) {
            super();
            this.contextKeyService = contextKeyService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._excludedFiles = markers_1.MarkersContextKeys.ShowExcludedFilesFilterContextKey.bindTo(this.contextKeyService);
            this._activeFile = markers_1.MarkersContextKeys.ShowActiveFileFilterContextKey.bindTo(this.contextKeyService);
            this._showWarnings = markers_1.MarkersContextKeys.ShowWarningsFilterContextKey.bindTo(this.contextKeyService);
            this._showErrors = markers_1.MarkersContextKeys.ShowErrorsFilterContextKey.bindTo(this.contextKeyService);
            this._showInfos = markers_1.MarkersContextKeys.ShowInfoFilterContextKey.bindTo(this.contextKeyService);
            this._showErrors.set(options.showErrors);
            this._showWarnings.set(options.showWarnings);
            this._showInfos.set(options.showInfos);
            this._excludedFiles.set(options.excludedFiles);
            this._activeFile.set(options.activeFile);
            this.filterHistory = options.filterHistory;
        }
        get excludedFiles() {
            return !!this._excludedFiles.get();
        }
        set excludedFiles(filesExclude) {
            if (this._excludedFiles.get() !== filesExclude) {
                this._excludedFiles.set(filesExclude);
                this._onDidChange.fire({ excludedFiles: true });
            }
        }
        get activeFile() {
            return !!this._activeFile.get();
        }
        set activeFile(activeFile) {
            if (this._activeFile.get() !== activeFile) {
                this._activeFile.set(activeFile);
                this._onDidChange.fire({ activeFile: true });
            }
        }
        get showWarnings() {
            return !!this._showWarnings.get();
        }
        set showWarnings(showWarnings) {
            if (this._showWarnings.get() !== showWarnings) {
                this._showWarnings.set(showWarnings);
                this._onDidChange.fire({ showWarnings: true });
            }
        }
        get showErrors() {
            return !!this._showErrors.get();
        }
        set showErrors(showErrors) {
            if (this._showErrors.get() !== showErrors) {
                this._showErrors.set(showErrors);
                this._onDidChange.fire({ showErrors: true });
            }
        }
        get showInfos() {
            return !!this._showInfos.get();
        }
        set showInfos(showInfos) {
            if (this._showInfos.get() !== showInfos) {
                this._showInfos.set(showInfos);
                this._onDidChange.fire({ showInfos: true });
            }
        }
    }
    exports.MarkersFilters = MarkersFilters;
    class QuickFixAction extends actions_1.Action {
        static { this.ID = 'workbench.actions.problems.quickfix'; }
        static { this.CLASS = 'markers-panel-action-quickfix ' + themables_1.ThemeIcon.asClassName(codicons_1.Codicon.lightBulb); }
        static { this.AUTO_FIX_CLASS = QuickFixAction.CLASS + ' autofixable'; }
        get quickFixes() {
            return this._quickFixes;
        }
        set quickFixes(quickFixes) {
            this._quickFixes = quickFixes;
            this.enabled = this._quickFixes.length > 0;
        }
        autoFixable(autofixable) {
            this.class = autofixable ? QuickFixAction.AUTO_FIX_CLASS : QuickFixAction.CLASS;
        }
        constructor(marker) {
            super(QuickFixAction.ID, messages_1.default.MARKERS_PANEL_ACTION_TOOLTIP_QUICKFIX, QuickFixAction.CLASS, false);
            this.marker = marker;
            this._onShowQuickFixes = this._register(new event_1.Emitter());
            this.onShowQuickFixes = this._onShowQuickFixes.event;
            this._quickFixes = [];
        }
        run() {
            this._onShowQuickFixes.fire();
            return Promise.resolve();
        }
    }
    exports.QuickFixAction = QuickFixAction;
    let QuickFixActionViewItem = class QuickFixActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(action, options, contextMenuService) {
            super(null, action, { ...options, icon: true, label: false });
            this.contextMenuService = contextMenuService;
        }
        onClick(event) {
            DOM.EventHelper.stop(event, true);
            this.showQuickFixes();
        }
        showQuickFixes() {
            if (!this.element) {
                return;
            }
            if (!this.isEnabled()) {
                return;
            }
            const elementPosition = DOM.getDomNodePagePosition(this.element);
            const quickFixes = this.action.quickFixes;
            if (quickFixes.length) {
                this.contextMenuService.showContextMenu({
                    getAnchor: () => ({ x: elementPosition.left + 10, y: elementPosition.top + elementPosition.height + 4 }),
                    getActions: () => quickFixes
                });
            }
        }
    };
    exports.QuickFixActionViewItem = QuickFixActionViewItem;
    exports.QuickFixActionViewItem = QuickFixActionViewItem = __decorate([
        __param(2, contextView_1.IContextMenuService)
    ], QuickFixActionViewItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vyc1ZpZXdBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tYXJrZXJzL2Jyb3dzZXIvbWFya2Vyc1ZpZXdBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlDaEcsTUFBYSxjQUFlLFNBQVEsc0JBQVU7UUFLN0MsWUFBWSxPQUErQixFQUFtQixpQkFBcUM7WUFDbEcsS0FBSyxFQUFFLENBQUM7WUFEcUQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUhsRixpQkFBWSxHQUF3QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE4QixDQUFDLENBQUM7WUFDdEgsZ0JBQVcsR0FBc0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFlakUsbUJBQWMsR0FBRyw0QkFBa0IsQ0FBQyxpQ0FBaUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFXckcsZ0JBQVcsR0FBRyw0QkFBa0IsQ0FBQyw4QkFBOEIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFXL0Ysa0JBQWEsR0FBRyw0QkFBa0IsQ0FBQyw0QkFBNEIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFXL0YsZ0JBQVcsR0FBRyw0QkFBa0IsQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFXM0YsZUFBVSxHQUFHLDRCQUFrQixDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQXREeEcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFVB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