/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/platform/extensionManagement/common/extensionManagementUtil"], function (require, exports, cancellation_1, extensionManagementUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.migrateUnsupportedExtensions = migrateUnsupportedExtensions;
    /**
     * Migrates the installed unsupported nightly extension to a supported pre-release extension. It includes following:
     * 	- Uninstall the Unsupported extension
     * 	- Install (with optional storage migration) the Pre-release extension only if
     * 		- the extension is not installed
     * 		- or it is a release version and the unsupported extension is enabled.
     */
    async function migrateUnsupportedExtensions(extensionManagementService, galleryService, extensionStorageService, extensionEnablementService, logService) {
        try {
            const extensionsControlManifest = await extensionManagementService.getExtensionsControlManifest();
            if (!extensionsControlManifest.deprecated) {
                return;
            }
            const installed = await extensionManagementService.getInstalled(1 /* ExtensionType.User */);
            for (const [unsupportedExtensionId, deprecated] of Object.entries(extensionsControlManifest.deprecated)) {
                if (!deprecated?.extension) {
                    continue;
                }
                const { id: preReleaseExtensionId, autoMigrate, preRelease } = deprecated.extension;
                if (!autoMigrate) {
                    continue;
                }
                const unsupportedExtension = installed.find(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, { id: unsupportedExtensionId }));
                // Unsupported Extension is not installed
                if (!unsupportedExtension) {
                    continue;
                }
                const gallery = (await galleryService.getExtensions([{ id: preReleaseExtensionId, preRelease }], { targetPlatform: await extensionManagementService.getTargetPlatform(), compatible: true }, cancellation_1.CancellationToken.None))[0];
                if (!gallery) {
                    logService.info(`Skipping migrating '${unsupportedExtension.identifier.id}' extension because, the comaptible target '${preReleaseExtensionId}' extension is not found`);
                    continue;
                }
                try {
                    logService.info(`Migrating '${unsupportedExtension.identifier.id}' extension to '${preReleaseExtensionId}' extension...`);
                    const isUnsupportedExtensionEnabled = !extensionEnablementService.getDisabledExtensions().some(e => (0, extensionManagementUtil_1.areSameExtensions)(e, unsupportedExtension.identifier));
                    await extensionManagementService.uninstall(unsupportedExtension);
                    logService.info(`Uninstalled the unsupported extension '${unsupportedExtension.identifier.id}'`);
                    let preReleaseExtension = installed.find(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, { id: preReleaseExtensionId }));
                    if (!preReleaseExtension || (!preReleaseExtension.isPreReleaseVersion && isUnsupportedExtensionEnabled)) {
                        preReleaseExtension = await extensionManagementService.installFromGallery(gallery, { installPreReleaseVersion: true, isMachineScoped: unsupportedExtension.isMachineScoped, operation: 4 /* InstallOperation.Migrate */ });
                        logService.info(`Installed the pre-release extension '${preReleaseExtension.identifier.id}'`);
                        if (!isUnsupportedExtensionEnabled) {
                            await extensionEnablementService.disableExtension(preReleaseExtension.identifier);
                            logService.info(`Disabled the pre-release extension '${preReleaseExtension.identifier.id}' because the unsupported extension '${unsupportedExtension.identifier.id}' is disabled`);
                        }
                        if (autoMigrate.storage) {
                            extensionStorageService.addToMigrationList((0, extensionManagementUtil_1.getExtensionId)(unsupportedExtension.manifest.publisher, unsupportedExtension.manifest.name), (0, extensionManagementUtil_1.getExtensionId)(preReleaseExtension.manifest.publisher, preReleaseExtension.manifest.name));
                            logService.info(`Added pre-release extension to the storage migration list`);
                        }
                    }
                    logService.info(`Migrated '${unsupportedExtension.identifier.id}' extension to '${preReleaseExtensionId}' extension.`);
                }
                catch (error) {
                    logService.error(error);
                }
            }
        }
        catch (error) {
            logService.error(error);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5zdXBwb3J0ZWRFeHRlbnNpb25zTWlncmF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25NYW5hZ2VtZW50L2NvbW1vbi91bnN1cHBvcnRlZEV4dGVuc2lvbnNNaWdyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQmhHLG9FQXVEQztJQTlERDs7Ozs7O09BTUc7SUFDSSxLQUFLLFVBQVUsNEJBQTRCLENBQUMsMEJBQXVELEVBQUUsY0FBd0MsRUFBRSx1QkFBaUQsRUFBRSwwQkFBNkQsRUFBRSxVQUF1QjtRQUM5UixJQUFJLENBQUM7WUFDSixNQUFNLHlCQUF5QixHQUFHLE1BQU0sMEJBQTBCLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztZQUNsRyxJQUFJLENBQUMseUJBQXlCLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQzNDLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxTQUFTLEdBQUcsTUFBTSwwQkFBMEIsQ0FBQyxZQUFZLDRCQUFvQixDQUFDO1lBQ3BGLEtBQUssTUFBTSxDQUFDLHNCQUFzQixFQUFFLFVBQVUsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMseUJBQXlCLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDekcsSUFBSSxDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsQ0FBQztvQkFDNUIsU0FBUztnQkFDVixDQUFDO2dCQUNELE1BQU0sRUFBRSxFQUFFLEVBQUUscUJBQXFCLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUM7Z0JBQ3BGLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDbEIsU0FBUztnQkFDVixDQUFDO2dCQUNELE1BQU0sb0JBQW9CLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FB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