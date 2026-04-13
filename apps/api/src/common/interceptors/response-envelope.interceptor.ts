import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { Observable, map } from "rxjs";
import { RequestWithContext } from "../request-context/request-context.types";

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const requestId = request.requestId;

    return next.handle().pipe(
      map((response) => {
        if (
          response &&
          typeof response === "object" &&
          "data" in (response as Record<string, unknown>)
        ) {
          const current = response as { data: unknown; meta?: Record<string, unknown> };
          return {
            data: current.data,
            meta: {
              ...(current.meta ?? {}),
              requestId
            }
          };
        }

        return {
          data: response,
          meta: { requestId }
        };
      })
    );
  }
}

