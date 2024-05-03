/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveDocumentService = exports.IInteractiveDocumentService = void 0;
    exports.IInteractiveDocumentService = (0, instantiation_1.createDecorator)('IInteractiveDocumentService');
    class InteractiveDocumentService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onWillAddInteractiveDocument = this._register(new event_1.Emitter());
            this.onWillAddInteractiveDocument = this._onWillAddInteractiveDocument.event;
            this._onWillRemoveInteractiveDocument = this._register(new event_1.Emitter());
            this.onWillRemoveInteractiveDocument = this._onWillRemoveInteractiveDocument.event;
        }
        willCreateInteractiveDocument(notebookUri, inputUri, languageId) {
            this._onWillAddInteractiveDocument.fire({
                notebookUri,
                inputUri,
                languageId
            });
        }
        willRemoveInteractiveDocument(notebookUri, inputUri) {
            this._onWillRemoveInteractiveDocument.fire({
                notebookUri,
                inputUri
            });
        }
    }
    exports.InteractiveDocumentService = InteractiveDocumentService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RpdmVEb2N1bWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ludGVyYWN0aXZlL2Jyb3dzZXIvaW50ZXJhY3RpdmVEb2N1bWVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT25GLFFBQUEsMkJBQTJCLEdBQUcsSUFBQSwrQkFBZSxFQUE4Qiw2QkFBNkIsQ0FBQyxDQUFDO0lBVXZILE1BQWEsMEJBQTJCLFNBQVEsc0JBQVU7UUFPekQ7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQU5RLGtDQUE2QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTJELENBQUMsQ0FBQztZQUN4SSxpQ0FBNEIsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsS0FBSyxDQUFDO1lBQ3ZELHFDQUFnQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXVDLENBQUMsQ0FBQztZQUN2SCxvQ0FBK0IsR0FBRyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsS0FBSyxDQUFDO1FBSTlFLENBQUM7UUFFRCw2QkFBNkIsQ0FBQyxXQUFnQixFQUFFLFFBQWEsRUFBRSxVQUFrQjtZQUNoRixJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDO2dCQUN2QyxXQUFXO2dCQUNYLFFBQVE7Z0JBQ1IsVUFBVTthQUNWLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCw2QkFBNkIsQ0FBQyxXQUFnQixFQUFFLFFBQWE7WUFDNUQsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLElBQUksQ0FBQztnQkFDMUMsV0FBVztnQkFDWCxRQUFRO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBekJELGdFQXlCQyJ9