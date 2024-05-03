/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteSocketFactoryService = exports.IRemoteSocketFactoryService = void 0;
    exports.IRemoteSocketFactoryService = (0, instantiation_1.createDecorator)('remoteSocketFactoryService');
    class RemoteSocketFactoryService {
        constructor() {
            this.factories = {};
        }
        register(type, factory) {
            this.factories[type] ??= [];
            this.factories[type].push(factory);
            return (0, lifecycle_1.toDisposable)(() => {
                const idx = this.factories[type]?.indexOf(factory);
                if (typeof idx === 'number' && idx >= 0) {
                    this.factories[type]?.splice(idx, 1);
                }
            });
        }
        getSocketFactory(messagePassing) {
            const factories = (this.factories[messagePassing.type] || []);
            return factories.find(factory => factory.supports(messagePassing));
        }
        connect(connectTo, path, query, debugLabel) {
            const socketFactory = this.getSocketFactory(connectTo);
            if (!socketFactory) {
                throw new Error(`No socket factory found for ${connectTo}`);
            }
            return socketFactory.connect(connectTo, path, query, debugLabel);
        }
    }
    exports.RemoteSocketFactoryService = RemoteSocketFactoryService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlU29ja2V0RmFjdG9yeVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlbW90ZS9jb21tb24vcmVtb3RlU29ja2V0RmFjdG9yeVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT25GLFFBQUEsMkJBQTJCLEdBQUcsSUFBQSwrQkFBZSxFQUE4Qiw0QkFBNEIsQ0FBQyxDQUFDO0lBcUJ0SCxNQUFhLDBCQUEwQjtRQUF2QztZQUdrQixjQUFTLEdBQTBELEVBQUUsQ0FBQztRQXlCeEYsQ0FBQztRQXZCTyxRQUFRLENBQWlDLElBQU8sRUFBRSxPQUEwQjtZQUNsRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwQyxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3pDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLGdCQUFnQixDQUFpQyxjQUF5QztZQUNqRyxNQUFNLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBd0IsQ0FBQztZQUNyRixPQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUVNLE9BQU8sQ0FBQyxTQUEyQixFQUFFLElBQVksRUFBRSxLQUFhLEVBQUUsVUFBa0I7WUFDMUYsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQywrQkFBK0IsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUM3RCxDQUFDO1lBQ0QsT0FBTyxhQUFhLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7S0FDRDtJQTVCRCxnRUE0QkMifQ==