/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/callHierarchy/common/callHierarchy", "vs/base/common/cancellation", "vs/base/common/filters", "vs/base/browser/ui/iconLabel/iconLabel", "vs/editor/common/languages", "vs/base/common/strings", "vs/editor/common/core/range", "vs/nls", "vs/base/common/themables"], function (require, exports, callHierarchy_1, cancellation_1, filters_1, iconLabel_1, languages_1, strings_1, range_1, nls_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityProvider = exports.VirtualDelegate = exports.CallRenderer = exports.IdentityProvider = exports.Sorter = exports.DataSource = exports.Call = void 0;
    class Call {
        constructor(item, locations, model, parent) {
            this.item = item;
            this.locations = locations;
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
    exports.Call = Call;
    class DataSource {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        hasChildren() {
            return true;
        }
        async getChildren(element) {
            if (element instanceof callHierarchy_1.CallHierarchyModel) {
                return element.roots.map(root => new Call(root, undefined, element, undefined));
            }
            const { model, item } = element;
            if (this.getDirection() === "outgoingCalls" /* CallHierarchyDirection.CallsFrom */) {
                return (await model.resolveOutgoingCalls(item, cancellation_1.CancellationToken.None)).map(call => {
                    return new Call(call.to, call.fromRanges.map(range => ({ range, uri: item.uri })), model, element);
                });
            }
            else {
                return (await model.resolveIncomingCalls(item, cancellation_1.CancellationToken.None)).map(call => {
                    return new Call(call.from, call.fromRanges.map(range => ({ range, uri: call.from.uri })), model, element);
                });
            }
        }
    }
    exports.DataSource = DataSource;
    class Sorter {
        compare(element, otherElement) {
            return Call.compare(element, otherElement);
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
    class CallRenderingTemplate {
        constructor(icon, label) {
            this.icon = icon;
            this.label = label;
        }
    }
    class CallRenderer {
        constructor() {
            this.templateId = CallRenderer.id;
        }
        static { this.id = 'CallRenderer'; }
        renderTemplate(container) {
            container.classList.add('callhierarchy-element');
            const icon = document.createElement('div');
            container.appendChild(icon);
            const label = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            return new CallRenderingTemplate(icon, label);
        }
        renderElement(node, _index, template) {
            const { element, filterData } = node;
            const deprecated = element.item.tags?.includes(1 /* SymbolTag.Deprecated */);
            template.icon.className = '';
            template.icon.classList.add('inline', ...themables_1.ThemeIcon.asClassNameArray(languages_1.SymbolKinds.toIcon(element.item.kind)));
            template.label.setLabel(element.item.name, element.item.detail, { labelEscapeNewLines: true, matches: (0, filters_1.createMatches)(filterData), strikethrough: deprecated });
        }
        disposeTemplate(template) {
            template.label.dispose();
        }
    }
    exports.CallRenderer = CallRenderer;
    class VirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return CallRenderer.id;
        }
    }
    exports.VirtualDelegate = VirtualDelegate;
    class AccessibilityProvider {
        constructor(getDirection) {
            this.getDirection = getDirection;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('tree.aria', "Call Hierarchy");
        }
        getAriaLabel(element) {
            if (this.getDirection() === "outgoingCalls" /* CallHierarchyDirection.CallsFrom */) {
                return (0, nls_1.localize)('from', "calls from {0}", element.item.name);
            }
            else {
                return (0, nls_1.localize)('to', "callers of {0}", element.item.name);
            }
        }
    }
    exports.AccessibilityProvider = AccessibilityProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbEhpZXJhcmNoeVRyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NhbGxIaWVyYXJjaHkvYnJvd3Nlci9jYWxsSGllcmFyY2h5VHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBYSxJQUFJO1FBQ2hCLFlBQ1UsSUFBdUIsRUFDdkIsU0FBaUMsRUFDakMsS0FBeUIsRUFDekIsTUFBd0I7WUFIeEIsU0FBSSxHQUFKLElBQUksQ0FBbUI7WUFDdkIsY0FBUyxHQUFULFNBQVMsQ0FBd0I7WUFDakMsVUFBSyxHQUFMLEtBQUssQ0FBb0I7WUFDekIsV0FBTSxHQUFOLE1BQU0sQ0FBa0I7UUFDOUIsQ0FBQztRQUVMLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBTyxFQUFFLENBQU87WUFDOUIsSUFBSSxHQUFHLEdBQUcsSUFBQSxpQkFBTyxFQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDaEUsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2YsR0FBRyxHQUFHLGFBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xFLENBQUM7WUFDRCxPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7S0FDRDtJQWZELG9CQWVDO0lBRUQsTUFBYSxVQUFVO1FBRXRCLFlBQ1EsWUFBMEM7WUFBMUMsaUJBQVksR0FBWixZQUFZLENBQThCO1FBQzlDLENBQUM7UUFFTCxXQUFXO1lBQ1YsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFrQztZQUNuRCxJQUFJLE9BQU8sWUFBWSxrQ0FBa0IsRUFBRSxDQUFDO2dCQUMzQyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNqRixDQUFDO1lBRUQsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFFaEMsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLDJEQUFxQyxFQUFFLENBQUM7Z0JBQzlELE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ2xGLE9BQU8sSUFBSSxJQUFJLENBQ2QsSUFBSSxDQUFDLEVBQUUsRUFDUCxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQ3hELEtBQUssRUFDTCxPQUFPLENBQ1AsQ0FBQztnQkFDSCxDQUFDLENBQUMsQ0FBQztZQUVKLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNsRixPQUFPLElBQUksSUFBSSxDQUNkLElBQUksQ0FBQyxJQUFJLEVBQ1QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFDN0QsS0FBSyxFQUNMLE9BQU8sQ0FDUCxDQUFDO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUM7S0FDRDtJQXRDRCxnQ0FzQ0M7SUFFRCxNQUFhLE1BQU07UUFFbEIsT0FBTyxDQUFDLE9BQWEsRUFBRSxZQUFrQjtZQUN4QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzVDLENBQUM7S0FDRDtJQUxELHdCQUtDO0lBRUQsTUFBYSxnQkFBZ0I7UUFFNUIsWUFDUSxZQUEwQztZQUExQyxpQkFBWSxHQUFaLFlBQVksQ0FBOEI7UUFDOUMsQ0FBQztRQUVMLEtBQUssQ0FBQyxPQUFhO1lBQ2xCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RHLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNwQixHQUFHLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbkMsQ0FBQztZQUNELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztLQUNEO0lBYkQsNENBYUM7SUFFRCxNQUFNLHFCQUFxQjtRQUMxQixZQUNVLElBQW9CLEVBQ3BCLEtBQWdCO1lBRGhCLFNBQUksR0FBSixJQUFJLENBQWdCO1lBQ3BCLFVBQUssR0FBTCxLQUFLLENBQVc7UUFDdEIsQ0FBQztLQUNMO0lBRUQsTUFBYSxZQUFZO1FBQXpCO1lBSUMsZUFBVSxHQUFXLFlBQVksQ0FBQyxFQUFFLENBQUM7UUF3QnRDLENBQUM7aUJBMUJnQixPQUFFLEdBQUcsY0FBYyxBQUFqQixDQUFrQjtRQUlwQyxjQUFjLENBQUMsU0FBc0I7WUFDcEMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNqRCxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxxQkFBUyxDQUFDLFNBQVMsRUFBRSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDcEUsT0FBTyxJQUFJLHFCQUFxQixDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRUQsYUFBYSxDQUFDLElBQWlDLEVBQUUsTUFBYyxFQUFFLFFBQStCO1lBQy9GLE1BQU0sRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDO1lBQ3JDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsOEJBQXNCLENBQUM7WUFDckUsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBQzdCLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxxQkFBUyxDQUFDLGdCQUFnQixDQUFDLHVCQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUN0QixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFDakIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQ25CLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFBLHVCQUFhLEVBQUMsVUFBVSxDQUFDLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxDQUM1RixDQUFDO1FBQ0gsQ0FBQztRQUNELGVBQWUsQ0FBQyxRQUErQjtZQUM5QyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzFCLENBQUM7O0lBM0JGLG9DQTRCQztJQUVELE1BQWEsZUFBZTtRQUUzQixTQUFTLENBQUMsUUFBYztZQUN2QixPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxhQUFhLENBQUMsUUFBYztZQUMzQixPQUFPLFlBQVksQ0FBQyxFQUFFLENBQUM7UUFDeEIsQ0FBQztLQUNEO0lBVEQsMENBU0M7SUFFRCxNQUFhLHFCQUFxQjtRQUVqQyxZQUNRLFlBQTBDO1lBQTFDLGlCQUFZLEdBQVosWUFBWSxDQUE4QjtRQUM5QyxDQUFDO1FBRUwsa0JBQWtCO1lBQ2pCLE9BQU8sSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVELFlBQVksQ0FBQyxPQUFhO1lBQ3pCLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSwyREFBcUMsRUFBRSxDQUFDO2dCQUM5RCxPQUFPLElBQUEsY0FBUSxFQUFDLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLElBQUEsY0FBUSxFQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVELENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFqQkQsc0RBaUJDIn0=