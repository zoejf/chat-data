$(function() {
    console.log( "ready!" );

    var myFirebaseRef = new Firebase("https://radiant-fire-16.firebaseio.com/");
    var source = $('#messages-template').html();
    var template = Handlebars.compile(source);
    var messageList = $('.messages-row');
    var $messages = $('#messages-list');
    var messageCount = 0;

    //constructor function for a message
    //add sentiment later
    function Messages (message, author) {
        this.message = message;
        this.author = author;
        //this.sentiment = sentiment;
    }

    Messages.all = [];

    Messages.prototype.save = function() {
        Messages.all.push(this);
        console.log(this);
    };

    Messages.prototype.render = function() {
        var message = template(this);
        $messages.append(message);
    };

    $('.messages-row').animate({ 'scrollTop': $('.messages-row')[0].scrollHeight}, '2000');
    
    $('.glyphicon.navbar-link').on('click', function(event) {
        event.preventDefault();
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

    $('.chat-form').on('submit', function(event) {
        event.preventDefault();
    	var username = getUsername() || "anonymous";
        //message is getting sent to Firebase before username is ready??
    	myFirebaseRef.push({
    		username: username, 
    		message: $('#message').val()
    	});
    });

    myFirebaseRef.on("child_added", getMessageFromFirebase);

    function renderMessages(messageArray) {
        var messageHtml = template({ messages: messageArray });
        $messages.append(messageHtml);
    }

    function getMessageFromFirebase(snapshot) {
        var messageData = snapshot.val();
        messageCount++;
        var message = new Messages(messageData.message, messageData.username);
        message.save();
    }

    myFirebaseRef.once("value", function(snap) {
        if (Object.keys(snap.val()).length === messageCount) {
            console.log("initial data loaded!");
            var allMessages = Messages.all;
            renderMessages(allMessages);
        } 
    });


    //---ALCHEMY SENTIMENT API--//
    $('#update-data').on('click', function() {
        var sentimentResult;

        $.ajax({
            url: 'http://gateway-a.watsonplatform.net/calls/text/TextGetTextSentiment',
            type: 'POST', 
            dataType: 'jsonp',
            contentType: 'json',
            jsonpCallback: 'callback', 
            data: {
                apikey:'cdbf2ddc186378fdc5bb377f10b0e5e4770702d2', 
                text: 'hello%20this%20is%20a%20great%20test%20that%20might%20never%20work',
                showSourceText:1, 
                jsonp:'callback', 
                outputMode: 'json'
            },
            success: function (data) {
                console.log(data);
                var score = parseInt(data.docSentiment.score) || 0;
                var type = data.docSentiment.type;

                $('#sentiment').clear();

                var sentiment = $('<p />', {
                    'class': 'sentiment',
                    text: 'Sentiment: ' + type + '  |  Score: ' + score
                }).appendTo($('#sentiment'));
            } 
        });
        
    });

});