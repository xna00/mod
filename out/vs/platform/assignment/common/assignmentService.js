/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/assignment/common/assignment", "vs/amdX"], function (require, exports, telemetryUtils_1, assignment_1, amdX_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseAssignmentService = void 0;
    class BaseAssignmentService {
        get experimentsEnabled() {
            return true;
        }
        constructor(machineId, configurationService, productService, environmentService, telemetry, keyValueStorage) {
            this.machineId = machineId;
            this.configurationService = configurationService;
            this.productService = productService;
            this.environmentService = environmentService;
            this.telemetry = telemetry;
            this.keyValueStorage = keyValueStorage;
            this.networkInitialized = false;
            const isTesting = environmentService.extensionTestsLocationURI !== undefined;
            if (!isTesting && productService.tasConfig && this.experimentsEnabled && (0, telemetryUtils_1.getTelemetryLevel)(this.configurationService) === 3 /* TelemetryLevel.USAGE */) {
                this.tasClient = this.setupTASClient();
            }
            // For development purposes, configure the delay until tas local tas treatment ovverrides are available
            const overrideDelaySetting = this.configurationService.getValue('experiments.overrideDelay');
            const overrideDelay = typeof overrideDelaySetting === 'number' ? overrideDelaySetting : 0;
            this.overrideInitDelay = new Promise(resolve => setTimeout(resolve, overrideDelay));
        }
        async getTreatment(name) {
            // For development purposes, allow overriding tas assignments to test variants locally.
            await this.overrideInitDelay;
            const override = this.configurationService.getValue('experiments.override.' + name);
            if (override !== undefined) {
                return override;
            }
            if (!this.tasClient) {
                return undefined;
            }
            if (!this.experimentsEnabled) {
                return undefined;
            }
            let result;
            const client = await this.tasClient;
            // The TAS client is initialized but we need to check if the initial fetch has completed yet
            // If it is complete, return a cached value for the treatment
            // If not, use the async call with `checkCache: true`. This will allow the module to return a cached value if it is present.
            // Otherwise it will await the initial fetch to return the most up to date value.
            if (this.networkInitialized) {
                result = client.getTreatmentVariable('vscode', name);
            }
            else {
                result = await client.getTreatmentVariableAsync('vscode', name, true);
            }
            result = client.getTreatmentVariable('vscode', name);
            return result;
        }
        async setupTASClient() {
            const targetPopulation = this.productService.quality === 'stable' ?
                assignment_1.TargetPopulation.Public : (this.productService.quality === 'exploration' ?
                assignment_1.TargetPopulation.Exploration : assignment_1.TargetPopulation.Insiders);
            const filterProvider = new assignment_1.AssignmentFilterProvider(this.productService.version, this.productService.nameLong, this.machineId, targetPopulation);
            const tasConfig = this.productService.tasConfig;
            const tasClient = new (await (0, amdX_1.importAMDNodeModule)('tas-client-umd', 'lib/tas-client-umd.js')).ExperimentationService({
                filterProviders: [filterProvider],
                telemetry: this.telemetry,
                storageKey: assignment_1.ASSIGNMENT_STORAGE_KEY,
                keyValueStorage: this.keyValueStorage,
                assignmentContextTelemetryPropertyName: tasConfig.assignmentContextTelemetryPropertyName,
                telemetryEventName: tasConfig.telemetryEventName,
                endpoint: tasConfig.endpoint,
                refetchInterval: assignment_1.ASSIGNMENT_REFETCH_INTERVAL,
            });
            await tasClient.initializePromise;
            tasClient.initialFetch.then(() => this.networkInitialized = true);
            return tasClient;
        }
    }
    exports.BaseAssignmentService = BaseAssignmentService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzaWdubWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2Fzc2lnbm1lbnQvY29tbW9uL2Fzc2lnbm1lbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFzQixxQkFBcUI7UUFNMUMsSUFBYyxrQkFBa0I7WUFDL0IsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsWUFDa0IsU0FBaUIsRUFDZixvQkFBMkMsRUFDM0MsY0FBK0IsRUFDL0Isa0JBQXVDLEVBQ2hELFNBQW9DLEVBQ3RDLGVBQWtDO1lBTHpCLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDZix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzNDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMvQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ2hELGNBQVMsR0FBVCxTQUFTLENBQTJCO1lBQ3RDLG9CQUFlLEdBQWYsZUFBZSxDQUFtQjtZQWJuQyx1QkFBa0IsR0FBRyxLQUFLLENBQUM7WUFlbEMsTUFBTSxTQUFTLEdBQUcsa0JBQWtCLENBQUMseUJBQXlCLEtBQUssU0FBUyxDQUFDO1lBQzdFLElBQUksQ0FBQyxTQUFTLElBQUksY0FBYyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLElBQUksSUFBQSxrQ0FBaUIsRUFBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsaUNBQXlCLEVBQUUsQ0FBQztnQkFDaEosSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDeEMsQ0FBQztZQUVELHVHQUF1RztZQUN2RyxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUM3RixN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