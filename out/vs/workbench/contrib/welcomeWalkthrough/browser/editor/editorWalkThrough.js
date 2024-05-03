/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/welcomeWalkthrough/browser/walkThroughInput", "vs/base/common/network", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/workbench/contrib/welcomeWalkthrough/browser/editor/vs_code_editor_walkthrough"], function (require, exports, nls_1, editorService_1, instantiation_1, walkThroughInput_1, network_1, actions_1, actionCommonCategories_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorWalkThroughInputSerializer = exports.EditorWalkThroughAction = void 0;
    const typeId = 'workbench.editors.walkThroughInput';
    const inputOptions = {
        typeId,
        name: (0, nls_1.localize)('editorWalkThrough.title', "Editor Playground"),
        resource: network_1.FileAccess.asBrowserUri('vs/workbench/contrib/welcomeWalkthrough/browser/editor/vs_code_editor_walkthrough.md')
            .with({
            scheme: network_1.Schemas.walkThrough,
            query: JSON.stringify({ moduleId: 'vs/workbench/contrib/welcomeWalkthrough/browser/editor/vs_code_editor_walkthrough' })
        }),
        telemetryFrom: 'walkThrough'
    };
    class EditorWalkThroughAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.showInteractivePlayground'; }
        static { this.LABEL = (0, nls_1.localize2)('editorWalkThrough', 'Interactive Editor Playground'); }
        constructor() {
            super({
                id: EditorWalkThroughAction.ID,
                title: EditorWalkThroughAction.LABEL,
                category: actionCommonCategories_1.Categories.Help,
                f1: true
            });
        }
        run(serviceAccessor) {
            const editorService = serviceAccessor.get(editorService_1.IEditorService);
            const instantiationService = serviceAccessor.get(instantiation_1.IInstantiationService);
            const input = instantiationService.createInstance(walkThroughInput_1.WalkThroughInput, inputOptions);
            // TODO @lramos15 adopt the resolver here
            return editorService.openEditor(input, { pinned: true })
                .then(() => void (0));
        }
    }
    exports.EditorWalkThroughAction = EditorWalkThroughAction;
    class EditorWalkThroughInputSerializer {
        static { this.ID = typeId; }
        canSerialize(editorInput) {
            return true;
        }
        serialize(editorInput) {
            return '';
        }
        deserialize(instantiationService) {
            return instantiationService.createInstance(walkThroughInput_1.WalkThroughInput, inputOptions);
        }
    }
    exports.EditorWalkThroughInputSerializer = EditorWalkThroughInputSerializer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yV2Fsa1Rocm91Z2guanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlbGNvbWVXYWxrdGhyb3VnaC9icm93c2VyL2VkaXRvci9lZGl0b3JXYWxrVGhyb3VnaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBTSxNQUFNLEdBQUcsb0NBQW9DLENBQUM7SUFDcEQsTUFBTSxZQUFZLEdBQTRCO1FBQzdDLE1BQU07UUFDTixJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsbUJBQW1CLENBQUM7UUFDOUQsUUFBUSxFQUFFLG9CQUFVLENBQUMsWUFBWSxDQUFDLHNGQUFzRixDQUFDO2FBQ3ZILElBQUksQ0FBQztZQUNMLE1BQU0sRUFBRSxpQkFBTyxDQUFDLFdBQVc7WUFDM0IsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUUsbUZBQW1GLEVBQUUsQ0FBQztTQUN4SCxDQUFDO1FBQ0gsYUFBYSxFQUFFLGFBQWE7S0FDNUIsQ0FBQztJQUVGLE1BQWEsdUJBQXdCLFNBQVEsaUJBQU87aUJBRTVCLE9BQUUsR0FBRyw0Q0FBNEMsQ0FBQztpQkFDbEQsVUFBSyxHQUFHLElBQUEsZUFBUyxFQUFDLG1CQUFtQixFQUFFLCtCQUErQixDQUFDLENBQUM7UUFFL0Y7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHVCQUF1QixDQUFDLEVBQUU7Z0JBQzlCLEtBQUssRUFBRSx1QkFBdUIsQ0FBQyxLQUFLO2dCQUNwQyxRQUFRLEVBQUUsbUNBQVUsQ0FBQyxJQUFJO2dCQUN6QixFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFZSxHQUFHLENBQUMsZUFBaUM7WUFDcEQsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDMUQsTUFBTSxvQkFBb0IsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7WUFDeEUsTUFBTSxLQUFLLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1DQUFnQixFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2xGLHlDQUF5QztZQUN6QyxPQUFPLGFBQWEsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDO2lCQUN0RCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEIsQ0FBQzs7SUFyQkYsMERBc0JDO0lBRUQsTUFBYSxnQ0FBZ0M7aUJBRTVCLE9BQUUsR0FBRyxNQUFNLENBQUM7UUFFckIsWUFBWSxDQUFDLFdBQXdCO1lBQzNDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVNLFNBQVMsQ0FBQyxXQUF3QjtZQUN4QyxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFTSxXQUFXLENBQUMsb0JBQTJDO1lBQzdELE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1DQUFnQixFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzVFLENBQUM7O0lBZEYsNEVBZUMifQ==