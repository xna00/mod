/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getTemplates = getTemplates;
    const dotnetBuild = {
        id: 'dotnetCore',
        label: '.NET Core',
        sort: 'NET Core',
        autoDetect: false,
        description: nls.localize('dotnetCore', 'Executes .NET Core build command'),
        content: [
            '{',
            '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
            '\t// for the documentation about the tasks.json format',
            '\t"version": "2.0.0",',
            '\t"tasks": [',
            '\t\t{',
            '\t\t\t"label": "build",',
            '\t\t\t"command": "dotnet",',
            '\t\t\t"type": "shell",',
            '\t\t\t"args": [',
            '\t\t\t\t"build",',
            '\t\t\t\t// Ask dotnet build to generate full paths for file names.',
            '\t\t\t\t"/property:GenerateFullPaths=true",',
            '\t\t\t\t// Do not generate summary otherwise it leads to duplicate errors in Problems panel',
            '\t\t\t\t"/consoleloggerparameters:NoSummary"',
            '\t\t\t],',
            '\t\t\t"group": "build",',
            '\t\t\t"presentation": {',
            '\t\t\t\t"reveal": "silent"',
            '\t\t\t},',
            '\t\t\t"problemMatcher": "$msCompile"',
            '\t\t}',
            '\t]',
            '}'
        ].join('\n')
    };
    const msbuild = {
        id: 'msbuild',
        label: 'MSBuild',
        autoDetect: false,
        description: nls.localize('msbuild', 'Executes the build target'),
        content: [
            '{',
            '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
            '\t// for the documentation about the tasks.json format',
            '\t"version": "2.0.0",',
            '\t"tasks": [',
            '\t\t{',
            '\t\t\t"label": "build",',
            '\t\t\t"type": "shell",',
            '\t\t\t"command": "msbuild",',
            '\t\t\t"args": [',
            '\t\t\t\t// Ask msbuild to generate full paths for file names.',
            '\t\t\t\t"/property:GenerateFullPaths=true",',
            '\t\t\t\t"/t:build",',
            '\t\t\t\t// Do not generate summary otherwise it leads to duplicate errors in Problems panel',
            '\t\t\t\t"/consoleloggerparameters:NoSummary"',
            '\t\t\t],',
            '\t\t\t"group": "build",',
            '\t\t\t"presentation": {',
            '\t\t\t\t// Reveal the output only if unrecognized errors occur.',
            '\t\t\t\t"reveal": "silent"',
            '\t\t\t},',
            '\t\t\t// Use the standard MS compiler pattern to detect errors, warnings and infos',
            '\t\t\t"problemMatcher": "$msCompile"',
            '\t\t}',
            '\t]',
            '}'
        ].join('\n')
    };
    const command = {
        id: 'externalCommand',
        label: 'Others',
        autoDetect: false,
        description: nls.localize('externalCommand', 'Example to run an arbitrary external command'),
        content: [
            '{',
            '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
            '\t// for the documentation about the tasks.json format',
            '\t"version": "2.0.0",',
            '\t"tasks": [',
            '\t\t{',
            '\t\t\t"label": "echo",',
            '\t\t\t"type": "shell",',
            '\t\t\t"command": "echo Hello"',
            '\t\t}',
            '\t]',
            '}'
        ].join('\n')
    };
    const maven = {
        id: 'maven',
        label: 'maven',
        sort: 'MVN',
        autoDetect: false,
        description: nls.localize('Maven', 'Executes common maven commands'),
        content: [
            '{',
            '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
            '\t// for the documentation about the tasks.json format',
            '\t"version": "2.0.0",',
            '\t"tasks": [',
            '\t\t{',
            '\t\t\t"label": "verify",',
            '\t\t\t"type": "shell",',
            '\t\t\t"command": "mvn -B verify",',
            '\t\t\t"group": "build"',
            '\t\t},',
            '\t\t{',
            '\t\t\t"label": "test",',
            '\t\t\t"type": "shell",',
            '\t\t\t"command": "mvn -B test",',
            '\t\t\t"group": "test"',
            '\t\t}',
            '\t]',
            '}'
        ].join('\n')
    };
    let _templates = null;
    function getTemplates() {
        if (!_templates) {
            _templates = [dotnetBuild, msbuild, maven].sort((a, b) => {
                return (a.sort || a.label).localeCompare(b.sort || b.label);
            });
            _templates.push(command);
        }
        return _templates;
    }
});
/** Version 1.0 templates
 *
const gulp: TaskEntry = {
    id: 'gulp',
    label: 'Gulp',
    autoDetect: true,
    content: [
        '{',
        '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
        '\t// for the documentation about the tasks.json format',
        '\t"version": "0.1.0",',
        '\t"command": "gulp",',
        '\t"isShellCommand": true,',
        '\t"args": ["--no-color"],',
        '\t"showOutput": "always"',
        '}'
    ].join('\n')
};

const grunt: TaskEntry = {
    id: 'grunt',
    label: 'Grunt',
    autoDetect: true,
    content: [
        '{',
        '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
        '\t// for the documentation about the tasks.json format',
        '\t"version": "0.1.0",',
        '\t"command": "grunt",',
        '\t"isShellCommand": true,',
        '\t"args": ["--no-color"],',
        '\t"showOutput": "always"',
        '}'
    ].join('\n')
};

const npm: TaskEntry = {
    id: 'npm',
    label: 'npm',
    sort: 'NPM',
    autoDetect: false,
    content: [
        '{',
        '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
        '\t// for the documentation about the tasks.json format',
        '\t"version": "0.1.0",',
        '\t"command": "npm",',
        '\t"isShellCommand": true,',
        '\t"showOutput": "always",',
        '\t"suppressTaskName": true,',
        '\t"tasks": [',
        '\t\t{',
        '\t\t\t"taskName": "install",',
        '\t\t\t"args": ["install"]',
        '\t\t},',
        '\t\t{',
        '\t\t\t"taskName": "update",',
        '\t\t\t"args": ["update"]',
        '\t\t},',
        '\t\t{',
        '\t\t\t"taskName": "test",',
        '\t\t\t"args": ["run", "test"]',
        '\t\t}',
        '\t]',
        '}'
    ].join('\n')
};

const tscConfig: TaskEntry = {
    id: 'tsc.config',
    label: 'TypeScript - tsconfig.json',
    autoDetect: false,
    description: nls.localize('tsc.config', 'Compiles a TypeScript project'),
    content: [
        '{',
        '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
        '\t// for the documentation about the tasks.json format',
        '\t"version": "0.1.0",',
        '\t"command": "tsc",',
        '\t"isShellCommand": true,',
        '\t"args": ["-p", "."],',
        '\t"showOutput": "silent",',
        '\t"problemMatcher": "$tsc"',
        '}'
    ].join('\n')
};

const tscWatch: TaskEntry = {
    id: 'tsc.watch',
    label: 'TypeScript - Watch Mode',
    autoDetect: false,
    description: nls.localize('tsc.watch', 'Compiles a TypeScript project in watch mode'),
    content: [
        '{',
        '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
        '\t// for the documentation about the tasks.json format',
        '\t"version": "0.1.0",',
        '\t"command": "tsc",',
        '\t"isShellCommand": true,',
        '\t"args": ["-w", "-p", "."],',
        '\t"showOutput": "silent",',
        '\t"isBackground": true,',
        '\t"problemMatcher": "$tsc-watch"',
        '}'
    ].join('\n')
};

const dotnetBuild: TaskEntry = {
    id: 'dotnetCore',
    label: '.NET Core',
    sort: 'NET Core',
    autoDetect: false,
    description: nls.localize('dotnetCore', 'Executes .NET Core build command'),
    content: [
        '{',
        '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
        '\t// for the documentation about the tasks.json format',
        '\t"version": "0.1.0",',
        '\t"command": "dotnet",',
        '\t"isShellCommand": true,',
        '\t"args": [],',
        '\t"tasks": [',
        '\t\t{',
        '\t\t\t"taskName": "build",',
        '\t\t\t"args": [ ],',
        '\t\t\t"isBuildCommand": true,',
        '\t\t\t"showOutput": "silent",',
        '\t\t\t"problemMatcher": "$msCompile"',
        '\t\t}',
        '\t]',
        '}'
    ].join('\n')
};

const msbuild: TaskEntry = {
    id: 'msbuild',
    label: 'MSBuild',
    autoDetect: false,
    description: nls.localize('msbuild', 'Executes the build target'),
    content: [
        '{',
        '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
        '\t// for the documentation about the tasks.json format',
        '\t"version": "0.1.0",',
        '\t"command": "msbuild",',
        '\t"args": [',
        '\t\t// Ask msbuild to generate full paths for file names.',
        '\t\t"/property:GenerateFullPaths=true"',
        '\t],',
        '\t"taskSelector": "/t:",',
        '\t"showOutput": "silent",',
        '\t"tasks": [',
        '\t\t{',
        '\t\t\t"taskName": "build",',
        '\t\t\t// Show the output window only if unrecognized errors occur.',
        '\t\t\t"showOutput": "silent",',
        '\t\t\t// Use the standard MS compiler pattern to detect errors, warnings and infos',
        '\t\t\t"problemMatcher": "$msCompile"',
        '\t\t}',
        '\t]',
        '}'
    ].join('\n')
};

const command: TaskEntry = {
    id: 'externalCommand',
    label: 'Others',
    autoDetect: false,
    description: nls.localize('externalCommand', 'Example to run an arbitrary external command'),
    content: [
        '{',
        '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
        '\t// for the documentation about the tasks.json format',
        '\t"version": "0.1.0",',
        '\t"command": "echo",',
        '\t"isShellCommand": true,',
        '\t"args": ["Hello World"],',
        '\t"showOutput": "always"',
        '}'
    ].join('\n')
};

const maven: TaskEntry = {
    id: 'maven',
    label: 'maven',
    sort: 'MVN',
    autoDetect: false,
    description: nls.localize('Maven', 'Executes common maven commands'),
    content: [
        '{',
        '\t// See https://go.microsoft.com/fwlink/?LinkId=733558',
        '\t// for the documentation about the tasks.json format',
        '\t"version": "0.1.0",',
        '\t"command": "mvn",',
        '\t"isShellCommand": true,',
        '\t"showOutput": "always",',
        '\t"suppressTaskName": true,',
        '\t"tasks": [',
        '\t\t{',
        '\t\t\t"taskName": "verify",',
        '\t\t\t"args": ["-B", "verify"],',
        '\t\t\t"isBuildCommand": true',
        '\t\t},',
        '\t\t{',
        '\t\t\t"taskName": "test",',
        '\t\t\t"args": ["-B", "test"],',
        '\t\t\t"isTestCommand": true',
        '\t\t}',
        '\t]',
        '}'
    ].join('\n')
};

export let templates: TaskEntry[] = [gulp, grunt, tscConfig, tscWatch, dotnetBuild, msbuild, npm, maven].sort((a, b) => {
    return (a.sort || a.label).localeCompare(b.sort || b.label);
});
templates.push(command);
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza1RlbXBsYXRlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFza3MvY29tbW9uL3Rhc2tUZW1wbGF0ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvSWhHLG9DQVFDO0lBaElELE1BQU0sV0FBVyxHQUFlO1FBQy9CLEVBQUUsRUFBRSxZQUFZO1FBQ2hCLEtBQUssRUFBRSxXQUFXO1FBQ2xCLElBQUksRUFBRSxVQUFVO1FBQ2hCLFVBQVUsRUFBRSxLQUFLO1FBQ2pCLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxrQ0FBa0MsQ0FBQztRQUMzRSxPQUFPLEVBQUU7WUFDUixHQUFHO1lBQ0gseURBQXlEO1lBQ3pELHdEQUF3RDtZQUN4RCx1QkFBdUI7WUFDdkIsY0FBYztZQUNkLE9BQU87WUFDUCx5QkFBeUI7WUFDekIsNEJBQTRCO1lBQzVCLHdCQUF3QjtZQUN4QixpQkFBaUI7WUFDakIsa0JBQWtCO1lBQ2xCLG9FQUFvRTtZQUNwRSw2Q0FBNkM7WUFDN0MsNkZBQTZGO1lBQzdGLDhDQUE4QztZQUM5QyxVQUFVO1lBQ1YseUJBQXlCO1lBQ3pCLHlCQUF5QjtZQUN6Qiw0QkFBNEI7WUFDNUIsVUFBVTtZQUNWLHNDQUFzQztZQUN0QyxPQUFPO1lBQ1AsS0FBSztZQUNMLEdBQUc7U0FDSCxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7S0FDWixDQUFDO0lBRUYsTUFBTSxPQUFPLEdBQWU7UUFDM0IsRUFBRSxFQUFFLFNBQVM7UUFDYixLQUFLLEVBQUUsU0FBUztRQUNoQixVQUFVLEVBQUUsS0FBSztRQUNqQixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsMkJBQTJCLENBQUM7UUFDakUsT0FBTyxFQUFFO1lBQ1IsR0FB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