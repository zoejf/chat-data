$(function() {
    console.log( "ready!" );

     var myFirebaseRef = new Firebase("https://radiant-fire-16.firebaseio.com/");

    function getUsername() {
    	//get username from Local Storage or prompt user
    	var username = localStorage.getItem("username");

    	if (username === null) {
    		username = prompt("What is your username?");
    		localStorage.setItem("username", username);
    	}
    	return username;
    }
    getUsername();

    $('.chat-form').on('submit', function() {
    	console.log('submitted:', $('#message').val());
    	myFirebaseRef.push({
    		username: getUsername(), 
    		message: $('#message').val()
    	});
    });

    myFirebaseRef.on("child_added", createMessageFromFirebase);
    var messageList = $('.messages-row');

    function createMessageFromFirebase(snapshot) {
    	var messageData = snapshot.val();
    	console.log("messageData", messageData);

    	var messageElement = $('<div/>', {
    		'class': 'one-message'
    	}).appendTo(messageList);

    	var messageBubble = $('<div/>', {
    		'class': 'message-bubble',
    		text: messageData.message,
    	}).appendTo(messageElement);

    	var author = $('<div />', {
    		'class': 'author',
    		text: messageData.username
    	}).appendTo(messageElement);
    }

    myFirebaseRef.child("username").on("value", function(snapshot) {
    	console.log(snapshot.val());
    });

});