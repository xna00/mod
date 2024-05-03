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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/types", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensions/common/extensionValidator", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/externalServices/common/marketplace", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/base/common/stopwatch"], function (require, exports, arrays_1, cancellation_1, errors_1, platform_1, process_1, types_1, uri_1, configuration_1, environment_1, extensionManagement_1, extensionManagementUtil_1, extensionValidator_1, files_1, log_1, productService_1, request_1, marketplace_1, storage_1, telemetry_1, stopwatch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionGalleryServiceWithNoStorageService = exports.ExtensionGalleryService = void 0;
    exports.sortExtensionVersions = sortExtensionVersions;
    const CURRENT_TARGET_PLATFORM = platform_1.isWeb ? "web" /* TargetPlatform.WEB */ : (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch);
    const ACTIVITY_HEADER_NAME = 'X-Market-Search-Activity-Id';
    var Flags;
    (function (Flags) {
        /**
         * None is used to retrieve only the basic extension details.
         */
        Flags[Flags["None"] = 0] = "None";
        /**
         * IncludeVersions will return version information for extensions returned
         */
        Flags[Flags["IncludeVersions"] = 1] = "IncludeVersions";
        /**
         * IncludeFiles will return information about which files were found
         * within the extension that were stored independent of the manifest.
         * When asking for files, versions will be included as well since files
         * are returned as a property of the versions.
         * These files can be retrieved using the path to the file without
         * requiring the entire manifest be downloaded.
         */
        Flags[Flags["IncludeFiles"] = 2] = "IncludeFiles";
        /**
         * Include the Categories and Tags that were added to the extension definition.
         */
        Flags[Flags["IncludeCategoryAndTags"] = 4] = "IncludeCategoryAndTags";
        /**
         * Include the details about which accounts the extension has been shared
         * with if the extension is a private extension.
         */
        Flags[Flags["IncludeSharedAccounts"] = 8] = "IncludeSharedAccounts";
        /**
         * Include properties associated with versions of the extension
         */
        Flags[Flags["IncludeVersionProperties"] = 16] = "IncludeVersionProperties";
        /**
         * Excluding non-validated extensions will remove any extension versions that
         * either are in the process of being validated or have failed validation.
         */
        Flags[Flags["ExcludeNonValidated"] = 32] = "ExcludeNonValidated";
        /**
         * Include the set of installation targets the extension has requested.
         */
        Flags[Flags["IncludeInstallationTargets"] = 64] = "IncludeInstallationTargets";
        /**
         * Include the base uri for assets of this extension
         */
        Flags[Flags["IncludeAssetUri"] = 128] = "IncludeAssetUri";
        /**
         * Include the statistics associated with this extension
         */
        Flags[Flags["IncludeStatistics"] = 256] = "IncludeStatistics";
        /**
         * When retrieving versions from a query, only include the latest
         * version of the extensions that matched. This is useful when the
         * caller doesn't need all the published versions. It will save a
         * significant size in the returned payload.
         */
        Flags[Flags["IncludeLatestVersionOnly"] = 512] = "IncludeLatestVersionOnly";
        /**
         * The Unpublished extension flag indicates that the extension can't be installed/downloaded.
         * Users who have installed such an extension can continue to use the extension.
         */
        Flags[Flags["Unpublished"] = 4096] = "Unpublished";
        /**
         * Include the details if an extension is in conflict list or not
         */
        Flags[Flags["IncludeNameConflictInfo"] = 32768] = "IncludeNameConflictInfo";
    })(Flags || (Flags = {}));
    function flagsToString(...flags) {
        return String(flags.reduce((r, f) => r | f, 0));
    }
    var FilterType;
    (function (FilterType) {
        FilterType[FilterType["Tag"] = 1] = "Tag";
        FilterType[FilterType["ExtensionId"] = 4] = "ExtensionId";
        FilterType[FilterType["Category"] = 5] = "Category";
        FilterType[FilterType["ExtensionName"] = 7] = "ExtensionName";
        FilterType[FilterType["Target"] = 8] = "Target";
        FilterType[FilterType["Featured"] = 9] = "Featured";
        FilterType[FilterType["SearchText"] = 10] = "SearchText";
        FilterType[FilterType["ExcludeWithFlags"] = 12] = "ExcludeWithFlags";
    })(FilterType || (FilterType = {}));
    const AssetType = {
        Icon: 'Microsoft.VisualStudio.Services.Icons.Default',
        Details: 'Microsoft.VisualStudio.Services.Content.Details',
        Changelog: 'Microsoft.VisualStudio.Services.Content.Changelog',
        Manifest: 'Microsoft.VisualStudio.Code.Manifest',
        VSIX: 'Microsoft.VisualStudio.Services.VSIXPackage',
        License: 'Microsoft.VisualStudio.Services.Content.License',
        Repository: 'Microsoft.VisualStudio.Services.Links.Source',
        Signature: 'Microsoft.VisualStudio.Services.VsixSignature'
    };
    const PropertyType = {
        Dependency: 'Microsoft.VisualStudio.Code.ExtensionDependencies',
        ExtensionPack: 'Microsoft.VisualStudio.Code.ExtensionPack',
        Engine: 'Microsoft.VisualStudio.Code.Engine',
        PreRelease: 'Microsoft.VisualStudio.Code.PreRelease',
        LocalizedLanguages: 'Microsoft.VisualStudio.Code.LocalizedLanguages',
        WebExtension: 'Microsoft.VisualStudio.Code.WebExtension',
        SponsorLink: 'Microsoft.VisualStudio.Code.SponsorLink',
        SupportLink: 'Microsoft.VisualStudio.Services.Links.Support',
    };
    const DefaultPageSize = 10;
    const DefaultQueryState = {
        pageNumber: 1,
        pageSize: DefaultPageSize,
        sortBy: 0 /* SortBy.NoneOrRelevance */,
        sortOrder: 0 /* SortOrder.Default */,
        flags: Flags.None,
        criteria: [],
        assetTypes: []
    };
    class Query {
        constructor(state = DefaultQueryState) {
            this.state = state;
        }
        get pageNumber() { return this.state.pageNumber; }
        get pageSize() { return this.state.pageSize; }
        get sortBy() { return this.state.sortBy; }
        get sortOrder() { return this.state.sortOrder; }
        get flags() { return this.state.flags; }
        get criteria() { return this.state.criteria; }
        withPage(pageNumber, pageSize = this.state.pageSize) {
            return new Query({ ...this.state, pageNumber, pageSize });
        }
        withFilter(filterType, ...values) {
            const criteria = [
                ...this.state.criteria,
                ...values.length ? values.map(value => ({ filterType, value })) : [{ filterType }]
            ];
            return new Query({ ...this.state, criteria });
        }
        withSortBy(sortBy) {
            return new Query({ ...this.state, sortBy });
        }
        withSortOrder(sortOrder) {
            return new Query({ ...this.state, sortOrder });
        }
        withFlags(...flags) {
            return new Query({ ...this.state, flags: flags.reduce((r, f) => r | f, 0) });
        }
        withAssetTypes(...assetTypes) {
            return new Query({ ...this.state, assetTypes });
        }
        withSource(source) {
            return new Query({ ...this.state, source });
        }
        get raw() {
            const { criteria, pageNumber, pageSize, sortBy, sortOrder, flags, assetTypes } = this.state;
            const filters = [{ criteria, pageNumber, pageSize, sortBy, sortOrder }];
            return { filters, assetTypes, flags };
        }
        get searchText() {
            const criterium = this.state.criteria.filter(criterium => criterium.filterType === FilterType.SearchText)[0];
            return criterium && criterium.value ? criterium.value : '';
        }
        get telemetryData() {
            return {
                filterTypes: this.state.criteria.map(criterium => String(criterium.filterType)),
                flags: this.state.flags,
                sortBy: String(this.sortBy),
                sortOrder: String(this.sortOrder),
                pageNumber: String(this.pageNumber),
                source: this.state.source,
                searchTextLength: this.searchText.length
            };
        }
    }
    function getStatistic(statistics, name) {
        const result = (statistics || []).filter(s => s.statisticName === name)[0];
        return result ? result.value : 0;
    }
    function getCoreTranslationAssets(version) {
        const coreTranslationAssetPrefix = 'Microsoft.VisualStudio.Code.Translation.';
        const result = version.files.filter(f => f.assetType.indexOf(coreTranslationAssetPrefix) === 0);
        return result.reduce((result, file) => {
            const asset = getVersionAsset(version, file.assetType);
            if (asset) {
                result.push([file.assetType.substring(coreTranslationAssetPrefix.length), asset]);
            }
            return result;
        }, []);
    }
    function getRepositoryAsset(version) {
        if (version.properties) {
            const results = version.properties.filter(p => p.key === AssetType.Repository);
            const gitRegExp = new RegExp('((git|ssh|http(s)?)|(git@[\\w.]+))(:(//)?)([\\w.@:/\\-~]+)(.git)(/)?');
            const uri = results.filter(r => gitRegExp.test(r.value))[0];
            return uri ? { uri: uri.value, fallbackUri: uri.value } : null;
        }
        return getVersionAsset(version, AssetType.Repository);
    }
    function getDownloadAsset(version) {
        return {
            // always use fallbackAssetUri for download asset to hit the Marketplace API so that downloads are counted
            uri: `${version.fallbackAssetUri}/${AssetType.VSIX}?redirect=true${version.targetPlatform ? `&targetPlatform=${version.targetPlatform}` : ''}`,
            fallbackUri: `${version.fallbackAssetUri}/${AssetType.VSIX}${version.targetPlatform ? `?targetPlatform=${version.targetPlatform}` : ''}`
        };
    }
    function getVersionAsset(version, type) {
        const result = version.files.filter(f => f.assetType === type)[0];
        return result ? {
            uri: `${version.assetUri}/${type}${version.targetPlatform ? `?targetPlatform=${version.targetPlatform}` : ''}`,
            fallbackUri: `${version.fallbackAssetUri}/${type}${version.targetPlatform ? `?targetPlatform=${version.targetPlatform}` : ''}`
        } : null;
    }
    function getExtensions(version, property) {
        const values = version.properties ? version.properties.filter(p => p.key === property) : [];
        const value = values.length > 0 && values[0].value;
        return value ? value.split(',').map(v => (0, extensionManagementUtil_1.adoptToGalleryExtensionId)(v)) : [];
    }
    function getEngine(version) {
        const values = version.properties ? version.properties.filter(p => p.key === PropertyType.Engine) : [];
        return (values.length > 0 && values[0].value) || '';
    }
    function isPreReleaseVersion(version) {
        const values = version.properties ? version.properties.filter(p => p.key === PropertyType.PreRelease) : [];
        return values.length > 0 && values[0].value === 'true';
    }
    function getLocalizedLanguages(version) {
        const values = version.properties ? version.properties.filter(p => p.key === PropertyType.LocalizedLanguages) : [];
        const value = (values.length > 0 && values[0].value) || '';
        return value ? value.split(',') : [];
    }
    function getSponsorLink(version) {
        return version.properties?.find(p => p.key === PropertyType.SponsorLink)?.value;
    }
    function getSupportLink(version) {
        return version.properties?.find(p => p.key === PropertyType.SupportLink)?.value;
    }
    function getIsPreview(flags) {
        return flags.indexOf('preview') !== -1;
    }
    function getTargetPlatformForExtensionVersion(version) {
        return version.targetPlatform ? (0, extensionManagement_1.toTargetPlatform)(version.targetPlatform) : "undefined" /* TargetPlatform.UNDEFINED */;
    }
    function getAllTargetPlatforms(rawGalleryExtension) {
        const allTargetPlatforms = (0, arrays_1.distinct)(rawGalleryExtension.versions.map(getTargetPlatformForExtensionVersion));
        // Is a web extension only if it has WEB_EXTENSION_TAG
        const isWebExtension = !!rawGalleryExtension.tags?.includes(extensionManagement_1.WEB_EXTENSION_TAG);
        // Include Web Target Platform only if it is a web extension
        const webTargetPlatformIndex = allTargetPlatforms.indexOf("web" /* TargetPlatform.WEB */);
        if (isWebExtension) {
            if (webTargetPlatformIndex === -1) {
                // Web extension but does not has web target platform -> add it
                allTargetPlatforms.push("web" /* TargetPlatform.WEB */);
            }
        }
        else {
            if (webTargetPlatformIndex !== -1) {
                // Not a web extension but has web target platform -> remove it
                allTargetPlatforms.splice(webTargetPlatformIndex, 1);
            }
        }
        return allTargetPlatforms;
    }
    function sortExtensionVersions(versions, preferredTargetPlatform) {
        /* It is expected that versions from Marketplace are sorted by version. So we are just sorting by preferred targetPlatform */
        for (let index = 0; index < versions.length; index++) {
            const version = versions[index];
            if (version.version === versions[index - 1]?.version) {
                let insertionIndex = index;
                const versionTargetPlatform = getTargetPlatformForExtensionVersion(version);
                /* put it at the beginning */
                if (versionTargetPlatform === preferredTargetPlatform) {
                    while (insertionIndex > 0 && versions[insertionIndex - 1].version === version.version) {
                        insertionIndex--;
                    }
                }
                if (insertionIndex !== index) {
                    versions.splice(index, 1);
                    versions.splice(insertionIndex, 0, version);
                }
            }
        }
        return versions;
    }
    function setTelemetry(extension, index, querySource) {
        /* __GDPR__FRAGMENT__
        "GalleryExtensionTelemetryData2" : {
            "index" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
            "querySource": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "queryActivityId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        }
        */
        extension.telemetryData = { index, querySource, queryActivityId: extension.queryContext?.[ACTIVITY_HEADER_NAME] };
    }
    function toExtension(galleryExtension, version, allTargetPlatforms, queryContext) {
        const latestVersion = galleryExtension.versions[0];
        const assets = {
            manifest: getVersionAsset(version, AssetType.Manifest),
            readme: getVersionAsset(version, AssetType.Details),
            changelog: getVersionAsset(version, AssetType.Changelog),
            license: getVersionAsset(version, AssetType.License),
            repository: getRepositoryAsset(version),
            download: getDownloadAsset(version),
            icon: getVersionAsset(version, AssetType.Icon),
            signature: getVersionAsset(version, AssetType.Signature),
            coreTranslations: getCoreTranslationAssets(version)
        };
        return {
            identifier: {
                id: (0, extensionManagementUtil_1.getGalleryExtensionId)(galleryExtension.publisher.publisherName, galleryExtension.extensionName),
                uuid: galleryExtension.extensionId
            },
            name: galleryExtension.extensionName,
            version: version.version,
            displayName: galleryExtension.displayName,
            publisherId: galleryExtension.publisher.publisherId,
            publisher: galleryExtension.publisher.publisherName,
            publisherDisplayName: galleryExtension.publisher.displayName,
            publisherDomain: galleryExtension.publisher.domain ? { link: galleryExtension.publisher.domain, verified: !!galleryExtension.publisher.isDomainVerified } : undefined,
            publisherSponsorLink: getSponsorLink(latestVersion),
            description: galleryExtension.shortDescription ?? '',
            installCount: getStatistic(galleryExtension.statistics, 'install'),
            rating: getStatistic(galleryExtension.statistics, 'averagerating'),
            ratingCount: getStatistic(galleryExtension.statistics, 'ratingcount'),
            categories: galleryExtension.categories || [],
            tags: galleryExtension.tags || [],
            releaseDate: Date.parse(galleryExtension.releaseDate),
            lastUpdated: Date.parse(galleryExtension.lastUpdated),
            allTargetPlatforms,
            assets,
            properties: {
                dependencies: getExtensions(version, PropertyType.Dependency),
                extensionPack: getExtensions(version, PropertyType.ExtensionPack),
                engine: getEngine(version),
                localizedLanguages: getLocalizedLanguages(version),
                targetPlatform: getTargetPlatformForExtensionVersion(version),
                isPreReleaseVersion: isPreReleaseVersion(version)
            },
            hasPreReleaseVersion: isPreReleaseVersion(latestVersion),
            hasReleaseVersion: true,
            preview: getIsPreview(galleryExtension.flags),
            isSigned: !!assets.signature,
            queryContext,
            supportLink: getSupportLink(latestVersion)
        };
    }
    let AbstractExtensionGalleryService = class AbstractExtensionGalleryService {
        constructor(storageService, requestService, logService, environmentService, telemetryService, fileService, productService, configurationService) {
            this.requestService = requestService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.telemetryService = telemetryService;
            this.fileService = fileService;
            this.productService = productService;
            this.configurationService = configurationService;
            const config = productService.extensionsGallery;
            const isPPEEnabled = config?.servicePPEUrl && configurationService.getValue('_extensionsGallery.enablePPE');
            this.extensionsGalleryUrl = isPPEEnabled ? config.servicePPEUrl : config?.serviceUrl;
            this.extensionsGallerySearchUrl = isPPEEnabled ? undefined : config?.searchUrl;
            this.extensionsControlUrl = config?.controlUrl;
            this.commonHeadersPromise = (0, marketplace_1.resolveMarketplaceHeaders)(productService.version, productService, this.environmentService, this.configurationService, this.fileService, storageService, this.telemetryService);
        }
        api(path = '') {
            return `${this.extensionsGalleryUrl}${path}`;
        }
        isEnabled() {
            return !!this.extensionsGalleryUrl;
        }
        async getExtensions(extensionInfos, arg1, arg2) {
            const options = cancellation_1.CancellationToken.isCancellationToken(arg1) ? {} : arg1;
            const token = cancellation_1.CancellationToken.isCancellationToken(arg1) ? arg1 : arg2;
            const names = [];
            const ids = [], includePreReleases = [], versions = [];
            let isQueryForReleaseVersionFromPreReleaseVersion = true;
            for (const extensionInfo of extensionInfos) {
                if (extensionInfo.uuid) {
                    ids.push(extensionInfo.uuid);
                }
                else {
                    names.push(extensionInfo.id);
                }
                // Set includePreRelease to true if version is set, because the version can be a pre-release version
                const includePreRelease = !!(extensionInfo.version || extensionInfo.preRelease);
                includePreReleases.push({ id: extensionInfo.id, uuid: extensionInfo.uuid, includePreRelease });
                if (extensionInfo.version) {
                    versions.push({ id: extensionInfo.id, uuid: extensionInfo.uuid, version: extensionInfo.version });
                }
                isQueryForReleaseVersionFromPreReleaseVersion = isQueryForReleaseVersionFromPreReleaseVersion && (!!extensionInfo.hasPreRelease && !includePreRelease);
            }
            if (!ids.length && !names.length) {
                return [];
            }
            let query = new Query().withPage(1, extensionInfos.length);
            if (ids.length) {
                query = query.withFilter(FilterType.ExtensionId, ...ids);
            }
            if (names.length) {
                query = query.withFilter(FilterType.ExtensionName, ...names);
            }
            if (options.queryAllVersions || isQueryForReleaseVersionFromPreReleaseVersion /* Inlcude all versions if every requested extension is for release version and has pre-release version  */) {
                query = query.withFlags(query.flags, Flags.IncludeVersions);
            }
            if (options.source) {
                query = query.withSource(options.source);
            }
            const { extensions } = await this.queryGalleryExtensions(query, { targetPlatform: options.targetPlatform ?? CURRENT_TARGET_PLATFORM, includePreRelease: includePreReleases, versions, compatible: !!options.compatible, productVersion: options.productVersion ?? { version: this.productService.version, date: this.productService.date } }, token);
            if (options.source) {
                extensions.forEach((e, index) => setTelemetry(e, index, options.source));
            }
            return extensions;
        }
        async getCompatibleExtension(extension, includePreRelease, targetPlatform, productVersion = { version: this.productService.version, date: this.productService.date }) {
            if ((0, extensionManagement_1.isNotWebExtensionInWebTargetPlatform)(extension.allTargetPlatforms, targetPlatform)) {
                return null;
            }
            if (await this.isExtensionCompatible(extension, includePreRelease, targetPlatform)) {
                return extension;
            }
            const query = new Query()
                .withFlags(Flags.IncludeVersions)
                .withPage(1, 1)
                .withFilter(FilterType.ExtensionId, extension.identifier.uuid);
            const { extensions } = await this.queryGalleryExtensions(query, { targetPlatform, compatible: true, includePreRelease, productVersion }, cancellation_1.CancellationToken.None);
            return extensions[0] || null;
        }
        async isExtensionCompatible(extension, includePreRelease, targetPlatform, productVersion = { version: this.productService.version, date: this.productService.date }) {
            if (!(0, extensionManagement_1.isTargetPlatformCompatible)(extension.properties.targetPlatform, extension.allTargetPlatforms, targetPlatform)) {
                return false;
            }
            if (!includePreRelease && extension.properties.isPreReleaseVersion) {
                // Pre-releases are not allowed when include pre-release flag is not set
                return false;
            }
            let engine = extension.properties.engine;
            if (!engine) {
                const manifest = await this.getManifest(extension, cancellation_1.CancellationToken.None);
                if (!manifest) {
                    throw new Error('Manifest was not found');
                }
                engine = manifest.engines.vscode;
            }
            return (0, extensionValidator_1.isEngineValid)(engine, productVersion.version, productVersion.date);
        }
        async isValidVersion(extension, rawGalleryExtensionVersion, versionType, compatible, allTargetPlatforms, targetPlatform, productVersion = { version: this.productService.version, date: this.productService.date }) {
            if (!(0, extensionManagement_1.isTargetPlatformCompatible)(getTargetPlatformForExtensionVersion(rawGalleryExtensionVersion), allTargetPlatforms, targetPlatform)) {
                return false;
            }
            if (versionType !== 'any' && isPreReleaseVersion(rawGalleryExtensionVersion) !== (versionType === 'prerelease')) {
                return false;
            }
            if (compatible) {
                try {
                    const engine = await this.getEngine(extension, rawGalleryExtensionVersion);
                    if (!(0, extensionValidator_1.isEngineValid)(engine, productVersion.version, productVersion.date)) {
                        return false;
                    }
                }
                catch (error) {
                    this.logService.error(`Error while getting the engine for the version ${rawGalleryExtensionVersion.version}.`, (0, errors_1.getErrorMessage)(error));
                    return false;
                }
            }
            return true;
        }
        async query(options, token) {
            let text = options.text || '';
            const pageSize = options.pageSize ?? 50;
            let query = new Query()
                .withPage(1, pageSize);
            if (text) {
                // Use category filter instead of "category:themes"
                text = text.replace(/\bcategory:("([^"]*)"|([^"]\S*))(\s+|\b|$)/g, (_, quotedCategory, category) => {
                    query = query.withFilter(FilterType.Category, category || quotedCategory);
                    return '';
                });
                // Use tag filter instead of "tag:debuggers"
                text = text.replace(/\btag:("([^"]*)"|([^"]\S*))(\s+|\b|$)/g, (_, quotedTag, tag) => {
                    query = query.withFilter(FilterType.Tag, tag || quotedTag);
                    return '';
                });
                // Use featured filter
                text = text.replace(/\bfeatured(\s+|\b|$)/g, () => {
                    query = query.withFilter(FilterType.Featured);
                    return '';
                });
                text = text.trim();
                if (text) {
                    text = text.length < 200 ? text : text.substring(0, 200);
                    query = query.withFilter(FilterType.SearchText, text);
                }
                query = query.withSortBy(0 /* SortBy.NoneOrRelevance */);
            }
            else if (options.ids) {
                query = query.withFilter(FilterType.ExtensionId, ...options.ids);
            }
            else if (options.names) {
                query = query.withFilter(FilterType.ExtensionName, ...options.names);
            }
            else {
                query = query.withSortBy(4 /* SortBy.InstallCount */);
            }
            if (typeof options.sortBy === 'number') {
                query = query.withSortBy(options.sortBy);
            }
            if (typeof options.sortOrder === 'number') {
                query = query.withSortOrder(options.sortOrder);
            }
            if (options.source) {
                query = query.withSource(options.source);
            }
            const runQuery = async (query, token) => {
                const { extensions, total } = await this.queryGalleryExtensions(query, { targetPlatform: CURRENT_TARGET_PLATFORM, compatible: false, includePreRelease: !!options.includePreRelease, productVersion: options.productVersion ?? { version: this.productService.version, date: this.productService.date } }, token);
                extensions.forEach((e, index) => setTelemetry(e, ((query.pageNumber - 1) * query.pageSize) + index, options.source));
                return { extensions, total };
            };
            const { extensions, total } = await runQuery(query, token);
            const getPage = async (pageIndex, ct) => {
                if (ct.isCancellationRequested) {
                    throw new errors_1.CancellationError();
                }
                const { extensions } = await runQuery(query.withPage(pageIndex + 1), ct);
                return extensions;
            };
            return { firstPage: extensions, total, pageSize: query.pageSize, getPage };
        }
        async queryGalleryExtensions(query, criteria, token) {
            const flags = query.flags;
            /**
             * If both version flags (IncludeLatestVersionOnly and IncludeVersions) are included, then only include latest versions (IncludeLatestVersionOnly) flag.
             */
            if (!!(query.flags & Flags.IncludeLatestVersionOnly) && !!(query.flags & Flags.IncludeVersions)) {
                query = query.withFlags(query.flags & ~Flags.IncludeVersions, Flags.IncludeLatestVersionOnly);
            }
            /**
             * If version flags (IncludeLatestVersionOnly and IncludeVersions) are not included, default is to query for latest versions (IncludeLatestVersionOnly).
             */
            if (!(query.flags & Flags.IncludeLatestVersionOnly) && !(query.flags & Flags.IncludeVersions)) {
                query = query.withFlags(query.flags, Flags.IncludeLatestVersionOnly);
            }
            /**
             * If versions criteria exist, then remove IncludeLatestVersionOnly flag and add IncludeVersions flag.
             */
            if (criteria.versions?.length) {
                query = query.withFlags(query.flags & ~Flags.IncludeLatestVersionOnly, Flags.IncludeVersions);
            }
            /**
             * Add necessary extension flags
             */
            query = query.withFlags(query.flags, Flags.IncludeAssetUri, Flags.IncludeCategoryAndTags, Flags.IncludeFiles, Flags.IncludeStatistics, Flags.IncludeVersionProperties);
            const { galleryExtensions: rawGalleryExtensions, total, context } = await this.queryRawGalleryExtensions(query, token);
            const hasAllVersions = !(query.flags & Flags.IncludeLatestVersionOnly);
            if (hasAllVersions) {
                const extensions = [];
                for (const rawGalleryExtension of rawGalleryExtensions) {
                    const extension = await this.toGalleryExtensionWithCriteria(rawGalleryExtension, criteria, context);
                    if (extension) {
                        extensions.push(extension);
                    }
                }
                return { extensions, total };
            }
            const result = [];
            const needAllVersions = new Map();
            for (let index = 0; index < rawGalleryExtensions.length; index++) {
                const rawGalleryExtension = rawGalleryExtensions[index];
                const extensionIdentifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(rawGalleryExtension.publisher.publisherName, rawGalleryExtension.extensionName), uuid: rawGalleryExtension.extensionId };
                const includePreRelease = (0, types_1.isBoolean)(criteria.includePreRelease) ? criteria.includePreRelease : !!criteria.includePreRelease.find(extensionIdentifierWithPreRelease => (0, extensionManagementUtil_1.areSameExtensions)(extensionIdentifierWithPreRelease, extensionIdentifier))?.includePreRelease;
                if (criteria.compatible && (0, extensionManagement_1.isNotWebExtensionInWebTargetPlatform)(getAllTargetPlatforms(rawGalleryExtension), criteria.targetPlatform)) {
                    /** Skip if requested for a web-compatible extension and it is not a web extension.
                     * All versions are not needed in this case
                    */
                    continue;
                }
                const extension = await this.toGalleryExtensionWithCriteria(rawGalleryExtension, criteria, context);
                if (!extension
                    /** Need all versions if the extension is a pre-release version but
                     * 		- the query is to look for a release version or
                     * 		- the extension has no release version
                     * Get all versions to get or check the release version
                    */
                    || (extension.properties.isPreReleaseVersion && (!includePreRelease || !extension.hasReleaseVersion))
                    /**
                     * Need all versions if the extension is a release version with a different target platform than requested and also has a pre-release version
                     * Because, this is a platform specific extension and can have a newer release version supporting this platform.
                     * See https://github.com/microsoft/vscode/issues/139628
                    */
                    || (!extension.properties.isPreReleaseVersion && extension.properties.targetPlatform !== criteria.targetPlatform && extension.hasPreReleaseVersion)) {
                    needAllVersions.set(rawGalleryExtension.extensionId, index);
                }
                else {
                    result.push([index, extension]);
                }
            }
            if (needAllVersions.size) {
                const stopWatch = new stopwatch_1.StopWatch();
                const query = new Query()
                    .withFlags(flags & ~Flags.IncludeLatestVersionOnly, Flags.IncludeVersions)
                    .withPage(1, needAllVersions.size)
                    .withFilter(FilterType.ExtensionId, ...needAllVersions.keys());
                const { extensions } = await this.queryGalleryExtensions(query, criteria, token);
                this.telemetryService.publicLog2('galleryService:additionalQuery', {
                    duration: stopWatch.elapsed(),
                    count: needAllVersions.size
                });
                for (const extension of extensions) {
                    const index = needAllVersions.get(extension.identifier.uuid);
                    result.push([index, extension]);
                }
            }
            return { extensions: result.sort((a, b) => a[0] - b[0]).map(([, extension]) => extension), total };
        }
        async toGalleryExtensionWithCriteria(rawGalleryExtension, criteria, queryContext) {
            const extensionIdentifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(rawGalleryExtension.publisher.publisherName, rawGalleryExtension.extensionName), uuid: rawGalleryExtension.extensionId };
            const version = criteria.versions?.find(extensionIdentifierWithVersion => (0, extensionManagementUtil_1.areSameExtensions)(extensionIdentifierWithVersion, extensionIdentifier))?.version;
            const includePreRelease = (0, types_1.isBoolean)(criteria.includePreRelease) ? criteria.includePreRelease : !!criteria.includePreRelease.find(extensionIdentifierWithPreRelease => (0, extensionManagementUtil_1.areSameExtensions)(extensionIdentifierWithPreRelease, extensionIdentifier))?.includePreRelease;
            const allTargetPlatforms = getAllTargetPlatforms(rawGalleryExtension);
            const rawGalleryExtensionVersions = sortExtensionVersions(rawGalleryExtension.versions, criteria.targetPlatform);
            if (criteria.compatible && (0, extensionManagement_1.isNotWebExtensionInWebTargetPlatform)(allTargetPlatforms, criteria.targetPlatform)) {
                return null;
            }
            for (let index = 0; index < rawGalleryExtensionVersions.length; index++) {
                const rawGalleryExtensionVersion = rawGalleryExtensionVersions[index];
                if (version && rawGalleryExtensionVersion.version !== version) {
                    continue;
                }
                // Allow any version if includePreRelease flag is set otherwise only release versions are allowed
                if (await this.isValidVersion((0, extensionManagementUtil_1.getGalleryExtensionId)(rawGalleryExtension.publisher.publisherName, rawGalleryExtension.extensionName), rawGalleryExtensionVersion, includePreRelease ? 'any' : 'release', criteria.compatible, allTargetPlatforms, criteria.targetPlatform, criteria.productVersion)) {
                    return toExtension(rawGalleryExtension, rawGalleryExtensionVersion, allTargetPlatforms, queryContext);
                }
                if (version && rawGalleryExtensionVersion.version === version) {
                    return null;
                }
            }
            if (version || criteria.compatible) {
                return null;
            }
            /**
             * Fallback: Return the latest version
             * This can happen when the extension does not have a release version or does not have a version compatible with the given target platform.
             */
            return toExtension(rawGalleryExtension, rawGalleryExtension.versions[0], allTargetPlatforms);
        }
        async queryRawGalleryExtensions(query, token) {
            if (!this.isEnabled()) {
                throw new Error('No extension gallery service configured.');
            }
            query = query
                /* Always exclude non validated extensions */
                .withFlags(query.flags, Flags.ExcludeNonValidated)
                .withFilter(FilterType.Target, 'Microsoft.VisualStudio.Code')
                /* Always exclude unpublished extensions */
                .withFilter(FilterType.ExcludeWithFlags, flagsToString(Flags.Unpublished));
            const commonHeaders = await this.commonHeadersPromise;
            const data = JSON.stringify(query.raw);
            const headers = {
                ...commonHeaders,
                'Content-Type': 'application/json',
                'Accept': 'application/json;api-version=3.0-preview.1',
                'Accept-Encoding': 'gzip',
                'Content-Length': String(data.length),
            };
            const stopWatch = new stopwatch_1.StopWatch();
            let context, error, total = 0;
            try {
                context = await this.requestService.request({
                    type: 'POST',
                    url: this.extensionsGallerySearchUrl && query.criteria.some(c => c.filterType === FilterType.SearchText) ? this.extensionsGallerySearchUrl : this.api('/extensionquery'),
                    data,
                    headers
                }, token);
                if (context.res.statusCode && context.res.statusCode >= 400 && context.res.statusCode < 500) {
                    return { galleryExtensions: [], total };
                }
                const result = await (0, request_1.asJson)(context);
                if (result) {
                    const r = result.results[0];
                    const galleryExtensions = r.extensions;
                    const resultCount = r.resultMetadata && r.resultMetadata.filter(m => m.metadataType === 'ResultCount')[0];
                    total = resultCount && resultCount.metadataItems.filter(i => i.name === 'TotalCount')[0].count || 0;
                    return {
                        galleryExtensions,
                        total,
                        context: {
                            [ACTIVITY_HEADER_NAME]: context.res.headers['activityid']
                        }
                    };
                }
                return { galleryExtensions: [], total };
            }
            catch (e) {
                const errorCode = (0, errors_1.isCancellationError)(e) ? extensionManagement_1.ExtensionGalleryErrorCode.Cancelled : (0, errors_1.getErrorMessage)(e).startsWith('XHR timeout') ? extensionManagement_1.ExtensionGalleryErrorCode.Timeout : extensionManagement_1.ExtensionGalleryErrorCode.Failed;
                error = new extensionManagement_1.ExtensionGalleryError((0, errors_1.getErrorMessage)(e), errorCode);
                throw error;
            }
            finally {
                this.telemetryService.publicLog2('galleryService:query', {
                    ...query.telemetryData,
                    requestBodySize: String(data.length),
                    duration: stopWatch.elapsed(),
                    success: !!context && (0, request_1.isSuccess)(context),
                    responseBodySize: context?.res.headers['Content-Length'],
                    statusCode: context ? String(context.res.statusCode) : undefined,
                    errorCode: error?.code,
                    count: String(total)
                });
            }
        }
        async reportStatistic(publisher, name, version, type) {
            if (!this.isEnabled()) {
                return undefined;
            }
            const url = platform_1.isWeb ? this.api(`/itemName/${publisher}.${name}/version/${version}/statType/${type === "install" /* StatisticType.Install */ ? '1' : '3'}/vscodewebextension`) : this.api(`/publishers/${publisher}/extensions/${name}/${version}/stats?statType=${type}`);
            const Accept = platform_1.isWeb ? 'api-version=6.1-preview.1' : '*/*;api-version=4.0-preview.1';
            const commonHeaders = await this.commonHeadersPromise;
            const headers = { ...commonHeaders, Accept };
            try {
                await this.requestService.request({
                    type: 'POST',
                    url,
                    headers
                }, cancellation_1.CancellationToken.None);
            }
            catch (error) { /* Ignore */ }
        }
        async download(extension, location, operation) {
            this.logService.trace('ExtensionGalleryService#download', extension.identifier.id);
            const data = (0, extensionManagementUtil_1.getGalleryExtensionTelemetryData)(extension);
            const startTime = new Date().getTime();
            /* __GDPR__
                "galleryService:downloadVSIX" : {
                    "owner": "sandy081",
                    "duration": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "${include}": [
                        "${GalleryExtensionTelemetryData}"
                    ]
                }
            */
            const log = (duration) => this.telemetryService.publicLog('galleryService:downloadVSIX', { ...data, duration });
            const operationParam = operation === 2 /* InstallOperation.Install */ ? 'install' : operation === 3 /* InstallOperation.Update */ ? 'update' : '';
            const downloadAsset = operationParam ? {
                uri: `${extension.assets.download.uri}${uri_1.URI.parse(extension.assets.download.uri).query ? '&' : '?'}${operationParam}=true`,
                fallbackUri: `${extension.assets.download.fallbackUri}${uri_1.URI.parse(extension.assets.download.fallbackUri).query ? '&' : '?'}${operationParam}=true`
            } : extension.assets.download;
            const headers = extension.queryContext?.[ACTIVITY_HEADER_NAME] ? { [ACTIVITY_HEADER_NAME]: extension.queryContext[ACTIVITY_HEADER_NAME] } : undefined;
            const context = await this.getAsset(extension.identifier.id, downloadAsset, AssetType.VSIX, headers ? { headers } : undefined);
            await this.fileService.writeFile(location, context.stream);
            log(new Date().getTime() - startTime);
        }
        async downloadSignatureArchive(extension, location) {
            if (!extension.assets.signature) {
                throw new Error('No signature asset found');
            }
            this.logService.trace('ExtensionGalleryService#downloadSignatureArchive', extension.identifier.id);
            const context = await this.getAsset(extension.identifier.id, extension.assets.signature, AssetType.Signature);
            await this.fileService.writeFile(location, context.stream);
        }
        async getReadme(extension, token) {
            if (extension.assets.readme) {
                const context = await this.getAsset(extension.identifier.id, extension.assets.readme, AssetType.Details, {}, token);
                const content = await (0, request_1.asTextOrError)(context);
                return content || '';
            }
            return '';
        }
        async getManifest(extension, token) {
            if (extension.assets.manifest) {
                const context = await this.getAsset(extension.identifier.id, extension.assets.manifest, AssetType.Manifest, {}, token);
                const text = await (0, request_1.asTextOrError)(context);
                return text ? JSON.parse(text) : null;
            }
            return null;
        }
        async getManifestFromRawExtensionVersion(extension, rawExtensionVersion, token) {
            const manifestAsset = getVersionAsset(rawExtensionVersion, AssetType.Manifest);
            if (!manifestAsset) {
                throw new Error('Manifest was not found');
            }
            const headers = { 'Accept-Encoding': 'gzip' };
            const context = await this.getAsset(extension, manifestAsset, AssetType.Manifest, { headers });
            return await (0, request_1.asJson)(context);
        }
        async getCoreTranslation(extension, languageId) {
            const asset = extension.assets.coreTranslations.filter(t => t[0] === languageId.toUpperCase())[0];
            if (asset) {
                const context = await this.getAsset(extension.identifier.id, asset[1], asset[0]);
                const text = await (0, request_1.asTextOrError)(context);
                return text ? JSON.parse(text) : null;
            }
            return null;
        }
        async getChangelog(extension, token) {
            if (extension.assets.changelog) {
                const context = await this.getAsset(extension.identifier.id, extension.assets.changelog, AssetType.Changelog, {}, token);
                const content = await (0, request_1.asTextOrError)(context);
                return content || '';
            }
            return '';
        }
        async getAllCompatibleVersions(extension, includePreRelease, targetPlatform) {
            let query = new Query()
                .withFlags(Flags.IncludeVersions, Flags.IncludeCategoryAndTags, Flags.IncludeFiles, Flags.IncludeVersionProperties)
                .withPage(1, 1);
            if (extension.identifier.uuid) {
                query = query.withFilter(FilterType.ExtensionId, extension.identifier.uuid);
            }
            else {
                query = query.withFilter(FilterType.ExtensionName, extension.identifier.id);
            }
            const { galleryExtensions } = await this.queryRawGalleryExtensions(query, cancellation_1.CancellationToken.None);
            if (!galleryExtensions.length) {
                return [];
            }
            const allTargetPlatforms = getAllTargetPlatforms(galleryExtensions[0]);
            if ((0, extensionManagement_1.isNotWebExtensionInWebTargetPlatform)(allTargetPlatforms, targetPlatform)) {
                return [];
            }
            const validVersions = [];
            await Promise.all(galleryExtensions[0].versions.map(async (version) => {
                try {
                    if (await this.isValidVersion(extension.identifier.id, version, includePreRelease ? 'any' : 'release', true, allTargetPlatforms, targetPlatform)) {
                        validVersions.push(version);
                    }
                }
                catch (error) { /* Ignore error and skip version */ }
            }));
            const result = [];
            const seen = new Set();
            for (const version of sortExtensionVersions(validVersions, targetPlatform)) {
                if (!seen.has(version.version)) {
                    seen.add(version.version);
                    result.push({ version: version.version, date: version.lastUpdated, isPreReleaseVersion: isPreReleaseVersion(version) });
                }
            }
            return result;
        }
        async getAsset(extension, asset, assetType, options = {}, token = cancellation_1.CancellationToken.None) {
            const commonHeaders = await this.commonHeadersPromise;
            const baseOptions = { type: 'GET' };
            const headers = { ...commonHeaders, ...(options.headers || {}) };
            options = { ...options, ...baseOptions, headers };
            const url = asset.uri;
            const fallbackUrl = asset.fallbackUri;
            const firstOptions = { ...options, url };
            try {
                const context = await this.requestService.request(firstOptions, token);
                if (context.res.statusCode === 200) {
                    return context;
                }
                const message = await (0, request_1.asTextOrError)(context);
                throw new Error(`Expected 200, got back ${context.res.statusCode} instead.\n\n${message}`);
            }
            catch (err) {
                if ((0, errors_1.isCancellationError)(err)) {
                    throw err;
                }
                const message = (0, errors_1.getErrorMessage)(err);
                this.telemetryService.publicLog2('galleryService:cdnFallback', { extension, assetType, message });
                const fallbackOptions = { ...options, url: fallbackUrl };
                return this.requestService.request(fallbackOptions, token);
            }
        }
        async getEngine(extension, rawExtensionVersion) {
            let engine = getEngine(rawExtensionVersion);
            if (!engine) {
                this.telemetryService.publicLog2('galleryService:engineFallback', { extension, version: rawExtensionVersion.version });
                const manifest = await this.getManifestFromRawExtensionVersion(extension, rawExtensionVersion, cancellation_1.CancellationToken.None);
                if (!manifest) {
                    throw new Error('Manifest was not found');
                }
                engine = manifest.engines.vscode;
            }
            return engine;
        }
        async getExtensionsControlManifest() {
            if (!this.isEnabled()) {
                throw new Error('No extension gallery service configured.');
            }
            if (!this.extensionsControlUrl) {
                return { malicious: [], deprecated: {}, search: [] };
            }
            const context = await this.requestService.request({ type: 'GET', url: this.extensionsControlUrl }, cancellation_1.CancellationToken.None);
            if (context.res.statusCode !== 200) {
                throw new Error('Could not get extensions report.');
            }
            const result = await (0, request_1.asJson)(context);
            const malicious = [];
            const deprecated = {};
            const search = [];
            if (result) {
                for (const id of result.malicious) {
                    malicious.push({ id });
                }
                if (result.migrateToPreRelease) {
                    for (const [unsupportedPreReleaseExtensionId, preReleaseExtensionInfo] of Object.entries(result.migrateToPreRelease)) {
                        if (!preReleaseExtensionInfo.engine || (0, extensionValidator_1.isEngineValid)(preReleaseExtensionInfo.engine, this.productService.version, this.productService.date)) {
                            deprecated[unsupportedPreReleaseExtensionId.toLowerCase()] = {
                                disallowInstall: true,
                                extension: {
                                    id: preReleaseExtensionInfo.id,
                                    displayName: preReleaseExtensionInfo.displayName,
                                    autoMigrate: { storage: !!preReleaseExtensionInfo.migrateStorage },
                                    preRelease: true
                                }
                            };
                        }
                    }
                }
                if (result.deprecated) {
                    for (const [deprecatedExtensionId, deprecationInfo] of Object.entries(result.deprecated)) {
                        if (deprecationInfo) {
                            deprecated[deprecatedExtensionId.toLowerCase()] = (0, types_1.isBoolean)(deprecationInfo) ? {} : deprecationInfo;
                        }
                    }
                }
                if (result.search) {
                    for (const s of result.search) {
                        search.push(s);
                    }
                }
            }
            return { malicious, deprecated, search };
        }
    };
    AbstractExtensionGalleryService = __decorate([
        __param(1, request_1.IRequestService),
        __param(2, log_1.ILogService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, files_1.IFileService),
        __param(6, productService_1.IProductService),
        __param(7, configuration_1.IConfigurationService)
    ], AbstractExtensionGalleryService);
    let ExtensionGalleryService = class ExtensionGalleryService extends AbstractExtensionGalleryService {
        constructor(storageService, requestService, logService, environmentService, telemetryService, fileService, productService, configurationService) {
            super(storageService, requestService, logService, environmentService, telemetryService, fileService, productService, configurationService);
        }
    };
    exports.ExtensionGalleryService = ExtensionGalleryService;
    exports.ExtensionGalleryService = ExtensionGalleryService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, request_1.IRequestService),
        __param(2, log_1.ILogService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, files_1.IFileService),
        __param(6, productService_1.IProductService),
        __param(7, configuration_1.IConfigurationService)
    ], ExtensionGalleryService);
    let ExtensionGalleryServiceWithNoStorageService = class ExtensionGalleryServiceWithNoStorageService extends AbstractExtensionGalleryService {
        constructor(requestService, logService, environmentService, telemetryService, fileService, productService, configurationService) {
            super(undefined, requestService, logService, environmentService, telemetryService, fileService, productService, configurationService);
        }
    };
    exports.ExtensionGalleryServiceWithNoStorageService = ExtensionGalleryServiceWithNoStorageService;
    exports.ExtensionGalleryServiceWithNoStorageService = ExtensionGalleryServiceWithNoStorageService = __decorate([
        __param(0, request_1.IRequestService),
        __param(1, log_1.ILogService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, files_1.IFileService),
        __param(5, productService_1.IProductService),
        __param(6, configuration_1.IConfigurationService)
    ], ExtensionGalleryServiceWithNoStorageService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uR2FsbGVyeVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvY29tbW9uL2V4dGVuc2lvbkdhbGxlcnlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTBkaEcsc0RBa0JDO0lBamRELE1BQU0sdUJBQXVCLEdBQUcsZ0JBQUssQ0FBQyxDQUFDLGdDQUFvQixDQUFDLENBQUMsSUFBQSx1Q0FBaUIsRUFBQyxtQkFBUSxFQUFFLGNBQUksQ0FBQyxDQUFDO0lBQy9GLE1BQU0sb0JBQW9CLEdBQUcsNkJBQTZCLENBQUM7SUFzRTNELElBQUssS0E2RUo7SUE3RUQsV0FBSyxLQUFLO1FBRVQ7O1dBRUc7UUFDSCxpQ0FBVSxDQUFBO1FBRVY7O1dBRUc7UUFDSCx1REFBcUIsQ0FBQTtRQUVyQjs7Ozs7OztXQU9HO1FBQ0gsaURBQWtCLENBQUE7UUFFbEI7O1dBRUc7UUFDSCxxRUFBNEIsQ0FBQTtRQUU1Qjs7O1dBR0c7UUFDSCxtRUFBMkIsQ0FBQTtRQUUzQjs7V0FFRztRQUNILDBFQUErQixDQUFBO1FBRS9COzs7V0FHRztRQUNILGdFQUEwQixDQUFBO1FBRTFCOztXQUVHO1FBQ0gsOEVBQWlDLENBQUE7UUFFakM7O1dBRUc7UUFDSCx5REFBc0IsQ0FBQTtRQUV0Qjs7V0FFRztRQUNILDZEQUF5QixDQUFBO1FBRXpCOzs7OztXQUtHO1FBQ0gsMkVBQWdDLENBQUE7UUFFaEM7OztXQUdHO1FBQ0gsa0RBQW9CLENBQUE7UUFFcEI7O1dBRUc7UUFDSCwyRUFBZ0MsQ0FBQTtJQUNqQyxDQUFDLEVBN0VJLEtBQUssS0FBTCxLQUFLLFFBNkVUO0lBRUQsU0FBUyxhQUFhLENBQUMsR0FBRyxLQUFjO1FBQ3ZDLE9BQU8sTUFB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