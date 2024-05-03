/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AssignmentFilterProvider = exports.Filters = exports.TargetPopulation = exports.ASSIGNMENT_REFETCH_INTERVAL = exports.ASSIGNMENT_STORAGE_KEY = void 0;
    exports.ASSIGNMENT_STORAGE_KEY = 'VSCode.ABExp.FeatureData';
    exports.ASSIGNMENT_REFETCH_INTERVAL = 0; // no polling
    var TargetPopulation;
    (function (TargetPopulation) {
        TargetPopulation["Insiders"] = "insider";
        TargetPopulation["Public"] = "public";
        TargetPopulation["Exploration"] = "exploration";
    })(TargetPopulation || (exports.TargetPopulation = TargetPopulation = {}));
    /*
    Based upon the official VSCode currently existing filters in the
    ExP backend for the VSCode cluster.
    https://experimentation.visualstudio.com/Analysis%20and%20Experimentation/_git/AnE.ExP.TAS.TachyonHost.Configuration?path=%2FConfigurations%2Fvscode%2Fvscode.json&version=GBmaster
    "X-MSEdge-Market": "detection.market",
    "X-FD-Corpnet": "detection.corpnet",
    "X-VSCode-AppVersion": "appversion",
    "X-VSCode-Build": "build",
    "X-MSEdge-ClientId": "clientid",
    "X-VSCode-ExtensionName": "extensionname",
    "X-VSCode-ExtensionVersion": "extensionversion",
    "X-VSCode-TargetPopulation": "targetpopulation",
    "X-VSCode-Language": "language"
    */
    var Filters;
    (function (Filters) {
        /**
         * The market in which the extension is distributed.
         */
        Filters["Market"] = "X-MSEdge-Market";
        /**
         * The corporation network.
         */
        Filters["CorpNet"] = "X-FD-Corpnet";
        /**
         * Version of the application which uses experimentation service.
         */
        Filters["ApplicationVersion"] = "X-VSCode-AppVersion";
        /**
         * Insiders vs Stable.
         */
        Filters["Build"] = "X-VSCode-Build";
        /**
         * Client Id which is used as primary unit for the experimentation.
         */
        Filters["ClientId"] = "X-MSEdge-ClientId";
        /**
         * Extension header.
         */
        Filters["ExtensionName"] = "X-VSCode-ExtensionName";
        /**
         * The version of the extension.
         */
        Filters["ExtensionVersion"] = "X-VSCode-ExtensionVersion";
        /**
         * The language in use by VS Code
         */
        Filters["Language"] = "X-VSCode-Language";
        /**
         * The target population.
         * This is used to separate internal, early preview, GA, etc.
         */
        Filters["TargetPopulation"] = "X-VSCode-TargetPopulation";
    })(Filters || (exports.Filters = Filters = {}));
    class AssignmentFilterProvider {
        constructor(version, appName, machineId, targetPopulation) {
            this.version = version;
            this.appName = appName;
            this.machineId = machineId;
            this.targetPopulation = targetPopulation;
        }
        /**
         * Returns a version string that can be parsed by the TAS client.
         * The tas client cannot handle suffixes lke "-insider"
         * Ref: https://github.com/microsoft/tas-client/blob/30340d5e1da37c2789049fcf45928b954680606f/vscode-tas-client/src/vscode-tas-client/VSCodeFilterProvider.ts#L35
         *
         * @param version Version string to be trimmed.
        */
        static trimVersionSuffix(version) {
            const regex = /\-[a-zA-Z0-9]+$/;
            const result = version.split(regex);
            return result[0];
        }
        getFilterValue(filter) {
            switch (filter) {
                case Filters.ApplicationVersion:
                    return AssignmentFilterProvider.trimVersionSuffix(this.version); // productService.version
                case Filters.Build:
                    return this.appName; // productService.nameLong
                case Filters.ClientId:
                    return this.machineId;
                case Filters.Language:
                    return platform.language;
                case Filters.ExtensionName:
                    return 'vscode-core'; // always return vscode-core for exp service
                case Filters.ExtensionVersion:
                    return '999999.0'; // always return a very large number for cross-extension experimentation
                case Filters.TargetPopulation:
                    return this.targetPopulation;
                default:
                    return '';
            }
        }
        getFilters() {
            const filters = new Map();
            const filterValues = Object.values(Filters);
            for (const value of filterValues) {
                filters.set(value, this.getFilterValue(value));
            }
            return filters;
        }
    }
    exports.AssignmentFilterProvider = AssignmentFilterProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzaWdubWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYXNzaWdubWVudC9jb21tb24vYXNzaWdubWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLbkYsUUFBQSxzQkFBc0IsR0FBRywwQkFBMEIsQ0FBQztJQUNwRCxRQUFBLDJCQUEyQixHQUFHLENBQUMsQ0FBQyxDQUFDLGFBQWE7SUFPM0QsSUFBWSxnQkFJWDtJQUpELFdBQVksZ0JBQWdCO1FBQzNCLHdDQUFvQixDQUFBO1FBQ3BCLHFDQUFpQixDQUFBO1FBQ2pCLCtDQUEyQixDQUFBO0lBQzVCLENBQUMsRUFKVyxnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQUkzQjtJQUVEOzs7Ozs7Ozs7Ozs7O01BYUU7SUFDRixJQUFZLE9BOENYO0lBOUNELFdBQVksT0FBTztRQUNsQjs7V0FFRztRQUNILHFDQUEwQixDQUFBO1FBRTFCOztXQUVHO1FBQ0gsbUNBQXdCLENBQUE7UUFFeEI7O1dBRUc7UUFDSCxxREFBMEMsQ0FBQTtRQUUxQzs7V0FFRztRQUNILG1DQUF3QixDQUFBO1FBRXhCOztXQUVHO1FBQ0gseUNBQThCLENBQUE7UUFFOUI7O1dBRUc7UUFDSCxtREFBd0MsQ0FBQTtRQUV4Qzs7V0FFRztRQUNILHlEQUE4QyxDQUFBO1FBRTlDOztXQUVHO1FBQ0gseUNBQThCLENBQUE7UUFFOUI7OztXQUdHO1FBQ0gseURBQThDLENBQUE7SUFDL0MsQ0FBQyxFQTlDVyxPQUFPLHVCQUFQLE9BQU8sUUE4Q2xCO0lBRUQsTUFBYSx3QkFBd0I7UUFDcEMsWUFDUyxPQUFlLEVBQ2YsT0FBZSxFQUNmLFNBQWlCLEVBQ2pCLGdCQUFrQztZQUhsQyxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQ2YsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQUNmLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDakIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtRQUN2QyxDQUFDO1FBRUw7Ozs7OztVQU1FO1FBQ00sTUFBTSxDQUFDLGlCQUFpQixDQUFDLE9BQWU7WUFDL0MsTUFBTSxLQUFLLEdBQUcsaUJBQWlCLENBQUM7WUFDaEMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVwQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQixDQUFDO1FBRUQsY0FBYyxDQUFDLE1BQWM7WUFDNUIsUUFBUSxNQUFNLEVBQUUsQ0FBQztnQkFDaEIsS0FBSyxPQUFPLENBQUMsa0JBQWtCO29CQUM5QixPQUFPLHdCQUF3QixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHlCQUF5QjtnQkFDM0YsS0FBSyxPQUFPLENBQUMsS0FBSztvQkFDakIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsMEJBQTBCO2dCQUNoRCxLQUFLLE9BQU8sQ0FBQyxRQUFRO29CQUNwQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3ZCLEtBQUssT0FBTyxDQUFDLFFBQVE7b0JBQ3BCLE9BQU8sUUFBUSxDQUFDLFFBQVEsQ0FBQztnQkFDMUIsS0FBSyxPQUFPLENBQUMsYUFBYTtvQkFDekIsT0FBTyxhQUFhLENBQUMsQ0FBQyw0Q0FBNEM7Z0JBQ25FLEtBQUssT0FBTyxDQUFDLGdCQUFnQjtvQkFDNUIsT0FBTyxVQUFVLENBQUMsQ0FBQyx3RUFBd0U7Z0JBQzVGLEtBQUssT0FBTyxDQUFDLGdCQUFnQjtvQkFDNUIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7Z0JBQzlCO29CQUNDLE9BQU8sRUFBRSxDQUFDO1lBQ1osQ0FBQztRQUNGLENBQUM7UUFFRCxVQUFVO1lBQ1QsTUFBTSxPQUFPLEdBQXFCLElBQUksR0FBRyxFQUFlLENBQUM7WUFDekQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM1QyxLQUFLLE1BQU0sS0FBSyxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDaEQsQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7S0FDRDtJQXBERCw0REFvREMifQ==