import { createParamDecorator } from "@nestjs/common";

export const GetGreeting = createParamDecorator(() => {
  return "Hello App";
});