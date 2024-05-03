/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.requestUsbDevice = requestUsbDevice;
    exports.requestSerialPort = requestSerialPort;
    exports.requestHidDevice = requestHidDevice;
    async function requestUsbDevice(options) {
        const usb = navigator.usb;
        if (!usb) {
            return undefined;
        }
        const device = await usb.requestDevice({ filters: options?.filters ?? [] });
        if (!device) {
            return undefined;
        }
        return {
            deviceClass: device.deviceClass,
            deviceProtocol: device.deviceProtocol,
            deviceSubclass: device.deviceSubclass,
            deviceVersionMajor: device.deviceVersionMajor,
            deviceVersionMinor: device.deviceVersionMinor,
            deviceVersionSubminor: device.deviceVersionSubminor,
            manufacturerName: device.manufacturerName,
            productId: device.productId,
            productName: device.productName,
            serialNumber: device.serialNumber,
            usbVersionMajor: device.usbVersionMajor,
            usbVersionMinor: device.usbVersionMinor,
            usbVersionSubminor: device.usbVersionSubminor,
            vendorId: device.vendorId,
        };
    }
    async function requestSerialPort(options) {
        const serial = navigator.serial;
        if (!serial) {
            return undefined;
        }
        const port = await serial.requestPort({ filters: options?.filters ?? [] });
        if (!port) {
            return undefined;
        }
        const info = port.getInfo();
        return {
            usbVendorId: info.usbVendorId,
            usbProductId: info.usbProductId
        };
    }
    async function requestHidDevice(options) {
        const hid = navigator.hid;
        if (!hid) {
            return undefined;
        }
        const devices = await hid.requestDevice({ filters: options?.filters ?? [] });
        if (!devices.length) {
            return undefined;
        }
        const device = devices[0];
        return {
            opened: device.opened,
            vendorId: device.vendorId,
            productId: device.productId,
            productName: device.productName,
            collections: device.collections
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2aWNlQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvZGV2aWNlQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBcUJoRyw0Q0EyQkM7SUFTRCw4Q0FnQkM7SUFZRCw0Q0FtQkM7SUFuRk0sS0FBSyxVQUFVLGdCQUFnQixDQUFDLE9BQWlDO1FBQ3ZFLE1BQU0sR0FBRyxHQUFJLFNBQWlCLENBQUMsR0FBRyxDQUFDO1FBQ25DLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNWLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNiLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxPQUFPO1lBQ04sV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXO1lBQy9CLGNBQWMsRUFBRSxNQUFNLENBQUMsY0FBYztZQUNyQyxjQUFjLEVBQUUsTUFBTSxDQUFDLGNBQWM7WUFDckMsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLGtCQUFrQjtZQUM3QyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsa0JBQWtCO1lBQzdDLHFCQUFxQixFQUFFLE1BQU0sQ0FBQyxxQkFBcUI7WUFDbkQsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjtZQUN6QyxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVM7WUFDM0IsV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXO1lBQy9CLFlBQVksRUFBRSxNQUFNLENBQUMsWUFBWTtZQUNqQyxlQUFlLEVBQUUsTUFBTSxDQUFDLGVBQWU7WUFDdkMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxlQUFlO1lBQ3ZDLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxrQkFBa0I7WUFDN0MsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1NBQ3pCLENBQUM7SUFDSCxDQUFDO0lBU00sS0FBSyxVQUFVLGlCQUFpQixDQUFDLE9BQWlDO1FBQ3hFLE1BQU0sTUFBTSxHQUFJLFNBQWlCLENBQUMsTUFBTSxDQUFDO1FBQ3pDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNiLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzNFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNYLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUIsT0FBTztZQUNOLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztZQUM3QixZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7U0FDL0IsQ0FBQztJQUNILENBQUM7SUFZTSxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsT0FBaUM7UUFDdkUsTUFBTSxHQUFHLEdBQUksU0FBaUIsQ0FBQyxHQUFHLENBQUM7UUFDbkMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ1YsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN0UsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNyQixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFCLE9BQU87WUFDTixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07WUFDckIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1lBQ3pCLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztZQUMzQixXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVc7WUFDL0IsV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXO1NBQy9CLENBQUM7SUFDSCxDQUFDIn0=