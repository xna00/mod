/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHostTypes", "./extHost.protocol", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/types"], function (require, exports, extHostTypes_1, extHost_protocol_1, nls_1, lifecycle_1, extHostTypeConverters_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostStatusBar = exports.ExtHostStatusBarEntry = void 0;
    class ExtHostStatusBarEntry {
        static { this.ID_GEN = 0; }
        static { this.ALLOWED_BACKGROUND_COLORS = new Map([
            ['statusBarItem.errorBackground', new extHostTypes_1.ThemeColor('statusBarItem.errorForeground')],
            ['statusBarItem.warningBackground', new extHostTypes_1.ThemeColor('statusBarItem.warningForeground')]
        ]); }
        #proxy;
        #commands;
        constructor(proxy, commands, staticItems, extension, id, alignment = extHostTypes_1.StatusBarAlignment.Left, priority) {
            this._disposed = false;
            this._text = '';
            this._staleCommandRegistrations = new lifecycle_1.DisposableStore();
            this.#proxy = proxy;
            this.#commands = commands;
            if (id && extension) {
                this._entryId = (0, extHostTypes_1.asStatusBarItemIdentifier)(extension.identifier, id);
                // if new item already exists mark it as visible and copy properties
                // this can only happen when an item was contributed by an extension
                const item = staticItems.get(this._entryId);
                if (item) {
                    alignment = item.alignLeft ? extHostTypes_1.StatusBarAlignment.Left : extHostTypes_1.StatusBarAlignment.Right;
                    priority = item.priority;
                    this._visible = true;
                    this.name = item.name;
                    this.text = item.text;
                    this.tooltip = item.tooltip;
                    this.command = item.command;
                    this.accessibilityInformation = item.accessibilityInformation;
                }
            }
            else {
                this._entryId = String(ExtHostStatusBarEntry.ID_GEN++);
            }
            this._extension = extension;
            this._id = id;
            this._alignment = alignment;
            this._priority = this.validatePriority(priority);
        }
        validatePriority(priority) {
            if (!(0, types_1.isNumber)(priority)) {
                return undefined; // using this method to catch `NaN` too!
            }
            // Our RPC mechanism use JSON to serialize data which does
            // not support `Infinity` so we need to fill in the number
            // equivalent as close as possible.
            // https://github.com/microsoft/vscode/issues/133317
            if (priority === Number.POSITIVE_INFINITY) {
                return Number.MAX_VALUE;
            }
            if (priority === Number.NEGATIVE_INFINITY) {
                return -Number.MAX_VALUE;
            }
            return priority;
        }
        get id() {
            return this._id ?? this._extension.identifier.value;
        }
        get alignment() {
            return this._alignment;
        }
        get priority() {
            return this._priority;
        }
        get text() {
            return this._text;
        }
        get name() {
            return this._name;
        }
        get tooltip() {
            return this._tooltip;
        }
        get color() {
            return this._color;
        }
        get backgroundColor() {
            return this._backgroundColor;
        }
        get command() {
            return this._command?.fromApi;
        }
        get accessibilityInformation() {
            return this._accessibilityInformation;
        }
        set text(text) {
            this._text = text;
            this.update();
        }
        set name(name) {
            this._name = name;
            this.update();
        }
        set tooltip(tooltip) {
            this._tooltip = tooltip;
            this.update();
        }
        set color(color) {
            this._color = color;
            this.update();
        }
        set backgroundColor(color) {
            if (color && !ExtHostStatusBarEntry.ALLOWED_BACKGROUND_COLORS.has(color.id)) {
                color = undefined;
            }
            this._backgroundColor = color;
            this.update();
        }
        set command(command) {
            if (this._command?.fromApi === command) {
                return;
            }
            if (this._latestCommandRegistration) {
                this._staleCommandRegistrations.add(this._latestCommandRegistration);
            }
            this._latestCommandRegistration = new lifecycle_1.DisposableStore();
            if (typeof command === 'string') {
                this._command = {
                    fromApi: command,
                    internal: this.#commands.toInternal({ title: '', command }, this._latestCommandRegistration),
                };
            }
            else if (command) {
                this._command = {
                    fromApi: command,
                    internal: this.#commands.toInternal(command, this._latestCommandRegistration),
                };
            }
            else {
                this._command = undefined;
            }
            this.update();
        }
        set accessibilityInformation(accessibilityInformation) {
            this._accessibilityInformation = accessibilityInformation;
            this.update();
        }
        show() {
            this._visible = true;
            this.update();
        }
        hide() {
            clearTimeout(this._timeoutHandle);
            this._visible = false;
            this.#proxy.$disposeEntry(this._entryId);
        }
        update() {
            if (this._disposed || !this._visible) {
                return;
            }
            clearTimeout(this._timeoutHandle);
            // Defer the update so that multiple changes to setters dont cause a redraw each
            this._timeoutHandle = setTimeout(() => {
                this._timeoutHandle = undefined;
                // If the id is not set, derive it from the extension identifier,
                // otherwise make sure to prefix it with the extension identifier
                // to get a more unique value across extensions.
                let id;
                if (this._extension) {
                    if (this._id) {
                        id = `${this._extension.identifier.value}.${this._id}`;
                    }
                    else {
                        id = this._extension.identifier.value;
                    }
                }
                else {
                    id = this._id;
                }
                // If the name is not set, derive it from the extension descriptor
                let name;
                if (this._name) {
                    name = this._name;
                }
                else {
                    name = (0, nls_1.localize)('extensionLabel', "{0} (Extension)", this._extension.displayName || this._extension.name);
                }
                // If a background color is set, the foreground is determined
                let color = this._color;
                if (this._backgroundColor) {
                    color = ExtHostStatusBarEntry.ALLOWED_BACKGROUND_COLORS.get(this._backgroundColor.id);
                }
                const tooltip = extHostTypeConverters_1.MarkdownString.fromStrict(this._tooltip);
                // Set to status bar
                this.#proxy.$setEntry(this._entryId, id, this._extension?.identifier.value, name, this._text, tooltip, this._command?.internal, color, this._backgroundColor, this._alignment === extHostTypes_1.StatusBarAlignment.Left, this._priority, this._accessibilityInformation);
                // clean-up state commands _after_ updating the UI
                this._staleCommandRegistrations.clear();
            }, 0);
        }
        dispose() {
            this.hide();
            this._disposed = true;
        }
    }
    exports.ExtHostStatusBarEntry = ExtHostStatusBarEntry;
    class StatusBarMessage {
        constructor(statusBar) {
            this._messages = [];
            this._item = statusBar.createStatusBarEntry(undefined, 'status.extensionMessage', extHostTypes_1.StatusBarAlignment.Left, Number.MIN_VALUE);
            this._item.name = (0, nls_1.localize)('status.extensionMessage', "Extension Status");
        }
        dispose() {
            this._messages.length = 0;
            this._item.dispose();
        }
        setMessage(message) {
            const data = { message }; // use object to not confuse equal strings
            this._messages.unshift(data);
            this._update();
            return new extHostTypes_1.Disposable(() => {
                const idx = this._messages.indexOf(data);
                if (idx >= 0) {
                    this._messages.splice(idx, 1);
                    this._update();
                }
            });
        }
        _update() {
            if (this._messages.length > 0) {
                this._item.text = this._messages[0].message;
                this._item.show();
            }
            else {
                this._item.hide();
            }
        }
    }
    class ExtHostStatusBar {
        constructor(mainContext, commands) {
            this._existingItems = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadStatusBar);
            this._commands = commands;
            this._statusMessage = new StatusBarMessage(this);
        }
        $acceptStaticEntries(added) {
            for (const item of added) {
                this._existingItems.set(item.entryId, item);
            }
        }
        createStatusBarEntry(extension, id, alignment, priority) {
            return new ExtHostStatusBarEntry(this._proxy, this._commands, this._existingItems, extension, id, alignment, priority);
        }
        setStatusBarMessage(text, timeoutOrThenable) {
            const d = this._statusMessage.setMessage(text);
            let handle;
            if (typeof timeoutOrThenable === 'number') {
                handle = setTimeout(() => d.dispose(), timeoutOrThenable);
            }
            else if (typeof timeoutOrThenable !== 'undefined') {
                timeoutOrThenable.then(() => d.dispose(), () => d.dispose());
            }
            return new extHostTypes_1.Disposable(() => {
                d.dispose();
                clearTimeout(handle);
            });
        }
    }
    exports.ExtHostStatusBar = ExtHostStatusBar;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFN0YXR1c0Jhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFN0YXR1c0Jhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBYSxxQkFBcUI7aUJBRWxCLFdBQU0sR0FBRyxDQUFDLEFBQUosQ0FBSztpQkFFWCw4QkFBeUIsR0FBRyxJQUFJLEdBQUcsQ0FDakQ7WUFDQyxDQUFDLCtCQUErQixFQUFFLElBQUkseUJBQVUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1lBQ2xGLENBQUMsaUNBQWlDLEVBQUUsSUFBSSx5QkFBVSxDQUFDLGlDQUFpQyxDQUFDLENBQUM7U0FDdEYsQ0FDRCxBQUx1QyxDQUt0QztRQUVGLE1BQU0sQ0FBMkI7UUFDakMsU0FBUyxDQUFvQjtRQThCN0IsWUFBWSxLQUErQixFQUFFLFFBQTJCLEVBQUUsV0FBa0QsRUFBRSxTQUFpQyxFQUFFLEVBQVcsRUFBRSxZQUF1QyxpQ0FBeUIsQ0FBQyxJQUFJLEVBQUUsUUFBaUI7WUFwQjlQLGNBQVMsR0FBWSxLQUFLLENBQUM7WUFHM0IsVUFBSyxHQUFXLEVBQUUsQ0FBQztZQU1WLCtCQUEwQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBWW5FLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBRTFCLElBQUksRUFBRSxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUEsd0NBQXlCLEVBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDcEUsb0VBQW9FO2dCQUNwRSxvRUFBb0U7Z0JBQ3BFLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FB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