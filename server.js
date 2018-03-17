io.on('connection', function(socket) {
  console.log("[Info] Nuovo utente collegato " + socket.id);
});
