/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "./viewsWelcomeExtensionPoint", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls, lifecycle_1, contextkey_1, viewsWelcomeExtensionPoint_1, platform_1, views_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewsWelcomeContribution = void 0;
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    class ViewsWelcomeContribution extends lifecycle_1.Disposable {
        constructor(extensionPoint) {
            super();
            this.viewWelcomeContents = new Map();
            extensionPoint.setHandler((_, { added, removed }) => {
                for (const contribution of removed) {
                    for (const welcome of contribution.value) {
                        const disposable = this.viewWelcomeContents.get(welcome);
                        disposable?.dispose();
                    }
                }
                const welcomesByViewId = new Map();
                for (const contribution of added) {
                    for (const welcome of contribution.value) {
                        const { group, order } = parseGroupAndOrder(welcome, contribution);
                        const precondition = contextkey_1.ContextKeyExpr.deserialize(welcome.enablement);
                        const id = viewsWelcomeExtensionPoint_1.ViewIdentifierMap[welcome.view] ?? welcome.view;
                        let viewContentMap = welcomesByViewId.get(id);
                        if (!viewContentMap) {
                            viewContentMap = new Map();
                            welcomesByViewId.set(id, viewContentMap);
                        }
                        viewContentMap.set(welcome, {
                            content: welcome.contents,
                            when: contextkey_1.ContextKeyExpr.deserialize(welcome.when),
                            precondition,
                            group,
                            order
                        });
                    }
                }
                for (const [id, viewContentMap] of welcomesByViewId) {
                    const disposables = viewsRegistry.registerViewWelcomeContent2(id, viewContentMap);
                    for (const [welcome, disposable] of disposables) {
                        this.viewWelcomeContents.set(welcome, disposable);
                    }
                }
            });
        }
    }
    exports.ViewsWelcomeContribution = ViewsWelcomeContribution;
    function parseGroupAndOrder(welcome, contribution) {
        let group;
        let order;
        if (welcome.group) {
            if (!(0, extensions_1.isProposedApiEnabled)(contribution.description, 'contribViewsWelcome')) {
                contribution.collector.warn(nls.localize('ViewsWelcomeExtensionPoint.proposedAPI', "The viewsWelcome contribution in '{0}' requires 'enabledApiProposals: [\"contribViewsWelcome\"]' in order to use the 'group' proposed property.", contribution.description.identifier.value));
                return { group, order };
            }
            const idx = welcome.group.lastIndexOf('@');
            if (idx > 0) {
                group = welcome.group.substr(0, idx);
                order = Number(welcome.group.substr(idx + 1)) || undefined;
            }
            else {
                group = welcome.group;
            }
        }
        return { group, order };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3NXZWxjb21lQ29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lVmlld3MvY29tbW9uL3ZpZXdzV2VsY29tZUNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsTUFBTSxhQUFhLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQWlCLGtCQUF1QixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRXpGLE1BQWEsd0JBQXlCLFNBQVEsc0JBQVU7UUFJdkQsWUFBWSxjQUEyRDtZQUN0RSxLQUFLLEVBQUUsQ0FBQztZQUhELHdCQUFtQixHQUFHLElBQUksR0FBRyxFQUE0QixDQUFDO1lBS2pFLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtnQkFDbkQsS0FBSyxNQUFNLFlBQVksSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDcEMsS0FBSyxNQUFNLE9BQU8sSUFBSSxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQzFDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBRXpELFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQztvQkFDdkIsQ0FBQztnQkFDRixDQUFDO2dCQUVELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQW9ELENBQUM7Z0JBRXJGLEtBQUssTUFBTSxZQUFZLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ2xDLEtBQUssTUFBTSxPQUFPLElBQUksWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUMxQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLGtCQUFr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