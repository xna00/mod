/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/debug/common/debug"], function (require, exports, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getContextForVariable = getContextForVariable;
    /**
     * Gets a context key overlay that has context for the given variable.
     */
    function getContextForVariable(parentContext, variable, additionalContext = []) {
        const session = variable.getSession();
        const contextKeys = [
            [debug_1.CONTEXT_DEBUG_PROTOCOL_VARIABLE_MENU_CONTEXT.key, variable.variableMenuContext || ''],
            [debug_1.CONTEXT_VARIABLE_EVALUATE_NAME_PRESENT.key, !!variable.evaluateName],
            [debug_1.CONTEXT_CAN_VIEW_MEMORY.key, !!session?.capabilities.supportsReadMemoryRequest && variable.memoryReference !== undefined],
            [debug_1.CONTEXT_VARIABLE_IS_READONLY.key, !!variable.presentationHint?.attributes?.includes('readOnly') || variable.presentationHint?.lazy],
            [debug_1.CONTEXT_DEBUG_TYPE.key, session?.configuration.type],
            ...additionalContext,
        ];
        return parentContext.createOverlay(contextKeys);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdDb250ZXh0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9jb21tb24vZGVidWdDb250ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLHNEQVlDO0lBZkQ7O09BRUc7SUFDSCxTQUFnQixxQkFBcUIsQ0FBQyxhQUFpQyxFQUFFLFFBQWtCLEVBQUUsb0JBQXlDLEVBQUU7UUFDdkksTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3RDLE1BQU0sV0FBVyxHQUF3QjtZQUN4QyxDQUFDLG9EQUE0QyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsbUJBQW1CLElBQUksRUFBRSxDQUFDO1lBQ3RGLENBQUMsOENBQXNDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO1lBQ3JFLENBQUMsK0JBQXVCLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLHlCQUF5QixJQUFJLFFBQVEsQ0FBQyxlQUFlLEtBQUssU0FBUyxDQUFDO1lBQzFILENBQUMsb0NBQTRCLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDO1lBQ3BJLENBQUMsMEJBQWtCLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxhQUFhLENBQUMsSUFBSSxDQUFDO1lBQ3JELEdBQUcsaUJBQWlCO1NBQ3BCLENBQUM7UUFFRixPQUFPLGFBQWEsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDakQsQ0FBQyJ9