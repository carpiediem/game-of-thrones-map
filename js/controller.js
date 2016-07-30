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
      characters: []
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
      characterClick: heraldryClick
    };
    $scope.mapModels = {
      towns: [],
      heraldry: [],
      characters: [],
      paths: [],
      regions: [],
      loyalties: []
    };
    $scope.episodes = [];
    $scope.chapters = [];
    $scope.searchResults = [];
    $scope.toState = toState;
    $scope.slideTo = slideTo;
    $scope.panTo = panTo;
    $scope.refreshMap = refreshMap;
    $scope.locationDetail = null;

    // Set up promises
    uiGmapGoogleMapApi.then(onMapLoad);
    qmCsv.loadData().then(addToScope);


//////////////////

    function addToScope(d) {
      qmData = d;

      // Add data from CSV files into $scope
      $scope.episodes = qmData.episodes;
      $scope.chapters = qmData.chapters;
      $scope.characters = qmData.characters;
      $scope.searchResults = qmData.searchResults;
      $scope.mapModels.regions = qmData.regions;

      $scope.$watch('slider',  refreshMap, true);
      $scope.$watch('options', refreshMap, true);

      return true;
    }

    function refreshMap() {
      // Redraw map with new slider values
      $scope.mapModels.towns = $filter('qmSlider')(qmData.towns, $scope.slider);
      $scope.mapModels.heraldry = $scope.options.houseHeraldry ? $filter('qmSlider')(qmData.heraldry, $scope.slider) : [];
      $scope.mapModels.characters = $filter('qmSlider')(qmData.characterMarkers, $scope.slider); //$filter('qmCharacters')(qmData.characterMarkers, $scope.options.characters, $scope.slider);
      $scope.mapModels.paths = qmData.characterPaths;
      console.log("qmData.characterPaths", qmData.characterPaths);


    }

    function toState(stateName) {
      $scope.state = stateName;
      if (stateName=="search")
        $timeout(function() {
          document.getElementById("searchInput").focus();
        });
    }

    function slideTo(input) {
      var books = qmData.books.map(function(book) {return book.abbreviation;});
      var measure = ($scope.slider.show=="episodes") ? "currentEpisode" : "currentChapter";
      var sliderMax   = ($scope.slider.show=="episodes") ? $scope.episodes.length-1 : $scope.chapters.length-1;
      switch (input) {
        case -10:
          $scope.slider[measure] = 0;
          break;
        case -1:
          if ($scope.slider[measure]>0) $scope.slider[measure]--;
          break;
        case 1:
          if ($scope.slider[measure]<sliderMax) $scope.slider[measure]++;
          break;
        case 10:
          $scope.slider[measure] = sliderMax;
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
          $scope.slider.currentChapter = parseInt(qmData.books[bookId].precedingChapters, 10) + parseInt(reMatch[2], 10);
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

    function locationClick(marker, eventName, model) {
      $scope.locationDetail = model;
      $scope.state = "location";
    }

    function heraldryClick(marker, eventName, model) {
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
