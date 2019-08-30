'use strict';
const expectedEnvironmentVariables = require('./commons').buildly-core.base.env;
const buildly-coreHost = require('./commons').buildly-core.base.host;
const {
  baseIngress,
  baseService,
} = require('./commons');


describe('buildly-core Chart', () => {
  const buildly-coreImageRepository = 'somebuildly-coreimagerepository';
  const buildly-coreImageTag = 'somebuildly-coreimagetag';
  const numberOrReplicas = 100;

  before(done => {
    helm
    .withValueFile('values.yaml')
    .set('buildly-core.image.repository', buildly-coreImageRepository)
    .set('buildly-core.image.tag', buildly-coreImageTag)
    .set('buildly-core.createDefaultProgram', true)
    .set('buildly-core.additionalCorsOriginWhitelist[0]', 'some.domain')
    .set('buildly-core.additionalCorsOriginWhitelist[1]', 'another.domain')
    .set('buildly-core.host', buildly-coreHost)
    .set('buildly-core.replicaCount', numberOrReplicas)
    .go(done);
  });

  baseService('RELEASE-NAME', 'buildly-core');

  baseIngress('RELEASE-NAME', 'buildly-core', buildly-coreHost);

  context('Deployments', () => {
    let sut;
    before(() => {
      sut = results.ofType('Deployment').find((value) => value.metadata.name === 'RELEASE-NAME-buildly-core');
    });

    it('should be deployed', () => {
      should.exist(sut);
    });

    it('should have correct amout of replicas', () => {
      sut.spec.replicas.should.be.equal(numberOrReplicas);
    });

    context('Spec strategy', () => {
      let strategy;
      before(() => {
        strategy = sut.spec.strategy;
        console.log(strategy);
      });

      it('should have RollingUpdate strategy', () => {
        strategy.type.should.be.equal('RollingUpdate');
      });

      it('should have correct maxUnavailable', () => {
        strategy.rollingUpdate.maxUnavailable.should.be.equal(1);
      });

      it('should have correct maxSurge', () => {
        strategy.rollingUpdate.maxSurge.should.be.equal(1);
      });
    })


    context('Init containers', () => {
      let initContainers;
      before(() => {
        initContainers = sut.spec.template.spec.initContainers;
      });

      it('should exists', () => {
        should.exist(initContainers);
      });

      context('Check DB ready init container', () => {
        let checkDbReadyInitContainer;
        before(() => {
          checkDbReadyInitContainer = initContainers.find((value) => value.name === 'check-db-ready');
        });

        it('should exists', () => {
          should.exist(checkDbReadyInitContainer);
        });

      });

      context('Check migrations ready init container', () => {
        let checkMigrationsReadyInitContainer;
        before(() => {
          checkMigrationsReadyInitContainer = initContainers.find((value) => value.name === 'check-migrations-ready');
        });

        it('should exists', () => {
          should.exist(checkMigrationsReadyInitContainer);
        });

        it('should have correct image', () => {
          checkMigrationsReadyInitContainer.image.should.be.equal(`${buildly-coreImageRepository}:${buildly-coreImageTag}`);
        });

        it('should have correct command', () => {
          checkMigrationsReadyInitContainer.command.should.be.deepEqual([
            '/bin/sh',
            '-c',
            'until [ $(python manage.py showmigrations 2>1 | grep " \\[.*\\]" | grep -v "^ \\[X\\]" | wc -l) -eq 0 ];do echo waiting for migrations to be done; sleep 2; done;'
          ]);
        });

        expectedEnvironmentVariables.forEach(expectedValue => {
          it(`should have environment variable ${expectedValue.name} set to ${expectedValue.value || JSON.stringify(expectedValue.valueFrom)}`, () => {
            (checkMigrationsReadyInitContainer.env.find((val) => val.name === expectedValue.name) || []).should.be.deepEqual(expectedValue)
          });
        });
      });
    });

    context('buildly-core container', () => {
      let buildly-coreContainer;
      before(() => {
        buildly-coreContainer = sut.spec.template.spec.containers.find(val => val.name === 'buildly-core');
      });

      it('should exist', () => {
        should.exist(buildly-coreContainer);
      });

      context('Environment variables', () => {
        let env;
        before(() => {
          env = buildly-coreContainer.env;
        });

        it('should have at least one', () => {
          env.length.should.be.above(0);
        });

        expectedEnvironmentVariables.forEach(expectedValue => {
          it(`should have environment variable ${expectedValue.name} set to ${expectedValue.value || JSON.stringify(expectedValue.valueFrom)}`, () => {
            (env.find((val) => val.name === expectedValue.name) || []).should.be.deepEqual(expectedValue)
          });
        });
      });

      context('Liveness probe', () => {
        let livenessProbe;
        before(() => {
          livenessProbe = buildly-coreContainer.livenessProbe;
        });

        it('should have correct parameters', () => {
          livenessProbe.should.be.deepEqual({
            httpGet: {
              path: '/health_check/',
              port: 8080,
              httpHeaders: [{
                name: 'Host',
                value: buildly-coreHost,
              }],
            },
            initialDelaySeconds: 3,
            periodSeconds: 3,
            timeoutSeconds: 3,
          });
        });
      });

      context('Command', () => {
        let command;
        before(() => {
          command = buildly-coreContainer.command.join(' ');
        });

        it('should have correct command', () => {
          command.split('\n').should.containDeepOrdered([
            'gunicorn -b 0.0.0.0:8080 activity-api.wsgi',
          ]);
        });
      });
    });
  });
});

[
  {
    given: {setProgramAdminDefault: 'True'},
    expect: {
      name: 'SET_PROGRAM_ADMIN_DEFAULT',
      value: 'True'
    },
  },
  {
    given: {setProgramAdminDefault: 'False'},
    expect: {
      name: 'SET_PROGRAM_ADMIN_DEFAULT',
      value: 'False'
    },
  },
].forEach(value => {
  describe(`buildly-core Chart when setProgramAdminDefault is set to '${value.given.setProgramAdminDefault}'`, () => {
    before(done => {
      helm
      .withValueFile('values.yaml')
      .set('buildly-core.setProgramAdminDefault', value.given.setProgramAdminDefault)
      .go(done);
    });

    context('buildly-core container', () => {
      let env;
      before(() => {
        env = results.ofType('Deployment')
          .find((value) => value.metadata.name === 'RELEASE-NAME-buildly-core')
          .spec.template.spec.containers
          .find(val => val.name === 'buildly-core').env;
      });
      [value.expect].forEach((expectedValue) => {
        it(`should have environment variable ${expectedValue.name} set to ${expectedValue.value || JSON.stringify(expectedValue.valueFrom)}`, () => {
          (env.find((val) => val.name === expectedValue.name) || []).should.be.deepEqual(expectedValue);
        });
      });
    });
  });
});

[
  {
    given: {createDefaultProgram: 'True'},
    expect: {
      name: 'CREATE_DEFAULT_PROGRAM',
      value: 'True'
    },
  },
  {
    given: {createDefaultProgram: 'False'},
    expect: {
      name: 'CREATE_DEFAULT_PROGRAM',
      value: 'False'
    },
  },
].forEach(value => {
  describe(`buildly-core Chart when createDefaultProgram is set to '${value.given.createDefaultProgram}'`, () => {
    before(done => {
      helm
      .withValueFile('values.yaml')
      .set('buildly-core.createDefaultProgram', value.given.createDefaultProgram)
      .go(done);
    });

    context('buildly-core container', () => {
      let env;
      before(() => {
        env = results.ofType('Deployment')
          .find((value) => value.metadata.name === 'RELEASE-NAME-buildly-core')
          .spec.template.spec.containers
          .find(val => val.name === 'buildly-core').env;
      });
      [value.expect].forEach((expectedValue) => {
        it(`should have environment variable ${expectedValue.name} set to ${expectedValue.value || JSON.stringify(expectedValue.valueFrom)}`, () => {
          (env.find((val) => val.name === expectedValue.name) || []).should.be.deepEqual(expectedValue);
        });
      });
    });
  });
});
