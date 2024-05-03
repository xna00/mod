/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/theme/common/iconRegistry", "vs/base/common/themables", "vs/base/browser/mouseEvent"], function (require, exports, dom, actionbar_1, actions_1, codicons_1, lifecycle_1, strings, nls, menuEntryActionViewItem_1, iconRegistry_1, themables_1, mouseEvent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentThreadHeader = void 0;
    const collapseIcon = (0, iconRegistry_1.registerIcon)('review-comment-collapse', codicons_1.Codicon.chevronUp, nls.localize('collapseIcon', 'Icon to collapse a review comment.'));
    const COLLAPSE_ACTION_CLASS = 'expand-review-action ' + themables_1.ThemeIcon.asClassName(collapseIcon);
    class CommentThreadHeader extends lifecycle_1.Disposable {
        constructor(container, _delegate, _commentMenus, _commentThread, _contextKeyService, instantiationService, _contextMenuService) {
            super();
            this._delegate = _delegate;
            this._commentMenus = _commentMenus;
            this._commentThread = _commentThread;
            this._contextKeyService = _contextKeyService;
            this.instantiationService = instantiationService;
            this._contextMenuService = _contextMenuService;
            this._headElement = dom.$('.head');
            container.appendChild(this._headElement);
            this._fillHead();
        }
        _fillHead() {
            const titleElement = dom.append(this._headElement, dom.$('.review-title'));
            this._headingLabel = dom.append(titleElement, dom.$('span.filename'));
            this.createThreadLabel();
            const actionsContainer = dom.append(this._headElement, dom.$('.review-actions'));
            this._actionbarWidget = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: menuEntryActionViewItem_1.createActionViewItem.bind(undefined, this.instantiationService)
            });
            this._register(this._actionbarWidget);
            this._collapseAction = new actions_1.Action('review.expand', nls.localize('label.collapse', "Collapse"), COLLAPSE_ACTION_CLASS, true, () => this._delegate.collapse());
            const menu = this._commentMenus.getCommentThreadTitleActions(this._contextKeyService);
            this.setActionBarActions(menu);
            this._register(menu);
            this._register(menu.onDidChange(e => {
                this.setActionBarActions(menu);
            }));
            this._register(dom.addDisposableListener(this._headElement, dom.EventType.CONTEXT_MENU, e => {
                return this.onContextMenu(e);
            }));
            this._actionbarWidget.context = this._commentThread;
        }
        setActionBarActions(menu) {
            const groups = menu.getActions({ shouldForwardArgs: true }).reduce((r, [, actions]) => [...r, ...actions], []);
            this._actionbarWidget.clear();
            this._actionbarWidget.push([...groups, this._collapseAction], { label: false, icon: true });
        }
        updateCommentThread(commentThread) {
            this._commentThread = commentThread;
            this._actionbarWidget.context = this._commentThread;
            this.createThreadLabel();
        }
        createThreadLabel() {
            let label;
            label = this._commentThread.label;
            if (label === undefined) {
                if (!(this._commentThread.comments && this._commentThread.comments.length)) {
                    label = nls.localize('startThread', "Start discussion");
                }
            }
            if (label) {
                this._headingLabel.textContent = strings.escape(label);
                this._headingLabel.setAttribute('aria-label', label);
            }
        }
        updateHeight(headHeight) {
            this._headElement.style.height = `${headHeight}px`;
            this._headElement.style.lineHeight = this._headElement.style.height;
        }
        onContextMenu(e) {
            const actions = this._commentMenus.getCommentThreadTitleContextActions(this._contextKeyService).getActions({ shouldForwardArgs: true }).map((value) => value[1]).flat();
            if (!actions.length) {
                return;
            }
            const event = new mouseEvent_1.StandardMouseEvent(dom.getWindow(this._headElement), e);
            this._contextMenuService.showContextMenu({
                getAnchor: () => event,
                getActions: () => actions,
                actionRunner: new actions_1.ActionRunner(),
                getActionsContext: () => {
                    return {
                        commentControlHandle: this._commentThread.controllerHandle,
                        commentThreadHandle: this._commentThread.commentThreadHandle,
                        $mid: 7 /* MarshalledId.CommentThread */
                    };
                },
            });
        }
    }
    exports.CommentThreadHeader = CommentThreadHeader;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudFRocmVhZEhlYWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29tbWVudHMvYnJvd3Nlci9jb21tZW50VGhyZWFkSGVhZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXVCaEcsTUFBTSxZQUFZLEdBQUcsSUFBQSwyQkFBWSxFQUFDLHlCQUF5QixFQUFFLGtCQUFPLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLG9DQUFvQyxDQUFDLENBQUMsQ0FBQztJQUNwSixNQUFNLHFCQUFxQixHQUFHLHVCQUF1QixHQUFHLHFCQUFTLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBRzVGLE1BQWEsbUJBQWdDLFNBQVEsc0JBQVU7UUFNOUQsWUFDQyxTQUFzQixFQUNkLFNBQW1DLEVBQ25DLGFBQTJCLEVBQzNCLGNBQTBDLEVBQzFDLGtCQUFzQyxFQUN0QyxvQkFBMkMsRUFDM0MsbUJBQXdDO1lBRWhELEtBQUssRUFBRSxDQUFDO1lBUEEsY0FBUyxHQUFULFNBQVMsQ0FBMEI7WUFDbkMsa0JBQWEsR0FBYixhQUFhLENBQWM7WUFDM0IsbUJBQWMsR0FBZCxjQUFjLENBQTRCO1lBQzFDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDdEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBR2hELElBQUksQ0FBQyxZQUFZLEdBQW1CLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkQsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2xCLENBQUM7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