/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/mime", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/strings", "vs/editor/common/languages/modesRegistry"], function (require, exports, glob_1, mime_1, network_1, path_1, resources_1, strings_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerPlatformLanguageAssociation = registerPlatformLanguageAssociation;
    exports.registerConfiguredLanguageAssociation = registerConfiguredLanguageAssociation;
    exports.clearPlatformLanguageAssociations = clearPlatformLanguageAssociations;
    exports.clearConfiguredLanguageAssociations = clearConfiguredLanguageAssociations;
    exports.getMimeTypes = getMimeTypes;
    exports.getLanguageIds = getLanguageIds;
    let registeredAssociations = [];
    let nonUserRegisteredAssociations = [];
    let userRegisteredAssociations = [];
    /**
     * Associate a language to the registry (platform).
     * * **NOTE**: This association will lose over associations registered using `registerConfiguredLanguageAssociation`.
     * * **NOTE**: Use `clearPlatformLanguageAssociations` to remove all associations registered using this function.
     */
    function registerPlatformLanguageAssociation(association, warnOnOverwrite = false) {
        _registerLanguageAssociation(association, false, warnOnOverwrite);
    }
    /**
     * Associate a language to the registry (configured).
     * * **NOTE**: This association will win over associations registered using `registerPlatformLanguageAssociation`.
     * * **NOTE**: Use `clearConfiguredLanguageAssociations` to remove all associations registered using this function.
     */
    function registerConfiguredLanguageAssociation(association) {
        _registerLanguageAssociation(association, true, false);
    }
    function _registerLanguageAssociation(association, userConfigured, warnOnOverwrite) {
        // Register
        const associationItem = toLanguageAssociationItem(association, userConfigured);
        registeredAssociations.push(associationItem);
        if (!associationItem.userConfigured) {
            nonUserRegisteredAssociations.push(associationItem);
        }
        else {
            userRegisteredAssociations.push(associationItem);
        }
        // Check for conflicts unless this is a user configured association
        if (warnOnOverwrite && !associationItem.userConfigured) {
            registeredAssociations.forEach(a => {
                if (a.mime === associationItem.mime || a.userConfigured) {
                    return; // same mime or userConfigured is ok
                }
                if (associationItem.extension && a.extension === associationItem.extension) {
                    console.warn(`Overwriting extension <<${associationItem.extension}>> to now point to mime <<${associationItem.mime}>>`);
                }
                if (associationItem.filename && a.filename === associationItem.filename) {
                    console.warn(`Overwriting filename <<${associationItem.filename}>> to now point to mime <<${associationItem.mime}>>`);
                }
                if (associationItem.filepattern && a.filepattern === associationItem.filepattern) {
                    console.warn(`Overwriting filepattern <<${associationItem.filepattern}>> to now point to mime <<${associationItem.mime}>>`);
                }
                if (associationItem.firstline && a.firstline === associationItem.firstline) {
                    console.warn(`Overwriting firstline <<${associationItem.firstline}>> to now point to mime <<${associationItem.mime}>>`);
                }
            });
        }
    }
    function toLanguageAssociationItem(association, userConfigured) {
        return {
            id: association.id,
            mime: association.mime,
            filename: association.filename,
            extension: association.extension,
            filepattern: association.filepattern,
            firstline: association.firstline,
            userConfigured: userConfigured,
            filenameLowercase: association.filename ? association.filename.toLowerCase() : undefined,
            extensionLowercase: association.extension ? association.extension.toLowerCase() : undefined,
            filepatternLowercase: association.filepattern ? (0, glob_1.parse)(association.filepattern.toLowerCase()) : undefined,
            filepatternOnPath: association.filepattern ? association.filepattern.indexOf(path_1.posix.sep) >= 0 : false
        };
    }
    /**
     * Clear language associations from the registry (platform).
     */
    function clearPlatformLanguageAssociations() {
        registeredAssociations = registeredAssociations.filter(a => a.userConfigured);
        nonUserRegisteredAssociations = [];
    }
    /**
     * Clear language associations from the registry (configured).
     */
    function clearConfiguredLanguageAssociations() {
        registeredAssociations = registeredAssociations.filter(a => !a.userConfigured);
        userRegisteredAssociations = [];
    }
    /**
     * Given a file, return the best matching mime types for it
     * based on the registered language associations.
     */
    function getMimeTypes(resource, firstLine) {
        return getAssociations(resource, firstLine).map(item => item.mime);
    }
    /**
     * @see `getMimeTypes`
     */
    function getLanguageIds(resource, firstLine) {
        return getAssociations(resource, firstLine).map(item => item.id);
    }
    function getAssociations(resource, firstLine) {
        let path;
        if (resource) {
            switch (resource.scheme) {
                case network_1.Schemas.file:
                    path = resource.fsPath;
                    break;
                case network_1.Schemas.data: {
                    const metadata = resources_1.DataUri.parseMetaData(resource);
                    path = metadata.get(resources_1.DataUri.META_DATA_LABEL);
                    break;
                }
                case network_1.Schemas.vscodeNotebookCell:
                    // File path not relevant for language detection of cell
                    path = undefined;
                    break;
                default:
                    path = resource.path;
            }
        }
        if (!path) {
            return [{ id: 'unknown', mime: mime_1.Mimes.unknown }];
        }
        path = path.toLowerCase();
        const filename = (0, path_1.basename)(path);
        // 1.) User configured mappings have highest priority
        const configuredLanguage = getAssociationByPath(path, filename, userRegisteredAssociations);
        if (configuredLanguage) {
            return [configuredLanguage, { id: modesRegistry_1.PLAINTEXT_LANGUAGE_ID, mime: mime_1.Mimes.text }];
        }
        // 2.) Registered mappings have middle priority
        const registeredLanguage = getAssociationByPath(path, filename, nonUserRegisteredAssociations);
        if (registeredLanguage) {
            return [registeredLanguage, { id: modesRegistry_1.PLAINTEXT_LANGUAGE_ID, mime: mime_1.Mimes.text }];
        }
        // 3.) Firstline has lowest priority
        if (firstLine) {
            const firstlineLanguage = getAssociationByFirstline(firstLine);
            if (firstlineLanguage) {
                return [firstlineLanguage, { id: modesRegistry_1.PLAINTEXT_LANGUAGE_ID, mime: mime_1.Mimes.text }];
            }
        }
        return [{ id: 'unknown', mime: mime_1.Mimes.unknown }];
    }
    function getAssociationByPath(path, filename, associations) {
        let filenameMatch = undefined;
        let patternMatch = undefined;
        let extensionMatch = undefined;
        // We want to prioritize associations based on the order they are registered so that the last registered
        // association wins over all other. This is for https://github.com/microsoft/vscode/issues/20074
        for (let i = associations.length - 1; i >= 0; i--) {
            const association = associations[i];
            // First exact name match
            if (filename === association.filenameLowercase) {
                filenameMatch = association;
                break; // take it!
            }
            // Longest pattern match
            if (association.filepattern) {
                if (!patternMatch || association.filepattern.length > patternMatch.filepattern.length) {
                    const target = association.filepatternOnPath ? path : filename; // match on full path if pattern contains path separator
                    if (association.filepatternLowercase?.(target)) {
                        patternMatch = association;
                    }
                }
            }
            // Longest extension match
            if (association.extension) {
                if (!extensionMatch || association.extension.length > extensionMatch.extension.length) {
                    if (filename.endsWith(association.extensionLowercase)) {
                        extensionMatch = association;
                    }
                }
            }
        }
        // 1.) Exact name match has second highest priority
        if (filenameMatch) {
            return filenameMatch;
        }
        // 2.) Match on pattern
        if (patternMatch) {
            return patternMatch;
        }
        // 3.) Match on extension comes next
        if (extensionMatch) {
            return extensionMatch;
        }
        return undefined;
    }
    function getAssociationByFirstline(firstLine) {
        if ((0, strings_1.startsWithUTF8BOM)(firstLine)) {
            firstLine = firstLine.substr(1);
        }
        if (firstLine.length > 0) {
            // We want to prioritize associations based on the order they are registered so that the last registered
            // association wins over all other. This is for https://github.com/microsoft/vscode/issues/20074
            for (let i = registeredAssociations.length - 1; i >= 0; i--) {
                const association = registeredAssociations[i];
                if (!association.firstline) {
                    continue;
                }
                const matches = firstLine.match(association.firstline);
                if (matches && matches.length > 0) {
                    return association;
                }
            }
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VzQXNzb2NpYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL2xhbmd1YWdlc0Fzc29jaWF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFDaEcsa0ZBRUM7SUFPRCxzRkFFQztJQTBERCw4RUFHQztJQUtELGtGQUdDO0lBV0Qsb0NBRUM7SUFLRCx3Q0FFQztJQTdHRCxJQUFJLHNCQUFzQixHQUErQixFQUFFLENBQUM7SUFDNUQsSUFBSSw2QkFBNkIsR0FBK0IsRUFBRSxDQUFDO0lBQ25FLElBQUksMEJBQTBCLEdBQStCLEVBQUUsQ0FBQztJQUVoRTs7OztPQUlHO0lBQ0gsU0FBZ0IsbUNBQW1DLENBQUMsV0FBaUMsRUFBRSxlQUFlLEdBQUcsS0FBSztRQUM3Ryw0QkFBNEIsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBZ0IscUNBQXFDLENBQUMsV0FBaUM7UUFDdEYsNEJBQTRCLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsU0FBUyw0QkFBNEIsQ0FBQyxXQUFpQyxFQUFFLGNBQXVCLEVBQUUsZUFBd0I7UUFFekgsV0FBVztRQUNYLE1BQU0sZUFBZSxHQUFHLHlCQUF5QixDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUMvRSxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNyQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDckQsQ0FBQzthQUFNLENBQUM7WUFDUCwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVELG1FQUFtRTtRQUNuRSxJQUFJLGVBQWUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN4RCxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2xDLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDekQsT0FBTyxDQUFDLG9DQUFvQztnQkFDN0MsQ0FBQztnQkFFRCxJQUFJLGVBQWUsQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLFNBQVMsS0FBSyxlQUFlLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQzVFLE9BQU8sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLGVBQWUsQ0FBQyxTQUFTLDZCQUE2QixlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztnQkFDekgsQ0FBQztnQkFFRCxJQUFJLGVBQWUsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLFFBQVEsS0FBSyxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3pFLE9BQU8sQ0FBQyxJQUFJLENBQUMsMEJBQTBCLGVBQWUsQ0FBQyxRQUFRLDZCQUE2QixlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztnQkFDdkgsQ0FBQztnQkFFRCxJQUFJLGVBQWUsQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDLFdBQVcsS0FBSyxlQUFlLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2xGLE9BQU8sQ0FBQyxJQUFJLENBQUMsNkJBQTZCLGVBQWUsQ0FBQyxXQUFXLDZCQUE2QixlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztnQkFDN0gsQ0FBQztnQkFFRCxJQUFJLGVBQWUsQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLFNBQVMsS0FBSyxlQUFlLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQzVFLE9BQU8sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLGVBQWUsQ0FBQyxTQUFTLDZCQUE2QixlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztnQkFDekgsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLHlCQUF5QixDQUFDLFdBQWlDLEVBQUUsY0FBdUI7UUFDNUYsT0FBTztZQUNOLEVBQUUsRUFBRSxXQUFXLENBQUMsRUFBRTtZQUNsQixJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUk7WUFDdEIsUUFBUSxFQUFFLFdBQVcsQ0FBQyxRQUFRO1lBQzlCLFNBQVMsRUFBRSxXQUFXLENBQUMsU0FBUztZQUNoQyxXQUFXLEVBQUUsV0FBVyxDQUFDLFdBQVc7WUFDcEMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxTQUFTO1lBQ2hDLGNBQWMsRUFBRSxjQUFjO1lBQzlCLGlCQUFpQixFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVM7WUFDeEYsa0JBQWtCLEVBQUUsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUztZQUMzRixvQkFBb0IsRUFBRSxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFBLFlBQUssRUFBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7WUFDeEcsaUJBQWlCLEVBQUUsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsWUFBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSztTQUNwRyxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0IsaUNBQWlDO1FBQ2hELHNCQUFzQixHQUFHLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUM5RSw2QkFBNkIsR0FBRyxFQUFFLENBQUM7SUFDcEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBZ0IsbUNBQW1DO1FBQ2xELHNCQUFzQixHQUFHLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQy9FLDBCQUEwQixHQUFHLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBT0Q7OztPQUdHO0lBQ0gsU0FBZ0IsWUFBWSxDQUFDLFFBQW9CLEVBQUUsU0FBa0I7UUFDcEUsT0FBTyxlQUFlLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFnQixjQUFjLENBQUMsUUFBb0IsRUFBRSxTQUFrQjtRQUN0RSxPQUFPLGVBQWUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCxTQUFTLGVBQWUsQ0FBQyxRQUFvQixFQUFFLFNBQWtCO1FBQ2hFLElBQUksSUFBd0IsQ0FBQztRQUM3QixJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQ2QsUUFBUSxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3pCLEtBQUssaUJBQU8sQ0FBQyxJQUFJO29CQUNoQixJQUFJLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztvQkFDdkIsTUFBTTtnQkFDUCxLQUFLLGlCQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDbkIsTUFBTSxRQUFRLEdBQUcsbUJBQU8sQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ2pELElBQUksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG1CQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQzdDLE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCxLQUFLLGlCQUFPLENBQUMsa0JBQWtCO29CQUM5Qix3REFBd0Q7b0JBQ3hELElBQUksR0FBRyxTQUFTLENBQUM7b0JBQ2pCLE1BQU07Z0JBQ1A7b0JBQ0MsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFDdkIsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWCxPQUFPLENBQUMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxZQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRUQsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUUxQixNQUFNLFFBQVEsR0FBRyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUVoQyxxREFBcUQ7UUFDckQsTUFBTSxrQkFBa0IsR0FBRyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLDBCQUEwQixDQUFDLENBQUM7UUFDNUYsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLEVBQUUsRUFBRSxxQ0FBcUIsRUFBRSxJQUFJLEVBQUUsWUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVELCtDQUErQztRQUMvQyxNQUFNLGtCQUFrQixHQUFHLG9CQUFvQixDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztRQUMvRixJQUFJLGtCQUFrQixFQUFFLENBQUM7WUFDeEIsT0FBTyxDQUFDLGtCQUFrQixFQUFFLEVBQUUsRUFBRSxFQUFFLHFDQUFxQixFQUFFLElBQUksRUFBRSxZQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBRUQsb0NBQW9DO1FBQ3BDLElBQUksU0FBUyxFQUFFLENBQUM7WUFDZixNQUFNLGlCQUFpQixHQUFHLHlCQUF5QixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQy9ELElBQUksaUJBQWlCLEVBQUUsQ0FBQztnQkFDdkIsT0FBTyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsRUFBRSxFQUFFLHFDQUFxQixFQUFFLElBQUksRUFBRSxZQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM3RSxDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sQ0FBQyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFlBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRCxTQUFTLG9CQUFvQixDQUFDLElBQVksRUFBRSxRQUFnQixFQUFFLFlBQXdDO1FBQ3JHLElBQUksYUFBYSxHQUF5QyxTQUFTLENBQUM7UUFDcEUsSUFBSSxZQUFZLEdBQXlDLFNBQVMsQ0FBQztRQUNuRSxJQUFJLGNBQWMsR0FBeUMsU0FBUyxDQUFDO1FBRXJFLHdHQUF3RztRQUN4RyxnR0FBZ0c7UUFDaEcsS0FBSyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDbkQsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXBDLHlCQUF5QjtZQUN6QixJQUFJLFFBQVEsS0FBSyxXQUFXLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDaEQsYUFBYSxHQUFHLFdBQVcsQ0FBQztnQkFDNUIsTUFBTSxDQUFDLFdBQVc7WUFDbkIsQ0FBQztZQUVELHdCQUF3QjtZQUN4QixJQUFJLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFlBQVksSUFBSSxXQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUMsV0FBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUN4RixNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsd0RBQXdEO29CQUN4SCxJQUFJLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7d0JBQ2hELFlBQVksR0FBRyxXQUFXLENBQUM7b0JBQzVCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCwwQkFBMEI7WUFDMUIsSUFBSSxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxjQUFjLElBQUksV0FBVyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFNBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDeEYsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxrQkFBbUIsQ0FBQyxFQUFFLENBQUM7d0JBQ3hELGNBQWMsR0FBRyxXQUFXLENBQUM7b0JBQzlCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsbURBQW1EO1FBQ25ELElBQUksYUFBYSxFQUFFLENBQUM7WUFDbkIsT0FBTyxhQUFhLENBQUM7UUFDdEIsQ0FBQztRQUVELHVCQUF1QjtRQUN2QixJQUFJLFlBQVksRUFBRSxDQUFDO1lBQ2xCLE9BQU8sWUFBWSxDQUFDO1FBQ3JCLENBQUM7UUFFRCxvQ0FBb0M7UUFDcEMsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNwQixPQUFPLGNBQWMsQ0FBQztRQUN2QixDQUFDO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUVELFNBQVMseUJBQXlCLENBQUMsU0FBaUI7UUFDbkQsSUFBSSxJQUFBLDJCQUFpQixFQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDbEMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUUxQix3R0FBd0c7WUFDeEcsZ0dBQWdHO1lBQ2hHLEtBQUssSUFBSSxDQUFDLEdBQUcsc0JBQXNCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzdELE1BQU0sV0FBVyxHQUFHLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUM1QixTQUFTO2dCQUNWLENBQUM7Z0JBRUQsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3ZELElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ25DLE9BQU8sV0FBVyxDQUFDO2dCQUNwQixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDIn0=