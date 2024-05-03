/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/nls", "vs/base/common/semver/semver"], function (require, exports, extensions_1, nls_1, semver) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dedupExtensions = dedupExtensions;
    // TODO: @sandy081 merge this with deduping in extensionsScannerService.ts
    function dedupExtensions(system, user, development, logService) {
        const result = new extensions_1.ExtensionIdentifierMap();
        system.forEach((systemExtension) => {
            const extension = result.get(systemExtension.identifier);
            if (extension) {
                logService.warn((0, nls_1.localize)('overwritingExtension', "Overwriting extension {0} with {1}.", extension.extensionLocation.fsPath, systemExtension.extensionLocation.fsPath));
            }
            result.set(systemExtension.identifier, systemExtension);
        });
        user.forEach((userExtension) => {
            const extension = result.get(userExtension.identifier);
            if (extension) {
                if (extension.isBuiltin) {
                    if (semver.gte(extension.version, userExtension.version)) {
                        logService.warn(`Skipping extension ${userExtension.extensionLocation.path} in favour of the builtin extension ${extension.extensionLocation.path}.`);
                        return;
                    }
                    // Overwriting a builtin extension inherits the `isBuiltin` property and it doesn't show a warning
                    userExtension.isBuiltin = true;
                }
                else {
                    logService.warn((0, nls_1.localize)('overwritingExtension', "Overwriting extension {0} with {1}.", extension.extensionLocation.fsPath, userExtension.extensionLocation.fsPath));
                }
            }
            else if (userExtension.isBuiltin) {
                logService.warn(`Skipping obsolete builtin extension ${userExtension.extensionLocation.path}`);
                return;
            }
            result.set(userExtension.identifier, userExtension);
        });
        development.forEach(developedExtension => {
            logService.info((0, nls_1.localize)('extensionUnderDevelopment', "Loading development extension at {0}", developedExtension.extensionLocation.fsPath));
            const extension = result.get(developedExtension.identifier);
            if (extension) {
                if (extension.isBuiltin) {
                    // Overwriting a builtin extension inherits the `isBuiltin` property
                    developedExtension.isBuiltin = true;
                }
            }
            result.set(developedExtension.identifier, developedExtension);
        });
        return Array.from(result.values());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1V0aWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi9leHRlbnNpb25zVXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRywwQ0F3Q0M7SUF6Q0QsMEVBQTBFO0lBQzFFLFNBQWdCLGVBQWUsQ0FBQyxNQUErQixFQUFFLElBQTZCLEVBQUUsV0FBb0MsRUFBRSxVQUF1QjtRQUM1SixNQUFNLE1BQU0sR0FBRyxJQUFJLG1DQUFzQixFQUF5QixDQUFDO1FBQ25FLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxlQUFlLEVBQUUsRUFBRTtZQUNsQyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN6RCxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUscUNBQXFDLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN4SyxDQUFDO1lBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLGFBQWEsRUFBRSxFQUFFO1lBQzlCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3ZELElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ3pCLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUMxRCxVQUFVLENBQUMsSUFBSSxDQUFDLHNCQUFzQixhQUFhLENBQUMsaUJBQWlCLENBQUMsSUFBSSx1Q0FBdUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7d0JBQ3RKLE9BQU87b0JBQ1IsQ0FBQztvQkFDRCxrR0FBa0c7b0JBQ25FLGFBQWMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUNoRSxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSxxQ0FBcUMsRUFBRSxTQUFTLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN0SyxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEMsVUFBVSxDQUFDLElBQUksQ0FBQyx1Q0FBdUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQy9GLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3JELENBQUMsQ0FBQyxDQUFDO1FBQ0gsV0FBVyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO1lBQ3hDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsc0NBQXNDLEVBQUUsa0JBQWtCLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUM1SSxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVELElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ3pCLG9FQUFvRTtvQkFDckMsa0JBQW1CLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztnQkFDckUsQ0FBQztZQUNGLENBQUM7WUFDRCxNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQy9ELENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLENBQUMifQ==