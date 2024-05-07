import { createParamDecorator } from "@nestjs/common";

export const GetGreeting3 = createParamDecorator(
  (data) => {
    console.log({ data });
    return data;
  }
);