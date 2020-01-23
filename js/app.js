'use strict';

var App = (function() {

  function App(config) {
    var defaults = {};
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  function loadCsv($input) {
    var d = $.Deferred();

    if (!$input.val().length) {
      d.resolve(false);

    } else {
      var file = $input.prop("files")[0];
      Papa.parse(file, {
        header: true,
        complete: function(results) {
          d.resolve(results);
        }
      });
    }

    return d;
  }

  App.prototype.init = function(){
    this.loading = false;
    this.$loading = $(".loading");
    this.$submits = $("input[type=\"submit\"]");
    this.$locationForm = $("#location-form");
    this.$dataForm = $("#data-form");

    this.loadMap();

    this.loadLocalData();
    this.loadListeners();
  };

  App.prototype.loadingOff = function(){
    this.loading = false;
    this.$loading.removeClass("active");
    this.$submits.prop("disabled", false);
  };

  App.prototype.loadingOn = function(withOverlay){
    this.loading = true;
    if (withOverlay===true) this.$loading.addClass("active");
    this.$submits.prop("disabled", true);
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    this.$locationForm.on("submit", function(e){
      e.preventDefault();
      if (_this.loading) return;
      _this.onLocationSubmit();
    });

    this.$dataForm.on("submit", function(e){
      e.preventDefault();
      if (_this.loading) return;
      _this.onDataSubmit();
    });

    $('.submit-and-continue').on("click", function(){
      _this.submitCurrentLocation();
      _this.loadNext();
    });
  };

  App.prototype.loadLocalData = function(){

  };

  App.prototype.loadMap = function(){
    this.map = L.map('map').setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(this.map);
  };

  App.prototype.loadNext = function(){
    var _this = this;
    this.dataIndex++;

    if (this.dataIndex >= this.data.length) {
      alert("You are done!");
      return;
    }

    var item = this.data[this.dataIndex];
    var fields = ["geoname","city","state","country"];

    _.each(fields, function(field){
      var value = _.has(item, field) ? item[field] : "";
      _this.$locationForm.find("#" + field).val(value);
    });

    this.latitude = false;
    this.longitude = false;
    if (_.has(item, "latitude") && _.has(item, "longitude") && item["latitude"].length && item["longitude"].length) {
      this.latitude = parseFloat(item["latitude"]);
      this.longitude = parseFloat(item["longitude"]);
    }

    this.$locationForm.submit();
  };

  App.prototype.onLocationSubmit = function(){
    var _this = this;
    this.loadingOn();

    var fields = ["geoname", "city", "state", "country"];
    var values = [];
    _.each(fields, function(field){
      var value = _this.$locationForm.find("#" + field).val();
      if (value.length) values.push(value);
    });

    var params = {
      "format": "json",
      "q": values.join(", ")
    };
    // https://nominatim.org/release-docs/develop/api/Search/
    var queryString = $.param(params);
    var url = "https://nominatim.openstreetmap.org/search?" + queryString;
    console.log("Looking up " + url);

    $.getJSON(url, function(data) {
      _this.loadingOff();
      if (!data.length) {
        this.foundLocation = false;
        alert('No matches found for ' + params.q + '. Please find it manually on the map.');

      } else {
        this.foundLocation = data[0];
        _this.latitude = parseFloat(data[0]["lat"]);
        _this.longitude = parseFloat(data[0]["lon"]);
      }

      _this.onLocationLookup();
    });
  };

  App.prototype.onDataLoaded = function(dataResult, tagsResult){
    this.loadingOff();
    this.$dataForm.removeClass("active");

    console.log("Loaded " + dataResult.data.length + " data points");

    this.data = dataResult.data;
    this.dataIndex = -1;
    this.loadNext();

    if (tagsResult !== false) {
      console.log("Loaded " + tagsResult.data.length + " tags");
    }
  };

  App.prototype.onDataSubmit = function(){
    var _this = this;
    this.loadingOn(true);

    var dataPromise = loadCsv($("#data-file"));
    var tagsPromise = loadCsv($("#tags-file"));

    $.when(dataPromise, tagsPromise).done(function(dataResult, tagsResult) {
      _this.onDataLoaded(dataResult, tagsResult);
    });

  };

  App.prototype.onLocationLookup = function(){
    if (this.latitude === false || this.longitude === false) {
      this.map.setView([0, 0], 2);
    } else {
      this.map.setView([this.latitude, this.longitude], 9);
    }

  };

  App.prototype.submitCurrentLocation = function(){};

  return App;

})();

$(function() {
  var app = new App({});
});
