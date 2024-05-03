/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/path", "vs/base/node/pfs"], function (require, exports, os, path, pfs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.enumeratePowerShellInstallations = enumeratePowerShellInstallations;
    exports.getFirstAvailablePowerShellInstallation = getFirstAvailablePowerShellInstallation;
    // This is required, since parseInt("7-preview") will return 7.
    const IntRegex = /^\d+$/;
    const PwshMsixRegex = /^Microsoft.PowerShell_.*/;
    const PwshPreviewMsixRegex = /^Microsoft.PowerShellPreview_.*/;
    var Arch;
    (function (Arch) {
        Arch[Arch["x64"] = 0] = "x64";
        Arch[Arch["x86"] = 1] = "x86";
        Arch[Arch["ARM"] = 2] = "ARM";
    })(Arch || (Arch = {}));
    let processArch;
    switch (process.arch) {
        case 'ia32':
            processArch = 1 /* Arch.x86 */;
            break;
        case 'arm':
        case 'arm64':
            processArch = 2 /* Arch.ARM */;
            break;
        default:
            processArch = 0 /* Arch.x64 */;
            break;
    }
    /*
    Currently, here are the values for these environment variables on their respective archs:
    
    On x86 process on x86:
    PROCESSOR_ARCHITECTURE is X86
    PROCESSOR_ARCHITEW6432 is undefined
    
    On x86 process on x64:
    PROCESSOR_ARCHITECTURE is X86
    PROCESSOR_ARCHITEW6432 is AMD64
    
    On x64 process on x64:
    PROCESSOR_ARCHITECTURE is AMD64
    PROCESSOR_ARCHITEW6432 is undefined
    
    On ARM process on ARM:
    PROCESSOR_ARCHITECTURE is ARM64
    PROCESSOR_ARCHITEW6432 is undefined
    
    On x86 process on ARM:
    PROCESSOR_ARCHITECTURE is X86
    PROCESSOR_ARCHITEW6432 is ARM64
    
    On x64 process on ARM:
    PROCESSOR_ARCHITECTURE is ARM64
    PROCESSOR_ARCHITEW6432 is undefined
    */
    let osArch;
    if (process.env['PROCESSOR_ARCHITEW6432']) {
        osArch = process.env['PROCESSOR_ARCHITEW6432'] === 'ARM64'
            ? 2 /* Arch.ARM */
            : 0 /* Arch.x64 */;
    }
    else if (process.env['PROCESSOR_ARCHITECTURE'] === 'ARM64') {
        osArch = 2 /* Arch.ARM */;
    }
    else if (process.env['PROCESSOR_ARCHITECTURE'] === 'X86') {
        osArch = 1 /* Arch.x86 */;
    }
    else {
        osArch = 0 /* Arch.x64 */;
    }
    class PossiblePowerShellExe {
        constructor(exePath, displayName, knownToExist) {
            this.exePath = exePath;
            this.displayName = displayName;
            this.knownToExist = knownToExist;
        }
        async exists() {
            if (this.knownToExist === undefined) {
                this.knownToExist = await pfs.SymlinkSupport.existsFile(this.exePath);
            }
            return this.knownToExist;
        }
    }
    function getProgramFilesPath({ useAlternateBitness = false } = {}) {
        if (!useAlternateBitness) {
            // Just use the native system bitness
            return process.env.ProgramFiles || null;
        }
        // We might be a 64-bit process looking for 32-bit program files
        if (processArch === 0 /* Arch.x64 */) {
            return process.env['ProgramFiles(x86)'] || null;
        }
        // We might be a 32-bit process looking for 64-bit program files
        if (osArch === 0 /* Arch.x64 */) {
            return process.env.ProgramW6432 || null;
        }
        // We're a 32-bit process on 32-bit Windows, there is no other Program Files dir
        return null;
    }
    async function findPSCoreWindowsInstallation({ useAlternateBitness = false, findPreview = false } = {}) {
        const programFilesPath = getProgramFilesPath({ useAlternateBitness });
        if (!programFilesPath) {
            return null;
        }
        const powerShellInstallBaseDir = path.join(programFilesPath, 'PowerShell');
        // Ensure the base directory exists
        if (!await pfs.SymlinkSupport.existsDirectory(powerShellInstallBaseDir)) {
            return null;
        }
        let highestSeenVersion = -1;
        let pwshExePath = null;
        for (const item of await pfs.Promises.readdir(powerShellInstallBaseDir)) {
            let currentVersion = -1;
            if (findPreview) {
                // We are looking for something like "7-preview"
                // Preview dirs all have dashes in them
                const dashIndex = item.indexOf('-');
                if (dashIndex < 0) {
                    continue;
                }
                // Verify that the part before the dash is an integer
                // and that the part after the dash is "preview"
                const intPart = item.substring(0, dashIndex);
                if (!IntRegex.test(intPart) || item.substring(dashIndex + 1) !== 'preview') {
                    continue;
                }
                currentVersion = parseInt(intPart, 10);
            }
            else {
                // Search for a directory like "6" or "7"
                if (!IntRegex.test(item)) {
                    continue;
                }
                currentVersion = parseInt(item, 10);
            }
            // Ensure we haven't already seen a higher version
            if (currentVersion <= highestSeenVersion) {
                continue;
            }
            // Now look for the file
            const exePath = path.join(powerShellInstallBaseDir, item, 'pwsh.exe');
            if (!await pfs.SymlinkSupport.existsFile(exePath)) {
                continue;
            }
            pwshExePath = exePath;
            highestSeenVersion = currentVersion;
        }
        if (!pwshExePath) {
            return null;
        }
        const bitness = programFilesPath.includes('x86') ? ' (x86)' : '';
        const preview = findPreview ? ' Preview' : '';
        return new PossiblePowerShellExe(pwshExePath, `PowerShell${preview}${bitness}`, true);
    }
    async function findPSCoreMsix({ findPreview } = {}) {
        // We can't proceed if there's no LOCALAPPDATA path
        if (!process.env.LOCALAPPDATA) {
            return null;
        }
        // Find the base directory for MSIX application exe shortcuts
        const msixAppDir = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WindowsApps');
        if (!await pfs.SymlinkSupport.existsDirectory(msixAppDir)) {
            return null;
        }
        // Define whether we're looking for the preview or the stable
        const { pwshMsixDirRegex, pwshMsixName } = findPreview
            ? { pwshMsixDirRegex: PwshPreviewMsixRegex, pwshMsixName: 'PowerShell Preview (Store)' }
            : { pwshMsixDirRegex: PwshMsixRegex, pwshMsixName: 'PowerShell (Store)' };
        // We should find only one such application, so return on the first one
        for (const subdir of await pfs.Promises.readdir(msixAppDir)) {
            if (pwshMsixDirRegex.test(subdir)) {
                const pwshMsixPath = path.join(msixAppDir, subdir, 'pwsh.exe');
                return new PossiblePowerShellExe(pwshMsixPath, pwshMsixName);
            }
        }
        // If we find nothing, return null
        return null;
    }
    function findPSCoreDotnetGlobalTool() {
        const dotnetGlobalToolExePath = path.join(os.homedir(), '.dotnet', 'tools', 'pwsh.exe');
        return new PossiblePowerShellExe(dotnetGlobalToolExePath, '.NET Core PowerShell Global Tool');
    }
    function findWinPS() {
        const winPSPath = path.join(process.env.windir, processArch === 1 /* Arch.x86 */ && osArch !== 1 /* Arch.x86 */ ? 'SysNative' : 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
        return new PossiblePowerShellExe(winPSPath, 'Windows PowerShell', true);
    }
    /**
     * Iterates through all the possible well-known PowerShell installations on a machine.
     * Returned values may not exist, but come with an .exists property
     * which will check whether the executable exists.
     */
    async function* enumerateDefaultPowerShellInstallations() {
        // Find PSCore stable first
        let pwshExe = await findPSCoreWindowsInstallation();
        if (pwshExe) {
            yield pwshExe;
        }
        // Windows may have a 32-bit pwsh.exe
        pwshExe = await findPSCoreWindowsInstallation({ useAlternateBitness: true });
        if (pwshExe) {
            yield pwshExe;
        }
        // Also look for the MSIX/UWP installation
        pwshExe = await findPSCoreMsix();
        if (pwshExe) {
            yield pwshExe;
        }
        // Look for the .NET global tool
        // Some older versions of PowerShell have a bug in this where startup will fail,
        // but this is fixed in newer versions
        pwshExe = findPSCoreDotnetGlobalTool();
        if (pwshExe) {
            yield pwshExe;
        }
        // Look for PSCore preview
        pwshExe = await findPSCoreWindowsInstallation({ findPreview: true });
        if (pwshExe) {
            yield pwshExe;
        }
        // Find a preview MSIX
        pwshExe = await findPSCoreMsix({ findPreview: true });
        if (pwshExe) {
            yield pwshExe;
        }
        // Look for pwsh-preview with the opposite bitness
        pwshExe = await findPSCoreWindowsInstallation({ useAlternateBitness: true, findPreview: true });
        if (pwshExe) {
            yield pwshExe;
        }
        // Finally, get Windows PowerShell
        pwshExe = findWinPS();
        if (pwshExe) {
            yield pwshExe;
        }
    }
    /**
     * Iterates through PowerShell installations on the machine according
     * to configuration passed in through the constructor.
     * PowerShell items returned by this object are verified
     * to exist on the filesystem.
     */
    async function* enumeratePowerShellInstallations() {
        // Get the default PowerShell installations first
        for await (const defaultPwsh of enumerateDefaultPowerShellInstallations()) {
            if (await defaultPwsh.exists()) {
                yield defaultPwsh;
            }
        }
    }
    /**
    * Returns the first available PowerShell executable found in the search order.
    */
    async function getFirstAvailablePowerShellInstallation() {
        for await (const pwsh of enumeratePowerShellInstallations()) {
            return pwsh;
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG93ZXJzaGVsbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9ub2RlL3Bvd2Vyc2hlbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF5U2hHLDRFQU9DO0lBS0QsMEZBS0M7SUFwVEQsK0RBQStEO0lBQy9ELE1BQU0sUUFBUSxHQUFXLE9BQU8sQ0FBQztJQUVqQyxNQUFNLGFBQWEsR0FBVywwQkFBMEIsQ0FBQztJQUN6RCxNQUFNLG9CQUFvQixHQUFXLGlDQUFpQyxDQUFDO0lBRXZFLElBQVcsSUFJVjtJQUpELFdBQVcsSUFBSTtRQUNkLDZCQUFHLENBQUE7UUFDSCw2QkFBRyxDQUFBO1FBQ0gsNkJBQUcsQ0FBQTtJQUNKLENBQUMsRUFKVSxJQUFJLEtBQUosSUFBSSxRQUlkO0lBRUQsSUFBSSxXQUFpQixDQUFDO0lBQ3RCLFFBQVEsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RCLEtBQUssTUFBTTtZQUNWLFdBQVcsbUJBQVcsQ0FBQztZQUN2QixNQUFNO1FBQ1AsS0FBSyxLQUFLLENBQUM7UUFDWCxLQUFLLE9BQU87WUFDWCxXQUFXLG1CQUFXLENBQUM7WUFDdkIsTUFBTTtRQUNQO1lBQ0MsV0FBVyxtQkFBVyxDQUFDO1lBQ3ZCLE1BQU07SUFDUixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O01BMEJFO0lBQ0YsSUFBSSxNQUFZLENBQUM7SUFDakIsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLEVBQUUsQ0FBQztRQUMzQyxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLE9BQU87WUFDekQsQ0FBQztZQUNELENBQUMsaUJBQVMsQ0FBQztJQUNiLENBQUM7U0FBTSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JB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