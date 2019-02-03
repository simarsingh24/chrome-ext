
/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */

const serverAddress = "https://rd6urzb354.execute-api.us-east-1.amazonaws.com/beta";
vid_id="";
var tab;

function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');
    callback(url);
  });

}

function getWordTimes(arr, val){
  var times=[],i;
  for(i=0;i<arr.length;i++){
    if(arr[i].alternatives[0].content.toLowerCase()==val.toLowerCase()){
      times.push(arr[i].start_time)
    }
  }
  return times;
}

$.urlParam = function(name, url) {
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(url);
  if (results == null) {
    return null;
  } else {
    return results[1] || 0;
  }
}
function transcribeVid(id) {
  $.ajax({
    type: 'GET',
    url: serverAddress + `/transcribe-video?id=${id}`,
    success: function(e) {
     console.log("transcribe request "+e);
     checkTranscribeResult();
    },
    error: function() {
      console.log("error transcribing");
      checkTranscribeResult(id)
    }
  });
}
function checkTranscribeResult(id){
  console.log("checking");
  $.ajax({
    type: 'GET',
    url: serverAddress + `/transcribe-status?id=${id}`,
    success: function(f) {
      if(f["status"]=="COMPLETED"){
        fetchTranscript(id);
      }else{
        checkTranscribeResult(id);
      }
    },
    error: function() {
      console.log("error checking trans");
    }
  });
}
var transcript,sentiment,wordsPos;
function fetchTranscript(id){
  $.ajax({
    type: 'GET',
    url: serverAddress + `/get-transcripts?id=${id}`,
    success: function(finalJson) {
      transcript = finalJson["status"]["transcript"]
      sentiment = finalJson["status"]["sentiment"]
      wordsPos=finalJson["status"]["json"]
      $('#loading').remove();
      $('#queryform').show();
    },
    error: function() {
      console.log("error fetching ts");
      $('#loading').remove();
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
 
  $('#submit').on('click', function() {
    $('#submit').remove()
    $('#loading').show()
    id=vid_id
    $.ajax({
      type: 'GET',
      url: serverAddress + `/download-video?id=${id}`,
      success: function(d) {
        console.log("download response "+d);
        transcribeVid(id);
      },
      error: function() {
        console.log("error downloading");
      }
    });
  });
  $('#insights').on('click',function(){
      var ctx = document.getElementById("myChart");
      $('#myChart').toggle();
      var myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ["Negative", "Neutral", "Positive"],
            datasets: [{
                label: '# of Votes',
                data: [sentiment["SentimentScore"].Negative,sentiment["SentimentScore"].Neutral,sentiment["SentimentScore"].Positive],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });

  });

  $('#findtext').on('click',function(){
   
    search =$('#searchtext').val();
    indices = getWordTimes(wordsPos,search);
    var buttonDiv = document.getElementById("buttons"); 
    while (buttonDiv.firstChild) {
      buttonDiv.removeChild(buttonDiv.firstChild);
  }
    indices.forEach(function(time) {
     var button = document.createElement("button");
     button.style.margin="5px";
       button.classList.add("btn");
        button.classList.add("btn-primary");
        button.style.width="100px";
        button.onclick = function(){
          chrome.tabs.update({url: tab.url})
          console.log("url is"+tab.url);
         chrome.tabs.update({url:tab.url+"&t="+Math.trunc(time)+'s'})
         console.log('clicked '+time);
     };
    
     button.innerHTML="<div  style='width=33%'>"+time+"</div>";;
     buttonDiv.appendChild(button);
        
  });
  });

  $(document).ready(function() {
    $('#loading').hide();
    $('#queryform').hide();
    $('#myChart').hide();
     getCurrentTabUrl(function(url) {
      if ($.urlParam('v', url) != null) {
        console.log('found '+$.urlParam('v', url) )
        vid_id =$.urlParam('v', url)
      }
    });
  });

});
