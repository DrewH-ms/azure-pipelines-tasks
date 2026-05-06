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

// Feature Flag ON
process.env['DISTRIBUTEDTASK_TASKS_AZUREPOWERSHELLSOFTFAILONCLEANUP'] = 'true';

// Agent env
process.env['AGENT_TEMPDIRECTORY'] = '/tmp';
process.env['AGENT_VERSION'] = '2.999.0';

// Service connection env vars (should be cleared by fallback)
process.env['AZURESUBSCRIPTION_SERVICE_CONNECTION_ID'] = 'test-connection-id';
process.env['AZURESUBSCRIPTION_CLIENT_ID'] = 'test-client-id';
process.env['AZURESUBSCRIPTION_TENANT_ID'] = 'test-tenant-id';

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

// Answers: pwsh NOT found — tl.which returns empty, tl.which(x, true) throws
// This simulates the scenario where pwsh is not on PATH at all
let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "which": {
        "pwsh": "",
        "powershell": ""
    },
    "checkPath": {
        "/tmp": true
    },
    "exec": {}
};
tmr.setAnswers(a);

tmr.run();
