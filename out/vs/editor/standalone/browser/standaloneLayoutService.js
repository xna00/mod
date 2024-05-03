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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/arrays", "vs/base/common/event", "vs/editor/browser/services/codeEditorService", "vs/platform/instantiation/common/extensions", "vs/platform/layout/browser/layoutService"], function (require, exports, dom, window_1, arrays_1, event_1, codeEditorService_1, extensions_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorScopedLayoutService = void 0;
    let StandaloneLayoutService = class StandaloneLayoutService {
        get mainContainer() {
            return (0, arrays_1.firstOrDefault)(this._codeEditorService.listCodeEditors())?.getContainerDomNode() ?? window_1.mainWindow.document.body;
        }
        get activeContainer() {
            const activeCodeEditor = this._codeEditorService.getFocusedCodeEditor() ?? this._codeEditorService.getActiveCodeEditor();
            return activeCodeEditor?.getContainerDomNode() ?? this.mainContainer;
        }
        get mainContainerDimension() {
            return dom.getClientArea(this.mainContainer);
        }
        get activeContainerDimension() {
            return dom.getClientArea(this.activeContainer);
        }
        get containers() {
            return (0, arrays_1.coalesce)(this._codeEditorService.listCodeEditors().map(codeEditor => codeEditor.getContainerDomNode()));
        }
        getContainer() {
            return this.activeContainer;
        }
        whenContainerStylesLoaded() { return undefined; }
        focus() {
            this._codeEditorService.getFocusedCodeEditor()?.focus();
        }
        constructor(_codeEditorService) {
            this._codeEditorService = _codeEditorService;
            this.onDidLayoutMainContainer = event_1.Event.None;
            this.onDidLayoutActiveContainer = event_1.Event.None;
            this.onDidLayoutContainer = event_1.Event.None;
            this.onDidChangeActiveContainer = event_1.Event.None;
            this.onDidAddContainer = event_1.Event.None;
            this.mainContainerOffset = { top: 0, quickPickTop: 0 };
            this.activeContainerOffset = { top: 0, quickPickTop: 0 };
        }
    };
    StandaloneLayoutService = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService)
    ], StandaloneLayoutService);
    let EditorScopedLayoutService = class EditorScopedLayoutService extends StandaloneLayoutService {
        get mainContainer() {
            return this._container;
        }
        constructor(_container, codeEditorService) {
            super(codeEditorService);
            this._container = _container;
        }
    };
    exports.EditorScopedLayoutService = EditorScopedLayoutService;
    exports.EditorScopedLayoutService = EditorScopedLayoutService = __decorate([
        __param(1, codeEditorService_1.ICodeEditorService)
    ], EditorScopedLayoutService);
    (0, extensions_1.registerSingleton)(layoutService_1.ILayoutService, StandaloneLayoutService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUxheW91dFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9zdGFuZGFsb25lL2Jyb3dzZXIvc3RhbmRhbG9uZUxheW91dFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVWhHLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCO1FBUzVCLElBQUksYUFBYTtZQUNoQixPQUFPLElBQUEsdUJBQWMsRUFBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxtQkFBbUIsRUFBRSxJQUFJLG1CQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztRQUNySCxDQUFDO1FBRUQsSUFBSSxlQUFlO1lBQ2xCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixFQUFFLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFFekgsT0FBTyxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBRSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDdEUsQ0FBQztRQUVELElBQUksc0JBQXNCO1lBQ3pCLE9BQU8sR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELElBQUksd0JBQXdCO1lBQzNCLE9BQU8sR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUtELElBQUksVUFBVTtZQUNiLE9BQU8sSUFBQSxpQkFBUSxFQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEgsQ0FBQztRQUVELFlBQVk7WUFDWCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUVELHlCQUF5QixLQUFLLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUVqRCxLQUFLO1lBQ0osSUFBSSxDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDekQsQ0FBQztRQUVELFlBQ3FCLGtCQUE4QztZQUF0Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBMUMxRCw2QkFBd0IsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3RDLCtCQUEwQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDeEMseUJBQW9CLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNsQywrQkFBMEIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3hDLHNCQUFpQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFvQi9CLHdCQUFtQixHQUFzQixFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ3JFLDBCQUFxQixHQUFzQixFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBa0I1RSxDQUFDO0tBRUwsQ0FBQTtJQWhESyx1QkFBdUI7UUE2QzFCLFdBQUEsc0NBQWtCLENBQUE7T0E3Q2YsdUJBQXVCLENBZ0Q1QjtJQUVNLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsdUJBQXVCO1FBQ3JFLElBQWEsYUFBYTtZQUN6QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztRQUNELFlBQ1MsVUFBdUIsRUFDWCxpQkFBcUM7WUFFekQsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFIakIsZUFBVSxHQUFWLFVBQVUsQ0FBYTtRQUloQyxDQUFDO0tBQ0QsQ0FBQTtJQVZZLDhEQUF5Qjt3Q0FBekIseUJBQXlCO1FBTW5DLFdBQUEsc0NBQWtCLENBQUE7T0FOUix5QkFBeUIsQ0FVckM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDhCQUFjLEVBQUUsdUJBQXVCLG9DQUE0QixDQUFDIn0=