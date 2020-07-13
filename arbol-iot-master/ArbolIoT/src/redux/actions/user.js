
import { LOGIN, LOGOUT,RECOVER, UPDATE_USER } from '../ActionTypes';
import UserService from '../../services/user';
import NotificationService from '../../services/notificaction';
import { Toast } from "native-base";
import {StackActions, NavigationActions } from 'react-navigation';
import strings from '../../config/languages';
import {AsyncStorage} from 'react-native';

const recovery = (email) => {
    const action = (dispatch) => {
        UserService.recovery(email.toLowerCase())
        .then(res => {
            var status = res.status;
            dispatch({
                type: RECOVER,
                status
            });
            if (res.status == 200 ) {
                Toast.show({ text: "Se ha enviado un correo de recuperación a tu correo electrónico", buttonText: strings.ok, duration: 20000 });
                const loginAction = StackActions.reset({
                    index: 0,
                    actions: [NavigationActions.navigate({ routeName: 'LogIn' })],
                });
                dispatch(loginAction);    
            }
            if (res.status == 404 || res.status == 401 || res.status == 400) {
                Toast.show({ text: strings.globalErrors.mailNotFound, buttonText: strings.ok, duration: 20000 });
            }
        })
        .catch((e) => {
            Toast.show({ text: strings.globalErrors.connection, buttonText: strings.ok, duration: 20000 });
        });
    };
    return action;
};

const logOut = () => {
    const action =  async (dispatch) => {
        await NotificationService.updateToken(' ');
        await AsyncStorage.getAllKeys().then(AsyncStorage.multiRemove);
        dispatch({
            type: LOGOUT
        });
    }
    return action;
}
const socialAuth = (type, socialToken) => {
    const action = (dispatch) => {
        UserService.socialAuth(type,socialToken)
        .then((res) => res.json())
        .then(token => {
            if (token.id_token) {
                // Dispatch token set
                user = {};
                user.id_token = token.id_token;
                dispatch({
                    type: LOGIN,
                    user
                });
                // Get user
                UserService.getProfile()
                .then((res) => {
                    return res.json();
                })
                .then(user => {
                    if (user.id) {  
                        user.id_token = token.id_token;
                        AsyncStorage.setItem('id_token', token.id_token);
                        console.log(user);
                        dispatch({
                            type: LOGIN,
                            user
                        });
                        if (user.termsAndConditionsChecked == true) {
                            const successful = StackActions.reset({
                                index: 0,
                                actions: [NavigationActions.navigate({ routeName: 'Main' })],
                            });
                            dispatch(successful);
                        } else {
                            const legalAgreements = StackActions.reset({
                                index: 0,
                                actions: [NavigationActions.navigate({ routeName: 'LegalAgreements' })],
                            });
                            dispatch(legalAgreements);  
                        }
                    } else {
                        Toast.show({ text: strings.globalErrors.connection, buttonText: strings.ok, duration: 20000 });
                    }
                })
                .catch((e) => {
                    Toast.show({ text: strings.globalErrors.connection, buttonText: strings.ok, duration: 20000 });
                });
                            
            } else {
                Toast.show({ text: strings.logIn.error.badCredentials , buttonText: strings.ok, duration: 20000 });
            }
        })
        .catch((e) => {
            Toast.show({ text: strings.globalErrors.connection, buttonText: strings.ok, duration: 20000 });
        });
    };
    return action;
}
const updateLocalUser = (user) => {
    const action = (dispatch) => {
        dispatch({
            type: UPDATE_USER,
            user
        });
    };
    return action;
} 
const authenticate = (user, password) => {
    const action = (dispatch) => {
        UserService.authenticate(user.toLowerCase(), password)
        .then((res) => res.json())
        .then(token => {
            if (token.id_token) {
                // Dispatch token set
                user = {};
                user.id_token = token.id_token;
                dispatch({
                    type: LOGIN,
                    user
                });
                // Get user
                UserService.getProfile()
                .then((res) => res.json())
                .then(user => {
                    if (user.id) {  
                        user.id_token = token.id_token;
                        AsyncStorage.setItem('id_token', token.id_token);
                        dispatch({
                            type: LOGIN,
                            user
                        });
                        if (user.termsAndConditionsChecked == true) {
                            const successful = StackActions.reset({
                                index: 0,
                                actions: [NavigationActions.navigate({ routeName: 'Main' })],
                            });
                            dispatch(successful);
                        } else {
                            const legalAgreements = StackActions.reset({
                                index: 0,
                                actions: [NavigationActions.navigate({ routeName: 'LegalAgreements' })],
                            });
                            dispatch(legalAgreements);  
                        }
                    } else {
                        Toast.show({ text: strings.globalErrors.connection, buttonText: strings.ok, duration: 20000 });
                    }
                })
                .catch((e) => {
                    Toast.show({ text: strings.globalErrors.connection, buttonText: strings.ok, duration: 20000 });
                });
                            
            } else {
                Toast.show({ text: strings.logIn.error.badCredentials , buttonText: strings.ok, duration: 20000 });
            }
        })
        .catch((e) => {
            Toast.show({ text: strings.globalErrors.connection, buttonText: strings.ok, duration: 20000 });
        });
    };
    return action;
};

export {
    authenticate,
    socialAuth,
    logOut,
    recovery,
    updateLocalUser
};