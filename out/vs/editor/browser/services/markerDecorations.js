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
define(["require", "exports", "vs/editor/common/services/markerDecorations", "vs/editor/browser/editorExtensions"], function (require, exports, markerDecorations_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkerDecorationsContribution = void 0;
    let MarkerDecorationsContribution = class MarkerDecorationsContribution {
        static { this.ID = 'editor.contrib.markerDecorations'; }
        constructor(_editor, _markerDecorationsService) {
            // Doesn't do anything, just requires `IMarkerDecorationsService` to make sure it gets instantiated
        }
        dispose() {
        }
    };
    exports.MarkerDecorationsContribution = MarkerDecorationsContribution;
    exports.MarkerDecorationsContribution = MarkerDecorationsContribution = __decorate([
        __param(1, markerDecorations_1.IMarkerDecorationsService)
    ], MarkerDecorationsContribution);
    (0, editorExtensions_1.registerEditorContribution)(MarkerDecorationsContribution.ID, MarkerDecorationsContribution, 0 /* EditorContributionInstantiation.Eager */); // eager because it instantiates IMarkerDecorationsService which is responsible for rendering squiggles
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2VyRGVjb3JhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3NlcnZpY2VzL21hcmtlckRlY29yYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQU96RixJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE2QjtpQkFFbEIsT0FBRSxHQUFXLGtDQUFrQyxBQUE3QyxDQUE4QztRQUV2RSxZQUNDLE9BQW9CLEVBQ08seUJBQW9EO1lBRS9FLG1HQUFtRztRQUNwRyxDQUFDO1FBRUQsT0FBTztRQUNQLENBQUM7O0lBWlcsc0VBQTZCOzRDQUE3Qiw2QkFBNkI7UUFNdkMsV0FBQSw2Q0FBeUIsQ0FBQTtPQU5mLDZCQUE2QixDQWF6QztJQUVELElBQUEsNkNBQTBCLEVBQUMsNkJBQTZCLENBQUMsRUFBRSxFQUFFLDZCQUE2QixnREFBd0MsQ0FBQyxDQUFDLHVHQUF1RyJ9