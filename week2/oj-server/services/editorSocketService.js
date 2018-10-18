module.exports = function(io) {
	// collaboration sessions
	var collaborations = {};

	// map from socketId to sessionId
	var socketIdToSessionId = {};

	// waiting for connection from client
	io.on('connection', (socket) => {

		// get the session id, which is the problem id
		// socket id= 'ABCD', sessionId = 1
		let sessionId = socket.handshake.query['sessionId'];

		// given a socket id, I know which problem it's working on
		socketIdToSessionId[socket.id] = sessionId;

		// add current socket id to collaboration sesssion participants
		if (!(sessionId in collaborations)) {
			collaborations[sessionId] = {
				'participants': []
			};
		}

		// given a problem id, I know all participants
		collaborations[sessionId]['participants'].push(socket.id);

		// when receive change event from client
		socket.on('change', delta => {
			// change 1: blah blah
			console.log('change ' + socketIdToSessionId[socket.id] + ': ' + delta);
			// 1=>ABCD, CDEF
			let sessionId = socketIdToSessionId[socket.id];
			// forward to all participants, except the originating one
			if (sessionId in collaborations) {
				let participants = collaborations[sessionId]['participants'];
				for (let i = 0; i < participants.length; i++) {
					if (socket.id != participants[i]) { //change wont be sent to the changing person(sent back to where it comes from)
						io.to(participants[i]).emit('change', delta);
					}
				}
			} else {
				console.log('warning: could not find socket id in collaborations');
			}
		})

	})
}