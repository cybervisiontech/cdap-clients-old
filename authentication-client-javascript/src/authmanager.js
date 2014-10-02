/**
 * Copyright © 2014 Cask Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


(function (factory) {
    'use strict';

    // Support three module loading scenarios
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        // [1] CommonJS/Node.js
        var target = module['exports'] || exports; // module.exports is for Node.js
        factory(target, require);
    } else if (typeof define === 'function' && define['amd']) {
        // [2] AMD anonymous module
        define(['exports', 'Promise'], factory);
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        factory(window);
    }
}(function (target, require) {
    'use strict';

    target['CDAPAuthManager'] = target['CDAPAuthManager'] || function (username, password, hostname, port, ssl) {
        if (!username || !password) {
            throw new Error('"username" and "password" have to be defined');
        }

        var connectionInfo = {
                host: hostname || 'localhost',
                port: port || 10000,
                ssl: (null != ssl) ? ssl : false,
                user: username,
                pass: password
            },
            tokenInfo = {
                value: '',
                type: '',
                expirationDate: 0
            },
            httpConnection = null,
            authUrls = null,
            AUTH_HEADER_NAME = 'Authentication',
            AUTH_TYPE = 'Basic',
            TOKEN_EXPIRATION_TIMEOUT = 5000;

        if ('undefined' !== typeof window) {
            httpConnection = new XMLHttpRequest();
        } else {
            httpConnection = require('httpsync');
        }

        var getAuthHeadersBrowser = function () {
                var obj = {};

                obj[AUTH_HEADER_NAME] = AUTH_TYPE + ' ' + Base64.encode(
                        connectionInfo.user + ':' + connectionInfo.pass
                );

                return obj;
            },
            getAuthHeadersNode = function () {
                var obj = {};

                obj[AUTH_HEADER_NAME] = AUTH_TYPE + ' ' + new Buffer(
                        connectionInfo.user + ':' + connectionInfo.pass
                ).toString('base64');

                return obj;
            },
            getAuthHeaders = ('undefined' !== typeof window) ? getAuthHeadersBrowser : getAuthHeadersNode,
            baseUrl = function () {
                return [
                    connectionInfo.ssl ? 'https' : 'http',
                    '://', connectionInfo.host,
                    ':', connectionInfo.port + '/'
                ].join('');
            },
            fetchAuthUrlBrowser = function () {
                httpConnection.open('GET', baseUrl(), false);
                httpConnection.send();

                if (4 === httpConnection.readyState && 401 === httpConnection.status) {
                    authUrls = JSON.parse(httpConnection.responseText)['auth_uri'];
                }
            },
            fetchAuthUrlNode = function () {
                var request = httpConnection.request({
                        url: baseUrl(),
                        method: 'GET'
                    }),
                    response = request.end();

                if (401 === response.status) {
                    authUrls = JSON.parse(response.data)['auth_uri'];
                }

            },
            fetchAuthUrl = ('undefined' !== typeof window) ? fetchAuthUrlBrowser : fetchAuthUrlNode,
            getAuthUrl = function () {
                var authUrl;

                if (!authUrls) {
                    return '';
                }

                if (1 === authUrls.length) {
                    authUrl = authUrls[0];
                } else {
                    authUrl = authUrls[Math.floor(Math.random() * (authUrls.length - 1)) + 1];
                }

                return authUrl;
            },
            isAuthEnabledImpl = function () {
                if (!authUrls) {
                    fetchAuthUrl();
                }
                return !!authUrls;
            },
            fetchTokenInfoBrowser = function () {
                var authUrl = getAuthUrl(),
                    authHeaders = getAuthHeaders();

                httpConnection.open('GET', authUrl, false);
                httpConnection.setRequestHeader(AUTH_HEADER_NAME, authHeaders[AUTH_HEADER_NAME]);
                if (authUrl) {
                    httpConnection.send();

                    if (4 === httpConnection.readyState && 200 === httpConnection.status) {
                        var tokenData = JSON.parse(httpConnection.responseText);

                        tokenInfo.value = tokenData.access_token;
                        tokenInfo.type = tokenData.token_type;
                        tokenInfo.expirationDate = (new Date()).getTime() + (tokenData.expires_in * 1000);
                    }
                }
            },
            fetchTokenInfoNode = function () {
                var authUrl = getAuthUrl();

                if (authUrl) {
                    var request = httpConnection.request({
                            url: baseUrl() + authUrl,
                            method: 'GET',
                            headers: getAuthHeaders()
                        }),
                        response = request.end();

                    if (200 === response.status) {
                        var tokenData = JSON.parse(response.data);

                        tokenInfo.value = tokenData.access_token;
                        tokenInfo.type = tokenData.token_type;
                        tokenInfo.expirationDate = (new Date()).getTime() + (tokenData.expires_in * 1000);
                    }
                }
            },
            fetchToken = ('undefined' !== typeof window) ? fetchTokenInfoBrowser : fetchTokenInfoNode,
            getTokenImpl = function () {
                if ((TOKEN_EXPIRATION_TIMEOUT >= (tokenInfo.expirationDate - (new Date()).getTime()))) {
                    fetchToken();
                }

                return {
                    token: tokenInfo.value,
                    type: tokenInfo.type
                };
            };

        return {
            isAuthEnabled: isAuthEnabledImpl,
            getToken: getTokenImpl
        };
    };
}));