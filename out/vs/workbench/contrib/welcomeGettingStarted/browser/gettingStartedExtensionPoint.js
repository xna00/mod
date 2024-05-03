/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry"], function (require, exports, nls_1, extensionsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.walkthroughsExtensionPoint = void 0;
    const titleTranslated = (0, nls_1.localize)('title', "Title");
    exports.walkthroughsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'walkthroughs',
        jsonSchema: {
            description: (0, nls_1.localize)('walkthroughs', "Contribute walkthroughs to help users getting started with your extension."),
            type: 'array',
            items: {
                type: 'object',
                required: ['id', 'title', 'description', 'steps'],
                defaultSnippets: [{ body: { 'id': '$1', 'title': '$2', 'description': '$3', 'steps': [] } }],
                properties: {
                    id: {
                        type: 'string',
                        description: (0, nls_1.localize)('walkthroughs.id', "Unique identifier for this walkthrough."),
                    },
                    title: {
                        type: 'string',
                        description: (0, nls_1.localize)('walkthroughs.title', "Title of walkthrough.")
                    },
                    icon: {
                        type: 'string',
                        description: (0, nls_1.localize)('walkthroughs.icon', "Relative path to the icon of the walkthrough. The path is relative to the extension location. If not specified, the icon defaults to the extension icon if available."),
                    },
                    description: {
                        type: 'string',
                        description: (0, nls_1.localize)('walkthroughs.description', "Description of walkthrough.")
                    },
                    featuredFor: {
                        type: 'array',
                        description: (0, nls_1.localize)('walkthroughs.featuredFor', "Walkthroughs that match one of these glob patterns appear as 'featured' in workspaces with the specified files. For example, a walkthrough for TypeScript projects might specify `tsconfig.json` here."),
                        items: {
                            type: 'string'
                        },
                    },
                    when: {
                        type: 'string',
                        description: (0, nls_1.localize)('walkthroughs.when', "Context key expression to control the visibility of this walkthrough.")
                    },
                    steps: {
                        type: 'array',
                        description: (0, nls_1.localize)('walkthroughs.steps', "Steps to complete as part of this walkthrough."),
                        items: {
                            type: 'object',
                            required: ['id', 'title', 'media'],
                            defaultSnippets: [{
                                    body: {
                                        'id': '$1', 'title': '$2', 'description': '$3',
                                        'completionEvents': ['$5'],
                                        'media': {},
                                    }
                                }],
                            properties: {
                                id: {
                                    type: 'string',
                                    description: (0, nls_1.localize)('walkthroughs.steps.id', "Unique identifier for this step. This is used to keep track of which steps have been completed."),
                                },
                                title: {
                                    type: 'string',
                                    description: (0, nls_1.localize)('walkthroughs.steps.title', "Title of step.")
                                },
                                description: {
                                    type: 'string',
                                    description: (0, nls_1.localize)('walkthroughs.steps.description.interpolated', "Description of step. Supports ``preformatted``, __italic__, and **bold** text. Use markdown-style links for commands or external links: {0}, {1}, or {2}. Links on their own line will be rendered as buttons.", `[${titleTranslated}](command:myext.command)`, `[${titleTranslated}](command:toSide:myext.command)`, `[${titleTranslated}](https://aka.ms)`)
                                },
                                button: {
                                    deprecationMessage: (0, nls_1.localize)('walkthroughs.steps.button.deprecated.interpolated', "Deprecated. Use markdown links in the description instead, i.e. {0}, {1}, or {2}", `[${titleTranslated}](command:myext.command)`, `[${titleTranslated}](command:toSide:myext.command)`, `[${titleTranslated}](https://aka.ms)`),
                                },
                                media: {
                                    type: 'object',
                                    description: (0, nls_1.localize)('walkthroughs.steps.media', "Media to show alongside this step, either an image or markdown content."),
                                    oneOf: [
                                        {
                                            required: ['image', 'altText'],
                                            additionalProperties: false,
                                            properties: {
                                                path: {
                                                    deprecationMessage: (0, nls_1.localize)('pathDeprecated', "Deprecated. Please use `image` or `markdown` instead")
                                                },
                                                image: {
                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.image.path.string', "Path to an image - or object consisting of paths to light, dark, and hc images - relative to extension directory. Depending on context, the image will be displayed from 400px to 800px wide, with similar bounds on height. To support HIDPI displays, the image will be rendered at 1.5x scaling, for example a 900 physical pixels wide image will be displayed as 600 logical pixels wide."),
                                                    oneOf: [
                                                        {
                                                            type: 'string',
                                                        },
                                                        {
                                                            type: 'object',
                                                            required: ['dark', 'light', 'hc', 'hcLight'],
                                                            properties: {
                                                                dark: {
                                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.image.path.dark.string', "Path to the image for dark themes, relative to extension directory."),
                                                                    type: 'string',
                                                                },
                                                                light: {
                                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.image.path.light.string', "Path to the image for light themes, relative to extension directory."),
                                                                    type: 'string',
                                                                },
                                                                hc: {
                                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.image.path.hc.string', "Path to the image for hc themes, relative to extension directory."),
                                                                    type: 'string',
                                                                },
                                                                hcLight: {
                                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.image.path.hcLight.string', "Path to the image for hc light themes, relative to extension directory."),
                                                                    type: 'string',
                                                                }
                                                            }
                                                        }
                                                    ]
                                                },
                                                altText: {
                                                    type: 'string',
                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.altText', "Alternate text to display when the image cannot be loaded or in screen readers.")
                                                }
                                            }
                                        },
                                        {
                                            required: ['svg', 'altText'],
                                            additionalProperties: false,
                                            properties: {
                                                svg: {
                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.image.path.svg', "Path to an svg, color tokens are supported in variables to support theming to match the workbench."),
                                                    type: 'string',
                                                },
                                                altText: {
                                                    type: 'string',
                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.altText', "Alternate text to display when the image cannot be loaded or in screen readers.")
                                                },
                                            }
                                        },
                                        {
                                            required: ['markdown'],
                                            additionalProperties: false,
                                            properties: {
                                                path: {
                                                    deprecationMessage: (0, nls_1.localize)('pathDeprecated', "Deprecated. Please use `image` or `markdown` instead")
                                                },
                                                markdown: {
                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.markdown.path', "Path to the markdown document, relative to extension directory."),
                                                    type: 'string',
                                                }
                                            }
                                        }
                                    ]
                                },
                                completionEvents: {
                                    description: (0, nls_1.localize)('walkthroughs.steps.completionEvents', "Events that should trigger this step to become checked off. If empty or not defined, the step will check off when any of the step's buttons or links are clicked; if the step has no buttons or links it will check on when it is selected."),
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        defaultSnippets: [
                                            {
                                                label: 'onCommand',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.onCommand', 'Check off step when a given command is executed anywhere in VS Code.'),
                                                body: 'onCommand:${1:commandId}'
                                            },
                                            {
                                                label: 'onLink',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.onLink', 'Check off step when a given link is opened via a walkthrough step.'),
                                                body: 'onLink:${2:linkId}'
                                            },
                                            {
                                                label: 'onView',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.onView', 'Check off step when a given view is opened'),
                                                body: 'onView:${2:viewId}'
                                            },
                                            {
                                                label: 'onSettingChanged',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.onSettingChanged', 'Check off step when a given setting is changed'),
                                                body: 'onSettingChanged:${2:settingName}'
                                            },
                                            {
                                                label: 'onContext',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.onContext', 'Check off step when a context key expression is true.'),
                                                body: 'onContext:${2:key}'
                                            },
                                            {
                                                label: 'onExtensionInstalled',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.extensionInstalled', 'Check off step when an extension with the given id is installed. If the extension is already installed, the step will start off checked.'),
                                                body: 'onExtensionInstalled:${3:extensionId}'
                                            },
                                            {
                                                label: 'onStepSelected',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.stepSelected', 'Check off step as soon as it is selected.'),
                                                body: 'onStepSelected'
                                            },
                                        ]
                                    }
                                },
                                doneOn: {
                                    description: (0, nls_1.localize)('walkthroughs.steps.doneOn', "Signal to mark step as complete."),
                                    deprecationMessage: (0, nls_1.localize)('walkthroughs.steps.doneOn.deprecation', "doneOn is deprecated. By default steps will be checked off when their buttons are clicked, to configure further use completionEvents"),
                                    type: 'object',
                                    required: ['command'],
                                    defaultSnippets: [{ 'body': { command: '$1' } }],
                                    properties: {
                                        'command': {
                                            description: (0, nls_1.localize)('walkthroughs.steps.oneOn.command', "Mark step done when the specified command is executed."),
                                            type: 'string'
                                        }
                                    },
                                },
                                when: {
                                    type: 'string',
                                    description: (0, nls_1.localize)('walkthroughs.steps.when', "Context key expression to control the visibility of this step.")
                                }
                            }
                        }
                    }
                }
            }
        },
        activationEventsGenerator: (walkthroughContributions, result) => {
            for (const walkthroughContribution of walkthroughContributions) {
                if (walkthroughContribution.id) {
                    result.push(`onWalkthrough:${walkthroughContribution.id}`);
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0dGluZ1N0YXJ0ZWRFeHRlbnNpb25Qb2ludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2VsY29tZUdldHRpbmdTdGFydGVkL2Jyb3dzZXIvZ2V0dGluZ1N0YXJ0ZWRFeHRlbnNpb25Qb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBTSxlQUFlLEdBQUcsSUFBQSxjQUFRLEVBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRXRDLFFBQUEsMEJBQTBCLEdBQUcsdUNBQWtCLENBQUMsc0JBQXNCLENBQWlCO1FBQ25HLGNBQWMsRUFBRSxjQUFjO1FBQzlCLFVBQVUsRUFBRTtZQUNYLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsNEVBQTRFLENBQUM7WUFDbkgsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsT0FBTyxDQUFDO2dCQUNqRCxlQUFlLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUM1RixVQUFVLEVBQUU7b0JBQ1gsRUFBRSxFQUFFO3dCQUNILElBQUksRUFBRSxRQUFRO3dCQUNkLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSx5Q0FBeUMsQ0FBQztxQkFDbkY7b0JBQ0QsS0FBSyxFQUFFO3dCQUNOLElBQUksRUFBRSxRQUFRO3dCQUNkLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFB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