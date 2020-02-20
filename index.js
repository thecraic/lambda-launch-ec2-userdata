const AWS = require('aws-sdk');
const REGION="eu-west-1";
const WEB_SG = "sg-005808da4332f29a0";
const PUBLIC_SUBNET = "subnet-7de48f1b";
const AMI="ami-099a8245f5daa82bf"; // Amazon Linux 2

const USER_DATA = `#!/bin/bash
sudo yum update -y
curl -X POST -H "Content-Type: application/json" -d '{"foo": "bar"}' https://hookb.in/RZlb8prqKBhnpQLg9aew
sleep 2m
sudo shutdown now
`;

exports.handler = async(event) => {

  // Load the AWS SDK for Node.js
  // Load credentials and set region from JSON file
  AWS.config.update({ region: REGION });

  // Create EC2 service object
  var ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });

  var base64UserData = new Buffer(USER_DATA).toString('base64');


  // AMI is Amazon Linux 2
  var instanceParams = {
    ImageId: AMI,
    InstanceType: 't2.micro',
    KeyName: 'DummyKP',
    MinCount: 1,
    MaxCount: 1,
    SecurityGroupIds: [WEB_SG],
    SubnetId: PUBLIC_SUBNET,
    UserData: base64UserData

  };

  // Create a promise on an EC2 service object
  var instancePromise = new AWS.EC2({ apiVersion: '2016-11-15' }).runInstances(instanceParams).promise();

  // Handle promise's fulfilled/rejected states
  instancePromise.then(
    function(data) {
      console.log(data);
      var instanceId = data.Instances[0].InstanceId;
      console.log("Created instance", instanceId);
      // Add tags to the instance
      var tagParams = {
        Resources: [instanceId],
        Tags: [{
          Key: 'Name',
          Value: 'Auto Launched by Lambda'
        }]
      };
      // Create a promise on an EC2 service object
      var tagPromise = new AWS.EC2({ apiVersion: '2016-11-15' }).createTags(tagParams).promise();
      // Handle promise's fulfilled/rejected states
      tagPromise.then(
        function(data) {
          console.log("Instance tagged");
        }).catch(
        function(err) {
          console.error(err, err.stack);
        });
    }).catch(
    function(err) {
      console.error(err, err.stack);
    });


  function wait(millisecs) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve("Bus has arrived."), millisecs)
    });
  }

  // Hang around to see what happens
  console.log(await wait(5000));

  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify('I did my bit!'),
  };

  return response;
};
