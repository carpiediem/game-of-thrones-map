//Utility function for referencing latitude & longitude in the locations list
function checkLocKey(locationKey, lat, lng) {
  if (locations[locationKey]) {
    var loc = locations[locationKey];
    if (Math.abs(loc.lat)<84.7 && Math.abs(loc.lng)<=176) return [loc.lat, loc.lng];
  }
  if (locationKey!="") console.log("Key "+locationKey+" was not found in the locations list ("+lat+", "+lng+").");
  if (typeof(lat)!="undefined" && typeof(lng)!="undefined")
    if (Math.abs(lat)<84.7 && Math.abs(lng)<=176)  return [lat, lng];
  console.log("Backup coordinates "+lat+" "+lng+" are not within map bounds.");
  return false;
}

//Read the state of the control keys
ctrlPressed = false;
document.onkeydown = function(event) { ctrlPressed = event.ctrlKey;}
document.onkeyup   = function(event) { ctrlPressed = false; }



//Utility function to check the sliders & checkboxes to display the correct coats of arms
function updateNobilityDisplay() {
  var showGreat = document.getElementById("toggle_regions" ).checked;
  var showMinor = document.getElementById("toggle_nobility").checked;
  var chapNum   = $("#chapSlider").val();
  var epNum     = $("#epSlider"  ).val();
  var byChapter = document.getElementById("radio_chapters").checked;

  for (i in nobility) {
    var n = nobility[i];
    var inTimeframe = (byChapter) ? (n.chapters[0]<=chapNum && chapNum<=n.chapters[1]) : (n.episodes[0]<=epNum && epNum<=n.episodes[1]);
    if (inTimeframe && ( showMinor || (n.isGreat&&showGreat) )) n.setVisible(true);
    else n.setVisible(false);
  }
}

//Utility function to check the sliders & checkboxes to display the characters
function updatePathDisplay(sliderType,index) {
  if (typeof(sliderType)!="string") {
    sliderType = $("#sliderType input").val();  //This doesn't work!!!!
    index      = (sliderType=="C") ? $("#chapSlider").val() : $("#epSlider"  ).val();
  }
  for (character in paths) if (document.getElementById("toggle_"+character).checked) displayCharcater(character, sliderType, index);
  
  //Show or hide Aegon in the character list
  if ((sliderType=="C") && $("#chapSlider").val()>=289) $(".aegonListItem").show();
  else                                                  $(".aegonListItem").hide();
}

//Display or hide the path of a single character
function displayCharcater(character,sliderType,index) {
  if (sliderType=="hide") {
    for (i in paths[character]) paths[character][i].setVisible(false);
    return false;
  }
  var currentPosition = null;
  for (i in paths[character]) {
    var overlay = paths[character][i];
    if (( (sliderType=="C" && (overlay.chapters[0]<=index && index<=overlay.chapters[1])) ||
         (sliderType=="E" && (overlay.episodes[0]<=index && index<=overlay.episodes[1])) )
        && (!$("#showMarkerOnly").prop("checked") || typeof(overlay.getPath)!="function") ) {
      overlay.setVisible(true);
      currentPosition = overlay.position;
    }
    else overlay.setVisible(false);
  }
  return currentPosition;
}

function sliderIncrement(i) {
  var currentSlider = (document.getElementById("radio_chapters").checked) ? $("#chapSlider") : $("#epSlider");
  var currentValue  = parseInt(currentSlider.val(),10);
  currentSlider.val(currentValue+i).slider("refresh");
  if (document.getElementById("radio_chapters").checked)
  {
    var chapter = chapters[currentValue+i];
    $("#chapTitle").html( "<a target='_blank' href='"+chapter["url"]+"'>" + chapter["title"] + "</a>" );
    updatePathDisplay("C",currentValue+i);
    ga('send', 'event', 'controls', 'increment', 'chapter', currentValue+i);
  }else{
    var episode = episodes[currentValue+i];;
    $( "#epTitle" ).html( "<a target='_blank' href='"+episode["url"]+"'>" + episode["title"] + "</a>" );
    updatePathDisplay("E",currentValue+i);
    ga('send', 'event', 'controls', 'increment', 'episode', currentValue+i);
  }
}


$(function(){
  //Tooltip
  /*
  $('#filter').qtip({
    content: {
       text: "Move the slider to the last chapter you've read or the last episode you've seen.  Any details past that will be hidden on this page.  Clicking links may lead to spoilers on other sites."
    },
    position: {
      my: 'right center',  // Position my top left...
      at: 'left center', // at the bottom right of...
      target: $('#filter h4') // my target
    },
    style: {
      tip: {corner: 'leftMiddle'}
    }
  });
  */
  
      $('#filter').qtip({
        content: {
            text: "Move the slider to the last chapter you've read or the last episode you've seen.  Any details past that will be hidden on this page.  Clicking links may lead to spoilers on other sites."
        },
        overwrite: false,
        position: {
            at: "left center",
            my: "right center",
            target: $('#filter h4'),
            viewport: $(window)
        },
        style: {
            classes: 'qtip-dark qtip-rounded qtip-cluetip'
        }
    });

  $("#infoLink"   ).click(function(){
    $("#shade, #lightbox").show();
    ga('send', 'event', 'navigation', 'view', 'lightbox');
  });
  $("#closeButton").click(function(){
    $("#shade, #lightbox").hide();
    ga('send', 'event', 'navigation', 'close', 'lightbox');
  });

  $("#chapTitle").html( "<a target='_blank' href='"+chapters[0]["url"]+"'>" + chapters[0]["title"] + "</a>" );
  $("#chapSlider").change(function() {
    console.log("Slider change");
    console.log("New chapter: "+$(this).val());
    ga('send', 'event', 'controls', 'slide', 'chapter', $(this).val());
    var chapter = chapters[$(this).val()];
    $("#chapTitle").html( "<a target='_blank' href='"+chapter["url"]+"'>" + chapter["title"] + "</a>" );var showGreat = document.getElementById("toggle_regions").checked;
    var showMinor = document.getElementById("toggle_nobility").checked;
    if (showGreat || showMinor) updateNobilityDisplay();
    updatePathDisplay("C",$(this).val());
  }).attr("max", chapters.length-1).slider("refresh");
  
  $("#epTitle").html( "<a target='_blank' href='"+episodes[0]["url"]+"'>" + episodes[0]["title"] + "</a>" );
  $("#epSlider").change(function() {
    ga('send', 'event', 'controls', 'slide', 'episode', $(this).val());
    var episode = episodes[$(this).val()];
    $( "#epTitle" ).html( "<a target='_blank' href='"+episode["url"]+"'>" + episode["title"] + "</a>" );
    var showGreat = document.getElementById("toggle_regions").checked;
    var showMinor = document.getElementById("toggle_nobility").checked;
    if (showGreat || showMinor) updateNobilityDisplay();
    updatePathDisplay("E",$(this).val());
  }).attr("max", episodes.length-1).slider("refresh");
  
  timeout = null;
  $("#slideUp"  ).click(function() { sliderIncrement(1)  });
  $("#slideDown").click(function() { sliderIncrement(-1) });
  $("#slideUp"  ).mousedown(function() {
    timeout = setInterval(function(){ sliderIncrement(1)  }, 100);
    return false;
  });
  $("#slideDown").mousedown(function() {
    timeout = setInterval(function(){ sliderIncrement(-1) }, 100);
    return false;
  });
  $(document).mouseup(function(){
    clearInterval(timeout);
    return false;
  });
  
  $('#sliderType input').change(function() {
    if ($(this).val()=="C") {
      $("#chapGroup").show();
      $("#epGroup"  ).hide();
      updatePathDisplay("C",$("#chapSlider").val());
      ga('send', 'event', 'controls', 'switchSlider', 'chapter');
    }else{
      $("#chapGroup").hide();
      $("#epGroup"  ).show();
      $("#aegonListItem").hide();
      updatePathDisplay("E",$("#epSlider").val());
      ga('send', 'event', 'controls', 'switchSlider', 'episode');
    }
    updateNobilityDisplay();
  });
  
  $("#toggle_nobility").change(function() {
    updateNobilityDisplay();
    ga('send', 'event', 'controls', 'toggle', 'nobility');
  });
  
  $("#toggle_regions").change(function() {
    updateNobilityDisplay();
    ga('send', 'event', 'controls', 'toggle', 'regions');
    if (this.checked) {
      $("#legend").show();
      for (i in regions) regions[i].setVisible(true);
    } else {
      $("#legend").hide();
      for (i in regions)  regions[i].setVisible(false);
    }
  });
  
  //Add click event handlers to the "links" above the character list
  $("#allCharacters").click(function() {
    ga('send', 'event', 'controls', 'toggle', 'allCharacters');
    if ($(".pathToggle:checked").size()==$(".pathToggle").size()) {
      $(".pathToggle").prop("checked", false)
                      .each(function(){
                        var character = this.id.substr(7,99);
                        displayCharcater(character,"hide");
                      });
      $("#allCharacters").text("select all");
    }else{
      var chapNum   = $("#chapSlider").val();
      var epNum     = $("#epSlider"  ).val();
      var byChapter = document.getElementById("radio_chapters").checked;
      $(".pathToggle").prop("checked", true)
                      .each(function(){
                        var character = this.id.substr(7,99);
                        if (byChapter) displayCharcater(character, "C", chapNum)
                        else           displayCharcater(character, "E", epNum);
                      });
      $("#allCharacters").text("hide all");
    }
  });
  $("#pathDisplay").click(function(){
    ga('send', 'event', 'controls', 'toggle', 'pathDisplay');
    if (!$("#showMarkerOnly").prop("checked")) {
      $("#showMarkerOnly").prop("checked", true);
      $("#pathDisplay").text("show full path");
      updatePathDisplay();
    }else{
      $("#showMarkerOnly").prop("checked", false);
      $("#pathDisplay").text("current locations only");
      updatePathDisplay();
    }
  });
  $("#showMarkerOnly").prop("checked", false); //Initialization
  
  //Add behaviors for charchter path checkboxes
  $(".pathToggle").change(function() {
    ga('send', 'event', 'controls', 'toggle', 'character', $(this).parent().index());
    var character = this.id.substr(7,99);
    var chapNum   = $("#chapSlider").val();
    var epNum     = $("#epSlider"  ).val();
    var byChapter = document.getElementById("radio_chapters").checked;
    if (!this.checked) {
      displayCharcater(character,"hide");
      $("#allCharacters").text("select all");
    } else {
      var currentPosition = byChapter ? displayCharcater(character, "C", chapNum) : displayCharcater(character, "E", epNum);
      map.setCenter(currentPosition);
      console.log("Map recentered at "+currentPosition);
    }
  });
  
  
  //Define the base layers
  var labelsMapType = new google.maps.ImageMapType({
    getTileUrl: function(coord,zoom) {
      if (isOutsideTileRange(coord,zoom)) return null;
      return "fsm/"+getTileCode(coord,zoom)+".jpg";
    },
    tileSize: new google.maps.Size(256, 256),
    maxZoom: 5,
    minZoom: 1,
    radius: 1738000,
    name: "Labels"
  });
  
  var nolabelMapType = new google.maps.ImageMapType({
    getTileUrl: function(coord,zoom) {
      if (isOutsideTileRange(coord,zoom)) return null;
      return "nat/"+getTileCode(coord,zoom)+".jpg";
    },
    tileSize: new google.maps.Size(256, 256),
    maxZoom: 5,
    minZoom: 1,
    radius: 1738000,
    name: "No Labels"
  });
  
  //Check URL for center point
  //#@100,-80.3 or #@Winterfell
  var urlCoords   = window.location.href.match(/#@(\-*\d+\.*\d*),\s*(\-*\d+\.*\d*)/);
  if (urlCoords==null)   urlCoords   = ["",0,-105];
  var urlLocation = window.location.href.match(/#@([^&]+)/);
  urlLocation = (urlLocation!=null) ? urlLocation[1] : "";
  var checkedCoords = checkLocKey(urlLocation, urlCoords[1], urlCoords[2]);
  var center = (!checkedCoords) ? new google.maps.LatLng(0, -105) : new google.maps.LatLng(checkedCoords[0], checkedCoords[1]);
  var isLargeScreen = ($(window).height()>500);
  
  var map = new google.maps.Map(document.getElementById("map_canvas"), {
    center: center,
    zoom: 4,
    streetViewControl: false,
    overviewMapControl: true,
    overviewMapControlOptions: {opened:isLargeScreen},
    mapTypeControlOptions: {mapTypeIds: ["Labels", "No Labels"]}
  });
  
  //Add Map Types
  map.mapTypes.set('Labels',    labelsMapType);
  map.mapTypes.set('No Labels', nolabelMapType);
  map.setMapTypeId('Labels');
  
  //Add overlay data to the map (required ASoIaF-overlays.js)
  alphaLocations = [];
  for (key in locations) {
    markLocation(map, key, locations[key]);
    alphaLocations.push(key);
  }
  alphaLocations.sort();
  for (i in regions) regions[i] = createPolygon  (map, regions[i]);
  for (i in nobility) {
    if (typeof(nobility[i].seatKey)=="string") {
      locations[nobility[i].seatKey].house = nobility[i].wikiKey.replace(/House\_/gi,"").replace(/\_/gi," ").replace(/\%27/gi,"'");
      locations[nobility[i].seatKey].img   = nobility[i].img;
    }
    nobility[i] = markNobility(map, nobility[i]);
  }
  for (character in paths)
    for (i in paths[character]) {
      paths[character][i] = markPathSegment(map, paths[character][i]);
      $("#toggle_"+character).removeAttr('disabled');
    }
  
  //Fill the townSelector list
  locations["Winterfell"].house = "Stark";
  locations["Winterfell"].img   = "http://awoiaf.westeros.org/images/thumb/5/51/House_Stark.PNG/90px-House_Stark.PNG";
  for (i in alphaLocations) {
    var name  = alphaLocations[i].replace(/\_/gi," ").replace(/\%27/gi,"'");
    var house = (typeof(locations[alphaLocations[i]].house)=="string") ? " "+locations[alphaLocations[i]].house : "";
    $("#townSelector").append('<li data-filtertext="' + name + house + '" data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="div" data-icon="arrow-r" data-iconpos="right" data-theme="c" class="ui-btn ui-btn-up-c ui-btn-icon-right ui-li-has-arrow ui-li ui-screen-hidden"><div class="ui-btn-inner ui-li"><div class="ui-btn-text"><a id="link' + alphaLocations[i] + '" href="#@' + alphaLocations[i] + '" class="ui-link-inherit">' + name + '</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow">&nbsp;</span></div></li>');
  }
  $("#townSelector").listview();
  $(".ui-li a, #lightboxLink, h4 a").click(function() {
    var key = $(this).attr("href").substring(2,99);
    var center = new google.maps.LatLng(locations[key].lat,locations[key].lng);
    var house = "";
    var arms  = "";
    if (typeof(locations[key].house)=="string") {
      house = "<br/>House: " + locations[key].house;
      arms  = '<img src="'   + locations[key].img + '" style="float:left;width:30px;margin-right:3px;">';
    }
    map.panTo(center);
    new google.maps.InfoWindow({content:arms+key.replace(/\_/gi," ").replace(/\%27/gi,"'")+house, position:center}).open(map);
    $('input[data-type="search"]').val("");
    $('input[data-type="search"]').trigger("keyup");
    console.log("#townSelector click event triggered: "+key);
  });
  
  //Show an InfoBox if the map is centered on a specific town
  if (urlLocation!="") {
    var house = "";
    var arms  = "";
    if (typeof(locations[urlLocation].house)=="string") {
      var house =  "<br/>House: " + locations[urlLocation].house;
      var arms  = '<img src="'    + locations[urlLocation].img + '" style="float:left;width:30px;margin-right:3px;">';
    }
    new google.maps.InfoWindow({content:arms+urlLocation.replace(/\_/gi," ").replace(/\%27/gi,"'")+house, position:center}).open(map);
  }
  
  //Give initial focus to the slider (so arrow keys change the chapter)
  $('#chapSlider .ui-slider-handle').focus();
  

  google.maps.event.addListener(map, 'click', function(event) {
    if (ctrlPressed) {
      ga('send', 'event', 'controls', 'url', 'clickToCenter');
      window.location = "#@" + event.latLng.toString().replace(/\(|\)|\s/g,"");
      map.panTo(event.latLng);
    }else{
      //Uncomment this line to find the coordinates of locations on the map
      //new google.maps.InfoWindow({position:event.latLng, content:Math.round(event.latLng.lat()*10000)/10000+","+Math.round(event.latLng.lng()*10000)/10000 }).open(map);
    }
  });
  
  //Mobile Interface
  $("#menuButton, #returnToMap, .ui-li a, #lightboxLink").click(function(){
    $("#map_canvas, #menuButton, #filter").toggle();
    ga('send', 'event', 'navigation', 'toggle', 'mobileMenu');
  });
  $("#showCharacterPaths, #closeCharList").click(function(){
    $("#handheldToggles, #filter").toggle();
    ga('send', 'event', 'navigation', 'toggle', 'mobileCharacters');
  });
  $("#aboutThisSite, #handheldCloseButton").click(function(){
    $("#lightbox, #filter").toggle();
    ga('send', 'event', 'navigation', 'toggle', 'mobileAbout');
  });
  $("#htRegions, #htNobility, #handheldToggles label").click(function() { $(this).find("span.ui-icon").toggle(); })
                                                      .find("span.ui-icon").hide();
  
}); //jQuery ready function