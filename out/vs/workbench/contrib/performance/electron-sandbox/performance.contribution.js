/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "./startupProfiler", "./startupTimings", "vs/workbench/contrib/performance/electron-sandbox/rendererAutoProfiler", "vs/platform/configuration/common/configurationRegistry", "vs/nls", "vs/workbench/common/configuration"], function (require, exports, platform_1, contributions_1, startupProfiler_1, startupTimings_1, rendererAutoProfiler_1, configurationRegistry_1, nls_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // -- auto profiler
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(rendererAutoProfiler_1.RendererProfiling, 4 /* LifecyclePhase.Eventually */);
    // -- startup profiler
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(startupProfiler_1.StartupProfiler, 3 /* LifecyclePhase.Restored */);
    // -- startup timings
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(startupTimings_1.NativeStartupTimings, 4 /* LifecyclePhase.Eventually */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        ...configuration_1.applicationConfigurationNodeBase,
        'properties': {
            'application.experimental.rendererProfiling': {
                type: 'boolean',
                default: false,
                tags: ['experimental'],
                markdownDescription: (0, nls_1.localize)('experimental.rendererProfiling', "When enabled slow renderers are automatically profiled")
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZm9ybWFuY2UuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wZXJmb3JtYW5jZS9lbGVjdHJvbi1zYW5kYm94L3BlcmZvcm1hbmNlLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyxtQkFBbUI7SUFFbkIsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsNkJBQTZCLENBQy9GLHdDQUFpQixvQ0FFakIsQ0FBQztJQUVGLHNCQUFzQjtJQUV0QixtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyw2QkFBNkIsQ0FDL0YsaUNBQWUsa0NBRWYsQ0FBQztJQUVGLHFCQUFxQjtJQUVyQixtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyw2QkFBNkIsQ0FDL0YscUNBQW9CLG9DQUVwQixDQUFDO0lBRUYsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUFTLENBQUMsYUFBYSxDQUFDLENBQUMscUJBQXFCLENBQUM7UUFDbEYsR0FBRyxnREFBZ0M7UUFDbkMsWUFBWSxFQUFFO1lBQ2IsNENBQTRDLEVBQUU7Z0JBQzdDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxLQUFLO2dCQUNkLElBQUksRUFBRSxDQUFDLGNBQWMsQ0FBQztnQkFDdEIsbUJBQW1CLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUsd0RBQXdELENBQUM7YUFDekg7U0FDRDtLQUNELENBQUMsQ0FBQyJ9