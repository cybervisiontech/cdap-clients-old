# CDAP Client JavaScript library

Authentication client JavaScript API for CASK reactor.

## Supported Actions

- checking if authentication is available from the server side.
- authentication

## Usage

 To use the Authentication client JavaScript API, include these scrip tag in your index.html:

In web browser:
```
<script type="text/javascript" src="cask-auth-manager.min.js"></script>
```

In Node.JS:
```
var CDAPAuthManager = require('serviceconnector')['CDAPAuthManager'];
```

## Tracker object
Methods:

'isAuthEnabled()'    - checks if authentication is enabled from the server side.
                       Returns: true/false
'getToken()'         - authenticates and returns token info.
                       Returns: {
                           token: '',        - token value
                           type: ''          - token type. Currently 'Bearer' is only supported.
                       }

## Example

Create a ```CDAPAuthManager``` instance, specifying the 'username' and 'password' fields. 
Optional configurations that can be set (and their default values):

  - host: 'localhost' (DNS name or IP-address of the Reactor gateway server.)
  - port: 10000 (Number of a port the Reactor gateway server works on)
  - ssl: False (use HTTP protocol)

```
    var manager = new CDAPAuthManager('username', 'password'),
        tokenInfo;

    if (manager.isAuthEnabled()) {
        tokenInfo = manager.getToken();
    }
```