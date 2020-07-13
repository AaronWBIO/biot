import * as Navigation from './navigation';
import * as User from './user';
import * as Config from './config';
import * as Params from './params';
import * as MainData from './mainData';
import * as BoundaryFavs from './boundary';
import * as Notifications from './notifications';
import * as OfflineMode from './offlineMode';

const ActionCreators = Object.assign({},
  Navigation,
  User,
  Config,
  Params,
  MainData,
  BoundaryFavs,
  Notifications,
  OfflineMode
);

export default ActionCreators;