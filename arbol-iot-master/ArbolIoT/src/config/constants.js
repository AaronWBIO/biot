let base      = 'https://arboles.zapopan.gob.mx';
let baseApi   = base + '/api/';
let baseLayer = base + '/styles/dark-matter/';
let geoserverBaseUrl = base + '/geoserver/';
let geoserverWorkspace = 'arbol-iot';

export default {
  base: base,
  baseLayer: baseLayer,
  api : {
    config: {
      general: baseApi + 'configuration',
      assistant: baseApi + 'configuration/assistant',
      url: baseApi + 'config-stores/by-key',
    },
    main: {
      get: baseApi + 'contextual-report/main/{id}'
    },
    measure: {
      lastByPoint: baseApi +  'measure/last/{wktPoint}/{variable}'
    },
    species: baseApi + 'species',
    boundary: baseApi + 'boundaries/query/COLONIA',
    boundaryWithGeom: baseApi + 'boundaries/query-with-geom/COLONIA',
    boundaryFavorites: baseApi + 'boundaries/current-user/with-trees',
    boundaryFavoritesAdd: baseApi + 'favorite-boundaries',
    boundaryFavoritesDelete: baseApi + 'boundaries/favorite/delete/{id}',
    geoserver: {
        wms: geoserverBaseUrl + geoserverWorkspace + '/wms',
        wfs: geoserverBaseUrl + geoserverWorkspace + '/wfs',
        workspace: geoserverWorkspace
    },
    userLogin: {
      login: baseApi + 'account',
      logout: baseApi + 'logout'
    },
    userRecovery: {
      recovery: baseApi + 'account/reset-password/init'
    },
    userRegister: {
      register: baseApi + 'register'
    },
    userUpdate: {
      update: baseApi + 'account',
      password: baseApi + 'account/change_password',
      following: baseApi + 'user-profile/toggle-follow/{uid}',
    },
    file: {
      minio: { upload: baseApi + 'min-io', get: baseApi + 'min-io/{bucketName}/{objectName}'},
    },
    userPromotion: {
      toggle: baseApi + 'user-profile/toggle-policy/{uid}',
      findNoPRO: baseApi + 'user-profile/find-users-no-pro',
      findPRO: baseApi + 'user-profile/find-users-pro',
    },
    user: {
      authenticate: baseApi + 'authenticate',
      socialAuth: baseApi + 'authenticate/{type}',
      acceptTerms: baseApi + 'user-profile/terms-accept',
      account: baseApi + 'account',
      repository: baseApi + 'user-profile/global-user-repository',
      following: baseApi + 'user-profile/get-users-followed-by-current-user',
      followed: baseApi + 'user-profile/get-users-following-to-current-user',
      profile: baseApi +  'user-profile/current',
      session: baseApi +  'user-profile/session',
    },
    userProfile: {
      putProfileInfo: baseApi + 'user-profile/current',
    },
    tree: {
      get: baseApi + 'trees/get/{id}',
      post: baseApi + 'trees/post',
      postBulk: baseApi + 'trees/post-bulk',
      put: baseApi + 'trees/update',
      putBulk: baseApi + 'trees/update-bulk',
      uploadFile: baseApi + 'trees/upload-photo',
      uploadPhotoUpdate: baseApi + 'trees/update-photo/{id}',
      count: baseApi + 'tree/count/by-boundary/{boundaryId}',
      getAllByBoundaryId: baseApi + 'trees/by-boundary-id/{boundaryId}',
      getTreesByStatus: baseApi + 'trees/all-by-status/{status}',
      getTreesEditedByCurrentUser: baseApi + 'trees/edited-by-current-user',
    },
    trivia:{
      get: baseApi + 'trivia/get',
      post: baseApi + 'trivia/add',
      validateQuestion: baseApi + 'trivia/question/validate',
    },
    onBoard: {
      get: baseApi + 'on-boards/{id}',
      mark: baseApi + 'on-boards/mark-as-read/{id}'
    },
    report:{
      get: baseApi + 'reports/current-user',
      post: baseApi + 'reports/add',
      getReport: baseApi + 'reports/{id}',
      getAllReportTags: baseApi + 'report-tags',
      getUserContrib: baseApi + 'contextual-report/user-contrib',
      getUserSingleContrib: baseApi + "contextual-report/user-single-contrib",
      getEcoBenefitsBySingleId: baseApi + 'contextual-report/eco-benefits/tree/{id}',
      getEcoBenefits: baseApi + 'contextual-report/eco-benefits/{id}',
      
    },
    community:{
      getAllCommunityTags: baseApi + 'community-tags',
      post: baseApi + 'community-publications/post',
      queryPublications: baseApi + 'community-publications/query-publications',
      toggleLike: baseApi + 'community-publications/toggle-like/{id}',
      toggleStatus : baseApi + 'community-publications/toggle-status/{id}',
      toggleSticky : baseApi + 'community-publications/toggle-sticky/{id}',
      getCommunityPublication: baseApi + 'community-publications/{id}',
      getPublicationComments: baseApi + 'community-publications/get-publication-comments/{id}',
      postComment: baseApi + 'community-publications/post-publication-comments/{id}',
    },
    entityRelated:{
      createEntityRelatedData : baseApi + 'entity-related-data/post',
    },
    adoption:{
      getCurrentUserTrees: baseApi + 'adoptions/current-user',      
      treeAdopt: baseApi + 'adoptions/adopt/{tid}',
      getAdoptionStatus: baseApi + 'adoptions/status/{tid}',
      treeUpdatePhoto: baseApi + 'adoptions/update-photo/{tid}',
      treeWatering: baseApi + 'adoptions/watering/{tid}'
      
    },
    achievement:{
      getProfileAchievementsByType: baseApi + 'achievements/get-profile-achievements-by-type/{type}',
    },
    notification:{
      updateLocation: baseApi + "notifications/location",
      updateToken: baseApi + "notifications/token",
      getCurrentUserNotifications: baseApi + "notifications/current-user",
      getUserNumberOfNotificationForRead: baseApi + "notifications/number-of-notifications-for-read",
      
    }
  }
};