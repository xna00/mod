/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dnd", "vs/base/browser/window", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/map", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/uri", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/files/browser/htmlFileSystemProvider", "vs/platform/files/browser/webFileSystemAccess", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/registry/common/platform"], function (require, exports, dnd_1, window_1, arrays_1, async_1, buffer_1, map_1, marshalling_1, network_1, platform_1, uri_1, nls_1, dialogs_1, htmlFileSystemProvider_1, webFileSystemAccess_1, files_1, instantiation_1, opener_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalSelectionTransfer = exports.Extensions = exports.CodeDataTransfers = void 0;
    exports.extractEditorsDropData = extractEditorsDropData;
    exports.extractEditorsAndFilesDropData = extractEditorsAndFilesDropData;
    exports.createDraggedEditorInputFromRawResourcesData = createDraggedEditorInputFromRawResourcesData;
    exports.extractFileListData = extractFileListData;
    exports.containsDragType = containsDragType;
    //#region Editor / Resources DND
    exports.CodeDataTransfers = {
        EDITORS: 'CodeEditors',
        FILES: 'CodeFiles'
    };
    function extractEditorsDropData(e) {
        const editors = [];
        if (e.dataTransfer && e.dataTransfer.types.length > 0) {
            // Data Transfer: Code Editors
            const rawEditorsData = e.dataTransfer.getData(exports.CodeDataTransfers.EDITORS);
            if (rawEditorsData) {
                try {
                    editors.push(...(0, marshalling_1.parse)(rawEditorsData));
                }
                catch (error) {
                    // Invalid transfer
                }
            }
            // Data Transfer: Resources
            else {
                try {
                    const rawResourcesData = e.dataTransfer.getData(dnd_1.DataTransfers.RESOURCES);
                    editors.push(...createDraggedEditorInputFromRawResourcesData(rawResourcesData));
                }
                catch (error) {
                    // Invalid transfer
                }
            }
            // Check for native file transfer
            if (e.dataTransfer?.files) {
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    const file = e.dataTransfer.files[i];
                    if (file && file.path /* Electron only */) {
                        try {
                            editors.push({ resource: uri_1.URI.file(file.path), isExternal: true, allowWorkspaceOpen: true });
                        }
                        catch (error) {
                            // Invalid URI
                        }
                    }
                }
            }
            // Check for CodeFiles transfer
            const rawCodeFiles = e.dataTransfer.getData(exports.CodeDataTransfers.FILES);
            if (rawCodeFiles) {
                try {
                    const codeFiles = JSON.parse(rawCodeFiles);
                    for (const codeFile of codeFiles) {
                        editors.push({ resource: uri_1.URI.file(codeFile), isExternal: true, allowWorkspaceOpen: true });
                    }
                }
                catch (error) {
                    // Invalid transfer
                }
            }
            // Workbench contributions
            const contributions = platform_2.Registry.as(exports.Extensions.DragAndDropContribution).getAll();
            for (const contribution of contributions) {
                const data = e.dataTransfer.getData(contribution.dataFormatKey);
                if (data) {
                    try {
                        editors.push(...contribution.getEditorInputs(data));
                    }
                    catch (error) {
                        // Invalid transfer
                    }
                }
            }
        }
        // Prevent duplicates: it is possible that we end up with the same
        // dragged editor multiple times because multiple data transfers
        // are being used (https://github.com/microsoft/vscode/issues/128925)
        const coalescedEditors = [];
        const seen = new map_1.ResourceMap();
        for (const editor of editors) {
            if (!editor.resource) {
                coalescedEditors.push(editor);
            }
            else if (!seen.has(editor.resource)) {
                coalescedEditors.push(editor);
                seen.set(editor.resource, true);
            }
        }
        return coalescedEditors;
    }
    async function extractEditorsAndFilesDropData(accessor, e) {
        const editors = extractEditorsDropData(e);
        // Web: Check for file transfer
        if (e.dataTransfer && platform_1.isWeb && containsDragType(e, dnd_1.DataTransfers.FILES)) {
            const files = e.dataTransfer.items;
            if (files) {
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const filesData = await instantiationService.invokeFunction(accessor => extractFilesDropData(accessor, e));
                for (const fileData of filesData) {
                    editors.push({ resource: fileData.resource, contents: fileData.contents?.toString(), isExternal: true, allowWorkspaceOpen: fileData.isDirectory });
                }
            }
        }
        return editors;
    }
    function createDraggedEditorInputFromRawResourcesData(rawResourcesData) {
        const editors = [];
        if (rawResourcesData) {
            const resourcesRaw = JSON.parse(rawResourcesData);
            for (const resourceRaw of resourcesRaw) {
                if (resourceRaw.indexOf(':') > 0) { // mitigate https://github.com/microsoft/vscode/issues/124946
                    const { selection, uri } = (0, opener_1.extractSelection)(uri_1.URI.parse(resourceRaw));
                    editors.push({ resource: uri, options: { selection } });
                }
            }
        }
        return editors;
    }
    async function extractFilesDropData(accessor, event) {
        // Try to extract via `FileSystemHandle`
        if (webFileSystemAccess_1.WebFileSystemAccess.supported(window_1.mainWindow)) {
            const items = event.dataTransfer?.items;
            if (items) {
                return extractFileTransferData(accessor, items);
            }
        }
        // Try to extract via `FileList`
        const files = event.dataTransfer?.files;
        if (!files) {
            return [];
        }
        return extractFileListData(accessor, files);
    }
    async function extractFileTransferData(accessor, items) {
        const fileSystemProvider = accessor.get(files_1.IFileService).getProvider(network_1.Schemas.file);
        if (!(fileSystemProvider instanceof htmlFileSystemProvider_1.HTMLFileSystemProvider)) {
            return []; // only supported when running in web
        }
        const results = [];
        for (let i = 0; i < items.length; i++) {
            const file = items[i];
            if (file) {
                const result = new async_1.DeferredPromise();
                results.push(result);
                (async () => {
                    try {
                        const handle = await file.getAsFileSystemHandle();
                        if (!handle) {
                            result.complete(undefined);
                            return;
                        }
                        if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(handle)) {
                            result.complete({
                                resource: await fileSystemProvider.registerFileHandle(handle),
                                isDirectory: false
                            });
                        }
                        else if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemDirectoryHandle(handle)) {
                            result.complete({
                                resource: await fileSystemProvider.registerDirectoryHandle(handle),
                                isDirectory: true
                            });
                        }
                        else {
                            result.complete(undefined);
                        }
                    }
                    catch (error) {
                        result.complete(undefined);
                    }
                })();
            }
        }
        return (0, arrays_1.coalesce)(await Promise.all(results.map(result => result.p)));
    }
    async function extractFileListData(accessor, files) {
        const dialogService = accessor.get(dialogs_1.IDialogService);
        const results = [];
        for (let i = 0; i < files.length; i++) {
            const file = files.item(i);
            if (file) {
                // Skip for very large files because this operation is unbuffered
                if (file.size > 100 * files_1.ByteSize.MB) {
                    dialogService.warn((0, nls_1.localize)('fileTooLarge', "File is too large to open as untitled editor. Please upload it first into the file explorer and then try again."));
                    continue;
                }
                const result = new async_1.DeferredPromise();
                results.push(result);
                const reader = new FileReader();
                reader.onerror = () => result.complete(undefined);
                reader.onabort = () => result.complete(undefined);
                reader.onload = async (event) => {
                    const name = file.name;
                    const loadResult = event.target?.result ?? undefined;
                    if (typeof name !== 'string' || typeof loadResult === 'undefined') {
                        result.complete(undefined);
                        return;
                    }
                    result.complete({
                        resource: uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: name }),
                        contents: typeof loadResult === 'string' ? buffer_1.VSBuffer.fromString(loadResult) : buffer_1.VSBuffer.wrap(new Uint8Array(loadResult))
                    });
                };
                // Start reading
                reader.readAsArrayBuffer(file);
            }
        }
        return (0, arrays_1.coalesce)(await Promise.all(results.map(result => result.p)));
    }
    //#endregion
    function containsDragType(event, ...dragTypesToFind) {
        if (!event.dataTransfer) {
            return false;
        }
        const dragTypes = event.dataTransfer.types;
        const lowercaseDragTypes = [];
        for (let i = 0; i < dragTypes.length; i++) {
            lowercaseDragTypes.push(dragTypes[i].toLowerCase()); // somehow the types are lowercase
        }
        for (const dragType of dragTypesToFind) {
            if (lowercaseDragTypes.indexOf(dragType.toLowerCase()) >= 0) {
                return true;
            }
        }
        return false;
    }
    class DragAndDropContributionRegistry {
        constructor() {
            this._contributions = new Map();
        }
        register(contribution) {
            if (this._contributions.has(contribution.dataFormatKey)) {
                throw new Error(`A drag and drop contributiont with key '${contribution.dataFormatKey}' was already registered.`);
            }
            this._contributions.set(contribution.dataFormatKey, contribution);
        }
        getAll() {
            return this._contributions.values();
        }
    }
    exports.Extensions = {
        DragAndDropContribution: 'workbench.contributions.dragAndDrop'
    };
    platform_2.Registry.add(exports.Extensions.DragAndDropContribution, new DragAndDropContributionRegistry());
    //#endregion
    //#region DND Utilities
    /**
     * A singleton to store transfer data during drag & drop operations that are only valid within the application.
     */
    class LocalSelectionTransfer {
        static { this.INSTANCE = new LocalSelectionTransfer(); }
        constructor() {
            // protect against external instantiation
        }
        static getInstance() {
            return LocalSelectionTransfer.INSTANCE;
        }
        hasData(proto) {
            return proto && proto === this.proto;
        }
        clearData(proto) {
            if (this.hasData(proto)) {
                this.proto = undefined;
                this.data = undefined;
            }
        }
        getData(proto) {
            if (this.hasData(proto)) {
                return this.data;
            }
            return undefined;
        }
        setData(data, proto) {
            if (proto) {
                this.data = data;
                this.proto = proto;
            }
        }
    }
    exports.LocalSelectionTransfer = LocalSelectionTransfer;
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9kbmQvYnJvd3Nlci9kbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdURoRyx3REFpRkM7SUFFRCx3RUFnQkM7SUFFRCxvR0FjQztJQXlFRCxrREEyQ0M7SUFJRCw0Q0FrQkM7SUFyUkQsZ0NBQWdDO0lBRW5CLFFBQUEsaUJBQWlCLEdBQUc7UUFDaEMsT0FBTyxFQUFFLGFBQWE7UUFDdEIsS0FBSyxFQUFFLFdBQVc7S0FDbEIsQ0FBQztJQW1CRixTQUFnQixzQkFBc0IsQ0FBQyxDQUFZO1FBQ2xELE1BQU0sT0FBTyxHQUFrQyxFQUFFLENBQUM7UUFDbEQsSUFBSSxDQUFDLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUV2RCw4QkFBOEI7WUFDOUIsTUFBTSxjQUFjLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMseUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDekUsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDO29CQUNKLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFBLG1CQUFLLEVBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztnQkFDeEMsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNoQixtQkFBbUI7Z0JBQ3BCLENBQUM7WUFDRixDQUFDO1lBRUQsMkJBQTJCO2lCQUN0QixDQUFDO2dCQUNMLElBQUksQ0FBQztvQkFDSixNQUFNLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLG1CQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3pFLE9BQU8sQ0FBQyxJQUFJ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