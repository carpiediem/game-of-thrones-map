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

 .factory('qmCsv', function($q, $http, $filter, fCsv) {

  var csvLocation = (window.location.protocol=="file:") ? "https://raw.githubusercontent.com/carpiediem/quartermaester/master/data/" : "data/";
  return {
    loadData: loadData,
    getEpisodeId: getEpisodeId,
    //getChapterId: getChapterId
  };

  ///////////////////////////////

  function loadData() {
    return $q.all([
      getFile('books.csv'),
      getFile('chapters.csv'),
      getFile('seasons.csv'),
      getFile('episodes.csv'),
      getFile('houses.csv'),
      getFile('characters.csv'),
      getFile('regions.csv'),
      getFile('towns.csv'),
      getFile('borders.csv'),
      getFile('stops.csv'),
      getFile('waypoints.csv'),
      getFile('paths.csv')
    ]).spread(parseData);
  }

  function parseData(books, chapters, seasons, episodes, houses, characters, regions, towns, borders, stops, waypoints, paths) {
    var qmData = {
      borderArrays: {},
      waypointArrays: {},
      bookLookup: {}
    };


    for (var i=0; i<borders.length; i++) {
      if (!(borders[i].name in qmData.borderArrays))
        qmData.borderArrays[borders[i].name] = [];
      qmData.borderArrays[borders[i].name].push(borders[i]);
    }

    for (var i=0; i<waypoints.length; i++) {
      if (!(waypoints[i].key in qmData.waypointArrays))
        qmData.waypointArrays[waypoints[i].key] = [];
      qmData.waypointArrays[waypoints[i].key].push(waypoints[i]);
    }

    for (var i=0; i<books.length; i++) {
      qmData.bookLookup[books[i].abbreviation] = books[i];
    }

    qmData.episodes   = episodes.map(episodeModel);
    qmData.chapters   = chapters.map(chapterModel);
    qmData.books      = books;
    qmData.regions    = regions.map(regionModel);
    qmData.characters = characters.map(characterModel);
    qmData.towns      = getTownMarkers(towns, houses);
    qmData.heraldry   = houses.map(heraldryMarkerModel);
    qmData.characterMarkers = stops.map(characterMarkerModel);
    qmData.characterPaths = paths.map(characterPathModel);


    qmData.searchResults = [].concat(
      towns.map(townSearchModel),
      characters.map(characterSearchModel),
      houses.map(houseSearchModel),
      episodes.map(episodeSearchModel),
      chapters.map(chapterSearchModel)
    );


    return qmData;


    function episodeModel(episode) {
      var epNumber = (episode.episode.length==2) ? episode.episode : "0"+episode.episode;
      return {
        name: "S" + episode.season + "E" + epNumber + ": " + episode.title,
        url: (episode.awoiaf=="") ? "https://en.wikipedia.org/wiki/"+episode.wikipedia.replace(/"/g,"") : "http://awoiaf.westeros.org/index.php/"+episode.awoiaf.replace(/"/g,"")
      };
    }

    function episodeSearchModel(episode) {
      var epNumber = (episode.episode.length==2) ? episode.episode : "0"+episode.episode;
      return {
        icon: "glyphicon-facetime-video",
        title: episode.title,
        subtitle: "HBO episode",
        abbr: "S" + episode.season + "E" + epNumber + ": " + episode.title,
        click: function(){slideTo(this.abbr)}
      };
    }

    function chapterModel(chapter) {
      return {
        name: books[chapter.book].abbreviation + "-" + chapter.chapter + ": " + chapter.title,
        url: "http://awoiaf.westeros.org/index.php/"+chapter.awoiaf
      };
    }

    function chapterSearchModel(chapter) {
      return {
        icon: "glyphicon-book",
        title: chapter.title,
        subtitle: books[chapter.book].title,
        abbr: books[chapter.book].abbreviation + "-" + chapter.chapter,
        click: function(){slideTo(this.abbr)}
      };
    }

    function getTownMarkers(towns, houses) {
      var output = [];
      var matchingHouses = [];
      for (var townId=0; townId<towns.length; townId++) {
        var town = towns[townId];
        var matchingHouses = $filter('filter')(houses, {seatKey: town.key});

        // Towns without nobility or other locations
        if (matchingHouses.length==0) output.push({
          key: town.key,
          name: decodeURI(town.key).replace(/_/g," "),
          url: "http://awoiaf.westeros.org/index.php/" + town.key,
          house: "No known lord",
          houseUrl: null,
          timing: {
            episodes: [0,999],
            chapters: [0,999]
          },
          direct: "#@" + town.key,
          coords: {
            latitude:  parseFloat(town.latitude),
            longitude: parseFloat(town.longitude)
          },
          options: {
            icon: {path: 0, strokeOpacity: 0, scale: 3}
          }
        });

        for (var houseId=0; houseId<matchingHouses.length; houseId++) {
          var house = matchingHouses[houseId];
          output.push({
            key: town.key,
            name: decodeURI(town.key).replace(/_/g," "),
            url: "http://awoiaf.westeros.org/index.php/" + town.key,
            house: decodeURI(house.wikiKey).replace(/_/g," "),
            houseUrl: "http://awoiaf.westeros.org/index.php/" + house.wikiKey,
            houseImg: house.img,
            timing: {
              episodes: [
                parseInt(house.firstEpisode, 10) || 0,
                parseInt(house.lastEpisode , 10) || 999
              ],
              chapters: [
                parseInt(house.firstChapter, 10) || 0,
                parseInt(house.lastChapter , 10) || 999
              ]
            },
            direct: "#@" + town.key,
            coords: {
              latitude:  parseFloat(town.latitude),
              longitude: parseFloat(town.longitude)
            },
            options: {
              icon: {path: 0, strokeOpacity: 0, scale: 3}
            }
          });
        }

      }


      return output;
    }

    function townSearchModel(town) {
      return {
        icon: "glyphicon-map-marker",
        key: town.key,
        title: town.name,
        subtitle: town.region.replace(/_/g," "),
        click: function(){panTo(this.key)}
      };
    }

    function characterModel(character) {
      if (character.house!="") var matchingHouse = $filter('filter')(houses, {wikiKey: character.house})[0];
      return {
        key: character.key,
        name: character.name,
        url: "http://awoiaf.westeros.org/index.php/" + character.key,
        color: character.markerColor,
        pin: "https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=" + character.letter + "|" + character.markerColor.substring(1,7) + "|" + character.letterColor.substring(1,7),
        house: (character.house=="") ? "" : {
          name: decodeURI(matchingHouse.wikiKey).replace(/_/g," "),
          url: "http://awoiaf.westeros.org/index.php/" + matchingHouse.wikiKey,
          img: matchingHouse.img
        }
      };
    }

    function characterSearchModel(character) {
      return {
        icon: "glyphicon-user",
        key: character.key,
        title: character.name,
        subtitle: "", //decodeURI(character.house).replace(/_/g," "),
        click: function(){showCharacter(this.key)}
      };
    }

    function heraldryMarkerModel(house, index) {
      if (house.seatKey=="") {
        var coords = {
          latitude:  parseFloat(house.lat),
          longitude: parseFloat(house.lng)
        };
      } else {
        var matchingTown = $filter('filter')(qmData.towns, {key: house.seatKey})[0];
        var coords = matchingTown.coords;
      }
      house.isGreat = (house.isGreat=="TRUE");

      return {
        key: "house-" + index,
        name: decodeURI(house.wikiKey).replace(/_/g," "),
        url: "http://awoiaf.westeros.org/index.php/" + house.wikiKey,
        seat: decodeURI(house.seatKey).replace(/_/g," ") || house.clue || "unknown",
        seatUrl: "http://awoiaf.westeros.org/index.php/" + house.seatKey,
        houseImg: house.img,
        timing: {
          episodes: [
            parseInt(house.firstEpisode, 10) || 0,
            parseInt(house.lastEpisode , 10) || 999
          ],
          chapters: [
            parseInt(house.firstChapter, 10) || 0,
            parseInt(house.lastChapter , 10) || 999
          ]
        },
        direct: "#@" + house.seatKey,
        coords: coords,
        options: {
          icon: {
            url: house.img,
            scaledSize: house.isGreat ? {height:60, width:50} : {height:30, width:25},
            anchor: house.isGreat ? {x:30, y:25} : {x:15, y:12}
          }
        }
      };
    }

    function houseSearchModel(house) {
      return {
        icon: "glyphicon-home",
        title: decodeURI(house.wikiKey).replace(/_/g," "),
        subtitle: (house.seatKey=="") ? house.clue : decodeURI(house.seatKey).replace(/_/g," "),
        click: function(){showCharacter(character.key)}
      };
    }

    function regionModel(region) {
      return {
        key: region.key,
        fill: {
          color: region.color,
          opacity: 0.5
        },
        stroke: {weight: 0},
        path: qmData.borderArrays[region.key]
      };
    }

    function characterMarkerModel(stop, index, fullArray) {
      var matchingCharacter = $filter('filter')(qmData.characters, {key: stop.character})[0];
      var coords = (stop.town=="") ? {latitude:parseFloat(stop.latitude), longitude:parseFloat(stop.longitude)} : $filter('filter')(qmData.towns, {key: stop.town})[0].coords;

      var firstChapter = getChapterId(stop.firstChapter);
      var lastChapter = (firstChapter==-1) ? -1 : 999;
      var firstEpisode = getEpisodeId(stop.firstEpisode);
      var lastEpisode = (firstEpisode==-1) ? -1 : 999;
      for (var stopId=index+1; stopId<fullArray.length; stopId++) {
        if (lastChapter!=999 && lastEpisode!=999) break;
        if (fullArray[stopId].character != stop.character) break;
        if (lastChapter==999 && fullArray[stopId].firstChapter!="") lastChapter = getChapterId(fullArray[stopId].firstChapter)-1;
        if (lastEpisode==999 && fullArray[stopId].firstEpisode!="") lastEpisode = getEpisodeId(fullArray[stopId].firstEpisode)-1;
      }

      var iconUrl = matchingCharacter.pin;
      if (stop.isLost=="TRUE") iconUrl = iconUrl.replace(/letter\&chld\=\w/, "icon&chld=glyphish_squiggle");
      if (stop.isDead=="TRUE") iconUrl = iconUrl.replace(/letter\&chld\=\w/, "icon&chld=glyphish_skull");

      return {
        key: "stop-" + index,
        character: {
          key: matchingCharacter.key,
          name: matchingCharacter.name,
          url:  "http://awoiaf.westeros.org/index.php/" + matchingCharacter.key,
          houseImg: matchingCharacter.house.img
        },
        episode: qmData.episodes[firstEpisode],
        chapter: qmData.chapters[firstChapter],
        town: {
          name: (stop.town=="") ? stop.clue : decodeURI(stop.town).replace(/_/g," "),
          url:  (stop.town=="") ? "#" : "http://awoiaf.westeros.org/index.php/" + stop.town
        },
        timing: {
          episodes: [firstEpisode, lastEpisode],
          chapters: [firstChapter, lastChapter]
        },
        coords: coords,
        options: {
          icon: { url: iconUrl }
        }
      };
    }

    function characterPathModel(path, index) {
      var reMatch = /([\w\_]+)\-\d+/.exec(path.key);
      var matchingCharacter = $filter('filter')(qmData.characters, {key: reMatch[1]})[0];
      var firstChapter = getChapterId(path.firstChapter);
      var firstEpisode = getEpisodeId(path.firstEpisode);
      var waypoints = qmData.waypointArrays[path.key].map(waypointModel);
      var icons = [];
      if (path.arrows=="TRUE") icons.push({
          icon: { path: 2 }, //google.maps.SymbolPath.BACKWARD_OPEN_ARROW
          offset: '25px',
          repeat: '100px'
      });

      return {
          key: "path-" + index,
          character: { key: matchingCharacter.key },
          path: waypoints,
          stroke: {
              color: matchingCharacter.color,
              weight: 3
          },
          static: true,
          icons: icons,
          timing: {
            episodes: [
              firstEpisode,
              (firstEpisode==-1) ? -1 : 999
            ],
            chapters: [
              firstChapter,
              (firstChapter==-1) ? -1 : 999
            ]
          }
      };
    }

    function waypointModel(waypoint) {
      if (waypoint.location=="") return {latitude: parseFloat(waypoint.latitude), longitude: parseFloat(waypoint.longitude)};
      var matchingTown = $filter('filter')(qmData.towns, {key: waypoint.location})[0];
      return matchingTown.coords;
    }



    function getChapterId(chapterKey) {
      //AGOT-2 to 2
      if (chapterKey=="") return -1;
      var reMatch = /(\w{4})\-(\d+)/.exec(chapterKey);
      var precedingChapters = parseInt(qmData.bookLookup[ reMatch[1] ].precedingChapters, 10)
      return precedingChapters + parseInt(reMatch[2], 10);
    }

  }








  function getFile(filename) {
    return $http
      .get(csvLocation + filename)
      .then(getDataAttr)
      .then(fCsv.toJson)
      // .then(function(json){
      //   // Remove \" characters from strings
      // })
      .then(angular.fromJson)
  }

  function getDataAttr(resp) {
    return resp.data;
  }

  function getEpisodeId(episodeKey) {
    //S1E01 to 0
    if (episodeKey=="") return -1;
    var reMatch = /S(\d)E(\d\d)/.exec(episodeKey);
    return 10*(parseInt(reMatch[1], 10)-1) + parseInt(reMatch[2], 10)-1;
  }


})

.filter('qmSlider', function() {

  // In the return function, we must pass in a single parameter which will be the data we will work on.
  // We have the ability to support multiple other parameters that can be passed into the filter optionally
  return function(inputArray, slider, options) {

    var outputArray = [];
    var currentValue = (slider.show=="episodes") ? slider.currentEpisode : slider.currentChapter;

    for (var i=0; i<inputArray.length; i++) {
      if (currentValue < inputArray[i].timing[slider.show][0]) continue;
      if (currentValue > inputArray[i].timing[slider.show][1]) continue;
      if (typeof options !== "undefined" && typeof inputArray[i].character.key !== "undefined") {
        if (!options.characters[ inputArray[i].character.key ]) continue;
      }
      outputArray.push(inputArray[i]);
    }

    return outputArray;

  }

})

.directive('qmList', function ($window) {
  return {
    restrict: 'A',
    link: function (scope, elem, attrs) {
      // console.log(elem, attrs);
      var winHeight = $window.innerHeight;
      // var listHeight = attrs.qmList ? 41*parseInt(attrs.qmList, 10) : 0;
      // console.log(winHeight, attrs.qmList, listHeight);
      // if (listHeight>winHeight) elem.css('height', winHeight - 48 + 'px');
      elem.css('height', winHeight - 50 + 'px');
    }
  };
});
