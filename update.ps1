Write-Host "Aggiungo tutti i file da aggiornare..."
git add .
Write-Host "Inserisci il messaggio di aggiornamento: "
$commit = Read-Host
git commit -m "$commit"
Write-Host "Aggiorno la cartella locale"
git pull
Write-Host "Invio i cambiamenti"
git push -u
Write-Host "Ho finito!"