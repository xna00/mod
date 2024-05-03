/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/product/common/product", "vs/base/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/platform/actions/common/actions", "vs/base/common/keyCodes", "vs/platform/product/common/productService", "vs/platform/action/common/actionCommonCategories"], function (require, exports, nls_1, product_1, platform_1, telemetry_1, opener_1, uri_1, actions_1, keyCodes_1, productService_1, actionCommonCategories_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KeybindingsReferenceAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.keybindingsReference'; }
        static { this.AVAILABLE = !!(platform_1.isLinux ? product_1.default.keyboardShortcutsUrlLinux : platform_1.isMacintosh ? product_1.default.keyboardShortcutsUrlMac : product_1.default.keyboardShortcutsUrlWin); }
        constructor() {
            super({
                id: KeybindingsReferenceAction.ID,
                title: {
                    ...(0, nls_1.localize2)('keybindingsReference', "Keyboard Shortcuts Reference"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miKeyboardShortcuts', comment: ['&& denotes a mnemonic'] }, "&&Keyboard Shortcuts Reference"),
                },
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: null,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */)
                },
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '2_reference',
                    order: 1
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const url = platform_1.isLinux ? productService.keyboardShortcutsUrlLinux : platform_1.isMacintosh ? productService.keyboardShortcutsUrlMac : productService.keyboardShortcutsUrlWin;
            if (url) {
                openerService.open(uri_1.URI.parse(url));
            }
        }
    }
    class OpenIntroductoryVideosUrlAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openVideoTutorialsUrl'; }
        static { this.AVAILABLE = !!product_1.default.introductoryVideosUrl; }
        constructor() {
            super({
                id: OpenIntroductoryVideosUrlAction.ID,
                title: {
                    ...(0, nls_1.localize2)('openVideoTutorialsUrl', "Video Tutorials"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miVideoTutorials', comment: ['&& denotes a mnemonic'] }, "&&Video Tutorials"),
                },
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '2_reference',
                    order: 2
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.introductoryVideosUrl) {
                openerService.open(uri_1.URI.parse(productService.introductoryVideosUrl));
            }
        }
    }
    class OpenTipsAndTricksUrlAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openTipsAndTricksUrl'; }
        static { this.AVAILABLE = !!product_1.default.tipsAndTricksUrl; }
        constructor() {
            super({
                id: OpenTipsAndTricksUrlAction.ID,
                title: {
                    ...(0, nls_1.localize2)('openTipsAndTricksUrl', "Tips and Tricks"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miTipsAndTricks', comment: ['&& denotes a mnemonic'] }, "Tips and Tri&&cks"),
                },
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '2_reference',
                    order: 3
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.tipsAndTricksUrl) {
                openerService.open(uri_1.URI.parse(productService.tipsAndTricksUrl));
            }
        }
    }
    class OpenDocumentationUrlAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openDocumentationUrl'; }
        static { this.AVAILABLE = !!(platform_1.isWeb ? product_1.default.serverDocumentationUrl : product_1.default.documentationUrl); }
        constructor() {
            super({
                id: OpenDocumentationUrlAction.ID,
                title: {
                    ...(0, nls_1.localize2)('openDocumentationUrl', "Documentation"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miDocumentation', comment: ['&& denotes a mnemonic'] }, "&&Documentation"),
                },
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '1_welcome',
                    order: 3
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const url = platform_1.isWeb ? productService.serverDocumentationUrl : productService.documentationUrl;
            if (url) {
                openerService.open(uri_1.URI.parse(url));
            }
        }
    }
    class OpenNewsletterSignupUrlAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openNewsletterSignupUrl'; }
        static { this.AVAILABLE = !!product_1.default.newsletterSignupUrl; }
        constructor() {
            super({
                id: OpenNewsletterSignupUrlAction.ID,
                title: (0, nls_1.localize2)('newsletterSignup', 'Signup for the VS Code Newsletter'),
                category: actionCommonCategories_1.Categories.Help,
                f1: true
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            openerService.open(uri_1.URI.parse(`${productService.newsletterSignupUrl}?machineId=${encodeURIComponent(telemetryService.machineId)}`));
        }
    }
    class OpenYouTubeUrlAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openYouTubeUrl'; }
        static { this.AVAILABLE = !!product_1.default.youTubeUrl; }
        constructor() {
            super({
                id: OpenYouTubeUrlAction.ID,
                title: {
                    ...(0, nls_1.localize2)('openYouTubeUrl', "Join Us on YouTube"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miYouTube', comment: ['&& denotes a mnemonic'] }, "&&Join Us on YouTube"),
                },
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '3_feedback',
                    order: 1
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.youTubeUrl) {
                openerService.open(uri_1.URI.parse(productService.youTubeUrl));
            }
        }
    }
    class OpenRequestFeatureUrlAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openRequestFeatureUrl'; }
        static { this.AVAILABLE = !!product_1.default.requestFeatureUrl; }
        constructor() {
            super({
                id: OpenRequestFeatureUrlAction.ID,
                title: {
                    ...(0, nls_1.localize2)('openUserVoiceUrl', "Search Feature Requests"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miUserVoice', comment: ['&& denotes a mnemonic'] }, "&&Search Feature Requests"),
                },
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '3_feedback',
                    order: 2
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.requestFeatureUrl) {
                openerService.open(uri_1.URI.parse(productService.requestFeatureUrl));
            }
        }
    }
    class OpenLicenseUrlAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openLicenseUrl'; }
        static { this.AVAILABLE = !!(platform_1.isWeb ? product_1.default.serverLicense : product_1.default.licenseUrl); }
        constructor() {
            super({
                id: OpenLicenseUrlAction.ID,
                title: {
                    ...(0, nls_1.localize2)('openLicenseUrl', "View License"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miLicense', comment: ['&& denotes a mnemonic'] }, "View &&License"),
                },
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '4_legal',
                    order: 1
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const url = platform_1.isWeb ? productService.serverLicenseUrl : productService.licenseUrl;
            if (url) {
                if (platform_1.language) {
                    const queryArgChar = url.indexOf('?') > 0 ? '&' : '?';
                    openerService.open(uri_1.URI.parse(`${url}${queryArgChar}lang=${platform_1.language}`));
                }
                else {
                    openerService.open(uri_1.URI.parse(url));
                }
            }
        }
    }
    class OpenPrivacyStatementUrlAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openPrivacyStatementUrl'; }
        static { this.AVAILABE = !!product_1.default.privacyStatementUrl; }
        constructor() {
            super({
                id: OpenPrivacyStatementUrlAction.ID,
                title: {
                    ...(0, nls_1.localize2)('openPrivacyStatement', "Privacy Statement"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miPrivacyStatement', comment: ['&& denotes a mnemonic'] }, "Privac&&y Statement"),
                },
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '4_legal',
                    order: 2
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.privacyStatementUrl) {
                openerService.open(uri_1.URI.parse(productService.privacyStatementUrl));
            }
        }
    }
    // --- Actions Registration
    if (KeybindingsReferenceAction.AVAILABLE) {
        (0, actions_1.registerAction2)(KeybindingsReferenceAction);
    }
    if (OpenIntroductoryVideosUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenIntroductoryVideosUrlAction);
    }
    if (OpenTipsAndTricksUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenTipsAndTricksUrlAction);
    }
    if (OpenDocumentationUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenDocumentationUrlAction);
    }
    if (OpenNewsletterSignupUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenNewsletterSignupUrlAction);
    }
    if (OpenYouTubeUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenYouTubeUrlAction);
    }
    if (OpenRequestFeatureUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenRequestFeatureUrlAction);
    }
    if (OpenLicenseUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenLicenseUrlAction);
    }
    if (OpenPrivacyStatementUrlAction.AVAILABE) {
        (0, actions_1.registerAction2)(OpenPrivacyStatementUrlAction);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL2FjdGlvbnMvaGVscEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFlaEcsTUFBTSwwQkFBMkIsU0FBUSxpQkFBTztpQkFFL0IsT0FBRSxHQUFHLHVDQUF1QyxDQUFDO2lCQUM3QyxjQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUMsa0JBQU8sQ0FBQyxDQUFDLENBQUMsaUJBQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsc0JBQVcsQ0FBQyxDQUFDLENBQUMsaUJBQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsaUJBQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBRTlKO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwwQkFBMEIsQ0FBQyxFQUFFO2dCQUNqQyxLQUFLLEVBQUU7b0JBQ04sR0FBRyxJQUFBLGVBQVMsRUFBQyxzQkFBc0IsRUFBRSw4QkFBOEIsQ0FBQztvQkFDcEUsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLHFCQUFxQixFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxnQ0FBZ0MsQ0FBQztpQkFDN0g7Z0JBQ0QsUUFBUSxFQUFFLG1DQUFVLENBQUMsSUFBSTtnQkFDekIsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsVUFBVSxFQUFFO29CQUNYLE1BQU0sNkNBQW1DO29CQUN6QyxJQUFJLEVBQUUsSUFBSTtvQkFDVixPQUFPLEVBQUUsSUFBQSxtQkFBUSxFQUFDLGlEQUE2QixFQUFFLGlEQUE2QixDQUFDO2lCQUMvRTtnQkFDRCxJQUFJLEVBQUU7b0JBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsZUFBZTtvQkFDMUIsS0FB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U0FBUyxFQUFFLENBQUM7UUFDMUMsSUFBQSx5QkFBZSxFQUFDLDBCQUEwQixDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELElBQUksK0JBQStCLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDL0MsSUFBQSx5QkFBZSxFQUFDLCtCQUErQixDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELElBQUksMEJBQTBCLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDMUMsSUFBQSx5QkFBZSxFQUFDLDBCQUEwQixDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELElBQUksMEJBQTBCLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDMUMsSUFBQSx5QkFBZSxFQUFDLDBCQUEwQixDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELElBQUksNkJBQTZCLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDN0MsSUFBQSx5QkFBZSxFQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVELElBQUksb0JBQW9CLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDcEMsSUFBQSx5QkFBZSxFQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELElBQUksMkJBQTJCLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDM0MsSUFBQSx5QkFBZSxFQUFDLDJCQUEyQixDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVELElBQUksb0JBQW9CLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDcEMsSUFBQSx5QkFBZSxFQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELElBQUksNkJBQTZCLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDNUMsSUFBQSx5QkFBZSxFQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDaEQsQ0FBQyJ9