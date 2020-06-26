const mysql = require('mysql');
var AWS = require('aws-sdk'),
  region = 'ap-southeast-2',
  secretName = 'dev/mysql/demodb', secret, decodedBinarySecret;

var client = new AWS.SecretsManager({
  region: region
});

// BUG
// this has an async issue I haven't fixed yet. the Secrets Manager api call returns after the connection is created, so the app fails.

module.exports = () => {
  client.getSecretValue({ SecretId: secretName }, function (err, data) {
    if (err) {
      if (err.code === 'DecryptionFailureException')
        // Secrets Manager can’t decrypt the protected secret text using the provided KMS key.
        // Deal with the exception here, and/or rethrow at your discretion.
        throw err;
      else if (err.code === 'InternalServiceErrorException')
        // An error occurred on the server side.
        // Deal with the exception here, and/or rethrow at your discretion.
        throw err;
      else if (err.code === 'InvalidParameterException')
        // You provided an invalid value for a parameter.
        // Deal with the exception here, and/or rethrow at your discretion.
        throw err;
      else if (err.code === 'InvalidRequestException')
        // You provided a parameter value that is not valid for the current state of the resource.
        // Deal with the exception here, and/or rethrow at your discretion.
        throw err;
      else if (err.code === 'ResourceNotFoundException')
        // We can’t find the resource that you asked for.
        // Deal with the exception here, and/or rethrow at your discretion.
        throw err;
    }
    else {
      // Decrypts secret using the associated KMS CMK.
      // Depending on whether the secret is a string or binary, one of these fields will be populated.
      if ('SecretString' in data) {
        secret = data.SecretString;
      } else {
        let buff = new Buffer(data.SecretBinary, 'base64');
        decodedBinarySecret = buff.toString('ascii');
      }
    }
    //Parsing secret JSON object
    const secretJSON = JSON.parse(secret);
    //Pass credentials info to connection
    return mysql.createConnection({
      host: secretJSON.host,
      user: secretJSON.username,
      password: secretJSON.password,
      database: secretJSON.dbname
    })
  })
}
