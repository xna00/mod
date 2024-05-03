/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/process"], function (require, exports, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getDesktopEnvironment = getDesktopEnvironment;
    // Define the enumeration for Desktop Environments
    var DesktopEnvironment;
    (function (DesktopEnvironment) {
        DesktopEnvironment["UNKNOWN"] = "UNKNOWN";
        DesktopEnvironment["CINNAMON"] = "CINNAMON";
        DesktopEnvironment["DEEPIN"] = "DEEPIN";
        DesktopEnvironment["GNOME"] = "GNOME";
        DesktopEnvironment["KDE3"] = "KDE3";
        DesktopEnvironment["KDE4"] = "KDE4";
        DesktopEnvironment["KDE5"] = "KDE5";
        DesktopEnvironment["KDE6"] = "KDE6";
        DesktopEnvironment["PANTHEON"] = "PANTHEON";
        DesktopEnvironment["UNITY"] = "UNITY";
        DesktopEnvironment["XFCE"] = "XFCE";
        DesktopEnvironment["UKUI"] = "UKUI";
        DesktopEnvironment["LXQT"] = "LXQT";
    })(DesktopEnvironment || (DesktopEnvironment = {}));
    const kXdgCurrentDesktopEnvVar = 'XDG_CURRENT_DESKTOP';
    const kKDESessionEnvVar = 'KDE_SESSION_VERSION';
    function getDesktopEnvironment() {
        const xdgCurrentDesktop = process_1.env[kXdgCurrentDesktopEnvVar];
        if (xdgCurrentDesktop) {
            const values = xdgCurrentDesktop.split(':').map(value => value.trim()).filter(value => value.length > 0);
            for (const value of values) {
                switch (value) {
                    case 'Unity': {
                        const desktopSessionUnity = process_1.env['DESKTOP_SESSION'];
                        if (desktopSessionUnity && desktopSessionUnity.includes('gnome-fallback')) {
                            return DesktopEnvironment.GNOME;
                        }
                        return DesktopEnvironment.UNITY;
                    }
                    case 'Deepin':
                        return DesktopEnvironment.DEEPIN;
                    case 'GNOME':
                        return DesktopEnvironment.GNOME;
                    case 'X-Cinnamon':
                        return DesktopEnvironment.CINNAMON;
                    case 'KDE': {
                        const kdeSession = process_1.env[kKDESessionEnvVar];
                        if (kdeSession === '5') {
                            return DesktopEnvironment.KDE5;
                        }
                        if (kdeSession === '6') {
                            return DesktopEnvironment.KDE6;
                        }
                        return DesktopEnvironment.KDE4;
                    }
                    case 'Pantheon':
                        return DesktopEnvironment.PANTHEON;
                    case 'XFCE':
                        return DesktopEnvironment.XFCE;
                    case 'UKUI':
                        return DesktopEnvironment.UKUI;
                    case 'LXQt':
                        return DesktopEnvironment.LXQT;
                }
            }
        }
        const desktopSession = process_1.env['DESKTOP_SESSION'];
        if (desktopSession) {
            switch (desktopSession) {
                case 'deepin':
                    return DesktopEnvironment.DEEPIN;
                case 'gnome':
                case 'mate':
                    return DesktopEnvironment.GNOME;
                case 'kde4':
                case 'kde-plasma':
                    return DesktopEnvironment.KDE4;
                case 'kde':
                    if (kKDESessionEnvVar in process_1.env) {
                        return DesktopEnvironment.KDE4;
                    }
                    return DesktopEnvironment.KDE3;
                case 'xfce':
                case 'xubuntu':
                    return DesktopEnvironment.XFCE;
                case 'ukui':
                    return DesktopEnvironment.UKUI;
            }
        }
        if ('GNOME_DESKTOP_SESSION_ID' in process_1.env) {
            return DesktopEnvironment.GNOME;
        }
        if ('KDE_FULL_SESSION' in process_1.env) {
            if (kKDESessionEnvVar in process_1.env) {
                return DesktopEnvironment.KDE4;
            }
            return DesktopEnvironment.KDE3;
        }
        return DesktopEnvironment.UNKNOWN;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVza3RvcEVudmlyb25tZW50SW5mby5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vZGVza3RvcEVudmlyb25tZW50SW5mby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXdCaEcsc0RBeUVDO0lBN0ZELGtEQUFrRDtJQUNsRCxJQUFLLGtCQWNKO0lBZEQsV0FBSyxrQkFBa0I7UUFDdEIseUNBQW1CLENBQUE7UUFDbkIsMkNBQXFCLENBQUE7UUFDckIsdUNBQWlCLENBQUE7UUFDakIscUNBQWUsQ0FBQTtRQUNmLG1DQUFhLENBQUE7UUFDYixtQ0FBYSxDQUFBO1FBQ2IsbUNBQWEsQ0FBQTtRQUNiLG1DQUFhLENBQUE7UUFDYiwyQ0FBcUIsQ0FBQTtRQUNyQixxQ0FBZSxDQUFBO1FBQ2YsbUNBQWEsQ0FBQTtRQUNiLG1DQUFhLENBQUE7UUFDYixtQ0FBYSxDQUFBO0lBQ2QsQ0FBQyxFQWRJLGtCQUFrQixLQUFsQixrQkFBa0IsUUFjdEI7SUFFRCxNQUFNLHdCQUF3QixHQUFHLHFCQUFxQixDQUFDO0lBQ3ZELE1BQU0saUJBQWlCLEdBQUcscUJBQXFCLENBQUM7SUFFaEQsU0FBZ0IscUJBQXFCO1FBQ3BDLE1BQU0saUJBQWlCLEdBQUcsYUFBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDeEQsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3pHLEtBQUssTUFBTSxL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