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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/languages", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/nls", "vs/platform/files/common/files", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "./suggestWidgetDetails"], function (require, exports, dom_1, iconLabel_1, codicons_1, themables_1, event_1, filters_1, lifecycle_1, uri_1, languages_1, getIconClasses_1, model_1, language_1, nls, files_1, iconRegistry_1, themeService_1, suggestWidgetDetails_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ItemRenderer = void 0;
    exports.getAriaId = getAriaId;
    function getAriaId(index) {
        return `suggest-aria-id:${index}`;
    }
    const suggestMoreInfoIcon = (0, iconRegistry_1.registerIcon)('suggest-more-info', codicons_1.Codicon.chevronRight, nls.localize('suggestMoreInfoIcon', 'Icon for more information in the suggest widget.'));
    const _completionItemColor = new class ColorExtractor {
        static { this._regexRelaxed = /(#([\da-fA-F]{3}){1,2}|(rgb|hsl)a\(\s*(\d{1,3}%?\s*,\s*){3}(1|0?\.\d+)\)|(rgb|hsl)\(\s*\d{1,3}%?(\s*,\s*\d{1,3}%?){2}\s*\))/; }
        static { this._regexStrict = new RegExp(`^${ColorExtractor._regexRelaxed.source}$`, 'i'); }
        extract(item, out) {
            if (item.textLabel.match(ColorExtractor._regexStrict)) {
                out[0] = item.textLabel;
                return true;
            }
            if (item.completion.detail && item.completion.detail.match(ColorExtractor._regexStrict)) {
                out[0] = item.completion.detail;
                return true;
            }
            if (item.completion.documentation) {
                const value = typeof item.completion.documentation === 'string'
                    ? item.completion.documentation
                    : item.completion.documentation.value;
                const match = ColorExtractor._regexRelaxed.exec(value);
                if (match && (match.index === 0 || match.index + match[0].length === value.length)) {
                    out[0] = match[0];
                    return true;
                }
            }
            return false;
        }
    };
    let ItemRenderer = class ItemRenderer {
        constructor(_editor, _modelService, _languageService, _themeService) {
            this._editor = _editor;
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._themeService = _themeService;
            this._onDidToggleDetails = new event_1.Emitter();
            this.onDidToggleDetails = this._onDidToggleDetails.event;
            this.templateId = 'suggestion';
        }
        dispose() {
            this._onDidToggleDetails.dispose();
        }
        renderTemplate(container) {
            const disposables = new lifecycle_1.DisposableStore();
            const root = container;
            root.classList.add('show-file-icons');
            const icon = (0, dom_1.append)(container, (0, dom_1.$)('.icon'));
            const colorspan = (0, dom_1.append)(icon, (0, dom_1.$)('span.colorspan'));
            const text = (0, dom_1.append)(container, (0, dom_1.$)('.contents'));
            const main = (0, dom_1.append)(text, (0, dom_1.$)('.main'));
            const iconContainer = (0, dom_1.append)(main, (0, dom_1.$)('.icon-label.codicon'));
            const left = (0, dom_1.append)(main, (0, dom_1.$)('span.left'));
            const right = (0, dom_1.append)(main, (0, dom_1.$)('span.right'));
            const iconLabel = new iconLabel_1.IconLabel(left, { supportHighlights: true, supportIcons: true });
            disposables.add(iconLabel);
            const parametersLabel = (0, dom_1.append)(left, (0, dom_1.$)('span.signature-label'));
            const qualifierLabel = (0, dom_1.append)(left, (0, dom_1.$)('span.qualifier-label'));
            const detailsLabel = (0, dom_1.append)(right, (0, dom_1.$)('span.details-label'));
            const readMore = (0, dom_1.append)(right, (0, dom_1.$)('span.readMore' + themables_1.ThemeIcon.asCSSSelector(suggestMoreInfoIcon)));
            readMore.title = nls.localize('readMore', "Read More");
            const configureFont = () => {
                const options = this._editor.getOptions();
                const fontInfo = options.get(50 /* EditorOption.fontInfo */);
                const fontFamily = fontInfo.getMassagedFontFamily();
                const fontFeatureSettings = fontInfo.fontFeatureSettings;
                const fontSize = options.get(119 /* EditorOption.suggestFontSize */) || fontInfo.fontSize;
                const lineHeight = options.get(120 /* EditorOption.suggestLineHeight */) || fontInfo.lineHeight;
                const fontWeight = fontInfo.fontWeight;
                const letterSpacing = fontInfo.letterSpacing;
                const fontSizePx = `${fontSize}px`;
                const lineHeightPx = `${lineHeight}px`;
                const letterSpacingPx = `${letterSpacing}px`;
                root.style.fontSize = fontSizePx;
                root.style.fontWeight = fontWeight;
                root.style.letterSpacing = letterSpacingPx;
                main.style.fontFamily = fontFamily;
                main.style.fontFeatureSettings = fontFeatureSettings;
                main.style.lineHeight = lineHeightPx;
                icon.style.height = lineHeightPx;
                icon.style.width = lineHeightPx;
                readMore.style.height = lineHeightPx;
                readMore.style.width = lineHeightPx;
            };
            return { root, left, right, icon, colorspan, iconLabel, iconContainer, parametersLabel, qualifierLabel, detailsLabel, readMore, disposables, configureFont };
        }
        renderElement(element, index, data) {
            data.configureFont();
            const { completion } = element;
            data.root.id = getAriaId(index);
            data.colorspan.style.backgroundColor = '';
            const labelOptions = {
                labelEscapeNewLines: true,
                matches: (0, filters_1.createMatches)(element.score)
            };
            const color = [];
            if (completion.kind === 19 /* CompletionItemKind.Color */ && _completionItemColor.extract(element, color)) {
                // special logic for 'color' completion items
                data.icon.className = 'icon customcolor';
                data.iconContainer.className = 'icon hide';
                data.colorspan.style.backgroundColor = color[0];
            }
            else if (completion.kind === 20 /* CompletionItemKind.File */ && this._themeService.getFileIconTheme().hasFileIcons) {
                // special logic for 'file' completion items
                data.icon.className = 'icon hide';
                data.iconContainer.className = 'icon hide';
                const labelClasses = (0, getIconClasses_1.getIconClasses)(this._modelService, this._languageService, uri_1.URI.from({ scheme: 'fake', path: element.textLabel }), files_1.FileKind.FILE);
                const detailClasses = (0, getIconClasses_1.getIconClasses)(this._modelService, this._languageService, uri_1.URI.from({ scheme: 'fake', path: completion.detail }), files_1.FileKind.FILE);
                labelOptions.extraClasses = labelClasses.length > detailClasses.length ? labelClasses : detailClasses;
            }
            else if (completion.kind === 23 /* CompletionItemKind.Folder */ && this._themeService.getFileIconTheme().hasFolderIcons) {
                // special logic for 'folder' completion items
                data.icon.className = 'icon hide';
                data.iconContainer.className = 'icon hide';
                labelOptions.extraClasses = [
                    (0, getIconClasses_1.getIconClasses)(this._modelService, this._languageService, uri_1.URI.from({ scheme: 'fake', path: element.textLabel }), files_1.FileKind.FOLDER),
                    (0, getIconClasses_1.getIconClasses)(this._modelService, this._languageService, uri_1.URI.from({ scheme: 'fake', path: completion.detail }), files_1.FileKind.FOLDER)
                ].flat();
            }
            else {
                // normal icon
                data.icon.className = 'icon hide';
                data.iconContainer.className = '';
                data.iconContainer.classList.add('suggest-icon', ...themables_1.ThemeIcon.asClassNameArray(languages_1.CompletionItemKinds.toIcon(completion.kind)));
            }
            if (completion.tags && completion.tags.indexOf(1 /* CompletionItemTag.Deprecated */) >= 0) {
                labelOptions.extraClasses = (labelOptions.extraClasses || []).concat(['deprecated']);
                labelOptions.matches = [];
            }
            data.iconLabel.setLabel(element.textLabel, undefined, labelOptions);
            if (typeof completion.label === 'string') {
                data.parametersLabel.textContent = '';
                data.detailsLabel.textContent = stripNewLines(completion.detail || '');
                data.root.classList.add('string-label');
            }
            else {
                data.parametersLabel.textContent = stripNewLines(completion.label.detail || '');
                data.detailsLabel.textContent = stripNewLines(completion.label.description || '');
                data.root.classList.remove('string-label');
            }
            if (this._editor.getOption(118 /* EditorOption.suggest */).showInlineDetails) {
                (0, dom_1.show)(data.detailsLabel);
            }
            else {
                (0, dom_1.hide)(data.detailsLabel);
            }
            if ((0, suggestWidgetDetails_1.canExpandCompletionItem)(element)) {
                data.right.classList.add('can-expand-details');
                (0, dom_1.show)(data.readMore);
                data.readMore.onmousedown = e => {
                    e.stopPropagation();
                    e.preventDefault();
                };
                data.readMore.onclick = e => {
                    e.stopPropagation();
                    e.preventDefault();
                    this._onDidToggleDetails.fire();
                };
            }
            else {
                data.right.classList.remove('can-expand-details');
                (0, dom_1.hide)(data.readMore);
                data.readMore.onmousedown = null;
                data.readMore.onclick = null;
            }
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    exports.ItemRenderer = ItemRenderer;
    exports.ItemRenderer = ItemRenderer = __decorate([
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService),
        __param(3, themeService_1.IThemeService)
    ], ItemRenderer);
    function stripNewLines(str) {
        return str.replace(/\r\n|\r|\n/g, '');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdFdpZGdldFJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zdWdnZXN0L2Jyb3dzZXIvc3VnZ2VzdFdpZGdldFJlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXdCaEcsOEJBRUM7SUFGRCxTQUFnQixTQUFTLENBQUMsS0FBYTtRQUN0QyxPQUFPLG1CQUFtQixLQUFLLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRUQsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsbUJBQW1CLEVBQUUsa0JBQU8sQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxrREFBa0QsQ0FBQyxDQUFDLENBQUM7SUFFN0ssTUFBTSxvQkFBb0IsR0FBRyxJQUFJLE1BQU0sY0FBYztpQkFFckMsa0JBQWEsR0FBRyw2SEFBNkgsQ0FBQztpQkFDOUksaUJBQVksR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLGNBQWMsQ0FBQyxhQUFhLENBQUMsTUFBTSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFMUYsT0FBTyxDQUFDLElBQW9CLEVBQUUsR0FBYTtZQUMxQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDeEIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxFQUFFLENB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