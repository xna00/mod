/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageClient = exports.WorkspaceStorageDatabaseClient = exports.ProfileStorageDatabaseClient = exports.ApplicationStorageDatabaseClient = void 0;
    class BaseStorageDatabaseClient extends lifecycle_1.Disposable {
        constructor(channel, profile, workspace) {
            super();
            this.channel = channel;
            this.profile = profile;
            this.workspace = workspace;
        }
        async getItems() {
            const serializableRequest = { profile: this.profile, workspace: this.workspace };
            const items = await this.channel.call('getItems', serializableRequest);
            return new Map(items);
        }
        updateItems(request) {
            const serializableRequest = { profile: this.profile, workspace: this.workspace };
            if (request.insert) {
                serializableRequest.insert = Array.from(request.insert.entries());
            }
            if (request.delete) {
                serializableRequest.delete = Array.from(request.delete.values());
            }
            return this.channel.call('updateItems', serializableRequest);
        }
        optimize() {
            const serializableRequest = { profile: this.profile, workspace: this.workspace };
            return this.channel.call('optimize', serializableRequest);
        }
    }
    class BaseProfileAwareStorageDatabaseClient extends BaseStorageDatabaseClient {
        constructor(channel, profile) {
            super(channel, profile, undefined);
            this._onDidChangeItemsExternal = this._register(new event_1.Emitter());
            this.onDidChangeItemsExternal = this._onDidChangeItemsExternal.event;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.channel.listen('onDidChangeStorage', { profile: this.profile })((e) => this.onDidChangeStorage(e)));
        }
        onDidChangeStorage(e) {
            if (Array.isArray(e.changed) || Array.isArray(e.deleted)) {
                this._onDidChangeItemsExternal.fire({
                    changed: e.changed ? new Map(e.changed) : undefined,
                    deleted: e.deleted ? new Set(e.deleted) : undefined
                });
            }
        }
    }
    class ApplicationStorageDatabaseClient extends BaseProfileAwareStorageDatabaseClient {
        constructor(channel) {
            super(channel, undefined);
        }
        async close() {
            // The application storage database is shared across all instances so
            // we do not close it from the window. However we dispose the
            // listener for external changes because we no longer interested in it.
            this.dispose();
        }
    }
    exports.ApplicationStorageDatabaseClient = ApplicationStorageDatabaseClient;
    class ProfileStorageDatabaseClient extends BaseProfileAwareStorageDatabaseClient {
        constructor(channel, profile) {
            super(channel, profile);
        }
        async close() {
            // The profile storage database is shared across all instances of
            // the same profile so we do not close it from the window.
            // However we dispose the listener for external changes because
            // we no longer interested in it.
            this.dispose();
        }
    }
    exports.ProfileStorageDatabaseClient = ProfileStorageDatabaseClient;
    class WorkspaceStorageDatabaseClient extends BaseStorageDatabaseClient {
        constructor(channel, workspace) {
            super(channel, undefined, workspace);
            this.onDidChangeItemsExternal = event_1.Event.None; // unsupported for workspace storage because we only ever write from one window
        }
        async close() {
            // The workspace storage database is only used in this instance
            // but we do not need to close it from here, the main process
            // can take care of that.
            this.dispose();
        }
    }
    exports.WorkspaceStorageDatabaseClient = WorkspaceStorageDatabaseClient;
    class StorageClient {
        constructor(channel) {
            this.channel = channel;
        }
        isUsed(path) {
            const serializableRequest = { payload: path, profile: undefined, workspace: undefined };
            return this.channel.call('isUsed', serializableRequest);
        }
    }
    exports.StorageClient = StorageClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZUlwYy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vc3RvcmFnZS9jb21tb24vc3RvcmFnZUlwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE2Q2hHLE1BQWUseUJBQTBCLFNBQVEsc0JBQVU7UUFJMUQsWUFDVyxPQUFpQixFQUNqQixPQUE2QyxFQUM3QyxTQUE4QztZQUV4RCxLQUFLLEVBQUUsQ0FBQztZQUpFLFlBQU8sR0FBUCxPQUFPLENBQVU7WUFDakIsWUFBTyxHQUFQLE9BQU8sQ0FBc0M7WUFDN0MsY0FBUyxHQUFULFNBQVMsQ0FBcUM7UUFHekQsQ0FBQztRQUVELEtBQUssQ0FBQyxRQUFRO1lBQ2IsTUFBTSxtQkFBbUIsR0FBb0MsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2xILE1BQU0sS0FBSyxHQUFXLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFFL0UsT0FBTyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QixDQUFDO1FBRUQsV0FBVyxDQUFDLE9BQXVCO1lBQ2xDLE1BQU0sbUJBQW1CLEdBQStCLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUU3RyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDcEIsbUJBQW1CLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLENBQUM7WUFFRCxJQUFJLE9BQU8s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