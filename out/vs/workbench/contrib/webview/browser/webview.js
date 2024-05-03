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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/resources", "vs/base/common/uuid", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/common/memento"], function (require, exports, arrays_1, resources_1, uuid_1, contextkey_1, instantiation_1, storage_1, memento_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionKeyedWebviewOriginStore = exports.WebviewOriginStore = exports.WebviewContentPurpose = exports.IWebviewService = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_ENABLED = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE = void 0;
    exports.areWebviewContentOptionsEqual = areWebviewContentOptionsEqual;
    /**
     * Set when the find widget in a webview in a webview is visible.
     */
    exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE = new contextkey_1.RawContextKey('webviewFindWidgetVisible', false);
    /**
     * Set when the find widget in a webview is focused.
     */
    exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED = new contextkey_1.RawContextKey('webviewFindWidgetFocused', false);
    /**
     * Set when the find widget in a webview is enabled in a webview
     */
    exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_ENABLED = new contextkey_1.RawContextKey('webviewFindWidgetEnabled', false);
    exports.IWebviewService = (0, instantiation_1.createDecorator)('webviewService');
    var WebviewContentPurpose;
    (function (WebviewContentPurpose) {
        WebviewContentPurpose["NotebookRenderer"] = "notebookRenderer";
        WebviewContentPurpose["CustomEditor"] = "customEditor";
        WebviewContentPurpose["WebviewView"] = "webviewView";
    })(WebviewContentPurpose || (exports.WebviewContentPurpose = WebviewContentPurpose = {}));
    /**
     * Check if two {@link WebviewContentOptions} are equal.
     */
    function areWebviewContentOptionsEqual(a, b) {
        return (a.allowMultipleAPIAcquire === b.allowMultipleAPIAcquire
            && a.allowScripts === b.allowScripts
            && a.allowForms === b.allowForms
            && (0, arrays_1.equals)(a.localResourceRoots, b.localResourceRoots, resources_1.isEqual)
            && (0, arrays_1.equals)(a.portMapping, b.portMapping, (a, b) => a.extensionHostPort === b.extensionHostPort && a.webviewPort === b.webviewPort)
            && areEnableCommandUrisEqual(a, b));
    }
    function areEnableCommandUrisEqual(a, b) {
        if (a.enableCommandUris === b.enableCommandUris) {
            return true;
        }
        if (Array.isArray(a.enableCommandUris) && Array.isArray(b.enableCommandUris)) {
            return (0, arrays_1.equals)(a.enableCommandUris, b.enableCommandUris);
        }
        return false;
    }
    /**
     * Stores the unique origins for a webview.
     *
     * These are randomly generated
     */
    let WebviewOriginStore = class WebviewOriginStore {
        constructor(rootStorageKey, storageService) {
            this._memento = new memento_1.Memento(rootStorageKey, storageService);
            this._state = this._memento.getMemento(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        getOrigin(viewType, additionalKey) {
            const key = this._getKey(viewType, additionalKey);
            const existing = this._state[key];
            if (existing && typeof existing === 'string') {
                return existing;
            }
            const newOrigin = (0, uuid_1.generateUuid)();
            this._state[key] = newOrigin;
            this._memento.saveMemento();
            return newOrigin;
        }
        _getKey(viewType, additionalKey) {
            return JSON.stringify({ viewType, key: additionalKey });
        }
    };
    exports.WebviewOriginStore = WebviewOriginStore;
    exports.WebviewOriginStore = WebviewOriginStore = __decorate([
        __param(1, storage_1.IStorageService)
    ], WebviewOriginStore);
    /**
     * Stores the unique origins for a webview.
     *
     * These are randomly generated, but keyed on extension and webview viewType.
     */
    let ExtensionKeyedWebviewOriginStore = class ExtensionKeyedWebviewOriginStore {
        constructor(rootStorageKey, storageService) {
            this._store = new WebviewOriginStore(rootStorageKey, storageService);
        }
        getOrigin(viewType, extId) {
            return this._store.getOrigin(viewType, extId.value);
        }
    };
    exports.ExtensionKeyedWebviewOriginStore = ExtensionKeyedWebviewOriginStore;
    exports.ExtensionKeyedWebviewOriginStore = ExtensionKeyedWebviewOriginStore = __decorate([
        __param(1, storage_1.IStorageService)
    ], ExtensionKeyedWebviewOriginStore);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2Vidmlldy9icm93c2VyL3dlYnZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOEloRyxzRUFTQztJQXJJRDs7T0FFRztJQUNVLFFBQUEsOENBQThDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRTVIOztPQUVHO0lBQ1UsUUFBQSw4Q0FBOEMsR0FBRyxJQUFJLDBCQUFhLENBQVUsMEJBQTBCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFNUg7O09BRUc7SUFDVSxRQUFBLDhDQUE4QyxHQUFHLElBQUksMEJBQWEsQ0FBVSwwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUUvRyxRQUFBLGVBQWUsR0FBRyxJQUFBLCtCQUFlLEVBQWtCLGdCQUFnQixDQUFDLENBQUM7SUE4Q2xGLElBQWtCLHFCQUlqQjtJQUpELFdBQWtCLHFCQUFxQjtRQUN0Qyw4REFBcUMsQ0FBQTtRQUNyQyxzREFBNkIsQ0FBQTtRQUM3QixvREFBMkIsQ0FBQTtJQUM1QixDQUFDLEVBSmlCLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBSXRDO0lBd0REOztPQUVHO0lBQ0gsU0FBZ0IsNkJBQTZCLENBQUMsQ0FBd0IsRUFBRSxDQUF3QjtRQUMvRixPQUFPLENBQ04sQ0FBQyxDQUFDLHVCQUF1QixLQUFLLENBQUMsQ0FBQyx1QkFBdUI7ZUFDcEQsQ0FBQyxDQUFDLFlBQVksS0FBSyxDQUFDLENBQUMsWUFBWTtlQUNqQyxDQUFDLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxVQUFVO2VBQzdCLElBQUEsZUFBTSxFQUFDLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsa0JBQWtC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