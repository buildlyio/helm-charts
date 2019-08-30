'use strict';
const expectedEnvironmentVariables = require('./commons').buildly.base.env;
const buildlyHost = require('./commons').buildly.base.host;
const {
  baseIngress,
  baseService,
} = require('./commons');


describe('buildly Chart', () => {
  const buildlyImageRepository = 'somebuildlyimagerepository';
  const buildlyImageTag = 'somebuildlyimagetag';
  const numberOrReplicas = 100;

  before(done => {
    helm
    .withValueFile('values.yaml')
    .set('buildly.image.repository', buildlyImageRepository)
    .set('buildly.image.tag', buildlyImageTag)
    .set('buildly.createDefaultProgram', true)
    .set('buildly.additionalCorsOriginWhitelist[0]', 'some.domain')
    .set('buildly.additionalCorsOriginWhitelist[1]', 'another.domain')
    .set('buildly.host', buildlyHost)
    .set('buildly.replicaCount', numberOrReplicas)
    .go(done);
  });

  baseService('RELEASE-NAME', 'buildly');

  baseIngress('RELEASE-NAME', 'buildly', buildlyHost);

  context('Deployments', () => {
    let sut;
    before(() => {
      sut = results.ofType('Deployment').find((value) => value.metadata.name === 'RELEASE-NAME-buildly');
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
          checkMigrationsReadyInitContainer.image.should.be.equal(`${buildlyImageRepository}:${buildlyImageTag}`);
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

    context('buildly container', () => {
      let buildlyContainer;
      before(() => {
        buildlyContainer = sut.spec.template.spec.containers.find(val => val.name === 'buildly');
      });

      it('should exist', () => {
        should.exist(buildlyContainer);
      });

      context('Environment variables', () => {
        let env;
        before(() => {
          env = buildlyContainer.env;
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
          livenessProbe = buildlyContainer.livenessProbe;
        });

        it('should have correct parameters', () => {
          livenessProbe.should.be.deepEqual({
            httpGet: {
              path: '/health_check/',
              port: 8080,
              httpHeaders: [{
                name: 'Host',
                value: buildlyHost,
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
          command = buildlyContainer.command.join(' ');
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
  describe(`buildly Chart when setProgramAdminDefault is set to '${value.given.setProgramAdminDefault}'`, () => {
    before(done => {
      helm
      .withValueFile('values.yaml')
      .set('buildly.setProgramAdminDefault', value.given.setProgramAdminDefault)
      .go(done);
    });

    context('buildly container', () => {
      let env;
      before(() => {
        env = results.ofType('Deployment')
          .find((value) => value.metadata.name === 'RELEASE-NAME-buildly')
          .spec.template.spec.containers
          .find(val => val.name === 'buildly').env;
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
  describe(`buildly Chart when createDefaultProgram is set to '${value.given.createDefaultProgram}'`, () => {
    before(done => {
      helm
      .withValueFile('values.yaml')
      .set('buildly.createDefaultProgram', value.given.createDefaultProgram)
      .go(done);
    });

    context('buildly container', () => {
      let env;
      before(() => {
        env = results.ofType('Deployment')
          .find((value) => value.metadata.name === 'RELEASE-NAME-buildly')
          .spec.template.spec.containers
          .find(val => val.name === 'buildly').env;
      });
      [value.expect].forEach((expectedValue) => {
        it(`should have environment variable ${expectedValue.name} set to ${expectedValue.value || JSON.stringify(expectedValue.valueFrom)}`, () => {
          (env.find((val) => val.name === expectedValue.name) || []).should.be.deepEqual(expectedValue);
        });
      });
    });
  });
});
