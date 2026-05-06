import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'azurepowershell.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

// Inputs
tmr.setInput('ConnectedServiceNameARM', 'AzureRM');
tmr.setInput('ScriptType', 'InlineScript');
tmr.setInput('Inline', 'Write-Host "Hello"');
tmr.setInput('ScriptArguments', '');
tmr.setInput('errorActionPreference', 'Stop');
tmr.setInput('FailOnStandardError', 'false');
tmr.setInput('TargetAzurePs', '');
tmr.setInput('CustomTargetAzurePs', '');
tmr.setInput('workingDirectory', '/tmp');

// Feature Flag OFF (old behavior)
process.env['DISTRIBUTEDTASK_TASKS_AZUREPOWERSHELLSOFTFAILONCLEANUP'] = 'false';

// Agent env
process.env['AGENT_TEMPDIRECTORY'] = '/tmp';
process.env['AGENT_VERSION'] = '2.999.0';

// Mock Endpoint
process.env['ENDPOINT_URL_AzureRM'] = 'https://management.azure.com/';
process.env['ENDPOINT_AUTH_AzureRM'] = '{"parameters":{"serviceprincipalid":"spId","serviceprincipalkey":"spKey","tenantid":"tenantId"},"scheme":"ServicePrincipal"}';
process.env['ENDPOINT_AUTH_SCHEME_AzureRM'] = 'ServicePrincipal';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_SERVICEPRINCIPALID'] = 'spId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_TENANTID'] = 'tenantId';
process.env['ENDPOINT_DATA_AzureRM'] = '{"environment":"AzureCloud"}';

// Mock azure-arm-endpoint
tmr.registerMock('azure-pipelines-tasks-azure-arm-rest/azure-arm-endpoint', {
    AzureRMEndpoint: class {
        constructor(connectedServiceName: string) {}
        async getEndpoint() {
            return { scheme: 'ServicePrincipal', auth: { scheme: 'ServicePrincipal' } };
        }
    }
});

// Mock azCliUtility
tmr.registerMock('azure-pipelines-tasks-azure-arm-rest/azCliUtility', {
    validateAzModuleVersion: () => Promise.resolve()
});

// Mock uuid
tmr.registerMock('uuid/v4', () => 'test-uuid');

// Build the script path
const scriptPath = path.join('/tmp', 'test-uuid.ps1');

// Answers: pwsh found, main script succeeds (exit 0), cleanup fails (exit 1)
let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "which": {
        "pwsh": "/usr/bin/pwsh"
    },
    "checkPath": {
        "/usr/bin/pwsh": true,
        "/tmp": true
    },
    "exec": {
        [`/usr/bin/pwsh -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Unrestricted -Command . '${path.join(__dirname, '..', 'ImportVstsTaskSdk.ps1')}'; . '${scriptPath}'`]: {
            "code": 0,
            "stdout": "Main script executed successfully"
        },
        [`/usr/bin/pwsh -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Unrestricted -Command . '${path.join(__dirname, '..', 'RemoveAzContext.ps1')}'`]: {
            "code": 1,
            "stdout": "Cleanup script failed"
        }
    }
};
tmr.setAnswers(a);

tmr.run();
