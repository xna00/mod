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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/product/common/productService", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, event_1, lifecycle_1, platform_1, strings_1, nls_1, environment_1, files_1, instantiation_1, productService_1, serviceMachineId_1, storage_1, userDataSync_1) {
    "use strict";
    var UserDataSyncMachinesService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncMachinesService = exports.IUserDataSyncMachinesService = void 0;
    exports.isWebPlatform = isWebPlatform;
    exports.IUserDataSyncMachinesService = (0, instantiation_1.createDecorator)('IUserDataSyncMachinesService');
    const currentMachineNameKey = 'sync.currentMachineName';
    const Safari = 'Safari';
    const Chrome = 'Chrome';
    const Edge = 'Edge';
    const Firefox = 'Firefox';
    const Android = 'Android';
    function isWebPlatform(platform) {
        switch (platform) {
            case Safari:
            case Chrome:
            case Edge:
            case Firefox:
            case Android:
            case (0, platform_1.PlatformToString)(0 /* Platform.Web */):
                return true;
        }
        return false;
    }
    function getPlatformName() {
        if (platform_1.isSafari) {
            return Safari;
        }
        if (platform_1.isChrome) {
            return Chrome;
        }
        if (platform_1.isEdge) {
            return Edge;
        }
        if (platform_1.isFirefox) {
            return Firefox;
        }
        if (platform_1.isAndroid) {
            return Android;
        }
        return (0, platform_1.PlatformToString)(platform_1.isWeb ? 0 /* Platform.Web */ : platform_1.platform);
    }
    let UserDataSyncMachinesService = class UserDataSyncMachinesService extends lifecycle_1.Disposable {
        static { UserDataSyncMachinesService_1 = this; }
        static { this.VERSION = 1; }
        static { this.RESOURCE = 'machines'; }
        constructor(environmentService, fileService, storageService, userDataSyncStoreService, logService, productService) {
            super();
            this.storageService = storageService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.logService = logService;
            this.productService = productService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.userData = null;
            this.currentMachineIdPromise = (0, serviceMachineId_1.getServiceMachineId)(environmentService, fileService, storageService);
        }
        async getMachines(manifest) {
            const currentMachineId = await this.currentMachineIdPromise;
            const machineData = await this.readMachinesData(manifest);
            return machineData.machines.map(machine => ({ ...machine, ...{ isCurrent: machine.id === currentMachineId } }));
        }
        async addCurrentMachine(manifest) {
            const currentMachineId = await this.currentMachineIdPromise;
            const machineData = await this.readMachinesData(manifest);
            if (!machineData.machines.some(({ id }) => id === currentMachineId)) {
                machineData.machines.push({ id: currentMachineId, name: this.computeCurrentMachineName(machineData.machines), platform: getPlatformName() });
                await this.writeMachinesData(machineData);
            }
        }
        async removeCurrentMachine(manifest) {
            const currentMachineId = await this.currentMachineIdPromise;
            const machineData = await this.readMachinesData(manifest);
            const updatedMachines = machineData.machines.filter(({ id }) => id !== currentMachineId);
            if (updatedMachines.length !== machineData.machines.length) {
                machineData.machines = updatedMachines;
                await this.writeMachinesData(machineData);
            }
        }
        async renameMachine(machineId, name, manifest) {
            const machineData = await this.readMachinesData(manifest);
            const machine = machineData.machines.find(({ id }) => id === machineId);
            if (machine) {
                machine.name = name;
                await this.writeMachinesData(machineData);
                const currentMachineId = await this.currentMachineIdPromise;
                if (machineId === currentMachineId) {
                    this.storageService.store(currentMachineNameKey, name, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                }
            }
        }
        async setEnablements(enablements) {
            const machineData = await this.readMachinesData();
            for (const [machineId, enabled] of enablements) {
                const machine = machineData.machines.find(machine => machine.id === machineId);
                if (machine) {
                    machine.disabled = enabled ? undefined : true;
                }
            }
            await this.writeMachinesData(machineData);
        }
        computeCurrentMachineName(machines) {
            const previousName = this.storageService.get(currentMachineNameKey, -1 /* StorageScope.APPLICATION */);
            if (previousName) {
                return previousName;
            }
            const namePrefix = `${this.productService.embedderIdentifier ? `${this.productService.embedderIdentifier} - ` : ''}${getPlatformName()} (${this.productService.nameShort})`;
            const nameRegEx = new RegExp(`${(0, strings_1.escapeRegExpCharacters)(namePrefix)}\\s#(\\d+)`);
            let nameIndex = 0;
            for (const machine of machines) {
                const matches = nameRegEx.exec(machine.name);
                const index = matches ? parseInt(matches[1]) : 0;
                nameIndex = index > nameIndex ? index : nameIndex;
            }
            return `${namePrefix} #${nameIndex + 1}`;
        }
        async readMachinesData(manifest) {
            this.userData = await this.readUserData(manifest);
            const machinesData = this.parse(this.userData);
            if (machinesData.version !== UserDataSyncMachinesService_1.VERSION) {
                throw new Error((0, nls_1.localize)('error incompatible', "Cannot read machines data as the current version is incompatible. Please update {0} and try again.", this.productService.nameLong));
            }
            return machinesData;
        }
        async writeMachinesData(machinesData) {
            const content = JSON.stringify(machinesData);
            const ref = await this.userDataSyncStoreService.writeResource(UserDataSyncMachinesService_1.RESOURCE, content, this.userData?.ref || null);
            this.userData = { ref, content };
            this._onDidChange.fire();
        }
        async readUserData(manifest) {
            if (this.userData) {
                const latestRef = manifest && manifest.latest ? manifest.latest[UserDataSyncMachinesService_1.RESOURCE] : undefined;
                // Last time synced resource and latest resource on server are same
                if (this.userData.ref === latestRef) {
                    return this.userData;
                }
                // There is no resource on server and last time it was synced with no resource
                if (latestRef === undefined && this.userData.content === null) {
                    return this.userData;
                }
            }
            return this.userDataSyncStoreService.readResource(UserDataSyncMachinesService_1.RESOURCE, this.userData);
        }
        parse(userData) {
            if (userData.content !== null) {
                try {
                    return JSON.parse(userData.content);
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
            return {
                version: UserDataSyncMachinesService_1.VERSION,
                machines: []
            };
        }
    };
    exports.UserDataSyncMachinesService = UserDataSyncMachinesService;
    exports.UserDataSyncMachinesService = UserDataSyncMachinesService = UserDataSyncMachinesService_1 = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, storage_1.IStorageService),
        __param(3, userDataSync_1.IUserDataSyncStoreService),
        __param(4, userDataSync_1.IUserDataSyncLogService),
        __param(5, productService_1.IProductService)
    ], UserDataSyncMachinesService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jTWFjaGluZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy9jb21tb24vdXNlckRhdGFTeW5jTWFjaGluZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW1EaEcsc0NBV0M7SUFqQ1ksUUFBQSw0QkFBNEIsR0FBRyxJQUFBLCtCQUFlLEVBQStCLDhCQUE4QixDQUFDLENBQUM7SUFjMUgsTUFBTSxxQkFBcUIsR0FBRyx5QkFBeUIsQ0FBQztJQUV4RCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUM7SUFDeEIsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDO0lBQ3hCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQztJQUNwQixNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUM7SUFDMUIsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDO0lBRTFCLFNBQWdCLGFBQWEsQ0FBQyxRQUFnQjtRQUM3QyxRQUFRLFFBQVEsRUFBRSxDQUFDO1lBQ2xCLEtBQUssTUFBTSxDQUFDO1lBQ1osS0FBSyxNQUFNLENBQUM7WUFDWixLQUFLLElBQUksQ0FBQztZQUNWLEtBQUssT0FBTyxDQUFDO1lBQ2IsS0FBSyxPQUFPLENBQUM7WUFDYixLQUFLLElBQUEsMkJBQWdCLHVCQUFjO2dCQUNsQyxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxTQUFTLGVBQWU7UUFDdkIsSUFBSSxtQkFBUSxFQUFFLENBQUM7WUFBQyxPQUFPLE1BQU0sQ0FBQztRQUFDLENBQUM7UUFDaEMsSUFBSSxtQkFBUSxFQUFFLENBQUM7WUFBQyxPQUFPLE1BQU0sQ0FBQztRQUFDLENBQUM7UUFDaEMsSUFBSSxpQkFBTSxFQUFFLENBQUM7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