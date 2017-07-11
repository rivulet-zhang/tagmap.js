# tagmap.js
An occlusion-free label layout on the map or other 2D spaces. Implemented in JavaScript.

### About
TagMap is a visualization to expose textual topics that are tied to different locations on the map. TagMap has some parallels with [tag cloud](https://en.wikipedia.org/wiki/Tag_cloud), e.g., the size/color of tags are weighted by the tag's volume or other properties. However, the layout of tags in TagMap is more constrained by their spatial locations.

This library supports generating tagMaps in either the geographic space or the general 2D space, and also allows transforming from one space to another by specifying a `project` function.
See the [API](###API) section for more details.

### Installing

```
npm install tagmap.js
```

### Example

```javascript
import TagMap from 'tagmap.js';

// data format, position can either be [lon, lat] or [x, y].
const data = [
  {label: '#nyc', position: [0, 0], weight: 1},
  ....
];

const tagMap = new TagMap();

// group points of the same label and build data hierarchy
// this function is called only one time if the data do not change.
tagMap.buildHierarchy(data);

// extract tag clusters at a certain *scale*
const weightThreshold = 1;
const maxDist = 20;
tagMap.extractCluster({weightThreshold, maxDist});

// a sample size measure that returns the size of a label
const sizeMeasurer = (label, fontSize) => ({
  width: fontSize * 0.6 * label.length,
  height: fontSize
});

const maxFontSize = 30;
const minFontSize = 10;
// the actual overlap removal algorithm
const tags = tagMap.layout({maxFontSize, minFontSize, sizeMeasurer});
```

The returned `tags` contains a list of `tag`. Each `tag` contains the following attributes:

* `label`: label text.
* `center`: the center coordinate of the label's bounding box.
* `width`: the width of the label's bounding box.
* `height`: the height of the label's bounding box.

### API




### License

This project is licensed under the MIT License.
