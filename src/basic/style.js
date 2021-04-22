import Style from './../style/style';
import {create as createSource} from './../source/source';
import BasicSourceCache from './source_cache';
import {validateStyle, emitValidationErrors as _emitValidationErrors} from './../style/validate_style';
import {Placement} from './../symbol/placement';

class BasicStyle extends Style {
  constructor(style, map){
    super(map, { localIdeographFontFamily: 'sans-serif'});
    this.loadedPromise = new Promise(res => this.on('data', e => e.dataType === "style" && res()));
    if (typeof style === 'string') {
        this.loadURL(style);
    } else {
        this.loadJSON(style);
    }
  }

  addSource(id, source, options) {
    this._checkLoaded();

    if (this.getSource(id) !== undefined) {
        throw new Error('There is already a source with this ID');
    }

    if (!source.type) {
        throw new Error(`The type property must be defined, but only the following properties were given: ${Object.keys(source).join(', ')}.`);
    }

    const builtIns = ['vector', 'raster', 'geojson', 'video', 'image'];
    const shouldValidate = builtIns.indexOf(source.type) >= 0;
    if (shouldValidate && this._validate(validateStyle.source, `sources.${id}`, source, null, options)) return;

    //if (this.map && this.map._collectResourceTiming) (source: any).collectResourceTiming = true;

    const sourceInstance = createSource(id, source, this.dispatcher, this);

    sourceInstance.setEventedParent(this, () => ({
        isSourceLoaded: this.loaded(),
        source: sourceInstance.serialize(),
        sourceId: id
    }));

    const addSourceCache = (onlySymbols) => {
        const sourceCacheId = (onlySymbols ? 'symbol:' : 'other:') + id;
        const sourceCache = this._sourceCaches[sourceCacheId] = new BasicSourceCache(sourceCacheId, sourceInstance, onlySymbols);
        (onlySymbols ? this._symbolSourceCaches : this._otherSourceCaches)[id] = sourceCache;
        sourceCache.style = this;

        sourceCache.onAdd(this.map);
    };

    addSourceCache(false);
    if (source.type === 'vector' || source.type === 'geojson') {
        addSourceCache(true);
    }

    if (sourceInstance.onAdd) sourceInstance.onAdd(this.map);

    this._changed = true;
  }

  // setLayers, and all other methods on the super, e.g. setPaintProperty, should be called
  // via loadedPromise.then, not synchrounsouly

  setLayers(visibleLayerNames){
    // Note this is not part of mapbox style, but handy to put it here for use with pending-style
    return Object.keys(this._layers)
      .map(layerName =>
        this.setLayoutProperty(layerName, 'visibility',
          visibleLayerNames.includes(layerName) ? 'visible' : 'none')
      );
  }

};

export default BasicStyle;
