/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/nls"], function (require, exports, strings_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const sendSystemInfoLabel = (0, strings_1.escape)((0, nls_1.localize)('sendSystemInfo', "Include my system information"));
    const sendProcessInfoLabel = (0, strings_1.escape)((0, nls_1.localize)('sendProcessInfo', "Include my currently running processes"));
    const sendWorkspaceInfoLabel = (0, strings_1.escape)((0, nls_1.localize)('sendWorkspaceInfo', "Include my workspace metadata"));
    const sendExtensionsLabel = (0, strings_1.escape)((0, nls_1.localize)('sendExtensions', "Include my enabled extensions"));
    const sendExperimentsLabel = (0, strings_1.escape)((0, nls_1.localize)('sendExperiments', "Include A/B experiment info"));
    const sendExtensionData = (0, strings_1.escape)((0, nls_1.localize)('sendExtensionData', "Include additional extension info"));
    const reviewGuidanceLabel = (0, nls_1.localize)(// intentionally not escaped because of its embedded tags
    {
        key: 'reviewGuidanceLabel',
        comment: [
            '{Locked="<a href=\"https://github.com/microsoft/vscode/wiki/Submitting-Bugs-and-Suggestions\" target=\"_blank\">"}',
            '{Locked="</a>"}'
        ]
    }, 'Before you report an issue here please <a href="https://github.com/microsoft/vscode/wiki/Submitting-Bugs-and-Suggestions" target="_blank">review the guidance we provide</a>.');
    exports.default = () => `
<div id="issue-reporter">
	<div id="english" class="input-group hidden">${(0, strings_1.escape)((0, nls_1.localize)('completeInEnglish', "Please complete the form in English."))}</div>

	<div id="review-guidance-help-text" class="input-group">${reviewGuidanceLabel}</div>

	<div class="section">
		<div class="input-group">
			<label class="inline-label" for="issue-type">${(0, strings_1.escape)((0, nls_1.localize)('issueTypeLabel', "This is a"))}</label>
			<select id="issue-type" class="inline-form-control">
				<!-- To be dynamically filled -->
			</select>
		</div>

		<div class="input-group" id="problem-source">
			<label class="inline-label" for="issue-source">${(0, strings_1.escape)((0, nls_1.localize)('issueSourceLabel', "File on"))} <span class="required-input">*</span></label>
			<select id="issue-source" class="inline-form-control" required>
				<!-- To be dynamically filled -->
			</select>
			<div id="issue-source-empty-error" class="validation-error hidden" role="alert">${(0, strings_1.escape)((0, nls_1.localize)('issueSourceEmptyValidation', "An issue source is required."))}</div>
			<div id="problem-source-help-text" class="instructions hidden">${(0, strings_1.escape)((0, nls_1.localize)('disableExtensionsLabelText', "Try to reproduce the problem after {0}. If the problem only reproduces when extensions are active, it is likely an issue with an extension."))
        .replace('{0}', () => `<span tabIndex=0 role="button" id="disableExtensions" class="workbenchCommand">${(0, strings_1.escape)((0, nls_1.localize)('disableExtensions', "disabling all extensions and reloading the window"))}</span>`)}
			</div>

			<div id="extension-selection">
				<label class="inline-label" for="extension-selector">${(0, strings_1.escape)((0, nls_1.localize)('chooseExtension', "Extension"))} <span class="required-input">*</span></label>
				<select id="extension-selector" class="inline-form-control">
					<!-- To be dynamically filled -->
				</select>
				<div id="extension-selection-validation-error" class="validation-error hidden" role="alert">${(0, strings_1.escape)((0, nls_1.localize)('extensionWithNonstandardBugsUrl', "The issue reporter is unable to create issues for this extension. Please visit {0} to report an issue."))
        .replace('{0}', () => `<span tabIndex=0 role="button" id="extensionBugsLink" class="workbenchCommand"><!-- To be dynamically filled --></span>`)}</div>
				<div id="extension-selection-validation-error-no-url" class="validation-error hidden" role="alert">
					${(0, strings_1.escape)((0, nls_1.localize)('extensionWithNoBugsUrl', "The issue reporter is unable to create issues for this extension, as it does not specify a URL for reporting issues. Please check the marketplace page of this extension to see if other instructions are available."))}
				</div>
			</div>
		</div>

		<div id="issue-title-container" class="input-group">
			<label class="inline-label" for="issue-title">${(0, strings_1.escape)((0, nls_1.localize)('issueTitleLabel', "Title"))} <span class="required-input">*</span></label>
			<input id="issue-title" type="text" class="inline-form-control" placeholder="${(0, strings_1.escape)((0, nls_1.localize)('issueTitleRequired', "Please enter a title."))}" required>
			<div id="issue-title-empty-error" class="validation-error hidden" role="alert">${(0, strings_1.escape)((0, nls_1.localize)('titleEmptyValidation', "A title is required."))}</div>
			<div id="issue-title-length-validation-error" class="validation-error hidden" role="alert">${(0, strings_1.escape)((0, nls_1.localize)('titleLengthValidation', "The title is too long."))}</div>
			<small id="similar-issues">
				<!-- To be dynamically filled -->
			</small>
		</div>

	</div>

	<div class="input-group description-section">
		<label for="description" id="issue-description-label">
			<!-- To be dynamically filled -->
		</label>
		<div class="instructions" id="issue-description-subtitle">
			<!-- To be dynamically filled -->
		</div>
		<div class="block-info-text">
			<textarea name="description" id="description" placeholder="${(0, strings_1.escape)((0, nls_1.localize)('details', "Please enter details."))}" required></textarea>
		</div>
		<div id="description-empty-error" class="validation-error hidden" role="alert">${(0, strings_1.escape)((0, nls_1.localize)('descriptionEmptyValidation', "A description is required."))}</div>
		<div id="description-short-error" class="validation-error hidden" role="alert">${(0, strings_1.escape)((0, nls_1.localize)('descriptionTooShortValidation', "Please provide a longer description."))}</div>
	</div>

	<div class="system-info" id="block-container">
		<div class="block block-extension-data">
			<input class="send-extension-data" aria-label="${sendExtensionData}" type="checkbox" id="includeExtensionData" checked/>
			<label class="extension-caption" id="extension-caption" for="includeExtensionData">
				${sendExtensionData}
				<span id="ext-loading" hidden></span>
				<span class="ext-parens" hidden>(</span><a href="#" class="showInfo" id="extension-id">${(0, strings_1.escape)((0, nls_1.localize)('show', "show"))}</a><span class="ext-parens" hidden>)</span>
			</label>
			<pre class="block-info" id="extension-data" placeholder="${(0, strings_1.escape)((0, nls_1.localize)('extensionData', "Extension does not have additional data to include."))}" style="white-space: pre-wrap;">
				<!-- To be dynamically filled -->
			</pre>
		</div>

		<div class="block block-system">
			<input class="sendData" aria-label="${sendSystemInfoLabel}" type="checkbox" id="includeSystemInfo" checked/>
			<label class="caption" for="includeSystemInfo">
				${sendSystemInfoLabel}
				(<a href="#" class="showInfo">${(0, strings_1.escape)((0, nls_1.localize)('show', "show"))}</a>)
			</label>
			<div class="block-info hidden">
				<!-- To be dynamically filled -->
			</div>
		</div>
		<div class="block block-process">
			<input class="sendData" aria-label="${sendProcessInfoLabel}" type="checkbox" id="includeProcessInfo" checked/>
			<label class="caption" for="includeProcessInfo">
				${sendProcessInfoLabel}
				(<a href="#" class="showInfo">${(0, strings_1.escape)((0, nls_1.localize)('show', "show"))}</a>)
			</label>
			<pre class="block-info hidden">
				<code>
				<!-- To be dynamically filled -->
				</code>
			</pre>
		</div>
		<div class="block block-workspace">
			<input class="sendData" aria-label="${sendWorkspaceInfoLabel}" type="checkbox" id="includeWorkspaceInfo" checked/>
			<label class="caption" for="includeWorkspaceInfo">
				${sendWorkspaceInfoLabel}
				(<a href="#" class="showInfo">${(0, strings_1.escape)((0, nls_1.localize)('show', "show"))}</a>)
			</label>
			<pre id="systemInfo" class="block-info hidden">
				<code>
				<!-- To be dynamically filled -->
				</code>
			</pre>
		</div>
		<div class="block block-extensions">
			<input class="sendData" aria-label="${sendExtensionsLabel}" type="checkbox" id="includeExtensions" checked/>
			<label class="caption" for="includeExtensions">
				${sendExtensionsLabel}
				(<a href="#" class="showInfo">${(0, strings_1.escape)((0, nls_1.localize)('show', "show"))}</a>)
			</label>
			<div id="systemInfo" class="block-info hidden">
				<!-- To be dynamically filled -->
			</div>
		</div>
		<div class="block block-experiments">
			<input class="sendData" aria-label="${sendExperimentsLabel}" type="checkbox" id="includeExperiments" checked/>
			<label class="caption" for="includeExperiments">
				${sendExperimentsLabel}
				(<a href="#" class="showInfo">${(0, strings_1.escape)((0, nls_1.localize)('show', "show"))}</a>)
			</label>
			<pre class="block-info hidden">
				<!-- To be dynamically filled -->
			</pre>
		</div>
	</div>
</div>`;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVSZXBvcnRlclBhZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2NvZGUvZWxlY3Ryb24tc2FuZGJveC9pc3N1ZS9pc3N1ZVJlcG9ydGVyUGFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQUtoRyxNQUFNLG1CQUFtQixHQUFHLElBQUEsZ0JBQU0sRUFBQyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDLENBQUM7SUFDaEcsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLGdCQUFNLEVBQUMsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsd0NBQXdDLENBQUMsQ0FBQyxDQUFDO0lBQzNHLE1BQU0sc0JBQXNCLEdBQUcsSUFBQSxnQkFBTSxFQUFDLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLCtCQUErQixDQUFDLENBQUMsQ0FBQztJQUN0RyxNQUFNLG1CQUFtQixHQUFHLElBQUEsZ0JBQU0sRUFBQyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDLENBQUM7SUFDaEcsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLGdCQUFNLEVBQUMsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO0lBQ2hHLE1BQU0saUJBQWlCLEdBQUcsSUFBQSxnQkFBTSxFQUFDLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLG1DQUFtQyxDQUFDLENBQUMsQ0FBQztJQUNyRyxNQUFNLG1CQUFtQixHQUFHLElBQUEsY0FBUSxFQUFFLHlEQUF5RDtJQUM5RjtRQUNDLEdBQUcsRUFBRSxxQkFBcUI7UUFDMUIsT0FBTyxFQUFFO1lBQ1Isb0hBQW9IO1lBQ3BILGlCQUFpQjtTQUNqQjtLQUNELEVBQ0QsK0tBQStLLENBQy9LLENBQUM7SUFF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