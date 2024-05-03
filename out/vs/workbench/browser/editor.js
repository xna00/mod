/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/editor", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/base/common/async", "vs/workbench/services/editor/common/editorService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/network", "vs/base/common/iterator", "vs/base/common/event"], function (require, exports, nls_1, editor_1, platform_1, lifecycle_1, async_1, editorService_1, uriIdentity_1, workingCopyService_1, network_1, iterator_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorPaneRegistry = exports.EditorPaneDescriptor = void 0;
    exports.whenEditorClosed = whenEditorClosed;
    exports.computeEditorAriaLabel = computeEditorAriaLabel;
    /**
     * A lightweight descriptor of an editor pane. The descriptor is deferred so that heavy editor
     * panes can load lazily in the workbench.
     */
    class EditorPaneDescriptor {
        static { this.instantiatedEditorPanes = new Set(); }
        static didInstantiateEditorPane(typeId) {
            return EditorPaneDescriptor.instantiatedEditorPanes.has(typeId);
        }
        static { this._onWillInstantiateEditorPane = new event_1.Emitter(); }
        static { this.onWillInstantiateEditorPane = EditorPaneDescriptor._onWillInstantiateEditorPane.event; }
        static create(ctor, typeId, name) {
            return new EditorPaneDescriptor(ctor, typeId, name);
        }
        constructor(ctor, typeId, name) {
            this.ctor = ctor;
            this.typeId = typeId;
            this.name = name;
        }
        instantiate(instantiationService, group) {
            EditorPaneDescriptor._onWillInstantiateEditorPane.fire({ typeId: this.typeId });
            const pane = instantiationService.createInstance(this.ctor, group);
            EditorPaneDescriptor.instantiatedEditorPanes.add(this.typeId);
            return pane;
        }
        describes(editorPane) {
            return editorPane.getId() === this.typeId;
        }
    }
    exports.EditorPaneDescriptor = EditorPaneDescriptor;
    class EditorPaneRegistry {
        constructor() {
            this.mapEditorPanesToEditors = new Map();
            //#endregion
        }
        registerEditorPane(editorPaneDescriptor, editorDescriptors) {
            this.mapEditorPanesToEditors.set(editorPaneDescriptor, editorDescriptors);
            return (0, lifecycle_1.toDisposable)(() => {
                this.mapEditorPanesToEditors.delete(editorPaneDescriptor);
            });
        }
        getEditorPane(editor) {
            const descriptors = this.findEditorPaneDescriptors(editor);
            if (descriptors.length === 0) {
                return undefined;
            }
            if (descriptors.length === 1) {
                return descriptors[0];
            }
            return editor.prefersEditorPane(descriptors);
        }
        findEditorPaneDescriptors(editor, byInstanceOf) {
            const matchingEditorPaneDescriptors = [];
            for (const editorPane of this.mapEditorPanesToEditors.keys()) {
                const editorDescriptors = this.mapEditorPanesToEditors.get(editorPane) || [];
                for (const editorDescriptor of editorDescriptors) {
                    const editorClass = editorDescriptor.ctor;
                    // Direct check on constructor type (ignores prototype chain)
                    if (!byInstanceOf && editor.constructor === editorClass) {
                        matchingEditorPaneDescriptors.push(editorPane);
                        break;
                    }
                    // Normal instanceof check
                    else if (byInstanceOf && editor instanceof editorClass) {
                        matchingEditorPaneDescriptors.push(editorPane);
                        break;
                    }
                }
            }
            // If no descriptors found, continue search using instanceof and prototype chain
            if (!byInstanceOf && matchingEditorPaneDescriptors.length === 0) {
                return this.findEditorPaneDescriptors(editor, true);
            }
            return matchingEditorPaneDescriptors;
        }
        //#region Used for tests only
        getEditorPaneByType(typeId) {
            return iterator_1.Iterable.find(this.mapEditorPanesToEditors.keys(), editor => editor.typeId === typeId);
        }
        getEditorPanes() {
            return Array.from(this.mapEditorPanesToEditors.keys());
        }
        getEditors() {
            const editorClasses = [];
            for (const editorPane of this.mapEditorPanesToEditors.keys()) {
                const editorDescriptors = this.mapEditorPanesToEditors.get(editorPane);
                if (editorDescriptors) {
                    editorClasses.push(...editorDescriptors.map(editorDescriptor => editorDescriptor.ctor));
                }
            }
            return editorClasses;
        }
    }
    exports.EditorPaneRegistry = EditorPaneRegistry;
    platform_1.Registry.add(editor_1.EditorExtensions.EditorPane, new EditorPaneRegistry());
    //#endregion
    //#region Editor Close Tracker
    function whenEditorClosed(accessor, resources) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
        const workingCopyService = accessor.get(workingCopyService_1.IWorkingCopyService);
        return new Promise(resolve => {
            let remainingResources = [...resources];
            // Observe any editor closing from this moment on
            const listener = editorService.onDidCloseEditor(async (event) => {
                if (event.context === editor_1.EditorCloseContext.MOVE) {
                    return; // ignore move events where the editor will open in another group
                }
                let primaryResource = editor_1.EditorResourceAccessor.getOriginalUri(event.editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                let secondaryResource = editor_1.EditorResourceAccessor.getOriginalUri(event.editor, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY });
                // Specially handle an editor getting replaced: if the new active editor
                // matches any of the resources from the closed editor, ignore those
                // resources because they were actually not closed, but replaced.
                // (see https://github.com/microsoft/vscode/issues/134299)
                if (event.context === editor_1.EditorCloseContext.REPLACE) {
                    const newPrimaryResource = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                    const newSecondaryResource = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY });
                    if (uriIdentityService.extUri.isEqual(primaryResource, newPrimaryResource)) {
                        primaryResource = undefined;
                    }
                    if (uriIdentityService.extUri.isEqual(secondaryResource, newSecondaryResource)) {
                        secondaryResource = undefined;
                    }
                }
                // Remove from resources to wait for being closed based on the
                // resources from editors that got closed
                remainingResources = remainingResources.filter(resource => {
                    // Closing editor matches resource directly: remove from remaining
                    if (uriIdentityService.extUri.isEqual(resource, primaryResource) || uriIdentityService.extUri.isEqual(resource, secondaryResource)) {
                        return false;
                    }
                    // Closing editor is untitled with associated resource
                    // that matches resource directly: remove from remaining
                    // but only if the editor was not replaced, otherwise
                    // saving an untitled with associated resource would
                    // release the `--wait` call.
                    // (see https://github.com/microsoft/vscode/issues/141237)
                    if (event.context !== editor_1.EditorCloseContext.REPLACE) {
                        if ((primaryResource?.scheme === network_1.Schemas.untitled && uriIdentityService.extUri.isEqual(resource, primaryResource.with({ scheme: resource.scheme }))) ||
                            (secondaryResource?.scheme === network_1.Schemas.untitled && uriIdentityService.extUri.isEqual(resource, secondaryResource.with({ scheme: resource.scheme })))) {
                            return false;
                        }
                    }
                    // Editor is not yet closed, so keep it in waiting mode
                    return true;
                });
                // All resources to wait for being closed are closed
                if (remainingResources.length === 0) {
                    // If auto save is configured with the default delay (1s) it is possible
                    // to close the editor while the save still continues in the background. As such
                    // we have to also check if the editors to track for are dirty and if so wait
                    // for them to get saved.
                    const dirtyResources = resources.filter(resource => workingCopyService.isDirty(resource));
                    if (dirtyResources.length > 0) {
                        await async_1.Promises.settled(dirtyResources.map(async (resource) => await new Promise(resolve => {
                            if (!workingCopyService.isDirty(resource)) {
                                return resolve(); // return early if resource is not dirty
                            }
                            // Otherwise resolve promise when resource is saved
                            const listener = workingCopyService.onDidChangeDirty(workingCopy => {
                                if (!workingCopy.isDirty() && uriIdentityService.extUri.isEqual(resource, workingCopy.resource)) {
                                    listener.dispose();
                                    return resolve();
                                }
                            });
                        })));
                    }
                    listener.dispose();
                    return resolve();
                }
            });
        });
    }
    //#endregion
    //#region ARIA
    function computeEditorAriaLabel(input, index, group, groupCount) {
        let ariaLabel = input.getAriaLabel();
        if (group && !group.isPinned(input)) {
            ariaLabel = (0, nls_1.localize)('preview', "{0}, preview", ariaLabel);
        }
        if (group?.isSticky(index ?? input)) {
            ariaLabel = (0, nls_1.localize)('pinned', "{0}, pinned", ariaLabel);
        }
        // Apply group information to help identify in
        // which group we are (only if more than one group
        // is actually opened)
        if (group && typeof groupCount === 'number' && groupCount > 1) {
            ariaLabel = `${ariaLabel}, ${group.ariaLabel}`;
        }
        return ariaLabel;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9lZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNEtoRyw0Q0E2RkM7SUFNRCx3REFrQkM7SUF0UEQ7OztPQUdHO0lBQ0gsTUFBYSxvQkFBb0I7aUJBRVIsNEJBQXVCLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUNwRSxNQUFNLENBQUMsd0JBQXdCLENBQUMsTUFBYztZQUM3QyxPQUFPLG9CQUFvQixDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqRSxDQUFDO2lCQUV1QixpQ0FBNEIsR0FBRyxJQUFJLGVBQU8sRUFBbUMsQ0FBQztpQkFDdEYsZ0NBQTJCLEdBQUcsb0JBQW9CLENBQUMsNEJBQTRCLENBQUMsS0FBSyxDQUFDO1FBRXRHLE1BQU0sQ0FBQyxNQUFNLENBQ1osSUFBcUUsRUFDckUsTUFBYyxFQUNkLElBQVk7WUFFWixPQUFPLElBQUksb0JBQW9CLENBQUMsSUFBeUQsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDMUcsQ0FBQztRQUVELFlBQ2tCLElBQXVELEVBQy9ELE1BQWMsRUFDZCxJQUFZO1lBRkosU0FBSSxHQUFKLElBQUksQ0FBbUQ7WUFDL0QsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUNkLFNBQUksR0FBSixJQUFJLENBQVE7UUFDbEIsQ0FBQztRQUVMLFdBQVcsQ0FBQyxvQkFBMkMsRUFBRSxLQUFtQjtZQUMzRSxvQkFBb0IsQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFFaEYsTUFBTSxJQUFJLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkUsb0JBQW9CLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUU5RCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxTQUFTLENBQUMsVUFBc0I7WUFDL0IsT0FBTyxVQUFVLENBQUMsS0FBSyxFQUFFLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUMzQyxDQUFDOztJQW5DRixvREFvQ0M7SUFFRCxNQUFhLGtCQUFrQjtRQUEvQjtZQUVrQiw0QkFBdUIsR0FBRyxJQUFJLEdBQUcsRUFBZ0UsQ0FBQztZQTRFbkgsWUFBWTtRQUNiLENBQUM7UUEzRUEsa0JBQWtCLENBQUMsb0JBQTBDLEVBQUUsaUJBQXlEO1lBQ3ZILElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUUxRSxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUMzRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxhQUFhLENBQUMsTUFBbUI7WUFDaEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTNELElBQUksV0FBVyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELElBQUksV0FBVyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkIsQ0FBQztZQUVELE9BQU8sTUFBTSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFTyx5QkFBeUIsQ0FBQyxNQUFtQixFQUFFLFlBQXNCO1lBQzVFLE1BQU0sNkJBQTZCLEdBQTJCLEVBQUUsQ0FBQztZQUVqRSxLQUFLLE1BQU0sVUFBVSxJQUFJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO2dCQUM5RCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUM3RSxLQUFLLE1BQU0sZ0JBQWdCLElBQUksaUJBQWlCLEVBQUUsQ0FBQztvQkFDbEQsTUFBTSxXQUFXLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDO29CQUUxQyw2REFBNkQ7b0JBQzdELElBQUksQ0FBQyxZQUFZLElBQUksTUFBTSxDQUFDLFdBQVcsS0FBSyxXQUFXLEVBQUUsQ0FBQzt3QkFDekQsNkJBQTZCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUMvQyxNQUFNO29CQUNQLENBQUM7b0JBRUQsMEJBQTBCO3lCQUNyQixJQUFJLFlBQVksSUFBSSxNQUFNLFlBQVksV0FBVyxFQUFFLENBQUM7d0JBQ3hELDZCQUE2QixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDL0MsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsZ0ZBQWdGO1lBQ2hGLElBQUksQ0FBQyxZQUFZLElBQUksNkJBQTZCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNqRSxPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDckQsQ0FBQztZQUVELE9BQU8sNkJBQTZCLENBQUM7UUFDdEMsQ0FBQztRQUVELDZCQUE2QjtRQUU3QixtQkFBbUIsQ0FBQyxNQUFjO1lBQ2pDLE9BQU8sbUJBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxNQUFNLENBQUMsQ0FBQztRQUMvRixDQUFDO1FBRUQsY0FBYztZQUNiLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRUQsVUFBVTtZQUNULE1BQU0sYUFBYSxHQUFrQyxFQUFFLENBQUM7WUFDeEQsS0FBSyxNQUFNLFVBQVUsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDOUQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN2RSxJQUFJLGlCQUFpQixFQUFFLENBQUM7b0JBQ3ZCLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3pGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxhQUFhLENBQUM7UUFDdEIsQ0FBQztLQUdEO0lBL0VELGdEQStFQztJQUVELG1CQUFRLENBQUMsR0FBRyxDQUFDLHlCQUFnQixDQUFDLFVBQVUsRUFBRSxJQUFJLGtCQUFrQixFQUFFLENBQUMsQ0FBQztJQUVwRSxZQUFZO0lBRVosOEJBQThCO0lBRTlCLFNBQWdCLGdCQUFnQixDQUFDLFFBQTBCLEVBQUUsU0FBZ0I7UUFDNUUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7UUFDbkQsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGlDQUFtQixDQUFDLENBQUM7UUFDN0QsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdDQUFtQixDQUFDLENBQUM7UUFFN0QsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUM1QixJQUFJLGtCQUFrQixHQUFHLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUV4QyxpREFBaUQ7WUFDakQsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBQyxLQUFLLEVBQUMsRUFBRTtnQkFDN0QsSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLDJCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDO29CQUMvQyxPQUFPLENBQUMsaUVBQWlFO2dCQUMxRSxDQUFDO2dCQUVELElBQUksZUFBZSxHQUFHLCtCQUFzQixDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUseUJBQWdCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDM0gsSUFBSSxpQkFBaUIsR0FBRywrQkFBc0IsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLGlCQUFpQixFQUFFLHlCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7Z0JBRS9ILHdFQUF3RTtnQkFDeEUsb0VBQW9FO2dCQUNwRSxpRUFBaUU7Z0JBQ2pFLDBEQUEwRDtnQkFDMUQsSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLDJCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNsRCxNQUFNLGtCQUFrQixHQUFHLCtCQUFzQixDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUseUJBQWdCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztvQkFDOUksTUFBTSxvQkFBb0IsR0FBRywrQkFBc0IsQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxFQUFFLGlCQUFpQixFQUFFLHlCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7b0JBRWxKLElBQUksa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxDQUFDO3dCQUM1RSxlQUFlLEdBQUcsU0FBUyxDQUFDO29CQUM3QixDQUFDO29CQUVELElBQUksa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7d0JBQ2hGLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztvQkFDL0IsQ0FBQztnQkFDRixDQUFDO2dCQUVELDhEQUE4RDtnQkFDOUQseUNBQXlDO2dCQUN6QyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBRXpELGtFQUFrRTtvQkFDbEUsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxlQUFlLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7d0JBQ3BJLE9BQU8sS0FBSyxDQUFDO29CQUNkLENBQUM7b0JBRUQsc0RBQXNEO29CQUN0RCx3REFBd0Q7b0JBQ3hELHFEQUFxRDtvQkFDckQsb0RBQW9EO29CQUNwRCw2QkFBNkI7b0JBQzdCLDBEQUEwRDtvQkFDMUQsSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLDJCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNsRCxJQUNDLENBQUMsZUFBZSxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFFBQVEsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ2hKLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxLQUFLLGlCQUFPLENBQUMsUUFBUSxJQUFJLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQ25KLENBQUM7NEJBQ0YsT0FBTyxLQUFLLENBQUM7d0JBQ2QsQ0FBQztvQkFDRixDQUFDO29CQUVELHVEQUF1RDtvQkFDdkQsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsb0RBQW9EO2dCQUNwRCxJQUFJLGtCQUFrQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFFckMsd0VBQXdFO29CQUN4RSxnRkFBZ0Y7b0JBQ2hGLDZFQUE2RTtvQkFDN0UseUJBQXlCO29CQUN6QixNQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBQzFGLElBQUksY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDL0IsTUFBTSxnQkFBUSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxRQUFRLEVBQUMsRUFBRSxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQU8sT0FBTyxDQUFDLEVBQUU7NEJBQzdGLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQ0FDM0MsT0FBTyxPQUFPLEVBQUUsQ0FBQyxDQUFDLHdDQUF3Qzs0QkFDM0QsQ0FBQzs0QkFFRCxtREFBbUQ7NEJBQ25ELE1BQU0sUUFBUSxHQUFHLGtCQUFrQixDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxFQUFFO2dDQUNsRSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxJQUFJLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29DQUNqRyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7b0NBRW5CLE9BQU8sT0FBTyxFQUFFLENBQUM7Z0NBQ2xCLENBQUM7NEJBQ0YsQ0FBQyxDQUFDLENBQUM7d0JBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNOLENBQUM7b0JBRUQsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUVuQixPQUFPLE9BQU8sRUFBRSxDQUFDO2dCQUNsQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxZQUFZO0lBRVosY0FBYztJQUVkLFNBQWdCLHNCQUFzQixDQUFDLEtBQWtCLEVBQUUsS0FBeUIsRUFBRSxLQUErQixFQUFFLFVBQThCO1FBQ3BKLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNyQyxJQUFJLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNyQyxTQUFTLEdBQUcsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRUQsSUFBSSxLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3JDLFNBQVMsR0FBRyxJQUFBLGNBQVEsRUFBQyxRQUFRLEVBQUUsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFRCw4Q0FBOEM7UUFDOUMsa0RBQWtEO1FBQ2xELHNCQUFzQjtRQUN0QixJQUFJLEtBQUssSUFBSSxPQUFPLFVBQVUsS0FBSyxRQUFRLElBQUksVUFBVSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQy9ELFNBQVMsR0FBRyxHQUFHLFNBQVMsS0FBSyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDaEQsQ0FBQztRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7O0FBRUQsWUFBWSJ9