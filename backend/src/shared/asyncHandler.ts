import type { NextFunction, Request, RequestHandler, Response } from "express";

type DefaultParams = Request["params"];

type AsyncRequestHandler<Params = DefaultParams> = (
  request: Request<Params>,
  response: Response,
  next: NextFunction,
) => Promise<unknown>;

export function asyncHandler<Params = DefaultParams>(
  handler: AsyncRequestHandler<Params>,
): RequestHandler<Params> {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
