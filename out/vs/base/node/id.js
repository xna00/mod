/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/ternarySearchTree", "vs/base/common/uuid", "vs/base/node/macAddress", "vs/base/common/platform"], function (require, exports, os_1, ternarySearchTree_1, uuid, macAddress_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.virtualMachineHint = void 0;
    exports.getMachineId = getMachineId;
    exports.getSqmMachineId = getSqmMachineId;
    // http://www.techrepublic.com/blog/data-center/mac-address-scorecard-for-common-virtual-machine-platforms/
    // VMware ESX 3, Server, Workstation, Player	00-50-56, 00-0C-29, 00-05-69
    // Microsoft Hyper-V, Virtual Server, Virtual PC	00-03-FF
    // Parallels Desktop, Workstation, Server, Virtuozzo	00-1C-42
    // Virtual Iron 4	00-0F-4B
    // Red Hat Xen	00-16-3E
    // Oracle VM	00-16-3E
    // XenSource	00-16-3E
    // Novell Xen	00-16-3E
    // Sun xVM VirtualBox	08-00-27
    exports.virtualMachineHint = new class {
        _isVirtualMachineMacAddress(mac) {
            if (!this._virtualMachineOUIs) {
                this._virtualMachineOUIs = ternarySearchTree_1.TernarySearchTree.forStrings();
                // dash-separated
                this._virtualMachineOUIs.set('00-50-56', true);
                this._virtualMachineOUIs.set('00-0C-29', true);
                this._virtualMachineOUIs.set('00-05-69', true);
                this._virtualMachineOUIs.set('00-03-FF', true);
                this._virtualMachineOUIs.set('00-1C-42', true);
                this._virtualMachineOUIs.set('00-16-3E', true);
                this._virtualMachineOUIs.set('08-00-27', true);
                // colon-separated
                this._virtualMachineOUIs.set('00:50:56', true);
                this._virtualMachineOUIs.set('00:0C:29', true);
                this._virtualMachineOUIs.set('00:05:69', true);
                this._virtualMachineOUIs.set('00:03:FF', true);
                this._virtualMachineOUIs.set('00:1C:42', true);
                this._virtualMachineOUIs.set('00:16:3E', true);
                this._virtualMachineOUIs.set('08:00:27', true);
            }
            return !!this._virtualMachineOUIs.findSubstr(mac);
        }
        value() {
            if (this._value === undefined) {
                let vmOui = 0;
                let interfaceCount = 0;
                const interfaces = (0, os_1.networkInterfaces)();
                for (const name in interfaces) {
                    const networkInterface = interfaces[name];
                    if (networkInterface) {
                        for (const { mac, internal } of networkInterface) {
                            if (!internal) {
                                interfaceCount += 1;
                                if (this._isVirtualMachineMacAddress(mac.toUpperCase())) {
                                    vmOui += 1;
                                }
                            }
                        }
                    }
                }
                this._value = interfaceCount > 0
                    ? vmOui / interfaceCount
                    : 0;
            }
            return this._value;
        }
    };
    let machineId;
    async function getMachineId(errorLogger) {
        if (!machineId) {
            machineId = (async () => {
                const id = await getMacMachineId(errorLogger);
                return id || uuid.generateUuid(); // fallback, generate a UUID
            })();
        }
        return machineId;
    }
    async function getMacMachineId(errorLogger) {
        try {
            const crypto = await new Promise((resolve_1, reject_1) => { require(['crypto'], resolve_1, reject_1); });
            const macAddress = (0, macAddress_1.getMac)();
            return crypto.createHash('sha256').update(macAddress, 'utf8').digest('hex');
        }
        catch (err) {
            errorLogger(err);
            return undefined;
        }
    }
    const SQM_KEY = 'Software\\Microsoft\\SQMClient';
    async function getSqmMachineId(errorLogger) {
        if (platform_1.isWindows) {
            const Registry = await new Promise((resolve_2, reject_2) => { require(['@vscode/windows-registry'], resolve_2, reject_2); });
            try {
                return Registry.GetStringRegKey('HKEY_LOCAL_MACHINE', SQM_KEY, 'MachineId') || '';
            }
            catch (err) {
                errorLogger(err);
                return '';
            }
        }
        return '';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2Uvbm9kZS9pZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE2RWhHLG9DQVVDO0lBY0QsMENBV0M7SUF4R0QsMkdBQTJHO0lBQzNHLHlFQUF5RTtJQUN6RSx5REFBeUQ7SUFDekQsNkRBQTZEO0lBQzdELDBCQUEwQjtJQUMxQix1QkFBdUI7SUFDdkIscUJBQXFCO0lBQ3JCLHFCQUFxQjtJQUNyQixzQkFBc0I7SUFDdEIsOEJBQThCO0lBQ2pCLFFBQUEsa0JBQWtCLEdBQXdCLElBQUk7UUFLbEQsMkJBQTJCLENBQUMsR0FBVztZQUM5QyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxxQ0FBaUIsQ0FBQyxVQUFVLEVBQVcsQ0FBQztnQkFFbkUsaUJBQWlCO2dCQUNqQixJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsbUJBQW1C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