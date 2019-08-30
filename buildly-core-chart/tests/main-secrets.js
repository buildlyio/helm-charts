'use strict';
describe('BiFrost Chart for Main secrets', () => {
  context('No secrets defined', () => {
    before(done => {
      helm
        .withValueFile('values.yaml')
        .go(done);
    });

    context('Secret', () => {
      let sut;
      before(() => {
        sut = results.ofType('Secret').find((value) => value.metadata.name === 'RELEASE-NAME-main-secrets');
      });

      it('should be deployed', () => {
        should.exist(sut);
      });

      it('should have correct apiVersion', () => {
        sut.apiVersion.should.be.equal('v1');
      });

      context('Main secrets', () => {
        const  mandatoryKeys = [
          'bifrostPostgresPassword',
          'bifrostToken',
          'bifrostToken',
          'googleApiKey',
          'googleClientId',
          'googleOauthClientId',
          'googleOauthClientSecret',
          'oauthClientId',
          'oauthClientSecret',
          'onedriveClientId',
          'socialAuthTolaKey',
          'socialAuthTolaSecret',
        ]
        let data;

        before(() => {
          data = sut.data;
        });

        mandatoryKeys.forEach(key => {
          it(`should have key ${key}`, () => {
            should.exist(data[key]);
          });
        });
      });
    });
  })

  context('Existing secrets defined', () => {
    before(done => {
      helm
        .withValueFile('values.yaml')
        .set('secrets', 'someSecretName')
        .go(done);
    });

    context('Secret', () => {
      let sut;
      before(() => {
        sut = results.ofType('Secret').find((value) => value.metadata.name === 'RELEASE-NAME-main-secrets');
      });

      it('should not be deployed', () => {
        should.not.exist(sut);
      });
    });
  })
});
