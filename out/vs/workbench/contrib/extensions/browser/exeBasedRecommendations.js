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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/nls"], function (require, exports, extensionManagement_1, extensionRecommendations_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExeBasedRecommendations = void 0;
    let ExeBasedRecommendations = class ExeBasedRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        get otherRecommendations() { return this._otherTips.map(tip => this.toExtensionRecommendation(tip)); }
        get importantRecommendations() { return this._importantTips.map(tip => this.toExtensionRecommendation(tip)); }
        get recommendations() { return [...this.importantRecommendations, ...this.otherRecommendations]; }
        constructor(extensionTipsService) {
            super();
            this.extensionTipsService = extensionTipsService;
            this._otherTips = [];
            this._importantTips = [];
        }
        getRecommendations(exe) {
            const important = this._importantTips
                .filter(tip => tip.exeName.toLowerCase() === exe.toLowerCase())
                .map(tip => this.toExtensionRecommendation(tip));
            const others = this._otherTips
                .filter(tip => tip.exeName.toLowerCase() === exe.toLowerCase())
                .map(tip => this.toExtensionRecommendation(tip));
            return { important, others };
        }
        async doActivate() {
            this._otherTips = await this.extensionTipsService.getOtherExecutableBasedTips();
            await this.fetchImportantExeBasedRecommendations();
        }
        async fetchImportantExeBasedRecommendations() {
            if (!this._importantExeBasedRecommendations) {
                this._importantExeBasedRecommendations = this.doFetchImportantExeBasedRecommendations();
            }
            return this._importantExeBasedRecommendations;
        }
        async doFetchImportantExeBasedRecommendations() {
            const importantExeBasedRecommendations = new Map();
            this._importantTips = await this.extensionTipsService.getImportantExecutableBasedTips();
            this._importantTips.forEach(tip => importantExeBasedRecommendations.set(tip.extensionId.toLowerCase(), tip));
            return importantExeBasedRecommendations;
        }
        toExtensionRecommendation(tip) {
            return {
                extension: tip.extensionId.toLowerCase(),
                reason: {
                    reasonId: 2 /* ExtensionRecommendationReason.Executable */,
                    reasonText: (0, nls_1.localize)('exeBasedRecommendation', "This extension is recommended because you have {0} installed.", tip.exeFriendlyName)
                }
            };
        }
    };
    exports.ExeBasedRecommendations = ExeBasedRecommendations;
    exports.ExeBasedRecommendations = ExeBasedRecommendations = __decorate([
        __param(0, extensionManagement_1.IExtensionTipsService)
    ], ExeBasedRecommendations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlQmFzZWRSZWNvbW1lbmRhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvYnJvd3Nlci9leGVCYXNlZFJlY29tbWVuZGF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFPekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxtREFBd0I7UUFLcEUsSUFBSSxvQkFBb0IsS0FBNkMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5SSxJQUFJLHdCQUF3QixLQUE2QyxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXRKLElBQUksZUFBZSxLQUE2QyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFMUksWUFDd0Isb0JBQTREO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBRmdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFUNUUsZUFBVSxHQUFtQyxFQUFFLENBQUM7WUFDaEQsbUJBQWMsR0FBbUMsRUFBRSxDQUFDO1FBVzVELENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxHQUFXO1lBQzdCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxjQUFjO2lCQUNuQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxLQUFLLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztpQkFDOUQsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFbEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVU7aUJBQzVCLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEtBQUssR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDO2lCQUM5RCxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVsRCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFFUyxLQUFLLENBQUMsVUFBVTtZQUN6QixJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLDJCQUEyQixFQUFFLENBQUM7WUFDaEYsTUFBTSxJQUFJLENBQUMscUNBQXFDLEVBQUUsQ0FBQztRQUNwRCxDQUFDO1FBR08sS0FBSyxDQUFDLHFDQUFxQztZQUNsRCxJQUFJLENBQUMsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxpQ0FBaUMsR0FBRyxJQUFJLENBQUMsdUNBQXVDLEVBQUUsQ0FBQztZQUN6RixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsaUNBQWlDLENBQUM7UUFDL0MsQ0FBQztRQUVPLEtBQUssQ0FBQyx1Q0FBdUM7WUFDcEQsTUFBTSxnQ0FBZ0MsR0FBRyxJQUFJLEdBQUcsRUFBd0MsQ0FBQztZQUN6RixJQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLCtCQUErQixFQUFFLENBQUM7WUFDeEYsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxnQ0FBZ0MsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdHLE9BQU8sZ0NBQWdDLENBQUM7UUFDekMsQ0FBQztRQUVPLHlCQUF5QixDQUFDLEdBQWlDO1lBQ2xFLE9BQU87Z0JBQ04sU0FBUyxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFO2dCQUN4QyxNQUFNLEVBQUU7b0JBQ1AsUUFBUSxrREFBMEM7b0JBQ2xELFVBQVUsRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSwrREFBK0QsRUFBRSxHQUFHLENBQUMsZUFBZSxDQUFDO2lCQUNwSTthQUNELENBQUM7UUFDSCxDQUFDO0tBRUQsQ0FBQTtJQTFEWSwwREFBdUI7c0NBQXZCLHVCQUF1QjtRQVdqQyxXQUFBLDJDQUFxQixDQUFBO09BWFgsdUJBQXVCLENBMERuQyJ9