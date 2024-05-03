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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/strings", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, lifecycle_1, objects_1, platform_1, strings_1, nls_1, configuration_1, configurationRegistry_1, product_1, productService_1, platform_2, telemetry_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryService = void 0;
    let TelemetryService = class TelemetryService {
        static { this.IDLE_START_EVENT_NAME = 'UserIdleStart'; }
        static { this.IDLE_STOP_EVENT_NAME = 'UserIdleStop'; }
        constructor(config, _configurationService, _productService) {
            this._configurationService = _configurationService;
            this._productService = _productService;
            this._experimentProperties = {};
            this._disposables = new lifecycle_1.DisposableStore();
            this._cleanupPatterns = [];
            this._appenders = config.appenders;
            this._commonProperties = config.commonProperties ?? Object.create(null);
            this.sessionId = this._commonProperties['sessionID'];
            this.machineId = this._commonProperties['common.machineId'];
            this.sqmId = this._commonProperties['common.sqmId'];
            this.firstSessionDate = this._commonProperties['common.firstSessionDate'];
            this.msftInternal = this._commonProperties['common.msftInternal'];
            this._piiPaths = config.piiPaths || [];
            this._telemetryLevel = 3 /* TelemetryLevel.USAGE */;
            this._sendErrorTelemetry = !!config.sendErrorTelemetry;
            // static cleanup pattern for: `vscode-file:///DANGEROUS/PATH/resources/app/Useful/Information`
            this._cleanupPatterns = [/(vscode-)?file:\/\/\/.*?\/resources\/app\//gi];
            for (const piiPath of this._piiPaths) {
                this._cleanupPatterns.push(new RegExp((0, strings_1.escapeRegExpCharacters)(piiPath), 'gi'));
                if (piiPath.indexOf('\\') >= 0) {
                    this._cleanupPatterns.push(new RegExp((0, strings_1.escapeRegExpCharacters)(piiPath.replace(/\\/g, '/')), 'gi'));
                }
            }
            this._updateTelemetryLevel();
            this._disposables.add(this._configurationService.onDidChangeConfiguration(e => {
                // Check on the telemetry settings and update the state if changed
                const affectsTelemetryConfig = e.affectsConfiguration(telemetry_1.TELEMETRY_SETTING_ID)
                    || e.affectsConfiguration(telemetry_1.TELEMETRY_OLD_SETTING_ID)
                    || e.affectsConfiguration(telemetry_1.TELEMETRY_CRASH_REPORTER_SETTING_ID);
                if (affectsTelemetryConfig) {
                    this._updateTelemetryLevel();
                }
            }));
        }
        setExperimentProperty(name, value) {
            this._experimentProperties[name] = value;
        }
        _updateTelemetryLevel() {
            let level = (0, telemetryUtils_1.getTelemetryLevel)(this._configurationService);
            const collectableTelemetry = this._productService.enabledTelemetryLevels;
            // Also ensure that error telemetry is respecting the product configuration for collectable telemetry
            if (collectableTelemetry) {
                this._sendErrorTelemetry = this.sendErrorTelemetry ? collectableTelemetry.error : false;
                // Make sure the telemetry level from the service is the minimum of the config and product
                const maxCollectableTelemetryLevel = collectableTelemetry.usage ? 3 /* TelemetryLevel.USAGE */ : collectableTelemetry.error ? 2 /* TelemetryLevel.ERROR */ : 0 /* TelemetryLevel.NONE */;
                level = Math.min(level, maxCollectableTelemetryLevel);
            }
            this._telemetryLevel = level;
        }
        get sendErrorTelemetry() {
            return this._sendErrorTelemetry;
        }
        get telemetryLevel() {
            return this._telemetryLevel;
        }
        dispose() {
            this._disposables.dispose();
        }
        _log(eventName, eventLevel, data) {
            // don't send events when the user is optout
            if (this._telemetryLevel < eventLevel) {
                return;
            }
            // add experiment properties
            data = (0, objects_1.mixin)(data, this._experimentProperties);
            // remove all PII from data
            data = (0, telemetryUtils_1.cleanData)(data, this._cleanupPatterns);
            // add common properties
            data = (0, objects_1.mixin)(data, this._commonProperties);
            // Log to the appenders of sufficient level
            this._appenders.forEach(a => a.log(eventName, data));
        }
        publicLog(eventName, data) {
            this._log(eventName, 3 /* TelemetryLevel.USAGE */, data);
        }
        publicLog2(eventName, data) {
            this.publicLog(eventName, data);
        }
        publicLogError(errorEventName, data) {
            if (!this._sendErrorTelemetry) {
                return;
            }
            // Send error event and anonymize paths
            this._log(errorEventName, 2 /* TelemetryLevel.ERROR */, data);
        }
        publicLogError2(eventName, data) {
            this.publicLogError(eventName, data);
        }
    };
    exports.TelemetryService = TelemetryService;
    exports.TelemetryService = TelemetryService = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, productService_1.IProductService)
    ], TelemetryService);
    function getTelemetryLevelSettingDescription() {
        const telemetryText = (0, nls_1.localize)('telemetry.telemetryLevelMd', "Controls {0} telemetry, first-party extension telemetry, and participating third-party extension telemetry. Some third party extensions might not respect this setting. Consult the specific extension's documentation to be sure. Telemetry helps us better understand how {0} is performing, where improvements need to be made, and how features are being used.", product_1.default.nameLong);
        const externalLinksStatement = !product_1.default.privacyStatementUrl ?
            (0, nls_1.localize)("telemetry.docsStatement", "Read more about the [data we collect]({0}).", 'https://aka.ms/vscode-telemetry') :
            (0, nls_1.localize)("telemetry.docsAndPrivacyStatement", "Read more about the [data we collect]({0}) and our [privacy statement]({1}).", 'https://aka.ms/vscode-telemetry', product_1.default.privacyStatementUrl);
        const restartString = !platform_1.isWeb ? (0, nls_1.localize)('telemetry.restart', 'A full restart of the application is necessary for crash reporting changes to take effect.') : '';
        const crashReportsHeader = (0, nls_1.localize)('telemetry.crashReports', "Crash Reports");
        const errorsHeader = (0, nls_1.localize)('telemetry.errors', "Error Telemetry");
        const usageHeader = (0, nls_1.localize)('telemetry.usage', "Usage Data");
        const telemetryTableDescription = (0, nls_1.localize)('telemetry.telemetryLevel.tableDescription', "The following table outlines the data sent with each setting:");
        const telemetryTable = `
|       | ${crashReportsHeader} | ${errorsHeader} | ${usageHeader} |
|:------|:---------------------:|:---------------:|:--------------:|
| all   |            ✓          |        ✓        |        ✓       |
| error |            ✓          |        ✓        |        -       |
| crash |            ✓          |        -        |        -       |
| off   |            -          |        -        |        -       |
`;
        const deprecatedSettingNote = (0, nls_1.localize)('telemetry.telemetryLevel.deprecated', "****Note:*** If this setting is 'off', no telemetry will be sent regardless of other telemetry settings. If this setting is set to anything except 'off' and telemetry is disabled with deprecated settings, no telemetry will be sent.*");
        const telemetryDescription = `
${telemetryText} ${externalLinksStatement} ${restartString}

&nbsp;

${telemetryTableDescription}
${telemetryTable}

&nbsp;

${deprecatedSettingNote}
`;
        return telemetryDescription;
    }
    platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': telemetry_1.TELEMETRY_SECTION_ID,
        'order': 1,
        'type': 'object',
        'title': (0, nls_1.localize)('telemetryConfigurationTitle', "Telemetry"),
        'properties': {
            [telemetry_1.TELEMETRY_SETTING_ID]: {
                'type': 'string',
                'enum': ["all" /* TelemetryConfiguration.ON */, "error" /* TelemetryConfiguration.ERROR */, "crash" /* TelemetryConfiguration.CRASH */, "off" /* TelemetryConfiguration.OFF */],
                'enumDescriptions': [
                    (0, nls_1.localize)('telemetry.telemetryLevel.default', "Sends usage data, errors, and crash reports."),
                    (0, nls_1.localize)('telemetry.telemetryLevel.error', "Sends general error telemetry and crash reports."),
                    (0, nls_1.localize)('telemetry.telemetryLevel.crash', "Sends OS level crash reports."),
                    (0, nls_1.localize)('telemetry.telemetryLevel.off', "Disables all product telemetry.")
                ],
                'markdownDescription': getTelemetryLevelSettingDescription(),
                'default': "all" /* TelemetryConfiguration.ON */,
                'restricted': true,
                'scope': 1 /* ConfigurationScope.APPLICATION */,
                'tags': ['usesOnlineServices', 'telemetry']
            }
        }
    });
    // Deprecated telemetry setting
    platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': telemetry_1.TELEMETRY_SECTION_ID,
        'order': 110,
        'type': 'object',
        'title': (0, nls_1.localize)('telemetryConfigurationTitle', "Telemetry"),
        'properties': {
            [telemetry_1.TELEMETRY_OLD_SETTING_ID]: {
                'type': 'boolean',
                'markdownDescription': !product_1.default.privacyStatementUrl ?
                    (0, nls_1.localize)('telemetry.enableTelemetry', "Enable diagnostic data to be collected. This helps us to better understand how {0} is performing and where improvements need to be made.", product_1.default.nameLong) :
                    (0, nls_1.localize)('telemetry.enableTelemetryMd', "Enable diagnostic data to be collected. This helps us to better understand how {0} is performing and where improvements need to be made. [Read more]({1}) about what we collect and our privacy statement.", product_1.default.nameLong, product_1.default.privacyStatementUrl),
                'default': true,
                'restricted': true,
                'markdownDeprecationMessage': (0, nls_1.localize)('enableTelemetryDeprecated', "If this setting is false, no telemetry will be sent regardless of the new setting's value. Deprecated in favor of the {0} setting.", `\`#${telemetry_1.TELEMETRY_SETTING_ID}#\``),
                'scope': 1 /* ConfigurationScope.APPLICATION */,
                'tags': ['usesOnlineServices', 'telemetry']
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVsZW1ldHJ5L2NvbW1vbi90ZWxlbWV0cnlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVCekYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7aUJBRVosMEJBQXFCLEdBQUcsZUFBZSxBQUFsQixDQUFtQjtpQkFDeEMseUJBQW9CLEdBQUcsY0FBYyxBQUFqQixDQUFrQjtRQW9CdEQsWUFDQyxNQUErQixFQUNSLHFCQUFvRCxFQUMxRCxlQUF3QztZQUQxQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2xELG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQVhsRCwwQkFBcUIsR0FBK0IsRUFBRSxDQUFDO1lBSzlDLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDOUMscUJBQWdCLEdBQWEsRUFBRSxDQUFDO1lBT3ZDLElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztZQUNuQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFeEUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFXLENBQUM7WUFDL0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLENBQVcsQ0FBQztZQUN0RSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQVcsQ0FBQztZQUM5RCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixD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