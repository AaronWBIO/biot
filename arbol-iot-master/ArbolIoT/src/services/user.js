import AppConstants from '../config/constants';
import { AsyncStorage } from 'react-native';
import { store } from '../navigators/AppNavigator';
const utf8 = require('utf8');
const b64 = require('base64-arraybuffer');

var UserService = {
  authenticate : async (user,password) => {
    var authenticateUrl = AppConstants.api.user.authenticate;
    var credentials = {
      "password": password,
      "rememberMe": true,
      "username": user
    };
    var headers = new Headers();
    headers.append("Content-Type", "application/json");
    return fetch(authenticateUrl,{method: 'POST', headers, body: JSON.stringify(credentials)});
  },
  reportSession : async () => {
    const state = store.getState();
    var headers = new Headers();
    const id_token = state.user.id_token;
    headers.append("Authorization", "Bearer " + id_token);
    headers.append("Content-Type", "application/json");
    return fetch(AppConstants.api.user.session,{method: 'POST', headers });
  },
  socialAuth : async (type, token) => {
    var authenticateUrl = AppConstants.api.user.socialAuth;
    var headers = new Headers();
    headers.append("Content-Type", "application/json");
    return fetch(authenticateUrl.replace("{type}",type),{method: 'POST', headers, body: token });
  },
  acceptTerms : async () => {
    const state = store.getState();
    var acceptTermsUrl = AppConstants.api.user.acceptTerms;
    var headers = new Headers();
    const id_token = state.user.id_token;
    headers.append("Authorization", "Bearer " + id_token);
    headers.append("Content-Type", "application/json");
    return fetch(acceptTermsUrl,{method: 'POST', headers });
  },
  register : async (user) => {
    var headers = new Headers();
    headers.append("Content-Type", "application/json");
    return fetch(AppConstants.api.userRegister.register, {method: 'POST', headers, body: JSON.stringify(user)});
  },
  findUsersInGlobalRepository : async (pagination) => {
    const state = store.getState();
    var headers = new Headers();
    const id_token = state.user.id_token;
    headers.append("Authorization", "Bearer " + id_token);
    headers.append("Content-Type", "application/json");
    var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
    return fetch(AppConstants.api.user.repository + '?' + urlParameters,{method: 'GET', headers});
  },
  findUsersInFollowedRepository  : async (pagination) => {
    const state = store.getState();
    var headers = new Headers();
    const id_token = state.user.id_token;
    headers.append("Authorization", "Bearer " + id_token);
    headers.append("Content-Type", "application/json");
    var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
    return fetch(AppConstants.api.user.followed + '?' + urlParameters,{method: 'GET', headers});
  },
  findUsersInFollowingRepository  : async (pagination) => {
    const state = store.getState();
    var headers = new Headers();
    const id_token = state.user.id_token;
    headers.append("Authorization", "Bearer " + id_token);
    headers.append("Content-Type", "application/json");
    var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
    return fetch(AppConstants.api.user.following + '?' + urlParameters,{method: 'GET', headers});
  },
  follow : async (id) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    headers.append("Accept","application/json");
    return fetch(AppConstants.api.userUpdate.following.replace("{uid}",id), {method: 'POST', headers});
  },
  getAccount: async() => {
    const state = store.getState();
    var headers = new Headers();
    const id_token = state.user.id_token;
    headers.append("Authorization", "Bearer " + id_token);
    headers.append("Content-Type", "application/json");
    var accountUrl = AppConstants.api.user.account;
    return fetch(accountUrl,{method: 'GET', headers});
  },
  getProfile: async() => {
    const state = store.getState();
    var headers = new Headers();
    const id_token = state.user.id_token;
    headers.append("Authorization", "Bearer " + id_token);
    headers.append("Content-Type", "application/json");
    var accountUrl = AppConstants.api.user.profile;
    return fetch(accountUrl,{method: 'GET', headers});
  },
  recovery : async (mail) => {
    var headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("accept-Encoding","text/html");
    return fetch(AppConstants.api.userRecovery.recovery, {method: 'POST', headers, body: mail});
  },
  update : async (user) => {
    var headers = new Headers();
    var bytes = utf8.encode(user.login + ":" + user.password);
    var credentials = b64.encode(bytes);
    headers.append("Authorization", "Basic " + credentials);
    headers.append("Content-Type", "application/json");
    return fetch(AppConstants.api.userUpdate.update, {method: 'POST', headers, body: JSON.stringify(user)});
  },
  changePassword : async (user) => {
    var headers = new Headers();
    var bytes = utf8.encode(user.login + ":" + user.password);
    var credentials = b64.encode(bytes);
    headers.append("Authorization", "Basic " + credentials);    
    headers.append("Content-Type", "text/plain");
    return fetch(AppConstants.api.userUpdate.password, {method: 'POST', headers, body: user.newPassword}).then((e) => {return true}).catch((e) => {return false});
  },
  saveUser : async (user) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return true;
    } catch (error) {
      return false;
    }
  },
  togglePRO : async (id) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    headers.append("Accept","application/json");
    return fetch(AppConstants.api.userPromotion.toggle.replace("{uid}",id), {method: 'POST', headers, body: JSON.stringify(id)});
  },
  findNoPRO  : async (pagination) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
    return fetch(AppConstants.api.userPromotion.findNoPRO + '?' + urlParameters,{method: 'GET', headers});
  },
  findPRO  : async (pagination) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    var urlParameters = Object.entries(pagination).map(e => e.join('=')).join('&');
    return fetch(AppConstants.api.userPromotion.findPRO + '?' + urlParameters,{method: 'GET', headers});
  },
  putProfileInfo: async (user) => {
    const state = store.getState();
    var headers = new Headers();
    headers.append("Authorization", "Bearer " + state.user.id_token);
    headers.append("Content-Type", "application/json");
    headers.append("Accept","application/json");
    return fetch(AppConstants.api.userProfile.putProfileInfo, {method: 'PUT', headers, body: JSON.stringify(user)});
  },

}
export default UserService;