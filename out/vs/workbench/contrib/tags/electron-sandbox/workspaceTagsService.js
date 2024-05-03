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
define(["require", "exports", "vs/base/browser/hash", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/uri", "vs/base/common/network", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/tags/common/workspaceTags", "vs/workbench/contrib/tags/electron-sandbox/workspaceTags", "vs/base/common/strings", "vs/workbench/contrib/tags/common/javaWorkspaceTags"], function (require, exports, hash_1, files_1, workspace_1, environmentService_1, textfiles_1, uri_1, network_1, extensions_1, workspaceTags_1, workspaceTags_2, strings_1, javaWorkspaceTags_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTagsService = void 0;
    const MetaModulesToLookFor = [
        // Azure packages
        '@azure',
        '@azure/ai',
        '@azure/core',
        '@azure/cosmos',
        '@azure/event',
        '@azure/identity',
        '@azure/keyvault',
        '@azure/search',
        '@azure/storage'
    ];
    const ModulesToLookFor = [
        // Packages that suggest a node server
        'express',
        'sails',
        'koa',
        'hapi',
        'socket.io',
        'restify',
        'next',
        'nuxt',
        '@nestjs/core',
        'strapi',
        'gatsby',
        // JS frameworks
        'react',
        'react-native',
        'react-native-macos',
        'react-native-windows',
        'rnpm-plugin-windows',
        '@angular/core',
        '@ionic',
        'vue',
        'tns-core-modules',
        '@nativescript/core',
        'electron',
        // Other interesting packages
        'aws-sdk',
        'aws-amplify',
        'azure',
        'azure-storage',
        'chroma',
        'faiss',
        'firebase',
        '@google-cloud/common',
        'heroku-cli',
        'langchain',
        'milvus',
        'openai',
        'pinecone',
        'qdrant',
        // Office and Sharepoint packages
        '@microsoft/teams-js',
        '@microsoft/office-js',
        '@microsoft/office-js-helpers',
        '@types/office-js',
        '@types/office-runtime',
        'office-ui-fabric-react',
        '@uifabric/icons',
        '@uifabric/merge-styles',
        '@uifabric/styling',
        '@uifabric/experiments',
        '@uifabric/utilities',
        '@microsoft/rush',
        'lerna',
        'just-task',
        'beachball',
        // Playwright packages
        'playwright',
        'playwright-cli',
        '@playwright/test',
        'playwright-core',
        'playwright-chromium',
        'playwright-firefox',
        'playwright-webkit',
        // Other interesting browser testing packages
        'cypress',
        'nightwatch',
        'protractor',
        'puppeteer',
        'selenium-webdriver',
        'webdriverio',
        'gherkin',
        // AzureSDK packages
        '@azure/app-configuration',
        '@azure/cosmos-sign',
        '@azure/cosmos-language-service',
        '@azure/synapse-spark',
        '@azure/synapse-monitoring',
        '@azure/synapse-managed-private-endpoints',
        '@azure/synapse-artifacts',
        '@azure/synapse-access-control',
        '@azure/ai-metrics-advisor',
        '@azure/service-bus',
        '@azure/keyvault-secrets',
        '@azure/keyvault-keys',
        '@azure/keyvault-certificates',
        '@azure/keyvault-admin',
        '@azure/digital-twins-core',
        '@azure/cognitiveservices-anomalydetector',
        '@azure/ai-anomaly-detector',
        '@azure/core-xml',
        '@azure/core-tracing',
        '@azure/core-paging',
        '@azure/core-https',
        '@azure/core-client',
        '@azure/core-asynciterator-polyfill',
        '@azure/core-arm',
        '@azure/amqp-common',
        '@azure/core-lro',
        '@azure/logger',
        '@azure/core-http',
        '@azure/core-auth',
        '@azure/core-amqp',
        '@azure/abort-controller',
        '@azure/eventgrid',
        '@azure/storage-file-datalake',
        '@azure/search-documents',
        '@azure/storage-file',
        '@azure/storage-datalake',
        '@azure/storage-queue',
        '@azure/storage-file-share',
        '@azure/storage-blob-changefeed',
        '@azure/storage-blob',
        '@azure/cognitiveservices-formrecognizer',
        '@azure/ai-form-recognizer',
        '@azure/cognitiveservices-textanalytics',
        '@azure/ai-text-analytics',
        '@azure/event-processor-host',
        '@azure/schema-registry-avro',
        '@azure/schema-registry',
        '@azure/eventhubs-checkpointstore-blob',
        '@azure/event-hubs',
        '@azure/communication-signaling',
        '@azure/communication-calling',
        '@azure/communication-sms',
        '@azure/communication-common',
        '@azure/communication-chat',
        '@azure/communication-administration',
        '@azure/attestation',
        '@azure/data-tables',
        '@azure/arm-appservice',
        '@azure-rest/arm-appservice',
        '@azure/arm-appcontainers',
        '@azure/arm-rediscache',
        '@azure/arm-redisenterprisecache',
        '@azure/arm-apimanagement',
        '@azure/arm-logic',
        '@azure/app-configuration',
        '@azure/arm-appconfiguration',
        '@azure/arm-dashboard',
        '@azure/arm-signalr',
        '@azure/arm-securitydevops',
        '@azure/arm-labservices',
        '@azure/web-pubsub',
        '@azure/web-pubsub-client',
        '@azure/web-pubsub-client-protobuf',
        '@azure/web-pubsub-express',
        '@azure/openai',
        '@azure/arm-hybridkubernetes',
        '@azure/arm-kubernetesconfiguration'
    ];
    const PyMetaModulesToLookFor = [
        'azure-ai',
        'azure-cognitiveservices',
        'azure-core',
        'azure-cosmos',
        'azure-event',
        'azure-identity',
        'azure-keyvault',
        'azure-mgmt',
        'azure-ml',
        'azure-search',
        'azure-storage'
    ];
    const PyModulesToLookFor = [
        'azure',
        'azure-ai-language-conversations',
        'azure-ai-language-questionanswering',
        'azure-ai-ml',
        'azure-ai-translation-document',
        'azure-appconfiguration',
        'azure-appconfiguration-provider',
        'azure-loganalytics',
        'azure-synapse-nspkg',
        'azure-synapse-spark',
        'azure-synapse-artifacts',
        'azure-synapse-accesscontrol',
        'azure-synapse',
        'azure-cognitiveservices-vision-nspkg',
        'azure-cognitiveservices-search-nspkg',
        'azure-cognitiveservices-nspkg',
        'azure-cognitiveservices-language-nspkg',
        'azure-cognitiveservices-knowledge-nspkg',
        'azure-containerregistry',
        'azure-communication-identity',
        'azure-communication-phonenumbers',
        'azure-communication-email',
        'azure-communication-rooms',
        'azure-communication-callautomation',
        'azure-confidentialledger',
        'azure-containerregistry',
        'azure-developer-loadtesting',
        'azure-iot-deviceupdate',
        'azure-messaging-webpubsubservice',
        'azure-monitor',
        'azure-monitor-query',
        'azure-monitor-ingestion',
        'azure-mgmt-appcontainers',
        'azure-mgmt-apimanagement',
        'azure-mgmt-web',
        'azure-mgmt-redis',
        'azure-mgmt-redisenterprise',
        'azure-mgmt-logic',
        'azure-appconfiguration',
        'azure-appconfiguration-provider',
        'azure-mgmt-appconfiguration',
        'azure-mgmt-dashboard',
        'azure-mgmt-signalr',
        'azure-messaging-webpubsubservice',
        'azure-mgmt-webpubsub',
        'azure-mgmt-securitydevops',
        'azure-mgmt-labservices',
        'azure-ai-metricsadvisor',
        'azure-servicebus',
        'azureml-sdk',
        'azure-keyvault-nspkg',
        'azure-keyvault-secrets',
        'azure-keyvault-keys',
        'azure-keyvault-certificates',
        'azure-keyvault-administration',
        'azure-digitaltwins-nspkg',
        'azure-digitaltwins-core',
        'azure-cognitiveservices-anomalydetector',
        'azure-ai-anomalydetector',
        'azure-applicationinsights',
        'azure-core-tracing-opentelemetry',
        'azure-core-tracing-opencensus',
        'azure-nspkg',
        'azure-common',
        'azure-eventgrid',
        'azure-storage-file-datalake',
        'azure-search-nspkg',
        'azure-search-documents',
        'azure-storage-nspkg',
        'azure-storage-file',
        'azure-storage-common',
        'azure-storage-queue',
        'azure-storage-file-share',
        'azure-storage-blob-changefeed',
        'azure-storage-blob',
        'azure-cognitiveservices-formrecognizer',
        'azure-ai-formrecognizer',
        'azure-ai-nspkg',
        'azure-cognitiveservices-language-textanalytics',
        'azure-ai-textanalytics',
        'azure-schemaregistry-avroencoder',
        'azure-schemaregistry-avroserializer',
        'azure-schemaregistry',
        'azure-eventhub-checkpointstoreblob-aio',
        'azure-eventhub-checkpointstoreblob',
        'azure-eventhub',
        'azure-servicefabric',
        'azure-communication-nspkg',
        'azure-communication-sms',
        'azure-communication-chat',
        'azure-communication-administration',
        'azure-security-attestation',
        'azure-data-nspkg',
        'azure-data-tables',
        'azure-devtools',
        'azure-elasticluster',
        'azure-functions',
        'azure-graphrbac',
        'azure-iothub-device-client',
        'azure-shell',
        'azure-translator',
        'azure-mgmt-hybridkubernetes',
        'azure-mgmt-kubernetesconfiguration',
        'adal',
        'pydocumentdb',
        'botbuilder-core',
        'botbuilder-schema',
        'botframework-connector',
        'playwright',
        'transformers',
        'langchain',
        'llama-index',
        'guidance',
        'openai',
        'semantic-kernel',
        'sentence-transformers'
    ];
    const GoModulesToLookFor = [
        'github.com/Azure/azure-sdk-for-go/sdk/storage/azblob',
        'github.com/Azure/azure-sdk-for-go/sdk/storage/azfile',
        'github.com/Azure/azure-sdk-for-go/sdk/storage/azqueue',
        'github.com/Azure/azure-sdk-for-go/sdk/storage/azdatalake',
        'github.com/Azure/azure-sdk-for-go/sdk/tracing/azotel',
        'github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azadmin',
        'github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azcertificates',
        'github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azkeys',
        'github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azsecrets',
        'github.com/Azure/azure-sdk-for-go/sdk/monitor/azquery',
        'github.com/Azure/azure-sdk-for-go/sdk/monitor/azingest',
        'github.com/Azure/azure-sdk-for-go/sdk/messaging/azeventhubs',
        'github.com/Azure/azure-sdk-for-go/sdk/messaging/azservicebus',
        'github.com/Azure/azure-sdk-for-go/sdk/data/azappconfig',
        'github.com/Azure/azure-sdk-for-go/sdk/data/azcosmos',
        'github.com/Azure/azure-sdk-for-go/sdk/data/aztables',
        'github.com/Azure/azure-sdk-for-go/sdk/containers/azcontainerregistry',
        'github.com/Azure/azure-sdk-for-go/sdk/ai/azopenai',
        'github.com/Azure/azure-sdk-for-go/sdk/azidentity',
        'github.com/Azure/azure-sdk-for-go/sdk/azcore',
        'github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/'
    ];
    let WorkspaceTagsService = class WorkspaceTagsService {
        constructor(fileService, contextService, environmentService, textFileService) {
            this.fileService = fileService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.textFileService = textFileService;
        }
        async getTags() {
            if (!this._tags) {
                this._tags = await this.resolveWorkspaceTags();
            }
            return this._tags;
        }
        async getTelemetryWorkspaceId(workspace, state) {
            function createHash(uri) {
                return (0, hash_1.sha1Hex)(uri.scheme === network_1.Schemas.file ? uri.fsPath : uri.toString());
            }
            let workspaceId;
            switch (state) {
                case 1 /* WorkbenchState.EMPTY */:
                    workspaceId = undefined;
                    break;
                case 2 /* WorkbenchState.FOLDER */:
                    workspaceId = await createHash(workspace.folders[0].uri);
                    break;
                case 3 /* WorkbenchState.WORKSPACE */:
                    if (workspace.configuration) {
                        workspaceId = await createHash(workspace.configuration);
                    }
            }
            return workspaceId;
        }
        getHashedRemotesFromUri(workspaceUri, stripEndingDotGit = false) {
            const path = workspaceUri.path;
            const uri = workspaceUri.with({ path: `${path !== '/' ? path : ''}/.git/config` });
            return this.fileService.exists(uri).then(exists => {
                if (!exists) {
                    return [];
                }
                return this.textFileService.read(uri, { acceptTextOnly: true }).then(content => (0, workspaceTags_2.getHashedRemotesFromConfig)(content.value, stripEndingDotGit), err => [] // ignore missing or binary file
                );
            });
        }
        /* __GDPR__FRAGMENT__
            "WorkspaceTags" : {
                "workbench.filesToOpenOrCreate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workbench.filesToDiff" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workbench.filesToMerge" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "workspace.roots" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.empty" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.grunt" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gulp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.jake" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.tsconfig" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.jsconfig" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.config.xml" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.vsc.extension" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.asp<NUMBER>" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.sln" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.unity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.express" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.sails" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.koa" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.hapi" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.socket.io" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.restify" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.next" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.nuxt" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@nestjs/core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.strapi" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.gatsby" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.rnpm-plugin-windows" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.react" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@angular/core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.vue" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.aws-sdk" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.aws-amplify-sdk" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/ai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/cosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/event" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/identity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/keyvault" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/search" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.azure-storage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@google-cloud/common" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.firebase" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.heroku-cli" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@microsoft/teams-js" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@microsoft/office-js" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@microsoft/office-js-helpers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@types/office-js" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@types/office-runtime" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.office-ui-fabric-react" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@uifabric/icons" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@uifabric/merge-styles" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@uifabric/styling" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@uifabric/experiments" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@uifabric/utilities" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@microsoft/rush" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.lerna" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.just-task" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.beachball" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.electron" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.playwright" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.playwright-cli" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@playwright/test" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.playwright-core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.playwright-chromium" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.playwright-firefox" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.playwright-webkit" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.cypress" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.chroma" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.faiss" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.langchain" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.milvus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.pinecone" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.qdrant" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.nightwatch" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.protractor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.puppeteer" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.selenium-webdriver" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.webdriverio" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.gherkin" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/app-configuration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/cosmos-sign" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/cosmos-language-service" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/synapse-spark" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/synapse-monitoring" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/synapse-managed-private-endpoints" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/synapse-artifacts" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/synapse-access-control" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/ai-metrics-advisor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/service-bus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/keyvault-secrets" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/keyvault-keys" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/keyvault-certificates" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/keyvault-admin" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/digital-twins-core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/cognitiveservices-anomalydetector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/ai-anomaly-detector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-xml" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-tracing" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-paging" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-https" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-client" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-asynciterator-polyfill" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-arm" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/amqp-common" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-lro" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/logger" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-http" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-auth" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/core-amqp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/abort-controller" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/eventgrid" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-file-datalake" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/search-documents" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-file" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-datalake" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-queue" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-file-share" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-blob-changefeed" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/storage-blob" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/cognitiveservices-formrecognizer" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/ai-form-recognizer" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/cognitiveservices-textanalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/ai-text-analytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/event-processor-host" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/schema-registry-avro" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/schema-registry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/eventhubs-checkpointstore-blob" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/event-hubs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/communication-signaling" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/communication-calling" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/communication-sms" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/communication-common" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/communication-chat" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/communication-administration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/attestation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/data-tables" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure-rest/arm-appservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-appservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-appcontainers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-rediscache" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-redisenterprisecache" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-apimanagement" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-logic" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/app-configuration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-dashboard" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-signalr" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-securitydevops" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-labservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/web-pubsub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/web-pubsub-client" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/web-pubsub-client-protobuf" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/web-pubsub-express" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-hybridkubernetes" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.@azure/arm-kubernetesconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.react-native-macos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.npm.react-native-windows" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.bower" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.yeoman.code.ext" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.cordova.high" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.cordova.low" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.xamarin.android" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.xamarin.ios" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.android.cpp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.reactNative" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.ionic" : { "classification" : "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": "true" },
                "workspace.nativeScript" : { "classification" : "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": "true" },
                "workspace.java.pom" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.java.gradle" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.java.android" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.javaee" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.jdbc" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.jpa" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.lombok" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.mockito" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.redis" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.springboot" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.sql" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.unittest" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure-cosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure-storage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure-servicebus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure-eventhubs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure-openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.azure-functions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.quarkus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.microprofile" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.micronaut" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.gradle.graalvm" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.javaee" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.jdbc" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.jpa" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.lombok" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.mockito" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.redis" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.springboot" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.sql" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.unittest" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure-cosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure-storage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure-servicebus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure-eventhubs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure-openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.azure-functions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.quarkus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.microprofile" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.micronaut" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.pom.graalvm" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.requirements" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.requirements.star" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.Pipfile" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.conda" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.setup": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.pyproject": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.manage": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.setupcfg": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.app": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.any-azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.pulumi-azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-language-conversations" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-language-questionanswering" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-ml" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-translation-document" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-devtools" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-elasticluster" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-event" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-eventgrid" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-functions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-graphrbac" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-identity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-iothub-device-client" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-loganalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ml" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-monitor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-appcontainers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-redis" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-redisenterprise" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-apimanagement" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-logic" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-appconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-appconfiguration-provider" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-appconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-dashboard" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-appconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-signalr" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-messaging-webpubsubservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-webpubsub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-securitydevops" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-labservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-web" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-search" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-servicebus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-servicefabric" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-shell" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-translator" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-hybridkubernetes" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-mgmt-kubernetesconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.adal" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.pydocumentdb" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.botbuilder-core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.botbuilder-schema" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.botframework-connector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.playwright" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-synapse-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-synapse-spark" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-synapse-artifacts" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-synapse-accesscontrol" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-synapse" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-vision-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-search-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-language-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-knowledge-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-containerregistry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-metricsadvisor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azureml-sdk" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault-secrets" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault-keys" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault-certificates" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-keyvault-administration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-digitaltwins-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-digitaltwins-core" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-anomalydetector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-anomalydetector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-applicationinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-core-tracing-opentelemetry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-core-tracing-opencensus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-common" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-eventgrid" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-file-datalake" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-search-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-search-documents" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-file" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-common" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-queue" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-file-share" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-blob-changefeed" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-storage-blob" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-formrecognizer" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-formrecognizer" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-cognitiveservices-language-textanalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-ai-textanalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-schemaregistry-avroserializer" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-schemaregistry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-eventhub-checkpointstoreblob-aio" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-eventhub-checkpointstoreblob" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-eventhub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-sms" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-chat" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-administration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-security-attestation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-appconfiguration-provider" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-identity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-phonenumbers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-email" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-rooms" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-communication-callautomation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-confidentialledger" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-iot-deviceupdate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-developer-loadtesting" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-monitor-query" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-monitor-ingestion" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-schemaregistry-avroencoder" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-messaging-webpubsubservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-data-nspkg" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.azure-data-tables" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.transformers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.langchain" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.llama-index" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.guidance" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.openai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.semantic-kernel" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.py.sentence-transformers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/storage/azblob" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/storage/azfile" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/storage/azqueue" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/storage/azdatalake" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/tracing/azotel" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azadmin" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azcertificates" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azkeys" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/security/keyvault/azsecrets" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/monitor/azquery" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/monitor/azingest" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/messaging/azeventhubs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/messaging/azservicebus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/data/azappconfig" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/data/azcosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/data/aztables" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/containers/azcontainerregistry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/ai/azopenai" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/azidentity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/azcore" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/iotfirmwaredefense/armiotfirmwaredefense" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/aad/armaad" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/addons/armaddons" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/advisor/armadvisor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/agrifood/armagrifood" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/alertsmanagement/armalertsmanagement" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/analysisservices/armanalysisservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/apimanagement/armapimanagement" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/appcomplianceautomation/armappcomplianceautomation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/appconfiguration/armappconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/appplatform/armappplatform" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/appservice/armappservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/applicationinsights/armapplicationinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/azurearcdata/armazurearcdata" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/attestation/armattestation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/authorization/armauthorization" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/automanage/armautomanage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/automation/armautomation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/azuredata/armazuredata" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/azurestackhci/armazurestackhci" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/avs/armavs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/recoveryservices/armrecoveryservicesbackup" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/baremetalinfrastructure/armbaremetalinfrastructure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/batch/armbatch" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/billing/armbilling" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/billingbenefits/armbillingbenefits" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/blockchain/armblockchain" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/blueprint/armblueprint" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/botservice/armbotservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/changeanalysis/armchangeanalysis" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armchanges" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/chaos/armchaos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/search/armsearch" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/cognitiveservices/armcognitiveservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/commerce/armcommerce" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/communication/armcommunication" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/confidentialledger/armconfidentialledger" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/confluent/armconfluent" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/connectedvmware/armconnectedvmware" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/consumption/armconsumption" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/appcontainers/armappcontainers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerinstance/armcontainerinstance" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerregistry/armcontainerregistry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerservice/armcontainerservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerservicefleet/armcontainerservicefleet" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/cdn/armcdn" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/cosmos/armcosmos" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/cosmosforpostgresql/armcosmosforpostgresql" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/costmanagement/armcostmanagement" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/customproviders/armcustomproviders" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/customerinsights/armcustomerinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/customerlockbox/armcustomerlockbox" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/databox/armdatabox" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/databoxedge/armdataboxedge" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datacatalog/armdatacatalog" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datafactory/armdatafactory" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datalake-analytics/armdatalakeanalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datalake-store/armdatalakestore" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datamigration/armdatamigration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/dataprotection/armdataprotection" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datashare/armdatashare" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/databricks/armdatabricks" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/datadog/armdatadog" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/delegatednetwork/armdelegatednetwork" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/deploymentmanager/armdeploymentmanager" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armdeploymentscripts" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/desktopvirtualization/armdesktopvirtualization" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/devcenter/armdevcenter" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/devhub/armdevhub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/deviceprovisioningservices/armdeviceprovisioningservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/deviceupdate/armdeviceupdate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/devops/armdevops" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/devtestlabs/armdevtestlabs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/digitaltwins/armdigitaltwins" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/dns/armdns" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/dnsresolver/armdnsresolver" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/domainservices/armdomainservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/dynatrace/armdynatrace" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/edgeorder/armedgeorder" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/edgeorderpartner/armedgeorderpartner" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/education/armeducation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/elastic/armelastic" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/elasticsan/armelasticsan" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/elasticsans/armelasticsans" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/engagementfabric/armengagementfabric" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/eventgrid/armeventgrid" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/eventhub/armeventhub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/extendedlocation/armextendedlocation" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armfeatures" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/fluidrelay/armfluidrelay" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/frontdoor/armfrontdoor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/graphservices/armgraphservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/guestconfiguration/armguestconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hanaonazure/armhanaonazure" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hardwaresecuritymodules/armhardwaresecuritymodules" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hdinsight/armhdinsight" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/healthbot/armhealthbot" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/healthcareapis/armhealthcareapis" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hybridcompute/armhybridcompute" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hybridconnectivity/armhybridconnectivity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hybridcontainerservice/armhybridcontainerservice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hybriddatamanager/armhybriddatamanager" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hybridkubernetes/armhybridkubernetes" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/hybridnetwork/armhybridnetwork" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/iotcentral/armiotcentral" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/iothub/armiothub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/iotsecurity/armiotsecurity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/keyvault/armkeyvault" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/kubernetesconfiguration/armkubernetesconfiguration" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/kusto/armkusto" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/labservices/armlabservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armlinks" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/loadtesting/armloadtesting" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armlocks" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/operationalinsights/armoperationalinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/logic/armlogic" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/logz/armlogz" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/m365securityandcompliance/armm365securityandcompliance" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/machinelearning/armmachinelearning" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/machinelearningservices/armmachinelearningservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/maintenance/armmaintenance" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armmanagedapplications" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/solutions/armmanagedapplications" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/dashboard/armdashboard" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/managednetwork/armmanagednetwork" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/managednetworkfabric/armmanagednetworkfabric" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/msi/armmsi" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/managedservices/armmanagedservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/managementgroups/armmanagementgroups" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/managementpartner/armmanagementpartner" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/maps/armmaps" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/mariadb/armmariadb" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/marketplace/armmarketplace" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/marketplaceordering/armmarketplaceordering" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/mediaservices/armmediaservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/migrate/armmigrate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/mixedreality/armmixedreality" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/mobilenetwork/armmobilenetwork" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/monitor/armmonitor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/mysql/armmysql" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/mysql/armmysqlflexibleservers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/netapp/armnetapp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/network/armnetwork" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/networkcloud/armnetworkcloud" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/networkfunction/armnetworkfunction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/newrelic/armnewrelicobservability" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/nginx/armnginx" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/notificationhubs/armnotificationhubs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/oep/armoep" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/operationsmanagement/armoperationsmanagement" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/orbital/armorbital" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/paloaltonetworksngfw/armpanngfw" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/peering/armpeering" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armpolicy" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/policyinsights/armpolicyinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/portal/armportal" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/postgresql/armpostgresql" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/postgresql/armpostgresqlflexibleservers" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/postgresqlhsc/armpostgresqlhsc" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/powerbiprivatelinks/armpowerbiprivatelinks" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/powerbidedicated/armpowerbidedicated" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/powerbiembedded/armpowerbiembedded" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/powerplatform/armpowerplatform" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/privatedns/armprivatedns" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/providerhub/armproviderhub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/purview/armpurview" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/quantum/armquantum" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/liftrqumulo/armqumulo" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/quota/armquota" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/recoveryservices/armrecoveryservices" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/redhatopenshift/armredhatopenshift" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/redis/armredis" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/redisenterprise/armredisenterprise" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/relay/armrelay" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/reservations/armreservations" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resourceconnector/armresourceconnector" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resourcegraph/armresourcegraph" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resourcehealth/armresourcehealth" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resourcemover/armresourcemover" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armresources" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/saas/armsaas" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/scheduler/armscheduler" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/scvmm/armscvmm" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/security/armsecurity" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/securitydevops/armsecuritydevops" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/securityinsight/armsecurityinsight" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/securityinsights/armsecurityinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/selfhelp/armselfhelp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/serialconsole/armserialconsole" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/servicebus/armservicebus" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/servicefabric/armservicefabric" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/servicefabricmesh/armservicefabricmesh" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/servicelinker/armservicelinker" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/servicenetworking/armservicenetworking" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/signalr/armsignalr" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/recoveryservices/armrecoveryservicessiterecovery" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/sphere/armsphere" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/sql/armsql" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/sqlvirtualmachine/armsqlvirtualmachine" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storage/armstorage" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storagecache/armstoragecache" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storageimportexport/armstorageimportexport" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storagemover/armstoragemover" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storagepool/armstoragepool" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storagesync/armstoragesync" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storsimple1200series/armstorsimple1200series" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storsimple8000series/armstorsimple8000series" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/streamanalytics/armstreamanalytics" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armsubscriptions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/subscription/armsubscription" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/support/armsupport" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/synapse/armsynapse" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armtemplatespecs" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/testbase/armtestbase" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/timeseriesinsights/armtimeseriesinsights" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/trafficmanager/armtrafficmanager" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/web/armweb" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/webpubsub/armwebpubsub" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/windowsesu/armwindowsesu" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/windowsiot/armwindowsiot" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/workloadmonitor/armworkloadmonitor" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "workspace.go.mod.github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/workloads/armworkloads" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            }
        */
        async resolveWorkspaceTags() {
            const tags = Object.create(null);
            const state = this.contextService.getWorkbenchState();
            const workspace = this.contextService.getWorkspace();
            tags['workspace.id'] = await this.getTelemetryWorkspaceId(workspace, state);
            const { filesToOpenOrCreate, filesToDiff, filesToMerge } = this.environmentService;
            tags['workbench.filesToOpenOrCreate'] = filesToOpenOrCreate && filesToOpenOrCreate.length || 0;
            tags['workbench.filesToDiff'] = filesToDiff && filesToDiff.length || 0;
            tags['workbench.filesToMerge'] = filesToMerge && filesToMerge.length || 0;
            const isEmpty = state === 1 /* WorkbenchState.EMPTY */;
            tags['workspace.roots'] = isEmpty ? 0 : workspace.folders.length;
            tags['workspace.empty'] = isEmpty;
            const folders = !isEmpty ? workspace.folders.map(folder => folder.uri) : undefined;
            if (!folders || !folders.length) {
                return Promise.resolve(tags);
            }
            const aiGeneratedWorkspaces = uri_1.URI.joinPath(this.environmentService.workspaceStorageHome, 'aiGeneratedWorkspaces.json');
            await this.fileService.exists(aiGeneratedWorkspaces).then(async (result) => {
                if (result) {
                    try {
                        const content = await this.fileService.readFile(aiGeneratedWorkspaces);
                        const workspaces = JSON.parse(content.value.toString());
                        if (workspaces.indexOf(workspace.folders[0].uri.toString()) > -1) {
                            tags['aiGenerated'] = true;
                        }
                    }
                    catch (e) {
                        // Ignore errors when resolving file contents
                    }
                }
            });
            return this.fileService.resolveAll(folders.map(resource => ({ resource }))).then((files) => {
                const names = [].concat(...files.map(result => result.success ? (result.stat.children || []) : [])).map(c => c.name);
                const nameSet = names.reduce((s, n) => s.add(n.toLowerCase()), new Set());
                tags['workspace.grunt'] = nameSet.has('gruntfile.js');
                tags['workspace.gulp'] = nameSet.has('gulpfile.js');
                tags['workspace.jake'] = nameSet.has('jakefile.js');
                tags['workspace.tsconfig'] = nameSet.has('tsconfig.json');
                tags['workspace.jsconfig'] = nameSet.has('jsconfig.json');
                tags['workspace.config.xml'] = nameSet.has('config.xml');
                tags['workspace.vsc.extension'] = nameSet.has('vsc-extension-quickstart.md');
                tags['workspace.ASP5'] = nameSet.has('project.json') && this.searchArray(names, /^.+\.cs$/i);
                tags['workspace.sln'] = this.searchArray(names, /^.+\.sln$|^.+\.csproj$/i);
                tags['workspace.unity'] = nameSet.has('assets') && nameSet.has('library') && nameSet.has('projectsettings');
                tags['workspace.npm'] = nameSet.has('package.json') || nameSet.has('node_modules');
                tags['workspace.bower'] = nameSet.has('bower.json') || nameSet.has('bower_components');
                tags['workspace.java.pom'] = nameSet.has('pom.xml');
                tags['workspace.java.gradle'] = nameSet.has('build.gradle') || nameSet.has('settings.gradle') || nameSet.has('build.gradle.kts') || nameSet.has('settings.gradle.kts') || nameSet.has('gradlew') || nameSet.has('gradlew.bat');
                tags['workspace.yeoman.code.ext'] = nameSet.has('vsc-extension-quickstart.md');
                tags['workspace.py.requirements'] = nameSet.has('requirements.txt');
                tags['workspace.py.requirements.star'] = this.searchArray(names, /^(.*)requirements(.*)\.txt$/i);
                tags['workspace.py.Pipfile'] = nameSet.has('pipfile');
                tags['workspace.py.conda'] = this.searchArray(names, /^environment(\.yml$|\.yaml$)/i);
                tags['workspace.py.setup'] = nameSet.has('setup.py');
                tags['workspace.py.manage'] = nameSet.has('manage.py');
                tags['workspace.py.setupcfg'] = nameSet.has('setup.cfg');
                tags['workspace.py.app'] = nameSet.has('app.py');
                tags['workspace.py.pyproject'] = nameSet.has('pyproject.toml');
                tags['workspace.go.mod'] = nameSet.has('go.mod');
                const mainActivity = nameSet.has('mainactivity.cs') || nameSet.has('mainactivity.fs');
                const appDelegate = nameSet.has('appdelegate.cs') || nameSet.has('appdelegate.fs');
                const androidManifest = nameSet.has('androidmanifest.xml');
                const platforms = nameSet.has('platforms');
                const plugins = nameSet.has('plugins');
                const www = nameSet.has('www');
                const properties = nameSet.has('properties');
                const resources = nameSet.has('resources');
                const jni = nameSet.has('jni');
                if (tags['workspace.config.xml'] &&
                    !tags['workspace.language.cs'] && !tags['workspace.language.vb'] && !tags['workspace.language.aspx']) {
                    if (platforms && plugins && www) {
                        tags['workspace.cordova.high'] = true;
                    }
                    else {
                        tags['workspace.cordova.low'] = true;
                    }
                }
                if (tags['workspace.config.xml'] &&
                    !tags['workspace.language.cs'] && !tags['workspace.language.vb'] && !tags['workspace.language.aspx']) {
                    if (nameSet.has('ionic.config.json')) {
                        tags['workspace.ionic'] = true;
                    }
                }
                if (mainActivity && properties && resources) {
                    tags['workspace.xamarin.android'] = true;
                }
                if (appDelegate && resources) {
                    tags['workspace.xamarin.ios'] = true;
                }
                if (androidManifest && jni) {
                    tags['workspace.android.cpp'] = true;
                }
                function getFilePromises(filename, fileService, textFileService, contentHandler) {
                    return !nameSet.has(filename) ? [] : folders.map(workspaceUri => {
                        const uri = workspaceUri.with({ path: `${workspaceUri.path !== '/' ? workspaceUri.path : ''}/${filename}` });
                        return fileService.exists(uri).then(exists => {
                            if (!exists) {
                                return undefined;
                            }
                            return textFileService.read(uri, { acceptTextOnly: true }).then(contentHandler);
                        }, err => {
                            // Ignore missing file
                        });
                    });
                }
                function addPythonTags(packageName) {
                    if (PyModulesToLookFor.indexOf(packageName) > -1) {
                        tags['workspace.py.' + packageName] = true;
                    }
                    for (const metaModule of PyMetaModulesToLookFor) {
                        if (packageName.startsWith(metaModule)) {
                            tags['workspace.py.' + metaModule] = true;
                        }
                    }
                    if (!tags['workspace.py.any-azure']) {
                        tags['workspace.py.any-azure'] = /azure/i.test(packageName);
                    }
                }
                const requirementsTxtPromises = getFilePromises('requirements.txt', this.fileService, this.textFileService, content => {
                    const dependencies = (0, strings_1.splitLines)(content.value);
                    for (const dependency of dependencies) {
                        // Dependencies in requirements.txt can have 3 formats: `foo==3.1, foo>=3.1, foo`
                        const format1 = dependency.split('==');
                        const format2 = dependency.split('>=');
                        const packageName = (format1.length === 2 ? format1[0] : format2[0]).trim();
                        addPythonTags(packageName);
                    }
                });
                const pipfilePromises = getFilePromises('pipfile', this.fileService, this.textFileService, content => {
                    let dependencies = (0, strings_1.splitLines)(content.value);
                    // We're only interested in the '[packages]' section of the Pipfile
                    dependencies = dependencies.slice(dependencies.indexOf('[packages]') + 1);
                    for (const dependency of dependencies) {
                        if (dependency.trim().indexOf('[') > -1) {
                            break;
                        }
                        // All dependencies in Pipfiles follow the format: `<package> = <version, or git repo, or something else>`
                        if (dependency.indexOf('=') === -1) {
                            continue;
                        }
                        const packageName = dependency.split('=')[0].trim();
                        addPythonTags(packageName);
                    }
                });
                const packageJsonPromises = getFilePromises('package.json', this.fileService, this.textFileService, content => {
                    try {
                        const packageJsonContents = JSON.parse(content.value);
                        const dependencies = Object.keys(packageJsonContents['dependencies'] || {}).concat(Object.keys(packageJsonContents['devDependencies'] || {}));
                        for (const dependency of dependencies) {
                            if (dependency.startsWith('react-native')) {
                                tags['workspace.reactNative'] = true;
                            }
                            else if ('tns-core-modules' === dependency || '@nativescript/core' === dependency) {
                                tags['workspace.nativescript'] = true;
                            }
                            else if (ModulesToLookFor.indexOf(dependency) > -1) {
                                tags['workspace.npm.' + dependency] = true;
                            }
                            else {
                                for (const metaModule of MetaModulesToLookFor) {
                                    if (dependency.startsWith(metaModule)) {
                                        tags['workspace.npm.' + metaModule] = true;
                                    }
                                }
                            }
                        }
                    }
                    catch (e) {
                        // Ignore errors when resolving file or parsing file contents
                    }
                });
                const goModPromises = getFilePromises('go.mod', this.fileService, this.textFileService, content => {
                    try {
                        const lines = (0, strings_1.splitLines)(content.value);
                        let firstRequireBlockFound = false;
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (line.startsWith('require (')) {
                                if (!firstRequireBlockFound) {
                                    firstRequireBlockFound = true;
                                    continue;
                                }
                                else {
                                    break;
                                }
                            }
                            if (line.startsWith(')')) {
                                break;
                            }
                            if (firstRequireBlockFound && line !== '') {
                                const packageName = line.split(' ')[0].trim();
                                for (const module of GoModulesToLookFor) {
                                    if (packageName.startsWith(module)) {
                                        tags['workspace.go.mod.' + packageName] = true;
                                    }
                                }
                            }
                        }
                    }
                    catch (e) {
                        // Ignore errors when resolving file or parsing file contents
                    }
                });
                const pomPromises = getFilePromises('pom.xml', this.fileService, this.textFileService, content => {
                    try {
                        let dependenciesContent;
                        while (dependenciesContent = javaWorkspaceTags_1.MavenDependenciesRegex.exec(content.value)) {
                            let dependencyContent;
                            while (dependencyContent = javaWorkspaceTags_1.MavenDependencyRegex.exec(dependenciesContent[1])) {
                                const groupIdContent = javaWorkspaceTags_1.MavenGroupIdRegex.exec(dependencyContent[1]);
                                const artifactIdContent = javaWorkspaceTags_1.MavenArtifactIdRegex.exec(dependencyContent[1]);
                                if (groupIdContent && artifactIdContent) {
                                    this.tagJavaDependency(groupIdContent[1], artifactIdContent[1], 'workspace.pom.', tags);
                                }
                            }
                        }
                    }
                    catch (e) {
                        // Ignore errors when resolving maven dependencies
                    }
                });
                const gradlePromises = getFilePromises('build.gradle', this.fileService, this.textFileService, content => {
                    try {
                        this.processGradleDependencies(content.value, javaWorkspaceTags_1.GradleDependencyLooseRegex, tags);
                        this.processGradleDependencies(content.value, javaWorkspaceTags_1.GradleDependencyCompactRegex, tags);
                    }
                    catch (e) {
                        // Ignore errors when resolving gradle dependencies
                    }
                });
                const androidPromises = folders.map(workspaceUri => {
                    const manifest = uri_1.URI.joinPath(workspaceUri, '/app/src/main/AndroidManifest.xml');
                    return this.fileService.exists(manifest).then(result => {
                        if (result) {
                            tags['workspace.java.android'] = true;
                        }
                    }, err => {
                        // Ignore errors when resolving android
                    });
                });
                return Promise.all([...packageJsonPromises, ...requirementsTxtPromises, ...pipfilePromises, ...pomPromises, ...gradlePromises, ...androidPromises, ...goModPromises]).then(() => tags);
            });
        }
        processGradleDependencies(content, regex, tags) {
            let dependencyContent;
            while (dependencyContent = regex.exec(content)) {
                const groupId = dependencyContent[1];
                const artifactId = dependencyContent[2];
                if (groupId && artifactId) {
                    this.tagJavaDependency(groupId, artifactId, 'workspace.gradle.', tags);
                }
            }
        }
        tagJavaDependency(groupId, artifactId, prefix, tags) {
            for (const javaLibrary of javaWorkspaceTags_1.JavaLibrariesToLookFor) {
                if (javaLibrary.predicate(groupId, artifactId)) {
                    tags[prefix + javaLibrary.tag] = true;
                    return;
                }
            }
        }
        searchArray(arr, regEx) {
            return arr.some(v => v.search(regEx) > -1) || undefined;
        }
    };
    exports.WorkspaceTagsService = WorkspaceTagsService;
    exports.WorkspaceTagsService = WorkspaceTagsService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, textfiles_1.ITextFileService)
    ], WorkspaceTagsService);
    (0, extensions_1.registerSingleton)(workspaceTags_1.IWorkspaceTagsService, WorkspaceTagsService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVGFnc1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3RhZ3MvZWxlY3Ryb24tc2FuZGJveC93b3Jrc3BhY2VUYWdzU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlaEcsTUFBTSxvQkFBb0IsR0FBRztRQUM1QixpQkFBaUI7UUFDakIsUUFBUTtRQUNSLFdBQVc7UUFDWCxhQUFhO1FBQ2IsZUFBZTtRQUNmLGNBQWM7UUFDZCxpQkFBaUI7UUFDakIsaUJBQWlCO1FBQ2pCLGVBQWU7UUFDZixnQkFBZ0I7S0FDaEIsQ0FBQztJQUVGLE1BQU0sZ0JBQWdCLEdBQUc7UUFDeEIsc0NBQXNDO1FBQ3RDLFNBQVM7UUFDVCxPQUFPO1FBQ1AsS0FBSztRQUNMLE1BQU07UUFDTixXQUFXO1FBQ1gsU0FBUztRQUNULE1BQU07UUFDTixNQUFNO1FBQ04sY0FBYztRQUNkLFFBQVE7UUFDUixRQUFRO1FBQ1IsZ0JBQWdCO1FBQ2hCLE9BQU87UUFDUCxjQUFjO1FBQ2Qsb0JBQW9CO1FBQ3BCLHNCQUFzQjtRQUN0QixxQkFBcUI7UUFDckIsZUFBZTtRQUNmLFFBQVE7UUFDUixLQUFLO1FBQ0wsa0JBQWtCO1FBQ2xCLG9CQUFvQjtRQUNwQixVQUFVO1FBQ1YsNkJBQTZCO1FBQzdCLFNBQVM7UUFDVCxhQUFhO1FBQ2IsT0FBTztRQUNQLGVBQWU7UUFDZixRQUFRO1FBQ1IsT0FBTztRQUNQLFVBQVU7UUFDVixzQkFBc0I7UUFDdEIsWUFBWTtRQUNaLFdBQVc7UUFDWCxRQUFRO1FBQ1IsUUFBUTtRQUNSLFVBQVU7UUFDVixRQUFRO1FBQ1IsaUNBQWlDO1FBQ2pDLHFCQUFxQjtRQUNyQixzQkFBc0I7UUFDdEIsOEJBQThCO1FBQzlCLGtCQUFrQjtRQUNsQix1QkFBdUI7UUFDdkIsd0JBQXdCO1FBQ3hCLGlCQUFpQjtRQUNqQix3QkFBd0I7UUFDeEIsbUJBQW1CO1FBQ25CLHVCQUF1QjtRQUN2QixxQkFBcUI7UUFDckIsaUJBQWlCO1FBQ2pCLE9BQU87UUFDUCxXQUFXO1FBQ1gsV0FBVztRQUNYLHNCQUFzQjtRQUN0QixZQUFZO1FBQ1osZ0JBQWdCO1FBQ2hCLGtCQUFrQjtRQUNsQixpQkFBaUI7UUFDakIscUJBQXFCO1FBQ3JCLG9CQUFvQjtRQUNwQixtQkFBbUI7UUFDbkIsNkNBQTZDO1FBQzdDLFNBQVM7UUFDVCxZQUFZO1FBQ1osWUFBWTtRQUNaLFdBQVc7UUFDWCxvQkFBb0I7UUFDcEIsYUFBYTtRQUNiLFNBQVM7UUFDVCxvQkFBb0I7UUFDcEIsMEJBQTBCO1FBQzFCLG9CQUFvQjtRQUNwQixnQ0FBZ0M7UUFDaEMsc0JBQXNCO1FBQ3RCLDJCQUEyQjtRQUMzQiwwQ0FBMEM7UUFDMUMsMEJBQTBCO1FBQzFCLCtCQUErQjtRQUMvQiwyQkFBMkI7UUFDM0Isb0JBQW9CO1FBQ3BCLHlCQUF5QjtRQUN6QixzQkFBc0I7UUFDdEIsOEJBQThCO1FBQzlCLHVCQUF1QjtRQUN2QiwyQkFBMkI7UUFDM0IsMENBQTBDO1FBQzFDLDRCQUE0QjtRQUM1QixpQkFBaUI7UUFDakIscUJBQXFCO1FBQ3JCLG9CQUFvQjtRQUNwQixtQkFBbUI7UUFDbkIsb0JBQW9CO1FBQ3BCLG9DQUFvQztRQUNwQyxpQkFBaUI7UUFDakIsb0JBQW9CO1FBQ3BCLGlCQUFpQjtRQUNqQixlQUFlO1FBQ2Ysa0JBQWtCO1FBQ2xCLGtCQUFrQjtRQUNsQixrQkFBa0I7UUFDbEIseUJBQXlCO1FBQ3pCLGtCQUFrQjtRQUNsQiw4QkFBOEI7UUFDOUIseUJBQXlCO1FBQ3pCLHFCQUFxQjtRQUNyQix5QkFBeUI7UUFDekIsc0JBQXNCO1FBQ3RCLDJCQUEyQjtRQUMzQixnQ0FBZ0M7UUFDaEMscUJBQXFCO1FBQ3JCLHlDQUF5QztRQUN6QywyQkFBMkI7UUFDM0Isd0NBQXdDO1FBQ3hDLDBCQUEwQjtRQUMxQiw2QkFBNkI7UUFDN0IsNkJBQTZCO1FBQzdCLHdCQUF3QjtRQUN4Qix1Q0FBdUM7UUFDdkMsbUJBQW1CO1FBQ25CLGdDQUFnQztRQUNoQyw4QkFBOEI7UUFDOUIsMEJBQTBCO1FBQzFCLDZCQUE2QjtRQUM3QiwyQkFBMkI7UUFDM0IscUNBQXFDO1FBQ3JDLG9CQUFvQjtRQUNwQixvQkFBb0I7UUFDcEIsdUJBQXVCO1FBQ3ZCLDRCQUE0QjtRQUM1QiwwQkFBMEI7UUFDMUIsdUJBQXVCO1FBQ3ZCLGlDQUFpQztRQUNqQywwQkFBMEI7UUFDMUIsa0JBQWtCO1FBQ2xCLDBCQUEwQjtRQUMxQiw2QkFBNkI7UUFDN0Isc0JBQXNCO1FBQ3RCLG9CQUFvQjtRQUNwQiwyQkFBMkI7UUFDM0Isd0JBQXdCO1FBQ3hCLG1CQUFtQjtRQUNuQiwwQkFBMEI7UUFDMUIsbUNBQW1DO1FBQ25DLDJCQUEyQjtRQUMzQixlQUFlO1FBQ2YsNkJBQTZCO1FBQzdCLG9DQUFvQztLQUNwQyxDQUFDO0lBRUYsTUFBTSxzQkFBc0IsR0FBRztRQUM5QixVQUFVO1FBQ1YseUJBQXlCO1FBQ3pCLFlBQVk7UUFDWixjQUFjO1FBQ2QsYUFBYTtRQUNiLGdCQUFnQjtRQUNoQixnQkFBZ0I7UUFDaEIsWUFBWTtRQUNaLFVBQVU7UUFDVixjQUFjO1FBQ2QsZUFBZTtLQUNmLENBQUM7SUFFRixNQUFNLGtCQUFrQixHQUFHO1FBQzFCLE9BQU87UUFDUCxpQ0FBaUM7UUFDakMscUNBQXFDO1FBQ3JDLGFBQWE7UUFDYiwrQkFBK0I7UUFDL0Isd0JBQXdCO1FBQ3hCLGlDQUFpQztRQUNqQyxvQkFBb0I7UUFDcEIscUJBQXFCO1FBQ3JCLHFCQUFxQjtRQUNyQix5QkFBeUI7UUFDekIsNkJBQTZCO1FBQzdCLGVBQWU7UUFDZixzQ0FBc0M7UUFDdEMsc0NBQXNDO1FBQ3RDLCtCQUErQjtRQUMvQix3Q0FBd0M7UUFDeEMseUNBQXlDO1FBQ3pDLHlCQUF5QjtRQUN6Qiw4QkFBOEI7UUFDOUIsa0NBQWtDO1FBQ2xDLDJCQUEyQjtRQUMzQiwyQkFBMkI7UUFDM0Isb0NBQW9DO1FBQ3BDLDBCQUEwQjtRQUMxQix5QkFBeUI7UUFDekIsNkJBQTZCO1FBQzdCLHdCQUF3QjtRQUN4QixrQ0FBa0M7UUFDbEMsZUFBZTtRQUNmLHFCQUFxQjtRQUNyQix5QkFBeUI7UUFDekIsMEJBQTBCO1FBQzFCLDBCQUEwQjtRQUMxQixnQkFBZ0I7UUFDaEIsa0JBQWtCO1FBQ2xCLDRCQUE0QjtRQUM1QixrQkFBa0I7UUFDbEIsd0JBQXdCO1FBQ3hCLGlDQUFpQztRQUNqQyw2QkFBNkI7UUFDN0Isc0JBQXNCO1FBQ3RCLG9CQUFvQjtRQUNwQixrQ0FBa0M7UUFDbEMsc0JBQXNCO1FBQ3RCLDJCQUEyQjtRQUMzQix3QkFBd0I7UUFDeEIseUJBQXlCO1FBQ3pCLGtCQUFrQjtRQUNsQixhQUFhO1FBQ2Isc0JBQXNCO1FBQ3RCLHdCQUF3QjtRQUN4QixxQkFBcUI7UUFDckIsNkJBQTZCO1FBQzdCLCtCQUErQjtRQUMvQiwwQkFBMEI7UUFDMUIseUJBQXlCO1FBQ3pCLHlDQUF5QztRQUN6QywwQkFBMEI7UUFDMUIsMkJBQTJCO1FBQzNCLGtDQUFrQztRQUNsQywrQkFBK0I7UUFDL0IsYUFBYTtRQUNiLGNBQWM7UUFDZCxpQkFBaUI7UUFDakIsNkJBQTZCO1FBQzdCLG9CQUFvQjtRQUNwQix3QkFBd0I7UUFDeEIscUJBQXFCO1FBQ3JCLG9CQUFvQjtRQUNwQixzQkFBc0I7UUFDdEIscUJBQXFCO1FBQ3JCLDBCQUEwQjtRQUMxQiwrQkFBK0I7UUFDL0Isb0JBQW9CO1FBQ3BCLHdDQUF3QztRQUN4Qyx5QkFBeUI7UUFDekIsZ0JBQWdCO1FBQ2hCLGdEQUFnRDtRQUNoRCx3QkFBd0I7UUFDeEIsa0NBQWtDO1FBQ2xDLHFDQUFxQztRQUNyQyxzQkFBc0I7UUFDdEIsd0NBQXdDO1FBQ3hDLG9DQUFvQztRQUNwQyxnQkFBZ0I7UUFDaEIscUJBQXFCO1FBQ3JCLDJCQUEyQjtRQUMzQix5QkFBeUI7UUFDekIsMEJBQTBCO1FBQzFCLG9DQUFvQztRQUNwQyw0QkFBNEI7UUFDNUIsa0JBQWtCO1FBQ2xCLG1CQUFtQjtRQUNuQixnQkFBZ0I7UUFDaEIscUJBQXFCO1FBQ3JCLGlCQUFpQjtRQUNqQixpQkFBaUI7UUFDakIsNEJBQTRCO1FBQzVCLGFBQWE7UUFDYixrQkFBa0I7UUFDbEIsNkJBQTZCO1FBQzdCLG9DQUFvQztRQUNwQyxNQUFNO1FBQ04sY0FBYztRQUNkLGlCQUFpQjtRQUNqQixtQkFBbUI7UUFDbkIsd0JBQXdCO1FBQ3hCLFlBQVk7UUFDWixjQUFjO1FBQ2QsV0FBVztRQUNYLGFBQWE7UUFDYixVQUFVO1FBQ1YsUUFBUTtRQUNSLGlCQUFpQjtRQUNqQix1QkFBdUI7S0FDdkIsQ0FBQztJQUVGLE1BQU0sa0JBQWtCLEdBQUc7UUFDMUIsc0RBQXNEO1FBQ3RELHNEQUFzRDtRQUN0RCx1REFBdUQ7UUFDdkQsMERBQTBEO1FBQzFELHNEQUFzRDtRQUN0RCxpRUFBaUU7UUFDakUsd0VBQXdFO1FBQ3hFLGdFQUFnRTtRQUNoRSxtRUFBbUU7UUFDbkUsdURBQXVEO1FBQ3ZELHdEQUF3RDtRQUN4RCw2REFBNkQ7UUFDN0QsOERBQThEO1FBQzlELHdEQUF3RDtRQUN4RCxxREFBcUQ7UUFDckQscURBQXFEO1FBQ3JELHNFQUFzRTtRQUN0RSxtREFBbUQ7UUFDbkQsa0RBQWtEO1FBQ2xELDhDQUE4QztRQUM5Qyx3REFBd0Q7S0FDeEQsQ0FBQztJQUdLLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQW9CO1FBSWhDLFlBQ2dDLFdBQXlCLEVBQ2IsY0FBd0MsRUFDcEMsa0JBQWdELEVBQzVELGVBQWlDO1lBSHJDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2IsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQ3BDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBOEI7WUFDNUQsb0JBQWUsR0FBZixlQUFlLENBQWtCO1FBQ2pFLENBQUM7UUFFTCxLQUFLLENBQUMsT0FBTztZQUNaLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUNoRCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ25CLENBQUM7UUFFRCxLQUFLLENBQUMsdUJBQXVCLENBQUMsU0FBcUIsRUFBRSxLQUFxQjtZQUN6RSxTQUFTLFVBQVUsQ0FBQyxHQUFRO2dCQUMzQixPQUFPLElBQUEsY0FBTyxFQUFDLEdBQUcsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzNFLENBQUM7WUFFRCxJQUFJLFdBQStCLENBQUM7WUFDcEMsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZjtvQkFDQyxXQUFXLEdBQUcsU0FBUyxDQUFDO29CQUN4QixNQUFNO2dCQUNQO29CQUNDLFdBQVcsR0FBRyxNQUFNLFVBQVUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUN6RCxNQUFNO2dCQUNQO29CQUNDLElBQUksU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDO3dCQUM3QixXQUFXLEdBQUcsTUFBTSxVQUFVLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO29CQUN6RCxDQUFDO1lBQ0gsQ0FBQztZQUVELE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFFRCx1QkFBdUIsQ0FBQyxZQUFpQixFQUFFLG9CQUE2QixLQUFLO1lBQzVFLE1BQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUM7WUFDL0IsTUFBTSxHQUFHLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO1lBQ25GLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNqRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ2IsT0FBTyxFQUFFLENBQUM7Z0JBQ1gsQ0FBQztnQkFDRCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FDbkUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFBLDBDQUEwQixFQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsRUFDdkUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsZ0NBQWdDO2lCQUMxQyxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1VBMGxCRTtRQUNNLEtBQUssQ0FBQyxvQkFBb0I7WUFDakMsTUFBTSxJQUFJLEdBQVMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV2QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDdEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUVyRCxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTVFLE1BQU0sRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDO1lBQ25GLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxHQUFHLG1CQUFtQixJQUFJLG1CQUFtQixDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7WUFDL0YsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsV0FBVyxJQUFJLFdBQVcsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO1lBQ3ZFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLFlBQVksSUFBSSxZQUFZLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztZQUUxRSxNQUFNLE9BQU8sR0FBRyxLQUFLLGlDQUF5QixDQUFDO1lBQy9DLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNqRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxPQUFPLENBQUM7WUFFbEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDbkYsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlCLENBQUM7WUFFRCxNQUFNLHFCQUFxQixHQUFHLFNBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixFQUFFLDRCQUE0QixDQUFDLENBQUM7WUFDdkgsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUMsTUFBTSxFQUFDLEVBQUU7Z0JBQ3hFLElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osSUFBSSxDQUFDO3dCQUNKLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsQ0FBQzt3QkFDdkUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFhLENBQUM7d0JBQ3BFLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ2xFLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxJQUFJLENBQUM7d0JBQzVCLENBQUM7b0JBQ0YsQ0FBQztvQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUNaLDZDQUE2QztvQkFDOUMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBd0IsRUFBRSxFQUFFO2dCQUM3RyxNQUFNLEtBQUssR0FBaUIsRUFBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFLLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckksTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUUxRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUNwRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUVwRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUMxRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUMxRCxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLENBQUMseUJBQXlCLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7Z0JBRTdFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQzdGLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO2dCQUMzRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUM1RyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNuRixJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFFdkYsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBRS9OLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQztnQkFFL0UsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUNwRSxJQUFJLENBQUMsZ0NBQWdDLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO2dCQUNqRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO2dCQUN0RixJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUN2RCxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBRS9ELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRWpELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ3RGLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQ25GLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFFM0QsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDM0MsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdkMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDN0MsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDM0MsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFFL0IsSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUM7b0JBQy9CLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZHLElBQUksU0FBUyxJQUFJLE9BQU8sSUFBSSxHQUFHLEVBQUUsQ0FBQzt3QkFDakMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsSUFBSSxDQUFDO29CQUN2QyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsSUFBSSxDQUFDO29CQUN0QyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUM7b0JBQy9CLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxFQUFFLENBQUM7b0JBRXZHLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUM7d0JBQ3RDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLElBQUksQ0FBQztvQkFDaEMsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksWUFBWSxJQUFJLFVBQVUsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDN0MsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUMxQyxDQUFDO2dCQUVELElBQUksV0FBVyxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUM5QixJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxJQUFJLENBQUM7Z0JBQ3RDLENBQUM7Z0JBRUQsSUFBSSxlQUFlLElBQUksR0FBRyxFQUFFLENBQUM7b0JBQzVCLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDdEMsQ0FBQztnQkFFRCxTQUFTLGVBQWUsQ0FBQyxRQUFnQixFQUFFLFdBQXlCLEVBQUUsZUFBaUMsRUFBRSxjQUFtRDtvQkFDM0osT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUUsT0FBaUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUU7d0JBQzFFLE1BQU0sR0FBRyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxZQUFZLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFDN0csT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTs0QkFDNUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dDQUNiLE9BQU8sU0FBUyxDQUFDOzRCQUNsQixDQUFDOzRCQUVELE9BQU8sZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7d0JBQ2pGLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRTs0QkFDUixzQkFBc0I7d0JBQ3ZCLENBQUMsQ0FBQyxDQUFDO29CQUNKLENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBRUQsU0FBUyxhQUFhLENBQUMsV0FBbUI7b0JBQ3pDLElBQUksa0JBQWtCLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ2xELElBQUksQ0FBQyxlQUFlLEdBQUcsV0FBVyxDQUFDLEdBQUcsSUFBSSxDQUFDO29CQUM1QyxDQUFDO29CQUVELEtBQUssTUFBTSxVQUFVLElBQUksc0JBQXNCLEVBQUUsQ0FBQzt3QkFDakQsSUFBSSxXQUFXLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7NEJBQ3hDLElBQUksQ0FBQyxlQUFlLEdBQUcsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDO3dCQUMzQyxDQUFDO29CQUNGLENBQUM7b0JBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLENBQUM7d0JBQ3JDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQzdELENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxNQUFNLHVCQUF1QixHQUFHLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLEVBQUU7b0JBQ3JILE1BQU0sWUFBWSxHQUFhLElBQUEsb0JBQVUsRUFBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3pELEtBQUssTUFBTSxVQUFVLElBQUksWUFBWSxFQUFFLENBQUM7d0JBQ3ZDLGlGQUFpRjt3QkFDakYsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDdkMsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDdkMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDNUUsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUM1QixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUVILE1BQU0sZUFBZSxHQUFHLGVBQWUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxFQUFFO29CQUNwRyxJQUFJLFlBQVksR0FBYSxJQUFBLG9CQUFVLEVBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUV2RCxtRUFBbUU7b0JBQ25FLFlBQVksR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBRTFFLEtBQUssTUFBTSxVQUFVLElBQUksWUFBWSxFQUFFLENBQUM7d0JBQ3ZDLElBQUksVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUN6QyxNQUFNO3dCQUNQLENBQUM7d0JBQ0QsMEdBQTBHO3dCQUMxRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQzs0QkFDcEMsU0FBUzt3QkFDVixDQUFDO3dCQUNELE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ3BELGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDNUIsQ0FBQztnQkFFRixDQUFDLENBQUMsQ0FBQztnQkFFSCxNQUFNLG1CQUFtQixHQUFHLGVBQWUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxFQUFFO29CQUM3RyxJQUFJLENBQUM7d0JBQ0osTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDdEQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBRTlJLEtBQUssTUFBTSxVQUFVLElBQUksWUFBWSxFQUFFLENBQUM7NEJBQ3ZDLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO2dDQUMzQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxJQUFJLENBQUM7NEJBQ3RDLENBQUM7aUNBQU0sSUFBSSxrQkFBa0IsS0FBSyxVQUFVLElBQUksb0JBQW9CLEtBQUssVUFBVSxFQUFFLENBQUM7Z0NBQ3JGLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLElBQUksQ0FBQzs0QkFDdkMsQ0FBQztpQ0FBTSxJQUFJLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO2dDQUN0RCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDOzRCQUM1QyxDQUFDO2lDQUFNLENBQUM7Z0NBQ1AsS0FBSyxNQUFNLFVBQVUsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO29DQUMvQyxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQzt3Q0FDdkMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQztvQ0FDNUMsQ0FBQztnQ0FDRixDQUFDOzRCQUNGLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO29CQUNELE9BQU8sQ0FBQyxFQUFFLENBQUM7d0JBQ1YsNkRBQTZEO29CQUM5RCxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUVILE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxFQUFFO29CQUNqRyxJQUFJLENBQUM7d0JBQ0osTUFBTSxLQUFLLEdBQWEsSUFBQSxvQkFBVSxFQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDbEQsSUFBSSxzQkFBc0IsR0FBWSxLQUFLLENBQUM7d0JBQzVDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7NEJBQ3ZDLE1BQU0sSUFBSSxHQUFXLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs0QkFDckMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7Z0NBQ2xDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO29DQUM3QixzQkFBc0IsR0FBRyxJQUFJLENBQUM7b0NBQzlCLFNBQVM7Z0NBQ1YsQ0FBQztxQ0FBTSxDQUFDO29DQUNQLE1BQU07Z0NBQ1AsQ0FBQzs0QkFDRixDQUFDOzRCQUNELElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dDQUMxQixNQUFNOzRCQUNQLENBQUM7NEJBQ0QsSUFBSSxzQkFBc0IsSUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLENBQUM7Z0NBQzNDLE1BQU0sV0FBVyxHQUFXLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7Z0NBQ3RELEtBQUssTUFBTSxNQUFNLElBQUksa0JBQWtCLEVBQUUsQ0FBQztvQ0FDekMsSUFBSSxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7d0NBQ3BDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxXQUFXLENBQUMsR0FBRyxJQUFJLENBQUM7b0NBQ2hELENBQUM7Z0NBQ0YsQ0FBQzs0QkFDRixDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUNWLDZEQUE2RDtvQkFDOUQsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztnQkFFSCxNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsRUFBRTtvQkFDaEcsSUFBSSxDQUFDO3dCQUNKLElBQUksbUJBQW1CLENBQUM7d0JBQ3hCLE9BQU8sbUJBQW1CLEdBQUcsMENBQXNCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDOzRCQUN6RSxJQUFJLGlCQUFpQixDQUFDOzRCQUN0QixPQUFPLGlCQUFpQixHQUFHLHdDQUFvQixDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0NBQzlFLE1BQU0sY0FBYyxHQUFHLHFDQUFpQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUNwRSxNQUFNLGlCQUFpQixHQUFHLHdDQUFvQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUMxRSxJQUFJLGNBQWMsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO29DQUN6QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDO2dDQUN6RixDQUFDOzRCQUNGLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO29CQUNELE9BQU8sQ0FBQyxFQUFFLENBQUM7d0JBQ1Ysa0RBQWtEO29CQUNuRCxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUVILE1BQU0sY0FBYyxHQUFHLGVBQWUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxFQUFFO29CQUN4RyxJQUFJLENBQUM7d0JBQ0osSUFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsOENBQTBCLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQ2hGLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLGdEQUE0QixFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNuRixDQUFDO29CQUNELE9BQU8sQ0FBQyxFQUFFLENBQUM7d0JBQ1YsbURBQW1EO29CQUNwRCxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUVILE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUU7b0JBQ2xELE1BQU0sUUFBUSxHQUFHLFNBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLG1DQUFtQyxDQUFDLENBQUM7b0JBQ2pGLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUN0RCxJQUFJLE1BQU0sRUFBRSxDQUFDOzRCQUNaLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLElBQUksQ0FBQzt3QkFDdkMsQ0FBQztvQkFDRixDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUU7d0JBQ1IsdUNBQXVDO29CQUN4QyxDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDLENBQUMsQ0FBQztnQkFFSCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLG1CQUFtQixFQUFFLEdBQUcsdUJBQXVCLEVBQUUsR0FBRyxlQUFlLEVBQUUsR0FBRyxXQUFXLEVBQUUsR0FBRyxjQUFjLEVBQUUsR0FBRyxlQUFlLEVBQUUsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4TCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyx5QkFBeUIsQ0FBQyxPQUFlLEVBQUUsS0FBYSxFQUFFLElBQVU7WUFDM0UsSUFBSSxpQkFBaUIsQ0FBQztZQUN0QixPQUFPLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxPQUFPLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLE1BQU0sVUFBVSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLE9BQU8sSUFBSSxVQUFVLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3hFLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLGlCQUFpQixDQUFDLE9BQWUsRUFBRSxVQUFrQixFQUFFLE1BQWMsRUFBRSxJQUFVO1lBQ3hGLEtBQUssTUFBTSxXQUFXLElBQUksMENBQXNCLEVBQUUsQ0FBQztnQkFDbEQsSUFBSSxXQUFXLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDO29CQUNoRCxJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7b0JBQ3RDLE9BQU87Z0JBQ1IsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sV0FBVyxDQUFDLEdBQWEsRUFBRSxLQUFhO1lBQy9DLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUM7UUFDekQsQ0FBQztLQUNELENBQUE7SUE5N0JZLG9EQUFvQjttQ0FBcEIsb0JBQW9CO1FBSzlCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLDRCQUFnQixDQUFBO09BUk4sb0JBQW9CLENBODdCaEM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLHFDQUFxQixFQUFFLG9CQUFvQixvQ0FBNEIsQ0FBQyJ9