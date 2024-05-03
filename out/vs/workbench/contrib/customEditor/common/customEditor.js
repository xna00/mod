/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorResolverService"], function (require, exports, arrays_1, nls, contextkey_1, instantiation_1, editorResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEditorInfoCollection = exports.CustomEditorInfo = exports.CustomEditorPriority = exports.CONTEXT_FOCUSED_CUSTOM_EDITOR_IS_EDITABLE = exports.CONTEXT_ACTIVE_CUSTOM_EDITOR_ID = exports.ICustomEditorService = void 0;
    exports.ICustomEditorService = (0, instantiation_1.createDecorator)('customEditorService');
    exports.CONTEXT_ACTIVE_CUSTOM_EDITOR_ID = new contextkey_1.RawContextKey('activeCustomEditorId', '', {
        type: 'string',
        description: nls.localize('context.customEditor', "The viewType of the currently active custom editor."),
    });
    exports.CONTEXT_FOCUSED_CUSTOM_EDITOR_IS_EDITABLE = new contextkey_1.RawContextKey('focusedCustomEditorIsEditable', false);
    var CustomEditorPriority;
    (function (CustomEditorPriority) {
        CustomEditorPriority["default"] = "default";
        CustomEditorPriority["builtin"] = "builtin";
        CustomEditorPriority["option"] = "option";
    })(CustomEditorPriority || (exports.CustomEditorPriority = CustomEditorPriority = {}));
    class CustomEditorInfo {
        constructor(descriptor) {
            this.id = descriptor.id;
            this.displayName = descriptor.displayName;
            this.providerDisplayName = descriptor.providerDisplayName;
            this.priority = descriptor.priority;
            this.selector = descriptor.selector;
        }
        matches(resource) {
            return this.selector.some(selector => selector.filenamePattern && (0, editorResolverService_1.globMatchesResource)(selector.filenamePattern, resource));
        }
    }
    exports.CustomEditorInfo = CustomEditorInfo;
    class CustomEditorInfoCollection {
        constructor(editors) {
            this.allEditors = (0, arrays_1.distinct)(editors, editor => editor.id);
        }
        get length() { return this.allEditors.length; }
        /**
         * Find the single default editor to use (if any) by looking at the editor's priority and the
         * other contributed editors.
         */
        get defaultEditor() {
            return this.allEditors.find(editor => {
                switch (editor.priority) {
                    case editorResolverService_1.RegisteredEditorPriority.default:
                    case editorResolverService_1.RegisteredEditorPriority.builtin:
                        // A default editor must have higher priority than all other contributed editors.
                        return this.allEditors.every(otherEditor => otherEditor === editor || isLowerPriority(otherEditor, editor));
                    default:
                        return false;
                }
            });
        }
        /**
         * Find the best available editor to use.
         *
         * Unlike the `defaultEditor`, a bestAvailableEditor can exist even if there are other editors with
         * the same priority.
         */
        get bestAvailableEditor() {
            const editors = Array.from(this.allEditors).sort((a, b) => {
                return (0, editorResolverService_1.priorityToRank)(a.priority) - (0, editorResolverService_1.priorityToRank)(b.priority);
            });
            return editors[0];
        }
    }
    exports.CustomEditorInfoCollection = CustomEditorInfoCollection;
    function isLowerPriority(otherEditor, editor) {
        return (0, editorResolverService_1.priorityToRank)(otherEditor.priority) < (0, editorResolverService_1.priorityToRank)(editor.priority);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jdXN0b21FZGl0b3IvY29tbW9uL2N1c3RvbUVkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhbkYsUUFBQSxvQkFBb0IsR0FBRyxJQUFBLCtCQUFlLEVBQXVCLHFCQUFxQixDQUFDLENBQUM7SUFFcEYsUUFBQSwrQkFBK0IsR0FBRyxJQUFJLDBCQUFhLENBQVMsc0JBQXNCLEVBQUUsRUFBRSxFQUFFO1FBQ3BHLElBQUksRUFBRSxRQUFRO1FBQ2QsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUscURBQXFELENBQUM7S0FDeEcsQ0FBQyxDQUFDO0lBRVUsUUFBQSx5Q0FBeUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsK0JBQStCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFxRDVILElBQWtCLG9CQUlqQjtJQUpELFdBQWtCLG9CQUFvQjtRQUNyQywyQ0FBbUIsQ0FBQTtRQUNuQiwyQ0FBbUIsQ0FBQTtRQUNuQix5Q0FBaUIsQ0FBQTtJQUNsQixDQUFDLEVBSmlCLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBSXJDO0lBY0QsTUFBYSxnQkFBZ0I7UUFRNUIsWUFBWSxVQUFrQztZQUM3QyxJQUFJLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFDO1lBQzFDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxVQUFVLENBQUMsbUJBQW1CLENBQUM7WUFDMUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQztRQUNyQyxDQUFDO1FBRUQsT0FBTyxDQUFDLFFBQWE7WUFDcEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxlQUFlLElBQUksSUFBQSwyQ0FBbUIsRUFBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDNUgsQ0FBQztLQUNEO0lBbkJELDRDQW1CQztJQUVELE1BQWEsMEJBQTBCO1FBSXRDLFlBQ0MsT0FBb0M7WUFFcEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFBLGlCQUFRLEVBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFRCxJQUFXLE1BQU0sS0FBYSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUU5RDs7O1dBR0c7UUFDSCxJQUFXLGFBQWE7WUFDdkIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDcEMsUUFBUSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3pCLEtBQUssZ0RBQXdCLENBQUMsT0FBTyxDQUFDO29CQUN0QyxLQUFLLGdEQUF3QixDQUFDLE9BQU87d0JBQ3BDLGlGQUFpRjt3QkFDakYsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUMxQyxXQUFXLEtBQUssTUFBTSxJQUFJLGVBQWUsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFFbEU7d0JBQ0MsT0FBTyxLQUFLLENBQUM7Z0JBQ2YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0gsSUFBVyxtQkFBbUI7WUFDN0IsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN6RCxPQUFPLElBQUEsc0NBQWMsRUFBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBQSxzQ0FBYyxFQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoRSxDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25CLENBQUM7S0FDRDtJQTNDRCxnRUEyQ0M7SUFFRCxTQUFTLGVBQWUsQ0FBQyxXQUE2QixFQUFFLE1BQXdCO1FBQy9FLE9BQU8sSUFBQSxzQ0FBYyxFQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFBLHNDQUFjLEVBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQy9FLENBQUMifQ==