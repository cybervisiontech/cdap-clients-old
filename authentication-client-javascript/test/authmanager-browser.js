describe('CDAP Auth manager tests', function () {
    beforeEach(function () {
        /*        sinon.log = function (data) {
         console.log(data);
         };*/
        this.server = sinon.fakeServerWithClock.create();
    });

    afterEach(function () {
        this.server.restore();
    });

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
            this.server.respondWith([200, {'Content-Type': 'application/json'}, '']);

            var authManager = new CDAPAuthManager('username', 'password'),
                authEnabled = authManager.isAuthEnabled();

            expect(authEnabled).to.not.be.ok();
        });

        it('Authentication is enabled on server side.', function () {
            var jsonResp = {
                auth_uri: ["/some/url", "/some/url1", "/some/url2"]
            };

            this.server.respondWith([401, {'Content-Type': 'application/json'}, JSON.stringify(jsonResp)]);

            var authManager = new CDAPAuthManager('username', 'password'),
                authEnabled = authManager.isAuthEnabled();

            expect(authEnabled).to.be.ok();
        });

        it('"getToken" returns valid object', function () {
            var jsonResp = {
                "access_token": "2YotnFZFEjr1zCsicMWpAA",
                "token_type": "Bearer",
                "expires_in": 3600
            };

            this.server.respondWith([200, {'Content-Type': 'application/json'}, JSON.stringify(jsonResp)]);

            var authManager = new CDAPAuthManager('username', 'password'),
                authToken = authManager.getToken();

            expect(authToken).to.have.property('token');
            expect(authToken).to.have.property('type');
        });

        it('"getToken" returns valid token data', function () {
            var jsonResp1 = {
                    auth_uri: ["/token/url", "/token/url1", "/token/url2"]
                },
                jsonResp2 = {
                    access_token: "2YotnFZFEjr1zCsicMWpAA",
                    token_type: "Bearer",
                    expires_in: 3600
                };

            this.server.respondWith(/\/$/, [401, {'Content-Type': 'application/json'}, JSON.stringify(jsonResp1)]);
            this.server.respondWith(/\/token\/url[1-9]*$/, [200, {'Content-Type': 'application/json'},
                JSON.stringify(jsonResp2)]);

            var authManager = new CDAPAuthManager('username', 'password'),
                authToken;

            if (authManager.isAuthEnabled()) {
                authToken = authManager.getToken();
            }

            expect(authToken.token).to.be(jsonResp2.access_token);
            expect(authToken.type).to.be(jsonResp2.token_type);
        });
    });
});
