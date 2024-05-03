define(["require", "exports", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/platform/label/common/label", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/search/browser/searchModel", "vs/platform/actions/common/actions", "vs/workbench/contrib/search/browser/searchActionsBase", "vs/base/common/platform"], function (require, exports, nls, clipboardService_1, label_1, viewsService_1, Constants, searchModel_1, actions_1, searchActionsBase_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lineDelimiter = void 0;
    //#region Actions
    (0, actions_1.registerAction2)(class CopyMatchCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.copyMatch" /* Constants.SearchCommandIds.CopyMatchCommandId */,
                title: nls.localize2('copyMatchLabel', "Copy"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: Constants.SearchContext.FileMatchOrMatchFocusKey,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
                },
                menu: [{
                        id: actions_1.MenuId.SearchContext,
                        when: Constants.SearchContext.FileMatchOrMatchFocusKey,
                        group: 'search_2',
                        order: 1
                    }]
            });
        }
        async run(accessor, match) {
            await copyMatchCommand(accessor, match);
        }
    });
    (0, actions_1.registerAction2)(class CopyPathCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.copyPath" /* Constants.SearchCommandIds.CopyPathCommandId */,
                title: nls.localize2('copyPathLabel', "Copy Path"),
                category: searchActionsBase_1.category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: Constants.SearchContext.FileMatchOrFolderMatchWithResourceFocusKey,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */,
                    win: {
                        primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */
                    },
                },
                menu: [{
                        id: actions_1.MenuId.SearchContext,
                        when: Constants.SearchContext.FileMatchOrFolderMatchWithResourceFocusKey,
                        group: 'search_2',
                        order: 2
                    }]
            });
        }
        async run(accessor, fileMatch) {
            await copyPathCommand(accessor, fileMatch);
        }
    });
    (0, actions_1.registerAction2)(class CopyAllCommandAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "search.action.copyAll" /* Constants.SearchCommandIds.CopyAllCommandId */,
                title: nls.localize2('copyAllLabel', "Copy All"),
                category: searchActionsBase_1.category,
                menu: [{
                        id: actions_1.MenuId.SearchContext,
                        when: Constants.SearchContext.HasSearchResults,
                        group: 'search_2',
                        order: 3
                    }]
            });
        }
        async run(accessor) {
            await copyAllCommand(accessor);
        }
    });
    //#endregion
    //#region Helpers
    exports.lineDelimiter = platform_1.isWindows ? '\r\n' : '\n';
    async function copyPathCommand(accessor, fileMatch) {
        if (!fileMatch) {
            const selection = getSelectedRow(accessor);
            if (!(selection instanceof searchModel_1.FileMatch || selection instanceof searchModel_1.FolderMatchWithResource)) {
                return;
            }
            fileMatch = selection;
        }
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const labelService = accessor.get(label_1.ILabelService);
        const text = labelService.getUriLabel(fileMatch.resource, { noPrefix: true });
        await clipboardService.writeText(text);
    }
    async function copyMatchCommand(accessor, match) {
        if (!match) {
            const selection = getSelectedRow(accessor);
            if (!selection) {
                return;
            }
            match = selection;
        }
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const labelService = accessor.get(label_1.ILabelService);
        let text;
        if (match instanceof searchModel_1.Match) {
            text = matchToString(match);
        }
        else if (match instanceof searchModel_1.FileMatch) {
            text = fileMatchToString(match, labelService).text;
        }
        else if (match instanceof searchModel_1.FolderMatch) {
            text = folderMatchToString(match, labelService).text;
        }
        if (text) {
            await clipboardService.writeText(text);
        }
    }
    async function copyAllCommand(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const labelService = accessor.get(label_1.ILabelService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        if (searchView) {
            const root = searchView.searchResult;
            const text = allFolderMatchesToString(root.folderMatches(), labelService);
            await clipboardService.writeText(text);
        }
    }
    function matchToString(match, indent = 0) {
        const getFirstLinePrefix = () => `${match.range().startLineNumber},${match.range().startColumn}`;
        const getOtherLinePrefix = (i) => match.range().startLineNumber + i + '';
        const fullMatchLines = match.fullPreviewLines();
        const largestPrefixSize = fullMatchLines.reduce((largest, _, i) => {
            const thisSize = i === 0 ?
                getFirstLinePrefix().length :
                getOtherLinePrefix(i).length;
            return Math.max(thisSize, largest);
        }, 0);
        const formattedLines = fullMatchLines
            .map((line, i) => {
            const prefix = i === 0 ?
                getFirstLinePrefix() :
                getOtherLinePrefix(i);
            const paddingStr = ' '.repeat(largestPrefixSize - prefix.length);
            const indentStr = ' '.repeat(indent);
            return `${indentStr}${prefix}: ${paddingStr}${line}`;
        });
        return formattedLines.join('\n');
    }
    function fileFolderMatchToString(match, labelService) {
        if (match instanceof searchModel_1.FileMatch) {
            return fileMatchToString(match, labelService);
        }
        else {
            return folderMatchToString(match, labelService);
        }
    }
    function fileMatchToString(fileMatch, labelService) {
        const matchTextRows = fileMatch.matches()
            .sort(searchModel_1.searchMatchComparer)
            .map(match => matchToString(match, 2));
        const uriString = labelService.getUriLabel(fileMatch.resource, { noPrefix: true });
        return {
            text: `${uriString}${exports.lineDelimiter}${matchTextRows.join(exports.lineDelimiter)}`,
            count: matchTextRows.length
        };
    }
    function folderMatchToString(folderMatch, labelService) {
        const results = [];
        let numMatches = 0;
        const matches = folderMatch.matches().sort(searchModel_1.searchMatchComparer);
        matches.forEach(match => {
            const result = fileFolderMatchToString(match, labelService);
            numMatches += result.count;
            results.push(result.text);
        });
        return {
            text: results.join(exports.lineDelimiter + exports.lineDelimiter),
            count: numMatches
        };
    }
    function allFolderMatchesToString(folderMatches, labelService) {
        const folderResults = [];
        folderMatches = folderMatches.sort(searchModel_1.searchMatchComparer);
        for (let i = 0; i < folderMatches.length; i++) {
            const folderResult = folderMatchToString(folderMatches[i], labelService);
            if (folderResult.count) {
                folderResults.push(folderResult.text);
            }
        }
        return folderResults.join(exports.lineDelimiter + exports.lineDelimiter);
    }
    function getSelectedRow(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const searchView = (0, searchActionsBase_1.getSearchView)(viewsService);
        return searchView?.getControl().getSelection()[0];
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9uc0NvcHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9icm93c2VyL3NlYXJjaEFjdGlvbnNDb3B5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFpQkEsaUJBQWlCO0lBQ2pCLElBQUEseUJBQWUsRUFBQyxNQUFNLHNCQUF1QixTQUFRLGlCQUFPO1FBRTNEO1lBRUMsS0FBSyxDQUFDO2dCQUNMLEVBQUUsK0VBQStDO2dCQUNqRCxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUM7Z0JBQzlDLFFBQVEsRUFBUiw0QkFBUTtnQkFDUixVQUFVLEVBQUU7b0JBQ1gsTUFBTSw2Q0FBbUM7b0JBQ3pDLElBQUksRUFBRSxTQUFTLENBQUMsYUFBYSxDQUFDLHdCQUF3QjtvQkFDdEQsT0FBTyxFQUFFLGlEQUE2QjtpQkFDdEM7Z0JBQ0QsSUFBSSxFQUFFLENBQUM7d0JBQ04sRUFBRSxFQUFFLGdCQUFNLENBQUMsYUFBYTt3QkFDeEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsd0JBQXdCO3dCQUN0RCxLQUFLLEVBQUUsVUFBVTt3QkFDakIsS0FBSyxFQUFFLENBQUM7cUJBQ1IsQ0FBQzthQUNGLENBQUMsQ0FBQztRQUVKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsS0FBa0M7WUFDaEYsTUFBTSxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekMsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxNQUFNLHFCQUFzQixTQUFRLGlCQUFPO1FBRTFEO1lBRUMsS0FBSyxDQUFDO2dCQUNMLEVBQUUsNkVBQThDO2dCQUNoRCxLQUFLLEVBQUUsR0FBRyxD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