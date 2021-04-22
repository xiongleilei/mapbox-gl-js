import Painter from './../render/painter';

var layerStylesheetFromLayer = layer => layer && layer._eventedParent.stylesheet.layers.find(x=>x.id===layer.id);

class BasicPainter extends Painter {
  constructor(gl, transform){
    super(gl, transform);
    this._filterForZoom = 15;
  }
  renderLayer(painter, sourceCache, layer, coords) {
    let layerStylesheet = layerStylesheetFromLayer(layer);
    if (layerStylesheet && layerStylesheet.minzoom_ && this._filterForZoom < layerStylesheet.minzoom_) return;
    if (layerStylesheet && layerStylesheet.maxzoom_ && this._filterForZoom >= layerStylesheet.maxzoom_) return;
    super.renderLayer(painter, sourceCache, layer, coords, true);
  }
};

export default BasicPainter;
