@echo off
cd client\src

REM Fix App.js
powershell -Command "(Get-Content App.js) -replace 'const apiUrl = process.env.REACT_APP_API_URL.*', 'const apiUrl = API_URL;' | Set-Content App.js"
powershell -Command "(Get-Content App.js) -replace 'import React.*', 'import React, { useState, useEffect } from ''react'';^&import { API_URL } from ''./config'';' | Set-Content App.js"

REM Fix BatchManager.js
powershell -Command "(Get-Content components\BatchManager.js) -replace 'process.env.REACT_APP_API_URL.*''http://localhost:5000''', 'API_URL' | Set-Content components\BatchManager.js"
powershell -Command "(Get-Content components\BatchManager.js) -replace 'import React.*', '$&^&import { API_URL } from ''../config'';' | Set-Content components\BatchManager.js"

echo Fixed API URLs