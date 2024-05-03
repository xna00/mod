/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/platform/list/browser/listService", "vs/workbench/contrib/debug/browser/baseDebugView"], function (require, exports, dom, nls_1, listService_1, baseDebugView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookVariableAccessibilityProvider = exports.NotebookVariableRenderer = exports.NotebookVariablesDelegate = exports.NotebookVariablesTree = void 0;
    const $ = dom.$;
    const MAX_VALUE_RENDER_LENGTH_IN_VIEWLET = 1024;
    class NotebookVariablesTree extends listService_1.WorkbenchObjectTree {
    }
    exports.NotebookVariablesTree = NotebookVariablesTree;
    class NotebookVariablesDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return NotebookVariableRenderer.ID;
        }
    }
    exports.NotebookVariablesDelegate = NotebookVariablesDelegate;
    class NotebookVariableRenderer {
        static { this.ID = 'variableElement'; }
        get templateId() {
            return NotebookVariableRenderer.ID;
        }
        renderTemplate(container) {
            const expression = dom.append(container, $('.expression'));
            const name = dom.append(expression, $('span.name'));
            const value = dom.append(expression, $('span.value'));
            const template = { expression, name, value };
            return template;
        }
        renderElement(element, _index, data) {
            const text = element.element.value.trim() !== '' ? `${element.element.name}:` : element.element.name;
            data.name.textContent = text;
            data.name.title = element.element.type ?? '';
            (0, baseDebugView_1.renderExpressionValue)(element.element, data.value, {
                colorize: true,
                showHover: true,
                maxValueLength: MAX_VALUE_RENDER_LENGTH_IN_VIEWLET
            });
        }
        disposeTemplate() {
            // noop
        }
    }
    exports.NotebookVariableRenderer = NotebookVariableRenderer;
    class NotebookVariableAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('debugConsole', "Notebook Variables");
        }
        getAriaLabel(element) {
            return (0, nls_1.localize)('notebookVariableAriaLabel', "Variable {0}, value {1}", element.name, element.value);
        }
    }
    exports.NotebookVariableAccessibilityProvider = NotebookVariableAccessibilityProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWYXJpYWJsZXNUcmVlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvbm90ZWJvb2tWYXJpYWJsZXMvbm90ZWJvb2tWYXJpYWJsZXNUcmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2hCLE1BQU0sa0NBQWtDLEdBQUcsSUFBSSxDQUFDO0lBRWhELE1BQWEscUJBQXNCLFNBQVEsaUNBQTZDO0tBQUk7SUFBNUYsc0RBQTRGO0lBRTVGLE1BQWEseUJBQXlCO1FBRXJDLFNBQVMsQ0FBQyxPQUFpQztZQUMxQyxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBaUM7WUFDOUMsT0FBTyx3QkFBd0IsQ0FBQyxFQUFFLENBQUM7UUFDcEMsQ0FBQztLQUNEO0lBVEQsOERBU0M7SUFRRCxNQUFhLHdCQUF3QjtpQkFFcEIsT0FBRSxHQUFHLGlCQUFpQixDQUFDO1FBRXZDLElBQUksVUFBVTtZQUNiLE9BQU8sd0JBQXdCLENBQUMsRUFBRSxDQUFDO1FBQ3BDLENBQUM7UUFFRCxjQUFjLENBQUMsU0FBc0I7WUFDcEMsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDM0QsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDcEQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFFdEQsTUFBTSxRQUFRLEdBQTBCLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQztZQUVwRSxPQUFPLFFBQVEsQ0FBQztRQUNqQixDQUFDO1FBRUQsYUFBYSxDQUFDLE9BQXdELEVBQUUsTUFBYyxFQUFFLElBQTJCO1lBQ2xILE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztZQUNyRyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1lBRTdDLElBQUEscUNBQXFCLEVBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNsRCxRQUFRLEVBQUUsSUFBSTtnQkFDZCxTQUFTLEVBQUUsSUFBSTtnQkFDZixjQUFjLEVBQUUsa0NBQWtDO2FBQ2xELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxlQUFlO1lBQ2QsT0FBTztRQUNSLENBQUM7O0lBaENGLDREQWlDQztJQUVELE1BQWEscUNBQXFDO1FBRWpELGtCQUFrQjtZQUNqQixPQUFPLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFFRCxZQUFZLENBQUMsT0FBaUM7WUFDN0MsT0FBTyxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSx5QkFBeUIsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RyxDQUFDO0tBQ0Q7SUFURCxzRkFTQyJ9