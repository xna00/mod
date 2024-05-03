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
define(["require", "exports", "vs/workbench/common/editor/editorInput", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/base/common/resources", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/configuration/common/configuration", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/customEditorLabelService"], function (require, exports, editorInput_1, files_1, label_1, resources_1, filesConfigurationService_1, configuration_1, textResourceConfiguration_1, customEditorLabelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractResourceEditorInput = void 0;
    /**
     * The base class for all editor inputs that open resources.
     */
    let AbstractResourceEditorInput = class AbstractResourceEditorInput extends editorInput_1.EditorInput {
        get capabilities() {
            let capabilities = 32 /* EditorInputCapabilities.CanSplitInGroup */;
            if (this.fileService.hasProvider(this.resource)) {
                if (this.filesConfigurationService.isReadonly(this.resource)) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            else {
                capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            }
            if (!(capabilities & 2 /* EditorInputCapabilities.Readonly */)) {
                capabilities |= 128 /* EditorInputCapabilities.CanDropIntoEditor */;
            }
            return capabilities;
        }
        get preferredResource() { return this._preferredResource; }
        constructor(resource, preferredResource, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService) {
            super();
            this.resource = resource;
            this.labelService = labelService;
            this.fileService = fileService;
            this.filesConfigurationService = filesConfigurationService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.customEditorLabelService = customEditorLabelService;
            this._name = undefined;
            this._shortDescription = undefined;
            this._mediumDescription = undefined;
            this._longDescription = undefined;
            this._shortTitle = undefined;
            this._mediumTitle = undefined;
            this._longTitle = undefined;
            this._preferredResource = preferredResource || resource;
            this.registerListeners();
        }
        registerListeners() {
            // Clear our labels on certain label related events
            this._register(this.labelService.onDidChangeFormatters(e => this.onLabelEvent(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onLabelEvent(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onLabelEvent(e.scheme)));
            this._register(this.customEditorLabelService.onDidChange(() => this.updateLabel()));
        }
        onLabelEvent(scheme) {
            if (scheme === this._preferredResource.scheme) {
                this.updateLabel();
            }
        }
        updateLabel() {
            // Clear any cached labels from before
            this._name = undefined;
            this._shortDescription = undefined;
            this._mediumDescription = undefined;
            this._longDescription = undefined;
            this._shortTitle = undefined;
            this._mediumTitle = undefined;
            this._longTitle = undefined;
            // Trigger recompute of label
            this._onDidChangeLabel.fire();
        }
        setPreferredResource(preferredResource) {
            if (!(0, resources_1.isEqual)(preferredResource, this._preferredResource)) {
                this._preferredResource = preferredResource;
                this.updateLabel();
            }
        }
        getName() {
            if (typeof this._name !== 'string') {
                this._name = this.customEditorLabelService.getName(this._preferredResource) ?? this.labelService.getUriBasenameLabel(this._preferredResource);
            }
            return this._name;
        }
        getDescription(verbosity = 1 /* Verbosity.MEDIUM */) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.shortDescription;
                case 2 /* Verbosity.LONG */:
                    return this.longDescription;
                case 1 /* Verbosity.MEDIUM */:
                default:
                    return this.mediumDescription;
            }
        }
        get shortDescription() {
            if (typeof this._shortDescription !== 'string') {
                this._shortDescription = this.labelService.getUriBasenameLabel((0, resources_1.dirname)(this._preferredResource));
            }
            return this._shortDescription;
        }
        get mediumDescription() {
            if (typeof this._mediumDescription !== 'string') {
                this._mediumDescription = this.labelService.getUriLabel((0, resources_1.dirname)(this._preferredResource), { relative: true });
            }
            return this._mediumDescription;
        }
        get longDescription() {
            if (typeof this._longDescription !== 'string') {
                this._longDescription = this.labelService.getUriLabel((0, resources_1.dirname)(this._preferredResource));
            }
            return this._longDescription;
        }
        get shortTitle() {
            if (typeof this._shortTitle !== 'string') {
                this._shortTitle = this.getName();
            }
            return this._shortTitle;
        }
        get mediumTitle() {
            if (typeof this._mediumTitle !== 'string') {
                this._mediumTitle = this.labelService.getUriLabel(this._preferredResource, { relative: true });
            }
            return this._mediumTitle;
        }
        get longTitle() {
            if (typeof this._longTitle !== 'string') {
                this._longTitle = this.labelService.getUriLabel(this._preferredResource);
            }
            return this._longTitle;
        }
        getTitle(verbosity) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.shortTitle;
                case 2 /* Verbosity.LONG */:
                    return this.longTitle;
                default:
                case 1 /* Verbosity.MEDIUM */:
                    return this.mediumTitle;
            }
        }
        isReadonly() {
            return this.filesConfigurationService.isReadonly(this.resource);
        }
        ensureLimits(options) {
            if (options?.limits) {
                return options.limits; // respect passed in limits if any
            }
            // We want to determine the large file configuration based on the best defaults
            // for the resource but also respecting user settings. We only apply user settings
            // if explicitly configured by the user. Otherwise we pick the best limit for the
            // resource scheme.
            const defaultSizeLimit = (0, files_1.getLargeFileConfirmationLimit)(this.resource);
            let configuredSizeLimit = undefined;
            const configuredSizeLimitMb = this.textResourceConfigurationService.inspect(this.resource, null, 'workbench.editorLargeFileConfirmation');
            if ((0, configuration_1.isConfigured)(configuredSizeLimitMb)) {
                configuredSizeLimit = configuredSizeLimitMb.value * files_1.ByteSize.MB; // normalize to MB
            }
            return {
                size: configuredSizeLimit ?? defaultSizeLimit
            };
        }
    };
    exports.AbstractResourceEditorInput = AbstractResourceEditorInput;
    exports.AbstractResourceEditorInput = AbstractResourceEditorInput = __decorate([
        __param(2, label_1.ILabelService),
        __param(3, files_1.IFileService),
        __param(4, filesConfigurationService_1.IFilesConfigurationService),
        __param(5, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(6, customEditorLabelService_1.ICustomEditorLabelService)
    ], AbstractResourceEditorInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VFZGl0b3JJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9lZGl0b3IvcmVzb3VyY2VFZGl0b3JJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjaEc7O09BRUc7SUFDSSxJQUFlLDJCQUEyQixHQUExQyxNQUFlLDJCQUE0QixTQUFRLHlCQUFXO1FBRXBFLElBQWEsWUFBWTtZQUN4QixJQUFJLFlBQVksbURBQTBDLENBQUM7WUFFM0QsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxJQUFJLENBQUMseUJBQXlCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUM5RCxZQUFZLDRDQUFvQyxDQUFDO2dCQUNsRCxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFlBQVksNENBQW9DLENBQUM7WUFDbEQsQ0FBQztZQUVELElBQUksQ0FBQyxDQUFDLFlBQVksMkNBQW1DLENBQUMsRUFBRSxDQUFDO2dCQUN4RCxZQUFZLHVEQUE2QyxDQUFDO1lBQzNELENBQUM7WUFFRCxPQUFPLFlBQVksQ0FBQztRQUNyQixDQUFDO1FBR0QsSUFBSSxpQkFBaUIsS0FBVSxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFFaEUsWUFDVSxRQUFhLEVBQ3RCLGlCQUFrQyxFQUNuQixZQUE4QyxFQUMvQyxXQUE0QyxFQUM5Qix5QkFBd0UsRUFDakUsZ0NBQXNGLEVBQzlGLHdCQUFzRTtZQUVqRyxLQUFLLEVBQUUsQ0FBQztZQVJDLGFBQVEsR0FBUixRQUFRLENBQUs7WUFFWSxpQkFBWSxHQUFaLFlBQVks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