/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OvertypingCapturer = void 0;
    class OvertypingCapturer {
        static { this._maxSelectionLength = 51200; }
        constructor(editor, suggestModel) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._lastOvertyped = [];
            this._locked = false;
            this._disposables.add(editor.onWillType(() => {
                if (this._locked || !editor.hasModel()) {
                    return;
                }
                const selections = editor.getSelections();
                const selectionsLength = selections.length;
                // Check if it will overtype any selections
                let willOvertype = false;
                for (let i = 0; i < selectionsLength; i++) {
                    if (!selections[i].isEmpty()) {
                        willOvertype = true;
                        break;
                    }
                }
                if (!willOvertype) {
                    if (this._lastOvertyped.length !== 0) {
                        this._lastOvertyped.length = 0;
                    }
                    return;
                }
                this._lastOvertyped = [];
                const model = editor.getModel();
                for (let i = 0; i < selectionsLength; i++) {
                    const selection = selections[i];
                    // Check for overtyping capturer restrictions
                    if (model.getValueLengthInRange(selection) > OvertypingCapturer._maxSelectionLength) {
                        return;
                    }
                    this._lastOvertyped[i] = { value: model.getValueInRange(selection), multiline: selection.startLineNumber !== selection.endLineNumber };
                }
            }));
            this._disposables.add(suggestModel.onDidTrigger(e => {
                this._locked = true;
            }));
            this._disposables.add(suggestModel.onDidCancel(e => {
                this._locked = false;
            }));
        }
        getLastOvertypedInfo(idx) {
            if (idx >= 0 && idx < this._lastOvertyped.length) {
                return this._lastOvertyped[idx];
            }
            return undefined;
        }
        dispose() {
            this._disposables.dispose();
        }
    }
    exports.OvertypingCapturer = OvertypingCapturer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdE92ZXJ0eXBpbmdDYXB0dXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3VnZ2VzdC9icm93c2VyL3N1Z2dlc3RPdmVydHlwaW5nQ2FwdHVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsa0JBQWtCO2lCQUVOLHdCQUFtQixHQUFHLEtBQUssQUFBUixDQUFTO1FBTXBELFlBQVksTUFBbUIsRUFBRSxZQUEwQjtZQUwxQyxpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRTlDLG1CQUFjLEdBQTRDLEVBQUUsQ0FBQztZQUM3RCxZQUFPLEdBQVksS0FBSyxDQUFDO1lBSWhDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUM1QyxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztvQkFDeEMsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDMUMsTUFBTSxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO2dCQUUzQywyQ0FBMkM7Z0JBQzNDLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztnQkFDekIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGdCQUFnQixFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzNDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQzt3QkFDOUIsWUFBWSxHQUFHLElBQUksQ0FBQzt3QkFDcEIsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUNuQixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUN0QyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7b0JBQ2hDLENBQUM7b0JBQ0QsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO2dCQUN6QixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQyxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2hDLDZDQUE2QztvQkFDN0MsSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUFDLEdBQUcsa0JBQWtCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQzt3QkFDckYsT0FBTztvQkFDUixDQUFDO29CQUNELElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLGVBQWUsS0FBSyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hJLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDbkQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2xELElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3RCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsb0JBQW9CLENBQUMsR0FBVztZQUMvQixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2xELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQyxDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzdCLENBQUM7O0lBL0RGLGdEQWdFQyJ9