/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform"], function (require, exports, event_1, nls_1, configurationRegistry_1, extensions_1, instantiation_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreadcrumbsConfig = exports.BreadcrumbsService = exports.IBreadcrumbsService = void 0;
    exports.IBreadcrumbsService = (0, instantiation_1.createDecorator)('IEditorBreadcrumbsService');
    class BreadcrumbsService {
        constructor() {
            this._map = new Map();
        }
        register(group, widget) {
            if (this._map.has(group)) {
                throw new Error(`group (${group}) has already a widget`);
            }
            this._map.set(group, widget);
            return {
                dispose: () => this._map.delete(group)
            };
        }
        getWidget(group) {
            return this._map.get(group);
        }
    }
    exports.BreadcrumbsService = BreadcrumbsService;
    (0, extensions_1.registerSingleton)(exports.IBreadcrumbsService, BreadcrumbsService, 1 /* InstantiationType.Delayed */);
    //#region config
    class BreadcrumbsConfig {
        constructor() {
            // internal
        }
        static { this.IsEnabled = BreadcrumbsConfig._stub('breadcrumbs.enabled'); }
        static { this.UseQuickPick = BreadcrumbsConfig._stub('breadcrumbs.useQuickPick'); }
        static { this.FilePath = BreadcrumbsConfig._stub('breadcrumbs.filePath'); }
        static { this.SymbolPath = BreadcrumbsConfig._stub('breadcrumbs.symbolPath'); }
        static { this.SymbolSortOrder = BreadcrumbsConfig._stub('breadcrumbs.symbolSortOrder'); }
        static { this.Icons = BreadcrumbsConfig._stub('breadcrumbs.icons'); }
        static { this.TitleScrollbarSizing = BreadcrumbsConfig._stub('workbench.editor.titleScrollbarSizing'); }
        static { this.FileExcludes = BreadcrumbsConfig._stub('files.exclude'); }
        static _stub(name) {
            return {
                bindTo(service) {
                    const onDidChange = new event_1.Emitter();
                    const listener = service.onDidChangeConfiguration(e => {
                        if (e.affectsConfiguration(name)) {
                            onDidChange.fire(undefined);
                        }
                    });
                    return new class {
                        constructor() {
                            this.name = name;
                            this.onDidChange = onDidChange.event;
                        }
                        getValue(overrides) {
                            if (overrides) {
                                return service.getValue(name, overrides);
                            }
                            else {
                                return service.getValue(name);
                            }
                        }
                        updateValue(newValue, overrides) {
                            if (overrides) {
                                return service.updateValue(name, newValue, overrides);
                            }
                            else {
                                return service.updateValue(name, newValue);
                            }
                        }
                        dispose() {
                            listener.dispose();
                            onDidChange.dispose();
                        }
                    };
                }
            };
        }
    }
    exports.BreadcrumbsConfig = BreadcrumbsConfig;
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'breadcrumbs',
        title: (0, nls_1.localize)('title', "Breadcrumb Navigation"),
        order: 101,
        type: 'object',
        properties: {
            'breadcrumbs.enabled': {
                description: (0, nls_1.localize)('enabled', "Enable/disable navigation breadcrumbs."),
                type: 'boolean',
                default: true
            },
            'breadcrumbs.filePath': {
                description: (0, nls_1.localize)('filepath', "Controls whether and how file paths are shown in the breadcrumbs view."),
                type: 'string',
                default: 'on',
                enum: ['on', 'off', 'last'],
                enumDescriptions: [
                    (0, nls_1.localize)('filepath.on', "Show the file path in the breadcrumbs view."),
                    (0, nls_1.localize)('filepath.off', "Do not show the file path in the breadcrumbs view."),
                    (0, nls_1.localize)('filepath.last', "Only show the last element of the file path in the breadcrumbs view."),
                ]
            },
            'breadcrumbs.symbolPath': {
                description: (0, nls_1.localize)('symbolpath', "Controls whether and how symbols are shown in the breadcrumbs view."),
                type: 'string',
                default: 'on',
                enum: ['on', 'off', 'last'],
                enumDescriptions: [
                    (0, nls_1.localize)('symbolpath.on', "Show all symbols in the breadcrumbs view."),
                    (0, nls_1.localize)('symbolpath.off', "Do not show symbols in the breadcrumbs view."),
                    (0, nls_1.localize)('symbolpath.last', "Only show the current symbol in the breadcrumbs view."),
                ]
            },
            'breadcrumbs.symbolSortOrder': {
                description: (0, nls_1.localize)('symbolSortOrder', "Controls how symbols are sorted in the breadcrumbs outline view."),
                type: 'string',
                default: 'position',
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                enum: ['position', 'name', 'type'],
                enumDescriptions: [
                    (0, nls_1.localize)('symbolSortOrder.position', "Show symbol outline in file position order."),
                    (0, nls_1.localize)('symbolSortOrder.name', "Show symbol outline in alphabetical order."),
                    (0, nls_1.localize)('symbolSortOrder.type', "Show symbol outline in symbol type order."),
                ]
            },
            'breadcrumbs.icons': {
                description: (0, nls_1.localize)('icons', "Render breadcrumb items with icons."),
                type: 'boolean',
                default: true
            },
            'breadcrumbs.showFiles': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.file', "When enabled breadcrumbs show `file`-symbols.")
            },
            'breadcrumbs.showModules': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.module', "When enabled breadcrumbs show `module`-symbols.")
            },
            'breadcrumbs.showNamespaces': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.namespace', "When enabled breadcrumbs show `namespace`-symbols.")
            },
            'breadcrumbs.showPackages': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.package', "When enabled breadcrumbs show `package`-symbols.")
            },
            'breadcrumbs.showClasses': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.class', "When enabled breadcrumbs show `class`-symbols.")
            },
            'breadcrumbs.showMethods': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.method', "When enabled breadcrumbs show `method`-symbols.")
            },
            'breadcrumbs.showProperties': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.property', "When enabled breadcrumbs show `property`-symbols.")
            },
            'breadcrumbs.showFields': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.field', "When enabled breadcrumbs show `field`-symbols.")
            },
            'breadcrumbs.showConstructors': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.constructor', "When enabled breadcrumbs show `constructor`-symbols.")
            },
            'breadcrumbs.showEnums': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.enum', "When enabled breadcrumbs show `enum`-symbols.")
            },
            'breadcrumbs.showInterfaces': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.interface', "When enabled breadcrumbs show `interface`-symbols.")
            },
            'breadcrumbs.showFunctions': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.function', "When enabled breadcrumbs show `function`-symbols.")
            },
            'breadcrumbs.showVariables': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.variable', "When enabled breadcrumbs show `variable`-symbols.")
            },
            'breadcrumbs.showConstants': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.constant', "When enabled breadcrumbs show `constant`-symbols.")
            },
            'breadcrumbs.showStrings': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.string', "When enabled breadcrumbs show `string`-symbols.")
            },
            'breadcrumbs.showNumbers': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.number', "When enabled breadcrumbs show `number`-symbols.")
            },
            'breadcrumbs.showBooleans': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.boolean', "When enabled breadcrumbs show `boolean`-symbols.")
            },
            'breadcrumbs.showArrays': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.array', "When enabled breadcrumbs show `array`-symbols.")
            },
            'breadcrumbs.showObjects': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.object', "When enabled breadcrumbs show `object`-symbols.")
            },
            'breadcrumbs.showKeys': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.key', "When enabled breadcrumbs show `key`-symbols.")
            },
            'breadcrumbs.showNull': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.null', "When enabled breadcrumbs show `null`-symbols.")
            },
            'breadcrumbs.showEnumMembers': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.enumMember', "When enabled breadcrumbs show `enumMember`-symbols.")
            },
            'breadcrumbs.showStructs': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.struct', "When enabled breadcrumbs show `struct`-symbols.")
            },
            'breadcrumbs.showEvents': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.event', "When enabled breadcrumbs show `event`-symbols.")
            },
            'breadcrumbs.showOperators': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.operator', "When enabled breadcrumbs show `operator`-symbols.")
            },
            'breadcrumbs.showTypeParameters': {
                type: 'boolean',
                default: true,
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                markdownDescription: (0, nls_1.localize)('filteredTypes.typeParameter', "When enabled breadcrumbs show `typeParameter`-symbols.")
            }
        }
    });
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWRjcnVtYnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9icmVhZGNydW1icy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjbkYsUUFBQSxtQkFBbUIsR0FBRyxJQUFBLCtCQUFlLEVBQXNCLDJCQUEyQixDQUFDLENBQUM7SUFZckcsTUFBYSxrQkFBa0I7UUFBL0I7WUFJa0IsU0FBSSxHQUFHLElBQUksR0FBRyxFQUE2QixDQUFDO1FBZTlELENBQUM7UUFiQSxRQUFRLENBQUMsS0FBYSxFQUFFLE1BQXlCO1lBQ2hELElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxVQUFVLEtBQUssd0JBQXdCLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzdCLE9BQU87Z0JBQ04sT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQzthQUN0QyxDQUFDO1FBQ0gsQ0FBQztRQUVELFNBQVMsQ0FBQyxLQUFhO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0IsQ0FBQztLQUNEO0lBbkJELGdEQW1CQztJQUVELElBQUEsOEJBQWlCLEVBQUMsMkJBQW1CLEVBQUUsa0JBQWtCLG9DQUE0QixDQUFDO0lBR3RGLGdCQUFnQjtJQUVoQixNQUFzQixpQkFBaUI7UUFTdEM7WUFDQyxXQUFXO1FBQ1osQ0FBQztpQkFFZSxjQUFTLEdBQUcsaUJBQWlC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