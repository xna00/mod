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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/config/fontMeasurements", "vs/platform/native/common/native", "vs/platform/registry/common/platform", "vs/workbench/common/contributions"], function (require, exports, lifecycle_1, fontMeasurements_1, native_1, platform_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DisplayChangeRemeasureFonts = class DisplayChangeRemeasureFonts extends lifecycle_1.Disposable {
        constructor(nativeHostService) {
            super();
            this._register(nativeHostService.onDidChangeDisplay(() => {
                fontMeasurements_1.FontMeasurements.clearAllFontInfos();
            }));
        }
    };
    DisplayChangeRemeasureFonts = __decorate([
        __param(0, native_1.INativeHostService)
    ], DisplayChangeRemeasureFonts);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(DisplayChangeRemeasureFonts, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzcGxheUNoYW5nZVJlbWVhc3VyZUZvbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlRWRpdG9yL2VsZWN0cm9uLXNhbmRib3gvZGlzcGxheUNoYW5nZVJlbWVhc3VyZUZvbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBU2hHLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFFbkQsWUFDcUIsaUJBQXFDO1lBRXpELEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3hELG1DQUFnQixDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDdEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRCxDQUFBO0lBWEssMkJBQTJCO1FBRzlCLFdBQUEsMkJBQWtCLENBQUE7T0FIZiwyQkFBMkIsQ0FXaEM7SUFFRCxtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUMsNkJBQTZCLENBQUMsMkJBQTJCLG9DQUE0QixDQUFDIn0=