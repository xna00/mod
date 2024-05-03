/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/base/common/event", "vs/workbench/contrib/comments/browser/comments", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/contrib/comments/browser/commentsTreeViewer", "vs/workbench/common/contextkeys", "vs/workbench/browser/parts/views/viewFilter"], function (require, exports, lifecycle_1, nls_1, contextkey_1, event_1, comments_1, actions_1, viewPane_1, commentsTreeViewer_1, contextkeys_1, viewFilter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentsFilters = void 0;
    const CONTEXT_KEY_SHOW_RESOLVED = new contextkey_1.RawContextKey('commentsView.showResolvedFilter', true);
    const CONTEXT_KEY_SHOW_UNRESOLVED = new contextkey_1.RawContextKey('commentsView.showUnResolvedFilter', true);
    class CommentsFilters extends lifecycle_1.Disposable {
        constructor(options, contextKeyService) {
            super();
            this.contextKeyService = contextKeyService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._showUnresolved = CONTEXT_KEY_SHOW_UNRESOLVED.bindTo(this.contextKeyService);
            this._showResolved = CONTEXT_KEY_SHOW_RESOLVED.bindTo(this.contextKeyService);
            this._showResolved.set(options.showResolved);
            this._showUnresolved.set(options.showUnresolved);
        }
        get showUnresolved() {
            return !!this._showUnresolved.get();
        }
        set showUnresolved(showUnresolved) {
            if (this._showUnresolved.get() !== showUnresolved) {
                this._showUnresolved.set(showUnresolved);
                this._onDidChange.fire({ showUnresolved: true });
            }
        }
        get showResolved() {
            return !!this._showResolved.get();
        }
        set showResolved(showResolved) {
            if (this._showResolved.get() !== showResolved) {
                this._showResolved.set(showResolved);
                this._onDidChange.fire({ showResolved: true });
            }
        }
    }
    exports.CommentsFilters = CommentsFilters;
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'commentsFocusViewFromFilter',
                title: (0, nls_1.localize)('focusCommentsList', "Focus Comments view"),
                keybinding: {
                    when: comments_1.CommentsViewFilterFocusContextKey,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */
                },
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, commentsView) {
            commentsView.focus();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'commentsClearFilterText',
                title: (0, nls_1.localize)('commentsClearFilterText', "Clear filter text"),
                keybinding: {
                    when: comments_1.CommentsViewFilterFocusContextKey,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 9 /* KeyCode.Escape */
                },
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, commentsView) {
            commentsView.clearFilterText();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'commentsFocusFilter',
                title: (0, nls_1.localize)('focusCommentsFilter', "Focus comments filter"),
                keybinding: {
                    when: contextkeys_1.FocusedViewContext.isEqualTo(commentsTreeViewer_1.COMMENTS_VIEW_ID),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */
                },
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, commentsView) {
            commentsView.focusFilter();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${commentsTreeViewer_1.COMMENTS_VIEW_ID}.toggleUnResolvedComments`,
                title: (0, nls_1.localize)('toggle unresolved', "Show Unresolved"),
                category: (0, nls_1.localize)('comments', "Comments"),
                toggled: {
                    condition: CONTEXT_KEY_SHOW_UNRESOLVED,
                    title: (0, nls_1.localize)('unresolved', "Show Unresolved"),
                },
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '1_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', commentsTreeViewer_1.COMMENTS_VIEW_ID),
                    order: 1
                },
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.showUnresolved = !view.filters.showUnresolved;
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${commentsTreeViewer_1.COMMENTS_VIEW_ID}.toggleResolvedComments`,
                title: (0, nls_1.localize)('toggle resolved', "Show Resolved"),
                category: (0, nls_1.localize)('comments', "Comments"),
                toggled: {
                    condition: CONTEXT_KEY_SHOW_RESOLVED,
                    title: (0, nls_1.localize)('resolved', "Show Resolved"),
                },
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '1_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', commentsTreeViewer_1.COMMENTS_VIEW_ID),
                    order: 1
                },
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.showResolved = !view.filters.showResolved;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNWaWV3QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci9jb21tZW50c1ZpZXdBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdCaEcsTUFBTSx5QkFBeUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsaUNBQWlDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdEcsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLDBCQUFhLENBQVUsbUNBQW1DLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFZMUcsTUFBYSxlQUFnQixTQUFRLHNCQUFVO1FBSzlDLFlBQVksT0FBK0IsRUFBbUIsaUJBQXFDO1lBQ2xHLEtBQUssRUFBRSxDQUFDO1lBRHFELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFIbEYsaUJBQVksR0FBd0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBOEIsQ0FBQyxDQUFDO1lBQ3RILGdCQUFXLEdBQXNDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBUWpFLG9CQUFlLEdBQUcsMkJBQTJCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBV3RGLGtCQUFhLEdBQUcseUJBQXlCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBZmhGLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUdELElBQUksY0FBYztZQUNqQixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMs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