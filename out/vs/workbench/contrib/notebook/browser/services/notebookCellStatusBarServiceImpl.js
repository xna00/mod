/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, errors_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellStatusBarService = void 0;
    class NotebookCellStatusBarService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeProviders = this._register(new event_1.Emitter());
            this.onDidChangeProviders = this._onDidChangeProviders.event;
            this._onDidChangeItems = this._register(new event_1.Emitter());
            this.onDidChangeItems = this._onDidChangeItems.event;
            this._providers = [];
        }
        registerCellStatusBarItemProvider(provider) {
            this._providers.push(provider);
            let changeListener;
            if (provider.onDidChangeStatusBarItems) {
                changeListener = provider.onDidChangeStatusBarItems(() => this._onDidChangeItems.fire());
            }
            this._onDidChangeProviders.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                changeListener?.dispose();
                const idx = this._providers.findIndex(p => p === provider);
                this._providers.splice(idx, 1);
            });
        }
        async getStatusBarItemsForCell(docUri, cellIndex, viewType, token) {
            const providers = this._providers.filter(p => p.viewType === viewType || p.viewType === '*');
            return await Promise.all(providers.map(async (p) => {
                try {
                    return await p.provideCellStatusBarItems(docUri, cellIndex, token) ?? { items: [] };
                }
                catch (e) {
                    (0, errors_1.onUnexpectedExternalError)(e);
                    return { items: [] };
                }
            }));
        }
    }
    exports.NotebookCellStatusBarService = NotebookCellStatusBarService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDZWxsU3RhdHVzQmFyU2VydmljZUltcGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvc2VydmljZXMvbm90ZWJvb2tDZWxsU3RhdHVzQmFyU2VydmljZUltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsNEJBQTZCLFNBQVEsc0JBQVU7UUFBNUQ7O1lBSWtCLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3BFLHlCQUFvQixHQUFnQixJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBRTdELHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2hFLHFCQUFnQixHQUFnQixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1lBRXJELGVBQVUsR0FBeUMsRUFBRSxDQUFDO1FBNkJ4RSxDQUFDO1FBM0JBLGlDQUFpQyxDQUFDLFFBQTRDO1lBQzdFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9CLElBQUksY0FBdUMsQ0FBQztZQUM1QyxJQUFJLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2dCQUN4QyxjQUFjLEdBQUcsUUFBUSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzFGLENBQUM7WUFFRCxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFbEMsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN4QixjQUFjLEVBQUUsT0FBTyxFQUFFLENBQUM7Z0JBQzFCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLHdCQUF3QixDQUFDLE1BQVcsRUFBRSxTQUFpQixFQUFFLFFBQWdCLEVBQUUsS0FBd0I7WUFDeEcsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxLQUFLLFFBQVEsSUFBSSxDQUFDLENBQUMsUUFBUSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQzdGLE9BQU8sTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFDLENBQUMsRUFBQyxFQUFFO2dCQUNoRCxJQUFJLENBQUM7b0JBQ0osT0FBTyxNQUFNLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNyRixDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1osSUFBQSxrQ0FBeUIsRUFBQyxDQUFDLENBQUMsQ0FBQztvQkFDN0IsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0Q7SUF2Q0Qsb0VBdUNDIn0=