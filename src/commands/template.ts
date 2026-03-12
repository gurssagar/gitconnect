import chalk from 'chalk';
import inquirer from 'inquirer';
import { templateManager } from '../utils/templates';

export async function templateCommand(action: string, name?: string): Promise<void> {
  await templateManager.initDefaultTemplates();

  switch (action) {
  case 'list':
    await listTemplates();
    break;
  case 'show':
    await showTemplate(name!);
    break;
  case 'create':
    await createTemplate(name!);
    break;
  case 'delete':
    await deleteTemplate(name!);
    break;
  }
}

async function listTemplates(): Promise<void> {
  const templates = await templateManager.listTemplates();

  if (templates.length === 0) {
    console.log(chalk.yellow('No templates found.'));
    return;
  }

  console.log(chalk.cyan.bold('\n📋 Commit Templates:\n'));
  for (const name of templates) {
    console.log(`  ${chalk.green('•')} ${name}`);
  }
  console.log();
}

async function showTemplate(name: string): Promise<void> {
  const template = await templateManager.getTemplate(name);

  if (!template) {
    console.log(chalk.red(`Template '${name}' not found.`));
    return;
  }

  console.log(chalk.cyan.bold(`\n📄 Template: ${name}\n`));
  console.log(chalk.gray(template));
  console.log();
}

async function createTemplate(name: string): Promise<void> {
  const { content } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'content',
      message: 'Enter template content (use {{variable}} for placeholders):',
    },
  ]);

  await templateManager.saveTemplate(name, content);
  console.log(chalk.green(`✓ Template '${name}' created.`));
}

async function deleteTemplate(name: string): Promise<void> {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Delete template '${name}'?`,
      default: false,
    },
  ]);

  if (confirm) {
    const deleted = await templateManager.deleteTemplate(name);
    if (deleted) {
      console.log(chalk.green(`✓ Template '${name}' deleted.`));
    } else {
      console.log(chalk.red(`Failed to delete template '${name}'.`));
    }
  }
}