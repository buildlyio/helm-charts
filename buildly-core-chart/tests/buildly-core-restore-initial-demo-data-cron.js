'use strict';
const expectedEnvironmentVariables = require('./commons').bifrost.base.env;


describe('TolaData Chart for ActivityAPI restore initial demo data', () => {
  const loadinitialdataScriptName = 'someLoadinitialdataScriptName';

  context('Given restoreInitialDemoData enabled', () => {
    const activityapiImageRepository = 'someactivityapiimagerepository';
    const activityapiImageTag = 'someactivityapiimagetag';
    const activityapiPostgresImage = 'someactivityapipostgresimage';
    const scheduledTime = 'any';
    before(done => {
      helm
      .withValueFile('values.yaml')
      .set('bifrost.restoreInitialDemoData.enabled', 'true')
      .set('bifrost.loadinitialdataScriptName', loadinitialdataScriptName)
      .set('bifrost.image.repository', activityapiImageRepository)
      .set('bifrost.image.tag', activityapiImageTag)
      .set('bifrost.restoreInitialDemoData.schedule', scheduledTime)
      .set('bifrost.postgres.image', activityapiPostgresImage)
      .set('bifrost.additionalCorsOriginWhitelist[0]', 'some.domain')
      .set('bifrost.additionalCorsOriginWhitelist[1]', 'another.domain')
      .go(done);
    });

    context('then there is a cronjob', () => {
      let sut;
      let restoreInitialDemoDataContainer;
      let checkDbReadyInitContainer;
      let checkMigrationsReadyInitContainer;
      let restoreInitialDemoDataSchedule;
      let restartPolicy;
      let imagePullSecrets;
      let env;

      before(() => {
        sut = results.ofType('CronJob').find((value) => value.metadata.name === 'RELEASE-NAME-bifrost-restore-initial-demo-data');
        const templateSpec = sut.spec.jobTemplate.spec.template.spec;
        imagePullSecrets = sut.spec.jobTemplate.spec.template.spec.imagePullSecrets;
        restartPolicy = templateSpec.restartPolicy;
        restoreInitialDemoDataContainer = templateSpec.containers.find((value) => value.name === 'restore-initial-demo-data');
        restoreInitialDemoDataSchedule = sut.spec.schedule;
        checkDbReadyInitContainer = templateSpec.initContainers.find((value) => value.name === 'check-db-ready');
        checkMigrationsReadyInitContainer = templateSpec.initContainers.find((value) => value.name === 'check-migrations-ready');
        env = restoreInitialDemoDataContainer.env;
      });

      it('should exist', () => should.exist(sut));

      it('should have restartPolicy set to Never', () => restartPolicy.should.be.equal('Never'));

      it('should have correct image', () => {
        restoreInitialDemoDataContainer.image.should.be.equal(`${activityapiImageRepository}:${activityapiImageTag}`);
      });

      it('should have correct imagePullSecrets', () => {
        imagePullSecrets.should.be.deepEqual([{name: 'regsecret'}]);
      });

      context('Check DB ready init container', () => {
        it('should exists', () => {
          should.exist(checkDbReadyInitContainer);
        });

        it('should have correct image', () => {
          checkDbReadyInitContainer.image.should.be.equal(activityapiPostgresImage);
        });

        it('should have correct command', () => {
          checkDbReadyInitContainer.command.should.be.deepEqual([
            '/bin/sh',
            '-c',
            'until pg_isready -h RELEASE-NAME-bifrost-postgres -p 5432; do echo waiting for database; sleep 2; done;',
          ]);
        });
      });

      context('Check migrations ready init container', () => {
        before(() => {
          env = checkMigrationsReadyInitContainer.env;
        });
        it('should exists', () => {
          should.exist(checkMigrationsReadyInitContainer);
        });

        it('should have correct image', () => {
          checkMigrationsReadyInitContainer.image.should.be.equal(`${activityapiImageRepository}:${activityapiImageTag}`);
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
            (env.find((val) => val.name === expectedValue.name) || []).should.be.deepEqual(expectedValue)
          });
        });
      });

      it('should have correct command run', () => {
        restoreInitialDemoDataContainer.command.should.be.deepEqual(['/bin/sh', '-c', `python manage.py ${loadinitialdataScriptName} --restore`]);
      });

      it('should have correct scheduled time', () => {
        restoreInitialDemoDataSchedule.should.be.equal(scheduledTime);
      });

      expectedEnvironmentVariables.forEach(expectedValue => {
        it(`should have environment variable ${expectedValue.name} set to ${expectedValue.value || JSON.stringify(expectedValue.valueFrom)}`, () => {
          (env.find((val) => val.name === expectedValue.name) || []).should.be.deepEqual(expectedValue)
        });
      });
    });
  });
});
