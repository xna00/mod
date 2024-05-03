/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.serializeEnvironmentVariableCollection = serializeEnvironmentVariableCollection;
    exports.serializeEnvironmentDescriptionMap = serializeEnvironmentDescriptionMap;
    exports.deserializeEnvironmentVariableCollection = deserializeEnvironmentVariableCollection;
    exports.deserializeEnvironmentDescriptionMap = deserializeEnvironmentDescriptionMap;
    exports.serializeEnvironmentVariableCollections = serializeEnvironmentVariableCollections;
    exports.deserializeEnvironmentVariableCollections = deserializeEnvironmentVariableCollections;
    // This file is shared between the renderer and extension host
    function serializeEnvironmentVariableCollection(collection) {
        return [...collection.entries()];
    }
    function serializeEnvironmentDescriptionMap(descriptionMap) {
        return descriptionMap ? [...descriptionMap.entries()] : [];
    }
    function deserializeEnvironmentVariableCollection(serializedCollection) {
        return new Map(serializedCollection);
    }
    function deserializeEnvironmentDescriptionMap(serializableEnvironmentDescription) {
        return new Map(serializableEnvironmentDescription ?? []);
    }
    function serializeEnvironmentVariableCollections(collections) {
        return Array.from(collections.entries()).map(e => {
            return [e[0], serializeEnvironmentVariableCollection(e[1].map), serializeEnvironmentDescriptionMap(e[1].descriptionMap)];
        });
    }
    function deserializeEnvironmentVariableCollections(serializedCollection) {
        return new Map(serializedCollection.map(e => {
            return [e[0], { map: deserializeEnvironmentVariableCollection(e[1]), descriptionMap: deserializeEnvironmentDescriptionMap(e[2]) }];
        }));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRWYXJpYWJsZVNoYXJlZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvY29tbW9uL2Vudmlyb25tZW50VmFyaWFibGVTaGFyZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsd0ZBRUM7SUFFRCxnRkFFQztJQUVELDRGQUlDO0lBRUQsb0ZBSUM7SUFFRCwwRkFJQztJQUVELDhGQU1DO0lBbENELDhEQUE4RDtJQUU5RCxTQUFnQixzQ0FBc0MsQ0FBQyxVQUE0RDtRQUNsSCxPQUFPLENBQUMsR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRUQsU0FBZ0Isa0NBQWtDLENBQUMsY0FBMEY7UUFDNUksT0FBTyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQzVELENBQUM7SUFFRCxTQUFnQix3Q0FBd0MsQ0FDdkQsb0JBQWdFO1FBRWhFLE9BQU8sSUFBSSxHQUFHLENBQXNDLG9CQUFvQixDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVELFNBQWdCLG9DQUFvQyxDQUNuRCxrQ0FBc0Y7UUFFdEYsT0FBTyxJQUFJLEdBQUcsQ0FBb0Qsa0NBQWtDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDN0csQ0FBQztJQUVELFNBQWdCLHVDQUF1QyxDQUFDLFdBQWdFO1FBQ3ZILE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDaEQsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsa0NBQWtDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDMUgsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBZ0IseUNBQXlDLENBQ3hELG9CQUFpRTtRQUVqRSxPQUFPLElBQUksR0FBRyxDQUF5QyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDbkYsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSx3Q0FBd0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLEVBQUUsb0NBQW9DLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3BJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDIn0=