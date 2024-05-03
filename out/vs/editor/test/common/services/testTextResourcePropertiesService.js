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
define(["require", "exports", "vs/base/common/platform", "vs/platform/configuration/common/configuration"], function (require, exports, platform, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestTextResourcePropertiesService = void 0;
    let TestTextResourcePropertiesService = class TestTextResourcePropertiesService {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getEOL(resource, language) {
            const eol = this.configurationService.getValue('files.eol', { overrideIdentifier: language, resource });
            if (eol && typeof eol === 'string' && eol !== 'auto') {
                return eol;
            }
            return (platform.isLinux || platform.isMacintosh) ? '\n' : '\r\n';
        }
    };
    exports.TestTextResourcePropertiesService = TestTextResourcePropertiesService;
    exports.TestTextResourcePropertiesService = TestTextResourcePropertiesService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], TestTextResourcePropertiesService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFRleHRSZXNvdXJjZVByb3BlcnRpZXNTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vc2VydmljZXMvdGVzdFRleHRSZXNvdXJjZVByb3BlcnRpZXNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQU96RixJQUFNLGlDQUFpQyxHQUF2QyxNQUFNLGlDQUFpQztRQUk3QyxZQUN5QyxvQkFBMkM7WUFBM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtRQUVwRixDQUFDO1FBRUQsTUFBTSxDQUFDLFFBQWEsRUFBRSxRQUFpQjtZQUN0QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3hHLElBQUksR0FBRyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQ3RELE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztZQUNELE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDbkUsQ0FBQztLQUNELENBQUE7SUFoQlksOEVBQWlDO2dEQUFqQyxpQ0FBaUM7UUFLM0MsV0FBQSxxQ0FBcUIsQ0FBQTtPQUxYLGlDQUFpQyxDQWdCN0MifQ==