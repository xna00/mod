/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/uuid"], function (require, exports, buffer_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getServiceMachineId = getServiceMachineId;
    async function getServiceMachineId(environmentService, fileService, storageService) {
        let uuid = storageService ? storageService.get('storage.serviceMachineId', -1 /* StorageScope.APPLICATION */) || null : null;
        if (uuid) {
            return uuid;
        }
        try {
            const contents = await fileService.readFile(environmentService.serviceMachineIdResource);
            const value = contents.value.toString();
            uuid = (0, uuid_1.isUUID)(value) ? value : null;
        }
        catch (e) {
            uuid = null;
        }
        if (!uuid) {
            uuid = (0, uuid_1.generateUuid)();
            try {
                await fileService.writeFile(environmentService.serviceMachineIdResource, buffer_1.VSBuffer.fromString(uuid));
            }
            catch (error) {
                //noop
            }
        }
        storageService?.store('storage.serviceMachineId', uuid, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        return uuid;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZU1hY2hpbmVJZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZXJuYWxTZXJ2aWNlcy9jb21tb24vc2VydmljZU1hY2hpbmVJZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxrREF5QkM7SUF6Qk0sS0FBSyxVQUFVLG1CQUFtQixDQUFDLGtCQUF1QyxFQUFFLFdBQXlCLEVBQUUsY0FBMkM7UUFDeEosSUFBSSxJQUFJLEdBQWtCLGNBQWMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsb0NBQTJCLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDbkksSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNWLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNELElBQUksQ0FBQztZQUNKLE1BQU0sUUFBUSxHQUFHLE1BQU0sV0FBVyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDeEMsSUFBSSxHQUFHLElBQUEsYUFBTSxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNyQyxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNaLElBQUksR0FBRyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1gsSUFBSSxHQUFHLElBQUEsbUJBQVksR0FBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQztnQkFDSixNQUFNLFdBQVcsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsd0JBQXdCLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNyRyxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsTUFBTTtZQUNQLENBQUM7UUFDRixDQUFDO1FBRUQsY0FBYyxFQUFFLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxJQUFJLG1FQUFrRCxDQUFDO1FBRXpHLE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQyJ9