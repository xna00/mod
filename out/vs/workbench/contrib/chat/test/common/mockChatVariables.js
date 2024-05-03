/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockChatVariablesService = void 0;
    class MockChatVariablesService {
        registerVariable(data, resolver) {
            throw new Error('Method not implemented.');
        }
        getVariable(name) {
            throw new Error('Method not implemented.');
        }
        hasVariable(name) {
            throw new Error('Method not implemented.');
        }
        getVariables() {
            throw new Error('Method not implemented.');
        }
        getDynamicVariables(sessionId) {
            return [];
        }
        async resolveVariables(prompt, model, progress, token) {
            return {
                variables: []
            };
        }
        resolveVariable(variableName, promptText, model, progress, token) {
            throw new Error('Method not implemented.');
        }
    }
    exports.MockChatVariablesService = MockChatVariablesService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0NoYXRWYXJpYWJsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvdGVzdC9jb21tb24vbW9ja0NoYXRWYXJpYWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsd0JBQXdCO1FBRXBDLGdCQUFnQixDQUFDLElBQXVCLEVBQUUsUUFBK0I7WUFDeEUsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxXQUFXLENBQUMsSUFBWTtZQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELFdBQVcsQ0FBQyxJQUFZO1lBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsWUFBWTtZQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsbUJBQW1CLENBQUMsU0FBaUI7WUFDcEMsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsS0FBSyxDQUFDLGdCQUFnQixDQUFDLE1BQTBCLEVBQUUsS0FBaUIsRUFBRSxRQUF1RCxFQUFFLEtBQXdCO1lBQ3RKLE9BQU87Z0JBQ04sU0FBUyxFQUFFLEVBQUU7YUFDYixDQUFDO1FBQ0gsQ0FBQztRQUVELGVBQWUsQ0FBQyxZQUFvQixFQUFFLFVBQWtCLEVBQUUsS0FBaUIsRUFBRSxRQUF1RCxFQUFFLEtBQXdCO1lBQzdKLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO0tBQ0Q7SUEvQkQsNERBK0JDIn0=