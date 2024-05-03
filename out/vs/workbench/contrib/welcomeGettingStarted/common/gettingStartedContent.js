/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/welcomeGettingStarted/common/media/theme_picker", "vs/workbench/contrib/welcomeGettingStarted/common/media/notebookProfile"], function (require, exports, nls_1, codicons_1, iconRegistry_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.walkthroughs = exports.startEntries = void 0;
    const setupIcon = (0, iconRegistry_1.registerIcon)('getting-started-setup', codicons_1.Codicon.zap, (0, nls_1.localize)('getting-started-setup-icon', "Icon used for the setup category of welcome page"));
    const beginnerIcon = (0, iconRegistry_1.registerIcon)('getting-started-beginner', codicons_1.Codicon.lightbulb, (0, nls_1.localize)('getting-started-beginner-icon', "Icon used for the beginner category of welcome page"));
    exports.startEntries = [
        {
            id: 'welcome.showNewFileEntries',
            title: (0, nls_1.localize)('gettingStarted.newFile.title', "New File..."),
            description: (0, nls_1.localize)('gettingStarted.newFile.description', "Open a new untitled text file, notebook, or custom editor."),
            icon: codicons_1.Codicon.newFile,
            content: {
                type: 'startEntry',
                command: 'command:welcome.showNewFileEntries',
            }
        },
        {
            id: 'topLevelOpenMac',
            title: (0, nls_1.localize)('gettingStarted.openMac.title', "Open..."),
            description: (0, nls_1.localize)('gettingStarted.openMac.description', "Open a file or folder to start working"),
            icon: codicons_1.Codicon.folderOpened,
            when: '!isWeb && isMac',
            content: {
                type: 'startEntry',
                command: 'command:workbench.action.files.openFileFolder',
            }
        },
        {
            id: 'topLevelOpenFile',
            title: (0, nls_1.localize)('gettingStarted.openFile.title', "Open File..."),
            description: (0, nls_1.localize)('gettingStarted.openFile.description', "Open a file to start working"),
            icon: codicons_1.Codicon.goToFile,
            when: 'isWeb || !isMac',
            content: {
                type: 'startEntry',
                command: 'command:workbench.action.files.openFile',
            }
        },
        {
            id: 'topLevelOpenFolder',
            title: (0, nls_1.localize)('gettingStarted.openFolder.title', "Open Folder..."),
            description: (0, nls_1.localize)('gettingStarted.openFolder.description', "Open a folder to start working"),
            icon: codicons_1.Codicon.folderOpened,
            when: '!isWeb && !isMac',
            content: {
                type: 'startEntry',
                command: 'command:workbench.action.files.openFolder',
            }
        },
        {
            id: 'topLevelOpenFolderWeb',
            title: (0, nls_1.localize)('gettingStarted.openFolder.title', "Open Folder..."),
            description: (0, nls_1.localize)('gettingStarted.openFolder.description', "Open a folder to start working"),
            icon: codicons_1.Codicon.folderOpened,
            when: '!openFolderWorkspaceSupport && workbenchState == \'workspace\'',
            content: {
                type: 'startEntry',
                command: 'command:workbench.action.files.openFolderViaWorkspace',
            }
        },
        {
            id: 'topLevelGitClone',
            title: (0, nls_1.localize)('gettingStarted.topLevelGitClone.title', "Clone Git Repository..."),
            description: (0, nls_1.localize)('gettingStarted.topLevelGitClone.description', "Clone a remote repository to a local folder"),
            when: 'config.git.enabled && !git.missing',
            icon: codicons_1.Codicon.sourceControl,
            content: {
                type: 'startEntry',
                command: 'command:git.clone',
            }
        },
        {
            id: 'topLevelGitOpen',
            title: (0, nls_1.localize)('gettingStarted.topLevelGitOpen.title', "Open Repository..."),
            description: (0, nls_1.localize)('gettingStarted.topLevelGitOpen.description', "Connect to a remote repository or pull request to browse, search, edit, and commit"),
            when: 'workspacePlatform == \'webworker\'',
            icon: codicons_1.Codicon.sourceControl,
            content: {
                type: 'startEntry',
                command: 'command:remoteHub.openRepository',
            }
        },
        {
            id: 'topLevelShowWalkthroughs',
            title: (0, nls_1.localize)('gettingStarted.topLevelShowWalkthroughs.title', "Open a Walkthrough..."),
            description: (0, nls_1.localize)('gettingStarted.topLevelShowWalkthroughs.description', "View a walkthrough on the editor or an extension"),
            icon: codicons_1.Codicon.checklist,
            when: 'allWalkthroughsHidden',
            content: {
                type: 'startEntry',
                command: 'command:welcome.showAllWalkthroughs',
            }
        },
        {
            id: 'topLevelRemoteOpen',
            title: (0, nls_1.localize)('gettingStarted.topLevelRemoteOpen.title', "Connect to..."),
            description: (0, nls_1.localize)('gettingStarted.topLevelRemoteOpen.description', "Connect to remote development workspaces."),
            when: '!isWeb',
            icon: codicons_1.Codicon.remote,
            content: {
                type: 'startEntry',
                command: 'command:workbench.action.remote.showMenu',
            }
        },
        {
            id: 'topLevelOpenTunnel',
            title: (0, nls_1.localize)('gettingStarted.topLevelOpenTunnel.title', "Open Tunnel..."),
            description: (0, nls_1.localize)('gettingStarted.topLevelOpenTunnel.description', "Connect to a remote machine through a Tunnel"),
            when: 'isWeb && showRemoteStartEntryInWeb',
            icon: codicons_1.Codicon.remote,
            content: {
                type: 'startEntry',
                command: 'command:workbench.action.remote.showWebStartEntryActions',
            }
        },
    ];
    const Button = (title, href) => `[${title}](${href})`;
    exports.walkthroughs = [
        {
            id: 'Setup',
            title: (0, nls_1.localize)('gettingStarted.setup.title', "Get Started with VS Code"),
            description: (0, nls_1.localize)('gettingStarted.setup.description', "Customize your editor, learn the basics, and start coding"),
            isFeatured: true,
            icon: setupIcon,
            when: '!isWeb',
            next: 'Beginner',
            content: {
                type: 'steps',
                steps: [
                    {
                        id: 'pickColorTheme',
                        title: (0, nls_1.localize)('gettingStarted.pickColor.title', "Choose your theme"),
                        description: (0, nls_1.localize)('gettingStarted.pickColor.description.interpolated', "The right theme helps you focus on your code, is easy on your eyes, and is simply more fun to use.\n{0}", Button((0, nls_1.localize)('titleID', "Browse Color Themes"), 'command:workbench.action.selectTheme')),
                        completionEvents: [
                            'onSettingChanged:workbench.colorTheme',
                            'onCommand:workbench.action.selectTheme'
                        ],
                        media: { type: 'markdown', path: 'theme_picker', }
                    },
                    {
                        id: 'extensionsWeb',
                        title: (0, nls_1.localize)('gettingStarted.extensions.title', "Code with extensions"),
                        description: (0, nls_1.localize)('gettingStarted.extensionsWeb.description.interpolated', "Extensions are VS Code's power-ups. A growing number are becoming available in the web.\n{0}", Button((0, nls_1.localize)('browsePopular', "Browse Popular Web Extensions"), 'command:workbench.extensions.action.showPopularExtensions')),
                        when: 'workspacePlatform == \'webworker\'',
                        media: {
                            type: 'svg', altText: 'VS Code extension marketplace with featured language extensions', path: 'extensions-web.svg'
                        },
                    },
                    {
                        id: 'findLanguageExtensions',
                        title: (0, nls_1.localize)('gettingStarted.findLanguageExts.title', "Rich support for all your languages"),
                        description: (0, nls_1.localize)('gettingStarted.findLanguageExts.description.interpolated', "Code smarter with syntax highlighting, code completion, linting and debugging. While many languages are built-in, many more can be added as extensions.\n{0}", Button((0, nls_1.localize)('browseLangExts', "Browse Language Extensions"), 'command:workbench.extensions.action.showLanguageExtensions')),
                        when: 'workspacePlatform != \'webworker\'',
                        media: {
                            type: 'svg', altText: 'Language extensions', path: 'languages.svg'
                        },
                    },
                    {
                        id: 'settings',
                        title: (0, nls_1.localize)('gettingStarted.settings.title', "Tune your settings"),
                        description: (0, nls_1.localize)('gettingStarted.settings.description.interpolated', "Customize every aspect of VS Code and your extensions to your liking. Commonly used settings are listed first to get you started.\n{0}", Button((0, nls_1.localize)('tweakSettings', "Open Settings"), 'command:toSide:workbench.action.openSettings')),
                        media: {
                            type: 'svg', altText: 'VS Code Settings', path: 'settings.svg'
                        },
                    },
                    {
                        id: 'settingsSync',
                        title: (0, nls_1.localize)('gettingStarted.settingsSync.title', "Sync settings across devices"),
                        description: (0, nls_1.localize)('gettingStarted.settingsSync.description.interpolated', "Keep your essential customizations backed up and updated across all your devices.\n{0}", Button((0, nls_1.localize)('enableSync', "Backup and Sync Settings"), 'command:workbench.userDataSync.actions.turnOn')),
                        when: 'syncStatus != uninitialized',
                        completionEvents: ['onEvent:sync-enabled'],
                        media: {
                            type: 'svg', altText: 'The "Turn on Sync" entry in the settings gear menu.', path: 'settingsSync.svg'
                        },
                    },
                    {
                        id: 'commandPaletteTask',
                        title: (0, nls_1.localize)('gettingStarted.commandPalette.title', "Unlock productivity with the Command Palette "),
                        description: (0, nls_1.localize)('gettingStarted.commandPalette.description.interpolated', "Run commands without reaching for your mouse to accomplish any task in VS Code.\n{0}", Button((0, nls_1.localize)('commandPalette', "Open Command Palette"), 'command:workbench.action.showCommands')),
                        media: { type: 'svg', altText: 'Command Palette overlay for searching and executing commands.', path: 'commandPalette.svg' },
                    },
                    {
                        id: 'pickAFolderTask-Mac',
                        title: (0, nls_1.localize)('gettingStarted.setup.OpenFolder.title', "Open up your code"),
                        description: (0, nls_1.localize)('gettingStarted.setup.OpenFolder.description.interpolated', "You're all set to start coding. Open a project folder to get your files into VS Code.\n{0}", Button((0, nls_1.localize)('pickFolder', "Pick a Folder"), 'command:workbench.action.files.openFileFolder')),
                        when: 'isMac && workspaceFolderCount == 0',
                        media: {
                            type: 'svg', altText: 'Explorer view showing buttons for opening folder and cloning repository.', path: 'openFolder.svg'
                        }
                    },
                    {
                        id: 'pickAFolderTask-Other',
                        title: (0, nls_1.localize)('gettingStarted.setup.OpenFolder.title', "Open up your code"),
                        description: (0, nls_1.localize)('gettingStarted.setup.OpenFolder.description.interpolated', "You're all set to start coding. Open a project folder to get your files into VS Code.\n{0}", Button((0, nls_1.localize)('pickFolder', "Pick a Folder"), 'command:workbench.action.files.openFolder')),
                        when: '!isMac && workspaceFolderCount == 0',
                        media: {
                            type: 'svg', altText: 'Explorer view showing buttons for opening folder and cloning repository.', path: 'openFolder.svg'
                        }
                    },
                    {
                        id: 'quickOpen',
                        title: (0, nls_1.localize)('gettingStarted.quickOpen.title', "Quickly navigate between your files"),
                        description: (0, nls_1.localize)('gettingStarted.quickOpen.description.interpolated', "Navigate between files in an instant with one keystroke. Tip: Open multiple files by pressing the right arrow key.\n{0}", Button((0, nls_1.localize)('quickOpen', "Quick Open a File"), 'command:toSide:workbench.action.quickOpen')),
                        when: 'workspaceFolderCount != 0',
                        media: {
                            type: 'svg', altText: 'Go to file in quick search.', path: 'search.svg'
                        }
                    },
                    {
                        id: 'videoTutorial',
                        title: (0, nls_1.localize)('gettingStarted.videoTutorial.title', "Watch video tutorials"),
                        description: (0, nls_1.localize)('gettingStarted.videoTutorial.description.interpolated', "Watch the first in a series of short & practical video tutorials for VS Code's key features.\n{0}", Button((0, nls_1.localize)('watch', "Watch Tutorial"), 'https://aka.ms/vscode-getting-started-video')),
                        media: { type: 'svg', altText: 'VS Code Settings', path: 'learn.svg' },
                    }
                ]
            }
        },
        {
            id: 'SetupWeb',
            title: (0, nls_1.localize)('gettingStarted.setupWeb.title', "Get Started with VS Code for the Web"),
            description: (0, nls_1.localize)('gettingStarted.setupWeb.description', "Customize your editor, learn the basics, and start coding"),
            isFeatured: true,
            icon: setupIcon,
            when: 'isWeb',
            next: 'Beginner',
            content: {
                type: 'steps',
                steps: [
                    {
                        id: 'pickColorThemeWeb',
                        title: (0, nls_1.localize)('gettingStarted.pickColor.title', "Choose your theme"),
                        description: (0, nls_1.localize)('gettingStarted.pickColor.description.interpolated', "The right theme helps you focus on your code, is easy on your eyes, and is simply more fun to use.\n{0}", Button((0, nls_1.localize)('titleID', "Browse Color Themes"), 'command:workbench.action.selectTheme')),
                        completionEvents: [
                            'onSettingChanged:workbench.colorTheme',
                            'onCommand:workbench.action.selectTheme'
                        ],
                        media: { type: 'markdown', path: 'theme_picker', }
                    },
                    {
                        id: 'menuBarWeb',
                        title: (0, nls_1.localize)('gettingStarted.menuBar.title', "Just the right amount of UI"),
                        description: (0, nls_1.localize)('gettingStarted.menuBar.description.interpolated', "The full menu bar is available in the dropdown menu to make room for your code. Toggle its appearance for faster access. \n{0}", Button((0, nls_1.localize)('toggleMenuBar', "Toggle Menu Bar"), 'command:workbench.action.toggleMenuBar')),
                        when: 'isWeb',
                        media: {
                            type: 'svg', altText: 'Comparing menu dropdown with the visible menu bar.', path: 'menuBar.svg'
                        },
                    },
                    {
                        id: 'extensionsWebWeb',
                        title: (0, nls_1.localize)('gettingStarted.extensions.title', "Code with extensions"),
                        description: (0, nls_1.localize)('gettingStarted.extensionsWeb.description.interpolated', "Extensions are VS Code's power-ups. A growing number are becoming available in the web.\n{0}", Button((0, nls_1.localize)('browsePopular', "Browse Popular Web Extensions"), 'command:workbench.extensions.action.showPopularExtensions')),
                        when: 'workspacePlatform == \'webworker\'',
                        media: {
                            type: 'svg', altText: 'VS Code extension marketplace with featured language extensions', path: 'extensions-web.svg'
                        },
                    },
                    {
                        id: 'findLanguageExtensionsWeb',
                        title: (0, nls_1.localize)('gettingStarted.findLanguageExts.title', "Rich support for all your languages"),
                        description: (0, nls_1.localize)('gettingStarted.findLanguageExts.description.interpolated', "Code smarter with syntax highlighting, code completion, linting and debugging. While many languages are built-in, many more can be added as extensions.\n{0}", Button((0, nls_1.localize)('browseLangExts', "Browse Language Extensions"), 'command:workbench.extensions.action.showLanguageExtensions')),
                        when: 'workspacePlatform != \'webworker\'',
                        media: {
                            type: 'svg', altText: 'Language extensions', path: 'languages.svg'
                        },
                    },
                    {
                        id: 'settingsSyncWeb',
                        title: (0, nls_1.localize)('gettingStarted.settingsSync.title', "Sync settings across devices"),
                        description: (0, nls_1.localize)('gettingStarted.settingsSync.description.interpolated', "Keep your essential customizations backed up and updated across all your devices.\n{0}", Button((0, nls_1.localize)('enableSync', "Backup and Sync Settings"), 'command:workbench.userDataSync.actions.turnOn')),
                        when: 'syncStatus != uninitialized',
                        completionEvents: ['onEvent:sync-enabled'],
                        media: {
                            type: 'svg', altText: 'The "Turn on Sync" entry in the settings gear menu.', path: 'settingsSync.svg'
                        },
                    },
                    {
                        id: 'commandPaletteTaskWeb',
                        title: (0, nls_1.localize)('gettingStarted.commandPalette.title', "Unlock productivity with the Command Palette "),
                        description: (0, nls_1.localize)('gettingStarted.commandPalette.description.interpolated', "Run commands without reaching for your mouse to accomplish any task in VS Code.\n{0}", Button((0, nls_1.localize)('commandPalette', "Open Command Palette"), 'command:workbench.action.showCommands')),
                        media: { type: 'svg', altText: 'Command Palette overlay for searching and executing commands.', path: 'commandPalette.svg' },
                    },
                    {
                        id: 'pickAFolderTask-WebWeb',
                        title: (0, nls_1.localize)('gettingStarted.setup.OpenFolder.title', "Open up your code"),
                        description: (0, nls_1.localize)('gettingStarted.setup.OpenFolderWeb.description.interpolated', "You're all set to start coding. You can open a local project or a remote repository to get your files into VS Code.\n{0}\n{1}", Button((0, nls_1.localize)('openFolder', "Open Folder"), 'command:workbench.action.addRootFolder'), Button((0, nls_1.localize)('openRepository', "Open Repository"), 'command:remoteHub.openRepository')),
                        when: 'workspaceFolderCount == 0',
                        media: {
                            type: 'svg', altText: 'Explorer view showing buttons for opening folder and cloning repository.', path: 'openFolder.svg'
                        }
                    },
                    {
                        id: 'quickOpenWeb',
                        title: (0, nls_1.localize)('gettingStarted.quickOpen.title', "Quickly navigate between your files"),
                        description: (0, nls_1.localize)('gettingStarted.quickOpen.description.interpolated', "Navigate between files in an instant with one keystroke. Tip: Open multiple files by pressing the right arrow key.\n{0}", Button((0, nls_1.localize)('quickOpen', "Quick Open a File"), 'command:toSide:workbench.action.quickOpen')),
                        when: 'workspaceFolderCount != 0',
                        media: {
                            type: 'svg', altText: 'Go to file in quick search.', path: 'search.svg'
                        }
                    }
                ]
            }
        },
        {
            id: 'Beginner',
            isFeatured: false,
            title: (0, nls_1.localize)('gettingStarted.beginner.title', "Learn the Fundamentals"),
            icon: beginnerIcon,
            description: (0, nls_1.localize)('gettingStarted.beginner.description', "Get an overview of the most essential features"),
            content: {
                type: 'steps',
                steps: [
                    {
                        id: 'extensions',
                        title: (0, nls_1.localize)('gettingStarted.extensions.title', "Code with extensions"),
                        description: (0, nls_1.localize)('gettingStarted.extensions.description.interpolated', "Extensions are VS Code's power-ups. They range from handy productivity hacks, expanding out-of-the-box features, to adding completely new capabilities.\n{0}", Button((0, nls_1.localize)('browseRecommended', "Browse Recommended Extensions"), 'command:workbench.extensions.action.showRecommendedExtensions')),
                        when: 'workspacePlatform != \'webworker\'',
                        media: {
                            type: 'svg', altText: 'VS Code extension marketplace with featured language extensions', path: 'extensions.svg'
                        },
                    },
                    {
                        id: 'terminal',
                        title: (0, nls_1.localize)('gettingStarted.terminal.title', "Built-in terminal"),
                        description: (0, nls_1.localize)('gettingStarted.terminal.description.interpolated', "Quickly run shell commands and monitor build output, right next to your code.\n{0}", Button((0, nls_1.localize)('showTerminal', "Open Terminal"), 'command:workbench.action.terminal.toggleTerminal')),
                        when: 'workspacePlatform != \'webworker\' && remoteName != codespaces && !terminalIsOpen',
                        media: {
                            type: 'svg', altText: 'Integrated terminal running a few npm commands', path: 'terminal.svg'
                        },
                    },
                    {
                        id: 'debugging',
                        title: (0, nls_1.localize)('gettingStarted.debug.title', "Watch your code in action"),
                        description: (0, nls_1.localize)('gettingStarted.debug.description.interpolated', "Accelerate your edit, build, test, and debug loop by setting up a launch configuration.\n{0}", Button((0, nls_1.localize)('runProject', "Run your Project"), 'command:workbench.action.debug.selectandstart')),
                        when: 'workspacePlatform != \'webworker\' && workspaceFolderCount != 0',
                        media: {
                            type: 'svg', altText: 'Run and debug view.', path: 'debug.svg',
                        },
                    },
                    {
                        id: 'scmClone',
                        title: (0, nls_1.localize)('gettingStarted.scm.title', "Track your code with Git"),
                        description: (0, nls_1.localize)('gettingStarted.scmClone.description.interpolated', "Set up the built-in version control for your project to track your changes and collaborate with others.\n{0}", Button((0, nls_1.localize)('cloneRepo', "Clone Repository"), 'command:git.clone')),
                        when: 'config.git.enabled && !git.missing && workspaceFolderCount == 0',
                        media: {
                            type: 'svg', altText: 'Source Control view.', path: 'git.svg',
                        },
                    },
                    {
                        id: 'scmSetup',
                        title: (0, nls_1.localize)('gettingStarted.scm.title', "Track your code with Git"),
                        description: (0, nls_1.localize)('gettingStarted.scmSetup.description.interpolated', "Set up the built-in version control for your project to track your changes and collaborate with others.\n{0}", Button((0, nls_1.localize)('initRepo', "Initialize Git Repository"), 'command:git.init')),
                        when: 'config.git.enabled && !git.missing && workspaceFolderCount != 0 && gitOpenRepositoryCount == 0',
                        media: {
                            type: 'svg', altText: 'Source Control view.', path: 'git.svg',
                        },
                    },
                    {
                        id: 'scm',
                        title: (0, nls_1.localize)('gettingStarted.scm.title', "Track your code with Git"),
                        description: (0, nls_1.localize)('gettingStarted.scm.description.interpolated', "No more looking up Git commands! Git and GitHub workflows are seamlessly integrated.\n{0}", Button((0, nls_1.localize)('openSCM', "Open Source Control"), 'command:workbench.view.scm')),
                        when: 'config.git.enabled && !git.missing && workspaceFolderCount != 0 && gitOpenRepositoryCount != 0 && activeViewlet != \'workbench.view.scm\'',
                        media: {
                            type: 'svg', altText: 'Source Control view.', path: 'git.svg',
                        },
                    },
                    {
                        id: 'installGit',
                        title: (0, nls_1.localize)('gettingStarted.installGit.title', "Install Git"),
                        description: (0, nls_1.localize)({ key: 'gettingStarted.installGit.description.interpolated', comment: ['The placeholders are command link items should not be translated'] }, "Install Git to track changes in your projects.\n{0}\n{1}Reload window{2} after installation to complete Git setup.", Button((0, nls_1.localize)('installGit', "Install Git"), 'https://aka.ms/vscode-install-git'), '[', '](command:workbench.action.reloadWindow)'),
                        when: 'git.missing',
                        media: {
                            type: 'svg', altText: 'Install Git.', path: 'git.svg',
                        },
                        completionEvents: [
                            'onContext:git.state == initialized'
                        ]
                    },
                    {
                        id: 'tasks',
                        title: (0, nls_1.localize)('gettingStarted.tasks.title', "Automate your project tasks"),
                        when: 'workspaceFolderCount != 0 && workspacePlatform != \'webworker\'',
                        description: (0, nls_1.localize)('gettingStarted.tasks.description.interpolated', "Create tasks for your common workflows and enjoy the integrated experience of running scripts and automatically checking results.\n{0}", Button((0, nls_1.localize)('runTasks', "Run Auto-detected Tasks"), 'command:workbench.action.tasks.runTask')),
                        media: {
                            type: 'svg', altText: 'Task runner.', path: 'runTask.svg',
                        },
                    },
                    {
                        id: 'shortcuts',
                        title: (0, nls_1.localize)('gettingStarted.shortcuts.title', "Customize your shortcuts"),
                        description: (0, nls_1.localize)('gettingStarted.shortcuts.description.interpolated', "Once you have discovered your favorite commands, create custom keyboard shortcuts for instant access.\n{0}", Button((0, nls_1.localize)('keyboardShortcuts', "Keyboard Shortcuts"), 'command:toSide:workbench.action.openGlobalKeybindings')),
                        media: {
                            type: 'svg', altText: 'Interactive shortcuts.', path: 'shortcuts.svg',
                        }
                    },
                    {
                        id: 'workspaceTrust',
                        title: (0, nls_1.localize)('gettingStarted.workspaceTrust.title', "Safely browse and edit code"),
                        description: (0, nls_1.localize)('gettingStarted.workspaceTrust.description.interpolated', "{0} lets you decide whether your project folders should **allow or restrict** automatic code execution __(required for extensions, debugging, etc)__.\nOpening a file/folder will prompt to grant trust. You can always {1} later.", Button((0, nls_1.localize)('workspaceTrust', "Workspace Trust"), 'https://github.com/microsoft/vscode-docs/blob/workspaceTrust/docs/editor/workspace-trust.md'), Button((0, nls_1.localize)('enableTrust', "enable trust"), 'command:toSide:workbench.action.manageTrustedDomain')),
                        when: 'workspacePlatform != \'webworker\' && !isWorkspaceTrusted && workspaceFolderCount == 0',
                        media: {
                            type: 'svg', altText: 'Workspace Trust editor in Restricted mode and a primary button for switching to Trusted mode.', path: 'workspaceTrust.svg'
                        },
                    },
                ]
            }
        },
        {
            id: 'notebooks',
            title: (0, nls_1.localize)('gettingStarted.notebook.title', "Customize Notebooks"),
            description: '',
            icon: setupIcon,
            isFeatured: false,
            when: `config.${notebookCommon_1.NotebookSetting.openGettingStarted} && userHasOpenedNotebook`,
            content: {
                type: 'steps',
                steps: [
                    {
                        completionEvents: ['onCommand:notebook.setProfile'],
                        id: 'notebookProfile',
                        title: (0, nls_1.localize)('gettingStarted.notebookProfile.title', "Select the layout for your notebooks"),
                        description: (0, nls_1.localize)('gettingStarted.notebookProfile.description', "Get notebooks to feel just the way you prefer"),
                        when: 'userHasOpenedNotebook',
                        media: {
                            type: 'markdown', path: 'notebookProfile'
                        }
                    },
                ]
            }
        }
    ];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0dGluZ1N0YXJ0ZWRDb250ZW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lR2V0dGluZ1N0YXJ0ZWQvY29tbW9uL2dldHRpbmdTdGFydGVkQ29udGVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBTSxTQUFTLEdBQUcsSUFBQSwyQkFBWSxFQUFDLHVCQUF1QixFQUFFLGtCQUFPLENBQUMsR0FBRyxFQUFFLElBQUEsY0FBUSxFQUFDLDRCQUE0QixFQUFFLGtEQUFrRCxDQUFDLENBQUMsQ0FBQztJQUNqSyxNQUFNLFlBQVksR0FBRyxJQUFBLDJCQUFZLEVBQUMsMEJBQTBCLEVBQUUsa0JBQU8sQ0FBQyxTQUFTLEVBQUUsSUFBQSxjQUFRLEVBQUMsK0JBQStCLEVBQUUscURBQXFELENBQUMsQ0FBQyxDQUFDO0lBd0N0SyxRQUFBLFlBQVksR0FBb0M7UUFDNUQ7WUFDQyxFQUFFLEVBQUUsNEJBQTRCO1lBQ2hDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSxhQUFhLENBQUM7WUFDOUQsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLG9DQUFvQyxFQUFFLDREQUE0RCxDQUFDO1lBQ3pILElBQUksRUFBRSxrQkFBTyxDQUFDLE9BQU87WUFDckIsT0FBTyxFQUFFO2dCQUNSLElBQUksRUFBRSxZQUFZO2dCQUNsQixPQUFPLEVBQUUsb0NBQW9DO2FBQzdDO1NBQ0Q7UUFDRDtZQUNDLEVBQUUsRUFBRSxpQkFBaUI7WUFDckIsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLDhCQUE4QixFQUFFLFNBQVMsQ0FBQztZQUMxRCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0NBQW9DLEVBQUUsd0NBQXdDLENBQUM7WUFDckcsSUFBSSxFQUFF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