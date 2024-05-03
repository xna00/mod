/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/views", "./outlinePane", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/contrib/files/browser/explorerViewlet", "vs/platform/instantiation/common/descriptors", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/contrib/outline/browser/outline", "./outlineActions"], function (require, exports, nls_1, views_1, outlinePane_1, platform_1, configurationRegistry_1, explorerViewlet_1, descriptors_1, codicons_1, iconRegistry_1, outline_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --- view
    const outlineViewIcon = (0, iconRegistry_1.registerIcon)('outline-view-icon', codicons_1.Codicon.symbolClass, (0, nls_1.localize)('outlineViewIcon', 'View icon of the outline view.'));
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: outline_1.IOutlinePane.Id,
            name: (0, nls_1.localize2)('name', "Outline"),
            containerIcon: outlineViewIcon,
            ctorDescriptor: new descriptors_1.SyncDescriptor(outlinePane_1.OutlinePane),
            canToggleVisibility: true,
            canMoveView: true,
            hideByDefault: false,
            collapsed: true,
            order: 2,
            weight: 30,
            focusCommand: { id: 'outline.focus' }
        }], explorerViewlet_1.VIEW_CONTAINER);
    // --- configurations
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': 'outline',
        'order': 117,
        'title': (0, nls_1.localize)('outlineConfigurationTitle', "Outline"),
        'type': 'object',
        'properties': {
            ["outline.icons" /* OutlineConfigKeys.icons */]: {
                'description': (0, nls_1.localize)('outline.showIcons', "Render Outline elements with icons."),
                'type': 'boolean',
                'default': true
            },
            ["outline.collapseItems" /* OutlineConfigKeys.collapseItems */]: {
                'description': (0, nls_1.localize)('outline.initialState', "Controls whether Outline items are collapsed or expanded."),
                'type': 'string',
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                'enum': [
                    'alwaysCollapse',
                    'alwaysExpand'
                ],
                'enumDescriptions': [
                    (0, nls_1.localize)('outline.initialState.collapsed', "Collapse all items."),
                    (0, nls_1.localize)('outline.initialState.expanded', "Expand all items.")
                ],
                'default': 'alwaysExpand'
            },
            ["outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */]: {
                'markdownDescription': (0, nls_1.localize)('outline.showProblem', "Show errors and warnings on Outline elements. Overwritten by `#problems.visibility#` when it is off."),
                'type': 'boolean',
                'default': true
            },
            ["outline.problems.colors" /* OutlineConfigKeys.problemsColors */]: {
                'markdownDescription': (0, nls_1.localize)('outline.problem.colors', "Use colors for errors and warnings on Outline elements. Overwritten by `#problems.visibility#` when it is off."),
                'type': 'boolean',
                'default': true
            },
            ["outline.problems.badges" /* OutlineConfigKeys.problemsBadges */]: {
                'markdownDescription': (0, nls_1.localize)('outline.problems.badges', "Use badges for errors and warnings on Outline elements. Overwritten by `#problems.visibility#` when it is off."),
                'type': 'boolean',
                'default': true
            },
            'outline.showFiles': {
                type: 'boolean',
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                default: true,
                markdownDescription: (0, nls_1.localize)('filteredTypes.file', "When enabled, Outline shows `file`-symbols.")
            },
            'outline.showModules': {
                type: 'boolean',
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                default: true,
                markdownDescription: (0, nls_1.localize)('filteredTypes.module', "When enabled, Outline shows `module`-symbols.")
            },
            'outline.showNamespaces': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.namespace', "When enabled, Outline shows `namespace`-symbols.")
            },
            'outline.showPackages': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.package', "When enabled, Outline shows `package`-symbols.")
            },
            'outline.showClasses': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.class', "When enabled, Outline shows `class`-symbols.")
            },
            'outline.showMethods': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.method', "When enabled, Outline shows `method`-symbols.")
            },
            'outline.showProperties': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.property', "When enabled, Outline shows `property`-symbols.")
            },
            'outline.showFields': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.field', "When enabled, Outline shows `field`-symbols.")
            },
            'outline.showConstructors': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.constructor', "When enabled, Outline shows `constructor`-symbols.")
            },
            'outline.showEnums': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.enum', "When enabled, Outline shows `enum`-symbols.")
            },
            'outline.showInterfaces': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.interface', "When enabled, Outline shows `interface`-symbols.")
            },
            'outline.showFunctions': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.function', "When enabled, Outline shows `function`-symbols.")
            },
            'outline.showVariables': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.variable', "When enabled, Outline shows `variable`-symbols.")
            },
            'outline.showConstants': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.constant', "When enabled, Outline shows `constant`-symbols.")
            },
            'outline.showStrings': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.string', "When enabled, Outline shows `string`-symbols.")
            },
            'outline.showNumbers': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.number', "When enabled, Outline shows `number`-symbols.")
            },
            'outline.showBooleans': {
                type: 'boolean',
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                default: true,
                markdownDescription: (0, nls_1.localize)('filteredTypes.boolean', "When enabled, Outline shows `boolean`-symbols.")
            },
            'outline.showArrays': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.array', "When enabled, Outline shows `array`-symbols.")
            },
            'outline.showObjects': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.object', "When enabled, Outline shows `object`-symbols.")
            },
            'outline.showKeys': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.key', "When enabled, Outline shows `key`-symbols.")
            },
            'outline.showNull': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.null', "When enabled, Outline shows `null`-symbols.")
            },
            'outline.showEnumMembers': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.enumMember', "When enabled, Outline shows `enumMember`-symbols.")
            },
            'outline.showStructs': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.struct', "When enabled, Outline shows `struct`-symbols.")
            },
            'outline.showEvents': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.event', "When enabled, Outline shows `event`-symbols.")
            },
            'outline.showOperators': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.operator', "When enabled, Outline shows `operator`-symbols.")
            },
            'outline.showTypeParameters': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.typeParameter', "When enabled, Outline shows `typeParameter`-symbols.")
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZS5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL291dGxpbmUvYnJvd3Nlci9vdXRsaW5lLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtCaEcsV0FBVztJQUVYLE1BQU0sZUFBZSxHQUFHLElBQUEsMkJBQVksRUFBQyxtQkFBbUIsRUFBRSxrQkFBTyxDQUFDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7SUFFOUksbUJBQVEsQ0FBQyxFQUFFLENBQWlCLGtCQUFjLENBQUMsYUFBYSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDeEUsRUFBRSxFQUFFLHNCQUFZLENBQUMsRUFBRTtZQUNuQixJQUFJLEVBQUUsSUFBQSxlQUFTLEVBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQztZQUNsQyxhQUFhLEVBQUUsZUFBZTtZQUM5QixjQUFjLEVBQUUsSUFBSSw0QkFBYyxDQUFDLHlCQUFXLENBQUM7WUFDL0MsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixXQUFXLEVBQUUsSUFBSTtZQUNqQixhQUFhLEVBQUUsS0FBSztZQUNwQixTQUFTLEVBQUUsSUFBSTtZQUNmLEtBQUssRUFBRSxDQUFDO1lBQ1IsTUFBTSxFQUFFLEVBQUU7WUFDVixZQUFZLEVBQUUsRUFBRSxFQUFFLEVBQUUsZUFBZSxFQUFFO1NBQ3JDLENBQUMsRUFBRSxnQ0FBYyxDQUFDLENBQUM7SUFFcEIscUJBQXFCO0lBRXJCLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQztRQUNoRyxJQUFJLEVBQUUsU0FBUztRQUNmLE9BQU8sRUFBRSxHQUFHO1FB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