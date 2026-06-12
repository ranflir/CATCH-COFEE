import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 모든 성공 응답을 { success: true, data } 형식으로 래핑.
 * 에러는 AllExceptionsFilter가 { success: false, error, meta } 로 처리.
 */
@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => ({ success: true, data })));
  }
}
