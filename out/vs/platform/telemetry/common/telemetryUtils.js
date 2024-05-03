/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/base/common/types", "vs/platform/remote/common/remoteHosts", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry"], function (require, exports, objects_1, types_1, remoteHosts_1, commonProperties_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullAppender = exports.extensionTelemetryLogChannelId = exports.telemetryLogId = exports.NullEndpointTelemetryService = exports.NullTelemetryService = exports.NullTelemetryServiceShape = exports.TelemetryTrustedValue = void 0;
    exports.supportsTelemetry = supportsTelemetry;
    exports.isLoggingOnly = isLoggingOnly;
    exports.getTelemetryLevel = getTelemetryLevel;
    exports.validateTelemetryData = validateTelemetryData;
    exports.cleanRemoteAuthority = cleanRemoteAuthority;
    exports.isInternalTelemetry = isInternalTelemetry;
    exports.getPiiPathsFromEnvironment = getPiiPathsFromEnvironment;
    exports.cleanData = cleanData;
    /**
     * A special class used to denoting a telemetry value which should not be clean.
     * This is because that value is "Trusted" not to contain identifiable information such as paths.
     * NOTE: This is used as an API type as well, and should not be changed.
     */
    class TelemetryTrustedValue {
        constructor(value) {
            this.value = value;
            // This is merely used as an identifier as the instance will be lost during serialization over the exthost
            this.isTrustedTelemetryValue = true;
        }
    }
    exports.TelemetryTrustedValue = TelemetryTrustedValue;
    class NullTelemetryServiceShape {
        constructor() {
            this.telemetryLevel = 0 /* TelemetryLevel.NONE */;
            this.sessionId = 'someValue.sessionId';
            this.machineId = 'someValue.machineId';
            this.sqmId = 'someValue.sqmId';
            this.firstSessionDate = 'someValue.firstSessionDate';
            this.sendErrorTelemetry = false;
        }
        publicLog() { }
        publicLog2() { }
        publicLogError() { }
        publicLogError2() { }
        setExperimentProperty() { }
    }
    exports.NullTelemetryServiceShape = NullTelemetryServiceShape;
    exports.NullTelemetryService = new NullTelemetryServiceShape();
    class NullEndpointTelemetryService {
        async publicLog(_endpoint, _eventName, _data) {
            // noop
        }
        async publicLogError(_endpoint, _errorEventName, _data) {
            // noop
        }
    }
    exports.NullEndpointTelemetryService = NullEndpointTelemetryService;
    exports.telemetryLogId = 'telemetry';
    exports.extensionTelemetryLogChannelId = 'extensionTelemetryLog';
    exports.NullAppender = { log: () => null, flush: () => Promise.resolve(null) };
    /**
     * Determines whether or not we support logging telemetry.
     * This checks if the product is capable of collecting telemetry but not whether or not it can send it
     * For checking the user setting and what telemetry you can send please check `getTelemetryLevel`.
     * This returns true if `--disable-telemetry` wasn't used, the product.json allows for telemetry, and we're not testing an extension
     * If false telemetry is disabled throughout the product
     * @param productService
     * @param environmentService
     * @returns false - telemetry is completely disabled, true - telemetry is logged locally, but may not be sent
     */
    function supportsTelemetry(productService, environmentService) {
        // If it's OSS and telemetry isn't disabled via the CLI we will allow it for logging only purposes
        if (!environmentService.isBuilt && !environmentService.disableTelemetry) {
            return true;
        }
        return !(environmentService.disableTelemetry || !productService.enableTelemetry);
    }
    /**
     * Checks to see if we're in logging only mode to debug telemetry.
     * This is if telemetry is enabled and we're in OSS, but no telemetry key is provided so it's not being sent just logged.
     * @param productService
     * @param environmentService
     * @returns True if telemetry is actually disabled and we're only logging for debug purposes
     */
    function isLoggingOnly(productService, environmentService) {
        // If we're testing an extension, log telemetry for debug purposes
        if (environmentService.extensionTestsLocationURI) {
            return true;
        }
        // Logging only mode is only for OSS
        if (environmentService.isBuilt) {
            return false;
        }
        if (environmentService.disableTelemetry) {
            return false;
        }
        if (productService.enableTelemetry && productService.aiConfig?.ariaKey) {
            return false;
        }
        return true;
    }
    /**
     * Determines how telemetry is handled based on the user's configuration.
     *
     * @param configurationService
     * @returns OFF, ERROR, ON
     */
    function getTelemetryLevel(configurationService) {
        const newConfig = configurationService.getValue(telemetry_1.TELEMETRY_SETTING_ID);
        const crashReporterConfig = configurationService.getValue(telemetry_1.TELEMETRY_CRASH_REPORTER_SETTING_ID);
        const oldConfig = configurationService.getValue(telemetry_1.TELEMETRY_OLD_SETTING_ID);
        // If `telemetry.enableCrashReporter` is false or `telemetry.enableTelemetry' is false, disable telemetry
        if (oldConfig === false || crashReporterConfig === false) {
            return 0 /* TelemetryLevel.NONE */;
        }
        // Maps new telemetry setting to a telemetry level
        switch (newConfig ?? "all" /* TelemetryConfiguration.ON */) {
            case "all" /* TelemetryConfiguration.ON */:
                return 3 /* TelemetryLevel.USAGE */;
            case "error" /* TelemetryConfiguration.ERROR */:
                return 2 /* TelemetryLevel.ERROR */;
            case "crash" /* TelemetryConfiguration.CRASH */:
                return 1 /* TelemetryLevel.CRASH */;
            case "off" /* TelemetryConfiguration.OFF */:
                return 0 /* TelemetryLevel.NONE */;
        }
    }
    function validateTelemetryData(data) {
        const properties = {};
        const measurements = {};
        const flat = {};
        flatten(data, flat);
        for (let prop in flat) {
            // enforce property names less than 150 char, take the last 150 char
            prop = prop.length > 150 ? prop.substr(prop.length - 149) : prop;
            const value = flat[prop];
            if (typeof value === 'number') {
                measurements[prop] = value;
            }
            else if (typeof value === 'boolean') {
                measurements[prop] = value ? 1 : 0;
            }
            else if (typeof value === 'string') {
                if (value.length > 8192) {
                    console.warn(`Telemetry property: ${prop} has been trimmed to 8192, the original length is ${value.length}`);
                }
                //enforce property value to be less than 8192 char, take the first 8192 char
                // https://docs.microsoft.com/en-us/azure/azure-monitor/app/api-custom-events-metrics#limits
                properties[prop] = value.substring(0, 8191);
            }
            else if (typeof value !== 'undefined' && value !== null) {
                properties[prop] = value;
            }
        }
        return {
            properties,
            measurements
        };
    }
    const telemetryAllowedAuthorities = new Set(['ssh-remote', 'dev-container', 'attached-container', 'wsl', 'tunnel', 'codespaces', 'amlext']);
    function cleanRemoteAuthority(remoteAuthority) {
        if (!remoteAuthority) {
            return 'none';
        }
        const remoteName = (0, remoteHosts_1.getRemoteName)(remoteAuthority);
        return telemetryAllowedAuthorities.has(remoteName) ? remoteName : 'other';
    }
    function flatten(obj, result, order = 0, prefix) {
        if (!obj) {
            return;
        }
        for (const item of Object.getOwnPropertyNames(obj)) {
            const value = obj[item];
            const index = prefix ? prefix + item : item;
            if (Array.isArray(value)) {
                result[index] = (0, objects_1.safeStringify)(value);
            }
            else if (value instanceof Date) {
                // TODO unsure why this is here and not in _getData
                result[index] = value.toISOString();
            }
            else if ((0, types_1.isObject)(value)) {
                if (order < 2) {
                    flatten(value, result, order + 1, index + '.');
                }
                else {
                    result[index] = (0, objects_1.safeStringify)(value);
                }
            }
            else {
                result[index] = value;
            }
        }
    }
    /**
     * Whether or not this is an internal user
     * @param productService The product service
     * @param configService The config servivce
     * @returns true if internal, false otherwise
     */
    function isInternalTelemetry(productService, configService) {
        const msftInternalDomains = productService.msftInternalDomains || [];
        const internalTesting = configService.getValue('telemetry.internalTesting');
        return (0, commonProperties_1.verifyMicrosoftInternalDomain)(msftInternalDomains) || internalTesting;
    }
    function getPiiPathsFromEnvironment(paths) {
        return [paths.appRoot, paths.extensionsPath, paths.userHome.fsPath, paths.tmpDir.fsPath, paths.userDataPath];
    }
    //#region Telemetry Cleaning
    /**
     * Cleans a given stack of possible paths
     * @param stack The stack to sanitize
     * @param cleanupPatterns Cleanup patterns to remove from the stack
     * @returns The cleaned stack
     */
    function anonymizeFilePaths(stack, cleanupPatterns) {
        // Fast check to see if it is a file path to avoid doing unnecessary heavy regex work
        if (!stack || (!stack.includes('/') && !stack.includes('\\'))) {
            return stack;
        }
        let updatedStack = stack;
        const cleanUpIndexes = [];
        for (const regexp of cleanupPatterns) {
            while (true) {
                const result = regexp.exec(stack);
                if (!result) {
                    break;
                }
                cleanUpIndexes.push([result.index, regexp.lastIndex]);
            }
        }
        const nodeModulesRegex = /^[\\\/]?(node_modules|node_modules\.asar)[\\\/]/;
        const fileRegex = /(file:\/\/)?([a-zA-Z]:(\\\\|\\|\/)|(\\\\|\\|\/))?([\w-\._]+(\\\\|\\|\/))+[\w-\._]*/g;
        let lastIndex = 0;
        updatedStack = '';
        while (true) {
            const result = fileRegex.exec(stack);
            if (!result) {
                break;
            }
            // Check to see if the any cleanupIndexes partially overlap with this match
            const overlappingRange = cleanUpIndexes.some(([start, end]) => result.index < end && start < fileRegex.lastIndex);
            // anoynimize user file paths that do not need to be retained or cleaned up.
            if (!nodeModulesRegex.test(result[0]) && !overlappingRange) {
                updatedStack += stack.substring(lastIndex, result.index) + '<REDACTED: user-file-path>';
                lastIndex = fileRegex.lastIndex;
            }
        }
        if (lastIndex < stack.length) {
            updatedStack += stack.substr(lastIndex);
        }
        return updatedStack;
    }
    /**
     * Attempts to remove commonly leaked PII
     * @param property The property which will be removed if it contains user data
     * @returns The new value for the property
     */
    function removePropertiesWithPossibleUserInfo(property) {
        // If for some reason it is undefined we skip it (this shouldn't be possible);
        if (!property) {
            return property;
        }
        const userDataRegexes = [
            { label: 'Google API Key', regex: /AIza[A-Za-z0-9_\\\-]{35}/ },
            { label: 'Slack Token', regex: /xox[pbar]\-[A-Za-z0-9]/ },
            { label: 'GitHub Token', regex: /(gh[psuro]_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})/ },
            { label: 'Generic Secret', regex: /(key|token|sig|secret|signature|password|passwd|pwd|android:value)[^a-zA-Z0-9]/i },
            { label: 'Email', regex: /@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+/ } // Regex which matches @*.site
        ];
        // Check for common user data in the telemetry events
        for (const secretRegex of userDataRegexes) {
            if (secretRegex.regex.test(property)) {
                return `<REDACTED: ${secretRegex.label}>`;
            }
        }
        return property;
    }
    /**
     * Does a best possible effort to clean a data object from any possible PII.
     * @param data The data object to clean
     * @param paths Any additional patterns that should be removed from the data set
     * @returns A new object with the PII removed
     */
    function cleanData(data, cleanUpPatterns) {
        return (0, objects_1.cloneAndChange)(data, value => {
            // If it's a trusted value it means it's okay to skip cleaning so we don't clean it
            if (value instanceof TelemetryTrustedValue || Object.hasOwnProperty.call(value, 'isTrustedTelemetryValue')) {
                return value.value;
            }
            // We only know how to clean strings
            if (typeof value === 'string') {
                let updatedProperty = value.replaceAll('%20', ' ');
                // First we anonymize any possible file paths
                updatedProperty = anonymizeFilePaths(updatedProperty, cleanUpPatterns);
                // Then we do a simple regex replace with the defined patterns
                for (const regexp of cleanUpPatterns) {
                    updatedProperty = updatedProperty.replace(regexp, '');
                }
                // Lastly, remove commonly leaked PII
                updatedProperty = removePropertiesWithPossibleUserInfo(updatedProperty);
                return updatedProperty;
            }
            return undefined;
        });
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5VXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9jb21tb24vdGVsZW1ldHJ5VXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0ZoRyw4Q0FNQztJQVNELHNDQW1CQztJQVFELDhDQXFCQztJQVVELHNEQW9DQztJQUlELG9EQU1DO0lBb0NELGtEQUlDO0lBVUQsZ0VBRUM7SUE2RkQsOEJBMkJDO0lBL1dEOzs7O09BSUc7SUFDSCxNQUFhLHFCQUFxQjtRQUdqQyxZQUE0QixLQUFRO1lBQVIsVUFBSyxHQUFMLEtBQUssQ0FBRztZQUZwQywwR0FBMEc7WUFDMUYsNEJBQXVCLEdBQUcsSUFBSSxDQUFDO1FBQ1AsQ0FBQztLQUN6QztJQUpELHNEQUlDO0lBRUQsTUFBYSx5QkFBeUI7UUFBdEM7WUFFVSxtQkFBYywrQkFBdUI7WUFDckMsY0FBUyxHQUFHLHFCQUFxQixDQUFDO1lBQ2xDLGNBQVMsR0FBRyxxQkFBcUIsQ0FBQztZQUNsQyxVQUFLLEdBQUcsaUJBQWlCLENBQUM7WUFDMUIscUJBQWdCLEdBQUcsNEJBQTRCLENBQUM7WUFDaEQsdUJBQWtCLEdBQUcsS0FBSyxDQUFDO1FBTXJDLENBQUM7UUFMQSxTQUFTLEtBQUssQ0FBQztRQUNmLFVBQVUsS0FBSyxDQUFDO1FBQ2hCLGNBQWMsS0FBSyxDQUFDO1FBQ3BCLGVBQWUsS0FBSyxDQUFDO1FBQ3JCLHFCQUFxQixLQUFLLENBQUM7S0FDM0I7SUFiRCw4REFhQztJQUVZLFFBQUEsb0JBQW9CLEdBQUcsSUFBSSx5QkFBeUIsRUFBRSxDQUFDO0lBRXBFLE1BQWEsNEJBQTRCO1FBR3hDLEtBQUssQ0FBQyxTQUFTLENBQUMsU0FBNkIsRUFBRSxVQUFrQixFQUFFLEtBQXNCO1lBQ3hGLE9BQU87UUFDUixD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