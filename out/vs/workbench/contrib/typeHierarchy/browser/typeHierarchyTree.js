/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/typeHierarchy/common/typeHierarchy", "vs/base/common/cancellation", "vs/base/common/filters", "vs/base/browser/ui/iconLabel/iconLabel", "vs/editor/common/languages", "vs/base/common/strings", "vs/editor/common/core/range", "vs/nls", "vs/base/common/themables"], function (require, exports, typeHierarchy_1, cancellation_1, filters_1, iconLabel_1, languages_1, strings_1, range_1, nls_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityProvider = exports.VirtualDelegate = exports.TypeRenderer = exports.IdentityProvider = exports.Sorter = exports.DataSource = exports.Type = void 0;
    class Type {
        constructor(item, model, parent) {
            this.item = item;
            this.model = model;
            this.parent = parent;
        }
        static compare(a, b) {
            let res = (0, strings_1.compare)(a.item.uri.toString(), b.item.uri.toString());
            if (res === 0) {
                res = range_1.Range.compareRangesUsingStarts(a.item.range, b.item.range);
            }
            return res;
        }
    }
    exports.Type = Type;
    class DataSource {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        hasChildren() {
            return true;
        }
        async getChildren(element) {
            if (element instanceof typeHierarchy_1.TypeHierarchyModel) {
                return element.roots.map(root => new Type(root, element, undefined));
            }
            const { model, item } = element;
            if (this.getDirection() === "supertypes" /* TypeHierarchyDirection.Supertypes */) {
                return (await model.provideSupertypes(item, cancellation_1.CancellationToken.None)).map(item => {
                    return new Type(item, model, element);
                });
            }
            else {
                return (await model.provideSubtypes(item, cancellation_1.CancellationToken.None)).map(item => {
                    return new Type(item, model, element);
                });
            }
        }
    }
    exports.DataSource = DataSource;
    class Sorter {
        compare(element, otherElement) {
            return Type.compare(element, otherElement);
        }
    }
    exports.Sorter = Sorter;
    class IdentityProvider {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        getId(element) {
            let res = this.getDirection() + JSON.stringify(element.item.uri) + JSON.stringify(element.item.range);
            if (element.parent) {
                res += this.getId(element.parent);
            }
            return res;
        }
    }
    exports.IdentityProvider = IdentityProvider;
    class TypeRenderingTemplate {
        constructor(icon, label) {
            this.icon = icon;
            this.label = label;
        }
    }
    class TypeRenderer {
        constructor() {
            this.templateId = TypeRenderer.id;
        }
        static { this.id = 'TypeRenderer'; }
        renderTemplate(container) {
            container.classList.add('typehierarchy-element');
            const icon = document.createElement('div');
            container.appendChild(icon);
            const label = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            return new TypeRenderingTemplate(icon, label);
        }
        renderElement(node, _index, template) {
            const { element, filterData } = node;
            const deprecated = element.item.tags?.includes(1 /* SymbolTag.Deprecated */);
            template.icon.classList.add('inline', ...themables_1.ThemeIcon.asClassNameArray(languages_1.SymbolKinds.toIcon(element.item.kind)));
            template.label.setLabel(element.item.name, element.item.detail, { labelEscapeNewLines: true, matches: (0, filters_1.createMatches)(filterData), strikethrough: deprecated });
        }
        disposeTemplate(template) {
            template.label.dispose();
        }
    }
    exports.TypeRenderer = TypeRenderer;
    class VirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return TypeRenderer.id;
        }
    }
    exports.VirtualDelegate = VirtualDelegate;
    class AccessibilityProvider {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('tree.aria', "Type Hierarchy");
        }
        getAriaLabel(element) {
            if (this.getDirection() === "supertypes" /* TypeHierarchyDirection.Supertypes */) {
                return (0, nls_1.localize)('supertypes', "supertypes of {0}", element.item.name);
            }
            else {
                return (0, nls_1.localize)('subtypes', "subtypes of {0}", element.item.name);
            }
        }
    }
    exports.AccessibilityProvider = AccessibilityProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZUhpZXJhcmNoeVRyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3R5cGVIaWVyYXJjaHkvYnJvd3Nlci90eXBlSGllcmFyY2h5VHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBYSxJQUFJO1FBQ2hCLFlBQ1UsSUFBdUIsRUFDdkIsS0FBeUIsRUFDekIsTUFBd0I7WUFGeEIsU0FBSSxHQUFKLElBQUksQ0FBbUI7WUFDdkIsVUFBSyxHQUFMLEtBQUssQ0FBb0I7WUFDekIsV0FBTSxHQUFOLE1BQU0sQ0FBa0I7UUFDOUIsQ0FBQztRQUVMLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBTyxFQUFFLENBQU87WUFDOUIsSUFBSSxHQUFHLEdBQUcsSUFBQSxpQkFBTyxFQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDaEUsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2YsR0FBRyxHQUFHLGFBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xFLENBQUM7WUFDRCxPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7S0FDRDtJQWRELG9CQWNDO0lBRUQsTUFBYSxVQUFVO1FBRXRCLFlBQ1EsWUFBMEM7WUFBMUMsaUJBQVksR0FBWixZQUFZLENBQThCO1FBQzlDLENBQUM7UUFFTCxXQUFXO1lBQ1YsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFrQztZQUNuRCxJ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