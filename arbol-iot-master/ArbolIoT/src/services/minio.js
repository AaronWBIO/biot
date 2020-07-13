import AppConstants from '../config/constants';
import RNFetchBlob from 'rn-fetch-blob';
import { store } from '../navigators/AppNavigator';

var MinIoService = {
  uploadFile : async (module, filename, data, type, relatedId) => {
    const state = store.getState();
    var optional = "";
    if (relatedId != null) {
      optional += "&relatedId=" + relatedId;
    }
    return RNFetchBlob.fetch('POST', AppConstants.api.file.minio.upload + '?module='+module+optional, {
      'Authorization' : "Bearer " + state.user.id_token,
      'Content-Type' : 'multipart/form-data',
    }, [ { name : 'file', filename, data, type }]);
  },
}
export default MinIoService;

