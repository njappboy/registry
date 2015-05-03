import { default as home } from './components/home.module';

function config ($urlRouterProvider, $stateProvider, registryPath) {
  $stateProvider.state('home', {
    url: '/',
    controller:   'HomeController',
    controllerAs: 'home',
    resolve: {
      packages: function ($http, $q) {
        var config = {
          headers: {
            'If-None-Match': localStorage.getItem('etag')
          }
        };

        function successHandler (res) {
          var decoded = atob(res.data.content);
          var json    = JSON.parse(decoded);
          var keys    = Object.keys(json);
          var urlMap  = {
            github: 'github.com',
            npm:    'npmjs.com'
          };

          var mapped = keys.map((key) => {
            var split = json[key].split(':');

            return {
              key:    key,
              distro: split[0],
              source: _.last(json[key].split(':')),
              url:    urlMap[split[0]] + '/' + split[1]
            }
          });

          localStorage.removeItem('rateLimitReached');
          localStorage.setItem('etag', res.headers('Etag'));
          localStorage.setItem('cachedList', JSON.stringify(mapped));

          return mapped;
        }

        function errHandler (err) {
          if (err.status === 304) {
            localStorage.removeItem('rateLimitReached');
            return JSON.parse(localStorage.getItem('cachedList'));
          } else if (err.status === 403) {
            localStorage.setItem('rateLimitReached', true);
            return JSON.parse(localStorage.getItem('cachedList'));
          }
        }

        return $http.get(registryPath, config)
          .then(successHandler)
          .catch(errHandler);
      }
    },
    templateUrl:  'app/components/home.html'
  });

  $urlRouterProvider.when('', '/');
}

export default angular
  .module('jspmRegistry', [ 'ui.router', home.name ])
  .constant('registryPath', 'https://api.github.com/repos/jspm/registry/contents/registry.json')
  .config(config);

// Stars: https://api.github.com/repos/owner/repo { stargazers_count }
// Watchers: https://api.github.com/repos/owner/repo { watchers_count }
