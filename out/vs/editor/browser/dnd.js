/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dnd", "vs/base/common/dataTransfer", "vs/base/common/mime", "vs/base/common/uri", "vs/platform/dnd/browser/dnd"], function (require, exports, dnd_1, dataTransfer_1, mime_1, uri_1, dnd_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toVSDataTransfer = toVSDataTransfer;
    exports.toExternalVSDataTransfer = toExternalVSDataTransfer;
    function toVSDataTransfer(dataTransfer) {
        const vsDataTransfer = new dataTransfer_1.VSDataTransfer();
        for (const item of dataTransfer.items) {
            const type = item.type;
            if (item.kind === 'string') {
                const asStringValue = new Promise(resolve => item.getAsString(resolve));
                vsDataTransfer.append(type, (0, dataTransfer_1.createStringDataTransferItem)(asStringValue));
            }
            else if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    vsDataTransfer.append(type, createFileDataTransferItemFromFile(file));
                }
            }
        }
        return vsDataTransfer;
    }
    function createFileDataTransferItemFromFile(file) {
        const uri = file.path ? uri_1.URI.parse(file.path) : undefined;
        return (0, dataTransfer_1.createFileDataTransferItem)(file.name, uri, async () => {
            return new Uint8Array(await file.arrayBuffer());
        });
    }
    const INTERNAL_DND_MIME_TYPES = Object.freeze([
        dnd_2.CodeDataTransfers.EDITORS,
        dnd_2.CodeDataTransfers.FILES,
        dnd_1.DataTransfers.RESOURCES,
        dnd_1.DataTransfers.INTERNAL_URI_LIST,
    ]);
    function toExternalVSDataTransfer(sourceDataTransfer, overwriteUriList = false) {
        const vsDataTransfer = toVSDataTransfer(sourceDataTransfer);
        // Try to expose the internal uri-list type as the standard type
        const uriList = vsDataTransfer.get(dnd_1.DataTransfers.INTERNAL_URI_LIST);
        if (uriList) {
            vsDataTransfer.replace(mime_1.Mimes.uriList, uriList);
        }
        else {
            if (overwriteUriList || !vsDataTransfer.has(mime_1.Mimes.uriList)) {
                // Otherwise, fallback to adding dragged resources to the uri list
                const editorData = [];
                for (const item of sourceDataTransfer.items) {
                    const file = item.getAsFile();
                    if (file) {
                        const path = file.path;
                        try {
                            if (path) {
                                editorData.push(uri_1.URI.file(path).toString());
                            }
                            else {
                                editorData.push(uri_1.URI.parse(file.name, true).toString());
                            }
                        }
                        catch {
                            // Parsing failed. Leave out from list
                        }
                    }
                }
                if (editorData.length) {
                    vsDataTransfer.replace(mime_1.Mimes.uriList, (0, dataTransfer_1.createStringDataTransferItem)(dataTransfer_1.UriList.create(editorData)));
                }
            }
        }
        for (const internal of INTERNAL_DND_MIME_TYPES) {
            vsDataTransfer.delete(internal);
        }
        return vsDataTransfer;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9kbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsNENBZUM7SUFnQkQsNERBc0NDO0lBckVELFNBQWdCLGdCQUFnQixDQUFDLFlBQTBCO1FBQzFELE1BQU0sY0FBYyxHQUFHLElBQUksNkJBQWMsRUFBRSxDQUFDO1FBQzVDLEtBQUssTUFBTSxJQUFJLElBQUksWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3ZDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDdkIsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM1QixNQUFNLGFBQWEsR0FBRyxJQUFJLE9BQU8sQ0FBUyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDaEYsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBQSwyQ0FBNEIsRUFBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQzFFLENBQUM7aUJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO2dCQUNqQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzlCLElBQUksSUFBSSxFQUFFLENBQUM7b0JBQ1YsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsa0NBQWtDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDdkUsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxjQUFjLENBQUM7SUFDdkIsQ0FBQztJQUVELFNBQVMsa0NBQWtDLENBQUMsSUFBVTtRQUNyRCxNQUFNLEdBQUcsR0FBSSxJQUF1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