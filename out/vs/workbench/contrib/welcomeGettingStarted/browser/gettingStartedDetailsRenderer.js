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
define(["require", "exports", "vs/base/common/uuid", "vs/editor/common/languages/supports/tokenization", "vs/editor/common/languages", "vs/workbench/contrib/markdown/browser/markdownDocumentRenderer", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/types", "vs/workbench/contrib/webview/common/webview", "vs/base/common/map", "vs/platform/files/common/files", "vs/platform/notification/common/notification", "vs/editor/common/languages/language", "vs/workbench/services/extensions/common/extensions"], function (require, exports, uuid_1, tokenization_1, languages_1, markdownDocumentRenderer_1, platform_1, resources_1, types_1, webview_1, map_1, files_1, notification_1, language_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GettingStartedDetailsRenderer = void 0;
    let GettingStartedDetailsRenderer = class GettingStartedDetailsRenderer {
        constructor(fileService, notificationService, extensionService, languageService) {
            this.fileService = fileService;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.languageService = languageService;
            this.mdCache = new map_1.ResourceMap();
            this.svgCache = new map_1.ResourceMap();
        }
        async renderMarkdown(path, base) {
            const content = await this.readAndCacheStepMarkdown(path, base);
            const nonce = (0, uuid_1.generateUuid)();
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const css = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
            const inDev = document.location.protocol === 'http:';
            const imgSrcCsp = inDev ? 'img-src https: data: http:' : 'img-src https: data:';
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; ${imgSrcCsp}; media-src https:; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}';">
				<style nonce="${nonce}">
					${markdownDocumentRenderer_1.DEFAULT_MARKDOWN_STYLES}
					${css}
					body > img {
						align-self: flex-start;
					}
					body > img[centered] {
						align-self: center;
					}
					body {
						display: flex;
						flex-direction: column;
						padding: 0;
						height: inherit;
					}
					.theme-picker-row {
						display: flex;
						justify-content: center;
						gap: 32px;
					}
					checklist {
						display: flex;
						gap: 32px;
						flex-direction: column;
					}
					checkbox {
						display: flex;
						flex-direction: column;
						align-items: center;
						margin: 5px;
						cursor: pointer;
					}
					checkbox > img {
						margin-bottom: 8px !important;
					}
					checkbox.checked > img {
						box-sizing: border-box;
					}
					checkbox.checked > img {
						outline: 2px solid var(--vscode-focusBorder);
						outline-offset: 4px;
						border-radius: 4px;
					}
					.theme-picker-link {
						margin-top: 16px;
						color: var(--vscode-textLink-foreground);
					}
					blockquote > p:first-child {
						margin-top: 0;
					}
					body > * {
						margin-block-end: 0.25em;
						margin-block-start: 0.25em;
					}
					vertically-centered {
						padding-top: 5px;
						padding-bottom: 5px;
						display: flex;
						justify-content: center;
						flex-direction: column;
					}
					html {
						height: 100%;
						padding-right: 32px;
					}
					h1 {
						font-size: 19.5px;
					}
					h2 {
						font-size: 18.5px;
					}
				</style>
			</head>
			<body>
				<vertically-centered>
					${content}
				</vertically-centered>
			</body>
			<script nonce="${nonce}">
				const vscode = acquireVsCodeApi();

				document.querySelectorAll('[when-checked]').forEach(el => {
					el.addEventListener('click', () => {
						vscode.postMessage(el.getAttribute('when-checked'));
					});
				});

				let ongoingLayout = undefined;
				const doLayout = () => {
					document.querySelectorAll('vertically-centered').forEach(element => {
						element.style.marginTop = Math.max((document.body.clientHeight - element.scrollHeight) * 3/10, 0) + 'px';
					});
					ongoingLayout = undefined;
				};

				const layout = () => {
					if (ongoingLayout) {
						clearTimeout(ongoingLayout);
					}
					ongoingLayout = setTimeout(doLayout, 0);
				};

				layout();

				document.querySelectorAll('img').forEach(element => {
					element.onload = layout;
				})

				window.addEventListener('message', event => {
					if (event.data.layoutMeNow) {
						layout();
					}
					if (event.data.enabledContextKeys) {
						document.querySelectorAll('.checked').forEach(element => element.classList.remove('checked'))
						for (const key of event.data.enabledContextKeys) {
							document.querySelectorAll('[checked-on="' + key + '"]').forEach(element => element.classList.add('checked'))
						}
					}
				});
		</script>
		</html>`;
        }
        async renderSVG(path) {
            const content = await this.readAndCacheSVGFile(path);
            const nonce = (0, uuid_1.generateUuid)();
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const css = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'nonce-${nonce}';">
				<style nonce="${nonce}">
					${markdownDocumentRenderer_1.DEFAULT_MARKDOWN_STYLES}
					${css}
					svg {
						position: fixed;
						height: 100%;
						width: 80%;
						left: 50%;
						top: 50%;
						max-width: 530px;
						min-width: 350px;
						transform: translate(-50%,-50%);
					}
				</style>
			</head>
			<body>
				${content}
			</body>
		</html>`;
        }
        async readAndCacheSVGFile(path) {
            if (!this.svgCache.has(path)) {
                const contents = await this.readContentsOfPath(path, false);
                this.svgCache.set(path, contents);
            }
            return (0, types_1.assertIsDefined)(this.svgCache.get(path));
        }
        async readAndCacheStepMarkdown(path, base) {
            if (!this.mdCache.has(path)) {
                const contents = await this.readContentsOfPath(path);
                const markdownContents = await (0, markdownDocumentRenderer_1.renderMarkdownDocument)(transformUris(contents, base), this.extensionService, this.languageService, true, true);
                this.mdCache.set(path, markdownContents);
            }
            return (0, types_1.assertIsDefined)(this.mdCache.get(path));
        }
        async readContentsOfPath(path, useModuleId = true) {
            try {
                const moduleId = JSON.parse(path.query).moduleId;
                if (useModuleId && moduleId) {
                    const contents = await new Promise(c => {
                        require([moduleId], content => {
                            c(content.default());
                        });
                    });
                    return contents;
                }
            }
            catch { }
            try {
                const localizedPath = path.with({ path: path.path.replace(/\.md$/, `.nls.${platform_1.language}.md`) });
                const generalizedLocale = platform_1.language?.replace(/-.*$/, '');
                const generalizedLocalizedPath = path.with({ path: path.path.replace(/\.md$/, `.nls.${generalizedLocale}.md`) });
                const fileExists = (file) => this.fileService
                    .stat(file)
                    .then((stat) => !!stat.size) // Double check the file actually has content for fileSystemProviders that fake `stat`. #131809
                    .catch(() => false);
                const [localizedFileExists, generalizedLocalizedFileExists] = await Promise.all([
                    fileExists(localizedPath),
                    fileExists(generalizedLocalizedPath),
                ]);
                const bytes = await this.fileService.readFile(localizedFileExists
                    ? localizedPath
                    : generalizedLocalizedFileExists
                        ? generalizedLocalizedPath
                        : path);
                return bytes.value.toString();
            }
            catch (e) {
                this.notificationService.error('Error reading markdown document at `' + path + '`: ' + e);
                return '';
            }
        }
    };
    exports.GettingStartedDetailsRenderer = GettingStartedDetailsRenderer;
    exports.GettingStartedDetailsRenderer = GettingStartedDetailsRenderer = __decorate([
        __param(0, files_1.IFileService),
        __param(1, notification_1.INotificationService),
        __param(2, extensions_1.IExtensionService),
        __param(3, language_1.ILanguageService)
    ], GettingStartedDetailsRenderer);
    const transformUri = (src, base) => {
        const path = (0, resources_1.joinPath)(base, src);
        return (0, webview_1.asWebviewUri)(path).toString(true);
    };
    const transformUris = (content, base) => content
        .replace(/src="([^"]*)"/g, (_, src) => {
        if (src.startsWith('https://')) {
            return `src="${src}"`;
        }
        return `src="${transformUri(src, base)}"`;
    })
        .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (_, title, src) => {
        if (src.startsWith('https://')) {
            return `![${title}](${src})`;
        }
        return `![${title}](${transformUri(src, base)})`;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0dGluZ1N0YXJ0ZWREZXRhaWxzUmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlbGNvbWVHZXR0aW5nU3RhcnRlZC9icm93c2VyL2dldHRpbmdTdGFydGVkRGV0YWlsc1JlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCekYsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBNkI7UUFJekMsWUFDZSxXQUEwQyxFQUNsQyxtQkFBMEQsRUFDN0QsZ0JBQW9ELEVBQ3JELGVBQWtEO1lBSHJDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2pCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDNUMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNwQyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFQN0QsWUFBTyxHQUFHLElBQUksaUJBQVcsRUFBVSxDQUFDO1lBQ3BDLGFBQVEsR0FBRyxJQUFJLGlCQUFXLEVBQVUsQ0FBQztRQU96QyxDQUFDO1FBRUwsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFTLEVBQUUsSUFBUztZQUN4QyxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDaEUsTUFBTSxLQUFLLEdBQUcsSUFBQSxtQkFBWSxHQUFFLENBQUM7WUFDN0IsTUFBTSxRQUFRLEdBQUcsZ0NBQW9CLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFcEQsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFBLDJDQUE0QixFQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFFbkUsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFFB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