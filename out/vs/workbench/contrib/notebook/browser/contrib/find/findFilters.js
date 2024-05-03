/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookFindFilters = void 0;
    class NotebookFindFilters extends lifecycle_1.Disposable {
        get markupInput() {
            return this._markupInput;
        }
        set markupInput(value) {
            if (this._markupInput !== value) {
                this._markupInput = value;
                this._onDidChange.fire({ markupInput: value });
            }
        }
        get markupPreview() {
            return this._markupPreview;
        }
        set markupPreview(value) {
            if (this._markupPreview !== value) {
                this._markupPreview = value;
                this._onDidChange.fire({ markupPreview: value });
            }
        }
        get codeInput() {
            return this._codeInput;
        }
        set codeInput(value) {
            if (this._codeInput !== value) {
                this._codeInput = value;
                this._onDidChange.fire({ codeInput: value });
            }
        }
        get codeOutput() {
            return this._codeOutput;
        }
        set codeOutput(value) {
            if (this._codeOutput !== value) {
                this._codeOutput = value;
                this._onDidChange.fire({ codeOutput: value });
            }
        }
        constructor(markupInput, markupPreview, codeInput, codeOutput) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._markupInput = true;
            this._markupPreview = true;
            this._codeInput = true;
            this._codeOutput = true;
            this._markupInput = markupInput;
            this._markupPreview = markupPreview;
            this._codeInput = codeInput;
            this._codeOutput = codeOutput;
            this._initialMarkupInput = markupInput;
            this._initialMarkupPreview = markupPreview;
            this._initialCodeInput = codeInput;
            this._initialCodeOutput = codeOutput;
        }
        isModified() {
            return (this._markupInput !== this._initialMarkupInput
                || this._markupPreview !== this._initialMarkupPreview
                || this._codeInput !== this._initialCodeInput
                || this._codeOutput !== this._initialCodeOutput);
        }
        update(v) {
            this._markupInput = v.markupInput;
            this._markupPreview = v.markupPreview;
            this._codeInput = v.codeInput;
            this._codeOutput = v.codeOutput;
        }
    }
    exports.NotebookFindFilters = NotebookFindFilters;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZEZpbHRlcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9maW5kL2ZpbmRGaWx0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFhLG1CQUFvQixTQUFRLHNCQUFVO1FBTWxELElBQUksV0FBVztZQUNkLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztRQUMxQixDQUFDO1FBRUQsSUFBSSxXQUFXLENBQUMsS0FBYztZQUM3QixJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO2dCQUMxQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ2hELENBQUM7UUFDRixDQUFDO1FBSUQsSUFBSSxhQUFhO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUM1QixDQUFDO1FBRUQsSUFBSSxhQUFhLENBQUMsS0FBYztZQUMvQixJQUFJLElBQUksQ0FBQyxjQUFjLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO2dCQUM1QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELENBQUM7UUFDRixDQUFDO1FBR0QsSUFBSSxTQUFTO1lBQ1osT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxJQUFJLFNBQVMsQ0FBQyxLQUFjO1lBQzNCLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDOUMsQ0FBQztRQUNGLENBQUM7UUFJRCxJQUFJLFVBQVU7WUFDYixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUVELElBQUksVUFBVSxDQUFDLEtBQWM7WUFDNUIsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztnQkFDekIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUMvQyxDQUFDO1FBQ0YsQ0FBQztRQVFELFlBQ0MsV0FBb0IsRUFDcEIsYUFBc0IsRUFDdEIsU0FBa0IsRUFDbEIsVUFBbUI7WUFFbkIsS0FBSyxFQUFFLENBQUM7WUFsRVEsaUJBQVksR0FBNkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBbUMsQ0FBQyxDQUFDO1lBQ2hJLGdCQUFXLEdBQTJDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBRS9FLGlCQUFZLEdBQVksSUFBSSxDQUFDO1lBYTdCLG1CQUFjLEdBQVksSUFBSSxDQUFDO1lBWS9CLGVBQVUsR0FBWSxJQUFJLENBQUM7WUFhM0IsZ0JBQVcsR0FBWSxJQUFJLENBQUM7WUEyQm5DLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxjQUFjLEdBQUcsYUFBYSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzVCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1lBRTlCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxXQUFXLENBQUM7WUFDdkMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLGFBQWEsQ0FBQztZQUMzQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO1lBQ25DLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxVQUFVLENBQUM7UUFDdEMsQ0FBQztRQUVELFVBQVU7WUFDVCxPQUFPLENBQ04sSUFBSSxDQUFDLFlBQVksS0FBSyxJQUFJLENBQUMsbUJBQW1CO21CQUMzQyxJQUFJLENBQUMsY0FBYyxLQUFLLElBQUksQ0FBQyxxQkFBcUI7bUJBQ2xELElBQUksQ0FBQyxVQUFVLEtBQUssSUFBSSxDQUFDLGlCQUFpQjttQkFDMUMsSUFBSSxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsa0JBQWtCLENBQy9DLENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxDQUFDLENBQXNCO1lBQzVCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQztZQUNsQyxJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUM7WUFDdEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQzlCLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQztRQUNqQyxDQUFDO0tBQ0Q7SUEvRkQsa0RBK0ZDIn0=