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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/markers/common/markers", "vs/workbench/services/decorations/common/decorations", "vs/base/common/lifecycle", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry"], function (require, exports, contributions_1, markers_1, decorations_1, lifecycle_1, nls_1, platform_1, colorRegistry_1, configuration_1, configurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MarkersDecorationsProvider {
        constructor(_markerService) {
            this._markerService = _markerService;
            this.label = (0, nls_1.localize)('label', "Problems");
            this.onDidChange = _markerService.onMarkerChanged;
        }
        provideDecorations(resource) {
            const markers = this._markerService.read({
                resource,
                severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning
            });
            let first;
            for (const marker of markers) {
                if (!first || marker.severity > first.severity) {
                    first = marker;
                }
            }
            if (!first) {
                return undefined;
            }
            return {
                weight: 100 * first.severity,
                bubble: true,
                tooltip: markers.length === 1 ? (0, nls_1.localize)('tooltip.1', "1 problem in this file") : (0, nls_1.localize)('tooltip.N', "{0} problems in this file", markers.length),
                letter: markers.length < 10 ? markers.length.toString() : '9+',
                color: first.severity === markers_1.MarkerSeverity.Error ? colorRegistry_1.listErrorForeground : colorRegistry_1.listWarningForeground,
            };
        }
    }
    let MarkersFileDecorations = class MarkersFileDecorations {
        constructor(_markerService, _decorationsService, _configurationService) {
            this._markerService = _markerService;
            this._decorationsService = _decorationsService;
            this._configurationService = _configurationService;
            this._disposables = [
                this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration('problems.visibility')) {
                        this._updateEnablement();
                    }
                }),
            ];
            this._updateEnablement();
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._provider);
            (0, lifecycle_1.dispose)(this._disposables);
        }
        _updateEnablement() {
            const problem = this._configurationService.getValue('problems.visibility');
            if (problem === undefined) {
                return;
            }
            const value = this._configurationService.getValue('problems');
            const shouldEnable = (problem && value.decorations.enabled);
            if (shouldEnable === this._enabled) {
                if (!problem || !value.decorations.enabled) {
                    this._provider?.dispose();
                    this._provider = undefined;
                }
                return;
            }
            this._enabled = shouldEnable;
            if (this._enabled) {
                const provider = new MarkersDecorationsProvider(this._markerService);
                this._provider = this._decorationsService.registerDecorationsProvider(provider);
            }
            else if (this._provider) {
                this._provider.dispose();
            }
        }
    };
    MarkersFileDecorations = __decorate([
        __param(0, markers_1.IMarkerService),
        __param(1, decorations_1.IDecorationsService),
        __param(2, configuration_1.IConfigurationService)
    ], MarkersFileDecorations);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': 'problems',
        'order': 101,
        'type': 'object',
        'properties': {
            'problems.decorations.enabled': {
                'markdownDescription': (0, nls_1.localize)('markers.showOnFile', "Show Errors & Warnings on files and folder. Overwritten by `#problems.visibility#` when it is off."),
                'type': 'boolean',
                'default': true
            }
        }
    });
    // register file decorations
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(MarkersFileDecorations, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vyc0ZpbGVEZWNvcmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWFya2Vycy9icm93c2VyL21hcmtlcnNGaWxlRGVjb3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFlaEcsTUFBTSwwQkFBMEI7UUFLL0IsWUFDa0IsY0FBOEI7WUFBOUIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBSnZDLFVBQUssR0FBVyxJQUFBLGNBQVEsRUFBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFNdEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxjQUFjLENBQUMsZUFBZSxDQUFDO1FBQ25ELENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxRQUFhO1lBQy9CLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDO2dCQUN4QyxRQUFRO2dCQUNSLFVBQVUsRUFBRSx3QkFBYyxDQUFDLEtBQUssR0FBRyx3QkFBYyxDQUFDLE9BQU87YUFDekQsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxLQUEwQixDQUFDO1lBQy9CLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxLQUFLLElBQUksTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2hELEtBQUssR0FBRyxNQUFNLENBQUM7Z0JBQ2hCLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxPQUFPO2dCQUNOLE1BQU0sRUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVE7Z0JBQzVCLE1BQU0sRUFBRSxJQUFJO2dCQUNa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