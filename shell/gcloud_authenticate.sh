touch privatekey.json
echo "{\
  \"private_key_id\": \"$GAE_PRIVATE_KEY_ID_TEST\",\
  \"private_key\": \"$GAE_PRIVATE_KEY_TEST\",\
  \"client_email\": \"$GAE_CLIENT_EMAIL_TEST\",\
  \"client_id\": \"$GAE_CLIENT_ID_TEST\",\
  \"type\": \"service_account\"\
}" | tee privatekey.json > /dev/null 2> /dev/null
/home/ubuntu/${CIRCLE_PROJECT_REPONAME}/google-cloud-sdk/bin/gcloud auth activate-service-account --key-file privatekey.json
/home/ubuntu/${CIRCLE_PROJECT_REPONAME}/google-cloud-sdk/bin/gcloud config set project "$GAE_PROJECT_ID_TEST"
