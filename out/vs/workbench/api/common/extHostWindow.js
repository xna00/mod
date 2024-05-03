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
define(["require", "exports", "vs/base/common/event", "./extHost.protocol", "vs/base/common/uri", "vs/base/common/network", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, event_1, extHost_protocol_1, uri_1, network_1, strings_1, instantiation_1, extHostRpcService_1, extensions_1) {
    "use strict";
    var ExtHostWindow_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostWindow = exports.ExtHostWindow = void 0;
    let ExtHostWindow = class ExtHostWindow {
        static { ExtHostWindow_1 = this; }
        static { this.InitialState = {
            focused: true,
            active: true,
        }; }
        getState(extension) {
            // todo@connor4312: this can be changed to just return this._state after proposed api is finalized
            const state = this._state;
            return {
                get focused() {
                    return state.focused;
                },
                get active() {
                    (0, extensions_1.checkProposedApiEnabled)(extension, 'windowActivity');
                    return state.active;
                },
            };
        }
        constructor(extHostRpc) {
            this._onDidChangeWindowState = new event_1.Emitter();
            this.onDidChangeWindowState = this._onDidChangeWindowState.event;
            this._state = ExtHostWindow_1.InitialState;
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadWindow);
            this._proxy.$getInitialState().then(({ isFocused, isActive }) => {
                this.onDidChangeWindowProperty('focused', isFocused);
                this.onDidChangeWindowProperty('active', isActive);
            });
        }
        $onDidChangeWindowFocus(value) {
            this.onDidChangeWindowProperty('focused', value);
        }
        $onDidChangeWindowActive(value) {
            this.onDidChangeWindowProperty('active', value);
        }
        onDidChangeWindowProperty(property, value) {
            if (value === this._state[property]) {
                return;
            }
            this._state = { ...this._state, [property]: value };
            this._onDidChangeWindowState.fire(this._state);
        }
        openUri(stringOrUri, options) {
            let uriAsString;
            if (typeof stringOrUri === 'string') {
                uriAsString = stringOrUri;
                try {
                    stringOrUri = uri_1.URI.parse(stringOrUri);
                }
                catch (e) {
                    return Promise.reject(`Invalid uri - '${stringOrUri}'`);
                }
            }
            if ((0, strings_1.isFalsyOrWhitespace)(stringOrUri.scheme)) {
                return Promise.reject('Invalid scheme - cannot be empty');
            }
            else if (stringOrUri.scheme === network_1.Schemas.command) {
                return Promise.reject(`Invalid scheme '${stringOrUri.scheme}'`);
            }
            return this._proxy.$openUri(stringOrUri, uriAsString, options);
        }
        async asExternalUri(uri, options) {
            if ((0, strings_1.isFalsyOrWhitespace)(uri.scheme)) {
                return Promise.reject('Invalid scheme - cannot be empty');
            }
            const result = await this._proxy.$asExternalUri(uri, options);
            return uri_1.URI.from(result);
        }
    };
    exports.ExtHostWindow = ExtHostWindow;
    exports.ExtHostWindow = ExtHostWindow = ExtHostWindow_1 = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostWindow);
    exports.IExtHostWindow = (0, instantiation_1.createDecorator)('IExtHostWindow');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFdpbmRvdy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFdpbmRvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWE7O2lCQUVWLGlCQUFZLEdBQWdCO1lBQzFDLE9BQU8sRUFBRSxJQUFJO1lBQ2IsTUFBTSxFQUFFLElBQUk7U0FDWixBQUgwQixDQUd6QjtRQVNGLFFBQVEsQ0FBQyxTQUFpRDtZQUN6RCxrR0FBa0c7WUFDbEcsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUUxQixPQUFPO2dCQUNOLElBQUksT0FBTztvQkFDVixPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUM7Z0JBQ3RCLENBQUM7Z0JBQ0QsSUFBSSxNQUFNO29CQUNULElBQUEsb0NBQXVCLEVBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7b0JBQ3JELE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQztnQkFDckIsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDO1FBRUQsWUFBZ0MsVUFBOEI7WUFwQjdDLDRCQUF1QixHQUFHLElBQUksZUFBTyxFQUFlLENBQUM7WUFDN0QsMkJBQXNCLEdBQXVCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUM7WUFFakYsV0FBTSxHQUFHLGVBQWEsQ0FBQyxZQUFZLENBQUM7WUFrQjNDLElBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFB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