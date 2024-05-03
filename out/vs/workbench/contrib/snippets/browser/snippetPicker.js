/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/contrib/snippets/browser/snippets", "vs/platform/quickinput/common/quickInput", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/event"], function (require, exports, nls, snippets_1, quickInput_1, codicons_1, themables_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pickSnippet = pickSnippet;
    async function pickSnippet(accessor, languageIdOrSnippets) {
        const snippetService = accessor.get(snippets_1.ISnippetsService);
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        let snippets;
        if (Array.isArray(languageIdOrSnippets)) {
            snippets = languageIdOrSnippets;
        }
        else {
            snippets = (await snippetService.getSnippets(languageIdOrSnippets, { includeDisabledSnippets: true, includeNoPrefixSnippets: true }));
        }
        snippets.sort((a, b) => a.snippetSource - b.snippetSource);
        const makeSnippetPicks = () => {
            const result = [];
            let prevSnippet;
            for (const snippet of snippets) {
                const pick = {
                    label: snippet.prefix || snippet.name,
                    detail: snippet.description || snippet.body,
                    snippet
                };
                if (!prevSnippet || prevSnippet.snippetSource !== snippet.snippetSource || prevSnippet.source !== snippet.source) {
                    let label = '';
                    switch (snippet.snippetSource) {
                        case 1 /* SnippetSource.User */:
                            label = nls.localize('sep.userSnippet', "User Snippets");
                            break;
                        case 3 /* SnippetSource.Extension */:
                            label = snippet.source;
                            break;
                        case 2 /* SnippetSource.Workspace */:
                            label = nls.localize('sep.workspaceSnippet', "Workspace Snippets");
                            break;
                    }
                    result.push({ type: 'separator', label });
                }
                if (snippet.snippetSource === 3 /* SnippetSource.Extension */) {
                    const isEnabled = snippetService.isEnabled(snippet);
                    if (isEnabled) {
                        pick.buttons = [{
                                iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.eyeClosed),
                                tooltip: nls.localize('disableSnippet', 'Hide from IntelliSense')
                            }];
                    }
                    else {
                        pick.description = nls.localize('isDisabled', "(hidden from IntelliSense)");
                        pick.buttons = [{
                                iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.eye),
                                tooltip: nls.localize('enable.snippet', 'Show in IntelliSense')
                            }];
                    }
                }
                result.push(pick);
                prevSnippet = snippet;
            }
            return result;
        };
        const picker = quickInputService.createQuickPick();
        picker.placeholder = nls.localize('pick.placeholder', "Select a snippet");
        picker.matchOnDetail = true;
        picker.ignoreFocusOut = false;
        picker.keepScrollPosition = true;
        picker.onDidTriggerItemButton(ctx => {
            const isEnabled = snippetService.isEnabled(ctx.item.snippet);
            snippetService.updateEnablement(ctx.item.snippet, !isEnabled);
            picker.items = makeSnippetPicks();
        });
        picker.items = makeSnippetPicks();
        if (!picker.items.length) {
            picker.validationMessage = nls.localize('pick.noSnippetAvailable', "No snippet available");
        }
        picker.show();
        // wait for an item to be picked or the picker to become hidden
        await Promise.race([event_1.Event.toPromise(picker.onDidAccept), event_1.Event.toPromise(picker.onDidHide)]);
        const result = picker.selectedItems[0]?.snippet;
        picker.dispose();
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldFBpY2tlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc25pcHBldHMvYnJvd3Nlci9zbmlwcGV0UGlja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLGtDQXNGQztJQXRGTSxLQUFLLFVBQVUsV0FBVyxDQUFDLFFBQTBCLEVBQUUsb0JBQXdDO1FBRXJHLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztRQUN0RCxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztRQU0zRCxJQUFJLFFBQW1CLENBQUM7UUFDeEIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQztZQUN6QyxRQUFRLEdBQUcsb0JBQW9CLENBQUM7UUFDakMsQ0FBQzthQUFNLENBQUM7WUFDUCxRQUFRLEdBQUcsQ0FBQyxNQUFNLGNBQWMsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZJLENBQUM7UUFFRCxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFM0QsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLEVBQUU7WUFDN0IsTUFBTSxNQUFNLEdBQW1DLEVBQUUsQ0FBQztZQUNsRCxJQUFJLFdBQWdDLENBQUM7WUFDckMsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxJQUFJ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