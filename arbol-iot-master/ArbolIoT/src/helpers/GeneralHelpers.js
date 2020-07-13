import _ from 'lodash';
import { store } from '../navigators/AppNavigator';
import strings from '../config/languages';
import globalStyles from '../styles/global';
import colors from '../styles/colors';

export default class GeneralHelpers {
    static alertTemplateDefault = {
        confirmText: strings.acceptLabel,
        showConfirmButton: true,
        confirmButtonTextStyle: globalStyles.alertConfirmText,
        confirmButtonStyle : globalStyles.alertConfirmButtonStyle,
        confirmButtonColor: colors.mainColor,
        closeOnTouchOutside: false,
        closeOnHardwareBackPress: false
    }
    static getUUID() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    static getCurrentUserPointsByWallet(walletName) {
        const state = store.getState();
        if (_.has(state,'user.point') && state.user.point.length > 0 ) {
            for (let wallet of state.user.point) {
                if(_.has(wallet,'scale.name') && wallet.scale.name == walletName) {
                    return wallet.points;
                }
            }
        } 
        return 0;
    }
    static getUserPointsByWallet(user, walletName) {
        if (_.has(user,'point') && user.point.length > 0 ) {
            for (let wallet of user.point) {
                if(_.has(wallet,'scale.name') && wallet.scale.name == walletName) {
                    return wallet.points;
                }
            }
        } 
        return 0;
    }
    static hasPermission(module,policy) {
        const state = store.getState();
        var perm = { remote: false };
        try {
            if (_.has(state,'config.application.dynamic.policiesByRole') &&
                state.config.application.dynamic.policiesByRole != null &&
                _.has(state,'user.authorities') && 
                state.user.authorities != null) {
                let policiesByRole = state.config.application.dynamic.policiesByRole;
                let authorities = state.user.authorities;
                for (let authority of authorities) {
                    if ( policiesByRole[authority.name] != null) {
                        let modules = policiesByRole[authority.name];
                        if (modules[module] != null && modules[module][policy] != null) {
                            let perm = modules[module][policy];
                            perm['remote'] = true;
                            return perm;
                        }
                    }
                }
            }
        } catch(e) {
            return perm;
        }
        try {
            if (_.has(state,'user.currentLevel.payload')
                && state.user.currentLevel.payload != null) {
                let payload = JSON.parse(state.user.currentLevel.payload);
                if (_.has(payload,'lockedModules') && payload.lockedModules != null) {
                    if (payload.lockedModules[module] != null && payload.lockedModules[module][policy] != null) {
                        let perm = payload.lockedModules[module][policy];
                        perm['remote'] = true;
                        return perm;
                    }      
                }
            }
        } catch(e) {
            return perm;
        }        
        return perm;
    }
}
