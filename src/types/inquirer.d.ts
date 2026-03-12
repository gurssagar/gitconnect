/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
declare module 'inquirer' {
  import { PromptModule } from 'inquirer';

  export interface Question {
    type?: string;
    name: string;
    message?: string;
    default?: any;
    choices?: any[];
    validate?: (input: any) => boolean | string | Promise<boolean | string>;
    filter?: (input: any) => any;
    transformer?: (input: any) => string;
    when?: boolean | ((answers: any) => boolean | Promise<boolean>);
    pageSize?: number;
  }

  export type PromptModule = (questions: Question[]) => Promise<any>;

  const inquirer: {
    prompt: PromptModule;
    registerPrompt(name: string, prompt: any): void;
    createPromptModule(): PromptModule;
  };

  export default inquirer;
}