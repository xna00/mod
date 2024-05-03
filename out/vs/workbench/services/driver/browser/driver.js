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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/arrays", "vs/base/common/platform", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/languagePacks/common/localizedStrings", "vs/platform/log/browser/log", "vs/platform/log/common/log", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, dom_1, window_1, arrays_1, platform_1, environment_1, files_1, localizedStrings_1, log_1, log_2, platform_2, contributions_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWindowDriver = void 0;
    exports.registerWindowDriver = registerWindowDriver;
    let BrowserWindowDriver = class BrowserWindowDriver {
        constructor(fileService, environmentService, lifecycleService, logService) {
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.lifecycleService = lifecycleService;
            this.logService = logService;
        }
        async getLogs() {
            return (0, log_1.getLogs)(this.fileService, this.environmentService);
        }
        async whenWorkbenchRestored() {
            this.logService.info('[driver] Waiting for restored lifecycle phase...');
            await this.lifecycleService.when(3 /* LifecyclePhase.Restored */);
            this.logService.info('[driver] Restored lifecycle phase reached. Waiting for contributions...');
            await platform_2.Registry.as(contributions_1.Extensions.Workbench).whenRestored;
            this.logService.info('[driver] Workbench contributions created.');
        }
        async setValue(selector, text) {
            const element = window_1.mainWindow.document.querySelector(selector);
            if (!element) {
                return Promise.reject(new Error(`Element not found: ${selector}`));
            }
            const inputElement = element;
            inputElement.value = text;
            const event = new Event('input', { bubbles: true, cancelable: true });
            inputElement.dispatchEvent(event);
        }
        async isActiveElement(selector) {
            const element = window_1.mainWindow.document.querySelector(selector);
            if (element !== window_1.mainWindow.document.activeElement) {
                const chain = [];
                let el = window_1.mainWindow.document.activeElement;
                while (el) {
                    const tagName = el.tagName;
                    const id = el.id ? `#${el.id}` : '';
                    const classes = (0, arrays_1.coalesce)(el.className.split(/\s+/g).map(c => c.trim())).map(c => `.${c}`).join('');
                    chain.unshift(`${tagName}${id}${classes}`);
                    el = el.parentElement;
                }
                throw new Error(`Active element not found. Current active element is '${chain.join(' > ')}'. Looking for ${selector}`);
            }
            return true;
        }
        async getElements(selector, recursive) {
            const query = window_1.mainWindow.document.querySelectorAll(selector);
            const result = [];
            for (let i = 0; i < query.length; i++) {
                const element = query.item(i);
                result.push(this.serializeElement(element, recursive));
            }
            return result;
        }
        serializeElement(element, recursive) {
            const attributes = Object.create(null);
            for (let j = 0; j < element.attributes.length; j++) {
                const attr = element.attributes.item(j);
                if (attr) {
                    attributes[attr.name] = attr.value;
                }
            }
            const children = [];
            if (recursive) {
                for (let i = 0; i < element.children.length; i++) {
                    const child = element.children.item(i);
                    if (child) {
                        children.push(this.serializeElement(child, true));
                    }
                }
            }
            const { left, top } = (0, dom_1.getTopLeftOffset)(element);
            return {
                tagName: element.tagName,
                className: element.className,
                textContent: element.textContent || '',
                attributes,
                children,
                left,
                top
            };
        }
        async getElementXY(selector, xoffset, yoffset) {
            const offset = typeof xoffset === 'number' && typeof yoffset === 'number' ? { x: xoffset, y: yoffset } : undefined;
            return this._getElementXY(selector, offset);
        }
        async typeInEditor(selector, text) {
            const element = window_1.mainWindow.document.querySelector(selector);
            if (!element) {
                throw new Error(`Editor not found: ${selector}`);
            }
            const textarea = element;
            const start = textarea.selectionStart;
            const newStart = start + text.length;
            const value = textarea.value;
            const newValue = value.substr(0, start) + text + value.substr(start);
            textarea.value = newValue;
            textarea.setSelectionRange(newStart, newStart);
            const event = new Event('input', { 'bubbles': true, 'cancelable': true });
            textarea.dispatchEvent(event);
        }
        async getTerminalBuffer(selector) {
            const element = window_1.mainWindow.document.querySelector(selector);
            if (!element) {
                throw new Error(`Terminal not found: ${selector}`);
            }
            const xterm = element.xterm;
            if (!xterm) {
                throw new Error(`Xterm not found: ${selector}`);
            }
            const lines = [];
            for (let i = 0; i < xterm.buffer.active.length; i++) {
                lines.push(xterm.buffer.active.getLine(i).translateToString(true));
            }
            return lines;
        }
        async writeInTerminal(selector, text) {
            const element = window_1.mainWindow.document.querySelector(selector);
            if (!element) {
                throw new Error(`Element not found: ${selector}`);
            }
            const xterm = element.xterm;
            if (!xterm) {
                throw new Error(`Xterm not found: ${selector}`);
            }
            xterm._core.coreService.triggerDataEvent(text);
        }
        getLocaleInfo() {
            return Promise.resolve({
                language: platform_1.language,
                locale: platform_1.locale
            });
        }
        getLocalizedStrings() {
            return Promise.resolve({
                open: localizedStrings_1.default.open,
                close: localizedStrings_1.default.close,
                find: localizedStrings_1.default.find
            });
        }
        async _getElementXY(selector, offset) {
            const element = window_1.mainWindow.document.querySelector(selector);
            if (!element) {
                return Promise.reject(new Error(`Element not found: ${selector}`));
            }
            const { left, top } = (0, dom_1.getTopLeftOffset)(element);
            const { width, height } = (0, dom_1.getClientArea)(element);
            let x, y;
            if (offset) {
                x = left + offset.x;
                y = top + offset.y;
            }
            else {
                x = left + (width / 2);
                y = top + (height / 2);
            }
            x = Math.round(x);
            y = Math.round(y);
            return { x, y };
        }
        async exitApplication() {
            // No-op in web
        }
    };
    exports.BrowserWindowDriver = BrowserWindowDriver;
    exports.BrowserWindowDriver = BrowserWindowDriver = __decorate([
        __param(0, files_1.IFileService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, log_2.ILogService)
    ], BrowserWindowDriver);
    function registerWindowDriver(instantiationService) {
        Object.assign(window_1.mainWindow, { driver: instantiationService.createInstance(BrowserWindowDriver) });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJpdmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZHJpdmVyL2Jyb3dzZXIvZHJpdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9PaEcsb0RBRUM7SUFyTk0sSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBbUI7UUFFL0IsWUFDZ0MsV0FBeUIsRUFDbEIsa0JBQXVDLEVBQ3pDLGdCQUFtQyxFQUN6QyxVQUF1QjtZQUh0QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNsQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3pDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDekMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtRQUV0RCxDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQU87WUFDWixPQUFPLElBQUEsYUFBTyxFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELEtBQUssQ0FBQyxxQkFBcUI7WUFDMUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsa0RBQWtELENBQUMsQ0FBQztZQUN6RSxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLGlDQUF5QixDQUFDO1lBQzFELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLHlFQUF5RSxDQUFDLENBQUM7WUFDaEcsTUFBTSxtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUMsWUFBWSxDQUFDO1lBQy9GLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBZ0IsRUFBRSxJ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