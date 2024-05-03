define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/search/browser/replace", "vs/workbench/contrib/search/browser/replaceService", "vs/workbench/common/contributions"], function (require, exports, extensions_1, replace_1, replaceService_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerContributions = registerContributions;
    function registerContributions() {
        (0, extensions_1.registerSingleton)(replace_1.IReplaceService, replaceService_1.ReplaceService, 1 /* InstantiationType.Delayed */);
        (0, contributions_1.registerWorkbenchContribution2)(replaceService_1.ReplacePreviewContentProvider.ID, replaceService_1.ReplacePreviewContentProvider, 1 /* WorkbenchPhase.BlockStartup */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZUNvbnRyaWJ1dGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9icm93c2VyL3JlcGxhY2VDb250cmlidXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVNBLHNEQUdDO0lBSEQsU0FBZ0IscUJBQXFCO1FBQ3BDLElBQUEsOEJBQWlCLEVBQUMseUJBQWUsRUFBRSwrQkFBYyxvQ0FBNEIsQ0FBQztRQUM5RSxJQUFBLDhDQUE4QixFQUFDLDhDQUE2QixDQUFDLEVBQUUsRUFBRSw4Q0FBNkIsc0NBQXNELENBQUM7SUFDdEosQ0FBQyJ9