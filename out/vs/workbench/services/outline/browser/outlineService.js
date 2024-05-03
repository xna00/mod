/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/platform/instantiation/common/extensions", "vs/workbench/services/outline/browser/outline", "vs/base/common/event"], function (require, exports, lifecycle_1, linkedList_1, extensions_1, outline_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OutlineService {
        constructor() {
            this._factories = new linkedList_1.LinkedList();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        canCreateOutline(pane) {
            for (const factory of this._factories) {
                if (factory.matches(pane)) {
                    return true;
                }
            }
            return false;
        }
        async createOutline(pane, target, token) {
            for (const factory of this._factories) {
                if (factory.matches(pane)) {
                    return await factory.createOutline(pane, target, token);
                }
            }
            return undefined;
        }
        registerOutlineCreator(creator) {
            const rm = this._factories.push(creator);
            this._onDidChange.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                rm();
                this._onDidChange.fire();
            });
        }
    }
    (0, extensions_1.registerSingleton)(outline_1.IOutlineService, OutlineService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9vdXRsaW5lL2Jyb3dzZXIvb3V0bGluZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsTUFBTSxjQUFjO1FBQXBCO1lBSWtCLGVBQVUsR0FBRyxJQUFJLHVCQUFVLEVBQTZCLENBQUM7WUFFekQsaUJBQVksR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQzNDLGdCQUFXLEdBQWdCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBNEI3RCxDQUFDO1FBMUJBLGdCQUFnQixDQUFDLElBQWlCO1lBQ2pDLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN2QyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDM0IsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYSxDQUFDLElBQWlCLEVBQUUsTUFBcUIsRUFBRSxLQUF3QjtZQUNyRixLQUFLLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDdkMsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQzNCLE9BQU8sTUFBTSxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3pELENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELHNCQUFzQixDQUFDLE9BQWtDO1lBQ3hELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDekIsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN4QixFQUFFLEVBQUUsQ0FBQztnQkFDTCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzFCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBR0QsSUFBQSw4QkFBaUIsRUFBQyx5QkFBZSxFQUFFLGNBQWMsb0NBQTRCLENBQUMifQ==