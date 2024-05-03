/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./descriptors"], function (require, exports, descriptors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InstantiationType = void 0;
    exports.registerSingleton = registerSingleton;
    exports.getSingletonServiceDescriptors = getSingletonServiceDescriptors;
    const _registry = [];
    var InstantiationType;
    (function (InstantiationType) {
        /**
         * Instantiate this service as soon as a consumer depends on it. _Note_ that this
         * is more costly as some upfront work is done that is likely not needed
         */
        InstantiationType[InstantiationType["Eager"] = 0] = "Eager";
        /**
         * Instantiate this service as soon as a consumer uses it. This is the _better_
         * way of registering a service.
         */
        InstantiationType[InstantiationType["Delayed"] = 1] = "Delayed";
    })(InstantiationType || (exports.InstantiationType = InstantiationType = {}));
    function registerSingleton(id, ctorOrDescriptor, supportsDelayedInstantiation) {
        if (!(ctorOrDescriptor instanceof descriptors_1.SyncDescriptor)) {
            ctorOrDescriptor = new descriptors_1.SyncDescriptor(ctorOrDescriptor, [], Boolean(supportsDelayedInstantiation));
        }
        _registry.push([id, ctorOrDescriptor]);
    }
    function getSingletonServiceDescriptors() {
        return _registry;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vaW5zdGFudGlhdGlvbi9jb21tb24vZXh0ZW5zaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLDhDQU1DO0lBRUQsd0VBRUM7SUE1QkQsTUFBTSxTQUFTLEdBQW9ELEVBQUUsQ0FBQztJQUV0RSxJQUFrQixpQkFZakI7SUFaRCxXQUFrQixpQkFBaUI7UUFDbEM7OztXQUdHO1FBQ0gsMkRBQVMsQ0FBQTtRQUVUOzs7V0FHRztRQUNILCtEQUFXLENBQUE7SUFDWixDQUFDLEVBWmlCLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBWWxDO0lBSUQsU0FBZ0IsaUJBQWlCLENBQXVDLEVBQXdCLEVBQUUsZ0JBQXlFLEVBQUUsNEJBQTBEO1FBQ3RPLElBQUksQ0FBQyxDQUFDLGdCQUFnQixZQUFZLDRCQUFjLENBQUMsRUFBRSxDQUFDO1lBQ25ELGdCQUFnQixHQUFHLElBQUksNEJBQWMsQ0FBSSxnQkFBNkMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQztRQUNwSSxDQUFDO1FBRUQsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELFNBQWdCLDhCQUE4QjtRQUM3QyxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDIn0=