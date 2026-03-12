import { TemplateManager } from '../../src/utils/templates';

describe('TemplateManager', () => {
  let templateManager: TemplateManager;

  beforeEach(() => {
    templateManager = new TemplateManager();
  });

  describe('getDefaultTemplates', () => {
    it('should return default templates', () => {
      const defaults = templateManager.getDefaultTemplates();
      expect(defaults).toHaveProperty('conventional');
      expect(defaults).toHaveProperty('simple');
      expect(defaults).toHaveProperty('detailed');
    });

    it('should have variable placeholders in templates', () => {
      const defaults = templateManager.getDefaultTemplates();
      expect(defaults.conventional).toContain('{{type}}');
      expect(defaults.conventional).toContain('{{scope}}');
      expect(defaults.conventional).toContain('{{description}}');
    });
  });

  describe('applyVariables', () => {
    it('should replace single variable', () => {
      const template = 'Hello {{name}}!';
      const result = templateManager.applyVariables(template, { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should replace multiple variables', () => {
      const template = '{{type}}({{scope}}): {{description}}';
      const result = templateManager.applyVariables(template, {
        type: 'feat',
        scope: 'auth',
        description: 'add login',
      });
      expect(result).toBe('feat(auth): add login');
    });

    it('should handle whitespace in variables', () => {
      const template = 'Hello {{  name  }}!';
      const result = templateManager.applyVariables(template, { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should not replace missing variables', () => {
      const template = 'Hello {{name}}! Your ID is {{id}}.';
      const result = templateManager.applyVariables(template, { name: 'World' });
      expect(result).toBe('Hello World! Your ID is {{id}}.');
    });

    it('should handle multiple occurrences of same variable', () => {
      const template = '{{name}} says {{name}}';
      const result = templateManager.applyVariables(template, { name: 'Alice' });
      expect(result).toBe('Alice says Alice');
    });
  });
});