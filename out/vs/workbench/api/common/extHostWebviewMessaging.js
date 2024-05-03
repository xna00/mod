/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer"], function (require, exports, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.serializeWebviewMessage = serializeWebviewMessage;
    exports.deserializeWebviewMessage = deserializeWebviewMessage;
    class ArrayBufferSet {
        constructor() {
            this.buffers = [];
        }
        add(buffer) {
            let index = this.buffers.indexOf(buffer);
            if (index < 0) {
                index = this.buffers.length;
                this.buffers.push(buffer);
            }
            return index;
        }
    }
    function serializeWebviewMessage(message, options) {
        if (options.serializeBuffersForPostMessage) {
            // Extract all ArrayBuffers from the message and replace them with references.
            const arrayBuffers = new ArrayBufferSet();
            const replacer = (_key, value) => {
                if (value instanceof ArrayBuffer) {
                    const index = arrayBuffers.add(value);
                    return {
                        $$vscode_array_buffer_reference$$: true,
                        index,
                    };
                }
                else if (ArrayBuffer.isView(value)) {
                    const type = getTypedArrayType(value);
                    if (type) {
                        const index = arrayBuffers.add(value.buffer);
                        return {
                            $$vscode_array_buffer_reference$$: true,
                            index,
                            view: {
                                type: type,
                                byteLength: value.byteLength,
                                byteOffset: value.byteOffset,
                            }
                        };
                    }
                }
                return value;
            };
            const serializedMessage = JSON.stringify(message, replacer);
            const buffers = arrayBuffers.buffers.map(arrayBuffer => {
                const bytes = new Uint8Array(arrayBuffer);
                return buffer_1.VSBuffer.wrap(bytes);
            });
            return { message: serializedMessage, buffers };
        }
        else {
            return { message: JSON.stringify(message), buffers: [] };
        }
    }
    function getTypedArrayType(value) {
        switch (value.constructor.name) {
            case 'Int8Array': return 1 /* extHostProtocol.WebviewMessageArrayBufferViewType.Int8Array */;
            case 'Uint8Array': return 2 /* extHostProtocol.WebviewMessageArrayBufferViewType.Uint8Array */;
            case 'Uint8ClampedArray': return 3 /* extHostProtocol.WebviewMessageArrayBufferViewType.Uint8ClampedArray */;
            case 'Int16Array': return 4 /* extHostProtocol.WebviewMessageArrayBufferViewType.Int16Array */;
            case 'Uint16Array': return 5 /* extHostProtocol.WebviewMessageArrayBufferViewType.Uint16Array */;
            case 'Int32Array': return 6 /* extHostProtocol.WebviewMessageArrayBufferViewType.Int32Array */;
            case 'Uint32Array': return 7 /* extHostProtocol.WebviewMessageArrayBufferViewType.Uint32Array */;
            case 'Float32Array': return 8 /* extHostProtocol.WebviewMessageArrayBufferViewType.Float32Array */;
            case 'Float64Array': return 9 /* extHostProtocol.WebviewMessageArrayBufferViewType.Float64Array */;
            case 'BigInt64Array': return 10 /* extHostProtocol.WebviewMessageArrayBufferViewType.BigInt64Array */;
            case 'BigUint64Array': return 11 /* extHostProtocol.WebviewMessageArrayBufferViewType.BigUint64Array */;
        }
        return undefined;
    }
    function deserializeWebviewMessage(jsonMessage, buffers) {
        const arrayBuffers = buffers.map(buffer => {
            const arrayBuffer = new ArrayBuffer(buffer.byteLength);
            const uint8Array = new Uint8Array(arrayBuffer);
            uint8Array.set(buffer.buffer);
            return arrayBuffer;
        });
        const reviver = !buffers.length ? undefined : (_key, value) => {
            if (value && typeof value === 'object' && value.$$vscode_array_buffer_reference$$) {
                const ref = value;
                const { index } = ref;
                const arrayBuffer = arrayBuffers[index];
                if (ref.view) {
                    switch (ref.view.type) {
                        case 1 /* extHostProtocol.WebviewMessageArrayBufferViewType.Int8Array */: return new Int8Array(arrayBuffer, ref.view.byteOffset, ref.view.byteLength / Int8Array.BYTES_PER_ELEMENT);
                        case 2 /* extHostProtocol.WebviewMessageArrayBufferViewType.Uint8Array */: return new Uint8Array(arrayBuffer, ref.view.byteOffset, ref.view.byteLength / Uint8Array.BYTES_PER_ELEMENT);
                        case 3 /* extHostProtocol.WebviewMessageArrayBufferViewType.Uint8ClampedArray */: return new Uint8ClampedArray(arrayBuffer, ref.view.byteOffset, ref.view.byteLength / Uint8ClampedArray.BYTES_PER_ELEMENT);
                        case 4 /* extHostProtocol.WebviewMessageArrayBufferViewType.Int16Array */: return new Int16Array(arrayBuffer, ref.view.byteOffset, ref.view.byteLength / Int16Array.BYTES_PER_ELEMENT);
                        case 5 /* extHostProtocol.WebviewMessageArrayBufferViewType.Uint16Array */: return new Uint16Array(arrayBuffer, ref.view.byteOffset, ref.view.byteLength / Uint16Array.BYTES_PER_ELEMENT);
                        case 6 /* extHostProtocol.WebviewMessageArrayBufferViewType.Int32Array */: return new Int32Array(arrayBuffer, ref.view.byteOffset, ref.view.byteLength / Int32Array.BYTES_PER_ELEMENT);
                        case 7 /* extHostProtocol.WebviewMessageArrayBufferViewType.Uint32Array */: return new Uint32Array(arrayBuffer, ref.view.byteOffset, ref.view.byteLength / Uint32Array.BYTES_PER_ELEMENT);
                        case 8 /* extHostProtocol.WebviewMessageArrayBufferViewType.Float32Array */: return new Float32Array(arrayBuffer, ref.view.byteOffset, ref.view.byteLength / Float32Array.BYTES_PER_ELEMENT);
                        case 9 /* extHostProtocol.WebviewMessageArrayBufferViewType.Float64Array */: return new Float64Array(arrayBuffer, ref.view.byteOffset, ref.view.byteLength / Float64Array.BYTES_PER_ELEMENT);
                        case 10 /* extHostProtocol.WebviewMessageArrayBufferViewType.BigInt64Array */: return new BigInt64Array(arrayBuffer, ref.view.byteOffset, ref.view.byteLength / BigInt64Array.BYTES_PER_ELEMENT);
                        case 11 /* extHostProtocol.WebviewMessageArrayBufferViewType.BigUint64Array */: return new BigUint64Array(arrayBuffer, ref.view.byteOffset, ref.view.byteLength / BigUint64Array.BYTES_PER_ELEMENT);
                        default: throw new Error('Unknown array buffer view type');
                    }
                }
                return arrayBuffer;
            }
            return value;
        };
        const message = JSON.parse(jsonMessage, reviver);
        return { message, arrayBuffers };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFdlYnZpZXdNZXNzYWdpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RXZWJ2aWV3TWVzc2FnaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0JoRywwREE2Q0M7SUFtQkQsOERBb0NDO0lBakhELE1BQU0sY0FBYztRQUFwQjtZQUNpQixZQUFPLEdBQWtCLEVBQUUsQ0FBQztRQVU3QyxDQUFDO1FBUk8sR0FBRyxDQUFDLE1BQW1CO1lBQzdCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNmLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztnQkFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0IsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztLQUNEO0lBRUQsU0FBZ0IsdUJBQXVCLENBQ3RDLE9BQVksRUFDWixPQUFxRDtRQUVyRCxJQUFJLE9BQU8sQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO1lBQzVDLDhFQUE4RTtZQUM5RSxNQUFNLFlBQVksR0FBRyxJQUFJLGNBQWMsRUFBRSxDQUFDO1lBRTFDLE1BQU0sUUFBUSxHQUFHLENBQUMsSUFBWSxFQUFFLEtBQVUsRUFBRSxFQUFFO2dCQUM3QyxJQUFJLEtBQUssWUFBWSxXQUFXLEVBQUUsQ0FBQztvQkFDbEMsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdEMsT0FBMkQ7d0JBQzFELGlDQUFpQyxFQUFFLElBQUk7d0JBQ3ZD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