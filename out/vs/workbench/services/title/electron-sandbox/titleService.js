/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/electron-sandbox/parts/titlebar/titlebarPart", "vs/workbench/services/title/browser/titleService"], function (require, exports, extensions_1, titlebarPart_1, titleService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(titleService_1.ITitleService, titlebarPart_1.NativeTitleService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGl0bGVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGl0bGUvZWxlY3Ryb24tc2FuZGJveC90aXRsZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsSUFBQSw4QkFBaUIsRUFBQyw0QkFBYSxFQUFFLGlDQUFrQixrQ0FBMEIsQ0FBQyJ9