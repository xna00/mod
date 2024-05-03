/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/arrays", "vs/workbench/common/editor", "vs/base/common/resources"], function (require, exports, event_1, arrays_1, editor_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorInput = void 0;
    /**
     * Editor inputs are lightweight objects that can be passed to the workbench API to open inside the editor part.
     * Each editor input is mapped to an editor that is capable of opening it through the Platform facade.
     */
    class EditorInput extends editor_1.AbstractEditorInput {
        constructor() {
            super(...arguments);
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this._onDidChangeLabel = this._register(new event_1.Emitter());
            this._onDidChangeCapabilities = this._register(new event_1.Emitter());
            this._onWillDispose = this._register(new event_1.Emitter());
            /**
             * Triggered when this input changes its dirty state.
             */
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            /**
             * Triggered when this input changes its label
             */
            this.onDidChangeLabel = this._onDidChangeLabel.event;
            /**
             * Triggered when this input changes its capabilities.
             */
            this.onDidChangeCapabilities = this._onDidChangeCapabilities.event;
            /**
             * Triggered when this input is about to be disposed.
             */
            this.onWillDispose = this._onWillDispose.event;
        }
        /**
         * Identifies the type of editor this input represents
         * This ID is registered with the {@link EditorResolverService} to allow
         * for resolving an untyped input to a typed one
         */
        get editorId() {
            return undefined;
        }
        /**
         * The capabilities of the input.
         */
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */;
        }
        /**
         * Figure out if the input has the provided capability.
         */
        hasCapability(capability) {
            if (capability === 0 /* EditorInputCapabilities.None */) {
                return this.capabilities === 0 /* EditorInputCapabilities.None */;
            }
            return (this.capabilities & capability) !== 0;
        }
        isReadonly() {
            return this.hasCapability(2 /* EditorInputCapabilities.Readonly */);
        }
        /**
         * Returns the display name of this input.
         */
        getName() {
            return `Editor ${this.typeId}`;
        }
        /**
         * Returns the display description of this input.
         */
        getDescription(verbosity) {
            return undefined;
        }
        /**
         * Returns the display title of this input.
         */
        getTitle(verbosity) {
            return this.getName();
        }
        /**
         * Returns the extra classes to apply to the label of this input.
         */
        getLabelExtraClasses() {
            return [];
        }
        /**
         * Returns the aria label to be read out by a screen reader.
         */
        getAriaLabel() {
            return this.getTitle(0 /* Verbosity.SHORT */);
        }
        /**
         * Returns the icon which represents this editor input.
         * If undefined, the default icon will be used.
         */
        getIcon() {
            return undefined;
        }
        /**
         * Returns a descriptor suitable for telemetry events.
         *
         * Subclasses should extend if they can contribute.
         */
        getTelemetryDescriptor() {
            /* __GDPR__FRAGMENT__
                "EditorTelemetryDescriptor" : {
                    "typeId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            return { typeId: this.typeId };
        }
        /**
         * Returns if this input is dirty or not.
         */
        isDirty() {
            return false;
        }
        /**
         * Returns if the input has unsaved changes.
         */
        isModified() {
            return this.isDirty();
        }
        /**
         * Returns if this input is currently being saved or soon to be
         * saved. Based on this assumption the editor may for example
         * decide to not signal the dirty state to the user assuming that
         * the save is scheduled to happen anyway.
         */
        isSaving() {
            return false;
        }
        /**
         * Returns a type of `IDisposable` that represents the resolved input.
         * Subclasses should override to provide a meaningful model or return
         * `null` if the editor does not require a model.
         *
         * The `options` parameter are passed down from the editor when the
         * input is resolved as part of it.
         */
        async resolve() {
            return null;
        }
        /**
         * Saves the editor. The provided groupId helps implementors
         * to e.g. preserve view state of the editor and re-open it
         * in the correct group after saving.
         *
         * @returns the resulting editor input (typically the same) of
         * this operation or `undefined` to indicate that the operation
         * failed or was canceled.
         */
        async save(group, options) {
            return this;
        }
        /**
         * Saves the editor to a different location. The provided `group`
         * helps implementors to e.g. preserve view state of the editor
         * and re-open it in the correct group after saving.
         *
         * @returns the resulting editor input (typically a different one)
         * of this operation or `undefined` to indicate that the operation
         * failed or was canceled.
         */
        async saveAs(group, options) {
            return this;
        }
        /**
         * Reverts this input from the provided group.
         */
        async revert(group, options) { }
        /**
         * Called to determine how to handle a resource that is renamed that matches
         * the editors resource (or is a child of).
         *
         * Implementors are free to not implement this method to signal no intent
         * to participate. If an editor is returned though, it will replace the
         * current one with that editor and optional options.
         */
        async rename(group, target) {
            return undefined;
        }
        /**
         * Returns a copy of the current editor input. Used when we can't just reuse the input
         */
        copy() {
            return this;
        }
        /**
         * Indicates if this editor can be moved to another group. By default
         * editors can freely be moved around groups. If an editor cannot be
         * moved, a message should be returned to show to the user.
         *
         * @returns `true` if the editor can be moved to the target group, or
         * a string with a message to show to the user if the editor cannot be
         * moved.
         */
        canMove(sourceGroup, targetGroup) {
            return true;
        }
        /**
         * Returns if the other object matches this input.
         */
        matches(otherInput) {
            // Typed inputs: via  === check
            if ((0, editor_1.isEditorInput)(otherInput)) {
                return this === otherInput;
            }
            // Untyped inputs: go into properties
            const otherInputEditorId = otherInput.options?.override;
            // If the overrides are both defined and don't match that means they're separate inputs
            if (this.editorId !== otherInputEditorId && otherInputEditorId !== undefined && this.editorId !== undefined) {
                return false;
            }
            return (0, resources_1.isEqual)(this.resource, editor_1.EditorResourceAccessor.getCanonicalUri(otherInput));
        }
        /**
         * If a editor was registered onto multiple editor panes, this method
         * will be asked to return the preferred one to use.
         *
         * @param editorPanes a list of editor pane descriptors that are candidates
         * for the editor to open in.
         */
        prefersEditorPane(editorPanes) {
            return (0, arrays_1.firstOrDefault)(editorPanes);
        }
        /**
         * Returns a representation of this typed editor input as untyped
         * resource editor input that e.g. can be used to serialize the
         * editor input into a form that it can be restored.
         *
         * May return `undefined` if an untyped representation is not supported.
         */
        toUntyped(options) {
            return undefined;
        }
        /**
         * Returns if this editor is disposed.
         */
        isDisposed() {
            return this._store.isDisposed;
        }
        dispose() {
            if (!this.isDisposed()) {
                this._onWillDispose.fire();
            }
            super.dispose();
        }
    }
    exports.EditorInput = EditorInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9ySW5wdXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vZWRpdG9yL2VkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNEaEc7OztPQUdHO0lBQ0gsTUFBc0IsV0FBWSxTQUFRLDRCQUFtQjtRQUE3RDs7WUFFb0Isc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDeEQsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDeEQsNkJBQXdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFFakUsbUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUV0RTs7ZUFFRztZQUNNLHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFFekQ7O2VBRUc7WUFDTSxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1lBRXpEOztlQUVHO1lBQ00sNEJBQXVCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQztZQUV2RTs7ZUFFRztZQUNNLGtCQUFhLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7UUFpUnBELENBQUM7UUFwUEE7Ozs7V0FJRztRQUNILElBQUksUUFBUTtZQUNYLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRDs7V0FFRztRQUNILElBQUksWUFBWTtZQUNmLGdEQUF3QztRQUN6QyxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxhQUFhLENBQUMsVUFBbUM7WUFDaEQsSUFBSSxVQUFVLHlDQUFpQyxFQUFFLENBQUM7Z0JBQ2pELE9BQU8sSUFBSSxDQUFDLFlBQVkseUNBQWlDLENBQUM7WUFDM0QsQ0FBQztZQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRUQsVUFBVTtZQUNULE9BQU8sSUFBSSxDQUFDLGFBQWEsMENBQWtDLENBQUM7UUFDN0QsQ0FBQztRQUVEOztXQUVHO1FBQ0gsT0FBTztZQUNOLE9BQU8sVUFBVSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVEOztXQUVHO1FBQ0gsY0FBYyxDQUFDLFNBQXFCO1lBQ25DLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRDs7V0FFRztRQUNILFFBQVEsQ0FBQyxTQUFxQjtZQUM3QixPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDO1FBRUQ7O1dBRUc7UUFDSCxvQkFBb0I7WUFDbkIsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxZQUFZO1lBQ1gsT0FBTyxJQUFJLENBQUMsUUFBUSx5QkFBaUIsQ0FBQztRQUN2QyxDQUFDO1FBRUQ7OztXQUdHO1FBQ0gsT0FBTztZQUNOLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRDs7OztXQUlHO1FBQ0gsc0JBQXNCO1lBQ3JCOzs7O2NBSUU7WUFDRixPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxPQUFPO1lBQ04sT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxVQUFVO1lBQ1QsT0FBTyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0gsUUFBUTtZQUNQLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVEOzs7Ozs7O1dBT0c7UUFDSCxLQUFLLENBQUMsT0FBTztZQUNaLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVEOzs7Ozs7OztXQVFHO1FBQ0gsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFzQixFQUFFLE9BQXNCO1lBQ3hELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVEOzs7Ozs7OztXQVFHO1FBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFzQixFQUFFLE9BQXNCO1lBQzFELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVEOztXQUVHO1FBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFzQixFQUFFLE9BQXdCLElBQW1CLENBQUM7UUFFakY7Ozs7Ozs7V0FPRztRQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBc0IsRUFBRSxNQUFXO1lBQy9DLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRDs7V0FFRztRQUNILElBQUk7WUFDSCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRDs7Ozs7Ozs7V0FRRztRQUNILE9BQU8sQ0FBQyxXQUE0QixFQUFFLFdBQTRCO1lBQ2pFLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVEOztXQUVHO1FBQ0gsT0FBTyxDQUFDLFVBQTZDO1lBRXBELCtCQUErQjtZQUMvQixJQUFJLElBQUEsc0JBQWEsRUFBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUMvQixPQUFPLElBQUksS0FBSyxVQUFVLENBQUM7WUFDNUIsQ0FBQztZQUVELHFDQUFxQztZQUNyQyxNQUFNLGtCQUFrQixHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDO1lBRXhELHVGQUF1RjtZQUN2RixJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssa0JBQWtCLElBQUksa0JBQWtCLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzdHLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE9BQU8sSUFBQSxtQkFBTyxFQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsK0JBQXNCLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUVEOzs7Ozs7V0FNRztRQUNILGlCQUFpQixDQUEyQyxXQUFnQjtZQUMzRSxPQUFPLElBQUEsdUJBQWMsRUFBQyxXQUFXLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQ7Ozs7OztXQU1HO1FBQ0gsU0FBUyxDQUFDLE9BQStCO1lBQ3hDLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRDs7V0FFRztRQUNILFVBQVU7WUFDVCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQy9CLENBQUM7UUFFUSxPQUFPO1lBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzVCLENBQUM7WUFFRCxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztLQUNEO0lBM1NELGtDQTJTQyJ9