"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable max-len */
// the unit element in the tag map
var Tag = function () {
  function Tag(label) {
    _classCallCheck(this, Tag);

    this.label = label;
    this.coords = [];
    // center of coords
    this.center = [0, 0];
    this.weight = 0;

    // size of bounding box
    this.width = 0;
    this.height = 0;
  }

  // loc: screen coords [x, y]


  _createClass(Tag, [{
    key: "add",
    value: function add(loc, weight) {
      var coords = this.coords,
          center = this.center;

      coords.push(loc);

      var len = coords.length;
      // update center
      center[0] = (center[0] * (len - 1) + loc[0]) / len;
      center[1] = (center[1] * (len - 1) + loc[1]) / len;
      // update weight
      this.weight += weight;
    }
  }, {
    key: "setCenter",
    value: function setCenter(pt) {
      // force set center in the overlap removal loop
      this.center = pt;
    }
  }, {
    key: "setSize",
    value: function setSize(width, height) {
      this.width = width;
      this.height = height;
    }
  }, {
    key: "dist",
    value: function dist(loc) {
      return Math.sqrt(Math.pow(this.center[0] - loc[0], 2) + Math.pow(this.center[1] - loc[1], 2));
    }
  }, {
    key: "overlap",
    value: function overlap(tag) {
      return Math.abs(tag.center[0] - this.center[0]) <= (tag.width + this.width) * 0.5 && Math.abs(tag.center[1] - this.center[1]) <= (tag.height + this.height) * 0.5;
    }
  }]);

  return Tag;
}();

exports.default = Tag;