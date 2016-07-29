angular.module('quartermaester', ['ui.bootstrap', 'uiGmapgoogle-maps', '$q-spread', 'fCsv', 'toggle-switch', 'rzModule'])

.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyA805RWgioHgUbrtVo9sWAnk_UWT9_xDXE',
        //v: '3.20', //defaults to latest 3.X anyhow
        libraries: 'weather,geometry,visualization'
    });
});
