/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/marshalling", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput"], function (require, exports, errors_1, marshalling_1, mergeEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorSerializer = void 0;
    class MergeEditorSerializer {
        canSerialize() {
            return true;
        }
        serialize(editor) {
            return JSON.stringify(this.toJSON(editor));
        }
        toJSON(editor) {
            return {
                base: editor.base,
                input1: editor.input1,
                input2: editor.input2,
                result: editor.result,
            };
        }
        deserialize(instantiationService, raw) {
            try {
                const data = (0, marshalling_1.parse)(raw);
                return instantiationService.createInstance(mergeEditorInput_1.MergeEditorInput, data.base, new mergeEditorInput_1.MergeEditorInputData(data.input1.uri, data.input1.title, data.input1.detail, data.input1.description), new mergeEditorInput_1.MergeEditorInputData(data.input2.uri, data.input2.title, data.input2.detail, data.input2.description), data.result);
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
                return undefined;
            }
        }
    }
    exports.MergeEditorSerializer = MergeEditorSerializer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VFZGl0b3JTZXJpYWxpemVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL21lcmdlRWRpdG9yU2VyaWFsaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSxxQkFBcUI7UUFDakMsWUFBWTtZQUNYLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELFNBQVMsQ0FBQyxNQUF3QjtZQUNqQyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxNQUFNLENBQUMsTUFBd0I7WUFDOUIsT0FBTztnQkFDTixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7Z0JBQ2pCLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtnQkFDckIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO2dCQUNyQixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07YUFDckIsQ0FBQztRQUNILENBQUM7UUFFRCxXQUFXLENBQUMsb0JBQTJDLEVBQUUsR0FBVztZQUNuRSxJQUFJLENBQUM7Z0JBQ0osTUFBTSxJQUFJLEdBQXlCLElBQUEsbUJBQUssRUFBQyxHQUFHLENBQUMsQ0FBQztnQkFDOUMsT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQ3pDLG1DQUFnQixFQUNoQixJQUFJLENBQUMsSUFBSSxFQUNULElBQUksdUNBQW9CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFDekcsSUFBSSx1Q0FBb0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUN6RyxJQUFJLENBQUMsTUFBTSxDQUNYLENBQUM7WUFDSCxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDZCxJQUFBLDBCQUFpQixFQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN2QixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBakNELHNEQWlDQyJ9