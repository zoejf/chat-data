$(function() {
    console.log( "ready!" );

    var myFirebaseRef = new Firebase("https://radiant-fire-16.firebaseio.com/");

    // var $scroll = $('.messages-row');
    // var height = $scroll[0].scrollHeight;
    // $scroll.scrollTop(height);
    $('.messages-row').animate({ 'scrollTop': $('.messages-row')[0].scrollHeight}, '2000');
    

    $('.glyphicon.navbar-link').on('click', function() {
        $('.data-section').toggleClass('show');
        $('.data-section').toggleClass('col-sm-4');
        $('.messages-section').toggleClass('col-sm-12');
        $('.messages-section').toggleClass('col-sm-8');
    });

    function getUsername() {
    	//get username from Local Storage or prompt user
    	var username = localStorage.getItem("username");

    	if (username === null) {
    		$('#myModal').modal('show');
            $('.username-form').on('submit', function(){
                username = $('#username').val();
                localStorage.setItem("username", username);
                $('#myModal').modal('hide');
            });
    	} else if (username == 'null') {
            localStorage.setItem("username", "anonymous_panda");
            username = "anonymous_panda";   
        }
    	return username;
    }
    getUsername();

    $('.chat-form').on('submit', function() {
    	var username = getUsername() || "anonymousss";
        //message is getting sent to Firebase before username is ready??
    	myFirebaseRef.push({
    		username: username, 
    		message: $('#message').val()
    	});

        //put username on page and give option to change
        //!! doesn't quite work yet!!
        $('<p />', {
            'class': 'chatting-as',
            text: 'Chatting as' + username + '<a data-toggle="modal" data-target="#myModal">[change]</a>'
        }).appendTo($('.input-row'));
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