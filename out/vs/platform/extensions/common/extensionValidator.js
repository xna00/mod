/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/base/common/severity", "vs/nls", "vs/base/common/semver/semver"], function (require, exports, resources_1, severity_1, nls, semver) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isValidVersionStr = isValidVersionStr;
    exports.parseVersion = parseVersion;
    exports.normalizeVersion = normalizeVersion;
    exports.isValidVersion = isValidVersion;
    exports.validateExtensionManifest = validateExtensionManifest;
    exports.isValidExtensionVersion = isValidExtensionVersion;
    exports.isEngineValid = isEngineValid;
    const VERSION_REGEXP = /^(\^|>=)?((\d+)|x)\.((\d+)|x)\.((\d+)|x)(\-.*)?$/;
    const NOT_BEFORE_REGEXP = /^-(\d{4})(\d{2})(\d{2})$/;
    function isValidVersionStr(version) {
        version = version.trim();
        return (version === '*' || VERSION_REGEXP.test(version));
    }
    function parseVersion(version) {
        if (!isValidVersionStr(version)) {
            return null;
        }
        version = version.trim();
        if (version === '*') {
            return {
                hasCaret: false,
                hasGreaterEquals: false,
                majorBase: 0,
                majorMustEqual: false,
                minorBase: 0,
                minorMustEqual: false,
                patchBase: 0,
                patchMustEqual: false,
                preRelease: null
            };
        }
        const m = version.match(VERSION_REGEXP);
        if (!m) {
            return null;
        }
        return {
            hasCaret: m[1] === '^',
            hasGreaterEquals: m[1] === '>=',
            majorBase: m[2] === 'x' ? 0 : parseInt(m[2], 10),
            majorMustEqual: (m[2] === 'x' ? false : true),
            minorBase: m[4] === 'x' ? 0 : parseInt(m[4], 10),
            minorMustEqual: (m[4] === 'x' ? false : true),
            patchBase: m[6] === 'x' ? 0 : parseInt(m[6], 10),
            patchMustEqual: (m[6] === 'x' ? false : true),
            preRelease: m[8] || null
        };
    }
    function normalizeVersion(version) {
        if (!version) {
            return null;
        }
        const majorBase = version.majorBase;
        const majorMustEqual = version.majorMustEqual;
        const minorBase = version.minorBase;
        let minorMustEqual = version.minorMustEqual;
        const patchBase = version.patchBase;
        let patchMustEqual = version.patchMustEqual;
        if (version.hasCaret) {
            if (majorBase === 0) {
                patchMustEqual = false;
            }
            else {
                minorMustEqual = false;
                patchMustEqual = false;
            }
        }
        let notBefore = 0;
        if (version.preRelease) {
            const match = NOT_BEFORE_REGEXP.exec(version.preRelease);
            if (match) {
                const [, year, month, day] = match;
                notBefore = Date.UTC(Number(year), Number(month) - 1, Number(day));
            }
        }
        return {
            majorBase: majorBase,
            majorMustEqual: majorMustEqual,
            minorBase: minorBase,
            minorMustEqual: minorMustEqual,
            patchBase: patchBase,
            patchMustEqual: patchMustEqual,
            isMinimum: version.hasGreaterEquals,
            notBefore,
        };
    }
    function isValidVersion(_inputVersion, _inputDate, _desiredVersion) {
        let version;
        if (typeof _inputVersion === 'string') {
            version = normalizeVersion(parseVersion(_inputVersion));
        }
        else {
            version = _inputVersion;
        }
        let productTs;
        if (_inputDate instanceof Date) {
            productTs = _inputDate.getTime();
        }
        else if (typeof _inputDate === 'string') {
            productTs = new Date(_inputDate).getTime();
        }
        let desiredVersion;
        if (typeof _desiredVersion === 'string') {
            desiredVersion = normalizeVersion(parseVersion(_desiredVersion));
        }
        else {
            desiredVersion = _desiredVersion;
        }
        if (!version || !desiredVersion) {
            return false;
        }
        const majorBase = version.majorBase;
        const minorBase = version.minorBase;
        const patchBase = version.patchBase;
        let desiredMajorBase = desiredVersion.majorBase;
        let desiredMinorBase = desiredVersion.minorBase;
        let desiredPatchBase = desiredVersion.patchBase;
        const desiredNotBefore = desiredVersion.notBefore;
        let majorMustEqual = desiredVersion.majorMustEqual;
        let minorMustEqual = desiredVersion.minorMustEqual;
        let patchMustEqual = desiredVersion.patchMustEqual;
        if (desiredVersion.isMinimum) {
            if (majorBase > desiredMajorBase) {
                return true;
            }
            if (majorBase < desiredMajorBase) {
                return false;
            }
            if (minorBase > desiredMinorBase) {
                return true;
            }
            if (minorBase < desiredMinorBase) {
                return false;
            }
            if (productTs && productTs < desiredNotBefore) {
                return false;
            }
            return patchBase >= desiredPatchBase;
        }
        // Anything < 1.0.0 is compatible with >= 1.0.0, except exact matches
        if (majorBase === 1 && desiredMajorBase === 0 && (!majorMustEqual || !minorMustEqual || !patchMustEqual)) {
            desiredMajorBase = 1;
            desiredMinorBase = 0;
            desiredPatchBase = 0;
            majorMustEqual = true;
            minorMustEqual = false;
            patchMustEqual = false;
        }
        if (majorBase < desiredMajorBase) {
            // smaller major version
            return false;
        }
        if (majorBase > desiredMajorBase) {
            // higher major version
            return (!majorMustEqual);
        }
        // at this point, majorBase are equal
        if (minorBase < desiredMinorBase) {
            // smaller minor version
            return false;
        }
        if (minorBase > desiredMinorBase) {
            // higher minor version
            return (!minorMustEqual);
        }
        // at this point, minorBase are equal
        if (patchBase < desiredPatchBase) {
            // smaller patch version
            return false;
        }
        if (patchBase > desiredPatchBase) {
            // higher patch version
            return (!patchMustEqual);
        }
        // at this point, patchBase are equal
        if (productTs && productTs < desiredNotBefore) {
            return false;
        }
        return true;
    }
    function validateExtensionManifest(productVersion, productDate, extensionLocation, extensionManifest, extensionIsBuiltin) {
        const validations = [];
        if (typeof extensionManifest.publisher !== 'undefined' && typeof extensionManifest.publisher !== 'string') {
            validations.push([severity_1.default.Error, nls.localize('extensionDescription.publisher', "property publisher must be of type `string`.")]);
            return validations;
        }
        if (typeof extensionManifest.name !== 'string') {
            validations.push([severity_1.default.Error, nls.localize('extensionDescription.name', "property `{0}` is mandatory and must be of type `string`", 'name')]);
            return validations;
        }
        if (typeof extensionManifest.version !== 'string') {
            validations.push([severity_1.default.Error, nls.localize('extensionDescription.version', "property `{0}` is mandatory and must be of type `string`", 'version')]);
            return validations;
        }
        if (!extensionManifest.engines) {
            validations.push([severity_1.default.Error, nls.localize('extensionDescription.engines', "property `{0}` is mandatory and must be of type `object`", 'engines')]);
            return validations;
        }
        if (typeof extensionManifest.engines.vscode !== 'string') {
            validations.push([severity_1.default.Error, nls.localize('extensionDescription.engines.vscode', "property `{0}` is mandatory and must be of type `string`", 'engines.vscode')]);
            return validations;
        }
        if (typeof extensionManifest.extensionDependencies !== 'undefined') {
            if (!isStringArray(extensionManifest.extensionDependencies)) {
                validations.push([severity_1.default.Error, nls.localize('extensionDescription.extensionDependencies', "property `{0}` can be omitted or must be of type `string[]`", 'extensionDependencies')]);
                return validations;
            }
        }
        if (typeof extensionManifest.activationEvents !== 'undefined') {
            if (!isStringArray(extensionManifest.activationEvents)) {
                validations.push([severity_1.default.Error, nls.localize('extensionDescription.activationEvents1', "property `{0}` can be omitted or must be of type `string[]`", 'activationEvents')]);
                return validations;
            }
            if (typeof extensionManifest.main === 'undefined' && typeof extensionManifest.browser === 'undefined') {
                validations.push([severity_1.default.Error, nls.localize('extensionDescription.activationEvents2', "property `{0}` should be omitted if the extension doesn't have a `{1}` or `{2}` property.", 'activationEvents', 'main', 'browser')]);
                return validations;
            }
        }
        if (typeof extensionManifest.extensionKind !== 'undefined') {
            if (typeof extensionManifest.main === 'undefined') {
                validations.push([severity_1.default.Warning, nls.localize('extensionDescription.extensionKind', "property `{0}` can be defined only if property `main` is also defined.", 'extensionKind')]);
                // not a failure case
            }
        }
        if (typeof extensionManifest.main !== 'undefined') {
            if (typeof extensionManifest.main !== 'string') {
                validations.push([severity_1.default.Error, nls.localize('extensionDescription.main1', "property `{0}` can be omitted or must be of type `string`", 'main')]);
                return validations;
            }
            else {
                const mainLocation = (0, resources_1.joinPath)(extensionLocation, extensionManifest.main);
                if (!(0, resources_1.isEqualOrParent)(mainLocation, extensionLocation)) {
                    validations.push([severity_1.default.Warning, nls.localize('extensionDescription.main2', "Expected `main` ({0}) to be included inside extension's folder ({1}). This might make the extension non-portable.", mainLocation.path, extensionLocation.path)]);
                    // not a failure case
                }
            }
        }
        if (typeof extensionManifest.browser !== 'undefined') {
            if (typeof extensionManifest.browser !== 'string') {
                validations.push([severity_1.default.Error, nls.localize('extensionDescription.browser1', "property `{0}` can be omitted or must be of type `string`", 'browser')]);
                return validations;
            }
            else {
                const browserLocation = (0, resources_1.joinPath)(extensionLocation, extensionManifest.browser);
                if (!(0, resources_1.isEqualOrParent)(browserLocation, extensionLocation)) {
                    validations.push([severity_1.default.Warning, nls.localize('extensionDescription.browser2', "Expected `browser` ({0}) to be included inside extension's folder ({1}). This might make the extension non-portable.", browserLocation.path, extensionLocation.path)]);
                    // not a failure case
                }
            }
        }
        if (!semver.valid(extensionManifest.version)) {
            validations.push([severity_1.default.Error, nls.localize('notSemver', "Extension version is not semver compatible.")]);
            return validations;
        }
        const notices = [];
        const isValid = isValidExtensionVersion(productVersion, productDate, extensionManifest, extensionIsBuiltin, notices);
        if (!isValid) {
            for (const notice of notices) {
                validations.push([severity_1.default.Error, notice]);
            }
        }
        return validations;
    }
    function isValidExtensionVersion(productVersion, productDate, extensionManifest, extensionIsBuiltin, notices) {
        if (extensionIsBuiltin || (typeof extensionManifest.main === 'undefined' && typeof extensionManifest.browser === 'undefined')) {
            // No version check for builtin or declarative extensions
            return true;
        }
        return isVersionValid(productVersion, productDate, extensionManifest.engines.vscode, notices);
    }
    function isEngineValid(engine, version, date) {
        // TODO@joao: discuss with alex '*' doesn't seem to be a valid engine version
        return engine === '*' || isVersionValid(version, date, engine);
    }
    function isVersionValid(currentVersion, date, requestedVersion, notices = []) {
        const desiredVersion = normalizeVersion(parseVersion(requestedVersion));
        if (!desiredVersion) {
            notices.push(nls.localize('versionSyntax', "Could not parse `engines.vscode` value {0}. Please use, for example: ^1.22.0, ^1.22.x, etc.", requestedVersion));
            return false;
        }
        // enforce that a breaking API version is specified.
        // for 0.X.Y, that means up to 0.X must be specified
        // otherwise for Z.X.Y, that means Z must be specified
        if (desiredVersion.majorBase === 0) {
            // force that major and minor must be specific
            if (!desiredVersion.majorMustEqual || !desiredVersion.minorMustEqual) {
                notices.push(nls.localize('versionSpecificity1', "Version specified in `engines.vscode` ({0}) is not specific enough. For vscode versions before 1.0.0, please define at a minimum the major and minor desired version. E.g. ^0.10.0, 0.10.x, 0.11.0, etc.", requestedVersion));
                return false;
            }
        }
        else {
            // force that major must be specific
            if (!desiredVersion.majorMustEqual) {
                notices.push(nls.localize('versionSpecificity2', "Version specified in `engines.vscode` ({0}) is not specific enough. For vscode versions after 1.0.0, please define at a minimum the major desired version. E.g. ^1.10.0, 1.10.x, 1.x.x, 2.x.x, etc.", requestedVersion));
                return false;
            }
        }
        if (!isValidVersion(currentVersion, date, desiredVersion)) {
            notices.push(nls.localize('versionMismatch', "Extension is not compatible with Code {0}. Extension requires: {1}.", currentVersion, requestedVersion));
            return false;
        }
        return true;
    }
    function isStringArray(arr) {
        if (!Array.isArray(arr)) {
            return false;
        }
        for (let i = 0, len = arr.length; i < len; i++) {
            if (typeof arr[i] !== 'string') {
                return false;
            }
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uVmFsaWRhdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25zL2NvbW1vbi9leHRlbnNpb25WYWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQ2hHLDhDQUdDO0lBRUQsb0NBb0NDO0lBRUQsNENBd0NDO0lBRUQsd0NBa0hDO0lBSUQsOERBa0ZDO0lBRUQsMERBUUM7SUFFRCxzQ0FHQztJQS9TRCxNQUFNLGNBQWMsR0FBRyxrREFBa0QsQ0FBQztJQUMxRSxNQUFNLGlCQUFpQixHQUFHLDBCQUEwQixDQUFDO0lBRXJELFNBQWdCLGlCQUFpQixDQUFDLE9BQWU7UUFDaEQsT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN6QixPQUFPLENBQUMsT0FBTyxLQUFLLEdBQUcsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVELFNBQWdCLFlBQVksQ0FBQyxPQUFlO1FBQzNDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ2pDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFekIsSUFBSSxPQUFPLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDckIsT0FBTztnQkFDTixRQUFRLEVBQUUsS0FBSztnQkFDZixnQkFBZ0IsRUFBRSxLQUFLO2dCQUN2QixTQUFTLEVBQUUsQ0FBQztnQkFDWixjQUFjLEVBQUUsS0FBSztnQkFDckIsU0FBUyxFQUFFLENBQUM7Z0JBQ1osY0FBYyxFQUFFLEtBQUs7Z0JBQ3JCLFNBQVMsRUFBRSxDQUFDO2dCQUNaLGNBQWMsRUFBRSxLQUFLO2dCQUNy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