/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/uri", "vs/nls", "vs/base/common/themables"], function (require, exports, codicons_1, uri_1, nls_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createProfileSchemaEnums = createProfileSchemaEnums;
    exports.terminalProfileArgsMatch = terminalProfileArgsMatch;
    exports.terminalIconsEqual = terminalIconsEqual;
    exports.isUriComponents = isUriComponents;
    function createProfileSchemaEnums(detectedProfiles, extensionProfiles) {
        const result = [{
                name: null,
                description: (0, nls_1.localize)('terminalAutomaticProfile', 'Automatically detect the default')
            }];
        result.push(...detectedProfiles.map(e => {
            return {
                name: e.profileName,
                description: createProfileDescription(e)
            };
        }));
        if (extensionProfiles) {
            result.push(...extensionProfiles.map(extensionProfile => {
                return {
                    name: extensionProfile.title,
                    description: createExtensionProfileDescription(extensionProfile)
                };
            }));
        }
        return {
            values: result.map(e => e.name),
            markdownDescriptions: result.map(e => e.description)
        };
    }
    function createProfileDescription(profile) {
        let description = `$(${themables_1.ThemeIcon.isThemeIcon(profile.icon) ? profile.icon.id : profile.icon ? profile.icon : codicons_1.Codicon.terminal.id}) ${profile.profileName}\n- path: ${profile.path}`;
        if (profile.args) {
            if (typeof profile.args === 'string') {
                description += `\n- args: "${profile.args}"`;
            }
            else {
                description += `\n- args: [${profile.args.length === 0 ? '' : `'${profile.args.join(`','`)}'`}]`;
            }
        }
        if (profile.overrideName !== undefined) {
            description += `\n- overrideName: ${profile.overrideName}`;
        }
        if (profile.color) {
            description += `\n- color: ${profile.color}`;
        }
        if (profile.env) {
            description += `\n- env: ${JSON.stringify(profile.env)}`;
        }
        return description;
    }
    function createExtensionProfileDescription(profile) {
        const description = `$(${themables_1.ThemeIcon.isThemeIcon(profile.icon) ? profile.icon.id : profile.icon ? profile.icon : codicons_1.Codicon.terminal.id}) ${profile.title}\n- extensionIdentifier: ${profile.extensionIdentifier}`;
        return description;
    }
    function terminalProfileArgsMatch(args1, args2) {
        if (!args1 && !args2) {
            return true;
        }
        else if (typeof args1 === 'string' && typeof args2 === 'string') {
            return args1 === args2;
        }
        else if (Array.isArray(args1) && Array.isArray(args2)) {
            if (args1.length !== args2.length) {
                return false;
            }
            for (let i = 0; i < args1.length; i++) {
                if (args1[i] !== args2[i]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    function terminalIconsEqual(a, b) {
        if (!a && !b) {
            return true;
        }
        else if (!a || !b) {
            return false;
        }
        if (themables_1.ThemeIcon.isThemeIcon(a) && themables_1.ThemeIcon.isThemeIcon(b)) {
            return a.id === b.id && a.color === b.color;
        }
        if (typeof a === 'object' && 'light' in a && 'dark' in a
            && typeof b === 'object' && 'light' in b && 'dark' in b) {
            const castedA = a;
            const castedB = b;
            if ((uri_1.URI.isUri(castedA.light) || isUriComponents(castedA.light)) && (uri_1.URI.isUri(castedA.dark) || isUriComponents(castedA.dark))
                && (uri_1.URI.isUri(castedB.light) || isUriComponents(castedB.light)) && (uri_1.URI.isUri(castedB.dark) || isUriComponents(castedB.dark))) {
                return castedA.light.path === castedB.light.path && castedA.dark.path === castedB.dark.path;
            }
        }
        if ((uri_1.URI.isUri(a) && uri_1.URI.isUri(b)) || (isUriComponents(a) || isUriComponents(b))) {
            const castedA = a;
            const castedB = b;
            return castedA.path === castedB.path && castedA.scheme === castedB.scheme;
        }
        return false;
    }
    function isUriComponents(thing) {
        if (!thing) {
            return false;
        }
        return typeof thing.path === 'string' &&
            typeof thing.scheme === 'string';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvY29tbW9uL3Rlcm1pbmFsUHJvZmlsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsNERBMEJDO0lBNkJELDREQWlCQztJQUVELGdEQTBCQztJQUdELDBDQU1DO0lBN0dELFNBQWdCLHdCQUF3QixDQUFDLGdCQUFvQyxFQUFFLGlCQUF3RDtRQUl0SSxNQUFNLE1BQU0sR0FBbUQsQ0FBQztnQkFDL0QsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLGtDQUFrQyxDQUFDO2FBQ3JGLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDdkMsT0FBTztnQkFDTixJQUFJLEVBQUUsQ0FBQyxDQUFDLFdBQVc7Z0JBQ25CLFdBQVcsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7YUFDeEMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDSixJQUFJLGlCQUFpQixFQUFFLENBQUM7WUFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO2dCQUN2RCxPQUFPO29CQUNOLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxLQUFLO29CQUM1QixXQUFXLEVBQUUsaUNBQWlDLENBQUMsZ0JBQWdCLENBQUM7aUJBQ2hFLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUNELE9BQU87WUFDTixNQUFNLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDL0Isb0JBQW9CLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7U0FDcEQsQ0FBQztJQUNILENBQUM7SUFFRCxTQUFTLHdCQUF3QixDQUFDLE9BQXlCO1FBQzFELElBQUksV0FBVyxHQUFHLEtBQUsscUJBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsa0JBQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLE9BQU8sQ0FBQyxXQUFXLGFBQWEsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3BMLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2xCLElBQUksT0FBTyxPQUFPLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUN0QyxXQUFXLElBQUksY0FBYyxPQUFPLENBQUMsSUFBSSxHQUFHLENBQUM7WUFDOUMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFdBQVcsSUFBSSxjQUFjLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUNsRyxDQUFDO1FBQ0YsQ0FBQztRQUNELElBQUksT0FBTyxDQUFDLFlBQVksS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN4QyxXQUFXLElBQUkscUJBQXFCLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUM1RCxDQUFDO1FBQ0QsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDbkIsV0FBVyxJQUFJLGNBQWMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzlDLENBQUM7UUFDRCxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNqQixXQUFXLElBQUksWUFBWSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQzFELENBQUM7UUFDRCxPQUFPLFdBQVcsQ0FBQztJQUNwQixDQUFDO0lBRUQsU0FBUyxpQ0FBaUMsQ0FBQyxPQUFrQztRQUM1RSxNQUFNLFdBQVcsR0FBRyxLQUFLLHFCQUFTLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGtCQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxPQUFPLENBQUMsS0FBSyw0QkFBNEIsT0FBTyxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDOU0sT0FBTyxXQUFXLENBQUM7SUFDcEIsQ0FBQztJQUdELFNBQWdCLHdCQUF3QixDQUFDLEtBQW9DLEVBQUUsS0FBb0M7UUFDbEgsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3RCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQzthQUFNLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ25FLE9BQU8sS0FBSyxLQUFLLEtBQUssQ0FBQztRQUN4QixDQUFDO2FBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN6RCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNuQyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN2QyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDM0IsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxDQUFnQixFQUFFLENBQWdCO1FBQ3BFLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNkLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQzthQUFNLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNyQixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxJQUFJLHFCQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLHFCQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDMUQsT0FBTyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQzdDLENBQUM7UUFDRCxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLE1BQU0sSUFBSSxDQUFDO2VBQ3BELE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUMxRCxNQUFNLE9BQU8sR0FBSSxDQUF1QyxDQUFDO1lBQ3pELE1BQU0sT0FBTyxHQUFJLENBQXVDLENBQUM7WUFDekQsSUFBSSxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLGVBQWUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7bUJBQzFILENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksZUFBZSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksZUFBZSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hJLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDN0YsQ0FBQztRQUNGLENBQUM7UUFDRCxJQUFJLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNsRixNQUFNLE9BQU8sR0FBSSxDQUF3QyxDQUFDO1lBQzFELE1BQU0sT0FBTyxHQUFJLENBQXdDLENBQUM7WUFDMUQsT0FBTyxPQUFPLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQzNFLENBQUM7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFHRCxTQUFnQixlQUFlLENBQUMsS0FBYztRQUM3QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDRCxPQUFPLE9BQWEsS0FBTSxDQUFDLElBQUksS0FBSyxRQUFRO1lBQzNDLE9BQWEsS0FBTSxDQUFDLE1BQU0sS0FBSyxRQUFRLENBQUM7SUFDMUMsQ0FBQyJ9