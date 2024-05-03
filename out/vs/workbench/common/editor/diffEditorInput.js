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
define(["require", "exports", "vs/nls", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/common/editor", "vs/workbench/common/editor/textEditorModel", "vs/workbench/common/editor/diffEditorModel", "vs/workbench/common/editor/textDiffEditorModel", "vs/workbench/services/editor/common/editorService", "vs/base/common/labels", "vs/platform/editor/common/editor"], function (require, exports, nls_1, sideBySideEditorInput_1, editor_1, textEditorModel_1, diffEditorModel_1, textDiffEditorModel_1, editorService_1, labels_1, editor_2) {
    "use strict";
    var DiffEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorInputSerializer = exports.DiffEditorInput = void 0;
    /**
     * The base editor input for the diff editor. It is made up of two editor inputs, the original version
     * and the modified version.
     */
    let DiffEditorInput = class DiffEditorInput extends sideBySideEditorInput_1.SideBySideEditorInput {
        static { DiffEditorInput_1 = this; }
        static { this.ID = 'workbench.editors.diffEditorInput'; }
        get typeId() {
            return DiffEditorInput_1.ID;
        }
        get editorId() {
            return this.modified.editorId === this.original.editorId ? this.modified.editorId : undefined;
        }
        get capabilities() {
            let capabilities = super.capabilities;
            // Force description capability depends on labels
            if (this.labels.forceDescription) {
                capabilities |= 64 /* EditorInputCapabilities.ForceDescription */;
            }
            return capabilities;
        }
        constructor(preferredName, preferredDescription, original, modified, forceOpenAsBinary, editorService) {
            super(preferredName, preferredDescription, original, modified, editorService);
            this.original = original;
            this.modified = modified;
            this.forceOpenAsBinary = forceOpenAsBinary;
            this.cachedModel = undefined;
            this.labels = this.computeLabels();
        }
        computeLabels() {
            // Name
            let name;
            let forceDescription = false;
            if (this.preferredName) {
                name = this.preferredName;
            }
            else {
                const originalName = this.original.getName();
                const modifiedName = this.modified.getName();
                name = (0, nls_1.localize)('sideBySideLabels', "{0} ↔ {1}", originalName, modifiedName);
                // Enforce description when the names are identical
                forceDescription = originalName === modifiedName;
            }
            // Description
            let shortDescription;
            let mediumDescription;
            let longDescription;
            if (this.preferredDescription) {
                shortDescription = this.preferredDescription;
                mediumDescription = this.preferredDescription;
                longDescription = this.preferredDescription;
            }
            else {
                shortDescription = this.computeLabel(this.original.getDescription(0 /* Verbosity.SHORT */), this.modified.getDescription(0 /* Verbosity.SHORT */));
                longDescription = this.computeLabel(this.original.getDescription(2 /* Verbosity.LONG */), this.modified.getDescription(2 /* Verbosity.LONG */));
                // Medium Description: try to be verbose by computing
                // a label that resembles the difference between the two
                const originalMediumDescription = this.original.getDescription(1 /* Verbosity.MEDIUM */);
                const modifiedMediumDescription = this.modified.getDescription(1 /* Verbosity.MEDIUM */);
                if ((typeof originalMediumDescription === 'string' && typeof modifiedMediumDescription === 'string') && // we can only `shorten` when both sides are strings...
                    (originalMediumDescription || modifiedMediumDescription) // ...however never when both sides are empty strings
                ) {
                    const [shortenedOriginalMediumDescription, shortenedModifiedMediumDescription] = (0, labels_1.shorten)([originalMediumDescription, modifiedMediumDescription]);
                    mediumDescription = this.computeLabel(shortenedOriginalMediumDescription, shortenedModifiedMediumDescription);
                }
            }
            // Title
            let shortTitle = this.computeLabel(this.original.getTitle(0 /* Verbosity.SHORT */) ?? this.original.getName(), this.modified.getTitle(0 /* Verbosity.SHORT */) ?? this.modified.getName(), ' ↔ ');
            let mediumTitle = this.computeLabel(this.original.getTitle(1 /* Verbosity.MEDIUM */) ?? this.original.getName(), this.modified.getTitle(1 /* Verbosity.MEDIUM */) ?? this.modified.getName(), ' ↔ ');
            let longTitle = this.computeLabel(this.original.getTitle(2 /* Verbosity.LONG */) ?? this.original.getName(), this.modified.getTitle(2 /* Verbosity.LONG */) ?? this.modified.getName(), ' ↔ ');
            const preferredTitle = this.getPreferredTitle();
            if (preferredTitle) {
                shortTitle = `${preferredTitle} (${shortTitle})`;
                mediumTitle = `${preferredTitle} (${mediumTitle})`;
                longTitle = `${preferredTitle} (${longTitle})`;
            }
            return { name, shortDescription, mediumDescription, longDescription, forceDescription, shortTitle, mediumTitle, longTitle };
        }
        computeLabel(originalLabel, modifiedLabel, separator = ' - ') {
            if (!originalLabel || !modifiedLabel) {
                return undefined;
            }
            if (originalLabel === modifiedLabel) {
                return modifiedLabel;
            }
            return `${originalLabel}${separator}${modifiedLabel}`;
        }
        getName() {
            return this.labels.name;
        }
        getDescription(verbosity = 1 /* Verbosity.MEDIUM */) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.labels.shortDescription;
                case 2 /* Verbosity.LONG */:
                    return this.labels.longDescription;
                case 1 /* Verbosity.MEDIUM */:
                default:
                    return this.labels.mediumDescription;
            }
        }
        getTitle(verbosity) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.labels.shortTitle;
                case 2 /* Verbosity.LONG */:
                    return this.labels.longTitle;
                default:
                case 1 /* Verbosity.MEDIUM */:
                    return this.labels.mediumTitle;
            }
        }
        async resolve() {
            // Create Model - we never reuse our cached model if refresh is true because we cannot
            // decide for the inputs within if the cached model can be reused or not. There may be
            // inputs that need to be loaded again and thus we always recreate the model and dispose
            // the previous one - if any.
            const resolvedModel = await this.createModel();
            this.cachedModel?.dispose();
            this.cachedModel = resolvedModel;
            return this.cachedModel;
        }
        prefersEditorPane(editorPanes) {
            if (this.forceOpenAsBinary) {
                return editorPanes.find(editorPane => editorPane.typeId === editor_1.BINARY_DIFF_EDITOR_ID);
            }
            return editorPanes.find(editorPane => editorPane.typeId === editor_1.TEXT_DIFF_EDITOR_ID);
        }
        async createModel() {
            // Join resolve call over two inputs and build diff editor model
            const [originalEditorModel, modifiedEditorModel] = await Promise.all([
                this.original.resolve(),
                this.modified.resolve()
            ]);
            // If both are text models, return textdiffeditor model
            if (modifiedEditorModel instanceof textEditorModel_1.BaseTextEditorModel && originalEditorModel instanceof textEditorModel_1.BaseTextEditorModel) {
                return new textDiffEditorModel_1.TextDiffEditorModel(originalEditorModel, modifiedEditorModel);
            }
            // Otherwise return normal diff model
            return new diffEditorModel_1.DiffEditorModel((0, editor_2.isResolvedEditorModel)(originalEditorModel) ? originalEditorModel : undefined, (0, editor_2.isResolvedEditorModel)(modifiedEditorModel) ? modifiedEditorModel : undefined);
        }
        toUntyped(options) {
            const untyped = super.toUntyped(options);
            if (untyped) {
                return {
                    ...untyped,
                    modified: untyped.primary,
                    original: untyped.secondary
                };
            }
            return undefined;
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if (otherInput instanceof DiffEditorInput_1) {
                return this.modified.matches(otherInput.modified) && this.original.matches(otherInput.original) && otherInput.forceOpenAsBinary === this.forceOpenAsBinary;
            }
            if ((0, editor_1.isResourceDiffEditorInput)(otherInput)) {
                return this.modified.matches(otherInput.modified) && this.original.matches(otherInput.original);
            }
            return false;
        }
        dispose() {
            // Free the diff editor model but do not propagate the dispose() call to the two inputs
            // We never created the two inputs (original and modified) so we can not dispose
            // them without sideeffects.
            if (this.cachedModel) {
                this.cachedModel.dispose();
                this.cachedModel = undefined;
            }
            super.dispose();
        }
    };
    exports.DiffEditorInput = DiffEditorInput;
    exports.DiffEditorInput = DiffEditorInput = DiffEditorInput_1 = __decorate([
        __param(5, editorService_1.IEditorService)
    ], DiffEditorInput);
    class DiffEditorInputSerializer extends sideBySideEditorInput_1.AbstractSideBySideEditorInputSerializer {
        createEditorInput(instantiationService, name, description, secondaryInput, primaryInput) {
            return instantiationService.createInstance(DiffEditorInput, name, description, secondaryInput, primaryInput, undefined);
        }
    }
    exports.DiffEditorInputSerializer = DiffEditorInputSerializer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvcklucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29tbW9uL2VkaXRvci9kaWZmRWRpdG9ySW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTZCaEc7OztPQUdHO0lBQ0ksSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSw2Q0FBcUI7O2lCQUVoQyxPQUFFLEdBQVcsbUNBQW1DLEFBQTlDLENBQStDO1FBRTFFLElBQWEsTUFBTTtZQUNsQixPQUFPLGlCQUFlLENBQUMsRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxJQUFhLFFBQVE7WUFDcEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUMvRixDQUFDO1FBRUQsSUFBYSxZQUFZO1lBQ3hCLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7WUFFdEMsaURBQWlEO1lBQ2pELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUNsQyxZQUFZLHFEQUE0QyxDQUFDO1lBQzFELENBQUM7WUFFRCxPQUFPLFlBQVksQ0FBQztRQUNyQixDQUFDO1FBTUQsWUFDQyxhQUFpQyxFQUNqQyxvQkFBd0MsRUFDL0IsUUFBcUIsRUFDckIsUUFBcUIsRUFDYixpQkFBc0MsRUFDdkMsYUFBNkI7WUFFN0MsS0FBSyxDQUFDLGFBQWEsRUFBRSxvQkFBb0IsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBTHJFLGFBQVEsR0FBUixRQUFRLENBQWE7WUFDckIs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