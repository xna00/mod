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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/base/common/date", "vs/base/common/resources", "vs/workbench/contrib/output/common/outputChannelModel"], function (require, exports, extensions_1, environmentService_1, instantiation_1, files_1, date_1, resources_1, outputChannelModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputChannelModelService = exports.IOutputChannelModelService = void 0;
    exports.IOutputChannelModelService = (0, instantiation_1.createDecorator)('outputChannelModelService');
    let OutputChannelModelService = class OutputChannelModelService {
        constructor(fileService, instantiationService, environmentService) {
            this.fileService = fileService;
            this.instantiationService = instantiationService;
            this._outputDir = null;
            this.outputLocation = (0, resources_1.joinPath)(environmentService.windowLogsPath, `output_${(0, date_1.toLocalISOString)(new Date()).replace(/-|:|\.\d+Z$/g, '')}`);
        }
        createOutputChannelModel(id, modelUri, language, file) {
            return file ? this.instantiationService.createInstance(outputChannelModel_1.FileOutputChannelModel, modelUri, language, file) : this.instantiationService.createInstance(outputChannelModel_1.DelegatedOutputChannelModel, id, modelUri, language, this.outputDir);
        }
        get outputDir() {
            if (!this._outputDir) {
                this._outputDir = this.fileService.createFolder(this.outputLocation).then(() => this.outputLocation);
            }
            return this._outputDir;
        }
    };
    exports.OutputChannelModelService = OutputChannelModelService;
    exports.OutputChannelModelService = OutputChannelModelService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService)
    ], OutputChannelModelService);
    (0, extensions_1.registerSingleton)(exports.IOutputChannelModelService, OutputChannelModelService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0Q2hhbm5lbE1vZGVsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvb3V0cHV0L2NvbW1vbi9vdXRwdXRDaGFubmVsTW9kZWxTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVluRixRQUFBLDBCQUEwQixHQUFHLElBQUEsK0JBQWUsRUFBNkIsMkJBQTJCLENBQUMsQ0FBQztJQVM1RyxJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUF5QjtRQU1yQyxZQUNlLFdBQTBDLEVBQ2pDLG9CQUE0RCxFQUNyRCxrQkFBZ0Q7WUFGL0MsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDaEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQVU1RSxlQUFVLEdBQXdCLElBQUksQ0FBQztZQVA5QyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUEsb0JBQVEsRUFBQyxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsVUFBVSxJQUFBLHVCQUFnQixFQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN6SSxDQUFDO1FBRUQsd0JBQXdCLENBQUMsRUFBVSxFQUFFLFFBQWEsRUFBRSxRQUE0QixFQUFFLElBQVU7WUFDM0YsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkNBQXNCLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxnREFBMkIsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDMU4sQ0FBQztRQUdELElBQVksU0FBUztZQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3RHLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztLQUVELENBQUE7SUExQlksOERBQXlCO3dDQUF6Qix5QkFBeUI7UUFPbkMsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGlEQUE0QixDQUFBO09BVGxCLHlCQUF5QixDQTBCckM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLGtDQUEwQixFQUFFLHlCQUF5QixvQ0FBNEIsQ0FBQyJ9