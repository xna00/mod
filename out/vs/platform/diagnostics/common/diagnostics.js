/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullDiagnosticsService = exports.IDiagnosticsService = exports.ID = void 0;
    exports.isRemoteDiagnosticError = isRemoteDiagnosticError;
    exports.ID = 'diagnosticsService';
    exports.IDiagnosticsService = (0, instantiation_1.createDecorator)(exports.ID);
    function isRemoteDiagnosticError(x) {
        return !!x.hostName && !!x.errorMessage;
    }
    class NullDiagnosticsService {
        async getPerformanceInfo(mainProcessInfo, remoteInfo) {
            return {};
        }
        async getSystemInfo(mainProcessInfo, remoteInfo) {
            return {
                processArgs: 'nullProcessArgs',
                gpuStatus: 'nullGpuStatus',
                screenReader: 'nullScreenReader',
                remoteData: [],
                os: 'nullOs',
                memory: 'nullMemory',
                vmHint: 'nullVmHint',
            };
        }
        async getDiagnostics(mainProcessInfo, remoteInfo) {
            return '';
        }
        async getWorkspaceFileExtensions(workspace) {
            return { extensions: [] };
        }
        async reportWorkspaceStats(workspace) { }
    }
    exports.NullDiagnosticsService = NullDiagnosticsService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhZ25vc3RpY3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2RpYWdub3N0aWNzL2NvbW1vbi9kaWFnbm9zdGljcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEyRmhHLDBEQUVDO0lBckZZLFFBQUEsRUFBRSxHQUFHLG9CQUFvQixDQUFDO0lBQzFCLFFBQUEsbUJBQW1CLEdBQUcsSUFBQSwrQkFBZSxFQUFzQixVQUFFLENBQUMsQ0FBQztJQWtGNUUsU0FBZ0IsdUJBQXVCLENBQUMsQ0FBTTtRQUM3QyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO0lBQ3pDLENBQUM7SUFFRCxNQUFhLHNCQUFzQjtRQUdsQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsZUFBd0MsRUFBRSxVQUE4RDtZQUNoSSxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYSxDQUFDLGVBQXdDLEVBQUUsVUFBOEQ7WUFDM0gsT0FBTztnQkFDTixXQUFXLEVBQUUsaUJBQWlCO2dCQUM5QixTQUFTLEVBQUUsZUFBZTtnQkFDMUIsWUFBWSxFQUFFLGtCQUFrQjtnQkFDaEMsVUFBVSxFQUFFLEVBQUU7Z0JBQ2QsRUFBRSxFQUFFLFFBQVE7Z0JBQ1osTUFBTSxFQUFFLFlBQVk7Z0JBQ3BCLE1BQU0sRUFBRSxZQUFZO2FBQ3BCLENBQUM7UUFDSCxDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxlQUF3QyxFQUFFLFVBQThEO1lBQzVILE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVELEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxTQUFxQjtZQUNyRCxPQUFPLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxLQUFLLENBQUMsb0JBQW9CLENBQUMsU0FBZ0MsSUFBbUIsQ0FBQztLQUUvRTtJQTdCRCx3REE2QkMifQ==