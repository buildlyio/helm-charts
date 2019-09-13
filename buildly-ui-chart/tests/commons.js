const buildlyHost = 'define.buildly.host.com';

const baseService = (releaseName, serviceName) => {
  context('Services', () => {
    let sut;
    before(() => {
      sut = results.ofType('Service').find((value) => value.metadata.name === `${releaseName}-${serviceName}`);
    });

    it('should be deployed', () => {
      should.exist(sut);
    });
  });
};

const baseIngress = (releaseName, serviceName, host) => {
  context('Ingress base', () => {
    let sut;
    before(() => {
      sut = results.ofType('Ingress').find((value) => value.metadata.name === `${releaseName}-${serviceName}`);
    });

    it('should be deployed', () => {
      should.exist(sut);
    });

    context('metadata', () => {
      let metadata;
      before(() => {
        metadata = sut.metadata;
      });

      it('should be deployed', () => {
        should.exist(metadata);
      });

      it('should have correct metadata', () => {
        metadata.should.be.containDeep({
          name: `${releaseName}-${serviceName}`,
          annotations: {
            'kubernetes.io/ingress.class': 'nginx',
            'kubernetes.io/tls-acme': 'true',
          },
        });
      });
    });

    context('spec', () => {
      let spec;
      before(() => {
        spec = sut.spec;
      });

      it('should be deployed', () => {
        should.exist(spec);
      });

      it('should have correct spec', () => {
        spec.should.be.containDeep({
          rules: [
            {
              host,
              http: {
                paths: [
                  {
                    backend: {
                      serviceName: `${releaseName}-${serviceName}`,
                      servicePort: 8080
                    }
                  },
                ],
              },
            },
          ],
        });
      });
    });
  });
};

module.exports = {
  baseIngress,
  baseService,
  buildly: {
    base: {
      host: buildlyHost,
      env: [
        {
          "name": "DEFAULT_OAUTH_DOMAINS",
          "value": "toladata.com,humanitec.com"
        },
        {
          "name": "DJANGO_SETTINGS_MODULE",
          "value": "activity-api.settings.production"
        },
        {
          "name": "ELASTICSEARCH_URL",
          "value": "http://RELEASE-NAME-buildly-elasticsearch:9200/"
        },
        {
          "name": "SOCIAL_AUTH_GOOGLE_OAUTH2_KEY",
          "valueFrom": {
            "secretKeyRef": {
              "key": "googleOauth2Key",
              "name": "RELEASE-NAME-main-secrets"
            }
          }
        },
        {
          "name": "SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET",
          "valueFrom": {
            "secretKeyRef": {
              "key": "googleOauth2Secret",
              "name": "RELEASE-NAME-main-secrets"
            }
          }
        },
        {
          "name": "SOCIAL_AUTH_LOGIN_REDIRECT_URL",
          "value": `https://${buildlyHost}/`
        },
        {
          "name": "SOCIAL_AUTH_MICROSOFT_GRAPH_KEY",
          "valueFrom": {
            "secretKeyRef": {
              "key": "microsoftGraphKey",
              "name": "RELEASE-NAME-main-secrets"
            }
          }
        },
        {
          "name": "SOCIAL_AUTH_MICROSOFT_GRAPH_REDIRECT_URL",
          "value": `https://${buildlyHost}/complete/microsoft-graph`
        },
        {
          "name": "SOCIAL_AUTH_MICROSOFT_GRAPH_SECRET",
          "valueFrom": {
            "secretKeyRef": {
              "key": "microsoftGraphSecret",
              "name": "RELEASE-NAME-main-secrets"
            }
          }
        },
        {
          "name": "DATABASE_ENGINE",
          "value": "postgresql"
        },
        {
          "name": "DATABASE_HOST",
          "value": "RELEASE-NAME-buildly-postgres"
        },
        {
          "name": "DATABASE_NAME",
          "value": "buildly"
        },
        {
          "name": "DATABASE_USER",
          "value": "root"
        },
        {
          "name": "DATABASE_PASSWORD",
          "valueFrom": {
            "secretKeyRef": {
              "key": "buildlyPostgresPassword",
              "name": "RELEASE-NAME-main-secrets"
            }
          }
        },
        {
          "name": "DATABASE_PORT",
          "value": "5432"
        },
        {
          "name": "DEBUG",
          "value": "True"
        },
        {
          "name": "ALLOWED_HOSTS",
          "value": buildlyHost
        },
        {
          "name": "CORS_ORIGIN_WHITELIST",
          "value": `some.domain,another.domain,${toladatav2Host}`
        },
        {
          "name": "DEFAULT_FROM_EMAIL",
          "value": "support@example.com"
        },
        {
          "name": "DEFAULT_ORG",
          "value": "Humanitec"
        },
        {
          "name": "DEFAULT_REPLY_TO",
          "value": "noreply@example.com"
        },
        {
          "name": "SET_PROGRAM_ADMIN_DEFAULT",
          "value": "False"
        },

        {
          "name": "PYTHONUNBUFFERED",
          "value": "1"
        }
      ]
    }
  }
};
