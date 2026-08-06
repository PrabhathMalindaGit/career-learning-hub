import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import { AppError } from "../../shared/appError.js";

function requestWithGetterOnlyQuery(
  query: Record<string, unknown>,
): Request {
  const requestPrototype = {};

  Object.defineProperty(requestPrototype, "query", {
    get: () => query,
    configurable: true,
    enumerable: true,
  });

  const request = Object.create(requestPrototype) as Request;
  request.body = {};
  request.params = {};
  return request;
}

const response = {} as Response;

describe("request validation middleware", () => {
  it("defines parsed query data on a request with an inherited getter-only query", () => {
    const unvalidatedQuery = {
      limit: "10",
      filter: " owned ",
    };
    const request = requestWithGetterOnlyQuery(unvalidatedQuery);
    const next = vi.fn();
    const middleware = validate({
      query: z.object({
        page: z.coerce.number().int().default(1),
        limit: z.coerce.number().int().min(1).max(100),
        filter: z
          .string()
          .trim()
          .transform((value) => value.toUpperCase()),
      }),
    });

    expect(() => middleware(request, response, next)).not.toThrow();

    expect(request.query).toEqual({
      page: 1,
      limit: 10,
      filter: "OWNED",
    });
    expect(request.query).not.toBe(unvalidatedQuery);
    expect(Object.hasOwn(request, "query")).toBe(true);
    expect(
      Object.getOwnPropertyDescriptor(request, "query"),
    ).toMatchObject({
      configurable: true,
      enumerable: true,
      writable: true,
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("reports invalid query data through one validation AppError", () => {
    const request = requestWithGetterOnlyQuery({
      limit: "unbounded",
    });
    const next = vi.fn();

    validate({
      query: z.object({
        limit: z.coerce.number().int().min(1).max(100),
      }),
    })(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(1);
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(AppError);
    expect(next.mock.calls[0]?.[0]).toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      details: {
        query: expect.any(Object),
      },
    });
    expect(Object.hasOwn(request, "query")).toBe(false);
  });

  it("preserves successful body validation assignment", () => {
    const request = requestWithGetterOnlyQuery({});
    request.body = { displayName: "  Phase Six  " };
    const next = vi.fn();

    validate({
      body: z.object({
        displayName: z.string().trim(),
      }),
    })(request, response, next);

    expect(request.body).toEqual({
      displayName: "Phase Six",
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("preserves safe nested issue paths alongside flattened body errors", () => {
    const request = requestWithGetterOnlyQuery({});
    request.body = {
      content: {
        links: [{ url: "not-a-url" }],
      },
    };
    const next = vi.fn();

    validate({
      body: z.object({
        content: z.object({
          links: z.array(
            z.object({
              url: z.string().url("A valid URL is required."),
            }),
          ),
        }),
      }),
    })(request, response, next);

    expect(next.mock.calls[0]?.[0]).toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details: {
        body: {
          formErrors: [],
          fieldErrors: {
            content: ["A valid URL is required."],
          },
          issues: [
            {
              path: "content.links.0.url",
              message: "A valid URL is required.",
            },
          ],
        },
      },
    });
  });

  it("preserves successful parameter validation assignment", () => {
    const request = requestWithGetterOnlyQuery({});
    request.params = { version: "6" };
    const next = vi.fn();

    validate({
      params: z.object({
        version: z.coerce.number().int(),
      }),
    })(request, response, next);

    expect(request.params).toEqual({ version: 6 });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("accumulates body, parameter, and query failures before invoking next once", () => {
    const request = requestWithGetterOnlyQuery({
      page: "invalid",
    });
    request.body = { email: "invalid" };
    request.params = { id: "" };
    const next = vi.fn();

    validate({
      body: z.object({
        email: z.string().email(),
      }),
      params: z.object({
        id: z.string().min(1),
      }),
      query: z.object({
        page: z.coerce.number().int().min(1),
      }),
    })(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(1);
    expect(next.mock.calls[0]?.[0]).toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details: {
        body: expect.any(Object),
        params: expect.any(Object),
        query: expect.any(Object),
      },
    });
  });
});
