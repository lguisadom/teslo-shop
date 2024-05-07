import { createParamDecorator } from "@nestjs/common";

export const GetGreeting2 = createParamDecorator(
  (data) => {
    console.log({ data });
    return `Hello ${data}`;
  }
);