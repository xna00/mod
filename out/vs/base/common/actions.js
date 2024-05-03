/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls"], function (require, exports, event_1, lifecycle_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmptySubmenuAction = exports.SubmenuAction = exports.Separator = exports.ActionRunner = exports.Action = void 0;
    exports.toAction = toAction;
    class Action extends lifecycle_1.Disposable {
        constructor(id, label = '', cssClass = '', enabled = true, actionCallback) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._enabled = true;
            this._id = id;
            this._label = label;
            this._cssClass = cssClass;
            this._enabled = enabled;
            this._actionCallback = actionCallback;
        }
        get id() {
            return this._id;
        }
        get label() {
            return this._label;
        }
        set label(value) {
            this._setLabel(value);
        }
        _setLabel(value) {
            if (this._label !== value) {
                this._label = value;
                this._onDidChange.fire({ label: value });
            }
        }
        get tooltip() {
            return this._tooltip || '';
        }
        set tooltip(value) {
            this._setTooltip(value);
        }
        _setTooltip(value) {
            if (this._tooltip !== value) {
                this._tooltip = value;
                this._onDidChange.fire({ tooltip: value });
            }
        }
        get class() {
            return this._cssClass;
        }
        set class(value) {
            this._setClass(value);
        }
        _setClass(value) {
            if (this._cssClass !== value) {
                this._cssClass = value;
                this._onDidChange.fire({ class: value });
            }
        }
        get enabled() {
            return this._enabled;
        }
        set enabled(value) {
            this._setEnabled(value);
        }
        _setEnabled(value) {
            if (this._enabled !== value) {
                this._enabled = value;
                this._onDidChange.fire({ enabled: value });
            }
        }
        get checked() {
            return this._checked;
        }
        set checked(value) {
            this._setChecked(value);
        }
        _setChecked(value) {
            if (this._checked !== value) {
                this._checked = value;
                this._onDidChange.fire({ checked: value });
            }
        }
        async run(event, data) {
            if (this._actionCallback) {
                await this._actionCallback(event);
            }
        }
    }
    exports.Action = Action;
    class ActionRunner extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onWillRun = this._register(new event_1.Emitter());
            this.onWillRun = this._onWillRun.event;
            this._onDidRun = this._register(new event_1.Emitter());
            this.onDidRun = this._onDidRun.event;
        }
        async run(action, context) {
            if (!action.enabled) {
                return;
            }
            this._onWillRun.fire({ action });
            let error = undefined;
            try {
                await this.runAction(action, context);
            }
            catch (e) {
                error = e;
            }
            this._onDidRun.fire({ action, error });
        }
        async runAction(action, context) {
            await action.run(context);
        }
    }
    exports.ActionRunner = ActionRunner;
    class Separator {
        constructor() {
            this.id = Separator.ID;
            this.label = '';
            this.tooltip = '';
            this.class = 'separator';
            this.enabled = false;
            this.checked = false;
        }
        /**
         * Joins all non-empty lists of actions with separators.
         */
        static join(...actionLists) {
            let out = [];
            for (const list of actionLists) {
                if (!list.length) {
                    // skip
                }
                else if (out.length) {
                    out = [...out, new Separator(), ...list];
                }
                else {
                    out = list;
                }
            }
            return out;
        }
        static { this.ID = 'vs.actions.separator'; }
        async run() { }
    }
    exports.Separator = Separator;
    class SubmenuAction {
        get actions() { return this._actions; }
        constructor(id, label, actions, cssClass) {
            this.tooltip = '';
            this.enabled = true;
            this.checked = undefined;
            this.id = id;
            this.label = label;
            this.class = cssClass;
            this._actions = actions;
        }
        async run() { }
    }
    exports.SubmenuAction = SubmenuAction;
    class EmptySubmenuAction extends Action {
        static { this.ID = 'vs.actions.empty'; }
        constructor() {
            super(EmptySubmenuAction.ID, nls.localize('submenu.empty', '(empty)'), undefined, false);
        }
    }
    exports.EmptySubmenuAction = EmptySubmenuAction;
    function toAction(props) {
        return {
            id: props.id,
            label: props.label,
            class: props.class,
            enabled: props.enabled ?? true,
            checked: props.checked,
            run: async (...args) => props.run(...args),
            tooltip: props.label
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vYWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpUWhHLDRCQVVDO0lBeE5ELE1BQWEsTUFBTyxTQUFRLHNCQUFVO1FBYXJDLFlBQVksRUFBVSxFQUFFLFFBQWdCLEVBQUUsRUFBRSxXQUFtQixFQUFFLEVBQUUsVUFBbUIsSUFBSSxFQUFFLGNBQTZDO1lBQ3hJLEtBQUssRUFBRSxDQUFDO1lBWkMsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFzQixDQUFDLENBQUM7WUFDbEUsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQU1yQyxhQUFRLEdBQVksSUFBSSxDQUFDO1lBTWxDLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ2QsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7WUFDMUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDeEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxjQUFjLENBQUM7UUFDdkMsQ0FBQztRQUVELElBQUksRUFBRTtZQUNMLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNqQixDQUFDO1FBRUQsSUFBSSxLQUFLO1lBQ1IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxJQUFJLEtBQUssQ0FBQyxLQUFhO1lBQ3RCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkIsQ0FBQztRQUVPLFNBQVMsQ0FBQyxLQUFhO1lBQzlCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUUsQ0FB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