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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/nls", "vs/base/common/observable", "vs/platform/telemetry/common/telemetry"], function (require, exports, lifecycle_1, network_1, accessibility_1, configuration_1, instantiation_1, event_1, nls_1, observable_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilitySignal = exports.AccessibilityAlertSettingId = exports.SoundSource = exports.Sound = exports.AccessibilitySignalService = exports.IAccessibilitySignalService = void 0;
    exports.IAccessibilitySignalService = (0, instantiation_1.createDecorator)('accessibilitySignalService');
    let AccessibilitySignalService = class AccessibilitySignalService extends lifecycle_1.Disposable {
        constructor(configurationService, accessibilityService, telemetryService) {
            super();
            this.configurationService = configurationService;
            this.accessibilityService = accessibilityService;
            this.telemetryService = telemetryService;
            this.sounds = new Map();
            this.screenReaderAttached = (0, observable_1.observableFromEvent)(this.accessibilityService.onDidChangeScreenReaderOptimized, () => /** @description accessibilityService.onDidChangeScreenReaderOptimized */ this.accessibilityService.isScreenReaderOptimized());
            this.sentTelemetry = new Set();
            this.playingSounds = new Set();
            this.obsoleteAccessibilitySignalsEnabled = (0, observable_1.observableFromEvent)(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, (e) => e.affectsConfiguration('accessibilitySignals.enabled')), () => /** @description config: accessibilitySignals.enabled */ this.configurationService.getValue('accessibilitySignals.enabled'));
            this.isSoundEnabledCache = new Cache((event) => {
                const settingObservable = (0, observable_1.observableFromEvent)(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, (e) => e.affectsConfiguration(event.signal.legacySoundSettingsKey) || e.affectsConfiguration(event.signal.settingsKey)), () => this.configurationService.getValue(event.signal.settingsKey + '.sound'));
                return (0, observable_1.derived)(reader => {
                    /** @description sound enabled */
                    const setting = settingObservable.read(reader);
                    if (setting === 'on' ||
                        (setting === 'auto' && this.screenReaderAttached.read(reader))) {
                        return true;
                    }
                    else if (setting === 'always' || setting === 'userGesture' && event.userGesture) {
                        return true;
                    }
                    const obsoleteSetting = this.obsoleteAccessibilitySignalsEnabled.read(reader);
                    if (obsoleteSetting === 'on' ||
                        (obsoleteSetting === 'auto' && this.screenReaderAttached.read(reader))) {
                        return true;
                    }
                    return false;
                });
            }, JSON.stringify);
            this.isAnnouncementEnabledCache = new Cache((event) => {
                const settingObservable = (0, observable_1.observableFromEvent)(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, (e) => e.affectsConfiguration(event.signal.legacyAnnouncementSettingsKey) || e.affectsConfiguration(event.signal.settingsKey)), () => event.signal.announcementMessage ? this.configurationService.getValue(event.signal.settingsKey + '.announcement') : false);
                return (0, observable_1.derived)(reader => {
                    /** @description announcement enabled */
                    const setting = settingObservable.read(reader);
                    if (!this.screenReaderAttached.read(reader)) {
                        return false;
                    }
                    return setting === 'auto' || setting === 'always' || setting === 'userGesture' && event.userGesture;
                });
            }, JSON.stringify);
        }
        async playSignal(signal, options = {}) {
            const announcementMessage = signal.announcementMessage;
            if (this.isAnnouncementEnabled(signal, options.userGesture) && announcementMessage) {
                this.accessibilityService.status(announcementMessage);
            }
            if (this.isSoundEnabled(signal, options.userGesture)) {
                this.sendSignalTelemetry(signal, options.source);
                await this.playSound(signal.sound.getSound(), options.allowManyInParallel);
            }
        }
        async playSignals(signals) {
            for (const signal of signals) {
                this.sendSignalTelemetry('signal' in signal ? signal.signal : signal, 'source' in signal ? signal.source : undefined);
            }
            const signalArray = signals.map(s => 'signal' in s ? s.signal : s);
            const announcements = signalArray.filter(signal => this.isAnnouncementEnabled(signal)).map(s => s.announcementMessage);
            if (announcements.length) {
                this.accessibilityService.status(announcements.join(', '));
            }
            // Some sounds are reused. Don't play the same sound twice.
            const sounds = new Set(signalArray.filter(signal => this.isSoundEnabled(signal)).map(signal => signal.sound.getSound()));
            await Promise.all(Array.from(sounds).map(sound => this.playSound(sound, true)));
        }
        sendSignalTelemetry(signal, source) {
            const isScreenReaderOptimized = this.accessibilityService.isScreenReaderOptimized();
            const key = signal.name + (source ? `::${source}` : '') + (isScreenReaderOptimized ? '{screenReaderOptimized}' : '');
            // Only send once per user session
            if (this.sentTelemetry.has(key) || this.getVolumeInPercent() === 0) {
                return;
            }
            this.sentTelemetry.add(key);
            this.telemetryService.publicLog2('signal.played', {
                signal: signal.name,
                source: source ?? '',
                isScreenReaderOptimized,
            });
        }
        getVolumeInPercent() {
            const volume = this.configurationService.getValue('accessibilitySignals.volume');
            if (typeof volume !== 'number') {
                return 50;
            }
            return Math.max(Math.min(volume, 100), 0);
        }
        async playSound(sound, allowManyInParallel = false) {
            if (!allowManyInParallel && this.playingSounds.has(sound)) {
                return;
            }
            this.playingSounds.add(sound);
            const url = network_1.FileAccess.asBrowserUri(`vs/platform/accessibilitySignal/browser/media/${sound.fileName}`).toString(true);
            try {
                const sound = this.sounds.get(url);
                if (sound) {
                    sound.volume = this.getVolumeInPercent() / 100;
                    sound.currentTime = 0;
                    await sound.play();
                }
                else {
                    const playedSound = await playAudio(url, this.getVolumeInPercent() / 100);
                    this.sounds.set(url, playedSound);
                }
            }
            catch (e) {
                if (!e.message.includes('play() can only be initiated by a user gesture')) {
                    // tracking this issue in #178642, no need to spam the console
                    console.error('Error while playing sound', e);
                }
            }
            finally {
                this.playingSounds.delete(sound);
            }
        }
        playSignalLoop(signal, milliseconds) {
            let playing = true;
            const playSound = () => {
                if (playing) {
                    this.playSignal(signal, { allowManyInParallel: true }).finally(() => {
                        setTimeout(() => {
                            if (playing) {
                                playSound();
                            }
                        }, milliseconds);
                    });
                }
            };
            playSound();
            return (0, lifecycle_1.toDisposable)(() => playing = false);
        }
        isAnnouncementEnabled(signal, userGesture) {
            if (!signal.announcementMessage) {
                return false;
            }
            return this.isAnnouncementEnabledCache.get({ signal, userGesture }).get() ?? false;
        }
        isSoundEnabled(signal, userGesture) {
            return this.isSoundEnabledCache.get({ signal, userGesture }).get() ?? false;
        }
        onSoundEnabledChanged(signal) {
            return event_1.Event.fromObservableLight(this.isSoundEnabledCache.get({ signal }));
        }
        onAnnouncementEnabledChanged(signal) {
            return event_1.Event.fromObservableLight(this.isAnnouncementEnabledCache.get({ signal }));
        }
    };
    exports.AccessibilitySignalService = AccessibilitySignalService;
    exports.AccessibilitySignalService = AccessibilitySignalService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, accessibility_1.IAccessibilityService),
        __param(2, telemetry_1.ITelemetryService)
    ], AccessibilitySignalService);
    /**
     * Play the given audio url.
     * @volume value between 0 and 1
     */
    function playAudio(url, volume) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(url);
            audio.volume = volume;
            audio.addEventListener('ended', () => {
                resolve(audio);
            });
            audio.addEventListener('error', (e) => {
                // When the error event fires, ended might not be called
                reject(e.error);
            });
            audio.play().catch(e => {
                // When play fails, the error event is not fired.
                reject(e);
            });
        });
    }
    class Cache {
        constructor(getValue, getKey) {
            this.getValue = getValue;
            this.getKey = getKey;
            this.map = new Map();
        }
        get(arg) {
            if (this.map.has(arg)) {
                return this.map.get(arg);
            }
            const value = this.getValue(arg);
            const key = this.getKey(arg);
            this.map.set(key, value);
            return value;
        }
    }
    /**
     * Corresponds to the audio files in ./media.
    */
    class Sound {
        static register(options) {
            const sound = new Sound(options.fileName);
            return sound;
        }
        static { this.error = Sound.register({ fileName: 'error.mp3' }); }
        static { this.warning = Sound.register({ fileName: 'warning.mp3' }); }
        static { this.foldedArea = Sound.register({ fileName: 'foldedAreas.mp3' }); }
        static { this.break = Sound.register({ fileName: 'break.mp3' }); }
        static { this.quickFixes = Sound.register({ fileName: 'quickFixes.mp3' }); }
        static { this.taskCompleted = Sound.register({ fileName: 'taskCompleted.mp3' }); }
        static { this.taskFailed = Sound.register({ fileName: 'taskFailed.mp3' }); }
        static { this.terminalBell = Sound.register({ fileName: 'terminalBell.mp3' }); }
        static { this.diffLineInserted = Sound.register({ fileName: 'diffLineInserted.mp3' }); }
        static { this.diffLineDeleted = Sound.register({ fileName: 'diffLineDeleted.mp3' }); }
        static { this.diffLineModified = Sound.register({ fileName: 'diffLineModified.mp3' }); }
        static { this.chatRequestSent = Sound.register({ fileName: 'chatRequestSent.mp3' }); }
        static { this.chatResponsePending = Sound.register({ fileName: 'chatResponsePending.mp3' }); }
        static { this.chatResponseReceived1 = Sound.register({ fileName: 'chatResponseReceived1.mp3' }); }
        static { this.chatResponseReceived2 = Sound.register({ fileName: 'chatResponseReceived2.mp3' }); }
        static { this.chatResponseReceived3 = Sound.register({ fileName: 'chatResponseReceived3.mp3' }); }
        static { this.chatResponseReceived4 = Sound.register({ fileName: 'chatResponseReceived4.mp3' }); }
        static { this.clear = Sound.register({ fileName: 'clear.mp3' }); }
        static { this.save = Sound.register({ fileName: 'save.mp3' }); }
        static { this.format = Sound.register({ fileName: 'format.mp3' }); }
        static { this.voiceRecordingStarted = Sound.register({ fileName: 'voiceRecordingStarted.mp3' }); }
        static { this.voiceRecordingStopped = Sound.register({ fileName: 'voiceRecordingStopped.mp3' }); }
        constructor(fileName) {
            this.fileName = fileName;
        }
    }
    exports.Sound = Sound;
    class SoundSource {
        constructor(randomOneOf) {
            this.randomOneOf = randomOneOf;
        }
        getSound(deterministic = false) {
            if (deterministic || this.randomOneOf.length === 1) {
                return this.randomOneOf[0];
            }
            else {
                const index = Math.floor(Math.random() * this.randomOneOf.length);
                return this.randomOneOf[index];
            }
        }
    }
    exports.SoundSource = SoundSource;
    var AccessibilityAlertSettingId;
    (function (AccessibilityAlertSettingId) {
        AccessibilityAlertSettingId["Save"] = "accessibility.alert.save";
        AccessibilityAlertSettingId["Format"] = "accessibility.alert.format";
        AccessibilityAlertSettingId["Clear"] = "accessibility.alert.clear";
        AccessibilityAlertSettingId["Breakpoint"] = "accessibility.alert.breakpoint";
        AccessibilityAlertSettingId["Error"] = "accessibility.alert.error";
        AccessibilityAlertSettingId["Warning"] = "accessibility.alert.warning";
        AccessibilityAlertSettingId["FoldedArea"] = "accessibility.alert.foldedArea";
        AccessibilityAlertSettingId["TerminalQuickFix"] = "accessibility.alert.terminalQuickFix";
        AccessibilityAlertSettingId["TerminalBell"] = "accessibility.alert.terminalBell";
        AccessibilityAlertSettingId["TerminalCommandFailed"] = "accessibility.alert.terminalCommandFailed";
        AccessibilityAlertSettingId["TaskCompleted"] = "accessibility.alert.taskCompleted";
        AccessibilityAlertSettingId["TaskFailed"] = "accessibility.alert.taskFailed";
        AccessibilityAlertSettingId["ChatRequestSent"] = "accessibility.alert.chatRequestSent";
        AccessibilityAlertSettingId["NotebookCellCompleted"] = "accessibility.alert.notebookCellCompleted";
        AccessibilityAlertSettingId["NotebookCellFailed"] = "accessibility.alert.notebookCellFailed";
        AccessibilityAlertSettingId["OnDebugBreak"] = "accessibility.alert.onDebugBreak";
        AccessibilityAlertSettingId["NoInlayHints"] = "accessibility.alert.noInlayHints";
        AccessibilityAlertSettingId["LineHasBreakpoint"] = "accessibility.alert.lineHasBreakpoint";
        AccessibilityAlertSettingId["ChatResponsePending"] = "accessibility.alert.chatResponsePending";
    })(AccessibilityAlertSettingId || (exports.AccessibilityAlertSettingId = AccessibilityAlertSettingId = {}));
    class AccessibilitySignal {
        static { this._signals = new Set(); }
        static register(options) {
            const soundSource = new SoundSource('randomOneOf' in options.sound ? options.sound.randomOneOf : [options.sound]);
            const signal = new AccessibilitySignal(soundSource, options.name, options.legacySoundSettingsKey, options.settingsKey, options.legacyAnnouncementSettingsKey, options.announcementMessage);
            AccessibilitySignal._signals.add(signal);
            return signal;
        }
        static get allAccessibilitySignals() {
            return [...this._signals];
        }
        static { this.error = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.lineHasError.name', 'Error on Line'),
            sound: Sound.error,
            legacySoundSettingsKey: 'audioCues.lineHasError',
            legacyAnnouncementSettingsKey: "accessibility.alert.error" /* AccessibilityAlertSettingId.Error */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.lineHasError', 'Error'),
            settingsKey: 'accessibility.signals.lineHasError'
        }); }
        static { this.warning = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.lineHasWarning.name', 'Warning on Line'),
            sound: Sound.warning,
            legacySoundSettingsKey: 'audioCues.lineHasWarning',
            legacyAnnouncementSettingsKey: "accessibility.alert.warning" /* AccessibilityAlertSettingId.Warning */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.lineHasWarning', 'Warning'),
            settingsKey: 'accessibility.signals.lineHasWarning'
        }); }
        static { this.foldedArea = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.lineHasFoldedArea.name', 'Folded Area on Line'),
            sound: Sound.foldedArea,
            legacySoundSettingsKey: 'audioCues.lineHasFoldedArea',
            legacyAnnouncementSettingsKey: "accessibility.alert.foldedArea" /* AccessibilityAlertSettingId.FoldedArea */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.lineHasFoldedArea', 'Folded'),
            settingsKey: 'accessibility.signals.lineHasFoldedArea'
        }); }
        static { this.break = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.lineHasBreakpoint.name', 'Breakpoint on Line'),
            sound: Sound.break,
            legacySoundSettingsKey: 'audioCues.lineHasBreakpoint',
            legacyAnnouncementSettingsKey: "accessibility.alert.breakpoint" /* AccessibilityAlertSettingId.Breakpoint */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.lineHasBreakpoint', 'Breakpoint'),
            settingsKey: 'accessibility.signals.lineHasBreakpoint'
        }); }
        static { this.inlineSuggestion = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.lineHasInlineSuggestion.name', 'Inline Suggestion on Line'),
            sound: Sound.quickFixes,
            legacySoundSettingsKey: 'audioCues.lineHasInlineSuggestion',
            settingsKey: 'accessibility.signals.lineHasInlineSuggestion'
        }); }
        static { this.terminalQuickFix = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.terminalQuickFix.name', 'Terminal Quick Fix'),
            sound: Sound.quickFixes,
            legacySoundSettingsKey: 'audioCues.terminalQuickFix',
            legacyAnnouncementSettingsKey: "accessibility.alert.terminalQuickFix" /* AccessibilityAlertSettingId.TerminalQuickFix */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.terminalQuickFix', 'Quick Fix'),
            settingsKey: 'accessibility.signals.terminalQuickFix'
        }); }
        static { this.onDebugBreak = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.onDebugBreak.name', 'Debugger Stopped on Breakpoint'),
            sound: Sound.break,
            legacySoundSettingsKey: 'audioCues.onDebugBreak',
            legacyAnnouncementSettingsKey: "accessibility.alert.onDebugBreak" /* AccessibilityAlertSettingId.OnDebugBreak */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.onDebugBreak', 'Breakpoint'),
            settingsKey: 'accessibility.signals.onDebugBreak'
        }); }
        static { this.noInlayHints = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.noInlayHints', 'No Inlay Hints on Line'),
            sound: Sound.error,
            legacySoundSettingsKey: 'audioCues.noInlayHints',
            legacyAnnouncementSettingsKey: "accessibility.alert.noInlayHints" /* AccessibilityAlertSettingId.NoInlayHints */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.noInlayHints', 'No Inlay Hints'),
            settingsKey: 'accessibility.signals.noInlayHints'
        }); }
        static { this.taskCompleted = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.taskCompleted', 'Task Completed'),
            sound: Sound.taskCompleted,
            legacySoundSettingsKey: 'audioCues.taskCompleted',
            legacyAnnouncementSettingsKey: "accessibility.alert.taskCompleted" /* AccessibilityAlertSettingId.TaskCompleted */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.taskCompleted', 'Task Completed'),
            settingsKey: 'accessibility.signals.taskCompleted'
        }); }
        static { this.taskFailed = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.taskFailed', 'Task Failed'),
            sound: Sound.taskFailed,
            legacySoundSettingsKey: 'audioCues.taskFailed',
            legacyAnnouncementSettingsKey: "accessibility.alert.taskFailed" /* AccessibilityAlertSettingId.TaskFailed */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.taskFailed', 'Task Failed'),
            settingsKey: 'accessibility.signals.taskFailed'
        }); }
        static { this.terminalCommandFailed = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.terminalCommandFailed', 'Terminal Command Failed'),
            sound: Sound.error,
            legacySoundSettingsKey: 'audioCues.terminalCommandFailed',
            legacyAnnouncementSettingsKey: "accessibility.alert.terminalCommandFailed" /* AccessibilityAlertSettingId.TerminalCommandFailed */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.terminalCommandFailed', 'Command Failed'),
            settingsKey: 'accessibility.signals.terminalCommandFailed'
        }); }
        static { this.terminalBell = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.terminalBell', 'Terminal Bell'),
            sound: Sound.terminalBell,
            legacySoundSettingsKey: 'audioCues.terminalBell',
            legacyAnnouncementSettingsKey: "accessibility.alert.terminalBell" /* AccessibilityAlertSettingId.TerminalBell */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.terminalBell', 'Terminal Bell'),
            settingsKey: 'accessibility.signals.terminalBell'
        }); }
        static { this.notebookCellCompleted = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.notebookCellCompleted', 'Notebook Cell Completed'),
            sound: Sound.taskCompleted,
            legacySoundSettingsKey: 'audioCues.notebookCellCompleted',
            legacyAnnouncementSettingsKey: "accessibility.alert.notebookCellCompleted" /* AccessibilityAlertSettingId.NotebookCellCompleted */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.notebookCellCompleted', 'Notebook Cell Completed'),
            settingsKey: 'accessibility.signals.notebookCellCompleted'
        }); }
        static { this.notebookCellFailed = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.notebookCellFailed', 'Notebook Cell Failed'),
            sound: Sound.taskFailed,
            legacySoundSettingsKey: 'audioCues.notebookCellFailed',
            legacyAnnouncementSettingsKey: "accessibility.alert.notebookCellFailed" /* AccessibilityAlertSettingId.NotebookCellFailed */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.notebookCellFailed', 'Notebook Cell Failed'),
            settingsKey: 'accessibility.signals.notebookCellFailed'
        }); }
        static { this.diffLineInserted = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.diffLineInserted', 'Diff Line Inserted'),
            sound: Sound.diffLineInserted,
            legacySoundSettingsKey: 'audioCues.diffLineInserted',
            settingsKey: 'accessibility.signals.diffLineInserted'
        }); }
        static { this.diffLineDeleted = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.diffLineDeleted', 'Diff Line Deleted'),
            sound: Sound.diffLineDeleted,
            legacySoundSettingsKey: 'audioCues.diffLineDeleted',
            settingsKey: 'accessibility.signals.diffLineDeleted'
        }); }
        static { this.diffLineModified = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.diffLineModified', 'Diff Line Modified'),
            sound: Sound.diffLineModified,
            legacySoundSettingsKey: 'audioCues.diffLineModified',
            settingsKey: 'accessibility.signals.diffLineModified'
        }); }
        static { this.chatRequestSent = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.chatRequestSent', 'Chat Request Sent'),
            sound: Sound.chatRequestSent,
            legacySoundSettingsKey: 'audioCues.chatRequestSent',
            legacyAnnouncementSettingsKey: "accessibility.alert.chatRequestSent" /* AccessibilityAlertSettingId.ChatRequestSent */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.chatRequestSent', 'Chat Request Sent'),
            settingsKey: 'accessibility.signals.chatRequestSent'
        }); }
        static { this.chatResponseReceived = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.chatResponseReceived', 'Chat Response Received'),
            legacySoundSettingsKey: 'audioCues.chatResponseReceived',
            sound: {
                randomOneOf: [
                    Sound.chatResponseReceived1,
                    Sound.chatResponseReceived2,
                    Sound.chatResponseReceived3,
                    Sound.chatResponseReceived4
                ]
            },
            settingsKey: 'accessibility.signals.chatResponseReceived'
        }); }
        static { this.chatResponsePending = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.chatResponsePending', 'Chat Response Pending'),
            sound: Sound.chatResponsePending,
            legacySoundSettingsKey: 'audioCues.chatResponsePending',
            legacyAnnouncementSettingsKey: "accessibility.alert.chatResponsePending" /* AccessibilityAlertSettingId.ChatResponsePending */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.chatResponsePending', 'Chat Response Pending'),
            settingsKey: 'accessibility.signals.chatResponsePending'
        }); }
        static { this.clear = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.clear', 'Clear'),
            sound: Sound.clear,
            legacySoundSettingsKey: 'audioCues.clear',
            legacyAnnouncementSettingsKey: "accessibility.alert.clear" /* AccessibilityAlertSettingId.Clear */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.clear', 'Clear'),
            settingsKey: 'accessibility.signals.clear'
        }); }
        static { this.save = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.save', 'Save'),
            sound: Sound.save,
            legacySoundSettingsKey: 'audioCues.save',
            legacyAnnouncementSettingsKey: "accessibility.alert.save" /* AccessibilityAlertSettingId.Save */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.save', 'Save'),
            settingsKey: 'accessibility.signals.save'
        }); }
        static { this.format = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.format', 'Format'),
            sound: Sound.format,
            legacySoundSettingsKey: 'audioCues.format',
            legacyAnnouncementSettingsKey: "accessibility.alert.format" /* AccessibilityAlertSettingId.Format */,
            announcementMessage: (0, nls_1.localize)('accessibility.signals.format', 'Format'),
            settingsKey: 'accessibility.signals.format'
        }); }
        static { this.voiceRecordingStarted = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.voiceRecordingStarted', 'Voice Recording Started'),
            sound: Sound.voiceRecordingStarted,
            legacySoundSettingsKey: 'audioCues.voiceRecordingStarted',
            settingsKey: 'accessibility.signals.voiceRecordingStarted'
        }); }
        static { this.voiceRecordingStopped = AccessibilitySignal.register({
            name: (0, nls_1.localize)('accessibilitySignals.voiceRecordingStopped', 'Voice Recording Stopped'),
            sound: Sound.voiceRecordingStopped,
            legacySoundSettingsKey: 'audioCues.voiceRecordingStopped',
            settingsKey: 'accessibility.signals.voiceRecordingStopped'
        }); }
        constructor(sound, name, legacySoundSettingsKey, settingsKey, legacyAnnouncementSettingsKey, announcementMessage) {
            this.sound = sound;
            this.name = name;
            this.legacySoundSettingsKey = legacySoundSettingsKey;
            this.settingsKey = settingsKey;
            this.legacyAnnouncementSettingsKey = legacyAnnouncementSettingsKey;
            this.announcementMessage = announcementMessage;
        }
    }
    exports.AccessibilitySignal = AccessibilitySignal;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eVNpZ25hbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2FjY2Vzc2liaWxpdHlTaWduYWwvYnJvd3Nlci9hY2Nlc3NpYmlsaXR5U2lnbmFsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZbkYsUUFBQSwyQkFBMkIsR0FBRyxJQUFBLCtCQUFlLEVBQThCLDRCQUE0QixDQUFDLENBQUM7SUErQi9HLElBQU0sMEJBQTBCLEdBQWhDLE1BQU0sMEJBQTJCLFNBQVEsc0JBQVU7UUFTekQsWUFDd0Isb0JBQTRELEVBQzVELG9CQUE0RCxFQUNoRSxnQkFBb0Q7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFKZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQy9DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFWdkQsV0FBTSxHQUFrQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ2xELHlCQUFvQixHQUFHLElBQUEsZ0NBQW1CLEVBQzFELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxnQ0FBZ0MsRUFDMUQsR0FBRyxFQUFFLENBQUMseUVBQXlFLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLHVCQUF1QixFQUFFLENBQ25JLENBQUM7WUFDZSxrQkFBYSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUE0RWxDLGtCQUFhLEdBQUcsSUFBSSxHQUFHLEVBQVMsQ0FBQztZQThDakMsd0NBQW1DLEdBQUcsSUFBQSxnQ0FBbUIsRUFDekUsYUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUN0RSxDQUFD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