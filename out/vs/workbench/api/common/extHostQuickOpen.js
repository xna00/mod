/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "./extHost.protocol", "vs/base/common/uri", "vs/workbench/api/common/extHostTypes", "vs/base/common/errors", "vs/base/common/arrays", "vs/base/common/severity", "vs/base/common/themables", "vs/workbench/services/extensions/common/extensions", "vs/workbench/api/common/extHostTypeConverters"], function (require, exports, cancellation_1, event_1, lifecycle_1, extHost_protocol_1, uri_1, extHostTypes_1, errors_1, arrays_1, severity_1, themables_1, extensions_1, extHostTypeConverters_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createExtHostQuickOpen = createExtHostQuickOpen;
    function createExtHostQuickOpen(mainContext, workspace, commands) {
        const proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadQuickOpen);
        class ExtHostQuickOpenImpl {
            constructor(workspace, commands) {
                this._sessions = new Map();
                this._instances = 0;
                this._workspace = workspace;
                this._commands = commands;
            }
            showQuickPick(extension, itemsOrItemsPromise, options, token = cancellation_1.CancellationToken.None) {
                // clear state from last invocation
                this._onDidSelectItem = undefined;
                const itemsPromise = Promise.resolve(itemsOrItemsPromise);
                const instance = ++this._instances;
                const quickPickWidget = proxy.$show(instance, {
                    title: options?.title,
                    placeHolder: options?.placeHolder,
                    matchOnDescription: options?.matchOnDescription,
                    matchOnDetail: options?.matchOnDetail,
                    ignoreFocusLost: options?.ignoreFocusOut,
                    canPickMany: options?.canPickMany,
                }, token);
                const widgetClosedMarker = {};
                const widgetClosedPromise = quickPickWidget.then(() => widgetClosedMarker);
                return Promise.race([widgetClosedPromise, itemsPromise]).then(result => {
                    if (result === widgetClosedMarker) {
                        return undefined;
                    }
                    const allowedTooltips = (0, extensions_1.isProposedApiEnabled)(extension, 'quickPickItemTooltip');
                    return itemsPromise.then(items => {
                        const pickItems = [];
                        for (let handle = 0; handle < items.length; handle++) {
                            const item = items[handle];
                            if (typeof item === 'string') {
                                pickItems.push({ label: item, handle });
                            }
                            else if (item.kind === extHostTypes_1.QuickPickItemKind.Separator) {
                                pickItems.push({ type: 'separator', label: item.label });
                            }
                            else {
                                if (item.tooltip && !allowedTooltips) {
                                    console.warn(`Extension '${extension.identifier.value}' uses a tooltip which is proposed API that is only available when running out of dev or with the following command line switch: --enable-proposed-api ${extension.identifier.value}`);
                                }
                                const icon = (item.iconPath) ? getIconPathOrClass(item.iconPath) : undefined;
                                pickItems.push({
                                    label: item.label,
                                    iconPath: icon?.iconPath,
                                    iconClass: icon?.iconClass,
                                    description: item.description,
                                    detail: item.detail,
                                    picked: item.picked,
                                    alwaysShow: item.alwaysShow,
                                    tooltip: allowedTooltips ? extHostTypeConverters_1.MarkdownString.fromStrict(item.tooltip) : undefined,
                                    handle
                                });
                            }
                        }
                        // handle selection changes
                        if (options && typeof options.onDidSelectItem === 'function') {
                            this._onDidSelectItem = (handle) => {
                                options.onDidSelectItem(items[handle]);
                            };
                        }
                        // show items
                        proxy.$setItems(instance, pickItems);
                        return quickPickWidget.then(handle => {
                            if (typeof handle === 'number') {
                                return items[handle];
                            }
                            else if (Array.isArray(handle)) {
                                return handle.map(h => items[h]);
                            }
                            return undefined;
                        });
                    });
                }).then(undefined, err => {
                    if ((0, errors_1.isCancellationError)(err)) {
                        return undefined;
                    }
                    proxy.$setError(instance, err);
                    return Promise.reject(err);
                });
            }
            $onItemSelected(handle) {
                this._onDidSelectItem?.(handle);
            }
            // ---- input
            showInput(options, token = cancellation_1.CancellationToken.None) {
                // global validate fn used in callback below
                this._validateInput = options?.validateInput;
                return proxy.$input(options, typeof this._validateInput === 'function', token)
                    .then(undefined, err => {
                    if ((0, errors_1.isCancellationError)(err)) {
                        return undefined;
                    }
                    return Promise.reject(err);
                });
            }
            async $validateInput(input) {
                if (!this._validateInput) {
                    return;
                }
                const result = await this._validateInput(input);
                if (!result || typeof result === 'string') {
                    return result;
                }
                let severity;
                switch (result.severity) {
                    case extHostTypes_1.InputBoxValidationSeverity.Info:
                        severity = severity_1.default.Info;
                        break;
                    case extHostTypes_1.InputBoxValidationSeverity.Warning:
                        severity = severity_1.default.Warning;
                        break;
                    case extHostTypes_1.InputBoxValidationSeverity.Error:
                        severity = severity_1.default.Error;
                        break;
                    default:
                        severity = result.message ? severity_1.default.Error : severity_1.default.Ignore;
                        break;
                }
                return {
                    content: result.message,
                    severity
                };
            }
            // ---- workspace folder picker
            async showWorkspaceFolderPick(options, token = cancellation_1.CancellationToken.None) {
                const selectedFolder = await this._commands.executeCommand('_workbench.pickWorkspaceFolder', [options]);
                if (!selectedFolder) {
                    return undefined;
                }
                const workspaceFolders = await this._workspace.getWorkspaceFolders2();
                if (!workspaceFolders) {
                    return undefined;
                }
                return workspaceFolders.find(folder => folder.uri.toString() === selectedFolder.uri.toString());
            }
            // ---- QuickInput
            createQuickPick(extension) {
                const session = new ExtHostQuickPick(extension, () => this._sessions.delete(session._id));
                this._sessions.set(session._id, session);
                return session;
            }
            createInputBox(extension) {
                const session = new ExtHostInputBox(extension, () => this._sessions.delete(session._id));
                this._sessions.set(session._id, session);
                return session;
            }
            $onDidChangeValue(sessionId, value) {
                const session = this._sessions.get(sessionId);
                session?._fireDidChangeValue(value);
            }
            $onDidAccept(sessionId) {
                const session = this._sessions.get(sessionId);
                session?._fireDidAccept();
            }
            $onDidChangeActive(sessionId, handles) {
                const session = this._sessions.get(sessionId);
                if (session instanceof ExtHostQuickPick) {
                    session._fireDidChangeActive(handles);
                }
            }
            $onDidChangeSelection(sessionId, handles) {
                const session = this._sessions.get(sessionId);
                if (session instanceof ExtHostQuickPick) {
                    session._fireDidChangeSelection(handles);
                }
            }
            $onDidTriggerButton(sessionId, handle) {
                const session = this._sessions.get(sessionId);
                session?._fireDidTriggerButton(handle);
            }
            $onDidTriggerItemButton(sessionId, itemHandle, buttonHandle) {
                const session = this._sessions.get(sessionId);
                if (session instanceof ExtHostQuickPick) {
                    session._fireDidTriggerItemButton(itemHandle, buttonHandle);
                }
            }
            $onDidHide(sessionId) {
                const session = this._sessions.get(sessionId);
                session?._fireDidHide();
            }
        }
        class ExtHostQuickInput {
            static { this._nextId = 1; }
            constructor(_extensionId, _onDidDispose) {
                this._extensionId = _extensionId;
                this._onDidDispose = _onDidDispose;
                this._id = ExtHostQuickPick._nextId++;
                this._visible = false;
                this._expectingHide = false;
                this._enabled = true;
                this._busy = false;
                this._ignoreFocusOut = true;
                this._value = '';
                this._buttons = [];
                this._handlesToButtons = new Map();
                this._onDidAcceptEmitter = new event_1.Emitter();
                this._onDidChangeValueEmitter = new event_1.Emitter();
                this._onDidTriggerButtonEmitter = new event_1.Emitter();
                this._onDidHideEmitter = new event_1.Emitter();
                this._pendingUpdate = { id: this._id };
                this._disposed = false;
                this._disposables = [
                    this._onDidTriggerButtonEmitter,
                    this._onDidHideEmitter,
                    this._onDidAcceptEmitter,
                    this._onDidChangeValueEmitter
                ];
                this.onDidChangeValue = this._onDidChangeValueEmitter.event;
                this.onDidAccept = this._onDidAcceptEmitter.event;
                this.onDidTriggerButton = this._onDidTriggerButtonEmitter.event;
                this.onDidHide = this._onDidHideEmitter.event;
            }
            get title() {
                return this._title;
            }
            set title(title) {
                this._title = title;
                this.update({ title });
            }
            get step() {
                return this._steps;
            }
            set step(step) {
                this._steps = step;
                this.update({ step });
            }
            get totalSteps() {
                return this._totalSteps;
            }
            set totalSteps(totalSteps) {
                this._totalSteps = totalSteps;
                this.update({ totalSteps });
            }
            get enabled() {
                return this._enabled;
            }
            set enabled(enabled) {
                this._enabled = enabled;
                this.update({ enabled });
            }
            get busy() {
                return this._busy;
            }
            set busy(busy) {
                this._busy = busy;
                this.update({ busy });
            }
            get ignoreFocusOut() {
                return this._ignoreFocusOut;
            }
            set ignoreFocusOut(ignoreFocusOut) {
                this._ignoreFocusOut = ignoreFocusOut;
                this.update({ ignoreFocusOut });
            }
            get value() {
                return this._value;
            }
            set value(value) {
                this._value = value;
                this.update({ value });
            }
            get placeholder() {
                return this._placeholder;
            }
            set placeholder(placeholder) {
                this._placeholder = placeholder;
                this.update({ placeholder });
            }
            get buttons() {
                return this._buttons;
            }
            set buttons(buttons) {
                this._buttons = buttons.slice();
                this._handlesToButtons.clear();
                buttons.forEach((button, i) => {
                    const handle = button === extHostTypes_1.QuickInputButtons.Back ? -1 : i;
                    this._handlesToButtons.set(handle, button);
                });
                this.update({
                    buttons: buttons.map((button, i) => {
                        return {
                            ...getIconPathOrClass(button.iconPath),
                            tooltip: button.tooltip,
                            handle: button === extHostTypes_1.QuickInputButtons.Back ? -1 : i,
                        };
                    })
                });
            }
            show() {
                this._visible = true;
                this._expectingHide = true;
                this.update({ visible: true });
            }
            hide() {
                this._visible = false;
                this.update({ visible: false });
            }
            _fireDidAccept() {
                this._onDidAcceptEmitter.fire();
            }
            _fireDidChangeValue(value) {
                this._value = value;
                this._onDidChangeValueEmitter.fire(value);
            }
            _fireDidTriggerButton(handle) {
                const button = this._handlesToButtons.get(handle);
                if (button) {
                    this._onDidTriggerButtonEmitter.fire(button);
                }
            }
            _fireDidHide() {
                if (this._expectingHide) {
                    // if this._visible is true, it means that .show() was called between
                    // .hide() and .onDidHide. To ensure the correct number of onDidHide events
                    // are emitted, we set this._expectingHide to this value so that
                    // the next time .hide() is called, we can emit the event again.
                    // Example:
                    // .show() -> .hide() -> .show() -> .hide() should emit 2 onDidHide events.
                    // .show() -> .hide() -> .hide() should emit 1 onDidHide event.
                    // Fixes #135747
                    this._expectingHide = this._visible;
                    this._onDidHideEmitter.fire();
                }
            }
            dispose() {
                if (this._disposed) {
                    return;
                }
                this._disposed = true;
                this._fireDidHide();
                this._disposables = (0, lifecycle_1.dispose)(this._disposables);
                if (this._updateTimeout) {
                    clearTimeout(this._updateTimeout);
                    this._updateTimeout = undefined;
                }
                this._onDidDispose();
                proxy.$dispose(this._id);
            }
            update(properties) {
                if (this._disposed) {
                    return;
                }
                for (const key of Object.keys(properties)) {
                    const value = properties[key];
                    this._pendingUpdate[key] = value === undefined ? null : value;
                }
                if ('visible' in this._pendingUpdate) {
                    if (this._updateTimeout) {
                        clearTimeout(this._updateTimeout);
                        this._updateTimeout = undefined;
                    }
                    this.dispatchUpdate();
                }
                else if (this._visible && !this._updateTimeout) {
                    // Defer the update so that multiple changes to setters dont cause a redraw each
                    this._updateTimeout = setTimeout(() => {
                        this._updateTimeout = undefined;
                        this.dispatchUpdate();
                    }, 0);
                }
            }
            dispatchUpdate() {
                proxy.$createOrUpdate(this._pendingUpdate);
                this._pendingUpdate = { id: this._id };
            }
        }
        function getIconUris(iconPath) {
            if (iconPath instanceof extHostTypes_1.ThemeIcon) {
                return { id: iconPath.id };
            }
            const dark = getDarkIconUri(iconPath);
            const light = getLightIconUri(iconPath);
            // Tolerate strings: https://github.com/microsoft/vscode/issues/110432#issuecomment-726144556
            return {
                dark: typeof dark === 'string' ? uri_1.URI.file(dark) : dark,
                light: typeof light === 'string' ? uri_1.URI.file(light) : light
            };
        }
        function getLightIconUri(iconPath) {
            return typeof iconPath === 'object' && 'light' in iconPath ? iconPath.light : iconPath;
        }
        function getDarkIconUri(iconPath) {
            return typeof iconPath === 'object' && 'dark' in iconPath ? iconPath.dark : iconPath;
        }
        function getIconPathOrClass(icon) {
            const iconPathOrIconClass = getIconUris(icon);
            let iconPath;
            let iconClass;
            if ('id' in iconPathOrIconClass) {
                iconClass = themables_1.ThemeIcon.asClassName(iconPathOrIconClass);
            }
            else {
                iconPath = iconPathOrIconClass;
            }
            return {
                iconPath,
                iconClass
            };
        }
        class ExtHostQuickPick extends ExtHostQuickInput {
            constructor(extension, onDispose) {
                super(extension.identifier, onDispose);
                this.extension = extension;
                this._items = [];
                this._handlesToItems = new Map();
                this._itemsToHandles = new Map();
                this._canSelectMany = false;
                this._matchOnDescription = true;
                this._matchOnDetail = true;
                this._sortByLabel = true;
                this._keepScrollPosition = false;
                this._activeItems = [];
                this._onDidChangeActiveEmitter = new event_1.Emitter();
                this._selectedItems = [];
                this._onDidChangeSelectionEmitter = new event_1.Emitter();
                this._onDidTriggerItemButtonEmitter = new event_1.Emitter();
                this.onDidChangeActive = this._onDidChangeActiveEmitter.event;
                this.onDidChangeSelection = this._onDidChangeSelectionEmitter.event;
                this.onDidTriggerItemButton = this._onDidTriggerItemButtonEmitter.event;
                this._disposables.push(this._onDidChangeActiveEmitter, this._onDidChangeSelectionEmitter, this._onDidTriggerItemButtonEmitter);
                this.update({ type: 'quickPick' });
            }
            get items() {
                return this._items;
            }
            set items(items) {
                this._items = items.slice();
                this._handlesToItems.clear();
                this._itemsToHandles.clear();
                items.forEach((item, i) => {
                    this._handlesToItems.set(i, item);
                    this._itemsToHandles.set(item, i);
                });
                const allowedTooltips = (0, extensions_1.isProposedApiEnabled)(this.extension, 'quickPickItemTooltip');
                const pickItems = [];
                for (let handle = 0; handle < items.length; handle++) {
                    const item = items[handle];
                    if (item.kind === extHostTypes_1.QuickPickItemKind.Separator) {
                        pickItems.push({ type: 'separator', label: item.label });
                    }
                    else {
                        if (item.tooltip && !allowedTooltips) {
                            console.warn(`Extension '${this.extension.identifier.value}' uses a tooltip which is proposed API that is only available when running out of dev or with the following command line switch: --enable-proposed-api ${this.extension.identifier.value}`);
                        }
                        const icon = (item.iconPath) ? getIconPathOrClass(item.iconPath) : undefined;
                        pickItems.push({
                            handle,
                            label: item.label,
                            iconPath: icon?.iconPath,
                            iconClass: icon?.iconClass,
                            description: item.description,
                            detail: item.detail,
                            picked: item.picked,
                            alwaysShow: item.alwaysShow,
                            tooltip: allowedTooltips ? extHostTypeConverters_1.MarkdownString.fromStrict(item.tooltip) : undefined,
                            buttons: item.buttons?.map((button, i) => {
                                return {
                                    ...getIconPathOrClass(button.iconPath),
                                    tooltip: button.tooltip,
                                    handle: i
                                };
                            }),
                        });
                    }
                }
                this.update({
                    items: pickItems,
                });
            }
            get canSelectMany() {
                return this._canSelectMany;
            }
            set canSelectMany(canSelectMany) {
                this._canSelectMany = canSelectMany;
                this.update({ canSelectMany });
            }
            get matchOnDescription() {
                return this._matchOnDescription;
            }
            set matchOnDescription(matchOnDescription) {
                this._matchOnDescription = matchOnDescription;
                this.update({ matchOnDescription });
            }
            get matchOnDetail() {
                return this._matchOnDetail;
            }
            set matchOnDetail(matchOnDetail) {
                this._matchOnDetail = matchOnDetail;
                this.update({ matchOnDetail });
            }
            get sortByLabel() {
                return this._sortByLabel;
            }
            set sortByLabel(sortByLabel) {
                this._sortByLabel = sortByLabel;
                this.update({ sortByLabel });
            }
            get keepScrollPosition() {
                return this._keepScrollPosition;
            }
            set keepScrollPosition(keepScrollPosition) {
                this._keepScrollPosition = keepScrollPosition;
                this.update({ keepScrollPosition });
            }
            get activeItems() {
                return this._activeItems;
            }
            set activeItems(activeItems) {
                this._activeItems = activeItems.filter(item => this._itemsToHandles.has(item));
                this.update({ activeItems: this._activeItems.map(item => this._itemsToHandles.get(item)) });
            }
            get selectedItems() {
                return this._selectedItems;
            }
            set selectedItems(selectedItems) {
                this._selectedItems = selectedItems.filter(item => this._itemsToHandles.has(item));
                this.update({ selectedItems: this._selectedItems.map(item => this._itemsToHandles.get(item)) });
            }
            _fireDidChangeActive(handles) {
                const items = (0, arrays_1.coalesce)(handles.map(handle => this._handlesToItems.get(handle)));
                this._activeItems = items;
                this._onDidChangeActiveEmitter.fire(items);
            }
            _fireDidChangeSelection(handles) {
                const items = (0, arrays_1.coalesce)(handles.map(handle => this._handlesToItems.get(handle)));
                this._selectedItems = items;
                this._onDidChangeSelectionEmitter.fire(items);
            }
            _fireDidTriggerItemButton(itemHandle, buttonHandle) {
                const item = this._handlesToItems.get(itemHandle);
                if (!item || !item.buttons || !item.buttons.length) {
                    return;
                }
                const button = item.buttons[buttonHandle];
                if (button) {
                    this._onDidTriggerItemButtonEmitter.fire({
                        button,
                        item
                    });
                }
            }
        }
        class ExtHostInputBox extends ExtHostQuickInput {
            constructor(extension, onDispose) {
                super(extension.identifier, onDispose);
                this._password = false;
                this.update({ type: 'inputBox' });
            }
            get password() {
                return this._password;
            }
            set password(password) {
                this._password = password;
                this.update({ password });
            }
            get prompt() {
                return this._prompt;
            }
            set prompt(prompt) {
                this._prompt = prompt;
                this.update({ prompt });
            }
            get valueSelection() {
                return this._valueSelection;
            }
            set valueSelection(valueSelection) {
                this._valueSelection = valueSelection;
                this.update({ valueSelection });
            }
            get validationMessage() {
                return this._validationMessage;
            }
            set validationMessage(validationMessage) {
                this._validationMessage = validationMessage;
                if (!validationMessage) {
                    this.update({ validationMessage: undefined, severity: severity_1.default.Ignore });
                }
                else if (typeof validationMessage === 'string') {
                    this.update({ validationMessage, severity: severity_1.default.Error });
                }
                else {
                    this.update({ validationMessage: validationMessage.message, severity: validationMessage.severity ?? severity_1.default.Error });
                }
            }
        }
        return new ExtHostQuickOpenImpl(workspace, commands);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFF1aWNrT3Blbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFF1aWNrT3Blbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW9DaEcsd0RBbXRCQztJQW50QkQsU0FBZ0Isc0JBQXNCLENBQUMsV0FBeUIsRUFBRSxTQUFvQyxFQUFFLFFBQXlCO1FBQ2hJLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBRXBFLE1BQU0sb0JBQW9CO1lBWXpCLFlBQVksU0FBb0MsRUFBRSxRQUF5QjtnQkFKbkUsY0FBUyxHQUFHLElBQUksR0FBRyxFQUE2QixDQUFDO2dCQUVqRCxlQUFVLEdBQUcsQ0FBQyxDQUFDO2dCQUd0QixJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7WUFDM0IsQ0FBQztZQUtELGFBQWEsQ0FBQyxTQUFnQyxFQUFFLG1CQUE2QyxFQUFFLE9BQTBCLEVBQUUsUUFBMkIsZ0NBQWlCLENBQUMsSUFBSTtnQkFDM0ssbUNBQW1DO2dCQUNuQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsU0FBUyxDQUFDO2dCQUVsQyxNQUFNLFlBQVksR0FBb0IsT0FBTyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUUzRSxNQUFNLFFBQVEsR0FBRyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBRW5DLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFO29CQUM3QyxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUs7b0JBQ3JCLFdBQVcsRUFBRSxPQUFPLEVBQUUsV0FBVztvQkFDakMs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