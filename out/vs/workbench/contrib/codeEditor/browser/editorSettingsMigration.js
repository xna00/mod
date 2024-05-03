/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/editor/browser/config/migrateOptions", "vs/workbench/common/configuration"], function (require, exports, platform_1, migrateOptions_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations(migrateOptions_1.EditorSettingMigration.items.map(item => ({
        key: `editor.${item.key}`,
        migrateFn: (value, accessor) => {
            const configurationKeyValuePairs = [];
            const writer = (key, value) => configurationKeyValuePairs.push([`editor.${key}`, { value }]);
            item.migrate(value, key => accessor(`editor.${key}`), writer);
            return configurationKeyValuePairs;
        }
    })));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU2V0dGluZ3NNaWdyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvYnJvd3Nlci9lZGl0b3JTZXR0aW5nc01pZ3JhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQVUsQ0FBQyxzQkFBc0IsQ0FBQztTQUM3RSwrQkFBK0IsQ0FBQyx1Q0FBc0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMxRSxHQUFHLEVBQUUsVUFBVSxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ3pCLFNBQVMsRUFBRSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtZQUM5QixNQUFNLDBCQUEwQixHQUErQixFQUFFLENBQUM7WUFDbEUsTUFBTSxNQUFNLEdBQW9CLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxHQUFHLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5RyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDOUQsT0FBTywwQkFBMEIsQ0FBQztRQUNuQyxDQUFDO0tBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyJ9