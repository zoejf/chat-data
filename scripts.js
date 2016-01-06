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
    function Messages (message, author, createdAt) {
        this.message = message;
        this.author = author;
        this.createdAt = createdAt;
        //this.sentiment = sentiment;
    }

    Messages.all = [];

    function dateFormat(d) {
        var hours = function() {
            if (d.getHours() < 10) {
                return "0" + d.getHours();
            } else {
                return d.getHours();
            }
        };
        var minutes = function() {
            if (d.getMinutes() < 10) {
                return "0" + d.getMinutes();
            } else {
                d.getMinutes();
            }
        };
        d = (d.getMonth()+1) + "/"+ d.getDate() + "/" + d.getFullYear() + " at " + hours + ":" + minutes;
        return d;
    }

    Messages.prototype.save = function() {
        Messages.all.push(this);
        console.log("message saved!", this);
    };

    Messages.prototype.render = function() {
        console.log(this.createdAt);
        var message = template(this);
        $messages.append(message);
    };
    
    $('.glyphicon.navbar-link').on('click', function(event) {
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

    function scrollToBottom() {
        $(".messages-row").animate({ scrollTop: $('.messages-row').prop("scrollHeight")}, 1000);
    }

    getUsername();

    $('.chat-form').on('submit', function(event) {
        event.preventDefault();
    	var username = getUsername();
        // var sentiment = getSentiment();
        //message is getting sent to Firebase before username is ready??
        var date = new Date();
        date = dateFormat(date);
    	myFirebaseRef.push({
    		username: username, 
    		message: $('#message').val(), 
            createdAt: date
    	});
        $('.chat-form')[0].reset();
        scrollToBottom();
    });

    myFirebaseRef.on("child_added", getMessageFromFirebase);
    myFirebaseRef.once("value", function(snap) {
      console.log("initial data loaded!", scrollToBottom());
    });

    function getMessageFromFirebase(snapshot) {
        var messageData = snapshot.val();
        messageCount++;
        // var sentiment = messageData.sentiment || getSentiment(messageData.message);
        var time = messageData.createdAt || (new Date().getTime());
        var message = new Messages(messageData.message, messageData.username, time);
        message.save();
        message.render();
    }



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