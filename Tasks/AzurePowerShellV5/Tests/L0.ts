/// <reference path="../../../definitions/mocha.d.ts"/>
/// <reference path="../../../definitions/node.d.ts"/>
/// <reference path="../../../definitions/Q.d.ts"/>

import Q = require('q');
import assert = require('assert');
import path = require('path');
var psm = require('../../../Tests/lib/psRunner');
var psr = null;

import * as ttm from 'azure-pipelines-task-lib/mock-test';

describe('AzurePowerShell Suite', function () {
    this.timeout(parseInt(process.env.TASK_TEST_TIMEOUT) || 20000);

    before((done) => {
        if (psm.testSupported()) {
            psr = new psm.PSRunner();
            psr.start();
        }

        done();
    });

    after(function () {
        if (psr) {
            psr.kill();
        }
    });

    if (psm.testSupported()) {
        it('checks for powershell core', (done) => {
            psr.run(path.join(__dirname, 'ChecksForPowerShellCore.ps1'), done);
        })
        it('checks for powershell', (done) => {
            psr.run(path.join(__dirname, 'ChecksForPowerShell.ps1'), done);
        })
        it('checks for working directory', (done) => {
            psr.run(path.join(__dirname, 'ChecksForWorkingDirectory.ps1'), done);
        })
        it('performs basic flow', (done) => {
            psr.run(path.join(__dirname, 'PerformsBasicFlow.ps1'), done);
        })
        it('throws when otherversion is specified in a wrong format', (done) => {
            psr.run(path.join(__dirname, 'ThrowsForInvalidVersion.ps1'), done);
        })
        it('throws when invalid script arguments', (done) => {
            psr.run(path.join(__dirname, 'ThrowsWhenInvalidScriptArguments.ps1'), done);
        })
        it('throws when invalid script path', (done) => {
            psr.run(path.join(__dirname, 'ThrowsWhenInvalidScriptPath.ps1'), done);
        })
        it('Get-LatestModule returns the latest available module', (done) => {
            psr.run(path.join(__dirname, 'Utility.Get-LatestModule.ps1'), done);
        })
        it('Update-PSModulePathForHostedAgent updated psmodulepath correctly', (done) => {
            psr.run(path.join(__dirname, 'Utility.UpdatePSModulePathForHostedAgentWorksCorrectly.ps1'), done);
        })
    }

    describe('Cleanup soft-fail feature flag (AzurePowerShellSoftFailOnCleanup)', function () {

        it('FF ON + cleanup fails: task succeeds with warning', async () => {
            let tp = path.join(__dirname, 'L0CleanupSoftFail_FFOn_CleanupFails.js');
            let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
            await tr.runAsync();

            if (!tr.succeeded) {
                console.log('STDOUT:', tr.stdout);
                console.log('STDERR:', tr.stderr);
            }

            assert(tr.succeeded, 'task should have succeeded since FF is ON and main script passed');
            assert(tr.stdout.indexOf('Azure context cleanup completed with exit code: 1') >= 0,
                'should emit warning about cleanup failure');
        });

        it('FF OFF + cleanup fails: task fails (old behavior)', async () => {
            let tp = path.join(__dirname, 'L0CleanupSoftFail_FFOff_CleanupFails.js');
            let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
            await tr.runAsync();

            assert(!tr.succeeded, 'task should have failed since FF is OFF and cleanup failed');
            assert(tr.stdout.indexOf('Cleanup failed with exit code: 1') >= 0,
                'should show cleanup failure error message');
        });

        it('pwsh not found: task fails with original error, cleanup skipped', async () => {
            let tp = path.join(__dirname, 'L0CleanupSoftFail_PwshNotFound.js');
            let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
            await tr.runAsync();

            assert(!tr.succeeded, 'task should have failed because pwsh is not available');
            // The original error from tl.which(x, true) should be preserved
            assert(tr.stdout.indexOf('Skipping cleanup') >= 0 || tr.stdout.indexOf('Unable to locate') >= 0,
                'should either skip cleanup or show the original pwsh-not-found error');
        });
    });
});