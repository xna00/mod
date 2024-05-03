define(["require", "exports", "vs/base/common/uri", "assert", "vs/base/common/severity", "vs/base/common/uuid", "vs/base/common/types", "vs/base/common/platform", "vs/base/common/parsers", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskConfiguration", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/workspace/test/common/testWorkspace", "vs/platform/instantiation/test/common/instantiationServiceMock"], function (require, exports, uri_1, assert, severity_1, UUID, Types, Platform, parsers_1, problemMatcher_1, workspace_1, Tasks, taskConfiguration_1, mockKeybindingService_1, testWorkspace_1, instantiationServiceMock_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const workspaceFolder = new workspace_1.WorkspaceFolder({
        uri: uri_1.URI.file('/workspace/folderOne'),
        name: 'folderOne',
        index: 0
    });
    const workspace = new testWorkspace_1.Workspace('id', [workspaceFolder]);
    class ProblemReporter {
        constructor() {
            this._validationStatus = new parsers_1.ValidationStatus();
            this.receivedMessage = false;
            this.lastMessage = undefined;
        }
        info(message) {
            this.log(message);
        }
        warn(message) {
            this.log(message);
        }
        error(message) {
            this.log(message);
        }
        fatal(message) {
            this.log(message);
        }
        get status() {
            return this._validationStatus;
        }
        log(message) {
            this.receivedMessage = true;
            this.lastMessage = message;
        }
        clearMessage() {
            this.lastMessage = undefined;
        }
    }
    class ConfigurationBuilder {
        constructor() {
            this.result = [];
            this.builders = [];
        }
        task(name, command) {
            const builder = new CustomTaskBuilder(this, name, command);
            this.builders.push(builder);
            this.result.push(builder.result);
            return builder;
        }
        done() {
            for (const builder of this.builders) {
                builder.done();
            }
        }
    }
    class PresentationBuilder {
        constructor(parent) {
            this.parent = parent;
            this.result = { echo: false, reveal: Tasks.RevealKind.Always, revealProblems: Tasks.RevealProblemKind.Never, focus: false, panel: Tasks.PanelKind.Shared, showReuseMessage: true, clear: false, close: false };
        }
        echo(value) {
            this.result.echo = value;
            return this;
        }
        reveal(value) {
            this.result.reveal = value;
            return this;
        }
        focus(value) {
            this.result.focus = value;
            return this;
        }
        instance(value) {
            this.result.panel = value;
            return this;
        }
        showReuseMessage(value) {
            this.result.showReuseMessage = value;
            return this;
        }
        close(value) {
            this.result.close = value;
            return this;
        }
        done() {
        }
    }
    class CommandConfigurationBuilder {
        constructor(parent, command) {
            this.parent = parent;
            this.presentationBuilder = new PresentationBuilder(this);
            this.result = {
                name: command,
                runtime: Tasks.RuntimeType.Process,
                args: [],
                options: {
                    cwd: '${workspaceFolder}'
                },
                presentation: this.presentationBuilder.result,
                suppressTaskName: false
            };
        }
        name(value) {
            this.result.name = value;
            return this;
        }
        runtime(value) {
            this.result.runtime = value;
            return this;
        }
        args(value) {
            this.result.args = value;
            return this;
        }
        options(value) {
            this.result.options = value;
            return this;
        }
        taskSelector(value) {
            this.result.taskSelector = value;
            return this;
        }
        suppressTaskName(value) {
            this.result.suppressTaskName = value;
            return this;
        }
        presentation() {
            return this.presentationBuilder;
        }
        done(taskName) {
            this.result.args = this.result.args.map(arg => arg === '$name' ? taskName : arg);
            this.presentationBuilder.done();
        }
    }
    class CustomTaskBuilder {
        constructor(parent, name, command) {
            this.parent = parent;
            this.commandBuilder = new CommandConfigurationBuilder(this, command);
            this.result = new Tasks.CustomTask(name, { kind: Tasks.TaskSourceKind.Workspace, label: 'workspace', config: { workspaceFolder: workspaceFolder, element: undefined, index: -1, file: '.vscode/tasks.json' } }, name, Tasks.CUSTOMIZED_TASK_TYPE, this.commandBuilder.result, false, { reevaluateOnRerun: true }, {
                identifier: name,
                name: name,
                isBackground: false,
                promptOnClose: true,
                problemMatchers: [],
            });
        }
        identifier(value) {
            this.result.configurationProperties.identifier = value;
            return this;
        }
        group(value) {
            this.result.configurationProperties.group = value;
            return this;
        }
        isBackground(value) {
            this.result.configurationProperties.isBackground = value;
            return this;
        }
        promptOnClose(value) {
            this.result.configurationProperties.promptOnClose = value;
            return this;
        }
        problemMatcher() {
            const builder = new ProblemMatcherBuilder(this);
            this.result.configurationProperties.problemMatchers.push(builder.result);
            return builder;
        }
        command() {
            return this.commandBuilder;
        }
        done() {
            this.commandBuilder.done(this.result.configurationProperties.name);
        }
    }
    class ProblemMatcherBuilder {
        static { this.DEFAULT_UUID = UUID.generateUuid(); }
        constructor(parent) {
            this.parent = parent;
            this.result = {
                owner: ProblemMatcherBuilder.DEFAULT_UUID,
                applyTo: problemMatcher_1.ApplyToKind.allDocuments,
                severity: undefined,
                fileLocation: problemMatcher_1.FileLocationKind.Relative,
                filePrefix: '${workspaceFolder}',
                pattern: undefined
            };
        }
        owner(value) {
            this.result.owner = value;
            return this;
        }
        applyTo(value) {
            this.result.applyTo = value;
            return this;
        }
        severity(value) {
            this.result.severity = value;
            return this;
        }
        fileLocation(value) {
            this.result.fileLocation = value;
            return this;
        }
        filePrefix(value) {
            this.result.filePrefix = value;
            return this;
        }
        pattern(regExp) {
            const builder = new PatternBuilder(this, regExp);
            if (!this.result.pattern) {
                this.result.pattern = builder.result;
            }
            return builder;
        }
    }
    class PatternBuilder {
        constructor(parent, regExp) {
            this.parent = parent;
            this.result = {
                regexp: regExp,
                file: 1,
                message: 0,
                line: 2,
                character: 3
            };
        }
        file(value) {
            this.result.file = value;
            return this;
        }
        message(value) {
            this.result.message = value;
            return this;
        }
        location(value) {
            this.result.location = value;
            return this;
        }
        line(value) {
            this.result.line = value;
            return this;
        }
        character(value) {
            this.result.character = value;
            return this;
        }
        endLine(value) {
            this.result.endLine = value;
            return this;
        }
        endCharacter(value) {
            this.result.endCharacter = value;
            return this;
        }
        code(value) {
            this.result.code = value;
            return this;
        }
        severity(value) {
            this.result.severity = value;
            return this;
        }
        loop(value) {
            this.result.loop = value;
            return this;
        }
    }
    class TasksMockContextKeyService extends mockKeybindingService_1.MockContextKeyService {
        getContext(domNode) {
            return {
                getValue: (_key) => {
                    return true;
                }
            };
        }
    }
    function testDefaultProblemMatcher(external, resolved) {
        const reporter = new ProblemReporter();
        const result = (0, taskConfiguration_1.parse)(workspaceFolder, workspace, Platform.platform, external, reporter, taskConfiguration_1.TaskConfigSource.TasksJson, new TasksMockContextKeyService());
        assert.ok(!reporter.receivedMessage);
        assert.strictEqual(result.custom.length, 1);
        const task = result.custom[0];
        assert.ok(task);
        assert.strictEqual(task.configurationProperties.problemMatchers.length, resolved);
    }
    function testConfiguration(external, builder) {
        builder.done();
        const reporter = new ProblemReporter();
        const result = (0, taskConfiguration_1.parse)(workspaceFolder, workspace, Platform.platform, external, reporter, taskConfiguration_1.TaskConfigSource.TasksJson, new TasksMockContextKeyService());
        if (reporter.receivedMessage) {
            assert.ok(false, reporter.lastMessage);
        }
        assertConfiguration(result, builder.result);
    }
    class TaskGroupMap {
        constructor() {
            this._store = Object.create(null);
        }
        add(group, task) {
            let tasks = this._store[group];
            if (!tasks) {
                tasks = [];
                this._store[group] = tasks;
            }
            tasks.push(task);
        }
        static assert(actual, expected) {
            const actualKeys = Object.keys(actual._store);
            const expectedKeys = Object.keys(expected._store);
            if (actualKeys.length === 0 && expectedKeys.length === 0) {
                return;
            }
            assert.strictEqual(actualKeys.length, expectedKeys.length);
            actualKeys.forEach(key => assert.ok(expected._store[key]));
            expectedKeys.forEach(key => actual._store[key]);
            actualKeys.forEach((key) => {
                const actualTasks = actual._store[key];
                const expectedTasks = expected._store[key];
                assert.strictEqual(actualTasks.length, expectedTasks.length);
                if (actualTasks.length === 1) {
                    assert.strictEqual(actualTasks[0].configurationProperties.name, expectedTasks[0].configurationProperties.name);
                    return;
                }
                const expectedTaskMap = Object.create(null);
                expectedTasks.forEach(task => expectedTaskMap[task.configurationProperties.name] = true);
                actualTasks.forEach(task => delete expectedTaskMap[task.configurationProperties.name]);
                assert.strictEqual(Object.keys(expectedTaskMap).length, 0);
            });
        }
    }
    function assertConfiguration(result, expected) {
        assert.ok(result.validationStatus.isOK());
        const actual = result.custom;
        assert.strictEqual(typeof actual, typeof expected);
        if (!actual) {
            return;
        }
        // We can't compare Ids since the parser uses UUID which are random
        // So create a new map using the name.
        const actualTasks = Object.create(null);
        const actualId2Name = Object.create(null);
        const actualTaskGroups = new TaskGroupMap();
        actual.forEach(task => {
            assert.ok(!actualTasks[task.configurationProperties.name]);
            actualTasks[task.configurationProperties.name] = task;
            actualId2Name[task._id] = task.configurationProperties.name;
            const taskId = Tasks.TaskGroup.from(task.configurationProperties.group)?._id;
            if (taskId) {
                actualTaskGroups.add(taskId, task);
            }
        });
        const expectedTasks = Object.create(null);
        const expectedTaskGroup = new TaskGroupMap();
        expected.forEach(task => {
            assert.ok(!expectedTasks[task.configurationProperties.name]);
            expectedTasks[task.configurationProperties.name] = task;
            const taskId = Tasks.TaskGroup.from(task.configurationProperties.group)?._id;
            if (taskId) {
                expectedTaskGroup.add(taskId, task);
            }
        });
        const actualKeys = Object.keys(actualTasks);
        assert.strictEqual(actualKeys.length, expected.length);
        actualKeys.forEach((key) => {
            const actualTask = actualTasks[key];
            const expectedTask = expectedTasks[key];
            assert.ok(expectedTask);
            assertTask(actualTask, expectedTask);
        });
        TaskGroupMap.assert(actualTaskGroups, expectedTaskGroup);
    }
    function assertTask(actual, expected) {
        assert.ok(actual._id);
        assert.strictEqual(actual.configurationProperties.name, expected.configurationProperties.name, 'name');
        if (!Tasks.InMemoryTask.is(actual) && !Tasks.InMemoryTask.is(expected)) {
            assertCommandConfiguration(actual.command, expected.command);
        }
        assert.strictEqual(actual.configurationProperties.isBackground, expected.configurationProperties.isBackground, 'isBackground');
        assert.strictEqual(typeof actual.configurationProperties.problemMatchers, typeof expected.configurationProperties.problemMatchers);
        assert.strictEqual(actual.configurationProperties.promptOnClose, expected.configurationProperties.promptOnClose, 'promptOnClose');
        assert.strictEqual(typeof actual.configurationProperties.group, typeof expected.configurationProperties.group, `group types unequal`);
        if (actual.configurationProperties.problemMatchers && expected.configurationProperties.problemMatchers) {
            assert.strictEqual(actual.configurationProperties.problemMatchers.length, expected.configurationProperties.problemMatchers.length);
            for (let i = 0; i < actual.configurationProperties.problemMatchers.length; i++) {
                assertProblemMatcher(actual.configurationProperties.problemMatchers[i], expected.configurationProperties.problemMatchers[i]);
            }
        }
        if (actual.configurationProperties.group && expected.configurationProperties.group) {
            if (Types.isString(actual.configurationProperties.group)) {
                assert.strictEqual(actual.configurationProperties.group, expected.configurationProperties.group);
            }
            else {
                assertGroup(actual.configurationProperties.group, expected.configurationProperties.group);
            }
        }
    }
    function assertCommandConfiguration(actual, expected) {
        assert.strictEqual(typeof actual, typeof expected);
        if (actual && expected) {
            assertPresentation(actual.presentation, expected.presentation);
            assert.strictEqual(actual.name, expected.name, 'name');
            assert.strictEqual(actual.runtime, expected.runtime, 'runtime type');
            assert.strictEqual(actual.suppressTaskName, expected.suppressTaskName, 'suppressTaskName');
            assert.strictEqual(actual.taskSelector, expected.taskSelector, 'taskSelector');
            assert.deepStrictEqual(actual.args, expected.args, 'args');
            assert.strictEqual(typeof actual.options, typeof expected.options);
            if (actual.options && expected.options) {
                assert.strictEqual(actual.options.cwd, expected.options.cwd, 'cwd');
                assert.strictEqual(typeof actual.options.env, typeof expected.options.env, 'env');
                if (actual.options.env && expected.options.env) {
                    assert.deepStrictEqual(actual.options.env, expected.options.env, 'env');
                }
            }
        }
    }
    function assertGroup(actual, expected) {
        assert.strictEqual(typeof actual, typeof expected);
        if (actual && expected) {
            assert.strictEqual(actual._id, expected._id, `group ids unequal. actual: ${actual._id} expected ${expected._id}`);
            assert.strictEqual(actual.isDefault, expected.isDefault, `group defaults unequal. actual: ${actual.isDefault} expected ${expected.isDefault}`);
        }
    }
    function assertPresentation(actual, expected) {
        assert.strictEqual(typeof actual, typeof expected);
        if (actual && expected) {
            assert.strictEqual(actual.echo, expected.echo);
            assert.strictEqual(actual.reveal, expected.reveal);
        }
    }
    function assertProblemMatcher(actual, expected) {
        assert.strictEqual(typeof actual, typeof expected);
        if (typeof actual === 'string' && typeof expected === 'string') {
            assert.strictEqual(actual, expected, 'Problem matcher references are different');
            return;
        }
        if (typeof actual !== 'string' && typeof expected !== 'string') {
            if (expected.owner === ProblemMatcherBuilder.DEFAULT_UUID) {
                assert.ok(UUID.isUUID(actual.owner), 'Owner must be a UUID');
            }
            else {
                assert.strictEqual(actual.owner, expected.owner);
            }
            assert.strictEqual(actual.applyTo, expected.applyTo);
            assert.strictEqual(actual.severity, expected.severity);
            assert.strictEqual(actual.fileLocation, expected.fileLocation);
            assert.strictEqual(actual.filePrefix, expected.filePrefix);
            if (actual.pattern && expected.pattern) {
                assertProblemPatterns(actual.pattern, expected.pattern);
            }
        }
    }
    function assertProblemPatterns(actual, expected) {
        assert.strictEqual(typeof actual, typeof expected);
        if (Array.isArray(actual)) {
            const actuals = actual;
            const expecteds = expected;
            assert.strictEqual(actuals.length, expecteds.length);
            for (let i = 0; i < actuals.length; i++) {
                assertProblemPattern(actuals[i], expecteds[i]);
            }
        }
        else {
            assertProblemPattern(actual, expected);
        }
    }
    function assertProblemPattern(actual, expected) {
        assert.strictEqual(actual.regexp.toString(), expected.regexp.toString());
        assert.strictEqual(actual.file, expected.file);
        assert.strictEqual(actual.message, expected.message);
        if (typeof expected.location !== 'undefined') {
            assert.strictEqual(actual.location, expected.location);
        }
        else {
            assert.strictEqual(actual.line, expected.line);
            assert.strictEqual(actual.character, expected.character);
            assert.strictEqual(actual.endLine, expected.endLine);
            assert.strictEqual(actual.endCharacter, expected.endCharacter);
        }
        assert.strictEqual(actual.code, expected.code);
        assert.strictEqual(actual.severity, expected.severity);
        assert.strictEqual(actual.loop, expected.loop);
    }
    suite('Tasks version 0.1.0', () => {
        test('tasks: all default', () => {
            const builder = new ConfigurationBuilder();
            builder.task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true);
            testConfiguration({
                version: '0.1.0',
                command: 'tsc'
            }, builder);
        });
        test('tasks: global isShellCommand', () => {
            const builder = new ConfigurationBuilder();
            builder.task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                runtime(Tasks.RuntimeType.Shell);
            testConfiguration({
                version: '0.1.0',
                command: 'tsc',
                isShellCommand: true
            }, builder);
        });
        test('tasks: global show output silent', () => {
            const builder = new ConfigurationBuilder();
            builder.
                task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                presentation().reveal(Tasks.RevealKind.Silent);
            testConfiguration({
                version: '0.1.0',
                command: 'tsc',
                showOutput: 'silent'
            }, builder);
        });
        test('tasks: global promptOnClose default', () => {
            const builder = new ConfigurationBuilder();
            builder.task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true);
            testConfiguration({
                version: '0.1.0',
                command: 'tsc',
                promptOnClose: true
            }, builder);
        });
        test('tasks: global promptOnClose', () => {
            const builder = new ConfigurationBuilder();
            builder.task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                promptOnClose(false).
                command().suppressTaskName(true);
            testConfiguration({
                version: '0.1.0',
                command: 'tsc',
                promptOnClose: false
            }, builder);
        });
        test('tasks: global promptOnClose default watching', () => {
            const builder = new ConfigurationBuilder();
            builder.task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                isBackground(true).
                promptOnClose(false).
                command().suppressTaskName(true);
            testConfiguration({
                version: '0.1.0',
                command: 'tsc',
                isWatching: true
            }, builder);
        });
        test('tasks: global show output never', () => {
            const builder = new ConfigurationBuilder();
            builder.
                task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                presentation().reveal(Tasks.RevealKind.Never);
            testConfiguration({
                version: '0.1.0',
                command: 'tsc',
                showOutput: 'never'
            }, builder);
        });
        test('tasks: global echo Command', () => {
            const builder = new ConfigurationBuilder();
            builder.
                task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                presentation().
                echo(true);
            testConfiguration({
                version: '0.1.0',
                command: 'tsc',
                echoCommand: true
            }, builder);
        });
        test('tasks: global args', () => {
            const builder = new ConfigurationBuilder();
            builder.
                task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                args(['--p']);
            testConfiguration({
                version: '0.1.0',
                command: 'tsc',
                args: [
                    '--p'
                ]
            }, builder);
        });
        test('tasks: options - cwd', () => {
            const builder = new ConfigurationBuilder();
            builder.
                task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                options({
                cwd: 'myPath'
            });
            testConfiguration({
                version: '0.1.0',
                command: 'tsc',
                options: {
                    cwd: 'myPath'
                }
            }, builder);
        });
        test('tasks: options - env', () => {
            const builder = new ConfigurationBuilder();
            builder.
                task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                options({ cwd: '${workspaceFolder}', env: { key: 'value' } });
            testConfiguration({
                version: '0.1.0',
                command: 'tsc',
                options: {
                    env: {
                        key: 'value'
                    }
                }
            }, builder);
        });
        test('tasks: os windows', () => {
            const name = Platform.isWindows ? 'tsc.win' : 'tsc';
            const builder = new ConfigurationBuilder();
            builder.
                task(name, name).
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true);
            const external = {
                version: '0.1.0',
                command: 'tsc',
                windows: {
                    command: 'tsc.win'
                }
            };
            testConfiguration(external, builder);
        });
        test('tasks: os windows & global isShellCommand', () => {
            const name = Platform.isWindows ? 'tsc.win' : 'tsc';
            const builder = new ConfigurationBuilder();
            builder.
                task(name, name).
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                runtime(Tasks.RuntimeType.Shell);
            const external = {
                version: '0.1.0',
                command: 'tsc',
                isShellCommand: true,
                windows: {
                    command: 'tsc.win'
                }
            };
            testConfiguration(external, builder);
        });
        test('tasks: os mac', () => {
            const name = Platform.isMacintosh ? 'tsc.osx' : 'tsc';
            const builder = new ConfigurationBuilder();
            builder.
                task(name, name).
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true);
            const external = {
                version: '0.1.0',
                command: 'tsc',
                osx: {
                    command: 'tsc.osx'
                }
            };
            testConfiguration(external, builder);
        });
        test('tasks: os linux', () => {
            const name = Platform.isLinux ? 'tsc.linux' : 'tsc';
            const builder = new ConfigurationBuilder();
            builder.
                task(name, name).
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true);
            const external = {
                version: '0.1.0',
                command: 'tsc',
                linux: {
                    command: 'tsc.linux'
                }
            };
            testConfiguration(external, builder);
        });
        test('tasks: overwrite showOutput', () => {
            const builder = new ConfigurationBuilder();
            builder.
                task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                presentation().reveal(Platform.isWindows ? Tasks.RevealKind.Always : Tasks.RevealKind.Never);
            const external = {
                version: '0.1.0',
                command: 'tsc',
                showOutput: 'never',
                windows: {
                    showOutput: 'always'
                }
            };
            testConfiguration(external, builder);
        });
        test('tasks: overwrite echo Command', () => {
            const builder = new ConfigurationBuilder();
            builder.
                task('tsc', 'tsc').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                presentation().
                echo(Platform.isWindows ? false : true);
            const external = {
                version: '0.1.0',
                command: 'tsc',
                echoCommand: true,
                windows: {
                    echoCommand: false
                }
            };
            testConfiguration(external, builder);
        });
        test('tasks: global problemMatcher one', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                problemMatcher: '$msCompile'
            };
            testDefaultProblemMatcher(external, 1);
        });
        test('tasks: global problemMatcher two', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                problemMatcher: ['$eslint-compact', '$msCompile']
            };
            testDefaultProblemMatcher(external, 2);
        });
        test('tasks: task definition', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskName'
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').command().args(['$name']);
            testConfiguration(external, builder);
        });
        test('tasks: build task', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskName',
                        isBuildCommand: true
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').group(Tasks.TaskGroup.Build).command().args(['$name']);
            testConfiguration(external, builder);
        });
        test('tasks: default build task', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'build'
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('build', 'tsc').group(Tasks.TaskGroup.Build).command().args(['$name']);
            testConfiguration(external, builder);
        });
        test('tasks: test task', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskName',
                        isTestCommand: true
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').group(Tasks.TaskGroup.Test).command().args(['$name']);
            testConfiguration(external, builder);
        });
        test('tasks: default test task', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'test'
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('test', 'tsc').group(Tasks.TaskGroup.Test).command().args(['$name']);
            testConfiguration(external, builder);
        });
        test('tasks: task with values', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'test',
                        showOutput: 'never',
                        echoCommand: true,
                        args: ['--p'],
                        isWatching: true
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('test', 'tsc').
                group(Tasks.TaskGroup.Test).
                isBackground(true).
                promptOnClose(false).
                command().args(['$name', '--p']).
                presentation().
                echo(true).reveal(Tasks.RevealKind.Never);
            testConfiguration(external, builder);
        });
        test('tasks: task inherits global values', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                showOutput: 'never',
                echoCommand: true,
                tasks: [
                    {
                        taskName: 'test'
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('test', 'tsc').
                group(Tasks.TaskGroup.Test).
                command().args(['$name']).presentation().
                echo(true).reveal(Tasks.RevealKind.Never);
            testConfiguration(external, builder);
        });
        test('tasks: problem matcher default', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskName',
                        problemMatcher: {
                            pattern: {
                                regexp: 'abc'
                            }
                        }
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').
                command().args(['$name']).parent.
                problemMatcher().pattern(/abc/);
            testConfiguration(external, builder);
        });
        test('tasks: problem matcher .* regular expression', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskName',
                        problemMatcher: {
                            pattern: {
                                regexp: '.*'
                            }
                        }
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').
                command().args(['$name']).parent.
                problemMatcher().pattern(/.*/);
            testConfiguration(external, builder);
        });
        test('tasks: problem matcher owner, applyTo, severity and fileLocation', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskName',
                        problemMatcher: {
                            owner: 'myOwner',
                            applyTo: 'closedDocuments',
                            severity: 'warning',
                            fileLocation: 'absolute',
                            pattern: {
                                regexp: 'abc'
                            }
                        }
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').
                command().args(['$name']).parent.
                problemMatcher().
                owner('myOwner').
                applyTo(problemMatcher_1.ApplyToKind.closedDocuments).
                severity(severity_1.default.Warning).
                fileLocation(problemMatcher_1.FileLocationKind.Absolute).
                filePrefix(undefined).
                pattern(/abc/);
            testConfiguration(external, builder);
        });
        test('tasks: problem matcher fileLocation and filePrefix', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskName',
                        problemMatcher: {
                            fileLocation: ['relative', 'myPath'],
                            pattern: {
                                regexp: 'abc'
                            }
                        }
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').
                command().args(['$name']).parent.
                problemMatcher().
                fileLocation(problemMatcher_1.FileLocationKind.Relative).
                filePrefix('myPath').
                pattern(/abc/);
            testConfiguration(external, builder);
        });
        test('tasks: problem pattern location', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskName',
                        problemMatcher: {
                            pattern: {
                                regexp: 'abc',
                                file: 10,
                                message: 11,
                                location: 12,
                                severity: 13,
                                code: 14
                            }
                        }
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').
                command().args(['$name']).parent.
                problemMatcher().
                pattern(/abc/).file(10).message(11).location(12).severity(13).code(14);
            testConfiguration(external, builder);
        });
        test('tasks: problem pattern line & column', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskName',
                        problemMatcher: {
                            pattern: {
                                regexp: 'abc',
                                file: 10,
                                message: 11,
                                line: 12,
                                column: 13,
                                endLine: 14,
                                endColumn: 15,
                                severity: 16,
                                code: 17
                            }
                        }
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').
                command().args(['$name']).parent.
                problemMatcher().
                pattern(/abc/).file(10).message(11).
                line(12).character(13).endLine(14).endCharacter(15).
                severity(16).code(17);
            testConfiguration(external, builder);
        });
        test('tasks: prompt on close default', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskName'
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').
                promptOnClose(true).
                command().args(['$name']);
            testConfiguration(external, builder);
        });
        test('tasks: prompt on close watching', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskName',
                        isWatching: true
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').
                isBackground(true).promptOnClose(false).
                command().args(['$name']);
            testConfiguration(external, builder);
        });
        test('tasks: prompt on close set', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskName',
                        promptOnClose: false
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').
                promptOnClose(false).
                command().args(['$name']);
            testConfiguration(external, builder);
        });
        test('tasks: task selector set', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                taskSelector: '/t:',
                tasks: [
                    {
                        taskName: 'taskName',
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').
                command().
                taskSelector('/t:').
                args(['/t:taskName']);
            testConfiguration(external, builder);
        });
        test('tasks: suppress task name set', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                suppressTaskName: false,
                tasks: [
                    {
                        taskName: 'taskName',
                        suppressTaskName: true
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').
                command().suppressTaskName(true);
            testConfiguration(external, builder);
        });
        test('tasks: suppress task name inherit', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                suppressTaskName: true,
                tasks: [
                    {
                        taskName: 'taskName'
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskName', 'tsc').
                command().suppressTaskName(true);
            testConfiguration(external, builder);
        });
        test('tasks: two tasks', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskNameOne'
                    },
                    {
                        taskName: 'taskNameTwo'
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskNameOne', 'tsc').
                command().args(['$name']);
            builder.task('taskNameTwo', 'tsc').
                command().args(['$name']);
            testConfiguration(external, builder);
        });
        test('tasks: with command', () => {
            const external = {
                version: '0.1.0',
                tasks: [
                    {
                        taskName: 'taskNameOne',
                        command: 'tsc'
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskNameOne', 'tsc').command().suppressTaskName(true);
            testConfiguration(external, builder);
        });
        test('tasks: two tasks with command', () => {
            const external = {
                version: '0.1.0',
                tasks: [
                    {
                        taskName: 'taskNameOne',
                        command: 'tsc'
                    },
                    {
                        taskName: 'taskNameTwo',
                        command: 'dir'
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskNameOne', 'tsc').command().suppressTaskName(true);
            builder.task('taskNameTwo', 'dir').command().suppressTaskName(true);
            testConfiguration(external, builder);
        });
        test('tasks: with command and args', () => {
            const external = {
                version: '0.1.0',
                tasks: [
                    {
                        taskName: 'taskNameOne',
                        command: 'tsc',
                        isShellCommand: true,
                        args: ['arg'],
                        options: {
                            cwd: 'cwd',
                            env: {
                                env: 'env'
                            }
                        }
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskNameOne', 'tsc').command().suppressTaskName(true).
                runtime(Tasks.RuntimeType.Shell).args(['arg']).options({ cwd: 'cwd', env: { env: 'env' } });
            testConfiguration(external, builder);
        });
        test('tasks: with command os specific', () => {
            const name = Platform.isWindows ? 'tsc.win' : 'tsc';
            const external = {
                version: '0.1.0',
                tasks: [
                    {
                        taskName: 'taskNameOne',
                        command: 'tsc',
                        windows: {
                            command: 'tsc.win'
                        }
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskNameOne', name).command().suppressTaskName(true);
            testConfiguration(external, builder);
        });
        test('tasks: with Windows specific args', () => {
            const args = Platform.isWindows ? ['arg1', 'arg2'] : ['arg1'];
            const external = {
                version: '0.1.0',
                tasks: [
                    {
                        taskName: 'tsc',
                        command: 'tsc',
                        args: ['arg1'],
                        windows: {
                            args: ['arg2']
                        }
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('tsc', 'tsc').command().suppressTaskName(true).args(args);
            testConfiguration(external, builder);
        });
        test('tasks: with Linux specific args', () => {
            const args = Platform.isLinux ? ['arg1', 'arg2'] : ['arg1'];
            const external = {
                version: '0.1.0',
                tasks: [
                    {
                        taskName: 'tsc',
                        command: 'tsc',
                        args: ['arg1'],
                        linux: {
                            args: ['arg2']
                        }
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('tsc', 'tsc').command().suppressTaskName(true).args(args);
            testConfiguration(external, builder);
        });
        test('tasks: global command and task command properties', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                tasks: [
                    {
                        taskName: 'taskNameOne',
                        isShellCommand: true,
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskNameOne', 'tsc').command().runtime(Tasks.RuntimeType.Shell).args(['$name']);
            testConfiguration(external, builder);
        });
        test('tasks: global and tasks args', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                args: ['global'],
                tasks: [
                    {
                        taskName: 'taskNameOne',
                        args: ['local']
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskNameOne', 'tsc').command().args(['global', '$name', 'local']);
            testConfiguration(external, builder);
        });
        test('tasks: global and tasks args with task selector', () => {
            const external = {
                version: '0.1.0',
                command: 'tsc',
                args: ['global'],
                taskSelector: '/t:',
                tasks: [
                    {
                        taskName: 'taskNameOne',
                        args: ['local']
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('taskNameOne', 'tsc').command().taskSelector('/t:').args(['global', '/t:taskNameOne', 'local']);
            testConfiguration(external, builder);
        });
    });
    suite('Tasks version 2.0.0', () => {
        test.skip('Build workspace task', () => {
            const external = {
                version: '2.0.0',
                tasks: [
                    {
                        taskName: 'dir',
                        command: 'dir',
                        type: 'shell',
                        group: 'build'
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('dir', 'dir').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                runtime(Tasks.RuntimeType.Shell).
                presentation().echo(true);
            testConfiguration(external, builder);
        });
        test('Global group none', () => {
            const external = {
                version: '2.0.0',
                command: 'dir',
                type: 'shell',
                group: 'none'
            };
            const builder = new ConfigurationBuilder();
            builder.task('dir', 'dir').
                command().suppressTaskName(true).
                runtime(Tasks.RuntimeType.Shell).
                presentation().echo(true);
            testConfiguration(external, builder);
        });
        test.skip('Global group build', () => {
            const external = {
                version: '2.0.0',
                command: 'dir',
                type: 'shell',
                group: 'build'
            };
            const builder = new ConfigurationBuilder();
            builder.task('dir', 'dir').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                runtime(Tasks.RuntimeType.Shell).
                presentation().echo(true);
            testConfiguration(external, builder);
        });
        test.skip('Global group default build', () => {
            const external = {
                version: '2.0.0',
                command: 'dir',
                type: 'shell',
                group: { kind: 'build', isDefault: true }
            };
            const builder = new ConfigurationBuilder();
            const taskGroup = Tasks.TaskGroup.Build;
            taskGroup.isDefault = true;
            builder.task('dir', 'dir').
                group(taskGroup).
                command().suppressTaskName(true).
                runtime(Tasks.RuntimeType.Shell).
                presentation().echo(true);
            testConfiguration(external, builder);
        });
        test('Local group none', () => {
            const external = {
                version: '2.0.0',
                tasks: [
                    {
                        taskName: 'dir',
                        command: 'dir',
                        type: 'shell',
                        group: 'none'
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('dir', 'dir').
                command().suppressTaskName(true).
                runtime(Tasks.RuntimeType.Shell).
                presentation().echo(true);
            testConfiguration(external, builder);
        });
        test.skip('Local group build', () => {
            const external = {
                version: '2.0.0',
                tasks: [
                    {
                        taskName: 'dir',
                        command: 'dir',
                        type: 'shell',
                        group: 'build'
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('dir', 'dir').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                runtime(Tasks.RuntimeType.Shell).
                presentation().echo(true);
            testConfiguration(external, builder);
        });
        test.skip('Local group default build', () => {
            const external = {
                version: '2.0.0',
                tasks: [
                    {
                        taskName: 'dir',
                        command: 'dir',
                        type: 'shell',
                        group: { kind: 'build', isDefault: true }
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            const taskGroup = Tasks.TaskGroup.Build;
            taskGroup.isDefault = true;
            builder.task('dir', 'dir').
                group(taskGroup).
                command().suppressTaskName(true).
                runtime(Tasks.RuntimeType.Shell).
                presentation().echo(true);
            testConfiguration(external, builder);
        });
        test('Arg overwrite', () => {
            const external = {
                version: '2.0.0',
                tasks: [
                    {
                        label: 'echo',
                        type: 'shell',
                        command: 'echo',
                        args: [
                            'global'
                        ],
                        windows: {
                            args: [
                                'windows'
                            ]
                        },
                        linux: {
                            args: [
                                'linux'
                            ]
                        },
                        osx: {
                            args: [
                                'osx'
                            ]
                        }
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            if (Platform.isWindows) {
                builder.task('echo', 'echo').
                    command().suppressTaskName(true).args(['windows']).
                    runtime(Tasks.RuntimeType.Shell).
                    presentation().echo(true);
                testConfiguration(external, builder);
            }
            else if (Platform.isLinux) {
                builder.task('echo', 'echo').
                    command().suppressTaskName(true).args(['linux']).
                    runtime(Tasks.RuntimeType.Shell).
                    presentation().echo(true);
                testConfiguration(external, builder);
            }
            else if (Platform.isMacintosh) {
                builder.task('echo', 'echo').
                    command().suppressTaskName(true).args(['osx']).
                    runtime(Tasks.RuntimeType.Shell).
                    presentation().echo(true);
                testConfiguration(external, builder);
            }
        });
    });
    suite('Bugs / regression tests', () => {
        (Platform.isLinux ? test.skip : test)('Bug 19548', () => {
            const external = {
                version: '0.1.0',
                windows: {
                    command: 'powershell',
                    options: {
                        cwd: '${workspaceFolder}'
                    },
                    tasks: [
                        {
                            taskName: 'composeForDebug',
                            suppressTaskName: true,
                            args: [
                                '-ExecutionPolicy',
                                'RemoteSigned',
                                '.\\dockerTask.ps1',
                                '-ComposeForDebug',
                                '-Environment',
                                'debug'
                            ],
                            isBuildCommand: false,
                            showOutput: 'always',
                            echoCommand: true
                        }
                    ]
                },
                osx: {
                    command: '/bin/bash',
                    options: {
                        cwd: '${workspaceFolder}'
                    },
                    tasks: [
                        {
                            taskName: 'composeForDebug',
                            suppressTaskName: true,
                            args: [
                                '-c',
                                './dockerTask.sh composeForDebug debug'
                            ],
                            isBuildCommand: false,
                            showOutput: 'always'
                        }
                    ]
                }
            };
            const builder = new ConfigurationBuilder();
            if (Platform.isWindows) {
                builder.task('composeForDebug', 'powershell').
                    command().suppressTaskName(true).
                    args(['-ExecutionPolicy', 'RemoteSigned', '.\\dockerTask.ps1', '-ComposeForDebug', '-Environment', 'debug']).
                    options({ cwd: '${workspaceFolder}' }).
                    presentation().echo(true).reveal(Tasks.RevealKind.Always);
                testConfiguration(external, builder);
            }
            else if (Platform.isMacintosh) {
                builder.task('composeForDebug', '/bin/bash').
                    command().suppressTaskName(true).
                    args(['-c', './dockerTask.sh composeForDebug debug']).
                    options({ cwd: '${workspaceFolder}' }).
                    presentation().reveal(Tasks.RevealKind.Always);
                testConfiguration(external, builder);
            }
        });
        test('Bug 28489', () => {
            const external = {
                version: '0.1.0',
                command: '',
                isShellCommand: true,
                args: [''],
                showOutput: 'always',
                'tasks': [
                    {
                        taskName: 'build',
                        command: 'bash',
                        args: [
                            'build.sh'
                        ]
                    }
                ]
            };
            const builder = new ConfigurationBuilder();
            builder.task('build', 'bash').
                group(Tasks.TaskGroup.Build).
                command().suppressTaskName(true).
                args(['build.sh']).
                runtime(Tasks.RuntimeType.Shell);
            testConfiguration(external, builder);
        });
    });
    class TestNamedProblemMatcher {
    }
    class TestParseContext {
    }
    class TestTaskDefinitionRegistry {
        get(key) {
            return this._task;
        }
        set(task) {
            this._task = task;
        }
    }
    suite('Task configuration conversions', () => {
        const globals = {};
        const taskConfigSource = {};
        const TaskDefinitionRegistry = new TestTaskDefinitionRegistry();
        let instantiationService;
        let parseContext;
        let namedProblemMatcher;
        let problemReporter;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            namedProblemMatcher = instantiationService.createInstance(TestNamedProblemMatcher);
            namedProblemMatcher.name = 'real';
            namedProblemMatcher.label = 'real label';
            problemReporter = new ProblemReporter();
            parseContext = instantiationService.createInstance(TestParseContext);
            parseContext.problemReporter = problemReporter;
            parseContext.namedProblemMatchers = { 'real': namedProblemMatcher };
            parseContext.uuidMap = new taskConfiguration_1.UUIDMap();
        });
        teardown(() => {
            instantiationService.dispose();
        });
        suite('ProblemMatcherConverter.from', () => {
            test('returns [] and an error for an unknown problem matcher', () => {
                const result = (taskConfiguration_1.ProblemMatcherConverter.from('$fake', parseContext));
                assert.deepEqual(result.value, []);
                assert.strictEqual(result.errors?.length, 1);
            });
            test('returns config for a known problem matcher', () => {
                const result = (taskConfiguration_1.ProblemMatcherConverter.from('$real', parseContext));
                assert.strictEqual(result.errors?.length, 0);
                assert.deepEqual(result.value, [{ "label": "real label" }]);
            });
            test('returns config for a known problem matcher including applyTo', () => {
                namedProblemMatcher.applyTo = problemMatcher_1.ApplyToKind.closedDocuments;
                const result = (taskConfiguration_1.ProblemMatcherConverter.from('$real', parseContext));
                assert.strictEqual(result.errors?.length, 0);
                assert.deepEqual(result.value, [{ "label": "real label", "applyTo": problemMatcher_1.ApplyToKind.closedDocuments }]);
            });
        });
        suite('TaskParser.from', () => {
            suite('CustomTask', () => {
                suite('incomplete config reports an appropriate error for missing', () => {
                    test('name', () => {
                        const result = taskConfiguration_1.TaskParser.from([{}], globals, parseContext, taskConfigSource);
                        assertTaskParseResult(result, undefined, problemReporter, 'Error: a task must provide a label property');
                    });
                    test('command', () => {
                        const result = taskConfiguration_1.TaskParser.from([{ taskName: 'task' }], globals, parseContext, taskConfigSource);
                        assertTaskParseResult(result, undefined, problemReporter, "Error: the task 'task' doesn't define a command");
                    });
                });
                test('returns expected result', () => {
                    const expected = [
                        { taskName: 'task', command: 'echo test' },
                        { taskName: 'task 2', command: 'echo test' }
                    ];
                    const result = taskConfiguration_1.TaskParser.from(expected, globals, parseContext, taskConfigSource);
                    assertTaskParseResult(result, { custom: expected }, problemReporter, undefined);
                });
            });
            suite('ConfiguredTask', () => {
                test('returns expected result', () => {
                    const expected = [{ taskName: 'task', command: 'echo test', type: 'any', label: 'task' }, { taskName: 'task 2', command: 'echo test', type: 'any', label: 'task 2' }];
                    TaskDefinitionRegistry.set({ extensionId: 'registered', taskType: 'any', properties: {} });
                    const result = taskConfiguration_1.TaskParser.from(expected, globals, parseContext, taskConfigSource, TaskDefinitionRegistry);
                    assertTaskParseResult(result, { configured: expected }, problemReporter, undefined);
                });
            });
        });
    });
    function assertTaskParseResult(actual, expected, problemReporter, expectedMessage) {
        if (expectedMessage === undefined) {
            assert.strictEqual(problemReporter.lastMessage, undefined);
        }
        else {
            assert.ok(problemReporter.lastMessage?.includes(expectedMessage));
        }
        assert.deepEqual(actual.custom.length, expected?.custom?.length || 0);
        assert.deepEqual(actual.configured.length, expected?.configured?.length || 0);
        let index = 0;
        if (expected?.configured) {
            for (const taskParseResult of expected?.configured) {
                assert.strictEqual(actual.configured[index]._label, taskParseResult.label);
                index++;
            }
        }
        index = 0;
        if (expected?.custom) {
            for (const taskParseResult of expected?.custom) {
                assert.strictEqual(actual.custom[index]._label, taskParseResult.taskName);
                index++;
            }
        }
        problemReporter.clearMessage();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza0NvbmZpZ3VyYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFza3MvdGVzdC9jb21tb24vdGFza0NvbmZpZ3VyYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUF1QkEsTUFBTSxlQUFlLEdBQW9CLElBQUksMkJBQWUsQ0FBQztRQUM1RCxHQUFHLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQztRQUNyQyxJQUFJLEVBQUUsV0FBVztRQUNqQixLQUFLLEVBQUUsQ0FBQztLQUNSLENBQUMsQ0FBQztJQUVILE1BQU0sU0FBUyxHQUFlLElBQUkseUJBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO0lBRXJFLE1BQU0sZUFBZTtRQUFyQjtZQUVTLHNCQUFpQixHQUFxQixJQUFJLDBCQUFnQixFQUFFLENBQUM7WUFFOUQsb0JBQWUsR0FBWSxLQUFLLENBQUM7WUFDakMsZ0JBQVcsR0FBdUIsU0FBUyxDQUFDO1FBOEJwRCxDQUFDO1FBNUJPLElBQUksQ0FBQyxPQUFlO1lBQzFCLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUVNLElBQUksQ0FBQyxPQUFlO1lBQzFCLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUVNLEtBQUssQ0FBQyxPQUFlO1lBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUVNLEtBQUssQ0FBQyxPQUFlO1lBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUVELElBQVcsTUFBTTtZQUNoQixPQUFPLElBQUksQ0FBQyxpQkFBaUIs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