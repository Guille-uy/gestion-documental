$base = "https://gestion-documental-production.up.railway.app/api"

# ===== LOGINS =====
$rAdmin = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body (@{email="admin@centenario.net.uy";password="Admin@12345"} | ConvertTo-Json) -ContentType "application/json"
$tAdmin = $rAdmin.data.accessToken
$hAdmin = @{ "Authorization" = "Bearer $tAdmin" }

$rOwner = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body (@{email="owner@centenario.net.uy";password="Owner@12345"} | ConvertTo-Json) -ContentType "application/json"
$tOwner = $rOwner.data.accessToken
$hOwner = @{ "Authorization" = "Bearer $tOwner" }
$ownerId = $rOwner.data.user.id

$rReviewer = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body (@{email="reviewer@centenario.net.uy";password="Reviewer@12345"} | ConvertTo-Json) -ContentType "application/json"
$tReviewer = $rReviewer.data.accessToken
$hReviewer = @{ "Authorization" = "Bearer $tReviewer" }
$reviewerId = $rReviewer.data.user.id

$rApprover = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body (@{email="approver@centenario.net.uy";password="Approver@12345"} | ConvertTo-Json) -ContentType "application/json"
$tApprover = $rApprover.data.accessToken
$hApprover = @{ "Authorization" = "Bearer $tApprover" }

Write-Host "=== LOGINS OK: ADMIN, OWNER ($ownerId), REVIEWER ($reviewerId), APPROVER ==="

# ===== USUARIOS =====
Write-Host "`n--- USUARIOS (GET /api/auth/users) ---"
try {
    $u = Invoke-RestMethod -Uri "$base/auth/users" -Headers $hAdmin
    $userList = $u.data.items
    Write-Host "Count: $($userList.Count) | Total: $($u.data.total)"
    $userList | ForEach-Object { Write-Host "  $($_.email) [$($_.role)] id=$($_.id)" }
} catch { Write-Host "ERROR: $($_.Exception.Message)" }

# ===== CREAR DOCUMENTO NUEVO PARA TEST DE FLUJO =====
Write-Host "`n--- CREAR DOCUMENTO PARA FLUJO DE REVISION ---"
$newDoc = @{title="Procedimiento Test Flujo Completo";type="SOP";area="CAL";description="Documento para testear el flujo completo"} | ConvertTo-Json
$docResp = Invoke-RestMethod -Uri "$base/documents" -Method POST -Body $newDoc -ContentType "application/json" -Headers $hOwner
$docId = $docResp.data.id
Write-Host "Creado: $($docResp.data.code) - $($docResp.data.title) [OWNER: $($docResp.data.createdBy)]"

# ===== UPLOAD ARCHIVO =====
Write-Host "`n--- UPLOAD ARCHIVO ---"
try {
    # Crear contenido de archivo de prueba
    $fileContent = [System.Text.Encoding]::UTF8.GetBytes("Contenido del procedimiento de prueba. Esto es un documento PDF simulado para testing.")
    $boundary = "----FormBoundary" + [System.Guid]::NewGuid().ToString("N").Substring(0,16)
    $CRLF = "`r`n"
    $bodyText = "--$boundary$CRLF"
    $bodyText += "Content-Disposition: form-data; name=`"file`"; filename=`"procedimiento-test.pdf`"$CRLF"
    $bodyText += "Content-Type: application/pdf$CRLF$CRLF"
    $bodyText += [System.Text.Encoding]::UTF8.GetString($fileContent) + $CRLF
    $bodyText += "--$boundary--$CRLF"
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyText)
    $uploadH = @{ "Authorization" = "Bearer $tOwner"; "Content-Type" = "multipart/form-data; boundary=$boundary" }
    $upResp = Invoke-RestMethod -Uri "$base/documents/$docId/upload" -Method POST -Body $bodyBytes -Headers $uploadH
    Write-Host "Upload OK: versionLabel=$($upResp.data.currentVersionLabel) driveId=$($upResp.data.googleDriveFileId)"
} catch { Write-Host "ERROR upload: $($_.Exception.Message)" }

# ===== DETALLE DOCUMENTO TRAS UPLOAD =====
Write-Host "`n--- DETALLE DOCUMENTO POST-UPLOAD ---"
try {
    $det = Invoke-RestMethod -Uri "$base/documents/$docId" -Headers $hOwner
    Write-Host "Status: $($det.data.status) | Versiones: $($det.data.versions.Count) | driveId: $($det.data.googleDriveFileId)"
} catch { Write-Host "ERROR: $($_.Exception.Message)" }

# ===== ENVIAR A REVISION =====
Write-Host "`n--- ENVIAR A REVISION ---"
$reviewTaskId = $null
try {
    $reviewBody = @{reviewers=@($reviewerId);comments="Envio para revision del flujo de prueba"} | ConvertTo-Json
    $revResp = Invoke-RestMethod -Uri "$base/documents/$docId/submit-review" -Method POST -Body $reviewBody -ContentType "application/json" -Headers $hOwner
    Write-Host "OK: status=$($revResp.data.status)"
    # Obtener el reviewTaskId del detalle del documento
    $detAfterSubmit = Invoke-RestMethod -Uri "$base/documents/$docId" -Headers $hOwner
    $reviewTaskId = $detAfterSubmit.data.reviewTasks[0].id
    Write-Host "ReviewTaskId obtenido del detalle: $reviewTaskId"
} catch { Write-Host "ERROR: $($_.Exception.Message); $($_.ErrorDetails.Message)" }

# ===== REVISOR: APROBAR =====
Write-Host "`n--- REVISOR: APROBAR ---"
try {
    if (-not $reviewTaskId) { Write-Host "SKIP: no reviewTaskId"; throw "no reviewTaskId" }
    $approveBody = @{action="APPROVE";comments="Documento revisado y aprobado. Todo correcto."} | ConvertTo-Json
    $approveResp = Invoke-RestMethod -Uri "$base/documents/$docId/reviews/$reviewTaskId/approve" -Method POST -Body $approveBody -ContentType "application/json" -Headers $hReviewer
    Write-Host "OK: revisión aprobada (success=$($approveResp.data.success))"
    # (approve devuelve { success:true }, no status; el status del doc se ve en el detalle final)
} catch { Write-Host "ERROR: $($_.Exception.Message); $($_.ErrorDetails.Message)" }

# ===== APROBADOR FINAL: PUBLICAR =====
Write-Host "`n--- APROBADOR: PUBLICAR DOCUMENTO ---"
try {
    $finalBody = @{comments="Documento aprobado formalmente y publicado."} | ConvertTo-Json
    $finalResp = Invoke-RestMethod -Uri "$base/documents/$docId/publish" -Method POST -Body $finalBody -ContentType "application/json" -Headers $hApprover
    Write-Host "OK: status=$($finalResp.data.status)"
} catch { Write-Host "ERROR: $($_.Exception.Message); $($_.ErrorDetails.Message)" }

# ===== ESTADO FINAL =====
Write-Host "`n--- ESTADO FINAL DEL DOCUMENTO ---"
try {
    $final = Invoke-RestMethod -Uri "$base/documents/$docId" -Headers $hAdmin
    Write-Host "Titulo: $($final.data.title)"
    Write-Host "Codigo: $($final.data.code)"
    Write-Host "Status: $($final.data.status)"
    Write-Host "Tipo: $($final.data.type) | Area: $($final.data.area)"
    Write-Host "Versiones: $($final.data.versions.Count)"
    Write-Host "ReviewTasks: $($final.data.reviewTasks.Count)"
    $final.data.reviewTasks | ForEach-Object { Write-Host "  - $($_.reviewer.email): $($_.status) - $($_.comment)" }
} catch { Write-Host "ERROR: $($_.Exception.Message)" }

# ===== NOTIFICACIONES =====
Write-Host "`n--- NOTIFICACIONES (REVIEWER) ---"
try {
    $notif = Invoke-RestMethod -Uri "$base/notifications" -Headers $hReviewer
    Write-Host "Count: $($notif.data.total)"
    $notif.data.items | Select-Object -First 3 | ForEach-Object { Write-Host "  [$($_.type)] $($_.title) - readAt=$($_.readAt)" }
} catch { Write-Host "ERROR: $($_.Exception.Message)" }

# ===== LISTA FINAL DOCUMENTOS =====
Write-Host "`n--- TODOS LOS DOCUMENTOS ---"
try {
    $all = Invoke-RestMethod -Uri "$base/documents" -Headers $hAdmin
    Write-Host "Total: $($all.data.total)"
    $all.data.items | ForEach-Object { Write-Host "  [$($_.code)] $($_.title) - $($_.status)" }
} catch { Write-Host "ERROR: $($_.Exception.Message)" }

Write-Host "`n=== TEST COMPLETO FINALIZADO ==="
$r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body (@{email="admin@centenario.net.uy";password="Admin@12345"} | ConvertTo-Json) -ContentType "application/json"
$t = $r.data.accessToken
$h = @{ "Authorization" = "Bearer $t" }
Write-Host "=== LOGIN ADMIN: $($r.data.user.role) ==="

# ===== DOCUMENTOS =====
Write-Host "`n--- DOCUMENTOS ---"
try {
    $d = Invoke-RestMethod -Uri "$base/documents" -Headers $h
    Write-Host "Total: $($d.data.total)"
    $d.data.items | ForEach-Object { Write-Host "  [$($_.code)] $($_.title) - $($_.status)" }
} catch { Write-Host "ERROR: $($_.Exception.Message)" }

# ===== CONFIG AREAS =====
Write-Host "`n--- CONFIG AREAS ---"
try {
    $a = Invoke-RestMethod -Uri "$base/config/areas" -Headers $h
    Write-Host "Count: $($a.data.Count)"
    $a.data | ForEach-Object { Write-Host "  [$($_.code)] $($_.name) - activo=$($_.isActive)" }
} catch { Write-Host "ERROR: $($_.Exception.Message)" }

# ===== CONFIG TYPES =====
Write-Host "`n--- CONFIG TYPES ---"
try {
    $tp = Invoke-RestMethod -Uri "$base/config/document-types" -Headers $h
    Write-Host "Count: $($tp.data.Count)"
    $tp.data | ForEach-Object { Write-Host "  [$($_.code)] prefijo=$($_.prefix) - $($_.name)" }
} catch { Write-Host "ERROR: $($_.Exception.Message)" }

# ===== CREAR DOCUMENTOS DE DISTINTOS TIPOS =====
Write-Host "`n--- CREAR DOCUMENTOS ---"
$docsToCreate = @(
    @{title="Politica de Calidad 2026";type="POLICY";area="CAL";description="Politica general de calidad del sistema"},
    @{title="Instruccion de Trabajo Recepcion";type="WI";area="LOG";description="Instruccion para recepcion de mercaderia"},
    @{title="Formulario No Conformidad";type="FORM";area="CAL";description="Formulario para registrar no conformidades"},
    @{title="Procedimiento de Auditoria Interna";type="SOP";area="CAL";description="Procedimiento para realizar auditorias internas"},
    @{title="Registro de Capacitaciones";type="RECORD";area="RRH";description="Registro de capacitaciones del personal"}
)
$createdIds = @()
foreach ($doc in $docsToCreate) {
    try {
        $body = $doc | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$base/documents" -Method POST -Body $body -ContentType "application/json" -Headers $h
        Write-Host "  OK: $($res.data.code) - $($res.data.title)"
        $createdIds += $res.data.id
    } catch { Write-Host "  ERROR: $($_.Exception.Message)" }
}

# ===== LISTAR TODOS LOS DOCUMENTOS =====
Write-Host "`n--- DOCUMENTOS CREADOS ---"
try {
    $d2 = Invoke-RestMethod -Uri "$base/documents" -Headers $h
    Write-Host "Total: $($d2.data.total)"
    $d2.data.items | ForEach-Object { Write-Host "  [$($_.code)] $($_.title) - $($_.status) - tipo=$($_.type) area=$($_.area)" }
} catch { Write-Host "ERROR: $($_.Exception.Message)" }

# ===== SUBIR ARCHIVO AL PRIMER DOCUMENTO =====
Write-Host "`n--- UPLOAD ARCHIVO ---"
if ($createdIds.Count -gt 0) {
    $docId = $createdIds[0]
    try {
        # Crear un PDF falso para test
        $fakeContent = [System.Text.Encoding]::UTF8.GetBytes("%PDF-1.4 fake pdf content for testing")
        $boundary = "----FormBoundary" + [System.Guid]::NewGuid().ToString("N")
        $bodyLines = @(
            "--$boundary",
            'Content-Disposition: form-data; name="file"; filename="politica-calidad.pdf"',
            "Content-Type: application/pdf",
            "",
            [System.Text.Encoding]::UTF8.GetString($fakeContent),
            "--$boundary--"
        )
        $uploadBody = $bodyLines -join "`r`n"
        $uploadBytes = [System.Text.Encoding]::UTF8.GetBytes($uploadBody)
        $uploadH = @{ "Authorization" = "Bearer $t"; "Content-Type" = "multipart/form-data; boundary=$boundary" }
        $up = Invoke-RestMethod -Uri "$base/documents/$docId/upload" -Method POST -Body $uploadBytes -Headers $uploadH
        Write-Host "  OK: versionLabel=$($up.data.currentVersionLabel) driveId=$($up.data.googleDriveFileId)"
    } catch { Write-Host "  ERROR upload: $($_.Exception.Message)" }
}

# ===== USUARIOS =====
Write-Host "`n--- USUARIOS ---"
try {
    $u = Invoke-RestMethod -Uri "$base/auth/users" -Headers $h
    Write-Host "Count: $($u.data.total)"
    $u.data.items | ForEach-Object { Write-Host "  $($_.email) [$($_.role)]" }
} catch { Write-Host "ERROR: $($_.Exception.Message)" }

# ===== AUDITORIA =====
Write-Host "`n--- AUDITORIA ---"
try {
    $aud = Invoke-RestMethod -Uri "$base/audit" -Headers $h
    Write-Host "Count: $($aud.data.total)"
    $aud.data.items | Select-Object -First 3 | ForEach-Object { Write-Host "  $($_.action) - $($_.entityType) - $($_.createdAt)" }
} catch { Write-Host "ERROR: $($_.Exception.Message)" }

# ===== LOGIN OTROS ROLES =====
Write-Host "`n--- LOGIN OTROS ROLES ---"
@(
    @{email="owner@centenario.net.uy";password="Owner@12345"},
    @{email="reviewer@centenario.net.uy";password="Reviewer@12345"},
    @{email="approver@centenario.net.uy";password="Approver@12345"},
    @{email="reader@centenario.net.uy";password="Reader@12345"}
) | ForEach-Object {
    try {
        $lr = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body ($_ | ConvertTo-Json) -ContentType "application/json"
        Write-Host "  OK: $($lr.data.user.email) [$($lr.data.user.role)]"
    } catch { Write-Host "  ERROR $($_.email): $($_.Exception.Message)" }
}

Write-Host "`n=== FIN TESTS ==="
