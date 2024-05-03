/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/files/node/watcher/parcel/parcelWatcher", "vs/platform/files/node/watcher/nodejs/nodejsWatcher", "vs/base/common/async"], function (require, exports, lifecycle_1, event_1, parcelWatcher_1, nodejsWatcher_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UniversalWatcher = void 0;
    class UniversalWatcher extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.recursiveWatcher = this._register(new parcelWatcher_1.ParcelWatcher());
            this.nonRecursiveWatcher = this._register(new nodejsWatcher_1.NodeJSWatcher());
            this.onDidChangeFile = event_1.Event.any(this.recursiveWatcher.onDidChangeFile, this.nonRecursiveWatcher.onDidChangeFile);
            this.onDidLogMessage = event_1.Event.any(this.recursiveWatcher.onDidLogMessage, this.nonRecursiveWatcher.onDidLogMessage);
            this.onDidError = event_1.Event.any(this.recursiveWatcher.onDidError, this.nonRecursiveWatcher.onDidError);
        }
        async watch(requests) {
            await async_1.Promises.settled([
                this.recursiveWatcher.watch(requests.filter(request => request.recursive)),
                this.nonRecursiveWatcher.watch(requests.filter(request => !request.recursive))
            ]);
        }
        async setVerboseLogging(enabled) {
            await async_1.Promises.settled([
                this.recursiveWatcher.setVerboseLogging(enabled),
                this.nonRecursiveWatcher.setVerboseLogging(enabled)
            ]);
        }
        async stop() {
            await async_1.Promises.settled([
                this.recursiveWatcher.stop(),
                this.nonRecursiveWatcher.stop()
            ]);
        }
    }
    exports.UniversalWatcher = UniversalWatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvbm9kZS93YXRjaGVyL3dhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsZ0JBQWlCLFNBQVEsc0JBQVU7UUFBaEQ7O1lBRWtCLHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBYSxFQUFFLENBQUMsQ0FBQztZQUN2RCx3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWEsRUFBRSxDQUFDLENBQUM7WUFFbEUsb0JBQWUsR0FBRyxhQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzdHLG9CQUFlLEdBQUcsYUFBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUM3RyxlQUFVLEdBQUcsYUFBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQXNCeEcsQ0FBQztRQXBCQSxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQWtDO1lBQzdDLE1BQU0sZ0JBQVEsQ0FBQyxPQUFPLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDMUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDOUUsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxPQUFnQjtZQUN2QyxNQUFNLGdCQUFRLENBQUMsT0FBTyxDQUFDO2dCQUN0QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDO2dCQUNoRCxJQUFJLENBQUMsbUJBQW1CLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDO2FBQ25ELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSTtZQUNULE1BQU0sZ0JBQVEsQ0FBQyxPQUFPLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUU7Z0JBQzVCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUU7YUFDL0IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBN0JELDRDQTZCQyJ9