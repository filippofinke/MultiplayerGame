Write-Host "Aggiungo tutti i file da aggiornare..." -fore yellow
git add .
Write-Host "Inserisci il messaggio di aggiornamento: " -fore yellow
$commit = Read-Host
git commit -m "$commit"
Write-Host "Aggiorno la cartella locale" -fore yellow
git pull
Write-Host "Invio i cambiamenti" -fore yellow
git push -u
Write-Host "Ho finito!" -fore green