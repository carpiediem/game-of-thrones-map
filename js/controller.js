angular.module('quartermaester')

.controller("mapCtrl", function($scope, $q, $filter, $timeout, uiGmapGoogleMapApi, smgMapType, qmCsv) {

    $scope.state = "slider";
    $scope.slider = {
      show: "episodes",
      currentEpisode: 0,
      currentChapter: 0
    };
    $scope.map = {
      center: {
        latitude: 1.3182,
        longitude: -105.9960
      },
      zoom: 4,
      options: {
        maxZoom: 5,
        minZoom: 1
      },
      events: {
        click: mapClick
      },
      control: {},
      locationClick: locationClick,
      locations: []
    };
    $scope.options = {
      characterPaths: true,
      houseHeraldry: false,
      geographicRegions: false,
      politicalAllegiances: false
    };
    $scope.search = "";
    $scope.smgMapType = smgMapType;
    $scope.toState = toState;
    $scope.slideTo = slideTo;
    $scope.panTo = panTo;
    $scope.episodes = [];
    $scope.chapters = [];
    $scope.searchResults = [
      {
        icon: "glyphicon-user",
        title: "Eddard Stark",
        subtitle: "House Stark",
        search: "Eddard Stark",
        click: function(){showCharacter("eddard")}
      }
    ];
    $scope.locationDetail = null;

    // Set up promises
    uiGmapGoogleMapApi.then(onMapLoad);
    $q.all([
      qmCsv.get('locations.csv'),
      qmCsv.get('houses.csv')
    ]).then(createLocationMarkers);
    $q.all([
      qmCsv.get('books.csv'),
      qmCsv.get('chapters.csv')
    ]).then(addChaptersToScope);
    qmCsv.get('episodes.csv').then(addEpisodesToScope);
    $q.all([
      qmCsv.get('characters.csv'),
      qmCsv.get('houses.csv')
    ]).then(addCharactersToScope);
    $q.all([
      qmCsv.get('regions.csv'),
      qmCsv.get('borders.csv')
    ]).then(addRegionsToScope);


    function toState(stateName) {
      $scope.state = stateName;
      if (stateName=="search")
        $timeout(function() {
          document.getElementById("searchInput").focus();
        });
    }

    function slideTo(input) {
      var books = $scope.books.map(function(book) {return book.abbreviation;});
      var sliderIndex = ($scope.slider.show=="episodes") ? "currentEpisode" : "currentChapter";
      var sliderMax   = ($scope.slider.show=="episodes") ? $scope.episodes.length-1 : $scope.chapters.length-1;
      switch (input) {
        case -10:
          $scope.slider[sliderIndex] = 0;
          break;
        case -1:
          if ($scope.slider[sliderIndex]>0) $scope.slider[sliderIndex]--;
          break;
        case 1:
          if ($scope.slider[sliderIndex]<sliderMax) $scope.slider[sliderIndex]++;
          break;
        case 10:
          $scope.slider[sliderIndex] = sliderMax;
          break;
        default:
          $scope.state = "slider";
          if (input.indexOf("-")<0) {
            // HBO show
            $scope.slider.show = "episodes";
            var reMatch = /S(\d)E0?(\d+)/.exec(input);
            $scope.slider.currentEpisode = 10*(parseInt(reMatch[1])-1) + parseInt(reMatch[2])-1;
            break;
          }
          $scope.slider.show = "chapters";
          var reMatch = /(\w{4})\-(\d+)/.exec(input);
          var bookId = books.indexOf(reMatch[1]);
          $scope.slider.currentChapter = parseInt($scope.books[bookId].precedingChapters, 10) + parseInt(reMatch[2], 10);
          break;
      }

    }

    function panTo(input) {

      console.log("panTo", input);
      var location = $filter('filter')($scope.map.locations, {key: input})[0];
      $scope.map.control.getGMap().panTo({lat: location.coords.latitude, lng: location.coords.longitude});
      $scope.locationDetail = location;
      $scope.state = "location";
    }

    function addEpisodesToScope(response) {
      $scope.episodes = response.map(function(episode) {
        var epNumber = (episode.episode.length==2) ? episode.episode : "0"+episode.episode;
        return {
          name: "S" + episode.season + "E" + epNumber + ": " + episode.title,
          url: (episode.awoiaf=="") ? "https://en.wikipedia.org/wiki/"+episode.wikipedia : "http://awoiaf.westeros.org/index.php/"+episode.awoiaf
        };
      });
      //console.log("e", $scope.episodes);

      $scope.searchResults = $scope.searchResults.concat(response.map(function(episode) {
        var epNumber = (episode.episode.length==2) ? episode.episode : "0"+episode.episode;
        return {
          icon: "glyphicon-facetime-video",
          title: episode.title,
          subtitle: "HBO episode",
          search: episode.title,
          abbr: "S" + episode.season + "E" + epNumber + ": " + episode.title,
          click: function(){slideTo(this.abbr)}
        };
      }));
    }

    function addChaptersToScope(response) {
      $scope.books = response[0];
      $scope.chapters = response[1].map(function(chapter) {
        return {
          name: response[0][chapter.book].abbreviation + "-" + chapter.chapter + ": " + chapter.title,
          url: "http://awoiaf.westeros.org/index.php/"+chapter.awoiaf
        };
      });
      //console.log("c", $scope.chapters);

      $scope.searchResults = $scope.searchResults.concat(response[1].map(function(chapter) {
        return {
          icon: "glyphicon-book",
          title: chapter.title,
          subtitle: response[0][chapter.book].title,
          search: chapter.title,
          abbr: response[0][chapter.book].abbreviation + "-" + chapter.chapter,
          click: function(){slideTo(this.abbr)}
        };
      }));
    }

    function addCharactersToScope(responses) {
      $scope.characters = responses[0].map(function(character) {
        var output = {
          name: character.name,
          url: "http://awoiaf.westeros.org/index.php/" + character.awoiaf,
          house: ""
        }
        if (character.house!="") {
          matchingHouse = $filter('filter')(responses[1], {wikiKey: character.house})[0];
          output.house = {
            name: decodeURI(matchingHouse.wikiKey).replace(/_/g," "),
            url: "http://awoiaf.westeros.org/index.php/" + matchingHouse.wikiKey,
            img: matchingHouse.img
          }
        }
        return output;
      });
    }

    function addRegionsToScope(responses) {
      // console.log("regions", responses[0]);
      // console.log("borders", responses[1]);

      var borderArrays = {};
      for (var i=0; i<responses[1].length; i++) {
        if (!(responses[1][i].name in borderArrays)) borderArrays[responses[1][i].name] = [];
        borderArrays[responses[1][i].name].push(responses[1][i]);
      }

      $scope.map.regions = responses[0].map(function(region) {
        return {
          key: region.name,
          fill: {
            color: region.color,
            opacity: 0.5
          },
          stroke: {
            weight: 0
          },
          path: borderArrays[region.name]
        };
      });
    }

    function createLocationMarkers(responses) {
      $scope.houses = responses[1];
      $scope.map.locations = qmCsv.setHomes(responses[0], responses[1]);
      //console.log("locations", $scope.map.locations);

      $scope.searchResults = $scope.searchResults.concat($scope.map.locations.map(function(location) {
        return {
          icon: "glyphicon-map-marker",
          key: location.key,
          title: location.name,
          subtitle: (location.occupants.length) ? location.occupants[0].name : "",
          search: (location.occupants.length) ? location.name + " " + location.occupants[0].name : location.name,
          click: function(){panTo(this.key)}
        };
      }));
    }

    function locationClick(marker, eventName, model) {
      model.currentOccupant = qmCsv.getCurrentOccupant(model);
      $scope.locationDetail = model;
      $scope.state = "location";
    }

    function mapClick() {
      $scope.state = "slider";
    }

    function onMapLoad(maps) {

      // Add background to .rz-bar
      var rzbars = document.getElementsByClassName("rz-bar");
      rzbars[0].innerHTML = "<span class='odd'>1</span><span>2</span><span class='odd'>3</span><span>4</span><span class='odd'>5</span><span>6</span>";
      rzbars[2].innerHTML = "<span class='odd'>AGOT</span><span>ACOK</span><span class='odd'>ASOS</span><span>AFFC</span><span class='odd'>ADWD</span>";

    }

});
