angular.module('quartermaester')

.controller("mapCtrl", function($scope, $filter, $timeout, uiGmapGoogleMapApi, smgMapType, qmCsv) {

    var qmData = {};
    $scope.state = "slider";
    $scope.search = "";
    $scope.slider = {
      show: "episodes",
      currentEpisode: 0,
      currentChapter: 0
    };
    $scope.options = {
      characterPaths: true,
      houseHeraldry: false,
      geographicRegions: false,
      politicalAllegiances: false,
      characters: {}
    };
    $scope.map = {
      center: {
        latitude: 1.3182,
        longitude: -105.9960
      },
      zoom: 4,
      options: {
        maxZoom: 5,
        minZoom: 1,
        disableDefaultUI: true,
        zoomControl: true
      },
      events: {
        click: mapClick
      },
      control: {},
      smgMapType: smgMapType,
      locationClick: locationClick,
      heraldryClick: heraldryClick,
      characterClick: characterClick,
      loyaltyRangeClick: loyaltyRangeClick
    };
    $scope.mapModels = {
      towns: [],
      heraldry: [],
      characters: [],
      paths: [],
      regions: [],
      politicalAllegiances: [],
      editableLoyaltyRanges: []
    };
    $scope.episodes = [];
    $scope.chapters = [];
    $scope.searchResults = [];
    $scope.clickHistory = [];
    $scope.toState = toState;
    $scope.slideTo = slideTo;
    $scope.panTo = panTo;
    $scope.resultClick = resultClick;
    $scope.refreshMap = refreshMap;
    $scope.locationDetail = null;
    $scope.lastClick = null;

    // Set up promises
    uiGmapGoogleMapApi.then(onMapLoad);
    qmCsv.loadData().then(addToScope);


//////////////////

    function addToScope(d) {
      qmData = d;

      for (var i=0;i<qmData.loyaltyRanges.length; i++) {
        qmData.loyaltyRanges[i].events = {
          click: loyaltyRangeClick
        };
      }

      // Add data from CSV files into $scope
      $scope.episodes = qmData.episodes;
      $scope.chapters = qmData.chapters;
      $scope.characters = qmData.characters;
      $scope.searchResults = qmData.searchResults;
      $scope.mapModels.regions = qmData.regions;

      $scope.$watch('slider',  refreshMap, true);
      $scope.$watch('options', refreshMap, true);
      $scope.$watch('options.characters', panToCharacter, true);

      for (var i=0;i<qmData.characters.length; i++) {
        $scope.options.characters[qmData.characters[i].key] = false;
      }

      return true;
    }

    function refreshMap() {
      // Redraw map with new slider values
      $scope.mapModels.towns = $filter('qmSlider')(qmData.towns, $scope.slider);
      $scope.mapModels.heraldry = $scope.options.houseHeraldry ? $filter('qmSlider')(qmData.heraldry, $scope.slider) : [];
      $scope.mapModels.characters = $filter('qmSlider')(qmData.characterMarkers, $scope.slider, $scope.options);
      $scope.belligerents = $filter('qmSlider')(qmData.belligerents, $scope.slider);
      var staticPaths = $filter('qmSlider')(qmData.characterPaths, $scope.slider, $scope.options);
      $scope.mapModels.paths = angular.copy(staticPaths);
      $scope.mapModels.editablePaths = angular.copy(staticPaths).map(function(path) {
        path.static   = false;
        path.editable = true;
        return path;
      });

      $scope.mapModels.loyaltyRanges = $filter('qmSlider')(qmData.loyaltyRanges, $scope.slider);
      $scope.mapModels.editableLoyaltyRanges = angular.copy($scope.mapModels.loyaltyRanges).map(function(polygon) {
        polygon.static   = false;
        polygon.editable = true;
        return polygon;
      });
    }

    function panToCharacter(newValue, oldValue) {
      for (var character in newValue) {
        if (newValue[character] && !oldValue[character]) {
          var characterMarkers = $filter('filter')($scope.mapModels.characters, {character: {key: character}});
          if (characterMarkers.length==0) return false;

          var coords = characterMarkers[characterMarkers.length-1].coords
          $scope.map.control.getGMap().panTo({lat: coords.latitude, lng: coords.longitude});
          return true;
        }
      }
    }

    function toState(stateName) {
      $scope.state = stateName;
      if (stateName=="search") $timeout(function() {
        document.getElementById("searchInput").focus();
      });
      if (stateName=="edit") refreshMap();
      // if (stateName=="slider-full") $timeout(function() {
      //   console.log(document.getElementById("slide-"+$scope.slider.show).getElementsByClassName("rz-pointer"));
      //   document.getElementById("slide-"+$scope.slider.show).getElementsByClassName("rz-pointer")[0].focus();
      // });
    }

    function slideTo(input) {
      var books = qmData.books.map(function(book) {return book.abbreviation;});
      var measure = ($scope.slider.show=="episodes") ? "currentEpisode" : "currentChapter";
      var sliderMax   = ($scope.slider.show=="episodes") ? $scope.episodes.length-1 : $scope.chapters.length-1;
      switch (input) {
        case -10:
          if ($scope.slider[measure]==0) break;
          if ($scope.slider.show=="episodes") $scope.slider[measure] = Math.floor(($scope.slider[measure]-1)/10)*10;
          else {
            for (var bookId=4; bookId>=0; bookId--) {
              var prologue = parseInt(qmData.books[bookId].precedingChapters, 10);
              if (prologue > $scope.slider[measure]-1) continue;
              $scope.slider[measure] = prologue;
              break;
            }
          }
          break;
        case -1:
          if ($scope.slider[measure]>0) $scope.slider[measure]--;
          break;
        case 1:
          if ($scope.slider[measure]<sliderMax) $scope.slider[measure]++;
          break;
        case 10:
          if ($scope.slider[measure]==sliderMax) break;
          if ($scope.slider.show=="episodes") $scope.slider[measure] = Math.min(sliderMax, Math.ceil(($scope.slider[measure]+2)/10)*10-1);
          else {
            if ($scope.slider[measure] >= 270) {
              $scope.slider[measure] = 344;
              break;
            }
            for (var bookId=0; bookId<=4; bookId++) {
              var epilogue = parseInt(qmData.books[bookId].precedingChapters, 10)-1;
              if (epilogue < $scope.slider[measure]+1) continue;
              $scope.slider[measure] = epilogue;
              break;
            }
          }
          break;
        default:
          $scope.state = "slider";
          if (input.indexOf("-")<0) {
            // HBO show
            $scope.slider.show = "episodes";
            $scope.slider.currentEpisode = qmCsv.getEpisodeId(input);
            // var reMatch = /S(\d)E0?(\d+)/.exec(input);
            // $scope.slider.currentEpisode = 10*(parseInt(reMatch[1])-1) + parseInt(reMatch[2])-1;
          } else {
            $scope.slider.show = "chapters";
            // $scope.slider.currentChapter = qmCsv.getChapterId(input);
            var reMatch = /(\w{4})\-(\d+)/.exec(input);
            var bookId = books.indexOf(reMatch[1]);
            $scope.slider.currentChapter = parseInt(qmData.books[bookId].precedingChapters, 10) + parseInt(reMatch[2], 10);
          }
          break;
      }
      $scope.$broadcast('rzSliderForceRender');
    }

    function panTo(input) {
      var location = $filter('filter')($scope.map.locations, {key: input})[0];
      $scope.map.control.getGMap().panTo({lat: location.coords.latitude, lng: location.coords.longitude});
      $scope.locationDetail = location;
      $scope.state = "location";
    }

    function resultClick(model) {
      switch (model.icon) {
        case "glyphicon-map-marker":
          var town = $filter('filter')($scope.mapModels.towns, {key: model.key})[0];
          $scope.map.control.getGMap().panTo({lat: town.coords.latitude, lng: town.coords.longitude});
          $scope.locationDetail = town;
          $scope.state = "location";
          break;

        case "glyphicon-user":
          $scope.options.characters[model.key] = true;
          var character = $filter('filter')($scope.characters, {key: model.key})[0];
          var allCharacterMarkers = $filter('qmSlider')(qmData.characterMarkers, $scope.slider, $scope.options);
          var matchedCharacterMarkers = $filter('filter')(allCharacterMarkers, {character: {key: model.key}});
          $scope.locationDetail = {
            name: "",
            url: "",
            house: character.name,
            houseImg: character.house.img,
            houseUrl: character.url,
            direct: "#"
          };
          $scope.state = "location";
          if (matchedCharacterMarkers.length==0) break;
          var thisCharacterMarker = matchedCharacterMarkers[0];
          $scope.map.control.getGMap().panTo({lat: thisCharacterMarker.coords.latitude, lng: thisCharacterMarker.coords.longitude});
          $scope.locationDetail.name = thisCharacterMarker.town.name;
          $scope.locationDetail.url  = thisCharacterMarker.town.url;
          $scope.locationDetail.direct = ($scope.slider.show=="episodes") ? thisCharacterMarker.episode.url : thisCharacterMarker.chapter.url;
          break;

        case "glyphicon-home":
          var house = $filter('filter')(qmData.heraldry, {seat: model.subtitle})[0];
          $scope.map.control.getGMap().panTo({lat: house.coords.latitude, lng: house.coords.longitude});
          $scope.locationDetail = {
            name: house.seat,
            url: house.seatUrl,
            house: house.name,
            houseImg: house.houseImg,
            houseUrl: house.url,
            direct: house.direct
          };
          $scope.state = "location";
          break;

        case "glyphicon-facetime-video":
        case "glyphicon-book":
          slideTo(model.abbr);
          break;

        default:
          console.log("resultClick", model);
      }
    }

    function locationClick(marker, eventName, model) {
      $scope.locationDetail = model;
      $scope.state = "location";
    }

    function heraldryClick(marker, eventName, model) {
      $scope.locationDetail = {
        name: model.seat,
        url: model.seatUrl,
        house: model.name,
        houseImg: model.houseImg,
        houseUrl: model.url,
        direct: model.direct
      };
      $scope.state = "location";
    }

    function characterClick(marker, eventName, model) {
      $scope.locationDetail = {
        name: model.town.name,
        url: model.town.url,
        house: model.character.name,
        houseImg: model.character.houseImg,
        houseUrl: model.character.url,
        direct: ($scope.slider.show=="episodes") ? model.episode.url : model.chapter.url
      };
      $scope.state = "location";
    }

    function loyaltyRangeClick(e, eventName, model) {
      var keyMatch = /(.+)\-\d+\w?$/.exec(model.key);
      var matchingBelligerant = $filter('filter')(qmData.belligerents, {key: keyMatch[1]})[0];
      var filtered = $filter('filter')(qmData.belligerents, {key: keyMatch[1]});

      $scope.locationDetail = {
        house: matchingBelligerant.title + " " + matchingBelligerant.name,
        houseImg: matchingBelligerant.houseImg,
        houseUrl: matchingBelligerant.url
      };
      $scope.state = "location";
    }

    function mapClick(a, b, c, d) {
      $scope.state = "slider";
      //console.log(a, b, c, d);
      //console.log("lng", c[0].latLng.lng());
      //$scope.lastClick = JSON;
      //console.log($scope.mapModels.paths);
      addClickToEditor(c[0].latLng.lat(), c[0].latLng.lng())
    }

    function addClickToEditor(latitude, longitude) {
      $scope.clickHistory.push({
        latitude: latitude,
        longitude: longitude
      });
    }

    function onMapLoad(maps) {

      // Add background to .rz-bar
      var rzbars = document.getElementsByClassName("rz-bar");
      rzbars[0].innerHTML = "<span class='odd'>1</span><span>2</span><span class='odd'>3</span><span>4</span><span class='odd'>5</span><span>6</span>";
      rzbars[2].innerHTML = "<span class='odd'>AGOT</span><span>ACOK</span><span class='odd'>ASOS</span><span>AFFC</span><span class='odd'>ADWD</span>";

    }

});
