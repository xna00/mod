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
define(["require", "exports", "vs/base/common/event", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, event_1, nls_1, platform_1, editor_1, editorInput_1, editorService_1) {
    "use strict";
    var SideBySideEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SideBySideEditorInputSerializer = exports.AbstractSideBySideEditorInputSerializer = exports.SideBySideEditorInput = void 0;
    /**
     * Side by side editor inputs that have a primary and secondary side.
     */
    let SideBySideEditorInput = class SideBySideEditorInput extends editorInput_1.EditorInput {
        static { SideBySideEditorInput_1 = this; }
        static { this.ID = 'workbench.editorinputs.sidebysideEditorInput'; }
        get typeId() {
            return SideBySideEditorInput_1.ID;
        }
        get capabilities() {
            // Use primary capabilities as main capabilities...
            let capabilities = this.primary.capabilities;
            // ...with the exception of `CanSplitInGroup` which
            // is only relevant to single editors.
            capabilities &= ~32 /* EditorInputCapabilities.CanSplitInGroup */;
            // Trust: should be considered for both sides
            if (this.secondary.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */)) {
                capabilities |= 16 /* EditorInputCapabilities.RequiresTrust */;
            }
            // Singleton: should be considered for both sides
            if (this.secondary.hasCapability(8 /* EditorInputCapabilities.Singleton */)) {
                capabilities |= 8 /* EditorInputCapabilities.Singleton */;
            }
            // Indicate we show more than one editor
            capabilities |= 256 /* EditorInputCapabilities.MultipleEditors */;
            return capabilities;
        }
        get resource() {
            if (this.hasIdenticalSides) {
                // pretend to be just primary side when being asked for a resource
                // in case both sides are the same. this can help when components
                // want to identify this input among others (e.g. in history).
                return this.primary.resource;
            }
            return undefined;
        }
        constructor(preferredName, preferredDescription, secondary, primary, editorService) {
            super();
            this.preferredName = preferredName;
            this.preferredDescription = preferredDescription;
            this.secondary = secondary;
            this.primary = primary;
            this.editorService = editorService;
            this.hasIdenticalSides = this.primary.matches(this.secondary);
            this.registerListeners();
        }
        registerListeners() {
            // When the primary or secondary input gets disposed, dispose this diff editor input
            this._register(event_1.Event.once(event_1.Event.any(this.primary.onWillDispose, this.secondary.onWillDispose))(() => {
                if (!this.isDisposed()) {
                    this.dispose();
                }
            }));
            // Re-emit some events from the primary side to the outside
            this._register(this.primary.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            // Re-emit some events from both sides to the outside
            this._register(this.primary.onDidChangeCapabilities(() => this._onDidChangeCapabilities.fire()));
            this._register(this.secondary.onDidChangeCapabilities(() => this._onDidChangeCapabilities.fire()));
            this._register(this.primary.onDidChangeLabel(() => this._onDidChangeLabel.fire()));
            this._register(this.secondary.onDidChangeLabel(() => this._onDidChangeLabel.fire()));
        }
        getName() {
            const preferredName = this.getPreferredName();
            if (preferredName) {
                return preferredName;
            }
            if (this.hasIdenticalSides) {
                return this.primary.getName(); // keep name concise when same editor is opened side by side
            }
            return (0, nls_1.localize)('sideBySideLabels', "{0} - {1}", this.secondary.getName(), this.primary.getName());
        }
        getPreferredName() {
            return this.preferredName;
        }
        getDescription(verbosity) {
            const preferredDescription = this.getPreferredDescription();
            if (preferredDescription) {
                return preferredDescription;
            }
            if (this.hasIdenticalSides) {
                return this.primary.getDescription(verbosity);
            }
            return super.getDescription(verbosity);
        }
        getPreferredDescription() {
            return this.preferredDescription;
        }
        getTitle(verbosity) {
            let title;
            if (this.hasIdenticalSides) {
                title = this.primary.getTitle(verbosity) ?? this.getName();
            }
            else {
                title = super.getTitle(verbosity);
            }
            const preferredTitle = this.getPreferredTitle();
            if (preferredTitle) {
                title = `${preferredTitle} (${title})`;
            }
            return title;
        }
        getPreferredTitle() {
            if (this.preferredName && this.preferredDescription) {
                return `${this.preferredName} ${this.preferredDescription}`;
            }
            if (this.preferredName || this.preferredDescription) {
                return this.preferredName ?? this.preferredDescription;
            }
            return undefined;
        }
        getLabelExtraClasses() {
            if (this.hasIdenticalSides) {
                return this.primary.getLabelExtraClasses();
            }
            return super.getLabelExtraClasses();
        }
        getAriaLabel() {
            if (this.hasIdenticalSides) {
                return this.primary.getAriaLabel();
            }
            return super.getAriaLabel();
        }
        getTelemetryDescriptor() {
            const descriptor = this.primary.getTelemetryDescriptor();
            return { ...descriptor, ...super.getTelemetryDescriptor() };
        }
        isDirty() {
            return this.primary.isDirty();
        }
        isSaving() {
            return this.primary.isSaving();
        }
        async save(group, options) {
            const primarySaveResult = await this.primary.save(group, options);
            return this.saveResultToEditor(primarySaveResult);
        }
        async saveAs(group, options) {
            const primarySaveResult = await this.primary.saveAs(group, options);
            return this.saveResultToEditor(primarySaveResult);
        }
        saveResultToEditor(primarySaveResult) {
            if (!primarySaveResult || !this.hasIdenticalSides) {
                return primarySaveResult;
            }
            if (this.primary.matches(primarySaveResult)) {
                return this;
            }
            if (primarySaveResult instanceof editorInput_1.EditorInput) {
                return new SideBySideEditorInput_1(this.preferredName, this.preferredDescription, primarySaveResult, primarySaveResult, this.editorService);
            }
            if (!(0, editor_1.isResourceDiffEditorInput)(primarySaveResult) && !(0, editor_1.isResourceMultiDiffEditorInput)(primarySaveResult) && !(0, editor_1.isResourceSideBySideEditorInput)(primarySaveResult) && !(0, editor_1.isResourceMergeEditorInput)(primarySaveResult)) {
                return {
                    primary: primarySaveResult,
                    secondary: primarySaveResult,
                    label: this.preferredName,
                    description: this.preferredDescription
                };
            }
            return undefined;
        }
        revert(group, options) {
            return this.primary.revert(group, options);
        }
        async rename(group, target) {
            if (!this.hasIdenticalSides) {
                return; // currently only enabled when both sides are identical
            }
            // Forward rename to primary side
            const renameResult = await this.primary.rename(group, target);
            if (!renameResult) {
                return undefined;
            }
            // Build a side-by-side result from the rename result
            if ((0, editor_1.isEditorInput)(renameResult.editor)) {
                return {
                    editor: new SideBySideEditorInput_1(this.preferredName, this.preferredDescription, renameResult.editor, renameResult.editor, this.editorService),
                    options: {
                        ...renameResult.options,
                        viewState: (0, editor_1.findViewStateForEditor)(this, group, this.editorService)
                    }
                };
            }
            if ((0, editor_1.isResourceEditorInput)(renameResult.editor)) {
                return {
                    editor: {
                        label: this.preferredName,
                        description: this.preferredDescription,
                        primary: renameResult.editor,
                        secondary: renameResult.editor,
                        options: {
                            ...renameResult.options,
                            viewState: (0, editor_1.findViewStateForEditor)(this, group, this.editorService)
                        }
                    }
                };
            }
            return undefined;
        }
        isReadonly() {
            return this.primary.isReadonly();
        }
        toUntyped(options) {
            const primaryResourceEditorInput = this.primary.toUntyped(options);
            const secondaryResourceEditorInput = this.secondary.toUntyped(options);
            // Prevent nested side by side editors which are unsupported
            if (primaryResourceEditorInput && secondaryResourceEditorInput &&
                !(0, editor_1.isResourceDiffEditorInput)(primaryResourceEditorInput) && !(0, editor_1.isResourceDiffEditorInput)(secondaryResourceEditorInput) &&
                !(0, editor_1.isResourceMultiDiffEditorInput)(primaryResourceEditorInput) && !(0, editor_1.isResourceMultiDiffEditorInput)(secondaryResourceEditorInput) &&
                !(0, editor_1.isResourceSideBySideEditorInput)(primaryResourceEditorInput) && !(0, editor_1.isResourceSideBySideEditorInput)(secondaryResourceEditorInput) &&
                !(0, editor_1.isResourceMergeEditorInput)(primaryResourceEditorInput) && !(0, editor_1.isResourceMergeEditorInput)(secondaryResourceEditorInput)) {
                const untypedInput = {
                    label: this.preferredName,
                    description: this.preferredDescription,
                    primary: primaryResourceEditorInput,
                    secondary: secondaryResourceEditorInput
                };
                if (typeof options?.preserveViewState === 'number') {
                    untypedInput.options = {
                        viewState: (0, editor_1.findViewStateForEditor)(this, options.preserveViewState, this.editorService)
                    };
                }
                return untypedInput;
            }
            return undefined;
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if ((0, editor_1.isDiffEditorInput)(otherInput) || (0, editor_1.isResourceDiffEditorInput)(otherInput)) {
                return false; // prevent subclass from matching
            }
            if (otherInput instanceof SideBySideEditorInput_1) {
                return this.primary.matches(otherInput.primary) && this.secondary.matches(otherInput.secondary);
            }
            if ((0, editor_1.isResourceSideBySideEditorInput)(otherInput)) {
                return this.primary.matches(otherInput.primary) && this.secondary.matches(otherInput.secondary);
            }
            return false;
        }
    };
    exports.SideBySideEditorInput = SideBySideEditorInput;
    exports.SideBySideEditorInput = SideBySideEditorInput = SideBySideEditorInput_1 = __decorate([
        __param(4, editorService_1.IEditorService)
    ], SideBySideEditorInput);
    class AbstractSideBySideEditorInputSerializer {
        canSerialize(editorInput) {
            const input = editorInput;
            if (input.primary && input.secondary) {
                const [secondaryInputSerializer, primaryInputSerializer] = this.getSerializers(input.secondary.typeId, input.primary.typeId);
                return !!(secondaryInputSerializer?.canSerialize(input.secondary) && primaryInputSerializer?.canSerialize(input.primary));
            }
            return false;
        }
        serialize(editorInput) {
            const input = editorInput;
            if (input.primary && input.secondary) {
                const [secondaryInputSerializer, primaryInputSerializer] = this.getSerializers(input.secondary.typeId, input.primary.typeId);
                if (primaryInputSerializer && secondaryInputSerializer) {
                    const primarySerialized = primaryInputSerializer.serialize(input.primary);
                    const secondarySerialized = secondaryInputSerializer.serialize(input.secondary);
                    if (primarySerialized && secondarySerialized) {
                        const serializedEditorInput = {
                            name: input.getPreferredName(),
                            description: input.getPreferredDescription(),
                            primarySerialized,
                            secondarySerialized,
                            primaryTypeId: input.primary.typeId,
                            secondaryTypeId: input.secondary.typeId
                        };
                        return JSON.stringify(serializedEditorInput);
                    }
                }
            }
            return undefined;
        }
        deserialize(instantiationService, serializedEditorInput) {
            const deserialized = JSON.parse(serializedEditorInput);
            const [secondaryInputSerializer, primaryInputSerializer] = this.getSerializers(deserialized.secondaryTypeId, deserialized.primaryTypeId);
            if (primaryInputSerializer && secondaryInputSerializer) {
                const primaryInput = primaryInputSerializer.deserialize(instantiationService, deserialized.primarySerialized);
                const secondaryInput = secondaryInputSerializer.deserialize(instantiationService, deserialized.secondarySerialized);
                if (primaryInput instanceof editorInput_1.EditorInput && secondaryInput instanceof editorInput_1.EditorInput) {
                    return this.createEditorInput(instantiationService, deserialized.name, deserialized.description, secondaryInput, primaryInput);
                }
            }
            return undefined;
        }
        getSerializers(secondaryEditorInputTypeId, primaryEditorInputTypeId) {
            const registry = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory);
            return [registry.getEditorSerializer(secondaryEditorInputTypeId), registry.getEditorSerializer(primaryEditorInputTypeId)];
        }
    }
    exports.AbstractSideBySideEditorInputSerializer = AbstractSideBySideEditorInputSerializer;
    class SideBySideEditorInputSerializer extends AbstractSideBySideEditorInputSerializer {
        createEditorInput(instantiationService, name, description, secondaryInput, primaryInput) {
            return instantiationService.createInstance(SideBySideEditorInput, name, description, secondaryInput, primaryInput);
        }
    }
    exports.SideBySideEditorInputSerializer = SideBySideEditorInputSerializer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lkZUJ5U2lkZUVkaXRvcklucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29tbW9uL2VkaXRvci9zaWRlQnlTaWRlRWRpdG9ySW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQVloRzs7T0FFRztJQUNJLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEseUJBQVc7O2lCQUVyQyxPQUFFLEdBQVcsOENBQThDLEFBQXpELENBQTBEO1FBRTVFLElBQWEsTUFBTTtZQUNsQixPQUFPLHVCQUFxQixDQUFDLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBRUQsSUFBYSxZQUFZO1lBRXhCLG1EQUFtRDtZQUNuRCxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQztZQUU3QyxtREFBbUQ7WUFDbkQsc0NBQXNDO1lBQ3RDLFlBQVksSUFBSSxpREFBd0MsQ0FBQztZQUV6RCw2Q0FBNkM7WUFDN0MsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsZ0RBQXVDLEVBQUUsQ0FBQztnQkFDekUsWUFBWSxrREFBeUMsQ0FBQztZQUN2RCxDQUFDO1lBRUQsaURBQWlEO1lBQ2pELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLDJDQUFtQyxFQUFFLENBQUM7Z0JBQ3JFLFlBQVksNkNBQXFDLENBQUM7WUFDbkQsQ0FBQztZQUVELHdDQUF3QztZQUN4QyxZQUFZLHFEQUEyQyxDQUFDO1lBRXhELE9BQU8sWUFBWSxDQUFDO1FBQ3JCLENBQUM7UUFFRCxJQUFJLFFBQVE7WUFDWCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM1QixrRUFBa0U7Z0JBQ2xFLGlFQUFpRTtnQkFDakUsOERBQThEO2dCQUM5RCxPQUFPLElB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