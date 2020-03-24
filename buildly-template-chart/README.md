# Buildly Template

## Installing

```
helm install buildly-template .
```

### Configuration

```
helm install buildly-template . --namespace buildly \
    --set secret.data.OAUTH_CLIENT_ID="d2tYTGxDOWgzazBqeEl4N29MbGx4cEZWVTg5RHhnaTdPOEZZWnlmWA==" \
    --set-string configmap.data.API_URL="https://demo-api.buildly.io" \
    --set-string configmap.data.OAUTH_TOKEN_URL="https://demo-api.buildly.io/oauth/token/" \
    --set-string configmap.data.PRODUCTION="true"
```
