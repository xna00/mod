/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/iterator", "vs/base/common/resources"], function (require, exports, glob, iterator_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookStaticPreloadInfo = exports.NotebookOutputRendererInfo = void 0;
    class DependencyList {
        constructor(value) {
            this.value = new Set(value);
            this.defined = this.value.size > 0;
        }
        /** Gets whether any of the 'available' dependencies match the ones in this list */
        matches(available) {
            // For now this is simple, but this may expand to support globs later
            // @see https://github.com/microsoft/vscode/issues/119899
            return available.some(v => this.value.has(v));
        }
    }
    class NotebookOutputRendererInfo {
        constructor(descriptor) {
            this.id = descriptor.id;
            this.extensionId = descriptor.extension.identifier;
            this.extensionLocation = descriptor.extension.extensionLocation;
            this.isBuiltin = descriptor.extension.isBuiltin;
            if (typeof descriptor.entrypoint === 'string') {
                this.entrypoint = {
                    extends: undefined,
                    path: (0, resources_1.joinPath)(this.extensionLocation, descriptor.entrypoint)
                };
            }
            else {
                this.entrypoint = {
                    extends: descriptor.entrypoint.extends,
                    path: (0, resources_1.joinPath)(this.extensionLocation, descriptor.entrypoint.path)
                };
            }
            this.displayName = descriptor.displayName;
            this.mimeTypes = descriptor.mimeTypes;
            this.mimeTypeGlobs = this.mimeTypes.map(pattern => glob.parse(pattern));
            this.hardDependencies = new DependencyList(descriptor.dependencies ?? iterator_1.Iterable.empty());
            this.optionalDependencies = new DependencyList(descriptor.optionalDependencies ?? iterator_1.Iterable.empty());
            this.messaging = descriptor.requiresMessaging ?? "never" /* RendererMessagingSpec.Never */;
        }
        matchesWithoutKernel(mimeType) {
            if (!this.matchesMimeTypeOnly(mimeType)) {
                return 3 /* NotebookRendererMatch.Never */;
            }
            if (this.hardDependencies.defined) {
                return 0 /* NotebookRendererMatch.WithHardKernelDependency */;
            }
            if (this.optionalDependencies.defined) {
                return 1 /* NotebookRendererMatch.WithOptionalKernelDependency */;
            }
            return 2 /* NotebookRendererMatch.Pure */;
        }
        matches(mimeType, kernelProvides) {
            if (!this.matchesMimeTypeOnly(mimeType)) {
                return 3 /* NotebookRendererMatch.Never */;
            }
            if (this.hardDependencies.defined) {
                return this.hardDependencies.matches(kernelProvides)
                    ? 0 /* NotebookRendererMatch.WithHardKernelDependency */
                    : 3 /* NotebookRendererMatch.Never */;
            }
            return this.optionalDependencies.matches(kernelProvides)
                ? 1 /* NotebookRendererMatch.WithOptionalKernelDependency */
                : 2 /* NotebookRendererMatch.Pure */;
        }
        matchesMimeTypeOnly(mimeType) {
            if (this.entrypoint.extends) { // We're extending another renderer
                return false;
            }
            return this.mimeTypeGlobs.some(pattern => pattern(mimeType)) || this.mimeTypes.some(pattern => pattern === mimeType);
        }
    }
    exports.NotebookOutputRendererInfo = NotebookOutputRendererInfo;
    class NotebookStaticPreloadInfo {
        constructor(descriptor) {
            this.type = descriptor.type;
            this.entrypoint = (0, resources_1.joinPath)(descriptor.extension.extensionLocation, descriptor.entrypoint);
            this.extensionLocation = descriptor.extension.extensionLocation;
            this.localResourceRoots = descriptor.localResourceRoots.map(root => (0, resources_1.joinPath)(descriptor.extension.extensionLocation, root));
        }
    }
    exports.NotebookStaticPreloadInfo = NotebookStaticPreloadInfo;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPdXRwdXRSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svY29tbW9uL25vdGVib29rT3V0cHV0UmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQU0sY0FBYztRQUluQixZQUFZLEtBQXVCO1lBQ2xDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELG1GQUFtRjtRQUM1RSxPQUFPLENBQUMsU0FBZ0M7WUFDOUMscUVBQXFFO1lBQ3JFLHlEQUF5RDtZQUN6RCxPQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9DLENBQUM7S0FDRDtJQUVELE1BQWEsMEJBQTBCO1FBZ0J0QyxZQUFZLFVBU1g7WUFDQSxJQUFJLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztZQUNuRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQztZQUNoRSxJQUFJLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO1lBRWhELElBQUksT0FBTyxVQUFVLENBQUMsVUFBVSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLENBQUMs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