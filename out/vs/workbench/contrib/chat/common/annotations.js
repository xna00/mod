define(["require", "exports", "vs/base/common/htmlContent", "vs/base/common/resources", "vs/base/common/uri"], function (require, exports, htmlContent_1, resources_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.contentRefUrl = void 0;
    exports.annotateSpecialMarkdownContent = annotateSpecialMarkdownContent;
    exports.annotateVulnerabilitiesInText = annotateVulnerabilitiesInText;
    exports.extractVulnerabilitiesFromText = extractVulnerabilitiesFromText;
    exports.contentRefUrl = 'http://_vscodecontentref_'; // must be lowercase for URI
    function annotateSpecialMarkdownContent(response) {
        const result = [];
        for (const item of response) {
            const previousItem = result[result.length - 1];
            if (item.kind === 'inlineReference') {
                const location = 'uri' in item.inlineReference ? item.inlineReference : { uri: item.inlineReference };
                const printUri = uri_1.URI.parse(exports.contentRefUrl).with({ fragment: JSON.stringify(location) });
                const markdownText = `[${item.name || (0, resources_1.basename)(location.uri)}](${printUri.toString()})`;
                if (previousItem?.kind === 'markdownContent') {
                    result[result.length - 1] = { content: new htmlContent_1.MarkdownString(previousItem.content.value + markdownText, { isTrusted: previousItem.content.isTrusted }), kind: 'markdownContent' };
                }
                else {
                    result.push({ content: new htmlContent_1.MarkdownString(markdownText), kind: 'markdownContent' });
                }
            }
            else if (item.kind === 'markdownContent' && previousItem?.kind === 'markdownContent') {
                result[result.length - 1] = { content: new htmlContent_1.MarkdownString(previousItem.content.value + item.content.value, { isTrusted: previousItem.content.isTrusted }), kind: 'markdownContent' };
            }
            else if (item.kind === 'markdownVuln') {
                const vulnText = encodeURIComponent(JSON.stringify(item.vulnerabilities));
                const markdownText = `<vscode_annotation details='${vulnText}'>${item.content.value}</vscode_annotation>`;
                if (previousItem?.kind === 'markdownContent') {
                    result[result.length - 1] = { content: new htmlContent_1.MarkdownString(previousItem.content.value + markdownText, { isTrusted: previousItem.content.isTrusted }), kind: 'markdownContent' };
                }
                else {
                    result.push({ content: new htmlContent_1.MarkdownString(markdownText), kind: 'markdownContent' });
                }
            }
            else {
                result.push(item);
            }
        }
        return result;
    }
    function annotateVulnerabilitiesInText(response) {
        const result = [];
        for (const item of response) {
            const previousItem = result[result.length - 1];
            if (item.kind === 'markdownContent') {
                if (previousItem?.kind === 'markdownContent') {
                    result[result.length - 1] = { content: new htmlContent_1.MarkdownString(previousItem.content.value + item.content.value, { isTrusted: previousItem.content.isTrusted }), kind: 'markdownContent' };
                }
                else {
                    result.push(item);
                }
            }
            else if (item.kind === 'markdownVuln') {
                const vulnText = encodeURIComponent(JSON.stringify(item.vulnerabilities));
                const markdownText = `<vscode_annotation details='${vulnText}'>${item.content.value}</vscode_annotation>`;
                if (previousItem?.kind === 'markdownContent') {
                    result[result.length - 1] = { content: new htmlContent_1.MarkdownString(previousItem.content.value + markdownText, { isTrusted: previousItem.content.isTrusted }), kind: 'markdownContent' };
                }
                else {
                    result.push({ content: new htmlContent_1.MarkdownString(markdownText), kind: 'markdownContent' });
                }
            }
        }
        return result;
    }
    function extractVulnerabilitiesFromText(text) {
        const vulnerabilities = [];
        let newText = text;
        let match;
        while ((match = /<vscode_annotation details='(.*?)'>(.*?)<\/vscode_annotation>/ms.exec(newText)) !== null) {
            const [full, details, content] = match;
            const start = match.index;
            const textBefore = newText.substring(0, start);
            const linesBefore = textBefore.split('\n').length - 1;
            const linesInside = content.split('\n').length - 1;
            const previousNewlineIdx = textBefore.lastIndexOf('\n');
            const startColumn = start - (previousNewlineIdx + 1) + 1;
            const endPreviousNewlineIdx = (textBefore + content).lastIndexOf('\n');
            const endColumn = start + content.length - (endPreviousNewlineIdx + 1) + 1;
            try {
                const vulnDetails = JSON.parse(decodeURIComponent(details));
                vulnDetails.forEach(({ title, description }) => vulnerabilities.push({
                    title, description, range: { startLineNumber: linesBefore + 1, startColumn, endLineNumber: linesBefore + linesInside + 1, endColumn }
                }));
            }
            catch (err) {
                // Something went wrong with encoding this text, just ignore it
            }
            newText = newText.substring(0, start) + content + newText.substring(start + full.length);
        }
        return { newText, vulnerabilities };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvY29tbW9uL2Fubm90YXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFhQSx3RUE2QkM7SUFRRCxzRUFzQkM7SUFFRCx3RUE0QkM7SUEzRlksUUFBQSxhQUFhLEdBQUcsMkJBQTJCLENBQUMsQ0FBQyw0QkFBNEI7SUFFdEYsU0FBZ0IsOEJBQThCLENBQUMsUUFBcUQ7UUFDbkcsTUFBTSxNQUFNLEdBQXNILEVBQUUsQ0FBQztRQUNySSxLQUFLLE1BQU0sSUFBSSxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQzdCLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQy9DLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxpQkFBaUIsRUFBRSxDQUFDO2dCQUNyQyxNQUFNLFFBQVEsR0FBRyxLQUFLLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN0RyxNQUFNLFFBQVEsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLHFCQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZGLE1BQU0sWUFBWSxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFBLG9CQUFRLEVBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFFBQVEsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDO2dCQUN4RixJQUFJLFlBQVksRUFBRSxJQUFJ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