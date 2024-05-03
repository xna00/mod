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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/editSessions", "vs/platform/workspace/common/workspace"], function (require, exports, buffer_1, resources_1, uri_1, extensions_1, instantiation_1, editSessions_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceIdentityService = exports.IWorkspaceIdentityService = void 0;
    exports.IWorkspaceIdentityService = (0, instantiation_1.createDecorator)('IWorkspaceIdentityService');
    let WorkspaceIdentityService = class WorkspaceIdentityService {
        constructor(workspaceContextService, editSessionIdentityService) {
            this.workspaceContextService = workspaceContextService;
            this.editSessionIdentityService = editSessionIdentityService;
        }
        async getWorkspaceStateFolders(cancellationToken) {
            const workspaceStateFolders = [];
            for (const workspaceFolder of this.workspaceContextService.getWorkspace().folders) {
                const workspaceFolderIdentity = await this.editSessionIdentityService.getEditSessionIdentifier(workspaceFolder, cancellationToken);
                if (!workspaceFolderIdentity) {
                    continue;
                }
                workspaceStateFolders.push({ resourceUri: workspaceFolder.uri.toString(), workspaceFolderIdentity });
            }
            return workspaceStateFolders;
        }
        async matches(incomingWorkspaceFolders, cancellationToken) {
            const incomingToCurrentWorkspaceFolderUris = {};
            const incomingIdentitiesToIncomingWorkspaceFolders = {};
            for (const workspaceFolder of incomingWorkspaceFolders) {
                incomingIdentitiesToIncomingWorkspaceFolders[workspaceFolder.workspaceFolderIdentity] = workspaceFolder.resourceUri;
            }
            // Precompute the identities of the current workspace folders
            const currentWorkspaceFoldersToIdentities = new Map();
            for (const workspaceFolder of this.workspaceContextService.getWorkspace().folders) {
                const workspaceFolderIdentity = await this.editSessionIdentityService.getEditSessionIdentifier(workspaceFolder, cancellationToken);
                if (!workspaceFolderIdentity) {
                    continue;
                }
                currentWorkspaceFoldersToIdentities.set(workspaceFolder, workspaceFolderIdentity);
            }
            // Match the current workspace folders to the incoming workspace folders
            for (const [currentWorkspaceFolder, currentWorkspaceFolderIdentity] of currentWorkspaceFoldersToIdentities.entries()) {
                // Happy case: identities do not need further disambiguation
                const incomingWorkspaceFolder = incomingIdentitiesToIncomingWorkspaceFolders[currentWorkspaceFolderIdentity];
                if (incomingWorkspaceFolder) {
                    // There is an incoming workspace folder with the exact same identity as the current workspace folder
                    incomingToCurrentWorkspaceFolderUris[incomingWorkspaceFolder] = currentWorkspaceFolder.uri.toString();
                    continue;
                }
                // Unhappy case: compare the identity of the current workspace folder to all incoming workspace folder identities
                let hasCompleteMatch = false;
                for (const [incomingIdentity, incomingFolder] of Object.entries(incomingIdentitiesToIncomingWorkspaceFolders)) {
                    if (await this.editSessionIdentityService.provideEditSessionIdentityMatch(currentWorkspaceFolder, currentWorkspaceFolderIdentity, incomingIdentity, cancellationToken) === editSessions_1.EditSessionIdentityMatch.Complete) {
                        incomingToCurrentWorkspaceFolderUris[incomingFolder] = currentWorkspaceFolder.uri.toString();
                        hasCompleteMatch = true;
                        break;
                    }
                }
                if (hasCompleteMatch) {
                    continue;
                }
                return false;
            }
            const convertUri = (uriToConvert) => {
                // Figure out which current folder the incoming URI is a child of
                for (const incomingFolderUriKey of Object.keys(incomingToCurrentWorkspaceFolderUris)) {
                    const incomingFolderUri = uri_1.URI.parse(incomingFolderUriKey);
                    if ((0, resources_1.isEqualOrParent)(incomingFolderUri, uriToConvert)) {
                        const currentWorkspaceFolderUri = incomingToCurrentWorkspaceFolderUris[incomingFolderUriKey];
                        // Compute the relative file path section of the uri to convert relative to the folder it came from
                        const relativeFilePath = (0, resources_1.relativePath)(incomingFolderUri, uriToConvert);
                        // Reparent the relative file path under the current workspace folder it belongs to
                        if (relativeFilePath) {
                            return (0, resources_1.joinPath)(uri_1.URI.parse(currentWorkspaceFolderUri), relativeFilePath);
                        }
                    }
                }
                // No conversion was possible; return the original URI
                return uriToConvert;
            };
            // Recursively look for any URIs in the provided object and
            // replace them with the URIs of the current workspace folders
            const uriReplacer = (obj, depth = 0) => {
                if (!obj || depth > 200) {
                    return obj;
                }
                if (obj instanceof buffer_1.VSBuffer || obj instanceof Uint8Array) {
                    return obj;
                }
                if (uri_1.URI.isUri(obj)) {
                    return convertUri(obj);
                }
                if (Array.isArray(obj)) {
                    for (let i = 0; i < obj.length; ++i) {
                        obj[i] = uriReplacer(obj[i], depth + 1);
                    }
                }
                else {
                    // walk object
                    for (const key in obj) {
                        if (Object.hasOwnProperty.call(obj, key)) {
                            obj[key] = uriReplacer(obj[key], depth + 1);
                        }
                    }
                }
                return obj;
            };
            return uriReplacer;
        }
    };
    exports.WorkspaceIdentityService = WorkspaceIdentityService;
    exports.WorkspaceIdentityService = WorkspaceIdentityService = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, editSessions_1.IEditSessionIdentityService)
    ], WorkspaceIdentityService);
    (0, extensions_1.registerSingleton)(exports.IWorkspaceIdentityService, WorkspaceIdentityService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlSWRlbnRpdHlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya3NwYWNlcy9jb21tb24vd29ya3NwYWNlSWRlbnRpdHlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVluRixRQUFBLHlCQUF5QixHQUFHLElBQUEsK0JBQWUsRUFBNEIsMkJBQTJCLENBQUMsQ0FBQztJQU8xRyxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF3QjtRQUdwQyxZQUM0Qyx1QkFBaUQsRUFDOUMsMEJBQXVEO1lBRDFELDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDOUMsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtRQUNsRyxDQUFDO1FBRUwsS0FBSyxDQUFDLHdCQUF3QixDQUFDLGlCQUFvQztZQUNsRSxNQUFNLHFCQUFxQixHQUE0QixFQUFFLENBQUM7WUFFMUQsS0FBSyxNQUFNLGVBQWUsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25GLE1BQU0sdUJBQXVCLEdBQUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsd0JBQXdCLENBQUMsZUFBZSxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBQ25JLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUFDLFNBQVM7Z0JBQUMsQ0FBQztnQkFDM0MscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUFFLGVBQWUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDO1lBQ3RHLENBQUM7WUFFRCxPQUFPLHFCQUFxQixDQUFDO1FBQzlCLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLHdCQUFpRCxFQUFFLGlCQUFvQztZQUNwRyxNQUFNLG9DQUFvQyxHQUE4QixFQUFFLENBQUM7WUFFM0UsTUFBTSw0Q0FBNEMsR0FBOEIsRUFBRSxDQUFDO1lBQ25GLEtBQUssTUFBTSxlQUFlLElBQUksd0JBQXdCLEVBQUUsQ0FBQztnQkFDeEQsNENBQTRDLENBQUMsZUFBZSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsZUFBZSxDQUFDLFdBQVcsQ0FBQztZQUNySCxDQUFDO1lBRUQsNkRBQTZEO1lBQzdELE1BQU0sbUNBQW1DLEdBQUcsSUFBSSxHQUFHLEVBQTRCLENBQUM7WUFDaEYsS0FBSyxNQUFNLGVBQWUsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25GLE1BQU0sdUJBQXVCLEdBQUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsd0JBQXdCLENBQUMsZUFBZSxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBQ25JLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUFDLFNBQVM7Z0JBQUMsQ0FBQztnQkFDM0MsbUNBQW1DLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQ25GLENBQUM7WUFFRCx3RUFBd0U7WUFDeEUsS0FBSyxNQUFNLENBQUMsc0JBQXNCLEVBQUUsOEJBQThCLENBQUMsSUFBSSxtQ0FBbUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO2dCQUV0SCw0REFBNEQ7Z0JBQzVELE1BQU0sdUJBQXVCLEdBQUcsNENBQTRDLENBQUMsOEJBQThCLENBQUMsQ0FBQztnQkFDN0csSUFBSSx1QkFBdUIsRUFBRSxDQUFDO29CQUM3QixxR0FBcUc7b0JBQ3JHLG9DQUFvQyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsc0JBQXNCLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN0RyxTQUFTO2dCQUNWLENBQUM7Z0JBRUQsaUhBQWlIO2dCQUNqSCxJQUFJLGdCQUFnQixHQUFHLEtBQUssQ0FBQztnQkFDN0IsS0FBSyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyw0Q0FBNEMsQ0FBQyxFQUFFLENBQUM7b0JBQy9HLElBQUksTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsK0JBQStCLENBQUMsc0JBQXNCLEVBQUUsOEJBQThCLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLENBQUMsS0FBSyx1Q0FBd0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFDOU0sb0NBQW9DLENBQUMsY0FBYyxDQUFDLEdBQUcsc0JBQXNCLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUM3RixnQkFBZ0IsR0FBRyxJQUFJLENBQUM7d0JBQ3hCLE1BQU07b0JBQ1AsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksZ0JBQWdCLEVBQUUsQ0FBQztvQkFDdEIsU0FBUztnQkFDVixDQUFDO2dCQUVELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLENBQUMsWUFBaUIsRUFBRSxFQUFFO2dCQUN4QyxpRUFBaUU7Z0JBQ2pFLEtBQUssTUFBTSxvQkFBb0IsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQztvQkFDdEYsTUFBTSxpQkFBaUIsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7b0JBQzFELElBQUksSUFBQSwyQkFBZSxFQUFDLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUM7d0JBQ3RELE1BQU0seUJBQXlCLEdBQUcsb0NBQW9DLENBQUMsb0JBQW9CLENBQUMsQ0FBQzt3QkFFN0YsbUdBQW1HO3dCQUNuRyxNQUFNLGdCQUFnQixHQUFHLElBQUEsd0JBQVksRUFBQyxpQkFBaUIsRUFBRSxZQUFZLENBQUMsQ0FBQzt3QkFFdkUsbUZBQW1GO3dCQUNuRixJQUFJLGdCQUFnQixFQUFFLENBQUM7NEJBQ3RCLE9BQU8sSUFBQSxvQkFBUSxFQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMseUJBQXlCLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO3dCQUN6RSxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxzREFBc0Q7Z0JBQ3RELE9BQU8sWUFBWSxDQUFDO1lBQ3JCLENBQUMsQ0FBQztZQUVGLDJEQUEyRDtZQUMzRCw4REFBOEQ7WUFDOUQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxHQUFRLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxFQUFFO2dCQUMzQyxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssR0FBRyxHQUFHLEVBQUUsQ0FBQztvQkFDekIsT0FBTyxHQUFHLENBQUM7Z0JBQ1osQ0FBQztnQkFFRCxJQUFJLEdBQUcsWUFBWSxpQkFBUSxJQUFJLEdBQUcsWUFBWSxVQUFVLEVBQUUsQ0FBQztvQkFDMUQsT0FBWSxHQUFHLENBQUM7Z0JBQ2pCLENBQUM7Z0JBRUQsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3BCLE9BQU8sVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QixDQUFDO2dCQUVELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN4QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO3dCQUNyQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3pDLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLGNBQWM7b0JBQ2QsS0FBSyxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQzt3QkFDdkIsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQzs0QkFDMUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUM3QyxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUMsQ0FBQztZQUVGLE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7S0FDRCxDQUFBO0lBdEhZLDREQUF3Qjt1Q0FBeEIsd0JBQXdCO1FBSWxDLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSwwQ0FBMkIsQ0FBQTtPQUxqQix3QkFBd0IsQ0FzSHBDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxpQ0FBeUIsRUFBRSx3QkFBd0Isb0NBQTRCLENBQUMifQ==