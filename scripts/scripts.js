$(function() {

  //----Firebase Messages Setup----//
  var myFirebaseRef = new Firebase("https://classroom-chat.firebaseio.com/messages/");
  var messageCount = 0;
  
  //----Handlebars Setup----//
  var sourceMessages = $('#messages-template').html();
  var templateMessages = Handlebars.compile(sourceMessages);
  var messageList = $('.messages-row');
  var $messages = $('#messages-list');

  var sourceSentiment = $('#sentiment-template').html();
  var templateSentiments = Handlebars.compile(sourceSentiment);
  var $sentiments = $('#sentiments-text');

  var sourceUser = $('#username-template').html();
  var templateUser = Handlebars.compile(sourceUser);
  var $userDropdown = $('#username-span');


  //----FUNCTIONS----//
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

    $userDropdown.empty();
    var usernameHtml = templateUser({username: username});
    console.log(usernameHtml);
    $userDropdown.append(usernameHtml);

    return username;
  }

  function scrollToBottom() {
    $(".messages-row").animate({ scrollTop: $('.messages-row').prop("scrollHeight")}, 1000);
  }

  function Messages (content, username, createdAt, score, string) {
    this.content = content;
    this.username = username;
    this.createdAt = createdAt;
    this.sentimentScore = score;
    this.sentimentString = string;
  }

  Messages.prototype.save = function() {
    Messages.all.push(this);
    console.log("message saved!", this);
  };

  Messages.prototype.render = function() {
    var message = templateMessages(this);
    $messages.append(message);
  };

  function dateFormat(d) {
    var minutes = function() {
        var m = d.getMinutes();
        if (m < 10) {
            return "0" + m;
        } else {
            return m;
        }
    };
    d = (d.getMonth()+1) + "/"+ d.getDate() + "/" + d.getFullYear() + " at " + d.getHours() + ":" + minutes();
    return d;
  }

  function getMessageFromFirebase(snapshot) {
    var messageData = snapshot.val();
    messageCount++;
    var time = messageData.createdAt || (new Date().getTime());
    var sentimentScore = messageData.sentimentScore || 0;
    var sentimentString = messageData.sentimentString || "neutral";
    var message = new Messages(messageData.content, messageData.username, time, sentimentScore, sentimentString);
    message.save();
    message.render();
  }

  function setWithSentiment(message) {
    var text = message.content.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    text = text.replace(/\s/g, "%20");
    $.ajax({
      url: 'http://gateway-a.watsonplatform.net/calls/text/TextGetTextSentiment',
      type: 'POST', 
      dataType: 'jsonp',
      contentType: 'json',
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
            scoreNum = parseFloat(data.docSentiment.score) || 0;
            typeString = data.docSentiment.type || "neutral";
        //else sentiment comes back as blank or undefined
        } else {
            scoreNum = 0;
            typeString = "neutral";
        }

        var newMessage = {
            username: message.username, 
            content: message.content, 
            createdAt: message.createdAt, 
            sentimentScore: scoreNum,
            sentimentString: typeString
        };
        
        myFirebaseRef.push(newMessage);
        console.log('new message added: ', newMessage);
      }, 
      error: function(xhr, error, errorThrown) {
        if(xhr.status && xhr.status == 400) {
          console.log(xhr.responseText);
        } else {
          console.log("something went wrong");
        }

        //still need to save message to firebase, but just with blank sentiment
        var newMessage = {
            username: message.username, 
            content: message.content, 
            createdAt: message.createdAt, 
            sentimentScore: undefined,
            sentimentString: undefined
        };
        
        myFirebaseRef.push(newMessage);
        console.log('new message added - no sentiment ', newMessage);

      }
    });
  }
  //----END of functions setup----//


  //----On Page Load----//
  Messages.all = [];
  getUsername();


  $('.chat-form').on('submit', function(event) {
    event.preventDefault();
    var date = new Date();
    date = dateFormat(date);
    var message = {
        username: getUsername(),
        content: $('#message').val(),
        createdAt: date, 
        sentimentScore: 0,
        sentimentString: "neutral"
    };
    console.log("message before sentiment", message);
    setWithSentiment(message);
  
    $('.chat-form')[0].reset();
    scrollToBottom();
  });

  //----Get messages from Firebase -- for all messages on page load AND with new items added ----//
  myFirebaseRef.on("child_added", getMessageFromFirebase);

  //----On page load, once all messages are loaded from Firebase ----//
  myFirebaseRef.once("value", function(snap) {
    scrollToBottom();
  });


  //----EVENT LISTENERS---//

  $('#chart').on('click', function(event) {
    $('.data-section').toggleClass('show');
    $('.data-section').toggleClass('col-sm-4');
    $('.messages-section').toggleClass('col-sm-12');
    $('.messages-section').toggleClass('col-sm-8');
  });

  $('#change-users').on('click', function() {
    localStorage.clear();
    getUsername();
  });

  $('#update-data').on('click', function() {
    var totalSentiment = 0;
    var sentimentTypes = [0,0,0];  //[positive, negative, neutral]
    var messages = Messages.all;
    
    //later adjust to loop only through most recent ~40 messages
    for(var i = 0; i < messages.length; i++) {
        totalSentiment += messages[i].sentimentScore;
        if (messages[i].sentimentString == "positive") {
          sentimentTypes[0]++;
        } else if (messages[i].sentimentString == "negative") {
          sentimentTypes[1]++;
        } else if (messages[i].sentimentString == "neutral") {
          sentimentTypes[2]++;
        }
    }

    console.log("counts", sentimentTypes[0], sentimentTypes[1], sentimentTypes[2]);
    var average = totalSentiment / messages.length;
    var color; 
    if (average < 0) {
      color = "negative-color";
    } else if (average > 0) {
      color = "positive-color";
    } else if (average === 0) {
      color = "neutral-color";
    }

    //append new data to the page with handlebars
    $sentiments.empty();
    var data = {average: average.toFixed(3), positive: sentimentTypes[0], negative: sentimentTypes[1], neutral: sentimentTypes[2], length: messages.length, color: color};
    var sentimentData = templateSentiments(data);
    $sentiments.append(sentimentData);

    var chartData = {
        labels: ["Positive", "Negative", "Neutral"],
        datasets: [
            {
                label: "My First dataset",
                fillColor: "rgba(151,187,205,0.6)",
                strokeColor: "rgba(151,187,205,0.8)",
                highlightFill: "rgba(151,187,205,0.8)",
                highlightStroke: "rgba(151,187,205,1)",
                data: [data.positive, data.negative, data.neutral]
            }
        ]
    };

    var ctx = $('#sentimentChart').get(0).getContext('2d');
    var sentimentChart; 
    if (sentimentChart) {
      sentimentChart.empty();
    } 
    ctx.canvas.width = 300;
    ctx.canvas.height = 300;
    sentimentChart = new Chart(ctx).Bar(chartData);

  });

});