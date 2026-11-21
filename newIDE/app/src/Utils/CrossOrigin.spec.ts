import {
  checkIfIsGDevelopCloudBucketUrl,
  checkIfCredentialsRequired,
  addGDevelopResourceTokenIfRequired,
} from './CrossOrigin';

describe('CrossOrigin', () => {
  describe('checkIfIsGDevelopCloudBucketUrl', () => {
    it('returns true for official cloud resource bucket URLs', () => {
      expect(
        checkIfIsGDevelopCloudBucketUrl(
          'https://project-resources.gdevelop.io/game/asset.png'
        )
      ).toBe(true);
      expect(
        checkIfIsGDevelopCloudBucketUrl(
          'https://project-resources-dev.gdevelop.io/game/asset.png'
        )
      ).toBe(true);
    });

    it('returns false for external third-party URLs', () => {
      expect(
        checkIfIsGDevelopCloudBucketUrl('https://example.com/sprite.png')
      ).toBe(false);
    });
  });

  describe('checkIfCredentialsRequired', () => {
    it('requires credentials for cloud bucket resources on desktop/web', () => {
      expect(
        checkIfCredentialsRequired(
          'https://project-resources.gdevelop.io/game/asset.png'
        )
      ).toBe(true);
      expect(checkIfCredentialsRequired('https://example.com/sprite.png')).toBe(
        false
      );
    });
  });

  describe('addGDevelopResourceTokenIfRequired', () => {
    it('returns unchanged URL on desktop/web', () => {
      const url = 'https://project-resources.gdevelop.io/game/asset.png';
      expect(addGDevelopResourceTokenIfRequired(url)).toBe(url);
    });
  });
});
