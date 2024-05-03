/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/nls", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/colorRegistry", "vs/base/common/lifecycle", "vs/workbench/contrib/files/browser/views/explorerViewer", "vs/workbench/contrib/files/browser/files", "vs/base/common/errorMessage"], function (require, exports, event_1, nls_1, workspace_1, colorRegistry_1, lifecycle_1, explorerViewer_1, files_1, errorMessage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerDecorationsProvider = void 0;
    exports.provideDecorations = provideDecorations;
    function provideDecorations(fileStat) {
        if (fileStat.isRoot && fileStat.error) {
            return {
                tooltip: (0, nls_1.localize)('canNotResolve', "Unable to resolve workspace folder ({0})", (0, errorMessage_1.toErrorMessage)(fileStat.error)),
                letter: '!',
                color: colorRegistry_1.listInvalidItemForeground,
            };
        }
        if (fileStat.isSymbolicLink) {
            return {
                tooltip: (0, nls_1.localize)('symbolicLlink', "Symbolic Link"),
                letter: '\u2937'
            };
        }
        if (fileStat.isUnknown) {
            return {
                tooltip: (0, nls_1.localize)('unknown', "Unknown File Type"),
                letter: '?'
            };
        }
        if (fileStat.isExcluded) {
            return {
                color: colorRegistry_1.listDeemphasizedForeground,
            };
        }
        return undefined;
    }
    let ExplorerDecorationsProvider = class ExplorerDecorationsProvider {
        constructor(explorerService, contextService) {
            this.explorerService = explorerService;
            this.label = (0, nls_1.localize)('label', "Explorer");
            this._onDidChange = new event_1.Emitter();
            this.toDispose = new lifecycle_1.DisposableStore();
            this.toDispose.add(this._onDidChange);
            this.toDispose.add(contextService.onDidChangeWorkspaceFolders(e => {
                this._onDidChange.fire(e.changed.concat(e.added).map(wf => wf.uri));
            }));
            this.toDispose.add(explorerViewer_1.explorerRootErrorEmitter.event((resource => {
                this._onDidChange.fire([resource]);
            })));
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        async provideDecorations(resource) {
            const fileStat = this.explorerService.findClosest(resource);
            if (!fileStat) {
                throw new Error('ExplorerItem not found');
            }
            return provideDecorations(fileStat);
        }
        dispose() {
            this.toDispose.dispose();
        }
    };
    exports.ExplorerDecorationsProvider = ExplorerDecorationsProvider;
    exports.ExplorerDecorationsProvider = ExplorerDecorationsProvider = __decorate([
        __param(0, files_1.IExplorerService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], ExplorerDecorationsProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJEZWNvcmF0aW9uc1Byb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL3ZpZXdzL2V4cGxvcmVyRGVjb3JhdGlvbnNQcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjaEcsZ0RBMkJDO0lBM0JELFNBQWdCLGtCQUFrQixDQUFDLFFBQXNCO1FBQ3hELElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdkMsT0FBTztnQkFDTixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLDBDQUEwQyxFQUFFLElBQUEsNkJBQWMsRUFBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzlHLE1BQU0sRUFBRSxHQUFHO2dCQUNYLEtBQUssRUFBRSx5Q0FBeUI7YUFDaEMsQ0FBQztRQUNILENBQUM7UUFDRCxJQUFJLFFBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUM3QixPQUFPO2dCQUNOLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsZUFBZSxDQUFDO2dCQUNuRCxNQUFNLEVBQUUsUUFBUTthQUNoQixDQUFDO1FBQ0gsQ0FBQztRQUNELElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3hCLE9BQU87Z0JBQ04sT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQztnQkFDakQsTUFBTSxFQUFFLEdBQUc7YUFDWCxDQUFDO1FBQ0gsQ0FBQztRQUNELElBQUksUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3pCLE9BQU87Z0JBQ04sS0FBSyxFQUFFLDBDQUEwQjthQUNqQyxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7SUFFTSxJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUEyQjtRQUt2QyxZQUNtQixlQUF5QyxFQUNqQyxjQUF3QztZQUR4QyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFMbkQsVUFBSyxHQUFXLElBQUEsY0FBUSxFQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN0QyxpQkFBWSxHQUFHLElBQUksZUFBTyxFQUFTLENBQUM7WUFDcEMsY0FBUyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBTWxELElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2pFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNyRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMseUNBQXdCLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzdELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTixDQUFDO1FBRUQsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztRQUNoQyxDQUFDO1FBRUQsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFFBQWE7WUFDckMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDNUQsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUMzQyxDQUFDO1lBRUQsT0FBTyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUNELENBQUE7SUFsQ1ksa0VBQTJCOzBDQUEzQiwyQkFBMkI7UUFNckMsV0FBQSx3QkFBZ0IsQ0FBQTtRQUNoQixXQUFBLG9DQUF3QixDQUFBO09BUGQsMkJBQTJCLENBa0N2QyJ9