var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/window", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/collections", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/themables", "vs/base/common/uri", "vs/code/electron-sandbox/issue/issueReporterModel", "vs/nls", "vs/platform/diagnostics/common/diagnostics", "vs/platform/issue/common/issue", "vs/platform/issue/common/issueReporterUtil", "vs/platform/native/common/native", "vs/platform/theme/browser/iconsStyleSheet", "vs/platform/window/electron-sandbox/window"], function (require, exports, dom_1, button_1, iconLabels_1, window_1, async_1, codicons_1, collections_1, decorators_1, errors_1, lifecycle_1, platform_1, strings_1, themables_1, uri_1, issueReporterModel_1, nls_1, diagnostics_1, issue_1, issueReporterUtil_1, native_1, iconsStyleSheet_1, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IssueReporter = void 0;
    exports.hide = hide;
    exports.show = show;
    // GitHub has let us know that we could up our limit here to 8k. We chose 7500 to play it safe.
    // ref https://github.com/microsoft/vscode/issues/159191
    const MAX_URL_LENGTH = 7500;
    var IssueSource;
    (function (IssueSource) {
        IssueSource["VSCode"] = "vscode";
        IssueSource["Extension"] = "extension";
        IssueSource["Marketplace"] = "marketplace";
    })(IssueSource || (IssueSource = {}));
    let IssueReporter = class IssueReporter extends lifecycle_1.Disposable {
        constructor(configuration, nativeHostService, issueMainService) {
            super();
            this.configuration = configuration;
            this.nativeHostService = nativeHostService;
            this.issueMainService = issueMainService;
            this.numberOfSearchResultsDisplayed = 0;
            this.receivedSystemInfo = false;
            this.receivedExtensionData = false;
            this.receivedPerformanceInfo = false;
            this.shouldQueueSearch = false;
            this.hasBeenSubmitted = false;
            this.openReporter = false;
            this.loadingExtensionData = false;
            this.selectedExtension = '';
            this.delayedSubmit = new async_1.Delayer(300);
            const targetExtension = configuration.data.extensionId ? configuration.data.enabledExtensions.find(extension => extension.id.toLocaleLowerCase() === configuration.data.extensionId?.toLocaleLowerCase()) : undefined;
            this.issueReporterModel = new issueReporterModel_1.IssueReporterModel({
                ...configuration.data,
                issueType: configuration.data.issueType || 0 /* IssueType.Bug */,
                versionInfo: {
                    vscodeVersion: `${configuration.product.nameShort} ${!!configuration.product.darwinUniversalAssetId ? `${configuration.product.version} (Universal)` : configuration.product.version} (${configuration.product.commit || 'Commit unknown'}, ${configuration.product.date || 'Date unknown'})`,
                    os: `${this.configuration.os.type} ${this.configuration.os.arch} ${this.configuration.os.release}${platform_1.isLinuxSnap ? ' snap' : ''}`
                },
                extensionsDisabled: !!configuration.disableExtensions,
                fileOnExtension: configuration.data.extensionId ? !targetExtension?.isBuiltin : undefined,
                selectedExtension: targetExtension
            });
            const fileOnMarketplace = configuration.data.issueSource === IssueSource.Marketplace;
            const fileOnProduct = configuration.data.issueSource === IssueSource.VSCode;
            this.issueReporterModel.update({ fileOnMarketplace, fileOnProduct });
            //TODO: Handle case where extension is not activated
            const issueReporterElement = this.getElementById('issue-reporter');
            if (issueReporterElement) {
                this.previewButton = new button_1.Button(issueReporterElement, button_1.unthemedButtonStyles);
                const issueRepoName = document.createElement('a');
                issueReporterElement.appendChild(issueRepoName);
                issueRepoName.id = 'show-repo-name';
                issueRepoName.classList.add('hidden');
                this.updatePreviewButtonState();
            }
            const issueTitle = configuration.data.issueTitle;
            if (issueTitle) {
                const issueTitleElement = this.getElementById('issue-title');
                if (issueTitleElement) {
                    issueTitleElement.value = issueTitle;
                }
            }
            const issueBody = configuration.data.issueBody;
            if (issueBody) {
                const description = this.getElementById('description');
                if (description) {
                    description.value = issueBody;
                    this.issueReporterModel.update({ issueDescription: issueBody });
                }
            }
            this.issueMainService.$getSystemInfo().then(info => {
                this.issueReporterModel.update({ systemInfo: info });
                this.receivedSystemInfo = true;
                this.updateSystemInfo(this.issueReporterModel.getData());
                this.updatePreviewButtonState();
            });
            if (configuration.data.issueType === 1 /* IssueType.PerformanceIssue */) {
                this.issueMainService.$getPerformanceInfo().then(info => {
                    this.updatePerformanceInfo(info);
                });
            }
            if (window_1.mainWindow.document.documentElement.lang !== 'en') {
                show(this.getElementById('english'));
            }
            const codiconStyleSheet = (0, dom_1.createStyleSheet)();
            codiconStyleSheet.id = 'codiconStyles';
            // TODO: Is there a way to use the IThemeService here instead
            const iconsStyleSheet = this._register((0, iconsStyleSheet_1.getIconsStyleSheet)(undefined));
            function updateAll() {
                codiconStyleSheet.textContent = iconsStyleSheet.getCSS();
            }
            const delayer = new async_1.RunOnceScheduler(updateAll, 0);
            iconsStyleSheet.onDidChange(() => delayer.schedule());
            delayer.schedule();
            this.setUpTypes();
            this.setEventHandlers();
            (0, window_2.applyZoom)(configuration.data.zoomLevel, window_1.mainWindow);
            this.applyStyles(configuration.data.styles);
            this.handleExtensionData(configuration.data.enabledExtensions);
            this.updateExperimentsInfo(configuration.data.experiments);
            this.updateRestrictedMode(configuration.data.restrictedMode);
            this.updateUnsupportedMode(configuration.data.isUnsupported);
            // Handle case where extension is pre-selected through the command
            if ((configuration.data.data || configuration.data.uri) && targetExtension) {
                this.updateExtensionStatus(targetExtension);
            }
        }
        render() {
            this.renderBlocks();
        }
        setInitialFocus() {
            const { fileOnExtension } = this.issueReporterModel.getData();
            if (fileOnExtension) {
                const issueTitle = window_1.mainWindow.document.getElementById('issue-title');
                issueTitle?.focus();
            }
            else {
                const issueType = window_1.mainWindow.document.getElementById('issue-type');
                issueType?.focus();
            }
        }
        // TODO @justschen: After migration to Aux Window, switch to dedicated css.
        applyStyles(styles) {
            const styleTag = document.createElement('style');
            const content = [];
            if (styles.inputBackground) {
                content.push(`input[type="text"], textarea, select, .issues-container > .issue > .issue-state, .block-info { background-color: ${styles.inputBackground}; }`);
            }
            if (styles.inputBorder) {
                content.push(`input[type="text"], textarea, select { border: 1px solid ${styles.inputBorder}; }`);
            }
            else {
                content.push(`input[type="text"], textarea, select { border: 1px solid transparent; }`);
            }
            if (styles.inputForeground) {
                content.push(`input[type="text"], textarea, select, .issues-container > .issue > .issue-state, .block-info { color: ${styles.inputForeground}; }`);
            }
            if (styles.inputErrorBorder) {
                content.push(`.invalid-input, .invalid-input:focus, .validation-error { border: 1px solid ${styles.inputErrorBorder} !important; }`);
                content.push(`.required-input { color: ${styles.inputErrorBorder}; }`);
            }
            if (styles.inputErrorBackground) {
                content.push(`.validation-error { background: ${styles.inputErrorBackground}; }`);
            }
            if (styles.inputErrorForeground) {
                content.push(`.validation-error { color: ${styles.inputErrorForeground}; }`);
            }
            if (styles.inputActiveBorder) {
                content.push(`input[type='text']:focus, textarea:focus, select:focus, summary:focus, button:focus, a:focus, .workbenchCommand:focus  { border: 1px solid ${styles.inputActiveBorder}; outline-style: none; }`);
            }
            if (styles.textLinkColor) {
                content.push(`a, .workbenchCommand { color: ${styles.textLinkColor}; }`);
            }
            if (styles.textLinkColor) {
                content.push(`a { color: ${styles.textLinkColor}; }`);
            }
            if (styles.textLinkActiveForeground) {
                content.push(`a:hover, .workbenchCommand:hover { color: ${styles.textLinkActiveForeground}; }`);
            }
            if (styles.sliderBackgroundColor) {
                content.push(`::-webkit-scrollbar-thumb { background-color: ${styles.sliderBackgroundColor}; }`);
            }
            if (styles.sliderActiveColor) {
                content.push(`::-webkit-scrollbar-thumb:active { background-color: ${styles.sliderActiveColor}; }`);
            }
            if (styles.sliderHoverColor) {
                content.push(`::--webkit-scrollbar-thumb:hover { background-color: ${styles.sliderHoverColor}; }`);
            }
            if (styles.buttonBackground) {
                content.push(`.monaco-text-button { background-color: ${styles.buttonBackground} !important; }`);
            }
            if (styles.buttonForeground) {
                content.push(`.monaco-text-button { color: ${styles.buttonForeground} !important; }`);
            }
            if (styles.buttonHoverBackground) {
                content.push(`.monaco-text-button:not(.disabled):hover, .monaco-text-button:focus { background-color: ${styles.buttonHoverBackground} !important; }`);
            }
            styleTag.textContent = content.join('\n');
            window_1.mainWindow.document.head.appendChild(styleTag);
            window_1.mainWindow.document.body.style.color = styles.color || '';
        }
        handleExtensionData(extensions) {
            const installedExtensions = extensions.filter(x => !x.isBuiltin);
            const { nonThemes, themes } = (0, collections_1.groupBy)(installedExtensions, ext => {
                return ext.isTheme ? 'themes' : 'nonThemes';
            });
            const numberOfThemeExtesions = themes && themes.length;
            this.issueReporterModel.update({ numberOfThemeExtesions, enabledNonThemeExtesions: nonThemes, allExtensions: installedExtensions });
            this.updateExtensionTable(nonThemes, numberOfThemeExtesions);
            if (this.configuration.disableExtensions || installedExtensions.length === 0) {
                this.getElementById('disableExtensions').disabled = true;
            }
            this.updateExtensionSelector(installedExtensions);
        }
        async updateIssueReporterUri(extension) {
            try {
                if (extension.uri) {
                    const uri = uri_1.URI.revive(extension.uri);
                    extension.bugsUrl = uri.toString();
                }
                else {
                    const uri = await this.issueMainService.$getIssueReporterUri(extension.id);
                    extension.bugsUrl = uri.toString(true);
                }
            }
            catch (e) {
                extension.hasIssueUriRequestHandler = false;
                // The issue handler failed so fall back to old issue reporter experience.
                this.renderBlocks();
            }
        }
        async getIssueDataFromExtension(extension) {
            try {
                const data = await this.issueMainService.$getIssueReporterData(extension.id);
                extension.extensionData = data;
                this.receivedExtensionData = true;
                this.issueReporterModel.update({ extensionData: data });
                return data;
            }
            catch (e) {
                extension.hasIssueDataProviders = false;
                // The issue handler failed so fall back to old issue reporter experience.
                this.renderBlocks();
                throw e;
            }
        }
        async getIssueTemplateFromExtension(extension) {
            try {
                const data = await this.issueMainService.$getIssueReporterTemplate(extension.id);
                extension.extensionTemplate = data;
                return data;
            }
            catch (e) {
                throw e;
            }
        }
        async getReporterStatus(extension) {
            try {
                const data = await this.issueMainService.$getReporterStatus(extension.id, extension.name);
                return data;
            }
            catch (e) {
                console.error(e);
                return [false, false];
            }
        }
        async sendReporterMenu(extension) {
            try {
                const data = await this.issueMainService.$sendReporterMenu(extension.id, extension.name);
                return data;
            }
            catch (e) {
                console.error(e);
                return undefined;
            }
        }
        setEventHandlers() {
            this.addEventListener('issue-type', 'change', (event) => {
                const issueType = parseInt(event.target.value);
                this.issueReporterModel.update({ issueType: issueType });
                if (issueType === 1 /* IssueType.PerformanceIssue */ && !this.receivedPerformanceInfo) {
                    this.issueMainService.$getPerformanceInfo().then(info => {
                        this.updatePerformanceInfo(info);
                    });
                }
                this.updatePreviewButtonState();
                this.setSourceOptions();
                this.render();
            });
            ['includeSystemInfo', 'includeProcessInfo', 'includeWorkspaceInfo', 'includeExtensions', 'includeExperiments', 'includeExtensionData'].forEach(elementId => {
                this.addEventListener(elementId, 'click', (event) => {
                    event.stopPropagation();
                    this.issueReporterModel.update({ [elementId]: !this.issueReporterModel.getData()[elementId] });
                });
            });
            const showInfoElements = window_1.mainWindow.document.getElementsByClassName('showInfo');
            for (let i = 0; i < showInfoElements.length; i++) {
                const showInfo = showInfoElements.item(i);
                showInfo.addEventListener('click', (e) => {
                    e.preventDefault();
                    const label = e.target;
                    if (label) {
                        const containingElement = label.parentElement && label.parentElement.parentElement;
                        const info = containingElement && containingElement.lastElementChild;
                        if (info && info.classList.contains('hidden')) {
                            show(info);
                            label.textContent = (0, nls_1.localize)('hide', "hide");
                        }
                        else {
                            hide(info);
                            label.textContent = (0, nls_1.localize)('show', "show");
                        }
                    }
                });
            }
            this.addEventListener('issue-source', 'change', (e) => {
                const value = e.target.value;
                const problemSourceHelpText = this.getElementById('problem-source-help-text');
                if (value === '') {
                    this.issueReporterModel.update({ fileOnExtension: undefined });
                    show(problemSourceHelpText);
                    this.clearSearchResults();
                    this.render();
                    return;
                }
                else {
                    hide(problemSourceHelpText);
                }
                let fileOnExtension, fileOnMarketplace = false;
                if (value === IssueSource.Extension) {
                    fileOnExtension = true;
                }
                else if (value === IssueSource.Marketplace) {
                    fileOnMarketplace = true;
                }
                this.issueReporterModel.update({ fileOnExtension, fileOnMarketplace });
                this.render();
                const title = this.getElementById('issue-title').value;
                this.searchIssues(title, fileOnExtension, fileOnMarketplace);
            });
            this.addEventListener('description', 'input', (e) => {
                const issueDescription = e.target.value;
                this.issueReporterModel.update({ issueDescription });
                // Only search for extension issues on title change
                if (this.issueReporterModel.fileOnExtension() === false) {
                    const title = this.getElementById('issue-title').value;
                    this.searchVSCodeIssues(title, issueDescription);
                }
            });
            this.addEventListener('issue-title', 'input', (e) => {
                const title = e.target.value;
                const lengthValidationMessage = this.getElementById('issue-title-length-validation-error');
                const issueUrl = this.getIssueUrl();
                if (title && this.getIssueUrlWithTitle(title, issueUrl).length > MAX_URL_LENGTH) {
                    show(lengthValidationMessage);
                }
                else {
                    hide(lengthValidationMessage);
                }
                const issueSource = this.getElementById('issue-source');
                if (!issueSource || issueSource.value === '') {
                    return;
                }
                const { fileOnExtension, fileOnMarketplace } = this.issueReporterModel.getData();
                this.searchIssues(title, fileOnExtension, fileOnMarketplace);
            });
            this.previewButton.onDidClick(async () => {
                this.delayedSubmit.trigger(async () => {
                    this.createIssue();
                });
            });
            this.addEventListener('disableExtensions', 'click', () => {
                this.issueMainService.$reloadWithExtensionsDisabled();
            });
            this.addEventListener('extensionBugsLink', 'click', (e) => {
                const url = e.target.innerText;
                (0, dom_1.windowOpenNoOpener)(url);
            });
            this.addEventListener('disableExtensions', 'keydown', (e) => {
                e.stopPropagation();
                if (e.keyCode === 13 || e.keyCode === 32) {
                    this.issueMainService.$reloadWithExtensionsDisabled();
                }
            });
            window_1.mainWindow.document.onkeydown = async (e) => {
                const cmdOrCtrlKey = platform_1.isMacintosh ? e.metaKey : e.ctrlKey;
                // Cmd/Ctrl+Enter previews issue and closes window
                if (cmdOrCtrlKey && e.keyCode === 13) {
                    this.delayedSubmit.trigger(async () => {
                        if (await this.createIssue()) {
                            this.close();
                        }
                    });
                }
                // Cmd/Ctrl + w closes issue window
                if (cmdOrCtrlKey && e.keyCode === 87) {
                    e.stopPropagation();
                    e.preventDefault();
                    const issueTitle = this.getElementById('issue-title').value;
                    const { issueDescription } = this.issueReporterModel.getData();
                    if (!this.hasBeenSubmitted && (issueTitle || issueDescription)) {
                        // fire and forget
                        this.issueMainService.$showConfirmCloseDialog();
                    }
                    else {
                        this.close();
                    }
                }
                // Cmd/Ctrl + zooms in
                if (cmdOrCtrlKey && e.keyCode === 187) {
                    (0, window_2.zoomIn)(window_1.mainWindow);
                }
                // Cmd/Ctrl - zooms out
                if (cmdOrCtrlKey && e.keyCode === 189) {
                    (0, window_2.zoomOut)(window_1.mainWindow);
                }
                // With latest electron upgrade, cmd+a is no longer propagating correctly for inputs in this window on mac
                // Manually perform the selection
                if (platform_1.isMacintosh) {
                    if (cmdOrCtrlKey && e.keyCode === 65 && e.target) {
                        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                            e.target.select();
                        }
                    }
                }
            };
        }
        updatePerformanceInfo(info) {
            this.issueReporterModel.update(info);
            this.receivedPerformanceInfo = true;
            const state = this.issueReporterModel.getData();
            this.updateProcessInfo(state);
            this.updateWorkspaceInfo(state);
            this.updatePreviewButtonState();
        }
        updatePreviewButtonState() {
            if (this.isPreviewEnabled()) {
                if (this.configuration.data.githubAccessToken) {
                    this.previewButton.label = (0, nls_1.localize)('createOnGitHub', "Create on GitHub");
                }
                else {
                    this.previewButton.label = (0, nls_1.localize)('previewOnGitHub', "Preview on GitHub");
                }
                this.previewButton.enabled = true;
            }
            else {
                this.previewButton.enabled = false;
                this.previewButton.label = (0, nls_1.localize)('loadingData', "Loading data...");
            }
            const issueRepoName = this.getElementById('show-repo-name');
            const selectedExtension = this.issueReporterModel.getData().selectedExtension;
            if (selectedExtension && selectedExtension.uri) {
                const urlString = uri_1.URI.revive(selectedExtension.uri).toString();
                issueRepoName.href = urlString;
                issueRepoName.addEventListener('click', (e) => this.openLink(e));
                issueRepoName.addEventListener('auxclick', (e) => this.openLink(e));
                const gitHubInfo = this.parseGitHubUrl(urlString);
                issueRepoName.textContent = gitHubInfo ? gitHubInfo.owner + '/' + gitHubInfo.repositoryName : urlString;
                Object.assign(issueRepoName.style, {
                    alignSelf: 'flex-end',
                    display: 'block',
                    fontSize: '13px',
                    marginBottom: '10px',
                    padding: '4px 0px',
                    textDecoration: 'none',
                    width: 'auto'
                });
                show(issueRepoName);
            }
            else {
                // clear styles
                issueRepoName.removeAttribute('style');
                hide(issueRepoName);
            }
        }
        isPreviewEnabled() {
            const issueType = this.issueReporterModel.getData().issueType;
            if (this.issueReporterModel.getData().selectedExtension?.hasIssueDataProviders && !this.receivedExtensionData) {
                return false;
            }
            if (this.loadingExtensionData) {
                return false;
            }
            if (issueType === 0 /* IssueType.Bug */ && this.receivedSystemInfo) {
                return true;
            }
            if (issueType === 1 /* IssueType.PerformanceIssue */ && this.receivedSystemInfo && this.receivedPerformanceInfo) {
                return true;
            }
            if (issueType === 2 /* IssueType.FeatureRequest */) {
                return true;
            }
            return false;
        }
        getExtensionRepositoryUrl() {
            const selectedExtension = this.issueReporterModel.getData().selectedExtension;
            return selectedExtension && selectedExtension.repositoryUrl;
        }
        getExtensionBugsUrl() {
            const selectedExtension = this.issueReporterModel.getData().selectedExtension;
            return selectedExtension && selectedExtension.bugsUrl;
        }
        getExtensionData() {
            return this.issueReporterModel.getData().selectedExtension?.extensionData;
        }
        searchVSCodeIssues(title, issueDescription) {
            if (title) {
                this.searchDuplicates(title, issueDescription);
            }
            else {
                this.clearSearchResults();
            }
        }
        searchIssues(title, fileOnExtension, fileOnMarketplace) {
            if (fileOnExtension) {
                return this.searchExtensionIssues(title);
            }
            if (fileOnMarketplace) {
                return this.searchMarketplaceIssues(title);
            }
            const description = this.issueReporterModel.getData().issueDescription;
            this.searchVSCodeIssues(title, description);
        }
        searchExtensionIssues(title) {
            const url = this.getExtensionGitHubUrl();
            if (title) {
                const matches = /^https?:\/\/github\.com\/(.*)/.exec(url);
                if (matches && matches.length) {
                    const repo = matches[1];
                    return this.searchGitHub(repo, title);
                }
                // If the extension has no repository, display empty search results
                if (this.issueReporterModel.getData().selectedExtension) {
                    this.clearSearchResults();
                    return this.displaySearchResults([]);
                }
            }
            this.clearSearchResults();
        }
        searchMarketplaceIssues(title) {
            if (title) {
                const gitHubInfo = this.parseGitHubUrl(this.configuration.product.reportMarketplaceIssueUrl);
                if (gitHubInfo) {
                    return this.searchGitHub(`${gitHubInfo.owner}/${gitHubInfo.repositoryName}`, title);
                }
            }
        }
        async close() {
            await this.issueMainService.$closeReporter();
        }
        clearSearchResults() {
            const similarIssues = this.getElementById('similar-issues');
            similarIssues.innerText = '';
            this.numberOfSearchResultsDisplayed = 0;
        }
        searchGitHub(repo, title) {
            const query = `is:issue+repo:${repo}+${title}`;
            const similarIssues = this.getElementById('similar-issues');
            fetch(`https://api.github.com/search/issues?q=${query}`).then((response) => {
                response.json().then(result => {
                    similarIssues.innerText = '';
                    if (result && result.items) {
                        this.displaySearchResults(result.items);
                    }
                    else {
                        // If the items property isn't present, the rate limit has been hit
                        const message = (0, dom_1.$)('div.list-title');
                        message.textContent = (0, nls_1.localize)('rateLimited', "GitHub query limit exceeded. Please wait.");
                        similarIssues.appendChild(message);
                        const resetTime = response.headers.get('X-RateLimit-Reset');
                        const timeToWait = resetTime ? parseInt(resetTime) - Math.floor(Date.now() / 1000) : 1;
                        if (this.shouldQueueSearch) {
                            this.shouldQueueSearch = false;
                            setTimeout(() => {
                                this.searchGitHub(repo, title);
                                this.shouldQueueSearch = true;
                            }, timeToWait * 1000);
                        }
                    }
                }).catch(_ => {
                    // Ignore
                });
            }).catch(_ => {
                // Ignore
            });
        }
        searchDuplicates(title, body) {
            const url = 'https://vscode-probot.westus.cloudapp.azure.com:7890/duplicate_candidates';
            const init = {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    body
                }),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            };
            fetch(url, init).then((response) => {
                response.json().then(result => {
                    this.clearSearchResults();
                    if (result && result.candidates) {
                        this.displaySearchResults(result.candidates);
                    }
                    else {
                        throw new Error('Unexpected response, no candidates property');
                    }
                }).catch(_ => {
                    // Ignore
                });
            }).catch(_ => {
                // Ignore
            });
        }
        displaySearchResults(results) {
            const similarIssues = this.getElementById('similar-issues');
            if (results.length) {
                const issues = (0, dom_1.$)('div.issues-container');
                const issuesText = (0, dom_1.$)('div.list-title');
                issuesText.textContent = (0, nls_1.localize)('similarIssues', "Similar issues");
                this.numberOfSearchResultsDisplayed = results.length < 5 ? results.length : 5;
                for (let i = 0; i < this.numberOfSearchResultsDisplayed; i++) {
                    const issue = results[i];
                    const link = (0, dom_1.$)('a.issue-link', { href: issue.html_url });
                    link.textContent = issue.title;
                    link.title = issue.title;
                    link.addEventListener('click', (e) => this.openLink(e));
                    link.addEventListener('auxclick', (e) => this.openLink(e));
                    let issueState;
                    let item;
                    if (issue.state) {
                        issueState = (0, dom_1.$)('span.issue-state');
                        const issueIcon = (0, dom_1.$)('span.issue-icon');
                        issueIcon.appendChild((0, iconLabels_1.renderIcon)(issue.state === 'open' ? codicons_1.Codicon.issueOpened : codicons_1.Codicon.issueClosed));
                        const issueStateLabel = (0, dom_1.$)('span.issue-state.label');
                        issueStateLabel.textContent = issue.state === 'open' ? (0, nls_1.localize)('open', "Open") : (0, nls_1.localize)('closed', "Closed");
                        issueState.title = issue.state === 'open' ? (0, nls_1.localize)('open', "Open") : (0, nls_1.localize)('closed', "Closed");
                        issueState.appendChild(issueIcon);
                        issueState.appendChild(issueStateLabel);
                        item = (0, dom_1.$)('div.issue', undefined, issueState, link);
                    }
                    else {
                        item = (0, dom_1.$)('div.issue', undefined, link);
                    }
                    issues.appendChild(item);
                }
                similarIssues.appendChild(issuesText);
                similarIssues.appendChild(issues);
            }
            else {
                const message = (0, dom_1.$)('div.list-title');
                message.textContent = (0, nls_1.localize)('noSimilarIssues', "No similar issues found");
                similarIssues.appendChild(message);
            }
        }
        setUpTypes() {
            const makeOption = (issueType, description) => (0, dom_1.$)('option', { 'value': issueType.valueOf() }, (0, strings_1.escape)(description));
            const typeSelect = this.getElementById('issue-type');
            const { issueType } = this.issueReporterModel.getData();
            (0, dom_1.reset)(typeSelect, makeOption(0 /* IssueType.Bug */, (0, nls_1.localize)('bugReporter', "Bug Report")), makeOption(2 /* IssueType.FeatureRequest */, (0, nls_1.localize)('featureRequest', "Feature Request")), makeOption(1 /* IssueType.PerformanceIssue */, (0, nls_1.localize)('performanceIssue', "Performance Issue")));
            typeSelect.value = issueType.toString();
            this.setSourceOptions();
        }
        makeOption(value, description, disabled) {
            const option = document.createElement('option');
            option.disabled = disabled;
            option.value = value;
            option.textContent = description;
            return option;
        }
        setSourceOptions() {
            const sourceSelect = this.getElementById('issue-source');
            const { issueType, fileOnExtension, selectedExtension, fileOnMarketplace, fileOnProduct } = this.issueReporterModel.getData();
            let selected = sourceSelect.selectedIndex;
            if (selected === -1) {
                if (fileOnExtension !== undefined) {
                    selected = fileOnExtension ? 2 : 1;
                }
                else if (selectedExtension?.isBuiltin) {
                    selected = 1;
                }
                else if (fileOnMarketplace) {
                    selected = 3;
                }
                else if (fileOnProduct) {
                    selected = 1;
                }
            }
            sourceSelect.innerText = '';
            sourceSelect.append(this.makeOption('', (0, nls_1.localize)('selectSource', "Select source"), true));
            sourceSelect.append(this.makeOption('vscode', (0, nls_1.localize)('vscode', "Visual Studio Code"), false));
            sourceSelect.append(this.makeOption('extension', (0, nls_1.localize)('extension', "An extension"), false));
            if (this.configuration.product.reportMarketplaceIssueUrl) {
                sourceSelect.append(this.makeOption('marketplace', (0, nls_1.localize)('marketplace', "Extensions marketplace"), false));
            }
            if (issueType !== 2 /* IssueType.FeatureRequest */) {
                sourceSelect.append(this.makeOption('unknown', (0, nls_1.localize)('unknown', "Don't know"), false));
            }
            if (selected !== -1 && selected < sourceSelect.options.length) {
                sourceSelect.selectedIndex = selected;
            }
            else {
                sourceSelect.selectedIndex = 0;
                hide(this.getElementById('problem-source-help-text'));
            }
        }
        renderBlocks() {
            // Depending on Issue Type, we render different blocks and text
            const { issueType, fileOnExtension, fileOnMarketplace, selectedExtension } = this.issueReporterModel.getData();
            const blockContainer = this.getElementById('block-container');
            const systemBlock = window_1.mainWindow.document.querySelector('.block-system');
            const processBlock = window_1.mainWindow.document.querySelector('.block-process');
            const workspaceBlock = window_1.mainWindow.document.querySelector('.block-workspace');
            const extensionsBlock = window_1.mainWindow.document.querySelector('.block-extensions');
            const experimentsBlock = window_1.mainWindow.document.querySelector('.block-experiments');
            const extensionDataBlock = window_1.mainWindow.document.querySelector('.block-extension-data');
            const problemSource = this.getElementById('problem-source');
            const descriptionTitle = this.getElementById('issue-description-label');
            const descriptionSubtitle = this.getElementById('issue-description-subtitle');
            const extensionSelector = this.getElementById('extension-selection');
            const titleTextArea = this.getElementById('issue-title-container');
            const descriptionTextArea = this.getElementById('description');
            const extensionDataTextArea = this.getElementById('extension-data');
            // Hide all by default
            hide(blockContainer);
            hide(systemBlock);
            hide(processBlock);
            hide(workspaceBlock);
            hide(extensionsBlock);
            hide(experimentsBlock);
            hide(extensionSelector);
            hide(extensionDataTextArea);
            hide(extensionDataBlock);
            show(problemSource);
            show(titleTextArea);
            show(descriptionTextArea);
            if (fileOnExtension) {
                show(extensionSelector);
            }
            if (fileOnExtension && selectedExtension?.hasIssueUriRequestHandler && !selectedExtension.hasIssueDataProviders) {
                hide(titleTextArea);
                hide(descriptionTextArea);
                (0, dom_1.reset)(descriptionTitle, (0, nls_1.localize)('handlesIssuesElsewhere', "This extension handles issues outside of VS Code"));
                (0, dom_1.reset)(descriptionSubtitle, (0, nls_1.localize)('elsewhereDescription', "The '{0}' extension prefers to use an external issue reporter. To be taken to that issue reporting experience, click the button below.", selectedExtension.displayName));
                this.previewButton.label = (0, nls_1.localize)('openIssueReporter', "Open External Issue Reporter");
                return;
            }
            if (fileOnExtension && selectedExtension?.hasIssueDataProviders) {
                const data = this.getExtensionData();
                if (data) {
                    extensionDataTextArea.innerText = data.toString();
                }
                extensionDataTextArea.readOnly = true;
                show(extensionDataBlock);
            }
            if (fileOnExtension && selectedExtension?.data) {
                const data = selectedExtension?.data;
                extensionDataTextArea.innerText = data.toString();
                extensionDataTextArea.readOnly = true;
                show(extensionDataBlock);
            }
            // only if we know comes from the open reporter command
            if (fileOnExtension && this.openReporter) {
                extensionDataTextArea.readOnly = true;
                setTimeout(() => {
                    // delay to make sure from command or not
                    if (this.openReporter) {
                        show(extensionDataBlock);
                    }
                }, 100);
            }
            if (issueType === 0 /* IssueType.Bug */) {
                if (!fileOnMarketplace) {
                    show(blockContainer);
                    show(systemBlock);
                    show(experimentsBlock);
                    if (!fileOnExtension) {
                        show(extensionsBlock);
                    }
                }
                (0, dom_1.reset)(descriptionTitle, (0, nls_1.localize)('stepsToReproduce', "Steps to Reproduce") + ' ', (0, dom_1.$)('span.required-input', undefined, '*'));
                (0, dom_1.reset)(descriptionSubtitle, (0, nls_1.localize)('bugDescription', "Share the steps needed to reliably reproduce the problem. Please include actual and expected results. We support GitHub-flavored Markdown. You will be able to edit your issue and add screenshots when we preview it on GitHub."));
            }
            else if (issueType === 1 /* IssueType.PerformanceIssue */) {
                if (!fileOnMarketplace) {
                    show(blockContainer);
                    show(systemBlock);
                    show(processBlock);
                    show(workspaceBlock);
                    show(experimentsBlock);
                }
                if (fileOnExtension) {
                    show(extensionSelector);
                }
                else if (!fileOnMarketplace) {
                    show(extensionsBlock);
                }
                (0, dom_1.reset)(descriptionTitle, (0, nls_1.localize)('stepsToReproduce', "Steps to Reproduce") + ' ', (0, dom_1.$)('span.required-input', undefined, '*'));
                (0, dom_1.reset)(descriptionSubtitle, (0, nls_1.localize)('performanceIssueDesciption', "When did this performance issue happen? Does it occur on startup or after a specific series of actions? We support GitHub-flavored Markdown. You will be able to edit your issue and add screenshots when we preview it on GitHub."));
            }
            else if (issueType === 2 /* IssueType.FeatureRequest */) {
                (0, dom_1.reset)(descriptionTitle, (0, nls_1.localize)('description', "Description") + ' ', (0, dom_1.$)('span.required-input', undefined, '*'));
                (0, dom_1.reset)(descriptionSubtitle, (0, nls_1.localize)('featureRequestDescription', "Please describe the feature you would like to see. We support GitHub-flavored Markdown. You will be able to edit your issue and add screenshots when we preview it on GitHub."));
            }
        }
        validateInput(inputId) {
            const inputElement = this.getElementById(inputId);
            const inputValidationMessage = this.getElementById(`${inputId}-empty-error`);
            const descriptionShortMessage = this.getElementById(`description-short-error`);
            if (!inputElement.value) {
                inputElement.classList.add('invalid-input');
                inputValidationMessage?.classList.remove('hidden');
                descriptionShortMessage?.classList.add('hidden');
                return false;
            }
            else if (inputId === 'description' && inputElement.value.length < 10) {
                inputElement.classList.add('invalid-input');
                descriptionShortMessage?.classList.remove('hidden');
                inputValidationMessage?.classList.add('hidden');
                return false;
            }
            else {
                inputElement.classList.remove('invalid-input');
                inputValidationMessage?.classList.add('hidden');
                if (inputId === 'description') {
                    descriptionShortMessage?.classList.add('hidden');
                }
                return true;
            }
        }
        validateInputs() {
            let isValid = true;
            ['issue-title', 'description', 'issue-source'].forEach(elementId => {
                isValid = this.validateInput(elementId) && isValid;
            });
            if (this.issueReporterModel.fileOnExtension()) {
                isValid = this.validateInput('extension-selector') && isValid;
            }
            return isValid;
        }
        async submitToGitHub(issueTitle, issueBody, gitHubDetails) {
            const url = `https://api.github.com/repos/${gitHubDetails.owner}/${gitHubDetails.repositoryName}/issues`;
            const init = {
                method: 'POST',
                body: JSON.stringify({
                    title: issueTitle,
                    body: issueBody
                }),
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.configuration.data.githubAccessToken}`
                })
            };
            const response = await fetch(url, init);
            if (!response.ok) {
                console.error('Invalid GitHub URL provided.');
                return false;
            }
            const result = await response.json();
            await this.nativeHostService.openExternal(result.html_url);
            this.close();
            return true;
        }
        async createIssue() {
            const selectedExtension = this.issueReporterModel.getData().selectedExtension;
            const hasUri = selectedExtension?.hasIssueUriRequestHandler;
            const hasData = selectedExtension?.hasIssueDataProviders;
            // Short circuit if the extension provides a custom issue handler
            if (hasUri && !hasData) {
                const url = this.getExtensionBugsUrl();
                if (url) {
                    this.hasBeenSubmitted = true;
                    await this.nativeHostService.openExternal(url);
                    return true;
                }
            }
            if (!this.validateInputs()) {
                // If inputs are invalid, set focus to the first one and add listeners on them
                // to detect further changes
                const invalidInput = window_1.mainWindow.document.getElementsByClassName('invalid-input');
                if (invalidInput.length) {
                    invalidInput[0].focus();
                }
                this.addEventListener('issue-title', 'input', _ => {
                    this.validateInput('issue-title');
                });
                this.addEventListener('description', 'input', _ => {
                    this.validateInput('description');
                });
                this.addEventListener('issue-source', 'change', _ => {
                    this.validateInput('issue-source');
                });
                if (this.issueReporterModel.fileOnExtension()) {
                    this.addEventListener('extension-selector', 'change', _ => {
                        this.validateInput('extension-selector');
                    });
                }
                return false;
            }
            this.hasBeenSubmitted = true;
            const issueTitle = this.getElementById('issue-title').value;
            const issueBody = this.issueReporterModel.serialize();
            let issueUrl = hasUri ? this.getExtensionBugsUrl() : this.getIssueUrl();
            if (!issueUrl) {
                console.error('No issue url found');
                return false;
            }
            if (selectedExtension?.uri) {
                const uri = uri_1.URI.revive(selectedExtension.uri);
                issueUrl = uri.toString();
            }
            const gitHubDetails = this.parseGitHubUrl(issueUrl);
            if (this.configuration.data.githubAccessToken && gitHubDetails) {
                return this.submitToGitHub(issueTitle, issueBody, gitHubDetails);
            }
            const baseUrl = this.getIssueUrlWithTitle(this.getElementById('issue-title').value, issueUrl);
            let url = baseUrl + `&body=${encodeURIComponent(issueBody)}`;
            if (url.length > MAX_URL_LENGTH) {
                try {
                    url = await this.writeToClipboard(baseUrl, issueBody);
                }
                catch (_) {
                    console.error('Writing to clipboard failed');
                    return false;
                }
            }
            await this.nativeHostService.openExternal(url);
            return true;
        }
        async writeToClipboard(baseUrl, issueBody) {
            const shouldWrite = await this.issueMainService.$showClipboardDialog();
            if (!shouldWrite) {
                throw new errors_1.CancellationError();
            }
            await this.nativeHostService.writeClipboardText(issueBody);
            return baseUrl + `&body=${encodeURIComponent((0, nls_1.localize)('pasteData', "We have written the needed data into your clipboard because it was too large to send. Please paste."))}`;
        }
        getIssueUrl() {
            return this.issueReporterModel.fileOnExtension()
                ? this.getExtensionGitHubUrl()
                : this.issueReporterModel.getData().fileOnMarketplace
                    ? this.configuration.product.reportMarketplaceIssueUrl
                    : this.configuration.product.reportIssueUrl;
        }
        parseGitHubUrl(url) {
            // Assumes a GitHub url to a particular repo, https://github.com/repositoryName/owner.
            // Repository name and owner cannot contain '/'
            const match = /^https?:\/\/github\.com\/([^\/]*)\/([^\/]*).*/.exec(url);
            if (match && match.length) {
                return {
                    owner: match[1],
                    repositoryName: match[2]
                };
            }
            else {
                console.error('No GitHub match');
            }
            return undefined;
        }
        getExtensionGitHubUrl() {
            let repositoryUrl = '';
            const bugsUrl = this.getExtensionBugsUrl();
            const extensionUrl = this.getExtensionRepositoryUrl();
            // If given, try to match the extension's bug url
            if (bugsUrl && bugsUrl.match(/^https?:\/\/github\.com\/(.*)/)) {
                repositoryUrl = (0, issueReporterUtil_1.normalizeGitHubUrl)(bugsUrl);
            }
            else if (extensionUrl && extensionUrl.match(/^https?:\/\/github\.com\/(.*)/)) {
                repositoryUrl = (0, issueReporterUtil_1.normalizeGitHubUrl)(extensionUrl);
            }
            return repositoryUrl;
        }
        getIssueUrlWithTitle(issueTitle, repositoryUrl) {
            if (this.issueReporterModel.fileOnExtension()) {
                repositoryUrl = repositoryUrl + '/issues/new';
            }
            const queryStringPrefix = repositoryUrl.indexOf('?') === -1 ? '?' : '&';
            return `${repositoryUrl}${queryStringPrefix}title=${encodeURIComponent(issueTitle)}`;
        }
        updateSystemInfo(state) {
            const target = window_1.mainWindow.document.querySelector('.block-system .block-info');
            if (target) {
                const systemInfo = state.systemInfo;
                const renderedDataTable = (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'CPUs'), (0, dom_1.$)('td', undefined, systemInfo.cpus || '')), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'GPU Status'), (0, dom_1.$)('td', undefined, Object.keys(systemInfo.gpuStatus).map(key => `${key}: ${systemInfo.gpuStatus[key]}`).join('\n'))), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Load (avg)'), (0, dom_1.$)('td', undefined, systemInfo.load || '')), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Memory (System)'), (0, dom_1.$)('td', undefined, systemInfo.memory)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Process Argv'), (0, dom_1.$)('td', undefined, systemInfo.processArgs)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Screen Reader'), (0, dom_1.$)('td', undefined, systemInfo.screenReader)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'VM'), (0, dom_1.$)('td', undefined, systemInfo.vmHint)));
                (0, dom_1.reset)(target, renderedDataTable);
                systemInfo.remoteData.forEach(remote => {
                    target.appendChild((0, dom_1.$)('hr'));
                    if ((0, diagnostics_1.isRemoteDiagnosticError)(remote)) {
                        const remoteDataTable = (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Remote'), (0, dom_1.$)('td', undefined, remote.hostName)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, ''), (0, dom_1.$)('td', undefined, remote.errorMessage)));
                        target.appendChild(remoteDataTable);
                    }
                    else {
                        const remoteDataTable = (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Remote'), (0, dom_1.$)('td', undefined, remote.latency ? `${remote.hostName} (latency: ${remote.latency.current.toFixed(2)}ms last, ${remote.latency.average.toFixed(2)}ms average)` : remote.hostName)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'OS'), (0, dom_1.$)('td', undefined, remote.machineInfo.os)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'CPUs'), (0, dom_1.$)('td', undefined, remote.machineInfo.cpus || '')), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Memory (System)'), (0, dom_1.$)('td', undefined, remote.machineInfo.memory)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'VM'), (0, dom_1.$)('td', undefined, remote.machineInfo.vmHint)));
                        target.appendChild(remoteDataTable);
                    }
                });
            }
        }
        updateExtensionSelector(extensions) {
            const extensionOptions = extensions.map(extension => {
                return {
                    name: extension.displayName || extension.name || '',
                    id: extension.id
                };
            });
            // Sort extensions by name
            extensionOptions.sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                if (aName > bName) {
                    return 1;
                }
                if (aName < bName) {
                    return -1;
                }
                return 0;
            });
            const makeOption = (extension, selectedExtension) => {
                const selected = selectedExtension && extension.id === selectedExtension.id;
                return (0, dom_1.$)('option', {
                    'value': extension.id,
                    'selected': selected || ''
                }, extension.name);
            };
            const extensionsSelector = this.getElementById('extension-selector');
            if (extensionsSelector) {
                const { selectedExtension } = this.issueReporterModel.getData();
                (0, dom_1.reset)(extensionsSelector, this.makeOption('', (0, nls_1.localize)('selectExtension', "Select extension"), true), ...extensionOptions.map(extension => makeOption(extension, selectedExtension)));
                if (!selectedExtension) {
                    extensionsSelector.selectedIndex = 0;
                }
                this.addEventListener('extension-selector', 'change', async (e) => {
                    this.clearExtensionData();
                    const selectedExtensionId = e.target.value;
                    this.selectedExtension = selectedExtensionId;
                    const extensions = this.issueReporterModel.getData().allExtensions;
                    const matches = extensions.filter(extension => extension.id === selectedExtensionId);
                    if (matches.length) {
                        this.issueReporterModel.update({ selectedExtension: matches[0] });
                        const selectedExtension = this.issueReporterModel.getData().selectedExtension;
                        if (selectedExtension) {
                            const iconElement = document.createElement('span');
                            iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.loading), 'codicon-modifier-spin');
                            this.setLoading(iconElement);
                            const openReporterData = await this.sendReporterMenu(selectedExtension);
                            if (openReporterData) {
                                if (this.selectedExtension === selectedExtensionId) {
                                    this.removeLoading(iconElement, true);
                                    this.configuration.data = openReporterData;
                                }
                                else if (this.selectedExtension !== selectedExtensionId) {
                                }
                            }
                            else {
                                if (!this.loadingExtensionData) {
                                    iconElement.classList.remove(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.loading), 'codicon-modifier-spin');
                                }
                                this.removeLoading(iconElement);
                                // if not using command, should have no configuration data in fields we care about and check later.
                                this.clearExtensionData();
                                // case when previous extension was opened from normal openIssueReporter command
                                selectedExtension.data = undefined;
                                selectedExtension.uri = undefined;
                            }
                            if (this.selectedExtension === selectedExtensionId) {
                                // repopulates the fields with the new data given the selected extension.
                                this.updateExtensionStatus(matches[0]);
                                this.openReporter = false;
                            }
                        }
                        else {
                            this.issueReporterModel.update({ selectedExtension: undefined });
                            this.clearSearchResults();
                            this.clearExtensionData();
                            this.validateSelectedExtension();
                            this.updateExtensionStatus(matches[0]);
                        }
                    }
                });
            }
            this.addEventListener('problem-source', 'change', (_) => {
                this.validateSelectedExtension();
            });
        }
        clearExtensionData() {
            this.issueReporterModel.update({ extensionData: undefined });
            this.configuration.data.issueBody = undefined;
            this.configuration.data.data = undefined;
            this.configuration.data.uri = undefined;
        }
        async updateExtensionStatus(extension) {
            this.issueReporterModel.update({ selectedExtension: extension });
            // uses this.configuuration.data to ensure that data is coming from `openReporter` command.
            const template = this.configuration.data.issueBody;
            if (template) {
                const descriptionTextArea = this.getElementById('description');
                const descriptionText = descriptionTextArea.value;
                if (descriptionText === '' || !descriptionText.includes(template.toString())) {
                    const fullTextArea = descriptionText + (descriptionText === '' ? '' : '\n') + template.toString();
                    descriptionTextArea.value = fullTextArea;
                    this.issueReporterModel.update({ issueDescription: fullTextArea });
                }
            }
            const data = this.configuration.data.data;
            if (data) {
                this.issueReporterModel.update({ extensionData: data });
                extension.data = data;
                const extensionDataBlock = window_1.mainWindow.document.querySelector('.block-extension-data');
                show(extensionDataBlock);
                this.renderBlocks();
            }
            const uri = this.configuration.data.uri;
            if (uri) {
                extension.uri = uri;
                this.updateIssueReporterUri(extension);
            }
            // if extension does not have provider/handles, will check for either. If extension is already active, IPC will return [false, false] and will proceed as normal.
            if (!extension.hasIssueDataProviders && !extension.hasIssueUriRequestHandler) {
                const toActivate = await this.getReporterStatus(extension);
                extension.hasIssueDataProviders = toActivate[0];
                extension.hasIssueUriRequestHandler = toActivate[1];
            }
            if (extension.hasIssueUriRequestHandler && extension.hasIssueDataProviders) {
                // update this first
                const template = await this.getIssueTemplateFromExtension(extension);
                const descriptionTextArea = this.getElementById('description');
                const descriptionText = descriptionTextArea.value;
                if (descriptionText === '' || !descriptionText.includes(template)) {
                    const fullTextArea = descriptionText + (descriptionText === '' ? '' : '\n') + template;
                    descriptionTextArea.value = fullTextArea;
                    this.issueReporterModel.update({ issueDescription: fullTextArea });
                }
                const extensionDataBlock = window_1.mainWindow.document.querySelector('.block-extension-data');
                show(extensionDataBlock);
                // Start loading for extension data.
                const iconElement = document.createElement('span');
                iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.loading), 'codicon-modifier-spin');
                this.setLoading(iconElement);
                await this.getIssueDataFromExtension(extension);
                this.removeLoading(iconElement);
                // then update this
                this.updateIssueReporterUri(extension);
            }
            else if (extension.hasIssueUriRequestHandler) {
                this.updateIssueReporterUri(extension);
            }
            else if (extension.hasIssueDataProviders) {
                const template = await this.getIssueTemplateFromExtension(extension);
                const descriptionTextArea = this.getElementById('description');
                const descriptionText = descriptionTextArea.value;
                if (descriptionText === '' || !descriptionText.includes(template)) {
                    const fullTextArea = descriptionText + (descriptionText === '' ? '' : '\n') + template;
                    descriptionTextArea.value = fullTextArea;
                    this.issueReporterModel.update({ issueDescription: fullTextArea });
                }
                const extensionDataBlock = window_1.mainWindow.document.querySelector('.block-extension-data');
                show(extensionDataBlock);
                // Start loading for extension data.
                const iconElement = document.createElement('span');
                iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.loading), 'codicon-modifier-spin');
                this.setLoading(iconElement);
                await this.getIssueDataFromExtension(extension);
                this.removeLoading(iconElement);
            }
            this.validateSelectedExtension();
            const title = this.getElementById('issue-title').value;
            this.searchExtensionIssues(title);
            this.updatePreviewButtonState();
            this.renderBlocks();
        }
        validateSelectedExtension() {
            const extensionValidationMessage = this.getElementById('extension-selection-validation-error');
            const extensionValidationNoUrlsMessage = this.getElementById('extension-selection-validation-error-no-url');
            hide(extensionValidationMessage);
            hide(extensionValidationNoUrlsMessage);
            const extension = this.issueReporterModel.getData().selectedExtension;
            if (!extension) {
                this.previewButton.enabled = true;
                return;
            }
            if (this.loadingExtensionData) {
                return;
            }
            const hasValidGitHubUrl = this.getExtensionGitHubUrl();
            if (hasValidGitHubUrl || (extension.hasIssueUriRequestHandler && !extension.hasIssueDataProviders)) {
                this.previewButton.enabled = true;
            }
            else {
                this.setExtensionValidationMessage();
                this.previewButton.enabled = false;
            }
        }
        setLoading(element) {
            // Show loading
            this.receivedExtensionData = false;
            this.openReporter = true;
            this.loadingExtensionData = true;
            this.updatePreviewButtonState();
            const extensionDataCaption = this.getElementById('extension-id');
            hide(extensionDataCaption);
            const extensionDataCaption2 = Array.from(window_1.mainWindow.document.querySelectorAll('.ext-parens'));
            extensionDataCaption2.forEach(extensionDataCaption2 => hide(extensionDataCaption2));
            const showLoading = this.getElementById('ext-loading');
            show(showLoading);
            while (showLoading.firstChild) {
                showLoading.removeChild(showLoading.firstChild);
            }
            showLoading.append(element);
            this.renderBlocks();
        }
        removeLoading(element, fromReporter = false) {
            this.openReporter = fromReporter;
            this.loadingExtensionData = false;
            this.updatePreviewButtonState();
            const extensionDataCaption = this.getElementById('extension-id');
            show(extensionDataCaption);
            const extensionDataCaption2 = Array.from(window_1.mainWindow.document.querySelectorAll('.ext-parens'));
            extensionDataCaption2.forEach(extensionDataCaption2 => show(extensionDataCaption2));
            const hideLoading = this.getElementById('ext-loading');
            hide(hideLoading);
            if (hideLoading.firstChild) {
                hideLoading.removeChild(element);
            }
            this.renderBlocks();
        }
        setExtensionValidationMessage() {
            const extensionValidationMessage = this.getElementById('extension-selection-validation-error');
            const extensionValidationNoUrlsMessage = this.getElementById('extension-selection-validation-error-no-url');
            const bugsUrl = this.getExtensionBugsUrl();
            if (bugsUrl) {
                show(extensionValidationMessage);
                const link = this.getElementById('extensionBugsLink');
                link.textContent = bugsUrl;
                return;
            }
            const extensionUrl = this.getExtensionRepositoryUrl();
            if (extensionUrl) {
                show(extensionValidationMessage);
                const link = this.getElementById('extensionBugsLink');
                link.textContent = extensionUrl;
                return;
            }
            show(extensionValidationNoUrlsMessage);
        }
        updateProcessInfo(state) {
            const target = window_1.mainWindow.document.querySelector('.block-process .block-info');
            if (target) {
                (0, dom_1.reset)(target, (0, dom_1.$)('code', undefined, state.processInfo ?? ''));
            }
        }
        updateWorkspaceInfo(state) {
            window_1.mainWindow.document.querySelector('.block-workspace .block-info code').textContent = '\n' + state.workspaceInfo;
        }
        updateExtensionTable(extensions, numThemeExtensions) {
            const target = window_1.mainWindow.document.querySelector('.block-extensions .block-info');
            if (target) {
                if (this.configuration.disableExtensions) {
                    (0, dom_1.reset)(target, (0, nls_1.localize)('disabledExtensions', "Extensions are disabled"));
                    return;
                }
                const themeExclusionStr = numThemeExtensions ? `\n(${numThemeExtensions} theme extensions excluded)` : '';
                extensions = extensions || [];
                if (!extensions.length) {
                    target.innerText = 'Extensions: none' + themeExclusionStr;
                    return;
                }
                (0, dom_1.reset)(target, this.getExtensionTableHtml(extensions), document.createTextNode(themeExclusionStr));
            }
        }
        updateRestrictedMode(restrictedMode) {
            this.issueReporterModel.update({ restrictedMode });
        }
        updateUnsupportedMode(isUnsupported) {
            this.issueReporterModel.update({ isUnsupported });
        }
        updateExperimentsInfo(experimentInfo) {
            this.issueReporterModel.update({ experimentInfo });
            const target = window_1.mainWindow.document.querySelector('.block-experiments .block-info');
            if (target) {
                target.textContent = experimentInfo ? experimentInfo : (0, nls_1.localize)('noCurrentExperiments', "No current experiments.");
            }
        }
        getExtensionTableHtml(extensions) {
            return (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, 'Extension'), (0, dom_1.$)('th', undefined, 'Author (truncated)'), (0, dom_1.$)('th', undefined, 'Version')), ...extensions.map(extension => (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, extension.name), (0, dom_1.$)('td', undefined, extension.publisher?.substr(0, 3) ?? 'N/A'), (0, dom_1.$)('td', undefined, extension.version))));
        }
        openLink(event) {
            event.preventDefault();
            event.stopPropagation();
            // Exclude right click
            if (event.which < 3) {
                (0, dom_1.windowOpenNoOpener)(event.target.href);
            }
        }
        getElementById(elementId) {
            const element = window_1.mainWindow.document.getElementById(elementId);
            if (element) {
                return element;
            }
            else {
                return undefined;
            }
        }
        addEventListener(elementId, eventType, handler) {
            const element = this.getElementById(elementId);
            element?.addEventListener(eventType, handler);
        }
    };
    exports.IssueReporter = IssueReporter;
    __decorate([
        (0, decorators_1.debounce)(300)
    ], IssueReporter.prototype, "searchGitHub", null);
    __decorate([
        (0, decorators_1.debounce)(300)
    ], IssueReporter.prototype, "searchDuplicates", null);
    exports.IssueReporter = IssueReporter = __decorate([
        __param(1, native_1.INativeHostService),
        __param(2, issue_1.IIssueMainService)
    ], IssueReporter);
    // helper functions
    function hide(el) {
        el?.classList.add('hidden');
    }
    function show(el) {
        el?.classList.remove('hidden');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVSZXBvcnRlclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2NvZGUvZWxlY3Ryb24tc2FuZGJveC9pc3N1ZS9pc3N1ZVJlcG9ydGVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBeWlEQSxvQkFFQztJQUNELG9CQUVDO0lBbmhERCwrRkFBK0Y7SUFDL0Ysd0RBQXdEO0lBQ3hELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQztJQVE1QixJQUFLLFdBSUo7SUFKRCxXQUFLLFdBQVc7UUFDZixnQ0FBaUIsQ0FBQTtRQUNqQixzQ0FBdUIsQ0FBQTtRQUN2QiwwQ0FBMkIsQ0FBQTtJQUM1QixDQUFDLEVBSkksV0FBVyxLQUFYLFdBQVcsUUFJZjtJQUVNLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWMsU0FBUSxzQkFBVTtRQWM1QyxZQUNrQixhQUErQyxFQUM1QyxpQkFBc0QsRUFDdkQsZ0JBQW9EO1lBRXZFLEtBQUssRUFBRSxDQUFDO1lBSlMsa0JBQWEsR0FBYixhQUFhLENBQWtDO1lBQzNCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDdEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQWZoRSxtQ0FBOEIsR0FBRyxDQUFDLENBQUM7WUFDbkMsdUJBQWtCLEdBQUcsS0FBSyxDQUFDO1lBQzNCLDBCQUFxQixHQUFHLEtBQUssQ0FBQztZQUM5Qiw0QkFBdUIsR0FBRyxLQUFLLENBQUM7WUFDaEMsc0JBQWlCLEdBQUcsS0FBSyxDQUFDO1lBQzFCLHFCQUFnQixHQUFHLEtBQUssQ0FBQztZQUN6QixpQkFBWSxHQUFHLEtBQUssQ0FBQztZQUNyQix5QkFBb0IsR0FBRyxLQUFLLENBQUM7WUFDN0Isc0JBQWlCLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLGtCQUFhLEdBQUcsSUFBSSxlQUFP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