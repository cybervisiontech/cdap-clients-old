var CDAPAuthManager = require('../src/authmanager')['CDAPAuthManager'],
    expect = require('expect.js'),
    sinon = require('sinon'),
    httpsync = require('httpsync');

describe('CDAP Auth manager tests', function () {
    describe('Checking Auth Manager functionality', function () {
        it('Constructor creates correct object', function () {
            var authManager = new CDAPAuthManager('username', 'password');

            expect(authManager).to.be.an('object');
            expect(authManager).to.have.property('isAuthEnabled');
            expect(authManager).to.have.property('getToken');
        });

        it('Constructor could not be called without "username" or "password" field', function () {
            expect(function () {
                var authManager = new CDAPAuthManager();
            }).to.throwException(function (e) {
                    expect(e).to.be.an(Error);
                });
        });

        it('Authentication is disabled on server side.', function () {
            var mock = sinon.mock(httpsync);
            mock.expects('request').once().returns({
                end: function () {
                    return {
                        status: 200,
                        data: ''
                    };
                }
            });

            var authManager = new CDAPAuthManager('username', 'password'),
                authEnabled = authManager.isAuthEnabled();

            mock.verify();
            mock.restore();

            expect(authEnabled).to.not.be.ok();
        });

        it('Authentication is enabled on server side.', function () {
            var jsonResp = {
                    auth_uri: ["/some/url", "/some/url1", "/some/url2"]
                },
                mock = sinon.mock(httpsync);

            mock.expects('request').once().returns({
                end: function () {
                    return {
                        status: 401,
                        data: JSON.stringify(jsonResp)
                    };
                }
            });

            var authManager = new CDAPAuthManager('username', 'password'),
                authEnabled = authManager.isAuthEnabled();

            mock.verify();
            mock.restore();

            expect(authEnabled).to.be.ok();
        });

        it('"getToken" returns valid object', function () {
            var username = 'username',
                password = 'password',
                jsonResp1 = {
                    auth_uri: ["/token/url"]
                },
                jsonResp2 = {
                    "access_token": "2YotnFZFEjr1zCsicMWpAA",
                    "token_type": "Bearer",
                    "expires_in": 3600
                },
                mock = sinon.mock(httpsync),
                getAuthUrlArgs = {
                    url: 'http://localhost:10000/',
                    method: 'GET'
                },
                fetchTokenArgs = {
                    url: 'http://localhost:10000//token/url',
                    method: 'GET',
                    headers: {
                        Authentication: 'Basic ' + new Buffer(username + ':' + password).toString('base64')
                    }
                };

            mock.expects('request').withArgs(getAuthUrlArgs).returns({
                end: function () {
                    return {
                        status: 401,
                        data: JSON.stringify(jsonResp1)
                    };
                }
            });
            mock.expects('request').withArgs(fetchTokenArgs).returns({
                end: function () {
                    return {
                        status: 200,
                        data: JSON.stringify(jsonResp2)
                    };
                }
            });

            var authManager = new CDAPAuthManager(username, password),
                authToken;

            if (authManager.isAuthEnabled()) {
                authToken = authManager.getToken();
            }

            mock.verify();
            mock.restore();

            expect(authToken).to.have.property('token');
            expect(authToken).to.have.property('type');
        });

        it('"getToken" returns valid token data', function () {
            var username = 'username',
                password = 'password',
                jsonResp1 = {
                    auth_uri: ["/token/url"]
                },
                jsonResp2 = {
                    access_token: "2YotnFZFEjr1zCsicMWpAA",
                    token_type: "Bearer",
                    expires_in: 3600
                },
                mock = sinon.mock(httpsync),
                getAuthUrlArgs = {
                    url: 'http://localhost:10000/',
                    method: 'GET'
                },
                fetchTokenArgs = {
                    url: 'http://localhost:10000//token/url',
                    method: 'GET',
                    headers: {
                        Authentication: 'Basic ' + new Buffer(username + ':' + password).toString('base64')
                    }
                };

            mock.expects('request').withArgs(getAuthUrlArgs).returns({
                end: function () {
                    return {
                        status: 401,
                        data: JSON.stringify(jsonResp1)
                    };
                }
            });
            mock.expects('request').withArgs(fetchTokenArgs).returns({
                end: function () {
                    return {
                        status: 200,
                        data: JSON.stringify(jsonResp2)
                    };
                }
            });

            var authManager = new CDAPAuthManager(username, password),
                authToken;

            if (authManager.isAuthEnabled()) {
                authToken = authManager.getToken();
            }

            mock.verify();
            mock.restore();

            expect(authToken.token).to.be(jsonResp2.access_token);
            expect(authToken.type).to.be(jsonResp2.token_type);
        });
    });
});
