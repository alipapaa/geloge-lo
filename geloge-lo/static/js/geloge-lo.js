var geloDataGroup;
var map;
var zoom;
var date = new Date();
var selected = 0;

function stringToDate(datestr){
    var datetime = datestr.split(' ');
    var date = datetime[0].split('-');
    var time = datetime[1].split(':');
    debug(time);
    return new Date(parseInt(date[0]),
                    parseInt(date[1]),
                    parseInt(date[2]), 
                    parseInt(time[0]),
                    parseInt(time[1]),
                    parseInt(time[2]));
}
var GeloElementFromJSON = function(datestr, text, gelo){
    var ret = new Object();
        
    ret.date = stringToDate(datestr);
    ret.date.setHours(ret.date.getHours() - ret.date.getTimezoneOffset()/60);

    ret.text = text;
    ret.gelo = gelo;
    ret.datestr = function(){
        return this.date.toString();  
    };
    return ret;
};

var GeloData = function(marker,  htmlElement){
    var ret = new Object();
    ret.marker = marker;
    ret.htmlElement = htmlElement;
    return ret;
};

var GeloDataGroup = function(){
    var ret = new Object();
    ret.geloDataList = [];

    ret.push = function(geloData){
        this.geloDataList.push(geloData);
    };

    ret.getHtmlElementByMarker = function(marker){
        for(var i in this.geloDataList){
            if(this.geloDataList[i].marker == marker){
                return this.geloDataList[i].htmlElement;
            }
        }
        return null;
    };

    ret.getMarkerByHtmlElement = function(htmlElement){
        for(var i in this.geloDataList){
            if(this.geloDataList[i].htmlElement == htmlElement){
                return this.geloDataList[i].marker;
            }
        }
        return null;
    };

    ret.eachGeloData = function(func){
        for(var i in this.geloDataList){
            func(this.geloDataList[i]);
        }
    };

    ret.closeAllInfoWindow = function(){
        var closeAllWindowFunc = function(gd){
            gd.marker.infoWindow.close();
        };
        this.eachGeloData(closeAllWindowFunc);
    };

    ret.removeAll = function(){
        var removeAllMarkerFromMap = function(gd){
            gd.marker.setMap(null);
        };
        this.eachGeloData(removeAllMarkerFromMap);
        this.geloDataList = [];
    };

    ret.cssForAllHtmlElements = function(key, val){
        var setCSSFunc = function(gd){
            $(gd.htmlElement).css(key, val);
        };
        this.eachGeloData(setCSSFunc);
    };

    ret.drawLine = function(){
        var coordinates = [];
        for(var i in this.geloDataList){
            coordinates.push(this.geloDataList[i].marker.position);
        }
        
        this.path = new google.maps.Polyline({
                                                 path: coordinates, 
                                                 strokeColor: "#0000FF",
                                                 strokeOpacity: 0.5,
                                                 strokeWeight: 2
                                             });
        this.path.setMap(map);
    };

    ret.eraseLine = function(){
        if(this.path){
            this.path.setMap(null);            
        }

    };

    ret.getCurrentSelected = function(){
        for(var i in this.geloDataList){
            if($(this.geloDataList[i].htmlElement).css('color') == 'red'){
                return this.geloDataList[i];
            }
        }
        return null;
    };

    ret.selectRelative = function(diff){
        var cur = this.getCurrentSelected();
        for(var i = 0; i < this.geloDataList.length; i++){
            if(this.geloDataList[i] == cur){
                if(!this.geloDataList[i+diff]){
                    debug("are-?");
                    return;
                }
                this.geloDataList[i+diff].htmlElement.onclick();                    
                debug("are-clicksitakedo");
                return;
            }
        }
    };

    ret.selectPrev = function(){
        this.selectRelative(-1);
    };

    ret.selectNext = function(){
        this.selectRelative(1);
    };

    return ret;
};

function debug(val){
    var elem = document.getElementById("debug");
    if(elem){
        elem.innerHTML = val;        
    }
}

function getBounds(A, B){
    var ymax = A.lat() > B.lat() ? A.lat() : B.lat();
    var ymin = A.lat() <= B.lat() ? A.lat() : B.lat();
    var xmax = A.lng() > B.lng() ? A.lng() : B.lng();
    var xmin = A.lng() <= B.lng() ? A.lng() : B.lng();
    
    return new google.maps.LatLngBounds(
        new google.maps.LatLng(ymin, xmin), 
        new google.maps.LatLng(ymax, xmax)
    );
}

function setPosition(geloDataGroup){
    debug(geloDataGroup.geloDataList[0].marker.position);
    var lat_max = geloDataGroup.geloDataList[0].marker.position.lat();
    var lat_min = geloDataGroup.geloDataList[0].marker.position.lat();
    var lng_max = geloDataGroup.geloDataList[0].marker.position.lng();
    var lng_min = geloDataGroup.geloDataList[0].marker.position.lng();
    
    for(var i = 1; i < geloDataGroup.geloDataList.length; i++){
        var lat = geloDataGroup.geloDataList[i].marker.position.lat();
        var lng = geloDataGroup.geloDataList[i].marker.position.lng();
        
        if(lat_max < lat){ lat_max = lat; }
        if(lng_max < lng){ lng_max = lng; }
        if(lat_min > lat){ lat_min = lat; }
        if(lng_min > lng){ lng_min = lng; }
    }
    
    var bound = getBounds(new google.maps.LatLng(lat_min, lng_min),
                          new google.maps.LatLng(lat_max, lng_max));
    map.fitBounds(bound);
}

function initialize() {
    var myOptions = {
        zoom: 1,
        center: new google.maps.LatLng(0, 0), 
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
}

function createMarker(gelodata){
    var marker = new google.maps.Marker({
                                            position: new google.maps.LatLng(gelodata.gelo[1], 
                                                                             gelodata.gelo[0]), 
                                            map: map, 
                                            title: i
                                        });
    marker.infoWindow = new google.maps.InfoWindow({
                                                       content: '<div style="height:200px;">' +
                                                           gelodata.datestr() + 
                                                           "<br />" + 
                                                           gelodata.text + 
                                                           "</div>"
                                                   });
    return marker;
}

function addGeloMarker(geloDataGroup, geloelem){
    var tweet = document.createElement("div");
    var marker = null;
    if(geloelem.gelo){ // if geolocation found
        marker = createMarker(geloelem);
        var geloData = new GeloData(marker, tweet);
        marker.geloParent = geloDataGroup;
        geloDataGroup.push(geloData);
        google.maps.event.addListener(marker, 'click', function() {
                                          marker.geloParent.closeAllInfoWindow();
                                          this.infoWindow.open(map,this);
                                          marker.geloParent.cssForAllHtmlElements('color', 'black');

                                          var tweet = this.geloParent.getHtmlElementByMarker(this);
                                          $(tweet).css('color', 'red');
                                          var top = $(tweet).offset().top;
                                          $('html,body').animate({ scrollTop: top }, 'fast');
                                      });
    }
    tweet.geloParent = geloDataGroup;
    tweet.onclick = function(){
        this.geloParent.closeAllInfoWindow();
        this.geloParent.cssForAllHtmlElements("color", "black");
        var marker = this.geloParent.getMarkerByHtmlElement(this);
        if(marker){
            marker.infoWindow.open(map, marker);
            $(this).css('color', 'red');
        }
        var top = $(this).offset().top;
        $('html,body').animate({ scrollTop: top }, 'fast');
    };
    tweet.innerHTML = 
        '<span>' + geloelem.text + '</span>' +
        '<br />' +
        '</span><span style="font-size: 70%; margin-left: 50%;">' + geloelem.datestr() + '</span>';
    if(marker){
        $(tweet).css('cursor', 'hand');
    }
    $("#timeline").append($(tweet));
    $("#timeline").append($(document.createElement('hr')));
}

function receiveGeloJsonCallback(result){
    for(i in result){
        var geloelem = new GeloElementFromJSON(result[i][0], result[i][1], result[i][2]);
        addGeloMarker(geloDataGroup, geloelem);
    }

    geloDataGroup.drawLine();
    setPosition(geloDataGroup);
}    

function getUserGelo(){
    geloDataGroup.closeAllInfoWindow();
    geloDataGroup.eraseLine();
    geloDataGroup.removeAll();
    $("#timeline").empty();
    
    var account = $("#account").val();
    $.getJSON( "/get_user_gelo.json?account=" + account, "", receiveGeloJsonCallback);
}

function event_up(){
    geloDataGroup.selectPrev();
}

function event_down(){
    geloDataGroup.selectNext();
}

$(document).keypress(function(event) {
                         var up_key = 107; // k
                         var down_key = 106; //j
                         if(event.keyCode == up_key){
                             event_up();
                         }
                         if(event.keyCode == down_key){
                             event_down();
                         }
                     });

$(document).ready(function(){
                      geloDataGroup = GeloDataGroup();
                      var account = $.query.get('account');
                      if(account){
                          $("#account").val(account);    
                          getUserGelo();
                      }
                      
                  });
                  
debug("ok");

