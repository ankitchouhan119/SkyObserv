// client/src/lib/ai-context.ts

let aiContext: any = {};

export const setAIContext = (ctx: any) => {
  aiContext = ctx;
};

export const getAIContext = () => aiContext;
