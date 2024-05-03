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
define(["require", "exports", "vs/platform/quickinput/common/quickInput", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/uri"], function (require, exports, quickInput_1, extHost_protocol_1, extHostCustomers_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadQuickOpen = void 0;
    function reviveIconPathUris(iconPath) {
        iconPath.dark = uri_1.URI.revive(iconPath.dark);
        if (iconPath.light) {
            iconPath.light = uri_1.URI.revive(iconPath.light);
        }
    }
    let MainThreadQuickOpen = class MainThreadQuickOpen {
        constructor(extHostContext, quickInputService) {
            this._items = {};
            // ---- QuickInput
            this.sessions = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostQuickOpen);
            this._quickInputService = quickInputService;
        }
        dispose() {
        }
        $show(instance, options, token) {
            const contents = new Promise((resolve, reject) => {
                this._items[instance] = { resolve, reject };
            });
            options = {
                ...options,
                onDidFocus: el => {
                    if (el) {
                        this._proxy.$onItemSelected(el.handle);
                    }
                }
            };
            if (options.canPickMany) {
                return this._quickInputService.pick(contents, options, token).then(items => {
                    if (items) {
                        return items.map(item => item.handle);
                    }
                    return undefined;
                });
            }
            else {
                return this._quickInputService.pick(contents, options, token).then(item => {
                    if (item) {
                        return item.handle;
                    }
                    return undefined;
                });
            }
        }
        $setItems(instance, items) {
            if (this._items[instance]) {
                this._items[instance].resolve(items);
                delete this._items[instance];
            }
            return Promise.resolve();
        }
        $setError(instance, error) {
            if (this._items[instance]) {
                this._items[instance].reject(error);
                delete this._items[instance];
            }
            return Promise.resolve();
        }
        // ---- input
        $input(options, validateInput, token) {
            const inputOptions = Object.create(null);
            if (options) {
                inputOptions.title = options.title;
                inputOptions.password = options.password;
                inputOptions.placeHolder = options.placeHolder;
                inputOptions.valueSelection = options.valueSelection;
                inputOptions.prompt = options.prompt;
                inputOptions.value = options.value;
                inputOptions.ignoreFocusLost = options.ignoreFocusOut;
            }
            if (validateInput) {
                inputOptions.validateInput = (value) => {
                    return this._proxy.$validateInput(value);
                };
            }
            return this._quickInputService.input(inputOptions, token);
        }
        $createOrUpdate(params) {
            const sessionId = params.id;
            let session = this.sessions.get(sessionId);
            if (!session) {
                const input = params.type === 'quickPick' ? this._quickInputService.createQuickPick() : this._quickInputService.createInputBox();
                input.onDidAccept(() => {
                    this._proxy.$onDidAccept(sessionId);
                });
                input.onDidTriggerButton(button => {
                    this._proxy.$onDidTriggerButton(sessionId, button.handle);
                });
                input.onDidChangeValue(value => {
                    this._proxy.$onDidChangeValue(sessionId, value);
                });
                input.onDidHide(() => {
                    this._proxy.$onDidHide(sessionId);
                });
                if (params.type === 'quickPick') {
                    // Add extra events specific for quickpick
                    const quickpick = input;
                    quickpick.onDidChangeActive(items => {
                        this._proxy.$onDidChangeActive(sessionId, items.map(item => item.handle));
                    });
                    quickpick.onDidChangeSelection(items => {
                        this._proxy.$onDidChangeSelection(sessionId, items.map(item => item.handle));
                    });
                    quickpick.onDidTriggerItemButton((e) => {
                        this._proxy.$onDidTriggerItemButton(sessionId, e.item.handle, e.button.handle);
                    });
                }
                session = {
                    input,
                    handlesToItems: new Map()
                };
                this.sessions.set(sessionId, session);
            }
            const { input, handlesToItems } = session;
            for (const param in params) {
                if (param === 'id' || param === 'type') {
                    continue;
                }
                if (param === 'visible') {
                    if (params.visible) {
                        input.show();
                    }
                    else {
                        input.hide();
                    }
                }
                else if (param === 'items') {
                    handlesToItems.clear();
                    params[param].forEach((item) => {
                        if (item.type === 'separator') {
                            return;
                        }
                        if (item.buttons) {
                            item.buttons = item.buttons.map((button) => {
                                if (button.iconPath) {
                                    reviveIconPathUris(button.iconPath);
                                }
                                return button;
                            });
                        }
                        handlesToItems.set(item.handle, item);
                    });
                    input[param] = params[param];
                }
                else if (param === 'activeItems' || param === 'selectedItems') {
                    input[param] = params[param]
                        .filter((handle) => handlesToItems.has(handle))
                        .map((handle) => handlesToItems.get(handle));
                }
                else if (param === 'buttons') {
                    input[param] = params.buttons.map(button => {
                        if (button.handle === -1) {
                            return this._quickInputService.backButton;
                        }
                        if (button.iconPath) {
                            reviveIconPathUris(button.iconPath);
                        }
                        return button;
                    });
                }
                else {
                    input[param] = params[param];
                }
            }
            return Promise.resolve(undefined);
        }
        $dispose(sessionId) {
            const session = this.sessions.get(sessionId);
            if (session) {
                session.input.dispose();
                this.sessions.delete(sessionId);
            }
            return Promise.resolve(undefined);
        }
    };
    exports.MainThreadQuickOpen = MainThreadQuickOpen;
    exports.MainThreadQuickOpen = MainThreadQuickOpen = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadQuickOpen),
        __param(1, quickInput_1.IQuickInputService)
    ], MainThreadQuickOpen);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFF1aWNrT3Blbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRRdWlja09wZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYWhHLFNBQVMsa0JBQWtCLENBQUMsUUFBZ0Q7UUFDM0UsUUFBUSxDQUFDLElBQUksR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQyxJQUFJLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNwQixRQUFRLENBQUMsS0FBSyxHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdDLENBQUM7SUFDRixDQUFDO0lBR00sSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBbUI7UUFTL0IsWUFDQyxjQUErQixFQUNYLGlCQUFxQztZQVB6QyxXQUFNLEdBR2xCLEVBQUUsQ0FBQztZQW9GUixrQkFBa0I7WUFFVixhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQTZCLENBQUM7WUFoRnZELElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDdkUsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGlCQUFpQixDQUFDO1FBQzdDLENBQUM7UUFFTSxPQUFPO1FBQ2QsQ0FBQztRQUVELEtBQUssQ0FBQyxRQUFnQixFQUFFLE9BQTRDLEVBQUUsS0FBd0I7WUFDN0YsTUFBTSxRQUFRLEdBQUcsSUFBSSxPQUFPLENBQXFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNwRixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUs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