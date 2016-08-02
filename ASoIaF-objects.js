//Tile Handling
function getTileCode(a,b) {
  //converts tile x,y into keyhole string
  var c=Math.pow(2,b);
  var d=a.x;
  var e=a.y;
  var f="t";
  for(var g=0;g<b;g++){
    c=c/2;
    if(e<c){
      if(d<c){f+="q"}
      else{f+="r";d-=c}
    }
    else{
      if(d<c){f+="t";e-=c}
      else{f+="s";d-=c;e-=c}
    }
  }
  return f;
}

//Tile Handling
function isOutsideTileRange(coord,zoom) {
  var tileRange = 1 << zoom;
  if (coord.x < 0 || coord.x >= tileRange) return true;
  if (coord.y < 0 || coord.y >= tileRange) return true;
  return false;
}


      //Transparent markers placed on top of each city, town, castle, & ruin
function markLocation(map, key, locationOptions) {
  //Sample input-> They_Lay_With_Lions: {lat:23.4027, lng:-126.2548, title:"23: Inn (They Lay with Lions)", url:"http://awoiaf.westeros.org/index.php/A_Storm_of_Swords-Chapter_1"},
  if ( (typeof(locationOptions.lat)!="number") || (typeof(locationOptions.lng)!="number") ) {
    console.log("Location "+key+" was missing either the lat or lng attribute.");
    return false;
  }
  
  var title  = (typeof(locationOptions.title)!="undefined") ? locationOptions.title : "";
  var url    = (typeof(locationOptions.url)  !="undefined") ? locationOptions.url : "http://awoiaf.westeros.org/index.php/"+key;
  var marker = new google.maps.Marker({
                 position: new google.maps.LatLng(locationOptions.lat, locationOptions.lng),
                 title: title,
                 icon: {path:google.maps.SymbolPath.CIRCLE, strokeOpacity:0, scale:3},
                 map: map
               });
  google.maps.event.addListener(marker,"click", function(event) {
    if (ctrlPressed) window.location = "#@" + key;
    else window.open(url, '_blank');
  });
  return marker;
}

//Colored shapes matching the borders of the 9 constituencies of Westeros
function createPolygon (map, regionOptions) {
  //Sample input-> {coords:giftCoords, color:"#000000", key:"Gift"}     (giftCoords is an array of google.maps.LatLng objects)
  if (  typeof(regionOptions.key)   !="string")                                      return console.log("Region was missing a key attribute.");
  if (  typeof(regionOptions.color) !="string")                                      return console.log("Region "+regionOptions.key+" was missing a color attribute.");
  if ( (typeof(regionOptions.coords)!="object") || (regionOptions.coords.length<3) ) return console.log("Region "+regionOptions.key+" was missing a coords attribute.");
  
  var url = "http://awoiaf.westeros.org/index.php/"+regionOptions.key;
  var polygon = new google.maps.Polygon({
    paths: regionOptions.coords,
    fillColor: regionOptions.color,
    fillOpacity: 0.7,
    strokeWeight: 0,
    visible:false,
    map: map
  });
  google.maps.event.addListener(polygon,"click", function(event) {window.open(url, '_blank');});
  return polygon;
}

//Coats of arms for every known noble family (some locations were guessed)
function markNobility (map, nobilityOptions) {
  //Sample input-> {wikiKey:"House_Bolton", seatKey:"Dreadfort", imgRatio:(120/102), img:"http://awoiaf.westeros.org/images/thumb/7/76/Bolton.png/102px-Bolton.png", isGreat:true, chapters:[196,999]}  (seatKey may be replaced with lat & lng)
  if (typeof(nobilityOptions.img) !="string") return console.log(nobilityOptions.wikiKey+" in the nobility list was missing an img attribute.");
  
  if (typeof(nobilityOptions.seatKey)=="string")                                              var coords = checkLocKey(nobilityOptions.seatKey);
  else {
    if ( (typeof(nobilityOptions.lat)=="number") && (typeof(nobilityOptions.lng)=="number") ) var coords = checkLocKey("",nobilityOptions.lat, nobilityOptions.lng);
    else return false;
  }
  if (!coords) return false;
  
  var title     = (typeof(nobilityOptions.wikiKey)=="string")     ? decodeURI(nobilityOptions.wikiKey).replace(/_/g," ") : "No name listed";
  if (typeof(nobilityOptions.clue)=="string") {
    if (nobilityOptions.clue=="mountain clan") title = title.replace(/House/,"Clan");
    else title += " (somewhere in " + nobilityOptions.clue + ")";
  }
  var isGreat   = (typeof(nobilityOptions.isGreat) !="undefined") ? nobilityOptions.isGreat : false;
  var imgRatio  = (typeof(nobilityOptions.imgRatio)=="number")    ? nobilityOptions.imgRatio : 4/3;
  var imgHeight = (isGreat) ? 60 : 30;
  var anchorPoint = $.isArray(nobilityOptions.anchor) ? new google.maps.Point(nobilityOptions.anchor[0], nobilityOptions.anchor[1]) : new google.maps.Point(imgHeight/imgRatio/2, imgHeight/2);
  var icon = new google.maps.MarkerImage(
    nobilityOptions.img,
    null,
    null,
    anchorPoint,
    new google.maps.Size (imgHeight/imgRatio,   imgHeight)
  );
  var marker = new google.maps.Marker({
    position: new google.maps.LatLng(coords[0],coords[1]),
    title:    title,
    icon:     icon,
    visible:  false,
    map:      map
  });
  if (typeof(nobilityOptions.wikiKey)=="string") google.maps.event.addListener(marker,"click", function(event) {window.open("http://awoiaf.westeros.org/index.php/"+nobilityOptions.wikiKey, '_blank');});
  marker["isGreat"]  = isGreat;
  marker["chapters"] = (typeof(nobilityOptions.chapters)=="object") ? nobilityOptions.chapters : [0,999];
  marker["episodes"] = (typeof(nobilityOptions.episodes)=="object") ? nobilityOptions.episodes : [0,999];
  return marker;
}

//Teardrop markers & lines marking the path of each major character
function markPathSegment(map, overlayOptions) {
  if (typeof(overlayOptions.icon)=="string") {
    switch (overlayOptions.icon) {
      case "skull": var icon = "skull.png"; break;
      case "lost":  var icon = "question-mark.gif"; break;
      default:      var icon = "http://chart.googleapis.com/chart?chst=d_map_xpin_letter&chld=pin" + overlayOptions.icon;  //or d_map_pin_letter_withshadow
    }
    
    switch(overlayOptions.icon.substring(0,3)) {
      case "_sl": icon = {url:icon, anchor:new google.maps.Point(23,33)}; break;
      case "_sr": icon = {url:icon, anchor:new google.maps.Point(0, 33)}; break;
    }
    
    if (typeof(overlayOptions.key)=="string") {
      //Sample input-> {icon:"greyC", chapters:[0,17], episodes:[0,1], key:"Winterfell"}
      checkResults = checkLocKey(overlayOptions.key);
      if (!checkResults) return console.log("Item "+overlayOptions.key+" in the character path list does not match a known location.");
      
      var overlay = new google.maps.Marker({
        position: new google.maps.LatLng(checkResults[0] ,checkResults[1] ),
        icon: icon,
        visible: false,
        map: map
      });
    }else{
      //Sample input-> {icon:"greyE", chapters:[15,19], episodes:[1,1], coord:[26.4312,-114.1406]}
      if (typeof(overlayOptions.coord)!="object") return console.log("One item in the character path list is missing a coord attribute.");
      if (overlayOptions.coord.length!=2) return console.log("One item in the character path list has an inappropriate coord attribute: "+overlayOptions.coord);
      if (!checkLocKey("", overlayOptions.coord[0], overlayOptions.coord[1])) return console.log("One item in the character path list has coordinates outside the edges of the map: "+overlayOptions.coord);
      
      var overlay = new google.maps.Marker({
        position: new google.maps.LatLng(overlayOptions.coord[0],overlayOptions.coord[1]),
        icon: icon,
        visible: false,
        map: map
      });
    }
  } //icons
  
  if (typeof(overlayOptions.line)=="string"){
    //Sample input-> {line:"#808080", chapters:[20], episodes:2, path:[[26.4312,-114.1406], "Darry", [16.0669,-109.5263],"Hayford","King%27s_Landing"]}
    if (typeof(overlayOptions.line)!="string") return console.log("One item in the character path list has neither a icon nor line attribute.");
    if (typeof(overlayOptions.path)!="object") return console.log("One item in the character path list is missing a path attribute.");
    
    //Parse the array of coordinates in the path attribute
    var path = [];
    var checkResults = [];
    for (i in overlayOptions.path) {
      if (typeof(overlayOptions.path[i])=="string") {
        checkResults = checkLocKey(overlayOptions.path[i]);
        if (!checkResults) continue;
        path.push(new google.maps.LatLng(checkResults[0] ,checkResults[1] ));
      }
      if (typeof(overlayOptions.path[i])=="object") {
        if (overlayOptions.path[i].length!=2) continue;
        if (!checkLocKey("", overlayOptions.path[i][0], overlayOptions.path[i][1])) continue;
        path.push(new google.maps.LatLng(overlayOptions.path[i][0], overlayOptions.path[i][1] ));
      }
    }
    
    var overlay = new google.maps.Polyline({
      path: path,
      strokeColor: overlayOptions.line,
      strokeOpacity: 1.0,
      strokeWeight: 8,
      visible: false,
      map: map
    });
    
    
    //TEMPORARY
    //google.maps.event.addListener(overlay, 'click', function(event) {
    //  new google.maps.InfoWindow({position:event.latLng, content:Math.round(event.latLng.lat()*10000)/10000+","+Math.round(event.latLng.lng()*10000)/10000 }).open(map);
    //});
    
  } //lines
  
  if (typeof(overlayOptions.arrow)=="string"){
    //Sample input-> {arrow:"#808080", chapters:59, coord:[42.0329, -125.5078], heading:210}
    if (typeof(overlayOptions.coord)!="object")   return console.log("One arrow in the character path list is missing a coord attribute.");
    if (overlayOptions.coord.length!=2)           return console.log("One arrow in the character path list has an inappropriate coord attribute: "+overlayOptions.coord);
    if (typeof(overlayOptions.heading)!="number") return console.log("One arrow in the character path list is missing a heading attribute.");
    
    var overlay = new ArrowOverlay(map,
                                   new google.maps.LatLng(overlayOptions.coord[0],overlayOptions.coord[1]),
                                   overlayOptions.heading,
                                   overlayOptions.arrow,
                                   1);
  } //arrows
      
  overlay["chapters"] = [999,999];
  if (typeof(overlayOptions.chapters)=="number")                                             overlay.chapters[0] = overlayOptions.chapters;
  if (typeof(overlayOptions.chapters)=="object") {
    if (overlayOptions.chapters.length==2) if (typeof(overlayOptions.chapters[1])=="number") overlay.chapters[1] = overlayOptions.chapters[1];
    if (                                       typeof(overlayOptions.chapters[0])=="number") overlay.chapters[0] = overlayOptions.chapters[0];
  }

  overlay["episodes"] = [99,99];
  if (typeof(overlayOptions.episodes)=="number")                                             overlay.episodes[0] = overlayOptions.episodes;
  if (typeof(overlayOptions.episodes)=="object") {
    if (overlayOptions.episodes.length==2) if (typeof(overlayOptions.episodes[1])=="number") overlay.episodes[1] = overlayOptions.episodes[1];
    if (                                       typeof(overlayOptions.episodes[0])=="number") overlay.episodes[0] = overlayOptions.episodes[0];
  }
  
  return overlay;
}