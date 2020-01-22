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
  };

  App.prototype.loadLocalData = function(){

  };

  App.prototype.onLocationSubmit = function(){
    this.loadingOn();

    var params = {
      "q": $("location").val(),
      "format": "json"
    };

    var city = this.$locationForm.find(".city").first().val();
    if (city.length) params.city = city;

    var state = this.$locationForm.find(".state").first().val();
    if (state.length) params.state = state;

    var country = this.$locationForm.find(".country").first().val();
    if (country.length) params.country = country;

    // https://nominatim.org/release-docs/develop/api/Search/
    var queryString = $.param(params);
    var url = "https://nominatim.openstreetmap.org/search?" + queryString;
    console.log("Looking up " + url);

    $.getJSON(url, function(data) {
      if (!data.length) {
        alert('No matches found for ' + params.q);
        return false;
      }

      console.log(data);
    });
  };

  App.prototype.onDataLoaded = function(dataResult, tagsResult){
    this.loadingOff();
    this.$dataForm.removeClass("active");
  };

  App.prototype.onDataSubmit = function(){
    var _this = this;
    this.loadingOn(true);

    var dataPromise = loadCsv($("#data-file"));
    var tagsPromise = loadCsv($("#tags-file"));

    $.when(dataPromise, tagsPromise).done(function(dataResult, tagsResult) {
      // console.log(dataResult);
      // console.log(tagsResult);
      _this.onDataLoaded(dataResult, tagsResult);
    });

  };

  return App;

})();

$(function() {
  var app = new App({});
});
