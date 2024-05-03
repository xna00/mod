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
define(["require", "exports", "vs/platform/clipboard/common/clipboardService", "vs/base/common/uri", "vs/base/common/platform", "vs/platform/instantiation/common/extensions", "vs/platform/native/common/native", "vs/base/common/buffer"], function (require, exports, clipboardService_1, uri_1, platform_1, extensions_1, native_1, buffer_1) {
    "use strict";
    var NativeClipboardService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeClipboardService = void 0;
    let NativeClipboardService = class NativeClipboardService {
        static { NativeClipboardService_1 = this; }
        static { this.FILE_FORMAT = 'code/file-list'; } // Clipboard format for files
        constructor(nativeHostService) {
            this.nativeHostService = nativeHostService;
        }
        async writeText(text, type) {
            return this.nativeHostService.writeClipboardText(text, type);
        }
        async readText(type) {
            return this.nativeHostService.readClipboardText(type);
        }
        async readFindText() {
            if (platform_1.isMacintosh) {
                return this.nativeHostService.readClipboardFindText();
            }
            return '';
        }
        async writeFindText(text) {
            if (platform_1.isMacintosh) {
                return this.nativeHostService.writeClipboardFindText(text);
            }
        }
        async writeResources(resources) {
            if (resources.length) {
                return this.nativeHostService.writeClipboardBuffer(NativeClipboardService_1.FILE_FORMAT, this.resourcesToBuffer(resources));
            }
        }
        async readResources() {
            return this.bufferToResources(await this.nativeHostService.readClipboardBuffer(NativeClipboardService_1.FILE_FORMAT));
        }
        async hasResources() {
            return this.nativeHostService.hasClipboard(NativeClipboardService_1.FILE_FORMAT);
        }
        resourcesToBuffer(resources) {
            return buffer_1.VSBuffer.fromString(resources.map(r => r.toString()).join('\n'));
        }
        bufferToResources(buffer) {
            if (!buffer) {
                return [];
            }
            const bufferValue = buffer.toString();
            if (!bufferValue) {
                return [];
            }
            try {
                return bufferValue.split('\n').map(f => uri_1.URI.parse(f));
            }
            catch (error) {
                return []; // do not trust clipboard data
            }
        }
    };
    exports.NativeClipboardService = NativeClipboardService;
    exports.NativeClipboardService = NativeClipboardService = NativeClipboardService_1 = __decorate([
        __param(0, native_1.INativeHostService)
    ], NativeClipboardService);
    (0, extensions_1.registerSingleton)(clipboardService_1.IClipboardService, NativeClipboardService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpcGJvYXJkU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2NsaXBib2FyZC9lbGVjdHJvbi1zYW5kYm94L2NsaXBib2FyZFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUFzQjs7aUJBRVYsZ0JBQVcsR0FBRyxnQkFBZ0IsQUFBbkIsQ0FBb0IsR0FBQyw2QkFBNkI7UUFJckYsWUFDc0MsaUJBQXFDO1lBQXJDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7UUFDdkUsQ0FBQztRQUVMLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBWSxFQUFFLElBQWdDO1lBQzdELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFnQztZQUM5QyxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRUQsS0FBSyxDQUFDLFlBQVk7WUFDakIsSUFBSSxzQkFBVyxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDdkQsQ0FBQztZQUVELE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBWTtZQUMvQixJQUFJLHNCQUFXLEVBQUUsQ0FBQztnQkFDakIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUQsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQWdCO1lBQ3BDLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN0QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBc0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDM0gsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYTtZQUNsQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyx3QkFBc0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ3JILENBQUM7UUFFRCxLQUFLLENBQUMsWUFBWTtZQUNqQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsd0JBQXNCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVPLGlCQUFpQixDQUFDLFNBQWdCO1lBQ3pDLE9BQU8saUJBQVEsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxNQUFnQjtZQUN6QyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsSUFBSSxDQUFDO2dCQUNKLE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkQsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sRUFBRSxDQUFDLENBQUMsOEJBQThCO1lBQzFDLENBQUM7UUFDRixDQUFDOztJQWpFVyx3REFBc0I7cUNBQXRCLHNCQUFzQjtRQU9oQyxXQUFBLDJCQUFrQixDQUFBO09BUFIsc0JBQXNCLENBa0VsQztJQUVELElBQUEsOEJBQWlCLEVBQUMsb0NBQWlCLEVBQUUsc0JBQXNCLG9DQUE0QixDQUFDIn0=