/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorExtensionsRegistry = void 0;
    exports.registerNotebookContribution = registerNotebookContribution;
    class EditorContributionRegistry {
        static { this.INSTANCE = new EditorContributionRegistry(); }
        constructor() {
            this.editorContributions = [];
        }
        registerEditorContribution(id, ctor) {
            this.editorContributions.push({ id, ctor: ctor });
        }
        getEditorContributions() {
            return this.editorContributions.slice(0);
        }
    }
    function registerNotebookContribution(id, ctor) {
        EditorContributionRegistry.INSTANCE.registerEditorContribution(id, ctor);
    }
    var NotebookEditorExtensionsRegistry;
    (function (NotebookEditorExtensionsRegistry) {
        function getEditorContributions() {
            return EditorContributionRegistry.INSTANCE.getEditorContributions();
        }
        NotebookEditorExtensionsRegistry.getEditorContributions = getEditorContributions;
        function getSomeEditorContributions(ids) {
            return EditorContributionRegistry.INSTANCE.getEditorContributions().filter(c => ids.indexOf(c.id) >= 0);
        }
        NotebookEditorExtensionsRegistry.getSomeEditorContributions = getSomeEditorContributions;
    })(NotebookEditorExtensionsRegistry || (exports.NotebookEditorExtensionsRegistry = NotebookEditorExtensionsRegistry = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JFeHRlbnNpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL25vdGVib29rRWRpdG9yRXh0ZW5zaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLG9FQUVDO0lBbkJELE1BQU0sMEJBQTBCO2lCQUNSLGFBQVEsR0FBRyxJQUFJLDBCQUEwQixFQUFFLENBQUM7UUFHbkU7WUFDQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFTSwwQkFBMEIsQ0FBb0MsRUFBVSxFQUFFLElBQTBGO1lBQzFLLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQXVDLEVBQUUsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFFTSxzQkFBc0I7WUFDNUIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFDLENBQUM7O0lBR0YsU0FBZ0IsNEJBQTRCLENBQW9DLEVBQVUsRUFBRSxJQUEwRjtRQUNyTCwwQkFBMEIsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFFRCxJQUFpQixnQ0FBZ0MsQ0FTaEQ7SUFURCxXQUFpQixnQ0FBZ0M7UUFFaEQsU0FBZ0Isc0JBQXNCO1lBQ3JDLE9BQU8sMEJBQTBCLENBQUMsUUFBUSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDckUsQ0FBQztRQUZlLHVEQUFzQix5QkFFckMsQ0FBQTtRQUVELFNBQWdCLDBCQUEwQixDQUFDLEdBQWE7WUFDdkQsT0FBTywwQkFBMEIsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN6RyxDQUFDO1FBRmUsMkRBQTBCLDZCQUV6QyxDQUFBO0lBQ0YsQ0FBQyxFQVRnQixnQ0FBZ0MsZ0RBQWhDLGdDQUFnQyxRQVNoRCJ9