/* eslint-disable max-len */
import {scaleLog} from 'd3-scale';
import Tag from './tag';
import rbush from 'rbush';
import ClusterTree from 'hdbscanjs';

export default class TagMap {
  constructor(distFunc = TagMap.distFunc.euclidean) {
    this.tagTree = {};
    this.tagList = [];
    this.distFunc = distFunc;
  }

  buildHierarchy(data, {getLabel = val => val.label, getPosition = val => val.position, getWeight = val => val.weight}) {
    // clear tree
    this.tagTree = {};
    // group tags based on the content
    data.forEach(val => {
      const label = getLabel(val);
      if (!this.tagTree.hasOwnProperty(label)) {
        this.tagTree[label] = [];
      }
      this.tagTree[label].push({data: getPosition(val), opt: getWeight(val)});
    });
    for (const key in this.tagTree) {
      const cluster = new ClusterTree(this.tagTree[key], this.distFunc);
      this.tagTree[key] = cluster.getTree();
    }
  }

  extractCluster({project = val => val, bbox = null, weightThreshold = 0, maxDist = TagMap.maxDist}) {
    // clear tagList
    this.tagList = [];
    for (const key in this.tagTree) {
      const tree = this.tagTree[key];
      const flagCluster = tree.filter(val => {
        // a cluster of a single point
        if (val.isLeaf) {
          return true;
        }
        // test the cluster does not split under the current zoom level
        const cp0 = project(val.edge[0]);
        const cp1 = project(val.edge[1]);
        return Math.sqrt(Math.pow((cp0[0] - cp1[0]), 2) + Math.pow((cp0[1] - cp1[1]), 2)) < maxDist;
      }, bbox);

      // generate tags which passed the test and weightThreshold
      const tags = flagCluster.map(val => {
        const tag = new Tag(key);
        val.data.forEach((p, i) => tag.add(p, val.opt[i]));
        tag.setCenter(project(tag.center));
        return tag;
      }).filter(val => val.weight >= weightThreshold);

      this.tagList = this.tagList.concat(tags);
    }
    return this.tagList;
  }

  _getScale(minWeight, maxWeight, minFontSize, maxFontSize) {
    if (minWeight === maxWeight) {
      return x => (minFontSize + maxFontSize) * 0.5;
    }
    // set log scale for label size
    return scaleLog().base(Math.E)
                      .domain([minWeight, maxWeight])
                      .range([minFontSize, maxFontSize]);
  }

  // center is two element array
  _rotate(center, angle, radius) {
    const radian = angle / 180.0 * Math.PI;
    const x = Math.cos(radian) * radius + center[0];
    const y = Math.sin(radian) * radius + center[1];
    return [x, y];
  }

  // forcely place tag without overlap removal
  _forcePlaceTag(placedTag, tree, tag) {
    placedTag.push(tag);
  }

  // a greedy circular layout method
  _placeTag(placedTag, tree, tag) {
    let angle = -90.0;
    const deltaAngle = 25;
    let radius = 0;
    const deltaRadius = 1.5;
    let iter = 0;
    const iterThreshold = 20;

    const center = tag.center.slice();
    while (iter <= iterThreshold) {
      // calculate the new candidate position
      const p = this._rotate(center, angle, radius);
      tag.setCenter(p);
      const bbox = {
        minX: p[0] - tag.width * 0.5,
        maxX: p[0] + tag.width * 0.5,
        minY: p[1] - tag.height * 0.5,
        maxY: p[1] + tag.height * 0.5
      };
      // if no collision, position the tag
      if (!tree.collides(bbox)) {
        placedTag.push(tag);
        tree.insert(bbox);
        break;
      }
      // increment angle and radius
      angle += deltaAngle;
      radius += deltaRadius;
      iter++;
    }
  }

  layout({minFontSize, maxFontSize, sizeMeasurer, isForce = false, maxNumOfTags = TagMap.maxNumOfTags}) {
    if (!this.tagList || this.tagList.length === 0) {
      return [];
    }
    // get tags in descending order
    const orderedTags = this.tagList.sort((a, b) => b.weight - a.weight);
    // get scale function to calculate size of label bounding box
    const minWeight = orderedTags[orderedTags.length - 1].weight;
    const maxWeight = orderedTags[0].weight;

    // calculate bounding box
    orderedTags.forEach(x => {
      const fontSize = this._getScale(minWeight, maxWeight, minFontSize, maxFontSize)(x.weight);
      const {width, height} = sizeMeasurer(x.label, fontSize);
      x.setSize(width, height);
    });

    // run actual layout algorithm
    const placedTag = [];
    const tree = rbush();
    for (const tag of orderedTags) {
      if (placedTag.length >= maxNumOfTags) {
        break;
      }
      if (isForce) {
        this._forcePlaceTag(placedTag, tree, tag);
      } else {
        this._placeTag(placedTag, tree, tag);
      }
    }
    return placedTag;
  }

  // screen-space aggregation threshold: invisible to the user
  static get maxDist() {
    return 20;
  }

  // max number of tags shown in the view: invisible to the user for now, might change to a user-defined paramater later
  static get maxNumOfTags() {
    return 100;
  }
}

TagMap.distFunc = {
  euclidean: ClusterTree.distFunc.euclidean,
  geoDist: ClusterTree.distFunc.geoDist
};
