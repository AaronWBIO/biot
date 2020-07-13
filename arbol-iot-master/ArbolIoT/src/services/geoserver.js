import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';
import _ from 'lodash';

var GeoserverService = {
  getFeatureInfo : async (x,y, layer ,width, height, bbox) => {
    const state = store.getState();
    var headers = new Headers();
    var buffer = 30;
    if(_.has(state,'config.application.dynamic.treeModule.buffer')) {
      buffer = state.config.application.dynamic.treeModule.buffer;
    }
    console.log(buffer);
    x = Math.round(x);
    y = Math.round(y);
    headers.append("Content-Type", "application/json");
    var url = `${AppConstants.api.geoserver.wms}?
    &INFO_FORMAT=application/json
    &REQUEST=GetFeatureInfo
    &EXCEPTIONS=application/vnd.ogc.se_xml
    &SERVICE=WMS
    &VERSION=1.1.1
    &WIDTH=${width}&HEIGHT=${height}&BBOX=${bbox.join(",")}&LAYERS=${layer}&QUERY_LAYERS=${layer}&buffer=${buffer}&x=${x}&y=${y}&feature_count=100`;
    return fetch(url);
  },
}
export default GeoserverService;