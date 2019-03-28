import {
  cloneDeep as lodashCloneDeep,
  get as lodashGet,
  find as lodashFind,
  findIndex as lodashFindIndex,
  each as lodashEach
} from 'lodash';

import update from 'immutability-helper';
import util from '../../util/util';

export function getLayersParameterSetup(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  const initialState = lodashCloneDeep(models.layers.active);
  models.palettes.load(legacyState, errors);
  if (models.compare.active) {
    models.layers.activeB = lodashCloneDeep(initialState);
  }
  const layerModelLoaded = models.layers.load(legacyState, errors);

  return {
    l: getPermalinkManagementObject(
      initialState,
      'legacy.layers.active',
      () => {
        return layerModelLoaded.active ? layerModelLoaded.active : initialState;
      },
      (currentItemState, state) => {
        const isActive = lodashGet(models, 'compare.active');
        const isCompareA = lodashGet(models, 'compare.isCompareA');
        const layersB = lodashGet(models, 'layers.activeB');
        const layersA = lodashGet(models, 'layers.active');
        return !isActive && !isCompareA
          ? serializeLayers(layersB, models, 'activeB')
          : serializeLayers(layersA, models, 'active');
      }
    ),
    l1: getPermalinkManagementObject(
      initialState,
      'legacy.layers.activeB',
      () => {
        return layerModelLoaded.activeB;
      },
      (currentItemState, state) => {
        const isActive = lodashGet(models, 'compare.active');
        const layersB = lodashGet(models, 'layers.activeB');
        return isActive
          ? serializeLayers(layersB, models, 'activeB')
          : undefined;
      }
    )
  };
}
function serializeLayers(layers, models, groupStr) {
  return layers.map(def => {
    var item = {};

    if (def.id) {
      item = {
        id: def.id
      };
    }
    if (!item.attributes) {
      item.attributes = [];
    }
    if (!def.visible) {
      item.attributes.push({
        id: 'hidden'
      });
    }
    if (def.opacity < 1) {
      item.attributes.push({
        id: 'opacity',
        value: def.opacity
      });
    }
    let def1 =
      def.id && def.palette
        ? models.palettes.get(def.id, undefined, groupStr)
        : undefined;
    if (def1) {
      if (def1.custom) {
        item.attributes.push({
          id: 'palette',
          value: def1.custom
        });
      }
      if (def1.min) {
        var minValue = def1.entries.values[def1.min];
        item.attributes.push({
          id: 'min',
          value: minValue
        });
      }
      if (def1.max) {
        var maxValue = def1.entries.values[def1.max];
        item.attributes.push({
          id: 'max',
          value: maxValue
        });
      }
      if (def1.squash) {
        item.attributes.push({
          id: 'squash'
        });
      }
    }
    return util.appendAttributesForURL(item);
  });
}

function getPermalinkManagementObject(
  initialState,
  stateKey,
  parser,
  serialize
) {
  return {
    stateKey: stateKey,
    initialState: initialState,
    type: 'array',
    options: {
      delimiter: ',',
      serializeNeedsGlobalState: true,
      parse: parser,
      serialize: serialize
    }
  };
}

export function toggleVisibility(id, layers) {
  var index = lodashFindIndex(layers, {
    id: id
  });
  if (index === -1) {
    throw new Error('Invalid layer ID: ' + id);
  }
  var visibility = !layers[index].visible;

  return update(layers, { [index]: { visible: { $set: visibility } } });
}
export function removeLayer(id, layers) {
  var index = lodashFindIndex(layers, {
    id: id
  });
  if (index === -1) {
    throw new Error('Invalid layer ID: ' + id);
  }
  return update(layers, { $splice: [[index, 1]] });
}