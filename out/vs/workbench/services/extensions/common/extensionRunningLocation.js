/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteRunningLocation = exports.LocalWebWorkerRunningLocation = exports.LocalProcessRunningLocation = void 0;
    class LocalProcessRunningLocation {
        constructor(affinity) {
            this.affinity = affinity;
            this.kind = 1 /* ExtensionHostKind.LocalProcess */;
        }
        equals(other) {
            return (this.kind === other.kind && this.affinity === other.affinity);
        }
        asString() {
            if (this.affinity === 0) {
                return 'LocalProcess';
            }
            return `LocalProcess${this.affinity}`;
        }
    }
    exports.LocalProcessRunningLocation = LocalProcessRunningLocation;
    class LocalWebWorkerRunningLocation {
        constructor(affinity) {
            this.affinity = affinity;
            this.kind = 2 /* ExtensionHostKind.LocalWebWorker */;
        }
        equals(other) {
            return (this.kind === other.kind && this.affinity === other.affinity);
        }
        asString() {
            if (this.affinity === 0) {
                return 'LocalWebWorker';
            }
            return `LocalWebWorker${this.affinity}`;
        }
    }
    exports.LocalWebWorkerRunningLocation = LocalWebWorkerRunningLocation;
    class RemoteRunningLocation {
        constructor() {
            this.kind = 3 /* ExtensionHostKind.Remote */;
            this.affinity = 0;
        }
        equals(other) {
            return (this.kind === other.kind);
        }
        asString() {
            return 'Remote';
        }
    }
    exports.RemoteRunningLocation = RemoteRunningLocation;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUnVubmluZ0xvY2F0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9jb21tb24vZXh0ZW5zaW9uUnVubmluZ0xvY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRyxNQUFhLDJCQUEyQjtRQUV2QyxZQUNpQixRQUFnQjtZQUFoQixhQUFRLEdBQVIsUUFBUSxDQUFRO1lBRmpCLFNBQUksMENBQWtDO1FBR2xELENBQUM7UUFDRSxNQUFNLENBQUMsS0FBK0I7WUFDNUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBQ00sUUFBUTtZQUNkLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxjQUFjLENBQUM7WUFDdkIsQ0FBQztZQUNELE9BQU8sZUFBZSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdkMsQ0FBQztLQUNEO0lBZEQsa0VBY0M7SUFFRCxNQUFhLDZCQUE2QjtRQUV6QyxZQUNpQixRQUFnQjtZQUFoQixhQUFRLEdBQVIsUUFBUSxDQUFRO1lBRmpCLFNBQUksNENBQW9DO1FBR3BELENBQUM7UUFDRSxNQUFNLENBQUMsS0FBK0I7WUFDNUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBQ00sUUFBUTtZQUNkLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxnQkFBZ0IsQ0FBQztZQUN6QixDQUFDO1lBQ0QsT0FBTyxpQkFBaUIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3pDLENBQUM7S0FDRDtJQWRELHNFQWNDO0lBRUQsTUFBYSxxQkFBcUI7UUFBbEM7WUFDaUIsU0FBSSxvQ0FBNEI7WUFDaEMsYUFBUSxHQUFHLENBQUMsQ0FBQztRQU85QixDQUFDO1FBTk8sTUFBTSxDQUFDLEtBQStCO1lBQzVDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBQ00sUUFBUTtZQUNkLE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7S0FDRDtJQVRELHNEQVNDIn0=