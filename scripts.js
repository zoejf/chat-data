$(function() {
    console.log( "ready!" );

    var myFirebaseRef = new Firebase("https://radiant-fire-16.firebaseio.com/");
    var source = $('#messages-template').html();
    var template = Handlebars.compile(source);
    var messageList = $('.messages-row');
    var $messages = $('#messages-list');
    var messageCount = 0;

    function Messages (message, author, createdAt, score, string) {
        this.message = message;
        this.author = author;
        this.createdAt = createdAt;
        this.sentimentScore = score;
        this.sentimentString = string;
    }

    Messages.all = [];

    function dateFormat(d) {
        // var hours = function hours() {
        //     var h = d.getHours();
        //     if (h < 10) {
        //         h = "0" + h;
        //         return h;
        //     } else {
        //         return h;
        //     }
        // };
        // var minutes = function minutes() {
        //     if (d.getMinutes() < 10) {
        //         return "0" + d.getMinutes();
        //     } else {
        //         d.getMinutes();
        //     }
        // };
        d = (d.getMonth()+1) + "/"+ d.getDate() + "/" + d.getFullYear() + " at " + d.getHours() + ":" + d.getMinutes();
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
        var date = new Date();
        date = dateFormat(date);
        var message = {
            username: getUsername(),
            message: $('#message').val(),
            createdAt: date, 
            sentiment: []
        };
        console.log("message before sentiment", message);
        setWithSentiment(message);
    	
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
        var time = messageData.createdAt || (new Date().getTime());
        var message = new Messages(messageData.message, messageData.username, time, message.sentimentScore, sentimentString);
        message.save();
        message.render();
    }



    //---ALCHEMY SENTIMENT API--//

    function setWithSentiment(message) {
        var text = message.message.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        text = text.replace(/\s/g, "%20");
        $.ajax({
            url: 'http://gateway-a.watsonplatform.net/calls/text/TextGetTextSentiment',
            type: 'POST', 
            dataType: 'jsonp',
            contentType: 'json',
            async: 'false',
            jsonpCallback: 'callback', 
            data: {
                apikey:'cdbf2ddc186378fdc5bb377f10b0e5e4770702d2', 
                text: text,
                showSourceText:1, 
                jsonp:'callback', 
                outputMode: 'json'
            },
            success: function (data) {
              var scoreNum;
              var typeString;
              if (data.docSentiment) {
                  scoreNum = parseFloat(data.docSentiment.score);
                  typeString = data.docSentiment.type;
              } else {
                  scoreNum = 0;
                  typeString = "neutral";
              }
              message.sentiment[0] = scoreNum;
              message.sentiment[1] = typeString;

              var newMessage = {
                  username: message.username, 
                  message: message.message, 
                  createdAt: message.createdAt, 
                  sentimentScore: message.sentiment[0],
                  sentimentString: message.sentiment[1]
              };
              
              myFirebaseRef.push(newMessage);
              console.log('new message added: ', newMessage);
            } 
        });
    }

    // $('#update-data').on('click', function() {
    //     var totalSentiment = 0;
    //     for(var i = 0; i < Messages.all.length; i++) {
    //         var sentimentResult = getSentiment(Messages.all[i].message.toString());
    //     }

    // });

});