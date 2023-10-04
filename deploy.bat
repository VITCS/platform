REM  C:\ProgramData\Anaconda3\Scripts\activate

cmd/c "cd d:\infville\repos\platform\platform\layers\lambdaNodeLayer && sam build && sam deploy --config-env dev2 --no-confirm-changeset"

ECHO "FINISHED******************"
if %ERRORLEVEL% gtr 1 goto completed

cmd/c "cd d:\infville\repos\platform\platform\layers\pythonlayer && sam build && sam deploy --config-env dev2 --no-confirm-changeset" 
if %ERRORLEVEL% gtr 1 goto completed

cmd/c "cd d:\infville\repos\platform\platform\eventbus && sam build && sam deploy --config-env dev2 --no-confirm-changeset" 
if %ERRORLEVEL% gtr 1 goto completed

cmd/c "cd d:\infville\repos\platform\platform\elasticsearch && sam build && sam deploy --config-env dev2 --no-confirm-changeset" 
if %ERRORLEVEL% gtr 1 goto completed

cmd/c "cd d:\infville\repos\platform\platform\users && sam build && sam deploy --config-env dev2 --no-confirm-changeset" 
if %ERRORLEVEL% gtr 1 goto completed

cmd/c "cd d:\infville\repos\platform\platform\customer-users && sam build && sam deploy --config-env dev2 --no-confirm-changeset" 
if %ERRORLEVEL% gtr 1 goto completed

cmd/c "cd d:\infville\repos\platform\platform\ops-portal && sam build && sam deploy --config-env dev2 --no-confirm-changeset" 
if %ERRORLEVEL% gtr 1 goto completed

cmd/c "cd d:\infville\repos\platform\platform\internalOps && sam build && sam deploy --config-env dev2 --no-confirm-changeset" 
if %ERRORLEVEL% gtr 1 goto completed


:completed
echo %ERRORLEVEL%
cd d:\infville\repos\platform
EXIT /B %ERRORLEVEL%
