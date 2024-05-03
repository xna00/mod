define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/search/common/notebookSearch", "vs/workbench/contrib/search/browser/notebookSearch/notebookSearchService"], function (require, exports, extensions_1, notebookSearch_1, notebookSearchService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerContributions = registerContributions;
    function registerContributions() {
        (0, extensions_1.registerSingleton)(notebookSearch_1.INotebookSearchService, notebookSearchService_1.NotebookSearchService, 1 /* InstantiationType.Delayed */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTZWFyY2hDb250cmlidXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvYnJvd3Nlci9ub3RlYm9va1NlYXJjaC9ub3RlYm9va1NlYXJjaENvbnRyaWJ1dGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBUUEsc0RBRUM7SUFGRCxTQUFnQixxQkFBcUI7UUFDcEMsSUFBQSw4QkFBaUIsRUFBQyx1Q0FBc0IsRUFBRSw2Q0FBcUIsb0NBQTRCLENBQUM7SUFDN0YsQ0FBQyJ9