/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalCapabilityStoreMultiplexer = exports.TerminalCapabilityStore = void 0;
    class TerminalCapabilityStore extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._map = new Map();
            this._onDidRemoveCapabilityType = this._register(new event_1.Emitter());
            this.onDidRemoveCapabilityType = this._onDidRemoveCapabilityType.event;
            this._onDidAddCapabilityType = this._register(new event_1.Emitter());
            this.onDidAddCapabilityType = this._onDidAddCapabilityType.event;
            this._onDidRemoveCapability = this._register(new event_1.Emitter());
            this.onDidRemoveCapability = this._onDidRemoveCapability.event;
            this._onDidAddCapability = this._register(new event_1.Emitter());
            this.onDidAddCapability = this._onDidAddCapability.event;
        }
        get items() {
            return this._map.keys();
        }
        add(capability, impl) {
            this._map.set(capability, impl);
            this._onDidAddCapabilityType.fire(capability);
            this._onDidAddCapability.fire({ id: capability, capability: impl });
        }
        get(capability) {
            // HACK: This isn't totally safe since the Map key and value are not connected
            return this._map.get(capability);
        }
        remove(capability) {
            const impl = this._map.get(capability);
            if (!impl) {
                return;
            }
            this._map.delete(capability);
            this._onDidRemoveCapabilityType.fire(capability);
            this._onDidAddCapability.fire({ id: capability, capability: impl });
        }
        has(capability) {
            return this._map.has(capability);
        }
    }
    exports.TerminalCapabilityStore = TerminalCapabilityStore;
    class TerminalCapabilityStoreMultiplexer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._stores = [];
            this._onDidRemoveCapabilityType = this._register(new event_1.Emitter());
            this.onDidRemoveCapabilityType = this._onDidRemoveCapabilityType.event;
            this._onDidAddCapabilityType = this._register(new event_1.Emitter());
            this.onDidAddCapabilityType = this._onDidAddCapabilityType.event;
            this._onDidRemoveCapability = this._register(new event_1.Emitter());
            this.onDidRemoveCapability = this._onDidRemoveCapability.event;
            this._onDidAddCapability = this._register(new event_1.Emitter());
            this.onDidAddCapability = this._onDidAddCapability.event;
        }
        get items() {
            return this._items();
        }
        *_items() {
            for (const store of this._stores) {
                for (const c of store.items) {
                    yield c;
                }
            }
        }
        has(capability) {
            for (const store of this._stores) {
                for (const c of store.items) {
                    if (c === capability) {
                        return true;
                    }
                }
            }
            return false;
        }
        get(capability) {
            for (const store of this._stores) {
                const c = store.get(capability);
                if (c) {
                    return c;
                }
            }
            return undefined;
        }
        add(store) {
            this._stores.push(store);
            for (const capability of store.items) {
                this._onDidAddCapabilityType.fire(capability);
                this._onDidAddCapability.fire({ id: capability, capability: store.get(capability) });
            }
            this._register(store.onDidAddCapabilityType(e => this._onDidAddCapabilityType.fire(e)));
            this._register(store.onDidAddCapability(e => this._onDidAddCapability.fire(e)));
            this._register(store.onDidRemoveCapabilityType(e => this._onDidRemoveCapabilityType.fire(e)));
            this._register(store.onDidRemoveCapability(e => this._onDidRemoveCapability.fire(e)));
        }
    }
    exports.TerminalCapabilityStoreMultiplexer = TerminalCapabilityStoreMultiplexer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDYXBhYmlsaXR5U3RvcmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL2NvbW1vbi9jYXBhYmlsaXRpZXMvdGVybWluYWxDYXBhYmlsaXR5U3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsdUJBQXdCLFNBQVEsc0JBQVU7UUFBdkQ7O1lBQ1MsU0FBSSxHQUEwRCxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBRS9ELCtCQUEwQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXNCLENBQUMsQ0FBQztZQUN2Riw4QkFBeUIsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDO1lBQzFELDRCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXNCLENBQUMsQ0FBQztZQUNwRiwyQkFBc0IsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1lBRXBELDJCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXNDLENBQUMsQ0FBQztZQUNuRywwQkFBcUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1lBQ2xELHdCQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXNDLENBQUMsQ0FBQztZQUNoRyx1QkFBa0IsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDO1FBOEI5RCxDQUFDO1FBNUJBLElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBRUQsR0FBRyxDQUErQixVQUFhLEVBQUUsSUFBbUM7WUFDbkYsSUFBSSxD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