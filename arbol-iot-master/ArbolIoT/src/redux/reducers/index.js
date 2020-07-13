import { combineReducers } from 'redux'
import { nav } from './navigation';
import { user } from './user';
import { config } from './config';
import { param } from './params';
import { mainData } from './mainData';
import { boundaryFavs,localBoundary } from './boundary';
import { currentBoundary } from './currentBoundary';
import { notificationsIndicator } from './notifications';
import { mode } from './offlineMode';

export default combineReducers({
    nav,
    user,
    config,
    param,
    mainData,
    boundaryFavs,
    currentBoundary,
    notificationsIndicator,
    localBoundary,
    mode
});
