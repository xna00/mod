/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/common/watcher", "vs/platform/files/node/watcher/nodejs/nodejsWatcher"], function (require, exports, watcher_1, nodejsWatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeJSWatcherClient = void 0;
    class NodeJSWatcherClient extends watcher_1.AbstractNonRecursiveWatcherClient {
        constructor(onFileChanges, onLogMessage, verboseLogging) {
            super(onFileChanges, onLogMessage, verboseLogging);
            this.init();
        }
        createWatcher(disposables) {
            return disposables.add(new nodejsWatcher_1.NodeJSWatcher());
        }
    }
    exports.NodeJSWatcherClient = NodeJSWatcherClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZWpzQ2xpZW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9maWxlcy9ub2RlL3dhdGNoZXIvbm9kZWpzL25vZGVqc0NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSxtQkFBb0IsU0FBUSwyQ0FBaUM7UUFFekUsWUFDQyxhQUErQyxFQUMvQyxZQUF3QyxFQUN4QyxjQUF1QjtZQUV2QixLQUFLLENBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztZQUVuRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDYixDQUFDO1FBRWtCLGFBQWEsQ0FBQyxXQUE0QjtZQUM1RCxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw2QkFBYSxFQUFFLENBQWdDLENBQUM7UUFDNUUsQ0FBQztLQUNEO0lBZkQsa0RBZUMifQ==