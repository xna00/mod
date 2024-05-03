/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IInstantiationService = exports._util = void 0;
    exports.createDecorator = createDecorator;
    exports.refineServiceDecorator = refineServiceDecorator;
    // ------ internal util
    var _util;
    (function (_util) {
        _util.serviceIds = new Map();
        _util.DI_TARGET = '$di$target';
        _util.DI_DEPENDENCIES = '$di$dependencies';
        function getServiceDependencies(ctor) {
            return ctor[_util.DI_DEPENDENCIES] || [];
        }
        _util.getServiceDependencies = getServiceDependencies;
    })(_util || (exports._util = _util = {}));
    exports.IInstantiationService = createDecorator('instantiationService');
    function storeServiceDependency(id, target, index) {
        if (target[_util.DI_TARGET] === target) {
            target[_util.DI_DEPENDENCIES].push({ id, index });
        }
        else {
            target[_util.DI_DEPENDENCIES] = [{ id, index }];
            target[_util.DI_TARGET] = target;
        }
    }
    /**
     * The *only* valid way to create a {{ServiceIdentifier}}.
     */
    function createDecorator(serviceId) {
        if (_util.serviceIds.has(serviceId)) {
            return _util.serviceIds.get(serviceId);
        }
        const id = function (target, key, index) {
            if (arguments.length !== 3) {
                throw new Error('@IServiceName-decorator can only be used to decorate a parameter');
            }
            storeServiceDependency(id, target, index);
        };
        id.toString = () => serviceId;
        _util.serviceIds.set(serviceId, id);
        return id;
    }
    function refineServiceDecorator(serviceIdentifier) {
        return serviceIdentifier;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFudGlhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vaW5zdGFudGlhdGlvbi9jb21tb24vaW5zdGFudGlhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxRmhHLDBDQWlCQztJQUVELHdEQUVDO0lBckdELHVCQUF1QjtJQUV2QixJQUFpQixLQUFLLENBVXJCO0lBVkQsV0FBaUIsS0FBSztRQUVSLGdCQUFVLEdBQUcsSUFBSSxHQUFHLEVBQWtDLENBQUM7UUFFdkQsZUFBUyxHQUFHLFlBQVksQ0FBQztRQUN6QixxQkFBZSxHQUFHLGtCQUFrQixDQUFDO1FBRWxELFNBQWdCLHNCQUFzQixDQUFDLElBQVM7WUFDL0MsT0FBTyxJQUFJLENBQUMsTUFBQSxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDcEMsQ0FBQztRQUZlLDRCQUFzQix5QkFFckMsQ0FBQTtJQUNGLENBQUMsRUFWZ0IsS0FBSyxxQkFBTCxLQUFLLFFBVXJCO0lBY1ksUUFBQSxxQkFBcUIsR0FBRyxlQUFlLENBQXdCLHNCQUFzQixDQUFDLENBQUM7SUEwQ3BHLFNBQVMsc0JBQXNCLENBQUMsRUFBWSxFQUFFLE1BQWdCLEVBQUUsS0FBYTtRQUM1RSxJQUFLLE1BQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssTUFBTSxFQUFFLENBQUM7WUFDaEQsTUFBYyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM1RCxDQUFDO2FBQU0sQ0FBQztZQUNOLE1BQWMsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ3hELE1BQWMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFDO1FBQzNDLENBQUM7SUFDRixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixlQUFlLENBQUksU0FBaUI7UUFFbkQsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQ3JDLE9BQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFFLENBQUM7UUFDekMsQ0FBQztRQUVELE1BQU0sRUFBRSxHQUFRLFVBQVUsTUFBZ0IsRUFBRSxHQUFXLEVBQUUsS0FBYTtZQUNyRSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsa0VBQWtFLENBQUMsQ0FBQztZQUNyRixDQUFDO1lBQ0Qsc0JBQXNCLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUM7UUFFRixFQUFFLENBQUMsUUFBUSxHQUFHLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQztRQUU5QixLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDcEMsT0FBTyxFQUFFLENBQUM7SUFDWCxDQUFDO0lBRUQsU0FBZ0Isc0JBQXNCLENBQW1CLGlCQUF3QztRQUNoRyxPQUE2QixpQkFBaUIsQ0FBQztJQUNoRCxDQUFDIn0=