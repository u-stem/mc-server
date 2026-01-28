import { describe, expect, it } from 'vitest';
import { isValidModFilename } from './mods';

describe('isValidModFilename', () => {
  describe('有効なファイル名', () => {
    it('.jarファイルを受け入れる', () => {
      expect(isValidModFilename('example-mod.jar')).toBe(true);
    });

    it('.jar.disabledファイルを受け入れる', () => {
      expect(isValidModFilename('example-mod.jar.disabled')).toBe(true);
    });

    it('ハイフンを含むファイル名を受け入れる', () => {
      expect(isValidModFilename('my-awesome-mod-1.0.jar')).toBe(true);
    });

    it('アンダースコアを含むファイル名を受け入れる', () => {
      expect(isValidModFilename('my_mod_v2.jar')).toBe(true);
    });

    it('数字を含むファイル名を受け入れる', () => {
      expect(isValidModFilename('mod123.jar')).toBe(true);
    });

    it('複数のドットを含むファイル名を受け入れる', () => {
      expect(isValidModFilename('mod.1.2.3.jar')).toBe(true);
    });
  });

  describe('無効なファイル名', () => {
    it('.jar以外の拡張子を拒否する', () => {
      expect(isValidModFilename('example.zip')).toBe(false);
      expect(isValidModFilename('example.txt')).toBe(false);
    });

    it('パストラバーサルを拒否する', () => {
      expect(isValidModFilename('../evil.jar')).toBe(false);
      expect(isValidModFilename('..\\evil.jar')).toBe(false);
      expect(isValidModFilename('path/../mod.jar')).toBe(false);
    });

    it('特殊文字を含むファイル名を拒否する', () => {
      expect(isValidModFilename('mod with space.jar')).toBe(false);
      expect(isValidModFilename('mod@special.jar')).toBe(false);
      expect(isValidModFilename('mod#hash.jar')).toBe(false);
    });

    it('空のファイル名を拒否する', () => {
      expect(isValidModFilename('')).toBe(false);
    });

    it('.jarのみのファイル名を拒否する', () => {
      expect(isValidModFilename('.jar')).toBe(false);
    });
  });
});
