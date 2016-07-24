angular.module('quartermaester')

.factory('smgMapType', function() {

   return {
     getTile: getTile,
     tileSize: {height:256, H:"px", width:256, W:"px"},
     name: 'Planetos',
     radius: 1738000
   };

   function getTile(coord, zoom, ownerDocument) {
     if (isOutsideTileRange(coord,zoom)) return false;
     var div = ownerDocument.createElement('div');
     div.style.width = '256px';
     div.style.height = '256px';
     div.style.backgroundImage = "url('tiles/" + getTileCode(coord,zoom) + ".jpg')";
     return div;
   }

   function isOutsideTileRange(coord,zoom) {
     var tileRange = 1 << zoom;
     if (coord.x < 0 || coord.x >= tileRange) return true;
     if (coord.y < 0 || coord.y >= tileRange) return true;
     return false;
   }

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



 })

 .factory('qmCsv', function($http, $filter, fCsv) {

  var csvLocation = "http://www.rslc.us/quartermaester/data/";
  return {
    get: getFile,
    setHomes: setHomes,
    getCurrentOccupant: getCurrentOccupant
  };

  ///////////////////////////////

  function getFile(filename) {
    return $http
      .get(csvLocation + filename)
      .then(getDataAttr)
      .then(fCsv.toJson)
      .then(angular.fromJson)
  }

  function getDataAttr(resp) {
    return resp.data;
  }

  function setHomes(locations, houses) {
    //console.log(locations, houses);

    var markers = locations.map(locationModel);

    for (var i=0; i<markers.length; i++) {
      var matchingHouses = $filter('filter')(houses, {seatKey: locations[i].key});
      markers[i].occupants = matchingHouses.map(function(house) {
        return {
          name: decodeURI(house.wikiKey).replace(/_/g," "),
          url: "http://awoiaf.westeros.org/index.php/" + house.wikiKey,
          img: house.img,
          firstChapter: parseInt(house.firstChapter, 10) || null,
          lastChapter:  parseInt(house.lastChapter,  10) || null,
          firstEpisode: parseInt(house.firstEpisode, 10) || null,
          lastEpisode:  parseInt(house.lastEpisode,  10) || null
        }
      });

    }

    return markers;
  }

  function locationModel(json) {
    return {
      key: json.key,
      name: decodeURI(json.key).replace(/_/g," "),
      url: "http://awoiaf.westeros.org/index.php/" + json.key,
      direct: "#@" + json.key,
      coords: {
        latitude:  parseFloat(json.latitude),
        longitude: parseFloat(json.longitude)
      },
      options: {
        icon: {path: 0, strokeOpacity: 0, scale: 3}
      },
      occupants: []
    };
  }

  function getCurrentOccupant(marker) {
    if (marker.occupants.length==0) return null;
    if (marker.occupants.length==1) return marker.occupants[0];
    return $filter('qmSlider')(marker.occupants, "episodes", 0)[0];
  }

})

.filter('qmSlider', function() {

  // In the return function, we must pass in a single parameter which will be the data we will work on.
  // We have the ability to support multiple other parameters that can be passed into the filter optionally
  return function(inputArray, slider, value) {

    outputArray = [];
    for (var i=0; i<inputArray.length; i++) {
      switch (slider) {
        case "episodes":
          if (inputArray[i].firstEpisode==null || (value>=inputArray[i].firstEpisode && value<=inputArray[i].lastEpisode)) outputArray.push(inputArray[i]);
          break;
        case "chapters":
          if (inputArray[i].firstChapter==null || (value>=inputArray[i].firstChapter && value<=inputArray[i].lastChapter)) outputArray.push(inputArray[i]);
          break;
      }
    }

    return outputArray;

  }

});
