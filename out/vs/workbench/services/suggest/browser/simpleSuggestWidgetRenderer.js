/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/themables"], function (require, exports, dom_1, iconLabel_1, codicons_1, event_1, filters_1, lifecycle_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleSuggestWidgetItemRenderer = void 0;
    exports.getAriaId = getAriaId;
    function getAriaId(index) {
        return `simple-suggest-aria-id:${index}`;
    }
    class SimpleSuggestWidgetItemRenderer {
        constructor() {
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
            // const readMore = append(right, $('span.readMore' + ThemeIcon.asCSSSelector(suggestMoreInfoIcon)));
            // readMore.title = nls.localize('readMore', "Read More");
            const configureFont = () => {
                // TODO: Implement
                // const options = this._editor.getOptions();
                // const fontInfo = options.get(EditorOption.fontInfo);
                const fontFamily = 'Hack'; //fontInfo.getMassagedFontFamily();
                const fontFeatureSettings = ''; //fontInfo.fontFeatureSettings;
                const fontSize = '12'; // = options.get(EditorOption.suggestFontSize) || fontInfo.fontSize;
                const lineHeight = '20'; // options.get(EditorOption.suggestLineHeight) || fontInfo.lineHeight;
                const fontWeight = 'normal'; //fontInfo.fontWeight;
                const letterSpacing = '0'; // fontInfo.letterSpacing;
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
                // readMore.style.height = lineHeightPx;
                // readMore.style.width = lineHeightPx;
            };
            configureFont();
            // data.disposables.add(this._editor.onDidChangeConfiguration(e => {
            // 	if (e.hasChanged(EditorOption.fontInfo) || e.hasChanged(EditorOption.suggestFontSize) || e.hasChanged(EditorOption.suggestLineHeight)) {
            // 		configureFont();
            // 	}
            // }));
            return { root, left, right, icon, colorspan, iconLabel, iconContainer, parametersLabel, qualifierLabel, detailsLabel, disposables };
        }
        renderElement(element, index, data) {
            const { completion } = element;
            data.root.id = getAriaId(index);
            data.colorspan.style.backgroundColor = '';
            const labelOptions = {
                labelEscapeNewLines: true,
                matches: (0, filters_1.createMatches)(element.score)
            };
            // const color: string[] = [];
            // if (completion.kind === CompletionItemKind.Color && _completionItemColor.extract(element, color)) {
            // 	// special logic for 'color' completion items
            // 	data.icon.className = 'icon customcolor';
            // 	data.iconContainer.className = 'icon hide';
            // 	data.colorspan.style.backgroundColor = color[0];
            // } else if (completion.kind === CompletionItemKind.File && this._themeService.getFileIconTheme().hasFileIcons) {
            // 	// special logic for 'file' completion items
            // 	data.icon.className = 'icon hide';
            // 	data.iconContainer.className = 'icon hide';
            // 	const labelClasses = getIconClasses(this._modelService, this._languageService, URI.from({ scheme: 'fake', path: element.textLabel }), FileKind.FILE);
            // 	const detailClasses = getIconClasses(this._modelService, this._languageService, URI.from({ scheme: 'fake', path: completion.detail }), FileKind.FILE);
            // 	labelOptions.extraClasses = labelClasses.length > detailClasses.length ? labelClasses : detailClasses;
            // } else if (completion.kind === CompletionItemKind.Folder && this._themeService.getFileIconTheme().hasFolderIcons) {
            // 	// special logic for 'folder' completion items
            // 	data.icon.className = 'icon hide';
            // 	data.iconContainer.className = 'icon hide';
            // 	labelOptions.extraClasses = [
            // 		getIconClasses(this._modelService, this._languageService, URI.from({ scheme: 'fake', path: element.textLabel }), FileKind.FOLDER),
            // 		getIconClasses(this._modelService, this._languageService, URI.from({ scheme: 'fake', path: completion.detail }), FileKind.FOLDER)
            // 	].flat();
            // } else {
            // normal icon
            data.icon.className = 'icon hide';
            data.iconContainer.className = '';
            data.iconContainer.classList.add('suggest-icon', ...themables_1.ThemeIcon.asClassNameArray(completion.icon || codicons_1.Codicon.symbolText));
            // }
            // if (completion.tags && completion.tags.indexOf(CompletionItemTag.Deprecated) >= 0) {
            // 	labelOptions.extraClasses = (labelOptions.extraClasses || []).concat(['deprecated']);
            // 	labelOptions.matches = [];
            // }
            data.iconLabel.setLabel(completion.label, undefined, labelOptions);
            // if (typeof completion.label === 'string') {
            data.parametersLabel.textContent = '';
            data.detailsLabel.textContent = stripNewLines(completion.detail || '');
            data.root.classList.add('string-label');
            // } else {
            // 	data.parametersLabel.textContent = stripNewLines(completion.label.detail || '');
            // 	data.detailsLabel.textContent = stripNewLines(completion.label.description || '');
            // 	data.root.classList.remove('string-label');
            // }
            // if (this._editor.getOption(EditorOption.suggest).showInlineDetails) {
            (0, dom_1.show)(data.detailsLabel);
            // } else {
            // 	hide(data.detailsLabel);
            // }
            // if (canExpandCompletionItem(element)) {
            // 	data.right.classList.add('can-expand-details');
            // 	show(data.readMore);
            // 	data.readMore.onmousedown = e => {
            // 		e.stopPropagation();
            // 		e.preventDefault();
            // 	};
            // 	data.readMore.onclick = e => {
            // 		e.stopPropagation();
            // 		e.preventDefault();
            // 		this._onDidToggleDetails.fire();
            // 	};
            // } else {
            data.right.classList.remove('can-expand-details');
            // hide(data.readMore);
            // data.readMore.onmousedown = null;
            // data.readMore.onclick = null;
            // }
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    }
    exports.SimpleSuggestWidgetItemRenderer = SimpleSuggestWidgetItemRenderer;
    function stripNewLines(str) {
        return str.replace(/\r\n|\r|\n/g, '');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlU3VnZ2VzdFdpZGdldFJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc3VnZ2VzdC9icm93c2VyL3NpbXBsZVN1Z2dlc3RXaWRnZXRSZW5kZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsOEJBRUM7SUFGRCxTQUFnQixTQUFTLENBQUMsS0FBYTtRQUN0QyxPQUFPLDBCQUEwQixLQUFLLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0lBMkJELE1BQWEsK0JBQStCO1FBQTVDO1lBRWtCLHdCQUFtQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDbEQsdUJBQWtCLEdBQWdCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFFakUsZUFBVSxHQUFHLFlBQVksQ0FBQztRQTBKcEMsQ0FBQztRQXhKQSxPQUFPO1lBQ04sSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3BDLENBQUM7UUFFRCxjQUFjLENBQUMsU0FBc0I7WUFDcEMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFMUMsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFdEMsTUFBTSxJQUFJLEdBQUcsSUFBQSxZQUFNLEVBQUMsU0FBUyxFQUFFLElBQUEsT0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDM0MsTUFBTSxTQUFTLEdBQUcsSUFBQSxZQUFNLEVBQUMsSUFBSSxFQUFFLElBQUEsT0FBQyxFQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUVwRCxNQUFNLElBQUksR0FBRyxJQUFBLFlBQU0sRUFBQyxTQUFTLEVB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