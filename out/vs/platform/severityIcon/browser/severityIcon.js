/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/severity", "vs/css!./media/severityIcon"], function (require, exports, codicons_1, themables_1, severity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SeverityIcon = void 0;
    var SeverityIcon;
    (function (SeverityIcon) {
        function className(severity) {
            switch (severity) {
                case severity_1.default.Ignore:
                    return 'severity-ignore ' + themables_1.ThemeIcon.asClassName(codicons_1.Codicon.info);
                case severity_1.default.Info:
                    return themables_1.ThemeIcon.asClassName(codicons_1.Codicon.info);
                case severity_1.default.Warning:
                    return themables_1.ThemeIcon.asClassName(codicons_1.Codicon.warning);
                case severity_1.default.Error:
                    return themables_1.ThemeIcon.asClassName(codicons_1.Codicon.error);
                default:
                    return '';
            }
        }
        SeverityIcon.className = className;
    })(SeverityIcon || (exports.SeverityIcon = SeverityIcon = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V2ZXJpdHlJY29uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9zZXZlcml0eUljb24vYnJvd3Nlci9zZXZlcml0eUljb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLElBQWlCLFlBQVksQ0FnQjVCO0lBaEJELFdBQWlCLFlBQVk7UUFFNUIsU0FBZ0IsU0FBUyxDQUFDLFFBQWtCO1lBQzNDLFFBQVEsUUFBUSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssa0JBQVEsQ0FBQyxNQUFNO29CQUNuQixPQUFPLGtCQUFrQixHQUFHLHFCQUFTLENBQUMsV0FBVyxDQUFDLGtCQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pFLEtBQUssa0JBQVEsQ0FBQyxJQUFJO29CQUNqQixPQUFPLHFCQUFTLENBQUMsV0FBVyxDQUFDLGtCQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVDLEtBQUssa0JBQVEsQ0FBQyxPQUFPO29CQUNwQixPQUFPLHFCQUFTLENBQUMsV0FBVyxDQUFDLGtCQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQy9DLEtBQUssa0JBQVEsQ0FBQyxLQUFLO29CQUNsQixPQUFPLHFCQUFTLENBQUMsV0FBVyxDQUFDLGtCQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzdDO29CQUNDLE9BQU8sRUFBRSxDQUFDO1lBQ1osQ0FBQztRQUNGLENBQUM7UUFiZSxzQkFBUyxZQWF4QixDQUFBO0lBQ0YsQ0FBQyxFQWhCZ0IsWUFBWSw0QkFBWixZQUFZLFFBZ0I1QiJ9