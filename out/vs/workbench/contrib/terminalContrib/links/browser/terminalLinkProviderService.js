/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLinkProviderService = void 0;
    class TerminalLinkProviderService {
        constructor() {
            this._linkProviders = new Set();
            this._onDidAddLinkProvider = new event_1.Emitter();
            this._onDidRemoveLinkProvider = new event_1.Emitter();
        }
        get linkProviders() { return this._linkProviders; }
        get onDidAddLinkProvider() { return this._onDidAddLinkProvider.event; }
        get onDidRemoveLinkProvider() { return this._onDidRemoveLinkProvider.event; }
        registerLinkProvider(linkProvider) {
            const disposables = [];
            this._linkProviders.add(linkProvider);
            this._onDidAddLinkProvider.fire(linkProvider);
            return {
                dispose: () => {
                    for (const disposable of disposables) {
                        disposable.dispose();
                    }
                    this._linkProviders.delete(linkProvider);
                    this._onDidRemoveLinkProvider.fire(linkProvider);
                }
            };
        }
    }
    exports.TerminalLinkProviderService = TerminalLinkProviderService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rUHJvdmlkZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvYnJvd3Nlci90ZXJtaW5hbExpbmtQcm92aWRlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQWEsMkJBQTJCO1FBQXhDO1lBR1MsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBaUMsQ0FBQztZQUdqRCwwQkFBcUIsR0FBRyxJQUFJLGVBQU8sRUFBaUMsQ0FBQztZQUVyRSw2QkFBd0IsR0FBRyxJQUFJLGVBQU8sRUFBaUMsQ0FBQztRQWlCMUYsQ0FBQztRQXJCQSxJQUFJLGFBQWEsS0FBaUQsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUcvRixJQUFJLG9CQUFvQixLQUEyQyxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRTdHLElBQUksdUJBQXVCLEtBQTJDLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFbkgsb0JBQW9CLENBQUMsWUFBMkM7WUFDL0QsTUFBTSxXQUFXLEdBQWtCLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzlDLE9BQU87Z0JBQ04sT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDYixLQUFLLE1BQU0sVUFBVSxJQUFJLFdBQVcsRUFBRSxDQUFDO3dCQUN0QyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3RCLENBQUM7b0JBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ3pDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2xELENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztLQUNEO0lBekJELGtFQXlCQyJ9