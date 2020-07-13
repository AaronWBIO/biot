import AppConstants from '../config/constants';
import { store } from '../navigators/AppNavigator';
import RNFetchBlob from 'rn-fetch-blob';

var TreeService = {
  get : async (id, ignoreCache) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    return new Promise((resolve, reject) => {
      fetch(AppConstants.api.tree.get.replace("{id}",id),{headers})
      .then((res) => res.json())
      .then(res => {
          resolve(res); 
      }).catch((e) => {
          reject(e);
      });
    });
  },
  uploadFile : async (filename, data, type) => {
    const state = store.getState();
    return RNFetchBlob.fetch('POST', AppConstants.api.tree.uploadFile, {
      'Authorization' : "Bearer " + state.user.id_token,
      'Content-Type' : 'multipart/form-data',
    }, [ { name : 'file', filename, data, type }]);
  },
  uploadFileWithTreeId : async (id, filename, data, type) => {
    const state = store.getState();
    return RNFetchBlob.fetch('PUT', AppConstants.api.tree.uploadPhotoUpdate.replace("{id}",id), {
      'Authorization' : "Bearer " + state.user.id_token,
      'Content-Type' : 'multipart/form-data',
    }, [ { name : 'file', filename, data, type }]);
  },
  getAllByBoundaryId : async(id) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    return fetch(AppConstants.api.tree.getAllByBoundaryId.replace("{boundaryId}",id), { headers });
  },
  countByBoundaryId : async(id) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    return fetch(AppConstants.api.tree.count.replace("{boundaryId}",id), { headers });
  },
  save : async (treeEntity) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    headers.append("Accept","application/json");
    return fetch(AppConstants.api.tree.post, {method: 'POST', headers, body: JSON.stringify(treeEntity)});
  },
  update : async (treeEntity) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    headers.append("Accept","application/json");
    return fetch(AppConstants.api.tree.put, {method: 'PUT', headers, body: JSON.stringify(treeEntity)});
  },
  updateBulk : async (tree, file) => {
    const state = store.getState();
    var multipart = [];
    multipart.push( { name:'multipartTree', data: JSON.stringify(tree) } );
    if (file != null) {
      multipart.push({ name : 'file', filename: file.fileName.toLowerCase(), data: file.data, type: file.type }) ;
    }
    return RNFetchBlob.fetch('POST', AppConstants.api.tree.putBulk, {
      'Authorization' : "Bearer " + state.user.id_token,
      'Content-Type' : 'multipart/form-data',
    }, multipart );
  },
  saveBulk : async (tree, file) => {
    const state = store.getState();
    var multipart = [];
    multipart.push( { name:'multipartTree', data: JSON.stringify(tree) } );
    if (file != null) {
      multipart.push({ name : 'file', filename: file.fileName.toLowerCase(), data: file.data, type: file.type }) ;
    }
    return RNFetchBlob.fetch('POST', AppConstants.api.tree.postBulk, {
      'Authorization' : "Bearer " + state.user.id_token,
      'Content-Type' : 'multipart/form-data',
    }, multipart);
  },
  getTreesByStatus : async(status,pagination) => {
    const state = store.getState();
    var headers = new Headers();
    const id_token = state.user.id_token;
    headers.append("Authorization", "Bearer " + id_token);
    headers.append("Content-Type", "application/json");
    var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
    return fetch(AppConstants.api.tree.getTreesByStatus.replace('{status}', status) + '?' + urlParameters,{method: 'GET', headers});
  },
  getTreesEditedByCurrentUser : async(pagination) => {
    const state = store.getState();
    var headers = new Headers();
    const id_token = state.user.id_token;
    headers.append("Authorization", "Bearer " + id_token);
    headers.append("Content-Type", "application/json");
    var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
    return fetch(AppConstants.api.tree.getTreesEditedByCurrentUser + '?' + urlParameters,{method: 'GET', headers});
  }
}
export default TreeService;