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
define(["require", "exports", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor/editorModel", "vs/editor/common/services/resolverService", "vs/base/common/marked/marked", "vs/base/common/resources", "vs/workbench/contrib/welcomeWalkthrough/common/walkThroughContentProvider", "vs/platform/instantiation/common/instantiation", "vs/base/common/network"], function (require, exports, editorInput_1, editorModel_1, resolverService_1, marked_1, resources_1, walkThroughContentProvider_1, instantiation_1, network_1) {
    "use strict";
    var WalkThroughInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WalkThroughInput = void 0;
    class WalkThroughModel extends editorModel_1.EditorModel {
        constructor(mainRef, snippetRefs) {
            super();
            this.mainRef = mainRef;
            this.snippetRefs = snippetRefs;
        }
        get main() {
            return this.mainRef;
        }
        get snippets() {
            return this.snippetRefs.map(snippet => snippet.object);
        }
        dispose() {
            this.snippetRefs.forEach(ref => ref.dispose());
            super.dispose();
        }
    }
    let WalkThroughInput = WalkThroughInput_1 = class WalkThroughInput extends editorInput_1.EditorInput {
        get capabilities() {
            return 8 /* EditorInputCapabilities.Singleton */ | super.capabilities;
        }
        get resource() { return this.options.resource; }
        constructor(options, instantiationService, textModelResolverService) {
            super();
            this.options = options;
            this.instantiationService = instantiationService;
            this.textModelResolverService = textModelResolverService;
            this.promise = null;
            this.maxTopScroll = 0;
            this.maxBottomScroll = 0;
        }
        get typeId() {
            return this.options.typeId;
        }
        getName() {
            return this.options.name;
        }
        getDescription() {
            return this.options.description || '';
        }
        getTelemetryFrom() {
            return this.options.telemetryFrom;
        }
        getTelemetryDescriptor() {
            const descriptor = super.getTelemetryDescriptor();
            descriptor['target'] = this.getTelemetryFrom();
            /* __GDPR__FRAGMENT__
                "EditorTelemetryDescriptor" : {
                    "target" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            return descriptor;
        }
        get onReady() {
            return this.options.onReady;
        }
        get layout() {
            return this.options.layout;
        }
        resolve() {
            if (!this.promise) {
                this.promise = (0, walkThroughContentProvider_1.requireToContent)(this.instantiationService, this.options.resource)
                    .then(content => {
                    if (this.resource.path.endsWith('.html')) {
                        return new WalkThroughModel(content, []);
                    }
                    const snippets = [];
                    let i = 0;
                    const renderer = new marked_1.marked.Renderer();
                    renderer.code = (code, lang) => {
                        i++;
                        const resource = this.options.resource.with({ scheme: network_1.Schemas.walkThroughSnippet, fragment: `${i}.${lang}` });
                        snippets.push(this.textModelResolverService.createModelReference(resource));
                        return `<div id="snippet-${resource.fragment}" class="walkThroughEditorContainer" ></div>`;
                    };
                    content = (0, marked_1.marked)(content, { renderer });
                    return Promise.all(snippets)
                        .then(refs => new WalkThroughModel(content, refs));
                });
            }
            return this.promise;
        }
        matches(otherInput) {
            if (super.matches(otherInput)) {
                return true;
            }
            if (otherInput instanceof WalkThroughInput_1) {
                return (0, resources_1.isEqual)(otherInput.options.resource, this.options.resource);
            }
            return false;
        }
        dispose() {
            if (this.promise) {
                this.promise.then(model => model.dispose());
                this.promise = null;
            }
            super.dispose();
        }
        relativeScrollPosition(topScroll, bottomScroll) {
            this.maxTopScroll = Math.max(this.maxTopScroll, topScroll);
            this.maxBottomScroll = Math.max(this.maxBottomScroll, bottomScroll);
        }
    };
    exports.WalkThroughInput = WalkThroughInput;
    exports.WalkThroughInput = WalkThroughInput = WalkThroughInput_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, resolverService_1.ITextModelService)
    ], WalkThroughInput);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Fsa1Rocm91Z2hJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2VsY29tZVdhbGt0aHJvdWdoL2Jyb3dzZXIvd2Fsa1Rocm91Z2hJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBZWhHLE1BQU0sZ0JBQWlCLFNBQVEseUJBQVc7UUFFekMsWUFDUyxPQUFlLEVBQ2YsV0FBMkM7WUFFbkQsS0FBSyxFQUFFLENBQUM7WUFIQSxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQ2YsZ0JBQVcsR0FBWCxXQUFXLENBQWdDO1FBR3BELENBQUM7UUFFRCxJQUFJLElBQUk7WUFDUCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVELElBQUksUUFBUTtZQUNYLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBQ0Q7SUFZTSxJQUFNLGdCQUFnQix3QkFBdEIsTUFBTSxnQkFBaUIsU0FBUSx5QkFBVztRQUVoRCxJQUFhLFlBQVk7WUFDeEIsT0FBTyw0Q0FBb0MsS0FBSyxDQUFDLFlBQVksQ0FBQztRQUMvRCxDQUFDO1FBT0QsSUFBSSxRQUFRLEtBQUssT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFFaEQsWUFDa0IsT0FBZ0MsRUFDMUIsb0JB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