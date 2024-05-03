/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/uri", "vs/base/browser/ui/actionbar/actionViewItems"], function (require, exports, nls, dom, actions_1, uri_1, actionViewItems_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReactionAction = exports.ReactionActionViewItem = exports.ToggleReactionsAction = void 0;
    class ToggleReactionsAction extends actions_1.Action {
        static { this.ID = 'toolbar.toggle.pickReactions'; }
        constructor(toggleDropdownMenu, title) {
            super(ToggleReactionsAction.ID, title || nls.localize('pickReactions', "Pick Reactions..."), 'toggle-reactions', true);
            this._menuActions = [];
            this.toggleDropdownMenu = toggleDropdownMenu;
        }
        run() {
            this.toggleDropdownMenu();
            return Promise.resolve(true);
        }
        get menuActions() {
            return this._menuActions;
        }
        set menuActions(actions) {
            this._menuActions = actions;
        }
    }
    exports.ToggleReactionsAction = ToggleReactionsAction;
    class ReactionActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(action) {
            super(null, action, {});
        }
        updateLabel() {
            if (!this.label) {
                return;
            }
            const action = this.action;
            if (action.class) {
                this.label.classList.add(action.class);
            }
            if (!action.icon) {
                const reactionLabel = dom.append(this.label, dom.$('span.reaction-label'));
                reactionLabel.innerText = action.label;
            }
            else {
                const reactionIcon = dom.append(this.label, dom.$('.reaction-icon'));
                const uri = uri_1.URI.revive(action.icon);
                reactionIcon.style.backgroundImage = dom.asCSSUrl(uri);
            }
            if (action.count) {
                const reactionCount = dom.append(this.label, dom.$('span.reaction-count'));
                reactionCount.innerText = `${action.count}`;
            }
        }
        getTooltip() {
            const action = this.action;
            const toggleMessage = action.enabled ? nls.localize('comment.toggleableReaction', "Toggle reaction, ") : '';
            if (action.count === undefined) {
                return nls.localize({
                    key: 'comment.reactionLabelNone', comment: [
                        'This is a tooltip for an emoji button so that the current user can toggle their reaction to a comment.',
                        'The first arg is localized message "Toggle reaction" or empty if the user doesn\'t have permission to toggle the reaction, the second is the name of the reaction.'
                    ]
                }, "{0}{1} reaction", toggleMessage, action.label);
            }
            else if (action.reactors === undefined || action.reactors.length === 0) {
                if (action.count === 1) {
                    return nls.localize({
                        key: 'comment.reactionLabelOne', comment: [
                            'This is a tooltip for an emoji that is a "reaction" to a comment where the count of the reactions is 1.',
                            'The emoji is also a button so that the current user can also toggle their own emoji reaction.',
                            'The first arg is localized message "Toggle reaction" or empty if the user doesn\'t have permission to toggle the reaction, the second is the name of the reaction.'
                        ]
                    }, "{0}1 reaction with {1}", toggleMessage, action.label);
                }
                else if (action.count > 1) {
                    return nls.localize({
                        key: 'comment.reactionLabelMany', comment: [
                            'This is a tooltip for an emoji that is a "reaction" to a comment where the count of the reactions is greater than 1.',
                            'The emoji is also a button so that the current user can also toggle their own emoji reaction.',
                            'The first arg is localized message "Toggle reaction" or empty if the user doesn\'t have permission to toggle the reaction, the second is number of users who have reacted with that reaction, and the third is the name of the reaction.'
                        ]
                    }, "{0}{1} reactions with {2}", toggleMessage, action.count, action.label);
                }
            }
            else {
                if (action.reactors.length <= 10 && action.reactors.length === action.count) {
                    return nls.localize({
                        key: 'comment.reactionLessThanTen', comment: [
                            'This is a tooltip for an emoji that is a "reaction" to a comment where the count of the reactions is less than or equal to 10.',
                            'The emoji is also a button so that the current user can also toggle their own emoji reaction.',
                            'The first arg is localized message "Toggle reaction" or empty if the user doesn\'t have permission to toggle the reaction, the second iis a list of the reactors, and the third is the name of the reaction.'
                        ]
                    }, "{0}{1} reacted with {2}", toggleMessage, action.reactors.join(', '), action.label);
                }
                else if (action.count > 1) {
                    const displayedReactors = action.reactors.slice(0, 10);
                    return nls.localize({
                        key: 'comment.reactionMoreThanTen', comment: [
                            'This is a tooltip for an emoji that is a "reaction" to a comment where the count of the reactions is less than or equal to 10.',
                            'The emoji is also a button so that the current user can also toggle their own emoji reaction.',
                            'The first arg is localized message "Toggle reaction" or empty if the user doesn\'t have permission to toggle the reaction, the second iis a list of the reactors, and the third is the name of the reaction.'
                        ]
                    }, "{0}{1} and {2} more reacted with {3}", toggleMessage, displayedReactors.join(', '), action.count - displayedReactors.length, action.label);
                }
            }
            return undefined;
        }
    }
    exports.ReactionActionViewItem = ReactionActionViewItem;
    class ReactionAction extends actions_1.Action {
        static { this.ID = 'toolbar.toggle.reaction'; }
        constructor(id, label = '', cssClass = '', enabled = true, actionCallback, reactors, icon, count) {
            super(ReactionAction.ID, label, cssClass, enabled, actionCallback);
            this.reactors = reactors;
            this.icon = icon;
            this.count = count;
        }
    }
    exports.ReactionAction = ReactionAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhY3Rpb25zQWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL3JlYWN0aW9uc0FjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSxxQkFBc0IsU0FBUSxnQkFBTTtpQkFDaEMsT0FBRSxHQUFHLDhCQUE4QixBQUFqQyxDQUFrQztRQUdwRCxZQUFZLGtCQUE4QixFQUFFLEtBQWM7WUFDekQsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxLQUFLLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsbUJBQW1CLENBQUMsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUhoSCxpQkFBWSxHQUFjLEVBQUUsQ0FBQztZQUlwQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUM7UUFDOUMsQ0FBQztRQUNRLEdBQUc7WUFDWCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUMxQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUNELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBQ0QsSUFBSSxXQUFXLENBQUMsT0FBa0I7WUFDakMsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUM7UUFDN0IsQ0FBQzs7SUFqQkYsc0RBa0JDO0lBQ0QsTUFBYSxzQkFBdUIsU0FBUSxnQ0FBYztRQUN6RCxZQUFZLE1BQXNCO1lBQ2pDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFDa0IsV0FBVztZQUM3QixJQUFJLENBQUMsSUFBSSxD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