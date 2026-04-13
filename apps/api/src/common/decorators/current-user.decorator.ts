import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RequestWithContext } from "../request-context/request-context.types";

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithContext>();
    return request.user;
  }
);

