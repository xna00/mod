/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/linkedText", "vs/base/common/severity", "vs/platform/severityIcon/browser/severityIcon", "vs/workbench/services/search/common/searchExtTypes", "vs/base/common/network", "vs/platform/opener/browser/link", "vs/base/common/uri"], function (require, exports, nls, dom, linkedText_1, severity_1, severityIcon_1, searchExtTypes_1, network_1, link_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renderSearchMessage = void 0;
    const renderSearchMessage = (message, instantiationService, notificationService, openerService, commandService, disposableStore, triggerSearch) => {
        const div = dom.$('div.providerMessage');
        const linkedText = (0, linkedText_1.parseLinkedText)(message.text);
        dom.append(div, dom.$('.' +
            severityIcon_1.SeverityIcon.className(message.type === searchExtTypes_1.TextSearchCompleteMessageType.Information
                ? severity_1.default.Info
                : severity_1.default.Warning)
                .split(' ')
                .join('.')));
        for (const node of linkedText.nodes) {
            if (typeof node === 'string') {
                dom.append(div, document.createTextNode(node));
            }
            else {
                const link = instantiationService.createInstance(link_1.Link, div, node, {
                    opener: async (href) => {
                        if (!message.trusted) {
                            return;
                        }
                        const parsed = uri_1.URI.parse(href, true);
                        if (parsed.scheme === network_1.Schemas.command && message.trusted) {
                            const result = await commandService.executeCommand(parsed.path);
                            if (result?.triggerSearch) {
                                triggerSearch();
                            }
                        }
                        else if (parsed.scheme === network_1.Schemas.https) {
                            openerService.open(parsed);
                        }
                        else {
                            if (parsed.scheme === network_1.Schemas.command && !message.trusted) {
                                notificationService.error(nls.localize('unable to open trust', "Unable to open command link from untrusted source: {0}", href));
                            }
                            else {
                                notificationService.error(nls.localize('unable to open', "Unable to open unknown link: {0}", href));
                            }
                        }
                    }
                });
                disposableStore.add(link);
            }
        }
        return div;
    };
    exports.renderSearchMessage = renderSearchMessage;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoTWVzc2FnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvc2VhcmNoTWVzc2FnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQnpGLE1BQU0sbUJBQW1CLEdBQUcsQ0FDbEMsT0FBa0MsRUFDbEMsb0JBQTJDLEVBQzNDLG1CQUF5QyxFQUN6QyxhQUE2QixFQUM3QixjQUErQixFQUMvQixlQUFnQyxFQUNoQyxhQUF5QixFQUNYLEVBQUU7UUFDaEIsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sVUFBVSxHQUFHLElBQUEsNEJBQWUsRUFBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQ2IsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHO1lBQ1IsMkJBQVksQ0FBQyxTQUFTLENBQ3JCLE9BQU8sQ0FBQyxJQUFJLEtBQUssOENBQTZCLENBQUMsV0FBVztnQkFDekQsQ0FBQyxDQUFDLGtCQUFRLENBQUMsSUFBSTtnQkFDZixDQUFDLENBQUMsa0JBQVEsQ0FBQyxPQUFPLENBQUM7aUJBQ25CLEtBQUssQ0FBQyxHQUFHLENBQUM7aUJBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVoQixLQUFLLE1BQU0sSUFBSSxJQUFJLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNyQyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM5QixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDaEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sSUFBSSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxXQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtvQkFDakUsTUFBTSxFQUFFLEtBQUssRUFBQyxJQUFJLEVBQUMsRUFBRTt3QkFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzs0QkFBQyxPQUFPO3dCQUFDLENBQUM7d0JBQ2pDLE1BQU0sTUFBTSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUNyQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDOzRCQUMxRCxNQUFNLE1BQU0sR0FBRyxNQUFNLGNBQWMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUNoRSxJQUFLLE1BQWMsRUFBRSxhQUFhLEVBQUUsQ0FBQztnQ0FDcEMsYUFBYSxFQUFFLENBQUM7NEJBQ2pCLENBQUM7d0JBQ0YsQ0FBQzs2QkFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQzs0QkFDNUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDNUIsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQ0FDM0QsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsd0RBQXdELEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzs0QkFDakksQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLGtDQUFrQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7NEJBQ3JHLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO2lCQUNELENBQUMsQ0FBQztnQkFDSCxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNCLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDWixDQUFDLENBQUM7SUFoRFcsUUFBQSxtQkFBbUIsdUJBZ0Q5QiJ9