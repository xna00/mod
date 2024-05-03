/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createInstanceCapabilityEventMultiplexer = createInstanceCapabilityEventMultiplexer;
    function createInstanceCapabilityEventMultiplexer(currentInstances, onAddInstance, onRemoveInstance, capabilityId, getEvent) {
        const store = new lifecycle_1.DisposableStore();
        const multiplexer = store.add(new event_1.EventMultiplexer());
        const capabilityListeners = store.add(new lifecycle_1.DisposableMap());
        function addCapability(instance, capability) {
            const listener = multiplexer.add(event_1.Event.map(getEvent(capability), data => ({ instance, data })));
            capabilityListeners.set(capability, listener);
        }
        // Existing capabilities
        for (const instance of currentInstances) {
            const capability = instance.capabilities.get(capabilityId);
            if (capability) {
                addCapability(instance, capability);
            }
        }
        // Added capabilities
        const addCapabilityMultiplexer = store.add(new event_1.DynamicListEventMultiplexer(currentInstances, onAddInstance, onRemoveInstance, instance => event_1.Event.map(instance.capabilities.onDidAddCapability, changeEvent => ({ instance, changeEvent }))));
        store.add(addCapabilityMultiplexer.event(e => {
            if (e.changeEvent.id === capabilityId) {
                addCapability(e.instance, e.changeEvent.capability);
            }
        }));
        // Removed capabilities
        const removeCapabilityMultiplexer = store.add(new event_1.DynamicListEventMultiplexer(currentInstances, onAddInstance, onRemoveInstance, instance => instance.capabilities.onDidRemoveCapability));
        store.add(removeCapabilityMultiplexer.event(e => {
            if (e.id === capabilityId) {
                capabilityListeners.deleteAndDispose(e.capability);
            }
        }));
        return {
            dispose: () => store.dispose(),
            event: multiplexer.event
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFdmVudHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxFdmVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsNEZBc0RDO0lBdERELFNBQWdCLHdDQUF3QyxDQUN2RCxnQkFBcUMsRUFDckMsYUFBdUMsRUFDdkMsZ0JBQTBDLEVBQzFDLFlBQWUsRUFDZixRQUFpRTtRQUVqRSxNQUFNLEtBQUssR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUNwQyxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksd0JBQWdCLEVBQTRDLENBQUMsQ0FBQztRQUNoRyxNQUFNLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSx5QkFBYSxFQUE4QyxDQUFDLENBQUM7UUFFdkcsU0FBUyxhQUFhLENBQUMsUUFBMkIsRUFBRSxVQUF5QztZQUM1RixNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCx3QkFBd0I7UUFDeEIsS0FBSyxNQUFNLFFBQVEsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzNELElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLGFBQWEsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7UUFFRCxxQkFBcUI7UUFDckIsTUFBTSx3QkFBd0IsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksbUNBQTJCLENBQ3pFLGdCQUFnQixFQUNoQixhQUFhLEVBQ2IsZ0JBQWdCLEVBQ2hCLFFBQVEsQ0FBQyxFQUFFLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLGtCQUFrQixFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQzNHLENBQUMsQ0FBQztRQUNILEtBQUssQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzVDLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLEtBQUssWUFBWSxFQUFFLENBQUM7Z0JBQ3ZDLGFBQWEsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckQsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFSix1QkFBdUI7UUFDdkIsTUFBTSwyQkFBMkIsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksbUNBQTJCLENBQzVFLGdCQUFnQixFQUNoQixhQUFhLEVBQ2IsZ0JBQWdCLEVBQ2hCLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FDdkQsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDL0MsSUFBSSxDQUFDLENBQUMsRUFBRSxLQUFLLFlBQVksRUFBRSxDQUFDO2dCQUMzQixtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDcEQsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFSixPQUFPO1lBQ04sT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDOUIsS0FBSyxFQUFFLFdBQVcsQ0FBQyxLQUFLO1NBQ3hCLENBQUM7SUFDSCxDQUFDIn0=