import { describe, expect, it } from 'vitest';
import { isValidPluginFilename } from './plugins';

describe('isValidPluginFilename', () => {
  describe('有効なファイル名', () => {
    it('.jarファイルを受け入れる', () => {
      expect(isValidPluginFilename('example-plugin.jar')).toBe(true);
    });

    it('.jar.disabledファイルを受け入れる', () => {
      expect(isValidPluginFilename('example-plugin.jar.disabled')).toBe(true);
    });

    it('ハイフンを含むファイル名を受け入れる', () => {
      expect(isValidPluginFilename('LuckPerms-Bukkit-5.4.jar')).toBe(true);
    });

    it('アンダースコアを含むファイル名を受け入れる', () => {
      expect(isValidPluginFilename('Spark_v1.10.jar')).toBe(true);
    });

    it('数字を含むファイル名を受け入れる', () => {
      expect(isValidPluginFilename('plugin123.jar')).toBe(true);
    });

    it('複数のドットを含むファイル名を受け入れる', () => {
      expect(isValidPluginFilename('plugin.1.2.3.jar')).toBe(true);
    });
  });

  describe('無効なファイル名', () => {
    it('.jar以外の拡張子を拒否する', () => {
      expect(isValidPluginFilename('example.zip')).toBe(false);
      expect(isValidPluginFilename('example.txt')).toBe(false);
    });

    it('パストラバーサルを拒否する', () => {
      expect(isValidPluginFilename('../evil.jar')).toBe(false);
      expect(isValidPluginFilename('..\\evil.jar')).toBe(false);
      expect(isValidPluginFilename('path/../plugin.jar')).toBe(false);
    });

    it('特殊文字を含むファイル名を拒否する', () => {
      expect(isValidPluginFilename('plugin with space.jar')).toBe(false);
      expect(isValidPluginFilename('plugin@special.jar')).toBe(false);
      expect(isValidPluginFilename('plugin#hash.jar')).toBe(false);
    });

    it('空のファイル名を拒否する', () => {
      expect(isValidPluginFilename('')).toBe(false);
    });

    it('.jarのみのファイル名を拒否する', () => {
      expect(isValidPluginFilename('.jar')).toBe(false);
    });
  });
});
